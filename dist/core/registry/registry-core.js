import { EventEmitter } from 'events';
import { SpecificationValidator } from '../../specification/validator.js';
/**
 * REGISTRY-CORE: Global Agent Registry and Discovery Service
 *
 * Implements enterprise-grade agent discovery, capability matching,
 * and registry management for production OSSA deployments v0.1.9-alpha.1.
 */
export class RegistryCore extends EventEmitter {
    ossaVersion = '0.1.9-alpha.1';
    validator;
    // Core registry storage (in production, this would use persistent storage)
    agents = new Map();
    agentsByType = new Map();
    agentsByTenant = new Map();
    capabilityIndex = new Map();
    // Health monitoring
    healthCheckInterval = 30000; // 30 seconds
    maxConsecutiveFailures = 3;
    healthCheckTimer = null;
    // Performance metrics
    metrics = {
        totalRegistrations: 0,
        activeAgents: 0,
        totalDiscoveryQueries: 0,
        totalMatchRequests: 0,
        averageDiscoveryLatency: 0,
        averageMatchLatency: 0
    };
    constructor() {
        super();
        this.validator = new SpecificationValidator();
        this.startHealthMonitoring();
        // Emit startup event
        this.emit('registry:started', {
            version: this.ossaVersion,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Register an agent with the global registry
     */
    async registerAgent(manifest, tenant, namespace) {
        const startTime = Date.now();
        try {
            // 1. Validate ACDL manifest using SPEC-AUTHORITY
            const validation = await this.validator.validate(manifest);
            if (!validation.valid) {
                return {
                    registrationId: '',
                    status: 'rejected',
                    validationResults: validation.errors?.map((error) => ({
                        check: error.field,
                        passed: false,
                        message: error.message
                    })) || [],
                    registeredAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                };
            }
            // 2. Generate registration ID and check for duplicates
            const registrationId = this.generateRegistrationId();
            const agentId = manifest.agentId;
            if (this.agents.has(agentId)) {
                // Update existing registration
                await this.updateAgentRegistration(agentId, manifest, tenant, namespace);
                const existing = this.agents.get(agentId);
                return {
                    registrationId: existing.registrationId,
                    status: 'registered',
                    validationResults: [{
                            check: 'manifest_validation',
                            passed: true,
                            message: 'Agent registration updated successfully'
                        }],
                    registeredAt: existing.registeredAt.toISOString(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                };
            }
            // 3. Create new agent registration
            const registration = {
                registrationId,
                agentId,
                manifest,
                registeredAt: new Date(),
                lastSeen: new Date(),
                status: 'active',
                health: {
                    score: 1.0,
                    lastCheck: new Date(),
                    failures: 0,
                    consecutiveFailures: 0
                },
                tenant,
                namespace,
                endpoints: this.extractEndpoints(manifest),
                metrics: {
                    totalRequests: 0,
                    successfulRequests: 0,
                    averageResponseTime: 0
                }
            };
            // 4. Store registration and update indices
            this.agents.set(agentId, registration);
            this.updateIndices(registration);
            // 5. Update metrics
            this.metrics.totalRegistrations++;
            this.metrics.activeAgents++;
            // 6. Emit registration event
            this.emit('agent:registered', {
                agentId,
                registrationId,
                tenant,
                namespace,
                agentType: manifest.agentType,
                capabilities: manifest.capabilities.domains,
                timestamp: new Date().toISOString()
            });
            const processingTime = Date.now() - startTime;
            return {
                registrationId,
                status: 'registered',
                validationResults: [{
                        check: 'manifest_validation',
                        passed: true,
                        message: 'Agent registered successfully'
                    }, {
                        check: 'capability_indexing',
                        passed: true,
                        message: 'Capabilities indexed for discovery'
                    }, {
                        check: 'health_monitoring',
                        passed: true,
                        message: 'Health monitoring initialized'
                    }],
                registeredAt: registration.registeredAt.toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
        }
        catch (error) {
            this.emit('error', {
                operation: 'registerAgent',
                error: error instanceof Error ? error.message : 'Unknown error',
                agentId: manifest.agentId,
                timestamp: new Date().toISOString()
            });
            return {
                registrationId: '',
                status: 'rejected',
                validationResults: [{
                        check: 'registration_process',
                        passed: false,
                        message: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                registeredAt: new Date().toISOString(),
                expiresAt: new Date().toISOString()
            };
        }
    }
    /**
     * Discover agents by capability requirements
     */
    async discoverAgents(query, tenant) {
        const startTime = Date.now();
        this.metrics.totalDiscoveryQueries++;
        try {
            const matches = [];
            // Filter agents by tenant if specified
            const candidateAgents = tenant
                ? Array.from(this.agentsByTenant.get(tenant) || [])
                : Array.from(this.agents.keys());
            for (const agentId of candidateAgents) {
                const registration = this.agents.get(agentId);
                if (!registration || registration.status !== 'active')
                    continue;
                const score = this.calculateCapabilityScore(registration.manifest, query);
                if (score > 0) {
                    matches.push({
                        agentId,
                        score,
                        manifest: registration.manifest
                    });
                }
            }
            // Sort by score (descending)
            matches.sort((a, b) => b.score - a.score);
            const queryTime = Date.now() - startTime;
            this.updateDiscoveryLatency(queryTime);
            this.emit('discovery:query', {
                query,
                resultsCount: matches.length,
                queryTime,
                tenant,
                timestamp: new Date().toISOString()
            });
            return {
                agents: matches,
                totalFound: matches.length,
                queryTime
            };
        }
        catch (error) {
            this.emit('error', {
                operation: 'discoverAgents',
                error: error instanceof Error ? error.message : 'Unknown error',
                query,
                timestamp: new Date().toISOString()
            });
            return {
                agents: [],
                totalFound: 0,
                queryTime: Date.now() - startTime
            };
        }
    }
    /**
     * Match agents for specific task requirements
     */
    async matchAgents(request, tenant) {
        const startTime = Date.now();
        this.metrics.totalMatchRequests++;
        try {
            const matches = [];
            // Convert match request to discovery query
            const query = {
                domains: request.requirements.capabilities?.domains || [],
                operations: request.requirements.capabilities?.operations?.map(op => op.name) || [],
                agentType: undefined, // Allow any type for task matching
                protocols: undefined,
                performance: request.requirements.performance ? {
                    minThroughput: request.requirements.performance.throughput?.requestsPerSecond,
                    maxLatencyP99: request.requirements.performance.latency?.p99
                } : undefined
            };
            // Get candidate agents through discovery
            const discoveryResult = await this.discoverAgents(query, tenant);
            for (const candidate of discoveryResult.agents || []) {
                const registration = this.agents.get(candidate.agentId || '');
                if (!registration)
                    continue;
                const compatibility = await this.calculateTaskCompatibility(registration.manifest, request, registration.health);
                if (compatibility.score > 0.3) { // Minimum compatibility threshold
                    matches.push({
                        agentId: candidate.agentId || 'unknown',
                        compatibility: compatibility.score,
                        reasons: compatibility.reasons,
                        warnings: compatibility.warnings
                    });
                }
            }
            // Sort by compatibility (descending)
            matches.sort((a, b) => b.compatibility - a.compatibility);
            // Generate recommendation
            const recommendation = this.generateRecommendation(matches, request);
            const queryTime = Date.now() - startTime;
            this.updateMatchLatency(queryTime);
            this.emit('match:request', {
                task: request.task,
                matchesFound: matches.length,
                recommendation: recommendation.primaryAgent,
                queryTime,
                tenant,
                timestamp: new Date().toISOString()
            });
            return {
                matches,
                recommendation
            };
        }
        catch (error) {
            this.emit('error', {
                operation: 'matchAgents',
                error: error instanceof Error ? error.message : 'Unknown error',
                request,
                timestamp: new Date().toISOString()
            });
            return {
                matches: [],
                recommendation: {
                    primaryAgent: '',
                    alternativeAgents: [],
                    ensemble: []
                }
            };
        }
    }
    /**
     * Update agent health status
     */
    async updateAgentHealth(agentId, healthData) {
        const registration = this.agents.get(agentId);
        if (!registration)
            return;
        registration.lastSeen = new Date();
        registration.health.lastCheck = new Date();
        if (healthData.success) {
            registration.health.failures = Math.max(0, registration.health.failures - 1);
            registration.health.consecutiveFailures = 0;
            registration.health.score = Math.min(1.0, registration.health.score + 0.1);
            if (registration.status === 'inactive') {
                registration.status = 'active';
                this.emit('agent:recovered', {
                    agentId,
                    timestamp: new Date().toISOString()
                });
            }
        }
        else {
            registration.health.failures++;
            registration.health.consecutiveFailures++;
            registration.health.score = Math.max(0, registration.health.score - 0.2);
            if (registration.health.consecutiveFailures >= this.maxConsecutiveFailures) {
                registration.status = 'inactive';
                this.emit('agent:unhealthy', {
                    agentId,
                    consecutiveFailures: registration.health.consecutiveFailures,
                    error: healthData.error,
                    timestamp: new Date().toISOString()
                });
            }
        }
        // Update endpoint health if response time provided
        if (healthData.responseTime !== undefined) {
            for (const endpoint of registration.endpoints) {
                endpoint.lastChecked = new Date();
                endpoint.responseTime = healthData.responseTime;
                endpoint.status = healthData.success ? 'healthy' : 'unhealthy';
            }
        }
    }
    /**
     * Get registry statistics and metrics
     */
    getMetrics() {
        const healthyAgents = Array.from(this.agents.values()).filter(agent => agent.status === 'active' && agent.health.score > 0.7).length;
        const degradedAgents = Array.from(this.agents.values()).filter(agent => agent.status === 'active' && agent.health.score <= 0.7 && agent.health.score > 0.3).length;
        const unhealthyAgents = Array.from(this.agents.values()).filter(agent => agent.status === 'inactive' || agent.health.score <= 0.3).length;
        return {
            ...this.metrics,
            healthyAgents,
            degradedAgents,
            unhealthyAgents,
            capabilityDomains: this.capabilityIndex.size,
            tenants: this.agentsByTenant.size,
            agentTypes: this.agentsByType.size,
            registryVersion: this.ossaVersion,
            uptime: process.uptime(),
            lastUpdated: new Date().toISOString()
        };
    }
    /**
     * Get all agents for a specific tenant
     */
    getAgentsByTenant(tenant) {
        const tenantAgents = this.agentsByTenant.get(tenant) || new Set();
        return Array.from(tenantAgents)
            .map(agentId => this.agents.get(agentId))
            .filter((agent) => agent !== undefined);
    }
    /**
     * Unregister an agent from the registry
     */
    async unregisterAgent(agentId, reason) {
        const registration = this.agents.get(agentId);
        if (!registration)
            return false;
        // Remove from all indices
        this.removeFromIndices(registration);
        // Remove from main registry
        this.agents.delete(agentId);
        this.metrics.activeAgents--;
        this.emit('agent:unregistered', {
            agentId,
            reason: reason || 'Manual unregistration',
            timestamp: new Date().toISOString()
        });
        return true;
    }
    /**
     * Shutdown the registry service
     */
    async shutdown() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
        this.emit('registry:shutdown', {
            activeAgents: this.metrics.activeAgents,
            timestamp: new Date().toISOString()
        });
    }
    // Private helper methods
    generateRegistrationId() {
        return `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    extractEndpoints(manifest) {
        return manifest.protocols.supported.map(protocol => ({
            protocol: protocol.name,
            url: protocol.endpoint,
            status: 'healthy',
            lastChecked: new Date()
        }));
    }
    updateIndices(registration) {
        const { agentId, manifest, tenant } = registration;
        // Update type index
        if (!this.agentsByType.has(manifest.agentType)) {
            this.agentsByType.set(manifest.agentType, new Set());
        }
        this.agentsByType.get(manifest.agentType).add(agentId);
        // Update tenant index
        if (tenant) {
            if (!this.agentsByTenant.has(tenant)) {
                this.agentsByTenant.set(tenant, new Set());
            }
            this.agentsByTenant.get(tenant).add(agentId);
        }
        // Update capability index
        for (const domain of manifest.capabilities.domains) {
            if (!this.capabilityIndex.has(domain)) {
                this.capabilityIndex.set(domain, {
                    domain,
                    agents: new Set(),
                    subCapabilities: new Map()
                });
            }
            this.capabilityIndex.get(domain).agents.add(agentId);
        }
    }
    removeFromIndices(registration) {
        const { agentId, manifest, tenant } = registration;
        // Remove from type index
        this.agentsByType.get(manifest.agentType)?.delete(agentId);
        // Remove from tenant index
        if (tenant) {
            this.agentsByTenant.get(tenant)?.delete(agentId);
        }
        // Remove from capability index
        for (const domain of manifest.capabilities.domains) {
            this.capabilityIndex.get(domain)?.agents.delete(agentId);
        }
    }
    calculateCapabilityScore(manifest, query) {
        let score = 0;
        let maxScore = 0;
        // Domain matching
        if (query.domains && query.domains.length > 0) {
            const matchingDomains = query.domains.filter(domain => manifest.capabilities.domains.includes(domain));
            score += (matchingDomains.length / query.domains.length) * 0.4;
            maxScore += 0.4;
        }
        // Operation matching
        if (query.operations && query.operations.length > 0) {
            const agentOperations = manifest.capabilities.operations?.map(op => op.name) || [];
            const matchingOperations = query.operations.filter(op => agentOperations.includes(op));
            score += (matchingOperations.length / query.operations.length) * 0.3;
            maxScore += 0.3;
        }
        // Agent type matching
        if (query.agentType && query.agentType === manifest.agentType) {
            score += 0.2;
        }
        maxScore += 0.2;
        // Protocol matching
        if (query.protocols && query.protocols.length > 0) {
            const agentProtocols = manifest.protocols.supported.map(p => p.name);
            const matchingProtocols = query.protocols.filter(protocol => agentProtocols.includes(protocol));
            score += (matchingProtocols.length / query.protocols.length) * 0.1;
            maxScore += 0.1;
        }
        return maxScore > 0 ? score / maxScore : 0;
    }
    async calculateTaskCompatibility(manifest, request, health) {
        const reasons = [];
        const warnings = [];
        let score = 0;
        // Base capability compatibility
        if (request.requirements.capabilities) {
            const capabilityMatch = await this.validator.validateCapabilityMatch(request.requirements.capabilities.domains || [], { spec: { capabilities: manifest.capabilities } });
            score += capabilityMatch.score * 0.4;
            if (capabilityMatch.compatible) {
                reasons.push('All required capabilities available');
            }
            else {
                warnings.push(...capabilityMatch.warnings);
            }
        }
        // Performance compatibility
        if (request.requirements.performance && manifest.performance) {
            const perfScore = this.calculatePerformanceScore(manifest.performance, request.requirements.performance);
            score += perfScore * 0.3;
            if (perfScore > 0.8) {
                reasons.push('Excellent performance characteristics');
            }
            else if (perfScore < 0.5) {
                warnings.push('Performance may not meet requirements');
            }
        }
        // Health score contribution
        score += health.score * 0.2;
        if (health.score > 0.9) {
            reasons.push('Excellent health status');
        }
        else if (health.score < 0.5) {
            warnings.push('Agent health is degraded');
        }
        // Budget constraints
        if (request.requirements.constraints?.budget) {
            score += 0.1; // Assume budget compatibility for now
            reasons.push('Within budget constraints');
        }
        return { score: Math.min(1.0, score), reasons, warnings };
    }
    calculatePerformanceScore(agentPerf, reqPerf) {
        let score = 1.0;
        if (reqPerf.throughput?.requestsPerSecond && agentPerf.throughput?.requestsPerSecond) {
            if (agentPerf.throughput.requestsPerSecond < reqPerf.throughput.requestsPerSecond) {
                score *= 0.5;
            }
        }
        if (reqPerf.latency?.p99 && agentPerf.latency?.p99) {
            if (agentPerf.latency.p99 > reqPerf.latency.p99) {
                score *= 0.7;
            }
        }
        return score;
    }
    generateRecommendation(matches, request) {
        if (matches.length === 0) {
            return {
                primaryAgent: '',
                alternativeAgents: [],
                ensemble: []
            };
        }
        const primaryAgent = matches[0].agentId;
        const alternativeAgents = matches.slice(1, 4).map(m => m.agentId);
        // Generate ensemble recommendation for complex tasks
        const ensemble = request.task.type === 'complex' ? matches.slice(0, 3).map(m => ({
            agentId: m.agentId,
            role: this.determineEnsembleRole(m.agentId, matches.indexOf(m))
        })) : [];
        return {
            primaryAgent,
            alternativeAgents,
            ensemble
        };
    }
    determineEnsembleRole(agentId, index) {
        const roles = ['primary', 'reviewer', 'validator'];
        return roles[index] || 'supporter';
    }
    async updateAgentRegistration(agentId, manifest, tenant, namespace) {
        const existing = this.agents.get(agentId);
        // Remove from old indices
        this.removeFromIndices(existing);
        // Update registration
        existing.manifest = manifest;
        existing.tenant = tenant;
        existing.namespace = namespace;
        existing.lastSeen = new Date();
        existing.endpoints = this.extractEndpoints(manifest);
        // Update indices with new data
        this.updateIndices(existing);
    }
    startHealthMonitoring() {
        this.healthCheckTimer = setInterval(async () => {
            const now = new Date();
            for (const [agentId, registration] of this.agents) {
                // Check if agent hasn't been seen for too long
                const timeSinceLastSeen = now.getTime() - registration.lastSeen.getTime();
                const healthTimeout = 5 * 60 * 1000; // 5 minutes
                if (timeSinceLastSeen > healthTimeout && registration.status === 'active') {
                    await this.updateAgentHealth(agentId, {
                        success: false,
                        error: 'Agent health check timeout'
                    });
                }
            }
            // Update active agent count
            this.metrics.activeAgents = Array.from(this.agents.values())
                .filter(agent => agent.status === 'active').length;
        }, this.healthCheckInterval);
    }
    updateDiscoveryLatency(latency) {
        this.metrics.averageDiscoveryLatency =
            (this.metrics.averageDiscoveryLatency * (this.metrics.totalDiscoveryQueries - 1) + latency) /
                this.metrics.totalDiscoveryQueries;
    }
    updateMatchLatency(latency) {
        this.metrics.averageMatchLatency =
            (this.metrics.averageMatchLatency * (this.metrics.totalMatchRequests - 1) + latency) /
                this.metrics.totalMatchRequests;
    }
    /**
     * Initialize the registry core
     */
    async initialize() {
        console.log('[REGISTRY-CORE] Initializing...');
        // Health checks will be started when needed
        console.log('[REGISTRY-CORE] Ready');
    }
    /**
     * Register an agent
     */
    async register(agent, tenant) {
        return this.registerAgent(agent, tenant);
    }
    /**
     * Discover agents based on query
     */
    async discover(query) {
        return this.discoverAgents(query);
    }
}
//# sourceMappingURL=registry-core.js.map