/**
 * OSSA Resilience Manager
 * Integrated resilience patterns orchestration and management
 */

import { EventEmitter } from 'events';
import { CircuitBreaker, CircuitBreakerConfig, CircuitBreakerManager } from './circuit-breaker';
import { RetryPolicy, RetryPolicyConfig, RetryPolicies } from './retry-policy';
import { CascadePreventionSystem, DependencyConfig, SystemHealth } from './cascade-prevention';
import { PartialSuccessHandler, PartialSuccessConfig, PartialOperation } from './partial-success';
import { TimeoutManager, TimeoutConfig, CancellationToken } from './timeout-management';
import { ErrorClassifier, ErrorContext, ClassificationResult } from './error-classification';

export interface ResilienceConfig {
  circuitBreaker: CircuitBreakerConfig;
  retryPolicy: RetryPolicyConfig;
  timeout: TimeoutConfig;
  partialSuccess: PartialSuccessConfig;
  cascadePrevention: {
    maxConcurrentFailures: number;
    failureEscalationThreshold: number;
    systemHealthThreshold: number;
    isolationTimeout: number;
    fallbackTimeout: number;
    enablePreemptiveIsolation: boolean;
    enableAdaptiveTimeout: boolean;
    enableLoadShedding: boolean;
  };
  errorHandling: {
    enableClassification: boolean;
    enableAutoRecovery: boolean;
    escalationThreshold: number;
  };
}

export interface OperationOptions {
  operationId?: string;
  operationName: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
  retries?: number;
  enableCircuitBreaker?: boolean;
  enablePartialSuccess?: boolean;
  fallbackFunction?: () => Promise<any>;
  cleanupFunction?: () => Promise<void>;
  metadata?: Record<string, any>;
}

export interface ResilienceResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  executionTime: number;
  retriesUsed: number;
  circuitBreakerState: string;
  partialSuccessRate?: number;
  fallbackUsed: boolean;
  timeoutExtended: boolean;
  errorClassification?: ClassificationResult;
  metadata: {
    operationId: string;
    strategy: string;
    circuitBreakerHits: number;
    timeoutAdjustments: number;
    recoveryActions: string[];
  };
}

export interface SystemMetrics {
  systemHealth: SystemHealth;
  circuitBreakerStats: Record<string, any>;
  retryStats: Record<string, any>;
  timeoutStats: Record<string, any>;
  errorStats: Record<string, any>;
  overallResilience: {
    score: number;           // 0-100 resilience score
    trend: 'improving' | 'stable' | 'degrading';
    recommendations: string[];
  };
}

export class ResilienceManager extends EventEmitter {
  private circuitBreakerManager: CircuitBreakerManager;
  private cascadePreventionSystem: CascadePreventionSystem;
  private timeoutManager: TimeoutManager;
  private errorClassifier: ErrorClassifier;
  private operationRegistry: Map<string, ResilienceOperation> = new Map();
  private globalMetrics: SystemMetrics;
  private metricsTimer?: NodeJS.Timeout;

  constructor(private config: ResilienceConfig) {
    super();
    
    this.circuitBreakerManager = new CircuitBreakerManager();
    this.cascadePreventionSystem = new CascadePreventionSystem(config.cascadePrevention);
    this.timeoutManager = new TimeoutManager(config.timeout);
    this.errorClassifier = new ErrorClassifier();
    
    this.globalMetrics = this.initializeMetrics();
    this.setupEventHandlers();
    this.startMetricsCollection();
  }

  /**
   * Execute operation with full resilience patterns
   */
  async execute<T>(
    operation: (token?: CancellationToken) => Promise<T>,
    options: OperationOptions
  ): Promise<ResilienceResult<T>> {
    const operationId = options.operationId || this.generateOperationId();
    const startTime = Date.now();
    
    // Create resilience operation context
    const resilienceOp = new ResilienceOperation(operationId, options, this.config);
    this.operationRegistry.set(operationId, resilienceOp);
    
    this.emit('operationStarted', { operationId, operationName: options.operationName });
    
    try {
      const result = await this.executeWithResilience(operation, resilienceOp);
      
      this.emit('operationCompleted', {
        operationId,
        success: result.success,
        duration: result.executionTime
      });
      
      return result;
      
    } finally {
      this.operationRegistry.delete(operationId);
      this.updateGlobalMetrics();
    }
  }

