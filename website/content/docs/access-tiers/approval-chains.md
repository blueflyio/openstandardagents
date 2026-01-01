---
title: "Approval Chains"
description: "OSSA v0.3.2 approval chain workflows for privileged agent operations"
weight: 4
---

# Approval Chains

OSSA v0.3.2 defines approval chain workflows for privileged operations. These chains ensure that elevated operations receive appropriate oversight before execution.

## Overview

Approval chains are required for:

- **Tier 3 (Write Elevated)** operations
- Production deployments
- Infrastructure modifications
- Security-sensitive changes

## Chain Types

### Standard Approval

**Name**: Standard Approval  
**Description**: Single human or governor approval  
**Use Case**: Routine elevated operations

```yaml
approval_chains:
  standard:
    name: "Standard Approval"
    description: "Single human or governor approval"
    steps:
      - type: human_or_governor
        required: 1
        timeout_minutes: 60
```

#### Workflow

```
Tier 3 Agent → Requests Action
       ↓
[Human OR Governor] → Approves
       ↓
Action Executed
```

#### Configuration Example

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: config-updater
  labels:
    access_tier: tier_3_write_elevated

spec:
  type: operator

  access:
    tier: tier_3_write_elevated
    requires_approval: true
    approval_chain: standard

  autonomy:
    level: supervised
    approval_required:
      - modify_configs
      - update_settings
```

---

### Elevated Approval

**Name**: Elevated Approval  
**Description**: Human approval required for critical operations  
**Use Case**: Deployments, infrastructure changes

```yaml
approval_chains:
  elevated:
    name: "Elevated Approval"
    description: "Human approval required for critical operations"
    steps:
      - type: governor
        required: 1
        timeout_minutes: 15
      - type: human
        required: 1
        timeout_minutes: 120
```

#### Workflow

```
Tier 3 Agent → Requests Action
       ↓
[Governor Agent] → Pre-approves (15 min timeout)
       ↓
[Human Reviewer] → Final Approval (120 min timeout)
       ↓
Action Executed
```

#### Configuration Example

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: deployment-operator
  labels:
    access_tier: tier_3_write_elevated

spec:
  type: operator

  role: |
    You are a deployment operator. All deployments require elevated approval
    through a two-step process: governor pre-approval followed by human approval.

  access:
    tier: tier_3_write_elevated
    requires_approval: true
    approval_chain: elevated
    permissions:
      - execute_deployments
      - modify_pipelines
      - merge_mrs

  autonomy:
    level: supervised
    approval_required:
      - deploy_to_production
      - modify_infrastructure
      - delete_resources

  safety:
    human_in_loop:
      enabled: true
      triggers:
        - production_deployment
        - infrastructure_change
```

---

### Critical Approval

**Name**: Critical Approval  
**Description**: Multi-party approval for production changes  
**Use Case**: Production deployments, security modifications, data operations

```yaml
approval_chains:
  critical:
    name: "Critical Approval"
    description: "Multi-party approval for production changes"
    steps:
      - type: automated_checks
        required: all
        checks:
          - security_scan
          - compliance_check
          - rollback_plan_exists
      - type: governor
        required: 1
        timeout_minutes: 15
      - type: human
        required: 2  # Two human approvers
        timeout_minutes: 240
```

#### Workflow

```
Tier 3 Agent → Requests Action
       ↓
[Automated Checks] → ALL must pass
  ├─ security_scan
  ├─ compliance_check
  └─ rollback_plan_exists
       ↓
[Governor Agent] → Policy approval (15 min timeout)
       ↓
[Human Reviewer 1] → First approval
       ↓
[Human Reviewer 2] → Second approval (240 min timeout total)
       ↓
Action Executed
```

#### Configuration Example

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: production-deployer
  labels:
    access_tier: tier_3_write_elevated
    domain: infrastructure

spec:
  type: operator

  role: |
    You are a production deployment operator. All production changes require
    critical approval: automated checks, governor approval, and two human approvers.

    CRITICAL: Never bypass the approval chain. All steps must complete.

  access:
    tier: tier_3_write_elevated
    requires_approval: true
    approval_chain: critical
    permissions:
      - execute_deployments
      - modify_pipelines
      - merge_mrs
    prohibited:
      - delete_production
      - bypass_approvals
      - force_push

  safety:
    guardrails:
      enabled: true
      policies:
        - require_rollback_plan
        - no_production_deletes
        - approval_chain_required
        - security_scan_required
        - compliance_check_required
    human_in_loop:
      enabled: true
      required_approvers: 2
      triggers:
        - production_deployment
        - infrastructure_change
        - security_modification
        - data_migration

  compliance:
    frameworks:
      - SOC2
      - ISO27001
    audit_logging: required
```

---

## Approval Step Types

### human_or_governor

Either a human or a governor agent can approve:

```yaml
- type: human_or_governor
  required: 1
  timeout_minutes: 60
```

### human

Only a human can approve (no agent delegation):

```yaml
- type: human
  required: 1           # Number of approvers
  timeout_minutes: 120  # Time limit
```

### governor

A Tier 4 policy agent approves:

```yaml
- type: governor
  required: 1
  timeout_minutes: 15
```

### automated_checks

Automated validation before human approval:

```yaml
- type: automated_checks
  required: all  # All checks must pass
  checks:
    - security_scan
    - compliance_check
    - rollback_plan_exists
    - tests_passing
    - no_breaking_changes
