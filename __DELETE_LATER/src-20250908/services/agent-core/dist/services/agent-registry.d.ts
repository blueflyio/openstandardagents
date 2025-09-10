/**
 * Agent Registry Service
 * Manages registration and discovery of agents
 */
import { BaseCapabilities, AgentType, AgentRegistration } from '../types/agent-types.js';
export declare class AgentRegistry {
    private agents;
    private agentsByType;
    constructor();
    /**
     * Register an agent
     */
    registerAgent(agent: BaseCapabilities, type: AgentType, metadata?: any): Promise<AgentRegistration>;
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: string): Promise<void>;
    /**
     * Get an agent by ID
     */
    getAgent(agentId: string): Promise<AgentRegistration | undefined>;
    /**
     * Get all agents
     */
    getAllAgents(): Promise<AgentRegistration[]>;
    /**
     * Get agents by type
     */
    getAgentsByType(type: AgentType): Promise<AgentRegistration[]>;
    /**
     * Find agents by capability
     */
    findAgentsByCapability(capability: string): Promise<AgentRegistration[]>;
    /**
     * Get agent statistics
     */
    getStatistics(): Promise<{
        totalAgents: number;
        agentsByType: Record<string, number>;
        healthyAgents: number;
        unhealthyAgents: number;
    }>;
    /**
     * Extract capabilities from agent based on type
     */
    private extractCapabilities;
}
//# sourceMappingURL=agent-registry.d.ts.map