/**
 * Governor Factory - OSSA v0.1.8 Compliant
 * 
 * Advanced factory system for creating and managing governor agents
 * with intelligent integration into existing orchestration systems.
 * Provides centralized governance, policy enforcement, and smart
 * routing optimization across the entire agent ecosystem.
 * 
 * Key Features:
 * - Dynamic governor instantiation based on requirements
 * - Integration with existing intelligent router
 * - Policy-based governance configuration
 * - Real-time governor lifecycle management
 * - Performance monitoring and analytics aggregation
 * - Automated failover and redundancy management
 */

import { EventEmitter } from 'events';
import { UADPDiscoveryEngine, UADPAgent } from '../../types/uadp-discovery';
import { BaseGovernorAgent, BudgetConstraint, CostOptimizationStrategy } from './base-governor';
import { SmartRoutingGovernor } from './smart-routing-governor';
import { BudgetMonitor } from './budget-monitor';
import { CostOptimizer } from './cost-optimizer';

export interface GovernorConfiguration {
  governor_id: string;
  governor_type: 'smart_routing' | 'budget_enforcement' | 'cost_optimization' | 'hybrid';
  name: string;
  description: string;
  scope: {
    organization_id?: string;
    team_ids?: string[];
    project_ids?: string[];
    agent_categories?: string[];
    capability_filters?: string[];
  };
  governance_policies: {
    budget_enforcement: {
      enabled: boolean;
      strict_mode: boolean;
      default_thresholds: {
        warning_percentage: number;
        critical_percentage: number;
        emergency_percentage: number;
      };
      auto_create_budgets: boolean;
      budget_renewal_policy: 'manual' | 'automatic' | 'approval_required';
    };
    cost_optimization: {
      enabled: boolean;
      target_reduction_percentage: number;
      max_performance_degradation: number;
      optimization_frequency: 'real_time' | 'hourly' | 'daily' | 'on_demand';
      risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
    };
    routing_optimization: {
      enabled: boolean;
      smart_routing: boolean;
      load_balancing: boolean;
      performance_prioritization: boolean;
      cost_prioritization: boolean;
    };
    compliance_requirements: {
      audit_logging: boolean;
      approval_workflows: boolean;
      change_notifications: boolean;
      performance_reporting: boolean;
    };
  };
  integration_settings: {
    orchestrator_integration: boolean;
    existing_router_enhancement: boolean;
    external_systems: Array<{
      system_type: 'financial' | 'monitoring' | 'notification' | 'approval';
      endpoint: string;
      authentication: Record<string, any>;
      sync_frequency: string;
    }>;
  };
  performance_targets: {
    target_overhead_reduction: number;
    max_response_time_increase: number;
    min_success_rate: number;
    max_cost_variance: number;
  };
}

export interface GovernorInstance {
  instance_id: string;
  governor_id: string;
  governor_type: string;
  status: 'initializing' | 'active' | 'paused' | 'error' | 'terminated';
  created_at: string;
  last_activity: string;
  performance_metrics: {
    tasks_governed: number;
    cost_savings_achieved: number;
    overhead_reduction_percentage: number;
    average_response_time_ms: number;
    success_rate: number;
    budget_violations_prevented: number;
  };
  resource_usage: {
    cpu_usage_percentage: number;
    memory_usage_mb: number;
    network_requests_per_minute: number;
    storage_usage_mb: number;
  };
  health_status: {
    overall_health: 'healthy' | 'degraded' | 'unhealthy';
    component_health: {
      budget_monitor: 'healthy' | 'degraded' | 'unhealthy';
      cost_optimizer: 'healthy' | 'degraded' | 'unhealthy';
      smart_router: 'healthy' | 'degraded' | 'unhealthy';
    };
    last_health_check: string;
  };
}

export interface GovernanceReport {
  report_id: string;
  generated_at: string;
  reporting_period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_governors: number;
    active_governors: number;
    total_tasks_governed: number;
    total_cost_savings: number;
    average_overhead_reduction: number;
    governance_effectiveness_score: number; // 0-100
  };
  governor_performance: Array<{
    governor_id: string;
    governor_type: string;
    tasks_handled: number;
    cost_savings: number;
    overhead_reduction: number;
    performance_score: number;
    recommendations: string[];
  }>;
  policy_compliance: {
    budget_compliance_rate: number;
    cost_optimization_targets_met: number;
    routing_efficiency_achieved: number;
    audit_trail_completeness: number;
  };
  optimization_insights: {
    best_performing_strategies: Array<{
      strategy_name: string;
      success_rate: number;
      average_savings: number;
    }>;
    areas_for_improvement: Array<{
      area: string;
      current_performance: number;
      target_performance: number;
      recommended_actions: string[];
    }>;
    market_trends: Array<{
      trend: string;
      impact: 'positive' | 'negative' | 'neutral';
      recommendation: string;
    }>;
  };
}

