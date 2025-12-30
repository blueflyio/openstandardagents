---
title: "OpenAPI 3.1 Integration"
description: "Technical guide for integrating OSSA with OpenAPI 3.1 specifications"
weight: 1
---

# OpenAPI 3.1 Integration with OSSA

OSSA extends OpenAPI 3.1 specifications to describe AI agent capabilities, autonomy levels, and runtime configuration. This integration enables OpenAPI-first development workflows where the API specification drives both REST API implementation and agent behavior.

## Overview

OSSA OpenAPI extensions allow you to:

- Define agent capabilities as OpenAPI operations
- Specify autonomy levels per operation
- Configure LLM providers and models
- Declare required tools and MCP servers
- Set cost and performance constraints
- Enable observability and tracing

## OpenAPI 3.1 Requirements

OSSA extensions require OpenAPI 3.1.0 or later:

```yaml
openapi: 3.1.0
info:
  title: Agent API
  version: 1.0.0
```

## Root-Level Extensions

### x-ossa-metadata

Comprehensive agent metadata at the OpenAPI spec root level.

**Schema**:

```yaml
x-ossa-metadata:
  version: string              # OSSA specification version (e.g., "0.3.0")
  compliance:
    level: string              # "basic" | "standard" | "advanced" | "enterprise"
    frameworks: string[]       # List of compliance frameworks
  governance:
    approved: boolean           # Whether specification has been approved
    approvedBy: string          # Entity that approved (optional)
    approvalDate: string        # Date of approval in YYYY-MM-DD format (optional)
  security:
    classification: string     # "public" | "internal" | "confidential" | "restricted"
    authentication: string      # "required" | "optional" | "none"
    encryption: string          # Encryption requirements (e.g., "tls1.3")
  observability:
    tracing: boolean           # Enable distributed tracing
    metrics: boolean           # Enable metrics collection
    logging: boolean           # Enable structured logging
```

**Example**:

```yaml
openapi: 3.1.0
info:
  title: Data Processing Agent API
  version: 1.0.0

x-ossa-metadata:
  version: "0.3.0"
  compliance:
    level: enterprise
    frameworks:
      - OSSA
      - OpenAPI 3.1
  governance:
    approved: true
    approvedBy: Platform Engineering Team
    approvalDate: "2024-01-15"
  security:
    classification: internal
    authentication: required
    encryption: tls1.3
  observability:
    tracing: true
    metrics: true
    logging: true
```

## Operation-Level Extensions

### x-ossa-capability

Links an OpenAPI operation to an OSSA agent capability.

**Schema**:

```yaml
x-ossa-capability:
  name: string                 # Capability name (must match agent manifest)
  description: string          # Capability description
  input: boolean               # Whether operation accepts input
  output: boolean              # Whether operation produces output
```

**Example**:

```yaml
paths:
  /api/v1/transform-data:
    post:
      summary: Transform CSV to JSON
      operationId: transformData
      x-ossa-capability:
        name: data-transformation
        description: Transforms CSV data to JSON format
        input: true
        output: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                csvData:
                  type: string
      responses:
        '200':
          description: Transformation successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  jsonData:
                    type: object
```

### x-ossa-autonomy

Defines autonomy level and approval requirements for operation execution.

**Autonomy Levels**:

- `supervised` - Requires human approval before execution
- `semi-autonomous` - Can execute with automatic approval under certain conditions
- `autonomous` - Can execute without human intervention (requires audit logging)

**Schema**:

```yaml
x-ossa-autonomy:
  level: string                # "supervised" | "semi-autonomous" | "autonomous"
  approval_required: boolean   # Whether human approval is required
  allowed_actions: string[]    # List of allowed action types
  blocked_actions: string[]   # List of blocked action types
```

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
          - bulk_delete
```

### x-ossa-constraints

Defines cost, token, performance, and time constraints for operation execution.

**Schema**:

```yaml
x-ossa-constraints:
  cost:
    maxTokensPerDay: number    # Maximum tokens per day
    maxTokensPerRequest: number # Maximum tokens per request
    maxCostPerDay: number      # Maximum cost per day
    currency: string           # Currency code (e.g., "USD")
  performance:
    maxLatencySeconds: number   # Maximum response latency
    maxConcurrentRequests: number # Maximum concurrent requests
  time:
    maxExecutionTime: number    # Maximum execution time in seconds
```

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

### x-ossa-tools

Specifies MCP servers or tools required for operation execution.

**Schema**:

```yaml
x-ossa-tools:
  - type: string               # "mcp" | "http" | "function"
    server: string             # Server identifier (for MCP)
    namespace: string          # Namespace (for MCP)
    capabilities: string[]     # List of required capabilities
```

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

### x-ossa-llm

Overrides LLM configuration for a specific operation.

**Schema**:

```yaml
x-ossa-llm:
  provider: string             # "openai" | "anthropic" | "google" | "azure"
  model: string                # Model identifier (e.g., "gpt-4", "claude-3-5-sonnet")
  temperature: number           # Temperature (0.0-2.0)
  maxTokens: number            # Maximum tokens
  topP: number                 # Top-p sampling (optional)
  frequencyPenalty: number     # Frequency penalty (optional)
```

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

## Type Generation

Generate TypeScript types from OpenAPI specifications with OSSA extensions:

```bash
# Using openapi-typescript
npx openapi-typescript agent-api.openapi.yml -o types/agent-api.ts

# Types include OSSA extension properties
interface TransformDataOperation {
  'x-ossa-capability': {
    name: 'data-transformation';
    description: string;
    input: boolean;
    output: boolean;
  };
  'x-ossa-constraints': {
    cost: {
      maxTokensPerRequest: number;
      maxCostPerDay: number;
    };
  };
}
```

## Runtime Validation

Validate OpenAPI specs with OSSA extensions:

```bash
# Using Spectral
npx @stoplight/spectral-cli lint agent-api.openapi.yml

# Using Redocly CLI
npx @redocly/cli lint agent-api.openapi.yml
```

## Integration with OSSA Manifests

OSSA OpenAPI extensions complement OSSA agent manifests:

1. **Agent Manifest** (`.ossa.yaml`) - Complete agent configuration
2. **OpenAPI Spec** - API interface with OSSA extensions
3. **Link via `x-ossa-capability`** - Connect operations to manifest capabilities

**Workflow**:

1. Define agent capabilities in `.ossa.yaml`
2. Create OpenAPI spec with `x-ossa-capability` extensions
3. Link operations to capabilities by name
4. Generate types and validate

## Best Practices

1. **Always specify `x-ossa-autonomy`** for operations that modify state
2. **Set `x-ossa-constraints`** to prevent runaway costs
3. **Use `x-ossa-tools`** to declare dependencies explicitly
4. **Validate schemas** before deployment
5. **Document all extensions** in operation descriptions

## References

- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)
- [OSSA Schema Reference](/docs/schema-reference)
- [OSSA OpenAPI Extensions Schema](/schemas/openapi-extensions.schema.json)
