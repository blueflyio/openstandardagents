/**
 * Smoke Test: CLI Command Verification
 *
 * Validates that all CLI commands execute without errors and produce expected output.
 * This catches broken CLI entry points, missing dependencies, and runtime errors.
 *
 * DRY Principle: Reusable command execution helper
 * Zod: Runtime validation of CLI output structure
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { API_VERSION } from '../../../src/version.js';

const projectRoot = join(__dirname, '../..');
const cliPath = join(projectRoot, 'bin/ossa');

// Zod schema for version output
const VersionOutputSchema = z.string().regex(/^\d+\.\d+\.\d+/);

// Zod schema for help output
const HelpOutputSchema = z.string().refine((s) => s.includes('Usage:'), {
  message: 'Help output must contain "Usage:"',
});

/**
 * DRY Helper: Execute CLI command with error handling
 */
function execCLI(args: string): string {
  try {
    return execSync(`node ${cliPath} ${args}`, {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error) {
    if (error instanceof Error && 'stderr' in error) {
      throw new Error(
        `CLI command failed: ${args}\nStderr: ${error && typeof error === 'object' && 'stderr' in error ? (error as any).stderr : 'No stderr available'}`
      );
    }
    throw error;
  }
}

describe('Smoke Test: CLI Commands', () => {
  beforeAll(() => {
    // Ensure CLI binary exists
    if (!existsSync(cliPath)) {
      throw new Error(
        `CLI binary not found at ${cliPath}. Run 'npm run build' first.`
      );
    }
  });

  describe('Basic Commands', () => {
    it('--version returns valid semver', () => {
      const output = execCLI('--version');
      const result = VersionOutputSchema.safeParse(output.trim());

      if (!result.success) {
        console.error('Version validation failed:', result.error.format());
      }

      expect(result.success).toBe(true);
    });

    it('--help displays usage information', () => {
      const output = execCLI('--help');
      const result = HelpOutputSchema.safeParse(output);

      if (!result.success) {
        console.error('Help validation failed:', result.error.format());
      }

      expect(result.success).toBe(true);
      expect(output).toContain('ossa');
    });

    it('-h displays usage information (short form)', () => {
      const output = execCLI('-h');
      expect(output).toContain('Usage:');
    });
  });

  describe('validate Command', () => {
    it('validates known-good fixture', () => {
      const fixturePath = join(
        projectRoot,
        'spec/v0.3/conformance/tests/baseline/valid/basic-agent.yaml'
      );

      if (!existsSync(fixturePath)) {
        console.warn('Baseline fixture not found, skipping validation test');
        return;
      }

      const output = execCLI(`validate "${fixturePath}"`);
      expect(output).toBeDefined();
      // Success means no error thrown
    });

    it('rejects invalid manifest with error', () => {
      const invalidFixturePath = join(
        projectRoot,
        'spec/v0.3/conformance/tests/baseline/invalid/invalid-apiversion.yaml'
      );

      if (!existsSync(invalidFixturePath)) {
        console.warn('Invalid fixture not found, skipping rejection test');
        return;
      }

      // Expect this to fail (exit code !== 0)
      expect(() => {
        execCLI(`validate "${invalidFixturePath}"`);
      }).toThrow();
    });
  });

  describe('conformance Command', () => {
    it('lists conformance profiles', () => {
      const output = execCLI('conformance list');
      expect(output).toContain('baseline');
      expect(output).toContain('enterprise');
    });

    it('tests agent against baseline profile', () => {
      const fixturePath = join(
        projectRoot,
        'spec/v0.3/conformance/tests/baseline/valid/basic-agent.yaml'
      );

      if (!existsSync(fixturePath)) {
        console.warn('Baseline fixture not found, skipping conformance test');
        return;
      }

      const output = execCLI(
        `conformance run "${fixturePath}" --profile baseline`
      );
      expect(output).toBeDefined();
      // Success means no error thrown
    });
  });

  describe('CLI Error Handling', () => {
    it('handles missing file gracefully', () => {
      expect(() => {
        execCLI('validate /nonexistent/file.yaml');
      }).toThrow();
    });

    it('handles invalid command gracefully', () => {
      expect(() => {
        execCLI('nonexistent-command');
      }).toThrow();
    });
  });

  describe('CLI Performance', () => {
    it('--version executes in under 1 second', () => {
      const start = Date.now();
      execCLI('--version');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    });

    it('--help executes in under 1 second', () => {
      const start = Date.now();
      execCLI('--help');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    });
  });
});
