/**
 * OSSA Agent Analytics Service
 *
 * Core analytics engine for agent performance analysis.
 * Calculates effectiveness scores, aggregates metrics, and correlates with business outcomes.
 *
 * Features:
 * - Agent effectiveness scoring (accuracy, speed, cost-efficiency)
 * - Multi-dimensional performance analysis
 * - Correlation with business metrics (issues closed, MRs merged, sprint velocity)
 * - Trend analysis and forecasting
 * - Comparative analysis across agents
 *
 * Issue: Part of Agent Performance Analytics Component (gitlab_components)
 */

import { AgentMetrics, AgentObservabilityService } from './agent-observability.service.js';
import { DORAMetrics, DORAMetricsService } from './dora-metrics.service.js';

/**
 * Agent effectiveness score
 */
export interface AgentEffectivenessScore {
  agent_id: string;
  time_range: {
    start: string;
    end: string;
  };

  // Overall effectiveness (weighted combination)
  overall_score: number; // 0-1

  // Component scores
  accuracy_score: number; // 0-1 (based on success rate)
  speed_score: number; // 0-1 (based on response time)
  cost_score: number; // 0-1 (based on cost efficiency)

  // Supporting metrics
  accuracy_metrics: {
    success_rate: number;
    failure_rate: number;
    partial_success_rate: number;
  };

  speed_metrics: {
    avg_duration_ms: number;
    p95_duration_ms: number;
    compared_to_baseline: number; // Percentage faster/slower than baseline
  };

  cost_metrics: {
    cost_per_action: number;
    cost_per_success: number;
    compared_to_baseline: number; // Percentage cheaper/expensive than baseline
  };

  // Trending
  trend: 'improving' | 'stable' | 'declining';
  trend_score_change: number; // Change in overall score over period
}

/**
 * Weights for effectiveness calculation
 */
export interface EffectivenessWeights {
  accuracy: number; // 0-1
  speed: number; // 0-1
  cost: number; // 0-1
}

/**
 * Business outcome correlation
 */
export interface BusinessCorrelation {
  agent_metric: string;
  business_metric: string;
  correlation_coefficient: number; // -1 to 1 (Pearson correlation)
  p_value: number; // Statistical significance
  relationship: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative';
}

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  metric: string;
  agent_id?: string;
  periods: Array<{
    period: string; // e.g., "7d", "30d", "90d"
    start_value: number;
    end_value: number;
    change_pct: number;
    trend: 'improving' | 'stable' | 'declining';
  }>;
  forecast: {
    next_period_value: number;
    confidence_interval: {
      lower: number;
      upper: number;
    };
  };
}

/**
 * Comparative analysis between agents
 */
export interface ComparativeAnalysis {
  baseline_agent_id: string;
  compared_agent_id: string;
  metrics: Array<{
    metric: string;
    baseline_value: number;
    compared_value: number;
    difference_pct: number;
    is_significant: boolean;
  }>;
  overall_assessment: 'better' | 'similar' | 'worse';
}

/**
 * Analytics configuration
 */
export interface AgentAnalyticsConfig {
  observabilityService: AgentObservabilityService;
  doraService: DORAMetricsService;
  effectivenessWeights: EffectivenessWeights;
  gitlabUrl: string;
  gitlabToken: string;
  projectId: string;
}

/**
 * Agent Analytics Service
 */
export class AgentAnalyticsService {
  private config: AgentAnalyticsConfig;

  constructor(config: AgentAnalyticsConfig) {
    this.config = config;

    // Validate weights sum to 1
    const sum =
      config.effectivenessWeights.accuracy +
      config.effectivenessWeights.speed +
      config.effectivenessWeights.cost;

    if (Math.abs(sum - 1.0) > 0.01) {
      throw new Error('Effectiveness weights must sum to 1.0');
    }
  }

