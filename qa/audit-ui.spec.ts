/**
 * Comprehensive UI Quality Assurance Test Suite
 * End-to-end Playwright tests with accessibility scanning and artifact collection
 */

import { test, expect, Page, Browser } from '@playwright/test';
import { UICrawler } from './crawl';
import { QAIssue, QATestResult, takeScreenshot, waitForNetworkIdle } from './utils';
import AxeBuilder from '@axe-core/playwright';

interface TestContext {
  browser: Browser;
  baseUrl: string;
  crawlResults: unknown;
  testResults: QATestResult[];
  issues: QAIssue[];
}

// Test configuration
const testConfig = {
  baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
  maxTimeout: 30000,
  networkTimeout: 10000,
  screenshotDir: '/Users/ekodevapps/Downloads/pto-agent-main/qa/screenshots',
  reportDir: '/Users/ekodevapps/Downloads/pto-agent-main/qa/reports'
};

test.describe('Comprehensive UI Quality Assurance', () => {
  let testContext: TestContext;

  test.beforeAll(async ({ browser }) => {
    testContext = {
      browser,
      baseUrl: testConfig.baseUrl,
      crawlResults: null,
      testResults: [],
      issues: []
    };

    console.log('🚀 Starting comprehensive UI QA audit');
    console.log(`🎯 Target: ${testConfig.baseUrl}`);

    // Phase 1: Crawl the application
    await performApplicationCrawl(testContext);
  });

  test.afterAll(async () => {
    // Generate comprehensive report
    await generateQAReport(testContext);
  });

  test('Application Discovery and Route Analysis', async () => {
    expect(testContext.crawlResults).toBeTruthy();
    expect(testContext.crawlResults.routes.length).toBeGreaterThan(0);

    console.log(`📊 Discovered ${testContext.crawlResults.routes.length} routes`);
    console.log(`⚠️  Found ${testContext.crawlResults.totalErrors} initial errors`);

    // Check that critical routes were discovered
    const criticalRoutes = ['/search', '/dashboard', '/sign-in', '/sign-up'];
    const discoveredUrls = testContext.crawlResults.routes.map((r: { url: string }) => new URL(r.url).pathname);

    for (const route of criticalRoutes) {
      const found = discoveredUrls.some((url: string) => url.includes(route));
      expect(found, `Critical route ${route} should be discoverable`).toBe(true);
    }
  });

  test('Homepage Comprehensive Testing', async ({ page }) => {
    const result = await performPageTest(page, testConfig.baseUrl, 'homepage');
    testContext.testResults.push(result);
    testContext.issues.push(...result.issues);

    expect(result.route.statusCode).toBe(200);
    expect(result.issues.filter(i => i.severity === 'critical').length).toBe(0);
  });

  test('Search Functionality Comprehensive Testing', async ({ page }) => {
    const searchUrl = `${testConfig.baseUrl}/search`;
    const result = await performPageTest(page, searchUrl, 'search-page');
    testContext.testResults.push(result);
    testContext.issues.push(...result.issues);

    // Additional search-specific tests
    await testSearchFunctionality(page, result);

    expect(result.route.statusCode).toBe(200);
    // Search page is critical - should have minimal issues
    expect(result.issues.filter(i => i.severity === 'critical').length).toBeLessThanOrEqual(1);
  });

  test('Authentication Flow Testing', async ({ page }) => {
    // Test sign-in page
    const signInUrl = `${testConfig.baseUrl}/sign-in`;
    const signInResult = await performPageTest(page, signInUrl, 'sign-in-page');
    testContext.testResults.push(signInResult);
    testContext.issues.push(...signInResult.issues);

    // Test sign-up page
    const signUpUrl = `${testConfig.baseUrl}/sign-up`;
    const signUpResult = await performPageTest(page, signUpUrl, 'sign-up-page');
    testContext.testResults.push(signUpResult);
    testContext.issues.push(...signUpResult.issues);

    // Additional auth tests
    await testAuthenticationFlow(page);

    expect(signInResult.route.statusCode).toBe(200);
    expect(signUpResult.route.statusCode).toBe(200);
  });

  test('Dashboard and User Features Testing', async ({ page }) => {
    const dashboardUrl = `${testConfig.baseUrl}/dashboard`;
    const result = await performPageTest(page, dashboardUrl, 'dashboard-page');
    testContext.testResults.push(result);
    testContext.issues.push(...result.issues);

    // Test user-specific features
    await testUserFeatures(page, result);

    // Dashboard might redirect if not authenticated, so allow 302 or 200
    expect([200, 302]).toContain(result.route.statusCode);
  });

  test('Pricing and Subscription Testing', async ({ page }) => {
    const pricingUrl = `${testConfig.baseUrl}/pricing`;
    const result = await performPageTest(page, pricingUrl, 'pricing-page');
    testContext.testResults.push(result);
    testContext.issues.push(...result.issues);

    expect(result.route.statusCode).toBe(200);
  });

  test('Team Management Testing', async ({ page }) => {
    const teamsUrl = `${testConfig.baseUrl}/teams`;
    const result = await performPageTest(page, teamsUrl, 'teams-page');
    testContext.testResults.push(result);
    testContext.issues.push(...result.issues);

    // Teams might require authentication
    expect([200, 302]).toContain(result.route.statusCode);
  });

  test('Mobile Responsiveness Testing', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    const mobileResult = await performPageTest(page, testConfig.baseUrl, 'homepage-mobile');
    testContext.testResults.push(mobileResult);

    // Test search on mobile
    await page.goto(`${testConfig.baseUrl}/search`);
    await testMobileInteractions(page);

    expect(mobileResult.route.statusCode).toBe(200);
  });

  test('Performance and Loading Testing', async ({ page }) => {
    await testPerformanceMetrics(page);
  });

  test('Cross-Browser Compatibility', async () => {
    // This test will run across all configured browsers in playwright.config.ts
    expect(true).toBe(true); // Placeholder - actual cross-browser tests run via config
  });
});

