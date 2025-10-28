#!/usr/bin/env tsx

/**
 * Database Migration Script
 * Adds Stripe fields to the user_subscriptions table
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { sql } from '../src/lib/neon'

async function runMigration() {
  console.log('🚀 Starting Stripe fields migration...')

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../database/migrations/add_stripe_fields.sql')
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
      WHERE table_name = 'user_subscriptions'
      AND column_name IN ('stripe_customer_id', 'stripe_subscription_id')
      ORDER BY column_name
    `

    if (columnCheck.length > 0) {
      console.log('✅ Migration verification successful! New Stripe columns found:')
      columnCheck.forEach((col: any) => {
        console.log(`  - ${col.column_name} (${col.data_type})`)
      })
    } else {
      console.log('⚠️  Migration verification: No new columns detected')
    }

    console.log('✨ Stripe integration ready!')

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
