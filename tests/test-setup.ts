import { test as base } from '@playwright/test';

// Extend the base test with custom fixtures
export const test = base.extend({
  // Custom fixture for authenticated user
  authenticatedPage: async ({ page }, use) => {
    // Navigate to sign-in page
    await page.goto('/sign-in');
    
    // Wait for Clerk to load
    await page.waitForSelector('[data-clerk-component="sign-in"]', { timeout: 10000 });
    
    // Sign in with test credentials
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Use the authenticated page
    await use(page);
  },
});

export { expect } from '@playwright/test';