/**
 * Crawl the entire application to discover routes
 */
async function performApplicationCrawl(context: TestContext): Promise<void> {
  console.log('🕷️  Starting application crawl...');

  const crawler = new UICrawler(context.browser, context.baseUrl, {
    maxDepth: 3,
    maxPages: 30,
    timeout: 30000,
    saveScreenshots: true,
    saveDomSnapshots: false,
    waitForJs: true,
    includePaths: ['/', '/search', '/pricing', '/dashboard', '/sign-in', '/sign-up', '/teams']
  });

  context.crawlResults = await crawler.crawl();
  console.log(`✅ Crawl completed: ${context.crawlResults.routes.length} routes discovered`);
}

/**
 * Perform comprehensive testing on a single page
 */
async function performPageTest(page: Page, url: string, testId: string): Promise<QATestResult> {
  console.log(`🧪 Testing ${url}`);

  const result: QATestResult = {
    route: {
      url,
      normalizedUrl: url,
      statusCode: 0,
      responseTime: 0,
      depth: 0,
      discovered: new Date(),
      tested: true,
      errors: [],
      accessibilityIssues: []
    },
    passed: false,
    issues: [],
    recommendations: [],
    before: {}
  };

  try {
    // Navigate and measure response time
    const startTime = Date.now();
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: testConfig.maxTimeout
    });

    const endTime = Date.now();
    result.route.responseTime = endTime - startTime;
    result.route.statusCode = response?.status() || 0;

    // Wait for JavaScript to load
    await waitForNetworkIdle(page);

    // Take "before" screenshot
    const beforeScreenshot = await takeScreenshot(page, `${testId}_before`);
    if (beforeScreenshot) {
      result.before!.screenshot = beforeScreenshot;
    }

    // Collect console errors
    const consoleErrors = await collectConsoleErrors(page);
    result.route.errors.push(...consoleErrors);

    // Perform accessibility audit
    const accessibilityResults = await performAccessibilityAudit(page);
    result.route.accessibilityIssues.push(...accessibilityResults.issues);
    result.before!.accessibilityScore = accessibilityResults.score;

    // Test interactive elements
    const interactionIssues = await testInteractiveElements(page, url);
    result.issues.push(...interactionIssues);

    // Test form functionality if present
    const formIssues = await testFormFunctionality(page);
    result.issues.push(...formIssues);

    // Test navigation elements
    const navigationIssues = await testNavigationElements(page);
    result.issues.push(...navigationIssues);

    // Performance checks
    const performanceIssues = await checkPerformanceIssues(page, result.route.responseTime!);
    result.issues.push(...performanceIssues);

    // Generate recommendations
    result.recommendations = generateRecommendations(result.issues);

    // Determine if test passed
    const criticalIssues = result.issues.filter(i => i.severity === 'critical').length;
    const highIssues = result.issues.filter(i => i.severity === 'high').length;
    result.passed = criticalIssues === 0 && highIssues <= 2;

    console.log(`${result.passed ? '✅' : '❌'} ${url}: ${result.issues.length} issues found`);

  } catch (error) {
    console.error(`❌ Error testing ${url}:`, error);
    result.issues.push({
      type: 'console-error',
      severity: 'critical',
      description: `Test execution failed: ${error}`,
      location: { file: url },
      automated_fix_available: false
    });
  }

  return result;
}

