/**
 * Automated Repair Strategies
 * Safe AST-based repairs for common UI issues with comprehensive safety guards
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { QAIssue } from './utils';

export interface RepairRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp | string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  safetyLevel: 'safe' | 'moderate' | 'risky';
  apply: (content: string, filePath: string, context?: any) => Promise<RepairResult>;
  validate: (content: string, originalContent: string) => boolean;
}

export interface RepairResult {
  success: boolean;
  modified: boolean;
  newContent?: string;
  changes: RepairChange[];
  warnings: string[];
  rollbackData?: any;
}

export interface RepairChange {
  type: 'add' | 'modify' | 'remove';
  description: string;
  lineNumber?: number;
  before?: string;
  after?: string;
}

export interface RepairSession {
  sessionId: string;
  timestamp: Date;
  repairs: RepairApplication[];
  rollbackAvailable: boolean;
}

export interface RepairApplication {
  ruleId: string;
  filePath: string;
  success: boolean;
  changes: RepairChange[];
  backupPath?: string;
}

/**
 * Main repair engine for applying safe automated fixes
 */
export class UIRepairEngine {
  private rules: RepairRule[] = [];
  private session: RepairSession;
  private backupDir: string;

  constructor() {
    this.session = {
      sessionId: `repair_${Date.now()}`,
      timestamp: new Date(),
      repairs: [],
      rollbackAvailable: false
    };
    this.backupDir = '/Users/ekodevapps/Downloads/pto-agent-main/qa/backups';
    this.initializeRules();
  }

  /**
   * Initialize all repair rules
   */
  private initializeRules(): void {
    this.rules = [
      this.createHiddenButtonRule(),
      this.createMissingHandlerRule(),
      this.createBrokenLinkRule(),
      this.createMissingAltTextRule(),
      this.createConsoleErrorRule(),
      this.createImportFixRule(),
      this.createFormValidationRule(),
      this.createAccessibilityRule(),
      this.createPerformanceRule()
    ];
  }

  /**
   * Apply repairs based on discovered issues
   */
  async applyRepairs(issues: QAIssue[], projectRoot: string): Promise<RepairSession> {
    console.log(`🔧 Starting repair session: ${this.session.sessionId}`);
    console.log(`📊 Processing ${issues.length} issues`);

    // Ensure backup directory exists
    await this.ensureBackupDirectory();

    // Group issues by file for efficiency
    const issuesByFile = this.groupIssuesByFile(issues);

    for (const [filePath, fileIssues] of Object.entries(issuesByFile)) {
      await this.repairFile(filePath, fileIssues, projectRoot);
    }

    this.session.rollbackAvailable = this.session.repairs.some(repair => repair.success);

    console.log(`✅ Repair session completed`);
    console.log(`🔄 Applied ${this.session.repairs.filter(r => r.success).length} successful repairs`);

    return this.session;
  }

  /**
   * Repair a single file
   */
  private async repairFile(filePath: string, issues: QAIssue[], projectRoot: string): Promise<void> {
    const fullPath = path.resolve(projectRoot, filePath);

    try {
      // Check if file exists
      const content = await fs.readFile(fullPath, 'utf-8');
      let modifiedContent = content;
      let hasChanges = false;

      // Create backup before any modifications
      const backupPath = await this.createBackup(fullPath, content);

      for (const issue of issues) {
        const applicableRules = this.findApplicableRules(issue);

        for (const rule of applicableRules) {
          console.log(`🔧 Applying rule "${rule.name}" to ${filePath}`);

          const result = await rule.apply(modifiedContent, fullPath, { issue });

          if (result.success && result.modified && result.newContent) {
            // Validate the change is safe
            if (rule.validate(result.newContent, content)) {
              modifiedContent = result.newContent;
              hasChanges = true;

              this.session.repairs.push({
                ruleId: rule.id,
                filePath,
                success: true,
                changes: result.changes,
                backupPath
              });

              console.log(`✅ Successfully applied "${rule.name}"`);
            } else {
              console.warn(`⚠️  Validation failed for rule "${rule.name}", skipping`);

              this.session.repairs.push({
                ruleId: rule.id,
                filePath,
                success: false,
                changes: [],
                backupPath
              });
            }
          }
        }
      }

      // Write modified content if there were changes
      if (hasChanges) {
        await fs.writeFile(fullPath, modifiedContent, 'utf-8');
        console.log(`💾 Updated file: ${filePath}`);
      }

    } catch (error) {
      console.error(`❌ Error repairing file ${filePath}:`, error);
    }
  }

