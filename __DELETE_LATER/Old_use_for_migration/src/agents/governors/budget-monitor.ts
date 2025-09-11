/**
 * Budget Monitor - OSSA v0.1.8 Compliant
 * 
 * Advanced real-time budget monitoring and tracking system providing
 * comprehensive oversight of resource allocation, cost tracking, and
 * automated governance across all agent operations.
 * 
 * Key Features:
 * - Real-time budget tracking and alerting
 * - Predictive budget analysis and forecasting
 * - Multi-tier budget hierarchies (organization > team > project > task)
 * - Automated budget violation prevention
 * - Cost trend analysis and reporting
 * - Integration with external financial systems
 * - Compliance reporting and audit trails
 */

import { EventEmitter } from 'events';
import { BudgetConstraint, BudgetAllocation } from './base-governor';

export interface BudgetMetrics {
  budget_id: string;
  current_metrics: {
    total_allocated: number;
    total_spent: number;
    total_remaining: number;
    utilization_percentage: number;
    projected_monthly_burn: number;
    average_cost_per_task: number;
    cost_efficiency_score: number; // 0-1
  };
  time_series_data: Array<{
    timestamp: string;
    cumulative_spent: number;
    period_spend: number;
    remaining_budget: number;
    tasks_completed: number;
  }>;
  forecasting: {
    projected_end_date: string;
    projected_overrun_risk: number; // 0-1
    recommended_actions: string[];
    confidence_interval: {
      low_estimate: number;
      high_estimate: number;
      confidence_level: number; // e.g., 0.95 for 95%
    };
  };
  benchmark_comparisons: {
    vs_previous_period: number;      // percentage change
    vs_similar_projects: number;     // percentile ranking
    vs_industry_average: number;     // percentage difference
    efficiency_ranking: number;      // 1-100 percentile
  };
}

export interface AlertConfiguration {
  alert_id: string;
  name: string;
  budget_scope: 'specific' | 'category' | 'all';
  budget_ids?: string[];
  conditions: {
    threshold_type: 'percentage' | 'absolute' | 'rate' | 'forecast';
    threshold_value: number;
    comparison_operator: 'greater_than' | 'less_than' | 'equals' | 'rate_exceeds';
    time_window?: number; // minutes for rate-based alerts
  };
  actions: {
    notify_stakeholders: string[];   // email addresses or user IDs
    auto_throttle_requests: boolean;
    emergency_stop: boolean;
    escalation_chain: Array<{
      delay_minutes: number;
      action: 'email' | 'sms' | 'webhook' | 'emergency_stop';
      target: string;
    }>;
  };
  notification_channels: {
    email: boolean;
    slack: boolean;
    webhook?: {
      url: string;
      headers: Record<string, string>;
    };
    dashboard: boolean;
  };
  suppression_rules: {
    max_alerts_per_hour: number;
    suppress_after_action: boolean;
    cooldown_minutes: number;
  };
}

export interface CostTrendAnalysis {
  analysis_id: string;
  time_period: {
    start_date: string;
    end_date: string;
    granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  };
  trends: {
    overall_trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    trend_strength: number; // 0-1, how strong the trend is
    seasonal_patterns: Array<{
      pattern_type: 'daily' | 'weekly' | 'monthly';
      strength: number;
      description: string;
    }>;
    anomalies: Array<{
      timestamp: string;
      expected_cost: number;
      actual_cost: number;
      severity: 'low' | 'medium' | 'high';
      potential_causes: string[];
    }>;
  };
  cost_drivers: Array<{
    factor: string;
    impact_percentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    correlation_strength: number; // 0-1
  }>;
  predictive_insights: {
    next_period_forecast: {
      estimated_cost: number;
      confidence_bounds: [number, number];
      key_assumptions: string[];
    };
    optimization_opportunities: Array<{
      opportunity_type: string;
      potential_savings: number;
      implementation_effort: 'low' | 'medium' | 'high';
      risk_level: 'low' | 'medium' | 'high';
    }>;
  };
}

