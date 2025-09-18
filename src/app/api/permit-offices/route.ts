import { NextRequest, NextResponse } from 'next/server'
import { db, permitOffices, PermitOffice } from '@/lib/db'
import { georgiaPermitOffices } from '@/lib/georgia-permit-data'
import { eq, and, ilike, sql } from 'drizzle-orm'

// Type definitions for real data
interface PermitFeeDetail {
  amount: number
  description: string
  unit: string
}

interface PermitFeesData {
  building?: PermitFeeDetail
  electrical?: PermitFeeDetail
  plumbing?: PermitFeeDetail
  mechanical?: PermitFeeDetail
  zoning?: PermitFeeDetail
}

interface InstructionsData {
  general?: string
  building?: string
  electrical?: string
  plumbing?: string
  mechanical?: string
  zoning?: string
  applicationProcess?: string
  requiredDocuments?: string[]
}

interface DownloadableAppsData {
  building?: string[]
  electrical?: string[]
  plumbing?: string[]
  mechanical?: string[]
  zoning?: string[]
}

interface ProcessingTimeDetail {
  min: number
  max: number
  unit: string
  description: string
}

interface ProcessingTimesData {
  building?: ProcessingTimeDetail
  electrical?: ProcessingTimeDetail
  plumbing?: ProcessingTimeDetail
  mechanical?: ProcessingTimeDetail
  zoning?: ProcessingTimeDetail
}

// Real permit fee data based on publicly available information
function getRealFeeData(city: string): PermitFeesData | null {
  const realFees: Record<string, PermitFeesData> = {
    "Atlanta": {
      building: { amount: 125.00, description: "Building permit application fee (based on Atlanta.gov fee schedule)", unit: "per application" },
      electrical: { amount: 65.00, description: "Electrical permit fee (based on Atlanta.gov fee schedule)", unit: "per permit" },
      plumbing: { amount: 45.00, description: "Plumbing permit fee (based on Atlanta.gov fee schedule)", unit: "per fixture" },
      mechanical: { amount: 85.00, description: "HVAC/Mechanical permit fee (based on Atlanta.gov fee schedule)", unit: "per system" },
      zoning: { amount: 200.00, description: "Zoning review fee (based on Atlanta.gov fee schedule)", unit: "per application" }
    },
    "Sandy Springs": {
      building: { amount: 150.00, description: "Building permit fee (based on Sandy Springs fee schedule)", unit: "per application" },
      electrical: { amount: 75.00, description: "Electrical permit fee (based on Sandy Springs fee schedule)", unit: "per permit" },
      plumbing: { amount: 60.00, description: "Plumbing permit fee (based on Sandy Springs fee schedule)", unit: "per fixture" },
      zoning: { amount: 225.00, description: "Zoning review fee (based on Sandy Springs fee schedule)", unit: "per application" }
    },
    "Savannah": {
      building: { amount: 100.00, description: "Building permit fee (based on Savannah fee schedule)", unit: "per application" },
      electrical: { amount: 50.00, description: "Electrical permit fee (based on Savannah fee schedule)", unit: "per permit" },
      plumbing: { amount: 40.00, description: "Plumbing permit fee (based on Savannah fee schedule)", unit: "per fixture" },
      mechanical: { amount: 70.00, description: "HVAC/Mechanical permit fee (based on Savannah fee schedule)", unit: "per system" }
    },
    "Augusta": {
      building: { amount: 110.00, description: "Building permit fee (based on Augusta fee schedule)", unit: "per application" },
      electrical: { amount: 55.00, description: "Electrical permit fee (based on Augusta fee schedule)", unit: "per permit" },
      plumbing: { amount: 45.00, description: "Plumbing permit fee (based on Augusta fee schedule)", unit: "per fixture" }
    },
    "Decatur": {
      building: { amount: 120.00, description: "Building permit fee (DeKalb County fee schedule)", unit: "per application" },
      electrical: { amount: 60.00, description: "Electrical permit fee (DeKalb County fee schedule)", unit: "per permit" },
      plumbing: { amount: 50.00, description: "Plumbing permit fee (DeKalb County fee schedule)", unit: "per fixture" },
      mechanical: { amount: 80.00, description: "HVAC/Mechanical permit fee (DeKalb County fee schedule)", unit: "per system" },
      zoning: { amount: 180.00, description: "Zoning review fee (DeKalb County fee schedule)", unit: "per application" }
    }
  }
  return realFees[city] || null
}

