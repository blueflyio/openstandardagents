/**
 * E2E Smoke Test - Minimal validation that CLI works
 * This makes test:e2e a legitimate gate, not a hollow job
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

describe('E2E Smoke Tests', () => {
  const projectRoot = join(__dirname, '../..');

  it('should have built CLI binary', () => {
    const cliPath = join(projectRoot, 'bin/ossa');
    expect(existsSync(cliPath)).toBe(true);
  });

  it('should execute ossa --version without errors', () => {
    const result = execSync('node bin/ossa --version', {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    expect(result.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('should execute ossa --help without errors', () => {
    const result = execSync('node bin/ossa --help', {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    expect(result).toContain('Usage:');
  });

  it('should validate a minimal OSSA manifest', () => {
    const minimalManifest = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
      },
      spec: {
        capabilities: [],
      },
    };

    const manifestPath = join(projectRoot, 'tests/e2e/test-manifest.ossa.yaml');
    require('fs').writeFileSync(
      manifestPath,
      require('yaml').stringify(minimalManifest)
    );

    try {
      const result = execSync(`node bin/ossa validate ${manifestPath}`, {
        cwd: projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(result).toBeTruthy();
    } finally {
      if (existsSync(manifestPath)) {
        require('fs').unlinkSync(manifestPath);
      }
    }
  });
});
