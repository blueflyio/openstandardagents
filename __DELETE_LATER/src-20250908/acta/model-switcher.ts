/**
 * Dynamic Model Switching System
 * Intelligently switches between 3B to 70B models based on context complexity
 */

import {
  ModelConfig,
  ModelCapability,
  ModelSwitchDecision,
  SwitchReason,
  ImpactEstimate,
  ACTAConfig,
  ContextToken,
  PerformanceMetrics,
  ACTAQuery
} from './types.js';

export class ModelSwitcher {
  private config: ACTAConfig;
  private currentModel: string;
  private modelHistory: ModelUsageHistory[] = [];
  private complexityAnalyzer: ComplexityAnalyzer;
  private performanceTracker: PerformanceTracker;
  private costOptimizer: CostOptimizer;

  constructor(config: ACTAConfig) {
    this.config = config;
    this.currentModel = config.models.medium.id; // Start with medium model
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.performanceTracker = new PerformanceTracker();
    this.costOptimizer = new CostOptimizer(config.models);
  }

  /**
   * Analyze query and determine optimal model
   */
  async determineOptimalModel(
    query: ACTAQuery,
    contextTokens: ContextToken[]
  ): Promise<ModelSwitchDecision> {
    const complexity = await this.analyzeComplexity(query, contextTokens);
    const performance = await this.analyzePerformanceRequirements(query);
    const cost = await this.analyzeCostConstraints(query);
    
    const decision = await this.makeDecision(complexity, performance, cost);
    
    // Log decision for learning
    this.recordDecision(decision, query, contextTokens);
    
    return decision;
  }

  /**
   * Switch to a new model if recommended
   */
  async switchModel(decision: ModelSwitchDecision): Promise<boolean> {
    if (decision.currentModel === decision.recommendedModel) {
      return false; // No switch needed
    }

    const switchCost = await this.calculateSwitchCost(
      decision.currentModel,
      decision.recommendedModel
    );

    if (switchCost.benefit > switchCost.cost) {
      this.currentModel = decision.recommendedModel;
      this.recordModelSwitch(decision, switchCost);
      return true;
    }

    return false;
  }

  /**
   * Get current model configuration
   */
  getCurrentModel(): ModelConfig {
    return this.getModelConfig(this.currentModel);
  }

  /**
   * Analyze complexity of query and context
   */
  private async analyzeComplexity(
    query: ACTAQuery,
    contextTokens: ContextToken[]
  ): Promise<ComplexityAnalysis> {
    const textComplexity = this.complexityAnalyzer.analyzeText(query.text);
    const contextComplexity = this.complexityAnalyzer.analyzeContext(contextTokens);
    const semanticComplexity = await this.complexityAnalyzer.analyzeSemantics(
      query.text,
      contextTokens
    );

    const overallComplexity = this.complexityAnalyzer.calculateOverall(
      textComplexity,
      contextComplexity,
      semanticComplexity
    );

    return {
      text: textComplexity,
      context: contextComplexity,
      semantic: semanticComplexity,
      overall: overallComplexity,
      requiredCapabilities: this.determineRequiredCapabilities(query, contextTokens)
    };
  }

  /**
   * Analyze performance requirements
   */
  private async analyzePerformanceRequirements(
    query: ACTAQuery
  ): Promise<PerformanceRequirements> {
    const latencyRequirement = this.determineLatencyRequirement(query);
    const qualityRequirement = this.determineQualityRequirement(query);
    const throughputRequirement = this.determineThroughputRequirement();

    return {
      maxLatency: latencyRequirement,
      minQuality: qualityRequirement,
      throughput: throughputRequirement,
      realTime: this.isRealTimeRequired(query)
    };
  }

  /**
   * Analyze cost constraints
   */
  private async analyzeCostConstraints(query: ACTAQuery): Promise<CostConstraints> {
    const tokenCount = this.estimateTokenUsage(query);
    const maxCostPerToken = this.getMaxCostPerToken();
    const budgetConstraints = this.getBudgetConstraints();

    return {
      estimatedTokens: tokenCount,
      maxCostPerToken,
      totalBudget: budgetConstraints.total,
      remainingBudget: budgetConstraints.remaining
    };
  }

