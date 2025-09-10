/**
 * Governor Utilities - OSSA v0.1.8 Compliant
 * 
 * Utility functions and helpers for the governor agent system
 * providing common functionality for budget calculations, performance
 * metrics, cost optimization helpers, and system integration utilities.
 */

import type { UADPAgent } from '../../types/uadp-discovery';
import type { BudgetConstraint, BudgetAllocation } from './base-governor';
import type { PerformanceMetric } from './performance-analytics';

/**
 * Budget calculation utilities
 */
export namespace BudgetUtils {
  
  /**
   * Calculate budget utilization percentage
   */
  export function calculateUtilization(constraint: BudgetConstraint): number {
    if (constraint.total_budget === 0) return 0;
    return (constraint.used_budget / constraint.total_budget) * 100;
  }
  
  /**
   * Calculate remaining budget percentage
   */
  export function calculateRemainingPercentage(constraint: BudgetConstraint): number {
    if (constraint.total_budget === 0) return 0;
    return (constraint.remaining_budget / constraint.total_budget) * 100;
  }
  
  /**
   * Calculate daily burn rate
   */
  export function calculateDailyBurnRate(
    constraint: BudgetConstraint,
    period_days: number = 30
  ): number {
    const elapsed_days = Math.max(1, this.calculateElapsedDays(constraint));
    return constraint.used_budget / elapsed_days;
  }
  
  /**
   * Calculate elapsed days since budget start
   */
  export function calculateElapsedDays(constraint: BudgetConstraint): number {
    const start = new Date(constraint.time_period.start);
    const now = new Date();
    const elapsed_ms = now.getTime() - start.getTime();
    return Math.max(1, Math.floor(elapsed_ms / (24 * 60 * 60 * 1000)));
  }
  
  /**
   * Calculate projected end date based on current burn rate
   */
  export function projectEndDate(constraint: BudgetConstraint): Date {
    const daily_burn = this.calculateDailyBurnRate(constraint);
    if (daily_burn === 0) {
      return new Date(constraint.time_period.end);
    }
    
    const days_remaining = constraint.remaining_budget / daily_burn;
    const projected_end = new Date();
    projected_end.setDate(projected_end.getDate() + days_remaining);
    
    return projected_end;
  }
  
  /**
   * Check if budget is on track to meet time period
   */
  export function isOnTrack(constraint: BudgetConstraint): {
    on_track: boolean;
    variance_percentage: number;
    recommendation: string;
  } {
    const total_period_days = this.calculateTotalPeriodDays(constraint);
    const elapsed_days = this.calculateElapsedDays(constraint);
    const expected_utilization = (elapsed_days / total_period_days) * 100;
    const actual_utilization = this.calculateUtilization(constraint);
    const variance = actual_utilization - expected_utilization;
    
    return {
      on_track: Math.abs(variance) <= 10, // 10% tolerance
      variance_percentage: variance,
      recommendation: variance > 10 
        ? 'Spending ahead of schedule - consider cost optimization'
        : variance < -10
        ? 'Spending behind schedule - may have unused capacity'
        : 'Budget utilization is on track'
    };
  }
  
  /**
   * Calculate total period days
   */
  export function calculateTotalPeriodDays(constraint: BudgetConstraint): number {
    const start = new Date(constraint.time_period.start);
    const end = new Date(constraint.time_period.end);
    const total_ms = end.getTime() - start.getTime();
    return Math.max(1, Math.floor(total_ms / (24 * 60 * 60 * 1000)));
  }
}

/**
 * Cost optimization utilities
 */
export namespace CostUtils {
  
  /**
   * Calculate cost savings percentage
   */
  export function calculateSavingsPercentage(
    original_cost: number,
    optimized_cost: number
  ): number {
    if (original_cost === 0) return 0;
    return ((original_cost - optimized_cost) / original_cost) * 100;
  }
  
  /**
   * Calculate agent tier multiplier
   */
  export function getAgentTierMultiplier(tier: string): number {
    const multipliers = {
      'bronze': 1.0,
      'silver': 1.3,
      'gold': 1.6
    };
    return multipliers[tier as keyof typeof multipliers] || 1.0;
  }
  
