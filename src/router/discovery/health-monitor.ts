/**
 * Agent Health Monitor
 * Continuous health checking with intelligent retry and circuit breaker patterns
 */

import { EventEmitter } from 'events';
import axios, { AxiosInstance } from 'axios';
import { OSSAAgent, HealthCheckResult } from '../types';

export interface HealthMonitorConfig {
  interval: number; // Health check interval in ms
  timeout: number;  // Request timeout in ms
  retryAttempts: number;
  circuitBreakerThreshold: number;
  batchSize: number;
}

export interface AgentHealthState {
  agent: OSSAAgent;
  consecutiveFailures: number;
  lastCheckTime: Date;
  lastSuccessTime: Date;
  circuitBreakerOpen: boolean;
  responseTimeHistory: number[];
}

export class HealthMonitor extends EventEmitter {
  private agents = new Map<string, AgentHealthState>();
  private httpClient: AxiosInstance;
  private config: HealthMonitorConfig;
  private checkInterval?: NodeJS.Timeout;
  private isRunning = false;
  private activeChecks = 0;
  private maxConcurrentChecks = 50;

  // Statistics
  private stats = {
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    avgResponseTime: 0,
    circuitBreakersOpen: 0,
  };

  constructor(config: Partial<HealthMonitorConfig> = {}) {
    super();
    
    this.config = {
      interval: 30000, // 30 seconds
      timeout: 5000,   // 5 seconds
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
      batchSize: 20,
      ...config,
    };

    this.httpClient = axios.create({
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'OSSA-HealthMonitor/0.1.8',
        'Accept': 'application/json',
      },
    });

