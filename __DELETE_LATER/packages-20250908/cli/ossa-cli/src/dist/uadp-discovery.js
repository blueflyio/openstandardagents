/**
 * Universal Agent Discovery Protocol (UADP) Implementation
 * OSSA v0.1.8 compliant agent discovery system
 */
import { EventEmitter } from 'events';
import axios from 'axios';
export class UADPDiscoveryEngine extends EventEmitter {
    constructor(registryUrl, options = {}) {
        super();
        this.registryUrl = registryUrl;
        this.options = options;
        this.healthCheckInterval = null;
        this.cacheMap = new Map();
        this.registry = {
            agents: {},
            discovery_metadata: {
                uadp_version: '0.1.8',
                hierarchical_discovery: true,
                capability_matching: true,
                performance_ranking: true,
                health_monitoring: {
                    enabled: true,
                    interval_seconds: options.healthCheckInterval || 10,
                    timeout_seconds: 5,
                    failure_threshold: 3
                },
                cache_settings: {
                    ttl_seconds: options.cacheTimeout || 300,
                    max_entries: options.maxCacheEntries || 10000,
                    eviction_policy: 'lru'
                }
            },
            registry_stats: {
                total_agents: 0,
                healthy_agents: 0,
                discoveries_today: 0,
                avg_discovery_time_ms: 0,
                protocol_distribution: {}
            }
        };
        this.httpClient = axios.create({
            timeout: options.requestTimeout || 5000,
            headers: {
                'User-Agent': 'OSSA-UADP-Discovery/0.1.8',
                'Content-Type': 'application/json'
            }
        });
        this.startHealthMonitoring();
    }
    /**
     * Register an agent in the UADP registry
     */
    async registerAgent(agent) {
        const agentId = this.generateAgentId(agent.name, agent.version);
        const now = new Date().toISOString();
        const fullAgent = {
            ...agent,
            id: agentId,
            registration_time: now,
            last_seen: now
        };
        // Validate agent against OSSA 0.1.8 standard
        await this.validateAgentCompliance(fullAgent);
        this.registry.agents[agentId] = fullAgent;
        this.registry.registry_stats.total_agents = Object.keys(this.registry.agents).length;
        if (agent.status === 'healthy') {
            this.registry.registry_stats.healthy_agents++;
        }
        // Update protocol distribution
        agent.protocols.forEach(protocol => {
            this.registry.registry_stats.protocol_distribution[protocol.name] =
                (this.registry.registry_stats.protocol_distribution[protocol.name] || 0) + 1;
        });
        this.emit('agentRegistered', { agentId, agent: fullAgent });
        return agentId;
    }
    /**
     * Discover agents using UADP protocol with advanced filtering
     */
    async discoverAgents(options = {}) {
        const startTime = Date.now();
        let filteredAgents = Object.values(this.registry.agents);
        // Apply filters
        if (options.capabilities?.length) {
            filteredAgents = filteredAgents.filter(agent => options.capabilities.some(cap => agent.capabilities.includes(cap)));
        }
        if (options.protocols?.length) {
            filteredAgents = filteredAgents.filter(agent => options.protocols.some(protocol => agent.protocols.some(p => p.name === protocol)));
        }
        if (options.performance_tier) {
            filteredAgents = filteredAgents.filter(agent => this.getPerformanceTier(agent) === options.performance_tier ||
                this.isHigherTier(this.getPerformanceTier(agent), options.performance_tier));
        }
        if (options.conformance_tier) {
            filteredAgents = filteredAgents.filter(agent => agent.metadata.conformance_tier === options.conformance_tier ||
                this.isHigherConformanceTier(agent.metadata.conformance_tier, options.conformance_tier));
        }
        if (options.compliance_frameworks?.length) {
            filteredAgents = filteredAgents.filter(agent => agent.compliance_frameworks &&
                options.compliance_frameworks.some(framework => agent.compliance_frameworks.includes(framework)));
        }
        if (options.health_status) {
            filteredAgents = filteredAgents.filter(agent => agent.status === options.health_status);
        }
        if (!options.include_inactive) {
            filteredAgents = filteredAgents.filter(agent => agent.status === 'healthy');
        }
        // Performance ranking
        filteredAgents.sort((a, b) => {
            const scoreA = this.calculatePerformanceScore(a);
            const scoreB = this.calculatePerformanceScore(b);
            return scoreB - scoreA; // Higher scores first
        });
        // Limit results
        if (options.max_results) {
            filteredAgents = filteredAgents.slice(0, options.max_results);
        }
        const discoveryTime = Date.now() - startTime;
        this.registry.registry_stats.discoveries_today++;
        this.registry.registry_stats.avg_discovery_time_ms =
            (this.registry.registry_stats.avg_discovery_time_ms + discoveryTime) / 2;
        this.emit('discoveryCompleted', {
            agentCount: filteredAgents.length,
            discoveryTime,
            options
        });
        return {
            agents: filteredAgents,
            discovery_time_ms: discoveryTime,
            total_found: filteredAgents.length,
            performance_ranking: true
        };
    }
    /**
     * Get specific agent by ID
     */
    async getAgent(agentId) {
        return this.registry.agents[agentId] || null;
    }
    /**
     * Get agent capabilities
     */
    async getAgentCapabilities(agentId) {
        const agent = this.registry.agents[agentId];
        return agent ? agent.capabilities : null;
    }
    /**
     * Health check specific agent
     */
    async healthCheckAgent(agentId) {
        const agent = this.registry.agents[agentId];
        if (!agent)
            return false;
        try {
            const response = await this.httpClient.get(agent.health_endpoint, {
                timeout: this.registry.discovery_metadata.health_monitoring.timeout_seconds * 1000
            });
            const isHealthy = response.status === 200;
            const previousStatus = agent.status;
            agent.status = isHealthy ? 'healthy' : 'degraded';
            agent.last_seen = new Date().toISOString();
            if (previousStatus !== agent.status) {
                this.emit('agentStatusChanged', { agentId, oldStatus: previousStatus, newStatus: agent.status });
            }
            return isHealthy;
        }
        catch (error) {
            agent.status = 'unhealthy';
            this.emit('agentUnhealthy', { agentId, error: error.message });
            return false;
        }
    }
    /**
     * Get comprehensive registry statistics
     */
    getRegistryStats() {
        return {
            ...this.registry.registry_stats,
            total_agents: Object.keys(this.registry.agents).length,
            healthy_agents: Object.values(this.registry.agents).filter(a => a.status === 'healthy').length
        };
    }
    /**
     * Export registry in OSSA 0.1.8 format
     */
    exportRegistry() {
        return JSON.parse(JSON.stringify(this.registry));
    }
    /**
     * Import registry from OSSA 0.1.8 format
     */
    async importRegistry(registryData) {
        // Validate registry format
        if (registryData.discovery_metadata?.uadp_version !== '0.1.8') {
            throw new Error('Invalid UADP version. Expected 0.1.8');
        }
        this.registry = registryData;
        this.emit('registryImported', { agentCount: Object.keys(registryData.agents).length });
    }
    /**
     * Get cached discovery results
     */
    getCachedResult(cacheKey) {
        const cached = this.cacheMap.get(cacheKey);
        if (cached && Date.now() < cached.expiry) {
            return cached.data;
        }
        this.cacheMap.delete(cacheKey);
        return null;
    }
    /**
     * Set cached discovery results
     */
    setCachedResult(cacheKey, data) {
        const expiry = Date.now() + (this.registry.discovery_metadata.cache_settings.ttl_seconds * 1000);
        // Implement LRU eviction if cache is full
        if (this.cacheMap.size >= this.registry.discovery_metadata.cache_settings.max_entries) {
            const firstKey = this.cacheMap.keys().next().value;
            if (firstKey) {
                this.cacheMap.delete(firstKey);
            }
        }
        this.cacheMap.set(cacheKey, { data, expiry });
    }
    /**
     * Start health monitoring for all registered agents
     */
    startHealthMonitoring() {
        if (!this.registry.discovery_metadata.health_monitoring.enabled)
            return;
        const intervalMs = this.registry.discovery_metadata.health_monitoring.interval_seconds * 1000;
        this.healthCheckInterval = setInterval(async () => {
            const agents = Object.keys(this.registry.agents);
            const healthPromises = agents.map(agentId => this.healthCheckAgent(agentId));
            try {
                await Promise.allSettled(healthPromises);
            }
            catch (error) {
                this.emit('healthCheckError', { error: error.message });
            }
        }, intervalMs);
    }
    /**
     * Stop health monitoring
     */
    stopHealthMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }
    /**
     * Validate agent compliance with OSSA 0.1.8 standard
     */
    async validateAgentCompliance(agent) {
        // Basic OSSA 0.1.8 validation
        if (!agent.name || !agent.version || !agent.endpoint) {
            throw new Error('Agent missing required fields: name, version, endpoint');
        }
        if (!agent.capabilities || agent.capabilities.length === 0) {
            throw new Error('Agent must declare at least one capability');
        }
        if (!agent.protocols || agent.protocols.length === 0) {
            throw new Error('Agent must support at least one protocol');
        }
        // Ensure OpenAPI protocol is supported (required by OSSA 0.1.8)
        const supportsOpenAPI = agent.protocols.some(p => p.name === 'openapi');
        if (!supportsOpenAPI) {
            throw new Error('Agent must support OpenAPI protocol (OSSA 0.1.8 requirement)');
        }
        // Validate conformance tier
        const validTiers = ['core', 'governed', 'advanced'];
        if (!validTiers.includes(agent.metadata.conformance_tier)) {
            throw new Error(`Invalid conformance tier: ${agent.metadata.conformance_tier}`);
        }
        // Additional validations for higher tiers
        if (agent.metadata.conformance_tier === 'governed' || agent.metadata.conformance_tier === 'advanced') {
            if (!agent.compliance_frameworks || agent.compliance_frameworks.length === 0) {
                throw new Error('Governed and Advanced tier agents must declare compliance frameworks');
            }
        }
    }
    /**
     * Generate unique agent ID
     */
    generateAgentId(name, version) {
        const timestamp = Date.now();
        const hash = Buffer.from(`${name}-${version}-${timestamp}`).toString('base64url');
        return `ossa-${hash.substring(0, 8)}`;
    }
    /**
     * Calculate performance score for ranking
     */
    calculatePerformanceScore(agent) {
        const metrics = agent.performance_metrics;
        // Weighted scoring: uptime (40%), success rate (40%), response time (20%)
        const uptimeScore = metrics.uptime_percentage / 100;
        const successScore = metrics.success_rate;
        const responseScore = Math.max(0, 1 - (metrics.avg_response_time_ms / 1000)); // Normalize to 1 second max
        return (uptimeScore * 0.4) + (successScore * 0.4) + (responseScore * 0.2);
    }
    /**
     * Get performance tier based on metrics
     */
    getPerformanceTier(agent) {
        const score = this.calculatePerformanceScore(agent);
        if (score >= 0.9)
            return 'gold';
        if (score >= 0.7)
            return 'silver';
        return 'bronze';
    }
    /**
     * Check if tier A is higher than tier B
     */
    isHigherTier(tierA, tierB) {
        const tierOrder = { 'bronze': 1, 'silver': 2, 'gold': 3 };
        return tierOrder[tierA] > tierOrder[tierB];
    }
    /**
     * Check if conformance tier A is higher than tier B
     */
    isHigherConformanceTier(tierA, tierB) {
        const tierOrder = { 'core': 1, 'governed': 2, 'advanced': 3 };
        return tierOrder[tierA] > tierOrder[tierB];
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.stopHealthMonitoring();
        this.cacheMap.clear();
        this.removeAllListeners();
    }
}
// Export for use in other modules
export default UADPDiscoveryEngine;
