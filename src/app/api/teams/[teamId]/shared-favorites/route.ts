import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canUserAccessFeature, getUserPlanFromAuth } from '@/lib/subscription-utils';
import { db, teamMembers, sharedFavorites } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

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

    // Get shared favorites for the team
    const favorites = await db
      .select()
      .from(sharedFavorites)
      .where(eq(sharedFavorites.teamId, teamId))
      .orderBy(desc(sharedFavorites.createdAt));

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Error fetching shared favorites:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch shared favorites' 
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
    const { 
      permitOfficeId, 
      notes, 
      tags, 
      isPublic = true 
    } = body as {
      permitOfficeId: string;
      notes?: string;
      tags?: string;
      isPublic?: boolean;
    };

    if (!permitOfficeId) {
      return NextResponse.json({ 
        error: 'Permit office ID is required' 
      }, { status: 400 });
    }

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

    // Check if favorite already exists
    const existingFavorite = await db
      .select()
      .from(sharedFavorites)
      .where(
        and(
          eq(sharedFavorites.teamId, teamId),
          eq(sharedFavorites.permitOfficeId, permitOfficeId)
        )
      )
      .limit(1);

    if (existingFavorite.length > 0) {
      return NextResponse.json({ 
        error: 'This office is already shared with the team' 
      }, { status: 400 });
    }

    // Create shared favorite
    const [sharedFavorite] = await db
      .insert(sharedFavorites)
      .values({
        teamId: teamId,
        permitOfficeId,
        addedBy: userId,
        notes: notes?.trim() || null,
        tags: tags?.trim() || null,
        isPublic,
      })
      .returning();

    return NextResponse.json({ favorite: sharedFavorite }, { status: 201 });
  } catch (error) {
    console.error('Error creating shared favorite:', error);
    return NextResponse.json({ 
      error: 'Failed to create shared favorite' 
    }, { status: 500 });
  }
}
