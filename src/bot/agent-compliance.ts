#!/usr/bin/env tsx
/**
 * OSSA Compliance Bot
 *
 * Validates agent manifests against OSSA specification
 * Provides comprehensive compliance checking and reporting
 *
 * Refs: #283
 */

import { ValidationService } from '../services/validation.service.js';
import { readFileSync, existsSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import type { ValidationResult } from '../types/index.js';
import type { ErrorObject } from 'ajv';

interface ComplianceCheckOptions {
  manifestPath: string;
  ossaVersion?: string;
  checkLevel?: 'basic' | 'standard' | 'enterprise';
  format?: 'json' | 'markdown' | 'html';
}

interface ComplianceReport {
  manifestPath: string;
  compliant: boolean;
  ossaVersion: string;
  validationResult: ValidationResult;
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    field: string;
    message: string;
    fixable: boolean;
  }>;
  recommendations: string[];
  timestamp: string;
}

export class OSSAComplianceBot {
  private validationService: ValidationService;

  constructor(validationService: ValidationService) {
    this.validationService = validationService;
  }

  /**
   * Validate single agent manifest
   */
  async validateManifest(
    options: ComplianceCheckOptions
  ): Promise<ComplianceReport> {
    const { manifestPath, ossaVersion, checkLevel = 'standard' } = options;

    if (!existsSync(manifestPath)) {
      throw new Error(`Manifest not found: ${manifestPath}`);
    }

    const manifestContent = readFileSync(manifestPath, 'utf-8');
    const manifest = parseYaml(manifestContent);

    const validationResult = await this.validationService.validate(
      manifest,
      ossaVersion
    );

    const issues = this.categorizeIssues(validationResult, checkLevel);
    const recommendations = this.generateRecommendations(
      validationResult,
      checkLevel
    );

    return {
      manifestPath,
      compliant:
        validationResult.valid &&
        issues.filter((i) => i.severity === 'error').length === 0,
      ossaVersion: ossaVersion || this.detectOSSAVersion(manifest),
      validationResult,
      issues,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate multiple manifests in batch
   */
  async validateBatch(
    manifestPaths: string[],
    ossaVersion?: string
  ): Promise<ComplianceReport[]> {
    const results: ComplianceReport[] = [];

    for (const path of manifestPaths) {
      try {
        const report = await this.validateManifest({
          manifestPath: path,
          ossaVersion,
        });
        results.push(report);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        results.push({
          manifestPath: path,
          compliant: false,
          ossaVersion: ossaVersion || 'unknown',
          validationResult: {
            valid: false,
            errors: [
              {
                message: `Failed to validate: ${errorMessage}`,
                instancePath: '',
              } as ErrorObject,
            ],
            warnings: [],
          },
          issues: [
            {
              severity: 'error',
              field: 'validation',
              message: `Validation failed: ${errorMessage}`,
              fixable: false,
            },
          ],
          recommendations: [],
          timestamp: new Date().toISOString(),
        });
      }
    }

    return results;
  }

  /**
   * Generate compliance report in specified format
   */
  generateReport(
    report: ComplianceReport,
    format: 'json' | 'markdown' | 'html' = 'markdown'
  ): string {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'html':
        return this.generateHTMLReport(report);
      case 'markdown':
      default:
        return this.generateMarkdownReport(report);
    }
  }

  private categorizeIssues(
    result: ValidationResult,
    checkLevel: 'basic' | 'standard' | 'enterprise'
  ): ComplianceReport['issues'] {
    const issues: ComplianceReport['issues'] = [];

    result.errors.forEach((error: ErrorObject) => {
      issues.push({
        severity: 'error',
        field: error.instancePath || 'unknown',
        message: error.message || 'Validation error',
        fixable: this.isFixable(error),
      });
    });

    if (checkLevel === 'standard' || checkLevel === 'enterprise') {
      // Warnings are strings in ValidationResult, not ErrorObjects
      result.warnings.forEach((warning) => {
        issues.push({
          severity: 'warning',
          field: 'unknown',
          message: warning,
          fixable: false,
        });
      });
    }

    return issues;
  }

  private generateRecommendations(
    result: ValidationResult,
    checkLevel: 'basic' | 'standard' | 'enterprise'
  ): string[] {
    const recommendations: string[] = [];

    if (result.errors.length > 0) {
      recommendations.push('Fix all validation errors to achieve compliance');
    }

    if (checkLevel === 'enterprise' && result.warnings.length > 0) {
      recommendations.push('Address warnings for enterprise-grade compliance');
    }

    return recommendations;
  }

  private detectOSSAVersion(manifest: Record<string, unknown>): string {
    if (manifest.apiVersion && typeof manifest.apiVersion === 'string') {
      const match = manifest.apiVersion.match(/^ossa\/v(.+)$/);
      if (match) return match[1];
    }
    return '0.3.0';
  }

  private isFixable(error: { message?: string }): boolean {
    const fixablePatterns = [
      /missing required field/i,
      /invalid format/i,
      /must be one of/i,
    ];
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : String(error);
    return fixablePatterns.some((pattern) => pattern.test(message));
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  private generateMarkdownReport(report: ComplianceReport): string {
    const status = report.compliant
      ? '[PASS] COMPLIANT'
      : '[FAIL] NON-COMPLIANT';

    return `# OSSA Compliance Report

**Status**: ${status}
**Manifest**: ${report.manifestPath}
**OSSA Version**: ${report.ossaVersion}
**Timestamp**: ${report.timestamp}

## Issues

${report.issues.length === 0 ? 'No issues found.' : ''}
${report.issues
  .map(
    (issue) => `
### ${issue.severity.toUpperCase()}: ${issue.field}
- **Message**: ${issue.message}
- **Fixable**: ${issue.fixable ? 'Yes' : 'No'}
`
  )
  .join('\n')}

## Recommendations

${report.recommendations.length === 0 ? 'No recommendations.' : ''}
${report.recommendations.map((rec) => `- ${rec}`).join('\n')}
`;
  }

  private generateHTMLReport(report: ComplianceReport): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>OSSA Compliance Report</title>
  <style>
    body { font-family: sans-serif; margin: 20px; }
    .compliant { color: green; }
    .non-compliant { color: red; }
    .error { background: #fee; padding: 10px; margin: 5px 0; }
    .warning { background: #ffe; padding: 10px; margin: 5px 0; }
  </style>
</head>
<body>
  <h1>OSSA Compliance Report</h1>
  <p class="${report.compliant ? 'compliant' : 'non-compliant'}">
    Status: ${report.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
  </p>
  <p><strong>Manifest:</strong> ${this.escapeHtml(report.manifestPath)}</p>
  <p><strong>OSSA Version:</strong> ${report.ossaVersion}</p>
  <h2>Issues</h2>
  ${report.issues
    .map(
      (issue) => `
    <div class="${issue.severity}">
      <strong>${issue.severity.toUpperCase()}</strong>: ${issue.field}<br>
      ${this.escapeHtml(issue.message)}
    </div>
  `
    )
    .join('')}
</body>
</html>`;
  }
}
