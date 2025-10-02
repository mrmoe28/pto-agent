#!/usr/bin/env tsx

/**
 * Seed all Georgia counties into the database
 * This adds comprehensive coverage for all major GA counties
 */

import { sql } from '@/lib/neon'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  console.log('🌱 Seeding Georgia counties into database...\n')

  try {
    // Read the SQL seed file
    const seedFilePath = path.join(process.cwd(), 'database/seeds/georgia-all-counties.sql')
    const seedSQL = fs.readFileSync(seedFilePath, 'utf-8')

    console.log('📄 Read seed file:', seedFilePath)
    console.log('📊 File size:', (seedSQL.length / 1024).toFixed(2), 'KB\n')

    // Split by INSERT statements and count them
    const insertStatements = seedSQL.split('INSERT INTO permit_offices').filter(s => s.trim().length > 0)
    console.log(`Found ${insertStatements.length - 1} counties to seed\n`)

    // Execute the entire seed file
    console.log('⚡ Executing seed SQL...')
    await sql.unsafe(seedSQL)

    console.log('✅ Successfully seeded all Georgia counties!')

    // Verify the data
    console.log('\n📊 Verifying seeded data...')
    const result = await sql`
      SELECT
        state,
        COUNT(*) as total_offices,
        COUNT(DISTINCT county) as total_counties,
        COUNT(CASE WHEN jurisdiction_type = 'county' THEN 1 END) as county_offices,
        COUNT(CASE WHEN jurisdiction_type = 'city' THEN 1 END) as city_offices
      FROM permit_offices
      WHERE state = 'GA' AND active = true
      GROUP BY state
    `

    console.log('\n✨ Georgia Permit Office Summary:')
    console.log('─'.repeat(50))
    if (result.length > 0) {
      const stats = result[0]
      console.log(`Total Offices: ${stats.total_offices}`)
      console.log(`Total Counties Covered: ${stats.total_counties}`)
      console.log(`County-level Offices: ${stats.county_offices}`)
      console.log(`City-level Offices: ${stats.city_offices}`)
    }
    console.log('─'.repeat(50))

    // Show sample of counties
    console.log('\n🏛️  Sample of Seeded Counties:')
    const sampleCounties = await sql`
      SELECT county, city, department_name
      FROM permit_offices
      WHERE state = 'GA' AND jurisdiction_type = 'county' AND active = true
      ORDER BY county
      LIMIT 10
    `

    sampleCounties.forEach((county) => {
      const c = county as { county: string; city: string; department_name: string }
      console.log(`   ${c.county} County → ${c.city} (${c.department_name})`)
    })

    console.log('\n✅ Database seeding complete!')
    console.log('🚀 You can now search for any major Georgia location\n')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

main()
  .then(() => {
    console.log('✨ Seed script finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Seed script failed:', error)
    process.exit(1)
  })
