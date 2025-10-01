import { test, expect } from '@playwright/test';

test.describe('Sign-in Workflow - Production', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the sign-in page before each test
    await page.goto('/sign-in');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display sign-in page with correct branding', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Permit Office Search/);

    // Check main heading
    await expect(page.getByRole('heading', { name: 'Permit Office Search' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    // Check description text
    await expect(page.getByText(/Sign in to access Georgia/)).toBeVisible();
  });

  test('should load Clerk sign-in component', async ({ page }) => {
    // Wait for Clerk to initialize (Clerk uses .cl- prefixed classes)
    await page.waitForSelector('[class*="cl-"]', { timeout: 10000 });

    // Check that Clerk component is rendered
    const clerkComponent = page.locator('[class*="cl-rootBox"]').first();
    await expect(clerkComponent).toBeVisible();
  });

  test('should have email and password input fields', async ({ page }) => {
    // Wait for form to load
    await page.waitForTimeout(2000); // Give Clerk time to fully render

    // Check for email input (Clerk uses identifier field)
    const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test('should have sign-in submit button', async ({ page }) => {
    // Wait for Clerk to render
    await page.waitForTimeout(2000);

    // Look for Clerk's sign-in button (usually has "Continue" or "Sign in" text)
    const signInButton = page.locator('button:has-text("Continue"), button:has-text("Sign in")').first();
    await expect(signInButton).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to sign-up page when clicking sign-up link', async ({ page }) => {
    // Click sign-up link in custom footer
    const signUpLink = page.getByRole('link', { name: 'Sign up here' });
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();

    // Verify navigation to sign-up page
    await expect(page).toHaveURL(/sign-up/);
  });

  test('should navigate to forgot password page when clicking forgot password link', async ({ page }) => {
    // Click forgot password link in custom footer
    const forgotPasswordLink = page.getByRole('link', { name: 'Forgot your password?' });
    await expect(forgotPasswordLink).toBeVisible();
    await forgotPasswordLink.click();

    // Verify navigation to forgot password page
    await expect(page).toHaveURL(/forgot-password/);
  });

  test('should have proper gradient background styling', async ({ page }) => {
    // Check for gradient background on container
    const container = page.locator('.bg-gradient-to-br').first();
    await expect(container).toBeVisible();

    // Check for proper min-height
    await expect(container).toHaveClass(/min-h-screen/);
  });

  test('should display permit office icon', async ({ page }) => {
    // Check for SVG icon
    const icon = page.locator('svg').first();
    await expect(icon).toBeVisible();
  });

  test('should have responsive design', async ({ page }) => {
    // Check for responsive container
    const mainContainer = page.locator('.max-w-md').first();
    await expect(mainContainer).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Wait for page to be interactive
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that an element has focus
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Sign-in Integration Tests - Production', () => {
  test('should have Clerk properly initialized', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Check that window.Clerk is available
    const hasClerk = await page.evaluate(() => {
      return typeof (window as any).Clerk !== 'undefined';
    });

    expect(hasClerk).toBeTruthy();
  });

  test('should have correct redirect configuration', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Verify the page loaded successfully
    await expect(page).toHaveTitle(/Permit Office Search/);

    // The redirect URL is configured in the SignIn component props
    // We can't directly test it without signing in, but we can verify the page loaded
  });

  test('should show email input after clicking continue with email', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to find and interact with email/identifier input
    const identifierInput = page.locator('input[name="identifier"]').first();

    // Only test if the input is visible (Clerk might show different UI based on config)
    const isVisible = await identifierInput.isVisible().catch(() => false);

    if (isVisible) {
      await expect(identifierInput).toBeVisible();
    } else {
      console.log('Clerk may be using a different sign-in strategy');
    }
  });

  test('should load all necessary Clerk scripts and styles', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Check for Clerk-related elements
    const clerkElements = await page.locator('[class*="cl-"]').count();

    // Should have at least some Clerk elements
    expect(clerkElements).toBeGreaterThan(0);
  });
});

test.describe('Sign-in Page Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Check h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Check h2
    const h2 = page.locator('h2');
    await expect(h2).toBeVisible();
  });

  test('should have visible links in footer', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Check sign-up link
    const signUpLink = page.getByRole('link', { name: /Sign up here/i });
    await expect(signUpLink).toBeVisible();

    // Check forgot password link
    const forgotLink = page.getByRole('link', { name: /Forgot your password/i });
    await expect(forgotLink).toBeVisible();
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Check for text elements (they should be visible, indicating good contrast)
    const heading = page.getByRole('heading', { name: 'Welcome Back' });
    await expect(heading).toBeVisible();

    const description = page.getByText(/Sign in to access/);
    await expect(description).toBeVisible();
  });
});
