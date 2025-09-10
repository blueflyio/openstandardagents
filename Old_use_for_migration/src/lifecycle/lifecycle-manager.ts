/**
 * OSSA Agent Lifecycle Management System
 * Comprehensive lifecycle management with health monitoring, graceful shutdown,
 * hot-swapping, and dependency resolution
 */

import { EventEmitter } from 'events';
import { Agent, AgentState } from '../coordination/agent-coordinator.js';

export enum LifecycleState {
  INITIALIZING = 'initializing',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  FAILED = 'failed',
  MAINTENANCE = 'maintenance',
  SWAPPING = 'swapping',
  SUSPENDED = 'suspended'
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}

export enum FailureDetectionTier {
  HEARTBEAT = 'heartbeat',
  HEALTH_CHECK = 'health_check',
  PERFORMANCE = 'performance',
  DEPENDENCY = 'dependency',
  RESOURCE = 'resource'
}

export interface LifecycleAgent extends Agent {
  lifecycle: {
    state: LifecycleState;
    healthStatus: HealthStatus;
    startedAt: Date;
    lastHealthCheck: Date;
    restartCount: number;
    gracefulShutdownTimeout: number;
    hotSwapCapable: boolean;
    dependencies: string[];
    dependents: string[];
  };
}

export interface HeartbeatConfig {
  interval: number;
  timeout: number;
  retryAttempts: number;
  escalationDelay: number;
}

export interface HealthCheckConfig {
  endpoint: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  timeout: number;
  interval: number;
  failureThreshold: number;
  successThreshold: number;
}

export interface FailureDetectionConfig {
  tiers: {
    [key in FailureDetectionTier]: {
      enabled: boolean;
      threshold: number;
      action: FailureAction;
      escalationTime: number;
    };
  };
  circuit_breaker: {
    enabled: boolean;
    failure_threshold: number;
    recovery_timeout: number;
    half_open_max_calls: number;
  };
}

export interface ShutdownConfig {
  graceful_timeout: number;
  force_timeout: number;
  cleanup_tasks: string[];
  drain_connections: boolean;
  save_state: boolean;
}

export interface HotSwapConfig {
  enabled: boolean;
  preparation_timeout: number;
  swap_timeout: number;
  rollback_timeout: number;
  health_check_delay: number;
  compatibility_check: boolean;
}

export interface DependencyConfig {
  resolution_strategy: 'breadth_first' | 'depth_first' | 'priority_based';
  circular_detection: boolean;
  max_dependency_depth: number;
  startup_order_timeout: number;
  shutdown_order_timeout: number;
}

export enum FailureAction {
  RESTART = 'restart',
  REPLACE = 'replace',
  ISOLATE = 'isolate',
  ESCALATE = 'escalate',
  IGNORE = 'ignore'
}

export interface LifecycleEvent {
  type: string;
  agentId: string;
  timestamp: Date;
  data: any;
  metadata?: {
    source: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    category: string;
  };
}

export interface HealthMetrics {
  cpu_usage: number;
  memory_usage: number;
  response_time_ms: number;
  error_rate: number;
  throughput: number;
  availability: number;
  last_updated: Date;
}

export interface DependencyNode {
  id: string;
  dependencies: string[];
  dependents: string[];
  startupOrder: number;
  shutdownOrder: number;
  critical: boolean;
}

export interface CircularDependency {
  cycle: string[];
  detected_at: Date;
  severity: 'warning' | 'error';
  resolution_suggestion: string;
}

export class LifecycleManager extends EventEmitter {
  private agents: Map<string, LifecycleAgent> = new Map();
  private healthMetrics: Map<string, HealthMetrics> = new Map();
  private dependencyGraph: Map<string, DependencyNode> = new Map();
  private circularDependencies: CircularDependency[] = [];
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private shutdownInProgress = false;
  private swapOperations: Map<string, HotSwapOperation> = new Map();

