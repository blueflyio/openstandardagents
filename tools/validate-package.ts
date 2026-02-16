#!/usr/bin/env tsx
/**
 * Comprehensive Package Validation
 * Prevents publishing broken packages to NPM
 *
 * Validates:
 * 1. Critical files are included in package.json files array
 * 2. All runtime dependencies are declared
 * 3. Package builds successfully
 * 4. Global installation from tarball works
 * 5. CLI commands execute without errors
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

interface PackageJson {
  name: string;
  version: string;
  files?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

const CRITICAL_FILES = [
  '.version.json',
  'dist/',
  'spec/',
  'bin/',
  'README.md',
];

const REQUIRED_EXPORTS = [
  'dist/index.js',
  'dist/cli/index.js',
  'spec/v0.4/agent.schema.json',
];

class PackageValidator {
  private pkgPath: string;
  private pkg: PackageJson;
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor() {
    this.pkgPath = join(process.cwd(), 'package.json');
    this.pkg = JSON.parse(readFileSync(this.pkgPath, 'utf-8'));
  }

  /**
   * Run all validations
   */
  async validate(): Promise<ValidationResult> {
    console.log('🔍 Running comprehensive package validation...\n');

    // 1. Validate critical files are included
    this.validateCriticalFiles();

    // 2. Validate required exports exist
    this.validateRequiredExports();

    // 3. Validate dependencies
    await this.validateDependencies();

    // 4. Build package
    await this.buildPackage();

    // 5. Create and test tarball
    await this.validateTarballInstall();

    // 6. Test CLI commands
    await this.validateCLICommands();

    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * Validate critical files are in package.json files array
   */
  private validateCriticalFiles(): void {
    console.log('📋 Validating critical files are included...');

    if (!this.pkg.files || this.pkg.files.length === 0) {
      this.errors.push('❌ package.json "files" array is empty or missing');
      return;
    }

    const missingFiles: string[] = [];

    for (const file of CRITICAL_FILES) {
      const isIncluded = this.pkg.files.some(pattern => {
        // Check exact match or directory match
        return pattern === file || pattern === file.replace('/', '');
      });

      if (!isIncluded) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      this.errors.push(
        `❌ Critical files missing from package.json files array:\n   ${missingFiles.join('\n   ')}`
      );
    } else {
      console.log('✅ All critical files are included\n');
    }
  }

  /**
   * Validate required exports exist on filesystem
   */
  private validateRequiredExports(): void {
    console.log('📦 Validating required exports exist...');

    const missingExports: string[] = [];

    for (const exportPath of REQUIRED_EXPORTS) {
      const fullPath = join(process.cwd(), exportPath);
      if (!existsSync(fullPath)) {
        missingExports.push(exportPath);
      }
    }

    if (missingExports.length > 0) {
      this.errors.push(
        `❌ Required exports missing (need to build first?):\n   ${missingExports.join('\n   ')}`
      );
    } else {
      console.log('✅ All required exports exist\n');
    }
  }

  /**
   * Validate all imported dependencies are declared
   */
  private async validateDependencies(): Promise<void> {
    console.log('🔗 Validating dependencies...');

    try {
      execSync('npm run validate:deps', { stdio: 'pipe' });
      console.log('✅ All dependencies are declared\n');
    } catch (error: any) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      this.errors.push(`❌ Dependency validation failed:\n${output}`);
    }
  }

  /**
   * Build the package
   */
  private async buildPackage(): Promise<void> {
    console.log('🔨 Building package...');

    try {
      execSync('npm run build:clean', { stdio: 'pipe' });
      console.log('✅ Package built successfully\n');
    } catch (error: any) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      this.errors.push(`❌ Build failed:\n${output}`);
    }
  }

  /**
   * Create tarball and test global installation
   */
  private async validateTarballInstall(): Promise<void> {
    console.log('📦 Testing tarball installation...');

    try {
      // Create tarball
      const packOutput = execSync('npm pack', { encoding: 'utf-8' });
      const tarball = packOutput.trim().split('\n').pop()?.trim();

      if (!tarball) {
        this.errors.push('❌ Failed to create tarball');
        return;
      }

      console.log(`   Created: ${tarball}`);

      // Test global install from tarball
      console.log('   Installing globally from tarball...');
      execSync(`npm install -g ${tarball}`, { stdio: 'pipe' });

      console.log('✅ Tarball installs globally without errors\n');

      // Cleanup
      execSync(`npm uninstall -g ${this.pkg.name}`, { stdio: 'pipe' });
      execSync(`rm ${tarball}`, { stdio: 'pipe' });
    } catch (error: any) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      this.errors.push(`❌ Tarball installation failed:\n${output}`);
    }
  }

  /**
   * Test CLI commands work
   */
  private async validateCLICommands(): Promise<void> {
    console.log('🧪 Testing CLI commands...');

    const commands = [
      { cmd: 'ossa --version', desc: 'Version command' },
      { cmd: 'ossa --help', desc: 'Help command' },
      { cmd: 'ossa validate --help', desc: 'Validate command help' },
    ];

    try {
      // Install locally first
      execSync('npm link', { stdio: 'pipe' });

      for (const { cmd, desc } of commands) {
        try {
          execSync(cmd, { stdio: 'pipe' });
          console.log(`   ✅ ${desc}: OK`);
        } catch (error: any) {
          const output = error.stdout?.toString() || error.stderr?.toString() || '';
          this.errors.push(`❌ ${desc} failed:\n   Command: ${cmd}\n   Output: ${output}`);
        }
      }

      console.log('✅ All CLI commands work\n');

      // Cleanup (ignore errors - package may not be linked)
      try {
        execSync('npm unlink', { stdio: 'pipe' });
      } catch {
        // Ignore cleanup errors
      }
    } catch (error: any) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      this.errors.push(`❌ CLI validation setup failed:\n${output}`);
    }
  }
}

async function main() {
  const validator = new PackageValidator();
  const result = await validator.validate();

  // Print results
  console.log('═'.repeat(60));
  console.log('📊 VALIDATION RESULTS');
  console.log('═'.repeat(60));

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    result.warnings.forEach(warning => console.log(warning));
  }

  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:\n');
    result.errors.forEach(error => console.log(error));
    console.log('\n💡 Fix these errors before publishing to NPM');
    process.exit(1);
  }

  console.log('\n✅ ALL VALIDATIONS PASSED');
  console.log('✅ Package is ready to publish to NPM\n');
  process.exit(0);
}

main().catch(err => {
  console.error('💥 Validation crashed:', err);
  process.exit(1);
});