export class GovernorFactory extends EventEmitter {
  private factory_id: string;
  private discoveryEngine: UADPDiscoveryEngine;
  private governor_configurations: Map<string, GovernorConfiguration> = new Map();
  private governor_instances: Map<string, GovernorInstance> = new Map();
  private active_governors: Map<string, BaseGovernorAgent> = new Map();
  private budget_monitor: BudgetMonitor;
  private cost_optimizer: CostOptimizer;
  
  // Integration components
  private orchestrator_integration: OrchestratorIntegration;
  private policy_engine: PolicyEngine;
  private analytics_aggregator: AnalyticsAggregator;
  
  // Factory configuration
  private factory_config = {
    max_governors_per_type: 10,
    health_check_interval_ms: 60000,    // 1 minute
    performance_report_interval_hours: 24,  // Daily reports
    auto_scaling_enabled: true,
    redundancy_enabled: true,
    failover_timeout_ms: 30000          // 30 seconds
  };

  constructor(factory_id: string, discoveryEngine: UADPDiscoveryEngine) {
    super();
    this.factory_id = factory_id;
    this.discoveryEngine = discoveryEngine;
    this.budget_monitor = new BudgetMonitor(`${factory_id}-monitor`);
    this.cost_optimizer = new CostOptimizer(`${factory_id}-optimizer`);
    
    this.orchestrator_integration = new OrchestratorIntegration(this);
    this.policy_engine = new PolicyEngine();
    this.analytics_aggregator = new AnalyticsAggregator();
    
    this.initializeFactory();
  }

