/**
 * OSSA Core Orchestrator - Production Platform
 * Enterprise-grade agent coordination with 360° feedback loop
 * Plan → Execute → Review → Judge → Learn → Govern
 */
import { EventEmitter } from 'events';
import { Agent, Workflow, OrchestratorConfig, AgentType } from '../../types';
export interface FeedbackLoopPhase {
    name: 'plan' | 'execute' | 'review' | 'judge' | 'learn' | 'govern';
    agents: string[];
    status: 'pending' | 'active' | 'completed' | 'failed';
    startTime?: Date;
    endTime?: Date;
    budget: {
        tokens: number;
        used: number;
    };
    output?: any;
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    phases: FeedbackLoopPhase[];
    currentPhase: number;
    budget: {
        totalTokens: number;
        usedTokens: number;
        timeLimit: number;
    };
    startTime: Date;
    endTime?: Date;
    metrics: {
        agentsUsed: number;
        tasksCompleted: number;
        errors: number;
        performance: any;
    };
}
export interface AgentAllocation {
    agentId: string;
    agentType: AgentType;
    allocatedTo: string;
    phase: string;
    resourceQuota: {
        tokens: number;
        timeout: number;
    };
    performance: {
        tasksCompleted: number;
        avgResponseTime: number;
        errorRate: number;
    };
}
export declare class OrchestratorPlatform extends EventEmitter {
    private agents;
    private workflows;
    private executions;
    private allocations;
    private taskQueue;
    private config;
    private healthMetrics;
    constructor(config: OrchestratorConfig);
    private initialize;
    /**
     * Register agent with production capabilities validation
     */
    registerAgent(agent: Agent): Promise<void>;
    /**
     * Execute workflow with 360° feedback loop coordination
     */
    executeWorkflow(workflow: Workflow, budget?: {
        tokens: number;
        timeLimit: number;
    }): Promise<string>;
    /**
     * Allocate agents to workflow execution with resource management
     */
    allocateAgents(executionId: string, requirements: {
        agentType: AgentType;
        count: number;
        capabilities: string[];
        phase: string;
    }): Promise<string[]>;
    /**
     * Execute 360° feedback loop: Plan → Execute → Review → Judge → Learn → Govern
     */
    private executeFeedbackLoop;
    /**
     * Execute individual phase with agent coordination
     */
    private executePhase;
    /**
     * Get agent requirements for each feedback loop phase
     */
    private getPhaseAgentRequirements;
    /**
     * Coordinate agent execution within a phase
     */
    private coordinatePhaseExecution;
    /**
     * Execute task for specific agent
     */
    private executeAgentTask;
    /**
     * Summarize results from a phase
     */
    private summarizePhaseResults;
    /**
     * Initialize feedback loop phases for workflow
     */
    private initializeFeedbackLoopPhases;
    /**
     * Validate agent meets production requirements
     */
    private validateAgentForProduction;
    /**
     * Check if agent has required capabilities
     */
    private hasRequiredCapabilities;
    /**
     * Handle execution errors with recovery strategies
     */
    private handleExecutionError;
    /**
     * Cleanup resources after execution
     */
    private cleanupExecution;
    /**
     * Initialize health monitoring
     */
    private initializeHealthMonitoring;
    /**
     * Update health metrics
     */
    private updateHealthMetrics;
    /**
     * Get current health status
     */
    getHealthStatus(): any;
    /**
     * Get execution status
     */
    getExecutionStatus(executionId: string): WorkflowExecution | null;
    /**
     * List all active executions
     */
    getActiveExecutions(): WorkflowExecution[];
    private scheduleWorkflowTasks;
    private loadAgents;
    private setupMessageBus;
    private startScheduler;
}
export declare const Orchestrator: typeof OrchestratorPlatform;
export default OrchestratorPlatform;
//# sourceMappingURL=index.d.ts.map