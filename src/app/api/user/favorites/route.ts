import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userFavorites } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await db
      .select()
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId));

    return NextResponse.json(favorites, { status: 200 });
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, permitOfficeId } = body;

    if (!action || !permitOfficeId) {
      return NextResponse.json(
        { error: 'Missing action or permitOfficeId' },
        { status: 400 }
      );
    }

    if (action === 'add') {
      // Check if already favorited
      const existing = await db
        .select()
        .from(userFavorites)
        .where(and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.permitOfficeId, permitOfficeId)
        ))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(userFavorites).values({
          userId,
          permitOfficeId,
        });
      }
    } else if (action === 'remove') {
      await db
        .delete(userFavorites)
        .where(and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.permitOfficeId, permitOfficeId)
        ));
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "add" or "remove"' },
        { status: 400 }
      );
    }

    // Return updated favorites list
    const favorites = await db
      .select()
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId));

    return NextResponse.json(favorites, { status: 200 });
  } catch (error) {
    console.error('Error updating user favorites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
