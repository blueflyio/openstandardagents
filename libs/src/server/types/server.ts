/**
 * OSSA Server Types
 * Complete TypeScript type definitions for the OSSA server implementation
 */

// Server Configuration Types
export interface OSSAConfig {
  port: number;
  environment: string;
  database: DatabaseConfig;
  redis?: RedisConfig;
  cors?: CorsConfig;
  rateLimit?: RateLimitConfig;
  oauth?: OAuthConfig;
  webhooks?: WebhookConfig;
  execution?: ExecutionConfig;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pool?: {
    min?: number;
    max?: number;
    idle?: number;
  };
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  cluster?: boolean;
}

export interface CorsConfig {
  origins: string[];
  credentials?: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  skipSuccessfulRequests?: boolean;
}

export interface OAuthConfig {
  clientId?: string;
  clientSecret?: string;
  issuer?: string;
  audience?: string;
  algorithms?: string[];
}

export interface WebhookConfig {
  secret: string;
  timeout: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface ExecutionConfig {
  timeout: number;
  maxConcurrent: number;
  retryAttempts: number;
  resourceLimits?: {
    cpu?: string;
    memory?: string;
    disk?: string;
  };
}

// Health Check Types
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    webhooks: HealthCheck;
    external_apis: HealthCheck;
  };
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
  details?: Record<string, any>;
}

// Request/Response Types
export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  correlation_id: string;
  timestamp: string;
  path?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
  filters?: Record<string, any>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  has_next: boolean;
  has_previous: boolean;
  total_pages: number;
}

// Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  organization_id: string;
  roles: string[];
  permissions: string[];
  scopes: string[];
}

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  org_id: string;
  roles: string[];
  permissions: string[];
  scopes: string[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// Webhook Types
export interface WebhookEvent {
  event_type: string;
  event_id: string;
  timestamp: string;
  organization_id?: string;
  user_id?: string;
  data: Record<string, any>;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: WebhookEvent;
  url: string;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  last_attempt: string;
  next_attempt?: string;
  response_status?: number;
  response_headers?: Record<string, string>;
  response_body?: string;
  error?: string;
}

// Metrics Types
export interface ServerMetrics {
  requests: RequestMetrics;
  performance: PerformanceMetrics;
  errors: ErrorMetrics;
  agents: AgentMetrics;
  executions: ExecutionMetrics;
}

export interface RequestMetrics {
  total: number;
  per_endpoint: Record<string, number>;
  per_method: Record<string, number>;
  per_status_code: Record<number, number>;
  average_response_time: number;
  percentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
}

export interface PerformanceMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: {
    bytes_in: number;
    bytes_out: number;
  };
  gc_metrics: {
    collections: number;
    time_spent: number;
  };
}

export interface ErrorMetrics {
  total_errors: number;
  error_rate: number;
  errors_by_type: Record<string, number>;
  errors_by_endpoint: Record<string, number>;
  critical_errors: number;
}

export interface AgentMetrics {
  total_agents: number;
  active_agents: number;
  agents_by_type: Record<string, number>;
  agents_by_status: Record<string, number>;
  average_agent_load: number;
}

export interface ExecutionMetrics {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_execution_time: number;
  executions_per_agent: Record<string, number>;
  concurrent_executions: number;
}

// Logging Types
export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  correlation_id?: string;
  user_id?: string;
  agent_id?: string;
  execution_id?: string;
  component: string;
  metadata?: Record<string, any>;
  stack_trace?: string;
}

export interface AuditLog extends LogEntry {
  action: string;
  resource_type: string;
  resource_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

// Security Types
export interface SecurityEvent {
  id: string;
  timestamp: string;
  type:
    | 'authentication_failure'
    | 'authorization_failure'
    | 'rate_limit_exceeded'
    | 'suspicious_activity'
    | 'data_breach_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  user_id?: string;
  agent_id?: string;
  description: string;
  metadata: Record<string, any>;
  resolved: boolean;
  resolution_notes?: string;
}

export interface APIKey {
  id: string;
  name: string;
  key_hash: string;
  user_id: string;
  organization_id: string;
  scopes: string[];
  permissions: string[];
  rate_limit?: number;
  ip_whitelist?: string[];
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
  revoked: boolean;
  revoked_at?: string;
  revoked_reason?: string;
}

// Deployment Types
export interface DeploymentInfo {
  version: string;
  build_number: string;
  commit_hash: string;
  build_date: string;
  environment: string;
  region: string;
  instance_id: string;
  kubernetes_namespace?: string;
  docker_image?: string;
}

// Feature Flags Types
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  conditions?: FeatureFlagCondition[];
  rollout_percentage?: number;
  organization_whitelist?: string[];
  user_whitelist?: string[];
  created_at: string;
  updated_at: string;
}

export interface FeatureFlagCondition {
  type: 'user_attribute' | 'organization_attribute' | 'time_window' | 'random_percentage';
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  attribute?: string;
  value: any;
}

// Cache Types
export interface CacheEntry {
  key: string;
  value: any;
  ttl: number;
  created_at: string;
  accessed_at: string;
  access_count: number;
  size_bytes: number;
}

export interface CacheStats {
  total_keys: number;
  total_size_bytes: number;
  hit_rate: number;
  miss_rate: number;
  eviction_count: number;
  expired_count: number;
  memory_usage: number;
}

// Background Job Types
export interface BackgroundJob {
  id: string;
  type: string;
  priority: number;
  data: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  attempts: number;
  max_attempts: number;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  error?: string;
  result?: any;
  created_by?: string;
  organization_id?: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  recipient_type: 'user' | 'organization' | 'all';
  recipient_id?: string;
  channels: ('email' | 'sms' | 'push' | 'webhook')[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data?: Record<string, any>;
  scheduled_at?: string;
  sent_at?: string;
  read_at?: string;
  archived_at?: string;
  created_at: string;
}

// Export utility types for Express middleware
export interface RequestWithUser extends Request {
  user?: AuthUser;
  correlation_id?: string;
  start_time?: number;
}

// Type guards
export function isAuthUser(obj: any): obj is AuthUser {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.organization_id === 'string' &&
    Array.isArray(obj.roles) &&
    Array.isArray(obj.permissions)
  );
}

export function isHealthCheck(obj: any): obj is HealthCheck {
  return obj && typeof obj.status === 'string' && ['healthy', 'unhealthy'].includes(obj.status);
}

export function isWebhookEvent(obj: any): obj is WebhookEvent {
  return (
    obj &&
    typeof obj.event_type === 'string' &&
    typeof obj.event_id === 'string' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.data === 'object'
  );
}

// Constants
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

export const AGENT_TYPES = ['worker', 'orchestrator', 'critic', 'judge', 'monitor', 'governor'] as const;

export const AGENT_STATUSES = ['active', 'inactive', 'error', 'deploying', 'maintenance', 'deprecated'] as const;

export const EXECUTION_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled'] as const;

export type AgentType = (typeof AGENT_TYPES)[number];
export type AgentStatus = (typeof AGENT_STATUSES)[number];
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];
