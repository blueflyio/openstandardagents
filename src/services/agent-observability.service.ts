/**
 * OSSA Agent Observability Service
 *
 * Real-time agent metrics, cost tracking, and GitLab-native observability.
 * Wraps the audit-logger for agent-specific metrics collection.
 *
 * Features:
 * - Real-time agent action tracking via audit-logger
 * - Export metrics to GitLab Audit Events API
 * - Cost tracking per agent (token usage × pricing)
 * - Dashboard using GLQL queries
 * - Alert system for anomalies (high cost, repeated failures, slowness)
 *
 * Issue: Part of Agent Observability Component (gitlab_components)
 */

import { randomUUID } from 'crypto';
import {
  AuditEvent,
  AuditQuery,
  AuditQueryResult,
  AuditCategory,
  AuditSeverity,
  AuditOutcome,
} from '../types/audit-logging.js';
import { AuditLoggerService } from './audit-logger.service.js';

/**
 * Agent metrics aggregated over a time period
 */
export interface AgentMetrics {
  agent_id: string;
  time_range: {
    start: string;
    end: string;
  };

  // Execution metrics
  total_actions: number;
  successful_actions: number;
  failed_actions: number;
  partial_success_actions: number;
  success_rate: number; // Percentage

  // Performance metrics
  avg_duration_ms: number;
  p50_duration_ms: number;
  p95_duration_ms: number;
  p99_duration_ms: number;
  min_duration_ms: number;
  max_duration_ms: number;

  // Failure tracking
  consecutive_failures: number;
  last_failure_timestamp?: string;
  last_failure_reason?: string;

  // Cost tracking (if tokens_used available)
  total_tokens_used: number;
  total_input_tokens: number;
  total_output_tokens: number;
  estimated_cost_usd: number;
  daily_cost_usd: number;
  monthly_cost_usd: number;

  // Action breakdown
  actions_by_type: Record<string, number>;
  slowest_actions: Array<{
    action: string;
    duration_ms: number;
    timestamp: string;
  }>;

  // Anomalies
  anomalies: Array<{
    type: 'high_failure_rate' | 'slow_performance' | 'high_cost' | 'unusual_pattern';
    description: string;
    severity: AuditSeverity;
    detected_at: string;
  }>;
}

/**
 * Cost calculation configuration
 */
export interface CostConfig {
  input_token_cost_per_1k: number; // USD per 1K input tokens
  output_token_cost_per_1k: number; // USD per 1K output tokens
}

/**
 * Agent cost summary
 */
export interface AgentCostSummary {
  agent_id: string;
  period: {
    start: string;
    end: string;
    days: number;
  };

  // Token usage
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;

  // Costs
  input_cost_usd: number;
  output_cost_usd: number;
  total_cost_usd: number;
  daily_average_usd: number;
  monthly_projection_usd: number;

  // Cost breakdown by action
  cost_by_action: Array<{
    action: string;
    tokens: number;
    cost_usd: number;
    percentage: number;
  }>;

  // Optimization suggestions
  optimizations: Array<{
    type: 'reduce_token_usage' | 'use_cheaper_model' | 'batch_operations';
    description: string;
    estimated_savings_usd: number;
  }>;
}

/**
 * Observability configuration
 */
export interface ObservabilityConfig {
  auditLogger: AuditLoggerService;
  costConfig?: CostConfig;
  alertThresholds?: {
    failure_rate: number; // 0-1
    consecutive_failures: number;
    slow_threshold_ms: number;
    cost_threshold_usd_per_month: number;
  };
}

/**
 * Agent Observability Service
 */
export class AgentObservabilityService {
  private auditLogger: AuditLoggerService;
  private costConfig: CostConfig;
  private alertThresholds: Required<ObservabilityConfig>['alertThresholds'];

  constructor(config: ObservabilityConfig) {
    this.auditLogger = config.auditLogger;

    // Default: Claude Sonnet 4.5 pricing
    this.costConfig = config.costConfig || {
      input_token_cost_per_1k: 0.015, // $0.015 per 1K input tokens
      output_token_cost_per_1k: 0.075, // $0.075 per 1K output tokens
    };

    this.alertThresholds = config.alertThresholds || {
      failure_rate: 0.2, // Alert if >20% failure rate
      consecutive_failures: 5, // Alert after 5 consecutive failures
      slow_threshold_ms: 30000, // Alert if avg duration >30s
      cost_threshold_usd_per_month: 100, // Alert if monthly cost >$100
    };
  }

