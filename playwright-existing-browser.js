const { chromium } = require('playwright');

async function connectToExistingBrowser() {
  console.log('🔗 Connecting to existing browser session...');
  
  try {
    // Connect to an existing browser instance
    // This will look for a browser that's already running
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    
    // Get the first available context/page
    const contexts = browser.contexts();
    let context, page;
    
    if (contexts.length > 0) {
      context = contexts[0];
      const pages = context.pages();
      if (pages.length > 0) {
        page = pages[0];
        console.log('✅ Connected to existing page');
      } else {
        page = await context.newPage();
        console.log('✅ Created new page in existing context');
      }
    } else {
      context = await browser.newContext();
      page = await context.newPage();
      console.log('✅ Created new context and page');
    }
    
    // Navigate to the search page if not already there
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (!currentUrl.includes('/search')) {
      console.log('🌐 Navigating to search page...');
      await page.goto('http://localhost:3000/search', { waitUntil: 'networkidle' });
    }
    
    // Set up console monitoring
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      const timestamp = new Date().toISOString();
      
      console.log(`[${timestamp}] Console ${type.toUpperCase()}: ${text}`);
      
      if (type === 'error') {
        console.log(`🔴 ERROR: ${text}`);
      } else if (type === 'warning') {
        console.log(`🟡 WARNING: ${text}`);
      }
    });
    
    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`📤 API REQUEST: ${request.method()} ${request.url()}`);
      }
    });
    
    // Monitor network responses
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        const url = response.url();
        const statusEmoji = status >= 400 ? '🔴' : status >= 300 ? '🟡' : '✅';
        console.log(`${statusEmoji} API RESPONSE: ${status} ${url}`);
        
        if (status >= 400) {
          response.text().then(text => {
            console.log(`🔴 API Error Response: ${text}`);
          }).catch(err => {
            console.log(`🔴 Could not read error response: ${err.message}`);
          });
        }
      }
    });
    
    // Wait for the page to be ready
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded and ready');
    
    // Look for the address input field
    console.log('🔍 Looking for address input field...');
    const addressInput = await page.locator('input[placeholder*="address"], input[placeholder*="Address"]').first();
    
    if (await addressInput.isVisible()) {
      console.log('✅ Found address input field');
      
      // Clear any existing text and enter test address
      const testAddress = '123 Main St, Atlanta, GA 30309';
      console.log(`📍 Entering test address: ${testAddress}`);
      
      await addressInput.clear();
      await addressInput.fill(testAddress);
      
      // Wait a moment for any autocomplete suggestions
      await page.waitForTimeout(2000);
      
      // Look for and click the search button
      console.log('🔍 Looking for search button...');
      const searchButton = page.locator('button:has-text("Find Permit Offices"), button:has-text("Search")').first();
      
      if (await searchButton.isVisible()) {
        console.log('✅ Found search button, clicking...');
        await searchButton.click();
        
        // Wait for search results or error messages
        console.log('⏳ Waiting for search results...');
        
        try {
          // Wait for either results, error, or redirect
          await page.waitForSelector('.bg-red-50, .bg-green-50, [class*="error"], [class*="result"], .bg-white.p-6', { timeout: 10000 });
          console.log('✅ Search completed - found results or error message');
        } catch (timeoutError) {
          console.log('⏰ Search timed out after 10 seconds');
          
          // Check if we were redirected to sign-in
          const currentUrl = page.url();
          if (currentUrl.includes('/sign-in')) {
            console.log('🔴 REDIRECTED TO SIGN-IN: Authentication required for search');
          }
        }
        
        // Check for error messages
        const errorElements = await page.locator('.bg-red-50, [class*="error"]').all();
        if (errorElements.length > 0) {
          console.log('🔴 Found error messages:');
          for (const errorEl of errorElements) {
            const errorText = await errorEl.textContent();
            console.log(`   - ${errorText}`);
          }
        }
        
        // Check for results
        const resultElements = await page.locator('[class*="result"], .bg-white.p-6').all();
        if (resultElements.length > 0) {
          console.log(`✅ Found ${resultElements.length} result(s)`);
        } else {
          console.log('❌ No results found');
        }
        
        // Take a screenshot for debugging
        await page.screenshot({ path: 'existing-browser-search-test.png', fullPage: true });
        console.log('📸 Screenshot saved as existing-browser-search-test.png');
        
      } else {
        console.log('❌ Could not find search button');
      }
      
    } else {
      console.log('❌ Could not find address input field');
    }
    
    // Keep the browser connection alive for manual testing
    console.log('🔄 Browser connection maintained. You can now interact manually.');
    console.log('Press Ctrl+C to disconnect when done.');
    
    // Keep the script running
    await new Promise(() => {});
    
  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.log('❌ Could not connect to existing browser. Make sure Chrome is running with remote debugging enabled.');
      console.log('💡 To enable remote debugging, start Chrome with:');
      console.log('   chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug');
      console.log('   or');
      console.log('   google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug');
    } else {
      console.log(`🔴 Connection failed: ${error.message}`);
    }
  }
}

// Alternative method: Connect to browser with different approaches
async function connectWithFallback() {
  console.log('🔄 Trying alternative connection methods...');
  
  // Try different CDP endpoints
  const endpoints = [
    'http://localhost:9222',
    'http://127.0.0.1:9222',
    'ws://localhost:9222',
    'ws://127.0.0.1:9222'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔗 Trying to connect to ${endpoint}...`);
      const browser = await chromium.connectOverCDP(endpoint);
      console.log(`✅ Successfully connected to ${endpoint}`);
      return browser;
    } catch (error) {
      console.log(`❌ Failed to connect to ${endpoint}: ${error.message}`);
    }
  }
  
  throw new Error('Could not connect to any browser instance');
}

// Run the connection test
connectToExistingBrowser().catch(async (error) => {
  console.log('🔄 Primary connection failed, trying fallback methods...');
  try {
    await connectWithFallback();
  } catch (fallbackError) {
    console.log('❌ All connection methods failed');
    console.log('💡 Make sure you have a browser running with remote debugging enabled');
    console.log('   or use the regular Playwright script that opens a new browser');
  }
});
