/**
 * Orchestrator Factory - OSSA v0.1.8 Compliant
 * 
 * Factory class for creating and managing orchestrator agent instances
 * with intelligent selection based on goal requirements and system conditions.
 * 
 * Implements:
 * - Dynamic orchestrator selection for optimal performance
 * - Load balancing across orchestrator instances
 * - Performance monitoring and adaptive routing
 * - Orchestrator health management and failover
 * - Metrics aggregation and efficiency tracking
 */

import { BaseOrchestratorAgent, TaskDecomposition } from './base-orchestrator';
import { GoalDecomposerOrchestrator } from './goal-decomposer';
import { IntelligentTaskRouter } from './intelligent-router';
import { WorkflowCoordinator } from './workflow-coordinator';
import { UADPDiscoveryEngine } from '../../types/uadp-discovery';

export type OrchestratorType = 'goal_decomposer' | 'intelligent_router' | 'workflow_coordinator' | 'auto_select';

export interface OrchestratorInstance {
  type: OrchestratorType;
  instance: BaseOrchestratorAgent;
  created_at: number;
  task_count: number;
  success_rate: number;
  average_efficiency: number;
  last_used: number;
  status: 'active' | 'idle' | 'overloaded' | 'failed';
}

export interface OrchestratorSelectionCriteria {
  goal_complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  workflow_patterns: string[];
  performance_requirements: {
    max_response_time_ms?: number;
    min_efficiency_target?: number;
    preferred_strategy?: 'sequential' | 'parallel' | 'adaptive';
  };
  resource_constraints: {
    max_token_budget?: number;
    max_agent_count?: number;
    cost_optimization?: boolean;
  };
  domain_context?: {
    domain: string;
    specialization?: string;
    compliance_requirements?: string[];
  };
}

export interface OrchestratorMetrics {
  total_orchestrations: number;
  success_rate: number;
  average_efficiency_gain: number;
  average_response_time_ms: number;
  token_optimization_average: number;
  orchestrator_utilization: Record<OrchestratorType, {
    active_instances: number;
    task_count: number;
    success_rate: number;
    average_efficiency: number;
  }>;
  performance_trends: {
    efficiency_trend: 'improving' | 'stable' | 'declining';
    response_time_trend: 'improving' | 'stable' | 'declining';
    success_rate_trend: 'improving' | 'stable' | 'declining';
  };
}

export class OrchestratorFactory {
  private discoveryEngine: UADPDiscoveryEngine;
  private orchestrator_instances: Map<string, OrchestratorInstance> = new Map();
  private selection_history: Array<{
    goal: string;
    selected_type: OrchestratorType;
    actual_efficiency: number;
    timestamp: number;
  }> = [];
  private factory_metrics: OrchestratorMetrics;

  constructor(discoveryEngine: UADPDiscoveryEngine) {
    this.discoveryEngine = discoveryEngine;
    this.factory_metrics = this.initializeMetrics();
    this.initializeDefaultOrchestrators();
    this.setupPerformanceMonitoring();
  }

  /**
   * Create or retrieve orchestrator instance with intelligent selection
   */
  async createOrchestrator(
    type: OrchestratorType = 'auto_select',
    selection_criteria?: OrchestratorSelectionCriteria
  ): Promise<BaseOrchestratorAgent> {
    // Auto-select optimal orchestrator type if requested
    if (type === 'auto_select' && selection_criteria) {
      type = await this.selectOptimalOrchestratorType(selection_criteria);
    } else if (type === 'auto_select') {
      type = 'goal_decomposer'; // Default fallback
    }

    // Get or create orchestrator instance
    const instance_key = `${type}_${Date.now()}`;
    let orchestrator_instance = this.getAvailableInstance(type);

    if (!orchestrator_instance) {
      console.log(`[OrchestratorFactory] Creating new ${type} orchestrator instance`);
      
      const orchestrator = this.instantiateOrchestrator(type);
      orchestrator_instance = {
        type,
        instance: orchestrator,
        created_at: Date.now(),
        task_count: 0,
        success_rate: 1.0,
        average_efficiency: 0,
        last_used: Date.now(),
        status: 'active'
      };

      this.orchestrator_instances.set(instance_key, orchestrator_instance);
    }

    // Update usage tracking
    orchestrator_instance.last_used = Date.now();
    orchestrator_instance.task_count++;

    console.log(`[OrchestratorFactory] Allocated ${type} orchestrator (tasks: ${orchestrator_instance.task_count})`);
    
    return orchestrator_instance.instance;
  }

