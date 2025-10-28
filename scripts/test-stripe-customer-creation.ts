import { getOrCreateStripeCustomer } from '../src/lib/stripe/customers';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testStripeCustomerCreation() {
  try {
    console.log('Testing Stripe customer creation...\n');

    // Use your actual user ID from the screenshot error
    const testUserId = 'ec58a06f-28ea-47b8-aad7-36e8ed91746f';

    console.log(`Testing with user ID: ${testUserId}`);
    console.log('Attempting to get or create Stripe customer...\n');

    const customer = await getOrCreateStripeCustomer(testUserId);

    console.log('✅ Success! Stripe customer created/retrieved:');
    console.log(`  Customer ID: ${customer.id}`);
    console.log(`  Email: ${customer.email}`);
    console.log(`  Name: ${customer.name || 'N/A'}`);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);

    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testStripeCustomerCreation();
