/**
 * Just-in-Time (JIT) Token Resolver
 * Provides intelligent, cache-aware resolution with vector search optimization
 */

import { VortexToken, TokenType, ResolverContext, ResolverResult, CachePolicy, TokenError } from './token-types';

export interface JITResolverConfig {
  maxConcurrentResolutions: number;
  vectorSimilarityThreshold: number;
  adaptiveCachingEnabled: boolean;
  performanceThresholds: {
    maxResolutionTime: number;
    maxCacheSize: number;
    maxDependencyDepth: number;
  };
}

export class JITResolver {
  private resolutionCache = new Map<string, CachedResolution>();
  private resolutionLocks = new Map<string, Promise<ResolverResult>>();
  private config: JITResolverConfig;
  private performanceMetrics = new Map<string, ResolutionMetrics>();

  constructor(config: JITResolverConfig) {
    this.config = config;
    
    // Start background cache cleanup
    setInterval(() => this.performCacheCleanup(), 30000);
    setInterval(() => this.adaptCachePolicies(), 60000);
  }

  /**
   * Resolve token with just-in-time optimization
   */
  async resolveJIT(
    token: VortexToken,
    context: ResolverContext,
    resolverFn: (token: VortexToken, context: ResolverContext) => Promise<ResolverResult>
  ): Promise<ResolverResult> {
    const startTime = Date.now();
    
    // Check if resolution is already in progress
    const existingResolution = this.resolutionLocks.get(token.id);
    if (existingResolution) {
      const result = await existingResolution;
      this.recordMetrics(token.id, Date.now() - startTime, true, false);
      return result;
    }

    // Check cache with intelligent expiry
    const cachedResult = await this.getCachedResult(token, context);
    if (cachedResult) {
      this.recordMetrics(token.id, Date.now() - startTime, false, true);
      return cachedResult;
    }

    // Create resolution promise with lock
    const resolutionPromise = this.performJITResolution(token, context, resolverFn);
    this.resolutionLocks.set(token.id, resolutionPromise);

    try {
      const result = await resolutionPromise;
      
      // Cache successful results with adaptive policy
      if (result.success) {
        await this.cacheResult(token, result, context);
      }
      
      this.recordMetrics(token.id, Date.now() - startTime, false, false);
      return result;
    } finally {
      this.resolutionLocks.delete(token.id);
    }
  }

  /**
   * Perform actual JIT resolution with vector search enhancement
   */
  private async performJITResolution(
    token: VortexToken,
    context: ResolverContext,
    resolverFn: (token: VortexToken, context: ResolverContext) => Promise<ResolverResult>
  ): Promise<ResolverResult> {
    const startTime = Date.now();

    try {
      // Enhance context with vector search if available
      const enhancedContext = await this.enhanceContextWithVectorSearch(token, context);
      
      // Attempt primary resolution
      let result = await resolverFn(token, enhancedContext);
      
      // Apply JIT optimizations
      result = await this.applyJITOptimizations(token, result, enhancedContext);
      
      // Update resolution metadata
      result.metadata.resolveTime = Date.now() - startTime;
      result.metadata.vectorSimilarity = enhancedContext.vectorSimilarity;
      
      return result;
    } catch (error) {
      return {
        success: false,
        resolvedValue: null,
        dependencies: [],
        metadata: {
          resolveTime: Date.now() - startTime,
          cacheHit: false,
          fallbackUsed: false,
          costImpact: {
            tokensSaved: 0,
            computeUnitsUsed: 1,
            cacheOperations: 0,
            vectorOperations: 0
          }
        },
        error: {
          code: 'JIT_RESOLUTION_FAILED',
          message: `JIT resolution failed: ${error}`,
          category: 'resolution',
          retryable: true,
          fallbackAvailable: true
        }
      };
    }
  }

  /**
   * Enhance resolver context with vector search capabilities
   */
  private async enhanceContextWithVectorSearch(
    token: VortexToken,
    context: ResolverContext
  ): Promise<EnhancedResolverContext> {
    const enhancedContext: EnhancedResolverContext = {
      ...context,
      vectorSimilarity: 0,
      semanticMatches: [],
      contextualHints: []
    };

    if (context.qdrantClient && this.shouldUseVectorSearch(token)) {
      try {
        // Generate embedding for token context
        const embedding = await this.generateTokenEmbedding(token);
        
        // Search for similar tokens/contexts
        const searchResult = await context.qdrantClient.search('vortex-tokens', {
          vector: embedding,
          limit: 5,
          score_threshold: this.config.vectorSimilarityThreshold
        });

        enhancedContext.semanticMatches = searchResult.map((result: any) => ({
          tokenId: result.payload.tokenId,
          similarity: result.score,
          resolvedValue: result.payload.resolvedValue,
          metadata: result.payload.metadata
        }));

        // Extract contextual hints from similar resolutions
        enhancedContext.contextualHints = this.extractContextualHints(searchResult);
        enhancedContext.vectorSimilarity = searchResult[0]?.score || 0;
      } catch (error) {
        console.warn(`Vector search enhancement failed: ${error}`);
      }
    }

    return enhancedContext;
  }

