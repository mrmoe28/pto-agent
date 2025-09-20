/**
 * High-performance permit offices API v2
 * Uses connection pooling, advanced caching, and optimized queries
 */

import { NextRequest, NextResponse } from 'next/server'
import { permitOfficeCache } from '@/lib/cache-service'
import { georgiaPermitOffices } from '@/lib/georgia-permit-data'
import { type PermitOffice } from '@/lib/permit-office-search'

// Type for Georgia permit offices data which may have different structure
type GeorgiaPermitOffice = PermitOffice & {
  latitude?: string | number | null
  longitude?: string | number | null
  distance?: number
}

function normalizeText(text: string | null): string | null {
  if (!text) return null
  return text.trim().toLowerCase()
}

function normalizeState(state: string): string {
  const stateMapping: Record<string, string> = {
    'georgia': 'GA',
    'ga': 'GA',
    'geor': 'GA'
  }
  return stateMapping[state.toLowerCase()] || state.toUpperCase()
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export async function GET(request: NextRequest) {
  const startTime = performance.now()

  try {
    const { searchParams } = new URL(request.url)
    const latitudeParam = searchParams.get('lat')
    const longitudeParam = searchParams.get('lng')
    const rawCity = searchParams.get('city')?.trim() || null
    const rawCounty = searchParams.get('county')?.trim() || null
    const stateParam = searchParams.get('state')?.trim()
    const popular = searchParams.get('popular') === 'true'
    const healthCheck = searchParams.get('health') === 'true'

    // Health check endpoint
    if (healthCheck) {
      const health = await permitOfficeCache.healthCheck()
      const stats = permitOfficeCache.getStats()
      const duration = performance.now() - startTime

      return NextResponse.json({
        success: true,
        health,
        stats,
        performance: { duration: `${duration.toFixed(2)}ms` },
        timestamp: new Date().toISOString()
      })
    }

    // Popular offices endpoint
    if (popular) {
      const limit = parseInt(searchParams.get('limit') || '10', 10)
      const popularOffices = await permitOfficeCache.getPopular(limit)
      const duration = performance.now() - startTime

      return NextResponse.json({
        success: true,
        offices: popularOffices,
        count: popularOffices.length,
        source: 'database-popular-v2',
        cached: true,
        performance: { duration: `${duration.toFixed(2)}ms` }
      })
    }

    // Validate required parameters
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

    console.log(`[API v2] Query: city=${city}, county=${county}, state=${normalizedState}, coords=${latitude},${longitude}`)

    let databaseOffices: PermitOffice[] = []

    // Strategy 1: Try coordinate-based search first if coordinates are available
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      console.log(`[API v2] Using coordinate-based search`)
      databaseOffices = await permitOfficeCache.getByCoordinates(latitude, longitude, 25)
    }

    // Strategy 2: Fall back to location-based search if no coordinate results
    if (databaseOffices.length === 0) {
      console.log(`[API v2] Using location-based search`)
      databaseOffices = await permitOfficeCache.getByLocation(city, county, normalizedState)
    }

    // Strategy 3: Enhance results with distance calculations
    if (latitude && longitude && databaseOffices.length > 0) {
      databaseOffices = databaseOffices.map(office => {
        if (office.latitude && office.longitude && !office.distance) {
          const officeLat = Number(office.latitude)
          const officeLng = Number(office.longitude)
          if (!isNaN(officeLat) && !isNaN(officeLng)) {
            const distance = calculateDistance(latitude, longitude, officeLat, officeLng)
            return { ...office, distance }
          }
        }
        return office
      }).sort((a, b) => {
        if (a.distance && b.distance) return a.distance - b.distance
        if (a.distance && !b.distance) return -1
        if (!a.distance && b.distance) return 1
        return 0
      })
    }

    const duration = performance.now() - startTime

    // Return database results if found
    if (databaseOffices.length > 0) {
      return NextResponse.json({
        success: true,
        offices: databaseOffices.slice(0, 10), // Limit to 10 for performance
        count: databaseOffices.length,
        source: 'database-pooled-v2',
        cached: true,
        performance: {
          duration: `${duration.toFixed(2)}ms`,
          strategy: latitude && longitude ? 'coordinates+location' : 'location-only'
        }
      })
    }

    // Strategy 4: Fall back to Georgia static data for Georgia searches
    if (normalizedState === 'GA') {
      console.log(`[API v2] Using Georgia fallback data`)

      let filteredOffices = georgiaPermitOffices

      if (city) {
        filteredOffices = filteredOffices.filter(office =>
          office.city.toLowerCase().includes(city.toLowerCase())
        )
      }

      if (county && filteredOffices.length === 0) {
        filteredOffices = georgiaPermitOffices.filter(office =>
          office.county.toLowerCase().includes(county.toLowerCase())
        )
      }

      // Add distance calculations for fallback data
      if (latitude && longitude && filteredOffices.length > 0) {
        filteredOffices = filteredOffices.map(office => {
          const geoOffice = office as GeorgiaPermitOffice
          if (geoOffice.latitude && geoOffice.longitude) {
            const officeLat = Number(geoOffice.latitude)
            const officeLng = Number(geoOffice.longitude)
            if (!isNaN(officeLat) && !isNaN(officeLng)) {
              const distance = calculateDistance(latitude, longitude, officeLat, officeLng)
              return { ...office, distance }
            }
          }
          return office
        }).sort((a, b) => {
          const aDist = (a as GeorgiaPermitOffice).distance
          const bDist = (b as GeorgiaPermitOffice).distance
          if (aDist && bDist) return aDist - bDist
          return 0
        })
      }

      const finalDuration = performance.now() - startTime

      return NextResponse.json({
        success: true,
        offices: filteredOffices.slice(0, 10),
        count: filteredOffices.length,
        source: 'georgia-fallback-v2',
        cached: false,
        performance: {
          duration: `${finalDuration.toFixed(2)}ms`,
          strategy: 'fallback-data'
        }
      })
    }

    // No results found
    const finalDuration = performance.now() - startTime
    return NextResponse.json({
      success: false,
      error: 'No permit offices found for the specified location',
      offices: [],
      count: 0,
      source: 'no-results-v2',
      performance: { duration: `${finalDuration.toFixed(2)}ms` }
    })

  } catch (error) {
    console.error('[API v2] Error:', error)
    const duration = performance.now() - startTime

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        offices: [],
        count: 0,
        source: 'error-v2',
        performance: { duration: `${duration.toFixed(2)}ms` }
      },
      { status: 500 }
    )
  }
}

// Add cache management endpoints
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clearCache = searchParams.get('cache') === 'true'

    if (clearCache) {
      permitOfficeCache.clearCache()
      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid operation' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[API v2] Cache clear error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}