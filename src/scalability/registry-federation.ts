/**
 * OSSA Registry Federation System
 * Cross-region agent registry federation with eventual consistency and conflict resolution
 */

import { EventEmitter } from 'events';
import { OSSAAgent, DiscoveryQuery, DiscoveryResult } from '../router/types';

interface FederatedRegistry {
  id: string;
  name: string;
  region: string;
  endpoint: string;
  credentials?: {
    apiKey?: string;
    token?: string;
    cert?: string;
  };
  status: 'active' | 'passive' | 'offline';
  lastSync: Date;
  trustLevel: 'trusted' | 'verified' | 'untrusted';
  capabilities: {
    supportsReplication: boolean;
    supportsConflictResolution: boolean;
    maxAgents: number;
    protocolVersion: string;
  };
  metrics: {
    latency: number;
    availability: number;
    syncSuccessRate: number;
    errorRate: number;
  };
}

interface FederationConfig {
  registries: FederatedRegistry[];
  syncInterval: number;
  conflictResolutionStrategy: 'timestamp' | 'registry_priority' | 'agent_priority' | 'merge';
  consistencyModel: 'eventual' | 'causal' | 'strong';
  replicationMode: 'full' | 'selective' | 'on_demand';
  maxSyncBatchSize: number;
  syncTimeout: number;
  enableConflictDetection: boolean;
  federationProtocol: 'http' | 'grpc' | 'mqtt';
}

interface SyncOperation {
  id: string;
  type: 'full' | 'incremental' | 'conflict_resolution';
  sourceRegistry: string;
  targetRegistries: string[];
  startTime: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: {
    totalAgents: number;
    processedAgents: number;
    successfulSyncs: number;
    failedSyncs: number;
    conflicts: number;
  };
  errors: Array<{
    registry: string;
    error: string;
    timestamp: Date;
  }>;
}

interface AgentVersion {
  agentId: string;
  version: number;
  timestamp: Date;
  registryId: string;
  checksum: string;
  conflicts?: Array<{
    registryId: string;
    version: number;
    conflictType: 'data' | 'version' | 'ownership';
    conflictingData: Partial<OSSAAgent>;
  }>;
}

interface FederationEvent {
  type: 'sync_started' | 'sync_completed' | 'conflict_detected' | 'registry_offline' | 'agent_replicated';
  timestamp: Date;
  data: any;
  registryId?: string;
  agentId?: string;
}

export class RegistryFederation extends EventEmitter {
  private config: FederationConfig;
  private registries: Map<string, FederatedRegistry>;
  private localAgents: Map<string, OSSAAgent>;
  private agentVersions: Map<string, AgentVersion>;
  private syncOperations: Map<string, SyncOperation>;
  private syncTimer?: NodeJS.Timeout;
  private localRegistryId: string;

  constructor(config: Partial<FederationConfig> & { localRegistryId: string }) {
    super();
    
    this.localRegistryId = config.localRegistryId;
    this.config = {
      registries: [],
      syncInterval: 60000, // 1 minute
      conflictResolutionStrategy: 'timestamp',
      consistencyModel: 'eventual',
      replicationMode: 'selective',
      maxSyncBatchSize: 100,
      syncTimeout: 30000, // 30 seconds
      enableConflictDetection: true,
      federationProtocol: 'http',
      ...config
    };

    this.registries = new Map();
    this.localAgents = new Map();
    this.agentVersions = new Map();
    this.syncOperations = new Map();

    this.initializeFederation();
    this.startPeriodicSync();
  }

  /**
   * Register a federated registry
   */
  registerFederatedRegistry(registry: FederatedRegistry): void {
    this.registries.set(registry.id, registry);
    
    this.emit('registry_registered', { 
      registryId: registry.id, 
      region: registry.region,
      trustLevel: registry.trustLevel
    });

    // Trigger initial sync with new registry
    this.syncWithRegistry(registry.id).catch(error => {
      this.emit('sync_error', { registryId: registry.id, error });
    });
  }

