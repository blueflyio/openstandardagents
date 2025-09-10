/**
 * Governor Agents Index - OSSA v0.1.8 Compliant
 * 
 * Central export module for all governor agent implementations providing
 * budget enforcement with smart routing achieving 34% overhead reduction
 * as specified in the OSSA roadmap.
 * 
 * Governor System Components:
 * - BaseGovernorAgent: Abstract base class for all governors
 * - SmartRoutingGovernor: Specialized governor with ML-powered routing optimization
 * - BudgetMonitor: Real-time budget monitoring and alerting system
 * - CostOptimizer: Advanced cost optimization engine with multiple algorithms
 * - GovernorFactory: Factory system for creating and managing governors
 * - PerformanceAnalytics: Comprehensive performance tracking and analytics
 * 
 * Architecture Overview:
 * The governor system provides a comprehensive governance layer for agent
 * operations with intelligent cost optimization, budget enforcement, and
 * performance monitoring. It integrates seamlessly with existing orchestration
 * systems while providing advanced smart routing capabilities that achieve
 * significant overhead reductions through ML-powered decision making.
 * 
 * Key Features:
 * - 34% overhead reduction through smart routing algorithms
 * - Real-time budget monitoring and enforcement
 * - Multi-objective cost optimization (cost, performance, reliability)
 * - Comprehensive performance analytics and reporting
 * - Policy-based governance with compliance tracking
 * - Integration with existing intelligent router systems
 * - Automated anomaly detection and remediation
 * - Advanced forecasting and predictive analytics
 */

// Core Governor Components
export {
  BaseGovernorAgent,
  type BudgetConstraint,
  type CostOptimizationStrategy,
  type BudgetAllocation,
  type SmartRoutingDecision
} from './base-governor';

export {
  SmartRoutingGovernor,
  type AgentCostModel,
  type RoutingOptimizationResult
} from './smart-routing-governor';

export {
  BudgetMonitor,
  type BudgetMetrics,
  type AlertConfiguration,
  type CostTrendAnalysis,
  type ComplianceReport
} from './budget-monitor';

export {
  CostOptimizer,
  type OptimizationParameters,
  type OptimizationResult,
  type MarketData,
  type OptimizationStrategy
} from './cost-optimizer';

export {
  GovernorFactory,
  type GovernorConfiguration,
  type GovernorInstance,
  type GovernanceReport
} from './governor-factory';

export {
  PerformanceAnalytics,
  type PerformanceMetric,
  type PerformanceDashboard,
  type PerformanceReport,
  type AnomalyDetectionResult
} from './performance-analytics';

// Utility functions for governor system initialization
export * from './utils';

/**
 * Governor System Constants
 */
export const GOVERNOR_CONSTANTS = {
  // Performance targets
  TARGET_OVERHEAD_REDUCTION: 34,          // 34% overhead reduction target
  MINIMUM_ACCEPTABLE_REDUCTION: 25,       // Minimum acceptable reduction
  MAXIMUM_PERFORMANCE_DEGRADATION: 15,    // Max acceptable performance loss (%)
  
  // System limits
  MAX_GOVERNORS_PER_TYPE: 10,
  DEFAULT_HEALTH_CHECK_INTERVAL_MS: 60000, // 1 minute
  DEFAULT_BUDGET_WARNING_THRESHOLD: 75,    // 75% budget utilization
  DEFAULT_BUDGET_CRITICAL_THRESHOLD: 90,   // 90% budget utilization
  DEFAULT_BUDGET_EMERGENCY_THRESHOLD: 95,  // 95% budget utilization
  
  // Optimization parameters
  DEFAULT_OPTIMIZATION_CONFIDENCE_THRESHOLD: 0.8,
  DEFAULT_ROUTING_ACCURACY_TARGET: 0.9,
  DEFAULT_COST_PREDICTION_ACCURACY_TARGET: 0.85,
  
  // Analytics configuration
  METRICS_RETENTION_DAYS: 90,
  ANOMALY_DETECTION_THRESHOLD: 3.0,       // 3-sigma threshold
  TREND_ANALYSIS_MIN_SAMPLES: 10,
  
  // Governor types
  GOVERNOR_TYPES: {
    SMART_ROUTING: 'smart_routing',
    BUDGET_ENFORCEMENT: 'budget_enforcement',
    COST_OPTIMIZATION: 'cost_optimization',
    HYBRID: 'hybrid'
  } as const,
  
  // Metric categories
  METRIC_CATEGORIES: {
    COST: 'cost',
    PERFORMANCE: 'performance',
    RELIABILITY: 'reliability',
    EFFICIENCY: 'efficiency',
    QUALITY: 'quality'
  } as const,
  
  // Alert severities
  ALERT_SEVERITIES: {
    INFO: 'info',
    WARNING: 'warning',
    CRITICAL: 'critical',
    EMERGENCY: 'emergency'
  } as const
} as const;

/**
 * Quick Start Configuration Templates
 */
