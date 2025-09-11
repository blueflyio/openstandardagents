/**
 * Agent Factory Service
 * Creates and manages different agent types
 */

import { 
  BaseCapabilities, 
  AgentType,
  AgentFactory as IAgentFactory 
} from '../types/agent-types.js';
import { AgentRegistry } from './agent-registry.js';
import { logger } from '../utils/logger.js';

export class AgentFactory implements IAgentFactory {
  private agentTypes: Map<AgentType, any>;
  private registry: AgentRegistry;
  
  constructor(registry: AgentRegistry) {
    this.agentTypes = new Map();
    this.registry = registry;
  }
  
  /**
   * Register an agent type implementation
   */
  registerAgentType(type: AgentType, implementation: any): void {
    this.agentTypes.set(type, implementation);
    logger.info(`Registered agent type: ${type}`);
  }
  
  /**
   * Create an agent of specified type
   */
  async createAgent<T extends BaseCapabilities>(
    type: AgentType, 
    config: any
  ): Promise<T> {
    const AgentClass = this.agentTypes.get(type);
    
    if (!AgentClass) {
      throw new Error(`Agent type ${type} not registered`);
    }
    
    try {
      // Create agent instance
      const agent = new AgentClass(config) as T;
      
      // Explicitly initialize the agent
      if ('initialize' in agent && typeof (agent as any).initialize === 'function') {
        await (agent as any).initialize();
      }
      
      // Agent is already initialized, no need to wait for events
      
      // Register with registry
      await this.registry.registerAgent(agent, type, config);
      
      logger.info(`Created ${type} agent: ${agent.name} (${agent.id})`);
      
      return agent;
    } catch (error) {
      logger.error(`Failed to create ${type} agent:`, error);
      throw error;
    }
  }
  
  /**
   * Get available agent types
   */
  getAvailableTypes(): AgentType[] {
    return Array.from(this.agentTypes.keys());
  }
  
  /**
   * Get agents by type
   */
  async getAgentsByType(type: AgentType): Promise<BaseCapabilities[]> {
    const registrations = await this.registry.getAgentsByType(type);
    return registrations.map(reg => reg.agent);
  }
  
  /**
   * Create multiple agents of the same type
   */
  async createAgentPool<T extends BaseCapabilities>(
    type: AgentType,
    baseConfig: any,
    count: number
  ): Promise<T[]> {
    const agents: T[] = [];
    
    for (let i = 0; i < count; i++) {
      const config = {
        ...baseConfig,
        name: `${baseConfig.name}-${i + 1}`
      };
      
      const agent = await this.createAgent<T>(type, config);
      agents.push(agent);
    }
    
    logger.info(`Created agent pool of ${count} ${type} agents`);
    
    return agents;
  }
  
  /**
   * Import agent from agent-forge
   * This creates a bridge between OSSA and agent-forge agents
   */
  async importFromAgentForge(
    agentPath: string,
    type: AgentType,
    config: any
  ): Promise<BaseCapabilities> {
    try {
      // Dynamic import of agent-forge agent
      const AgentModule = await import(agentPath);
      const AgentClass = AgentModule.default || AgentModule;
      
      // Create wrapper that implements BaseCapabilities
      class AgentForgeWrapper extends AgentClass implements BaseCapabilities {
        public _id: string;
        public _status: 'active' | 'inactive' | 'error' | 'initializing';
        public name: string;
        public version: string;
        public description: string;
        
        constructor(config: any) {
          super(config);
          this._id = `forge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          this._status = 'active';
          this.name = config.name || 'agent-forge-import';
          this.version = config.version || '1.0.0';
          this.description = config.description || 'Imported from agent-forge';
        }
        
        get id(): string {
          return this._id;
        }
        
        get status(): 'active' | 'inactive' | 'error' | 'initializing' {
          return this._status;
        }
        
        async healthCheck(): Promise<boolean> {
          // If original has healthCheck, use it
          if (super.healthCheck) {
            return super.healthCheck();
          }
          // Otherwise, basic check
          return this._status === 'active';
        }
        
        async getMetrics(): Promise<any> {
          // If original has getMetrics, use it
          if (super.getMetrics) {
            return super.getMetrics();
          }
          // Otherwise, return basic metrics
          return {
            requestsProcessed: 0,
            averageResponseTime: 0,
            errorRate: 0,
            lastActive: new Date(),
            uptime: 0,
            memoryUsage: process.memoryUsage().heapUsed,
            cpuUsage: 0
          };
        }
        
        async shutdown(): Promise<void> {
          // If original has shutdown, use it
          if (super.shutdown) {
            return super.shutdown();
          }
          this._status = 'inactive';
        }
      }
      
      // Create wrapped instance
      const agent = new AgentForgeWrapper(config);
      
      // Register with registry
      await this.registry.registerAgent(agent, type, {
        ...config,
        source: 'agent-forge',
        originalPath: agentPath
      });
      
      logger.info(`Imported agent-forge agent from ${agentPath} as ${type}`);
      
      return agent;
    } catch (error) {
      logger.error(`Failed to import agent from ${agentPath}:`, error);
      throw error;
    }
  }
}