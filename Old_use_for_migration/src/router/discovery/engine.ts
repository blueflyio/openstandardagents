/**
 * OSSA Discovery Engine
 * High-performance agent discovery with advanced caching and optimization
 */

import { EventEmitter } from 'events';
import { CapabilityMatcher } from './capability-matcher';
import { HealthMonitor } from './health-monitor';
import { AgentRegistry } from './registry';
import { CacheManager } from '../optimization/cache';
import { IndexManager } from '../optimization/indexing';
import { 
  OSSAAgent, 
  DiscoveryQuery, 
  DiscoveryResult, 
  CapabilityMatch, 
  HealthCheckResult,
  RouterEvent 
} from '../types';

export interface DiscoveryEngineConfig {
  cacheTimeout: number;
  maxCacheEntries: number;
  healthCheckInterval: number;
  indexingEnabled: boolean;
  batchSize?: number;
  maxConcurrentQueries?: number;
}

export class DiscoveryEngine extends EventEmitter {
  private registry: AgentRegistry;
  private capabilityMatcher: CapabilityMatcher;
  private healthMonitor: HealthMonitor;
  private cacheManager: CacheManager;
  private indexManager?: IndexManager;
  private config: DiscoveryEngineConfig;
  private isRunning = false;
  private queryQueue: Array<() => Promise<any>> = [];
  private activeQueries = 0;

  // Performance metrics
  private metrics = {
    totalQueries: 0,
    cacheHits: 0,
    avgQueryTime: 0,
    totalQueryTime: 0,
    errors: 0,
  };

  constructor(config: DiscoveryEngineConfig) {
    super();
    this.config = config;

    // Initialize core components
    this.registry = new AgentRegistry();
    this.capabilityMatcher = new CapabilityMatcher();
    this.healthMonitor = new HealthMonitor({
      interval: config.healthCheckInterval,
      timeout: 5000,
      retryAttempts: 3,
    });
    
    this.cacheManager = new CacheManager({
      maxEntries: config.maxCacheEntries,
      ttl: config.cacheTimeout,
      compressionEnabled: true,
    });

    if (config.indexingEnabled) {
      this.indexManager = new IndexManager({
        updateInterval: 60000, // 1 minute
        batchSize: config.batchSize || 100,
      });
    }

    this.setupEventHandlers();
  }