export const GOVERNOR_TEMPLATES = {
  /**
   * Smart Routing Governor Template
   * Optimized for achieving 34% overhead reduction through intelligent routing
   */
  SMART_ROUTING_TEMPLATE: {
    governor_type: 'smart_routing',
    governance_policies: {
      budget_enforcement: {
        enabled: true,
        strict_mode: false,
        default_thresholds: {
          warning_percentage: 75,
          critical_percentage: 90,
          emergency_percentage: 95
        },
        auto_create_budgets: true,
        budget_renewal_policy: 'automatic'
      },
      cost_optimization: {
        enabled: true,
        target_reduction_percentage: 34,
        max_performance_degradation: 15,
        optimization_frequency: 'real_time',
        risk_tolerance: 'moderate'
      },
      routing_optimization: {
        enabled: true,
        smart_routing: true,
        load_balancing: true,
        performance_prioritization: true,
        cost_prioritization: true
      },
      compliance_requirements: {
        audit_logging: true,
        approval_workflows: false,
        change_notifications: true,
        performance_reporting: true
      }
    },
    performance_targets: {
      target_overhead_reduction: 34,
      max_response_time_increase: 200,
      min_success_rate: 0.9,
      max_cost_variance: 0.15
    }
  },

  /**
   * Budget Enforcement Template
   * Focused on strict budget monitoring and compliance
   */
  BUDGET_ENFORCEMENT_TEMPLATE: {
    governor_type: 'budget_enforcement',
    governance_policies: {
      budget_enforcement: {
        enabled: true,
        strict_mode: true,
        default_thresholds: {
          warning_percentage: 70,
          critical_percentage: 85,
          emergency_percentage: 95
        },
        auto_create_budgets: true,
        budget_renewal_policy: 'approval_required'
      },
      cost_optimization: {
        enabled: true,
        target_reduction_percentage: 20,
        max_performance_degradation: 10,
        optimization_frequency: 'hourly',
        risk_tolerance: 'conservative'
      },
      routing_optimization: {
        enabled: false,
        smart_routing: false,
        load_balancing: true,
        performance_prioritization: false,
        cost_prioritization: true
      },
      compliance_requirements: {
        audit_logging: true,
        approval_workflows: true,
        change_notifications: true,
        performance_reporting: true
      }
    },
    performance_targets: {
      target_overhead_reduction: 20,
      max_response_time_increase: 100,
      min_success_rate: 0.95,
      max_cost_variance: 0.05
    }
  },

  /**
   * Hybrid Governor Template
   * Balanced approach with all features enabled
   */
  HYBRID_TEMPLATE: {
    governor_type: 'hybrid',
    governance_policies: {
      budget_enforcement: {
        enabled: true,
        strict_mode: false,
        default_thresholds: {
          warning_percentage: 75,
          critical_percentage: 88,
          emergency_percentage: 95
        },
        auto_create_budgets: true,
        budget_renewal_policy: 'automatic'
      },
      cost_optimization: {
        enabled: true,
        target_reduction_percentage: 30,
        max_performance_degradation: 12,
        optimization_frequency: 'real_time',
        risk_tolerance: 'moderate'
      },
      routing_optimization: {
        enabled: true,
        smart_routing: true,
        load_balancing: true,
        performance_prioritization: true,
        cost_prioritization: true
      },
      compliance_requirements: {
        audit_logging: true,
        approval_workflows: false,
        change_notifications: true,
        performance_reporting: true
      }
    },
    performance_targets: {
      target_overhead_reduction: 30,
      max_response_time_increase: 150,
      min_success_rate: 0.92,
      max_cost_variance: 0.10
    }
  }
} as const;

/**
 * Governor System Status Interface
 * Used for monitoring overall system health
 */
export interface GovernorSystemStatus {
  system_id: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  active_governors: number;
  total_capacity: number;
  overall_performance: {
    average_overhead_reduction: number;
    total_cost_savings: number;
    success_rate: number;
    system_efficiency_score: number;
  };
  alerts: {
    critical: number;
    warnings: number;
    info: number;
  };
  last_updated: string;
}

/**
 * Integration Helper Functions
 */

/**
 * Create a default governor configuration
 */
export function createDefaultGovernorConfig(
  governor_id: string,
  name: string,
  template: keyof typeof GOVERNOR_TEMPLATES = 'SMART_ROUTING_TEMPLATE'
): GovernorConfiguration {
  const template_config = GOVERNOR_TEMPLATES[template];
  
  return {
    governor_id,
    name,
    description: `Governor created from ${template} template`,
    scope: {
      capability_filters: []
    },
    integration_settings: {
      orchestrator_integration: true,
      existing_router_enhancement: true,
      external_systems: []
    },
    ...template_config
  } as GovernorConfiguration;
}

/**
 * Validate governor configuration
 */