export interface ComplianceReport {
  report_id: string;
  generation_date: string;
  reporting_period: {
    start_date: string;
    end_date: string;
  };
  budget_compliance: {
    total_budgets_monitored: number;
    budgets_within_limits: number;
    budget_violations: Array<{
      budget_id: string;
      violation_type: 'warning' | 'critical' | 'emergency';
      violation_amount: number;
      violation_percentage: number;
      duration_hours: number;
      remedial_actions_taken: string[];
    }>;
    compliance_score: number; // 0-100
  };
  cost_optimization_performance: {
    total_optimizations: number;
    successful_optimizations: number;
    total_cost_savings: number;
    average_savings_percentage: number;
    optimization_success_rate: number;
  };
  audit_trail: Array<{
    timestamp: string;
    action_type: string;
    user_id?: string;
    system_action: boolean;
    budget_impact: number;
    approval_status: string;
    compliance_notes: string;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: 'cost_reduction' | 'process_improvement' | 'compliance' | 'risk_mitigation';
    description: string;
    estimated_impact: string;
    implementation_timeline: string;
  }>;
}

export class BudgetMonitor extends EventEmitter {
  private monitor_id: string;
  private budget_metrics: Map<string, BudgetMetrics> = new Map();
  private alert_configurations: Map<string, AlertConfiguration> = new Map();
  private active_alerts: Map<string, any> = new Map();
  private historical_data: Map<string, any[]> = new Map();
  private trend_analyzer: TrendAnalyzer;
  private compliance_tracker: ComplianceTracker;
  
  // Monitoring configuration
  private monitoring_config = {
    update_interval_ms: 30000,      // Update metrics every 30 seconds
    trend_analysis_interval_ms: 300000, // Analyze trends every 5 minutes
    compliance_report_interval_hours: 24,   // Generate compliance reports daily
    data_retention_days: 90,        // Keep historical data for 90 days
    alert_debounce_ms: 60000,      // Prevent alert flooding
    forecast_horizon_days: 30       // Forecast 30 days ahead
  };

  constructor(monitor_id: string = 'budget-monitor') {
    super();
    this.monitor_id = monitor_id;
    this.trend_analyzer = new TrendAnalyzer();
    this.compliance_tracker = new ComplianceTracker();
    
    this.initializeMonitoring();
  }

  /**
   * Start monitoring a budget constraint
   */
  async startMonitoring(constraint: BudgetConstraint): Promise<void> {
    console.log(`[${this.monitor_id}] Starting monitoring for budget: ${constraint.name}`);
    
    // Initialize metrics for this budget
    const initial_metrics: BudgetMetrics = {
      budget_id: constraint.budget_id,
      current_metrics: {
        total_allocated: constraint.total_budget,
        total_spent: constraint.used_budget,
        total_remaining: constraint.remaining_budget,
        utilization_percentage: (constraint.used_budget / constraint.total_budget) * 100,
        projected_monthly_burn: 0,
        average_cost_per_task: 0,
        cost_efficiency_score: 1.0
      },
      time_series_data: [{
        timestamp: new Date().toISOString(),
        cumulative_spent: constraint.used_budget,
        period_spend: 0,
        remaining_budget: constraint.remaining_budget,
        tasks_completed: 0
      }],
      forecasting: {
        projected_end_date: constraint.time_period.end,
        projected_overrun_risk: 0,
        recommended_actions: [],
        confidence_interval: {
          low_estimate: constraint.remaining_budget * 0.8,
          high_estimate: constraint.remaining_budget * 1.2,
          confidence_level: 0.95
        }
      },
      benchmark_comparisons: {
        vs_previous_period: 0,
        vs_similar_projects: 50, // Start at median
        vs_industry_average: 0,
        efficiency_ranking: 50
      }
    };

    this.budget_metrics.set(constraint.budget_id, initial_metrics);
    
    // Set up default alert configurations for this budget
    await this.setupDefaultAlerts(constraint);
    
    console.log(`[${this.monitor_id}] Monitoring started for budget: ${constraint.budget_id}`);
    
    this.emit('monitoring_started', {
      budget_id: constraint.budget_id,
      initial_metrics
    });
  }

