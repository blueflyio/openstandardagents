/**
 * OSSA Timeout Management System
 * Advanced timeout handling with adaptive timeouts, cancellation, and resource cleanup
 */

import { EventEmitter } from 'events';

export enum TimeoutType {
  FIXED = 'fixed',                    // Fixed timeout value
  ADAPTIVE = 'adaptive',              // Adjusts based on performance
  PROGRESSIVE = 'progressive',        // Increases over time
  PERCENTILE_BASED = 'percentile-based', // Based on response time percentiles
  CIRCUIT_BREAKER = 'circuit-breaker'  // Integrates with circuit breaker
}

export enum TimeoutAction {
  ABORT = 'abort',                    // Cancel the operation
  EXTEND = 'extend',                  // Extend the timeout
  FALLBACK = 'fallback',             // Execute fallback
  RETRY = 'retry',                   // Retry with new timeout
  ESCALATE = 'escalate'              // Escalate to higher priority
}

export interface TimeoutConfig {
  type: TimeoutType;
  baseTimeout: number;                // Base timeout in milliseconds
  minTimeout: number;                 // Minimum allowed timeout
  maxTimeout: number;                 // Maximum allowed timeout
  adaptiveFactor: number;             // Factor for adaptive adjustments (0-1)
  percentile: number;                 // Percentile for percentile-based (50-99)
  extensionCount: number;             // Max number of extensions allowed
  extensionMultiplier: number;        // Multiplier for each extension
  action: TimeoutAction;              // Action to take on timeout
  enableCancellation: boolean;        // Whether to support cancellation
  cleanupTimeout: number;             // Time to wait for cleanup
  trackPerformance: boolean;          // Whether to track performance metrics
}

export interface OperationContext {
  operationId: string;
  operationName: string;
  startTime: number;
  expectedDuration?: number;          // Expected operation duration
  priority: 'low' | 'medium' | 'high' | 'critical';
  cancellationToken?: CancellationToken;
  cleanupFunction?: () => Promise<void>;
  metadata?: Record<string, any>;
}

export interface TimeoutResult<T> {
  success: boolean;
  result?: T;
  error?: TimeoutError;
  actualTimeout: number;              // Actual timeout used
  duration: number;                   // Actual operation duration
  extensions: number;                 // Number of timeout extensions
  action: TimeoutAction;              // Action taken on timeout
  cancelled: boolean;                 // Whether operation was cancelled
  cleanedUp: boolean;                 // Whether cleanup was successful
}

export interface PerformanceMetrics {
  operationName: string;
  averageResponseTime: number;
  p50ResponseTime: number;
  p90ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  successRate: number;
  timeoutRate: number;
  totalOperations: number;
  recentResponseTimes: number[];      // Last 100 response times
  lastUpdated: Date;
}

export class CancellationToken {
  private _cancelled = false;
  private _reason?: string;
  private callbacks: (() => void)[] = [];

  get cancelled(): boolean {
    return this._cancelled;
  }

  get reason(): string | undefined {
    return this._reason;
  }

  cancel(reason?: string): void {
    if (this._cancelled) return;
    
    this._cancelled = true;
    this._reason = reason;
    
    // Execute all cancellation callbacks
    for (const callback of this.callbacks) {
      try {
        callback();
      } catch (error) {
        // Ignore callback errors during cancellation
      }
    }
    
    this.callbacks.length = 0;
  }

  onCancellation(callback: () => void): void {
    if (this._cancelled) {
      callback();
    } else {
      this.callbacks.push(callback);
    }
  }

  throwIfCancelled(): void {
    if (this._cancelled) {
      throw new OperationCancelledError(this._reason || 'Operation was cancelled');
    }
  }
}

export class TimeoutManager extends EventEmitter {
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private activeOperations: Map<string, ActiveOperation> = new Map();
  private globalConfig: TimeoutConfig;