  /**
   * Estimate task cost based on complexity and agent
   */
  export function estimateTaskCost(
    complexity: number,
    agent: UADPAgent,
    base_cost_per_unit: number = 0.1
  ): number {
    const tier_multiplier = this.getAgentTierMultiplier(
      agent.metadata.certification_level || 'bronze'
    );
    const complexity_factor = Math.pow(complexity / 5, 1.2); // Non-linear scaling
    
    return base_cost_per_unit * complexity * tier_multiplier * complexity_factor;
  }
  
  /**
   * Calculate cost efficiency score
   */
  export function calculateEfficiencyScore(
    cost_per_task: number,
    success_rate: number,
    response_time_ms: number,
    benchmark_cost: number = 0.15
  ): number {
    // Normalize metrics to 0-1 scale
    const cost_score = Math.max(0, 1 - (cost_per_task / benchmark_cost));
    const quality_score = success_rate;
    const speed_score = Math.max(0, 1 - (response_time_ms / 5000)); // 5s baseline
    
    // Weighted efficiency score
    return (cost_score * 0.4 + quality_score * 0.35 + speed_score * 0.25);
  }
  
  /**
   * Calculate ROI for cost optimization
   */
  export function calculateOptimizationROI(
    cost_before: number,
    cost_after: number,
    optimization_investment: number
  ): {
    savings: number;
    roi_percentage: number;
    payback_period_tasks: number;
  } {
    const savings = cost_before - cost_after;
    const roi_percentage = optimization_investment > 0 
      ? (savings / optimization_investment) * 100 
      : 0;
    const payback_period = optimization_investment > 0 
      ? optimization_investment / Math.max(0.01, savings)
      : 0;
    
    return {
      savings,
      roi_percentage,
      payback_period_tasks: payback_period
    };
  }
}

/**
 * Performance calculation utilities
 */
export namespace PerformanceUtils {
  
  /**
   * Calculate performance score based on multiple metrics
   */
  export function calculatePerformanceScore(metrics: {
    success_rate: number;
    avg_response_time_ms: number;
    uptime_percentage: number;
    cost_efficiency: number;
  }): number {
    const weights = {
      success_rate: 0.3,
      response_time: 0.25,
      uptime: 0.25,
      cost_efficiency: 0.2
    };
    
    const response_time_score = Math.max(0, 1 - (metrics.avg_response_time_ms / 10000));
    const uptime_score = metrics.uptime_percentage / 100;
    
    return (
      metrics.success_rate * weights.success_rate +
      response_time_score * weights.response_time +
      uptime_score * weights.uptime +
      metrics.cost_efficiency * weights.cost_efficiency
    );
  }
  
  /**
   * Calculate overhead reduction achievement
   */
  export function calculateOverheadReduction(
    baseline_cost: number,
    current_cost: number
  ): number {
    if (baseline_cost === 0) return 0;
    return ((baseline_cost - current_cost) / baseline_cost) * 100;
  }
  
  /**
   * Aggregate metrics over time period
   */
  export function aggregateMetrics(
    metrics: PerformanceMetric[],
    aggregation_type: 'average' | 'sum' | 'max' | 'min' = 'average'
  ): Record<string, number> {
    const aggregated: Record<string, number> = {};
    const metric_groups: Record<string, number[]> = {};
    
    // Group metrics by name
    for (const metric of metrics) {
      if (!metric_groups[metric.metric_name]) {
        metric_groups[metric.metric_name] = [];
      }
      metric_groups[metric.metric_name].push(metric.value);
    }
    
    // Aggregate each group
    for (const [metric_name, values] of Object.entries(metric_groups)) {
      switch (aggregation_type) {
        case 'average':
          aggregated[metric_name] = values.reduce((sum, v) => sum + v, 0) / values.length;
          break;
        case 'sum':
          aggregated[metric_name] = values.reduce((sum, v) => sum + v, 0);
          break;
        case 'max':
          aggregated[metric_name] = Math.max(...values);
          break;
        case 'min':
          aggregated[metric_name] = Math.min(...values);
          break;
      }
    }
    
    return aggregated;
  }
  