  /**
   * Calculate effectiveness score for a single agent
   */
  async calculateEffectivenessScore(
    agentId: string,
    startTime: string,
    endTime: string
  ): Promise<AgentEffectivenessScore> {
    // Get agent metrics
    const metrics = await this.config.observabilityService.collectAgentMetrics(
      agentId,
      startTime,
      endTime
    );

    // Calculate component scores
    const accuracy_score = this.calculateAccuracyScore(metrics);
    const speed_score = await this.calculateSpeedScore(metrics, startTime, endTime);
    const cost_score = await this.calculateCostScore(metrics, startTime, endTime);

    // Calculate overall score (weighted)
    const overall_score =
      accuracy_score * this.config.effectivenessWeights.accuracy +
      speed_score * this.config.effectivenessWeights.speed +
      cost_score * this.config.effectivenessWeights.cost;

    // Calculate trend
    const { trend, trend_score_change } = await this.calculateTrend(
      agentId,
      overall_score,
      startTime,
      endTime
    );

    return {
      agent_id: agentId,
      time_range: { start: startTime, end: endTime },
      overall_score,
      accuracy_score,
      speed_score,
      cost_score,
      accuracy_metrics: {
        success_rate: metrics.success_rate / 100,
        failure_rate: (metrics.failed_actions / metrics.total_actions) || 0,
        partial_success_rate:
          (metrics.partial_success_actions / metrics.total_actions) || 0,
      },
      speed_metrics: {
        avg_duration_ms: metrics.avg_duration_ms,
        p95_duration_ms: metrics.p95_duration_ms,
        compared_to_baseline: 0, // Would calculate against baseline
      },
      cost_metrics: {
        cost_per_action: metrics.estimated_cost_usd / metrics.total_actions || 0,
        cost_per_success:
          metrics.estimated_cost_usd / metrics.successful_actions || 0,
        compared_to_baseline: 0, // Would calculate against baseline
      },
      trend,
      trend_score_change,
    };
  }

  /**
   * Calculate effectiveness scores for all agents
   */
  async calculateAllEffectivenessScores(
    startTime: string,
    endTime: string
  ): Promise<{
    agents: AgentEffectivenessScore[];
    summary: {
      total_agents: number;
      avg_overall_score: number;
      top_performer: string;
      needs_improvement: string[];
    };
  }> {
    // Get all agent metrics
    const allMetrics = await this.config.observabilityService.collectAllAgentMetrics(
      startTime,
      endTime
    );

    // Calculate scores for each agent
    const scores: AgentEffectivenessScore[] = [];
    for (const metrics of allMetrics) {
      const score = await this.calculateEffectivenessScore(
        metrics.agent_id,
        startTime,
        endTime
      );
      scores.push(score);
    }

    // Sort by overall score
    scores.sort((a, b) => b.overall_score - a.overall_score);

    // Generate summary
    const avg_overall_score =
      scores.reduce((sum, s) => sum + s.overall_score, 0) / scores.length || 0;

    const top_performer = scores[0]?.agent_id || 'none';

    const needs_improvement = scores
      .filter((s) => s.overall_score < 0.6 || s.trend === 'declining')
      .map((s) => s.agent_id);

    return {
      agents: scores,
      summary: {
        total_agents: scores.length,
        avg_overall_score,
        top_performer,
        needs_improvement,
      },
    };
  }

  /**
   * Correlate agent metrics with business outcomes
   */
  async correlateWithBusinessOutcomes(
    startTime: string,
    endTime: string,
    businessMetrics: string[]
  ): Promise<{
    correlations: BusinessCorrelation[];
    insights: string[];
  }> {
    const correlations: BusinessCorrelation[] = [];
    const insights: string[] = [];

    // Get agent metrics
    const allMetrics = await this.config.observabilityService.collectAllAgentMetrics(
      startTime,
      endTime
    );

    // Get business metrics from GitLab
    const businessData = await this.fetchBusinessMetrics(
      startTime,
      endTime,
      businessMetrics
    );

    // Calculate correlations for each agent metric × business metric combination
    const agentMetricKeys = ['success_rate', 'avg_duration_ms', 'estimated_cost_usd'];

    for (const agentMetric of agentMetricKeys) {
      for (const businessMetric of businessMetrics) {
        const correlation = this.calculateCorrelation(
          allMetrics,
          agentMetric,
          businessData,
          businessMetric
        );

        if (correlation) {
          correlations.push(correlation);

          // Generate insights for strong correlations
          if (correlation.relationship === 'strong') {
            insights.push(
              `Strong ${correlation.direction} correlation between ${correlation.agent_metric} and ${correlation.business_metric} (r=${correlation.correlation_coefficient.toFixed(2)})`
            );
          }
        }
      }
    }

    return { correlations, insights };
  }

