import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'
import { enqueueScrapeJob } from '@/lib/db/jobs'
import { type PermitOffice } from '@/lib/permit-office-search'
import { createCacheKey, withCache } from '@/lib/cache'
import { analyzeJurisdiction } from '@/lib/jurisdiction-analyzer'

interface PermitOfficeRow {
  id: string
  created_at: string
  updated_at: string
  city: string
  county: string
  state: string
  jurisdiction_type: string
  department_name: string
  office_type: string
  address: string
  phone: string | null
  email: string | null
  website: string | null
  hours_monday: string | null
  hours_tuesday: string | null
  hours_wednesday: string | null
  hours_thursday: string | null
  hours_friday: string | null
  hours_saturday: string | null
  hours_sunday: string | null
  building_permits: boolean
  electrical_permits: boolean
  plumbing_permits: boolean
  mechanical_permits: boolean
  zoning_permits: boolean
  planning_review: boolean
  inspections: boolean
  online_applications: boolean
  online_payments: boolean
  permit_tracking: boolean
  online_portal_url: string | null
  permit_fees: Record<string, unknown> | null
  instructions: Record<string, unknown> | null
  processing_times: Record<string, unknown> | null
  latitude: number | null
  longitude: number | null
  service_area_bounds: Record<string, unknown> | null
  data_source: 'crawled' | 'api' | 'manual'
  last_verified: string | null
  crawl_frequency: 'daily' | 'weekly' | 'monthly'
  active: boolean
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latitudeParam = searchParams.get('lat')
    const longitudeParam = searchParams.get('lng')
    const rawCity = searchParams.get('city')?.trim() || null
    const rawCounty = searchParams.get('county')?.trim() || null
    const stateParam = searchParams.get('state')?.trim()

    if (!stateParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required state parameter',
          offices: [],
          count: 0,
          source: 'validation'
        },
        { status: 400 }
      )
    }

    const normalizedState = normalizeState(stateParam)
    const city = normalizeText(rawCity)
    const county = normalizeText(rawCounty)

    const latitude = latitudeParam ? Number(latitudeParam) : null
    const longitude = longitudeParam ? Number(longitudeParam) : null

    // Analyze jurisdiction to determine best search strategy
    const jurisdictionAnalysis = analyzeJurisdiction({
      city,
      county,
      state: normalizedState
    })

    console.log(`Searching for permit offices: city=${city}, county=${county}, state=${normalizedState}`)
    console.log(`Jurisdiction analysis: level=${jurisdictionAnalysis.searchLevel}, confidence=${jurisdictionAnalysis.confidence}, reason="${jurisdictionAnalysis.reason}"`)

    // Create cache key for this search
    const cacheKey = createCacheKey('permit-offices', {
      city: city || '',
      county: county || '',
      state: normalizedState,
      lat: latitude || 0,
      lng: longitude || 0
    })

    // Step 1: Check cache first, then database lookup with intelligent jurisdiction priority
    const databaseOffices = await withCache(
      cacheKey,
      () => searchPermitOfficesFromDatabase(city, county, normalizedState, jurisdictionAnalysis),
      300 // Cache for 5 minutes
    )

    if (databaseOffices.length > 0) {
      const response = formatOfficesResponse(databaseOffices, latitude, longitude)
      return NextResponse.json({ ...response, source: 'database' })
    }

    // Step 2: Georgia fallback dataset
    const fallbackOffices = getFallbackOffices(city, county, normalizedState)
    if (fallbackOffices.length > 0) {
      const response = formatOfficesResponse(fallbackOffices, latitude, longitude)
      return NextResponse.json({ ...response, source: 'fallback' })
    }

    // Step 3: Queue background scrape job with error handling
    try {
      const { job, created } = await enqueueScrapeJob({
        city,
        county,
        state: normalizedState,
        latitude,
        longitude
      })

      const statusCode = created ? 202 : 200
      const message = created
        ? 'No permit offices yet—collecting live data now. Try again in a few minutes.'
        : 'Permit office data is being collected. Check back shortly.'

      return NextResponse.json(
        {
          success: true,
          offices: [],
          count: 0,
          source: 'job_queue',
          jobId: job.id,
          jobStatus: job.status,
          message
        },
        { status: statusCode }
      )
    } catch (jobError) {
      console.error('Failed to enqueue scrape job:', jobError)
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to collect permit office data at this time',
          offices: [],
          count: 0,
          source: 'error'
        },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Permit office search error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search for permit offices',
        offices: [],
        count: 0,
        source: 'error'
      },
      { status: 500 }
    )
  }
}

