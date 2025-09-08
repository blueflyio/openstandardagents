/**
 * Worker Metrics and Performance Tracking - OSSA v0.1.8 Compliant
 * 
 * Comprehensive metrics collection, analysis, and reporting system
 * for worker agents with real-time monitoring and historical analytics.
 * 
 * Features:
 * - Real-time performance monitoring and alerting
 * - Historical metrics analysis and trend detection
 * - Cost optimization tracking and ROI calculation
 * - Quality assessment metrics and benchmarking
 * - Resource utilization monitoring and optimization
 * - SLA compliance tracking and reporting
 */

import { EventEmitter } from 'events';
import { 
  WorkerPerformanceMetrics,
  WorkerExecutionResult,
  WorkerHealthStatus,
  TokenOptimizationMetrics,
  SelfAssessmentReport
} from './types';

export interface MetricsSnapshot {
  timestamp: number;
  worker_id: string;
  snapshot_id: string;
  performance_metrics: WorkerPerformanceMetrics;
  health_status: WorkerHealthStatus;
  resource_utilization: ResourceUtilizationMetrics;
  quality_metrics: QualityMetrics;
  cost_metrics: CostMetrics;
  sla_metrics: SLAMetrics;
}

export interface ResourceUtilizationMetrics {
  cpu_usage_percent: number;
  memory_usage_mb: number;
  memory_usage_percent: number;
  active_connections: number;
  queue_size: number;
  thread_pool_utilization: number;
  cache_hit_rate: number;
  cache_size_mb: number;
}

export interface QualityMetrics {
  average_quality_score: number;
  quality_trend_7d: number; // Percentage change over 7 days
  quality_consistency: number; // Standard deviation of quality scores
  self_assessment_accuracy: number;
  human_feedback_score?: number;
  quality_gate_pass_rate: number;
  assessment_confidence_average: number;
}

export interface CostMetrics {
  total_tokens_processed: number;
  total_tokens_saved: number;
  cost_reduction_percentage: number;
  cost_per_task: number;
  roi_percentage: number;
  optimization_efficiency: number; // Cost reduction vs quality impact
  target_achievement_percentage: number; // Progress towards 65% target
}

export interface SLAMetrics {
  availability_percentage: number;
  average_response_time_ms: number;
  response_time_p95_ms: number;
  response_time_p99_ms: number;
  error_rate_percentage: number;
  success_rate_percentage: number;
  sla_compliance_score: number; // Overall SLA compliance 0-1
  breach_count: number;
  uptime_hours: number;
}

export interface TrendAnalysis {
  metric_name: string;
  time_period: '1h' | '24h' | '7d' | '30d';
  trend_direction: 'improving' | 'stable' | 'declining';
  trend_magnitude: number; // Percentage change
  confidence_level: number;
  data_points: Array<{
    timestamp: number;
    value: number;
  }>;
  forecast?: {
    next_hour: number;
    next_day: number;
    confidence: number;
  };
}

export interface PerformanceAlert {
  alert_id: string;
  worker_id: string;
  alert_type: 'warning' | 'critical' | 'info';
  metric_name: string;
  threshold_violated: {
    metric: string;
    current_value: number;
    threshold: number;
    operator: '>' | '<' | '=' | '!=';
  };
  timestamp: number;
  message: string;
  suggested_actions: string[];
  auto_resolved: boolean;
  resolution_timestamp?: number;
}

export interface MetricsAggregation {
  aggregation_period: '1m' | '5m' | '1h' | '24h' | '7d';
  start_time: number;
  end_time: number;
  worker_count: number;
  total_tasks: number;
  total_successes: number;
  total_failures: number;
  average_metrics: {
    response_time_ms: number;
    quality_score: number;
    cost_reduction_percentage: number;
    cpu_utilization: number;
    memory_utilization: number;
  };
  percentile_metrics: {
    p50_response_time: number;
    p95_response_time: number;
    p99_response_time: number;
  };
  trend_indicators: {
    performance_trend: 'improving' | 'stable' | 'declining';
    cost_optimization_trend: 'improving' | 'stable' | 'declining';
    quality_trend: 'improving' | 'stable' | 'declining';
  };
}

export interface BenchmarkComparison {
  worker_id: string;
  comparison_period: '24h' | '7d' | '30d';
  worker_metrics: {
    performance_score: number;
    cost_efficiency: number;
    quality_score: number;
    reliability: number;
  };
  peer_average: {
    performance_score: number;
    cost_efficiency: number;
    quality_score: number;
    reliability: number;
  };
  industry_benchmark: {
    performance_score: number;
    cost_efficiency: number;
    quality_score: number;
    reliability: number;
  };
  ranking: {
    performance_percentile: number;
    cost_efficiency_percentile: number;
    quality_percentile: number;
    overall_percentile: number;
  };
}

