/**
 * Resilience Manager Integration Tests
 */

import { ResilienceManager, ResilienceBuilder } from '../resilience-manager';
import { DependencyPriority, FallbackStrategy, IsolationLevel } from '../cascade-prevention';

describe('ResilienceManager', () => {
  let resilienceManager: ResilienceManager;

  beforeEach(() => {
    resilienceManager = new ResilienceBuilder()
      .circuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 1000,
        successThreshold: 2,
        timeout: 500
      })
      .retryPolicy({
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000
      })
      .timeout({
        baseTimeout: 1000,
        maxTimeout: 5000
      })
      .cascadePrevention({
        maxConcurrentFailures: 2,
        systemHealthThreshold: 70
      })
      .errorHandling({
        enableClassification: true,
        enableAutoRecovery: true
      })
      .build();
  });

  afterEach(async () => {
    await resilienceManager.shutdown();
  });

  describe('Basic Operation Execution', () => {
    test('should execute successful operation', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await resilienceManager.execute(operation, {
        operationName: 'test-operation',
        priority: 'medium'
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.retriesUsed).toBe(0);
      expect(result.fallbackUsed).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should handle operation failure with retries', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('failure 1'))
        .mockRejectedValueOnce(new Error('failure 2'))
        .mockResolvedValue('success');

      const result = await resilienceManager.execute(operation, {
        operationName: 'retry-operation',
        priority: 'medium'
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.retriesUsed).toBe(2);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should use fallback on failure', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('persistent failure'));
      const fallback = jest.fn().mockResolvedValue('fallback result');

      const result = await resilienceManager.execute(operation, {
        operationName: 'fallback-operation',
        priority: 'medium',
        fallbackFunction: fallback
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('fallback result');
      expect(result.fallbackUsed).toBe(true);
      expect(fallback).toHaveBeenCalled();
    });

    test('should handle timeout', async () => {
      const slowOperation = () => new Promise(resolve => {
        setTimeout(() => resolve('success'), 2000);
      });

      const result = await resilienceManager.execute(slowOperation, {
        operationName: 'slow-operation',
        priority: 'medium',
        timeout: 500
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/timeout/i);
    });
  });

  describe('Circuit Breaker Integration', () => {
    test('should open circuit breaker after failures', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('service failure'));

      // Trigger failures to open circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await resilienceManager.execute(operation, {
            operationName: 'failing-service',
            priority: 'medium',
            enableCircuitBreaker: true
          });
        } catch (error) {
          // Expected failures
        }
      }

      // Next call should be rejected by circuit breaker
      const result = await resilienceManager.execute(operation, {
        operationName: 'failing-service',
        priority: 'medium',
        enableCircuitBreaker: true
      });

      expect(result.success).toBe(false);
      expect(result.circuitBreakerState).toBe('open');
    });

    test('should force circuit breaker state', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      // Force circuit breaker to open
      resilienceManager.forceCircuitBreakerState('test-service', 'open');

      const result = await resilienceManager.execute(operation, {
        operationName: 'test-service',
        priority: 'medium',
        enableCircuitBreaker: true
      });

      expect(result.success).toBe(false);
      expect(result.circuitBreakerState).toBe('open');
    });
  });

  describe('Dependency Management', () => {
    test('should register dependency', () => {
      const dependencyConfig = {
        name: 'external-api',
        priority: DependencyPriority.HIGH,
        timeout: 5000,
        circuitBreakerConfig: {
          failureThreshold: 5,
          recoveryTimeout: 60000,
          successThreshold: 3,
          timeout: 10000,
          monitoringWindow: 300000,
          exponentialBackoff: true,
          maxBackoffTime: 300000,
          bulkheadIsolation: false
        },
        fallbackStrategy: FallbackStrategy.CACHED_RESPONSE,
        healthCheckInterval: 30000,
        isolationLevel: IsolationLevel.SERVICE
      };

      const fallbackFunction = jest.fn().mockResolvedValue('cached data');

      expect(() => {
        resilienceManager.registerDependency(dependencyConfig, fallbackFunction);
      }).not.toThrow();
    });
  });

  describe('Batch Operations', () => {
    test('should execute batch operations with partial success', async () => {
      const operations = [
        { id: 'op1', name: 'op1', operation: () => Promise.resolve('result1') },
        { id: 'op2', name: 'op2', operation: () => Promise.reject(new Error('op2 failed')) },
        { id: 'op3', name: 'op3', operation: () => Promise.resolve('result3') },
        { id: 'op4', name: 'op4', operation: () => Promise.resolve('result4') }
      ];

      const result = await resilienceManager.executeBatch(operations, {
        successThreshold: 0.5,
        maxConcurrency: 2
      });

      expect(result.overall).toBe('success'); // 75% success rate > 50% threshold
      expect(result.successRate).toBe(0.75);
      expect(result.results).toHaveLength(4);
      
      const successfulResults = result.results.filter(r => r.success);
      const failedResults = result.results.filter(r => !r.success);
      
      expect(successfulResults).toHaveLength(3);
      expect(failedResults).toHaveLength(1);
    });

    test('should handle batch with low success threshold', async () => {
      const operations = [
        { id: 'op1', name: 'op1', operation: () => Promise.reject(new Error('failed')) },
        { id: 'op2', name: 'op2', operation: () => Promise.reject(new Error('failed')) },
        { id: 'op3', name: 'op3', operation: () => Promise.resolve('success') }
      ];

      const result = await resilienceManager.executeBatch(operations, {
        successThreshold: 0.9 // 90% threshold, only 33% success
      });

      expect(result.overall).toBe('partial'); // Below threshold but some succeeded
      expect(result.successRate).toBeCloseTo(0.33, 1);
    });
  });

  describe('Operation Management', () => {
    test('should track active operations', async () => {
      const slowOperation = () => new Promise(resolve => {
        setTimeout(() => resolve('success'), 500);
      });

      // Start operation
      const operationPromise = resilienceManager.execute(slowOperation, {
        operationId: 'tracked-op',
        operationName: 'tracked-operation',
        priority: 'medium'
      });

      // Check active operations
      const activeOps = resilienceManager.getActiveOperations();
      expect(activeOps).toHaveLength(1);
      expect(activeOps[0].operationId).toBe('tracked-op');
      expect(activeOps[0].operationName).toBe('tracked-operation');

      await operationPromise;

      // Should be empty after completion
      const activeOpsAfter = resilienceManager.getActiveOperations();
      expect(activeOpsAfter).toHaveLength(0);
    });

    test('should cancel operations', async () => {
      const slowOperation = () => new Promise(resolve => {
        setTimeout(() => resolve('success'), 2000);
      });

      const operationId = 'cancellable-op';

      // Start operation
      const operationPromise = resilienceManager.execute(slowOperation, {
        operationId,
        operationName: 'cancellable-operation',
        priority: 'medium'
      });

      // Cancel after short delay
      setTimeout(() => {
        const cancelled = resilienceManager.cancelOperation(operationId, 'Test cancellation');
        expect(cancelled).toBe(true);
      }, 100);

      const result = await operationPromise;
      expect(result.success).toBe(false);
    });
  });

  describe('System Metrics', () => {
    test('should provide system metrics', async () => {
      // Execute some operations to generate metrics
      const operation = jest.fn().mockResolvedValue('success');

      await resilienceManager.execute(operation, {
        operationName: 'metrics-test',
        priority: 'medium'
      });

      const metrics = resilienceManager.getSystemMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.systemHealth).toBeDefined();
      expect(metrics.overallResilience).toBeDefined();
      expect(metrics.overallResilience.score).toBeGreaterThanOrEqual(0);
      expect(metrics.overallResilience.score).toBeLessThanOrEqual(100);
    });

    test('should track resilience score', async () => {
      const metrics = resilienceManager.getSystemMetrics();
      
      expect(metrics.overallResilience.score).toBeDefined();
      expect(typeof metrics.overallResilience.score).toBe('number');
      expect(['improving', 'stable', 'degrading']).toContain(metrics.overallResilience.trend);
      expect(Array.isArray(metrics.overallResilience.recommendations)).toBe(true);
    });
  });

  describe('Configuration Updates', () => {
    test('should update configuration', () => {
      const newConfig = {
        circuitBreaker: {
          failureThreshold: 5,
          recoveryTimeout: 2000,
          successThreshold: 3,
          timeout: 1000,
          monitoringWindow: 300000,
          exponentialBackoff: true,
          maxBackoffTime: 300000,
          bulkheadIsolation: false
        }
      };

      expect(() => {
        resilienceManager.updateConfig(newConfig);
      }).not.toThrow();
    });
  });

  describe('Events', () => {
    test('should emit operation events', (done) => {
      let eventsReceived = 0;

      resilienceManager.on('operationStarted', (event) => {
        expect(event.operationName).toBe('event-test');
        eventsReceived++;
      });

      resilienceManager.on('operationCompleted', (event) => {
        expect(event.success).toBe(true);
        eventsReceived++;
        
        if (eventsReceived === 2) {
          done();
        }
      });

      const operation = jest.fn().mockResolvedValue('success');

      resilienceManager.execute(operation, {
        operationName: 'event-test',
        priority: 'medium'
      });
    });

    test('should emit circuit breaker events', (done) => {
      resilienceManager.on('circuitBreakerStateChanged', (event) => {
        expect(event.newState).toBe('open');
        done();
      });

      // Force a circuit breaker state change
      resilienceManager.forceCircuitBreakerState('event-test-service', 'open');
    });
  });

  describe('Cleanup and Shutdown', () => {
    test('should cleanup resources on shutdown', async () => {
      const operation = () => new Promise(resolve => {
        setTimeout(() => resolve('success'), 1000);
      });

      // Start some operations
      const promises = [
        resilienceManager.execute(operation, {
          operationName: 'cleanup-test-1',
          priority: 'medium'
        }),
        resilienceManager.execute(operation, {
          operationName: 'cleanup-test-2',
          priority: 'medium'
        })
      ];

      // Shutdown should cancel active operations
      await resilienceManager.shutdown();

      // Operations should be cancelled
      const results = await Promise.all(promises);
      expect(results.some(r => !r.success)).toBe(true);
    });
  });
});

describe('ResilienceBuilder', () => {
  test('should build resilience manager with custom configuration', () => {
    const manager = new ResilienceBuilder()
      .circuitBreaker({
        failureThreshold: 10,
        recoveryTimeout: 30000
      })
      .retryPolicy({
        maxAttempts: 5,
        baseDelay: 2000
      })
      .timeout({
        baseTimeout: 5000,
        maxTimeout: 15000
      })
      .cascadePrevention({
        maxConcurrentFailures: 5,
        systemHealthThreshold: 50
      })
      .errorHandling({
        enableClassification: false,
        enableAutoRecovery: false
      })
      .build();

    expect(manager).toBeInstanceOf(ResilienceManager);
  });

  test('should use default values for missing configuration', () => {
    const manager = new ResilienceBuilder().build();
    
    expect(manager).toBeInstanceOf(ResilienceManager);
    
    const metrics = manager.getSystemMetrics();
    expect(metrics).toBeDefined();
  });
});