  /**
   * Unregister a federated registry
   */
  unregisterFederatedRegistry(registryId: string): void {
    this.registries.delete(registryId);
    
    // Cancel any ongoing sync operations with this registry
    for (const [opId, operation] of this.syncOperations) {
      if (operation.targetRegistries.includes(registryId)) {
        operation.status = 'failed';
        operation.errors.push({
          registry: registryId,
          error: 'Registry unregistered during sync',
          timestamp: new Date()
        });
      }
    }

    this.emit('registry_unregistered', { registryId });
  }

  /**
   * Add agent to local registry and replicate to federation
   */
  async addAgentToFederation(agent: OSSAAgent): Promise<void> {
    // Add to local registry
    this.localAgents.set(agent.id, agent);

    // Create version information
    const version: AgentVersion = {
      agentId: agent.id,
      version: 1,
      timestamp: new Date(),
      registryId: this.localRegistryId,
      checksum: this.calculateChecksum(agent)
    };
    this.agentVersions.set(agent.id, version);

    // Replicate to federated registries based on replication mode
    await this.replicateAgent(agent, 'add');

    this.emit('agent_added_to_federation', { 
      agentId: agent.id, 
      version: version.version 
    });
  }

  /**
   * Update agent in federation
   */
  async updateAgentInFederation(agentId: string, updates: Partial<OSSAAgent>): Promise<void> {
    const existingAgent = this.localAgents.get(agentId);
    if (!existingAgent) {
      throw new Error(`Agent ${agentId} not found in local registry`);
    }

    // Update local agent
    const updatedAgent = { ...existingAgent, ...updates };
    this.localAgents.set(agentId, updatedAgent);

    // Update version information
    const existingVersion = this.agentVersions.get(agentId);
    const newVersion: AgentVersion = {
      agentId,
      version: (existingVersion?.version || 0) + 1,
      timestamp: new Date(),
      registryId: this.localRegistryId,
      checksum: this.calculateChecksum(updatedAgent)
    };
    this.agentVersions.set(agentId, newVersion);

    // Replicate update to federated registries
    await this.replicateAgent(updatedAgent, 'update');

    this.emit('agent_updated_in_federation', { 
      agentId, 
      version: newVersion.version,
      changes: Object.keys(updates)
    });
  }

  /**
   * Remove agent from federation
   */
  async removeAgentFromFederation(agentId: string): Promise<void> {
    const agent = this.localAgents.get(agentId);
    if (!agent) return;

    // Remove from local registry
    this.localAgents.delete(agentId);
    this.agentVersions.delete(agentId);

    // Replicate removal to federated registries
    await this.replicateAgent(agent, 'remove');

    this.emit('agent_removed_from_federation', { agentId });
  }