  constructor(
    private config: {
      heartbeat: HeartbeatConfig;
      healthCheck: HealthCheckConfig;
      failureDetection: FailureDetectionConfig;
      shutdown: ShutdownConfig;
      hotSwap: HotSwapConfig;
      dependency: DependencyConfig;
    }
  ) {
    super();
    this.startLifecycleMonitoring();
    this.startDependencyMonitoring();
  }

  /**
   * Register agent with lifecycle management
   */
  async registerAgent(agent: Agent, dependencies: string[] = []): Promise<void> {
    const lifecycleAgent: LifecycleAgent = {
      ...agent,
      lifecycle: {
        state: LifecycleState.INITIALIZING,
        healthStatus: HealthStatus.UNKNOWN,
        startedAt: new Date(),
        lastHealthCheck: new Date(),
        restartCount: 0,
        gracefulShutdownTimeout: this.config.shutdown.graceful_timeout,
        hotSwapCapable: false,
        dependencies,
        dependents: []
      }
    };

    this.agents.set(agent.id, lifecycleAgent);
    this.updateDependencyGraph(agent.id, dependencies);
    
    // Initialize health metrics
    this.healthMetrics.set(agent.id, {
      cpu_usage: 0,
      memory_usage: 0,
      response_time_ms: 0,
      error_rate: 0,
      throughput: 0,
      availability: 100,
      last_updated: new Date()
    });

    this.emit('agentRegistered', {
      type: 'agentRegistered',
      agentId: agent.id,
      timestamp: new Date(),
      data: { agent: lifecycleAgent }
    } as LifecycleEvent);

    // Start monitoring
    this.startHeartbeatMonitoring(agent.id);
    this.startHealthCheckMonitoring(agent.id);
  }

  /**
   * Start agent with dependency resolution
   */
  async startAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Check circular dependencies
    const circularDeps = this.detectCircularDependencies(agentId);
    if (circularDeps.length > 0) {
      this.circularDependencies.push(...circularDeps);
      if (circularDeps.some(cd => cd.severity === 'error')) {
        throw new Error(`Cannot start agent ${agentId}: circular dependency detected`);
      }
    }

    // Resolve startup order
    const startupOrder = this.resolveStartupOrder(agentId);
    
    // Start dependencies first
    for (const depId of startupOrder) {
      if (depId !== agentId) {
        await this.ensureAgentRunning(depId);
      }
    }

