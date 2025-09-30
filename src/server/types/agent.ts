/**
 * OSSA Agent Types
 * Complete TypeScript type definitions for agents matching OpenAPI 3.1 specification
 */

import { AgentType, AgentStatus, ExecutionStatus } from './server';

// Base Agent Types
export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  description?: string;
  version: string;
  status: AgentStatus;
  capabilities: string[];
  configuration: Record<string, any>;
  metadata?: AgentMetadata;
  created_at: string;
  updated_at: string;
  metrics?: AgentMetrics;
}

// Specialized Agent Types (Polymorphic with discriminator)
export interface WorkerAgent extends Agent {
  type: 'worker';
  specialization: 'data-processing' | 'api-integration' | 'file-handling' | 'validation';
  configuration: WorkerConfiguration;
}

export interface OrchestratorAgent extends Agent {
  type: 'orchestrator';
  managed_agents?: string[];
  configuration: OrchestratorConfiguration;
}

export interface CriticAgent extends Agent {
  type: 'critic';
  configuration: CriticConfiguration;
}

export interface JudgeAgent extends Agent {
  type: 'judge';
  configuration: JudgeConfiguration;
}

export interface MonitorAgent extends Agent {
  type: 'monitor';
  configuration: MonitorConfiguration;
}

export interface GovernorAgent extends Agent {
  type: 'governor';
  configuration: GovernorConfiguration;
}

// Configuration Types
export interface WorkerConfiguration {
  max_concurrent_tasks?: number;
  timeout_seconds?: number;
  retry_attempts?: number;
  resource_limits?: {
    cpu?: string;
    memory?: string;
    disk?: string;
  };
  [key: string]: any;
}

export interface OrchestratorConfiguration {
  max_concurrent_workflows?: number;
  workflow_timeout_minutes?: number;
  enable_parallel_execution?: boolean;
  scheduling_strategy?: 'fifo' | 'priority' | 'round-robin' | 'load-balanced';
  [key: string]: any;
}

export interface CriticConfiguration {
  quality_threshold?: number;
  automated_fixes?: boolean;
  review_categories?: ('code-quality' | 'security' | 'performance' | 'compliance')[];
  severity_levels?: ('low' | 'medium' | 'high' | 'critical')[];
  [key: string]: any;
}

export interface JudgeConfiguration {
  decision_model?: 'consensus' | 'majority' | 'weighted' | 'ai-assisted';
  confidence_threshold?: number;
  voting_timeout_seconds?: number;
  quorum_percentage?: number;
  [key: string]: any;
}

export interface MonitorConfiguration {
  monitoring_interval_seconds?: number;
  alert_thresholds?: {
    cpu_percent?: number;
    memory_percent?: number;
    error_rate_percent?: number;
    response_time_ms?: number;
  };
  notification_channels?: ('email' | 'slack' | 'webhook' | 'sms')[];
  [key: string]: any;
}

export interface GovernorConfiguration {
  policy_enforcement_level?: 'strict' | 'moderate' | 'permissive';
  compliance_frameworks?: ('ISO42001' | 'NIST-AI-RMF' | 'EU-AI-ACT' | 'SOX' | 'HIPAA')[];
  audit_retention_days?: number;
  auto_remediation?: boolean;
  [key: string]: any;
}

// Agent Metadata
export interface AgentMetadata {
  author?: string;
  organization?: string;
  tags?: string[];
  documentation_url?: string;
  source_repository?: string;
  license?: string;
  cost_per_execution?: number;
  dependencies?: AgentDependency[];
  environments?: ('development' | 'staging' | 'production')[];
  [key: string]: any;
}

export interface AgentDependency {
  type: 'agent' | 'service' | 'library' | 'api';
  name: string;
  version?: string;
  required: boolean;
  description?: string;
}

// Agent Metrics
export interface AgentMetrics {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_execution_time_ms: number;
  last_execution_at?: string;
  success_rate_percent: number;
  cpu_usage_percent?: number;
  memory_usage_mb?: number;
  disk_usage_mb?: number;
  network_io_kb?: number;
  error_distribution?: Record<string, number>;
  performance_trend?: 'improving' | 'stable' | 'degrading';
}

// Request/Response Types
export interface CreateAgentRequest {
  type: AgentType;
  name: string;
  description?: string;
  version?: string;
  capabilities: string[];
  configuration?: Record<string, any>;
  metadata?: AgentMetadata;
  webhook_url?: string;

  // Type-specific properties
  specialization?: string; // for worker agents
  managed_agents?: string[]; // for orchestrator agents
}

export interface CreateWorkerAgentRequest extends CreateAgentRequest {
  type: 'worker';
  specialization: 'data-processing' | 'api-integration' | 'file-handling' | 'validation';
  configuration?: WorkerConfiguration;
}