  /**
   * Calculate trend direction and strength
   */
  export function calculateTrend(values: number[]): {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: number; // 0-1
    confidence: number; // 0-1
  } {
    if (values.length < 3) {
      return { direction: 'stable', strength: 0, confidence: 0 };
    }
    
    // Simple linear regression
    const n = values.length;
    const x_values = values.map((_, i) => i);
    const x_mean = (n - 1) / 2;
    const y_mean = values.reduce((sum, v) => sum + v, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x_values[i] - x_mean) * (values[i] - y_mean);
      denominator += Math.pow(x_values[i] - x_mean, 2);
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const strength = Math.min(1, Math.abs(slope) / (y_mean || 1));
    
    // Calculate R-squared for confidence
    let ss_res = 0;
    let ss_tot = 0;
    
    for (let i = 0; i < n; i++) {
      const y_pred = y_mean + slope * (x_values[i] - x_mean);
      ss_res += Math.pow(values[i] - y_pred, 2);
      ss_tot += Math.pow(values[i] - y_mean, 2);
    }
    
    const r_squared = ss_tot !== 0 ? 1 - (ss_res / ss_tot) : 0;
    const confidence = Math.max(0, r_squared);
    
    return {
      direction: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
      strength,
      confidence
    };
  }
}

/**
 * Agent selection utilities
 */
export namespace AgentUtils {
  
  /**
   * Calculate agent suitability score for a task
   */
  export function calculateSuitabilityScore(
    agent: UADPAgent,
    task_capability: string,
    complexity: number,
    priority: number
  ): number {
    // Capability match score (40%)
    const capability_score = agent.capabilities.includes(task_capability) ? 1.0 : 0.0;
    
    // Performance score (30%)
    const performance_score = PerformanceUtils.calculatePerformanceScore({
      success_rate: agent.performance_metrics.success_rate,
      avg_response_time_ms: agent.performance_metrics.avg_response_time_ms,
      uptime_percentage: agent.performance_metrics.uptime_percentage,
      cost_efficiency: 0.8 // Default assumption
    });
    
    // Availability score (20%)
    const availability_score = agent.status === 'healthy' ? 1.0 : 0.5;
    
    // Tier appropriateness score (10%)
    const tier_score = this.calculateTierAppropriateness(
      agent.metadata.certification_level || 'bronze',
      complexity,
      priority
    );
    
    return (
      capability_score * 0.4 +
      performance_score * 0.3 +
      availability_score * 0.2 +
      tier_score * 0.1
    );
  }
  
  /**
   * Calculate tier appropriateness for task
   */
  export function calculateTierAppropriateness(
    agent_tier: string,
    complexity: number,
    priority: number
  ): number {
    const tier_values = { bronze: 1, silver: 2, gold: 3 };
    const agent_tier_value = tier_values[agent_tier as keyof typeof tier_values] || 1;
    
    // Determine optimal tier based on complexity and priority
    let optimal_tier_value = 1; // bronze default
    
    if (complexity >= 8 || priority >= 9) {
      optimal_tier_value = 3; // gold
    } else if (complexity >= 5 || priority >= 6) {
      optimal_tier_value = 2; // silver
    }
    
    // Calculate appropriateness (closer to optimal = higher score)
    const difference = Math.abs(agent_tier_value - optimal_tier_value);
    return Math.max(0, 1 - (difference / 2));
  }
  
  /**
   * Filter agents by criteria
   */
  export function filterAgents(
    agents: UADPAgent[],
    criteria: {
      capabilities?: string[];
      min_success_rate?: number;
      max_response_time_ms?: number;
      min_uptime_percentage?: number;
      required_tier?: 'bronze' | 'silver' | 'gold';
      status?: 'healthy' | 'degraded' | 'unhealthy';
    }
  ): UADPAgent[] {
    return agents.filter(agent => {
      // Capability check
      if (criteria.capabilities && criteria.capabilities.length > 0) {
        const has_required_capability = criteria.capabilities.some(cap => 
          agent.capabilities.includes(cap)
        );
        if (!has_required_capability) return false;
      }
      
      // Performance checks
      if (criteria.min_success_rate && 
          agent.performance_metrics.success_rate < criteria.min_success_rate) {
        return false;
      }
      
      if (criteria.max_response_time_ms && 
          agent.performance_metrics.avg_response_time_ms > criteria.max_response_time_ms) {
        return false;
      }
      
      if (criteria.min_uptime_percentage && 
          agent.performance_metrics.uptime_percentage < criteria.min_uptime_percentage) {
        return false;
      }
      
      // Tier check
      if (criteria.required_tier && 
          agent.metadata.certification_level !== criteria.required_tier) {
        return false;
      }
      
      // Status check
      if (criteria.status && agent.status !== criteria.status) {
        return false;
      }
      
      return true;
    });
  }
}

