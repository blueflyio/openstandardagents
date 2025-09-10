/**
 * Integration Test Data Fixtures - OSSA v0.1.8
 * 
 * Comprehensive test data for integration testing of:
 * - 360° Feedback Loop system
 * - ACTA token optimization
 * - VORTEX system performance
 * - Cross-system integration scenarios
 */

// Feedback Loop Test Data
export const FEEDBACK_LOOP_TEST_DATA = {
  agentConfigurations: [
    {
      id: 'quality-judge-test',
      type: 'judge',
      subtype: 'quality',
      capabilities: ['quality-assessment', 'criteria-evaluation', 'score-calculation'],
      weight: 0.3,
      performance: {
        accuracy: 0.92,
        responseTime: 1200,
        completeness: 0.88
      },
      testScenarios: [
        {
          input: 'Evaluate the quality of multi-agent coordination response',
          expectedOutput: { score: 85, criteria: ['accuracy', 'completeness', 'coherence'] },
          complexity: 'medium'
        }
      ]
    },
    {
      id: 'compliance-judge-test', 
      type: 'judge',
      subtype: 'compliance',
      capabilities: ['regulatory-check', 'policy-validation', 'audit-trail'],
      weight: 0.25,
      performance: {
        accuracy: 0.95,
        responseTime: 1800,
        completeness: 0.91
      },
      frameworks: ['NIST-AI-RMF', 'ISO-42001', 'GDPR-AI'],
      testScenarios: [
        {
          input: 'Validate AI agent response for GDPR compliance',
          expectedOutput: { compliant: true, gaps: [], recommendations: [] },
          complexity: 'high'
        }
      ]
    },
    {
      id: 'performance-critic-test',
      type: 'critic', 
      subtype: 'performance',
      capabilities: ['bottleneck-analysis', 'optimization-recommendations', 'metric-tracking'],
      weight: 0.25,
      performance: {
        accuracy: 0.89,
        responseTime: 900,
        completeness: 0.94
      },
      testScenarios: [
        {
          input: 'Analyze system performance bottlenecks in token processing',
          expectedOutput: { bottlenecks: ['vector-search', 'cache-miss'], optimizations: ['batch-processing', 'cache-warmup'] },
          complexity: 'high'
        }
      ]
    },
    {
      id: 'workflow-coordinator-test',
      type: 'orchestrator',
      subtype: 'coordinator', 
      capabilities: ['task-routing', 'load-balancing', 'priority-management'],
      weight: 0.2,
      performance: {
        accuracy: 0.87,
        responseTime: 1100,
        completeness: 0.85
      },
      testScenarios: [
        {
          input: 'Coordinate multi-system optimization workflow',
          expectedOutput: { tasks: 5, routing: 'optimized', priority: 'high' },
          complexity: 'extreme'
        }
      ]
    }
  ],

  feedbackScenarios: [
    {
      id: 'quality-improvement-cycle',
      description: 'Multi-iteration quality improvement through feedback',
      iterations: 8,
      baselineMetrics: { accuracy: 0.75, speed: 1500 },
      targetImprovement: 0.15,
      expectedPattern: 'gradual-improvement-with-plateaus'
    },
    {
      id: 'cross-agent-learning',
      description: 'Knowledge transfer between different agent types',
      participants: ['quality-judge', 'performance-critic'],
      knowledgeDomains: ['assessment-criteria', 'optimization-strategies'],
      expectedTransferEfficiency: 0.7
    },
    {
      id: 'adaptive-workflow-optimization',
      description: 'Workflow adaptation based on performance feedback',
      workflowTypes: ['simple', 'moderate', 'complex', 'extreme'],
      adaptationThreshold: 0.1,
      expectedAdaptations: ['routing-optimization', 'load-rebalancing', 'priority-adjustment']
    }
  ],

  performanceProfiles: [
    {
      name: 'baseline-performance',
      responseTime: 2000,
      successRate: 0.85,
      qualityScore: 0.78,
      improvementRate: 0
    },
    {
      name: 'feedback-optimized',
      responseTime: 1400,
      successRate: 0.93,
      qualityScore: 0.89,
      improvementRate: 0.14
    },
    {
      name: 'fully-adapted',
      responseTime: 1200,
      successRate: 0.96,
      qualityScore: 0.92,
      improvementRate: 0.18
    }
  ]
};

