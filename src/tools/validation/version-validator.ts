/**
 * Version Validator
 *
 * SOLID: Single Responsibility - Validates version consistency
 * DRY: Expected version read from .version.json (single source of truth)
 */

import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { glob } from 'glob';

export class VersionValidator {
  private errors = 0;
  private messages: string[] = [];
  private isReleaseBranch = false;
  private expectedVersion: string | null = null;

  /**
   * Read expected version from .version.json (source of truth). Updates dynamically with releases.
   */
  private getExpectedVersion(): string | null {
    if (this.expectedVersion !== null) return this.expectedVersion;
    if (existsSync('.version.json')) {
      try {
        const v = JSON.parse(readFileSync('.version.json', 'utf-8'));
        this.expectedVersion =
          (v.current && String(v.current).match(/^\d+\.\d+\.\d+/)
            ? v.current
            : null) ??
          (v.spec_version && String(v.spec_version).match(/^\d+\.\d+\.\d+/)
            ? v.spec_version
            : null) ??
          null;
      } catch {
        this.expectedVersion = null;
      }
    }
    if (this.expectedVersion === null && existsSync('package.json')) {
      try {
        const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
        if (pkg.version && /^\d+\.\d+\.\d+/.test(String(pkg.version)))
          this.expectedVersion = pkg.version;
      } catch {
        // ignore
      }
    }
    return this.expectedVersion;
  }

  /**
   * Validate that package.json and schema paths match .version.json
   */
  async validate(): Promise<{ errors: number; messages: string[] }> {
    this.errors = 0;
    this.messages = [];
    this.isReleaseBranch = this.detectReleaseBranch();
    this.getExpectedVersion();

    if (existsSync('package.json')) {
      this.validatePackageJson();
    }

    await this.validateOtherFiles();

    return {
      errors: this.errors,
      messages: this.messages,
    };
  }

  private validatePackageJson(): void {
    const content = readFileSync('package.json', 'utf-8');
    const pkg = JSON.parse(content);
    const expected = this.getExpectedVersion();

    if (!expected) return;

    if (
      pkg.version &&
      typeof pkg.version === 'string' &&
      pkg.version !== expected &&
      !this.isReleaseBranch
    ) {
      this.messages.push(
        'ERROR: package.json version does not match .version.json'
      );
      this.messages.push('');
      this.messages.push(
        `package.json "version" MUST match .version.json (current source of truth).`
      );
      this.messages.push('');
      this.messages.push(`Current package.json: "${pkg.version}"`);
      this.messages.push(`Expected (from .version.json): "${expected}"`);
      this.messages.push('');
      this.messages.push('Change it to:');
      this.messages.push(`  "version": "${expected}",`);
      this.messages.push('');
      this.errors++;
    }

    if (
      pkg.exports &&
      pkg.exports['./schema'] &&
      typeof pkg.exports['./schema'] === 'string'
    ) {
      const schemaPath = pkg.exports['./schema'];
      let expectedPrefix: string | null = null;
      if (existsSync('.version.json')) {
        try {
          const v = JSON.parse(readFileSync('.version.json', 'utf-8'));
          if (v.spec_path && v.schema_file)
            expectedPrefix = `./${String(v.spec_path).replace(/^\.?\//, '')}`;
        } catch {
          // ignore
        }
      }
      if (
        expectedPrefix &&
        !schemaPath.startsWith(expectedPrefix) &&
        !this.isReleaseBranch
      ) {
        this.messages.push(
          'WARNING: package.json "./schema" path may not match .version.json spec_path'
        );
        this.messages.push('');
        this.messages.push(`Current: "${schemaPath}"`);
        this.messages.push(
          `Expected prefix (from .version.json spec_path): "${expectedPrefix}"`
        );
        this.messages.push('');
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

        const expected = this.getExpectedVersion();
        if (expected && content.includes(expected)) continue;

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
          if (expected) {
            this.messages.push(
              `  Should match .version.json (${expected}) if this is the project version`
            );
          }
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
      console.log(`BLOCKED: ${result.errors} version mismatch(es) detected`);
      console.log('');
      console.log(
        `package.json version MUST match .version.json (source of truth). Update .version.json on release, then keep package.json in sync.`
      );
      process.exit(1);
    }

    process.exit(0);
  });
}
