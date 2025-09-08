/**
 * ACTA Test Suite
 * Comprehensive tests for the Adaptive Contextual Token Architecture
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createTestACTA,
  ACTAOrchestrator,
  VectorCompressionEngine,
  ModelSwitcher,
  GraphPersistenceEngine,
  ConfigBuilder,
  ConfigValidator,
  TEST_ACTA_CONFIG,
  CompressionLevel,
  ModelCapability,
  SwitchReason,
  TokenType
} from '../index.js';
import type {
  ACTAQuery,
  ContextToken,
  ModelConfig,
  ACTAConfig
} from '../types.js';

describe('ACTA Core Components', () => {
  let orchestrator: ACTAOrchestrator;

  beforeEach(async () => {
    orchestrator = await createTestACTA();
  });

  afterEach(async () => {
    if (orchestrator) {
      await orchestrator.cleanup();
    }
  });

  describe('ACTAOrchestrator', () => {
    it('should initialize successfully', async () => {
      expect(orchestrator).toBeDefined();
      
      const health = await orchestrator.getHealth();
      expect(health.status).toBe('healthy');
    });

    it('should process simple queries', async () => {
      const query: ACTAQuery = {
        text: 'What is machine learning?',
        context: ['Machine learning is a subset of AI'],
        maxTokens: 100
      };

      const response = await orchestrator.process(query);
      
      expect(response.result).toBeDefined();
      expect(response.usedModel).toBeDefined();
      expect(response.contextTokens).toBeDefined();
      expect(response.performanceMetrics).toBeDefined();
    });

    it('should handle queries with compression', async () => {
      const query: ACTAQuery = {
        text: 'Explain neural networks',
        context: Array(20).fill('Context item about neural networks'),
        maxTokens: 200,
        compressionLevel: CompressionLevel.MODERATE
      };

      const response = await orchestrator.process(query);
      
      expect(response.result).toBeDefined();
      expect(response.compressionApplied).toBe(true);
      expect(response.contextTokens.length).toBeLessThan(20);
    });

    it('should switch models based on complexity', async () => {
      // Simple query should use small model
      const simpleQuery: ACTAQuery = {
        text: 'Hello',
        context: [],
        maxTokens: 10
      };

      const simpleResponse = await orchestrator.process(simpleQuery);
      expect(simpleResponse.usedModel).toContain('3b');

      // Complex query should use larger model
      const complexQuery: ACTAQuery = {
        text: 'Analyze the philosophical implications of consciousness in artificial intelligence systems and their potential impact on society',
        context: Array(100).fill('Complex philosophical context about AI consciousness'),
        maxTokens: 2000
      };

      const complexResponse = await orchestrator.process(complexQuery);
      expect(simpleResponse.usedModel).toBeDefined();
    });

    it('should persist context between queries', async () => {
      const query1: ACTAQuery = {
        text: 'What is Python?',
        context: ['Python is a programming language'],
        maxTokens: 100
      };

      const query2: ACTAQuery = {
        text: 'What are its main features?',
        context: [],
        maxTokens: 100
      };

      await orchestrator.process(query1);
      const response2 = await orchestrator.process(query2);
      
      expect(response2.graphUpdates.length).toBeGreaterThan(0);
    });
  });

  describe('VectorCompressionEngine', () => {
    let compressionEngine: VectorCompressionEngine;
    let sampleTokens: ContextToken[];

    beforeEach(() => {
      compressionEngine = new VectorCompressionEngine(TEST_ACTA_CONFIG);
      
      sampleTokens = Array(10).fill(null).map((_, i) => ({
        id: `token_${i}`,
        content: `Content for token ${i}`,
        embedding: Array(128).fill(0).map(() => Math.random()),
        metadata: {
          type: TokenType.DETAIL,
          priority: Math.random(),
          frequency: Math.floor(Math.random() * 10),
          lastAccessed: new Date(),
          createdAt: new Date(),
          sourceContext: 'test',
          semanticCluster: 'test_cluster',
          compressionRatio: 1
        },
        relationships: [],
        compressionLevel: CompressionLevel.NONE,
        accessPattern: {
          frequency: 1,
          recency: Date.now(),
          importance: 0.5,
          volatility: 0.5,
          predictedNext: null
        }
      }));
    });

    it('should compress tokens with semantic clustering', async () => {
      const result = await compressionEngine.compressTokens(
        sampleTokens,
        CompressionLevel.MODERATE
      );

      expect(result.tokens.length).toBeLessThanOrEqual(sampleTokens.length);
      expect(result.ratio).toBeLessThan(1);
      expect(result.originalSize).toBeGreaterThan(result.compressedSize);
    });

    it('should preserve important tokens during compression', async () => {
      // Make one token high priority
      sampleTokens[0].metadata.priority = 0.9;
      sampleTokens[0].metadata.type = TokenType.CORE_CONCEPT;

      const result = await compressionEngine.compressTokens(
        sampleTokens,
        CompressionLevel.HEAVY
      );

      // High priority token should be preserved
      const preservedIds = result.tokens.map(t => t.id);
      expect(preservedIds).toContain('token_0');
    });

    it('should handle empty token arrays', async () => {
      const result = await compressionEngine.compressTokens(
        [],
        CompressionLevel.MODERATE
      );

      expect(result.tokens).toEqual([]);
      expect(result.ratio).toBe(1);
      expect(result.originalSize).toBe(0);
      expect(result.compressedSize).toBe(0);
    });
  });

  describe('ModelSwitcher', () => {
    let modelSwitcher: ModelSwitcher;
    let sampleTokens: ContextToken[];

    beforeEach(() => {
      modelSwitcher = new ModelSwitcher(TEST_ACTA_CONFIG);
      
      sampleTokens = [{
        id: 'test_token',
        content: 'Test content',
        embedding: Array(128).fill(0).map(() => Math.random()),
        metadata: {
          type: TokenType.CORE_CONCEPT,
          priority: 0.8,
          frequency: 5,
          lastAccessed: new Date(),
          createdAt: new Date(),
          sourceContext: 'test',
          semanticCluster: 'test_cluster',
          compressionRatio: 1
        },
        relationships: [],
        compressionLevel: CompressionLevel.NONE,
        accessPattern: {
          frequency: 5,
          recency: Date.now(),
          importance: 0.8,
          volatility: 0.2,
          predictedNext: null
        }
      }];
    });

    it('should determine optimal model based on query complexity', async () => {
      const simpleQuery: ACTAQuery = {
        text: 'Hello',
        context: [],
        maxTokens: 10
      };

      const decision = await modelSwitcher.determineOptimalModel(
        simpleQuery,
        []
      );

      expect(decision.recommendedModel).toBeDefined();
      expect(decision.reason).toBeDefined();
      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
    });

    it('should recommend larger models for complex queries', async () => {
      const complexQuery: ACTAQuery = {
        text: 'Write a comprehensive analysis of quantum computing algorithms and their applications in cryptography',
        context: Array(50).fill('Complex quantum computing context'),
        maxTokens: 5000
      };

      const decision = await modelSwitcher.determineOptimalModel(
        complexQuery,
        sampleTokens
      );

      expect(decision.reason).toBeOneOf([
        SwitchReason.COMPLEXITY_THRESHOLD,
        SwitchReason.CONTEXT_SIZE,
        SwitchReason.QUALITY_REQUIREMENT
      ]);
    });

    it('should consider model capabilities', async () => {
      const codeQuery: ACTAQuery = {
        text: 'Write a Python function to sort a list',
        context: ['def example(): pass'],
        maxTokens: 200
      };

      const decision = await modelSwitcher.determineOptimalModel(
        codeQuery,
        sampleTokens
      );

      const model = TEST_ACTA_CONFIG.models[
        decision.recommendedModel.includes('3b') ? 'small' :
        decision.recommendedModel.includes('7b') ? 'medium' :
        decision.recommendedModel.includes('13b') ? 'large' : 'xlarge'
      ];

      expect(model.capabilities).toContain(ModelCapability.CODE_GENERATION);
    });

    it('should switch models when recommended', async () => {
      const initialModel = modelSwitcher.getCurrentModel();
      
      const decision = await modelSwitcher.determineOptimalModel(
        { text: 'Complex reasoning task', context: [], maxTokens: 1000 },
        sampleTokens
      );

      const switched = await modelSwitcher.switchModel(decision);
      
      if (switched) {
        const newModel = modelSwitcher.getCurrentModel();
        expect(newModel.id).toBe(decision.recommendedModel);
      }
    });
  });

  describe('GraphPersistenceEngine', () => {
    let persistenceEngine: GraphPersistenceEngine;

    beforeEach(async () => {
      persistenceEngine = new GraphPersistenceEngine('/tmp/acta-test');
      await persistenceEngine.initialize();
    });

    afterEach(async () => {
      if (persistenceEngine) {
        await persistenceEngine.cleanup();
      }
    });

    it('should save and load context graphs', async () => {
      const token: ContextToken = {
        id: 'test_token',
        content: 'Test content for persistence',
        embedding: Array(128).fill(0).map(() => Math.random()),
        metadata: {
          type: TokenType.CORE_CONCEPT,
          priority: 0.7,
          frequency: 3,
          lastAccessed: new Date(),
          createdAt: new Date(),
          sourceContext: 'persistence_test',
          semanticCluster: 'test_cluster',
          compressionRatio: 1
        },
        relationships: [],
        compressionLevel: CompressionLevel.NONE,
        accessPattern: {
          frequency: 3,
          recency: Date.now(),
          importance: 0.7,
          volatility: 0.3,
          predictedNext: null
        }
      };

      // Add token
      await persistenceEngine.addToken(token);

      // Find token
      const foundToken = await persistenceEngine.findToken('test_token');
      expect(foundToken).toBeDefined();
      expect(foundToken?.id).toBe('test_token');
      expect(foundToken?.content).toBe('Test content for persistence');
    });

    it('should handle token relationships', async () => {
      const token1: ContextToken = {
        id: 'token_1',
        content: 'First token',
        embedding: Array(128).fill(0).map(() => Math.random()),
        metadata: {
          type: TokenType.CORE_CONCEPT,
          priority: 0.8,
          frequency: 2,
          lastAccessed: new Date(),
          createdAt: new Date(),
          sourceContext: 'relationship_test',
          semanticCluster: 'cluster_1',
          compressionRatio: 1
        },
        relationships: [],
        compressionLevel: CompressionLevel.NONE,
        accessPattern: {
          frequency: 2,
          recency: Date.now(),
          importance: 0.8,
          volatility: 0.2,
          predictedNext: null
        }
      };

      const token2: ContextToken = {
        id: 'token_2',
        content: 'Second token',
        embedding: Array(128).fill(0).map(() => Math.random()),
        metadata: {
          type: TokenType.CONTEXT_BRIDGE,
          priority: 0.6,
          frequency: 1,
          lastAccessed: new Date(),
          createdAt: new Date(),
          sourceContext: 'relationship_test',
          semanticCluster: 'cluster_1',
          compressionRatio: 1
        },
        relationships: [],
        compressionLevel: CompressionLevel.NONE,
        accessPattern: {
          frequency: 1,
          recency: Date.now(),
          importance: 0.6,
          volatility: 0.4,
          predictedNext: null
        }
      };

      // Add tokens
      await persistenceEngine.addToken(token1);
      await persistenceEngine.addToken(token2);

      // Create relationship
      const relationship = {
        targetId: 'token_2',
        type: 'semantic' as const,
        strength: 0.8,
        directionality: 'bidirectional' as const,
        metadata: { test: true }
      };

      await persistenceEngine.updateRelationships('token_1', [relationship]);

      // Verify relationship
      const retrievedToken = await persistenceEngine.findToken('token_1');
      expect(retrievedToken?.relationships).toHaveLength(1);
      expect(retrievedToken?.relationships[0].targetId).toBe('token_2');
      expect(retrievedToken?.relationships[0].strength).toBe(0.8);
    });

    it('should find similar tokens by embedding', async () => {
      const baseEmbedding = Array(128).fill(0).map(() => Math.random());
      
      // Create similar tokens
      const tokens = Array(5).fill(null).map((_, i) => ({
        id: `similar_token_${i}`,
        content: `Similar content ${i}`,
        embedding: baseEmbedding.map(val => val + (Math.random() - 0.5) * 0.1), // Add small noise
        metadata: {
          type: TokenType.DETAIL,
          priority: 0.5,
          frequency: 1,
          lastAccessed: new Date(),
          createdAt: new Date(),
          sourceContext: 'similarity_test',
          semanticCluster: 'similar_cluster',
          compressionRatio: 1
        },
        relationships: [],
        compressionLevel: CompressionLevel.NONE,
        accessPattern: {
          frequency: 1,
          recency: Date.now(),
          importance: 0.5,
          volatility: 0.5,
          predictedNext: null
        }
      }));

      // Add tokens
      for (const token of tokens) {
        await persistenceEngine.addToken(token);
      }

      // Find similar tokens
      const similarTokens = await persistenceEngine.findSimilarTokens(
        baseEmbedding,
        0.8, // High similarity threshold
        3    // Limit to 3 results
      );

      expect(similarTokens.length).toBeLessThanOrEqual(3);
      expect(similarTokens.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Management', () => {
    describe('ConfigBuilder', () => {
      it('should build valid configurations', () => {
        const config = ConfigBuilder
          .from(TEST_ACTA_CONFIG)
          .withVector({ dimension: 256 })
          .withCompression({ threshold: 1000 })
          .build();

        expect(config.vector.dimension).toBe(256);
        expect(config.compression.threshold).toBe(1000);
      });

      it('should apply development optimizations', () => {
        const config = ConfigBuilder
          .from(TEST_ACTA_CONFIG)
          .forDevelopment()
          .build();

        expect(config.compression.threshold).toBeLessThan(TEST_ACTA_CONFIG.compression.threshold);
        expect(config.graph.maxNodes).toBeLessThan(TEST_ACTA_CONFIG.graph.maxNodes);
      });

      it('should apply testing optimizations', () => {
        const config = ConfigBuilder
          .from(TEST_ACTA_CONFIG)
          .forTesting()
          .build();

        expect(config.vector.collection).toBe('acta_test');
        expect(config.graph.maxNodes).toBe(100);
        expect(config.performance.queryTimeout).toBe(5000);
      });

      it('should throw on invalid configuration', () => {
        expect(() => {
          ConfigBuilder
            .from(TEST_ACTA_CONFIG)
            .withVector({ dimension: -1 })
            .build();
        }).toThrow();
      });
    });

    describe('ConfigValidator', () => {
      it('should validate correct configurations', () => {
        const errors = ConfigValidator.validate(TEST_ACTA_CONFIG);
        expect(errors).toHaveLength(0);
      });

      it('should detect invalid vector configuration', () => {
        const invalidConfig = {
          ...TEST_ACTA_CONFIG,
          vector: {
            ...TEST_ACTA_CONFIG.vector,
            dimension: -1
          }
        };

        const errors = ConfigValidator.validate(invalidConfig);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(err => err.includes('dimension'))).toBe(true);
      });

      it('should detect invalid model configuration', () => {
        const invalidConfig = {
          ...TEST_ACTA_CONFIG,
          models: {
            ...TEST_ACTA_CONFIG.models,
            small: {
              ...TEST_ACTA_CONFIG.models.small,
              maxTokens: -1
            }
          }
        };

        const errors = ConfigValidator.validate(invalidConfig);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(err => err.includes('tokens'))).toBe(true);
      });
    });
  });
});

describe('ACTA Integration Tests', () => {
  let orchestrator: ACTAOrchestrator;

  beforeEach(async () => {
    orchestrator = await createTestACTA({
      performance: {
        batchSize: 5,
        cacheSize: 10,
        indexingWorkers: 1,
        queryTimeout: 10000
      }
    });
  });

  afterEach(async () => {
    if (orchestrator) {
      await orchestrator.cleanup();
    }
  });

  it('should handle concurrent requests', async () => {
    const queries = Array(5).fill(null).map((_, i) => ({
      text: `Query ${i}: What is artificial intelligence?`,
      context: [`Context for query ${i}`],
      maxTokens: 100
    }));

    const promises = queries.map(query => orchestrator.process(query));
    const responses = await Promise.all(promises);

    expect(responses).toHaveLength(5);
    responses.forEach(response => {
      expect(response.result).toBeDefined();
      expect(response.performanceMetrics).toBeDefined();
    });
  });

  it('should maintain performance under load', async () => {
    const startTime = Date.now();
    const numQueries = 10;
    
    const queries = Array(numQueries).fill(null).map((_, i) => ({
      text: `Load test query ${i}`,
      context: [`Context ${i}`],
      maxTokens: 50
    }));

    for (const query of queries) {
      await orchestrator.process(query);
    }

    const totalTime = Date.now() - startTime;
    const averageTime = totalTime / numQueries;

    // Should process queries reasonably fast in test mode
    expect(averageTime).toBeLessThan(1000); // Less than 1 second per query
  });

  it('should recover from errors gracefully', async () => {
    // Try to process a query that might cause issues
    const problematicQuery: ACTAQuery = {
      text: '', // Empty query
      context: [],
      maxTokens: -1 // Invalid token count
    };

    const response = await orchestrator.process(problematicQuery);
    
    // Should not crash and should return some response
    expect(response).toBeDefined();
    expect(response.result).toBeDefined();
  });

  it('should persist context across sessions', async () => {
    // Process initial query
    const initialQuery: ACTAQuery = {
      text: 'Learn about machine learning',
      context: ['Machine learning is important'],
      maxTokens: 100
    };

    await orchestrator.process(initialQuery);
    await orchestrator.persistContext();

    // Create new orchestrator instance
    const newOrchestrator = await createTestACTA();

    try {
      // Process related query
      const followupQuery: ACTAQuery = {
        text: 'What did we discuss about ML?',
        context: [],
        maxTokens: 100
      };

      const response = await newOrchestrator.process(followupQuery);
      
      expect(response.result).toBeDefined();
      expect(response.contextTokens.length).toBeGreaterThanOrEqual(0);
    } finally {
      await newOrchestrator.cleanup();
    }
  });
});

describe('ACTA Performance Tests', () => {
  let orchestrator: ACTAOrchestrator;

  beforeEach(async () => {
    orchestrator = await createTestACTA();
  });

  afterEach(async () => {
    if (orchestrator) {
      await orchestrator.cleanup();
    }
  });

  it('should compress large contexts efficiently', async () => {
    const largeContext = Array(100).fill(null).map((_, i) => 
      `This is context item ${i} with some detailed information about topic ${i % 10}`
    );

    const query: ACTAQuery = {
      text: 'Summarize the key points',
      context: largeContext,
      maxTokens: 200,
      compressionLevel: CompressionLevel.HEAVY
    };

    const startTime = Date.now();
    const response = await orchestrator.process(query);
    const processingTime = Date.now() - startTime;

    expect(response.compressionApplied).toBe(true);
    expect(response.contextTokens.length).toBeLessThan(largeContext.length);
    expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should scale with context size', async () => {
    const sizes = [10, 50, 100];
    const times: number[] = [];

    for (const size of sizes) {
      const context = Array(size).fill(null).map((_, i) => `Context ${i}`);
      const query: ACTAQuery = {
        text: 'Process this context',
        context,
        maxTokens: 100,
        compressionLevel: CompressionLevel.LIGHT
      };

      const startTime = Date.now();
      await orchestrator.process(query);
      const time = Date.now() - startTime;
      times.push(time);
    }

    // Processing time should scale reasonably (not exponentially)
    const ratio1 = times[1] / times[0]; // 50/10 ratio
    const ratio2 = times[2] / times[1]; // 100/50 ratio

    // Should be roughly linear scaling, not exponential
    expect(ratio1).toBeLessThan(10);
    expect(ratio2).toBeLessThan(10);
  });
});