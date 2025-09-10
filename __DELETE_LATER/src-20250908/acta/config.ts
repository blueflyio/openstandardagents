/**
 * ACTA Configuration Management
 * Provides default configurations and validation for the ACTA system
 */

import {
  ACTAConfig,
  ModelConfig,
  ModelCapability,
  CompressionLevel
} from './types.js';

/**
 * Default ACTA configuration optimized for production use
 */
export const DEFAULT_ACTA_CONFIG: ACTAConfig = {
  vector: {
    endpoint: 'http://localhost:6333',
    collection: 'acta_context',
    dimension: 384,
    distance: 'cosine'
  },
  
  models: {
    small: {
      id: 'gpt-3b',
      endpoint: 'http://localhost:4000/api/v1/chat',
      maxTokens: 4096,
      contextWindow: 8192,
      costPerToken: 0.0001,
      latencyMs: 100,
      capabilities: [
        ModelCapability.TEXT_GENERATION,
        ModelCapability.CODE_GENERATION
      ]
    },
    
    medium: {
      id: 'gpt-7b',
      endpoint: 'http://localhost:4000/api/v1/chat',
      maxTokens: 8192,
      contextWindow: 16384,
      costPerToken: 0.0003,
      latencyMs: 200,
      capabilities: [
        ModelCapability.TEXT_GENERATION,
        ModelCapability.CODE_GENERATION,
        ModelCapability.REASONING
      ]
    },
    
    large: {
      id: 'gpt-13b',
      endpoint: 'http://localhost:4000/api/v1/chat',
      maxTokens: 16384,
      contextWindow: 32768,
      costPerToken: 0.0006,
      latencyMs: 400,
      capabilities: [
        ModelCapability.TEXT_GENERATION,
        ModelCapability.CODE_GENERATION,
        ModelCapability.REASONING,
        ModelCapability.TOOL_USE
      ]
    },
    
    xlarge: {
      id: 'gpt-70b',
      endpoint: 'http://localhost:4000/api/v1/chat',
      maxTokens: 32768,
      contextWindow: 65536,
      costPerToken: 0.001,
      latencyMs: 800,
      capabilities: [
        ModelCapability.TEXT_GENERATION,
        ModelCapability.CODE_GENERATION,
        ModelCapability.REASONING,
        ModelCapability.MULTIMODAL,
        ModelCapability.TOOL_USE,
        ModelCapability.LONG_CONTEXT
      ]
    }
  },
  
  compression: {
    threshold: 8000, // Start compressing when context exceeds 8K tokens
    ratio: 0.6, // Target 40% reduction
    semanticWeight: 0.7, // Prioritize semantic similarity
    frequencyWeight: 0.3 // Consider access frequency
  },
  
  graph: {
    maxNodes: 100000, // Maximum nodes in memory
    maxDepth: 10, // Maximum relationship depth
    pruningThreshold: 0.1, // Remove nodes with importance < 0.1
    persistenceInterval: 300000 // Save every 5 minutes
  },
  
  performance: {
    batchSize: 50, // Process tokens in batches of 50
    cacheSize: 1000, // Cache up to 1000 nodes
    indexingWorkers: 4, // Use 4 workers for indexing
    queryTimeout: 30000 // 30 second query timeout
  }
};

/**
 * Development configuration with faster settings and local endpoints
 */
export const DEV_ACTA_CONFIG: ACTAConfig = {
  ...DEFAULT_ACTA_CONFIG,
  
  vector: {
    ...DEFAULT_ACTA_CONFIG.vector,
    endpoint: 'http://localhost:6333',
    collection: 'acta_dev'
  },
  
  compression: {
    ...DEFAULT_ACTA_CONFIG.compression,
    threshold: 2000, // Lower threshold for dev
    ratio: 0.8 // Less aggressive compression
  },
  
  graph: {
    ...DEFAULT_ACTA_CONFIG.graph,
    maxNodes: 10000, // Smaller for dev
    persistenceInterval: 60000 // Save every minute
  },
  
  performance: {
    ...DEFAULT_ACTA_CONFIG.performance,
    batchSize: 10, // Smaller batches for dev
    cacheSize: 100, // Smaller cache
    indexingWorkers: 2, // Fewer workers
    queryTimeout: 10000 // 10 second timeout
  }
};

/**
 * Test configuration optimized for unit and integration tests
 */
