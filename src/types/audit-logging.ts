/**
 * OSSA Audit Logging Types
 * Comprehensive audit logging for all agent actions
 *
 * Issue: #402 - Audit Logging for All Agent Actions
 * Priority: High (Security/Governance)
 */

/**
 * Audit event severity levels
 */
export enum AuditSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Audit event categories
 */
export enum AuditCategory {
  AGENT_ACTION = 'agent_action',
  API_CALL = 'api_call',
  MR_OPERATION = 'mr_operation',
  DEPLOYMENT = 'deployment',
  RELEASE = 'release',
  TOKEN_OPERATION = 'token_operation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  CONFIGURATION_CHANGE = 'configuration_change',
  DATA_ACCESS = 'data_access',
  SYSTEM_EVENT = 'system_event',
}

/**
 * Action outcome status
 */
export enum AuditOutcome {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL_SUCCESS = 'partial_success',
  DENIED = 'denied',
  TIMEOUT = 'timeout',
}

/**
 * Core audit event structure
 * Follows GitLab audit event format + CloudWatch best practices
 */
export interface AuditEvent {
  // Timestamp and identification
  timestamp: string; // ISO 8601 format
  trace_id: string; // Distributed tracing ID
  event_id: string; // Unique event identifier

  // Agent and user context
  agent_id: string; // e.g., '@mr-reviewer', '@deployment-agent'
  agent_version?: string; // Agent version
  user_id?: string; // GitLab user ID if applicable
  user_name?: string; // GitLab username if applicable

  // Action details
  action: string; // e.g., 'create_comment', 'merge_mr', 'deploy'
  category: AuditCategory;
  severity: AuditSeverity;

  // Resource information
  resource: string; // Full resource identifier
  resource_type: string; // e.g., 'merge_request', 'issue', 'deployment'
  resource_id?: string; // Resource-specific ID
  project?: string; // GitLab project path

  // Outcome
  outcome: AuditOutcome;
  duration_ms: number; // Action duration in milliseconds

  // Input/Output data (sanitized)
  input?: Record<string, unknown>; // Input parameters (PII-safe)
  output?: Record<string, unknown>; // Output data (PII-safe)

  // Error details (if applicable)
  error?: {
    code?: string;
    message: string;
    stack_trace?: string;
  };

  // Metadata
  metadata?: {
    ip_address?: string;
    user_agent?: string;
    api_endpoint?: string;
    http_method?: string;
    http_status?: number;
    tokens_used?: number; // LLM token usage
    cost?: number; // Estimated cost
    [key: string]: unknown;
  };

  // Compliance and governance
  compliance?: {
    requires_approval?: boolean;
    approval_chain?: string[];
    policy_checked?: boolean;
    policy_violations?: string[];
  };
}

/**
 * Audit log configuration
 */
export interface AuditLogConfig {
  // Enable/disable audit logging
  enabled: boolean;

  // Log level filtering
  min_severity: AuditSeverity;

  // Transports configuration
  transports: {
    console?: {
      enabled: boolean;
      format?: 'json' | 'pretty';
    };
    cloudwatch?: {
      enabled: boolean;
      region: string;
      log_group: string;
      log_stream_prefix?: string;
      retention_days?: number;
    };
    s3?: {
      enabled: boolean;
      region: string;
      bucket: string;
      prefix?: string; // S3 key prefix
      retention_days?: number; // 7 years = 2555 days
      compression?: boolean; // gzip compression
    };
    file?: {
      enabled: boolean;
      directory: string;
      filename_pattern?: string; // e.g., 'audit-{date}.jsonl'
      rotation?: 'daily' | 'weekly' | 'monthly';
      max_file_size_mb?: number;
    };
    gitlab_audit_events?: {
      enabled: boolean;
      gitlab_url: string;
      gitlab_token: string;
      project_id: string;
    };
  };

  // Data sanitization
  sanitization?: {
    enabled: boolean;
    pii_fields?: string[]; // Fields to redact
    sensitive_patterns?: string[]; // Regex patterns to redact
    max_input_size?: number; // Max bytes to log
    max_output_size?: number; // Max bytes to log
  };

  // Filtering
  filters?: {
    include_categories?: AuditCategory[];
    exclude_categories?: AuditCategory[];
    include_agents?: string[];
    exclude_agents?: string[];
    include_actions?: string[];
    exclude_actions?: string[];
  };

