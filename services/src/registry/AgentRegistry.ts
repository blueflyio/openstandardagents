/**
 * Agent Registry
 * Caches discovered agents and provides fast lookup/search capabilities
 */

import { DiscoveredAgent } from '../index.js';

export interface AgentRegistryConfig {
  projectRoot: string;
  cacheEnabled?: boolean;
  cacheDirectory?: string;
  cacheTTL?: number;
  maxCacheSize?: number;
}

interface CachedAgent extends DiscoveredAgent {
  cached_at: Date;
  access_count: number;
  last_accessed: Date;
  cache_key: string;
}

export interface SearchOptions {
  format?: string;
  capabilities?: string[];
  name_pattern?: string;
  source_path_pattern?: string;
  min_confidence?: number;
  limit?: number;
}

export class AgentRegistry {
  private agents: Map<string, CachedAgent> = new Map();
  private accessCounts: Map<string, number> = new Map();
  private lastDiscovery: Date | null = null;

  constructor(private config: AgentRegistryConfig) {}

  /**
   * Update registry with discovered agents
   */
  async updateAgents(agents: DiscoveredAgent[]): Promise<void> {
    console.log(`📝 Updating registry with ${agents.length} agents...`);
    
    const updateTime = new Date();
    let newAgents = 0;
    let updatedAgents = 0;

    for (const agent of agents) {
      const cacheKey = this.generateCacheKey(agent);
      const existingAgent = this.agents.get(agent.id);

      if (existingAgent) {
        const updatedAgent: CachedAgent = {
          ...agent,
          cached_at: existingAgent.cached_at,
          access_count: existingAgent.access_count,
          last_accessed: existingAgent.last_accessed,
          cache_key: cacheKey,
          last_discovered: updateTime
        };
        
        this.agents.set(agent.id, updatedAgent);
        updatedAgents++;
      } else {
        const cachedAgent: CachedAgent = {
          ...agent,
          cached_at: updateTime,
          access_count: 0,
          last_accessed: updateTime,
          cache_key: cacheKey,
          last_discovered: updateTime
        };
        
        this.agents.set(agent.id, cachedAgent);
        newAgents++;
      }
    }

    this.lastDiscovery = updateTime;
    console.log(`✅ Registry updated: ${newAgents} new, ${updatedAgents} updated`);
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<CachedAgent | null> {
    const agent = this.agents.get(agentId);
    
    if (agent) {
      agent.access_count++;
      agent.last_accessed = new Date();
      this.accessCounts.set(agentId, agent.access_count);
      
      console.log(`🎯 Retrieved agent: ${agentId} (accessed ${agent.access_count} times)`);
      return agent;
    }

    console.log(`❓ Agent not found: ${agentId}`);
    return null;
  }

  /**
   * Get all agents
   */
  async getAllAgents(): Promise<CachedAgent[]> {
    return Array.from(this.agents.values());
  }

  /**
   * Search agents with filters
   */
  async searchAgents(options: SearchOptions = {}): Promise<CachedAgent[]> {
    console.log('🔍 Searching agents with filters:', options);
    
    let results = Array.from(this.agents.values());

    // Apply filters
    if (options.format) {
      results = results.filter(agent => agent.format === options.format);
    }

    if (options.name_pattern) {
      const regex = new RegExp(options.name_pattern, 'i');
      results = results.filter(agent => regex.test(agent.name));
    }

    if (options.min_confidence !== undefined) {
      results = results.filter(agent => agent.confidence >= options.min_confidence!);
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    console.log(`📊 Search returned ${results.length} agents`);
    return results;
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const allAgents = Array.from(this.agents.values());
    const totalAccesses = allAgents.reduce((sum, agent) => sum + agent.access_count, 0);
    
    return {
      total_agents: allAgents.length,
      cached_agents: allAgents.length,
      cache_hit_rate: totalAccesses > 0 ? 100 : 0,
      most_accessed: allAgents
        .sort((a, b) => b.access_count - a.access_count)
        .slice(0, 5),
      last_discovery: this.lastDiscovery
    };
  }

  /**
   * Clear registry cache
   */
  async clearCache(): Promise<void> {
    console.log('🗑️  Clearing agent registry cache...');
    
    this.agents.clear();
    this.accessCounts.clear();
    this.lastDiscovery = null;
    
    console.log('✅ Registry cache cleared');
  }

  private generateCacheKey(agent: DiscoveredAgent): string {
    return `${agent.format}-${agent.source_path}-${agent.version || 'latest'}`;
  }
}