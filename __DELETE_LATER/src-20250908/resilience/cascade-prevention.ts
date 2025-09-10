/**
 * OSSA Cascading Failure Prevention System
 * Prevents system-wide failures by implementing isolation, bulkheads, and dependency management
 */

import { EventEmitter } from 'events';
import { CircuitBreaker, CircuitBreakerConfig, CircuitState } from './circuit-breaker';
import { RetryPolicy, RetryPolicyConfig } from './retry-policy';

export interface DependencyConfig {
  name: string;
  priority: DependencyPriority;
  timeout: number;
  circuitBreakerConfig: CircuitBreakerConfig;
  retryPolicyConfig?: RetryPolicyConfig;
  fallbackStrategy: FallbackStrategy;
  healthCheckInterval: number;
  isolationLevel: IsolationLevel;
}

export enum DependencyPriority {
  CRITICAL = 'critical',    // System cannot function without this
  HIGH = 'high',           // Major functionality impacted
  MEDIUM = 'medium',       // Some functionality impacted
  LOW = 'low'             // Minimal impact
}

export enum FallbackStrategy {
  FAIL_FAST = 'fail-fast',                // Fail immediately
  GRACEFUL_DEGRADATION = 'graceful-degradation', // Reduce functionality
  CACHED_RESPONSE = 'cached-response',     // Return cached data
  DEFAULT_VALUE = 'default-value',         // Return default value
  CIRCUIT_BREAKER = 'circuit-breaker',     // Use circuit breaker
  RETRY_THEN_FAIL = 'retry-then-fail'      // Retry then fail
}

export enum IsolationLevel {
  NONE = 'none',           // No isolation
  THREAD = 'thread',       // Thread pool isolation
  PROCESS = 'process',     // Process isolation
  SERVICE = 'service',     // Service isolation
  BULKHEAD = 'bulkhead'    // Bulkhead pattern
}

export interface CascadePreventionConfig {
  maxConcurrentFailures: number;        // Max concurrent failing dependencies
  failureEscalationThreshold: number;   // Threshold to escalate response
  systemHealthThreshold: number;        // Overall system health threshold (0-100)
  isolationTimeout: number;             // How long to isolate failing components
  fallbackTimeout: number;              // Timeout for fallback operations
  enablePreemptiveIsolation: boolean;   // Isolate before complete failure
  enableAdaptiveTimeout: boolean;       // Adjust timeouts based on performance
  enableLoadShedding: boolean;          // Shed load under stress
}

export interface SystemHealth {
  overallHealth: number;        // 0-100 percentage
  criticalServicesUp: number;   // Count of critical services up
  totalDependencies: number;    // Total number of dependencies
  failedDependencies: string[]; // Names of failed dependencies
  isolatedDependencies: string[]; // Names of isolated dependencies
  lastHealthCheck: Date;
  trendDirection: 'improving' | 'stable' | 'degrading';
}

export interface DependencyHealth {
  name: string;
  isHealthy: boolean;
  lastSuccessTime?: Date;
  lastFailureTime?: Date;
  consecutiveFailures: number;
  responseTime: number;
  uptime: number; // Percentage
  circuitState: CircuitState;
  isolationLevel: IsolationLevel;
  isIsolated: boolean;
}

export class CascadePreventionSystem extends EventEmitter {
  private dependencies: Map<string, DependencyManager> = new Map();
  private systemHealth: SystemHealth;
  private healthCheckTimer?: NodeJS.Timeout;
  private healthHistory: number[] = []; // Last 10 health scores
  private loadSheddingActive = false;

  constructor(private config: CascadePreventionConfig) {
    super();
    this.systemHealth = this.initializeSystemHealth();
    this.startHealthMonitoring();
  }

