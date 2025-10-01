#!/usr/bin/env tsx

import { sql } from '@/lib/neon'

async function testChambleeSearch() {
  const city = 'Chamblee'
  const county = 'DeKalb'
  const state = 'GA'

  console.log('\n🔍 Testing Chamblee search fallback logic...\n')
  console.log(`Search params: city="${city}", county="${county}", state="${state}"`)

  // Try city + county first (should fail)
  console.log('\n1️⃣ Trying city + county match...')
  const cityCountyResults = await sql`
    SELECT city, county, department_name FROM permit_offices
    WHERE active = true
      AND (city = ${city} OR city ILIKE ${`%${city}%`})
      AND (county = ${county} OR county ILIKE ${`%${county}%`})
      AND state = ${state}
    LIMIT 5
  `

  if (cityCountyResults.length > 0) {
    console.log(`✅ Found ${cityCountyResults.length} city+county results:`)
    cityCountyResults.forEach(r => console.log(`   - ${r.city}, ${r.county} County - ${r.department_name}`))
  } else {
    console.log(`❌ No city+county match - falling back to county-only...`)

    // Fallback to county only
    console.log('\n2️⃣ Trying county-only fallback...')
    const countyResults = await sql`
      SELECT city, county, department_name, phone, website FROM permit_offices
      WHERE active = true
        AND (county = ${county} OR county ILIKE ${`%${county}%`})
        AND state = ${state}
      ORDER BY jurisdiction_type = 'county' DESC
      LIMIT 5
    `

    if (countyResults.length > 0) {
      console.log(`✅ Found ${countyResults.length} county fallback results:`)
      countyResults.forEach(r => {
        console.log(`\n   📍 ${r.city}, ${r.county} County`)
        console.log(`      ${r.department_name}`)
        console.log(`      Phone: ${r.phone || 'N/A'}`)
        console.log(`      Website: ${r.website || 'N/A'}`)
      })

      console.log('\n\n✅ SUCCESS! Chamblee searches will now return DeKalb County results!')
      console.log('   Users in Chamblee can find their permit offices.')
    } else {
      console.log(`❌ ERROR: No county fallback results found!`)
    }
  }
}

testChambleeSearch().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
