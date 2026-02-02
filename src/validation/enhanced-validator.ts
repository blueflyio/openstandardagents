import * as fs from 'fs';

/**
 * Enhanced OSSA Validator with Error Codes
 *
 * Integrates error codes, formatting, and remediation steps
 * into validation results for better debugging experience.
 */

import {
  OSSAValidator,
  ValidationResult as BaseValidationResult,
} from './validator';
import { OSSALinter, LintResult } from './linter';
import {
  formatAjvErrors,
  formatError,
  createErrorReport,
  formatErrorReport,
  ErrorReport,
  FormattedError,
  mapLinterErrorToOSSACode,
} from './error-formatter';
import { OSSAErrorCode } from './error-codes';

export interface EnhancedValidationResult {
  valid: boolean;
  report: ErrorReport;
  formatted: {
    text: string;
    json: string;
    markdown: string;
    html: string;
  };
}

/**
 * Enhanced validator with error codes and formatting
 */
export class EnhancedOSSAValidator {
  private validator: OSSAValidator;
  private linter: OSSALinter;

  constructor(schemaPath?: string, taxonomyPath?: string) {
    this.validator = new OSSAValidator(schemaPath);
    this.linter = new OSSALinter(taxonomyPath);
  }

  /**
   * Validate manifest with enhanced error reporting
   */
  validate(manifest: Record<string, unknown>): EnhancedValidationResult {
    // Run schema validation
    const schemaResult = this.validator.validate(manifest);

    // Run linter
    const lintResult = this.linter.lint(manifest);

    // Combine all errors
    const allErrors: FormattedError[] = [];

    // Add schema validation errors
    if (schemaResult.errors) {
      // Convert Ajv errors to FormattedError
      // @ts-expect-error - Ajv v8 API compatibility
      const ajvErrors = this.validator.ajvInstance.errors || [];
      allErrors.push(...formatAjvErrors(ajvErrors));
    }

    // Add linter errors
    if (lintResult.rules) {
      lintResult.rules.forEach((rule) => {
        const code = mapLinterErrorToOSSACode(rule.id);
        const severity = rule.level;

        allErrors.push({
          code,
          severity,
          path: '/', // Linter doesn't provide path
          message: rule.message,
          remediation: rule.suggestion || 'See documentation for guidance',
          docsUrl: `https://openstandardagents.org/docs/errors/${code.toLowerCase()}`,
        });
      });
    }

    // Create error report
    const report = createErrorReport(allErrors);

    // Format in multiple formats
    const formatted = {
      text: formatErrorReport(report, {
        showRemediations: true,
        showDocsUrls: true,
      }),
      json: JSON.stringify(report, null, 2),
      markdown: this.formatMarkdown(report),
      html: this.formatHTML(report),
    };

    return {
      valid: report.valid,
      report,
      formatted,
    };
  }