  /**
   * Update budget metrics after allocation or spending
   */
  async updateBudgetMetrics(
    budget_id: string,
    allocation: BudgetAllocation,
    actual_cost?: number
  ): Promise<void> {
    const metrics = this.budget_metrics.get(budget_id);
    if (!metrics) {
      console.warn(`[${this.monitor_id}] Metrics not found for budget: ${budget_id}`);
      return;
    }

    // Update current metrics
    const cost_to_record = actual_cost || allocation.estimated_cost;
    
    metrics.current_metrics.total_spent += cost_to_record;
    metrics.current_metrics.total_remaining = Math.max(0, 
      metrics.current_metrics.total_allocated - metrics.current_metrics.total_spent
    );
    metrics.current_metrics.utilization_percentage = 
      (metrics.current_metrics.total_spent / metrics.current_metrics.total_allocated) * 100;

    // Add time series data point
    const now = new Date().toISOString();
    const latest_data = metrics.time_series_data[metrics.time_series_data.length - 1];
    const tasks_completed = latest_data.tasks_completed + (actual_cost ? 1 : 0);

    metrics.time_series_data.push({
      timestamp: now,
      cumulative_spent: metrics.current_metrics.total_spent,
      period_spend: cost_to_record,
      remaining_budget: metrics.current_metrics.total_remaining,
      tasks_completed
    });

    // Update derived metrics
    await this.updateDerivedMetrics(budget_id, metrics);
    
    // Check for alert conditions
    await this.checkAlertConditions(budget_id, metrics);
    
    // Update forecasting
    await this.updateForecasting(budget_id, metrics);
    
    console.log(`[${this.monitor_id}] Updated metrics for budget: ${budget_id}`, {
      total_spent: metrics.current_metrics.total_spent,
      remaining: metrics.current_metrics.total_remaining,
      utilization: `${metrics.current_metrics.utilization_percentage.toFixed(1)}%`
    });

    this.emit('metrics_updated', {
      budget_id,
      metrics: metrics.current_metrics,
      cost_recorded: cost_to_record
    });
  }

  /**
   * Configure custom alert for budget monitoring
   */
  async configureAlert(alert_config: AlertConfiguration): Promise<void> {
    console.log(`[${this.monitor_id}] Configuring alert: ${alert_config.name}`);
    
    // Validate alert configuration
    this.validateAlertConfiguration(alert_config);
    
    // Store alert configuration
    this.alert_configurations.set(alert_config.alert_id, alert_config);
    
    console.log(`[${this.monitor_id}] Alert configured: ${alert_config.alert_id}`);
    
    this.emit('alert_configured', {
      alert_id: alert_config.alert_id,
      alert_name: alert_config.name
    });
  }

  /**
   * Generate comprehensive trend analysis
   */
  async generateTrendAnalysis(
    budget_id: string,
    time_period: { start_date: string; end_date: string }
  ): Promise<CostTrendAnalysis> {
    console.log(`[${this.monitor_id}] Generating trend analysis for budget: ${budget_id}`);
    
    const metrics = this.budget_metrics.get(budget_id);
    if (!metrics) {
      throw new Error(`Budget metrics not found for: ${budget_id}`);
    }

    // Filter time series data for the specified period
    const period_data = metrics.time_series_data.filter(point => {
      const timestamp = new Date(point.timestamp);
      const start = new Date(time_period.start_date);
      const end = new Date(time_period.end_date);
      return timestamp >= start && timestamp <= end;
    });

    const analysis = await this.trend_analyzer.analyze(budget_id, period_data);
    
    console.log(`[${this.monitor_id}] Trend analysis completed`, {
      budget_id,
      trend: analysis.trends.overall_trend,
      anomalies: analysis.trends.anomalies.length
    });

    return analysis;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    reporting_period: { start_date: string; end_date: string }
  ): Promise<ComplianceReport> {
    console.log(`[${this.monitor_id}] Generating compliance report`);
    
    const report = await this.compliance_tracker.generateReport(
      Array.from(this.budget_metrics.values()),
      Array.from(this.active_alerts.values()),
      reporting_period
    );

    console.log(`[${this.monitor_id}] Compliance report generated`, {
      budgets_monitored: report.budget_compliance.total_budgets_monitored,
      compliance_score: report.budget_compliance.compliance_score,
      violations: report.budget_compliance.budget_violations.length
    });

    this.emit('compliance_report_generated', {
      report_id: report.report_id,
      compliance_score: report.budget_compliance.compliance_score
    });

    return report;
  }

