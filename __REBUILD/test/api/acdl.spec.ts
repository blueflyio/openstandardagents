/**
 * ACDL (Agent Capability Description Language) Test Suite
 * OSSA v0.1.9-alpha.1
 * 
 * Following TDD principles - these tests MUST FAIL initially
 * No implementation should exist when these tests are written
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { ACDLValidator } from '../../src/core/acdl/validator';
import { ACDLRegistry } from '../../src/core/acdl/registry';
import { ACDLMatcher } from '../../src/core/acdl/matcher';

describe('ACDL Specification Tests', () => {
  describe('ACDLValidator', () => {
    let validator: ACDLValidator;

    beforeAll(() => {
      // This class doesn't exist yet - test will fail
      validator = new ACDLValidator();
    });

    it('should validate a correct ACDL manifest', () => {
      const manifest = {
        agentId: 'worker-openapi-v1.2.0',
        agentType: 'worker',
        agentSubType: 'worker.openapi',
        version: '1.2.0',
        capabilities: {
          domains: ['documentation', 'api-design'],
          operations: [
            {
              name: 'validate',
              description: 'Validate OpenAPI specifications'
            }
          ]
        },
        protocols: {
          supported: [
            {
              name: 'rest',
              version: '3.1.0',
              endpoint: 'https://api.worker.local/v1'
            }
          ]
        },
        performance: {
          throughput: {
            requestsPerSecond: 100
          },
          latency: {
            p50: 50,
            p95: 150,
            p99: 250
          }
        }
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid agent ID format', () => {
      const manifest = {
        agentId: 'InvalidID',
        agentType: 'worker',
        version: '1.0.0',
        capabilities: {},
        protocols: {},
        performance: {}
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'agentId',
          code: 'INVALID_FORMAT'
        })
      );
    });

    it('should validate agent taxonomy compliance', () => {
      const validTypes = [
        'orchestrator', 'worker', 'critic', 'judge',
        'trainer', 'governor', 'monitor', 'integrator'
      ];

      validTypes.forEach(type => {
        const manifest = {
          agentId: `${type}-test-v1.0.0`,
          agentType: type,
          version: '1.0.0',
          capabilities: { domains: ['test'] },
          protocols: { supported: [] },
          performance: { throughput: {}, latency: {} }
        };

        const result = validator.validate(manifest);
        expect(result.valid).toBe(true);
      });
    });

    it('should enforce semantic versioning', () => {
      const validVersions = ['1.0.0', '2.1.3', '0.1.0-alpha.1', '1.0.0-beta'];
      const invalidVersions = ['1', '1.0', 'v1.0.0', '1.0.0.0'];

      validVersions.forEach(version => {
        const result = validator.validateVersion(version);
        expect(result).toBe(true);
      });

      invalidVersions.forEach(version => {
        const result = validator.validateVersion(version);
        expect(result).toBe(false);
      });
    });
  });

  describe('ACDLRegistry', () => {
    let registry: ACDLRegistry;

    beforeAll(() => {
      // This class doesn't exist yet - test will fail
      registry = new ACDLRegistry();
    });

    it('should register a new agent', async () => {
      const manifest = {
        agentId: 'worker-test-v1.0.0',
        agentType: 'worker',
        version: '1.0.0',
        capabilities: { domains: ['test'] },
        protocols: { supported: [] },
        performance: { throughput: {}, latency: {} }
      };

      const response = await registry.register(manifest);
      expect(response.status).toBe('registered');
      expect(response.registrationId).toBeDefined();
      expect(response.registeredAt).toBeDefined();
    });

    it('should prevent duplicate agent registration', async () => {
      const manifest = {
        agentId: 'worker-duplicate-v1.0.0',
        agentType: 'worker',
        version: '1.0.0',
        capabilities: { domains: ['test'] },
        protocols: { supported: [] },
        performance: { throughput: {}, latency: {} }
      };

      await registry.register(manifest);
      
      await expect(registry.register(manifest))
        .rejects.toThrow('Agent already registered');
    });

    it('should discover agents by capability', async () => {
      // Register test agents
      const agents = [
        {
          agentId: 'worker-api-v1.0.0',
          agentType: 'worker',
          capabilities: { domains: ['api-design', 'validation'] }
        },
        {
          agentId: 'worker-docs-v1.0.0',
          agentType: 'worker',
          capabilities: { domains: ['documentation'] }
        }
      ];

      for (const agent of agents) {
        await registry.register(agent);
      }

      // Discover by domain
      const results = await registry.discover({
        domains: ['api-design']
      });

      expect(results.agents).toHaveLength(1);
      expect(results.agents[0].agentId).toBe('worker-api-v1.0.0');
    });

    it('should discover agents by performance requirements', async () => {
      const query = {
        performance: {
          minThroughput: 50,
          maxLatencyP99: 300
        }
      };

      const results = await registry.discover(query);
      
      results.agents.forEach(agent => {
        expect(agent.manifest.performance.throughput.requestsPerSecond)
          .toBeGreaterThanOrEqual(50);
        expect(agent.manifest.performance.latency.p99)
          .toBeLessThanOrEqual(300);
      });
    });
  });

  describe('ACDLMatcher', () => {
    let matcher: ACDLMatcher;

    beforeAll(() => {
      // This class doesn't exist yet - test will fail
      matcher = new ACDLMatcher();
    });

    it('should match agents to task requirements', async () => {
      const task = {
        type: 'api-validation',
        description: 'Validate OpenAPI specification',
        expectedDuration: 5000
      };

      const requirements = {
        capabilities: {
          domains: ['api-design', 'validation'],
          operations: [{ name: 'validate' }]
        },
        performance: {
          latency: { p99: 1000 }
        }
      };

      const matches = await matcher.match({ task, requirements });
      
      expect(matches.matches).toBeDefined();
      expect(matches.matches.length).toBeGreaterThan(0);
      expect(matches.recommendation).toBeDefined();
      expect(matches.recommendation.primaryAgent).toBeDefined();
    });

    it('should calculate compatibility scores', () => {
      const agentCapabilities = {
        domains: ['api-design', 'validation', 'documentation'],
        operations: [
          { name: 'validate' },
          { name: 'generate' }
        ]
      };

      const requirements = {
        domains: ['api-design', 'validation'],
        operations: [{ name: 'validate' }]
      };

      const score = matcher.calculateCompatibility(
        agentCapabilities,
        requirements
      );

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
      expect(score).toBeCloseTo(1.0, 1); // Perfect match for requirements
    });

    it('should recommend agent ensembles for complex tasks', async () => {
      const complexTask = {
        type: 'full-api-workflow',
        description: 'Design, validate, and document API',
        subtasks: [
          { type: 'design', capabilities: ['api-design'] },
          { type: 'validate', capabilities: ['validation'] },
          { type: 'document', capabilities: ['documentation'] }
        ]
      };

      const recommendation = await matcher.recommendEnsemble(complexTask);
      
      expect(recommendation.ensemble).toBeDefined();
      expect(recommendation.ensemble.length).toBe(3);
      recommendation.ensemble.forEach(agent => {
        expect(agent.agentId).toBeDefined();
        expect(agent.role).toBeDefined();
      });
    });

    it('should handle protocol compatibility matching', () => {
      const agentProtocols = ['rest', 'grpc', 'websocket'];
      const requiredProtocols = ['rest', 'grpc'];

      const compatible = matcher.checkProtocolCompatibility(
        agentProtocols,
        requiredProtocols
      );

      expect(compatible).toBe(true);
    });
  });

  describe('ACDL 360° Feedback Loop', () => {
    it('should validate feedback loop phases', () => {
      const phases = ['plan', 'execute', 'review', 'judge', 'learn', 'govern'];
      const agentTypes = {
        plan: 'orchestrator',
        execute: 'worker',
        review: 'critic',
        judge: 'judge',
        learn: 'trainer',
        govern: 'governor'
      };

      phases.forEach(phase => {
        const agentType = agentTypes[phase];
        const validator = new ACDLValidator();
        
        const result = validator.validateFeedbackLoopAgent(phase, agentType);
        expect(result).toBe(true);
      });
    });
  });

  describe('ACDL Token Efficiency', () => {
    it('should validate token budget constraints', () => {
      const manifest = {
        agentId: 'worker-efficient-v1.0.0',
        performance: {
          limits: {
            maxTokens: 4000
          }
        },
        capabilities: {
          tokenEfficiency: {
            strategies: [
              'key-based-context',
              'delta-prompting',
              'tiered-depth'
            ]
          }
        }
      };

      const validator = new ACDLValidator();
      const result = validator.validateTokenEfficiency(manifest);
      
      expect(result.valid).toBe(true);
      expect(result.efficiencyScore).toBeGreaterThan(0.7);
    });
  });
});

describe('ACDL Conformance Levels', () => {
  let validator: ACDLValidator;

  beforeAll(() => {
    validator = new ACDLValidator();
  });

  it('should validate Bronze conformance', () => {
    const manifest = {
      agentId: 'worker-bronze-v1.0.0',
      agentType: 'worker',
      version: '1.0.0',
      capabilities: { domains: ['basic'] },
      protocols: { supported: [{ name: 'rest' }] },
      performance: { throughput: {}, latency: {} }
    };

    const level = validator.getConformanceLevel(manifest);
    expect(level).toBe('bronze');
  });

  it('should validate Silver conformance', () => {
    const manifest = {
      agentId: 'worker-silver-v1.0.0',
      agentType: 'worker',
      version: '1.0.0',
      capabilities: { 
        domains: ['advanced'],
        feedbackLoop: true
      },
      protocols: { supported: [{ name: 'rest' }, { name: 'grpc' }] },
      performance: { 
        throughput: { requestsPerSecond: 100 },
        latency: { p50: 50, p95: 150, p99: 250 }
      },
      budgetManagement: true,
      auditLogging: true
    };

    const level = validator.getConformanceLevel(manifest);
    expect(level).toBe('silver');
  });

  it('should validate Gold conformance', () => {
    const manifest = {
      agentId: 'worker-gold-v1.0.0',
      agentType: 'worker',
      version: '1.0.0',
      capabilities: { 
        domains: ['enterprise'],
        feedbackLoop: true,
        propsTokens: true,
        learningSignals: true
      },
      protocols: { 
        supported: [
          { name: 'rest' },
          { name: 'grpc' },
          { name: 'websocket' },
          { name: 'mcp' }
        ]
      },
      performance: { 
        throughput: { requestsPerSecond: 1000 },
        latency: { p50: 25, p95: 75, p99: 150 }
      },
      budgetManagement: true,
      auditLogging: true,
      workspaceManagement: true
    };

    const level = validator.getConformanceLevel(manifest);
    expect(level).toBe('gold');
  });
});