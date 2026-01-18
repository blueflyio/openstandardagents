/**
 * Migration Reporter Utility
 * Generates and formats migration reports
 *
 * Features:
 * - Console output with color coding
 * - JSON export for CI integration
 * - Summary statistics
 * - Detailed error reporting
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles report generation and formatting
 * - Open/Closed: Extensible via report types without modifying core logic
 */

import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { DiscoveredManifest } from './manifest-discovery.js';

// ============================================================================
// Types
// ============================================================================

export interface MigrationReport {
  /** Summary statistics */
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
    duration: number; // seconds
  };
  /** Report metadata */
  metadata: {
    targetVersion: string;
    directory: string;
    timestamp: string;
    dryRun: boolean;
  };
  /** Individual migration results */
  results: MigrationResultEntry[];
}

export interface MigrationResultEntry {
  /** Original manifest info */
  manifest: {
    path: string;
    relativePath: string;
    name: string;
    version?: string;
  };
  /** Migration outcome */
  status: 'success' | 'failed' | 'skipped';
  /** Error message if failed */
  error?: string;
  /** Validation errors if any */
  validationErrors?: string[];
  /** Skip reason if skipped */
  skipReason?: string;
  /** Migration summary if successful */
  changes?: {
    sourceVersion: string;
    targetVersion: string;
    addedFeatures: string[];
  };
}

