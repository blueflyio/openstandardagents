import { EventEmitter } from 'events';
import { components } from '../../types/api.js';
type ACDLManifest = components['schemas']['ACDLManifest'];
type DiscoveryQuery = components['schemas']['DiscoveryQuery'];
type MatchRequest = components['schemas']['MatchRequest'];
type RegistrationResponse = components['schemas']['RegistrationResponse'];
type DiscoveryResponse = components['schemas']['DiscoveryResponse'];
type MatchResponse = components['schemas']['MatchResponse'];
interface AgentRegistration {
    registrationId: string;
    agentId: string;
    manifest: ACDLManifest;
    registeredAt: Date;
    lastSeen: Date;
    status: 'active' | 'inactive' | 'suspended' | 'deprecated';
    health: {
        score: number;
        lastCheck: Date;
        failures: number;
        consecutiveFailures: number;
    };
    tenant?: string;
    namespace?: string;
    endpoints: {
        protocol: string;
        url: string;
        status: 'healthy' | 'degraded' | 'unhealthy';
        lastChecked: Date;
        responseTime?: number;
    }[];
    metrics: {
        totalRequests: number;
        successfulRequests: number;
        averageResponseTime: number;
        lastRequestTime?: Date;
    };
}
/**
 * REGISTRY-CORE: Global Agent Registry and Discovery Service
 *
 * Implements enterprise-grade agent discovery, capability matching,
 * and registry management for production OSSA deployments v0.1.9-alpha.1.
 */
export declare class RegistryCore extends EventEmitter {
    private readonly ossaVersion;
    private readonly validator;
    private readonly agents;
    private readonly agentsByType;
    private readonly agentsByTenant;
    private readonly capabilityIndex;
    private readonly healthCheckInterval;
    private readonly maxConsecutiveFailures;
    private healthCheckTimer;
    private readonly metrics;
    constructor();
    /**
     * Register an agent with the global registry
     */
    registerAgent(manifest: ACDLManifest, tenant?: string, namespace?: string): Promise<RegistrationResponse>;
    /**
     * Discover agents by capability requirements
     */
    discoverAgents(query: DiscoveryQuery, tenant?: string): Promise<DiscoveryResponse>;
    /**
     * Match agents for specific task requirements
     */
    matchAgents(request: MatchRequest, tenant?: string): Promise<MatchResponse>;
    /**
     * Update agent health status
     */
    updateAgentHealth(agentId: string, healthData: {
        responseTime?: number;
        success: boolean;
        error?: string;
    }): Promise<void>;
    /**
     * Get registry statistics and metrics
     */
    getMetrics(): any;
    /**
     * Get all agents for a specific tenant
     */
    getAgentsByTenant(tenant: string): AgentRegistration[];
    /**
     * Unregister an agent from the registry
     */
    unregisterAgent(agentId: string, reason?: string): Promise<boolean>;
    /**
     * Shutdown the registry service
     */
    shutdown(): Promise<void>;
    private generateRegistrationId;
    private extractEndpoints;
    private updateIndices;
    private removeFromIndices;
    private calculateCapabilityScore;
    private calculateTaskCompatibility;
    private calculatePerformanceScore;
    private generateRecommendation;
    private determineEnsembleRole;
    private updateAgentRegistration;
    private startHealthMonitoring;
    private updateDiscoveryLatency;
    private updateMatchLatency;
}
export {};
//# sourceMappingURL=registry-core.d.ts.map