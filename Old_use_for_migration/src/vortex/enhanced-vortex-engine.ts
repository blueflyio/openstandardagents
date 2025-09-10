/**
 * Enhanced VORTEX Engine with Full Integration
 * Combines JIT resolution, type-safe resolvers, adaptive caching, and vector search
 */

import { EventEmitter } from 'events';
import {
  VortexToken,
  TokenType,
  TokenResolver,
  ResolverContext,
  ResolverResult,
  FailurePolicy,
  FailureMode,
  CachePolicy,
  TokenError,
  VORTEX_TOKEN_PATTERNS,
  ValidationResult
} from './token-types';

import { JITResolver, JITResolverConfig } from './jit-resolver';
import { AdaptiveCache, AdaptiveCacheConfig } from './adaptive-cache';
import {
  TYPE_RESOLVERS,
  ContextTokenResolver,
  DataTokenResolver,
  StateTokenResolver,
  MetricsTokenResolver,
  TemporalTokenResolver
} from './type-resolvers';

export interface EnhancedVortexConfig {
  jitResolver: JITResolverConfig;
  adaptiveCache: AdaptiveCacheConfig;
  vectorSearch: {
    enabled: boolean;
    collectionName: string;
    embeddingDimension: number;
    similarityThreshold: number;
  };
  resilience: {
    maxConcurrentResolutions: number;
    circuitBreakerThreshold: number;
    timeoutMs: number;
    retryPolicy: {
      maxRetries: number;
      backoffMultiplier: number;
      maxBackoffMs: number;
    };
  };
}

export class EnhancedVortexEngine extends EventEmitter {
  private resolvers = new Map<string, TokenResolver>();
  private jitResolver: JITResolver;
  private adaptiveCache: AdaptiveCache;
  private config: EnhancedVortexConfig;
  
  // Vector search integration
  private qdrantClient?: any;
  private redisClient?: any;
  
  // Resilience mechanisms
  private circuitBreaker = new Map<string, CircuitBreakerState>();
  private resolutionQueue = new Map<string, Promise<ResolverResult>>();
  private activeResolutions = 0;
  
  // Analytics and monitoring
  private analytics: EnhancedVortexAnalytics;

  constructor(config: EnhancedVortexConfig, qdrantClient?: any, redisClient?: any) {
    super();
    
    this.config = config;
    this.qdrantClient = qdrantClient;
    this.redisClient = redisClient;
    
    // Initialize components
    this.jitResolver = new JITResolver(config.jitResolver);
    this.adaptiveCache = new AdaptiveCache(config.adaptiveCache);
    this.analytics = new EnhancedVortexAnalytics();
    
    // Register type-safe resolvers
    this.initializeTypeResolvers();
    
    // Start background processes
    this.startBackgroundProcesses();
  }

  /**
   * Process text with VORTEX tokens using enhanced resolution pipeline
   */
  async processText(
    text: string,
    context: ResolverContext,
    failurePolicy: FailurePolicy = this.getDefaultFailurePolicy()
  ): Promise<EnhancedProcessResult> {
    const processingId = this.generateProcessingId();
    const startTime = Date.now();
    
    this.emit('processingStarted', { processingId, text: text.substring(0, 100) + '...' });
    
    try {
      // Extract and validate tokens
      const tokens = this.extractAndValidateTokens(text);
      
      if (tokens.length === 0) {
        return this.createEmptyResult(text, startTime);
      }

      // Build resolution plan with dependency analysis
      const resolutionPlan = await this.buildResolutionPlan(tokens, context);
      
      // Execute resolution pipeline
      const results = await this.executeResolutionPipeline(
        resolutionPlan,
        context,
        failurePolicy
      );
      
      // Apply results to text
      let processedText = text;
      const errors: TokenError[] = [];
      
      for (const result of results) {
        if (result.success) {
          processedText = this.applyTokenResolution(processedText, result.token, result.result);
        } else {
          errors.push(result.result.error!);
          processedText = this.applyFailurePolicy(processedText, result.token, result.result, failurePolicy);
        }
      }
      
      // Calculate metrics and analytics
      const processingTime = Date.now() - startTime;
      const analyticsData = this.calculateAnalytics(tokens, results, processingTime);
      
      // Update global analytics
      this.analytics.recordProcessing(analyticsData);
      
      this.emit('processingCompleted', { 
        processingId, 
        tokensProcessed: tokens.length,
        successRate: analyticsData.successRate,
        processingTime 
      });
      
      return {
        processedText,
        originalText: text,
        processingId,
        tokensProcessed: tokens.length,
        successfulResolutions: results.filter(r => r.success).length,
        errors,
        processingTimeMs: processingTime,
        analytics: analyticsData,
        cacheStats: this.adaptiveCache.getStats(),
        vectorSearchUsed: results.some(r => r.result.metadata.vectorSimilarity !== undefined)
      };
      
    } catch (error) {
      this.emit('processingFailed', { processingId, error: error.toString() });
      throw error;
    }
  }

