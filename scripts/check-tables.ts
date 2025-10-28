import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function checkTables() {
  try {
    console.log('Checking tables in database...\n');

    // Get all tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    console.log('Tables found:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });

    // Check if user_subscriptions exists
    const hasUserSubscriptions = tables.some((t: any) => t.table_name === 'user_subscriptions');

    if (hasUserSubscriptions) {
      console.log('\n✅ user_subscriptions table EXISTS');

      // Check columns in user_subscriptions
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user_subscriptions'
        ORDER BY ordinal_position;
      `;

      console.log('\nColumns in user_subscriptions:');
      columns.forEach((col: any) => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });

      // Check if stripe fields exist
      const hasStripeFields = columns.some((c: any) => c.column_name === 'stripe_customer_id');
      console.log(`\n${hasStripeFields ? '✅' : '❌'} Stripe fields ${hasStripeFields ? 'exist' : 'missing'}`);

      // Count rows
      const count = await sql`SELECT COUNT(*) as count FROM user_subscriptions;`;
      console.log(`\nRows in user_subscriptions: ${count[0].count}`);

    } else {
      console.log('\n❌ user_subscriptions table DOES NOT EXIST');
    }

  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkTables();
