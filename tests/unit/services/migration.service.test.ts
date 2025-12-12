import { describe, it, expect, beforeEach } from '@jest/globals';
import { MigrationService } from '../../../src/services/migration.service.js';

describe('MigrationService', () => {
  let service: MigrationService;

  beforeEach(() => {
    service = new MigrationService();
  });

  describe('migrate', () => {
    it('should handle k8s-style format', async () => {
      const input = {
        apiVersion: 'ossa/v0.3.0',
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: { role: 'test' }
      };
      const result = await service.migrate(input);
      expect(result.apiVersion).toBe('ossa/v0.3.0');
    });

    it('should migrate legacy v1.0 to k8s-style with full metadata', async () => {
      const v1Input = {
        ossaVersion: '1.0',
        agent: {
          id: 'test-agent',
          name: 'Test Agent',
          version: '1.0.0',
          description: 'Test description',
          role: 'assistant',
          tags: ['test', 'demo'],
          llm: {
            provider: 'openai',
            model: 'gpt-4',
            temperature: 0.7,
            maxTokens: 1000
          },
          capabilities: [
            { name: 'tool1' },
            { name: 'tool2' }
          ],
          autonomy: { level: 'high' },
          constraints: { maxTime: 60 },
          observability: { enabled: true },
          integration: {
            mcp: { server_name: 'test-server' }
          }
        },
        metadata: {
          authors: ['Author 1', 'Author 2'],
          license: 'MIT',
          repository: 'https://github.com/test/repo'
        }
      };
      const result = await service.migrate(v1Input);
      expect(result.apiVersion).toBe('ossa/v0.3.0');
      expect(result.metadata.name).toBe('test-agent');
      expect(result.metadata.labels?.test).toBe('true');
      expect(result.metadata.annotations?.author).toContain('Author 1');
      expect(result.metadata.annotations?.license).toBe('MIT');
      expect(result.spec.llm?.provider).toBe('openai');
      expect(result.spec.llm?.temperature).toBe(0.7);
      expect(result.spec.tools?.length).toBe(2);
    });

    it('should handle v1.0 with auto provider', async () => {
      const v1Input = {
        ossaVersion: '1.0',
        agent: {
          id: 'test',
          version: '1.0.0',
          role: 'assistant',
          llm: { provider: 'auto', model: 'gpt-4' }
        }
      };
      const result = await service.migrate(v1Input);
      expect(result.spec.llm?.provider).toBe('openai');
    });

    it('should handle v1.0 with monitoring instead of observability', async () => {
      const v1Input = {
        ossaVersion: '1.0',
        agent: {
          id: 'test',
          version: '1.0.0',
          role: 'assistant',
          monitoring: { enabled: true }
        }
      };
      const result = await service.migrate(v1Input);
      expect(result).toBeDefined();
    });

    it('should handle v1.0 with deployment config', async () => {
      const v1Input = {
        ossaVersion: '1.0',
        agent: {
          id: 'test',
          version: '1.0.0',
          role: 'assistant',
          deployment: { platform: 'kubernetes' }
        }
      };
      const result = await service.migrate(v1Input);
      expect(result).toBeDefined();
    });

    it('should handle v1.0 with runtime config', async () => {
      const v1Input = {
        ossaVersion: '1.0',
        agent: {
          id: 'test',
          version: '1.0.0',
          role: 'assistant',
          runtime: { timeout: 30 }
        }
      };
      const result = await service.migrate(v1Input);
      expect(result).toBeDefined();
    });

    it('should handle v1.0 without version', async () => {
      const v1Input = {
        ossaVersion: '1.0',
        agent: {
          id: 'test',
          role: 'assistant'
        }
      };
      const result = await service.migrate(v1Input);
      expect(result.metadata.version).toBeDefined();
    });

    it('should handle existing v0.2.2 format with all fields', async () => {
      const input = {
        apiVersion: 'ossa/v0.2.2',
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: { role: 'test', llm: { provider: 'openai', model: 'gpt-4' }, tools: [] }
      };
      const result = await service.migrate(input);
      // Migration now converts to runtime-configurable LLM with env var defaults
      // The original provider becomes the default in the env var template
      expect(result.spec.llm?.provider).toBe('${LLM_PROVIDER:-openai}');
    });

    it('should throw for unsupported format', async () => {
      const invalid = { random: 'data' };
      await expect(service.migrate(invalid)).rejects.toThrow('Unsupported manifest format');
    });
  });
});
