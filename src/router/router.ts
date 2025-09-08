/**
 * OSSA Router Factory
 * Creates high-performance multi-protocol agent discovery router
 */

import { EventEmitter } from 'events';
import { DiscoveryEngine } from './discovery/engine';
import { PerformanceOptimizer } from './optimization/performance';
import { RESTProtocol } from './protocols/rest';
import { GraphQLProtocol } from './protocols/graphql';
import { GRPCProtocol } from './protocols/grpc';
import { RouterConfig, OSSAAgent, PerformanceMetrics } from './types';

export class OSSARouter extends EventEmitter {
  private discoveryEngine: DiscoveryEngine;
  private performanceOptimizer: PerformanceOptimizer;
  private restProtocol?: RESTProtocol;
  private graphqlProtocol?: GraphQLProtocol;
  private grpcProtocol?: GRPCProtocol;
  private config: RouterConfig;
  private startTime: Date;
  private isRunning = false;

  constructor(config: RouterConfig) {
    super();
    this.config = config;
    this.startTime = new Date();
    
    // Initialize core components
    this.discoveryEngine = new DiscoveryEngine({
      cacheTimeout: config.discovery.cacheTimeout,
      maxCacheEntries: config.discovery.maxCacheEntries,
      healthCheckInterval: config.discovery.healthCheckInterval,
      indexingEnabled: config.discovery.indexingEnabled,
    });

    this.performanceOptimizer = new PerformanceOptimizer({
      targetResponseTime: config.performance.targetResponseTime,
      maxConcurrentQueries: config.performance.maxConcurrentQueries,
      batchSize: config.performance.batchSize,
      compressionEnabled: config.performance.compressionEnabled,
    });

    this.setupEventHandlers();
  }

