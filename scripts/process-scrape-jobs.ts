import 'dotenv/config'
import { getPendingScrapeJobs, markScrapeJobCompleted, markScrapeJobFailed, markScrapeJobProcessing } from '@/lib/db/jobs'
import { upsertPermitOffice } from '@/lib/db/permit-offices'
import { searchPermitOfficesWeb } from '@/lib/permit-office-search'

const BATCH_SIZE = Number(process.env.SCRAPER_JOB_BATCH_SIZE ?? 3)

async function processJobs(): Promise<void> {
  const jobs = await getPendingScrapeJobs(BATCH_SIZE)

  if (jobs.length === 0) {
    console.log('No pending scrape jobs found.')
    return
  }

  for (const job of jobs) {
    console.log(`Processing job ${job.id}: ${job.city || '(city unknown)'} ${job.county || ''} ${job.state}`)

    try {
      await markScrapeJobProcessing(job.id)

      const jobMetadata = toRecord(job.metadata)
      const city = job.city ? reconstructOriginal(jobMetadata.originalCity, job.city) : null
      const county = job.county ? reconstructOriginal(jobMetadata.originalCounty, job.county) : null
      const offices = await searchPermitOfficesWeb(city, county, job.state)

      if (offices.length === 0) {
        await markScrapeJobFailed(job.id, 'No offices discovered for this location.')
        continue
      }

      for (const office of offices) {
        await upsertPermitOffice(office)
      }

      await markScrapeJobCompleted(job.id, {
        officesPersisted: offices.length
      })

      console.log(`Job ${job.id} completed. Persisted ${offices.length} offices.`)
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error)
      await markScrapeJobFailed(job.id, error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

function reconstructOriginal(original: unknown, fallback: string): string {
  const raw = typeof original === 'string' ? original.trim() : fallback
  return raw || fallback
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

processJobs()
  .then(() => {
    console.log('Scrape job processing completed.')
    process.exit(0)
  })
  .catch(error => {
    console.error('Processing scrape jobs failed:', error)
    process.exit(1)
  })
