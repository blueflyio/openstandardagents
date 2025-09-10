/**
 * REGISTRY-CORE: Global Agent Registry and Discovery Service
 *
 * Enterprise-grade agent registry implementation for OSSA Platform v0.1.9-alpha.1
 *
 * This module provides:
 * - Global agent registration with ACDL validation
 * - Advanced capability matching and discovery algorithms
 * - Production-scale health monitoring and lifecycle management
 * - Multi-tenant isolation and federation
 * - RESTful API with authentication and rate limiting
 * - Comprehensive metrics and observability
 */
export { RegistryCore } from './registry-core.js';
export { CapabilityMatcher } from './capability-matcher.js';
export { HealthMonitor } from './health-monitor.js';
export { RegistryAPI } from './registry-api.js';
export type { CapabilityMatch, PerformanceMatch, SemanticSimilarity } from './capability-matcher.js';
export type { HealthMetrics, LifecycleEvent, AgentLifecycle } from './health-monitor.js';
/**
 * Production Registry Service Factory
 *
 * Creates and configures a complete registry service instance
 * with all components properly integrated.
 */
export declare class RegistryService {
    private readonly registryAPI;
    constructor();
    /**
     * Start the complete registry service
     */
    start(config?: {
        port?: number;
        enableMetrics?: boolean;
        enableHealthChecks?: boolean;
    }): Promise<void>;
    /**
     * Gracefully shutdown the registry service
     */
    shutdown(): Promise<void>;
    /**
     * Get the Express app instance for custom middleware/routing
     */
    getApp(): any;
}
/**
 * Default registry service instance
 */
export declare const registryService: RegistryService;
/**
 * Quick start function for development
 */
export declare function startRegistry(port?: number): Promise<void>;
//# sourceMappingURL=index.d.ts.map