  /**
   * Apply JIT-specific optimizations to resolution result
   */
  private async applyJITOptimizations(
    token: VortexToken,
    result: ResolverResult,
    context: EnhancedResolverContext
  ): Promise<ResolverResult> {
    const optimizedResult = { ...result };

    // Apply semantic similarity optimization
    if (context.semanticMatches.length > 0 && !result.success) {
      const bestMatch = context.semanticMatches[0];
      if (bestMatch.similarity > this.config.vectorSimilarityThreshold) {
        optimizedResult.success = true;
        optimizedResult.resolvedValue = bestMatch.resolvedValue;
        optimizedResult.metadata.fallbackUsed = true;
        optimizedResult.metadata.vectorSimilarity = bestMatch.similarity;
      }
    }

    // Optimize caching strategy based on usage patterns
    if (optimizedResult.success) {
      const metrics = this.performanceMetrics.get(token.id);
      if (metrics && metrics.resolutionCount > 3) {
        // Frequently accessed tokens get longer cache times
        optimizedResult.cacheTtl = this.calculateOptimalCacheTtl(token, metrics);
      }
    }

    return optimizedResult;
  }

  /**
   * Get cached result with intelligent expiry checking
   */
  private async getCachedResult(
    token: VortexToken,
    context: ResolverContext
  ): Promise<ResolverResult | null> {
    if (token.cachePolicy === CachePolicy.NO_CACHE) {
      return null;
    }

    const cached = this.resolutionCache.get(token.id);
    if (!cached) {
      return null;
    }

    // Check expiry with adaptive extension
    const now = Date.now();
    const isExpired = cached.expiresAt < now;
    
    if (isExpired && this.config.adaptiveCachingEnabled) {
      // Check if we can extend cache based on usage patterns
      const metrics = this.performanceMetrics.get(token.id);
      if (metrics && this.shouldExtendCache(token, metrics)) {
        cached.expiresAt = now + this.calculateExtendedCacheTtl(token, metrics);
      } else {
        this.resolutionCache.delete(token.id);
        return null;
      }
    } else if (isExpired) {
      this.resolutionCache.delete(token.id);
      return null;
    }

    // Update cache hit statistics
    cached.hitCount++;
    cached.lastHit = now;

    return {
      success: true,
      resolvedValue: cached.value,
      dependencies: cached.dependencies,
      cacheKey: cached.cacheKey,
      metadata: {
        resolveTime: 0,
        cacheHit: true,
        fallbackUsed: false,
        vectorSimilarity: cached.vectorSimilarity,
        costImpact: {
          tokensSaved: cached.tokensSaved,
          computeUnitsUsed: 0,
          cacheOperations: 1,
          vectorOperations: 0
        }
      }
    };
  }

  /**
   * Cache resolution result with adaptive policies
   */
  private async cacheResult(
    token: VortexToken,
    result: ResolverResult,
    context: ResolverContext
  ): Promise<void> {
    if (token.cachePolicy === CachePolicy.NO_CACHE) {
      return;
    }

    const ttl = result.cacheTtl || this.getDefaultCacheTtl(token.cachePolicy);
    const cachedResolution: CachedResolution = {
      tokenId: token.id,
      value: result.resolvedValue,
      dependencies: result.dependencies,
      cacheKey: result.cacheKey || token.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      hitCount: 0,
      lastHit: 0,
      vectorSimilarity: result.metadata.vectorSimilarity || 0,
      tokensSaved: result.metadata.costImpact.tokensSaved,
      contextHash: this.hashContext(context)
    };

    this.resolutionCache.set(token.id, cachedResolution);

    // Store in vector database for semantic search
    if (context.qdrantClient && result.metadata.vectorSimilarity !== undefined) {
      await this.storeInVectorDatabase(token, result, context);
    }

    // Cleanup if cache size exceeds threshold
    if (this.resolutionCache.size > this.config.performanceThresholds.maxCacheSize) {
      this.performCacheCleanup();
    }
  }

  /**
   * Store resolved token in vector database for future semantic matching
   */
  private async storeInVectorDatabase(
    token: VortexToken,
    result: ResolverResult,
    context: ResolverContext
  ): Promise<void> {
    try {
      const embedding = await this.generateTokenEmbedding(token);
      
      await context.qdrantClient.upsert('vortex-tokens', {
        points: [{
          id: token.id,
          vector: embedding,
          payload: {
            tokenId: token.id,
            tokenType: token.type,
            namespace: token.namespace,
            resolvedValue: result.resolvedValue,
            metadata: result.metadata,
            createdAt: Date.now()
          }
        }]
      });
    } catch (error) {
      console.warn(`Failed to store token in vector database: ${error}`);
    }
  }

  // Helper methods
  private shouldUseVectorSearch(token: VortexToken): boolean {
    return token.type === TokenType.CONTEXT || token.type === TokenType.DATA;
  }

  private async generateTokenEmbedding(token: VortexToken): Promise<number[]> {
    // Simplified embedding generation - in production, use actual embedding model
    const text = `${token.type}:${token.namespace}:${token.placeholder}`;
    return Array.from({length: 384}, (_, i) => Math.sin(i * text.length) * Math.cos(i));
  }

