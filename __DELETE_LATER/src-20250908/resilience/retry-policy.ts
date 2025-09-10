/**
 * OSSA Retry Policy Implementation
 * Advanced retry mechanisms with exponential backoff, jitter, and intelligent failure analysis
 */

import { EventEmitter } from 'events';

export enum RetryStrategy {
  FIXED_DELAY = 'fixed-delay',
  EXPONENTIAL_BACKOFF = 'exponential-backoff',
  LINEAR_BACKOFF = 'linear-backoff',
  CUSTOM = 'custom'
}

export enum JitterType {
  NONE = 'none',
  FULL = 'full',
  EQUAL = 'equal',
  DECORRELATED = 'decorrelated'
}

export interface RetryPolicyConfig {
  maxAttempts: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay cap
  strategy: RetryStrategy;
  jitterType: JitterType;
  backoffMultiplier: number; // For exponential/linear backoff
  retryableErrors: string[] | RegExp[]; // Error patterns that should trigger retry
  nonRetryableErrors: string[] | RegExp[]; // Error patterns that should NOT trigger retry
  timeoutMs?: number; // Overall timeout for all retry attempts
  onRetry?: (error: Error, attempt: number, delay: number) => void;
  shouldRetry?: (error: Error, attempt: number) => boolean; // Custom retry logic
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  totalDuration: number;
  errors: Error[];
}

export interface RetryStats {
  totalAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  averageAttempts: number;
  averageDuration: number;
  lastRetryTime?: Date;
}

export class RetryPolicy extends EventEmitter {
  private stats: RetryStats = {
    totalAttempts: 0,
    successfulRetries: 0,
    failedRetries: 0,
    averageAttempts: 0,
    averageDuration: 0
  };

  constructor(private config: RetryPolicyConfig) {
    super();
    this.validateConfig();
  }

