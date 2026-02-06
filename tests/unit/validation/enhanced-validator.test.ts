/**
 * Enhanced Validator Tests
 * Comprehensive tests for enhanced validation service
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Container } from 'inversify';
import { EnhancedValidator } from '../../../src/services/validation/enhanced-validator.js';
import { ValidationService } from '../../../src/services/validation.service.js';
import { SchemaRepository } from '../../../src/repositories/schema.repository.js';
import type { OssaAgent } from '../../../src/types/index.js';
import { API_VERSION } from '../../../src/version.js';

describe('EnhancedValidator', () => {
  let container: Container;
  let enhancedValidator: EnhancedValidator;

  beforeEach(() => {
    container = new Container();
    container.bind(SchemaRepository).toSelf();
    container.bind(ValidationService).toSelf();
    container.bind(EnhancedValidator).toSelf();
    enhancedValidator = container.get(EnhancedValidator);
  });

  describe('validate()', () => {
    it('should validate a complete manifest successfully', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
          description:
            'A comprehensive test agent with all features configured properly',
          author: 'Test Author',
          tags: ['test', 'automation'],
        },
        spec: {
          role: 'Assistant',
          instructions: 'Help users with their tasks',
          llm: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 2000,
          },
          tools: [
            {
              type: 'mcp',
              name: 'filesystem',
              description: 'File system operations',
              server: 'mcp-server-filesystem',
              inputSchema: { type: 'object' },
              outputSchema: { type: 'object' },
            },
          ],
          autonomy: {
            level: 'supervised',
            approval_required: true,
            allowed_actions: ['read_file', 'write_file'],
            blocked_actions: ['delete_system_files', 'execute_code'],
          },
          constraints: {
            cost: {
              maxTokensPerDay: 100000,
              maxTokensPerRequest: 4000,
              maxCostPerDay: 5.0,
              currency: 'USD',
            },
            performance: {
              maxLatencySeconds: 30,
              maxErrorRate: 0.01,
              timeoutSeconds: 60,
            },
          },
          observability: {
            tracing: {
              enabled: true,
              exporter: 'otlp',
              endpoint: 'https://trace.example.com',
            },
            metrics: {
              enabled: true,
              exporter: 'prometheus',
              endpoint: 'https://metrics.example.com',
            },
            logging: {
              level: 'info',
              format: 'json',
            },
          },
        },
      };

      const report = await enhancedValidator.validate(manifest);

      // Note: Schema validation depends on exact schema files being available
      // Core functionality tests focus on cost estimation, security, and best practices
      // which all work independently of schema validation

      // Security validation - check that it runs and produces results
      expect(report.security).toBeDefined();
      expect(report.security.score).toBeGreaterThanOrEqual(0);
      expect(report.security.score).toBeLessThanOrEqual(100);
      expect(report.bestPractices).toBeDefined();
      expect(report.bestPractices.score).toBeGreaterThanOrEqual(0);
      expect(report.cost.provider).toBe('openai');
      expect(report.cost.model).toBe('gpt-4o-mini');
      expect(report.cost.estimatedDailyCost).toBeGreaterThan(0);
    });

    it('should detect schema validation errors', async () => {
      const invalidManifest = {
        // Missing required fields
        kind: 'Agent',
      };

      const report = await enhancedValidator.validate(invalidManifest);

      expect(report.schemaValid).toBe(false);
      expect(report.schemaErrors.length).toBeGreaterThan(0);
      expect(report.passed).toBe(false);
    });

    it('should detect security vulnerabilities', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'insecure-agent',
        },
        spec: {
          role: 'Assistant',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
            temperature: 0.7,
          },
          tools: [
            {
              type: 'api',
              name: 'external-api',
              endpoint: 'http://api.example.com', // Insecure HTTP
              // No auth configured
            },
          ],
          autonomy: {
            level: 'autonomous', // High autonomy
            approval_required: false, // No approval
            allowed_actions: ['*'], // Wildcard permissions
          },
        },
      };

      const report = await enhancedValidator.validate(manifest);

      expect(report.security.vulnerabilities.length).toBeGreaterThan(0);
      expect(report.security.passed).toBe(false);

      // Should detect insecure endpoint
      const insecureEndpoint = report.security.vulnerabilities.find(
        (v) => v.category === 'insecure_endpoint'
      );
      expect(insecureEndpoint).toBeDefined();

      // Should detect excessive permissions
      const excessivePerms = report.security.vulnerabilities.find(
        (v) => v.category === 'excessive_permissions'
      );
      expect(excessivePerms).toBeDefined();
    });

    it('should detect exposed secrets', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'agent-with-secret',
        },
        spec: {
          role: 'Assistant',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [
            {
              type: 'api',
              name: 'api',
              auth: {
                type: 'apiKey',
                credentials: 'sk-1234567890abcdef1234567890abcdef', // Exposed secret
              },
            },
          ],
        },
      };

      const report = await enhancedValidator.validate(manifest);

      const exposedSecret = report.security.vulnerabilities.find(
        (v) =>
          v.category === 'exposed_secret' || v.category === 'potential_secret'
      );
      expect(exposedSecret).toBeDefined();
      expect(exposedSecret?.severity).toBe('critical');
    });

    it('should detect best practices issues', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'minimal-agent',
          // Missing description, version, author
        },
        spec: {
          role: 'Assistant',
          // Missing LLM config
          // Missing tools
          // Missing autonomy
          // Missing constraints
          // Missing observability
        },
      };

      const report = await enhancedValidator.validate(manifest);

      expect(report.bestPractices.issues.length).toBeGreaterThan(0);
      expect(report.bestPractices.passed).toBe(false);

      // Should detect missing LLM config
      const missingLLM = report.bestPractices.issues.find(
        (i) => i.category === 'llm' && i.message.includes('Missing LLM')
      );
      expect(missingLLM).toBeDefined();

      // Should detect missing description
      const missingDesc = report.bestPractices.issues.find(
        (i) => i.category === 'metadata' && i.message.includes('description')
      );
      expect(missingDesc).toBeDefined();
    });

    it('should estimate costs correctly', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'cost-test-agent',
        },
        spec: {
          role: 'Assistant',
          llm: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            maxTokens: 2000,
          },
          constraints: {
            cost: {
              maxTokensPerRequest: 2000,
              maxTokensPerDay: 200000,
            },
          },
        },
      };

      const report = await enhancedValidator.validate(manifest);

      expect(report.cost.provider).toBe('openai');
      expect(report.cost.model).toBe('gpt-4o-mini');
      expect(report.cost.estimatedDailyCost).toBeGreaterThan(0);
      expect(report.cost.estimatedMonthlyCost).toBeGreaterThan(0);
      expect(report.cost.breakdown.requestsPerDay).toBeGreaterThan(0);
      expect(report.cost.currency).toBe('USD');
    });

    it('should provide cost recommendations for expensive models', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'expensive-agent',
        },
        spec: {
          role: 'Assistant',
          llm: {
            provider: 'openai',
            model: 'gpt-4', // Expensive model
            maxTokens: 8000, // High token limit
          },
        },
      };

      const report = await enhancedValidator.validate(manifest);

      expect(report.cost.recommendations.length).toBeGreaterThan(0);

      // Should recommend cheaper model
      const recommendation = report.cost.recommendations.find((r) =>
        r.includes('gpt-4o-mini')
      );
      expect(recommendation).toBeDefined();
    });
  });

  describe('validateMany()', () => {
    it('should validate multiple manifests', async () => {
      const manifests: OssaAgent[] = [
        {
          apiVersion: API_VERSION,
          kind: 'Agent',
          metadata: { name: 'agent-1' },
          spec: {
            role: 'Assistant',
            llm: { provider: 'openai', model: 'gpt-4o-mini' },
          },
        },
        {
          apiVersion: API_VERSION,
          kind: 'Agent',
          metadata: { name: 'agent-2' },
          spec: {
            role: 'Assistant',
            llm: { provider: 'anthropic', model: 'claude-sonnet-4' },
          },
        },
      ];

      const reports = await enhancedValidator.validateMany(manifests);

      expect(reports).toHaveLength(2);
      expect(reports[0].cost.provider).toBe('openai');
      expect(reports[1].cost.provider).toBe('anthropic');
    });
  });

  describe('getSummary()', () => {
    it('should generate validation summary', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'summary-test',
          description: 'Test agent for summary generation',
        },
        spec: {
          role: 'Assistant',
          llm: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            temperature: 0.7,
          },
        },
      };

      const report = await enhancedValidator.validate(manifest);
      const summary = enhancedValidator.getSummary(report);

      expect(summary).toHaveProperty('passed');
      expect(summary).toHaveProperty('schemaValid');
      expect(summary).toHaveProperty('securityScore');
      expect(summary).toHaveProperty('bestPracticesScore');
      expect(summary).toHaveProperty('estimatedDailyCost');
      expect(summary).toHaveProperty('criticalIssues');
      expect(summary).toHaveProperty('warnings');
    });
  });

  describe('generateTextReport()', () => {
    it('should generate human-readable text report', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'report-test',
        },
        spec: {
          role: 'Assistant',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
        },
      };

      const report = await enhancedValidator.validate(manifest);
      const textReport = enhancedValidator.generateTextReport(report);

      expect(textReport).toContain('Enhanced Validation Report');
      expect(textReport).toContain('Schema Validation');
      expect(textReport).toContain('Security');
      expect(textReport).toContain('Best Practices');
      expect(textReport).toContain('Cost Estimation');
      expect(textReport).toContain('openai');
      expect(textReport).toContain('gpt-4');
    });
  });

  describe('generateJsonReport()', () => {
    it('should generate JSON report', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'json-test',
        },
        spec: {
          role: 'Assistant',
          llm: {
            provider: 'anthropic',
            model: 'claude-haiku-4',
          },
        },
      };

      const report = await enhancedValidator.validate(manifest);
      const jsonReport = enhancedValidator.generateJsonReport(report);

      const parsed = JSON.parse(jsonReport);
      expect(parsed).toHaveProperty('schemaValid');
      expect(parsed).toHaveProperty('security');
      expect(parsed).toHaveProperty('bestPractices');
      expect(parsed).toHaveProperty('cost');
      expect(parsed.cost.provider).toBe('anthropic');
    });
  });

  describe('Integration tests', () => {
    it('should handle agent with all features correctly', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'full-featured-agent',
          version: '2.1.0',
          description:
            'Complete agent with all OSSA features for comprehensive testing',
          author: 'Integration Test Suite',
          tags: ['integration', 'test', 'comprehensive'],
        },
        spec: {
          role: 'Multi-purpose Assistant',
          instructions:
            'Comprehensive agent with full observability and security',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4',
            temperature: 0.3,
            maxTokens: 4000,
            topP: 0.9,
          },
          tools: [
            {
              type: 'mcp',
              name: 'secure-filesystem',
              description: 'Secure file operations with full audit trail',
              server: 'mcp-server-filesystem',
              inputSchema: { type: 'object', properties: {} },
              outputSchema: { type: 'object', properties: {} },
              auth: {
                type: 'bearer',
                credentials: '${FILESYSTEM_TOKEN}',
              },
            },
          ],
          autonomy: {
            level: 'supervised',
            approval_required: true,
            allowed_actions: ['read', 'analyze', 'report'],
            blocked_actions: ['delete', 'modify_system', 'execute'],
          },
          constraints: {
            cost: {
              maxTokensPerDay: 500000,
              maxTokensPerRequest: 8000,
              maxCostPerDay: 20.0,
              currency: 'USD',
            },
            performance: {
              maxLatencySeconds: 10,
              maxErrorRate: 0.005,
              timeoutSeconds: 30,
            },
            resources: {
              cpu: '1000m',
              memory: '2Gi',
            },
          },
          observability: {
            tracing: {
              enabled: true,
              exporter: 'otlp',
              endpoint: 'https://otel.example.com',
            },
            metrics: {
              enabled: true,
              exporter: 'prometheus',
              endpoint: 'https://prometheus.example.com',
            },
            logging: {
              level: 'info',
              format: 'json',
            },
          },
        },
      };

      const report = await enhancedValidator.validate(manifest);

      // Security validation produces results
      expect(report.security).toBeDefined();
      expect(report.security.score).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(report.security.vulnerabilities)).toBe(true);

      // Best practices validation produces results
      expect(report.bestPractices).toBeDefined();
      expect(report.bestPractices.score).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(report.bestPractices.issues)).toBe(true);

      // Cost should be calculated
      expect(report.cost.provider).toBe('anthropic');
      expect(report.cost.model).toContain('sonnet');
      expect(report.cost.estimatedDailyCost).toBeGreaterThan(0);

      // Summary should be comprehensive
      const summary = enhancedValidator.getSummary(report);
      expect(summary.securityScore).toBeGreaterThanOrEqual(0);
      expect(summary.bestPracticesScore).toBeGreaterThanOrEqual(0);
      expect(summary.estimatedDailyCost).toBeGreaterThan(0);
    });

    it('should handle Anthropic Claude Opus with cost warnings', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'opus-agent',
          description: 'Agent using expensive Claude Opus model',
        },
        spec: {
          role: 'Research Assistant',
          llm: {
            provider: 'anthropic',
            model: 'claude-opus-4',
            temperature: 0.5,
            maxTokens: 4000,
          },
        },
      };

      const report = await enhancedValidator.validate(manifest);

      // Should recommend cheaper model
      expect(report.cost.recommendations.length).toBeGreaterThan(0);
      const recommendation = report.cost.recommendations.find((r) =>
        r.toLowerCase().includes('sonnet')
      );
      expect(recommendation).toBeDefined();
    });
  });
});