```

---

## Timeout Behavior

When an approval step times out:

| Chain | Step | Timeout | Behavior |
|-------|------|---------|----------|
| Standard | human_or_governor | 60 min | Escalate to human |
| Elevated | governor | 15 min | Escalate to human |
| Elevated | human | 120 min | Cancel operation |
| Critical | automated_checks | N/A | Fail immediately |
| Critical | governor | 15 min | Escalate to human |
| Critical | human | 240 min | Cancel operation |

### Timeout Configuration

```yaml
autonomy:
  escalation_policy:
    triggers:
      - approval_timeout
      - deployment_failure
      - security_alert
    notify:
      - slack:#platform-alerts
      - email:ops-team@company.com
    timeout_action: escalate  # or: cancel, retry
```

---

## Implementing Approval Workflows

### Agent-Side Configuration

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: infra-operator
  labels:
    access_tier: tier_3_write_elevated

spec:
  access:
    tier: tier_3_write_elevated
    requires_approval: true
    approval_chain: elevated

  # Define which actions require approval
  autonomy:
    level: supervised
    approval_required:
      - deploy_to_production
      - modify_infrastructure
      - delete_resources
      - modify_security_settings
    allowed_actions:
      - deploy_to_staging
      - run_tests
      - view_metrics
      - generate_reports

  # Escalation when approval is delayed
  safety:
    human_in_loop:
      enabled: true
      triggers:
        - production_deployment
        - infrastructure_change
```

### Governor-Side Configuration

Governors can pre-approve operations within policy bounds:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: deployment-governor
  labels:
    access_tier: tier_4_policy

spec:
  type: governor

  role: |
    You are a deployment governance agent that reviews and pre-approves
    deployment requests based on policy compliance.

    You can approve requests that:
    - Pass all automated security checks
    - Have a valid rollback plan
    - Are within the approved deployment window
    - Do not exceed cost thresholds

  access:
    tier: tier_4_policy
    permissions:
      - read_*
      - audit_compliance
      - define_policies
      - approve_delegations  # Can approve Tier 3 requests

  # Approval criteria
  policies:
    deployment_approval:
      conditions:
        - security_scan: passed
        - rollback_plan: exists
        - deployment_window: valid
        - cost_impact: below_threshold
      auto_approve: true  # Auto-approve if all conditions met
```

---

## Audit Requirements

Each approval chain has associated audit requirements:

| Chain | Audit Level | Retention | Includes |
|-------|-------------|-----------|----------|
| Standard | Standard | 30 days | agent_id, operation, timestamp, result |
| Elevated | Detailed | 90 days | + input_summary, affected_resources, approval_chain |
| Critical | Comprehensive | 365 days | + full_input, full_output, policy_version, compliance_status |

### Audit Configuration

```yaml
observability:
  tracing:
    enabled: true
    exporter: otlp
  metrics:
    enabled: true
    customMetrics:
      - name: approvals_requested
        type: counter
        description: Total approval requests
      - name: approval_latency_seconds
        type: histogram
        description: Time to receive approval
      - name: approvals_denied
        type: counter
        description: Approval requests denied
  logging:
    level: info
    format: json
    include_approval_chain: true
```

---

## Custom Approval Chains

Define custom approval chains for specific use cases:

```yaml
approval_chains:
  database_migration:
    name: "Database Migration Approval"
    description: "Multi-step approval for database changes"
    steps:
      - type: automated_checks
        required: all
        checks:
          - backup_exists
          - migration_tested_on_staging
          - rollback_script_exists
      - type: human
        required: 1
        role: dba
        timeout_minutes: 60
      - type: governor
        required: 1
        timeout_minutes: 15
      - type: human
        required: 1
        role: engineering_lead
        timeout_minutes: 120

  security_change:
    name: "Security Change Approval"
    description: "Approval for security-sensitive changes"
    steps:
      - type: automated_checks
        required: all
        checks:
          - security_review_complete
          - no_known_vulnerabilities
          - penetration_test_passed
      - type: human
        required: 2
        role: security_team
        timeout_minutes: 480  # 8 hours
```

### Using Custom Chains

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: database-migrator

spec:
  access:
    tier: tier_3_write_elevated
    requires_approval: true
    approval_chain: database_migration  # Reference custom chain
```

---

## CLI Commands

Manage approval chains with the OSSA CLI:

```bash
# Install the CLI
npm install -g @bluefly/openstandardagents

# Validate approval chain configuration
ossa validate agent.ossa.yaml --check approval-chain

# List pending approvals (runtime)
ossa approvals list

# Approve a pending request (runtime)
ossa approvals approve <request-id>

# Deny a pending request (runtime)
ossa approvals deny <request-id> --reason "Policy violation"
```

---

## Best Practices

### 1. Match Chain to Risk Level

| Risk Level | Recommended Chain | Examples |
|------------|-------------------|----------|
| Low | Standard | Config updates, staging deploys |
| Medium | Elevated | Production deploys, pipeline changes |
| High | Critical | Database migrations, security changes |

### 2. Define Clear Timeout Escalation

```yaml
autonomy:
  escalation_policy:
    on_timeout:
      action: escalate
      notify:
        - slack:#ops-alerts
        - pagerduty:high
    on_denial:
      action: log_and_notify
      notify:
        - email:security@company.com
```

### 3. Automate Pre-Checks

Reduce human approval burden with automated checks:

```yaml
- type: automated_checks
  required: all
  checks:
    - tests_passing
    - security_scan_clean
    - no_secrets_exposed
    - rollback_plan_exists
    - cost_within_budget
```

### 4. Audit Everything

```yaml
access:
  audit_level: comprehensive

observability:
  logging:
    level: info
    include_approval_chain: true
  metrics:
    enabled: true
```

---

## Related Documentation

- [Access Tiers Overview](./index.md)
- [Tier Reference](./tiers.md)
- [Separation of Duties](./separation.md)
- [Autonomy Configuration](../schema-reference/autonomy.md)
