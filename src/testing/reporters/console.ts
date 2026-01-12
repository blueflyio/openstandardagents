/**
 * Console Test Reporter
 * Human-readable console output with colors
 */

import chalk from 'chalk';
import type { OssaAgent } from '../../types/index.js';
import type { TestResult, TestSummary } from '../runner.js';
import type { TestReporter } from './base.js';

export class ConsoleReporter implements TestReporter {
  private results: TestResult[] = [];
  private manifest?: OssaAgent;
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  onTestRunStart(manifest: OssaAgent): void {
    this.manifest = manifest;
    console.log(chalk.blue.bold(`\nRunning tests for ${manifest.metadata?.name || 'agent'}...\n`));
  }

  onTestResult(result: TestResult): void {
    this.results.push(result);

    // Real-time output for each test
    const icon =
      result.status === 'passed'
        ? chalk.green('✓')
        : result.status === 'failed'
          ? chalk.red('✗')
          : chalk.yellow('○');

    const duration = chalk.gray(`(${result.duration}ms)`);
    const name = result.status === 'passed' ? chalk.white(result.name) : chalk.white(result.name);

    console.log(`  ${icon} ${name} ${duration}`);

    // Show error details if failed and verbose
    if (result.status === 'failed' && result.message) {
      console.log(chalk.red(`    ${result.message}`));
      if (this.verbose && result.error) {
        console.log(chalk.gray(`    ${result.error.stack}`));
      }
    }
  }

  onTestRunComplete(summary: TestSummary): void {
    console.log(chalk.cyan.bold('\nTest Results\n'));

    // Summary stats
    console.log(chalk.green(`  Passed:  ${summary.passed}`));
    if (summary.failed > 0) {
      console.log(chalk.red(`  Failed:  ${summary.failed}`));
    }
    if (summary.skipped > 0) {
      console.log(chalk.yellow(`  Skipped: ${summary.skipped}`));
    }
    console.log(chalk.white(`  Total:   ${summary.total}`));
    console.log(chalk.gray(`  Duration: ${summary.duration}ms\n`));

    // Coverage report
    if (summary.coverage) {
      console.log(chalk.cyan.bold('Coverage\n'));

      if (summary.coverage.capabilities) {
        const cap = summary.coverage.capabilities;
        const color = cap.percentage >= 80 ? chalk.green : chalk.yellow;
        console.log(
          color(`  Capabilities: ${cap.tested}/${cap.total} (${cap.percentage.toFixed(1)}%)`)
        );
      }

      if (summary.coverage.policies) {
        const pol = summary.coverage.policies;
        const color = pol.percentage >= 80 ? chalk.green : chalk.yellow;
        console.log(
          color(`  Policies:     ${pol.tested}/${pol.total} (${pol.percentage.toFixed(1)}%)`)
        );
      }

      console.log();
    }

    // Final status
    if (summary.failed > 0) {
      console.log(chalk.red.bold(`\n✗ ${summary.failed} test(s) failed\n`));
    } else {
      console.log(chalk.green.bold(`\n✓ All tests passed!\n`));
    }
  }

  getOutput(): string {
    // For console reporter, output is written directly
    return '';
  }
}
