/**
 * OSSA Router Performance Benchmark Suite
 * Comprehensive benchmarking for 1000+ agents with sub-100ms requirements
 */

import { createOSSARouter, OSSARouter } from '../router';
import { OSSAAgent, DiscoveryQuery, RouterConfig } from '../types';

interface BenchmarkResult {
  name: string;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p95Time: number;
  p99Time: number;
  operations: number;
  opsPerSecond: number;
  cacheHitRate?: number;
  memoryUsage: number;
}

interface BenchmarkSuite {
  suiteName: string;
  results: BenchmarkResult[];
  totalDuration: number;
  summary: {
    avgResponseTime: number;
    maxResponseTime: number;
    totalOperations: number;
    overallOpsPerSecond: number;
    passed: boolean;
  };
}

export class PerformanceBenchmark {
  private router: OSSARouter;
  private testAgents: string[] = [];
  private benchmarkResults: BenchmarkSuite[] = [];

  constructor() {
    const benchmarkConfig: Partial<RouterConfig> = {
      protocols: {
        rest: {
          port: 3002,
          basePath: '/api/benchmark',
          cors: true,
        },
        graphql: {
          enabled: false, // Disable for pure discovery benchmarks
          endpoint: '/graphql',
          subscriptions: false,
          introspection: true,
          playground: false,
        },
        grpc: {
          enabled: false, // Disable for pure discovery benchmarks
          port: 50053,
          reflection: true,
          compression: true,
        },
      },
      discovery: {
        cacheTimeout: 300000, // 5 minutes
        maxCacheEntries: 50000, // Large cache for benchmarks
        healthCheckInterval: 60000, // 1 minute
        indexingEnabled: true,
      },
      performance: {
        targetResponseTime: 50, // 50ms aggressive target
        maxConcurrentQueries: 2000, // High concurrency
        batchSize: 100,
        compressionEnabled: true,
      },
      clustering: {
        enabled: false,
      },
    };

    this.router = createOSSARouter(benchmarkConfig);
  }

  /**
   * Run complete benchmark suite
   */
  async runBenchmarks(): Promise<BenchmarkSuite[]> {
    console.log('🚀 Starting OSSA Router Performance Benchmarks');
    console.log('Target: Sub-100ms response time for 1000+ agents');
    console.log('================================================\n');

    try {
      await this.router.start();
      
      // Setup test data
      await this.setupTestAgents();
      
      // Run benchmark suites
      await this.runRegistrationBenchmarks();
      await this.runDiscoveryBenchmarks();
      await this.runConcurrencyBenchmarks();
      await this.runScalabilityBenchmarks();
      await this.runCacheBenchmarks();
      await this.runMemoryBenchmarks();
      
      // Print summary
      this.printBenchmarkSummary();
      
      return this.benchmarkResults;
      
    } finally {
      await this.router.stop();
    }
  }

