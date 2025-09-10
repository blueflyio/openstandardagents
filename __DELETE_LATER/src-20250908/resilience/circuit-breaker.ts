/**
 * OSSA Circuit Breaker Implementation
 * Automatic failing agent isolation with recovery and 360° loop stability
 * Prevents cascading failures in distributed agent systems
 */

import { EventEmitter } from 'events';

export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Circuit is open, failing fast
  HALF_OPEN = 'half-open' // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;        // Number of failures before opening
  recoveryTimeout: number;         // Time before attempting recovery (ms)
  successThreshold: number;        // Successful calls needed to close circuit
  timeout: number;                 // Request timeout (ms)
  monitoringWindow: number;        // Time window for failure tracking (ms)
  exponentialBackoff: boolean;     // Use exponential backoff for recovery
  maxBackoffTime: number;          // Maximum backoff time (ms)
  bulkheadIsolation: boolean;      // Isolate this circuit from others
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  consecutiveFailures: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  totalRequests: number;
  rejectedRequests: number;
  averageResponseTime: number;
  uptime: number; // Percentage
}

export interface FailureInfo {
  timestamp: Date;
  error: Error;
  duration: number;
  context?: any;
}

export interface BulkheadConfig {
  maxConcurrentRequests: number;
  queueSize: number;
  isolationKey: string;
  priority: 'high' | 'medium' | 'low';
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private consecutiveFailures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttemptTime?: Date;
  private recentFailures: FailureInfo[] = [];
  private stats: CircuitBreakerStats;
  private activeRequests: number = 0;
  private requestQueue: QueuedRequest[] = [];
  private backoffMultiplier: number = 1;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig,
    private bulkheadConfig?: BulkheadConfig
  ) {
    super();
    this.stats = this.initializeStats();
    this.startMonitoring();
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: any
  ): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (!this.shouldAttemptRecovery()) {
        const error = new CircuitBreakerError(
          `Circuit breaker ${this.name} is OPEN`,
          CircuitBreakerErrorType.CIRCUIT_OPEN,
          this.stats
        );
        this.stats.rejectedRequests++;
        this.emit('requestRejected', { error, context });
        throw error;
      }
      // Transition to half-open for recovery attempt
      this.setState(CircuitState.HALF_OPEN);
    }

    // Check bulkhead limits
    if (this.bulkheadConfig && this.activeRequests >= this.bulkheadConfig.maxConcurrentRequests) {
      if (this.requestQueue.length >= this.bulkheadConfig.queueSize) {
        const error = new CircuitBreakerError(
          `Bulkhead limit exceeded for ${this.name}`,
          CircuitBreakerErrorType.BULKHEAD_FULL,
          this.stats
        );
        this.emit('bulkheadRejection', { error, context });
        throw error;
      }
      
      // Queue the request
      return this.queueRequest(fn, context);
    }

    return this.executeRequest(fn, context);
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return { ...this.stats };
  }

  /**
   * Force circuit state change (for testing/manual intervention)
   */
  forceState(state: CircuitState): void {
    this.setState(state);
    this.emit('stateForced', { previousState: this.state, newState: state });
  }

  /**
   * Reset circuit breaker statistics
   */
  reset(): void {
    this.failures = 0;
    this.consecutiveFailures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttemptTime = undefined;
    this.recentFailures = [];
    this.backoffMultiplier = 1;
    this.setState(CircuitState.CLOSED);
    this.stats = this.initializeStats();
    this.emit('reset');
  }

  /**
   * Execute the actual request with monitoring
   */
  private async executeRequest<T>(
    fn: () => Promise<T>,
    context?: any
  ): Promise<T> {
    const startTime = Date.now();
    this.activeRequests++;
    this.stats.totalRequests++;

    try {
      // Apply timeout
      const result = await this.withTimeout(fn(), this.config.timeout);
      
      // Record success
      this.recordSuccess(Date.now() - startTime);
      
      // Process next queued request if any
      this.processQueue();
      
      return result;
    } catch (error) {
      // Record failure
      this.recordFailure(error, Date.now() - startTime, context);
      throw error;
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Queue request when bulkhead is full
   */
  private async queueRequest<T>(
    fn: () => Promise<T>,
    context?: any
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        fn,
        context,
        resolve,
        reject,
        timestamp: Date.now(),
        priority: this.bulkheadConfig?.priority || 'medium'
      };
      
      // Insert based on priority
      this.insertByPriority(queuedRequest);
      this.emit('requestQueued', { queueSize: this.requestQueue.length });
    });
  }

  /**
   * Process next request in queue
   */
  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) return;
    if (this.bulkheadConfig && this.activeRequests >= this.bulkheadConfig.maxConcurrentRequests) return;

    const request = this.requestQueue.shift()!;
    
    try {
      const result = await this.executeRequest(request.fn, request.context);
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    }
  }

  /**
   * Insert request by priority
   */
  private insertByPriority(request: QueuedRequest): void {
    const priorities = { high: 3, medium: 2, low: 1 };
    const priority = priorities[request.priority];
    
    let insertIndex = this.requestQueue.length;
    for (let i = 0; i < this.requestQueue.length; i++) {
      const existingPriority = priorities[this.requestQueue[i].priority];
      if (priority > existingPriority) {
        insertIndex = i;
        break;
      }
    }
    
    this.requestQueue.splice(insertIndex, 0, request);
  }

  /**
   * Record successful execution
   */
  private recordSuccess(duration: number): void {
    this.successes++;
    this.consecutiveFailures = 0;
    this.lastSuccessTime = new Date();
    
    // Update average response time
    this.updateAverageResponseTime(duration);
    
    // If in half-open state, check if we should close the circuit
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successes >= this.config.successThreshold) {
        this.setState(CircuitState.CLOSED);
        this.backoffMultiplier = 1; // Reset backoff
      }
    }
    
    this.emit('requestSuccess', { duration, consecutiveFailures: this.consecutiveFailures });
  }

  /**
   * Record failed execution
   */
  private recordFailure(error: any, duration: number, context?: any): void {
    this.failures++;
    this.consecutiveFailures++;
    this.lastFailureTime = new Date();
    
    const failureInfo: FailureInfo = {
      timestamp: new Date(),
      error,
      duration,
      context
    };
    
    this.recentFailures.push(failureInfo);
    this.cleanupOldFailures();
    
    // Update average response time
    this.updateAverageResponseTime(duration);
    
    // Check if we should open the circuit
    if (this.shouldOpenCircuit()) {
      this.setState(CircuitState.OPEN);
      this.scheduleRecoveryAttempt();
    }
    
    this.emit('requestFailure', { 
      error, 
      duration, 
      consecutiveFailures: this.consecutiveFailures,
      context 
    });
  }

  /**
   * Check if circuit should be opened
   */
  private shouldOpenCircuit(): boolean {
    if (this.state === CircuitState.OPEN) return false;
    
    // Check consecutive failures
    if (this.consecutiveFailures >= this.config.failureThreshold) {
      return true;
    }
    
    // Check failure rate in monitoring window
    const windowStart = Date.now() - this.config.monitoringWindow;
    const recentFailures = this.recentFailures.filter(f => f.timestamp.getTime() > windowStart);
    const failureRate = recentFailures.length / Math.max(this.stats.totalRequests, 1);
    
    return failureRate > 0.5; // 50% failure rate threshold
  }

  /**
   * Check if should attempt recovery
   */
  private shouldAttemptRecovery(): boolean {
    if (!this.nextAttemptTime) return false;
    return Date.now() >= this.nextAttemptTime.getTime();
  }

  /**
   * Schedule next recovery attempt with exponential backoff
   */
  private scheduleRecoveryAttempt(): void {
    let backoffTime = this.config.recoveryTimeout;
    
    if (this.config.exponentialBackoff) {
      backoffTime = Math.min(
        this.config.recoveryTimeout * this.backoffMultiplier,
        this.config.maxBackoffTime
      );
      this.backoffMultiplier *= 2;
    }
    
    this.nextAttemptTime = new Date(Date.now() + backoffTime);
    this.emit('recoveryScheduled', { attemptTime: this.nextAttemptTime, backoffTime });
  }

  /**
   * Set circuit state and emit events
   */
  private setState(newState: CircuitState): void {
    const previousState = this.state;
    this.state = newState;
    this.stats.state = newState;
    
    this.emit('stateChanged', { 
      previousState, 
      newState, 
      timestamp: new Date(),
      stats: this.getStats()
    });
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): CircuitBreakerStats {
    return {
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      consecutiveFailures: 0,
      totalRequests: 0,
      rejectedRequests: 0,
      averageResponseTime: 0,
      uptime: 100
    };
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(duration: number): void {
    const totalRequests = this.stats.totalRequests;
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (totalRequests - 1) + duration) / totalRequests;
  }

  /**
   * Clean up old failures outside monitoring window
   */
  private cleanupOldFailures(): void {
    const windowStart = Date.now() - this.config.monitoringWindow;
    this.recentFailures = this.recentFailures.filter(f => f.timestamp.getTime() > windowStart);
  }

  /**
   * Apply timeout to promise
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new CircuitBreakerError(
          `Request timeout after ${timeoutMs}ms`,
          CircuitBreakerErrorType.TIMEOUT,
          this.stats
        ));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Start monitoring loop
   */
  private startMonitoring(): void {
    setInterval(() => {
      this.updateUptime();
      this.cleanupOldFailures();
      this.processQueue(); // Process any queued requests
      this.emit('statsUpdated', this.getStats());
    }, 10000); // Every 10 seconds
  }

  /**
   * Update uptime calculation
   */
  private updateUptime(): void {
    const totalRequests = this.stats.totalRequests;
    if (totalRequests > 0) {
      const successRate = (totalRequests - this.failures) / totalRequests;
      this.stats.uptime = successRate * 100;
    }
  }
}

