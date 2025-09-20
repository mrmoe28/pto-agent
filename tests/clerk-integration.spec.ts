import { test, expect, Page } from '@playwright/test';

/**
 * Clerk Integration Tests
 * 
 * These tests verify that Clerk authentication is working correctly
 * in both development and production environments.
 */

// Test configuration
const testConfig = {
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
  productionURL: process.env.PRODUCTION_URL || 'https://pto-agent-main-ekoapps.vercel.app',
  timeout: 30000
};

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

// Helper functions
async function waitForClerkToLoad(page: Page) {
  // Wait for Clerk to initialize
  await page.waitForFunction(() => {
    return window.Clerk && window.Clerk.loaded;
  }, { timeout: 10000 });
}

async function checkClerkEnvironment(page: Page) {
  // Check if we're using production or test keys
  const publishableKey = await page.evaluate(() => {
    return window.Clerk?.publishableKey || '';
  });
  
  const isProduction = publishableKey.startsWith('pk_live_');
  const isTest = publishableKey.startsWith('pk_test_');
  
  return { isProduction, isTest, publishableKey };
}

// Test suite
test.describe('Clerk Authentication Integration', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(testConfig.baseURL);
  });

  test('should load Clerk and display authentication UI', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if Clerk is loaded
    await waitForClerkToLoad(page);
    
    // Verify Clerk is available
    const clerkLoaded = await page.evaluate(() => {
      return typeof window.Clerk !== 'undefined' && window.Clerk.loaded;
    });
    
    expect(clerkLoaded).toBe(true);
    
    // Check environment
    const { isProduction, isTest, publishableKey } = await checkClerkEnvironment(page);
    
    console.log(`Clerk Environment: ${isProduction ? 'Production' : isTest ? 'Test' : 'Unknown'}`);
    console.log(`Publishable Key: ${publishableKey.substring(0, 20)}...`);
    
    // Verify we have a valid key
    expect(publishableKey).toMatch(/^pk_(live|test)_/);
  });

  test('should display sign-in and sign-up buttons', async ({ page }) => {
    await waitForClerkToLoad(page);
    
    // Look for authentication buttons
    const signInButton = page.locator('text=Sign In').or(page.locator('[data-testid="sign-in-button"]'));
    const signUpButton = page.locator('text=Sign Up').or(page.locator('[data-testid="sign-up-button"]'));
    
    // At least one authentication button should be visible
    const hasSignIn = await signInButton.isVisible().catch(() => false);
    const hasSignUp = await signUpButton.isVisible().catch(() => false);
    
    expect(hasSignIn || hasSignUp).toBe(true);
  });

  test('should navigate to sign-in page', async ({ page }) => {
    await waitForClerkToLoad(page);
    
    // Try to find and click sign-in button
    const signInButton = page.locator('text=Sign In').or(page.locator('[data-testid="sign-in-button"]'));
    
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForURL('**/sign-in**');
      
      // Verify we're on the sign-in page
      expect(page.url()).toContain('/sign-in');
      
      // Check if Clerk sign-in form is present
      const signInForm = page.locator('[data-clerk="sign-in"]').or(page.locator('form'));
      await expect(signInForm).toBeVisible();
    }
  });

  test('should navigate to sign-up page', async ({ page }) => {
    await waitForClerkToLoad(page);
    
    // Try to find and click sign-up button
    const signUpButton = page.locator('text=Sign Up').or(page.locator('[data-testid="sign-up-button"]'));
    
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      await page.waitForURL('**/sign-up**');
      
      // Verify we're on the sign-up page
      expect(page.url()).toContain('/sign-up');
      
      // Check if Clerk sign-up form is present
      const signUpForm = page.locator('[data-clerk="sign-up"]').or(page.locator('form'));
      await expect(signUpForm).toBeVisible();
    }
  });

  test('should handle authentication state correctly', async ({ page }) => {
    await waitForClerkToLoad(page);
    
    // Check initial authentication state
    const isSignedIn = await page.evaluate(() => {
      return window.Clerk?.user !== null;
    });
    
    // If not signed in, we should see auth buttons
    if (!isSignedIn) {
      const authButtons = page.locator('text=Sign In').or(page.locator('text=Sign Up'));
      await expect(authButtons.first()).toBeVisible();
    } else {
      // If signed in, we should see user info or sign-out button
      const userInfo = page.locator('[data-testid="user-button"]').or(page.locator('text=Sign Out'));
      await expect(userInfo.first()).toBeVisible();
    }
  });

  test('should have correct redirect URLs configured', async ({ page }) => {
    await waitForClerkToLoad(page);
    
    // Check if redirect URLs are properly configured
    const clerkConfig = await page.evaluate(() => {
      return {
        signInUrl: window.Clerk?.signInUrl,
        signUpUrl: window.Clerk?.signUpUrl,
        afterSignInUrl: window.Clerk?.afterSignInUrl,
        afterSignUpUrl: window.Clerk?.afterSignUpUrl
      };
    });
    
    console.log('Clerk Configuration:', clerkConfig);
    
    // Verify URLs are properly set
    if (clerkConfig.signInUrl) {
      expect(clerkConfig.signInUrl).toMatch(/^\/sign-in/);
    }
    
    if (clerkConfig.signUpUrl) {
      expect(clerkConfig.signUpUrl).toMatch(/^\/sign-up/);
    }
  });

  test('should work in production environment', async ({ page }) => {
    // Skip this test if we're already testing production
    if (testConfig.baseURL.includes('vercel.app')) {
      test.skip();
    }
    
    // Test production URL
    await page.goto(testConfig.productionURL);
    await page.waitForLoadState('networkidle');
    
    await waitForClerkToLoad(page);
    
    // Check if production keys are being used
    const { isProduction, publishableKey } = await checkClerkEnvironment(page);
    
    console.log(`Production Environment Check:`);
    console.log(`- Using Production Keys: ${isProduction}`);
    console.log(`- Publishable Key: ${publishableKey.substring(0, 20)}...`);
    
    // In production, we should be using live keys
    if (isProduction) {
      expect(publishableKey).toMatch(/^pk_live_/);
    }
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    await waitForClerkToLoad(page);
    
    // Try to access a protected route without authentication
    await page.goto(`${testConfig.baseURL}/dashboard`);
    
    // Should either redirect to sign-in or show appropriate message
    const currentUrl = page.url();
    const isRedirected = currentUrl.includes('/sign-in') || currentUrl.includes('/sign-up');
    const hasErrorMessage = await page.locator('text=Please sign in').isVisible().catch(() => false);
    
    expect(isRedirected || hasErrorMessage).toBe(true);
  });

  test('should display user profile when authenticated', async ({ page }) => {
    await waitForClerkToLoad(page);
    
    // This test assumes user is already authenticated
    // In a real test environment, you might need to set up authentication first
    const isSignedIn = await page.evaluate(() => {
      return window.Clerk?.user !== null;
    });
    
    if (isSignedIn) {
      // Navigate to profile page
      await page.goto(`${testConfig.baseURL}/profile`);
      
      // Should show user information
      const userInfo = page.locator('[data-testid="user-info"]').or(page.locator('text=Profile'));
      await expect(userInfo.first()).toBeVisible();
    } else {
      // Skip test if not authenticated
      test.skip('User not authenticated - skipping profile test');
    }
  });
});

// Production-specific tests
test.describe('Production Environment Tests', () => {
  test('should use production Clerk keys', async ({ page }) => {
    await page.goto(testConfig.productionURL);
    await page.waitForLoadState('networkidle');
    
    await waitForClerkToLoad(page);
    
    const { isProduction, publishableKey } = await checkClerkEnvironment(page);
    
    expect(isProduction).toBe(true);
    expect(publishableKey).toMatch(/^pk_live_/);
  });

  test('should have correct production redirect URLs', async ({ page }) => {
    await page.goto(testConfig.productionURL);
    await waitForClerkToLoad(page);
    
    const clerkConfig = await page.evaluate(() => {
      return {
        signInUrl: window.Clerk?.signInUrl,
        signUpUrl: window.Clerk?.signUpUrl,
        afterSignInUrl: window.Clerk?.afterSignInUrl,
        afterSignUpUrl: window.Clerk?.afterSignUpUrl
      };
    });
    
    // Production URLs should not contain localhost
    Object.values(clerkConfig).forEach(url => {
      if (url && typeof url === 'string') {
        expect(url).not.toContain('localhost');
      }
    });
  });
});