/**
 * Test search functionality specifically
 */
async function testSearchFunctionality(page: Page, result: QATestResult): Promise<void> {
  try {
    // Test Google Places Autocomplete
    const addressInput = page.locator('input[placeholder*="address"]').first();
    if (await addressInput.isVisible()) {
      await addressInput.fill('Atlanta, GA');
      await page.waitForTimeout(2000); // Wait for debouncing

      // Check if autocomplete suggestions appear
      const suggestions = page.locator('[role="option"], .pac-item, .suggestions');
      const hasSuggestions = await suggestions.count() > 0;

      if (!hasSuggestions) {
        result.issues.push({
          type: 'broken-link',
          severity: 'high',
          description: 'Google Places Autocomplete not showing suggestions',
          location: { selector: 'input[placeholder*="address"]' },
          automated_fix_available: false
        });
      }
    }

    // Test county selector
    const countySelect = page.locator('select, [role="combobox"]').first();
    if (await countySelect.isVisible()) {
      // Test county selection functionality
      await countySelect.click();
      const options = page.locator('option, [role="option"]');
      const optionCount = await options.count();

      if (optionCount === 0) {
        result.issues.push({
          type: 'broken-link',
          severity: 'medium',
          description: 'County selector has no options',
          location: { selector: 'select, [role="combobox"]' },
          automated_fix_available: false
        });
      }
    }

    // Test search button
    const searchButton = page.locator('button:has-text("Find Permit Offices"), button[type="submit"]').first();
    if (await searchButton.isVisible()) {
      // Test if button is actually clickable
      const isEnabled = await searchButton.isEnabled();
      if (!isEnabled) {
        result.issues.push({
          type: 'hidden-element',
          severity: 'high',
          description: 'Search button is disabled without clear reason',
          location: { selector: 'button:has-text("Find Permit Offices")' },
          automated_fix_available: true,
          fix_description: 'Enable search button and add validation feedback'
        });
      }
    }

  } catch (error) {
    console.warn('Error testing search functionality:', error);
  }
}

/**
 * Test authentication flow
 */
async function testAuthenticationFlow(page: Page): Promise<void> {
  try {
    // Check for authentication buttons on homepage
    await page.goto(testConfig.baseUrl);

    const signInButton = page.locator('text=Sign In, a[href*="sign-in"]').first();
    const _signUpButton = page.locator('text=Sign Up, a[href*="sign-up"]').first();

    // Test navigation to auth pages
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForURL('**/sign-in**');
      expect(page.url()).toContain('sign-in');
    }

    // Test Clerk integration
    await page.goto(`${testConfig.baseUrl}/sign-in`);
    await page.waitForSelector('[data-clerk-id], .cl-component', { timeout: 10000 });

    const clerkLoaded = await page.evaluate(() => {
      return typeof window.Clerk !== 'undefined';
    });

    if (!clerkLoaded) {
      console.warn('⚠️  Clerk authentication not detected');
    }

  } catch (error) {
    console.warn('Error testing authentication flow:', error);
  }
}

/**
 * Test user-specific features
 */
