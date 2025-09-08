/**
 * OSSA Multi-Layer Cache Manager
 * High-performance caching system with TTL management for 1000+ agents
 */

import { EventEmitter } from 'events';
import { DiscoveryQuery, DiscoveryResult, OSSAAgent } from '../router/types';

interface CacheConfig {
  layers: {
    l1: L1CacheConfig;
    l2: L2CacheConfig;
    l3: L3CacheConfig;
  };
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'adaptive';
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  metricsEnabled: boolean;
  warmupEnabled: boolean;
  prefetchEnabled: boolean;
}

interface L1CacheConfig {
  enabled: boolean;
  maxSize: number; // entries
  maxMemoryMB: number;
  defaultTTL: number; // milliseconds
  maxTTL: number;
  cleanupInterval: number;
}

interface L2CacheConfig {
  enabled: boolean;
  maxSize: number;
  maxMemoryMB: number;
  defaultTTL: number;
  cleanupInterval: number;
  persistToDisk: boolean;
  diskPath?: string;
}

interface L3CacheConfig {
  enabled: boolean;
  provider: 'redis' | 'memcached' | 'file' | 'memory';
  connectionString?: string;
  maxSize: number;
  defaultTTL: number;
  compressionThreshold: number; // bytes
}

interface CacheEntry<T = any> {
  key: string;
  value: T;
  createdAt: Date;
  expiresAt: Date;
  lastAccessed: Date;
  accessCount: number;
  size: number; // bytes
  compressed: boolean;
  metadata?: {
    tags?: string[];
    priority?: 'low' | 'normal' | 'high';
    source?: string;
    dependency?: string[];
  };
}

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  totalSize: number;
  entryCount: number;
  evictions: number;
  compressionRatio: number;
  avgResponseTime: number;
  layer: {
    l1: LayerMetrics;
    l2: LayerMetrics;
    l3: LayerMetrics;
  };
}

interface LayerMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  entryCount: number;
  evictions: number;
  avgAccessTime: number;
}

interface WarmupConfig {
  enabled: boolean;
  strategies: Array<'popular_queries' | 'recent_agents' | 'predictive'>;
  preloadSize: number;
  batchSize: number;
}

export class CacheManager extends EventEmitter {
  private config: CacheConfig;
  private l1Cache: Map<string, CacheEntry> = new Map();
  private l2Cache: Map<string, CacheEntry> = new Map();
  private l3Cache?: ExternalCache;
  private metrics: CacheMetrics;
  private cleanupTimers: NodeJS.Timeout[] = [];
  private accessOrder: string[] = []; // For LRU
  private accessFrequency: Map<string, number> = new Map(); // For LFU
  private prefetchQueue: Set<string> = new Set();

  constructor(config: Partial<CacheConfig> = {}) {
    super();

    this.config = {
      layers: {
        l1: {
          enabled: true,
          maxSize: 10000,
          maxMemoryMB: 256,
          defaultTTL: 300000, // 5 minutes
          maxTTL: 3600000, // 1 hour
          cleanupInterval: 60000, // 1 minute
          ...config.layers?.l1
        },
        l2: {
          enabled: true,
          maxSize: 100000,
          maxMemoryMB: 1024,
          defaultTTL: 1800000, // 30 minutes
          cleanupInterval: 300000, // 5 minutes
          persistToDisk: false,
          ...config.layers?.l2
        },
        l3: {
          enabled: false,
          provider: 'memory',
          maxSize: 1000000,
          defaultTTL: 7200000, // 2 hours
          compressionThreshold: 1024,
          ...config.layers?.l3
        }
      },
      evictionPolicy: 'lru',
      compressionEnabled: true,
      encryptionEnabled: false,
      metricsEnabled: true,
      warmupEnabled: true,
      prefetchEnabled: true,
      ...config
    };

    this.initializeMetrics();
    this.initializeCacheLayers();
    this.startCleanupTasks();

    if (this.config.warmupEnabled) {
      this.warmupCache();
    }
  }

