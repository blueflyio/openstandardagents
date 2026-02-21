/**
 * Tests for Claude Code Sub-agent Adapter
 */

import { describe, it, expect } from '@jest/globals';
import { ClaudeCodeAdapter } from '../../src/adapters/claude-code/adapter.js';
import type { OssaAgent } from '../../src/types/index.js';

describe('ClaudeCodeAdapter', () => {
  const adapter = new ClaudeCodeAdapter();

  const validManifest: OssaAgent = {
    apiVersion: 'ossa/v0.3.3',
    kind: 'Agent',
    metadata: {
      name: 'test-claude-code-subagent',
      version: '1.0.0',
      description: 'Test Claude Code sub-agent',
    },
    spec: {
      role: 'Test sub-agent for code exploration',
      capabilities: ['explore', 'code-analysis'] as any,
      tools: [
        {
          type: 'function',
          name: 'analyze_codebase',
          description: 'Analyze codebase structure',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to analyze',
              },
              depth: {
                type: 'number',
                description: 'Analysis depth',
              },
            },
            required: ['path'],
          },
        },
      ],
      max_iterations: 15,
    },
  };

  describe('metadata', () => {
    it('should have correct platform identifier', () => {
      expect(adapter.platform).toBe('claude-code');
    });

    it('should have display name', () => {
      expect(adapter.displayName).toBe('Claude Code Sub-agent');
    });

    it('should have description', () => {
      expect(adapter.description).toContain('Claude Code');
    });

    it('should support v0.3.3', () => {
      expect(adapter.supportedVersions).toContain('v{{VERSION}}');
    });
  });

  describe('validate', () => {
    it('should validate valid manifest', async () => {
      const result = await adapter.validate(validManifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should require spec.role', async () => {
      const invalid = {
        ...validManifest,
        spec: {
          tools: [],
        },
      } as any;

      const result = await adapter.validate(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some((e) => e.path === 'spec.role')).toBe(true);
    });

    it('should warn about missing tools and capabilities', async () => {
      const noTools = {
        ...validManifest,
        spec: {
          role: 'Test agent',
        },
      };

      const result = await adapter.validate(noTools);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThan(0);
    });
  });

  describe('export', () => {
    it('should export valid manifest', async () => {
      const result = await adapter.export(validManifest);

      expect(result.success).toBe(true);
      expect(result.platform).toBe('claude-code');
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should generate subagent.json', async () => {
      const result = await adapter.export(validManifest);

      const configFile = result.files.find((f) =>
        f.path.includes('subagent.json')
      );
      expect(configFile).toBeDefined();
      expect(configFile?.type).toBe('config');
      expect(configFile?.language).toBe('json');

      // Validate JSON structure
      const config = JSON.parse(configFile!.content);
      expect(config.version).toBe('1.0');
      expect(config.subagent).toBeDefined();
      expect(config.subagent.name).toBe('test-claude-code-subagent');
      expect(config.subagent.subagent_type).toBeDefined();
    });

    it('should detect correct subagent type', async () => {
      const result = await adapter.export(validManifest);

      const configFile = result.files.find((f) =>
        f.path.includes('subagent.json')
      );
      const config = JSON.parse(configFile!.content);

      // Should be 'Explore' type due to 'explore' capability
      expect(config.subagent.subagent_type).toBe('Explore');
    });

    it('should generate SKILL.md', async () => {
      const result = await adapter.export(validManifest);

      const skillFile = result.files.find((f) => f.path.includes('SKILL.md'));
      expect(skillFile).toBeDefined();
      expect(skillFile?.type).toBe('documentation');
      expect(skillFile?.content).toContain('Claude Code Skill');
    });

    it('should generate bash tool implementations', async () => {
      const result = await adapter.export(validManifest);

      const toolFile = result.files.find(
        (f) => f.path.includes('tools/') && f.path.endsWith('.sh')
      );
      expect(toolFile).toBeDefined();
      expect(toolFile?.type).toBe('code');
      expect(toolFile?.language).toBe('bash');
      expect(toolFile?.content).toContain('#!/usr/bin/env bash');
    });

    it('should generate README', async () => {
      const result = await adapter.export(validManifest);

      const readme = result.files.find((f) => f.path.includes('README.md'));
      expect(readme).toBeDefined();
      expect(readme?.content).toContain('Generated from OSSA');
    });

    it('should respect max_iterations', async () => {
      const result = await adapter.export(validManifest);

      const configFile = result.files.find((f) =>
        f.path.includes('subagent.json')
      );
      const config = JSON.parse(configFile!.content);

      expect(config.subagent.max_turns).toBe(15);
    });

    it('should include export metadata', async () => {
      const result = await adapter.export(validManifest);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getExample', () => {
    it('should return example manifest', () => {
      const example = adapter.getExample();

      expect(example.apiVersion).toBeDefined();
      expect(example.kind).toBe('Agent');
      expect(example.metadata?.name).toBeDefined();
      expect(example.spec?.role).toBeDefined();
    });

    it('should have exploration-focused capabilities', () => {
      const example = adapter.getExample();

      expect(example.spec?.capabilities).toBeDefined();
      expect(Array.isArray(example.spec?.capabilities)).toBe(true);
      expect(
        example.spec?.capabilities?.some((c: any) =>
          typeof c === 'string'
            ? c.includes('explore') || c.includes('analysis')
            : c.name?.includes('explore') || c.name?.includes('analysis')
        )
      ).toBe(true);
    });
  });

  describe('subagent type detection', () => {
    it('should detect Explore type', async () => {
      const exploreManifest = {
        ...validManifest,
        spec: {
          ...validManifest.spec,
          capabilities: ['explore'] as any,
        },
      };

      const result = await adapter.export(exploreManifest);
      const config = JSON.parse(
        result.files.find((f) => f.path.includes('subagent.json'))!.content
      );

      expect(config.subagent.subagent_type).toBe('Explore');
    });

    it('should detect Plan type', async () => {
      const planManifest = {
        ...validManifest,
        spec: {
          ...validManifest.spec,
          capabilities: ['plan', 'planning'] as any,
        },
      };

      const result = await adapter.export(planManifest);
      const config = JSON.parse(
        result.files.find((f) => f.path.includes('subagent.json'))!.content
      );

      expect(config.subagent.subagent_type).toBe('Plan');
    });

    it('should detect Bash type', async () => {
      const bashManifest = {
        ...validManifest,
        spec: {
          ...validManifest.spec,
          capabilities: ['bash', 'shell'] as any,
        },
      };

      const result = await adapter.export(bashManifest);
      const config = JSON.parse(
        result.files.find((f) => f.path.includes('subagent.json'))!.content
      );

      expect(config.subagent.subagent_type).toBe('Bash');
    });

    it('should default to general-purpose', async () => {
      const genericManifest = {
        ...validManifest,
        spec: {
          ...validManifest.spec,
          capabilities: ['custom-capability'] as any,
        },
      };

      const result = await adapter.export(genericManifest);
      const config = JSON.parse(
        result.files.find((f) => f.path.includes('subagent.json'))!.content
      );

      expect(config.subagent.subagent_type).toBe('general-purpose');
    });
  });
});
