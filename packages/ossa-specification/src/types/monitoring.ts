/**
 * OSSA Monitoring Type Definitions
 */

export interface MonitoringConfig {
  /** Enable IO awareness tracking */
  io_aware?: boolean;
  /** Log configuration */
  logs?: LogConfiguration;
  /** Metrics configuration */
  metrics?: MetricsConfiguration;
  /** Trace configuration */
  traces?: TraceConfiguration;
  /** Health check configuration */
  health?: HealthConfiguration;
  /** Alert configuration */
  alerts?: AlertConfiguration;
  /** Data redaction configuration */
  redaction?: RedactionConfiguration;
  /** Data retention configuration */
  retention?: RetentionConfiguration;
}

// Logging Types
export interface LogConfiguration {
  /** Enable logging */
  enabled?: boolean;
  /** Log level */
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  /** Log format */
  format?: 'json' | 'jsonl' | 'text' | 'structured';
  /** Log outputs */
  outputs?: LogOutput[];
  /** Sampling configuration */
  sampling?: SamplingConfig;
  /** Context configuration */
  context?: {
    include_trace_id?: boolean;
    include_span_id?: boolean;
    include_agent_id?: boolean;
    include_capability?: boolean;
    custom_fields?: Record<string, string>;
  };
}

export interface LogOutput {
  /** Output type */
  type: 'console' | 'file' | 'syslog' | 'http' | 'kafka' | 'elasticsearch';
  /** Output configuration */
  config?: {
    path?: string;
    url?: string;
    topic?: string;
    rotation?: 'daily' | 'hourly' | 'size';
    max_size?: string;
    max_files?: number;
  };
}

// Metrics Types
export interface MetricsConfiguration {
  /** Enable metrics */
  enabled?: boolean;
  /** Metrics endpoint path */
  endpoint?: string;
  /** Metrics format */
  format?: 'prometheus' | 'openmetrics' | 'json';
  /** Collection interval in seconds */
  interval?: number;
  /** Metrics exporters */
  exporters?: MetricsExporter[];
  /** Custom metrics */
  custom_metrics?: CustomMetric[];
}

export interface MetricsExporter {
  /** Exporter type */
  type: 'prometheus' | 'datadog' | 'newrelic' | 'cloudwatch' | 'otlp';
  /** Exporter endpoint */
  endpoint?: string;
  /** Export interval in seconds */
  interval?: number;
  /** Additional configuration */
  config?: Record<string, unknown>;
}

export interface CustomMetric {
  /** Metric name */
  name: string;
  /** Metric type */
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  /** Metric description */
  description?: string;
  /** Metric labels */
  labels?: string[];
  /** Histogram buckets */
  buckets?: number[];
}

// Tracing Types
export interface TraceConfiguration {
  /** Enable tracing */
  enabled?: boolean;
  /** Trace format */
  format?: 'jsonl' | 'otlp' | 'jaeger' | 'zipkin' | 'datadog';
  /** Trace collector endpoint */
  endpoint?: string;
  /** Sampling configuration */
  sampling?: TraceSamplingConfig;
  /** Propagation formats */
  propagation?: ('tracecontext' | 'baggage' | 'b3' | 'b3multi' | 'jaeger' | 'xray')[];
  /** IO capture configuration */
  io_capture?: {
    enabled?: boolean;
    max_input_size?: string;
    max_output_size?: string;
    truncate?: boolean;
  };
}

export interface TraceSamplingConfig {
  /** Sampling type */
  type?: 'always' | 'never' | 'probabilistic' | 'ratelimited' | 'adaptive';
  /** Sampling rate for probabilistic sampling */
  rate?: number;
  /** Max traces per second for rate-limited sampling */
  max_per_second?: number;
}

export interface SamplingConfig {
  /** Enable sampling */
  enabled?: boolean;
  /** Overall sampling rate */
  rate?: number;
  /** Per-level sampling rules */
  rules?: Array<{
    level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    rate?: number;
  }>;
}

// Health Check Types
export interface HealthConfiguration {
  /** Enable health checks */
  enabled?: boolean;
  /** Health check endpoint */
  endpoint?: string;
  /** Check interval in seconds */
  interval?: number;
  /** Health checks */
  checks?: HealthCheck[];
  /** Readiness configuration */
  readiness?: ReadinessConfig;
  /** Liveness configuration */
  liveness?: LivenessConfig;
}

