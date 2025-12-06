/**
 * OSSA Type System v0.2.9
 *
 * Canonical TypeScript type definitions for OSSA runtime interoperability.
 * These types define the contract between OSSA manifests and runtime implementations.
 *
 * @packageDocumentation
 */

// =============================================================================
// Core Identity Types
// =============================================================================

/** UUID v4 string format */
export type UUID = string;

/** ISO 8601 timestamp */
export type ISO8601Timestamp = string;

/** Semantic version string */
export type SemVer = string;

/** Agent identity at runtime */
export interface AgentIdentity {
  /** Agent definition ID from manifest metadata.name */
  agent_id: string;
  /** Agent version from manifest metadata.version */
  agent_version: SemVer;
  /** Runtime instance UUID (stable per pod/process) */
  instance_id: UUID;
  /** Session UUID (stable per conversation) */
  session_id: UUID;
  /** Interaction UUID (unique per turn) */
  interaction_id: UUID;
  /** Turn number within session */
  turn_number: number;
}

// =============================================================================
// Message Types
// =============================================================================

/** Message roles in conversation */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/** Text content part */
export interface TextPart {
  type: 'text';
  text: string;
}

/** Image content part */
export interface ImagePart {
  type: 'image';
  source: {
    type: 'base64' | 'url';
    media_type: string;
    data: string;
  };
}

/** File content part */
export interface FilePart {
  type: 'file';
  name: string;
  content: string;
  media_type: string;
}

/** Union of all content part types */
export type ContentPart = TextPart | ImagePart | FilePart;

/** Base message interface */
export interface BaseMessage {
  role: MessageRole;
  metadata?: MessageMetadata;
}

/** User message */
export interface UserMessage extends BaseMessage {
  role: 'user';
  content: string | ContentPart[];
}

/** Assistant/Agent message */
export interface AssistantMessage extends BaseMessage {
  role: 'assistant';
  content: string | null;
  tool_calls?: ToolCallRequest[];
}

/** System message */
export interface SystemMessage extends BaseMessage {
  role: 'system';
  content: string;
}

/** Tool result message */
export interface ToolMessage extends BaseMessage {
  role: 'tool';
  tool_call_id: string;
  content: string;
}

/** Union of all message types */
export type Message = UserMessage | AssistantMessage | SystemMessage | ToolMessage;

/** Message metadata */
export interface MessageMetadata {
  source: 'user' | 'api' | 'delegation';
  original_format?: string;
  normalized_at?: ISO8601Timestamp;
  [key: string]: unknown;
}

// =============================================================================
// Tool Types
// =============================================================================

/** Tool transport mechanisms */
export type ToolTransport = 'function' | 'http' | 'mcp' | 'grpc';

/** Tool source definition */
export type ToolSource =
  | { type: 'manifest'; tool_index: number }
  | { type: 'mcp'; server_uri: string; capability: string }
  | { type: 'delegation'; agent_id: string }
  | { type: 'function'; handler: string };

/** Resolved tool at runtime */
export interface ResolvedTool {
  name: string;
  description: string;
  input_schema: JSONSchema;
  source: ToolSource;
  transport: ToolTransport;
  timeout_ms: number;
  retry_policy?: RetryPolicy;
}

/** Tool call request from LLM */
export interface ToolCallRequest {
  id: string;
  name: string;
  arguments: string; // JSON string
}

/** Parsed tool call */
export interface ToolCall {
  id: string;
  capability: string;
  input: Record<string, unknown>;
  transport?: ToolTransport;
}

/** Tool execution result */
export type ToolResult =
  | { status: 'success'; output: unknown }
  | { status: 'error'; error: ToolError }
  | { status: 'timeout'; partial_output?: unknown };

/** Tool error details */
export interface ToolError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

/** Tool execution record */
export interface ToolExecution {
  call_id: string;
  tool_name: string;
  input: unknown;
  started_at: ISO8601Timestamp;
  completed_at: ISO8601Timestamp;
  result: ToolResult;
  retries: number;
  duration_ms: number;
}

// =============================================================================
// Error Types
// =============================================================================

/** OSSA error codes taxonomy */
export type ErrorCode =
  // Input Errors (4xx equivalent)
  | 'VALIDATION_ERROR'
  | 'SCHEMA_VIOLATION'
  | 'CONTENT_FILTERED'
  | 'POLICY_VIOLATION'
  // Execution Errors (5xx equivalent)
  | 'TOOL_ERROR'
  | 'TOOL_TIMEOUT'
  | 'LLM_ERROR'
  | 'LLM_TIMEOUT'
  | 'STATE_ERROR'
  // Resource Errors
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'CIRCUIT_OPEN'
  // Agent Errors
  | 'MAX_TURNS_EXCEEDED'
  | 'MAX_TOKENS_EXCEEDED'
  | 'DELEGATION_FAILED'
  | 'ESCALATION_REQUIRED';

/** Structured OSSA error */
export interface OSSAError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
  retry_after_ms?: number;
  escalation?: EscalationAction;
  cause?: Error;
}

/** Recovery strategies */
export type RecoveryStrategy =
  | 'retry'
  | 'fallback'
  | 'skip'
  | 'escalate'
  | 'abort';

/** Escalation action */
export interface EscalationAction {
  type: 'human' | 'supervisor' | 'alert';
  target?: string;
  context?: Record<string, unknown>;
}

/** Error handler configuration */
export interface ErrorHandler {
  error_codes: ErrorCode[];
  strategy: RecoveryStrategy;
  max_retries?: number;
  fallback_value?: unknown;
  escalation_target?: string;
}

// =============================================================================
// State Types
// =============================================================================

