/**
 * @fileoverview OSSA Policy DSL Type Definitions
 * @module @openstandardagents/policy
 * @version 1.0.0
 *
 * Formal type definitions for the OSSA Policy Domain-Specific Language.
 * See docs/specs/policy-dsl.md for full specification.
 */

// ============================================================================
// Core Value Types
// ============================================================================

/**
 * Variable reference in policy expressions (e.g., $cost.tokens)
 */
export interface Variable {
  type: 'variable';
  /** Dot-separated path (e.g., ['cost', 'tokens']) */
  path: string[];
}

/**
 * Primitive value types
 */
export type PrimitiveValue = string | number | boolean | null;

/**
 * Array of values (for recursive structure)
 */
export interface ValueArray extends Array<PolicyValue> {}

/**
 * Object of values (for recursive structure)
 */
export interface ValueObject {
  [key: string]: PolicyValue;
}

/**
 * Function call in policy expressions
 */
export interface FunctionCall {
  type: 'function';
  /** Function name */
  name: string;
  /** Function arguments */
  args: PolicyValue[];
}

/**
 * Value types supported in policy expressions
 */
export type PolicyValue =
  | PrimitiveValue
  | ValueArray
  | ValueObject
  | Variable
  | FunctionCall;

/**
 * @deprecated Use PolicyValue instead
 */
export type Value = PolicyValue;

// ============================================================================
// Operators
// ============================================================================

/**
 * Comparison operators for condition evaluation
 */
export type ComparisonOperator =
  | 'equals'        // ==
  | 'notEquals'     // !=
  | 'greaterThan'   // >
  | 'lessThan'      // <
  | 'greaterEqual'  // >=
  | 'lessEqual'     // <=
  | 'contains'      // substring/array membership
  | 'matches'       // regex match
  | 'in'            // value in array/set
  | 'startsWith'    // string prefix
  | 'endsWith';     // string suffix

/**
 * Logical operators for combining conditions
 */
export type LogicalOperator =
  | 'and'   // &&
  | 'or'    // ||
  | 'not';  // !

/**
 * Action types that can be performed by policies
 */
export type ActionType =
  | 'allow'             // Permit action
  | 'deny'              // Block action
  | 'require_approval'  // Escalate to human
  | 'log'               // Audit log only
  | 'escalate'          // Trigger escalation policy
  | 'notify'            // Send notification
  | 'execute';          // Execute custom function

/**
 * Action effects (final outcome)
 */
export type Effect =
  | 'allow'     // Action is permitted
  | 'deny'      // Action is blocked
  | 'escalate'  // Escalate to human
  | 'log';      // Log and continue

// ============================================================================
// Conditions
// ============================================================================

/**
 * Comparison expression (e.g., $cost.tokens > 1000)
 */
export interface ComparisonCondition {
  type: 'comparison';
  /** Left-hand side value */
  left: PolicyValue;
  /** Comparison operator */
  operator: ComparisonOperator;
  /** Right-hand side value */
  right: PolicyValue;
}

/**
 * Logical expression (AND, OR, NOT)
 */
export interface LogicalCondition {
  type: 'logical';
  /** Logical operator */
  operator: LogicalOperator;
  /** Sub-conditions */
  conditions: PolicyCondition[];
}

/**
 * Function-based condition
 */
export interface FunctionCondition {
  type: 'function';
  /** Function name */
  function: string;
  /** Function arguments */
  args: PolicyValue[];
}

/**
 * Policy condition (union type)
 */
export type PolicyCondition =
  | ComparisonCondition
  | LogicalCondition
  | FunctionCondition;

// ============================================================================
// Actions & Notifications
// ============================================================================

/**
 * Notification channel configuration
 */
export interface NotificationChannel {
  /** Channel type */
  type: 'email' | 'slack' | 'pagerduty' | 'webhook' | 'sms';
  /** Channel-specific configuration */
  config: Record<string, any>;
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
  /** Notification channels */
  channels: ('email' | 'slack' | 'pagerduty' | 'webhook' | 'sms')[];
  /** Notification message (supports template variables) */
  message: string;
  /** Additional notification metadata */
  metadata?: Record<string, any>;
}