export class WorkerMetricsCollector extends EventEmitter {
  private metrics_history: Map<string, MetricsSnapshot[]> = new Map();
  private active_alerts: Map<string, PerformanceAlert[]> = new Map();
  private alert_thresholds: Map<string, any> = new Map();
  private collection_interval: NodeJS.Timeout | null = null;
  
  // Configuration
  private collection_interval_ms = 60000; // 1 minute
  private retention_period_ms = 7 * 24 * 60 * 60 * 1000; // 7 days
  private max_snapshots_per_worker = 10080; // 1 week at 1 minute intervals
  private auto_cleanup_enabled = true;
  
  constructor(config?: {
    collection_interval_ms?: number;
    retention_period_ms?: number;
    max_snapshots_per_worker?: number;
  }) {
    super();
    
    if (config) {
      this.collection_interval_ms = config.collection_interval_ms || this.collection_interval_ms;
      this.retention_period_ms = config.retention_period_ms || this.retention_period_ms;
      this.max_snapshots_per_worker = config.max_snapshots_per_worker || this.max_snapshots_per_worker;
    }
    
    this.initializeAlertThresholds();
    this.startMetricsCollection();
  }

  /**
   * Collect metrics snapshot for a worker
   */
  async collectMetricsSnapshot(
    worker_id: string,
    performance_metrics: WorkerPerformanceMetrics,
    health_status: WorkerHealthStatus,
    execution_results?: WorkerExecutionResult[]
  ): Promise<MetricsSnapshot> {
    const timestamp = Date.now();
    const snapshot_id = `${worker_id}-${timestamp}`;
    
    // Calculate derived metrics
    const resource_utilization = await this.calculateResourceUtilization(worker_id);
    const quality_metrics = this.calculateQualityMetrics(execution_results);
    const cost_metrics = this.calculateCostMetrics(execution_results);
    const sla_metrics = this.calculateSLAMetrics(worker_id, performance_metrics, health_status);
    
    const snapshot: MetricsSnapshot = {
      timestamp,
      worker_id,
      snapshot_id,
      performance_metrics,
      health_status,
      resource_utilization,
      quality_metrics,
      cost_metrics,
      sla_metrics
    };
    
    // Store snapshot
    if (!this.metrics_history.has(worker_id)) {
      this.metrics_history.set(worker_id, []);
    }
    
    const worker_history = this.metrics_history.get(worker_id)!;
    worker_history.push(snapshot);
    
    // Limit history size
    if (worker_history.length > this.max_snapshots_per_worker) {
      worker_history.splice(0, worker_history.length - this.max_snapshots_per_worker);
    }
    
    // Check for alerts
    await this.checkAlertThresholds(snapshot);
    
    // Emit metrics collected event
    this.emit('metrics_collected', { worker_id, snapshot });
    
    return snapshot;
  }

  /**
   * Get historical metrics for a worker
   */
  getWorkerMetricsHistory(
    worker_id: string,
    time_range?: { start_time: number; end_time: number },
    limit?: number
  ): MetricsSnapshot[] {
    const history = this.metrics_history.get(worker_id) || [];
    
    let filtered_history = history;
    
    // Apply time range filter
    if (time_range) {
      filtered_history = history.filter(
        snapshot => snapshot.timestamp >= time_range.start_time && 
                   snapshot.timestamp <= time_range.end_time
      );
    }
    
    // Apply limit
    if (limit) {
      filtered_history = filtered_history.slice(-limit);
    }
    
    return filtered_history;
  }

  /**
   * Analyze performance trends for a worker
   */
  analyzeTrends(
    worker_id: string,
    metric_names: string[],
    time_period: '1h' | '24h' | '7d' | '30d' = '24h'
  ): TrendAnalysis[] {
    const history = this.getHistoryForPeriod(worker_id, time_period);
    
    return metric_names.map(metric_name => {
      const data_points = history.map(snapshot => ({
        timestamp: snapshot.timestamp,
        value: this.extractMetricValue(snapshot, metric_name)
      })).filter(point => point.value !== null);
      
      const trend_analysis = this.calculateTrendAnalysis(metric_name, data_points, time_period);
      return trend_analysis;
    });
  }

