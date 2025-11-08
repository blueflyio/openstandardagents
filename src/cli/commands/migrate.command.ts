/**
 * OSSA Migrate Command
 * Migrate manifests to v0.2.2 format (from v0.1.9 or v1.0)
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { MigrationService } from '../../services/migration.service.js';
import { ValidationService } from '../../services/validation.service.js';

export const migrateCommand = new Command('migrate')
  .argument('<source>', 'Path to manifest or directory to migrate')
  .option('-o, --output <path>', 'Output path for migrated manifest')
  .option(
    '-r, --recursive',
    'Recursively migrate all .ossa.yaml files in directory'
  )
  .option('--to <version>', 'Target version (v0.2.2 or v1.0)', 'v0.2.2')
  .option('--dry-run', 'Show migration preview without writing file')
  .option('-v, --verbose', 'Verbose output')
  .description(
    'Migrate OSSA manifests between versions (v0.1.9 to v0.2.2, v1.0 to v0.2.2)'
  )
  .action(
    async (
      source: string,
      options: {
        output?: string;
        dryRun?: boolean;
        verbose?: boolean;
      }
    ) => {
      try {
        // Get services
        const migrationService = container.get(MigrationService);
        const manifestRepo = container.get(ManifestRepository);
        const validationService = container.get(ValidationService);

        console.log(chalk.blue(`Migrating ${source} to v0.2.2...`));

        // Load legacy manifest
        const legacyManifest = await manifestRepo.load(source);

        // Check if migration is needed
        if (!migrationService.needsMigration(legacyManifest)) {
          const m = legacyManifest as any;
          if (m.apiVersion === 'ossa/v1' && m.kind === 'Agent') {
            console.log(chalk.green('✓ Manifest is already in v0.2.2 format'));
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

        // Validate migrated manifest
        const validationResult = await validationService.validate(
          migratedManifest,
          '0.2.2'
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
          // Determine output path
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
                  '.v0.2.2.ossa.$1'
                );
              }
              // Otherwise add .v0.2.2.ossa before extension
              return path.replace(/\.(yaml|yml|json)$/, '.v0.2.2.ossa.$1');
            })();

          // Save migrated manifest
          await manifestRepo.save(outputPath, migratedManifest);

          console.log(chalk.green('✓ Migration successful'));
          console.log(chalk.gray('\nMigrated Agent:'));
          const m = migratedManifest as any;
          if (m.apiVersion) {
            console.log(`  Name: ${chalk.cyan(m.metadata.name)}`);
            console.log(
              `  Version: ${chalk.cyan(m.metadata.version || '0.1.0')}`
            );
            console.log(`  Role: ${chalk.cyan(m.spec.role)}`);
            if (m.spec.tools) {
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
