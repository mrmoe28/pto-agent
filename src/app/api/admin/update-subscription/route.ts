import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { userSubscriptions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { type PlanType } from '@/lib/subscription-types';

// Admin email (update this with your actual email)
const ADMIN_EMAIL = 'edwardsteel.0@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const currentUserEmail = session.user.email;

    // Check if current user is admin
    if (currentUserEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { targetUserId, plan } = await request.json();

    if (!targetUserId || !plan) {
      return NextResponse.json({
        error: 'Missing required fields: targetUserId and plan'
      }, { status: 400 });
    }

    if (!['free', 'pro', 'enterprise', 'admin'].includes(plan)) {
      return NextResponse.json({
        error: 'Invalid plan. Must be: free, pro, enterprise, or admin'
      }, { status: 400 });
    }

    // Get target user
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update database
    const searchesLimit = plan === 'free' ? 1 : plan === 'pro' ? 40 : null;
    
    await db
      .update(userSubscriptions)
      .set({
        plan,
        searchesLimit,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, targetUserId));

    console.log('✅ Admin updated subscription:', {
      targetUserId,
      plan,
      searchesLimit,
      adminUserId: currentUserId,
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUserId} updated to ${plan} plan`,
      plan,
      searchesLimit,
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserEmail = session.user.email;

    // Check if current user is admin
    if (currentUserEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({
        error: 'Missing userId parameter'
      }, { status: 400 });
    }

    // Get user details
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get subscription from database
    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, targetUserId))
      .limit(1);

    const dbPlan = subscription[0]?.plan as PlanType;

    return NextResponse.json({
      userId: targetUserId,
      email: targetUser.email,
      dbPlan: dbPlan || 'free',
      searchesUsed: subscription[0]?.searchesUsed || 0,
      searchesLimit: subscription[0]?.searchesLimit || 1,
      status: subscription[0]?.status || 'active',
      lastUpdated: subscription[0]?.updatedAt,
    });

  } catch (error) {
    console.error('Error getting subscription info:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
