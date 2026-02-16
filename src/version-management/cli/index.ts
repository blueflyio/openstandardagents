#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { VersionManager } from '../core/version-manager';

const program = new Command();
const versionManager = new VersionManager();

program
  .name('ossa-version')
  .description('OSSA Version Management CLI')
  .version('1.0.0');

// Substitute command
program
  .command('substitute <version>')
  .alias('sub')
  .description('Replace {{VERSION}} placeholders with real version')
  .option('-p, --paths <patterns...>', 'File patterns to process', [
    '**/*.md',
    '**/*.json',
    '**/*.yaml',
    '**/*.yml',
  ])
  .option('-e, --exclude <patterns...>', 'File patterns to exclude', [
    'node_modules/**',
    '.git/**',
    'vendor/**',
    'dist/**',
    'build/**',
  ])
  .option('-d, --dry-run', 'Preview changes without modifying files', false)
  .option('--placeholder <string>', 'Custom placeholder pattern', '{{VERSION}}')
  .option('--cwd <path>', 'Working directory', process.cwd())
  .action(async (version: string, options) => {
    const spinner = ora('Substituting version placeholders...').start();

    try {
      const result = await versionManager.substitute({
        version,
        paths: options.paths,
        exclude: options.exclude,
        dryRun: options.dryRun,
        placeholder: options.placeholder,
        cwd: options.cwd,
      });

      spinner.succeed(chalk.green(result.message));

      console.log(chalk.cyan('\nSummary:'));
      console.log(`  Version: ${chalk.bold(result.versionUsed)}`);
      console.log(`  Files processed: ${chalk.bold(result.filesProcessed)}`);
      console.log(
        `  Replacements made: ${chalk.bold(result.replacementsMade)}`
      );

      if (result.files.length > 0) {
        console.log(chalk.cyan('\nFiles modified:'));
        result.files.forEach((file) => {
          console.log(
            `  ${chalk.gray(file.path)} (${file.replacements} replacements)`
          );
        });
      }

      if (options.dryRun) {
        console.log(
          chalk.yellow('\n⚠️  Dry run mode - no files were modified')
        );
      }

      process.exit(0);
    } catch (error) {
      spinner.fail(chalk.red('Failed to substitute version'));
      console.error(
        chalk.red(`\nError: ${error instanceof Error ? error.message : error}`)
      );
      process.exit(1);
    }
  });

// Restore command
program
  .command('restore [version]')
  .description('Restore {{VERSION}} placeholders')
  .option('-a, --all', 'Restore all versions to placeholder', false)
  .option('-p, --paths <patterns...>', 'File patterns to process', [
    '**/*.md',
    '**/*.json',
    '**/*.yaml',
    '**/*.yml',
  ])
  .option('-e, --exclude <patterns...>', 'File patterns to exclude', [
    'node_modules/**',
    '.git/**',
    'vendor/**',
    'dist/**',
    'build/**',
  ])
  .option('--placeholder <string>', 'Custom placeholder pattern', '{{VERSION}}')
  .option('--cwd <path>', 'Working directory', process.cwd())
  .action(async (version: string | undefined, options) => {
    if (!version && !options.all) {
      console.error(
        chalk.red('Error: Either provide a version or use --all flag')
      );
      process.exit(1);
    }

    const spinner = ora('Restoring version placeholders...').start();

    try {
      const result = await versionManager.restore({
        version,
        restoreAll: options.all,
        paths: options.paths,
        exclude: options.exclude,
        placeholder: options.placeholder,
        cwd: options.cwd,
      });

      spinner.succeed(chalk.green(result.message));

      console.log(chalk.cyan('\nSummary:'));
      if (result.versionRestored) {
        console.log(
          `  Version restored: ${chalk.bold(result.versionRestored)}`
        );
      }
      console.log(`  Files processed: ${chalk.bold(result.filesProcessed)}`);
      console.log(
        `  Replacements made: ${chalk.bold(result.replacementsMade)}`
      );

      if (result.files.length > 0) {
        console.log(chalk.cyan('\nFiles modified:'));
        result.files.forEach((file) => {
          console.log(
            `  ${chalk.gray(file.path)} (${file.replacements} replacements)`
          );
        });
      }

      process.exit(0);
    } catch (error) {
      spinner.fail(chalk.red('Failed to restore version'));
      console.error(
        chalk.red(`\nError: ${error instanceof Error ? error.message : error}`)
      );
      process.exit(1);
    }
  });

