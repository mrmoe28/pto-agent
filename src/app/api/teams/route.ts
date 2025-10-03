import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canUserAccessFeature, getUserPlanFromAuth } from '@/lib/subscription-utils';
import { db, teams, teamMembers } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const session = await auth();

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
    // Get teams where user is a member
    const userTeams = await db
      .select({
        team: teams,
        memberRole: teamMembers.role,
        memberStatus: teamMembers.status,
        joinedAt: teamMembers.joinedAt,
      })
      .from(teams)
      .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(
        and(
          eq(teamMembers.userId, userId),
          eq(teamMembers.status, 'active')
        )
      );

    return NextResponse.json({ teams: userTeams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch teams' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

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
    const { name, description } = body as {
      name: string;
      description?: string;
    };

    if (!name || !name.trim()) {
      return NextResponse.json({ 
        error: 'Team name is required' 
      }, { status: 400 });
    }

    // Create team
    const [newTeam] = await db
      .insert(teams)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: userId,
      })
      .returning();

    // Add owner as team member
    await db
      .insert(teamMembers)
      .values({
        teamId: newTeam.id,
        userId: userId,
        role: 'owner',
        status: 'active',
        joinedAt: new Date(),
      });

    return NextResponse.json({ team: newTeam }, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ 
      error: 'Failed to create team' 
    }, { status: 500 });
  }
}
