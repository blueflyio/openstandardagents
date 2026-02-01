/**
 * OSSA Task Types
 * Type definitions for kind: Task - deterministic workflow steps
 */
/**
 * Execution type for tasks
 */
export type TaskExecutionType = 'deterministic' | 'idempotent' | 'transactional';
/**
 * Backoff strategy for retries
 */
export type BackoffStrategy = 'fixed' | 'exponential' | 'linear';
/**
 * Error handling action
 */
export type ErrorAction = 'fail' | 'retry' | 'fallback' | 'ignore';
/**
 * Batch item error handling
 */
export type BatchItemErrorAction = 'skip' | 'fail' | 'retry';
/**
 * Task execution configuration
 */
export interface TaskExecution {
    /** Execution type: deterministic, idempotent, or transactional */
    type: TaskExecutionType;
    /** Target runtime environment (drupal, symfony, node, python, any) */
    runtime?: string;
    /** Entry point for execution (class::method, function name, or script path) */
    entrypoint?: string;
    /** Maximum execution time in seconds */
    timeout_seconds?: number;
}
/**
 * Retry configuration
 */
export interface RetryConfig {
    /** Maximum number of retry attempts */
    max_attempts?: number;
    /** Backoff strategy between retries */
    backoff_strategy?: BackoffStrategy;
    /** Initial delay in milliseconds */
    initial_delay_ms?: number;
}
/**
 * Batch processing configuration
 */
export interface TaskBatchConfig {
    /** Enable batch processing mode */
    enabled?: boolean;
    /** Maximum parallel executions */
    parallelism?: number;
    /** Items per batch chunk */
    chunk_size?: number;
    /** Retry configuration */
    retry?: RetryConfig;
    /** Behavior when individual item fails */
    on_item_error?: BatchItemErrorAction;
}
/**
 * Task dependency reference
 */
export interface TaskDependency {
    /** Reference to dependency (file path or name) */
    ref: string;
    /** Kind of dependency */
    kind?: 'Task' | 'Agent';
    /** Whether this dependency is optional */
    optional?: boolean;
}
/**
 * Condition expression
 */
export interface TaskCondition {
    /** Condition expression (e.g., '${{ input.status == "draft" }}') */
    expression: string;
    /** Error message if condition fails */
    error_message?: string;
}
/**
 * Error handling configuration
 */
export interface TaskErrorHandling {
    /** Action on error */
    on_error?: ErrorAction;
    /** Reference to fallback task on failure */
    fallback_task?: string;
    /** Map error codes to actions */
    error_mapping?: Record<string, ErrorAction>;
}
/**
 * Logging configuration
 */
export interface TaskLogging {
    /** Log level */
    level?: 'debug' | 'info' | 'warn' | 'error';
    /** Log input data (caution: may contain sensitive data) */
    include_input?: boolean;
    /** Log output data */
    include_output?: boolean;
}
/**
 * Metrics configuration
 */
export interface TaskMetrics {
    /** Enable metrics */
    enabled?: boolean;
    /** Custom metric labels */
    custom_labels?: Record<string, string>;
}
/**
 * Tracing configuration
 */
export interface TaskTracing {
    /** Enable tracing */
    enabled?: boolean;
    /** Sample rate (0-1) */
    sample_rate?: number;
}
/**
 * Task observability configuration
 */
export interface TaskObservability {
    /** Logging configuration */
    logging?: TaskLogging;
    /** Metrics configuration */
    metrics?: TaskMetrics;
    /** Tracing configuration */
    tracing?: TaskTracing;
}
/**
 * JSON Schema definition (simplified)
 */
export interface JSONSchemaDefinition {
    type?: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
    properties?: Record<string, unknown>;
    required?: string[];
    items?: Record<string, unknown>;
    additionalProperties?: boolean | Record<string, unknown>;
    [key: string]: unknown;
}
/**
 * TaskSpec - Specification for deterministic workflow steps (kind: Task)
 */
export interface TaskSpec {
    /** Execution configuration */
    execution: TaskExecution;
    /** Abstract capabilities this task requires */
    capabilities?: string[];
    /** JSON Schema for task input validation */
    input?: JSONSchemaDefinition;
    /** JSON Schema for task output validation */
    output?: JSONSchemaDefinition;
    /** Batch processing configuration */
    batch?: TaskBatchConfig;
    /** Task dependencies */
    dependencies?: TaskDependency[];
    /** Conditions that must be true before execution */
    preconditions?: TaskCondition[];
    /** Conditions that must be true after execution */
    postconditions?: TaskCondition[];
    /** Error handling configuration */
    error_handling?: TaskErrorHandling;
    /** Observability configuration */
    observability?: TaskObservability;
}
/**
 * Runtime capability binding
 */
export interface CapabilityBinding {
    /** Handler class/function */
    handler?: string;
    /** MCP server name for MCP-based bindings */
    mcp_server?: string;
    /** Tool name within MCP server */
    tool?: string;
    /** Additional binding configuration */
    config?: Record<string, unknown>;
}
/**
 * Runtime binding configuration
 */
export interface RuntimeBinding {
    /** Runtime type identifier */
    type?: string;
    /** Message transport for async runtimes */
    transport?: string;
    /** Map of capability names to runtime-specific handlers */
    bindings?: Record<string, CapabilityBinding>;
}
/**
 * OSSA Task manifest (kind: Task)
 */
export interface OssaTask {
    /** OSSA API version */
    apiVersion: string;
    /** Resource type - must be 'Task' */
    kind: 'Task';
    /** Task metadata */
    metadata: {
        name: string;
        version?: string;
        description?: string;
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
    };
    /** Task specification */
    spec: TaskSpec;
    /** Framework-specific extensions */
    extensions?: Record<string, unknown>;
    /** Runtime capability bindings */
    runtime?: RuntimeBinding;
}
/**
 * Type guard to check if manifest is a Task
 */
export declare function isOssaTask(manifest: unknown): manifest is OssaTask;
/**
 * Create an empty Task manifest with defaults
 */
export declare function createTaskManifest(name: string, options?: Partial<OssaTask>): OssaTask;
