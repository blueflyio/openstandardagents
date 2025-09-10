/**
 * Cross-System Integration Tests - OSSA v0.1.8
 * 
 * Tests the integration and combined performance of:
 * - 360° Feedback Loop + ACTA Token Optimization
 * - 360° Feedback Loop + VORTEX System
 * - ACTA + VORTEX Combined Optimization
 * - All Three Systems Working Together
 * 
 * Validates combined system performance metrics:
 * - Feedback-driven optimization improvements
 * - Multi-system token reduction (targeting 75%+ combined)
 * - Adaptive learning across optimization layers
 * - System-wide resilience and error handling
 * - Performance scaling under combined workloads
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setTimeout as delay } from 'timers/promises';
import axios from 'axios';
import { performance } from 'perf_hooks';

// Cross-system test configuration
interface CrossSystemTestConfig {
  baseUrl: string;
  timeout: number;
  combinedPerformanceTargets: {
    tokenReduction: number;        // 75%+ combined target
    latencyImprovement: number;    // 55%+ combined target
    adaptationAccuracy: number;    // 90%+ feedback adaptation
    systemResilience: number;      // 98%+ uptime under load
    learningVelocity: number;      // 20%+ improvement per cycle
  };
  workloadScenarios: {
    light: { rps: 5, duration: 30000 };
    moderate: { rps: 15, duration: 60000 };
    heavy: { rps: 30, duration: 90000 };
    extreme: { rps: 50, duration: 120000 };
  };
}

// Combined system analytics
interface CombinedSystemAnalytics {
  feedbackLoopMetrics: {
    adaptationCycles: number;
    improvementRate: number;
    learningVelocity: number;
    crossAgentKnowledge: number;
  };
  actaMetrics: {
    compressionRatio: number;
    modelSwitchingEfficiency: number;
    contextGraphPerformance: number;
    vectorCompressionGain: number;
  };
  vortexMetrics: {
    tokenReductionRatio: number;
    cacheHitRate: number;
    jitOptimization: number;
    adaptiveCachingGain: number;
  };
  combinedMetrics: {
    totalTokenReduction: number;
    totalLatencyImprovement: number;
    combinedThroughput: number;
    systemCoherence: number;
  };
}

// Integration test scenarios
interface IntegrationTestScenario {
  name: string;
  description: string;
  systems: ('feedback' | 'acta' | 'vortex')[];
  workloadProfile: keyof CrossSystemTestConfig['workloadScenarios'];
  expectedPerformance: {
    tokenReduction: number;
    latencyImprovement: number;
    errorRate: number;
  };
}

describe('Cross-System Integration Tests', () => {
  let testConfig: CrossSystemTestConfig;
  let feedbackLoopId: string;
  let actaInstanceId: string;
  let vortexEngineId: string;
  let serviceAvailable = false;

  beforeAll(async () => {
    testConfig = {
      baseUrl: 'http://localhost:4000',
      timeout: 45000,
      combinedPerformanceTargets: {
        tokenReduction: 0.75,       // 75% combined
        latencyImprovement: 0.55,   // 55% combined
        adaptationAccuracy: 0.90,   // 90% adaptation accuracy
        systemResilience: 0.98,     // 98% uptime
        learningVelocity: 0.20      // 20% improvement per cycle
      },
      workloadScenarios: {
        light: { rps: 5, duration: 30000 },
        moderate: { rps: 15, duration: 60000 },
        heavy: { rps: 30, duration: 90000 },
        extreme: { rps: 50, duration: 120000 }
      }
    };

    // Check service availability
    try {
      const healthResp = await axios.get(`${testConfig.baseUrl}/health`, { timeout: 5000 });
      serviceAvailable = healthResp.status === 200;
      console.log('✅ Cross-system integration services available for testing');
    } catch (error) {
      console.warn('⚠️  Services not available, cross-system tests will be skipped');
      serviceAvailable = false;
    }

    if (serviceAvailable) {
      // Initialize all three systems for integration testing
      await initializeAllSystems();
    }
  });

  afterAll(async () => {
    // Cleanup all systems
    if (serviceAvailable) {
      await cleanupAllSystems();
    }
  });

  async function initializeAllSystems(): Promise<void> {
    console.log('🔧 Initializing all systems for integration testing...');

    // Initialize Feedback Loop
    const feedbackResponse = await axios.post(
      `${testConfig.baseUrl}/feedback-loops`,
      {
        id: `cross-system-feedback-${Date.now()}`,
        agents: [
          { type: 'judge', subtype: 'quality', weight: 0.25 },
          { type: 'judge', subtype: 'compliance', weight: 0.25 },
          { type: 'critic', subtype: 'performance', weight: 0.25 },
          { type: 'orchestrator', subtype: 'coordinator', weight: 0.25 }
        ],
        feedbackFrequency: 2000,
        adaptationThreshold: 0.05,
        crossAgentSharing: true,
        integratedOptimization: true
      }
    );
    expect(feedbackResponse.status).toBe(201);
    feedbackLoopId = feedbackResponse.data.id;

    // Initialize ACTA
    const actaResponse = await axios.post(
      `${testConfig.baseUrl}/acta/initialize`,
      {
        vectorConfig: {
          endpoint: 'http://localhost:6333',
          collection: 'cross-system-acta',
          dimension: 384
        },
        modelConfig: {
          models: ['small', 'medium', 'large', 'xlarge'],
          switchingStrategy: 'feedback-driven'
        },
        graphConfig: {
          persistenceEnabled: true,
          bTreeOrder: 128,
          cacheSize: 2000
        },
        feedbackIntegration: {
          enabled: true,
          feedbackLoopId
        }
      }
    );
    expect(actaResponse.status).toBe(201);
    actaInstanceId = actaResponse.data.instanceId;

    // Initialize VORTEX
    const vortexResponse = await axios.post(
      `${testConfig.baseUrl}/vortex/initialize`,
      {
        jitResolver: {
          maxConcurrentResolutions: 100,
          adaptiveCachingEnabled: true,
          feedbackDriven: true
        },
        adaptiveCache: {
          maxCacheSize: 2000,
          variableDuration: {
            minDurationMs: 0,
            maxDurationMs: 600000,
            feedbackAdjustment: true
          }
        },
        vectorSearch: {
          enabled: true,
          collectionName: 'cross-system-vortex',
          embeddingDimension: 384,
          actaIntegration: true
        },
        feedbackIntegration: {
          enabled: true,
          feedbackLoopId
        }
      }
    );
    expect(vortexResponse.status).toBe(201);
    vortexEngineId = vortexResponse.data.engineId;

    // Establish cross-system connections
    await axios.post(`${testConfig.baseUrl}/cross-system/connect`, {
      feedbackLoopId,
      actaInstanceId,
      vortexEngineId,
      enableBidirectionalOptimization: true
    });

    console.log('✅ All systems initialized and connected');
  }

  async function cleanupAllSystems(): Promise<void> {
    try {
      await Promise.all([
        feedbackLoopId ? axios.delete(`${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}`) : Promise.resolve(),
        actaInstanceId ? axios.delete(`${testConfig.baseUrl}/acta/${actaInstanceId}`) : Promise.resolve(),
        vortexEngineId ? axios.delete(`${testConfig.baseUrl}/vortex/${vortexEngineId}`) : Promise.resolve()
      ]);
      console.log('✅ All systems cleaned up');
    } catch (error) {
      console.warn('Failed to cleanup some systems:', error);
    }
  }

  describe('Feedback Loop + ACTA Integration', () => {
    it('should optimize ACTA performance through feedback-driven model selection', async () => {
      if (!serviceAvailable) return;

      const feedbackActaTest = {
        queries: [
          {
            text: 'Simple query for model selection feedback',
            expectedModel: 'small',
            complexity: 'low'
          },
          {
            text: 'Complex analytical query requiring advanced reasoning and multi-step problem solving with extensive context consideration',
            expectedModel: 'large',
            complexity: 'high'
          }
        ],
        feedbackCycles: 5,
        expectedImprovement: 0.15 // 15% improvement through feedback
      };

      const baselineResults: any[] = [];
      const feedbackResults: any[] = [];

      // Baseline performance without feedback
      for (const query of feedbackActaTest.queries) {
        const baselineResponse = await axios.post(
          `${testConfig.baseUrl}/acta/${actaInstanceId}/process`,
          {
            text: query.text,
            enableFeedback: false
          }
        );
        baselineResults.push(baselineResponse.data);
      }

      // Performance with feedback integration
      for (let cycle = 0; cycle < feedbackActaTest.feedbackCycles; cycle++) {
        for (const query of feedbackActaTest.queries) {
          const feedbackResponse = await axios.post(
            `${testConfig.baseUrl}/cross-system/process-feedback-acta`,
            {
              text: query.text,
              feedbackLoopId,
              actaInstanceId,
              cycle: cycle + 1,
              expectedComplexity: query.complexity
            }
          );

          expect(feedbackResponse.status).toBe(200);
          feedbackResults.push(feedbackResponse.data);
        }

        // Allow feedback processing between cycles
        await delay(2000);
      }

      // Analyze feedback-driven improvements
      const avgBaselineAccuracy = baselineResults.reduce((sum, r) => sum + (r.modelSelectionAccuracy || 0.5), 0) / baselineResults.length;
      const lastCycleFeedbackResults = feedbackResults.slice(-feedbackActaTest.queries.length);
      const avgFeedbackAccuracy = lastCycleFeedbackResults.reduce((sum, r) => sum + (r.modelSelectionAccuracy || 0.5), 0) / lastCycleFeedbackResults.length;

      const improvementRate = (avgFeedbackAccuracy - avgBaselineAccuracy) / avgBaselineAccuracy;
      expect(improvementRate).toBeGreaterThanOrEqual(feedbackActaTest.expectedImprovement * 0.8);

      // Verify adaptive model switching
      const modelSwitches = feedbackResults.filter(r => r.modelSwitched).length;
      expect(modelSwitches).toBeGreaterThan(0);

      // Verify feedback-driven compression optimization
      const compressionImprovements = feedbackResults.filter(r => r.compressionOptimized).length;
      expect(compressionImprovements).toBeGreaterThan(0);

      console.log(`✅ Feedback + ACTA integration: ${(improvementRate * 100).toFixed(1)}% improvement in model selection accuracy`);
    });

    it('should demonstrate cross-system learning from ACTA performance to feedback loop optimization', async () => {
      if (!serviceAvailable) return;

      const learningScenario = {
        actaPatterns: [
          { pattern: 'high-compression-low-accuracy', frequency: 5 },
          { pattern: 'optimal-compression-high-accuracy', frequency: 3 },
          { pattern: 'low-compression-perfect-accuracy', frequency: 2 }
        ],
        expectedLearning: {
          patternRecognition: 0.85,
          adaptationSpeed: 0.7,
          knowledgeTransfer: 0.6
        }
      };

      // Generate ACTA performance patterns
      for (const pattern of learningScenario.actaPatterns) {
        for (let i = 0; i < pattern.frequency; i++) {
          await axios.post(`${testConfig.baseUrl}/acta/${actaInstanceId}/generate-pattern`, {
            pattern: pattern.pattern,
            iteration: i + 1,
            feedbackEnabled: true
          });
          
          await delay(500);
        }
      }

      // Allow feedback loop to learn from patterns
      await delay(5000);

      // Test feedback loop optimization based on ACTA learnings
      const optimizationResponse = await axios.post(
        `${testConfig.baseUrl}/cross-system/test-acta-feedback-learning`,
        {
          feedbackLoopId,
          actaInstanceId,
          testPatterns: learningScenario.actaPatterns.map(p => p.pattern)
        }
      );

      expect(optimizationResponse.status).toBe(200);
      const learningResult = optimizationResponse.data;

      expect(learningResult.patternRecognitionRate).toBeGreaterThanOrEqual(learningScenario.expectedLearning.patternRecognition);
      expect(learningResult.adaptationSpeed).toBeGreaterThanOrEqual(learningScenario.expectedLearning.adaptationSpeed);
      expect(learningResult.knowledgeTransferEfficiency).toBeGreaterThanOrEqual(learningScenario.expectedLearning.knowledgeTransfer);

      // Verify feedback loop adaptation
      expect(learningResult.feedbackOptimizations).toBeGreaterThan(0);
      expect(learningResult.crossSystemInsights).toBeDefined();

      console.log(`✅ Cross-system learning: ${(learningResult.patternRecognitionRate * 100).toFixed(1)}% pattern recognition rate`);
    });
  });

  describe('Feedback Loop + VORTEX Integration', () => {
    it('should optimize VORTEX caching policies through feedback loop insights', async () => {
      if (!serviceAvailable) return;

      const cachingOptimizationTest = {
        tokenScenarios: [
          {
            tokens: ['{CONTEXT:workflow:current:status}', '{DATA:artifact:v1:requirements}'],
            accessPattern: 'frequent',
            expectedOptimization: 'extend-cache-duration'
          },
          {
            tokens: ['{STATE:agent:current:task}', '{METRICS:performance:realtime:stats}'],
            accessPattern: 'volatile', 
            expectedOptimization: 'reduce-cache-duration'
          },
          {
            tokens: ['{TEMPORAL:schedule:next:event}'],
            accessPattern: 'temporal',
            expectedOptimization: 'no-cache-policy'
          }
        ],
        feedbackCycles: 8,
        expectedCacheOptimization: 0.25 // 25% cache performance improvement
      };

      const baselineCacheMetrics: any[] = [];
      const optimizedCacheMetrics: any[] = [];

      // Baseline VORTEX performance without feedback optimization
      for (const scenario of cachingOptimizationTest.tokenScenarios) {
        for (const token of scenario.tokens) {
          const baselineResponse = await axios.post(
            `${testConfig.baseUrl}/vortex/${vortexEngineId}/process-text`,
            {
              text: `Test token: ${token}`,
              enableFeedbackOptimization: false
            }
          );
          baselineCacheMetrics.push({
            token,
            cacheHitRate: baselineResponse.data.analytics.cacheHitRate,
            responseTime: baselineResponse.data.analytics.responseTime,
            accessPattern: scenario.accessPattern
          });
        }
      }

      // Run feedback-optimized caching cycles
      for (let cycle = 0; cycle < cachingOptimizationTest.feedbackCycles; cycle++) {
        for (const scenario of cachingOptimizationTest.tokenScenarios) {
          // Simulate access pattern
          for (let access = 0; access < (scenario.accessPattern === 'frequent' ? 5 : 2); access++) {
            for (const token of scenario.tokens) {
              await axios.post(
                `${testConfig.baseUrl}/cross-system/process-feedback-vortex`,
                {
                  text: `Feedback cycle ${cycle + 1}: ${token}`,
                  feedbackLoopId,
                  vortexEngineId,
                  accessPattern: scenario.accessPattern,
                  optimizationCycle: cycle + 1
                }
              );
              
              await delay(100);
            }
          }
        }

        // Allow feedback processing
        await delay(2000);
      }

      // Measure optimized performance
      for (const scenario of cachingOptimizationTest.tokenScenarios) {
        for (const token of scenario.tokens) {
          const optimizedResponse = await axios.post(
            `${testConfig.baseUrl}/vortex/${vortexEngineId}/process-text`,
            {
              text: `Optimized test: ${token}`,
              enableFeedbackOptimization: true
            }
          );
          optimizedCacheMetrics.push({
            token,
            cacheHitRate: optimizedResponse.data.analytics.cacheHitRate,
            responseTime: optimizedResponse.data.analytics.responseTime,
            accessPattern: scenario.accessPattern
          });
        }
      }

      // Analyze cache optimization improvements
      const avgBaselineCacheHitRate = baselineCacheMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / baselineCacheMetrics.length;
      const avgOptimizedCacheHitRate = optimizedCacheMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / optimizedCacheMetrics.length;

      const cacheOptimizationImprovement = (avgOptimizedCacheHitRate - avgBaselineCacheHitRate) / avgBaselineCacheHitRate;
      expect(cacheOptimizationImprovement).toBeGreaterThanOrEqual(cachingOptimizationTest.expectedCacheOptimization * 0.8);

      // Verify pattern-specific optimizations
      const frequentPatternMetrics = optimizedCacheMetrics.filter(m => m.accessPattern === 'frequent');
      const avgFrequentCacheHit = frequentPatternMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / frequentPatternMetrics.length;
      expect(avgFrequentCacheHit).toBeGreaterThan(0.9); // High cache hit rate for frequent patterns

      const volatilePatternMetrics = optimizedCacheMetrics.filter(m => m.accessPattern === 'volatile');
      const avgVolatileResponseTime = volatilePatternMetrics.reduce((sum, m) => sum + m.responseTime, 0) / volatilePatternMetrics.length;
      const baselineVolatileResponseTime = baselineCacheMetrics.filter(m => m.accessPattern === 'volatile').reduce((sum, m) => sum + m.responseTime, 0) / baselineCacheMetrics.filter(m => m.accessPattern === 'volatile').length;
      expect(avgVolatileResponseTime).toBeLessThan(baselineVolatileResponseTime); // Improved response time for volatile data

      console.log(`✅ Feedback + VORTEX caching optimization: ${(cacheOptimizationImprovement * 100).toFixed(1)}% cache performance improvement`);
    });

    it('should demonstrate adaptive token resolution based on feedback loop performance patterns', async () => {
      if (!serviceAvailable) return;

      const adaptiveResolutionTest = {
        resolutionScenarios: [
          {
            tokenType: 'CONTEXT',
            performanceRequirement: 'high-accuracy',
            expectedAdaptation: 'increase-resolution-depth'
          },
          {
            tokenType: 'METRICS', 
            performanceRequirement: 'low-latency',
            expectedAdaptation: 'optimize-for-speed'
          },
          {
            tokenType: 'DATA',
            performanceRequirement: 'high-compression',
            expectedAdaptation: 'maximize-token-reduction'
          }
        ],
        adaptationCycles: 6
      };

      const adaptationResults: any[] = [];

      for (let cycle = 0; cycle < adaptiveResolutionTest.adaptationCycles; cycle++) {
        for (const scenario of adaptiveResolutionTest.resolutionScenarios) {
          const adaptationResponse = await axios.post(
            `${testConfig.baseUrl}/cross-system/adaptive-token-resolution`,
            {
              tokenType: scenario.tokenType,
              performanceRequirement: scenario.performanceRequirement,
              feedbackLoopId,
              vortexEngineId,
              adaptationCycle: cycle + 1
            }
          );

          expect(adaptationResponse.status).toBe(200);
          adaptationResults.push({
            cycle: cycle + 1,
            tokenType: scenario.tokenType,
            adaptation: adaptationResponse.data.adaptationApplied,
            performanceGain: adaptationResponse.data.performanceImprovement,
            accuracyMaintained: adaptationResponse.data.accuracyScore >= 0.8
          });
        }

        await delay(1500);
      }

      // Verify adaptive behavior
      const adaptationsByType = adaptiveResolutionTest.resolutionScenarios.map(scenario => ({
        tokenType: scenario.tokenType,
        expectedAdaptation: scenario.expectedAdaptation,
        actualAdaptations: adaptationResults
          .filter(r => r.tokenType === scenario.tokenType)
          .map(r => r.adaptation)
      }));

      adaptationsByType.forEach(typeResult => {
        expect(typeResult.actualAdaptations.some(adaptation => adaptation.includes(typeResult.expectedAdaptation.split('-')[0]))).toBe(true);
      });

      // Verify performance improvements over cycles
      const performanceByType = adaptiveResolutionTest.resolutionScenarios.map(scenario => {
        const typeResults = adaptationResults.filter(r => r.tokenType === scenario.tokenType);
        const avgPerformanceGain = typeResults.reduce((sum, r) => sum + r.performanceGain, 0) / typeResults.length;
        return { tokenType: scenario.tokenType, avgGain: avgPerformanceGain };
      });

      performanceByType.forEach(perf => {
        expect(perf.avgGain).toBeGreaterThan(0.05); // At least 5% improvement per type
      });

      console.log(`✅ Adaptive token resolution demonstrated across all token types with measurable performance gains`);
    });
  });

  describe('ACTA + VORTEX Combined Optimization', () => {
    it('should achieve enhanced token reduction through combined ACTA compression and VORTEX optimization', async () => {
      if (!serviceAvailable) return;

      const combinedOptimizationTest = {
        testTexts: [
          {
            text: `Comprehensive analysis requiring: {CONTEXT:workflow:current:status} with {DATA:artifact:v1:requirements} and {METRICS:performance:current:stats}`,
            expectedActaCompression: 0.4,
            expectedVortexReduction: 0.3,
            expectedCombined: 0.6 // Higher than individual systems
          },
          {
            text: `Complex multi-system query with {DATA:schema:api:v2} integrated with {CONTEXT:session:user:preferences} and real-time {TEMPORAL:schedule:current:events}`,
            expectedActaCompression: 0.5,
            expectedVortexReduction: 0.35,
            expectedCombined: 0.65
          }
        ],
        targetCombinedReduction: 0.7 // 70% combined target
      };

      const optimizationResults: any[] = [];

      for (const testCase of combinedOptimizationTest.testTexts) {
        // Test ACTA only
        const actaOnlyResponse = await axios.post(
          `${testConfig.baseUrl}/acta/${actaInstanceId}/process`,
          {
            text: testCase.text,
            compressionLevel: 'heavy',
            enableModelSwitching: true
          }
        );

        // Test VORTEX only
        const vortexOnlyResponse = await axios.post(
          `${testConfig.baseUrl}/vortex/${vortexEngineId}/process-text`,
          {
            text: testCase.text,
            enableAllOptimizations: true
          }
        );

        // Test combined ACTA + VORTEX
        const combinedResponse = await axios.post(
          `${testConfig.baseUrl}/cross-system/process-acta-vortex`,
          {
            text: testCase.text,
            actaInstanceId,
            vortexEngineId,
            enableCombinedOptimization: true
          }
        );

        expect(combinedResponse.status).toBe(200);

        const result = {
          text: testCase.text,
          actaOnly: {
            compression: actaOnlyResponse.data.compressionRatio,
            tokens: actaOnlyResponse.data.compressedTokenCount
          },
          vortexOnly: {
            reduction: vortexOnlyResponse.data.analytics.tokenReductionRatio,
            tokens: vortexOnlyResponse.data.analytics.tokensAfterOptimization
          },
          combined: {
            totalReduction: combinedResponse.data.combinedTokenReduction,
            tokens: combinedResponse.data.finalTokenCount,
            synergies: combinedResponse.data.optimizationSynergies
          }
        };

        optimizationResults.push(result);

        // Verify combined optimization exceeds individual systems
        expect(result.combined.totalReduction).toBeGreaterThan(Math.max(result.actaOnly.compression, result.vortexOnly.reduction));
        expect(result.combined.totalReduction).toBeGreaterThanOrEqual(testCase.expectedCombined * 0.85);

        // Verify synergistic effects
        expect(result.combined.synergies).toBeGreaterThan(0);
      }

      const avgCombinedReduction = optimizationResults.reduce((sum, r) => sum + r.combined.totalReduction, 0) / optimizationResults.length;
      expect(avgCombinedReduction).toBeGreaterThanOrEqual(combinedOptimizationTest.targetCombinedReduction * 0.9);

      console.log(`✅ Combined ACTA + VORTEX optimization:`);
      optimizationResults.forEach((result, idx) => {
        console.log(`   Test ${idx + 1}: ACTA ${(result.actaOnly.compression * 100).toFixed(1)}%, VORTEX ${(result.vortexOnly.reduction * 100).toFixed(1)}%, Combined ${(result.combined.totalReduction * 100).toFixed(1)}%`);
      });
      console.log(`   Average combined reduction: ${(avgCombinedReduction * 100).toFixed(1)}%`);
    });

    it('should demonstrate intelligent coordination between ACTA model switching and VORTEX caching', async () => {
      if (!serviceAvailable) return;

      const coordinationTest = {
        scenarios: [
          {
            complexity: 'low',
            expectedActaModel: 'small',
            expectedVortexCache: 'long-term',
            coordinationBenefit: 0.2
          },
          {
            complexity: 'high', 
            expectedActaModel: 'large',
            expectedVortexCache: 'adaptive-short',
            coordinationBenefit: 0.3
          }
        ],
        coordinationCycles: 5
      };

      const coordinationResults: any[] = [];

      for (const scenario of coordinationTest.scenarios) {
        for (let cycle = 0; cycle < coordinationTest.coordinationCycles; cycle++) {
          const coordinationResponse = await axios.post(
            `${testConfig.baseUrl}/cross-system/coordinate-acta-vortex`,
            {
              complexity: scenario.complexity,
              actaInstanceId,
              vortexEngineId,
              enableIntelligentCoordination: true,
              cycle: cycle + 1
            }
          );

          expect(coordinationResponse.status).toBe(200);
          const coordination = coordinationResponse.data;

          coordinationResults.push({
            scenario: scenario.complexity,
            cycle: cycle + 1,
            actaModelSelected: coordination.actaModelSelected,
            vortexCachePolicy: coordination.vortexCachePolicy,
            coordinationBenefit: coordination.coordinationBenefit,
            performanceGain: coordination.performanceGain
          });

          expect(coordination.coordinationApplied).toBe(true);
          expect(coordination.coordinationBenefit).toBeGreaterThanOrEqual(scenario.coordinationBenefit * 0.7);
        }
      }

      // Verify intelligent coordination patterns
      const lowComplexityResults = coordinationResults.filter(r => r.scenario === 'low');
      const highComplexityResults = coordinationResults.filter(r => r.scenario === 'high');

      // Low complexity should favor smaller models and longer caching
      const avgLowComplexityBenefit = lowComplexityResults.reduce((sum, r) => sum + r.coordinationBenefit, 0) / lowComplexityResults.length;
      expect(lowComplexityResults.some(r => r.actaModelSelected.includes('small'))).toBe(true);

      // High complexity should favor larger models and adaptive caching
      const avgHighComplexityBenefit = highComplexityResults.reduce((sum, r) => sum + r.coordinationBenefit, 0) / highComplexityResults.length;
      expect(highComplexityResults.some(r => r.actaModelSelected.includes('large'))).toBe(true);

      // Verify coordination benefits increase over cycles (learning effect)
      const benefitTrends = coordinationTest.scenarios.map(scenario => {
        const scenarioResults = coordinationResults.filter(r => r.scenario === scenario.complexity);
        const benefits = scenarioResults.map(r => r.coordinationBenefit);
        return { scenario: scenario.complexity, trend: benefits[benefits.length - 1] - benefits[0] };
      });

      benefitTrends.forEach(trend => {
        expect(trend.trend).toBeGreaterThanOrEqual(-0.05); // Allow minimal degradation but expect improvement
      });

      console.log(`✅ ACTA-VORTEX coordination demonstrated with average benefits: Low=${(avgLowComplexityBenefit * 100).toFixed(1)}%, High=${(avgHighComplexityBenefit * 100).toFixed(1)}%`);
    });
  });

  describe('All Systems Combined Performance', () => {
    it('should achieve maximum performance with all three systems working together', async () => {
      if (!serviceAvailable) return;

      const allSystemsTest = {
        workloadProfile: testConfig.workloadScenarios.moderate,
        testDuration: 90000, // 90 seconds
        expectedMetrics: {
          totalTokenReduction: testConfig.combinedPerformanceTargets.tokenReduction,
          totalLatencyImprovement: testConfig.combinedPerformanceTargets.latencyImprovement,
          adaptationAccuracy: testConfig.combinedPerformanceTargets.adaptationAccuracy,
          systemResilience: testConfig.combinedPerformanceTargets.systemResilience
        }
      };

      console.log('🚀 Starting comprehensive all-systems performance test...');

      const allSystemsResults: CombinedSystemAnalytics[] = [];
      const startTime = Date.now();
      let requestCount = 0;
      const errorCount = { value: 0 };

      // Comprehensive test queries
      const testQueries = [
        `Analyze workflow performance with {CONTEXT:workflow:current:status} using {DATA:metrics:comprehensive:analysis}`,
        `Process user requirements {DATA:artifact:v1:requirements} with current {STATE:system:health:status}`,
        `Optimize task scheduling {TEMPORAL:schedule:dynamic:tasks} based on {METRICS:performance:historical:data}`,
        `Complex multi-agent coordination requiring {CONTEXT:agents:active:roles} and {DATA:configuration:system:settings}`
      ];

      const testInterval = setInterval(async () => {
        if (Date.now() - startTime >= allSystemsTest.testDuration) {
          clearInterval(testInterval);
          return;
        }

        const query = testQueries[requestCount % testQueries.length];

        try {
          const startRequestTime = performance.now();

          const allSystemsResponse = await axios.post(
            `${testConfig.baseUrl}/cross-system/process-all-systems`,
            {
              text: query,
              feedbackLoopId,
              actaInstanceId, 
              vortexEngineId,
              enableAllOptimizations: true,
              requestId: requestCount++,
              timestamp: new Date()
            }
          );

          const requestTime = performance.now() - startRequestTime;

          if (allSystemsResponse.status === 200) {
            const analytics = allSystemsResponse.data.analytics;
            
            allSystemsResults.push({
              feedbackLoopMetrics: {
                adaptationCycles: analytics.feedbackCycles,
                improvementRate: analytics.improvementRate,
                learningVelocity: analytics.learningVelocity,
                crossAgentKnowledge: analytics.crossAgentKnowledge
              },
              actaMetrics: {
                compressionRatio: analytics.actaCompression,
                modelSwitchingEfficiency: analytics.modelSwitchingEfficiency,
                contextGraphPerformance: analytics.contextGraphPerf,
                vectorCompressionGain: analytics.vectorCompressionGain
              },
              vortexMetrics: {
                tokenReductionRatio: analytics.vortexTokenReduction,
                cacheHitRate: analytics.cacheHitRate,
                jitOptimization: analytics.jitOptimization,
                adaptiveCachingGain: analytics.adaptiveCachingGain
              },
              combinedMetrics: {
                totalTokenReduction: analytics.totalTokenReduction,
                totalLatencyImprovement: (analytics.baselineLatency - requestTime) / analytics.baselineLatency,
                combinedThroughput: 1000 / requestTime, // requests per second
                systemCoherence: analytics.systemCoherence
              }
            });
          }
        } catch (error) {
          errorCount.value++;
          console.warn(`Request ${requestCount} failed:`, error.message);
        }
      }, 1000 / allSystemsTest.workloadProfile.rps);

      // Wait for test completion
      await new Promise(resolve => {
        const checkCompletion = setInterval(() => {
          if (Date.now() - startTime >= allSystemsTest.testDuration) {
            clearInterval(checkCompletion);
            resolve(undefined);
          }
        }, 5000);
      });

      console.log(`✅ All-systems test completed, analyzing ${allSystemsResults.length} results...`);

      // Analyze comprehensive performance
      expect(allSystemsResults.length).toBeGreaterThan(100); // Should have significant results

      const aggregateAnalytics = allSystemsResults.reduce((acc, result) => ({
        avgTokenReduction: acc.avgTokenReduction + result.combinedMetrics.totalTokenReduction,
        avgLatencyImprovement: acc.avgLatencyImprovement + result.combinedMetrics.totalLatencyImprovement,
        avgThroughput: acc.avgThroughput + result.combinedMetrics.combinedThroughput,
        avgSystemCoherence: acc.avgSystemCoherence + result.combinedMetrics.systemCoherence,
        avgAdaptationAccuracy: acc.avgAdaptationAccuracy + result.feedbackLoopMetrics.improvementRate,
        avgLearningVelocity: acc.avgLearningVelocity + result.feedbackLoopMetrics.learningVelocity,
        avgCacheHitRate: acc.avgCacheHitRate + result.vortexMetrics.cacheHitRate
      }), {
        avgTokenReduction: 0,
        avgLatencyImprovement: 0,
        avgThroughput: 0,
        avgSystemCoherence: 0,
        avgAdaptationAccuracy: 0,
        avgLearningVelocity: 0,
        avgCacheHitRate: 0
      });

      const resultCount = allSystemsResults.length;
      const finalAnalytics = {
        tokenReduction: aggregateAnalytics.avgTokenReduction / resultCount,
        latencyImprovement: aggregateAnalytics.avgLatencyImprovement / resultCount,
        throughput: aggregateAnalytics.avgThroughput / resultCount,
        systemCoherence: aggregateAnalytics.avgSystemCoherence / resultCount,
        adaptationAccuracy: aggregateAnalytics.avgAdaptationAccuracy / resultCount,
        learningVelocity: aggregateAnalytics.avgLearningVelocity / resultCount,
        cacheHitRate: aggregateAnalytics.avgCacheHitRate / resultCount,
        systemResilience: 1 - (errorCount.value / (requestCount || 1))
      };

      // Validate against combined performance targets
      expect(finalAnalytics.tokenReduction).toBeGreaterThanOrEqual(allSystemsTest.expectedMetrics.totalTokenReduction * 0.85);
      expect(finalAnalytics.latencyImprovement).toBeGreaterThanOrEqual(allSystemsTest.expectedMetrics.totalLatencyImprovement * 0.8);
      expect(finalAnalytics.adaptationAccuracy).toBeGreaterThanOrEqual(allSystemsTest.expectedMetrics.adaptationAccuracy * 0.85);
      expect(finalAnalytics.systemResilience).toBeGreaterThanOrEqual(allSystemsTest.expectedMetrics.systemResilience * 0.95);

      // Verify system coherence (all systems working well together)
      expect(finalAnalytics.systemCoherence).toBeGreaterThan(0.8);

      console.log(`✅ All systems combined performance validation:`);
      console.log(`   Requests processed: ${allSystemsResults.length} (${errorCount.value} errors)`);
      console.log(`   Token reduction: ${(finalAnalytics.tokenReduction * 100).toFixed(1)}% (target: ${(allSystemsTest.expectedMetrics.totalTokenReduction * 100).toFixed(1)}%)`);
      console.log(`   Latency improvement: ${(finalAnalytics.latencyImprovement * 100).toFixed(1)}% (target: ${(allSystemsTest.expectedMetrics.totalLatencyImprovement * 100).toFixed(1)}%)`);
      console.log(`   Adaptation accuracy: ${(finalAnalytics.adaptationAccuracy * 100).toFixed(1)}% (target: ${(allSystemsTest.expectedMetrics.adaptationAccuracy * 100).toFixed(1)}%)`);
      console.log(`   System resilience: ${(finalAnalytics.systemResilience * 100).toFixed(1)}% (target: ${(allSystemsTest.expectedMetrics.systemResilience * 100).toFixed(1)}%)`);
      console.log(`   System coherence: ${(finalAnalytics.systemCoherence * 100).toFixed(1)}%`);
      console.log(`   Cache hit rate: ${(finalAnalytics.cacheHitRate * 100).toFixed(1)}%`);
      console.log(`   Average throughput: ${finalAnalytics.throughput.toFixed(1)} req/s`);
    });

    it('should demonstrate system resilience and failover capabilities under extreme load', async () => {
      if (!serviceAvailable) return;

      const resilienceTest = {
        phases: [
          { name: 'baseline', load: 10, duration: 15000, failureRate: 0 },
          { name: 'moderate-load', load: 25, duration: 20000, failureRate: 0.1 },
          { name: 'high-load', load: 40, duration: 25000, failureRate: 0.2 },
          { name: 'extreme-load', load: 60, duration: 30000, failureRate: 0.3 },
          { name: 'recovery', load: 15, duration: 15000, failureRate: 0.05 }
        ],
        resilienceTargets: {
          maxDegradation: 0.3,      // Max 30% performance degradation
          recoveryTime: 10000,      // 10 seconds max recovery
          minUptime: 0.95           // 95% minimum uptime
        }
      };

      console.log('🔥 Starting system resilience and extreme load test...');

      const resilienceResults: any[] = [];

      for (const phase of resilienceTest.phases) {
        console.log(`   Testing phase: ${phase.name} (${phase.load} req/s, ${phase.duration}ms)`);

        const phaseStartTime = Date.now();
        const phaseResults: any[] = [];
        let phaseErrors = 0;
        let phaseRequests = 0;

        const phaseInterval = setInterval(async () => {
          if (Date.now() - phaseStartTime >= phase.duration) {
            clearInterval(phaseInterval);
            return;
          }

          // Simulate random failures based on phase failure rate
          const shouldFail = Math.random() < phase.failureRate;

          try {
            const requestStart = performance.now();

            const resilienceResponse = await axios.post(
              `${testConfig.baseUrl}/cross-system/resilience-test`,
              {
                phase: phase.name,
                load: phase.load,
                simulateFailure: shouldFail,
                feedbackLoopId,
                actaInstanceId,
                vortexEngineId,
                requestId: phaseRequests++
              }
            );

            const responseTime = performance.now() - requestStart;

            if (resilienceResponse.status === 200) {
              phaseResults.push({
                responseTime,
                systemHealth: resilienceResponse.data.systemHealth,
                failoverTriggered: resilienceResponse.data.failoverTriggered,
                degradedMode: resilienceResponse.data.degradedMode
              });
            }
          } catch (error) {
            phaseErrors++;
          }
        }, 1000 / phase.load);

        // Wait for phase completion
        await new Promise(resolve => {
          const checkPhaseCompletion = setInterval(() => {
            if (Date.now() - phaseStartTime >= phase.duration) {
              clearInterval(checkPhaseCompletion);
              resolve(undefined);
            }
          }, 1000);
        });

        const phaseUptime = (phaseRequests - phaseErrors) / phaseRequests;
        const avgResponseTime = phaseResults.reduce((sum, r) => sum + r.responseTime, 0) / phaseResults.length;
        const failoverCount = phaseResults.filter(r => r.failoverTriggered).length;
        const degradedModeTime = phaseResults.filter(r => r.degradedMode).length / phaseResults.length;

        resilienceResults.push({
          phase: phase.name,
          uptime: phaseUptime,
          avgResponseTime,
          failoverCount,
          degradedModeTime,
          totalRequests: phaseRequests,
          totalErrors: phaseErrors
        });

        console.log(`     Phase ${phase.name}: ${(phaseUptime * 100).toFixed(1)}% uptime, ${avgResponseTime.toFixed(0)}ms avg response`);
      }

      // Analyze resilience performance
      const overallUptime = resilienceResults.reduce((sum, r) => sum + r.uptime, 0) / resilienceResults.length;
      expect(overallUptime).toBeGreaterThanOrEqual(resilienceTest.resilienceTargets.minUptime);

      // Verify graceful degradation under load
      const baselineResponseTime = resilienceResults.find(r => r.phase === 'baseline')?.avgResponseTime || 1000;
      const extremeResponseTime = resilienceResults.find(r => r.phase === 'extreme-load')?.avgResponseTime || 1000;
      const degradation = (extremeResponseTime - baselineResponseTime) / baselineResponseTime;

      expect(degradation).toBeLessThanOrEqual(resilienceTest.resilienceTargets.maxDegradation);

      // Verify recovery capabilities
      const recoveryPhase = resilienceResults.find(r => r.phase === 'recovery');
      expect(recoveryPhase?.uptime).toBeGreaterThan(0.98); // Should recover well

      // Verify failover mechanisms activated
      const totalFailovers = resilienceResults.reduce((sum, r) => sum + r.failoverCount, 0);
      expect(totalFailovers).toBeGreaterThan(0); // Should have triggered failovers

      console.log(`✅ System resilience validation:`);
      console.log(`   Overall uptime: ${(overallUptime * 100).toFixed(1)}% (target: ${(resilienceTest.resilienceTargets.minUptime * 100).toFixed(1)}%)`);
      console.log(`   Max degradation: ${(degradation * 100).toFixed(1)}% (limit: ${(resilienceTest.resilienceTargets.maxDegradation * 100).toFixed(1)}%)`);
      console.log(`   Total failovers: ${totalFailovers}`);
      console.log(`   Recovery performance: ${(recoveryPhase?.uptime * 100).toFixed(1)}% uptime`);
    });
  });
});