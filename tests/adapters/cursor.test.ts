/**
 * Tests for Cursor Cloud Agent Adapter
 */

import { describe, it, expect } from 'vitest';
import { CursorAdapter } from '../../src/adapters/cursor/adapter.js';
import type { OssaAgent } from '../../src/types/index.js';

describe('CursorAdapter', () => {
  const adapter = new CursorAdapter();

  const validManifest: OssaAgent = {
    apiVersion: 'ossa/v0.3.3',
    kind: 'Agent',
    metadata: {
      name: 'test-cursor-agent',
      version: '1.0.0',
      description: 'Test Cursor agent',
    },
    spec: {
      role: 'Test coding assistant for Cursor IDE',
      capabilities: ['code-generation', 'refactoring'] as any,
      tools: [
        {
          type: 'function',
          name: 'generate_code',
          description: 'Generate code from description',
          inputSchema: {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description: 'Code description',
              },
              language: {
                type: 'string',
                description: 'Programming language',
              },
            },
            required: ['description', 'language'],
          },
        },
      ],
    },
  };

  describe('metadata', () => {
    it('should have correct platform identifier', () => {
      expect(adapter.platform).toBe('cursor');
    });

    it('should have display name', () => {
      expect(adapter.displayName).toBe('Cursor Cloud Agent');
    });

    it('should have description', () => {
      expect(adapter.description).toContain('Cursor');
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

    it('should warn about missing tools', async () => {
      const noTools = {
        ...validManifest,
        spec: {
          role: 'Test agent',
          tools: [],
        },
      };

      const result = await adapter.validate(noTools);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w) => w.path === 'spec.tools')).toBe(true);
    });
  });

  describe('export', () => {
    it('should export valid manifest', async () => {
      const result = await adapter.export(validManifest);

      expect(result.success).toBe(true);
      expect(result.platform).toBe('cursor');
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should generate cursor-agent.json', async () => {
      const result = await adapter.export(validManifest);

      const configFile = result.files.find((f) =>
        f.path.includes('cursor-agent.json')
      );
      expect(configFile).toBeDefined();
      expect(configFile?.type).toBe('config');
      expect(configFile?.language).toBe('json');

      // Validate JSON structure
      const config = JSON.parse(configFile!.content);
      expect(config.version).toBe('1.0');
      expect(config.agent).toBeDefined();
      expect(config.agent.name).toBe('test-cursor-agent');
    });

    it('should generate agent.ts', async () => {
      const result = await adapter.export(validManifest);

      const agentFile = result.files.find((f) => f.path.includes('agent.ts'));
      expect(agentFile).toBeDefined();
      expect(agentFile?.type).toBe('code');
      expect(agentFile?.language).toBe('typescript');
    });

    it('should generate tool implementations', async () => {
      const result = await adapter.export(validManifest);

      const toolFile = result.files.find(
        (f) => f.path.includes('tools/') && f.path.endsWith('.ts')
      );
      expect(toolFile).toBeDefined();
      expect(toolFile?.type).toBe('code');
    });

    it('should generate package.json', async () => {
      const result = await adapter.export(validManifest);

      const pkgFile = result.files.find((f) => f.path.includes('package.json'));
      expect(pkgFile).toBeDefined();

      const pkg = JSON.parse(pkgFile!.content);
      expect(pkg.name).toBe('test-cursor-agent');
      expect(pkg.type).toBe('module');
    });

    it('should generate tsconfig.json', async () => {
      const result = await adapter.export(validManifest);

      const tsconfig = result.files.find((f) =>
        f.path.includes('tsconfig.json')
      );
      expect(tsconfig).toBeDefined();

      const config = JSON.parse(tsconfig!.content);
      expect(config.compilerOptions).toBeDefined();
    });

    it('should generate README', async () => {
      const result = await adapter.export(validManifest);

      const readme = result.files.find((f) => f.path.includes('README.md'));
      expect(readme).toBeDefined();
      expect(readme?.content).toContain('Cursor Cloud Agent');
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

    it('should have coding-focused capabilities', () => {
      const example = adapter.getExample();

      expect(example.spec?.capabilities).toBeDefined();
      expect(Array.isArray(example.spec?.capabilities)).toBe(true);
      expect(example.spec?.capabilities?.some((c: any) =>
        typeof c === 'string'
          ? c.includes('code')
          : c.name?.includes('code')
      )).toBe(true);
    });
  });
});
