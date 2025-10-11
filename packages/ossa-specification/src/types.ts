/**
 * OSSA Specification TypeScript Types
 * Pure specification types without implementation
 */

export interface AgentManifest {
  apiVersion: string;
  kind: 'Agent';
  metadata: AgentMetadata;
  spec: AgentSpec;
}

export interface AgentMetadata {
  name: string;
  version: string;
  description?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface AgentSpec {
  type: AgentType;
  capabilities: Capability[];
  configuration: AgentConfiguration;
  discovery: DiscoveryConfig;
  health: HealthConfig;
  runtime?: RuntimeConfig;
}

export type AgentType =
  | 'orchestrator'
  | 'worker'
  | 'critic'
  | 'judge'
  | 'trainer'
  | 'governor'
  | 'monitor'
  | 'integrator'
  | 'voice';

export interface Capability {
  name: string;
  type: CapabilityType;
  description: string;
  domains?: string[];
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  dependencies?: string[];
  constraints?: CapabilityConstraints;
}

export type CapabilityType =
  | 'action'
  | 'sensor'
  | 'processor'
  | 'coordinator'
  | 'validator';

export interface CapabilityConstraints {
  performance?: {
    max_latency_ms?: number;
    min_throughput?: number;
    max_memory_mb?: number;
  };
  security?: {
    requires_authentication?: boolean;
    requires_authorization?: boolean;
    data_classification?: 'public' | 'internal' | 'confidential' | 'restricted';
  };
}

export interface AgentConfiguration {
  openapi: string;
  baseUrl: string;
  authentication?: AuthenticationConfig;
  rateLimit?: RateLimitConfig;
  timeout?: number;
}

export interface AuthenticationConfig {
  type: 'none' | 'bearer' | 'api-key' | 'oauth2';
  config?: Record<string, any>;
}

export interface RateLimitConfig {
  requests_per_minute: number;
  burst_size?: number;
}

export interface DiscoveryConfig {
  endpoint: string;
  interval?: number;
  tags?: string[];
}

export interface HealthConfig {
  endpoint: string;
  interval?: number;
  timeout?: number;
}

export interface RuntimeConfig {
  resources?: ResourceRequirements;
  scaling?: ScalingConfig;
}

export interface ResourceRequirements {
  cpu?: string;
  memory?: string;
  storage?: string;
}

export interface ScalingConfig {
  min_replicas?: number;
  max_replicas?: number;
  target_cpu_utilization?: number;
}

export interface ConformanceLevel {
  level: 'bronze' | 'silver' | 'gold' | 'advanced';
  features: ConformanceFeatures;
  validation?: ConformanceValidation;
}

export interface ConformanceFeatures {
  agent_manifest?: boolean;
  openapi_spec?: boolean;
  capability_declaration?: boolean;
  health_endpoint?: boolean;
  discovery_endpoint?: boolean;
  error_handling?: boolean;
  authentication?: boolean;
  authorization?: boolean;
  audit_logging?: boolean;
  performance_metrics?: boolean;
  feedback_loop?: boolean;
  multi_agent_coordination?: boolean;
}

export interface ConformanceValidation {
  timestamp?: string;
  validator_version?: string;
  score?: number;
  issues?: ValidationIssue[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: string;
}

export interface WorkflowSpec {
  apiVersion: string;
  kind: 'Workflow';
  metadata: WorkflowMetadata;
  spec: WorkflowDefinition;
}

export interface WorkflowMetadata {
  name: string;
  version: string;
  description?: string;
  labels?: Record<string, string>;
}

export interface WorkflowDefinition {
  phases: FeedbackLoopPhases;
  tasks: Task[];
  execution: ExecutionStrategy;
  budget?: WorkflowBudget;
  governance?: GovernancePolicy[];
}

export interface FeedbackLoopPhases {
  enabled: ('plan' | 'execute' | 'review' | 'judge' | 'learn' | 'govern')[];
  plan?: PlanPhase;
  execute?: ExecutePhase;
  review?: ReviewPhase;
  judge?: JudgePhase;
  learn?: LearnPhase;
  govern?: GovernPhase;
}

export interface PlanPhase {
  orchestrator?: string;
  strategy?: 'sequential' | 'parallel' | 'dag' | 'adaptive';
  decomposition?: {
    maxDepth?: number;
    minTaskSize?: number;
  };
}

export interface ExecutePhase {
  workers?: WorkerAssignment[];
  parallelism?: number;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

export interface ReviewPhase {
  critics?: CriticAssignment[];
  dimensions?: ('quality' | 'security' | 'performance' | 'compliance' | 'efficiency')[];
  aggregation?: 'unanimous' | 'majority' | 'weighted' | 'threshold';
}

export interface JudgePhase {
  judge?: string;
  criteria?: JudgmentCriteria[];
  decisionType?: 'binary' | 'ranking' | 'scoring' | 'selection';
}

export interface LearnPhase {
  trainer?: string;
  learningStrategy?: 'pattern-extraction' | 'feedback-synthesis' | 'skill-update' | 'curriculum';
  persistence?: {
    store?: 'memory' | 'database' | 'vector-store';
    retention?: number;
  };
}

export interface GovernPhase {
  governor?: string;
  policies?: GovernancePolicy[];
  enforcement?: 'strict' | 'advisory' | 'monitoring';
}

export interface Task {
  id: string;
  type: string;
  description?: string;
  dependencies?: string[];
  agent?: AgentRequirement;
  input?: Record<string, any>;
  expectedOutput?: Record<string, any>;
  budget?: TaskBudget;
}

export interface AgentRequirement {
  type?: 'orchestrator' | 'worker' | 'critic' | 'judge' | 'trainer' | 'governor' | 'monitor' | 'integrator';
  subtype?: string;
  capabilities?: string[];
  performance?: {
    minThroughput?: number;
    maxLatency?: number;
  };
}

export interface ExecutionStrategy {
  mode: 'sequential' | 'parallel' | 'dag' | 'streaming' | 'adaptive';
  concurrency?: number;
  scheduling?: 'fifo' | 'priority' | 'deadline' | 'resource-aware';
  optimization?: 'latency' | 'throughput' | 'cost' | 'balanced';
}

export interface WorkflowBudget {
  tokens?: {
    total?: number;
    perPhase?: Record<string, number>;
    perTask?: Record<string, number>;
  };
  time?: {
    total?: number;
    perPhase?: Record<string, number>;
  };
  cost?: {
    currency?: string;
    maximum?: number;
  };
}

export interface TaskBudget {
  tokens?: number;
  time?: number;
  retries?: number;
}

export interface GovernancePolicy {
  type: 'budget' | 'compliance' | 'security' | 'quality' | 'performance';
  rules?: PolicyRule[];
  enforcement?: 'block' | 'warn' | 'monitor';
}

export interface PolicyRule {
  condition: string;
  action: 'allow' | 'deny' | 'escalate' | 'delegate';
  message?: string;
}

export interface WorkerAssignment {
  type?: string;
  count?: number;
  strategy?: 'round-robin' | 'least-loaded' | 'capability-match' | 'sticky';
}

export interface CriticAssignment {
  type?: string;
  dimension?: string;
  weight?: number;
}

export interface JudgmentCriteria {
  dimension?: string;
  threshold?: number;
  comparator?: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
}

export interface RetryPolicy {
  maxAttempts?: number;
  backoff?: 'fixed' | 'linear' | 'exponential';
  initialDelay?: number;
  maxDelay?: number;
}