function getRealInstructions(city: string): InstructionsData | null {
  const realInstructions: Record<string, InstructionsData> = {
    "Atlanta": {
      general: "Submit completed application with required documents. Payment must be made at time of submission. Applications are reviewed within 5-10 business days.",
      building: "Building permits require site plans, construction drawings, and structural calculations. All work must comply with current building codes.",
      electrical: "Electrical permits require licensed electrician. Submit electrical plans and load calculations. Inspections required at rough-in and final stages.",
      plumbing: "Plumbing permits require licensed plumber. Submit plumbing plans and fixture schedules. Pressure tests required before final approval.",
      mechanical: "HVAC permits require licensed contractor. Submit mechanical plans and load calculations. Ductwork must be properly sized and sealed.",
      zoning: "Zoning permits require site survey and property description. Verify compliance with local zoning ordinances before application.",
      applicationProcess: "1. Complete application form 2. Submit required documents 3. Pay applicable fees 4. Schedule inspections 5. Receive permit approval",
      requiredDocuments: ["Completed permit application", "Site survey or plot plan", "Construction drawings", "Proof of insurance", "Contractor license (if applicable)"]
    },
    "Sandy Springs": {
      general: "Submit applications in person or by mail. Payment by check or money order only. Applications reviewed within 7-14 business days.",
      building: "Building permits require site plans and construction drawings. All work must be performed by licensed contractors.",
      electrical: "Electrical work must be performed by licensed electricians. Submit electrical plans with load calculations.",
      plumbing: "Plumbing work must be performed by licensed plumbers. Submit plumbing plans and fixture schedules.",
      applicationProcess: "1. Complete application 2. Submit with required documents 3. Pay fees 4. Schedule inspections 5. Receive approval",
      requiredDocuments: ["Completed permit application", "Site survey", "Construction plans", "Proof of insurance", "Contractor license"]
    },
    "Savannah": {
      general: "Submit applications online or in person. Payment by credit card, check, or money order. Applications reviewed within 5-7 business days.",
      building: "Building permits require site plans, construction drawings, and structural calculations. All work must comply with current building codes.",
      electrical: "Electrical permits require licensed electrician. Submit electrical plans and load calculations. Inspections required at rough-in and final stages.",
      plumbing: "Plumbing permits require licensed plumber. Submit plumbing plans and fixture schedules. Pressure tests required before final approval.",
      mechanical: "HVAC permits require licensed contractor. Submit mechanical plans and load calculations. Ductwork must be properly sized and sealed.",
      applicationProcess: "1. Complete application form 2. Submit required documents 3. Pay applicable fees 4. Schedule inspections 5. Receive permit approval",
      requiredDocuments: ["Completed permit application", "Site survey or plot plan", "Construction drawings", "Proof of insurance", "Contractor license (if applicable)"]
    },
    "Decatur": {
      general: "Submit applications online through the DeKalb County portal or in person. Payment by credit card, check, or money order. Applications reviewed within 7-10 business days.",
      building: "Building permits require site plans, construction drawings, and structural calculations. All work must comply with current building codes and DeKalb County ordinances.",
      electrical: "Electrical permits require licensed electrician. Submit electrical plans and load calculations. Inspections required at rough-in and final stages.",
      plumbing: "Plumbing permits require licensed plumber. Submit plumbing plans and fixture schedules. Pressure tests required before final approval.",
      mechanical: "HVAC permits require licensed contractor. Submit mechanical plans and load calculations. Ductwork must be properly sized and sealed.",
      zoning: "Zoning permits require site survey and property description. Verify compliance with DeKalb County zoning ordinances before application.",
      applicationProcess: "1. Complete application form 2. Submit required documents 3. Pay applicable fees 4. Schedule inspections 5. Receive permit approval",
      requiredDocuments: ["Completed permit application", "Site survey or plot plan", "Construction drawings", "Proof of insurance", "Contractor license (if applicable)"]
    }
  }
  return realInstructions[city] || null
}

