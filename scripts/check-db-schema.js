#!/usr/bin/env node

const { config } = require('dotenv');
const { resolve } = require('path');
const { createSql } = require('./_pg-sql');

config({ path: resolve(__dirname, '../.env.local') });

const { sql, pool } = createSql(process.env.DATABASE_URL);

async function checkSchema() {
  console.log('\n📋 Checking database schema...\n');

  // List all tables
  const allTables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log('All tables in database:');
  allTables.forEach(table => {
    console.log(`  - ${table.table_name}`);
  });

  // Check user_subscriptions table columns
  const userSubColumns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'user_subscriptions'
    ORDER BY ordinal_position
  `;

  console.log('\nuser_subscriptions table columns:');
  userSubColumns.forEach(col => {
    console.log(`  - ${col.column_name} (${col.data_type})`);
  });
}

checkSchema().catch(console.error).finally(() => pool.end());
