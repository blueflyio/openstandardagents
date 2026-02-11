/**
 * Tests for Warp Terminal Adapter
 */

import { describe, it, expect } from 'vitest';
import { WarpAdapter } from '../../src/adapters/warp/adapter.js';
import type { OssaAgent } from '../../src/types/index.js';

describe('WarpAdapter', () => {
  const adapter = new WarpAdapter();

  const validManifest: OssaAgent = {
    apiVersion: 'ossa/v0.3.3',
    kind: 'Agent',
    metadata: {
      name: 'test-warp-agent',
      version: '1.0.0',
      description: 'Test Warp agent',
    },
    spec: {
      role: 'Test agent for Warp Terminal',
      capabilities: ['git-commit', 'run-tests'] as any,
      tools: [
        {
          type: 'command',
          name: 'git_commit',
          description: 'Create git commit',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Commit message',
              },
            },
            required: ['message'],
          },
        },
      ],
    },
  };

  describe('metadata', () => {
    it('should have correct platform identifier', () => {
      expect(adapter.platform).toBe('warp');
    });

    it('should have display name', () => {
      expect(adapter.displayName).toBe('Warp Terminal');
    });

    it('should have description', () => {
      expect(adapter.description).toContain('Warp terminal');
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

    it('should require metadata.name', async () => {
      const invalid = {
        ...validManifest,
        metadata: {
          version: '1.0.0',
        },
      } as any;

      const result = await adapter.validate(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some((e) => e.path === 'metadata.name')).toBe(true);
    });

    it('should warn about missing tools/capabilities', async () => {
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
      expect(result.platform).toBe('warp');
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should generate warp-agent.yaml', async () => {
      const result = await adapter.export(validManifest);

      const configFile = result.files.find((f) =>
        f.path.includes('warp-agent.yaml')
      );
      expect(configFile).toBeDefined();
      expect(configFile?.type).toBe('config');
      expect(configFile?.language).toBe('yaml');
    });

    it('should generate command handlers', async () => {
      const result = await adapter.export(validManifest);

      const handlerFile = result.files.find(
        (f) => f.path.includes('handlers/') && f.path.endsWith('.sh')
      );
      expect(handlerFile).toBeDefined();
      expect(handlerFile?.type).toBe('code');
      expect(handlerFile?.language).toBe('bash');
    });

    it('should generate README', async () => {
      const result = await adapter.export(validManifest);

      const readme = result.files.find((f) => f.path.includes('README.md'));
      expect(readme).toBeDefined();
      expect(readme?.type).toBe('documentation');
    });

    it('should include source manifest', async () => {
      const result = await adapter.export(validManifest);

      const manifest = result.files.find((f) =>
        f.path.includes('agent.ossa.yaml')
      );
      expect(manifest).toBeDefined();
      expect(manifest?.type).toBe('config');
    });

    it('should include export metadata', async () => {
      const result = await adapter.export(validManifest);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.duration).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.version).toBeDefined();
    });

    it('should fail validation if requested', async () => {
      const invalid = {
        ...validManifest,
        metadata: {} as any,
      };

      const result = await adapter.export(invalid, { validate: true });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should skip validation if disabled', async () => {
      const result = await adapter.export(validManifest, { validate: false });
      expect(result.success).toBe(true);
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

    it('should have Warp-optimized capabilities', () => {
      const example = adapter.getExample();

      expect(example.spec?.capabilities).toBeDefined();
      expect(Array.isArray(example.spec?.capabilities)).toBe(true);
    });
  });
});
