/**
 * OSSA Orchestra v0.1.8 - Core Types and Interfaces
 * Advanced Multi-Agent Workflow Orchestration Platform
 */

export interface AgentDefinition {
  id: string;
  name: string;
  type: 'analyzer' | 'generator' | 'validator' | 'transformer' | 'executor' | 'coordinator';
  version: string;
  endpoint: string;
  capabilities: AgentCapability[];
  resources: AgentResources;
  healthStatus: HealthStatus;
  metadata: AgentMetadata;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  inputSchema: object;
  outputSchema: object;
  performance: PerformanceMetrics;
  compliance: ComplianceLevel[];
  dependencies: string[];
}

export interface AgentResources {
  cpu: { min: number; max: number; current?: number };
  memory: { min: number; max: number; current?: number };
  network: { bandwidth: number; latency: number };
  storage?: { capacity: number; used?: number };
}

export interface PerformanceMetrics {
  responseTime: { target: number; max: number; current?: number };
  throughput: { target: number; max: number; current?: number };
  errorRate: { max: number; current?: number };
  availability: { target: number; current?: number };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  checks: HealthCheck[];
  score: number; // 0-100
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  timestamp: Date;
  duration: number;
}

export interface AgentMetadata {
  tags: string[];
  owner: string;
  created: Date;
  updated: Date;
  priority: number; // 1-10, higher = more priority
  environment: 'development' | 'staging' | 'production';
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  type: WorkflowType;
  stages: WorkflowStage[];
  dependencies: WorkflowDependency[];
  resources: WorkflowResources;
  constraints: WorkflowConstraints;
  compliance: ComplianceRequirement[];
  metadata: WorkflowMetadata;
}

export type WorkflowType = 
  | 'sequential' 
  | 'parallel' 
  | 'dag' 
  | 'pipeline' 
  | 'fanout' 
  | 'scatter_gather' 
  | 'conditional' 
  | 'loop' 
  | 'event_driven';

export interface WorkflowStage {
  id: string;
  name: string;
  agentId: string;
  capabilityId: string;
  input: WorkflowInput;
  output: WorkflowOutput;
  conditions?: WorkflowCondition[];
  retry: RetryPolicy;
  timeout: number;
  priority: number;
}

export interface WorkflowInput {
  type: 'static' | 'dynamic' | 'from_stage' | 'from_external';
  source?: string;
  data?: any;
  schema: object;
}

export interface WorkflowOutput {
  type: 'data' | 'event' | 'file' | 'stream';
  destination?: string;
  schema: object;
  processors?: string[];
}

export interface WorkflowCondition {
  type: 'data' | 'performance' | 'resource' | 'custom';
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'matches';
  value: any;
  action: 'continue' | 'skip' | 'retry' | 'fail' | 'branch';
}

export interface WorkflowDependency {
  stageId: string;
  dependsOn: string[];
  type: 'data' | 'completion' | 'resource';
}

export interface WorkflowResources {
  cpu: number;
  memory: number;
  network: number;
  storage?: number;
  maxConcurrency: number;
}

export interface WorkflowConstraints {
  maxExecutionTime: number;
  maxRetries: number;
  allowedFailures: number;
  resourceLimits: WorkflowResources;
  complianceRequired: boolean;
}

export interface ComplianceRequirement {
  level: ComplianceLevel;
  policies: string[];
  validation: ComplianceValidation;
}

export type ComplianceLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface ComplianceValidation {
  preExecution: string[];
  postExecution: string[];
  continuous: string[];
}

export interface WorkflowMetadata {
  description: string;
  tags: string[];
  owner: string;
  created: Date;
  updated: Date;
  category: string;
  documentation?: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffType: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
  retryOn: ('error' | 'timeout' | 'resource_exhausted')[];
}

export interface OrchestrationRequest {
  id: string;
  workflowId: string;
  input: any;
  priority: number;
  timeout?: number;
  callback?: string;
  metadata: RequestMetadata;
}

export interface RequestMetadata {
  user: string;
  origin: string;
  timestamp: Date;
  traceId: string;
  context: Record<string, any>;
}

export interface OrchestrationResult {
  id: string;
  requestId: string;
  status: ExecutionStatus;
  result?: any;
  error?: ExecutionError;
  metrics: ExecutionMetrics;
  stages: StageResult[];
  compliance: ComplianceResult;
}

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';

export interface ExecutionError {
  code: string;
  message: string;
  stage?: string;
  agent?: string;
  details?: any;
  recoverable: boolean;
}

export interface ExecutionMetrics {
  startTime: Date;
  endTime?: Date;
  duration: number;
  stagesExecuted: number;
  agentsUsed: string[];
  resourceUsage: ResourceUsage;
  performance: PerformanceData;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  network: number;
  storage?: number;
}

export interface PerformanceData {
  avgResponseTime: number;
  totalThroughput: number;
  errorRate: number;
  bottlenecks: string[];
}

export interface StageResult {
  stageId: string;
  agentId: string;
  capabilityId: string;
  status: ExecutionStatus;
  input: any;
  output?: any;
  error?: ExecutionError;
  metrics: StageMetrics;
}

export interface StageMetrics {
  startTime: Date;
  endTime?: Date;
  duration: number;
  retryCount: number;
  resourceUsage: ResourceUsage;
}

export interface ComplianceResult {
  level: ComplianceLevel;
  passed: boolean;
  violations: ComplianceViolation[];
  score: number;
}

export interface ComplianceViolation {
  policy: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stage?: string;
  remediation?: string;
}

export interface ScalingPolicy {
  id: string;
  name: string;
  trigger: ScalingTrigger;
  action: ScalingAction;
  constraints: ScalingConstraints;
  cooldown: number;
}

export interface ScalingTrigger {
  metric: 'cpu' | 'memory' | 'response_time' | 'queue_length' | 'error_rate';
  operator: 'gt' | 'lt' | 'gte' | 'lte';
  threshold: number;
  duration: number;
}

export interface ScalingAction {
  type: 'scale_up' | 'scale_down' | 'scale_out' | 'scale_in';
  amount: number;
  target: 'agent' | 'capability' | 'workflow';
}

export interface ScalingConstraints {
  minInstances: number;
  maxInstances: number;
  maxConcurrency: number;
  resourceLimits: WorkflowResources;
}

export interface LoadBalancingStrategy {
  type: 'round_robin' | 'least_connections' | 'weighted' | 'performance' | 'resource_aware' | 'custom';
  weights?: Record<string, number>;
  healthCheck: boolean;
  stickiness?: 'session' | 'user' | 'none';
}

export interface LoadBalancerConfig {
  strategy: LoadBalancingStrategy;
  healthCheckInterval: number;
  failoverTimeout: number;
  retryPolicy: RetryPolicy;
  circuitBreaker: CircuitBreakerConfig;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  recoveryTimeout: number;
  halfOpenRequestsLimit: number;
}

export interface MonitoringConfig {
  metrics: MetricsConfig;
  alerts: AlertConfig[];
  dashboards: DashboardConfig[];
}

export interface MetricsConfig {
  collection: {
    interval: number;
    retention: number;
    aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
  };
  export: {
    prometheus: boolean;
    influxdb?: string;
    elasticsearch?: string;
  };
}

export interface AlertConfig {
  id: string;
  name: string;
  condition: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  channels: string[];
  cooldown: number;
}

export interface DashboardConfig {
  id: string;
  name: string;
  panels: DashboardPanel[];
  refresh: number;
}

export interface DashboardPanel {
  id: string;
  type: 'graph' | 'table' | 'single_stat' | 'heatmap';
  title: string;
  query: string;
  options: Record<string, any>;
}