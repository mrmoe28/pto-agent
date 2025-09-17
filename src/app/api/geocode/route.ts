import { NextRequest, NextResponse } from 'next/server'

// Geocoding service with LocationIQ primary, Google Maps fallback
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    // Use Google Places API as primary geocoding method
    const googleResult = await geocodeWithGoogle(address)
    if (googleResult) {
      return NextResponse.json({
        success: true,
        source: 'google',
        ...googleResult
      })
    }

    // Fallback to LocationIQ if Google fails
    const locationiqResult = await geocodeWithLocationIQ(address)
    if (locationiqResult) {
      return NextResponse.json({
        success: true,
        source: 'locationiq',
        ...locationiqResult
      })
    }

    return NextResponse.json(
      { error: 'Could not geocode address' },
      { status: 404 }
    )

  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function geocodeWithLocationIQ(address: string) {
  const LOCATIONIQ_TOKEN = process.env.LOCATIONIQ_ACCESS_TOKEN
  
  if (!LOCATIONIQ_TOKEN) {
    console.warn('LocationIQ token not configured - skipping LocationIQ geocoding')
    return null
  }

  try {
    const response = await fetch(
      `https://us1.locationiq.com/v1/search.php?key=${LOCATIONIQ_TOKEN}&q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`
    )

    if (!response.ok) {
      throw new Error(`LocationIQ API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data && data.length > 0) {
      const result = data[0]
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formatted_address: result.display_name,
        city: extractCity(result.display_name),
        county: extractCounty(result.display_name),
        state: extractState(result.display_name)
      }
    }

    return null
  } catch (error) {
    console.error('LocationIQ error:', error)
    return null
  }
}

async function geocodeWithGoogle(address: string) {
  const GOOGLE_PLACES_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
  
  if (!GOOGLE_PLACES_KEY) {
    console.warn('Google Places API key not configured - skipping Google Places geocoding')
    return null
  }

  try {
    // First, get place predictions using Places Autocomplete API
    const autocompleteResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(address)}&key=${GOOGLE_PLACES_KEY}&types=address&components=country:us`
    )

    if (!autocompleteResponse.ok) {
      throw new Error(`Google Places Autocomplete API error: ${autocompleteResponse.status}`)
    }

    const autocompleteData = await autocompleteResponse.json()
    
    if (autocompleteData.predictions && autocompleteData.predictions.length > 0) {
      const prediction = autocompleteData.predictions[0]
      const placeId = prediction.place_id
      
      // Now get detailed place information using Place Details API
      const detailsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_PLACES_KEY}&fields=geometry,formatted_address,address_components`
      )

      if (!detailsResponse.ok) {
        throw new Error(`Google Places Details API error: ${detailsResponse.status}`)
      }

      const detailsData = await detailsResponse.json()
      
      if (detailsData.result) {
        const result = detailsData.result
        const location = result.geometry.location
        
        // Extract city, county, state from address components
        const components = result.address_components || []
        const city = components.find((c: { types: string[] }) => c.types.includes('locality'))?.long_name || ''
        const county = components.find((c: { types: string[] }) => c.types.includes('administrative_area_level_2'))?.long_name || ''
        const state = components.find((c: { types: string[] }) => c.types.includes('administrative_area_level_1'))?.short_name || ''

        return {
          latitude: location.lat,
          longitude: location.lng,
          formatted_address: result.formatted_address,
          city: city,
          county: county.replace(' County', ''), // Remove 'County' suffix
          state: state
        }
      }
    }

    return null
  } catch (error) {
    console.error('Google Places error:', error)
    return null
  }
}

// Helper functions to extract location info from LocationIQ results
function extractCity(displayName: string): string {
  const parts = displayName.split(', ')
  // Usually city is the first or second part
  for (const part of parts.slice(0, 3)) {
    if (!part.match(/^\d/) && !part.includes('County') && part.length > 2) {
      return part
    }
  }
  return ''
}

function extractCounty(displayName: string): string {
  const match = displayName.match(/([^,]+)\s+County/)
  return match ? match[1] : ''
}

function extractState(displayName: string): string {
  const parts = displayName.split(', ')
  // State is usually near the end, before country
  for (const part of parts.reverse()) {
    if (part.match(/^[A-Z]{2}$/)) {
      return part
    }
  }
  return ''
}