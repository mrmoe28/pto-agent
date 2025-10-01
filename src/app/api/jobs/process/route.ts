import { NextRequest, NextResponse } from 'next/server'
import { getPendingScrapeJobs, markScrapeJobProcessing, markScrapeJobCompleted, markScrapeJobFailed } from '@/lib/db/jobs'
import { scrapeSolarPermitData } from '@/lib/enhanced-permit-scraper'

/**
 * Background job processor API route
 * This endpoint processes pending scrape jobs from the database
 * Can be called by:
 * - Vercel Cron (https://vercel.com/docs/cron-jobs)
 * - Manual trigger
 * - External cron service
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authorization header check
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get pending jobs (limit to 5 per run to avoid timeouts)
    const jobs = await getPendingScrapeJobs(5)

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending jobs to process',
        processed: 0
      })
    }

    console.log(`Processing ${jobs.length} scrape jobs`)

    const results = await Promise.allSettled(
      jobs.map(async (job) => {
        try {
          // Mark job as processing
          await markScrapeJobProcessing(job.id)

          // Perform the actual scraping (solar/electrical focused)
          const officeData = await scrapeSolarPermitData({
            city: job.city,
            county: job.county || '',
            state: job.state,
            latitude: job.latitude ? parseFloat(job.latitude) : null,
            longitude: job.longitude ? parseFloat(job.longitude) : null
          })

          if (officeData && officeData.length > 0) {
            // Mark job as completed with metadata
            await markScrapeJobCompleted(job.id, {
              officesFound: officeData.length,
              completedAt: new Date().toISOString()
            })

            return {
              jobId: job.id,
              status: 'completed',
              officesFound: officeData.length
            }
          } else {
            await markScrapeJobFailed(job.id, 'No permit offices found for this location')
            return {
              jobId: job.id,
              status: 'failed',
              error: 'No offices found'
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          await markScrapeJobFailed(job.id, errorMessage)

          return {
            jobId: job.id,
            status: 'failed',
            error: errorMessage
          }
        }
      })
    )

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 'completed').length
    const failedCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 'failed').length

    return NextResponse.json({
      success: true,
      processed: jobs.length,
      succeeded: successCount,
      failed: failedCount,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error' })
    })

  } catch (error) {
    console.error('Job processor error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process jobs'
      },
      { status: 500 }
    )
  }
}

// Allow GET for manual testing
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Get status of pending jobs
  const jobs = await getPendingScrapeJobs(10)

  return NextResponse.json({
    pendingJobs: jobs.length,
    jobs: jobs.map(j => ({
      id: j.id,
      city: j.city,
      county: j.county,
      state: j.state,
      status: j.status,
      attempts: j.attempts,
      createdAt: j.createdAt
    }))
  })
}