  // Performance
  performance?: {
    async_logging?: boolean; // Log asynchronously
    batch_size?: number; // Batch events before writing
    batch_timeout_ms?: number; // Max time to wait for batch
    buffer_size?: number; // Max events in memory buffer
  };

  // Alerts (integration with Grafana/AlertManager)
  alerts?: {
    enabled: boolean;
    rules?: AuditAlertRule[];
  };
}

/**
 * Alert rule configuration
 */
export interface AuditAlertRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;

  // Trigger conditions
  condition: {
    category?: AuditCategory[];
    action?: string[];
    outcome?: AuditOutcome[];
    severity?: AuditSeverity[];
    threshold?: {
      count: number; // Number of events
      window_seconds: number; // Time window
    };
  };

  // Notification channels
  notifications: {
    channels: Array<'slack' | 'email' | 'pagerduty' | 'webhook'>;
    recipients?: string[];
    webhook_url?: string;
    message_template?: string;
  };

  // Alert metadata
  priority: 'low' | 'medium' | 'high' | 'critical';
  auto_resolve?: boolean;
  cooldown_seconds?: number;
}

/**
 * Audit query parameters for CloudWatch Insights
 */
export interface AuditQuery {
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601

  // Filters
  agent_id?: string;
  user_id?: string;
  action?: string;
  category?: AuditCategory;
  severity?: AuditSeverity;
  outcome?: AuditOutcome;
  resource_type?: string;
  project?: string;

  // Search
  search_term?: string; // Full-text search

  // Pagination
  limit?: number;
  offset?: number;

  // Sorting
  sort_by?: 'timestamp' | 'duration_ms' | 'severity';
  sort_order?: 'asc' | 'desc';
}

/**
 * Audit query result
 */
export interface AuditQueryResult {
  events: AuditEvent[];
  total_count: number;
  query_time_ms: number;
  next_token?: string; // For pagination
}

/**
 * Audit dashboard metrics
 */
export interface AuditMetrics {
  time_range: {
    start: string;
    end: string;
  };

  summary: {
    total_events: number;
    total_agents: number;
    total_users: number;
    success_rate: number; // Percentage
    average_duration_ms: number;
  };

  by_category: Record<AuditCategory, number>;
  by_severity: Record<AuditSeverity, number>;
  by_outcome: Record<AuditOutcome, number>;
  by_agent: Record<string, number>;
  by_action: Record<string, number>;

  top_errors: Array<{
    error_code: string;
    count: number;
    percentage: number;
  }>;

  performance: {
    p50_duration_ms: number;
    p95_duration_ms: number;
    p99_duration_ms: number;
    slowest_actions: Array<{
      action: string;
      avg_duration_ms: number;
    }>;
  };

  anomalies?: Array<{
    type: string;
    description: string;
    severity: AuditSeverity;
    detected_at: string;
  }>;
}

/**
 * Audit retention policy
 */
export interface AuditRetentionPolicy {
  enabled: boolean;

  rules: Array<{
    name: string;
    description?: string;

    // Matching criteria
    match: {
      category?: AuditCategory[];
      severity?: AuditSeverity[];
      age_days?: number;
    };

    // Action
    action: 'archive' | 'delete' | 'move_to_glacier';

    // Retention period
    retain_days: number; // 2555 days = 7 years for compliance

    // Priority (higher priority rules are evaluated first)
    priority: number;
  }>;

  // Archive configuration
  archive?: {
    enabled: boolean;
    destination: 's3' | 'glacier';
    bucket: string;
    prefix?: string;
    encryption?: boolean;
  };
}

/**
 * Export audit logs
 */
export interface AuditExportRequest {
  query: AuditQuery;
  format: 'json' | 'csv' | 'parquet';
  compression?: 'gzip' | 'zip' | 'none';
  destination?: {
    type: 's3' | 'email' | 'download';
    location?: string; // S3 bucket or email address
  };
}

/**
 * Audit export result
 */
export interface AuditExportResult {
  export_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;

  query: AuditQuery;
  format: string;

  result?: {
    file_path?: string;
    file_size_bytes?: number;
    record_count?: number;
    download_url?: string;
    expiry?: string; // Pre-signed URL expiry
  };

  error?: {
    code: string;
    message: string;
  };
}
