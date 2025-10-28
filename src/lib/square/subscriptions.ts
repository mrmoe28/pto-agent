import { squareClient, locationId } from './client';
import { db } from '../db';
import { userSubscriptions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { PLAN_LIMITS, type PlanType } from '../subscription-types';
import { randomUUID } from 'crypto';

// Square Subscription Plan IDs (set these in your Square Dashboard)
export const SQUARE_PLAN_IDS = {
  pro: process.env.SQUARE_PRO_PLAN_ID || '',
  enterprise: process.env.SQUARE_ENTERPRISE_PLAN_ID || '',
} as const;

/**
 * Create a Square subscription for a user
 */
export async function createSquareSubscription(data: {
  customerId: string;
  userId: string;
  planId: string;
  cardId: string;
  plan: 'pro' | 'enterprise';
}) {
  try {
    const startDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const { result } = await squareClient.subscriptionsApi.createSubscription({
      locationId,
      planVariationId: data.planId,
      customerId: data.customerId,
      cardId: data.cardId,
      startDate,
      timezone: 'America/New_York',
    });

    const subscription = result.subscription!;
    const planLimits = PLAN_LIMITS[data.plan];

    // Update user subscription in database
    await db
      .update(userSubscriptions)
      .set({
        plan: data.plan,
        status: 'active',
        squareSubscriptionId: subscription.id!,
        squareCardId: data.cardId,
        currentPeriodStart: new Date(subscription.startDate!),
        currentPeriodEnd: new Date(subscription.chargedThroughDate || subscription.startDate!),
        searchesLimit: planLimits.searchesLimit,
        searchesUsed: 0, // Reset usage on new subscription
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, data.userId));

    return subscription;
  } catch (error) {
    console.error('[Square] Error creating subscription:', error);
    throw error;
  }
}

/**
 * Cancel a Square subscription
 */
export async function cancelSquareSubscription(subscriptionId: string, userId: string) {
  try {
    const { result } = await squareClient.subscriptionsApi.cancelSubscription(subscriptionId);

    // Update user subscription in database
    await db
      .update(userSubscriptions)
      .set({
        status: 'cancelled',
        canceledAt: new Date(),
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, userId));

    return result.subscription;
  } catch (error) {
    console.error('[Square] Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Resume a canceled Square subscription
 */
export async function resumeSquareSubscription(subscriptionId: string, userId: string) {
  try {
    const { result } = await squareClient.subscriptionsApi.resumeSubscription(subscriptionId);

    // Update user subscription in database
    await db
      .update(userSubscriptions)
      .set({
        status: 'active',
        cancelAtPeriodEnd: false,
        canceledAt: null,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, userId));

    return result.subscription;
  } catch (error) {
    console.error('[Square] Error resuming subscription:', error);
    throw error;
  }
}

/**
 * Update subscription payment method
 */
export async function updateSubscriptionCard(
  subscriptionId: string,
  userId: string,
  newCardId: string
) {
  try {
    const { result } = await squareClient.subscriptionsApi.updateSubscription(subscriptionId, {
      subscription: {
        cardId: newCardId,
      },
    });

    // Update user subscription in database
    await db
      .update(userSubscriptions)
      .set({
        squareCardId: newCardId,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, userId));

    return result.subscription;
  } catch (error) {
    console.error('[Square] Error updating subscription card:', error);
    throw error;
  }
}

/**
 * Get subscription details from Square
 */
export async function getSquareSubscription(subscriptionId: string) {
  try {
    const { result } = await squareClient.subscriptionsApi.retrieveSubscription(subscriptionId);
    return result.subscription;
  } catch (error) {
    console.error('[Square] Error retrieving subscription:', error);
    throw error;
  }
}

/**
 * Change subscription plan (upgrade/downgrade)
 */
export async function changeSubscriptionPlan(
  userId: string,
  currentSubscriptionId: string,
  newPlan: 'pro' | 'enterprise',
  customerId: string,
  cardId: string
) {
  try {
    // Cancel current subscription
    await cancelSquareSubscription(currentSubscriptionId, userId);

    // Create new subscription with new plan
    const newPlanId = SQUARE_PLAN_IDS[newPlan];
    const subscription = await createSquareSubscription({
      customerId,
      userId,
      planId: newPlanId,
      cardId,
      plan: newPlan,
    });

    return subscription;
  } catch (error) {
    console.error('[Square] Error changing subscription plan:', error);
    throw error;
  }
}

/**
 * Save card on file for customer
 */
export async function saveSquareCard(sourceId: string, customerId: string, userId: string) {
  try {
    const { result } = await squareClient.cardsApi.createCard({
      idempotencyKey: randomUUID(),
      sourceId,
      card: {
        customerId,
      },
    });

    const card = result.card!;

    // Update user subscription with card ID
    await db
      .update(userSubscriptions)
      .set({
        squareCardId: card.id,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, userId));

    return card;
  } catch (error) {
    console.error('[Square] Error saving card:', error);
    throw error;
  }
}

/**
 * Get customer's saved cards
 */
export async function getCustomerCards(customerId: string) {
  try {
    const { result } = await squareClient.cardsApi.listCards(undefined, customerId);
    return result.cards || [];
  } catch (error) {
    console.error('[Square] Error listing cards:', error);
    throw error;
  }
}
