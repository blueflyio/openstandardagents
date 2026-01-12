/**
 * Release Management Commands
 * 
 * SOLID: Single Responsibility - Release operations only
 * DRY: Reuses existing services and schemas
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { ReleaseVerifyService } from '../services/release-verify.service.js';
import { releasePrepCommand } from './release-prep.command.js';

export const releaseCommand = new Command('release')
  .alias('rel')
  .description('Release management commands');

// Add prep subcommand
releaseCommand.addCommand(releasePrepCommand);

// release:verify - Verify release readiness
releaseCommand
  .command('verify')
  .alias('check')
  .description('Verify release readiness (versions, tags, CI config)')
  .option('--version <version>', 'Version to verify (defaults to current version)')
  .option('--skip-build-tests', 'Skip build and test validation', false)
  .option('--skip-ci-config', 'Skip CI configuration validation', false)
  .action(async (options: { version?: string; skipBuildTests?: boolean; skipCIConfig?: boolean }) => {
    console.log(chalk.blue('🔍 OSSA Release Readiness Verification'));
    console.log(chalk.gray('======================================\n'));

    const service = new ReleaseVerifyService();
    try {
      // Validate request with Zod (OpenAPI-first)
      const request = {
        version: options.version,
        skipBuildTests: options.skipBuildTests || false,
        skipCIConfig: options.skipCIConfig || false,
      };
      const result = await service.verify(request);

      // Display checks (structured by domain - DRY)
      console.log(chalk.blue('\n1. Repository Identity & Safety'));
      console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      result.repository.checks.forEach(check => {
        if (check.passed) {
          console.log(chalk.green(`  ✓ ${check.name}: ${check.message}`));
        } else {
          console.log(chalk.red(`  ✗ ${check.name}: ${check.message}`));
        }
      });

      console.log(chalk.blue('\n2. Version Correctness'));
      console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      result.versionState.checks.forEach(check => {
        if (check.passed) {
          console.log(chalk.green(`  ✓ ${check.name}: ${check.message}`));
        } else {
          console.log(chalk.red(`  ✗ ${check.name}: ${check.message}`));
        }
      });

      console.log(chalk.blue('\n3. Tags Sanity'));
      console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      result.tagState.checks.forEach(check => {
        if (check.passed) {
          console.log(chalk.green(`  ✓ ${check.name}: ${check.message}`));
        } else {
          console.log(chalk.red(`  ✗ ${check.name}: ${check.message}`));
        }
      });

      if (result.ciConfig) {
        console.log(chalk.blue('\n4. CI Configuration'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        result.ciConfig.checks.forEach(check => {
          if (check.passed) {
            console.log(chalk.green(`  ✓ ${check.name}: ${check.message}`));
          } else {
            console.log(chalk.red(`  ✗ ${check.name}: ${check.message}`));
          }
        });
      }

      // Display warnings
      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\n⚠️  Warnings:'));
        result.warnings.forEach(warn => console.log(chalk.yellow(`  • ${warn}`)));
      }

      // Display errors
      if (result.errors.length > 0) {
        console.log(chalk.red('\n❌ Errors:'));
        result.errors.forEach(err => console.log(chalk.red(`  • ${err}`)));
      }

      // Summary
      console.log(chalk.blue('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.blue('Release Readiness Summary'));
      console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(`Version: ${result.version}`);
      console.log(`Version Tag: ${result.versionTag}`);
      
      if (result.ready) {
        console.log(chalk.green('\n✅ All checks passed. Repository is ready for release.\n'));
        
        if (result.nextSteps.length > 0) {
          console.log(chalk.yellow('📋 Next steps:'));
          result.nextSteps.forEach(step => console.log(chalk.yellow(`  • ${step}`)));
        }
      } else {
        console.log(chalk.red('\n❌ Release readiness checks failed. Fix errors above before proceeding.\n'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });
