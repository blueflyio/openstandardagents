/**
 * ACTA Orchestrator - Main coordination layer for the Adaptive Contextual Token Architecture
 * Coordinates vector compression, model switching, and graph persistence
 */

import {
  ACTAConfig,
  ACTAOrchestrator,
  ACTAQuery,
  ACTAResponse,
  ContextToken,
  CompressionLevel,
  CompressionResult,
  ModelSwitchDecision,
  SwitchReason,
  HealthStatus,
  ComponentHealth,
  PerformanceMetrics,
  GraphUpdate,
  TokenType,
  AccessPattern,
  TokenMetadata
} from './types.js';
import { VectorCompressionEngine } from './vector-compression.js';
import { ModelSwitcher } from './model-switcher.js';
import { GraphPersistenceEngine } from './graph-persistence.js';

export class ACTAOrchestrator implements ACTAOrchestrator {
  private config: ACTAConfig;
  private compressionEngine: VectorCompressionEngine;
  private modelSwitcher: ModelSwitcher;
  private persistenceEngine: GraphPersistenceEngine;
  
  private initialized = false;
  private healthStatus: HealthStatus;
  private requestCounter = 0;
  private lastOptimization = new Date();
  
  // Performance tracking
  private responseTimeHistory: number[] = [];
  private errorCount = 0;
  private totalRequests = 0;

  constructor(config: ACTAConfig) {
    this.config = config;
    this.compressionEngine = new VectorCompressionEngine(config);
    this.modelSwitcher = new ModelSwitcher(config);
    this.persistenceEngine = new GraphPersistenceEngine(
      config.graph.persistenceInterval ? '/tmp/acta-graph' : '/tmp/acta-graph-temp'
    );
    
    this.healthStatus = this.initializeHealthStatus();
  }

  /**
   * Initialize the ACTA system
   */
  async initialize(config: ACTAConfig): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('Initializing ACTA Orchestrator...');

      // Update configuration
      this.config = { ...this.config, ...config };

      // Initialize subsystems in parallel
      await Promise.all([
        this.initializeCompression(),
        this.initializeModelSwitcher(),
        this.initializePersistence()
      ]);

      // Load existing context graph
      await this.loadExistingContext();

      // Start background tasks
      this.startBackgroundTasks();

      this.initialized = true;
      const initTime = Date.now() - startTime;
      
      console.log(`ACTA Orchestrator initialized in ${initTime}ms`);
      
