const { chromium } = require('playwright');

(async () => {
  // Connect to existing Chrome instance
  const browser = await chromium.connectOverCDP('http://localhost:9222');

  try {
    // Get all pages
    const contexts = browser.contexts();
    let vercelPage = null;

    // Find the Vercel page
    for (const context of contexts) {
      const pages = await context.pages();
      for (const page of pages) {
        const url = page.url();
        console.log('Found page:', url);
        if (url.includes('vercel.com')) {
          vercelPage = page;
          break;
        }
      }
      if (vercelPage) break;
    }

    if (!vercelPage) {
      console.log('Vercel page not found. Opening Vercel...');
      const context = contexts[0];
      vercelPage = await context.newPage();
      await vercelPage.goto('https://vercel.com/ekodevappss-projects/pto-agent-main/settings/domains');
    }

    console.log('Working with Vercel page...');

    // Wait for the page to be ready
    await vercelPage.waitForTimeout(2000);

    // Check if we're on the domains page
    const currentUrl = vercelPage.url();
    if (!currentUrl.includes('/domains')) {
      console.log('Navigating to domains settings...');
      await vercelPage.goto('https://vercel.com/ekodevappss-projects/pto-agent-main/settings/domains');
      await vercelPage.waitForTimeout(3000);
    }

    // Look for the Add Domain button or input field
    try {
      // Check if the Add Domain modal is already open
      const domainInput = await vercelPage.locator('input[placeholder*="example.com"], input[type="text"]').first();

      if (await domainInput.isVisible()) {
        console.log('Domain input field found, entering domain...');

        // Clear and enter the domain
        await domainInput.click();
        await domainInput.fill('');
        await domainInput.type('permitofficelocator.com', { delay: 100 });

        // Make sure "Connect to an environment" is selected
        const connectRadio = await vercelPage.locator('text="Connect to an environment"').first();
        if (await connectRadio.isVisible()) {
          await connectRadio.click();
          console.log('Selected "Connect to an environment"');
        }

        // Wait a moment for the form to update
        await vercelPage.waitForTimeout(1000);

        // Click the Save button
        const saveButton = await vercelPage.locator('button:has-text("Save"), button:has-text("Add")').first();
        if (await saveButton.isVisible()) {
          console.log('Clicking Save/Add button...');
          await saveButton.click();
          await vercelPage.waitForTimeout(3000);
          console.log('Domain added successfully!');
        }
      } else {
        // Try to find and click Add Domain button
        const addButton = await vercelPage.locator('button:has-text("Add Domain"), button:has-text("Add")').first();
        if (await addButton.isVisible()) {
          console.log('Clicking Add Domain button...');
          await addButton.click();
          await vercelPage.waitForTimeout(2000);

          // Now enter the domain
          const domainInputAfter = await vercelPage.locator('input[placeholder*="example.com"], input[type="text"]').first();
          await domainInputAfter.fill('permitofficelocator.com');
          await vercelPage.waitForTimeout(500);

          // Click save
          const saveBtn = await vercelPage.locator('button:has-text("Save"), button:has-text("Add")').first();
          await saveBtn.click();
          console.log('Domain added successfully!');
        }
      }
    } catch (error) {
      console.log('Error during domain addition:', error.message);
    }

    console.log('Process completed. Please check your Vercel dashboard.');

  } catch (error) {
    console.error('Error:', error);
  }

  // Don't close the browser since it's the user's existing session
  console.log('Script completed. Browser remains open.');
})();