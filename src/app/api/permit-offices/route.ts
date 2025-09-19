import { NextRequest, NextResponse } from 'next/server'
import { georgiaPermitOffices } from '@/lib/georgia-permit-data'
import { sql } from '@/lib/neon'
import { enqueueScrapeJob } from '@/lib/db/jobs'
import { generatePermitOfficeId, type PermitOffice } from '@/lib/permit-office-search'

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

    console.log(`Searching for permit offices: city=${city}, county=${county}, state=${normalizedState}`)

    // Step 1: Database lookup
    const databaseOffices = await searchPermitOfficesFromDatabase(city, county, normalizedState)
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

    // Step 3: Queue background scrape job
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

async function searchPermitOfficesFromDatabase(city: string | null, county: string | null, state: string): Promise<PermitOffice[]> {
  try {
    const conditions: string[] = ['active = true']
    const params: unknown[] = []

    if (city) {
      conditions.push('(city ILIKE $' + (params.length + 1) + ' OR city ILIKE $' + (params.length + 2) + ')')
      params.push(`%${city}%`, city)
    }

    if (county) {
      conditions.push('(county ILIKE $' + (params.length + 1) + ' OR county ILIKE $' + (params.length + 2) + ')')
      params.push(`%${county}%`, county)
    }

    conditions.push('state = $' + (params.length + 1))
    params.push(state)

    const clause = conditions.join(' AND ')
    const query = `SELECT * FROM permit_offices WHERE ${clause} ORDER BY city, county LIMIT 20`

    console.log('Database query:', query, 'Params:', params)

    const rawResults = await (sql as unknown as { unsafe: (text: string, values?: unknown[]) => Promise<unknown> }).unsafe(query, params)
    const records = rawResults as unknown as PermitOfficeRow[]

    return records.map(mapPermitOfficeRow)
  } catch (error) {
    console.error('Database search error:', error)
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
  if (state !== 'GA') {
    return []
  }

  const normalizedCity = city?.toLowerCase() ?? null
  const normalizedCounty = county?.toLowerCase() ?? null

  return georgiaPermitOffices
    .filter(office => {
      if (office.state !== 'GA') return false
      if (normalizedCity && office.city.toLowerCase() !== normalizedCity) return false
      if (normalizedCounty && office.county.toLowerCase() !== normalizedCounty) return false
      return true
    })
    .map(office => ({
      id: generatePermitOfficeId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      city: office.city,
      county: office.county,
      state: office.state,
      jurisdiction_type: office.jurisdiction_type,
      department_name: office.department_name,
      office_type: office.office_type,
      address: office.address,
      phone: office.phone ?? null,
      email: office.email ?? null,
      website: office.website ?? null,
      hours_monday: office.hours_monday ?? null,
      hours_tuesday: office.hours_tuesday ?? null,
      hours_wednesday: office.hours_wednesday ?? null,
      hours_thursday: office.hours_thursday ?? null,
      hours_friday: office.hours_friday ?? null,
      hours_saturday: office.hours_saturday ?? null,
      hours_sunday: office.hours_sunday ?? null,
      building_permits: office.building_permits ?? false,
      electrical_permits: office.electrical_permits ?? false,
      plumbing_permits: office.plumbing_permits ?? false,
      mechanical_permits: office.mechanical_permits ?? false,
      zoning_permits: office.zoning_permits ?? false,
      planning_review: office.planning_review ?? false,
      inspections: office.inspections ?? false,
      online_applications: office.online_applications ?? false,
      online_payments: office.online_payments ?? false,
      permit_tracking: office.permit_tracking ?? false,
      online_portal_url: office.online_portal_url ?? null,
      latitude: office.latitude ?? null,
      longitude: office.longitude ?? null,
      service_area_bounds: office.service_area_bounds ?? null,
      data_source: 'manual',
      last_verified: office.last_verified ?? null,
      crawl_frequency: office.crawl_frequency ?? 'monthly',
      active: office.active ?? true
    }))
}
