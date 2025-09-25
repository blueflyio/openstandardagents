/**
 * OSSA v0.1.9 Agent Orchestration Performance Optimizer
 * High-performance event bus optimizations for 100+ agent orchestration
 */

import { RedisEventBus } from './RedisEventBus.js';
import { ServiceRegistry } from '../ServiceRegistry.js';
import {
  EventPayload,
  EVENT_TYPES,
  AgentOrchestrationEvent,
  PerformanceMetricsEvent,
  AgentSpawnedEvent,
  TaskAssignedEvent
} from './types.js';

export interface AgentPool {
  /** Pool identifier */
  id: string;
  /** Available agents in the pool */
  availableAgents: Agent[];
  /** Busy agents in the pool */
  busyAgents: Agent[];
  /** Pool capacity */
  capacity: number;
  /** Pool performance metrics */
  metrics: PoolMetrics;
}

export interface Agent {
  /** Agent identifier */
  id: string;
  /** Agent type */
  type: string;
  /** Agent capabilities */
  capabilities: string[];
  /** Current status */
  status: 'idle' | 'busy' | 'failed' | 'terminated';
  /** Performance metrics */
  performance: AgentPerformance;
  /** Resource usage */
  resources: ResourceUsage;
  /** Last activity timestamp */
  lastActivity: Date;
}

export interface AgentPerformance {
  /** Average task completion time */
  avgCompletionTime: number;
  /** Success rate percentage */
  successRate: number;
  /** Total tasks completed */
  tasksCompleted: number;
  /** Current load factor (0-1) */
  loadFactor: number;
  /** Throughput (tasks per minute) */
  throughput: number;
}

export interface ResourceUsage {
  /** CPU usage percentage */
  cpu: number;
  /** Memory usage in MB */
  memory: number;
  /** Network I/O in bytes/sec */
  networkIO: number;
  /** Disk I/O in bytes/sec */
  diskIO: number;
}

export interface PoolMetrics {
  /** Total pool utilization */
  utilization: number;
  /** Average response time */
  avgResponseTime: number;
  /** Queue depth */
  queueDepth: number;
  /** Throughput (agents/sec) */
  throughput: number;
  /** Error rate */
  errorRate: number;
}

export interface TaskDistributionStrategy {
  /** Strategy name */
  name: 'round-robin' | 'least-loaded' | 'capability-based' | 'performance-weighted' | 'predictive';
  /** Strategy parameters */
  parameters: Record<string, any>;
}

export interface LoadBalancingConfig {
  /** Maximum agents per pool */
  maxAgentsPerPool: number;
  /** Minimum agents per pool */
  minAgentsPerPool: number;
  /** Auto-scaling thresholds */
  autoScaling: {
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    cooldownPeriod: number;
  };
  /** Task distribution strategy */
  distributionStrategy: TaskDistributionStrategy;
  /** Circuit breaker configuration */
  circuitBreaker: {
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod: number;
  };
}

export class AgentOrchestrationOptimizer {
  private eventBus: RedisEventBus;
  private serviceRegistry: ServiceRegistry;
  private config: LoadBalancingConfig;

  private agentPools = new Map<string, AgentPool>();
  private agents = new Map<string, Agent>();
  private taskQueue = new Map<string, QueuedTask[]>();
  private performanceHistory = new Map<string, PerformanceDataPoint[]>();

  private metricsInterval: NodeJS.Timeout | null = null;
  private optimizationInterval: NodeJS.Timeout | null = null;

