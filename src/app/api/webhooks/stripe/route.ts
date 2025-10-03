import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { userSubscriptions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key');

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Configure route to handle raw body for webhook signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Get the raw body as text (this preserves the exact format needed for signature verification)
  const rawBody = await request.text();

  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('❌ Missing Stripe signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('✅ Stripe webhook received:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  
  console.log('🛒 Checkout completed:', { customerId, subscriptionId });

  if (!customerId || !subscriptionId) {
    console.error('❌ Missing customer or subscription ID');
    return;
  }

  // Get the subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  
  if (!priceId) {
    console.error('❌ No price ID found in subscription');
    return;
  }

  // Determine plan based on price ID
  const plan = getPlanFromPriceId(priceId);
  if (!plan) {
    console.error('❌ Unknown price ID:', priceId);
    return;
  }

  // Get customer email to find user
  const customer = await stripe.customers.retrieve(customerId);
  if (!customer || customer.deleted) {
    console.error('❌ Customer not found or deleted');
    return;
  }

  const customerEmail = customer.email;
  if (!customerEmail) {
    console.error('❌ No email found for customer');
    return;
  }

  // Find user by email in database
  const user = await db.query.users.findFirst({
    where: eq(users.email, customerEmail),
  });

  if (!user) {
    console.error('❌ No user found with email:', customerEmail);
    return;
  }

  console.log('👤 Found user:', { userId: user.id, email: customerEmail });

  // Update database
  const searchesLimit = plan === 'pro' ? 40 : null; // enterprise has unlimited

  await db
    .update(userSubscriptions)
    .set({
      plan,
      searchesLimit,
      status: 'active',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.userId, user.id));

  console.log('✅ Subscription updated:', {
    userId: user.id,
    plan,
    searchesLimit,
    customerId,
    subscriptionId,
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Type assertion: subscription is expandable and can be string | Subscription | null
  // @ts-expect-error - subscription exists on Invoice but may not be in type definition
  const invoiceSubscription = invoice.subscription as string | Stripe.Subscription | null;
  const subscriptionId = typeof invoiceSubscription === 'string'
    ? invoiceSubscription
    : invoiceSubscription?.id;

  if (!subscriptionId) {
    console.log('ℹ️ No subscription ID in invoice, skipping');
    return;
  }

  console.log('💳 Payment succeeded for subscription:', subscriptionId);

  // Get subscription details
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
  // @ts-expect-error - Stripe response wrapping may vary
  const subscription = subscriptionResponse.data || subscriptionResponse;
  const priceId = subscription.items.data[0]?.price.id;
  
  if (!priceId) {
    console.error('❌ No price ID found in subscription');
    return;
  }

  const plan = getPlanFromPriceId(priceId);
  if (!plan) {
    console.error('❌ Unknown price ID:', priceId);
    return;
  }

  // Find user by subscription ID in database
  const userSubscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.stripeSubscriptionId, subscriptionId),
  });

  if (!userSubscription) {
    console.error('❌ No user found with subscription ID:', subscriptionId);
    return;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userSubscription.userId),
  });

  if (!user) {
    console.error('❌ No user found with ID:', userSubscription.userId);
    return;
  }

  // Update database to reset usage for new billing period
  await db
    .update(userSubscriptions)
    .set({
      searchesUsed: 0,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.userId, user.id));

  console.log('✅ Payment processed, usage reset:', {
    userId: user.id,
    plan,
    subscriptionId,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;
  const priceId = subscription.items.data[0]?.price.id;
  
  if (!priceId) {
    console.error('❌ No price ID found in subscription');
    return;
  }

  const plan = getPlanFromPriceId(priceId);
  if (!plan) {
    console.error('❌ Unknown price ID:', priceId);
    return;
  }

  // Find user by subscription ID in database
  const userSubscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.stripeSubscriptionId, subscriptionId),
  });

  if (!userSubscription) {
    console.error('❌ No user found with subscription ID:', subscriptionId);
    return;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userSubscription.userId),
  });

  if (!user) {
    console.error('❌ No user found with ID:', userSubscription.userId);
    return;
  }

  // Update database
  const searchesLimit = plan === 'pro' ? 40 : null; // enterprise has unlimited
  
  await db
    .update(userSubscriptions)
    .set({
      plan,
      searchesLimit,
      status: subscription.status === 'active' ? 'active' : 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.userId, user.id));

  console.log('✅ Subscription updated:', {
    userId: user.id,
    plan,
    status: subscription.status,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;

  // Find user by subscription ID in database
  const userSubscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.stripeSubscriptionId, subscriptionId),
  });

  if (!userSubscription) {
    console.error('❌ No user found with subscription ID:', subscriptionId);
    return;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userSubscription.userId),
  });

  if (!user) {
    console.error('❌ No user found with ID:', userSubscription.userId);
    return;
  }

  // Update database
  await db
    .update(userSubscriptions)
    .set({
      plan: 'free',
      searchesLimit: 1,
      status: 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.userId, user.id));

  console.log('✅ Subscription cancelled, downgraded to free:', {
    userId: user.id,
    subscriptionId,
  });
}

function getPlanFromPriceId(priceId: string): 'pro' | 'enterprise' | null {
  // Use environment variables for price IDs
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
  const enterprisePriceId = process.env.STRIPE_ENTERPRISE_PRICE_ID;

  if (priceId === proPriceId) return 'pro';
  if (priceId === enterprisePriceId) return 'enterprise';

  return null;
}
