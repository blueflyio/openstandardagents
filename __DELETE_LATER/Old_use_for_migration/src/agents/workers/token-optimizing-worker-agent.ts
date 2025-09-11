/**
 * Token Optimizing Worker Agent - OSSA v0.1.8 Compliant
 * 
 * Specialized worker agent focused on aggressive token optimization
 * targeting 65% cost reduction through advanced optimization techniques.
 * 
 * Features:
 * - VORTEX token optimization framework integration
 * - Advanced prompt engineering and compression
 * - Context-aware token budgeting
 * - Dynamic model routing for cost efficiency
 * - Real-time optimization learning and adaptation
 */

import { BaseWorkerAgent } from './base-worker-agent';
import { 
  WorkerTask, 
  WorkerExecutionResult, 
  WorkerConfiguration,
  TokenOptimizationMetrics,
  WorkerCapability 
} from './types';

export interface TokenOptimizationStrategy {
  name: string;
  description: string;
  estimated_savings_percentage: number;
  quality_impact_score: number; // 0-1, lower is better
  complexity: 'low' | 'medium' | 'high';
  applicable_task_types: string[];
  implementation: (input: any) => Promise<{ optimized_input: any; tokens_saved: number; metadata: any }>;
}

export interface OptimizationContext {
  task_history: WorkerExecutionResult[];
  current_load: number;
  optimization_budget: number;
  quality_threshold: number;
  time_constraints: number;
}

export class TokenOptimizingWorkerAgent extends BaseWorkerAgent {
  private optimization_strategies: Map<string, TokenOptimizationStrategy> = new Map();
  private optimization_history: Map<string, TokenOptimizationMetrics[]> = new Map();
  private learned_patterns: Map<string, any> = new Map();
  private optimization_cache: Map<string, any> = new Map();
  
  // Advanced optimization settings
  private dynamic_optimization = true;
  private learning_enabled = true;
  private cache_enabled = true;
  private aggressive_optimization = false; // Can be enabled for higher savings at quality cost
  
  constructor(worker_id: string, configuration?: Partial<WorkerConfiguration>) {
    super(
      worker_id, 
      `token-optimizer-${worker_id}`,
      {
        ...configuration,
        worker_type: 'token_optimizing',
        optimization_settings: {
          target_cost_reduction: 65,
          max_quality_trade_off: 10, // Allow higher trade-off for aggressive optimization
          token_optimization_strategies: [
            'vortex_compression',
            'semantic_deduplication',
            'context_hierarchical_pruning',
            'prompt_template_optimization',
            'dynamic_model_routing',
            'response_streaming_optimization',
            'batch_processing_optimization',
            'cache_lookup_optimization'
          ],
          self_assessment_frequency: 'always',
          ...configuration?.optimization_settings
        }
      }
    );

    this.initializeOptimizationStrategies();
    this.addTokenOptimizationCapabilities();
  }

  /**
   * Execute task with advanced token optimization
   */
  async executeTask(task: WorkerTask): Promise<WorkerExecutionResult> {
    const execution_start = Date.now();
    
    try {
      // Phase 1: Pre-execution optimization analysis
      const optimization_context = await this.buildOptimizationContext(task);
      const selected_strategies = await this.selectOptimizationStrategies(task, optimization_context);
      
      // Phase 2: Apply optimization strategies
      const optimized_task = await this.applyOptimizationStrategies(task, selected_strategies);
      
      // Phase 3: Execute optimized task
      const base_result = await this.executeOptimizedTask(optimized_task);
      
      // Phase 4: Post-execution optimization
      const final_result = await this.optimizeExecutionResult(base_result, selected_strategies);
      
      // Phase 5: Learn from optimization results
      if (this.learning_enabled) {
        await this.learnFromOptimization(task, final_result, selected_strategies);
      }
      
      return final_result;

    } catch (error) {
      console.error(`[${this.id}] Token optimization execution failed:`, error);
      throw error;
    }
  }