      // Update health status
      this.updateComponentHealth('orchestrator', {
        status: 'up',
        latency: initTime,
        errorRate: 0
      });

    } catch (error) {
      console.error('ACTA initialization failed:', error);
      this.updateComponentHealth('orchestrator', {
        status: 'down',
        latency: Date.now() - startTime,
        errorRate: 1,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Process a query through the ACTA system
   */
  async process(query: ACTAQuery): Promise<ACTAResponse> {
    if (!this.initialized) {
      throw new Error('ACTA not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    this.totalRequests++;
    this.requestCounter++;

    try {
      // Load relevant context tokens
      const contextTokens = await this.loadContextTokens(query);

      // Determine optimal model
      const modelDecision = await this.modelSwitcher.determineOptimalModel(query, contextTokens);
      
      // Switch model if recommended
      await this.modelSwitcher.switchModel(modelDecision);

      // Apply compression if needed
      const { tokens: compressedTokens, compressionApplied } = await this.applyCompression(
        contextTokens,
        query.compressionLevel || CompressionLevel.MODERATE
      );

      // Process query with selected model
      const result = await this.processWithModel(query, compressedTokens, modelDecision.recommendedModel);

      // Update context graph
      const graphUpdates = await this.updateContextGraph(query, result, compressedTokens);

      // Create response
      const response: ACTAResponse = {
        result,
        usedModel: modelDecision.recommendedModel,
        contextTokens: compressedTokens,
        compressionApplied,
        performanceMetrics: await this.getPerformanceMetrics(),
        graphUpdates
      };

      // Track performance
      const responseTime = Date.now() - startTime;
      this.trackResponseTime(responseTime);

      // Trigger optimization if needed
      await this.checkOptimizationTriggers();

      return response;

    } catch (error) {
      this.errorCount++;
      console.error('ACTA processing failed:', error);
      
      // Return error response
      return {
        result: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        usedModel: this.modelSwitcher.getCurrentModel().id,
        contextTokens: [],
        compressionApplied: false,
        performanceMetrics: await this.getPerformanceMetrics(),
        graphUpdates: []
      };
    }
  }

  /**
   * Compress tokens with specified level
   */
  async compress(tokens: ContextToken[], level: CompressionLevel): Promise<CompressionResult> {
    if (!this.initialized) {
      throw new Error('ACTA not initialized');
    }

    return await this.compressionEngine.compressTokens(tokens, level);
  }

  /**
   * Switch model based on reason
   */
  async switchModel(reason: SwitchReason): Promise<ModelSwitchDecision> {
    if (!this.initialized) {
      throw new Error('ACTA not initialized');
    }

    // Create a mock query for switching decision
    const mockQuery: ACTAQuery = {
      text: 'Model switch request',
      context: [],
      maxTokens: 1000
    };

    const decision = await this.modelSwitcher.determineOptimalModel(mockQuery, []);
    await this.modelSwitcher.switchModel(decision);
    
    return decision;
  }

  /**
   * Persist context graph to storage
   */
  async persistContext(): Promise<void> {
    if (!this.initialized) {
      throw new Error('ACTA not initialized');
    }

    const graph = await this.persistenceEngine.load();
    await this.persistenceEngine.save(graph);
    
    console.log('Context graph persisted successfully');
  }

  /**
   * Get system health status
   */
  async getHealth(): Promise<HealthStatus> {
    await this.updateHealthStatus();
    return this.healthStatus;
  }

  // Private methods

  /**
   * Initialize compression engine
   */
  private async initializeCompression(): Promise<void> {
    // Vector compression engine is ready after construction
    console.log('Compression engine initialized');
  }

  /**
   * Initialize model switcher
   */
  private async initializeModelSwitcher(): Promise<void> {
    // Model switcher is ready after construction
    console.log('Model switcher initialized');
  }

  /**
   * Initialize persistence engine
   */
  private async initializePersistence(): Promise<void> {
    await this.persistenceEngine.initialize();
    console.log('Persistence engine initialized');
  }

  /**
   * Load existing context graph
   */
  private async loadExistingContext(): Promise<void> {
    try {
      const graph = await this.persistenceEngine.load();
      console.log(`Loaded context graph with ${graph.nodes.size} nodes and ${graph.edges.size} edges`);
    } catch (error) {
      console.log('No existing context graph found, starting fresh');
    }
  }

  /**
   * Start background optimization tasks
   */
  private startBackgroundTasks(): void {
    // Periodic optimization
    setInterval(() => {
      this.performBackgroundOptimization().catch(error => {
        console.error('Background optimization failed:', error);
      });
    }, this.config.graph.persistenceInterval || 300000); // 5 minutes

    // Health monitoring
    setInterval(() => {
      this.updateHealthStatus().catch(error => {
        console.error('Health status update failed:', error);
      });
    }, 30000); // 30 seconds
  }

  /**
   * Load relevant context tokens for query
   */
  private async loadContextTokens(query: ACTAQuery): Promise<ContextToken[]> {
    const tokens: ContextToken[] = [];

    // Load from explicit context
    for (const contextItem of query.context) {
      const token = await this.createTokenFromContext(contextItem);
      tokens.push(token);
    }

    // Load from semantic search if query has semantic filters
    if (query.semanticFilters && query.semanticFilters.length > 0) {
      const semanticTokens = await this.loadSemanticTokens(query.semanticFilters);
      tokens.push(...semanticTokens);
    }

    // Load from temporal range if specified
    if (query.temporalRange) {
      const temporalTokens = await this.loadTemporalTokens(query.temporalRange);
      tokens.push(...temporalTokens);
    }

    return this.deduplicateTokens(tokens);
  }

  /**
   * Create token from context string
   */
  private async createTokenFromContext(context: string): Promise<ContextToken> {
    const token: ContextToken = {
      id: this.generateTokenId(),
      content: context,
      embedding: [], // Will be populated by compression engine
      metadata: this.createTokenMetadata(context, TokenType.CONTEXT_BRIDGE),
      relationships: [],
      compressionLevel: CompressionLevel.NONE,
      accessPattern: this.createAccessPattern()
    };

    return token;
  }

  /**
   * Apply compression if needed
   */
  private async applyCompression(
    tokens: ContextToken[],
    level: CompressionLevel
  ): Promise<{ tokens: ContextToken[]; compressionApplied: boolean }> {
    if (level === CompressionLevel.NONE || tokens.length === 0) {
      return { tokens, compressionApplied: false };
    }

    const result = await this.compressionEngine.compressTokens(tokens, level);
    return {
      tokens: result.tokens,
      compressionApplied: result.ratio < 0.9 // Consider compression applied if > 10% reduction
    };
  }

  /**
   * Process query with selected model
   */
  private async processWithModel(
    query: ACTAQuery,
    tokens: ContextToken[],
    modelId: string
  ): Promise<string> {
    // Mock model processing - in production, this would call actual model API
    const context = tokens.map(token => token.content).join('\n');
    
    // Simulate processing time based on model type
    const processingTime = this.getModelProcessingTime(modelId);
    await this.sleep(processingTime);

    // Generate mock response
    return `[${modelId}] Processed query: "${query.text}" with ${tokens.length} context tokens. Context summary: ${context.substring(0, 100)}...`;
  }

  /**
   * Update context graph with new information
   */
  private async updateContextGraph(
    query: ACTAQuery,
    result: string,
    tokens: ContextToken[]
  ): Promise<GraphUpdate[]> {
    const updates: GraphUpdate[] = [];

    // Create token for the query
    const queryToken = await this.createQueryToken(query, result);
    await this.persistenceEngine.addToken(queryToken);
    
    updates.push({
      type: 'add',
      nodeId: queryToken.id,
      changes: queryToken,
      timestamp: new Date()
    });

    // Update relationships between query and context tokens
    for (const contextToken of tokens) {
      // Update access patterns
      contextToken.accessPattern.frequency++;
      contextToken.accessPattern.recency = Date.now();
      contextToken.metadata.lastAccessed = new Date();

      // Add relationship to query token
      const relationship = {
        targetId: queryToken.id,
        type: 'reference' as const,
        strength: 0.8,
        directionality: 'bidirectional' as const,
        metadata: { queryContext: true }
      };

      contextToken.relationships.push(relationship);
      
      await this.persistenceEngine.updateRelationships(
        contextToken.id,
        contextToken.relationships
      );

      updates.push({
        type: 'update',
        nodeId: contextToken.id,
        changes: { 
          accessPattern: contextToken.accessPattern,
          relationships: contextToken.relationships 
        },
        timestamp: new Date()
      });
    }

    return updates;
  }

  /**
   * Create token from query and result
   */
  private async createQueryToken(query: ACTAQuery, result: string): Promise<ContextToken> {
    return {
      id: this.generateTokenId(),
      content: `Q: ${query.text}\nA: ${result}`,
      embedding: [], // Will be populated by persistence engine
      metadata: this.createTokenMetadata(query.text, TokenType.CORE_CONCEPT),
      relationships: [],
      compressionLevel: CompressionLevel.NONE,
      accessPattern: this.createAccessPattern()
    };
  }

  /**
   * Check if optimization should be triggered
   */
  private async checkOptimizationTriggers(): Promise<void> {
    const timeSinceLastOptimization = Date.now() - this.lastOptimization.getTime();
    const optimizationInterval = this.config.graph.persistenceInterval || 300000;

    const shouldOptimize = 
      this.requestCounter >= 100 || // Every 100 requests
      timeSinceLastOptimization > optimizationInterval; // Or every 5 minutes

    if (shouldOptimize) {
      await this.performOptimization();
    }
  }

  /**
   * Perform system optimization
   */
  private async performOptimization(): Promise<void> {
    console.log('Starting ACTA optimization...');
    const startTime = Date.now();

    try {
      // Optimize persistence layer
      await this.persistenceEngine.optimize();

      // Reset counters
      this.requestCounter = 0;
      this.lastOptimization = new Date();

      const optimizationTime = Date.now() - startTime;
      console.log(`ACTA optimization completed in ${optimizationTime}ms`);

    } catch (error) {
      console.error('ACTA optimization failed:', error);
    }
  }

  /**
   * Perform background optimization
   */
  private async performBackgroundOptimization(): Promise<void> {
    if (this.requestCounter < 10) {
      return; // Skip if not enough activity
    }

    await this.performOptimization();
    await this.persistContext();
  }

  /**
   * Update health status of all components
   */
  private async updateHealthStatus(): Promise<void> {
    const startTime = Date.now();

    try {
      // Check persistence engine
      const persistenceMetrics = await this.persistenceEngine.getMetrics();
      this.updateComponentHealth('persistence', {
        status: persistenceMetrics.queryLatency < 1000 ? 'up' : 'degraded',
        latency: persistenceMetrics.queryLatency,
        errorRate: 0
      });

      // Check model switcher
      const currentModel = this.modelSwitcher.getCurrentModel();
      this.updateComponentHealth('model_switcher', {
        status: 'up',
        latency: currentModel.latencyMs,
        errorRate: 0
      });

      // Check compression engine
      this.updateComponentHealth('compression', {
        status: 'up',
        latency: 50, // Mock latency
        errorRate: 0
      });

      // Update overall health
      const components = Object.values(this.healthStatus.components);
      const allUp = components.every(c => c.status === 'up');
      const anyDegraded = components.some(c => c.status === 'degraded');

      this.healthStatus.status = allUp ? 'healthy' : 
                                anyDegraded ? 'degraded' : 'unhealthy';
      
      this.healthStatus.lastCheck = new Date();
      this.healthStatus.metrics = await this.getPerformanceMetrics();

    } catch (error) {
      console.error('Health status update failed:', error);
      this.healthStatus.status = 'unhealthy';
    }
  }

  /**
   * Get current performance metrics
   */
  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const avgResponseTime = this.responseTimeHistory.length > 0 ?
      this.responseTimeHistory.reduce((sum, time) => sum + time, 0) / this.responseTimeHistory.length :
      0;

    const errorRate = this.totalRequests > 0 ? this.errorCount / this.totalRequests : 0;
    const throughput = this.totalRequests / Math.max(1, (Date.now() - this.lastOptimization.getTime()) / 1000);

    return {
      queryLatency: avgResponseTime,
      indexLatency: 0, // Would be populated by persistence engine
      compressionLatency: 0, // Would be populated by compression engine
      memoryUsage: process.memoryUsage().heapUsed,
      diskUsage: 0, // Would be calculated by persistence engine
      throughput
    };
  }

  // Utility methods

  private initializeHealthStatus(): HealthStatus {
    return {
      status: 'unhealthy',
      components: {
        orchestrator: { status: 'down', latency: 0, errorRate: 0 },
        persistence: { status: 'down', latency: 0, errorRate: 0 },
        compression: { status: 'down', latency: 0, errorRate: 0 },
        model_switcher: { status: 'down', latency: 0, errorRate: 0 }
      },
      metrics: {
        queryLatency: 0,
        indexLatency: 0,
        compressionLatency: 0,
        memoryUsage: 0,
        diskUsage: 0,
        throughput: 0
      },
      lastCheck: new Date()
    };
  }

  private updateComponentHealth(component: string, health: ComponentHealth): void {
    this.healthStatus.components[component] = health;
  }

  private generateTokenId(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createTokenMetadata(content: string, type: TokenType): TokenMetadata {
    return {
      type,
      priority: this.calculatePriority(content, type),
      frequency: 1,
      lastAccessed: new Date(),
      createdAt: new Date(),
      sourceContext: 'acta_orchestrator',
      semanticCluster: 'default',
      compressionRatio: 1
    };
  }

  private createAccessPattern(): AccessPattern {
    return {
      frequency: 1,
      recency: Date.now(),
      importance: 0.5,
      volatility: 0.5,
      predictedNext: null
    };
  }

  private calculatePriority(content: string, type: TokenType): number {
    let priority = 0.5; // Base priority

    // Adjust based on type
    switch (type) {
      case TokenType.CORE_CONCEPT:
        priority = 0.9;
        break;
      case TokenType.CONTEXT_BRIDGE:
        priority = 0.7;
        break;
      case TokenType.DETAIL:
        priority = 0.4;
        break;
      default:
        priority = 0.5;
    }

    // Adjust based on content length
    if (content.length > 500) {
      priority += 0.1;
    }

    return Math.min(1, priority);
  }

  private deduplicateTokens(tokens: ContextToken[]): ContextToken[] {
    const seen = new Set<string>();
    return tokens.filter(token => {
      if (seen.has(token.id)) {
        return false;
      }
      seen.add(token.id);
      return true;
    });
  }

  private trackResponseTime(responseTime: number): void {
    this.responseTimeHistory.push(responseTime);
    
    // Keep only recent history (last 100 requests)
    if (this.responseTimeHistory.length > 100) {
      this.responseTimeHistory.shift();
    }
  }

  private getModelProcessingTime(modelId: string): number {
    // Mock processing times based on model size
    if (modelId.includes('small') || modelId.includes('3B')) return 100;
    if (modelId.includes('medium') || modelId.includes('7B')) return 200;
    if (modelId.includes('large') || modelId.includes('13B')) return 400;
    if (modelId.includes('xlarge') || modelId.includes('70B')) return 800;
    return 300; // Default
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock methods for loading tokens (would be implemented with actual vector search)
  private async loadSemanticTokens(filters: string[]): Promise<ContextToken[]> {
    // Mock semantic token loading
    return filters.map(filter => ({
      id: this.generateTokenId(),
      content: `Semantic content for: ${filter}`,
      embedding: [],
      metadata: this.createTokenMetadata(filter, TokenType.REFERENCE),
      relationships: [],
      compressionLevel: CompressionLevel.NONE,
      accessPattern: this.createAccessPattern()
    }));
  }

  private async loadTemporalTokens(range: { start: Date; end: Date }): Promise<ContextToken[]> {
    // Mock temporal token loading
    return [{
      id: this.generateTokenId(),
      content: `Temporal content from ${range.start.toISOString()} to ${range.end.toISOString()}`,
      embedding: [],
      metadata: this.createTokenMetadata('temporal', TokenType.TEMPORAL),
      relationships: [],
      compressionLevel: CompressionLevel.NONE,
      accessPattern: this.createAccessPattern()
    }];
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up ACTA Orchestrator...');
    
    try {
      // Persist final state
      await this.persistContext();
      
      // Cleanup persistence engine
      await this.persistenceEngine.cleanup();
      
      console.log('ACTA Orchestrator cleanup completed');
    } catch (error) {
      console.error('ACTA cleanup failed:', error);
    }
  }
}