  /**
   * Execute function with retry policy
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: any
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    const errors: Error[] = [];
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        // Check overall timeout
        if (this.config.timeoutMs && (Date.now() - startTime) > this.config.timeoutMs) {
          throw new RetryTimeoutError(
            `Retry timeout exceeded: ${this.config.timeoutMs}ms`,
            errors,
            attempt - 1
          );
        }

        const result = await fn();
        
        // Record successful execution
        this.recordSuccess(attempt, Date.now() - startTime, errors);
        
        return {
          result,
          attempts: attempt,
          totalDuration: Date.now() - startTime,
          errors
        };

      } catch (error) {
        lastError = error as Error;
        errors.push(lastError);
        
        this.emit('retryAttempt', {
          attempt,
          error: lastError,
          context,
          willRetry: attempt < this.config.maxAttempts
        });

        // Check if this is the last attempt
        if (attempt === this.config.maxAttempts) {
          this.recordFailure(attempt, Date.now() - startTime, errors);
          throw new RetryExhaustedError(
            `All ${this.config.maxAttempts} retry attempts failed`,
            errors,
            attempt
          );
        }

        // Check if error should trigger retry
        if (!this.shouldRetryError(lastError, attempt)) {
          this.recordFailure(attempt, Date.now() - startTime, errors);
          throw new NonRetryableError(
            `Non-retryable error encountered`,
            lastError,
            attempt
          );
        }

        // Calculate delay before next attempt
        const delay = this.calculateDelay(attempt);
        
        // Call retry callback if provided
        if (this.config.onRetry) {
          this.config.onRetry(lastError, attempt, delay);
        }

        this.emit('retryDelay', { attempt, delay, error: lastError });
        
        // Wait before next attempt
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError!;
  }

  /**
   * Get retry statistics
   */
  getStats(): RetryStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageAttempts: 0,
      averageDuration: 0
    };
    this.emit('statsReset');
  }

  /**
   * Calculate delay for next retry attempt
   */
  private calculateDelay(attempt: number): number {
    let delay: number;

    switch (this.config.strategy) {
      case RetryStrategy.FIXED_DELAY:
        delay = this.config.baseDelay;
        break;

      case RetryStrategy.EXPONENTIAL_BACKOFF:
        delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
        break;

      case RetryStrategy.LINEAR_BACKOFF:
        delay = this.config.baseDelay + (this.config.backoffMultiplier * (attempt - 1));
        break;

      case RetryStrategy.CUSTOM:
        // Custom strategy should be handled by overriding this method
        delay = this.config.baseDelay;
        break;

      default:
        delay = this.config.baseDelay;
    }

    // Apply maximum delay cap
    delay = Math.min(delay, this.config.maxDelay);

    // Apply jitter
    delay = this.applyJitter(delay, attempt);

    return Math.max(0, Math.floor(delay));
  }

  /**
   * Apply jitter to delay
   */
  private applyJitter(delay: number, attempt: number): number {
    switch (this.config.jitterType) {
      case JitterType.NONE:
        return delay;

      case JitterType.FULL:
        return Math.random() * delay;

      case JitterType.EQUAL:
        return delay * 0.5 + (Math.random() * delay * 0.5);

      case JitterType.DECORRELATED:
        // Decorrelated jitter uses previous delay as base
        const prevDelay = attempt > 1 ? this.calculateBaseDelay(attempt - 1) : this.config.baseDelay;
        return Math.random() * (delay * 3 - prevDelay) + prevDelay;

      default:
        return delay;
    }
  }

  /**
   * Calculate base delay without jitter for decorrelated jitter
   */
  private calculateBaseDelay(attempt: number): number {
    switch (this.config.strategy) {
      case RetryStrategy.EXPONENTIAL_BACKOFF:
        return this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
      case RetryStrategy.LINEAR_BACKOFF:
        return this.config.baseDelay + (this.config.backoffMultiplier * (attempt - 1));
      default:
        return this.config.baseDelay;
    }
  }

  /**
   * Determine if error should trigger a retry
   */
  private shouldRetryError(error: Error, attempt: number): boolean {
    // Use custom retry logic if provided
    if (this.config.shouldRetry) {
      return this.config.shouldRetry(error, attempt);
    }

    // Check non-retryable errors first
    if (this.config.nonRetryableErrors.length > 0) {
      for (const pattern of this.config.nonRetryableErrors) {
        if (this.matchesPattern(error, pattern)) {
          return false;
        }
      }
    }

    // Check retryable errors
    if (this.config.retryableErrors.length > 0) {
      for (const pattern of this.config.retryableErrors) {
        if (this.matchesPattern(error, pattern)) {
          return true;
        }
      }
      // If retryable patterns are specified but none match, don't retry
      return false;
    }

    // Default behavior: retry on network/timeout errors
    return this.isRetryableByDefault(error);
  }

  /**
   * Check if error matches pattern
   */
  private matchesPattern(error: Error, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return error.message.includes(pattern) || error.name.includes(pattern);
    } else {
      return pattern.test(error.message) || pattern.test(error.name);
    }
  }

  /**
   * Default retryable error detection
   */
  private isRetryableByDefault(error: Error): boolean {
    const retryablePatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /ECONNRESET/i,
      /ENOTFOUND/i,
      /ECONNREFUSED/i,
      /socket hang up/i,
      /503/i, // Service unavailable
      /502/i, // Bad gateway
      /500/i  // Internal server error
    ];

    return retryablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  /**
   * Record successful execution
   */
  private recordSuccess(attempts: number, duration: number, errors: Error[]): void {
    this.stats.totalAttempts += attempts;
    if (attempts > 1) {
      this.stats.successfulRetries++;
    }
    this.updateAverages();
    this.stats.lastRetryTime = new Date();

    this.emit('retrySuccess', {
      attempts,
      duration,
      errors: errors.length,
      stats: this.getStats()
    });
  }

  /**
   * Record failed execution
   */
  private recordFailure(attempts: number, duration: number, errors: Error[]): void {
    this.stats.totalAttempts += attempts;
    this.stats.failedRetries++;
    this.updateAverages();
    this.stats.lastRetryTime = new Date();

    this.emit('retryFailure', {
      attempts,
      duration,
      errors: errors.length,
      stats: this.getStats()
    });
  }

  /**
   * Update average statistics
   */
  private updateAverages(): void {
    const totalOperations = this.stats.successfulRetries + this.stats.failedRetries;
    if (totalOperations > 0) {
      this.stats.averageAttempts = this.stats.totalAttempts / totalOperations;
    }
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (this.config.maxAttempts < 1) {
      throw new Error('maxAttempts must be at least 1');
    }
    if (this.config.baseDelay < 0) {
      throw new Error('baseDelay must be non-negative');
    }
    if (this.config.maxDelay < this.config.baseDelay) {
      throw new Error('maxDelay must be greater than or equal to baseDelay');
    }
    if (this.config.backoffMultiplier <= 0) {
      throw new Error('backoffMultiplier must be positive');
    }
  }
}

