/**
 * VORTEX - Vector-Optimized Reactive Token Exchange System
 * Main export file for the complete VORTEX implementation
 */

// Import types needed for factory
import { EnhancedVortexEngine, type EnhancedVortexConfig } from './enhanced-vortex-engine';
import { VortexErrorHandler, type ErrorHandlingConfig } from './error-handling';

// Core type definitions
export * from './token-types';

// Original VORTEX engine (legacy compatibility)
export { VortexEngine } from './vortex-engine';

// Enhanced components
export { JITResolver } from './jit-resolver';
export type { JITResolverConfig, CachedResolution, ResolutionMetrics } from './jit-resolver';

export { AdaptiveCache } from './adaptive-cache';
export type { AdaptiveCacheConfig, CacheEntry, CacheStats } from './adaptive-cache';

export {
  ContextTokenResolver,
  DataTokenResolver,
  StateTokenResolver,
  MetricsTokenResolver,
  TemporalTokenResolver,
  TYPE_RESOLVERS
} from './type-resolvers';

// Re-export the imports
export { EnhancedVortexEngine };
export type { EnhancedVortexConfig };
export { VortexErrorHandler };
export type { ErrorHandlingConfig };

// Utility functions and factories
export class VortexFactory {
  /**
   * Create a default VORTEX configuration
   */
  static createDefaultConfig(): EnhancedVortexConfig {
    return {
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
        performanceThresholds: {
          highPerformanceMs: 100,
          lowPerformanceMs: 1000,
          highUsageThreshold: 10,
          lowUsageThreshold: 2
        },
        variableDuration: {
          minDurationMs: 0,
          maxDurationMs: 600000, // 10 minutes
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
        maxConcurrentResolutions: 100,
        circuitBreakerThreshold: 5,
        timeoutMs: 10000,
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2,
          maxBackoffMs: 30000
        }
      }
    };
  }

  /**
   * Create a development/testing configuration
   */
  static createTestConfig(): EnhancedVortexConfig {
    const config = this.createDefaultConfig();
    
    // Reduce timeouts and limits for testing
    config.resilience.timeoutMs = 5000;
    config.resilience.maxConcurrentResolutions = 10;
    config.jitResolver.maxConcurrentResolutions = 5;
    config.adaptiveCache.maxCacheSize = 100;
    config.adaptiveCache.variableDuration.maxDurationMs = 60000; // 1 minute max for tests
    
    return config;
  }

  /**
   * Create a production-optimized configuration
   */
  static createProductionConfig(): EnhancedVortexConfig {
    const config = this.createDefaultConfig();
    
    // Increase limits for production
    config.resilience.maxConcurrentResolutions = 500;
    config.jitResolver.maxConcurrentResolutions = 200;
    config.adaptiveCache.maxCacheSize = 10000;
    config.adaptiveCache.cleanupIntervalMs = 300000; // 5 minutes
    
    // More aggressive performance thresholds
    config.adaptiveCache.performanceThresholds.highPerformanceMs = 50;
    config.adaptiveCache.performanceThresholds.lowPerformanceMs = 2000;
    
    return config;
  }

  /**
   * Create VORTEX engine with default configuration
   */
  static createEngine(
    qdrantClient?: any,
    redisClient?: any,
    config?: Partial<EnhancedVortexConfig>
  ): EnhancedVortexEngine {
    const fullConfig = config ? 
      this.mergeConfig(this.createDefaultConfig(), config) :
      this.createDefaultConfig();

    return new EnhancedVortexEngine(fullConfig, qdrantClient, redisClient);
  }

  /**
   * Create error handler with default configuration
   */
  static createErrorHandler(config?: Partial<ErrorHandlingConfig>): VortexErrorHandler {
    const defaultConfig: ErrorHandlingConfig = {
      retryPolicies: {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
        jitterEnabled: true
      },
      fallbackChain: {
        enabled: true,
        maxFallbackDepth: 3,
        fallbackTimeout: 5000
      },
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        halfOpenMaxCalls: 3
      },
      gracefulDegradation: {
        enablePlaceholderFallback: true,
        enableCachedFallback: true,
        enableDefaultValues: true,
        staleCacheAcceptanceMs: 300000 // 5 minutes
      }
    };

    const fullConfig = config ?
      this.mergeConfig(defaultConfig, config) :
      defaultConfig;

    return new VortexErrorHandler(fullConfig);
  }

  /**
   * Deep merge configuration objects
   */
  private static mergeConfig<T>(base: T, override: Partial<T>): T {
    const result = { ...base };
    
    for (const key in override) {
      if (override[key] !== undefined) {
        if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
          result[key] = this.mergeConfig(result[key], override[key] as any);
        } else {
          result[key] = override[key] as any;
        }
      }
    }
    
    return result;
  }
}

// Export factory as default for convenience
export default VortexFactory;

// Version and metadata
export const VORTEX_VERSION = '2.0.0';
export const VORTEX_CAPABILITIES = {
  justInTimeResolution: true,
  typeSafeBoundaries: true,
  adaptiveCaching: true,
  vectorSearch: true,
  errorRecovery: true,
  circuitBreakers: true,
  gracefulDegradation: true,
  resiliencePatterns: true,
  analytics: true,
  tokenSavingsTracking: true
} as const;