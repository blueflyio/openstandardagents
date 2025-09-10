/**
 * Comprehensive Error Handling and Fallback Mechanisms for VORTEX
 * Implements robust error recovery, retry logic, and graceful degradation
 */

import {
  TokenError,
  VortexToken,
  ResolverResult,
  FailurePolicy,
  FailureMode,
  ResolverContext
} from './token-types';

export interface ErrorHandlingConfig {
  retryPolicies: {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    jitterEnabled: boolean;
  };
  fallbackChain: {
    enabled: boolean;
    maxFallbackDepth: number;
    fallbackTimeout: number;
  };
  circuitBreaker: {
    failureThreshold: number;
    recoveryTimeout: number;
    halfOpenMaxCalls: number;
  };
  gracefulDegradation: {
    enablePlaceholderFallback: boolean;
    enableCachedFallback: boolean;
    enableDefaultValues: boolean;
    staleCacheAcceptanceMs: number;
  };
}

export interface ErrorContext {
  tokenId: string;
  attemptNumber: number;
  totalAttempts: number;
  lastError: TokenError;
  errorHistory: TokenError[];
  startTime: number;
  resolverContext: ResolverContext;
}

export class VortexErrorHandler {
  private config: ErrorHandlingConfig;
  private retryQueues = new Map<string, RetryQueue>();
  private fallbackCache = new Map<string, FallbackData>();
  private errorMetrics = new Map<string, ErrorMetrics>();

  constructor(config: ErrorHandlingConfig) {
    this.config = config;
    this.startCleanupInterval();
  }

  /**
   * Handle token resolution error with comprehensive recovery strategies
   */
  async handleTokenError(
    token: VortexToken,
    error: TokenError,
    context: ResolverContext,
    failurePolicy: FailurePolicy,
    resolverFn: (token: VortexToken, context: ResolverContext) => Promise<ResolverResult>
  ): Promise<ResolverResult> {
    const errorContext: ErrorContext = {
      tokenId: token.id,
      attemptNumber: 1,
      totalAttempts: failurePolicy.maxRetries + 1,
      lastError: error,
      errorHistory: [error],
      startTime: Date.now(),
      resolverContext: context
    };

    // Record error metrics
    this.recordError(token.id, error);

    // Apply error handling strategy based on failure policy
    switch (failurePolicy.mode) {
      case FailureMode.GRACEFUL_DEGRADATION:
        return await this.handleGracefulDegradation(token, errorContext, failurePolicy);
      
      case FailureMode.FALLBACK_RESOLVER:
        return await this.handleFallbackResolver(token, errorContext, failurePolicy, resolverFn);
      
      case FailureMode.CACHE_STALE_OK:
        return await this.handleStaleCache(token, errorContext, failurePolicy);
      
      case FailureMode.DEPENDENCY_SKIP:
        return await this.handleDependencySkip(token, errorContext, failurePolicy);
      
      case FailureMode.ERROR_PROPAGATION:
      default:
        return await this.handleErrorPropagation(token, errorContext, failurePolicy, resolverFn);
    }
  }