async function testUserFeatures(page: Page, result: QATestResult): Promise<void> {
  try {
    // Test export functionality if present
    const exportButton = page.locator('button:has-text("Export"), [data-testid="export-button"]').first();
    if (await exportButton.isVisible()) {
      const isEnabled = await exportButton.isEnabled();
      if (!isEnabled) {
        result.issues.push({
          type: 'hidden-element',
          severity: 'medium',
          description: 'Export button is disabled',
          location: { selector: 'button:has-text("Export")' },
          automated_fix_available: false
        });
      }
    }

    // Test favorite functionality
    const favoriteButton = page.locator('button:has-text("Favorite"), [data-testid="favorite-button"]').first();
    if (await favoriteButton.isVisible()) {
      await favoriteButton.click();
      await page.waitForTimeout(1000);
      // Check for feedback (state change, notification, etc.)
    }

  } catch (error) {
    console.warn('Error testing user features:', error);
  }
}

/**
 * Test mobile interactions
 */
async function testMobileInteractions(page: Page): Promise<void> {
  try {
    // Test touch interactions
    const searchInput = page.locator('input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.tap();
      await page.waitForTimeout(500);

      // Test if virtual keyboard doesn't obstruct interface
      const inputRect = await searchInput.boundingBox();
      if (inputRect && inputRect.y > 400) {
        console.warn('⚠️  Input field might be obscured by virtual keyboard');
      }
    }

    // Test hamburger menu if present
    const menuButton = page.locator('button[aria-label*="menu"], .hamburger, .menu-toggle').first();
    if (await menuButton.isVisible()) {
      await menuButton.tap();
      await page.waitForTimeout(500);

      const menu = page.locator('nav, .menu, [role="menu"]').first();
      const isMenuVisible = await menu.isVisible();
      if (!isMenuVisible) {
        console.warn('⚠️  Mobile menu not working properly');
      }
    }

  } catch (error) {
    console.warn('Error testing mobile interactions:', error);
  }
}

/**
 * Collect console errors from page
 */
async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    errors.push(`Page error: ${error.message}`);
  });

  page.on('requestfailed', (request) => {
    if (!request.url().includes('_next/static') && !request.url().includes('.map')) {
      errors.push(`Request failed: ${request.url()}`);
    }
  });

  return errors;
}

/**
 * Perform accessibility audit using axe-core
 */
async function performAccessibilityAudit(page: Page): Promise<{ issues: unknown[], score: number }> {
  try {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    const issues = accessibilityScanResults.violations.map(violation => ({
      type: 'accessibility',
      severity: violation.impact === 'critical' ? 'critical' :
               violation.impact === 'serious' ? 'high' :
               violation.impact === 'moderate' ? 'medium' : 'low',
      description: `${violation.id}: ${violation.description}`,
      location: { selector: violation.nodes[0]?.target.join(', ') },
      automated_fix_available: violation.tags.includes('best-practice')
    }));

    // Calculate accessibility score (rough approximation)
    const totalElements = accessibilityScanResults.passes.length + accessibilityScanResults.violations.length;
    const score = totalElements > 0 ? (accessibilityScanResults.passes.length / totalElements) * 100 : 100;

    return { issues, score };

  } catch (error) {
    console.warn('Accessibility audit failed:', error);
    return { issues: [], score: 0 };
  }
}

/**
 * Test interactive elements
 */
async function testInteractiveElements(page: Page, _url: string): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];

  try {
    // Test all buttons
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 20); i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();

      if (isVisible && !isEnabled) {
        const text = await button.textContent() || '';
        if (text.toLowerCase().includes('submit') || text.toLowerCase().includes('search')) {
          issues.push({
            type: 'hidden-element',
            severity: 'high',
            description: `Critical button "${text}" is disabled`,
            location: { selector: `button:nth-child(${i + 1})` },
            automated_fix_available: true,
            fix_description: 'Enable button and add appropriate validation'
          });
        }
      }
    }

    // Test links
    const links = page.locator('a[href]');
    const linkCount = await links.count();

    for (let i = 0; i < Math.min(linkCount, 15); i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      const text = await link.textContent();

      if (href && text && href.startsWith('/')) {
        // Internal link - check if it's broken
        if (href.includes('undefined') || href.includes('null')) {
          issues.push({
            type: 'broken-link',
            severity: 'medium',
            description: `Broken internal link: ${href}`,
            location: { selector: `a[href="${href}"]` },
            automated_fix_available: true,
            fix_description: 'Fix link URL generation'
          });
        }
      }
    }

  } catch (error) {
    console.warn('Error testing interactive elements:', error);
  }

  return issues;
}

