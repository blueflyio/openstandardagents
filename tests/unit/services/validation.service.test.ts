/**
 * ValidationService Unit Tests
 * Test validation logic with various manifest scenarios
 */

import { SchemaRepository } from '../../../src/repositories/schema.repository.js';
import { ValidationService } from '../../../src/services/validation.service.js';

describe('ValidationService', () => {
  let validationService: ValidationService;
  let schemaRepository: SchemaRepository;

  beforeEach(() => {
    schemaRepository = new SchemaRepository();
    validationService = new ValidationService(schemaRepository);
  });

  afterEach(() => {
    schemaRepository.clearCache();
  });

  describe('validate()', () => {
    it('should validate a correct minimal manifest (v0.2.3)', async () => {
      const manifest: any = {
        apiVersion: 'ossa/v0.2.3',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
          description: 'A test agent',
        },
        spec: {
          role: 'You are a helpful assistant',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [
            {
              type: 'function',
              name: 'text_generation',
            },
          ],
        },
      };

      const result = await validationService.validate(manifest, '0.2.3');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.manifest).toBeDefined();
      expect(result.manifest?.metadata.name).toBe('test-agent');
    });

    it('should reject invalid agent ID (uppercase)', async () => {
      const manifest = {
        apiVersion: 'ossa/v0.2.3',
        kind: 'Agent',
        metadata: {
          name: 'INVALID_ID', // Must be lowercase DNS-1123 format
          version: '1.0.0',
        },
        spec: {
          role: 'You are a helpful assistant',
          capabilities: [
            {
              name: 'test',
              description: 'Test capability',
              input_schema: { type: 'object' },
              output_schema: { type: 'object' },
            },
          ],
        },
      };

      const result = await validationService.validate(manifest, '0.2.3');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toMatch(/pattern/i);
    });

    it('should reject manifest missing required fields', async () => {
      const manifest = {
        apiVersion: 'ossa/v0.2.3',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          // Missing required fields: version
        },
        spec: {
          // Missing required fields: role, llm
        },
      };

      const result = await validationService.validate(manifest, '0.2.3');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate warnings for missing best practices', async () => {
      const manifest: any = {
        apiVersion: 'ossa/v0.2.3',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
          // Missing: description (best practice)
        },
        spec: {
          role: 'You are a helpful assistant',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [],
        },
      };

      const result = await validationService.validate(manifest, '0.2.3');

      expect(result.valid).toBe(true); // Schema valid
      expect(result.warnings.length).toBeGreaterThan(0);

      // Check that description warning exists (missing description is a best practice warning)
      const hasDescriptionWarning = result.warnings.some((w) =>
        w.includes('description')
      );
      expect(hasDescriptionWarning).toBe(true);
    });

    it('should validate manifest with extensions', async () => {
      const manifest: any = {
        apiVersion: 'ossa/v0.2.3',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
          description: 'Test agent with extensions',
        },
        spec: {
          role: 'You are a helpful assistant',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [
            {
              type: 'function',
              name: 'chat',
            },
          ],
        },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'production',
              labels: { app: 'test' },
            },
          },
        },
      };

      const result = await validationService.validate(manifest, '0.2.3');

      expect(result.valid).toBe(true);
      expect(result.manifest?.extensions).toBeDefined();
      expect(result.manifest?.extensions?.kagent).toBeDefined();
    });

    it('should reject manifest with invalid version string', async () => {
      const manifest = {
        apiVersion: 'ossa/v0.2.3',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: 'not-semver', // Invalid semver
        },
        spec: {
          role: 'You are a helpful assistant',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [],
        },
      };

      const result = await validationService.validate(manifest, '0.2.3');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle schema loading errors gracefully', async () => {
      const manifest = { test: 'data' };

      // Invalid schema version
      const result = await validationService.validate(manifest, '999.0' as any);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateMany()', () => {
    it('should validate multiple manifests', async () => {
      const manifests: any[] = [
        {
          apiVersion: 'ossa/v0.2.3',
          kind: 'Agent',
          metadata: {
            name: 'agent-1',
            version: '1.0.0',
            description: 'First agent',
          },
          spec: {
            role: 'You are a helpful assistant',
            llm: {
              provider: 'openai',
              model: 'gpt-4',
            },
            tools: [
              {
                type: 'function',
                name: 'chat',
              },
            ],
          },
        },
        {
          apiVersion: 'ossa/v0.2.3',
          kind: 'Agent',
          metadata: {
            name: 'agent-2',
            version: '1.0.0',
            description: 'Second agent',
          },
          spec: {
            role: 'You are a workflow assistant',
            llm: {
              provider: 'openai',
              model: 'gpt-4',
            },
            tools: [
              {
                type: 'function',
                name: 'workflow',
              },
            ],
          },
        },
      ];

      const results = await validationService.validateMany(manifests, '0.2.3');

      expect(results).toHaveLength(2);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(true);
    });

    it('should identify invalid manifests in a batch', async () => {
      const manifests = [
        {
          apiVersion: 'ossa/v0.2.3',
          kind: 'Agent',
          metadata: {
            name: 'valid-agent',
            version: '1.0.0',
          },
          spec: {
            role: 'You are a helpful assistant',
            llm: {
              provider: 'openai',
              model: 'gpt-4',
            },
            tools: [],
          },
        },
        {
          // Invalid manifest - missing required fields
          apiVersion: 'ossa/v0.2.3',
          kind: 'Agent',
          metadata: {
            name: 'invalid-agent',
            // Missing version
          },
          spec: {
            // Missing role and llm
          },
        },
      ];

      const results = await validationService.validateMany(manifests, '0.2.3');

      expect(results).toHaveLength(2);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(false);
    });
  });
});