  /**
   * Register a dependency for monitoring
   */
  registerDependency(
    dependencyConfig: DependencyConfig,
    fallbackFunction?: () => Promise<any>
  ): DependencyManager {
    const manager = new DependencyManager(dependencyConfig, fallbackFunction);
    
    // Subscribe to dependency events
    manager.on('healthChanged', (event) => {
      this.handleDependencyHealthChange(dependencyConfig.name, event);
    });
    
    manager.on('failure', (event) => {
      this.handleDependencyFailure(dependencyConfig.name, event);
    });
    
    manager.on('recovery', (event) => {
      this.handleDependencyRecovery(dependencyConfig.name, event);
    });

    this.dependencies.set(dependencyConfig.name, manager);
    this.updateSystemHealth();
    
    this.emit('dependencyRegistered', { 
      name: dependencyConfig.name, 
      priority: dependencyConfig.priority 
    });
    
    return manager;
  }

  /**
   * Execute operation with cascade prevention
   */
  async execute<T>(
    dependencyName: string,
    operation: () => Promise<T>,
    context?: any
  ): Promise<T> {
    const manager = this.dependencies.get(dependencyName);
    if (!manager) {
      throw new Error(`Dependency '${dependencyName}' not registered`);
    }

    // Check if load shedding is active
    if (this.loadSheddingActive && manager.getPriority() === DependencyPriority.LOW) {
      throw new LoadSheddingError(`Load shedding active, rejecting low priority request`);
    }

    // Check system health before execution
    if (this.shouldPreventExecution(manager)) {
      return this.executeFallback(manager, context);
    }

    try {
      const result = await manager.execute(operation, context);
      this.updateSystemHealth();
      return result;
    } catch (error) {
      this.updateSystemHealth();
      
      // Check if we should isolate this dependency
      if (this.shouldIsolateDependency(manager)) {
        await this.isolateDependency(dependencyName);
      }
      
      // Check if this failure might trigger cascade
      if (this.detectPotentialCascade()) {
        this.activateEmergencyProtocols();
      }
      
      throw error;
    }
  }

  /**
   * Get current system health
   */
  getSystemHealth(): SystemHealth {
    return { ...this.systemHealth };
  }

  /**
   * Get health status of all dependencies
   */
  getDependencyHealth(): Record<string, DependencyHealth> {
    const health: Record<string, DependencyHealth> = {};
    
    for (const [name, manager] of this.dependencies) {
      health[name] = manager.getHealth();
    }
    
    return health;
  }

  /**
   * Manually isolate a dependency
   */
  async isolateDependency(name: string): Promise<void> {
    const manager = this.dependencies.get(name);
    if (!manager) {
      throw new Error(`Dependency '${name}' not found`);
    }

    await manager.isolate();
    this.updateSystemHealth();
    
    this.emit('dependencyIsolated', { 
      name, 
      systemHealth: this.getSystemHealth() 
    });

    // Schedule automatic recovery attempt
    setTimeout(() => {
      this.attemptDependencyRecovery(name);
    }, this.config.isolationTimeout);
  }

  /**
   * Manually recover an isolated dependency
   */
  async recoverDependency(name: string): Promise<void> {
    const manager = this.dependencies.get(name);
    if (!manager) {
      throw new Error(`Dependency '${name}' not found`);
    }

    await manager.recover();
    this.updateSystemHealth();
    
    this.emit('dependencyRecovered', { 
      name, 
      systemHealth: this.getSystemHealth() 
    });
  }

  /**
   * Activate emergency protocols
   */
  private activateEmergencyProtocols(): void {
    this.emit('emergencyProtocolsActivated', {
      systemHealth: this.getSystemHealth(),
      timestamp: new Date()
    });

    // Activate load shedding for non-critical services
    this.loadSheddingActive = true;
    
    // Isolate all failing dependencies
    for (const [name, manager] of this.dependencies) {
      if (!manager.getHealth().isHealthy && 
          manager.getPriority() !== DependencyPriority.CRITICAL) {
        this.isolateDependency(name);
      }
    }

    // Schedule emergency protocols deactivation
    setTimeout(() => {
      this.deactivateEmergencyProtocols();
    }, this.config.isolationTimeout * 2);
  }

