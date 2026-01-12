/**
 * Version Validator
 *
 * SOLID: Single Responsibility - Validates version placeholders
 * Zod: Validates version structure
 * DRY: Reusable validation logic
 */

import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';

const VersionPlaceholderSchema = z.literal('0.3.3');

export class VersionValidator {
  private errors = 0;
  private messages: string[] = [];

  /**
   * Validate version placeholders
   * CRUD: Read operation (validates files)
   */
  async validate(): Promise<{ errors: number; messages: string[] }> {
    this.errors = 0;
    this.messages = [];

    // Check package.json
    if (existsSync('package.json')) {
      this.validatePackageJson();
    }

    // Skip .version.json - it's the SOURCE OF TRUTH for versions
    // It should contain actual version numbers, not placeholders
    // The version-sync script reads from .version.json and replaces {{VERSION}} in other files

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

    // Check version field - must use {{VERSION}} placeholder
    if (pkg.version && typeof pkg.version === 'string' && /^\d+\.\d+\.\d+/.test(pkg.version)) {
      this.messages.push('ERROR: Hardcoded version detected in package.json');
      this.messages.push('');
      this.messages.push('package.json MUST use {{VERSION}} placeholder for dynamic versioning.');
      this.messages.push('The version-sync CI job will replace {{VERSION}} with the actual version.');
      this.messages.push('');
      this.messages.push(`Current version line: "${pkg.version}"`);
      this.messages.push('');
      this.messages.push('Change it to:');
      this.messages.push('  "version": "{{VERSION}}",');
      this.messages.push('');
      this.errors++;
    }

    // Check schema path
    if (pkg.exports && pkg.exports['./schema']) {
      const schemaPath = pkg.exports['./schema'];
      if (typeof schemaPath === 'string' && /\/v\d+\.\d+\.\d+/.test(schemaPath)) {
        this.messages.push('ERROR: Hardcoded version in schema path detected');
        this.messages.push('');
        this.messages.push('Schema path MUST use {{VERSION}} placeholder.');
        this.messages.push('');
        this.messages.push(`Current schema line: "${schemaPath}"`);
        this.messages.push('');
        this.messages.push('Change it to:');
        this.messages.push('    "./schema": "./spec/v{{VERSION}}/ossa-{{VERSION}}.schema.json",');
        this.messages.push('');
        this.errors++;
      }
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
      this.messages.push('.version.json MUST use {{VERSION}} placeholder.');
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
      const files = await glob(pattern, { ignore: ['node_modules/**', '.git/**'] });

      for (const file of files) {
        if (!existsSync(file)) continue;

        const content = readFileSync(file, 'utf-8');

        // Skip if file already uses {{VERSION}} placeholder
        if (content.includes('{{VERSION}}')) continue;

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
          this.messages.push('  Consider using {{VERSION}} placeholder if this is a version reference');
          this.messages.push('');
        }
      }
    }
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new VersionValidator();

  validator.validate().then(result => {
    result.messages.forEach(msg => console.log(msg));

    if (result.errors > 0) {
      console.log('');
      console.log(`❌ BLOCKED: ${result.errors} hardcoded version(s) detected`);
      console.log('');
      console.log('All versions MUST use {{VERSION}} placeholder for dynamic CI replacement.');
      console.log('The version-sync CI job will replace {{VERSION}} with the actual version during build.');
      process.exit(1);
    }

    process.exit(0);
  });
}