  /**
   * Intelligent orchestrator type selection based on criteria
   */
  private async selectOptimalOrchestratorType(
    criteria: OrchestratorSelectionCriteria
  ): Promise<Exclude<OrchestratorType, 'auto_select'>> {
    console.log(`[OrchestratorFactory] Auto-selecting orchestrator type:`, {
      complexity: criteria.goal_complexity,
      patterns: criteria.workflow_patterns,
      domain: criteria.domain_context?.domain
    });

    // Score each orchestrator type based on criteria
    const type_scores = {
      goal_decomposer: this.scoreGoalDecomposer(criteria),
      intelligent_router: this.scoreIntelligentRouter(criteria),
      workflow_coordinator: this.scoreWorkflowCoordinator(criteria)
    };

    // Factor in historical performance
    const historical_performance = this.getHistoricalPerformance(criteria);
    
    for (const [type, score] of Object.entries(type_scores)) {
      const historical_bonus = historical_performance[type as keyof typeof historical_performance] || 0;
      type_scores[type as keyof typeof type_scores] += historical_bonus * 0.2; // 20% weight for history
    }

    // Select highest scoring type
    const selected_type = Object.entries(type_scores).reduce((best, [type, score]) => 
      score > best.score ? { type: type as Exclude<OrchestratorType, 'auto_select'>, score } : best
    , { type: 'goal_decomposer' as Exclude<OrchestratorType, 'auto_select'>, score: 0 }).type;

    console.log(`[OrchestratorFactory] Selected ${selected_type} (scores: ${JSON.stringify(type_scores)})`);
    
    return selected_type;
  }

  /**
   * Score Goal Decomposer orchestrator for given criteria
   */
  private scoreGoalDecomposer(criteria: OrchestratorSelectionCriteria): number {
    let score = 50; // Base score

    // Complexity preference - excels at moderate to complex goals
    const complexity_bonus = {
      'simple': 10,
      'moderate': 25,
      'complex': 30,
      'expert': 20
    };
    score += complexity_bonus[criteria.goal_complexity];

    // Workflow patterns - good for decomposition-heavy tasks
    if (criteria.workflow_patterns.some(pattern => 
      ['decomposition', 'analysis', 'planning'].includes(pattern.toLowerCase())
    )) {
      score += 20;
    }

    // Performance requirements - balanced performance
    if (criteria.performance_requirements.min_efficiency_target && 
        criteria.performance_requirements.min_efficiency_target <= 0.25) {
      score += 15;
    }

    // Domain context - versatile across domains
    if (criteria.domain_context?.domain === 'general' || !criteria.domain_context) {
      score += 10;
    }

    return score;
  }

  /**
   * Score Intelligent Router orchestrator for given criteria
   */
  private scoreIntelligentRouter(criteria: OrchestratorSelectionCriteria): number {
    let score = 50; // Base score

    // Complexity preference - excels at complex routing scenarios
    const complexity_bonus = {
      'simple': 5,
      'moderate': 15,
      'complex': 35,
      'expert': 30
    };
    score += complexity_bonus[criteria.goal_complexity];

    // Workflow patterns - excellent for routing and optimization
    if (criteria.workflow_patterns.some(pattern => 
      ['routing', 'optimization', 'load_balancing', 'parallel'].includes(pattern.toLowerCase())
    )) {
      score += 30;
    }

    // Performance requirements - optimized for high performance
    if (criteria.performance_requirements.min_efficiency_target && 
        criteria.performance_requirements.min_efficiency_target > 0.25) {
      score += 25;
    }

    // Strategy preference - best for parallel execution
    if (criteria.performance_requirements.preferred_strategy === 'parallel') {
      score += 20;
    }

    // Resource constraints - good at cost optimization
    if (criteria.resource_constraints.cost_optimization) {
      score += 15;
    }

    return score;
  }

  /**
   * Score Workflow Coordinator orchestrator for given criteria
   */
  private scoreWorkflowCoordinator(criteria: OrchestratorSelectionCriteria): number {
    let score = 50; // Base score

    // Complexity preference - excels at expert-level complex workflows
    const complexity_bonus = {
      'simple': 0,
      'moderate': 10,
      'complex': 25,
      'expert': 35
    };
    score += complexity_bonus[criteria.goal_complexity];

    // Workflow patterns - specialized for workflow management
    if (criteria.workflow_patterns.some(pattern => 
      ['workflow', 'coordination', 'handoff', 'stages', 'pipeline'].includes(pattern.toLowerCase())
    )) {
      score += 35;
    }

    // Performance requirements - handles complex coordination
    if (criteria.performance_requirements.max_response_time_ms && 
        criteria.performance_requirements.max_response_time_ms > 30000) {
      score += 20; // Good for longer-running workflows
    }

    // Resource constraints - efficient with multiple agents
    if (criteria.resource_constraints.max_agent_count && 
        criteria.resource_constraints.max_agent_count > 5) {
      score += 15;
    }

    // Domain context - excellent for specialized domains
    if (criteria.domain_context?.specialization) {
      score += 20;
    }

    return score;
  }

