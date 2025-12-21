/**
 * OSSA Workflow Types
 * Type definitions for kind: Workflow - composition of Tasks and Agents
 */

import { JSONSchemaDefinition } from './task';
import { getApiVersion } from '../utils/version.js';

/**
 * Trigger types
 */
export type TriggerType = 'webhook' | 'cron' | 'event' | 'manual';

/**
 * Workflow step kinds
 */
export type WorkflowStepKind = 'Task' | 'Agent' | 'Parallel' | 'Conditional' | 'Loop';

/**
 * Failure handling actions
 */
export type FailureAction = 'halt' | 'continue' | 'rollback' | 'notify' | 'compensate';

/**
 * Step error actions
 */
export type StepErrorAction = 'fail' | 'continue' | 'goto' | 'compensate';

/**
 * Notification channels
 */
export type NotificationChannel = 'email' | 'slack' | 'webhook' | 'pagerduty';

/**
 * Workflow trigger configuration
 */
export interface WorkflowTrigger {
  /** Trigger type */
  type: TriggerType;
  /** Webhook path (for type=webhook) */
  path?: string;
  /** Cron expression (for type=cron) */
  schedule?: string;
  /** Event source (for type=event) */
  source?: string;
  /** Event name (for type=event) */
  event?: string;
  /** Event filter conditions */
  filter?: Record<string, unknown>;
}

/**
 * Secret reference
 */
export interface SecretRef {
  /** Secret name available to steps */
  name: string;
  /** Secret reference (e.g., vault://secret/api-key) */
  ref: string;
}

/**
 * Workflow context configuration
 */
export interface WorkflowContext {
  /** Workflow-level variables */
  variables?: Record<string, unknown>;
  /** Secret references available to steps */
  secrets?: SecretRef[];
}

/**
 * Concurrency control
 */
export interface WorkflowConcurrency {
  /** Concurrency group name */
  group?: string;
  /** Cancel running workflow if new one starts in same group */
  cancel_in_progress?: boolean;
}

/**
 * Retry policy
 */
export interface RetryPolicy {
  /** Maximum retry attempts */
  max_attempts?: number;
  /** Backoff strategy */
  backoff?: 'fixed' | 'exponential' | 'linear';
  /** Initial delay in milliseconds */
  initial_delay_ms?: number;
  /** Maximum delay in milliseconds */
  max_delay_ms?: number;
}

/**
 * Failure notification configuration
 */
export interface FailureNotification {
  /** Notification channels */
  channels?: NotificationChannel[];
  /** Notification template reference */
  template?: string;
}

/**
 * Workflow error handling configuration
 */
export interface WorkflowErrorHandling {
  /** Action on step failure */
  on_failure?: FailureAction;
  /** Steps to run on rollback/compensate */
  compensation_steps?: WorkflowStep[];
  /** Notification on failure */
  notification?: FailureNotification;
  /** Retry policy */
  retry_policy?: RetryPolicy;
}

/**
 * Workflow observability configuration
 */