  /**
   * Deactivate emergency protocols
   */
  private deactivateEmergencyProtocols(): void {
    this.loadSheddingActive = false;
    
    this.emit('emergencyProtocolsDeactivated', {
      systemHealth: this.getSystemHealth(),
      timestamp: new Date()
    });
  }

  /**
   * Check if execution should be prevented
   */
  private shouldPreventExecution(manager: DependencyManager): boolean {
    const health = manager.getHealth();
    
    // Always prevent execution if isolated
    if (health.isIsolated) {
      return true;
    }
    
    // Prevent if circuit breaker is open and not critical
    if (health.circuitState === CircuitState.OPEN && 
        manager.getPriority() !== DependencyPriority.CRITICAL) {
      return true;
    }
    
    // Prevent if system health is too low
    if (this.systemHealth.overallHealth < this.config.systemHealthThreshold &&
        manager.getPriority() === DependencyPriority.LOW) {
      return true;
    }
    
    return false;
  }

  /**
   * Execute fallback strategy
   */
  private async executeFallback<T>(manager: DependencyManager, context?: any): Promise<T> {
    try {
      const result = await manager.executeFallback(context);
      this.emit('fallbackExecuted', { 
        dependency: manager.getName(), 
        strategy: manager.getFallbackStrategy() 
      });
      return result;
    } catch (error) {
      this.emit('fallbackFailed', { 
        dependency: manager.getName(), 
        error 
      });
      throw error;
    }
  }

  /**
   * Check if dependency should be isolated
   */
  private shouldIsolateDependency(manager: DependencyManager): boolean {
    const health = manager.getHealth();
    
    // Don't isolate critical dependencies
    if (manager.getPriority() === DependencyPriority.CRITICAL) {
      return false;
    }
    
    // Isolate if too many consecutive failures
    if (health.consecutiveFailures >= 5) {
      return true;
    }
    
    // Isolate if uptime is too low
    if (health.uptime < 50) {
      return true;
    }
    
    return false;
  }

  /**
   * Detect potential cascade failure
   */
  private detectPotentialCascade(): boolean {
    const health = this.getDependencyHealth();
    const failedCount = Object.values(health).filter(h => !h.isHealthy).length;
    const criticalFailedCount = Object.values(health).filter(h => 
      !h.isHealthy && this.dependencies.get(h.name)?.getPriority() === DependencyPriority.CRITICAL
    ).length;
    
    // Cascade if too many dependencies failing
    if (failedCount >= this.config.maxConcurrentFailures) {
      return true;
    }
    
    // Cascade if any critical dependency is failing
    if (criticalFailedCount > 0) {
      return true;
    }
    
    // Cascade if system health dropping rapidly
    if (this.healthHistory.length >= 3) {
      const recentHealths = this.healthHistory.slice(-3);
      const healthDrop = recentHealths[0] - recentHealths[recentHealths.length - 1];
      if (healthDrop > 30) { // 30% health drop
        return true;
      }
    }
    
    return false;
  }

  /**
   * Handle dependency health change
   */
  private handleDependencyHealthChange(name: string, event: any): void {
    this.updateSystemHealth();
    
    this.emit('systemHealthChanged', {
      dependency: name,
      event,
      systemHealth: this.getSystemHealth()
    });
  }

  /**
   * Handle dependency failure
   */
  private handleDependencyFailure(name: string, event: any): void {
    this.updateSystemHealth();
    
    // Check if we need to activate emergency protocols
    if (this.systemHealth.overallHealth < this.config.failureEscalationThreshold) {
      this.activateEmergencyProtocols();
    }
    
    this.emit('dependencyFailure', {
      dependency: name,
      event,
      systemHealth: this.getSystemHealth()
    });
  }

  /**
   * Handle dependency recovery
   */
  private handleDependencyRecovery(name: string, event: any): void {
    this.updateSystemHealth();
    
    this.emit('dependencyRecovery', {
      dependency: name,
      event,
      systemHealth: this.getSystemHealth()
    });
  }

