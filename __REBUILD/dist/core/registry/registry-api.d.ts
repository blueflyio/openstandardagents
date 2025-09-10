import express from 'express';
/**
 * Production-Scale Registry API with Multi-Tenant Support
 *
 * Provides enterprise-grade REST API for OSSA agent registry operations
 * with authentication, authorization, rate limiting, and comprehensive
 * monitoring capabilities.
 */
export declare class RegistryAPI {
    private readonly app;
    private readonly registryCore;
    private readonly capabilityMatcher;
    private readonly healthMonitor;
    private readonly ossaVersion;
    private readonly rateLimits;
    private readonly defaultRateLimit;
    private readonly tenantRateLimits;
    private readonly apiMetrics;
    constructor();
    /**
     * Get the Express application instance
     */
    getApp(): express.Application;
    /**
     * Start the registry API server
     */
    start(port?: number): Promise<void>;
    /**
     * Shutdown the registry API gracefully
     */
    shutdown(): Promise<void>;
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    private authenticateRequest;
    private rateLimitMiddleware;
    private extractTenantInfo;
    private handleHealthCheck;
    private handleAPIDocumentation;
    private handleAgentRegistration;
    private handleDiscoveryQuery;
    private handleMatchingRequest;
    private handleGetAgentHealth;
    private handleUpdateAgentHealth;
    private handleGetRegistryMetrics;
    private handleRankingRequest;
    private handleEnsembleComposition;
    private handleAgentUnregistration;
    private handleGetAgent;
    private handleListAgents;
    private handleUpdateAgentState;
    private handleGetAgentLifecycle;
    private handleHealthReport;
    private handleGetRegistryStatistics;
    private handleGetTenantAgents;
    private handleGetTenantMetrics;
    private updateAverageResponseTime;
}
//# sourceMappingURL=registry-api.d.ts.map