  /**
   * Make model selection decision
   */
  private async makeDecision(
    complexity: ComplexityAnalysis,
    performance: PerformanceRequirements,
    cost: CostConstraints
  ): Promise<ModelSwitchDecision> {
    const candidates = this.getCandidateModels(complexity, performance, cost);
    const rankedCandidates = await this.rankCandidates(candidates, complexity, performance, cost);
    
    const bestCandidate = rankedCandidates[0];
    const currentModelScore = rankedCandidates.find(c => c.model.id === this.currentModel)?.score || 0;

    const reason = this.determineSwitchReason(bestCandidate, complexity, performance, cost);
    const confidence = this.calculateConfidence(bestCandidate, rankedCandidates);
    const impact = await this.estimateImpact(this.currentModel, bestCandidate.model.id);

    return {
      currentModel: this.currentModel,
      recommendedModel: bestCandidate.model.id,
      reason,
      confidence,
      estimatedImpact: impact
    };
  }

  /**
   * Get candidate models based on requirements
   */
  private getCandidateModels(
    complexity: ComplexityAnalysis,
    performance: PerformanceRequirements,
    cost: CostConstraints
  ): ModelConfig[] {
    const candidates: ModelConfig[] = [];

    // Check each model against requirements
    for (const modelKey of Object.keys(this.config.models) as Array<keyof typeof this.config.models>) {
      const model = this.config.models[modelKey];
      
      if (this.meetsRequirements(model, complexity, performance, cost)) {
        candidates.push(model);
      }
    }

    return candidates.length > 0 ? candidates : [this.getCurrentModel()];
  }

  /**
   * Check if model meets requirements
   */
  private meetsRequirements(
    model: ModelConfig,
    complexity: ComplexityAnalysis,
    performance: PerformanceRequirements,
    cost: CostConstraints
  ): boolean {
    // Capability requirements
    const hasRequiredCapabilities = complexity.requiredCapabilities.every(cap =>
      model.capabilities.includes(cap)
    );

    // Performance requirements
    const meetsPerformance = model.latencyMs <= performance.maxLatency &&
      this.estimateModelQuality(model) >= performance.minQuality;

    // Cost requirements
    const meetsCost = model.costPerToken <= cost.maxCostPerToken &&
      (model.costPerToken * cost.estimatedTokens) <= cost.remainingBudget;

    // Context window requirements
    const meetsContextWindow = model.contextWindow >= cost.estimatedTokens;

    return hasRequiredCapabilities && meetsPerformance && meetsCost && meetsContextWindow;
  }