  /**
   * Initialize advanced optimization strategies
   */
  private initializeOptimizationStrategies(): void {
    // VORTEX Compression Strategy
    this.optimization_strategies.set('vortex_compression', {
      name: 'VORTEX Compression',
      description: 'Advanced semantic compression using VORTEX framework',
      estimated_savings_percentage: 35,
      quality_impact_score: 0.05,
      complexity: 'high',
      applicable_task_types: ['text_generation', 'analysis', 'summarization'],
      implementation: async (input: any) => {
        const compressed = await this.applyVortexCompression(input);
        return {
          optimized_input: compressed.compressed_text,
          tokens_saved: compressed.tokens_saved,
          metadata: { compression_ratio: compressed.compression_ratio, quality_retained: compressed.quality_score }
        };
      }
    });

    // Semantic Deduplication Strategy
    this.optimization_strategies.set('semantic_deduplication', {
      name: 'Semantic Deduplication',
      description: 'Remove semantically redundant information while preserving meaning',
      estimated_savings_percentage: 20,
      quality_impact_score: 0.02,
      complexity: 'medium',
      applicable_task_types: ['text_processing', 'content_creation', 'documentation'],
      implementation: async (input: any) => {
        return this.applySemanticDeduplication(input);
      }
    });

    // Context Hierarchical Pruning Strategy
    this.optimization_strategies.set('context_hierarchical_pruning', {
      name: 'Context Hierarchical Pruning',
      description: 'Intelligently prune context based on relevance hierarchy',
      estimated_savings_percentage: 25,
      quality_impact_score: 0.08,
      complexity: 'high',
      applicable_task_types: ['analysis', 'code_generation', 'problem_solving'],
      implementation: async (input: any) => {
        return this.applyHierarchicalPruning(input);
      }
    });

    // Prompt Template Optimization Strategy
    this.optimization_strategies.set('prompt_template_optimization', {
      name: 'Prompt Template Optimization',
      description: 'Use optimized prompt templates with minimal tokens',
      estimated_savings_percentage: 15,
      quality_impact_score: 0.03,
      complexity: 'low',
      applicable_task_types: ['*'], // Applicable to all task types
      implementation: async (input: any) => {
        return this.applyPromptTemplateOptimization(input);
      }
    });

    // Dynamic Model Routing Strategy
    this.optimization_strategies.set('dynamic_model_routing', {
      name: 'Dynamic Model Routing',
      description: 'Route to most cost-efficient model for task complexity',
      estimated_savings_percentage: 30,
      quality_impact_score: 0.10,
      complexity: 'medium',
      applicable_task_types: ['*'],
      implementation: async (input: any) => {
        return this.applyDynamicModelRouting(input);
      }
    });

    // Cache Lookup Optimization Strategy
    this.optimization_strategies.set('cache_lookup_optimization', {
      name: 'Cache Lookup Optimization',
      description: 'Use cached results for similar requests',
      estimated_savings_percentage: 90, // Massive savings when cache hits
      quality_impact_score: 0.00,
      complexity: 'low',
      applicable_task_types: ['*'],
      implementation: async (input: any) => {
        return this.applyCacheLookupOptimization(input);
      }
    });
  }

  /**
   * Add token optimization specific capabilities
   */
  private addTokenOptimizationCapabilities(): void {
    const capabilities: WorkerCapability[] = [
      {
        id: 'token_optimization',
        name: 'Advanced Token Optimization',
        description: 'Reduce token consumption by up to 65% while maintaining quality',
        domain: 'optimization',
        complexity_level: 'expert',
        estimated_token_cost: 100,
        quality_threshold: 0.85,
        requires_self_assessment: true,
        optimization_potential: 65
      },
      {
        id: 'vortex_compression',
        name: 'VORTEX Compression',
        description: 'Advanced semantic compression using VORTEX framework',
        domain: 'compression',
        complexity_level: 'expert',
        estimated_token_cost: 150,
        quality_threshold: 0.90,
        requires_self_assessment: true,
        optimization_potential: 35
      },
      {
        id: 'dynamic_model_routing',
        name: 'Dynamic Model Routing',
        description: 'Intelligent model selection for optimal cost/quality balance',
        domain: 'routing',
        complexity_level: 'complex',
        estimated_token_cost: 50,
        quality_threshold: 0.80,
        requires_self_assessment: true,
        optimization_potential: 30
      },
      {
        id: 'context_optimization',
        name: 'Context Optimization',
        description: 'Advanced context pruning and optimization',
        domain: 'context_management',
        complexity_level: 'complex',
        estimated_token_cost: 75,
        quality_threshold: 0.85,
        requires_self_assessment: true,
        optimization_potential: 25
      }
    ];

    capabilities.forEach(capability => this.addCapability(capability));
  }