/**
 * Retry-specific error classes
 */
export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public errors: Error[]
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

export class RetryExhaustedError extends RetryError {
  constructor(message: string, errors: Error[], attempts: number) {
    super(message, attempts, errors);
    this.name = 'RetryExhaustedError';
  }
}

export class RetryTimeoutError extends RetryError {
  constructor(message: string, errors: Error[], attempts: number) {
    super(message, attempts, errors);
    this.name = 'RetryTimeoutError';
  }
}

export class NonRetryableError extends RetryError {
  constructor(
    message: string,
    public originalError: Error,
    attempts: number
  ) {
    super(message, attempts, [originalError]);
    this.name = 'NonRetryableError';
  }
}

/**
 * Retry Policy Builder for easier configuration
 */
export class RetryPolicyBuilder {
  private config: Partial<RetryPolicyConfig> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
    jitterType: JitterType.FULL,
    backoffMultiplier: 2,
    retryableErrors: [],
    nonRetryableErrors: []
  };

  maxAttempts(attempts: number): RetryPolicyBuilder {
    this.config.maxAttempts = attempts;
    return this;
  }

  baseDelay(delay: number): RetryPolicyBuilder {
    this.config.baseDelay = delay;
    return this;
  }

  maxDelay(delay: number): RetryPolicyBuilder {
    this.config.maxDelay = delay;
    return this;
  }

  strategy(strategy: RetryStrategy): RetryPolicyBuilder {
    this.config.strategy = strategy;
    return this;
  }

  jitter(type: JitterType): RetryPolicyBuilder {
    this.config.jitterType = type;
    return this;
  }

  backoffMultiplier(multiplier: number): RetryPolicyBuilder {
    this.config.backoffMultiplier = multiplier;
    return this;
  }

  retryOn(errors: (string | RegExp)[]): RetryPolicyBuilder {
    this.config.retryableErrors = errors;
    return this;
  }

  dontRetryOn(errors: (string | RegExp)[]): RetryPolicyBuilder {
    this.config.nonRetryableErrors = errors;
    return this;
  }

  timeout(timeoutMs: number): RetryPolicyBuilder {
    this.config.timeoutMs = timeoutMs;
    return this;
  }

  onRetry(callback: (error: Error, attempt: number, delay: number) => void): RetryPolicyBuilder {
    this.config.onRetry = callback;
    return this;
  }

  customRetryLogic(shouldRetry: (error: Error, attempt: number) => boolean): RetryPolicyBuilder {
    this.config.shouldRetry = shouldRetry;
    return this;
  }

  build(): RetryPolicy {
    return new RetryPolicy(this.config as RetryPolicyConfig);
  }
}

/**
 * Pre-configured retry policies for common use cases
 */
export const RetryPolicies = {
  /**
   * Quick retry for fast operations
   */
  quick: () => new RetryPolicyBuilder()
    .maxAttempts(3)
    .baseDelay(100)
    .maxDelay(1000)
    .strategy(RetryStrategy.EXPONENTIAL_BACKOFF)
    .jitter(JitterType.FULL)
    .build(),

  /**
   * Standard retry for most operations
   */
  standard: () => new RetryPolicyBuilder()
    .maxAttempts(5)
    .baseDelay(1000)
    .maxDelay(30000)
    .strategy(RetryStrategy.EXPONENTIAL_BACKOFF)
    .jitter(JitterType.FULL)
    .build(),

  /**
   * Aggressive retry for critical operations
   */
  aggressive: () => new RetryPolicyBuilder()
    .maxAttempts(10)
    .baseDelay(500)
    .maxDelay(60000)
    .strategy(RetryStrategy.EXPONENTIAL_BACKOFF)
    .jitter(JitterType.EQUAL)
    .timeout(300000) // 5 minute total timeout
    .build(),

  /**
   * Network-specific retry policy
   */
  network: () => new RetryPolicyBuilder()
    .maxAttempts(7)
    .baseDelay(1000)
    .maxDelay(30000)
    .strategy(RetryStrategy.EXPONENTIAL_BACKOFF)
    .jitter(JitterType.DECORRELATED)
    .retryOn([
      /timeout/i,
      /network/i,
      /ECONNRESET/i,
      /ENOTFOUND/i,
      /502/i,
      /503/i,
      /504/i
    ])
    .dontRetryOn([
      /400/i, // Bad request
      /401/i, // Unauthorized
      /403/i, // Forbidden
      /404/i  // Not found
    ])
    .build()
};