  /**
   * Register dependency for cascade prevention
   */
  registerDependency(
    dependencyConfig: DependencyConfig,
    fallbackFunction?: () => Promise<any>
  ): void {
    this.cascadePreventionSystem.registerDependency(dependencyConfig, fallbackFunction);
    this.emit('dependencyRegistered', { name: dependencyConfig.name });
  }

  /**
   * Execute batch operations with partial success handling
   */
  async executeBatch<T>(
    operations: Array<{
      id: string;
      name: string;
      operation: () => Promise<T>;
      weight?: number;
      required?: boolean;
      dependencies?: string[];
    }>,
    batchOptions: {
      strategy?: string;
      successThreshold?: number;
      maxConcurrency?: number;
      overallTimeout?: number;
    } = {}
  ): Promise<{
    overall: string;
    results: Array<{ id: string; success: boolean; result?: T; error?: Error }>;
    successRate: number;
    totalDuration: number;
  }> {
    const partialSuccessConfig: PartialSuccessConfig = {
      strategy: batchOptions.strategy as any || 'best-effort',
      successThreshold: batchOptions.successThreshold || 0.7,
      weightedThreshold: 0.7,
      maxConcurrency: batchOptions.maxConcurrency || 10,
      overallTimeout: batchOptions.overallTimeout || 30000,
      continueOnFailure: true,
      enableEarlyTermination: false,
      enableProgressiveTimeout: false,
      fallbackTimeout: 5000
    };

    const handler = new PartialSuccessHandler<T>(partialSuccessConfig);
    
    // Add operations
    for (const op of operations) {
      handler.addOperation({
        id: op.id,
        name: op.name,
        operation: op.operation,
        weight: op.weight || 1,
        required: op.required || false,
        timeout: 5000,
        dependencies: op.dependencies || [],
        maxRetries: 2,
        retryDelay: 1000
      });
    }

    const result = await handler.execute();
    
    return {
      overall: result.overall,
      results: result.operations.map(op => ({
        id: op.id,
        success: op.status === 'success',
        result: op.result,
        error: op.error
      })),
      successRate: result.successRate,
      totalDuration: result.totalDuration
    };
  }

  /**
   * Get comprehensive system metrics
   */
  getSystemMetrics(): SystemMetrics {
    return { ...this.globalMetrics };
  }

  /**
   * Get active operations
   */
  getActiveOperations(): Array<{
    operationId: string;
    operationName: string;
    duration: number;
    status: string;
  }> {
    const now = Date.now();
    return Array.from(this.operationRegistry.values()).map(op => ({
      operationId: op.operationId,
      operationName: op.options.operationName,
      duration: now - op.startTime,
      status: op.status
    }));
  }

  /**
   * Cancel operation by ID
   */
  cancelOperation(operationId: string, reason?: string): boolean {
    const operation = this.operationRegistry.get(operationId);
    if (!operation) return false;

    operation.cancel(reason);
    this.timeoutManager.cancelOperation(operationId, reason);
    
    this.emit('operationCancelled', { operationId, reason });
    return true;
  }

  /**
   * Force circuit breaker state
   */
  forceCircuitBreakerState(dependencyName: string, state: 'open' | 'closed' | 'half-open'): void {
    const circuit = this.circuitBreakerManager.getCircuitBreaker(
      dependencyName,
      this.config.circuitBreaker
    );
    circuit.forceState(state as any);
  }

  /**
   * Update resilience configuration
   */
  updateConfig(newConfig: Partial<ResilienceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', { config: this.config });
  }

  /**
   * Shutdown resilience manager
   */
  async shutdown(): Promise<void> {
    // Cancel all active operations
    for (const operationId of this.operationRegistry.keys()) {
      this.cancelOperation(operationId, 'System shutdown');
    }

    // Stop metrics collection
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }

    // Stop cascade prevention system
    this.cascadePreventionSystem.stop();

