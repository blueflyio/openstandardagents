# OSSA Policy DSL Specification

**Version:** 1.0.0
**Status:** Draft
**Last Updated:** 2025-12-03

## Abstract

This document defines the formal Policy Domain-Specific Language (DSL) for the Open Standard for Scalable AI Agents (OSSA). The Policy DSL provides a declarative, type-safe mechanism for defining agent behavior constraints, escalation rules, and autonomous decision-making policies.

## Table of Contents

1. [Overview](#overview)
2. [Grammar Definition](#grammar-definition)
3. [Type System](#type-system)
4. [Operators](#operators)
5. [Policy Rules](#policy-rules)
6. [Escalation Policies](#escalation-policies)
7. [Examples](#examples)
8. [Error Handling](#error-handling)
9. [Security Considerations](#security-considerations)

---

## 1. Overview

The Policy DSL enables OSSA-compliant agents to:

- **Define Constraints**: Specify what actions are allowed or forbidden
- **Escalate Decisions**: Route complex decisions to human oversight
- **Enforce Compliance**: Validate actions against regulatory frameworks
- **Manage Autonomy**: Control the level of agent decision-making authority

### Design Principles

1. **Declarative**: Policies describe "what" not "how"
2. **Composable**: Simple policies combine into complex rules
3. **Type-Safe**: Static validation prevents runtime errors
4. **Human-Readable**: Policies are understandable by non-programmers
5. **Machine-Parseable**: Unambiguous formal grammar

---

## 2. Grammar Definition

### 2.1 EBNF Grammar

```ebnf
(* OSSA Policy DSL - EBNF Grammar v1.0 *)

(* Top-Level Structures *)
policy          = "policy" identifier "{" policy_body "}" ;
policy_body     = { policy_rule | escalation_rule } ;

(* Policy Rules *)
policy_rule     = "rule" identifier "{"
                    condition_clause
                    action_clause
                    [ effect_clause ]
                  "}" ;

condition_clause = "when" condition ;
action_clause    = "do" action ;
effect_clause    = "then" effect ;

(* Conditions *)
condition       = boolean_expr ;
boolean_expr    = comparison_expr
                | logical_expr
                | "(" boolean_expr ")" ;

logical_expr    = boolean_expr logical_op boolean_expr ;
logical_op      = "and" | "or" | "not" ;

comparison_expr = value comparison_op value ;
comparison_op   = "==" | "!=" | ">" | "<" | ">=" | "<="
                | "contains" | "matches" | "in" | "startsWith" | "endsWith" ;

(* Values *)
value           = literal
                | variable
                | function_call
                | array_literal
                | object_literal ;

literal         = string_literal
                | number_literal
                | boolean_literal
                | null_literal ;

string_literal  = '"' { any_char - '"' } '"' ;
number_literal  = [ "-" ] digit { digit } [ "." digit { digit } ] ;
boolean_literal = "true" | "false" ;
null_literal    = "null" ;

variable        = "$" identifier { "." identifier } ;
array_literal   = "[" [ value { "," value } ] "]" ;
object_literal  = "{" [ key_value { "," key_value } ] "}" ;
key_value       = identifier ":" value ;

function_call   = identifier "(" [ value { "," value } ] ")" ;

(* Actions *)
action          = action_type action_params ;
action_type     = "allow" | "deny" | "require_approval" | "log"
                | "escalate" | "notify" | "execute" ;

action_params   = "(" [ param { "," param } ] ")" ;
param           = identifier "=" value ;

(* Effects *)
effect          = "allow" | "deny" | "escalate" | "log" ;

(* Escalation Rules *)
escalation_rule = "escalate" identifier "{"
                    "when" condition
                    "to" escalation_target
                    [ "timeout" duration ]
                    [ "fallback" action ]
                  "}" ;

escalation_target = identifier | string_literal ;
duration         = number_literal time_unit ;
time_unit        = "s" | "m" | "h" | "d" ;

(* Identifiers *)
identifier      = letter { letter | digit | "_" } ;
letter          = "a" .. "z" | "A" .. "Z" ;
digit           = "0" .. "9" ;

(* Comments *)
comment         = "//" { any_char - newline } newline
                | "/*" { any_char } "*/" ;
```

### 2.2 Abstract Syntax Tree (AST)

```typescript
type PolicyAST = {
  type: 'Policy';
  name: string;
  rules: PolicyRule[];
  escalations: EscalationRule[];
};

type PolicyRule = {
  type: 'Rule';
  name: string;
  condition: Condition;
  action: Action;
  effect?: Effect;
};

type Condition = BooleanExpr;

type BooleanExpr =
  | ComparisonExpr
  | LogicalExpr
  | { type: 'Group'; expr: BooleanExpr };

type ComparisonExpr = {
  type: 'Comparison';
  left: Value;
  operator: ComparisonOperator;
  right: Value;
};

type LogicalExpr = {
  type: 'Logical';
  operator: LogicalOperator;
  operands: BooleanExpr[];
};
```

---

## 3. Type System

### 3.1 Core Types

```typescript
/**
 * Policy condition that must be satisfied for action execution
 */
interface PolicyCondition {
  /** Condition type */
  type: 'comparison' | 'logical' | 'function';

  /** Left-hand side value (for comparison) */
  left?: Value;

  /** Operator */
  operator: ComparisonOperator | LogicalOperator;

  /** Right-hand side value (for comparison) */
  right?: Value;

  /** Sub-conditions (for logical operators) */
  conditions?: PolicyCondition[];

  /** Function name (for function conditions) */
  function?: string;

  /** Function arguments */
  args?: Value[];
}

/**
 * Action to perform when condition matches
 */
interface PolicyAction {
  /** Action type */
  type: ActionType;

  /** Target resource or capability */
  target?: string;

  /** Action parameters */
  params?: Record<string, Value>;

  /** Effect of the action */
  effect: Effect;

  /** Notification configuration */
  notify?: NotificationConfig;

  /** Audit log configuration */
  audit?: AuditConfig;
}

/**
 * Complete policy rule
 */
interface PolicyRule {
  /** Rule identifier */
  id: string;

  /** Human-readable description */
  description?: string;

  /** Condition that triggers this rule */
  condition: PolicyCondition;

  /** Action to perform */
  action: PolicyAction;

  /** Rule priority (higher = evaluated first) */
  priority?: number;

  /** Rule enabled state */
  enabled?: boolean;

  /** Rule metadata */
  metadata?: Record<string, any>;
}

/**
 * Escalation policy for human-in-the-loop workflows
 */
interface EscalationPolicy {
  /** Escalation identifier */
  id: string;

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
}
```

### 3.2 Value Types

```typescript
type Value =
  | string
  | number
  | boolean
  | null
  | Value[]
  | Record<string, Value>
  | Variable
  | FunctionCall;

interface Variable {
  type: 'variable';
  path: string[];  // e.g., ['agent', 'cost', 'tokens']
}

interface FunctionCall {
  type: 'function';
  name: string;
  args: Value[];
}
```

### 3.3 Operator Types

```typescript
/**
 * Comparison operators for condition evaluation
 */
type ComparisonOperator =
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
type LogicalOperator =
  | 'and'   // &&
  | 'or'    // ||
  | 'not';  // !

/**
 * Action types
 */
type ActionType =
  | 'allow'             // Permit action
  | 'deny'              // Block action
  | 'require_approval'  // Escalate to human
  | 'log'               // Audit log only
  | 'escalate'          // Trigger escalation policy
  | 'notify'            // Send notification
  | 'execute';          // Execute custom function

/**
 * Action effects
 */
type Effect =
  | 'allow'     // Action is permitted
  | 'deny'      // Action is blocked
  | 'escalate'  // Escalate to human
  | 'log';      // Log and continue
```

### 3.4 Duration Type

```typescript
interface Duration {
  value: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
}

// Helper function
function parseDuration(str: string): Duration {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) throw new Error('Invalid duration format');

  const unitMap = { s: 'seconds', m: 'minutes', h: 'hours', d: 'days' };
  return {
    value: parseInt(match[1]),
    unit: unitMap[match[2]]
  };
}
```

---

## 4. Operators

### 4.1 Comparison Operators

| Operator | Symbol | Description | Example |
|----------|--------|-------------|---------|
| `equals` | `==` | Equality check | `$cost.tokens == 1000` |
| `notEquals` | `!=` | Inequality check | `$severity != "low"` |
| `greaterThan` | `>` | Greater than | `$confidence > 0.8` |
| `lessThan` | `<` | Less than | `$latency < 500` |
| `greaterEqual` | `>=` | Greater or equal | `$cvss_score >= 7.0` |
| `lessEqual` | `<=` | Less or equal | `$cost.daily <= 100.00` |
| `contains` | `contains` | Substring/array membership | `$message contains "error"` |
| `matches` | `matches` | Regex match | `$email matches "^[a-z]+@"` |
| `in` | `in` | Value in collection | `$action in ["delete", "drop"]` |
| `startsWith` | `startsWith` | String prefix | `$resource startsWith "prod-"` |
| `endsWith` | `endsWith` | String suffix | `$file endsWith ".sql"` |

### 4.2 Logical Operators

| Operator | Symbol | Description | Example |
|----------|--------|-------------|---------|
| `and` | `and`, `&&` | Logical AND | `$cost > 10 and $priority == "high"` |
| `or` | `or`, `\|\|` | Logical OR | `$severity == "critical" or $cvss >= 9.0` |
| `not` | `not`, `!` | Logical NOT | `not ($action in $blocked_actions)` |

### 4.3 Operator Precedence

From highest to lowest:

1. Function calls: `func()`
2. Grouping: `()`
3. Negation: `not`, `!`
4. Comparison: `==`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `matches`, `in`, `startsWith`, `endsWith`
5. Logical AND: `and`, `&&`
6. Logical OR: `or`, `||`

---

## 5. Policy Rules

### 5.1 Rule Structure

```yaml
# YAML representation (equivalent to DSL)
rule: cost_limit_exceeded
description: Block actions that exceed daily cost limit
condition:
  type: comparison
  left: $cost.daily
  operator: greaterThan
  right: $constraints.cost.maxCostPerDay
action:
  type: deny
  effect: deny
  notify:
    channels: [email, slack]
    message: "Daily cost limit exceeded: ${cost.daily} > ${constraints.cost.maxCostPerDay}"
priority: 100
```

### 5.2 Rule Evaluation

Rules are evaluated in **priority order** (highest first). The first matching rule determines the action.

**Evaluation Algorithm:**

```typescript
function evaluatePolicy(rules: PolicyRule[], context: Context): PolicyAction | null {
  // Sort by priority (descending)
  const sorted = rules
    .filter(r => r.enabled !== false)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  for (const rule of sorted) {
    if (evaluateCondition(rule.condition, context)) {
      return rule.action;
    }
  }

  return null;  // No matching rule (default allow)
}
```

### 5.3 Context Variables

Policies have access to runtime context via `$` variables:

```typescript
interface PolicyContext {
  // Agent metadata
  agent: {
    name: string;
    version: string;
    capabilities: string[];
  };

  // Current action
  action: {
    type: string;
    target: string;
    params: Record<string, any>;
  };

  // Cost metrics
  cost: {
    tokens: number;
    daily: number;
    monthly: number;
    currency: string;
  };

  // Performance metrics
  performance: {
    latency: number;
    throughput: number;
  };

  // Security context
  security: {
    user: string;
    role: string;
    permissions: string[];
  };

  // Compliance context
  compliance: {
    frameworks: string[];
    policies: string[];
  };

  // Time context
  time: {
    timestamp: number;
    hour: number;
    day: string;
    timezone: string;
  };
}
```

---

## 6. Escalation Policies

### 6.1 Escalation Structure

```typescript
interface EscalationTarget {
  type: 'user' | 'group' | 'role' | 'webhook';
  identifier: string;
  metadata?: Record<string, any>;
}

interface NotificationChannel {
  type: 'email' | 'slack' | 'pagerduty' | 'webhook' | 'sms';
  config: Record<string, any>;
}
```

### 6.2 Escalation Flow

```
┌─────────────────────┐
│  Action Requested   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Evaluate Policies  │
└──────────┬──────────┘
           │
           ▼
    ┌─────┴─────┐
    │  Match?   │
    └─────┬─────┘
      Yes │ No (default allow)
          │
          ▼
    ┌──────────────┐
    │   Effect?    │
    └──────┬───────┘
           │
    ┌──────┼──────┐
    │      │      │
    ▼      ▼      ▼
  ALLOW  DENY  ESCALATE
    │      │      │
    │      │      ▼
    │      │  ┌──────────────────┐
    │      │  │ Notify Human     │
    │      │  └────────┬─────────┘
    │      │           │
    │      │           ▼
    │      │  ┌──────────────────┐
    │      │  │ Wait for Response│
    │      │  └────────┬─────────┘
    │      │           │
    │      │      ┌────┴────┐
    │      │      │ Timeout?│
    │      │      └────┬────┘
    │      │        No │ Yes
    │      │           │  │
    │      │           │  ▼
    │      │           │ Fallback Action
    │      │           │
    │      │           ▼
    │      │  ┌──────────────────┐
    │      │  │ Human Approval?  │
    │      │  └────────┬─────────┘
    │      │       Yes │ No
    │      │           │  │
    ▼      ▼           ▼  ▼
┌────────────────────────────┐
│   Execute or Block Action  │
└────────────────────────────┘
```

### 6.3 Escalation Examples

```yaml
# High-severity security finding
escalation: critical_vulnerability
condition:
  type: logical
  operator: and
  conditions:
    - type: comparison
      left: $security.cvss_score
      operator: greaterEqual
      right: 9.0
    - type: comparison
      left: $security.exploitable
      operator: equals
      right: true
to:
  type: group
  identifier: security-team
timeout:
  value: 15
  unit: minutes
priority: critical
channels:
  - type: pagerduty
    config:
      service_id: P1234567
  - type: slack
    config:
      channel: "#security-alerts"
fallback:
  type: deny
  effect: deny
  notify:
    message: "Automatic deny due to escalation timeout"
```

---

## 7. Examples

### 7.1 Cost Control Policy

```yaml
policy: cost_control
rules:
  - rule: daily_limit
    description: Enforce daily cost limit
    condition:
      type: comparison
      left: $cost.daily
      operator: greaterThan
      right: $constraints.cost.maxCostPerDay
    action:
      type: deny
      effect: deny
      notify:
        channels: [email]
        message: "Daily cost limit exceeded"
    priority: 100

  - rule: high_cost_warning
    description: Warn on high single-request cost
    condition:
      type: comparison
      left: $cost.tokens
      operator: greaterThan
      right: 10000
    action:
      type: log
      effect: allow
      audit:
        level: warning
        message: "High token usage: ${cost.tokens}"
    priority: 50
```

### 7.2 Security Policy

```yaml
policy: security_controls
rules:
  - rule: block_destructive_actions
    description: Block dangerous Kubernetes actions
    condition:
      type: logical
      operator: and
      conditions:
        - type: comparison
          left: $action.type
          operator: in
          right: [delete, drop, terminate]
        - type: comparison
          left: $action.target
          operator: startsWith
          right: "prod-"
    action:
      type: deny
      effect: deny
      notify:
        channels: [slack]
        message: "Blocked destructive action on production: ${action.type} ${action.target}"
    priority: 200

escalations:
  - escalation: critical_vulnerability
    condition:
      type: comparison
      left: $security.cvss_score
      operator: greaterEqual
      right: 9.0
    to:
      type: group
      identifier: security-team
    timeout:
      value: 15
      unit: minutes
    priority: critical
    channels:
      - type: pagerduty
        config:
          service_id: P1234567
    fallback:
      type: deny
      effect: deny
```

### 7.3 Compliance Policy

```yaml
policy: gdpr_compliance
rules:
  - rule: pii_access_logging
    description: Log all PII access for GDPR compliance
    condition:
      type: logical
      operator: and
      conditions:
        - type: comparison
          left: $action.type
          operator: in
          right: [read, query, export]
        - type: comparison
          left: $action.target
          operator: contains
          right: "pii"
    action:
      type: log
      effect: allow
      audit:
        level: info
        compliance: [GDPR]
        message: "PII access by ${security.user}: ${action.type} on ${action.target}"
    priority: 150

  - rule: pii_export_approval
    description: Require approval for PII exports
    condition:
      type: logical
      operator: and
      conditions:
        - type: comparison
          left: $action.type
          operator: equals
          right: "export"
        - type: comparison
          left: $action.target
          operator: contains
          right: "pii"
    action:
      type: require_approval
      effect: escalate
      notify:
        channels: [email]
        message: "PII export requires approval: ${action.target}"
    priority: 200
```

### 7.4 Time-Based Policy

```yaml
policy: business_hours
rules:
  - rule: off_hours_escalation
    description: Require approval for high-risk actions outside business hours
    condition:
      type: logical
      operator: and
      conditions:
        - type: comparison
          left: $action.risk_level
          operator: equals
          right: "high"
        - type: logical
          operator: or
          conditions:
            - type: comparison
              left: $time.hour
              operator: lessThan
              right: 9
            - type: comparison
              left: $time.hour
              operator: greaterThan
              right: 17
            - type: comparison
              left: $time.day
              operator: in
              right: ["Saturday", "Sunday"]
    action:
      type: require_approval
      effect: escalate
      notify:
        channels: [pagerduty]
        message: "High-risk action outside business hours: ${action.type}"
    priority: 150
```

---

## 8. Error Handling

### 8.1 Error Types

```typescript
type PolicyError =
  | SyntaxError         // Invalid DSL syntax
  | ValidationError     // Invalid condition/action
  | EvaluationError     // Runtime evaluation failure
  | EscalationError     // Escalation timeout/failure
  | ContextError;       // Missing context variable

interface PolicyErrorDetails {
  type: PolicyError;
  message: string;
  rule?: string;
  location?: {
    line: number;
    column: number;
  };
  context?: Record<string, any>;
}
```

### 8.2 Error Handling Strategies

| Error Type | Strategy | Fallback |
|------------|----------|----------|
| `SyntaxError` | Reject policy at load time | N/A |
| `ValidationError` | Reject policy at load time | N/A |
| `EvaluationError` | Log error, default deny | Deny action |
| `EscalationError` | Execute fallback action | Deny action |
| `ContextError` | Log warning, skip rule | Continue to next rule |

### 8.3 Safe Defaults

When policy evaluation fails:

1. **Default Deny**: If no explicit `allow` action, default is `deny`
2. **Fail Closed**: Evaluation errors result in `deny`
3. **Audit All**: All decisions (success/failure) are logged
4. **Escalate on Uncertainty**: Ambiguous cases escalate to human

---

## 9. Security Considerations

### 9.1 Policy Injection Prevention

- **Validate all policy sources**: Only load policies from trusted sources
- **Sanitize context variables**: Escape special characters
- **Limit expression complexity**: Prevent DoS via complex regex/expressions

### 9.2 Privilege Escalation Prevention

- **Enforce least privilege**: Policies cannot grant more access than agent has
- **Validate escalation targets**: Ensure targets exist and are authorized
- **Audit all escalations**: Log who approved what and when

### 9.3 Information Disclosure Prevention

- **Redact sensitive data in logs**: Mask PII, credentials, secrets
- **Limit error details**: Don't leak internal state in error messages
- **Validate notification channels**: Prevent exfiltration via malicious webhooks

### 9.4 Compliance Considerations

- **GDPR**: Log all PII access with justification
- **SOC 2**: Require approval for sensitive actions
- **HIPAA**: Encrypt all PHI access logs
- **PCI DSS**: Separate production/non-production policies

---

## Appendix A: TypeScript Type Definitions

See `/src/types/policy.ts` for full TypeScript definitions.

---

## Appendix B: JSON Schema

See `/schemas/policy.schema.json` for JSON Schema validation.

---

## Appendix C: Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-03 | Initial specification |

---

## Appendix D: References

- [OSSA v0.2.3 Schema](../../spec/v0.2.3/ossa-0.2.3.schema.json)
- [EBNF Notation (ISO 14977)](https://www.iso.org/standard/26153.html)
- [JSON Schema Draft 07](https://json-schema.org/draft-07/schema)
- [OpenPolicy Agent (OPA)](https://www.openpolicyagent.org/)
- [Cedar Policy Language](https://www.cedarpolicy.com/)

---

**License:** MIT
**Maintainer:** OSSA Community
**Contact:** https://openstandardagents.org
