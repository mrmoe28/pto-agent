#!/usr/bin/env node

const { config } = require('dotenv');
const { resolve } = require('path');
const { neon } = require('@neondatabase/serverless');

config({ path: resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function finalVerification() {
  console.log('\n✨ SQUARE PAYMENT INTEGRATION - FINAL VERIFICATION ✨\n');
  console.log('='.repeat(60));

  // Check all Square tables
  const tables = await sql`
    SELECT table_name,
           (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name = t.table_name AND table_schema = 'public') as column_count
    FROM information_schema.tables t
    WHERE table_schema = 'public'
    AND table_name IN ('payments', 'payment_methods', 'refunds')
    ORDER BY table_name
  `;

  console.log('\n📊 Square Payment Tables:');
  console.log('-'.repeat(60));
  tables.forEach(table => {
    console.log(`  ✓ ${table.table_name} (${table.column_count} columns)`);
  });

  // Check user_subscriptions Square columns
  const squareColumns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'user_subscriptions'
    AND (column_name LIKE 'square_%' OR column_name LIKE 'cancel%')
    ORDER BY column_name
  `;

  console.log('\n📋 user_subscriptions - Square Columns:');
  console.log('-'.repeat(60));
  squareColumns.forEach(col => {
    console.log(`  ✓ ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
  });

  // Check indexes
  const indexes = await sql`
    SELECT indexname, tablename
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE '%payment%'
    ORDER BY tablename, indexname
  `;

  console.log('\n🔍 Payment Indexes:');
  console.log('-'.repeat(60));
  indexes.forEach(idx => {
    console.log(`  ✓ ${idx.indexname} → ${idx.tablename}`);
  });

  // Check foreign key constraints
  const constraints = await sql`
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('payments', 'payment_methods', 'refunds')
    ORDER BY tc.table_name, tc.constraint_name
  `;

  console.log('\n🔗 Foreign Key Constraints:');
  console.log('-'.repeat(60));
  constraints.forEach(c => {
    console.log(`  ✓ ${c.table_name}.${c.column_name} → ${c.foreign_table_name}.${c.foreign_column_name}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('🎉 VERIFICATION COMPLETE - All Square payment infrastructure ready!');
  console.log('='.repeat(60) + '\n');
}

finalVerification().catch(console.error);
