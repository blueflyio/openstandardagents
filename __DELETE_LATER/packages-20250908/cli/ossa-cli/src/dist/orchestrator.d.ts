#!/usr/bin/env node
/**
 * OSSA v0.1.8 Multi-Agent Orchestration System
 * 93-Agent Deployment Pipeline with Tier-Based Validation
 */
export declare class OSSAOrchestrator {
    private agents;
    private status;
    private workspaceRoot;
    constructor(workspaceRoot?: string);
    private initializeAgents;
    private addAgent;
    private initializeTier1Agents;
    private initializeTier2Agents;
    deploy(): Promise<void>;
    private deployTier;
    private deployAgent;
    private executeTask;
    private runValidation;
    displayStatus(): void;
    private generateStatusReport;
}