// Detect command
program
  .command('detect')
  .description('Auto-detect version from project sources')
  .option('-d, --directory <path>', 'Directory to search', process.cwd())
  .option('-s, --sources <sources...>', 'Specific sources to check', [
    'git_tag',
    'package_json',
    'composer_json',
    'VERSION_file',
    'pyproject_toml',
    'cargo_toml',
  ])
  .action(async (options) => {
    const spinner = ora('Detecting version...').start();

    try {
      const result = await versionManager.detect({
        directory: options.directory,
        sources: options.sources,
      });

      spinner.succeed(
        chalk.green(`Detected version: ${chalk.bold(result.version)}`)
      );

      console.log(chalk.cyan('\nDetails:'));
      console.log(`  Source: ${chalk.bold(result.source)}`);

      if (Object.keys(result.allSources).length > 1) {
        console.log(chalk.cyan('\nAll detected versions:'));
        Object.entries(result.allSources).forEach(([source, version]) => {
          const indicator =
            source === result.source ? chalk.green('✓') : chalk.gray(' ');
          console.log(`  ${indicator} ${chalk.gray(source)}: ${version}`);
        });
      }

      process.exit(0);
    } catch (error) {
      spinner.fail(chalk.red('Failed to detect version'));
      console.error(
        chalk.red(`\nError: ${error instanceof Error ? error.message : error}`)
      );
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate <version>')
  .description('Validate semantic version format')
  .action((version: string) => {
    const result = versionManager.validate(version);

    if (result.valid) {
      console.log(
        chalk.green(`✓ Valid semantic version: ${chalk.bold(version)}`)
      );

      if (result.parsed) {
        console.log(chalk.cyan('\nParsed components:'));
        console.log(`  Major: ${chalk.bold(result.parsed.major)}`);
        console.log(`  Minor: ${chalk.bold(result.parsed.minor)}`);
        console.log(`  Patch: ${chalk.bold(result.parsed.patch)}`);
        if (result.parsed.prerelease) {
          console.log(`  Prerelease: ${chalk.bold(result.parsed.prerelease)}`);
        }
        if (result.parsed.build) {
          console.log(`  Build: ${chalk.bold(result.parsed.build)}`);
        }
      }

      process.exit(0);
    } else {
      console.log(
        chalk.red(`✗ Invalid semantic version: ${chalk.bold(version)}`)
      );

      if (result.errors) {
        console.log(chalk.red('\nErrors:'));
        result.errors.forEach((error) => {
          console.log(`  • ${error}`);
        });
      }

      process.exit(1);
    }
  });

// Bump command
program
  .command('bump <version> <type>')
  .description('Bump version according to semver rules')
  .option(
    '--prerelease <identifier>',
    'Prerelease identifier (e.g., alpha, beta, rc)'
  )
  .action((version: string, type: string, options) => {
    try {
      const bumpType = type as 'major' | 'minor' | 'patch' | 'prerelease';

      if (!['major', 'minor', 'patch', 'prerelease'].includes(bumpType)) {
        throw new Error(
          'Bump type must be: major, minor, patch, or prerelease'
        );
      }

      const result = versionManager.bump(version, bumpType, options.prerelease);

      console.log(chalk.green(`✓ Version bumped successfully`));
      console.log(chalk.cyan('\nDetails:'));
      console.log(`  Old version: ${chalk.bold(result.oldVersion)}`);
      console.log(
        `  New version: ${chalk.bold(chalk.green(result.newVersion))}`
      );
      console.log(`  Bump type: ${chalk.bold(result.bumpType)}`);

      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`✗ Failed to bump version`));
      console.error(
        chalk.red(`\nError: ${error instanceof Error ? error.message : error}`)
      );
      process.exit(1);
    }
  });

program.parse();
