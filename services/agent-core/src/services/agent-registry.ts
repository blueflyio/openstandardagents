/**
 * Agent Registry Service
 * Manages registration and discovery of agents
 */

import { 
  BaseCapabilities, 
  AgentType, 
  AgentRegistration 
} from '../types/agent-types.js';
import { logger } from '../utils/logger.js';

export class AgentRegistry {
  private agents: Map<string, AgentRegistration>;
  private agentsByType: Map<AgentType, Set<string>>;
  
  constructor() {
    this.agents = new Map();
    this.agentsByType = new Map();
    
    // Initialize type sets
    for (const type of Object.values(AgentType)) {
      this.agentsByType.set(type as AgentType, new Set());
    }
  }
  
  /**
   * Register an agent
   */
  async registerAgent(
    agent: BaseCapabilities,
    type: AgentType,
    metadata?: any
  ): Promise<AgentRegistration> {
    const registration: AgentRegistration = {
      agent,
      type,
      capabilities: this.extractCapabilities(agent, type),
      metadata
    };
    
    // Store in registry
    this.agents.set(agent.id, registration);
    
    // Add to type index
    const typeSet = this.agentsByType.get(type);
    if (typeSet) {
      typeSet.add(agent.id);
    }
    
    logger.info(`Registered ${type} agent: ${agent.name} (${agent.id})`);
    
    return registration;
  }
  
  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<void> {
    const registration = this.agents.get(agentId);
    
    if (!registration) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Remove from type index
    const typeSet = this.agentsByType.get(registration.type);
    if (typeSet) {
      typeSet.delete(agentId);
    }
    
    // Remove from registry
    this.agents.delete(agentId);
    
    logger.info(`Unregistered agent: ${agentId}`);
  }
  
  /**
   * Get an agent by ID
   */
  async getAgent(agentId: string): Promise<AgentRegistration | undefined> {
    return this.agents.get(agentId);
  }
  
  /**
   * Get all agents
   */
  async getAllAgents(): Promise<AgentRegistration[]> {
    return Array.from(this.agents.values());
  }
  
  /**
   * Get agents by type
   */
  async getAgentsByType(type: AgentType): Promise<AgentRegistration[]> {
    const typeSet = this.agentsByType.get(type);
    
    if (!typeSet) {
      return [];
    }
    
    const agents: AgentRegistration[] = [];
    
    for (const agentId of typeSet) {
      const registration = this.agents.get(agentId);
      if (registration) {
        agents.push(registration);
      }
    }
    
    return agents;
  }
  
  /**
   * Find agents by capability
   */
  async findAgentsByCapability(capability: string): Promise<AgentRegistration[]> {
    const matchingAgents: AgentRegistration[] = [];
    
    for (const registration of this.agents.values()) {
      if (registration.capabilities.includes(capability)) {
        matchingAgents.push(registration);
      }
    }
    
    return matchingAgents;
  }
  
  /**
   * Get agent statistics
   */
  async getStatistics(): Promise<{
    totalAgents: number;
    agentsByType: Record<string, number>;
    healthyAgents: number;
    unhealthyAgents: number;
  }> {
    const stats = {
      totalAgents: this.agents.size,
      agentsByType: {} as Record<string, number>,
      healthyAgents: 0,
      unhealthyAgents: 0
    };
    
    // Count by type
    for (const [type, agentSet] of this.agentsByType) {
      stats.agentsByType[type] = agentSet.size;
    }
    
    // Check health
    for (const registration of this.agents.values()) {
      try {
        const isHealthy = await registration.agent.healthCheck();
        if (isHealthy) {
          stats.healthyAgents++;
        } else {
          stats.unhealthyAgents++;
        }
      } catch (error) {
        stats.unhealthyAgents++;
      }
    }
    
    return stats;
  }
  
  /**
   * Extract capabilities from agent based on type
   */
  private extractCapabilities(agent: any, type: AgentType): string[] {
    const capabilities: string[] = ['health_check', 'metrics'];
    
    switch (type) {
      case AgentType.TASK:
        capabilities.push('execute_task', 'schedule_task', 'cancel_task', 'get_task_status');
        break;
        
      case AgentType.RESEARCH:
        capabilities.push('search', 'analyze', 'summarize', 'fact_check');
        break;
        
      case AgentType.TRANSCRIBER:
        capabilities.push('transcribe', 'detect_language', 'diarize_speakers', 'generate_subtitles');
        break;
        
      case AgentType.ROUTER:
        capabilities.push('route', 'load_balance', 'failover', 'broadcast');
        break;
        
      case AgentType.SECURITY:
        capabilities.push('authenticate', 'authorize', 'audit', 'detect_threat', 'encrypt', 'decrypt');
        break;
        
      case AgentType.WORKFLOW:
        capabilities.push('create_workflow', 'execute_workflow', 'pause_workflow', 'resume_workflow', 'get_workflow_status');
        break;
        
      // Add other agent types as needed
    }
    
    return capabilities;
  }
}