  /**
   * Attempt to recover isolated dependency
   */
  private async attemptDependencyRecovery(name: string): Promise<void> {
    try {
      await this.recoverDependency(name);
      this.emit('automaticRecoverySucceeded', { dependency: name });
    } catch (error) {
      this.emit('automaticRecoveryFailed', { dependency: name, error });
      
      // Schedule another recovery attempt with backoff
      setTimeout(() => {
        this.attemptDependencyRecovery(name);
      }, this.config.isolationTimeout * 2);
    }
  }

  /**
   * Update system health metrics
   */
  private updateSystemHealth(): void {
    const dependencies = Array.from(this.dependencies.values());
    const healthStats = dependencies.map(d => d.getHealth());
    
    const totalDeps = dependencies.length;
    const healthyDeps = healthStats.filter(h => h.isHealthy).length;
    const criticalDeps = dependencies.filter(d => d.getPriority() === DependencyPriority.CRITICAL);
    const criticalHealthyDeps = criticalDeps.filter(d => d.getHealth().isHealthy).length;
    
    const overallHealth = totalDeps > 0 ? (healthyDeps / totalDeps) * 100 : 100;
    
    // Track health trend
    this.healthHistory.push(overallHealth);
    if (this.healthHistory.length > 10) {
      this.healthHistory.shift();
    }
    
    const trendDirection = this.calculateTrendDirection();
    
    this.systemHealth = {
      overallHealth: Math.round(overallHealth),
      criticalServicesUp: criticalHealthyDeps,
      totalDependencies: totalDeps,
      failedDependencies: healthStats.filter(h => !h.isHealthy).map(h => h.name),
      isolatedDependencies: healthStats.filter(h => h.isIsolated).map(h => h.name),
      lastHealthCheck: new Date(),
      trendDirection
    };
  }

  /**
   * Calculate health trend direction
   */
  private calculateTrendDirection(): 'improving' | 'stable' | 'degrading' {
    if (this.healthHistory.length < 3) return 'stable';
    
    const recent = this.healthHistory.slice(-3);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const older = this.healthHistory.slice(-6, -3);
    const avgOlder = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : avgRecent;
    
    const difference = avgRecent - avgOlder;
    
    if (difference > 5) return 'improving';
    if (difference < -5) return 'degrading';
    return 'stable';
  }

  /**
   * Initialize system health
   */
  private initializeSystemHealth(): SystemHealth {
    return {
      overallHealth: 100,
      criticalServicesUp: 0,
      totalDependencies: 0,
      failedDependencies: [],
      isolatedDependencies: [],
      lastHealthCheck: new Date(),
      trendDirection: 'stable'
    };
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.updateSystemHealth();
      this.emit('healthCheckCompleted', this.getSystemHealth());
    }, 5000); // Every 5 seconds
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    // Stop all dependency managers
    for (const manager of this.dependencies.values()) {
      manager.stop();
    }
    
    this.emit('systemStopped');
  }
}

/**
 * Individual dependency manager
 */
class DependencyManager extends EventEmitter {
  private circuitBreaker: CircuitBreaker;
  private retryPolicy?: RetryPolicy;
  private isIsolated = false;
  private health: DependencyHealth;
  private lastResponseTime = 0;
  private successCount = 0;
  private totalRequests = 0;

  constructor(
    private config: DependencyConfig,
    private fallbackFunction?: () => Promise<any>
  ) {
    super();
    
    this.circuitBreaker = new CircuitBreaker(
      config.name,
      config.circuitBreakerConfig
    );
    
    if (config.retryPolicyConfig) {
      this.retryPolicy = new RetryPolicy(config.retryPolicyConfig);
    }
    
    this.health = this.initializeHealth();
    this.setupCircuitBreakerEvents();
  }