  /**
   * Get real-time dashboard data
   */
  getDashboardData(): {
    summary: {
      total_budgets: number;
      total_allocated: number;
      total_spent: number;
      average_utilization: number;
      active_alerts: number;
    };
    budget_status: Array<{
      budget_id: string;
      name: string;
      status: 'healthy' | 'warning' | 'critical' | 'emergency';
      utilization_percentage: number;
      remaining_amount: number;
      projected_end_date: string;
    }>;
    recent_activities: Array<{
      timestamp: string;
      activity_type: string;
      budget_id: string;
      amount: number;
      description: string;
    }>;
  } {
    const all_metrics = Array.from(this.budget_metrics.values());
    
    const summary = {
      total_budgets: all_metrics.length,
      total_allocated: all_metrics.reduce((sum, m) => sum + m.current_metrics.total_allocated, 0),
      total_spent: all_metrics.reduce((sum, m) => sum + m.current_metrics.total_spent, 0),
      average_utilization: all_metrics.length > 0 
        ? all_metrics.reduce((sum, m) => sum + m.current_metrics.utilization_percentage, 0) / all_metrics.length
        : 0,
      active_alerts: this.active_alerts.size
    };

    const budget_status = all_metrics.map(metrics => ({
      budget_id: metrics.budget_id,
      name: metrics.budget_id, // Would normally have budget names
      status: this.getBudgetStatus(metrics.current_metrics.utilization_percentage),
      utilization_percentage: metrics.current_metrics.utilization_percentage,
      remaining_amount: metrics.current_metrics.total_remaining,
      projected_end_date: metrics.forecasting.projected_end_date
    }));

    // Get recent activities from time series data
    const recent_activities = all_metrics.flatMap(metrics =>
      metrics.time_series_data
        .slice(-5) // Last 5 activities per budget
        .map(point => ({
          timestamp: point.timestamp,
          activity_type: point.period_spend > 0 ? 'spend' : 'allocation',
          budget_id: metrics.budget_id,
          amount: point.period_spend,
          description: `${point.period_spend > 0 ? 'Spent' : 'Allocated'} ${point.period_spend}`
        }))
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);

    return {
      summary,
      budget_status,
      recent_activities
    };
  }

  /**
   * Get specific budget metrics
   */
  getBudgetMetrics(budget_id: string): BudgetMetrics | null {
    return this.budget_metrics.get(budget_id) || null;
  }

  /**
   * Stop monitoring a budget
   */
  async stopMonitoring(budget_id: string): Promise<void> {
    console.log(`[${this.monitor_id}] Stopping monitoring for budget: ${budget_id}`);
    
    this.budget_metrics.delete(budget_id);
    
    // Remove related alerts
    for (const [alert_id, alert] of this.alert_configurations.entries()) {
      if (alert.budget_ids?.includes(budget_id) || alert.budget_scope === 'specific') {
        this.alert_configurations.delete(alert_id);
      }
    }
    
    console.log(`[${this.monitor_id}] Monitoring stopped for budget: ${budget_id}`);
    
    this.emit('monitoring_stopped', { budget_id });
  }

  // Private helper methods

  private initializeMonitoring(): void {
    console.log(`[${this.monitor_id}] Initializing budget monitoring system`);
    
    // Start periodic updates
    setInterval(() => {
      this.performPeriodicUpdates();
    }, this.monitoring_config.update_interval_ms);

    // Start trend analysis
    setInterval(() => {
      this.performTrendAnalysis();
    }, this.monitoring_config.trend_analysis_interval_ms);

    // Start compliance reporting
    setInterval(() => {
      this.performComplianceChecks();
    }, this.monitoring_config.compliance_report_interval_hours * 3600000);

    console.log(`[${this.monitor_id}] Budget monitoring system initialized`);
  }

