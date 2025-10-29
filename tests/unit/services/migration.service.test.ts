/**
 * MigrationService Unit Tests
 * Test v1.0 to v0.2.2 migration
 */

import { MigrationService } from '../../../src/services/migration.service';

describe('MigrationService', () => {
  let service: MigrationService;

  beforeEach(() => {
    service = new MigrationService();
  });

  describe('migrate()', () => {
    it('should migrate basic v1.0 manifest to v0.2.2', async () => {
      const v1 = {
        ossaVersion: '1.0',
        agent: {
          id: 'test-agent',
          name: 'Test Agent',
          version: '1.0.0',
          description: 'Test agent',
          role: 'chat',
          tags: ['test'],
        },
      };

      const migrated = await service.migrate(v1);

      expect(migrated.apiVersion).toBe('ossa/v1');
      expect(migrated.kind).toBe('Agent');
      expect(migrated.metadata.name).toBe('test-agent');
      expect(migrated.metadata.version).toBe('1.0.0');
      expect(migrated.spec.role).toBe('chat');
      expect(migrated.metadata.description).toBe('Test agent');
      expect(migrated.spec.taxonomy).toBeDefined();
      expect(migrated.spec.extensions).toBeDefined();
    });

    it('should throw error for unsupported manifest format', async () => {
      const invalid = {
        unknown: 'format',
      };

      await expect(service.migrate(invalid)).rejects.toThrow(
        'Unsupported manifest format'
      );
    });

    it('should return v0.2.2 manifest as-is', async () => {
      const v022 = {
        apiVersion: 'ossa/v1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '0.1.0',
        },
        spec: {
          role: 'chat',
        },
      };

      const migrated = await service.migrate(v022);
      expect(migrated).toBe(v022);
    });

    it('should convert tags to labels', async () => {
      const v1 = {
        ossaVersion: '1.0',
        agent: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          role: 'chat',
          tags: ['tag1', 'tag2', 'tag3'],
        },
      };

      const migrated = await service.migrate(v1);
      expect(migrated.metadata.labels.tag1).toBe('true');
      expect(migrated.metadata.labels.tag2).toBe('true');
      expect(migrated.metadata.labels.tag3).toBe('true');
    });

    it('should migrate LLM configuration with auto provider normalization', async () => {
      const v1 = {
        ossaVersion: '1.0',
        agent: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          role: 'chat',
          llm: {
            provider: 'auto',
            model: 'gpt-4',
            temperature: 0.7,
            maxTokens: 2000,
          },
        },
      };

      const migrated = await service.migrate(v1);
      expect(migrated.spec.llm.provider).toBe('openai');
      expect(migrated.spec.llm.model).toBe('gpt-4');
    });

    it('should migrate capabilities to tools', async () => {
      const v1 = {
        ossaVersion: '1.0',
        agent: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          role: 'chat',
          capabilities: [
            {
              name: 'send_message',
              input_schema: { type: 'object' },
            },
          ],
        },
      };

      const migrated = await service.migrate(v1);
      expect(migrated.spec.tools).toBeDefined();
      expect(migrated.spec.tools.length).toBe(1);
      expect(migrated.spec.tools[0].type).toBe('mcp');
      expect(migrated.spec.tools[0].name).toBe('send_message');
    });

    it('should detect domain from agent properties', async () => {
      const v1 = {
        ossaVersion: '1.0',
        agent: {
          id: 'k8s-troubleshooter',
          name: 'K8s Troubleshooter',
          version: '1.0.0',
          role: 'infrastructure',
          tags: ['kubernetes', 'infrastructure'],
        },
      };

      const migrated = await service.migrate(v1);
      expect(migrated.spec.taxonomy.domain).toBe('infrastructure');
    });

    it('should handle observability with boolean metrics', async () => {
      const v1 = {
        ossaVersion: '1.0',
        agent: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          role: 'chat',
          observability: {
            metrics: true,
            tracing: { enabled: true },
          },
        },
      };

      const migrated = await service.migrate(v1);
      expect(migrated.spec.observability.metrics.enabled).toBe(true);
      expect(migrated.spec.observability.tracing.enabled).toBe(true);
    });
  });

  describe('needsMigration()', () => {
    it('should return true for v1.0 manifest', () => {
      const v1 = {
        ossaVersion: '1.0',
        agent: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          role: 'chat',
        },
      };

      expect(service.needsMigration(v1)).toBe(true);
    });

    it('should return false for v0.2.2 manifest', () => {
      const v022 = {
        apiVersion: 'ossa/v1',
        kind: 'Agent',
        metadata: {
          name: 'test',
          version: '0.1.0',
        },
        spec: {
          role: 'chat',
        },
      };

      expect(service.needsMigration(v022)).toBe(false);
    });

    it('should return false for invalid manifest', () => {
      expect(service.needsMigration({ invalid: true })).toBe(false);
    });
  });

  describe('migrateMany()', () => {
    it('should migrate multiple manifests', async () => {
      const v1Manifests = [
        {
          ossaVersion: '1.0',
          agent: {
            id: 'agent-1',
            name: 'Agent 1',
            version: '1.0.0',
            role: 'chat',
          },
        },
        {
          ossaVersion: '1.0',
          agent: {
            id: 'agent-2',
            name: 'Agent 2',
            version: '1.0.0',
            role: 'workflow',
          },
        },
      ];

      const migrated = await service.migrateMany(v1Manifests);

      expect(migrated).toHaveLength(2);
      expect(migrated[0].apiVersion).toBe('ossa/v1');
      expect(migrated[1].apiVersion).toBe('ossa/v1');
      expect(migrated[0].metadata.name).toBe('agent-1');
      expect(migrated[1].metadata.name).toBe('agent-2');
    });
  });
});
