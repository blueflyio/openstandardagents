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

// Re-export types for convenience
export type {
  CapabilityMatch,
  PerformanceMatch,
  SemanticSimilarity
} from './capability-matcher.js';

export type {
  HealthMetrics,
  LifecycleEvent,
  AgentLifecycle
} from './health-monitor.js';

/**
 * Production Registry Service Factory
 * 
 * Creates and configures a complete registry service instance
 * with all components properly integrated.
 */
export class RegistryService {
  private readonly registryAPI: any;
  
  constructor() {
    const { RegistryAPI } = require('./registry-api.js');
    this.registryAPI = new RegistryAPI();
  }

  /**
   * Start the complete registry service
   */
  async start(config?: {
    port?: number;
    enableMetrics?: boolean;
    enableHealthChecks?: boolean;
  }): Promise<void> {
    const { port = 8080, enableMetrics = true, enableHealthChecks = true } = config || {};
    
    console.log('🚀 Starting OSSA Registry Service...');
    console.log(`📋 Version: 0.1.9-alpha.1`);
    console.log(`🌐 Port: ${port}`);
    console.log(`📊 Metrics: ${enableMetrics ? 'enabled' : 'disabled'}`);
    console.log(`❤️  Health Checks: ${enableHealthChecks ? 'enabled' : 'disabled'}`);
    
    await this.registryAPI.start(port);
    
    console.log('✅ OSSA Registry Service started successfully');
    console.log('🔍 Ready to accept agent registrations and discovery requests');
  }

  /**
   * Gracefully shutdown the registry service
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down OSSA Registry Service...');
    await this.registryAPI.shutdown();
    console.log('✅ Registry Service shutdown complete');
  }

  /**
   * Get the Express app instance for custom middleware/routing
   */
  getApp() {
    return this.registryAPI.getApp();
  }
}

/**
 * Default registry service instance
 */
export const registryService = new RegistryService();

/**
 * Quick start function for development
 */
export async function startRegistry(port: number = 8080): Promise<void> {
  await registryService.start({ port });
}