const { chromium } = require('playwright');

async function testSearchFunctionality() {
  console.log('🚀 Starting Playwright search test...');
  
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
    console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
  });
  
  // Listen to network responses
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
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
  });
  
  try {
    console.log('🌐 Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    console.log('📄 Page loaded, looking for search page...');
    
    // Try to navigate to search page
    try {
      await page.click('a[href="/search"]', { timeout: 5000 });
      console.log('✅ Clicked search link');
    } catch (error) {
      console.log('⚠️ Could not find search link, trying direct navigation...');
      await page.goto('http://localhost:3000/search', { waitUntil: 'networkidle' });
    }
    
    console.log('🔍 On search page, looking for address input...');
    
    // Wait for the address input to be visible
    await page.waitForSelector('input[placeholder*="address"], input[placeholder*="Address"]', { timeout: 10000 });
    console.log('✅ Found address input field');
    
    // Test with a sample Georgia address
    const testAddress = '123 Main St, Atlanta, GA 30309';
    console.log(`📍 Testing with address: ${testAddress}`);
    
    // Type the address
    await page.fill('input[placeholder*="address"], input[placeholder*="Address"]', testAddress);
    console.log('✅ Filled address input');
    
    // Wait a moment for any autocomplete to load
    await page.waitForTimeout(2000);
    
    // Look for and click the search button
    const searchButton = await page.locator('button:has-text("Find Permit Offices"), button:has-text("Search")').first();
    await searchButton.click();
    console.log('🔍 Clicked search button');
    
    // Wait for search results or error messages
    console.log('⏳ Waiting for search results...');
    
    // Wait for either results or error to appear
    try {
      await page.waitForSelector('.bg-red-50, .bg-green-50, [class*="error"], [class*="result"]', { timeout: 15000 });
      console.log('✅ Search completed - found results or error message');
    } catch (timeoutError) {
      console.log('⏰ Search timed out after 15 seconds');
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
    await page.screenshot({ path: 'search-test-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved as search-test-screenshot.png');
    
    // Wait a bit more to see any additional console messages
    console.log('⏳ Waiting 5 seconds for any additional console messages...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.log(`🔴 Test failed with error: ${error.message}`);
    console.log(`Stack trace: ${error.stack}`);
    
    // Take screenshot on error
    await page.screenshot({ path: 'search-test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as search-test-error.png');
  } finally {
    await browser.close();
    console.log('🏁 Test completed');
  }
}

// Run the test
testSearchFunctionality().catch(console.error);
