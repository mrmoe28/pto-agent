#!/usr/bin/env node

const { config } = require('dotenv');
const { resolve } = require('path');
const { createSql } = require('./_pg-sql');

config({ path: resolve(__dirname, '../.env.local') });

const { sql, pool } = createSql(process.env.DATABASE_URL);

async function testRemaining() {
  console.log('\n🧪 Testing remaining migrations...\n');

  try {
    // Add remaining columns to user_subscriptions
    console.log('Adding square_subscription_id...');
    await sql`ALTER TABLE "user_subscriptions" ADD COLUMN IF NOT EXISTS "square_subscription_id" text`;
    console.log('✅ Done');

    console.log('Adding square_card_id...');
    await sql`ALTER TABLE "user_subscriptions" ADD COLUMN IF NOT EXISTS "square_card_id" text`;
    console.log('✅ Done');

    console.log('Adding cancel_at_period_end...');
    await sql`ALTER TABLE "user_subscriptions" ADD COLUMN IF NOT EXISTS "cancel_at_period_end" boolean DEFAULT false`;
    console.log('✅ Done');

    console.log('Adding canceled_at...');
    await sql`ALTER TABLE "user_subscriptions" ADD COLUMN IF NOT EXISTS "canceled_at" timestamp`;
    console.log('✅ Done');

    // Create payment_methods table
    console.log('\nCreating payment_methods table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "payment_methods" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" text NOT NULL,
        "square_card_id" text,
        "last4" text NOT NULL,
        "brand" text NOT NULL,
        "exp_month" integer NOT NULL,
        "exp_year" integer NOT NULL,
        "is_default" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "payment_methods_square_card_id_unique" UNIQUE("square_card_id"),
        CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action
      )
    `;
    console.log('✅ Done');

    // Create refunds table
    console.log('Creating refunds table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "refunds" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "payment_id" uuid,
        "square_refund_id" text,
        "amount" integer NOT NULL,
        "reason" text,
        "status" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "refunds_square_refund_id_unique" UNIQUE("square_refund_id"),
        CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE cascade ON UPDATE no action
      )
    `;
    console.log('✅ Done');

    // Create indexes
    console.log('\nCreating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS "payment_methods_user_id_idx" ON "payment_methods" ("user_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "refunds_payment_id_idx" ON "refunds" ("payment_id")`;
    console.log('✅ Done');

    console.log('\n🎉 All remaining migrations completed!\n');

    // Verify
    console.log('Verification:');
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('payments', 'payment_methods', 'refunds')
      ORDER BY table_name
    `;
    console.log('Tables:', tables.map(t => t.table_name));

    const columns = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'user_subscriptions'
      AND column_name LIKE 'square_%' OR column_name LIKE 'cancel%'
      ORDER BY column_name
    `;
    console.log('Square columns:', columns.map(c => c.column_name));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testRemaining().catch(console.error).finally(() => pool.end());
