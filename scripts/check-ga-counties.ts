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
  result.forEach((r) => console.log(`   ✓ ${(r as { county: string }).county} County`))

  const allOffices = await sql`
    SELECT county, city, jurisdiction_type, department_name
    FROM permit_offices
    WHERE state = 'GA' AND active = true
    ORDER BY county, jurisdiction_type, city
  `

  console.log(`\n\n🏛️  All Georgia Offices (${allOffices.length} total):\n`)
  allOffices.forEach((office) => {
    const o = office as { county: string; city: string; jurisdiction_type: string; department_name: string }
    console.log(`   ${o.county} → ${o.city} (${o.jurisdiction_type}) - ${o.department_name}`)
  })
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
