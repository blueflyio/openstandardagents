/**
 * OSSA Performance Monitor and Auto-Scaling System
 * Real-time performance monitoring with predictive auto-scaling for 1000+ agents
 */

import { EventEmitter } from 'events';

interface PerformanceMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    available: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connectionsActive: number;
    connectionsTotal: number;
    latency: number;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    rps: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  agents: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    responding: number;
  };
  registry: {
    queryLatency: number;
    cacheHitRate: number;
    indexSize: number;
    syncLatency: number;
  };
}

interface AutoScalingConfig {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  targetCpuUtilization: number;
  targetMemoryUtilization: number;
  targetResponseTime: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  scaleUpCooldown: number; // milliseconds
  scaleDownCooldown: number; // milliseconds
  predictiveScaling: boolean;
  loadForecastWindow: number; // minutes
}

interface AlertConfig {
  enabled: boolean;
  channels: Array<'email' | 'webhook' | 'console' | 'metrics'>;
  thresholds: {
    cpuCritical: number;
    memoryWarning: number;
    memoryCritical: number;
    responseTimeWarning: number;
    responseTimeCritical: number;
    errorRateWarning: number;
    errorRateCritical: number;
    agentHealthWarning: number;
  };
}

interface ScalingDecision {
  timestamp: Date;
  action: 'scale_up' | 'scale_down' | 'maintain';
  reason: string;
  currentInstances: number;
  targetInstances: number;
  confidence: number;
  metrics: {
    cpu: number;
    memory: number;
    responseTime: number;
    rps: number;
  };
  prediction?: {
    futureLoad: number;
    timeHorizon: number;
    confidence: number;
  };
}

interface Alert {
  id: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  type: 'performance' | 'availability' | 'scaling' | 'system';
  message: string;
  metrics: Partial<PerformanceMetrics>;
  resolved?: Date;
  resolvedBy?: string;
}

export class PerformanceMonitor extends EventEmitter {
  private config: {
    monitoring: {
      interval: number;
      retentionPeriod: number;
      detailedMetrics: boolean;
    };
    autoScaling: AutoScalingConfig;
    alerts: AlertConfig;
  };

  private metrics: PerformanceMetrics[] = [];
  private currentMetrics?: PerformanceMetrics;
  private alerts: Map<string, Alert> = new Map();
  private scalingHistory: ScalingDecision[] = [];
  private lastScaleAction?: Date;
  private monitoringTimer?: NodeJS.Timeout;
  private currentInstances = 1;
  private loadPredictionModel: LoadPredictionModel;

