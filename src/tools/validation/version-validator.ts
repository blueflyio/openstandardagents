/**
 * Version Validator
 *
 * SOLID: Single Responsibility - Validates version placeholders
 * Zod: Validates version structure
 * DRY: Reusable validation logic
 */

import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { glob } from 'glob';

const PLACEHOLDER_VERSION = '0.3.4';
const VersionPlaceholderSchema = z.literal(PLACEHOLDER_VERSION);

export class VersionValidator {
  private errors = 0;
  private messages: string[] = [];
  private isReleaseBranch = false;

  /**
   * Validate version placeholders
   * CRUD: Read operation (validates files)
   */
  async validate(): Promise<{ errors: number; messages: string[] }> {
    this.errors = 0;
    this.messages = [];
    this.isReleaseBranch = this.detectReleaseBranch();

    // Check package.json
    if (existsSync('package.json')) {
      this.validatePackageJson();
    }

    // Skip .version.json - it's the SOURCE OF TRUTH for versions
    // It should contain actual version numbers, not placeholders
    // The version-sync script reads from .version.json and replaces 0.3.4 in other files

    // Check other files
    await this.validateOtherFiles();

    return {
      errors: this.errors,
      messages: this.messages,
    };
  }

  private validatePackageJson(): void {
    const content = readFileSync('package.json', 'utf-8');
    const pkg = JSON.parse(content);

    // Check version field - must use placeholder OR be on a release branch
    if (
      pkg.version &&
      typeof pkg.version === 'string' &&
      /^\d+\.\d+\.\d+/.test(pkg.version) &&
      pkg.version !== PLACEHOLDER_VERSION &&
      !this.isReleaseBranch
    ) {
      this.messages.push('ERROR: Hardcoded version detected in package.json');
      this.messages.push('');
      this.messages.push(
        `package.json MUST use ${PLACEHOLDER_VERSION} placeholder for dynamic versioning.`
      );
      this.messages.push(
        `The version-sync CI job will replace ${PLACEHOLDER_VERSION} with the actual version.`
      );
      this.messages.push('');
      this.messages.push(`Current version line: "${pkg.version}"`);
      this.messages.push('');
      this.messages.push('Change it to:');
      this.messages.push(`  "version": "${PLACEHOLDER_VERSION}",`);
      this.messages.push('');
      this.errors++;
    }

    // Check schema path
    if (pkg.exports && pkg.exports['./schema']) {
      const schemaPath = pkg.exports['./schema'];
      if (
        typeof schemaPath === 'string' &&
        /\/v\d+\.\d+\.\d+/.test(schemaPath) &&
        !schemaPath.includes(PLACEHOLDER_VERSION) &&
        !this.isReleaseBranch
      ) {
        this.messages.push('ERROR: Hardcoded version in schema path detected');
        this.messages.push('');
        this.messages.push(
          `Schema path MUST use ${PLACEHOLDER_VERSION} placeholder.`
        );
        this.messages.push('');
        this.messages.push(`Current schema line: "${schemaPath}"`);
        this.messages.push('');
        this.messages.push('Change it to:');
        this.messages.push(
          `    "./schema": "./spec/v${PLACEHOLDER_VERSION}/ossa-${PLACEHOLDER_VERSION}.schema.json",`
        );
        this.messages.push('');
        this.errors++;
      }
    }
  }

  private detectReleaseBranch(): boolean {
    try {
      const branch = execFileSync('git', ['branch', '--show-current'], {
        encoding: 'utf-8',
      }).trim();
      return branch.startsWith('release/');
    } catch {
      return false;
    }
  }

  private validateVersionJson(): void {
    const content = readFileSync('.version.json', 'utf-8');
    const version = JSON.parse(content);

    if (
      (version.current && /^\d+\.\d+\.\d+/.test(version.current)) ||
      (version.spec_version && /^\d+\.\d+\.\d+/.test(version.spec_version))
    ) {
      this.messages.push('ERROR: Hardcoded version detected in .version.json');
      this.messages.push('');
      this.messages.push(
        `.version.json MUST use ${PLACEHOLDER_VERSION} placeholder.`
      );
      this.messages.push('');
      this.errors++;
    }
  }

  private async validateOtherFiles(): Promise<void> {
    const patterns = [
      'spec/**/*.md',
      'spec/**/*.yaml',
      'spec/**/*.json',
      'openapi/**/*.yaml',
      'openapi/**/*.json',
      '.gitlab/**/*.md',
      '.gitlab/**/*.yml',
      '.gitlab/**/*.yaml',
    ];

    for (const pattern of patterns) {
      const files = await glob(pattern, {
        ignore: ['node_modules/**', '.git/**'],
      });

      for (const file of files) {
        if (!existsSync(file)) continue;

        const content = readFileSync(file, 'utf-8');

        // Skip if file already uses placeholder
        if (content.includes(PLACEHOLDER_VERSION)) continue;

        // Skip examples and comments
        if (
          file.includes('example') ||
          file.includes('Example') ||
          content.includes('#') ||
          content.includes('//')
        ) {
          continue;
        }

        // Check for hardcoded version patterns
        if (/\b(version|VERSION)\b.*\d+\.\d+\.\d+/.test(content)) {
          this.messages.push(`WARNING: Possible hardcoded version in ${file}`);
          this.messages.push(
            `  Consider using ${PLACEHOLDER_VERSION} placeholder if this is a version reference`
          );
          this.messages.push('');
        }
      }
    }
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new VersionValidator();

  validator.validate().then((result) => {
    result.messages.forEach((msg) => console.log(msg));

    if (result.errors > 0) {
      console.log('');
      console.log(`❌ BLOCKED: ${result.errors} hardcoded version(s) detected`);
      console.log('');
      console.log(
        `All versions MUST use ${PLACEHOLDER_VERSION} placeholder for dynamic CI replacement.`
      );
      console.log(
        `The version-sync CI job will replace ${PLACEHOLDER_VERSION} with the actual version during build.`
      );
      process.exit(1);
    }

    process.exit(0);
  });
}