  /**
   * Retry resolution with exponential backoff and jitter
   */
  async retryResolution(
    token: VortexToken,
    context: ResolverContext,
    resolverFn: (token: VortexToken, context: ResolverContext) => Promise<ResolverResult>,
    maxRetries: number = this.config.retryPolicies.maxRetries
  ): Promise<ResolverResult> {
    let lastError: TokenError | null = null;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        // Calculate delay for retry (not on first attempt)
        if (attempt > 1) {
          const delay = this.calculateRetryDelay(attempt - 1);
          await this.sleep(delay);
        }

        const result = await resolverFn(token, context);
        
        if (result.success) {
          // Record successful retry
          this.recordSuccessfulRetry(token.id, attempt);
          return result;
        } else if (result.error && !result.error.retryable) {
          // Non-retryable error, stop trying
          break;
        }
        
        lastError = result.error || null;
        
      } catch (error) {
        lastError = {
          code: 'RETRY_EXCEPTION',
          message: `Retry attempt ${attempt} failed: ${error}`,
          category: 'resolution',
          retryable: attempt < maxRetries,
          fallbackAvailable: true
        };
      }
    }

    // All retries exhausted
    return {
      success: false,
      resolvedValue: null,
      dependencies: [],
      metadata: {
        resolveTime: Date.now() - Date.now(),
        cacheHit: false,
        fallbackUsed: false,
        costImpact: {
          tokensSaved: 0,
          computeUnitsUsed: maxRetries + 1,
          cacheOperations: 0,
          vectorOperations: 0
        }
      },
      error: lastError || {
        code: 'MAX_RETRIES_EXCEEDED',
        message: `Failed after ${maxRetries} retry attempts`,
        category: 'resolution',
        retryable: false,
        fallbackAvailable: true
      }
    };
  }

  /**
   * Execute fallback chain with progressive degradation
   */
  async executeFallbackChain(
    token: VortexToken,
    context: ResolverContext,
    primaryError: TokenError
  ): Promise<ResolverResult> {
    const fallbackStrategies = this.buildFallbackChain(token, context);
    
    for (let i = 0; i < fallbackStrategies.length && i < this.config.fallbackChain.maxFallbackDepth; i++) {
      try {
        const strategy = fallbackStrategies[i];
        const result = await Promise.race([
          strategy.execute(token, context),
          this.createTimeoutPromise(this.config.fallbackChain.fallbackTimeout)
        ]);
        
        if (result.success) {
          result.metadata.fallbackUsed = true;
          this.recordSuccessfulFallback(token.id, strategy.name);
          return result;
        }
      } catch (error) {
        // Continue to next fallback strategy
        console.warn(`Fallback strategy failed: ${error}`);
      }
    }

    // All fallbacks failed
    return {
      success: false,
      resolvedValue: null,
      dependencies: [],
      metadata: {
        resolveTime: 0,
        cacheHit: false,
        fallbackUsed: true,
        costImpact: {
          tokensSaved: 0,
          computeUnitsUsed: fallbackStrategies.length,
          cacheOperations: 0,
          vectorOperations: 0
        }
      },
      error: {
        code: 'ALL_FALLBACKS_FAILED',
        message: 'All fallback strategies failed',
        category: 'resolution',
        retryable: false,
        fallbackAvailable: false
      }
    };
  }

  // Private error handling implementations

  private async handleGracefulDegradation(
    token: VortexToken,
    errorContext: ErrorContext,
    failurePolicy: FailurePolicy
  ): Promise<ResolverResult> {
    // Try various graceful degradation strategies
    
    // 1. Check for stale cache if allowed
    if (this.config.gracefulDegradation.enableCachedFallback) {
      const staleResult = await this.tryStaleCache(token, errorContext);
      if (staleResult.success) {
        return staleResult;
      }
    }

    // 2. Try default values
    if (this.config.gracefulDegradation.enableDefaultValues) {
      const defaultResult = this.tryDefaultValue(token, errorContext);
      if (defaultResult.success) {
        return defaultResult;
      }
    }

    // 3. Use placeholder fallback
    if (this.config.gracefulDegradation.enablePlaceholderFallback) {
      return {
        success: true,
        resolvedValue: token.placeholder, // Return the original placeholder
        dependencies: [],
        metadata: {
          resolveTime: 0,
          cacheHit: false,
          fallbackUsed: true,
          costImpact: {
            tokensSaved: 0,
            computeUnitsUsed: 0,
            cacheOperations: 0,
            vectorOperations: 0
          }
        }
      };
    }

    // Graceful degradation failed
    return this.createFailureResult(token, errorContext.lastError);
  }

  private async handleFallbackResolver(
    token: VortexToken,
    errorContext: ErrorContext,
    failurePolicy: FailurePolicy,
    resolverFn: (token: VortexToken, context: ResolverContext) => Promise<ResolverResult>
  ): Promise<ResolverResult> {
    // Try fallback chain
    const fallbackResult = await this.executeFallbackChain(
      token,
      errorContext.resolverContext,
      errorContext.lastError
    );

    if (fallbackResult.success) {
      return fallbackResult;
    }

    // If fallback chain fails, try retry with original resolver
    if (failurePolicy.maxRetries > 0) {
      return await this.retryResolution(
        token,
        errorContext.resolverContext,
        resolverFn,
        failurePolicy.maxRetries
      );
    }

    return this.createFailureResult(token, errorContext.lastError);
  }

  private async handleStaleCache(
    token: VortexToken,
    errorContext: ErrorContext,
    failurePolicy: FailurePolicy
  ): Promise<ResolverResult> {
    const staleResult = await this.tryStaleCache(token, errorContext);
    
    if (staleResult.success) {
      return staleResult;
    }

    // If no stale cache, fall back to graceful degradation
    return await this.handleGracefulDegradation(token, errorContext, failurePolicy);
  }

  private async handleDependencySkip(
    token: VortexToken,
    errorContext: ErrorContext,
    failurePolicy: FailurePolicy
  ): Promise<ResolverResult> {
    // Create a result that indicates the dependency was skipped
    return {
      success: true,
      resolvedValue: `[SKIPPED:${token.id}]`,
      dependencies: [], // Clear dependencies to prevent cascade failures
      metadata: {
        resolveTime: 0,
        cacheHit: false,
        fallbackUsed: true,
        costImpact: {
          tokensSaved: 0,
          computeUnitsUsed: 0,
          cacheOperations: 0,
          vectorOperations: 0
        }
      }
    };
  }

  private async handleErrorPropagation(
    token: VortexToken,
    errorContext: ErrorContext,
    failurePolicy: FailurePolicy,
    resolverFn: (token: VortexToken, context: ResolverContext) => Promise<ResolverResult>
  ): Promise<ResolverResult> {
    // Try retry first if configured
    if (failurePolicy.maxRetries > 0) {
      const retryResult = await this.retryResolution(
        token,
        errorContext.resolverContext,
        resolverFn,
        failurePolicy.maxRetries
      );
      
      if (retryResult.success) {
        return retryResult;
      }
    }

    // Propagate the error
    return this.createFailureResult(token, errorContext.lastError);
  }

  // Fallback strategy implementations

  private buildFallbackChain(token: VortexToken, context: ResolverContext): FallbackStrategy[] {
    const strategies: FallbackStrategy[] = [];

    // Vector similarity fallback
    strategies.push({
      name: 'vector-similarity',
      priority: 1,
      execute: async (token: VortexToken, context: ResolverContext) => 
        await this.tryVectorSimilarityFallback(token, context)
    });

    // Static mapping fallback
    strategies.push({
      name: 'static-mapping',
      priority: 2,
      execute: async (token: VortexToken, context: ResolverContext) => 
        await this.tryStaticMappingFallback(token, context)
    });

    // Pattern-based fallback
    strategies.push({
      name: 'pattern-based',
      priority: 3,
      execute: async (token: VortexToken, context: ResolverContext) => 
        await this.tryPatternBasedFallback(token, context)
    });

    // Default value fallback
    strategies.push({
      name: 'default-value',
      priority: 4,
      execute: async (token: VortexToken, context: ResolverContext) => 
        this.tryDefaultValue(token, { tokenId: token.id } as ErrorContext)
    });

    return strategies.sort((a, b) => a.priority - b.priority);
  }

  private async tryVectorSimilarityFallback(
    token: VortexToken,
    context: ResolverContext
  ): Promise<ResolverResult> {
    if (!context.qdrantClient) {
      throw new Error('Vector client not available');
    }

    try {
      // Search for similar tokens that were successfully resolved
      const searchResult = await context.qdrantClient.search('vortex-tokens', {
        filter: {
          must: [
            { key: 'tokenType', match: { value: token.type } },
            { key: 'resolvedSuccessfully', match: { value: true } }
          ]
        },
        limit: 1,
        score_threshold: 0.7
      });

      if (searchResult.length > 0) {
        const similarToken = searchResult[0];
        return {
          success: true,
          resolvedValue: similarToken.payload.resolvedValue,
          dependencies: [],
          metadata: {
            resolveTime: 10,
            cacheHit: false,
            fallbackUsed: true,
            vectorSimilarity: similarToken.score,
            costImpact: {
              tokensSaved: 30,
              computeUnitsUsed: 1,
              cacheOperations: 0,
              vectorOperations: 1
            }
          }
        };
      }
    } catch (error) {
      // Vector search failed, continue to next strategy
    }

    throw new Error('Vector similarity fallback failed');
  }

  private async tryStaticMappingFallback(
    token: VortexToken,
    context: ResolverContext
  ): Promise<ResolverResult> {
    const staticMappings = this.getStaticMappings(token.type);
    const key = `${token.namespace}:${token.placeholder}`;
    
    if (staticMappings.has(key)) {
      return {
        success: true,
        resolvedValue: staticMappings.get(key),
        dependencies: [],
        metadata: {
          resolveTime: 5,
          cacheHit: false,
          fallbackUsed: true,
          costImpact: {
            tokensSaved: 20,
            computeUnitsUsed: 1,
            cacheOperations: 0,
            vectorOperations: 0
          }
        }
      };
    }

    throw new Error('No static mapping found');
  }

  private async tryPatternBasedFallback(
    token: VortexToken,
    context: ResolverContext
  ): Promise<ResolverResult> {
    // Extract meaningful parts from token pattern and create reasonable defaults
    const patterns = token.placeholder.match(/{([^:}]+):([^:}]+):([^:}]+):([^}]+)}/);
    
    if (patterns) {
      const [, type, namespace, scope, identifier] = patterns;
      let fallbackValue: string;

      switch (type) {
        case 'CONTEXT':
          fallbackValue = `${scope}-context-${identifier}`;
          break;
        case 'DATA':
          fallbackValue = JSON.stringify({ type: 'fallback', identifier, scope });
          break;
        case 'STATE':
          fallbackValue = JSON.stringify({ state: identifier, status: 'unknown' });
          break;
        case 'METRICS':
          fallbackValue = JSON.stringify({ metric: identifier, value: 0, fallback: true });
          break;
        case 'TEMPORAL':
          fallbackValue = new Date().toISOString();
          break;
        default:
          fallbackValue = `fallback-${identifier}`;
      }

      return {
        success: true,
        resolvedValue: fallbackValue,
        dependencies: [],
        metadata: {
          resolveTime: 3,
          cacheHit: false,
          fallbackUsed: true,
          costImpact: {
            tokensSaved: 10,
            computeUnitsUsed: 1,
            cacheOperations: 0,
            vectorOperations: 0
          }
        }
      };
    }

    throw new Error('Pattern-based fallback failed');
  }

  private tryDefaultValue(token: VortexToken, errorContext: ErrorContext): ResolverResult {
    const defaultValues = this.getDefaultValues(token.type);
    
    if (defaultValues.has(token.namespace)) {
      return {
        success: true,
        resolvedValue: defaultValues.get(token.namespace),
        dependencies: [],
        metadata: {
          resolveTime: 1,
          cacheHit: false,
          fallbackUsed: true,
          costImpact: {
            tokensSaved: 5,
            computeUnitsUsed: 0,
            cacheOperations: 0,
            vectorOperations: 0
          }
        }
      };
    }

    return this.createFailureResult(token, errorContext.lastError);
  }

  private async tryStaleCache(token: VortexToken, errorContext: ErrorContext): Promise<ResolverResult> {
    // Check if we have any cached data, even if stale
    const staleData = this.fallbackCache.get(token.id);
    
    if (staleData) {
      const staleness = Date.now() - staleData.cachedAt;
      
      if (staleness <= this.config.gracefulDegradation.staleCacheAcceptanceMs) {
        return {
          success: true,
          resolvedValue: staleData.value,
          dependencies: staleData.dependencies,
          metadata: {
            resolveTime: 0,
            cacheHit: true,
            fallbackUsed: true,
            costImpact: {
              tokensSaved: 50,
              computeUnitsUsed: 0,
              cacheOperations: 1,
              vectorOperations: 0
            }
          }
        };
      }
    }

    return this.createFailureResult(token, errorContext.lastError);
  }

  // Utility methods

  private calculateRetryDelay(attemptNumber: number): number {
    const baseDelay = this.config.retryPolicies.baseDelayMs;
    const backoff = Math.pow(this.config.retryPolicies.backoffMultiplier, attemptNumber - 1);
    let delay = baseDelay * backoff;

    // Add jitter if enabled
    if (this.config.retryPolicies.jitterEnabled) {
      const jitter = Math.random() * 0.1 * delay; // 10% jitter
      delay += jitter;
    }

    return Math.min(delay, this.config.retryPolicies.maxDelayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Fallback timeout')), timeoutMs);
    });
  }

  private createFailureResult(token: VortexToken, error: TokenError): ResolverResult {
    return {
      success: false,
      resolvedValue: null,
      dependencies: [],
      metadata: {
        resolveTime: 0,
        cacheHit: false,
        fallbackUsed: false,
        costImpact: {
          tokensSaved: 0,
          computeUnitsUsed: 1,
          cacheOperations: 0,
          vectorOperations: 0
        }
      },
      error
    };
  }

  private getStaticMappings(tokenType: string): Map<string, any> {
    // This would be loaded from configuration or database in production
    const mappings = new Map<string, any>();
    
    switch (tokenType) {
      case 'CONTEXT':
        mappings.set('workflow:{CONTEXT:workflow:current:agent-roles}', '["orchestrator", "resolver"]');
        break;
      case 'DATA':
        mappings.set('artifacts:{DATA:artifact:v1:user-requirements}', '{"requirements": ["fallback"]}');
        break;
      // Add more static mappings as needed
    }
    
    return mappings;
  }

  private getDefaultValues(tokenType: string): Map<string, any> {
    const defaults = new Map<string, any>();
    
    switch (tokenType) {
      case 'CONTEXT':
        defaults.set('workflow', '{"status": "unknown"}');
        break;
      case 'DATA':
        defaults.set('artifacts', '{"data": "unavailable"}');
        break;
      case 'STATE':
        defaults.set('agents', '{"state": "unknown"}');
        break;
      case 'METRICS':
        defaults.set('telemetry', '{"value": 0, "status": "unavailable"}');
        break;
      case 'TEMPORAL':
        defaults.set('time', new Date().toISOString());
        break;
    }
    
    return defaults;
  }

  private recordError(tokenId: string, error: TokenError): void {
    let metrics = this.errorMetrics.get(tokenId);
    if (!metrics) {
      metrics = {
        tokenId,
        totalErrors: 0,
        errorsByCategory: new Map(),
        lastError: Date.now(),
        errorRate: 0
      };
    }

    metrics.totalErrors++;
    metrics.lastError = Date.now();
    
    const categoryCount = metrics.errorsByCategory.get(error.category) || 0;
    metrics.errorsByCategory.set(error.category, categoryCount + 1);

    this.errorMetrics.set(tokenId, metrics);
  }

  private recordSuccessfulRetry(tokenId: string, attempt: number): void {
    // Record successful retry metrics
    console.log(`Token ${tokenId} resolved successfully on attempt ${attempt}`);
  }

  private recordSuccessfulFallback(tokenId: string, strategyName: string): void {
    // Record successful fallback metrics
    console.log(`Token ${tokenId} resolved using fallback strategy: ${strategyName}`);
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredData();
    }, 300000); // 5 minutes
  }

  private cleanupExpiredData(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    // Cleanup old fallback cache
    for (const [key, data] of this.fallbackCache.entries()) {
      if (now - data.cachedAt > maxAge) {
        this.fallbackCache.delete(key);
      }
    }

    // Cleanup old error metrics
    for (const [key, metrics] of this.errorMetrics.entries()) {
      if (now - metrics.lastError > maxAge) {
        this.errorMetrics.delete(key);
      }
    }
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): ErrorStats {
    const stats = {
      totalTokensWithErrors: this.errorMetrics.size,
      errorsByCategory: new Map<string, number>(),
      topErrorTokens: new Array<{ tokenId: string; errorCount: number }>()
    };

    for (const metrics of this.errorMetrics.values()) {
      for (const [category, count] of metrics.errorsByCategory.entries()) {
        const currentCount = stats.errorsByCategory.get(category) || 0;
        stats.errorsByCategory.set(category, currentCount + count);
      }
    }

    // Get top error tokens
    const sortedMetrics = Array.from(this.errorMetrics.values())
      .sort((a, b) => b.totalErrors - a.totalErrors)
      .slice(0, 10);

    stats.topErrorTokens = sortedMetrics.map(m => ({
      tokenId: m.tokenId,
      errorCount: m.totalErrors
    }));

    return stats;
  }
}

// Supporting interfaces

interface RetryQueue {
  tokenId: string;
  attempts: number;
  lastAttempt: number;
  nextAttempt: number;
}

interface FallbackData {
  tokenId: string;
  value: any;
  dependencies: string[];
  cachedAt: number;
}

interface FallbackStrategy {
  name: string;
  priority: number;
  execute: (token: VortexToken, context: ResolverContext) => Promise<ResolverResult>;
}

interface ErrorMetrics {
  tokenId: string;
  totalErrors: number;
  errorsByCategory: Map<string, number>;
  lastError: number;
  errorRate: number;
}

interface ErrorStats {
  totalTokensWithErrors: number;
  errorsByCategory: Map<string, number>;
  topErrorTokens: Array<{ tokenId: string; errorCount: number }>;
}