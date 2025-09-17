import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(profile[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, bio, phone, address, city, state, zipCode, preferences } = body;

    // Check if profile exists
    const existingProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    const profileData = {
      userId,
      firstName,
      lastName,
      bio,
      phone,
      address,
      city,
      state,
      zipCode,
      preferences,
    };

    let profile;

    if (existingProfile.length === 0) {
      // Create new profile
      profile = await db
        .insert(userProfiles)
        .values(profileData)
        .returning();
    } else {
      // Update existing profile
      profile = await db
        .update(userProfiles)
        .set(profileData)
        .where(eq(userProfiles.userId, userId))
        .returning();
    }

    return NextResponse.json(profile[0], { status: 200 });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
