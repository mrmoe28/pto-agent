#!/usr/bin/env tsx

import { sql } from '../src/lib/neon';

async function testSubscriptionCheck() {
  console.log('🧪 Testing subscription system...\n');

  try {
    // 1. Get a test user from the database
    const users = await sql`
      SELECT id, email, name 
      FROM users 
      LIMIT 1
    `;

    if (users.length === 0) {
      console.log('❌ No users found in database. Please register a user first.');
      return;
    }

    const testUser = users[0];
    console.log(`✅ Found test user: ${testUser.email} (ID: ${testUser.id})\n`);

    // 2. Check if user has a subscription record
    const subscriptions = await sql`
      SELECT * 
      FROM user_subscriptions 
      WHERE user_id = ${testUser.id}
    `;

    if (subscriptions.length === 0) {
      console.log('📝 No subscription found. Creating default free tier subscription...');
      
      const [newSub] = await sql`
        INSERT INTO user_subscriptions (
          user_id, 
          plan, 
          status,
          searches_used, 
          searches_limit,
          current_period_start,
          current_period_end
        ) VALUES (
          ${testUser.id},
          'free',
          'active',
          0,
          1,
          NOW(),
          NOW() + INTERVAL '1 month'
        )
        RETURNING *
      `;
      
      console.log('✅ Created subscription:', {
        plan: newSub.plan,
        status: newSub.status,
        searches_used: newSub.searches_used,
        searches_limit: newSub.searches_limit,
      });
    } else {
      const sub = subscriptions[0];
      console.log('✅ Existing subscription found:', {
        plan: sub.plan,
        status: sub.status,
        searches_used: sub.searches_used,
        searches_limit: sub.searches_limit,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
      });
    }

    // 3. Test subscription check logic
    const subscription = subscriptions.length > 0 ? subscriptions[0] : await sql`
      SELECT * FROM user_subscriptions WHERE user_id = ${testUser.id}
    `.then(r => r[0]);

    const canSearch = subscription.searches_used < subscription.searches_limit;
    const remaining = subscription.searches_limit - subscription.searches_used;

    console.log('\n📊 Subscription Status:');
    console.log(`  Plan: ${subscription.plan}`);
    console.log(`  Can search: ${canSearch ? '✅ YES' : '❌ NO'}`);
    console.log(`  Searches used: ${subscription.searches_used} / ${subscription.searches_limit}`);
    console.log(`  Remaining searches: ${remaining}`);

    if (canSearch) {
      console.log('\n✅ User should be able to search without seeing upgrade modal');
    } else {
      console.log('\n⚠️  User has reached their search limit and should see upgrade modal');
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

testSubscriptionCheck()
  .then(() => {
    console.log('\n✨ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
