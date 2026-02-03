/**
 * OSSA Upgrade Command
 * Automatically upgrades agent manifests to the latest OSSA schema version
 *
 * HUGE ADOPTION FEATURE - Auto-migration to latest spec
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { MigrationService } from '../../services/migration.service.js';
import { ValidationService } from '../../services/validation.service.js';
import { getApiVersion } from '../../utils/version.js';
import {
  addGlobalOptions,
  shouldUseColor,
  ExitCode,
} from '../utils/standard-options.js';

export const upgradeCommand = new Command('upgrade')
  .argument('<path>', 'Path to OSSA manifest or directory')
  .option('--dry-run', 'Show what would be upgraded without making changes')
  .option('--backup', 'Create backup before upgrading (default: true)', true)
  .option('--recursive', 'Upgrade all manifests in directory recursively')
  .option('--target-version <version>', 'Target OSSA version (default: latest)')
  .description('Automatically upgrade manifest(s) to latest OSSA schema');

addGlobalOptions(upgradeCommand);

upgradeCommand.action(
  async (
    inputPath: string,
    options: {
      dryRun?: boolean;
      backup?: boolean;
      recursive?: boolean;
      targetVersion?: string;
      verbose?: boolean;
      quiet?: boolean;
      json?: boolean;
      color?: boolean;
    }
  ) => {
    const useColor = shouldUseColor(options);
    const log = (msg: string, color?: (s: string) => string) => {
      if (options.quiet) return;
      const output = useColor && color ? color(msg) : msg;
      console.log(output);
    };

    try {
      const manifestRepo = container.get(ManifestRepository);
      const migrationService = container.get(MigrationService);
      const validationService = container.get(ValidationService);

      const targetVersion = options.targetVersion || getApiVersion();

      // Determine if path is file or directory
      let stats;
      try {
        stats = fs.statSync(inputPath);
      } catch (error) {
        log(chalk.red(`❌ Path not found: ${inputPath}`));
        process.exit(ExitCode.MISUSE);
      }
      const files: string[] = [];

      if (stats.isDirectory()) {
        if (!options.recursive) {
          log(
            chalk.yellow(
              '⚠️  Path is a directory. Use --recursive to upgrade all manifests'
            )
          );
          process.exit(ExitCode.MISUSE);
        }

        // Find all OSSA manifests in directory
        files.push(...findManifests(inputPath, options.recursive));

        if (files.length === 0) {
          log(chalk.yellow('No OSSA manifests found in directory'));
          process.exit(ExitCode.SUCCESS);
        }

        log(chalk.bold(`\n🔄 Found ${files.length} manifest(s) to upgrade\n`));
      } else {
        files.push(inputPath);
      }

      let upgraded = 0;
      let skipped = 0;
      let failed = 0;

      for (const file of files) {
        try {
          log(chalk.cyan(`\n📄 Processing: ${path.basename(file)}`));

          // Load manifest
          const manifest = await manifestRepo.load(file);
          const currentVersion = manifest.apiVersion || 'unknown';

          log(
            chalk.gray(`   Current version: ${currentVersion}`)
          );

          // Check if upgrade needed
          if (currentVersion === targetVersion) {
            log(chalk.green('   ✓ Already at latest version'));
            skipped++;
            continue;
          }

          // Validate current manifest
          const validation = await validationService.validate(manifest);
          if (!validation.valid && !options.dryRun) {
            log(
              chalk.yellow(
                '   ⚠️  Current manifest has validation errors - upgrading anyway'
              )
            );
          }

          // Perform migration
          const migrated = await migrationService.migrate(
            manifest,
            targetVersion
          );

          if (options.dryRun) {
            log(
              chalk.blue(`   → Would upgrade to: ${targetVersion}`)
            );
            log(chalk.gray('     (dry-run mode, no changes made)'));
            upgraded++;
            continue;
          }

          // Validate migrated manifest
          const migratedValidation = await validationService.validate(migrated);
          if (!migratedValidation.valid) {
            log(
              chalk.red(
                '   ✗ Upgraded manifest failed validation - not saving'
              )
            );
            if (options.verbose && migratedValidation.errors) {
              migratedValidation.errors.forEach((error) => {
                log(chalk.gray(`     - ${error.message}`));
              });
            }
            failed++;
            continue;
          }

          // Create backup
          if (options.backup) {
            const backupPath = `${file}.backup`;
            fs.copyFileSync(file, backupPath);
            log(
              chalk.gray(`   📦 Backup created: ${path.basename(backupPath)}`)
            );
          }

          // Write upgraded manifest
          const content = JSON.stringify(migrated, null, 2);
          fs.writeFileSync(file, content, 'utf-8');

          log(
            chalk.green(`   ✓ Upgraded to: ${targetVersion}`)
          );
          upgraded++;
        } catch (error) {
          log(
            chalk.red(
              `   ✗ Failed: ${error instanceof Error ? error.message : String(error)}`
            )
          );
          failed++;
        }
      }

      // Summary
      log(chalk.bold('\n📊 Summary:'));
      log(chalk.green(`   ✓ Upgraded: ${upgraded}`));
      if (skipped > 0) log(chalk.blue(`   → Skipped: ${skipped}`));
      if (failed > 0) log(chalk.red(`   ✗ Failed: ${failed}`));
      log('');

      if (failed > 0) {
        process.exit(ExitCode.GENERAL_ERROR);
      }

      process.exit(ExitCode.SUCCESS);
    } catch (error) {
      log(
        chalk.red(
          `❌ Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      if (options.verbose && error instanceof Error && error.stack) {
        log(chalk.gray(error.stack));
      }
      process.exit(ExitCode.GENERAL_ERROR);
    }
  }
);

/**
 * Find all OSSA manifests in directory
 */
function findManifests(dir: string, recursive: boolean): string[] {
  const manifests: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && recursive) {
      manifests.push(...findManifests(fullPath, recursive));
    } else if (entry.isFile()) {
      // Check if it's an OSSA manifest
      if (
        entry.name.endsWith('.ossa.yaml') ||
        entry.name.endsWith('.ossa.yml') ||
        entry.name.endsWith('.ossa.json') ||
        entry.name === 'agent.yaml' ||
        entry.name === 'agent.json'
      ) {
        manifests.push(fullPath);
      }
    }
  }

  return manifests;
}
