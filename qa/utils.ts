/**
 * QA Automation Utilities
 * URL normalization, validation, and common utility functions for UI testing
 */

export interface RouteInfo {
  url: string;
  normalizedUrl: string;
  statusCode?: number;
  responseTime?: number;
  depth: number;
  discovered: Date;
  tested: boolean;
  errors: string[];
  accessibilityIssues: any[];
  screenshot?: string;
  domSnapshot?: string;
}

export interface QATestResult {
  route: RouteInfo;
  passed: boolean;
  issues: QAIssue[];
  recommendations: string[];
  before?: {
    screenshot?: string;
    accessibilityScore?: number;
    errors?: string[];
  };
  after?: {
    screenshot?: string;
    accessibilityScore?: number;
    errors?: string[];
  };
}

export interface QAIssue {
  type: 'accessibility' | 'console-error' | 'broken-link' | 'missing-handler' | 'hidden-element' | 'form-validation' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  element?: string;
  description: string;
  location: {
    file?: string;
    line?: number;
    selector?: string;
  };
  automated_fix_available: boolean;
  fix_description?: string;
}

/**
 * Normalize URLs for consistent comparison and deduplication
 */
export function normalizeUrl(url: string, baseUrl: string): string {
  try {
    const urlObj = new URL(url, baseUrl);

    // Remove fragments and common tracking parameters
    urlObj.hash = '';
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid', '_gl'];
    paramsToRemove.forEach(param => urlObj.searchParams.delete(param));

    // Remove trailing slash for consistency, except for root
    let pathname = urlObj.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    return `${urlObj.origin}${pathname}${urlObj.search}`;
  } catch (error) {
    return url;
  }
}

/**
 * Check if URL should be crawled (same origin, not excluded)
 */
export function shouldCrawlUrl(url: string, baseUrl: string, excludePatterns: string[] = []): boolean {
  try {
    const urlObj = new URL(url, baseUrl);
    const baseUrlObj = new URL(baseUrl);

    // Only crawl same origin
    if (urlObj.origin !== baseUrlObj.origin) {
      return false;
    }

    // Check exclude patterns
    const path = urlObj.pathname.toLowerCase();
    const excludeDefaults = [
      '/api/',
      '/_next/',
      '/static/',
      '/public/',
      '.css',
      '.js',
      '.ico',
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.svg',
      '.pdf',
      '.zip',
      '/admin/',
      '/dashboard/admin',
      '/webhook',
      '/sitemap',
      '/robots.txt'
    ];

    const allExcludes = [...excludeDefaults, ...excludePatterns];

    return !allExcludes.some(pattern => path.includes(pattern.toLowerCase()));
  } catch (error) {
    return false;
  }
}

/**
 * Extract links from page content
 */
export function extractLinks(content: string, baseUrl: string): string[] {
  const linkRegex = /href=["']([^"']+)["']/gi;
  const links: string[] = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1];
    if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      try {
        const fullUrl = new URL(href, baseUrl).toString();
        links.push(fullUrl);
      } catch (error) {
        // Invalid URL, skip
      }
    }
  }

  return [...new Set(links)]; // Remove duplicates
}

/**
 * Get interactive elements selectors for testing
 */
export function getInteractiveSelectors(): string[] {
  return [
    'button',
    'input[type="button"]',
    'input[type="submit"]',
    'a[href]',
    'input[type="text"]',
    'input[type="email"]',
    'input[type="password"]',
    'input[type="search"]',
    'textarea',
    'select',
    'input[type="checkbox"]',
    'input[type="radio"]',
    '[role="button"]',
    '[onclick]',
    '[tabindex]',
    '.btn',
    '.button',
    '[data-testid]'
  ];
}

/**
 * Common accessibility selectors to check
 */
export function getAccessibilitySelectors(): string[] {
  return [
    'img:not([alt])',
    'input:not([aria-label]):not([aria-labelledby]):not([id])',
    'button:not([aria-label]):not([aria-labelledby])',
    '[role]:not([aria-label]):not([aria-labelledby])',
    'iframe:not([title])',
    'a:empty',
    'button:empty'
  ];
}

/**
 * Wait for element with timeout
 */
export async function waitForElement(page: any, selector: string, timeout = 5000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Safe click with retry mechanism
 */
export async function safeClick(page: any, selector: string, maxRetries = 3): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.click(selector, { timeout: 5000 });
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        console.warn(`Failed to click ${selector} after ${maxRetries} attempts:`, error);
        return false;
      }
      await page.waitForTimeout(1000); // Wait before retry
    }
  }
  return false;
}

/**
 * Check if element is actually visible (not just in DOM)
 */
export async function isElementVisible(page: any, selector: string): Promise<boolean> {
  try {
    return await page.locator(selector).isVisible();
  } catch (error) {
    return false;
  }
}

/**
 * Get element bounding box for interaction testing
 */
export async function getElementBounds(page: any, selector: string): Promise<any> {
  try {
    return await page.locator(selector).boundingBox();
  } catch (error) {
    return null;
  }
}

/**
 * Take screenshot with error handling
 */
export async function takeScreenshot(page: any, filename: string): Promise<string | null> {
  try {
    const screenshotPath = `/Users/ekodevapps/Downloads/pto-agent-main/qa/screenshots/${filename}`;
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: 'png'
    });
    return screenshotPath;
  } catch (error) {
    console.warn(`Failed to take screenshot ${filename}:`, error);
    return null;
  }
}

/**
 * Wait for network idle state
 */
export async function waitForNetworkIdle(page: any, timeout = 10000): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (error) {
    console.warn('Network did not become idle within timeout');
  }
}

/**
 * Generate safe filename from URL
 */
export function urlToFilename(url: string): string {
  return url
    .replace(/https?:\/\//, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
    || 'home';
}

/**
 * Format test results for reporting
 */
export function formatTestResult(result: QATestResult): string {
  const { route, passed, issues, recommendations } = result;

  let output = `\n## ${route.url}\n`;
  output += `Status: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`;
  output += `Response Time: ${route.responseTime || 'Unknown'}ms\n`;
  output += `Status Code: ${route.statusCode || 'Unknown'}\n\n`;

  if (issues.length > 0) {
    output += `### Issues Found (${issues.length}):\n`;
    issues.forEach((issue, index) => {
      output += `${index + 1}. **${issue.severity.toUpperCase()}**: ${issue.description}\n`;
      if (issue.location.selector) {
        output += `   - Element: \`${issue.location.selector}\`\n`;
      }
      if (issue.automated_fix_available) {
        output += `   - 🔧 Automated fix available: ${issue.fix_description}\n`;
      }
    });
    output += '\n';
  }

  if (recommendations.length > 0) {
    output += `### Recommendations:\n`;
    recommendations.forEach((rec, index) => {
      output += `${index + 1}. ${rec}\n`;
    });
    output += '\n';
  }

  return output;
}

/**
 * Validate environment and dependencies
 */
export async function validateEnvironment(): Promise<{ valid: boolean; issues: string[] }> {
  const issues: string[] = [];

  // Check if running in development
  if (process.env.NODE_ENV === 'production') {
    issues.push('QA automation should run in development environment');
  }

  // Check for required environment variables (warn but don't fail)
  const requiredEnvVars = ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      console.warn(`⚠️  Warning: Missing environment variable: ${envVar}`);
    }
  });

  // Always return valid for QA testing
  return {
    valid: true,
    issues
  };
}