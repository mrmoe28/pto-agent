import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canUserAccessFeature, getUserPlanFromAuth } from '@/lib/subscription-utils';
import { db, teamMembers, teamInvitations } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';

interface RouteParams {
  params: Promise<{
    teamId: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
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

    // Get team invitations
    const invitations = await db
      .select()
      .from(teamInvitations)
      .where(eq(teamInvitations.teamId, teamId));

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching team invitations:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch team invitations' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const body = await request.json();
    const { email, role = 'member' } = body as {
      email: string;
      role?: 'admin' | 'member';
    };

    if (!email || !email.trim()) {
      return NextResponse.json({ 
        error: 'Email is required' 
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

    if (membership.length === 0 || !['owner', 'admin'].includes(membership[0]?.role ?? '')) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to invite members' 
      }, { status: 403 });
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, email) // Assuming email is used as user identifier
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return NextResponse.json({ 
        error: 'User is already a member of this team' 
      }, { status: 400 });
    }

    // Check if there's already a pending invitation
    const existingInvitation = await db
      .select()
      .from(teamInvitations)
      .where(
        and(
          eq(teamInvitations.teamId, teamId),
          eq(teamInvitations.email, email.trim()),
          eq(teamInvitations.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return NextResponse.json({ 
        error: 'Invitation already sent to this email' 
      }, { status: 400 });
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Create invitation
    const [invitation] = await db
      .insert(teamInvitations)
      .values({
        teamId: teamId,
        email: email.trim(),
        role,
        invitedBy: userId,
        token,
        expiresAt,
      })
      .returning();

    // TODO: Send email invitation (implement email service)
    console.log(`Invitation sent to ${email} for team ${teamId}`);

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    console.error('Error creating team invitation:', error);
    return NextResponse.json({ 
      error: 'Failed to create team invitation' 
    }, { status: 500 });
  }
}
