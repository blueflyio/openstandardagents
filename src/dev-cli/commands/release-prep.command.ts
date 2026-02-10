/**
 * Release Preparation Command
 *
 * Pre-release validation for GitLab, GitHub, and npmjs readiness.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { ReleasePrepService } from '../services/release-prep.service.js';

export const releasePrepCommand = new Command('prep')
  .alias('prepare')
  .description(
    'Prepare release - comprehensive validation for GitLab, GitHub, and npmjs'
  );

releasePrepCommand
  .command('current')
  .description('Prepare current version for release')
  .option('--dry-run', 'Dry run mode (validate only, no changes)', false)
  .option('--skip-github', 'Skip GitHub validation', false)
  .option('--skip-npm', 'Skip NPM validation', false)
  .action(
    async (options: {
      dryRun: boolean;
      skipGithub: boolean;
      skipNpm: boolean;
    }) => {
      console.log(chalk.blue('🚀 OSSA Release Preparation - v0.3.3'));
      console.log(chalk.gray('==========================================\n'));

      if (options.dryRun) {
        console.log(chalk.yellow('DRY RUN MODE - No changes will be made\n'));
      }

      const service = new ReleasePrepService();
      try {
        const result = await service.prepare({
          version: '0.4.5',
          dryRun: options.dryRun,
          skipGitHub: options.skipGithub,
          skipNPM: options.skipNpm,
        });

        // Display checklist
        console.log(chalk.blue('\n📋 Release Readiness Checklist'));
        console.log(
          chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        );

        const categories = [
          ...new Set(result.checklist.map((c) => c.category)),
        ];
        for (const category of categories) {
          console.log(chalk.blue(`\n${category}:`));
          result.checklist
            .filter((c) => c.category === category)
            .forEach((item) => {
              const icon =
                item.status === 'pass'
                  ? '✓'
                  : item.status === 'fail'
                    ? '✗'
                    : item.status === 'warning'
                      ? '⚠'
                      : '⊘';
              const color =
                item.status === 'pass'
                  ? chalk.green
                  : item.status === 'fail'
                    ? chalk.red
                    : item.status === 'warning'
                      ? chalk.yellow
                      : chalk.gray;
              console.log(color(`  ${icon} ${item.item}: ${item.message}`));
            });
        }

        // Display platform status
        console.log(chalk.blue('\n\n🌐 Platform Status'));
        console.log(
          chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        );

        console.log(chalk.blue('\nGitLab:'));
        console.log(`  Remote: ${result.gitlab.remoteUrl}`);
        console.log(`  Branch: ${result.gitlab.branch}`);
        console.log(
          `  Tag exists: ${result.gitlab.tagExists ? chalk.red('YES') : chalk.green('NO')}`
        );
        console.log(
          `  Tag can be created: ${result.gitlab.tagCanBeCreated ? chalk.green('YES') : chalk.red('NO')}`
        );
        console.log(
          `  CI token: ${result.gitlab.ciTokenConfigured ? chalk.green('Configured') : chalk.yellow('Not configured')}`
        );

        if (result.github) {
          console.log(chalk.blue('\nGitHub:'));
          console.log(
            `  Remote configured: ${result.github.remoteConfigured ? chalk.green('YES') : chalk.yellow('NO')}`
          );
          console.log(
            `  Token configured: ${result.github.tokenConfigured ? chalk.green('YES') : chalk.yellow('NO')}`
          );
          console.log(
            `  Ready: ${result.github.ready ? chalk.green('YES') : chalk.red('NO')}`
          );
        }

        if (result.npm) {
          console.log(chalk.blue('\nNPM:'));
          console.log(`  Package: ${result.npm.packageName}`);
          console.log(
            `  Version exists: ${result.npm.versionExists ? chalk.red('YES') : chalk.green('NO')}`
          );
          console.log(
            `  Current published: ${result.npm.currentPublishedVersion || 'N/A'}`
          );
          console.log(
            `  Token configured: ${result.npm.tokenConfigured ? chalk.green('YES') : chalk.red('NO')}`
          );
          console.log(
            `  Registry accessible: ${result.npm.registryAccessible ? chalk.green('YES') : chalk.yellow('NO')}`
          );
          console.log(
            `  Ready: ${result.npm.ready ? chalk.green('YES') : chalk.red('NO')}`
          );
        }

        // Display errors
        if (result.allErrors.length > 0) {
          console.log(chalk.red('\n\n❌ ERRORS (MUST FIX):'));
          result.allErrors.forEach((err) =>
            console.log(chalk.red(`  • ${err}`))
          );
        }

        // Display warnings
        if (result.allWarnings.length > 0) {
          console.log(chalk.yellow('\n⚠️  WARNINGS:'));
          result.allWarnings.forEach((warn) =>
            console.log(chalk.yellow(`  • ${warn}`))
          );
        }

        // Summary
        console.log(
          chalk.blue('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        );
        console.log(chalk.blue('Release Preparation Summary'));
        console.log(
          chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        );
        console.log(`Version: ${result.version}`);
        console.log(`Version Tag: ${result.versionTag}`);

        if (result.ready) {
          console.log(chalk.green('\n✅ READY FOR RELEASE\n'));

          if (result.nextSteps.length > 0) {
            console.log(chalk.yellow('📋 Next Steps:'));
            result.nextSteps.forEach((step) =>
              console.log(chalk.yellow(`  ${step}`))
            );
          }

          if (result.rollbackPlan.length > 0) {
            console.log(chalk.gray('\n🔄 Rollback Plan (if needed):'));
            result.rollbackPlan.forEach((step) =>
              console.log(chalk.gray(`  • ${step}`))
            );
          }
        } else {
          console.log(chalk.red('\n❌ NOT READY FOR RELEASE\n'));
          console.log(chalk.red('Fix all errors before proceeding.'));
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