    // Start the agent
    await this.performAgentStart(agent);
  }

  /**
   * Stop agent with graceful shutdown
   */
  async stopAgent(agentId: string, force = false): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (agent.lifecycle.state === LifecycleState.STOPPED) {
      return;
    }

    // Update state
    agent.lifecycle.state = LifecycleState.STOPPING;
    this.emitLifecycleEvent('agentStopping', agentId, { force });

    try {
      if (!force) {
        // Graceful shutdown
        await this.performGracefulShutdown(agent);
      } else {
        // Force stop
        await this.performForceStop(agent);
      }

      agent.lifecycle.state = LifecycleState.STOPPED;
      this.emitLifecycleEvent('agentStopped', agentId, {});

    } catch (error) {
      agent.lifecycle.state = LifecycleState.FAILED;
      this.emitLifecycleEvent('agentStopFailed', agentId, { error });
      throw error;
    }
  }

  /**
   * Perform hot swap of agent
   */
  async hotSwapAgent(agentId: string, newAgentConfig: Partial<Agent>): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!agent.lifecycle.hotSwapCapable) {
      throw new Error(`Agent ${agentId} does not support hot swapping`);
    }

    const swapId = `swap-${Date.now()}-${Math.random()}`;
    const swapOperation: HotSwapOperation = {
      id: swapId,
      agentId,
      originalConfig: { ...agent },
      newConfig: newAgentConfig,
      state: 'preparing',
      startedAt: new Date(),
      stages: {
        preparation: { completed: false, startedAt: new Date() },
        validation: { completed: false },
        swap: { completed: false },
        verification: { completed: false }
      }
    };

    this.swapOperations.set(swapId, swapOperation);
    agent.lifecycle.state = LifecycleState.SWAPPING;

    try {
      // Stage 1: Preparation
      await this.prepareHotSwap(swapOperation);
      
      // Stage 2: Validation
      await this.validateHotSwap(swapOperation);
      
      // Stage 3: Perform swap
      await this.performHotSwap(swapOperation);
      
      // Stage 4: Verification
      await this.verifyHotSwap(swapOperation);

      agent.lifecycle.state = LifecycleState.RUNNING;
      this.emitLifecycleEvent('hotSwapCompleted', agentId, { swapId });

    } catch (error) {
      // Rollback on failure
      await this.rollbackHotSwap(swapOperation);
      agent.lifecycle.state = LifecycleState.RUNNING;
      this.emitLifecycleEvent('hotSwapFailed', agentId, { swapId, error });
      throw error;
    } finally {
      this.swapOperations.delete(swapId);
    }
  }

  /**
   * Get agent health status
   */
  getAgentHealth(agentId: string): {
    status: HealthStatus;
    metrics: HealthMetrics;
    lastCheck: Date;
    issues: string[];
  } {
    const agent = this.agents.get(agentId);
    const metrics = this.healthMetrics.get(agentId);
    
    if (!agent || !metrics) {
      return {
        status: HealthStatus.UNKNOWN,
        metrics: {} as HealthMetrics,
        lastCheck: new Date(0),
        issues: ['Agent not found']
      };
    }

    const issues: string[] = [];
    let status = HealthStatus.HEALTHY;

    // Check various health indicators
    if (metrics.error_rate > 5) {
      issues.push('High error rate');
      status = HealthStatus.DEGRADED;
    }

    if (metrics.response_time_ms > 5000) {
      issues.push('High response time');
      status = HealthStatus.DEGRADED;
    }

    if (metrics.availability < 95) {
      issues.push('Low availability');
      status = HealthStatus.UNHEALTHY;
    }

    if (metrics.cpu_usage > 90 || metrics.memory_usage > 90) {
      issues.push('High resource usage');
      status = HealthStatus.CRITICAL;
    }

    return {
      status,
      metrics,
      lastCheck: agent.lifecycle.lastHealthCheck,
      issues
    };
  }

  /**
   * Get system-wide health overview
   */
  getSystemHealth(): {
    overall: HealthStatus;
    agents: {
      total: number;
      healthy: number;
      degraded: number;
      unhealthy: number;
      critical: number;
    };
    dependencies: {
      total: number;
      circular: number;
      resolved: number;
    };
    issues: string[];
  } {
    const agents = Array.from(this.agents.values());
    const healthStats = {
      total: agents.length,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      critical: 0
    };

    const issues: string[] = [];

    agents.forEach(agent => {
      const health = this.getAgentHealth(agent.id);
      healthStats[health.status]++;
      if (health.issues.length > 0) {
        issues.push(...health.issues.map(issue => `${agent.id}: ${issue}`));
      }
    });

    // Overall system health
    let overall = HealthStatus.HEALTHY;
    if (healthStats.critical > 0) {
      overall = HealthStatus.CRITICAL;
    } else if (healthStats.unhealthy > 0) {
      overall = HealthStatus.UNHEALTHY;
    } else if (healthStats.degraded > 0) {
      overall = HealthStatus.DEGRADED;
    }

    // Add circular dependency issues
    if (this.circularDependencies.length > 0) {
      issues.push(`${this.circularDependencies.length} circular dependencies detected`);
    }

    return {
      overall,
      agents: healthStats,
      dependencies: {
        total: this.dependencyGraph.size,
        circular: this.circularDependencies.length,
        resolved: this.dependencyGraph.size - this.circularDependencies.length
      },
      issues
    };
  }

  /**
   * Shutdown all agents gracefully
   */
  async shutdown(): Promise<void> {
    if (this.shutdownInProgress) {
      return;
    }

    this.shutdownInProgress = true;
    this.emitLifecycleEvent('systemShuttingDown', 'system', {});

    try {
      // Stop all monitoring
      this.stopAllMonitoring();

      // Get shutdown order (reverse of startup order)
      const shutdownOrder = this.resolveShutdownOrder();
      
      // Stop agents in order
      for (const agentId of shutdownOrder) {
        try {
          await this.stopAgent(agentId);
        } catch (error) {
          console.error(`Failed to stop agent ${agentId}:`, error);
        }
      }

      this.emitLifecycleEvent('systemShutdownComplete', 'system', {});

    } finally {
      this.shutdownInProgress = false;
    }
  }

  // Private methods

  private startLifecycleMonitoring(): void {
    // Main lifecycle monitoring loop
    setInterval(() => {
      this.performSystemHealthCheck();
      this.cleanupFailedOperations();
      this.detectAndHandleFailures();
    }, 10000); // Every 10 seconds
  }

  private startDependencyMonitoring(): void {
    // Dependency monitoring loop
    setInterval(() => {
      this.checkDependencyHealth();
      this.revalidateCircularDependencies();
    }, 30000); // Every 30 seconds
  }

  private startHeartbeatMonitoring(agentId: string): void {
    const interval = setInterval(async () => {
      await this.performHeartbeatCheck(agentId);
    }, this.config.heartbeat.interval);

    this.heartbeatIntervals.set(agentId, interval);
  }

  private startHealthCheckMonitoring(agentId: string): void {
    const interval = setInterval(async () => {
      await this.performHealthCheck(agentId);
    }, this.config.healthCheck.interval);

    this.healthCheckIntervals.set(agentId, interval);
  }

  private async performHeartbeatCheck(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent || agent.lifecycle.state !== LifecycleState.RUNNING) {
      return;
    }

    try {
      // Simulate heartbeat check - in real implementation, this would ping the agent
      const heartbeatResponse = await this.sendHeartbeat(agentId);
      
      if (heartbeatResponse) {
        agent.lastHeartbeat = new Date();
        if (agent.lifecycle.healthStatus === HealthStatus.UNHEALTHY) {
          agent.lifecycle.healthStatus = HealthStatus.HEALTHY;
          this.emitLifecycleEvent('agentRecovered', agentId, {});
        }
      } else {
        throw new Error('Heartbeat failed');
      }

    } catch (error) {
      this.handleHeartbeatFailure(agentId, error);
    }
  }

  private async performHealthCheck(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent || agent.lifecycle.state !== LifecycleState.RUNNING) {
      return;
    }

    try {
      // Perform comprehensive health check
      const metrics = await this.collectHealthMetrics(agentId);
      this.healthMetrics.set(agentId, metrics);
      agent.lifecycle.lastHealthCheck = new Date();

      // Update health status based on metrics
      const health = this.getAgentHealth(agentId);
      agent.lifecycle.healthStatus = health.status;

      if (health.status === HealthStatus.CRITICAL || health.status === HealthStatus.UNHEALTHY) {
        this.handleHealthCheckFailure(agentId, health.issues);
      }

    } catch (error) {
      this.handleHealthCheckFailure(agentId, [error.message]);
    }
  }

  private async sendHeartbeat(agentId: string): Promise<boolean> {
    // Simulate heartbeat - in real implementation, this would be an HTTP request
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.05); // 95% success rate
      }, 100);
    });
  }

  private async collectHealthMetrics(agentId: string): Promise<HealthMetrics> {
    // Simulate metrics collection - in real implementation, this would query the agent
    return {
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      response_time_ms: Math.random() * 2000,
      error_rate: Math.random() * 10,
      throughput: Math.random() * 1000,
      availability: 95 + Math.random() * 5,
      last_updated: new Date()
    };
  }

  private handleHeartbeatFailure(agentId: string, error: any): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    this.emitLifecycleEvent('heartbeatFailed', agentId, { error });

    // Apply failure detection policy
    const action = this.config.failureDetection.tiers[FailureDetectionTier.HEARTBEAT].action;
    this.executeFailureAction(agentId, action, 'heartbeat failure');
  }

  private handleHealthCheckFailure(agentId: string, issues: string[]): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    this.emitLifecycleEvent('healthCheckFailed', agentId, { issues });

    // Apply failure detection policy
    const action = this.config.failureDetection.tiers[FailureDetectionTier.HEALTH_CHECK].action;
    this.executeFailureAction(agentId, action, 'health check failure');
  }

  private async executeFailureAction(agentId: string, action: FailureAction, reason: string): Promise<void> {
    switch (action) {
      case FailureAction.RESTART:
        await this.restartAgent(agentId, reason);
        break;
      case FailureAction.REPLACE:
        await this.replaceAgent(agentId, reason);
        break;
      case FailureAction.ISOLATE:
        await this.isolateAgent(agentId, reason);
        break;
      case FailureAction.ESCALATE:
        this.escalateFailure(agentId, reason);
        break;
      case FailureAction.IGNORE:
        // Log but take no action
        console.warn(`Ignoring failure for agent ${agentId}: ${reason}`);
        break;
    }
  }

  private async restartAgent(agentId: string, reason: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.lifecycle.restartCount++;
    this.emitLifecycleEvent('agentRestarting', agentId, { reason, restartCount: agent.lifecycle.restartCount });

    try {
      await this.stopAgent(agentId, true);
      await this.startAgent(agentId);
      this.emitLifecycleEvent('agentRestarted', agentId, { reason });
    } catch (error) {
      this.emitLifecycleEvent('agentRestartFailed', agentId, { reason, error });
    }
  }

  private async replaceAgent(agentId: string, reason: string): Promise<void> {
    // Implementation for replacing a failed agent with a new instance
    this.emitLifecycleEvent('agentReplacing', agentId, { reason });
    // Would spawn a new agent instance and migrate state
  }

  private async isolateAgent(agentId: string, reason: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.lifecycle.state = LifecycleState.SUSPENDED;
    this.emitLifecycleEvent('agentIsolated', agentId, { reason });
  }

  private escalateFailure(agentId: string, reason: string): void {
    this.emitLifecycleEvent('failureEscalated', agentId, { 
      reason, 
      metadata: { 
        severity: 'critical', 
        category: 'escalation' 
      } 
    });
  }

  private updateDependencyGraph(agentId: string, dependencies: string[]): void {
    // Update dependency graph
    const node: DependencyNode = {
      id: agentId,
      dependencies,
      dependents: [],
      startupOrder: 0,
      shutdownOrder: 0,
      critical: false
    };

    this.dependencyGraph.set(agentId, node);

    // Update dependents for dependencies
    dependencies.forEach(depId => {
      const depNode = this.dependencyGraph.get(depId);
      if (depNode && !depNode.dependents.includes(agentId)) {
        depNode.dependents.push(agentId);
      }
    });
  }

  private detectCircularDependencies(agentId: string): CircularDependency[] {
    const visited = new Set<string>();
    const path: string[] = [];
    const cycles: CircularDependency[] = [];

    const dfs = (currentId: string): void => {
      if (path.includes(currentId)) {
        // Circular dependency found
        const cycleStart = path.indexOf(currentId);
        const cycle = [...path.slice(cycleStart), currentId];
        
        cycles.push({
          cycle,
          detected_at: new Date(),
          severity: 'error',
          resolution_suggestion: 'Remove one of the dependencies in the cycle'
        });
        return;
      }

      if (visited.has(currentId)) {
        return;
      }

      visited.add(currentId);
      path.push(currentId);

      const node = this.dependencyGraph.get(currentId);
      if (node) {
        node.dependencies.forEach(depId => {
          dfs(depId);
        });
      }

      path.pop();
    };

    dfs(agentId);
    return cycles;
  }

  private resolveStartupOrder(agentId: string): string[] {
    // Topological sort for startup order
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (id: string): void => {
      if (visited.has(id)) return;
      
      visited.add(id);
      const node = this.dependencyGraph.get(id);
      if (node) {
        node.dependencies.forEach(depId => {
          visit(depId);
        });
      }
      order.push(id);
    };

    visit(agentId);
    return order;
  }

  private resolveShutdownOrder(): string[] {
    // Reverse of startup order
    const allAgents = Array.from(this.agents.keys());
    const order: string[] = [];
    
    // Get startup order for all agents and reverse it
    const startupOrders = allAgents.map(id => this.resolveStartupOrder(id));
    const flatOrder = [...new Set(startupOrders.flat())];
    
    return flatOrder.reverse();
  }

  private async performAgentStart(agent: LifecycleAgent): Promise<void> {
    agent.lifecycle.state = LifecycleState.STARTING;
    this.emitLifecycleEvent('agentStarting', agent.id, {});

    try {
      // Simulate agent startup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      agent.lifecycle.state = LifecycleState.RUNNING;
      agent.lifecycle.startedAt = new Date();
      agent.lifecycle.healthStatus = HealthStatus.HEALTHY;
      
      this.emitLifecycleEvent('agentStarted', agent.id, {});
    } catch (error) {
      agent.lifecycle.state = LifecycleState.FAILED;
      throw error;
    }
  }

  private async performGracefulShutdown(agent: LifecycleAgent): Promise<void> {
    // Perform graceful shutdown tasks
    await Promise.race([
      this.executeShutdownTasks(agent),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Graceful shutdown timeout')), 
        agent.lifecycle.gracefulShutdownTimeout)
      )
    ]);
  }

  private async performForceStop(agent: LifecycleAgent): Promise<void> {
    // Force stop the agent
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async executeShutdownTasks(agent: LifecycleAgent): Promise<void> {
    // Execute cleanup tasks
    for (const task of this.config.shutdown.cleanup_tasks) {
      try {
        await this.executeCleanupTask(agent.id, task);
      } catch (error) {
        console.warn(`Cleanup task ${task} failed for agent ${agent.id}:`, error);
      }
    }
  }

  private async executeCleanupTask(agentId: string, task: string): Promise<void> {
    // Simulate cleanup task execution
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async ensureAgentRunning(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Dependency agent ${agentId} not found`);
    }

    if (agent.lifecycle.state !== LifecycleState.RUNNING) {
      await this.startAgent(agentId);
    }
  }

  private performSystemHealthCheck(): void {
    // Perform system-wide health checks
    const systemHealth = this.getSystemHealth();
    if (systemHealth.overall === HealthStatus.CRITICAL) {
      this.emitLifecycleEvent('systemHealthCritical', 'system', { health: systemHealth });
    }
  }

  private cleanupFailedOperations(): void {
    // Clean up failed swap operations
    for (const [id, operation] of this.swapOperations) {
      const elapsed = Date.now() - operation.startedAt.getTime();
      if (elapsed > 300000) { // 5 minutes
        this.swapOperations.delete(id);
      }
    }
  }

  private detectAndHandleFailures(): void {
    // Detect and handle various types of failures
    for (const [agentId, agent] of this.agents) {
      if (agent.lifecycle.state === LifecycleState.RUNNING) {
        const timeSinceHeartbeat = Date.now() - agent.lastHeartbeat.getTime();
        if (timeSinceHeartbeat > this.config.heartbeat.timeout) {
          this.handleHeartbeatFailure(agentId, new Error('Heartbeat timeout'));
        }
      }
    }
  }

  private checkDependencyHealth(): void {
    // Check if dependencies are healthy
    for (const [agentId, agent] of this.agents) {
      const node = this.dependencyGraph.get(agentId);
      if (node) {
        for (const depId of node.dependencies) {
          const depAgent = this.agents.get(depId);
          if (depAgent && depAgent.lifecycle.healthStatus === HealthStatus.UNHEALTHY) {
            this.emitLifecycleEvent('dependencyUnhealthy', agentId, { dependencyId: depId });
          }
        }
      }
    }
  }

  private revalidateCircularDependencies(): void {
    // Revalidate circular dependencies in case they were resolved
    this.circularDependencies = this.circularDependencies.filter(cd => {
      // Check if cycle still exists
      return this.detectCircularDependencies(cd.cycle[0]).length > 0;
    });
  }

  private stopAllMonitoring(): void {
    // Stop all monitoring intervals
    for (const [agentId, interval] of this.heartbeatIntervals) {
      clearInterval(interval);
    }
    this.heartbeatIntervals.clear();

    for (const [agentId, interval] of this.healthCheckIntervals) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();
  }

  private emitLifecycleEvent(type: string, agentId: string, data: any): void {
    const event: LifecycleEvent = {
      type,
      agentId,
      timestamp: new Date(),
      data,
      metadata: {
        source: 'lifecycle-manager',
        severity: this.getEventSeverity(type),
        category: 'lifecycle'
      }
    };

    this.emit(type, event);
    this.emit('lifecycleEvent', event);
  }

  private getEventSeverity(type: string): 'info' | 'warning' | 'error' | 'critical' {
    if (type.includes('Failed') || type.includes('Critical')) return 'critical';
    if (type.includes('Error') || type.includes('Unhealthy')) return 'error';
    if (type.includes('Warning') || type.includes('Degraded')) return 'warning';
    return 'info';
  }

  // Hot swap implementation methods
  private async prepareHotSwap(operation: HotSwapOperation): Promise<void> {
    operation.stages.preparation.startedAt = new Date();
    // Prepare for hot swap - validate new config, prepare new instance, etc.
    await new Promise(resolve => setTimeout(resolve, 1000));
    operation.stages.preparation.completed = true;
    operation.stages.preparation.completedAt = new Date();
  }

  private async validateHotSwap(operation: HotSwapOperation): Promise<void> {
    operation.stages.validation.startedAt = new Date();
    // Validate compatibility and requirements
    await new Promise(resolve => setTimeout(resolve, 500));
    operation.stages.validation.completed = true;
    operation.stages.validation.completedAt = new Date();
  }

  private async performHotSwap(operation: HotSwapOperation): Promise<void> {
    operation.stages.swap.startedAt = new Date();
    // Perform the actual swap
    await new Promise(resolve => setTimeout(resolve, 2000));
    operation.stages.swap.completed = true;
    operation.stages.swap.completedAt = new Date();
  }

  private async verifyHotSwap(operation: HotSwapOperation): Promise<void> {
    operation.stages.verification.startedAt = new Date();
    // Verify the swap was successful
    await new Promise(resolve => setTimeout(resolve, 1000));
    operation.stages.verification.completed = true;
    operation.stages.verification.completedAt = new Date();
  }

  private async rollbackHotSwap(operation: HotSwapOperation): Promise<void> {
    // Rollback to original configuration
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

interface HotSwapOperation {
  id: string;
  agentId: string;
  originalConfig: any;
  newConfig: any;
  state: 'preparing' | 'validating' | 'swapping' | 'verifying' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  stages: {
    preparation: { completed: boolean; startedAt?: Date; completedAt?: Date };
    validation: { completed: boolean; startedAt?: Date; completedAt?: Date };
    swap: { completed: boolean; startedAt?: Date; completedAt?: Date };
    verification: { completed: boolean; startedAt?: Date; completedAt?: Date };
  };
}

export default LifecycleManager;