/**
 * Agent Mesh Communication Layer - Type Definitions
 * Based on OSSA v0.3.0 Messaging Specification and v0.3.0 A2A Protocol
 */

/**
 * Message Types
 */
export type MessageType = 'request' | 'response' | 'event' | 'command';

/**
 * Message Priority Levels
 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';

/**
 * Task States for Agent Collaboration
 */
export type TaskState =
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'working'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * A2A Error Codes
 */
export type A2AErrorCode =
  // Addressing Errors
  | 'AGENT_NOT_FOUND'
  | 'AGENT_UNREACHABLE'
  | 'TOPIC_NOT_FOUND'
  // Authentication Errors
  | 'AUTH_REQUIRED'
  | 'AUTH_FAILED'
  | 'AUTH_EXPIRED'
  | 'INSUFFICIENT_PERMISSIONS'
  // Message Errors
  | 'INVALID_MESSAGE'
  | 'MESSAGE_EXPIRED'
  | 'MESSAGE_TOO_LARGE'
  // Task Errors
  | 'TASK_REJECTED'
  | 'TASK_TIMEOUT'
  | 'TASK_CANCELLED'
  // Protocol Errors
  | 'UNSUPPORTED_VERSION'
  | 'UNSUPPORTED_TRANSPORT'
  | 'RATE_LIMITED';

/**
 * Transport Types
 */
export type Transport = 'http' | 'grpc' | 'websocket' | 'mqtt';

/**
 * Authentication Methods
 */
export type AuthMethod = 'mtls' | 'bearer' | 'oidc' | 'api_key' | 'none';

/**
 * Delivery Guarantees
 */
export type DeliveryGuarantee = 'at-most-once' | 'at-least-once' | 'exactly-once';

/**
 * Agent Status
 */
export type AgentStatus = 'healthy' | 'degraded' | 'unavailable';

/**
 * Message Envelope
 * Standard envelope format for all A2A messages
 */
export interface MessageEnvelope<T = unknown> {
  /** Protocol version - MUST be ossa/a2a/v0.3.0 */
  version: string;
  /** Unique message identifier (UUID) */
  id: string;
  /** Message creation timestamp (ISO 8601) */
  timestamp: string;
  /** Sender agent URI (format: agent://{namespace}/{name}) */
  from: string;
  /** Recipient agent URI or topic */
  to: string;
  /** Message type */
  type: MessageType;
  /** Application-specific payload */
  payload: T;
  /** Optional correlation ID for request/response pairs */
  correlationId?: string;
  /** Optional reply-to address */
  replyTo?: string;
  /** Time-to-live in seconds (default: 300) */
  ttl?: number;
  /** Message priority */
  priority?: MessagePriority;
  /** W3C trace context */
  traceContext?: TraceContext;
  /** Message metadata */
  metadata?: MessageMetadata;
}

/**
 * W3C Trace Context
 */
export interface TraceContext {
  /** W3C traceparent header */
  traceparent: string;
  /** W3C tracestate header */
  tracestate?: string;
}

/**
 * Message Metadata
 */
export interface MessageMetadata {
  /** Correlation ID for grouping related messages */
  correlationId?: string;
  /** Trace ID for distributed tracing */
  traceId?: string;
  /** Span ID for distributed tracing */
  spanId?: string;
  /** Message priority */
  priority?: MessagePriority;
  /** Time-to-live in seconds */
  ttlSeconds?: number;
  /** Retry count */
  retryCount?: number;
  /** Content type */
  contentType?: string;
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Agent Card
 * Self-describing document advertising agent capabilities
 */
export interface AgentCard {
  // Identity
  uri: string;
  name: string;
  version: string;
  ossaVersion: string;

  // Capabilities
  capabilities: string[];
  tools?: ToolDescriptor[];
  role?: string;

  // Connectivity
  endpoints: {
    http?: string;
    grpc?: string;
    websocket?: string;
  };
  transport: Transport[];

  // Security
  authentication: AuthMethod[];
  encryption: EncryptionSpec;

  // Metadata
  metadata?: {
    team?: string;
    environment?: string;
    region?: string;
    [key: string]: unknown;
  };

  // Health
  status?: AgentStatus;
  lastHeartbeat?: string;
}

/**
 * Tool Descriptor
 */
export interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
}

/**
 * Encryption Specification
 */
export interface EncryptionSpec {
  tlsRequired: boolean;
  minTlsVersion: '1.2' | '1.3';
  cipherSuites?: string[];
}

/**
 * Task Status
 */
export interface TaskStatus {
  taskId: string;
  state: TaskState;
  progress?: number;
  message?: string;
  error?: TaskError;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Task Error
 */
export interface TaskError {
  code: string;
  message: string;
  details?: unknown;
  recoverable: boolean;
}

/**
 * A2A Error
 */
export interface A2AError {
  code: A2AErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  retryAfterSeconds?: number;
}

/**
 * Retry Policy
 */
export interface RetryPolicy {
  maxAttempts: number;
  backoff: 'exponential' | 'linear' | 'constant';
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier?: number;
  retryableErrors?: A2AErrorCode[];
}

/**
 * Circuit Breaker Configuration
 */
export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  halfOpenRequests: number;
}

