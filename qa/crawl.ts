/**
 * Comprehensive UI Crawler
 * BFS-based crawler that discovers routes, analyzes pages, and collects data for testing
 */

import { Page, Browser } from '@playwright/test';
import { RouteInfo, normalizeUrl, shouldCrawlUrl, extractLinks, waitForNetworkIdle, takeScreenshot, urlToFilename } from './utils';

export interface CrawlOptions {
  maxDepth: number;
  maxPages: number;
  timeout: number;
  excludePatterns: string[];
  includePaths: string[];
  saveScreenshots: boolean;
  saveDomSnapshots: boolean;
  waitForJs: boolean;
}

export interface CrawlResult {
  routes: RouteInfo[];
  totalPages: number;
  totalErrors: number;
  crawlDuration: number;
  baseUrl: string;
  timestamp: Date;
}

export class UICrawler {
  private browser: Browser;
  private baseUrl: string;
  private options: CrawlOptions;
  private visitedUrls: Set<string> = new Set();
  private discoveredRoutes: Map<string, RouteInfo> = new Map();
  private queue: Array<{ url: string; depth: number }> = [];

  constructor(browser: Browser, baseUrl: string, options: Partial<CrawlOptions> = {}) {
    this.browser = browser;
    this.baseUrl = baseUrl;
    this.options = {
      maxDepth: 3,
      maxPages: 50,
      timeout: 30000,
      excludePatterns: [],
      includePaths: ['/'],
      saveScreenshots: true,
      saveDomSnapshots: false,
      waitForJs: true,
      ...options
    };
  }

  /**
   * Start the crawling process
   */
  async crawl(): Promise<CrawlResult> {
    const startTime = Date.now();
    console.log(`🕷️  Starting UI crawl of ${this.baseUrl}`);
    console.log(`📊 Options: maxDepth=${this.options.maxDepth}, maxPages=${this.options.maxPages}`);

    // Initialize with starting URLs
    this.options.includePaths.forEach(path => {
      const fullUrl = new URL(path, this.baseUrl).toString();
      this.queue.push({ url: fullUrl, depth: 0 });
    });

    // Create screenshots directory
    if (this.options.saveScreenshots) {
      await this.ensureDirectoryExists('/Users/ekodevapps/Downloads/pto-agent-main/qa/screenshots');
    }

    // Breadth-first crawl
    while (this.queue.length > 0 && this.visitedUrls.size < this.options.maxPages) {
      const { url, depth } = this.queue.shift()!;

      if (depth > this.options.maxDepth || this.visitedUrls.has(url)) {
        continue;
      }

      await this.crawlPage(url, depth);
    }

    const endTime = Date.now();
    const crawlDuration = endTime - startTime;

    console.log(`✅ Crawl completed in ${crawlDuration}ms`);
    console.log(`📄 Total pages: ${this.visitedUrls.size}`);
    console.log(`🔗 Total routes discovered: ${this.discoveredRoutes.size}`);

    return {
      routes: Array.from(this.discoveredRoutes.values()),
      totalPages: this.visitedUrls.size,
      totalErrors: Array.from(this.discoveredRoutes.values()).reduce((sum, route) => sum + route.errors.length, 0),
      crawlDuration,
      baseUrl: this.baseUrl,
      timestamp: new Date()
    };
  }

  /**
   * Crawl a single page and extract information
   */
  private async crawlPage(url: string, depth: number): Promise<void> {
    const normalizedUrl = normalizeUrl(url, this.baseUrl);

    if (this.visitedUrls.has(normalizedUrl)) {
      return;
    }

    this.visitedUrls.add(normalizedUrl);
    console.log(`🔍 Crawling [${depth}]: ${url}`);

    const page = await this.browser.newPage();
    const routeInfo: RouteInfo = {
      url,
      normalizedUrl,
      depth,
      discovered: new Date(),
      tested: false,
      errors: [],
      accessibilityIssues: []
    };

    try {
      // Navigate with timeout
      const startTime = Date.now();
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout
      });

