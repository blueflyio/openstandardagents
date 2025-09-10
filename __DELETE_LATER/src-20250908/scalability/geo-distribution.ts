/**
 * OSSA Geographic Distribution System
 * Regional registry partitioning for global agent discovery with sub-100ms latency
 */

import { EventEmitter } from 'events';
import { OSSAAgent, DiscoveryQuery, DiscoveryResult } from '../router/types';

interface Region {
  id: string;
  name: string;
  code: string; // e.g., 'us-east-1', 'eu-west-1', 'ap-southeast-1'
  coordinates: {
    latitude: number;
    longitude: number;
  };
  endpoints: {
    primary: string;
    secondary?: string;
  };
  capacity: {
    maxAgents: number;
    currentAgents: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    availability: number;
    lastCheck: Date;
  };
}

interface GeographicConfig {
  regions: Region[];
  defaultRegion: string;
  latencyThreshold: number;
  replicationFactor: number;
  consistencyLevel: 'eventual' | 'strong' | 'bounded';
  syncInterval: number;
  partitioningStrategy: 'geographic' | 'hash' | 'capacity' | 'latency';
  failoverEnabled: boolean;
  crossRegionTimeout: number;
}

interface RegionPartition {
  regionId: string;
  agents: Map<string, OSSAAgent>;
  capabilities: Map<string, Set<string>>; // capability -> agent IDs
  domains: Map<string, Set<string>>; // domain -> agent IDs
  lastSync: Date;
  syncVersion: number;
  pendingUpdates: Array<{
    type: 'add' | 'update' | 'remove';
    agentId: string;
    data?: Partial<OSSAAgent>;
    timestamp: Date;
  }>;
}

interface CrossRegionQuery {
  queryId: string;
  originalQuery: DiscoveryQuery;
  sourceRegion: string;
  targetRegions: string[];
  timeout: number;
  startTime: Date;
  results: Map<string, DiscoveryResult>;
  completed: Set<string>;
  errors: Map<string, Error>;
}

export class GeoDistributionManager extends EventEmitter {
  private config: GeographicConfig;
  private regions: Map<string, Region>;
  private partitions: Map<string, RegionPartition>;
  private localRegion: string;
  private crossRegionQueries: Map<string, CrossRegionQuery> = new Map();
  private syncTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(config: Partial<GeographicConfig> & { localRegion: string }) {
    super();
    
    this.localRegion = config.localRegion;
    this.config = {
      regions: [],
      defaultRegion: config.localRegion,
      latencyThreshold: 100, // 100ms
      replicationFactor: 2,
      consistencyLevel: 'eventual',
      syncInterval: 30000, // 30 seconds
      partitioningStrategy: 'geographic',
      failoverEnabled: true,
      crossRegionTimeout: 5000, // 5 seconds
      ...config
    };

    this.regions = new Map();
    this.partitions = new Map();

    this.initializeRegions();
    this.startSynchronization();
    this.startHealthChecking();
  }

  /**
   * Register an agent in the appropriate regional partition
   */
  async registerAgent(agent: OSSAAgent, preferredRegion?: string): Promise<void> {
    const targetRegion = await this.selectOptimalRegion(agent, preferredRegion);
    const partition = this.getOrCreatePartition(targetRegion);
    
    // Add agent to partition
    partition.agents.set(agent.id, agent);
    
    // Update capability indices
    for (const capability of agent.capabilities.primary) {
      if (!partition.capabilities.has(capability)) {
        partition.capabilities.set(capability, new Set());
      }
      partition.capabilities.get(capability)!.add(agent.id);
    }
    
    // Update domain indices
    for (const domain of agent.capabilities.domains) {
      if (!partition.domains.has(domain)) {
        partition.domains.set(domain, new Set());
      }
      partition.domains.get(domain)!.add(agent.id);
    }
    
    // Add to pending updates for replication
    partition.pendingUpdates.push({
      type: 'add',
      agentId: agent.id,
      data: agent,
      timestamp: new Date()
    });

    // Update region capacity
    const region = this.regions.get(targetRegion);
    if (region) {
      region.capacity.currentAgents++;
    }

    this.emit('agent_registered', { 
      agentId: agent.id, 
      region: targetRegion,
      partition: partition.agents.size 
    });

    // Trigger immediate sync for important agents
    if (this.isHighPriorityAgent(agent)) {
      await this.syncPartition(targetRegion);
    }
  }