// ACTA Test Data
export const ACTA_TEST_DATA = {
  compressionTestCases: [
    {
      level: 'light',
      input: {
        text: 'Simple query about weather conditions and basic information retrieval',
        context: ['Current weather is sunny', 'Temperature is 72F', 'Light winds from the west'],
        tokens: 45
      },
      expected: {
        compressionRatio: { min: 0.1, max: 0.2 },
        compressedTokens: { min: 36, max: 40 },
        vectorOperations: { min: 1, max: 3 },
        responseTime: { max: 1000 }
      }
    },
    {
      level: 'moderate',
      input: {
        text: 'Analyze the relationship between quantum mechanics and general relativity in modern physics, considering both theoretical foundations and practical implications',
        context: [
          'Quantum mechanics describes atomic-scale phenomena',
          'General relativity explains gravity and spacetime',
          'Both theories are fundamental to physics',
          'Unification attempts include string theory and loop quantum gravity',
          'Experimental validation continues to challenge both frameworks'
        ],
        tokens: 120
      },
      expected: {
        compressionRatio: { min: 0.3, max: 0.4 },
        compressedTokens: { min: 72, max: 84 },
        vectorOperations: { min: 5, max: 10 },
        responseTime: { max: 2000 }
      }
    },
    {
      level: 'heavy', 
      input: {
        text: 'Conduct comprehensive analysis of multi-dimensional climate change impacts on global supply chains, considering economic, environmental, social factors across industries and regions',
        context: Array.from({ length: 15 }, (_, i) => 
          `Detailed context item ${i + 1} covering various aspects of climate impact analysis including economic modeling, environmental assessment, social implications, and regional variations`
        ),
        tokens: 350
      },
      expected: {
        compressionRatio: { min: 0.5, max: 0.6 },
        compressedTokens: { min: 140, max: 175 },
        vectorOperations: { min: 15, max: 25 },
        responseTime: { max: 3000 }
      }
    },
    {
      level: 'maximum',
      input: {
        text: 'Design comprehensive autonomous AI system for smart city infrastructure management optimizing sustainability, citizen welfare, economic efficiency, emergency response with real-time data integration, ethical constraints, regulatory compliance across multiple domains',
        context: Array.from({ length: 25 }, (_, i) => 
          `Complex smart city context item ${i + 1} detailing infrastructure components, sensor networks, data flows, citizen services, emergency protocols, sustainability metrics, economic models, ethical frameworks, regulatory requirements, and cross-domain integration challenges`
        ),
        tokens: 650
      },
      expected: {
        compressionRatio: { min: 0.7, max: 0.8 },
        compressedTokens: { min: 130, max: 195 },
        vectorOperations: { min: 25, max: 40 },
        responseTime: { max: 5000 }
      }
    }
  ],

  modelSwitchingScenarios: [
    {
      complexity: 'low',
      query: 'What is the current time?',
      expectedModel: 'small',
      expectedLatency: { max: 200 },
      contextWindow: 1000,
      capabilities: ['basic-qa']
    },
    {
      complexity: 'medium',
      query: 'Explain the differences between supervised and unsupervised learning in machine learning',
      expectedModel: 'medium',
      expectedLatency: { max: 400 },
      contextWindow: 5000,
      capabilities: ['explanation', 'comparison']
    },
    {
      complexity: 'high',
      query: 'Analyze market trends, competitor strategies, and recommend comprehensive business strategy for emerging technology startup',
      expectedModel: 'large',
      expectedLatency: { max: 800 },
      contextWindow: 15000,
      capabilities: ['analysis', 'reasoning', 'strategy']
    },
    {
      complexity: 'extreme',
      query: 'Design multi-modal AI architecture integrating computer vision, NLP, robotics for autonomous healthcare assistant with ethical AI constraints',
      expectedModel: 'xlarge',
      expectedLatency: { max: 1600 },
      contextWindow: 30000,
      capabilities: ['design', 'integration', 'multimodal', 'ethics']
    }
  ],

  contextGraphTestData: [
    {
      scenario: 'small-graph',
      nodes: 50,
      relationships: 100,
      expectedHeight: { max: 6 },
      operationTime: { max: 10 },
      cacheHitRate: { min: 0.6 }
    },
    {
      scenario: 'medium-graph',
      nodes: 500,
      relationships: 1000,
      expectedHeight: { max: 9 },
      operationTime: { max: 15 },
      cacheHitRate: { min: 0.7 }
    },
    {
      scenario: 'large-graph',
      nodes: 5000,
      relationships: 10000,
      expectedHeight: { max: 13 },
      operationTime: { max: 25 },
      cacheHitRate: { min: 0.75 }
    },
    {
      scenario: 'xlarge-graph',
      nodes: 50000,
      relationships: 100000,
      expectedHeight: { max: 16 },
      operationTime: { max: 40 },
      cacheHitRate: { min: 0.8 }
    }
  ]
};

