---
title: "Access Tier Reference"
description: "Detailed specification of the four OSSA v0.3.2 access tiers: Read, Write Limited, Write Elevated, and Policy"
weight: 2
---

# Access Tier Reference

OSSA v0.3.2 defines four hierarchical access tiers. Each tier specifies permitted and prohibited operations, typical agent roles, and audit requirements.

## Tier Hierarchy

Lower tier numbers indicate more restricted permissions:

```
Tier 1 (Most Restricted) --> Tier 4 (Most Privileged)

tier_1_read          Read-only analyzers
tier_2_write_limited Sandboxed workers
tier_3_write_elevated Production operators (with approval)
tier_4_policy        Policy governors (isolated)
```

## Tier 1: Read Only (Analyzers)

**Level**: 1  
**Name**: Read Only (Analyzers)  
**Description**: Agents that analyze, audit, scan - cannot modify state

### Permissions

| Permission | Description |
|------------|-------------|
| `read_code` | Read source code files |
| `read_configs` | Read configuration files |
| `read_metrics` | Access metrics and telemetry |
| `read_logs` | Read application and system logs |
| `read_issues` | View issues and tickets |
| `read_mrs` | View merge/pull requests |
| `execute_queries` | Execute read-only queries |

### Prohibited Operations

| Operation | Reason |
|-----------|--------|
| `write_*` | Cannot modify any state |
| `delete_*` | Cannot delete any resources |
| `execute_commands` | Cannot run arbitrary commands |
| `modify_infrastructure` | Cannot change infrastructure |

### Typical Roles

- `analyzer` - Code and data analysis
- `auditor` - Compliance and security audits
- `scanner` - Vulnerability scanning
- `reviewer` - Code review (read-only)
- `monitor` - System monitoring

### Example Agents

- Security scanner
- Code analyzer
- Compliance auditor
- Cost reporter
- Health monitor

### Configuration

```yaml
apiVersion: ossa/v0.3.2
kind: Agent

metadata:
  name: security-scanner
  version: 1.0.0
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

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.1

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
      - modify_infrastructure
    audit_level: standard
    requires_approval: false

  separation:
    role: scanner
    conflicts_with:
      - remediator
      - executor
      - approver

  autonomy:
    level: semi_autonomous
    allowed_actions:
      - scan_code
      - generate_report
      - create_issue
    blocked_actions:
      - modify_code
      - execute_fix
      - approve_mr
```

---

## Tier 2: Write Limited (Workers)

**Level**: 2  
**Name**: Write Limited (Workers)  
**Description**: Agents that create/modify in sandboxed areas only

### Permissions

| Permission | Description |
|------------|-------------|
| `read_*` | All read operations |
| `write_docs` | Create/modify documentation |
| `write_tests` | Create/modify test files |
| `write_scaffolds` | Generate scaffolded code |
| `write_configs_draft` | Create draft configurations |
| `create_issues` | Create issues/tickets |
| `create_mrs_draft` | Create draft merge requests |
| `execute_sandboxed` | Run sandboxed operations |

### Prohibited Operations

| Operation | Reason |
|-----------|--------|
| `write_production_code` | Cannot modify production code |
| `merge_mrs` | Cannot merge changes |
| `delete_branches` | Cannot delete branches |
| `modify_infrastructure` | Cannot change infrastructure |
| `modify_secrets` | Cannot access secrets |

### Typical Roles

- `generator` - Code generation
- `scaffolder` - Project scaffolding
- `documenter` - Documentation generation
- `test_writer` - Test creation

### Example Agents

- Documentation generator
- Test generator
- Module scaffolder
- Changelog generator

### Configuration

```yaml
apiVersion: ossa/v0.3.2
kind: Agent

metadata:
  name: doc-generator
  version: 1.0.0
  labels:
    access_tier: tier_2_write_limited
    domain: documentation

spec:
  type: worker

  role: |
    You are a documentation generator that creates and updates documentation
    based on code analysis. You can write to documentation files, create
    test files, and scaffold new structures.

    IMPORTANT: You cannot modify production code or merge changes. All changes
    must go through review by a human or supervisor agent.

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.3

  access:
    tier: tier_2_write_limited
    permissions:
      - read_code
      - read_configs
      - write_docs
      - write_tests
      - create_issues
      - create_mrs_draft
      - execute_sandboxed
    prohibited:
      - write_production_code
      - merge_mrs
      - delete_branches
      - modify_infrastructure
    audit_level: standard
    requires_approval: false

  separation:
    role: documenter
    conflicts_with:
      - executor
      - deployer

  delegation:
    enabled: true
    allowed_tiers:
      - tier_1_read
    allowed_operations:
      - analyze_code
      - scan_dependencies

  autonomy:
    level: assisted
    allowed_actions:
      - read_code
      - write_documentation
      - create_draft_mr
    blocked_actions:
      - modify_production_code
      - merge_changes
      - deploy
```

---

## Tier 3: Write Elevated (Operators)

**Level**: 3  
**Name**: Write Elevated (Operators)  
**Description**: Agents that modify production systems with approval chains

### Permissions

| Permission | Description |
|------------|-------------|
| `read_*` | All read operations |
| `write_*` | All write operations |
| `execute_deployments` | Deploy to environments |
| `modify_pipelines` | Modify CI/CD pipelines |
| `merge_mrs` | Merge requests (with approval) |
| `modify_configs` | Modify configurations |
| `execute_commands` | Execute non-destructive commands |

### Prohibited Operations

