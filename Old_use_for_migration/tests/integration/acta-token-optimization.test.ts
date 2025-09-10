/**
 * ACTA (Adaptive Contextual Token Architecture) Integration Tests - OSSA v0.1.8
 * 
 * Tests the complete ACTA system including:
 * - Vector-Enhanced Semantic Compression (semantic similarity detection)
 * - Dynamic Model Switching (3B to 70B parameter models)
 * - O(log n) Context Graph Persistence (B-tree based storage)
 * - Intelligent Context Management (temporal and semantic weighting)
 * - Performance Optimization (caching, batching, and indexing)
 * 
 * Validates claimed performance metrics:
 * - Token compression ratios of 30-80% based on compression level
 * - Dynamic model switching with appropriate latency vs. capability trade-offs
 * - O(log n) context operations
 * - Semantic similarity matching accuracy
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setTimeout as delay } from 'timers/promises';
import axios from 'axios';
import { performance } from 'perf_hooks';

// Import ACTA components for testing
import { ACTAOrchestrator } from '../../src/acta/orchestrator';
import { VectorCompressionEngine } from '../../src/acta/vector-compression';
import { ModelSwitcher } from '../../src/acta/model-switcher';
import { CompressionLevel, ModelSize, SwitchReason } from '../../src/acta/types';

// Test configuration for ACTA validation
interface ACTATestConfig {
  baseUrl: string;
  qdrantUrl: string;
  timeout: number;
  compressionThresholds: {
    light: { min: 0.1, max: 0.2 };
    moderate: { min: 0.3, max: 0.4 };
    heavy: { min: 0.5, max: 0.6 };
    maximum: { min: 0.7, max: 0.8 };
  };
  performanceThresholds: {
    smallModel: { latency: 200, contextWindow: 8192 };
    mediumModel: { latency: 400, contextWindow: 16384 };
    largeModel: { latency: 800, contextWindow: 32768 };
    xlargeModel: { latency: 1600, contextWindow: 65536 };
  };
  vectorSimilarityThreshold: 0.7;
}

// Comprehensive test data for ACTA validation
interface ACTATestData {
  queries: Array<{
    id: string;
    text: string;
    context: string[];
    expectedComplexity: 'low' | 'medium' | 'high' | 'extreme';
    expectedModel: ModelSize;
    compressionLevel: CompressionLevel;
    semanticSimilarities?: string[];
  }>;
}

// ACTA Performance metrics for validation
interface ACTAPerformanceMetrics {
  compressionRatio: number;
  responseTime: number;
  modelUsed: ModelSize;
  contextGraphOps: number;
  vectorOperations: number;
  cacheHitRate: number;
  semanticMatches: number;
  bTreeDepth: number;
  bTreeOperationTime: number;
}

describe('ACTA Token Optimization Integration Tests', () => {
  let testConfig: ACTATestConfig;
  let actaInstance: string;
  let testData: ACTATestData;
  let serviceAvailable = false;

  beforeAll(async () => {
    testConfig = {
      baseUrl: 'http://localhost:4000',
      qdrantUrl: 'http://localhost:6333',
      timeout: 30000,
      compressionThresholds: {
        light: { min: 0.1, max: 0.2 },
        moderate: { min: 0.3, max: 0.4 },
        heavy: { min: 0.5, max: 0.6 },
        maximum: { min: 0.7, max: 0.8 }
      },
      performanceThresholds: {
        smallModel: { latency: 200, contextWindow: 8192 },
        mediumModel: { latency: 400, contextWindow: 16384 },
        largeModel: { latency: 800, contextWindow: 32768 },
        xlargeModel: { latency: 1600, contextWindow: 65536 }
      },
      vectorSimilarityThreshold: 0.7
    };

    // Initialize comprehensive test data
    testData = {
      queries: [
        {
          id: 'simple-query',
          text: 'What is the weather today?',
          context: ['Weather data shows sunny conditions', 'Temperature is 72F'],
          expectedComplexity: 'low',
          expectedModel: ModelSize.SMALL,
          compressionLevel: CompressionLevel.LIGHT
        },
        {
          id: 'moderate-reasoning',
          text: 'Explain the relationship between quantum mechanics and general relativity in modern physics.',
          context: [
            'Quantum mechanics describes phenomena at atomic scale',
            'General relativity explains gravity and spacetime',
            'Both theories are fundamental to physics',
            'Einstein worked on both theories',
            'Quantum field theory attempts to unify them'
          ],
          expectedComplexity: 'medium',
          expectedModel: ModelSize.MEDIUM,
          compressionLevel: CompressionLevel.MODERATE
        },
        {
          id: 'complex-analysis',
          text: 'Analyze the multi-dimensional impact of climate change on global supply chains, considering economic, environmental, and social factors across different industries and regions.',
          context: [
            'Climate change affects weather patterns globally',
            'Supply chains span multiple countries and industries',
            'Economic impacts include cost increases and disruptions',
            'Environmental factors include carbon emissions and resource scarcity',
            'Social impacts affect communities and labor markets',
            'Different regions have varying vulnerability levels',
            'Industries have different adaptation capabilities',
            'Policy responses vary by country and region',
            'Technological solutions are emerging but varied',
            'Financial markets are pricing climate risks'
          ],
          expectedComplexity: 'high',
          expectedModel: ModelSize.LARGE,
          compressionLevel: CompressionLevel.HEAVY,
          semanticSimilarities: ['supply chain disruption', 'climate impact', 'economic analysis']
        },
        {
          id: 'extreme-complexity',
          text: 'Design a comprehensive multi-agent AI system that can autonomously manage a smart city infrastructure while optimizing for sustainability, citizen welfare, economic efficiency, and emergency response, considering real-time data integration, ethical constraints, and regulatory compliance across multiple domains.',
          context: Array.from({ length: 20 }, (_, i) => `Complex context item ${i + 1} with detailed smart city infrastructure considerations including IoT sensors, traffic management, energy grids, waste management, water systems, emergency services, citizen services, data privacy, security protocols, and regulatory frameworks.`),
          expectedComplexity: 'extreme',
          expectedModel: ModelSize.XLARGE,
          compressionLevel: CompressionLevel.MAXIMUM
        }
      ]
    };

    // Check service availability
    try {
      const healthResp = await axios.get(`${testConfig.baseUrl}/health`, { timeout: 5000 });
      const qdrantResp = await axios.get(`${testConfig.qdrantUrl}/health`, { timeout: 5000 });
      
      serviceAvailable = healthResp.status === 200 && qdrantResp.status === 200;
      console.log('✅ ACTA services and Qdrant available for testing');
    } catch (error) {
      console.warn('⚠️  ACTA services not fully available, some tests will be skipped');
      serviceAvailable = false;
    }
  });

  afterAll(async () => {
    // Cleanup ACTA instance
    if (actaInstance && serviceAvailable) {
      try {
        await axios.delete(`${testConfig.baseUrl}/acta/${actaInstance}`);
      } catch (error) {
        console.warn('Failed to cleanup ACTA instance:', error);
      }
    }
  });

  describe('ACTA System Initialization', () => {
    it('should initialize ACTA with all components (vector compression, model switcher, graph persistence)', async () => {
      if (!serviceAvailable) return;

      const startTime = performance.now();

      const initResponse = await axios.post(
        `${testConfig.baseUrl}/acta/initialize`,
        {
          vectorConfig: {
            endpoint: testConfig.qdrantUrl,
            collection: 'acta-test-collection',
            dimension: 384
          },
          modelConfig: {
            models: [ModelSize.SMALL, ModelSize.MEDIUM, ModelSize.LARGE, ModelSize.XLARGE],
            switchingStrategy: 'complexity-based'
          },
          graphConfig: {
            persistenceEnabled: true,
            bTreeOrder: 64,
            cacheSize: 1000
          },
          compressionConfig: {
            enabled: true,
            threshold: 8000,
            defaultLevel: CompressionLevel.MODERATE
          }
        },
        { timeout: testConfig.timeout }
      );

      const initTime = performance.now() - startTime;

      expect(initResponse.status).toBe(201);
      expect(initResponse.data.instanceId).toBeDefined();
      expect(initResponse.data.status).toBe('initialized');
      expect(initResponse.data.components).toEqual({
        vectorCompression: 'ready',
        modelSwitcher: 'ready',
        graphPersistence: 'ready',
        orchestrator: 'ready'
      });

      actaInstance = initResponse.data.instanceId;
      expect(initTime).toBeLessThan(10000); // Should initialize within 10 seconds

      console.log(`✅ ACTA initialized in ${initTime.toFixed(0)}ms`);
    });

    it('should verify vector database connection and collection setup', async () => {
      if (!serviceAvailable || !actaInstance) return;

      const vectorStatusResponse = await axios.get(
        `${testConfig.baseUrl}/acta/${actaInstance}/vector-status`
      );

      expect(vectorStatusResponse.status).toBe(200);
      const vectorStatus = vectorStatusResponse.data;

      expect(vectorStatus.connected).toBe(true);
      expect(vectorStatus.collection.name).toBe('acta-test-collection');
      expect(vectorStatus.collection.dimension).toBe(384);
      expect(vectorStatus.collection.vectorCount).toBeDefined();
      expect(vectorStatus.collection.indexReady).toBe(true);
    });

    it('should verify model availability and switching configuration', async () => {
      if (!serviceAvailable || !actaInstance) return;

      const modelStatusResponse = await axios.get(
        `${testConfig.baseUrl}/acta/${actaInstance}/model-status`
      );

      expect(modelStatusResponse.status).toBe(200);
      const modelStatus = modelStatusResponse.data;

      expect(modelStatus.availableModels).toContain(ModelSize.SMALL);
      expect(modelStatus.availableModels).toContain(ModelSize.MEDIUM);
      expect(modelStatus.availableModels).toContain(ModelSize.LARGE);
      expect(modelStatus.availableModels).toContain(ModelSize.XLARGE);

      expect(modelStatus.currentModel).toBeDefined();
      expect(modelStatus.switchingEnabled).toBe(true);
      expect(modelStatus.lastSwitchTime).toBeDefined();
    });

    it('should verify context graph persistence B-tree initialization', async () => {
      if (!serviceAvailable || !actaInstance) return;

      const graphStatusResponse = await axios.get(
        `${testConfig.baseUrl}/acta/${actaInstance}/graph-status`
      );

      expect(graphStatusResponse.status).toBe(200);
      const graphStatus = graphStatusResponse.data;

      expect(graphStatus.bTreeInitialized).toBe(true);
      expect(graphStatus.bTreeOrder).toBe(64);
      expect(graphStatus.nodeCount).toBeGreaterThanOrEqual(0);
      expect(graphStatus.height).toBeGreaterThanOrEqual(1);
      expect(graphStatus.cacheSize).toBe(1000);
      expect(graphStatus.cacheHitRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Vector-Enhanced Semantic Compression', () => {
    beforeEach(async () => {
      // Ensure clean state for each compression test
      if (serviceAvailable && actaInstance) {
        await axios.post(`${testConfig.baseUrl}/acta/${actaInstance}/reset-compression-cache`);
      }
    });

    it('should achieve claimed compression ratios for different compression levels', async () => {
      if (!serviceAvailable || !actaInstance) return;

      const compressionResults: any[] = [];

      // Test each compression level
      for (const query of testData.queries) {
        const startTime = performance.now();

        const compressionResponse = await axios.post(
          `${testConfig.baseUrl}/acta/${actaInstance}/compress`,
          {
            text: query.text,
            context: query.context,
            compressionLevel: query.compressionLevel,
            enableSemanticMatching: true
          }
        );

        const compressionTime = performance.now() - startTime;

        expect(compressionResponse.status).toBe(200);
        const result = compressionResponse.data;

        const compressionRatio = result.compressionRatio;
        const expectedRange = testConfig.compressionThresholds[query.compressionLevel.toLowerCase() as keyof typeof testConfig.compressionThresholds];

        // Validate compression ratio within expected range
        expect(compressionRatio).toBeGreaterThanOrEqual(expectedRange.min);
        expect(compressionRatio).toBeLessThanOrEqual(expectedRange.max);

        compressionResults.push({
          queryId: query.id,
          level: query.compressionLevel,
          ratio: compressionRatio,
          time: compressionTime,
          originalTokens: result.originalTokenCount,
          compressedTokens: result.compressedTokenCount,
          semanticMatches: result.semanticMatches || 0
        });

        expect(result.originalTokenCount).toBeGreaterThan(result.compressedTokenCount);
        expect(compressionTime).toBeLessThan(5000); // Should complete within 5 seconds
      }

      // Validate progression of compression ratios
      const ratios = compressionResults.map(r => r.ratio);
      expect(ratios[0]).toBeLessThan(ratios[1]); // Light < Moderate
      expect(ratios[1]).toBeLessThan(ratios[2]); // Moderate < Heavy
      expect(ratios[2]).toBeLessThan(ratios[3]); // Heavy < Maximum

      console.log('✅ Compression ratios validated:');
      compressionResults.forEach(result => {
        console.log(`   ${result.queryId}: ${(result.ratio * 100).toFixed(1)}% compression in ${result.time.toFixed(0)}ms`);
      });
    });

    it('should demonstrate semantic similarity matching with vector database', async () => {
      if (!serviceAvailable || !actaInstance) return;

      const complexQuery = testData.queries.find(q => q.semanticSimilarities);
      if (!complexQuery) return;

      // First, populate vector database with similar contexts
      await axios.post(`${testConfig.baseUrl}/acta/${actaInstance}/populate-vectors`, {
        documents: [
          'Global supply chain disruptions affect multiple industries',
          'Climate change impacts on economic systems worldwide',
          'Multi-dimensional analysis of environmental factors',
          'Regional variations in climate adaptation strategies',
          'Economic efficiency in sustainable development'
        ]
      });

      // Wait for vector indexing
      await delay(2000);

      const semanticResponse = await axios.post(
        `${testConfig.baseUrl}/acta/${actaInstance}/semantic-compress`,
        {
          text: complexQuery.text,
          context: complexQuery.context,
          similarityThreshold: testConfig.vectorSimilarityThreshold,
          maxMatches: 10
        }
      );

      expect(semanticResponse.status).toBe(200);
      const semanticResult = semanticResponse.data;

      expect(semanticResult.semanticMatches).toBeGreaterThan(0);
      expect(semanticResult.similarityScores.length).toBeGreaterThan(0);
      
      // All similarity scores should meet threshold
      semanticResult.similarityScores.forEach((score: number) => {
        expect(score).toBeGreaterThanOrEqual(testConfig.vectorSimilarityThreshold);
      });

      expect(semanticResult.compressionEnhancement).toBeGreaterThan(0);
      expect(semanticResult.vectorSearchTime).toBeLessThan(1000); // Vector search < 1 second

      console.log(`✅ Semantic matching found ${semanticResult.semanticMatches} matches with avg similarity ${(semanticResult.averageSimilarity * 100).toFixed(1)}%`);
    });

    it('should optimize compression based on context relationships and temporal weighting', async () => {
      if (!serviceAvailable || !actaInstance) return;

      const contextData = {
        texts: [
          'Initial context about quantum computing principles',
          'Follow-up discussion on quantum algorithms',
          'Recent developments in quantum hardware',
          'Future implications of quantum technology'
        ],
        timestamps: [
          new Date(Date.now() - 3600000), // 1 hour ago
          new Date(Date.now() - 1800000), // 30 minutes ago  
          new Date(Date.now() - 900000),  // 15 minutes ago
          new Date() // Now
        ],
        relationships: [
          { from: 0, to: 1, weight: 0.8 },
          { from: 1, to: 2, weight: 0.9 },
          { from: 2, to: 3, weight: 0.7 },
          { from: 0, to: 3, weight: 0.6 }
        ]
      };

      const temporalResponse = await axios.post(
        `${testConfig.baseUrl}/acta/${actaInstance}/temporal-compress`,
        {
          contextData,
          temporalWeighting: true,
          relationshipWeighting: true,
          compressionLevel: CompressionLevel.MODERATE
        }
      );

      expect(temporalResponse.status).toBe(200);
      const temporalResult = temporalResponse.data;

      expect(temporalResult.temporalWeights.length).toBe(contextData.texts.length);
      expect(temporalResult.relationshipWeights.length).toBe(contextData.relationships.length);

      // More recent contexts should have higher weights
      const weights = temporalResult.temporalWeights;
      expect(weights[3]).toBeGreaterThan(weights[0]); // Recent > Old
      expect(weights[2]).toBeGreaterThan(weights[1]); // More recent > Less recent

      expect(temporalResult.compressionRatio).toBeGreaterThan(0.2);
      expect(temporalResult.contextRetentionScore).toBeGreaterThan(0.8); // Should preserve important context

      console.log(`✅ Temporal compression achieved ${(temporalResult.compressionRatio * 100).toFixed(1)}% ratio with ${(temporalResult.contextRetentionScore * 100).toFixed(1)}% context retention`);
    });
  });

  describe('Dynamic Model Switching (3B to 70B)', () => {
    it('should automatically select appropriate model sizes based on query complexity', async () => {
      if (!serviceAvailable || !actaInstance) return;

      const switchingResults: any[] = [];

      for (const query of testData.queries) {
        const startTime = performance.now();

        const modelResponse = await axios.post(
          `${testConfig.baseUrl}/acta/${actaInstance}/process-with-switching`,
          {
            text: query.text,
            context: query.context,
            enableModelSwitching: true,
            complexityAnalysis: true
          }
        );

        const responseTime = performance.now() - startTime;

        expect(modelResponse.status).toBe(200);
        const result = modelResponse.data;

        // Validate model selection matches expected complexity
        expect(result.selectedModel).toBe(query.expectedModel);
        expect(result.complexityScore).toBeDefined();
        expect(result.switchReason).toBeDefined();

        // Validate performance characteristics
        const expectedThreshold = testConfig.performanceThresholds[
          query.expectedModel.toLowerCase() as keyof typeof testConfig.performanceThresholds
        ];
        expect(responseTime).toBeLessThan(expectedThreshold.latency * 2); // Allow 2x threshold for integration overhead

        switchingResults.push({
          queryId: query.id,
          complexity: query.expectedComplexity,
          selectedModel: result.selectedModel,
          responseTime,
          complexityScore: result.complexityScore,
          switchReason: result.switchReason,
          contextWindowUsed: result.contextWindowUsed
        });
      }

      // Validate model escalation based on complexity
      expect(switchingResults[0].selectedModel).toBe(ModelSize.SMALL);
      expect(switchingResults[1].selectedModel).toBe(ModelSize.MEDIUM);
      expect(switchingResults[2].selectedModel).toBe(ModelSize.LARGE);
      expect(switchingResults[3].selectedModel).toBe(ModelSize.XLARGE);

      console.log('✅ Model switching validated:');
      switchingResults.forEach(result => {
        console.log(`   ${result.queryId}: ${result.selectedModel} (${result.responseTime.toFixed(0)}ms, complexity: ${result.complexityScore.toFixed(2)})`);
      });
    });

    it('should demonstrate cost-aware model switching with performance trade-offs', async () => {
      if (!serviceAvailable || !actaInstance) return;

      const costAwareConfig = {
        costWeighting: 0.4,
        performanceWeighting: 0.6,
        maxCostPerToken: 0.001,
        switchingThreshold: 0.8
      };

      const costAwareResponse = await axios.post(
        `${testConfig.baseUrl}/acta/${actaInstance}/configure-cost-aware-switching`,
        costAwareConfig
      );

      expect(costAwareResponse.status).toBe(200);

      // Test query with cost constraints
      const testQuery = testData.queries[2]; // Complex analysis query
      
      const processResponse = await axios.post(
        `${testConfig.baseUrl}/acta/${actaInstance}/process-cost-aware`,
        {
          text: testQuery.text,
          context: testQuery.context,
          maxBudget: 0.05,
          qualityThreshold: 0.8
        }
      );

      expect(processResponse.status).toBe(200);
      const result = processResponse.data;

      expect(result.selectedModel).toBeDefined();
      expect(result.estimatedCost).toBeLessThanOrEqual(0.05);
      expect(result.qualityScore).toBeGreaterThanOrEqual(0.8);
      expect(result.costEfficiencyRatio).toBeGreaterThan(0);

      // Should potentially select smaller model for cost efficiency
      expect([ModelSize.MEDIUM, ModelSize.LARGE].includes(result.selectedModel)).toBe(true);

      console.log(`✅ Cost-aware switching selected ${result.selectedModel} with cost $${result.estimatedCost.toFixed(4)} and quality ${(result.qualityScore * 100).toFixed(1)}%`);
    });

    it('should maintain context window constraints across different model sizes', async () => {
      if (!serviceAvailable || !actaInstance) return;

      const windowTestCases = [
        { modelSize: ModelSize.SMALL, maxTokens: 7000, expectedFit: true },
        { modelSize: ModelSize.SMALL, maxTokens: 10000, expectedFit: false },
        { modelSize: ModelSize.MEDIUM, maxTokens: 15000, expectedFit: true },
        { modelSize: ModelSize.LARGE, maxTokens: 30000, expectedFit: true },
        { modelSize: ModelSize.XLARGE, maxTokens: 60000, expectedFit: true }
      ];

      const windowResults: any[] = [];

      for (const testCase of windowTestCases) {
        const contextWindowResponse = await axios.post(
          `${testConfig.baseUrl}/acta/${actaInstance}/check-context-window`,
          {
            modelSize: testCase.modelSize,
            tokenCount: testCase.maxTokens,
            includeSystemPrompt: true
          }
        );

        expect(contextWindowResponse.status).toBe(200);
        const result = contextWindowResponse.data;

        expect(result.fitsInWindow).toBe(testCase.expectedFit);
        if (testCase.expectedFit) {
          expect(result.utilizationRatio).toBeLessThan(1.0);
        } else {
          expect(result.suggestedModel).toBeDefined();
          expect(result.compressionRecommended).toBe(true);
        }

        windowResults.push({
          model: testCase.modelSize,
          tokens: testCase.maxTokens,
          fits: result.fitsInWindow,
          utilization: result.utilizationRatio
        });
      }

      console.log('✅ Context window constraints validated across all model sizes');
    });
  });

  describe('O(log n) Context Graph Persistence', () => {
    it('should demonstrate O(log n) performance for B-tree operations', async () => {
      if (!serviceAvailable || !actaInstance) return;

      const bTreeTestSizes = [100, 500, 1000, 5000, 10000];
      const operationResults: any[] = [];

      for (const size of bTreeTestSizes) {
        // Insert test data
        const insertStartTime = performance.now();
        
        const insertResponse = await axios.post(
          `${testConfig.baseUrl}/acta/${actaInstance}/btree-bulk-insert`,
          {
            recordCount: size,
            keyPattern: 'sequential',
            dataSize: 'medium'
          }
        );

        const insertTime = performance.now() - insertStartTime;

        expect(insertResponse.status).toBe(200);

        // Perform search operations
        const searchStartTime = performance.now();
        
        const searchResponse = await axios.post(
          `${testConfig.baseUrl}/acta/${actaInstance}/btree-search`,
          {
            keys: Array.from({ length: 100 }, (_, i) => Math.floor(Math.random() * size)),
            includeRange: true
          }
        );

        const searchTime = performance.now() - searchStartTime;

        expect(searchResponse.status).toBe(200);
        const searchResult = searchResponse.data;

        operationResults.push({
          size,
          insertTime,
          searchTime: searchTime / 100, // Average per search
          treeHeight: searchResult.treeHeight,
          operationsPerSecond: 100 / (searchTime / 1000)
        });

        // Validate O(log n) characteristic
        expect(searchResult.treeHeight).toBeLessThanOrEqual(Math.ceil(Math.log2(size)) + 2);
      }

      // Validate logarithmic scaling
      for (let i = 1; i < operationResults.length; i++) {
        const prev = operationResults[i - 1];
        const curr = operationResults[i];
        
        // Time increase should be much less than linear (size increase)
        const sizeRatio = curr.size / prev.size;
        const timeRatio = curr.searchTime / prev.searchTime;
        
        expect(timeRatio).toBeLessThan(sizeRatio * 0.5); // Should be sub-linear
      }

      console.log('✅ B-tree O(log n) performance validated:');
      operationResults.forEach(result => {
        console.log(`   Size ${result.size}: ${result.searchTime.toFixed(2)}ms avg search, height ${result.treeHeight}`);
      });
    });

    it('should maintain context relationships with temporal decay and semantic weighting', async () => {
      if (!serviceAvailable || !actaInstance) return;

      const contextGraph = {
        nodes: Array.from({ length: 50 }, (_, i) => ({
          id: `context-${i}`,
          content: `Context content item ${i} with semantic meaning`,
          timestamp: new Date(Date.now() - Math.random() * 86400000), // Random within 24h
          type: i % 4 === 0 ? 'primary' : 'secondary',
          semanticVector: Array.from({ length: 384 }, () => Math.random())
        })),
        relationships: Array.from({ length: 100 }, (_, i) => ({
          from: Math.floor(Math.random() * 50),
          to: Math.floor(Math.random() * 50),
          weight: Math.random(),
          type: ['semantic', 'temporal', 'causal'][i % 3]
        })).filter(rel => rel.from !== rel.to)
      };

      const graphResponse = await axios.post(
        `${testConfig.baseUrl}/acta/${actaInstance}/build-context-graph`,
        {
          graph: contextGraph,
          temporalDecayEnabled: true,
          semanticWeightingEnabled: true,
          decayHalfLife: 3600000 // 1 hour
        }
      );

      expect(graphResponse.status).toBe(200);
      const graphResult = graphResponse.data;

      expect(graphResult.nodeCount).toBe(contextGraph.nodes.length);
      expect(graphResult.relationshipCount).toBe(contextGraph.relationships.length);
      expect(graphResult.temporalWeights.length).toBe(contextGraph.nodes.length);

      // Verify temporal decay - more recent items should have higher weights
      const sortedByTime = graphResult.temporalWeights
        .map((weight: number, index: number) => ({ weight, timestamp: contextGraph.nodes[index].timestamp }))
        .sort((a: any, b: any) => b.timestamp - a.timestamp);

      expect(sortedByTime[0].weight).toBeGreaterThan(sortedByTime[sortedByTime.length - 1].weight);

      // Test context retrieval with combined weighting
      const retrievalResponse = await axios.post(
        `${testConfig.baseUrl}/acta/${actaInstance}/retrieve-context`,
        {
          query: 'semantic meaning context',
          maxResults: 10,
          temporalWeight: 0.3,
          semanticWeight: 0.7,
          includeRelationships: true
        }
      );

      expect(retrievalResponse.status).toBe(200);
      const retrievalResult = retrievalResponse.data;

      expect(retrievalResult.results.length).toBeLessThanOrEqual(10);
      expect(retrievalResult.averageRelevance).toBeGreaterThan(0.5);
      expect(retrievalResult.retrievalTime).toBeLessThan(500); // < 500ms

      console.log(`✅ Context graph with ${graphResult.nodeCount} nodes and ${graphResult.relationshipCount} relationships built and tested`);
    });

    it('should demonstrate persistent storage and efficient retrieval across sessions', async () => {
      if (!serviceAvailable || !actaInstance) return;

      // Create persistent context data
      const persistentData = {
        sessionId: `test-session-${Date.now()}`,
        contextItems: Array.from({ length: 1000 }, (_, i) => ({
          id: `persistent-${i}`,
          data: `Persistent context data item ${i}`,
          metadata: { priority: Math.random(), category: `category-${i % 10}` },
          created: new Date()
        }))
      };

      // Store data persistently
      const storeResponse = await axios.post(
        `${testConfig.baseUrl}/acta/${actaInstance}/store-persistent`,
        persistentData
      );

      expect(storeResponse.status).toBe(200);
      const storeResult = storeResponse.data;

      expect(storeResult.storedCount).toBe(persistentData.contextItems.length);
      expect(storeResult.persistenceConfirmed).toBe(true);

      // Simulate session restart by clearing cache
      await axios.post(`${testConfig.baseUrl}/acta/${actaInstance}/clear-cache`);

      // Retrieve data from persistent storage
      const retrieveStartTime = performance.now();
      
      const retrieveResponse = await axios.post(
        `${testConfig.baseUrl}/acta/${actaInstance}/retrieve-persistent`,
        {
          sessionId: persistentData.sessionId,
          filters: { category: 'category-5' },
          limit: 100
        }
      );

      const retrieveTime = performance.now() - retrieveStartTime;

      expect(retrieveResponse.status).toBe(200);
      const retrieveResult = retrieveResponse.data;

      expect(retrieveResult.items.length).toBe(100); // category-5 should have 100 items
      expect(retrieveTime).toBeLessThan(1000); // Should retrieve efficiently
      
      // Verify data integrity
      retrieveResult.items.forEach((item: any) => {
        expect(item.metadata.category).toBe('category-5');
        expect(item.data).toContain('Persistent context data item');
      });

      console.log(`✅ Persistent storage tested: ${retrieveResult.items.length} items retrieved in ${retrieveTime.toFixed(0)}ms`);
    });
  });

  describe('End-to-End Performance Validation', () => {
    it('should demonstrate comprehensive ACTA performance under realistic workload', async () => {
      if (!serviceAvailable || !actaInstance) return;

      const workloadTest = {
        duration: 60000, // 60 seconds
        requestRate: 10,  // 10 requests per second
        queryMix: {
          simple: 0.4,    // 40% simple queries
          moderate: 0.3,  // 30% moderate
          complex: 0.2,   // 20% complex
          extreme: 0.1    // 10% extreme
        }
      };

      const performanceResults: ACTAPerformanceMetrics[] = [];
      const startTime = Date.now();
      let requestCount = 0;

      const testInterval = setInterval(async () => {
        if (Date.now() - startTime >= workloadTest.duration) {
          clearInterval(testInterval);
          return;
        }

        const rand = Math.random();
        let queryType: string;
        
        if (rand < workloadTest.queryMix.simple) queryType = 'simple';
        else if (rand < workloadTest.queryMix.simple + workloadTest.queryMix.moderate) queryType = 'moderate';
        else if (rand < workloadTest.queryMix.simple + workloadTest.queryMix.moderate + workloadTest.queryMix.complex) queryType = 'complex';
        else queryType = 'extreme';

        const query = testData.queries.find(q => 
          (queryType === 'simple' && q.expectedComplexity === 'low') ||
          (queryType === 'moderate' && q.expectedComplexity === 'medium') ||
          (queryType === 'complex' && q.expectedComplexity === 'high') ||
          (queryType === 'extreme' && q.expectedComplexity === 'extreme')
        ) || testData.queries[0];

        try {
          const reqStartTime = performance.now();
          
          const response = await axios.post(
            `${testConfig.baseUrl}/acta/${actaInstance}/process-comprehensive`,
            {
              text: query.text,
              context: query.context,
              compressionLevel: query.compressionLevel,
              enableModelSwitching: true,
              enableSemanticMatching: true,
              enableContextPersistence: true,
              requestId: `workload-${requestCount++}`
            }
          );

          const responseTime = performance.now() - reqStartTime;

          if (response.status === 200) {
            const result = response.data;
            
            performanceResults.push({
              compressionRatio: result.compressionRatio || 0,
              responseTime,
              modelUsed: result.selectedModel || ModelSize.SMALL,
              contextGraphOps: result.graphOperations || 0,
              vectorOperations: result.vectorOperations || 0,
              cacheHitRate: result.cacheHitRate || 0,
              semanticMatches: result.semanticMatches || 0,
              bTreeDepth: result.bTreeDepth || 0,
              bTreeOperationTime: result.bTreeOperationTime || 0
            });
          }
        } catch (error) {
          console.warn(`Request failed: ${error}`);
        }
      }, 1000 / workloadTest.requestRate);

      // Wait for test completion
      await new Promise(resolve => {
        const checkCompletion = setInterval(() => {
          if (Date.now() - startTime >= workloadTest.duration) {
            clearInterval(checkCompletion);
            resolve(undefined);
          }
        }, 1000);
      });

      // Analyze performance results
      expect(performanceResults.length).toBeGreaterThan(400); // Should have processed most requests

      const avgResponseTime = performanceResults.reduce((sum, r) => sum + r.responseTime, 0) / performanceResults.length;
      const avgCompressionRatio = performanceResults.reduce((sum, r) => sum + r.compressionRatio, 0) / performanceResults.length;
      const avgCacheHitRate = performanceResults.reduce((sum, r) => sum + r.cacheHitRate, 0) / performanceResults.length;

      // Validate performance metrics
      expect(avgResponseTime).toBeLessThan(3000); // Average < 3 seconds
      expect(avgCompressionRatio).toBeGreaterThan(0.2); // At least 20% compression
      expect(avgCacheHitRate).toBeGreaterThan(0.6); // At least 60% cache hit rate

      // Validate model distribution
      const modelUsage = performanceResults.reduce((acc: any, r) => {
        acc[r.modelUsed] = (acc[r.modelUsed] || 0) + 1;
        return acc;
      }, {});

      expect(modelUsage[ModelSize.SMALL]).toBeGreaterThan(0);
      expect(modelUsage[ModelSize.MEDIUM]).toBeGreaterThan(0);

      console.log(`✅ Comprehensive ACTA performance validation completed:`);
      console.log(`   Requests processed: ${performanceResults.length}`);
      console.log(`   Average response time: ${avgResponseTime.toFixed(0)}ms`);
      console.log(`   Average compression ratio: ${(avgCompressionRatio * 100).toFixed(1)}%`);
      console.log(`   Average cache hit rate: ${(avgCacheHitRate * 100).toFixed(1)}%`);
      console.log(`   Model usage:`, modelUsage);
    });

    it('should validate ACTA integration with other OSSA systems', async () => {
      if (!serviceAvailable || !actaInstance) return;

      // Test ACTA integration with VORTEX
      const vortexIntegrationResponse = await axios.post(
        `${testConfig.baseUrl}/integration/acta-vortex`,
        {
          actaInstance,
          testScenario: 'token-optimization-pipeline',
          inputText: 'Complex multi-system integration test with ACTA and VORTEX optimization',
          enableTokenReduction: true,
          enableContextPersistence: true
        }
      );

      expect(vortexIntegrationResponse.status).toBe(200);
      const vortexResult = vortexIntegrationResponse.data;

      expect(vortexResult.actaCompressionApplied).toBe(true);
      expect(vortexResult.vortexOptimizationApplied).toBe(true);
      expect(vortexResult.combinedTokenReduction).toBeGreaterThan(0.4); // 40% combined reduction

      // Test ACTA integration with feedback loops
      const feedbackIntegrationResponse = await axios.post(
        `${testConfig.baseUrl}/integration/acta-feedback`,
        {
          actaInstance,
          testScenario: 'adaptive-optimization-feedback',
          enableLearningFeedback: true,
          optimizationCycles: 5
        }
      );

      expect(feedbackIntegrationResponse.status).toBe(200);
      const feedbackResult = feedbackIntegrationResponse.data;

      expect(feedbackResult.optimizationCycles).toBe(5);
      expect(feedbackResult.performanceImprovement).toBeGreaterThan(0.1); // 10% improvement
      expect(feedbackResult.adaptationAccuracy).toBeGreaterThan(0.8); // 80% accuracy

      console.log(`✅ ACTA system integration validated with ${(vortexResult.combinedTokenReduction * 100).toFixed(1)}% combined optimization`);
    });
  });
});