  /**
   * Discover agents across regions with intelligent routing
   */
  async discoverAgents(query: DiscoveryQuery, options?: {
    regions?: string[];
    includeRemote?: boolean;
    maxLatency?: number;
    strategy?: 'local_first' | 'global' | 'nearest' | 'best_match';
  }): Promise<DiscoveryResult> {
    const startTime = performance.now();
    const strategy = options?.strategy || 'local_first';
    const maxLatency = options?.maxLatency || this.config.latencyThreshold;
    
    let targetRegions: string[] = [];
    
    switch (strategy) {
      case 'local_first':
        targetRegions = [this.localRegion];
        if (options?.includeRemote) {
          targetRegions.push(...this.getNearbyRegions(maxLatency));
        }
        break;
        
      case 'global':
        targetRegions = Array.from(this.regions.keys());
        break;
        
      case 'nearest':
        targetRegions = this.getNearbyRegions(maxLatency);
        break;
        
      case 'best_match':
        targetRegions = await this.selectRegionsByCapability(query);
        break;
    }

    if (options?.regions) {
      targetRegions = targetRegions.filter(r => options.regions!.includes(r));
    }

    // Execute query across selected regions
    const queryId = this.generateQueryId();
    const crossRegionQuery: CrossRegionQuery = {
      queryId,
      originalQuery: query,
      sourceRegion: this.localRegion,
      targetRegions,
      timeout: options?.maxLatency || this.config.crossRegionTimeout,
      startTime: new Date(),
      results: new Map(),
      completed: new Set(),
      errors: new Map()
    };

    this.crossRegionQueries.set(queryId, crossRegionQuery);

    try {
      // Execute queries in parallel
      const queryPromises = targetRegions.map(regionId => 
        this.executeRegionalQuery(queryId, regionId, query)
      );

      // Wait for results with timeout
      await Promise.allSettled(queryPromises);

      // Aggregate results
      const aggregatedResult = this.aggregateQueryResults(crossRegionQuery);
      const discoveryTime = performance.now() - startTime;

      this.emit('discovery_completed', {
        queryId,
        regionsQueried: targetRegions.length,
        resultsFound: aggregatedResult.agents.length,
        discoveryTime
      });

      return {
        ...aggregatedResult,
        discoveryTimeMs: discoveryTime
      };

    } finally {
      this.crossRegionQueries.delete(queryId);
    }
  }

  /**
   * Get regional statistics and health
   */
  getRegionalStatistics(): {
    totalRegions: number;
    healthyRegions: number;
    totalAgents: number;
    regionalDistribution: Record<string, {
      agents: number;
      capacity: number;
      health: string;
      latency: number;
    }>;
    syncStatus: {
      lastSync: Date;
      pendingUpdates: number;
      syncLatency: number;
    };
  } {
    const stats = {
      totalRegions: this.regions.size,
      healthyRegions: 0,
      totalAgents: 0,
      regionalDistribution: {} as any,
      syncStatus: {
        lastSync: new Date(0),
        pendingUpdates: 0,
        syncLatency: 0
      }
    };

    for (const [regionId, region] of this.regions) {
      if (region.health.status === 'healthy') {
        stats.healthyRegions++;
      }

      const partition = this.partitions.get(regionId);
      const agentCount = partition?.agents.size || 0;
      stats.totalAgents += agentCount;

      stats.regionalDistribution[regionId] = {
        agents: agentCount,
        capacity: region.capacity.maxAgents,
        health: region.health.status,
        latency: region.health.latency
      };

      if (partition) {
        stats.syncStatus.pendingUpdates += partition.pendingUpdates.length;
        if (partition.lastSync > stats.syncStatus.lastSync) {
          stats.syncStatus.lastSync = partition.lastSync;
        }
      }
    }

    return stats;
  }

  /**
   * Manually trigger synchronization
   */
  async synchronizeRegions(regions?: string[]): Promise<void> {
    const targetRegions = regions || Array.from(this.regions.keys());
    
    const syncPromises = targetRegions.map(regionId =>
      this.syncPartition(regionId)
    );

    await Promise.allSettled(syncPromises);
  }