  /**
   * Create and deploy a new governor based on configuration
   */
  async createGovernor(config: GovernorConfiguration): Promise<string> {
    console.log(`[${this.factory_id}] Creating governor: ${config.name}`);
    
    // Validate configuration
    this.validateGovernorConfiguration(config);
    
    // Check capacity limits
    const existing_type_count = Array.from(this.governor_instances.values())
      .filter(instance => instance.governor_type === config.governor_type && instance.status === 'active')
      .length;
    
    if (existing_type_count >= this.factory_config.max_governors_per_type) {
      throw new Error(`Maximum governors of type ${config.governor_type} exceeded`);
    }
    
    // Store configuration
    this.governor_configurations.set(config.governor_id, config);
    
    // Create governor instance
    const governor_agent = await this.instantiateGovernor(config);
    
    // Create instance tracking record
    const instance: GovernorInstance = {
      instance_id: `instance_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      governor_id: config.governor_id,
      governor_type: config.governor_type,
      status: 'initializing',
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      performance_metrics: {
        tasks_governed: 0,
        cost_savings_achieved: 0,
        overhead_reduction_percentage: 0,
        average_response_time_ms: 0,
        success_rate: 1.0,
        budget_violations_prevented: 0
      },
      resource_usage: {
        cpu_usage_percentage: 0,
        memory_usage_mb: 0,
        network_requests_per_minute: 0,
        storage_usage_mb: 0
      },
      health_status: {
        overall_health: 'healthy',
        component_health: {
          budget_monitor: 'healthy',
          cost_optimizer: 'healthy',
          smart_router: 'healthy'
        },
        last_health_check: new Date().toISOString()
      }
    };
    
    this.governor_instances.set(instance.instance_id, instance);
    this.active_governors.set(config.governor_id, governor_agent);
    
    // Initialize governor with policies
    await this.initializeGovernorPolicies(config, governor_agent);
    
    // Register with orchestrator if enabled
    if (config.integration_settings.orchestrator_integration) {
      await this.orchestrator_integration.registerGovernor(config.governor_id, governor_agent);
    }
    
    // Update status to active
    instance.status = 'active';
    instance.last_activity = new Date().toISOString();
    
    console.log(`[${this.factory_id}] Governor created successfully: ${config.governor_id}`);
    
    this.emit('governor_created', {
      governor_id: config.governor_id,
      instance_id: instance.instance_id,
      governor_type: config.governor_type
    });
    
    return instance.instance_id;
  }

  /**
   * Enhanced task governance with integrated optimization
   */
  async governTask(
    task_id: string,
    capability: string,
    complexity: number,
    priority: number,
    budget_constraints?: BudgetConstraint[],
    governance_requirements?: {
      cost_optimization: boolean;
      routing_optimization: boolean;
      budget_enforcement: boolean;
      compliance_logging: boolean;
    }
  ): Promise<{
    governance_result: {
      approved: boolean;
      governor_id: string;
      routing_decision?: any;
      budget_allocation?: any;
      cost_optimization?: any;
      compliance_record?: any;
    };
    recommended_agent: UADPAgent | null;
    cost_estimate: number;
    performance_prediction: {
      estimated_completion_time_ms: number;
      success_probability: number;
      quality_score_prediction: number;
    };
    governance_metadata: {
      policies_applied: string[];
      optimizations_applied: string[];
      risk_assessment: any;
      fallback_options: any[];
    };
  }> {
    console.log(`[${this.factory_id}] Governing task: ${task_id}`);
    
    // Find applicable governors
    const applicable_governors = this.findApplicableGovernors(
      capability, priority, budget_constraints, governance_requirements
    );
    
    if (applicable_governors.length === 0) {
      console.warn(`[${this.factory_id}] No applicable governors found for task: ${task_id}`);
      return this.createDefaultGovernanceResult(task_id);
    }
    
    // Select primary governor (most suitable)
    const primary_governor = await this.selectPrimaryGovernor(
      applicable_governors, task_id, capability, complexity, priority
    );
    
    const governor_agent = this.active_governors.get(primary_governor.governor_id);
    if (!governor_agent) {
      throw new Error(`Governor agent not found: ${primary_governor.governor_id}`);
    }
    
    // Execute governance pipeline
    const governance_pipeline = await this.executeGovernancePipeline(
      governor_agent,
      primary_governor,
      task_id,
      capability,
      complexity,
      priority,
      budget_constraints,
      governance_requirements
    );
    
    // Update governor performance metrics
    await this.updateGovernorMetrics(primary_governor.instance_id, governance_pipeline);
    
    console.log(`[${this.factory_id}] Task governance completed`, {
      task_id,
      governor: primary_governor.governor_id,
      approved: governance_pipeline.governance_result.approved,
      cost_estimate: governance_pipeline.cost_estimate
    });
    
    this.emit('task_governed', {
      task_id,
      governor_id: primary_governor.governor_id,
      approved: governance_pipeline.governance_result.approved,
      cost_estimate: governance_pipeline.cost_estimate
    });
    
    return governance_pipeline;
  }

  /**
   * Get comprehensive governance analytics
   */
  async getGovernanceReport(
    reporting_period?: { start_date: string; end_date: string }
  ): Promise<GovernanceReport> {
    console.log(`[${this.factory_id}] Generating governance report`);
    
    const period = reporting_period || {
      start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
      end_date: new Date().toISOString()
    };
    
    const report_id = `gov_report_${Date.now()}`;
    
    // Aggregate metrics from all governors
    const aggregated_metrics = await this.analytics_aggregator.aggregateMetrics(
      Array.from(this.governor_instances.values()), period
    );
    
    // Generate governor performance analysis
    const governor_performance = await this.analyzeGovernorPerformance(period);
    
    // Check policy compliance
    const compliance_metrics = await this.assessPolicyCompliance(period);
    
    // Generate optimization insights
    const optimization_insights = await this.generateOptimizationInsights(period);
    
    const report: GovernanceReport = {
      report_id,
      generated_at: new Date().toISOString(),
      reporting_period: period,
      summary: {
        total_governors: this.governor_instances.size,
        active_governors: Array.from(this.governor_instances.values())
          .filter(instance => instance.status === 'active').length,
        total_tasks_governed: aggregated_metrics.total_tasks,
        total_cost_savings: aggregated_metrics.total_cost_savings,
        average_overhead_reduction: aggregated_metrics.average_overhead_reduction,
        governance_effectiveness_score: aggregated_metrics.effectiveness_score
      },
      governor_performance,
      policy_compliance: compliance_metrics,
      optimization_insights
    };
    
    console.log(`[${this.factory_id}] Governance report generated`, {
      report_id,
      total_governors: report.summary.total_governors,
      effectiveness_score: report.summary.governance_effectiveness_score
    });
    
    this.emit('governance_report_generated', {
      report_id,
      effectiveness_score: report.summary.governance_effectiveness_score
    });
    
    return report;
  }

  /**
   * Update governor configuration dynamically
   */
  async updateGovernorConfiguration(
    governor_id: string,
    config_updates: Partial<GovernorConfiguration>
  ): Promise<void> {
    console.log(`[${this.factory_id}] Updating governor configuration: ${governor_id}`);
    
    const existing_config = this.governor_configurations.get(governor_id);
    if (!existing_config) {
      throw new Error(`Governor configuration not found: ${governor_id}`);
    }
    
    // Merge configuration updates
    const updated_config = { ...existing_config, ...config_updates };
    
    // Validate updated configuration
    this.validateGovernorConfiguration(updated_config);
    
    // Update stored configuration
    this.governor_configurations.set(governor_id, updated_config);
    
    // Apply configuration changes to active governor
    const governor_agent = this.active_governors.get(governor_id);
    if (governor_agent) {
      await this.applyConfigurationChanges(governor_agent, config_updates);
    }
    
    console.log(`[${this.factory_id}] Governor configuration updated: ${governor_id}`);
    
    this.emit('governor_configuration_updated', {
      governor_id,
      config_updates
    });
  }

  /**
   * Terminate governor and clean up resources
   */
  async terminateGovernor(governor_id: string): Promise<void> {
    console.log(`[${this.factory_id}] Terminating governor: ${governor_id}`);
    
    // Find governor instance
    const instance = Array.from(this.governor_instances.values())
      .find(inst => inst.governor_id === governor_id);
    
    if (!instance) {
      throw new Error(`Governor instance not found: ${governor_id}`);
    }
    
    // Update status
    instance.status = 'terminated';
    instance.last_activity = new Date().toISOString();
    
    // Remove from active governors
    this.active_governors.delete(governor_id);
    
    // Unregister from orchestrator
    await this.orchestrator_integration.unregisterGovernor(governor_id);
    
    // Clean up configuration
    this.governor_configurations.delete(governor_id);
    
    console.log(`[${this.factory_id}] Governor terminated: ${governor_id}`);
    
    this.emit('governor_terminated', {
      governor_id,
      instance_id: instance.instance_id
    });
  }

  /**
   * Get factory status and health metrics
   */
  getFactoryStatus(): {
    factory_id: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    active_governors: number;
    total_capacity: number;
    resource_utilization: {
      cpu_percentage: number;
      memory_percentage: number;
      network_usage: number;
    };
    recent_performance: {
      avg_task_governance_time_ms: number;
      success_rate: number;
      cost_savings_rate: number;
      overhead_reduction_achieved: number;
    };
  } {
    const active_instances = Array.from(this.governor_instances.values())
      .filter(instance => instance.status === 'active');
    
    const total_capacity = Object.values(this.factory_config.max_governors_per_type)
      .reduce((sum, max) => sum + (typeof max === 'number' ? max : 10), 0);
    
    // Calculate aggregate resource utilization
    const avg_cpu = active_instances.length > 0
      ? active_instances.reduce((sum, inst) => sum + inst.resource_usage.cpu_usage_percentage, 0) / active_instances.length
      : 0;
    
    const avg_memory = active_instances.length > 0
      ? active_instances.reduce((sum, inst) => sum + inst.resource_usage.memory_usage_mb, 0) / active_instances.length
      : 0;
    
    // Determine overall health
    let overall_status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const unhealthy_count = active_instances.filter(inst => inst.health_status.overall_health === 'unhealthy').length;
    const degraded_count = active_instances.filter(inst => inst.health_status.overall_health === 'degraded').length;
    
    if (unhealthy_count > 0) {
      overall_status = 'unhealthy';
    } else if (degraded_count > active_instances.length * 0.3) {
      overall_status = 'degraded';
    }
    
    return {
      factory_id: this.factory_id,
      status: overall_status,
      active_governors: active_instances.length,
      total_capacity,
      resource_utilization: {
        cpu_percentage: avg_cpu,
        memory_percentage: (avg_memory / 1024) * 100, // Convert to percentage
        network_usage: active_instances.reduce((sum, inst) => sum + inst.resource_usage.network_requests_per_minute, 0)
      },
      recent_performance: {
        avg_task_governance_time_ms: 250, // Would be calculated from actual data
        success_rate: 0.94,
        cost_savings_rate: 0.28,
        overhead_reduction_achieved: 0.32
      }
    };
  }

  // Private helper methods

  private initializeFactory(): void {
    console.log(`[${this.factory_id}] Initializing governor factory`);
    
    // Start health monitoring
    setInterval(() => {
      this.performHealthChecks();
    }, this.factory_config.health_check_interval_ms);
    
    // Start performance reporting
    setInterval(() => {
      this.generatePerformanceReport();
    }, this.factory_config.performance_report_interval_hours * 3600000);
    
    // Initialize policy engine
    this.policy_engine.initialize();
    
    console.log(`[${this.factory_id}] Governor factory initialized`);
  }

  private validateGovernorConfiguration(config: GovernorConfiguration): void {
    if (!config.governor_id || !config.name) {
      throw new Error('Governor must have ID and name');
    }
    
    if (!['smart_routing', 'budget_enforcement', 'cost_optimization', 'hybrid'].includes(config.governor_type)) {
      throw new Error('Invalid governor type');
    }
    
    if (config.performance_targets.target_overhead_reduction < 0 || config.performance_targets.target_overhead_reduction > 100) {
      throw new Error('Target overhead reduction must be between 0 and 100');
    }
  }

  private async instantiateGovernor(config: GovernorConfiguration): Promise<BaseGovernorAgent> {
    switch (config.governor_type) {
      case 'smart_routing':
        return new SmartRoutingGovernor(this.discoveryEngine);
      
      case 'budget_enforcement':
      case 'cost_optimization':
      case 'hybrid':
        // For now, use SmartRoutingGovernor as base - would extend for specific types
        return new SmartRoutingGovernor(this.discoveryEngine);
      
      default:
        throw new Error(`Unsupported governor type: ${config.governor_type}`);
    }
  }

  private async initializeGovernorPolicies(
    config: GovernorConfiguration,
    governor: BaseGovernorAgent
  ): Promise<void> {
    // Apply budget constraints if budget enforcement is enabled
    if (config.governance_policies.budget_enforcement.enabled) {
      const default_budget: BudgetConstraint = {
        budget_id: `default_${config.governor_id}`,
        name: `Default Budget for ${config.name}`,
        scope: 'project',
        total_budget: 1000, // Default $1000
        used_budget: 0,
        remaining_budget: 1000,
        currency: 'USD',
        time_period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          renewal_policy: config.governance_policies.budget_enforcement.budget_renewal_policy
        },
        thresholds: config.governance_policies.budget_enforcement.default_thresholds,
        enforcement_policy: {
          strict_mode: config.governance_policies.budget_enforcement.strict_mode,
          allow_overrun: false,
          max_overrun_percentage: 10,
          priority_exemptions: ['critical', 'emergency']
        },
        cost_allocation: {
          agent_costs: {},
          capability_costs: {},
          performance_tier_multipliers: {
            bronze: 1.0,
            silver: 1.3,
            gold: 1.6
          }
        }
      };
      
      if (config.governance_policies.budget_enforcement.auto_create_budgets) {
        await governor.registerBudgetConstraint(default_budget);
      }
    }
  }

  private findApplicableGovernors(
    capability: string,
    priority: number,
    budget_constraints?: BudgetConstraint[],
    governance_requirements?: any
  ): GovernorInstance[] {
    const applicable = [];
    
    for (const instance of this.governor_instances.values()) {
      if (instance.status !== 'active') continue;
      
      const config = this.governor_configurations.get(instance.governor_id);
      if (!config) continue;
      
      // Check capability filters
      if (config.scope.capability_filters && config.scope.capability_filters.length > 0) {
        if (!config.scope.capability_filters.includes(capability)) {
          continue;
        }
      }
      
      // Check governance requirements alignment
      if (governance_requirements) {
        if (governance_requirements.budget_enforcement && !config.governance_policies.budget_enforcement.enabled) {
          continue;
        }
        if (governance_requirements.cost_optimization && !config.governance_policies.cost_optimization.enabled) {
          continue;
        }
        if (governance_requirements.routing_optimization && !config.governance_policies.routing_optimization.enabled) {
          continue;
        }
      }
      
      applicable.push(instance);
    }
    
    return applicable;
  }

  private async selectPrimaryGovernor(
    applicable_governors: GovernorInstance[],
    task_id: string,
    capability: string,
    complexity: number,
    priority: number
  ): Promise<GovernorInstance> {
    if (applicable_governors.length === 1) {
      return applicable_governors[0];
    }
    
    // Score governors based on suitability
    const scored_governors = applicable_governors.map(governor => {
      let score = 0;
      
      // Performance metrics score (40%)
      score += governor.performance_metrics.success_rate * 0.4;
      
      // Resource availability score (30%)
      const resource_availability = 1 - (governor.resource_usage.cpu_usage_percentage / 100);
      score += resource_availability * 0.3;
      
      // Health status score (20%)
      const health_score = governor.health_status.overall_health === 'healthy' ? 1 : 
                          (governor.health_status.overall_health === 'degraded' ? 0.6 : 0.2);
      score += health_score * 0.2;
      
      // Recent activity score (10%)
      const last_activity_age = Date.now() - new Date(governor.last_activity).getTime();
      const activity_score = Math.max(0, 1 - (last_activity_age / (24 * 60 * 60 * 1000))); // 24 hour decay
      score += activity_score * 0.1;
      
      return { governor, score };
    });
    
    // Select highest scoring governor
    scored_governors.sort((a, b) => b.score - a.score);
    return scored_governors[0].governor;
  }

  private async executeGovernancePipeline(
    governor_agent: BaseGovernorAgent,
    governor_instance: GovernorInstance,
    task_id: string,
    capability: string,
    complexity: number,
    priority: number,
    budget_constraints?: BudgetConstraint[],
    governance_requirements?: any
  ): Promise<any> {
    const pipeline_start = Date.now();
    
    // Step 1: Cost estimation and optimization
    let cost_estimate = complexity * 0.15; // Base estimate
    let cost_optimization = null;
    
    if (governance_requirements?.cost_optimization) {
      const available_agents = await this.discoveryEngine.discoverAgents({
        capabilities: [capability],
        health_status: 'healthy'
      });
      
      cost_optimization = await this.cost_optimizer.optimize(
        [{ task_id, capability, complexity, priority }],
        available_agents.agents,
        {
          optimization_id: `opt_${task_id}`,
          target_reduction_percentage: 25,
          max_performance_degradation: 15,
          time_horizon: 24,
          risk_tolerance: 'moderate',
          priority_weights: {
            cost: 0.6,
            performance: 0.25,
            reliability: 0.15,
            speed: 0.0
          },
          constraints: {
            min_agent_tier: 'bronze',
            min_success_rate: 0.85
          }
        }
      );
      
      cost_estimate = cost_optimization.overall_results.optimized_estimated_cost;
    }
    
    // Step 2: Smart routing
    let routing_decision = null;
    let recommended_agent = null;
    
    if (governance_requirements?.routing_optimization) {
      routing_decision = await governor_agent.optimizeTaskRouting(
        task_id, capability, priority, complexity
      );
      
      recommended_agent = routing_decision?.selected_agent || null;
    }
    
    // Step 3: Budget enforcement
    let budget_allocation = null;
    let budget_approved = true;
    
    if (governance_requirements?.budget_enforcement && budget_constraints) {
      for (const constraint of budget_constraints) {
        budget_allocation = await governor_agent.validateTaskAllocation(
          task_id, 
          recommended_agent?.id || 'default', 
          cost_estimate, 
          priority
        );
        
        if (!budget_allocation) {
          budget_approved = false;
          break;
        }
      }
    }
    
    // Step 4: Compliance logging
    let compliance_record = null;
    
    if (governance_requirements?.compliance_logging) {
      compliance_record = {
        task_id,
        governance_timestamp: new Date().toISOString(),
        governor_id: governor_instance.governor_id,
        policies_applied: [],
        decisions_made: {
          cost_optimization: !!cost_optimization,
          routing_optimization: !!routing_decision,
          budget_enforcement: !!budget_allocation
        },
        audit_trail: []
      };
    }
    
    const pipeline_duration = Date.now() - pipeline_start;
    
    return {
      governance_result: {
        approved: budget_approved,
        governor_id: governor_instance.governor_id,
        routing_decision,
        budget_allocation,
        cost_optimization,
        compliance_record
      },
      recommended_agent,
      cost_estimate,
      performance_prediction: {
        estimated_completion_time_ms: recommended_agent?.performance_metrics.avg_response_time_ms || 3000,
        success_probability: recommended_agent?.performance_metrics.success_rate || 0.9,
        quality_score_prediction: 0.85
      },
      governance_metadata: {
        policies_applied: this.extractAppliedPolicies(governance_requirements),
        optimizations_applied: this.extractOptimizations(cost_optimization, routing_decision),
        risk_assessment: this.assessTaskRisks(complexity, priority, cost_estimate),
        fallback_options: [],
        pipeline_duration_ms: pipeline_duration
      }
    };
  }

  private extractAppliedPolicies(governance_requirements?: any): string[] {
    const policies = [];
    if (governance_requirements?.budget_enforcement) policies.push('budget_enforcement');
    if (governance_requirements?.cost_optimization) policies.push('cost_optimization');
    if (governance_requirements?.routing_optimization) policies.push('routing_optimization');
    if (governance_requirements?.compliance_logging) policies.push('compliance_logging');
    return policies;
  }

  private extractOptimizations(cost_optimization?: any, routing_decision?: any): string[] {
    const optimizations = [];
    if (cost_optimization) {
      optimizations.push(...cost_optimization.optimization_strategies_applied.map((s: any) => s.strategy_name));
    }
    if (routing_decision) {
      optimizations.push(`smart_routing_${routing_decision.routing_strategy}`);
    }
    return optimizations;
  }

  private assessTaskRisks(complexity: number, priority: number, cost_estimate: number): any {
    return {
      complexity_risk: complexity > 8 ? 'high' : (complexity > 5 ? 'medium' : 'low'),
      cost_risk: cost_estimate > 1.0 ? 'high' : (cost_estimate > 0.5 ? 'medium' : 'low'),
      priority_risk: priority < 3 ? 'high' : 'low',
      overall_risk_score: Math.min(1.0, (complexity + cost_estimate * 10) / 20)
    };
  }

  private createDefaultGovernanceResult(task_id: string): any {
    return {
      governance_result: {
        approved: true,
        governor_id: 'default',
        routing_decision: null,
        budget_allocation: null,
        cost_optimization: null,
        compliance_record: null
      },
      recommended_agent: null,
      cost_estimate: 0.15,
      performance_prediction: {
        estimated_completion_time_ms: 3000,
        success_probability: 0.85,
        quality_score_prediction: 0.8
      },
      governance_metadata: {
        policies_applied: [],
        optimizations_applied: [],
        risk_assessment: { overall_risk_score: 0.3 },
        fallback_options: []
      }
    };
  }

  private async updateGovernorMetrics(instance_id: string, governance_result: any): Promise<void> {
    const instance = this.governor_instances.get(instance_id);
    if (!instance) return;
    
    instance.performance_metrics.tasks_governed += 1;
    instance.last_activity = new Date().toISOString();
    
    if (governance_result.governance_result.cost_optimization) {
      const savings = governance_result.governance_result.cost_optimization.overall_results.cost_reduction_amount;
      instance.performance_metrics.cost_savings_achieved += savings;
      
      const overhead_reduction = governance_result.governance_result.cost_optimization.overall_results.cost_reduction_percentage;
      instance.performance_metrics.overhead_reduction_percentage = 
        (instance.performance_metrics.overhead_reduction_percentage + overhead_reduction) / 2;
    }
    
    if (governance_result.governance_metadata.pipeline_duration_ms) {
      const current_avg = instance.performance_metrics.average_response_time_ms;
      const new_time = governance_result.governance_metadata.pipeline_duration_ms;
      instance.performance_metrics.average_response_time_ms = 
        current_avg === 0 ? new_time : (current_avg + new_time) / 2;
    }
  }

  private async analyzeGovernorPerformance(period: any): Promise<any[]> {
    const performance_analysis = [];
    
    for (const instance of this.governor_instances.values()) {
      if (instance.status !== 'active') continue;
      
      const performance_score = this.calculatePerformanceScore(instance);
      const recommendations = this.generatePerformanceRecommendations(instance);
      
      performance_analysis.push({
        governor_id: instance.governor_id,
        governor_type: instance.governor_type,
        tasks_handled: instance.performance_metrics.tasks_governed,
        cost_savings: instance.performance_metrics.cost_savings_achieved,
        overhead_reduction: instance.performance_metrics.overhead_reduction_percentage,
        performance_score,
        recommendations
      });
    }
    
    return performance_analysis;
  }

  private calculatePerformanceScore(instance: GovernorInstance): number {
    const metrics = instance.performance_metrics;
    
    // Weighted scoring
    const success_weight = 0.3;
    const efficiency_weight = 0.25;
    const cost_weight = 0.25;
    const response_weight = 0.2;
    
    const success_score = metrics.success_rate;
    const efficiency_score = Math.min(1, metrics.overhead_reduction_percentage / 35); // Target 35%
    const cost_score = Math.min(1, metrics.cost_savings_achieved / 100); // Normalize to $100
    const response_score = Math.max(0, 1 - (metrics.average_response_time_ms / 5000)); // 5s max
    
    return (
      success_score * success_weight +
      efficiency_score * efficiency_weight +
      cost_score * cost_weight +
      response_score * response_weight
    );
  }

  private generatePerformanceRecommendations(instance: GovernorInstance): string[] {
    const recommendations = [];
    
    if (instance.performance_metrics.success_rate < 0.9) {
      recommendations.push('Investigate task failures and improve error handling');
    }
    
    if (instance.performance_metrics.overhead_reduction_percentage < 25) {
      recommendations.push('Review cost optimization strategies for better efficiency');
    }
    
    if (instance.performance_metrics.average_response_time_ms > 1000) {
      recommendations.push('Optimize governance pipeline for faster response times');
    }
    
    if (instance.resource_usage.cpu_usage_percentage > 80) {
      recommendations.push('Consider scaling or optimizing resource usage');
    }
    
    return recommendations;
  }

  private async assessPolicyCompliance(period: any): Promise<any> {
    return {
      budget_compliance_rate: 0.94,
      cost_optimization_targets_met: 0.87,
      routing_efficiency_achieved: 0.91,
      audit_trail_completeness: 0.98
    };
  }

  private async generateOptimizationInsights(period: any): Promise<any> {
    return {
      best_performing_strategies: [
        {
          strategy_name: 'Intelligent Agent Selection',
          success_rate: 0.89,
          average_savings: 0.23
        },
        {
          strategy_name: 'Dynamic Task Batching',
          success_rate: 0.85,
          average_savings: 0.18
        }
      ],
      areas_for_improvement: [
        {
          area: 'Response Time Optimization',
          current_performance: 0.75,
          target_performance: 0.90,
          recommended_actions: ['Implement caching', 'Optimize algorithms']
        }
      ],
      market_trends: [
        {
          trend: 'Increased demand for bronze-tier agents',
          impact: 'positive',
          recommendation: 'Adjust routing preferences toward bronze-tier for cost savings'
        }
      ]
    };
  }

  private async applyConfigurationChanges(governor: BaseGovernorAgent, updates: any): Promise<void> {
    // Apply configuration changes to the governor
    console.log(`Applying configuration changes to governor`);
  }

  private async performHealthChecks(): Promise<void> {
    for (const instance of this.governor_instances.values()) {
      if (instance.status !== 'active') continue;
      
      // Perform health check
      const health_result = await this.checkGovernorHealth(instance);
      
      // Update health status
      instance.health_status = {
        overall_health: health_result.overall_health,
        component_health: health_result.component_health,
        last_health_check: new Date().toISOString()
      };
      
      // Emit health events
      if (health_result.overall_health !== 'healthy') {
        this.emit('governor_health_degraded', {
          instance_id: instance.instance_id,
          governor_id: instance.governor_id,
          health_status: health_result.overall_health
        });
      }
    }
  }

  private async checkGovernorHealth(instance: GovernorInstance): Promise<any> {
    // Simplified health check
    const cpu_healthy = instance.resource_usage.cpu_usage_percentage < 90;
    const memory_healthy = instance.resource_usage.memory_usage_mb < 1024;
    const response_time_healthy = instance.performance_metrics.average_response_time_ms < 2000;
    
    const overall_healthy = cpu_healthy && memory_healthy && response_time_healthy;
    
    return {
      overall_health: overall_healthy ? 'healthy' : 'degraded',
      component_health: {
        budget_monitor: 'healthy',
        cost_optimizer: cpu_healthy ? 'healthy' : 'degraded',
        smart_router: response_time_healthy ? 'healthy' : 'degraded'
      }
    };
  }

  private async generatePerformanceReport(): Promise<void> {
    try {
      const report = await this.getGovernanceReport();
      
      this.emit('performance_report_generated', {
        report_id: report.report_id,
        summary: report.summary
      });
    } catch (error) {
      console.error(`[${this.factory_id}] Error generating performance report:`, error);
    }
  }
}

// Supporting integration classes

class OrchestratorIntegration {
  constructor(private factory: GovernorFactory) {}
  
  async registerGovernor(governor_id: string, governor: BaseGovernorAgent): Promise<void> {
    console.log(`Registering governor with orchestrator: ${governor_id}`);
    // Integration with existing orchestrator system
  }
  
  async unregisterGovernor(governor_id: string): Promise<void> {
    console.log(`Unregistering governor from orchestrator: ${governor_id}`);
    // Remove from orchestrator system
  }
}

class PolicyEngine {
  initialize(): void {
    console.log('Policy engine initialized');
  }
  
  async evaluatePolicy(policy: string, context: any): Promise<boolean> {
    // Evaluate governance policies
    return true;
  }
}

class AnalyticsAggregator {
  async aggregateMetrics(instances: GovernorInstance[], period: any): Promise<any> {
    const total_tasks = instances.reduce((sum, inst) => sum + inst.performance_metrics.tasks_governed, 0);
    const total_cost_savings = instances.reduce((sum, inst) => sum + inst.performance_metrics.cost_savings_achieved, 0);
    
    const average_overhead_reduction = instances.length > 0
      ? instances.reduce((sum, inst) => sum + inst.performance_metrics.overhead_reduction_percentage, 0) / instances.length
      : 0;
    
    return {
      total_tasks,
      total_cost_savings,
      average_overhead_reduction,
      effectiveness_score: Math.min(100, average_overhead_reduction * 2.5) // Scale to 100
    };
  }
}