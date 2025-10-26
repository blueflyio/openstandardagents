# OSSA Specification v0.1.9

## Open Standard for Scalable Agents

**The OpenAPI for AI Agents**

### Specification Version

- **Version**: 0.1.9
- **Status**: Stable
- **Release Date**: 2025-10-24
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

- **Not a runtime framework** (that's agent-buildkit)
- **Not an orchestration system** (that's workflow-engine)
- **Not infrastructure-specific** (works anywhere)

---

## Specification

### Document Structure

All OSSA agent manifests MUST be valid YAML or JSON documents with the following top-level structure:

```yaml
apiVersion: ossa/v0.1.9
kind: Agent
metadata:
  # Agent metadata
spec:
  # Agent specification
extensions:
  # Optional framework-specific extensions
```

### Required Fields

- `apiVersion` (string) - MUST match pattern `^ossa/v\d+(\.\d+)?(\.\d+)?(-[a-zA-Z0-9]+)?$`
- `kind` (string) - MUST be `"Agent"`
- `metadata` (object) - MUST contain at least `name` field
- `spec` (object) - MUST contain at least `role` field

### Optional Fields

- `extensions` (object) - Framework-specific extensions (e.g., `kagent`, `langchain`, `crewai`)

---

## Agent Manifest Format

### Metadata Section

```yaml
metadata:
  name: my-agent # REQUIRED: DNS-1123 subdomain format
  version: 1.0.0 # OPTIONAL: Semantic version
  description: '...' # OPTIONAL: Human-readable description
  labels: # OPTIONAL: Key-value labels
    app: my-app
    team: platform
  annotations: # OPTIONAL: Tool metadata
    author: 'Team Name'
```

**Metadata Fields:**

| Field         | Type   | Required | Description                                             |
| ------------- | ------ | -------- | ------------------------------------------------------- |
| `name`        | string | ✅       | Agent identifier (DNS-1123 format, max 253 chars)       |
| `version`     | string | ❌       | Semantic version (semver 2.0.0)                         |
| `description` | string | ❌       | Human-readable description (max 2000 chars)             |
| `labels`      | object | ❌       | Key-value labels for organization (values max 63 chars) |
| `annotations` | object | ❌       | Arbitrary metadata for tooling                          |

### Specification Section

```yaml
spec:
  taxonomy: # OPTIONAL: Domain classification
    domain: infrastructure
    subdomain: kubernetes
    capability: troubleshooting

  role: | # REQUIRED: Agent system prompt
    You are a Kubernetes troubleshooter...

  llm: # OPTIONAL: LLM configuration
    provider: openai
    model: gpt-4
    temperature: 0.2
    maxTokens: 4000

  tools: # OPTIONAL: Available tools
    - type: mcp
      server: kubernetes-mcp
      capabilities: [get_pods, get_logs]

  autonomy: # OPTIONAL: Autonomy settings
    level: supervised
    approval_required: true
    allowed_actions: [read_pods]
    blocked_actions: [delete_pods]

  constraints: # OPTIONAL: Resource constraints
    cost:
      maxTokensPerDay: 50000
      maxCostPerDay: 10.0
      currency: USD
    performance:
      maxLatencySeconds: 30
      maxConcurrentRequests: 5

  observability: # OPTIONAL: Observability config
    tracing:
      enabled: true
      exporter: otlp
      endpoint: http://agent-tracer:4318
    metrics:
      enabled: true
      exporter: prometheus
    logging:
      level: info
      format: json
```

### Taxonomy

Hierarchical classification system for agent discovery and organization:

```yaml
taxonomy:
  domain: infrastructure # Top-level category
  subdomain: kubernetes # Secondary category
  capability: troubleshooting # Specific function
```

**Common Domains:**

- `infrastructure` - Infrastructure management (kubernetes, cloud, networking)
- `security` - Security operations (vulnerability, compliance, audit)
- `compliance` - Regulatory compliance (SOC2, HIPAA, FedRAMP)
- `documentation` - Documentation generation and maintenance
- `development` - Software development (code review, testing)
- `operations` - Operations tasks (monitoring, deployment)

### LLM Configuration

```yaml
llm:
  provider: openai # openai | anthropic | google | azure | ollama | custom
  model: gpt-4 # Model identifier
  temperature: 0.2 # 0-2, sampling temperature
  maxTokens: 4000 # Max tokens per request
  topP: 1.0 # 0-1, nucleus sampling
  frequencyPenalty: 0.0 # -2 to 2
  presencePenalty: 0.0 # -2 to 2
```

### Tools

Tools define external capabilities available to the agent:

```yaml
tools:
  - type: mcp # Tool type: mcp | kubernetes | http | grpc | function | custom
    name: kubernetes-tools # Tool identifier
    server: kubernetes-mcp # MCP server name (for type=mcp)
    namespace: default # Kubernetes namespace
    capabilities: # Specific operations
      - get_pods
      - get_logs
      - get_events
    config: # Tool-specific config
      timeout: 30
    auth: # Authentication
      type: bearer
      credentials: secret-ref
```

**Tool Types:**

- `mcp` - Model Context Protocol server
- `kubernetes` - Kubernetes API operations
- `http` - HTTP API calls
- `grpc` - gRPC service calls
- `function` - Direct function calls
- `custom` - Custom integration

### Autonomy

Controls agent decision-making authority:

```yaml
autonomy:
  level: supervised # supervised | autonomous | fully_autonomous
  approval_required: true # Human approval required?
  allowed_actions: # Whitelist
    - read_pods
    - read_logs
  blocked_actions: # Blacklist
    - delete_pods
    - modify_configs
  escalation_policy: # Custom escalation rules
    conditions: [...]
```

**Autonomy Levels:**

- `supervised` - All actions require approval
- `autonomous` - Most actions automatic, critical actions require approval
- `fully_autonomous` - All actions automatic (use with caution!)

### Constraints

Resource and cost limits:

```yaml
constraints:
  cost: # Cost limits
    maxTokensPerDay: 50000
    maxTokensPerRequest: 4000
    maxCostPerDay: 10.0
    currency: USD # ISO 4217 currency code

  performance: # Performance limits
    maxLatencySeconds: 30
    maxConcurrentRequests: 5
    timeoutSeconds: 60

  resources: # Resource limits (Kubernetes format)
    cpu: '500m'
    memory: '512Mi'
    gpu: '1'
```

### Observability

Tracing, metrics, and logging configuration:

```yaml
observability:
  tracing:
    enabled: true
    exporter: otlp # otlp | jaeger | zipkin | custom
    endpoint: http://agent-tracer:4318

  metrics:
    enabled: true
    exporter: prometheus # prometheus | otlp | custom
    endpoint: http://prometheus:9090

  logging:
    level: info # debug | info | warn | error
    format: json # json | text
```

---

## Extensions

Extensions allow framework-specific configuration while maintaining OSSA compatibility.

### Extension Format

```yaml
extensions:
  kagent:# Extension name (framework identifier)
    # Framework-specific fields
```

### Standard Extensions

#### kAgent Extension (v1alpha1)

For Kubernetes-native deployment via kAgent:

```yaml
extensions:
  kagent:
    kubernetes:
      namespace: production
      labels:
        app: my-agent
        environment: prod
      annotations:
        description: 'Production agent'
      resourceLimits:
        cpu: '500m'
        memory: '512Mi'

    guardrails:
      requireApproval: true
      costLimits:
        maxTokensPerDay: 50000
      auditLog:
        destination: compliance-engine
        retention: 7years

    a2aConfig:
      enabled: true
      protocol: json-rpc
      endpoints:
        - http://other-agent:8080/a2a
      authentication:
        type: mtls

    meshIntegration:
      enabled: true
      istioIntegration: true
      ambientMesh: true
```

**Specification**: See `/OSSA/schemas/extensions/kagent-v1.yml`

#### LangChain Extension

```yaml
extensions:
  langchain:
    chain_type: sequential
    memory:
      type: conversation_buffer
      max_tokens: 2000
```

#### CrewAI Extension

```yaml
extensions:
  crewai:
    crew_name: my-crew
    process: sequential
    verbose: true
```

### Creating Custom Extensions

1. **Choose unique extension name** (framework identifier)
2. **Document extension schema** in `/OSSA/schemas/extensions/{name}-v{version}.yml`
3. **Submit PR** to OSSA repository for standardization
4. **Maintain backward compatibility** across versions

---

## Validation

All OSSA manifests MUST validate against the JSON Schema at:

```
https://ossa.io/schemas/v0.1.9/agent.json
```

### Validation Tools

#### CLI Validation

```bash
# Using OSSA CLI
ossa validate agent.ossa.yaml

# Using agent-buildkit
buildkit ossa validate agent.ossa.yaml
```

#### Programmatic Validation (TypeScript)

```typescript
import { validate } from '@ossa/validator';

const result = await validate(manifest);
if (!result.valid) {
  console.error(result.errors);
}
```

#### Programmatic Validation (Python)

```python
from ossa import validate_manifest

result = validate_manifest(manifest)
if not result.valid:
    print(result.errors)
```

### Validation Rules

1. **MUST** have `apiVersion`, `kind`, `metadata`, `spec`
2. **MUST** use DNS-1123 subdomain format for `metadata.name`
3. **MUST** use semver format for `metadata.version` (if provided)
4. **MUST** provide `spec.role`
5. **MAY** include any standard or custom fields
6. **MUST NOT** include unrecognized top-level fields (use `extensions`)

---

## Examples

### Minimal Agent

```yaml
apiVersion: ossa/v1
kind: Agent
metadata:
  name: simple-agent
spec:
  role: 'You are a helpful assistant'
```

### Complete Agent

```yaml
apiVersion: ossa/v0.1.9
kind: Agent
metadata:
  name: k8s-troubleshooter
  version: 1.0.0
  description: 'Kubernetes cluster troubleshooting agent'
  labels:
    app: troubleshooter
    team: platform
  annotations:
    author: 'Platform Team'
    contact: 'platform@company.com'

spec:
  taxonomy:
    domain: infrastructure
    subdomain: kubernetes
    capability: troubleshooting

  role: |
    You are an expert Kubernetes troubleshooter. You diagnose pod failures,
    network issues, resource constraints, and configuration problems.

  llm:
    provider: openai
    model: gpt-4
    temperature: 0.2
    maxTokens: 4000

  tools:
    - type: mcp
      server: kubernetes-mcp
      namespace: default
      capabilities:
        - get_pods
        - get_logs
        - get_events

  autonomy:
    level: supervised
    approval_required: true
    allowed_actions:
      - read_pods
      - read_logs
    blocked_actions:
      - delete_pods

  constraints:
    cost:
      maxTokensPerDay: 50000
      maxCostPerDay: 10.0
      currency: USD
    performance:
      maxLatencySeconds: 30

  observability:
    tracing:
      enabled: true
      exporter: otlp
      endpoint: http://agent-tracer:4318

extensions:
  kagent:
    kubernetes:
      namespace: production
      labels:
        environment: prod
    guardrails:
      requireApproval: true
```

### Agent with Multiple Tools

```yaml
apiVersion: ossa/v0.1.9
kind: Agent
metadata:
  name: security-scanner
spec:
  role: 'You are a security scanner agent'

  tools:
    - type: mcp
      server: kubernetes-mcp
      capabilities: [scan_images]

    - type: http
      name: trivy-scanner
      endpoint: http://trivy:8080
      auth:
        type: bearer
        credentials: trivy-token

    - type: grpc
      name: vault-client
      endpoint: vault:8200
      auth:
        type: mtls
```

---

## Version History

### v0.1.9 (Current)

- Added `extensions` field for framework-specific configuration
- Added `taxonomy` for domain classification
- Added `observability` configuration
- Improved `tools` schema with auth support
- Added `constraints.resources` for K8s compatibility
- **Breaking**: Renamed `llm.max_tokens` to `llm.maxTokens` (camelCase)

### v0.1.8

- Added `autonomy` section
- Added `constraints` section
- Improved validation rules

### v0.1.0

- Initial specification
- Basic agent definition

---

## Contributing

OSSA is an open standard. Contributions welcome at:

```
https://gitlab.bluefly.io/llm/ossa
```

### Governance

- **Specification Changes**: RFC process required
- **Extension Registry**: Open submissions
- **Validation**: Schema must validate all examples

---

## License

Apache License 2.0

Copyright 2025 LLM Platform

---

## References

- **JSON Schema**: `https://ossa.io/schemas/v0.1.9/agent.json`
- **Examples**: `/OSSA/examples/`
- **Extensions**: `/OSSA/schemas/extensions/`
- **OpenAPI Specification**: https://spec.openapis.org/oas/v3.1.0
- **Kubernetes API Conventions**: https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md
