import Stripe from 'stripe';
import { stripe, STRIPE_PRICE_IDS } from './client';
import { db } from '../db';
import { userSubscriptions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { PLAN_LIMITS } from '../subscription-types';

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession(data: {
  customerId: string;
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: data.customerId,
      line_items: [
        {
          price: data.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      metadata: {
        userId: data.userId,
      },
    });

    return session;
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Cancel a Stripe subscription
 */
export async function cancelStripeSubscription(subscriptionId: string, userId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update user subscription in database
    await db
      .update(userSubscriptions)
      .set({
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, userId));

    return subscription;
  } catch (error) {
    console.error('[Stripe] Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Reactivate a canceled Stripe subscription
 */
export async function reactivateStripeSubscription(subscriptionId: string, userId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    // Update user subscription in database
    await db
      .update(userSubscriptions)
      .set({
        cancelAtPeriodEnd: false,
        canceledAt: null,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, userId));

    return subscription;
  } catch (error) {
    console.error('[Stripe] Error reactivating subscription:', error);
    throw error;
  }
}

/**
 * Get subscription details from Stripe
 */
export async function getStripeSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('[Stripe] Error retrieving subscription:', error);
    throw error;
  }
}

/**
 * Update user subscription in database from Stripe subscription
 */
export async function updateUserSubscriptionFromStripe(
  userId: string,
  stripeSubscription: Stripe.Subscription
) {
  try {
    const plan = stripeSubscription.items.data[0].price.id === STRIPE_PRICE_IDS.pro
      ? 'pro'
      : 'enterprise';

    const planLimits = PLAN_LIMITS[plan];

    // Access period dates - Stripe SDK types vary across versions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionData = stripeSubscription as any;
    const startDate = subscriptionData.current_period_start || subscriptionData.currentPeriodStart;
    const endDate = subscriptionData.current_period_end || subscriptionData.currentPeriodEnd;

    await db
      .update(userSubscriptions)
      .set({
        plan,
        status: stripeSubscription.status === 'active' ? 'active' : 'cancelled',
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(startDate * 1000),
        currentPeriodEnd: new Date(endDate * 1000),
        searchesLimit: planLimits.searchesLimit,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, userId));
  } catch (error) {
    console.error('[Stripe] Error updating user subscription:', error);
    throw error;
  }
}
