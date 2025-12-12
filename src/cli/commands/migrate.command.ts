/**
 * OSSA Migrate Command
 * Migrate manifests to current OSSA version
 *
 * Supported migrations:
 * - v1.0 (legacy) → current version
 * - Any older ossa/v0.x.x → current version
 *
 * Features added during migration:
 * - Runtime-configurable LLM models via environment variables
 * - Fallback models for multi-provider resilience
 * - Cost tracking with budget alerts
 * - Retry configuration with exponential backoff
 * - Safety configuration (content filtering, guardrails)
 * - Observability (tracing, metrics, logging)
 *
 * IMPORTANT: All version numbers are derived dynamically from package.json
 * via getVersionInfo(). NO hardcoded versions.
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { MigrationService } from '../../services/migration.service.js';
import { ValidationService } from '../../services/validation.service.js';
import type { OssaAgent } from '../../types/index.js';
import { getVersionInfo } from '../../utils/version.js';

export const migrateCommand = new Command('migrate')
  .argument('<source>', 'Path to manifest or directory to migrate')
  .option('-o, --output <path>', 'Output path for migrated manifest')
  .option(
    '-r, --recursive',
    'Recursively migrate all .ossa.yaml files in directory'
  )
  .option('--dry-run', 'Show migration preview without writing file')
  .option('-v, --verbose', 'Verbose output')
  .option('--summary', 'Show migration summary with added features')
  .description(
    'Migrate OSSA manifests to current version (from v1.0 legacy or older versions)'
  )
  .action(
    async (
      source: string,
      options: {
        output?: string;
        dryRun?: boolean;
        verbose?: boolean;
        summary?: boolean;
      }
    ) => {
      try {
        // Get services
        const migrationService = container.get(MigrationService);
        const manifestRepo = container.get(ManifestRepository);
        const validationService = container.get(ValidationService);

        // Get current version dynamically
        const versionInfo = getVersionInfo();
        const currentVersion = versionInfo.version;

        console.log(chalk.blue(`Migrating ${source} to v${currentVersion}...`));

        // Load legacy manifest
        const legacyManifest = await manifestRepo.load(source);

        // Get source version for logging
        const sourceVersion = migrationService.getSourceVersion(legacyManifest);
        console.log(chalk.gray(`  Source version: ${sourceVersion}`));

        // Check if migration is needed
        if (!migrationService.needsMigration(legacyManifest)) {
          const m = legacyManifest as OssaAgent;
          if (m.apiVersion === `ossa/v${currentVersion}`) {
            console.log(chalk.green(`✓ Manifest is already at v${currentVersion}`));
          } else if (typeof m.apiVersion === 'string' && m.apiVersion.startsWith('ossa/v') && m.kind === 'Agent') {
            console.log(chalk.green('✓ Manifest is already at current version'));
          } else {
            console.log(
              chalk.yellow(
                '⚠  Manifest format not recognized or already migrated'
              )
            );
          }
          process.exit(0);
        }

        // Migrate
        const migratedManifest = await migrationService.migrate(legacyManifest);

        // Show migration summary if requested
        if (options.summary || options.verbose) {
          const summary = migrationService.getMigrationSummary(legacyManifest, migratedManifest);
          console.log(chalk.cyan('\n📋 Migration Summary:'));
          console.log(chalk.gray(`  From: ${summary.sourceVersion}`));
          console.log(chalk.gray(`  To: ${summary.targetVersion}`));
          if (summary.addedFeatures.length > 0) {
            console.log(chalk.green('\n  ✨ Added Features:'));
            summary.addedFeatures.forEach((feature) => {
              console.log(chalk.green(`    • ${feature}`));
            });
          }
          if (summary.changes.length > 0) {
            console.log(chalk.blue('\n  🔄 Changes:'));
            summary.changes.forEach((change) => {
              console.log(chalk.blue(`    • ${change}`));
            });
          }
          console.log('');
        }

        // Validate migrated manifest (use 'current' to let validation service resolve)
        const validationResult = await validationService.validate(
          migratedManifest,
          'current'
        );

        if (!validationResult.valid) {
          console.error(chalk.red('✗ Migration produced invalid manifest:'));
          validationResult.errors.forEach((error) => {
            console.error(
              chalk.red(`  - ${error.instancePath}: ${error.message}`)
            );
          });
          process.exit(1);
        }

        if (options.dryRun) {
          console.log(chalk.yellow('\n🔍 Dry Run - No files written'));
          console.log(chalk.gray('\nMigrated Manifest Preview:'));
          console.log(chalk.white(JSON.stringify(migratedManifest, null, 2)));
        } else {
          // Determine output path dynamically based on current version
          const outputPath =
            options.output ||
            (() => {
              let path = source;
              // Remove existing version suffixes if present
              path = path.replace(
                /\.v\d+\.\d+\.\d+\.ossa\.(yaml|yml|json)$/,
                '.ossa.$1'
              );
              // If already has .ossa, just add version before .ossa
              if (path.includes('.ossa.')) {
                return path.replace(
                  /\.ossa\.(yaml|yml|json)$/,
                  `.v${currentVersion}.ossa.$1`
                );
              }
              // Otherwise add version.ossa before extension
              return path.replace(/\.(yaml|yml|json)$/, `.v${currentVersion}.ossa.$1`);
            })();

          // Save migrated manifest
          await manifestRepo.save(outputPath, migratedManifest);

          console.log(chalk.green('✓ Migration successful'));
          console.log(chalk.gray('\nMigrated Agent:'));
          const m = migratedManifest as OssaAgent;
          if (m.apiVersion) {
            console.log(`  Name: ${chalk.cyan(m.metadata?.name || 'unknown')}`);
            console.log(
              `  Version: ${chalk.cyan(m.metadata?.version || '0.1.0')}`
            );
            console.log(`  Role: ${chalk.cyan(m.spec?.role || 'unknown')}`);
            if (m.spec?.tools) {
              console.log(`  Tools: ${chalk.cyan(m.spec.tools.length)}`);
            }
          } else {
            console.log(`  ID: ${chalk.cyan(m.agent?.id || 'unknown')}`);
            console.log(`  Name: ${chalk.cyan(m.agent?.name || 'unknown')}`);
            console.log(
              `  Version: ${chalk.cyan(m.agent?.version || 'unknown')}`
            );
            console.log(`  Role: ${chalk.cyan(m.agent?.role || 'unknown')}`);
          }
          console.log(`\nSaved to: ${chalk.cyan(outputPath)}`);

          if (validationResult.warnings.length > 0) {
            console.log(chalk.yellow('\n⚠  Warnings:'));
            validationResult.warnings.forEach((warning) => {
              console.log(chalk.yellow(`  - ${warning}`));
            });
          }

          console.log(chalk.yellow('\n💡 Next steps:'));
          console.log(chalk.gray('  1. Review the migrated manifest'));
          console.log(
            chalk.gray(
              `  2. Validate: ${chalk.white(`ossa validate ${outputPath}`)}`
            )
          );
          console.log(
            chalk.gray(`  3. Update capabilities to OpenAPI-style operations`)
          );
        }

        process.exit(0);
      } catch (error) {
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : String(error)
        );

        if (options.verbose && error instanceof Error) {
          console.error(chalk.gray(error.stack));
        }

        process.exit(1);
      }
    }
  );