/**
 * Circuit Breaker Error Types
 */
export enum CircuitBreakerErrorType {
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
  TIMEOUT = 'TIMEOUT',
  BULKHEAD_FULL = 'BULKHEAD_FULL',
  EXECUTION_ERROR = 'EXECUTION_ERROR'
}

/**
 * Circuit Breaker Error
 */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public type: CircuitBreakerErrorType,
    public stats: CircuitBreakerStats,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Queued Request Interface
 */
interface QueuedRequest {
  fn: () => Promise<any>;
  context?: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Circuit Breaker Manager for managing multiple circuits
 */
export class CircuitBreakerManager extends EventEmitter {
  private circuits: Map<string, CircuitBreaker> = new Map();
  private globalStats: GlobalStats = { totalCircuits: 0, openCircuits: 0, totalRequests: 0 };

  /**
   * Create or get circuit breaker
   */
  getCircuitBreaker(
    name: string, 
    config: CircuitBreakerConfig,
    bulkheadConfig?: BulkheadConfig
  ): CircuitBreaker {
    if (!this.circuits.has(name)) {
      const circuit = new CircuitBreaker(name, config, bulkheadConfig);
      
      // Subscribe to circuit events
      circuit.on('stateChanged', (event) => {
        this.handleCircuitStateChange(name, event);
      });
      
      circuit.on('requestFailure', (event) => {
        this.emit('circuitFailure', { circuitName: name, ...event });
      });
      
      circuit.on('requestSuccess', (event) => {
        this.emit('circuitSuccess', { circuitName: name, ...event });
      });
      
      this.circuits.set(name, circuit);
      this.globalStats.totalCircuits++;
    }
    
    return this.circuits.get(name)!;
  }

  /**
   * Get all circuit breaker stats
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, circuit] of this.circuits) {
      stats[name] = circuit.getStats();
    }
    
    return stats;
  }

  /**
   * Get global statistics
   */
  getGlobalStats(): GlobalStats & { circuits: Record<string, CircuitBreakerStats> } {
    return {
      ...this.globalStats,
      circuits: this.getAllStats()
    };
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const circuit of this.circuits.values()) {
      circuit.reset();
    }
    this.globalStats.openCircuits = 0;
    this.emit('allCircuitsReset');
  }

  /**
   * Handle circuit state changes
   */
  private handleCircuitStateChange(name: string, event: any): void {
    if (event.newState === CircuitState.OPEN && event.previousState !== CircuitState.OPEN) {
      this.globalStats.openCircuits++;
    } else if (event.previousState === CircuitState.OPEN && event.newState !== CircuitState.OPEN) {
      this.globalStats.openCircuits--;
    }
    
    this.emit('globalStateChanged', {
      circuitName: name,
      ...event,
      globalStats: this.globalStats
    });
  }
}

interface GlobalStats {
  totalCircuits: number;
  openCircuits: number;
  totalRequests: number;
}