  /**
   * Build optimization context for strategy selection
   */
  private async buildOptimizationContext(task: WorkerTask): Promise<OptimizationContext> {
    const recent_history = this.execution_history.slice(-10); // Last 10 executions
    
    return {
      task_history: recent_history,
      current_load: this.active_tasks.size,
      optimization_budget: task.quality_requirements?.max_token_budget || 10000,
      quality_threshold: task.quality_requirements?.min_accuracy || 0.85,
      time_constraints: task.quality_requirements?.max_response_time_ms || 5000
    };
  }

  /**
   * Select optimal optimization strategies for the task
   */
  private async selectOptimizationStrategies(
    task: WorkerTask, 
    context: OptimizationContext
  ): Promise<TokenOptimizationStrategy[]> {
    const applicable_strategies = Array.from(this.optimization_strategies.values())
      .filter(strategy => 
        strategy.applicable_task_types.includes('*') || 
        strategy.applicable_task_types.includes(task.type)
      );

    // Score strategies based on context
    const scored_strategies = applicable_strategies.map(strategy => ({
      strategy,
      score: this.scoreOptimizationStrategy(strategy, task, context)
    }));

    // Sort by score and select top strategies
    scored_strategies.sort((a, b) => b.score - a.score);
    
    // Select strategies that together can achieve target reduction
    const selected_strategies: TokenOptimizationStrategy[] = [];
    let cumulative_savings = 0;
    let cumulative_quality_impact = 0;
    
    for (const { strategy } of scored_strategies) {
      if (cumulative_savings >= this.cost_reduction_target) break;
      if (cumulative_quality_impact + strategy.quality_impact_score > context.quality_threshold) continue;
      
      selected_strategies.push(strategy);
      cumulative_savings += strategy.estimated_savings_percentage;
      cumulative_quality_impact += strategy.quality_impact_score;
    }

    console.log(`[${this.id}] Selected ${selected_strategies.length} optimization strategies for ${cumulative_savings.toFixed(1)}% savings`);
    
    return selected_strategies;
  }

  /**
   * Apply selected optimization strategies to task
   */
  private async applyOptimizationStrategies(
    task: WorkerTask,
    strategies: TokenOptimizationStrategy[]
  ): Promise<WorkerTask> {
    let optimized_task = { ...task };
    let total_tokens_saved = 0;
    const applied_optimizations = [];

    for (const strategy of strategies) {
      try {
        console.log(`[${this.id}] Applying optimization strategy: ${strategy.name}`);
        
        const optimization_result = await strategy.implementation(optimized_task.input_data);
        
        optimized_task = {
          ...optimized_task,
          input_data: optimization_result.optimized_input,
          optimization_metadata: {
            ...optimized_task.optimization_metadata,
            [strategy.name]: optimization_result.metadata
          }
        };
        
        total_tokens_saved += optimization_result.tokens_saved;
        applied_optimizations.push({
          strategy: strategy.name,
          tokens_saved: optimization_result.tokens_saved,
          metadata: optimization_result.metadata
        });
        
      } catch (error) {
        console.warn(`[${this.id}] Optimization strategy ${strategy.name} failed:`, error.message);
        // Continue with other strategies
      }
    }

    optimized_task.optimization_summary = {
      strategies_applied: applied_optimizations,
      total_tokens_saved,
      original_estimated_tokens: this.estimateTokens(task.input_data),
      optimized_estimated_tokens: this.estimateTokens(optimized_task.input_data)
    };

    return optimized_task;
  }

