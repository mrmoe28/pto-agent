#!/usr/bin/env tsx

import { sql } from '@/lib/neon'

async function main() {
  console.log('\n🔍 Checking for Henry County in database...\n')

  const henryResults = await sql`
    SELECT *
    FROM permit_offices
    WHERE county = 'Henry' AND state = 'GA'
  `

  if (henryResults.length > 0) {
    console.log(`✅ Found ${henryResults.length} Henry County office(s):`)
    henryResults.forEach((office: any) => {
      console.log(`\n   📍 ${office.city}, ${office.county} County`)
      console.log(`   📞 ${office.phone}`)
      console.log(`   🌐 ${office.website}`)
      console.log(`   🏢 ${office.department_name}`)
    })
  } else {
    console.log('❌ No Henry County offices found')
    console.log('\n💡 This means Conley, GA searches will not find results')
    console.log('   (Conley is in Henry County)')
  }

  console.log('\n🔍 Checking all counties with "Henry" in name...\n')
  const allHenry = await sql`
    SELECT county, city, state
    FROM permit_offices
    WHERE county ILIKE '%henry%'
  `

  console.log(`Found ${allHenry.length} result(s)`)
  allHenry.forEach((r: any) => console.log(`   - ${r.county} County, ${r.city}, ${r.state}`))
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
