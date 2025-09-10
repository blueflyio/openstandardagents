/**
 * OSSA Telemetry System Types
 * 
 * Comprehensive type definitions for real-time KPI monitoring,
 * scorecard systems, and 99.97% uptime validation across 127 production agents.
 */

export interface TelemetryMetric {
  /** Unique metric identifier */
  id: string;
  /** Metric name for display and aggregation */
  name: string;
  /** Current value of the metric */
  value: number;
  /** Unit of measurement (requests/sec, ms, %, etc.) */
  unit: string;
  /** Timestamp when metric was collected */
  timestamp: Date;
  /** Labels for metric categorization */
  labels: Record<string, string>;
  /** Metric type classification */
  type: MetricType;
}

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary'
}

export interface KPIDefinition {
  /** KPI identifier */
  id: string;
  /** Human-readable KPI name */
  name: string;
  /** Description of what this KPI measures */
  description: string;
  /** Target value for this KPI */
  target: number;
  /** Critical threshold (alerts triggered below this) */
  critical: number;
  /** Warning threshold */
  warning: number;
  /** Unit of measurement */
  unit: string;
  /** Calculation method for this KPI */
  calculation: KPICalculation;
  /** Update frequency in milliseconds */
  updateInterval: number;
  /** Tags for categorization */
  tags: string[];
}

export enum KPICalculation {
  AVG = 'average',
  SUM = 'sum',
  MIN = 'minimum',
  MAX = 'maximum',
  PERCENTILE_95 = 'p95',
  PERCENTILE_99 = 'p99',
  RATE = 'rate',
  UPTIME = 'uptime'
}

export interface AgentScorecard {
  /** Agent identifier */
  agentId: string;
  /** Agent name or description */
  agentName: string;
  /** Overall health score (0-100) */
  healthScore: number;
  /** Individual metric scores */
  metrics: {
    availability: number;
    performance: number;
    reliability: number;
    compliance: number;
  };
  /** Current status */
  status: AgentStatus;
  /** Last update timestamp */
  lastUpdate: Date;
  /** SLA compliance percentage */
  slaCompliance: number;
  /** Error count in current period */
  errorCount: number;
  /** Average response time in milliseconds */
  avgResponseTime: number;
  /** Throughput (requests per second) */
  throughput: number;
}

export enum AgentStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance'
}

export interface UptimeMetrics {
  /** Total uptime percentage */
  overallUptime: number;
  /** Current SLA target (99.97%) */
  slaTarget: number;
  /** Current period start time */
  periodStart: Date;
  /** Total downtime in current period (minutes) */
  totalDowntime: number;
  /** Number of incidents in current period */
  incidentCount: number;
  /** Mean Time To Recovery (MTTR) in minutes */
  mttr: number;
  /** Mean Time Between Failures (MTBF) in hours */
  mtbf: number;
}

export interface TelemetryAlert {
  /** Unique alert identifier */
  id: string;
  /** Alert severity level */
  severity: AlertSeverity;
  /** Alert title/summary */
  title: string;
  /** Detailed alert message */
  message: string;
  /** Agent ID that triggered the alert */
  agentId?: string;
  /** KPI that triggered the alert */
  kpiId?: string;
  /** Timestamp when alert was triggered */
  timestamp: Date;
  /** Alert status */
  status: AlertStatus;
  /** Alert acknowledgment info */
  ack?: {
    by: string;
    at: Date;
    comment?: string;
  };
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed'
}

export interface TelemetryConfiguration {
  /** Telemetry system configuration */
  system: {
    /** Enable/disable telemetry collection */
    enabled: boolean;
    /** Collection interval in milliseconds */
    collectionInterval: number;
    /** Data retention period in days */
    retentionDays: number;
    /** Maximum metrics per agent */
    maxMetricsPerAgent: number;
  };
  
  /** KPI configuration */
  kpis: KPIDefinition[];
  
  /** Alert configuration */
  alerts: {
    /** Enable/disable alerting */
    enabled: boolean;
    /** Alert channels configuration */
    channels: AlertChannel[];
    /** Alert rules */
    rules: AlertRule[];
  };
  
  /** Export configuration */
  exports: {
    /** Prometheus endpoint configuration */
    prometheus?: {
      enabled: boolean;
      port: number;
      path: string;
    };
    /** InfluxDB configuration */
    influxdb?: {
      enabled: boolean;
      url: string;
      database: string;
      username?: string;
      password?: string;
    };
    /** Custom webhook configuration */
    webhook?: {
      enabled: boolean;
      url: string;
      headers?: Record<string, string>;
    };
  };
}