/** State isolation levels */
export type IsolationLevel =
  | 'read_uncommitted'
  | 'read_committed'
  | 'repeatable_read'
  | 'serializable';

/** State persistence modes */
export type StateMode = 'none' | 'session' | 'persistent';

/** State storage backends */
export type StateStorageType =
  | 'memory'
  | 'redis'
  | 'postgres'
  | 'dynamodb'
  | 'vector-db'
  | 'custom';

/** State change operation */
export interface StateChange {
  key: string;
  previous_value: unknown | null;
  new_value: unknown;
  operation: 'set' | 'delete' | 'append';
  timestamp: ISO8601Timestamp;
}

/** State transaction */
export interface StateTransaction {
  id: string;
  started_at: ISO8601Timestamp;
  changes: StateChange[];
  status: 'pending' | 'committed' | 'rolled_back';
}

/** State operations interface */
export interface StateOperations {
  get<T>(key: string): Promise<T | null>;
  getMany<T>(keys: string[]): Promise<Map<string, T>>;
  exists(key: string): Promise<boolean>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  append<T>(key: string, value: T): Promise<void>;
  checkpoint(): Promise<string>;
  rollback(checkpoint?: string): Promise<void>;
}

// =============================================================================
// LLM Types
// =============================================================================

/** LLM provider identifiers */
export type LLMProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure'
  | 'aws'
  | 'mistral'
  | 'groq'
  | 'ollama'
  | 'custom';

/** LLM request parameters */
export interface LLMParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  presence_penalty?: number;
  frequency_penalty?: number;
}

/** LLM inference request */
export interface InferenceRequest {
  model: string;
  messages: Message[];
  tools?: ResolvedTool[];
  system_prompt?: string;
  parameters: LLMParameters;
}

/** LLM inference response */
export interface InferenceResponse {
  id: string;
  content: string | null;
  tool_calls: ToolCallRequest[];
  finish_reason: FinishReason;
  usage: TokenUsage;
  model: string;
}

/** LLM finish reasons */
export type FinishReason =
  | 'stop'
  | 'length'
  | 'tool_use'
  | 'content_filter'
  | 'error';

/** Token usage statistics */
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
}

// =============================================================================
// Observability Types
// =============================================================================

/** W3C Trace Context */
export interface W3CTraceContext {
  traceparent: string;
  tracestate?: string;
}

/** W3C Baggage */
export interface W3CBaggage {
  entries: Map<string, string>;
}

/** Log severity levels */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/** Structured log entry */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: ISO8601Timestamp;
  trace_id?: string;
  span_id?: string;
  attributes?: Record<string, unknown>;
}

/** CloudEvent for activity streams */
export interface CloudEvent<T = unknown> {
  specversion: '1.0';
  type: string;
  source: string;
  id: string;
  time: ISO8601Timestamp;
  datacontenttype?: string;
  data?: T;
  subject?: string;
}

/** OSSA-specific CloudEvent types */
export type OSSAEventType =
  | 'io.ossa.agent.turn.started'
  | 'io.ossa.agent.turn.completed'
  | 'io.ossa.agent.turn.failed'
  | 'io.ossa.tool.called'
  | 'io.ossa.tool.completed'
  | 'io.ossa.tool.failed'
  | 'io.ossa.state.changed'
  | 'io.ossa.delegation.started'
  | 'io.ossa.delegation.completed';

// =============================================================================
// Delegation Types
// =============================================================================

/** Delegation patterns */
export type DelegationType = 'handoff' | 'parallel' | 'supervisor';

/** Delegation request */
export interface DelegationRequest {
  type: DelegationType;
  target_agent: string;
  input: unknown;
  context_propagation: ContextPropagation;
  timeout_ms: number;
  on_failure: RecoveryStrategy;
}

/** Context propagation config */
export interface ContextPropagation {
  include_session_id: boolean;
  include_history: boolean;
  include_state: boolean;
  custom_context?: Record<string, unknown>;
}

/** Delegation result */
export interface DelegationResult {
  agent_id: string;
  status: 'success' | 'error' | 'timeout';
  output?: unknown;
  error?: OSSAError;
  duration_ms: number;
}

// =============================================================================
// Retry Types
// =============================================================================

/** Retry policy configuration */
export interface RetryPolicy {
  max_retries: number;
  initial_delay_ms: number;
  max_delay_ms: number;
  backoff_multiplier: number;
  retryable_errors?: ErrorCode[];
}

// =============================================================================
// JSON Schema Types (subset)
// =============================================================================

/** Simplified JSON Schema type */
export interface JSONSchema {
  type?: string | string[];
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: unknown[];
  description?: string;
  default?: unknown;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  additionalProperties?: boolean | JSONSchema;
  $ref?: string;
}

// =============================================================================
// Turn Lifecycle Types
// =============================================================================

/** Turn phase names */
export type TurnPhase =
  | 'init'
  | 'normalize'
  | 'resolve'
  | 'infer'
  | 'execute'
  | 'persist'
  | 'emit';

/** Turn context */
export interface TurnContext {
  identity: AgentIdentity;
  messages: Message[];
  tools: ResolvedTool[];
  state: StateOperations;
  trace_context?: W3CTraceContext;
  baggage?: W3CBaggage;
}

/** Turn result */
export interface TurnResult {
  response: AssistantMessage;
  tool_executions: ToolExecution[];
  state_changes: StateChange[];
  usage: TokenUsage;
  duration_ms: number;
  phases: PhaseMetrics[];
}

/** Phase execution metrics */
export interface PhaseMetrics {
  phase: TurnPhase;
  started_at: ISO8601Timestamp;
  completed_at: ISO8601Timestamp;
  duration_ms: number;
  error?: OSSAError;
}