  /**
   * Failover to backup region
   */
  async failoverToRegion(targetRegion: string): Promise<void> {
    if (!this.config.failoverEnabled) {
      throw new Error('Failover is not enabled');
    }

    const sourcePartition = this.partitions.get(this.localRegion);
    const targetPartition = this.getOrCreatePartition(targetRegion);

    if (!sourcePartition) {
      throw new Error(`No partition found for source region ${this.localRegion}`);
    }

    // Copy agents to target region
    for (const [agentId, agent] of sourcePartition.agents) {
      targetPartition.agents.set(agentId, agent);
      
      // Update indices
      for (const capability of agent.capabilities.primary) {
        if (!targetPartition.capabilities.has(capability)) {
          targetPartition.capabilities.set(capability, new Set());
        }
        targetPartition.capabilities.get(capability)!.add(agentId);
      }
    }

    this.localRegion = targetRegion;
    
    this.emit('failover_completed', { 
      from: this.localRegion, 
      to: targetRegion, 
      agentsMigrated: sourcePartition.agents.size 
    });
  }

  /**
   * Initialize regions from configuration
   */
  private initializeRegions(): void {
    for (const region of this.config.regions) {
      this.regions.set(region.id, region);
      
      // Initialize partition
      this.partitions.set(region.id, {
        regionId: region.id,
        agents: new Map(),
        capabilities: new Map(),
        domains: new Map(),
        lastSync: new Date(0),
        syncVersion: 0,
        pendingUpdates: []
      });
    }
  }

  /**
   * Select optimal region for agent placement
   */
  private async selectOptimalRegion(agent: OSSAAgent, preferredRegion?: string): Promise<string> {
    if (preferredRegion && this.regions.has(preferredRegion)) {
      const region = this.regions.get(preferredRegion)!;
      if (region.capacity.currentAgents < region.capacity.maxAgents) {
        return preferredRegion;
      }
    }

    switch (this.config.partitioningStrategy) {
      case 'geographic':
        return this.selectByGeography(agent);
      
      case 'hash':
        return this.selectByHash(agent.id);
      
      case 'capacity':
        return this.selectByCapacity();
      
      case 'latency':
        return this.selectByLatency();
      
      default:
        return this.localRegion;
    }
  }

  /**
   * Select region by geographic proximity (simplified)
   */
  private selectByGeography(agent: OSSAAgent): string {
    // In a real implementation, this would use agent's geographic information
    // For now, return local region or least loaded region
    return this.selectByCapacity();
  }

  /**
   * Select region by hash partitioning
   */
  private selectByHash(agentId: string): string {
    const regions = Array.from(this.regions.keys()).sort();
    const hash = this.simpleHash(agentId);
    return regions[hash % regions.length];
  }

  /**
   * Select region by available capacity
   */
  private selectByCapacity(): string {
    let bestRegion = this.localRegion;
    let bestCapacity = 0;

    for (const [regionId, region] of this.regions) {
      const availableCapacity = region.capacity.maxAgents - region.capacity.currentAgents;
      if (availableCapacity > bestCapacity) {
        bestCapacity = availableCapacity;
        bestRegion = regionId;
      }
    }

    return bestRegion;
  }

  /**
   * Select region by lowest latency
   */
  private selectByLatency(): string {
    let bestRegion = this.localRegion;
    let bestLatency = Infinity;

    for (const [regionId, region] of this.regions) {
      if (region.health.latency < bestLatency && region.health.status === 'healthy') {
        bestLatency = region.health.latency;
        bestRegion = regionId;
      }
    }

    return bestRegion;
  }

  /**
   * Get nearby regions within latency threshold
   */
  private getNearbyRegions(maxLatency: number): string[] {
    const nearby: string[] = [];
    
    for (const [regionId, region] of this.regions) {
      if (region.health.latency <= maxLatency && region.health.status !== 'unhealthy') {
        nearby.push(regionId);
      }
    }

    return nearby.sort((a, b) => {
      const latencyA = this.regions.get(a)?.health.latency || Infinity;
      const latencyB = this.regions.get(b)?.health.latency || Infinity;
      return latencyA - latencyB;
    });
  }

  /**
   * Select regions by capability coverage
   */
  private async selectRegionsByCapability(query: DiscoveryQuery): Promise<string[]> {
    const regions: Array<{ id: string; score: number }> = [];
    
    for (const [regionId, partition] of this.partitions) {
      let score = 0;
      
      // Score based on capability matches
      if (query.capabilities) {
        for (const capability of query.capabilities) {
          const agentCount = partition.capabilities.get(capability)?.size || 0;
          score += agentCount;
        }
      }
      
      // Score based on domain matches
      if (query.domains) {
        for (const domain of query.domains) {
          const agentCount = partition.domains.get(domain)?.size || 0;
          score += agentCount;
        }
      }
      
      regions.push({ id: regionId, score });
    }

    // Sort by score and return top regions
    regions.sort((a, b) => b.score - a.score);
    return regions.slice(0, Math.min(3, regions.length)).map(r => r.id);
  }

