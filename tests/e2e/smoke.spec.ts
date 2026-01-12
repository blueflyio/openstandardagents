/**
 * E2E Smoke Test - Minimal validation that CLI works
 * This makes test:e2e a legitimate gate, not a hollow job
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, resolve } from 'path';

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
      // Validate manifest path to prevent command injection
      // 1. Ensure path is absolute and within project root
      const resolvedPath = resolve(manifestPath);
      const resolvedRoot = resolve(projectRoot);
      if (!resolvedPath.startsWith(resolvedRoot)) {
        throw new Error(`Manifest path outside project root: ${manifestPath}`);
      }
      
      // 2. Validate relative path contains only safe characters (no shell metacharacters)
      const relativePath = manifestPath.replace(projectRoot + '/', '').replace(projectRoot + '\\', '');
      // Allow alphanumeric, forward/backward slashes, dots, hyphens, underscores
      // Reject: spaces, quotes, semicolons, pipes, redirects, etc.
      if (!/^[a-zA-Z0-9/\\._-]+$/.test(relativePath)) {
        throw new Error(`Invalid manifest path format: ${relativePath} (contains unsafe characters)`);
      }
      
      // 3. Ensure no path traversal attempts
      if (relativePath.includes('..')) {
        throw new Error(`Invalid manifest path: ${relativePath} (path traversal detected)`);
      }
      
      // 4. Use resolved absolute path in command (safer than relative)
      const result = execSync(`node bin/ossa validate "${resolvedPath}"`, {
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