export const TEST_ACTA_CONFIG: ACTAConfig = {
  ...DEFAULT_ACTA_CONFIG,
  
  vector: {
    ...DEFAULT_ACTA_CONFIG.vector,
    endpoint: 'http://localhost:6333',
    collection: 'acta_test',
    dimension: 128 // Smaller embeddings for tests
  },
  
  models: {
    small: {
      ...DEFAULT_ACTA_CONFIG.models.small,
      latencyMs: 10, // Fast for tests
      costPerToken: 0
    },
    medium: {
      ...DEFAULT_ACTA_CONFIG.models.medium,
      latencyMs: 20,
      costPerToken: 0
    },
    large: {
      ...DEFAULT_ACTA_CONFIG.models.large,
      latencyMs: 30,
      costPerToken: 0
    },
    xlarge: {
      ...DEFAULT_ACTA_CONFIG.models.xlarge,
      latencyMs: 50,
      costPerToken: 0
    }
  },
  
  compression: {
    ...DEFAULT_ACTA_CONFIG.compression,
    threshold: 100, // Very low for tests
    ratio: 0.9 // Minimal compression
  },
  
  graph: {
    ...DEFAULT_ACTA_CONFIG.graph,
    maxNodes: 100, // Small for tests
    maxDepth: 3,
    persistenceInterval: 1000 // Save every second
  },
  
  performance: {
    ...DEFAULT_ACTA_CONFIG.performance,
    batchSize: 5, // Very small batches
    cacheSize: 10, // Tiny cache
    indexingWorkers: 1, // Single worker
    queryTimeout: 5000 // 5 second timeout
  }
};

/**
 * Configuration validator
 */
export class ConfigValidator {
  /**
   * Validate ACTA configuration
   */
  static validate(config: Partial<ACTAConfig>): string[] {
    const errors: string[] = [];

    // Validate vector configuration
    if (config.vector) {
      if (!config.vector.endpoint) {
        errors.push('Vector endpoint is required');
      }
      if (!config.vector.collection) {
        errors.push('Vector collection name is required');
      }
      if (!config.vector.dimension || config.vector.dimension <= 0) {
        errors.push('Vector dimension must be positive');
      }
    }

    // Validate model configurations
    if (config.models) {
      const modelKeys = ['small', 'medium', 'large', 'xlarge'] as const;
      
      for (const key of modelKeys) {
        const model = config.models[key];
        if (model) {
          const modelErrors = this.validateModel(model, key);
          errors.push(...modelErrors);
        }
      }
    }

    // Validate compression settings
    if (config.compression) {
      if (config.compression.threshold && config.compression.threshold < 0) {
        errors.push('Compression threshold must be non-negative');
      }
      if (config.compression.ratio && (config.compression.ratio <= 0 || config.compression.ratio > 1)) {
        errors.push('Compression ratio must be between 0 and 1');
      }
      if (config.compression.semanticWeight && (config.compression.semanticWeight < 0 || config.compression.semanticWeight > 1)) {
        errors.push('Semantic weight must be between 0 and 1');
      }
      if (config.compression.frequencyWeight && (config.compression.frequencyWeight < 0 || config.compression.frequencyWeight > 1)) {
        errors.push('Frequency weight must be between 0 and 1');
      }
    }

    // Validate graph settings
    if (config.graph) {
      if (config.graph.maxNodes && config.graph.maxNodes <= 0) {
        errors.push('Max nodes must be positive');
      }
      if (config.graph.maxDepth && config.graph.maxDepth <= 0) {
        errors.push('Max depth must be positive');
      }
      if (config.graph.pruningThreshold && (config.graph.pruningThreshold < 0 || config.graph.pruningThreshold > 1)) {
        errors.push('Pruning threshold must be between 0 and 1');
      }
      if (config.graph.persistenceInterval && config.graph.persistenceInterval <= 0) {
        errors.push('Persistence interval must be positive');
      }
    }

    // Validate performance settings
    if (config.performance) {
      if (config.performance.batchSize && config.performance.batchSize <= 0) {
        errors.push('Batch size must be positive');
      }
      if (config.performance.cacheSize && config.performance.cacheSize <= 0) {
        errors.push('Cache size must be positive');
      }
      if (config.performance.indexingWorkers && config.performance.indexingWorkers <= 0) {
        errors.push('Indexing workers must be positive');
      }
      if (config.performance.queryTimeout && config.performance.queryTimeout <= 0) {
        errors.push('Query timeout must be positive');
      }
    }

    return errors;
  }