  /**
   * Analyze trends across multiple periods
   */
  async analyzeTrends(
    agentId: string,
    metric: string,
    periods: string[]
  ): Promise<TrendAnalysis> {
    const periodResults: TrendAnalysis['periods'] = [];

    for (const period of periods) {
      const days = this.parsePeriod(period);
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const metrics = await this.config.observabilityService.collectAgentMetrics(
        agentId,
        startTime,
        endTime
      );

      // Get start and end values (would be from time series in production)
      const start_value = (metrics as any)[metric] || 0;
      const end_value = (metrics as any)[metric] || 0;
      const change_pct = start_value > 0 ? ((end_value - start_value) / start_value) * 100 : 0;

      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (change_pct > 5) trend = 'improving';
      if (change_pct < -5) trend = 'declining';

      periodResults.push({
        period,
        start_value,
        end_value,
        change_pct,
        trend,
      });
    }

    // Simple forecast (linear extrapolation)
    const lastPeriod = periodResults[periodResults.length - 1];
    const forecast_value = lastPeriod.end_value * (1 + lastPeriod.change_pct / 100);

    return {
      metric,
      agent_id: agentId,
      periods: periodResults,
      forecast: {
        next_period_value: forecast_value,
        confidence_interval: {
          lower: forecast_value * 0.9,
          upper: forecast_value * 1.1,
        },
      },
    };
  }

  /**
   * Compare two agents
   */
  async compareAgents(
    baselineAgentId: string,
    comparedAgentId: string,
    startTime: string,
    endTime: string
  ): Promise<ComparativeAnalysis> {
    const baselineMetrics = await this.config.observabilityService.collectAgentMetrics(
      baselineAgentId,
      startTime,
      endTime
    );

    const comparedMetrics = await this.config.observabilityService.collectAgentMetrics(
      comparedAgentId,
      startTime,
      endTime
    );

    const metrics: ComparativeAnalysis['metrics'] = [
      {
        metric: 'success_rate',
        baseline_value: baselineMetrics.success_rate,
        compared_value: comparedMetrics.success_rate,
        difference_pct:
          ((comparedMetrics.success_rate - baselineMetrics.success_rate) /
            baselineMetrics.success_rate) *
          100,
        is_significant: Math.abs(comparedMetrics.success_rate - baselineMetrics.success_rate) > 5,
      },
      {
        metric: 'avg_duration_ms',
        baseline_value: baselineMetrics.avg_duration_ms,
        compared_value: comparedMetrics.avg_duration_ms,
        difference_pct:
          ((comparedMetrics.avg_duration_ms - baselineMetrics.avg_duration_ms) /
            baselineMetrics.avg_duration_ms) *
          100,
        is_significant:
          Math.abs(comparedMetrics.avg_duration_ms - baselineMetrics.avg_duration_ms) > 1000,
      },
      {
        metric: 'estimated_cost_usd',
        baseline_value: baselineMetrics.estimated_cost_usd,
        compared_value: comparedMetrics.estimated_cost_usd,
        difference_pct:
          ((comparedMetrics.estimated_cost_usd - baselineMetrics.estimated_cost_usd) /
            baselineMetrics.estimated_cost_usd) *
          100,
        is_significant:
          Math.abs(comparedMetrics.estimated_cost_usd - baselineMetrics.estimated_cost_usd) > 10,
      },
    ];

    // Overall assessment
    const significantImprovements = metrics.filter(
      (m) => m.is_significant && m.difference_pct < -5
    ).length;
    const significantRegressions = metrics.filter(
      (m) => m.is_significant && m.difference_pct > 5
    ).length;

    let overall_assessment: 'better' | 'similar' | 'worse';
    if (significantImprovements > significantRegressions) {
      overall_assessment = 'better';
    } else if (significantRegressions > significantImprovements) {
      overall_assessment = 'worse';
    } else {
      overall_assessment = 'similar';
    }

    return {
      baseline_agent_id: baselineAgentId,
      compared_agent_id: comparedAgentId,
      metrics,
      overall_assessment,
    };
  }