      const endTime = Date.now();
      routeInfo.responseTime = endTime - startTime;
      routeInfo.statusCode = response?.status();

      // Wait for JavaScript to execute
      if (this.options.waitForJs) {
        await waitForNetworkIdle(page);

        // Wait for common frameworks to load
        await page.waitForFunction(() => {
          // Wait for React
          if (window.React) return true;
          // Wait for Next.js
          if (window.__NEXT_DATA__) return true;
          // Wait for general DOM ready
          return document.readyState === 'complete';
        }, { timeout: 5000 }).catch(() => {
          // Continue if timeout
        });
      }

      // Collect console errors
      const consoleErrors = await this.collectConsoleErrors(page);
      routeInfo.errors.push(...consoleErrors);

      // Take screenshot
      if (this.options.saveScreenshots) {
        const filename = `${urlToFilename(url)}_${Date.now()}.png`;
        const screenshotPath = await takeScreenshot(page, filename);
        if (screenshotPath) {
          routeInfo.screenshot = screenshotPath;
        }
      }

      // Save DOM snapshot
      if (this.options.saveDomSnapshots) {
        const domContent = await page.content();
        routeInfo.domSnapshot = domContent;
      }

      // Extract links for further crawling
      if (depth < this.options.maxDepth) {
        await this.extractAndQueueLinks(page, depth + 1);
      }

      // Basic accessibility check
      await this.performBasicAccessibilityCheck(page, routeInfo);

