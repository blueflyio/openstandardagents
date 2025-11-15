/**
 * ValidationService Unit Tests
 * Test validation logic with various manifest scenarios
 */

import { SchemaRepository } from '../../../src/repositories/schema.repository.js';
import { ValidationService } from '../../../src/services/validation.service.js';
import type { OssaAgent } from '../../../src/types/index.js';

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
        ossaVersion: '0.2.3',
        agent: {
          id: 'test-agent',
          name: 'Test Agent',
          version: '0.2.3',
          role: 'chat',
          description: 'A test agent',
          runtime: {
            type: 'docker',
            image: 'test-agent:0.2.3',
          },
          capabilities: [
            {
              name: 'text_generation',
              description: 'Generate text responses',
              input_schema: {
                type: 'object',
                properties: {
                  prompt: { type: 'string' },
                },
              },
              output_schema: {
                type: 'object',
                properties: {
                  response: { type: 'string' },
                },
              },
            },
          ],
        },
      };

      const result = await validationService.validate(manifest, '0.2.3');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.manifest).toBeDefined();
      expect(result.manifest?.agent.id).toBe('test-agent');
    });

    it('should reject invalid agent ID (uppercase)', async () => {
      const manifest = {
        ossaVersion: '0.2.3',
        agent: {
          id: 'INVALID_ID', // Must be lowercase DNS-1123 format
          name: 'Test',
          version: '0.2.3',
          role: 'chat',
          runtime: { type: 'docker' },
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
        ossaVersion: '0.2.3',
        agent: {
          id: 'test-agent',
          // Missing required fields: name, version, role, runtime, capabilities
        },
      };

      const result = await validationService.validate(manifest, '0.2.3');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate warnings for missing best practices', async () => {
      const manifest: any = {
        ossaVersion: '0.2.3',
        agent: {
          id: 'test-agent',
          name: 'Test Agent',
          version: '0.2.3',
          role: 'chat',
          // Missing: description, llm, tools, autonomy, constraints
          runtime: { type: 'docker' },
          capabilities: [
            {
              name: 'basic_capability',
              description: 'Basic capability',
              input_schema: { type: 'object' },
              output_schema: { type: 'object' },
            },
          ],
        },
      };

      const result = await validationService.validate(manifest, '0.2.3');

      expect(result.valid).toBe(true); // Schema valid
      expect(result.warnings.length).toBeGreaterThan(0);

      // Check that description warning exists
      const hasDescriptionWarning = result.warnings.some((w) =>
        w.includes('description')
      );
      expect(hasDescriptionWarning).toBe(true);

      // Check that LLM warning exists
      const hasLLMWarning = result.warnings.some((w) =>
        w.includes('LLM configuration')
      );
      expect(hasLLMWarning).toBe(true);
    });

    it('should validate manifest with extensions', async () => {
      const manifest: any = {
        ossaVersion: '0.2.3',
        agent: {
          id: 'test-agent',
          name: 'Test Agent',
          version: '0.2.3',
          role: 'chat',
          description: 'Test agent with extensions',
          runtime: { type: 'k8s' },
          capabilities: [
            {
              name: 'chat',
              description: 'Chat with users',
              input_schema: {
                type: 'object',
                properties: { message: { type: 'string' } },
              },
              output_schema: {
                type: 'object',
                properties: { response: { type: 'string' } },
              },
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
        ossaVersion: '0.2.3',
        agent: {
          id: 'test-agent',
          name: 'Test',
          version: 'not-semver', // Invalid semver
          role: 'chat',
          runtime: { type: 'docker' },
          capabilities: [],
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
          ossaVersion: '0.2.3',
          agent: {
            id: 'agent-1',
            name: 'Agent 1',
            version: '0.2.3',
            role: 'chat',
            description: 'First agent',
            runtime: { type: 'docker' },
            capabilities: [
              {
                name: 'chat',
                description: 'Chat capability',
                input_schema: { type: 'object' },
                output_schema: { type: 'object' },
              },
            ],
          },
        },
        {
          ossaVersion: '0.2.3',
          agent: {
            id: 'agent-2',
            name: 'Agent 2',
            version: '0.2.3',
            role: 'workflow',
            description: 'Second agent',
            runtime: { type: 'k8s' },
            capabilities: [
              {
                name: 'workflow',
                description: 'Workflow capability',
                input_schema: { type: 'object' },
                output_schema: { type: 'object' },
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
          ossaVersion: '0.2.3',
          agent: {
            id: 'valid-agent',
            name: 'Valid',
            version: '0.2.3',
            role: 'chat',
            runtime: { type: 'docker' },
            capabilities: [
              {
                name: 'test',
                description: 'Test capability',
                input_schema: { type: 'object' },
                output_schema: { type: 'object' },
              },
            ],
          },
        },
        {
          ossaVersion: '0.2.3',
          agent: {
            id: 'INVALID',
            // Invalid ID - uppercase not allowed
            name: 'Invalid',
            version: '0.2.3',
            role: 'chat',
            runtime: { type: 'docker' },
            capabilities: [
              {
                name: 'test',
                description: 'Test capability',
                input_schema: { type: 'object' },
                output_schema: { type: 'object' },
              },
            ],
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
