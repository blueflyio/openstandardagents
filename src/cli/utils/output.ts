/**
 * CLI Output Utility
 *
 * Provides consistent output formatting across all OSSA CLI commands.
 * Supports JSON and text output formats for machine and human consumption.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles output formatting
 * - Open/Closed: Extensible via OutputFormatter interface
 * - Interface Segregation: Separate interfaces for different output needs
 */

import chalk from 'chalk';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Standard CLI result structure for JSON output
 */
export interface CLIResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ path?: string; message: string; code?: string }>;
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Output format options
 */
export type OutputFormat = 'json' | 'text';

/**
 * Output options passed to formatters
 */
export interface OutputOptions {
  format: OutputFormat;
  verbose?: boolean;
  silent?: boolean;
}

/**
 * Interface for command-specific formatters
 */
export interface OutputFormatter<T> {
  formatSuccess(data: T, options: OutputOptions): void;
  formatError(error: Error | string, options: OutputOptions): void;
}

// ============================================================================
// Core Output Functions
// ============================================================================

/**
 * Output a successful result
 */
export function outputSuccess<T>(
  result: CLIResult<T>,
  options: OutputOptions = { format: 'text' }
): void {
  if (options.silent) return;

  if (options.format === 'json') {
    console.log(JSON.stringify(result, null, 2));
  }
  // Text output is handled by caller for flexibility
}

/**
 * Output an error result
 */
export function outputError<T>(
  result: CLIResult<T>,
  options: OutputOptions = { format: 'text' }
): void {
  if (options.format === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.error(chalk.red(`✗ ${result.error || 'An error occurred'}`));
    if (result.errors) {
      result.errors.forEach((e) => {
        const path = e.path ? chalk.gray(`[${e.path}] `) : '';
        console.error(chalk.red(`  ${path}${e.message}`));
      });
    }
  }
}

/**
 * Create a success result
 */
export function success<T>(
  data: T,
  metadata?: Record<string, unknown>
): CLIResult<T> {
  return {
    success: true,
    data,
    metadata,
  };
}

/**
 * Create an error result
 */
export function error(
  message: string,
  errors?: Array<{ path?: string; message: string; code?: string }>
): CLIResult<never> {
  return {
    success: false,
    error: message,
    errors,
  };
}

/**
 * Create a result with warnings
 */
export function withWarnings<T>(
  result: CLIResult<T>,
  warnings: string[]
): CLIResult<T> {
  return {
    ...result,
    warnings,
  };
}

// ============================================================================
// Text Output Helpers
// ============================================================================

/**
 * Print a section header
 */
export function printHeader(title: string): void {
  console.log(chalk.blue(`\n[${title}]\n`));
}

/**
 * Print a success message
 */
export function printSuccess(message: string): void {
  console.log(chalk.green(`✓ ${message}`));
}

/**
 * Print an error message
 */
export function printError(message: string): void {
  console.error(chalk.red(`✗ ${message}`));
}

/**
 * Print a warning message
 */
export function printWarning(message: string): void {
  console.log(chalk.yellow(`⚠ ${message}`));
}

/**
 * Print an info message
 */
export function printInfo(message: string): void {
  console.log(chalk.cyan(`ℹ ${message}`));
}

/**
 * Print a key-value pair
 */
export function printKeyValue(
  key: string,
  value: string | number | boolean
): void {
  console.log(`  ${chalk.gray(key + ':')} ${chalk.white(String(value))}`);
}

/**
 * Print a list item
 */
export function printListItem(item: string, indent = 2): void {
  const spaces = ' '.repeat(indent);
  console.log(`${spaces}• ${item}`);
}

// ============================================================================
// JSON Output Helpers
// ============================================================================

/**
 * Output JSON with consistent formatting
 */
export function outputJSON(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Check if output should be JSON
 */
export function isJSONOutput(options: {
  output?: string;
  outputFormat?: string;
}): boolean {
  // Check both output and outputFormat for backwards compatibility
  return options.output === 'json' || options.outputFormat === 'json';
}

// ============================================================================
// Conditional Output
// ============================================================================

/**
 * Execute function only for text output
 */
export function textOnly(options: OutputOptions, fn: () => void): void {
  if (options.format !== 'json') {
    fn();
  }
}

/**
 * Execute function only for JSON output
 */
export function jsonOnly(options: OutputOptions, fn: () => void): void {
  if (options.format === 'json') {
    fn();
  }
}

// ============================================================================
// Table Output
// ============================================================================

/**
 * Print a simple table
 */
export function printTable(
  headers: string[],
  rows: string[][],
  options: { columnWidths?: number[] } = {}
): void {
  const widths =
    options.columnWidths ||
    headers.map((h, i) => {
      const maxRowWidth = Math.max(...rows.map((r) => (r[i] || '').length));
      return Math.max(h.length, maxRowWidth);
    });

  // Print header
  const headerLine = headers.map((h, i) => h.padEnd(widths[i])).join('  ');
  console.log(chalk.cyan(headerLine));
  console.log(chalk.gray('-'.repeat(headerLine.length)));

  // Print rows
  rows.forEach((row) => {
    const line = row
      .map((cell, i) => (cell || '').padEnd(widths[i]))
      .join('  ');
    console.log(line);
  });
}

// ============================================================================
// Progress Output
// ============================================================================

/**
 * Print a progress step
 */
export function printStep(step: number, total: number, message: string): void {
  const progress = chalk.gray(`[${step}/${total}]`);
  console.log(`${progress} ${message}`);
}

/**
 * Print completion summary
 */
export function printSummary(stats: {
  passed?: number;
  failed?: number;
  total?: number;
}): void {
  console.log(chalk.cyan.bold('\nSummary\n'));
  if (stats.passed !== undefined) {
    console.log(chalk.green(`  Passed: ${stats.passed}`));
  }
  if (stats.failed !== undefined && stats.failed > 0) {
    console.log(chalk.red(`  Failed: ${stats.failed}`));
  }
  if (stats.total !== undefined) {
    console.log(chalk.white(`  Total:  ${stats.total}`));
  }
  console.log();
}