    this.emit('shutdown');
  }

  /**
   * Execute operation with full resilience patterns
   */
  private async executeWithResilience<T>(
    operation: (token?: CancellationToken) => Promise<T>,
    resilienceOp: ResilienceOperation
  ): Promise<ResilienceResult<T>> {
    const { operationId, options } = resilienceOp;
    const startTime = Date.now();
    let result: T | undefined;
    let error: Error | undefined;
    let retriesUsed = 0;
    let fallbackUsed = false;
    let timeoutExtended = false;
    let circuitBreakerHits = 0;
    let timeoutAdjustments = 0;
    let recoveryActions: string[] = [];

    try {
      // Setup cancellation token
      const cancellationToken = new CancellationToken();
      resilienceOp.setCancellationToken(cancellationToken);

      // Create error context
      const errorContext: ErrorContext = {
        operationName: options.operationName,
        operationId,
        timestamp: new Date(),
        attempt: 1,
        totalAttempts: 1,
        duration: 0,
        metadata: options.metadata
      };

      // Setup circuit breaker if enabled
      let circuitBreaker: CircuitBreaker | undefined;
      if (options.enableCircuitBreaker !== false) {
        circuitBreaker = this.circuitBreakerManager.getCircuitBreaker(
          options.operationName,
          this.config.circuitBreaker
        );
      }

      // Setup retry policy
      const retryPolicy = new RetryPolicy(this.config.retryPolicy);

      // Execute with timeout management
      const timeoutResult = await this.timeoutManager.executeWithTimeout(
        async (token) => {
          // Execute with retry policy
          const retryResult = await retryPolicy.execute(async () => {
            errorContext.attempt = retryResult?.attempts || 1;
            
            // Execute with circuit breaker if available
            if (circuitBreaker) {
              try {
                return await circuitBreaker.execute(async () => {
                  token?.throwIfCancelled();
                  return await operation(token);
                });
              } catch (cbError) {
                circuitBreakerHits++;
                throw cbError;
              }
            } else {
              token?.throwIfCancelled();
              return await operation(token);
            }
          });

          retriesUsed = retryResult.attempts - 1;
          return retryResult.result;
        },
        {
          operationId,
          operationName: options.operationName,
          priority: options.priority,
          cancellationToken,
          cleanupFunction: options.cleanupFunction,
          metadata: options.metadata
        },
        { baseTimeout: options.timeout || this.config.timeout.baseTimeout }
      );

      result = timeoutResult.result;
      timeoutExtended = timeoutResult.extensions > 0;
      timeoutAdjustments = timeoutResult.extensions;

      if (!timeoutResult.success && timeoutResult.error) {
        error = timeoutResult.error;
      }

    } catch (executionError) {
      error = executionError as Error;

      // Try fallback if available and not cancelled
      if (options.fallbackFunction && !resilienceOp.isCancelled()) {
        try {
          result = await options.fallbackFunction();
          fallbackUsed = true;
          recoveryActions.push('fallback-executed');
          error = undefined; // Clear error since fallback succeeded
        } catch (fallbackError) {
          recoveryActions.push('fallback-failed');
          // Keep original error
        }
      }
    }

    // Handle error classification if enabled
    let errorClassification: ClassificationResult | undefined;
    if (error && this.config.errorHandling.enableClassification) {
      const errorContext: ErrorContext = {
        operationName: options.operationName,
        operationId,
        timestamp: new Date(),
        attempt: retriesUsed + 1,
        totalAttempts: retriesUsed + 1,
        duration: Date.now() - startTime,
        metadata: options.metadata
      };

      errorClassification = this.errorClassifier.classify(error, errorContext);

      // Auto-recovery if enabled
      if (this.config.errorHandling.enableAutoRecovery && 
          errorClassification.retryable && 
          !fallbackUsed) {
        try {
          // Attempt one more recovery based on classification
          if (errorClassification.strategy === 'retry') {
            // Could implement additional retry logic here
            recoveryActions.push('auto-recovery-attempted');
          }
        } catch (recoveryError) {
          recoveryActions.push('auto-recovery-failed');
        }
      }
    }

    const executionTime = Date.now() - startTime;
    const success = !error && result !== undefined;

    // Update operation status
    resilienceOp.complete(success, executionTime);

    return {
      success,
      result,
      error,
      executionTime,
      retriesUsed,
      circuitBreakerState: circuitBreaker?.getStats().state || 'n/a',
      fallbackUsed,
      timeoutExtended,
      errorClassification,
      metadata: {
        operationId,
        strategy: 'integrated-resilience',
        circuitBreakerHits,
        timeoutAdjustments,
        recoveryActions
      }
    };
  }

  /**
   * Setup event handlers for components
   */
  private setupEventHandlers(): void {
    // Circuit breaker events
    this.circuitBreakerManager.on('globalStateChanged', (event) => {
      this.emit('circuitBreakerStateChanged', event);
    });

    // Cascade prevention events
    this.cascadePreventionSystem.on('systemHealthChanged', (event) => {
      this.emit('systemHealthChanged', event);
    });

    this.cascadePreventionSystem.on('emergencyProtocolsActivated', (event) => {
      this.emit('emergencyProtocolsActivated', event);
    });

    // Timeout manager events
    this.timeoutManager.on('operationEscalated', (event) => {
      this.emit('operationEscalated', event);
    });

    // Error classifier events
    this.errorClassifier.on('errorClassified', (event) => {
      this.emit('errorClassified', event);
    });

    this.errorClassifier.on('errorEscalated', (event) => {
      this.emit('errorEscalated', event);
    });
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.updateGlobalMetrics();
      this.emit('metricsUpdated', this.globalMetrics);
    }, 10000); // Every 10 seconds
  }

  /**
   * Update global metrics
   */
  private updateGlobalMetrics(): void {
    // Gather metrics from all components
    this.globalMetrics.systemHealth = this.cascadePreventionSystem.getSystemHealth();
    this.globalMetrics.circuitBreakerStats = this.circuitBreakerManager.getGlobalStats();
    this.globalMetrics.timeoutStats = this.timeoutManager.getAllPerformanceMetrics();
    this.globalMetrics.errorStats = this.errorClassifier.getStatistics();

    // Calculate overall resilience score
    this.globalMetrics.overallResilience = this.calculateResilienceScore();
  }

  /**
   * Calculate overall resilience score
   */
  private calculateResilienceScore(): {
    score: number;
    trend: 'improving' | 'stable' | 'degrading';
    recommendations: string[];
  } {
    let score = 100;
    const recommendations: string[] = [];

    // System health impact (40% weight)
    const healthScore = this.globalMetrics.systemHealth.overallHealth;
    score = score * (healthScore / 100) * 0.4 + score * 0.6;

    // Circuit breaker impact (20% weight)
    const openCircuits = this.globalMetrics.systemHealth.isolatedDependencies.length;
    const totalCircuits = this.globalMetrics.systemHealth.totalDependencies;
    if (totalCircuits > 0) {
      const circuitHealth = 1 - (openCircuits / totalCircuits);
      score = score * circuitHealth * 0.2 + score * 0.8;
    }

    // Error rate impact (25% weight)
    const errorStats = this.globalMetrics.errorStats;
    if (errorStats.totalErrors > 0) {
      const errorImpact = Math.min(errorStats.totalErrors / 1000, 1); // Cap at 1000 errors
      score = score * (1 - errorImpact * 0.25);
    }

    // Add recommendations based on score
    if (score < 50) {
      recommendations.push('Critical resilience issues detected - immediate action required');
    } else if (score < 70) {
      recommendations.push('Resilience degraded - review error patterns and circuit breaker states');
    } else if (score < 85) {
      recommendations.push('Good resilience - monitor for potential improvements');
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      trend: this.globalMetrics.systemHealth.trendDirection,
      recommendations
    };
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): SystemMetrics {
    return {
      systemHealth: {
        overallHealth: 100,
        criticalServicesUp: 0,
        totalDependencies: 0,
        failedDependencies: [],
        isolatedDependencies: [],
        lastHealthCheck: new Date(),
        trendDirection: 'stable'
      },
      circuitBreakerStats: {},
      retryStats: {},
      timeoutStats: {},
      errorStats: {
        totalErrors: 0,
        errorsByCategory: {} as any,
        errorsBySeverity: {} as any,
        errorsByStrategy: {} as any,
        averageResolutionTime: 0,
        mostCommonErrors: [],
        escalationRate: 0,
        retrySuccessRate: 0,
        lastUpdated: new Date()
      },
      overallResilience: {
        score: 100,
        trend: 'stable',
        recommendations: []
      }
    };
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Individual resilience operation tracking
 */
class ResilienceOperation {
  public startTime: number = Date.now();
  public status: string = 'running';
  private cancellationToken?: CancellationToken;

  constructor(
    public operationId: string,
    public options: OperationOptions,
    public config: ResilienceConfig
  ) {}

  setCancellationToken(token: CancellationToken): void {
    this.cancellationToken = token;
  }

  cancel(reason?: string): void {
    this.status = 'cancelled';
    if (this.cancellationToken) {
      this.cancellationToken.cancel(reason);
    }
  }

  complete(success: boolean, duration: number): void {
    this.status = success ? 'completed' : 'failed';
  }

  isCancelled(): boolean {
    return this.cancellationToken?.cancelled || false;
  }
}

/**
 * Resilience builder for easier configuration
 */
export class ResilienceBuilder {
  private config: Partial<ResilienceConfig> = {};

  circuitBreaker(config: Partial<CircuitBreakerConfig>): ResilienceBuilder {
    this.config.circuitBreaker = {
      failureThreshold: 5,
      recoveryTimeout: 60000,
      successThreshold: 3,
      timeout: 30000,
      monitoringWindow: 300000,
      exponentialBackoff: true,
      maxBackoffTime: 300000,
      bulkheadIsolation: false,
      ...config
    };
    return this;
  }

  retryPolicy(config: Partial<RetryPolicyConfig>): ResilienceBuilder {
    this.config.retryPolicy = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      strategy: 'exponential-backoff' as any,
      jitterType: 'full' as any,
      backoffMultiplier: 2,
      retryableErrors: [],
      nonRetryableErrors: [],
      ...config
    };
    return this;
  }

  timeout(config: Partial<TimeoutConfig>): ResilienceBuilder {
    this.config.timeout = {
      type: 'adaptive' as any,
      baseTimeout: 5000,
      minTimeout: 1000,
      maxTimeout: 30000,
      adaptiveFactor: 0.1,
      percentile: 95,
      extensionCount: 2,
      extensionMultiplier: 1.5,
      action: 'abort' as any,
      enableCancellation: true,
      cleanupTimeout: 2000,
      trackPerformance: true,
      ...config
    };
    return this;
  }

  cascadePrevention(config: any): ResilienceBuilder {
    this.config.cascadePrevention = {
      maxConcurrentFailures: 3,
      failureEscalationThreshold: 50,
      systemHealthThreshold: 70,
      isolationTimeout: 60000,
      fallbackTimeout: 5000,
      enablePreemptiveIsolation: true,
      enableAdaptiveTimeout: true,
      enableLoadShedding: true,
      ...config
    };
    return this;
  }

  errorHandling(config: any): ResilienceBuilder {
    this.config.errorHandling = {
      enableClassification: true,
      enableAutoRecovery: true,
      escalationThreshold: 5,
      ...config
    };
    return this;
  }

  build(): ResilienceManager {
    // Set defaults for missing config
    const defaultConfig: ResilienceConfig = {
      circuitBreaker: this.config.circuitBreaker || {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        successThreshold: 3,
        timeout: 30000,
        monitoringWindow: 300000,
        exponentialBackoff: true,
        maxBackoffTime: 300000,
        bulkheadIsolation: false
      },
      retryPolicy: this.config.retryPolicy || {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        strategy: 'exponential-backoff' as any,
        jitterType: 'full' as any,
        backoffMultiplier: 2,
        retryableErrors: [],
        nonRetryableErrors: []
      },
      timeout: this.config.timeout || {
        type: 'adaptive' as any,
        baseTimeout: 5000,
        minTimeout: 1000,
        maxTimeout: 30000,
        adaptiveFactor: 0.1,
        percentile: 95,
        extensionCount: 2,
        extensionMultiplier: 1.5,
        action: 'abort' as any,
        enableCancellation: true,
        cleanupTimeout: 2000,
        trackPerformance: true
      },
      partialSuccess: this.config.partialSuccess || {
        strategy: 'best-effort' as any,
        successThreshold: 0.5,
        weightedThreshold: 0.5,
        maxConcurrency: 10,
        overallTimeout: 30000,
        continueOnFailure: true,
        enableEarlyTermination: false,
        enableProgressiveTimeout: false,
        fallbackTimeout: 5000
      },
      cascadePrevention: this.config.cascadePrevention || {
        maxConcurrentFailures: 3,
        failureEscalationThreshold: 50,
        systemHealthThreshold: 70,
        isolationTimeout: 60000,
        fallbackTimeout: 5000,
        enablePreemptiveIsolation: true,
        enableAdaptiveTimeout: true,
        enableLoadShedding: true
      },
      errorHandling: this.config.errorHandling || {
        enableClassification: true,
        enableAutoRecovery: true,
        escalationThreshold: 5
      }
    };

    return new ResilienceManager(defaultConfig);
  }
}