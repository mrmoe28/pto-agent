import { test, expect } from '@playwright/test';

// Test credentials - these should be test accounts in your Clerk dashboard
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  invalidEmail: 'invalid@example.com',
  invalidPassword: 'wrongpassword'
};

test.describe('Clerk Sign-in Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('/sign-in');
    
    // Wait for Clerk to load
    await page.waitForSelector('[data-clerk-component="sign-in"]', { timeout: 10000 });
  });

  test('should successfully sign in with valid credentials', async ({ page }) => {
    // Fill in valid credentials
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.password);
    
    // Click sign-in button
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText(/dashboard/i);
  });

  test('should show error for invalid email', async ({ page }) => {
    // Fill in invalid email
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.invalidEmail);
    await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.password);
    
    // Click sign-in button
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for error message
    await expect(page.locator('[data-clerk-component="sign-in"]')).toContainText(/invalid/i, { timeout: 5000 });
  });

  test('should show error for invalid password', async ({ page }) => {
    // Fill in valid email but invalid password
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.invalidPassword);
    
    // Click sign-in button
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for error message
    await expect(page.locator('[data-clerk-component="sign-in"]')).toContainText(/invalid/i, { timeout: 5000 });
  });

  test('should handle empty form submission', async ({ page }) => {
    // Try to submit without filling anything
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check for validation errors
    await expect(page.locator('[data-clerk-component="sign-in"]')).toContainText(/required/i, { timeout: 5000 });
  });

  test('should redirect to dashboard after successful sign-in', async ({ page }) => {
    // Sign in with valid credentials
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Verify redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('should maintain session after page refresh', async ({ page }) => {
    // Sign in first
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Refresh the page
    await page.reload();
    
    // Should still be on dashboard (session maintained)
    await expect(page).toHaveURL('/dashboard');
  });

  test('should sign out and redirect to home page', async ({ page }) => {
    // Sign in first
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Look for sign-out button (this might be in navigation)
    const signOutButton = page.getByRole('button', { name: /sign out/i });
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
      
      // Should redirect to home page
      await page.waitForURL('/', { timeout: 5000 });
      await expect(page).toHaveURL('/');
    }
  });
});

test.describe('Sign-in Edge Cases', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/v1/client/sign_ins*', route => route.abort());
    
    await page.goto('/sign-in');
    await page.waitForSelector('[data-clerk-component="sign-in"]');
    
    // Try to sign in
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error message
    await expect(page.locator('[data-clerk-component="sign-in"]')).toContainText(/error/i, { timeout: 10000 });
  });

  test('should handle slow network responses', async ({ page }) => {
    // Simulate slow network
    await page.route('**/v1/client/sign_ins*', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.continue();
    });
    
    await page.goto('/sign-in');
    await page.waitForSelector('[data-clerk-component="sign-in"]');
    
    // Try to sign in
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show loading state
    await expect(page.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });
});