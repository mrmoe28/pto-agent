#!/usr/bin/env tsx

/**
 * Database Migration Script
 * Applies the comprehensive fields migration to the permit_offices table
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { sql } from '../src/lib/neon'

async function runMigration() {
  console.log('🚀 Starting database migration...')

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../database/migrations/add_comprehensive_fields.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('📖 Reading migration file...')

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)

      try {
        await sql.unsafe(statement)
        console.log(`✅ Statement ${i + 1} completed successfully`)
      } catch (error) {
        // Some statements might fail if columns already exist, that's okay
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${errorMessage}`)
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, errorMessage)
          throw error
        }
      }
    }

    console.log('🎉 Migration completed successfully!')

    // Verify the migration by checking if new columns exist
    console.log('🔍 Verifying migration...')
    const columnCheck = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'permit_offices'
      AND column_name IN ('permit_fees', 'instructions', 'confidence_score', 'pages_crawled')
      ORDER BY column_name
    `

    if (columnCheck.length > 0) {
      console.log('✅ Migration verification successful! New columns found:')
      columnCheck.forEach((col: any) => {
        console.log(`  - ${col.column_name} (${col.data_type})`)
      })
    } else {
      console.log('⚠️  Migration verification: No new columns detected')
    }

    // Show table info
    console.log('📊 Current permit_offices table structure:')
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'permit_offices'
      ORDER BY ordinal_position
    `

    console.log(`Total columns: ${tableInfo.length}`)

  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('✨ Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error)
    process.exit(1)
  })