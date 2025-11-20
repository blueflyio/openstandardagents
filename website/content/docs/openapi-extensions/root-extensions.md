# Root-Level Extensions

Extensions that can be added at the root level of an OpenAPI 3.1 specification.

---

## x-ossa-metadata

Embeds comprehensive OSSA agent metadata in OpenAPI spec root. Provides governance, compliance, security, and observability metadata.

### Location

Root level of OpenAPI spec

### Schema

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
    metrics: boolean           # Enable metrics collection
    logging: boolean           # Enable structured logging
```

**Schema Reference Table:**

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | OSSA specification version (e.g., "0.2.2", "1.0.0") |
| `compliance.level` | string | Compliance level: "basic" \| "standard" \| "advanced" \| "enterprise" |
| `compliance.frameworks` | string[] | List of compliance frameworks (e.g., ["OSSA", "OpenAPI 3.1"]) |
| `governance.approved` | boolean | Whether specification has been approved |
| `governance.approvedBy` | string | Entity that approved (optional) |
| `governance.approvalDate` | string | Date of approval in YYYY-MM-DD format (optional) |
| `security.classification` | string | Security level: "public" \| "internal" \| "confidential" \| "restricted" |
| `security.authentication` | string | Auth requirement: "required" \| "optional" \| "none" |
| `security.encryption` | string | Encryption requirements (e.g., "tls1.3") |
| `observability.tracing` | boolean | Enable distributed tracing |
| `observability.metrics` | boolean | Enable metrics collection |
| `observability.logging` | boolean | Enable structured logging |

### Example (YAML)

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

### Example (JSON)

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

### Use Cases

- **Enterprise compliance** - Document governance and approval workflows
- **Security audits** - Declare security classification and requirements
- **Observability** - Enable tracing, metrics, and logging at spec level
- **Multi-framework compliance** - Track compliance with multiple standards

---

## x-ossa

Core OSSA compliance information with agent identification and validation metadata.

### Location

Root level or `info` section of OpenAPI spec

### Schema

```yaml
x-ossa:
  version: string              # OSSA specification version (e.g., "0.2.2")
  agent:
    id: string                 # Unique agent identifier (DNS subdomain format)
    type: string               # Agent type (see table below)
    compliance:
      standards: string[]      # Architectural standards (e.g., ["openapi-first", "dry", "solid"])
      validated: boolean       # Whether agent has been validated
      validatedAt: string      # ISO 8601 timestamp of validation
```

**Schema Reference Table:**

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | OSSA specification version (e.g., "0.2.2") |
| `agent.id` | string | Unique agent identifier (DNS subdomain format) |
| `agent.type` | string | Agent type (see table below) |
| `agent.compliance.standards` | string[] | Architectural standards (e.g., ["openapi-first", "dry", "solid"]) |
| `agent.compliance.validated` | boolean | Whether agent has been validated |
| `agent.compliance.validatedAt` | string | ISO 8601 timestamp of validation |

### Agent Types

| Type | Description |
|------|-------------|
| `orchestrator` | Coordinates multiple agents and workflows |
| `worker` | Performs specific tasks and operations |
| `specialist` | Specialized domain expertise |
| `critic` | Reviews and validates agent outputs |
| `judge` | Makes decisions and evaluates outcomes |
| `monitor` | Observes and reports on system state |
| `gateway` | Entry point for agent communication |
| `governor` | Enforces policies and compliance |
| `integrator` | Connects systems and protocols |
| `voice` | Handles audio/speech interactions |

### Example

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

### Use Cases

- **Agent registry** - Unique ID enables agent discovery and registration
- **Type-based routing** - Route requests based on agent type
- **Validation tracking** - Track when agent spec was last validated
- **Standards compliance** - Document architectural standards followed

---

## x-agent

Agent-specific capabilities, tools, environment, and rules configuration.

### Location

Root level or `info` section of OpenAPI spec

### Schema

```yaml
x-agent:
  capabilities: string[]       # List of agent capability names
  tools: string[]             # List of tools/MCP servers available
  environment: object         # Environment-specific configuration (key-value pairs)
  rules: string[]             # List of rules or policies the agent follows
```

**Schema Reference Table:**

| Field | Type | Description |
|-------|------|-------------|
| `capabilities` | string[] | List of agent capability names |
| `tools` | string[] | List of tools/MCP servers available |
| `environment` | object | Environment-specific configuration (key-value pairs) |
| `rules` | string[] | List of rules or policies the agent follows |

### Example

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

### Use Cases

- **Capability discovery** - List all capabilities agent provides
- **Tool requirements** - Document MCP servers and tools needed
- **Environment config** - Define environment-specific settings
- **Policy enforcement** - Declare rules and constraints agent follows

---

## Parameter Extensions

Standard parameters for agent-to-agent communication.

### x-ossa-agent-id

Standard header parameter for agent identification.

**Location**: Parameter definition in `components.parameters` or operation-level `parameters`

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
      example: "k8s-troubleshooter"

paths:
  /api/v1/capabilities:
    get:
      summary: Get agent capabilities
      parameters:
        - $ref: '#/components/parameters/X-Ossa-Agent-Id'
```

### x-ossa-version

Standard header parameter for OSSA specification version.

**Location**: Parameter definition in `components.parameters` or operation-level `parameters`

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

### x-ossa-capability-schema

Extends schema definition with capability metadata, linking OpenAPI schemas to OSSA capabilities.

**Location**: Schema definition in `components.schemas`

**Schema**:

| Field | Type | Description |
|-------|------|-------------|
| `capabilityName` | string | Name of the capability this schema represents |
| `input` | boolean | Whether this is an input schema (default: false) |
| `output` | boolean | Whether this is an output schema (default: false) |
| `validation.required` | boolean | Whether validation is required (optional) |
| `validation.strict` | boolean | Whether to use strict validation (optional) |

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

## Best Practices

1. **Use x-ossa-metadata for enterprise deployments** - Document compliance, governance, and security
2. **Always include x-ossa at root** - Provides core agent identification
3. **Use x-agent for capability listing** - Makes agent discoverable
4. **Define standard parameters once** - Reference X-OSSA-Agent-ID and X-OSSA-Version from components
5. **Link schemas to capabilities** - Use x-ossa-capability-schema for validation

---

## References

- [Operation-Level Extensions](operation-extensions)
- [Examples & Patterns](examples)
- [OSSA Specification v0.2.2](../Technical/Specification-Deep-Dive)
- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)
