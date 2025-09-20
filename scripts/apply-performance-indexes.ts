#!/usr/bin/env tsx

/**
 * Script to apply performance indexes to the permit_offices table
 * This will significantly improve query performance for common search patterns
 */

import 'dotenv/config'
import { sql } from '@/lib/neon'
import { readFileSync } from 'fs'
import { join } from 'path'

async function applyPerformanceIndexes() {
  console.log('🚀 Starting database performance optimization...')

  try {
    // Read the SQL file with index definitions
    const sqlFile = join(process.cwd(), 'src/lib/db/performance-indexes.sql')
    const indexesSQL = readFileSync(sqlFile, 'utf-8')

    // Split into individual statements (filter out comments and empty lines)
    const statements = indexesSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📊 Found ${statements.length} index creation statements`)

    // Execute each index creation statement
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      if (statement.includes('CREATE INDEX')) {
        const indexName = extractIndexName(statement)
        console.log(`📈 Creating index ${i + 1}/${statements.length}: ${indexName}`)

        try {
          const startTime = Date.now()
          await sql.unsafe(statement)
          const duration = Date.now() - startTime

          console.log(`✅ Successfully created ${indexName} (${duration}ms)`)
          successCount++
        } catch (error: any) {
          console.error(`❌ Failed to create ${indexName}:`, error.message)
          errorCount++

          // Continue with other indexes even if one fails
          if (error.message.includes('already exists')) {
            console.log(`ℹ️  Index ${indexName} already exists, skipping...`)
            successCount++
          }
        }
      }
    }

    console.log('\n📋 Index Creation Summary:')
    console.log(`✅ Successfully created: ${successCount}`)
    console.log(`❌ Failed: ${errorCount}`)

    // Check index status
    console.log('\n🔍 Checking index status...')
    await checkIndexStatus()

    // Analyze table for optimizer statistics
    console.log('\n📊 Updating table statistics...')
    await sql`ANALYZE permit_offices`
    console.log('✅ Table statistics updated')

    console.log('\n🎉 Database performance optimization completed!')

  } catch (error) {
    console.error('💥 Fatal error during index creation:', error)
    process.exit(1)
  }
}

function extractIndexName(statement: string): string {
  const match = statement.match(/CREATE INDEX(?:\s+CONCURRENTLY)?\s+(?:IF NOT EXISTS\s+)?(\w+)/i)
  return match ? match[1] : 'unknown'
}

async function checkIndexStatus() {
  try {
    const indexes = await sql`
      SELECT
        indexname,
        indexdef,
        schemaname
      FROM pg_indexes
      WHERE tablename = 'permit_offices'
        AND indexname LIKE 'idx_permit_offices_%'
      ORDER BY indexname
    `

    console.log(`Found ${indexes.length} performance indexes:`)
    indexes.forEach((index: any) => {
      console.log(`  • ${index.indexname}`)
    })

    // Check index sizes
    const indexSizes = await sql`
      SELECT
        indexname,
        pg_size_pretty(pg_relation_size(indexname::regclass)) as size
      FROM pg_indexes
      WHERE tablename = 'permit_offices'
        AND indexname LIKE 'idx_permit_offices_%'
      ORDER BY pg_relation_size(indexname::regclass) DESC
    `

    console.log('\nIndex sizes:')
    indexSizes.forEach((index: any) => {
      console.log(`  • ${index.indexname}: ${index.size}`)
    })

  } catch (error) {
    console.error('Error checking index status:', error)
  }
}

// Run the script
if (require.main === module) {
  applyPerformanceIndexes()
    .then(() => {
      console.log('Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Script failed:', error)
      process.exit(1)
    })
}

export { applyPerformanceIndexes }