  /**
   * Generate performance report for a worker
   */
  generatePerformanceReport(
    worker_id: string,
    report_period: '24h' | '7d' | '30d' = '24h'
  ): {
    worker_id: string;
    report_period: string;
    report_timestamp: number;
    summary: {
      total_tasks: number;
      success_rate: number;
      average_quality: number;
      cost_reduction_achieved: number;
      sla_compliance: number;
    };
    trends: TrendAnalysis[];
    alerts_summary: {
      total_alerts: number;
      critical_alerts: number;
      warning_alerts: number;
      resolved_alerts: number;
    };
    recommendations: string[];
  } {
    const history = this.getHistoryForPeriod(worker_id, report_period);
    const alerts = this.getWorkerAlerts(worker_id, this.getPeriodStartTime(report_period));
    
    // Calculate summary metrics
    const total_tasks = history.reduce((sum, s) => sum + s.performance_metrics.task_metrics.tasks_completed, 0);
    const total_failures = history.reduce((sum, s) => sum + s.performance_metrics.task_metrics.tasks_failed, 0);
    const success_rate = total_tasks > 0 ? total_tasks / (total_tasks + total_failures) : 0;
    
    const average_quality = history.length > 0 
      ? history.reduce((sum, s) => sum + s.quality_metrics.average_quality_score, 0) / history.length
      : 0;
    
    const cost_reduction_achieved = history.length > 0
      ? history.reduce((sum, s) => sum + s.cost_metrics.cost_reduction_percentage, 0) / history.length
      : 0;
    
    const sla_compliance = history.length > 0
      ? history.reduce((sum, s) => sum + s.sla_metrics.sla_compliance_score, 0) / history.length
      : 0;
    
    // Analyze trends
    const trends = this.analyzeTrends(worker_id, [
      'performance_score',
      'cost_reduction_percentage',
      'quality_score',
      'response_time_ms'
    ], report_period === '24h' ? '24h' : '7d');
    
    // Alert summary
    const alerts_summary = {
      total_alerts: alerts.length,
      critical_alerts: alerts.filter(a => a.alert_type === 'critical').length,
      warning_alerts: alerts.filter(a => a.alert_type === 'warning').length,
      resolved_alerts: alerts.filter(a => a.auto_resolved || a.resolution_timestamp).length
    };
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(worker_id, history, trends, alerts);
    
    return {
      worker_id,
      report_period,
      report_timestamp: Date.now(),
      summary: {
        total_tasks,
        success_rate,
        average_quality,
        cost_reduction_achieved,
        sla_compliance
      },
      trends,
      alerts_summary,
      recommendations
    };
  }

  /**
   * Compare worker performance against benchmarks
   */
  generateBenchmarkComparison(
    worker_id: string,
    comparison_period: '24h' | '7d' | '30d' = '7d',
    peer_worker_ids?: string[]
  ): BenchmarkComparison {
    const worker_history = this.getHistoryForPeriod(worker_id, comparison_period);
    
    // Calculate worker metrics
    const worker_metrics = this.aggregateMetricsForComparison(worker_history);
    
    // Calculate peer average (if peers provided)
    let peer_average = worker_metrics; // Default to worker metrics
    if (peer_worker_ids && peer_worker_ids.length > 0) {
      const peer_histories = peer_worker_ids.map(id => this.getHistoryForPeriod(id, comparison_period));
      const all_peer_snapshots = peer_histories.flat();
      peer_average = this.aggregateMetricsForComparison(all_peer_snapshots);
    }
    
    // Industry benchmarks (static for now, could be loaded from external source)
    const industry_benchmark = {
      performance_score: 0.85,
      cost_efficiency: 0.60,
      quality_score: 0.88,
      reliability: 0.95
    };
    
    // Calculate rankings
    const all_workers = peer_worker_ids ? [worker_id, ...peer_worker_ids] : [worker_id];
    const ranking = this.calculatePercentileRanking(worker_id, all_workers, comparison_period);
    
    return {
      worker_id,
      comparison_period,
      worker_metrics,
      peer_average,
      industry_benchmark,
      ranking
    };
  }