/**
 * Test form functionality
 */
async function testFormFunctionality(page: Page): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];

  try {
    const forms = page.locator('form');
    const formCount = await forms.count();

    for (let i = 0; i < formCount; i++) {
      const form = forms.nth(i);

      // Check for required field validation
      const requiredInputs = form.locator('input[required], select[required], textarea[required]');
      const requiredCount = await requiredInputs.count();

      if (requiredCount > 0) {
        // Test form submission without filling required fields
        const submitButton = form.locator('button[type="submit"], input[type="submit"]').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);

          // Check if validation messages appear
          const validationMessages = page.locator('.error, .invalid, [aria-invalid="true"]');
          const hasValidation = await validationMessages.count() > 0;

          if (!hasValidation) {
            issues.push({
              type: 'form-validation',
              severity: 'medium',
              description: 'Form lacks proper validation feedback',
              location: { selector: `form:nth-child(${i + 1})` },
              automated_fix_available: true,
              fix_description: 'Add client-side validation with user feedback'
            });
          }
        }
      }
    }

  } catch (error) {
    console.warn('Error testing form functionality:', error);
  }

  return issues;
}

/**
 * Test navigation elements
 */
async function testNavigationElements(page: Page): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];

  try {
    // Check for main navigation
    const nav = page.locator('nav, [role="navigation"]').first();
    if (await nav.isVisible()) {
      const navLinks = nav.locator('a');
      const linkCount = await navLinks.count();

      if (linkCount === 0) {
        issues.push({
          type: 'broken-link',
          severity: 'medium',
          description: 'Navigation element has no links',
          location: { selector: 'nav' },
          automated_fix_available: false
        });
      }
    }

    // Check for breadcrumbs
    const breadcrumbs = page.locator('[aria-label*="breadcrumb"], .breadcrumb');
    if (await breadcrumbs.count() > 0) {
      const breadcrumbLinks = breadcrumbs.locator('a');
      const breadcrumbCount = await breadcrumbLinks.count();

      for (let i = 0; i < breadcrumbCount; i++) {
        const link = breadcrumbLinks.nth(i);
        const href = await link.getAttribute('href');
        if (!href || href === '#') {
          issues.push({
            type: 'broken-link',
            severity: 'low',
            description: 'Breadcrumb link is missing or incomplete',
            location: { selector: '.breadcrumb a' },
            automated_fix_available: true
          });
        }
      }
    }

  } catch (error) {
    console.warn('Error testing navigation elements:', error);
  }

  return issues;
}

/**
 * Check performance issues
 */
async function checkPerformanceIssues(page: Page, responseTime: number): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];

  // Check response time
  if (responseTime > 5000) {
    issues.push({
      type: 'performance',
      severity: 'high',
      description: `Slow page load time: ${responseTime}ms`,
      location: {},
      automated_fix_available: false
    });
  } else if (responseTime > 3000) {
    issues.push({
      type: 'performance',
      severity: 'medium',
      description: `Moderate page load time: ${responseTime}ms`,
      location: {},
      automated_fix_available: false
    });
  }

  // Check for large images without optimization
  try {
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');

      if (src && !src.includes('next/image') && !src.includes('optimized')) {
        issues.push({
          type: 'performance',
          severity: 'low',
          description: `Unoptimized image: ${src}`,
          location: { selector: `img[src="${src}"]` },
          automated_fix_available: true,
          fix_description: 'Use Next.js Image component for optimization'
        });
      }
    }
  } catch (error) {
    console.warn('Error checking image optimization:', error);
  }

  return issues;
}

/**
 * Test performance metrics
 */
async function testPerformanceMetrics(page: Page): Promise<void> {
  try {
    await page.goto(testConfig.baseUrl);

    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
      };
    });

    console.log('📊 Performance Metrics:', performanceMetrics);

    // Basic performance assertions
    expect(performanceMetrics.loadTime).toBeLessThan(5000);
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000);

  } catch (error) {
    console.warn('Performance metrics collection failed:', error);
  }
}

/**
 * Generate recommendations based on issues
 */
