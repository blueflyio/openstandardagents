/**
 * OSSA Core Type Definitions
 * Types-first approach for the entire platform
 */

// Agent Types
export interface Agent {
  id: string;
  name: string;
  version: string;
  type: AgentType;
  capabilities: Capability[];
  status: AgentStatus;
  metadata: AgentMetadata;
  config: AgentConfig;
}

// Agent Manifest for OSSA specification
export interface AgentManifest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    version: string;
    description?: string;
    author?: string;
  };
  spec: {
    type: string;
    capabilities?: string[];
    configuration?: any;
    dependencies?: {
      agents?: Array<{
        name: string;
        version?: string;
        optional?: boolean;
      }>;
    };
    resources?: {
      cpu?: string;
      memory?: string;
      gpu?: string;
    };
  };
}

export enum AgentType {
  WORKER = 'worker',
  ORCHESTRATOR = 'orchestrator',
  GOVERNOR = 'governor',
  CRITIC = 'critic',
  JUDGE = 'judge',
  TRAINER = 'trainer',
  INTEGRATOR = 'integrator'
}

export interface Capability {
  name: string;
  version: string;
  inputs: IOSchema[];
  outputs: IOSchema[];
  constraints?: Constraint[];
}

export interface IOSchema {
  name: string;
  type: string;
  required: boolean;
  schema?: object;
}

export interface Constraint {
  type: 'resource' | 'time' | 'dependency' | 'policy';
  value: any;
}

export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  OFFLINE = 'offline',
  STARTING = 'starting',
  STOPPING = 'stopping'
}

export interface AgentMetadata {
  created: Date;
  updated: Date;
  author: string;
  tags: string[];
  description: string;
  documentation?: string;
}

export interface AgentConfig {
  resources?: ResourceConfig;
  scaling?: ScalingConfig;
  networking?: NetworkConfig;
  security?: SecurityConfig;
}

// Workflow Types
export interface Workflow {
  id: string;
  name: string;
  version: string;
  steps: WorkflowStep[];
  triggers: Trigger[];
  policies: string[];
  metadata: WorkflowMetadata;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agent: string;
  action: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  conditions?: Condition[];
  retryPolicy?: RetryPolicy;
  timeout?: number;
  dependencies?: string[];
}

export interface Trigger {
  type: 'schedule' | 'event' | 'webhook' | 'manual';
  config: Record<string, any>;
}

export interface Condition {
  type: 'if' | 'unless' | 'when';
  expression: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoff: 'linear' | 'exponential';
  initialDelay: number;
  maxDelay: number;
}

export interface WorkflowMetadata {
  author: string;
  description: string;
  tags: string[];
  created: Date;
  updated: Date;
}

// Task Types
export interface Task {
  id: string;
  workflowId: string;
  stepId: string;
  agentId: string;
  status: TaskStatus;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: TaskError;
  startTime?: Date;
  endTime?: Date;
  retries: number;
}

export enum TaskStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

export interface TaskError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

// Policy Types
export interface Policy {
  id: string;
  name: string;
  version: string;
  type: PolicyType;
  rules: PolicyRule[];
  enforcement: EnforcementLevel;
  metadata: PolicyMetadata;
}

export enum PolicyType {
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
  RESOURCE = 'resource',
  QUALITY = 'quality',
  PERFORMANCE = 'performance'
}

export interface PolicyRule {
  id: string;
  condition: string;
  action: PolicyAction;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export enum PolicyAction {
  ALLOW = 'allow',
  DENY = 'deny',
  WARN = 'warn',
  AUDIT = 'audit',
  REMEDIATE = 'remediate'
}

export enum EnforcementLevel {
  MANDATORY = 'mandatory',
  RECOMMENDED = 'recommended',
  OPTIONAL = 'optional'
}

export interface PolicyMetadata {
  author: string;
  description: string;
  compliance?: string[];
  created: Date;
  updated: Date;
}

// Communication Types
export interface Message {
  id: string;
  from: string;
  to: string | string[];
  type: MessageType;
  payload: any;
  timestamp: Date;
  correlationId?: string;
  replyTo?: string;
}

export enum MessageType {
  COMMAND = 'command',
  EVENT = 'event',
  QUERY = 'query',
  RESPONSE = 'response',
  ERROR = 'error'
}

// Configuration Types
export interface OrchestratorConfig {
  maxConcurrentTasks: number;
  taskTimeout: number;
  retryPolicy: RetryPolicy;
  messagebus: MessageBusConfig;
  registry: RegistryConfig;
  scheduler: SchedulerConfig;
}

export interface MessageBusConfig {
  type: 'kafka' | 'rabbitmq' | 'redis' | 'memory';
  connection: Record<string, any>;
  topics?: string[];
}

export interface RegistryConfig {
  type: 'consul' | 'etcd' | 'redis' | 'memory';
  connection: Record<string, any>;
  ttl?: number;
}

export interface SchedulerConfig {
  type: 'fifo' | 'priority' | 'fair' | 'custom';
  workers: number;
  queueSize: number;
}

export interface ResourceConfig {
  cpu?: string;
  memory?: string;
  disk?: string;
  gpu?: string;
}

export interface ScalingConfig {
  min: number;
  max: number;
  targetUtilization: number;
  scaleUpRate: number;
  scaleDownRate: number;
}

export interface NetworkConfig {
  ports?: number[];
  protocols?: string[];
  allowedHosts?: string[];
}

export interface SecurityConfig {
  authentication?: AuthConfig;
  authorization?: AuthzConfig;
  encryption?: EncryptionConfig;
}

export interface AuthConfig {
  type: 'jwt' | 'oauth2' | 'apikey' | 'mtls';
  config: Record<string, any>;
}

export interface AuthzConfig {
  type: 'rbac' | 'abac' | 'custom';
  config: Record<string, any>;
}

export interface EncryptionConfig {
  algorithm: string;
  keyStore: string;
}

// Export all types
export * from './agents/index.js';
export * from './workflows/index.js';
export * from './policies/index.js';