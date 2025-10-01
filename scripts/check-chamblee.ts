#!/usr/bin/env tsx

import { sql } from '@/lib/neon'

async function main() {
  console.log('\n🔍 Checking database for Chamblee, GA area...\n')

  // Check DeKalb County (Chamblee is in DeKalb)
  const dekalb = await sql`
    SELECT city, county, state, department_name, active, website, phone
    FROM permit_offices
    WHERE state = 'GA' AND county = 'DeKalb'
    ORDER BY city
  `

  console.log(`Found ${dekalb.length} DeKalb County offices:`)
  dekalb.forEach(office => {
    console.log(`  📍 ${office.city}, ${office.county} County`)
    console.log(`     ${office.department_name}`)
    console.log(`     Active: ${office.active}`)
    console.log(`     Website: ${office.website || 'N/A'}`)
    console.log(`     Phone: ${office.phone || 'N/A'}\n`)
  })

  // Check if there's a specific Chamblee office
  const chamblee = await sql`
    SELECT *
    FROM permit_offices
    WHERE state = 'GA' AND city = 'Chamblee'
  `

  console.log(`\nSpecific Chamblee offices: ${chamblee.length}`)
  if (chamblee.length > 0) {
    chamblee.forEach(office => {
      console.log(`  📍 ${office.city}, ${office.county} County - ${office.department_name}`)
    })
  } else {
    console.log('  ⚠️  No specific Chamblee office - should fallback to DeKalb County')
  }

  // Check all GA offices
  const allGA = await sql`
    SELECT COUNT(*) as total, COUNT(DISTINCT county) as counties
    FROM permit_offices
    WHERE state = 'GA' AND active = true
  `

  console.log(`\n📊 Total GA Statistics:`)
  console.log(`   Offices: ${allGA[0].total}`)
  console.log(`   Counties: ${allGA[0].counties}`)
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
