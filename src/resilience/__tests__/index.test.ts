/**
 * Integration and Export Tests
 */

import {
  // Circuit Breaker
  CircuitBreaker,
  CircuitBreakerManager,
  CircuitState,

  // Retry Policy
  RetryPolicy,
  RetryPolicyBuilder,
  RetryStrategy,
  JitterType,

  // Cascade Prevention
  CascadePreventionSystem,
  DependencyPriority,
  FallbackStrategy,

  // Partial Success
  PartialSuccessHandler,
  PartialSuccessBuilder,
  PartialSuccessStrategy,

  // Timeout Management
  TimeoutManager,
  TimeoutConfigBuilder,
  CancellationToken,
  TimeoutType,

  // Error Classification
  ErrorClassifier,
  ErrorCategory,
  ErrorSeverity,
  HandlingStrategy,

  // Resilience Manager
  ResilienceManager,
  ResilienceBuilder,

  // Patterns and Utils
  ResiliencePatterns,
  ResilienceUtils
} from '../index';

describe('Package Exports', () => {
  test('should export all circuit breaker components', () => {
    expect(CircuitBreaker).toBeDefined();
    expect(CircuitBreakerManager).toBeDefined();
    expect(CircuitState).toBeDefined();
    expect(CircuitState.CLOSED).toBe('closed');
    expect(CircuitState.OPEN).toBe('open');
    expect(CircuitState.HALF_OPEN).toBe('half-open');
  });

  test('should export all retry policy components', () => {
    expect(RetryPolicy).toBeDefined();
    expect(RetryPolicyBuilder).toBeDefined();
    expect(RetryStrategy).toBeDefined();
    expect(JitterType).toBeDefined();
    
    expect(RetryStrategy.FIXED_DELAY).toBe('fixed-delay');
    expect(RetryStrategy.EXPONENTIAL_BACKOFF).toBe('exponential-backoff');
    expect(JitterType.FULL).toBe('full');
    expect(JitterType.NONE).toBe('none');
  });

  test('should export all cascade prevention components', () => {
    expect(CascadePreventionSystem).toBeDefined();
    expect(DependencyPriority).toBeDefined();
    expect(FallbackStrategy).toBeDefined();
    
    expect(DependencyPriority.CRITICAL).toBe('critical');
    expect(FallbackStrategy.FAIL_FAST).toBe('fail-fast');
  });

  test('should export all partial success components', () => {
    expect(PartialSuccessHandler).toBeDefined();
    expect(PartialSuccessBuilder).toBeDefined();
    expect(PartialSuccessStrategy).toBeDefined();
    
    expect(PartialSuccessStrategy.BEST_EFFORT).toBe('best-effort');
    expect(PartialSuccessStrategy.ALL_OR_NOTHING).toBe('all-or-nothing');
  });

  test('should export all timeout management components', () => {
    expect(TimeoutManager).toBeDefined();
    expect(TimeoutConfigBuilder).toBeDefined();
    expect(CancellationToken).toBeDefined();
    expect(TimeoutType).toBeDefined();
    
    expect(TimeoutType.FIXED).toBe('fixed');
    expect(TimeoutType.ADAPTIVE).toBe('adaptive');
  });

  test('should export all error classification components', () => {
    expect(ErrorClassifier).toBeDefined();
    expect(ErrorCategory).toBeDefined();
    expect(ErrorSeverity).toBeDefined();
    expect(HandlingStrategy).toBeDefined();
    
    expect(ErrorCategory.TRANSIENT).toBe('transient');
    expect(ErrorSeverity.CRITICAL).toBe('critical');
    expect(HandlingStrategy.RETRY).toBe('retry');
  });

  test('should export resilience manager components', () => {
    expect(ResilienceManager).toBeDefined();
    expect(ResilienceBuilder).toBeDefined();
  });

  test('should export resilience patterns and utils', () => {
    expect(ResiliencePatterns).toBeDefined();
    expect(ResilienceUtils).toBeDefined();
    
    expect(typeof ResiliencePatterns.highAvailability).toBe('function');
    expect(typeof ResiliencePatterns.fastFail).toBe('function');
    expect(typeof ResiliencePatterns.bulkProcessing).toBe('function');
    expect(typeof ResiliencePatterns.networkResilient).toBe('function');
    expect(typeof ResiliencePatterns.realTime).toBe('function');
    
    expect(typeof ResilienceUtils.withRetry).toBe('function');
    expect(typeof ResilienceUtils.withTimeout).toBe('function');
    expect(typeof ResilienceUtils.withCircuitBreaker).toBe('function');
    expect(typeof ResilienceUtils.batchWithPartialSuccess).toBe('function');
  });
});

describe('ResiliencePatterns', () => {
  test('should create high availability pattern', () => {
    const manager = ResiliencePatterns.highAvailability();
    expect(manager).toBeInstanceOf(ResilienceManager);
  });

  test('should create fast fail pattern', () => {
    const manager = ResiliencePatterns.fastFail();
    expect(manager).toBeInstanceOf(ResilienceManager);
  });

  test('should create bulk processing pattern', () => {
    const manager = ResiliencePatterns.bulkProcessing();
    expect(manager).toBeInstanceOf(ResilienceManager);
  });

  test('should create network resilient pattern', () => {
    const manager = ResiliencePatterns.networkResilient();
    expect(manager).toBeInstanceOf(ResilienceManager);
  });

  test('should create real-time pattern', () => {
    const manager = ResiliencePatterns.realTime();
    expect(manager).toBeInstanceOf(ResilienceManager);
  });
});

