#!/usr/bin/env tsx

import { sql } from '@/lib/neon'

async function main() {
  console.log('\n🔍 Checking Savannah/Chatham County permit office instructions data...\n')

  const savannah = await sql`
    SELECT
      id,
      city,
      county,
      department_name,
      instructions,
      permit_fees,
      processing_times,
      downloadable_applications
    FROM permit_offices
    WHERE county = 'Chatham' AND state = 'GA'
    LIMIT 1
  `

  if (savannah.length === 0) {
    console.log('❌ No Savannah/Chatham County offices found')
    return
  }

  const office = savannah[0]
  console.log(`📍 Office: ${office.department_name}`)
  console.log(`   Location: ${office.city}, ${office.county} County\n`)

  console.log('📋 Instructions Field:')
  console.log(JSON.stringify(office.instructions, null, 2))

  console.log('\n💰 Permit Fees Field:')
  console.log(JSON.stringify(office.permit_fees, null, 2))

  console.log('\n⏱️  Processing Times Field:')
  console.log(JSON.stringify(office.processing_times, null, 2))

  console.log('\n📥 Downloadable Applications Field:')
  console.log(JSON.stringify(office.downloadable_applications, null, 2))

  // Check if any data exists
  const hasInstructions = office.instructions && Object.keys(office.instructions).length > 0
  const hasFees = office.permit_fees && Object.keys(office.permit_fees).length > 0
  const hasTimes = office.processing_times && Object.keys(office.processing_times).length > 0
  const hasForms = office.downloadable_applications && Object.keys(office.downloadable_applications).length > 0

  console.log('\n\n📊 Data Status:')
  console.log(`   Instructions: ${hasInstructions ? '✅ Has data' : '❌ Empty'}`)
  console.log(`   Permit Fees: ${hasFees ? '✅ Has data' : '❌ Empty'}`)
  console.log(`   Processing Times: ${hasTimes ? '✅ Has data' : '❌ Empty'}`)
  console.log(`   Downloadable Forms: ${hasForms ? '✅ Has data' : '❌ Empty'}`)

  if (!hasInstructions) {
    console.log('\n⚠️  ISSUE: Instructions field is empty or null!')
    console.log('   This is why the frontend shows blank "Instructions & Requirements"')
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
