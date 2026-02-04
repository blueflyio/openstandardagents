/**
 * Export Command (Enhanced)
 * Enhanced export with adapter interface, batch mode, and dry-run
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ExportOrchestrator } from '../../services/export/export-orchestrator.js';
import { registry } from '../../adapters/registry/platform-registry.js';

export const exportEnhancedCommand = new Command('export-enhanced')
  .description('Export OSSA manifest to platform-specific format')
  .argument('<manifest>', 'Path to OSSA agent manifest')
  .option(
    '-p, --platform <platform>',
    'Target platform (use --list to see all)'
  )
  .option('--all', 'Export to all registered platforms')
  .option('-o, --output <directory>', 'Output directory', './exports')
  .option('--dry-run', 'Validate and preview without writing files')
  .option('--validate', 'Validate before export', true)
  .option('--no-validate', 'Skip validation')
  .option('--parallel', 'Run batch exports in parallel')
  .option('--continue-on-error', 'Continue batch export even if one fails')
  .option('--list', 'List all available export platforms')
  .option('--info <platform>', 'Show information about a specific platform')
  .action(
    async (
      manifestPath: string,
      options: {
        platform?: string;
        all?: boolean;
        output: string;
        dryRun?: boolean;
        validate: boolean;
        parallel?: boolean;
        continueOnError?: boolean;
        list?: boolean;
        info?: string;
      }
    ) => {
      try {
        // Handle --list
        if (options.list) {
          console.log(chalk.blue.bold('\nAvailable Export Platforms:\n'));
          const platforms = registry.getAdapterInfo();
          platforms.forEach((p) => {
            console.log(chalk.cyan(`  ${p.platform}`));
            console.log(chalk.gray(`    ${p.description}`));
            console.log(
              chalk.gray(
                `    Supported: OSSA ${p.supportedVersions.join(', ')}\n`
              )
            );
          });
          return;
        }

        // Handle --info
        if (options.info) {
          const adapter = registry.getAdapter(options.info);
          if (!adapter) {
            console.error(chalk.red(`Platform not found: ${options.info}`));
            process.exit(1);
          }

          console.log(chalk.blue.bold(`\n${adapter.displayName}\n`));
          console.log(chalk.gray(`Platform ID: ${adapter.platform}`));
          console.log(chalk.gray(`Description: ${adapter.description}`));
          console.log(
            chalk.gray(
              `Supported Versions: OSSA ${adapter.supportedVersions.join(', ')}\n`
            )
          );

          console.log(chalk.cyan('Example Manifest:'));
          console.log(
            chalk.gray(JSON.stringify(adapter.getExample(), null, 2))
          );
          return;
        }

        // Require platform or --all
        if (!options.platform && !options.all) {
          console.error(
            chalk.red('Error: Must specify --platform <name> or --all\n')
          );
          console.log(chalk.gray('Use --list to see available platforms'));
          process.exit(1);
        }

        // Load manifest
        console.log(chalk.blue(`Loading manifest: ${manifestPath}\n`));
        const manifestRepo = container.get(ManifestRepository);
        const manifest = await manifestRepo.load(manifestPath);

        const orchestrator = new ExportOrchestrator();

        // Dry-run notification
        if (options.dryRun) {
          console.log(
            chalk.yellow('⚠️  DRY RUN MODE - No files will be written\n')
          );
        }

        // Batch export (--all)
        if (options.all) {
          console.log(chalk.blue('Exporting to all platforms...\n'));

          const result = await orchestrator.exportBatch(manifest, {
            outputDir: options.output,
            validate: options.validate,
            dryRun: options.dryRun,
            parallel: options.parallel,
            continueOnError: options.continueOnError,
          });

          // Print results
          console.log(chalk.blue.bold('\nExport Results:\n'));
          result.results.forEach((r) => {
            const icon = r.success ? chalk.green('✓') : chalk.red('✗');
            const status = r.success
              ? chalk.green('SUCCESS')
              : chalk.red('FAILED');
            console.log(`${icon} ${r.platform}: ${status}`);

            if (r.error) {
              console.log(chalk.red(`    Error: ${r.error}`));
            } else if (r.files.length > 0) {
              console.log(chalk.gray(`    Files: ${r.files.length}`));
            }

            if (r.metadata?.warnings) {
              r.metadata.warnings.forEach((w) => {
                console.log(chalk.yellow(`    Warning: ${w}`));
              });
            }
          });

          // Print summary
          console.log(chalk.blue.bold('\nSummary:'));
          console.log(
            chalk.gray(
              `  Total: ${result.summary.total} | Success: ${chalk.green(result.summary.successful)} | Failed: ${chalk.red(result.summary.failed)}`
            )
          );
          console.log(chalk.gray(`  Duration: ${result.summary.duration}ms`));

          if (!result.success) {
            process.exit(1);
          }
        }
        // Single platform export
        else if (options.platform) {
          console.log(chalk.blue(`Exporting to ${options.platform}...\n`));

          const result = await orchestrator.exportSingle(
            manifest,
            options.platform,
            {
              outputDir: options.output,
              validate: options.validate,
              dryRun: options.dryRun,
            }
          );

          if (result.success) {
            console.log(
              chalk.green(
                `✓ Export successful: ${result.files.length} files generated`
              )
            );

            if (!options.dryRun) {
              console.log(
                chalk.gray(`  Output: ${path.resolve(options.output)}`)
              );
            }

            result.files.forEach((file) => {
              const typeColor =
                file.type === 'code'
                  ? chalk.blue
                  : file.type === 'config'
                    ? chalk.cyan
                    : chalk.gray;
              console.log(
                typeColor(
                  `    ${file.type}: ${file.path}` +
                    (file.language ? ` (${file.language})` : '')
                )
              );
            });

            if (result.metadata?.warnings) {
              console.log(chalk.yellow('\nWarnings:'));
              result.metadata.warnings.forEach((w) => {
                console.log(chalk.yellow(`  ⚠️  ${w}`));
              });
            }

            if (result.metadata?.duration) {
              console.log(
                chalk.gray(`\nCompleted in ${result.metadata.duration}ms`)
              );
            }
          } else {
            console.error(chalk.red(`✗ Export failed: ${result.error}`));
            process.exit(1);
          }
        }
      } catch (error) {
        console.error(
          chalk.red(
            `Export failed: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    }
  );
