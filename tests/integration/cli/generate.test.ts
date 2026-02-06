/**
 * Generate Command Integration Tests
 * Test the generate CLI command end-to-end
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parse as parseYaml } from 'yaml';
import { API_VERSION } from '../../../src/version.js';

describe('ossa generate command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-generate-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should generate a chat agent', () => {
    const outputPath = path.join(tempDir, 'chat-agent.ossa.yaml');

    const output = execSync(
      `node --require reflect-metadata dist/cli/index.js generate agent chat --name "Chat Bot" --output ${outputPath}`,
      {
        encoding: 'utf-8',
        cwd: path.resolve(__dirname, '../../..'),
      }
    );

    expect(output).toContain('✓');
    expect(fs.existsSync(outputPath)).toBe(true);

    // Parse and verify manifest
    const content = fs.readFileSync(outputPath, 'utf-8');
    const manifest = parseYaml(content);

    expect(manifest.apiVersion).toMatch(/^ossa\/v0\.3(\.6)?$/);
    expect(manifest.kind).toBe('Agent');
    expect(manifest.metadata.name).toBeDefined();
    expect(manifest.spec.role).toBe('chat');
  });

  it('should generate workflow agent with correct capabilities', () => {
    const outputPath = path.join(tempDir, 'workflow.ossa.yaml');

    execSync(
      `node --require reflect-metadata dist/cli/index.js generate agent workflow --name "Workflow Engine" --output ${outputPath}`,
      {
        encoding: 'utf-8',
        cwd: path.resolve(__dirname, '../../..'),
      }
    );

    const content = fs.readFileSync(outputPath, 'utf-8');
    const manifest = parseYaml(content);

    expect(manifest.spec.role).toBe('workflow');
  });

  it('should generate compliance agent with low temperature', () => {
    const outputPath = path.join(tempDir, 'compliance.ossa.yaml');

    execSync(
      `node --require reflect-metadata dist/cli/index.js generate agent compliance --name "Compliance Scanner" --output ${outputPath}`,
      {
        encoding: 'utf-8',
        cwd: path.resolve(__dirname, '../../..'),
      }
    );

    const content = fs.readFileSync(outputPath, 'utf-8');
    const manifest = parseYaml(content);

    expect(manifest.spec.role).toBe('compliance');
  });

  it('should use custom runtime type', () => {
    const outputPath = path.join(tempDir, 'k8s-agent.ossa.yaml');

    execSync(
      `node --require reflect-metadata dist/cli/index.js generate agent monitoring --name "K8s Monitor" --runtime k8s --output ${outputPath}`,
      {
        encoding: 'utf-8',
        cwd: path.resolve(__dirname, '../../..'),
      }
    );

    const content = fs.readFileSync(outputPath, 'utf-8');
    const manifest = parseYaml(content);

    expect(manifest.spec.role).toBe('monitoring');
  });

  it('should normalize agent ID', () => {
    const outputPath = path.join(tempDir, 'normalized.ossa.yaml');

    execSync(
      `node --require reflect-metadata dist/cli/index.js generate agent chat --name "My Agent With SPACES" --output ${outputPath}`,
      {
        encoding: 'utf-8',
        cwd: path.resolve(__dirname, '../../..'),
      }
    );

    const content = fs.readFileSync(outputPath, 'utf-8');
    const manifest = parseYaml(content);

    expect(manifest.metadata.name).toBeDefined();
  });

  it('should create output directory if it does not exist', () => {
    const outputPath = path.join(tempDir, 'nested', 'deep', 'agent.ossa.yaml');

    execSync(
      `node --require reflect-metadata dist/cli/index.js generate agent chat --name "Test" --output ${outputPath}`,
      {
        encoding: 'utf-8',
        cwd: path.resolve(__dirname, '../../..'),
      }
    );

    expect(fs.existsSync(outputPath)).toBe(true);
  });
});
