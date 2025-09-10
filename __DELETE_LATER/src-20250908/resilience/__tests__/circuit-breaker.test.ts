/**
 * Circuit Breaker Tests
 */

import { CircuitBreaker, CircuitState, CircuitBreakerError, CircuitBreakerErrorType } from '../circuit-breaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  
  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test-circuit', {
      failureThreshold: 3,
      recoveryTimeout: 1000,
      successThreshold: 2,
      timeout: 500,
      monitoringWindow: 5000,
      exponentialBackoff: false,
      maxBackoffTime: 5000,
      bulkheadIsolation: false
    });
  });

  afterEach(() => {
    circuitBreaker.reset();
  });

  describe('Circuit States', () => {
    test('should start in CLOSED state', () => {
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
    });

    test('should open circuit after failure threshold', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test failure'));
      
      // Trigger failures to exceed threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.OPEN);
    });

    test('should reject requests when circuit is open', async () => {
      // Force circuit to open state
      circuitBreaker.forceState(CircuitState.OPEN);
      
      const operation = jest.fn().mockResolvedValue('success');
      
      await expect(circuitBreaker.execute(operation)).rejects.toThrow(CircuitBreakerError);
      expect(operation).not.toHaveBeenCalled();
    });

    test('should transition to half-open after recovery timeout', async () => {
      // Open the circuit
      circuitBreaker.forceState(CircuitState.OPEN);
      
      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const operation = jest.fn().mockResolvedValue('success');
      
      // This should transition to half-open and execute
      const result = await circuitBreaker.execute(operation);
      expect(result).toBe('success');
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.HALF_OPEN);
    });

    test('should close circuit after successful attempts in half-open', async () => {
      circuitBreaker.forceState(CircuitState.HALF_OPEN);
      
      const operation = jest.fn().mockResolvedValue('success');
      
      // Execute successful operations to meet success threshold
      for (let i = 0; i < 2; i++) {
        await circuitBreaker.execute(operation);
      }
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
    });
  });

  describe('Timeout Handling', () => {
    test('should timeout long-running operations', async () => {
      const longRunningOperation = () => new Promise(resolve => {
        setTimeout(() => resolve('success'), 1000);
      });
      
      await expect(circuitBreaker.execute(longRunningOperation))
        .rejects.toThrow('Request timeout after 500ms');
    });

    test('should not timeout fast operations', async () => {
      const fastOperation = () => new Promise(resolve => {
        setTimeout(() => resolve('success'), 100);
      });
      
      const result = await circuitBreaker.execute(fastOperation);
      expect(result).toBe('success');
    });
  });

  describe('Statistics', () => {
    test('should track success and failure counts', async () => {
      const successOp = jest.fn().mockResolvedValue('success');
      const failureOp = jest.fn().mockRejectedValue(new Error('failure'));
      
      await circuitBreaker.execute(successOp);
      await circuitBreaker.execute(successOp);
      
      try {
        await circuitBreaker.execute(failureOp);
      } catch (error) {
        // Expected
      }
      
      const stats = circuitBreaker.getStats();
      expect(stats.successes).toBe(2);
      expect(stats.failures).toBe(1);
      expect(stats.totalRequests).toBe(3);
    });

    test('should calculate uptime correctly', async () => {
      const successOp = jest.fn().mockResolvedValue('success');
      
      // All successful operations should give 100% uptime
      for (let i = 0; i < 5; i++) {
        await circuitBreaker.execute(successOp);
      }
      
      const stats = circuitBreaker.getStats();
      expect(stats.uptime).toBe(100);
    });
  });

  describe('Events', () => {
    test('should emit state change events', (done) => {
      circuitBreaker.on('stateChanged', (event) => {
        expect(event.newState).toBe(CircuitState.OPEN);
        expect(event.previousState).toBe(CircuitState.CLOSED);
        done();
      });
      
      circuitBreaker.forceState(CircuitState.OPEN);
    });

    test('should emit request success events', (done) => {
      circuitBreaker.on('requestSuccess', (event) => {
        expect(event.duration).toBeGreaterThan(0);
        expect(event.consecutiveFailures).toBe(0);
        done();
      });
      
      circuitBreaker.execute(() => Promise.resolve('success'));
    });

    test('should emit request failure events', (done) => {
      circuitBreaker.on('requestFailure', (event) => {
        expect(event.error).toBeInstanceOf(Error);
        expect(event.consecutiveFailures).toBe(1);
        done();
      });
      
      circuitBreaker.execute(() => Promise.reject(new Error('test failure')))
        .catch(() => {}); // Handle rejection to prevent unhandled promise rejection
    });
  });

  describe('Reset Functionality', () => {
    test('should reset all counters and state', async () => {
      // Generate some activity
      const failureOp = jest.fn().mockRejectedValue(new Error('failure'));
      
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failureOp);
        } catch (error) {
          // Expected
        }
      }
      
      // Reset the circuit breaker
      circuitBreaker.reset();
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.consecutiveFailures).toBe(0);
    });
  });

  describe('Error Types', () => {
    test('should throw CircuitBreakerError when circuit is open', async () => {
      circuitBreaker.forceState(CircuitState.OPEN);
      
      try {
        await circuitBreaker.execute(() => Promise.resolve('test'));
        fail('Should have thrown CircuitBreakerError');
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerError);
        expect((error as CircuitBreakerError).type).toBe(CircuitBreakerErrorType.CIRCUIT_OPEN);
      }
    });

    test('should throw timeout error for slow operations', async () => {
      const slowOp = () => new Promise(resolve => setTimeout(() => resolve('success'), 1000));
      
      try {
        await circuitBreaker.execute(slowOp);
        fail('Should have thrown timeout error');
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerError);
        expect((error as CircuitBreakerError).type).toBe(CircuitBreakerErrorType.TIMEOUT);
      }
    });
  });
});