  /**
   * Collect metrics for a specific agent over a time range
   */
  async collectAgentMetrics(
    agentId: string,
    startTime: string,
    endTime: string
  ): Promise<AgentMetrics> {
    // Query audit logs for this agent
    const query: AuditQuery = {
      start_time: startTime,
      end_time: endTime,
      agent_id: agentId,
      category: AuditCategory.AGENT_ACTION,
    };

    const result: AuditQueryResult = await this.auditLogger.query(query);

    // Calculate metrics from events
    return this.calculateMetrics(agentId, result.events, startTime, endTime);
  }

  /**
   * Collect metrics for all agents
   */
  async collectAllAgentMetrics(
    startTime: string,
    endTime: string
  ): Promise<AgentMetrics[]> {
    // Query all agent actions
    const query: AuditQuery = {
      start_time: startTime,
      end_time: endTime,
      category: AuditCategory.AGENT_ACTION,
    };

    const result: AuditQueryResult = await this.auditLogger.query(query);

    // Group events by agent
    const eventsByAgent = new Map<string, AuditEvent[]>();
    for (const event of result.events) {
      if (!eventsByAgent.has(event.agent_id)) {
        eventsByAgent.set(event.agent_id, []);
      }
      eventsByAgent.get(event.agent_id)!.push(event);
    }

    // Calculate metrics for each agent
    const allMetrics: AgentMetrics[] = [];
    for (const [agentId, events] of eventsByAgent.entries()) {
      const metrics = this.calculateMetrics(agentId, events, startTime, endTime);
      allMetrics.push(metrics);
    }

    return allMetrics;
  }

  /**
   * Calculate agent metrics from audit events
   */
  private calculateMetrics(
    agentId: string,
    events: AuditEvent[],
    startTime: string,
    endTime: string
  ): AgentMetrics {
    // Execution metrics
    const total_actions = events.length;
    const successful_actions = events.filter(
      (e) => e.outcome === AuditOutcome.SUCCESS
    ).length;
    const failed_actions = events.filter((e) => e.outcome === AuditOutcome.FAILURE).length;
    const partial_success_actions = events.filter(
      (e) => e.outcome === AuditOutcome.PARTIAL_SUCCESS
    ).length;
    const success_rate = total_actions > 0 ? (successful_actions / total_actions) * 100 : 0;

    // Performance metrics
    const durations = events.map((e) => e.duration_ms).sort((a, b) => a - b);
    const avg_duration_ms = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const p50_duration_ms = this.percentile(durations, 0.5);
    const p95_duration_ms = this.percentile(durations, 0.95);
    const p99_duration_ms = this.percentile(durations, 0.99);
    const min_duration_ms = durations[0] || 0;
    const max_duration_ms = durations[durations.length - 1] || 0;

    // Failure tracking
    const consecutive_failures = this.countConsecutiveFailures(events);
    const lastFailure = events
      .filter((e) => e.outcome === AuditOutcome.FAILURE)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    // Cost tracking
    const tokensUsed = events.map((e) => e.metadata?.tokens_used || 0);
    const total_tokens_used = tokensUsed.reduce((a, b) => a + b, 0);

    // Estimate input/output split (assume 70/30 split if not specified)
    const total_input_tokens = Math.floor(total_tokens_used * 0.7);
    const total_output_tokens = Math.floor(total_tokens_used * 0.3);

    const input_cost = (total_input_tokens / 1000) * this.costConfig.input_token_cost_per_1k;
    const output_cost = (total_output_tokens / 1000) * this.costConfig.output_token_cost_per_1k;
    const estimated_cost_usd = input_cost + output_cost;

    const timePeriodDays = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60 * 24);
    const daily_cost_usd = timePeriodDays > 0 ? estimated_cost_usd / timePeriodDays : 0;
    const monthly_cost_usd = daily_cost_usd * 30;