  /**
   * Register a custom resolver
   */
  registerResolver(resolver: TokenResolver): void {
    const key = `${resolver.type}:${resolver.namespace}`;
    this.resolvers.set(key, resolver);
    this.emit('resolverRegistered', { resolver, key });
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): VortexSystemStatus {
    return {
      engine: {
        isHealthy: true,
        activeResolutions: this.activeResolutions,
        registeredResolvers: this.resolvers.size,
        uptime: Date.now() - this.startTime
      },
      cache: this.adaptiveCache.getStats(),
      analytics: this.analytics.getOverallStats(),
      circuitBreakers: this.getCircuitBreakerStatus(),
      vectorSearch: {
        enabled: this.config.vectorSearch.enabled,
        connected: !!this.qdrantClient
      }
    };
  }

  // Private implementation methods

  private initializeTypeResolvers(): void {
    // Register all type-safe resolvers
    this.registerResolver(new ContextTokenResolver());
    this.registerResolver(new DataTokenResolver());
    this.registerResolver(new StateTokenResolver());
    this.registerResolver(new MetricsTokenResolver());
    this.registerResolver(new TemporalTokenResolver());
  }

  private extractAndValidateTokens(text: string): ValidatedVortexToken[] {
    const tokens: ValidatedVortexToken[] = [];
    
    for (const pattern of VORTEX_TOKEN_PATTERNS) {
      pattern.pattern.lastIndex = 0;
      let match;
      
      while ((match = pattern.pattern.exec(text)) !== null) {
        const [placeholder, namespace, scope, identifier] = match;
        
        const token: VortexToken = {
          id: `${pattern.type}:${namespace}:${scope}:${identifier}`,
          namespace,
          type: pattern.type,
          placeholder,
          cachePolicy: pattern.defaultCachePolicy,
          permissions: this.createDefaultPermissions(namespace),
          metadata: this.createDefaultMetadata(),
          dependencies: [],
          expiry: new Date(Date.now() + this.getDefaultTtl(pattern.defaultCachePolicy)),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Validate token
        const validation = this.validateToken(token);
        
        tokens.push({
          token,
          validation,
          isValid: validation.valid
        });
      }
    }
    
    return tokens;
  }

  private validateToken(token: VortexToken): ValidationResult {
    const resolverKey = `${token.type}:${token.namespace}`;
    const resolver = this.resolvers.get(resolverKey);
    
    if (!resolver) {
      return {
        valid: false,
        errors: [{
          code: 'NO_RESOLVER',
          message: `No resolver found for ${resolverKey}`,
          category: 'resolution',
          retryable: false,
          fallbackAvailable: false
        }],
        warnings: [],
        metadata: {
          validatedAt: new Date(),
          validator: 'enhanced-vortex-engine',
          version: '1.0',
          schemaCompliance: false
        }
      };
    }
    
    return resolver.validate(token);
  }

  private async buildResolutionPlan(
    validatedTokens: ValidatedVortexToken[],
    context: ResolverContext
  ): Promise<ResolutionPlan> {
    const validTokens = validatedTokens.filter(vt => vt.isValid).map(vt => vt.token);
    
    // Analyze dependencies
    const dependencyGraph = new Map<string, Set<string>>();
    for (const token of validTokens) {
      dependencyGraph.set(token.id, new Set(token.dependencies));
    }
    
    // Perform topological sort for resolution order
    const resolutionOrder = this.topologicalSort(dependencyGraph);
    
    // Group tokens for parallel processing where possible
    const parallelGroups = this.groupTokensForParallelProcessing(resolutionOrder, validTokens);
    
    // Check cache status for each token
    const cacheStatus = new Map<string, boolean>();
    for (const token of validTokens) {
      cacheStatus.set(token.id, this.adaptiveCache.has(token.id));
    }
    
    return {
      tokens: validTokens,
      resolutionOrder,
      parallelGroups,
      cacheStatus,
      estimatedTime: this.estimateResolutionTime(validTokens, cacheStatus)
    };
  }

  private async executeResolutionPipeline(
    plan: ResolutionPlan,
    context: ResolverContext,
    failurePolicy: FailurePolicy
  ): Promise<TokenResolutionResult[]> {
    const results: TokenResolutionResult[] = [];
    
    // Process parallel groups in sequence
    for (const group of plan.parallelGroups) {
      const groupResults = await this.processTokenGroup(group, context, failurePolicy);
      results.push(...groupResults);
    }
    
    return results;
  }

  private async processTokenGroup(
    tokens: VortexToken[],
    context: ResolverContext,
    failurePolicy: FailurePolicy
  ): Promise<TokenResolutionResult[]> {
    // Check if we're under load limits
    if (this.activeResolutions >= this.config.resilience.maxConcurrentResolutions) {
      await this.waitForCapacity();
    }
    
    // Process tokens in parallel within the group
    const promises = tokens.map(token => 
      this.resolveTokenWithResilience(token, context, failurePolicy)
    );
    
    this.activeResolutions += promises.length;
    
    try {
      const results = await Promise.all(promises);
      return results.map((result, index) => ({
        token: tokens[index],
        result,
        success: result.success
      }));
    } finally {
      this.activeResolutions -= promises.length;
    }
  }

  private async resolveTokenWithResilience(
    token: VortexToken,
    context: ResolverContext,
    failurePolicy: FailurePolicy
  ): Promise<ResolverResult> {
    const resolverKey = `${token.type}:${token.namespace}`;
    
    // Check circuit breaker
    if (this.isCircuitBreakerOpen(resolverKey)) {
      return this.createCircuitBreakerResult(token);
    }
    
    try {
      // Check cache first
      const cachedValue = await this.adaptiveCache.get(token.id);
      if (cachedValue !== null) {
        return this.createCacheHitResult(cachedValue, token);
      }
      
      // Get resolver
      const resolver = this.resolvers.get(resolverKey);
      if (!resolver) {
        return this.createNoResolverResult(token, resolverKey);
      }
      
      // Use JIT resolver with timeout
      const resolutionPromise = this.jitResolver.resolveJIT(
        token,
        context,
        resolver.resolve.bind(resolver)
      );
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Resolution timeout')), this.config.resilience.timeoutMs);
      });
      
      const result = await Promise.race([resolutionPromise, timeoutPromise]);
      
      // Update circuit breaker on success
      this.recordCircuitBreakerSuccess(resolverKey);
      
      // Cache successful results
      if (result.success) {
        await this.adaptiveCache.set(
          token.id,
          result.resolvedValue,
          token,
          result.metadata.resolveTime,
          result.dependencies,
          result.metadata.vectorSimilarity,
          result.metadata.fallbackUsed
        );
      }
      
      return result;
      
    } catch (error) {
      // Update circuit breaker on failure
      this.recordCircuitBreakerFailure(resolverKey);
      
      return {
        success: false,
        resolvedValue: null,
        dependencies: [],
        metadata: {
          resolveTime: 0,
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
          code: 'RESOLUTION_ERROR',
          message: error.toString(),
          category: 'resolution',
          retryable: true,
          fallbackAvailable: true
        }
      };
    }
  }

  // Helper methods for resilience and circuit breaking

  private isCircuitBreakerOpen(resolverKey: string): boolean {
    const state = this.circuitBreaker.get(resolverKey);
    if (!state) return false;
    
    const now = Date.now();
    
    // Check if in open state and cooling down
    if (state.state === 'open' && now < state.nextAttempt) {
      return true;
    }
    
    // Move to half-open state after cooldown
    if (state.state === 'open' && now >= state.nextAttempt) {
      state.state = 'half-open';
      state.consecutiveFailures = 0;
    }
    
    return false;
  }

  private recordCircuitBreakerSuccess(resolverKey: string): void {
    let state = this.circuitBreaker.get(resolverKey);
    if (!state) {
      state = this.createCircuitBreakerState();
    }
    
    state.consecutiveFailures = 0;
    state.state = 'closed';
    state.lastSuccess = Date.now();
    
    this.circuitBreaker.set(resolverKey, state);
  }

  private recordCircuitBreakerFailure(resolverKey: string): void {
    let state = this.circuitBreaker.get(resolverKey);
    if (!state) {
      state = this.createCircuitBreakerState();
    }
    
    state.consecutiveFailures++;
    state.totalFailures++;
    state.lastFailure = Date.now();
    
    // Open circuit if threshold exceeded
    if (state.consecutiveFailures >= this.config.resilience.circuitBreakerThreshold) {
      state.state = 'open';
      state.nextAttempt = Date.now() + 60000; // 1 minute cooldown
    }
    
    this.circuitBreaker.set(resolverKey, state);
  }

  private createCircuitBreakerState(): CircuitBreakerState {
    return {
      state: 'closed',
      consecutiveFailures: 0,
      totalFailures: 0,
      lastFailure: 0,
      lastSuccess: Date.now(),
      nextAttempt: 0
    };
  }

  // Utility and helper methods

  private generateProcessingId(): string {
    return `vortex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startTime = Date.now();

  private startBackgroundProcesses(): void {
    // Vector database maintenance
    if (this.config.vectorSearch.enabled && this.qdrantClient) {
      setInterval(() => this.maintainVectorDatabase(), 300000); // 5 minutes
    }
    
    // Analytics aggregation
    setInterval(() => this.analytics.aggregate(), 60000); // 1 minute
    
    // Circuit breaker maintenance
    setInterval(() => this.maintainCircuitBreakers(), 30000); // 30 seconds
  }

  private async maintainVectorDatabase(): Promise<void> {
    if (!this.qdrantClient) return;
    
    try {
      // Clean up old embeddings
      const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
      
      await this.qdrantClient.delete(this.config.vectorSearch.collectionName, {
        filter: {
          must: [{
            key: 'createdAt',
            range: {
              lt: cutoffTime
            }
          }]
        }
      });
      
    } catch (error) {
      console.warn(`Vector database maintenance failed: ${error}`);
    }
  }

  private maintainCircuitBreakers(): void {
    const now = Date.now();
    const staleTimeout = 300000; // 5 minutes
    
    for (const [key, state] of this.circuitBreaker.entries()) {
      // Reset stale circuit breakers
      if (now - Math.max(state.lastSuccess, state.lastFailure) > staleTimeout) {
        state.state = 'closed';
        state.consecutiveFailures = 0;
      }
    }
  }

  private getDefaultFailurePolicy(): FailurePolicy {
    return {
      mode: FailureMode.GRACEFUL_DEGRADATION,
      maxRetries: this.config.resilience.retryPolicy.maxRetries,
      backoffMultiplier: this.config.resilience.retryPolicy.backoffMultiplier,
      timeoutMs: this.config.resilience.timeoutMs,
      fallbackResolvers: [],
      allowStaleCache: true
    };
  }

  private getDefaultTtl(policy: CachePolicy): number {
    switch (policy) {
      case CachePolicy.SHORT_TERM: return 60000;
      case CachePolicy.MEDIUM_TERM: return 300000;
      case CachePolicy.LONG_TERM: return 600000;
      default: return 0;
    }
  }

  // Additional helper methods for results and analytics...
  
  private createDefaultPermissions(namespace: string) {
    return {
      readAgents: ['*'],
      writeAgents: [],
      resolveAgents: ['*'],
      namespaceAccess: [namespace]
    };
  }

  private createDefaultMetadata() {
    return {
      agentId: 'enhanced-vortex',
      workflowId: 'default',
      version: '2.0',
      lifecycle: 'active' as const,
      usage: {
        resolveCount: 0,
        cacheHits: 0,
        cacheMisses: 0,
        lastResolved: new Date(),
        averageResolveTime: 0,
        costAttribution: {
          tokensSaved: 0,
          timesSaved: 0,
          computeCostSaved: 0,
          agentCredits: {}
        }
      }
    };
  }

  private topologicalSort(graph: Map<string, Set<string>>): string[] {
    // Simplified topological sort - implement proper algorithm for production
    return Array.from(graph.keys());
  }

  private groupTokensForParallelProcessing(order: string[], tokens: VortexToken[]): VortexToken[][] {
    // Group tokens that can be resolved in parallel
    const tokenMap = new Map(tokens.map(t => [t.id, t]));
    const groups: VortexToken[][] = [];
    const processed = new Set<string>();
    
    for (const tokenId of order) {
      const token = tokenMap.get(tokenId);
      if (!token || processed.has(tokenId)) continue;
      
      // Start a new group with this token
      const group = [token];
      processed.add(tokenId);
      
      // Find other tokens that can be processed in parallel
      for (const otherId of order) {
        const otherToken = tokenMap.get(otherId);
        if (!otherToken || processed.has(otherId)) continue;
        
        // Check if tokens have no interdependencies
        if (!this.tokensHaveDependencies(token, otherToken)) {
          group.push(otherToken);
          processed.add(otherId);
        }
      }
      
      groups.push(group);
    }
    
    return groups;
  }

  private tokensHaveDependencies(token1: VortexToken, token2: VortexToken): boolean {
    return token1.dependencies.includes(token2.id) || token2.dependencies.includes(token1.id);
  }

  private estimateResolutionTime(tokens: VortexToken[], cacheStatus: Map<string, boolean>): number {
    let estimatedTime = 0;
    
    for (const token of tokens) {
      if (cacheStatus.get(token.id)) {
        estimatedTime += 5; // Cache hit
      } else {
        estimatedTime += this.getEstimatedResolveTime(token.type);
      }
    }
    
    return estimatedTime;
  }

  private getEstimatedResolveTime(tokenType: TokenType): number {
    switch (tokenType) {
      case TokenType.CONTEXT: return 50;
      case TokenType.DATA: return 100;
      case TokenType.STATE: return 75;
      case TokenType.METRICS: return 30;
      case TokenType.TEMPORAL: return 25;
      default: return 50;
    }
  }

  private async waitForCapacity(): Promise<void> {
    return new Promise(resolve => {
      const checkCapacity = () => {
        if (this.activeResolutions < this.config.resilience.maxConcurrentResolutions) {
          resolve();
        } else {
          setTimeout(checkCapacity, 10);
        }
      };
      checkCapacity();
    });
  }

  private applyTokenResolution(text: string, token: VortexToken, result: ResolverResult): string {
    return text.replace(
      new RegExp(this.escapeRegExp(token.placeholder), 'g'),
      result.resolvedValue
    );
  }

  private applyFailurePolicy(
    text: string,
    token: VortexToken,
    result: ResolverResult,
    policy: FailurePolicy
  ): string {
    switch (policy.mode) {
      case FailureMode.GRACEFUL_DEGRADATION:
        return text; // Leave token as-is
      case FailureMode.FALLBACK_RESOLVER:
        return text.replace(
          new RegExp(this.escapeRegExp(token.placeholder), 'g'),
          `[FALLBACK:${token.id}]`
        );
      default:
        return text;
    }
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private createEmptyResult(text: string, startTime: number): EnhancedProcessResult {
    return {
      processedText: text,
      originalText: text,
      processingId: this.generateProcessingId(),
      tokensProcessed: 0,
      successfulResolutions: 0,
      errors: [],
      processingTimeMs: Date.now() - startTime,
      analytics: this.createEmptyAnalytics(),
      cacheStats: this.adaptiveCache.getStats(),
      vectorSearchUsed: false
    };
  }

  private createEmptyAnalytics(): EnhancedAnalyticsData {
    return {
      totalTokens: 0,
      successfulResolutions: 0,
      failedResolutions: 0,
      successRate: 0,
      totalResolutionTime: 0,
      averageResolutionTime: 0,
      cacheHitRate: 0,
      vectorSearchUsage: 0,
      typeDistribution: {},
      performanceBreakdown: {},
      costSavings: {
        tokensSaved: 0,
        computeUnitsSaved: 0,
        estimatedCostSavings: 0
      }
    };
  }

  private calculateAnalytics(
    tokens: ValidatedVortexToken[],
    results: TokenResolutionResult[],
    processingTime: number
  ): EnhancedAnalyticsData {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const cacheHits = results.filter(r => r.result.metadata.cacheHit).length;
    const vectorSearchUsed = results.filter(r => r.result.metadata.vectorSimilarity !== undefined).length;
    
    return {
      totalTokens: tokens.length,
      successfulResolutions: successful,
      failedResolutions: failed,
      successRate: successful / tokens.length,
      totalResolutionTime: processingTime,
      averageResolutionTime: processingTime / tokens.length,
      cacheHitRate: cacheHits / tokens.length,
      vectorSearchUsage: vectorSearchUsed / tokens.length,
      typeDistribution: this.calculateTypeDistribution(tokens),
      performanceBreakdown: this.calculatePerformanceBreakdown(results),
      costSavings: this.calculateCostSavings(results)
    };
  }

  private calculateTypeDistribution(tokens: ValidatedVortexToken[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const vToken of tokens) {
      const type = vToken.token.type;
      distribution[type] = (distribution[type] || 0) + 1;
    }
    
    return distribution;
  }

  private calculatePerformanceBreakdown(results: TokenResolutionResult[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const result of results) {
      const type = result.token.type;
      if (!breakdown[type]) {
        breakdown[type] = 0;
      }
      breakdown[type] += result.result.metadata.resolveTime;
    }
    
    return breakdown;
  }

  private calculateCostSavings(results: TokenResolutionResult[]): CostSavings {
    let totalTokensSaved = 0;
    let totalComputeUnitsSaved = 0;
    
    for (const result of results) {
      totalTokensSaved += result.result.metadata.costImpact.tokensSaved;
      if (result.result.metadata.cacheHit) {
        totalComputeUnitsSaved += 1; // Saved one compute unit by using cache
      }
    }
    
    return {
      tokensSaved: totalTokensSaved,
      computeUnitsSaved: totalComputeUnitsSaved,
      estimatedCostSavings: totalTokensSaved * 0.00001 + totalComputeUnitsSaved * 0.001 // Estimated
    };
  }

  private createCacheHitResult(cachedValue: any, token: VortexToken): ResolverResult {
    return {
      success: true,
      resolvedValue: cachedValue,
      dependencies: [],
      metadata: {
        resolveTime: 0,
        cacheHit: true,
        fallbackUsed: false,
        costImpact: {
          tokensSaved: 100,
          computeUnitsUsed: 0,
          cacheOperations: 1,
          vectorOperations: 0
        }
      }
    };
  }

  private createNoResolverResult(token: VortexToken, resolverKey: string): ResolverResult {
    return {
      success: false,
      resolvedValue: null,
      dependencies: [],
      metadata: {
        resolveTime: 0,
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
        code: 'NO_RESOLVER',
        message: `No resolver found for ${resolverKey}`,
        category: 'resolution',
        retryable: false,
        fallbackAvailable: false
      }
    };
  }

  private createCircuitBreakerResult(token: VortexToken): ResolverResult {
    return {
      success: false,
      resolvedValue: null,
      dependencies: [],
      metadata: {
        resolveTime: 0,
        cacheHit: false,
        fallbackUsed: false,
        costImpact: {
          tokensSaved: 0,
          computeUnitsUsed: 0,
          cacheOperations: 0,
          vectorOperations: 0
        }
      },
      error: {
        code: 'CIRCUIT_BREAKER_OPEN',
        message: 'Circuit breaker is open for this resolver',
        category: 'resolution',
        retryable: true,
        fallbackAvailable: true
      }
    };
  }

  private getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
    return Object.fromEntries(this.circuitBreaker);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.adaptiveCache.destroy();
    this.removeAllListeners();
  }
}

// Supporting interfaces and types

interface ValidatedVortexToken {
  token: VortexToken;
  validation: ValidationResult;
  isValid: boolean;
}

interface ResolutionPlan {
  tokens: VortexToken[];
  resolutionOrder: string[];
  parallelGroups: VortexToken[][];
  cacheStatus: Map<string, boolean>;
  estimatedTime: number;
}

interface TokenResolutionResult {
  token: VortexToken;
  result: ResolverResult;
  success: boolean;
}

interface EnhancedProcessResult {
  processedText: string;
  originalText: string;
  processingId: string;
  tokensProcessed: number;
  successfulResolutions: number;
  errors: TokenError[];
  processingTimeMs: number;
  analytics: EnhancedAnalyticsData;
  cacheStats: any;
  vectorSearchUsed: boolean;
}

interface EnhancedAnalyticsData {
  totalTokens: number;
  successfulResolutions: number;
  failedResolutions: number;
  successRate: number;
  totalResolutionTime: number;
  averageResolutionTime: number;
  cacheHitRate: number;
  vectorSearchUsage: number;
  typeDistribution: Record<string, number>;
  performanceBreakdown: Record<string, number>;
  costSavings: CostSavings;
}

interface CostSavings {
  tokensSaved: number;
  computeUnitsSaved: number;
  estimatedCostSavings: number;
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  consecutiveFailures: number;
  totalFailures: number;
  lastFailure: number;
  lastSuccess: number;
  nextAttempt: number;
}

interface VortexSystemStatus {
  engine: {
    isHealthy: boolean;
    activeResolutions: number;
    registeredResolvers: number;
    uptime: number;
  };
  cache: any;
  analytics: any;
  circuitBreakers: Record<string, CircuitBreakerState>;
  vectorSearch: {
    enabled: boolean;
    connected: boolean;
  };
}

class EnhancedVortexAnalytics {
  private sessionData: EnhancedAnalyticsData[] = [];
  private aggregatedStats: any = {};

  recordProcessing(data: EnhancedAnalyticsData): void {
    this.sessionData.push(data);
  }

  aggregate(): void {
    // Aggregate session data into overall stats
    if (this.sessionData.length === 0) return;

    const totalProcessings = this.sessionData.length;
    const totalTokens = this.sessionData.reduce((sum, data) => sum + data.totalTokens, 0);
    const totalSuccessful = this.sessionData.reduce((sum, data) => sum + data.successfulResolutions, 0);
    
    this.aggregatedStats = {
      totalProcessings,
      totalTokens,
      totalSuccessful,
      overallSuccessRate: totalSuccessful / totalTokens,
      averageTokensPerProcessing: totalTokens / totalProcessings,
      lastAggregated: new Date()
    };

    // Clear session data to prevent memory leak
    this.sessionData = this.sessionData.slice(-100); // Keep last 100 sessions
  }

  getOverallStats(): any {
    return this.aggregatedStats;
  }
}