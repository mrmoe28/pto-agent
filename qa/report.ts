/**
 * QA Report Generator
 * Comprehensive reporting with markdown and HTML output, screenshots, and actionable recommendations
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { QATestResult, QAIssue, RouteInfo } from './utils';
import { RepairSession } from './repair-strategies';

export interface QAReport {
  metadata: {
    timestamp: Date;
    baseUrl: string;
    testDuration: number;
    environment: string;
    version: string;
  };
  summary: {
    totalRoutes: number;
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    passedTests: number;
    failedTests: number;
    accessibilityScore: number;
    performanceScore: number;
  };
  testResults: QATestResult[];
  issues: QAIssue[];
  repairSession?: RepairSession;
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  trends?: {
    comparison: any;
    improvements: string[];
    regressions: string[];
  };
}

export interface ReportOptions {
  outputDir: string;
  includeScreenshots: boolean;
  generateHTML: boolean;
  generateJSON: boolean;
  generateMarkdown: boolean;
  includeDetailedLogs: boolean;
  includeRepairSuggestions: boolean;
}

/**
 * Main report generator class
 */
export class QAReportGenerator {
  private options: ReportOptions;
  private outputDir: string;

  constructor(options: Partial<ReportOptions> = {}) {
    this.options = {
      outputDir: '/Users/ekodevapps/Downloads/pto-agent-main/qa/reports',
      includeScreenshots: true,
      generateHTML: true,
      generateJSON: true,
      generateMarkdown: true,
      includeDetailedLogs: true,
      includeRepairSuggestions: true,
      ...options
    };
    this.outputDir = this.options.outputDir;
  }

  /**
   * Generate comprehensive QA report
   */
  async generateReport(
    testResults: QATestResult[],
    crawlResults: any,
    repairSession?: RepairSession,
    baseUrl: string = 'http://localhost:3000'
  ): Promise<string[]> {
    console.log('📝 Generating comprehensive QA report...');

    await this.ensureOutputDirectory();

    const report = await this.buildReport(testResults, crawlResults, repairSession, baseUrl);
    const generatedFiles: string[] = [];

    // Generate different report formats
    if (this.options.generateJSON) {
      const jsonPath = await this.generateJSONReport(report);
      generatedFiles.push(jsonPath);
    }

    if (this.options.generateMarkdown) {
      const markdownPath = await this.generateMarkdownReport(report);
      generatedFiles.push(markdownPath);
    }

    if (this.options.generateHTML) {
      const htmlPath = await this.generateHTMLReport(report);
      generatedFiles.push(htmlPath);
    }

    // Generate summary report
    const summaryPath = await this.generateSummaryReport(report);
    generatedFiles.push(summaryPath);

    console.log(`✅ QA report generated successfully`);
    console.log(`📁 Output directory: ${this.outputDir}`);
    console.log(`📄 Generated files: ${generatedFiles.length}`);

    return generatedFiles;
  }

