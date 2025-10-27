# OSSA Specification v0.2.2

## Open Standard for Scalable Agents

**The OpenAPI for AI Agents**

### Specification Version

- **Version**: 0.2.2
- **Status**: Beta
- **Release Date**: 2025-10-27
- **License**: Apache 2.0

---

## Table of Contents

1. [Introduction](#introduction)
2. [Specification](#specification)
3. [Agent Manifest Format](#agent-manifest-format)
4. [Extensions](#extensions)
5. [Validation](#validation)
6. [Examples](#examples)

---

## Introduction

### Purpose

OSSA (Open Standard for Scalable Agents) is a **specification standard** for defining AI agents in a framework-agnostic way. Just as OpenAPI provides a standard specification for REST APIs, OSSA provides a standard specification for AI agents.

### Design Principles

1. **Declarative** - Agents defined in YAML/JSON, not code
2. **Framework-Agnostic** - Works with any agent framework (kAgent, LangChain, CrewAI, etc.)
3. **Extensible** - Supports framework-specific extensions via `extensions` field
4. **Portable** - Agents can be packaged and distributed as OCI artifacts
5. **Versioned** - Semantic versioning for backward compatibility
6. **Validated** - JSON Schema validation for correctness

### What OSSA Is NOT

- **Not a runtime framework** (use agent-buildkit for that)
- **Not an orchestration system** (use workflow-engine for that)
- **Not infrastructure-specific** (works anywhere)

---

## Specification

### Agent Manifest Structure

```yaml
ossaVersion: "1.0"
kind: Agent
metadata:
  name: string
  version: string
  description: string
  labels: object
  annotations: object

spec:
  taxonomy:
    domain: string
    subdomain: string
    capability: string

  role: string

  llm:
    provider: string
    model: string
    temperature: number
    maxTokens: number

  tools:
    - type: string
      server: string
      capabilities: array

  autonomy:
    level: supervised|autonomous|semi-autonomous
    approval_required: boolean

  constraints:
    cost:
      maxTokensPerDay: number
      maxCostPerDay: number
    time:
      maxExecutionTime: number

  observability:
    tracing: boolean
    metrics: boolean
    logging: boolean

extensions:
  [platform-specific-extensions]
```

---

## Agent Manifest Format

### Required Fields

- `ossaVersion`: OSSA spec version (e.g., "1.0")
- `kind`: Must be "Agent"
- `metadata.name`: Unique agent identifier
- `metadata.version`: Semantic version
- `spec.role`: Agent's role/purpose description

### Optional Fields

All other fields are optional but recommended for production agents.

---

## Extensions

OSSA supports platform-specific extensions via the `extensions` field.

### Available Extensions

- **kAgent** (Kubernetes-native agents)
- **Drupal** (Drupal platform integration)

See `/spec/extensions/` for full extension schemas.

---

## Validation

All OSSA manifests must validate against the JSON Schema:

```bash
npm install -g @bluefly/open-standards-scalable-agents
ossa validate agent.ossa.yaml
```

Or programmatically:

```typescript
import { validate } from '@bluefly/open-standards-scalable-agents/validation';

const result = await validate(manifest);
if (!result.valid) {
  console.error(result.errors);
}
```

---

## Examples

See `/spec/examples/` for reference implementations:

- `audit-agent.yml` - Security auditing
- `chat-agent.yml` - Conversational AI
- `compliance-agent.yml` - Compliance checking
- `monitoring-agent.yml` - System monitoring
- `workflow-agent.yml` - Workflow automation
- And more...

---

## Migration from v0.1.9

See `/spec/versions/v0.1.9/` for legacy specification.

Major changes in v1.0:
- Simplified schema structure
- Enhanced extension support
- Improved validation
- Better observability hooks
- Reasoning compliance built-in

---

## License

Apache License 2.0

Copyright 2025 LLM Platform

---

For the complete JSON Schema, see `ossa-1.0.schema.json` in this directory.