  /**
   * Execute the optimized task
   */
  private async executeOptimizedTask(task: WorkerTask): Promise<WorkerExecutionResult> {
    const execution_start = Date.now();
    
    // Simulate task execution with optimized parameters
    // In a real implementation, this would call the appropriate execution engine
    const execution_time = Math.max(100, Math.random() * 1000); // Simulated execution time
    
    await new Promise(resolve => setTimeout(resolve, execution_time));
    
    const tokens_consumed = task.optimization_summary?.optimized_estimated_tokens || this.estimateTokens(task.input_data);
    const tokens_saved = task.optimization_summary?.total_tokens_saved || 0;
    const original_tokens = task.optimization_summary?.original_estimated_tokens || tokens_consumed + tokens_saved;
    
    return {
      task_id: task.id,
      worker_id: this.id,
      status: 'completed',
      result_data: {
        message: `Task ${task.description} completed with optimization`,
        optimization_applied: task.optimization_summary,
        execution_context: 'token_optimized'
      },
      execution_metrics: {
        start_time: execution_start,
        end_time: Date.now(),
        execution_time_ms: execution_time,
        tokens_consumed,
        tokens_saved,
        cost_reduction_percentage: original_tokens > 0 ? (tokens_saved / original_tokens) * 100 : 0
      },
      quality_assessment: {
        accuracy_score: 0.90,
        completeness_score: 0.88,
        relevance_score: 0.92,
        overall_quality: 0.90
      },
      optimization_applied: {
        original_token_estimate: original_tokens,
        optimized_token_usage: tokens_consumed,
        optimization_techniques_used: task.optimization_summary?.strategies_applied.map(s => s.strategy) || [],
        cost_savings_percentage: original_tokens > 0 ? (tokens_saved / original_tokens) * 100 : 0,
        quality_impact_score: 0.05, // Minimal quality impact
        optimization_confidence: 0.92
      }
    };
  }

  /**
   * Optimize execution result for further token savings
   */
  private async optimizeExecutionResult(
    result: WorkerExecutionResult,
    strategies: TokenOptimizationStrategy[]
  ): Promise<WorkerExecutionResult> {
    // Post-processing optimization
    if (this.cache_enabled) {
      await this.cacheOptimizedResult(result);
    }
    
    // Update optimization history
    const task_type = result.result_data?.execution_context || 'unknown';
    if (!this.optimization_history.has(task_type)) {
      this.optimization_history.set(task_type, []);
    }
    
    this.optimization_history.get(task_type)?.push(result.optimization_applied);
    
    return result;
  }

  /**
   * Learn from optimization results for future improvements
   */
  private async learnFromOptimization(
    original_task: WorkerTask,
    result: WorkerExecutionResult,
    strategies: TokenOptimizationStrategy[]
  ): Promise<void> {
    const learning_key = `${original_task.type}_${original_task.required_capability}`;
    
    // Update learned patterns
    const current_pattern = this.learned_patterns.get(learning_key) || {
      total_executions: 0,
      average_savings: 0,
      best_strategies: new Map(),
      quality_impact_average: 0
    };
    
    current_pattern.total_executions++;
    current_pattern.average_savings = 
      ((current_pattern.average_savings * (current_pattern.total_executions - 1)) + 
       result.optimization_applied.cost_savings_percentage) / current_pattern.total_executions;
    
    current_pattern.quality_impact_average = 
      ((current_pattern.quality_impact_average * (current_pattern.total_executions - 1)) + 
       result.optimization_applied.quality_impact_score) / current_pattern.total_executions;
    
    // Update strategy effectiveness
    strategies.forEach(strategy => {
      const current_effectiveness = current_pattern.best_strategies.get(strategy.name) || 0;
      const new_effectiveness = (current_effectiveness + result.optimization_applied.cost_savings_percentage) / 2;
      current_pattern.best_strategies.set(strategy.name, new_effectiveness);
    });
    
    this.learned_patterns.set(learning_key, current_pattern);
    
    // Emit learning signal
    this.emit('optimization_learned', {
      task_type: original_task.type,
      strategies_used: strategies.map(s => s.name),
      savings_achieved: result.optimization_applied.cost_savings_percentage,
      quality_impact: result.optimization_applied.quality_impact_score,
      learning_key
    });
  }

