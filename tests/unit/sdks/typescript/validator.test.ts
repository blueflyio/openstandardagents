/**
 * Tests for TypeScript SDK Validator
 * Following TDD principles - Testing enum and JSON schema validation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ValidatorService } from '../../../../src/sdks/typescript/validator.js';
import type {
  OSSAManifest,
  AgentManifest,
  LLMProvider,
  AccessTier,
} from '../../../../src/sdks/typescript/types.js';

describe('ValidatorService', () => {
  let validator: ValidatorService;

  beforeEach(() => {
    validator = new ValidatorService();
  });

  describe('Basic validation', () => {
    it('should validate a valid agent manifest', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test agent',
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject manifest with missing required fields', () => {
      const manifest = {
        kind: 'Agent',
        metadata: { name: 'test' },
      } as unknown as OSSAManifest;

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing apiVersion');
      expect(result.errors).toContain('Missing spec');
    });

    it('should reject invalid kind', () => {
      const manifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'InvalidKind',
        metadata: { name: 'test' },
        spec: {},
      } as unknown as OSSAManifest;

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid kind: InvalidKind');
    });
  });

  describe('LLM Provider validation', () => {
    it('should accept valid LLM provider - anthropic', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'anthropic' as LLMProvider,
            model: 'claude-3-opus',
          },
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid LLM provider - openai', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'openai' as LLMProvider,
            model: 'gpt-4',
          },
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid LLM provider - ollama', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'ollama' as LLMProvider,
            model: 'llama2',
          },
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid LLM provider', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'invalid-provider' as LLMProvider,
            model: 'some-model',
          },
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid LLM provider');
      expect(result.errors[0]).toContain('invalid-provider');
    });

    it('should list all valid LLM providers in error message', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'unknown' as LLMProvider,
            model: 'model',
          },
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('anthropic');
      expect(result.errors[0]).toContain('openai');
      expect(result.errors[0]).toContain('ollama');
    });
  });

  describe('Access Tier validation', () => {
    it('should accept valid access tier - tier_1_read', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          access_tier: 'tier_1_read' as AccessTier,
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid access tier shorthand - read', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          access_tier: 'read' as AccessTier,
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid access tier in identity', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          identity: {
            access_tier: 'tier_3_write_elevated' as AccessTier,
          },
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid access tier', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          access_tier: 'tier_5_super_admin' as AccessTier,
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid access tier');
      expect(result.errors[0]).toContain('tier_5_super_admin');
    });

    it('should list all valid access tiers in error message', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          access_tier: 'invalid' as AccessTier,
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('tier_1_read');
      expect(result.errors[0]).toContain('tier_2_write_limited');
      expect(result.errors[0]).toContain('tier_3_write_elevated');
      expect(result.errors[0]).toContain('tier_4_policy');
    });
  });

  describe('Tool validation', () => {
    it('should accept valid tool with name', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          tools: [
            {
              name: 'search',
              description: 'Search tool',
            },
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject tool without name', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          tools: [
            {
              description: 'Tool without name',
            } as any,
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain(
        'Tool is missing required field: name'
      );
    });

    it('should accept valid tool with endpoint handler', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          tools: [
            {
              name: 'api-call',
              handler: {
                endpoint: 'https://api.example.com/search',
                method: 'POST',
              },
            },
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject tool with invalid endpoint URL', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          tools: [
            {
              name: 'api-call',
              handler: {
                endpoint: 'not-a-valid-url',
              },
            },
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('not a valid URL');
    });

    it('should warn about missing method for endpoint handler', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          tools: [
            {
              name: 'api-call',
              handler: {
                endpoint: 'https://api.example.com/search',
              },
            },
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('method'))).toBe(true);
    });

    it('should accept tool with runtime handler', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          tools: [
            {
              name: 'script',
              handler: {
                runtime: 'python',
              },
            },
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about non-standard runtime', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          tools: [
            {
              name: 'script',
              handler: {
                runtime: 'ruby',
              },
            },
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some((w) => w.includes('not a standard runtime'))
      ).toBe(true);
    });

    it('should reject tool handler without any handler type', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          tools: [
            {
              name: 'incomplete-tool',
              handler: {},
            },
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('must specify at least one of');
    });
  });

  describe('Tool parameters (JSON schema) validation', () => {
    it('should accept valid JSON schema parameters', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          tools: [
            {
              name: 'search',
              parameters: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'Search query',
                  },
                  limit: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 100,
                  },
                },
                required: ['query'],
              },
            },
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid JSON schema type', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          tools: [
            {
              name: 'search',
              parameters: {
                type: 'invalid-type',
              },
            },
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid JSON schema type');
    });

    it('should accept nested JSON schema properties', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          tools: [
            {
              name: 'search',
              parameters: {
                type: 'object',
                properties: {
                  filters: {
                    type: 'object',
                    properties: {
                      category: { type: 'string' },
                      maxPrice: { type: 'number' },
                    },
                  },
                },
              },
            },
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject nested invalid JSON schema', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          tools: [
            {
              name: 'search',
              parameters: {
                type: 'object',
                properties: {
                  nested: {
                    type: 'invalid',
                  },
                },
              },
            },
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('properties.nested');
    });
  });

  describe('Capability validation', () => {
    it('should accept valid capability with name', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          capabilities: [
            {
              name: 'code-generation',
              description: 'Generate code',
            },
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject capability without name', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          capabilities: [
            {
              description: 'Capability without name',
            } as any,
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain(
        'Capability is missing required field: name'
      );
    });
  });

  describe('Complex validation scenarios', () => {
    it('should handle multiple validation errors', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'invalid-provider' as LLMProvider,
            model: 'model',
          },
          access_tier: 'invalid-tier' as AccessTier,
          tools: [
            {
              name: 'tool1',
              handler: {
                endpoint: 'not-a-url',
              },
            },
            {
              description: 'tool without name',
            } as any,
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      expect(
        result.errors.some((e) => e.includes('Invalid LLM provider'))
      ).toBe(true);
      expect(result.errors.some((e) => e.includes('Invalid access tier'))).toBe(
        true
      );
      expect(result.errors.some((e) => e.includes('not a valid URL'))).toBe(
        true
      );
    });

    it('should handle validation with both errors and warnings', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'invalid-provider' as LLMProvider,
            model: 'model',
          },
          tools: [
            {
              name: 'api-tool',
              handler: {
                endpoint: 'https://api.example.com',
                // Missing method - should warn
              },
            },
          ],
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