export interface HealthCheck {
  /** Check name */
  name: string;
  /** Check type */
  type: 'http' | 'tcp' | 'exec' | 'grpc' | 'custom';
  /** Check configuration */
  config?: {
    url?: string;
    port?: number;
    command?: string;
    timeout?: number;
    interval?: number;
  };
  /** Critical check flag */
  critical?: boolean;
}

export interface ReadinessConfig {
  /** Readiness endpoint */
  endpoint?: string;
  /** Initial delay in seconds */
  initial_delay?: number;
  /** Check period in seconds */
  period?: number;
}

export interface LivenessConfig {
  /** Liveness endpoint */
  endpoint?: string;
  /** Initial delay in seconds */
  initial_delay?: number;
  /** Check period in seconds */
  period?: number;
  /** Failure threshold */
  failure_threshold?: number;
}

// Alert Types
export interface AlertConfiguration {
  /** Enable alerts */
  enabled?: boolean;
  /** Alert channels */
  channels?: AlertChannel[];
  /** Alert rules */
  rules?: AlertRule[];
}

export interface AlertChannel {
  /** Channel name */
  name: string;
  /** Channel type */
  type: 'email' | 'slack' | 'webhook' | 'pagerduty' | 'opsgenie';
  /** Channel configuration */
  config?: Record<string, unknown>;
}

export interface AlertRule {
  /** Rule name */
  name: string;
  /** Alert condition expression */
  condition: string;
  /** Alert severity */
  severity?: 'critical' | 'high' | 'medium' | 'low';
  /** Target channels */
  channels?: string[];
  /** Throttle period in seconds */
  throttle?: number;
}

// Redaction Types
export interface RedactionConfiguration {
  /** Enable redaction */
  enabled?: boolean;
  /** Redaction patterns */
  patterns?: RedactionPattern[];
  /** Default replacement text */
  replacement?: string;
}

export interface RedactionPattern {
  /** Regex pattern to match */
  pattern: string;
  /** Pattern name */
  name?: string;
  /** Custom replacement text */
  replacement?: string;
  /** Scope of redaction */
  scope?: ('logs' | 'traces' | 'metrics' | 'all')[];
}

// Retention Types
export interface RetentionConfiguration {
  /** Log retention */
  logs?: RetentionPolicy;
  /** Metrics retention */
  metrics?: RetentionPolicy;
  /** Traces retention */
  traces?: RetentionPolicy;
}

export interface RetentionPolicy {
  /** Retention duration (e.g., '30d', '1y') */
  duration?: string;
  /** Archive configuration */
  archive?: {
    enabled?: boolean;
    location?: string;
    after?: string;
  };
  /** Delete after retention period */
  delete?: boolean;
}

// Monitoring utilities
export function createBasicMonitoring(): MonitoringConfig {
  return {
    logs: {
      enabled: true,
      level: 'info',
      format: 'jsonl'
    },
    metrics: {
      enabled: true,
      endpoint: '/metrics',
      format: 'prometheus'
    },
    health: {
      enabled: true,
      endpoint: '/health'
    }
  };
}

export function createIOAwareMonitoring(): MonitoringConfig {
  return {
    io_aware: true,
    logs: {
      enabled: true,
      level: 'debug',
      format: 'jsonl',
      context: {
        include_trace_id: true,
        include_span_id: true,
        include_agent_id: true,
        include_capability: true
      }
    },
    traces: {
      enabled: true,
      format: 'otlp',
      io_capture: {
        enabled: true,
        max_input_size: '1MB',
        max_output_size: '1MB',
        truncate: true
      }
    },
    redaction: {
      enabled: true,
      patterns: [
        { pattern: 'pii.*', scope: ['all'] },
        { pattern: 'secret.*', scope: ['all'] },
        { pattern: 'password.*', scope: ['all'] }
      ],
      replacement: '[REDACTED]'
    }
  };
}

export function isIOAwareEnabled(config: MonitoringConfig): boolean {
  return config.io_aware === true;
}

export function hasAdvancedMonitoring(config: MonitoringConfig): boolean {
  return !!(
    config.traces?.enabled &&
    config.metrics?.custom_metrics?.length &&
    config.alerts?.enabled
  );
}