// VORTEX Test Data
export const VORTEX_TEST_DATA = {
  tokenTypeTestCases: {
    context: [
      {
        token: '{CONTEXT:workflow:current:agent-roles}',
        resolution: '["quality-judge", "compliance-judge", "performance-critic", "workflow-coordinator"]',
        cachePolicy: 'medium-term',
        cacheDuration: { min: 60000, max: 300000 },
        dependencies: ['{CONTEXT:session:active:user-permissions}'],
        expectedHitRate: 0.8
      },
      {
        token: '{CONTEXT:session:active:user-preferences}', 
        resolution: '{"theme": "dark", "language": "en-US", "notifications": {"email": true, "push": false}}',
        cachePolicy: 'medium-term',
        cacheDuration: { min: 60000, max: 300000 },
        dependencies: [],
        expectedHitRate: 0.85
      },
      {
        token: '{CONTEXT:workflow:history:performance-trends}',
        resolution: '{"improvement_rate": 0.23, "consistency": 0.91, "peak_performance": "14:30-16:00"}',
        cachePolicy: 'medium-term',
        cacheDuration: { min: 120000, max: 300000 },
        dependencies: ['{METRICS:performance:historical:data}'],
        expectedHitRate: 0.9
      }
    ],
    data: [
      {
        token: '{DATA:artifact:v1:user-requirements}',
        resolution: 'Comprehensive requirements document: 47 functional requirements, 23 non-functional requirements, 12 integration requirements, quality gates defined',
        cachePolicy: 'long-term',
        cacheDuration: { min: 300000, max: 600000 },
        dataSize: 15000,
        expectedHitRate: 0.95
      },
      {
        token: '{DATA:schema:current:api-specification}',
        resolution: 'OpenAPI 3.1 specification: 127 endpoints, comprehensive validation schemas, authentication mechanisms, rate limiting, versioning strategy',
        cachePolicy: 'long-term',
        cacheDuration: { min: 450000, max: 600000 },
        dataSize: 32000,
        expectedHitRate: 0.98
      },
      {
        token: '{DATA:configuration:system:optimization-settings}',
        resolution: 'System optimization configuration: cache_size=2048, batch_size=64, concurrency=32, timeout=5000, retry_attempts=3',
        cachePolicy: 'long-term',
        cacheDuration: { min: 300000, max: 480000 },
        dataSize: 5000,
        expectedHitRate: 0.92
      }
    ],
    state: [
      {
        token: '{STATE:agent:orchestrator:current-plan}',
        resolution: 'Execution plan: 12 active tasks, 5 pending reviews, 3 blocked dependencies, estimated completion: 2h 35m',
        cachePolicy: 'short-term', 
        cacheDuration: { min: 0, max: 60000 },
        volatility: 'high',
        expectedHitRate: 0.4
      },
      {
        token: '{STATE:workflow:feedback:iteration-count}',
        resolution: '23',
        cachePolicy: 'short-term',
        cacheDuration: { min: 15000, max: 60000 },
        volatility: 'medium',
        expectedHitRate: 0.6
      },
      {
        token: '{STATE:system:health:component-status}',
        resolution: '{"orchestrator": "healthy", "judges": "healthy", "critics": "degraded", "workers": "healthy"}',
        cachePolicy: 'short-term',
        cacheDuration: { min: 0, max: 30000 },
        volatility: 'high',
        expectedHitRate: 0.3
      }
    ],
    metrics: [
      {
        token: '{METRICS:cost:current:token-usage}',
        resolution: '45627',
        cachePolicy: 'short-term',
        cacheDuration: { min: 0, max: 30000 },
        updateFrequency: 5000,
        expectedHitRate: 0.5
      },
      {
        token: '{METRICS:performance:agent:response-time}',
        resolution: '1247ms',
        cachePolicy: 'short-term',
        cacheDuration: { min: 0, max: 15000 },
        updateFrequency: 1000,
        expectedHitRate: 0.3
      },
      {
        token: '{METRICS:quality:current:success-rate}',
        resolution: '0.943',
        cachePolicy: 'short-term', 
        cacheDuration: { min: 5000, max: 60000 },
        updateFrequency: 10000,
        expectedHitRate: 0.7
      }
    ],
    temporal: [
      {
        token: '{TEMPORAL:schedule:daily:agent-rotation}',
        resolution: '2024-12-08T14:30:00Z',
        cachePolicy: 'no-cache',
        cacheDuration: 0,
        expiryTime: 1800000,
        expectedHitRate: 0
      },
      {
        token: '{TEMPORAL:deadline:task:completion-time}',
        resolution: '2024-12-08T16:45:00Z',
        cachePolicy: 'no-cache',
        cacheDuration: 0,
        expiryTime: 3600000,
        expectedHitRate: 0
      },
      {
        token: '{TEMPORAL:event:next:maintenance-window}',
        resolution: '2024-12-09T02:00:00Z',
        cachePolicy: 'no-cache',
        cacheDuration: 0,
        expiryTime: 86400000,
        expectedHitRate: 0
      }
    ]
  },

  performanceTestScenarios: [
    {
      name: 'token-reduction-validation',
      description: 'Validate 67% token reduction through caching and deduplication',
      testCases: [
        {
          text: `Multi-token test: ${'{CONTEXT:workflow:current:status}'} with ${'{DATA:artifact:v1:requirements}'} and ${'{METRICS:performance:current:stats}'}`,
          expectedReduction: 0.65,
          baselineTokens: 150,
          optimizedTokens: 52
        },
        {
          text: `Complex scenario: ${'{DATA:schema:api:v2}'} integrated with ${'{CONTEXT:session:user:preferences}'} and ${'{TEMPORAL:schedule:current:events}'}`,
          expectedReduction: 0.7,
          baselineTokens: 200,
          optimizedTokens: 60
        }
      ],
      targetReduction: 0.67
    },
    {
      name: 'latency-improvement-validation',
      description: 'Validate 45% latency improvement through JIT resolution',
      testCases: [
        {
          scenario: 'cache-hit-scenario',
          baselineLatency: 1500,
          optimizedLatency: 825,
          expectedImprovement: 0.45
        },
        {
          scenario: 'jit-resolution-scenario',
          baselineLatency: 2000,
          optimizedLatency: 1100,
          expectedImprovement: 0.45
        }
      ],
      targetImprovement: 0.45
    },
    {
      name: 'cache-hit-rate-validation',
      description: 'Validate 85%+ cache hit rate with adaptive policies',
      testCases: [
        {
          tokenMix: { context: 0.3, data: 0.25, state: 0.2, metrics: 0.15, temporal: 0.1 },
          requests: 1000,
          expectedHitRate: 0.85,
          adaptiveDuration: true
        }
      ],
      targetHitRate: 0.85
    }
  ],

  errorHandlingScenarios: [
    {
      type: 'resolver-timeout',
      description: 'Resolver timeout with fallback recovery',
      configuration: { timeout: 6000, fallbackEnabled: true },
      expectedRecovery: true,
      expectedFallbackUsage: true,
      maxRecoveryTime: 2000
    },
    {
      type: 'cache-failure',
      description: 'Cache system failure with graceful degradation',
      configuration: { cacheUnavailable: true, acceptStale: true },
      expectedRecovery: true,
      expectedGracefulDegradation: true,
      maxDegradationTime: 5000
    },
    {
      type: 'vector-search-error',
      description: 'Vector database unavailable with similarity fallback',
      configuration: { vectorDbDown: true, semanticFallback: true },
      expectedRecovery: true,
      expectedAlternativeMatching: true,
      maxFallbackTime: 3000
    },
    {
      type: 'circuit-breaker-trigger',
      description: 'Circuit breaker activation and recovery',
      configuration: { failureThreshold: 5, halfOpenTimeout: 10000 },
      expectedRecovery: true,
      expectedGradualRecovery: true,
      maxCircuitOpenTime: 15000
    }
  ]
};

