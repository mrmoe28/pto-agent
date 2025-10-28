#!/usr/bin/env tsx

/**
 * Square Payment Integration Migration Script
 * Applies Square-specific schema changes
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { readFileSync } from 'fs';
import { join } from 'path';
import { sql } from '../src/lib/neon';

async function runSquareMigration() {
  console.log('🚀 Starting Square payment integration migration...');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../drizzle/0002_square_payment_integration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📖 Reading migration file...');

    // Remove comments and split into statements
    const cleanedSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    const statements = cleanedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 60)}...`);

      try {
        await sql.unsafe(statement);
        console.log(`✅ Statement ${i + 1} completed successfully`);
      } catch (error) {
        // Some statements might fail if already exist, that's okay
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, errorMessage);
          console.error(`   SQL: ${statement.substring(0, 200)}`);
          throw error;
        }
      }
    }

    console.log('🎉 Migration completed successfully!');

    // Verify the migration
    console.log('🔍 Verifying migration...');

    // Check new columns in user_subscriptions
    const subscriptionColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'user_subscriptions'
      AND column_name IN ('square_customer_id', 'square_subscription_id', 'square_card_id', 'cancel_at_period_end', 'canceled_at')
      ORDER BY column_name
    `;

    console.log('✅ Square columns in user_subscriptions:');
    subscriptionColumns.forEach((col) => {
      const colData = col as Record<string, unknown>;
      console.log(`  - ${colData.column_name} (${colData.data_type})`);
    });

    // Check new tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('payments', 'payment_methods', 'refunds')
      ORDER BY table_name
    `;

    console.log('✅ Square payment tables created:');
    tables.forEach((table) => {
      const tableData = table as Record<string, unknown>;
      console.log(`  - ${tableData.table_name}`);
    });

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runSquareMigration()
  .then(() => {
    console.log('✨ Square migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Square migration script failed:', error);
    process.exit(1);
  });
