/**
 * ACTA (Adaptive Contextual Token Architecture) - Main Entry Point
 * High-performance token compression and context management system
 */

// Core components
export { ACTAOrchestrator } from './orchestrator.js';
export { VectorCompressionEngine } from './vector-compression.js';
export { ModelSwitcher } from './model-switcher.js';
export { GraphPersistenceEngine } from './graph-persistence.js';

// Configuration
export {
  DEFAULT_ACTA_CONFIG,
  DEV_ACTA_CONFIG,
  TEST_ACTA_CONFIG,
  ConfigBuilder,
  ConfigValidator,
  EnvironmentConfigLoader,
  ConfigUtils
} from './config.js';

// Types and interfaces
export * from './types.js';

// Convenience factory function
import { ACTAOrchestrator } from './orchestrator.js';
import { ACTAConfig } from './types.js';
import { DEFAULT_ACTA_CONFIG } from './config.js';

/**
 * Factory function to create a configured ACTA instance
 */
export async function createACTA(config?: Partial<ACTAConfig>): Promise<ACTAOrchestrator> {
  const finalConfig: ACTAConfig = {
    ...DEFAULT_ACTA_CONFIG,
    ...config
  };

  const orchestrator = new ACTAOrchestrator(finalConfig);
  await orchestrator.initialize(finalConfig);
  
  return orchestrator;
}

/**
 * Create ACTA instance optimized for development
 */
export async function createDevACTA(config?: Partial<ACTAConfig>): Promise<ACTAOrchestrator> {
  const { ConfigBuilder } = await import('./config.js');
  
  const devConfig = ConfigBuilder
    .from(DEFAULT_ACTA_CONFIG)
    .forDevelopment()
    .build();

  return createACTA({ ...devConfig, ...config });
}

/**
 * Create ACTA instance optimized for testing
 */
export async function createTestACTA(config?: Partial<ACTAConfig>): Promise<ACTAOrchestrator> {
  const { ConfigBuilder } = await import('./config.js');
  
  const testConfig = ConfigBuilder
    .from(DEFAULT_ACTA_CONFIG)
    .forTesting()
    .build();

  return createACTA({ ...testConfig, ...config });
}

/**
 * Create ACTA instance from environment variables
 */
export async function createACTAFromEnv(): Promise<ACTAOrchestrator> {
  const { EnvironmentConfigLoader } = await import('./config.js');
  
  const config = EnvironmentConfigLoader.load();
  return createACTA(config);
}

// Export version information
export const ACTA_VERSION = '0.1.0';
export const ACTA_BUILD = 'dev';

/**
 * Health check utility
 */
export async function checkACTAHealth(orchestrator: ACTAOrchestrator): Promise<boolean> {
  try {
    const health = await orchestrator.getHealth();
    return health.status === 'healthy';
  } catch (error) {
    console.error('ACTA health check failed:', error);
    return false;
  }
}

/**
 * Benchmark utility
 */
export async function benchmarkACTA(
  orchestrator: ACTAOrchestrator,
  iterations: number = 10
): Promise<{
  averageLatency: number;
  throughput: number;
  successRate: number;
}> {
  const startTime = Date.now();
  let successes = 0;
  const latencies: number[] = [];

  const testQuery = {
    text: 'What is the capital of France?',
    context: ['France is a country in Europe', 'Paris is a major city'],
    maxTokens: 100
  };

  for (let i = 0; i < iterations; i++) {
    const queryStart = Date.now();
    
    try {
      await orchestrator.process(testQuery);
      const queryLatency = Date.now() - queryStart;
      latencies.push(queryLatency);
      successes++;
    } catch (error) {
      console.error(`Benchmark iteration ${i} failed:`, error);
    }
  }

  const totalTime = Date.now() - startTime;
  const averageLatency = latencies.length > 0 ? 
    latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;
  
  return {
    averageLatency,
    throughput: (successes / totalTime) * 1000, // requests per second
    successRate: successes / iterations
  };
}

/**
 * Example usage demonstration
 */
export async function demonstrateACTA(): Promise<void> {
  console.log('=== ACTA Demonstration ===\n');

  try {
    // Create ACTA instance
    console.log('1. Creating ACTA instance...');
    const acta = await createDevACTA();
    console.log('✓ ACTA instance created\n');

    // Check health
    console.log('2. Checking system health...');
    const isHealthy = await checkACTAHealth(acta);
    console.log(`✓ System health: ${isHealthy ? 'Healthy' : 'Unhealthy'}\n`);

    // Process a simple query
    console.log('3. Processing simple query...');
    const simpleResponse = await acta.process({
      text: 'Explain machine learning',
      context: ['Machine learning is a subset of AI'],
      maxTokens: 200
    });
    console.log(`✓ Response: ${simpleResponse.result.substring(0, 100)}...\n`);

    // Process a complex query with compression
    console.log('4. Processing complex query with compression...');
    const complexResponse = await acta.process({
      text: 'Compare neural networks and decision trees',
      context: [
        'Neural networks are inspired by biological neurons',
        'They use layers of interconnected nodes',
        'Decision trees split data based on feature values',
        'They create a tree-like model of decisions',
        'Both are supervised learning algorithms',
        'Neural networks are better for complex patterns',
        'Decision trees are more interpretable'
      ],
      maxTokens: 500,
      compressionLevel: 2 // Moderate compression
    });
    console.log(`✓ Complex response generated with compression: ${complexResponse.compressionApplied}`);
    console.log(`✓ Used model: ${complexResponse.usedModel}\n`);

    // Run benchmark
    console.log('5. Running performance benchmark...');
    const benchmark = await benchmarkACTA(acta, 5);
    console.log(`✓ Average latency: ${benchmark.averageLatency.toFixed(2)}ms`);
    console.log(`✓ Throughput: ${benchmark.throughput.toFixed(2)} req/s`);
    console.log(`✓ Success rate: ${(benchmark.successRate * 100).toFixed(1)}%\n`);

    // Show performance metrics
    console.log('6. Performance metrics...');
    const health = await acta.getHealth();
    console.log(`✓ Query latency: ${health.metrics.queryLatency.toFixed(2)}ms`);
    console.log(`✓ Memory usage: ${(health.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    console.log(`✓ Throughput: ${health.metrics.throughput.toFixed(2)} req/s\n`);

    // Cleanup
    console.log('7. Cleaning up...');
    await acta.cleanup();
    console.log('✓ Cleanup completed\n');

    console.log('=== Demonstration Complete ===');

  } catch (error) {
    console.error('Demonstration failed:', error);
    throw error;
  }
}

// Default export
export default {
  createACTA,
  createDevACTA,
  createTestACTA,
  createACTAFromEnv,
  checkACTAHealth,
  benchmarkACTA,
  demonstrateACTA,
  ACTAOrchestrator,
  VectorCompressionEngine,
  ModelSwitcher,
  GraphPersistenceEngine,
  DEFAULT_ACTA_CONFIG,
  DEV_ACTA_CONFIG,
  TEST_ACTA_CONFIG,
  ConfigBuilder,
  ACTA_VERSION,
  ACTA_BUILD
};