// Cross-System Integration Test Data
export const CROSS_SYSTEM_TEST_DATA = {
  integrationScenarios: [
    {
      name: 'feedback-acta-integration',
      description: 'Feedback loop optimizing ACTA performance',
      systems: ['feedback', 'acta'],
      testCases: [
        {
          query: 'Complex analysis requiring model selection optimization',
          feedbackCycles: 5,
          expectedModelOptimization: 0.2,
          expectedCompressionImprovement: 0.15
        }
      ],
      expectedSynergy: 0.25
    },
    {
      name: 'feedback-vortex-integration',
      description: 'Feedback loop optimizing VORTEX caching',
      systems: ['feedback', 'vortex'],
      testCases: [
        {
          cacheOptimizationScenarios: ['frequent-access', 'volatile-data', 'temporal-patterns'],
          feedbackCycles: 8,
          expectedCacheImprovement: 0.3
        }
      ],
      expectedSynergy: 0.25
    },
    {
      name: 'acta-vortex-integration',
      description: 'Combined ACTA compression and VORTEX optimization',
      systems: ['acta', 'vortex'],
      testCases: [
        {
          text: 'Multi-system optimization test case with complex token patterns',
          expectedActaCompression: 0.5,
          expectedVortexReduction: 0.4,
          expectedCombinedOptimization: 0.7
        }
      ],
      expectedSynergy: 0.3
    },
    {
      name: 'all-systems-integration',
      description: 'All three systems working together',
      systems: ['feedback', 'acta', 'vortex'],
      testCases: [
        {
          workloadProfile: 'comprehensive',
          duration: 120000,
          requestRate: 25,
          expectedCombinedOptimization: 0.75,
          expectedLatencyImprovement: 0.55
        }
      ],
      expectedSynergy: 0.4
    }
  ],

  performanceTargets: {
    combinedTokenReduction: 0.75,
    combinedLatencyImprovement: 0.55,
    adaptationAccuracy: 0.9,
    systemResilience: 0.98,
    learningVelocity: 0.2
  },

  resilienceScenarios: [
    {
      name: 'component-failure-resilience',
      failureTypes: ['single-agent-failure', 'partial-system-failure', 'network-partition'],
      expectedRecovery: 0.95,
      maxRecoveryTime: 10000,
      gracefulDegradation: true
    },
    {
      name: 'load-scaling-resilience', 
      loadProfiles: [
        { name: 'baseline', rps: 10, duration: 30000 },
        { name: 'moderate', rps: 25, duration: 60000 },
        { name: 'high', rps: 40, duration: 90000 },
        { name: 'extreme', rps: 60, duration: 120000 }
      ],
      maxDegradation: 0.3,
      minUptime: 0.95
    }
  ]
};