/**
 * Audit log configuration
 */
export interface AuditConfig {
  /** Log level */
  level: 'debug' | 'info' | 'warning' | 'error';
  /** Log message (supports template variables) */
  message: string;
  /** Compliance frameworks */
  compliance?: string[];
  /** Additional audit metadata */
  metadata?: Record<string, any>;
}

/**
 * Policy action
 */
export interface PolicyAction {
  /** Action type */
  type: ActionType;

  /** Target resource or capability */
  target?: string;

  /** Action parameters */
  params?: Record<string, PolicyValue>;

  /** Effect of the action */
  effect: Effect;

  /** Notification configuration */
  notify?: NotificationConfig;

  /** Audit log configuration */
  audit?: AuditConfig;
}

// ============================================================================
// Policy Rules
// ============================================================================

/**
 * Complete policy rule
 */
export interface PolicyRule {
  /** Unique rule identifier */
  id: string;

  /** Human-readable description */
  description?: string;

  /** Condition that triggers this rule */
  condition: PolicyCondition;

  /** Action to perform when condition matches */
  action: PolicyAction;

  /** Rule priority (higher = evaluated first) */
  priority?: number;

  /** Rule enabled state */
  enabled?: boolean;

  /** Rule metadata */
  metadata?: Record<string, any>;
}

// ============================================================================
// Escalation Policies
// ============================================================================

/**
 * Duration (timeout, delay, etc.)
 */
export interface Duration {
  /** Numeric value */
  value: number;
  /** Time unit */
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
}

/**
 * Escalation target (human or system)
 */
export interface EscalationTarget {
  /** Target type */
  type: 'user' | 'group' | 'role' | 'webhook';
  /** Target identifier (user ID, group name, etc.) */
  identifier: string;
  /** Additional target metadata */
  metadata?: Record<string, any>;
}

/**
 * Escalation policy for human-in-the-loop workflows
 */
export interface EscalationPolicy {
  /** Unique escalation identifier */
  id: string;

  /** Human-readable description */
  description?: string;

  /** Condition that triggers escalation */
  condition: PolicyCondition;

  /** Escalation target (user, group, role) */
  target: EscalationTarget;

  /** Timeout for human response */
  timeout?: Duration;

  /** Fallback action if timeout expires */
  fallback?: PolicyAction;

  /** Escalation priority */
  priority?: 'low' | 'medium' | 'high' | 'critical';

  /** Notification channels */
  channels?: NotificationChannel[];

  /** Escalation metadata */
  metadata?: Record<string, any>;
}

// ============================================================================
// Policy Context
// ============================================================================

/**
 * Policy evaluation context
 * Variables accessible via $ prefix in policy expressions
 */
export interface PolicyContext {
  /** Agent metadata */
  agent: {
    name: string;
    version: string;
    capabilities: string[];
  };

  /** Current action being evaluated */
  action: {
    type: string;
    target: string;
    params: Record<string, any>;
  };

  /** Cost metrics */
  cost: {
    tokens: number;
    daily: number;
    monthly: number;
    currency: string;
  };

  /** Performance metrics */
  performance: {
    latency: number;
    throughput: number;
  };

  /** Security context */
  security: {
    user: string;
    role: string;
    permissions: string[];
  };

  /** Compliance context */
  compliance: {
    frameworks: string[];
    policies: string[];
  };

  /** Time context */
  time: {
    timestamp: number;
    hour: number;
    day: string;
    timezone: string;
  };

  /** Custom context fields */
  [key: string]: any;
}

// ============================================================================
// Policy Document
// ============================================================================

/**
 * Complete policy document
 */
export interface PolicyDocument {
  /** Policy identifier */
  id: string;

  /** Policy version (semver) */
  version: string;

  /** Human-readable description */
  description?: string;

  /** Policy rules */
  rules: PolicyRule[];

  /** Escalation policies */
  escalations?: EscalationPolicy[];

