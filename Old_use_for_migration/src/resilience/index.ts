/**
 * OSSA Resilience Patterns - Main Export
 * Comprehensive error handling and resilience patterns for distributed systems
 */

// Circuit Breaker Pattern
export {
  CircuitBreaker,
  CircuitBreakerManager,
  CircuitState,
  CircuitBreakerError,
  CircuitBreakerErrorType,
  type CircuitBreakerConfig,
  type CircuitBreakerStats,
  type FailureInfo,
  type BulkheadConfig
} from './circuit-breaker';

// Retry Policy Pattern
export {
  RetryPolicy,
  RetryPolicyBuilder,
  RetryPolicies,
  RetryStrategy,
  JitterType,
  RetryError,
  RetryExhaustedError,
  RetryTimeoutError,
  NonRetryableError,
  type RetryPolicyConfig,
  type RetryResult,
  type RetryStats
} from './retry-policy';

// Cascade Prevention System
export {
  CascadePreventionSystem,
  DependencyPriority,
  FallbackStrategy,
  IsolationLevel,
  CascadePreventionError,
  DependencyIsolatedError,
  LoadSheddingError,
  type DependencyConfig,
  type CascadePreventionConfig,
  type SystemHealth,
  type DependencyHealth
} from './cascade-prevention';

// Partial Success Patterns
export {
  PartialSuccessHandler,
  PartialSuccessBuilder,
  PartialSuccessStrategy,
  OperationStatus,
  type PartialOperation,
  type OperationResult,
  type PartialSuccessResult,
  type PartialSuccessConfig
} from './partial-success';

// Timeout Management
export {
  TimeoutManager,
  TimeoutConfigBuilder,
  CancellationToken,
  TimeoutType,
  TimeoutAction,
  TimeoutError,
  OperationCancelledError,
  type TimeoutConfig,
  type OperationContext,
  type TimeoutResult,
  type PerformanceMetrics
} from './timeout-management';

// Error Classification and Handling
export {
  ErrorClassifier,
  ErrorCategory,
  ErrorSeverity,
  HandlingStrategy,
  type ErrorPattern,
  type ErrorContext,
  type ClassificationResult,
  type ErrorReport,
  type HandlingAction,
  type ErrorStatistics,
  type ErrorTrendAnalysis
} from './error-classification';

// Resilience Manager (Integration Layer)
export {
  ResilienceManager,
  ResilienceBuilder,
  type ResilienceConfig,
  type OperationOptions,
  type ResilienceResult,
  type SystemMetrics
} from './resilience-manager';

/**
 * Pre-configured resilience patterns for common use cases
 */