  /**
   * Execute query in specific region
   */
  private async executeRegionalQuery(
    queryId: string, 
    regionId: string, 
    query: DiscoveryQuery
  ): Promise<void> {
    const crossRegionQuery = this.crossRegionQueries.get(queryId);
    if (!crossRegionQuery) return;

    try {
      const partition = this.partitions.get(regionId);
      if (!partition) {
        throw new Error(`No partition found for region ${regionId}`);
      }

      // Execute query locally within partition
      const result = await this.executeLocalQuery(partition, query);
      
      crossRegionQuery.results.set(regionId, result);
      crossRegionQuery.completed.add(regionId);

    } catch (error) {
      crossRegionQuery.errors.set(regionId, error as Error);
      this.emit('regional_query_error', { queryId, regionId, error });
    }
  }

  /**
   * Execute query within a partition
   */
  private async executeLocalQuery(
    partition: RegionPartition, 
    query: DiscoveryQuery
  ): Promise<DiscoveryResult> {
    const startTime = performance.now();
    const matchingAgents: OSSAAgent[] = [];
    
    // Get candidates based on query
    const candidates = this.getPartitionCandidates(partition, query);
    
    // Apply additional filtering
    for (const agentId of candidates) {
      const agent = partition.agents.get(agentId);
      if (!agent) continue;
      
      // Apply query filters
      if (query.healthStatus && agent.status !== query.healthStatus) continue;
      if (query.conformanceTier && agent.metadata.conformanceTier !== query.conformanceTier) continue;
      
      matchingAgents.push(agent);
    }

    // Sort results
    if (query.sortBy) {
      matchingAgents.sort((a, b) => {
        let comparison = 0;
        switch (query.sortBy) {
          case 'performance':
            comparison = b.performance.successRate - a.performance.successRate;
            break;
          case 'last_seen':
            comparison = b.lastSeen.getTime() - a.lastSeen.getTime();
            break;
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
        }
        return query.sortOrder === 'desc' ? comparison : -comparison;
      });
    }

    // Limit results
    const maxResults = query.maxResults || 50;
    const limitedResults = matchingAgents.slice(0, maxResults);

    const discoveryTime = performance.now() - startTime;

    return {
      agents: limitedResults,
      discoveryTimeMs: discoveryTime,
      totalFound: matchingAgents.length,
      query,
      ranking: {
        enabled: false,
        algorithm: 'simple',
        factors: []
      },
      cache: {
        hit: false
      }
    };
  }

  /**
   * Get candidate agents from partition based on query
   */
  private getPartitionCandidates(partition: RegionPartition, query: DiscoveryQuery): Set<string> {
    const candidates = new Set<string>();
    
    // Filter by capabilities
    if (query.capabilities && query.capabilities.length > 0) {
      for (const capability of query.capabilities) {
        const agentIds = partition.capabilities.get(capability);
        if (agentIds) {
          agentIds.forEach(id => candidates.add(id));
        }
      }
    }
    
    // Filter by domains
    if (query.domains && query.domains.length > 0) {
      const domainCandidates = new Set<string>();
      for (const domain of query.domains) {
        const agentIds = partition.domains.get(domain);
        if (agentIds) {
          agentIds.forEach(id => domainCandidates.add(id));
        }
      }
      
      // Intersect with capability candidates if present
      if (candidates.size > 0) {
        const intersection = new Set<string>();
        for (const id of candidates) {
          if (domainCandidates.has(id)) {
            intersection.add(id);
          }
        }
        candidates.clear();
        intersection.forEach(id => candidates.add(id));
      } else {
        domainCandidates.forEach(id => candidates.add(id));
      }
    }
    
    // If no specific filters, return all agents (up to limit)
    if (candidates.size === 0) {
      let count = 0;
      for (const agentId of partition.agents.keys()) {
        if (count >= 1000) break;
        candidates.add(agentId);
        count++;
      }
    }
    
    return candidates;
  }

