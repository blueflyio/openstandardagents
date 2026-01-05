---
title: "Autonomy"
description: "Agent autonomy levels and action control configuration"
weight: 6
---

# Autonomy Object

The `autonomy` object in `spec.autonomy` controls the agent's decision-making level and action permissions. It defines what the agent can do independently versus what requires human approval.

## Field Reference

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `level` | string (enum) | No | Autonomy level: `supervised`, `autonomous`, or `fully_autonomous` |
| `approval_required` | boolean | No | Whether human approval is required before executing actions |
| `allowed_actions` | array[string] | No | Whitelist of permitted actions. If empty or omitted, all actions allowed (subject to other constraints) |
| `blocked_actions` | array[string] | No | Blacklist of forbidden actions. Takes precedence over `allowed_actions` |
| `escalation_policy` | object | No | Rules for escalating to human oversight (platform-specific structure) |

## Autonomy Levels

### supervised

Agent operates with human oversight. Suitable for:
- Learning and testing new agents
- High-risk operations
- Regulated environments
- Customer-facing interactions

```yaml
autonomy:
  level: supervised
  approval_required: true
  allowed_actions:
    - read_data
    - analyze
    - generate_report
  blocked_actions:
    - delete_data
    - modify_production
    - send_external_communication
```

**Characteristics:**
- Human reviews agent actions before execution
- Suitable for read-heavy operations with limited writes
- Agent suggests actions, human confirms
- Ideal for production environments with strict change control

### autonomous

Agent makes independent decisions within defined boundaries. Suitable for:
- Well-tested agents
- Automated workflows
- Non-critical operations
- Internal tooling

```yaml
autonomy:
  level: autonomous
  approval_required: false
  allowed_actions:
    - read_data
    - analyze
    - generate_report
    - create_ticket
    - update_ticket
    - post_comment
  blocked_actions:
    - delete_data
    - modify_schema
    - grant_access
    - send_external_email
```

**Characteristics:**
- Agent acts independently within allowed actions
- No human approval required for routine operations
- Escalates only for blocked actions or errors
- Balances automation with safety

### fully_autonomous

Agent operates with maximum independence. Suitable for:
- Highly trusted agents
- Low-risk operations
- Fully automated pipelines
- Internal read-only analysis

```yaml
autonomy:
  level: fully_autonomous
  approval_required: false
  blocked_actions:
    - delete_production_data
    - modify_security_settings
    - grant_admin_access
```

**Characteristics:**
- Agent makes all decisions independently
- Minimal human intervention
- Relies on `blocked_actions` for safety
- Requires high confidence in agent reliability

## Default Behavior

If `autonomy` is omitted entirely:
```yaml
# Default values (platform-dependent)
autonomy:
  level: supervised              # Conservative default
  approval_required: true        # Require approval
  allowed_actions: []            # All actions allowed (if not blocked)
  blocked_actions: []            # No actions blocked
```

## Action Control

### Allowed Actions (Whitelist)

Define what the agent **can** do:

```yaml
autonomy:
  allowed_actions:
    - read_file
    - list_directory
    - search_code
    - analyze_metrics
    - generate_report
    - create_ticket
    - update_ticket
```

**Behavior:**
- If `allowed_actions` is empty or omitted: All actions allowed (subject to `blocked_actions`)
- If `allowed_actions` is specified: Only listed actions are permitted

### Blocked Actions (Blacklist)

Define what the agent **cannot** do:

```yaml
autonomy:
  blocked_actions:
    - delete_file
    - modify_production
    - grant_access
    - send_external_email
    - execute_shell_command
    - modify_database_schema
```

**Behavior:**
- `blocked_actions` takes precedence over `allowed_actions`
- If an action is in both lists, it is **blocked**

### Combined Example

```yaml
autonomy:
  level: autonomous
  approval_required: false

  # Agent CAN do these things
  allowed_actions:
    - read_file
    - write_file
    - create_directory
    - search_code
    - git_commit
    - git_push
    - create_pull_request

  # Agent CANNOT do these (even if in allowed_actions)
  blocked_actions:
    - git_push_force
    - delete_branch
    - modify_main_branch
    - bypass_ci_checks
```

