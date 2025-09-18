const { chromium } = require('playwright');

async function testProductionSearch() {
  console.log('🚀 Testing search functionality on production site...');
  console.log('🌐 Target URL: https://pto-agent-main.vercel.app/');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true to run in background
    slowMo: 1000 // Slow down actions for better observation
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] Console ${type.toUpperCase()}: ${text}`);
    
    // Highlight errors and warnings
    if (type === 'error') {
      console.log(`🔴 ERROR: ${text}`);
    } else if (type === 'warning') {
      console.log(`🟡 WARNING: ${text}`);
    }
  });
  
  // Listen to network requests
  page.on('request', request => {
    if (request.url().includes('/api/') || request.url().includes('vercel.app')) {
      console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
    }
  });
  
  // Listen to network responses
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    
    if (url.includes('/api/') || url.includes('vercel.app')) {
      const statusEmoji = status >= 400 ? '🔴' : status >= 300 ? '🟡' : '✅';
      console.log(`${statusEmoji} RESPONSE: ${status} ${url}`);
      
      // Log response body for API calls that might be failing
      if (url.includes('/api/') && status >= 400) {
        response.text().then(text => {
          console.log(`🔴 API Error Response: ${text}`);
        }).catch(err => {
          console.log(`🔴 Could not read error response: ${err.message}`);
        });
      }
    }
  });
  
  try {
    console.log('🌐 Navigating to production site...');
    await page.goto('https://pto-agent-main.vercel.app/', { waitUntil: 'networkidle' });
    
    console.log('📄 Production site loaded, looking for search functionality...');
    
    // Wait for the page to load completely
    await page.waitForTimeout(3000);
    
    // Look for the "Find Permit Office" button or search functionality
    console.log('🔍 Looking for search functionality...');
    
    // Try to find the main CTA button
    const findButton = page.locator('button:has-text("Find Permit Office"), a:has-text("Find Permit Office"), button:has-text("Get Started")').first();
    
    if (await findButton.isVisible()) {
      console.log('✅ Found "Find Permit Office" button, clicking...');
      await findButton.click();
      
      // Wait for navigation or modal
      await page.waitForTimeout(2000);
      
      // Check if we're on a search page or if a search form appeared
      const currentUrl = page.url();
      console.log(`📍 Current URL after click: ${currentUrl}`);
      
      if (currentUrl.includes('/search')) {
        console.log('✅ Navigated to search page');
        await testSearchFunctionality(page);
      } else {
        console.log('🔍 Looking for search form on current page...');
        await testSearchFunctionality(page);
      }
      
    } else {
      console.log('⚠️ Could not find "Find Permit Office" button, trying direct navigation...');
      
      // Try direct navigation to search page
      await page.goto('https://pto-agent-main.vercel.app/search', { waitUntil: 'networkidle' });
      console.log('✅ Navigated directly to search page');
      await testSearchFunctionality(page);
    }
    
  } catch (error) {
    console.log(`🔴 Test failed with error: ${error.message}`);
    console.log(`Stack trace: ${error.stack}`);
    
    // Take screenshot on error
    await page.screenshot({ path: 'production-test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as production-test-error.png');
  } finally {
    // Keep browser open for manual inspection
    console.log('🔄 Browser will remain open for manual inspection...');
    console.log('Press Ctrl+C to close when done.');
    
    // Keep the script running
    await new Promise(() => {});
  }
}

async function testSearchFunctionality(page) {
  console.log('🔍 Testing search functionality...');
  
  // Wait for the page to be ready
  await page.waitForTimeout(2000);
  
  // Look for address input field
  const addressInput = page.locator('input[placeholder*="address"], input[placeholder*="Address"], input[type="text"]').first();
  
  if (await addressInput.isVisible()) {
    console.log('✅ Found address input field');
    
    // Test with a sample Georgia address
    const testAddress = '123 Main St, Atlanta, GA 30309';
    console.log(`📍 Testing with address: ${testAddress}`);
    
    // Type the address
    await addressInput.clear();
    await addressInput.fill(testAddress);
    console.log('✅ Filled address input');
    
    // Wait a moment for any autocomplete to load
    await page.waitForTimeout(2000);
    
    // Look for and click the search button
    const searchButton = page.locator('button:has-text("Find Permit Offices"), button:has-text("Search"), button[type="submit"]').first();
    
    if (await searchButton.isVisible()) {
      console.log('🔍 Clicking search button...');
      await searchButton.click();
      
      // Wait for search results or error messages
      console.log('⏳ Waiting for search results...');
      
      // Wait for either results or error to appear
      try {
        await page.waitForSelector('.bg-red-50, .bg-green-50, [class*="error"], [class*="result"], .bg-white.p-6', { timeout: 15000 });
        console.log('✅ Search completed - found results or error message');
      } catch (timeoutError) {
        console.log('⏰ Search timed out after 15 seconds');
        
        // Check if we were redirected
        const currentUrl = page.url();
        if (currentUrl.includes('/sign-in')) {
          console.log('🔴 REDIRECTED TO SIGN-IN: Authentication required for search');
        } else if (currentUrl.includes('/search')) {
          console.log('📍 Still on search page - checking for results...');
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
      await page.screenshot({ path: 'production-search-test.png', fullPage: true });
      console.log('📸 Screenshot saved as production-search-test.png');
      
    } else {
      console.log('❌ Could not find search button');
    }
    
  } else {
    console.log('❌ Could not find address input field');
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'production-page-layout.png', fullPage: true });
    console.log('📸 Page layout screenshot saved as production-page-layout.png');
  }
  
  // Wait a bit more to see any additional console messages
  console.log('⏳ Waiting 5 seconds for any additional console messages...');
  await page.waitForTimeout(5000);
}

// Run the test
testProductionSearch().catch(console.error);
