/**
 * High-Performance Indexing Manager
 * Advanced indexing for sub-100ms query response times
 */

import { EventEmitter } from 'events';
import { OSSAAgent, IndexEntry } from '../types';

export interface IndexConfig {
  updateInterval: number; // Index update interval in ms
  batchSize: number; // Batch size for bulk operations
  persistenceEnabled: boolean;
  persistencePath?: string;
  bloomFilterEnabled: boolean;
  invertedIndexEnabled: boolean;
}

export interface IndexStatistics {
  totalEntries: number;
  indexSize: number;
  memoryUsage: number;
  buildTime: number;
  lastUpdate: Date;
  queryPerformance: {
    avgQueryTime: number;
    totalQueries: number;
    cacheHitRate: number;
  };
}

export interface BloomFilter {
  bitArray: Uint8Array;
  hashFunctions: number;
  size: number;
  elementCount: number;
}

export interface InvertedIndex {
  term: string;
  agentIds: Set<string>;
  frequency: number;
  lastUpdate: Date;
}

export class IndexManager extends EventEmitter {
  private config: IndexConfig;
  private isRunning = false;
  private updateInterval?: NodeJS.Timeout;

  // Primary indexes
  private capabilityIndex = new Map<string, Set<string>>();
  private domainIndex = new Map<string, Set<string>>();
  private protocolIndex = new Map<string, Set<string>>();
  private performanceIndex = new Map<string, number>(); // agentId -> performance score
  
  // Advanced indexes
  private invertedIndex = new Map<string, InvertedIndex>();
  private bloomFilter?: BloomFilter;
  private spatialIndex = new Map<string, { lat: number; lng: number; agentIds: Set<string> }>();
  
  // Query cache
  private queryCache = new Map<string, { result: Set<string>; timestamp: Date }>();
  private cacheTimeout = 300000; // 5 minutes

  // Statistics
  private stats: IndexStatistics = {
    totalEntries: 0,
    indexSize: 0,
    memoryUsage: 0,
    buildTime: 0,
    lastUpdate: new Date(0),
    queryPerformance: {
      avgQueryTime: 0,
      totalQueries: 0,
      cacheHitRate: 0,
    },
  };

  constructor(config: IndexConfig) {
    super();
    this.config = config;

    if (this.config.bloomFilterEnabled) {
      this.initializeBloomFilter(100000, 3); // 100k elements, 3 hash functions
    }
  }

  /**
   * Start the index manager
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    
    // Start periodic index updates
    this.updateInterval = setInterval(() => {
      this.optimizeIndexes();
    }, this.config.updateInterval);

    // Load persisted indexes if enabled
    if (this.config.persistenceEnabled) {
      await this.loadPersistedIndexes();
    }

    console.log('🗂️  Index Manager started');
  }

  /**
   * Stop the index manager
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Persist indexes if enabled
    if (this.config.persistenceEnabled) {
      await this.persistIndexes();
    }

    this.isRunning = false;
    console.log('🗂️  Index Manager stopped');
  }

  /**
   * Update agent in indexes
   */
  async updateAgentIndex(agent: OSSAAgent): Promise<void> {
    const startTime = performance.now();

    try {
      // Remove from old indexes if exists
      await this.removeAgentFromIndex(agent.id);

      // Add to capability index
      for (const capability of agent.capabilities.primary) {
        this.addToIndex(this.capabilityIndex, capability.toLowerCase(), agent.id);
      }

      if (agent.capabilities.secondary) {
        for (const capability of agent.capabilities.secondary) {
          this.addToIndex(this.capabilityIndex, capability.toLowerCase(), agent.id);
        }
      }

      // Add to domain index
      for (const domain of agent.capabilities.domains) {
        this.addToIndex(this.domainIndex, domain.toLowerCase(), agent.id);
        
        // Add hierarchical domain indexing
        const domainParts = domain.split('.');
        for (let i = 0; i < domainParts.length; i++) {
          const partialDomain = domainParts.slice(0, i + 1).join('.');
          this.addToIndex(this.domainIndex, partialDomain.toLowerCase(), agent.id);
        }
      }

      // Add to protocol index
      for (const protocol of agent.protocols) {
        this.addToIndex(this.protocolIndex, protocol.name.toLowerCase(), agent.id);
      }

      // Update performance index
      const performanceScore = this.calculatePerformanceScore(agent);
      this.performanceIndex.set(agent.id, performanceScore);

      // Update inverted index if enabled
      if (this.config.invertedIndexEnabled) {
        await this.updateInvertedIndex(agent);
      }

      // Update bloom filter if enabled
      if (this.bloomFilter) {
        this.addToBloomFilter(agent.id);
        for (const capability of agent.capabilities.primary) {
          this.addToBloomFilter(capability.toLowerCase());
        }
      }

      // Clear query cache
      this.queryCache.clear();

      const updateTime = performance.now() - startTime;
      this.stats.buildTime = (this.stats.buildTime + updateTime) / 2; // Running average
      this.stats.lastUpdate = new Date();
      
      this.emit('agent_indexed', { agentId: agent.id, updateTime });
      
    } catch (error) {
      console.error(`Failed to update index for agent ${agent.id}:`, error);
      throw error;
    }
  }

