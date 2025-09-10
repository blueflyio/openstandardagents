/**
 * OSSA Core Type Definitions
 * Types-first approach for the entire platform
 */
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
export declare enum AgentType {
    WORKER = "worker",
    ORCHESTRATOR = "orchestrator",
    GOVERNOR = "governor",
    CRITIC = "critic",
    JUDGE = "judge",
    TRAINER = "trainer",
    INTEGRATOR = "integrator"
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
export declare enum AgentStatus {
    IDLE = "idle",
    BUSY = "busy",
    ERROR = "error",
    OFFLINE = "offline",
    STARTING = "starting",
    STOPPING = "stopping"
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
export declare enum TaskStatus {
    PENDING = "pending",
    QUEUED = "queued",
    RUNNING = "running",
    SUCCESS = "success",
    FAILED = "failed",
    CANCELLED = "cancelled",
    TIMEOUT = "timeout"
}
export interface TaskError {
    code: string;
    message: string;
    details?: any;
    stack?: string;
}
export interface Policy {
    id: string;
    name: string;
    version: string;
    type: PolicyType;
    rules: PolicyRule[];
    enforcement: EnforcementLevel;
    metadata: PolicyMetadata;
}
export declare enum PolicyType {
    SECURITY = "security",
    COMPLIANCE = "compliance",
    RESOURCE = "resource",
    QUALITY = "quality",
    PERFORMANCE = "performance"
}
export interface PolicyRule {
    id: string;
    condition: string;
    action: PolicyAction;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export declare enum PolicyAction {
    ALLOW = "allow",
    DENY = "deny",
    WARN = "warn",
    AUDIT = "audit",
    REMEDIATE = "remediate"
}
export declare enum EnforcementLevel {
    MANDATORY = "mandatory",
    RECOMMENDED = "recommended",
    OPTIONAL = "optional"
}
export interface PolicyMetadata {
    author: string;
    description: string;
    compliance?: string[];
    created: Date;
    updated: Date;
}
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
export declare enum MessageType {
    COMMAND = "command",
    EVENT = "event",
    QUERY = "query",
    RESPONSE = "response",
    ERROR = "error"
}
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
export * from './agents';
export * from './workflows';
export * from './policies';
//# sourceMappingURL=index.d.ts.map