  constructor(
    eventBus: RedisEventBus,
    serviceRegistry: ServiceRegistry,
    config: Partial<LoadBalancingConfig> = {}
  ) {
    this.eventBus = eventBus;
    this.serviceRegistry = serviceRegistry;
    this.config = {
      maxAgentsPerPool: 50,
      minAgentsPerPool: 2,
      autoScaling: {
        scaleUpThreshold: 0.8,
        scaleDownThreshold: 0.3,
        cooldownPeriod: 60000
      },
      distributionStrategy: {
        name: 'performance-weighted',
        parameters: {}
      },
      circuitBreaker: {
        failureThreshold: 0.5,
        resetTimeout: 30000,
        monitoringPeriod: 10000
      },
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize the orchestration optimizer
   */
  private async initialize(): Promise<void> {
    // Setup event handlers for agent lifecycle events
    await this.setupAgentLifecycleHandlers();

    // Setup task coordination handlers
    await this.setupTaskCoordinationHandlers();

    // Setup performance monitoring
    await this.setupPerformanceMonitoring();

    // Start optimization processes
    this.startPerformanceOptimization();

    console.log('✅ Agent Orchestration Optimizer initialized');
  }

  /**
   * Setup handlers for agent lifecycle events
   */
  private async setupAgentLifecycleHandlers(): Promise<void> {
    // Agent spawned - add to pool
    await this.eventBus.subscribe(
      EVENT_TYPES.AGENT.SPAWNED,
      async (payload: EventPayload<AgentSpawnedEvent>) => {
        await this.handleAgentSpawned(payload.data);
      },
      { group: 'orchestration-optimizer' }
    );

    // Agent started - mark as available
    await this.eventBus.subscribe(
      EVENT_TYPES.AGENT.STARTED,
      async (payload: EventPayload) => {
        await this.handleAgentStarted(payload.data);
      },
      { group: 'orchestration-optimizer' }
    );

    // Agent failed - remove from pool and handle recovery
    await this.eventBus.subscribe(
      EVENT_TYPES.AGENT.FAILED,
      async (payload: EventPayload) => {
        await this.handleAgentFailed(payload.data);
      },
      { group: 'orchestration-optimizer' }
    );

    // Agent terminated - cleanup resources
    await this.eventBus.subscribe(
      EVENT_TYPES.AGENT.TERMINATED,
      async (payload: EventPayload) => {
        await this.handleAgentTerminated(payload.data);
      },
      { group: 'orchestration-optimizer' }
    );
  }

  /**
   * Setup handlers for task coordination events
   */
  private async setupTaskCoordinationHandlers(): Promise<void> {
    // Task assigned - track task distribution
    await this.eventBus.subscribe(
      EVENT_TYPES.TASK.ASSIGNED,
      async (payload: EventPayload<TaskAssignedEvent>) => {
        await this.handleTaskAssigned(payload.data);
      },
      { group: 'orchestration-optimizer' }
    );

    // Task completed - update agent performance metrics
    await this.eventBus.subscribe(
      EVENT_TYPES.TASK.COMPLETED,
      async (payload: EventPayload) => {
        await this.handleTaskCompleted(payload.data);
      },
      { group: 'orchestration-optimizer' }
    );

    // Task failed - implement failure recovery
    await this.eventBus.subscribe(
      EVENT_TYPES.TASK.FAILED,
      async (payload: EventPayload) => {
        await this.handleTaskFailed(payload.data);
      },
      { group: 'orchestration-optimizer' }
    );
  }

  /**
   * Setup performance monitoring for agents and pools
   */
  private async setupPerformanceMonitoring(): Promise<void> {
    await this.eventBus.subscribe(
      EVENT_TYPES.PERFORMANCE.METRICS,
      async (payload: EventPayload<PerformanceMetricsEvent>) => {
        await this.handlePerformanceMetrics(payload.data);
      },
      { group: 'performance-monitoring' }
    );

    // Start metrics collection
    this.metricsInterval = setInterval(async () => {
      await this.collectPerformanceMetrics();
    }, 10000); // Collect every 10 seconds
  }

  /**
   * Handle agent spawned event
   */
  private async handleAgentSpawned(event: AgentSpawnedEvent): Promise<void> {
    try {
      const agent: Agent = {
        id: event.agentId,
        type: event.agentType,
        capabilities: event.capabilities,
        status: 'idle',
        performance: {
          avgCompletionTime: 0,
          successRate: 1.0,
          tasksCompleted: 0,
          loadFactor: 0,
          throughput: 0
        },
        resources: {
          cpu: 0,
          memory: 0,
          networkIO: 0,
          diskIO: 0
        },
        lastActivity: new Date()
      };

      this.agents.set(event.agentId, agent);
      await this.addAgentToOptimalPool(agent);

      // Trigger pool optimization
      await this.optimizePoolDistribution();

    } catch (error) {
      console.error('Error handling agent spawned:', error);
    }
  }

  /**
   * Add agent to the most optimal pool based on current load
   */
  private async addAgentToOptimalPool(agent: Agent): Promise<void> {
    const poolId = this.selectOptimalPool(agent.type, agent.capabilities);
    let pool = this.agentPools.get(poolId);

    if (!pool) {
      pool = this.createAgentPool(poolId, agent.type);
      this.agentPools.set(poolId, pool);
    }

    pool.availableAgents.push(agent);
    await this.updatePoolMetrics(poolId);
  }

  /**
   * Select optimal pool for agent based on load balancing strategy
   */
  private selectOptimalPool(agentType: string, capabilities: string[]): string {
    const candidatePools = Array.from(this.agentPools.entries())
      .filter(([_, pool]) => pool.availableAgents.length + pool.busyAgents.length < this.config.maxAgentsPerPool)
      .sort((a, b) => a[1].metrics.utilization - b[1].metrics.utilization);

    if (candidatePools.length > 0) {
      return candidatePools[0][0];
    }

    // Create new pool if no suitable pool found
    return `${agentType}-pool-${Date.now()}`;
  }

  /**
   * Create new agent pool
   */
  private createAgentPool(poolId: string, agentType: string): AgentPool {
    return {
      id: poolId,
      availableAgents: [],
      busyAgents: [],
      capacity: this.config.maxAgentsPerPool,
      metrics: {
        utilization: 0,
        avgResponseTime: 0,
        queueDepth: 0,
        throughput: 0,
        errorRate: 0
      }
    };
  }

  /**
   * Implement intelligent task distribution
   */
  async distributeTask(task: QueuedTask): Promise<string | null> {
    try {
      const suitableAgent = await this.selectBestAgent(task);

      if (!suitableAgent) {
        // Queue task for later processing
        await this.queueTask(task);
        return null;
      }

      // Assign task to agent
      await this.assignTaskToAgent(task, suitableAgent);
      return suitableAgent.id;

    } catch (error) {
      console.error('Error distributing task:', error);
      throw error;
    }
  }

  /**
   * Select best agent for task based on distribution strategy
   */
  private async selectBestAgent(task: QueuedTask): Promise<Agent | null> {
    const strategy = this.config.distributionStrategy;

    switch (strategy.name) {
      case 'performance-weighted':
        return this.selectByPerformanceWeight(task);

      case 'least-loaded':
        return this.selectLeastLoaded(task);

      case 'capability-based':
        return this.selectByCapabilities(task);

      case 'predictive':
        return this.selectByPredictiveModel(task);

      default:
        return this.selectRoundRobin(task);
    }
  }

  /**
   * Performance-weighted agent selection
   */
  private selectByPerformanceWeight(task: QueuedTask): Agent | null {
    const candidateAgents = this.getAvailableAgents(task.requiredCapabilities);

    if (candidateAgents.length === 0) return null;

    // Calculate performance scores
    const scoredAgents = candidateAgents.map(agent => ({
      agent,
      score: this.calculatePerformanceScore(agent, task)
    }));

    // Sort by score (highest first)
    scoredAgents.sort((a, b) => b.score - a.score);

    return scoredAgents[0].agent;
  }

  /**
   * Calculate performance score for agent-task combination
   */
  private calculatePerformanceScore(agent: Agent, task: QueuedTask): number {
    const baseScore = agent.performance.successRate * 0.4 +
                     (1 - agent.performance.loadFactor) * 0.3 +
                     (agent.performance.throughput / 100) * 0.3;

    // Capability matching bonus
    const capabilityMatch = task.requiredCapabilities.filter(cap =>
      agent.capabilities.includes(cap)
    ).length / task.requiredCapabilities.length;

    return baseScore * (0.8 + capabilityMatch * 0.2);
  }

  /**
   * Get available agents with required capabilities
   */
  private getAvailableAgents(requiredCapabilities: string[]): Agent[] {
    return Array.from(this.agents.values())
      .filter(agent =>
        agent.status === 'idle' &&
        requiredCapabilities.every(cap => agent.capabilities.includes(cap))
      );
  }

  /**
   * Implement auto-scaling based on load
   */
  private async optimizePoolDistribution(): Promise<void> {
    for (const [poolId, pool] of this.agentPools) {
      const utilization = pool.metrics.utilization;

      // Scale up if utilization is high
      if (utilization > this.config.autoScaling.scaleUpThreshold) {
        await this.scaleUpPool(poolId);
      }

      // Scale down if utilization is low
      if (utilization < this.config.autoScaling.scaleDownThreshold) {
        await this.scaleDownPool(poolId);
      }
    }
  }

  /**
   * Scale up agent pool
   */
  private async scaleUpPool(poolId: string): Promise<void> {
    const pool = this.agentPools.get(poolId);
    if (!pool) return;

    const currentSize = pool.availableAgents.length + pool.busyAgents.length;
    if (currentSize >= this.config.maxAgentsPerPool) return;

    // Request new agent spawning
    await this.eventBus.publish(EVENT_TYPES.AGENT.SPAWNED, {
      poolId,
      requestedCapacity: Math.min(
        this.config.maxAgentsPerPool,
        currentSize + Math.ceil(currentSize * 0.2) // 20% increase
      )
    });

    console.log(`🔄 Scaling up pool ${poolId}: ${currentSize} agents`);
  }

  /**
   * Scale down agent pool
   */
  private async scaleDownPool(poolId: string): Promise<void> {
    const pool = this.agentPools.get(poolId);
    if (!pool) return;

    const currentSize = pool.availableAgents.length + pool.busyAgents.length;
    if (currentSize <= this.config.minAgentsPerPool) return;

    // Terminate idle agents
    const agentsToTerminate = Math.floor(currentSize * 0.1); // 10% reduction
    const idleAgents = pool.availableAgents.slice(0, agentsToTerminate);

    for (const agent of idleAgents) {
      await this.eventBus.publish(EVENT_TYPES.AGENT.TERMINATED, {
        agentId: agent.id,
        reason: 'scale_down'
      });

      pool.availableAgents = pool.availableAgents.filter(a => a.id !== agent.id);
      this.agents.delete(agent.id);
    }

    console.log(`🔄 Scaling down pool ${poolId}: removed ${agentsToTerminate} agents`);
  }

  /**
   * Collect performance metrics from all agents and pools
   */
  private async collectPerformanceMetrics(): Promise<void> {
    try {
      for (const [poolId, pool] of this.agentPools) {
        await this.updatePoolMetrics(poolId);
      }

      // Publish aggregated metrics
      const aggregatedMetrics = this.calculateAggregatedMetrics();
      await this.eventBus.publish(EVENT_TYPES.PERFORMANCE.METRICS, aggregatedMetrics);

    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
  }

  /**
   * Update metrics for a specific pool
   */
  private async updatePoolMetrics(poolId: string): Promise<void> {
    const pool = this.agentPools.get(poolId);
    if (!pool) return;

    const totalAgents = pool.availableAgents.length + pool.busyAgents.length;
    const busyAgents = pool.busyAgents.length;

    pool.metrics.utilization = totalAgents > 0 ? busyAgents / totalAgents : 0;

    // Calculate average response time from agent performance
    const responseTimes = pool.busyAgents.map(agent => agent.performance.avgCompletionTime);
    pool.metrics.avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Update queue depth
    const queuedTasks = this.taskQueue.get(poolId) || [];
    pool.metrics.queueDepth = queuedTasks.length;

    // Calculate throughput
    const completedTasks = [...pool.availableAgents, ...pool.busyAgents]
      .reduce((total, agent) => total + agent.performance.tasksCompleted, 0);
    pool.metrics.throughput = completedTasks / 60; // per minute

    // Calculate error rate
    const errorRate = [...pool.availableAgents, ...pool.busyAgents]
      .reduce((total, agent) => total + (1 - agent.performance.successRate), 0) / totalAgents;
    pool.metrics.errorRate = isNaN(errorRate) ? 0 : errorRate;
  }

  /**
   * Calculate aggregated metrics across all pools
   */
  private calculateAggregatedMetrics(): any {
    const pools = Array.from(this.agentPools.values());

    return {
      source: 'orchestration-optimizer',
      metrics: {
        totalAgents: Array.from(this.agents.values()).length,
        totalPools: pools.length,
        avgUtilization: pools.reduce((sum, pool) => sum + pool.metrics.utilization, 0) / pools.length,
        avgResponseTime: pools.reduce((sum, pool) => sum + pool.metrics.avgResponseTime, 0) / pools.length,
        totalQueueDepth: pools.reduce((sum, pool) => sum + pool.metrics.queueDepth, 0),
        totalThroughput: pools.reduce((sum, pool) => sum + pool.metrics.throughput, 0),
        avgErrorRate: pools.reduce((sum, pool) => sum + pool.metrics.errorRate, 0) / pools.length
      },
      timestamp: new Date()
    };
  }

  /**
   * Start performance optimization routines
   */
  private startPerformanceOptimization(): void {
    this.optimizationInterval = setInterval(async () => {
      try {
        await this.optimizePoolDistribution();
        await this.rebalanceAgents();
        await this.cleanupFailedAgents();
      } catch (error) {
        console.error('Performance optimization error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Rebalance agents across pools for optimal performance
   */
  private async rebalanceAgents(): Promise<void> {
    const overloadedPools = Array.from(this.agentPools.entries())
      .filter(([_, pool]) => pool.metrics.utilization > 0.9);

    const underloadedPools = Array.from(this.agentPools.entries())
      .filter(([_, pool]) => pool.metrics.utilization < 0.3);

    // Move agents from overloaded to underloaded pools
    for (const [overloadedId, overloadedPool] of overloadedPools) {
      for (const [underloadedId, underloadedPool] of underloadedPools) {
        if (overloadedPool.availableAgents.length > 0 &&
            underloadedPool.availableAgents.length < this.config.maxAgentsPerPool) {

          const agentToMove = overloadedPool.availableAgents.pop();
          if (agentToMove) {
            underloadedPool.availableAgents.push(agentToMove);

            console.log(`🔄 Rebalanced agent ${agentToMove.id} from ${overloadedId} to ${underloadedId}`);
            break;
          }
        }
      }
    }
  }

  /**
   * Cleanup failed agents and spawn replacements
   */
  private async cleanupFailedAgents(): Promise<void> {
    const failedAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === 'failed');

    for (const agent of failedAgents) {
      // Remove from pools
      for (const pool of this.agentPools.values()) {
        pool.availableAgents = pool.availableAgents.filter(a => a.id !== agent.id);
        pool.busyAgents = pool.busyAgents.filter(a => a.id !== agent.id);
      }

      // Remove from agents map
      this.agents.delete(agent.id);

      // Request replacement if needed
      await this.eventBus.publish(EVENT_TYPES.AGENT.SPAWNED, {
        agentType: agent.type,
        capabilities: agent.capabilities,
        reason: 'replacement',
        replacedAgent: agent.id
      });
    }
  }

  /**
   * Get orchestration performance statistics
   */
  getOrchestrationStats(): {
    totalAgents: number;
    totalPools: number;
    averageUtilization: number;
    totalThroughput: number;
    averageResponseTime: number;
    errorRate: number;
    queueDepth: number;
  } {
    const aggregatedMetrics = this.calculateAggregatedMetrics();
    return {
      totalAgents: aggregatedMetrics.metrics.totalAgents,
      totalPools: aggregatedMetrics.metrics.totalPools,
      averageUtilization: aggregatedMetrics.metrics.avgUtilization,
      totalThroughput: aggregatedMetrics.metrics.totalThroughput,
      averageResponseTime: aggregatedMetrics.metrics.avgResponseTime,
      errorRate: aggregatedMetrics.metrics.avgErrorRate,
      queueDepth: aggregatedMetrics.metrics.totalQueueDepth
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.optimizationInterval) clearInterval(this.optimizationInterval);

    console.log('✅ Agent Orchestration Optimizer cleaned up');
  }

  // Private helper methods (simplified implementations)

  private async handleAgentStarted(data: any): Promise<void> {
    const agent = this.agents.get(data.agentId);
    if (agent) {
      agent.status = 'idle';
      agent.lastActivity = new Date();
    }
  }

  private async handleAgentFailed(data: any): Promise<void> {
    const agent = this.agents.get(data.agentId);
    if (agent) {
      agent.status = 'failed';
    }
  }

  private async handleAgentTerminated(data: any): Promise<void> {
    this.agents.delete(data.agentId);
  }

  private async handleTaskAssigned(event: TaskAssignedEvent): Promise<void> {
    const agent = this.agents.get(event.agentId);
    if (agent) {
      agent.status = 'busy';
      agent.lastActivity = new Date();
    }
  }

  private async handleTaskCompleted(data: any): Promise<void> {
    const agent = this.agents.get(data.agentId);
    if (agent) {
      agent.status = 'idle';
      agent.performance.tasksCompleted++;
      agent.performance.successRate = Math.min(
        1.0,
        agent.performance.successRate + 0.01
      );
    }
  }

  private async handleTaskFailed(data: any): Promise<void> {
    const agent = this.agents.get(data.agentId);
    if (agent) {
      agent.status = 'idle';
      agent.performance.successRate = Math.max(
        0.0,
        agent.performance.successRate - 0.05
      );
    }
  }

  private async handlePerformanceMetrics(event: PerformanceMetricsEvent): Promise<void> {
    const agent = this.agents.get(event.source);
    if (agent) {
      // Map PerformanceMetricsEvent.metrics to ResourceUsage structure
      agent.resources = {
        cpu: event.metrics.cpu,
        memory: event.metrics.memory,
        networkIO: 0, // Default value since not provided in PerformanceMetricsEvent
        diskIO: 0     // Default value since not provided in PerformanceMetricsEvent
      };
      agent.performance.loadFactor = event.metrics.cpu / 100;
    }
  }

  private selectLeastLoaded(task: QueuedTask): Agent | null {
    const candidateAgents = this.getAvailableAgents(task.requiredCapabilities);
    return candidateAgents.sort((a, b) => a.performance.loadFactor - b.performance.loadFactor)[0] || null;
  }

  private selectByCapabilities(task: QueuedTask): Agent | null {
    return this.getAvailableAgents(task.requiredCapabilities)[0] || null;
  }

  private selectByPredictiveModel(task: QueuedTask): Agent | null {
    // Simplified predictive selection
    return this.selectByPerformanceWeight(task);
  }

  private selectRoundRobin(task: QueuedTask): Agent | null {
    const candidateAgents = this.getAvailableAgents(task.requiredCapabilities);
    return candidateAgents[Math.floor(Math.random() * candidateAgents.length)] || null;
  }

  private async queueTask(task: QueuedTask): Promise<void> {
    const poolId = 'default';
    const queue = this.taskQueue.get(poolId) || [];
    queue.push(task);
    this.taskQueue.set(poolId, queue);
  }

  private async assignTaskToAgent(task: QueuedTask, agent: Agent): Promise<void> {
    agent.status = 'busy';

    await this.eventBus.publish(EVENT_TYPES.TASK.ASSIGNED, {
      taskId: task.id,
      agentId: agent.id,
      taskType: task.type,
      priority: task.priority,
      estimatedDuration: task.estimatedDuration || 0,
      dependencies: task.dependencies || []
    });
  }
}

// Supporting interfaces
interface QueuedTask {
  id: string;
  type: string;
  priority: number;
  requiredCapabilities: string[];
  estimatedDuration?: number;
  dependencies?: string[];
}

interface PerformanceDataPoint {
  timestamp: Date;
  metrics: any;
}

export default AgentOrchestrationOptimizer;