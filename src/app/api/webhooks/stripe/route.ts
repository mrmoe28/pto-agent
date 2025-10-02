import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('❌ Missing Stripe signature');
    return new Response('Missing signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
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

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return new Response('Webhook processing failed', { status: 500 });
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

  // Find user by email in Clerk
  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({
    emailAddress: [customerEmail],
  });

  if (users.length === 0) {
    console.error('❌ No user found with email:', customerEmail);
    return;
  }

  const user = users[0];
  console.log('👤 Found user:', { userId: user.id, email: customerEmail });

  // Update Clerk metadata
  await client.users.updateUserMetadata(user.id, {
    publicMetadata: {
      subscriptionPlan: plan,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    },
  });

  // Update database
  const searchesLimit = plan === 'pro' ? 40 : null; // enterprise has unlimited
  
  await db
    .update(userSubscriptions)
    .set({
      plan,
      searchesLimit,
      status: 'active',
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
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
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

  // Find user by subscription ID in Clerk metadata
  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({
    limit: 100, // Adjust as needed
  });

  const user = users.find(u =>
    u.publicMetadata?.stripeSubscriptionId === subscriptionId
  );

  if (!user) {
    console.error('❌ No user found with subscription ID:', subscriptionId);
    return;
  }

  // Update database to reset usage for new billing period
  await db
    .update(userSubscriptions)
    .set({
      searchesUsed: 0,
      currentPeriodStart: new Date(),
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

  // Find user by subscription ID
  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({
    limit: 100,
  });

  const user = users.find(u =>
    u.publicMetadata?.stripeSubscriptionId === subscriptionId
  );

  if (!user) {
    console.error('❌ No user found with subscription ID:', subscriptionId);
    return;
  }

  // Update Clerk metadata
  await client.users.updateUserMetadata(user.id, {
    publicMetadata: {
      ...user.publicMetadata,
      subscriptionPlan: plan,
    },
  });

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

  // Find user by subscription ID
  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({
    limit: 100,
  });

  const user = users.find(u =>
    u.publicMetadata?.stripeSubscriptionId === subscriptionId
  );

  if (!user) {
    console.error('❌ No user found with subscription ID:', subscriptionId);
    return;
  }

  // Downgrade to free plan
  await client.users.updateUserMetadata(user.id, {
    publicMetadata: {
      ...user.publicMetadata,
      subscriptionPlan: 'free',
    },
  });

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
