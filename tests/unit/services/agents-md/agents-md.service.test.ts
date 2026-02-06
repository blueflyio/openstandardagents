import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AgentsMdService } from '../../../../src/services/agents-md/agents-md.service.js';
import type { OssaAgent } from '../../../../src/types/index.js';
import * as fs from 'fs/promises';
import { API_VERSION } from '../../../src/version.js';

// Mock fs module
jest.mock('fs/promises');

describe('AgentsMdService', () => {
  let service: AgentsMdService;

  beforeEach(() => {
    service = new AgentsMdService();
    jest.clearAllMocks();
  });

  describe('generateAgentsMd', () => {
    it('should generate AGENTS.md from manifest with all sections', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
          labels: {
            domain: 'development',
          },
        },
        spec: {
          role: 'Test agent role',
          tools: [
            {
              type: 'mcp',
              name: 'git_operations',
              server: 'git-mcp-server',
            },
          ],
          constraints: {
            performance: {
              maxLatencySeconds: 30,
            },
          },
          autonomy: {
            level: 'supervised',
            approval_required: true,
          },
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
                source: 'spec.constraints',
              },
              pr_instructions: {
                enabled: true,
                source: 'spec.autonomy',
              },
            },
            sync: {
              include_comments: true,
            },
          },
        },
      };

      const content = await service.generateAgentsMd(manifest);

      expect(content).toContain('# Dev environment tips');
      expect(content).toContain('# Testing instructions');
      expect(content).toContain('# PR instructions');
      expect(content).toContain('<!-- Generated from OSSA manifest');
      expect(content).toContain('git_operations');
    });

    it('should generate with custom sections', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
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
            sections: {
              dev_environment: {
                enabled: true,
                custom: 'Custom dev environment instructions',
              },
              testing: {
                enabled: true,
                custom: 'Custom testing instructions',
              },
            },
          },
        },
      };

      const content = await service.generateAgentsMd(manifest);

      expect(content).toContain('Custom dev environment instructions');
      expect(content).toContain('Custom testing instructions');
    });

    it('should skip disabled sections', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
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
            sections: {
              dev_environment: {
                enabled: false,
              },
              testing: {
                enabled: true,
                custom: 'Testing only',
              },
            },
          },
        },
      };

      const content = await service.generateAgentsMd(manifest);

      expect(content).not.toContain('# Dev environment tips');
      expect(content).toContain('# Testing instructions');
    });

    it('should throw error if extension not enabled', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
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

      await expect(service.generateAgentsMd(manifest)).rejects.toThrow(
        'agents_md extension is not enabled'
      );
    });

    it('should generate without comments when disabled', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
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
              include_comments: false,
            },
          },
        },
      };

      const content = await service.generateAgentsMd(manifest);

      expect(content).not.toContain('<!-- Generated from OSSA manifest');
    });

    it('should format PR title with template variables', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          labels: {
            domain: 'backend',
          },
        },
        spec: {
          role: 'Test role',
        },
        extensions: {
          agents_md: {
            enabled: true,
            sections: {
              pr_instructions: {
                enabled: true,
                title_format: '[{metadata.labels.domain}] {title}',
              },
            },
          },
        },
      };

      const content = await service.generateAgentsMd(manifest);

      expect(content).toContain('[backend]');
    });
  });

  describe('writeAgentsMd', () => {
    it('should write AGENTS.md to default path', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
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
            output_path: 'AGENTS.md',
          },
        },
      };

      await service.writeAgentsMd(manifest);

      expect(fs.writeFile).toHaveBeenCalledWith(
        'AGENTS.md',
        expect.any(String),
        'utf-8'
      );
    });

    it('should write to custom output path', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
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

      await service.writeAgentsMd(manifest, '.github/AGENTS.md');

      expect(fs.writeFile).toHaveBeenCalledWith(
        '.github/AGENTS.md',
        expect.any(String),
        'utf-8'
      );
    });
  });

  describe('validateAgentsMd', () => {
    it('should validate existing AGENTS.md', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
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

      const mockContent = `# Dev environment tips
Test content

# Testing instructions
Test content

# PR instructions
Test content`;

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await service.validateAgentsMd('AGENTS.md', manifest);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return warnings for missing sections', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
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

      const mockContent = `# Dev environment tips
Test content`;

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await service.validateAgentsMd('AGENTS.md', manifest);

      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings).toContain(
        'Missing "Testing instructions" section'
      );
    });

    it('should return error if file not found', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
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

      (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      const result = await service.validateAgentsMd('AGENTS.md', manifest);

      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('AGENTS.md file not found');
    });
  });

  describe('parseAgentsMd', () => {
    it('should extract role hints from content', async () => {
      const mockContent = `# Dev environment tips
This agent performs code review and testing.

# Testing instructions
Run tests before deployment.`;

      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await service.parseAgentsMd('AGENTS.md');

      expect(result.spec?.role).toContain('code review');
      expect(result.spec?.role).toContain('testing');
    });

    it('should extract tool hints from commands', async () => {
      const mockContent = `# Dev environment tips
Run \`npm test\` and \`git commit\` before pushing.`;

      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await service.parseAgentsMd('AGENTS.md');

      expect(result.spec?.tools).toBeDefined();
      expect(result.spec?.tools?.length).toBeGreaterThan(0);
    });

    it('should populate cursor context files', async () => {
      const mockContent = `# Dev environment tips
See \`README.md\` and \`CONTRIBUTING.md\` for details.`;

      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await service.parseAgentsMd('AGENTS.md');

      expect(
        result.extensions?.cursor?.workspace_config?.context_files
      ).toContain('README.md');
      expect(
        result.extensions?.cursor?.workspace_config?.context_files
      ).toContain('CONTRIBUTING.md');
    });
  });

  describe('syncAgentsMd', () => {
    it('should sync AGENTS.md from manifest', async () => {
      const mockManifest = {
        apiVersion: API_VERSION,
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
              on_manifest_change: true,
            },
          },
        },
      };

      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockManifest)
      );
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await service.syncAgentsMd('manifest.json', false);

      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should throw error if sync not enabled', async () => {
      const mockManifest = {
        apiVersion: API_VERSION,
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

      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockManifest)
      );

      await expect(
        service.syncAgentsMd('manifest.json', false)
      ).rejects.toThrow('Sync on manifest change is not enabled');
    });
  });
});
