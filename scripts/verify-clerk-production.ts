#!/usr/bin/env tsx

/**
 * Script to verify Clerk configuration in production
 * Checks if Clerk environment variables are properly set
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ClerkConfig {
  publishableKey?: string;
  secretKey?: string;
  frontendApi?: string;
}

async function checkLocalEnv(): Promise<ClerkConfig> {
  console.log('📋 Checking local .env configuration...\n');

  const config: ClerkConfig = {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  };

  console.log('Local Environment:');
  console.log('  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', config.publishableKey ? '✅ Set' : '❌ Missing');
  console.log('  CLERK_SECRET_KEY:', config.secretKey ? '✅ Set' : '❌ Missing');

  if (config.publishableKey) {
    console.log('  Publishable Key Preview:', config.publishableKey.substring(0, 20) + '...');
  }

  return config;
}

async function checkVercelEnv(): Promise<void> {
  console.log('\n📡 Checking Vercel environment variables...\n');

  try {
    const { stdout } = await execAsync('vercel env ls production');
    console.log('Vercel Production Environment Variables:');
    console.log(stdout);

    // Check if Clerk vars are present
    const hasPublishableKey = stdout.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
    const hasSecretKey = stdout.includes('CLERK_SECRET_KEY');

    console.log('\nVercel Clerk Configuration:');
    console.log('  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', hasPublishableKey ? '✅ Found' : '❌ Missing');
    console.log('  CLERK_SECRET_KEY:', hasSecretKey ? '✅ Found' : '❌ Missing');

    if (!hasPublishableKey || !hasSecretKey) {
      console.log('\n⚠️  WARNING: Missing Clerk environment variables in Vercel!');
      console.log('\nTo add them, run:');
      console.log('  vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production');
      console.log('  vercel env add CLERK_SECRET_KEY production');
    }
  } catch (error) {
    console.error('❌ Error checking Vercel environment:', error);
    console.log('\nMake sure you are logged in to Vercel CLI:');
    console.log('  vercel login');
  }
}

async function testProductionClerk(): Promise<void> {
  console.log('\n🌐 Testing Clerk on production site...\n');

  try {
    const response = await fetch('https://ptoagent.app/sign-in');
    const html = await response.text();

    // Check if Clerk script is loaded
    const hasClerkScript = html.includes('clerk.') || html.includes('@clerk');
    const hasPublishableKey = html.includes('pk_test_') || html.includes('pk_live_');

    console.log('Production Site Check:');
    console.log('  Status:', response.status === 200 ? '✅ 200 OK' : `❌ ${response.status}`);
    console.log('  Clerk Script:', hasClerkScript ? '✅ Loaded' : '❌ Not Found');
    console.log('  Publishable Key:', hasPublishableKey ? '✅ Present' : '❌ Missing');

    if (!hasClerkScript || !hasPublishableKey) {
      console.log('\n⚠️  WARNING: Clerk may not be properly configured on production!');
      console.log('This will cause sign-in to fail.');
    }
  } catch (error) {
    console.error('❌ Error testing production:', error);
  }
}

async function suggestFixes(): Promise<void> {
  console.log('\n💡 Suggested Fixes:\n');
  console.log('1. Add Clerk environment variables to Vercel:');
  console.log('   • Go to: https://vercel.com/ekoapps/pto-agent-main/settings/environment-variables');
  console.log('   • Add: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (from .env)');
  console.log('   • Add: CLERK_SECRET_KEY (from .env)');
  console.log('   • Redeploy after adding');
  console.log('');
  console.log('2. Or use Vercel CLI:');
  console.log('   vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production');
  console.log('   vercel env add CLERK_SECRET_KEY production');
  console.log('');
  console.log('3. Verify Clerk Dashboard:');
  console.log('   • Go to: https://dashboard.clerk.com');
  console.log('   • Check API Keys match your .env file');
  console.log('   • Verify domains are whitelisted (ptoagent.app)');
}

async function main() {
  console.log('🔍 Clerk Production Configuration Checker\n');
  console.log('='.repeat(50) + '\n');

  // Check local environment
  await checkLocalEnv();

  // Check Vercel environment
  await checkVercelEnv();

  // Test production site
  await testProductionClerk();

  // Suggest fixes
  await suggestFixes();

  console.log('\n' + '='.repeat(50));
  console.log('✅ Verification complete!\n');
}

main().catch(console.error);
