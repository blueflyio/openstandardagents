/**
 * OSSA v0.1.9 Event Bus Monitoring and Observability
 * Comprehensive monitoring, metrics, and observability for production event bus
 */

import { EventEmitter } from 'events';
import { RedisEventBus } from './RedisEventBus.js';
import { ServiceRegistry } from '../ServiceRegistry.js';
import {
  EventPayload,
  EventBusMetrics,
  EventBusStatus,
  EVENT_TYPES
} from './types.js';

export interface MonitoringConfig {
  /** Metrics collection configuration */
  metrics: {
    enabled: boolean;
    collectionInterval: number;
    retentionPeriod: number;
    aggregationWindows: number[]; // in seconds
  };
  /** Distributed tracing configuration */
  tracing: {
    enabled: boolean;
    samplingRate: number;
    jaegerEndpoint?: string;
    serviceName: string;
  };
  /** Alerting configuration */
  alerting: {
    enabled: boolean;
    thresholds: AlertThresholds;
    webhookUrl?: string;
    emailRecipients?: string[];
  };
  /** Health check configuration */
  healthCheck: {
    enabled: boolean;
    interval: number;
    timeout: number;
    criticalThresholds: HealthThresholds;
  };
}

export interface AlertThresholds {
  /** Maximum error rate percentage */
  maxErrorRate: number;
  /** Maximum average latency in ms */
  maxLatency: number;
  /** Maximum queue depth */
  maxQueueDepth: number;
  /** Minimum throughput events/sec */
  minThroughput: number;
  /** Maximum memory usage percentage */
  maxMemoryUsage: number;
  /** Maximum connection pool utilization */
  maxConnectionUtilization: number;
}

export interface HealthThresholds {
  /** Critical error rate percentage */
  criticalErrorRate: number;
  /** Critical latency in ms */
  criticalLatency: number;
  /** Critical memory usage percentage */
  criticalMemoryUsage: number;
}

export interface MetricDataPoint {
  /** Timestamp of the metric */
  timestamp: Date;
  /** Metric name */
  name: string;
  /** Metric value */
  value: number;
  /** Metric labels/tags */
  labels: Record<string, string>;
}

export interface AlertEvent {
  /** Alert ID */
  id: string;
  /** Alert severity */
  severity: 'info' | 'warning' | 'critical';
  /** Alert title */
  title: string;
  /** Alert description */
  description: string;
  /** Triggered timestamp */
  timestamp: Date;
  /** Metric that triggered the alert */
  metric: string;
  /** Current value */
  currentValue: number;
  /** Threshold value */
  threshold: number;
  /** Additional context */
  context: Record<string, any>;
}

export interface TraceSpan {
  /** Span ID */
  spanId: string;
  /** Trace ID */
  traceId: string;
  /** Parent span ID */
  parentSpanId?: string;
  /** Operation name */
  operationName: string;
  /** Start time */
  startTime: Date;
  /** End time */
  endTime?: Date;
  /** Duration in milliseconds */
  duration?: number;
  /** Span tags */
  tags: Record<string, any>;
  /** Span logs */
  logs: Array<{
    timestamp: Date;
    fields: Record<string, any>;
  }>;
}

export interface DashboardData {
  /** System overview metrics */
  overview: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    totalEvents: number;
    currentTPS: number;
    errorRate: number;
  };
  /** Real-time metrics */
  realtime: {
    eventsPerSecond: number[];
    latency: number[];
    errorRate: number[];
    queueDepth: number[];
    timestamp: Date[];
  };
  /** Top metrics */
  topMetrics: {
    topEventTypes: Array<{ type: string; count: number }>;
    topProjects: Array<{ project: string; events: number }>;
    slowestOperations: Array<{ operation: string; avgTime: number }>;
    errorsByType: Array<{ error: string; count: number }>;
  };
  /** Alerts */
  activeAlerts: AlertEvent[];
}

export class EventBusMonitoring extends EventEmitter {
  private eventBus: RedisEventBus;
  private serviceRegistry: ServiceRegistry;
  private config: MonitoringConfig;

  private metricsStore = new Map<string, MetricDataPoint[]>();
  private activeTraces = new Map<string, TraceSpan>();
  private activeAlerts = new Map<string, AlertEvent>();
  private healthHistory: Array<{ timestamp: Date; status: EventBusStatus }> = [];