    // Setup axios interceptors for monitoring
    this.setupHttpInterceptors();
  }

  /**
   * Start the health monitoring service
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startHealthCheckCycle();
    
    console.log(`💚 Health Monitor started (interval: ${this.config.interval}ms)`);
  }

  /**
   * Stop the health monitoring service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    // Wait for active checks to complete
    while (this.activeChecks > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isRunning = false;
    console.log('❤️  Health Monitor stopped');
  }

  /**
   * Add agent to health monitoring
   */
  addAgent(agent: OSSAAgent): void {
    const healthState: AgentHealthState = {
      agent,
      consecutiveFailures: 0,
      lastCheckTime: new Date(0), // Never checked
      lastSuccessTime: new Date(),
      circuitBreakerOpen: false,
      responseTimeHistory: [],
    };

    this.agents.set(agent.id, healthState);
    
    // Trigger immediate health check for new agent
    setImmediate(() => this.checkAgentHealth(agent));
    
    console.log(`💚 Added agent to health monitoring: ${agent.name} (${agent.id})`);
  }

  /**
   * Remove agent from health monitoring
   */
  removeAgent(agentId: string): void {
    if (this.agents.has(agentId)) {
      const agent = this.agents.get(agentId)!.agent;
      this.agents.delete(agentId);
      console.log(`❤️  Removed agent from health monitoring: ${agent.name} (${agentId})`);
    }
  }

  /**
   * Update agent information
   */
  updateAgent(agent: OSSAAgent): void {
    const healthState = this.agents.get(agent.id);
    if (healthState) {
      healthState.agent = agent;
      console.log(`💚 Updated agent in health monitoring: ${agent.name} (${agent.id})`);
    }
  }

  /**
   * Perform immediate health check on specific agent
   */
  async checkAgentHealth(agent: OSSAAgent): Promise<HealthCheckResult> {
    const startTime = performance.now();
    const healthState = this.agents.get(agent.id);
    
    if (healthState?.circuitBreakerOpen) {
      // Check if circuit breaker should be half-open
      const timeSinceLastCheck = Date.now() - healthState.lastCheckTime.getTime();
      if (timeSinceLastCheck < this.config.interval * 2) {
        return {
          agentId: agent.id,
          status: 'unhealthy',
          responseTime: 0,
          error: 'Circuit breaker open',
          timestamp: new Date(),
        };
      }
    }

    try {
      this.activeChecks++;
      this.stats.totalChecks++;

      const response = await this.httpClient.get(agent.endpoints.health, {
        timeout: this.config.timeout,
        validateStatus: (status) => status < 500, // 4xx is OK for health checks
      });

      const responseTime = performance.now() - startTime;
      const isHealthy = response.status >= 200 && response.status < 300;
      const status: 'healthy' | 'degraded' | 'unhealthy' = 
        isHealthy ? 'healthy' : 
        response.status < 500 ? 'degraded' : 'unhealthy';

      const result: HealthCheckResult = {
        agentId: agent.id,
        status,
        responseTime,
        timestamp: new Date(),
      };

      // Update agent health state
      if (healthState) {
        this.updateHealthState(healthState, result, true);
      }

      // Update agent status if it changed
      if (agent.status !== status) {
        agent.status = status;
        agent.lastSeen = new Date();
        
        this.emit('agent_health_changed', result);
      }

      this.stats.successfulChecks++;
      this.updateAverageResponseTime(responseTime);

      return result;

    } catch (error) {
      const responseTime = performance.now() - startTime;
      const result: HealthCheckResult = {
        agentId: agent.id,
        status: 'unhealthy',
        responseTime,
        error: this.extractErrorMessage(error),
        timestamp: new Date(),
      };

      // Update agent health state
      if (healthState) {
        this.updateHealthState(healthState, result, false);
      }

      // Update agent status
      if (agent.status !== 'unhealthy') {
        agent.status = 'unhealthy';
        agent.lastSeen = new Date();
        
        this.emit('agent_health_changed', result);
      }

      this.stats.failedChecks++;

      return result;

    } finally {
      this.activeChecks--;
    }
  }

  /**
   * Get health monitor statistics
   */
  getStatistics(): {
    totalAgents: number;
    healthyAgents: number;
    degradedAgents: number;
    unhealthyAgents: number;
    circuitBreakersOpen: number;
    totalChecks: number;
    successRate: number;
    avgResponseTime: number;
    checksPerMinute: number;
  } {
    const agentsByStatus = {
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
    };

    let circuitBreakersOpen = 0;

    for (const healthState of this.agents.values()) {
      agentsByStatus[healthState.agent.status]++;
      if (healthState.circuitBreakerOpen) {
        circuitBreakersOpen++;
      }
    }

    const successRate = this.stats.totalChecks > 0 
      ? this.stats.successfulChecks / this.stats.totalChecks 
      : 0;

    const checksPerMinute = this.agents.size > 0 
      ? (60000 / this.config.interval) * this.agents.size 
      : 0;

    return {
      totalAgents: this.agents.size,
      healthyAgents: agentsByStatus.healthy,
      degradedAgents: agentsByStatus.degraded,
      unhealthyAgents: agentsByStatus.unhealthy,
      circuitBreakersOpen,
      totalChecks: this.stats.totalChecks,
      successRate,
      avgResponseTime: this.stats.avgResponseTime,
      checksPerMinute,
    };
  }

  /**
   * Get health status of all agents
   */
  getAllAgentHealth(): Map<string, HealthCheckResult> {
    const healthResults = new Map<string, HealthCheckResult>();
    
    for (const [agentId, healthState] of this.agents) {
      healthResults.set(agentId, {
        agentId,
        status: healthState.agent.status,
        responseTime: this.getAverageResponseTime(healthState),
        timestamp: healthState.lastCheckTime,
        error: healthState.circuitBreakerOpen ? 'Circuit breaker open' : undefined,
      });
    }
    
    return healthResults;
  }

  /**
   * Check if health monitor is healthy
   */
  isHealthy(): boolean {
    const stats = this.getStatistics();
    return this.isRunning && 
           stats.successRate > 0.8 && // At least 80% success rate
           stats.circuitBreakersOpen < stats.totalAgents * 0.3; // Less than 30% circuit breakers open
  }

  /**
   * Force health check for all agents
   */
  async checkAllAgents(): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>();
    const agents = Array.from(this.agents.values());
    
    // Process in batches to avoid overwhelming
    for (let i = 0; i < agents.length; i += this.config.batchSize) {
      const batch = agents.slice(i, i + this.config.batchSize);
      const batchPromises = batch.map(healthState => 
        this.checkAgentHealth(healthState.agent)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const agentId = batch[index].agent.id;
        if (result.status === 'fulfilled') {
          results.set(agentId, result.value);
        } else {
          results.set(agentId, {
            agentId,
            status: 'unhealthy',
            responseTime: 0,
            error: result.reason?.message || 'Health check failed',
            timestamp: new Date(),
          });
        }
      });
      
      // Small delay between batches
      if (i + this.config.batchSize < agents.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  // Private methods

  private startHealthCheckCycle(): void {
    this.checkInterval = setInterval(async () => {
      if (this.agents.size === 0) return;
      
      try {
        await this.performHealthCheckCycle();
      } catch (error) {
        console.error('Health check cycle error:', error);
        this.emit('error', error);
      }
    }, this.config.interval);
  }

  private async performHealthCheckCycle(): Promise<void> {
    const agentArray = Array.from(this.agents.values());
    
    // Prioritize agents that haven't been checked recently or are unhealthy
    agentArray.sort((a, b) => {
      const aPriority = this.calculateCheckPriority(a);
      const bPriority = this.calculateCheckPriority(b);
      return bPriority - aPriority;
    });

    // Process in batches with concurrency control
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < agentArray.length; i += this.config.batchSize) {
      const batch = agentArray.slice(i, i + this.config.batchSize);
      
      const batchPromise = this.processBatch(batch);
      promises.push(batchPromise);
      
      // Add delay between batches if we're at concurrency limit
      if (this.activeChecks > this.maxConcurrentChecks - this.config.batchSize) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    await Promise.allSettled(promises);
  }

  private async processBatch(batch: AgentHealthState[]): Promise<void> {
    const promises = batch.map(async (healthState) => {
      // Skip if circuit breaker is open and not enough time has passed
      if (healthState.circuitBreakerOpen) {
        const timeSinceLastCheck = Date.now() - healthState.lastCheckTime.getTime();
        if (timeSinceLastCheck < this.config.interval * 2) {
          return;
        }
      }

      try {
        await this.checkAgentHealth(healthState.agent);
      } catch (error) {
        console.error(`Health check failed for ${healthState.agent.id}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  private calculateCheckPriority(healthState: AgentHealthState): number {
    const now = Date.now();
    const timeSinceLastCheck = now - healthState.lastCheckTime.getTime();
    const timeSinceLastSuccess = now - healthState.lastSuccessTime.getTime();
    
    let priority = 0;
    
    // Higher priority for agents not checked recently
    priority += Math.min(timeSinceLastCheck / this.config.interval, 2);
    
    // Higher priority for unhealthy agents
    if (healthState.agent.status !== 'healthy') {
      priority += 3;
    }
    
    // Higher priority for agents with circuit breaker open (to test recovery)
    if (healthState.circuitBreakerOpen) {
      priority += 2;
    }
    
    // Higher priority for agents that haven't succeeded in a while
    priority += Math.min(timeSinceLastSuccess / (this.config.interval * 10), 1);
    
    return priority;
  }

  private updateHealthState(
    healthState: AgentHealthState, 
    result: HealthCheckResult, 
    success: boolean
  ): void {
    healthState.lastCheckTime = result.timestamp;
    
    if (success) {
      healthState.consecutiveFailures = 0;
      healthState.lastSuccessTime = result.timestamp;
      healthState.circuitBreakerOpen = false;
    } else {
      healthState.consecutiveFailures++;
      
      // Open circuit breaker if threshold exceeded
      if (healthState.consecutiveFailures >= this.config.circuitBreakerThreshold) {
        if (!healthState.circuitBreakerOpen) {
          healthState.circuitBreakerOpen = true;
          this.stats.circuitBreakersOpen++;
          
          console.warn(`🔴 Circuit breaker opened for agent ${healthState.agent.id} after ${healthState.consecutiveFailures} failures`);
          
          this.emit('circuit_breaker_opened', {
            agentId: healthState.agent.id,
            consecutiveFailures: healthState.consecutiveFailures,
          });
        }
      }
    }

    // Update response time history
    healthState.responseTimeHistory.push(result.responseTime);
    if (healthState.responseTimeHistory.length > 10) {
      healthState.responseTimeHistory.shift();
    }
  }

  private getAverageResponseTime(healthState: AgentHealthState): number {
    if (healthState.responseTimeHistory.length === 0) return 0;
    
    const sum = healthState.responseTimeHistory.reduce((acc, time) => acc + time, 0);
    return sum / healthState.responseTimeHistory.length;
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalResponseTime = this.stats.avgResponseTime * this.stats.successfulChecks;
    this.stats.avgResponseTime = (totalResponseTime + responseTime) / (this.stats.successfulChecks + 1);
  }

  private extractErrorMessage(error: any): string {
    if (error.code) {
      switch (error.code) {
        case 'ECONNREFUSED':
          return 'Connection refused';
        case 'ETIMEDOUT':
          return 'Request timeout';
        case 'ENOTFOUND':
          return 'Host not found';
        case 'ECONNRESET':
          return 'Connection reset';
        default:
          return `Network error: ${error.code}`;
      }
    }
    
    if (error.response?.status) {
      return `HTTP ${error.response.status}: ${error.response.statusText || 'Unknown error'}`;
    }
    
    return error.message || 'Unknown health check error';
  }

  private setupHttpInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: performance.now() };
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        const responseTime = performance.now() - response.config.metadata.startTime;
        response.metadata = { responseTime };
        return response;
      },
      (error) => {
        if (error.config?.metadata) {
          const responseTime = performance.now() - error.config.metadata.startTime;
          error.metadata = { responseTime };
        }
        return Promise.reject(error);
      }
    );
  }
}