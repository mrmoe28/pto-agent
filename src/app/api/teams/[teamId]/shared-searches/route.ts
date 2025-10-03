import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canUserAccessFeature, getUserPlanFromAuth } from '@/lib/subscription-utils';
import { db, teamMembers, sharedSearches } from '@/lib/db';
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

    // Get shared searches for the team
    const searches = await db
      .select()
      .from(sharedSearches)
      .where(eq(sharedSearches.teamId, teamId))
      .orderBy(desc(sharedSearches.createdAt));

    return NextResponse.json({ searches });
  } catch (error) {
    console.error('Error fetching shared searches:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch shared searches' 
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
      searchQuery, 
      searchResults, 
      title, 
      description, 
      isPublic = false 
    } = body as {
      searchQuery: string;
      searchResults: unknown[];
      title: string;
      description?: string;
      isPublic?: boolean;
    };

    if (!searchQuery || !searchResults || !title) {
      return NextResponse.json({ 
        error: 'Search query, results, and title are required' 
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

    // Create shared search
    const [sharedSearch] = await db
      .insert(sharedSearches)
      .values({
        teamId: teamId,
        sharedBy: userId,
        searchQuery: searchQuery.trim(),
        searchResults: searchResults,
        title: title.trim(),
        description: description?.trim() || null,
        isPublic,
      })
      .returning();

    return NextResponse.json({ search: sharedSearch }, { status: 201 });
  } catch (error) {
    console.error('Error creating shared search:', error);
    return NextResponse.json({ 
      error: 'Failed to create shared search' 
    }, { status: 500 });
  }
}