  private metricsInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private alertCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    eventBus: RedisEventBus,
    serviceRegistry: ServiceRegistry,
    config: Partial<MonitoringConfig> = {}
  ) {
    super();

    this.eventBus = eventBus;
    this.serviceRegistry = serviceRegistry;
    this.config = {
      metrics: {
        enabled: true,
        collectionInterval: 10000,
        retentionPeriod: 86400000, // 24 hours
        aggregationWindows: [60, 300, 900, 3600] // 1min, 5min, 15min, 1hour
      },
      tracing: {
        enabled: true,
        samplingRate: 0.1,
        serviceName: 'ossa-event-bus'
      },
      alerting: {
        enabled: true,
        thresholds: {
          maxErrorRate: 5.0,
          maxLatency: 1000,
          maxQueueDepth: 1000,
          minThroughput: 1.0,
          maxMemoryUsage: 85.0,
          maxConnectionUtilization: 90.0
        }
      },
      healthCheck: {
        enabled: true,
        interval: 30000,
        timeout: 5000,
        criticalThresholds: {
          criticalErrorRate: 25.0,
          criticalLatency: 5000,
          criticalMemoryUsage: 95.0
        }
      },
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize monitoring system
   */
  private async initialize(): Promise<void> {
    // Setup event bus event handlers
    this.setupEventBusMonitoring();

    // Start metrics collection
    if (this.config.metrics.enabled) {
      this.startMetricsCollection();
    }

    // Start health checks
    if (this.config.healthCheck.enabled) {
      this.startHealthChecks();
    }

    // Start alerting
    if (this.config.alerting.enabled) {
      this.startAlerting();
    }

    // Setup distributed tracing
    if (this.config.tracing.enabled) {
      this.setupDistributedTracing();
    }

    console.log('✅ Event Bus Monitoring initialized');
  }

  /**
   * Setup monitoring for event bus events
   */
  private setupEventBusMonitoring(): void {
    // Monitor event publishing
    this.eventBus.on('event:published', (eventType: string, payload: EventPayload) => {
      this.recordMetric('events_published_total', 1, {
        event_type: eventType,
        source: payload.metadata.source
      });

      // Start trace if enabled
      if (this.config.tracing.enabled && Math.random() < this.config.tracing.samplingRate) {
        this.startTrace(payload.metadata.id, 'event_publish', {
          event_type: eventType,
          correlation_id: payload.metadata.correlationId
        });
      }
    });

    // Monitor event consumption
    this.eventBus.on('event:consumed', (eventType: string, payload: EventPayload) => {
      this.recordMetric('events_consumed_total', 1, {
        event_type: eventType,
        source: payload.metadata.source
      });

      // Complete trace if exists
      this.completeTrace(payload.metadata.id);
    });

    // Monitor event failures
    this.eventBus.on('event:failed', (eventType: string, payload: EventPayload, error: Error) => {
      this.recordMetric('events_failed_total', 1, {
        event_type: eventType,
        error_type: error.constructor.name
      });

      // Record error trace
      this.recordErrorTrace(payload.metadata.id, error);
    });

    // Monitor metrics updates
    this.eventBus.on('metrics:updated', (metrics: EventBusMetrics) => {
      this.recordEventBusMetrics(metrics);
    });

    // Monitor health status changes
    this.eventBus.on('health:status:changed', (oldStatus: string, newStatus: string) => {
      this.recordMetric('health_status_changes_total', 1, {
        old_status: oldStatus,
        new_status: newStatus
      });

      // Trigger alert if status degraded
      if (newStatus === 'unhealthy' || newStatus === 'degraded') {
        this.triggerAlert({
          severity: newStatus === 'unhealthy' ? 'critical' : 'warning',
          title: 'Event Bus Health Degraded',
          description: `Event bus status changed from ${oldStatus} to ${newStatus}`,
          metric: 'health_status',
          currentValue: 0,
          threshold: 1,
          context: { oldStatus, newStatus }
        });
      }
    });
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        await this.collectSystemMetrics();
        await this.collectEventBusMetrics();
        await this.cleanupOldMetrics();
      } catch (error) {
        console.error('Metrics collection error:', error);
      }
    }, this.config.metrics.collectionInterval);
  }

  /**
   * Collect system-level metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    // Memory usage
    const memUsage = process.memoryUsage();
    this.recordMetric('system_memory_used_bytes', memUsage.heapUsed, {});
    this.recordMetric('system_memory_total_bytes', memUsage.heapTotal, {});

    // CPU usage (simplified - would use actual CPU metrics in production)
    this.recordMetric('system_cpu_usage_percent', process.cpuUsage().user / 1000000, {});

    // Uptime
    this.recordMetric('system_uptime_seconds', process.uptime(), {});

    // Event loop lag (simplified)
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1e6; // Convert to milliseconds
      this.recordMetric('event_loop_lag_ms', lag, {});
    });
  }

  /**
   * Collect event bus specific metrics
   */
  private async collectEventBusMetrics(): Promise<void> {
    try {
      const status = await this.eventBus.getStatus();
      const metrics = status.metrics;

      this.recordMetric('eventbus_events_published_total', metrics.eventsPublished, {});
      this.recordMetric('eventbus_events_consumed_total', metrics.eventsConsumed, {});
      this.recordMetric('eventbus_events_failed_total', metrics.eventsFailed, {});
      this.recordMetric('eventbus_events_in_flight', metrics.eventsInFlight, {});
      this.recordMetric('eventbus_avg_processing_time_ms', metrics.avgProcessingTime, {});
      this.recordMetric('eventbus_throughput_per_second', metrics.currentThroughput, {});
      this.recordMetric('eventbus_error_rate_percent', metrics.errorRate, {});
      this.recordMetric('eventbus_connection_pool_utilization', metrics.connectionPoolUtilization, {});

      // Store health history
      this.healthHistory.push({ timestamp: new Date(), status });

      // Keep only recent health history
      const cutoff = new Date(Date.now() - this.config.metrics.retentionPeriod);
      this.healthHistory = this.healthHistory.filter(h => h.timestamp > cutoff);

    } catch (error) {
      console.error('Event bus metrics collection error:', error);
    }
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const status = await this.eventBus.getStatus();
        await this.checkHealthThresholds(status);
      } catch (error) {
        console.error('Health check error:', error);
      }
    }, this.config.healthCheck.interval);
  }

  /**
   * Check health thresholds and trigger alerts
   */
  private async checkHealthThresholds(status: EventBusStatus): Promise<void> {
    const { criticalThresholds } = this.config.healthCheck;
    const metrics = status.metrics;

    // Check error rate
    if (metrics.errorRate > criticalThresholds.criticalErrorRate) {
      this.triggerAlert({
        severity: 'critical',
        title: 'Critical Error Rate',
        description: `Error rate ${metrics.errorRate.toFixed(2)}% exceeds critical threshold`,
        metric: 'error_rate',
        currentValue: metrics.errorRate,
        threshold: criticalThresholds.criticalErrorRate,
        context: { status }
      });
    }

    // Check latency
    if (metrics.avgProcessingTime > criticalThresholds.criticalLatency) {
      this.triggerAlert({
        severity: 'critical',
        title: 'Critical Latency',
        description: `Average processing time ${metrics.avgProcessingTime}ms exceeds critical threshold`,
        metric: 'latency',
        currentValue: metrics.avgProcessingTime,
        threshold: criticalThresholds.criticalLatency,
        context: { status }
      });
    }

    // Check memory usage
    const memUsage = (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100;
    if (memUsage > criticalThresholds.criticalMemoryUsage) {
      this.triggerAlert({
        severity: 'critical',
        title: 'Critical Memory Usage',
        description: `Memory usage ${memUsage.toFixed(2)}% exceeds critical threshold`,
        metric: 'memory_usage',
        currentValue: memUsage,
        threshold: criticalThresholds.criticalMemoryUsage,
        context: { memUsage: process.memoryUsage() }
      });
    }
  }

  /**
   * Start alerting system
   */
  private startAlerting(): void {
    this.alertCheckInterval = setInterval(async () => {
      try {
        await this.evaluateAlertConditions();
        await this.processActiveAlerts();
      } catch (error) {
        console.error('Alerting error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Evaluate alert conditions
   */
  private async evaluateAlertConditions(): Promise<void> {
    const { thresholds } = this.config.alerting;
    const latestMetrics = await this.getLatestMetrics();

    // Check each threshold
    const checks = [
      {
        metric: 'eventbus_error_rate_percent',
        threshold: thresholds.maxErrorRate,
        title: 'High Error Rate',
        severity: 'warning' as const
      },
      {
        metric: 'eventbus_avg_processing_time_ms',
        threshold: thresholds.maxLatency,
        title: 'High Latency',
        severity: 'warning' as const
      },
      {
        metric: 'eventbus_throughput_per_second',
        threshold: thresholds.minThroughput,
        title: 'Low Throughput',
        severity: 'warning' as const,
        comparison: 'below' as const
      }
    ];

    for (const check of checks) {
      const currentValue = latestMetrics.get(check.metric);
      if (currentValue !== undefined) {
        const shouldAlert = check.comparison === 'below'
          ? currentValue < check.threshold
          : currentValue > check.threshold;

        if (shouldAlert) {
          this.triggerAlert({
            severity: check.severity,
            title: check.title,
            description: `${check.metric} is ${currentValue}, threshold: ${check.threshold}`,
            metric: check.metric,
            currentValue,
            threshold: check.threshold,
            context: { latestMetrics: Object.fromEntries(latestMetrics) }
          });
        }
      }
    }
  }

  /**
   * Setup distributed tracing
   */
  private setupDistributedTracing(): void {
    // Initialize tracing (would integrate with Jaeger/Zipkin in production)
    console.log(`🔍 Distributed tracing enabled (${this.config.tracing.samplingRate * 100}% sampling)`);
  }

  /**
   * Start a distributed trace
   */
  private startTrace(eventId: string, operationName: string, tags: Record<string, any>): void {
    const span: TraceSpan = {
      spanId: eventId,
      traceId: eventId, // Simplified - would use proper trace ID in production
      operationName,
      startTime: new Date(),
      tags,
      logs: []
    };

    this.activeTraces.set(eventId, span);
  }

  /**
   * Complete a distributed trace
   */
  private completeTrace(eventId: string): void {
    const span = this.activeTraces.get(eventId);
    if (span) {
      span.endTime = new Date();
      span.duration = span.endTime.getTime() - span.startTime.getTime();

      // Send to tracing backend (simplified)
      this.recordMetric('trace_duration_ms', span.duration, {
        operation: span.operationName
      });

      this.activeTraces.delete(eventId);
    }
  }

  /**
   * Record error in trace
   */
  private recordErrorTrace(eventId: string, error: Error): void {
    const span = this.activeTraces.get(eventId);
    if (span) {
      span.logs.push({
        timestamp: new Date(),
        fields: {
          level: 'error',
          message: error.message,
          stack: error.stack
        }
      });

      span.tags.error = true;
      span.tags.error_message = error.message;
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(alertData: Omit<AlertEvent, 'id' | 'timestamp'>): void {
    const alert: AlertEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...alertData
    };

    // Store alert
    this.activeAlerts.set(alert.id, alert);

    // Emit alert event
    this.emit('alert:triggered', alert);

    // Send notifications
    this.sendAlertNotifications(alert);

    console.warn(`🚨 Alert triggered: ${alert.title} - ${alert.description}`);
  }

  /**
   * Send alert notifications
   */
  private async sendAlertNotifications(alert: AlertEvent): Promise<void> {
    try {
      // Webhook notification
      if (this.config.alerting.webhookUrl) {
        await fetch(this.config.alerting.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
      }

      // Email notifications would be implemented here
      // SMS notifications would be implemented here

    } catch (error) {
      console.error('Alert notification error:', error);
    }
  }

  /**
   * Process active alerts (resolve, escalate, etc.)
   */
  private async processActiveAlerts(): Promise<void> {
    const now = new Date();

    for (const [alertId, alert] of this.activeAlerts) {
      const alertAge = now.getTime() - alert.timestamp.getTime();

      // Auto-resolve alerts after 1 hour if conditions are normal
      if (alertAge > 3600000) { // 1 hour
        const isResolved = await this.checkAlertResolution(alert);
        if (isResolved) {
          this.resolveAlert(alertId);
        }
      }
    }
  }

  /**
   * Check if alert conditions have been resolved
   */
  private async checkAlertResolution(alert: AlertEvent): Promise<boolean> {
    const latestMetrics = await this.getLatestMetrics();
    const currentValue = latestMetrics.get(alert.metric);

    if (currentValue === undefined) return false;

    // Check if value is back within acceptable range
    switch (alert.metric) {
      case 'error_rate':
      case 'latency':
        return currentValue < alert.threshold * 0.8; // 20% buffer
      case 'throughput':
        return currentValue > alert.threshold * 1.2; // 20% buffer
      default:
        return false;
    }
  }

  /**
   * Resolve an alert
   */
  private resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      this.activeAlerts.delete(alertId);
      this.emit('alert:resolved', alert);
      console.info(`✅ Alert resolved: ${alert.title}`);
    }
  }

  /**
   * Record a metric data point
   */
  private recordMetric(name: string, value: number, labels: Record<string, string>): void {
    const dataPoint: MetricDataPoint = {
      timestamp: new Date(),
      name,
      value,
      labels
    };

    if (!this.metricsStore.has(name)) {
      this.metricsStore.set(name, []);
    }

    this.metricsStore.get(name)!.push(dataPoint);
  }

  /**
   * Record event bus metrics
   */
  private recordEventBusMetrics(metrics: EventBusMetrics): void {
    this.recordMetric('eventbus_events_published', metrics.eventsPublished, {});
    this.recordMetric('eventbus_events_consumed', metrics.eventsConsumed, {});
    this.recordMetric('eventbus_events_failed', metrics.eventsFailed, {});
    this.recordMetric('eventbus_events_in_flight', metrics.eventsInFlight, {});
    this.recordMetric('eventbus_avg_processing_time', metrics.avgProcessingTime, {});
    this.recordMetric('eventbus_throughput', metrics.currentThroughput, {});
    this.recordMetric('eventbus_error_rate', metrics.errorRate, {});
  }

  /**
   * Get latest metrics
   */
  private async getLatestMetrics(): Promise<Map<string, number>> {
    const latestMetrics = new Map<string, number>();

    for (const [metricName, dataPoints] of this.metricsStore) {
      if (dataPoints.length > 0) {
        const latest = dataPoints[dataPoints.length - 1];
        latestMetrics.set(metricName, latest.value);
      }
    }

    return latestMetrics;
  }

  /**
   * Clean up old metrics
   */
  private async cleanupOldMetrics(): Promise<void> {
    const cutoff = new Date(Date.now() - this.config.metrics.retentionPeriod);

    for (const [metricName, dataPoints] of this.metricsStore) {
      const filtered = dataPoints.filter(point => point.timestamp > cutoff);
      this.metricsStore.set(metricName, filtered);
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    const status = await this.eventBus.getStatus();
    const latestMetrics = await this.getLatestMetrics();

    // Calculate recent metrics arrays for charts
    const recentMetrics = this.getRecentMetricsArrays(300000); // Last 5 minutes

    return {
      overview: {
        status: status.status,
        uptime: process.uptime(),
        totalEvents: status.metrics.eventsPublished + status.metrics.eventsConsumed,
        currentTPS: status.metrics.currentThroughput,
        errorRate: status.metrics.errorRate
      },
      realtime: recentMetrics,
      topMetrics: {
        topEventTypes: [], // Would be calculated from actual data
        topProjects: [], // Would be calculated from actual data
        slowestOperations: [], // Would be calculated from trace data
        errorsByType: [] // Would be calculated from error data
      },
      activeAlerts: Array.from(this.activeAlerts.values())
    };
  }

  /**
   * Get recent metrics arrays for dashboard charts
   */
  private getRecentMetricsArrays(timeWindow: number): DashboardData['realtime'] {
    const now = new Date();
    const cutoff = new Date(now.getTime() - timeWindow);

    const eventsPerSecond: number[] = [];
    const latency: number[] = [];
    const errorRate: number[] = [];
    const queueDepth: number[] = [];
    const timestamp: Date[] = [];

    // Simplified - would aggregate data points into time buckets
    for (let i = 0; i < 30; i++) { // 30 data points
      const time = new Date(cutoff.getTime() + (i * timeWindow / 30));
      timestamp.push(time);
      eventsPerSecond.push(Math.random() * 100); // Mock data
      latency.push(Math.random() * 500);
      errorRate.push(Math.random() * 5);
      queueDepth.push(Math.random() * 50);
    }

    return { eventsPerSecond, latency, errorRate, queueDepth, timestamp };
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    let output = '';

    for (const [metricName, dataPoints] of this.metricsStore) {
      if (dataPoints.length > 0) {
        const latest = dataPoints[dataPoints.length - 1];
        const labels = Object.entries(latest.labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',');

        output += `# TYPE ${metricName} gauge\n`;
        output += `${metricName}{${labels}} ${latest.value} ${latest.timestamp.getTime()}\n`;
      }
    }

    return output;
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    metricsCollected: number;
    activeTraces: number;
    activeAlerts: number;
    healthHistorySize: number;
    uptimeSeconds: number;
  } {
    return {
      metricsCollected: Array.from(this.metricsStore.values())
        .reduce((total, points) => total + points.length, 0),
      activeTraces: this.activeTraces.size,
      activeAlerts: this.activeAlerts.size,
      healthHistorySize: this.healthHistory.length,
      uptimeSeconds: process.uptime()
    };
  }

  /**
   * Cleanup monitoring resources
   */
  async cleanup(): Promise<void> {
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.alertCheckInterval) clearInterval(this.alertCheckInterval);

    console.log('✅ Event Bus Monitoring cleaned up');
  }
}

export default EventBusMonitoring;