      // Check for broken elements
      await this.checkForBrokenElements(page, routeInfo);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error crawling ${url}:`, errorMessage);
      routeInfo.errors.push(`Navigation error: ${errorMessage}`);

      if (errorMessage.includes('net::ERR_FAILED') || errorMessage.includes('404')) {
        routeInfo.statusCode = 404;
      } else if (errorMessage.includes('timeout')) {
        routeInfo.statusCode = 408;
      }
    } finally {
      await page.close();
      this.discoveredRoutes.set(normalizedUrl, routeInfo);
    }
  }

  /**
   * Extract links from current page and add to crawl queue
   */
  private async extractAndQueueLinks(page: Page, depth: number): Promise<void> {
    try {
      // Get all links on the page
      const links = await page.$$eval('a[href]', anchors =>
        anchors.map(a => (a as HTMLAnchorElement).href)
      );

      // Also check for navigation links in buttons with data attributes
      const buttonLinks = await page.$$eval('button[data-href], [data-url], [onclick*="location"]', buttons =>
        buttons.map(button => {
          const dataHref = button.getAttribute('data-href');
          const dataUrl = button.getAttribute('data-url');
          const onclick = button.getAttribute('onclick');

          if (dataHref) return dataHref;
          if (dataUrl) return dataUrl;
          if (onclick) {
            const match = onclick.match(/location\s*=\s*['"]([^'"]+)['"]/);
            return match ? match[1] : null;
          }
          return null;
        }).filter(Boolean)
      );

      const allLinks = [...links, ...buttonLinks];

      // Filter and normalize links
      for (const link of allLinks) {
        if (!link) continue;

        try {
          const fullUrl = new URL(link, this.baseUrl).toString();
          const normalizedUrl = normalizeUrl(fullUrl, this.baseUrl);

          if (shouldCrawlUrl(normalizedUrl, this.baseUrl, this.options.excludePatterns) &&
              !this.visitedUrls.has(normalizedUrl)) {
            this.queue.push({ url: normalizedUrl, depth });
          }
        } catch (error) {
          // Invalid URL, skip
        }
      }
    } catch (error) {
      console.warn('Error extracting links:', error);
    }
  }

  /**
   * Collect console errors from the page
   */
  private async collectConsoleErrors(page: Page): Promise<string[]> {
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
      errors.push(`Request failed: ${request.url()} - ${request.failure()?.errorText || 'Unknown error'}`);
    });

    // Wait a bit to collect errors
    await page.waitForTimeout(2000);

    return errors;
  }

  /**
   * Perform basic accessibility checks
   */
  private async performBasicAccessibilityCheck(page: Page, routeInfo: RouteInfo): Promise<void> {
    try {
      // Check for images without alt text
      const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs =>
        imgs.map(img => ({
          type: 'missing-alt-text',
          element: img.outerHTML,
          message: 'Image missing alt text'
        }))
      );

      // Check for buttons without accessible names
      const buttonsWithoutNames = await page.$$eval('button:not([aria-label]):not([aria-labelledby])', buttons =>
        buttons.filter(btn => !btn.textContent?.trim()).map(btn => ({
          type: 'missing-button-name',
          element: btn.outerHTML,
          message: 'Button missing accessible name'
        }))
      );

      // Check for form inputs without labels
      const inputsWithoutLabels = await page.$$eval('input[type]:not([aria-label]):not([aria-labelledby])', inputs =>
        inputs.map(input => {
          const id = input.id;
          const hasLabel = id && document.querySelector(`label[for="${id}"]`);
          if (!hasLabel) {
            return {
              type: 'missing-input-label',
              element: input.outerHTML,
              message: 'Form input missing label'
            };
          }
          return null;
        }).filter(Boolean)
      );

      routeInfo.accessibilityIssues.push(...imagesWithoutAlt, ...buttonsWithoutNames, ...inputsWithoutLabels);

    } catch (error) {
      console.warn('Error performing accessibility check:', error);
    }
  }

  /**
   * Check for broken or problematic elements
   */
  private async checkForBrokenElements(page: Page, routeInfo: RouteInfo): Promise<void> {
    try {
      // Check for broken images
      const brokenImages = await page.$$eval('img', imgs =>
        imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src)
      );

      brokenImages.forEach(src => {
        routeInfo.errors.push(`Broken image: ${src}`);
      });

      // Check for empty links
      const emptyLinks = await page.$$eval('a[href]', links =>
        links.filter(link => !link.textContent?.trim() && !link.querySelector('img')).map(link => link.href)
      );

      emptyLinks.forEach(href => {
        routeInfo.errors.push(`Empty link: ${href}`);
      });

      // Check for buttons that might not be clickable
      const hiddenButtons = await page.$$eval('button, [role="button"]', buttons =>
        buttons.filter(btn => {
          const style = window.getComputedStyle(btn);
          return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
        }).map(btn => btn.outerHTML?.substring(0, 100) + '...')
      );

      hiddenButtons.forEach(html => {
        routeInfo.errors.push(`Hidden interactive element: ${html}`);
      });

    } catch (error) {
      console.warn('Error checking for broken elements:', error);
    }
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(path: string): Promise<void> {
    const fs = await import('fs/promises');
    try {
      await fs.mkdir(path, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Get specific routes for testing
   */
  getRoutesByPattern(pattern: RegExp): RouteInfo[] {
    return Array.from(this.discoveredRoutes.values()).filter(route =>
      pattern.test(route.url)
    );
  }

  /**
   * Get routes with errors
   */
  getRoutesWithErrors(): RouteInfo[] {
    return Array.from(this.discoveredRoutes.values()).filter(route =>
      route.errors.length > 0 || route.accessibilityIssues.length > 0
    );
  }

  /**
   * Get critical application routes
   */
  getCriticalRoutes(): RouteInfo[] {
    const criticalPatterns = [
      /\/$/,              // Homepage
      /\/search/,         // Search functionality
      /\/sign-in/,        // Authentication
      /\/sign-up/,        // Registration
      /\/dashboard/,      // User dashboard
      /\/profile/,        // User profile
      /\/pricing/,        // Pricing page
      /\/favorites/,      // Favorites
      /\/teams/,          // Team management
    ];

    return Array.from(this.discoveredRoutes.values()).filter(route =>
      criticalPatterns.some(pattern => pattern.test(route.url))
    );
  }
}