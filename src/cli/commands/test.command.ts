/**
 * OSSA Test Command
 * Run agent tests defined in manifests
 * Supports mock LLM testing without API keys
 *
 * SOLID Principles:
 * - Uses shared output utilities (DRY)
 * - Single Responsibility: Only runs tests
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import { TestRunnerService } from '../../services/test-runner/test-runner.service.js';
import { listScenarios } from '../../services/test-runner/scenarios.js';
import {
  isJSONOutput,
  outputJSON,
  printInfo,
  printSummary,
} from '../utils/index.js';

export const testCommand = new Command('test')
  .argument('[path]', 'Path to agent manifest')
  .option('--test-id <id>', 'Run specific test by ID')
  .option('--mock', 'Use mock LLM (no API keys required)')
  .option('--scenario <name>', 'Run pre-defined test scenario')
  .option('--list-scenarios', 'List available test scenarios')
  .option('--watch', 'Watch mode - re-run tests on file changes')
  .option('--verbose', 'Verbose output')
  .option('--output <format>', 'Output format (json|text)', 'text')
  .description('Run agent tests with optional mock LLM')
  .action(
    async (
      manifestPath: string | undefined,
      options: {
        testId?: string;
        mock?: boolean;
        scenario?: string;
        listScenarios?: boolean;
        watch?: boolean;
        verbose?: boolean;
        output?: string;
      }
    ) => {
      const jsonMode = isJSONOutput(options);

      // Handle --list-scenarios
      if (options.listScenarios) {
        const scenarios = listScenarios();
        if (jsonMode) {
          outputJSON({ scenarios });
        } else {
          console.log(chalk.bold('\n📋 Available Test Scenarios:\n'));
          scenarios.forEach((scenario) => {
            console.log(
              chalk.cyan(`  ${scenario.id.padEnd(20)} `),
              chalk.white(scenario.name)
            );
            console.log(chalk.gray(`    ${scenario.description}\n`));
          });
        }
        return;
      }

      // Ensure manifest path is provided
      if (!manifestPath) {
        console.error(chalk.red('Error: manifest path is required'));
        process.exit(1);
      }

      // Run tests function (for watch mode support)
      const runTests = async () => {
        const testResults: Array<{
          id: string;
          type: string;
          passed: boolean;
          error?: string;
          response?: string;
        }> = [];

        try {
          const manifestRepo = container.get(ManifestRepository);
          const validationService = container.get(ValidationService);
          const testRunner = new TestRunnerService();

          if (!jsonMode) {
            printInfo(`Loading agent: ${manifestPath}`);
            if (options.mock) {
              console.log(
                chalk.yellow('  🧪 Using mock LLM (no API keys required)')
              );
            }
            if (options.scenario) {
              console.log(
                chalk.yellow(`  📋 Running scenario: ${options.scenario}`)
              );
            }
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
              result.errors.forEach((error) =>
                console.error(chalk.red(`  - ${error}`))
              );
            }
            process.exit(1);
          }

          const agentName = manifest.metadata.name;

          // Run tests using TestRunnerService
          const results = await testRunner.runTests(manifest, {
            testId: options.testId,
            useMock: options.mock,
            scenario: options.scenario,
          });

          if (results.length === 0) {
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

          if (!jsonMode) {
            console.log(chalk.blue(`\nRunning ${results.length} test(s)...\n`));
          }

          let passed = 0;
          let failed = 0;

          for (const result of results) {
            if (result.status === 'passed') {
              passed++;
              testResults.push({
                id: result.id,
                type: result.type,
                passed: true,
                response: result.response,
              });

              if (!jsonMode) {
                console.log(chalk.green(`✓ ${result.id}`));
                if (options.verbose && result.response) {
                  console.log(
                    chalk.gray(
                      `  Response: ${result.response.substring(0, 100)}...`
                    )
                  );
                }
                if (result.duration) {
                  console.log(chalk.gray(`  Duration: ${result.duration}ms\n`));
                }
              }
            } else {
              failed++;
              testResults.push({
                id: result.id,
                type: result.type,
                passed: false,
                error: result.message,
              });

              if (!jsonMode) {
                console.log(chalk.red(`✗ ${result.id}`));
                console.log(chalk.red(`  ${result.message}\n`));
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

          if (failed > 0 && !options.watch) {
            process.exit(1);
          }

          return { passed, failed, total: passed + failed };
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);

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

          if (!options.watch) {
            process.exit(1);
          }

          return { passed: 0, failed: 1, total: 1 };
        }
      };

      // Watch mode
      if (options.watch) {
        if (jsonMode) {
          console.error(
            chalk.red('Watch mode is not supported with JSON output')
          );
          process.exit(1);
        }

        console.log(
          chalk.blue('\n👀 Watch mode enabled - watching for changes...\n')
        );

        // Run tests initially
        await runTests();

        // Watch for file changes
        let timeout: NodeJS.Timeout | null = null;
        const watcher = fs.watch(manifestPath, async (eventType) => {
          if (eventType === 'change') {
            // Debounce file changes
            if (timeout) {
              clearTimeout(timeout);
            }
            timeout = setTimeout(async () => {
              console.log(
                chalk.blue('\n📝 File changed - re-running tests...\n')
              );
              await runTests();
            }, 500);
          }
        });

        // Keep process running with proper cleanup
        process.on('SIGINT', () => {
          watcher.close();
          process.exit(0);
        });
        process.on('SIGTERM', () => {
          watcher.close();
          process.exit(0);
        });
        await new Promise(() => {});
      } else {
        // Run tests once
        const result = await runTests();
        if (result.failed > 0) {
          process.exit(1);
        }
      }
    }
  );

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