  /**
   * Aggregate query results from multiple regions
   */
  private aggregateQueryResults(crossRegionQuery: CrossRegionQuery): DiscoveryResult {
    const allAgents: OSSAAgent[] = [];
    const regionResults: DiscoveryResult[] = [];
    
    // Collect all results
    for (const result of crossRegionQuery.results.values()) {
      regionResults.push(result);
      allAgents.push(...result.agents);
    }

    // Remove duplicates (agents might be replicated across regions)
    const uniqueAgents = new Map<string, OSSAAgent>();
    for (const agent of allAgents) {
      uniqueAgents.set(agent.id, agent);
    }

    // Apply global sorting if needed
    const finalAgents = Array.from(uniqueAgents.values());
    const query = crossRegionQuery.originalQuery;
    
    if (query.sortBy === 'performance') {
      finalAgents.sort((a, b) => b.performance.successRate - a.performance.successRate);
    }

    // Apply global limit
    const maxResults = query.maxResults || 100;
    const limitedAgents = finalAgents.slice(0, maxResults);

    return {
      agents: limitedAgents,
      discoveryTimeMs: Date.now() - crossRegionQuery.startTime.getTime(),
      totalFound: finalAgents.length,
      query: crossRegionQuery.originalQuery,
      ranking: {
        enabled: true,
        algorithm: 'cross_region_aggregation',
        factors: ['region_latency', 'capability_match', 'performance']
      },
      cache: {
        hit: false
      }
    };
  }

  /**
   * Get or create partition for region
   */
  private getOrCreatePartition(regionId: string): RegionPartition {
    let partition = this.partitions.get(regionId);
    if (!partition) {
      partition = {
        regionId,
        agents: new Map(),
        capabilities: new Map(),
        domains: new Map(),
        lastSync: new Date(0),
        syncVersion: 0,
        pendingUpdates: []
      };
      this.partitions.set(regionId, partition);
    }
    return partition;
  }

  /**
   * Check if agent is high priority for immediate sync
   */
  private isHighPriorityAgent(agent: OSSAAgent): boolean {
    return agent.metadata.certificationLevel === 'platinum' ||
           agent.metadata.conformanceTier === 'advanced';
  }

  /**
   * Synchronize partition with other regions
   */
  private async syncPartition(regionId: string): Promise<void> {
    const partition = this.partitions.get(regionId);
    if (!partition || partition.pendingUpdates.length === 0) return;

    try {
      // In a real implementation, this would send updates to other regions
      // For now, we simulate the sync
      const updates = [...partition.pendingUpdates];
      partition.pendingUpdates = [];
      partition.lastSync = new Date();
      partition.syncVersion++;

      this.emit('partition_synced', { 
        regionId, 
        updates: updates.length, 
        version: partition.syncVersion 
      });

    } catch (error) {
      this.emit('sync_error', { regionId, error });
    }
  }

  /**
   * Start periodic synchronization
   */
  private startSynchronization(): void {
    this.syncTimer = setInterval(() => {
      this.synchronizeAllPartitions().catch(error => {
        this.emit('sync_error', { error });
      });
    }, this.config.syncInterval);
  }

  /**
   * Synchronize all partitions
   */
  private async synchronizeAllPartitions(): Promise<void> {
    const syncPromises = Array.from(this.partitions.keys()).map(regionId =>
      this.syncPartition(regionId)
    );

    await Promise.allSettled(syncPromises);
  }

  /**
   * Start health checking for regions
   */
  private startHealthChecking(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performRegionalHealthChecks().catch(error => {
        this.emit('health_check_error', { error });
      });
    }, 60000); // 1 minute
  }

  /**
   * Perform health checks on all regions
   */
  private async performRegionalHealthChecks(): Promise<void> {
    const healthPromises = Array.from(this.regions.keys()).map(regionId =>
      this.checkRegionHealth(regionId)
    );

    await Promise.allSettled(healthPromises);
  }

  /**
   * Check health of specific region
   */
  private async checkRegionHealth(regionId: string): Promise<void> {
    const region = this.regions.get(regionId);
    if (!region) return;

    try {
      const startTime = performance.now();
      
      // Simulate health check - in reality this would ping the region
      const isHealthy = Math.random() > 0.1; // 90% health rate
      
      const latency = performance.now() - startTime;
      region.health.latency = latency;
      region.health.lastCheck = new Date();
      
      if (isHealthy) {
        if (latency < this.config.latencyThreshold * 0.5) {
          region.health.status = 'healthy';
        } else if (latency < this.config.latencyThreshold) {
          region.health.status = 'degraded';
        } else {
          region.health.status = 'unhealthy';
        }
      } else {
        region.health.status = 'unhealthy';
      }

    } catch (error) {
      region.health.status = 'unhealthy';
      this.emit('region_health_error', { regionId, error });
    }
  }

  /**
   * Generate unique query ID
   */
  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simple hash function for partitioning
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Stop all timers and cleanup
   */
  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    this.emit('stopped');
  }
}