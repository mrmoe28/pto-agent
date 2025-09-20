#!/usr/bin/env node

/**
 * Clerk Production Environment Variables Update Script
 * 
 * This script automates the update of all Clerk-related environment variables
 * in Vercel production environment.
 * 
 * Usage:
 *   node scripts/update-clerk-production-env.js
 * 
 * The script will prompt for each required value and update Vercel automatically.
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

// Environment variables to update
const clerkEnvVars = [
  {
    key: 'CLERK_SECRET_KEY',
    description: 'Clerk Secret Key (starts with sk_live_...)',
    validation: (value) => value.startsWith('sk_live_'),
    errorMsg: 'Secret key must start with sk_live_ for production'
  },
  {
    key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    description: 'Clerk Publishable Key (starts with pk_live_...)',
    validation: (value) => value.startsWith('pk_live_'),
    errorMsg: 'Publishable key must start with pk_live_ for production'
  },
  {
    key: 'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
    description: 'Sign-in URL (e.g., /sign-in)',
    validation: (value) => value.startsWith('/'),
    errorMsg: 'Sign-in URL must start with /'
  },
  {
    key: 'NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL',
    description: 'Sign-up redirect URL (e.g., /dashboard)',
    validation: (value) => value.startsWith('/'),
    errorMsg: 'Redirect URL must start with /'
  },
  {
    key: 'NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL',
    description: 'Sign-in redirect URL (e.g., /dashboard)',
    validation: (value) => value.startsWith('/'),
    errorMsg: 'Redirect URL must start with /'
  }
];

async function updateEnvironmentVariable(key, value, description) {
  try {
    log.info(`Updating ${key}...`);
    
    // Use echo to pipe the value to vercel env add
    const command = `echo "${value}" | vercel env add ${key} production`;
    execSync(command, { stdio: 'pipe' });
    
    log.success(`${key} updated successfully`);
    return true;
  } catch (error) {
    log.error(`Failed to update ${key}: ${error.message}`);
    return false;
  }
}

async function verifyVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    log.success('Vercel CLI is available');
    return true;
  } catch (error) {
    log.error('Vercel CLI not found. Please install it first: npm install -g vercel');
    return false;
  }
}

async function main() {
  log.header('🔐 Clerk Production Environment Setup');
  
  console.log('This script will help you update all Clerk environment variables for production.');
  console.log('Make sure you have your production keys from the Clerk dashboard ready.\n');
  
  // Verify Vercel CLI
  if (!(await verifyVercelCLI())) {
    process.exit(1);
  }
  
  // Check if user is logged into Vercel
  try {
    execSync('vercel whoami', { stdio: 'pipe' });
    log.success('Logged into Vercel');
  } catch (error) {
    log.error('Not logged into Vercel. Please run: vercel login');
    process.exit(1);
  }
  
  const values = {};
  let allValid = true;
  
  // Collect all values first
  for (const envVar of clerkEnvVars) {
    console.log(`\n${colors.cyan}${envVar.description}${colors.reset}`);
    const value = await question(`Enter ${envVar.key}: `);
    
    if (envVar.validation && !envVar.validation(value)) {
      log.error(envVar.errorMsg);
      allValid = false;
      break;
    }
    
    values[envVar.key] = value;
  }
  
  if (!allValid) {
    log.error('Validation failed. Please check your input and try again.');
    process.exit(1);
  }
  
  // Confirm before updating
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY OF CHANGES:');
  console.log('='.repeat(50));
  
  for (const [key, value] of Object.entries(values)) {
    const displayValue = key.includes('SECRET') ? 
      `${value.substring(0, 10)}...` : value;
    console.log(`${key}: ${displayValue}`);
  }
  
  console.log('='.repeat(50));
  
  const confirm = await question('\nProceed with updating Vercel environment variables? (y/N): ');
  
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    log.info('Operation cancelled.');
    process.exit(0);
  }
  
  // Update environment variables
  log.header('🚀 Updating Environment Variables');
  
  let successCount = 0;
  for (const [key, value] of Object.entries(values)) {
    if (await updateEnvironmentVariable(key, value, '')) {
      successCount++;
    }
  }
  
  // Final summary
  log.header('📊 Update Summary');
  
  if (successCount === clerkEnvVars.length) {
    log.success(`All ${clerkEnvVars.length} environment variables updated successfully!`);
    console.log('\nNext steps:');
    console.log('1. Redeploy your application: vercel --prod');
    console.log('2. Test the authentication flow');
    console.log('3. Verify production settings in Clerk dashboard');
  } else {
    log.error(`${successCount}/${clerkEnvVars.length} environment variables updated successfully.`);
    log.warning('Please check the errors above and try updating the failed variables manually.');
  }
  
  rl.close();
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});

// Run the script
main().catch((error) => {
  log.error(`Script failed: ${error.message}`);
  process.exit(1);
});
