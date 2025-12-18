/**
 * OSSA Test Command
 * Run agent tests with support for unit, integration, and capability tests
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { watch } from 'fs';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import { TestRunner } from '../../testing/runner.js';
import { ConsoleReporter } from '../../testing/reporters/console.js';
import { JsonReporter } from '../../testing/reporters/json.js';
import type { TestOptions } from '../../testing/runner.js';

export const testCommand = new Command('test')
  .argument('[path]', 'Path to agent manifest (optional with --manifest)')
  .option(
    '-m, --manifest <path>',
    'Path to agent manifest (alternative to positional argument)'
  )
  .option('--test-id <id>', 'Run specific test by ID')
  .option('-c, --capability <name>', 'Test specific capability')
  .option('--mock', 'Use mocked LLM (for integration tests)')
  .option('--coverage', 'Report test coverage')
  .option('-w, --watch', 'Watch mode - rerun tests on file changes')
  .option('-v, --verbose', 'Verbose output with detailed information')
  .option('--json', 'Output results as JSON')
  .description('Run agent tests (unit, integration, capability, policy)')
  .action(
    async (
      pathArg: string | undefined,
      options: {
        manifest?: string;
        testId?: string;
        capability?: string;
        mock?: boolean;
        coverage?: boolean;
        watch?: boolean;
        verbose?: boolean;
        json?: boolean;
      }
    ) => {
      try {
        // Determine manifest path
        const manifestPath = options.manifest || pathArg;

        if (!manifestPath) {
          console.error(
            chalk.red(
              '✗ Error: Manifest path required. Use: ossa test <path> or ossa test --manifest <path>'
            )
          );
          process.exit(1);
        }

        // Get services from DI container
        const manifestRepo = container.get(ManifestRepository);
        const validationService = container.get(ValidationService);

        // Create reporter
        const reporter = options.json
          ? new JsonReporter()
          : new ConsoleReporter(options.verbose);

        // Create test runner
        const runner = new TestRunner(validationService, reporter);

        // Build test options
        const testOptions: TestOptions = {
          manifestPath,
          testId: options.testId,
          capability: options.capability,
          mock: options.mock,
          coverage: options.coverage,
          watch: options.watch,
          verbose: options.verbose,
        };

        // Run tests
        const runTests = async () => {
          try {
            if (!options.json) {
              console.log(chalk.blue(`Loading agent: ${manifestPath}`));
            }

            const manifest = await manifestRepo.load(manifestPath);

            const summary = await runner.runTests(manifest, testOptions);

            // Output JSON if requested
            if (options.json) {
              console.log(reporter.getOutput());
            }

            // Exit with appropriate code
            if (summary.failed > 0) {
              process.exit(1);
            }
          } catch (error) {
            if (options.json) {
              console.error(
                JSON.stringify(
                  {
                    error: error instanceof Error ? error.message : String(error),
                    stack:
                      options.verbose && error instanceof Error
                        ? error.stack
                        : undefined,
                  },
                  null,
                  2
                )
              );
            } else {
              console.error(
                chalk.red('✗ Test execution failed:'),
                error instanceof Error ? error.message : String(error)
              );

              if (options.verbose && error instanceof Error && error.stack) {
                console.error(chalk.gray(error.stack));
              }
            }
            process.exit(1);
          }
        };

        // Watch mode
        if (options.watch) {
          console.log(chalk.blue(`Watching ${manifestPath} for changes...\n`));

          // Run tests immediately
          await runTests();

          // Watch for changes
          watch(manifestPath, { persistent: true }, async (eventType) => {
            if (eventType === 'change') {
              console.log(
                chalk.yellow(`\n\nFile changed, rerunning tests...\n`)
              );
              await runTests();
            }
          });

          // Keep process alive
          await new Promise(() => {});
        } else {
          // Single run
          await runTests();
        }
      } catch (error) {
        console.error(
          chalk.red('✗ Error:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    }
  );
