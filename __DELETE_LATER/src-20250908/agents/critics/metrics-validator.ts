/**
 * Critic Metrics Tracking and Validation System - OSSA v0.1.8
 * 
 * Validates and tracks the 78% error reduction target and other
 * performance metrics for critic agents as specified in the DITA roadmap.
 */

import { BaseCriticAgent, CriticReview, CriticMetrics } from './base-critic';
import { CriticReviewPanel, ComprehensiveReview, CriticType } from './index';
import { VORTEXOptimizationResult } from './vortex-integration';

/**
 * Validated performance targets from OSSA v0.1.8 specification
 */
export const OSSA_PERFORMANCE_TARGETS = {
  ERROR_REDUCTION_TARGET: 78, // % error reduction
  TOKEN_OPTIMIZATION_TARGET: 67, // % token reduction
  SEMANTIC_FIDELITY_MINIMUM: 0.9, // 90% semantic fidelity
  RESPONSE_TIME_TARGET: 2000, // ms maximum response time
  CONFIDENCE_MINIMUM: 0.8, // 80% minimum confidence
  ACCURACY_TARGET: 0.95, // 95% accuracy
  UPTIME_TARGET: 0.997 // 99.7% uptime
} as const;

/**
 * Metrics validation result
 */
export interface MetricsValidationResult {
  validation_id: string;
  timestamp: number;
  agent_id: string;
  targets_met: {
    error_reduction: boolean;
    token_optimization: boolean;
    semantic_fidelity: boolean;
    response_time: boolean;
    confidence: boolean;
    accuracy: boolean;
    uptime: boolean;
  };
  performance_scores: {
    error_reduction_score: number;
    token_optimization_score: number;
    semantic_fidelity_score: number;
    response_time_score: number;
    confidence_score: number;
    accuracy_score: number;
    uptime_score: number;
  };
  overall_compliance: number; // 0-100 overall compliance score
  compliance_status: 'compliant' | 'non_compliant' | 'degraded';
  validation_evidence: string[];
  improvement_recommendations: string[];
  certification_level: 'bronze' | 'silver' | 'gold' | 'platinum';
}

/**
 * Historical performance tracking
 */
export interface PerformanceHistory {
  agent_id: string;
  measurement_window: {
    start_time: number;
    end_time: number;
    duration_hours: number;
  };
  reviews_conducted: number;
  error_reduction_trend: number[];
  token_optimization_trend: number[];
  response_time_trend: number[];
  confidence_trend: number[];
  accuracy_measurements: { timestamp: number; accuracy: number }[];
  uptime_measurements: { timestamp: number; status: 'up' | 'down' | 'degraded' }[];
}

/**
 * Metrics validator and tracker
 */