  constructor(defaultConfig: TimeoutConfig) {
    super();
    this.globalConfig = defaultConfig;
    this.startMetricsCollection();
  }

  /**
   * Execute operation with timeout management
   */
  async executeWithTimeout<T>(
    operation: (token?: CancellationToken) => Promise<T>,
    context: OperationContext,
    config?: Partial<TimeoutConfig>
  ): Promise<TimeoutResult<T>> {
    const effectiveConfig = { ...this.globalConfig, ...config };
    const timeout = this.calculateTimeout(context.operationName, effectiveConfig);
    
    const activeOp: ActiveOperation = {
      context,
      config: effectiveConfig,
      startTime: Date.now(),
      timeout,
      extensions: 0,
      abortController: new AbortController(),
      cleanupPromise: null
    };

    this.activeOperations.set(context.operationId, activeOp);
    
    this.emit('operationStarted', {
      operationId: context.operationId,
      operationName: context.operationName,
      timeout,
      config: effectiveConfig
    });

    try {
      const result = await this.executeWithTimeoutInternal(operation, activeOp);
      this.recordSuccess(context.operationName, Date.now() - activeOp.startTime);
      return result;
    } catch (error) {
      this.recordFailure(context.operationName, Date.now() - activeOp.startTime, error);
      throw error;
    } finally {
      this.activeOperations.delete(context.operationId);
    }
  }

  /**
   * Cancel operation by ID
   */
  cancelOperation(operationId: string, reason?: string): boolean {
    const activeOp = this.activeOperations.get(operationId);
    if (!activeOp) return false;

    if (activeOp.context.cancellationToken) {
      activeOp.context.cancellationToken.cancel(reason);
    }
    
    activeOp.abortController.abort();
    
    this.emit('operationCancelled', {
      operationId,
      reason,
      duration: Date.now() - activeOp.startTime
    });
    
    return true;
  }

  /**
   * Extend timeout for an active operation
   */
  extendTimeout(operationId: string, additionalTime?: number): boolean {
    const activeOp = this.activeOperations.get(operationId);
    if (!activeOp) return false;

    if (activeOp.extensions >= activeOp.config.extensionCount) {
      return false; // Max extensions reached
    }

    const extension = additionalTime || 
                     (activeOp.timeout * activeOp.config.extensionMultiplier);
    
    activeOp.timeout += extension;
    activeOp.extensions++;
    
    this.emit('timeoutExtended', {
      operationId,
      newTimeout: activeOp.timeout,
      extension,
      totalExtensions: activeOp.extensions
    });
    
    return true;
  }

  /**
   * Get performance metrics for an operation
   */
  getPerformanceMetrics(operationName: string): PerformanceMetrics | undefined {
    return this.performanceMetrics.get(operationName);
  }

  /**
   * Get all performance metrics
   */
  getAllPerformanceMetrics(): Record<string, PerformanceMetrics> {
    const metrics: Record<string, PerformanceMetrics> = {};
    for (const [name, metric] of this.performanceMetrics) {
      metrics[name] = { ...metric };
    }
    return metrics;
  }

  /**
   * Update timeout configuration for specific operation
   */
  updateConfig(operationName: string, config: Partial<TimeoutConfig>): void {
    // This would update operation-specific config in a real implementation
    this.emit('configUpdated', { operationName, config });
  }

  /**
   * Get active operations
   */
  getActiveOperations(): Array<{
    operationId: string;
    operationName: string;
    duration: number;
    timeout: number;
    extensions: number;
  }> {
    const now = Date.now();
    return Array.from(this.activeOperations.values()).map(op => ({
      operationId: op.context.operationId,
      operationName: op.context.operationName,
      duration: now - op.startTime,
      timeout: op.timeout,
      extensions: op.extensions
    }));
  }

