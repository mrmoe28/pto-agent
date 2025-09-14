import { NextRequest, NextResponse } from 'next/server'
import { sql, query, PermitOffice } from '@/lib/neon'
import { georgiaPermitOffices } from '@/lib/georgia-permit-data'

// Search for permit offices by location
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latitude = searchParams.get('lat')
    const longitude = searchParams.get('lng')
    const city = searchParams.get('city')
    const county = searchParams.get('county')
    const state = searchParams.get('state')

    // Build the SQL query dynamically
    let queryText = `
      SELECT * FROM permit_offices
      WHERE active = true
    `
    const params: (string | number)[] = []
    let paramCount = 1

    // Filter by state
    if (state) {
      queryText += ` AND state = $${paramCount}`
      params.push(state.toUpperCase())
      paramCount++
    } else {
      queryText += ` AND state = $${paramCount}`
      params.push('GA') // Default to Georgia
      paramCount++
    }

    // Search by city if provided
    if (city) {
      queryText += ` AND city ILIKE $${paramCount}`
      params.push(`%${city}%`)
      paramCount++
    }

    // Search by county if provided
    if (county) {
      queryText += ` AND county ILIKE $${paramCount}`
      params.push(`%${county}%`)
      paramCount++
    }

    queryText += ` ORDER BY jurisdiction_type ASC, city ASC LIMIT 10`

    let offices: PermitOffice[] = []
    let error = null

    try {
      offices = await query<PermitOffice>(queryText, params)
    } catch (dbError) {
      error = dbError
      console.error('Database query error:', dbError)
    }

    if (error) {
      console.error('Neon database error:', error)
      // Fallback to static data if database fails
      return getFallbackGeorgiaOffices(city, county)
    }

    // If no results from database, check fallback data
    if (!offices || offices.length === 0) {
      return getFallbackGeorgiaOffices(city, county)
    }

    // Calculate distances if coordinates provided
    let enrichedOffices = offices
    if (latitude && longitude) {
      enrichedOffices = offices.map(office => ({
        ...office,
        distance: office.latitude && office.longitude 
          ? calculateDistance(
              parseFloat(latitude), 
              parseFloat(longitude),
              office.latitude,
              office.longitude
            )
          : null
      })).sort((a, b) => (a.distance || 999) - (b.distance || 999))
    }

    return NextResponse.json({
      success: true,
      offices: enrichedOffices,
      count: enrichedOffices.length,
      source: 'database'
    })

  } catch (error) {
    console.error('Permit offices search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Initialize database with Georgia permit offices
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action !== 'seed_georgia_data') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Insert Georgia permit offices using Neon
    const data: PermitOffice[] = []
    let error = null

    try {
      // First, try to create the table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS permit_offices (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),

          -- Location Information
          city VARCHAR(255) NOT NULL,
          county VARCHAR(255) NOT NULL,
          state VARCHAR(2) NOT NULL,
          jurisdiction_type VARCHAR(50) NOT NULL,

          -- Office Details
          department_name VARCHAR(255) NOT NULL,
          office_type VARCHAR(50) NOT NULL,

          -- Contact Information
          address VARCHAR(500) NOT NULL,
          phone VARCHAR(50),
          email VARCHAR(255),
          website VARCHAR(500),

          -- Operating Hours
          hours_monday VARCHAR(100),
          hours_tuesday VARCHAR(100),
          hours_wednesday VARCHAR(100),
          hours_thursday VARCHAR(100),
          hours_friday VARCHAR(100),
          hours_saturday VARCHAR(100),
          hours_sunday VARCHAR(100),

          -- Services Offered
          building_permits BOOLEAN DEFAULT false,
          electrical_permits BOOLEAN DEFAULT false,
          plumbing_permits BOOLEAN DEFAULT false,
          mechanical_permits BOOLEAN DEFAULT false,
          zoning_permits BOOLEAN DEFAULT false,
          planning_review BOOLEAN DEFAULT false,
          inspections BOOLEAN DEFAULT false,

          -- Online Services
          online_applications BOOLEAN DEFAULT false,
          online_payments BOOLEAN DEFAULT false,
          permit_tracking BOOLEAN DEFAULT false,
          online_portal_url VARCHAR(500),

          -- Geographic Data
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          service_area_bounds JSONB,

          -- Metadata
          data_source VARCHAR(50) DEFAULT 'manual',
          last_verified TIMESTAMPTZ,
          crawl_frequency VARCHAR(50) DEFAULT 'monthly',
          active BOOLEAN DEFAULT true,

          -- Unique constraint
          UNIQUE(city, county, department_name)
        )
      `

      // Insert or update the Georgia permit offices
      for (const office of georgiaPermitOffices) {
        const result = await sql`
          INSERT INTO permit_offices (
            city, county, state, jurisdiction_type, department_name, office_type,
            address, phone, email, website,
            hours_monday, hours_tuesday, hours_wednesday, hours_thursday,
            hours_friday, hours_saturday, hours_sunday,
            building_permits, electrical_permits, plumbing_permits,
            mechanical_permits, zoning_permits, planning_review, inspections,
            online_applications, online_payments, permit_tracking, online_portal_url,
            latitude, longitude, service_area_bounds,
            data_source, last_verified, crawl_frequency, active
          ) VALUES (
            ${office.city}, ${office.county}, ${office.state}, ${office.jurisdiction_type},
            ${office.department_name}, ${office.office_type}, ${office.address},
            ${office.phone}, ${office.email}, ${office.website},
            ${office.hours_monday}, ${office.hours_tuesday}, ${office.hours_wednesday},
            ${office.hours_thursday}, ${office.hours_friday}, ${office.hours_saturday || null},
            ${office.hours_sunday || null}, ${office.building_permits}, ${office.electrical_permits},
            ${office.plumbing_permits}, ${office.mechanical_permits}, ${office.zoning_permits},
            ${office.planning_review}, ${office.inspections}, ${office.online_applications},
            ${office.online_payments}, ${office.permit_tracking}, ${office.online_portal_url},
            ${office.latitude}, ${office.longitude}, ${office.service_area_bounds},
            ${office.data_source}, ${office.last_verified}, ${office.crawl_frequency}, ${office.active}
          )
          ON CONFLICT (city, county, department_name)
          DO UPDATE SET
            updated_at = NOW(),
            state = EXCLUDED.state,
            jurisdiction_type = EXCLUDED.jurisdiction_type,
            office_type = EXCLUDED.office_type,
            address = EXCLUDED.address,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            website = EXCLUDED.website,
            hours_monday = EXCLUDED.hours_monday,
            hours_tuesday = EXCLUDED.hours_tuesday,
            hours_wednesday = EXCLUDED.hours_wednesday,
            hours_thursday = EXCLUDED.hours_thursday,
            hours_friday = EXCLUDED.hours_friday,
            hours_saturday = EXCLUDED.hours_saturday,
            hours_sunday = EXCLUDED.hours_sunday,
            building_permits = EXCLUDED.building_permits,
            electrical_permits = EXCLUDED.electrical_permits,
            plumbing_permits = EXCLUDED.plumbing_permits,
            mechanical_permits = EXCLUDED.mechanical_permits,
            zoning_permits = EXCLUDED.zoning_permits,
            planning_review = EXCLUDED.planning_review,
            inspections = EXCLUDED.inspections,
            online_applications = EXCLUDED.online_applications,
            online_payments = EXCLUDED.online_payments,
            permit_tracking = EXCLUDED.permit_tracking,
            online_portal_url = EXCLUDED.online_portal_url,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            service_area_bounds = EXCLUDED.service_area_bounds,
            data_source = EXCLUDED.data_source,
            last_verified = EXCLUDED.last_verified,
            crawl_frequency = EXCLUDED.crawl_frequency,
            active = EXCLUDED.active
          RETURNING *
        `
        data.push(result[0] as PermitOffice)
      }
    } catch (dbError) {
      error = dbError
      console.error('Database seed error:', dbError)
    }

    if (error) {
      console.error('Database seed error:', error)
      return NextResponse.json(
        { error: 'Failed to seed database', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Georgia permit offices added to database',
      count: data?.length || 0,
      offices: data
    })

  } catch (error) {
    console.error('Database seed error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Fallback to static Georgia data
function getFallbackGeorgiaOffices(city?: string | null, county?: string | null) {
  let offices = georgiaPermitOffices

  if (city) {
    offices = offices.filter(office => 
      office.city.toLowerCase().includes(city.toLowerCase())
    )
  }

  if (county) {
    offices = offices.filter(office => 
      office.county.toLowerCase().includes(county.toLowerCase())
    )
  }

  return NextResponse.json({
    success: true,
    offices: offices,
    count: offices.length,
    source: 'fallback'
  })
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c // Distance in miles
}