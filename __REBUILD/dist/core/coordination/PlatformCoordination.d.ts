/**
 * OSSA Platform Agent Coordination
 * Implements separation of duties and inter-agent communication
 */
import { EventEmitter } from 'events';
import { OrchestratorPlatform } from '../orchestrator';
export interface PlatformAgent {
    id: string;
    type: 'orchestrator' | 'spec-authority' | 'registry-core' | 'compliance-engine' | 'protocol-bridge' | 'governance-core' | 'federation-manager' | 'security-authority' | 'monitor-platform' | 'workflow-executor';
    subtype: string;
    status: 'active' | 'idle' | 'busy' | 'error' | 'offline';
    endpoint: string;
    capabilities: string[];
    responsibilities: string[];
}
export interface CoordinationRequest {
    id: string;
    from: string;
    to: string;
    type: 'delegate' | 'consult' | 'notify' | 'validate' | 'enforce';
    payload: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
    timeout: number;
    correlationId?: string;
}
export interface CoordinationResponse {
    id: string;
    requestId: string;
    from: string;
    to: string;
    status: 'success' | 'error' | 'partial' | 'delegated';
    payload: any;
    timestamp: Date;
    metadata?: any;
}
/**
 * Platform Coordination Manager
 * Handles communication and task coordination between OSSA platform agents
 */
export declare class PlatformCoordination extends EventEmitter {
    private orchestrator;
    private platformAgents;
    private pendingRequests;
    private agentId;
    constructor(orchestrator: OrchestratorPlatform, agentId?: string);
    /**
     * Initialize known platform agents based on OSSA separation of duties
     */
    private initializePlatformAgents;
    /**
     * Set up coordination event handlers
     */
    private setupCoordinationHandlers;
    /**
     * Coordinate agent registration with REGISTRY-CORE and COMPLIANCE-ENGINE
     */
    private coordinateAgentRegistration;
    /**
     * Delegate task to another platform agent
     */
    delegateToAgent(targetAgentId: string, operation: string, payload: any, priority?: 'low' | 'medium' | 'high' | 'critical', timeout?: number): Promise<CoordinationResponse>;
    /**
     * Consult with another platform agent
     */
    consultAgent(targetAgentId: string, query: string, context: any): Promise<CoordinationResponse>;
    /**
     * Notify platform agents of important events
     */
    private notifyPlatformAgents;
    /**
     * Send notification to specific agent
     */
    private sendNotification;
    /**
     * Request validation from COMPLIANCE-ENGINE
     */
    requestValidation(validationType: string, target: any): Promise<CoordinationResponse>;
    /**
     * Request security check from SECURITY-AUTHORITY
     */
    requestSecurityCheck(checkType: string, subject: any): Promise<CoordinationResponse>;
    /**
     * Coordinate with GOVERNANCE-CORE for budget enforcement
     */
    enforceBudget(executionId: string, currentUsage: any): Promise<CoordinationResponse>;
    /**
     * Register agent capabilities with REGISTRY-CORE
     */
    registerCapabilities(agentId: string, capabilities: any[]): Promise<CoordinationResponse>;
    /**
     * Get platform agent status
     */
    getPlatformAgentStatus(agentId?: string): PlatformAgent | PlatformAgent[];
    /**
     * Update platform agent status
     */
    updateAgentStatus(agentId: string, status: PlatformAgent['status']): void;
    /**
     * Get coordination metrics
     */
    getCoordinationMetrics(): any;
    /**
     * Health check for platform coordination
     */
    healthCheck(): Promise<any>;
    /**
     * Coordinate workflow execution across platform agents
     */
    coordinateWorkflowExecution(executionId: string, workflowData: any): Promise<void>;
}
export default PlatformCoordination;
//# sourceMappingURL=PlatformCoordination.d.ts.map