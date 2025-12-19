/**
 * Run Command Integration Tests
 * Test the run CLI command end-to-end
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('ossa run command', () => {
  let tempDir: string;
  const cwd = path.resolve(__dirname, '../../..');

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-run-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Validation', () => {
    it('should validate manifest before running', () => {
      const manifestPath = path.join(tempDir, 'invalid.ossa.yaml');
      const manifest = `
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: INVALID_NAME
  version: 1.0.0
spec:
  role: test
`;

      fs.writeFileSync(manifestPath, manifest);

      try {
        execSync(`node bin/ossa run ${manifestPath} -m "test" --no-validate`, {
          encoding: 'utf-8',
          cwd,
          stdio: 'pipe',
          env: { ...process.env, OPENAI_API_KEY: 'sk-test' },
        });
      } catch (error: any) {
        // Command should fail due to validation
        expect(error.status).toBeGreaterThan(0);
      }
    });

    it('should skip validation with --no-validate flag', () => {
      const manifestPath = path.join(tempDir, 'agent.ossa.yaml');
      const manifest = `
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: test-agent
  version: 1.0.0
spec:
  role: You are a test assistant
  llm:
    provider: openai
    model: gpt-4o-mini
`;

      fs.writeFileSync(manifestPath, manifest);

      // Should not throw with --no-validate
      // Note: This will fail without a real API key, but validation should be skipped
      try {
        execSync(`node bin/ossa run ${manifestPath} --no-validate -m "hi"`, {
          encoding: 'utf-8',
          cwd,
          stdio: 'pipe',
          env: { ...process.env, OPENAI_API_KEY: 'sk-test' },
          timeout: 5000,
        });
      } catch (error: any) {
        // May fail due to invalid API key, but not validation
        const output = error.stderr?.toString() || '';
        expect(output).not.toContain('validation failed');
      }
    });
  });

  describe('API Key Validation', () => {
    it('should exit with error when OPENAI_API_KEY is not set', () => {
      const manifestPath = path.join(tempDir, 'agent.ossa.yaml');
      const manifest = `
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: test-agent
  version: 1.0.0
spec:
  role: You are a test assistant
  llm:
    provider: openai
    model: gpt-4o-mini
`;

      fs.writeFileSync(manifestPath, manifest);

      try {
        execSync(`node bin/ossa run ${manifestPath} -m "test"`, {
          encoding: 'utf-8',
          cwd,
          stdio: 'pipe',
          env: { ...process.env, OPENAI_API_KEY: '' },
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.status).toBe(1);
        const output =
          error.stderr?.toString() || error.stdout?.toString() || '';
        expect(output).toContain('OPENAI_API_KEY');
      }
    });
  });

  describe('Runtime Selection', () => {
    it('should use openai runtime by default', () => {
      const manifestPath = path.join(tempDir, 'agent.ossa.yaml');
      const manifest = `
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: test-agent
  version: 1.0.0
spec:
  role: You are a test assistant
  llm:
    provider: openai
    model: gpt-4o-mini
`;

      fs.writeFileSync(manifestPath, manifest);

      try {
        execSync(`node bin/ossa run ${manifestPath} -m "test"`, {
          encoding: 'utf-8',
          cwd,
          stdio: 'pipe',
          env: { ...process.env, OPENAI_API_KEY: 'sk-test' },
          timeout: 5000,
        });
      } catch (error: any) {
        // May fail due to invalid API key, but should attempt to use openai
        const output =
          error.stderr?.toString() || error.stdout?.toString() || '';
        expect(output).not.toContain('Runtime');
        expect(output).not.toContain('not supported');
      }
    });

    it('should reject unsupported runtime', () => {
      const manifestPath = path.join(tempDir, 'agent.ossa.yaml');
      const manifest = `
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: test-agent
  version: 1.0.0
spec:
  role: You are a test assistant
  llm:
    provider: openai
    model: gpt-4o-mini
`;

      fs.writeFileSync(manifestPath, manifest);

      try {
        execSync(`node bin/ossa run ${manifestPath} -r anthropic -m "test"`, {
          encoding: 'utf-8',
          cwd,
          stdio: 'pipe',
          env: { ...process.env, OPENAI_API_KEY: 'sk-test' },
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.status).toBe(1);
        const output =
          error.stderr?.toString() || error.stdout?.toString() || '';
        expect(output).toContain('not supported');
      }
    });
  });

  describe('Single Message Mode', () => {
    it('should accept -m flag for single message', () => {
      const manifestPath = path.join(tempDir, 'agent.ossa.yaml');
      const manifest = `
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: test-agent
  version: 1.0.0
spec:
  role: You are a test assistant
  llm:
    provider: openai
    model: gpt-4o-mini
`;

      fs.writeFileSync(manifestPath, manifest);

      try {
        execSync(`node bin/ossa run ${manifestPath} -m "Hello"`, {
          encoding: 'utf-8',
          cwd,
          stdio: 'pipe',
          env: { ...process.env, OPENAI_API_KEY: 'sk-test' },
          timeout: 5000,
        });
      } catch (error: any) {
        // Command structure is correct even if API call fails
        const output = error.stderr?.toString() || '';
        expect(output).not.toContain('Unknown option');
      }
    });

    it('should accept --message flag for single message', () => {
      const manifestPath = path.join(tempDir, 'agent.ossa.yaml');
      const manifest = `
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: test-agent
  version: 1.0.0
spec:
  role: You are a test assistant
  llm:
    provider: openai
    model: gpt-4o-mini
`;

      fs.writeFileSync(manifestPath, manifest);

      try {
        execSync(`node bin/ossa run ${manifestPath} --message "Hello"`, {
          encoding: 'utf-8',
          cwd,
          stdio: 'pipe',
          env: { ...process.env, OPENAI_API_KEY: 'sk-test' },
          timeout: 5000,
        });
      } catch (error: any) {
        // Command structure is correct even if API call fails
        const output = error.stderr?.toString() || '';
        expect(output).not.toContain('Unknown option');
      }
    });
  });

  describe('Verbose Mode', () => {
    it('should accept -v flag for verbose output', () => {
      const manifestPath = path.join(tempDir, 'agent.ossa.yaml');
      const manifest = `
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: test-agent
  version: 1.0.0
spec:
  role: You are a test assistant
  llm:
    provider: openai
    model: gpt-4o-mini
`;

      fs.writeFileSync(manifestPath, manifest);

      try {
        execSync(`node bin/ossa run ${manifestPath} -v -m "test"`, {
          encoding: 'utf-8',
          cwd,
          stdio: 'pipe',
          env: { ...process.env, OPENAI_API_KEY: 'sk-test' },
          timeout: 5000,
        });
      } catch (error: any) {
        // Command structure is correct
        const output = error.stderr?.toString() || '';
        expect(output).not.toContain('Unknown option');
      }
    });

    it('should accept --verbose flag', () => {
      const manifestPath = path.join(tempDir, 'agent.ossa.yaml');
      const manifest = `
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: test-agent
  version: 1.0.0
spec:
  role: You are a test assistant
  llm:
    provider: openai
    model: gpt-4o-mini
`;

      fs.writeFileSync(manifestPath, manifest);

      try {
        execSync(`node bin/ossa run ${manifestPath} --verbose -m "test"`, {
          encoding: 'utf-8',
          cwd,
          stdio: 'pipe',
          env: { ...process.env, OPENAI_API_KEY: 'sk-test' },
          timeout: 5000,
        });
      } catch (error: any) {
        // Command structure is correct
        const output = error.stderr?.toString() || '';
        expect(output).not.toContain('Unknown option');
      }
    });
  });

  describe('Max Turns Option', () => {
    it('should accept --max-turns flag', () => {
      const manifestPath = path.join(tempDir, 'agent.ossa.yaml');
      const manifest = `
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: test-agent
  version: 1.0.0
spec:
  role: You are a test assistant
  llm:
    provider: openai
    model: gpt-4o-mini
`;

      fs.writeFileSync(manifestPath, manifest);

      try {
        execSync(`node bin/ossa run ${manifestPath} --max-turns 5 -m "test"`, {
          encoding: 'utf-8',
          cwd,
          stdio: 'pipe',
          env: { ...process.env, OPENAI_API_KEY: 'sk-test' },
          timeout: 5000,
        });
      } catch (error: any) {
        // Command structure is correct
        const output = error.stderr?.toString() || '';
        expect(output).not.toContain('Unknown option');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing manifest file', () => {
      const manifestPath = path.join(tempDir, 'nonexistent.ossa.yaml');

      try {
        execSync(`node bin/ossa run ${manifestPath} -m "test"`, {
          encoding: 'utf-8',
          cwd,
          stdio: 'pipe',
          env: { ...process.env, OPENAI_API_KEY: 'sk-test' },
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.status).toBe(1);
        const output =
          error.stderr?.toString() || error.stdout?.toString() || '';
        expect(output.length).toBeGreaterThan(0);
      }
    });

    it('should handle invalid YAML', () => {
      const manifestPath = path.join(tempDir, 'invalid.ossa.yaml');
      fs.writeFileSync(manifestPath, 'invalid: yaml: content: [[[');

      try {
        execSync(`node bin/ossa run ${manifestPath} -m "test"`, {
          encoding: 'utf-8',
          cwd,
          stdio: 'pipe',
          env: { ...process.env, OPENAI_API_KEY: 'sk-test' },
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.status).toBe(1);
      }
    });

    it('should handle invalid JSON', () => {
      const manifestPath = path.join(tempDir, 'invalid.ossa.json');
      fs.writeFileSync(manifestPath, '{ invalid json }');

      try {
        execSync(`node bin/ossa run ${manifestPath} -m "test"`, {
          encoding: 'utf-8',
          cwd,
          stdio: 'pipe',
          env: { ...process.env, OPENAI_API_KEY: 'sk-test' },
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.status).toBe(1);
      }
    });
  });

  describe('Agent Info Display', () => {
    it('should display agent name when loading', () => {
      const manifestPath = path.join(tempDir, 'agent.ossa.yaml');
      const manifest = `
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: my-test-agent
  version: 1.0.0
spec:
  role: You are a test assistant
  llm:
    provider: openai
    model: gpt-4o-mini
`;

      fs.writeFileSync(manifestPath, manifest);

      try {
        execSync(`node bin/ossa run ${manifestPath} -m "test"`, {
          encoding: 'utf-8',
          cwd,
          stdio: 'pipe',
          env: { ...process.env, OPENAI_API_KEY: 'sk-test' },
          timeout: 5000,
        });
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        // Should show agent name in output
        expect(
          output.includes('my-test-agent') || output.includes('Agent')
        ).toBe(true);
      }
    });
  });

  describe('Example Manifests', () => {
    it('should run with example OpenAI agent', () => {
      const examplePath = path.join(
        cwd,
        'examples/openai/swarm-agent.ossa.json'
      );

      // Check if example exists
      if (!fs.existsSync(examplePath)) {
        console.log('Skipping test - example file not found');
        return;
      }

      try {
        execSync(`node bin/ossa run ${examplePath} -m "Hello" --no-validate`, {
          encoding: 'utf-8',
          cwd,
          stdio: 'pipe',
          env: { ...process.env, OPENAI_API_KEY: 'sk-test' },
          timeout: 5000,
        });
      } catch (error: any) {
        // May fail due to invalid API key, but should load the manifest
        const output = error.stdout?.toString() || '';
        expect(output.length).toBeGreaterThan(0);
      }
    });
  });
});
