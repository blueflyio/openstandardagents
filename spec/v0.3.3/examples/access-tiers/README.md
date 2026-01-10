# OSSA v0.3.3 Access Tiers Examples

This directory contains example agent manifests demonstrating the **Access Tiers** and **Separation of Duties** features introduced in OSSA v0.3.3.

## Access Tier Hierarchy

| Tier | Name | Description | Example Agents |
|------|------|-------------|----------------|
| `tier_1_read` | Read Only (Analyzers) | Cannot modify state | Scanners, Reviewers, Monitors |
| `tier_2_write_limited` | Write Limited (Workers) | Sandboxed writes only | Doc generators, Test writers |
| `tier_3_write_elevated` | Write Elevated (Operators) | Production access with approval | Deployers, Infrastructure operators |
| `tier_4_policy` | Policy (Governors) | Defines policies, CANNOT execute | Compliance governors |

## Examples

### Tier 1: Read Only
- **[security-scanner.ossa.yaml](./security-scanner.ossa.yaml)** - Vulnerability scanner that cannot remediate
- **[code-critic.ossa.yaml](./code-critic.ossa.yaml)** - Code reviewer that cannot approve

### Tier 2: Write Limited
- **[doc-generator.ossa.yaml](./doc-generator.ossa.yaml)** - Documentation generator with sandboxed access

### Tier 3: Write Elevated
- **[deployment-operator.ossa.yaml](./deployment-operator.ossa.yaml)** - Deployment agent with approval chains

### Tier 4: Policy
- **[compliance-governor.ossa.yaml](./compliance-governor.ossa.yaml)** - Policy definer that cannot execute

## Key Separation Rules

### Critic-Executor Separation
Agents that review/critique **cannot** also approve/execute:
- Reviewers cannot approve MRs
- Auditors cannot remediate findings
- Critics cannot merge changes

### Governor-Executor Separation
Policy-defining agents **cannot** execute policies:
- Governors define rules, operators enforce them
- Policy definers cannot modify infrastructure
- Compliance agents cannot remediate directly

### Read-Write Separation (Sensitive Domains)
In security/compliance domains, readers should not write:
- Scanners cannot remediate
- Auditors cannot fix violations
- Monitors cannot modify configurations

## Usage in Agent Manifests

```yaml
apiVersion: ossa/v0.3.3
kind: Agent

metadata:
  name: my-agent
  labels:
    access_tier: tier_1_read  # Label for filtering

spec:
  type: analyzer  # Agent type aligned with tiers

  # Taxonomy classification
  taxonomy:
    domain: security
    subdomain: vulnerability
    capability: scan_code
    concerns:
      - quality
      - governance

  # Access tier configuration
  access:
    tier: tier_1_read
    permissions:
      - read_code
      - read_configs
    prohibited:
      - write_*
    audit_level: standard

  # Role separation
  separation:
    role: scanner
    conflicts_with:
      - remediator
      - executor
    prohibited_actions:
      - execute
      - merge
```

## Validation

Use the OSSA CLI to validate access tier compliance:

```bash
ossa validate manifest.yaml --check-separation
ossa audit --tier-violations
```

## Related Specifications

- [access_tiers.yaml](../../access_tiers.yaml) - Full access tier definitions
- [taxonomy.yaml](../../taxonomy.yaml) - Domain taxonomy with tier mappings
- [ossa-0.3.3.schema.json](../../ossa-0.3.3.schema.json) - JSON Schema with tier validation