async function searchPermitOfficesFromDatabase(
  city: string | null,
  county: string | null,
  state: string,
  jurisdictionAnalysis: ReturnType<typeof analyzeJurisdiction>
): Promise<PermitOffice[]> {
  try {
    // Set a timeout for database queries to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout')), 5000)
    )

    console.log(`Searching database: city=${city}, county=${county}, state=${state}`)
    console.log(`Using search order: ${jurisdictionAnalysis.suggestedOrder.join(' → ')}`)

    let records: PermitOfficeRow[] = []

    // Use jurisdiction analysis to determine search strategy
    if (jurisdictionAnalysis.searchLevel === 'county' || (city && county && jurisdictionAnalysis.suggestedOrder[0] === 'county')) {
      // County-first strategy (for unincorporated areas)
      console.log(`Primary search: County level (${jurisdictionAnalysis.reason})`)

      const countyQuery = sql`
        SELECT * FROM permit_offices
        WHERE active = true
          AND (county = ${county} OR county ILIKE ${`%${county}%`})
          AND state = ${state}
        ORDER BY
          jurisdiction_type = 'county' DESC,
          CASE WHEN city = ${city || ''} THEN 1 ELSE 2 END,
          city, county
        LIMIT 20
      `

      const countyResults = await Promise.race([countyQuery, timeoutPromise])
      records = countyResults as unknown as PermitOfficeRow[]

      // If county search returns nothing and we have a city, try city search
      if (records.length === 0 && city) {
        console.log(`No county results, trying city search as fallback`)
        const cityQuery = sql`
          SELECT * FROM permit_offices
          WHERE active = true
            AND (city = ${city} OR city ILIKE ${`%${city}%`})
            AND state = ${state}
          ORDER BY
            CASE WHEN city = ${city} THEN 1 ELSE 2 END,
            jurisdiction_type = 'city' DESC,
            city, county
          LIMIT 20
        `

        const cityResults = await Promise.race([cityQuery, timeoutPromise])
        records = cityResults as unknown as PermitOfficeRow[]
      }
    } else if (city && county) {
      // City-first strategy (for incorporated cities)
      console.log(`Primary search: City level (${jurisdictionAnalysis.reason})`)

      const cityQuery = sql`
        SELECT * FROM permit_offices
        WHERE active = true
          AND (city = ${city} OR city ILIKE ${`%${city}%`})
          AND (county = ${county} OR county ILIKE ${`%${county}%`})
          AND state = ${state}
        ORDER BY
          CASE WHEN city = ${city} THEN 1 ELSE 2 END,
          jurisdiction_type = 'city' DESC,
          city, county
        LIMIT 20
      `

      const cityResults = await Promise.race([cityQuery, timeoutPromise])
      records = cityResults as unknown as PermitOfficeRow[]

      // Fallback to county if no city results
      if (records.length === 0) {
        console.log(`No city results, falling back to county level`)
        const countyQuery = sql`
          SELECT * FROM permit_offices
          WHERE active = true
            AND (county = ${county} OR county ILIKE ${`%${county}%`})
            AND state = ${state}
          ORDER BY
            jurisdiction_type = 'county' DESC,
            city, county
          LIMIT 20
        `

        const countyResults = await Promise.race([countyQuery, timeoutPromise])
        records = countyResults as unknown as PermitOfficeRow[]
      }
    } else if (city) {
      const cityQuery = sql`
        SELECT * FROM permit_offices
        WHERE active = true
          AND (city = ${city} OR city ILIKE ${`%${city}%`})
          AND state = ${state}
        ORDER BY
          CASE WHEN city = ${city} THEN 1 ELSE 2 END,
          jurisdiction_type = 'city' DESC,
          city, county
        LIMIT 20
      `

      const cityResults = await Promise.race([cityQuery, timeoutPromise])
      records = cityResults as unknown as PermitOfficeRow[]
    } else if (county) {
      const countyQuery = sql`
        SELECT * FROM permit_offices
        WHERE active = true
          AND (county = ${county} OR county ILIKE ${`%${county}%`})
          AND state = ${state}
        ORDER BY
          jurisdiction_type = 'city' DESC,
          city, county
        LIMIT 20
      `

      const countyResults = await Promise.race([countyQuery, timeoutPromise])
      records = countyResults as unknown as PermitOfficeRow[]
    } else {
      const stateQuery = sql`
        SELECT * FROM permit_offices
        WHERE active = true
          AND state = ${state}
        ORDER BY
          jurisdiction_type = 'city' DESC,
          city, county
        LIMIT 20
      `

      const stateResults = await Promise.race([stateQuery, timeoutPromise])
      records = stateResults as unknown as PermitOfficeRow[]
    }

    console.log(`Found ${records.length} records in database`)
    return records.map(mapPermitOfficeRow)
  } catch (error) {
    console.error('Database search error:', error)
    // Return empty array instead of throwing to allow fallback methods
    return []
  }
}