  /**
   * Validate individual model configuration
   */
  private static validateModel(model: ModelConfig, name: string): string[] {
    const errors: string[] = [];
    const prefix = `Model '${name}':`;

    if (!model.id) {
      errors.push(`${prefix} ID is required`);
    }
    if (!model.endpoint) {
      errors.push(`${prefix} Endpoint is required`);
    }
    if (model.maxTokens <= 0) {
      errors.push(`${prefix} Max tokens must be positive`);
    }
    if (model.contextWindow <= 0) {
      errors.push(`${prefix} Context window must be positive`);
    }
    if (model.costPerToken < 0) {
      errors.push(`${prefix} Cost per token must be non-negative`);
    }
    if (model.latencyMs < 0) {
      errors.push(`${prefix} Latency must be non-negative`);
    }
    if (!model.capabilities || model.capabilities.length === 0) {
      errors.push(`${prefix} Must have at least one capability`);
    }

    // Validate capability consistency
    if (model.capabilities.includes(ModelCapability.LONG_CONTEXT) && model.contextWindow < 32768) {
      errors.push(`${prefix} Long context capability requires context window >= 32768`);
    }

    return errors;
  }
}

/**
 * Configuration builder for creating custom configurations
 */
export class ConfigBuilder {
  private config: Partial<ACTAConfig> = {};

  /**
   * Start with a base configuration
   */
  static from(baseConfig: ACTAConfig): ConfigBuilder {
    const builder = new ConfigBuilder();
    builder.config = { ...baseConfig };
    return builder;
  }

  /**
   * Set vector configuration
   */
  withVector(vector: Partial<ACTAConfig['vector']>): this {
    this.config.vector = { ...DEFAULT_ACTA_CONFIG.vector, ...vector };
    return this;
  }

  /**
   * Set model configuration
   */
  withModels(models: Partial<ACTAConfig['models']>): this {
    this.config.models = { ...DEFAULT_ACTA_CONFIG.models, ...models };
    return this;
  }

  /**
   * Set compression configuration
   */
  withCompression(compression: Partial<ACTAConfig['compression']>): this {
    this.config.compression = { ...DEFAULT_ACTA_CONFIG.compression, ...compression };
    return this;
  }

  /**
   * Set graph configuration
   */
  withGraph(graph: Partial<ACTAConfig['graph']>): this {
    this.config.graph = { ...DEFAULT_ACTA_CONFIG.graph, ...graph };
    return this;
  }

  /**
   * Set performance configuration
   */
  withPerformance(performance: Partial<ACTAConfig['performance']>): this {
    this.config.performance = { ...DEFAULT_ACTA_CONFIG.performance, ...performance };
    return this;
  }

  /**
   * Enable development mode optimizations
   */
  forDevelopment(): this {
    return this
      .withCompression({ threshold: 2000, ratio: 0.8 })
      .withGraph({ maxNodes: 10000, persistenceInterval: 60000 })
      .withPerformance({ batchSize: 10, cacheSize: 100, indexingWorkers: 2 });
  }

  /**
   * Enable test mode optimizations
   */
  forTesting(): this {
    return this
      .withVector({ dimension: 128, collection: 'acta_test' })
      .withCompression({ threshold: 100, ratio: 0.9 })
      .withGraph({ maxNodes: 100, maxDepth: 3, persistenceInterval: 1000 })
      .withPerformance({ 
        batchSize: 5, 
        cacheSize: 10, 
        indexingWorkers: 1, 
        queryTimeout: 5000 
      });
  }

  /**
   * Optimize for high throughput
   */
  forHighThroughput(): this {
    return this
      .withPerformance({ 
        batchSize: 100, 
        cacheSize: 5000, 
        indexingWorkers: 8, 
        queryTimeout: 60000 
      })
      .withGraph({ maxNodes: 500000, persistenceInterval: 600000 });
  }

  /**
   * Optimize for low latency
   */
  forLowLatency(): this {
    return this
      .withCompression({ threshold: 16000, ratio: 0.8 })
      .withPerformance({ 
        batchSize: 20, 
        cacheSize: 2000, 
        indexingWorkers: 6, 
        queryTimeout: 5000 
      });
  }

  /**
   * Optimize for memory efficiency
   */
  forMemoryEfficiency(): this {
    return this
      .withGraph({ maxNodes: 50000, maxDepth: 5 })
      .withPerformance({ batchSize: 25, cacheSize: 500 })
      .withCompression({ threshold: 4000, ratio: 0.5 });
  }