// Mock Service Configurations
export const MOCK_SERVICES_CONFIG = {
  feedbackLoopService: {
    port: 4001,
    endpoints: [
      'POST /feedback-loops',
      'GET /feedback-loops/:id',
      'DELETE /feedback-loops/:id',
      'POST /feedback-loops/:id/feedback',
      'GET /feedback-loops/:id/metrics',
      'POST /feedback-loops/:id/analyze'
    ],
    latencySimulation: { min: 100, max: 500 },
    errorRate: 0.02
  },
  
  actaService: {
    port: 4002,
    endpoints: [
      'POST /acta/initialize',
      'DELETE /acta/:id',
      'POST /acta/:id/process',
      'POST /acta/:id/compress',
      'GET /acta/:id/status',
      'GET /acta/:id/metrics'
    ],
    latencySimulation: { min: 200, max: 1000 },
    errorRate: 0.01
  },

  vortexService: {
    port: 4003,
    endpoints: [
      'POST /vortex/initialize',
      'DELETE /vortex/:id', 
      'POST /vortex/:id/process-text',
      'GET /vortex/:id/status',
      'GET /vortex/:id/metrics',
      'POST /vortex/:id/simulate-error'
    ],
    latencySimulation: { min: 50, max: 300 },
    errorRate: 0.015
  },

  crossSystemService: {
    port: 4004,
    endpoints: [
      'POST /cross-system/connect',
      'POST /cross-system/process-all-systems',
      'POST /cross-system/process-feedback-acta',
      'POST /cross-system/process-feedback-vortex',
      'POST /cross-system/process-acta-vortex'
    ],
    latencySimulation: { min: 300, max: 1500 },
    errorRate: 0.025
  }
};

