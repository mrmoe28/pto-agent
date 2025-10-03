import { db } from './db';
import { userSubscriptions } from './db/schema';
import { eq } from 'drizzle-orm';
import { PLAN_LIMITS, type PlanType, type PlanLimits } from './subscription-types';

// Admin email (update this with your actual email)
const ADMIN_EMAIL = 'edwardsteel.0@gmail.com';

// Admin user IDs (as backup in case email detection fails)
const ADMIN_USER_IDS: string[] = [];

// Check if user is admin
function isAdminUser(user: {
  id?: string;
  email?: string | null;
}): boolean {
  const userEmail = user.email;

  // Normalize emails for comparison (lowercase, trim)
  const normalizedUserEmail = userEmail?.toLowerCase().trim();
  const normalizedAdminEmail = ADMIN_EMAIL.toLowerCase().trim();

  console.log('[Admin Check]', {
    userId: user.id,
    userEmail,
    normalizedUserEmail,
    adminEmail: ADMIN_EMAIL,
    normalizedAdminEmail,
    primaryEmailMatch: normalizedUserEmail === normalizedAdminEmail,
    userIdMatch: user.id ? ADMIN_USER_IDS.includes(user.id) : false
  });

  // Check by user ID first (most reliable)
  if (user.id && ADMIN_USER_IDS.includes(user.id)) {
    console.log('[Admin Check] ✅ Matched by user ID');
    return true;
  }

  // Check primary email (normalized)
  if (normalizedUserEmail === normalizedAdminEmail) {
    console.log('[Admin Check] ✅ Matched by primary email');
    return true;
  }

  console.log('[Admin Check] ❌ No match found');
  return false;
}

// Get user's subscription plan from Auth.js session (server-side only)
export async function getUserPlanFromAuth(): Promise<PlanType> {
  try {
    // This function should only be called from server components or API routes
    // For client components, use the subscription check API instead
    const { auth } = await import('@/auth');
    const session = await auth();
    if (!session?.user) return 'free';

    const user = session.user;

    // Check if user is admin first
    if (isAdminUser(user)) {
      return 'admin';
    }

    // Check if user has subscription metadata
    const subscriptionPlan = user?.subscriptionPlan as PlanType | undefined;

    // If metadata exists, use it
    if (subscriptionPlan) {
      return subscriptionPlan;
    }

    // Fallback: Check database for subscription plan
    try {
      const subscription = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, user.id!))
        .limit(1);

      if (subscription[0] && subscription[0].plan !== 'free') {
        console.log('[getUserPlanFromAuth] Using database fallback:', {
          userId: user.id,
          plan: subscription[0].plan
        });
        return subscription[0].plan as PlanType;
      }
    } catch (dbError) {
      console.error('Error checking database for subscription plan:', dbError);
    }

    return 'free';
  } catch (error) {
    console.error('Error getting user plan from Auth.js:', error);
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
    const plan = await getUserPlanFromAuth();
    const { searchesUsed } = await getUserSearchUsage(userId);
    const limits = PLAN_LIMITS[plan];

    const canSearch = limits.searchesLimit === null || searchesUsed < limits.searchesLimit;
    const remaining = limits.searchesLimit === null ? null : Math.max(0, limits.searchesLimit - searchesUsed);

    console.log('[canUserSearch]', {
      userId,
      plan,
      searchesUsed,
      searchesLimit: limits.searchesLimit,
      canSearch,
      remaining
    });

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
    const { canSearch, usage, plan } = await canUserSearch(userId);

    console.log('[incrementSearchUsage]', {
      userId,
      plan,
      canSearch,
      usage
    });

    if (!canSearch) {
      console.log('[incrementSearchUsage] User cannot search - limit reached');
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

    console.log('[incrementSearchUsage] Search usage incremented successfully');

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

// Check if user can access a specific feature
export function canUserAccessFeature(userPlan: PlanType, feature: keyof PlanLimits): boolean {
  const limits = PLAN_LIMITS[userPlan];
  return limits[feature] === true;
}

// Get remaining searches for a user
export function getRemainingSearches(userPlan: PlanType, searchesUsed: number): number | null {
  const limits = PLAN_LIMITS[userPlan];
  if (limits.searchesLimit === null) {
    return null; // unlimited
  }
  return Math.max(0, limits.searchesLimit - searchesUsed);
}