  /**
   * Score optimization strategy based on context
   */
  private scoreOptimizationStrategy(
    strategy: TokenOptimizationStrategy,
    task: WorkerTask,
    context: OptimizationContext
  ): number {
    let score = strategy.estimated_savings_percentage; // Base score from potential savings
    
    // Adjust for quality impact
    score -= (strategy.quality_impact_score * 100); // Penalize quality impact
    
    // Adjust for complexity vs time constraints
    if (context.time_constraints < 2000 && strategy.complexity === 'high') {
      score -= 20; // Penalize high complexity strategies when time-constrained
    }
    
    // Bonus for learned effectiveness
    const learning_key = `${task.type}_${task.required_capability}`;
    const learned_pattern = this.learned_patterns.get(learning_key);
    if (learned_pattern?.best_strategies.has(strategy.name)) {
      const effectiveness = learned_pattern.best_strategies.get(strategy.name)!;
      score += effectiveness * 0.3; // 30% bonus based on learned effectiveness
    }
    
    // Adjust for current load
    if (context.current_load > 5 && strategy.complexity === 'high') {
      score -= 10; // Reduce score for complex strategies under load
    }
    
    return Math.max(score, 0);
  }

  /**
   * Cache optimized result for future reuse
   */
  private async cacheOptimizedResult(result: WorkerExecutionResult): Promise<void> {
    if (!this.cache_enabled) return;
    
    const cache_key = this.generateCacheKey(result);
    const cache_entry = {
      result,
      timestamp: Date.now(),
      access_count: 1,
      optimization_metadata: result.optimization_applied
    };
    
    this.optimization_cache.set(cache_key, cache_entry);
    
    // Cleanup old cache entries (keep last 1000)
    if (this.optimization_cache.size > 1000) {
      const entries = Array.from(this.optimization_cache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      
      // Keep only the newest 800 entries
      const to_keep = entries.slice(0, 800);
      this.optimization_cache.clear();
      to_keep.forEach(([key, value]) => this.optimization_cache.set(key, value));
    }
  }

  /**
   * Generate cache key for result caching
   */
  private generateCacheKey(result: WorkerExecutionResult): string {
    const task_signature = JSON.stringify({
      type: result.result_data?.execution_context,
      optimization_techniques: result.optimization_applied.optimization_techniques_used.sort()
    });
    
    return Buffer.from(task_signature).toString('base64').substring(0, 32);
  }

  // Optimization Strategy Implementations

  private async applyVortexCompression(input: any): Promise<{ compressed_text: string; tokens_saved: number; compression_ratio: number; quality_score: number }> {
    const original_text = typeof input === 'string' ? input : JSON.stringify(input);
    const original_tokens = this.estimateTokens(original_text);
    
    // VORTEX compression simulation - in production, integrate with actual VORTEX framework
    let compressed_text = original_text
      .replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/g, '') // Remove common words
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/([.!?])\s*/g, '$1 ') // Normalize punctuation spacing
      .trim();
    
    // Further semantic compression
    compressed_text = compressed_text
      .replace(/\b(very|really|quite|rather|extremely|incredibly)\s+/g, '') // Remove intensifiers
      .replace(/\b(I think|I believe|In my opinion|It seems|Perhaps)\s+/g, ''); // Remove hedging
    
    const compressed_tokens = this.estimateTokens(compressed_text);
    const tokens_saved = Math.max(0, original_tokens - compressed_tokens);
    const compression_ratio = original_tokens > 0 ? compressed_tokens / original_tokens : 1;
    
