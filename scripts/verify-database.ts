#!/usr/bin/env tsx

/**
 * Database Verification Script
 * Checks if the database connection works and shows table structure
 */

import { sql } from '../src/lib/neon'

async function verifyDatabase() {
  console.log('🔍 Verifying database connection and structure...')

  try {
    // Test database connection
    console.log('📡 Testing database connection...')
    const connectionTest = await sql`SELECT 1 as test`
    console.log('✅ Database connection successful!')

    // Check if permit_offices table exists
    console.log('🏢 Checking permit_offices table...')
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'permit_offices'
      )
    `

    if (!tableExists[0]?.exists) {
      console.log('❌ permit_offices table does not exist!')
      console.log('💡 You may need to run the initial schema setup first.')
      return
    }

    console.log('✅ permit_offices table exists!')

    // Get table structure
    console.log('📊 Getting table structure...')
    const columns = await sql`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'permit_offices'
      ORDER BY ordinal_position
    `

    console.log(`\n📋 permit_offices table has ${columns.length} columns:`)
    console.log('=' .repeat(80))

    // Group columns by category
    const basicFields = columns.filter((col: any) =>
      ['id', 'created_at', 'updated_at', 'city', 'county', 'state'].includes(col.column_name)
    )

    const comprehensiveFields = columns.filter((col: any) =>
      ['permit_fees', 'instructions', 'downloadable_applications', 'processing_times',
       'contact_details', 'office_details', 'permit_categories', 'related_pages'].includes(col.column_name)
    )

    const additionalFields = columns.filter((col: any) =>
      ['fax', 'alternative_phones', 'alternative_emails', 'confidence_score',
       'pages_crawled', 'crawl_depth', 'source_url', 'scraped_at'].includes(col.column_name)
    )

    console.log('\n🔹 Basic Fields:')
    basicFields.forEach((col: any) => {
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(15)} ${col.is_nullable}`)
    })

    console.log('\n🔹 Comprehensive Data Fields (from enhanced scraper):')
    comprehensiveFields.forEach((col: any) => {
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(15)} ${col.is_nullable}`)
    })

    console.log('\n🔹 Additional Enhanced Fields:')
    additionalFields.forEach((col: any) => {
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(15)} ${col.is_nullable}`)
    })

    // Check for migration status
    const migrationStatus = {
      hasComprehensiveFields: comprehensiveFields.length > 0,
      hasAdditionalFields: additionalFields.length > 0,
      totalColumns: columns.length
    }

    console.log('\n🎯 Migration Status:')
    console.log(`  Comprehensive fields: ${migrationStatus.hasComprehensiveFields ? '✅ Present' : '❌ Missing'}`)
    console.log(`  Additional fields: ${migrationStatus.hasAdditionalFields ? '✅ Present' : '❌ Missing'}`)
    console.log(`  Total columns: ${migrationStatus.totalColumns}`)

    if (migrationStatus.hasComprehensiveFields && migrationStatus.hasAdditionalFields) {
      console.log('\n🎉 Database migration appears to be complete!')
      console.log('💡 You can now run the Python scraper to populate comprehensive data.')
    } else {
      console.log('\n⚠️  Database migration may be incomplete.')
      console.log('💡 Run: npm run migrate:db')
    }

    // Check current data count
    const dataCount = await sql`SELECT COUNT(*) as count FROM permit_offices`
    console.log(`\n📈 Current data: ${dataCount[0]?.count || 0} permit offices in database`)

  } catch (error) {
    console.error('💥 Database verification failed:', error)
    console.log('\n💡 Make sure your DATABASE_URL environment variable is set correctly.')
    process.exit(1)
  }
}

// Run the verification
verifyDatabase()
  .then(() => {
    console.log('\n✨ Database verification completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Verification script failed:', error)
    process.exit(1)
  })