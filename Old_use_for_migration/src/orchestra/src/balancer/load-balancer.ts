/**
 * OSSA Orchestra v0.1.8 - Intelligent Load Balancer
 * Advanced load balancing with health checks, circuit breakers, and performance-aware routing
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import {
  AgentDefinition,
  LoadBalancerConfig,
  LoadBalancingStrategy,
  CircuitBreakerConfig,
  RetryPolicy,
  PerformanceMetrics
} from '../core/types';

export class LoadBalancer extends EventEmitter {
  private logger: Logger;
  private config: LoadBalancerConfig;
  private agents: Map<string, AgentNode> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private isInitialized = false;

  private readonly DEFAULT_CONFIG: LoadBalancerConfig = {
    strategy: {
      type: 'performance',
      healthCheck: true,
      stickiness: 'none'
    },
    healthCheckInterval: 30000, // 30 seconds
    failoverTimeout: 5000, // 5 seconds
    retryPolicy: {
      maxAttempts: 3,
      backoffType: 'exponential',
      baseDelay: 1000,
      maxDelay: 10000,
      retryOn: ['error', 'timeout']
    },
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      recoveryTimeout: 30000,
      halfOpenRequestsLimit: 3
    }
  };

  constructor(config?: LoadBalancerConfig) {
    super();
    this.logger = new Logger('LoadBalancer');
    this.config = config || this.DEFAULT_CONFIG;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.info('Initializing Intelligent Load Balancer');
    
    // Start health checking
    this.startHealthChecking();
    
    // Start metrics collection
    this.startMetricsCollection();
    
    this.isInitialized = true;
    this.logger.info('Intelligent Load Balancer initialized');
  }

  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    this.agents.clear();
    this.circuitBreakers.clear();
    
    this.isInitialized = false;
    this.logger.info('Load Balancer shutdown complete');
  }

  async configure(config: LoadBalancerConfig): Promise<void> {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.logger.info('Load Balancer configuration updated');
    
    // Restart health checking with new interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.startHealthChecking();
    }
  }

  async addAgent(agent: AgentDefinition): Promise<void> {
    this.ensureInitialized();
    
    const agentNode: AgentNode = {
      agent,
      health: {
        status: 'unknown',
        lastCheck: new Date(),
        consecutiveFailures: 0,
        responseTime: 0
      },
      connections: {
        active: 0,
        total: 0,
        successful: 0,
        failed: 0
      },
      performance: {
        avgResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        cpuUsage: 0,
        memoryUsage: 0
      },
      weight: 1.0
    };

    this.agents.set(agent.id, agentNode);
    
    // Initialize circuit breaker if enabled
    if (this.config.circuitBreaker.enabled) {
      this.circuitBreakers.set(agent.id, new CircuitBreaker(
        agent.id,
        this.config.circuitBreaker,
        this.logger
      ));
    }

    // Perform initial health check
    await this.performHealthCheck(agentNode);
    
    this.logger.info(`Added agent to load balancer: ${agent.id}`);
    this.emit('agent-added', agent.id);
  }

  async removeAgent(agentId: string): Promise<void> {
    this.ensureInitialized();
    
    if (this.agents.delete(agentId)) {
      this.circuitBreakers.delete(agentId);
      this.logger.info(`Removed agent from load balancer: ${agentId}`);
      this.emit('agent-removed', agentId);
    }
  }

  async selectAgent(requestContext?: any): Promise<string | null> {
    this.ensureInitialized();
    
    const availableAgents = this.getAvailableAgents();
    
    if (availableAgents.length === 0) {
      this.logger.warn('No available agents for load balancing');
      return null;
    }

    let selectedAgent: string;

    switch (this.config.strategy.type) {
      case 'round_robin':
        selectedAgent = this.selectRoundRobin(availableAgents);
        break;
      case 'least_connections':
        selectedAgent = this.selectLeastConnections(availableAgents);
        break;
      case 'weighted':
        selectedAgent = this.selectWeighted(availableAgents);
        break;
      case 'performance':
        selectedAgent = this.selectPerformanceBased(availableAgents);
        break;
      case 'resource_aware':
        selectedAgent = this.selectResourceAware(availableAgents);
        break;
      case 'custom':
        selectedAgent = this.selectCustom(availableAgents, requestContext);
        break;
      default:
        selectedAgent = this.selectRoundRobin(availableAgents);
    }

    // Update connection count
    const agentNode = this.agents.get(selectedAgent);
    if (agentNode) {
      agentNode.connections.active++;
      agentNode.connections.total++;
    }

    this.logger.debug(`Selected agent for request: ${selectedAgent}`);
    return selectedAgent;
  }

  async recordRequestResult(agentId: string, success: boolean, responseTime: number): Promise<void> {
    const agentNode = this.agents.get(agentId);
    if (!agentNode) {
      return;
    }

    // Update connection count
    agentNode.connections.active = Math.max(0, agentNode.connections.active - 1);
    
    // Update success/failure counts
    if (success) {
      agentNode.connections.successful++;
    } else {
      agentNode.connections.failed++;
    }

    // Update performance metrics
    this.updatePerformanceMetrics(agentNode, responseTime, success);

    // Update circuit breaker
    const circuitBreaker = this.circuitBreakers.get(agentId);
    if (circuitBreaker) {
      if (success) {
        circuitBreaker.recordSuccess();
      } else {
        circuitBreaker.recordFailure();
        
        if (circuitBreaker.isOpen()) {
          this.logger.warn(`Circuit breaker opened for agent: ${agentId}`);
          this.emit('circuit-breaker-opened', agentId);
        }
      }
    }
  }

  async getAgentStatus(agentId: string): Promise<AgentStatus | null> {
    const agentNode = this.agents.get(agentId);
    if (!agentNode) {
      return null;
    }

    const circuitBreaker = this.circuitBreakers.get(agentId);
    
    return {
      agentId,
      health: agentNode.health,
      connections: agentNode.connections,
      performance: agentNode.performance,
      weight: agentNode.weight,
      circuitBreakerState: circuitBreaker?.getState() || 'unknown'
    };
  }

  async getAllAgentStatus(): Promise<AgentStatus[]> {
    const statuses: AgentStatus[] = [];
    
    for (const [agentId] of this.agents) {
      const status = await this.getAgentStatus(agentId);
      if (status) {
        statuses.push(status);
      }
    }
    
    return statuses;
  }

  async getConfig(): Promise<LoadBalancerConfig> {
    return { ...this.config };
  }

  async getHealth(): Promise<{ overall: string; agents: number; healthy: number }> {
    const agents = Array.from(this.agents.values());
    const healthyAgents = agents.filter(agent => agent.health.status === 'healthy').length;
    
    return {
      overall: healthyAgents > 0 ? 'healthy' : 'unhealthy',
      agents: agents.length,
      healthy: healthyAgents
    };
  }

  private getAvailableAgents(): string[] {
    const available: string[] = [];
    
    for (const [agentId, agentNode] of this.agents) {
      // Check health status
      if (agentNode.health.status !== 'healthy') {
        continue;
      }
      
      // Check circuit breaker
      const circuitBreaker = this.circuitBreakers.get(agentId);
      if (circuitBreaker && circuitBreaker.isOpen()) {
        continue;
      }
      
      available.push(agentId);
    }
    
    return available;
  }

  private selectRoundRobin(agents: string[]): string {
    // Simple round-robin based on total connections
    const agentConnections = agents.map(agentId => {
      const agentNode = this.agents.get(agentId)!;
      return { agentId, connections: agentNode.connections.total };
    });
    
    agentConnections.sort((a, b) => a.connections - b.connections);
    return agentConnections[0].agentId;
  }

  private selectLeastConnections(agents: string[]): string {
    let minConnections = Infinity;
    let selectedAgent = agents[0];
    
    for (const agentId of agents) {
      const agentNode = this.agents.get(agentId)!;
      if (agentNode.connections.active < minConnections) {
        minConnections = agentNode.connections.active;
        selectedAgent = agentId;
      }
    }
    
    return selectedAgent;
  }

  private selectWeighted(agents: string[]): string {
    const weights = this.config.strategy.weights || {};
    let totalWeight = 0;
    
    // Calculate total weight
    for (const agentId of agents) {
      const agentNode = this.agents.get(agentId)!;
      const weight = weights[agentId] || agentNode.weight;
      totalWeight += weight;
    }
    
    // Random selection based on weights
    let random = Math.random() * totalWeight;
    
    for (const agentId of agents) {
      const agentNode = this.agents.get(agentId)!;
      const weight = weights[agentId] || agentNode.weight;
      random -= weight;
      
      if (random <= 0) {
        return agentId;
      }
    }
    
    return agents[0];
  }

  private selectPerformanceBased(agents: string[]): string {
    // Score agents based on response time and success rate
    const scores = agents.map(agentId => {
      const agentNode = this.agents.get(agentId)!;
      const successRate = agentNode.connections.total > 0 
        ? agentNode.connections.successful / agentNode.connections.total 
        : 1.0;
      
      // Lower response time and higher success rate = higher score
      const responseTimeScore = 1000 / Math.max(agentNode.performance.avgResponseTime, 1);
      const successRateScore = successRate * 100;
      
      return {
        agentId,
        score: responseTimeScore + successRateScore
      };
    });
    
    scores.sort((a, b) => b.score - a.score);
    return scores[0].agentId;
  }

  private selectResourceAware(agents: string[]): string {
    // Select agent with best resource utilization
    let bestScore = -1;
    let selectedAgent = agents[0];
    
    for (const agentId of agents) {
      const agentNode = this.agents.get(agentId)!;
      
      // Lower resource usage = higher score
      const cpuScore = Math.max(0, 100 - agentNode.performance.cpuUsage);
      const memoryScore = Math.max(0, 100 - agentNode.performance.memoryUsage);
      const connectionScore = Math.max(0, 100 - (agentNode.connections.active * 10));
      
      const totalScore = (cpuScore + memoryScore + connectionScore) / 3;
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        selectedAgent = agentId;
      }
    }
    
    return selectedAgent;
  }

  private selectCustom(agents: string[], requestContext?: any): string {
    // Custom logic can be implemented here
    // For now, fallback to performance-based
    return this.selectPerformanceBased(agents);
  }

  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        this.logger.error('Error in health checking:', error);
      }
    }, this.config.healthCheckInterval);

    this.logger.info('Started health checking');
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        this.logger.error('Error in metrics collection:', error);
      }
    }, 60000); // Every minute

    this.logger.info('Started metrics collection');
  }

  private async performHealthChecks(): Promise<void> {
    const promises = Array.from(this.agents.values()).map(agentNode => 
      this.performHealthCheck(agentNode)
    );
    
    await Promise.allSettled(promises);
  }

  private async performHealthCheck(agentNode: AgentNode): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate health check request
      // In a real implementation, this would make HTTP requests to agent health endpoints
      const isHealthy = Math.random() > 0.1; // 90% success rate for simulation
      
      const responseTime = Date.now() - startTime;
      
      if (isHealthy) {
        agentNode.health.status = 'healthy';
        agentNode.health.consecutiveFailures = 0;
        agentNode.health.responseTime = responseTime;
      } else {
        agentNode.health.consecutiveFailures++;
        
        if (agentNode.health.consecutiveFailures >= 3) {
          agentNode.health.status = 'unhealthy';
          this.logger.warn(`Agent marked as unhealthy: ${agentNode.agent.id}`);
          this.emit('agent-failed', agentNode.agent.id);
        } else {
          agentNode.health.status = 'degraded';
        }
      }
    } catch (error) {
      agentNode.health.consecutiveFailures++;
      agentNode.health.status = agentNode.health.consecutiveFailures >= 3 ? 'unhealthy' : 'degraded';
      
      this.logger.error(`Health check failed for agent ${agentNode.agent.id}:`, error);
    }
    
    agentNode.health.lastCheck = new Date();
  }

  private async collectMetrics(): Promise<void> {
    for (const [agentId, agentNode] of this.agents) {
      // Collect performance metrics
      // In a real implementation, this would gather metrics from agents
      
      // Simulate metric collection
      agentNode.performance.cpuUsage = Math.random() * 100;
      agentNode.performance.memoryUsage = Math.random() * 100;
      agentNode.performance.errorRate = agentNode.connections.total > 0 
        ? (agentNode.connections.failed / agentNode.connections.total) * 100 
        : 0;
    }
  }

  private updatePerformanceMetrics(
    agentNode: AgentNode, 
    responseTime: number, 
    success: boolean
  ): void {
    // Update average response time using exponential moving average
    const alpha = 0.1;
    if (agentNode.performance.avgResponseTime === 0) {
      agentNode.performance.avgResponseTime = responseTime;
    } else {
      agentNode.performance.avgResponseTime = 
        alpha * responseTime + (1 - alpha) * agentNode.performance.avgResponseTime;
    }
    
    // Update error rate
    if (agentNode.connections.total > 0) {
      agentNode.performance.errorRate = 
        (agentNode.connections.failed / agentNode.connections.total) * 100;
    }
    
    // Adjust weight based on performance
    this.adjustAgentWeight(agentNode);
  }

  private adjustAgentWeight(agentNode: AgentNode): void {
    const baseWeight = 1.0;
    
    // Adjust based on response time (lower = better)
    const responseTimeFactor = Math.max(0.1, 1000 / Math.max(agentNode.performance.avgResponseTime, 100));
    
    // Adjust based on error rate (lower = better)  
    const errorRateFactor = Math.max(0.1, 1 - (agentNode.performance.errorRate / 100));
    
    // Adjust based on resource usage (lower = better)
    const resourceFactor = Math.max(0.1, 1 - (agentNode.performance.cpuUsage / 200));
    
    agentNode.weight = baseWeight * responseTimeFactor * errorRateFactor * resourceFactor;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('LoadBalancer not initialized. Call initialize() first.');
    }
  }
}

class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private halfOpenRequests = 0;

  constructor(
    private agentId: string,
    private config: CircuitBreakerConfig,
    private logger: Logger
  ) {}

  recordSuccess(): void {
    this.successCount++;
    
    if (this.state === 'half-open') {
      this.halfOpenRequests++;
      
      if (this.halfOpenRequests >= this.config.halfOpenRequestsLimit) {
        this.state = 'closed';
        this.failureCount = 0;
        this.halfOpenRequests = 0;
        this.logger.info(`Circuit breaker closed for agent: ${this.agentId}`);
      }
    } else if (this.state === 'closed') {
      this.failureCount = 0;
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'closed' && this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
      this.logger.warn(`Circuit breaker opened for agent: ${this.agentId}`);
    } else if (this.state === 'half-open') {
      this.state = 'open';
      this.halfOpenRequests = 0;
    }
  }

  isOpen(): boolean {
    if (this.state === 'open') {
      // Check if recovery timeout has passed
      if (Date.now() - this.lastFailureTime >= this.config.recoveryTimeout) {
        this.state = 'half-open';
        this.halfOpenRequests = 0;
        this.logger.info(`Circuit breaker half-open for agent: ${this.agentId}`);
        return false;
      }
      return true;
    }
    
    return false;
  }

  getState(): string {
    return this.state;
  }
}

interface AgentNode {
  agent: AgentDefinition;
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    lastCheck: Date;
    consecutiveFailures: number;
    responseTime: number;
  };
  connections: {
    active: number;
    total: number;
    successful: number;
    failed: number;
  };
  performance: {
    avgResponseTime: number;
    throughput: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  weight: number;
}

interface AgentStatus {
  agentId: string;
  health: AgentNode['health'];
  connections: AgentNode['connections'];
  performance: AgentNode['performance'];
  weight: number;
  circuitBreakerState: string;
}