  /**
   * Get value from cache (checks all layers)
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();

    try {
      // Check L1 cache first
      if (this.config.layers.l1.enabled) {
        const l1Result = this.getFromL1<T>(key);
        if (l1Result !== null) {
          this.updateMetrics('l1', 'hit', performance.now() - startTime);
          this.updateAccessInfo(key);
          return l1Result;
        }
        this.updateMetrics('l1', 'miss', performance.now() - startTime);
      }

      // Check L2 cache
      if (this.config.layers.l2.enabled) {
        const l2Result = this.getFromL2<T>(key);
        if (l2Result !== null) {
          this.updateMetrics('l2', 'hit', performance.now() - startTime);
          
          // Promote to L1 cache
          if (this.config.layers.l1.enabled) {
            await this.setToL1(key, l2Result, this.getEntryTTL(key, 'l2'));
          }
          
          this.updateAccessInfo(key);
          return l2Result;
        }
        this.updateMetrics('l2', 'miss', performance.now() - startTime);
      }

      // Check L3 cache
      if (this.config.layers.l3.enabled && this.l3Cache) {
        const l3Result = await this.getFromL3<T>(key);
        if (l3Result !== null) {
          this.updateMetrics('l3', 'hit', performance.now() - startTime);
          
          // Promote to higher layers
          if (this.config.layers.l2.enabled) {
            await this.setToL2(key, l3Result, this.getEntryTTL(key, 'l3'));
          }
          if (this.config.layers.l1.enabled) {
            await this.setToL1(key, l3Result, this.getEntryTTL(key, 'l3'));
          }
          
          this.updateAccessInfo(key);
          return l3Result;
        }
        this.updateMetrics('l3', 'miss', performance.now() - startTime);
      }

      // Cache miss on all layers
      this.updateAccessInfo(key);
      this.triggerPrefetch(key);
      return null;

    } catch (error) {
      this.emit('cache_error', { operation: 'get', key, error });
      return null;
    }
  }

  /**
   * Set value in cache (writes to appropriate layers)
   */
  async set<T>(
    key: string, 
    value: T, 
    options?: {
      ttl?: number;
      tags?: string[];
      priority?: 'low' | 'normal' | 'high';
      layers?: Array<'l1' | 'l2' | 'l3'>;
    }
  ): Promise<void> {
    const startTime = performance.now();

    try {
      const ttl = options?.ttl || this.config.layers.l1.defaultTTL;
      const layers = options?.layers || this.getDefaultWriteLayers();
      const priority = options?.priority || 'normal';

      // Write to specified layers
      const writePromises: Promise<void>[] = [];

      if (layers.includes('l1') && this.config.layers.l1.enabled) {
        writePromises.push(this.setToL1(key, value, ttl, options));
      }

      if (layers.includes('l2') && this.config.layers.l2.enabled) {
        writePromises.push(this.setToL2(key, value, ttl, options));
      }

      if (layers.includes('l3') && this.config.layers.l3.enabled && this.l3Cache) {
        writePromises.push(this.setToL3(key, value, ttl, options));
      }

      await Promise.all(writePromises);

      // Update access tracking
      this.updateAccessInfo(key);

      // Emit cache write event
      this.emit('cache_write', {
        key,
        layers,
        size: this.calculateSize(value),
        ttl,
        priority,
        duration: performance.now() - startTime
      });

    } catch (error) {
      this.emit('cache_error', { operation: 'set', key, error });
      throw error;
    }
  }

  /**
   * Delete from all cache layers
   */
  async delete(key: string): Promise<void> {
    try {
      // Remove from all layers
      const deletePromises: Promise<void>[] = [];

      if (this.config.layers.l1.enabled) {
        deletePromises.push(this.deleteFromL1(key));
      }

      if (this.config.layers.l2.enabled) {
        deletePromises.push(this.deleteFromL2(key));
      }

      if (this.config.layers.l3.enabled && this.l3Cache) {
        deletePromises.push(this.deleteFromL3(key));
      }

      await Promise.all(deletePromises);

      // Remove from access tracking
      this.removeFromAccessTracking(key);

      this.emit('cache_delete', { key });

    } catch (error) {
      this.emit('cache_error', { operation: 'delete', key, error });
      throw error;
    }
  }

