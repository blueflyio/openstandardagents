/**
 * Agent Factory Service
 * Creates and manages different agent types
 */
import { BaseCapabilities, AgentType, AgentFactory as IAgentFactory } from '../types/agent-types.js';
import { AgentRegistry } from './agent-registry.js';
export declare class AgentFactory implements IAgentFactory {
    private agentTypes;
    private registry;
    constructor(registry: AgentRegistry);
    /**
     * Register an agent type implementation
     */
    registerAgentType(type: AgentType, implementation: any): void;
    /**
     * Create an agent of specified type
     */
    createAgent<T extends BaseCapabilities>(type: AgentType, config: any): Promise<T>;
    /**
     * Get available agent types
     */
    getAvailableTypes(): AgentType[];
    /**
     * Get agents by type
     */
    getAgentsByType(type: AgentType): Promise<BaseCapabilities[]>;
    /**
     * Create multiple agents of the same type
     */
    createAgentPool<T extends BaseCapabilities>(type: AgentType, baseConfig: any, count: number): Promise<T[]>;
    /**
     * Import agent from agent-forge
     * This creates a bridge between OSSA and agent-forge agents
     */
    importFromAgentForge(agentPath: string, type: AgentType, config: any): Promise<BaseCapabilities>;
}
//# sourceMappingURL=agent-factory.d.ts.map