  /**
   * Start the discovery engine
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    try {
      await this.healthMonitor.start();
      await this.cacheManager.start();
      
      if (this.indexManager) {
        await this.indexManager.start();
      }

      this.isRunning = true;
      this.emit('started', { timestamp: new Date() });
      
      console.log('🔍 Discovery Engine started successfully');
    } catch (error) {
      throw new Error(`Failed to start Discovery Engine: ${(error as Error).message}`);
    }
  }

  /**
   * Stop the discovery engine
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // Wait for active queries to complete
      while (this.activeQueries > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await this.healthMonitor.stop();
      await this.cacheManager.stop();
      
      if (this.indexManager) {
        await this.indexManager.stop();
      }

      this.isRunning = false;
      this.emit('stopped', { timestamp: new Date() });
      
      console.log('🛑 Discovery Engine stopped');
    } catch (error) {
      console.error('Error stopping Discovery Engine:', error);
    }
  }

  /**
   * Register a new agent
   */
  async registerAgent(agentData: Omit<OSSAAgent, 'id' | 'registrationTime' | 'lastSeen'>): Promise<string> {
    const startTime = performance.now();
    
    try {
      // Generate agent ID and set timestamps
      const agent: OSSAAgent = {
        ...agentData,
        id: this.generateAgentId(),
        registrationTime: new Date(),
        lastSeen: new Date(),
      };

      // Validate agent data
      this.validateAgent(agent);

      // Register in registry
      await this.registry.addAgent(agent);

      // Update indexes if enabled
      if (this.indexManager) {
        await this.indexManager.updateAgentIndex(agent);
      }

      // Start health monitoring for the agent
      this.healthMonitor.addAgent(agent);

      // Clear related caches
      this.cacheManager.invalidatePattern('discover:*');
      this.cacheManager.invalidatePattern('agents:*');

      const registrationTime = performance.now() - startTime;
      
      const event: RouterEvent = {
        type: 'agent_registered',
        timestamp: new Date(),
        agentId: agent.id,
        data: { agent, registrationTime },
      };
      
      this.emit('agent_registered', event);
      
      console.log(`✅ Agent registered: ${agent.name} (${agent.id}) in ${registrationTime.toFixed(2)}ms`);
      
      return agent.id;
      
    } catch (error) {
      const registrationTime = performance.now() - startTime;
      this.metrics.errors++;
      
      console.error(`❌ Agent registration failed in ${registrationTime.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Discover agents with high-performance matching
   */
  async discoverAgents(query: DiscoveryQuery): Promise<DiscoveryResult> {
    return this.executeWithConcurrencyControl(async () => {
      const startTime = performance.now();
      const queryId = this.generateQueryId();
      
      try {
        this.metrics.totalQueries++;
        
        // Check cache first
        const cacheKey = this.generateCacheKey(query);
        const cachedResult = await this.cacheManager.get<DiscoveryResult>(cacheKey);
        
        if (cachedResult) {
          this.metrics.cacheHits++;
          
          return {
            ...cachedResult,
            discoveryTimeMs: performance.now() - startTime,
            cache: { hit: true, ttl: this.config.cacheTimeout },
          };
        }

        // Get all agents (or filtered subset)
        const allAgents = await this.registry.getAllAgents();
        let candidateAgents = allAgents;

        // Apply pre-filters for performance
        candidateAgents = this.applyPreFilters(candidateAgents, query);

        // Find capability matches
        const matches = await this.capabilityMatcher.findMatches(candidateAgents, query);

        // Apply post-filters and sorting
        let filteredAgents = this.applyPostFilters(matches, candidateAgents, query);

        // Sort results
        filteredAgents = this.sortResults(filteredAgents, query);

        // Apply result limit
        if (query.maxResults) {
          filteredAgents = filteredAgents.slice(0, query.maxResults);
        }

        const discoveryTime = performance.now() - startTime;
        this.updateMetrics(discoveryTime);

        const result: DiscoveryResult = {
          agents: filteredAgents.map(match => candidateAgents.get(match.agentId)!),
          discoveryTimeMs: discoveryTime,
          totalFound: filteredAgents.length,
          query,
          ranking: {
            enabled: true,
            algorithm: 'capability_weighted',
            factors: ['capabilities', 'domains', 'performance', 'health'],
          },
          cache: { hit: false },
        };

        // Cache the result (without timing info)
        const cacheableResult = { ...result, discoveryTimeMs: 0 };
        await this.cacheManager.set(cacheKey, cacheableResult);

        this.emit('discovery_completed', {
          queryId,
          query,
          result,
          discoveryTime,
        });

        console.log(`🔍 Discovery completed: ${filteredAgents.length} agents found in ${discoveryTime.toFixed(2)}ms`);

        return result;
        
      } catch (error) {
        this.metrics.errors++;
        const discoveryTime = performance.now() - startTime;
        
        console.error(`❌ Discovery failed in ${discoveryTime.toFixed(2)}ms:`, error);
        throw error;
      }
    });
  }

  /**
   * Get specific agent by ID
   */
  async getAgent(agentId: string): Promise<OSSAAgent | null> {
    const cacheKey = `agent:${agentId}`;
    const cachedAgent = await this.cacheManager.get<OSSAAgent>(cacheKey);
    
    if (cachedAgent) {
      return cachedAgent;
    }

    const agent = await this.registry.getAgent(agentId);
    
    if (agent) {
      await this.cacheManager.set(cacheKey, agent);
    }
    
    return agent;
  }

  /**
   * Update agent information
   */
  async updateAgent(agentId: string, updates: Partial<OSSAAgent>): Promise<void> {
    const startTime = performance.now();
    
    try {
      const existingAgent = await this.registry.getAgent(agentId);
      if (!existingAgent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      const updatedAgent = {
        ...existingAgent,
        ...updates,
        lastSeen: new Date(),
      };

      // Validate updated agent
      this.validateAgent(updatedAgent);

      await this.registry.updateAgent(agentId, updatedAgent);

      // Update indexes
      if (this.indexManager) {
        await this.indexManager.updateAgentIndex(updatedAgent);
      }

      // Update health monitor
      this.healthMonitor.updateAgent(updatedAgent);

      // Invalidate caches
      this.cacheManager.invalidatePattern(`agent:${agentId}`);
      this.cacheManager.invalidatePattern('discover:*');

      const updateTime = performance.now() - startTime;

      const event: RouterEvent = {
        type: 'agent_updated',
        timestamp: new Date(),
        agentId,
        data: { updates, updateTime },
      };

      this.emit('agent_updated', event);

      console.log(`✏️  Agent updated: ${agentId} in ${updateTime.toFixed(2)}ms`);
      
    } catch (error) {
      const updateTime = performance.now() - startTime;
      console.error(`❌ Agent update failed in ${updateTime.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Remove agent from registry
   */
  async removeAgent(agentId: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      const agent = await this.registry.getAgent(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      await this.registry.removeAgent(agentId);

      // Remove from indexes
      if (this.indexManager) {
        await this.indexManager.removeAgentFromIndex(agentId);
      }

      // Remove from health monitoring
      this.healthMonitor.removeAgent(agentId);

      // Invalidate caches
      this.cacheManager.invalidatePattern(`agent:${agentId}`);
      this.cacheManager.invalidatePattern('discover:*');

      const removalTime = performance.now() - startTime;

      const event: RouterEvent = {
        type: 'agent_removed',
        timestamp: new Date(),
        agentId,
        data: { agent, removalTime },
      };

      this.emit('agent_removed', event);

      console.log(`🗑️  Agent removed: ${agentId} in ${removalTime.toFixed(2)}ms`);
      
    } catch (error) {
      const removalTime = performance.now() - startTime;
      console.error(`❌ Agent removal failed in ${removalTime.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Perform health check on specific agent
   */
  async healthCheckAgent(agentId: string): Promise<HealthCheckResult> {
    const agent = await this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return this.healthMonitor.checkAgentHealth(agent);
  }

  /**
   * Get discovery engine health status
   */
  isHealthy(): boolean {
    return this.isRunning && 
           this.healthMonitor.isHealthy() && 
           this.cacheManager.isHealthy();
  }

  /**
   * Get comprehensive statistics
   */
  getStatistics(): {
    agents: { total: number; healthy: number; unhealthy: number };
    queries: { total: number; cacheHitRate: number; avgResponseTime: number };
    capabilities: any;
    cache: any;
    indexing?: any;
  } {
    const agentStats = this.registry.getStatistics();
    const cacheStats = this.cacheManager.getStatistics();
    const capabilityStats = this.capabilityMatcher.getStatistics();
    
    const cacheHitRate = this.metrics.totalQueries > 0 
      ? this.metrics.cacheHits / this.metrics.totalQueries 
      : 0;

    const stats = {
      agents: agentStats,
      queries: {
        total: this.metrics.totalQueries,
        cacheHitRate: cacheHitRate,
        avgResponseTime: this.metrics.avgQueryTime,
        errors: this.metrics.errors,
      },
      capabilities: capabilityStats,
      cache: cacheStats,
    };

    if (this.indexManager) {
      (stats as any).indexing = this.indexManager.getStatistics();
    }

    return stats;
  }

  // Private methods

  private applyPreFilters(agents: Map<string, OSSAAgent>, query: DiscoveryQuery): Map<string, OSSAAgent> {
    const filtered = new Map<string, OSSAAgent>();

    for (const [agentId, agent] of agents) {
      // Health status filter
      if (query.healthStatus && agent.status !== query.healthStatus) {
        continue;
      }

      // Include inactive filter
      if (!query.includeInactive && agent.status !== 'healthy') {
        continue;
      }

      // Conformance tier filter
      if (query.conformanceTier && agent.metadata.conformanceTier !== query.conformanceTier) {
        continue;
      }

      // Performance tier filter (basic check)
      if (query.performanceTier) {
        const performanceTier = this.getAgentPerformanceTier(agent);
        if (performanceTier !== query.performanceTier) {
          continue;
        }
      }

      // Protocol filter
      if (query.protocols?.length) {
        const hasRequiredProtocol = query.protocols.some(protocol =>
          agent.protocols.some(p => p.name.toLowerCase() === protocol.toLowerCase())
        );
        if (!hasRequiredProtocol) {
          continue;
        }
      }

      // Compliance framework filter
      if (query.complianceFrameworks?.length && agent.compliance) {
        const hasRequiredFramework = query.complianceFrameworks.some(framework =>
          agent.compliance!.frameworks.includes(framework)
        );
        if (!hasRequiredFramework) {
          continue;
        }
      }

      filtered.set(agentId, agent);
    }

    return filtered;
  }

  private applyPostFilters(
    matches: CapabilityMatch[], 
    agents: Map<string, OSSAAgent>, 
    query: DiscoveryQuery
  ): CapabilityMatch[] {
    return matches.filter(match => {
      const agent = agents.get(match.agentId);
      if (!agent) return false;

      // Minimum capability score threshold
      if (match.score < 0.1) return false;

      // Domain relevance threshold
      if (query.domains?.length && match.domainRelevance < 0.3) return false;

      return true;
    });
  }

  private sortResults(matches: CapabilityMatch[], query: DiscoveryQuery): CapabilityMatch[] {
    const sortBy = query.sortBy || 'performance';
    const sortOrder = query.sortOrder || 'desc';
    
    matches.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'performance':
          comparison = a.score - b.score;
          break;
        case 'capability_match':
          comparison = a.matchedCapabilities.length - b.matchedCapabilities.length;
          break;
        case 'name':
          // Would need agent names for this
          comparison = 0;
          break;
        case 'last_seen':
          // Would need last seen timestamps for this
          comparison = 0;
          break;
        default:
          comparison = a.score - b.score;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return matches;
  }

  private validateAgent(agent: OSSAAgent): void {
    if (!agent.name || !agent.version || !agent.endpoint) {
      throw new Error('Agent missing required fields: name, version, endpoint');
    }

    if (!agent.capabilities.primary || agent.capabilities.primary.length === 0) {
      throw new Error('Agent must have at least one primary capability');
    }

    if (!agent.protocols || agent.protocols.length === 0) {
      throw new Error('Agent must support at least one protocol');
    }

    // Validate endpoints
    if (!agent.endpoints.health || !agent.endpoints.api) {
      throw new Error('Agent must have health and api endpoints');
    }

    // Validate conformance tier
    const validTiers = ['core', 'governed', 'advanced'];
    if (!validTiers.includes(agent.metadata.conformanceTier)) {
      throw new Error(`Invalid conformance tier: ${agent.metadata.conformanceTier}`);
    }
  }

  private generateAgentId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ossa-${timestamp}-${random}`;
  }

  private generateQueryId(): string {
    return `query-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }

  private generateCacheKey(query: DiscoveryQuery): string {
    const keyData = {
      capabilities: query.capabilities?.sort(),
      domains: query.domains?.sort(),
      protocols: query.protocols?.sort(),
      performanceTier: query.performanceTier,
      conformanceTier: query.conformanceTier,
      healthStatus: query.healthStatus,
      maxResults: query.maxResults,
      includeInactive: query.includeInactive,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };
    
    return `discover:${Buffer.from(JSON.stringify(keyData)).toString('base64url')}`;
  }

  private getAgentPerformanceTier(agent: OSSAAgent): string {
    const score = this.calculatePerformanceScore(agent);
    
    if (score >= 0.9) return 'platinum';
    if (score >= 0.8) return 'gold';
    if (score >= 0.6) return 'silver';
    return 'bronze';
  }

  private calculatePerformanceScore(agent: OSSAAgent): number {
    const metrics = agent.performance;
    
    const responseTimeScore = Math.max(0, 1 - (metrics.avgResponseTimeMs / 1000));
    const uptimeScore = metrics.uptimePercentage / 100;
    const successScore = metrics.successRate;
    const throughputScore = Math.min(1, metrics.throughputRps / 100);
    
    return (responseTimeScore * 0.3) + (uptimeScore * 0.3) + (successScore * 0.3) + (throughputScore * 0.1);
  }

  private updateMetrics(queryTime: number): void {
    this.metrics.totalQueryTime += queryTime;
    this.metrics.avgQueryTime = this.metrics.totalQueryTime / this.metrics.totalQueries;
  }

  private async executeWithConcurrencyControl<T>(operation: () => Promise<T>): Promise<T> {
    // Simple concurrency control
    const maxConcurrent = this.config.maxConcurrentQueries || 100;
    
    if (this.activeQueries >= maxConcurrent) {
      return new Promise((resolve, reject) => {
        this.queryQueue.push(async () => {
          try {
            const result = await operation();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    this.activeQueries++;
    
    try {
      const result = await operation();
      return result;
    } finally {
      this.activeQueries--;
      
      // Process next queued operation
      if (this.queryQueue.length > 0) {
        const nextOperation = this.queryQueue.shift();
        if (nextOperation) {
          setImmediate(() => nextOperation());
        }
      }
    }
  }

  private setupEventHandlers(): void {
    this.healthMonitor.on('agent_health_changed', (result: HealthCheckResult) => {
      const event: RouterEvent = {
        type: 'health_check',
        timestamp: new Date(),
        agentId: result.agentId,
        data: result,
      };
      
      this.emit('agent_health_changed', event);
      
      // Invalidate caches when health changes
      this.cacheManager.invalidatePattern(`agent:${result.agentId}`);
      this.cacheManager.invalidatePattern('discover:*');
    });

    this.cacheManager.on('cache_miss', (key: string) => {
      // Could log or track cache misses
    });

    if (this.indexManager) {
      this.indexManager.on('index_updated', () => {
        // Could trigger cache invalidation or other optimizations
      });
    }
  }
}