  /**
   * Internal execution with timeout handling
   */
  private async executeWithTimeoutInternal<T>(
    operation: (token?: CancellationToken) => Promise<T>,
    activeOp: ActiveOperation
  ): Promise<TimeoutResult<T>> {
    const { context, config } = activeOp;
    let result: T | undefined;
    let error: TimeoutError | undefined;
    let cancelled = false;
    let cleanedUp = false;

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(async () => {
        const timeoutError = new TimeoutError(
          `Operation ${context.operationName} timed out after ${activeOp.timeout}ms`,
          activeOp.timeout,
          Date.now() - activeOp.startTime
        );

        // Handle timeout action
        switch (config.action) {
          case TimeoutAction.EXTEND:
            if (this.extendTimeout(context.operationId)) {
              return; // Don't reject, timeout was extended
            }
            break;
          
          case TimeoutAction.ESCALATE:
            this.emit('operationEscalated', {
              operationId: context.operationId,
              reason: 'timeout'
            });
            break;
        }

        reject(timeoutError);
      }, activeOp.timeout);

      // Cancel timeout if operation completes
      activeOp.abortController.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new OperationCancelledError('Operation cancelled'));
      });
    });

    try {
      // Race between operation and timeout
      result = await Promise.race([
        operation(context.cancellationToken),
        timeoutPromise
      ]);

    } catch (err) {
      if (err instanceof OperationCancelledError) {
        cancelled = true;
      } else if (err instanceof TimeoutError) {
        error = err;
        
        // Try fallback if configured
        if (config.action === TimeoutAction.FALLBACK) {
          // Fallback implementation would go here
          this.emit('fallbackAttempted', { operationId: context.operationId });
        }
      } else {
        // Other errors
        throw err;
      }
    } finally {
      // Cleanup
      if (context.cleanupFunction) {
        try {
          activeOp.cleanupPromise = this.executeCleanup(
            context.cleanupFunction,
            config.cleanupTimeout
          );
          await activeOp.cleanupPromise;
          cleanedUp = true;
        } catch (cleanupError) {
          this.emit('cleanupFailed', {
            operationId: context.operationId,
            error: cleanupError
          });
        }
      }
    }

    return {
      success: !error && !cancelled && result !== undefined,
      result,
      error,
      actualTimeout: activeOp.timeout,
      duration: Date.now() - activeOp.startTime,
      extensions: activeOp.extensions,
      action: error ? config.action : TimeoutAction.ABORT,
      cancelled,
      cleanedUp
    };
  }

  /**
   * Execute cleanup with its own timeout
   */
  private async executeCleanup(
    cleanupFunction: () => Promise<void>,
    cleanupTimeout: number
  ): Promise<void> {
    const cleanupPromise = cleanupFunction();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Cleanup timeout after ${cleanupTimeout}ms`));
      }, cleanupTimeout);
    });

    await Promise.race([cleanupPromise, timeoutPromise]);
  }

  /**
   * Calculate timeout based on configuration and metrics
   */
  private calculateTimeout(operationName: string, config: TimeoutConfig): number {
    let timeout = config.baseTimeout;

    switch (config.type) {
      case TimeoutType.FIXED:
        timeout = config.baseTimeout;
        break;

      case TimeoutType.ADAPTIVE:
        timeout = this.calculateAdaptiveTimeout(operationName, config);
        break;

      case TimeoutType.PROGRESSIVE:
        timeout = this.calculateProgressiveTimeout(operationName, config);
        break;

      case TimeoutType.PERCENTILE_BASED:
        timeout = this.calculatePercentileTimeout(operationName, config);
        break;

      case TimeoutType.CIRCUIT_BREAKER:
        timeout = this.calculateCircuitBreakerTimeout(operationName, config);
        break;
    }

    // Apply min/max constraints
    return Math.max(
      config.minTimeout,
      Math.min(config.maxTimeout, timeout)
    );
  }

  /**
   * Calculate adaptive timeout based on recent performance
   */
  private calculateAdaptiveTimeout(operationName: string, config: TimeoutConfig): number {
    const metrics = this.performanceMetrics.get(operationName);
    if (!metrics || metrics.totalOperations < 10) {
      return config.baseTimeout;
    }

    const avgResponseTime = metrics.averageResponseTime;
    const adaptiveFactor = config.adaptiveFactor;
    
    // Adjust based on recent performance
    const adjustment = (avgResponseTime - config.baseTimeout) * adaptiveFactor;
    return config.baseTimeout + adjustment;
  }

  /**
   * Calculate progressive timeout (increases with operation count)
   */
  private calculateProgressiveTimeout(operationName: string, config: TimeoutConfig): number {
    const metrics = this.performanceMetrics.get(operationName);
    const operationCount = metrics?.totalOperations || 0;
    
    // Increase timeout by 10% for every 100 operations
    const progressiveMultiplier = 1 + (Math.floor(operationCount / 100) * 0.1);
    return config.baseTimeout * progressiveMultiplier;
  }

  /**
   * Calculate percentile-based timeout
   */
  private calculatePercentileTimeout(operationName: string, config: TimeoutConfig): number {
    const metrics = this.performanceMetrics.get(operationName);
    if (!metrics) return config.baseTimeout;

    let percentileTime: number;
    switch (config.percentile) {
      case 50: percentileTime = metrics.p50ResponseTime; break;
      case 90: percentileTime = metrics.p90ResponseTime; break;
      case 95: percentileTime = metrics.p95ResponseTime; break;
      case 99: percentileTime = metrics.p99ResponseTime; break;
      default: percentileTime = metrics.averageResponseTime;
    }

    // Add 50% buffer to percentile time
    return percentileTime * 1.5;
  }

  /**
   * Calculate circuit breaker integrated timeout
   */
  private calculateCircuitBreakerTimeout(operationName: string, config: TimeoutConfig): number {
    const metrics = this.performanceMetrics.get(operationName);
    if (!metrics) return config.baseTimeout;

    // Increase timeout if success rate is low
    const successRate = metrics.successRate;
    if (successRate < 0.5) {
      return config.baseTimeout * 2; // Double timeout for failing operations
    } else if (successRate < 0.8) {
      return config.baseTimeout * 1.5; // 50% increase for struggling operations
    }

    return config.baseTimeout;
  }

  /**
   * Record successful operation
   */
  private recordSuccess(operationName: string, duration: number): void {
    this.updatePerformanceMetrics(operationName, duration, true);
  }

  /**
   * Record failed operation
   */
  private recordFailure(operationName: string, duration: number, error: any): void {
    const isTimeout = error instanceof TimeoutError;
    this.updatePerformanceMetrics(operationName, duration, false, isTimeout);
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(
    operationName: string,
    duration: number,
    success: boolean,
    timeout: boolean = false
  ): void {
    let metrics = this.performanceMetrics.get(operationName);
    
    if (!metrics) {
      metrics = {
        operationName,
        averageResponseTime: 0,
        p50ResponseTime: 0,
        p90ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        successRate: 0,
        timeoutRate: 0,
        totalOperations: 0,
        recentResponseTimes: [],
        lastUpdated: new Date()
      };
      this.performanceMetrics.set(operationName, metrics);
    }

    // Update metrics
    metrics.totalOperations++;
    metrics.recentResponseTimes.push(duration);
    
    // Keep only last 100 response times
    if (metrics.recentResponseTimes.length > 100) {
      metrics.recentResponseTimes.shift();
    }

    // Recalculate metrics
    this.recalculateMetrics(metrics, success, timeout);
    metrics.lastUpdated = new Date();

    this.emit('metricsUpdated', { operationName, metrics });
  }

  /**
   * Recalculate all metrics for an operation
   */
  private recalculateMetrics(
    metrics: PerformanceMetrics,
    success: boolean,
    timeout: boolean
  ): void {
    const times = metrics.recentResponseTimes.slice().sort((a, b) => a - b);
    const count = times.length;

    if (count === 0) return;

    // Calculate percentiles
    metrics.averageResponseTime = times.reduce((sum, time) => sum + time, 0) / count;
    metrics.p50ResponseTime = this.calculatePercentile(times, 0.5);
    metrics.p90ResponseTime = this.calculatePercentile(times, 0.9);
    metrics.p95ResponseTime = this.calculatePercentile(times, 0.95);
    metrics.p99ResponseTime = this.calculatePercentile(times, 0.99);

    // Update rates (simplified calculation)
    const totalOps = metrics.totalOperations;
    metrics.successRate = success ? 
      ((metrics.successRate * (totalOps - 1)) + 1) / totalOps :
      (metrics.successRate * (totalOps - 1)) / totalOps;
    
    metrics.timeoutRate = timeout ?
      ((metrics.timeoutRate * (totalOps - 1)) + 1) / totalOps :
      (metrics.timeoutRate * (totalOps - 1)) / totalOps;
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedTimes: number[], percentile: number): number {
    const index = Math.ceil(sortedTimes.length * percentile) - 1;
    return sortedTimes[Math.max(0, index)];
  }

  /**
   * Start metrics collection timer
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.emit('metricsSnapshot', this.getAllPerformanceMetrics());
    }, 60000); // Every minute
  }
}

/**
 * Active operation tracking interface
 */
interface ActiveOperation {
  context: OperationContext;
  config: TimeoutConfig;
  startTime: number;
  timeout: number;
  extensions: number;
  abortController: AbortController;
  cleanupPromise: Promise<void> | null;
}

/**
 * Timeout-specific errors
 */
export class TimeoutError extends Error {
  constructor(
    message: string,
    public timeoutMs: number,
    public actualDuration: number
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class OperationCancelledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OperationCancelledError';
  }
}

/**
 * Timeout configuration builder
 */
export class TimeoutConfigBuilder {
  private config: Partial<TimeoutConfig> = {
    type: TimeoutType.FIXED,
    baseTimeout: 5000,
    minTimeout: 1000,
    maxTimeout: 30000,
    adaptiveFactor: 0.1,
    percentile: 95,
    extensionCount: 2,
    extensionMultiplier: 1.5,
    action: TimeoutAction.ABORT,
    enableCancellation: true,
    cleanupTimeout: 2000,
    trackPerformance: true
  };

  type(type: TimeoutType): TimeoutConfigBuilder {
    this.config.type = type;
    return this;
  }

  baseTimeout(ms: number): TimeoutConfigBuilder {
    this.config.baseTimeout = ms;
    return this;
  }

  minTimeout(ms: number): TimeoutConfigBuilder {
    this.config.minTimeout = ms;
    return this;
  }

  maxTimeout(ms: number): TimeoutConfigBuilder {
    this.config.maxTimeout = ms;
    return this;
  }

  adaptive(factor: number): TimeoutConfigBuilder {
    this.config.adaptiveFactor = factor;
    return this;
  }

  percentile(percentile: number): TimeoutConfigBuilder {
    this.config.percentile = percentile;
    return this;
  }

  allowExtensions(count: number, multiplier: number = 1.5): TimeoutConfigBuilder {
    this.config.extensionCount = count;
    this.config.extensionMultiplier = multiplier;
    return this;
  }

  onTimeout(action: TimeoutAction): TimeoutConfigBuilder {
    this.config.action = action;
    return this;
  }

  enableCancellation(enable: boolean = true): TimeoutConfigBuilder {
    this.config.enableCancellation = enable;
    return this;
  }

  cleanupTimeout(ms: number): TimeoutConfigBuilder {
    this.config.cleanupTimeout = ms;
    return this;
  }

  trackPerformance(track: boolean = true): TimeoutConfigBuilder {
    this.config.trackPerformance = track;
    return this;
  }

  build(): TimeoutConfig {
    return this.config as TimeoutConfig;
  }
}