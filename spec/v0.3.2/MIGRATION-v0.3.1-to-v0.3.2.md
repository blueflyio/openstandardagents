# Migration Guide: OSSA v0.3.1 → v0.3.2

> **Status**: Draft  
> **Last Updated**: 2025-12-28

---

## Overview

OSSA v0.3.2 introduces **Access Tiers & Separation of Duties** while maintaining backward compatibility with v0.3.1 manifests.

### Key Changes

- ✅ **Backward Compatible**: v0.3.1 manifests validate against v0.3.2 schema
- ✅ **Optional Features**: Access tiers are optional - existing agents work without changes
- ✅ **Progressive Enhancement**: Add access tiers when ready

---

## Migration Path

### Option 1: No Changes Required (Recommended for Existing Agents)

**v0.3.1 agents continue to work without modification:**

```yaml
apiVersion: ossa/v0.3.1
kind: Agent
metadata:
  name: my-agent
spec:
  role: You are a helpful assistant.
  llm:
    provider: anthropic
    model: claude-sonnet
```

**This manifest validates against v0.3.2 schema** - no changes needed.

### Option 2: Update API Version Only

Simply update the `apiVersion` field:

```yaml
apiVersion: ossa/v0.3.2  # Changed from v0.3.1
kind: Agent
metadata:
  name: my-agent
spec:
  role: You are a helpful assistant.
  llm:
    provider: anthropic
    model: claude-sonnet
```

### Option 3: Add Access Tiers (Recommended for New Agents)

Add access tier configuration for privilege separation:

```yaml
apiVersion: ossa/v0.3.2
kind: Agent
metadata:
  name: my-agent
  labels:
    access_tier: tier_1_read  # Optional label
spec:
  type: analyzer  # Agent type
  
  # Access Tier Configuration (NEW in v0.3.2)
  access:
    tier: tier_1_read
    permissions:
      - read_code
      - read_configs
    prohibited:
      - write_*
    audit_level: standard
  
  # Separation of Duties (NEW in v0.3.2)
  separation:
    role: analyzer
    conflicts_with:
      - executor
      - approver
  
  role: You are a helpful assistant.
  llm:
    provider: anthropic
    model: claude-sonnet
```

---

## Access Tier Selection Guide

### Tier 1: Read Only (Analyzers)

**Use for**: Scanners, reviewers, auditors, monitors

```yaml
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
```

**Examples**: Security scanners, code critics, compliance auditors

### Tier 2: Write Limited (Workers)

**Use for**: Doc generators, test writers, scaffolders

```yaml
access:
  tier: tier_2_write_limited
  permissions:
    - read_*
    - write_docs
    - write_tests
    - write_scaffolds
    - create_issues
    - create_mrs_draft
  prohibited:
    - write_production_code
    - merge_mrs
    - modify_infrastructure
```

**Examples**: Documentation generators, test generators, module scaffolders

### Tier 3: Write Elevated (Operators)

**Use for**: Deployers, infrastructure operators, incident responders

```yaml
access:
  tier: tier_3_write_elevated
  permissions:
    - read_*
    - write_*
    - execute_deployments
    - modify_pipelines
    - merge_mrs  # With approval
  prohibited:
    - delete_production
    - modify_secrets_direct
    - bypass_approvals
  requires_approval: true
  approval_chain: standard
```

**Examples**: Deployment agents, CI/CD operators, infrastructure managers

### Tier 4: Policy (Governors)

**Use for**: Policy definers, compliance governors

```yaml
access:
  tier: tier_4_policy
  permissions:
    - read_*
    - define_policies
    - publish_policies
    - audit_compliance
  prohibited:
    - execute_*
    - write_code
    - modify_infrastructure
  isolation: strict
```

**Examples**: Compliance policy engines, security policy managers

---

## Separation of Duties Rules

### Critic-Executor Separation

Agents that review **cannot** also execute:

```yaml
separation:
  role: reviewer
  conflicts_with:
    - executor
    - approver
  prohibited_actions:
    - execute
    - merge
    - approve
```

### Governor-Executor Separation

Policy definers **cannot** execute:

```yaml
separation:
  role: governor
  conflicts_with:
    - operator
    - enforcer
  prohibited_actions:
    - execute
    - remediate_direct
```

---

## Validation

### Validate v0.3.1 Manifest Against v0.3.2 Schema

```bash
# Using OSSA CLI
ossa validate agent.ossa.yaml

# Schema accepts both v0.3.1 and v0.3.2
```

### Validate Access Tier Configuration

```bash
# Check separation of duties
ossa validate agent.ossa.yaml --check-separation

# Audit tier violations
ossa audit --tier-violations
```

---

## Breaking Changes

**None** - v0.3.2 is fully backward compatible with v0.3.1.

### Deprecations

None in v0.3.2.

---

## Examples

See `spec/v0.3.2/examples/access-tiers/` for complete examples:

- `security-scanner.ossa.yaml` - Tier 1 (Read Only)
- `code-critic.ossa.yaml` - Tier 1 (Read Only)
- `doc-generator.ossa.yaml` - Tier 2 (Write Limited)
- `deployment-operator.ossa.yaml` - Tier 3 (Write Elevated)
- `compliance-governor.ossa.yaml` - Tier 4 (Policy)

---

## FAQ

### Do I need to migrate immediately?

**No**. v0.3.1 manifests continue to work. Migrate when you need access tier features.

### Can I mix v0.3.1 and v0.3.2 agents?

**Yes**. Both versions validate against v0.3.2 schema.

### What if I don't specify an access tier?

**Agents work without access tiers**. They're optional for backward compatibility.

### How do I choose the right tier?

See [Access Tier Selection Guide](#access-tier-selection-guide) above.

---

## Related Documentation

- [Access Tiers Specification](access_tiers.yaml)
- [Schema Reference](ossa-0.3.2.schema.json)
- [Examples](../examples/access-tiers/)

---

**Last Updated**: 2025-12-28
