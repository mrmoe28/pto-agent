import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canUserAccessFeature, getUserPlanFromAuth } from '@/lib/subscription-utils';
import { db, teamMembers } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    teamId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { teamId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if user has Enterprise plan access
  const userPlan = await getUserPlanFromAuth();
  const hasAccess = canUserAccessFeature(userPlan, 'hasTeamCollaboration');
  if (!hasAccess) {
    return NextResponse.json({ 
      error: 'Team collaboration requires Enterprise plan',
      code: 'UPGRADE_REQUIRED'
    }, { status: 403 });
  }

  try {
    // Check if user is a member of the team
    const membership = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId),
          eq(teamMembers.status, 'active')
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ 
        error: 'Not a member of this team' 
      }, { status: 403 });
    }

    // Get all team members
    const members = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.status, 'active')
        )
      );

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch team members' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { teamId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if user has Enterprise plan access
  const userPlan = await getUserPlanFromAuth();
  const hasAccess = canUserAccessFeature(userPlan, 'hasTeamCollaboration');
  if (!hasAccess) {
    return NextResponse.json({ 
      error: 'Team collaboration requires Enterprise plan',
      code: 'UPGRADE_REQUIRED'
    }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const memberId = url.searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ 
        error: 'Member ID is required' 
      }, { status: 400 });
    }

    // Check if user is an admin or owner of the team
    const membership = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId),
          eq(teamMembers.status, 'active')
        )
      )
      .limit(1);

    if (membership.length === 0 || !['owner', 'admin'].includes(membership[0].role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to remove members' 
      }, { status: 403 });
    }

    // Check if trying to remove the owner
    const targetMember = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, memberId),
          eq(teamMembers.status, 'active')
        )
      )
      .limit(1);

    if (targetMember.length === 0) {
      return NextResponse.json({ 
        error: 'Member not found' 
      }, { status: 404 });
    }

    if (targetMember[0].role === 'owner') {
      return NextResponse.json({ 
        error: 'Cannot remove team owner' 
      }, { status: 400 });
    }

    // Remove member
    await db
      .update(teamMembers)
      .set({ 
        status: 'inactive',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, memberId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json({ 
      error: 'Failed to remove team member' 
    }, { status: 500 });
  }
}
