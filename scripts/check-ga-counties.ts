#!/usr/bin/env tsx

import { sql } from '@/lib/neon'

async function main() {
  const result = await sql`
    SELECT DISTINCT county
    FROM permit_offices
    WHERE state = 'GA' AND active = true
    ORDER BY county
  `

  console.log(`\n📊 Georgia Counties in Database (${result.length} total):\n`)
  result.forEach((r: { county: string }) => console.log(`   ✓ ${r.county} County`))

  const allOffices = await sql`
    SELECT county, city, jurisdiction_type, department_name
    FROM permit_offices
    WHERE state = 'GA' AND active = true
    ORDER BY county, jurisdiction_type, city
  `

  console.log(`\n\n🏛️  All Georgia Offices (${allOffices.length} total):\n`)
  allOffices.forEach((office: { county: string; city: string; jurisdiction_type: string; department_name: string }) => {
    console.log(`   ${office.county} → ${office.city} (${office.jurisdiction_type}) - ${office.department_name}`)
  })
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