  constructor(config: Partial<typeof PerformanceMonitor.prototype.config> = {}) {
    super();

    this.config = {
      monitoring: {
        interval: 30000, // 30 seconds
        retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
        detailedMetrics: true,
        ...config.monitoring
      },
      autoScaling: {
        enabled: true,
        minInstances: 1,
        maxInstances: 10,
        targetCpuUtilization: 70,
        targetMemoryUtilization: 80,
        targetResponseTime: 200, // ms
        scaleUpThreshold: 80,
        scaleDownThreshold: 30,
        scaleUpCooldown: 300000, // 5 minutes
        scaleDownCooldown: 600000, // 10 minutes
        predictiveScaling: true,
        loadForecastWindow: 15, // 15 minutes
        ...config.autoScaling
      },
      alerts: {
        enabled: true,
        channels: ['console', 'metrics'],
        thresholds: {
          cpuCritical: 90,
          memoryWarning: 85,
          memoryCritical: 95,
          responseTimeWarning: 500,
          responseTimeCritical: 1000,
          errorRateWarning: 5,
          errorRateCritical: 10,
          agentHealthWarning: 80,
          ...config.alerts?.thresholds
        },
        ...config.alerts
      }
    };

    this.loadPredictionModel = new LoadPredictionModel();
    this.startMonitoring();
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics | undefined {
    return this.currentMetrics;
  }

  /**
   * Get historical metrics within time range
   */
  getHistoricalMetrics(
    startTime: Date,
    endTime: Date = new Date()
  ): PerformanceMetrics[] {
    return this.metrics.filter(m =>
      m.timestamp >= startTime && m.timestamp <= endTime
    );
  }

  /**
   * Get performance statistics for time period
   */
  getPerformanceStats(periodMinutes: number = 60): {
    avg: Partial<PerformanceMetrics>;
    min: Partial<PerformanceMetrics>;
    max: Partial<PerformanceMetrics>;
    trend: 'up' | 'down' | 'stable';
  } {
    const startTime = new Date(Date.now() - (periodMinutes * 60 * 1000));
    const periodMetrics = this.getHistoricalMetrics(startTime);

    if (periodMetrics.length === 0) {
      return {
        avg: {},
        min: {},
        max: {},
        trend: 'stable'
      };
    }

    // Calculate averages
    const avg = this.calculateAverageMetrics(periodMetrics);
    const min = this.calculateMinMetrics(periodMetrics);
    const max = this.calculateMaxMetrics(periodMetrics);
    const trend = this.calculateTrend(periodMetrics);

    return { avg, min, max, trend };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => {
        // Sort by severity (critical first) then by timestamp
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
  }

  /**
   * Get scaling recommendations
   */
  async getScalingRecommendation(): Promise<ScalingDecision> {
    if (!this.currentMetrics) {
      return {
        timestamp: new Date(),
        action: 'maintain',
        reason: 'No metrics available',
        currentInstances: this.currentInstances,
        targetInstances: this.currentInstances,
        confidence: 0,
        metrics: { cpu: 0, memory: 0, responseTime: 0, rps: 0 }
      };
    }

    const metrics = this.currentMetrics;
    const config = this.config.autoScaling;

    // Calculate current load indicators
    const cpuScore = metrics.cpu.usage / config.targetCpuUtilization;
    const memoryScore = metrics.memory.percentage / config.targetMemoryUtilization;
    const responseTimeScore = metrics.requests.avgResponseTime / config.targetResponseTime;
    const overallScore = Math.max(cpuScore, memoryScore, responseTimeScore);

    // Check cooldown periods
    const now = Date.now();
    const lastScaleTime = this.lastScaleAction?.getTime() || 0;
    const timeSinceLastScale = now - lastScaleTime;

    let decision: ScalingDecision = {
      timestamp: new Date(),
      action: 'maintain',
      reason: 'Within target thresholds',
      currentInstances: this.currentInstances,
      targetInstances: this.currentInstances,
      confidence: 0.8,
      metrics: {
        cpu: metrics.cpu.usage,
        memory: metrics.memory.percentage,
        responseTime: metrics.requests.avgResponseTime,
        rps: metrics.requests.rps
      }
    };

    // Determine scaling action
    if (overallScore > (config.scaleUpThreshold / 100)) {
      if (timeSinceLastScale < config.scaleUpCooldown) {
        decision.reason = `Scale up needed but in cooldown (${Math.ceil((config.scaleUpCooldown - timeSinceLastScale) / 1000)}s remaining)`;
      } else if (this.currentInstances >= config.maxInstances) {
        decision.reason = 'At maximum instance limit';
      } else {
        decision.action = 'scale_up';
        decision.targetInstances = Math.min(
          config.maxInstances,
          Math.ceil(this.currentInstances * Math.min(2.0, overallScore))
        );
        decision.reason = `High resource utilization (score: ${overallScore.toFixed(2)})`;
        decision.confidence = Math.min(0.95, overallScore - 0.5);
      }
    } else if (overallScore < (config.scaleDownThreshold / 100)) {
      if (timeSinceLastScale < config.scaleDownCooldown) {
        decision.reason = `Scale down possible but in cooldown (${Math.ceil((config.scaleDownCooldown - timeSinceLastScale) / 1000)}s remaining)`;
      } else if (this.currentInstances <= config.minInstances) {
        decision.reason = 'At minimum instance limit';
      } else {
        decision.action = 'scale_down';
        decision.targetInstances = Math.max(
          config.minInstances,
          Math.floor(this.currentInstances / Math.max(1.5, 2 - overallScore))
        );
        decision.reason = `Low resource utilization (score: ${overallScore.toFixed(2)})`;
        decision.confidence = Math.min(0.95, (config.scaleDownThreshold / 100) - overallScore);
      }
    }

    // Add predictive scaling if enabled
    if (config.predictiveScaling) {
      const prediction = await this.loadPredictionModel.predict(
        this.getHistoricalMetrics(new Date(now - (config.loadForecastWindow * 60 * 1000)))
      );
      decision.prediction = prediction;

      // Adjust recommendation based on prediction
      if (prediction.futureLoad > 1.5 && decision.action === 'maintain') {
        decision.action = 'scale_up';
        decision.targetInstances = Math.min(
          config.maxInstances,
          this.currentInstances + 1
        );
        decision.reason = `Predicted load increase (${prediction.futureLoad.toFixed(2)}x)`;
        decision.confidence = prediction.confidence * 0.8; // Reduce confidence for predictions
      }
    }

    return decision;
  }

  /**
   * Execute scaling decision
   */
  async executeScaling(decision: ScalingDecision): Promise<void> {
    if (decision.action === 'maintain') {
      return;
    }

    if (!this.config.autoScaling.enabled) {
      this.emit('scaling_disabled', { decision });
      return;
    }

    try {
      const previousInstances = this.currentInstances;
      
      // Execute scaling action
      await this.performScaling(decision.action, decision.targetInstances);
      
      this.currentInstances = decision.targetInstances;
      this.lastScaleAction = new Date();
      this.scalingHistory.push(decision);

      // Keep scaling history manageable
      if (this.scalingHistory.length > 100) {
        this.scalingHistory = this.scalingHistory.slice(-50);
      }

      this.emit('scaling_completed', {
        action: decision.action,
        from: previousInstances,
        to: this.currentInstances,
        reason: decision.reason,
        confidence: decision.confidence
      });

      // Create info alert for scaling actions
      this.createAlert({
        severity: 'info',
        type: 'scaling',
        message: `Scaled ${decision.action} from ${previousInstances} to ${this.currentInstances} instances: ${decision.reason}`,
        metrics: { requests: { rps: decision.metrics.rps } } as any
      });

    } catch (error) {
      this.emit('scaling_failed', { decision, error });
      
      this.createAlert({
        severity: 'critical',
        type: 'scaling',
        message: `Scaling ${decision.action} failed: ${(error as Error).message}`,
        metrics: this.currentMetrics || {} as any
      });
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, resolvedBy?: string): void {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = new Date();
      alert.resolvedBy = resolvedBy;
      this.emit('alert_resolved', { alert });
    }
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.collectMetrics().catch(error => {
        this.emit('monitoring_error', { error });
      });
    }, this.config.monitoring.interval);

    // Collect initial metrics
    this.collectMetrics().catch(() => {
      // Ignore initial collection errors
    });
  }

