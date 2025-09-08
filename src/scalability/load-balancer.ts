/**
 * OSSA Load Balancer with Health-Aware Routing
 * High-performance load balancing for 1000+ agents with circuit breakers
 */

import { EventEmitter } from 'events';
import { OSSAAgent } from '../router/types';

interface LoadBalancerConfig {
  algorithm: 'round_robin' | 'weighted_round_robin' | 'least_connections' | 'health_aware' | 'performance_based';
  healthCheckInterval: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  maxFailures: number;
  responseTimeThreshold: number;
  connectionPoolSize: number;
  retryAttempts: number;
  retryDelay: number;
}

interface AgentHealth {
  agentId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  successRate: number;
  activeConnections: number;
  lastCheck: Date;
  consecutiveFailures: number;
  totalRequests: number;
  errorRate: number;
}

interface CircuitBreaker {
  state: 'closed' | 'open' | 'half_open';
  failures: number;
  lastFailureTime: Date;
  nextAttemptTime: Date;
  successCount: number;
}

interface LoadBalancingDecision {
  selectedAgent: string;
  algorithm: string;
  healthScore: number;
  expectedResponseTime: number;
  confidence: number;
}

interface ConnectionPool {
  agentId: string;
  activeConnections: number;
  maxConnections: number;
  waitingQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timestamp: Date;
  }>;
}

export class LoadBalancer extends EventEmitter {
  private config: LoadBalancerConfig;
  private agents: Map<string, OSSAAgent> = new Map();
  private healthData: Map<string, AgentHealth> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private connectionPools: Map<string, ConnectionPool> = new Map();
  private roundRobinIndex = 0;
  private healthCheckTimer?: NodeJS.Timeout;
  private requestCounts: Map<string, number> = new Map();