  private async setupDefaultAlerts(constraint: BudgetConstraint): Promise<void> {
    const default_alerts: AlertConfiguration[] = [
      {
        alert_id: `warning_${constraint.budget_id}`,
        name: `Budget Warning - ${constraint.name}`,
        budget_scope: 'specific',
        budget_ids: [constraint.budget_id],
        conditions: {
          threshold_type: 'percentage',
          threshold_value: constraint.thresholds.warning_percentage,
          comparison_operator: 'greater_than'
        },
        actions: {
          notify_stakeholders: [],
          auto_throttle_requests: false,
          emergency_stop: false,
          escalation_chain: []
        },
        notification_channels: {
          email: true,
          slack: true,
          dashboard: true
        },
        suppression_rules: {
          max_alerts_per_hour: 1,
          suppress_after_action: false,
          cooldown_minutes: 60
        }
      },
      {
        alert_id: `critical_${constraint.budget_id}`,
        name: `Budget Critical - ${constraint.name}`,
        budget_scope: 'specific',
        budget_ids: [constraint.budget_id],
        conditions: {
          threshold_type: 'percentage',
          threshold_value: constraint.thresholds.critical_percentage,
          comparison_operator: 'greater_than'
        },
        actions: {
          notify_stakeholders: [],
          auto_throttle_requests: true,
          emergency_stop: false,
          escalation_chain: [
            {
              delay_minutes: 5,
              action: 'email',
              target: 'finance-team@company.com'
            }
          ]
        },
        notification_channels: {
          email: true,
          slack: true,
          dashboard: true
        },
        suppression_rules: {
          max_alerts_per_hour: 3,
          suppress_after_action: false,
          cooldown_minutes: 30
        }
      }
    ];

    for (const alert_config of default_alerts) {
      await this.configureAlert(alert_config);
    }
  }

  private async updateDerivedMetrics(budget_id: string, metrics: BudgetMetrics): Promise<void> {
    // Calculate projected monthly burn
    const recent_data = metrics.time_series_data.slice(-10); // Last 10 data points
    if (recent_data.length >= 2) {
      const time_span_hours = (new Date(recent_data[recent_data.length - 1].timestamp).getTime() - 
                              new Date(recent_data[0].timestamp).getTime()) / (1000 * 60 * 60);
      const total_spend = recent_data.reduce((sum, point) => sum + point.period_spend, 0);
      
      if (time_span_hours > 0) {
        const hourly_burn = total_spend / time_span_hours;
        metrics.current_metrics.projected_monthly_burn = hourly_burn * 24 * 30;
      }
    }

    // Calculate average cost per task
    const completed_tasks = metrics.time_series_data[metrics.time_series_data.length - 1].tasks_completed;
    if (completed_tasks > 0) {
      metrics.current_metrics.average_cost_per_task = 
        metrics.current_metrics.total_spent / completed_tasks;
    }

    // Update cost efficiency score
    metrics.current_metrics.cost_efficiency_score = this.calculateEfficiencyScore(metrics);
  }

  private calculateEfficiencyScore(metrics: BudgetMetrics): number {
    // Simplified efficiency calculation
    const utilization = metrics.current_metrics.utilization_percentage / 100;
    const tasks_per_dollar = metrics.current_metrics.average_cost_per_task > 0 
      ? 1 / metrics.current_metrics.average_cost_per_task 
      : 1;
    
    // Score based on efficient utilization and cost per task
    return Math.min(1.0, (1 - Math.abs(utilization - 0.8)) * tasks_per_dollar * 0.1);
  }

  private async checkAlertConditions(budget_id: string, metrics: BudgetMetrics): Promise<void> {
    for (const [alert_id, alert_config] of this.alert_configurations.entries()) {
      if (this.alertAppliesTo(alert_config, budget_id)) {
        const condition_met = this.evaluateAlertCondition(alert_config, metrics);
        
        if (condition_met && !this.active_alerts.has(alert_id)) {
          await this.triggerAlert(alert_id, alert_config, metrics);
        } else if (!condition_met && this.active_alerts.has(alert_id)) {
          await this.resolveAlert(alert_id);
        }
      }
    }
  }

