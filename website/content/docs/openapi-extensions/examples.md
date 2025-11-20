# Complete Examples

Real-world OpenAPI specifications with OSSA extensions.

---

## Minimal Agent API

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

### Key Features

- **Basic compliance** - Minimal OSSA metadata
- **Single capability** - One greeting capability
- **Autonomous execution** - No approval required
- **Simple LLM config** - Default GPT-3.5 Turbo

---

## Full Worker Agent API

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
        pattern: "^[a-z0-9]([-a-z0-9]*[a-z0-9])?$"
      example: "k8s-troubleshooter"

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
        time:
          maxExecutionTime: 300
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
                  description: Name of the pod to diagnose
                  example: "nginx-deployment-7d5c6d8b4f-abc123"
                namespace:
                  type: string
                  description: Kubernetes namespace
                  example: "default"
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
                    enum: [healthy, degraded, failing]
                  issues:
                    type: array
                    items:
                      type: object
                      properties:
                        severity:
                          type: string
                          enum: [low, medium, high, critical]
                        category:
                          type: string
                        description:
                          type: string
                  recommendations:
                    type: array
                    items:
                      type: string
        '400':
          description: Invalid request
        '403':
          description: Approval required
        '500':
          description: Internal error
```

### Key Features

- **Enterprise compliance** - Full governance and security metadata
- **Supervised autonomy** - Requires approval for execution
- **Cost constraints** - Token and budget limits
- **MCP integration** - Kubernetes MCP server tools
- **Full observability** - Tracing, metrics, logging enabled

---

## Data Processing Agent

Example showing schema extensions and capability mapping:

```yaml
openapi: 3.1.0
info:
  title: Data Processing Agent API
  version: 1.0.0

x-ossa-metadata:
  version: 0.2.2
  compliance:
    level: standard
    frameworks: [OSSA, OpenAPI 3.1]

x-ossa:
  version: 0.2.2
  agent:
    id: data-processor
    type: worker
    compliance:
      standards: [openapi-first, type-safe]
      validated: true

x-agent:
  capabilities:
    - data-transformation
    - csv-parsing
    - json-validation
  tools:
    - file-system-mcp
    - postgres-mcp
  environment:
    processingTimeout: 300
    maxFileSize: "100MB"

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
        rowCount:
          type: integer
      x-ossa-capability-schema:
        capabilityName: data-transformation
        output: true

paths:
  /api/v1/transform:
    post:
      summary: Transform CSV to JSON
      operationId: transformData
      x-ossa-capability:
        name: data-transformation
        description: Transforms CSV data to JSON format
      x-ossa-autonomy:
        level: autonomous
        approval_required: false
      x-ossa-constraints:
        cost:
          maxTokensPerRequest: 2000
        performance:
          maxLatencySeconds: 10
        time:
          maxExecutionTime: 60
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DataProcessingInput'
      responses:
        '200':
          description: Data transformed successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DataProcessingOutput'
```

### Key Features

- **Schema extensions** - Links schemas to capabilities
- **Type safety** - Strict validation on input/output
- **Autonomous processing** - No approval needed
- **Performance constraints** - Fast processing requirements

---

## Integration with OSSA Manifests

OSSA OpenAPI extensions complement OSSA agent manifests (`.ossa.yaml` files). They serve different but related purposes.

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

**agent.ossa.yaml**:
```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: k8s-troubleshooter
spec:
  capabilities:
    - pod-diagnostics
  tools:
    - type: mcp
      server: kubernetes-mcp
  llm:
    provider: openai
    model: gpt-4
    temperature: 0.2
```

**agent.openapi.yaml**:
```yaml
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
      x-ossa-llm:
        provider: openai
        model: gpt-4
        temperature: 0.2
```

### Best Practices

1. **Keep in Sync** - Ensure OpenAPI extensions reference capabilities/tools from the manifest
2. **Single Source of Truth** - Use manifest for agent behavior, OpenAPI for API contract
3. **Version Together** - When updating agent capabilities, update both files
4. **Validate Both** - Use `ossa validate` for manifest and OpenAPI validation for spec

### Validation Workflow

```bash
# Validate OSSA manifest
ossa validate agent.ossa.yaml

# Validate OpenAPI spec with OSSA extensions
ossa validate --openapi agent.openapi.yaml

# Validate both together
ossa validate agent.ossa.yaml agent.openapi.yaml
```

---

## Multi-Capability Agent

Example with multiple capabilities and different autonomy levels:

```yaml
openapi: 3.1.0
info:
  title: DevOps Assistant Agent
  version: 1.0.0

x-ossa:
  version: 0.2.2
  agent:
    id: devops-assistant
    type: worker

x-agent:
  capabilities:
    - read-metrics
    - analyze-logs
    - suggest-fixes
    - apply-fixes
  tools:
    - prometheus-mcp
    - grafana-mcp
    - kubernetes-mcp

paths:
  /api/v1/metrics/read:
    get:
      summary: Read current metrics
      x-ossa-capability: read-metrics
      x-ossa-autonomy:
        level: autonomous
        approval_required: false
      responses:
        '200':
          description: Metrics retrieved

  /api/v1/logs/analyze:
    post:
      summary: Analyze logs for issues
      x-ossa-capability: analyze-logs
      x-ossa-autonomy:
        level: autonomous
        approval_required: false
      x-ossa-llm:
        provider: openai
        model: gpt-4
      responses:
        '200':
          description: Analysis complete

  /api/v1/fixes/suggest:
    post:
      summary: Suggest fixes for issues
      x-ossa-capability: suggest-fixes
      x-ossa-autonomy:
        level: semi-autonomous
        approval_required: false
      responses:
        '200':
          description: Suggestions generated

  /api/v1/fixes/apply:
    post:
      summary: Apply fixes to infrastructure
      x-ossa-capability: apply-fixes
      x-ossa-autonomy:
        level: supervised
        approval_required: true
        allowed_actions:
          - restart_pod
          - scale_deployment
        blocked_actions:
          - delete_namespace
          - modify_rbac
      responses:
        '200':
          description: Fixes applied
        '403':
          description: Approval required
```

### Key Features

- **Progressive autonomy** - Read operations autonomous, write operations supervised
- **Capability-based permissions** - Different autonomy per capability
- **Safety controls** - Blocked actions prevent destructive operations

---

## References

- [Root-Level Extensions](root-extensions)
- [Operation-Level Extensions](operation-extensions)
- [OSSA Specification](/docs/specification)
- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)