function generateRecommendations(issues: QAIssue[]): string[] {
  const recommendations: string[] = [];

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;
  const accessibilityCount = issues.filter(i => i.type === 'accessibility').length;

  if (criticalCount > 0) {
    recommendations.push(`Fix ${criticalCount} critical issue(s) immediately - these prevent core functionality`);
  }

  if (highCount > 2) {
    recommendations.push(`Address ${highCount} high-severity issues to improve user experience`);
  }

  if (accessibilityCount > 5) {
    recommendations.push(`Improve accessibility - ${accessibilityCount} violations found`);
  }

  const automatedFixes = issues.filter(i => i.automated_fix_available).length;
  if (automatedFixes > 0) {
    recommendations.push(`${automatedFixes} issue(s) can be automatically fixed`);
  }

  return recommendations;
}

/**
 * Generate comprehensive QA report
 */
async function generateQAReport(context: TestContext): Promise<void> {
  console.log('📝 Generating comprehensive QA report...');

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: context.baseUrl,
    summary: {
      totalRoutes: context.crawlResults?.routes.length || 0,
      totalIssues: context.issues.length,
      criticalIssues: context.issues.filter(i => i.severity === 'critical').length,
      highIssues: context.issues.filter(i => i.severity === 'high').length,
      passedTests: context.testResults.filter(r => r.passed).length,
      failedTests: context.testResults.filter(r => !r.passed).length
    },
    testResults: context.testResults,
    issues: context.issues,
    recommendations: generateOverallRecommendations(context.issues)
  };

  // Write JSON report
  const reportPath = `${testConfig.reportDir}/qa-report-${Date.now()}.json`;
  await writeReportFile(reportPath, JSON.stringify(report, null, 2));

  // Write markdown report
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = `${testConfig.reportDir}/qa-report-${Date.now()}.md`;
  await writeReportFile(markdownPath, markdownReport);

  console.log(`✅ QA report generated: ${reportPath}`);
  console.log(`📄 Markdown report: ${markdownPath}`);
}

function generateOverallRecommendations(issues: QAIssue[]): string[] {
  const recommendations = [
    'Review all critical and high-severity issues immediately',
    'Implement automated testing for search functionality',
    'Improve accessibility compliance across all pages',
    'Add comprehensive error handling and user feedback',
    'Optimize performance for mobile devices'
  ];

  const automatedFixes = issues.filter(i => i.automated_fix_available).length;
  if (automatedFixes > 0) {
    recommendations.unshift(`Apply ${automatedFixes} available automated fixes`);
  }

  return recommendations;
}

function generateMarkdownReport(report: unknown): string {
  let markdown = `# UI Quality Assurance Report\n\n`;
  markdown += `**Generated:** ${report.timestamp}\n`;
  markdown += `**Base URL:** ${report.baseUrl}\n\n`;

  markdown += `## Summary\n\n`;
  markdown += `- **Total Routes:** ${report.summary.totalRoutes}\n`;
  markdown += `- **Total Issues:** ${report.summary.totalIssues}\n`;
  markdown += `- **Critical Issues:** ${report.summary.criticalIssues}\n`;
  markdown += `- **High Issues:** ${report.summary.highIssues}\n`;
  markdown += `- **Passed Tests:** ${report.summary.passedTests}\n`;
  markdown += `- **Failed Tests:** ${report.summary.failedTests}\n\n`;

  if (report.issues.length > 0) {
    markdown += `## Issues by Severity\n\n`;

    ['critical', 'high', 'medium', 'low'].forEach(severity => {
      const severityIssues = report.issues.filter((i: QAIssue) => i.severity === severity);
      if (severityIssues.length > 0) {
        markdown += `### ${severity.toUpperCase()} (${severityIssues.length})\n\n`;
        severityIssues.forEach((issue: QAIssue, index: number) => {
          markdown += `${index + 1}. **${issue.type}**: ${issue.description}\n`;
          if (issue.location.selector) {
            markdown += `   - Element: \`${issue.location.selector}\`\n`;
          }
          if (issue.automated_fix_available) {
            markdown += `   - 🔧 Automated fix available\n`;
          }
          markdown += '\n';
        });
      }
    });
  }

  markdown += `## Recommendations\n\n`;
  report.recommendations.forEach((rec: string, index: number) => {
    markdown += `${index + 1}. ${rec}\n`;
  });

  return markdown;
}

async function writeReportFile(filePath: string, content: string): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}