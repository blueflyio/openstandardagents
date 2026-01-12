/**
 * OSSA Test Command
 * Run agent tests defined in manifests
 *
 * SOLID Principles:
 * - Uses shared output utilities (DRY)
 * - Single Responsibility: Only runs tests
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import { isJSONOutput, outputJSON, printInfo, printSummary } from '../utils/index.js';

export const testCommand = new Command('test')
  .argument('<path>', 'Path to agent manifest')
  .option('--test-id <id>', 'Run specific test by ID')
  .option('--verbose', 'Verbose output')
  .option('--output <format>', 'Output format (json|text)', 'text')
  .description('Run agent tests')
  .action(async (manifestPath: string, options: { testId?: string; verbose?: boolean; output?: string }) => {
    const testResults: Array<{ id: string; type: string; passed: boolean; error?: string }> = [];

    const jsonMode = isJSONOutput(options);

    try {
      const manifestRepo = container.get(ManifestRepository);
      const validationService = container.get(ValidationService);

      if (!jsonMode) {
        printInfo(`Loading agent: ${manifestPath}`);
      }

      const manifest: any = await manifestRepo.load(manifestPath);
      const result = await validationService.validate(manifest);

      if (!result.valid) {
        if (jsonMode) {
          outputJSON({
            success: false,
            path: manifestPath,
            error: 'Agent validation failed',
            validationErrors: result.errors,
          });
        } else {
          console.error(chalk.red('✗ Agent validation failed'));
          result.errors.forEach((error) => console.error(chalk.red(`  - ${error}`)));
        }
        process.exit(1);
      }

      const agentName = manifest.metadata.name;
      const tests = manifest.spec?.tests || [];

      if (tests.length === 0) {
        if (jsonMode) {
          outputJSON({
            success: true,
            path: manifestPath,
            agent: agentName,
            tests: [],
            summary: { passed: 0, failed: 0, total: 0 },
          });
        } else {
          console.log(chalk.yellow(`No tests defined for ${agentName}`));
        }
        return;
      }

      const testsToRun = options.testId ? tests.filter((t: any) => t.id === options.testId) : tests;

      if (testsToRun.length === 0) {
        if (jsonMode) {
          outputJSON({
            success: false,
            path: manifestPath,
            error: `Test "${options.testId}" not found`,
          });
        } else {
          console.error(chalk.red(`✗ Test "${options.testId}" not found`));
        }
        process.exit(1);
      }

      if (!jsonMode) {
        console.log(chalk.blue(`\nRunning ${testsToRun.length} test(s)...\n`));
      }

      let passed = 0;
      let failed = 0;

      for (const test of testsToRun) {
        const testId = test.id || 'unnamed';
        const testType = test.type || 'unit';

        if (options.verbose && !jsonMode) {
          console.log(chalk.cyan(`[${testType}] ${testId}`));
        }

        try {
          if (test.assertions) {
            for (const assertion of test.assertions) {
              if (assertion.type === 'equals') {
                const actual = evaluateExpression(assertion.actual, manifest);
                const expected = assertion.expected;
                if (actual !== expected) {
                  throw new Error(`Expected ${expected}, got ${actual}`);
                }
              }
            }
          }
          passed++;
          testResults.push({ id: testId, type: testType, passed: true });

          if (options.verbose && !jsonMode) {
            console.log(chalk.green(`  ✓ Passed\n`));
          }
        } catch (error) {
          failed++;
          const errorMsg = error instanceof Error ? error.message : String(error);
          testResults.push({ id: testId, type: testType, passed: false, error: errorMsg });

          if (!jsonMode) {
            console.log(chalk.red(`  ✗ Failed: ${errorMsg}\n`));
          }
        }
      }

      if (jsonMode) {
        outputJSON({
          success: failed === 0,
          path: manifestPath,
          agent: agentName,
          tests: testResults,
          summary: { passed, failed, total: passed + failed },
        });
      } else {
        printSummary({ passed, failed, total: passed + failed });
      }

      if (failed > 0) {
        process.exit(1);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (jsonMode) {
        outputJSON({
          success: false,
          path: manifestPath,
          error: errorMsg,
          tests: testResults,
        });
      } else {
        console.error(chalk.red('✗ Test execution failed:'), errorMsg);
      }
      process.exit(1);
    }
  });

function evaluateExpression(expr: string, manifest: any): any {
  if (expr.startsWith('metadata.')) {
    const path = expr.split('.').slice(1);
    let value: any = manifest.metadata;
    for (const key of path) {
      value = value?.[key];
    }
    return value;
  }
  return expr;
}
