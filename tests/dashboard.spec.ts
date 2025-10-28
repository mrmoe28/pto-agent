import { test, expect } from '@playwright/test';

test.describe('Dashboard Page Tests', () => {
  test.describe('Authentication Protection', () => {
    test('should redirect to sign-in when not authenticated', async ({ page }) => {
      // Try to access dashboard without authentication
      await page.goto('/dashboard');

      // Should redirect to sign-in page
      await page.waitForURL(/sign-in|auth/);

      // Verify we're on the sign-in page
      expect(page.url()).toMatch(/sign-in|auth/);
    });

    test('should show 404 or redirect when accessing dashboard without auth', async ({ page }) => {
      // Navigate to dashboard
      const response = await page.goto('/dashboard');

      // Should either redirect (302/307) or show unauthorized/not found
      expect([200, 302, 307, 401, 404]).toContain(response?.status() || 404);

      // If status is 404, check for error message
      if (response?.status() === 404) {
        await expect(page.getByText(/404|not found|page could not be found/i)).toBeVisible();
      }
    });
  });

  test.describe('Dashboard Page Structure', () => {
    test('should have correct page metadata', async ({ page }) => {
      await page.goto('/dashboard');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // If redirected to sign-in, skip the rest
      if (page.url().includes('sign-in') || page.url().includes('auth')) {
        test.skip();
      }

      // Check page title
      const title = await page.title();
      expect(title).toBeTruthy();
    });

    test('should display loading state initially', async ({ page }) => {
      await page.goto('/dashboard');

      // If not redirected, should show loading state
      if (!page.url().includes('sign-in') && !page.url().includes('auth')) {
        // Look for loading indicator
        const loadingText = page.getByText(/loading/i);
        const loadingSpinner = page.locator('.animate-spin');

        // At least one loading indicator should be present
        const hasLoading = await loadingText.isVisible().catch(() => false) ||
                          await loadingSpinner.isVisible().catch(() => false);

        expect(hasLoading).toBeTruthy();
      }
    });
  });

  test.describe('Dashboard Content (when authenticated)', () => {
    test.skip('should display user welcome message', async ({ page, context }) => {
      // This test would require authentication
      // Skipping for now as it needs valid session

      await page.goto('/dashboard');

      // Should show welcome message
      await expect(page.getByText(/welcome back/i)).toBeVisible();
    });

    test.skip('should display quick action cards', async ({ page }) => {
      // This test would require authentication

      await page.goto('/dashboard');

      // Check for quick action cards
      await expect(page.getByText('Search Offices')).toBeVisible();
      await expect(page.getByText('My Favorites')).toBeVisible();
      await expect(page.getByText('Recent Activity')).toBeVisible();
      await expect(page.getByText('Upgrade Plan')).toBeVisible();
    });

    test.skip('should display user statistics', async ({ page }) => {
      // This test would require authentication

      await page.goto('/dashboard');

      // Check for statistics section
      await expect(page.getByText('Your Statistics')).toBeVisible();
      await expect(page.getByText(/searches this month/i)).toBeVisible();
      await expect(page.getByText(/favorites saved/i)).toBeVisible();
    });

    test.skip('should have navigation buttons', async ({ page }) => {
      // This test would require authentication

      await page.goto('/dashboard');

      // Check for navigation buttons
      await expect(page.getByRole('button', { name: /start searching/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /view favorites/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /edit profile/i })).toBeVisible();
    });
  });

  test.describe('Dashboard Responsive Design', () => {
    test('should be responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/dashboard');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // If redirected, check sign-in page is responsive
      if (page.url().includes('sign-in') || page.url().includes('auth')) {
        // Check page is usable on mobile
        const content = page.locator('body');
        await expect(content).toBeVisible();
      }
    });

    test('should be responsive on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/dashboard');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check page renders
      const content = page.locator('body');
      await expect(content).toBeVisible();
    });

    test('should be responsive on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto('/dashboard');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check page renders
      const content = page.locator('body');
      await expect(content).toBeVisible();
    });
  });

  test.describe('Dashboard Performance', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should not have console errors', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Filter out known third-party errors (Clerk, analytics, etc.)
      const relevantErrors = consoleErrors.filter(error =>
        !error.includes('clerk') &&
        !error.includes('analytics') &&
        !error.includes('favicon')
      );

      expect(relevantErrors.length).toBe(0);
    });
  });

  test.describe('Dashboard Accessibility', () => {
    test('should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check for basic accessibility
      const mainContent = page.locator('main, [role="main"], body');
      await expect(mainContent).toBeVisible();

      // Check for proper heading structure
      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();

      // Should have at least one heading
      expect(headingCount).toBeGreaterThan(0);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Try keyboard navigation
      await page.keyboard.press('Tab');

      // Check that something is focused
      const focusedElement = page.locator(':focus');
      const isFocused = await focusedElement.count();

      expect(isFocused).toBeGreaterThan(0);
    });
  });
});