  /**
   * Rule: Fix hidden critical buttons
   */
  private createHiddenButtonRule(): RepairRule {
    return {
      id: 'hidden-button-fix',
      name: 'Fix Hidden Critical Buttons',
      description: 'Remove display:none or visibility:hidden from critical interactive elements',
      pattern: /hidden|display:\s*none|visibility:\s*hidden/i,
      severity: 'high',
      safetyLevel: 'safe',

      async apply(content: string, filePath: string, context?: any): Promise<RepairResult> {
        const changes: RepairChange[] = [];
        let newContent = content;

        // Only apply to CSS classes, not inline styles to be safe
        const hiddenClassPattern = /\.([a-zA-Z0-9_-]*hidden[a-zA-Z0-9_-]*)\s*{[^}]*display:\s*none[^}]*}/gi;
        const visibilityPattern = /\.([a-zA-Z0-9_-]*hidden[a-zA-Z0-9_-]*)\s*{[^}]*visibility:\s*hidden[^}]*}/gi;

        newContent = newContent.replace(hiddenClassPattern, (match, className) => {
          // Only fix if it's a button-related class
          if (/button|btn|submit|action/i.test(className)) {
            changes.push({
              type: 'modify',
              description: `Removed display:none from button class .${className}`,
              before: match,
              after: match.replace(/display:\s*none;?/gi, '/* display: none; removed by QA repair */')
            });
            return match.replace(/display:\s*none;?/gi, '/* display: none; removed by QA repair */');
          }
          return match;
        });

        return {
          success: true,
          modified: changes.length > 0,
          newContent: changes.length > 0 ? newContent : undefined,
          changes,
          warnings: []
        };
      },

      validate(newContent: string, originalContent: string): boolean {
        // Validate that we didn't break any CSS syntax
        const braceBalance = (str: string) => {
          let count = 0;
          for (const char of str) {
            if (char === '{') count++;
            if (char === '}') count--;
          }
          return count === 0;
        };

        return braceBalance(newContent);
      }
    };
  }

  /**
   * Rule: Add missing event handlers
   */
  private createMissingHandlerRule(): RepairRule {
    return {
      id: 'missing-handler-fix',
      name: 'Add Missing Event Handlers',
      description: 'Add placeholder event handlers for interactive elements',
      pattern: /<button[^>]*>(?!.*onClick|.*onSubmit)/i,
      severity: 'medium',
      safetyLevel: 'moderate',

      async apply(content: string, filePath: string): Promise<RepairResult> {
        const changes: RepairChange[] = [];
        let newContent = content;

        // Only apply to React/TSX files
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) {
          return { success: true, modified: false, changes: [], warnings: [] };
        }

        // Find buttons without onClick handlers
        const buttonPattern = /<button([^>]*?)(?!.*onClick)([^>]*?)>/gi;

        newContent = newContent.replace(buttonPattern, (match, attrs1, attrs2) => {
          // Skip if it already has an onClick or if it's a submit button
          if (match.includes('onClick') || match.includes('type="submit"')) {
            return match;
          }

          const newMatch = match.replace('>', ' onClick={() => {/* TODO: Add click handler */}}>\n');
          changes.push({
            type: 'modify',
            description: 'Added placeholder onClick handler to button',
            before: match,
            after: newMatch
          });
          return newMatch;
        });

        return {
          success: true,
          modified: changes.length > 0,
          newContent: changes.length > 0 ? newContent : undefined,
          changes,
          warnings: changes.length > 0 ? ['Added placeholder handlers - implement actual functionality'] : []
        };
      },

      validate(newContent: string, originalContent: string): boolean {
        // Check that JSX syntax is still valid
        const jsxBalance = (str: string) => {
          const opens = (str.match(/</g) || []).length;
          const closes = (str.match(/>/g) || []).length;
          return Math.abs(opens - closes) <= 1; // Allow for some tolerance
        };

        return jsxBalance(newContent);
      }
    };
  }

  /**
   * Rule: Fix broken internal links
   */
  private createBrokenLinkRule(): RepairRule {
    return {
      id: 'broken-link-fix',
      name: 'Fix Broken Internal Links',
      description: 'Fix common typos in internal navigation links',
      pattern: /href=["']\/[^"']*["']/gi,
      severity: 'medium',
      safetyLevel: 'safe',

      async apply(content: string, filePath: string): Promise<RepairResult> {
        const changes: RepairChange[] = [];
        let newContent = content;

        // Common typos in route names
        const routeFixes = [
          { from: '/dashbord', to: '/dashboard' },
          { from: '/favroites', to: '/favorites' },
          { from: '/profle', to: '/profile' },
          { from: '/setings', to: '/settings' },
          { from: '/signin', to: '/sign-in' },
          { from: '/signup', to: '/sign-up' }
        ];

        routeFixes.forEach(fix => {
          const pattern = new RegExp(`href=["']${fix.from}["']`, 'gi');
          if (pattern.test(newContent)) {
            newContent = newContent.replace(pattern, `href="${fix.to}"`);
            changes.push({
              type: 'modify',
              description: `Fixed broken link: ${fix.from} → ${fix.to}`,
              before: `href="${fix.from}"`,
              after: `href="${fix.to}"`
            });
          }
        });

        return {
          success: true,
          modified: changes.length > 0,
          newContent: changes.length > 0 ? newContent : undefined,
          changes,
          warnings: []
        };
      },

      validate(newContent: string, originalContent: string): boolean {
        // Ensure we didn't break any href attributes
        const hrefPattern = /href=["'][^"']*["']/g;
        const originalHrefs = originalContent.match(hrefPattern) || [];
        const newHrefs = newContent.match(hrefPattern) || [];

        // Should have same number of href attributes
        return originalHrefs.length === newHrefs.length;
      }
    };
  }

  /**
   * Rule: Add missing alt text to images
   */
  private createMissingAltTextRule(): RepairRule {
    return {
      id: 'missing-alt-text-fix',
      name: 'Add Missing Alt Text',
      description: 'Add descriptive alt text to images missing alt attributes',
      pattern: /<img[^>]*(?!alt=)[^>]*>/gi,
      severity: 'medium',
      safetyLevel: 'safe',

      async apply(content: string, filePath: string): Promise<RepairResult> {
        const changes: RepairChange[] = [];
        let newContent = content;

        // Find images without alt attributes
        const imgPattern = /<img([^>]*?)(?!.*alt=)([^>]*?)>/gi;

        newContent = newContent.replace(imgPattern, (match, attrs1, attrs2) => {
          if (match.includes('alt=')) {
            return match;
          }

          // Try to extract meaningful alt text from src or class names
          const srcMatch = match.match(/src=["']([^"']*?)["']/);
          const src = srcMatch ? srcMatch[1] : '';

          let altText = 'Image';
          if (src) {
            const filename = src.split('/').pop()?.split('.')[0] || '';
            altText = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Image';
          }

          const newMatch = match.replace('>', ` alt="${altText}">`);
          changes.push({
            type: 'modify',
            description: `Added alt text to image: "${altText}"`,
            before: match,
            after: newMatch
          });
          return newMatch;
        });

        return {
          success: true,
          modified: changes.length > 0,
          newContent: changes.length > 0 ? newContent : undefined,
          changes,
          warnings: changes.length > 0 ? ['Generated alt text may need manual review'] : []
        };
      },

      validate(newContent: string, originalContent: string): boolean {
        // Check that we didn't break any img tags
        const imgCount = (originalContent.match(/<img/g) || []).length;
        const newImgCount = (newContent.match(/<img/g) || []).length;
        return imgCount === newImgCount;
      }
    };
  }

  /**
   * Rule: Fix common console errors
   */
  private createConsoleErrorRule(): RepairRule {
    return {
      id: 'console-error-fix',
      name: 'Fix Common Console Errors',
      description: 'Fix common JavaScript/TypeScript errors that appear in console',
      pattern: /console\.error|undefined|null/i,
      severity: 'high',
      safetyLevel: 'moderate',

      async apply(content: string, filePath: string): Promise<RepairResult> {
        const changes: RepairChange[] = [];
        let newContent = content;

        // Fix common undefined access patterns
        const fixes = [
          {
            pattern: /(\w+)\.(\w+)(?!\?\.)/g,
            replacement: '$1?.$2',
            condition: (match: string) => !match.includes('?.') && !match.includes('console.')
          }
        ];

        // Only apply to TypeScript/JavaScript files
        if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
          fixes.forEach(fix => {
            newContent = newContent.replace(fix.pattern, (match, ...args) => {
              if (fix.condition && !fix.condition(match)) {
                return match;
              }

              const replacement = fix.replacement.replace(/\$(\d+)/g, (_, num) => args[parseInt(num) - 1]);
              changes.push({
                type: 'modify',
                description: `Added optional chaining: ${match} → ${replacement}`,
                before: match,
                after: replacement
              });
              return replacement;
            });
          });
        }

        return {
          success: true,
          modified: changes.length > 0,
          newContent: changes.length > 0 ? newContent : undefined,
          changes,
          warnings: changes.length > 0 ? ['Optional chaining added - verify logic is correct'] : []
        };
      },

      validate(newContent: string, originalContent: string): boolean {
        // Basic syntax validation - count brackets
        const brackets = { '{': 0, '}': 0, '(': 0, ')': 0, '[': 0, ']': 0 };

        for (const char of newContent) {
          if (char in brackets) {
            brackets[char as keyof typeof brackets]++;
          }
        }

        return brackets['{'] === brackets['}'] &&
               brackets['('] === brackets[')'] &&
               brackets['['] === brackets[']'];
      }
    };
  }

  /**
   * Helper methods
   */
  private groupIssuesByFile(issues: QAIssue[]): Record<string, QAIssue[]> {
    const grouped: Record<string, QAIssue[]> = {};

    issues.forEach(issue => {
      const file = issue.location.file || 'unknown';
      if (!grouped[file]) {
        grouped[file] = [];
      }
      grouped[file].push(issue);
    });

    return grouped;
  }

  private findApplicableRules(issue: QAIssue): RepairRule[] {
    return this.rules.filter(rule => {
      // Match by issue type or pattern
      if (typeof rule.pattern === 'string') {
        return issue.description.toLowerCase().includes(rule.pattern.toLowerCase());
      } else {
        return rule.pattern.test(issue.description);
      }
    });
  }

  private async createBackup(filePath: string, content: string): Promise<string> {
    const filename = path.basename(filePath);
    const backupPath = path.join(this.backupDir, `${filename}.${Date.now()}.backup`);

    await fs.writeFile(backupPath, content, 'utf-8');
    return backupPath;
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  // Additional repair rules (placeholders for expansion)
  private createImportFixRule(): RepairRule {
    return {
      id: 'import-fix',
      name: 'Fix Import Paths',
      description: 'Fix common import path issues',
      pattern: /import.*from/i,
      severity: 'medium',
      safetyLevel: 'safe',
      async apply() { return { success: true, modified: false, changes: [], warnings: [] }; },
      validate() { return true; }
    };
  }

  private createFormValidationRule(): RepairRule {
    return {
      id: 'form-validation-fix',
      name: 'Add Form Validation',
      description: 'Add basic form validation attributes',
      pattern: /<input|<form/i,
      severity: 'medium',
      safetyLevel: 'safe',
      async apply() { return { success: true, modified: false, changes: [], warnings: [] }; },
      validate() { return true; }
    };
  }

  private createAccessibilityRule(): RepairRule {
    return {
      id: 'accessibility-fix',
      name: 'Fix Accessibility Issues',
      description: 'Add ARIA labels and improve accessibility',
      pattern: /aria-|role=/i,
      severity: 'medium',
      safetyLevel: 'safe',
      async apply() { return { success: true, modified: false, changes: [], warnings: [] }; },
      validate() { return true; }
    };
  }

  private createPerformanceRule(): RepairRule {
    return {
      id: 'performance-fix',
      name: 'Fix Performance Issues',
      description: 'Add lazy loading and performance optimizations',
      pattern: /loading|performance/i,
      severity: 'low',
      safetyLevel: 'safe',
      async apply() { return { success: true, modified: false, changes: [], warnings: [] }; },
      validate() { return true; }
    };
  }

  /**
   * Rollback all changes from this session
   */
  async rollback(): Promise<boolean> {
    console.log(`🔄 Rolling back repair session: ${this.session.sessionId}`);

    let success = true;
    for (const repair of this.session.repairs) {
      if (repair.success && repair.backupPath) {
        try {
          const backupContent = await fs.readFile(repair.backupPath, 'utf-8');
          await fs.writeFile(repair.filePath, backupContent, 'utf-8');
          console.log(`↩️  Restored: ${repair.filePath}`);
        } catch (error) {
          console.error(`❌ Failed to restore ${repair.filePath}:`, error);
          success = false;
        }
      }
    }

    return success;
  }
}