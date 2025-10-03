#!/usr/bin/env tsx

import { sql } from '../src/lib/neon';

async function addStatusColumn() {
  console.log('🚀 Adding status column to user_subscriptions...');

  try {
    // Add status column if it doesn't exist
    await sql`
      ALTER TABLE user_subscriptions 
      ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    `;
    
    console.log('✅ Status column added successfully!');

    // Verify column exists
    const columnsCheck = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_subscriptions'
      ORDER BY ordinal_position
    `;
    
    console.log(`📊 user_subscriptions now has ${columnsCheck.length} columns`);
    columnsCheck.forEach((col: any) => {
      console.log(`  - ${col.column_name} (${col.data_type})${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
    });

  } catch (error) {
    console.error('💥 Column addition failed:', error);
    process.exit(1);
  }
}

addStatusColumn()
  .then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