  /**
   * Clear all cache layers
   */
  async clear(layers?: Array<'l1' | 'l2' | 'l3'>): Promise<void> {
    const targetLayers = layers || ['l1', 'l2', 'l3'];

    try {
      const clearPromises: Promise<void>[] = [];

      if (targetLayers.includes('l1') && this.config.layers.l1.enabled) {
        clearPromises.push(this.clearL1());
      }

      if (targetLayers.includes('l2') && this.config.layers.l2.enabled) {
        clearPromises.push(this.clearL2());
      }

      if (targetLayers.includes('l3') && this.config.layers.l3.enabled && this.l3Cache) {
        clearPromises.push(this.clearL3());
      }

      await Promise.all(clearPromises);

      // Clear access tracking
      this.accessOrder = [];
      this.accessFrequency.clear();

      this.emit('cache_cleared', { layers: targetLayers });

    } catch (error) {
      this.emit('cache_error', { operation: 'clear', error });
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getStatistics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Invalidate cache entries by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    const keysToInvalidate = new Set<string>();

    // Find keys with matching tags
    for (const entry of this.l1Cache.values()) {
      if (entry.metadata?.tags?.some(tag => tags.includes(tag))) {
        keysToInvalidate.add(entry.key);
      }
    }

    for (const entry of this.l2Cache.values()) {
      if (entry.metadata?.tags?.some(tag => tags.includes(tag))) {
        keysToInvalidate.add(entry.key);
      }
    }

    // Delete all matching keys
    const deletePromises = Array.from(keysToInvalidate).map(key => this.delete(key));
    await Promise.all(deletePromises);

    this.emit('cache_invalidated', { tags, keysInvalidated: keysToInvalidate.size });
  }

  /**
   * Prefetch data based on patterns
   */
  async prefetch(keys: string[], dataProvider: (key: string) => Promise<any>): Promise<void> {
    if (!this.config.prefetchEnabled) return;

    const prefetchPromises = keys.map(async (key) => {
      try {
        // Check if already cached
        const cached = await this.get(key);
        if (cached !== null) return;

        // Fetch and cache data
        const data = await dataProvider(key);
        await this.set(key, data, { priority: 'low' });

      } catch (error) {
        this.emit('prefetch_error', { key, error });
      }
    });

    await Promise.allSettled(prefetchPromises);
  }

  /**
   * Warm up cache with common data
   */
  private async warmupCache(): Promise<void> {
    if (!this.config.warmupEnabled) return;

    try {
      // In a real implementation, this would load frequently accessed data
      // For now, we simulate warmup
      this.emit('cache_warmup_started');

      // Simulate warmup delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.emit('cache_warmup_completed');

    } catch (error) {
      this.emit('cache_warmup_error', { error });
    }
  }

  /**
   * Initialize cache metrics
   */
  private initializeMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      totalSize: 0,
      entryCount: 0,
      evictions: 0,
      compressionRatio: 1,
      avgResponseTime: 0,
      layer: {
        l1: { hits: 0, misses: 0, hitRate: 0, size: 0, entryCount: 0, evictions: 0, avgAccessTime: 0 },
        l2: { hits: 0, misses: 0, hitRate: 0, size: 0, entryCount: 0, evictions: 0, avgAccessTime: 0 },
        l3: { hits: 0, misses: 0, hitRate: 0, size: 0, entryCount: 0, evictions: 0, avgAccessTime: 0 }
      }
    };
  }

  /**
   * Initialize cache layers
   */
  private initializeCacheLayers(): void {
    if (this.config.layers.l3.enabled) {
      this.l3Cache = this.createL3Cache();
    }
  }

  /**
   * Start cleanup tasks for expired entries
   */
  private startCleanupTasks(): void {
    // L1 cleanup
    if (this.config.layers.l1.enabled) {
      const l1Timer = setInterval(() => {
        this.cleanupL1();
      }, this.config.layers.l1.cleanupInterval);
      this.cleanupTimers.push(l1Timer);
    }

    // L2 cleanup
    if (this.config.layers.l2.enabled) {
      const l2Timer = setInterval(() => {
        this.cleanupL2();
      }, this.config.layers.l2.cleanupInterval);
      this.cleanupTimers.push(l2Timer);
    }

    // Metrics update timer
    const metricsTimer = setInterval(() => {
      this.updateOverallMetrics();
    }, 30000); // Update every 30 seconds
    this.cleanupTimers.push(metricsTimer);
  }

  /**
   * L1 Cache Operations
   */
  private getFromL1<T>(key: string): T | null {
    const entry = this.l1Cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt <= new Date()) {
      this.l1Cache.delete(key);
      return null;
    }

    // Update access info
    entry.lastAccessed = new Date();
    entry.accessCount++;

    return entry.value;
  }

  private async setToL1<T>(
    key: string, 
    value: T, 
    ttl: number, 
    options?: { tags?: string[]; priority?: string }
  ): Promise<void> {
    // Check if we need to evict entries
    await this.ensureL1Capacity();

    const now = new Date();
    const size = this.calculateSize(value);
    const compressed = this.shouldCompress(value, size);
    const finalValue = compressed ? this.compress(value) : value;

    const entry: CacheEntry<T> = {
      key,
      value: finalValue,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttl),
      lastAccessed: now,
      accessCount: 1,
      size,
      compressed,
      metadata: {
        tags: options?.tags,
        priority: options?.priority as any,
        source: 'l1'
      }
    };

    this.l1Cache.set(key, entry);
    this.metrics.layer.l1.entryCount = this.l1Cache.size;
  }

  private async deleteFromL1(key: string): Promise<void> {
    this.l1Cache.delete(key);
    this.metrics.layer.l1.entryCount = this.l1Cache.size;
  }

  private async clearL1(): Promise<void> {
    this.l1Cache.clear();
    this.metrics.layer.l1.entryCount = 0;
    this.metrics.layer.l1.size = 0;
  }

  private cleanupL1(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [key, entry] of this.l1Cache) {
      if (entry.expiresAt <= now) {
        this.l1Cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.emit('cache_cleanup', { layer: 'l1', entriesRemoved: cleaned });
    }

    this.metrics.layer.l1.entryCount = this.l1Cache.size;
    this.metrics.layer.l1.size = this.calculateL1Size();
  }

  private async ensureL1Capacity(): Promise<void> {
    const config = this.config.layers.l1;
    
    // Check size limits
    while (this.l1Cache.size >= config.maxSize) {
      await this.evictFromL1();
    }

    // Check memory limits
    const currentMemory = this.calculateL1Size() / (1024 * 1024); // Convert to MB
    while (currentMemory > config.maxMemoryMB && this.l1Cache.size > 0) {
      await this.evictFromL1();
    }
  }

  private async evictFromL1(): Promise<void> {
    const keyToEvict = this.selectEvictionKey(Array.from(this.l1Cache.keys()));
    if (keyToEvict) {
      // Move to L2 if enabled, otherwise just delete
      if (this.config.layers.l2.enabled) {
        const entry = this.l1Cache.get(keyToEvict);
        if (entry && entry.expiresAt > new Date()) {
          await this.setToL2(keyToEvict, entry.value, entry.expiresAt.getTime() - Date.now());
        }
      }
      
      this.l1Cache.delete(keyToEvict);
      this.metrics.layer.l1.evictions++;
    }
  }

  /**
   * L2 Cache Operations
   */
  private getFromL2<T>(key: string): T | null {
    const entry = this.l2Cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt <= new Date()) {
      this.l2Cache.delete(key);
      return null;
    }

    // Update access info
    entry.lastAccessed = new Date();
    entry.accessCount++;

    return entry.compressed ? this.decompress(entry.value) : entry.value;
  }

  private async setToL2<T>(
    key: string, 
    value: T, 
    ttl: number, 
    options?: { tags?: string[]; priority?: string }
  ): Promise<void> {
    // Check capacity
    await this.ensureL2Capacity();

    const now = new Date();
    const size = this.calculateSize(value);
    const compressed = this.shouldCompress(value, size);
    const finalValue = compressed ? this.compress(value) : value;

    const entry: CacheEntry<T> = {
      key,
      value: finalValue,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttl),
      lastAccessed: now,
      accessCount: 1,
      size,
      compressed,
      metadata: {
        tags: options?.tags,
        priority: options?.priority as any,
        source: 'l2'
      }
    };

    this.l2Cache.set(key, entry);
    this.metrics.layer.l2.entryCount = this.l2Cache.size;

    // Persist to disk if enabled
    if (this.config.layers.l2.persistToDisk) {
      await this.persistL2Entry(key, entry);
    }
  }

  private async deleteFromL2(key: string): Promise<void> {
    this.l2Cache.delete(key);
    this.metrics.layer.l2.entryCount = this.l2Cache.size;
  }

  private async clearL2(): Promise<void> {
    this.l2Cache.clear();
    this.metrics.layer.l2.entryCount = 0;
    this.metrics.layer.l2.size = 0;
  }

  private cleanupL2(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [key, entry] of this.l2Cache) {
      if (entry.expiresAt <= now) {
        this.l2Cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.emit('cache_cleanup', { layer: 'l2', entriesRemoved: cleaned });
    }

    this.metrics.layer.l2.entryCount = this.l2Cache.size;
    this.metrics.layer.l2.size = this.calculateL2Size();
  }

  private async ensureL2Capacity(): Promise<void> {
    const config = this.config.layers.l2;
    
    while (this.l2Cache.size >= config.maxSize) {
      await this.evictFromL2();
    }

    const currentMemory = this.calculateL2Size() / (1024 * 1024);
    while (currentMemory > config.maxMemoryMB && this.l2Cache.size > 0) {
      await this.evictFromL2();
    }
  }

  private async evictFromL2(): Promise<void> {
    const keyToEvict = this.selectEvictionKey(Array.from(this.l2Cache.keys()));
    if (keyToEvict) {
      // Move to L3 if enabled, otherwise just delete
      if (this.config.layers.l3.enabled && this.l3Cache) {
        const entry = this.l2Cache.get(keyToEvict);
        if (entry && entry.expiresAt > new Date()) {
          await this.setToL3(keyToEvict, entry.value, entry.expiresAt.getTime() - Date.now());
        }
      }
      
      this.l2Cache.delete(keyToEvict);
      this.metrics.layer.l2.evictions++;
    }
  }

  /**
   * L3 Cache Operations (External)
   */
  private async getFromL3<T>(key: string): Promise<T | null> {
    if (!this.l3Cache) return null;
    return await this.l3Cache.get<T>(key);
  }

  private async setToL3<T>(
    key: string, 
    value: T, 
    ttl: number, 
    options?: { tags?: string[]; priority?: string }
  ): Promise<void> {
    if (!this.l3Cache) return;
    await this.l3Cache.set(key, value, ttl);
  }

  private async deleteFromL3(key: string): Promise<void> {
    if (!this.l3Cache) return;
    await this.l3Cache.delete(key);
  }

  private async clearL3(): Promise<void> {
    if (!this.l3Cache) return;
    await this.l3Cache.clear();
  }

  /**
   * Cache helper methods
   */
  private selectEvictionKey(keys: string[]): string | null {
    if (keys.length === 0) return null;

    switch (this.config.evictionPolicy) {
      case 'lru':
        return this.selectLRUKey(keys);
      case 'lfu':
        return this.selectLFUKey(keys);
      case 'ttl':
        return this.selectTTLKey(keys);
      case 'adaptive':
        return this.selectAdaptiveKey(keys);
      default:
        return keys[0];
    }
  }

  private selectLRUKey(keys: string[]): string {
    // Find least recently used key
    let oldestTime = Date.now();
    let lruKey = keys[0];

    for (const key of keys) {
      const l1Entry = this.l1Cache.get(key);
      const l2Entry = this.l2Cache.get(key);
      const entry = l1Entry || l2Entry;
      
      if (entry && entry.lastAccessed.getTime() < oldestTime) {
        oldestTime = entry.lastAccessed.getTime();
        lruKey = key;
      }
    }

    return lruKey;
  }

  private selectLFUKey(keys: string[]): string {
    let minFrequency = Infinity;
    let lfuKey = keys[0];

    for (const key of keys) {
      const frequency = this.accessFrequency.get(key) || 0;
      if (frequency < minFrequency) {
        minFrequency = frequency;
        lfuKey = key;
      }
    }

    return lfuKey;
  }

  private selectTTLKey(keys: string[]): string {
    let earliestExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    let ttlKey = keys[0];

    for (const key of keys) {
      const l1Entry = this.l1Cache.get(key);
      const l2Entry = this.l2Cache.get(key);
      const entry = l1Entry || l2Entry;
      
      if (entry && entry.expiresAt < earliestExpiry) {
        earliestExpiry = entry.expiresAt;
        ttlKey = key;
      }
    }

    return ttlKey;
  }

  private selectAdaptiveKey(keys: string[]): string {
    // Adaptive eviction based on access patterns and size
    let bestScore = -1;
    let bestKey = keys[0];

    for (const key of keys) {
      const l1Entry = this.l1Cache.get(key);
      const l2Entry = this.l2Cache.get(key);
      const entry = l1Entry || l2Entry;
      
      if (entry) {
        const recency = (Date.now() - entry.lastAccessed.getTime()) / 1000; // seconds
        const frequency = this.accessFrequency.get(key) || 1;
        const size = entry.size;
        
        // Higher score = better candidate for eviction
        const score = (recency * size) / frequency;
        
        if (score > bestScore) {
          bestScore = score;
          bestKey = key;
        }
      }
    }

    return bestKey;
  }

  private updateAccessInfo(key: string): void {
    // Update LRU order
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.unshift(key);
    
    // Keep access order manageable
    if (this.accessOrder.length > 10000) {
      this.accessOrder = this.accessOrder.slice(0, 5000);
    }

    // Update LFU frequency
    this.accessFrequency.set(key, (this.accessFrequency.get(key) || 0) + 1);
  }

  private removeFromAccessTracking(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessFrequency.delete(key);
  }

  private getDefaultWriteLayers(): Array<'l1' | 'l2' | 'l3'> {
    const layers: Array<'l1' | 'l2' | 'l3'> = [];
    
    if (this.config.layers.l1.enabled) layers.push('l1');
    if (this.config.layers.l2.enabled) layers.push('l2');
    
    return layers;
  }

  private getEntryTTL(key: string, layer: 'l1' | 'l2' | 'l3'): number {
    let entry: CacheEntry | undefined;
    
    switch (layer) {
      case 'l1':
        entry = this.l1Cache.get(key);
        break;
      case 'l2':
        entry = this.l2Cache.get(key);
        break;
      case 'l3':
        // L3 TTL would need to be retrieved from external cache
        return this.config.layers.l3.defaultTTL;
    }
    
    if (entry) {
      return entry.expiresAt.getTime() - Date.now();
    }
    
    return this.config.layers.l1.defaultTTL;
  }

  private shouldCompress<T>(value: T, size: number): boolean {
    return this.config.compressionEnabled && 
           size > this.config.layers.l3.compressionThreshold;
  }

  private compress<T>(value: T): T {
    // In a real implementation, this would use actual compression
    // For now, we simulate compression
    return value;
  }

  private decompress<T>(value: T): T {
    // In a real implementation, this would decompress
    return value;
  }

  private calculateSize<T>(value: T): number {
    // Simple size estimation
    return JSON.stringify(value).length * 2; // Rough estimate in bytes
  }

  private calculateL1Size(): number {
    let totalSize = 0;
    for (const entry of this.l1Cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  private calculateL2Size(): number {
    let totalSize = 0;
    for (const entry of this.l2Cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  private updateMetrics(layer: 'l1' | 'l2' | 'l3', operation: 'hit' | 'miss', duration: number): void {
    if (!this.config.metricsEnabled) return;

    const layerMetrics = this.metrics.layer[layer];
    
    if (operation === 'hit') {
      layerMetrics.hits++;
    } else {
      layerMetrics.misses++;
    }
    
    const totalRequests = layerMetrics.hits + layerMetrics.misses;
    layerMetrics.hitRate = totalRequests > 0 ? layerMetrics.hits / totalRequests : 0;
    layerMetrics.avgAccessTime = (layerMetrics.avgAccessTime * 0.9) + (duration * 0.1);
  }

  private updateOverallMetrics(): void {
    // Calculate overall metrics from layer metrics
    this.metrics.hits = this.metrics.layer.l1.hits + this.metrics.layer.l2.hits + this.metrics.layer.l3.hits;
    this.metrics.misses = this.metrics.layer.l1.misses + this.metrics.layer.l2.misses + this.metrics.layer.l3.misses;
    this.metrics.totalRequests = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = this.metrics.totalRequests > 0 ? this.metrics.hits / this.metrics.totalRequests : 0;
    
    this.metrics.entryCount = this.l1Cache.size + this.l2Cache.size;
    this.metrics.totalSize = this.calculateL1Size() + this.calculateL2Size();
    
    this.metrics.evictions = this.metrics.layer.l1.evictions + this.metrics.layer.l2.evictions + this.metrics.layer.l3.evictions;

    this.emit('metrics_updated', this.metrics);
  }

  private triggerPrefetch(key: string): void {
    if (!this.config.prefetchEnabled) return;
    
    // Add related keys to prefetch queue
    // This is a simplified implementation
    this.prefetchQueue.add(key);
    
    if (this.prefetchQueue.size > 100) {
      // Clear old prefetch requests
      this.prefetchQueue.clear();
    }
  }

  private async persistL2Entry(key: string, entry: CacheEntry): Promise<void> {
    if (!this.config.layers.l2.persistToDisk) return;
    
    // In a real implementation, this would write to disk
    // For now, we just simulate the operation
  }

  private createL3Cache(): ExternalCache {
    switch (this.config.layers.l3.provider) {
      case 'redis':
        return new RedisCache(this.config.layers.l3.connectionString);
      case 'memcached':
        return new MemcachedCache(this.config.layers.l3.connectionString);
      case 'file':
        return new FileCache(this.config.layers.l3.connectionString);
      default:
        return new MemoryCache();
    }
  }

  /**
   * Stop cache manager and cleanup
   */
  stop(): void {
    // Clear all timers
    this.cleanupTimers.forEach(timer => clearInterval(timer));
    this.cleanupTimers = [];

    // Close external cache connections
    if (this.l3Cache) {
      this.l3Cache.close?.();
    }

    this.emit('cache_stopped');
  }
}

/**
 * External cache interface
 */
interface ExternalCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  close?(): void;
}

/**
 * Simple in-memory cache implementation for L3
 */
class MemoryCache implements ExternalCache {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

/**
 * Redis cache implementation stub
 */
class RedisCache implements ExternalCache {
  constructor(private connectionString?: string) {}

  async get<T>(key: string): Promise<T | null> {
    // Redis implementation would go here
    return null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // Redis implementation would go here
  }

  async delete(key: string): Promise<void> {
    // Redis implementation would go here
  }

  async clear(): Promise<void> {
    // Redis implementation would go here
  }

  close(): void {
    // Close Redis connection
  }
}

/**
 * Memcached cache implementation stub
 */
class MemcachedCache implements ExternalCache {
  constructor(private connectionString?: string) {}

  async get<T>(key: string): Promise<T | null> {
    return null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // Memcached implementation
  }

  async delete(key: string): Promise<void> {
    // Memcached implementation
  }

  async clear(): Promise<void> {
    // Memcached implementation
  }

  close(): void {
    // Close connection
  }
}

/**
 * File-based cache implementation stub
 */
class FileCache implements ExternalCache {
  constructor(private basePath?: string) {}

  async get<T>(key: string): Promise<T | null> {
    return null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // File system implementation
  }

  async delete(key: string): Promise<void> {
    // File system implementation
  }

  async clear(): Promise<void> {
    // File system implementation
  }
}