  /** Policy metadata */
  metadata?: Record<string, any>;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Policy error types
 */
export type PolicyErrorType =
  | 'SyntaxError'       // Invalid DSL syntax
  | 'ValidationError'   // Invalid condition/action
  | 'EvaluationError'   // Runtime evaluation failure
  | 'EscalationError'   // Escalation timeout/failure
  | 'ContextError';     // Missing context variable

/**
 * Policy error details
 */
export interface PolicyErrorDetails {
  /** Error type */
  type: PolicyErrorType;

  /** Error message */
  message: string;

  /** Rule identifier (if applicable) */
  rule?: string;

  /** Source location (if applicable) */
  location?: {
    line: number;
    column: number;
  };

  /** Additional error context */
  context?: Record<string, any>;
}

/**
 * Policy error class
 */
export class PolicyError extends Error {
  public readonly details: PolicyErrorDetails;

  constructor(details: PolicyErrorDetails) {
    super(details.message);
    this.name = 'PolicyError';
    this.details = details;
  }
}

// ============================================================================
// Evaluation Result
// ============================================================================

/**
 * Policy evaluation result
 */
export interface PolicyEvaluationResult {
  /** Whether action is allowed */
  allowed: boolean;

  /** Effect applied */
  effect: Effect;

  /** Matched rule (if any) */
  rule?: string;

  /** Action taken */
  action?: PolicyAction;

  /** Escalation (if escalated) */
  escalation?: EscalationPolicy;

  /** Evaluation errors (if any) */
  errors?: PolicyErrorDetails[];

  /** Evaluation metadata */
  metadata?: {
    /** Evaluation duration (ms) */
    duration: number;
    /** Rules evaluated */
    rulesEvaluated: number;
    /** Timestamp */
    timestamp: number;
  };
}

// ============================================================================
// Parser & Evaluator Interfaces
// ============================================================================

/**
 * Policy parser interface
 */
export interface PolicyParser {
  /**
   * Parse policy DSL string into PolicyDocument
   */
  parse(source: string): PolicyDocument;

  /**
   * Validate policy document
   */
  validate(policy: PolicyDocument): PolicyErrorDetails[];
}

/**
 * Policy evaluator interface
 */
export interface PolicyEvaluator {
  /**
   * Evaluate policy rules against context
   */
  evaluate(
    policy: PolicyDocument,
    context: PolicyContext
  ): PolicyEvaluationResult;

  /**
   * Evaluate single condition against context
   */
  evaluateCondition(
    condition: PolicyCondition,
    context: PolicyContext
  ): boolean;

  /**
   * Execute policy action
   */
  executeAction(
    action: PolicyAction,
    context: PolicyContext
  ): Promise<void>;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse duration string (e.g., "15m", "2h")
 */
export function parseDuration(str: string): Duration {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    throw new PolicyError({
      type: 'ValidationError',
      message: `Invalid duration format: ${str}`,
    });
  }

  const unitMap: Record<string, Duration['unit']> = {
    s: 'seconds',
    m: 'minutes',
    h: 'hours',
    d: 'days',
  };

  return {
    value: parseInt(match[1], 10),
    unit: unitMap[match[2]],
  };
}

/**
 * Format duration as human-readable string
 */
export function formatDuration(duration: Duration): string {
  const unitLabels: Record<Duration['unit'], string> = {
    seconds: 'second',
    minutes: 'minute',
    hours: 'hour',
    days: 'day',
  };

  const label = unitLabels[duration.unit];
  return `${duration.value} ${label}${duration.value !== 1 ? 's' : ''}`;
}

/**
 * Resolve variable path in context
 */
export function resolveVariable(
  variable: Variable,
  context: PolicyContext
): PolicyValue {
  let value: any = context;

  for (const key of variable.path) {
    if (value === null || value === undefined) {
      throw new PolicyError({
        type: 'ContextError',
        message: `Cannot resolve variable: $${variable.path.join('.')}`,
        context: { path: variable.path, availableKeys: Object.keys(value || {}) },
      });
    }

    value = value[key];
  }

  return value;
}
