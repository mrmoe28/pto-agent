#!/usr/bin/env node

const { config } = require('dotenv');
const { resolve } = require('path');
const { neon } = require('@neondatabase/serverless');

config({ path: resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function testMigration() {
  console.log('\n🧪 Testing direct SQL execution...\n');

  try {
    // Try to add a column
    console.log('Attempting to add square_customer_id column...');
    const result1 = await sql`ALTER TABLE "user_subscriptions" ADD COLUMN IF NOT EXISTS "square_customer_id" text`;
    console.log('Result:', result1);

    // Check if column exists
    console.log('\nChecking if column was created...');
    const check = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'user_subscriptions'
      AND column_name = 'square_customer_id'
    `;
    console.log('Column check result:', check);

    // Try creating payments table
    console.log('\nAttempting to create payments table...');
    const result2 = await sql`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" text NOT NULL,
        "square_payment_id" text,
        "amount" integer NOT NULL,
        "currency" text DEFAULT 'USD' NOT NULL,
        "status" text NOT NULL,
        "receipt_url" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "payments_square_payment_id_unique" UNIQUE("square_payment_id"),
        CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action
      )
    `;
    console.log('Result:', result2);

    // Check if table exists
    console.log('\nChecking if table was created...');
    const tableCheck = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'payments'
    `;
    console.log('Table check result:', tableCheck);

  } catch (error) {
    console.error('Error:', error);
  }
}

testMigration().catch(console.error);
