import { EventEmitter } from 'events';
import { components } from '../../types/api.js';
type ACDLManifest = components['schemas']['ACDLManifest'];
export interface HealthMetrics {
    agentId: string;
    timestamp: Date;
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    score: number;
    availability: number;
    responseTime: {
        p50: number;
        p95: number;
        p99: number;
        current: number;
    };
    errorRate: number;
    throughput: {
        requestsPerSecond: number;
        successfulRequests: number;
        failedRequests: number;
    };
    resources: {
        cpuUsage?: number;
        memoryUsage?: number;
        storageUsage?: number;
    };
    endpoints: Array<{
        protocol: string;
        url: string;
        status: 'healthy' | 'degraded' | 'unhealthy';
        responseTime: number;
        lastChecked: Date;
        errorCount: number;
    }>;
}
export interface LifecycleEvent {
    agentId: string;
    event: 'registered' | 'activated' | 'deactivated' | 'updated' | 'deprecated' | 'unregistered';
    timestamp: Date;
    reason?: string;
    metadata?: any;
}
export interface AgentLifecycle {
    agentId: string;
    currentState: 'registered' | 'active' | 'inactive' | 'suspended' | 'deprecated' | 'terminated';
    registrationDate: Date;
    lastActivated?: Date;
    lastDeactivated?: Date;
    suspensionReason?: string;
    deprecationDate?: Date;
    terminationDate?: Date;
    totalUptime: number;
    stateHistory: LifecycleEvent[];
    healthHistory: HealthMetrics[];
    slaViolations: number;
    performanceTrend: 'improving' | 'stable' | 'degrading' | 'unknown';
}
/**
 * Agent Health Monitor and Lifecycle Manager
 *
 * Provides comprehensive health monitoring, SLA tracking, and lifecycle
 * management for registered OSSA agents in production environments.
 */
export declare class HealthMonitor extends EventEmitter {
    private readonly ossaVersion;
    private readonly healthCheckInterval;
    private readonly healthCheckTimeout;
    private readonly maxHistoryEntries;
    private readonly slaThresholds;
    private readonly agentLifecycles;
    private readonly currentMetrics;
    private readonly healthCheckTimers;
    private readonly trendAnalysis;
    constructor();
    /**
     * Initialize lifecycle tracking for a newly registered agent
     */
    initializeAgent(agentId: string, manifest: ACDLManifest): Promise<void>;
    /**
     * Start health monitoring for an agent
     */
    startHealthMonitoring(agentId: string): Promise<void>;
    /**
     * Perform comprehensive health check for an agent
     */
    performHealthCheck(agentId: string): Promise<HealthMetrics | null>;
    /**
     * Get current health status for an agent
     */
    getAgentHealth(agentId: string): HealthMetrics | null;
    /**
     * Get complete lifecycle information for an agent
     */
    getAgentLifecycle(agentId: string): AgentLifecycle | null;
    /**
     * Update agent state (activate, deactivate, suspend, etc.)
     */
    updateAgentState(agentId: string, newState: AgentLifecycle['currentState'], reason?: string): Promise<boolean>;
    /**
     * Stop health monitoring for an agent
     */
    stopHealthMonitoring(agentId: string): Promise<void>;
    /**
     * Generate health report for an agent or all agents
     */
    generateHealthReport(agentId?: string): any;
    /**
     * Cleanup terminated agent data
     */
    cleanupAgent(agentId: string): Promise<boolean>;
    /**
     * Shutdown the health monitor
     */
    shutdown(): Promise<void>;
    private checkEndpoint;
    private simulateEndpointCheck;
    private calculateHealthScore;
    private determineHealthStatus;
    private calculateAvailability;
    private calculateResponseTimePercentiles;
    private updatePerformanceTrend;
    private checkSLAViolations;
    private updateLifecycleState;
    private mapStateToEvent;
    private generateSingleAgentReport;
    private startSystemHealthCheck;
}
export {};
//# sourceMappingURL=health-monitor.d.ts.map