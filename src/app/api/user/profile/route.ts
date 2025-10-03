import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, userProfiles, type NewUserProfile } from '@/lib/db'
import { eq } from 'drizzle-orm'

function sanitizeProfilePayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return {} as Partial<NewUserProfile>
  }

  const source = payload as Partial<NewUserProfile>
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
  } = source

  const data: Partial<NewUserProfile> = {}

  if (firstName !== undefined) data.firstName = firstName
  if (lastName !== undefined) data.lastName = lastName
  if (bio !== undefined) data.bio = bio
  if (phone !== undefined) data.phone = phone
  if (address !== undefined) data.address = address
  if (city !== undefined) data.city = city
  if (state !== undefined) data.state = state
  if (zipCode !== undefined) data.zipCode = zipCode
  if (preferences !== undefined && typeof preferences === 'object') {
    data.preferences = preferences
  }

  return data
}

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1)

    return NextResponse.json(profile[0] ?? null)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const payload = sanitizeProfilePayload(await request.json())

    const existing = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 409 })
    }

    const [created] = await db
      .insert(userProfiles)
      .values({
        userId,
        ...payload,
      })
      .returning()

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Profile create error:', error)
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const payload = sanitizeProfilePayload(await request.json())

    const [updated] = await db
      .update(userProfiles)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
      .returning()

    if (!updated) {
      // If the profile does not exist yet, create it instead of failing
      const [created] = await db
        .insert(userProfiles)
        .values({
          userId,
          ...payload,
        })
        .returning()

      return NextResponse.json(created, { status: 201 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