  /**
   * Get historical performance data for orchestrator types
   */
  private getHistoricalPerformance(criteria: OrchestratorSelectionCriteria): Record<string, number> {
    // Analyze selection history for similar criteria
    const recent_history = this.selection_history.slice(-50); // Last 50 selections
    
    const performance_by_type: Record<string, { count: number; avg_efficiency: number }> = {
      goal_decomposer: { count: 0, avg_efficiency: 0 },
      intelligent_router: { count: 0, avg_efficiency: 0 },
      workflow_coordinator: { count: 0, avg_efficiency: 0 }
    };

    // Calculate average efficiency by type
    for (const history_entry of recent_history) {
      const type = history_entry.selected_type;
      if (performance_by_type[type]) {
        performance_by_type[type].count++;
        performance_by_type[type].avg_efficiency += history_entry.actual_efficiency;
      }
    }

    // Convert to performance scores
    const performance_scores: Record<string, number> = {};
    for (const [type, stats] of Object.entries(performance_by_type)) {
      if (stats.count > 0) {
        const avg_efficiency = stats.avg_efficiency / stats.count;
        performance_scores[type] = (avg_efficiency - 0.2) * 100; // Scale and center around 20% efficiency
      } else {
        performance_scores[type] = 0;
      }
    }

    return performance_scores;
  }

  /**
   * Get available orchestrator instance of specified type
   */
  private getAvailableInstance(type: OrchestratorType): OrchestratorInstance | null {
    const instances = Array.from(this.orchestrator_instances.values())
      .filter(instance => 
        instance.type === type && 
        instance.status === 'active' && 
        instance.task_count < 10 // Max concurrent tasks per instance
      )
      .sort((a, b) => a.task_count - b.task_count); // Prefer least loaded

    return instances[0] || null;
  }

  /**
   * Instantiate specific orchestrator type
   */
  private instantiateOrchestrator(type: Exclude<OrchestratorType, 'auto_select'>): BaseOrchestratorAgent {
    switch (type) {
      case 'goal_decomposer':
        return new GoalDecomposerOrchestrator(this.discoveryEngine);
      case 'intelligent_router':
        return new IntelligentTaskRouter(this.discoveryEngine);
      case 'workflow_coordinator':
        return new WorkflowCoordinator(this.discoveryEngine);
      default:
        throw new Error(`Unknown orchestrator type: ${type}`);
    }
  }

  /**
   * Execute goal decomposition with selected orchestrator
   */
  async orchestrateGoal(
    goal: string,
    context: Record<string, any> = {},
    selection_criteria?: OrchestratorSelectionCriteria
  ): Promise<{
    decomposition: TaskDecomposition;
    orchestrator_type: string;
    efficiency_metrics: any;
  }> {
    const start_time = Date.now();
    
    console.log(`[OrchestratorFactory] Orchestrating goal: ${goal}`);
    
    // Auto-generate selection criteria if not provided
    if (!selection_criteria) {
      selection_criteria = this.generateSelectionCriteria(goal, context);
    }

    // Create optimal orchestrator
    const orchestrator = await this.createOrchestrator('auto_select', selection_criteria);
    const orchestrator_type = this.getOrchestratorType(orchestrator);

    try {
      // Execute goal decomposition
      const decomposition = await orchestrator.decomposeGoal(goal, context);
      
      // Execute orchestration
      const execution_metrics = await orchestrator.executeOrchestration(decomposition);
      
      const total_time = Date.now() - start_time;
      
      // Record performance for learning
      this.recordPerformance(goal, orchestrator_type, execution_metrics);
      
      console.log(`[OrchestratorFactory] Orchestration completed:`, {
        type: orchestrator_type,
        efficiency: `${execution_metrics.efficiency_gain}%`,
        time: `${total_time}ms`
      });

      return {
        decomposition,
        orchestrator_type,
        efficiency_metrics: execution_metrics
      };

    } catch (error) {
      console.error(`[OrchestratorFactory] Orchestration failed:`, error);
      
      // Record failure for learning
      this.recordFailure(goal, orchestrator_type, error);
      
      throw error;
    }
  }