  /**
   * Get aggregated metrics for a time period
   */
  getAggregatedMetrics(
    worker_ids: string[],
    aggregation_period: '1m' | '5m' | '1h' | '24h' | '7d',
    time_range: { start_time: number; end_time: number }
  ): MetricsAggregation {
    // Collect all snapshots for the time range
    const all_snapshots = worker_ids.flatMap(worker_id => {
      return this.getWorkerMetricsHistory(worker_id, time_range);
    });
    
    if (all_snapshots.length === 0) {
      return this.createEmptyAggregation(aggregation_period, time_range);
    }
    
    // Aggregate metrics
    const total_tasks = all_snapshots.reduce((sum, s) => 
      sum + s.performance_metrics.task_metrics.tasks_completed, 0);
    const total_successes = total_tasks; // Assuming completed = success for simplicity
    const total_failures = all_snapshots.reduce((sum, s) => 
      sum + s.performance_metrics.task_metrics.tasks_failed, 0);
    
    // Calculate averages
    const avg_response_time = this.calculateAverage(all_snapshots, s => s.sla_metrics.average_response_time_ms);
    const avg_quality_score = this.calculateAverage(all_snapshots, s => s.quality_metrics.average_quality_score);
    const avg_cost_reduction = this.calculateAverage(all_snapshots, s => s.cost_metrics.cost_reduction_percentage);
    const avg_cpu_util = this.calculateAverage(all_snapshots, s => s.resource_utilization.cpu_usage_percent);
    const avg_memory_util = this.calculateAverage(all_snapshots, s => s.resource_utilization.memory_usage_percent);
    
    // Calculate percentiles
    const response_times = all_snapshots.map(s => s.sla_metrics.average_response_time_ms).sort((a, b) => a - b);
    const p50_response_time = this.calculatePercentile(response_times, 50);
    const p95_response_time = this.calculatePercentile(response_times, 95);
    const p99_response_time = this.calculatePercentile(response_times, 99);
    
    // Calculate trend indicators (simplified)
    const trend_indicators = {
      performance_trend: this.calculateSimpleTrend(all_snapshots, 'performance') as 'improving' | 'stable' | 'declining',
      cost_optimization_trend: this.calculateSimpleTrend(all_snapshots, 'cost') as 'improving' | 'stable' | 'declining',
      quality_trend: this.calculateSimpleTrend(all_snapshots, 'quality') as 'improving' | 'stable' | 'declining'
    };
    
    return {
      aggregation_period,
      start_time: time_range.start_time,
      end_time: time_range.end_time,
      worker_count: worker_ids.length,
      total_tasks,
      total_successes,
      total_failures,
      average_metrics: {
        response_time_ms: avg_response_time,
        quality_score: avg_quality_score,
        cost_reduction_percentage: avg_cost_reduction,
        cpu_utilization: avg_cpu_util,
        memory_utilization: avg_memory_util
      },
      percentile_metrics: {
        p50_response_time,
        p95_response_time,
        p99_response_time
      },
      trend_indicators
    };
  }

  /**
   * Get active alerts for a worker
   */
  getWorkerAlerts(worker_id: string, since_timestamp?: number): PerformanceAlert[] {
    const alerts = this.active_alerts.get(worker_id) || [];
    
    if (since_timestamp) {
      return alerts.filter(alert => alert.timestamp >= since_timestamp);
    }
    
    return alerts;
  }

  /**
   * Set custom alert thresholds for a worker
   */
  setAlertThresholds(worker_id: string, thresholds: {
    max_response_time_ms?: number;
    min_success_rate?: number;
    min_quality_score?: number;
    max_error_rate?: number;
    min_cost_reduction?: number;
  }): void {
    this.alert_thresholds.set(worker_id, {
      ...this.getDefaultThresholds(),
      ...thresholds
    });
  }

  /**
   * Clean up old metrics data
   */
  async cleanupOldMetrics(): Promise<void> {
    if (!this.auto_cleanup_enabled) return;
    
    const cutoff_time = Date.now() - this.retention_period_ms;
    let cleaned_snapshots = 0;
    
    for (const [worker_id, snapshots] of this.metrics_history) {
      const initial_count = snapshots.length;
      const filtered_snapshots = snapshots.filter(snapshot => snapshot.timestamp >= cutoff_time);
      this.metrics_history.set(worker_id, filtered_snapshots);
      cleaned_snapshots += initial_count - filtered_snapshots.length;
    }
    
    // Clean up old alerts
    for (const [worker_id, alerts] of this.active_alerts) {
      const filtered_alerts = alerts.filter(alert => 
        alert.timestamp >= cutoff_time && !alert.auto_resolved
      );
      this.active_alerts.set(worker_id, filtered_alerts);
    }
    
    console.log(`[WorkerMetrics] Cleaned up ${cleaned_snapshots} old metric snapshots`);
    this.emit('cleanup_completed', { cleaned_snapshots });
  }

