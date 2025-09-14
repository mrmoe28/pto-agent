import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db, userFavorites, permitOffices } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await db
      .select({
        id: userFavorites.id,
        notes: userFavorites.notes,
        createdAt: userFavorites.createdAt,
        permitOffice: {
          id: permitOffices.id,
          departmentName: permitOffices.departmentName,
          city: permitOffices.city,
          county: permitOffices.county,
          state: permitOffices.state,
          address: permitOffices.address,
          phone: permitOffices.phone,
          website: permitOffices.website,
        },
      })
      .from(userFavorites)
      .innerJoin(permitOffices, eq(userFavorites.permitOfficeId, permitOffices.id))
      .where(eq(userFavorites.userId, session.user.id));

    return NextResponse.json(favorites);
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { permitOfficeId, notes } = body;

    if (!permitOfficeId) {
      return NextResponse.json(
        { error: 'Permit office ID is required' },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, session.user.id),
          eq(userFavorites.permitOfficeId, permitOfficeId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Permit office already in favorites' },
        { status: 400 }
      );
    }

    const newFavorite = await db
      .insert(userFavorites)
      .values({
        userId: session.user.id,
        permitOfficeId,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json(newFavorite[0], { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const favoriteId = url.searchParams.get('id');

    if (!favoriteId) {
      return NextResponse.json(
        { error: 'Favorite ID is required' },
        { status: 400 }
      );
    }

    await db
      .delete(userFavorites)
      .where(
        and(
          eq(userFavorites.id, favoriteId),
          eq(userFavorites.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}