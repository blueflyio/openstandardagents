/**
 * VORTEX (Vector-Optimized Reactive Token Exchange System) Integration Tests - OSSA v0.1.8
 * 
 * Tests the complete VORTEX system including:
 * - Just-in-Time Resolution with deduplication and concurrent locks
 * - Type-Safe Token Boundaries (CONTEXT, DATA, STATE, METRICS, TEMPORAL)
 * - Adaptive Caching with variable duration 0-600s based on token type and usage patterns
 * - Comprehensive Error Handling with circuit breakers and fallback mechanisms
 * - Vector Search Enhancement for semantic token matching
 * - Advanced Analytics for token savings and performance tracking
 * 
 * Validates claimed performance metrics:
 * - 67% token reduction through intelligent caching and deduplication
 * - 45% latency improvement via JIT resolution and vector search
 * - 85%+ cache hit rate with adaptive duration policies
 * - 95%+ error recovery rate through comprehensive fallback mechanisms
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setTimeout as delay } from 'timers/promises';
import axios from 'axios';
import { performance } from 'perf_hooks';

// Import VORTEX components for testing
import { EnhancedVortexEngine } from '../../src/vortex/enhanced-vortex-engine';
import { VortexFactory } from '../../src/vortex';
import { 
  TokenType, 
  CompressionLevel, 
  CachePolicy, 
  FailurePolicy,
  FailureMode,
  VORTEX_TOKEN_PATTERNS 
} from '../../src/vortex/token-types';

// Test configuration for VORTEX validation
interface VortexTestConfig {
  baseUrl: string;
  qdrantUrl: string;
  redisUrl: string;
  timeout: number;
  performanceTargets: {
    tokenReduction: number;      // 67% target
    latencyImprovement: number;  // 45% target
    cacheHitRate: number;        // 85% target
    errorRecoveryRate: number;   // 95% target
  };
  cacheSettings: {
    noCache: number;         // 0s for TEMPORAL
    shortTerm: number;       // 0-60s for STATE/METRICS
    mediumTerm: number;      // 60-300s for CONTEXT
    longTerm: number;        // 300-600s for DATA
  };
}

// Comprehensive VORTEX token test data
interface VortexTestTokens {
  context: Array<{
    token: string;
    expectedResolution: string;
    cachePolicy: CachePolicy;
    dependencies?: string[];
  }>;
  data: Array<{
    token: string;
    expectedResolution: string;
    cachePolicy: CachePolicy;
    dataSize: number;
  }>;
  state: Array<{
    token: string;
    expectedResolution: string;
    cachePolicy: CachePolicy;
    volatility: 'low' | 'medium' | 'high';
  }>;
  metrics: Array<{
    token: string;
    expectedResolution: string;
    cachePolicy: CachePolicy;
    updateFrequency: number;
  }>;
  temporal: Array<{
    token: string;
    expectedResolution: string;
    cachePolicy: CachePolicy;
    expiryTime: number;
  }>;
}

// VORTEX Performance analytics
interface VortexPerformanceAnalytics {
  tokensSaved: number;
  tokensProcessed: number;
  tokenReductionRatio: number;
  cacheHitRate: number;
  averageResponseTime: number;
  baselineResponseTime: number;
  latencyImprovement: number;
  errorRate: number;
  fallbackUsageRate: number;
  vectorSearchMatches: number;
  deduplicationSavings: number;
}

describe('VORTEX System Integration Tests', () => {
  let testConfig: VortexTestConfig;
  let vortexEngine: string;
  let testTokens: VortexTestTokens;
  let baselineMetrics: VortexPerformanceAnalytics;
  let serviceAvailable = false;

  beforeAll(async () => {
    testConfig = {
      baseUrl: 'http://localhost:4000',
      qdrantUrl: 'http://localhost:6333',
      redisUrl: 'redis://localhost:6379',
      timeout: 30000,
      performanceTargets: {
        tokenReduction: 0.67,        // 67%
        latencyImprovement: 0.45,    // 45%
        cacheHitRate: 0.85,         // 85%
        errorRecoveryRate: 0.95     // 95%
      },
      cacheSettings: {
        noCache: 0,         // TEMPORAL tokens
        shortTerm: 30,      // STATE/METRICS (0-60s)
        mediumTerm: 180,    // CONTEXT (60-300s)
        longTerm: 450       // DATA (300-600s)
      }
    };

    // Initialize comprehensive test token data
    testTokens = {
      context: [
        {
          token: '{CONTEXT:workflow:current:agent-roles}',
          expectedResolution: '["judge", "critic", "orchestrator", "worker"]',
          cachePolicy: CachePolicy.MEDIUM_TERM,
          dependencies: ['{CONTEXT:session:active:user-permissions}']
        },
        {
          token: '{CONTEXT:session:active:user-preferences}',
          expectedResolution: '{"theme": "dark", "language": "en", "notifications": true}',
          cachePolicy: CachePolicy.MEDIUM_TERM
        },
        {
          token: '{CONTEXT:workflow:history:completion-rate}',
          expectedResolution: '0.87',
          cachePolicy: CachePolicy.MEDIUM_TERM
        }
      ],
      data: [
        {
          token: '{DATA:artifact:v1:user-requirements}',
          expectedResolution: 'Comprehensive user requirements document with 47 functional requirements',
          cachePolicy: CachePolicy.LONG_TERM,
          dataSize: 15000
        },
        {
          token: '{DATA:schema:current:api-spec}',
          expectedResolution: 'OpenAPI 3.1 specification with 127 endpoints and comprehensive validation',
          cachePolicy: CachePolicy.LONG_TERM,
          dataSize: 32000
        },
        {
          token: '{DATA:template:standard:response-format}',
          expectedResolution: 'Standard JSON response template with error handling and metadata',
          cachePolicy: CachePolicy.LONG_TERM,
          dataSize: 2500
        }
      ],
      state: [
        {
          token: '{STATE:agent:orchestrator:current-plan}',
          expectedResolution: 'Multi-phase execution plan with 12 active tasks and 3 pending reviews',
          cachePolicy: CachePolicy.SHORT_TERM,
          volatility: 'high'
        },
        {
          token: '{STATE:workflow:feedback:iteration-count}',
          expectedResolution: '23',
          cachePolicy: CachePolicy.SHORT_TERM,
          volatility: 'medium'
        },
        {
          token: '{STATE:system:health:component-status}',
          expectedResolution: '{"orchestrator": "healthy", "judges": "healthy", "critics": "degraded"}',
          cachePolicy: CachePolicy.SHORT_TERM,
          volatility: 'high'
        }
      ],
      metrics: [
        {
          token: '{METRICS:cost:current:token-usage}',
          expectedResolution: '45627',
          cachePolicy: CachePolicy.SHORT_TERM,
          updateFrequency: 5000 // 5 seconds
        },
        {
          token: '{METRICS:performance:agent:response-time}',
          expectedResolution: '1247ms',
          cachePolicy: CachePolicy.SHORT_TERM,
          updateFrequency: 1000 // 1 second
        },
        {
          token: '{METRICS:quality:current:success-rate}',
          expectedResolution: '0.943',
          cachePolicy: CachePolicy.SHORT_TERM,
          updateFrequency: 10000 // 10 seconds
        }
      ],
      temporal: [
        {
          token: '{TEMPORAL:schedule:daily:agent-rotation}',
          expectedResolution: '2024-12-08T14:30:00Z',
          cachePolicy: CachePolicy.NO_CACHE,
          expiryTime: 1800000 // 30 minutes
        },
        {
          token: '{TEMPORAL:deadline:task:completion-time}',
          expectedResolution: '2024-12-08T16:45:00Z',
          cachePolicy: CachePolicy.NO_CACHE,
          expiryTime: 3600000 // 1 hour
        },
        {
          token: '{TEMPORAL:event:next:scheduled-maintenance}',
          expectedResolution: '2024-12-09T02:00:00Z',
          cachePolicy: CachePolicy.NO_CACHE,
          expiryTime: 86400000 // 24 hours
        }
      ]
    };

    // Check service availability
    try {
      const [healthResp, qdrantResp, redisResp] = await Promise.all([
        axios.get(`${testConfig.baseUrl}/health`, { timeout: 5000 }),
        axios.get(`${testConfig.qdrantUrl}/health`, { timeout: 5000 }),
        axios.get(`${testConfig.baseUrl}/redis/health`, { timeout: 5000 })
      ]);
      
      serviceAvailable = healthResp.status === 200 && qdrantResp.status === 200 && redisResp.status === 200;
      console.log('✅ VORTEX services (OSSA, Qdrant, Redis) available for testing');
    } catch (error) {
      console.warn('⚠️  VORTEX services not fully available, some tests will be skipped');
      serviceAvailable = false;
    }
  });

  afterAll(async () => {
    // Cleanup VORTEX engine
    if (vortexEngine && serviceAvailable) {
      try {
        await axios.delete(`${testConfig.baseUrl}/vortex/${vortexEngine}`);
      } catch (error) {
        console.warn('Failed to cleanup VORTEX engine:', error);
      }
    }
  });

  describe('VORTEX System Initialization', () => {
    it('should initialize Enhanced VORTEX Engine with all components', async () => {
      if (!serviceAvailable) return;

      const startTime = performance.now();

      const initResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/initialize`,
        {
          jitResolver: {
            maxConcurrentResolutions: 50,
            vectorSimilarityThreshold: 0.7,
            adaptiveCachingEnabled: true,
            performanceThresholds: {
              maxResolutionTime: 1000,
              maxCacheSize: 1000,
              maxDependencyDepth: 5
            }
          },
          adaptiveCache: {
            maxCacheSize: 1000,
            cleanupIntervalMs: 60000,
            variableDuration: {
              minDurationMs: 0,
              maxDurationMs: 600000,
              adaptiveMultipliers: {
                performance: 1.2,
                usage: 1.3,
                type: 1.1,
                recency: 1.15
              }
            }
          },
          vectorSearch: {
            enabled: true,
            collectionName: 'vortex-tokens',
            embeddingDimension: 384,
            similarityThreshold: 0.7
          },
          resilience: {
            maxConcurrentResolutions: 50,
            circuitBreakerThreshold: 3,
            timeoutMs: 5000,
            retryPolicy: {
              maxRetries: 3,
              backoffMultiplier: 2,
              maxBackoffMs: 30000
            }
          }
        },
        { timeout: testConfig.timeout }
      );

      const initTime = performance.now() - startTime;

      expect(initResponse.status).toBe(201);
      expect(initResponse.data.engineId).toBeDefined();
      expect(initResponse.data.status).toBe('initialized');
      expect(initResponse.data.components).toEqual({
        jitResolver: 'ready',
        adaptiveCache: 'ready',
        vectorSearch: 'ready',
        circuitBreakers: 'ready',
        typeResolvers: 'ready'
      });

      vortexEngine = initResponse.data.engineId;
      expect(initTime).toBeLessThan(8000); // Should initialize within 8 seconds

      console.log(`✅ VORTEX Engine initialized in ${initTime.toFixed(0)}ms`);
    });

    it('should register type-safe token resolvers for all token types', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      const resolversResponse = await axios.get(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/resolvers`
      );

      expect(resolversResponse.status).toBe(200);
      const resolvers = resolversResponse.data.resolvers;

      // Verify all token types have registered resolvers
      const tokenTypes = [
        TokenType.CONTEXT,
        TokenType.DATA,
        TokenType.STATE,
        TokenType.METRICS,
        TokenType.TEMPORAL
      ];

      tokenTypes.forEach(tokenType => {
        const typeResolvers = resolvers.filter((r: any) => r.type === tokenType);
        expect(typeResolvers.length).toBeGreaterThan(0);
      });

      // Verify cache policies match token types
      const cacheMapping = {
        [TokenType.TEMPORAL]: CachePolicy.NO_CACHE,
        [TokenType.STATE]: CachePolicy.SHORT_TERM,
        [TokenType.METRICS]: CachePolicy.SHORT_TERM,
        [TokenType.CONTEXT]: CachePolicy.MEDIUM_TERM,
        [TokenType.DATA]: CachePolicy.LONG_TERM
      };

      resolvers.forEach((resolver: any) => {
        expect(resolver.cachePolicy).toBe(cacheMapping[resolver.type as TokenType]);
      });

      console.log(`✅ ${resolvers.length} type-safe token resolvers registered`);
    });

    it('should establish vector database connection and token collection', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      const vectorStatusResponse = await axios.get(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/vector-status`
      );

      expect(vectorStatusResponse.status).toBe(200);
      const vectorStatus = vectorStatusResponse.data;

      expect(vectorStatus.connected).toBe(true);
      expect(vectorStatus.collection.name).toBe('vortex-tokens');
      expect(vectorStatus.collection.dimension).toBe(384);
      expect(vectorStatus.collection.indexReady).toBe(true);
      expect(vectorStatus.collection.pointCount).toBeGreaterThanOrEqual(0);

      // Test vector search functionality
      const searchResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/vector-search`,
        {
          query: 'workflow current status',
          limit: 5,
          threshold: 0.7
        }
      );

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.data.results).toBeDefined();
      expect(searchResponse.data.searchTime).toBeLessThan(1000); // < 1 second
    });
  });

  describe('Type-Safe Token Resolution', () => {
    beforeEach(async () => {
      // Capture baseline metrics before each test
      if (serviceAvailable && vortexEngine) {
        try {
          const baselineResponse = await axios.get(
            `${testConfig.baseUrl}/vortex/${vortexEngine}/baseline-metrics`
          );
          baselineMetrics = baselineResponse.data;
        } catch (error) {
          console.warn('Failed to capture baseline metrics:', error);
        }
      }
    });

    it('should resolve CONTEXT tokens with medium-term caching (60-300s)', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      const contextTestText = `
        Current agent roles: ${testTokens.context[0].token}
        User preferences: ${testTokens.context[1].token}
        Completion rate: ${testTokens.context[2].token}
      `;

      const startTime = performance.now();
      
      const resolveResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`,
        {
          text: contextTestText,
          context: {
            agentId: 'test-agent',
            workflowId: 'context-test-workflow',
            permissions: ['read', 'resolve'],
            timestamp: new Date()
          }
        }
      );

      const resolutionTime = performance.now() - startTime;

      expect(resolveResponse.status).toBe(200);
      const result = resolveResponse.data;

      // Verify token resolution
      expect(result.processedText).toContain('["judge", "critic", "orchestrator", "worker"]');
      expect(result.processedText).toContain('"theme": "dark"');
      expect(result.processedText).toContain('0.87');

      // Verify caching behavior
      expect(result.tokensProcessed).toBe(3);
      expect(result.analytics.cachePolicy).toBe(CachePolicy.MEDIUM_TERM);
      expect(result.analytics.cacheDuration).toBeGreaterThanOrEqual(60000);
      expect(result.analytics.cacheDuration).toBeLessThanOrEqual(300000);

      expect(resolutionTime).toBeLessThan(2000); // Should resolve quickly

      // Test cache hit on second request
      const cachedStartTime = performance.now();
      const cachedResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`,
        {
          text: contextTestText,
          context: { agentId: 'test-agent', workflowId: 'context-test-workflow' }
        }
      );
      const cachedTime = performance.now() - cachedStartTime;

      expect(cachedResponse.data.analytics.cacheHitRate).toBeGreaterThan(0.5);
      expect(cachedTime).toBeLessThan(resolutionTime * 0.3); // Cache should be much faster

      console.log(`✅ CONTEXT tokens resolved in ${resolutionTime.toFixed(0)}ms (cached: ${cachedTime.toFixed(0)}ms)`);
    });

    it('should resolve DATA tokens with long-term caching (300-600s)', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      const dataTestText = `
        User requirements: ${testTokens.data[0].token}
        API specification: ${testTokens.data[1].token}
        Response template: ${testTokens.data[2].token}
      `;

      const resolveResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`,
        {
          text: dataTestText,
          context: {
            agentId: 'test-agent',
            dataAccess: true,
            timestamp: new Date()
          }
        }
      );

      expect(resolveResponse.status).toBe(200);
      const result = resolveResponse.data;

      // Verify DATA token resolution
      expect(result.processedText).toContain('47 functional requirements');
      expect(result.processedText).toContain('127 endpoints');
      expect(result.processedText).toContain('JSON response template');

      // Verify long-term caching
      expect(result.analytics.cachePolicy).toBe(CachePolicy.LONG_TERM);
      expect(result.analytics.cacheDuration).toBeGreaterThanOrEqual(300000);
      expect(result.analytics.cacheDuration).toBeLessThanOrEqual(600000);

      // Verify data size handling
      expect(result.analytics.totalDataSize).toBeGreaterThan(49500); // Sum of test data sizes
      expect(result.analytics.compressionApplied).toBe(true);

      // Test persistence across multiple requests
      const persistenceTests = [];
      for (let i = 0; i < 5; i++) {
        persistenceTests.push(
          axios.post(`${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`, {
            text: dataTestText,
            context: { agentId: `test-agent-${i}` }
          })
        );
        await delay(100);
      }

      const persistenceResults = await Promise.all(persistenceTests);
      const avgCacheHitRate = persistenceResults.reduce((sum, res) => 
        sum + res.data.analytics.cacheHitRate, 0) / persistenceResults.length;

      expect(avgCacheHitRate).toBeGreaterThan(0.8); // High cache hit rate for stable data

      console.log(`✅ DATA tokens resolved with ${(avgCacheHitRate * 100).toFixed(1)}% average cache hit rate`);
    });

    it('should resolve STATE tokens with short-term caching (0-60s)', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      const stateTestText = `
        Current plan: ${testTokens.state[0].token}
        Iteration count: ${testTokens.state[1].token}
        Component status: ${testTokens.state[2].token}
      `;

      const resolveResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`,
        {
          text: stateTestText,
          context: {
            agentId: 'test-agent',
            stateAccess: true,
            timestamp: new Date()
          }
        }
      );

      expect(resolveResponse.status).toBe(200);
      const result = resolveResponse.data;

      // Verify STATE token resolution
      expect(result.processedText).toContain('12 active tasks');
      expect(result.processedText).toContain('23');
      expect(result.processedText).toContain('degraded');

      // Verify short-term caching
      expect(result.analytics.cachePolicy).toBe(CachePolicy.SHORT_TERM);
      expect(result.analytics.cacheDuration).toBeGreaterThanOrEqual(0);
      expect(result.analytics.cacheDuration).toBeLessThanOrEqual(60000);

      // Test volatility handling - high volatility should have shorter cache duration
      const volatileTokens = testTokens.state.filter(t => t.volatility === 'high');
      for (const token of volatileTokens) {
        const volatileResponse = await axios.post(
          `${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`,
          {
            text: token.token,
            context: { volatilityTest: true }
          }
        );

        expect(volatileResponse.data.analytics.cacheDuration).toBeLessThan(30000); // < 30s for high volatility
      }

      console.log(`✅ STATE tokens resolved with volatility-aware caching`);
    });

    it('should resolve METRICS tokens with frequent updates (0-60s)', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      const metricsTestText = `
        Token usage: ${testTokens.metrics[0].token}
        Response time: ${testTokens.metrics[1].token}
        Success rate: ${testTokens.metrics[2].token}
      `;

      // Test metrics resolution with time-based updates
      const metricsResults: any[] = [];

      for (let i = 0; i < 10; i++) {
        const resolveResponse = await axios.post(
          `${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`,
          {
            text: metricsTestText,
            context: {
              agentId: 'metrics-test-agent',
              iteration: i + 1,
              timestamp: new Date()
            }
          }
        );

        expect(resolveResponse.status).toBe(200);
        metricsResults.push(resolveResponse.data);

        await delay(500); // 500ms between requests
      }

      // Verify METRICS token resolution
      const lastResult = metricsResults[metricsResults.length - 1];
      expect(lastResult.processedText).toContain('45627');
      expect(lastResult.processedText).toContain('1247ms');
      expect(lastResult.processedText).toContain('0.943');

      // Verify adaptive cache duration based on update frequency
      const highFrequencyTokens = testTokens.metrics.filter(t => t.updateFrequency <= 5000);
      const lowFrequencyTokens = testTokens.metrics.filter(t => t.updateFrequency > 5000);

      // High frequency tokens should have shorter cache duration
      expect(metricsResults.some(r => r.analytics.highFrequencyDetected)).toBe(true);

      // Verify cache invalidation on updates
      const cacheHitRates = metricsResults.map(r => r.analytics.cacheHitRate);
      const avgCacheHitRate = cacheHitRates.reduce((sum, rate) => sum + rate, 0) / cacheHitRates.length;

      expect(avgCacheHitRate).toBeLessThan(0.9); // Lower hit rate due to frequent updates
      expect(avgCacheHitRate).toBeGreaterThan(0.3); // But still some caching benefit

      console.log(`✅ METRICS tokens resolved with ${(avgCacheHitRate * 100).toFixed(1)}% cache hit rate and adaptive update handling`);
    });

    it('should resolve TEMPORAL tokens with no caching (0s)', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      const temporalTestText = `
        Next rotation: ${testTokens.temporal[0].token}
        Task deadline: ${testTokens.temporal[1].token}
        Maintenance window: ${testTokens.temporal[2].token}
      `;

      const temporalResults: any[] = [];

      // Test multiple requests to verify no caching
      for (let i = 0; i < 5; i++) {
        const resolveResponse = await axios.post(
          `${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`,
          {
            text: temporalTestText,
            context: {
              agentId: 'temporal-test-agent',
              requestId: `temporal-${i}`,
              timestamp: new Date()
            }
          }
        );

        expect(resolveResponse.status).toBe(200);
        temporalResults.push(resolveResponse.data);

        await delay(200);
      }

      // Verify TEMPORAL token resolution
      const lastResult = temporalResults[temporalResults.length - 1];
      expect(lastResult.processedText).toContain('2024-12-08T14:30:00Z');
      expect(lastResult.processedText).toContain('2024-12-08T16:45:00Z');
      expect(lastResult.processedText).toContain('2024-12-09T02:00:00Z');

      // Verify no caching
      temporalResults.forEach(result => {
        expect(result.analytics.cachePolicy).toBe(CachePolicy.NO_CACHE);
        expect(result.analytics.cacheDuration).toBe(0);
        expect(result.analytics.cacheHitRate).toBe(0); // No cache hits
      });

      // Verify real-time resolution
      const resolutionTimes = temporalResults.map(r => r.analytics.resolutionTime);
      const avgResolutionTime = resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length;

      expect(avgResolutionTime).toBeGreaterThan(10); // Should take time to resolve (no cache)
      expect(avgResolutionTime).toBeLessThan(1000); // But still reasonable

      // Verify expiry handling
      expect(temporalResults.some(r => r.analytics.expiryHandled)).toBe(true);

      console.log(`✅ TEMPORAL tokens resolved with no caching, avg resolution time: ${avgResolutionTime.toFixed(0)}ms`);
    });
  });

  describe('Performance Validation - 67% Token Reduction', () => {
    it('should achieve claimed 67% token reduction through intelligent caching and deduplication', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      // Create comprehensive test scenario with mixed token types
      const comprehensiveTestText = `
        Current workflow status includes: ${testTokens.context[0].token} working on ${testTokens.data[0].token}.
        System metrics show ${testTokens.metrics[0].token} tokens used with ${testTokens.metrics[1].token} average response time.
        Current state: ${testTokens.state[0].token} with ${testTokens.state[1].token} iterations completed.
        Data specifications: ${testTokens.data[1].token} and ${testTokens.data[2].token}.
        Next scheduled events: ${testTokens.temporal[0].token} and ${testTokens.temporal[1].token}.
        Performance tracking: ${testTokens.metrics[2].token} success rate maintained.
        System health: ${testTokens.state[2].token} across all components.
        Maintenance: ${testTokens.temporal[2].token} scheduled for updates.
        Additional context: ${testTokens.context[1].token} and ${testTokens.context[2].token}.
      `;

      // Measure baseline without VORTEX optimization
      const baselineResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/process-baseline`,
        {
          text: comprehensiveTestText,
          enableOptimization: false
        }
      );

      expect(baselineResponse.status).toBe(200);
      const baseline = baselineResponse.data;

      // Measure with VORTEX optimization
      const optimizedResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`,
        {
          text: comprehensiveTestText,
          context: {
            agentId: 'performance-test-agent',
            enableAllOptimizations: true,
            timestamp: new Date()
          }
        }
      );

      expect(optimizedResponse.status).toBe(200);
      const optimized = optimizedResponse.data;

      // Calculate token reduction
      const tokenReduction = (baseline.tokenCount - optimized.analytics.tokensAfterOptimization) / baseline.tokenCount;

      expect(tokenReduction).toBeGreaterThanOrEqual(testConfig.performanceTargets.tokenReduction * 0.9); // Within 10% of target
      expect(optimized.analytics.deduplicationSavings).toBeGreaterThan(0);
      expect(optimized.analytics.cachingEfficiency).toBeGreaterThan(0.5);

      // Test sustained performance over multiple requests
      const sustainedResults: any[] = [];

      for (let i = 0; i < 20; i++) {
        const sustainedResponse = await axios.post(
          `${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`,
          {
            text: comprehensiveTestText,
            context: { iteration: i, agentId: 'sustained-test' }
          }
        );

        sustainedResults.push(sustainedResponse.data.analytics);
        await delay(100);
      }

      const avgTokenReduction = sustainedResults.reduce((sum, result) => 
        sum + result.tokenReductionRatio, 0) / sustainedResults.length;

      expect(avgTokenReduction).toBeGreaterThanOrEqual(testConfig.performanceTargets.tokenReduction * 0.85); // Sustained performance

      console.log(`✅ Token reduction validated:`);
      console.log(`   Single request: ${(tokenReduction * 100).toFixed(1)}%`);
      console.log(`   Sustained average: ${(avgTokenReduction * 100).toFixed(1)}%`);
      console.log(`   Target: ${(testConfig.performanceTargets.tokenReduction * 100).toFixed(1)}%`);
    });

    it('should demonstrate deduplication effectiveness across token patterns', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      // Create test with intentional duplication
      const duplicatedText = `
        Workflow status: ${testTokens.context[0].token}
        Current roles: ${testTokens.context[0].token}
        Agent assignments: ${testTokens.context[0].token}
        User requirements: ${testTokens.data[0].token}
        Requirements document: ${testTokens.data[0].token}
        System metrics: ${testTokens.metrics[0].token}
        Token usage: ${testTokens.metrics[0].token}
        Current state: ${testTokens.state[0].token}
        Plan status: ${testTokens.state[0].token}
      `;

      const deduplicationResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/process-with-deduplication`,
        {
          text: duplicatedText,
          enableDeduplication: true,
          context: { testType: 'deduplication' }
        }
      );

      expect(deduplicationResponse.status).toBe(200);
      const result = deduplicationResponse.data;

      // Should detect and handle duplicate tokens
      expect(result.analytics.duplicateTokensDetected).toBeGreaterThan(0);
      expect(result.analytics.deduplicationSavings).toBeGreaterThan(0.4); // At least 40% savings from deduplication
      
      // Verify unique resolutions cached once
      expect(result.analytics.uniqueResolutions).toBe(4); // 4 unique tokens despite 9 total

      // Test semantic deduplication
      const semanticText = `
        Current workflow agent roles: ${testTokens.context[0].token}
        Present system agent assignments: ${testTokens.context[0].token}
        Active workflow participant roles: ${testTokens.context[0].token}
      `;

      const semanticResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/process-semantic-dedup`,
        {
          text: semanticText,
          enableSemanticDeduplication: true,
          similarityThreshold: 0.8
        }
      );

      expect(semanticResponse.status).toBe(200);
      const semanticResult = semanticResponse.data;

      expect(semanticResult.analytics.semanticMatches).toBeGreaterThan(0);
      expect(semanticResult.analytics.semanticDeduplicationSavings).toBeGreaterThan(0.2);

      console.log(`✅ Deduplication effectiveness:`);
      console.log(`   Exact duplication savings: ${(result.analytics.deduplicationSavings * 100).toFixed(1)}%`);
      console.log(`   Semantic deduplication savings: ${(semanticResult.analytics.semanticDeduplicationSavings * 100).toFixed(1)}%`);
    });

    it('should optimize token patterns through vector similarity matching', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      // Populate vector database with similar token patterns
      await axios.post(`${testConfig.baseUrl}/vortex/${vortexEngine}/populate-token-vectors`, {
        tokenPatterns: [
          { pattern: '{CONTEXT:workflow:*:*}', embedding: 'workflow context pattern' },
          { pattern: '{DATA:artifact:*:*}', embedding: 'data artifact pattern' },
          { pattern: '{METRICS:performance:*:*}', embedding: 'performance metrics pattern' },
          { pattern: '{STATE:agent:*:*}', embedding: 'agent state pattern' }
        ]
      });

      await delay(2000); // Allow vector indexing

      const similarityText = `
        Check workflow configuration: {CONTEXT:workflow:config:agent-setup}
        Review data artifacts: {DATA:artifact:v2:user-stories}
        Monitor performance metrics: {METRICS:performance:system:throughput}
        Validate agent state: {STATE:agent:worker:task-queue}
      `;

      const vectorOptimizationResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/process-with-vector-optimization`,
        {
          text: similarityText,
          enableVectorSimilarity: true,
          similarityThreshold: 0.7,
          maxSimilarTokens: 5
        }
      );

      expect(vectorOptimizationResponse.status).toBe(200);
      const vectorResult = vectorOptimizationResponse.data;

      expect(vectorResult.analytics.vectorMatches).toBeGreaterThan(0);
      expect(vectorResult.analytics.similarityOptimization).toBeGreaterThan(0);
      expect(vectorResult.analytics.vectorSearchTime).toBeLessThan(500); // Fast vector search

      // Verify pattern-based optimization
      expect(vectorResult.analytics.patternOptimizations).toBeDefined();
      expect(vectorResult.analytics.tokenReductionFromSimilarity).toBeGreaterThan(0);

      console.log(`✅ Vector similarity optimization:`);
      console.log(`   Similarity matches: ${vectorResult.analytics.vectorMatches}`);
      console.log(`   Token reduction from similarity: ${(vectorResult.analytics.tokenReductionFromSimilarity * 100).toFixed(1)}%`);
      console.log(`   Vector search time: ${vectorResult.analytics.vectorSearchTime}ms`);
    });
  });

  describe('Performance Validation - 45% Latency Improvement', () => {
    it('should achieve claimed 45% latency improvement via JIT resolution', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      const latencyTestText = `
        Processing workflow with ${testTokens.context[0].token} and ${testTokens.data[0].token}.
        Current metrics: ${testTokens.metrics[0].token} and ${testTokens.metrics[1].token}.
        System state: ${testTokens.state[0].token} with ${testTokens.state[1].token} iterations.
        Scheduled events: ${testTokens.temporal[0].token} and ${testTokens.temporal[1].token}.
      `;

      // Measure baseline latency without optimizations
      const baselineLatencyResults: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        await axios.post(`${testConfig.baseUrl}/vortex/${vortexEngine}/process-baseline`, {
          text: latencyTestText,
          enableOptimization: false,
          iteration: i
        });

        const latency = performance.now() - startTime;
        baselineLatencyResults.push(latency);
        
        await delay(100);
      }

      const avgBaselineLatency = baselineLatencyResults.reduce((sum, lat) => sum + lat, 0) / baselineLatencyResults.length;

      // Measure optimized latency with VORTEX
      const optimizedLatencyResults: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        await axios.post(`${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`, {
          text: latencyTestText,
          context: { latencyTest: true, iteration: i }
        });

        const latency = performance.now() - startTime;
        optimizedLatencyResults.push(latency);
        
        await delay(100);
      }

      const avgOptimizedLatency = optimizedLatencyResults.reduce((sum, lat) => sum + lat, 0) / optimizedLatencyResults.length;

      // Calculate latency improvement
      const latencyImprovement = (avgBaselineLatency - avgOptimizedLatency) / avgBaselineLatency;

      expect(latencyImprovement).toBeGreaterThanOrEqual(testConfig.performanceTargets.latencyImprovement * 0.8); // Within 20% of target
      
      // Test concurrent resolution performance
      const concurrentStartTime = performance.now();
      
      const concurrentPromises = Array.from({ length: 20 }, (_, i) =>
        axios.post(`${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`, {
          text: latencyTestText,
          context: { concurrentTest: true, requestId: i }
        })
      );

      const concurrentResults = await Promise.all(concurrentPromises);
      const concurrentTime = performance.now() - concurrentStartTime;

      // Concurrent processing should be efficient
      expect(concurrentTime).toBeLessThan(avgOptimizedLatency * 5); // Should handle concurrency well
      expect(concurrentResults.every(r => r.status === 200)).toBe(true);

      console.log(`✅ Latency improvement validated:`);
      console.log(`   Baseline average: ${avgBaselineLatency.toFixed(0)}ms`);
      console.log(`   Optimized average: ${avgOptimizedLatency.toFixed(0)}ms`);
      console.log(`   Improvement: ${(latencyImprovement * 100).toFixed(1)}%`);
      console.log(`   Target: ${(testConfig.performanceTargets.latencyImprovement * 100).toFixed(1)}%`);
      console.log(`   Concurrent 20 requests: ${concurrentTime.toFixed(0)}ms total`);
    });

    it('should demonstrate JIT resolution with dependency management', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      // Create token with dependencies
      const dependentText = `
        Check user access for ${testTokens.context[0].token} based on ${testTokens.context[1].token}.
      `;

      // Test dependency resolution order and timing
      const dependencyResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/process-with-dependencies`,
        {
          text: dependentText,
          trackDependencies: true,
          enableJIT: true
        }
      );

      expect(dependencyResponse.status).toBe(200);
      const depResult = dependencyResponse.data;

      expect(depResult.analytics.dependenciesResolved).toBeGreaterThan(0);
      expect(depResult.analytics.resolutionOrder).toBeDefined();
      expect(depResult.analytics.jitOptimization).toBe(true);

      // Verify lazy resolution - dependencies only resolved when needed
      expect(depResult.analytics.lazyResolutionSavings).toBeGreaterThan(0);

      // Test resolution caching for dependent tokens
      const cachedDependencyResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/process-with-dependencies`,
        {
          text: dependentText,
          trackDependencies: true,
          enableJIT: true,
          iteration: 2
        }
      );

      expect(cachedDependencyResponse.data.analytics.dependencyCacheHit).toBeGreaterThan(0.5);

      console.log(`✅ JIT dependency resolution optimized with ${(depResult.analytics.lazyResolutionSavings * 100).toFixed(1)}% lazy loading savings`);
    });
  });

  describe('Adaptive Caching Performance - 85%+ Cache Hit Rate', () => {
    it('should achieve 85%+ cache hit rate with adaptive duration policies', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      const cacheTestText = `
        System overview: ${testTokens.context[0].token}, ${testTokens.data[0].token}, ${testTokens.state[0].token}.
        Performance data: ${testTokens.metrics[0].token}, ${testTokens.metrics[1].token}.
        Temporal info: ${testTokens.temporal[0].token}.
      `;

      const cacheResults: any[] = [];

      // Execute multiple requests to build up cache
      for (let i = 0; i < 50; i++) {
        const cacheResponse = await axios.post(
          `${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`,
          {
            text: cacheTestText,
            context: { cacheTest: true, iteration: i }
          }
        );

        expect(cacheResponse.status).toBe(200);
        cacheResults.push(cacheResponse.data.analytics);

        // Vary request timing to test adaptive policies
        await delay(i % 3 === 0 ? 500 : 100);
      }

      // Analyze cache performance
      const cacheHitRates = cacheResults.map(r => r.cacheHitRate);
      const avgCacheHitRate = cacheHitRates.reduce((sum, rate) => sum + rate, 0) / cacheHitRates.length;

      expect(avgCacheHitRate).toBeGreaterThanOrEqual(testConfig.performanceTargets.cacheHitRate);

      // Verify adaptive duration working
      const adaptiveBehavior = cacheResults.some(r => r.adaptiveDurationApplied);
      expect(adaptiveBehavior).toBe(true);

      // Test cache eviction and cleanup
      const cleanupResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/trigger-cache-cleanup`
      );

      expect(cleanupResponse.status).toBe(200);
      expect(cleanupResponse.data.itemsEvicted).toBeGreaterThan(0);

      console.log(`✅ Adaptive caching performance:`);
      console.log(`   Average cache hit rate: ${(avgCacheHitRate * 100).toFixed(1)}%`);
      console.log(`   Target: ${(testConfig.performanceTargets.cacheHitRate * 100).toFixed(1)}%`);
      console.log(`   Cache cleanup evicted: ${cleanupResponse.data.itemsEvicted} items`);
    });

    it('should demonstrate variable duration caching (0-600s) based on token type and usage', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      // Test each token type's cache duration
      const tokenTypeTests = [
        { tokens: testTokens.temporal, expectedDuration: testConfig.cacheSettings.noCache },
        { tokens: testTokens.state, expectedDuration: testConfig.cacheSettings.shortTerm },
        { tokens: testTokens.metrics, expectedDuration: testConfig.cacheSettings.shortTerm },
        { tokens: testTokens.context, expectedDuration: testConfig.cacheSettings.mediumTerm },
        { tokens: testTokens.data, expectedDuration: testConfig.cacheSettings.longTerm }
      ];

      const durationResults: any[] = [];

      for (const test of tokenTypeTests) {
        for (const token of test.tokens) {
          const durationResponse = await axios.post(
            `${testConfig.baseUrl}/vortex/${vortexEngine}/analyze-cache-duration`,
            {
              text: token.token,
              context: { durationTest: true }
            }
          );

          expect(durationResponse.status).toBe(200);
          const result = durationResponse.data;

          durationResults.push({
            tokenType: token.token.split(':')[1],
            appliedDuration: result.cacheDuration,
            expectedRange: test.expectedDuration,
            adaptiveMultiplier: result.adaptiveMultiplier
          });
        }
      }

      // Verify duration ranges by token type
      const temporalDurations = durationResults.filter(r => r.tokenType === 'TEMPORAL');
      const stateDurations = durationResults.filter(r => r.tokenType === 'STATE');
      const contextDurations = durationResults.filter(r => r.tokenType === 'CONTEXT');
      const dataDurations = durationResults.filter(r => r.tokenType === 'DATA');

      // TEMPORAL should have no caching
      temporalDurations.forEach(d => expect(d.appliedDuration).toBe(0));

      // STATE should be short-term
      stateDurations.forEach(d => expect(d.appliedDuration).toBeLessThanOrEqual(60000));

      // CONTEXT should be medium-term
      contextDurations.forEach(d => {
        expect(d.appliedDuration).toBeGreaterThanOrEqual(60000);
        expect(d.appliedDuration).toBeLessThanOrEqual(300000);
      });

      // DATA should be long-term
      dataDurations.forEach(d => {
        expect(d.appliedDuration).toBeGreaterThanOrEqual(300000);
        expect(d.appliedDuration).toBeLessThanOrEqual(600000);
      });

      console.log(`✅ Variable duration caching validated across all token types`);
    });
  });

  describe('Error Handling and Circuit Breakers - 95%+ Recovery Rate', () => {
    it('should achieve 95%+ error recovery rate through comprehensive fallback mechanisms', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      const errorTestScenarios = [
        { type: 'resolver-timeout', duration: 6000, expectedRecovery: true },
        { type: 'cache-failure', severity: 'moderate', expectedRecovery: true },
        { type: 'vector-search-error', fallbackEnabled: true, expectedRecovery: true },
        { type: 'dependency-resolution-failure', chainDepth: 3, expectedRecovery: true },
        { type: 'circuit-breaker-trigger', failureCount: 5, expectedRecovery: true }
      ];

      const errorResults: any[] = [];

      for (const scenario of errorTestScenarios) {
        // Simulate error scenario
        const errorSimResponse = await axios.post(
          `${testConfig.baseUrl}/vortex/${vortexEngine}/simulate-error`,
          {
            errorType: scenario.type,
            ...scenario,
            testText: `Error test: ${testTokens.context[0].token} and ${testTokens.data[0].token}`
          }
        );

        expect(errorSimResponse.status).toBe(200);
        const errorResult = errorSimResponse.data;

        expect(errorResult.errorSimulated).toBe(true);
        expect(errorResult.recoveryAttempted).toBe(true);
        expect(errorResult.recoverySuccessful).toBe(scenario.expectedRecovery);

        errorResults.push({
          scenario: scenario.type,
          recovered: errorResult.recoverySuccessful,
          fallbackUsed: errorResult.fallbackUsed,
          recoveryTime: errorResult.recoveryTime
        });

        await delay(1000); // Allow system recovery
      }

      // Calculate recovery rate
      const successfulRecoveries = errorResults.filter(r => r.recovered).length;
      const recoveryRate = successfulRecoveries / errorResults.length;

      expect(recoveryRate).toBeGreaterThanOrEqual(testConfig.performanceTargets.errorRecoveryRate);

      // Verify fallback mechanisms used
      const fallbackUsage = errorResults.filter(r => r.fallbackUsed).length;
      expect(fallbackUsage).toBeGreaterThan(0);

      console.log(`✅ Error recovery performance:`);
      console.log(`   Recovery rate: ${(recoveryRate * 100).toFixed(1)}%`);
      console.log(`   Target: ${(testConfig.performanceTargets.errorRecoveryRate * 100).toFixed(1)}%`);
      console.log(`   Fallback usage: ${fallbackUsage}/${errorResults.length} scenarios`);
    });

    it('should demonstrate circuit breaker functionality with gradual recovery', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      // Trigger circuit breaker by causing multiple failures
      const failurePromises = Array.from({ length: 5 }, (_, i) =>
        axios.post(`${testConfig.baseUrl}/vortex/${vortexEngine}/cause-failure`, {
          failureType: 'resolver-error',
          iteration: i + 1
        })
      );

      await Promise.all(failurePromises);

      // Verify circuit breaker is open
      const circuitStatusResponse = await axios.get(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/circuit-breaker-status`
      );

      expect(circuitStatusResponse.status).toBe(200);
      const circuitStatus = circuitStatusResponse.data;

      expect(circuitStatus.state).toBe('open');
      expect(circuitStatus.failureCount).toBeGreaterThanOrEqual(5);

      // Test requests during circuit breaker open state
      const openStateResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`,
        {
          text: testTokens.context[0].token,
          context: { circuitBreakerTest: true }
        }
      );

      expect(openStateResponse.status).toBe(200); // Should still work with fallbacks
      expect(openStateResponse.data.circuitBreakerActive).toBe(true);
      expect(openStateResponse.data.fallbackUsed).toBe(true);

      // Wait for half-open transition
      await delay(10000); // Circuit breaker timeout

      const halfOpenResponse = await axios.get(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/circuit-breaker-status`
      );

      expect(halfOpenResponse.data.state).toBe('half-open');

      // Test successful request to close circuit breaker
      const recoveryResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`,
        {
          text: testTokens.context[0].token,
          context: { recoveryTest: true }
        }
      );

      expect(recoveryResponse.status).toBe(200);
      expect(recoveryResponse.data.circuitBreakerActive).toBe(false);

      // Verify circuit breaker closed
      await delay(1000);

      const closedStatusResponse = await axios.get(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/circuit-breaker-status`
      );

      expect(closedStatusResponse.data.state).toBe('closed');

      console.log(`✅ Circuit breaker functionality validated with gradual recovery`);
    });

    it('should provide graceful degradation with stale cache acceptance during failures', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      // First, populate cache with fresh data
      const cachePopulationResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`,
        {
          text: `${testTokens.data[0].token} and ${testTokens.context[0].token}`,
          context: { cachePopulation: true }
        }
      );

      expect(cachePopulationResponse.status).toBe(200);

      // Wait for cache to become stale
      await delay(5000);

      // Simulate resolver failures
      await axios.post(`${testConfig.baseUrl}/vortex/${vortexEngine}/disable-resolvers`, {
        resolverTypes: ['DATA', 'CONTEXT'],
        duration: 10000
      });

      // Request should succeed with stale cache data
      const staleResponse = await axios.post(
        `${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`,
        {
          text: `${testTokens.data[0].token} and ${testTokens.context[0].token}`,
          context: { staleCacheTest: true, acceptStale: true }
        }
      );

      expect(staleResponse.status).toBe(200);
      expect(staleResponse.data.staleCacheUsed).toBe(true);
      expect(staleResponse.data.gracefulDegradation).toBe(true);

      // Verify stale data indicators
      expect(staleResponse.data.cacheAge).toBeGreaterThan(5000);
      expect(staleResponse.data.dataFreshness).toBe('stale');

      // Re-enable resolvers
      await axios.post(`${testConfig.baseUrl}/vortex/${vortexEngine}/enable-resolvers`);

      console.log(`✅ Graceful degradation with stale cache acceptance validated`);
    });
  });

  describe('End-to-End VORTEX System Validation', () => {
    it('should demonstrate comprehensive VORTEX performance under realistic workload', async () => {
      if (!serviceAvailable || !vortexEngine) return;

      const comprehensiveWorkload = {
        duration: 120000, // 2 minutes
        requestRate: 15,  // 15 requests per second
        tokenMix: {
          context: 0.3,   // 30% CONTEXT tokens
          data: 0.25,     // 25% DATA tokens  
          state: 0.2,     // 20% STATE tokens
          metrics: 0.15,  // 15% METRICS tokens
          temporal: 0.1   // 10% TEMPORAL tokens
        }
      };

      const workloadResults: VortexPerformanceAnalytics[] = [];
      const startTime = Date.now();
      let requestCount = 0;

      console.log(`🚀 Starting comprehensive VORTEX workload test...`);

      const workloadInterval = setInterval(async () => {
        if (Date.now() - startTime >= comprehensiveWorkload.duration) {
          clearInterval(workloadInterval);
          return;
        }

        // Select token type based on mix
        const rand = Math.random();
        let tokenCategory: keyof typeof testTokens;
        
        if (rand < comprehensiveWorkload.tokenMix.context) tokenCategory = 'context';
        else if (rand < comprehensiveWorkload.tokenMix.context + comprehensiveWorkload.tokenMix.data) tokenCategory = 'data';
        else if (rand < comprehensiveWorkload.tokenMix.context + comprehensiveWorkload.tokenMix.data + comprehensiveWorkload.tokenMix.state) tokenCategory = 'state';
        else if (rand < comprehensiveWorkload.tokenMix.context + comprehensiveWorkload.tokenMix.data + comprehensiveWorkload.tokenMix.state + comprehensiveWorkload.tokenMix.metrics) tokenCategory = 'metrics';
        else tokenCategory = 'temporal';

        const selectedTokens = testTokens[tokenCategory];
        const randomToken = selectedTokens[Math.floor(Math.random() * selectedTokens.length)];

        try {
          const reqStartTime = performance.now();
          
          const response = await axios.post(
            `${testConfig.baseUrl}/vortex/${vortexEngine}/process-text`,
            {
              text: `Workload request processing: ${randomToken.token}`,
              context: {
                workloadTest: true,
                requestId: requestCount++,
                tokenCategory,
                timestamp: new Date()
              }
            }
          );

          const responseTime = performance.now() - reqStartTime;

          if (response.status === 200) {
            const analytics = response.data.analytics;
            
            workloadResults.push({
              tokensSaved: analytics.tokensSaved || 0,
              tokensProcessed: analytics.tokensProcessed || 1,
              tokenReductionRatio: analytics.tokenReductionRatio || 0,
              cacheHitRate: analytics.cacheHitRate || 0,
              averageResponseTime: responseTime,
              baselineResponseTime: analytics.baselineResponseTime || responseTime * 1.5,
              latencyImprovement: analytics.latencyImprovement || 0,
              errorRate: analytics.errorRate || 0,
              fallbackUsageRate: analytics.fallbackUsageRate || 0,
              vectorSearchMatches: analytics.vectorSearchMatches || 0,
              deduplicationSavings: analytics.deduplicationSavings || 0
            });
          }
        } catch (error) {
          console.warn(`Workload request failed: ${error}`);
        }
      }, 1000 / comprehensiveWorkload.requestRate);

      // Wait for workload completion
      await new Promise(resolve => {
        const checkCompletion = setInterval(() => {
          if (Date.now() - startTime >= comprehensiveWorkload.duration) {
            clearInterval(checkCompletion);
            resolve(undefined);
          }
        }, 5000);
      });

      console.log(`✅ Workload test completed, analyzing results...`);

      // Analyze comprehensive performance
      expect(workloadResults.length).toBeGreaterThan(1000); // Should have processed significant requests

      const aggregateMetrics = workloadResults.reduce((acc, result) => ({
        totalTokensSaved: acc.totalTokensSaved + result.tokensSaved,
        totalTokensProcessed: acc.totalTokensProcessed + result.tokensProcessed,
        avgTokenReduction: acc.avgTokenReduction + result.tokenReductionRatio,
        avgCacheHitRate: acc.avgCacheHitRate + result.cacheHitRate,
        avgResponseTime: acc.avgResponseTime + result.averageResponseTime,
        avgLatencyImprovement: acc.avgLatencyImprovement + result.latencyImprovement,
        totalVectorMatches: acc.totalVectorMatches + result.vectorSearchMatches,
        avgDeduplicationSavings: acc.avgDeduplicationSavings + result.deduplicationSavings
      }), {
        totalTokensSaved: 0,
        totalTokensProcessed: 0,
        avgTokenReduction: 0,
        avgCacheHitRate: 0,
        avgResponseTime: 0,
        avgLatencyImprovement: 0,
        totalVectorMatches: 0,
        avgDeduplicationSavings: 0
      });

      const resultCount = workloadResults.length;
      const finalMetrics = {
        tokenReductionRatio: aggregateMetrics.totalTokensSaved / aggregateMetrics.totalTokensProcessed,
        avgCacheHitRate: aggregateMetrics.avgCacheHitRate / resultCount,
        avgResponseTime: aggregateMetrics.avgResponseTime / resultCount,
        avgLatencyImprovement: aggregateMetrics.avgLatencyImprovement / resultCount,
        vectorSearchEffectiveness: aggregateMetrics.totalVectorMatches / resultCount,
        deduplicationEffectiveness: aggregateMetrics.avgDeduplicationSavings / resultCount
      };

      // Validate against targets
      expect(finalMetrics.tokenReductionRatio).toBeGreaterThanOrEqual(testConfig.performanceTargets.tokenReduction * 0.85);
      expect(finalMetrics.avgCacheHitRate).toBeGreaterThanOrEqual(testConfig.performanceTargets.cacheHitRate * 0.9);
      expect(finalMetrics.avgLatencyImprovement).toBeGreaterThanOrEqual(testConfig.performanceTargets.latencyImprovement * 0.8);

      console.log(`✅ Comprehensive VORTEX system validation completed:`);
      console.log(`   Requests processed: ${workloadResults.length}`);
      console.log(`   Token reduction: ${(finalMetrics.tokenReductionRatio * 100).toFixed(1)}% (target: 67%)`);
      console.log(`   Cache hit rate: ${(finalMetrics.avgCacheHitRate * 100).toFixed(1)}% (target: 85%)`);
      console.log(`   Average response time: ${finalMetrics.avgResponseTime.toFixed(0)}ms`);
      console.log(`   Latency improvement: ${(finalMetrics.avgLatencyImprovement * 100).toFixed(1)}% (target: 45%)`);
      console.log(`   Vector search matches: ${finalMetrics.vectorSearchEffectiveness.toFixed(1)} per request`);
      console.log(`   Deduplication effectiveness: ${(finalMetrics.deduplicationEffectiveness * 100).toFixed(1)}%`);
    });
  });
});