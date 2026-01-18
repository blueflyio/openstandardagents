/**
 * NPM Pack Smoke Test
 * Validates that the package can be built, packed, and installed correctly
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

describe('NPM Pack Smoke Test', () => {
  const projectRoot = join(__dirname, '../..');
  const tempDir = join(projectRoot, '.test-pack-temp');

  beforeAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should successfully pack the npm package', () => {
    execSync('npm run build', {
      cwd: projectRoot,
      stdio: 'pipe',
    });

    const packOutput = execSync('npm pack --pack-destination=' + tempDir, {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    expect(packOutput).toBeTruthy();
    expect(packOutput).toContain('.tgz');

    const tarballName = packOutput.trim().split('\n').pop() || '';
    const tarballPath = join(tempDir, tarballName);
    expect(existsSync(tarballPath)).toBe(true);
  });

  it('should include required files in the package', () => {
    const packOutput = execSync('npm pack --dry-run --json', {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    const packData = JSON.parse(packOutput);
    const files = packData[0]?.files.map((f: { path: string }) => f.path) || [];

    expect(files.some((f: string) => f.startsWith('dist/'))).toBe(true);
    expect(files.some((f: string) => f.startsWith('spec/'))).toBe(true);
    expect(files.some((f: string) => f.startsWith('bin/'))).toBe(true);
    expect(files.some((f: string) => f.includes('package.json'))).toBe(true);
    expect(files.some((f: string) => f.includes('README.md'))).toBe(true);
  });

  it('should not include test files or dev artifacts', () => {
    const packOutput = execSync('npm pack --dry-run --json', {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    const packData = JSON.parse(packOutput);
    const files = packData[0]?.files.map((f: { path: string }) => f.path) || [];

    expect(files.some((f: string) => f.startsWith('tests/'))).toBe(false);
    expect(files.some((f: string) => f.startsWith('src/'))).toBe(false);
    expect(files.some((f: string) => f.includes('.test.'))).toBe(false);
    expect(files.some((f: string) => f.includes('.spec.'))).toBe(false);
  });

  it('should have valid package.json configuration', () => {
    const packageJson = require(join(projectRoot, 'package.json'));

    expect(packageJson.name).toBeTruthy();
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(packageJson.type).toBe('module');
    expect(packageJson.main).toBeTruthy();
    expect(packageJson.types).toBeTruthy();
    expect(packageJson.exports).toBeTruthy();
  });
});
