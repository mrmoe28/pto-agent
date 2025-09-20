#!/usr/bin/env node

/**
 * Extract Clerk Production Keys using AppleScript + Playwright
 * This script controls your existing Chrome browser to extract production keys
 */

const { chromium } = require('@playwright/test');
const { execSync } = require('child_process');
const fs = require('fs');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

async function restartChromeWithDebugging() {
  log.header('Setting up Chrome with Remote Debugging');

  try {
    // First, quit Chrome gracefully
    log.info('Closing existing Chrome...');
    execSync('osascript -e \'tell application "Google Chrome" to quit\'', { stdio: 'ignore' });

    // Wait for Chrome to close
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Restart Chrome with remote debugging
    log.info('Restarting Chrome with remote debugging enabled...');
    const chromeCommand = `
      /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \
      --remote-debugging-port=9222 \
      --no-first-run \
      --no-default-browser-check \
      https://dashboard.clerk.com > /dev/null 2>&1 &
    `;

    execSync(chromeCommand, { shell: '/bin/bash' });

    // Wait for Chrome to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify debugging port is open
    try {
      execSync('curl -s http://localhost:9222/json/version', { stdio: 'pipe' });
      log.success('Chrome is now running with remote debugging on port 9222');
      return true;
    } catch (error) {
      log.error('Failed to connect to Chrome debugging port');
      return false;
    }
  } catch (error) {
    log.error(`Failed to restart Chrome: ${error.message}`);
    return false;
  }
}