## Approval Required

The `approval_required` boolean controls whether actions need human confirmation:

### No Approval (Fully Automated)

```yaml
autonomy:
  level: autonomous
  approval_required: false
  allowed_actions:
    - read_data
    - analyze
    - generate_report
    - create_ticket
```

**Use cases:**
- Automated monitoring and alerting
- Data analysis and reporting
- Log aggregation and analysis
- Non-destructive operations

### Approval Required

```yaml
autonomy:
  level: supervised
  approval_required: true
  allowed_actions:
    - create_pull_request
    - modify_configuration
    - deploy_to_staging
    - update_documentation
```

**Use cases:**
- Code changes
- Configuration updates
- Deployments
- Customer-facing changes
- Compliance-sensitive operations

## Escalation Policy

The `escalation_policy` object defines when and how to escalate to humans. Structure is platform-specific.

```yaml
autonomy:
  level: autonomous
  approval_required: false
  escalation_policy:
    # Escalate on high-risk actions
    high_risk_actions:
      - delete_data
      - modify_production
      - grant_access
    # Escalate on errors
    on_error: true
    max_retries: 3
    # Escalation channels
    channels:
      - type: slack
        channel: "#agent-alerts"
      - type: pagerduty
        severity: high
    # Escalation conditions
    conditions:
      - cost_exceeds: 100.00
      - duration_exceeds: 3600
      - error_rate_exceeds: 0.1
```

## Complete Examples

### Read-Only Analysis Agent

```yaml
apiVersion: ossa/v0.3.x
kind: Agent
metadata:
  name: log-analyzer
  version: 1.0.0
spec:
  role: You are a log analysis specialist.

  autonomy:
    level: fully_autonomous
    approval_required: false
    allowed_actions:
      - read_logs
      - search_logs
      - aggregate_metrics
      - detect_patterns
      - generate_report
      - create_ticket
    blocked_actions:
      - modify_logs
      - delete_logs
      - change_retention

  tools:
    - type: mcp
      server: loki
      capabilities:
        - query_logs
    - type: http
      name: jira
      endpoint: https://jira.example.com
```

### Code Review Agent (Supervised)

```yaml
apiVersion: ossa/v0.3.x
kind: Agent
metadata:
  name: code-reviewer
  version: 2.0.0
spec:
  role: You are a code review specialist.

  autonomy:
    level: supervised
    approval_required: true
    allowed_actions:
      - read_code
      - analyze_code
      - run_static_analysis
      - detect_vulnerabilities
      - generate_review_comments
      - post_review
    blocked_actions:
      - modify_code
      - merge_pull_request
      - approve_pull_request
      - bypass_checks

  tools:
    - type: mcp
      server: github
```

### Infrastructure Automation Agent

```yaml
apiVersion: ossa/v0.3.x
kind: Agent
metadata:
  name: k8s-autoscaler
  version: 1.5.0
spec:
  role: You are a Kubernetes autoscaling specialist.

  autonomy:
    level: autonomous
    approval_required: false
    allowed_actions:
      - get_metrics
      - analyze_usage
      - calculate_desired_replicas
      - scale_deployment
      - update_hpa
    blocked_actions:
      - delete_deployment
      - modify_production_namespace
      - scale_below_minimum
      - scale_above_maximum
    escalation_policy:
      conditions:
        - replica_count_exceeds: 50
        - cost_increase_exceeds_percent: 25
      channels:
        - type: slack
          channel: "#infrastructure-alerts"

  tools:
    - type: kubernetes
      namespace: applications
```

### Customer Support Agent

