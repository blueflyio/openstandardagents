/**
 * Agent Registry
 * High-performance in-memory agent storage with persistence support
 */

import { EventEmitter } from 'events';
import { OSSAAgent } from '../types';

export interface RegistryConfig {
  persistenceEnabled?: boolean;
  persistencePath?: string;
  backupInterval?: number;
  maxAgents?: number;
}

export interface RegistryStatistics {
  total: number;
  healthy: number;
  degraded: number;
  unhealthy: number;
  byClass: Record<string, number>;
  byTier: Record<string, number>;
  byProtocol: Record<string, number>;
  registrationRate: number;
}

export class AgentRegistry extends EventEmitter {
  private agents = new Map<string, OSSAAgent>();
  private agentsByClass = new Map<string, Set<string>>();
  private agentsByTier = new Map<string, Set<string>>();
  private agentsByProtocol = new Map<string, Set<string>>();
  private agentsByCapability = new Map<string, Set<string>>();
  private agentsByDomain = new Map<string, Set<string>>();
  
  private config: RegistryConfig;
  private lastBackup = 0;
  private registrationTimes: number[] = [];

  constructor(config: RegistryConfig = {}) {
    super();
    
    this.config = {
      persistenceEnabled: false,
      persistencePath: './data/agent-registry.json',
      backupInterval: 300000, // 5 minutes
      maxAgents: 10000,
      ...config,
    };

    // Load persisted data if enabled
    if (this.config.persistenceEnabled) {
      this.loadPersistedData();
    }
  }

