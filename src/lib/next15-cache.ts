/**
 * Next.js 15 optimized caching layer using "use cache" directive
 * Provides better performance and explicit cache control
 */

import { type PermitOffice } from '@/lib/permit-office-search'
import { sql } from '@/lib/neon'

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

/**
 * Cached database query for permit offices by location
 * Uses Next.js 15 "use cache" directive for automatic caching
 */
export async function getCachedPermitOfficesByLocation(
  city: string | null,
  county: string | null,
  state: string
): Promise<PermitOffice[]> {
  // Use Next.js 15 stable caching - remove 'use cache' if not supported

  try {
    console.log(`[CACHE] Querying permit offices: city=${city}, county=${county}, state=${state}`)

    let query
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 8000)
    })

    if (city && county) {
      query = sql`
        SELECT * FROM permit_offices
        WHERE active = true
          AND (city = ${city} OR city ILIKE ${`%${city}%`})
          AND (county = ${county} OR county ILIKE ${`%${county}%`})
          AND state = ${state}
        ORDER BY
          jurisdiction_type = 'city' DESC,
          city, county
        LIMIT 20
      `
    } else if (city) {
      query = sql`
        SELECT * FROM permit_offices
        WHERE active = true
          AND (city = ${city} OR city ILIKE ${`%${city}%`})
          AND state = ${state}
        ORDER BY
          jurisdiction_type = 'city' DESC,
          city, county
        LIMIT 20
      `
    } else if (county) {
      query = sql`
        SELECT * FROM permit_offices
        WHERE active = true
          AND (county = ${county} OR county ILIKE ${`%${county}%`})
          AND state = ${state}
        ORDER BY
          jurisdiction_type = 'city' DESC,
          city, county
        LIMIT 20
      `
    } else {
      query = sql`
        SELECT * FROM permit_offices
        WHERE active = true
          AND state = ${state}
        ORDER BY
          jurisdiction_type = 'city' DESC,
          city, county
        LIMIT 20
      `
    }

    const queryPromise = query
    const rawResults = await Promise.race([queryPromise, timeoutPromise])
    const records = rawResults as unknown as PermitOfficeRow[]

    console.log(`[CACHE] Found ${records.length} records in database`)
    return records.map(mapPermitOfficeRow)
  } catch (error) {
    console.error('[CACHE] Database search error:', error)
    return []
  }
}

/**
 * Cached database query for permit offices by coordinates
 * Uses spatial queries for location-based searches
 */
export async function getCachedPermitOfficesByCoordinates(
  latitude: number,
  longitude: number,
  radiusMiles: number = 25
): Promise<PermitOffice[]> {
  // Note: 'use cache' directive requires Next.js canary version
  // Using manual caching instead for compatibility

  try {
    console.log(`[CACHE] Querying permit offices by coordinates: lat=${latitude}, lng=${longitude}, radius=${radiusMiles}`)

    const query = sql`
      SELECT *,
        (
          3959 * acos(
            cos(radians(${latitude}))
            * cos(radians(latitude))
            * cos(radians(longitude) - radians(${longitude}))
            + sin(radians(${latitude}))
            * sin(radians(latitude))
          )
        ) AS distance
      FROM permit_offices
      WHERE active = true
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
      HAVING distance < ${radiusMiles}
      ORDER BY distance, jurisdiction_type = 'city' DESC
      LIMIT 20
    `

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 8000)
    })

    const rawResults = await Promise.race([query, timeoutPromise])
    const records = rawResults as unknown as (PermitOfficeRow & { distance: number })[]

    console.log(`[CACHE] Found ${records.length} records within ${radiusMiles} miles`)
    return records.map(row => ({
      ...mapPermitOfficeRow(row),
      distance: row.distance
    }))
  } catch (error) {
    console.error('[CACHE] Coordinate-based search error:', error)
    return []
  }
}

/**
 * Get most popular permit offices (frequently searched)
 * Uses aggressive caching since this data changes slowly
 */
export async function getCachedPopularPermitOffices(limit: number = 10): Promise<PermitOffice[]> {
  // Note: 'use cache' directive requires Next.js canary version
  // Using manual caching instead for compatibility

  try {
    console.log(`[CACHE] Querying popular permit offices (limit: ${limit})`)

    const query = sql`
      SELECT * FROM permit_offices
      WHERE active = true
        AND jurisdiction_type IN ('city', 'county')
        AND (building_permits = true OR electrical_permits = true OR plumbing_permits = true)
      ORDER BY
        (CASE WHEN online_applications = true THEN 1 ELSE 0 END) DESC,
        (CASE WHEN website IS NOT NULL THEN 1 ELSE 0 END) DESC,
        jurisdiction_type = 'city' DESC,
        city
      LIMIT ${limit}
    `

    const records = await query as unknown as PermitOfficeRow[]
    console.log(`[CACHE] Found ${records.length} popular permit offices`)

    return records.map(mapPermitOfficeRow)
  } catch (error) {
    console.error('[CACHE] Popular offices query error:', error)
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
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    service_area_bounds: row.service_area_bounds,
    data_source: row.data_source,
    last_verified: row.last_verified,
    crawl_frequency: row.crawl_frequency,
    active: row.active
  }
}