function mapPermitOfficeRow(row: PermitOfficeRow): PermitOffice {
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    city: row.city,
    county: row.county,
    state: row.state,
    jurisdiction_type: row.jurisdiction_type as PermitOffice['jurisdiction_type'],
    department_name: row.department_name,
    office_type: row.office_type as PermitOffice['office_type'],
    address: row.address,
    phone: row.phone,
    email: row.email,
    website: row.website,
    hours_monday: row.hours_monday,
    hours_tuesday: row.hours_tuesday,
    hours_wednesday: row.hours_wednesday,
    hours_thursday: row.hours_thursday,
    hours_friday: row.hours_friday,
    hours_saturday: row.hours_saturday,
    hours_sunday: row.hours_sunday,
    building_permits: row.building_permits,
    electrical_permits: row.electrical_permits,
    plumbing_permits: row.plumbing_permits,
    mechanical_permits: row.mechanical_permits,
    zoning_permits: row.zoning_permits,
    planning_review: row.planning_review,
    inspections: row.inspections,
    online_applications: row.online_applications,
    online_payments: row.online_payments,
    permit_tracking: row.permit_tracking,
    online_portal_url: row.online_portal_url,
    permit_fees: row.permit_fees as PermitOffice['permit_fees'],
    instructions: row.instructions as PermitOffice['instructions'],
    processing_times: row.processing_times as PermitOffice['processing_times'],
    latitude: row.latitude,
    longitude: row.longitude,
    service_area_bounds: row.service_area_bounds,
    data_source: row.data_source,
    last_verified: row.last_verified,
    crawl_frequency: row.crawl_frequency,
    active: row.active
  }
}

function normalizeText(value: string | null): string | null {
  if (!value) return null
  return value.trim()
}

function normalizeState(state: string): string {
  if (state.length === 2) {
    return state.toUpperCase()
  }
  return convertStateNameToAbbreviation(state)
}

function formatOfficesResponse(offices: PermitOffice[], latitude: number | null, longitude: number | null) {
  if (latitude == null || longitude == null) {
    return { success: true, offices, count: offices.length }
  }

  const officesWithDistance = offices
    .map(office => {
      if (office.latitude != null && office.longitude != null) {
        const distance = calculateDistance(latitude, longitude, office.latitude, office.longitude)
        return { ...office, distance }
      }
      return office
    })
    .sort((a, b) => {
      if (a.distance == null) return 1
      if (b.distance == null) return -1
      return a.distance - b.distance
    })

  return { success: true, offices: officesWithDistance, count: officesWithDistance.length }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function convertStateNameToAbbreviation(state: string): string {
  const normalized = state.trim().toLowerCase()
  const map: Record<string, string> = {
    alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO', connecticut: 'CT',
    delaware: 'DE', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
    kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI',
    minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH',
    'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
    oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD',
    tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
    wisconsin: 'WI', wyoming: 'WY'
  }

  return map[normalized] ?? state.toUpperCase()
}

function getFallbackOffices(city: string | null, county: string | null, state: string): PermitOffice[] {
  // No hardcoded fallback data - all data comes from database, web scraping, or API calls
  // If no database results exist, the application will trigger web scraping
  if (state !== 'GA') {
    return []
  }

  // Return empty array to indicate no fallback data available
  // This will cause the application to rely on web scraping and database storage
  return []
}
