import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { userSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cancelSquareSubscription } from '@/lib/square/subscriptions';
import { handleSquareError } from '@/lib/square/errors';

export async function POST() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user's subscription
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No subscription found' },
        { status: 404 }
      );
    }

    if (!subscription.squareSubscriptionId) {
      return NextResponse.json(
        { success: false, error: 'No active Square subscription' },
        { status: 400 }
      );
    }

    // Cancel subscription in Square
    const canceledSubscription = await cancelSquareSubscription(
      subscription.squareSubscriptionId,
      userId
    );

    return NextResponse.json({
      success: true,
      message: 'Subscription canceled successfully',
      subscription: canceledSubscription ? {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
      } : null,
    });
  } catch (error) {
    console.error('[API] Error canceling subscription:', error);

    const errorMessage = handleSquareError(error);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
}
