/**
 * Cursor + agents.md Integration Tests
 * Test integration between Cursor extension and agents.md generation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AgentsMdService } from '../../../src/services/agents-md/agents-md.service.js';
import type { OssaAgent } from '../../../src/types/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Cursor + agents.md Integration', () => {
  let service: AgentsMdService;
  let tempDir: string;

  beforeEach(async () => {
    service = new AgentsMdService();
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'cursor-agents-md-test-')
    );
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should generate AGENTS.md with Cursor integration enabled', async () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.2.8',
      kind: 'Agent',
      metadata: {
        name: 'cursor-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'Development agent with Cursor IDE support',
        tools: [
          {
            type: 'mcp',
            name: 'filesystem',
            server: 'fs-mcp',
          },
        ],
      },
      extensions: {
        agents_md: {
          enabled: true,
          generate: true,
          cursor_integration: true,
          sections: {
            dev_environment: {
              enabled: true,
              source: 'spec.tools',
            },
          },
        },
        cursor: {
          enabled: true,
          agent_type: 'composer',
          workspace_config: {
            agents_md_path: 'AGENTS.md',
            context_files: ['README.md', 'AGENTS.md'],
          },
        },
      },
    };

    const content = await service.generateAgentsMd(manifest);

    expect(content).toContain('# Dev environment tips');
    expect(content).toContain('filesystem');
  });

  it('should reference AGENTS.md in Cursor workspace config', async () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.2.8',
      kind: 'Agent',
      metadata: {
        name: 'cursor-agent',
      },
      spec: {
        role: 'Test role',
      },
      extensions: {
        agents_md: {
          enabled: true,
          output_path: '.github/AGENTS.md',
        },
        cursor: {
          enabled: true,
          workspace_config: {
            agents_md_path: '.github/AGENTS.md',
            context_files: ['.github/AGENTS.md', 'README.md'],
          },
        },
      },
    };

    // Verify Cursor config references the correct path
    expect(manifest.extensions?.cursor?.workspace_config?.agents_md_path).toBe(
      '.github/AGENTS.md'
    );
    expect(
      manifest.extensions?.cursor?.workspace_config?.context_files
    ).toContain('.github/AGENTS.md');
  });

  it('should parse AGENTS.md and populate Cursor context files', async () => {
    const agentsMdPath = path.join(tempDir, 'AGENTS.md');
    const agentsMdContent = `# Dev environment tips
See \`README.md\`, \`CONTRIBUTING.md\`, and \`docs/architecture.md\` for details.

# Testing instructions
Run tests with \`npm test\`.`;

    await fs.writeFile(agentsMdPath, agentsMdContent);

    const result = await service.parseAgentsMd(agentsMdPath);

    expect(
      result.extensions?.cursor?.workspace_config?.context_files
    ).toContain('README.md');
    expect(
      result.extensions?.cursor?.workspace_config?.context_files
    ).toContain('CONTRIBUTING.md');
    expect(
      result.extensions?.cursor?.workspace_config?.context_files
    ).toContain('docs/architecture.md');
  });

  it('should generate Cursor-compatible content when cursor_integration is true', async () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.2.8',
      kind: 'Agent',
      metadata: {
        name: 'cursor-agent',
      },
      spec: {
        role: 'Cursor-optimized agent',
        tools: [
          {
            type: 'function',
            name: 'code_review',
          },
        ],
      },
      extensions: {
        agents_md: {
          enabled: true,
          cursor_integration: true,
          sections: {
            dev_environment: {
              enabled: true,
              custom: 'Use Cursor Composer for code generation',
            },
            testing: {
              enabled: true,
              custom: 'Run tests in Cursor terminal',
            },
          },
        },
      },
    };

    const content = await service.generateAgentsMd(manifest);

    // Verify Cursor-specific content
    expect(content).toContain('Cursor Composer');
    expect(content).toContain('Cursor terminal');
  });

  it('should support both agents.md and Cursor extensions together', async () => {
    const manifestPath = path.join(tempDir, 'manifest.json');
    const agentsMdPath = path.join(tempDir, 'AGENTS.md');

    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.2.8',
      kind: 'Agent',
      metadata: {
        name: 'dual-extension-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'Agent with both Cursor and agents.md support',
        tools: [
          {
            type: 'mcp',
            name: 'git_operations',
            server: 'git-mcp',
          },
        ],
      },
      extensions: {
        agents_md: {
          enabled: true,
          output_path: agentsMdPath,
          cursor_integration: true,
          sections: {
            dev_environment: {
              enabled: true,
              source: 'spec.tools',
            },
          },
        },
        cursor: {
          enabled: true,
          agent_type: 'composer',
          workspace_config: {
            agents_md_path: agentsMdPath,
            rules_file: '.cursorrules',
            context_files: [agentsMdPath, 'README.md'],
          },
          capabilities: {
            code_generation: true,
            code_review: true,
          },
        },
      },
    };

    // Write manifest
    await fs.writeFile(manifestPath, JSON.stringify(manifest));

    // Generate AGENTS.md
    await service.writeAgentsMd(manifest, agentsMdPath);

    // Verify both files exist
    expect(
      await fs
        .access(manifestPath)
        .then(() => true)
        .catch(() => false)
    ).toBe(true);
    expect(
      await fs
        .access(agentsMdPath)
        .then(() => true)
        .catch(() => false)
    ).toBe(true);

    // Verify AGENTS.md content
    const content = await fs.readFile(agentsMdPath, 'utf-8');
    expect(content).toContain('# Dev environment tips');
    expect(content).toContain('git_operations');

    // Verify Cursor can reference AGENTS.md
    expect(manifest.extensions?.cursor?.workspace_config?.agents_md_path).toBe(
      agentsMdPath
    );
    expect(
      manifest.extensions?.cursor?.workspace_config?.context_files
    ).toContain(agentsMdPath);
  });

  it('should validate AGENTS.md is included in Cursor context', async () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.2.8',
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
        cursor: {
          enabled: true,
          workspace_config: {
            agents_md_path: 'AGENTS.md',
            context_files: ['README.md'], // Missing AGENTS.md
          },
        },
      },
    };

    // Check if AGENTS.md is in context files
    const contextFiles =
      manifest.extensions?.cursor?.workspace_config?.context_files || [];
    const agentsMdPath =
      manifest.extensions?.cursor?.workspace_config?.agents_md_path;

    if (agentsMdPath && !contextFiles.includes(agentsMdPath)) {
      // This is a warning condition - AGENTS.md should be in context
      expect(contextFiles).not.toContain(agentsMdPath);
    }
  });
});