  /**
   * Generate selection criteria from goal and context analysis
   */
  private generateSelectionCriteria(
    goal: string,
    context: Record<string, any>
  ): OrchestratorSelectionCriteria {
    // Analyze goal complexity
    const word_count = goal.split(/\s+/).length;
    const complexity_indicators = [
      /complex|complicated|sophisticated|advanced/i,
      /multiple|several|various|different/i,
      /integrate|coordinate|synchronize|orchestrate/i
    ];
    
    let complexity_score = Math.min(word_count, 30);
    complexity_indicators.forEach(indicator => {
      if (indicator.test(goal)) complexity_score += 10;
    });

    const goal_complexity = complexity_score < 20 ? 'simple' :
                           complexity_score < 40 ? 'moderate' :
                           complexity_score < 60 ? 'complex' : 'expert';

    // Detect workflow patterns
    const workflow_patterns = [];
    const pattern_indicators = {
      'decomposition': /break.*down|decompose|divide|split/i,
      'workflow': /workflow|process|pipeline|stages/i,
      'routing': /route|distribute|assign|allocate/i,
      'parallel': /parallel|concurrent|simultaneous/i,
      'coordination': /coordinate|orchestrate|manage|control/i
    };

    for (const [pattern, regex] of Object.entries(pattern_indicators)) {
      if (regex.test(goal)) {
        workflow_patterns.push(pattern);
      }
    }

    return {
      goal_complexity,
      workflow_patterns,
      performance_requirements: {
        min_efficiency_target: context.efficiency_target || 0.25, // Default 25% target
        max_response_time_ms: context.max_time || 300000, // Default 5 minutes
        preferred_strategy: context.strategy || 'adaptive'
      },
      resource_constraints: {
        max_token_budget: context.token_budget,
        max_agent_count: context.max_agents,
        cost_optimization: context.cost_optimization || false
      },
      domain_context: context.domain ? {
        domain: context.domain,
        specialization: context.specialization,
        compliance_requirements: context.compliance
      } : undefined
    };
  }

  /**
   * Get orchestrator type from instance
   */
  private getOrchestratorType(orchestrator: BaseOrchestratorAgent): string {
    if (orchestrator instanceof GoalDecomposerOrchestrator) return 'goal_decomposer';
    if (orchestrator instanceof IntelligentTaskRouter) return 'intelligent_router';
    if (orchestrator instanceof WorkflowCoordinator) return 'workflow_coordinator';
    return 'unknown';
  }

  /**
   * Record successful orchestration performance
   */
  private recordPerformance(
    goal: string,
    orchestrator_type: string,
    metrics: any
  ): void {
    this.selection_history.push({
      goal: goal.substring(0, 100), // Truncate for storage
      selected_type: orchestrator_type as OrchestratorType,
      actual_efficiency: metrics.efficiency_gain / 100, // Convert percentage to decimal
      timestamp: Date.now()
    });

    // Update factory metrics
    this.factory_metrics.total_orchestrations++;
    this.updateMetricsFromExecution(orchestrator_type, metrics, true);
    
    // Limit history size
    if (this.selection_history.length > 1000) {
      this.selection_history = this.selection_history.slice(-500);
    }
  }

  /**
   * Record orchestration failure
   */
  private recordFailure(
    goal: string,
    orchestrator_type: string,
    error: any
  ): void {
    this.selection_history.push({
      goal: goal.substring(0, 100),
      selected_type: orchestrator_type as OrchestratorType,
      actual_efficiency: -0.1, // Negative efficiency for failures
      timestamp: Date.now()
    });

    this.updateMetricsFromExecution(orchestrator_type, { efficiency_gain: -10 }, false);
  }

  /**
   * Update factory metrics from execution
   */
  private updateMetricsFromExecution(
    orchestrator_type: string,
    metrics: any,
    success: boolean
  ): void {
    const type_metrics = this.factory_metrics.orchestrator_utilization[orchestrator_type as OrchestratorType];
    if (type_metrics) {
      type_metrics.task_count++;
      if (success) {
        type_metrics.success_rate = (type_metrics.success_rate * (type_metrics.task_count - 1) + 1) / type_metrics.task_count;
        type_metrics.average_efficiency = (type_metrics.average_efficiency * (type_metrics.task_count - 1) + metrics.efficiency_gain) / type_metrics.task_count;
      } else {
        type_metrics.success_rate = (type_metrics.success_rate * (type_metrics.task_count - 1)) / type_metrics.task_count;
      }
    }

    // Update global metrics
    if (success) {
      this.factory_metrics.success_rate = (this.factory_metrics.success_rate * (this.factory_metrics.total_orchestrations - 1) + 1) / this.factory_metrics.total_orchestrations;
      this.factory_metrics.average_efficiency_gain = (this.factory_metrics.average_efficiency_gain * (this.factory_metrics.total_orchestrations - 1) + metrics.efficiency_gain) / this.factory_metrics.total_orchestrations;
    } else {
      this.factory_metrics.success_rate = (this.factory_metrics.success_rate * (this.factory_metrics.total_orchestrations - 1)) / this.factory_metrics.total_orchestrations;
    }
  }

