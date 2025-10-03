#!/usr/bin/env tsx

import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY not found in .env file');
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

async function createProducts() {
  console.log('Creating Stripe Products...\n');

  try {
    // Create Pro Product
    const proProduct = await stripe.products.create({
      name: 'Pro Plan',
      description: 'Ideal for contractors and frequent permit seekers',
    });

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 2900, // $29.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });

    console.log('✅ Pro Plan Created:');
    console.log(`   Product ID: ${proProduct.id}`);
    console.log(`   Price ID: ${proPrice.id}`);
    console.log(`   Add to .env.local: STRIPE_PRO_PRICE_ID=${proPrice.id}\n`);

    // Create Enterprise Product
    const enterpriseProduct = await stripe.products.create({
      name: 'Enterprise Plan',
      description: 'Perfect for large teams and organizations',
    });

    const enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 9900, // $99.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });

    console.log('✅ Enterprise Plan Created:');
    console.log(`   Product ID: ${enterpriseProduct.id}`);
    console.log(`   Price ID: ${enterprisePrice.id}`);
    console.log(`   Add to .env.local: STRIPE_ENTERPRISE_PRICE_ID=${enterprisePrice.id}\n`);

    console.log('🎉 SUCCESS! Copy the Price IDs above to your .env.local file');

  } catch (error) {
    console.error('❌ Error creating products:', error);
    process.exit(1);
  }
}

createProducts();