// Utility functions for test data generation
export const TEST_DATA_UTILS = {
  generateRandomTokens: (count: number, types: string[]) => {
    return Array.from({ length: count }, (_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      return {
        token: `{${type}:test:generated:token-${i}}`,
        type,
        resolution: `Generated test resolution ${i}`,
        timestamp: new Date()
      };
    });
  },

  generatePerformanceSequence: (baseline: number, improvement: number, iterations: number) => {
    return Array.from({ length: iterations }, (_, i) => {
      const progress = i / (iterations - 1);
      const improvementCurve = 1 - Math.exp(-3 * progress); // Exponential improvement curve
      return baseline * (1 - (improvement * improvementCurve));
    });
  },

  generateWorkloadProfile: (peakRPS: number, duration: number, pattern: 'constant' | 'ramp-up' | 'spike' | 'variable') => {
    const points = Math.ceil(duration / 1000); // One point per second
    
    switch (pattern) {
      case 'constant':
        return Array(points).fill(peakRPS);
      
      case 'ramp-up':
        return Array.from({ length: points }, (_, i) => Math.floor((i / points) * peakRPS));
      
      case 'spike':
        return Array.from({ length: points }, (_, i) => {
          const spikePoint = Math.floor(points * 0.6);
          return i === spikePoint ? peakRPS : Math.floor(peakRPS * 0.3);
        });
      
      case 'variable':
        return Array.from({ length: points }, (_, i) => {
          const variation = Math.sin((i / points) * 4 * Math.PI) * 0.3;
          return Math.floor(peakRPS * (0.7 + variation));
        });
      
      default:
        return Array(points).fill(peakRPS);
    }
  },

  validatePerformanceMetrics: (metrics: any, targets: any, tolerance: number = 0.1) => {
    const validations: { metric: string; passed: boolean; actual: number; target: number }[] = [];
    
    Object.keys(targets).forEach(key => {
      if (metrics[key] !== undefined) {
        const actual = metrics[key];
        const target = targets[key];
        const passed = Math.abs(actual - target) <= (target * tolerance);
        
        validations.push({ metric: key, passed, actual, target });
      }
    });
    
    return validations;
  }
};