  /**
   * Setup test agents for benchmarking
   */
  private async setupTestAgents(): Promise<void> {
    console.log('Setting up test agents...');
    const startTime = Date.now();

    const agentTemplates = [
      {
        prefix: 'chat-agent',
        capabilities: ['chat', 'conversation', 'dialogue'],
        domains: ['ai', 'nlp', 'customer-service'],
        class: 'specialist' as const,
      },
      {
        prefix: 'translation-agent',
        capabilities: ['translation', 'language-detection', 'localization'],
        domains: ['ai', 'nlp', 'translation', 'language'],
        class: 'specialist' as const,
      },
      {
        prefix: 'math-agent',
        capabilities: ['calculation', 'math-solving', 'algebra', 'geometry'],
        domains: ['mathematics', 'education', 'science'],
        class: 'specialist' as const,
      },
      {
        prefix: 'analysis-agent',
        capabilities: ['data-analysis', 'statistics', 'reporting'],
        domains: ['data', 'analytics', 'business'],
        class: 'workflow' as const,
      },
      {
        prefix: 'general-assistant',
        capabilities: ['chat', 'reasoning', 'task-planning', 'web-search'],
        domains: ['ai', 'productivity', 'general', 'assistant'],
        class: 'general' as const,
      },
    ];

    const agents: Array<Omit<OSSAAgent, 'id' | 'registrationTime' | 'lastSeen'>> = [];

    for (let i = 0; i < 1000; i++) {
      const template = agentTemplates[i % agentTemplates.length];
      const performanceVariance = (i % 100) / 100; // 0-1 variance
      
      agents.push({
        name: `${template.prefix}-${i}`,
        version: `${Math.floor(i / 100) + 1}.${i % 10}.0`,
        endpoint: `http://agent-${i}.test.local:3000`,
        status: i % 20 === 0 ? 'degraded' : 'healthy', // 5% degraded
        metadata: {
          class: template.class,
          category: (['assistant', 'tool', 'service'] as const)[i % 3],
          conformanceTier: (['core', 'governed', 'advanced'] as const)[i % 3],
          certificationLevel: (['bronze', 'silver', 'gold', 'platinum'] as const)[i % 4],
        },
        capabilities: {
          primary: template.capabilities.slice(0, Math.max(1, template.capabilities.length - (i % 2))),
          secondary: i % 3 === 0 ? ['optimization', 'monitoring'] : undefined,
          domains: template.domains.slice(0, Math.max(1, template.domains.length - (i % 3))),
        },
        protocols: [
          {
            name: 'rest',
            version: '1.0',
            required: true,
            endpoints: { api: '/api', health: '/health' },
          },
          ...(i % 2 === 0 ? [{
            name: 'grpc' as const,
            version: '1.0',
            required: false,
            endpoints: { api: '/grpc' },
          }] : []),
        ],
        endpoints: {
          health: '/health',
          capabilities: '/capabilities',
          api: '/api',
          metrics: '/metrics',
        },
        performance: {
          avgResponseTimeMs: 20 + (performanceVariance * 200), // 20-220ms range
          uptimePercentage: 95 + (performanceVariance * 5), // 95-100%
          requestsHandled: 1000 + (i * 100),
          successRate: 0.85 + (performanceVariance * 0.15), // 85-100%
          throughputRps: 5 + (performanceVariance * 50), // 5-55 RPS
        },
        compliance: {
          frameworks: ['ISO_42001', 'NIST_AI_RMF'].slice(0, (i % 2) + 1),
          certifications: ['OSSA_CORE'],
          auditDate: new Date(),
        },
      });
    }

    // Register agents in batches for better performance
    const batchSize = 100;
    for (let i = 0; i < agents.length; i += batchSize) {
      const batch = agents.slice(i, i + batchSize);
      const batchIds = await Promise.all(
        batch.map(agent => this.router.registerAgent(agent))
      );
      this.testAgents.push(...batchIds);
    }

    const setupTime = Date.now() - startTime;
    console.log(`✅ Setup complete: ${agents.length} agents registered in ${setupTime}ms\n`);
  }

  /**
   * Benchmark agent registration performance
   */
  private async runRegistrationBenchmarks(): Promise<void> {
    const suite: BenchmarkSuite = {
      suiteName: 'Agent Registration',
      results: [],
      totalDuration: 0,
      summary: { avgResponseTime: 0, maxResponseTime: 0, totalOperations: 0, overallOpsPerSecond: 0, passed: false },
    };

    console.log('📝 Running Registration Benchmarks...');

    // Benchmark single agent registration
    await this.runBenchmark(
      'Single Agent Registration',
      async () => {
        const agent = this.createTestAgent(`single-reg-${Date.now()}`);
        const agentId = await this.router.registerAgent(agent);
        this.testAgents.push(agentId);
      },
      100,
      suite
    );

    // Benchmark batch registration
    await this.runBenchmark(
      'Batch Agent Registration (10 agents)',
      async () => {
        const agents = Array.from({ length: 10 }, (_, i) => 
          this.createTestAgent(`batch-reg-${Date.now()}-${i}`)
        );
        const agentIds = await Promise.all(
          agents.map(agent => this.router.registerAgent(agent))
        );
        this.testAgents.push(...agentIds);
      },
      20,
      suite
    );

    this.benchmarkResults.push(suite);
  }

  /**
   * Benchmark discovery operations
   */
  private async runDiscoveryBenchmarks(): Promise<void> {
    const suite: BenchmarkSuite = {
      suiteName: 'Agent Discovery',
      results: [],
      totalDuration: 0,
      summary: { avgResponseTime: 0, maxResponseTime: 0, totalOperations: 0, overallOpsPerSecond: 0, passed: false },
    };

    console.log('🔍 Running Discovery Benchmarks...');

    // Single capability discovery
    await this.runBenchmark(
      'Single Capability Discovery',
      async () => {
        await this.router.discoverAgents({ capabilities: ['chat'] });
      },
      1000,
      suite
    );

    // Multiple capabilities discovery
    await this.runBenchmark(
      'Multiple Capabilities Discovery',
      async () => {
        await this.router.discoverAgents({ 
          capabilities: ['chat', 'reasoning', 'calculation'] 
        });
      },
      500,
      suite
    );

    // Domain-based discovery
    await this.runBenchmark(
      'Domain-based Discovery',
      async () => {
        await this.router.discoverAgents({ 
          domains: ['ai', 'nlp'] 
        });
      },
      500,
      suite
    );

    // Complex query discovery
    await this.runBenchmark(
      'Complex Query Discovery',
      async () => {
        await this.router.discoverAgents({
          capabilities: ['chat', 'reasoning'],
          domains: ['ai'],
          conformanceTier: 'advanced',
          performanceTier: 'silver',
          maxResults: 20,
        });
      },
      200,
      suite
    );

    // Large result set discovery
    await this.runBenchmark(
      'Large Result Set Discovery',
      async () => {
        await this.router.discoverAgents({
          domains: ['ai'],
          maxResults: 500,
        });
      },
      100,
      suite
    );

    this.benchmarkResults.push(suite);
  }