  /**
   * Collect current performance metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.gatherSystemMetrics();
      
      this.currentMetrics = metrics;
      this.metrics.push(metrics);

      // Clean up old metrics
      this.cleanupOldMetrics();

      // Update load prediction model
      this.loadPredictionModel.addDataPoint(metrics);

      // Check for alerts
      this.checkAlertConditions(metrics);

      // Emit metrics event
      this.emit('metrics_collected', { metrics });

      // Auto-scaling check
      if (this.config.autoScaling.enabled) {
        const recommendation = await this.getScalingRecommendation();
        if (recommendation.action !== 'maintain' && recommendation.confidence > 0.7) {
          await this.executeScaling(recommendation);
        }
      }

    } catch (error) {
      this.emit('metrics_collection_error', { error });
    }
  }

  /**
   * Gather system metrics from various sources
   */
  private async gatherSystemMetrics(): Promise<PerformanceMetrics> {
    const timestamp = new Date();

    // In a real implementation, these would gather actual system metrics
    // For now, we simulate realistic values
    return {
      timestamp,
      cpu: {
        usage: Math.random() * 80 + 10, // 10-90%
        cores: 4,
        loadAverage: [1.2, 1.1, 1.0]
      },
      memory: {
        used: Math.random() * 8000 + 2000, // 2-10 GB
        available: 16000,
        percentage: Math.random() * 60 + 20, // 20-80%
        heapUsed: Math.random() * 200 + 100, // 100-300 MB
        heapTotal: 400
      },
      network: {
        bytesIn: Math.random() * 1000000,
        bytesOut: Math.random() * 1000000,
        connectionsActive: Math.floor(Math.random() * 200 + 50),
        connectionsTotal: Math.floor(Math.random() * 1000 + 500),
        latency: Math.random() * 50 + 10 // 10-60ms
      },
      requests: {
        total: Math.floor(Math.random() * 10000 + 5000),
        successful: Math.floor(Math.random() * 9500 + 4500),
        failed: Math.floor(Math.random() * 500 + 50),
        rps: Math.random() * 100 + 20,
        avgResponseTime: Math.random() * 200 + 50,
        p95ResponseTime: Math.random() * 500 + 200,
        p99ResponseTime: Math.random() * 1000 + 500
      },
      agents: {
        total: Math.floor(Math.random() * 200 + 50),
        healthy: Math.floor(Math.random() * 180 + 40),
        degraded: Math.floor(Math.random() * 15 + 5),
        unhealthy: Math.floor(Math.random() * 10 + 2),
        responding: Math.floor(Math.random() * 200 + 45)
      },
      registry: {
        queryLatency: Math.random() * 100 + 20,
        cacheHitRate: Math.random() * 0.4 + 0.6, // 60-100%
        indexSize: Math.floor(Math.random() * 1000000 + 500000),
        syncLatency: Math.random() * 200 + 50
      }
    };
  }

