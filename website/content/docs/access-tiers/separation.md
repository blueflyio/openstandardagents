---
title: "Separation of Duties"
description: "OSSA v0.3.2 separation of duties rules for preventing conflicts of interest in AI agent systems"
weight: 3
---

# Separation of Duties

OSSA v0.3.2 enforces separation of duties to prevent conflicts of interest and ensure proper governance in multi-agent systems. This specification defines which roles can coexist and which must be separated.

## Overview

Separation of duties ensures that:

- **Critics cannot execute** - Agents that review cannot also approve or execute
- **Governors cannot execute** - Policy-defining agents cannot enforce policies
- **Readers and writers are separate** in sensitive domains
- **Production changes require elevation** and explicit approval

## Separation Rules

### Critic-Executor Separation

**Name**: Critic-Executor Separation  
**Enforcement**: Strict  
**Rationale**: Prevents conflict of interest in quality gates

Agents that review or critique cannot also approve or execute:

| Conflicting Role Pair | Reason |
|-----------------------|--------|
| `reviewer` + `approver` | Reviewers cannot approve their own reviews |
| `critic` + `executor` | Critics cannot execute what they criticize |
| `auditor` + `remediator` | Auditors cannot remediate findings |

#### Implementation

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: code-critic
  labels:
    access_tier: tier_1_read

spec:
  type: critic

  role: |
    You are a code review critic that analyzes merge requests and provides
    detailed feedback on code quality, architecture, and best practices.

    CRITICAL SEPARATION RULE:
    - You CANNOT approve merge requests
    - You CANNOT merge changes
    - You CANNOT execute code modifications
    - You can ONLY provide feedback and recommendations

    Your role is to critique, not to approve. Approvals must come from
    human reviewers or designated approver agents (which you cannot be).

  access:
    tier: tier_1_read
    permissions:
      - read_code
      - read_configs
      - read_mrs
      - read_issues
      - execute_queries
    prohibited:
      - write_*
      - merge_mrs
      - approve

  separation:
    role: critic
    conflicts_with:
      - approver
      - executor
      - merger
    prohibited_actions:
      - approve
      - merge
      - execute

  autonomy:
    level: semi_autonomous
    allowed_actions:
      - read_code
      - analyze_mr
      - post_comment
      - request_changes
    blocked_actions:
      - approve_mr
      - merge_mr
      - execute_code
```

---

### Governor-Executor Separation

**Name**: Governor-Executor Separation  
**Enforcement**: Strict  
**Rationale**: Separation of legislative and executive functions

Policy-defining agents cannot execute policies:

| Conflicting Role Pair | Reason |
|-----------------------|--------|
| `policy_definer` + `enforcer` | Define policies, cannot enforce |
| `governor` + `operator` | Govern policies, cannot operate |
| `rule_maker` + `rule_executor` | Make rules, cannot execute |

#### Implementation

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: compliance-governor
  labels:
    access_tier: tier_4_policy

spec:
  type: governor

  role: |
    You are a compliance governance agent responsible for defining and
    publishing security and compliance policies.

    CRITICAL ISOLATION RULES:
    - You CANNOT execute remediation actions directly
    - You CANNOT modify code or infrastructure
    - You MUST delegate execution to tier_3_write_elevated operators
    - You define WHAT should happen, not HOW to do it

    Your role is legislative, not executive. You define the rules;
    operators enforce them.

  access:
    tier: tier_4_policy
    permissions:
      - read_*
      - define_policies
      - publish_policies
      - audit_compliance
      - report_violations
    prohibited:
      - execute_*
      - write_code
      - modify_infrastructure
      - remediate_direct
    isolation: strict

  separation:
    role: governor
    conflicts_with:
      - operator
      - executor
      - deployer
      - remediator
      - enforcer
    can_delegate_to:
      - operator
    prohibited_actions:
      - execute
      - deploy
      - merge
      - modify_production

  delegation:
    enabled: true
    allowed_tiers:
      - tier_3_write_elevated
    allowed_operations:
      - remediate_violations
      - apply_policies
      - execute_fixes
    requires:
      - delegation_token
      - audit_trail
      - violation_report
```

---

### Read-Write Separation (Sensitive Domains)

**Name**: Read-Write Separation (Sensitive)  
**Enforcement**: Recommended  
**Rationale**: In security/compliance domains, readers should not write

This rule applies to specific sensitive domains:

| Domain | Conflicting Roles |
|--------|-------------------|
| `security` | `reader` + `writer` |
| `compliance` | `scanner` + `remediator` |
| `secrets` | Any read/write combination |

#### Exceptions

```yaml
exceptions:
  - domain: development
    reason: "Dev workflows need read-write for productivity"
```

#### Implementation

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: security-scanner
  labels:
    access_tier: tier_1_read
    domain: security

spec:
  type: analyzer

  role: |
    You are a security vulnerability scanner that analyzes code for potential
    security issues. You can read code, scan dependencies, and report findings.

    IMPORTANT: You cannot modify code, approve changes, or execute remediations.
    You must report findings to a tier_3 remediator agent for action.

  access:
    tier: tier_1_read
    permissions:
      - read_code
      - read_configs
      - read_logs
      - execute_queries
    prohibited:
      - write_*
      - delete_*
      - execute_commands

  separation:
    role: scanner
    conflicts_with:
      - remediator
      - executor
      - approver
    prohibited_actions:
      - execute
      - merge
      - approve

  messaging:
    publishes:
      - channel: security.vulnerabilities
        description: Vulnerability findings for remediation
        schema:
          type: object
          properties:
            severity:
              type: string
              enum: [critical, high, medium, low]
            remediation_required:
              type: boolean