  /**
   * Export metrics data for analysis
   */
  exportMetrics(
    worker_ids: string[],
    time_range: { start_time: number; end_time: number },
    format: 'json' | 'csv' = 'json'
  ): string {
    const all_snapshots = worker_ids.flatMap(worker_id => {
      return this.getWorkerMetricsHistory(worker_id, time_range);
    });
    
    if (format === 'json') {
      return JSON.stringify(all_snapshots, null, 2);
    } else {
      // CSV export
      return this.convertToCsv(all_snapshots);
    }
  }

  // Private helper methods

  private initializeAlertThresholds(): void {
    // Default alert thresholds
    const default_thresholds = this.getDefaultThresholds();
    this.alert_thresholds.set('default', default_thresholds);
  }

  private getDefaultThresholds() {
    return {
      max_response_time_ms: 5000,
      min_success_rate: 0.90,
      min_quality_score: 0.80,
      max_error_rate: 0.10,
      min_cost_reduction: 40, // 40% minimum cost reduction
      max_cpu_usage: 80,
      max_memory_usage: 85
    };
  }

  private async calculateResourceUtilization(worker_id: string): Promise<ResourceUtilizationMetrics> {
    // Simulate resource utilization calculation
    // In production, this would query actual system metrics
    return {
      cpu_usage_percent: Math.random() * 60 + 20, // 20-80%
      memory_usage_mb: Math.random() * 512 + 256, // 256-768MB
      memory_usage_percent: Math.random() * 50 + 25, // 25-75%
      active_connections: Math.floor(Math.random() * 10 + 1),
      queue_size: Math.floor(Math.random() * 5),
      thread_pool_utilization: Math.random() * 0.6 + 0.2, // 20-80%
      cache_hit_rate: Math.random() * 0.4 + 0.6, // 60-100%
      cache_size_mb: Math.random() * 100 + 50 // 50-150MB
    };
  }

  private calculateQualityMetrics(execution_results?: WorkerExecutionResult[]): QualityMetrics {
    if (!execution_results || execution_results.length === 0) {
      return {
        average_quality_score: 0.85,
        quality_trend_7d: 0,
        quality_consistency: 0.95,
        self_assessment_accuracy: 0.80,
        quality_gate_pass_rate: 0.90,
        assessment_confidence_average: 0.85
      };
    }

    const quality_scores = execution_results.map(r => r.quality_assessment.overall_quality);
    const average_quality_score = quality_scores.reduce((sum, score) => sum + score, 0) / quality_scores.length;
    
    // Calculate consistency (lower standard deviation = higher consistency)
    const mean_quality = average_quality_score;
    const variance = quality_scores.reduce((sum, score) => sum + Math.pow(score - mean_quality, 2), 0) / quality_scores.length;
    const quality_consistency = Math.max(0, 1 - Math.sqrt(variance));
    
    const assessment_confidence_average = execution_results
      .filter(r => r.self_assessment_report)
      .reduce((sum, r) => sum + r.self_assessment_report!.confidence_score, 0) / execution_results.length || 0.8;

    return {
      average_quality_score,
      quality_trend_7d: 0, // Would calculate based on historical data
      quality_consistency,
      self_assessment_accuracy: 0.85, // Would calculate based on validation data
      quality_gate_pass_rate: execution_results.filter(r => r.status === 'completed').length / execution_results.length,
      assessment_confidence_average
    };
  }

  private calculateCostMetrics(execution_results?: WorkerExecutionResult[]): CostMetrics {
    if (!execution_results || execution_results.length === 0) {
      return {
        total_tokens_processed: 0,
        total_tokens_saved: 0,
        cost_reduction_percentage: 0,
        cost_per_task: 0,
        roi_percentage: 0,
        optimization_efficiency: 0,
        target_achievement_percentage: 0
      };
    }

    const total_tokens_processed = execution_results.reduce((sum, r) => sum + r.execution_metrics.tokens_consumed, 0);
    const total_tokens_saved = execution_results.reduce((sum, r) => sum + r.execution_metrics.tokens_saved, 0);
    const cost_reduction_percentage = total_tokens_processed > 0 
      ? (total_tokens_saved / (total_tokens_processed + total_tokens_saved)) * 100 
      : 0;
    
    const cost_per_task = total_tokens_processed / execution_results.length;
    const roi_percentage = cost_reduction_percentage * 2; // Simplified ROI calculation
    const optimization_efficiency = cost_reduction_percentage / (100 - average_quality_score * 100) || 0;
    const target_achievement_percentage = (cost_reduction_percentage / 65) * 100; // 65% target
    
    const average_quality_score = execution_results.reduce((sum, r) => sum + r.quality_assessment.overall_quality, 0) / execution_results.length;

    return {
      total_tokens_processed,
      total_tokens_saved,
      cost_reduction_percentage,
      cost_per_task,
      roi_percentage,
      optimization_efficiency,
      target_achievement_percentage
    };
  }