  /**
   * Validate from file path
   */
  validateFile(filePath: string): EnhancedValidationResult {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const manifest = JSON.parse(content);
      return this.validate(manifest);
    } catch (error) {
      const formattedError = formatError(
        OSSAErrorCode.OSSA_011,
        filePath,
        `Failed to read or parse file: ${error}`,
        error
      );

      const report = createErrorReport([formattedError]);

      return {
        valid: false,
        report,
        formatted: {
          text: formatErrorReport(report),
          json: JSON.stringify(report, null, 2),
          markdown: this.formatMarkdown(report),
          html: this.formatHTML(report),
        },
      };
    }
  }

  /**
   * Format as markdown
   */
  private formatMarkdown(report: ErrorReport): string {
    const lines: string[] = [];

    // Title
    if (report.valid) {
      lines.push('# ✅ Valid OSSA Manifest\n');
    } else {
      lines.push('# ❌ Invalid OSSA Manifest\n');
    }

    // Summary
    lines.push('## Summary\n');
    lines.push(`- **Total Issues**: ${report.summary.total}`);
    lines.push(`- **Errors**: ${report.summary.errorCount}`);
    lines.push(`- **Warnings**: ${report.summary.warningCount}`);
    lines.push(`- **Info**: ${report.summary.infoCount}`);
    lines.push('');

    // Errors
    if (report.errors.length > 0) {
      lines.push('## 🔴 Errors\n');
      report.errors.forEach((error, index) => {
        lines.push(`### ${index + 1}. ${error.code}\n`);
        lines.push(`**Path**: \`${error.path}\`\n`);
        lines.push(`**Message**: ${error.message}\n`);
        lines.push(`**Remediation**: ${error.remediation}\n`);
        lines.push(`**Documentation**: [${error.code}](${error.docsUrl})\n`);
        lines.push('---\n');
      });
    }

    // Warnings
    if (report.warnings.length > 0) {
      lines.push('## ⚠️ Warnings\n');
      report.warnings.forEach((warning, index) => {
        lines.push(`### ${index + 1}. ${warning.code}\n`);
        lines.push(`**Path**: \`${warning.path}\`\n`);
        lines.push(`**Message**: ${warning.message}\n`);
        lines.push(`**Remediation**: ${warning.remediation}\n`);
        lines.push(
          `**Documentation**: [${warning.code}](${warning.docsUrl})\n`
        );
        lines.push('---\n');
      });
    }

    // Info
    if (report.info.length > 0) {
      lines.push('## ℹ️ Info\n');
      report.info.forEach((infoItem, index) => {
        lines.push(`### ${index + 1}. ${infoItem.code}\n`);
        lines.push(`**Path**: \`${infoItem.path}\`\n`);
        lines.push(`**Message**: ${infoItem.message}\n`);
        lines.push(`**Remediation**: ${infoItem.remediation}\n`);
        lines.push(
          `**Documentation**: [${infoItem.code}](${infoItem.docsUrl})\n`
        );
        lines.push('---\n');
      });
    }

    return lines.join('\n');
  }

  /**
   * Format as HTML
   */
  private formatHTML(report: ErrorReport): string {
    const lines: string[] = [];

    lines.push('<!DOCTYPE html>');
    lines.push('<html lang="en">');
    lines.push('<head>');
    lines.push('<meta charset="UTF-8">');
    lines.push(
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    );
    lines.push('<title>OSSA Validation Report</title>');
    lines.push('<style>');
    lines.push(
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; background: #f8f9fa; }'
    );
    lines.push(
      '.header { background: white; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }'
    );
    lines.push(
      '.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem; }'
    );
    lines.push(
      '.summary-card { background: #f8f9fa; padding: 1rem; border-radius: 4px; text-align: center; }'
    );
    lines.push(
      '.summary-card strong { display: block; font-size: 2rem; margin-bottom: 0.5rem; }'
    );
    lines.push(
      '.error { border-left: 4px solid #dc3545; padding: 1.5rem; margin: 1rem 0; background: white; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }'
    );
    lines.push(
      '.warning { border-left: 4px solid #fd7e14; padding: 1.5rem; margin: 1rem 0; background: white; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }'
    );
    lines.push(
      '.info { border-left: 4px solid #0d6efd; padding: 1.5rem; margin: 1rem 0; background: white; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }'
    );
    lines.push(
      '.code { font-family: "SF Mono", Monaco, monospace; background: #2d3748; color: #fff; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.9rem; }'
    );
    lines.push(
      '.path { font-family: "SF Mono", Monaco, monospace; color: #6c757d; background: #f8f9fa; padding: 0.25rem 0.5rem; border-radius: 4px; }'
    );
    lines.push(
      '.remediation { margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px; }'
    );
    lines.push('.remediation strong { color: #0d6efd; }');
    lines.push('a { color: #0d6efd; text-decoration: none; }');
    lines.push('a:hover { text-decoration: underline; }');
    lines.push('h2 { margin-top: 2rem; }');
    lines.push('</style>');
    lines.push('</head>');
    lines.push('<body>');

    // Header
    lines.push('<div class="header">');
    if (report.valid) {
      lines.push('<h1>✅ Valid OSSA Manifest</h1>');
    } else {
      lines.push('<h1>❌ Invalid OSSA Manifest</h1>');
    }

    // Summary cards
    lines.push('<div class="summary">');
    lines.push(
      `<div class="summary-card"><strong>${report.summary.total}</strong><span>Total Issues</span></div>`
    );
    lines.push(
      `<div class="summary-card"><strong>${report.summary.errorCount}</strong><span>Errors</span></div>`
    );
    lines.push(
      `<div class="summary-card"><strong>${report.summary.warningCount}</strong><span>Warnings</span></div>`
    );
    lines.push(
      `<div class="summary-card"><strong>${report.summary.infoCount}</strong><span>Info</span></div>`
    );
    lines.push('</div>');
    lines.push('</div>');

    // Errors
    if (report.errors.length > 0) {
      lines.push('<h2>🔴 Errors</h2>');
      report.errors.forEach((error, index) => {
        lines.push('<div class="error">');
        lines.push(
          `<h3>${index + 1}. <span class="code">${error.code}</span> <span class="path">${error.path}</span></h3>`
        );
        lines.push(`<p><strong>Message:</strong> ${error.message}</p>`);
        lines.push(
          `<div class="remediation"><strong>Remediation:</strong> ${error.remediation}</div>`
        );
        lines.push(
          `<p><a href="${error.docsUrl}" target="_blank">📚 View Documentation</a></p>`
        );
        lines.push('</div>');
      });
    }

    // Warnings
    if (report.warnings.length > 0) {
      lines.push('<h2>⚠️ Warnings</h2>');
      report.warnings.forEach((warning, index) => {
        lines.push('<div class="warning">');
        lines.push(
          `<h3>${index + 1}. <span class="code">${warning.code}</span> <span class="path">${warning.path}</span></h3>`
        );
        lines.push(`<p><strong>Message:</strong> ${warning.message}</p>`);
        lines.push(
          `<div class="remediation"><strong>Remediation:</strong> ${warning.remediation}</div>`
        );
        lines.push(
          `<p><a href="${warning.docsUrl}" target="_blank">📚 View Documentation</a></p>`
        );
        lines.push('</div>');
      });
    }

    // Info
    if (report.info.length > 0) {
      lines.push('<h2>ℹ️ Info</h2>');
      report.info.forEach((infoItem, index) => {
        lines.push('<div class="info">');
        lines.push(
          `<h3>${index + 1}. <span class="code">${infoItem.code}</span> <span class="path">${infoItem.path}</span></h3>`
        );
        lines.push(`<p><strong>Message:</strong> ${infoItem.message}</p>`);
        lines.push(
          `<div class="remediation"><strong>Remediation:</strong> ${infoItem.remediation}</div>`
        );
        lines.push(
          `<p><a href="${infoItem.docsUrl}" target="_blank">📚 View Documentation</a></p>`
        );
        lines.push('</div>');
      });
    }

    lines.push('</body>');
    lines.push('</html>');

    return lines.join('\n');
  }
}

// Export for convenience
export * from './error-codes';
export * from './error-formatter';