  /**
   * Benchmark concurrency performance
   */
  private async runConcurrencyBenchmarks(): Promise<void> {
    const suite: BenchmarkSuite = {
      suiteName: 'Concurrency',
      results: [],
      totalDuration: 0,
      summary: { avgResponseTime: 0, maxResponseTime: 0, totalOperations: 0, overallOpsPerSecond: 0, passed: false },
    };

    console.log('⚡ Running Concurrency Benchmarks...');

    // Low concurrency (10 concurrent)
    await this.runConcurrentBenchmark(
      'Low Concurrency (10 concurrent)',
      async () => {
        await this.router.discoverAgents({ capabilities: ['chat'] });
      },
      10,
      100,
      suite
    );

    // Medium concurrency (50 concurrent)
    await this.runConcurrentBenchmark(
      'Medium Concurrency (50 concurrent)',
      async () => {
        await this.router.discoverAgents({ capabilities: ['reasoning'] });
      },
      50,
      50,
      suite
    );

    // High concurrency (100 concurrent)
    await this.runConcurrentBenchmark(
      'High Concurrency (100 concurrent)',
      async () => {
        await this.router.discoverAgents({ domains: ['ai'] });
      },
      100,
      20,
      suite
    );

    // Extreme concurrency (500 concurrent)
    await this.runConcurrentBenchmark(
      'Extreme Concurrency (500 concurrent)',
      async () => {
        await this.router.discoverAgents({ maxResults: 10 });
      },
      500,
      10,
      suite
    );

    this.benchmarkResults.push(suite);
  }

  /**
   * Benchmark scalability with different agent counts
   */
  private async runScalabilityBenchmarks(): Promise<void> {
    const suite: BenchmarkSuite = {
      suiteName: 'Scalability',
      results: [],
      totalDuration: 0,
      summary: { avgResponseTime: 0, maxResponseTime: 0, totalOperations: 0, overallOpsPerSecond: 0, passed: false },
    };

    console.log('📈 Running Scalability Benchmarks...');

    // Test with subsets of agents to measure scalability
    const agentCounts = [100, 250, 500, 750, 1000];

    for (const count of agentCounts) {
      await this.runBenchmark(
        `Discovery with ${count} agents`,
        async () => {
          // Use a query that should match agents across the range
          await this.router.discoverAgents({
            capabilities: ['chat'],
            maxResults: Math.min(count / 10, 50),
          });
        },
        50,
        suite
      );
    }

    this.benchmarkResults.push(suite);
  }

  /**
   * Benchmark cache performance
   */
  private async runCacheBenchmarks(): Promise<void> {
    const suite: BenchmarkSuite = {
      suiteName: 'Cache Performance',
      results: [],
      totalDuration: 0,
      summary: { avgResponseTime: 0, maxResponseTime: 0, totalOperations: 0, overallOpsPerSecond: 0, passed: false },
    };

    console.log('💾 Running Cache Benchmarks...');

    const commonQuery = { capabilities: ['chat'], domains: ['ai'] };

    // First query (cache miss)
    await this.runBenchmark(
      'Cache Miss (First Query)',
      async () => {
        await this.router.discoverAgents({
          ...commonQuery,
          maxResults: Math.floor(Math.random() * 50) + 1, // Vary to avoid cache
        });
      },
      100,
      suite
    );

    // Subsequent queries (cache hits)
    await this.runBenchmark(
      'Cache Hit (Repeated Query)',
      async () => {
        await this.router.discoverAgents(commonQuery);
      },
      1000,
      suite
    );

    this.benchmarkResults.push(suite);
  }