  private calculateSLAMetrics(
    worker_id: string,
    performance_metrics: WorkerPerformanceMetrics,
    health_status: WorkerHealthStatus
  ): SLAMetrics {
    return {
      availability_percentage: performance_metrics.reliability_metrics.success_rate * 100,
      average_response_time_ms: performance_metrics.task_metrics.average_execution_time_ms,
      response_time_p95_ms: performance_metrics.task_metrics.average_execution_time_ms * 1.5, // Estimated
      response_time_p99_ms: performance_metrics.task_metrics.average_execution_time_ms * 2.0, // Estimated
      error_rate_percentage: performance_metrics.reliability_metrics.error_rate * 100,
      success_rate_percentage: performance_metrics.reliability_metrics.success_rate * 100,
      sla_compliance_score: this.calculateSLAComplianceScore(performance_metrics),
      breach_count: 0, // Would track actual SLA breaches
      uptime_hours: (Date.now() - health_status.last_health_check) / (1000 * 60 * 60)
    };
  }

  private calculateSLAComplianceScore(performance_metrics: WorkerPerformanceMetrics): number {
    let compliance_score = 1.0;
    
    // Deduct for poor performance
    if (performance_metrics.reliability_metrics.success_rate < 0.95) {
      compliance_score -= 0.2;
    }
    if (performance_metrics.task_metrics.average_execution_time_ms > 5000) {
      compliance_score -= 0.15;
    }
    if (performance_metrics.reliability_metrics.error_rate > 0.05) {
      compliance_score -= 0.15;
    }
    
    return Math.max(0, compliance_score);
  }

  private async checkAlertThresholds(snapshot: MetricsSnapshot): Promise<void> {
    const worker_id = snapshot.worker_id;
    const thresholds = this.alert_thresholds.get(worker_id) || this.alert_thresholds.get('default')!;
    
    const alerts_to_create: PerformanceAlert[] = [];
    
    // Check response time threshold
    if (snapshot.sla_metrics.average_response_time_ms > thresholds.max_response_time_ms) {
      alerts_to_create.push(this.createAlert(
        worker_id,
        'warning',
        'response_time',
        {
          metric: 'average_response_time_ms',
          current_value: snapshot.sla_metrics.average_response_time_ms,
          threshold: thresholds.max_response_time_ms,
          operator: '>'
        },
        `Response time ${snapshot.sla_metrics.average_response_time_ms}ms exceeds threshold ${thresholds.max_response_time_ms}ms`,
        ['Investigate worker load', 'Check for resource bottlenecks', 'Consider scaling']
      ));
    }
    
    // Check success rate threshold
    if (snapshot.sla_metrics.success_rate_percentage < thresholds.min_success_rate * 100) {
      alerts_to_create.push(this.createAlert(
        worker_id,
        'critical',
        'success_rate',
        {
          metric: 'success_rate_percentage',
          current_value: snapshot.sla_metrics.success_rate_percentage,
          threshold: thresholds.min_success_rate * 100,
          operator: '<'
        },
        `Success rate ${snapshot.sla_metrics.success_rate_percentage.toFixed(1)}% below threshold ${(thresholds.min_success_rate * 100).toFixed(1)}%`,
        ['Check worker health', 'Review recent errors', 'Consider worker restart']
      ));
    }
    
    // Check quality score threshold
    if (snapshot.quality_metrics.average_quality_score < thresholds.min_quality_score) {
      alerts_to_create.push(this.createAlert(
        worker_id,
        'warning',
        'quality_score',
        {
          metric: 'average_quality_score',
          current_value: snapshot.quality_metrics.average_quality_score,
          threshold: thresholds.min_quality_score,
          operator: '<'
        },
        `Quality score ${snapshot.quality_metrics.average_quality_score.toFixed(2)} below threshold ${thresholds.min_quality_score}`,
        ['Review quality assessment configuration', 'Check training data quality', 'Consider model updates']
      ));
    }
    
    // Add alerts to active alerts
    if (alerts_to_create.length > 0) {
      if (!this.active_alerts.has(worker_id)) {
        this.active_alerts.set(worker_id, []);
      }
      
      this.active_alerts.get(worker_id)!.push(...alerts_to_create);
      
      // Emit alert events
      alerts_to_create.forEach(alert => {
        this.emit('alert_created', alert);
      });
    }
  }