export interface CreateOrchestratorAgentRequest extends CreateAgentRequest {
  type: 'orchestrator';
  configuration?: OrchestratorConfiguration;
}

export interface CreateCriticAgentRequest extends CreateAgentRequest {
  type: 'critic';
  configuration?: CriticConfiguration;
}

export interface CreateJudgeAgentRequest extends CreateAgentRequest {
  type: 'judge';
  configuration?: JudgeConfiguration;
}

export interface CreateMonitorAgentRequest extends CreateAgentRequest {
  type: 'monitor';
  configuration?: MonitorConfiguration;
}

export interface CreateGovernorAgentRequest extends CreateAgentRequest {
  type: 'governor';
  configuration?: GovernorConfiguration;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  version?: string;
  capabilities?: string[];
  configuration?: Record<string, any>;
  metadata?: AgentMetadata;
  expected_version?: string; // for optimistic locking
}

export interface AgentListQuery {
  page?: number;
  limit?: number;
  type?: AgentType;
  status?: AgentStatus[];
  capabilities?: string[];
  created_after?: string;
  performance_min?: number;
  sort?: 'created_at' | 'updated_at' | 'name' | 'status' | 'type';
  organization_id?: string;
  tags?: string[];
}

export interface AgentListResponse {
  agents: Agent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_next: boolean;
    has_previous: boolean;
    total_pages: number;
  };
  filters?: Record<string, any>;
}

// Execution Types
export interface ExecutionRequest {
  operation: string;
  input: Record<string, any>;
  context?: ExecutionContext;
  options?: ExecutionOptions;
}

export interface ExecutionContext {
  user_id?: string;
  organization_id?: string;
  correlation_id?: string;
  trace_id?: string;
  parent_execution_id?: string;
  workflow_id?: string;
  session_id?: string;
  request_id?: string;
  [key: string]: any;
}

export interface ExecutionOptions {
  cache_result?: boolean;
  cache_ttl_seconds?: number;
  notify_on_completion?: boolean;
  retry_on_failure?: boolean;
  priority?: number;
  timeout_seconds?: number;
  resource_limits?: {
    cpu?: string;
    memory?: string;
    disk?: string;
  };
  [key: string]: any;
}

export interface ExecutionResult {
  execution_id: string;
  status: 'completed' | 'failed';
  result?: Record<string, any>;
  error?: ExecutionError;
  metadata: ExecutionMetadata;
  started_at: string;
  completed_at?: string;
}

export interface AsyncExecutionResponse {
  execution_id: string;
  status: 'pending' | 'running';
  estimated_duration_seconds?: number;
  progress_url: string;
  websocket_url?: string;
  started_at: string;
}

export interface ExecutionStatusResponse {
  execution_id: string;
  agent_id: string;
  status: ExecutionStatus;
  progress?: ExecutionProgress;
  result?: Record<string, any>;
  error?: ExecutionError;
  logs?: ExecutionLogEntry[];
  metadata: ExecutionMetadata;
  started_at: string;
  completed_at?: string;
}

export interface ExecutionProgress {
  percentage: number;
  current_step?: string;
  total_steps?: number;
  estimated_completion?: string;
  steps_completed?: number;
  current_operation?: string;
  throughput?: {
    items_per_second: number;
    total_items: number;
    processed_items: number;
  };
}

export interface ExecutionError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack_trace?: string;
  correlation_id?: string;
  timestamp: string;
  recoverable: boolean;
  retry_after_seconds?: number;
}

export interface ExecutionMetadata {
  duration_ms?: number;
  cpu_time_ms?: number;
  memory_used_mb?: number;
  cache_hit?: boolean;
  retry_count?: number;
  resource_usage?: {
    peak_cpu_percent: number;
    peak_memory_mb: number;
    disk_io_mb: number;
    network_io_mb: number;
  };
  cost?: {
    compute_cost: number;
    storage_cost: number;
    network_cost: number;
    total_cost: number;
    currency: string;
  };
  [key: string]: any;
}

export interface ExecutionLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, any>;
  component?: string;
  step?: string;
}