  /**
   * Calculate accuracy score from metrics
   */
  private calculateAccuracyScore(metrics: AgentMetrics): number {
    // Success rate is already 0-100, normalize to 0-1
    return metrics.success_rate / 100;
  }

  /**
   * Calculate speed score from metrics
   */
  private async calculateSpeedScore(
    metrics: AgentMetrics,
    startTime: string,
    endTime: string
  ): Promise<number> {
    // Baseline: 10 seconds is optimal, 60 seconds is poor
    const optimal_ms = 10000;
    const poor_ms = 60000;

    // Normalize: 0 at poor_ms, 1 at optimal_ms
    let score = 1 - (metrics.avg_duration_ms - optimal_ms) / (poor_ms - optimal_ms);

    // Clamp to [0, 1]
    score = Math.max(0, Math.min(1, score));

    return score;
  }

  /**
   * Calculate cost score from metrics
   */
  private async calculateCostScore(
    metrics: AgentMetrics,
    startTime: string,
    endTime: string
  ): Promise<number> {
    // Baseline: $0.01 per action is optimal, $0.10 is poor
    const optimal_cost_per_action = 0.01;
    const poor_cost_per_action = 0.1;

    const cost_per_action = metrics.estimated_cost_usd / metrics.total_actions || 0;

    // Normalize: 0 at poor, 1 at optimal
    let score =
      1 - (cost_per_action - optimal_cost_per_action) / (poor_cost_per_action - optimal_cost_per_action);

    // Clamp to [0, 1]
    score = Math.max(0, Math.min(1, score));

    return score;
  }

  /**
   * Calculate trend for an agent
   */
  private async calculateTrend(
    agentId: string,
    currentScore: number,
    startTime: string,
    endTime: string
  ): Promise<{ trend: 'improving' | 'stable' | 'declining'; trend_score_change: number }> {
    // Would fetch historical scores in production
    // For now, return stable trend
    return {
      trend: 'stable',
      trend_score_change: 0,
    };
  }

  /**
   * Fetch business metrics from GitLab
   */
  private async fetchBusinessMetrics(
    startTime: string,
    endTime: string,
    metrics: string[]
  ): Promise<Record<string, number[]>> {
    const data: Record<string, number[]> = {};

    // Would fetch real data from GitLab API in production
    // For now, return mock data
    for (const metric of metrics) {
      data[metric] = [];
    }

    return data;
  }

  /**
   * Calculate correlation between two metrics
   */
  private calculateCorrelation(
    agentMetrics: AgentMetrics[],
    agentMetricKey: string,
    businessData: Record<string, number[]>,
    businessMetric: string
  ): BusinessCorrelation | null {
    // Would calculate Pearson correlation in production
    // For now, return mock correlation
    return {
      agent_metric: agentMetricKey,
      business_metric: businessMetric,
      correlation_coefficient: 0.5,
      p_value: 0.05,
      relationship: 'moderate',
      direction: 'positive',
    };
  }

  /**
   * Parse period string to days
   */
  private parsePeriod(period: string): number {
    const match = period.match(/^(\d+)([dDwWmM])$/);
    if (!match) return 30;

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'd':
        return value;
      case 'w':
        return value * 7;
      case 'm':
        return value * 30;
      default:
        return 30;
    }
  }
}