/**
 * Reliability Configuration
 */
export interface ReliabilityConfig {
  deliveryGuarantee: DeliveryGuarantee;
  retry: RetryPolicy;
  dlq?: {
    enabled: boolean;
    channel: string;
    retentionDays: number;
  };
  ordering?: {
    guarantee: 'per-source' | 'per-channel' | 'none';
    timeoutSeconds: number;
  };
  acknowledgment?: {
    mode: 'auto' | 'manual';
    timeoutSeconds: number;
  };
}

/**
 * Published Channel Configuration
 */
export interface PublishedChannel {
  channel: string;
  description?: string;
  schema: JSONSchema;
  examples?: unknown[];
  contentType?: string;
  tags?: string[];
}

/**
 * Subscription Configuration
 */
export interface Subscription {
  channel: string;
  description?: string;
  schema?: JSONSchema;
  handler: string;
  filter?: {
    expression?: string;
    fields?: Record<string, unknown>;
  };
  priority?: MessagePriority;
  maxConcurrency?: number;
}

/**
 * Command Configuration (RPC)
 */
export interface Command {
  name: string;
  description?: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  timeoutSeconds?: number;
  idempotent?: boolean;
  async?: boolean;
}

/**
 * Routing Rule
 */
export interface RoutingRule {
  id?: string;
  source: string;
  channel: string;
  targets: string[];
  filter?: {
    expression?: string;
    fields?: Record<string, unknown>;
  };
  transform?: string;
  priority?: MessagePriority;
  enabled?: boolean;
}

/**
 * Messaging Extension
 * Agent-to-agent messaging configuration
 */
export interface MessagingExtension {
  publishes?: PublishedChannel[];
  subscribes?: Subscription[];
  commands?: Command[];
  reliability?: ReliabilityConfig;
}

/**
 * JSON Schema Definition
 */
export interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: unknown[];
  pattern?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  [key: string]: unknown;
}

/**
 * Agent Mesh Configuration
 */
export interface AgentMeshConfig {
  agents: AgentInfo[];
  communication: CommunicationConfig;
  serviceMesh?: ServiceMeshConfig;
  observability: ObservabilityConfig;
  workflows?: WorkflowConfig[];
  security: SecurityConfig;
}

/**
 * Agent Info
 */
export interface AgentInfo {
  name: string;
  namespace: string;
  endpoint: string;
  healthCheck: string;
  capabilities: string[];
  dependencies: string[];
}

/**
 * Communication Configuration
 */
export interface CommunicationConfig {
  protocol: 'json-rpc' | 'grpc' | 'http';
  version: string;
  transport: Transport;
  timeout: number;
  authentication: {
    type: AuthMethod;
    [key: string]: unknown;
  };
  messageFormat: {
    contentType: string;
    encoding: string;
    compression?: string;
  };
  retryPolicy: RetryPolicy;
  circuitBreaker?: CircuitBreakerConfig;
}

/**
 * Service Mesh Configuration
 */
export interface ServiceMeshConfig {
  enabled: boolean;
  provider: 'istio' | 'linkerd' | 'consul';
  version: string;
  mtls: {
    mode: 'STRICT' | 'PERMISSIVE' | 'DISABLED';
  };
}

/**
 * Observability Configuration
 */
export interface ObservabilityConfig {
  tracing: {
    enabled: boolean;
    samplingRate: number;
    exporter: string;
    endpoint: string;
  };
  metrics: {
    enabled: boolean;
    exporter: string;
    endpoint: string;
    customMetrics?: MetricDefinition[];
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    destination: string;
  };
}

/**
 * Metric Definition
 */
export interface MetricDefinition {
  name: string;
  type: 'counter' | 'histogram' | 'gauge' | 'summary';
  description: string;
  labels: string[];
}

/**
 * Workflow Configuration
 */
export interface WorkflowConfig {
  name: string;
  description?: string;
  steps: WorkflowStep[];
}

/**
 * Workflow Step
 */
export interface WorkflowStep {
  agent: string;
  action: string;
  onFailure?: 'abort' | 'continue' | 'rollback';
  timeout?: number;
  trigger?: string;
}

/**
 * Security Configuration
 */
export interface SecurityConfig {
  networkPolicies?: {
    enabled: boolean;
    defaultDeny: boolean;
    allowedConnections?: Connection[];
  };
  rbac?: {
    enabled: boolean;
    serviceAccounts?: {
      autoCreate: boolean;
      annotations?: Record<string, string>;
    };
  };
  podSecurity?: {
    enforce: 'privileged' | 'baseline' | 'restricted';
    audit: 'privileged' | 'baseline' | 'restricted';
    warn: 'privileged' | 'baseline' | 'restricted';
  };
}

/**
 * Network Connection
 */
export interface Connection {
  from: string;
  to: string;
}

/**
 * Message Handler Function
 */
export type MessageHandler<T = unknown> = (message: MessageEnvelope<T>) => Promise<void> | void;

/**
 * Command Handler Function
 */
export type CommandHandler<TInput = unknown, TOutput = unknown> = (
  input: TInput
) => Promise<TOutput> | TOutput;