    // Action breakdown
    const actions_by_type: Record<string, number> = {};
    for (const event of events) {
      actions_by_type[event.action] = (actions_by_type[event.action] || 0) + 1;
    }

    // Slowest actions
    const slowest_actions = events
      .sort((a, b) => b.duration_ms - a.duration_ms)
      .slice(0, 10)
      .map((e) => ({
        action: e.action,
        duration_ms: e.duration_ms,
        timestamp: e.timestamp,
      }));

    // Detect anomalies
    const anomalies = this.detectAnomalies({
      success_rate,
      consecutive_failures,
      avg_duration_ms,
      monthly_cost_usd,
    });

    return {
      agent_id: agentId,
      time_range: { start: startTime, end: endTime },
      total_actions,
      successful_actions,
      failed_actions,
      partial_success_actions,
      success_rate,
      avg_duration_ms,
      p50_duration_ms,
      p95_duration_ms,
      p99_duration_ms,
      min_duration_ms,
      max_duration_ms,
      consecutive_failures,
      last_failure_timestamp: lastFailure?.timestamp,
      last_failure_reason: lastFailure?.error?.message,
      total_tokens_used,
      total_input_tokens,
      total_output_tokens,
      estimated_cost_usd,
      daily_cost_usd,
      monthly_cost_usd,
      actions_by_type,
      slowest_actions,
      anomalies,
    };
  }

  /**
   * Calculate agent costs over a time period
   */
  async calculateAgentCosts(
    agentId: string,
    startTime: string,
    endTime: string
  ): Promise<AgentCostSummary> {
    const metrics = await this.collectAgentMetrics(agentId, startTime, endTime);

    const timePeriodDays =
      (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60 * 24);

    // Cost breakdown by action
    const query: AuditQuery = {
      start_time: startTime,
      end_time: endTime,
      agent_id: agentId,
      category: AuditCategory.AGENT_ACTION,
    };

    const result = await this.auditLogger.query(query);

    const costByAction: Record<string, { tokens: number; cost: number }> = {};
    for (const event of result.events) {
      const tokens = event.metadata?.tokens_used || 0;
      const input = Math.floor(tokens * 0.7);
      const output = Math.floor(tokens * 0.3);
      const cost =
        (input / 1000) * this.costConfig.input_token_cost_per_1k +
        (output / 1000) * this.costConfig.output_token_cost_per_1k;

      if (!costByAction[event.action]) {
        costByAction[event.action] = { tokens: 0, cost: 0 };
      }
      costByAction[event.action].tokens += tokens;
      costByAction[event.action].cost += cost;
    }

    const cost_by_action = Object.entries(costByAction)
      .map(([action, data]) => ({
        action,
        tokens: data.tokens,
        cost_usd: data.cost,
        percentage: (data.cost / metrics.estimated_cost_usd) * 100,
      }))
      .sort((a, b) => b.cost_usd - a.cost_usd);

    // Generate optimization suggestions
    const optimizations = this.generateOptimizations(metrics, cost_by_action);

    return {
      agent_id: agentId,
      period: {
        start: startTime,
        end: endTime,
        days: timePeriodDays,
      },
      total_tokens: metrics.total_tokens_used,
      input_tokens: metrics.total_input_tokens,
      output_tokens: metrics.total_output_tokens,
      input_cost_usd:
        (metrics.total_input_tokens / 1000) * this.costConfig.input_token_cost_per_1k,
      output_cost_usd:
        (metrics.total_output_tokens / 1000) * this.costConfig.output_token_cost_per_1k,
      total_cost_usd: metrics.estimated_cost_usd,
      daily_average_usd: metrics.daily_cost_usd,
      monthly_projection_usd: metrics.monthly_cost_usd,
      cost_by_action,
      optimizations,
    };
  }

  /**
   * Export metrics to GitLab Audit Events API
   */
  async exportToGitLabAuditEvents(
    metrics: AgentMetrics,
    gitlabUrl: string,
    gitlabToken: string,
    projectId: string
  ): Promise<void> {
    // GitLab Audit Events API endpoint
    const endpoint = `${gitlabUrl}/api/v4/projects/${projectId}/audit_events`;

    // Create audit event for these metrics
    const auditEvent = {
      author_id: -1, // System
      entity_id: projectId,
      entity_type: 'Project',
      details: {
        custom_message: `Agent Observability Metrics: ${metrics.agent_id}`,
        agent_metrics: metrics,
      },
    };

    // Send to GitLab
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': gitlabToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(auditEvent),
    });

    if (!response.ok) {
      throw new Error(`Failed to export to GitLab Audit Events: ${response.statusText}`);
    }
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Count consecutive failures at the end of events
   */
  private countConsecutiveFailures(events: AuditEvent[]): number {
    const sorted = events.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let count = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].outcome === AuditOutcome.FAILURE) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * Detect anomalies based on thresholds
   */
  private detectAnomalies(data: {
    success_rate: number;
    consecutive_failures: number;
    avg_duration_ms: number;
    monthly_cost_usd: number;
  }): Array<{
    type: 'high_failure_rate' | 'slow_performance' | 'high_cost' | 'unusual_pattern';
    description: string;
    severity: AuditSeverity;
    detected_at: string;
  }> {
    const anomalies: ReturnType<AgentObservabilityService['detectAnomalies']> = [];
    const now = new Date().toISOString();

    // High failure rate
    if (data.success_rate < (1 - this.alertThresholds.failure_rate) * 100) {
      anomalies.push({
        type: 'high_failure_rate',
        description: `Success rate ${data.success_rate.toFixed(1)}% is below threshold`,
        severity: AuditSeverity.ERROR,
        detected_at: now,
      });
    }

    // Consecutive failures
    if (data.consecutive_failures >= this.alertThresholds.consecutive_failures) {
      anomalies.push({
        type: 'high_failure_rate',
        description: `${data.consecutive_failures} consecutive failures detected`,
        severity: AuditSeverity.CRITICAL,
        detected_at: now,
      });
    }

    // Slow performance
    if (data.avg_duration_ms >= this.alertThresholds.slow_threshold_ms) {
      anomalies.push({
        type: 'slow_performance',
        description: `Average duration ${data.avg_duration_ms}ms exceeds threshold`,
        severity: AuditSeverity.WARN,
        detected_at: now,
      });
    }

    // High cost
    if (data.monthly_cost_usd >= this.alertThresholds.cost_threshold_usd_per_month) {
      anomalies.push({
        type: 'high_cost',
        description: `Monthly cost $${data.monthly_cost_usd.toFixed(2)} exceeds threshold`,
        severity: AuditSeverity.WARN,
        detected_at: now,
      });
    }

    return anomalies;
  }

  /**
   * Generate cost optimization suggestions
   */
  private generateOptimizations(
    metrics: AgentMetrics,
    costByAction: AgentCostSummary['cost_by_action']
  ): AgentCostSummary['optimizations'] {
    const optimizations: AgentCostSummary['optimizations'] = [];

    // High token usage on specific actions
    const topAction = costByAction[0];
    if (topAction && topAction.percentage > 50) {
      optimizations.push({
        type: 'reduce_token_usage',
        description: `Action '${topAction.action}' accounts for ${topAction.percentage.toFixed(1)}% of costs. Consider optimizing prompts or reducing context.`,
        estimated_savings_usd: topAction.cost_usd * 0.3, // 30% potential savings
      });
    }

    // High total cost
    if (metrics.monthly_cost_usd > 50) {
      optimizations.push({
        type: 'use_cheaper_model',
        description: `Monthly cost of $${metrics.monthly_cost_usd.toFixed(2)} is high. Consider using Claude Haiku for simpler tasks.`,
        estimated_savings_usd: metrics.monthly_cost_usd * 0.5, // 50% savings with Haiku
      });
    }

    // Many small actions
    if (metrics.total_actions > 100 && metrics.avg_duration_ms < 5000) {
      optimizations.push({
        type: 'batch_operations',
        description: `${metrics.total_actions} actions with short duration. Consider batching similar operations.`,
        estimated_savings_usd: metrics.monthly_cost_usd * 0.2, // 20% savings from batching
      });
    }

    return optimizations;
  }
}
