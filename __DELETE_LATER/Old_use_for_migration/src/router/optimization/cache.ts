/**
 * High-Performance Cache Manager
 * Advanced caching with LRU, compression, and intelligent prefetching
 */

import { EventEmitter } from 'events';
import { promisify } from 'util';
import { deflate, inflate } from 'zlib';
import { CacheEntry } from '../types';

const deflateAsync = promisify(deflate);
const inflateAsync = promisify(inflate);

export interface CacheConfig {
  maxEntries: number;
  ttl: number; // Time to live in ms
  compressionEnabled: boolean;
  compressionThreshold: number; // Compress entries larger than this (bytes)
  prefetchingEnabled: boolean;
  persistenceEnabled: boolean;
  persistencePath?: string;
}

export interface CacheStatistics {
  totalEntries: number;
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
  compressionRatio: number;
  evictions: number;
  prefetches: number;
}

export interface PrefetchPattern {
  pattern: string;
  frequency: number;
  lastAccess: Date;
}

export class CacheManager extends EventEmitter {
  private cache = new Map<string, CacheEntry>();
  private accessOrder = new Map<string, number>(); // For LRU tracking
  private config: CacheConfig;
  private isRunning = false;
  private cleanupInterval?: NodeJS.Timeout;
  private prefetchInterval?: NodeJS.Timeout;
  
  // Statistics
  private stats: CacheStatistics = {
    totalEntries: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
    memoryUsage: 0,
    compressionRatio: 1,
    evictions: 0,
    prefetches: 0,
  };

  // Prefetching
  private prefetchPatterns = new Map<string, PrefetchPattern>();
  private accessSequence: string[] = [];
  private currentTimestamp = 0;

  constructor(config: CacheConfig) {
    super();
    this.config = config;
  }

  /**
   * Start the cache manager
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute

    // Start prefetching if enabled
    if (this.config.prefetchingEnabled) {
      this.prefetchInterval = setInterval(() => {
        this.analyzePrefetchPatterns();
      }, 300000); // Every 5 minutes
    }

    // Load persisted cache if enabled
    if (this.config.persistenceEnabled) {
      await this.loadPersistedCache();
    }

    console.log('🗄️  Cache Manager started');
  }

  /**
   * Stop the cache manager
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.prefetchInterval) {
      clearInterval(this.prefetchInterval);
    }

    // Persist cache if enabled
    if (this.config.persistenceEnabled) {
      await this.persistCache();
    }

    this.isRunning = false;
    console.log('🗄️  Cache Manager stopped');
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      this.trackAccess(key);
      this.emit('cache_miss', key);
      return null;
    }

    // Check expiry
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.stats.totalEntries--;
      this.stats.misses++;
      this.updateHitRate();
      this.emit('cache_expired', key);
      return null;
    }

    // Update access tracking
    this.updateAccessOrder(key);
    this.trackAccess(key);
    
    this.stats.hits++;
    this.updateHitRate();

    // Decompress if needed
    let data = entry.data;
    if (entry.compressed) {
      try {
        const decompressed = await inflateAsync(Buffer.from(data, 'base64'));
        data = JSON.parse(decompressed.toString());
      } catch (error) {
        console.error('Cache decompression error:', error);
        this.cache.delete(key);
        return null;
      }
    }

    this.emit('cache_hit', key);
    return data as T;
  }

  /**
   * Set value in cache
   */
  async set<T = any>(key: string, value: T, customTTL?: number): Promise<void> {
    const ttl = customTTL || this.config.ttl;
    const expiry = new Date(Date.now() + ttl);
    
    let data: any = value;
    let compressed = false;
    let originalSize = 0;
    let compressedSize = 0;

    // Attempt compression if enabled
    if (this.config.compressionEnabled) {
      const serialized = JSON.stringify(value);
      originalSize = Buffer.byteLength(serialized);
      
      if (originalSize > this.config.compressionThreshold) {
        try {
          const compressedBuffer = await deflateAsync(serialized);
          compressedSize = compressedBuffer.length;
          
          // Only use compression if it provides significant savings
          if (compressedSize < originalSize * 0.8) {
            data = compressedBuffer.toString('base64');
            compressed = true;
            
            // Update compression statistics
            this.updateCompressionStats(originalSize, compressedSize);
          }
        } catch (error) {
          console.error('Cache compression error:', error);
          // Fall back to uncompressed storage
        }
      }
    }

    const entry: CacheEntry = {
      key,
      data,
      timestamp: new Date(),
      expiry,
      accessCount: 1,
      lastAccessed: new Date(),
      compressed,
      originalSize,
      compressedSize: compressed ? compressedSize : originalSize,
    };

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxEntries) {
      await this.evictLRU();
    }

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.stats.totalEntries = this.cache.size;

