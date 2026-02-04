/**
 * Agents.md Command Integration Tests
 * Test the agents-md CLI commands end-to-end
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { stringify as stringifyYaml } from 'yaml';
import type { OssaAgent } from '../../../src/types/index.js';

describe('ossa agents-md command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-agents-md-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('generate subcommand', () => {
    it('should generate AGENTS.md from manifest', () => {
      const manifestPath = path.join(tempDir, 'manifest.yaml');
      const agentsMdPath = path.join(tempDir, 'AGENTS.md');

      // Create test manifest
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test agent for code review',
          tools: [
            {
              type: 'mcp',
              name: 'git_operations',
              server: 'git-mcp-server',
            },
          ],
        },
        extensions: {
          agents_md: {
            enabled: true,
            generate: true,
            sections: {
              dev_environment: {
                enabled: true,
                source: 'spec.tools',
              },
              testing: {
                enabled: true,
                custom: 'Run `npm test` before committing.',
              },
            },
          },
        },
      };

      fs.writeFileSync(manifestPath, stringifyYaml(manifest));

      // Run generate command
      const output = execSync(
        `node --require reflect-metadata dist/cli/index.js agents-md generate ${manifestPath} --output ${agentsMdPath}`,
        {
          encoding: 'utf-8',
          cwd: path.resolve(__dirname, '../../..'),
        }
      );

      expect(output).toContain('✓');
      expect(output).toContain('AGENTS.md generated successfully');
      expect(fs.existsSync(agentsMdPath)).toBe(true);

      // Verify content
      const content = fs.readFileSync(agentsMdPath, 'utf-8');
      expect(content).toContain('# Dev environment tips');
      expect(content).toContain('# Testing instructions');
      expect(content).toContain('git_operations');
      expect(content).toContain('Run `npm test` before committing');
    });

    it('should fail if extension not enabled', () => {
      const manifestPath = path.join(tempDir, 'manifest.yaml');

      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
        },
        spec: {
          role: 'Test role',
        },
        extensions: {
          agents_md: {
            enabled: false,
          },
        },
      };

      fs.writeFileSync(manifestPath, stringifyYaml(manifest));

      expect(() => {
        execSync(
          `node --require reflect-metadata dist/cli/index.js agents-md generate ${manifestPath}`,
          {
            encoding: 'utf-8',
            cwd: path.resolve(__dirname, '../../..'),
          }
        );
      }).toThrow();
    });

    it('should generate with verbose output', () => {
      const manifestPath = path.join(tempDir, 'manifest.yaml');

      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
        },
        spec: {
          role: 'Test role',
        },
        extensions: {
          agents_md: {
            enabled: true,
          },
        },
      };

      fs.writeFileSync(manifestPath, stringifyYaml(manifest));

      const output = execSync(
        `node --require reflect-metadata dist/cli/index.js agents-md generate ${manifestPath} --verbose`,
        {
          encoding: 'utf-8',
          cwd: path.resolve(__dirname, '../../..'),
        }
      );

      expect(output).toContain('Generated content:');
      expect(output).toContain('─'.repeat(50));
    });
  });

  describe('validate subcommand', () => {
    it('should validate valid AGENTS.md', () => {
      const manifestPath = path.join(tempDir, 'manifest.yaml');
      const agentsMdPath = path.join(tempDir, 'AGENTS.md');

      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
        },
        spec: {
          role: 'Test role',
        },
        extensions: {
          agents_md: {
            enabled: true,
          },
        },
      };

      fs.writeFileSync(manifestPath, stringifyYaml(manifest));

      // Create valid AGENTS.md
      const agentsMdContent = `# Dev environment tips
Test content

# Testing instructions
Test content

# PR instructions
Test content`;

      fs.writeFileSync(agentsMdPath, agentsMdContent);

      const output = execSync(
        `node --require reflect-metadata dist/cli/index.js agents-md validate ${agentsMdPath} ${manifestPath}`,
        {
          encoding: 'utf-8',
          cwd: path.resolve(__dirname, '../../..'),
        }
      );

      expect(output).toContain('✓');
      expect(output).toContain('AGENTS.md is valid');
    });

    it('should show warnings for missing sections', () => {
      const manifestPath = path.join(tempDir, 'manifest.yaml');
      const agentsMdPath = path.join(tempDir, 'AGENTS.md');

      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
        },
        spec: {
          role: 'Test role',
        },
        extensions: {
          agents_md: {
            enabled: true,
          },
        },
      };

      fs.writeFileSync(manifestPath, stringifyYaml(manifest));

      // Create incomplete AGENTS.md
      const agentsMdContent = `# Dev environment tips
Test content`;

      fs.writeFileSync(agentsMdPath, agentsMdContent);

      expect(() => {
        execSync(
          `node --require reflect-metadata dist/cli/index.js agents-md validate ${agentsMdPath} ${manifestPath}`,
          {
            encoding: 'utf-8',
            cwd: path.resolve(__dirname, '../../..'),
          }
        );
      }).toThrow();
    });
  });

  describe('sync subcommand', () => {
    it('should sync AGENTS.md from manifest', () => {
      const manifestPath = path.join(tempDir, 'manifest.yaml');
      const agentsMdPath = path.join(tempDir, 'AGENTS.md');

      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
        },
        spec: {
          role: 'Test role',
        },
        extensions: {
          agents_md: {
            enabled: true,
            output_path: agentsMdPath,
            sync: {
              on_manifest_change: true,
            },
          },
        },
      };

      fs.writeFileSync(manifestPath, JSON.stringify(manifest));

      const output = execSync(
        `node --require reflect-metadata dist/cli/index.js agents-md sync ${manifestPath}`,
        {
          encoding: 'utf-8',
          cwd: path.resolve(__dirname, '../../..'),
        }
      );

      expect(output).toContain('✓');
      expect(output).toContain('AGENTS.md synced successfully');
      expect(fs.existsSync(agentsMdPath)).toBe(true);
    });

    it('should fail if sync not enabled', () => {
      const manifestPath = path.join(tempDir, 'manifest.yaml');

      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
        },
        spec: {
          role: 'Test role',
        },
        extensions: {
          agents_md: {
            enabled: true,
            sync: {
              on_manifest_change: false,
            },
          },
        },
      };

      fs.writeFileSync(manifestPath, JSON.stringify(manifest));

      expect(() => {
        execSync(
          `node --require reflect-metadata dist/cli/index.js agents-md sync ${manifestPath}`,
          {
            encoding: 'utf-8',
            cwd: path.resolve(__dirname, '../../..'),
          }
        );
      }).toThrow();
    });
  });

  describe('end-to-end workflow', () => {
    it('should generate, validate, and sync AGENTS.md', () => {
      const manifestPath = path.join(tempDir, 'manifest.yaml');
      const agentsMdPath = path.join(tempDir, 'AGENTS.md');

      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: {
          name: 'workflow-agent',
          labels: {
            domain: 'development',
          },
        },
        spec: {
          role: 'Full-stack development agent',
          tools: [
            {
              type: 'mcp',
              name: 'filesystem',
              server: 'fs-mcp',
            },
          ],
          autonomy: {
            level: 'supervised',
            approval_required: true,
          },
        },
        extensions: {
          agents_md: {
            enabled: true,
            output_path: agentsMdPath,
            sections: {
              dev_environment: {
                enabled: true,
                source: 'spec.tools',
              },
              pr_instructions: {
                enabled: true,
                title_format: '[{metadata.labels.domain}] {title}',
              },
            },
            sync: {
              on_manifest_change: true,
            },
          },
        },
      };

      fs.writeFileSync(manifestPath, stringifyYaml(manifest));

      // Step 1: Generate
      execSync(
        `node --require reflect-metadata dist/cli/index.js agents-md generate ${manifestPath} --output ${agentsMdPath}`,
        {
          encoding: 'utf-8',
          cwd: path.resolve(__dirname, '../../..'),
        }
      );

      expect(fs.existsSync(agentsMdPath)).toBe(true);

      // Step 2: Validate
      const validateOutput = execSync(
        `node --require reflect-metadata dist/cli/index.js agents-md validate ${agentsMdPath} ${manifestPath}`,
        {
          encoding: 'utf-8',
          cwd: path.resolve(__dirname, '../../..'),
        }
      );

      expect(validateOutput).toContain('✓');

      // Step 3: Verify content
      const content = fs.readFileSync(agentsMdPath, 'utf-8');
      expect(content).toContain('filesystem');
      expect(content).toContain('[development]');
    });
  });
});
