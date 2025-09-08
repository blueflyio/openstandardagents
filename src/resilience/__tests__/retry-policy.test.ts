/**
 * Retry Policy Tests
 */

import {
  RetryPolicy,
  RetryPolicyBuilder,
  RetryStrategy,
  JitterType,
  RetryExhaustedError,
  RetryTimeoutError,
  NonRetryableError
} from '../retry-policy';

describe('RetryPolicy', () => {
  describe('Basic Retry Logic', () => {
    test('should succeed on first attempt', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        strategy: RetryStrategy.FIXED_DELAY,
        jitterType: JitterType.NONE,
        backoffMultiplier: 2,
        retryableErrors: [],
        nonRetryableErrors: []
      });

      const operation = jest.fn().mockResolvedValue('success');
      const result = await policy.execute(operation);

      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure and eventually succeed', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        baseDelay: 10,
        maxDelay: 1000,
        strategy: RetryStrategy.FIXED_DELAY,
        jitterType: JitterType.NONE,
        backoffMultiplier: 2,
        retryableErrors: [],
        nonRetryableErrors: []
      });

      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('failure 1'))
        .mockRejectedValueOnce(new Error('failure 2'))
        .mockResolvedValue('success');

      const result = await policy.execute(operation);

      expect(result.result).toBe('success');
      expect(result.attempts).toBe(3);
      expect(result.errors).toHaveLength(2);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should throw RetryExhaustedError when all attempts fail', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 2,
        baseDelay: 10,
        maxDelay: 1000,
        strategy: RetryStrategy.FIXED_DELAY,
        jitterType: JitterType.NONE,
        backoffMultiplier: 2,
        retryableErrors: [],
        nonRetryableErrors: []
      });

      const operation = jest.fn().mockRejectedValue(new Error('persistent failure'));

      await expect(policy.execute(operation)).rejects.toThrow(RetryExhaustedError);
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Retry Strategies', () => {
    test('should use fixed delay strategy', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        strategy: RetryStrategy.FIXED_DELAY,
        jitterType: JitterType.NONE,
        backoffMultiplier: 2,
        retryableErrors: [],
        nonRetryableErrors: []
      });

      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await policy.execute(operation);
      const totalTime = Date.now() - startTime;

      // Should have waited approximately 100ms
      expect(totalTime).toBeGreaterThanOrEqual(90);
      expect(totalTime).toBeLessThan(150);
    });

    test('should use exponential backoff strategy', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        baseDelay: 50,
        maxDelay: 1000,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        jitterType: JitterType.NONE,
        backoffMultiplier: 2,
        retryableErrors: [],
        nonRetryableErrors: []
      });

      const delays: number[] = [];
      const originalSleep = (policy as any).sleep;
      (policy as any).sleep = jest.fn((ms: number) => {
        delays.push(ms);
        return originalSleep.call(policy, 10); // Speed up test
      });

      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('failure 1'))
        .mockRejectedValueOnce(new Error('failure 2'))
        .mockResolvedValue('success');

      await policy.execute(operation);

      expect(delays).toHaveLength(2);
      expect(delays[0]).toBe(50);  // 50 * 2^0
      expect(delays[1]).toBe(100); // 50 * 2^1
    });

    test('should use linear backoff strategy', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        strategy: RetryStrategy.LINEAR_BACKOFF,
        jitterType: JitterType.NONE,
        backoffMultiplier: 50,
        retryableErrors: [],
        nonRetryableErrors: []
      });

      const delays: number[] = [];
      const originalSleep = (policy as any).sleep;
      (policy as any).sleep = jest.fn((ms: number) => {
        delays.push(ms);
        return originalSleep.call(policy, 10);
      });

      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('failure 1'))
        .mockRejectedValueOnce(new Error('failure 2'))
        .mockResolvedValue('success');

      await policy.execute(operation);

      expect(delays).toHaveLength(2);
      expect(delays[0]).toBe(100); // 100 + (50 * 0)
      expect(delays[1]).toBe(150); // 100 + (50 * 1)
    });
  });

  describe('Jitter Types', () => {
    test('should apply full jitter', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        strategy: RetryStrategy.FIXED_DELAY,
        jitterType: JitterType.FULL,
        backoffMultiplier: 2,
        retryableErrors: [],
        nonRetryableErrors: []
      });

      // Mock Math.random to return 0.5
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.5);

      const delays: number[] = [];
      const originalSleep = (policy as any).sleep;
      (policy as any).sleep = jest.fn((ms: number) => {
        delays.push(ms);
        return originalSleep.call(policy, 10);
      });

      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValue('success');

      await policy.execute(operation);

      expect(delays[0]).toBe(50); // 100 * 0.5 (full jitter)

      Math.random = originalRandom;
    });

    test('should apply equal jitter', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        strategy: RetryStrategy.FIXED_DELAY,
        jitterType: JitterType.EQUAL,
        backoffMultiplier: 2,
        retryableErrors: [],
        nonRetryableErrors: []
      });

      // Mock Math.random to return 0.5
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.5);

      const delays: number[] = [];
      const originalSleep = (policy as any).sleep;
      (policy as any).sleep = jest.fn((ms: number) => {
        delays.push(ms);
        return originalSleep.call(policy, 10);
      });

      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValue('success');

      await policy.execute(operation);

      expect(delays[0]).toBe(75); // 100 * 0.5 + (0.5 * 100 * 0.5) = 50 + 25

      Math.random = originalRandom;
    });
  });

  describe('Error Classification', () => {
    test('should retry retryable errors', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        baseDelay: 10,
        maxDelay: 1000,
        strategy: RetryStrategy.FIXED_DELAY,
        jitterType: JitterType.NONE,
        backoffMultiplier: 2,
        retryableErrors: ['NETWORK_ERROR'],
        nonRetryableErrors: []
      });

      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('NETWORK_ERROR: Connection failed'))
        .mockResolvedValue('success');

      const result = await policy.execute(operation);

      expect(result.result).toBe('success');
      expect(result.attempts).toBe(2);
    });

    test('should not retry non-retryable errors', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        baseDelay: 10,
        maxDelay: 1000,
        strategy: RetryStrategy.FIXED_DELAY,
        jitterType: JitterType.NONE,
        backoffMultiplier: 2,
        retryableErrors: [],
        nonRetryableErrors: ['INVALID_INPUT']
      });

      const operation = jest.fn().mockRejectedValue(new Error('INVALID_INPUT: Bad request'));

      await expect(policy.execute(operation)).rejects.toThrow(NonRetryableError);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should use custom retry logic', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        baseDelay: 10,
        maxDelay: 1000,
        strategy: RetryStrategy.FIXED_DELAY,
        jitterType: JitterType.NONE,
        backoffMultiplier: 2,
        retryableErrors: [],
        nonRetryableErrors: [],
        shouldRetry: (error: Error, attempt: number) => {
          return error.message.includes('RETRY') && attempt < 2;
        }
      });

      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('RETRY: First failure'))
        .mockRejectedValue(new Error('DONT_RETRY: Second failure'));

      await expect(policy.execute(operation)).rejects.toThrow(NonRetryableError);
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Timeout Handling', () => {
    test('should timeout when overall timeout is exceeded', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 5,
        baseDelay: 100,
        maxDelay: 1000,
        strategy: RetryStrategy.FIXED_DELAY,
        jitterType: JitterType.NONE,
        backoffMultiplier: 2,
        retryableErrors: [],
        nonRetryableErrors: [],
        timeoutMs: 200
      });

      const operation = jest.fn().mockRejectedValue(new Error('failure'));

      await expect(policy.execute(operation)).rejects.toThrow(RetryTimeoutError);
      // Should not complete all 5 attempts due to timeout
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Statistics', () => {
    test('should track retry statistics', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        baseDelay: 10,
        maxDelay: 1000,
        strategy: RetryStrategy.FIXED_DELAY,
        jitterType: JitterType.NONE,
        backoffMultiplier: 2,
        retryableErrors: [],
        nonRetryableErrors: []
      });

      // Successful retry
      const operation1 = jest.fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValue('success');
      await policy.execute(operation1);

      // Failed retry
      const operation2 = jest.fn().mockRejectedValue(new Error('failure'));
      try {
        await policy.execute(operation2);
      } catch (error) {
        // Expected
      }

      const stats = policy.getStats();
      expect(stats.totalAttempts).toBe(5); // 2 + 3
      expect(stats.successfulRetries).toBe(1);
      expect(stats.failedRetries).toBe(1);
    });
  });

  describe('RetryPolicyBuilder', () => {
    test('should build retry policy with builder pattern', () => {
      const policy = new RetryPolicyBuilder()
        .maxAttempts(5)
        .baseDelay(200)
        .maxDelay(5000)
        .strategy(RetryStrategy.EXPONENTIAL_BACKOFF)
        .jitter(JitterType.FULL)
        .backoffMultiplier(1.5)
        .retryOn([/timeout/i, /network/i])
        .dontRetryOn([/400/i, /401/i])
        .timeout(30000)
        .build();

      expect(policy).toBeInstanceOf(RetryPolicy);
    });

    test('should execute operation with builder-created policy', async () => {
      const policy = new RetryPolicyBuilder()
        .maxAttempts(2)
        .baseDelay(10)
        .strategy(RetryStrategy.FIXED_DELAY)
        .build();

      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValue('success');

      const result = await policy.execute(operation);

      expect(result.result).toBe('success');
      expect(result.attempts).toBe(2);
    });
  });

  describe('Events', () => {
    test('should emit retry success events', (done) => {
      const policy = new RetryPolicy({
        maxAttempts: 2,
        baseDelay: 10,
        maxDelay: 1000,
        strategy: RetryStrategy.FIXED_DELAY,
        jitterType: JitterType.NONE,
        backoffMultiplier: 2,
        retryableErrors: [],
        nonRetryableErrors: []
      });

      policy.on('retrySuccess', (event) => {
        expect(event.attempts).toBe(2);
        expect(event.errors).toBe(1);
        done();
      });

      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValue('success');

      policy.execute(operation);
    });

    test('should emit retry failure events', (done) => {
      const policy = new RetryPolicy({
        maxAttempts: 2,
        baseDelay: 10,
        maxDelay: 1000,
        strategy: RetryStrategy.FIXED_DELAY,
        jitterType: JitterType.NONE,
        backoffMultiplier: 2,
        retryableErrors: [],
        nonRetryableErrors: []
      });

      policy.on('retryFailure', (event) => {
        expect(event.attempts).toBe(2);
        expect(event.errors).toBe(2);
        done();
      });

      const operation = jest.fn().mockRejectedValue(new Error('failure'));

      policy.execute(operation).catch(() => {});
    });
  });
});