    this.emit('cache_set', key);
  }

  /**
   * Delete entry from cache
   */
  async delete(key: string): Promise<boolean> {
    const existed = this.cache.has(key);
    
    if (existed) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.stats.totalEntries = this.cache.size;
      this.emit('cache_delete', key);
    }

    return existed;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const entryCount = this.cache.size;
    
    this.cache.clear();
    this.accessOrder.clear();
    this.stats.totalEntries = 0;
    this.stats.memoryUsage = 0;
    
    this.emit('cache_cleared', { entryCount });
  }

  /**
   * Invalidate entries by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }

    if (keysToDelete.length > 0) {
      this.emit('cache_pattern_invalidated', { pattern, count: keysToDelete.length });
    }

    return keysToDelete.length;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Get cache statistics
   */
  getStatistics(): CacheStatistics {
    this.updateMemoryUsage();
    return { ...this.stats };
  }

  /**
   * Get cache entries (for debugging)
   */
  getEntries(): Array<{ key: string; size: number; compressed: boolean; lastAccessed: Date }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      size: entry.compressedSize || 0,
      compressed: entry.compressed || false,
      lastAccessed: entry.lastAccessed,
    }));
  }

  /**
   * Check if cache is healthy
   */
  isHealthy(): boolean {
    return this.isRunning && 
           this.cache.size < this.config.maxEntries &&
           this.stats.hitRate > 0.3; // At least 30% hit rate
  }

  /**
   * Preload cache with predicted entries
   */
  async preload(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    const promises = entries.map(({ key, value, ttl }) => this.set(key, value, ttl));
    await Promise.allSettled(promises);
    
    this.emit('cache_preloaded', { count: entries.length });
  }

  /**
   * Get memory usage in bytes
   */
  getMemoryUsage(): number {
    this.updateMemoryUsage();
    return this.stats.memoryUsage;
  }

  // Private methods

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiry.getTime();
  }

  private updateAccessOrder(key: string): void {
    this.accessOrder.set(key, this.currentTimestamp++);
    
    const entry = this.cache.get(key);
    if (entry) {
      entry.accessCount++;
      entry.lastAccessed = new Date();
    }
  }

  private async evictLRU(): Promise<void> {
    if (this.cache.size === 0) return;

    // Find least recently used entry
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, timestamp] of this.accessOrder) {
      if (timestamp < oldestTimestamp) {
        oldestTimestamp = timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      await this.delete(oldestKey);
      this.stats.evictions++;
      this.emit('cache_evicted', oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries
    for (const [key, entry] of this.cache) {
      if (now > entry.expiry.getTime()) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }

    if (expiredKeys.length > 0) {
      this.stats.totalEntries = this.cache.size;
      this.emit('cache_cleanup', { expiredCount: expiredKeys.length });
    }

    // Update memory usage
    this.updateMemoryUsage();
  }

  private trackAccess(key: string): void {
    if (!this.config.prefetchingEnabled) return;

    // Track access sequence for pattern analysis
    this.accessSequence.push(key);
    if (this.accessSequence.length > 1000) {
      this.accessSequence = this.accessSequence.slice(-500);
    }
  }

  private analyzePrefetchPatterns(): void {
    if (this.accessSequence.length < 10) return;

    const patterns = new Map<string, number>();
    
    // Analyze sequence patterns (simplified)
    for (let i = 0; i < this.accessSequence.length - 1; i++) {
      const current = this.accessSequence[i];
      const next = this.accessSequence[i + 1];
      const pattern = `${current}->${next}`;
      
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }

    // Update pattern tracking
    for (const [pattern, frequency] of patterns) {
      if (frequency >= 3) { // Minimum frequency threshold
        this.prefetchPatterns.set(pattern, {
          pattern,
          frequency,
          lastAccess: new Date(),
        });
      }
    }

    this.emit('patterns_analyzed', { 
      totalPatterns: this.prefetchPatterns.size,
      strongPatterns: Array.from(patterns.entries()).filter(([, freq]) => freq >= 5).length 
    });
  }

  private updateMemoryUsage(): void {
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      totalSize += entry.compressedSize || 0;
      totalSize += 200; // Estimated overhead per entry
    }
    
    this.stats.memoryUsage = totalSize;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private updateCompressionStats(originalSize: number, compressedSize: number): void {
    // Running average of compression ratio
    const newRatio = originalSize > 0 ? compressedSize / originalSize : 1;
    this.stats.compressionRatio = (this.stats.compressionRatio + newRatio) / 2;
  }

  private async persistCache(): Promise<void> {
    if (!this.config.persistenceEnabled || !this.config.persistencePath) return;

    try {
      const cacheData = {
        entries: Array.from(this.cache.entries()),
        timestamp: new Date().toISOString(),
        stats: this.stats,
      };

      const { writeFile, mkdir } = await import('fs/promises');
      const { dirname } = await import('path');
      
      await mkdir(dirname(this.config.persistencePath), { recursive: true });
      await writeFile(this.config.persistencePath, JSON.stringify(cacheData));
      
      this.emit('cache_persisted', { 
        path: this.config.persistencePath, 
        entryCount: this.cache.size 
      });
      
    } catch (error) {
      console.error('Failed to persist cache:', error);
      this.emit('persistence_error', error);
    }
  }

  private async loadPersistedCache(): Promise<void> {
    if (!this.config.persistenceEnabled || !this.config.persistencePath) return;

    try {
      const { readFile } = await import('fs/promises');
      const dataString = await readFile(this.config.persistencePath, 'utf8');
      const cacheData = JSON.parse(dataString);
      
      // Restore cache entries
      for (const [key, entry] of cacheData.entries) {
        // Check if entry is still valid
        if (!this.isExpired(entry)) {
          this.cache.set(key, entry);
          this.updateAccessOrder(key);
        }
      }

      this.stats.totalEntries = this.cache.size;
      
      this.emit('cache_loaded', { 
        path: this.config.persistencePath,
        entryCount: this.cache.size 
      });
      
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        console.log('No persisted cache found, starting with empty cache');
      } else {
        console.error('Failed to load persisted cache:', error);
        this.emit('load_error', error);
      }
    }
  }
}