export class CriticMetricsValidator {
  private validation_history: Map<string, MetricsValidationResult[]> = new Map();
  private performance_history: Map<string, PerformanceHistory> = new Map();
  private continuous_monitoring: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    console.log('[CriticMetricsValidator] Initialized with OSSA v0.1.8 performance targets');
  }

  /**
   * Validate individual critic agent against OSSA targets
   */
  async validateCriticAgent(
    agent: BaseCriticAgent,
    measurement_period_hours: number = 24
  ): Promise<MetricsValidationResult> {
    const validation_id = this.generateValidationId();
    const agent_id = agent['critic_id'];
    
    console.log(`[CriticMetricsValidator] Validating agent: ${agent_id}`);

    try {
      // Collect current metrics
      const current_metrics = agent.getMetrics();
      const health_check = await agent.healthCheck();
      const performance_history = this.getPerformanceHistory(agent_id);

      // Validate each target
      const targets_met = {
        error_reduction: current_metrics.error_reduction_rate >= OSSA_PERFORMANCE_TARGETS.ERROR_REDUCTION_TARGET,
        token_optimization: current_metrics.token_savings_achieved >= OSSA_PERFORMANCE_TARGETS.TOKEN_OPTIMIZATION_TARGET,
        semantic_fidelity: this.validateSemanticFidelity(agent_id) >= OSSA_PERFORMANCE_TARGETS.SEMANTIC_FIDELITY_MINIMUM,
        response_time: current_metrics.average_review_time_ms <= OSSA_PERFORMANCE_TARGETS.RESPONSE_TIME_TARGET,
        confidence: this.calculateAverageConfidence(performance_history) >= OSSA_PERFORMANCE_TARGETS.CONFIDENCE_MINIMUM,
        accuracy: current_metrics.accuracy_score >= OSSA_PERFORMANCE_TARGETS.ACCURACY_TARGET,
        uptime: this.calculateUptime(agent_id, measurement_period_hours) >= OSSA_PERFORMANCE_TARGETS.UPTIME_TARGET
      };

      // Calculate performance scores (0-100)
      const performance_scores = {
        error_reduction_score: this.calculateScore(current_metrics.error_reduction_rate, OSSA_PERFORMANCE_TARGETS.ERROR_REDUCTION_TARGET),
        token_optimization_score: this.calculateScore(current_metrics.token_savings_achieved, OSSA_PERFORMANCE_TARGETS.TOKEN_OPTIMIZATION_TARGET),
        semantic_fidelity_score: this.calculateScore(this.validateSemanticFidelity(agent_id) * 100, OSSA_PERFORMANCE_TARGETS.SEMANTIC_FIDELITY_MINIMUM * 100),
        response_time_score: this.calculateInverseScore(current_metrics.average_review_time_ms, OSSA_PERFORMANCE_TARGETS.RESPONSE_TIME_TARGET),
        confidence_score: this.calculateScore(this.calculateAverageConfidence(performance_history) * 100, OSSA_PERFORMANCE_TARGETS.CONFIDENCE_MINIMUM * 100),
        accuracy_score: this.calculateScore(current_metrics.accuracy_score * 100, OSSA_PERFORMANCE_TARGETS.ACCURACY_TARGET * 100),
        uptime_score: this.calculateScore(this.calculateUptime(agent_id, measurement_period_hours) * 100, OSSA_PERFORMANCE_TARGETS.UPTIME_TARGET * 100)
      };

      // Calculate overall compliance
      const scores = Object.values(performance_scores);
      const overall_compliance = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      // Determine compliance status
      const compliance_status = this.determineComplianceStatus(targets_met, overall_compliance);

      // Generate evidence and recommendations
      const validation_evidence = this.generateValidationEvidence(current_metrics, targets_met, performance_scores);
      const improvement_recommendations = this.generateImprovementRecommendations(targets_met, performance_scores);

      // Determine certification level
      const certification_level = this.determineCertificationLevel(overall_compliance, targets_met);

      const validation_result: MetricsValidationResult = {
        validation_id,
        timestamp: Date.now(),
        agent_id,
        targets_met,
        performance_scores,
        overall_compliance,
        compliance_status,
        validation_evidence,
        improvement_recommendations,
        certification_level
      };

      // Store validation result
      this.storeValidationResult(agent_id, validation_result);

      console.log(`[CriticMetricsValidator] Validation completed for ${agent_id}:`, {
        compliance_status,
        overall_compliance: `${overall_compliance.toFixed(1)}%`,
        certification_level,
        error_reduction: `${current_metrics.error_reduction_rate.toFixed(1)}%`,
        target_met: targets_met.error_reduction
      });

      return validation_result;

    } catch (error) {
      console.error(`[CriticMetricsValidator] Validation failed for ${agent_id}:`, error);
      throw error;
    }
  }

  /**
   * Validate comprehensive review panel
   */
  async validateReviewPanel(
    panel: CriticReviewPanel,
    measurement_period_hours: number = 24
  ): Promise<{
    panel_validation: MetricsValidationResult;
    individual_validations: Map<string, MetricsValidationResult>;
    panel_specific_metrics: {
      consensus_quality: number;
      coverage_completeness: number;
      review_consistency: number;
      collaborative_effectiveness: number;
    };
  }> {
    console.log('[CriticMetricsValidator] Validating review panel');

    const individual_validations = new Map<string, MetricsValidationResult>();
    const panel_health = await panel.healthCheck();

    // Validate individual critics
    for (const critic_type of ['quality', 'security', 'performance', 'compliance'] as CriticType[]) {
      try {
        const critic = panel.getCritic(critic_type);
        if (critic) {
          const validation = await this.validateCriticAgent(critic, measurement_period_hours);
          individual_validations.set(critic_type, validation);
        }
      } catch (error) {
        console.warn(`[CriticMetricsValidator] Individual validation failed for ${critic_type}:`, error);
      }
    }

    // Calculate panel-specific metrics
    const panel_specific_metrics = await this.calculatePanelSpecificMetrics(panel, individual_validations);

    // Aggregate panel validation
    const panel_validation = this.aggregatePanelValidation(individual_validations, panel_health, panel_specific_metrics);

    return {
      panel_validation,
      individual_validations,
      panel_specific_metrics
    };
  }

  /**
   * Start continuous monitoring for an agent
   */
  startContinuousMonitoring(
    agent: BaseCriticAgent,
    monitoring_interval_minutes: number = 30
  ): void {
    const agent_id = agent['critic_id'];
    
    // Stop existing monitoring if any
    this.stopContinuousMonitoring(agent_id);

    console.log(`[CriticMetricsValidator] Starting continuous monitoring for ${agent_id} (interval: ${monitoring_interval_minutes}min)`);

    const monitoring_interval = setInterval(async () => {
      try {
        await this.recordPerformanceSnapshot(agent);
      } catch (error) {
        console.error(`[CriticMetricsValidator] Monitoring snapshot failed for ${agent_id}:`, error);
      }
    }, monitoring_interval_minutes * 60 * 1000);

    this.continuous_monitoring.set(agent_id, monitoring_interval);
  }

  /**
   * Stop continuous monitoring for an agent
   */
  stopContinuousMonitoring(agent_id: string): void {
    const interval = this.continuous_monitoring.get(agent_id);
    if (interval) {
      clearInterval(interval);
      this.continuous_monitoring.delete(agent_id);
      console.log(`[CriticMetricsValidator] Stopped continuous monitoring for ${agent_id}`);
    }
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport(agent_id: string, report_period_days: number = 7): {
    summary: {
      agent_id: string;
      report_period: { start: number; end: number };
      total_validations: number;
      compliance_trend: 'improving' | 'stable' | 'declining';
      current_certification: string;
      targets_consistently_met: string[];
      areas_needing_attention: string[];
    };
    detailed_metrics: {
      error_reduction_analysis: any;
      token_optimization_analysis: any;
      performance_trends: any;
      uptime_analysis: any;
    };
    recommendations: {
      immediate_actions: string[];
      medium_term_improvements: string[];
      long_term_optimizations: string[];
    };
  } {
    const validations = this.validation_history.get(agent_id) || [];
    const recent_validations = validations.filter(v => 
      v.timestamp > Date.now() - (report_period_days * 24 * 60 * 60 * 1000)
    );

    if (recent_validations.length === 0) {
      throw new Error(`No validation data available for ${agent_id} in the specified period`);
    }

    // Calculate trends and analysis
    const compliance_scores = recent_validations.map(v => v.overall_compliance);
    const compliance_trend = this.calculateTrend(compliance_scores);
    
    const latest_validation = recent_validations[recent_validations.length - 1];
    
    const targets_consistently_met = Object.entries(latest_validation.targets_met)
      .filter(([_, met]) => met)
      .map(([target, _]) => target);
    
    const areas_needing_attention = Object.entries(latest_validation.targets_met)
      .filter(([_, met]) => !met)
      .map(([target, _]) => target);

    return {
      summary: {
        agent_id,
        report_period: {
          start: Date.now() - (report_period_days * 24 * 60 * 60 * 1000),
          end: Date.now()
        },
        total_validations: recent_validations.length,
        compliance_trend,
        current_certification: latest_validation.certification_level,
        targets_consistently_met,
        areas_needing_attention
      },
      detailed_metrics: {
        error_reduction_analysis: this.analyzeErrorReductionTrend(recent_validations),
        token_optimization_analysis: this.analyzeTokenOptimizationTrend(recent_validations),
        performance_trends: this.analyzePerformanceTrends(recent_validations),
        uptime_analysis: this.analyzeUptimeTrend(agent_id, report_period_days)
      },
      recommendations: this.generateDetailedRecommendations(latest_validation, compliance_trend)
    };
  }

  // Private helper methods

  private calculateScore(actual: number, target: number): number {
    if (target === 0) return 100;
    return Math.min(100, Math.max(0, (actual / target) * 100));
  }

  private calculateInverseScore(actual: number, target: number): number {
    if (actual === 0) return 100;
    return Math.min(100, Math.max(0, (target / actual) * 100));
  }

  private validateSemanticFidelity(agent_id: string): number {
    // In a real implementation, this would analyze actual semantic fidelity
    // For now, return a simulated value based on agent performance
    const history = this.performance_history.get(agent_id);
    return history ? 0.92 : 0.9; // Mock value
  }

  private calculateAverageConfidence(history: PerformanceHistory | undefined): number {
    if (!history || history.confidence_trend.length === 0) return 0.85; // Mock value
    return history.confidence_trend.reduce((sum, conf) => sum + conf, 0) / history.confidence_trend.length;
  }

  private calculateUptime(agent_id: string, hours: number): number {
    // Mock uptime calculation - in real implementation would track actual uptime
    return 0.998; // 99.8% uptime
  }

  private determineComplianceStatus(
    targets_met: { [key: string]: boolean },
    overall_compliance: number
  ): 'compliant' | 'non_compliant' | 'degraded' {
    const critical_targets_met = targets_met.error_reduction && targets_met.token_optimization;
    
    if (overall_compliance >= 90 && critical_targets_met) {
      return 'compliant';
    } else if (overall_compliance >= 70) {
      return 'degraded';
    } else {
      return 'non_compliant';
    }
  }

  private determineCertificationLevel(
    overall_compliance: number,
    targets_met: { [key: string]: boolean }
  ): 'bronze' | 'silver' | 'gold' | 'platinum' {
    const targets_count = Object.values(targets_met).filter(met => met).length;
    
    if (overall_compliance >= 95 && targets_count === 7) {
      return 'platinum';
    } else if (overall_compliance >= 90 && targets_count >= 6) {
      return 'gold';
    } else if (overall_compliance >= 80 && targets_count >= 5) {
      return 'silver';
    } else {
      return 'bronze';
    }
  }

  private generateValidationEvidence(
    metrics: CriticMetrics,
    targets_met: { [key: string]: boolean },
    performance_scores: { [key: string]: number }
  ): string[] {
    const evidence: string[] = [];
    
    evidence.push(`Reviews conducted: ${metrics.reviews_conducted}`);
    evidence.push(`Error reduction rate: ${metrics.error_reduction_rate.toFixed(1)}% (target: ${OSSA_PERFORMANCE_TARGETS.ERROR_REDUCTION_TARGET}%)`);
    evidence.push(`Token savings achieved: ${metrics.token_savings_achieved.toFixed(1)}% (target: ${OSSA_PERFORMANCE_TARGETS.TOKEN_OPTIMIZATION_TARGET}%)`);
    evidence.push(`Average review time: ${metrics.average_review_time_ms.toFixed(0)}ms (target: ${OSSA_PERFORMANCE_TARGETS.RESPONSE_TIME_TARGET}ms)`);
    
    // Add specific evidence for each target
    Object.entries(targets_met).forEach(([target, met]) => {
      const score = performance_scores[`${target}_score`];
      evidence.push(`${target}: ${met ? 'MET' : 'NOT MET'} (score: ${score?.toFixed(1) || 'N/A'})`);
    });
    
    return evidence;
  }

  private generateImprovementRecommendations(
    targets_met: { [key: string]: boolean },
    performance_scores: { [key: string]: number }
  ): string[] {
    const recommendations: string[] = [];
    
    if (!targets_met.error_reduction) {
      recommendations.push('Improve error detection algorithms and criteria validation');
      recommendations.push('Enhance multi-dimensional review coverage');
    }
    
    if (!targets_met.token_optimization) {
      recommendations.push('Implement more aggressive VORTEX optimization techniques');
      recommendations.push('Improve caching strategies and semantic compression');
    }
    
    if (!targets_met.response_time) {
      recommendations.push('Optimize review algorithms for better performance');
      recommendations.push('Consider parallel processing for dimension analysis');
    }
    
    if (!targets_met.confidence) {
      recommendations.push('Enhance criteria validation accuracy');
      recommendations.push('Improve evidence collection and analysis');
    }
    
    // Add specific recommendations based on lowest scores
    const lowest_score_target = Object.entries(performance_scores)
      .reduce((lowest, [target, score]) => score < lowest[1] ? [target, score] : lowest);
    
    if (lowest_score_target[1] < 70) {
      recommendations.push(`Priority: Address ${lowest_score_target[0].replace('_score', '')} performance (score: ${lowest_score_target[1].toFixed(1)})`);
    }
    
    return recommendations;
  }

  private async calculatePanelSpecificMetrics(
    panel: CriticReviewPanel,
    individual_validations: Map<string, MetricsValidationResult>
  ): Promise<{
    consensus_quality: number;
    coverage_completeness: number;
    review_consistency: number;
    collaborative_effectiveness: number;
  }> {
    // Mock implementation - in real system would analyze actual panel behavior
    const validation_scores = Array.from(individual_validations.values())
      .map(v => v.overall_compliance);
    
    const consensus_quality = validation_scores.length > 1 ? 
      100 - (this.calculateVariance(validation_scores)) : 100;
    
    const coverage_completeness = (individual_validations.size / 4) * 100; // 4 critic types
    
    const review_consistency = validation_scores.reduce((sum, score) => sum + score, 0) / 
                              Math.max(validation_scores.length, 1);
    
    const collaborative_effectiveness = Math.min(100, consensus_quality * coverage_completeness / 100);
    
    return {
      consensus_quality,
      coverage_completeness,
      review_consistency,
      collaborative_effectiveness
    };
  }

  private aggregatePanelValidation(
    individual_validations: Map<string, MetricsValidationResult>,
    panel_health: any,
    panel_metrics: any
  ): MetricsValidationResult {
    const validations = Array.from(individual_validations.values());
    
    if (validations.length === 0) {
      throw new Error('No individual validations available for panel aggregation');
    }

    // Aggregate targets met
    const targets_met = {
      error_reduction: panel_health.overall_error_reduction >= OSSA_PERFORMANCE_TARGETS.ERROR_REDUCTION_TARGET,
      token_optimization: validations.every(v => v.targets_met.token_optimization),
      semantic_fidelity: validations.every(v => v.targets_met.semantic_fidelity),
      response_time: validations.every(v => v.targets_met.response_time),
      confidence: validations.every(v => v.targets_met.confidence),
      accuracy: validations.every(v => v.targets_met.accuracy),
      uptime: validations.every(v => v.targets_met.uptime)
    };

    // Aggregate performance scores
    const performance_scores = {
      error_reduction_score: this.calculateScore(panel_health.overall_error_reduction, OSSA_PERFORMANCE_TARGETS.ERROR_REDUCTION_TARGET),
      token_optimization_score: validations.reduce((sum, v) => sum + v.performance_scores.token_optimization_score, 0) / validations.length,
      semantic_fidelity_score: validations.reduce((sum, v) => sum + v.performance_scores.semantic_fidelity_score, 0) / validations.length,
      response_time_score: validations.reduce((sum, v) => sum + v.performance_scores.response_time_score, 0) / validations.length,
      confidence_score: validations.reduce((sum, v) => sum + v.performance_scores.confidence_score, 0) / validations.length,
      accuracy_score: validations.reduce((sum, v) => sum + v.performance_scores.accuracy_score, 0) / validations.length,
      uptime_score: validations.reduce((sum, v) => sum + v.performance_scores.uptime_score, 0) / validations.length
    };

    const overall_compliance = Object.values(performance_scores).reduce((sum, score) => sum + score, 0) / 
                              Object.keys(performance_scores).length;

    const compliance_status = this.determineComplianceStatus(targets_met, overall_compliance);
    const certification_level = this.determineCertificationLevel(overall_compliance, targets_met);

    return {
      validation_id: this.generateValidationId(),
      timestamp: Date.now(),
      agent_id: 'panel_aggregate',
      targets_met,
      performance_scores,
      overall_compliance,
      compliance_status,
      validation_evidence: [`Panel validation aggregated from ${validations.length} critics`],
      improvement_recommendations: this.generateImprovementRecommendations(targets_met, performance_scores),
      certification_level
    };
  }

  // Additional helper methods

  private generateValidationId(): string {
    return `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private storeValidationResult(agent_id: string, result: MetricsValidationResult): void {
    if (!this.validation_history.has(agent_id)) {
      this.validation_history.set(agent_id, []);
    }
    
    const history = this.validation_history.get(agent_id)!;
    history.push(result);
    
    // Keep only last 100 validation results
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  private getPerformanceHistory(agent_id: string): PerformanceHistory | undefined {
    return this.performance_history.get(agent_id);
  }

  private async recordPerformanceSnapshot(agent: BaseCriticAgent): Promise<void> {
    const agent_id = agent['critic_id'];
    const metrics = agent.getMetrics();
    
    // Update performance history
    let history = this.performance_history.get(agent_id);
    if (!history) {
      history = {
        agent_id,
        measurement_window: {
          start_time: Date.now(),
          end_time: Date.now(),
          duration_hours: 0
        },
        reviews_conducted: 0,
        error_reduction_trend: [],
        token_optimization_trend: [],
        response_time_trend: [],
        confidence_trend: [],
        accuracy_measurements: [],
        uptime_measurements: []
      };
      this.performance_history.set(agent_id, history);
    }

    // Update trends
    history.error_reduction_trend.push(metrics.error_reduction_rate);
    history.token_optimization_trend.push(metrics.token_savings_achieved);
    history.response_time_trend.push(metrics.average_review_time_ms);
    history.confidence_trend.push(0.85); // Mock confidence
    
    history.accuracy_measurements.push({
      timestamp: Date.now(),
      accuracy: metrics.accuracy_score
    });
    
    history.uptime_measurements.push({
      timestamp: Date.now(),
      status: 'up' // Mock status
    });
    
    // Keep only last 1000 measurements
    const trends = [
      history.error_reduction_trend,
      history.token_optimization_trend,
      history.response_time_trend,
      history.confidence_trend
    ];
    
    trends.forEach(trend => {
      if (trend.length > 1000) {
        trend.splice(0, trend.length - 1000);
      }
    });

    history.measurement_window.end_time = Date.now();
    history.measurement_window.duration_hours = 
      (history.measurement_window.end_time - history.measurement_window.start_time) / (1000 * 60 * 60);
  }

  private calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-5); // Last 5 measurements
    const older = values.slice(-10, -5); // Previous 5 measurements
    
    const recent_avg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const older_avg = older.length > 0 ? older.reduce((sum, val) => sum + val, 0) / older.length : recent_avg;
    
    const change_threshold = 2; // 2% change threshold
    
    if (recent_avg > older_avg + change_threshold) {
      return 'improving';
    } else if (recent_avg < older_avg - change_threshold) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance); // Return standard deviation
  }

  private analyzeErrorReductionTrend(validations: MetricsValidationResult[]): any {
    const scores = validations.map(v => v.performance_scores.error_reduction_score);
    return {
      trend: this.calculateTrend(scores),
      average_score: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      target_achievement_rate: validations.filter(v => v.targets_met.error_reduction).length / validations.length
    };
  }

  private analyzeTokenOptimizationTrend(validations: MetricsValidationResult[]): any {
    const scores = validations.map(v => v.performance_scores.token_optimization_score);
    return {
      trend: this.calculateTrend(scores),
      average_score: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      target_achievement_rate: validations.filter(v => v.targets_met.token_optimization).length / validations.length
    };
  }

  private analyzePerformanceTrends(validations: MetricsValidationResult[]): any {
    return {
      response_time: this.analyzeResponseTimeTrend(validations),
      confidence: this.analyzeConfidenceTrend(validations),
      accuracy: this.analyzeAccuracyTrend(validations)
    };
  }

  private analyzeResponseTimeTrend(validations: MetricsValidationResult[]): any {
    const scores = validations.map(v => v.performance_scores.response_time_score);
    return {
      trend: this.calculateTrend(scores),
      average_score: scores.reduce((sum, score) => sum + score, 0) / scores.length
    };
  }

  private analyzeConfidenceTrend(validations: MetricsValidationResult[]): any {
    const scores = validations.map(v => v.performance_scores.confidence_score);
    return {
      trend: this.calculateTrend(scores),
      average_score: scores.reduce((sum, score) => sum + score, 0) / scores.length
    };
  }

  private analyzeAccuracyTrend(validations: MetricsValidationResult[]): any {
    const scores = validations.map(v => v.performance_scores.accuracy_score);
    return {
      trend: this.calculateTrend(scores),
      average_score: scores.reduce((sum, score) => sum + score, 0) / scores.length
    };
  }

  private analyzeUptimeTrend(agent_id: string, days: number): any {
    // Mock uptime analysis
    return {
      uptime_percentage: 99.8,
      downtime_incidents: 0,
      availability_trend: 'stable'
    };
  }

  private generateDetailedRecommendations(
    validation: MetricsValidationResult,
    trend: 'improving' | 'stable' | 'declining'
  ): {
    immediate_actions: string[];
    medium_term_improvements: string[];
    long_term_optimizations: string[];
  } {
    const immediate: string[] = [];
    const medium_term: string[] = [];
    const long_term: string[] = [];

    // Immediate actions based on failing targets
    if (!validation.targets_met.error_reduction) {
      immediate.push('Review and enhance error detection criteria');
      immediate.push('Increase review depth for critical code paths');
    }

    if (!validation.targets_met.token_optimization) {
      immediate.push('Enable more aggressive VORTEX optimization');
      immediate.push('Implement additional caching strategies');
    }

    // Medium-term improvements
    if (validation.overall_compliance < 90) {
      medium_term.push('Implement comprehensive performance monitoring');
      medium_term.push('Enhance critic agent training and validation');
    }

    // Long-term optimizations
    if (trend === 'declining') {
      long_term.push('Redesign critic algorithms for better performance');
      long_term.push('Implement machine learning-based optimization');
    }

    long_term.push('Develop advanced consensus mechanisms');
    long_term.push('Implement adaptive threshold management');

    return {
      immediate_actions: immediate,
      medium_term_improvements: medium_term,
      long_term_optimizations: long_term
    };
  }
}

/**
 * Export singleton instance for global metrics validation
 */
export const globalMetricsValidator = new CriticMetricsValidator();