  /**
   * Check alert conditions and create alerts if needed
   */
  private checkAlertConditions(metrics: PerformanceMetrics): void {
    if (!this.config.alerts.enabled) return;

    const thresholds = this.config.alerts.thresholds;

    // CPU alerts
    if (metrics.cpu.usage > thresholds.cpuCritical) {
      this.createAlert({
        severity: 'critical',
        type: 'performance',
        message: `CPU usage critical: ${metrics.cpu.usage.toFixed(1)}%`,
        metrics
      });
    }

    // Memory alerts
    if (metrics.memory.percentage > thresholds.memoryCritical) {
      this.createAlert({
        severity: 'critical',
        type: 'performance',
        message: `Memory usage critical: ${metrics.memory.percentage.toFixed(1)}%`,
        metrics
      });
    } else if (metrics.memory.percentage > thresholds.memoryWarning) {
      this.createAlert({
        severity: 'warning',
        type: 'performance',
        message: `Memory usage high: ${metrics.memory.percentage.toFixed(1)}%`,
        metrics
      });
    }

    // Response time alerts
    if (metrics.requests.avgResponseTime > thresholds.responseTimeCritical) {
      this.createAlert({
        severity: 'critical',
        type: 'performance',
        message: `Response time critical: ${metrics.requests.avgResponseTime.toFixed(1)}ms`,
        metrics
      });
    } else if (metrics.requests.avgResponseTime > thresholds.responseTimeWarning) {
      this.createAlert({
        severity: 'warning',
        type: 'performance',
        message: `Response time high: ${metrics.requests.avgResponseTime.toFixed(1)}ms`,
        metrics
      });
    }

    // Error rate alerts
    const errorRate = (metrics.requests.failed / metrics.requests.total) * 100;
    if (errorRate > thresholds.errorRateCritical) {
      this.createAlert({
        severity: 'critical',
        type: 'availability',
        message: `Error rate critical: ${errorRate.toFixed(1)}%`,
        metrics
      });
    } else if (errorRate > thresholds.errorRateWarning) {
      this.createAlert({
        severity: 'warning',
        type: 'availability',
        message: `Error rate high: ${errorRate.toFixed(1)}%`,
        metrics
      });
    }

    // Agent health alerts
    const healthyPercentage = (metrics.agents.healthy / metrics.agents.total) * 100;
    if (healthyPercentage < thresholds.agentHealthWarning) {
      this.createAlert({
        severity: 'warning',
        type: 'availability',
        message: `Agent health low: ${healthyPercentage.toFixed(1)}% healthy`,
        metrics
      });
    }
  }

