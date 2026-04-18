import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function addStripeFields() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    console.log('Adding Stripe fields to user_subscriptions table...\n');

    console.log('Adding stripe_customer_id column...');
    await client.query(`
      ALTER TABLE user_subscriptions
      ADD COLUMN IF NOT EXISTS stripe_customer_id text;
    `);
    console.log('✅ stripe_customer_id column added');

    console.log('Adding stripe_subscription_id column...');
    await client.query(`
      ALTER TABLE user_subscriptions
      ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
    `);
    console.log('✅ stripe_subscription_id column added');

    console.log('\n✅ All Stripe fields added successfully!');

    const { rows: columns } = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_subscriptions'
        AND column_name IN ('stripe_customer_id', 'stripe_subscription_id')
      ORDER BY column_name;
    `);

    console.log('\nVerification:');
    columns.forEach((col: { column_name: string }) => {
      console.log(`  ✓ ${col.column_name}`);
    });

  } catch (error) {
    console.error('Error adding Stripe fields:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addStripeFields();
