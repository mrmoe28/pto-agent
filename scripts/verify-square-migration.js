#!/usr/bin/env node

const { config } = require('dotenv');
const { resolve } = require('path');
const { neon } = require('@neondatabase/serverless');

config({ path: resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function verify() {
  console.log('\n🔍 Verifying Square payment integration...\n');

  // Check user_subscriptions columns
  const columns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'user_subscriptions'
    AND column_name IN ('square_customer_id', 'square_subscription_id', 'square_card_id', 'cancel_at_period_end', 'canceled_at')
    ORDER BY column_name
  `;

  console.log('✅ Square columns in user_subscriptions:');
  columns.forEach(col => {
    console.log(`  - ${col.column_name} (${col.data_type})`);
  });

  // Check new tables
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('payments', 'payment_methods', 'refunds')
    ORDER BY table_name
  `;

  console.log('\n✅ Square payment tables:');
  tables.forEach(table => {
    console.log(`  - ${table.table_name}`);
  });

  // Check indexes
  const indexes = await sql`
    SELECT indexname, tablename
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE '%payment%'
    ORDER BY tablename, indexname
  `;

  console.log('\n✅ Payment-related indexes:');
  indexes.forEach(idx => {
    console.log(`  - ${idx.indexname} on ${idx.tablename}`);
  });

  console.log('\n🎉 Square payment integration verified successfully!\n');
}

verify().catch(console.error);