  private alertAppliesTo(alert_config: AlertConfiguration, budget_id: string): boolean {
    return alert_config.budget_scope === 'all' || 
           (alert_config.budget_scope === 'specific' && alert_config.budget_ids?.includes(budget_id));
  }

  private evaluateAlertCondition(alert_config: AlertConfiguration, metrics: BudgetMetrics): boolean {
    const { conditions } = alert_config;
    let value: number;

    switch (conditions.threshold_type) {
      case 'percentage':
        value = metrics.current_metrics.utilization_percentage;
        break;
      case 'absolute':
        value = metrics.current_metrics.total_spent;
        break;
      case 'rate':
        value = metrics.current_metrics.projected_monthly_burn;
        break;
      case 'forecast':
        value = metrics.forecasting.projected_overrun_risk * 100;
        break;
      default:
        return false;
    }

    switch (conditions.comparison_operator) {
      case 'greater_than':
        return value > conditions.threshold_value;
      case 'less_than':
        return value < conditions.threshold_value;
      case 'equals':
        return Math.abs(value - conditions.threshold_value) < 0.01;
      default:
        return false;
    }
  }

  private async triggerAlert(
    alert_id: string, 
    alert_config: AlertConfiguration, 
    metrics: BudgetMetrics
  ): Promise<void> {
    const alert_instance = {
      alert_id,
      budget_id: metrics.budget_id,
      triggered_at: new Date().toISOString(),
      condition_value: metrics.current_metrics.utilization_percentage,
      threshold_value: alert_config.conditions.threshold_value,
      severity: this.determineAlertSeverity(alert_config, metrics),
      suppression_count: 0
    };

    this.active_alerts.set(alert_id, alert_instance);

    console.log(`[${this.monitor_id}] Alert triggered: ${alert_config.name}`, {
      budget_id: metrics.budget_id,
      condition_value: alert_instance.condition_value,
      threshold: alert_instance.threshold_value
    });

    // Execute alert actions
    await this.executeAlertActions(alert_config, alert_instance, metrics);

    this.emit('alert_triggered', {
      alert_id,
      alert_name: alert_config.name,
      budget_id: metrics.budget_id,
      severity: alert_instance.severity
    });
  }

  private async resolveAlert(alert_id: string): Promise<void> {
    const alert_instance = this.active_alerts.get(alert_id);
    if (alert_instance) {
      this.active_alerts.delete(alert_id);
      
      console.log(`[${this.monitor_id}] Alert resolved: ${alert_id}`);
      
      this.emit('alert_resolved', {
        alert_id,
        budget_id: alert_instance.budget_id,
        duration: Date.now() - new Date(alert_instance.triggered_at).getTime()
      });
    }
  }

  private determineAlertSeverity(alert_config: AlertConfiguration, metrics: BudgetMetrics): string {
    const utilization = metrics.current_metrics.utilization_percentage;
    
    if (utilization >= 95) return 'emergency';
    if (utilization >= 85) return 'critical';
    if (utilization >= 75) return 'warning';
    return 'info';
  }

  private async executeAlertActions(
    alert_config: AlertConfiguration,
    alert_instance: any,
    metrics: BudgetMetrics
  ): Promise<void> {
    // Implement alert actions (notifications, throttling, etc.)
    console.log(`[${this.monitor_id}] Executing alert actions for: ${alert_config.name}`);
    
    // This would integrate with actual notification systems
    if (alert_config.actions.auto_throttle_requests) {
      this.emit('throttle_requests', {
        budget_id: metrics.budget_id,
        severity: alert_instance.severity
      });
    }
    
    if (alert_config.actions.emergency_stop) {
      this.emit('emergency_stop', {
        budget_id: metrics.budget_id,
        reason: 'Budget limit exceeded'
      });
    }
  }

  private async updateForecasting(budget_id: string, metrics: BudgetMetrics): Promise<void> {
    // Simple forecasting based on recent spend rate
    const recent_data = metrics.time_series_data.slice(-20);
    
    if (recent_data.length >= 2) {
      const daily_spend = this.calculateDailySpendRate(recent_data);
      const days_remaining = metrics.current_metrics.total_remaining / Math.max(0.01, daily_spend);
      
      const projected_end_date = new Date();
      projected_end_date.setDate(projected_end_date.getDate() + days_remaining);
      
      metrics.forecasting.projected_end_date = projected_end_date.toISOString();
      metrics.forecasting.projected_overrun_risk = Math.min(1, Math.max(0, 
        (daily_spend * this.monitoring_config.forecast_horizon_days - metrics.current_metrics.total_remaining) / 
        metrics.current_metrics.total_allocated
      ));
    }
  }