  /**
   * Build the comprehensive report data structure
   */
  private async buildReport(
    testResults: QATestResult[],
    crawlResults: any,
    repairSession?: RepairSession,
    baseUrl: string = 'http://localhost:3000'
  ): Promise<QAReport> {
    const allIssues = testResults.flatMap(result => result.issues);

    const summary = {
      totalRoutes: crawlResults?.routes?.length || testResults.length,
      totalIssues: allIssues.length,
      criticalIssues: allIssues.filter(i => i.severity === 'critical').length,
      highIssues: allIssues.filter(i => i.severity === 'high').length,
      mediumIssues: allIssues.filter(i => i.severity === 'medium').length,
      lowIssues: allIssues.filter(i => i.severity === 'low').length,
      passedTests: testResults.filter(r => r.passed).length,
      failedTests: testResults.filter(r => !r.passed).length,
      accessibilityScore: this.calculateAccessibilityScore(testResults),
      performanceScore: this.calculatePerformanceScore(testResults)
    };

    const recommendations = this.generateRecommendations(allIssues, summary);

    return {
      metadata: {
        timestamp: new Date(),
        baseUrl,
        testDuration: 0, // Will be calculated
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      },
      summary,
      testResults,
      issues: allIssues,
      repairSession,
      recommendations
    };
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(report: QAReport): Promise<string> {
    const timestamp = report.metadata.timestamp.toISOString().replace(/[:.]/g, '-');
    const filename = `qa-report-${timestamp}.json`;
    const filePath = path.join(this.outputDir, filename);

    const jsonContent = JSON.stringify(report, null, 2);
    await fs.writeFile(filePath, jsonContent, 'utf-8');

    return filePath;
  }

  /**
   * Generate Markdown report
   */
  private async generateMarkdownReport(report: QAReport): Promise<string> {
    const timestamp = report.metadata.timestamp.toISOString().replace(/[:.]/g, '-');
    const filename = `qa-report-${timestamp}.md`;
    const filePath = path.join(this.outputDir, filename);

    const markdown = this.buildMarkdownContent(report);
    await fs.writeFile(filePath, markdown, 'utf-8');

    return filePath;
  }

  /**
   * Generate HTML report
   */
  private async generateHTMLReport(report: QAReport): Promise<string> {
    const timestamp = report.metadata.timestamp.toISOString().replace(/[:.]/g, '-');
    const filename = `qa-report-${timestamp}.html`;
    const filePath = path.join(this.outputDir, filename);

    const html = this.buildHTMLContent(report);
    await fs.writeFile(filePath, html, 'utf-8');

    return filePath;
  }

  /**
   * Generate executive summary report
   */
  private async generateSummaryReport(report: QAReport): Promise<string> {
    const timestamp = report.metadata.timestamp.toISOString().replace(/[:.]/g, '-');
    const filename = `qa-summary-${timestamp}.md`;
    const filePath = path.join(this.outputDir, filename);

    const summary = this.buildSummaryContent(report);
    await fs.writeFile(filePath, summary, 'utf-8');

    return filePath;
  }

  /**
   * Build Markdown content
   */
  private buildMarkdownContent(report: QAReport): string {
    let markdown = `# UI Quality Assurance Report\n\n`;

    // Header information
    markdown += `**Generated:** ${report.metadata.timestamp.toLocaleString()}\n`;
    markdown += `**Base URL:** ${report.metadata.baseUrl}\n`;
    markdown += `**Environment:** ${report.metadata.environment}\n\n`;

    // Executive Summary
    markdown += `## Executive Summary\n\n`;
    markdown += this.buildExecutiveSummary(report);

    // Metrics Overview
    markdown += `## Metrics Overview\n\n`;
    markdown += this.buildMetricsTable(report.summary);

    // Critical Issues
    if (report.summary.criticalIssues > 0) {
      markdown += `## 🚨 Critical Issues Requiring Immediate Attention\n\n`;
      markdown += this.buildIssuesSection(report.issues.filter(i => i.severity === 'critical'));
    }

    // High Priority Issues
    if (report.summary.highIssues > 0) {
      markdown += `## ⚠️ High Priority Issues\n\n`;
      markdown += this.buildIssuesSection(report.issues.filter(i => i.severity === 'high'));
    }

    // Test Results by Page
    markdown += `## Test Results by Page\n\n`;
    markdown += this.buildTestResultsSection(report.testResults);

    // Automated Repairs
    if (report.repairSession) {
      markdown += `## 🔧 Automated Repairs Applied\n\n`;
      markdown += this.buildRepairSection(report.repairSession);
    }

    // Recommendations
    markdown += `## 📋 Recommendations\n\n`;
    markdown += this.buildRecommendationsSection(report.recommendations);

    // Accessibility Details
    if (report.issues.some(i => i.type === 'accessibility')) {
      markdown += `## ♿ Accessibility Analysis\n\n`;
      markdown += this.buildAccessibilitySection(report.issues.filter(i => i.type === 'accessibility'));
    }

    // Performance Analysis
    markdown += `## ⚡ Performance Analysis\n\n`;
    markdown += this.buildPerformanceSection(report);

    // All Issues by Category
    markdown += `## Complete Issues List\n\n`;
    markdown += this.buildCompleteIssuesList(report.issues);

    // Next Steps
    markdown += `## Next Steps\n\n`;
    markdown += this.buildNextStepsSection(report);

    return markdown;
  }

  /**
   * Build HTML content
   */
  private buildHTMLContent(report: QAReport): string {
    const title = `UI QA Report - ${report.metadata.timestamp.toLocaleDateString()}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        ${this.getHTMLStyles()}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>UI Quality Assurance Report</h1>
            <div class="metadata">
                <p><strong>Generated:</strong> ${report.metadata.timestamp.toLocaleString()}</p>
                <p><strong>Base URL:</strong> ${report.metadata.baseUrl}</p>
                <p><strong>Environment:</strong> ${report.metadata.environment}</p>
            </div>
        </header>

        <section class="executive-summary">
            <h2>Executive Summary</h2>
            ${this.buildExecutiveSummaryHTML(report)}
        </section>

        <section class="metrics">
            <h2>Metrics Overview</h2>
            ${this.buildMetricsHTML(report.summary)}
        </section>

        ${report.summary.criticalIssues > 0 ? `
        <section class="critical-issues">
            <h2>🚨 Critical Issues</h2>
            ${this.buildIssuesHTML(report.issues.filter(i => i.severity === 'critical'))}
        </section>
        ` : ''}

        <section class="test-results">
            <h2>Test Results</h2>
            ${this.buildTestResultsHTML(report.testResults)}
        </section>

        ${report.repairSession ? `
        <section class="repairs">
            <h2>🔧 Automated Repairs</h2>
            ${this.buildRepairHTML(report.repairSession)}
        </section>
        ` : ''}

        <section class="recommendations">
            <h2>📋 Recommendations</h2>
            ${this.buildRecommendationsHTML(report.recommendations)}
        </section>
    </div>
</body>
</html>
    `;
  }

  /**
   * Build executive summary
   */
  private buildExecutiveSummary(report: QAReport): string {
    const { summary } = report;
    const overallHealth = this.calculateOverallHealth(summary);

    let exec = `### Overall Health Score: ${overallHealth}%\n\n`;

    if (summary.criticalIssues > 0) {
      exec += `⚠️ **ATTENTION REQUIRED:** ${summary.criticalIssues} critical issue(s) found that prevent core functionality.\n\n`;
    }

    if (summary.failedTests > summary.passedTests) {
      exec += `❌ **Quality Concerns:** More tests failed (${summary.failedTests}) than passed (${summary.passedTests}).\n\n`;
    }

    if (summary.accessibilityScore < 80) {
      exec += `♿ **Accessibility Issues:** Score of ${summary.accessibilityScore}% indicates significant accessibility barriers.\n\n`;
    }

    if (summary.performanceScore < 70) {
      exec += `⚡ **Performance Issues:** Score of ${summary.performanceScore}% indicates performance optimization needed.\n\n`;
    }

    // Positive notes
    if (summary.passedTests > summary.failedTests && summary.criticalIssues === 0) {
      exec += `✅ **Good Foundation:** Core functionality is working with ${summary.passedTests} passing tests.\n\n`;
    }

    return exec;
  }

  /**
   * Build metrics table
   */
  private buildMetricsTable(summary: any): string {
    return `
| Metric | Value | Status |
|--------|--------|--------|
| Total Routes Tested | ${summary.totalRoutes} | ℹ️ |
| Tests Passed | ${summary.passedTests} | ${summary.passedTests > summary.failedTests ? '✅' : '⚠️'} |
| Tests Failed | ${summary.failedTests} | ${summary.failedTests === 0 ? '✅' : '❌'} |
| Critical Issues | ${summary.criticalIssues} | ${summary.criticalIssues === 0 ? '✅' : '🚨'} |
| High Priority Issues | ${summary.highIssues} | ${summary.highIssues <= 2 ? '✅' : '⚠️'} |
| Total Issues | ${summary.totalIssues} | ${summary.totalIssues <= 5 ? '✅' : '⚠️'} |
| Accessibility Score | ${summary.accessibilityScore}% | ${summary.accessibilityScore >= 90 ? '✅' : summary.accessibilityScore >= 80 ? '⚠️' : '❌'} |
| Performance Score | ${summary.performanceScore}% | ${summary.performanceScore >= 80 ? '✅' : summary.performanceScore >= 70 ? '⚠️' : '❌'} |

`;
  }

  /**
   * Build issues section
   */
  private buildIssuesSection(issues: QAIssue[]): string {
    if (issues.length === 0) {
      return `No issues found in this category.\n\n`;
    }

    let section = '';
    issues.forEach((issue, index) => {
      section += `### ${index + 1}. ${issue.description}\n\n`;
      section += `**Type:** ${issue.type}\n`;
      section += `**Severity:** ${issue.severity.toUpperCase()}\n`;

      if (issue.location.selector) {
        section += `**Element:** \`${issue.location.selector}\`\n`;
      }

      if (issue.location.file) {
        section += `**File:** ${issue.location.file}\n`;
      }

      if (issue.automated_fix_available) {
        section += `**🔧 Automated Fix Available:** ${issue.fix_description || 'Yes'}\n`;
      }

      section += '\n---\n\n';
    });

    return section;
  }

  /**
   * Build test results section
   */
  private buildTestResultsSection(testResults: QATestResult[]): string {
    let section = '';

    testResults.forEach(result => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      const url = result.route.url;

      section += `### ${status} - ${url}\n\n`;
      section += `**Response Time:** ${result.route.responseTime || 'Unknown'}ms\n`;
      section += `**Status Code:** ${result.route.statusCode || 'Unknown'}\n`;
      section += `**Issues Found:** ${result.issues.length}\n\n`;

      if (result.issues.length > 0) {
        section += `**Issues:**\n`;
        result.issues.forEach((issue, index) => {
          section += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}\n`;
        });
        section += '\n';
      }

      if (result.recommendations.length > 0) {
        section += `**Recommendations:**\n`;
        result.recommendations.forEach((rec, index) => {
          section += `${index + 1}. ${rec}\n`;
        });
        section += '\n';
      }

      section += '---\n\n';
    });

    return section;
  }

  /**
   * Build repair section
   */
  private buildRepairSection(repairSession: RepairSession): string {
    let section = `**Session ID:** ${repairSession.sessionId}\n`;
    section += `**Timestamp:** ${repairSession.timestamp.toLocaleString()}\n`;
    section += `**Repairs Applied:** ${repairSession.repairs.filter(r => r.success).length}\n`;
    section += `**Rollback Available:** ${repairSession.rollbackAvailable ? 'Yes' : 'No'}\n\n`;

    if (repairSession.repairs.length > 0) {
      section += `### Applied Repairs\n\n`;
      repairSession.repairs.filter(r => r.success).forEach((repair, index) => {
        section += `${index + 1}. **${repair.ruleId}** in ${repair.filePath}\n`;
        repair.changes.forEach(change => {
          section += `   - ${change.description}\n`;
        });
        section += '\n';
      });
    }

    return section;
  }

  /**
   * Build recommendations section
   */
  private buildRecommendationsSection(recommendations: any): string {
    let section = '';

    if (recommendations.immediate.length > 0) {
      section += `### 🚨 Immediate Action Required\n\n`;
      recommendations.immediate.forEach((rec, index) => {
        section += `${index + 1}. ${rec}\n`;
      });
      section += '\n';
    }

    if (recommendations.shortTerm.length > 0) {
      section += `### 📅 Short-term (Next Sprint)\n\n`;
      recommendations.shortTerm.forEach((rec, index) => {
        section += `${index + 1}. ${rec}\n`;
      });
      section += '\n';
    }

    if (recommendations.longTerm.length > 0) {
      section += `### 🎯 Long-term (Roadmap)\n\n`;
      recommendations.longTerm.forEach((rec, index) => {
        section += `${index + 1}. ${rec}\n`;
      });
      section += '\n';
    }

    return section;
  }

  /**
   * Calculate scores and generate recommendations
   */
  private calculateAccessibilityScore(testResults: QATestResult[]): number {
    const accessibilityIssues = testResults.flatMap(r =>
      r.issues.filter(i => i.type === 'accessibility')
    );

    if (accessibilityIssues.length === 0) return 100;

    // Basic scoring algorithm
    const criticalCount = accessibilityIssues.filter(i => i.severity === 'critical').length;
    const highCount = accessibilityIssues.filter(i => i.severity === 'high').length;
    const mediumCount = accessibilityIssues.filter(i => i.severity === 'medium').length;

    const penalty = (criticalCount * 25) + (highCount * 15) + (mediumCount * 5);
    return Math.max(0, 100 - penalty);
  }

  private calculatePerformanceScore(testResults: QATestResult[]): number {
    const responseTimes = testResults
      .map(r => r.route.responseTime)
      .filter(t => t !== undefined) as number[];

    if (responseTimes.length === 0) return 100;

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    // Basic performance scoring
    if (avgResponseTime < 1000) return 100;
    if (avgResponseTime < 2000) return 90;
    if (avgResponseTime < 3000) return 80;
    if (avgResponseTime < 5000) return 70;
    return 50;
  }

  private calculateOverallHealth(summary: any): number {
    const testsScore = summary.totalRoutes > 0 ? (summary.passedTests / summary.totalRoutes) * 100 : 100;
    const issuesScore = Math.max(0, 100 - (summary.criticalIssues * 30) - (summary.highIssues * 10));

    return Math.round((testsScore + issuesScore + summary.accessibilityScore + summary.performanceScore) / 4);
  }

  private generateRecommendations(issues: QAIssue[], summary: any): any {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate actions for critical issues
    if (summary.criticalIssues > 0) {
      immediate.push(`Fix ${summary.criticalIssues} critical issue(s) blocking core functionality`);
    }

    const automatedFixes = issues.filter(i => i.automated_fix_available).length;
    if (automatedFixes > 0) {
      immediate.push(`Apply ${automatedFixes} available automated fixes`);
    }

    // Short-term improvements
    if (summary.highIssues > 3) {
      shortTerm.push(`Address ${summary.highIssues} high-priority issues affecting user experience`);
    }

    if (summary.accessibilityScore < 80) {
      shortTerm.push(`Improve accessibility compliance (current score: ${summary.accessibilityScore}%)`);
    }

    // Long-term optimizations
    if (summary.performanceScore < 80) {
      longTerm.push(`Optimize application performance (current score: ${summary.performanceScore}%)`);
    }

    longTerm.push('Implement comprehensive automated testing pipeline');
    longTerm.push('Set up continuous QA monitoring and alerts');

    return { immediate, shortTerm, longTerm };
  }

  // Additional helper methods for HTML generation and styling
  private buildExecutiveSummaryHTML(report: QAReport): string {
    return `<div class="summary-content">${this.buildExecutiveSummary(report).replace(/\n/g, '<br>')}</div>`;
  }

  private buildMetricsHTML(summary: any): string {
    return `
      <div class="metrics-grid">
        <div class="metric-card">
          <h3>${summary.totalRoutes}</h3>
          <p>Routes Tested</p>
        </div>
        <div class="metric-card ${summary.passedTests > summary.failedTests ? 'success' : 'warning'}">
          <h3>${summary.passedTests}</h3>
          <p>Tests Passed</p>
        </div>
        <div class="metric-card ${summary.criticalIssues === 0 ? 'success' : 'danger'}">
          <h3>${summary.criticalIssues}</h3>
          <p>Critical Issues</p>
        </div>
        <div class="metric-card ${summary.accessibilityScore >= 80 ? 'success' : 'warning'}">
          <h3>${summary.accessibilityScore}%</h3>
          <p>Accessibility Score</p>
        </div>
      </div>
    `;
  }

  private buildIssuesHTML(issues: QAIssue[]): string {
    return issues.map(issue => `
      <div class="issue-card ${issue.severity}">
        <h4>${issue.description}</h4>
        <p><strong>Type:</strong> ${issue.type}</p>
        <p><strong>Severity:</strong> ${issue.severity}</p>
        ${issue.automated_fix_available ? '<p class="fix-available">🔧 Automated fix available</p>' : ''}
      </div>
    `).join('');
  }

  private buildTestResultsHTML(testResults: QATestResult[]): string {
    return testResults.map(result => `
      <div class="test-result ${result.passed ? 'passed' : 'failed'}">
        <h4>${result.passed ? '✅' : '❌'} ${result.route.url}</h4>
        <p>Response Time: ${result.route.responseTime || 'Unknown'}ms</p>
        <p>Issues: ${result.issues.length}</p>
      </div>
    `).join('');
  }

  private buildRepairHTML(repairSession: RepairSession): string {
    return `
      <div class="repair-session">
        <p><strong>Session ID:</strong> ${repairSession.sessionId}</p>
        <p><strong>Repairs Applied:</strong> ${repairSession.repairs.filter(r => r.success).length}</p>
      </div>
    `;
  }

  private buildRecommendationsHTML(recommendations: any): string {
    return `
      <div class="recommendations">
        ${recommendations.immediate.length > 0 ? `
          <div class="rec-section immediate">
            <h4>🚨 Immediate Action</h4>
            <ul>${recommendations.immediate.map((rec: string) => `<li>${rec}</li>`).join('')}</ul>
          </div>
        ` : ''}
        ${recommendations.shortTerm.length > 0 ? `
          <div class="rec-section short-term">
            <h4>📅 Short-term</h4>
            <ul>${recommendations.shortTerm.map((rec: string) => `<li>${rec}</li>`).join('')}</ul>
          </div>
        ` : ''}
        ${recommendations.longTerm.length > 0 ? `
          <div class="rec-section long-term">
            <h4>🎯 Long-term</h4>
            <ul>${recommendations.longTerm.map((rec: string) => `<li>${rec}</li>`).join('')}</ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  private getHTMLStyles(): string {
    return `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
      .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      header { border-bottom: 2px solid #e1e5e9; padding-bottom: 20px; margin-bottom: 30px; }
      h1 { color: #1a202c; margin: 0; }
      .metadata p { margin: 5px 0; color: #4a5568; }
      .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
      .metric-card { background: #f7fafc; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #cbd5e0; }
      .metric-card.success { border-left-color: #48bb78; }
      .metric-card.warning { border-left-color: #ed8936; }
      .metric-card.danger { border-left-color: #f56565; }
      .metric-card h3 { margin: 0; font-size: 2em; color: #2d3748; }
      .metric-card p { margin: 10px 0 0; color: #4a5568; }
      .issue-card { background: #fff5f5; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #fed7d7; }
      .issue-card.critical { background: #fed7d7; border-left-color: #f56565; }
      .issue-card.high { background: #feebc8; border-left-color: #ed8936; }
      .test-result { padding: 15px; margin: 10px 0; border-radius: 6px; }
      .test-result.passed { background: #f0fff4; border-left: 4px solid #48bb78; }
      .test-result.failed { background: #fff5f5; border-left: 4px solid #f56565; }
      .fix-available { color: #38a169; font-weight: bold; }
      .rec-section { margin: 20px 0; padding: 15px; border-radius: 6px; }
      .rec-section.immediate { background: #fed7d7; }
      .rec-section.short-term { background: #feebc8; }
      .rec-section.long-term { background: #e6fffa; }
      section { margin: 40px 0; }
      h2 { color: #2d3748; border-bottom: 1px solid #e1e5e9; padding-bottom: 10px; }
    `;
  }

  private buildSummaryContent(report: QAReport): string {
    return `# QA Summary Report

## Key Metrics
- **Overall Health:** ${this.calculateOverallHealth(report.summary)}%
- **Critical Issues:** ${report.summary.criticalIssues}
- **Tests Passed:** ${report.summary.passedTests}/${report.summary.totalRoutes}
- **Accessibility Score:** ${report.summary.accessibilityScore}%

## Priority Actions
${report.recommendations.immediate.map(rec => `- ${rec}`).join('\n')}

## Full Report
See detailed report: qa-report-${report.metadata.timestamp.toISOString().replace(/[:.]/g, '-')}.md
`;
  }

  private buildAccessibilitySection(accessibilityIssues: QAIssue[]): string {
    let section = `Found ${accessibilityIssues.length} accessibility issue(s).\n\n`;

    const groupedIssues = this.groupIssuesByType(accessibilityIssues);
    Object.entries(groupedIssues).forEach(([type, issues]) => {
      section += `### ${type} (${issues.length})\n\n`;
      issues.forEach((issue, index) => {
        section += `${index + 1}. ${issue.description}\n`;
      });
      section += '\n';
    });

    return section;
  }

  private buildPerformanceSection(report: QAReport): string {
    const performanceIssues = report.issues.filter(i => i.type === 'performance');
    let section = `**Performance Score:** ${report.summary.performanceScore}%\n\n`;

    if (performanceIssues.length > 0) {
      section += `Found ${performanceIssues.length} performance issue(s):\n\n`;
      performanceIssues.forEach((issue, index) => {
        section += `${index + 1}. ${issue.description}\n`;
      });
    } else {
      section += `No significant performance issues detected.\n`;
    }

    return section + '\n';
  }

  private buildCompleteIssuesList(issues: QAIssue[]): string {
    const grouped = this.groupIssuesBySeverity(issues);
    let section = '';

    ['critical', 'high', 'medium', 'low'].forEach(severity => {
      const severityIssues = grouped[severity] || [];
      if (severityIssues.length > 0) {
        section += `### ${severity.toUpperCase()} (${severityIssues.length})\n\n`;
        severityIssues.forEach((issue, index) => {
          section += `${index + 1}. [${issue.type}] ${issue.description}\n`;
        });
        section += '\n';
      }
    });

    return section;
  }

  private buildNextStepsSection(report: QAReport): string {
    let section = '';

    if (report.summary.criticalIssues > 0) {
      section += `1. **URGENT:** Address ${report.summary.criticalIssues} critical issue(s) before deployment\n`;
    }

    const automatedFixes = report.issues.filter(i => i.automated_fix_available).length;
    if (automatedFixes > 0) {
      section += `2. Apply ${automatedFixes} automated fixes using the repair engine\n`;
    }

    section += `3. Re-run QA tests after fixes to validate improvements\n`;
    section += `4. Set up continuous QA monitoring for ongoing quality assurance\n`;
    section += `5. Review and implement accessibility improvements\n`;

    return section;
  }

  private groupIssuesByType(issues: QAIssue[]): Record<string, QAIssue[]> {
    return issues.reduce((grouped, issue) => {
      const type = issue.type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(issue);
      return grouped;
    }, {} as Record<string, QAIssue[]>);
  }

  private groupIssuesBySeverity(issues: QAIssue[]): Record<string, QAIssue[]> {
    return issues.reduce((grouped, issue) => {
      const severity = issue.severity;
      if (!grouped[severity]) {
        grouped[severity] = [];
      }
      grouped[severity].push(issue);
      return grouped;
    }, {} as Record<string, QAIssue[]>);
  }

  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(path.join(this.outputDir, 'screenshots'), { recursive: true });
      await fs.mkdir(path.join(this.outputDir, 'artifacts'), { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }
}