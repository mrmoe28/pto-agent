#!/usr/bin/env node

/**
 * Automated Clerk Production Keys Extractor
 *
 * This script connects to your existing Chrome browser session where you're
 * already logged into Clerk Dashboard and extracts the production keys.
 *
 * Prerequisites:
 * 1. Chrome must be running with remote debugging enabled
 * 2. You must be logged into Clerk Dashboard
 *
 * Usage:
 * 1. First, start Chrome with debugging: npm run chrome:debug
 * 2. Log into Clerk Dashboard manually
 * 3. Run this script: npm run extract:keys
 */

const { chromium } = require('@playwright/test');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

async function connectToExistingBrowser() {
  try {
    log.info('Connecting to existing Chrome browser...');

    // Connect to the existing browser instance
    const browser = await chromium.connectOverCDP('http://localhost:9222');

    log.success('Connected to browser');

    // Get the default context
    const defaultContext = browser.contexts()[0];

    // Get all open pages
    const pages = defaultContext.pages();

    log.info(`Found ${pages.length} open tabs`);

    // Find Clerk dashboard page
    let clerkPage = null;
    for (const page of pages) {
      const url = page.url();
      if (url.includes('clerk.com') || url.includes('dashboard.clerk')) {
        clerkPage = page;
        log.success(`Found Clerk Dashboard tab: ${url}`);
        break;
      }
    }

    if (!clerkPage) {
      // Open Clerk dashboard in a new tab
      log.info('Clerk Dashboard not found. Opening it now...');
      clerkPage = await defaultContext.newPage();
      await clerkPage.goto('https://dashboard.clerk.com');
      log.info('Please log in to Clerk Dashboard if needed, then press Enter to continue...');
      await waitForEnter();
    }

    return { browser, clerkPage };
  } catch (error) {
    log.error(`Failed to connect to browser: ${error.message}`);
    log.info('Make sure Chrome is running with remote debugging enabled');
    log.info('Run: npm run chrome:debug');
    throw error;
  }
}

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.pause();
      resolve();
    });
  });
}

async function extractProductionKeys(page) {
  log.header('Extracting Production Keys from Clerk Dashboard');

  try {
    // Navigate to API Keys section
    log.info('Navigating to API Keys section...');

    // Try to find and click on API Keys link
    const apiKeysLink = page.locator('a:has-text("API Keys"), button:has-text("API Keys")').first();
    if (await apiKeysLink.isVisible()) {
      await apiKeysLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      // Try navigation menu
      const navMenu = page.locator('[aria-label="Navigation"], nav').first();
      if (await navMenu.isVisible()) {
        const apiKeysNav = navMenu.locator('text=API Keys').first();
        if (await apiKeysNav.isVisible()) {
          await apiKeysNav.click();
          await page.waitForLoadState('networkidle');
        }
      }
    }

    // Wait for the API keys page to load
    await page.waitForSelector('text=/Secret key|Publishable key/i', { timeout: 10000 }).catch(() => {});

    // Switch to Production tab if available
    log.info('Switching to Production environment...');
    const productionTab = page.locator('button:has-text("Production"), [role="tab"]:has-text("Production")').first();
    if (await productionTab.isVisible()) {
      await productionTab.click();
      await page.waitForTimeout(1000);
    }

    // Extract keys
    log.info('Extracting keys...');

    // Try multiple selectors for secret key
    const secretKeySelectors = [
      'text=/sk_live_/i',
      '[data-testid*="secret"]',
      'code:has-text("sk_live_")',
      'pre:has-text("sk_live_")',
      'input[value*="sk_live_"]',
      '[aria-label*="Secret key"]'
    ];

    let secretKey = null;
    for (const selector of secretKeySelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        secretKey = await element.textContent() || await element.inputValue();
        if (secretKey && secretKey.includes('sk_live_')) {
          secretKey = secretKey.match(/sk_live_[A-Za-z0-9]+/)?.[0];
          break;
        }
      }
    }

    // Try multiple selectors for publishable key
    const publishableKeySelectors = [
      'text=/pk_live_/i',
      '[data-testid*="publishable"]',
      'code:has-text("pk_live_")',
      'pre:has-text("pk_live_")',
      'input[value*="pk_live_"]',
      '[aria-label*="Publishable key"]'
    ];

    let publishableKey = null;
    for (const selector of publishableKeySelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        publishableKey = await element.textContent() || await element.inputValue();
        if (publishableKey && publishableKey.includes('pk_live_')) {
          publishableKey = publishableKey.match(/pk_live_[A-Za-z0-9]+/)?.[0];
          break;
        }
      }
    }

    // If keys are hidden, look for copy buttons
    if (!secretKey || !publishableKey) {
      log.info('Keys might be hidden. Looking for copy buttons...');

      // Try to find and click copy buttons
      const copyButtons = await page.locator('button:has-text("Copy"), button[aria-label*="Copy"]').all();

      for (const button of copyButtons) {
        await button.click();
        await page.waitForTimeout(500);

        // Try to get from clipboard (this might not work due to browser restrictions)
        const clipboardText = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);

        if (clipboardText) {
          if (clipboardText.startsWith('sk_live_')) {
            secretKey = clipboardText;
            log.success('Found secret key from clipboard');
          } else if (clipboardText.startsWith('pk_live_')) {
            publishableKey = clipboardText;
            log.success('Found publishable key from clipboard');
          }
        }
      }
    }

    return {
      secretKey,
      publishableKey
    };
  } catch (error) {
    log.error(`Failed to extract keys: ${error.message}`);

    // Take a screenshot for debugging
    const screenshotPath = path.join(__dirname, 'clerk-dashboard-debug.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log.info(`Screenshot saved to ${screenshotPath}`);

    throw error;
  }
}

