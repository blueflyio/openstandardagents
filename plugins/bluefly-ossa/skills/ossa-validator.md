---
name: ossa-validate
description: "**OSSA Validator Agent**: Validates OSSA agent manifests against v0.3.2 specification. Ensures compliance with schema, access controls, taxonomy classification, separation of duties, and security governance. Includes template validation, migration assistance, and compliance auditing. - MANDATORY TRIGGERS: OSSA, manifest, validate agent, schema, compliance, agent manifest, ossa schema, validate manifest, check agent, ossa compliance, agent validation, separation of duties, access tier"
license: "Apache-2.0"
compatibility: "Requires npm, ossa CLI. Environment: npm i @bluefly/openstandardagents"
allowed-tools: "Bash(npm:*) Read Edit Task mcp__filesystem__*"
metadata:
  ossa_manifest: ~/Sites/LLM/platform-agents/packages/@ossa/ossa-validator/agent.ossa.yaml
  service_account: ossa-validator
  service_account_id: pending
  domain: validation
  tier: worker
  autonomy: fully_autonomous
  ossa_version: v0.3.2
  npm_package: "@bluefly/openstandardagents"
---

# OSSA Validator Agent Skill

**OSSA Agent**: `ossa-validator` | **Version**: 1.0.0 | **Namespace**: blueflyio

This skill invokes the **ossa-validator** OSSA agent for comprehensive manifest validation against the OSSA v0.3.2 specification.

## Quick Start

```bash
# Install OSSA SDK and CLI
npm i @bluefly/openstandardagents

# Validate a manifest
ossa validate agent.ossa.yaml
```

## Agent Capabilities (from OSSA Manifest)

### Core Validation
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `ossa-schema-validation` | reasoning | fully_autonomous | Validate against OSSA v0.3.2 JSON Schema |
| `validate-ossa-manifest` | reasoning | fully_autonomous | Validate complete manifest |
| `check-schema-compliance` | reasoning | fully_autonomous | Check schema compliance |

### Access & Security
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `verify-access-controls` | reasoning | fully_autonomous | Verify access tier and permissions |
| `security-governance` | reasoning | fully_autonomous | Validate security governance rules |

### Structure Validation
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `validate-taxonomy` | reasoning | fully_autonomous | Validate taxonomy classification |
| `check-separation-of-concerns` | reasoning | fully_autonomous | Verify separation of duties |
| `template-compliance` | reasoning | fully_autonomous | Validate against templates |

### Reporting
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `generate-validation-report` | action | fully_autonomous | Generate detailed validation report |

## OSSA v0.3.2 Schema Requirements

### Required Fields

```yaml
apiVersion: ossa/v0.3.2  # REQUIRED
kind: Agent              # REQUIRED: Agent | Task | Workflow

metadata:
  name: agent-name       # REQUIRED: lowercase, hyphens
  version: "1.0.0"       # REQUIRED: semver
  namespace: blueflyio   # REQUIRED: org namespace
  description: |         # REQUIRED: multiline description
    Agent description
  labels:                # REQUIRED
    domain: <domain>     # REQUIRED
    tier: worker|orchestrator  # REQUIRED
    autonomy: <level>    # REQUIRED
    use-case: <use-case> # OPTIONAL

spec:
  access:                # REQUIRED for v0.3.2
    tier: tier_1_read|tier_2_write_limited|tier_3_write_elevated
    permissions: []      # REQUIRED: list of permissions
    prohibited: []       # REQUIRED: list of prohibitions

  separation:            # REQUIRED for v0.3.2
    role: <role>         # REQUIRED: analyzer|worker|operator|governor
    conflicts_with: []   # REQUIRED: list of conflicting roles

  taxonomy:              # REQUIRED for v0.3.2
    domain: <domain>     # REQUIRED
    subdomain: <subdomain>  # REQUIRED
    capability: <capability>  # REQUIRED

  llm:                   # REQUIRED
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4-20250514}
    temperature: 0.3
    max_tokens: 8192

  capabilities: []       # REQUIRED: at least one capability
  tools: []              # OPTIONAL

  observability:         # RECOMMENDED
    enabled: true
    tracing: true
    metrics: true
```

### Access Tiers

```yaml
access_tiers:
  tier_1_read:
    description: "Read-only access"
    allowed:
      - read:code
      - read:repository
      - read:documentation
    prohibited:
      - write:*
      - delete:*

  tier_2_write_limited:
    description: "Limited write access"
    allowed:
      - read:*
      - write:repository
      - write:merge_requests
    prohibited:
      - delete:production
      - write:protected_branches

  tier_3_write_elevated:
    description: "Elevated write access"
    allowed:
      - read:*
      - write:*
      - admin:limited
    prohibited:
      - delete:production
      - admin:full
```