  /**
   * Create and emit alert
   */
  private createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): void {
    const fullAlert: Alert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      ...alert
    };

    // Check if similar alert already exists and is unresolved
    const existingSimilar = Array.from(this.alerts.values()).find(a =>
      !a.resolved &&
      a.type === alert.type &&
      a.severity === alert.severity &&
      this.isSimilarAlert(a.message, alert.message)
    );

    if (existingSimilar) {
      // Update existing alert timestamp instead of creating new one
      existingSimilar.timestamp = fullAlert.timestamp;
      return;
    }

    this.alerts.set(fullAlert.id, fullAlert);

    // Send alert through configured channels
    this.sendAlert(fullAlert);

    this.emit('alert_created', { alert: fullAlert });
  }

  /**
   * Check if two alerts are similar (to avoid spam)
   */
  private isSimilarAlert(message1: string, message2: string): boolean {
    // Extract the alert type from messages
    const type1 = message1.split(':')[0];
    const type2 = message2.split(':')[0];
    return type1 === type2;
  }

  /**
   * Send alert through configured channels
   */
  private sendAlert(alert: Alert): void {
    for (const channel of this.config.alerts.channels) {
      switch (channel) {
        case 'console':
          const prefix = alert.severity === 'critical' ? '🚨' :
                        alert.severity === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`${prefix} [${alert.severity.toUpperCase()}] ${alert.message}`);
          break;

        case 'metrics':
          this.emit('alert_notification', { alert, channel });
          break;

        case 'webhook':
        case 'email':
          // In a real implementation, these would send actual notifications
          this.emit('alert_notification', { alert, channel });
          break;
      }
    }
  }

  /**
   * Perform actual scaling operation
   */
  private async performScaling(action: 'scale_up' | 'scale_down', targetInstances: number): Promise<void> {
    // In a real implementation, this would interact with container orchestration
    // (Kubernetes, Docker Swarm, etc.) or cloud auto-scaling services
    
    console.log(`🔄 Performing ${action} to ${targetInstances} instances`);
    
    // Simulate scaling delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
    // Simulate occasional scaling failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Scaling operation failed');
    }
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - this.config.monitoring.retentionPeriod);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);

    // Clean up old alerts (keep resolved alerts for 1 hour)
    const alertCutoffTime = new Date(Date.now() - (60 * 60 * 1000));
    for (const [id, alert] of this.alerts) {
      if (alert.resolved && alert.resolved < alertCutoffTime) {
        this.alerts.delete(id);
      }
    }
  }

  /**
   * Calculate average metrics for a period
   */
  private calculateAverageMetrics(metrics: PerformanceMetrics[]): Partial<PerformanceMetrics> {
    if (metrics.length === 0) return {};

    const sums = metrics.reduce((acc, m) => ({
      cpuUsage: acc.cpuUsage + m.cpu.usage,
      memoryUsage: acc.memoryUsage + m.memory.percentage,
      responseTime: acc.responseTime + m.requests.avgResponseTime,
      rps: acc.rps + m.requests.rps,
      errorRate: acc.errorRate + ((m.requests.failed / m.requests.total) * 100)
    }), { cpuUsage: 0, memoryUsage: 0, responseTime: 0, rps: 0, errorRate: 0 });

    const count = metrics.length;
    return {
      cpu: { usage: sums.cpuUsage / count } as any,
      memory: { percentage: sums.memoryUsage / count } as any,
      requests: {
        avgResponseTime: sums.responseTime / count,
        rps: sums.rps / count
      } as any
    };
  }

  /**
   * Calculate minimum metrics for a period
   */
  private calculateMinMetrics(metrics: PerformanceMetrics[]): Partial<PerformanceMetrics> {
    if (metrics.length === 0) return {};

    return {
      cpu: { usage: Math.min(...metrics.map(m => m.cpu.usage)) } as any,
      memory: { percentage: Math.min(...metrics.map(m => m.memory.percentage)) } as any,
      requests: { avgResponseTime: Math.min(...metrics.map(m => m.requests.avgResponseTime)) } as any
    };
  }

  /**
   * Calculate maximum metrics for a period
   */
  private calculateMaxMetrics(metrics: PerformanceMetrics[]): Partial<PerformanceMetrics> {
    if (metrics.length === 0) return {};

    return {
      cpu: { usage: Math.max(...metrics.map(m => m.cpu.usage)) } as any,
      memory: { percentage: Math.max(...metrics.map(m => m.memory.percentage)) } as any,
      requests: { avgResponseTime: Math.max(...metrics.map(m => m.requests.avgResponseTime)) } as any
    };
  }

  /**
   * Calculate trend for metrics
   */
  private calculateTrend(metrics: PerformanceMetrics[]): 'up' | 'down' | 'stable' {
    if (metrics.length < 2) return 'stable';

    const recent = metrics.slice(-5); // Last 5 data points
    const older = metrics.slice(-10, -5); // Previous 5 data points

    const recentAvgCpu = recent.reduce((sum, m) => sum + m.cpu.usage, 0) / recent.length;
    const olderAvgCpu = older.length > 0 ? older.reduce((sum, m) => sum + m.cpu.usage, 0) / older.length : recentAvgCpu;

    const cpuTrend = recentAvgCpu - olderAvgCpu;

    if (Math.abs(cpuTrend) < 5) return 'stable';
    return cpuTrend > 0 ? 'up' : 'down';
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Stop monitoring and cleanup
   */
  stop(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }

    this.emit('monitoring_stopped');
  }
}

