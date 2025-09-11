/**
 * OSSA Orchestra v0.1.8 - Dynamic Agent Scaling Manager
 * Handles automatic scaling of agents based on performance metrics and load
 */

import { EventEmitter } from 'events';
import { AgentRegistry } from '../agents/registry';
import { Logger } from '../utils/logger';
import {
  ScalingPolicy,
  ScalingTrigger,
  ScalingAction,
  AgentDefinition,
  PerformanceMetrics,
  ResourceUsage
} from '../core/types';

export class ScalingManager extends EventEmitter {
  private agentRegistry: AgentRegistry;
  private logger: Logger;
  private policies: Map<string, ScalingPolicy> = new Map();
  private cooldowns: Map<string, Date> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private isInitialized = false;

  private readonly MONITORING_INTERVAL_MS = 30000; // 30 seconds
  private readonly METRICS_HISTORY_SIZE = 100;
  private metricsHistory: Map<string, PerformanceMetrics[]> = new Map();

  constructor(agentRegistry: AgentRegistry) {
    super();
    this.agentRegistry = agentRegistry;
    this.logger = new Logger('ScalingManager');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.info('Initializing Dynamic Agent Scaling Manager');
    
    // Load default scaling policies
    await this.loadDefaultPolicies();
    
    // Start monitoring loop
    this.startMonitoring();
    
    this.isInitialized = true;
    this.logger.info('Dynamic Agent Scaling Manager initialized');
  }

  async shutdown(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    this.policies.clear();
    this.cooldowns.clear();
    this.metricsHistory.clear();
    
    this.isInitialized = false;
    this.logger.info('Dynamic Agent Scaling Manager shutdown');
  }

  async addPolicy(policy: ScalingPolicy): Promise<void> {
    this.ensureInitialized();
    
    // Validate policy
    this.validatePolicy(policy);
    
    this.policies.set(policy.id, policy);
    this.logger.info(`Added scaling policy: ${policy.id}`);
    
    this.emit('policy-added', policy);
  }

  async removePolicy(policyId: string): Promise<void> {
    this.ensureInitialized();
    
    if (this.policies.delete(policyId)) {
      this.cooldowns.delete(policyId);
      this.logger.info(`Removed scaling policy: ${policyId}`);
      this.emit('policy-removed', policyId);
    }
  }

  async updatePolicy(policy: ScalingPolicy): Promise<void> {
    this.ensureInitialized();
    
    this.validatePolicy(policy);
    this.policies.set(policy.id, policy);
    
    this.logger.info(`Updated scaling policy: ${policy.id}`);
    this.emit('policy-updated', policy);
  }

  async getPolicies(): Promise<ScalingPolicy[]> {
    this.ensureInitialized();
    return Array.from(this.policies.values());
  }

  async getPolicy(policyId: string): Promise<ScalingPolicy | null> {
    this.ensureInitialized();
    return this.policies.get(policyId) || null;
  }

  async scaleAgent(agentId: string, action: ScalingAction): Promise<boolean> {
    this.ensureInitialized();
    
    const agent = await this.agentRegistry.get(agentId);
    if (!agent) {
      this.logger.error(`Agent not found for scaling: ${agentId}`);
      return false;
    }

    try {
      switch (action.type) {
        case 'scale_up':
          return await this.scaleUp(agent, action);
        case 'scale_down':
          return await this.scaleDown(agent, action);
        case 'scale_out':
          return await this.scaleOut(agent, action);
        case 'scale_in':
          return await this.scaleIn(agent, action);
        default:
          this.logger.error(`Unknown scaling action type: ${action.type}`);
          return false;
      }
    } catch (error) {
      this.logger.error(`Failed to scale agent ${agentId}:`, error);
      return false;
    }
  }