```yaml
apiVersion: ossa/v0.3.x
kind: Agent
metadata:
  name: support-assistant
  version: 1.0.0
spec:
  role: You are a customer support specialist.

  autonomy:
    level: supervised
    approval_required: true
    allowed_actions:
      - search_knowledge_base
      - search_tickets
      - analyze_customer_history
      - generate_response
      - create_draft_email
    blocked_actions:
      - send_email
      - close_ticket
      - modify_customer_data
      - issue_refund
      - grant_access
    escalation_policy:
      high_risk_actions:
        - billing_inquiry
        - account_access_request
        - data_deletion_request
      channels:
        - type: slack
          channel: "#customer-support"
        - type: email
          recipients:
            - support-managers@example.com

  tools:
    - type: mcp
      server: zendesk
    - type: mcp
      server: knowledge-base
```

### DevOps Incident Response

```yaml
apiVersion: ossa/v0.3.x
kind: Agent
metadata:
  name: incident-responder
  version: 2.1.0
spec:
  role: You are an incident response specialist.

  autonomy:
    level: autonomous
    approval_required: false
    allowed_actions:
      - get_alerts
      - analyze_metrics
      - check_logs
      - diagnose_issue
      - create_incident
      - update_incident
      - post_status_update
      - trigger_runbook
    blocked_actions:
      - restart_production_service
      - rollback_deployment
      - modify_configuration
      - grant_access
    escalation_policy:
      on_error: true
      max_retries: 2
      conditions:
        - severity: critical
        - duration_exceeds: 900  # 15 minutes
        - affected_users_exceeds: 1000
      channels:
        - type: pagerduty
          severity: high
        - type: slack
          channel: "#incidents"

  tools:
    - type: kubernetes
      namespace: production
      capabilities:
        - get_pods
        - get_logs
        - describe_pod
    - type: http
      name: prometheus
      endpoint: https://prometheus.example.com
```

## Action Naming Conventions

Use clear, descriptive action names:

**Good action names:**
```yaml
allowed_actions:
  - read_file
  - write_file
  - create_pull_request
  - merge_pull_request
  - scale_deployment
  - restart_pod
  - send_email
  - create_ticket
  - update_ticket
```

**Avoid vague names:**
```yaml
# ❌ Too vague
allowed_actions:
  - execute
  - modify
  - access
  - handle

# ✅ Specific
allowed_actions:
  - execute_query
  - modify_configuration
  - access_database
  - handle_webhook
```

## Best Practices

1. **Start conservative** - Begin with `supervised` and relax as confidence grows
2. **Whitelist over blacklist** - Use `allowed_actions` for explicit permissions
3. **Layer defenses** - Combine autonomy, constraints, and tool permissions
4. **Escalate intelligently** - Define clear escalation conditions
5. **Test thoroughly** - Validate blocked actions are truly blocked
6. **Document actions** - Maintain action registry for your organization
7. **Audit regularly** - Review autonomy settings for production agents
8. **Align with risk** - Match autonomy level to operation criticality
9. **Use approval for changes** - Require approval for state-changing operations
10. **Monitor continuously** - Track agent actions and escalations

## Security Considerations

### Defense in Depth

```yaml
# Multiple layers of protection
autonomy:
  level: supervised
  approval_required: true
  blocked_actions:
    - delete_data
    - modify_production

constraints:
  cost:
    maxCostPerDay: 50.0

tools:
  - type: kubernetes
    namespace: read-only
    config:
      read_only: true
```

### Principle of Least Privilege

```yaml
# Minimal permissions
autonomy:
  level: autonomous
  allowed_actions:
    - read_file        # Only what's needed
    - search_files
    - generate_report
  blocked_actions:
    - write_file       # Explicitly block writes
    - delete_file
    - modify_permissions
```

## Related Objects

- [Agent Spec](./agent-spec.md) - Parent object containing autonomy
- [Tools](./tools.md) - Tool-level permissions
- [Constraints](./constraints.md) - Cost and performance limits
- [Observability](./observability.md) - Action monitoring and auditing

## Validation

All fields are optional. Default values are platform-specific.

Enum values:
- `level`: `supervised`, `autonomous`, `fully_autonomous`
- `approval_required`: `true`, `false`
- `allowed_actions`: Array of strings (no validation on values)
- `blocked_actions`: Array of strings (no validation on values)
- `escalation_policy`: Object (structure not validated by schema)
