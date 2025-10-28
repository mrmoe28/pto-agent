import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/client';
import { updateUserSubscriptionFromStripe } from '@/lib/stripe/subscriptions';
import { db } from '@/lib/db';
import { userSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature')!;

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    console.log('[Stripe Webhook] Event received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error('[Stripe Webhook] No userId in session metadata');
          break;
        }

        console.log(`[Stripe Webhook] Checkout completed for user ${userId}`);

        // Get the subscription
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          await updateUserSubscriptionFromStripe(userId, subscription);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer as string);

        if (customer.deleted) {
          console.error('[Stripe Webhook] Customer was deleted');
          break;
        }

        const userId = customer.metadata?.userId;

        if (!userId) {
          console.error('[Stripe Webhook] No userId in customer metadata');
          break;
        }

        console.log(`[Stripe Webhook] Subscription ${event.type} for user ${userId}`);

        await updateUserSubscriptionFromStripe(userId, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer as string);

        if (customer.deleted) {
          console.error('[Stripe Webhook] Customer was deleted');
          break;
        }

        const userId = customer.metadata?.userId;

        if (!userId) {
          console.error('[Stripe Webhook] No userId in customer metadata');
          break;
        }

        console.log(`[Stripe Webhook] Subscription deleted for user ${userId}`);

        // Update user subscription to cancelled/expired
        await db
          .update(userSubscriptions)
          .set({
            status: 'cancelled',
            canceledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.userId, userId));
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('[Stripe Webhook] Invoice payment succeeded:', invoice.id);
        // Payment successful - subscription will be updated via subscription.updated event
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.error('[Stripe Webhook] Invoice payment failed:', invoice.id);
        // Could send an email to the user here
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}
