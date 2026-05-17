export const dynamic = 'force-dynamic';

/**
 * Optimized permit offices API using Next.js 15 caching features
 * This route provides better performance through explicit caching control
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getCachedPermitOfficesByLocation,
  getCachedPermitOfficesByCoordinates,
  getCachedPopularPermitOffices
} from '@/lib/next15-cache'
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
  // Note: 'use cache' directive requires Next.js canary version
  // Using manual caching instead for compatibility

  const start = performance.now()

  try {
    const { searchParams } = new URL(request.url)
    const latitudeParam = searchParams.get('lat')
    const longitudeParam = searchParams.get('lng')
    const rawCity = searchParams.get('city')?.trim() || null
    const rawCounty = searchParams.get('county')?.trim() || null
    const stateParam = searchParams.get('state')?.trim()
    const popular = searchParams.get('popular') === 'true'

    // Handle popular offices request
    if (popular) {
      const popularOffices = await getCachedPopularPermitOffices(10)
      const duration = performance.now() - start

      return NextResponse.json({
        success: true,
        offices: popularOffices,
        count: popularOffices.length,
        source: 'database-popular',
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

    console.log(`[OPTIMIZED] Searching: city=${city}, county=${county}, state=${normalizedState}, coords=${latitude},${longitude}`)

    let databaseOffices: PermitOffice[] = []

    // Try coordinate-based search first if coordinates are available
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      console.log(`[OPTIMIZED] Using coordinate-based search`)
      databaseOffices = await getCachedPermitOfficesByCoordinates(latitude, longitude, 25)
    }

    // Fall back to location-based search if no coordinate results
    if (databaseOffices.length === 0) {
      console.log(`[OPTIMIZED] Using location-based search`)
      databaseOffices = await getCachedPermitOfficesByLocation(city, county, normalizedState)
    }

    // Add distance calculations if coordinates are available
    if (latitude && longitude && databaseOffices.length > 0) {
      databaseOffices = databaseOffices.map(office => {
        if (office.latitude && office.longitude) {
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

    const duration = performance.now() - start

    // Return database results if found
    if (databaseOffices.length > 0) {
      return NextResponse.json({
        success: true,
        offices: databaseOffices.slice(0, 10), // Limit to 10 for performance
        count: databaseOffices.length,
        source: 'database-optimized',
        cached: true,
        performance: { duration: `${duration.toFixed(2)}ms` }
      })
    }

    // Fall back to Georgia static data for Georgia searches
    if (normalizedState === 'GA') {
      console.log(`[OPTIMIZED] Using Georgia fallback data`)

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

      const finalDuration = performance.now() - start

      return NextResponse.json({
        success: true,
        offices: filteredOffices.slice(0, 10),
        count: filteredOffices.length,
        source: 'georgia-fallback',
        cached: true,
        performance: { duration: `${finalDuration.toFixed(2)}ms` }
      })
    }

    // No results found
    const finalDuration = performance.now() - start
    return NextResponse.json({
      success: false,
      error: 'No permit offices found for the specified location',
      offices: [],
      count: 0,
      source: 'no-results',
      performance: { duration: `${finalDuration.toFixed(2)}ms` }
    })

  } catch (error) {
    console.error('[OPTIMIZED] API Error:', error)
    const duration = performance.now() - start

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        offices: [],
        count: 0,
        source: 'error',
        performance: { duration: `${duration.toFixed(2)}ms` }
      },
      { status: 500 }
    )
  }
}