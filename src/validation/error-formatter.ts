/**
 * OSSA Error Formatter
 *
 * Formats validation errors with error codes and remediation steps
 * for human-readable output and programmatic handling.
 */

import { ErrorDetails, getErrorDetails, OSSAErrorCode } from './error-codes';

export interface FormattedError {
  code: OSSAErrorCode;
  severity: 'error' | 'warning' | 'info';
  path: string;
  message: string;
  remediation: string;
  docsUrl: string;
  raw?: unknown;
}

export interface ErrorReport {
  valid: boolean;
  errors: FormattedError[];
  warnings: FormattedError[];
  info: FormattedError[];
  summary: {
    total: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
}

/**
 * Map Ajv error to OSSA error code
 */
export function mapAjvErrorToOSSACode(ajvError: {
  keyword?: string;
  instancePath?: string;
  message?: string;
  params?: Record<string, unknown>;
  schemaPath?: string;
}): OSSAErrorCode {
  const { keyword, instancePath, params } = ajvError;
  const path = instancePath || '';

  // Schema validation errors (001-099)
  if (keyword === 'required') {
    return OSSAErrorCode.OSSA_001;
  }
  if (keyword === 'type') {
    return OSSAErrorCode.OSSA_002;
  }
  if (keyword === 'pattern') {
    if (path.includes('apiVersion')) return OSSAErrorCode.OSSA_003;
    if (path.includes('did')) return OSSAErrorCode.OSSA_101;
    if (path.includes('capability')) return OSSAErrorCode.OSSA_503;
    if (path.includes('name')) return OSSAErrorCode.OSSA_800;
    return OSSAErrorCode.OSSA_008;
  }
  if (keyword === 'enum') {
    if (path.includes('kind')) return OSSAErrorCode.OSSA_004;
    if (path.includes('domain')) return OSSAErrorCode.OSSA_501;
    if (path.includes('tier')) return OSSAErrorCode.OSSA_600;
    if (path.includes('lifecycle_stages/current_stage'))
      return OSSAErrorCode.OSSA_300;
    if (path.includes('visibility')) return OSSAErrorCode.OSSA_901;
    return OSSAErrorCode.OSSA_007;
  }
  if (keyword === 'uniqueItems') {
    return OSSAErrorCode.OSSA_010;
  }
  if (keyword === 'minimum' || keyword === 'maximum') {
    if (path.includes('fitness/score')) return OSSAErrorCode.OSSA_203;
    if (path.includes('generation')) return OSSAErrorCode.OSSA_200;
    if (path.includes('wallet/balance')) return OSSAErrorCode.OSSA_400;
    return OSSAErrorCode.OSSA_014;
  }
  if (keyword === 'minLength' || keyword === 'maxLength') {
    if (path.includes('name') && params?.limit === 253)
      return OSSAErrorCode.OSSA_801;
    return OSSAErrorCode.OSSA_015;
  }
  if (keyword === 'additionalProperties') {
    return OSSAErrorCode.OSSA_013;
  }
  if (keyword === 'format') {
    if (params?.format === 'uri') return OSSAErrorCode.OSSA_803;
    if (params?.format === 'email') return OSSAErrorCode.OSSA_804;
    if (params?.format === 'date-time') return OSSAErrorCode.OSSA_805;
    return OSSAErrorCode.OSSA_008;
  }

  // Default to general schema error
  return OSSAErrorCode.OSSA_002;
}

/**
 * Map linter error ID to OSSA code
 */
export function mapLinterErrorToOSSACode(linterId: string): OSSAErrorCode {
  const linterMap: Record<string, OSSAErrorCode> = {
    // Taxonomy
    'taxonomy-missing': OSSAErrorCode.OSSA_506,
    'taxonomy-invalid-domain': OSSAErrorCode.OSSA_501,
    'taxonomy-invalid-subdomain': OSSAErrorCode.OSSA_502,
    'taxonomy-invalid-concern': OSSAErrorCode.OSSA_504,
    'type-domain-mismatch': OSSAErrorCode.OSSA_505,

    // Genetics
    'genetics-requires-did': OSSAErrorCode.OSSA_102,
    'genetics-missing-parents': OSSAErrorCode.OSSA_201,

    // Economics
    'economics-requires-did': OSSAErrorCode.OSSA_103,
    'marketplace-requires-wallet': OSSAErrorCode.OSSA_401,
    'retired-agent-marketplace': OSSAErrorCode.OSSA_407,
    'offering-invalid-price': OSSAErrorCode.OSSA_402,
    'wallet-negative-balance': OSSAErrorCode.OSSA_400,

    // Lifecycle
    'senior-no-promotions': OSSAErrorCode.OSSA_307,
    'retirement-no-legacy': OSSAErrorCode.OSSA_302,

    // Naming
    'name-invalid-format': OSSAErrorCode.OSSA_800,
    'name-too-long': OSSAErrorCode.OSSA_801,

    // Catalog
    'published-missing-docs': OSSAErrorCode.OSSA_900,
    'public-no-ratings': OSSAErrorCode.OSSA_902,

    // File errors
    'file-read-error': OSSAErrorCode.OSSA_011,
  };

  return linterMap[linterId] || OSSAErrorCode.OSSA_002;
}

/**
 * Format a single error with code and remediation
 */
export function formatError(
  code: OSSAErrorCode,
  path: string,
  customMessage?: string,
  rawError?: unknown
): FormattedError {
  const details = getErrorDetails(code);

  if (!details) {
    return {
      code,
      severity: 'error',
      path,
      message: customMessage || 'Unknown validation error',
      remediation: 'Check OSSA documentation for guidance',
      docsUrl: 'https://openstandardagents.org/docs/errors',
      raw: rawError,
    };
  }

  return {
    code: details.code,
    severity: details.severity,
    path,
    message: customMessage || details.message,
    remediation: details.remediation,
    docsUrl: details.docsUrl,
    raw: rawError,
  };
}

/**
 * Format Ajv validation errors
 */
export function formatAjvErrors(
  ajvErrors: Array<{
    keyword?: string;
    instancePath?: string;
    message?: string;
    params?: Record<string, unknown>;
    schemaPath?: string;
  }>
): FormattedError[] {
  return ajvErrors.map((err) => {
    const code = mapAjvErrorToOSSACode(err);
    const path = err.instancePath || '/';
    const message = err.message || 'Validation error';

    return formatError(code, path, message, err);
  });
}

/**
 * Create error report from formatted errors
 */
export function createErrorReport(
  formattedErrors: FormattedError[]
): ErrorReport {
  const errors = formattedErrors.filter((e) => e.severity === 'error');
  const warnings = formattedErrors.filter((e) => e.severity === 'warning');
  const info = formattedErrors.filter((e) => e.severity === 'info');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
    summary: {
      total: formattedErrors.length,
      errorCount: errors.length,
      warningCount: warnings.length,
      infoCount: info.length,
    },
  };
}

