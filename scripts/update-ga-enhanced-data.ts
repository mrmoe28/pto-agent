#!/usr/bin/env tsx

import { sql } from '@/lib/neon'
import enhancedData from '../data/ga-permit-offices-enhanced.json'

interface EnhancedOffice {
  id: string
  city: string
  county: string
  state: string
  department_name: string
  contact?: {
    address?: string
    phone?: string
    email?: string
    website?: string
    hours?: string
    [key: string]: any
  }
  online_services?: {
    portal_name?: string | null
    portal_url?: string | null
    online_applications?: boolean
    online_payments?: boolean
    permit_tracking?: boolean
    [key: string]: any
  }
  fees?: {
    structure?: string
    formula?: string
    minimum?: string
    [key: string]: any
  }
  application_process?: {
    method?: string
    requirements?: string[]
    [key: string]: any
  }
  timeline?: {
    [key: string]: any
  }
  [key: string]: any
}

async function updateOffice(office: EnhancedOffice) {
  const city = office.city
  const county = office.county
  const state = office.state

  console.log(`\n📍 Updating: ${city}, ${county} County`)

  // Build permit fees JSON
  const permitFees: any = {}
  if (office.fees) {
    permitFees.general = {
      description: office.fees.structure || office.fees.details,
      formula: office.fees.formula,
      minimum: office.fees.minimum,
      specificFees: office.fees.specific_fees
    }
  }

  // Build instructions JSON
  const instructions: any = {}
  if (office.application_process) {
    instructions.applicationProcess = office.application_process.method
    instructions.requiredDocuments = office.application_process.requirements || []
    if (office.application_process.residential_specific) {
      instructions.residential = office.application_process.residential_specific.join('; ')
    }
    if (office.application_process.commercial_specific) {
      instructions.commercial = office.application_process.commercial_specific.join('; ')
    }
  }

  // Build processing times JSON
  const processingTimes: any = {}
  if (office.timeline) {
    processingTimes.general = {
      description: office.timeline.processing || office.timeline.plan_review_meetings
    }
  }

  try {
    // First try exact department name match
    let result = await sql`
      UPDATE permit_offices
      SET
        phone = COALESCE(${office.contact?.phone || null}, phone),
        email = COALESCE(${office.contact?.email || office.contact?.email_residential || null}, email),
        website = COALESCE(${office.contact?.website || null}, website),
        hours_monday = COALESCE(${office.contact?.hours || null}, hours_monday),
        hours_tuesday = COALESCE(${office.contact?.hours || null}, hours_tuesday),
        hours_wednesday = COALESCE(${office.contact?.hours || null}, hours_wednesday),
        hours_thursday = COALESCE(${office.contact?.hours || null}, hours_thursday),
        hours_friday = COALESCE(${office.contact?.hours || null}, hours_friday),
        online_applications = ${office.online_services?.online_applications !== undefined ? office.online_services.online_applications : sql`online_applications`},
        online_payments = ${office.online_services?.online_payments !== undefined ? office.online_services.online_payments : sql`online_payments`},
        permit_tracking = ${office.online_services?.permit_tracking !== undefined ? office.online_services.permit_tracking : sql`permit_tracking`},
        online_portal_url = COALESCE(${office.online_services?.portal_url || null}, online_portal_url),
        permit_fees = COALESCE(${JSON.stringify(permitFees)}::jsonb, permit_fees),
        instructions = COALESCE(${JSON.stringify(instructions)}::jsonb, instructions),
        processing_times = COALESCE(${JSON.stringify(processingTimes)}::jsonb, processing_times),
        last_verified = NOW(),
        updated_at = NOW()
      WHERE city = ${city}
        AND county = ${county}
        AND state = ${state}
        AND (department_name = ${office.department_name} OR department_name ILIKE ${'%' + office.department_name.split(' - ')[0] + '%'})
      RETURNING id, city, county, department_name
    `

    // If no exact match, try updating all offices in that city/county
    if (result.length === 0) {
      result = await sql`
        UPDATE permit_offices
        SET
          phone = COALESCE(${office.contact?.phone || null}, phone),
          email = COALESCE(${office.contact?.email || office.contact?.email_residential || null}, email),
          website = COALESCE(${office.contact?.website || null}, website),
          hours_monday = COALESCE(${office.contact?.hours || null}, hours_monday),
          hours_tuesday = COALESCE(${office.contact?.hours || null}, hours_tuesday),
          hours_wednesday = COALESCE(${office.contact?.hours || null}, hours_wednesday),
          hours_thursday = COALESCE(${office.contact?.hours || null}, hours_thursday),
          hours_friday = COALESCE(${office.contact?.hours || null}, hours_friday),
          online_applications = ${office.online_services?.online_applications !== undefined ? office.online_services.online_applications : sql`online_applications`},
          online_payments = ${office.online_services?.online_payments !== undefined ? office.online_services.online_payments : sql`online_payments`},
          permit_tracking = ${office.online_services?.permit_tracking !== undefined ? office.online_services.permit_tracking : sql`permit_tracking`},
          online_portal_url = COALESCE(${office.online_services?.portal_url || null}, online_portal_url),
          permit_fees = COALESCE(${JSON.stringify(permitFees)}::jsonb, permit_fees),
          instructions = COALESCE(${JSON.stringify(instructions)}::jsonb, instructions),
          processing_times = COALESCE(${JSON.stringify(processingTimes)}::jsonb, processing_times),
          last_verified = NOW(),
          updated_at = NOW()
        WHERE city = ${city}
          AND county = ${county}
          AND state = ${state}
        RETURNING id, city, county, department_name
      `
    }

    if (result.length > 0) {
      console.log(`   ✅ Updated: ${result[0].department_name}`)
      console.log(`      ID: ${result[0].id}`)
      if (office.online_services?.portal_url) {
        console.log(`      Portal: ${office.online_services.portal_name}`)
      }
      if (office.data_quality_score) {
        console.log(`      Data Quality: ${office.data_quality_score}/100`)
      }
    } else {
      console.log(`   ⚠️  No matching office found in database`)
      console.log(`      Query: ${city}, ${county}, ${state}, ${office.department_name}`)
    }

    return result.length > 0
  } catch (error) {
    console.error(`   ❌ Error updating ${city}, ${county}:`, error)
    return false
  }
}

async function main() {
  console.log('\n🔄 Updating Georgia permit offices with enhanced data...\n')
  console.log(`Total offices to update: ${enhancedData.offices.length}`)

  let successCount = 0
  let failCount = 0

  for (const office of enhancedData.offices as EnhancedOffice[]) {
    const success = await updateOffice(office)
    if (success) {
      successCount++
    } else {
      failCount++
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n\n📊 Update Summary:')
  console.log(`✅ Successfully updated: ${successCount}`)
  console.log(`❌ Failed to update: ${failCount}`)
  console.log(`📝 Total processed: ${enhancedData.offices.length}`)

  if (successCount > 0) {
    console.log('\n\n✨ Enhanced data now available for:')
    console.log('   • Online portal URLs')
    console.log('   • Permit fees and structures')
    console.log('   • Application processes')
    console.log('   • Contact information')
    console.log('   • Processing timelines')
  }

  console.log('\n\n📈 Data Quality Improvements:')
  const highQuality = enhancedData.summary.high_quality_offices
  console.log(`   Top offices (80+ points):`)
  highQuality.forEach((office: string) => {
    console.log(`      • ${office}`)
  })
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
