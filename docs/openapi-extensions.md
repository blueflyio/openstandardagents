# OSSA OpenAPI/Swagger Specification Extensions

## Overview

OSSA (Open Standard for Scalable AI Agents) extends OpenAPI 3.1 specifications with AI agent-specific metadata, capabilities, and configuration. These extensions enable OpenAPI specs to describe not just REST APIs, but the full agent behavior including autonomy levels, LLM configuration, tool usage, and compliance requirements.

**Key Benefits:**
- **Agent Discovery**: OpenAPI specs become agent manifests that describe capabilities
- **Type Safety**: Full TypeScript types and JSON Schema validation
- **Tool Integration**: Declare MCP servers and tools directly in API specs
- **Compliance**: Built-in support for governance, security, and observability
- **Framework Agnostic**: Works with any agent runtime (LangChain, CrewAI, kAgent, etc.)

## Table of Contents

1. [Root-Level Extensions](#root-level-extensions)
   - [x-ossa-metadata](#x-ossa-metadata)
   - [x-ossa](#x-ossa)
   - [x-agent](#x-agent)
2. [Operation-Level Extensions](#operation-level-extensions)
   - [x-ossa-capability](#x-ossa-capability)
   - [x-ossa-autonomy](#x-ossa-autonomy)
   - [x-ossa-constraints](#x-ossa-constraints)
   - [x-ossa-tools](#x-ossa-tools)
   - [x-ossa-llm](#x-ossa-llm)
3. [Parameter Extensions](#parameter-extensions)
   - [x-ossa-agent-id](#x-ossa-agent-id)
   - [x-ossa-version](#x-ossa-version)
4. [Schema Extensions](#schema-extensions)
   - [x-ossa-capability-schema](#x-ossa-capability-schema)
5. [Complete Examples](#complete-examples)
6. [Integration with OSSA Manifests](#integration-with-ossa-manifests)

---

## Root-Level Extensions

Extensions that can be added at the root level of an OpenAPI 3.1 specification.

### x-ossa-metadata

Embeds comprehensive OSSA agent metadata in OpenAPI spec root. Provides governance, compliance, security, and observability metadata.

**Location**: Root level of OpenAPI spec

**Schema**:

```yaml
x-ossa-metadata:
  version: string              # OSSA specification version (e.g., "0.2.2", "1.0.0")
  compliance:
    level: string              # "basic" | "standard" | "advanced" | "enterprise"
    frameworks: string[]       # List of compliance frameworks
  governance:
    approved: boolean          # Whether specification has been approved
    approvedBy: string         # Entity that approved (optional)
    approvalDate: string       # Date of approval in YYYY-MM-DD format (optional)
  security:
    classification: string     # "public" | "internal" | "confidential" | "restricted"
    authentication: string     # "required" | "optional" | "none"
    encryption: string         # Encryption requirements (e.g., "tls1.3")
  observability:
    tracing: boolean           # Enable distributed tracing
    metrics: boolean   # Enable metrics collection
    logging: boolean           # Enable structured logging
```

**OpenAPI Example**:

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

paths:
  # ... paths ...
```

**JSON Example**:

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Kubernetes Troubleshooter Agent API",
    "version": "1.0.0"
  },
  "x-ossa-metadata": {
    "version": "0.2.2",
    "compliance": {
      "level": "enterprise",
      "frameworks": ["OSSA", "OpenAPI 3.1", "RFC7807"]
    },
    "governance": {
      "approved": true,
      "approvedBy": "Platform Team",
      "approvalDate": "2024-01-15"
    },
    "security": {
      "classification": "internal",
      "authentication": "required",
      "encryption": "tls1.3"
    },
    "observability": {
      "tracing": true,
      "metrics": true,
      "logging": true
    }
  }
}
```

---

### x-ossa

Core OSSA compliance information with agent identification and validation metadata.

**Location**: Root level or `info` section of OpenAPI spec

**Schema**:

```yaml
x-ossa:
  version: string              # OSSA specification version
  agent:
    id: string                 # Unique agent identifier (DNS-不为subdomain format)
    type: string               # Agent type (see enum below)
    compliance:
      standards: string[]      # Architectural standards
      validated: boolean       # Whether agent has been validated
      validatedAt: string      # ISO 8601 timestamp of validation
```

**Agent Types**:
- `orchestrator` - Coordinates multiple agents and workflows
- `worker` - Performs specific tasks and operations
- `specialist` - Specialized domain expertise
- `critic` - Reviews and validates agent outputs
- `judge` - Makes decisions and evaluates outcomes
- `monitor` - Observes and reports on system state
- `gateway` - Entry point for agent communication
- `governor` - Enforces policies and compliance
- `integrator` - Connects systems and protocols
- `voice` - Handles audio/speech interactions

**OpenAPI Example**:

```yaml
openapi: 3.1.0
info:
  title: My Agent API
  version: 1.0.0

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

paths:
  # ... paths ...
```

---

### x-agent

Agent-specific capabilities, tools, environment, and rules configuration.

**Location**: Root level or `info` section of OpenAPI spec

**Schema**:

```yaml
x-agent:
  capabilities: string[]       # List of agent capability names
  tools: string[]              # List of tools/MCP servers available
  environment: object          # Environment-specific configuration (key-value pairs)
  rules: string[]              # List of rules or policies the agent follows
```

**OpenAPI Example**:

```yaml
openapi: 3.1.0
info:
  title: Data Processing Agent API
  version: 1.0.0

x-agent:
  capabilities:
    - data-transformation
    - csv-parsing
    - json-validation
  tools:
    - postgres-mcp
    - redis-mcp
    - file-system-mcp
  environment:
    processingTimeout: 300
    maxFileSize: "100MB"
    enableCaching: true
  rules:
    - no-external-api-calls
    - validate-all-inputs
    - encrypt-sensitive-data

paths:
  # ... paths ...
```

---

## Operation-Level Extensions

Extensions that can be added to individual OpenAPI operations (GET, POST, PUT, DELETE, etc.).

### x-ossa-capability

Links an OpenAPI operation to an OSSA agent capability. Can be a simple string reference or a detailed capability object.

**Location**: Operation object within path item

**Schema**:

```yaml
# Simple string reference
x-ossa-capability: "capability-name"

# Or detailed object
x-ossa-capability:
  name: string                 # Capability name
  description: string          # Capability description (optional)
  inputSchema: object          # JSON Schema for capability input (optional)
  outputSchema: object         # JSON Schema for capability output (optional)
```

**OpenAPI Example**:

```yaml
paths:
  /api/v1/process-data:
    post:
      summary: Process incoming data
      operationId: processData
      x-ossa-capability:
        name: data-transformation
        description: Transforms CSV data to JSON format
        inputSchema:
          type: object
          required: [csvData]
          properties:
            csvData:
              type: string
              description: CSV content to transform
        outputSchema:
          type: object
          properties:
            jsonData:
              type: array
              items:
                type: object
      requestBody:
        # ... request body ...
      responses:
        # ... responses ...
```

**Note**: The `inputSchema` and `outputSchema` should match the OpenAPI `requestBody` and `responses` schemas respectively, providing additional capability-level metadata.

---

### x-ossa-autonomy

Defines autonomy level and approval requirements for operation execution.

**Location**: Operation object within path item

**Schema**:

```yaml
x-ossa-autonomy:
  level: string                # "supervised" | "autonomous" | "semi-autonomous"
  approval_required: boolean   # Whether human approval is required
  allowed_actions: string[]    # List of allowed actions (optional)
  blocked_actions: string[]    # List of blocked actions (optional)
```

**Autonomy Levels**:

| Level | Description |
|-------|-------------|
| `supervised` | Requires human approval before execution |
| `semi-autonomous` | Can execute with automatic approval under certain conditions |
| `autonomous` | Can execute without human intervention |

**OpenAPI Example**:

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
          - cascade_delete
      parameters:
        # ... parameters ...
      responses:
        # ... responses ...
```

---

### x-ossa-constraints

Defines cost, token, performance, and time constraints for operation execution.

**Location**: Operation object within path item

**Schema**:

```yaml
x-ossa-constraints:
  cost:
    maxTokensPerDay: integer      # Maximum tokens allowed per day
    maxTokensPerRequest: integer  # Maximum tokens allowed per request
    maxCostPerDay: number         # Maximum cost in USD per day
    currency: string              # Currency code (default: "USD")
  performance:
    maxLatencySeconds: number     # Maximum acceptable latency in seconds
    maxConcurrentRequests: integer # Maximum concurrent requests
  time:
    maxExecutionTime: integer     # Maximum execution time in seconds
```

**OpenAPI Example**:

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
      requestBody:
        # ... request body ...
      responses:
        # ... responses ...
```

---

### x-ossa-tools

Specifies MCP servers or tools required for operation execution.

**Location**: Operation object within path item

**Schema**:

```yaml
x-ossa-tools:
  - type: string                 # "mcp" | "http" | "custom"
    server: string               # Tool server identifier or URL
    namespace: string            # Namespace for the tool (optional, for MCP servers)
    capabilities: string[]       # List of tool capabilities (optional)
```

**OpenAPI Example**:

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
            - describe_resource
        - type: mcp
          server: buildkit-agent-protocol
          namespace: default
          capabilities:
            - search_documentation
            - analyze_logs
      requestBody:
        # ... request body ...
      responses:
        # ... responses ...
```

---

### x-ossa-llm

Overrides LLM configuration for a specific operation. Useful when different operations require different models or settings.

**Location**: Operation object within path item

**Schema**:

```yaml
x-ossa-llm:
  provider: string               # "openai" | "anthropic" | "google" | "azure" | "custom"
  model: string                  # Model identifier (e.g., "gpt-4", "claude-3-opus")
  temperature: number            # Sampling temperature (0-2, optional)
  maxTokens: integer             # Maximum tokens in response (optional)
```

**OpenAPI Example**:

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
      requestBody:
        # ... request body ...
      responses:
        # ... responses ...
```

**Note**: If `x-ossa-llm` is not specified at the operation level, the agent should use the default LLM configuration from the OSSA manifest or root-level configuration.

---

## Parameter Extensions

Extensions for OpenAPI parameters (headers, query params, path params, cookies).

### x-ossa-agent-id

Standard header parameter for agent identification in agent-to-agent communication.

**Location**: Parameter definition in `components.parameters` or operation-level `parameters`

**OpenAPI Example**:

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
      example: "k8s-troubleshooter"

paths:
  /api/v1/capabilities:
    get:
      summary: Get agent capabilities
      parameters:
        - $ref: '#/components/parameters/X-Ossa-Agent-Id'
mathbb
```

---

### x-ossa-version

Standard header parameter for OSSA specification version in requests.

**Location**: Parameter definition in `components.parameters` or operation-level `parameters`

**OpenAPI Example**:

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
      example: "0.2.2"

paths:
  /api/v1/execute:
    post:
      summary: Execute agent capability
      parameters:
        - $ref: '#/components/parameters/X-Ossa-Version'
```

---

## Schema Extensions

Extensions for OpenAPI schema definitions.

### x-ossa-capability-schema

Extends schema definition with capability metadata, linking OpenAPI schemas to OSSA capabilities.

**Location**: Schema definition in `components.schemas`

**Schema**:

```yaml
x-ossa-capability-schema:
  capabilityName: string        # Name of the capability this schema represents
  input: boolean                # Whether this is an input schema (default: false)
  output: boolean               # Whether this is an output schema (default: false)
  validation:
    required: boolean           # Whether validation is required (optional)
    strict: boolean             # Whether to use strict validation (optional)
```

**OpenAPI Example**:

```yaml
components:
  schemas:
    DataProcessingInput:
      type: object
      required: [csvData]
      properties:
        csvData:
          type: string
          description: CSV content to process
      x-ossa-capability-schema:
        capabilityName: data-transformation
        input: true
        validation:
          required: true
          strict: true

    DataProcessingOutput:
      type: object
      properties:
        jsonData:
          type: array
          items:
            type: object
      x-ossa-capability-schema:
        capabilityName: data-transformation
        output: true
```

---

## Complete Examples

### Minimal Agent API

A minimal example showing basic OSSA extensions:

```yaml
openapi: 3.1.0
info:
  title: Hello World Agent
  version: 1.0.0
  description: Minimal OSSA-compliant agent API

x-ossa-metadata:
  version: 0.2.2
  compliance:
    level: basic
    frameworks: [OSSA, OpenAPI 3.1]

x-ossa:
  version: 0.2.2
  agent:
    id: hello-world-agent
    type: worker
    compliance:
      standards: [openapi-first]
      validated: true
      validatedAt: "2024-01-15T10:00:00Z"

paths:
  /greet:
    post:
      summary: Generate greeting
      operationId: greet
      x-ossa-capability: greeting
      x-ossa-autonomy:
        level: autonomous
        approval_required: false
      x-ossa-llm:
        provider: openai
        model: gpt-3.5-turbo
        temperature: 0.7
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name]
              properties:
                name:
                  type: string
      responses:
        '200':
          description: Greeting generated
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
```

### Full Worker Agent API

A complete example showing all extensions:

```yaml
openapi: 3.1.0
info:
  title: Kubernetes Troubleshooter Agent API
  version: 1.0.0
  description: |
    Kubernetes cluster troubleshooting agent with diagnostic capabilities.
    Supports pod inspection, log analysis, and event correlation.

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

x-agent:
  capabilities:
    - pod-diagnostics
    - log-analysis
    - event-correlation
  tools:
    - kubernetes-mcp
    - buildkit-agent-protocol
  environment:
    defaultNamespace: default
    logRetention: 7d
  rules:
    - read-only-operations
    - require-approval-for-writes

components:
  parameters:
    X-Ossa-Agent-Id:
      name: X-OSSA-Agent-ID
      in: header
      description: Agent identifier
      schema:
        type: string

paths:
  /api/v1/diagnose/pod:
    post:
      summary: Diagnose pod issues
      operationId: diagnosePod
      tags: [Diagnostics]
      x-ossa-capability:
        name: pod-diagnostics
        description: Diagnose Kubernetes pod failures and issues
      x-ossa-autonomy:
        level: supervised
        approval_required: true
        allowed_actions:
          - read_pods
          - read_logs
          - read_events
        blocked_actions:
          - delete_pods
          - modify_configs
      x-ossa-constraints:
        cost:
          maxTokensPerDay: 50000
          maxTokensPerRequest: 4000
          maxCostPerDay: 10.0
          currency: USD
        performance:
          maxLatencySeconds: 30
          maxConcurrentRequests: 5
      x-ossa-tools:
        - type: mcp
          server: kubernetes-mcp
          namespace: default
          capabilities:
            - get_pods
            - get_logs
            - get_events
            - describe_resource
      x-ossa-llm:
        provider: openai
        model: gpt-4
        temperature: 0.2
        maxTokens: 4000
      parameters:
        - $ref: '#/components/parameters/X-Ossa-Agent-Id'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [podName, namespace]
              properties:
                podName:
                  type: string
                namespace:
                  type: string
      responses:
        '200':
          description: Diagnosis complete
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                  issues:
                    type: array
                    items:
                      type: object
                  recommendations:
                    type: array
                    items:
                      type: string
```

---

## Integration with OSSA Manifests

OSSA OpenAPI extensions complement OSSA agent manifests (`.ossa.yaml` files). They serve different but related purposes:

### OSSA Agent Manifest (`.ossa.yaml`)
- **Purpose**: Declarative agent definition with full configuration
- **Contains**: Role, LLM config, tools, autonomy, constraints, extensions
- **Used For**: Agent deployment, runtime configuration, framework integration

### OpenAPI Specification with OSSA Extensions
- **Purpose**: API interface definition with agent metadata
- **Contains**: HTTP endpoints, request/response schemas, agent capabilities
- **Used For**: API documentation, client generation, runtime API validation

### Bidirectional Mapping

An agent can have both:

1. **OSSA Manifest** (`agent.ossa.yaml`) - Defines the agent's behavior
2. **OpenAPI Spec** (`agent.openapi.yaml`) - Defines the agent's HTTP interface

The OpenAPI spec should reference capabilities and tools defined in the manifest:

```yaml
# agent.ossa.yaml
apiVersion: ossa/v0.2.2
kind: Agent
metadata:
  name: k8s-troubleshooter
spec:
  capabilities:
    - pod-diagnostics
  tools:
    - type: mcp
      server: kubernetes-mcp

---

# agent.openapi.yaml
openapi: 3.1.0
x-ossa:
  agent:
    id: k8s-troubleshooter  # References manifest metadata.name
paths:
  /api/v1/diagnose/pod:
    post:
      x-ossa-capability: pod-diagnostics  # References manifest capability
      x-ossa-tools:
        - type: mcp
          server: kubernetes-mcp  # References manifest tool
```

### Best Practices

1. **Keep in Sync**: Ensure OpenAPI extensions reference capabilities/tools from the manifest
2. **Single Source of Truth**: Use manifest for agent behavior, OpenAPI for API contract
3. **Version Together**: When updating agent capabilities, update both files
4. **Validate Both**: Use `ossa validate` for manifest and OpenAPI validation for spec

---

## Tools & Validation

### CLI Validation

The OSSA CLI can validate OpenAPI specs with OSSA extensions:

```bash
# Validate OpenAPI spec with OSSA extensions
ossa validate --openapi agent.openapi.yaml

# Validate both manifest and OpenAPI spec
ossa validate agent.ossa.yaml agent.openapi.yaml
```

### IDE Support

- **VS Code**: Install OpenAPI extension + OSSA extension (when available)
- **IntelliJ**: OpenAPI plugin recognizes custom extensions
- **Online Editors**: Swagger Editor and Stoplight Studio support custom extensions

### OpenAPI Tool Compatibility

Most OpenAPI tools ignore unknown extensions (per OpenAPI spec), so OSSA extensions won't break existing tooling. However, OSSA-aware tools can:

- Generate agent clients with capability awareness
- Validate autonomy and constraint requirements
- Document tool requirements and MCP server dependencies
- Generate compliance reports from metadata

---

## References

- [OSSA Specification v0.2.2](../spec/v0.2.2/OSSA-SPECIFICATION-v0.2.2.md)
- [OSSA JSON Schema](../spec/v0.2.2/ossa-0.2.2.schema.json)
- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)
- [OpenAPI Extensions Schema](../schemas/openapi-extensions.schema.json)
- [OSSA Examples](../../examples/)
- [GitHub Repository](https://github.com/blueflyio/openstandardagents)

---

**OSSA OpenAPI Extensions: Making AI agents discoverable, interoperable, and enterprise-ready.**

