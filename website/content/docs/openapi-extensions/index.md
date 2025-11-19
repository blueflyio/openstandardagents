# OSSA OpenAPI/Swagger Specification Extensions

> **Note**: This content is ready to copy-paste into GitLab Wiki pages.
> Main page: `OpenAPI Extensions`
> URL: `/docs/openapi-extensions` (relative to wiki)

## Overview

OSSA (Open Standard for Scalable Agents) extends OpenAPI 3.1 specifications with AI agent-specific metadata, capabilities, and configuration. These extensions enable OpenAPI specs to describe not just REST APIs, but the full agent behavior including autonomy levels, LLM configuration, tool usage, and compliance requirements.

**Key Benefits:**
- **Agent Discovery**: OpenAPI specs become agent manifests that describe capabilities
- **Type Safety**: Full TypeScript types and JSON Schema validation
- **Tool Integration**: Declare MCP servers and tools directly in API specs
- **Compliance**: Built-in support for governance, security, and observability
- **Framework Agnostic**: Works with any agent runtime (LangChain, CrewAI, kAgent, etc.)

## Table of Contents

1. [Root-Level Extensions](#root-level-extensions)
2. [Operation-Level Extensions](#operation-level-extensions)
3. [Parameter Extensions](#parameter-extensions)
4. [Schema Extensions](#schema-extensions)
5. [Complete Examples](#complete-examples)
6. [Integration with OSSA Manifests](#integration-with-ossa-manifests)

---

## Root-Level Extensions

Extensions that can be added at the root level of an OpenAPI 3.1 specification.

### x-ossa-metadata

Embeds comprehensive OSSA agent metadata in OpenAPI spec root. Provides governance, compliance, security, and observability metadata.

**Location**: Root level of OpenAPI spec

**Example**:

```yaml
openapi: 3.1.0
info:
  title: Kubernetes Troubleshooter Agent API
  version: 1.0.0

x-ossa-metadata:
  version: 0.2.2
  compliance:
    level: enterprise
    frameworks:
      - OSSA
      - OpenAPI 3.1
      - RFC7807
  governance:
    approved: true
    approvedBy: Platform Team
    approvalDate: 2024-01-15
  security:
    classification: internal
    authentication: required
    encryption: tls1.3
  observability:
    tracing: true
    metrics: true
    logging: true
```

**See**: [Full Documentation](https://github.com/blueflyio/openstandardagents/blob/main/docs/openapi-extensions.md#x-ossa-metadata)

### x-ossa

Core OSSA compliance information with agent identification and validation metadata.

**Location**: Root level or `info` section of OpenAPI spec

**Example**:

```yaml
x-ossa:
  version: 0.2.2
  agent:
    id: k8s-troubleshooter
    type: worker
    compliance:
      standards:
        - openapi-first
        - dry
        - crud
        - solid
        - type-safe
      validated: true
      validatedAt: "2024-01-15T10:30:00Z"
```

**See**: [Full Documentation](https://github.com/blueflyio/openstandardagents/blob/main/docs/openapi-extensions.md#x-ossa)

### x-agent

Agent-specific capabilities, tools, environment, and rules configuration.

**Location**: Root level or `info` section of OpenAPI spec

**Example**:

```yaml
x-agent:
  capabilities:
    - data-transformation
    - csv-parsing
    - json-validation
  tools:
    - postgres-mcp
    - redis-mcp
  environment:
    processingTimeout: 300
    maxFileSize: "100MB"
  rules:
    - no-external-api-calls
    - validate-all-inputs
```

**See**: [Full Documentation](https://github.com/blueflyio/openstandardagents/blob/main/docs/openapi-extensions.md#x-agent)

---

## Operation-Level Extensions

Extensions that can be added to individual OpenAPI operations (GET, POST, PUT, DELETE, etc.).

### x-ossa-capability

Links an OpenAPI operation to an OSSA agent capability.

**Location**: Operation object within path item

**Example**:

```yaml
paths:
  /api/v1/process-data:
    post:
      summary: Process incoming data
      operationId: processData
      x-ossa-capability:
        name: data-transformation
        description: Transforms CSV data to JSON format
      requestBody:
        # ... request body ...
      responses:
        # ... responses ...
```

**See**: [Full Documentation](https://github.com/blueflyio/openstandardagents/blob/main/docs/openapi-extensions.md#x-ossa-capability)

### x-ossa-autonomy

Defines autonomy level and approval requirements for operation execution.

**Location**: Operation object within path item

**Autonomy Levels**:
- `supervised` - Requires human approval before execution
- `semi-autonomous` - Can execute with automatic approval under certain conditions
- `autonomous` - Can execute without human intervention

**Example**:

```yaml
paths:
  /api/v1/delete-resource:
    delete:
      summary: Delete a resource
      operationId: deleteResource
      x-ossa-autonomy:
        level: supervised
        approval_required: true
        allowed_actions:
          - read_resource
          - validate_deletion
        blocked_actions:
          - permanent_delete
```

**See**: [Full Documentation](https://github.com/blueflyio/openstandardagents/blob/main/docs/openapi-extensions.md#x-ossa-autonomy)

### x-ossa-constraints

Defines cost, token, performance, and time constraints for operation execution.

**Location**: Operation object within path item

**Example**:

```yaml
paths:
  /api/v1/generate-report:
    post:
      summary: Generate comprehensive report
      operationId: generateReport
      x-ossa-constraints:
        cost:
          maxTokensPerDay: 50000
          maxTokensPerRequest: 4000
          maxCostPerDay: 10.0
          currency: USD
        performance:
          maxLatencySeconds: 30
          maxConcurrentRequests: 5
        time:
          maxExecutionTime: 300
```

**See**: [Full Documentation](https://github.com/blueflyio/openstandardagents/blob/main/docs/openapi-extensions.md#x-ossa-constraints)

### x-ossa-tools

Specifies MCP servers or tools required for operation execution.

**Location**: Operation object within path item

**Example**:

```yaml
paths:
  /api/v1/diagnose-issue:
    post:
      summary: Diagnose Kubernetes issue
      operationId: diagnoseIssue
      x-ossa-tools:
        - type: mcp
          server: kubernetes-mcp
          namespace: default
          capabilities:
            - get_pods
            - get_logs
            - get_events
```

**See**: [Full Documentation](https://github.com/blueflyio/openstandardagents/blob/main/docs/openapi-extensions.md#x-ossa-tools)

### x-ossa-llm

Overrides LLM configuration for a specific operation.

**Location**: Operation object within path item

**Example**:

```yaml
paths:
  /api/v1/analyze-code:
    post:
      summary: Analyze code for issues
      operationId: analyzeCode
      x-ossa-llm:
        provider: openai
        model: gpt-4
        temperature: 0.2
        maxTokens: 4000
```

**See**: [Full Documentation](https://github.com/blueflyio/openstandardagents/blob/main/docs/openapi-extensions.md#x-ossa-llm)

---

## Parameter Extensions

Extensions for OpenAPI parameters (headers, query params, path params, cookies).

### x-ossa-agent-id

Standard header parameter for agent identification in agent-to-agent communication.

**Example**:

```yaml
components:
  parameters:
    X-Ossa-Agent-Id:
      name: X-OSSA-Agent-ID
      in: header
      description: Unique identifier of the agent making the request
      required: false
      schema:
        type: string
        pattern: "^[a-z0-9]([-a-z0-9]*[a-z0-9])?$"
```

**See**: [Full Documentation](https://github.com/blueflyio/openstandardagents/blob/main/docs/openapi-extensions.md#x-ossa-agent-id)

### x-ossa-version

Standard header parameter for OSSA specification version in requests.

**Example**:

```yaml
components:
  parameters:
    X-Ossa-Version:
      name: X-OSSA-Version
      in: header
      description: OSSA specification version the agent supports
      required: false
      schema:
        type: string
        pattern: "^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9]+)?$"
```

**See**: [Full Documentation](https://github.com/blueflyio/openstandardagents/blob/main/docs/openapi-extensions.md#x-ossa-version)

---

## Schema Extensions

Extensions for OpenAPI schema definitions.

### x-ossa-capability-schema

Extends schema definition with capability metadata, linking OpenAPI schemas to OSSA capabilities.

**Location**: Schema definition in `components.schemas`

**Example**:

```yaml
components:
  schemas:
    DataProcessingInput:
      type: object
      required: [csvData]
      properties:
        csvData:
          type: string
      x-ossa-capability-schema:
        capabilityName: data-transformation
        input: true
        validation:
          required: true
          strict: true
```

**See**: [Full Documentation](https://github.com/blueflyio/openstandardagents/blob/main/docs/openapi-extensions.md#x-ossa-capability-schema)

---

## Complete Examples

### Minimal Agent API

See: [`examples/openapi-extensions/minimal-agent-api.openapi.yml`](https://github.com/blueflyio/openstandardagents/blob/main/examples/openapi-extensions/minimal-agent-api.openapi.yml)

### Worker Agent API

See: [`examples/openapi-extensions/worker-agent-api.openapi.yml`](https://github.com/blueflyio/openstandardagents/blob/main/examples/openapi-extensions/worker-agent-api.openapi.yml)

### Orchestrator Agent API

See: [`examples/openapi-extensions/orchestrator-agent-api.openapi.yml`](https://github.com/blueflyio/openstandardagents/blob/main/examples/openapi-extensions/orchestrator-agent-api.openapi.yml)

---

## Integration with OSSA Manifests

OSSA OpenAPI extensions complement OSSA agent manifests (`.ossa.yaml` files). They serve different but related purposes:

- **OSSA Agent Manifest** (`.ossa.yaml`) - Declarative agent definition with full configuration
- **OpenAPI Specification with OSSA Extensions** - API interface definition with agent metadata

See [Full Documentation](https://github.com/blueflyio/openstandardagents/blob/main/docs/openapi-extensions.md#integration-with-ossa-manifests) for details.

---

## Quick Reference

| Extension | Location | Purpose |
|-----------|----------|---------|
| `x-ossa-metadata` | Root | Comprehensive agent metadata |
| `x-ossa` | Root | Core OSSA compliance info |
| `x-agent` | Root | Agent capabilities & config |
| `x-ossa-capability` | Operation | Link operation to capability |
| `x-ossa-autonomy` | Operation | Define autonomy level |
| `x-ossa-constraints` | Operation | Cost & performance limits |
| `x-ossa-tools` | Operation | Required MCP servers/tools |
| `x-ossa-llm` | Operation | Override LLM config |
| `x-ossa-agent-id` | Parameter | Agent identification header |
| `x-ossa-version` | Parameter | OSSA version header |
| `x-ossa-capability-schema` | Schema | Capability schema metadata |

---

## Resources

- **Full Documentation**: [docs/openapi-extensions.md](https://github.com/blueflyio/openstandardagents/blob/main/docs/openapi-extensions.md)
- **JSON Schema**: [docs/schemas/openapi-extensions.schema.json](https://github.com/blueflyio/openstandardagents/blob/main/docs/schemas/openapi-extensions.schema.json)
- **Examples**: [examples/openapi-extensions/](https://github.com/blueflyio/openstandardagents/tree/main/examples/openapi-extensions)
- **OSSA Specification**: [spec/v0.2.2/OSSA-SPECIFICATION-v0.2.2.md](https://github.com/blueflyio/openstandardagents/blob/main/spec/v0.2.2/OSSA-SPECIFICATION-v0.2.2.md)
- **npm Package**: [@bluefly/open-standards-scalable-agents](https://www.npmjs.com/package/@bluefly/open-standards-scalable-agents)

---

*For complete documentation with all examples and details, see the [main documentation file](https://github.com/blueflyio/openstandardagents/blob/main/docs/openapi-extensions.md).*


---

## Governance & Autonomy Guidance

### Autonomy Levels

- **supervised**: Human must approve before execution
- **semi-autonomous**: Human approves plan, agent executes bounded actions
- **autonomous**: No pre-approval; audit + guardrails required

### Recommended Policies

- Always define `x-ossa-autonomy.level` and `approval_required` per operation
- Denylist high-risk actions in `blocked_actions`
- Constrain costs/latency via `x-ossa-constraints`
- Require `x-ossa-agent-id` and `x-ossa-version` headers for traceability

### Example Policy Snippets

```yaml
x-ossa-autonomy:
  level: supervised
  approval_required: true
  allowed_actions: [read_only]
  blocked_actions: [write_resource, exec_shell]
```

```yaml
x-ossa-constraints:
  cost:
    maxTokensPerRequest: 2000
    maxCostPerDay: 5
    currency: USD
  performance:
    maxLatencySeconds: 30
    maxConcurrentRequests: 3
```

### Audit/Observability

Enable in root `x-ossa-metadata.observability` and propagate request IDs across calls.

---

## Advanced Examples

### Idempotent Write Guard

```yaml
paths:
  /api/v1/config/update:
    post:
      x-ossa-capability:
        name: config-update
        description: Safe config updates with dry-run
        input: true
        output: true
      x-ossa-autonomy:
        level: semi-autonomous
        approval_required: true
        blocked_actions: [restart_cluster]
      x-ossa-constraints:
        performance:
          maxLatencySeconds: 60
      parameters:
        - name: X-Request-Id
          in: header
          required: true
          schema:
            type: string
```

### Dual-LLM Strategy Per Operation

```yaml
x-ossa-llm:
  provider: openai
  model: gpt-4o
  temperature: 0.2
```

```yaml
x-ossa-llm:
  provider: anthropic
  model: claude-3-5-sonnet
  temperature: 0.1
```

Use staging flags to A/B test safety/performance.