/**
 * Format error report as human-readable string
 */
export function formatErrorReport(
  report: ErrorReport,
  options: {
    showRemediations?: boolean;
    showDocsUrls?: boolean;
    colorize?: boolean;
  } = {}
): string {
  const {
    showRemediations = true,
    showDocsUrls = true,
    colorize = false,
  } = options;

  const lines: string[] = [];

  // Summary
  if (report.valid) {
    lines.push(
      colorize
        ? '\x1b[32m✅ Valid OSSA manifest\x1b[0m'
        : '✅ Valid OSSA manifest'
    );
  } else {
    lines.push(
      colorize
        ? '\x1b[31m❌ Invalid OSSA manifest\x1b[0m'
        : '❌ Invalid OSSA manifest'
    );
  }

  lines.push('');
  lines.push(`Summary: ${report.summary.total} issues found`);
  lines.push(`  Errors: ${report.summary.errorCount}`);
  lines.push(`  Warnings: ${report.summary.warningCount}`);
  lines.push(`  Info: ${report.summary.infoCount}`);

  // Errors
  if (report.errors.length > 0) {
    lines.push('');
    lines.push(colorize ? '\x1b[31m🔴 Errors:\x1b[0m' : '🔴 Errors:');
    report.errors.forEach((error) => {
      lines.push(`  [${error.code}] ${error.path}: ${error.message}`);
      if (showRemediations) {
        lines.push(`      → ${error.remediation}`);
      }
      if (showDocsUrls) {
        lines.push(`      📚 ${error.docsUrl}`);
      }
    });
  }

  // Warnings
  if (report.warnings.length > 0) {
    lines.push('');
    lines.push(colorize ? '\x1b[33m⚠️  Warnings:\x1b[0m' : '⚠️  Warnings:');
    report.warnings.forEach((warning) => {
      lines.push(`  [${warning.code}] ${warning.path}: ${warning.message}`);
      if (showRemediations) {
        lines.push(`      → ${warning.remediation}`);
      }
      if (showDocsUrls) {
        lines.push(`      📚 ${warning.docsUrl}`);
      }
    });
  }

  // Info
  if (report.info.length > 0) {
    lines.push('');
    lines.push(colorize ? '\x1b[36mℹ️  Info:\x1b[0m' : 'ℹ️  Info:');
    report.info.forEach((infoItem) => {
      lines.push(`  [${infoItem.code}] ${infoItem.path}: ${infoItem.message}`);
      if (showRemediations) {
        lines.push(`      → ${infoItem.remediation}`);
      }
      if (showDocsUrls) {
        lines.push(`      📚 ${infoItem.docsUrl}`);
      }
    });
  }

  return lines.join('\n');
}

/**
 * Format error report as JSON
 */
