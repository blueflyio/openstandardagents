/**
 * OSSA Orchestra v0.1.8 - Agent Registry
 * Central registry for managing agent definitions and lifecycle
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { AgentDefinition, HealthStatus, HealthCheck } from '../core/types';

export class AgentRegistry extends EventEmitter {
  private logger: Logger;
  private agents: Map<string, AgentDefinition> = new Map();
  private healthMonitorInterval?: NodeJS.Timeout;
  private isInitialized = false;

  private readonly HEALTH_CHECK_INTERVAL_MS = 30000; // 30 seconds

  constructor() {
    super();
    this.logger = new Logger('AgentRegistry');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.info('Initializing Agent Registry');
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    this.isInitialized = true;
    this.logger.info('Agent Registry initialized');
  }

  async shutdown(): Promise<void> {
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
      this.healthMonitorInterval = undefined;
    }
    
    this.agents.clear();
    this.isInitialized = false;
    this.logger.info('Agent Registry shutdown');
  }

  async register(agent: AgentDefinition): Promise<void> {
    this.ensureInitialized();
    
    // Validate agent definition
    this.validateAgentDefinition(agent);
    
    // Initialize health status if not provided
    if (!agent.healthStatus) {
      agent.healthStatus = {
        status: 'unknown',
        lastCheck: new Date(),
        checks: [],
        score: 0
      };
    }
    
    this.agents.set(agent.id, { ...agent });
    
    // Perform initial health check
    await this.performHealthCheck(agent.id);
    
    this.logger.info(`Registered agent: ${agent.id}`);
    this.emit('agent-registered', agent);
  }

  async unregister(agentId: string): Promise<boolean> {
    this.ensureInitialized();
    
    const existed = this.agents.delete(agentId);
    
    if (existed) {
      this.logger.info(`Unregistered agent: ${agentId}`);
      this.emit('agent-unregistered', agentId);
    }
    
    return existed;
  }

  async update(agent: AgentDefinition): Promise<void> {
    this.ensureInitialized();
    
    if (!this.agents.has(agent.id)) {
      throw new Error(`Agent not found: ${agent.id}`);
    }
    
    this.validateAgentDefinition(agent);
    this.agents.set(agent.id, { ...agent });
    
    this.logger.info(`Updated agent: ${agent.id}`);
    this.emit('agent-updated', agent);
  }

  async get(agentId: string): Promise<AgentDefinition | null> {
    this.ensureInitialized();
    return this.agents.get(agentId) || null;
  }

  async getAll(): Promise<AgentDefinition[]> {
    this.ensureInitialized();
    return Array.from(this.agents.values());
  }

  async getByCapability(capabilityId: string): Promise<AgentDefinition[]> {
    this.ensureInitialized();
    
    return Array.from(this.agents.values()).filter(agent =>
      agent.capabilities.some(cap => cap.id === capabilityId)
    );
  }

  async getByType(type: string): Promise<AgentDefinition[]> {
    this.ensureInitialized();
    
    return Array.from(this.agents.values()).filter(agent => agent.type === type);
  }

  async getHealthyAgents(): Promise<AgentDefinition[]> {
    this.ensureInitialized();
    
    return Array.from(this.agents.values()).filter(agent => 
      agent.healthStatus.status === 'healthy'
    );
  }

  async getAgentsByTags(tags: string[]): Promise<AgentDefinition[]> {
    this.ensureInitialized();
    
    return Array.from(this.agents.values()).filter(agent =>
      tags.every(tag => agent.metadata.tags.includes(tag))
    );
  }

  async performHealthCheck(agentId: string): Promise<HealthStatus> {
    this.ensureInitialized();
    
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const startTime = Date.now();
    const checks: HealthCheck[] = [];
    
    try {
      // Endpoint connectivity check
      const connectivityCheck = await this.checkEndpointConnectivity(agent);
      checks.push(connectivityCheck);
      
      // Capability checks
      for (const capability of agent.capabilities) {
        const capabilityCheck = await this.checkCapability(agent, capability);
        checks.push(capabilityCheck);
      }
      
      // Resource checks
      const resourceCheck = await this.checkResources(agent);
      checks.push(resourceCheck);
      
      // Calculate overall health score
      const score = this.calculateHealthScore(checks);
      
      // Determine health status
      let status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' = 'healthy';
      const criticalFailures = checks.filter(check => 
        check.status === 'fail' && check.name.includes('critical')
      ).length;
      const failures = checks.filter(check => check.status === 'fail').length;
      
      if (criticalFailures > 0 || score < 30) {
        status = 'unhealthy';
      } else if (failures > 0 || score < 70) {
        status = 'degraded';
      }
      
      const healthStatus: HealthStatus = {
        status,
        lastCheck: new Date(),
        checks,
        score
      };
      
      // Update agent health status
      agent.healthStatus = healthStatus;
      
      this.logger.debug(`Health check completed for agent ${agentId}: ${status} (${score})`);
      this.emit('health-check-completed', { agentId, healthStatus });
      
      return healthStatus;
      
    } catch (error) {
      this.logger.error(`Health check failed for agent ${agentId}:`, error);
      
      const healthStatus: HealthStatus = {
        status: 'unhealthy',
        lastCheck: new Date(),
        checks: [{
          name: 'health-check-error',
          status: 'fail',
          message: error.message,
          timestamp: new Date(),
          duration: Date.now() - startTime
        }],
        score: 0
      };
      
      agent.healthStatus = healthStatus;
      this.emit('health-check-failed', { agentId, error });
      
      return healthStatus;
    }
  }

  async getHealthStatus(): Promise<{
    overall: string;
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    agents: Array<{ id: string; status: string; score: number }>;
  }> {
    const agents = Array.from(this.agents.values());
    const healthy = agents.filter(a => a.healthStatus.status === 'healthy').length;
    const degraded = agents.filter(a => a.healthStatus.status === 'degraded').length;
    const unhealthy = agents.filter(a => a.healthStatus.status === 'unhealthy').length;
    
    let overall = 'healthy';
    if (unhealthy > 0 || healthy < agents.length * 0.5) {
      overall = 'unhealthy';
    } else if (degraded > 0) {
      overall = 'degraded';
    }
    
    return {
      overall,
      total: agents.length,
      healthy,
      degraded,
      unhealthy,
      agents: agents.map(a => ({
        id: a.id,
        status: a.healthStatus.status,
        score: a.healthStatus.score
      }))
    };
  }

  private startHealthMonitoring(): void {
    this.healthMonitorInterval = setInterval(async () => {
      try {
        await this.performAllHealthChecks();
      } catch (error) {
        this.logger.error('Error in health monitoring:', error);
      }
    }, this.HEALTH_CHECK_INTERVAL_MS);

    this.logger.info('Started health monitoring');
  }

  private async performAllHealthChecks(): Promise<void> {
    const agents = Array.from(this.agents.keys());
    const promises = agents.map(agentId => 
      this.performHealthCheck(agentId).catch(error => {
        this.logger.error(`Health check failed for agent ${agentId}:`, error);
      })
    );
    
    await Promise.allSettled(promises);
  }

  private async checkEndpointConnectivity(agent: AgentDefinition): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Simulate endpoint connectivity check
      // In real implementation, this would make HTTP request to agent endpoint
      const isConnected = Math.random() > 0.05; // 95% success rate for simulation
      
      const duration = Date.now() - startTime;
      
      return {
        name: 'endpoint-connectivity',
        status: isConnected ? 'pass' : 'fail',
        message: isConnected ? 'Endpoint is reachable' : 'Endpoint is not reachable',
        timestamp: new Date(),
        duration
      };
    } catch (error) {
      return {
        name: 'endpoint-connectivity',
        status: 'fail',
        message: `Connectivity check failed: ${error.message}`,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    }
  }

  private async checkCapability(agent: AgentDefinition, capability: any): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Simulate capability check
      const isWorking = Math.random() > 0.1; // 90% success rate for simulation
      
      const duration = Date.now() - startTime;
      
      return {
        name: `capability-${capability.id}`,
        status: isWorking ? 'pass' : 'fail',
        message: isWorking 
          ? `Capability ${capability.name} is operational`
          : `Capability ${capability.name} is not responding`,
        timestamp: new Date(),
        duration
      };
    } catch (error) {
      return {
        name: `capability-${capability.id}`,
        status: 'fail',
        message: `Capability check failed: ${error.message}`,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    }
  }

  private async checkResources(agent: AgentDefinition): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Simulate resource check
      const cpuUsage = Math.random() * 100;
      const memoryUsage = Math.random() * 100;
      
      const isHealthy = cpuUsage < 90 && memoryUsage < 90;
      
      const duration = Date.now() - startTime;
      
      return {
        name: 'resource-utilization',
        status: isHealthy ? 'pass' : (cpuUsage > 95 || memoryUsage > 95 ? 'fail' : 'warn'),
        message: `CPU: ${cpuUsage.toFixed(1)}%, Memory: ${memoryUsage.toFixed(1)}%`,
        timestamp: new Date(),
        duration
      };
    } catch (error) {
      return {
        name: 'resource-utilization',
        status: 'fail',
        message: `Resource check failed: ${error.message}`,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    }
  }

  private calculateHealthScore(checks: HealthCheck[]): number {
    if (checks.length === 0) return 0;
    
    let score = 0;
    let totalWeight = 0;
    
    for (const check of checks) {
      let weight = 1;
      let points = 0;
      
      // Weight critical checks more heavily
      if (check.name.includes('critical') || check.name.includes('endpoint')) {
        weight = 3;
      } else if (check.name.includes('capability')) {
        weight = 2;
      }
      
      // Assign points based on status
      switch (check.status) {
        case 'pass': points = 100; break;
        case 'warn': points = 70; break;
        case 'fail': points = 0; break;
      }
      
      score += points * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? Math.round(score / totalWeight) : 0;
  }

  private validateAgentDefinition(agent: AgentDefinition): void {
    if (!agent.id || !agent.name) {
      throw new Error('Agent must have id and name');
    }
    
    if (!agent.endpoint) {
      throw new Error('Agent must have endpoint');
    }
    
    if (!agent.capabilities || agent.capabilities.length === 0) {
      throw new Error('Agent must have at least one capability');
    }
    
    if (!agent.type) {
      throw new Error('Agent must have type');
    }
    
    // Validate capabilities
    for (const capability of agent.capabilities) {
      if (!capability.id || !capability.name) {
        throw new Error('Capability must have id and name');
      }
      
      if (!capability.inputSchema || !capability.outputSchema) {
        throw new Error('Capability must have input and output schemas');
      }
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('AgentRegistry not initialized. Call initialize() first.');
    }
  }
}