  constructor(config: Partial<LoadBalancerConfig> = {}) {
    super();
    
    this.config = {
      algorithm: 'health_aware',
      healthCheckInterval: 30000, // 30 seconds
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000, // 1 minute
      maxFailures: 3,
      responseTimeThreshold: 1000, // 1 second
      connectionPoolSize: 100,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.startHealthChecking();
  }

  /**
   * Register an agent with the load balancer
   */
  registerAgent(agent: OSSAAgent): void {
    this.agents.set(agent.id, agent);
    
    // Initialize health data
    this.healthData.set(agent.id, {
      agentId: agent.id,
      status: agent.status,
      responseTime: agent.performance.avgResponseTimeMs,
      successRate: agent.performance.successRate,
      activeConnections: 0,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      totalRequests: agent.performance.requestsHandled,
      errorRate: 1 - agent.performance.successRate
    });

    // Initialize circuit breaker
    this.circuitBreakers.set(agent.id, {
      state: 'closed',
      failures: 0,
      lastFailureTime: new Date(0),
      nextAttemptTime: new Date(0),
      successCount: 0
    });

    // Initialize connection pool
    this.connectionPools.set(agent.id, {
      agentId: agent.id,
      activeConnections: 0,
      maxConnections: this.config.connectionPoolSize,
      waitingQueue: []
    });

    this.emit('agent_registered', { agentId: agent.id });
  }

  /**
   * Unregister an agent from the load balancer
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.healthData.delete(agentId);
    this.circuitBreakers.delete(agentId);
    
    // Close connection pool
    const pool = this.connectionPools.get(agentId);
    if (pool) {
      // Reject all waiting requests
      pool.waitingQueue.forEach(request => {
        request.reject(new Error('Agent unregistered'));
      });
      this.connectionPools.delete(agentId);
    }

    this.emit('agent_unregistered', { agentId });
  }

  /**
   * Select the best agent for a request based on configured algorithm
   */
  async selectAgent(requestContext?: {
    capabilities?: string[];
    domains?: string[];
    priority?: 'low' | 'normal' | 'high';
    timeout?: number;
  }): Promise<LoadBalancingDecision> {
    const availableAgents = this.getAvailableAgents();
    
    if (availableAgents.length === 0) {
      throw new Error('No healthy agents available');
    }

    let selectedAgent: string;
    let healthScore = 0;
    let expectedResponseTime = 0;
    let confidence = 1.0;

    switch (this.config.algorithm) {
      case 'round_robin':
        selectedAgent = this.selectRoundRobin(availableAgents);
        break;
      
      case 'weighted_round_robin':
        selectedAgent = this.selectWeightedRoundRobin(availableAgents);
        break;
      
      case 'least_connections':
        selectedAgent = this.selectLeastConnections(availableAgents);
        break;
      
      case 'health_aware':
        const healthDecision = this.selectHealthAware(availableAgents);
        selectedAgent = healthDecision.agent;
        healthScore = healthDecision.score;
        break;
      
      case 'performance_based':
        const perfDecision = this.selectPerformanceBased(availableAgents, requestContext);
        selectedAgent = perfDecision.agent;
        expectedResponseTime = perfDecision.expectedTime;
        confidence = perfDecision.confidence;
        break;
      
      default:
        selectedAgent = availableAgents[0];
    }

    // Update health score and expected response time if not set
    if (healthScore === 0) {
      healthScore = this.calculateHealthScore(selectedAgent);
    }
    if (expectedResponseTime === 0) {
      expectedResponseTime = this.healthData.get(selectedAgent)?.responseTime || 0;
    }

    // Record selection
    this.requestCounts.set(selectedAgent, (this.requestCounts.get(selectedAgent) || 0) + 1);

    return {
      selectedAgent,
      algorithm: this.config.algorithm,
      healthScore,
      expectedResponseTime,
      confidence
    };
  }

  /**
   * Execute a request with load balancing, retries, and circuit breaker protection
   */
  async executeRequest<T>(
    requestFn: (agentId: string) => Promise<T>,
    requestContext?: {
      capabilities?: string[];
      domains?: string[];
      priority?: 'low' | 'normal' | 'high';
      timeout?: number;
    }
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const decision = await this.selectAgent(requestContext);
        const agentId = decision.selectedAgent;

        // Check circuit breaker
        if (!this.canExecuteRequest(agentId)) {
          throw new Error(`Circuit breaker open for agent ${agentId}`);
        }

        // Get connection from pool
        const connection = await this.getConnection(agentId);
        
        try {
          const startTime = performance.now();
          const result = await requestFn(agentId);
          const responseTime = performance.now() - startTime;

          // Record success
          await this.recordSuccess(agentId, responseTime);
          
          return result;

        } finally {
          // Release connection back to pool
          this.releaseConnection(agentId);
        }

      } catch (error) {
        lastError = error as Error;
        
        // Record failure for the selected agent
        const decision = await this.selectAgent(requestContext);
        await this.recordFailure(decision.selectedAgent, lastError);

        // Wait before retry
        if (attempt < this.config.retryAttempts - 1) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Get load balancer statistics
   */
  getStatistics(): {
    totalAgents: number;
    healthyAgents: number;
    degradedAgents: number;
    unhealthyAgents: number;
    openCircuitBreakers: number;
    totalConnections: number;
    avgResponseTime: number;
    requestDistribution: Record<string, number>;
  } {
    const totalAgents = this.agents.size;
    let healthyAgents = 0;
    let degradedAgents = 0;
    let unhealthyAgents = 0;
    let openCircuitBreakers = 0;
    let totalConnections = 0;
    let totalResponseTime = 0;
    let totalRequests = 0;

    for (const [agentId, health] of this.healthData) {
      switch (health.status) {
        case 'healthy':
          healthyAgents++;
          break;
        case 'degraded':
          degradedAgents++;
          break;
        case 'unhealthy':
          unhealthyAgents++;
          break;
      }

      const circuitBreaker = this.circuitBreakers.get(agentId);
      if (circuitBreaker?.state === 'open') {
        openCircuitBreakers++;
      }

      totalConnections += health.activeConnections;
      totalResponseTime += health.responseTime * health.totalRequests;
      totalRequests += health.totalRequests;
    }

    const requestDistribution: Record<string, number> = {};
    for (const [agentId, count] of this.requestCounts) {
      const agent = this.agents.get(agentId);
      if (agent) {
        requestDistribution[agent.name] = count;
      }
    }

    return {
      totalAgents,
      healthyAgents,
      degradedAgents,
      unhealthyAgents,
      openCircuitBreakers,
      totalConnections,
      avgResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      requestDistribution
    };
  }

  /**
   * Get available agents (healthy and circuit breaker allows)
   */
  private getAvailableAgents(): string[] {
    const available: string[] = [];
    
    for (const [agentId, health] of this.healthData) {
      if (health.status !== 'unhealthy' && this.canExecuteRequest(agentId)) {
        available.push(agentId);
      }
    }
    
    return available;
  }

  /**
   * Round robin selection
   */
  private selectRoundRobin(agents: string[]): string {
    const selected = agents[this.roundRobinIndex % agents.length];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % agents.length;
    return selected;
  }

  /**
   * Weighted round robin selection based on agent performance
   */
  private selectWeightedRoundRobin(agents: string[]): string {
    const weights = agents.map(agentId => {
      const health = this.healthData.get(agentId);
      if (!health) return 1;
      
      // Higher weight for better performing agents
      return Math.max(0.1, health.successRate * (2000 - health.responseTime) / 2000);
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < agents.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return agents[i];
      }
    }
    
    return agents[agents.length - 1];
  }

  /**
   * Least connections selection
   */
  private selectLeastConnections(agents: string[]): string {
    let selected = agents[0];
    let minConnections = this.healthData.get(selected)?.activeConnections || 0;
    
    for (let i = 1; i < agents.length; i++) {
      const agentId = agents[i];
      const connections = this.healthData.get(agentId)?.activeConnections || 0;
      if (connections < minConnections) {
        minConnections = connections;
        selected = agentId;
      }
    }
    
    return selected;
  }

  /**
   * Health-aware selection
   */
  private selectHealthAware(agents: string[]): { agent: string; score: number } {
    let bestAgent = agents[0];
    let bestScore = this.calculateHealthScore(bestAgent);
    
    for (let i = 1; i < agents.length; i++) {
      const agentId = agents[i];
      const score = this.calculateHealthScore(agentId);
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agentId;
      }
    }
    
    return { agent: bestAgent, score: bestScore };
  }

  /**
   * Performance-based selection
   */
  private selectPerformanceBased(
    agents: string[], 
    context?: { priority?: 'low' | 'normal' | 'high'; timeout?: number }
  ): { agent: string; expectedTime: number; confidence: number } {
    const priorityWeight = context?.priority === 'high' ? 2.0 : 
                          context?.priority === 'low' ? 0.5 : 1.0;
    
    let bestAgent = agents[0];
    let bestScore = 0;
    let bestTime = 0;
    let bestConfidence = 0;

    for (const agentId of agents) {
      const health = this.healthData.get(agentId);
      if (!health) continue;

      const responseTimeScore = Math.max(0, 1 - health.responseTime / this.config.responseTimeThreshold);
      const successRateScore = health.successRate;
      const loadScore = Math.max(0, 1 - health.activeConnections / this.config.connectionPoolSize);
      
      const score = (responseTimeScore * 0.4 + successRateScore * 0.4 + loadScore * 0.2) * priorityWeight;
      const expectedTime = health.responseTime * (1 + health.activeConnections * 0.1);
      const confidence = Math.min(1, health.totalRequests / 100); // Confidence based on request history

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agentId;
        bestTime = expectedTime;
        bestConfidence = confidence;
      }
    }

    return { agent: bestAgent, expectedTime: bestTime, confidence: bestConfidence };
  }