  async getScalingMetrics(agentId?: string): Promise<ScalingMetrics> {
    this.ensureInitialized();
    
    if (agentId) {
      const agent = await this.agentRegistry.get(agentId);
      const history = this.metricsHistory.get(agentId) || [];
      
      return {
        agentId,
        current: agent?.resources || null,
        history: history.slice(-10), // Last 10 measurements
        recommendations: await this.getScalingRecommendations(agentId)
      };
    } else {
      const agents = await this.agentRegistry.getAll();
      const allMetrics: AgentScalingMetrics[] = [];
      
      for (const agent of agents) {
        const history = this.metricsHistory.get(agent.id) || [];
        allMetrics.push({
          agentId: agent.id,
          current: agent.resources,
          history: history.slice(-5), // Last 5 measurements
          recommendations: await this.getScalingRecommendations(agent.id)
        });
      }
      
      return { agents: allMetrics };
    }
  }

  async getHealth(): Promise<{ overall: string; policies: number; activeScalings: number }> {
    return {
      overall: 'healthy',
      policies: this.policies.size,
      activeScalings: this.cooldowns.size
    };
  }

  private async loadDefaultPolicies(): Promise<void> {
    const defaultPolicies: ScalingPolicy[] = [
      {
        id: 'cpu-high-scale-out',
        name: 'High CPU Scale Out',
        trigger: {
          metric: 'cpu',
          operator: 'gt',
          threshold: 80,
          duration: 300000 // 5 minutes
        },
        action: {
          type: 'scale_out',
          amount: 1,
          target: 'agent'
        },
        constraints: {
          minInstances: 1,
          maxInstances: 10,
          maxConcurrency: 100,
          resourceLimits: {
            cpu: 4,
            memory: 8192,
            network: 1000,
            maxConcurrency: 50
          }
        },
        cooldown: 600000 // 10 minutes
      },
      {
        id: 'cpu-low-scale-in',
        name: 'Low CPU Scale In',
        trigger: {
          metric: 'cpu',
          operator: 'lt',
          threshold: 20,
          duration: 900000 // 15 minutes
        },
        action: {
          type: 'scale_in',
          amount: 1,
          target: 'agent'
        },
        constraints: {
          minInstances: 1,
          maxInstances: 10,
          maxConcurrency: 100,
          resourceLimits: {
            cpu: 4,
            memory: 8192,
            network: 1000,
            maxConcurrency: 50
          }
        },
        cooldown: 900000 // 15 minutes
      },
      {
        id: 'response-time-scale-up',
        name: 'High Response Time Scale Up',
        trigger: {
          metric: 'response_time',
          operator: 'gt',
          threshold: 5000, // 5 seconds
          duration: 180000 // 3 minutes
        },
        action: {
          type: 'scale_up',
          amount: 1,
          target: 'agent'
        },
        constraints: {
          minInstances: 1,
          maxInstances: 5,
          maxConcurrency: 50,
          resourceLimits: {
            cpu: 8,
            memory: 16384,
            network: 2000,
            maxConcurrency: 100
          }
        },
        cooldown: 300000 // 5 minutes
      }
    ];

    for (const policy of defaultPolicies) {
      this.policies.set(policy.id, policy);
    }

    this.logger.info(`Loaded ${defaultPolicies.length} default scaling policies`);
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.monitorAndScale();
      } catch (error) {
        this.logger.error('Error in scaling monitoring loop:', error);
      }
    }, this.MONITORING_INTERVAL_MS);

    this.logger.info('Started scaling monitoring loop');
  }

  private async monitorAndScale(): Promise<void> {
    const agents = await this.agentRegistry.getAll();
    
    for (const agent of agents) {
      // Collect current metrics
      const metrics = this.extractMetricsFromAgent(agent);
      this.recordMetrics(agent.id, metrics);
      
      // Check all policies against this agent
      for (const policy of this.policies.values()) {
        await this.evaluatePolicy(agent, policy, metrics);
      }
    }
  }

  private async evaluatePolicy(
    agent: AgentDefinition,
    policy: ScalingPolicy,
    currentMetrics: PerformanceMetrics
  ): Promise<void> {
    // Check if policy is in cooldown
    const cooldownKey = `${policy.id}-${agent.id}`;
    const lastScaling = this.cooldowns.get(cooldownKey);
    
    if (lastScaling && Date.now() - lastScaling.getTime() < policy.cooldown) {
      return; // Still in cooldown
    }

    // Check if trigger conditions are met
    const shouldTrigger = await this.checkTriggerCondition(
      agent.id,
      policy.trigger,
      currentMetrics
    );

    if (shouldTrigger) {
      this.logger.info(`Scaling policy triggered: ${policy.id} for agent ${agent.id}`);
      
      const success = await this.scaleAgent(agent.id, policy.action);
      
      if (success) {
        this.cooldowns.set(cooldownKey, new Date());
        this.emit('scaling-triggered', {
          policyId: policy.id,
          agentId: agent.id,
          action: policy.action,
          trigger: policy.trigger,
          timestamp: new Date()
        });
      }
    }
  }

  private async checkTriggerCondition(
    agentId: string,
    trigger: ScalingTrigger,
    currentMetrics: PerformanceMetrics
  ): Promise<boolean> {
    const history = this.metricsHistory.get(agentId) || [];
    
    if (history.length < 2) {
      return false; // Need historical data
    }

    // Calculate duration-based average
    const durationSamples = Math.min(
      Math.floor(trigger.duration / this.MONITORING_INTERVAL_MS),
      history.length
    );
    
    const recentMetrics = history.slice(-durationSamples);
    let metricValue = 0;

    switch (trigger.metric) {
      case 'cpu':
        metricValue = this.calculateAverage(recentMetrics.map(m => m.current?.cpu || 0));
        break;
      case 'memory':
        metricValue = this.calculateAverage(recentMetrics.map(m => m.current?.memory || 0));
        break;
      case 'response_time':
        metricValue = this.calculateAverage(recentMetrics.map(m => m.responseTime.current || m.responseTime.target));
        break;
      case 'queue_length':
        // This would need to be tracked separately
        metricValue = 0;
        break;
      case 'error_rate':
        metricValue = this.calculateAverage(recentMetrics.map(m => m.errorRate.current || 0));
        break;
    }

    // Apply operator
    switch (trigger.operator) {
      case 'gt': return metricValue > trigger.threshold;
      case 'lt': return metricValue < trigger.threshold;
      case 'gte': return metricValue >= trigger.threshold;
      case 'lte': return metricValue <= trigger.threshold;
      default: return false;
    }
  }

  private async scaleUp(agent: AgentDefinition, action: ScalingAction): Promise<boolean> {
    // Increase agent resources (CPU/Memory)
    const newResources = {
      ...agent.resources,
      cpu: {
        ...agent.resources.cpu,
        max: Math.min(agent.resources.cpu.max + action.amount, 8)
      },
      memory: {
        ...agent.resources.memory,
        max: Math.min(agent.resources.memory.max + action.amount * 1024, 16384)
      }
    };

    return await this.updateAgentResources(agent.id, newResources);
  }

  private async scaleDown(agent: AgentDefinition, action: ScalingAction): Promise<boolean> {
    // Decrease agent resources
    const newResources = {
      ...agent.resources,
      cpu: {
        ...agent.resources.cpu,
        max: Math.max(agent.resources.cpu.max - action.amount, agent.resources.cpu.min)
      },
      memory: {
        ...agent.resources.memory,
        max: Math.max(agent.resources.memory.max - action.amount * 1024, agent.resources.memory.min)
      }
    };

    return await this.updateAgentResources(agent.id, newResources);
  }

  private async scaleOut(agent: AgentDefinition, action: ScalingAction): Promise<boolean> {
    // Create additional agent instances
    this.logger.info(`Scaling out agent ${agent.id} by ${action.amount} instances`);
    
    // This would typically create new agent instances in a container orchestrator
    // For now, we'll just log the action
    
    this.emit('scale-out', {
      agentId: agent.id,
      instances: action.amount,
      timestamp: new Date()
    });

    return true;
  }

  private async scaleIn(agent: AgentDefinition, action: ScalingAction): Promise<boolean> {
    // Remove agent instances
    this.logger.info(`Scaling in agent ${agent.id} by ${action.amount} instances`);
    
    // This would typically remove agent instances from a container orchestrator
    // For now, we'll just log the action
    
    this.emit('scale-in', {
      agentId: agent.id,
      instances: action.amount,
      timestamp: new Date()
    });

    return true;
  }

  private async updateAgentResources(agentId: string, newResources: any): Promise<boolean> {
    try {
      const agent = await this.agentRegistry.get(agentId);
      if (!agent) {
        return false;
      }

      const updatedAgent = { ...agent, resources: newResources };
      await this.agentRegistry.update(updatedAgent);
      
      this.logger.info(`Updated resources for agent ${agentId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update agent resources: ${agentId}`, error);
      return false;
    }
  }

  private extractMetricsFromAgent(agent: AgentDefinition): PerformanceMetrics {
    // Extract current performance metrics from agent
    return {
      responseTime: agent.capabilities[0]?.performance?.responseTime || { target: 1000, max: 5000, current: 1500 },
      throughput: agent.capabilities[0]?.performance?.throughput || { target: 100, max: 500, current: 150 },
      errorRate: agent.capabilities[0]?.performance?.errorRate || { max: 5, current: 1 },
      availability: agent.capabilities[0]?.performance?.availability || { target: 99.9, current: 99.5 },
      current: {
        cpu: agent.resources.cpu.current || agent.resources.cpu.min,
        memory: agent.resources.memory.current || agent.resources.memory.min,
        network: agent.resources.network.bandwidth
      }
    };
  }

  private recordMetrics(agentId: string, metrics: PerformanceMetrics): void {
    if (!this.metricsHistory.has(agentId)) {
      this.metricsHistory.set(agentId, []);
    }

    const history = this.metricsHistory.get(agentId)!;
    history.push(metrics);

    // Keep only recent history
    if (history.length > this.METRICS_HISTORY_SIZE) {
      history.shift();
    }
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private async getScalingRecommendations(agentId: string): Promise<ScalingRecommendation[]> {
    const history = this.metricsHistory.get(agentId) || [];
    const recommendations: ScalingRecommendation[] = [];

    if (history.length < 5) {
      return recommendations;
    }

    const recentMetrics = history.slice(-5);
    const avgCpu = this.calculateAverage(recentMetrics.map(m => m.current?.cpu || 0));
    const avgMemory = this.calculateAverage(recentMetrics.map(m => m.current?.memory || 0));
    const avgResponseTime = this.calculateAverage(recentMetrics.map(m => m.responseTime.current || m.responseTime.target));

    if (avgCpu > 75) {
      recommendations.push({
        type: 'scale_out',
        reason: `High CPU usage: ${avgCpu.toFixed(1)}%`,
        urgency: avgCpu > 90 ? 'high' : 'medium',
        impact: 'performance'
      });
    }

    if (avgResponseTime > 3000) {
      recommendations.push({
        type: 'scale_up',
        reason: `High response time: ${avgResponseTime.toFixed(0)}ms`,
        urgency: avgResponseTime > 5000 ? 'high' : 'medium',
        impact: 'user_experience'
      });
    }

    if (avgCpu < 15 && avgMemory < 20) {
      recommendations.push({
        type: 'scale_in',
        reason: `Low resource utilization: CPU ${avgCpu.toFixed(1)}%, Memory ${avgMemory.toFixed(1)}%`,
        urgency: 'low',
        impact: 'cost_optimization'
      });
    }

    return recommendations;
  }

  private validatePolicy(policy: ScalingPolicy): void {
    if (!policy.id || !policy.name) {
      throw new Error('Policy must have id and name');
    }

    if (!policy.trigger || !policy.action || !policy.constraints) {
      throw new Error('Policy must have trigger, action, and constraints');
    }

    if (policy.cooldown < 0) {
      throw new Error('Policy cooldown must be non-negative');
    }

    if (policy.constraints.minInstances < 0 || policy.constraints.maxInstances < policy.constraints.minInstances) {
      throw new Error('Invalid instance constraints');
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('ScalingManager not initialized. Call initialize() first.');
    }
  }
}

interface ScalingMetrics {
  agentId?: string;
  agents?: AgentScalingMetrics[];
  current?: any;
  history?: PerformanceMetrics[];
  recommendations?: ScalingRecommendation[];
}

interface AgentScalingMetrics {
  agentId: string;
  current: any;
  history: PerformanceMetrics[];
  recommendations: ScalingRecommendation[];
}

interface ScalingRecommendation {
  type: 'scale_up' | 'scale_down' | 'scale_out' | 'scale_in';
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  impact: 'performance' | 'cost_optimization' | 'user_experience';
}