export function formatErrorReportJSON(
  report: ErrorReport,
  pretty = true
): string {
  return JSON.stringify(report, null, pretty ? 2 : 0);
}

/**
 * Format error report as markdown
 */
export function formatErrorReportMarkdown(report: ErrorReport): string {
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
    report.errors.forEach((error) => {
      lines.push(`### ${error.code}\n`);
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
    report.warnings.forEach((warning) => {
      lines.push(`### ${warning.code}\n`);
      lines.push(`**Path**: \`${warning.path}\`\n`);
      lines.push(`**Message**: ${warning.message}\n`);
      lines.push(`**Remediation**: ${warning.remediation}\n`);
      lines.push(`**Documentation**: [${warning.code}](${warning.docsUrl})\n`);
      lines.push('---\n');
    });
  }

  // Info
  if (report.info.length > 0) {
    lines.push('## ℹ️ Info\n');
    report.info.forEach((infoItem) => {
      lines.push(`### ${infoItem.code}\n`);
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
 * Format error report as HTML
 */
export function formatErrorReportHTML(report: ErrorReport): string {
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
    'body { font-family: system-ui, -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; }'
  );
  lines.push(
    '.summary { background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }'
  );
  lines.push(
    '.error { border-left: 4px solid #e53e3e; padding: 1rem; margin: 1rem 0; background: #fff5f5; }'
  );
  lines.push(
    '.warning { border-left: 4px solid #dd6b20; padding: 1rem; margin: 1rem 0; background: #fffaf0; }'
  );
  lines.push(
    '.info { border-left: 4px solid #3182ce; padding: 1rem; margin: 1rem 0; background: #ebf8ff; }'
  );
  lines.push(
    '.code { font-family: monospace; background: #2d3748; color: #fff; padding: 0.25rem 0.5rem; border-radius: 4px; }'
  );
  lines.push('.path { font-family: monospace; color: #4a5568; }');
  lines.push('.remediation { margin-top: 0.5rem; font-style: italic; }');
  lines.push('</style>');
  lines.push('</head>');
  lines.push('<body>');

  // Title
  if (report.valid) {
    lines.push('<h1>✅ Valid OSSA Manifest</h1>');
  } else {
    lines.push('<h1>❌ Invalid OSSA Manifest</h1>');
  }

  // Summary
  lines.push('<div class="summary">');
  lines.push('<h2>Summary</h2>');
  lines.push(`<p><strong>Total Issues:</strong> ${report.summary.total}</p>`);
  lines.push(`<p><strong>Errors:</strong> ${report.summary.errorCount}</p>`);
  lines.push(
    `<p><strong>Warnings:</strong> ${report.summary.warningCount}</p>`
  );
  lines.push(`<p><strong>Info:</strong> ${report.summary.infoCount}</p>`);
  lines.push('</div>');

  // Errors
  if (report.errors.length > 0) {
    lines.push('<h2>🔴 Errors</h2>');
    report.errors.forEach((error) => {
      lines.push('<div class="error">');
      lines.push(
        `<p><span class="code">${error.code}</span> <span class="path">${error.path}</span></p>`
      );
      lines.push(`<p><strong>Message:</strong> ${error.message}</p>`);
      lines.push(
        `<p class="remediation"><strong>Remediation:</strong> ${error.remediation}</p>`
      );
      lines.push(
        `<p><a href="${error.docsUrl}" target="_blank">📚 Documentation</a></p>`
      );
      lines.push('</div>');
    });
  }

  // Warnings
  if (report.warnings.length > 0) {
    lines.push('<h2>⚠️ Warnings</h2>');
    report.warnings.forEach((warning) => {
      lines.push('<div class="warning">');
      lines.push(
        `<p><span class="code">${warning.code}</span> <span class="path">${warning.path}</span></p>`
      );
      lines.push(`<p><strong>Message:</strong> ${warning.message}</p>`);
      lines.push(
        `<p class="remediation"><strong>Remediation:</strong> ${warning.remediation}</p>`
      );
      lines.push(
        `<p><a href="${warning.docsUrl}" target="_blank">📚 Documentation</a></p>`
      );
      lines.push('</div>');
    });
  }

  // Info
  if (report.info.length > 0) {
    lines.push('<h2>ℹ️ Info</h2>');
    report.info.forEach((infoItem) => {
      lines.push('<div class="info">');
      lines.push(
        `<p><span class="code">${infoItem.code}</span> <span class="path">${infoItem.path}</span></p>`
      );
      lines.push(`<p><strong>Message:</strong> ${infoItem.message}</p>`);
      lines.push(
        `<p class="remediation"><strong>Remediation:</strong> ${infoItem.remediation}</p>`
      );
      lines.push(
        `<p><a href="${infoItem.docsUrl}" target="_blank">📚 Documentation</a></p>`
      );
      lines.push('</div>');
    });
  }

  lines.push('</body>');
  lines.push('</html>');

  return lines.join('\n');
}
