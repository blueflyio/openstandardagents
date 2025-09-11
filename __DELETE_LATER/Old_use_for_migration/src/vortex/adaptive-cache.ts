/**
 * Adaptive Cache System for VORTEX Tokens
 * Implements intelligent caching with 0-600s variable duration based on usage patterns
 */

import { VortexToken, CachePolicy, TokenType } from './token-types';
import { ResolutionMetrics } from './jit-resolver';

export interface AdaptiveCacheConfig {
  maxCacheSize: number;
  cleanupIntervalMs: number;
  performanceThresholds: {
    highPerformanceMs: number;
    lowPerformanceMs: number;
    highUsageThreshold: number;
    lowUsageThreshold: number;
  };
  variableDuration: {
    minDurationMs: number; // 0 seconds
    maxDurationMs: number; // 600 seconds (10 minutes)
    adaptiveMultipliers: {
      performance: number;
      usage: number;
      type: number;
      recency: number;
    };
  };
}

export interface CacheEntry {
  tokenId: string;
  value: any;
  dependencies: string[];
  metadata: CacheMetadata;
  performance: CachePerformance;
  usage: CacheUsage;
  expiresAt: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
}

export interface CacheMetadata {
  tokenType: TokenType;
  namespace: string;
  resolveTime: number;
  vectorSimilarity?: number;
  fallbackUsed: boolean;
  cacheGeneration: number;
}

export interface CachePerformance {
  averageResolveTime: number;
  resolveTimeVariance: number;
  successRate: number;
  errorRate: number;
  performanceScore: number; // 0-1, higher is better
}

export interface CacheUsage {
  hitCount: number;
  missCount: number;
  hitRate: number;
  recentAccessPattern: number[]; // Last 10 access intervals
  usageScore: number; // 0-1, higher is better
}

export class AdaptiveCache {
  private cache = new Map<string, CacheEntry>();
  private config: AdaptiveCacheConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private performanceHistory = new Map<string, number[]>();
  private accessPatterns = new Map<string, number[]>();

  constructor(config: AdaptiveCacheConfig) {
    this.config = config;
    this.startCleanupTimer();
  }

  /**
   * Store value in cache with adaptive duration
   */
  async set(
    tokenId: string,
    value: any,
    token: VortexToken,
    resolveTime: number,
    dependencies: string[] = [],
    vectorSimilarity?: number,
    fallbackUsed: boolean = false
  ): Promise<void> {
    const now = Date.now();
    const existingEntry = this.cache.get(tokenId);
    
    // Calculate adaptive cache duration
    const duration = this.calculateAdaptiveDuration(
      token,
      resolveTime,
      existingEntry?.performance,
      existingEntry?.usage
    );

    // Create or update cache entry
    const entry: CacheEntry = {
      tokenId,
      value,
      dependencies,
      metadata: {
        tokenType: token.type,
        namespace: token.namespace,
        resolveTime,
        vectorSimilarity,
        fallbackUsed,
        cacheGeneration: (existingEntry?.metadata.cacheGeneration || 0) + 1
      },
      performance: existingEntry ? 
        this.updatePerformanceMetrics(existingEntry.performance, resolveTime) :
        this.initializePerformanceMetrics(resolveTime),
      usage: existingEntry ?
        this.updateUsageMetrics(existingEntry.usage, now) :
        this.initializeUsageMetrics(),
      expiresAt: now + duration,
      createdAt: existingEntry?.createdAt || now,
      lastAccessed: now,
      accessCount: (existingEntry?.accessCount || 0) + 1
    };

    this.cache.set(tokenId, entry);
    
    // Update performance history
    this.updatePerformanceHistory(tokenId, resolveTime);
    
    // Enforce cache size limits
    await this.enforceCacheSize();
  }

  /**
   * Get value from cache with usage tracking
   */
  async get(tokenId: string): Promise<any | null> {
    const entry = this.cache.get(tokenId);
    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Check if expired
    if (entry.expiresAt < now) {
      this.cache.delete(tokenId);
      return null;
    }

    // Update usage statistics
    entry.lastAccessed = now;
    entry.accessCount++;
    entry.usage = this.updateUsageMetrics(entry.usage, now);

    // Update access pattern
    this.updateAccessPattern(tokenId, now);

    // Potentially extend cache duration for high-performing entries
    if (this.shouldExtendCache(entry)) {
      entry.expiresAt = now + this.calculateExtensionDuration(entry);
    }

    return entry.value;
  }

