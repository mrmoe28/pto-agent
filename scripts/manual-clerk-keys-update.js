#!/usr/bin/env node

/**
 * Manual Clerk Production Keys Update Script
 *
 * This script guides you through manually copying production keys from Clerk Dashboard
 * and automatically updates them in Vercel.
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Color codes
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
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  step: (num, msg) => console.log(`${colors.magenta}Step ${num}:${colors.reset} ${msg}`)
};

async function verifyClerkDashboard() {
  log.header('📋 Clerk Dashboard Setup Guide');

  console.log('This script will help you get your production keys from Clerk and update Vercel.\n');

  log.step(1, 'Go to your Clerk Dashboard in the browser');
  console.log('   URL: https://dashboard.clerk.com\n');

  log.step(2, 'Select your application');
  console.log('   Click on your app from the list\n');

  log.step(3, 'Navigate to API Keys');
  console.log('   Click "API Keys" in the left sidebar\n');

  log.step(4, 'Switch to Production');
  console.log('   Click the "Production" tab (not Development)\n');

  log.step(5, 'Copy your keys when ready');
  console.log('   You\'ll need both the Secret Key and Publishable Key\n');

  const ready = await question('Are you on the Production API Keys page? (y/n): ');
  return ready.toLowerCase() === 'y' || ready.toLowerCase() === 'yes';
}

async function getProductionKeys() {
  log.header('🔑 Enter Your Production Keys');

  console.log('Copy and paste your keys from the Clerk Dashboard.\n');
  console.log(`${colors.yellow}Important:${colors.reset} Make sure you're copying PRODUCTION keys (not development)!`);
  console.log('Production keys start with "pk_live_" and "sk_live_"\n');

  // Get Secret Key
  console.log(`${colors.cyan}Secret Key${colors.reset}`);
  console.log('This starts with "sk_live_..." and is used server-side only.');
  const secretKey = await question('Paste your Secret Key: ');

  // Validate secret key
  if (!secretKey.startsWith('sk_live_')) {
    log.error('Invalid key! Production secret keys must start with "sk_live_"');
    log.warning('You entered a key starting with: ' + secretKey.substring(0, 8));
    const proceed = await question('Continue anyway? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      return null;
    }
  }

  // Get Publishable Key
  console.log(`\n${colors.cyan}Publishable Key${colors.reset}`);
  console.log('This starts with "pk_live_..." and is used in your frontend.');
  const publishableKey = await question('Paste your Publishable Key: ');

  // Validate publishable key
  if (!publishableKey.startsWith('pk_live_')) {
    log.error('Invalid key! Production publishable keys must start with "pk_live_"');
    log.warning('You entered a key starting with: ' + publishableKey.substring(0, 8));
    const proceed = await question('Continue anyway? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      return null;
    }
  }

  return { secretKey, publishableKey };
}

async function updateVercelEnvironment(keys) {
  log.header('🚀 Updating Vercel Environment Variables');

  const { secretKey, publishableKey } = keys;

  // Display summary
  console.log('Keys to be updated:');
  console.log(`  Secret Key: ${secretKey.substring(0, 20)}...`);
  console.log(`  Publishable Key: ${publishableKey.substring(0, 20)}...\n`);

  const confirm = await question('Proceed with updating Vercel? (y/n): ');
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    log.info('Operation cancelled.');
    return false;
  }

  try {
    // Check Vercel CLI
    try {
      execSync('vercel --version', { stdio: 'pipe' });
    } catch {
      log.error('Vercel CLI not found. Please install it: npm install -g vercel');
      return false;
    }

    // Check if logged in
    try {
      const user = execSync('vercel whoami', { encoding: 'utf8' }).trim();
      log.success(`Logged in to Vercel as: ${user}`);
    } catch {
      log.error('Not logged in to Vercel. Please run: vercel login');
      return false;
    }

    // Remove old keys
    log.info('Removing old test keys...');
    try {
      execSync('vercel env rm CLERK_SECRET_KEY production --yes', { stdio: 'ignore' });
    } catch {}
    try {
      execSync('vercel env rm NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production --yes', { stdio: 'ignore' });
    } catch {}

    // Add new production keys
    log.info('Adding production keys to Vercel...');

    // Add secret key
    execSync(`echo "${secretKey}" | vercel env add CLERK_SECRET_KEY production`, { stdio: 'pipe' });
    log.success('Added CLERK_SECRET_KEY');

    // Add publishable key
    execSync(`echo "${publishableKey}" | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production`, { stdio: 'pipe' });
    log.success('Added NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');

    // Update other required variables
    const otherVars = [
      { key: 'NEXT_PUBLIC_CLERK_SIGN_IN_URL', value: '/sign-in' },
      { key: 'NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL', value: '/' },
      { key: 'NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL', value: '/' }
    ];

    for (const { key, value } of otherVars) {
      try {
        execSync(`echo "${value}" | vercel env add ${key} production`, { stdio: 'pipe' });
        log.success(`Updated ${key}`);
      } catch {
        // Variable might already exist with same value
      }
    }

    // Save keys locally for reference
    const envContent = `# Clerk Production Keys - Updated ${new Date().toISOString()}
# DO NOT COMMIT THIS FILE

# Production Keys (from Clerk Dashboard)
CLERK_SECRET_KEY="${secretKey}"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${publishableKey}"

# URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/"
`;

    fs.writeFileSync('.env.production.clerk', envContent);
    log.info('Keys saved to .env.production.clerk for reference');

    // Add to gitignore if not already there
    try {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      if (!gitignore.includes('.env.production.clerk')) {
        fs.appendFileSync('.gitignore', '\n.env.production.clerk\n');
      }
    } catch {}

    return true;
  } catch (error) {
    log.error(`Failed to update Vercel: ${error.message}`);
    return false;
  }
}

async function main() {
  log.header('🔐 Clerk Production Keys Manual Update');

  try {
    // Guide user to Clerk Dashboard
    const ready = await verifyClerkDashboard();
    if (!ready) {
      log.info('Please navigate to the Production API Keys page and run this script again.');
      rl.close();
      return;
    }

    // Get production keys
    const keys = await getProductionKeys();
    if (!keys) {
      log.error('Failed to get valid keys. Please try again.');
      rl.close();
      return;
    }

    // Update Vercel
    const success = await updateVercelEnvironment(keys);

    if (success) {
      log.header('✅ Success! Production Keys Updated');

      console.log('\nNext steps:');
      console.log('1. Deploy to production:');
      console.log('   ' + colors.cyan + 'vercel --prod' + colors.reset);
      console.log('\n2. Wait for deployment to complete (2-3 minutes)');
      console.log('\n3. Run the production test:');
      console.log('   ' + colors.cyan + 'npm run test:clerk:prod' + colors.reset);
      console.log('\n4. Verify in browser:');
      console.log('   Visit your production URL and test sign in/sign up');
    } else {
      log.warning('Update was not completed. Please check the errors above.');
    }

  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Handle graceful exit
process.on('SIGINT', () => {
  console.log('\n\nCancelled by user.');
  rl.close();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}