/**
 * Integration tests for enhanced validator
 * Demonstrates enum and JSON schema validation working end-to-end
 */

import { describe, it, expect } from '@jest/globals';
import { OSSASDKClient } from '../../src/sdks/typescript/client.js';
import type {
  AgentManifest,
  LLMProvider,
  AccessTier,
} from '../../src/sdks/typescript/types.js';

describe('Enhanced Validator Integration', () => {
  let client: OSSASDKClient;

  beforeEach(() => {
    client = new OSSASDKClient();
  });

  describe('End-to-end validation', () => {
    it('should validate complete agent manifest with all features', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: {
          name: 'comprehensive-agent',
          version: '1.0.0',
          description: 'Agent with all validation features',
          labels: {
            environment: 'production',
          },
        },
        spec: {
          role: 'Comprehensive test agent',
          llm: {
            provider: 'anthropic' as LLMProvider,
            model: 'claude-sonnet-4-20250514',
            temperature: 0.7,
            max_tokens: 4096,
          },
          access_tier: 'tier_2_write_limited' as AccessTier,
          identity: {
            provider: 'gitlab',
            access_tier: 'tier_2_write_limited' as AccessTier,
            service_account: {
              username: 'test-agent',
              email: 'test@example.com',
            },
          },
          tools: [
            {
              name: 'search',
              description: 'Search tool',
              handler: {
                endpoint: 'https://api.example.com/search',
                method: 'POST',
              },
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
            {
              name: 'analyze',
              description: 'Analysis tool',
              handler: {
                runtime: 'python',
              },
            },
          ],
          capabilities: [
            {
              name: 'code-analysis',
              description: 'Analyze code',
            },
          ],
          safety: {
            guardrails: {
              max_actions_per_minute: 10,
              require_human_approval_for: ['delete', 'deploy'],
              audit_all_actions: true,
            },
          },
        },
      };

      const result = client.validateManifest(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch multiple validation errors in real-world scenario', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: {
          name: 'broken-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Agent with multiple issues',
          llm: {
            provider: 'unknown-provider' as LLMProvider,
            model: 'model',
          },
          access_tier: 'tier_99_super_admin' as AccessTier,
          identity: {
            access_tier: 'invalid-tier' as AccessTier,
          },
          tools: [
            {
              name: 'broken-tool',
              handler: {
                endpoint: 'not-a-url',
              },
              parameters: {
                type: 'invalid-type',
              },
            },
            {
              description: 'tool without name',
            } as any,
            {
              name: 'incomplete-handler',
              handler: {}, // No handler type specified
            },
          ],
          capabilities: [
            {
              description: 'capability without name',
            } as any,
          ],
        },
      };

      const result = client.validateManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(7);

      // Verify specific errors
      expect(
        result.errors.some((e) => e.includes('Invalid LLM provider'))
      ).toBe(true);
      expect(result.errors.some((e) => e.includes('Invalid access tier'))).toBe(
        true
      );
      expect(result.errors.some((e) => e.includes('not a valid URL'))).toBe(
        true
      );
      expect(
        result.errors.some((e) => e.includes('Invalid JSON schema type'))
      ).toBe(true);
      expect(
        result.errors.some((e) => e.includes('Tool is missing required field'))
      ).toBe(true);
      expect(
        result.errors.some((e) => e.includes('must specify at least one of'))
      ).toBe(true);
      expect(
        result.errors.some((e) =>
          e.includes('Capability is missing required field')
        )
      ).toBe(true);
    });

    it('should handle warnings properly', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: {
          name: 'warning-agent',
        },
        spec: {
          role: 'Agent with warnings',
          tools: [
            {
              name: 'api-tool',
              handler: {
                endpoint: 'https://api.example.com',
                // Missing method - should warn
              },
            },
            {
              name: 'ruby-tool',
              handler: {
                runtime: 'ruby', // Non-standard runtime
              },
            },
          ],
        },
      };

      const result = client.validateManifest(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(2);
      expect(result.warnings.some((w) => w.includes('method'))).toBe(true);
      expect(
        result.warnings.some((w) => w.includes('not a standard runtime'))
      ).toBe(true);
    });
  });

  describe('Real-world agent validation scenarios', () => {
    it('should validate GitLab CI agent manifest', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: {
          name: 'gitlab-ci-agent',
          version: '1.0.0',
          description: 'GitLab CI/CD automation agent',
        },
        spec: {
          role: 'Automate GitLab CI/CD pipelines',
          llm: {
            provider: 'anthropic' as LLMProvider,
            model: 'claude-sonnet-4-20250514',
            temperature: 0.5,
          },
          access_tier: 'tier_3_write_elevated' as AccessTier,
          tools: [
            {
              name: 'gitlab-api',
              description: 'GitLab API client',
              handler: {
                endpoint: 'https://gitlab.com/api/v4',
                method: 'POST',
              },
              parameters: {
                type: 'object',
                properties: {
                  endpoint: { type: 'string' },
                  method: {
                    type: 'string',
                    enum: ['GET', 'POST', 'PUT', 'DELETE'],
                  },
                  data: { type: 'object' },
                },
                required: ['endpoint', 'method'],
              },
            },
          ],
        },
      };

      const result = client.validateManifest(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate local development agent with Ollama', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: {
          name: 'local-dev-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Local development assistant',
          llm: {
            provider: 'ollama' as LLMProvider,
            model: 'llama2',
            temperature: 0.8,
          },
          access_tier: 'read' as AccessTier,
          tools: [
            {
              name: 'file-reader',
              handler: {
                runtime: 'node',
              },
            },
          ],
        },
      };

      const result = client.validateManifest(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject production agent with invalid configuration', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: {
          name: 'prod-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Production agent with bad config',
          llm: {
            provider: 'custom-provider' as LLMProvider, // Invalid
            model: 'model',
          },
          access_tier: 'admin' as AccessTier, // Invalid shorthand
        },
      };

      const result = client.validateManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(
        result.errors.some((e) => e.includes('Invalid LLM provider'))
      ).toBe(true);
      expect(result.errors.some((e) => e.includes('Invalid access tier'))).toBe(
        true
      );
    });
  });

  describe('Tool validation edge cases', () => {
    it('should accept tool with capability handler', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          tools: [
            {
              name: 'capability-tool',
              handler: {
                capability: 'search',
              },
            },
          ],
        },
      };

      const result = client.validateManifest(manifest);
      expect(result.valid).toBe(true);
    });

    it('should accept tool with all handler types', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          tools: [
            {
              name: 'multi-handler-tool',
              handler: {
                runtime: 'docker',
                capability: 'search',
                endpoint: 'https://api.example.com',
                method: 'GET',
              },
            },
          ],
        },
      };

      const result = client.validateManifest(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate complex nested JSON schema', () => {
      const manifest: AgentManifest = {
        apiVersion: 'ossa/v0.4.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          tools: [
            {
              name: 'complex-tool',
              parameters: {
                type: 'object',
                properties: {
                  config: {
                    type: 'object',
                    properties: {
                      settings: {
                        type: 'object',
                        properties: {
                          timeout: { type: 'number' },
                          retries: { type: 'integer' },
                          enabled: { type: 'boolean' },
                        },
                      },
                      filters: {
                        type: 'array',
                        items: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      };

      const result = client.validateManifest(manifest);
      expect(result.valid).toBe(true);
    });
  });
});