  /**
   * Check if token exists in cache and is valid
   */
  has(tokenId: string): boolean {
    const entry = this.cache.get(tokenId);
    if (!entry) {
      return false;
    }

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(tokenId);
      return false;
    }

    return true;
  }

  /**
   * Remove token from cache
   */
  delete(tokenId: string): boolean {
    return this.cache.delete(tokenId);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.performanceHistory.clear();
    this.accessPatterns.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const now = Date.now();
    let totalEntries = 0;
    let expiredEntries = 0;
    let totalHits = 0;
    let totalMisses = 0;
    let avgResolveTime = 0;
    let totalResolveTime = 0;

    const typeDistribution = new Map<TokenType, number>();
    const performanceDistribution = new Map<string, number>();

    for (const entry of this.cache.values()) {
      totalEntries++;
      
      if (entry.expiresAt < now) {
        expiredEntries++;
      }

      totalHits += entry.usage.hitCount;
      totalMisses += entry.usage.missCount;
      totalResolveTime += entry.metadata.resolveTime;

      // Type distribution
      const typeCount = typeDistribution.get(entry.metadata.tokenType) || 0;
      typeDistribution.set(entry.metadata.tokenType, typeCount + 1);

      // Performance distribution
      const perfCategory = this.categorizePerformance(entry.performance.performanceScore);
      const perfCount = performanceDistribution.get(perfCategory) || 0;
      performanceDistribution.set(perfCategory, perfCount + 1);
    }

    if (totalEntries > 0) {
      avgResolveTime = totalResolveTime / totalEntries;
    }

    return {
      totalEntries,
      expiredEntries,
      activeEntries: totalEntries - expiredEntries,
      hitRate: totalHits / (totalHits + totalMisses) || 0,
      avgResolveTime,
      typeDistribution: Object.fromEntries(typeDistribution),
      performanceDistribution: Object.fromEntries(performanceDistribution),
      cacheSize: this.cache.size,
      maxCacheSize: this.config.maxCacheSize,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Calculate adaptive cache duration based on multiple factors
   */
  private calculateAdaptiveDuration(
    token: VortexToken,
    resolveTime: number,
    existingPerformance?: CachePerformance,
    existingUsage?: CacheUsage
  ): number {
    const { minDurationMs, maxDurationMs, adaptiveMultipliers } = this.config.variableDuration;
    
    let baseDuration = this.getBaseDurationForType(token.type);
    let finalDuration = baseDuration;

    // Performance factor (faster resolution = longer cache)
    const performanceMultiplier = this.calculatePerformanceMultiplier(
      resolveTime,
      existingPerformance
    );
    finalDuration *= performanceMultiplier * adaptiveMultipliers.performance;

    // Usage factor (higher usage = longer cache)
    const usageMultiplier = this.calculateUsageMultiplier(existingUsage);
    finalDuration *= usageMultiplier * adaptiveMultipliers.usage;

    // Type factor (different types have different cache strategies)
    const typeMultiplier = this.calculateTypeMultiplier(token.type);
    finalDuration *= typeMultiplier * adaptiveMultipliers.type;

    // Recency factor (recently accessed = longer cache)
    const recencyMultiplier = this.calculateRecencyMultiplier(token.id);
    finalDuration *= recencyMultiplier * adaptiveMultipliers.recency;

    // Apply cache policy constraints
    finalDuration = this.applyCachePolicyConstraints(token.cachePolicy, finalDuration);

    // Ensure duration is within bounds
    return Math.max(minDurationMs, Math.min(maxDurationMs, Math.floor(finalDuration)));
  }

  private getBaseDurationForType(tokenType: TokenType): number {
    const { minDurationMs, maxDurationMs } = this.config.variableDuration;
    
    switch (tokenType) {
      case TokenType.TEMPORAL:
        return minDurationMs; // Time-sensitive data shouldn't be cached long
      case TokenType.STATE:
        return minDurationMs + (maxDurationMs - minDurationMs) * 0.1; // 60s max
      case TokenType.METRICS:
        return minDurationMs + (maxDurationMs - minDurationMs) * 0.2; // 120s max
      case TokenType.CONTEXT:
        return minDurationMs + (maxDurationMs - minDurationMs) * 0.5; // 300s max
      case TokenType.DATA:
        return minDurationMs + (maxDurationMs - minDurationMs) * 0.8; // 480s max
      default:
        return minDurationMs + (maxDurationMs - minDurationMs) * 0.5;
    }
  }

  private calculatePerformanceMultiplier(
    resolveTime: number,
    existingPerformance?: CachePerformance
  ): number {
    const { highPerformanceMs, lowPerformanceMs } = this.config.performanceThresholds;
    
    // Fast resolution gets longer cache
    if (resolveTime < highPerformanceMs) {
      return 1.5;
    } else if (resolveTime > lowPerformanceMs) {
      return 0.7;
    }
    
    // Consider existing performance
    if (existingPerformance && existingPerformance.performanceScore > 0.8) {
      return 1.3;
    }
    
    return 1.0;
  }

  private calculateUsageMultiplier(existingUsage?: CacheUsage): number {
    if (!existingUsage) {
      return 1.0;
    }

    const { highUsageThreshold, lowUsageThreshold } = this.config.performanceThresholds;
    
    if (existingUsage.hitCount > highUsageThreshold) {
      return 1.4;
    } else if (existingUsage.hitCount < lowUsageThreshold) {
      return 0.8;
    }
    
    // Consider hit rate
    if (existingUsage.hitRate > 0.8) {
      return 1.2;
    }
    
    return 1.0;
  }

  private calculateTypeMultiplier(tokenType: TokenType): number {
    switch (tokenType) {
      case TokenType.DATA:
        return 1.3; // Data artifacts are stable
      case TokenType.CONTEXT:
        return 1.1; // Context changes moderately
      case TokenType.STATE:
        return 0.8; // State changes frequently
      case TokenType.METRICS:
        return 0.9; // Metrics change frequently
      case TokenType.TEMPORAL:
        return 0.5; // Time-sensitive data
      default:
        return 1.0;
    }
  }

  private calculateRecencyMultiplier(tokenId: string): number {
    const accessPattern = this.accessPatterns.get(tokenId);
    if (!accessPattern || accessPattern.length < 2) {
      return 1.0;
    }

    // Calculate access frequency in last 10 accesses
    const recentAccesses = accessPattern.slice(-10);
    const avgInterval = this.calculateAverageInterval(recentAccesses);
    
    // Frequent recent access gets longer cache
    if (avgInterval < 60000) { // Less than 1 minute
      return 1.3;
    } else if (avgInterval < 300000) { // Less than 5 minutes
      return 1.1;
    }
    
    return 1.0;
  }

  private applyCachePolicyConstraints(policy: CachePolicy, duration: number): number {
    switch (policy) {
      case CachePolicy.NO_CACHE:
        return 0;
      case CachePolicy.SHORT_TERM:
        return Math.min(duration, 60000); // Max 1 minute
      case CachePolicy.MEDIUM_TERM:
        return Math.min(duration, 300000); // Max 5 minutes
      case CachePolicy.LONG_TERM:
        return Math.min(duration, 600000); // Max 10 minutes
      default:
        return duration;
    }
  }

  private shouldExtendCache(entry: CacheEntry): boolean {
    const now = Date.now();
    const timeUntilExpiry = entry.expiresAt - now;
    
    // Don't extend if still has significant time left
    if (timeUntilExpiry > 60000) { // More than 1 minute
      return false;
    }

    // Extend high-performing, frequently accessed entries
    return entry.performance.performanceScore > 0.7 && 
           entry.usage.usageScore > 0.7 &&
           entry.usage.hitRate > 0.8;
  }

  private calculateExtensionDuration(entry: CacheEntry): number {
    const baseExtension = 60000; // 1 minute base extension
    const performanceFactor = entry.performance.performanceScore;
    const usageFactor = entry.usage.usageScore;
    
    return Math.floor(baseExtension * (1 + performanceFactor + usageFactor));
  }

  private updatePerformanceMetrics(
    existing: CachePerformance,
    newResolveTime: number
  ): CachePerformance {
    const alpha = 0.7; // Exponential moving average factor
    
    return {
      averageResolveTime: alpha * existing.averageResolveTime + (1 - alpha) * newResolveTime,
      resolveTimeVariance: this.calculateVariance(existing.averageResolveTime, newResolveTime),
      successRate: existing.successRate, // Updated separately
      errorRate: existing.errorRate, // Updated separately
      performanceScore: this.calculatePerformanceScore(existing.averageResolveTime, existing.successRate)
    };
  }

  private initializePerformanceMetrics(resolveTime: number): CachePerformance {
    return {
      averageResolveTime: resolveTime,
      resolveTimeVariance: 0,
      successRate: 1.0,
      errorRate: 0.0,
      performanceScore: this.calculatePerformanceScore(resolveTime, 1.0)
    };
  }

  private updateUsageMetrics(existing: CacheUsage, accessTime: number): CacheUsage {
    const newHitCount = existing.hitCount + 1;
    const newHitRate = newHitCount / (newHitCount + existing.missCount);
    
    return {
      hitCount: newHitCount,
      missCount: existing.missCount,
      hitRate: newHitRate,
      recentAccessPattern: this.updateAccessPattern(existing.recentAccessPattern, accessTime),
      usageScore: this.calculateUsageScore(newHitRate, newHitCount)
    };
  }

  private initializeUsageMetrics(): CacheUsage {
    return {
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      recentAccessPattern: [],
      usageScore: 0
    };
  }

  private calculatePerformanceScore(avgResolveTime: number, successRate: number): number {
    const timeScore = Math.max(0, 1 - avgResolveTime / 1000); // Normalize to 1 second
    const reliabilityScore = successRate;
    return (timeScore * 0.6 + reliabilityScore * 0.4);
  }

  private calculateUsageScore(hitRate: number, hitCount: number): number {
    const hitRateScore = hitRate;
    const volumeScore = Math.min(1, hitCount / 10); // Normalize to 10 hits
    return hitRateScore * 0.7 + volumeScore * 0.3;
  }

  private updateAccessPattern(existingPattern: number[], accessTime: number): number[] {
    const newPattern = [...existingPattern, accessTime];
    return newPattern.slice(-10); // Keep last 10 accesses
  }

  private updatePerformanceHistory(tokenId: string, resolveTime: number): void {
    let history = this.performanceHistory.get(tokenId) || [];
    history.push(resolveTime);
    history = history.slice(-20); // Keep last 20 measurements
    this.performanceHistory.set(tokenId, history);
  }

  private updateAccessPattern(tokenId: string, accessTime: number): void {
    let pattern = this.accessPatterns.get(tokenId) || [];
    pattern.push(accessTime);
    pattern = pattern.slice(-10); // Keep last 10 accesses
    this.accessPatterns.set(tokenId, pattern);
  }

  private calculateAverageInterval(timestamps: number[]): number {
    if (timestamps.length < 2) return Infinity;
    
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    
    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  private calculateVariance(mean: number, newValue: number): number {
    const diff = newValue - mean;
    return diff * diff;
  }

  private categorizePerformance(score: number): string {
    if (score > 0.8) return 'high';
    if (score > 0.6) return 'medium';
    if (score > 0.4) return 'low';
    return 'poor';
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry).length;
    }
    return totalSize;
  }

  private async enforceCacheSize(): Promise<void> {
    if (this.cache.size <= this.config.maxCacheSize) {
      return;
    }

    // Remove expired entries first
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));

    // If still over capacity, remove least valuable entries
    if (this.cache.size > this.config.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      
      // Sort by composite score (performance + usage - recency)
      entries.sort(([, a], [, b]) => {
        const scoreA = (a.performance.performanceScore + a.usage.usageScore) / 2 - 
                      (now - a.lastAccessed) / 3600000; // Penalty for old entries
        const scoreB = (b.performance.performanceScore + b.usage.usageScore) / 2 - 
                      (now - b.lastAccessed) / 3600000;
        return scoreA - scoreB; // Ascending order (lowest scores first)
      });

      // Remove lowest scoring entries
      const toRemove = this.cache.size - this.config.maxCacheSize;
      for (let i = 0; i < toRemove; i++) {
        const [key] = entries[i];
        this.cache.delete(key);
        this.performanceHistory.delete(key);
        this.accessPatterns.delete(key);
      }
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupIntervalMs);
  }

  private performCleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.performanceHistory.delete(key);
      this.accessPatterns.delete(key);
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

export interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  activeEntries: number;
  hitRate: number;
  avgResolveTime: number;
  typeDistribution: Record<TokenType, number>;
  performanceDistribution: Record<string, number>;
  cacheSize: number;
  maxCacheSize: number;
  memoryUsage: number;
}