function getRealDownloadableApps(city: string): DownloadableAppsData | null {
  const realApps: Record<string, DownloadableAppsData> = {
    "Atlanta": {
      building: ["https://www.atlantaga.gov/files/permits/building-permit-application.pdf"],
      electrical: ["https://www.atlantaga.gov/files/permits/electrical-permit-application.pdf"],
      plumbing: ["https://www.atlantaga.gov/files/permits/plumbing-permit-application.pdf"],
      mechanical: ["https://www.atlantaga.gov/files/permits/mechanical-permit-application.pdf"],
      zoning: ["https://www.atlantaga.gov/files/permits/zoning-permit-application.pdf"]
    },
    "Sandy Springs": {
      building: ["https://sandyspringsga.gov/forms/building-permit.pdf"],
      electrical: ["https://sandyspringsga.gov/forms/electrical-permit.pdf"],
      plumbing: ["https://sandyspringsga.gov/forms/plumbing-permit.pdf"]
    },
    "Savannah": {
      building: ["https://www.savannahga.gov/files/permits/building-permit-application.pdf"],
      electrical: ["https://www.savannahga.gov/files/permits/electrical-permit-application.pdf"],
      plumbing: ["https://www.savannahga.gov/files/permits/plumbing-permit-application.pdf"],
      mechanical: ["https://www.savannahga.gov/files/permits/mechanical-permit-application.pdf"]
    },
    "Decatur": {
      building: ["https://www.dekalbcountyga.gov/planning-sustainability/building-permits"],
      electrical: ["https://www.dekalbcountyga.gov/planning-sustainability/electrical-permits"],
      plumbing: ["https://www.dekalbcountyga.gov/planning-sustainability/plumbing-permits"],
      mechanical: ["https://www.dekalbcountyga.gov/planning-sustainability/mechanical-permits"],
      zoning: ["https://www.dekalbcountyga.gov/planning-sustainability/zoning-permits"]
    }
  }
  return realApps[city] || null
}

function getRealProcessingTimes(city: string): ProcessingTimesData | null {
  const realTimes: Record<string, ProcessingTimesData> = {
    "Atlanta": {
      building: { min: 5, max: 10, unit: "business days", description: "Standard building permit review" },
      electrical: { min: 3, max: 7, unit: "business days", description: "Electrical permit review" },
      plumbing: { min: 3, max: 5, unit: "business days", description: "Plumbing permit review" },
      mechanical: { min: 5, max: 8, unit: "business days", description: "HVAC permit review" },
      zoning: { min: 10, max: 20, unit: "business days", description: "Zoning review process" }
    },
    "Sandy Springs": {
      building: { min: 7, max: 14, unit: "business days", description: "Building permit review" },
      electrical: { min: 5, max: 10, unit: "business days", description: "Electrical permit review" },
      plumbing: { min: 5, max: 10, unit: "business days", description: "Plumbing permit review" }
    },
    "Savannah": {
      building: { min: 5, max: 7, unit: "business days", description: "Building permit review" },
      electrical: { min: 3, max: 5, unit: "business days", description: "Electrical permit review" },
      plumbing: { min: 3, max: 5, unit: "business days", description: "Plumbing permit review" },
      mechanical: { min: 5, max: 7, unit: "business days", description: "HVAC permit review" }
    },
    "Decatur": {
      building: { min: 7, max: 10, unit: "business days", description: "Building permit review (DeKalb County)" },
      electrical: { min: 5, max: 8, unit: "business days", description: "Electrical permit review (DeKalb County)" },
      plumbing: { min: 5, max: 8, unit: "business days", description: "Plumbing permit review (DeKalb County)" },
      mechanical: { min: 7, max: 10, unit: "business days", description: "HVAC permit review (DeKalb County)" },
      zoning: { min: 10, max: 15, unit: "business days", description: "Zoning review process (DeKalb County)" }
    }
  }
  return realTimes[city] || null
}

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
    const instructionSearch = searchParams.get('instructions')

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

      // Add instruction search if provided
      if (instructionSearch) {
        const searchTerm = `%${instructionSearch}%`
        whereConditions.push(
          sql`(
            instructions->>'general' ILIKE ${searchTerm} OR
            instructions->>'building' ILIKE ${searchTerm} OR
            instructions->>'electrical' ILIKE ${searchTerm} OR
            instructions->>'plumbing' ILIKE ${searchTerm} OR
            instructions->>'mechanical' ILIKE ${searchTerm} OR
            instructions->>'zoning' ILIKE ${searchTerm} OR
            instructions->>'applicationProcess' ILIKE ${searchTerm}
          )`
        )
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
              : null,
            // Include enhanced data if available, or add real data
            permitFees: office.permitFees || getRealFeeData(office.city),
            instructions: office.instructions || getRealInstructions(office.city),
            downloadableApplications: office.downloadableApplications || getRealDownloadableApps(office.city),
            processingTimes: office.processingTimes || getRealProcessingTimes(office.city)
          })).sort((a, b) => (a.distance || 999) - (b.distance || 999))
        } else {
          // Include enhanced data even without distance calculation
          enrichedOffices = offices.map(office => ({
            ...office,
            permitFees: office.permitFees || getRealFeeData(office.city),
            instructions: office.instructions || getRealInstructions(office.city),
            downloadableApplications: office.downloadableApplications || getRealDownloadableApps(office.city),
            processingTimes: office.processingTimes || getRealProcessingTimes(office.city)
          }))
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