export function validateGovernorConfig(config: GovernorConfiguration): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields validation
  if (!config.governor_id) errors.push('Governor ID is required');
  if (!config.name) errors.push('Governor name is required');
  if (!Object.values(GOVERNOR_CONSTANTS.GOVERNOR_TYPES).includes(config.governor_type as any)) {
    errors.push('Invalid governor type');
  }
  
  // Performance targets validation
  if (config.performance_targets.target_overhead_reduction < 0 || 
      config.performance_targets.target_overhead_reduction > 100) {
    errors.push('Target overhead reduction must be between 0 and 100');
  }
  
  if (config.performance_targets.min_success_rate < 0 || 
      config.performance_targets.min_success_rate > 1) {
    errors.push('Minimum success rate must be between 0 and 1');
  }
  
  // Budget thresholds validation
  const thresholds = config.governance_policies.budget_enforcement.default_thresholds;
  if (thresholds.warning_percentage >= thresholds.critical_percentage) {
    errors.push('Warning threshold must be less than critical threshold');
  }
  if (thresholds.critical_percentage >= thresholds.emergency_percentage) {
    errors.push('Critical threshold must be less than emergency threshold');
  }
  
  // Warnings for suboptimal configurations
  if (config.performance_targets.target_overhead_reduction < 20) {
    warnings.push('Target overhead reduction is below recommended minimum of 20%');
  }
  
  if (config.governance_policies.cost_optimization.max_performance_degradation > 20) {
    warnings.push('Maximum performance degradation is above recommended limit of 20%');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculate estimated ROI for governor implementation
 */
export function calculateEstimatedROI(
  monthly_baseline_cost: number,
  target_reduction_percentage: number,
  implementation_cost: number = 5000
): {
  monthly_savings: number;
  annual_savings: number;
  roi_percentage: number;
  payback_period_months: number;
} {
  const monthly_savings = monthly_baseline_cost * (target_reduction_percentage / 100);
  const annual_savings = monthly_savings * 12;
  const roi_percentage = ((annual_savings - implementation_cost) / implementation_cost) * 100;
  const payback_period_months = implementation_cost / monthly_savings;
  
  return {
    monthly_savings,
    annual_savings,
    roi_percentage,
    payback_period_months
  };
}

/**
 * Get optimal governor type recommendation based on requirements
 */
export function recommendGovernorType(requirements: {
  primary_concern: 'cost' | 'performance' | 'compliance' | 'balanced';
  budget_strictness: 'strict' | 'moderate' | 'flexible';
  performance_sensitivity: 'high' | 'medium' | 'low';
  optimization_frequency: 'real_time' | 'scheduled' | 'on_demand';
}): {
  recommended_type: keyof typeof GOVERNOR_CONSTANTS.GOVERNOR_TYPES;
  template: keyof typeof GOVERNOR_TEMPLATES;
  rationale: string;
  configuration_adjustments: string[];
} {
  let recommended_type: keyof typeof GOVERNOR_CONSTANTS.GOVERNOR_TYPES;
  let template: keyof typeof GOVERNOR_TEMPLATES;
  let rationale: string;
  const configuration_adjustments: string[] = [];
  
  if (requirements.primary_concern === 'cost' && requirements.budget_strictness === 'strict') {
    recommended_type = 'BUDGET_ENFORCEMENT';
    template = 'BUDGET_ENFORCEMENT_TEMPLATE';
    rationale = 'Strict budget enforcement with cost optimization focus';
  } else if (requirements.primary_concern === 'performance' || 
             requirements.optimization_frequency === 'real_time') {
    recommended_type = 'SMART_ROUTING';
    template = 'SMART_ROUTING_TEMPLATE';
    rationale = 'Smart routing optimization for performance and efficiency';
  } else {
    recommended_type = 'HYBRID';
    template = 'HYBRID_TEMPLATE';
    rationale = 'Balanced approach with all governance features';
  }
  
  // Add configuration adjustments based on requirements
  if (requirements.performance_sensitivity === 'high') {
    configuration_adjustments.push('Reduce max_performance_degradation to 8%');
    configuration_adjustments.push('Set risk_tolerance to conservative');
  }
  
  if (requirements.budget_strictness === 'strict') {
    configuration_adjustments.push('Enable strict_mode for budget enforcement');
    configuration_adjustments.push('Lower budget thresholds by 5%');
  }
  
  return {
    recommended_type,
    template,
    rationale,
    configuration_adjustments
  };
}

/**
 * Export version information
 */
export const GOVERNOR_VERSION = {
  version: '0.1.8',
  build_date: '2024-09-08',
  features: [
    'Smart routing with 34% overhead reduction',
    'Real-time budget monitoring and enforcement',
    'Multi-objective cost optimization',
    'Comprehensive performance analytics',
    'Policy-based governance',
    'Anomaly detection and remediation',
    'Predictive forecasting',
    'Integration with existing orchestrators'
  ],
  compatibility: {
    ossa_version: '0.1.8',
    node_version: '>=18.0.0',
    typescript_version: '>=5.0.0'
  }
} as const;

/**
 * Default export for easy access to main factory
 */
export { GovernorFactory as default } from './governor-factory';