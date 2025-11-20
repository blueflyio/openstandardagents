/**
 * E2E Workflow Tests
 * Test complete workflows from generation to validation
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Full Workflow E2E', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-e2e-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should complete workflow: generate → validate', () => {
    const agentPath = path.join(tempDir, 'my-agent.ossa.yaml');
    const cwdPath = path.resolve(__dirname, '../..');

    // 1. Generate agent
    const reflectMetadataPath = require.resolve('reflect-metadata');
    const generateOutput = execSync(
      `node --require ${reflectMetadataPath} dist/cli/index.js generate chat --name "My Agent" --output ${agentPath}`,
      {
        encoding: 'utf-8',
        cwd: cwdPath,
      }
    );

    expect(generateOutput).toContain('✓');
    expect(fs.existsSync(agentPath)).toBe(true);

    // 2. Validate generated agent
    const validateOutput = execSync(
      `node dist/cli/index.js validate ${agentPath}`,
      {
        encoding: 'utf-8',
        cwd: cwdPath,
      }
    );

    expect(validateOutput).toContain('✓');
    expect(validateOutput).toContain('valid');
  });

  it('should complete workflow: generate multiple → validate all', () => {
    const cwdPath = path.resolve(__dirname, '../..');
    const agents = ['chat-bot', 'workflow-engine', 'compliance-scanner'];

    for (const agent of agents) {
      const agentPath = path.join(tempDir, `${agent}.ossa.yaml`);

      // Generate
      execSync(
        `node dist/cli/index.js generate ${agent.includes('chat') ? 'chat' : agent.includes('workflow') ? 'workflow' : 'compliance'} --name "${agent}" --output ${agentPath}`,
        {
          encoding: 'utf-8',
          cwd: cwdPath,
        }
      );

      // Validate
      const output = execSync(`node dist/cli/index.js validate ${agentPath}`, {
        encoding: 'utf-8',
        cwd: cwdPath,
      });

      expect(output).toContain('✓');
    }

    // All agents generated and validated
    expect(agents).toHaveLength(3);
  });

  it('should handle full development cycle', () => {
    const cwdPath = path.resolve(__dirname, '../..');
    const agentPath = path.join(tempDir, 'dev-agent.ossa.yaml');

    // Step 1: Generate
    execSync(
      `node dist/cli/index.js generate workflow --name "Development Agent" --runtime k8s --output ${agentPath}`,
      {
        encoding: 'utf-8',
        cwd: cwdPath,
      }
    );

    expect(fs.existsSync(agentPath)).toBe(true);

    // Step 2: Validate with verbose
    const validateOutput = execSync(
      `node dist/cli/index.js validate ${agentPath} --verbose`,
      {
        encoding: 'utf-8',
        cwd: cwdPath,
      }
    );

    expect(validateOutput).toContain('development-agent');
    expect(validateOutput).toContain('✓');

    // Step 3: Verify file content
    const content = fs.readFileSync(agentPath, 'utf-8');
    expect(content).toContain('apiVersion');
    expect(content).toContain('kind: Agent');
    expect(content).toContain('development-agent');
    expect(content).toContain('workflow');
  });
});