export interface WorkflowObservability {
  /** Tracing configuration */
  tracing?: {
    enabled?: boolean;
    propagate_context?: boolean;
  };
  /** Metrics configuration */
  metrics?: {
    enabled?: boolean;
    custom_labels?: Record<string, string>;
  };
  /** Logging configuration */
  logging?: {
    level?: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Step output mapping
 */
export interface StepOutputMapping {
  /** Variable name to store output */
  to?: string;
  /** Specific fields to extract from output */
  fields?: string[];
}

/**
 * Step retry configuration
 */
export interface StepRetry {
  /** Maximum retry attempts */
  max_attempts?: number;
  /** Backoff strategy */
  backoff_strategy?: 'fixed' | 'exponential' | 'linear';
  /** Initial delay in milliseconds */
  initial_delay_ms?: number;
  /** Error codes that should trigger retry */
  retryable_errors?: string[];
}

/**
 * Step error handling
 */
export interface StepErrorHandling {
  /** Action on error */
  action?: StepErrorAction;
  /** Step ID to jump to on error (for action: goto) */
  goto?: string;
  /** Compensation step to run on error */
  compensation?: WorkflowStep;
}

/**
 * Loop configuration
 */
export interface LoopConfig {
  /** Expression returning array to iterate over */
  over: string;
  /** Variable name for current item */
  as?: string;
  /** Variable name for current index */
  index?: string;
  /** Maximum parallel iterations */
  parallelism?: number;
}

/**
 * Conditional branch
 */
export interface ConditionalBranch {
  /** Branch condition expression */
  condition: string;
  /** Steps to run if condition matches */
  steps: WorkflowStep[];
}

/**
 * Workflow step
 */
export interface WorkflowStep {
  /** Step identifier (unique within workflow) */
  id: string;
  /** Human-readable step name */
  name?: string;
  /** Step type */
  kind?: WorkflowStepKind;
  /** Reference to Task or Agent manifest file */
  ref?: string;
  /** Inline Task or Agent specification */
  inline?: Record<string, unknown>;
  /** Input mapping using expression syntax */
  input?: Record<string, unknown>;
  /** Output mapping to workflow context */
  output?: StepOutputMapping;
  /** Condition expression for conditional execution */
  condition?: string;
  /** Explicit dependencies on other steps */
  depends_on?: string[];
  /** Steps to run in parallel (for kind: Parallel) */
  parallel?: WorkflowStep[];
  /** Conditional branches (for kind: Conditional) */
  branches?: ConditionalBranch[];
  /** Steps to run if no branch condition matches */
  else?: WorkflowStep[];
  /** Loop configuration (for kind: Loop) */
  loop?: LoopConfig;
  /** Nested steps (for Loop and Conditional kinds) */
  steps?: WorkflowStep[];
  /** Step-specific retry configuration */
  retry?: StepRetry;
  /** Step-specific timeout in seconds */
  timeout_seconds?: number;
  /** Continue workflow even if this step fails */
  continue_on_error?: boolean;
  /** Step-specific error handling */
  on_error?: StepErrorHandling;
  /** Step labels for filtering */
  labels?: Record<string, string>;
}

/**
 * WorkflowSpec - Specification for workflow composition (kind: Workflow)
 */
export interface WorkflowSpec {
  /** Triggers that start the workflow */
  triggers?: WorkflowTrigger[];
  /** JSON Schema for workflow input validation */
  inputs?: JSONSchemaDefinition;
  /** JSON Schema for workflow output validation */
  outputs?: JSONSchemaDefinition;
  /** Workflow steps */
  steps: WorkflowStep[];
  /** Shared context available to all steps */
  context?: WorkflowContext;
  /** Concurrency control */
  concurrency?: WorkflowConcurrency;
  /** Workflow-level error handling */
  error_handling?: WorkflowErrorHandling;
  /** Maximum workflow execution time in seconds */
  timeout_seconds?: number;
  /** Workflow observability configuration */
  observability?: WorkflowObservability;
}

/**
 * OSSA Workflow manifest (kind: Workflow)
 */
export interface OssaWorkflow {
  /** OSSA API version */
  apiVersion: string;
  /** Resource type - must be 'Workflow' */
  kind: 'Workflow';
  /** Workflow metadata */
  metadata: {
    name: string;
    version?: string;
    description?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  /** Workflow specification */
  spec: WorkflowSpec;
  /** Framework-specific extensions */
  extensions?: Record<string, unknown>;
}

/**
 * Type guard to check if manifest is a Workflow
 */
export function isOssaWorkflow(manifest: unknown): manifest is OssaWorkflow {
  return (
    typeof manifest === 'object' &&
    manifest !== null &&
    'kind' in manifest &&
    (manifest as Record<string, unknown>).kind === 'Workflow'
  );
}

/**
 * Create an empty Workflow manifest with defaults
 */
export function createWorkflowManifest(
  name: string,
  options?: Partial<OssaWorkflow>
): OssaWorkflow {
  return {
    apiVersion: getApiVersion(),
    kind: 'Workflow',
    metadata: {
      name,
      version: '1.0.0',
      ...options?.metadata,
    },
    spec: {
      steps: [],
      ...options?.spec,
    },
    extensions: options?.extensions,
  };
}

/**
 * Helper to create a workflow step
 */
export function createStep(
  id: string,
  kind: WorkflowStepKind,
  options?: Partial<WorkflowStep>
): WorkflowStep {
  return {
    id,
    kind,
    ...options,
  };
}

/**
 * Helper to create an expression reference
 * @example expr('steps.fetch.output.content') => '${{ steps.fetch.output.content }}'
 */
export function expr(path: string): string {
  return `\${{ ${path} }}`;
}
