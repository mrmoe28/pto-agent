#!/usr/bin/env tsx

import { sql } from '@/lib/neon'

async function main() {
  console.log('\n🌱 Manually inserting Henry County...\n')

  try {
    const result = await sql`
      INSERT INTO permit_offices (
        city, county, state, jurisdiction_type, department_name, office_type,
        address, phone, website,
        hours_monday, hours_tuesday, hours_wednesday, hours_thursday, hours_friday,
        building_permits, electrical_permits, plumbing_permits, mechanical_permits,
        zoning_permits, planning_review, inspections,
        online_applications, online_payments, permit_tracking,
        latitude, longitude, data_source, active
      ) VALUES (
        'McDonough', 'Henry', 'GA', 'county', 'Development Services', 'combined',
        '140 Henry Pkwy, McDonough, GA 30253',
        '(770) 288-8000',
        'https://www.henrycounty-ga.com/Departments/Development',
        '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM',
        true, true, true, true, true, true, true,
        true, true, true,
        '33.4479', '-84.1460', 'manual', true
      )
      RETURNING *
    `

    console.log('✅ Successfully inserted Henry County!')
    console.log('\nInserted record:')
    console.log(result[0])

  } catch (error) {
    console.error('❌ Error inserting Henry County:', error)
    throw error
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
