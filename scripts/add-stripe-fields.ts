import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function addStripeFields() {
  try {
    console.log('Adding Stripe fields to user_subscriptions table...\n');

    // Add stripe_customer_id column
    console.log('Adding stripe_customer_id column...');
    await sql`
      ALTER TABLE user_subscriptions
      ADD COLUMN IF NOT EXISTS stripe_customer_id text;
    `;
    console.log('✅ stripe_customer_id column added');

    // Add stripe_subscription_id column
    console.log('Adding stripe_subscription_id column...');
    await sql`
      ALTER TABLE user_subscriptions
      ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
    `;
    console.log('✅ stripe_subscription_id column added');

    console.log('\n✅ All Stripe fields added successfully!');

    // Verify the columns were added
    const columns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_subscriptions'
        AND column_name IN ('stripe_customer_id', 'stripe_subscription_id')
      ORDER BY column_name;
    `;

    console.log('\nVerification:');
    columns.forEach((col: any) => {
      console.log(`  ✓ ${col.column_name}`);
    });

  } catch (error) {
    console.error('Error adding Stripe fields:', error);
    process.exit(1);
  }
}

addStripeFields();