describe('ResilienceUtils', () => {
  describe('withRetry', () => {
    test('should retry failed operations', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValue('success');

      const result = await ResilienceUtils.withRetry(operation, 3, 10);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    test('should fail after exhausting retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('persistent failure'));

      await expect(ResilienceUtils.withRetry(operation, 2, 10))
        .rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('withTimeout', () => {
    test('should complete operations within timeout', async () => {
      const operation = () => Promise.resolve('success');

      const result = await ResilienceUtils.withTimeout(operation, 1000);
      expect(result).toBe('success');
    });

    test('should timeout slow operations', async () => {
      const slowOperation = () => new Promise(resolve => {
        setTimeout(() => resolve('success'), 1000);
      });

      await expect(ResilienceUtils.withTimeout(slowOperation, 100))
        .rejects.toThrow(/timeout/i);
    });
  });

  describe('withCircuitBreaker', () => {
    test('should execute operation with circuit breaker', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await ResilienceUtils.withCircuitBreaker(operation, 'test-service');
      expect(result).toBe('success');
    });

    test('should handle circuit breaker failures', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('service failure'));

      await expect(ResilienceUtils.withCircuitBreaker(operation, 'failing-service'))
        .rejects.toThrow();
    });
  });

  describe('batchWithPartialSuccess', () => {
    test('should handle batch operations', async () => {
      const operations = [
        { id: 'op1', operation: () => Promise.resolve('result1') },
        { id: 'op2', operation: () => Promise.reject(new Error('failed')) },
        { id: 'op3', operation: () => Promise.resolve('result3') }
      ];

      const result = await ResilienceUtils.batchWithPartialSuccess(operations, 0.5);

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.successRate).toBeCloseTo(0.67, 1);
      expect(result.successful).toContain('result1');
      expect(result.successful).toContain('result3');
    });

    test('should handle all failed operations', async () => {
      const operations = [
        { id: 'op1', operation: () => Promise.reject(new Error('failed1')) },
        { id: 'op2', operation: () => Promise.reject(new Error('failed2')) }
      ];

      const result = await ResilienceUtils.batchWithPartialSuccess(operations, 0.5);

      expect(result.successful).toHaveLength(0);
      expect(result.failed).toHaveLength(2);
      expect(result.successRate).toBe(0);
    });

    test('should handle all successful operations', async () => {
      const operations = [
        { id: 'op1', operation: () => Promise.resolve('result1') },
        { id: 'op2', operation: () => Promise.resolve('result2') }
      ];

      const result = await ResilienceUtils.batchWithPartialSuccess(operations, 0.5);

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.successRate).toBe(1);
    });
  });
});

describe('Integration Scenarios', () => {
  test('should handle complex resilience scenario', async () => {
    // Create a resilience manager with multiple patterns
    const manager = new ResilienceBuilder()
      .circuitBreaker({ failureThreshold: 3, recoveryTimeout: 1000 })
      .retryPolicy({ maxAttempts: 3, baseDelay: 100 })
      .timeout({ baseTimeout: 2000 })
      .build();

    let callCount = 0;
    const operation = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.reject(new Error(`Failure ${callCount}`));
      }
      return Promise.resolve(`Success on attempt ${callCount}`);
    });

    const result = await manager.execute(operation, {
      operationName: 'complex-operation',
      priority: 'high'
    });

    expect(result.success).toBe(true);
    expect(result.result).toBe('Success on attempt 3');
    expect(result.retriesUsed).toBe(2);
    expect(operation).toHaveBeenCalledTimes(3);

    await manager.shutdown();
  });

  test('should demonstrate pattern composition', async () => {
    // Use high availability pattern
    const haManager = ResiliencePatterns.highAvailability();
    
    // Register a dependency
    haManager.registerDependency({
      name: 'critical-service',
      priority: DependencyPriority.CRITICAL,
      timeout: 5000,
      circuitBreakerConfig: {
        failureThreshold: 3,
        recoveryTimeout: 30000,
        successThreshold: 2,
        timeout: 5000,
        monitoringWindow: 300000,
        exponentialBackoff: true,
        maxBackoffTime: 300000,
        bulkheadIsolation: false
      },
      fallbackStrategy: FallbackStrategy.CACHED_RESPONSE,
      healthCheckInterval: 30000,
      isolationLevel: 'service' as any
    });

    const operation = jest.fn().mockResolvedValue('service response');

    const result = await haManager.execute(operation, {
      operationName: 'critical-service',
      priority: 'critical'
    });

    expect(result.success).toBe(true);
    expect(result.result).toBe('service response');

    await haManager.shutdown();
  });

  test('should handle cascading failure prevention', async () => {
    const manager = ResiliencePatterns.networkResilient();

    // Simulate multiple failing operations
    const failingOperations = Array(5).fill(null).map((_, i) => ({
      id: `op${i}`,
      name: `operation${i}`,
      operation: () => Promise.reject(new Error(`Network error ${i}`))
    }));

    const result = await manager.executeBatch(failingOperations, {
      successThreshold: 0.1, // Very low threshold
      maxConcurrency: 3
    });

    expect(result.overall).toBe('failed'); // Should fail due to all operations failing
    expect(result.successRate).toBe(0);
    expect(result.results).toHaveLength(5);

    await manager.shutdown();
  });
});