  /**
   * Add agent to registry
   */
  async addAgent(agent: OSSAAgent): Promise<void> {
    // Check agent limit
    if (this.agents.size >= this.config.maxAgents!) {
      throw new Error(`Registry full: maximum ${this.config.maxAgents} agents allowed`);
    }

    // Check for duplicate
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent ${agent.id} already exists in registry`);
    }

    // Add to main storage
    this.agents.set(agent.id, agent);

    // Update indexes
    this.updateIndexes(agent, 'add');

    // Track registration time
    this.registrationTimes.push(Date.now());
    if (this.registrationTimes.length > 100) {
      this.registrationTimes.shift();
    }

    // Persist if enabled
    if (this.config.persistenceEnabled) {
      await this.persistData();
    }

    this.emit('agent_added', { agentId: agent.id, agent });
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<OSSAAgent | null> {
    return this.agents.get(agentId) || null;
  }

  /**
   * Get all agents
   */
  async getAllAgents(): Promise<Map<string, OSSAAgent>> {
    return new Map(this.agents);
  }

  /**
   * Update agent information
   */
  async updateAgent(agentId: string, updatedAgent: OSSAAgent): Promise<void> {
    const existingAgent = this.agents.get(agentId);
    if (!existingAgent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Remove from old indexes
    this.updateIndexes(existingAgent, 'remove');

    // Update agent
    this.agents.set(agentId, updatedAgent);

    // Add to new indexes
    this.updateIndexes(updatedAgent, 'add');

    // Persist if enabled
    if (this.config.persistenceEnabled) {
      await this.persistData();
    }

    this.emit('agent_updated', { agentId, oldAgent: existingAgent, newAgent: updatedAgent });
  }

  /**
   * Remove agent from registry
   */
  async removeAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Remove from main storage
    this.agents.delete(agentId);

    // Remove from indexes
    this.updateIndexes(agent, 'remove');

    // Persist if enabled
    if (this.config.persistenceEnabled) {
      await this.persistData();
    }

    this.emit('agent_removed', { agentId, agent });
  }

  /**
   * Find agents by class
   */
  async findAgentsByClass(agentClass: string): Promise<OSSAAgent[]> {
    const agentIds = this.agentsByClass.get(agentClass) || new Set();
    const agents: OSSAAgent[] = [];

    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (agent) {
        agents.push(agent);
      }
    }

    return agents;
  }

  /**
   * Find agents by conformance tier
   */
  async findAgentsByTier(tier: string): Promise<OSSAAgent[]> {
    const agentIds = this.agentsByTier.get(tier) || new Set();
    const agents: OSSAAgent[] = [];

    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (agent) {
        agents.push(agent);
      }
    }

    return agents;
  }

  /**
   * Find agents by protocol support
   */
  async findAgentsByProtocol(protocol: string): Promise<OSSAAgent[]> {
    const normalizedProtocol = protocol.toLowerCase();
    const agentIds = this.agentsByProtocol.get(normalizedProtocol) || new Set();
    const agents: OSSAAgent[] = [];

    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (agent) {
        agents.push(agent);
      }
    }

    return agents;
  }

  /**
   * Find agents by capability
   */
  async findAgentsByCapability(capability: string): Promise<OSSAAgent[]> {
    const normalizedCapability = capability.toLowerCase();
    const agentIds = this.agentsByCapability.get(normalizedCapability) || new Set();
    const agents: OSSAAgent[] = [];

    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (agent) {
        agents.push(agent);
      }
    }

    return agents;
  }

  /**
   * Find agents by domain
   */
  async findAgentsByDomain(domain: string): Promise<OSSAAgent[]> {
    const normalizedDomain = domain.toLowerCase();
    const agentIds = this.agentsByDomain.get(normalizedDomain) || new Set();
    const agents: OSSAAgent[] = [];

    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (agent) {
        agents.push(agent);
      }
    }

    return agents;
  }

  /**
   * Find agents by health status
   */
  async findAgentsByHealth(status: 'healthy' | 'degraded' | 'unhealthy'): Promise<OSSAAgent[]> {
    const agents: OSSAAgent[] = [];

    for (const agent of this.agents.values()) {
      if (agent.status === status) {
        agents.push(agent);
      }
    }

    return agents;
  }

  /**
   * Search agents with complex criteria
   */
  async searchAgents(criteria: {
    class?: string;
    tier?: string;
    protocols?: string[];
    capabilities?: string[];
    domains?: string[];
    healthStatus?: 'healthy' | 'degraded' | 'unhealthy';
    namePattern?: string;
  }): Promise<OSSAAgent[]> {
    let candidateIds: Set<string> | null = null;

    // Start with most selective criteria
    if (criteria.class) {
      candidateIds = new Set(this.agentsByClass.get(criteria.class) || []);
    }

    if (criteria.tier) {
      const tierIds = new Set(this.agentsByTier.get(criteria.tier) || []);
      candidateIds = candidateIds ? this.intersectSets(candidateIds, tierIds) : tierIds;
    }

    if (criteria.protocols?.length) {
      let protocolIds = new Set<string>();
      for (const protocol of criteria.protocols) {
        const ids = this.agentsByProtocol.get(protocol.toLowerCase()) || new Set();
        protocolIds = this.unionSets(protocolIds, ids);
      }
      candidateIds = candidateIds ? this.intersectSets(candidateIds, protocolIds) : protocolIds;
    }

    if (criteria.capabilities?.length) {
      let capabilityIds = new Set<string>();
      for (const capability of criteria.capabilities) {
        const ids = this.agentsByCapability.get(capability.toLowerCase()) || new Set();
        capabilityIds = this.unionSets(capabilityIds, ids);
      }
      candidateIds = candidateIds ? this.intersectSets(candidateIds, capabilityIds) : capabilityIds;
    }

    if (criteria.domains?.length) {
      let domainIds = new Set<string>();
      for (const domain of criteria.domains) {
        const ids = this.agentsByDomain.get(domain.toLowerCase()) || new Set();
        domainIds = this.unionSets(domainIds, ids);
      }
      candidateIds = candidateIds ? this.intersectSets(candidateIds, domainIds) : domainIds;
    }

    // If no index-based criteria, use all agents
    if (!candidateIds) {
      candidateIds = new Set(this.agents.keys());
    }

    // Apply remaining filters
    const results: OSSAAgent[] = [];
    for (const agentId of candidateIds) {
      const agent = this.agents.get(agentId);
      if (!agent) continue;

      // Health status filter
      if (criteria.healthStatus && agent.status !== criteria.healthStatus) {
        continue;
      }

      // Name pattern filter
      if (criteria.namePattern) {
        const pattern = new RegExp(criteria.namePattern, 'i');
        if (!pattern.test(agent.name)) {
          continue;
        }
      }

      results.push(agent);
    }

    return results;
  }

  /**
   * Get registry statistics
   */
  getStatistics(): RegistryStatistics {
    const stats: RegistryStatistics = {
      total: this.agents.size,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      byClass: {},
      byTier: {},
      byProtocol: {},
      registrationRate: this.calculateRegistrationRate(),
    };

    // Count by health status
    for (const agent of this.agents.values()) {
      switch (agent.status) {
        case 'healthy':
          stats.healthy++;
          break;
        case 'degraded':
          stats.degraded++;
          break;
        case 'unhealthy':
          stats.unhealthy++;
          break;
      }
    }

    // Count by class
    for (const [className, agentIds] of this.agentsByClass) {
      stats.byClass[className] = agentIds.size;
    }

    // Count by tier
    for (const [tier, agentIds] of this.agentsByTier) {
      stats.byTier[tier] = agentIds.size;
    }

    // Count by protocol
    for (const [protocol, agentIds] of this.agentsByProtocol) {
      stats.byProtocol[protocol] = agentIds.size;
    }

    return stats;
  }

  /**
   * Get available capabilities
   */
  getAvailableCapabilities(): string[] {
    return Array.from(this.agentsByCapability.keys()).sort();
  }

  /**
   * Get available domains
   */
  getAvailableDomains(): string[] {
    return Array.from(this.agentsByDomain.keys()).sort();
  }

  /**
   * Get available protocols
   */
  getAvailableProtocols(): string[] {
    return Array.from(this.agentsByProtocol.keys()).sort();
  }

  /**
   * Clear all agents from registry
   */
  async clear(): Promise<void> {
    const agentCount = this.agents.size;
    
    this.agents.clear();
    this.agentsByClass.clear();
    this.agentsByTier.clear();
    this.agentsByProtocol.clear();
    this.agentsByCapability.clear();
    this.agentsByDomain.clear();

    if (this.config.persistenceEnabled) {
      await this.persistData();
    }

    this.emit('registry_cleared', { agentCount });
  }

  /**
   * Export registry data
   */
  exportData(): {
    agents: OSSAAgent[];
    metadata: {
      exportTime: string;
      agentCount: number;
      version: string;
    };
  } {
    return {
      agents: Array.from(this.agents.values()),
      metadata: {
        exportTime: new Date().toISOString(),
        agentCount: this.agents.size,
        version: '0.1.8',
      },
    };
  }

  /**
   * Import registry data
   */
  async importData(data: { agents: OSSAAgent[] }): Promise<void> {
    // Clear existing data
    await this.clear();

    // Import agents
    for (const agent of data.agents) {
      await this.addAgent(agent);
    }

    this.emit('registry_imported', { agentCount: data.agents.length });
  }

  // Private methods

  private updateIndexes(agent: OSSAAgent, operation: 'add' | 'remove'): void {
    const agentId = agent.id;

    // Class index
    this.updateSetIndex(this.agentsByClass, agent.metadata.class, agentId, operation);

    // Tier index
    this.updateSetIndex(this.agentsByTier, agent.metadata.conformanceTier, agentId, operation);

    // Protocol indexes
    for (const protocol of agent.protocols) {
      this.updateSetIndex(this.agentsByProtocol, protocol.name.toLowerCase(), agentId, operation);
    }

    // Capability indexes
    for (const capability of agent.capabilities.primary) {
      this.updateSetIndex(this.agentsByCapability, capability.toLowerCase(), agentId, operation);
    }

    if (agent.capabilities.secondary) {
      for (const capability of agent.capabilities.secondary) {
        this.updateSetIndex(this.agentsByCapability, capability.toLowerCase(), agentId, operation);
      }
    }

    // Domain indexes
    for (const domain of agent.capabilities.domains) {
      this.updateSetIndex(this.agentsByDomain, domain.toLowerCase(), agentId, operation);
    }
  }

  private updateSetIndex(
    index: Map<string, Set<string>>, 
    key: string, 
    agentId: string, 
    operation: 'add' | 'remove'
  ): void {
    if (!index.has(key)) {
      index.set(key, new Set());
    }

    const set = index.get(key)!;
    
    if (operation === 'add') {
      set.add(agentId);
    } else {
      set.delete(agentId);
      
      // Clean up empty sets
      if (set.size === 0) {
        index.delete(key);
      }
    }
  }

  private intersectSets<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    const intersection = new Set<T>();
    for (const item of setA) {
      if (setB.has(item)) {
        intersection.add(item);
      }
    }
    return intersection;
  }

  private unionSets<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    const union = new Set(setA);
    for (const item of setB) {
      union.add(item);
    }
    return union;
  }

  private calculateRegistrationRate(): number {
    if (this.registrationTimes.length < 2) return 0;

    const now = Date.now();
    const recentRegistrations = this.registrationTimes.filter(
      time => now - time < 3600000 // Last hour
    );

    return recentRegistrations.length; // Registrations per hour
  }

  private async persistData(): Promise<void> {
    if (!this.config.persistenceEnabled) return;

    const now = Date.now();
    if (now - this.lastBackup < this.config.backupInterval!) return;

    try {
      const data = this.exportData();
      const { writeFile, mkdir } = await import('fs/promises');
      const { dirname } = await import('path');
      
      // Ensure directory exists
      const dir = dirname(this.config.persistencePath!);
      await mkdir(dir, { recursive: true });
      
      // Write data
      await writeFile(this.config.persistencePath!, JSON.stringify(data, null, 2));
      
      this.lastBackup = now;
      this.emit('data_persisted', { path: this.config.persistencePath, agentCount: data.agents.length });
      
    } catch (error) {
      console.error('Failed to persist registry data:', error);
      this.emit('persistence_error', { error, path: this.config.persistencePath });
    }
  }

  private async loadPersistedData(): Promise<void> {
    if (!this.config.persistenceEnabled) return;

    try {
      const { readFile } = await import('fs/promises');
      const dataString = await readFile(this.config.persistencePath!, 'utf8');
      const data = JSON.parse(dataString);
      
      await this.importData(data);
      
      console.log(`📥 Loaded ${data.agents.length} agents from ${this.config.persistencePath}`);
      this.emit('data_loaded', { path: this.config.persistencePath, agentCount: data.agents.length });
      
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        console.log('No persisted registry data found, starting with empty registry');
      } else {
        console.error('Failed to load persisted registry data:', error);
        this.emit('load_error', { error, path: this.config.persistencePath });
      }
    }
  }
}