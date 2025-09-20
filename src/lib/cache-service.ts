/**
 * High-performance cache service using connection pooling
 * Optimized for Next.js 15 with database connection pooling
 */

import { db } from '@/lib/db-pool'
import { cache } from './cache'
import { type PermitOffice } from '@/lib/permit-office-search'

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
  distance?: number
}

export class PermitOfficeCache {
  private static instance: PermitOfficeCache

  public static getInstance(): PermitOfficeCache {
    if (!PermitOfficeCache.instance) {
      PermitOfficeCache.instance = new PermitOfficeCache()
    }
    return PermitOfficeCache.instance
  }

  /**
   * Get permit offices by location with caching and connection pooling
   */
  async getByLocation(
    city: string | null,
    county: string | null,
    state: string
  ): Promise<PermitOffice[]> {
    const cacheKey = `location:${state}:${county || ''}:${city || ''}`

    // Check cache first
    const cached = cache.get<PermitOffice[]>(cacheKey)
    if (cached) {
      console.log(`[CACHE HIT] ${cacheKey}`)
      return cached
    }

    console.log(`[CACHE MISS] ${cacheKey} - querying database`)

    try {
      let queryText: string
      let params: unknown[]

      if (city && county) {
        queryText = `
          SELECT * FROM permit_offices
          WHERE active = true
            AND (city = $1 OR city ILIKE $2)
            AND (county = $3 OR county ILIKE $4)
            AND state = $5
          ORDER BY
            jurisdiction_type = 'city' DESC,
            city, county
          LIMIT 20
        `
        params = [city, `%${city}%`, county, `%${county}%`, state]
      } else if (city) {
        queryText = `
          SELECT * FROM permit_offices
          WHERE active = true
            AND (city = $1 OR city ILIKE $2)
            AND state = $3
          ORDER BY
            jurisdiction_type = 'city' DESC,
            city, county
          LIMIT 20
        `
        params = [city, `%${city}%`, state]
      } else if (county) {
        queryText = `
          SELECT * FROM permit_offices
          WHERE active = true
            AND (county = $1 OR county ILIKE $2)
            AND state = $3
          ORDER BY
            jurisdiction_type = 'city' DESC,
            city, county
          LIMIT 20
        `
        params = [county, `%${county}%`, state]
      } else {
        queryText = `
          SELECT * FROM permit_offices
          WHERE active = true
            AND state = $1
          ORDER BY
            jurisdiction_type = 'city' DESC,
            city, county
          LIMIT 20
        `
        params = [state]
      }

      const records = await db.query<PermitOfficeRow>(queryText, params)
      const offices = records.map(this.mapPermitOfficeRow)

      // Cache for 5 minutes
      cache.set(cacheKey, offices, 300)

      console.log(`[DB QUERY] Found ${offices.length} offices for ${cacheKey}`)
      return offices
    } catch (error) {
      console.error('[CACHE SERVICE] Location query error:', error)
      return []
    }
  }

  /**
   * Get permit offices by coordinates with caching
   */
  async getByCoordinates(
    latitude: number,
    longitude: number,
    radiusMiles: number = 25
  ): Promise<PermitOffice[]> {
    const cacheKey = `coords:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${radiusMiles}`

    // Check cache first
    const cached = cache.get<PermitOffice[]>(cacheKey)
    if (cached) {
      console.log(`[CACHE HIT] ${cacheKey}`)
      return cached
    }

    console.log(`[CACHE MISS] ${cacheKey} - querying database`)

    try {
      const queryText = `
        SELECT *,
          (
            3959 * acos(
              cos(radians($1))
              * cos(radians(latitude))
              * cos(radians(longitude) - radians($2))
              + sin(radians($1))
              * sin(radians(latitude))
            )
          ) AS distance
        FROM permit_offices
        WHERE active = true
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
        HAVING distance < $3
        ORDER BY distance, jurisdiction_type = 'city' DESC
        LIMIT 20
      `

      const records = await db.query<PermitOfficeRow & { distance: number }>(
        queryText,
        [latitude, longitude, radiusMiles]
      )

      const offices = records.map(row => ({
        ...this.mapPermitOfficeRow(row),
        distance: row.distance
      }))

      // Cache for 10 minutes (coordinates change less frequently)
      cache.set(cacheKey, offices, 600)

      console.log(`[DB QUERY] Found ${offices.length} offices within ${radiusMiles} miles`)
      return offices
    } catch (error) {
      console.error('[CACHE SERVICE] Coordinates query error:', error)
      return []
    }
  }

  /**
   * Get popular permit offices (cached aggressively)
   */
  async getPopular(limit: number = 10): Promise<PermitOffice[]> {
    const cacheKey = `popular:${limit}`

    // Check cache first
    const cached = cache.get<PermitOffice[]>(cacheKey)
    if (cached) {
      console.log(`[CACHE HIT] ${cacheKey}`)
      return cached
    }

    console.log(`[CACHE MISS] ${cacheKey} - querying database`)

    try {
      const queryText = `
        SELECT * FROM permit_offices
        WHERE active = true
          AND jurisdiction_type IN ('city', 'county')
          AND (building_permits = true OR electrical_permits = true OR plumbing_permits = true)
        ORDER BY
          (CASE WHEN online_applications = true THEN 1 ELSE 0 END) DESC,
          (CASE WHEN website IS NOT NULL THEN 1 ELSE 0 END) DESC,
          jurisdiction_type = 'city' DESC,
          city
        LIMIT $1
      `

      const records = await db.query<PermitOfficeRow>(queryText, [limit])
      const offices = records.map(this.mapPermitOfficeRow)

      // Cache for 1 hour (popular offices don't change often)
      cache.set(cacheKey, offices, 3600)

      console.log(`[DB QUERY] Found ${offices.length} popular offices`)
      return offices
    } catch (error) {
      console.error('[CACHE SERVICE] Popular query error:', error)
      return []
    }
  }

  /**
   * Health check for the cache service
   */
  async healthCheck(): Promise<{ database: boolean; cache: boolean }> {
    const dbHealth = await db.healthCheck()
    const cacheHealth = cache.getStats().size >= 0 // Cache is working if we can get stats

    return {
      database: dbHealth,
      cache: cacheHealth
    }
  }

  /**
   * Get cache and database statistics
   */
  getStats() {
    return {
      cache: cache.getStats(),
      database: db.getStats()
    }
  }

  /**
   * Clear all cached permit office data
   */
  clearCache() {
    cache.clear()
    console.log('[CACHE SERVICE] Cache cleared')
  }

  private mapPermitOfficeRow(row: PermitOfficeRow): PermitOffice {
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
      active: row.active,
      distance: row.distance
    }
  }
}

// Export singleton instance
export const permitOfficeCache = PermitOfficeCache.getInstance()