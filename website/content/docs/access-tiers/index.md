---
title: "Access Tiers"
description: "OSSA v0.3.2 Access Tiers and Separation of Duties specification for agent privilege management"
weight: 1
---

# Access Tiers

OSSA v0.3.2 introduces a comprehensive Access Tiers system that defines hierarchical privilege levels and separation of duties for AI agents. This specification ensures that agents operate within well-defined permission boundaries, supporting enterprise governance and security requirements.

## Overview

The Access Tiers system provides:

- **Hierarchical privilege levels** - Four tiers from read-only to policy governance
- **Separation of duties** - Rules preventing conflicts of interest
- **Approval chains** - Workflows for privileged operations
- **Delegation rules** - How agents can delegate to lower tiers
- **Audit requirements** - Logging and compliance tracking per tier

## Quick Start

Every agent must declare exactly one access tier in its manifest:

```yaml
apiVersion: ossa/v0.3.2
kind: Agent

metadata:
  name: my-agent
  version: 1.0.0
  labels:
    access_tier: tier_1_read

spec:
  access:
    tier: tier_1_read
    permissions:
      - read_code
      - read_configs
    prohibited:
      - write_*
    audit_level: standard
```

## The Four Tiers

| Tier | Name | Description | Approval Required |
|------|------|-------------|-------------------|
| `tier_1_read` | Read Only (Analyzers) | Analyze, audit, scan - cannot modify state | No |
| `tier_2_write_limited` | Write Limited (Workers) | Create/modify in sandboxed areas only | No |
| `tier_3_write_elevated` | Write Elevated (Operators) | Modify production systems with approval | Yes |
| `tier_4_policy` | Policy (Governors) | Define and enforce policies - isolated from execution | No |

See [Tiers Reference](./tiers.md) for detailed documentation on each tier.

## Separation of Duties

OSSA enforces separation of duties to prevent conflicts of interest:

| Rule | Description |
|------|-------------|
| **Critic-Executor Separation** | Reviewers cannot approve; critics cannot execute |
| **Governor-Executor Separation** | Policy-defining agents cannot execute policies |
| **Read-Write Separation** | In security/compliance domains, readers cannot write |
| **Production Isolation** | Production modifications require elevated privileges |

See [Separation Rules](./separation.md) for implementation details.

## Approval Chains

Elevated operations require approval workflows:

| Chain | Description | Steps |
|-------|-------------|-------|
| **Standard** | Single approval | 1 human or governor |
| **Elevated** | Two-step approval | Governor + human |
| **Critical** | Multi-party approval | Automated checks + governor + 2 humans |

See [Approval Chains](./approval-chains.md) for workflow definitions.

## CLI Validation

Validate access tier configuration with the OSSA CLI:

```bash
# Install the CLI
npm install -g @bluefly/openstandardagents

# Validate agent manifest
ossa validate my-agent.ossa.yaml

# Check access tier compliance
ossa validate my-agent.ossa.yaml --check access-tier
```

## Example: Complete Agent with Access Tier

```yaml
apiVersion: ossa/v0.3.2
kind: Agent

metadata:
  name: security-scanner
  version: 1.0.0
  description: Security vulnerability scanner - read-only analysis agent
  labels:
    team: security
    access_tier: tier_1_read
    domain: security

spec:
  type: analyzer

  role: |
    You are a security vulnerability scanner that analyzes code for potential
    security issues. You can read code, scan dependencies, and report findings.

    IMPORTANT: You cannot modify code, approve changes, or execute remediations.

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.1

  # Access Tier Configuration
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
    audit_level: standard
    requires_approval: false

  # Separation of Duties
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
```

## Related Documentation

- [Tiers Reference](./tiers.md) - Detailed tier specifications
- [Separation Rules](./separation.md) - Separation of duties implementation
- [Approval Chains](./approval-chains.md) - Approval workflow definitions
- [Autonomy Configuration](../schema-reference/autonomy.md) - Action control settings
- [Taxonomy Reference](../schema-reference/taxonomy.md) - Agent classification

## Specification Reference

The full Access Tiers specification is available in the OSSA repository:

- [access_tiers.yaml](https://gitlab.com/blueflyio/openstandardagents/-/blob/v0.3.2/spec/v0.3.2/access_tiers.yaml)
- [Issue #363](https://gitlab.com/blueflyio/openstandardagents/-/issues/363)