  private extractContextualHints(searchResults: any[]): string[] {
    return searchResults.map(result => result.payload.metadata?.hint).filter(Boolean);
  }

  private calculateOptimalCacheTtl(token: VortexToken, metrics: ResolutionMetrics): number {
    const baseTtl = this.getDefaultCacheTtl(token.cachePolicy);
    const frequencyMultiplier = Math.min(2.0, metrics.resolutionCount / 10);
    const performanceMultiplier = Math.max(0.5, 1000 / metrics.averageResolutionTime);
    
    return Math.floor(baseTtl * frequencyMultiplier * performanceMultiplier);
  }

  private shouldExtendCache(token: VortexToken, metrics: ResolutionMetrics): boolean {
    return metrics.cacheHitRate > 0.7 && metrics.averageResolutionTime > 100;
  }

  private calculateExtendedCacheTtl(token: VortexToken, metrics: ResolutionMetrics): number {
    const baseTtl = this.getDefaultCacheTtl(token.cachePolicy);
    return Math.floor(baseTtl * Math.min(3.0, metrics.cacheHitRate * 2));
  }

  private getDefaultCacheTtl(policy: CachePolicy): number {
    switch (policy) {
      case CachePolicy.SHORT_TERM: return 60 * 1000; // 1 minute
      case CachePolicy.MEDIUM_TERM: return 300 * 1000; // 5 minutes  
      case CachePolicy.LONG_TERM: return 600 * 1000; // 10 minutes
      default: return 0;
    }
  }

  private hashContext(context: ResolverContext): string {
    return JSON.stringify({
      agentId: context.agentId,
      workflowId: context.workflowId,
      stepId: context.stepId
    });
  }

  private recordMetrics(tokenId: string, resolutionTime: number, wasDuplicate: boolean, wasCacheHit: boolean): void {
    let metrics = this.performanceMetrics.get(tokenId);
    
    if (!metrics) {
      metrics = {
        tokenId,
        resolutionCount: 0,
        totalResolutionTime: 0,
        averageResolutionTime: 0,
        cacheHits: 0,
        cacheHitRate: 0,
        duplicateResolutions: 0,
        lastResolved: Date.now()
      };
    }

    if (!wasDuplicate) {
      metrics.resolutionCount++;
      metrics.totalResolutionTime += resolutionTime;
      metrics.averageResolutionTime = metrics.totalResolutionTime / metrics.resolutionCount;
    }

    if (wasCacheHit) {
      metrics.cacheHits++;
    }

    if (wasDuplicate) {
      metrics.duplicateResolutions++;
    }

    metrics.cacheHitRate = metrics.cacheHits / (metrics.resolutionCount + metrics.cacheHits);
    metrics.lastResolved = Date.now();

    this.performanceMetrics.set(tokenId, metrics);
  }

  private performCacheCleanup(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    for (const [key, cached] of this.resolutionCache.entries()) {
      if (cached.expiresAt < now) {
        entriesToDelete.push(key);
      }
    }

    // Remove expired entries
    entriesToDelete.forEach(key => this.resolutionCache.delete(key));

    // If still over capacity, remove least recently used
    if (this.resolutionCache.size > this.config.performanceThresholds.maxCacheSize) {
      const entries = Array.from(this.resolutionCache.entries())
        .sort(([, a], [, b]) => a.lastHit - b.lastHit)
        .slice(0, this.resolutionCache.size - this.config.performanceThresholds.maxCacheSize);

      entries.forEach(([key]) => this.resolutionCache.delete(key));
    }
  }

  private adaptCachePolicies(): void {
    if (!this.config.adaptiveCachingEnabled) return;

    for (const [tokenId, metrics] of this.performanceMetrics.entries()) {
      const cached = this.resolutionCache.get(tokenId);
      if (!cached) continue;

      // Extend high-performing cache entries
      if (metrics.cacheHitRate > 0.8 && metrics.averageResolutionTime > 50) {
        const extension = Math.floor(this.getDefaultCacheTtl(CachePolicy.MEDIUM_TERM) * 0.5);
        cached.expiresAt = Math.max(cached.expiresAt, Date.now() + extension);
      }
    }
  }
}

// Supporting interfaces
export interface CachedResolution {
  tokenId: string;
  value: any;
  dependencies: string[];
  cacheKey: string;
  createdAt: number;
  expiresAt: number;
  hitCount: number;
  lastHit: number;
  vectorSimilarity: number;
  tokensSaved: number;
  contextHash: string;
}

export interface ResolutionMetrics {
  tokenId: string;
  resolutionCount: number;
  totalResolutionTime: number;
  averageResolutionTime: number;
  cacheHits: number;
  cacheHitRate: number;
  duplicateResolutions: number;
  lastResolved: number;
}

export interface EnhancedResolverContext extends ResolverContext {
  vectorSimilarity: number;
  semanticMatches: SemanticMatch[];
  contextualHints: string[];
}

export interface SemanticMatch {
  tokenId: string;
  similarity: number;
  resolvedValue: any;
  metadata: any;
}