  /**
   * Remove agent from all indexes
   */
  async removeAgentFromIndex(agentId: string): Promise<void> {
    // Remove from all capability indexes
    for (const [capability, agentIds] of this.capabilityIndex) {
      agentIds.delete(agentId);
      if (agentIds.size === 0) {
        this.capabilityIndex.delete(capability);
      }
    }

    // Remove from domain indexes
    for (const [domain, agentIds] of this.domainIndex) {
      agentIds.delete(agentId);
      if (agentIds.size === 0) {
        this.domainIndex.delete(domain);
      }
    }

    // Remove from protocol indexes
    for (const [protocol, agentIds] of this.protocolIndex) {
      agentIds.delete(agentId);
      if (agentIds.size === 0) {
        this.protocolIndex.delete(protocol);
      }
    }

    // Remove from performance index
    this.performanceIndex.delete(agentId);

    // Remove from inverted index
    for (const [term, index] of this.invertedIndex) {
      index.agentIds.delete(agentId);
      if (index.agentIds.size === 0) {
        this.invertedIndex.delete(term);
      }
    }

    // Clear query cache
    this.queryCache.clear();

    this.emit('agent_removed_from_index', { agentId });
  }

  /**
   * Fast capability lookup
   */
  async findAgentsByCapability(capabilities: string[]): Promise<Set<string>> {
    const queryKey = `cap:${capabilities.sort().join(',')}`;
    const startTime = performance.now();
    
    // Check cache first
    const cached = this.queryCache.get(queryKey);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTimeout) {
      this.updateQueryStats(performance.now() - startTime, true);
      return cached.result;
    }

    // Bloom filter pre-check if enabled
    if (this.bloomFilter) {
      for (const capability of capabilities) {
        if (!this.bloomFilterContains(capability.toLowerCase())) {
          this.updateQueryStats(performance.now() - startTime, false);
          return new Set(); // Definitely not present
        }
      }
    }

    // Find intersection of all capability sets
    let result: Set<string> | null = null;
    
    for (const capability of capabilities) {
      const normalizedCapability = capability.toLowerCase();
      const agentIds = this.capabilityIndex.get(normalizedCapability);
      
      if (!agentIds || agentIds.size === 0) {
        result = new Set(); // If any capability has no agents, result is empty
        break;
      }

      if (result === null) {
        result = new Set(agentIds);
      } else {
        // Intersect with existing result
        result = this.intersectSets(result, agentIds);
      }

      if (result.size === 0) {
        break; // Early termination if no intersection
      }
    }

    const finalResult = result || new Set<string>();
    
    // Cache the result
    this.queryCache.set(queryKey, {
      result: finalResult,
      timestamp: new Date(),
    });

