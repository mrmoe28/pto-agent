#!/usr/bin/env npx tsx

/**
 * QA Audit Orchestration Script
 * Executes comprehensive UI quality assurance testing
 */

import { chromium, Browser, BrowserContext } from '@playwright/test';
import { UICrawler } from './crawl';
import { UIRepairEngine } from './repair-strategies';
import { QAReportGenerator } from './report';
import { QATestResult, QAIssue, validateEnvironment } from './utils';
import * as path from 'path';

interface QAAuditOptions {
  baseUrl: string;
  maxDepth: number;
  maxPages: number;
  applyRepairs: boolean;
  generateReports: boolean;
  headless: boolean;
  timeout: number;
}

class QAAuditOrchestrator {
  private options: QAAuditOptions;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  constructor(options: Partial<QAAuditOptions> = {}) {
    this.options = {
      baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
      maxDepth: 3,
      maxPages: 25,
      applyRepairs: true,
      generateReports: true,
      headless: true,
      timeout: 30000,
      ...options
    };
  }

  async run(): Promise<void> {
    console.log('🚀 Starting Comprehensive UI Quality Assurance Audit');
    console.log('='.repeat(60));
    console.log(`🎯 Target: ${this.options.baseUrl}`);
    console.log(`🔧 Auto-repair: ${this.options.applyRepairs ? 'Enabled' : 'Disabled'}`);
    console.log(`📊 Max pages: ${this.options.maxPages}`);
    console.log('='.repeat(60));

    try {
      // Phase 0: Environment validation
      await this.validateEnvironment();

      // Phase 1: Initialize browser
      await this.initializeBrowser();

      // Phase 2: Health check
      await this.performHealthCheck();

      // Phase 3: Comprehensive crawling
      const crawlResults = await this.performCrawling();

      // Phase 4: Detailed testing
      const testResults = await this.performDetailedTesting(crawlResults);

      // Phase 5: Apply automated repairs (if enabled)
      let repairSession = undefined;
      if (this.options.applyRepairs) {
        repairSession = await this.applyAutomatedRepairs(testResults);
      }

      // Phase 6: Re-test after repairs (if repairs were applied)
      if (repairSession && repairSession.repairs.some(r => r.success)) {
        console.log('🔄 Re-testing after automated repairs...');
        const retestResults = await this.performDetailedTesting(crawlResults, true);
        this.compareResults(testResults, retestResults);
      }

      // Phase 7: Generate comprehensive reports
      if (this.options.generateReports) {
        await this.generateReports(testResults, crawlResults, repairSession);
      }

      // Phase 8: Summary and recommendations
      await this.displaySummary(testResults, repairSession);

    } catch (error) {
      console.error('❌ QA Audit failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  private async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating environment...');

    const validation = await validateEnvironment();
    if (!validation.valid) {
      console.error('❌ Environment validation failed:');
      validation.issues.forEach(issue => console.error(`  - ${issue}`));
      throw new Error('Environment validation failed');
    }

    console.log('✅ Environment validation passed');
  }

  private async initializeBrowser(): Promise<void> {
    console.log('🌐 Initializing browser...');

    this.browser = await chromium.launch({
      headless: this.options.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (compatible; QA-Audit-Bot/1.0)'
    });

    console.log('✅ Browser initialized');
  }

  private async performHealthCheck(): Promise<void> {
    console.log('🏥 Performing application health check...');

    const page = await this.context!.newPage();

    try {
      const response = await page.goto(this.options.baseUrl, {
        waitUntil: 'domcontentloaded', // Less strict than networkidle
        timeout: this.options.timeout
      });

      // Accept 200, 302 (redirects), or any 2xx status
      const statusCode = response?.status() || 0;
      if (statusCode < 200 || statusCode >= 400) {
        console.warn(`⚠️  Server returned status ${statusCode}, but continuing with audit`);
      }

      // Check for critical elements (allow errors for now)
      try {
        const title = await page.title();
        console.log(`✅ Health check completed - ${title || 'No title'} (Status: ${statusCode})`);
      } catch (titleError) {
        console.log(`✅ Health check completed (Status: ${statusCode}) - Could not get title`);
      }

    } catch (error) {
      console.warn('⚠️  Health check had issues but continuing:', error);
      console.log('✅ Proceeding with audit despite health check issues');
    } finally {
      await page.close();
    }
  }

  private async performCrawling(): Promise<any> {
    console.log('🕷️  Starting comprehensive application crawl...');

    const crawler = new UICrawler(this.browser!, this.options.baseUrl, {
      maxDepth: this.options.maxDepth,
      maxPages: this.options.maxPages,
      timeout: this.options.timeout,
      saveScreenshots: true,
      saveDomSnapshots: false,
      waitForJs: true,
      includePaths: [
        '/',
        '/search',
        '/pricing',
        '/dashboard',
        '/sign-in',
        '/sign-up',
        '/teams',
        '/favorites',
        '/profile',
        '/settings'
      ]
    });

    const crawlResults = await crawler.crawl();

    console.log(`✅ Crawl completed:`);
    console.log(`  📄 Routes discovered: ${crawlResults.routes.length}`);
    console.log(`  ⚠️  Initial errors: ${crawlResults.totalErrors}`);
    console.log(`  ⏱️  Duration: ${crawlResults.crawlDuration}ms`);

    return crawlResults;
  }

  private async performDetailedTesting(crawlResults: any, isRetest = false): Promise<QATestResult[]> {
    const phase = isRetest ? 'Re-testing' : 'Testing';
    console.log(`🧪 ${phase} critical application routes...`);

    const testResults: QATestResult[] = [];
    const criticalRoutes = this.identifyCriticalRoutes(crawlResults.routes);

    for (const route of criticalRoutes) {
      console.log(`  🔍 Testing: ${route.url}`);

      const page = await this.context!.newPage();
      const result = await this.performPageTest(page, route, isRetest);
      testResults.push(result);

      await page.close();

      // Rate limiting - don't overwhelm the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const passedTests = testResults.filter(r => r.passed).length;
    const totalIssues = testResults.reduce((sum, r) => sum + r.issues.length, 0);

    console.log(`✅ ${phase} completed:`);
    console.log(`  ✅ Passed: ${passedTests}/${testResults.length}`);
    console.log(`  ⚠️  Total issues: ${totalIssues}`);

    return testResults;
  }

  private identifyCriticalRoutes(routes: any[]): any[] {
    // Prioritize critical application routes
    const criticalPatterns = [
      { pattern: /\/$/, priority: 1 },                    // Homepage
      { pattern: /\/search/, priority: 1 },               // Search (core functionality)
      { pattern: /\/sign-in/, priority: 2 },              // Authentication
      { pattern: /\/sign-up/, priority: 2 },              // Registration
      { pattern: /\/dashboard/, priority: 2 },            // User dashboard
      { pattern: /\/pricing/, priority: 3 },              // Pricing
      { pattern: /\/profile/, priority: 3 },              // Profile
      { pattern: /\/teams/, priority: 3 },                // Teams
      { pattern: /\/favorites/, priority: 3 },            // Favorites
      { pattern: /\/settings/, priority: 3 }              // Settings
    ];

    const prioritizedRoutes = routes
      .map(route => {
        const match = criticalPatterns.find(cp => cp.pattern.test(route.url));
        return {
          ...route,
          priority: match ? match.priority : 4
        };
      })
      .filter(route => route.priority <= 3)
      .sort((a, b) => a.priority - b.priority);

    return prioritizedRoutes.slice(0, 15); // Limit to top 15 routes
  }

  private async performPageTest(page: any, route: any, isRetest: boolean): Promise<QATestResult> {
    const result: QATestResult = {
      route: {
        url: route.url,
        normalizedUrl: route.normalizedUrl,
        statusCode: 0,
        responseTime: 0,
        depth: route.depth,
        discovered: route.discovered,
        tested: true,
        errors: [],
        accessibilityIssues: []
      },
      passed: false,
      issues: [],
      recommendations: [],
      before: {},
      after: isRetest ? {} : undefined
    };

    try {
      // Navigate and measure performance
      const startTime = Date.now();
      const response = await page.goto(route.url, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout
      });

      const endTime = Date.now();
      result.route.responseTime = endTime - startTime;
      result.route.statusCode = response?.status() || 0;

      // Wait for JavaScript frameworks to load
      await this.waitForFrameworks(page);

      // Collect console errors
      await this.collectConsoleErrors(page, result);

      // Test search functionality if on search page
      if (route.url.includes('/search')) {
        await this.testSearchFunctionality(page, result);
      }

      // Test authentication flow if on auth pages
      if (route.url.includes('/sign-')) {
        await this.testAuthenticationFlow(page, result);
      }

      // Test user features if on dashboard/profile
      if (route.url.includes('/dashboard') || route.url.includes('/profile')) {
        await this.testUserFeatures(page, result);
      }

      // Accessibility testing
      await this.performAccessibilityTest(page, result);

      // Interactive elements testing
      await this.testInteractiveElements(page, result);

      // Performance analysis
      await this.analyzePerformance(page, result);

      // Form validation testing
      await this.testFormValidation(page, result);

      // Mobile responsiveness check
      await this.testMobileResponsiveness(page, result);

      // Determine test result
      const criticalIssues = result.issues.filter(i => i.severity === 'critical').length;
      const highIssues = result.issues.filter(i => i.severity === 'high').length;

      result.passed = criticalIssues === 0 && highIssues <= 2 && result.route.statusCode === 200;

      // Generate recommendations
      result.recommendations = this.generatePageRecommendations(result.issues);

    } catch (error) {
      console.warn(`⚠️  Error testing ${route.url}:`, error);
      result.issues.push({
        type: 'console-error',
        severity: 'critical',
        description: `Test execution failed: ${error}`,
        location: { file: route.url },
        automated_fix_available: false
      });
    }

    return result;
  }

  private async waitForFrameworks(page: any): Promise<void> {
    try {
      await page.waitForFunction(() => {
        // Wait for Next.js
        if (window.__NEXT_DATA__) return true;
        // Wait for React
        if (window.React) return true;
        // Wait for DOM ready
        return document.readyState === 'complete';
      }, { timeout: 10000 });

      // Additional wait for Clerk
      await page.waitForFunction(() => {
        return window.Clerk ? window.Clerk.loaded : true;
      }, { timeout: 5000 }).catch(() => {
        // Clerk might not be on this page
      });

    } catch (error) {
      // Continue if frameworks don't load
    }
  }

  private async collectConsoleErrors(page: any, result: QATestResult): Promise<void> {
    const errors: string[] = [];

    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon.ico') && !text.includes('_next/static')) {
          errors.push(`Console error: ${text}`);
        }
      }
    });

    page.on('pageerror', (error: Error) => {
      errors.push(`Page error: ${error.message}`);
    });

    page.on('requestfailed', (request: any) => {
      const url = request.url();
      if (!url.includes('_next/static') && !url.includes('.map') && !url.includes('favicon')) {
        errors.push(`Request failed: ${url} - ${request.failure()?.errorText || 'Unknown'}`);
      }
    });

    // Wait to collect errors
    await page.waitForTimeout(3000);

    // Convert errors to issues
    errors.forEach(error => {
      result.issues.push({
        type: 'console-error',
        severity: error.includes('404') ? 'medium' : 'high',
        description: error,
        location: { file: result.route.url },
        automated_fix_available: false
      });
    });
  }

  private async testSearchFunctionality(page: any, result: QATestResult): Promise<void> {
    try {
      // Test address input autocomplete
      const addressInput = page.locator('input[placeholder*="address"], input[placeholder*="Address"]').first();

      if (await addressInput.isVisible()) {
        await addressInput.fill('Atlanta, GA');
        await page.waitForTimeout(2000); // Wait for debouncing

        // Check if there are validation issues
        const inputValue = await addressInput.inputValue();
        if (!inputValue) {
          result.issues.push({
            type: 'form-validation',
            severity: 'medium',
            description: 'Address input not accepting text input',
            location: { selector: 'input[placeholder*="address"]' },
            automated_fix_available: false
          });
        }
      }

      // Test county selector
      const countySelector = page.locator('select, [role="combobox"]').first();
      if (await countySelector.isVisible()) {
        await countySelector.click();

        const options = page.locator('option, [role="option"]');
        const optionCount = await options.count();

        if (optionCount <= 1) {
          result.issues.push({
            type: 'broken-link',
            severity: 'medium',
            description: 'County selector has insufficient options',
            location: { selector: 'select, [role="combobox"]' },
            automated_fix_available: false
          });
        }
      }

      // Test search button functionality
      const searchButton = page.locator('button:has-text("Find Permit Offices"), button[type="submit"]').first();
      if (await searchButton.isVisible()) {
        const isEnabled = await searchButton.isEnabled();
        if (!isEnabled) {
          result.issues.push({
            type: 'hidden-element',
            severity: 'high',
            description: 'Search button is disabled when it should be functional',
            location: { selector: 'button:has-text("Find Permit Offices")' },
            automated_fix_available: true,
            fix_description: 'Enable search button and add proper validation feedback'
          });
        }
      }

    } catch (error) {
      console.warn('Error testing search functionality:', error);
    }
  }

  private async testAuthenticationFlow(page: any, result: QATestResult): Promise<void> {
    try {
      // Check for Clerk authentication components
      await page.waitForSelector('[data-clerk-id], .cl-component, [class*="cl-"]', { timeout: 10000 });

      const clerkLoaded = await page.evaluate(() => {
        return typeof window.Clerk !== 'undefined';
      });

      if (!clerkLoaded) {
        result.issues.push({
          type: 'missing-handler',
          severity: 'critical',
          description: 'Clerk authentication not properly loaded',
          location: { file: result.route.url },
          automated_fix_available: false
        });
      }

      // Test form presence
      const authForm = page.locator('form, [data-clerk="sign-in"], [data-clerk="sign-up"]').first();
      if (!(await authForm.isVisible())) {
        result.issues.push({
          type: 'missing-handler',
          severity: 'high',
          description: 'Authentication form not visible',
          location: { selector: 'form' },
          automated_fix_available: false
        });
      }

    } catch (error) {
      result.issues.push({
        type: 'missing-handler',
        severity: 'high',
        description: 'Authentication components failed to load within timeout',
        location: { file: result.route.url },
        automated_fix_available: false
      });
    }
  }

  private async testUserFeatures(page: any, result: QATestResult): Promise<void> {
    try {
      // Test export functionality
      const exportButton = page.locator('button:has-text("Export"), [data-testid="export-button"]').first();
      if (await exportButton.isVisible()) {
        const isEnabled = await exportButton.isEnabled();
        if (!isEnabled) {
          result.issues.push({
            type: 'hidden-element',
            severity: 'medium',
            description: 'Export functionality is disabled',
            location: { selector: 'button:has-text("Export")' },
            automated_fix_available: false
          });
        }
      }

      // Test navigation elements
      const backButton = page.locator('button:has-text("Back"), a:has-text("Back")').first();
      if (await backButton.isVisible()) {
        const href = await backButton.getAttribute('href');
        if (backButton.tagName === 'A' && (!href || href === '#')) {
          result.issues.push({
            type: 'broken-link',
            severity: 'medium',
            description: 'Back navigation link is broken',
            location: { selector: 'a:has-text("Back")' },
            automated_fix_available: true,
            fix_description: 'Fix navigation link URL'
          });
        }
      }

    } catch (error) {
      console.warn('Error testing user features:', error);
    }
  }

  private async performAccessibilityTest(page: any, result: QATestResult): Promise<void> {
    try {
      // Import and run axe-core
      const AxeBuilder = (await import('@axe-core/playwright')).default;
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      // Convert violations to issues
      accessibilityScanResults.violations.forEach(violation => {
        result.issues.push({
          type: 'accessibility',
          severity: violation.impact === 'critical' ? 'critical' :
                   violation.impact === 'serious' ? 'high' :
                   violation.impact === 'moderate' ? 'medium' : 'low',
          description: `${violation.id}: ${violation.description}`,
          location: {
            selector: violation.nodes[0]?.target?.join(', ') || 'unknown'
          },
          automated_fix_available: violation.tags.includes('best-practice')
        });
      });

    } catch (error) {
      console.warn('Accessibility scan failed:', error);
    }
  }

  private async testInteractiveElements(page: any, result: QATestResult): Promise<void> {
    try {
      // Test buttons
      const buttons = page.locator('button, [role="button"]');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        const isVisible = await button.isVisible();

        if (isVisible) {
          const text = await button.textContent() || '';
          const isEnabled = await button.isEnabled();

          // Check for critical buttons that are disabled
          if (!isEnabled && this.isCriticalButton(text)) {
            result.issues.push({
              type: 'hidden-element',
              severity: 'high',
              description: `Critical button "${text.trim()}" is disabled`,
              location: { selector: `button:nth-child(${i + 1})` },
              automated_fix_available: true,
              fix_description: 'Enable button and add validation feedback'
            });
          }

          // Check for empty buttons
          if (!text.trim() && !await button.locator('img, svg, [class*="icon"]').count()) {
            result.issues.push({
              type: 'accessibility',
              severity: 'medium',
              description: 'Button has no accessible text or icon',
              location: { selector: `button:nth-child(${i + 1})` },
              automated_fix_available: true,
              fix_description: 'Add aria-label or visible text'
            });
          }
        }
      }

      // Test links
      const links = page.locator('a[href]');
      const linkCount = await links.count();

      for (let i = 0; i < Math.min(linkCount, 10); i++) {
        const link = links.nth(i);
        const href = await link.getAttribute('href');
        const text = await link.textContent();

        if (href && href.startsWith('/') && href.includes('undefined')) {
          result.issues.push({
            type: 'broken-link',
            severity: 'medium',
            description: `Internal link contains undefined: ${href}`,
            location: { selector: `a[href="${href}"]` },
            automated_fix_available: true,
            fix_description: 'Fix URL generation logic'
          });
        }

        if (!text?.trim() && !await link.locator('img').count()) {
          result.issues.push({
            type: 'accessibility',
            severity: 'medium',
            description: 'Link has no accessible text',
            location: { selector: `a:nth-child(${i + 1})` },
            automated_fix_available: true,
            fix_description: 'Add descriptive link text'
          });
        }
      }

    } catch (error) {
      console.warn('Error testing interactive elements:', error);
    }
  }

  private isCriticalButton(text: string): boolean {
    const criticalKeywords = ['submit', 'search', 'find', 'sign in', 'sign up', 'save', 'export', 'create'];
    return criticalKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  private async analyzePerformance(page: any, result: QATestResult): Promise<void> {
    try {
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
        };
      });

      // Analyze response time
      if (result.route.responseTime! > 5000) {
        result.issues.push({
          type: 'performance',
          severity: 'high',
          description: `Slow page load: ${result.route.responseTime}ms`,
          location: { file: result.route.url },
          automated_fix_available: false
        });
      } else if (result.route.responseTime! > 3000) {
        result.issues.push({
          type: 'performance',
          severity: 'medium',
          description: `Moderate page load time: ${result.route.responseTime}ms`,
          location: { file: result.route.url },
          automated_fix_available: false
        });
      }

      // Check for unoptimized images
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i);
        const src = await img.getAttribute('src');

        if (src && !src.includes('_next/image') && !src.includes('optimized')) {
          result.issues.push({
            type: 'performance',
            severity: 'low',
            description: `Unoptimized image: ${src}`,
            location: { selector: `img[src="${src}"]` },
            automated_fix_available: true,
            fix_description: 'Use Next.js Image component'
          });
        }
      }

    } catch (error) {
      console.warn('Performance analysis failed:', error);
    }
  }

  private async testFormValidation(page: any, result: QATestResult): Promise<void> {
    try {
      const forms = page.locator('form');
      const formCount = await forms.count();

      for (let i = 0; i < formCount; i++) {
        const form = forms.nth(i);
        const requiredInputs = form.locator('input[required], select[required], textarea[required]');
        const requiredCount = await requiredInputs.count();

        if (requiredCount > 0) {
          const submitButton = form.locator('button[type="submit"], input[type="submit"]').first();

          if (await submitButton.isVisible()) {
            // Try submitting without filling required fields
            await submitButton.click();
            await page.waitForTimeout(1000);

            // Check for validation feedback
            const errorMessages = page.locator('.error, .invalid, [aria-invalid="true"], .text-red-500');
            const hasValidation = await errorMessages.count() > 0;

            if (!hasValidation) {
              result.issues.push({
                type: 'form-validation',
                severity: 'medium',
                description: 'Form lacks proper validation feedback for required fields',
                location: { selector: `form:nth-child(${i + 1})` },
                automated_fix_available: true,
                fix_description: 'Add client-side validation with user feedback'
              });
            }
          }
        }
      }

    } catch (error) {
      console.warn('Form validation testing failed:', error);
    }
  }

  private async testMobileResponsiveness(page: any, result: QATestResult): Promise<void> {
    try {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);

      // Check if content is still accessible
      const overflowElements = await page.$$eval('*', elements => {
        return elements.filter(el => {
          const style = window.getComputedStyle(el);
          return style.overflowX === 'auto' || style.overflowX === 'scroll';
        }).length;
      });

      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll) {
        result.issues.push({
          type: 'accessibility',
          severity: 'medium',
          description: 'Page has horizontal scroll on mobile viewport',
          location: { file: result.route.url },
          automated_fix_available: false
        });
      }

      // Reset viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

    } catch (error) {
      console.warn('Mobile responsiveness testing failed:', error);
    }
  }

  private generatePageRecommendations(issues: QAIssue[]): string[] {
    const recommendations: string[] = [];

    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const accessibilityCount = issues.filter(i => i.type === 'accessibility').length;
    const performanceCount = issues.filter(i => i.type === 'performance').length;
    const automatedFixCount = issues.filter(i => i.automated_fix_available).length;

    if (criticalCount > 0) {
      recommendations.push(`URGENT: Fix ${criticalCount} critical issue(s) blocking functionality`);
    }

    if (highCount > 2) {
      recommendations.push(`Address ${highCount} high-priority issues affecting user experience`);
    }

    if (accessibilityCount > 3) {
      recommendations.push(`Improve accessibility - ${accessibilityCount} violations found`);
    }

    if (performanceCount > 0) {
      recommendations.push(`Optimize performance - ${performanceCount} issues detected`);
    }

    if (automatedFixCount > 0) {
      recommendations.push(`Apply ${automatedFixCount} available automated fixes`);
    }

    return recommendations;
  }

  private async applyAutomatedRepairs(testResults: QATestResult[]): Promise<any> {
    console.log('🔧 Applying automated repairs...');

    const allIssues = testResults.flatMap(result => result.issues);
    const repairableIssues = allIssues.filter(issue => issue.automated_fix_available);

    if (repairableIssues.length === 0) {
      console.log('ℹ️  No automated repairs available');
      return null;
    }

    console.log(`🛠️  Found ${repairableIssues.length} issues with automated fixes`);

    const repairEngine = new UIRepairEngine();
    const repairSession = await repairEngine.applyRepairs(repairableIssues, '/Users/ekodevapps/Downloads/pto-agent-main');

    const successfulRepairs = repairSession.repairs.filter(r => r.success).length;
    console.log(`✅ Applied ${successfulRepairs} automated repairs`);

    if (successfulRepairs > 0) {
      console.log('💾 Rollback available via repair session');
    }

    return repairSession;
  }

  private compareResults(beforeResults: QATestResult[], afterResults: QATestResult[]): void {
    console.log('📊 Comparing before/after test results...');

    const beforeIssues = beforeResults.reduce((sum, r) => sum + r.issues.length, 0);
    const afterIssues = afterResults.reduce((sum, r) => sum + r.issues.length, 0);

    const improvement = beforeIssues - afterIssues;

    if (improvement > 0) {
      console.log(`✅ Improvement: ${improvement} fewer issues after repairs`);
    } else if (improvement < 0) {
      console.log(`⚠️  Regression: ${Math.abs(improvement)} more issues after repairs`);
    } else {
      console.log(`➡️  No change in issue count after repairs`);
    }
  }

  private async generateReports(testResults: QATestResult[], crawlResults: any, repairSession?: any): Promise<void> {
    console.log('📝 Generating comprehensive reports...');

    const reportGenerator = new QAReportGenerator({
      outputDir: '/Users/ekodevapps/Downloads/pto-agent-main/qa/reports',
      includeScreenshots: true,
      generateHTML: true,
      generateJSON: true,
      generateMarkdown: true
    });

    const reportFiles = await reportGenerator.generateReport(
      testResults,
      crawlResults,
      repairSession,
      this.options.baseUrl
    );

    console.log('✅ Reports generated:');
    reportFiles.forEach(file => {
      console.log(`  📄 ${path.basename(file)}`);
    });
  }

  private async displaySummary(testResults: QATestResult[], repairSession?: any): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📋 QA AUDIT SUMMARY');
    console.log('='.repeat(60));

    const allIssues = testResults.flatMap(r => r.issues);
    const passedTests = testResults.filter(r => r.passed).length;

    console.log(`🎯 Routes Tested: ${testResults.length}`);
    console.log(`✅ Tests Passed: ${passedTests}/${testResults.length}`);
    console.log(`⚠️  Total Issues: ${allIssues.length}`);

    const issuesBySeverity = {
      critical: allIssues.filter(i => i.severity === 'critical').length,
      high: allIssues.filter(i => i.severity === 'high').length,
      medium: allIssues.filter(i => i.severity === 'medium').length,
      low: allIssues.filter(i => i.severity === 'low').length
    };

    console.log(`🚨 Critical: ${issuesBySeverity.critical}`);
    console.log(`⚠️  High: ${issuesBySeverity.high}`);
    console.log(`📋 Medium: ${issuesBySeverity.medium}`);
    console.log(`ℹ️  Low: ${issuesBySeverity.low}`);

    if (repairSession) {
      const successfulRepairs = repairSession.repairs.filter((r: any) => r.success).length;
      console.log(`🔧 Repairs Applied: ${successfulRepairs}`);
    }

    // Priority recommendations
    console.log('\n🎯 PRIORITY ACTIONS:');

    if (issuesBySeverity.critical > 0) {
      console.log(`1. 🚨 FIX ${issuesBySeverity.critical} CRITICAL ISSUE(S) IMMEDIATELY`);
    }

    const automatedFixes = allIssues.filter(i => i.automated_fix_available).length;
    if (automatedFixes > 0) {
      console.log(`2. 🔧 Apply ${automatedFixes} automated fixes`);
    }

    if (issuesBySeverity.high > 3) {
      console.log(`3. ⚠️  Address ${issuesBySeverity.high} high-priority issues`);
    }

    console.log(`4. 📊 Review detailed reports in qa/reports/`);
    console.log(`5. 🔄 Re-run audit after fixes to validate improvements`);

    console.log('\n' + '='.repeat(60));

    // Overall health assessment
    const overallHealth = this.calculateOverallHealth(testResults);
    const healthEmoji = overallHealth >= 80 ? '💚' : overallHealth >= 60 ? '💛' : '❤️';

    console.log(`${healthEmoji} OVERALL HEALTH: ${overallHealth}%`);
    console.log('='.repeat(60));
  }

  private calculateOverallHealth(testResults: QATestResult[]): number {
    const allIssues = testResults.flatMap(r => r.issues);
    const passedTests = testResults.filter(r => r.passed).length;

    const testScore = testResults.length > 0 ? (passedTests / testResults.length) * 100 : 100;
    const issueScore = Math.max(0, 100 - (
      allIssues.filter(i => i.severity === 'critical').length * 30 +
      allIssues.filter(i => i.severity === 'high').length * 15 +
      allIssues.filter(i => i.severity === 'medium').length * 5 +
      allIssues.filter(i => i.severity === 'low').length * 1
    ));

    return Math.round((testScore + issueScore) / 2);
  }

  private async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options: Partial<QAAuditOptions> = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case '--url':
        options.baseUrl = value;
        break;
      case '--depth':
        options.maxDepth = parseInt(value);
        break;
      case '--pages':
        options.maxPages = parseInt(value);
        break;
      case '--no-repair':
        options.applyRepairs = false;
        i--; // No value for this flag
        break;
      case '--no-headless':
        options.headless = false;
        i--; // No value for this flag
        break;
    }
  }

  const orchestrator = new QAAuditOrchestrator(options);
  await orchestrator.run();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { QAAuditOrchestrator };