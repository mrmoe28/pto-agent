const { chromium } = require('playwright');

async function simpleBrowserTest() {
  console.log('🚀 Starting simple browser connection test...');
  
  try {
    // Method 1: Try to connect to existing browser via CDP
    console.log('🔗 Attempting to connect to existing browser...');
    
    let browser;
    try {
      browser = await chromium.connectOverCDP('http://localhost:9222');
      console.log('✅ Connected to existing browser via CDP');
    } catch (cdpError) {
      console.log('❌ CDP connection failed, launching new browser...');
      browser = await chromium.launch({ 
        headless: false,
        args: ['--remote-debugging-port=9222']
      });
      console.log('✅ Launched new browser with debugging enabled');
    }
    
    // Get or create a page
    const contexts = browser.contexts();
    let page;
    
    if (contexts.length > 0 && contexts[0].pages().length > 0) {
      page = contexts[0].pages()[0];
      console.log('✅ Using existing page');
    } else {
      const context = await browser.newContext();
      page = await context.newPage();
      console.log('✅ Created new page');
    }
    
    // Navigate to the app if not already there
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (!currentUrl.includes('localhost:3000')) {
      console.log('🌐 Navigating to localhost:3000...');
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    }
    
    // Set up monitoring
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' || type === 'warning') {
        console.log(`[${type.toUpperCase()}] ${text}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        const emoji = status >= 400 ? '🔴' : '✅';
        console.log(`${emoji} API: ${status} ${response.url()}`);
      }
    });
    
    // Navigate to search page
    console.log('🔍 Navigating to search page...');
    await page.goto('http://localhost:3000/search', { waitUntil: 'networkidle' });
    
    // Wait for page to be ready
    await page.waitForTimeout(2000);
    
    // Test the search functionality
    console.log('🔍 Testing search functionality...');
    
    // Find and fill the address input
    const addressInput = page.locator('input').first();
    if (await addressInput.isVisible()) {
      console.log('✅ Found input field');
      
      const testAddress = '123 Main St, Atlanta, GA 30309';
      console.log(`📍 Entering: ${testAddress}`);
      
      await addressInput.clear();
      await addressInput.fill(testAddress);
      
      // Wait for autocomplete
      await page.waitForTimeout(2000);
      
      // Find and click search button
      const searchButton = page.locator('button').filter({ hasText: /find|search/i }).first();
      if (await searchButton.isVisible()) {
        console.log('✅ Found search button, clicking...');
        await searchButton.click();
        
        // Wait for results
        console.log('⏳ Waiting for search results...');
        await page.waitForTimeout(5000);
        
        // Check current URL
        const finalUrl = page.url();
        console.log(`📍 Final URL: ${finalUrl}`);
        
        if (finalUrl.includes('/sign-in')) {
          console.log('🔴 ISSUE: Redirected to sign-in page - authentication required');
        } else {
          console.log('✅ Search completed without redirect');
        }
        
        // Take screenshot
        await page.screenshot({ path: 'search-test-result.png', fullPage: true });
        console.log('📸 Screenshot saved');
        
      } else {
        console.log('❌ Could not find search button');
      }
    } else {
      console.log('❌ Could not find input field');
    }
    
    console.log('✅ Test completed. Browser will remain open for manual testing.');
    console.log('Press Ctrl+C to close when done.');
    
    // Keep the script running
    await new Promise(() => {});
    
  } catch (error) {
    console.log(`🔴 Error: ${error.message}`);
    console.log('💡 Make sure the Next.js app is running on localhost:3000');
  }
}

// Run the test
simpleBrowserTest();
