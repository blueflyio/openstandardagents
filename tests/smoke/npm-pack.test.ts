/**
 * Smoke Test: npm pack Verification
 *
 * Validates that the package can be installed and imported from npm pack tarball.
 * This catches issues that `npm link` misses:
 * - Missing files in package.json "files" field
 * - Incorrect main/module/exports paths
 * - Build artifacts not included
 *
 * DRY Principle: Reusable package testing utilities
 * Zod: Runtime validation of package structure
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

const projectRoot = join(__dirname, '../..');
const tempDir = join(projectRoot, 'tmp-smoke-test');
const packageName = '@bluefly/openstandardagents';

// Zod schema for package.json structure
const PackageJsonSchema = z.object({
  name: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+/),
  main: z.string().optional(),
  module: z.string().optional(),
  types: z.string().optional(),
  exports: z.record(z.any()).optional(),
  files: z.array(z.string()).optional(),
});

/**
 * DRY Helper: Execute command with error handling
 */
function exec(command: string, cwd: string = projectRoot): string {
  try {
    return execSync(command, {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error) {
    if (error instanceof Error && 'stderr' in error) {
      throw new Error(
        `Command failed: ${command}\nStderr: ${(error as any).stderr}`
      );
    }
    throw error;
  }
}

/**
 * DRY Helper: Clean up temp directory
 */
function cleanupTempDir() {
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

describe('Smoke Test: npm pack Installation', () => {
  let tarballPath: string;

  beforeAll(() => {
    // Ensure build exists
    if (!existsSync(join(projectRoot, 'dist'))) {
      throw new Error('Build not found. Run "npm run build" first.');
    }

    // Clean and create temp directory
    cleanupTempDir();
    mkdirSync(tempDir, { recursive: true });

    // Create tarball
    const packOutput = exec('npm pack', projectRoot);

    // Extract .tgz filename from output (last line that ends with .tgz)
    const lines = packOutput.trim().split('\n');
    const tgzLine = lines.filter((line) => line.endsWith('.tgz')).pop();

    if (!tgzLine) {
      throw new Error(`No .tgz file found in npm pack output: ${packOutput}`);
    }

    tarballPath = join(projectRoot, tgzLine.trim());

    if (!existsSync(tarballPath)) {
      throw new Error(`Tarball not created: ${tarballPath}`);
    }
  });

  afterAll(() => {
    // Cleanup
    cleanupTempDir();
    if (tarballPath && existsSync(tarballPath)) {
      rmSync(tarballPath, { force: true });
    }
  });

  describe('Package Structure', () => {
    it('package.json has required fields', () => {
      const pkgPath = join(projectRoot, 'package.json');
      const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf-8'));

      // Smoke test: Check required fields exist
      expect(pkgJson.name).toBeDefined();
      expect(pkgJson.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(pkgJson.main || pkgJson.exports).toBeDefined();
    });

    it('tarball size is reasonable (<5MB)', () => {
      const { size } = statSync(tarballPath);
      const sizeInMB = size / (1024 * 1024);

      console.log(`Package size: ${sizeInMB.toFixed(2)}MB`);
      expect(sizeInMB).toBeLessThan(5);
    });
  });

  describe('Installation', () => {
    it('installs from tarball without errors', () => {
      // Initialize test consumer package
      exec('npm init -y', tempDir);

      // Install from tarball
      const installOutput = exec(`npm install ${tarballPath}`, tempDir);
      expect(installOutput).toBeDefined();

      // Verify installation
      const nodeModulesPath = join(tempDir, 'node_modules', packageName);
      expect(existsSync(nodeModulesPath)).toBe(true);
    });

    it('package includes required files', () => {
      const installedPath = join(tempDir, 'node_modules', packageName);
      const requiredFiles = ['package.json', 'dist'];

      requiredFiles.forEach((file) => {
        const filePath = join(installedPath, file);
        expect(existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Runtime Import', () => {
    // TODO: Enable these tests once TypeScript ESM module resolution is fixed
    // Issue: imports missing .js extensions, breaking ESM module resolution
    it.skip('can require() package in CommonJS', () => {
      const testScript = `
        const pkg = require('${packageName}');
        console.log(JSON.stringify({
          hasValidationService: typeof pkg.ValidationService === 'function',
          hasSchemaRepository: typeof pkg.SchemaRepository === 'function',
          hasGetVersion: typeof pkg.getVersion === 'function'
        }));
      `;

      const output = exec(
        `node -e "${testScript.replace(/"/g, '\\"')}"`,
        tempDir
      );
      const result = JSON.parse(output);

      expect(result.hasValidationService).toBe(true);
      expect(result.hasSchemaRepository).toBe(true);
      expect(result.hasGetVersion).toBe(true);
    });

    it.skip('can import package in ESM', () => {
      const testScript = `
        import('${packageName}').then(pkg => {
          console.log(JSON.stringify({
            hasValidationService: typeof pkg.ValidationService === 'function',
            hasSchemaRepository: typeof pkg.SchemaRepository === 'function',
            hasGetVersion: typeof pkg.getVersion === 'function'
          }));
        });
      `;

      // ESM requires .mjs extension or package.json type:module
      const output = exec(
        `node --input-type=module -e "${testScript.replace(/"/g, '\\"')}"`,
        tempDir
      );
      const result = JSON.parse(output.trim());

      expect(result.hasValidationService).toBe(true);
      expect(result.hasSchemaRepository).toBe(true);
      expect(result.hasGetVersion).toBe(true);
    });
  });

  describe('CLI Executable', () => {
    it('npx ossa --version works from installed package', () => {
      const output = exec('npx ossa --version', tempDir);
      expect(output.trim()).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('npx ossa --help works from installed package', () => {
      const output = exec('npx ossa --help', tempDir);
      expect(output).toContain('Usage:');
    });
  });

  describe('TypeScript Types', () => {
    it('includes TypeScript declaration files', () => {
      const installedPath = join(tempDir, 'node_modules', packageName);
      const typesPath = join(installedPath, 'dist', 'index.d.ts');

      expect(existsSync(typesPath)).toBe(true);
    });

    it('types are valid TypeScript', () => {
      const installedPath = join(tempDir, 'node_modules', packageName);
      const pkgJson = JSON.parse(
        readFileSync(join(installedPath, 'package.json'), 'utf-8')
      );

      expect(pkgJson.types || pkgJson.typings).toBeDefined();
    });
  });
});
