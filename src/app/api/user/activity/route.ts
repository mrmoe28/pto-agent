import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { desc, eq } from 'drizzle-orm'
import { db, userPermitSearches } from '@/lib/db'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    // Get recent searches for the user
    const searches = await db
      .select()
      .from(userPermitSearches)
      .where(eq(userPermitSearches.userId, userId))
      .orderBy(desc(userPermitSearches.savedAt))
      .limit(20)

    return NextResponse.json(searches)
  } catch (error) {
    console.error('Activity fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const body = await request.json()

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { searchName, searchQuery, locationData, resultsCount } = body as {
      searchName?: string
      searchQuery?: string
      locationData?: Record<string, unknown>
      resultsCount?: number
    }

    if (!searchQuery) {
      return NextResponse.json({ error: 'Missing searchQuery' }, { status: 400 })
    }

    const [created] = await db
      .insert(userPermitSearches)
      .values({
        userId,
        searchName: searchName ?? null,
        searchQuery,
        locationData: locationData ?? null,
        resultsCount: resultsCount ?? 0,
        savedAt: new Date(),
        lastAccessed: new Date(),
      })
      .returning()

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Activity save error:', error)
    return NextResponse.json({ error: 'Failed to save activity' }, { status: 500 })
  }
}
