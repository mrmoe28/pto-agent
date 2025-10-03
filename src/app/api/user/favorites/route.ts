import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { and, eq } from 'drizzle-orm'
import { db, userFavorites } from '@/lib/db'
import { canUserAccessFeature, getUserPlanFromAuth } from '@/lib/subscription-utils'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Check if user has Enterprise plan access
  const userPlan = await getUserPlanFromAuth()
  const hasAccess = canUserAccessFeature(userPlan, 'canSaveFavorites')
  if (!hasAccess) {
    return NextResponse.json({ 
      error: 'Favorites feature requires Enterprise plan',
      code: 'UPGRADE_REQUIRED'
    }, { status: 403 })
  }

  try {
    const favorites = await db
      .select()
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId))

    return NextResponse.json(favorites)
  } catch (error) {
    console.error('Favorites fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Check if user has Enterprise plan access
  const userPlan = await getUserPlanFromAuth()
  const hasAccess = canUserAccessFeature(userPlan, 'canSaveFavorites')
  if (!hasAccess) {
    return NextResponse.json({ 
      error: 'Favorites feature requires Enterprise plan',
      code: 'UPGRADE_REQUIRED'
    }, { status: 403 })
  }

  try {
    const body = await request.json()

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { action, permitOfficeId, notes } = body as {
      action?: string
      permitOfficeId?: string
      notes?: string | null
    }

    if (!action || !permitOfficeId) {
      return NextResponse.json({ error: 'Missing action or permitOfficeId' }, { status: 400 })
    }

    if (action === 'add') {
      const [existing] = await db
        .select({ id: userFavorites.id })
        .from(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, userId),
            eq(userFavorites.permitOfficeId, permitOfficeId)
          )
        )
        .limit(1)

      if (existing) {
        return NextResponse.json(existing)
      }

      const [created] = await db
        .insert(userFavorites)
        .values({
          userId,
          permitOfficeId,
          notes: notes ?? null,
        })
        .returning()

      return NextResponse.json(created, { status: 201 })
    }

    if (action === 'remove') {
      const deleted = await db
        .delete(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, userId),
            eq(userFavorites.permitOfficeId, permitOfficeId)
          )
        )
        .returning({ id: userFavorites.id })

      if (deleted.length === 0) {
        return NextResponse.json({ error: 'Favorite not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 })
  } catch (error) {
    console.error('Favorites update error:', error)
    return NextResponse.json({ error: 'Failed to update favorites' }, { status: 500 })
  }
}
