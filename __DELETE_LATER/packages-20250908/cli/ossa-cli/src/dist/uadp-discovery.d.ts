/**
 * Universal Agent Discovery Protocol (UADP) Implementation
 * OSSA v0.1.8 compliant agent discovery system
 */
import { EventEmitter } from 'events';
export interface UADPAgent {
    id: string;
    name: string;
    version: string;
    endpoint: string;
    health_endpoint: string;
    capabilities_endpoint: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    last_seen: string;
    registration_time: string;
    metadata: {
        class: string;
        category: string;
        conformance_tier: 'core' | 'governed' | 'advanced';
        certification_level?: 'bronze' | 'silver' | 'gold';
    };
    capabilities: string[];
    protocols: Array<{
        name: string;
        version: string;
        required: boolean;
        endpoints?: Record<string, string>;
    }>;
    compliance_frameworks?: string[];
    performance_metrics: {
        avg_response_time_ms: number;
        uptime_percentage: number;
        requests_handled: number;
        success_rate: number;
    };
    framework_integrations?: Record<string, any>;
}
export interface UADPDiscoveryOptions {
    capabilities?: string[];
    protocols?: string[];
    performance_tier?: 'bronze' | 'silver' | 'gold';
    conformance_tier?: 'core' | 'governed' | 'advanced';
    compliance_frameworks?: string[];
    health_status?: 'healthy' | 'degraded' | 'unhealthy';
    max_results?: number;
    include_inactive?: boolean;
}
export interface UADPRegistry {
    agents: Record<string, UADPAgent>;
    discovery_metadata: {
        uadp_version: string;
        hierarchical_discovery: boolean;
        capability_matching: boolean;
        performance_ranking: boolean;
        health_monitoring: {
            enabled: boolean;
            interval_seconds: number;
            timeout_seconds: number;
            failure_threshold: number;
        };
        cache_settings: {
            ttl_seconds: number;
            max_entries: number;
            eviction_policy: string;
        };
    };
    registry_stats: {
        total_agents: number;
        healthy_agents: number;
        discoveries_today: number;
        avg_discovery_time_ms: number;
        protocol_distribution: Record<string, number>;
    };
}
export declare class UADPDiscoveryEngine extends EventEmitter {
    private registryUrl?;
    private options;
    private registry;
    private httpClient;
    private healthCheckInterval;
    private cacheMap;
    constructor(registryUrl?: string | undefined, options?: {
        healthCheckInterval?: number;
        cacheTimeout?: number;
        maxCacheEntries?: number;
        requestTimeout?: number;
    });
    /**
     * Register an agent in the UADP registry
     */
    registerAgent(agent: Omit<UADPAgent, 'id' | 'registration_time' | 'last_seen'>): Promise<string>;
    /**
     * Discover agents using UADP protocol with advanced filtering
     */
    discoverAgents(options?: UADPDiscoveryOptions): Promise<{
        agents: UADPAgent[];
        discovery_time_ms: number;
        total_found: number;
        performance_ranking: boolean;
    }>;
    /**
     * Get specific agent by ID
     */
    getAgent(agentId: string): Promise<UADPAgent | null>;
    /**
     * Get agent capabilities
     */
    getAgentCapabilities(agentId: string): Promise<string[] | null>;
    /**
     * Health check specific agent
     */
    healthCheckAgent(agentId: string): Promise<boolean>;
    /**
     * Get comprehensive registry statistics
     */
    getRegistryStats(): UADPRegistry['registry_stats'];
    /**
     * Export registry in OSSA 0.1.8 format
     */
    exportRegistry(): UADPRegistry;
    /**
     * Import registry from OSSA 0.1.8 format
     */
    importRegistry(registryData: UADPRegistry): Promise<void>;
    /**
     * Get cached discovery results
     */
    private getCachedResult;
    /**
     * Set cached discovery results
     */
    private setCachedResult;
    /**
     * Start health monitoring for all registered agents
     */
    private startHealthMonitoring;
    /**
     * Stop health monitoring
     */
    stopHealthMonitoring(): void;
    /**
     * Validate agent compliance with OSSA 0.1.8 standard
     */
    private validateAgentCompliance;
    /**
     * Generate unique agent ID
     */
    private generateAgentId;
    /**
     * Calculate performance score for ranking
     */
    private calculatePerformanceScore;
    /**
     * Get performance tier based on metrics
     */
    private getPerformanceTier;
    /**
     * Check if tier A is higher than tier B
     */
    private isHigherTier;
    /**
     * Check if conformance tier A is higher than tier B
     */
    private isHigherConformanceTier;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export default UADPDiscoveryEngine;