async function extractKeysWithPlaywright() {
  log.header('Extracting Clerk Production Keys');

  try {
    // Connect to Chrome via CDP
    log.info('Connecting to Chrome...');
    const browser = await chromium.connectOverCDP('http://localhost:9222');

    // Get the first context and page
    const context = browser.contexts()[0];
    const pages = context.pages();

    let clerkPage = null;

    // Find Clerk dashboard page
    for (const page of pages) {
      const url = page.url();
      if (url.includes('clerk.com') || url.includes('dashboard.clerk')) {
        clerkPage = page;
        log.success(`Found Clerk Dashboard: ${url}`);
        break;
      }
    }

    if (!clerkPage) {
      log.warning('Clerk Dashboard not found. Opening it now...');
      clerkPage = pages[0] || await context.newPage();
      await clerkPage.goto('https://dashboard.clerk.com');

      log.info('Please log in to Clerk if needed, then press Enter to continue...');
      await waitForEnter();
    }

    // Navigate to API Keys
    log.info('Navigating to API Keys section...');

    // Try to click on API Keys in the sidebar
    try {
      await clerkPage.click('text="API Keys"', { timeout: 5000 });
    } catch {
      // Try alternative navigation
      try {
        await clerkPage.click('[href*="api-keys"]', { timeout: 5000 });
      } catch {
        log.warning('Could not find API Keys link. Please navigate to API Keys manually and press Enter...');
        await waitForEnter();
      }
    }

    await clerkPage.waitForLoadState('networkidle');

    // Switch to Production if needed
    log.info('Checking for Production environment...');
    try {
      const productionButton = clerkPage.locator('button:has-text("Production"), [role="tab"]:has-text("Production")').first();
      if (await productionButton.isVisible()) {
        await productionButton.click();
        await clerkPage.waitForTimeout(1000);
        log.success('Switched to Production environment');
      }
    } catch {
      log.info('Production environment may already be selected');
    }

    // Extract keys by taking a screenshot and parsing visible text
    log.info('Looking for API keys...');

    // Try to find the keys on the page
    const pageContent = await clerkPage.content();

    // Extract secret key
    let secretKey = null;
    const secretKeyMatch = pageContent.match(/sk_live_[A-Za-z0-9]+/);
    if (secretKeyMatch) {
      secretKey = secretKeyMatch[0];
      log.success(`Found Secret Key: ${secretKey.substring(0, 20)}...`);
    }

    // Extract publishable key
    let publishableKey = null;
    const publishableKeyMatch = pageContent.match(/pk_live_[A-Za-z0-9]+/);
    if (publishableKeyMatch) {
      publishableKey = publishableKeyMatch[0];
      log.success(`Found Publishable Key: ${publishableKey.substring(0, 20)}...`);
    }

    // If keys not found in content, try copying from buttons
    if (!secretKey || !publishableKey) {
      log.info('Keys might be hidden. Trying to copy from buttons...');

      const copyButtons = await clerkPage.$$('button:has-text("Copy"), button[aria-label*="Copy"], button[title*="Copy"]');

      for (const button of copyButtons) {
        try {
          // Get text near the button to identify what it copies
          const parentText = await button.evaluate(el => el.closest('div')?.textContent || '');

          await button.click();
          await clerkPage.waitForTimeout(500);

          // Try to read from clipboard
          const copiedText = await clerkPage.evaluate(() => {
            // Create a temporary textarea to paste
            const textarea = document.createElement('textarea');
            document.body.appendChild(textarea);
            textarea.focus();
            document.execCommand('paste');
            const value = textarea.value;
            document.body.removeChild(textarea);
            return value;
          }).catch(() => null);

          if (copiedText) {
            if (copiedText.startsWith('sk_live_')) {
              secretKey = copiedText;
              log.success(`Copied Secret Key: ${secretKey.substring(0, 20)}...`);
            } else if (copiedText.startsWith('pk_live_')) {
              publishableKey = copiedText;
              log.success(`Copied Publishable Key: ${publishableKey.substring(0, 20)}...`);
            }
          }
        } catch (error) {
          // Continue trying other buttons
        }
      }
    }

    // Return the extracted keys
    return { secretKey, publishableKey };

  } catch (error) {
    log.error(`Failed to extract keys: ${error.message}`);

    // Take a screenshot for debugging
    try {
      const browser = await chromium.connectOverCDP('http://localhost:9222');
      const page = browser.contexts()[0].pages()[0];
      await page.screenshot({ path: 'clerk-debug.png', fullPage: true });
      log.info('Screenshot saved to clerk-debug.png');
    } catch {}

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

async function updateVercelEnvironment(keys) {
  log.header('Updating Vercel Environment Variables');

  const { secretKey, publishableKey } = keys;

  if (!secretKey || !publishableKey) {
    log.error('Could not extract both keys.');
    if (secretKey) log.info(`Secret Key: ${secretKey.substring(0, 20)}...`);
    if (publishableKey) log.info(`Publishable Key: ${publishableKey.substring(0, 20)}...`);

    log.warning('\nPlease update Vercel manually with these commands:');
    if (secretKey) {
      console.log(`echo "${secretKey}" | vercel env add CLERK_SECRET_KEY production`);
    }
    if (publishableKey) {
      console.log(`echo "${publishableKey}" | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production`);
    }
    return false;
  }

  try {
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
    execSync(`echo "${secretKey}" | vercel env add CLERK_SECRET_KEY production`, { stdio: 'pipe' });
    log.success('Added CLERK_SECRET_KEY');

    execSync(`echo "${publishableKey}" | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production`, { stdio: 'pipe' });
    log.success('Added NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');

    // Save to local file for reference
    const envContent = `# Clerk Production Keys - Extracted ${new Date().toISOString()}
# DO NOT COMMIT THIS FILE
CLERK_SECRET_KEY="${secretKey}"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${publishableKey}"
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
  log.header('🔐 Clerk Production Keys Extractor');

  try {
    // Check if Chrome is already running with debugging
    let canConnect = false;
    try {
      execSync('curl -s http://localhost:9222/json/version', { stdio: 'pipe' });
      canConnect = true;
      log.success('Chrome is already running with remote debugging');
    } catch {
      log.warning('Chrome is not running with remote debugging');
    }

    if (!canConnect) {
      log.info('Chrome needs to be restarted with remote debugging enabled.');
      log.warning('This will close and reopen Chrome. Make sure to save any work.');
      console.log('\nPress Enter to continue or Ctrl+C to cancel...');
      await waitForEnter();

      const success = await restartChromeWithDebugging();
      if (!success) {
        log.error('Failed to set up Chrome. Please start Chrome manually with:');
        console.log('/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');
        process.exit(1);
      }

      log.info('Please log in to Clerk Dashboard and navigate to your app, then press Enter...');
      await waitForEnter();
    }

    // Extract keys
    const keys = await extractKeysWithPlaywright();

    // Update Vercel
    const success = await updateVercelEnvironment(keys);

    if (success) {
      log.header('✅ Success!');
      log.info('Next steps:');
      log.info('1. Deploy to production: vercel --prod');
      log.info('2. Run tests: npm run test:clerk:prod');
    }

  } catch (error) {
    log.error(`Failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}