#!/usr/bin/env node

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY not found in environment variables');
  console.log('Please ensure .env.local contains STRIPE_SECRET_KEY');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createProducts() {
  try {
    console.log('Creating Stripe products and prices...\n');

    // Create Pro Product
    const proProduct = await stripe.products.create({
      name: 'Pro Plan',
      description: 'Ideal for contractors and frequent permit seekers - 40 searches per month',
      metadata: {
        plan_type: 'pro',
        searches_limit: '40'
      }
    });

    console.log('✅ Created Pro Product:', proProduct.id);

    // Create Pro Price
    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 2900, // $29.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_type: 'pro'
      }
    });

    console.log('✅ Created Pro Price:', proPrice.id);
    console.log('   Amount: $29.00/month\n');

    // Create Enterprise Product
    const enterpriseProduct = await stripe.products.create({
      name: 'Enterprise Plan',
      description: 'Perfect for large teams and organizations - Unlimited searches',
      metadata: {
        plan_type: 'enterprise',
        searches_limit: 'unlimited'
      }
    });

    console.log('✅ Created Enterprise Product:', enterpriseProduct.id);

    // Create Enterprise Price
    const enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 9900, // $99.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_type: 'enterprise'
      }
    });

    console.log('✅ Created Enterprise Price:', enterprisePrice.id);
    console.log('   Amount: $99.00/month\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Add these to your Vercel environment:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`STRIPE_PRO_PRICE_ID="${proPrice.id}"`);
    console.log(`STRIPE_ENTERPRISE_PRICE_ID="${enterprisePrice.id}"`);
    console.log('\n✅ All products created successfully!');

  } catch (error) {
    console.error('❌ Error creating products:', error.message);
    process.exit(1);
  }
}

createProducts();