  /**
   * Build and validate the configuration
   */
  build(): ACTAConfig {
    // Merge with defaults to ensure all required fields are present
    const finalConfig: ACTAConfig = {
      ...DEFAULT_ACTA_CONFIG,
      ...this.config,
      vector: { ...DEFAULT_ACTA_CONFIG.vector, ...this.config.vector },
      models: { ...DEFAULT_ACTA_CONFIG.models, ...this.config.models },
      compression: { ...DEFAULT_ACTA_CONFIG.compression, ...this.config.compression },
      graph: { ...DEFAULT_ACTA_CONFIG.graph, ...this.config.graph },
      performance: { ...DEFAULT_ACTA_CONFIG.performance, ...this.config.performance }
    };

    // Validate the configuration
    const errors = ConfigValidator.validate(finalConfig);
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    return finalConfig;
  }
}

/**
 * Environment-based configuration loader
 */
export class EnvironmentConfigLoader {
  /**
   * Load configuration from environment variables
   */
  static load(): ACTAConfig {
    const builder = ConfigBuilder.from(DEFAULT_ACTA_CONFIG);

    // Vector configuration from environment
    if (process.env.ACTA_VECTOR_ENDPOINT) {
      builder.withVector({
        endpoint: process.env.ACTA_VECTOR_ENDPOINT,
        collection: process.env.ACTA_VECTOR_COLLECTION || 'acta_context',
        dimension: parseInt(process.env.ACTA_VECTOR_DIMENSION || '384'),
        distance: (process.env.ACTA_VECTOR_DISTANCE as any) || 'cosine'
      });
    }

    // Performance configuration from environment
    if (process.env.ACTA_BATCH_SIZE) {
      builder.withPerformance({
        batchSize: parseInt(process.env.ACTA_BATCH_SIZE),
        cacheSize: parseInt(process.env.ACTA_CACHE_SIZE || '1000'),
        indexingWorkers: parseInt(process.env.ACTA_WORKERS || '4'),
        queryTimeout: parseInt(process.env.ACTA_TIMEOUT || '30000')
      });
    }

    // Environment-specific optimizations
    if (process.env.NODE_ENV === 'development') {
      builder.forDevelopment();
    } else if (process.env.NODE_ENV === 'test') {
      builder.forTesting();
    }

    // Performance mode optimizations
    if (process.env.ACTA_MODE === 'high-throughput') {
      builder.forHighThroughput();
    } else if (process.env.ACTA_MODE === 'low-latency') {
      builder.forLowLatency();
    } else if (process.env.ACTA_MODE === 'memory-efficient') {
      builder.forMemoryEfficiency();
    }

    return builder.build();
  }
}

/**
 * Utility functions for working with configurations
 */
export class ConfigUtils {
  /**
   * Deep merge two configuration objects
   */
  static merge(base: ACTAConfig, override: Partial<ACTAConfig>): ACTAConfig {
    return {
      vector: { ...base.vector, ...override.vector },
      models: { ...base.models, ...override.models },
      compression: { ...base.compression, ...override.compression },
      graph: { ...base.graph, ...override.graph },
      performance: { ...base.performance, ...override.performance }
    };
  }

  /**
   * Get model by capability requirements
   */
  static getModelByCapabilities(
    config: ACTAConfig, 
    requiredCapabilities: ModelCapability[]
  ): ModelConfig | null {
    const models = [
      config.models.small,
      config.models.medium,
      config.models.large,
      config.models.xlarge
    ];

    for (const model of models) {
      const hasAllCapabilities = requiredCapabilities.every(cap =>
        model.capabilities.includes(cap)
      );
      
      if (hasAllCapabilities) {
        return model;
      }
    }

    return null;
  }

  /**
   * Get optimal compression level based on context size
   */
  static getOptimalCompressionLevel(
    config: ACTAConfig, 
    contextSize: number
  ): CompressionLevel {
    const threshold = config.compression.threshold;
    
    if (contextSize < threshold * 0.5) return CompressionLevel.NONE;
    if (contextSize < threshold) return CompressionLevel.LIGHT;
    if (contextSize < threshold * 2) return CompressionLevel.MODERATE;
    if (contextSize < threshold * 4) return CompressionLevel.HEAVY;
    
    return CompressionLevel.MAXIMUM;
  }

  /**
   * Estimate memory usage for configuration
   */
  static estimateMemoryUsage(config: ACTAConfig): number {
    const nodeSize = 1024; // Estimated bytes per node
    const maxNodes = config.graph.maxNodes;
    const cacheSize = config.performance.cacheSize;
    const vectorDimension = config.vector.dimension;
    
    const graphMemory = maxNodes * nodeSize;
    const cacheMemory = cacheSize * nodeSize;
    const vectorMemory = maxNodes * vectorDimension * 4; // 4 bytes per float
    
    return graphMemory + cacheMemory + vectorMemory;
  }
}