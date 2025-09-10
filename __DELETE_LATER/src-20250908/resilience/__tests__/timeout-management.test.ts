/**
 * Timeout Management Tests
 */

import {
  TimeoutManager,
  TimeoutConfigBuilder,
  CancellationToken,
  TimeoutType,
  TimeoutAction,
  TimeoutError,
  OperationCancelledError
} from '../timeout-management';

describe('TimeoutManager', () => {
  let timeoutManager: TimeoutManager;

  beforeEach(() => {
    const config = new TimeoutConfigBuilder()
      .type(TimeoutType.FIXED)
      .baseTimeout(1000)
      .build();
    timeoutManager = new TimeoutManager(config);
  });

  describe('Basic Timeout Functionality', () => {
    test('should complete operation within timeout', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await timeoutManager.executeWithTimeout(
        operation,
        {
          operationId: 'test-1',
          operationName: 'test-operation',
          priority: 'medium'
        }
      );

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.cancelled).toBe(false);
    });

    test('should timeout slow operations', async () => {
      const slowOperation = () => new Promise(resolve => {
        setTimeout(() => resolve('success'), 2000);
      });

      const result = await timeoutManager.executeWithTimeout(
        slowOperation,
        {
          operationId: 'test-2',
          operationName: 'slow-operation',
          priority: 'medium'
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(TimeoutError);
      expect(result.cancelled).toBe(false);
    });

    test('should handle operation errors', async () => {
      const errorOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));

      await expect(timeoutManager.executeWithTimeout(
        errorOperation,
        {
          operationId: 'test-3',
          operationName: 'error-operation',
          priority: 'medium'
        }
      )).rejects.toThrow('Operation failed');
    });
  });

  describe('Cancellation', () => {
    test('should cancel operation via cancellation token', async () => {
      const token = new CancellationToken();
      const operation = jest.fn().mockImplementation(async (ct?: CancellationToken) => {
        // Simulate long operation
        await new Promise(resolve => setTimeout(resolve, 2000));
        ct?.throwIfCancelled();
        return 'success';
      });

      // Cancel after 100ms
      setTimeout(() => {
        token.cancel('Test cancellation');
      }, 100);

      const result = await timeoutManager.executeWithTimeout(
        operation,
        {
          operationId: 'test-4',
          operationName: 'cancellable-operation',
          priority: 'medium',
          cancellationToken: token
        }
      );

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
    });

    test('should cancel operation by operation ID', async () => {
      const operationId = 'test-5';
      const operation = () => new Promise(resolve => {
        setTimeout(() => resolve('success'), 2000);
      });

      // Start operation
      const operationPromise = timeoutManager.executeWithTimeout(
        operation,
        {
          operationId,
          operationName: 'cancellable-operation',
          priority: 'medium'
        }
      );

      // Cancel after 100ms
      setTimeout(() => {
        timeoutManager.cancelOperation(operationId, 'External cancellation');
      }, 100);

      const result = await operationPromise;
      expect(result.cancelled).toBe(true);
    });
  });

  describe('Timeout Extension', () => {
    test('should extend timeout for active operations', async () => {
      const config = new TimeoutConfigBuilder()
        .type(TimeoutType.FIXED)
        .baseTimeout(500)
        .allowExtensions(2, 2.0)
        .build();
      
      const timeoutManagerWithExtensions = new TimeoutManager(config);
      const operationId = 'test-6';

      const operation = () => new Promise(resolve => {
        setTimeout(() => resolve('success'), 1200); // Longer than base timeout
      });

      // Start operation
      const operationPromise = timeoutManagerWithExtensions.executeWithTimeout(
        operation,
        {
          operationId,
          operationName: 'extendable-operation',
          priority: 'high'
        }
      );

      // Extend timeout after 300ms
      setTimeout(() => {
        timeoutManagerWithExtensions.extendTimeout(operationId, 1000);
      }, 300);

      const result = await operationPromise;
      expect(result.success).toBe(true);
      expect(result.extensions).toBeGreaterThan(0);
    });

    test('should limit number of extensions', async () => {
      const config = new TimeoutConfigBuilder()
        .type(TimeoutType.FIXED)
        .baseTimeout(200)
        .allowExtensions(1, 1.5)
        .build();
      
      const timeoutManagerWithLimitedExtensions = new TimeoutManager(config);
      const operationId = 'test-7';

      const operation = () => new Promise(resolve => {
        setTimeout(() => resolve('success'), 1000);
      });

      // Start operation
      const operationPromise = timeoutManagerWithLimitedExtensions.executeWithTimeout(
        operation,
        {
          operationId,
          operationName: 'limited-extension-operation',
          priority: 'medium'
        }
      );

      // Try to extend multiple times
      setTimeout(() => {
        const success1 = timeoutManagerWithLimitedExtensions.extendTimeout(operationId);
        const success2 = timeoutManagerWithLimitedExtensions.extendTimeout(operationId);
        
        expect(success1).toBe(true);  // First extension should succeed
        expect(success2).toBe(false); // Second extension should fail
      }, 100);

      const result = await operationPromise;
      expect(result.extensions).toBe(1);
    });
  });

  describe('Adaptive Timeout', () => {
    test('should calculate adaptive timeout based on performance metrics', async () => {
      const config = new TimeoutConfigBuilder()
        .type(TimeoutType.ADAPTIVE)
        .baseTimeout(1000)
        .adaptive(0.2)
        .build();
      
      const adaptiveTimeoutManager = new TimeoutManager(config);
      
      // Execute some operations to build performance history
      const fastOperation = () => Promise.resolve('fast');
      const slowOperation = () => new Promise(resolve => setTimeout(() => resolve('slow'), 800));

      // Run fast operations to establish baseline
      for (let i = 0; i < 5; i++) {
        await adaptiveTimeoutManager.executeWithTimeout(
          fastOperation,
          {
            operationId: `fast-${i}`,
            operationName: 'fast-operation',
            priority: 'medium'
          }
        );
      }

      // Run slow operation to see if timeout adapts
      const result = await adaptiveTimeoutManager.executeWithTimeout(
        slowOperation,
        {
          operationId: 'slow-1',
          operationName: 'fast-operation', // Same name to use same metrics
          priority: 'medium'
        }
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    test('should track performance metrics', async () => {
      const operation = () => Promise.resolve('success');
      
      // Execute multiple operations
      for (let i = 0; i < 3; i++) {
        await timeoutManager.executeWithTimeout(
          operation,
          {
            operationId: `perf-${i}`,
            operationName: 'tracked-operation',
            priority: 'medium'
          }
        );
      }

      const metrics = timeoutManager.getPerformanceMetrics('tracked-operation');
      
      expect(metrics).toBeDefined();
      expect(metrics!.totalOperations).toBe(3);
      expect(metrics!.successRate).toBe(1.0);
      expect(metrics!.timeoutRate).toBe(0.0);
      expect(metrics!.averageResponseTime).toBeGreaterThan(0);
    });

    test('should update metrics on timeout', async () => {
      const slowOperation = () => new Promise(resolve => {
        setTimeout(() => resolve('success'), 2000);
      });

      try {
        await timeoutManager.executeWithTimeout(
          slowOperation,
          {
            operationId: 'timeout-test',
            operationName: 'timeout-operation',
            priority: 'medium'
          }
        );
      } catch (error) {
        // Expected timeout
      }

      const metrics = timeoutManager.getPerformanceMetrics('timeout-operation');
      
      expect(metrics).toBeDefined();
      expect(metrics!.timeoutRate).toBeGreaterThan(0);
      expect(metrics!.successRate).toBe(0);
    });
  });

  describe('Cleanup Functions', () => {
    test('should execute cleanup function on success', async () => {
      const cleanupFn = jest.fn().mockResolvedValue(undefined);
      const operation = jest.fn().mockResolvedValue('success');

      const result = await timeoutManager.executeWithTimeout(
        operation,
        {
          operationId: 'cleanup-test',
          operationName: 'cleanup-operation',
          priority: 'medium',
          cleanupFunction: cleanupFn
        }
      );

      expect(result.success).toBe(true);
      expect(result.cleanedUp).toBe(true);
      expect(cleanupFn).toHaveBeenCalled();
    });

    test('should execute cleanup function on timeout', async () => {
      const cleanupFn = jest.fn().mockResolvedValue(undefined);
      const slowOperation = () => new Promise(resolve => {
        setTimeout(() => resolve('success'), 2000);
      });

      const result = await timeoutManager.executeWithTimeout(
        slowOperation,
        {
          operationId: 'cleanup-timeout-test',
          operationName: 'cleanup-timeout-operation',
          priority: 'medium',
          cleanupFunction: cleanupFn
        }
      );

      expect(result.success).toBe(false);
      expect(result.cleanedUp).toBe(true);
      expect(cleanupFn).toHaveBeenCalled();
    });

    test('should handle cleanup function timeout', async () => {
      const slowCleanup = () => new Promise(resolve => {
        setTimeout(() => resolve(undefined), 2000);
      });
      
      const operation = jest.fn().mockResolvedValue('success');

      // Use short cleanup timeout
      const config = new TimeoutConfigBuilder()
        .type(TimeoutType.FIXED)
        .baseTimeout(1000)
        .cleanupTimeout(100)
        .build();
      
      const timeoutManagerWithShortCleanup = new TimeoutManager(config);

      const result = await timeoutManagerWithShortCleanup.executeWithTimeout(
        operation,
        {
          operationId: 'slow-cleanup-test',
          operationName: 'slow-cleanup-operation',
          priority: 'medium',
          cleanupFunction: slowCleanup
        }
      );

      expect(result.success).toBe(true);
      expect(result.cleanedUp).toBe(false); // Cleanup should have timed out
    });
  });

  describe('Active Operations', () => {
    test('should track active operations', async () => {
      const slowOperation = () => new Promise(resolve => {
        setTimeout(() => resolve('success'), 500);
      });

      // Start operation
      const operationPromise = timeoutManager.executeWithTimeout(
        slowOperation,
        {
          operationId: 'active-test',
          operationName: 'active-operation',
          priority: 'medium'
        }
      );

      // Check active operations
      const activeOps = timeoutManager.getActiveOperations();
      expect(activeOps).toHaveLength(1);
      expect(activeOps[0].operationId).toBe('active-test');
      expect(activeOps[0].operationName).toBe('active-operation');

      await operationPromise;

      // Should be empty after completion
      const activeOpsAfter = timeoutManager.getActiveOperations();
      expect(activeOpsAfter).toHaveLength(0);
    });
  });
});

describe('CancellationToken', () => {
  test('should start uncancelled', () => {
    const token = new CancellationToken();
    expect(token.cancelled).toBe(false);
    expect(token.reason).toBeUndefined();
  });

  test('should cancel with reason', () => {
    const token = new CancellationToken();
    token.cancel('Test reason');
    
    expect(token.cancelled).toBe(true);
    expect(token.reason).toBe('Test reason');
  });

  test('should throw when cancelled', () => {
    const token = new CancellationToken();
    token.cancel('Test cancellation');
    
    expect(() => token.throwIfCancelled()).toThrow(OperationCancelledError);
  });

  test('should execute cancellation callbacks', () => {
    const token = new CancellationToken();
    const callback = jest.fn();
    
    token.onCancellation(callback);
    token.cancel();
    
    expect(callback).toHaveBeenCalled();
  });

  test('should execute callbacks immediately if already cancelled', () => {
    const token = new CancellationToken();
    token.cancel();
    
    const callback = jest.fn();
    token.onCancellation(callback);
    
    expect(callback).toHaveBeenCalled();
  });
});

describe('TimeoutConfigBuilder', () => {
  test('should build timeout configuration', () => {
    const config = new TimeoutConfigBuilder()
      .type(TimeoutType.EXPONENTIAL_BACKOFF)
      .baseTimeout(2000)
      .minTimeout(500)
      .maxTimeout(10000)
      .adaptive(0.3)
      .percentile(90)
      .allowExtensions(3, 2.0)
      .onTimeout(TimeoutAction.EXTEND)
      .enableCancellation(true)
      .cleanupTimeout(3000)
      .trackPerformance(true)
      .build();

    expect(config.type).toBe(TimeoutType.EXPONENTIAL_BACKOFF);
    expect(config.baseTimeout).toBe(2000);
    expect(config.minTimeout).toBe(500);
    expect(config.maxTimeout).toBe(10000);
    expect(config.adaptiveFactor).toBe(0.3);
    expect(config.percentile).toBe(90);
    expect(config.extensionCount).toBe(3);
    expect(config.extensionMultiplier).toBe(2.0);
    expect(config.action).toBe(TimeoutAction.EXTEND);
    expect(config.enableCancellation).toBe(true);
    expect(config.cleanupTimeout).toBe(3000);
    expect(config.trackPerformance).toBe(true);
  });
});