    return {
      compressed_text,
      tokens_saved,
      compression_ratio,
      quality_score: Math.max(0.85, 1 - ((tokens_saved / original_tokens) * 0.2)) // Estimate quality retention
    };
  }

  private async applySemanticDeduplication(input: any): Promise<{ optimized_input: any; tokens_saved: number; metadata: any }> {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Simple semantic deduplication - remove very similar sentences
    const unique_sentences = [];
    const similarity_threshold = 0.7;
    
    for (const sentence of sentences) {
      const is_similar = unique_sentences.some(existing => 
        this.calculateSimilarity(sentence.trim(), existing.trim()) > similarity_threshold
      );
      
      if (!is_similar) {
        unique_sentences.push(sentence.trim());
      }
    }
    
    const deduplicated_text = unique_sentences.join('. ') + '.';
    const original_tokens = this.estimateTokens(text);
    const optimized_tokens = this.estimateTokens(deduplicated_text);
    
    return {
      optimized_input: deduplicated_text,
      tokens_saved: Math.max(0, original_tokens - optimized_tokens),
      metadata: {
        original_sentences: sentences.length,
        unique_sentences: unique_sentences.length,
        deduplication_ratio: unique_sentences.length / sentences.length
      }
    };
  }

  private async applyHierarchicalPruning(input: any): Promise<{ optimized_input: any; tokens_saved: number; metadata: any }> {
    // Context hierarchical pruning - remove less important context elements
    if (typeof input !== 'object' || !input.context) {
      return { optimized_input: input, tokens_saved: 0, metadata: {} };
    }
    
    const context = { ...input.context };
    const importance_hierarchy = [
      'primary_requirements',
      'constraints',
      'examples',
      'background_info',
      'additional_context',
      'metadata',
      'debug_info'
    ];
    
    let tokens_saved = 0;
    const pruned_elements = [];
    
    // Remove elements in reverse order of importance until we hit our target savings
    for (const element of importance_hierarchy.reverse()) {
      if (context[element]) {
        const element_tokens = this.estimateTokens(context[element]);
        tokens_saved += element_tokens;
        pruned_elements.push(element);
        delete context[element];
        
        // Stop if we've achieved reasonable savings
        if (tokens_saved > this.estimateTokens(input) * 0.25) break;
      }
    }
    
    return {
      optimized_input: { ...input, context },
      tokens_saved,
      metadata: {
        pruned_elements,
        pruning_ratio: pruned_elements.length / importance_hierarchy.length
      }
    };
  }

  private async applyPromptTemplateOptimization(input: any): Promise<{ optimized_input: any; tokens_saved: number; metadata: any }> {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    
    // Template optimization - use more concise prompt structures
    const optimizations = [
      { pattern: /Please (.*?) for me/gi, replacement: '$1' },
      { pattern: /Could you (.*?) \?/gi, replacement: '$1.' },
      { pattern: /I would like you to (.*)/gi, replacement: '$1' },
      { pattern: /Can you help me (.*?) \?/gi, replacement: '$1.' },
      { pattern: /\b(Here is|This is|The following is)\s+/gi, replacement: '' }
    ];
    
    let optimized_text = text;
    let total_chars_saved = 0;
    
    optimizations.forEach(({ pattern, replacement }) => {
      const before_length = optimized_text.length;
      optimized_text = optimized_text.replace(pattern, replacement);
      total_chars_saved += before_length - optimized_text.length;
    });
    
    const tokens_saved = Math.floor(total_chars_saved / 4); // Rough estimate
    
    return {
      optimized_input: optimized_text,
      tokens_saved,
      metadata: {
        optimizations_applied: optimizations.length,
        characters_saved: total_chars_saved
      }
    };
  }

  private async applyDynamicModelRouting(input: any): Promise<{ optimized_input: any; tokens_saved: number; metadata: any }> {
    // Dynamic model routing - select most cost-efficient model for task
    const complexity_score = this.analyzeTaskComplexity(input);
    
    let selected_model = 'gpt-3.5-turbo'; // Default cost-efficient model
    let cost_multiplier = 1.0;
    
    if (complexity_score > 0.8) {
      selected_model = 'gpt-4'; // Use more capable model for complex tasks
      cost_multiplier = 1.2; // Higher cost but better quality
    } else if (complexity_score < 0.3) {
      selected_model = 'gpt-3.5-turbo-instruct'; // Use cheapest model for simple tasks
      cost_multiplier = 0.7; // Lower cost
    }
    
    // Calculate potential savings from model selection
    const base_tokens = this.estimateTokens(input);
    const tokens_saved = Math.floor(base_tokens * (1 - cost_multiplier));
    
    return {
      optimized_input: {
        ...input,
        model_routing: {
          selected_model,
          complexity_score,
          cost_multiplier
        }
      },
      tokens_saved: Math.max(0, tokens_saved),
      metadata: {
        selected_model,
        complexity_score,
        cost_optimization: (1 - cost_multiplier) * 100
      }
    };
  }

  private async applyCacheLookupOptimization(input: any): Promise<{ optimized_input: any; tokens_saved: number; metadata: any }> {
    const cache_key = this.generateInputCacheKey(input);
    const cached_result = this.optimization_cache.get(cache_key);
    
    if (cached_result) {
      // Cache hit - massive token savings
      cached_result.access_count++;
      
      const estimated_tokens = this.estimateTokens(input);
      
      return {
        optimized_input: {
          ...input,
          cache_hit: true,
          cached_result: cached_result.result
        },
        tokens_saved: Math.floor(estimated_tokens * 0.9), // 90% savings from cache hit
        metadata: {
          cache_hit: true,
          cache_age_ms: Date.now() - cached_result.timestamp,
          access_count: cached_result.access_count
        }
      };
    }
    
    // Cache miss - no immediate savings but prepare for caching
    return {
      optimized_input: {
        ...input,
        cache_hit: false,
        cache_key
      },
      tokens_saved: 0,
      metadata: {
        cache_hit: false,
        cache_key
      }
    };
  }

  private generateInputCacheKey(input: any): string {
    const normalized_input = typeof input === 'string' 
      ? input.toLowerCase().replace(/\s+/g, ' ').trim()
      : JSON.stringify(input);
    
    return Buffer.from(normalized_input).toString('base64').substring(0, 32);
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity for semantic deduplication
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private analyzeTaskComplexity(input: any): number {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    
    let complexity = 0;
    
    // Length-based complexity
    complexity += Math.min(text.length / 1000, 0.3);
    
    // Keyword-based complexity
    const complex_keywords = [
      'analyze', 'synthesize', 'evaluate', 'compare', 'complex', 'detailed',
      'comprehensive', 'thorough', 'algorithm', 'optimization', 'architecture'
    ];
    
    const keyword_matches = complex_keywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    ).length;
    
    complexity += Math.min(keyword_matches / complex_keywords.length, 0.4);
    
    // Structure-based complexity
    if (typeof input === 'object' && input.context) {
      complexity += 0.2;
    }
    
    // Question complexity
    const question_count = (text.match(/\?/g) || []).length;
    complexity += Math.min(question_count * 0.1, 0.1);
    
    return Math.min(complexity, 1.0);
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): {
    total_optimizations: number;
    average_savings_percentage: number;
    best_performing_strategies: Array<{ name: string; effectiveness: number }>;
    cache_hit_rate: number;
    learned_patterns_count: number;
  } {
    const all_optimizations = Array.from(this.optimization_history.values()).flat();
    const average_savings = all_optimizations.length > 0 
      ? all_optimizations.reduce((sum, opt) => sum + opt.cost_savings_percentage, 0) / all_optimizations.length
      : 0;
    
    // Get best performing strategies from learned patterns
    const strategy_effectiveness = new Map<string, number>();
    this.learned_patterns.forEach(pattern => {
      pattern.best_strategies.forEach((effectiveness, strategy) => {
        const current = strategy_effectiveness.get(strategy) || 0;
        strategy_effectiveness.set(strategy, Math.max(current, effectiveness));
      });
    });
    
    const best_strategies = Array.from(strategy_effectiveness.entries())
      .map(([name, effectiveness]) => ({ name, effectiveness }))
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, 5);
    
    // Calculate cache hit rate
    const cache_entries = Array.from(this.optimization_cache.values());
    const cache_hits = cache_entries.reduce((sum, entry) => sum + entry.access_count - 1, 0);
    const cache_requests = cache_entries.reduce((sum, entry) => sum + entry.access_count, 0);
    const cache_hit_rate = cache_requests > 0 ? cache_hits / cache_requests : 0;
    
    return {
      total_optimizations: all_optimizations.length,
      average_savings_percentage: average_savings,
      best_performing_strategies: best_strategies,
      cache_hit_rate,
      learned_patterns_count: this.learned_patterns.size
    };
  }
}