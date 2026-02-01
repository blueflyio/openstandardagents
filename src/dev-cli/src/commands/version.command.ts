/**
 * Version Management Commands
 *
 * SOLID: Single Responsibility - Version management only
 * DRY: Reuses Zod schemas from schemas/version.schema.ts
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { VersionReleaseService } from '../services/version-release.service.js';
import { VersionValidateService } from '../services/version-validate.service.js';
import { VersionSyncService } from '../services/version-sync.service.js';
import { VersionDetectionService } from '../services/version-detection.service.js';
import { VersionAuditService } from '../services/version-audit.service.js';

export const versionCommand = new Command('version')
  .alias('ver')
  .alias('v')
  .description('Version management commands');

// version:release - ONE command to release
versionCommand
  .command('release')
  .alias('rel')
  .description('Release a new version (one command to release)')
  .argument('[bumpType]', 'Version bump type (patch, minor, major)', 'patch')
  .option('--dry-run', "Dry run mode (don't actually change files)", false)
  .option('--skip-validation', 'Skip validation after bump', false)
  .action(
    async (
      bumpType: string,
      options: { dryRun: boolean; skipValidation: boolean }
    ) => {
      console.log(chalk.blue('🚀 OSSA Version Release'));
      console.log(chalk.gray('========================\n'));

      const service = new VersionReleaseService();
      try {
        const result = await service.release({
          bumpType: bumpType as 'patch' | 'minor' | 'major',
          dryRun: options.dryRun,
          skipValidation: options.skipValidation,
        });

        if (result.success) {
          console.log(
            chalk.green(
              `\n✅ Release prepared: ${result.oldVersion} → ${result.newVersion}`
            )
          );
          console.log(chalk.gray(`\nFiles changed: ${result.changes.length}`));
          result.changes.forEach((change) =>
            console.log(chalk.gray(`  • ${change}`))
          );

          if (result.nextSteps.length > 0) {
            console.log(chalk.yellow('\n📋 Next steps:'));
            result.nextSteps.forEach((step) =>
              console.log(chalk.yellow(`  • ${step}`))
            );
          }
        } else {
          console.error(chalk.red('\n❌ Release failed'));
          process.exit(1);
        }
      } catch (error) {
        console.error(
          chalk.red(
            `\n❌ Error: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    }
  );

// version:validate - Validate version consistency
versionCommand
  .command('validate')
  .alias('val')
  .description('Validate version consistency')
  .action(async () => {
    console.log(chalk.blue('✅ OSSA Version Validation'));
    console.log(chalk.gray('==========================\n'));

    const service = new VersionValidateService();
    try {
      const result = await service.validate();

      if (result.valid) {
        console.log(chalk.green('✅ All version references are consistent!'));
        if (result.warnings.length > 0) {
          console.log(chalk.yellow('\n⚠️  Warnings:'));
          result.warnings.forEach((warn: string) =>
            console.log(chalk.yellow(`  • ${warn}`))
          );
        }
      } else {
        console.error(chalk.red('\n❌ Version validation failed:\n'));
        result.errors.forEach((err: string) =>
          console.error(chalk.red(`  • ${err}`))
        );
        process.exit(1);
      }
    } catch (error) {
      console.error(
        chalk.red(
          `\n❌ Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });

// version:sync - Sync 0.3.4 placeholders
versionCommand
  .command('sync')
  .description('Sync 0.3.4 placeholders with actual version')
  .option('--version <version>', 'Version to use (defaults to .version.json)')
  .option('--files <files...>', 'Specific files to sync (defaults to all)')
  .action(async (options: { version?: string; files?: string[] }) => {
    console.log(chalk.blue('🔄 OSSA Version Sync'));
    console.log(chalk.gray('=====================\n'));

    const service = new VersionSyncService();
    try {
      const result = await service.sync({
        version: options.version,
        files: options.files,
      });

      if (result.success) {
        console.log(chalk.green(`\n✅ Synced ${result.filesUpdated} file(s)`));
        if (result.files.length > 0) {
          console.log(chalk.gray('\nFiles updated:'));
          result.files.forEach((file: string) =>
            console.log(chalk.gray(`  • ${file}`))
          );
        }
      } else {
        console.error(chalk.red('\n❌ Sync failed'));
        process.exit(1);
      }
    } catch (error) {
      console.error(
        chalk.red(
          `\n❌ Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });

// version:detect - Detect version from git tags and update .version.json
versionCommand
  .command('detect')
  .alias('d')
  .description('Detect version from git tags and update .version.json')
  .action(async () => {
    console.log(chalk.blue('🔍 OSSA Version Detection'));
    console.log(chalk.gray('===========================\n'));

    const service = new VersionDetectionService();
    try {
      const result = await service.detectVersion();

      console.log(chalk.green('✅ Version detected successfully!'));
      console.log(chalk.gray('\nVersion Information:'));
      console.log(chalk.gray(`  • Current: ${result.current}`));
      console.log(chalk.gray(`  • Latest Stable: ${result.latest_stable}`));
      console.log(chalk.gray(`  • Latest Tag: ${result.latest_tag}`));
      console.log(chalk.gray(`  • Spec Path: ${result.spec_path}`));
      console.log(chalk.gray(`  • Schema File: ${result.schema_file}`));
      console.log(
        chalk.gray(`\n✅ Updated .version.json with detected version`)
      );
    } catch (error) {
      console.error(
        chalk.red(
          `\n❌ Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });

// version:audit - Audit for hardcoded versions
versionCommand
  .command('audit')
  .alias('a')
  .description('Audit for hardcoded versions (not using placeholders)')
  .option('--fix', 'Automatically replace hardcoded versions with {{VERSION}}', false)
  .action(async (options: { fix: boolean }) => {
    console.log(chalk.blue('🔍 OSSA Version Audit'));
    console.log(chalk.gray('=======================\n'));

    const service = new VersionAuditService();
    try {
      const result = await service.audit({ fix: options.fix });

      if (result.total === 0) {
        console.log(chalk.green('✅ No hardcoded versions found!'));
      } else {
        console.log(
          chalk.yellow(
            `⚠️  Found ${result.total} hardcoded version(s) in ${result.files.length} location(s):\n`
          )
        );

        result.files.forEach((file) => {
          console.log(chalk.gray(`  ${file.path}:${file.line}`));
          console.log(chalk.red(`    - ${file.content}`));
          console.log(chalk.green(`    + ${file.suggested}`));
          console.log('');
        });

        if (options.fix && result.fixed) {
          console.log(
            chalk.green(`\n✅ Fixed ${result.fixed} file(s) automatically`)
          );
        } else if (!options.fix) {
          console.log(
            chalk.yellow('\nRun with --fix to automatically replace hardcoded versions')
          );
        }
      }
    } catch (error) {
      console.error(
        chalk.red(
          `\n❌ Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });
