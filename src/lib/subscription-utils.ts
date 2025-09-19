import { currentUser } from '@clerk/nextjs/server';
import { db } from './db';
import { userSubscriptions, type UserSubscription } from './db/schema';
import { eq } from 'drizzle-orm';
import { PLAN_LIMITS, type PlanType, type PlanLimits } from './subscription-types';

// Get user's subscription plan from Clerk metadata
export async function getUserPlanFromClerk(): Promise<PlanType> {
  try {
    const user = await currentUser();
    if (!user) return 'free';

    // Check if user has subscription metadata from Clerk
    const subscriptionPlan = user.publicMetadata?.subscriptionPlan as PlanType;
    return subscriptionPlan || 'free';
  } catch (error) {
    console.error('Error getting user plan from Clerk:', error);
    return 'free';
  }
}

// Get user's search usage from our database (we still need this for tracking)
export async function getUserSearchUsage(userId: string): Promise<{ searchesUsed: number; lastReset: Date }> {
  try {
    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .limit(1);

    if (subscription[0]) {
      return {
        searchesUsed: subscription[0].searchesUsed || 0,
        lastReset: subscription[0].currentPeriodStart || new Date(),
      };
    }

    // Create new usage record if it doesn't exist
    const [newSubscription] = await db
      .insert(userSubscriptions)
      .values({
        userId,
        plan: 'free',
        searchesUsed: 0,
        searchesLimit: 1,
        currentPeriodStart: new Date(),
      })
      .returning();

    return {
      searchesUsed: newSubscription.searchesUsed || 0,
      lastReset: newSubscription.currentPeriodStart || new Date(),
    };
  } catch (error) {
    console.error('Error getting user search usage:', error);
    return { searchesUsed: 0, lastReset: new Date() };
  }
}

// Check if user can perform a search based on their plan and usage
export async function canUserSearch(userId: string): Promise<{
  canSearch: boolean;
  plan: PlanType;
  usage: { used: number; limit: number | null; remaining: number | null }
}> {
  try {
    const plan = await getUserPlanFromClerk();
    const { searchesUsed } = await getUserSearchUsage(userId);
    const limits = PLAN_LIMITS[plan];

    const canSearch = limits.searchesLimit === null || searchesUsed < limits.searchesLimit;
    const remaining = limits.searchesLimit === null ? null : Math.max(0, limits.searchesLimit - searchesUsed);

    return {
      canSearch,
      plan,
      usage: {
        used: searchesUsed,
        limit: limits.searchesLimit,
        remaining,
      },
    };
  } catch (error) {
    console.error('Error checking user search capability:', error);
    return {
      canSearch: false,
      plan: 'free',
      usage: { used: 0, limit: 1, remaining: 0 },
    };
  }
}

// Increment search usage for a user
export async function incrementSearchUsage(userId: string): Promise<{
  success: boolean;
  canSearch: boolean;
  usage: { used: number; limit: number | null; remaining: number | null }
}> {
  try {
    const { canSearch, plan, usage } = await canUserSearch(userId);

    if (!canSearch) {
      return {
        success: false,
        canSearch: false,
        usage,
      };
    }

    // Update search usage in database
    await db
      .update(userSubscriptions)
      .set({
        searchesUsed: usage.used + 1,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, userId));

    return {
      success: true,
      canSearch: true,
      usage: {
        used: usage.used + 1,
        limit: usage.limit,
        remaining: usage.remaining !== null ? Math.max(0, usage.remaining - 1) : null,
      },
    };
  } catch (error) {
    console.error('Error incrementing search usage:', error);
    return {
      success: false,
      canSearch: false,
      usage: { used: 0, limit: 1, remaining: 0 },
    };
  }
}

// Reset monthly usage (called by a cron job or webhook)
export async function resetMonthlyUsage(userId: string): Promise<void> {
  try {
    await db
      .update(userSubscriptions)
      .set({
        searchesUsed: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, userId));
  } catch (error) {
    console.error('Error resetting monthly usage:', error);
  }
}