  async execute<T>(operation: () => Promise<T>, context?: any): Promise<T> {
    if (this.isIsolated) {
      throw new DependencyIsolatedError(`Dependency ${this.config.name} is isolated`);
    }

    const startTime = Date.now();
    this.totalRequests++;

    try {
      let result: T;
      
      if (this.retryPolicy) {
        const retryResult = await this.retryPolicy.execute(async () => {
          return await this.circuitBreaker.execute(operation, context);
        });
        result = retryResult.result;
      } else {
        result = await this.circuitBreaker.execute(operation, context);
      }
      
      this.recordSuccess(Date.now() - startTime);
      return result;
      
    } catch (error) {
      this.recordFailure(Date.now() - startTime);
      throw error;
    }
  }

  async executeFallback<T>(context?: any): Promise<T> {
    if (!this.fallbackFunction) {
      throw new Error(`No fallback function configured for ${this.config.name}`);
    }
    
    switch (this.config.fallbackStrategy) {
      case FallbackStrategy.CACHED_RESPONSE:
      case FallbackStrategy.DEFAULT_VALUE:
      case FallbackStrategy.GRACEFUL_DEGRADATION:
        return await this.fallbackFunction();
      
      case FallbackStrategy.FAIL_FAST:
        throw new Error(`Dependency ${this.config.name} failing fast`);
      
      case FallbackStrategy.CIRCUIT_BREAKER:
        // Circuit breaker should handle this
        throw new Error(`Circuit breaker open for ${this.config.name}`);
      
      default:
        return await this.fallbackFunction();
    }
  }

  async isolate(): Promise<void> {
    this.isIsolated = true;
    this.health.isIsolated = true;
    this.emit('isolated');
  }

  async recover(): Promise<void> {
    this.isIsolated = false;
    this.health.isIsolated = false;
    this.circuitBreaker.reset();
    this.emit('recovered');
  }

  getHealth(): DependencyHealth {
    return { ...this.health };
  }

  getName(): string {
    return this.config.name;
  }

  getPriority(): DependencyPriority {
    return this.config.priority;
  }

  getFallbackStrategy(): FallbackStrategy {
    return this.config.fallbackStrategy;
  }

  stop(): void {
    // Cleanup resources
    this.removeAllListeners();
  }

  private setupCircuitBreakerEvents(): void {
    this.circuitBreaker.on('stateChanged', (event) => {
      this.health.circuitState = event.newState;
      this.emit('healthChanged', { circuitState: event.newState });
    });
  }

  private recordSuccess(responseTime: number): void {
    this.successCount++;
    this.lastResponseTime = responseTime;
    this.health.lastSuccessTime = new Date();
    this.health.consecutiveFailures = 0;
    this.updateHealth();
    this.emit('success', { responseTime });
  }

  private recordFailure(responseTime: number): void {
    this.lastResponseTime = responseTime;
    this.health.lastFailureTime = new Date();
    this.health.consecutiveFailures++;
    this.updateHealth();
    this.emit('failure', { responseTime });
  }

  private updateHealth(): void {
    this.health.responseTime = this.lastResponseTime;
    this.health.uptime = this.totalRequests > 0 ? (this.successCount / this.totalRequests) * 100 : 100;
    this.health.isHealthy = this.health.uptime > 50 && 
                           this.health.consecutiveFailures < 5 && 
                           !this.isIsolated;
  }

  private initializeHealth(): DependencyHealth {
    return {
      name: this.config.name,
      isHealthy: true,
      consecutiveFailures: 0,
      responseTime: 0,
      uptime: 100,
      circuitState: CircuitState.CLOSED,
      isolationLevel: this.config.isolationLevel,
      isIsolated: false
    };
  }
}

/**
 * Custom error classes
 */
export class CascadePreventionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CascadePreventionError';
  }
}

export class DependencyIsolatedError extends CascadePreventionError {
  constructor(message: string) {
    super(message);
    this.name = 'DependencyIsolatedError';
  }
}

export class LoadSheddingError extends CascadePreventionError {
  constructor(message: string) {
    super(message);
    this.name = 'LoadSheddingError';
  }
}