/**
 * OSSA Orchestration API Server
 * Production REST API for agent workflow coordination
 */
import express from 'express';
import { OrchestratorConfig } from '../../types';
export interface OrchestrationAPIConfig {
    port: number;
    host: string;
    cors: boolean;
    auth: {
        enabled: boolean;
        type: 'jwt' | 'apikey';
    };
    rateLimit: {
        enabled: boolean;
        requests: number;
        window: number;
    };
}
export declare class OrchestrationAPIServer {
    private app;
    private orchestrator;
    private config;
    private server;
    constructor(orchestratorConfig: OrchestratorConfig, apiConfig: OrchestrationAPIConfig);
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    private validateRequest;
    /**
     * GET /health - Health check endpoint
     */
    private getHealth;
    /**
     * POST /workflows - Create new workflow
     */
    private createWorkflow;
    /**
     * POST /workflows/:workflowId/execute - Execute workflow
     */
    private executeWorkflow;
    /**
     * GET /workflows/:workflowId/status - Get workflow status
     */
    private getWorkflowStatus;
    /**
     * POST /feedback-loop/initiate - Initiate 360° feedback loop
     */
    private initiateFeedbackLoop;
    /**
     * POST /agents/allocate - Allocate agents to task
     */
    private allocateAgents;
    /**
     * POST /agents/spin-up - Spin up new agent instances
     */
    private spinUpAgents;
    /**
     * GET /metrics - Get orchestration metrics
     */
    private getMetrics;
    /**
     * GET /executions - Get active executions
     */
    private getActiveExecutions;
    /**
     * GET /executions/:executionId - Get execution details
     */
    private getExecutionDetails;
    /**
     * POST /tasks/distribute - Distribute tasks to agents
     */
    private distributeTasks;
    /**
     * GET /feedback-loop/:executionId/status - Get feedback loop status
     */
    private getFeedbackLoopStatus;
    /**
     * GET /agents/status - Get agents status
     */
    private getAgentsStatus;
    start(): Promise<void>;
    stop(): Promise<void>;
    getApp(): express.Application;
}
export default OrchestrationAPIServer;
//# sourceMappingURL=server.d.ts.map