/**
 * Base Agent Implementation
 * Provides core functionality for all agent types
 */
import { EventEmitter } from 'events';
import { BaseCapabilities, AgentMetrics, AgentType } from '../types/agent-types.js';
export declare abstract class BaseAgent extends EventEmitter implements BaseCapabilities {
    readonly id: string;
    name: string;
    version: string;
    description: string;
    status: 'active' | 'inactive' | 'error' | 'initializing';
    protected metricsData: {
        requestsProcessed: number;
        totalResponseTime: number;
        errors: number;
        startTime: Date;
        lastActive: Date;
    };
    protected abstract agentType: AgentType;
    constructor(config: {
        name: string;
        version?: string;
        description?: string;
    });
    /**
     * Initialize the agent
     */
    protected initialize(): Promise<void>;
    /**
     * Abstract method for agent-specific initialization
     */
    protected abstract onInitialize(): Promise<void>;
    /**
     * Health check implementation
     */
    healthCheck(): Promise<boolean>;
    /**
     * Abstract method for agent-specific health check
     */
    protected abstract onHealthCheck(): Promise<boolean>;
    /**
     * Get agent metrics
     */
    getMetrics(): Promise<AgentMetrics>;
    /**
     * Process a request with metrics tracking
     */
    protected processRequest<T, R>(operation: string, handler: () => Promise<R>): Promise<R>;
    /**
     * Shutdown the agent gracefully
     */
    shutdown(): Promise<void>;
    /**
     * Abstract method for agent-specific shutdown
     */
    protected abstract onShutdown(): Promise<void>;
    /**
     * Get agent information
     */
    getInfo(): {
        id: string;
        name: string;
        type: AgentType;
        version: string;
        description: string;
        status: string;
    };
    /**
     * Update agent status
     */
    protected setStatus(status: 'active' | 'inactive' | 'error' | 'initializing'): void;
}
//# sourceMappingURL=base-agent.d.ts.map