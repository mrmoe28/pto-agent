#!/usr/bin/env tsx

import { sql } from '../src/lib/neon';

async function createUserSubscriptionsTable() {
  console.log('🚀 Creating user_subscriptions table...');

  try {
    // Create user_subscriptions table
    await sql`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id text UNIQUE NOT NULL REFERENCES users(id) ON DELETE cascade,
        plan text NOT NULL DEFAULT 'free',
        stripe_customer_id text,
        stripe_subscription_id text,
        stripe_price_id text,
        stripe_current_period_end timestamp,
        searches_used integer DEFAULT 0,
        searches_limit integer DEFAULT 1,
        current_period_start timestamp DEFAULT now(),
        current_period_end timestamp,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )
    `;
    
    console.log('✅ user_subscriptions table created successfully!');

    // Verify table exists
    const tableCheck = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'user_subscriptions'
    `;

    if (tableCheck.length > 0) {
      console.log('✅ Verified: user_subscriptions table exists!');
      
      // Check columns
      const columnsCheck = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'user_subscriptions'
        ORDER BY ordinal_position
      `;
      
      console.log(`📊 user_subscriptions table has ${columnsCheck.length} columns`);
      console.log('Columns:', columnsCheck.map((c: any) => c.column_name).join(', '));
    } else {
      console.error('❌ user_subscriptions table was not created');
    }

  } catch (error) {
    console.error('💥 Table creation failed:', error);
    process.exit(1);
  }
}

createUserSubscriptionsTable()
  .then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