/**
 * Time and scheduling utilities
 */
export namespace TimeUtils {
  
  /**
   * Check if current time is within peak hours
   */
  export function isPeakHours(timezone: string = 'UTC'): boolean {
    const now = new Date();
    const hour = now.getHours(); // This is simplified - real implementation would handle timezone
    return hour >= 9 && hour <= 17; // 9 AM to 5 PM
  }
  
  /**
   * Calculate time until next off-peak period
   */
  export function timeUntilOffPeak(): number {
    const now = new Date();
    const hour = now.getHours();
    
    if (this.isPeakHours()) {
      // Time until 6 PM
      const end_of_peak = new Date(now);
      end_of_peak.setHours(18, 0, 0, 0);
      
      if (end_of_peak <= now) {
        // Next day
        end_of_peak.setDate(end_of_peak.getDate() + 1);
      }
      
      return end_of_peak.getTime() - now.getTime();
    }
    
    return 0; // Already off-peak
  }
  
  /**
   * Format duration in human readable format
   */
  export function formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

/**
 * Validation utilities
 */
export namespace ValidationUtils {
  
  /**
   * Validate budget constraint
   */
  export function validateBudgetConstraint(constraint: BudgetConstraint): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!constraint.budget_id) {
      errors.push('Budget ID is required');
    }
    
    if (!constraint.name) {
      errors.push('Budget name is required');
    }
    
    if (constraint.total_budget <= 0) {
      errors.push('Total budget must be positive');
    }
    
    if (constraint.used_budget < 0) {
      errors.push('Used budget cannot be negative');
    }
    
    if (constraint.used_budget > constraint.total_budget) {
      errors.push('Used budget cannot exceed total budget');
    }
    
    if (constraint.thresholds.warning_percentage >= constraint.thresholds.critical_percentage) {
      errors.push('Warning threshold must be less than critical threshold');
    }
    
    if (constraint.thresholds.critical_percentage >= constraint.thresholds.emergency_percentage) {
      errors.push('Critical threshold must be less than emergency threshold');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate performance metric
   */
  export function validatePerformanceMetric(metric: PerformanceMetric): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!metric.metric_id) {
      errors.push('Metric ID is required');
    }
    
    if (!metric.metric_name) {
      errors.push('Metric name is required');
    }
    
    if (!metric.source_id) {
      errors.push('Source ID is required');
    }
    
    if (typeof metric.value !== 'number') {
      errors.push('Metric value must be a number');
    }
    
    if (!metric.timestamp) {
      errors.push('Timestamp is required');
    } else {
      const timestamp = new Date(metric.timestamp);
      if (isNaN(timestamp.getTime())) {
        errors.push('Invalid timestamp format');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Math utilities for calculations
 */
export namespace MathUtils {
  
  /**
   * Calculate percentile of a value in an array
   */
  export function calculatePercentile(values: number[], target: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    let count = 0;
    
    for (const value of sorted) {
      if (value <= target) {
        count++;
      } else {
        break;
      }
    }
    
    return (count / sorted.length) * 100;
  }
  
  /**
   * Calculate moving average
   */
  export function movingAverage(values: number[], window_size: number): number[] {
    const result: number[] = [];
    
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - window_size + 1);
      const window = values.slice(start, i + 1);
      const average = window.reduce((sum, v) => sum + v, 0) / window.length;
      result.push(average);
    }
    
    return result;
  }
  
  /**
   * Calculate standard deviation
   */
  export function standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squared_diffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squared_diffs.reduce((sum, v) => sum + v, 0) / values.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Clamp value between min and max
   */
  export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * Normalize value to 0-1 scale
   */
  export function normalize(value: number, min: number, max: number): number {
    if (max === min) return 0;
    return this.clamp((value - min) / (max - min), 0, 1);
  }
}

/**
 * Export all utility namespaces for easy access
 */
export const GovernorUtils = {
  Budget: BudgetUtils,
  Cost: CostUtils,
  Performance: PerformanceUtils,
  Agent: AgentUtils,
  Time: TimeUtils,
  Validation: ValidationUtils,
  Math: MathUtils
} as const;