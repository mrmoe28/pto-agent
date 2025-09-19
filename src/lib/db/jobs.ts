import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db, scrapeJobs } from './index'
import type { ScrapeJobStatus } from './schema'

export type ScrapeJobRecord = typeof scrapeJobs.$inferSelect

export interface EnqueueJobInput {
  city: string | null
  county: string | null
  state: string
  latitude: number | null
  longitude: number | null
}

export async function enqueueScrapeJob({ city, county, state, latitude, longitude }: EnqueueJobInput): Promise<{ job: ScrapeJobRecord; created: boolean }> {
  const normalizedCity = (city ?? '').trim().toLowerCase()
  const normalizedCounty = (county ?? '').trim().toLowerCase()
  const normalizedState = state.trim().toUpperCase()

  const existing = await db
    .select()
    .from(scrapeJobs)
    .where(
      and(
        eq(scrapeJobs.state, normalizedState),
        eq(scrapeJobs.city, normalizedCity),
        eq(scrapeJobs.county, normalizedCounty),
        inArray(scrapeJobs.status, ['pending', 'processing'] satisfies ScrapeJobStatus[])
      )
    )
    .limit(1)

  if (existing.length > 0) {
    return { job: existing[0], created: false }
  }

  const payloadMetadata = {
    originalCity: city,
    originalCounty: county
  }

  const [job] = await db
    .insert(scrapeJobs)
    .values({
      city: normalizedCity,
      county: normalizedCounty,
      state: normalizedState,
      latitude: latitude != null ? latitude.toString() : null,
      longitude: longitude != null ? longitude.toString() : null,
      status: 'pending',
      metadata: payloadMetadata
    })
    .returning()

  return { job, created: true }
}

export async function getPendingScrapeJobs(limit = 5): Promise<ScrapeJobRecord[]> {
  const jobs = await db
    .select()
    .from(scrapeJobs)
    .where(eq(scrapeJobs.status, 'pending'))
    .orderBy(desc(scrapeJobs.createdAt))
    .limit(limit)

  return jobs
}

export async function markScrapeJobProcessing(id: string): Promise<void> {
  await db
    .update(scrapeJobs)
    .set({
      status: 'processing',
      updatedAt: new Date(),
      attempts: sql`${scrapeJobs.attempts} + 1`
    })
    .where(eq(scrapeJobs.id, id))
}

export async function markScrapeJobCompleted(id: string, metadata: Record<string, unknown> = {}): Promise<void> {
  await db
    .update(scrapeJobs)
    .set({
      status: 'completed',
      updatedAt: new Date(),
      completedAt: new Date(),
      lastError: null,
      metadata
    })
    .where(eq(scrapeJobs.id, id))
}

export async function markScrapeJobFailed(id: string, errorMessage: string): Promise<void> {
  await db
    .update(scrapeJobs)
    .set({
      status: 'failed',
      updatedAt: new Date(),
      lastError: errorMessage
    })
    .where(eq(scrapeJobs.id, id))
}