  /**
   * Calculate composite health score for an agent
   */
  private calculateHealthScore(agentId: string): number {
    const health = this.healthData.get(agentId);
    if (!health) return 0;

    const responseTimeScore = Math.max(0, 1 - health.responseTime / this.config.responseTimeThreshold);
    const successRateScore = health.successRate;
    const loadScore = Math.max(0, 1 - health.activeConnections / this.config.connectionPoolSize);
    const upTimeScore = health.consecutiveFailures === 0 ? 1 : Math.max(0, 1 - health.consecutiveFailures / this.config.maxFailures);

    return (responseTimeScore * 0.3 + successRateScore * 0.3 + loadScore * 0.2 + upTimeScore * 0.2);
  }

  /**
   * Check if request can be executed (circuit breaker check)
   */
  private canExecuteRequest(agentId: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(agentId);
    if (!circuitBreaker) return true;

    const now = new Date();
    
    switch (circuitBreaker.state) {
      case 'closed':
        return true;
      
      case 'open':
        if (now >= circuitBreaker.nextAttemptTime) {
          // Move to half-open state
          circuitBreaker.state = 'half_open';
          circuitBreaker.successCount = 0;
          return true;
        }
        return false;
      
      case 'half_open':
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Get connection from pool
   */
  private async getConnection(agentId: string): Promise<void> {
    const pool = this.connectionPools.get(agentId);
    if (!pool) throw new Error(`No connection pool for agent ${agentId}`);

    if (pool.activeConnections < pool.maxConnections) {
      pool.activeConnections++;
      const health = this.healthData.get(agentId);
      if (health) {
        health.activeConnections = pool.activeConnections;
      }
      return;
    }

    // Wait in queue
    return new Promise((resolve, reject) => {
      pool.waitingQueue.push({
        resolve,
        reject,
        timestamp: new Date()
      });
      
      // Set timeout for waiting
      setTimeout(() => {
        const index = pool.waitingQueue.findIndex(req => req.resolve === resolve);
        if (index >= 0) {
          pool.waitingQueue.splice(index, 1);
          reject(new Error('Connection timeout'));
        }
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Release connection back to pool
   */
  private releaseConnection(agentId: string): void {
    const pool = this.connectionPools.get(agentId);
    if (!pool) return;

    pool.activeConnections--;
    const health = this.healthData.get(agentId);
    if (health) {
      health.activeConnections = pool.activeConnections;
    }

    // Process waiting queue
    const waiting = pool.waitingQueue.shift();
    if (waiting) {
      pool.activeConnections++;
      if (health) {
        health.activeConnections = pool.activeConnections;
      }
      waiting.resolve(undefined);
    }
  }

  /**
   * Record successful request
   */
  private async recordSuccess(agentId: string, responseTime: number): Promise<void> {
    const health = this.healthData.get(agentId);
    const circuitBreaker = this.circuitBreakers.get(agentId);
    
    if (health) {
      health.totalRequests++;
      health.consecutiveFailures = 0;
      health.responseTime = (health.responseTime * 0.9) + (responseTime * 0.1); // Exponential moving average
      health.successRate = Math.min(1, (health.successRate * 0.95) + 0.05); // Slight increase
      health.lastCheck = new Date();
      
      // Update status based on performance
      if (health.responseTime < this.config.responseTimeThreshold * 0.5 && health.successRate > 0.95) {
        health.status = 'healthy';
      } else if (health.responseTime < this.config.responseTimeThreshold && health.successRate > 0.8) {
        health.status = 'degraded';
      }
    }

    if (circuitBreaker) {
      if (circuitBreaker.state === 'half_open') {
        circuitBreaker.successCount++;
        if (circuitBreaker.successCount >= 3) {
          circuitBreaker.state = 'closed';
          circuitBreaker.failures = 0;
        }
      } else if (circuitBreaker.state === 'closed') {
        circuitBreaker.failures = Math.max(0, circuitBreaker.failures - 1);
      }
    }

    this.emit('request_success', { agentId, responseTime });
  }

  /**
   * Record failed request
   */
  private async recordFailure(agentId: string, error: Error): Promise<void> {
    const health = this.healthData.get(agentId);
    const circuitBreaker = this.circuitBreakers.get(agentId);
    
    if (health) {
      health.totalRequests++;
      health.consecutiveFailures++;
      health.successRate = Math.max(0, health.successRate * 0.9); // Decrease success rate
      health.errorRate = 1 - health.successRate;
      health.lastCheck = new Date();
      
      // Update status based on failures
      if (health.consecutiveFailures >= this.config.maxFailures) {
        health.status = 'unhealthy';
      } else if (health.consecutiveFailures > 1 || health.successRate < 0.8) {
        health.status = 'degraded';
      }
    }

    if (circuitBreaker) {
      circuitBreaker.failures++;
      circuitBreaker.lastFailureTime = new Date();
      
      if (circuitBreaker.state === 'half_open') {
        // Return to open state
        circuitBreaker.state = 'open';
        circuitBreaker.nextAttemptTime = new Date(Date.now() + this.config.circuitBreakerTimeout);
      } else if (circuitBreaker.failures >= this.config.circuitBreakerThreshold) {
        circuitBreaker.state = 'open';
        circuitBreaker.nextAttemptTime = new Date(Date.now() + this.config.circuitBreakerTimeout);
        this.emit('circuit_breaker_opened', { agentId });
      }
    }

    this.emit('request_failure', { agentId, error: error.message });
  }

  /**
   * Start periodic health checking
   */
  private startHealthChecking(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks().catch(error => {
        this.emit('health_check_error', { error });
      });
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on all agents
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.agents.keys()).map(agentId =>
      this.performSingleHealthCheck(agentId)
    );

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Perform health check on single agent
   */
  private async performSingleHealthCheck(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    const health = this.healthData.get(agentId);
    
    if (!agent || !health) return;

    try {
      const startTime = performance.now();
      
      // Simple health check - this would normally make an HTTP request to agent's health endpoint
      // For now, we simulate based on current health data
      const isHealthy = Math.random() > health.errorRate * 0.1; // Simulate health check
      
      const responseTime = performance.now() - startTime;
      
      if (isHealthy) {
        health.consecutiveFailures = Math.max(0, health.consecutiveFailures - 1);
        health.responseTime = (health.responseTime * 0.9) + (responseTime * 0.1);
        
        if (health.status === 'unhealthy' && health.consecutiveFailures === 0) {
          health.status = 'degraded';
        } else if (health.status === 'degraded' && health.responseTime < this.config.responseTimeThreshold * 0.7) {
          health.status = 'healthy';
        }
      } else {
        health.consecutiveFailures++;
        if (health.consecutiveFailures >= this.config.maxFailures) {
          health.status = 'unhealthy';
        } else {
          health.status = 'degraded';
        }
      }
      
      health.lastCheck = new Date();
      this.emit('health_check_completed', { agentId, status: health.status, responseTime });
      
    } catch (error) {
      health.consecutiveFailures++;
      health.status = 'unhealthy';
      health.lastCheck = new Date();
      this.emit('health_check_failed', { agentId, error });
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Stop the load balancer and cleanup resources
   */
  stop(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    // Reject all waiting connections
    for (const [, pool] of this.connectionPools) {
      pool.waitingQueue.forEach(request => {
        request.reject(new Error('Load balancer stopped'));
      });
    }

    this.emit('stopped');
  }
}