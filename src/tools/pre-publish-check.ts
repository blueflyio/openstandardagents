#!/usr/bin/env tsx
/**
 * Pre-Publish Checklist
 *
 * Validates that the package is ready for npm publication.
 * This script checks everything that should be verified BEFORE
 * running `npm publish`.
 *
 * Exit codes:
 * - 0: All checks passed, ready to publish
 * - 1: Some checks failed, DO NOT publish
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import chalk from 'chalk';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

class PrePublishChecker {
  private results: CheckResult[] = [];
  private pkgPath: string;
  private pkg: any;

  constructor() {
    this.pkgPath = join(process.cwd(), 'package.json');
    this.pkg = JSON.parse(readFileSync(this.pkgPath, 'utf-8'));
  }

  /**
   * Run all pre-publish checks
   */
  async runAllChecks(): Promise<void> {
    console.log(chalk.bold.blue('🔍 Running Pre-Publish Checks\n'));
    console.log(chalk.gray('Package: ' + chalk.white(this.pkg.name)));
    console.log(chalk.gray('Version: ' + chalk.white(this.pkg.version)));
    console.log(chalk.gray('─'.repeat(60) + '\n'));

    // Critical checks (must pass)
    await this.checkPackageMetadata();
    await this.checkBuildSuccess();
    await this.checkRequiredFiles();
    await this.checkNoPrivateFlag();
    await this.checkPublishConfig();

    // Important checks (should pass)
    await this.checkTests();
    await this.checkLinting();
    await this.checkChangelogUpdated();

    // Advisory checks (warnings only)
    await this.checkDependencies();
    await this.checkReadme();
    await this.checkExamples();

    // Print results
    this.printResults();
  }

  /**
   * Check package.json metadata is complete
   */
  private async checkPackageMetadata(): Promise<void> {
    const required = ['name', 'version', 'description', 'license', 'author'];
    const missing = required.filter((field) => !this.pkg[field]);

    if (missing.length > 0) {
      this.results.push({
        name: 'Package Metadata',
        status: 'fail',
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    } else {
      this.results.push({
        name: 'Package Metadata',
        status: 'pass',
        message: 'All required fields present',
      });
    }

    // Check repository field
    if (!this.pkg.repository?.url) {
      this.results.push({
        name: 'Repository URL',
        status: 'warn',
        message: 'Repository URL not set (recommended)',
      });
    }

    // Check keywords
    if (!this.pkg.keywords || this.pkg.keywords.length < 3) {
      this.results.push({
        name: 'Keywords',
        status: 'warn',
        message: 'Add more keywords for better npm discoverability',
      });
    }
  }

  /**
   * Check build succeeds
   */
  private async checkBuildSuccess(): Promise<void> {
    try {
      console.log(chalk.gray('  Building package...'));
      execSync('npm run build:clean', { stdio: 'pipe' });
      this.results.push({
        name: 'Build',
        status: 'pass',
        message: 'Package builds successfully',
      });
    } catch (error: any) {
      this.results.push({
        name: 'Build',
        status: 'fail',
        message: 'Build failed - see errors above',
      });
    }
  }

  /**
   * Check required files exist
   */
  private async checkRequiredFiles(): Promise<void> {
    const required = ['README.md', 'LICENSE', 'CHANGELOG.md', 'dist/'];
    const missing = required.filter(
      (file) => !existsSync(join(process.cwd(), file))
    );

    if (missing.length > 0) {
      this.results.push({
        name: 'Required Files',
        status: 'fail',
        message: `Missing files: ${missing.join(', ')}`,
      });
    } else {
      this.results.push({
        name: 'Required Files',
        status: 'pass',
        message: 'All required files present',
      });
    }
  }

  /**
   * Check package is not marked private
   */
  private async checkNoPrivateFlag(): Promise<void> {
    if (this.pkg.private === true) {
      this.results.push({
        name: 'Private Flag',
        status: 'fail',
        message: 'Package is marked as private - cannot publish to npm',
      });
    } else {
      this.results.push({
        name: 'Private Flag',
        status: 'pass',
        message: 'Package is public',
      });
    }
  }

  /**
   * Check publishConfig is correct
   */
  private async checkPublishConfig(): Promise<void> {
    if (!this.pkg.publishConfig) {
      this.results.push({
        name: 'Publish Config',
        status: 'warn',
        message: 'No publishConfig set (will use defaults)',
      });
      return;
    }

    if (this.pkg.publishConfig.access !== 'public') {
      this.results.push({
        name: 'Publish Config',
        status: 'warn',
        message: 'publishConfig.access should be "public" for scoped packages',
      });
    } else {
      this.results.push({
        name: 'Publish Config',
        status: 'pass',
        message: 'publishConfig.access set to public',
      });
    }
  }

  /**
   * Check tests pass
   */
  private async checkTests(): Promise<void> {
    try {
      console.log(chalk.gray('  Running tests...'));
      execSync('npm test', { stdio: 'pipe' });
      this.results.push({
        name: 'Tests',
        status: 'pass',
        message: 'All tests pass',
      });
    } catch (error: any) {
      this.results.push({
        name: 'Tests',
        status: 'fail',
        message: 'Tests failed',
      });
    }
  }

  /**
   * Check linting passes
   */
  private async checkLinting(): Promise<void> {
    try {
      console.log(chalk.gray('  Running linter...'));
      execSync('npm run lint', { stdio: 'pipe' });
      this.results.push({
        name: 'Linting',
        status: 'pass',
        message: 'No lint errors',
      });
    } catch (error: any) {
      this.results.push({
        name: 'Linting',
        status: 'warn',
        message: 'Lint errors found (should fix before publishing)',
      });
    }
  }

  /**
   * Check CHANGELOG was updated
   */
  private async checkChangelogUpdated(): Promise<void> {
    try {
      const changelog = readFileSync(
        join(process.cwd(), 'CHANGELOG.md'),
        'utf-8'
      );
      const version = this.pkg.version;

      if (
        changelog.includes(`[${version}]`) ||
        changelog.includes(`## ${version}`)
      ) {
        this.results.push({
          name: 'Changelog',
          status: 'pass',
          message: `Version ${version} documented in CHANGELOG.md`,
        });
      } else {
        this.results.push({
          name: 'Changelog',
          status: 'warn',
          message: `Version ${version} not found in CHANGELOG.md (should add release notes)`,
        });
      }
    } catch {
      this.results.push({
        name: 'Changelog',
        status: 'warn',
        message: 'CHANGELOG.md not found or not readable',
      });
    }
  }

  /**
   * Check dependencies are properly declared
   */
  private async checkDependencies(): Promise<void> {
    try {
      execSync('npm run validate:deps', { stdio: 'pipe' });
      this.results.push({
        name: 'Dependencies',
        status: 'pass',
        message: 'All imports are declared',
      });
    } catch {
      this.results.push({
        name: 'Dependencies',
        status: 'warn',
        message: 'Some imports may not be declared (check validate:deps)',
      });
    }
  }

  /**
   * Check README has installation and usage info
   */
  private async checkReadme(): Promise<void> {
    try {
      const readme = readFileSync(
        join(process.cwd(), 'README.md'),
        'utf-8'
      ).toLowerCase();

      const hasInstall =
        readme.includes('npm install') || readme.includes('installation');
      const hasUsage =
        readme.includes('usage') || readme.includes('getting started');

      if (hasInstall && hasUsage) {
        this.results.push({
          name: 'README',
          status: 'pass',
          message: 'README includes installation and usage',
        });
      } else {
        const missing = [];
        if (!hasInstall) missing.push('installation');
        if (!hasUsage) missing.push('usage');
        this.results.push({
          name: 'README',
          status: 'warn',
          message: `README missing: ${missing.join(', ')}`,
        });
      }
    } catch {
      this.results.push({
        name: 'README',
        status: 'fail',
        message: 'README.md not found',
      });
    }
  }

  /**
   * Check examples exist
   */
  private async checkExamples(): Promise<void> {
    const examplesDir = join(process.cwd(), 'examples');
    if (existsSync(examplesDir)) {
      this.results.push({
        name: 'Examples',
        status: 'pass',
        message: 'Examples directory exists',
      });
    } else {
      this.results.push({
        name: 'Examples',
        status: 'warn',
        message: 'No examples/ directory (recommended for better adoption)',
      });
    }
  }

  /**
   * Print all results
   */
  private printResults(): void {
    console.log(chalk.gray('\n' + '─'.repeat(60)));
    console.log(chalk.bold.blue('📊 Results\n'));

    const passing = this.results.filter((r) => r.status === 'pass');
    const failing = this.results.filter((r) => r.status === 'fail');
    const warnings = this.results.filter((r) => r.status === 'warn');

    // Print failures first
    if (failing.length > 0) {
      console.log(chalk.bold.red('❌ FAILED CHECKS:\n'));
      failing.forEach((result) => {
        console.log(chalk.red(`  ✗ ${result.name}`));
        console.log(chalk.gray(`    ${result.message}\n`));
      });
    }

    // Print warnings
    if (warnings.length > 0) {
      console.log(chalk.bold.yellow('⚠️  WARNINGS:\n'));
      warnings.forEach((result) => {
        console.log(chalk.yellow(`  ⚠ ${result.name}`));
        console.log(chalk.gray(`    ${result.message}\n`));
      });
    }

    // Print passing
    if (passing.length > 0) {
      console.log(chalk.bold.green('✅ PASSED:\n'));
      passing.forEach((result) => {
        console.log(chalk.green(`  ✓ ${result.name}`));
      });
      console.log('');
    }

    // Summary
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.bold('Summary:'));
    console.log(chalk.green(`  Passed:   ${passing.length}`));
    console.log(chalk.yellow(`  Warnings: ${warnings.length}`));
    console.log(chalk.red(`  Failed:   ${failing.length}`));
    console.log(chalk.gray('─'.repeat(60)));

    // Final verdict
    if (failing.length > 0) {
      console.log(chalk.bold.red('\n❌ NOT READY FOR PUBLICATION'));
      console.log(chalk.red('Fix all failed checks before publishing.\n'));
      process.exit(1);
    } else if (warnings.length > 0) {
      console.log(chalk.bold.yellow('\n⚠️  READY WITH WARNINGS'));
      console.log(
        chalk.yellow('Consider addressing warnings for better quality.\n')
      );
      console.log(chalk.green('Run: npm publish\n'));
      process.exit(0);
    } else {
      console.log(chalk.bold.green('\n✅ READY FOR PUBLICATION'));
      console.log(chalk.green('All checks passed! Safe to publish.\n'));
      console.log(chalk.blue('Next steps:'));
      console.log(
        chalk.gray(
          '  1. npm publish --dry-run  (preview what will be published)'
        )
      );
      console.log(
        chalk.gray('  2. npm publish           (publish to npm registry)\n')
      );
      process.exit(0);
    }
  }
}

// Run checks
const checker = new PrePublishChecker();
checker.runAllChecks().catch((err) => {
  console.error(chalk.red('💥 Pre-publish check crashed:'), err);
  process.exit(1);
});