  /**
   * Rank candidate models
   */
  private async rankCandidates(
    candidates: ModelConfig[],
    complexity: ComplexityAnalysis,
    performance: PerformanceRequirements,
    cost: CostConstraints
  ): Promise<RankedCandidate[]> {
    const rankedCandidates: RankedCandidate[] = [];

    for (const model of candidates) {
      const score = await this.calculateModelScore(model, complexity, performance, cost);
      rankedCandidates.push({ model, score });
    }

    return rankedCandidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate model score based on requirements
   */
  private async calculateModelScore(
    model: ModelConfig,
    complexity: ComplexityAnalysis,
    performance: PerformanceRequirements,
    cost: CostConstraints
  ): Promise<number> {
    let score = 0;

    // Capability score (40%)
    const capabilityScore = this.calculateCapabilityScore(model, complexity);
    score += capabilityScore * 0.4;

    // Performance score (30%)
    const performanceScore = this.calculatePerformanceScore(model, performance);
    score += performanceScore * 0.3;

    // Cost efficiency score (20%)
    const costScore = this.calculateCostScore(model, cost);
    score += costScore * 0.2;

    // Historical performance score (10%)
    const historyScore = await this.calculateHistoryScore(model);
    score += historyScore * 0.1;

    return score;
  }

  /**
   * Calculate capability matching score
   */
  private calculateCapabilityScore(
    model: ModelConfig,
    complexity: ComplexityAnalysis
  ): number {
    const requiredCaps = complexity.requiredCapabilities;
    const modelCaps = model.capabilities;

    if (requiredCaps.length === 0) return 1;

    const matchedCaps = requiredCaps.filter(cap => modelCaps.includes(cap));
    const basicScore = matchedCaps.length / requiredCaps.length;

    // Bonus for advanced capabilities
    const advancedBonus = this.calculateAdvancedCapabilityBonus(modelCaps, complexity);
    
    return Math.min(1, basicScore + advancedBonus);
  }

  /**
   * Calculate performance matching score
   */
  private calculatePerformanceScore(
    model: ModelConfig,
    performance: PerformanceRequirements
  ): number {
    let score = 0;

    // Latency score
    const latencyScore = performance.maxLatency / Math.max(model.latencyMs, 1);
    score += Math.min(1, latencyScore) * 0.5;

    // Quality score
    const estimatedQuality = this.estimateModelQuality(model);
    const qualityScore = estimatedQuality / performance.minQuality;
    score += Math.min(1, qualityScore) * 0.5;

    return score;
  }

  /**
   * Calculate cost efficiency score
   */
  private calculateCostScore(model: ModelConfig, cost: CostConstraints): number {
    if (cost.maxCostPerToken <= 0) return 1;

    const costEfficiency = cost.maxCostPerToken / Math.max(model.costPerToken, 0.001);
    return Math.min(1, costEfficiency);
  }

  /**
   * Calculate historical performance score
   */
  private async calculateHistoryScore(model: ModelConfig): Promise<number> {
    const history = this.modelHistory.filter(h => h.modelId === model.id);
    
    if (history.length === 0) return 0.5; // Neutral score for new models

    const avgQuality = history.reduce((sum, h) => sum + h.quality, 0) / history.length;
    const avgLatency = history.reduce((sum, h) => sum + h.latency, 0) / history.length;
    const successRate = history.filter(h => h.success).length / history.length;

    return (avgQuality + (1 - avgLatency / model.latencyMs) + successRate) / 3;
  }

  /**
   * Determine required capabilities
   */
  private determineRequiredCapabilities(
    query: ACTAQuery,
    contextTokens: ContextToken[]
  ): ModelCapability[] {
    const capabilities: ModelCapability[] = [ModelCapability.TEXT_GENERATION];

    // Code generation detection
    if (this.containsCodePatterns(query.text)) {
      capabilities.push(ModelCapability.CODE_GENERATION);
    }

    // Reasoning requirements
    if (this.requiresReasoning(query.text)) {
      capabilities.push(ModelCapability.REASONING);
    }

    // Long context requirements
    if (contextTokens.length > 8000 || query.maxTokens > 8000) {
      capabilities.push(ModelCapability.LONG_CONTEXT);
    }

    // Tool use requirements
    if (this.requiresToolUse(query.text)) {
      capabilities.push(ModelCapability.TOOL_USE);
    }

    return capabilities;
  }

  /**
   * Determine switch reason
   */
  private determineSwitchReason(
    bestCandidate: RankedCandidate,
    complexity: ComplexityAnalysis,
    performance: PerformanceRequirements,
    cost: CostConstraints
  ): SwitchReason {
    if (complexity.overall > 0.8) {
      return SwitchReason.COMPLEXITY_THRESHOLD;
    }

    if (cost.estimatedTokens > this.getCurrentModel().contextWindow * 0.8) {
      return SwitchReason.CONTEXT_SIZE;
    }

    if (performance.maxLatency < this.getCurrentModel().latencyMs) {
      return SwitchReason.PERFORMANCE_OPTIMIZATION;
    }

    if (bestCandidate.model.costPerToken < this.getCurrentModel().costPerToken * 0.8) {
      return SwitchReason.COST_OPTIMIZATION;
    }

    if (!this.getCurrentModel().capabilities.some(cap => 
      complexity.requiredCapabilities.includes(cap))) {
      return SwitchReason.CAPABILITY_REQUIREMENT;
    }

    return SwitchReason.QUALITY_REQUIREMENT;
  }

  /**
   * Calculate decision confidence
   */
  private calculateConfidence(
    bestCandidate: RankedCandidate,
    rankedCandidates: RankedCandidate[]
  ): number {
    if (rankedCandidates.length < 2) return 1;

    const bestScore = bestCandidate.score;
    const secondBestScore = rankedCandidates[1].score;
    
    const scoreDiff = bestScore - secondBestScore;
    const confidence = Math.min(1, scoreDiff * 2); // Scale difference to confidence

    return confidence;
  }

  /**
   * Estimate impact of model switch
   */
  private async estimateImpact(
    currentModelId: string,
    targetModelId: string
  ): Promise<ImpactEstimate> {
    const currentModel = this.getModelConfig(currentModelId);
    const targetModel = this.getModelConfig(targetModelId);

    const latencyChange = (targetModel.latencyMs - currentModel.latencyMs) / currentModel.latencyMs;
    const costChange = (targetModel.costPerToken - currentModel.costPerToken) / currentModel.costPerToken;
    
    // Estimate quality change based on model capacity
    const qualityChange = this.estimateQualityChange(currentModel, targetModel);
    const contextEfficiency = targetModel.contextWindow / currentModel.contextWindow;

    return {
      latencyChange,
      costChange,
      qualityChange,
      contextEfficiency
    };
  }

  // Utility methods
  private getModelConfig(modelId: string): ModelConfig {
    for (const modelKey of Object.keys(this.config.models) as Array<keyof typeof this.config.models>) {
      const model = this.config.models[modelKey];
      if (model.id === modelId) {
        return model;
      }
    }
    return this.config.models.medium; // Default fallback
  }

  private containsCodePatterns(text: string): boolean {
    const codePatterns = [
      /```[\s\S]*?```/g,
      /`[^`]+`/g,
      /function\s+\w+/g,
      /class\s+\w+/g,
      /import\s+[\w{},\s]+from/g,
      /def\s+\w+/g
    ];

    return codePatterns.some(pattern => pattern.test(text));
  }

  private requiresReasoning(text: string): boolean {
    const reasoningKeywords = [
      'analyze', 'compare', 'evaluate', 'explain why', 'reasoning',
      'logic', 'deduce', 'infer', 'conclude', 'prove', 'solve'
    ];

    const lowercaseText = text.toLowerCase();
    return reasoningKeywords.some(keyword => lowercaseText.includes(keyword));
  }

  private requiresToolUse(text: string): boolean {
    const toolKeywords = [
      'execute', 'run command', 'call function', 'use tool',
      'search', 'fetch', 'api call', 'database'
    ];

    const lowercaseText = text.toLowerCase();
    return toolKeywords.some(keyword => lowercaseText.includes(keyword));
  }

  private estimateTokenUsage(query: ACTAQuery): number {
    // Rough estimation: 4 characters per token
    return Math.ceil((query.text.length + query.context.join('').length) / 4);
  }

  private estimateModelQuality(model: ModelConfig): number {
    // Simplified quality estimation based on model size and capabilities
    const capabilityBonus = model.capabilities.length * 0.1;
    const contextBonus = Math.log(model.contextWindow / 4096) * 0.1;
    const baseQuality = model.maxTokens / 100000; // Assume larger models = better quality
    
    return Math.min(1, baseQuality + capabilityBonus + contextBonus);
  }

  private estimateQualityChange(current: ModelConfig, target: ModelConfig): number {
    const currentQuality = this.estimateModelQuality(current);
    const targetQuality = this.estimateModelQuality(target);
    
    return (targetQuality - currentQuality) / currentQuality;
  }

  private calculateAdvancedCapabilityBonus(
    capabilities: ModelCapability[],
    complexity: ComplexityAnalysis
  ): number {
    let bonus = 0;

    if (capabilities.includes(ModelCapability.MULTIMODAL) && complexity.overall > 0.7) {
      bonus += 0.1;
    }

    if (capabilities.includes(ModelCapability.LONG_CONTEXT) && complexity.context > 0.8) {
      bonus += 0.15;
    }

    return bonus;
  }

  private determineLatencyRequirement(query: ACTAQuery): number {
    // Default to 2 seconds, adjust based on query characteristics
    let maxLatency = 2000;

    if (this.isRealTimeRequired(query)) {
      maxLatency = 500;
    } else if (query.text.length > 1000) {
      maxLatency = 5000;
    }

    return maxLatency;
  }

  private determineQualityRequirement(query: ACTAQuery): number {
    // Base quality requirement
    let minQuality = 0.7;

    if (this.requiresReasoning(query.text)) {
      minQuality = 0.8;
    }

    if (this.containsCodePatterns(query.text)) {
      minQuality = 0.85;
    }

    return minQuality;
  }

  private determineThroughputRequirement(): number {
    return 100; // tokens per second
  }

  private isRealTimeRequired(query: ACTAQuery): boolean {
    const realTimeKeywords = ['urgent', 'immediate', 'real-time', 'live', 'streaming'];
    const lowercaseText = query.text.toLowerCase();
    return realTimeKeywords.some(keyword => lowercaseText.includes(keyword));
  }

  private getMaxCostPerToken(): number {
    return 0.001; // $0.001 per token
  }

  private getBudgetConstraints(): { total: number; remaining: number } {
    return { total: 100, remaining: 80 }; // $100 total, $80 remaining
  }

  private async calculateSwitchCost(
    currentModelId: string,
    targetModelId: string
  ): Promise<{ cost: number; benefit: number }> {
    // Simplified switch cost calculation
    const switchLatency = 100; // ms
    const potentialSavings = this.estimateCostSavings(currentModelId, targetModelId);
    
    return {
      cost: switchLatency,
      benefit: potentialSavings
    };
  }

  private estimateCostSavings(currentModelId: string, targetModelId: string): number {
    const current = this.getModelConfig(currentModelId);
    const target = this.getModelConfig(targetModelId);
    
    return (current.costPerToken - target.costPerToken) * 1000; // Assume 1000 tokens
  }

  private recordDecision(
    decision: ModelSwitchDecision,
    query: ACTAQuery,
    contextTokens: ContextToken[]
  ): void {
    // Record decision for learning
    const record = {
      timestamp: new Date(),
      decision,
      query: query.text,
      contextSize: contextTokens.length,
      complexity: this.complexityAnalyzer.getLastComplexity()
    };

    // Store for analysis (simplified)
    console.log('Decision recorded:', record);
  }

  private recordModelSwitch(
    decision: ModelSwitchDecision,
    switchCost: { cost: number; benefit: number }
  ): void {
    const record = {
      timestamp: new Date(),
      from: decision.currentModel,
      to: decision.recommendedModel,
      reason: decision.reason,
      cost: switchCost.cost,
      benefit: switchCost.benefit
    };

    console.log('Model switch recorded:', record);
  }
}

// Supporting classes and interfaces

interface ComplexityAnalysis {
  text: number;
  context: number;
  semantic: number;
  overall: number;
  requiredCapabilities: ModelCapability[];
}

interface PerformanceRequirements {
  maxLatency: number;
  minQuality: number;
  throughput: number;
  realTime: boolean;
}

interface CostConstraints {
  estimatedTokens: number;
  maxCostPerToken: number;
  totalBudget: number;
  remainingBudget: number;
}

interface RankedCandidate {
  model: ModelConfig;
  score: number;
}

interface ModelUsageHistory {
  modelId: string;
  timestamp: Date;
  quality: number;
  latency: number;
  success: boolean;
  context: string;
}

class ComplexityAnalyzer {
  private lastComplexity: ComplexityAnalysis | null = null;

  analyzeText(text: string): number {
    // Analyze text complexity based on various factors
    const length = text.length;
    const sentences = text.split(/[.!?]+/).length;
    const avgSentenceLength = length / sentences;
    const uniqueWords = new Set(text.toLowerCase().split(/\s+/)).size;
    
    const lengthScore = Math.min(1, length / 1000);
    const sentenceComplexity = Math.min(1, avgSentenceLength / 20);
    const vocabularyComplexity = Math.min(1, uniqueWords / 200);
    
    const complexity = (lengthScore + sentenceComplexity + vocabularyComplexity) / 3;
    return complexity;
  }

  analyzeContext(tokens: ContextToken[]): number {
    if (tokens.length === 0) return 0;

    const size = tokens.length;
    const avgRelationships = tokens.reduce((sum, token) => sum + token.relationships.length, 0) / size;
    const typeVariety = new Set(tokens.map(token => token.metadata.type)).size;
    
    const sizeComplexity = Math.min(1, size / 1000);
    const relationshipComplexity = Math.min(1, avgRelationships / 5);
    const varietyComplexity = Math.min(1, typeVariety / Object.keys(TokenType).length);
    
    return (sizeComplexity + relationshipComplexity + varietyComplexity) / 3;
  }

  async analyzeSemantics(text: string, tokens: ContextToken[]): Promise<number> {
    // Simplified semantic complexity analysis
    // In practice, this would use actual semantic analysis
    const textTokens = text.split(/\s+/).length;
    const contextTokens = tokens.length;
    
    const tokenRatio = contextTokens > 0 ? textTokens / contextTokens : 1;
    const semanticComplexity = Math.min(1, tokenRatio * 0.5);
    
    return semanticComplexity;
  }

  calculateOverall(text: number, context: number, semantic: number): number {
    const complexity = (text * 0.4 + context * 0.4 + semantic * 0.2);
    this.lastComplexity = { text, context, semantic, overall: complexity, requiredCapabilities: [] };
    return complexity;
  }

  getLastComplexity(): ComplexityAnalysis | null {
    return this.lastComplexity;
  }
}

class PerformanceTracker {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();

  recordMetrics(modelId: string, metrics: PerformanceMetrics): void {
    if (!this.metrics.has(modelId)) {
      this.metrics.set(modelId, []);
    }
    this.metrics.get(modelId)!.push(metrics);
  }

  getAverageMetrics(modelId: string): PerformanceMetrics | null {
    const modelMetrics = this.metrics.get(modelId);
    if (!modelMetrics || modelMetrics.length === 0) return null;

    const avg: PerformanceMetrics = {
      queryLatency: 0,
      indexLatency: 0,
      compressionLatency: 0,
      memoryUsage: 0,
      diskUsage: 0,
      throughput: 0
    };

    for (const metric of modelMetrics) {
      avg.queryLatency += metric.queryLatency;
      avg.indexLatency += metric.indexLatency;
      avg.compressionLatency += metric.compressionLatency;
      avg.memoryUsage += metric.memoryUsage;
      avg.diskUsage += metric.diskUsage;
      avg.throughput += metric.throughput;
    }

    const count = modelMetrics.length;
    avg.queryLatency /= count;
    avg.indexLatency /= count;
    avg.compressionLatency /= count;
    avg.memoryUsage /= count;
    avg.diskUsage /= count;
    avg.throughput /= count;

    return avg;
  }
}

class CostOptimizer {
  private models: ACTAConfig['models'];

  constructor(models: ACTAConfig['models']) {
    this.models = models;
  }

  findCostOptimalModel(requirements: any): ModelConfig {
    // Find the most cost-effective model that meets requirements
    const candidates = Object.values(this.models);
    return candidates.sort((a, b) => a.costPerToken - b.costPerToken)[0];
  }

  estimateQueryCost(modelId: string, tokenCount: number): number {
    const model = Object.values(this.models).find(m => m.id === modelId);
    return model ? model.costPerToken * tokenCount : 0;
  }
}