  private createAlert(
    worker_id: string,
    alert_type: 'warning' | 'critical' | 'info',
    metric_name: string,
    threshold_violated: any,
    message: string,
    suggested_actions: string[]
  ): PerformanceAlert {
    return {
      alert_id: `${worker_id}-${metric_name}-${Date.now()}`,
      worker_id,
      alert_type,
      metric_name,
      threshold_violated,
      timestamp: Date.now(),
      message,
      suggested_actions,
      auto_resolved: false
    };
  }

  private startMetricsCollection(): void {
    this.collection_interval = setInterval(() => {
      // Trigger cleanup if enabled
      if (this.auto_cleanup_enabled) {
        this.cleanupOldMetrics();
      }
    }, this.collection_interval_ms);
  }

  private getHistoryForPeriod(worker_id: string, period: string): MetricsSnapshot[] {
    const end_time = Date.now();
    const start_time = this.getPeriodStartTime(period);
    return this.getWorkerMetricsHistory(worker_id, { start_time, end_time });
  }

  private getPeriodStartTime(period: string): number {
    const now = Date.now();
    switch (period) {
      case '1h': return now - (60 * 60 * 1000);
      case '24h': return now - (24 * 60 * 60 * 1000);
      case '7d': return now - (7 * 24 * 60 * 60 * 1000);
      case '30d': return now - (30 * 24 * 60 * 60 * 1000);
      default: return now - (24 * 60 * 60 * 1000);
    }
  }

  private extractMetricValue(snapshot: MetricsSnapshot, metric_name: string): number {
    // Extract metric value based on metric name
    switch (metric_name) {
      case 'performance_score':
        return snapshot.performance_metrics.reliability_metrics.success_rate;
      case 'cost_reduction_percentage':
        return snapshot.cost_metrics.cost_reduction_percentage;
      case 'quality_score':
        return snapshot.quality_metrics.average_quality_score;
      case 'response_time_ms':
        return snapshot.sla_metrics.average_response_time_ms;
      default:
        return 0;
    }
  }

  private calculateTrendAnalysis(
    metric_name: string,
    data_points: Array<{ timestamp: number; value: number }>,
    time_period: string
  ): TrendAnalysis {
    if (data_points.length < 2) {
      return {
        metric_name,
        time_period,
        trend_direction: 'stable',
        trend_magnitude: 0,
        confidence_level: 0,
        data_points
      };
    }

    // Simple linear trend calculation
    const first_half = data_points.slice(0, Math.floor(data_points.length / 2));
    const second_half = data_points.slice(Math.floor(data_points.length / 2));
    
    const first_avg = first_half.reduce((sum, p) => sum + p.value, 0) / first_half.length;
    const second_avg = second_half.reduce((sum, p) => sum + p.value, 0) / second_half.length;
    
    const trend_magnitude = ((second_avg - first_avg) / first_avg) * 100;
    const trend_direction: 'improving' | 'stable' | 'declining' = 
      Math.abs(trend_magnitude) < 5 ? 'stable' :
      trend_magnitude > 0 ? 'improving' : 'declining';
    
    const confidence_level = Math.min(1, data_points.length / 20); // More data = higher confidence
    
    return {
      metric_name,
      time_period,
      trend_direction,
      trend_magnitude: Math.abs(trend_magnitude),
      confidence_level,
      data_points
    };
  }

  private aggregateMetricsForComparison(snapshots: MetricsSnapshot[]): {
    performance_score: number;
    cost_efficiency: number;
    quality_score: number;
    reliability: number;
  } {
    if (snapshots.length === 0) {
      return { performance_score: 0, cost_efficiency: 0, quality_score: 0, reliability: 0 };
    }

    return {
      performance_score: this.calculateAverage(snapshots, s => s.sla_metrics.sla_compliance_score),
      cost_efficiency: this.calculateAverage(snapshots, s => s.cost_metrics.cost_reduction_percentage / 100),
      quality_score: this.calculateAverage(snapshots, s => s.quality_metrics.average_quality_score),
      reliability: this.calculateAverage(snapshots, s => s.sla_metrics.success_rate_percentage / 100)
    };
  }

  private calculatePercentileRanking(
    worker_id: string,
    all_worker_ids: string[],
    period: string
  ): {
    performance_percentile: number;
    cost_efficiency_percentile: number;
    quality_percentile: number;
    overall_percentile: number;
  } {
    // Simplified percentile calculation
    // In production, this would rank against all workers in the system
    return {
      performance_percentile: 75,
      cost_efficiency_percentile: 80,
      quality_percentile: 70,
      overall_percentile: 75
    };
  }