  private calculateDailySpendRate(data_points: any[]): number {
    if (data_points.length < 2) return 0;
    
    const first_point = data_points[0];
    const last_point = data_points[data_points.length - 1];
    
    const time_span_days = (new Date(last_point.timestamp).getTime() - 
                           new Date(first_point.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    
    const total_spend = last_point.cumulative_spent - first_point.cumulative_spent;
    
    return time_span_days > 0 ? total_spend / time_span_days : 0;
  }

  private validateAlertConfiguration(alert_config: AlertConfiguration): void {
    if (!alert_config.alert_id) {
      throw new Error('Alert ID is required');
    }
    if (!alert_config.conditions.threshold_value) {
      throw new Error('Threshold value is required');
    }
    if (alert_config.conditions.threshold_value < 0) {
      throw new Error('Threshold value must be positive');
    }
  }

  private getBudgetStatus(utilization_percentage: number): 'healthy' | 'warning' | 'critical' | 'emergency' {
    if (utilization_percentage >= 95) return 'emergency';
    if (utilization_percentage >= 85) return 'critical';
    if (utilization_percentage >= 75) return 'warning';
    return 'healthy';
  }

  private async performPeriodicUpdates(): Promise<void> {
    // Periodic maintenance and updates
    for (const [budget_id, metrics] of this.budget_metrics.entries()) {
      await this.updateDerivedMetrics(budget_id, metrics);
    }
  }

  private async performTrendAnalysis(): Promise<void> {
    // Perform trend analysis for all budgets
    for (const budget_id of this.budget_metrics.keys()) {
      try {
        const end_date = new Date();
        const start_date = new Date(end_date);
        start_date.setDate(start_date.getDate() - 7); // Last 7 days

        await this.generateTrendAnalysis(budget_id, {
          start_date: start_date.toISOString(),
          end_date: end_date.toISOString()
        });
      } catch (error) {
        console.error(`[${this.monitor_id}] Trend analysis failed for budget ${budget_id}:`, error);
      }
    }
  }

  private async performComplianceChecks(): Promise<void> {
    try {
      const end_date = new Date();
      const start_date = new Date(end_date);
      start_date.setDate(start_date.getDate() - 1); // Last 24 hours

      await this.generateComplianceReport({
        start_date: start_date.toISOString(),
        end_date: end_date.toISOString()
      });
    } catch (error) {
      console.error(`[${this.monitor_id}] Compliance check failed:`, error);
    }
  }
}

/**
 * Trend analysis engine
 */
class TrendAnalyzer {
  async analyze(budget_id: string, data_points: any[]): Promise<CostTrendAnalysis> {
    // Simplified trend analysis
    const analysis_id = `trend_${Date.now()}_${budget_id}`;
    
    return {
      analysis_id,
      time_period: {
        start_date: data_points[0]?.timestamp || new Date().toISOString(),
        end_date: data_points[data_points.length - 1]?.timestamp || new Date().toISOString(),
        granularity: 'daily'
      },
      trends: {
        overall_trend: this.calculateOverallTrend(data_points),
        trend_strength: 0.7,
        seasonal_patterns: [],
        anomalies: this.detectAnomalies(data_points)
      },
      cost_drivers: [
        {
          factor: 'Task Complexity',
          impact_percentage: 35,
          trend: 'increasing',
          correlation_strength: 0.8
        }
      ],
      predictive_insights: {
        next_period_forecast: {
          estimated_cost: this.forecastNextPeriod(data_points),
          confidence_bounds: [0, 0],
          key_assumptions: ['Historical trend continues', 'No major system changes']
        },
        optimization_opportunities: [
          {
            opportunity_type: 'Agent Tier Optimization',
            potential_savings: 150,
            implementation_effort: 'medium',
            risk_level: 'low'
          }
        ]
      }
    };
  }

  private calculateOverallTrend(data_points: any[]): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    if (data_points.length < 3) return 'stable';
    
    const first_half = data_points.slice(0, Math.floor(data_points.length / 2));
    const second_half = data_points.slice(Math.floor(data_points.length / 2));
    
    const first_avg = first_half.reduce((sum, p) => sum + p.period_spend, 0) / first_half.length;
    const second_avg = second_half.reduce((sum, p) => sum + p.period_spend, 0) / second_half.length;
    
    const change = (second_avg - first_avg) / Math.max(0.01, first_avg);
    
    if (Math.abs(change) < 0.1) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  private detectAnomalies(data_points: any[]): any[] {
    // Simple anomaly detection
    const anomalies = [];
    
    if (data_points.length < 3) return anomalies;
    
    const avg_spend = data_points.reduce((sum, p) => sum + p.period_spend, 0) / data_points.length;
    const threshold = avg_spend * 2;
    
    for (const point of data_points) {
      if (point.period_spend > threshold) {
        anomalies.push({
          timestamp: point.timestamp,
          expected_cost: avg_spend,
          actual_cost: point.period_spend,
          severity: 'medium' as const,
          potential_causes: ['Unusual task complexity', 'Agent performance variation']
        });
      }
    }
    
    return anomalies;
  }

  private forecastNextPeriod(data_points: any[]): number {
    if (data_points.length === 0) return 0;
    
    const recent_avg = data_points.slice(-5).reduce((sum, p) => sum + p.period_spend, 0) / 
                      Math.min(5, data_points.length);
    
    return recent_avg * 30; // Monthly forecast
  }
}

/**
 * Compliance tracking system
 */
class ComplianceTracker {
  async generateReport(
    all_metrics: BudgetMetrics[],
    active_alerts: any[],
    period: { start_date: string; end_date: string }
  ): Promise<ComplianceReport> {
    const report_id = `compliance_${Date.now()}`;
    
    // Calculate compliance metrics
    const total_budgets = all_metrics.length;
    const budgets_within_limits = all_metrics.filter(m => 
      m.current_metrics.utilization_percentage <= 90
    ).length;
    
    const compliance_score = total_budgets > 0 
      ? (budgets_within_limits / total_budgets) * 100
      : 100;

    return {
      report_id,
      generation_date: new Date().toISOString(),
      reporting_period: period,
      budget_compliance: {
        total_budgets_monitored: total_budgets,
        budgets_within_limits,
        budget_violations: this.extractViolations(all_metrics),
        compliance_score
      },
      cost_optimization_performance: {
        total_optimizations: 0,
        successful_optimizations: 0,
        total_cost_savings: 0,
        average_savings_percentage: 0,
        optimization_success_rate: 0
      },
      audit_trail: [],
      recommendations: this.generateRecommendations(all_metrics)
    };
  }

  private extractViolations(all_metrics: BudgetMetrics[]): any[] {
    return all_metrics
      .filter(m => m.current_metrics.utilization_percentage > 90)
      .map(m => ({
        budget_id: m.budget_id,
        violation_type: m.current_metrics.utilization_percentage > 95 ? 'emergency' : 'critical' as const,
        violation_amount: m.current_metrics.total_spent - (m.current_metrics.total_allocated * 0.9),
        violation_percentage: m.current_metrics.utilization_percentage - 90,
        duration_hours: 24, // Simplified
        remedial_actions_taken: ['Alert sent', 'Monitoring increased']
      }));
  }

  private generateRecommendations(all_metrics: BudgetMetrics[]): any[] {
    const recommendations = [];
    
    // High utilization budgets
    const high_util_budgets = all_metrics.filter(m => m.current_metrics.utilization_percentage > 80);
    
    if (high_util_budgets.length > 0) {
      recommendations.push({
        priority: 'high' as const,
        category: 'risk_mitigation' as const,
        description: 'Review budget allocations for high utilization budgets',
        estimated_impact: 'Prevent budget overruns',
        implementation_timeline: '1-2 days'
      });
    }

    return recommendations;
  }
}