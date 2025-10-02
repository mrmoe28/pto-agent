import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { type PlanType } from '@/lib/subscription-types';

// Admin email (update this with your actual email)
const ADMIN_EMAIL = 'edwardsteel.0@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const { userId: currentUserId } = await auth();
    
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is admin
    const client = await clerkClient();
    const currentUser = await client.users.getUser(currentUserId);
    const primaryEmail = currentUser.emailAddresses.find(
      (email) => email.id === currentUser.primaryEmailAddressId
    );

    if (primaryEmail?.emailAddress !== ADMIN_EMAIL) {
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
    const targetUser = await client.users.getUser(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update Clerk metadata
    await client.users.updateUserMetadata(targetUserId, {
      publicMetadata: {
        ...targetUser.publicMetadata,
        subscriptionPlan: plan,
      },
    });

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
    const { userId: currentUserId } = await auth();
    
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is admin
    const client = await clerkClient();
    const currentUser = await client.users.getUser(currentUserId);
    const primaryEmail = currentUser.emailAddresses.find(
      (email) => email.id === currentUser.primaryEmailAddressId
    );

    if (primaryEmail?.emailAddress !== ADMIN_EMAIL) {
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
    const targetUser = await client.users.getUser(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get subscription from database
    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, targetUserId))
      .limit(1);

    const clerkPlan = targetUser.publicMetadata?.subscriptionPlan as PlanType;
    const dbPlan = subscription[0]?.plan as PlanType;

    return NextResponse.json({
      userId: targetUserId,
      email: targetUser.emailAddresses.find(e => e.id === targetUser.primaryEmailAddressId)?.emailAddress,
      clerkPlan: clerkPlan || 'free',
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