export interface AlertChannel {
  /** Channel identifier */
  id: string;
  /** Channel type */
  type: 'email' | 'slack' | 'webhook' | 'pagerduty';
  /** Channel configuration */
  config: Record<string, any>;
  /** Enable/disable this channel */
  enabled: boolean;
}

export interface AlertRule {
  /** Rule identifier */
  id: string;
  /** Rule name */
  name: string;
  /** KPI ID this rule monitors */
  kpiId: string;
  /** Alert condition */
  condition: AlertCondition;
  /** Alert severity for this rule */
  severity: AlertSeverity;
  /** Channels to notify */
  channels: string[];
  /** Enable/disable this rule */
  enabled: boolean;
  /** Cooldown period in minutes */
  cooldown: number;
}

export interface AlertCondition {
  /** Comparison operator */
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
  /** Threshold value */
  threshold: number;
  /** Duration the condition must persist (minutes) */
  duration: number;
}

export interface TelemetryDataPoint {
  /** Metric identifier */
  metricId: string;
  /** Metric value */
  value: number;
  /** Collection timestamp */
  timestamp: Date;
  /** Agent identifier */
  agentId?: string;
  /** Additional labels */
  labels?: Record<string, string>;
}

export interface TelemetryQuery {
  /** Query identifier */
  id?: string;
  /** Metrics to query */
  metrics: string[];
  /** Agent IDs to filter (optional) */
  agentIds?: string[];
  /** Start time for query range */
  startTime?: Date;
  /** End time for query range */
  endTime?: Date;
  /** Time interval for aggregation */
  interval?: string;
  /** Aggregation function */
  aggregation?: KPICalculation;
  /** Labels to filter by */
  labels?: Record<string, string>;
}

export interface TelemetryQueryResult {
  /** Query that produced this result */
  query: TelemetryQuery;
  /** Result data points */
  data: TelemetryDataPoint[];
  /** Query execution metadata */
  metadata: {
    /** Query execution time in milliseconds */
    executionTime: number;
    /** Total data points returned */
    totalPoints: number;
    /** Query timestamp */
    timestamp: Date;
  };
}

export interface TelemetryHealthCheck {
  /** Overall system health */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Number of active agents */
  activeAgents: number;
  /** Number of total agents monitored */
  totalAgents: number;
  /** Current uptime percentage */
  currentUptime: number;
  /** SLA compliance status */
  slaCompliance: {
    current: number;
    target: number;
    status: 'compliant' | 'at-risk' | 'breach';
  };
  /** Active alerts count by severity */
  activeAlerts: {
    critical: number;
    warning: number;
    info: number;
  };
  /** System performance metrics */
  performance: {
    avgResponseTime: number;
    totalThroughput: number;
    errorRate: number;
  };
  /** Check timestamp */
  timestamp: Date;
}

export interface TelemetrySnapshot {
  /** Snapshot timestamp */
  timestamp: Date;
  /** All agent scorecards */
  scorecards: AgentScorecard[];
  /** Current KPI values */
  kpis: Record<string, number>;
  /** Overall uptime metrics */
  uptime: UptimeMetrics;
  /** System health check */
  health: TelemetryHealthCheck;
  /** Recent alerts */
  recentAlerts: TelemetryAlert[];
}

// Event types for real-time updates
export interface TelemetryEvent {
  /** Event type */
  type: TelemetryEventType;
  /** Event payload */
  payload: any;
  /** Event timestamp */
  timestamp: Date;
  /** Source agent ID (if applicable) */
  agentId?: string;
}

export enum TelemetryEventType {
  METRIC_UPDATED = 'metric_updated',
  AGENT_STATUS_CHANGED = 'agent_status_changed',
  ALERT_TRIGGERED = 'alert_triggered',
  ALERT_RESOLVED = 'alert_resolved',
  SLA_BREACH = 'sla_breach',
  SYSTEM_HEALTH_CHANGED = 'system_health_changed'
}

// Callback types for event handling
export type TelemetryEventCallback = (event: TelemetryEvent) => void;
export type MetricUpdateCallback = (metric: TelemetryMetric) => void;
export type AlertCallback = (alert: TelemetryAlert) => void;
export type HealthCheckCallback = (health: TelemetryHealthCheck) => void;