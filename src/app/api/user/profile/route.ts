import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db, userProfiles } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, session.user.id))
      .limit(1);

    return NextResponse.json(profile[0] || null);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      bio,
      phone,
      address,
      city,
      state,
      zipCode,
      preferences,
    } = body;

    // Check if profile exists
    const existingProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, session.user.id))
      .limit(1);

    if (existingProfile.length > 0) {
      // Update existing profile
      const updatedProfile = await db
        .update(userProfiles)
        .set({
          firstName,
          lastName,
          bio,
          phone,
          address,
          city,
          state,
          zipCode,
          preferences,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, session.user.id))
        .returning();

      return NextResponse.json(updatedProfile[0]);
    } else {
      // Create new profile
      const newProfile = await db
        .insert(userProfiles)
        .values({
          userId: session.user.id,
          firstName,
          lastName,
          bio,
          phone,
          address,
          city,
          state,
          zipCode,
          preferences: preferences || {
            notifications: true,
            theme: 'light',
            emailUpdates: false,
          },
        })
        .returning();

      return NextResponse.json(newProfile[0]);
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
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
    const {
      firstName,
      lastName,
      bio,
      phone,
      address,
      city,
      state,
      zipCode,
      preferences,
    } = body;

    const newProfile = await db
      .insert(userProfiles)
      .values({
        userId: session.user.id,
        firstName,
        lastName,
        bio,
        phone,
        address,
        city,
        state,
        zipCode,
        preferences: preferences || {
          notifications: true,
          theme: 'light',
          emailUpdates: false,
        },
      })
      .returning();

    return NextResponse.json(newProfile[0], { status: 201 });
  } catch (error) {
    console.error('Error creating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}