/**
 * Agent Registry
 * Caches discovered agents and provides fast lookup/search capabilities
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { DiscoveredAgent, OAASServiceConfig } from '../index.js';

export interface AgentRegistryConfig {
  projectRoot: string;
  cacheEnabled?: boolean;
  cacheDirectory?: string;
  cacheTTL?: number; // Time to live in milliseconds
  maxCacheSize?: number; // Maximum number of cached agents
}

export interface CachedAgent extends DiscoveredAgent {
  cached_at: Date;
  access_count: number;
  last_accessed: Date;
  cache_key: string;
}

export interface RegistryStats {
  total_agents: number;
  cached_agents: number;
  cache_hit_rate: number;
  most_accessed: CachedAgent[];
  cache_size_mb: number;
  last_discovery: Date | null;
}

export interface SearchOptions {
  format?: string;
  capabilities?: string[];
  name_pattern?: string;
  source_path_pattern?: string;
  min_confidence?: number;
  limit?: number;
  sort_by?: 'name' | 'confidence' | 'access_count' | 'last_discovered';
}

export class AgentRegistry {
  private agents: Map<string, CachedAgent> = new Map();
  private cacheDirectory: string;
  private accessCounts: Map<string, number> = new Map();
  private lastDiscovery: Date | null = null;

  constructor(private config: AgentRegistryConfig) {
    this.cacheDirectory = config.cacheDirectory || path.join(config.projectRoot, '.oaas-cache');
    this.initializeCache();
  }

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
        // Update existing agent
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
        // Add new agent
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

    // Persist to disk if cache is enabled
    if (this.config.cacheEnabled) {
      await this.persistCache();
    }

    // Clean up old entries if cache is too large
    await this.cleanupCache();

    console.log(`✅ Registry updated: ${newAgents} new, ${updatedAgents} updated`);
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<CachedAgent | null> {
    const agent = this.agents.get(agentId);
    
    if (agent) {
      // Update access statistics
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

    if (options.capabilities && options.capabilities.length > 0) {
      results = results.filter(agent => 
        options.capabilities!.some(cap => 
          agent.capabilities.some(agentCap => 
            agentCap.name.toLowerCase().includes(cap.toLowerCase())
          )
        )
      );
    }

    if (options.name_pattern) {
      const regex = new RegExp(options.name_pattern, 'i');
      results = results.filter(agent => regex.test(agent.name));
    }

    if (options.source_path_pattern) {
      const regex = new RegExp(options.source_path_pattern, 'i');
      results = results.filter(agent => regex.test(agent.source_path));
    }

    if (options.min_confidence !== undefined) {
      results = results.filter(agent => (agent as any).confidence >= options.min_confidence!);
    }

    // Sort results
    if (options.sort_by) {
      results.sort((a, b) => {
        switch (options.sort_by) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'confidence':
            return ((b as any).confidence || 0) - ((a as any).confidence || 0);
          case 'access_count':
            return b.access_count - a.access_count;
          case 'last_discovered':
            return b.last_discovered.getTime() - a.last_discovered.getTime();
          default:
            return 0;
        }
      });
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    console.log(`📊 Search returned ${results.length} agents`);
    return results;
  }

  /**
   * Get agents by format
   */
  async getAgentsByFormat(format: string): Promise<CachedAgent[]> {
    return this.searchAgents({ format });
  }

  /**
   * Get agents by capability
   */
  async getAgentsByCapability(capabilityName: string): Promise<CachedAgent[]> {
    return this.searchAgents({ capabilities: [capabilityName] });
  }

  /**
   * Get most accessed agents
   */
  async getMostAccessedAgents(limit: number = 10): Promise<CachedAgent[]> {
    return this.searchAgents({ 
      sort_by: 'access_count', 
      limit 
    });
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    const allAgents = Array.from(this.agents.values());
    const totalAccesses = allAgents.reduce((sum, agent) => sum + agent.access_count, 0);
    const cacheHits = Array.from(this.accessCounts.values()).reduce((sum, count) => sum + count, 0);
    
    return {
      total_agents: allAgents.length,
      cached_agents: allAgents.length,
      cache_hit_rate: totalAccesses > 0 ? (cacheHits / totalAccesses) * 100 : 0,
      most_accessed: allAgents
        .sort((a, b) => b.access_count - a.access_count)
        .slice(0, 5),
      cache_size_mb: this.calculateCacheSize(),
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

    if (this.config.cacheEnabled) {
      try {
        await fs.rm(this.cacheDirectory, { recursive: true, force: true });
        await fs.mkdir(this.cacheDirectory, { recursive: true });
      } catch (error) {
        console.warn('⚠️  Failed to clear cache directory:', error.message);
      }
    }

    console.log('✅ Registry cache cleared');
  }

  /**
   * Remove agent from registry
   */
  async removeAgent(agentId: string): Promise<boolean> {
    const removed = this.agents.delete(agentId);
    this.accessCounts.delete(agentId);

    if (removed && this.config.cacheEnabled) {
      await this.persistCache();
    }

    return removed;
  }

  /**
   * Refresh agents (trigger rediscovery)
   */
  async refreshAgents(): Promise<void> {
    console.log('🔄 Triggering agent rediscovery...');
    // This would typically trigger a rediscovery process
    // For now, we just clear the cache to force fresh discovery
    await this.clearCache();
  }

  // Private methods

  private async initializeCache(): Promise<void> {
    if (!this.config.cacheEnabled) {
      return;
    }

    try {
      await fs.mkdir(this.cacheDirectory, { recursive: true });
      await this.loadCache();
    } catch (error) {
      console.warn('⚠️  Failed to initialize cache:', error.message);
    }
  }

  private async loadCache(): Promise<void> {
    try {
      const cachePath = path.join(this.cacheDirectory, 'agents.json');
      const cacheData = await fs.readFile(cachePath, 'utf-8');
      const cached = JSON.parse(cacheData);

      if (cached.agents && cached.lastDiscovery) {
        // Check if cache is still valid
        const lastDiscovery = new Date(cached.lastDiscovery);
        const now = new Date();
        const ttl = this.config.cacheTTL || (24 * 60 * 60 * 1000); // 24 hours default

        if (now.getTime() - lastDiscovery.getTime() < ttl) {
          cached.agents.forEach((agent: any) => {
            // Convert date strings back to Date objects
            agent.cached_at = new Date(agent.cached_at);
            agent.last_accessed = new Date(agent.last_accessed);
            agent.last_discovered = new Date(agent.last_discovered);
            
            this.agents.set(agent.id, agent);
            this.accessCounts.set(agent.id, agent.access_count);
          });

          this.lastDiscovery = lastDiscovery;
          console.log(`📦 Loaded ${this.agents.size} agents from cache`);
        } else {
          console.log('⏰ Cache expired, will refresh on next discovery');
        }
      }
    } catch (error) {
      console.warn('⚠️  Failed to load cache:', error.message);
    }
  }

  private async persistCache(): Promise<void> {
    try {
      const cachePath = path.join(this.cacheDirectory, 'agents.json');
      const cacheData = {
        agents: Array.from(this.agents.values()),
        lastDiscovery: this.lastDiscovery,
        stats: this.getStats()
      };

      await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
      
      // Also save access counts
      const accessCountsPath = path.join(this.cacheDirectory, 'access-counts.json');
      await fs.writeFile(
        accessCountsPath, 
        JSON.stringify(Object.fromEntries(this.accessCounts), null, 2), 
        'utf-8'
      );
    } catch (error) {
      console.warn('⚠️  Failed to persist cache:', error.message);
    }
  }

  private async cleanupCache(): Promise<void> {
    const maxSize = this.config.maxCacheSize || 1000;
    
    if (this.agents.size <= maxSize) {
      return;
    }

    console.log(`🧹 Cleaning up cache: ${this.agents.size} > ${maxSize}`);

    // Remove least accessed agents
    const agents = Array.from(this.agents.values());
    agents.sort((a, b) => a.access_count - b.access_count);
    
    const toRemove = agents.slice(0, this.agents.size - maxSize);
    for (const agent of toRemove) {
      this.agents.delete(agent.id);
      this.accessCounts.delete(agent.id);
    }

    console.log(`✅ Removed ${toRemove.length} least accessed agents`);

    if (this.config.cacheEnabled) {
      await this.persistCache();
    }
  }

  private generateCacheKey(agent: DiscoveredAgent): string {
    return `${agent.format}-${agent.source_path}-${agent.version || 'latest'}`;
  }

  private calculateCacheSize(): number {
    try {
      const data = JSON.stringify(Array.from(this.agents.values()));
      return Buffer.byteLength(data, 'utf8') / (1024 * 1024); // Size in MB
    } catch (error) {
      return 0;
    }
  }
}