```

---

### Production Isolation

**Name**: Production Isolation  
**Enforcement**: Strict  
**Rationale**: Production changes require elevated privileges and audit

Agents modifying production must have explicit elevation:

| Environment | Required Tier |
|-------------|---------------|
| `production` | `tier_3_write_elevated` |
| `staging` | `tier_3_write_elevated` (optional) |

#### Implementation

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: deployment-operator
  labels:
    access_tier: tier_3_write_elevated
    domain: infrastructure

spec:
  type: operator

  role: |
    You are a deployment operator that manages CI/CD pipelines, deployments,
    and infrastructure changes. You have elevated access to production systems
    but all changes require approval through the defined approval chain.

    CRITICAL: Never bypass approval processes. Never delete production data.
    Always ensure rollback plans exist before deployment.

  access:
    tier: tier_3_write_elevated
    permissions:
      - execute_deployments
      - modify_pipelines
      - merge_mrs
      - modify_configs
    prohibited:
      - delete_production
      - modify_secrets_direct
      - bypass_approvals
      - force_push
    requires_approval: true
    approval_chain: elevated

  separation:
    role: deployer
    conflicts_with:
      - governor
      - policy_definer
      - critic

  safety:
    guardrails:
      enabled: true
      policies:
        - require_rollback_plan
        - no_production_deletes
        - approval_chain_required
    human_in_loop:
      enabled: true
      triggers:
        - production_deployment
        - infrastructure_change
        - security_modification
```

---

## Delegation Rules

Higher-tier agents can delegate to lower-tier agents with restrictions:

### Allowed Delegations

| From Tier | To Tier | Operations | Requirements |
|-----------|---------|------------|--------------|
| `tier_4_policy` | `tier_3_write_elevated` | Remediate violations, apply policies | Delegation token, audit trail, violation report |
| `tier_3_write_elevated` | `tier_1_read` | Gather information, run analysis, generate reports | Task specification |
| `tier_2_write_limited` | `tier_1_read` | Analyze code, scan dependencies | Task specification |

### Prohibited Delegations

| From | To | Reason |
|------|-----|--------|
| `tier_1_read`, `tier_2_write_limited` | `tier_3_write_elevated`, `tier_4_policy` | Privilege escalation not permitted |
| `tier_4_policy` | Any tier | `define_policies` operation | Policy definition cannot be delegated |

### Delegation Configuration

```yaml
delegation:
  rules:
    # Tier 4 can delegate enforcement to Tier 3
    - from_tier: tier_4_policy
      to_tier: tier_3_write_elevated
      operations:
        - remediate_violations
        - apply_policies
      requires:
        - delegation_token
        - audit_trail
        - violation_report

    # Tier 3 can delegate read operations to Tier 1
    - from_tier: tier_3_write_elevated
      to_tier: tier_1_read
      operations:
        - gather_information
        - run_analysis
        - generate_reports
      requires:
        - task_specification

  prohibited_delegations:
    # Lower tiers cannot elevate themselves
    - from: [tier_1_read, tier_2_write_limited]
      to: [tier_3_write_elevated, tier_4_policy]
      reason: "Privilege escalation not permitted"
```

---

## Validation

The OSSA CLI validates separation of duties:

```bash
# Validate separation rules
ossa validate agent.ossa.yaml

# Check for role conflicts
ossa validate agent.ossa.yaml --check separation
```

### Validation Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `role-separation` | Error | Conflicting roles must not coexist |
| `delegation-valid` | Error | Delegations must follow rules |
| `production-isolation` | Error | Production access requires tier 3+ |

---

## Best Practices

### 1. Design for Separation

When designing multi-agent systems, start with separation:

```yaml
# Critic agent - READ ONLY
spec:
  type: critic
  separation:
    role: critic
    conflicts_with: [approver, executor]

# Approver agent - SEPARATE from critic
spec:
  type: supervisor
  separation:
    role: approver
    conflicts_with: [critic]
```

### 2. Use Delegation, Not Escalation

Instead of escalating privileges:

```yaml
# Wrong: Trying to escalate
spec:
  access:
    tier: tier_1_read
    permissions:
      - merge_mrs  # ERROR: Not allowed for tier_1

# Correct: Delegate to appropriate tier
spec:
  access:
    tier: tier_1_read
  messaging:
    publishes:
      - channel: remediation.requests
        description: Request remediation from tier_3 operator
```

### 3. Document Conflicts Explicitly

Always document role conflicts:

```yaml
separation:
  role: scanner
  conflicts_with:
    - remediator    # Cannot fix what we find
    - executor      # Cannot execute actions
    - approver      # Cannot approve changes
  prohibited_actions:
    - execute
    - merge
    - approve
```

### 4. Audit All Separations

Enable comprehensive auditing for separated roles:

```yaml
access:
  tier: tier_4_policy
  audit_level: comprehensive  # Full audit for governors

observability:
  logging:
    level: info
    format: json
  metrics:
    enabled: true
    customMetrics:
      - name: delegations_issued
        type: counter
        description: Remediation delegations to operators
```

---

## Related Documentation

- [Access Tiers Overview](./index.md)
- [Tier Reference](./tiers.md)
- [Approval Chains](./approval-chains.md)
