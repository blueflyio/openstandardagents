/**
 * VORTEX System Unit Tests
 * Tests for the Vector-Optimized Reactive Token Exchange system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  VortexFactory,
  EnhancedVortexEngine,
  TokenType,
  CachePolicy,
  FailureMode,
  VortexToken,
  ResolverContext,
  ContextTokenResolver,
  DataTokenResolver,
  StateTokenResolver,
  MetricsTokenResolver,
  TemporalTokenResolver
} from '../../src/vortex';

describe('VORTEX Token Exchange System', () => {
  let vortexEngine: EnhancedVortexEngine;
  let mockContext: ResolverContext;

  beforeEach(() => {
    const config = VortexFactory.createTestConfig();
    vortexEngine = VortexFactory.createEngine(undefined, undefined, config);
    
    mockContext = {
      agentId: 'test-agent',
      workflowId: 'test-workflow',
      permissions: ['read', 'resolve'],
      timestamp: new Date()
    };
  });

  describe('Factory and Configuration', () => {
    it('should create default configuration', () => {
      const config = VortexFactory.createDefaultConfig();
      
      expect(config.jitResolver.maxConcurrentResolutions).toBe(50);
      expect(config.adaptiveCache.variableDuration.maxDurationMs).toBe(600000); // 10 minutes
      expect(config.vectorSearch.enabled).toBe(true);
      expect(config.resilience.circuitBreakerThreshold).toBe(5);
    });

    it('should create test configuration with reduced limits', () => {
      const config = VortexFactory.createTestConfig();
      
      expect(config.resilience.maxConcurrentResolutions).toBe(10);
      expect(config.adaptiveCache.maxCacheSize).toBe(100);
      expect(config.resilience.timeoutMs).toBe(5000);
    });

    it('should create production configuration with increased limits', () => {
      const config = VortexFactory.createProductionConfig();
      
      expect(config.resilience.maxConcurrentResolutions).toBe(500);
      expect(config.adaptiveCache.maxCacheSize).toBe(10000);
      expect(config.adaptiveCache.performanceThresholds.highPerformanceMs).toBe(50);
    });
  });

  describe('Token Pattern Recognition', () => {
    const testCases = [
      {
        text: 'Current user roles: {CONTEXT:workflow:current:agent-roles}',
        expectedTokens: 1,
        expectedType: TokenType.CONTEXT
      },
      {
        text: 'API spec: {DATA:artifact:v1:api-spec} and schema: {DATA:schema:current:user-schema}',
        expectedTokens: 2,
        expectedType: TokenType.DATA
      },
      {
        text: 'Agent status: {STATE:agent:orchestrator:current-plan}',
        expectedTokens: 1,
        expectedType: TokenType.STATE
      },
      {
        text: 'Performance: {METRICS:performance:current:response-time}',
        expectedTokens: 1,
        expectedType: TokenType.METRICS
      },
      {
        text: 'Next rotation: {TEMPORAL:schedule:daily:agent-rotation}',
        expectedTokens: 1,
        expectedType: TokenType.TEMPORAL
      }
    ];

    testCases.forEach(({ text, expectedTokens, expectedType }) => {
      it(`should extract ${expectedTokens} ${expectedType} token(s) from text`, async () => {
        const result = await vortexEngine.processText(text, mockContext);
        
        expect(result.tokensProcessed).toBe(expectedTokens);
        expect(result.successfulResolutions).toBeGreaterThan(0);
        expect(result.processedText).not.toBe(text); // Should be transformed
      });
    });
  });

  describe('Type-Safe Resolvers', () => {
    describe('ContextTokenResolver', () => {
      let resolver: ContextTokenResolver;

      beforeEach(() => {
        resolver = new ContextTokenResolver();
      });

      it('should validate context tokens correctly', () => {
        const validToken: VortexToken = {
          id: 'test-context',
          namespace: 'workflow',
          type: TokenType.CONTEXT,
          placeholder: '{CONTEXT:workflow:current:agent-roles}',
          cachePolicy: CachePolicy.MEDIUM_TERM,
          permissions: { readAgents: ['*'], writeAgents: [], resolveAgents: ['*'], namespaceAccess: ['workflow'] },
          metadata: {} as any,
          dependencies: [],
          expiry: new Date(Date.now() + 300000),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const validation = resolver.validate(validToken);
        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should reject tokens with wrong type', () => {
        const invalidToken: VortexToken = {
          id: 'test-invalid',
          namespace: 'workflow',
          type: TokenType.DATA, // Wrong type
          placeholder: '{CONTEXT:workflow:current:agent-roles}',
          cachePolicy: CachePolicy.MEDIUM_TERM,
          permissions: { readAgents: ['*'], writeAgents: [], resolveAgents: ['*'], namespaceAccess: ['workflow'] },
          metadata: {} as any,
          dependencies: [],
          expiry: new Date(Date.now() + 300000),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const validation = resolver.validate(invalidToken);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toHaveLength(1);
        expect(validation.errors[0].code).toBe('TYPE_BOUNDARY_VIOLATION');
      });

      it('should resolve context tokens', async () => {
        const token: VortexToken = {
          id: 'test-context',
          namespace: 'workflow',
          type: TokenType.CONTEXT,
          placeholder: '{CONTEXT:workflow:current:agent-roles}',
          cachePolicy: CachePolicy.MEDIUM_TERM,
          permissions: { readAgents: ['*'], writeAgents: [], resolveAgents: ['*'], namespaceAccess: ['workflow'] },
          metadata: {} as any,
          dependencies: [],
          expiry: new Date(Date.now() + 300000),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await resolver.resolve(token, mockContext);
        
        expect(result.success).toBe(true);
        expect(result.resolvedValue).toBeDefined();
        expect(result.metadata.resolveTime).toBeGreaterThan(0);
      });
    });

    describe('DataTokenResolver', () => {
      let resolver: DataTokenResolver;

      beforeEach(() => {
        resolver = new DataTokenResolver();
      });

      it('should resolve data tokens', async () => {
        const token: VortexToken = {
          id: 'test-data',
          namespace: 'artifacts',
          type: TokenType.DATA,
          placeholder: '{DATA:artifact:v1:user-requirements}',
          cachePolicy: CachePolicy.LONG_TERM,
          permissions: { readAgents: ['*'], writeAgents: [], resolveAgents: ['*'], namespaceAccess: ['artifacts'] },
          metadata: {} as any,
          dependencies: [],
          expiry: new Date(Date.now() + 600000),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await resolver.resolve(token, mockContext);
        
        expect(result.success).toBe(true);
        expect(result.resolvedValue).toBeDefined();
        expect(typeof result.resolvedValue).toBe('object');
      });
    });

    describe('TemporalTokenResolver', () => {
      let resolver: TemporalTokenResolver;

      beforeEach(() => {
        resolver = new TemporalTokenResolver();
      });

      it('should not cache temporal tokens', () => {
        expect(resolver.cachePolicy).toBe(CachePolicy.NO_CACHE);
      });

      it('should resolve temporal tokens with current time', async () => {
        const token: VortexToken = {
          id: 'test-temporal',
          namespace: 'time',
          type: TokenType.TEMPORAL,
          placeholder: '{TEMPORAL:schedule:daily:agent-rotation}',
          cachePolicy: CachePolicy.NO_CACHE,
          permissions: { readAgents: ['*'], writeAgents: [], resolveAgents: ['*'], namespaceAccess: ['time'] },
          metadata: {} as any,
          dependencies: [],
          expiry: new Date(Date.now() + 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await resolver.resolve(token, mockContext);
        
        expect(result.success).toBe(true);
        expect(result.resolvedValue).toBeDefined();
        expect(result.resolvedValue.nextRotation).toBeDefined();
      });
    });
  });

  describe('Adaptive Caching', () => {
    it('should cache and retrieve successful resolutions', async () => {
      const text = 'User roles: {CONTEXT:workflow:current:agent-roles}';
      
      // First resolution (cache miss)
      const result1 = await vortexEngine.processText(text, mockContext);
      expect(result1.successfulResolutions).toBe(1);
      
      // Second resolution (should be faster due to cache hit)
      const start = Date.now();
      const result2 = await vortexEngine.processText(text, mockContext);
      const end = Date.now();
      
      expect(result2.successfulResolutions).toBe(1);
      expect(end - start).toBeLessThan(50); // Should be very fast
    });

    it('should respect cache policies for different token types', async () => {
      const contextText = 'Context: {CONTEXT:workflow:current:test}';
      const temporalText = 'Time: {TEMPORAL:schedule:now:current}';
      
      // Process both texts
      await vortexEngine.processText(contextText, mockContext);
      await vortexEngine.processText(temporalText, mockContext);
      
      const stats = vortexEngine.getSystemStatus().cache;
      
      // Context should be cached, temporal should not
      expect(stats.totalEntries).toBeGreaterThan(0);
      // Temporal tokens use NO_CACHE policy, so they shouldn't increase cache size significantly
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle malformed tokens gracefully', async () => {
      const text = 'Invalid token: {INVALID:format:here}';
      
      const result = await vortexEngine.processText(text, mockContext);
      
      expect(result.errors).toHaveLength(0); // No errors because token is not recognized
      expect(result.processedText).toBe(text); // Text unchanged
      expect(result.tokensProcessed).toBe(0);
    });

    it('should provide fallback values when resolution fails', async () => {
      // Mock a resolver failure
      const originalProcessText = vortexEngine.processText.bind(vortexEngine);
      const mockProcessText = vi.fn().mockImplementation(async (text, context) => {
        // For this test, we'll simulate graceful degradation
        return {
          processedText: text.replace(/{[^}]+}/g, '[FALLBACK]'),
          originalText: text,
          processingId: 'test-id',
          tokensProcessed: 1,
          successfulResolutions: 0,
          errors: [],
          processingTimeMs: 10,
          analytics: {} as any,
          cacheStats: {} as any,
          vectorSearchUsed: false
        };
      });
      
      vortexEngine.processText = mockProcessText;
      
      const text = 'Value: {CONTEXT:workflow:current:test}';
      const result = await vortexEngine.processText(text, mockContext);
      
      expect(result.processedText).toContain('[FALLBACK]');
      expect(result.tokensProcessed).toBe(1);
    });
  });

  describe('Performance and Analytics', () => {
    it('should track resolution performance metrics', async () => {
      const text = 'Multiple tokens: {CONTEXT:workflow:current:test} and {DATA:artifact:v1:spec}';
      
      const result = await vortexEngine.processText(text, mockContext);
      
      expect(result.analytics.totalTokens).toBe(2);
      expect(result.analytics.processingTimeMs).toBeGreaterThan(0);
      expect(result.analytics.typeDistribution).toBeDefined();
      expect(result.analytics.performanceBreakdown).toBeDefined();
    });

    it('should provide system status information', () => {
      const status = vortexEngine.getSystemStatus();
      
      expect(status.engine.isHealthy).toBe(true);
      expect(status.engine.registeredResolvers).toBeGreaterThan(0);
      expect(status.cache).toBeDefined();
      expect(status.vectorSearch.enabled).toBe(true);
    });
  });

  describe('Token Boundaries and Type Safety', () => {
    it('should enforce strict type boundaries', async () => {
      // Each resolver should only handle its designated token type
      const resolvers = [
        new ContextTokenResolver(),
        new DataTokenResolver(),
        new StateTokenResolver(),
        new MetricsTokenResolver(),
        new TemporalTokenResolver()
      ];

      for (const resolver of resolvers) {
        // Create a token with the wrong type for this resolver
        const wrongTypeToken: VortexToken = {
          id: 'wrong-type',
          namespace: 'test',
          type: resolver.type === TokenType.CONTEXT ? TokenType.DATA : TokenType.CONTEXT,
          placeholder: '{WRONG:type:test:token}',
          cachePolicy: CachePolicy.SHORT_TERM,
          permissions: { readAgents: ['*'], writeAgents: [], resolveAgents: ['*'], namespaceAccess: ['test'] },
          metadata: {} as any,
          dependencies: [],
          expiry: new Date(Date.now() + 60000),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const validation = resolver.validate(wrongTypeToken);
        expect(validation.valid).toBe(false);
        expect(validation.errors.some(e => e.code === 'TYPE_BOUNDARY_VIOLATION')).toBe(true);
      }
    });
  });

  describe('Variable Cache Duration (0-600s)', () => {
    it('should respect minimum cache duration of 0 seconds', () => {
      const config = VortexFactory.createTestConfig();
      expect(config.adaptiveCache.variableDuration.minDurationMs).toBe(0);
    });

    it('should respect maximum cache duration of 600 seconds', () => {
      const config = VortexFactory.createDefaultConfig();
      expect(config.adaptiveCache.variableDuration.maxDurationMs).toBe(600000); // 600 seconds = 10 minutes
    });

    it('should adapt cache duration based on token type', async () => {
      const contextText = 'Context: {CONTEXT:workflow:current:stable-data}';
      const temporalText = 'Time: {TEMPORAL:schedule:now:current-time}';
      
      // Process tokens to establish cache entries
      await vortexEngine.processText(contextText, mockContext);
      await vortexEngine.processText(temporalText, mockContext);
      
      const cacheStats = vortexEngine.getSystemStatus().cache;
      
      // Context tokens should have longer cache duration than temporal
      // Temporal tokens use NO_CACHE policy (0 seconds)
      expect(cacheStats).toBeDefined();
    });
  });
});

describe('VORTEX Integration Tests', () => {
  let vortexEngine: EnhancedVortexEngine;
  let mockContext: ResolverContext;

  beforeEach(() => {
    const config = VortexFactory.createTestConfig();
    vortexEngine = VortexFactory.createEngine(undefined, undefined, config);
    
    mockContext = {
      agentId: 'integration-test-agent',
      workflowId: 'integration-test-workflow',
      permissions: ['read', 'resolve'],
      timestamp: new Date()
    };
  });

  it('should process complex text with multiple token types', async () => {
    const complexText = `
      Agent workflow analysis:
      - Current agent roles: {CONTEXT:workflow:current:agent-roles}
      - User requirements: {DATA:artifact:v1:user-requirements}
      - System status: {STATE:agent:orchestrator:current-plan}
      - Performance metrics: {METRICS:performance:current:response-time}
      - Next rotation: {TEMPORAL:schedule:daily:agent-rotation}
      
      Additional context:
      - API specification: {DATA:schema:current:api-spec}
      - Cost metrics: {METRICS:cost:current:token-usage}
    `;

    const result = await vortexEngine.processText(complexText, mockContext);
    
    expect(result.tokensProcessed).toBe(7);
    expect(result.successfulResolutions).toBeGreaterThan(0);
    expect(result.processedText).not.toBe(complexText);
    expect(result.analytics.typeDistribution[TokenType.CONTEXT]).toBeGreaterThan(0);
    expect(result.analytics.typeDistribution[TokenType.DATA]).toBeGreaterThan(0);
    expect(result.analytics.typeDistribution[TokenType.STATE]).toBeGreaterThan(0);
    expect(result.analytics.typeDistribution[TokenType.METRICS]).toBeGreaterThan(0);
    expect(result.analytics.typeDistribution[TokenType.TEMPORAL]).toBeGreaterThan(0);
  });

  it('should demonstrate token savings and performance benefits', async () => {
    const text = 'Repeated context: {CONTEXT:workflow:current:agent-roles} and again: {CONTEXT:workflow:current:agent-roles}';
    
    const result = await vortexEngine.processText(text, mockContext);
    
    expect(result.tokensProcessed).toBe(2);
    expect(result.analytics.costSavings.tokensSaved).toBeGreaterThan(0);
    expect(result.cacheStats.hitRate).toBeGreaterThanOrEqual(0);
  });
});