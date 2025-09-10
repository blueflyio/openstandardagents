/**
 * OSSA Workspace Auditor Service
 * Monitors and audits .agents-workspace directories
 */
import { EventEmitter } from 'events';
export interface AgentConfig {
    name: string;
    version: string;
    path: string;
    status: 'valid' | 'invalid' | 'warning';
    issues: string[];
    lastChecked: Date;
}
export interface AuditReport {
    timestamp: Date;
    workspacePath: string;
    agents: AgentConfig[];
    summary: {
        total: number;
        valid: number;
        invalid: number;
        warnings: number;
    };
}
export declare class WorkspaceAuditor extends EventEmitter {
    private workspacePath;
    private auditInterval;
    private lastReport;
    constructor(workspacePath?: string);
    /**
     * Start background auditing
     */
    startAuditing(intervalMs?: number): void;
    /**
     * Stop auditing
     */
    stopAuditing(): void;
    /**
     * Perform workspace audit
     */
    private performAudit;
    /**
     * Find all .agents directories
     */
    private findAgentDirectories;
    /**
     * Audit individual agent directory
     */
    private auditAgentDirectory;
    /**
     * Save audit report
     */
    private saveReport;
    /**
     * Get last audit report
     */
    getLastReport(): AuditReport | null;
    /**
     * Get audit health status
     */
    getHealthStatus(): {
        healthy: boolean;
        message: string;
    };
}