export interface ExecutionValidationError {
  error: string;
  validation_errors: ValidationError[];
  operation: string;
  agent_capabilities: string[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
  constraint?: any;
}

// JSON Patch Operations (OpenAPI 3.1 feature)
export interface JsonPatchOperation {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  value?: any;
  from?: string; // for move and copy operations
}

// Event Types
export interface AgentEvent {
  event_id: string;
  event_type: string;
  timestamp: string;
  agent_id: string;
  organization_id?: string;
  user_id?: string;
  data: Record<string, any>;
}

export interface AgentCreatedEvent extends AgentEvent {
  event_type: 'agent.created';
  data: {
    agent: Agent;
  };
}

export interface AgentUpdatedEvent extends AgentEvent {
  event_type: 'agent.updated';
  data: {
    agent: Agent;
    changes: Record<string, { old: any; new: any }>;
  };
}

export interface AgentDeletedEvent extends AgentEvent {
  event_type: 'agent.deleted';
  data: {
    agent_id: string;
    agent_name: string;
    deletion_reason: string;
  };
}

export interface AgentStatusChangedEvent extends AgentEvent {
  event_type: 'agent.status_changed';
  data: {
    agent_id: string;
    previous_status: AgentStatus;
    new_status: AgentStatus;
    reason?: string;
  };
}

export interface ExecutionStartedEvent extends AgentEvent {
  event_type: 'execution.started';
  data: {
    execution_id: string;
    operation: string;
    input: Record<string, any>;
  };
}

export interface ExecutionCompletedEvent extends AgentEvent {
  event_type: 'execution.completed';
  data: {
    execution_id: string;
    status: 'completed' | 'failed';
    duration_ms: number;
    result?: Record<string, any>;
    error?: ExecutionError;
  };
}

// Agent Capability Types
export interface AgentCapability {
  name: string;
  description: string;
  version: string;
  input_schema?: Record<string, any>; // JSON Schema
  output_schema?: Record<string, any>; // JSON Schema
  parameters?: CapabilityParameter[];
  examples?: CapabilityExample[];
  requirements?: string[];
  limitations?: string[];
  cost_factor?: number;
}

export interface CapabilityParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  enum?: any[];
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  min_length?: number;
  max_length?: number;
}

export interface CapabilityExample {
  name: string;
  description: string;
  input: Record<string, any>;
  output: Record<string, any>;
  execution_time_ms?: number;
}

// Agent Registry Types
export interface AgentRegistryEntry {
  agent_id: string;
  agent_name: string;
  agent_type: AgentType;
  capabilities: string[];
  endpoint_url: string;
  health_check_url: string;
  documentation_url?: string;
  version: string;
  status: AgentStatus;
  last_heartbeat: string;
  registration_time: string;
  metadata: AgentMetadata;
  organization_id: string;
  tags: string[];
}

export interface AgentDiscoveryQuery {
  capabilities?: string[];
  agent_type?: AgentType;
  tags?: string[];
  status?: AgentStatus[];
  organization_id?: string;
  region?: string;
  performance_min?: number;
  load_max?: number;
}

export interface AgentDiscoveryResult {
  agents: AgentRegistryEntry[];
  total_found: number;
  query_time_ms: number;
  recommendations?: AgentRecommendation[];
}

export interface AgentRecommendation {
  agent_id: string;
  confidence_score: number;
  reasoning: string;
  compatibility_score: number;
  performance_score: number;
  cost_score: number;
}

// Error Types
export interface AgentError extends Error {
  code: string;
  agent_id?: string;
  execution_id?: string;
  correlation_id?: string;
  details?: Record<string, any>;
  recoverable: boolean;
  retry_after?: number;
}

export interface ConflictError {
  error: string;
  conflicting_resource: {
    type: string;
    id: string;
    name: string;
  };
}

export interface PatchError {
  error: string;
  failed_operations: {
    operation_index: number;
    operation: JsonPatchOperation;
    error: string;
  }[];
}

// Utility Types
export type AgentUnion = WorkerAgent | OrchestratorAgent | CriticAgent | JudgeAgent | MonitorAgent | GovernorAgent;

export type CreateAgentRequestUnion =
  | CreateWorkerAgentRequest
  | CreateOrchestratorAgentRequest
  | CreateCriticAgentRequest
  | CreateJudgeAgentRequest
  | CreateMonitorAgentRequest
  | CreateGovernorAgentRequest;

// Type Guards
export function isWorkerAgent(agent: Agent): agent is WorkerAgent {
  return agent.type === 'worker';
}

export function isOrchestratorAgent(agent: Agent): agent is OrchestratorAgent {
  return agent.type === 'orchestrator';
}

export function isCriticAgent(agent: Agent): agent is CriticAgent {
  return agent.type === 'critic';
}

export function isJudgeAgent(agent: Agent): agent is JudgeAgent {
  return agent.type === 'judge';
}

export function isMonitorAgent(agent: Agent): agent is MonitorAgent {
  return agent.type === 'monitor';
}

export function isGovernorAgent(agent: Agent): agent is GovernorAgent {
  return agent.type === 'governor';
}

export function isExecutionError(obj: any): obj is ExecutionError {
  return obj && typeof obj.code === 'string' && typeof obj.message === 'string' && typeof obj.recoverable === 'boolean';
}

export function isAgentEvent(obj: any): obj is AgentEvent {
  return (
    obj &&
    typeof obj.event_id === 'string' &&
    typeof obj.event_type === 'string' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.agent_id === 'string'
  );
}