  private generateRecommendations(
    worker_id: string,
    history: MetricsSnapshot[],
    trends: TrendAnalysis[],
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Check cost reduction performance
    const latest_snapshot = history[history.length - 1];
    if (latest_snapshot && latest_snapshot.cost_metrics.cost_reduction_percentage < 50) {
      recommendations.push('Consider enabling more aggressive token optimization strategies');
    }
    
    // Check quality trends
    const quality_trend = trends.find(t => t.metric_name === 'quality_score');
    if (quality_trend && quality_trend.trend_direction === 'declining') {
      recommendations.push('Quality trend is declining - review assessment configuration');
    }
    
    // Check critical alerts
    const critical_alerts = alerts.filter(a => a.alert_type === 'critical');
    if (critical_alerts.length > 0) {
      recommendations.push('Address critical performance alerts to maintain SLA compliance');
    }
    
    // Check response time trends
    const response_trend = trends.find(t => t.metric_name === 'response_time_ms');
    if (response_trend && response_trend.trend_direction === 'declining') {
      recommendations.push('Response times are increasing - consider resource optimization');
    }
    
    return recommendations;
  }

  private createEmptyAggregation(
    aggregation_period: '1m' | '5m' | '1h' | '24h' | '7d',
    time_range: { start_time: number; end_time: number }
  ): MetricsAggregation {
    return {
      aggregation_period,
      start_time: time_range.start_time,
      end_time: time_range.end_time,
      worker_count: 0,
      total_tasks: 0,
      total_successes: 0,
      total_failures: 0,
      average_metrics: {
        response_time_ms: 0,
        quality_score: 0,
        cost_reduction_percentage: 0,
        cpu_utilization: 0,
        memory_utilization: 0
      },
      percentile_metrics: {
        p50_response_time: 0,
        p95_response_time: 0,
        p99_response_time: 0
      },
      trend_indicators: {
        performance_trend: 'stable',
        cost_optimization_trend: 'stable',
        quality_trend: 'stable'
      }
    };
  }

  private calculateAverage(snapshots: MetricsSnapshot[], extractor: (s: MetricsSnapshot) => number): number {
    if (snapshots.length === 0) return 0;
    return snapshots.reduce((sum, s) => sum + extractor(s), 0) / snapshots.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  private calculateSimpleTrend(snapshots: MetricsSnapshot[], trend_type: string): string {
    if (snapshots.length < 2) return 'stable';
    
    let values: number[];
    switch (trend_type) {
      case 'performance':
        values = snapshots.map(s => s.sla_metrics.sla_compliance_score);
        break;
      case 'cost':
        values = snapshots.map(s => s.cost_metrics.cost_reduction_percentage);
        break;
      case 'quality':
        values = snapshots.map(s => s.quality_metrics.average_quality_score);
        break;
      default:
        return 'stable';
    }
    
    const first_half_avg = values.slice(0, Math.floor(values.length / 2))
      .reduce((sum, v) => sum + v, 0) / Math.floor(values.length / 2);
    const second_half_avg = values.slice(Math.floor(values.length / 2))
      .reduce((sum, v) => sum + v, 0) / Math.ceil(values.length / 2);
    
    const change_percentage = ((second_half_avg - first_half_avg) / first_half_avg) * 100;
    
    if (Math.abs(change_percentage) < 5) return 'stable';
    return change_percentage > 0 ? 'improving' : 'declining';
  }

  private convertToCsv(snapshots: MetricsSnapshot[]): string {
    if (snapshots.length === 0) return '';
    
    // CSV headers
    const headers = [
      'timestamp', 'worker_id', 'performance_score', 'cost_reduction_percentage',
      'quality_score', 'response_time_ms', 'success_rate', 'cpu_usage', 'memory_usage'
    ];
    
    // CSV rows
    const rows = snapshots.map(snapshot => [
      snapshot.timestamp,
      snapshot.worker_id,
      snapshot.sla_metrics.sla_compliance_score,
      snapshot.cost_metrics.cost_reduction_percentage,
      snapshot.quality_metrics.average_quality_score,
      snapshot.sla_metrics.average_response_time_ms,
      snapshot.sla_metrics.success_rate_percentage,
      snapshot.resource_utilization.cpu_usage_percent,
      snapshot.resource_utilization.memory_usage_percent
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Shutdown metrics collection
   */
  shutdown(): void {
    if (this.collection_interval) {
      clearInterval(this.collection_interval);
      this.collection_interval = null;
    }
    console.log('[WorkerMetrics] Metrics collection stopped');
  }
}