export interface ReportOptions {
  targetVersion: string;
  dryRun: boolean;
  duration: number;
  directory: string;
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate a migration report from results
 */
export function generateReport(
  results: Array<{
    manifest: DiscoveredManifest;
    success: boolean;
    error?: string;
    validationErrors?: string[];
    skipped?: boolean;
    skipReason?: string;
    migratedContent?: unknown;
  }>,
  options: ReportOptions
): MigrationReport {
  const successful = results.filter((r) => r.success && !r.skipped).length;
  const failed = results.filter((r) => !r.success && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;

  const resultEntries: MigrationResultEntry[] = results.map((r) => {
    let status: 'success' | 'failed' | 'skipped';
    if (r.skipped) {
      status = 'skipped';
    } else if (r.success) {
      status = 'success';
    } else {
      status = 'failed';
    }

    return {
      manifest: {
        path: r.manifest.path,
        relativePath: r.manifest.relativePath,
        name: r.manifest.name,
        version: r.manifest.version,
      },
      status,
      error: r.error,
      validationErrors: r.validationErrors,
      skipReason: r.skipReason,
    };
  });

  return {
    summary: {
      total: results.length,
      successful,
      failed,
      skipped,
      duration: options.duration,
    },
    metadata: {
      targetVersion: options.targetVersion,
      directory: options.directory,
      timestamp: new Date().toISOString(),
      dryRun: options.dryRun,
    },
    results: resultEntries,
  };
}

// ============================================================================
// Console Output
// ============================================================================

/**
 * Print migration report to console
 */
export function printReport(report: MigrationReport): void {
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════'));
  console.log(chalk.blue.bold('  MIGRATION REPORT'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════\n'));

  // Print metadata
  console.log(chalk.cyan('[METADATA]'));
  console.log(
    chalk.gray(
      `  Target Version: ${chalk.white(report.metadata.targetVersion)}`
    )
  );
  console.log(
    chalk.gray(`  Directory: ${chalk.white(report.metadata.directory)}`)
  );
  console.log(
    chalk.gray(`  Timestamp: ${chalk.white(report.metadata.timestamp)}`)
  );
  console.log(
    chalk.gray(
      `  Dry Run: ${chalk.white(report.metadata.dryRun ? 'Yes' : 'No')}`
    )
  );
  console.log(
    chalk.gray(
      `  Duration: ${chalk.white(report.summary.duration.toFixed(2))}s\n`
    )
  );

  // Print summary
  console.log(chalk.cyan('[SUMMARY]'));
  console.log(chalk.gray(`  Total: ${chalk.white(report.summary.total)}`));
  console.log(
    chalk.green(`  ✓ Successful: ${chalk.white(report.summary.successful)}`)
  );
  console.log(chalk.red(`  ✗ Failed: ${chalk.white(report.summary.failed)}`));
  console.log(
    chalk.yellow(`  ⊙ Skipped: ${chalk.white(report.summary.skipped)}\n`)
  );

  // Print failed migrations if any
  if (report.summary.failed > 0) {
    console.log(chalk.red.bold('[FAILURES]\n'));
    const failures = report.results.filter((r) => r.status === 'failed');
    failures.forEach((result, index) => {
      console.log(chalk.red(`  ${index + 1}. ${result.manifest.relativePath}`));
      if (result.error) {
        console.log(chalk.gray(`     Error: ${result.error}`));
      }
      if (result.validationErrors && result.validationErrors.length > 0) {
        console.log(chalk.gray('     Validation Errors:'));
        result.validationErrors.forEach((err) => {
          console.log(chalk.gray(`       - ${err}`));
        });
      }
      console.log('');
    });
  }

  // Print skipped migrations if any
  if (report.summary.skipped > 0) {
    console.log(chalk.yellow.bold('[SKIPPED]\n'));
    const skipped = report.results.filter((r) => r.status === 'skipped');
    skipped.forEach((result, index) => {
      console.log(
        chalk.yellow(`  ${index + 1}. ${result.manifest.relativePath}`)
      );
      if (result.skipReason) {
        console.log(chalk.gray(`     Reason: ${result.skipReason}`));
      }
      console.log('');
    });
  }

  // Print success message or failure message
  if (report.summary.failed === 0) {
    if (report.metadata.dryRun) {
      console.log(
        chalk.blue.bold(
          '✓ Dry run completed successfully. No files were modified.\n'
        )
      );
    } else {
      console.log(
        chalk.green.bold(
          `✓ Migration completed successfully! ${report.summary.successful} manifest${report.summary.successful !== 1 ? 's' : ''} migrated.\n`
        )
      );
    }
  } else {
    console.log(
      chalk.red.bold(
        `✗ Migration completed with errors. ${report.summary.failed} manifest${report.summary.failed !== 1 ? 's' : ''} failed.\n`
      )
    );
  }
}

/**
 * Print a diff preview for dry-run mode
 */
export function printDiffPreview(
  manifest: DiscoveredManifest,
  original: unknown,
  migrated: unknown
): void {
  console.log(chalk.cyan(`\n[DIFF] ${manifest.relativePath}\n`));

  // Extract basic info
  const orig = original as Record<string, unknown>;
  const mig = migrated as Record<string, unknown>;

  console.log(chalk.red(`- apiVersion: ${orig.apiVersion || 'unknown'}`));
  console.log(chalk.green(`+ apiVersion: ${mig.apiVersion || 'unknown'}`));

  // Show metadata changes
  if (orig.metadata && mig.metadata) {
    const origMeta = orig.metadata as Record<string, unknown>;
    const migMeta = mig.metadata as Record<string, unknown>;

    if (origMeta.labels !== migMeta.labels) {
      console.log(chalk.gray('\nLabels:'));
      console.log(chalk.red(`  - ${JSON.stringify(origMeta.labels || {})}`));
      console.log(chalk.green(`  + ${JSON.stringify(migMeta.labels || {})}`));
    }

    if (origMeta.annotations !== migMeta.annotations) {
      console.log(chalk.gray('\nAnnotations:'));
      console.log(
        chalk.red(`  - ${JSON.stringify(origMeta.annotations || {})}`)
      );
      console.log(
        chalk.green(`  + ${JSON.stringify(migMeta.annotations || {})}`)
      );
    }
  }

  console.log('');
}

// ============================================================================
// File Output
// ============================================================================

/**
 * Save migration report to JSON file
 */
export async function saveReportToFile(
  report: MigrationReport,
  filePath: string
): Promise<void> {
  const dir = path.dirname(filePath);

  // Ensure directory exists
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  // Write report
  await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8');
}

/**
 * Generate a markdown report
 */
export function generateMarkdownReport(report: MigrationReport): string {
  const lines: string[] = [];

  lines.push('# OSSA Migration Report\n');
  lines.push(`**Generated:** ${report.metadata.timestamp}\n`);
  lines.push('## Summary\n');
  lines.push(`- **Target Version:** ${report.metadata.targetVersion}`);
  lines.push(`- **Directory:** ${report.metadata.directory}`);
  lines.push(`- **Dry Run:** ${report.metadata.dryRun ? 'Yes' : 'No'}`);
  lines.push(`- **Duration:** ${report.summary.duration.toFixed(2)}s\n`);
  lines.push('### Results\n');
  lines.push(`- **Total:** ${report.summary.total}`);
  lines.push(`- **Successful:** ${report.summary.successful}`);
  lines.push(`- **Failed:** ${report.summary.failed}`);
  lines.push(`- **Skipped:** ${report.summary.skipped}\n`);

  // Failed migrations
  if (report.summary.failed > 0) {
    lines.push('## Failures\n');
    const failures = report.results.filter((r) => r.status === 'failed');
    failures.forEach((result, index) => {
      lines.push(`### ${index + 1}. ${result.manifest.relativePath}\n`);
      if (result.error) {
        lines.push(`**Error:** ${result.error}\n`);
      }
      if (result.validationErrors && result.validationErrors.length > 0) {
        lines.push('**Validation Errors:**\n');
        result.validationErrors.forEach((err) => {
          lines.push(`- ${err}`);
        });
        lines.push('');
      }
    });
  }

  // Skipped migrations
  if (report.summary.skipped > 0) {
    lines.push('## Skipped\n');
    const skipped = report.results.filter((r) => r.status === 'skipped');
    skipped.forEach((result, index) => {
      lines.push(`${index + 1}. ${result.manifest.relativePath}`);
      if (result.skipReason) {
        lines.push(`   - Reason: ${result.skipReason}`);
      }
    });
    lines.push('');
  }

  // Successful migrations
  if (report.summary.successful > 0) {
    lines.push('## Successful Migrations\n');
    const successful = report.results.filter((r) => r.status === 'success');
    successful.forEach((result, index) => {
      lines.push(
        `${index + 1}. ${result.manifest.relativePath} (${result.manifest.version || 'unknown'} → ${report.metadata.targetVersion})`
      );
    });
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Save markdown report to file
 */
export async function saveMarkdownReport(
  report: MigrationReport,
  filePath: string
): Promise<void> {
  const markdown = generateMarkdownReport(report);
  const dir = path.dirname(filePath);

  // Ensure directory exists
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  await fs.writeFile(filePath, markdown, 'utf-8');
}