### Separation of Duties

```yaml
roles:
  analyzer:
    description: "Read-only analysis"
    conflicts_with: []

  worker:
    description: "Task execution"
    conflicts_with: []

  operator:
    description: "Infrastructure operations"
    conflicts_with: []

  governor:
    description: "Policy enforcement"
    conflicts_with:
      - worker  # Cannot execute what you govern

  reviewer:
    description: "Code review"
    conflicts_with:
      - code_author  # Cannot review own code
```

### Taxonomy

```yaml
domains:
  - gitlab: CI/CD, MRs, issues
  - code: Code analysis, review
  - drupal: Drupal development
  - infrastructure: K8s, cloud
  - security: Vulnerability scanning
  - docs: Documentation
  - validation: Schema validation
  - llm: LLM optimization
  - mcp: Model Context Protocol
  - workflow: Issue workflows
```

## Validation Report Template

```markdown
## OSSA Manifest Validation Report

### Manifest: agent.ossa.yaml
- **Agent**: agent-name
- **Version**: 1.0.0
- **OSSA Version**: v0.3.2

### Schema Validation: [PASS|FAIL]
- [x] apiVersion correct
- [x] kind valid
- [x] metadata complete
- [x] spec.access present
- [x] spec.separation present
- [x] spec.taxonomy present

### Access Control Validation: [PASS|FAIL]
- [x] Access tier valid
- [x] Permissions appropriate for tier
- [x] Prohibited actions defined
- [x] No privilege escalation

### Separation of Duties: [PASS|FAIL]
- [x] Role defined
- [x] Conflicts declared
- [x] No circular dependencies

### Taxonomy Validation: [PASS|FAIL]
- [x] Domain valid
- [x] Subdomain appropriate
- [x] Capability matches domain

### Security Governance: [PASS|FAIL]
- [x] No write:credentials
- [x] No delete:production
- [x] LLM credentials via env vars

### Overall: [VALID|INVALID]

### Recommendations
1. [Any improvements]
```

## Migration from v0.2.8 to v0.3.2

```bash
# Migrate manifest
ossa migrate agent.ossa.yaml --output agent.ossa.v0.3.2.yaml

# Changes needed:
# 1. Add spec.access (tier, permissions, prohibited)
# 2. Add spec.separation (role, conflicts_with)
# 3. Add spec.taxonomy (domain, subdomain, capability)
# 4. Update autonomy to spec.autonomy
# 5. Add observability section
```

## Access Control (OSSA Spec)

```yaml
access:
  tier: tier_1_read
  permissions:
    - read:code
    - read:repository
    - read:manifest
  prohibited:
    - write:credentials
    - write:secrets
```

## Observability Metrics

```yaml
custom_metrics:
  - name: manifests_validated
    type: counter
    description: "Number of manifests validated"
  - name: validation_errors
    type: counter
    description: "Number of validation errors found"
```

## Integration with Claude Code

This skill is triggered by phrases like:
- "Validate my OSSA manifest"
- "Check agent compliance"
- "Is this manifest valid?"
- "Migrate manifest to v0.3.2"
- "Check separation of duties"

## Examples

### Validate Manifest
```
User: Validate packages/@ossa/mr-reviewer/agent.ossa.yaml
Agent: Reading manifest... Validating against OSSA v0.3.2...
       Schema: PASS
       Access Control: PASS
       Separation: PASS
       Taxonomy: PASS
       Overall: VALID
```

### Migration
```
User: Migrate this manifest to v0.3.2
Agent: Analyzing current manifest (v0.2.8)...
       Adding spec.access...
       Adding spec.separation...
       Adding spec.taxonomy...
       Migration complete!
```

### Compliance Check
```
User: Does this agent follow separation of duties?
Agent: Checking role: reviewer
       Conflicts with: code_author
       Validation: PASS - reviewer cannot review own code
```

## Service Account

- **Account**: ossa-validator
- **Group**: blueflyio
- **Permissions**: Read-only (tier_1_read)

## Related Agents

- `security-scanner` - Security validation beyond OSSA
- `code-reviewer` - Review agent implementation
- All other agents - Validated by ossa-validator

## References

- [OSSA v0.3.2 Specification](https://gitlab.com/blueflyio/openstandardagents)
- [OSSA Schema JSON](https://openstandardagents.org/schema/v0.3.2)
- [Agent Platform Docs](https://gitlab.com/blueflyio/agent-platform/technical-docs/-/wikis/)
