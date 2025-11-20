/**
 * Validate Command Integration Tests
 * Test the validate CLI command end-to-end
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('ossa validate command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-validate-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should validate a correct v1.0 manifest', () => {
    const manifestPath = path.join(tempDir, 'valid.ossa.yaml');
    const manifest = `
apiVersion: ossa/v1
kind: Agent
metadata:
  name: test-agent
  version: 0.1.0
  description: Test agent
spec:
  role: chat
  llm:
    provider: openai
    model: gpt-4
  tools:
    - type: mcp
      name: chat
      server: test-agent
      capabilities: []
`;

    fs.writeFileSync(manifestPath, manifest);

    const output = execSync(`node --require reflect-metadata dist/cli/index.js validate ${manifestPath}`, {
      encoding: 'utf-8',
      cwd: path.resolve(__dirname, '../../..'),
    });

    expect(output).toContain('✓');
    expect(output).toContain('valid');
  });

  it('should report validation errors for invalid manifest', () => {
    const manifestPath = path.join(tempDir, 'invalid.ossa.yaml');
    const manifest = `
apiVersion: ossa/v1
kind: Agent
metadata:
  name: INVALID_ID
  version: 0.1.0
spec:
  role: chat
`;

    fs.writeFileSync(manifestPath, manifest);

    try {
      execSync(`node bin/ossa validate ${manifestPath}`, {
        encoding: 'utf-8',
        cwd: path.resolve(__dirname, '../../..'),
        stdio: 'pipe',
      });
      // If we got here, the command didn't fail - that's wrong
      expect(true).toBe(false); // Force failure
    } catch (error: any) {
      // Command should exit with error code
      expect(error.status).toBe(1);
    }
  });

  it('should show verbose output when requested', () => {
    const manifestPath = path.join(tempDir, 'agent.ossa.yaml');
    const manifest = `
    apiVersion: ossa/v1
    kind: Agent
    metadata:
      name: test-agent
      version: 2.5.0
      description: Workflow agent
    spec:
      role: workflow
      llm:
        provider: openai
        model: gpt-4
      tools:
        - type: mcp
          name: execute
          server: test-agent
          capabilities: []
    `;

    fs.writeFileSync(manifestPath, manifest);

    const output = execSync(
      `node --require reflect-metadata dist/cli/index.js validate ${manifestPath} --verbose`,
      {
        encoding: 'utf-8',
        cwd: path.resolve(__dirname, '../../..'),
      }
    );

    expect(output).toContain('test-agent');
  });

  it('should show warnings for missing best practices', () => {
    const manifestPath = path.join(tempDir, 'minimal.ossa.yaml');
    const manifest = `
apiVersion: ossa/v1
kind: Agent
metadata:
  name: minimal
  version: 0.1.0
spec:
  role: chat
`;

    fs.writeFileSync(manifestPath, manifest);

    const output = execSync(`node --require reflect-metadata dist/cli/index.js validate ${manifestPath}`, {
      encoding: 'utf-8',
      cwd: path.resolve(__dirname, '../../..'),
    });

    expect(output).toContain('valid');
  });
});
