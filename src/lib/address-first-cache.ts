/**
 * Address-first cache service - optimized for 100% coverage
 * Primary strategy: Fast address-based searches
 * Secondary enhancement: Distance calculations when needed
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
}

interface PermitOfficeWithDistance extends PermitOffice {
  distance?: number
}

export class AddressFirstCache {
  private static instance: AddressFirstCache

  public static getInstance(): AddressFirstCache {
    if (!AddressFirstCache.instance) {
      AddressFirstCache.instance = new AddressFirstCache()
    }
    return AddressFirstCache.instance
  }

  /**
   * PRIMARY STRATEGY: Fast address-based search (100% coverage)
   * No dependency on coordinates - works for all offices
   */
  async searchByAddress(
    city: string | null,
    county: string | null,
    state: string
  ): Promise<PermitOffice[]> {
    const cacheKey = `address:${state}:${county || ''}:${city || ''}`

    // Check cache first
    const cached = cache.get<PermitOffice[]>(cacheKey)
    if (cached) {
      console.log(`[ADDRESS CACHE HIT] ${cacheKey}`)
      return cached
    }

    console.log(`[ADDRESS CACHE MISS] ${cacheKey} - querying database`)

    try {
      let queryText: string
      let params: unknown[]

      if (city && county) {
        // Most specific search
        queryText = `
          SELECT * FROM permit_offices
          WHERE active = true
            AND (
              city ILIKE $1 OR city ILIKE $2 OR
              address ILIKE $3
            )
            AND (
              county ILIKE $4 OR county ILIKE $5
            )
            AND state = $6
          ORDER BY
            jurisdiction_type = 'city' DESC,
            (CASE WHEN online_applications = true THEN 1 ELSE 0 END) DESC,
            city, county
          LIMIT 20
        `
        params = [city, `%${city}%`, `%${city}%`, county, `%${county}%`, state]
      } else if (city) {
        // City-focused search
        queryText = `
          SELECT * FROM permit_offices
          WHERE active = true
            AND (
              city ILIKE $1 OR city ILIKE $2 OR
              address ILIKE $3
            )
            AND state = $4
          ORDER BY
            jurisdiction_type = 'city' DESC,
            (CASE WHEN online_applications = true THEN 1 ELSE 0 END) DESC,
            city, county
          LIMIT 20
        `
        params = [city, `%${city}%`, `%${city}%`, state]
      } else if (county) {
        // County-focused search
        queryText = `
          SELECT * FROM permit_offices
          WHERE active = true
            AND (
              county ILIKE $1 OR county ILIKE $2 OR
              address ILIKE $3
            )
            AND state = $4
          ORDER BY
            jurisdiction_type = 'city' DESC,
            (CASE WHEN online_applications = true THEN 1 ELSE 0 END) DESC,
            city, county
          LIMIT 20
        `
        params = [county, `%${county}%`, `%${county}%`, state]
      } else {
        // State-wide search with best offices first
        queryText = `
          SELECT * FROM permit_offices
          WHERE active = true
            AND state = $1
          ORDER BY
            jurisdiction_type = 'city' DESC,
            (CASE WHEN online_applications = true THEN 1 ELSE 0 END) DESC,
            (CASE WHEN website IS NOT NULL THEN 1 ELSE 0 END) DESC,
            city, county
          LIMIT 20
        `
        params = [state]
      }

      const records = await db.query<PermitOfficeRow>(queryText, params)
      const offices = records.map(this.mapPermitOfficeRow)

      // Cache for 10 minutes (addresses don't change often)
      cache.set(cacheKey, offices, 600)

      console.log(`[ADDRESS SEARCH] Found ${offices.length} offices for ${cacheKey}`)
      return offices
    } catch (error) {
      console.error('[ADDRESS CACHE] Query error:', error)
      return []
    }
  }

  /**
   * SECONDARY ENHANCEMENT: Add distance calculations when user location is known
   * Only used when user provides coordinates
   */
  async addDistanceCalculations(
    offices: PermitOffice[],
    userLat: number,
    userLng: number
  ): Promise<PermitOfficeWithDistance[]> {
    const cacheKey = `distance:${userLat.toFixed(4)}:${userLng.toFixed(4)}:${offices.length}`

    // Check cache first
    const cached = cache.get<PermitOfficeWithDistance[]>(cacheKey)
    if (cached) {
      console.log(`[DISTANCE CACHE HIT] ${cacheKey}`)
      return cached
    }

    console.log(`[DISTANCE CALCULATION] Adding distances for ${offices.length} offices`)

    try {
      const officesWithDistance: PermitOfficeWithDistance[] = []

      for (const office of offices) {
        if (office.latitude && office.longitude) {
          // Use existing coordinates
          const officeLat = Number(office.latitude)
          const officeLng = Number(office.longitude)

          if (!isNaN(officeLat) && !isNaN(officeLng)) {
            const distance = this.calculateDistance(userLat, userLng, officeLat, officeLng)
            officesWithDistance.push({ ...office, distance })
            continue
          }
        }

        // Geocode address if no coordinates
        const coords = await this.geocodeAddress(office.address)
        if (coords) {
          const distance = this.calculateDistance(userLat, userLng, coords.lat, coords.lng)

          // Update office with new coordinates (for next time)
          this.updateOfficeCoordinates(office.id, coords.lat, coords.lng)

          officesWithDistance.push({
            ...office,
            latitude: coords.lat,
            longitude: coords.lng,
            distance
          })
        } else {
          // No coordinates available, add without distance
          officesWithDistance.push(office)
        }
      }

      // Sort by distance
      const sortedOffices = officesWithDistance.sort((a, b) => {
        if (a.distance && b.distance) return a.distance - b.distance
        if (a.distance && !b.distance) return -1
        if (!a.distance && b.distance) return 1
        return 0
      })

      // Cache for 5 minutes (distance calculations don't change much)
      cache.set(cacheKey, sortedOffices, 300)

      return sortedOffices
    } catch (error) {
      console.error('[DISTANCE CALCULATION] Error:', error)
      return offices.map(office => ({ ...office }))
    }
  }

  /**
   * Get popular offices (cached aggressively since they don't change often)
   */
  async getPopularOffices(limit: number = 10): Promise<PermitOffice[]> {
    const cacheKey = `popular:${limit}`

    const cached = cache.get<PermitOffice[]>(cacheKey)
    if (cached) {
      console.log(`[POPULAR CACHE HIT] ${cacheKey}`)
      return cached
    }

    console.log(`[POPULAR SEARCH] Querying top ${limit} offices`)

    try {
      const queryText = `
        SELECT * FROM permit_offices
        WHERE active = true
          AND jurisdiction_type IN ('city', 'county')
          AND (building_permits = true OR electrical_permits = true OR plumbing_permits = true)
        ORDER BY
          (CASE WHEN online_applications = true THEN 1 ELSE 0 END) DESC,
          (CASE WHEN online_payments = true THEN 1 ELSE 0 END) DESC,
          (CASE WHEN website IS NOT NULL THEN 1 ELSE 0 END) DESC,
          jurisdiction_type = 'city' DESC,
          city
        LIMIT $1
      `

      const records = await db.query<PermitOfficeRow>(queryText, [limit])
      const offices = records.map(this.mapPermitOfficeRow)

      // Cache for 1 hour (popular offices don't change)
      cache.set(cacheKey, offices, 3600)

      console.log(`[POPULAR SEARCH] Found ${offices.length} popular offices`)
      return offices
    } catch (error) {
      console.error('[POPULAR SEARCH] Error:', error)
      return []
    }
  }

  /**
   * Get offices missing coordinates (for background population)
   */
  async getOfficesWithoutCoordinates(limit: number = 50): Promise<PermitOffice[]> {
    try {
      const queryText = `
        SELECT * FROM permit_offices
        WHERE active = true
          AND (latitude IS NULL OR longitude IS NULL)
          AND address IS NOT NULL
          AND address != ''
        ORDER BY
          jurisdiction_type = 'city' DESC,
          last_verified DESC NULLS LAST
        LIMIT $1
      `

      const records = await db.query<PermitOfficeRow>(queryText, [limit])
      return records.map(this.mapPermitOfficeRow)
    } catch (error) {
      console.error('[MISSING COORDS] Query error:', error)
      return []
    }
  }

  /**
   * Geocode an address to coordinates
   */
  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      // Try LocationIQ first (if you have API key)
      if (process.env.LOCATIONIQ_ACCESS_TOKEN) {
        const response = await fetch(
          `https://us1.locationiq.com/v1/search.php?key=${process.env.LOCATIONIQ_ACCESS_TOKEN}&q=${encodeURIComponent(address)}&format=json&limit=1`
        )

        if (response.ok) {
          const data = await response.json()
          if (data.length > 0) {
            return {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            }
          }
        }
      }

      // Fallback to Google Maps (if you have API key)
      if (process.env.GOOGLE_MAPS_API_KEY) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
        )

        if (response.ok) {
          const data = await response.json()
          if (data.results.length > 0) {
            const location = data.results[0].geometry.location
            return {
              lat: location.lat,
              lng: location.lng
            }
          }
        }
      }

      return null
    } catch (error) {
      console.error('[GEOCODING] Error:', error)
      return null
    }
  }

  /**
   * Update office coordinates in database (background task)
   */
  private async updateOfficeCoordinates(officeId: string, lat: number, lng: number): Promise<void> {
    try {
      await db.query(
        'UPDATE permit_offices SET latitude = $1, longitude = $2, updated_at = NOW() WHERE id = $3',
        [lat, lng, officeId]
      )
      console.log(`[COORD UPDATE] Updated coordinates for office ${officeId}`)
    } catch (error) {
      console.error('[COORD UPDATE] Error:', error)
    }
  }

  /**
   * Calculate distance between two points in miles
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Health check for the cache service
   */
  async healthCheck(): Promise<{ database: boolean; cache: boolean; coverage: number }> {
    const dbHealth = await db.healthCheck()
    const cacheHealth = cache.getStats().size >= 0

    // Calculate coverage (offices with vs without coordinates)
    let coverage = 0
    try {
      const totalQuery = await db.query('SELECT COUNT(*) as total FROM permit_offices WHERE active = true')
      const coordsQuery = await db.query('SELECT COUNT(*) as with_coords FROM permit_offices WHERE active = true AND latitude IS NOT NULL AND longitude IS NOT NULL')

      const total = (totalQuery[0] as { total: string }).total
      const withCoords = (coordsQuery[0] as { with_coords: string }).with_coords

      coverage = Math.round((parseInt(withCoords) / parseInt(total)) * 100)
    } catch (error) {
      console.error('[HEALTH CHECK] Coverage calculation error:', error)
    }

    return {
      database: dbHealth,
      cache: cacheHealth,
      coverage
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
   * Clear all cached data
   */
  clearCache() {
    cache.clear()
    console.log('[ADDRESS CACHE] Cache cleared')
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
      active: row.active
    }
  }
}

// Export singleton instance
export const addressFirstCache = AddressFirstCache.getInstance()