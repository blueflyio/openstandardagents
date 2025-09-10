/**
 * OSSA Router Test Suite
 * Comprehensive testing for high-performance agent discovery
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/core';
import { createOSSARouter, OSSARouter } from '../router';
import { OSSAAgent, DiscoveryQuery, RouterConfig } from '../types';

describe('OSSA Router', () => {
  let router: OSSARouter;

  const testConfig: Partial<RouterConfig> = {
    protocols: {
      rest: {
        port: 3001,
        basePath: '/api/test',
        cors: true,
      },
      graphql: {
        enabled: false, // Disable for faster tests
        endpoint: '/graphql',
        subscriptions: false,
        introspection: true,
        playground: false,
      },
      grpc: {
        enabled: false, // Disable for faster tests
        port: 50052,
        reflection: true,
        compression: true,
      },
    },
    discovery: {
      cacheTimeout: 10000, // 10 seconds for tests
      maxCacheEntries: 100,
      healthCheckInterval: 5000, // 5 seconds for tests
      indexingEnabled: true,
    },
    performance: {
      targetResponseTime: 50, // 50ms target for tests
      maxConcurrentQueries: 10,
      batchSize: 5,
      compressionEnabled: false, // Disable for simpler tests
    },
    clustering: {
      enabled: false,
    },
  };

  const createTestAgent = (overrides: Partial<OSSAAgent> = {}): Omit<OSSAAgent, 'id' | 'registrationTime' | 'lastSeen'> => ({
    name: 'test-agent',
    version: '1.0.0',
    endpoint: 'http://localhost:3000',
    status: 'healthy',
    metadata: {
      class: 'general',
      category: 'assistant',
      conformanceTier: 'core',
      certificationLevel: 'bronze',
    },
    capabilities: {
      primary: ['chat', 'reasoning'],
      secondary: ['translation'],
      domains: ['ai', 'nlp'],
    },
    protocols: [
      {
        name: 'rest',
        version: '1.0',
        required: true,
        endpoints: { api: '/api' },
        features: ['json'],
      },
    ],
    endpoints: {
      health: '/health',
      capabilities: '/capabilities',
      api: '/api',
      metrics: '/metrics',
    },
    performance: {
      avgResponseTimeMs: 100,
      uptimePercentage: 99.5,
      requestsHandled: 1000,
      successRate: 0.99,
      throughputRps: 10,
    },
    compliance: {
      frameworks: ['ISO_42001'],
      certifications: ['OSSA_CORE'],
      auditDate: new Date(),
    },
    ...overrides,
  });

  beforeAll(async () => {
    router = createOSSARouter(testConfig);
    await router.start();
  });

  afterAll(async () => {
    await router.stop();
  });

  beforeEach(async () => {
    // Clean state between tests
    // Note: In a real implementation, you might want to add a method to clear the registry
  });

  describe('Agent Registration', () => {
    test('should register a new agent successfully', async () => {
      const testAgent = createTestAgent({
        name: 'registration-test-agent',
        capabilities: {
          primary: ['test-capability'],
          domains: ['test-domain'],
        },
      });

      const agentId = await router.registerAgent(testAgent);
      
      expect(agentId).toBeDefined();
      expect(typeof agentId).toBe('string');
      expect(agentId).toMatch(/^ossa-/);

      // Verify agent can be retrieved
      const retrievedAgent = await router.getAgent(agentId);
      expect(retrievedAgent).toBeDefined();
      expect(retrievedAgent?.name).toBe(testAgent.name);
      expect(retrievedAgent?.capabilities.primary).toEqual(testAgent.capabilities.primary);
    });

    test('should register multiple agents', async () => {
      const agents = Array.from({ length: 5 }, (_, i) => 
        createTestAgent({
          name: `bulk-test-agent-${i}`,
          capabilities: {
            primary: [`capability-${i}`],
            domains: [`domain-${i}`],
          },
        })
      );

      const agentIds = await Promise.all(
        agents.map(agent => router.registerAgent(agent))
      );

      expect(agentIds).toHaveLength(5);
      agentIds.forEach(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
      });

      // Verify all agents can be retrieved
      const retrievedAgents = await Promise.all(
        agentIds.map(id => router.getAgent(id))
      );

      retrievedAgents.forEach((agent, index) => {
        expect(agent).toBeDefined();
        expect(agent?.name).toBe(`bulk-test-agent-${index}`);
      });
    });

    test('should validate agent data during registration', async () => {
      const invalidAgent = {
        name: '',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
        status: 'healthy' as const,
        metadata: {
          class: 'general' as const,
          category: 'assistant' as const,
          conformanceTier: 'core' as const,
        },
        capabilities: {
          primary: [], // Invalid: no primary capabilities
          domains: ['test'],
        },
        protocols: [],
        endpoints: {
          health: '/health',
          api: '/api',
        },
        performance: {
          avgResponseTimeMs: 100,
          uptimePercentage: 99.5,
          requestsHandled: 1000,
          successRate: 0.99,
          throughputRps: 10,
        },
      };

      await expect(router.registerAgent(invalidAgent)).rejects.toThrow();
    });
  });

  describe('Agent Discovery', () => {
    let testAgentIds: string[] = [];

    beforeAll(async () => {
      // Register test agents for discovery tests
      const testAgents = [
        createTestAgent({
          name: 'chat-agent',
          capabilities: {
            primary: ['chat', 'conversation'],
            secondary: ['sentiment-analysis'],
            domains: ['ai', 'nlp', 'customer-service'],
          },
          metadata: { class: 'specialist', category: 'assistant', conformanceTier: 'advanced' },
        }),
        createTestAgent({
          name: 'translation-agent',
          capabilities: {
            primary: ['translation', 'language-detection'],
            domains: ['ai', 'nlp', 'translation'],
          },
          metadata: { class: 'specialist', category: 'tool', conformanceTier: 'governed' },
        }),
        createTestAgent({
          name: 'math-agent',
          capabilities: {
            primary: ['calculation', 'math-solving'],
            domains: ['mathematics', 'education'],
          },
          metadata: { class: 'specialist', category: 'tool', conformanceTier: 'core' },
        }),
        createTestAgent({
          name: 'general-assistant',
          capabilities: {
            primary: ['chat', 'reasoning', 'task-planning'],
            secondary: ['web-search', 'file-handling'],
            domains: ['ai', 'productivity', 'general'],
          },
          metadata: { class: 'general', category: 'assistant', conformanceTier: 'advanced' },
        }),
      ];

      testAgentIds = await Promise.all(
        testAgents.map(agent => router.registerAgent(agent))
      );
    });

    test('should discover agents by capability', async () => {
      const query: DiscoveryQuery = {
        capabilities: ['chat'],
      };

      const result = await router.discoverAgents(query);

      expect(result).toBeDefined();
      expect(result.agents).toHaveLength(2); // chat-agent and general-assistant
      expect(result.totalFound).toBe(2);
      expect(result.discoveryTimeMs).toBeLessThan(100); // Performance requirement
      
      const agentNames = result.agents.map(a => a.name);
      expect(agentNames).toContain('chat-agent');
      expect(agentNames).toContain('general-assistant');
    });

    test('should discover agents by domain', async () => {
      const query: DiscoveryQuery = {
        domains: ['nlp'],
      };

      const result = await router.discoverAgents(query);

      expect(result.totalFound).toBeGreaterThanOrEqual(2);
      
      const nlpAgents = result.agents.filter(agent => 
        agent.capabilities.domains.includes('nlp')
      );
      expect(nlpAgents.length).toBeGreaterThanOrEqual(2);
    });

    test('should discover agents by conformance tier', async () => {
      const query: DiscoveryQuery = {
        conformanceTier: 'advanced',
      };

      const result = await router.discoverAgents(query);

      expect(result.totalFound).toBeGreaterThanOrEqual(2);
      result.agents.forEach(agent => {
        expect(agent.metadata.conformanceTier).toBe('advanced');
      });
    });

    test('should support complex discovery queries', async () => {
      const query: DiscoveryQuery = {
        capabilities: ['chat'],
        domains: ['ai'],
        conformanceTier: 'advanced',
        maxResults: 10,
      };

      const result = await router.discoverAgents(query);

      expect(result).toBeDefined();
      expect(result.agents.length).toBeLessThanOrEqual(10);
      
      result.agents.forEach(agent => {
        expect(agent.capabilities.primary.some(cap => cap.includes('chat')) ||
               agent.capabilities.secondary?.some(cap => cap.includes('chat'))).toBeTruthy();
        expect(agent.capabilities.domains).toContain('ai');
        expect(agent.metadata.conformanceTier).toBe('advanced');
      });
    });

    test('should return results sorted by performance', async () => {
      const query: DiscoveryQuery = {
        sortBy: 'performance',
        sortOrder: 'desc',
      };

      const result = await router.discoverAgents(query);

      expect(result.agents.length).toBeGreaterThan(1);
      
      // Check if results are sorted by performance (using response time as proxy)
      for (let i = 0; i < result.agents.length - 1; i++) {
        const currentPerf = result.agents[i].performance.avgResponseTimeMs;
        const nextPerf = result.agents[i + 1].performance.avgResponseTimeMs;
        // Lower response time = better performance, so should come first in desc order
        expect(currentPerf).toBeLessThanOrEqual(nextPerf);
      }
    });

    test('should respect maxResults limit', async () => {
      const query: DiscoveryQuery = {
        maxResults: 2,
      };

      const result = await router.discoverAgents(query);

      expect(result.agents).toHaveLength(2);
      expect(result.totalFound).toBeGreaterThanOrEqual(2);
    });

    test('should perform fast discovery for large result sets', async () => {
      // Register additional agents to test performance
      const bulkAgents = Array.from({ length: 50 }, (_, i) => 
        createTestAgent({
          name: `perf-test-agent-${i}`,
          capabilities: {
            primary: ['performance-test'],
            domains: ['performance'],
          },
        })
      );

      await Promise.all(bulkAgents.map(agent => router.registerAgent(agent)));

      const startTime = performance.now();
      
      const query: DiscoveryQuery = {
        capabilities: ['performance-test'],
      };

      const result = await router.discoverAgents(query);
      const discoveryTime = performance.now() - startTime;

      expect(result.totalFound).toBeGreaterThanOrEqual(50);
      expect(discoveryTime).toBeLessThan(100); // Sub-100ms requirement
      expect(result.discoveryTimeMs).toBeLessThan(100);
    });
  });

  describe('Agent Management', () => {
    let testAgentId: string;

    beforeEach(async () => {
      const testAgent = createTestAgent({
        name: 'management-test-agent',
      });
      testAgentId = await router.registerAgent(testAgent);
    });

    test('should update agent information', async () => {
      const updates = {
        status: 'degraded' as const,
        performance: {
          avgResponseTimeMs: 200,
          uptimePercentage: 95.0,
          requestsHandled: 2000,
          successRate: 0.95,
          throughputRps: 8,
        },
      };

      await router.updateAgent(testAgentId, updates);

      const updatedAgent = await router.getAgent(testAgentId);
      expect(updatedAgent?.status).toBe('degraded');
      expect(updatedAgent?.performance.avgResponseTimeMs).toBe(200);
      expect(updatedAgent?.performance.successRate).toBe(0.95);
    });

    test('should remove agent from registry', async () => {
      await router.removeAgent(testAgentId);

      const removedAgent = await router.getAgent(testAgentId);
      expect(removedAgent).toBeNull();
    });

    test('should handle non-existent agent operations gracefully', async () => {
      const nonExistentId = 'ossa-non-existent-agent';

      await expect(router.updateAgent(nonExistentId, { status: 'healthy' }))
        .rejects.toThrow();

      await expect(router.removeAgent(nonExistentId))
        .rejects.toThrow();

      const agent = await router.getAgent(nonExistentId);
      expect(agent).toBeNull();
    });
  });

  describe('Performance and Health', () => {
    test('should provide health status', async () => {
      const health = await router.getHealth();

      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(health.version).toBe('0.1.8');
      expect(typeof health.uptime).toBe('number');
      expect(health.services).toBeDefined();
      expect(health.performance).toBeDefined();
      expect(typeof health.performance.avgResponseTime).toBe('number');
    });

    test('should provide performance metrics', async () => {
      const metrics = await router.getMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.totalQueries).toBe('number');
      expect(typeof metrics.avgResponseTime).toBe('number');
      expect(typeof metrics.p95ResponseTime).toBe('number');
      expect(typeof metrics.cacheHitRate).toBe('number');
      expect(Array.isArray(metrics.protocols)).toBe(true);
    });

    test('should maintain sub-100ms response times', async () => {
      const iterations = 10;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        await router.discoverAgents({
          capabilities: ['chat'],
        });
        
        const responseTime = performance.now() - startTime;
        responseTimes.push(responseTime);
      }

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / iterations;
      const p95Index = Math.floor(iterations * 0.95);
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[p95Index];

      expect(avgResponseTime).toBeLessThan(100);
      expect(p95ResponseTime).toBeLessThan(100);
    });
  });

  describe('Caching and Optimization', () => {
    test('should cache discovery results', async () => {
      const query: DiscoveryQuery = {
        capabilities: ['chat'],
        maxResults: 5,
      };

      // First query - should be uncached
      const result1 = await router.discoverAgents(query);
      expect(result1.cache?.hit).toBeFalsy();

      // Second identical query - should be cached
      const result2 = await router.discoverAgents(query);
      expect(result2.cache?.hit).toBeTruthy();
      expect(result2.agents).toEqual(result1.agents);
    });

    test('should handle concurrent discovery requests efficiently', async () => {
      const query: DiscoveryQuery = {
        capabilities: ['reasoning'],
      };

      // Execute multiple concurrent queries
      const promises = Array.from({ length: 10 }, () => router.discoverAgents(query));
      const results = await Promise.all(promises);

      // All queries should return the same results
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.agents).toEqual(firstResult.agents);
        expect(result.totalFound).toBe(firstResult.totalFound);
      });

      // At least some should hit the cache
      const cacheHits = results.filter(r => r.cache?.hit).length;
      expect(cacheHits).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle malformed discovery queries gracefully', async () => {
      const malformedQuery = {
        capabilities: null,
        maxResults: -1,
        sortOrder: 'invalid',
      } as any;

      // Should not throw, but return empty or handle gracefully
      const result = await router.discoverAgents(malformedQuery);
      expect(result).toBeDefined();
    });

    test('should continue operating after errors', async () => {
      // Try to register an invalid agent
      try {
        await router.registerAgent({} as any);
      } catch (error) {
        // Expected to fail
      }

      // Router should still be operational
      const health = await router.getHealth();
      expect(health.status).toBe('healthy');

      // Should still be able to perform discovery
      const result = await router.discoverAgents({ capabilities: ['chat'] });
      expect(result).toBeDefined();
    });

    test('should handle resource exhaustion gracefully', async () => {
      // Try to register many agents quickly to test limits
      const bulkAgents = Array.from({ length: 100 }, (_, i) => 
        createTestAgent({
          name: `stress-test-agent-${i}`,
          capabilities: {
            primary: [`capability-${i}`],
            domains: [`domain-${i}`],
          },
        })
      );

      const results = await Promise.allSettled(
        bulkAgents.map(agent => router.registerAgent(agent))
      );

      // Some registrations might fail due to limits, but router should remain healthy
      const health = await router.getHealth();
      expect(['healthy', 'degraded']).toContain(health.status);

      const successfulRegistrations = results.filter(r => r.status === 'fulfilled').length;
      expect(successfulRegistrations).toBeGreaterThan(0);
    });
  });
});

describe('Router Configuration', () => {
  test('should create router with custom configuration', async () => {
    const customConfig: Partial<RouterConfig> = {
      discovery: {
        cacheTimeout: 60000,
        maxCacheEntries: 500,
        healthCheckInterval: 15000,
        indexingEnabled: false,
      },
      performance: {
        targetResponseTime: 25,
        maxConcurrentQueries: 50,
        batchSize: 10,
        compressionEnabled: true,
      },
    };

    const customRouter = createOSSARouter(customConfig);
    await customRouter.start();

    const health = await customRouter.getHealth();
    expect(health).toBeDefined();

    await customRouter.stop();
  });

  test('should handle invalid configuration gracefully', async () => {
    const invalidConfig = {
      performance: {
        targetResponseTime: -1,
        maxConcurrentQueries: 0,
      },
    } as any;

    // Should create router with defaults for invalid values
    const router = createOSSARouter(invalidConfig);
    expect(router).toBeDefined();

    await router.start();
    const health = await router.getHealth();
    expect(health.status).toBeDefined();

    await router.stop();
  });
});

// Performance Benchmarks
describe('Performance Benchmarks', () => {
  let benchmarkRouter: OSSARouter;

  beforeAll(async () => {
    benchmarkRouter = createOSSARouter({
      discovery: {
        cacheTimeout: 300000,
        maxCacheEntries: 10000,
        healthCheckInterval: 60000,
        indexingEnabled: true,
      },
      performance: {
        targetResponseTime: 50,
        maxConcurrentQueries: 1000,
        batchSize: 50,
        compressionEnabled: true,
      },
    });
    
    await benchmarkRouter.start();

    // Register 1000 test agents for benchmarking
    const benchmarkAgents = Array.from({ length: 1000 }, (_, i) => 
      createTestAgent({
        name: `benchmark-agent-${i}`,
        capabilities: {
          primary: [
            'chat', 'reasoning', 'calculation', 'translation', 
            'analysis', 'generation', 'classification'
          ].slice(0, (i % 3) + 1),
          secondary: ['optimization', 'validation'].slice(0, i % 2),
          domains: [
            'ai', 'nlp', 'mathematics', 'science', 'technology',
            'business', 'education', 'healthcare'
          ].slice(0, (i % 4) + 1),
        },
        metadata: {
          class: (['general', 'specialist', 'workflow'] as const)[i % 3],
          category: (['assistant', 'tool', 'service'] as const)[i % 3],
          conformanceTier: (['core', 'governed', 'advanced'] as const)[i % 3],
        },
        performance: {
          avgResponseTimeMs: 50 + (i % 100),
          uptimePercentage: 95 + (i % 5),
          requestsHandled: 1000 + (i * 10),
          successRate: 0.9 + ((i % 10) / 100),
          throughputRps: 10 + (i % 20),
        },
      })
    );

    await Promise.all(benchmarkAgents.map(agent => benchmarkRouter.registerAgent(agent)));
  });

  afterAll(async () => {
    await benchmarkRouter.stop();
  });

  test('should handle 1000+ agents with sub-100ms discovery', async () => {
    const query: DiscoveryQuery = {
      capabilities: ['chat', 'reasoning'],
      domains: ['ai', 'nlp'],
    };

    const startTime = performance.now();
    const result = await benchmarkRouter.discoverAgents(query);
    const discoveryTime = performance.now() - startTime;

    expect(result.totalFound).toBeGreaterThan(100); // Should find many matching agents
    expect(discoveryTime).toBeLessThan(100); // Sub-100ms requirement
    expect(result.discoveryTimeMs).toBeLessThan(100);
  });

  test('should maintain performance under concurrent load', async () => {
    const queries = Array.from({ length: 50 }, (_, i) => ({
      capabilities: ['chat'],
      domains: ['ai'],
      maxResults: 10,
    }));

    const startTime = performance.now();
    const results = await Promise.all(
      queries.map(query => benchmarkRouter.discoverAgents(query))
    );
    const totalTime = performance.now() - startTime;

    expect(results).toHaveLength(50);
    expect(totalTime).toBeLessThan(1000); // Should complete in under 1 second
    
    results.forEach(result => {
      expect(result.discoveryTimeMs).toBeLessThan(100);
    });
  });

  test('should demonstrate cache effectiveness', async () => {
    const query: DiscoveryQuery = {
      capabilities: ['reasoning'],
      maxResults: 50,
    };

    // First query - uncached
    const uncachedResult = await benchmarkRouter.discoverAgents(query);
    expect(uncachedResult.cache?.hit).toBeFalsy();

    // Subsequent queries - cached
    const cachedResults = await Promise.all(
      Array.from({ length: 10 }, () => benchmarkRouter.discoverAgents(query))
    );

    cachedResults.forEach(result => {
      expect(result.cache?.hit).toBeTruthy();
      expect(result.discoveryTimeMs).toBeLessThan(50); // Cached should be even faster
    });
  });
});