| Operation | Reason |
|-----------|--------|
| `delete_production` | Cannot delete production data |
| `modify_secrets_direct` | Cannot directly modify secrets |
| `bypass_approvals` | Cannot skip approval chains |
| `force_push` | Cannot force push to branches |

### Approval Chain

All Tier 3 operations require approval:

```yaml
approval_chain:
  - type: human_or_governor
    timeout_minutes: 30
```

### Typical Roles

- `deployer` - Deployment operations
- `operator` - System operations
- `executor` - Task execution
- `maintainer` - System maintenance

### Example Agents

- Deployment agent
- GitLab CI/CD agent
- Incident responder
- Infrastructure operator

### Configuration

```yaml
apiVersion: ossa/v0.3.2
kind: Agent

metadata:
  name: deployment-operator
  version: 1.0.0
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

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.1
    profile: safe

  access:
    tier: tier_3_write_elevated
    permissions:
      - read_code
      - read_configs
      - read_metrics
      - read_logs
      - execute_deployments
      - modify_pipelines
      - merge_mrs
      - modify_configs
      - execute_commands
    prohibited:
      - delete_production
      - modify_secrets_direct
      - bypass_approvals
      - force_push
    audit_level: detailed
    requires_approval: true
    approval_chain: elevated

  separation:
    role: deployer
    conflicts_with:
      - governor
      - policy_definer
      - critic

  delegation:
    enabled: true
    allowed_tiers:
      - tier_1_read
      - tier_2_write_limited
    allowed_operations:
      - gather_information
      - run_analysis
      - generate_reports
      - write_docs

  autonomy:
    level: supervised
    approval_required:
      - deploy_to_production
      - modify_infrastructure
      - delete_resources
    allowed_actions:
      - deploy_to_staging
      - run_tests
      - view_metrics

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
```

---

## Tier 4: Policy (Governors)

**Level**: 4  
**Name**: Policy (Governors)  
**Description**: Agents that define and enforce policies - ISOLATED from execution

### Permissions

| Permission | Description |
|------------|-------------|
| `read_*` | All read operations |
| `define_policies` | Create and define policies |
| `publish_policies` | Publish policies to the system |
| `audit_compliance` | Audit policy compliance |
| `report_violations` | Report policy violations |

### Prohibited Operations

| Operation | Reason |
|-----------|--------|
| `execute_*` | Cannot execute any operation |
| `write_code` | Cannot write code |
| `modify_infrastructure` | Cannot change infrastructure |
| `remediate_direct` | Must delegate to Tier 3 |

### Isolation

Tier 4 agents have **strict isolation**:

- Cannot execute remediation actions directly
- Cannot modify code or infrastructure
- Must delegate execution to `tier_3_write_elevated` operators
- Define WHAT should happen, not HOW to do it

### Typical Roles

- `governor` - Policy governance
- `policy_definer` - Policy definition
- `compliance_officer` - Compliance management

### Example Agents

- Compliance policy engine
- Security policy manager
- Cost governance agent

### Configuration

```yaml
apiVersion: ossa/v0.3.2
kind: Agent

metadata:
  name: compliance-governor
  version: 1.0.0
  labels:
    access_tier: tier_4_policy
    domain: security

spec:
  type: governor

  role: |
    You are a compliance governance agent responsible for defining and
    publishing security and compliance policies. You monitor policy adherence
    and report violations.

    CRITICAL ISOLATION RULES:
    - You CANNOT execute remediation actions directly
    - You CANNOT modify code or infrastructure
    - You MUST delegate execution to tier_3_write_elevated operators
    - You define WHAT should happen, not HOW to do it

    Your role is legislative, not executive. You define the rules;
    operators enforce them.

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.0
    profile: safe

  access:
    tier: tier_4_policy
    permissions:
      - read_code
      - read_configs
      - read_metrics
      - read_logs
      - read_issues
      - read_mrs
      - define_policies
      - publish_policies
      - audit_compliance
      - report_violations
    prohibited:
      - execute_*
      - write_code
      - modify_infrastructure
      - remediate_direct
      - deploy
      - merge_mrs
    audit_level: comprehensive
    requires_approval: false
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
      - approval

  autonomy:
    level: autonomous
    allowed_actions:
      - define_policy
      - publish_policy
      - audit_compliance
      - generate_violation_report
      - delegate_remediation
    blocked_actions:
      - execute_any_modification
      - deploy
      - merge
      - modify_infrastructure
      - remediate_directly

  compliance:
    frameworks:
      - SOC2
      - ISO27001
      - GDPR
    audit_logging: required
```

---

## Tier Comparison

| Feature | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---------|--------|--------|--------|--------|
| Read operations | Yes | Yes | Yes | Yes |
| Write docs/tests | No | Yes | Yes | No |
| Write production code | No | No | Yes | No |
| Execute commands | No | Sandboxed | Yes | No |
| Merge requests | No | No | Yes (with approval) | No |
| Define policies | No | No | No | Yes |
| Requires approval | No | No | Yes | No |
| Audit level | Standard | Standard | Detailed | Comprehensive |

## Validation

The OSSA CLI validates tier configurations:

```bash
# Validate tier assignment
ossa validate agent.ossa.yaml

# Check for tier-permission mismatches
ossa validate agent.ossa.yaml --strict
```

### Validation Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `valid-tier` | Error | Access tier must be from approved list |
| `tier-permission-match` | Error | Permissions must be allowed by tier |
| `prohibited-operations` | Error | Prohibited operations must not be declared |
| `approval-chain-required` | Warning | Elevated tiers require approval chains |

## Related Documentation

- [Access Tiers Overview](./index.md)
- [Separation of Duties](./separation.md)
- [Approval Chains](./approval-chains.md)
