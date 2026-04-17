import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkTables() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    console.log('Checking tables in database...\n');

    const { rows: tables } = await client.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('Tables found:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));

    const hasUserSubscriptions = tables.some(t => t.table_name === 'user_subscriptions');

    if (hasUserSubscriptions) {
      console.log('\n✅ user_subscriptions table EXISTS');

      const { rows: columns } = await client.query<{
        column_name: string;
        data_type: string;
        is_nullable: string;
      }>(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user_subscriptions'
        ORDER BY ordinal_position;
      `);

      console.log('\nColumns in user_subscriptions:');
      columns.forEach(c => {
        console.log(`  - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });

      const hasStripeFields = columns.some(c => c.column_name === 'stripe_customer_id');
      console.log(`\n${hasStripeFields ? '✅' : '❌'} Stripe fields ${hasStripeFields ? 'exist' : 'missing'}`);

      const { rows: countRows } = await client.query<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM user_subscriptions;'
      );
      console.log(`\nRows in user_subscriptions: ${countRows[0].count}`);

    } else {
      console.log('\n❌ user_subscriptions table DOES NOT EXIST');
    }

  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await client.end();
  }
}

checkTables();