    this.updateQueryStats(performance.now() - startTime, false);
    return finalResult;
  }

  /**
   * Fast domain lookup with hierarchical support
   */
  async findAgentsByDomain(domains: string[]): Promise<Set<string>> {
    const queryKey = `dom:${domains.sort().join(',')}`;
    const startTime = performance.now();
    
    // Check cache first
    const cached = this.queryCache.get(queryKey);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTimeout) {
      this.updateQueryStats(performance.now() - startTime, true);
      return cached.result;
    }

    let result = new Set<string>();
    
    for (const domain of domains) {
      const normalizedDomain = domain.toLowerCase();
      
      // Exact match
      const exactMatch = this.domainIndex.get(normalizedDomain);
      if (exactMatch) {
        result = this.unionSets(result, exactMatch);
      }

      // Hierarchical matches (subdomains)
      for (const [indexedDomain, agentIds] of this.domainIndex) {
        if (indexedDomain.startsWith(normalizedDomain + '.') || 
            normalizedDomain.startsWith(indexedDomain + '.')) {
          result = this.unionSets(result, agentIds);
        }
      }
    }

    // Cache the result
    this.queryCache.set(queryKey, {
      result,
      timestamp: new Date(),
    });

    this.updateQueryStats(performance.now() - startTime, false);
    return result;
  }

  /**
   * Fast protocol lookup
   */
  async findAgentsByProtocol(protocols: string[]): Promise<Set<string>> {
    const queryKey = `prot:${protocols.sort().join(',')}`;
    const startTime = performance.now();
    
    // Check cache first
    const cached = this.queryCache.get(queryKey);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTimeout) {
      this.updateQueryStats(performance.now() - startTime, true);
      return cached.result;
    }

    let result = new Set<string>();
    
    for (const protocol of protocols) {
      const normalizedProtocol = protocol.toLowerCase();
      const agentIds = this.protocolIndex.get(normalizedProtocol);
      
      if (agentIds) {
        result = this.unionSets(result, agentIds);
      }
    }

    // Cache the result
    this.queryCache.set(queryKey, {
      result,
      timestamp: new Date(),
    });

    this.updateQueryStats(performance.now() - startTime, false);
    return result;
  }

  /**
   * Performance-based agent ranking
   */
  async rankAgentsByPerformance(agentIds: Set<string>): Promise<string[]> {
    const startTime = performance.now();
    
    const rankedAgents = Array.from(agentIds)
      .map(agentId => ({
        agentId,
        score: this.performanceIndex.get(agentId) || 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.agentId);

    this.updateQueryStats(performance.now() - startTime, false);
    return rankedAgents;
  }

  /**
   * Complex query with multiple criteria
   */
  async complexQuery(criteria: {
    capabilities?: string[];
    domains?: string[];
    protocols?: string[];
    performanceThreshold?: number;
  }): Promise<Set<string>> {
    const queryKey = `complex:${JSON.stringify(criteria)}`;
    const startTime = performance.now();
    
    // Check cache first
    const cached = this.queryCache.get(queryKey);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTimeout) {
      this.updateQueryStats(performance.now() - startTime, true);
      return cached.result;
    }

    let result: Set<string> | null = null;

    // Apply capability filter
    if (criteria.capabilities?.length) {
      const capabilityMatches = await this.findAgentsByCapability(criteria.capabilities);
      result = result ? this.intersectSets(result, capabilityMatches) : capabilityMatches;
    }

    // Apply domain filter
    if (criteria.domains?.length && result && result.size > 0) {
      const domainMatches = await this.findAgentsByDomain(criteria.domains);
      result = this.intersectSets(result, domainMatches);
    }

    // Apply protocol filter
    if (criteria.protocols?.length && result && result.size > 0) {
      const protocolMatches = await this.findAgentsByProtocol(criteria.protocols);
      result = this.intersectSets(result, protocolMatches);
    }

    // Apply performance filter
    if (criteria.performanceThreshold && result && result.size > 0) {
      const performanceFiltered = new Set<string>();
      for (const agentId of result) {
        const score = this.performanceIndex.get(agentId) || 0;
        if (score >= criteria.performanceThreshold) {
          performanceFiltered.add(agentId);
        }
      }
      result = performanceFiltered;
    }

    const finalResult = result || new Set<string>();
    
    // Cache the result
    this.queryCache.set(queryKey, {
      result: finalResult,
      timestamp: new Date(),
    });

    this.updateQueryStats(performance.now() - startTime, false);
    return finalResult;
  }

  /**
   * Get index statistics
   */
  getStatistics(): IndexStatistics {
    this.updateMemoryUsage();
    return { ...this.stats };
  }

  /**
   * Check if index manager is healthy
   */
  isHealthy(): boolean {
    return this.isRunning && 
           this.stats.queryPerformance.avgQueryTime < 50 && // Less than 50ms avg query time
           this.stats.queryPerformance.cacheHitRate > 0.5; // At least 50% cache hit rate
  }

  /**
   * Rebuild all indexes
   */
  async rebuildIndexes(): Promise<void> {
    const startTime = performance.now();
    
    // Clear existing indexes
    this.capabilityIndex.clear();
    this.domainIndex.clear();
    this.protocolIndex.clear();
    this.performanceIndex.clear();
    this.invertedIndex.clear();
    this.queryCache.clear();

    // Reinitialize bloom filter if enabled
    if (this.config.bloomFilterEnabled) {
      this.initializeBloomFilter(100000, 3);
    }

    const rebuildTime = performance.now() - startTime;
    this.stats.buildTime = rebuildTime;
    this.stats.lastUpdate = new Date();
    
    this.emit('indexes_rebuilt', { rebuildTime });
  }

  // Private methods

  private addToIndex(index: Map<string, Set<string>>, key: string, agentId: string): void {
    if (!index.has(key)) {
      index.set(key, new Set());
    }
    index.get(key)!.add(agentId);
  }

  private intersectSets<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    const result = new Set<T>();
    for (const item of setA) {
      if (setB.has(item)) {
        result.add(item);
      }
    }
    return result;
  }

  private unionSets<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    const result = new Set(setA);
    for (const item of setB) {
      result.add(item);
    }
    return result;
  }

  private calculatePerformanceScore(agent: OSSAAgent): number {
    const metrics = agent.performance;
    
    // Weighted scoring
    const responseTimeScore = Math.max(0, 1 - (metrics.avgResponseTimeMs / 1000));
    const uptimeScore = metrics.uptimePercentage / 100;
    const successScore = metrics.successRate;
    const throughputScore = Math.min(1, metrics.throughputRps / 100);
    
    return (responseTimeScore * 0.3) + (uptimeScore * 0.3) + (successScore * 0.3) + (throughputScore * 0.1);
  }

  private async updateInvertedIndex(agent: OSSAAgent): Promise<void> {
    const terms = [
      ...agent.capabilities.primary,
      ...(agent.capabilities.secondary || []),
      ...agent.capabilities.domains,
      agent.name,
      agent.metadata.class,
      agent.metadata.category,
    ];

    for (const term of terms) {
      const normalizedTerm = term.toLowerCase();
      
      if (!this.invertedIndex.has(normalizedTerm)) {
        this.invertedIndex.set(normalizedTerm, {
          term: normalizedTerm,
          agentIds: new Set(),
          frequency: 0,
          lastUpdate: new Date(),
        });
      }

      const index = this.invertedIndex.get(normalizedTerm)!;
      index.agentIds.add(agent.id);
      index.frequency++;
      index.lastUpdate = new Date();
    }
  }

  private initializeBloomFilter(expectedElements: number, hashFunctions: number): void {
    // Calculate optimal bit array size
    const size = Math.ceil(-expectedElements * Math.log(0.01) / (Math.log(2) * Math.log(2)));
    
    this.bloomFilter = {
      bitArray: new Uint8Array(Math.ceil(size / 8)),
      hashFunctions,
      size,
      elementCount: 0,
    };
  }

  private addToBloomFilter(item: string): void {
    if (!this.bloomFilter) return;

    const hashes = this.generateHashes(item, this.bloomFilter.hashFunctions, this.bloomFilter.size);
    
    for (const hash of hashes) {
      const byteIndex = Math.floor(hash / 8);
      const bitIndex = hash % 8;
      this.bloomFilter.bitArray[byteIndex] |= (1 << bitIndex);
    }
    
    this.bloomFilter.elementCount++;
  }

  private bloomFilterContains(item: string): boolean {
    if (!this.bloomFilter) return true;

    const hashes = this.generateHashes(item, this.bloomFilter.hashFunctions, this.bloomFilter.size);
    
    for (const hash of hashes) {
      const byteIndex = Math.floor(hash / 8);
      const bitIndex = hash % 8;
      
      if ((this.bloomFilter.bitArray[byteIndex] & (1 << bitIndex)) === 0) {
        return false; // Definitely not present
      }
    }
    
    return true; // Possibly present
  }

  private generateHashes(item: string, count: number, size: number): number[] {
    const hashes: number[] = [];
    
    // Simple hash functions (could be improved with murmur hash)
    for (let i = 0; i < count; i++) {
      let hash = 0;
      for (let j = 0; j < item.length; j++) {
        hash = ((hash << 5) + hash + item.charCodeAt(j) + i) % size;
      }
      hashes.push(Math.abs(hash));
    }
    
    return hashes;
  }

  private updateQueryStats(queryTime: number, cacheHit: boolean): void {
    this.stats.queryPerformance.totalQueries++;
    
    // Update average query time
    const total = this.stats.queryPerformance.avgQueryTime * (this.stats.queryPerformance.totalQueries - 1);
    this.stats.queryPerformance.avgQueryTime = (total + queryTime) / this.stats.queryPerformance.totalQueries;
    
    // Update cache hit rate
    if (cacheHit) {
      const hits = this.stats.queryPerformance.cacheHitRate * (this.stats.queryPerformance.totalQueries - 1) + 1;
      this.stats.queryPerformance.cacheHitRate = hits / this.stats.queryPerformance.totalQueries;
    } else {
      const hits = this.stats.queryPerformance.cacheHitRate * (this.stats.queryPerformance.totalQueries - 1);
      this.stats.queryPerformance.cacheHitRate = hits / this.stats.queryPerformance.totalQueries;
    }
  }

  private updateMemoryUsage(): void {
    let size = 0;
    
    // Estimate index sizes
    for (const [key, agentIds] of this.capabilityIndex) {
      size += key.length * 2; // Unicode string
      size += agentIds.size * 36; // Assuming 36-char agent IDs
    }
    
    for (const [key, agentIds] of this.domainIndex) {
      size += key.length * 2;
      size += agentIds.size * 36;
    }
    
    for (const [key, agentIds] of this.protocolIndex) {
      size += key.length * 2;
      size += agentIds.size * 36;
    }
    
    // Add bloom filter size if present
    if (this.bloomFilter) {
      size += this.bloomFilter.bitArray.length;
    }
    
    this.stats.memoryUsage = size;
    this.stats.indexSize = this.capabilityIndex.size + this.domainIndex.size + this.protocolIndex.size;
    this.stats.totalEntries = this.performanceIndex.size;
  }

  private optimizeIndexes(): void {
    // Clean up empty index entries
    for (const [key, agentIds] of this.capabilityIndex) {
      if (agentIds.size === 0) {
        this.capabilityIndex.delete(key);
      }
    }
    
    for (const [key, agentIds] of this.domainIndex) {
      if (agentIds.size === 0) {
        this.domainIndex.delete(key);
      }
    }
    
    for (const [key, agentIds] of this.protocolIndex) {
      if (agentIds.size === 0) {
        this.protocolIndex.delete(key);
      }
    }

    // Clean up expired cache entries
    const now = Date.now();
    for (const [key, cached] of this.queryCache) {
      if (now - cached.timestamp.getTime() > this.cacheTimeout) {
        this.queryCache.delete(key);
      }
    }

    this.emit('indexes_optimized');
  }

  private async persistIndexes(): Promise<void> {
    if (!this.config.persistenceEnabled || !this.config.persistencePath) return;

    try {
      const indexData = {
        capabilityIndex: Array.from(this.capabilityIndex.entries()),
        domainIndex: Array.from(this.domainIndex.entries()),
        protocolIndex: Array.from(this.protocolIndex.entries()),
        performanceIndex: Array.from(this.performanceIndex.entries()),
        stats: this.stats,
        timestamp: new Date().toISOString(),
      };

      const { writeFile, mkdir } = await import('fs/promises');
      const { dirname } = await import('path');
      
      await mkdir(dirname(this.config.persistencePath), { recursive: true });
      await writeFile(this.config.persistencePath, JSON.stringify(indexData));
      
      this.emit('indexes_persisted', { path: this.config.persistencePath });
      
    } catch (error) {
      console.error('Failed to persist indexes:', error);
      this.emit('persistence_error', error);
    }
  }

  private async loadPersistedIndexes(): Promise<void> {
    if (!this.config.persistenceEnabled || !this.config.persistencePath) return;

    try {
      const { readFile } = await import('fs/promises');
      const dataString = await readFile(this.config.persistencePath, 'utf8');
      const indexData = JSON.parse(dataString);
      
      // Restore indexes
      this.capabilityIndex = new Map(indexData.capabilityIndex.map(
        ([key, agentIds]: [string, string[]]) => [key, new Set(agentIds)]
      ));
      
      this.domainIndex = new Map(indexData.domainIndex.map(
        ([key, agentIds]: [string, string[]]) => [key, new Set(agentIds)]
      ));
      
      this.protocolIndex = new Map(indexData.protocolIndex.map(
        ([key, agentIds]: [string, string[]]) => [key, new Set(agentIds)]
      ));
      
      this.performanceIndex = new Map(indexData.performanceIndex);
      
      if (indexData.stats) {
        this.stats = { ...this.stats, ...indexData.stats };
      }
      
      this.emit('indexes_loaded', { path: this.config.persistencePath });
      
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        console.log('No persisted indexes found, starting with empty indexes');
      } else {
        console.error('Failed to load persisted indexes:', error);
        this.emit('load_error', error);
      }
    }
  }
}