/**
 * Load Prediction Model for predictive auto-scaling
 */
class LoadPredictionModel {
  private dataPoints: PerformanceMetrics[] = [];
  private readonly maxDataPoints = 288; // 24 hours of 5-minute intervals

  addDataPoint(metrics: PerformanceMetrics): void {
    this.dataPoints.push(metrics);
    if (this.dataPoints.length > this.maxDataPoints) {
      this.dataPoints = this.dataPoints.slice(-this.maxDataPoints);
    }
  }

  async predict(recentMetrics: PerformanceMetrics[]): Promise<{
    futureLoad: number;
    timeHorizon: number;
    confidence: number;
  }> {
    if (this.dataPoints.length < 10) {
      return {
        futureLoad: 1.0,
        timeHorizon: 15,
        confidence: 0.3
      };
    }

    // Simple trend-based prediction
    // In a real implementation, this could use machine learning models
    const recent = this.dataPoints.slice(-6); // Last 30 minutes
    const older = this.dataPoints.slice(-12, -6); // Previous 30 minutes

    const recentAvgRps = recent.reduce((sum, m) => sum + m.requests.rps, 0) / recent.length;
    const olderAvgRps = older.length > 0 ? older.reduce((sum, m) => sum + m.requests.rps, 0) / older.length : recentAvgRps;

    const trend = recentAvgRps / Math.max(olderAvgRps, 1);
    
    // Apply some smoothing and bounds
    const futureLoad = Math.max(0.5, Math.min(3.0, trend * 1.2));
    
    // Confidence based on data stability
    const variance = this.calculateVariance(recent.map(m => m.requests.rps));
    const confidence = Math.max(0.1, Math.min(0.9, 1 - (variance / recentAvgRps)));

    return {
      futureLoad,
      timeHorizon: 15,
      confidence
    };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}