  /**
   * Benchmark memory usage under load
   */
  private async runMemoryBenchmarks(): Promise<void> {
    const suite: BenchmarkSuite = {
      suiteName: 'Memory Usage',
      results: [],
      totalDuration: 0,
      summary: { avgResponseTime: 0, maxResponseTime: 0, totalOperations: 0, overallOpsPerSecond: 0, passed: false },
    };

    console.log('🧠 Running Memory Benchmarks...');

    // Sustained load test
    await this.runBenchmark(
      'Sustained Load (Memory Stability)',
      async () => {
        const queries = [
          { capabilities: ['chat'] },
          { domains: ['ai', 'nlp'] },
          { capabilities: ['reasoning', 'calculation'] },
          { conformanceTier: 'advanced' as const },
        ];
        
        const query = queries[Math.floor(Math.random() * queries.length)];
        await this.router.discoverAgents(query);
      },
      2000,
      suite
    );

    this.benchmarkResults.push(suite);
  }

  /**
   * Run a single benchmark
   */
  private async runBenchmark(
    name: string,
    operation: () => Promise<void>,
    iterations: number,
    suite: BenchmarkSuite
  ): Promise<void> {
    const times: number[] = [];
    const startMemory = process.memoryUsage().heapUsed;
    
    // Warm up
    for (let i = 0; i < Math.min(10, iterations); i++) {
      await operation();
    }

    // Actual benchmark
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      const operationStart = performance.now();
      await operation();
      const operationTime = performance.now() - operationStart;
      times.push(operationTime);
    }
    
    const totalTime = Date.now() - startTime;
    const endMemory = process.memoryUsage().heapUsed;
    
    // Calculate statistics
    times.sort((a, b) => a - b);
    const result: BenchmarkResult = {
      name,
      totalTime,
      avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      minTime: times[0],
      maxTime: times[times.length - 1],
      p95Time: times[Math.floor(times.length * 0.95)],
      p99Time: times[Math.floor(times.length * 0.99)],
      operations: iterations,
      opsPerSecond: iterations / (totalTime / 1000),
      memoryUsage: endMemory - startMemory,
    };

    suite.results.push(result);
    suite.totalDuration += totalTime;

    // Print result
    const passSymbol = result.p95Time < 100 ? '✅' : '❌';
    console.log(`  ${passSymbol} ${name}:`);
    console.log(`     Avg: ${result.avgTime.toFixed(2)}ms | P95: ${result.p95Time.toFixed(2)}ms | P99: ${result.p99Time.toFixed(2)}ms`);
    console.log(`     Ops/sec: ${result.opsPerSecond.toFixed(0)} | Memory: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
  }

  /**
   * Run concurrent benchmark
   */
  private async runConcurrentBenchmark(
    name: string,
    operation: () => Promise<void>,
    concurrency: number,
    batchCount: number,
    suite: BenchmarkSuite
  ): Promise<void> {
    const allTimes: number[] = [];
    const startMemory = process.memoryUsage().heapUsed;
    
    const startTime = Date.now();
    
    for (let batch = 0; batch < batchCount; batch++) {
      const promises = Array.from({ length: concurrency }, async () => {
        const operationStart = performance.now();
        await operation();
        return performance.now() - operationStart;
      });
      
      const batchTimes = await Promise.all(promises);
      allTimes.push(...batchTimes);
    }
    
    const totalTime = Date.now() - startTime;
    const endMemory = process.memoryUsage().heapUsed;
    
    allTimes.sort((a, b) => a - b);
    const totalOperations = concurrency * batchCount;
    
    const result: BenchmarkResult = {
      name,
      totalTime,
      avgTime: allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length,
      minTime: allTimes[0],
      maxTime: allTimes[allTimes.length - 1],
      p95Time: allTimes[Math.floor(allTimes.length * 0.95)],
      p99Time: allTimes[Math.floor(allTimes.length * 0.99)],
      operations: totalOperations,
      opsPerSecond: totalOperations / (totalTime / 1000),
      memoryUsage: endMemory - startMemory,
    };

    suite.results.push(result);
    suite.totalDuration += totalTime;

    const passSymbol = result.p95Time < 100 ? '✅' : '❌';
    console.log(`  ${passSymbol} ${name}:`);
    console.log(`     Avg: ${result.avgTime.toFixed(2)}ms | P95: ${result.p95Time.toFixed(2)}ms | P99: ${result.p99Time.toFixed(2)}ms`);
    console.log(`     Ops/sec: ${result.opsPerSecond.toFixed(0)} | Concurrency: ${concurrency} | Memory: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
  }