async function updateVercelEnvironment(keys) {
  log.header('Updating Vercel Environment Variables');

  const { secretKey, publishableKey } = keys;

  if (!secretKey || !publishableKey) {
    log.error('Could not extract both keys. Please extract them manually.');
    if (secretKey) log.info(`Secret Key: ${secretKey.substring(0, 20)}...`);
    if (publishableKey) log.info(`Publishable Key: ${publishableKey}`);
    return false;
  }

  log.success(`Found Secret Key: ${secretKey.substring(0, 20)}...`);
  log.success(`Found Publishable Key: ${publishableKey.substring(0, 20)}...`);

  try {
    // Remove old keys
    log.info('Removing old test keys from Vercel...');
    execSync('vercel env rm CLERK_SECRET_KEY production --yes', { stdio: 'ignore' }).toString().catch(() => {});
    execSync('vercel env rm NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production --yes', { stdio: 'ignore' }).toString().catch(() => {});

    // Add new production keys
    log.info('Adding production keys to Vercel...');
    execSync(`echo "${secretKey}" | vercel env add CLERK_SECRET_KEY production`, { stdio: 'pipe' });
    execSync(`echo "${publishableKey}" | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production`, { stdio: 'pipe' });

    // Ensure other required variables are set
    const otherVars = [
      { key: 'NEXT_PUBLIC_CLERK_SIGN_IN_URL', value: '/sign-in' },
      { key: 'NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL', value: '/' },
      { key: 'NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL', value: '/' }
    ];

    for (const { key, value } of otherVars) {
      try {
        execSync(`echo "${value}" | vercel env add ${key} production`, { stdio: 'pipe' });
        log.success(`Updated ${key}`);
      } catch (error) {
        // Variable might already exist
        log.info(`${key} already set or updated`);
      }
    }

    log.success('All environment variables updated successfully!');

    // Save keys to local .env.production for reference (but gitignored)
    const envContent = `# Production Clerk Keys (DO NOT COMMIT)
CLERK_SECRET_KEY="${secretKey}"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${publishableKey}"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/"
`;

    fs.writeFileSync('.env.production.keys', envContent);
    log.info('Keys saved to .env.production.keys (gitignored)');

    return true;
  } catch (error) {
    log.error(`Failed to update Vercel: ${error.message}`);
    return false;
  }
}

async function main() {
  log.header('🔐 Clerk Production Keys Automation');

  try {
    // Connect to existing browser
    const { browser, clerkPage } = await connectToExistingBrowser();

    // Extract production keys
    const keys = await extractProductionKeys(clerkPage);

    // Update Vercel environment
    const success = await updateVercelEnvironment(keys);

    if (success) {
      log.header('✅ Setup Complete!');
      log.info('Next steps:');
      log.info('1. Deploy to production: vercel --prod');
      log.info('2. Run tests: npx playwright test tests/clerk-integration.spec.ts');
    } else {
      log.warning('Manual intervention required. Please check the output above.');
    }

    // Don't close the browser since it's the user's session
    log.info('Browser session kept open');

  } catch (error) {
    log.error(`Script failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { connectToExistingBrowser, extractProductionKeys };