  /**
   * Start the router with all enabled protocols
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Router is already running');
    }

    try {
      // Start discovery engine
      await this.discoveryEngine.start();

      // Start performance optimizer
      await this.performanceOptimizer.start();

      // Initialize protocols based on configuration
      await this.initializeProtocols();

      this.isRunning = true;
      this.emit('started', { timestamp: new Date() });
      
      console.log('🚀 OSSA Router started successfully');
      console.log(`📊 Performance target: <${this.config.performance.targetResponseTime}ms`);
      console.log(`🔍 Discovery engine: ${this.config.discovery.indexingEnabled ? 'indexed' : 'basic'}`);
      
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Failed to start OSSA Router: ${(error as Error).message}`);
    }
  }

  /**
   * Stop the router and cleanup resources
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // Stop protocols
      if (this.restProtocol) await this.restProtocol.stop();
      if (this.graphqlProtocol) await this.graphqlProtocol.stop();
      if (this.grpcProtocol) await this.grpcProtocol.stop();

      // Stop core components
      await this.performanceOptimizer.stop();
      await this.discoveryEngine.stop();

      this.isRunning = false;
      this.emit('stopped', { timestamp: new Date() });
      
      console.log('🛑 OSSA Router stopped');
      
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Failed to stop OSSA Router: ${(error as Error).message}`);
    }
  }

  /**
   * Register a new agent
   */
  async registerAgent(agent: Omit<OSSAAgent, 'id' | 'registrationTime' | 'lastSeen'>): Promise<string> {
    const startTime = performance.now();
    
    try {
      const agentId = await this.discoveryEngine.registerAgent(agent);
      
      const registrationTime = performance.now() - startTime;
      this.performanceOptimizer.recordMetric('agent_registration', registrationTime);
      
      this.emit('agent_registered', { agentId, agent, registrationTime });
      return agentId;
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Discover agents with performance optimization
   */
  async discoverAgents(query: any): Promise<any> {
    const startTime = performance.now();
    
    try {
      // Use performance optimizer for query execution
      const result = await this.performanceOptimizer.executeOptimizedQuery(
        () => this.discoveryEngine.discoverAgents(query)
      );
      
      const discoveryTime = performance.now() - startTime;
      this.performanceOptimizer.recordMetric('discovery_query', discoveryTime);
      
      this.emit('discovery_completed', { 
        query, 
        result, 
        discoveryTime,
        cacheHit: result.cache?.hit 
      });
      
      return {
        ...result,
        discoveryTimeMs: discoveryTime
      };
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<OSSAAgent | null> {
    return this.discoveryEngine.getAgent(agentId);
  }

  /**
   * Update agent information
   */
  async updateAgent(agentId: string, updates: Partial<OSSAAgent>): Promise<void> {
    await this.discoveryEngine.updateAgent(agentId, updates);
    this.emit('agent_updated', { agentId, updates });
  }

  /**
   * Remove agent from registry
   */
  async removeAgent(agentId: string): Promise<void> {
    await this.discoveryEngine.removeAgent(agentId);
    this.emit('agent_removed', { agentId });
  }

  /**
   * Get comprehensive router metrics
   */
  getMetrics(): PerformanceMetrics & { uptime: number; protocols: string[] } {
    const baseMetrics = this.performanceOptimizer.getMetrics();
    const uptime = Date.now() - this.startTime.getTime();
    
    const protocols: string[] = [];
    if (this.restProtocol) protocols.push('REST');
    if (this.graphqlProtocol) protocols.push('GraphQL');
    if (this.grpcProtocol) protocols.push('gRPC');
    
    return {
      ...baseMetrics,
      uptime,
      protocols
    };
  }

  /**
   * Get router health status
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    version: string;
    services: Record<string, string>;
    performance: {
      avgResponseTime: number;
      p95ResponseTime: number;
      cacheHitRate: number;
    };
  }> {
    const metrics = this.getMetrics();
    const uptime = Date.now() - this.startTime.getTime();
    
    // Determine overall health based on performance metrics
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (metrics.avgResponseTime > this.config.performance.targetResponseTime * 2) {
      status = 'unhealthy';
    } else if (metrics.avgResponseTime > this.config.performance.targetResponseTime * 1.5) {
      status = 'degraded';
    }

    return {
      status,
      uptime,
      version: '0.1.8',
      services: {
        discovery_engine: this.discoveryEngine.isHealthy() ? 'healthy' : 'unhealthy',
        performance_optimizer: this.performanceOptimizer.isHealthy() ? 'healthy' : 'unhealthy',
        rest_protocol: this.restProtocol?.isHealthy() ? 'healthy' : 'disabled',
        graphql_protocol: this.graphqlProtocol?.isHealthy() ? 'healthy' : 'disabled',
        grpc_protocol: this.grpcProtocol?.isHealthy() ? 'healthy' : 'disabled',
      },
      performance: {
        avgResponseTime: metrics.avgResponseTime,
        p95ResponseTime: metrics.p95ResponseTime,
        cacheHitRate: metrics.cacheHitRate,
      }
    };
  }

  /**
   * Initialize protocol handlers based on configuration
   */
  private async initializeProtocols(): Promise<void> {
    // Initialize REST protocol
    this.restProtocol = new RESTProtocol(this.config.protocols.rest, this);
    await this.restProtocol.start();

    // Initialize GraphQL protocol if enabled
    if (this.config.protocols.graphql.enabled) {
      this.graphqlProtocol = new GraphQLProtocol(this.config.protocols.graphql, this);
      await this.graphqlProtocol.start();
    }

    // Initialize gRPC protocol if enabled
    if (this.config.protocols.grpc.enabled) {
      this.grpcProtocol = new GRPCProtocol(this.config.protocols.grpc, this);
      await this.grpcProtocol.start();
    }
  }

  /**
   * Setup event handlers for cross-component communication
   */
  private setupEventHandlers(): void {
    this.discoveryEngine.on('agent_registered', (event) => {
      this.emit('agent_registered', event);
    });

    this.discoveryEngine.on('agent_health_changed', (event) => {
      this.emit('agent_health_changed', event);
    });

    this.performanceOptimizer.on('performance_warning', (event) => {
      this.emit('performance_warning', event);
    });

    this.performanceOptimizer.on('threshold_exceeded', (event) => {
      this.emit('threshold_exceeded', event);
    });
  }
}

/**
 * Factory function to create and configure OSSA Router
 */
export function createOSSARouter(config: Partial<RouterConfig> = {}): OSSARouter {
  const defaultConfig: RouterConfig = {
    protocols: {
      rest: {
        port: 3000,
        basePath: '/api/v1',
        cors: true,
        rateLimit: {
          requests: 1000,
          window: 60000, // 1 minute
        },
      },
      graphql: {
        enabled: true,
        endpoint: '/graphql',
        subscriptions: true,
        introspection: true,
        playground: false,
      },
      grpc: {
        enabled: true,
        port: 50051,
        reflection: true,
        compression: true,
      },
    },
    discovery: {
      cacheTimeout: 300000, // 5 minutes
      maxCacheEntries: 10000,
      healthCheckInterval: 30000, // 30 seconds
      indexingEnabled: true,
    },
    performance: {
      targetResponseTime: 100, // 100ms
      maxConcurrentQueries: 1000,
      batchSize: 50,
      compressionEnabled: true,
    },
    clustering: {
      enabled: false,
    },
  };

  // Deep merge configuration
  const mergedConfig = mergeConfigs(defaultConfig, config);
  
  return new OSSARouter(mergedConfig);
}

/**
 * Deep merge configuration objects
 */
function mergeConfigs(target: RouterConfig, source: Partial<RouterConfig>): RouterConfig {
  const result = { ...target };
  
  for (const key in source) {
    const sourceValue = (source as any)[key];
    const targetValue = (result as any)[key];
    
    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      (result as any)[key] = { ...targetValue, ...sourceValue };
    } else if (sourceValue !== undefined) {
      (result as any)[key] = sourceValue;
    }
  }
  
  return result;
}