  /**
   * Discover agents across federated registries
   */
  async discoverAgentsInFederation(
    query: DiscoveryQuery,
    options?: {
      registries?: string[];
      includeLocal?: boolean;
      timeout?: number;
      consistencyLevel?: 'eventual' | 'causal' | 'strong';
    }
  ): Promise<DiscoveryResult> {
    const startTime = performance.now();
    const targetRegistries = options?.registries || Array.from(this.registries.keys());
    const includeLocal = options?.includeLocal !== false;
    const timeout = options?.timeout || this.config.syncTimeout;
    
    const discoveryPromises: Promise<DiscoveryResult>[] = [];
    
    // Query local registry if included
    if (includeLocal) {
      discoveryPromises.push(this.queryLocalRegistry(query));
    }

    // Query federated registries
    for (const registryId of targetRegistries) {
      const registry = this.registries.get(registryId);
      if (registry && registry.status === 'active') {
        discoveryPromises.push(this.queryFederatedRegistry(registryId, query));
      }
    }

    // Execute queries with timeout
    const timeoutPromise = new Promise<DiscoveryResult>((_, reject) => {
      setTimeout(() => reject(new Error('Discovery timeout')), timeout);
    });

    try {
      const results = await Promise.allSettled([
        ...discoveryPromises,
        timeoutPromise
      ]);

      // Process successful results
      const successfulResults: DiscoveryResult[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.agents) {
          successfulResults.push(result.value);
        }
      }

      // Merge and deduplicate results
      const mergedResult = this.mergeDiscoveryResults(successfulResults, query);
      mergedResult.discoveryTimeMs = performance.now() - startTime;

      this.emit('federated_discovery_completed', {
        query,
        registriesQueried: targetRegistries.length + (includeLocal ? 1 : 0),
        resultsCount: mergedResult.agents.length,
        discoveryTime: mergedResult.discoveryTimeMs
      });

      return mergedResult;

    } catch (error) {
      this.emit('federated_discovery_error', { query, error });
      throw error;
    }
  }

  /**
   * Manually trigger synchronization with all or specific registries
   */
  async synchronizeWithFederation(registryIds?: string[]): Promise<void> {
    const targetRegistries = registryIds || Array.from(this.registries.keys());
    
    const syncPromises = targetRegistries.map(registryId =>
      this.syncWithRegistry(registryId)
    );

    const results = await Promise.allSettled(syncPromises);
    
    // Log results
    let successful = 0;
    let failed = 0;
    for (const result of results) {
      if (result.status === 'fulfilled') {
        successful++;
      } else {
        failed++;
      }
    }

    this.emit('federation_sync_completed', { 
      successful, 
      failed, 
      total: targetRegistries.length 
    });
  }

  /**
   * Get federation statistics
   */
  getFederationStatistics(): {
    totalRegistries: number;
    activeRegistries: number;
    totalAgents: number;
    conflicts: number;
    lastSync: Date;
    syncSuccessRate: number;
    avgLatency: number;
  } {
    let activeRegistries = 0;
    let totalSyncLatency = 0;
    let totalSyncAttempts = 0;
    let lastSync = new Date(0);
    
    for (const registry of this.registries.values()) {
      if (registry.status === 'active') {
        activeRegistries++;
      }
      
      totalSyncLatency += registry.metrics.latency;
      totalSyncAttempts += 1; // Simplified
      
      if (registry.lastSync > lastSync) {
        lastSync = registry.lastSync;
      }
    }

    // Count conflicts
    let conflicts = 0;
    for (const version of this.agentVersions.values()) {
      if (version.conflicts && version.conflicts.length > 0) {
        conflicts += version.conflicts.length;
      }
    }

    return {
      totalRegistries: this.registries.size,
      activeRegistries,
      totalAgents: this.localAgents.size,
      conflicts,
      lastSync,
      syncSuccessRate: totalSyncAttempts > 0 ? 0.95 : 0, // Placeholder
      avgLatency: totalSyncAttempts > 0 ? totalSyncLatency / totalSyncAttempts : 0
    };
  }

  /**
   * Resolve conflicts for specific agent
   */
  async resolveConflicts(agentId: string): Promise<void> {
    const version = this.agentVersions.get(agentId);
    if (!version || !version.conflicts || version.conflicts.length === 0) {
      return;
    }

    const localAgent = this.localAgents.get(agentId);
    if (!localAgent) return;

    let resolvedAgent = localAgent;

    for (const conflict of version.conflicts) {
      resolvedAgent = await this.resolveAgentConflict(
        resolvedAgent,
        conflict,
        this.config.conflictResolutionStrategy
      );
    }

    // Update local agent with resolved version
    this.localAgents.set(agentId, resolvedAgent);
    
    // Clear conflicts and increment version
    version.conflicts = [];
    version.version++;
    version.timestamp = new Date();
    version.checksum = this.calculateChecksum(resolvedAgent);

    // Replicate resolved version
    await this.replicateAgent(resolvedAgent, 'update');

    this.emit('conflicts_resolved', { agentId, version: version.version });
  }

  /**
   * Initialize federation from configuration
   */
  private initializeFederation(): void {
    for (const registryConfig of this.config.registries) {
      this.registries.set(registryConfig.id, registryConfig);
    }
  }

  /**
   * Start periodic synchronization
   */
  private startPeriodicSync(): void {
    this.syncTimer = setInterval(() => {
      this.performPeriodicSync().catch(error => {
        this.emit('periodic_sync_error', { error });
      });
    }, this.config.syncInterval);
  }

  /**
   * Perform periodic synchronization with all active registries
   */
  private async performPeriodicSync(): Promise<void> {
    const activeRegistries = Array.from(this.registries.entries())
      .filter(([, registry]) => registry.status === 'active')
      .map(([id]) => id);

    if (activeRegistries.length === 0) return;

    const syncPromises = activeRegistries.map(registryId =>
      this.performIncrementalSync(registryId)
    );

    await Promise.allSettled(syncPromises);
  }

  /**
   * Synchronize with specific registry
   */
  private async syncWithRegistry(registryId: string): Promise<void> {
    const registry = this.registries.get(registryId);
    if (!registry) {
      throw new Error(`Registry ${registryId} not found`);
    }

    const operation: SyncOperation = {
      id: this.generateSyncOperationId(),
      type: 'incremental',
      sourceRegistry: this.localRegistryId,
      targetRegistries: [registryId],
      startTime: new Date(),
      status: 'pending',
      progress: {
        totalAgents: this.localAgents.size,
        processedAgents: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        conflicts: 0
      },
      errors: []
    };

    this.syncOperations.set(operation.id, operation);

    try {
      operation.status = 'in_progress';
      
      // Sync agents in batches
      const agentBatches = this.batchAgents(Array.from(this.localAgents.values()));
      
      for (const batch of agentBatches) {
        await this.syncAgentBatch(registryId, batch, operation);
      }

      operation.status = 'completed';
      registry.lastSync = new Date();
      
      this.emit('registry_sync_completed', {
        registryId,
        operation: operation.id,
        agents: operation.progress.successfulSyncs,
        conflicts: operation.progress.conflicts
      });

    } catch (error) {
      operation.status = 'failed';
      operation.errors.push({
        registry: registryId,
        error: (error as Error).message,
        timestamp: new Date()
      });
      
      this.emit('registry_sync_failed', { registryId, error });
      throw error;
    } finally {
      this.syncOperations.delete(operation.id);
    }
  }

  /**
   * Perform incremental sync with registry
   */
  private async performIncrementalSync(registryId: string): Promise<void> {
    const registry = this.registries.get(registryId);
    if (!registry) return;

    // Get agents modified since last sync
    const modifiedAgents = Array.from(this.localAgents.values()).filter(agent => {
      const version = this.agentVersions.get(agent.id);
      return version && version.timestamp > registry.lastSync;
    });

    if (modifiedAgents.length === 0) return;

    // Sync modified agents
    for (const agent of modifiedAgents) {
      try {
        await this.syncSingleAgent(registryId, agent);
      } catch (error) {
        this.emit('agent_sync_error', { agentId: agent.id, registryId, error });
      }
    }
  }

  /**
   * Replicate agent to federated registries
   */
  private async replicateAgent(
    agent: OSSAAgent, 
    operation: 'add' | 'update' | 'remove'
  ): Promise<void> {
    if (this.config.replicationMode === 'on_demand') return;

    const targetRegistries = this.selectReplicationTargets(agent);
    
    const replicationPromises = targetRegistries.map(registryId =>
      this.replicateToRegistry(registryId, agent, operation)
    );

    const results = await Promise.allSettled(replicationPromises);
    
    // Handle replication failures
    let successful = 0;
    let failed = 0;
    for (const result of results) {
      if (result.status === 'fulfilled') {
        successful++;
      } else {
        failed++;
        this.emit('replication_error', { 
          agentId: agent.id, 
          operation, 
          error: result.reason 
        });
      }
    }

    this.emit('agent_replicated', { 
      agentId: agent.id, 
      operation, 
      successful, 
      failed 
    });
  }

  /**
   * Select registries for replication based on strategy
   */
  private selectReplicationTargets(agent: OSSAAgent): string[] {
    const targets: string[] = [];
    
    switch (this.config.replicationMode) {
      case 'full':
        // Replicate to all active registries
        for (const [registryId, registry] of this.registries) {
          if (registry.status === 'active') {
            targets.push(registryId);
          }
        }
        break;
        
      case 'selective':
        // Replicate based on agent importance and registry trust level
        for (const [registryId, registry] of this.registries) {
          if (registry.status === 'active' && this.shouldReplicateToRegistry(agent, registry)) {
            targets.push(registryId);
          }
        }
        break;
    }
    
    return targets;
  }

  /**
   * Determine if agent should be replicated to specific registry
   */
  private shouldReplicateToRegistry(agent: OSSAAgent, registry: FederatedRegistry): boolean {
    // High-priority agents go to trusted registries
    if (agent.metadata.certificationLevel === 'platinum' && registry.trustLevel !== 'trusted') {
      return false;
    }
    
    // Check registry capacity
    if (registry.capabilities.maxAgents > 0) {
      // Would need to track actual agent count per registry
      return true; // Simplified
    }
    
    return true;
  }

  /**
   * Replicate single agent to specific registry
   */
  private async replicateToRegistry(
    registryId: string, 
    agent: OSSAAgent, 
    operation: 'add' | 'update' | 'remove'
  ): Promise<void> {
    const registry = this.registries.get(registryId);
    if (!registry) return;

    try {
      // In a real implementation, this would make HTTP/gRPC calls
      // For now, we simulate the operation
      await this.simulateRegistryCall(registry, agent, operation);
      
      // Update registry metrics
      registry.metrics.syncSuccessRate = (registry.metrics.syncSuccessRate * 0.9) + (0.1);
      
    } catch (error) {
      registry.metrics.errorRate = (registry.metrics.errorRate * 0.9) + (0.1);
      throw error;
    }
  }

  /**
   * Simulate registry API call
   */
  private async simulateRegistryCall(
    registry: FederatedRegistry,
    agent: OSSAAgent,
    operation: 'add' | 'update' | 'remove'
  ): Promise<void> {
    // Simulate network latency
    const latency = Math.random() * 100 + 50; // 50-150ms
    await new Promise(resolve => setTimeout(resolve, latency));
    
    registry.metrics.latency = (registry.metrics.latency * 0.9) + (latency * 0.1);
    
    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Simulated registry communication error');
    }
  }

  /**
   * Query local registry
   */
  private async queryLocalRegistry(query: DiscoveryQuery): Promise<DiscoveryResult> {
    const startTime = performance.now();
    const matchingAgents: OSSAAgent[] = [];
    
    // Simple filtering based on query
    for (const agent of this.localAgents.values()) {
      if (this.matchesQuery(agent, query)) {
        matchingAgents.push(agent);
      }
    }

    // Apply sorting and limiting
    const sortedAgents = this.sortAgents(matchingAgents, query);
    const limitedAgents = this.limitResults(sortedAgents, query);

    return {
      agents: limitedAgents,
      discoveryTimeMs: performance.now() - startTime,
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
   * Query federated registry
   */
  private async queryFederatedRegistry(
    registryId: string,
    query: DiscoveryQuery
  ): Promise<DiscoveryResult> {
    const registry = this.registries.get(registryId);
    if (!registry) {
      throw new Error(`Registry ${registryId} not found`);
    }

    try {
      // Simulate federated query
      await this.simulateRegistryCall(registry, {} as OSSAAgent, 'update');
      
      // For demonstration, return empty results
      // In reality, this would parse the response from the federated registry
      return {
        agents: [],
        discoveryTimeMs: registry.metrics.latency,
        totalFound: 0,
        query,
        ranking: {
          enabled: false,
          algorithm: 'federated',
          factors: []
        },
        cache: {
          hit: false
        }
      };

    } catch (error) {
      registry.status = 'offline';
      throw error;
    }
  }

  /**
   * Merge discovery results from multiple sources
   */
  private mergeDiscoveryResults(
    results: DiscoveryResult[], 
    query: DiscoveryQuery
  ): DiscoveryResult {
    const allAgents: OSSAAgent[] = [];
    let totalDiscoveryTime = 0;
    let totalFound = 0;

    // Collect all agents from all results
    for (const result of results) {
      allAgents.push(...result.agents);
      totalDiscoveryTime += result.discoveryTimeMs;
      totalFound += result.totalFound;
    }

    // Remove duplicates based on agent ID
    const uniqueAgents = new Map<string, OSSAAgent>();
    for (const agent of allAgents) {
      // Prefer most recent version in case of duplicates
      const existing = uniqueAgents.get(agent.id);
      if (!existing || agent.lastSeen > existing.lastSeen) {
        uniqueAgents.set(agent.id, agent);
      }
    }

    // Convert back to array and apply final sorting/limiting
    const finalAgents = Array.from(uniqueAgents.values());
    const sortedAgents = this.sortAgents(finalAgents, query);
    const limitedAgents = this.limitResults(sortedAgents, query);

    return {
      agents: limitedAgents,
      discoveryTimeMs: totalDiscoveryTime / results.length,
      totalFound,
      query,
      ranking: {
        enabled: true,
        algorithm: 'federated_merge',
        factors: ['timestamp', 'registry_trust', 'agent_score']
      },
      cache: {
        hit: false
      }
    };
  }

  /**
   * Check if agent matches query criteria
   */
  private matchesQuery(agent: OSSAAgent, query: DiscoveryQuery): boolean {
    // Check capabilities
    if (query.capabilities && query.capabilities.length > 0) {
      const hasCapability = query.capabilities.some(cap =>
        agent.capabilities.primary.includes(cap) ||
        (agent.capabilities.secondary && agent.capabilities.secondary.includes(cap))
      );
      if (!hasCapability) return false;
    }

    // Check domains
    if (query.domains && query.domains.length > 0) {
      const hasDomain = query.domains.some(domain =>
        agent.capabilities.domains.includes(domain)
      );
      if (!hasDomain) return false;
    }

    // Check health status
    if (query.healthStatus && agent.status !== query.healthStatus) {
      return false;
    }

    // Check conformance tier
    if (query.conformanceTier && agent.metadata.conformanceTier !== query.conformanceTier) {
      return false;
    }

    return true;
  }

  /**
   * Sort agents based on query criteria
   */
  private sortAgents(agents: OSSAAgent[], query: DiscoveryQuery): OSSAAgent[] {
    if (!query.sortBy) return agents;

    return agents.sort((a, b) => {
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

  /**
   * Limit results based on query
   */
  private limitResults(agents: OSSAAgent[], query: DiscoveryQuery): OSSAAgent[] {
    const maxResults = query.maxResults || 50;
    return agents.slice(0, maxResults);
  }

  /**
   * Resolve conflict between two agent versions
   */
  private async resolveAgentConflict(
    localAgent: OSSAAgent,
    conflict: AgentVersion['conflicts'][0],
    strategy: FederationConfig['conflictResolutionStrategy']
  ): Promise<OSSAAgent> {
    if (!conflict) return localAgent;

    switch (strategy) {
      case 'timestamp':
        // Use the most recent version
        const localVersion = this.agentVersions.get(localAgent.id);
        return (localVersion && localVersion.timestamp > conflict.conflictingData.lastSeen!)
          ? localAgent
          : { ...localAgent, ...conflict.conflictingData };

      case 'registry_priority':
        // Use version from higher priority registry
        const conflictRegistry = this.registries.get(conflict.registryId);
        return (conflictRegistry && conflictRegistry.trustLevel === 'trusted')
          ? { ...localAgent, ...conflict.conflictingData }
          : localAgent;

      case 'agent_priority':
        // Use version from higher priority agent
        const conflictingAgent = { ...localAgent, ...conflict.conflictingData };
        return (conflictingAgent.metadata.certificationLevel === 'platinum')
          ? conflictingAgent
          : localAgent;

      case 'merge':
        // Merge non-conflicting fields
        return this.mergeAgentData(localAgent, conflict.conflictingData);

      default:
        return localAgent;
    }
  }

  /**
   * Merge agent data from two sources
   */
  private mergeAgentData(agent1: OSSAAgent, agent2: Partial<OSSAAgent>): OSSAAgent {
    // Simple merge strategy - prefer newer data for each field
    const merged = { ...agent1 };
    
    // Merge capabilities
    if (agent2.capabilities) {
      const allPrimary = [...agent1.capabilities.primary, ...(agent2.capabilities.primary || [])];
      const allSecondary = [
        ...(agent1.capabilities.secondary || []),
        ...(agent2.capabilities.secondary || [])
      ];
      const allDomains = [...agent1.capabilities.domains, ...(agent2.capabilities.domains || [])];

      merged.capabilities = {
        primary: [...new Set(allPrimary)], // Remove duplicates
        secondary: [...new Set(allSecondary)],
        domains: [...new Set(allDomains)]
      };
    }

    // Use most recent timestamps
    if (agent2.lastSeen && agent2.lastSeen > agent1.lastSeen) {
      merged.lastSeen = agent2.lastSeen;
    }

    return merged;
  }

  /**
   * Calculate checksum for agent data
   */
  private calculateChecksum(agent: OSSAAgent): string {
    const data = JSON.stringify({
      id: agent.id,
      version: agent.version,
      capabilities: agent.capabilities,
      metadata: agent.metadata,
      lastSeen: agent.lastSeen.getTime()
    });
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate unique sync operation ID
   */
  private generateSyncOperationId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Batch agents for sync operations
   */
  private batchAgents(agents: OSSAAgent[]): OSSAAgent[][] {
    const batches: OSSAAgent[][] = [];
    const batchSize = this.config.maxSyncBatchSize;
    
    for (let i = 0; i < agents.length; i += batchSize) {
      batches.push(agents.slice(i, i + batchSize));
    }
    
    return batches;
  }

  /**
   * Sync batch of agents to registry
   */
  private async syncAgentBatch(
    registryId: string,
    agents: OSSAAgent[],
    operation: SyncOperation
  ): Promise<void> {
    for (const agent of agents) {
      try {
        await this.syncSingleAgent(registryId, agent);
        operation.progress.successfulSyncs++;
      } catch (error) {
        operation.progress.failedSyncs++;
        operation.errors.push({
          registry: registryId,
          error: `Failed to sync agent ${agent.id}: ${(error as Error).message}`,
          timestamp: new Date()
        });
      }
      operation.progress.processedAgents++;
    }
  }

  /**
   * Sync single agent to registry
   */
  private async syncSingleAgent(registryId: string, agent: OSSAAgent): Promise<void> {
    const registry = this.registries.get(registryId);
    if (!registry) return;

    // Check for conflicts before syncing
    if (this.config.enableConflictDetection) {
      await this.detectAndHandleConflicts(agent, registryId);
    }

    // Perform the sync
    await this.replicateToRegistry(registryId, agent, 'update');
  }

  /**
   * Detect and handle conflicts for agent
   */
  private async detectAndHandleConflicts(agent: OSSAAgent, registryId: string): Promise<void> {
    // In a real implementation, this would query the remote registry
    // For now, we simulate conflict detection
    if (Math.random() < 0.05) { // 5% chance of conflict
      const version = this.agentVersions.get(agent.id);
      if (version) {
        const conflict = {
          registryId,
          version: version.version + 1,
          conflictType: 'data' as const,
          conflictingData: {
            ...agent,
            version: agent.version + '_conflicted'
          }
        };

        if (!version.conflicts) {
          version.conflicts = [];
        }
        version.conflicts.push(conflict);

        this.emit('conflict_detected', {
          agentId: agent.id,
          registryId,
          conflictType: conflict.conflictType
        });
      }
    }
  }

  /**
   * Stop federation and cleanup
   */
  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }

    // Cancel all ongoing sync operations
    for (const operation of this.syncOperations.values()) {
      if (operation.status === 'in_progress' || operation.status === 'pending') {
        operation.status = 'failed';
        operation.errors.push({
          registry: 'all',
          error: 'Federation stopped',
          timestamp: new Date()
        });
      }
    }

    this.emit('federation_stopped');
  }
}