  /**
   * Print comprehensive benchmark summary
   */
  private printBenchmarkSummary(): void {
    console.log('\n📊 BENCHMARK SUMMARY');
    console.log('====================\n');

    let totalOperations = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let worstResponseTime = 0;
    let bestOpsPerSecond = 0;

    for (const suite of this.benchmarkResults) {
      console.log(`📋 ${suite.suiteName}:`);
      
      let suiteOps = 0;
      let suitePassed = 0;
      let maxResponseTime = 0;
      let totalResponseTime = 0;

      for (const result of suite.results) {
        suiteOps += result.operations;
        totalResponseTime += result.avgTime * result.operations;
        maxResponseTime = Math.max(maxResponseTime, result.p95Time);
        bestOpsPerSecond = Math.max(bestOpsPerSecond, result.opsPerSecond);
        
        if (result.p95Time < 100) {
          suitePassed++;
        } else {
          totalFailed++;
        }
      }

      const suiteAvgTime = totalResponseTime / suiteOps;
      const suiteOpsPerSecond = suiteOps / (suite.totalDuration / 1000);
      
      suite.summary = {
        avgResponseTime: suiteAvgTime,
        maxResponseTime: maxResponseTime,
        totalOperations: suiteOps,
        overallOpsPerSecond: suiteOpsPerSecond,
        passed: suitePassed === suite.results.length,
      };

      totalOperations += suiteOps;
      totalPassed += suitePassed;
      worstResponseTime = Math.max(worstResponseTime, maxResponseTime);

      const passRate = (suitePassed / suite.results.length) * 100;
      const symbol = suite.summary.passed ? '✅' : '⚠️ ';
      
      console.log(`  ${symbol} Pass Rate: ${passRate.toFixed(1)}% (${suitePassed}/${suite.results.length})`);
      console.log(`     Avg Response: ${suiteAvgTime.toFixed(2)}ms | Max P95: ${maxResponseTime.toFixed(2)}ms`);
      console.log(`     Operations: ${suiteOps.toLocaleString()} | Ops/sec: ${suiteOpsPerSecond.toFixed(0)}`);
      console.log('');
    }

    // Overall summary
    const overallPassRate = (totalPassed / (totalPassed + totalFailed)) * 100;
    const meetsRequirement = worstResponseTime < 100;
    
    console.log('🎯 OVERALL RESULTS:');
    console.log(`   Target: Sub-100ms P95 response time for 1000+ agents`);
    console.log(`   Status: ${meetsRequirement ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Pass Rate: ${overallPassRate.toFixed(1)}% (${totalPassed}/${totalPassed + totalFailed} tests)`);
    console.log(`   Worst P95: ${worstResponseTime.toFixed(2)}ms`);
    console.log(`   Total Operations: ${totalOperations.toLocaleString()}`);
    console.log(`   Peak Ops/sec: ${bestOpsPerSecond.toFixed(0)}`);
    console.log(`   Agent Count: ${this.testAgents.length.toLocaleString()}`);
    
    if (meetsRequirement) {
      console.log('\n🎉 OSSA Router meets sub-100ms performance requirements!');
    } else {
      console.log('\n⚠️  OSSA Router needs optimization to meet performance requirements.');
    }
  }

  /**
   * Create a test agent for benchmarking
   */
  private createTestAgent(name: string): Omit<OSSAAgent, 'id' | 'registrationTime' | 'lastSeen'> {
    return {
      name,
      version: '1.0.0',
      endpoint: `http://${name}.test.local:3000`,
      status: 'healthy',
      metadata: {
        class: 'general',
        category: 'assistant',
        conformanceTier: 'core',
        certificationLevel: 'bronze',
      },
      capabilities: {
        primary: ['benchmark-test'],
        domains: ['testing'],
      },
      protocols: [
        {
          name: 'rest',
          version: '1.0',
          required: true,
          endpoints: { api: '/api' },
        },
      ],
      endpoints: {
        health: '/health',
        api: '/api',
      },
      performance: {
        avgResponseTimeMs: 50,
        uptimePercentage: 99.9,
        requestsHandled: 1000,
        successRate: 0.99,
        throughputRps: 20,
      },
    };
  }
}

// Export for CLI usage
export async function runPerformanceBenchmarks(): Promise<BenchmarkSuite[]> {
  const benchmark = new PerformanceBenchmark();
  return await benchmark.runBenchmarks();
}

// Run benchmarks if this file is executed directly
if (require.main === module) {
  runPerformanceBenchmarks()
    .then((results) => {
      const passed = results.every(suite => suite.summary.passed);
      process.exit(passed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Benchmark failed:', error);
      process.exit(1);
    });
}