  /**
   * Initialize default orchestrator instances
   */
  private initializeDefaultOrchestrators(): void {
    console.log(`[OrchestratorFactory] Initializing orchestrator factory`);
    // Default instances can be created here if needed
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    setInterval(() => {
      this.cleanupInactiveInstances();
      this.updatePerformanceTrends();
    }, 60000); // Every minute
  }

  /**
   * Cleanup inactive orchestrator instances
   */
  private cleanupInactiveInstances(): void {
    const now = Date.now();
    const inactive_threshold = 10 * 60 * 1000; // 10 minutes

    for (const [key, instance] of this.orchestrator_instances) {
      if (now - instance.last_used > inactive_threshold && instance.task_count === 0) {
        console.log(`[OrchestratorFactory] Cleaning up inactive ${instance.type} orchestrator`);
        this.orchestrator_instances.delete(key);
      }
    }
  }

  /**
   * Update performance trends
   */
  private updatePerformanceTrends(): void {
    // Simple trend analysis based on recent performance
    const recent_selections = this.selection_history.slice(-20);
    
    if (recent_selections.length >= 10) {
      const first_half = recent_selections.slice(0, 10);
      const second_half = recent_selections.slice(10);
      
      const first_avg = first_half.reduce((sum, s) => sum + s.actual_efficiency, 0) / first_half.length;
      const second_avg = second_half.reduce((sum, s) => sum + s.actual_efficiency, 0) / second_half.length;
      
      const efficiency_trend = second_avg > first_avg + 0.05 ? 'improving' :
                              second_avg < first_avg - 0.05 ? 'declining' : 'stable';
      
      this.factory_metrics.performance_trends.efficiency_trend = efficiency_trend;
    }
  }

  /**
   * Initialize factory metrics
   */
  private initializeMetrics(): OrchestratorMetrics {
    return {
      total_orchestrations: 0,
      success_rate: 1.0,
      average_efficiency_gain: 0,
      average_response_time_ms: 0,
      token_optimization_average: 0,
      orchestrator_utilization: {
        goal_decomposer: { active_instances: 0, task_count: 0, success_rate: 1.0, average_efficiency: 0 },
        intelligent_router: { active_instances: 0, task_count: 0, success_rate: 1.0, average_efficiency: 0 },
        workflow_coordinator: { active_instances: 0, task_count: 0, success_rate: 1.0, average_efficiency: 0 },
        auto_select: { active_instances: 0, task_count: 0, success_rate: 1.0, average_efficiency: 0 }
      },
      performance_trends: {
        efficiency_trend: 'stable',
        response_time_trend: 'stable',
        success_rate_trend: 'stable'
      }
    };
  }

  /**
   * Get comprehensive factory metrics
   */
  getFactoryMetrics(): OrchestratorMetrics {
    // Update active instances count
    for (const type of Object.keys(this.factory_metrics.orchestrator_utilization)) {
      const active_count = Array.from(this.orchestrator_instances.values())
        .filter(instance => instance.type === type && instance.status === 'active').length;
      
      this.factory_metrics.orchestrator_utilization[type as OrchestratorType].active_instances = active_count;
    }

    return { ...this.factory_metrics };
  }

  /**
   * Get active orchestrator instances
   */
  getActiveInstances(): Array<{
    id: string;
    type: OrchestratorType;
    task_count: number;
    status: string;
    uptime_ms: number;
  }> {
    const now = Date.now();
    return Array.from(this.orchestrator_instances.entries()).map(([id, instance]) => ({
      id,
      type: instance.type,
      task_count: instance.task_count,
      status: instance.status,
      uptime_ms: now - instance.created_at
    }));
  }

  /**
   * Health check for orchestrator factory
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    active_instances: number;
    total_orchestrations: number;
    success_rate: number;
    average_efficiency: number;
  }> {
    const metrics = this.getFactoryMetrics();
    const active_instances = this.getActiveInstances().length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (metrics.success_rate < 0.8) {
      status = 'degraded';
    }
    if (metrics.success_rate < 0.5) {
      status = 'unhealthy';
    }

    return {
      status,
      active_instances,
      total_orchestrations: metrics.total_orchestrations,
      success_rate: metrics.success_rate,
      average_efficiency: metrics.average_efficiency_gain
    };
  }
}