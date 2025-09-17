import { NextRequest, NextResponse } from 'next/server'
import { db, permitOffices, PermitOffice } from '@/lib/db'
import { georgiaPermitOffices } from '@/lib/georgia-permit-data'
import { eq, and, ilike } from 'drizzle-orm'

// Search for permit offices by location
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const officeId = searchParams.get('id')
    const latitude = searchParams.get('lat')
    const longitude = searchParams.get('lng')
    const city = searchParams.get('city')
    const county = searchParams.get('county')
    const state = searchParams.get('state') || 'GA'

    let offices: PermitOffice[] = []
    let error = null

    if (officeId) {
      try {
        const result = await db
          .select()
          .from(permitOffices)
          .where(
            and(
              eq(permitOffices.id, officeId),
              eq(permitOffices.active, true)
            )
          )
          .limit(1)

        if (result.length > 0) {
          return NextResponse.json({
            success: true,
            offices: result,
            count: result.length,
            source: 'database'
          })
        }
      } catch (dbError) {
        error = dbError
        console.error('Database query error:', dbError)
      }

      return NextResponse.json({
        success: true,
        offices: [],
        count: 0,
        source: 'database'
      })
    }

    try {
      // Build the Drizzle query
      const whereConditions = [eq(permitOffices.active, true)]
      
      // Filter by state
      const stateFilter = state ? state.toUpperCase() : 'GA'
      whereConditions.push(eq(permitOffices.state, stateFilter))

      // If we have both city and county, prioritize county match
      // This helps find offices in the same county even if city doesn't match exactly
      if (county) {
        whereConditions.push(ilike(permitOffices.county, `%${county}%`))
      } else if (city) {
        // Only search by city if no county is provided
        whereConditions.push(ilike(permitOffices.city, `%${city}%`))
      }

      // Execute the query
      offices = await db
        .select()
        .from(permitOffices)
        .where(and(...whereConditions))
        .orderBy(permitOffices.jurisdictionType, permitOffices.city)
        .limit(10)
    } catch (dbError) {
      error = dbError
      console.error('Database query error:', dbError)
    }

    if (error || !offices || offices.length === 0) {
      console.log('Using fallback data')
      // Fallback to static data if database fails or no results
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
              parseFloat(office.latitude.toString()),
              parseFloat(office.longitude.toString())
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

    const data: PermitOffice[] = []
    let error = null

    try {
      // Insert or update the Georgia permit offices using Drizzle
      for (const office of georgiaPermitOffices) {
        try {
          const result = await db
            .insert(permitOffices)
            .values({
              city: office.city,
              county: office.county,
              state: office.state,
              jurisdictionType: office.jurisdiction_type,
              departmentName: office.department_name,
              officeType: office.office_type,
              address: office.address,
              phone: office.phone,
              email: office.email,
              website: office.website,
              hoursMonday: office.hours_monday,
              hoursTuesday: office.hours_tuesday,
              hoursWednesday: office.hours_wednesday,
              hoursThursday: office.hours_thursday,
              hoursFriday: office.hours_friday,
              hoursSaturday: office.hours_saturday,
              hoursSunday: office.hours_sunday,
              buildingPermits: office.building_permits,
              electricalPermits: office.electrical_permits,
              plumbingPermits: office.plumbing_permits,
              mechanicalPermits: office.mechanical_permits,
              zoningPermits: office.zoning_permits,
              planningReview: office.planning_review,
              inspections: office.inspections,
              onlineApplications: office.online_applications,
              onlinePayments: office.online_payments,
              permitTracking: office.permit_tracking,
              onlinePortalUrl: office.online_portal_url,
              latitude: office.latitude != null ? String(office.latitude) : null,
              longitude: office.longitude != null ? String(office.longitude) : null,
              serviceAreaBounds: office.service_area_bounds,
              dataSource: office.data_source,
              lastVerified: office.last_verified ? new Date(office.last_verified) : null,
              crawlFrequency: office.crawl_frequency,
              active: office.active
            })
            .onConflictDoUpdate({
              target: [permitOffices.city, permitOffices.county, permitOffices.departmentName],
              set: {
                updatedAt: new Date(),
                state: office.state,
                jurisdictionType: office.jurisdiction_type,
                officeType: office.office_type,
                address: office.address,
                phone: office.phone,
                email: office.email,
                website: office.website,
                hoursMonday: office.hours_monday,
                hoursTuesday: office.hours_tuesday,
                hoursWednesday: office.hours_wednesday,
                hoursThursday: office.hours_thursday,
                hoursFriday: office.hours_friday,
                hoursSaturday: office.hours_saturday,
                hoursSunday: office.hours_sunday,
                buildingPermits: office.building_permits,
                electricalPermits: office.electrical_permits,
                plumbingPermits: office.plumbing_permits,
                mechanicalPermits: office.mechanical_permits,
                zoningPermits: office.zoning_permits,
                planningReview: office.planning_review,
                inspections: office.inspections,
                onlineApplications: office.online_applications,
                onlinePayments: office.online_payments,
                permitTracking: office.permit_tracking,
                onlinePortalUrl: office.online_portal_url,
                latitude: office.latitude != null ? String(office.latitude) : null,
                longitude: office.longitude != null ? String(office.longitude) : null,
                serviceAreaBounds: office.service_area_bounds,
                dataSource: office.data_source,
                lastVerified: office.last_verified ? new Date(office.last_verified) : null,
                crawlFrequency: office.crawl_frequency,
                active: office.active
              }
            })
            .returning()
          
          data.push(result[0])
        } catch (insertError) {
          console.error('Error inserting office:', office.department_name, insertError)
          // Continue with other offices even if one fails
        }
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

  // If we have both city and county, prioritize county match
  // This helps find offices in the same county even if city doesn't match exactly
  if (county) {
    offices = offices.filter(office => 
      office.county.toLowerCase().includes(county.toLowerCase())
    )
  } else if (city) {
    // Only search by city if no county is provided
    offices = offices.filter(office => 
      office.city.toLowerCase().includes(city.toLowerCase())
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