export const ResiliencePatterns = {
  /**
   * High availability pattern for critical services
   */
  highAvailability: () => new ResilienceBuilder()
    .circuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 30000,
      successThreshold: 5,
      timeout: 10000,
      exponentialBackoff: true,
      maxBackoffTime: 120000
    })
    .retryPolicy({
      maxAttempts: 5,
      baseDelay: 500,
      maxDelay: 10000,
      strategy: 'exponential-backoff' as any,
      jitterType: 'decorrelated' as any,
      backoffMultiplier: 2
    })
    .timeout({
      type: 'adaptive' as any,
      baseTimeout: 5000,
      maxTimeout: 15000,
      adaptiveFactor: 0.15,
      extensionCount: 2
    })
    .cascadePrevention({
      maxConcurrentFailures: 2,
      failureEscalationThreshold: 30,
      systemHealthThreshold: 80,
      enablePreemptiveIsolation: true,
      enableLoadShedding: true
    })
    .errorHandling({
      enableClassification: true,
      enableAutoRecovery: true,
      escalationThreshold: 3
    })
    .build(),

  /**
   * Fast fail pattern for non-critical services
   */
  fastFail: () => new ResilienceBuilder()
    .circuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 60000,
      successThreshold: 2,
      timeout: 3000,
      exponentialBackoff: false
    })
    .retryPolicy({
      maxAttempts: 2,
      baseDelay: 1000,
      maxDelay: 3000,
      strategy: 'fixed-delay' as any,
      jitterType: 'none' as any
    })
    .timeout({
      type: 'fixed' as any,
      baseTimeout: 3000,
      maxTimeout: 5000,
      extensionCount: 0
    })
    .cascadePrevention({
      maxConcurrentFailures: 5,
      failureEscalationThreshold: 60,
      systemHealthThreshold: 60,
      enableLoadShedding: false
    })
    .build(),

  /**
   * Bulk processing pattern with partial success
   */
  bulkProcessing: () => new ResilienceBuilder()
    .circuitBreaker({
      failureThreshold: 10,
      recoveryTimeout: 120000,
      successThreshold: 3,
      timeout: 30000,
      bulkheadIsolation: true
    })
    .retryPolicy({
      maxAttempts: 3,
      baseDelay: 2000,
      maxDelay: 30000,
      strategy: 'linear-backoff' as any,
      jitterType: 'equal' as any,
      backoffMultiplier: 1000
    })
    .timeout({
      type: 'progressive' as any,
      baseTimeout: 10000,
      maxTimeout: 60000,
      enableProgressiveTimeout: true
    })
    .cascadePrevention({
      maxConcurrentFailures: 8,
      systemHealthThreshold: 40,
      enablePreemptiveIsolation: false
    })
    .build(),

  /**
   * Network resilience pattern for external API calls
   */
  networkResilient: () => new ResilienceBuilder()
    .circuitBreaker({
      failureThreshold: 7,
      recoveryTimeout: 90000,
      successThreshold: 4,
      timeout: 15000,
      exponentialBackoff: true,
      maxBackoffTime: 300000
    })
    .retryPolicy({
      maxAttempts: 7,
      baseDelay: 1000,
      maxDelay: 60000,
      strategy: 'exponential-backoff' as any,
      jitterType: 'decorrelated' as any,
      backoffMultiplier: 1.5,
      retryableErrors: [
        /timeout/i,
        /network/i,
        /connection/i,
        /ECONNRESET/i,
        /ENOTFOUND/i,
        /ECONNREFUSED/i
      ]
    })
    .timeout({
      type: 'percentile-based' as any,
      baseTimeout: 8000,
      maxTimeout: 30000,
      percentile: 90,
      adaptiveFactor: 0.2
    })
    .cascadePrevention({
      maxConcurrentFailures: 4,
      failureEscalationThreshold: 40,
      systemHealthThreshold: 70,
      enableAdaptiveTimeout: true
    })
    .build(),

  /**
   * Real-time processing pattern
   */
  realTime: () => new ResilienceBuilder()
    .circuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 15000,
      successThreshold: 3,
      timeout: 2000,
      exponentialBackoff: false
    })
    .retryPolicy({
      maxAttempts: 2,
      baseDelay: 100,
      maxDelay: 500,
      strategy: 'fixed-delay' as any,
      jitterType: 'full' as any
    })
    .timeout({
      type: 'fixed' as any,
      baseTimeout: 1000,
      maxTimeout: 2000,
      extensionCount: 0,
      action: 'abort' as any
    })
    .cascadePrevention({
      maxConcurrentFailures: 2,
      failureEscalationThreshold: 80,
      systemHealthThreshold: 90,
      enableLoadShedding: true
    })
    .build()
};

/**
 * Utility functions for resilience patterns
 */
export const ResilienceUtils = {
  /**
   * Create a simple retry wrapper
   */
  withRetry: <T>(
    operation: () => Promise<T>,
    attempts: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    return ResiliencePatterns.fastFail().execute(operation, {
      operationName: 'retry-wrapper',
      priority: 'medium',
      retries: attempts - 1
    }).then(result => {
      if (result.success && result.result !== undefined) {
        return result.result;
      }
      throw result.error || new Error('Operation failed');
    });
  },

  /**
   * Create a timeout wrapper
   */
  withTimeout: <T>(
    operation: () => Promise<T>,
    timeoutMs: number = 5000
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  },

  /**
   * Create a circuit breaker wrapper
   */
  withCircuitBreaker: <T>(
    operation: () => Promise<T>,
    serviceName: string = 'default'
  ): Promise<T> => {
    const manager = ResiliencePatterns.highAvailability();
    return manager.execute(operation, {
      operationName: serviceName,
      priority: 'medium',
      enableCircuitBreaker: true
    }).then(result => {
      if (result.success && result.result !== undefined) {
        return result.result;
      }
      throw result.error || new Error('Circuit breaker operation failed');
    });
  },

  /**
   * Batch operations with partial success
   */
  batchWithPartialSuccess: async <T>(
    operations: Array<{ id: string; operation: () => Promise<T> }>,
    successThreshold: number = 0.7
  ): Promise<{ successful: T[]; failed: Error[]; successRate: number }> => {
    const manager = ResiliencePatterns.bulkProcessing();
    
    const result = await manager.executeBatch(
      operations.map(op => ({
        id: op.id,
        name: op.id,
        operation: op.operation
      })),
      { successThreshold }
    );

    return {
      successful: result.results
        .filter(r => r.success && r.result !== undefined)
        .map(r => r.result!),
      failed: result.results
        .filter(r => !r.success && r.error)
        .map(r => r.error!),
      successRate: result.successRate
    };
  }
};

/**
 * Default export for convenience
 */
export default {
  ResilienceManager,
  ResilienceBuilder,
  ResiliencePatterns,
  ResilienceUtils
};