/**
 * Standard CLI Options (Production-Grade)
 * Reusable option builders following industry best practices
 *
 * SOLID Principles:
 * - Single Responsibility: Each function creates specific option type
 * - Open/Closed: Extensible via composition
 * - DRY: Shared options across all commands
 */

import { Command, Option } from 'commander';

/**
 * Global options for ALL commands
 * - verbose: Detailed output
 * - quiet: Minimal output (errors only)
 * - no-color: Disable colored output (for CI/CD)
 * - json: JSON output mode (for scripting)
 * - config: Override config file location
 */
export function addGlobalOptions(command: Command): Command {
  return command
    .option('-v, --verbose', 'Enable verbose output', false)
    .option('-q, --quiet', 'Minimal output (errors only)', false)
    .option('--no-color', 'Disable colored output')
    .option('--json', 'Output in JSON format', false)
    .option(
      '--config <path>',
      'Config file path (default: .ossarc.yaml)',
      '.ossarc.yaml'
    );
}

/**
 * Mutation options for commands that modify state
 * - dry-run: Preview without execution
 * - force: Skip confirmations
 * - output: Output destination
 */
export function addMutationOptions(command: Command): Command {
  return command
    .option('--dry-run', 'Preview changes without execution', false)
    .option('-y, --force', 'Skip confirmation prompts', false)
    .option('-o, --output <path>', 'Output destination path');
}

/**
 * Query options for list/search commands
 * - format: Output format (json, yaml, table)
 * - limit: Limit number of results
 * - filter: Filter expression
 */
export function addQueryOptions(command: Command): Command {
  return command
    .option('--format <type>', 'Output format (json, yaml, table)', 'table')
    .option('-l, --limit <n>', 'Limit number of results', parseInt)
    .option('-f, --filter <expr>', 'Filter expression');
}

/**
 * File input options
 * - input: Input file path
 * - recursive: Process directories recursively
 */
export function addFileInputOptions(command: Command): Command {
  return command
    .option('-i, --input <path>', 'Input file or directory path')
    .option('-r, --recursive', 'Process directories recursively', false);
}

/**
 * Validation options
 * - strict: Enable strict validation
 * - fix: Auto-fix issues when possible
 */
export function addValidationOptions(command: Command): Command {
  return command
    .option('--strict', 'Enable strict validation mode', false)
    .option('--fix', 'Auto-fix issues when possible', false);
}

/**
 * Platform export options
 * - platform: Target platform
 * - all: Export to all platforms
 */
export function addPlatformOptions(command: Command): Command {
  return command
    .option(
      '-p, --platform <name>',
      'Target platform (kagent, langchain, crewai, etc.)'
    )
    .option('--all', 'Export to all supported platforms', false);
}

/**
 * Backup options for destructive operations
 * - backup: Create backup before operation
 * - backup-dir: Backup directory location
 */
export function addBackupOptions(command: Command): Command {
  return command
    .option('--backup', 'Create backup before operation', false)
    .option('--backup-dir <path>', 'Backup directory path', './backups');
}

/**
 * Report options for commands that generate reports
 * - report: Generate detailed report
 * - report-output: Report output path
 * - report-format: Report format
 */
export function addReportOptions(command: Command): Command {
  return command
    .option('--report', 'Generate detailed report', false)
    .option('--report-output <path>', 'Report output path')
    .option(
      '--report-format <type>',
      'Report format (json, yaml, html, pdf)',
      'json'
    );
}

/**
 * Interactive mode option
 * - interactive: Enable interactive mode with prompts
 */
export function addInteractiveOption(command: Command): Command {
  return command.option(
    '--interactive',
    'Enable interactive mode with prompts',
    false
  );
}

/**
 * Batch processing options
 * - batch: Process multiple items
 * - parallel: Number of parallel operations
 */
export function addBatchOptions(command: Command): Command {
  return command
    .option('--batch', 'Enable batch processing mode', false)
    .option('--parallel <n>', 'Number of parallel operations', parseInt, 1);
}

/**
 * Complete option set for mutation commands
 * Combines global, mutation, file input, and backup options
 */
export function addStandardMutationOptions(command: Command): Command {
  addGlobalOptions(command);
  addMutationOptions(command);
  addFileInputOptions(command);
  addBackupOptions(command);
  return command;
}

/**
 * Complete option set for query commands
 * Combines global, query, and file input options
 */
export function addStandardQueryOptions(command: Command): Command {
  addGlobalOptions(command);
  addQueryOptions(command);
  addFileInputOptions(command);
  return command;
}

/**
 * Complete option set for validation commands
 * Combines global, validation, file input, and report options
 */
export function addStandardValidationOptions(command: Command): Command {
  addGlobalOptions(command);
  addValidationOptions(command);
  addFileInputOptions(command);
  addReportOptions(command);
  return command;
}

/**
 * Exit codes (POSIX standard)
 */
export enum ExitCode {
  SUCCESS = 0,
  GENERAL_ERROR = 1,
  MISUSE = 2,
  CANNOT_EXECUTE = 126,
  NOT_FOUND = 127,
}

/**
 * Handle command execution with proper error handling and exit codes
 */
export async function executeCommand(
  handler: () => Promise<void>
): Promise<void> {
  try {
    await handler();
    process.exit(ExitCode.SUCCESS);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('Unknown error occurred');
    }
    process.exit(ExitCode.GENERAL_ERROR);
  }
}

/**
 * Get standard output formatter based on options
 */
export function getOutputFormatter(options: {
  json?: boolean;
  format?: string;
  noColor?: boolean;
}): 'json' | 'yaml' | 'table' | 'text' {
  if (options.json) return 'json';
  if (options.format === 'yaml') return 'yaml';
  if (options.format === 'table') return 'table';
  return 'text';
}

/**
 * Check if running in CI environment
 */
export function isCIEnvironment(): boolean {
  return !!(
    process.env.CI ||
    process.env.GITLAB_CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.JENKINS_HOME ||
    process.env.TRAVIS
  );
}

/**
 * Check if output should be colored
 */
export function shouldUseColor(options: { color?: boolean }): boolean {
  // Respect --no-color flag
  if (options.color === false) return false;

  // Disable in CI unless explicitly enabled
  if (isCIEnvironment()) return false;

  // Check if stdout is a TTY
  return process.stdout.isTTY ?? false;
}
