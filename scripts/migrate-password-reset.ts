#!/usr/bin/env tsx

/**
 * Password Reset Tokens Migration Script
 * Creates the password_reset_tokens table
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { sql } from '../src/lib/neon'

async function runPasswordResetMigration() {
  console.log('🚀 Starting password reset tokens migration...')

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../database/migrations/add_password_reset_tokens.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('📖 Reading password reset tokens migration file...')

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
        // Some statements might fail if table already exists, that's okay
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${errorMessage}`)
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, errorMessage)
          throw error
        }
      }
    }

    console.log('🎉 Password reset tokens migration completed successfully!')

    // Verify the migration by checking if the table exists
    console.log('🔍 Verifying migration...')
    const tableCheck = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'password_reset_tokens'
    `

    if (tableCheck.length > 0) {
      console.log('✅ Migration verification successful! password_reset_tokens table created')
    } else {
      console.log('⚠️  Migration verification: password_reset_tokens table not found')
    }

    // Show table structure
    console.log('📊 password_reset_tokens table structure:')
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'password_reset_tokens'
      ORDER BY ordinal_position
    `

    console.log(`Total columns: ${tableInfo.length}`)
    tableInfo.forEach((col: any) => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
    })

  } catch (error) {
    console.error('💥 Password reset tokens migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
runPasswordResetMigration()
  .then(() => {
    console.log('✨ Password reset tokens migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Password reset tokens migration script failed:', error)
    process.exit(1)
  })
