# Operation-Level Extensions

Extensions that can be added to individual OpenAPI operations (GET, POST, PUT, DELETE, etc.).

---

## x-ossa-capability

Links an OpenAPI operation to an OSSA agent capability. Can be a simple string reference or a detailed capability object.

### Location

Operation object within path item

### Schema

**Simple string reference**:
```yaml
x-ossa-capability: "capability-name"
```

**Detailed object**:
```yaml
x-ossa-capability:
  name: string                 # Capability name
  description: string          # Capability description (optional)
  input: boolean              # Whether this is an input capability (optional)
  output: boolean             # Whether this is an output capability (optional)
  inputSchema: object         # JSON Schema for capability input (optional)
  outputSchema: object         # JSON Schema for capability output (optional)
```

**Schema Reference Table:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Capability name |
| `description` | string | Capability description (optional) |
| `input` | boolean | Whether this is an input capability (optional) |
| `output` | boolean | Whether this is an output capability (optional) |
| `inputSchema` | object | JSON Schema for capability input (optional) |
| `outputSchema` | object | JSON Schema for capability output (optional) |

### Example

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

### Use Cases

- **Capability mapping** - Link API operations to agent capabilities
- **Schema validation** - Provide additional capability-level schemas
- **Documentation** - Describe what capability each operation provides
- **Discovery** - Enable capability-based API discovery

**Note**: The `inputSchema` and `outputSchema` should match the OpenAPI `requestBody` and `responses` schemas respectively, providing additional capability-level metadata.

---

## x-ossa-autonomy

Defines autonomy level and approval requirements for operation execution.

### Location

Operation object within path item

### Schema

```yaml
x-ossa-autonomy:
  level: string                # "supervised" | "semi-autonomous" | "autonomous"
  approval_required: boolean   # Whether human approval is required
  allowed_actions: string[]   # List of allowed actions (optional)
  blocked_actions: string[]   # List of blocked actions (optional)
```

**Schema Reference Table:**

| Field | Type | Description |
|-------|------|-------------|
| `level` | string | Autonomy level: "supervised" \| "autonomous" \| "semi-autonomous" |
| `approval_required` | boolean | Whether human approval is required |
| `allowed_actions` | string[] | List of allowed actions (optional) |
| `blocked_actions` | string[] | List of blocked actions (optional) |

### Autonomy Levels

| Level | Description |
|-------|-------------|
| `supervised` | Requires human approval before execution |
| `semi-autonomous` | Can execute with automatic approval under certain conditions |
| `autonomous` | Can execute without human intervention |

### Example

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

### Use Cases

- **Safety controls** - Require approval for destructive operations
- **Action whitelisting** - Define what actions agent can perform
- **Action blacklisting** - Prevent specific dangerous actions
- **Governance** - Document approval workflows per operation

---

## x-ossa-constraints

Defines cost, token, performance, and time constraints for operation execution.

### Location

Operation object within path item

### Schema

```yaml
x-ossa-constraints:
  cost:
    maxTokensPerDay: integer   # Maximum tokens allowed per day
    maxTokensPerRequest: integer # Maximum tokens allowed per request
    maxCostPerDay: number      # Maximum cost in USD per day
    currency: string           # Currency code (default: "USD")
  performance:
    maxLatencySeconds: number  # Maximum acceptable latency in seconds
    maxConcurrentRequests: integer # Maximum concurrent requests
  time:
    maxExecutionTime: integer  # Maximum execution time in seconds
```

**Schema Reference Table:**

| Field | Type | Description |
|-------|------|-------------|
| `cost.maxTokensPerDay` | integer | Maximum tokens allowed per day |
| `cost.maxTokensPerRequest` | integer | Maximum tokens allowed per request |
| `cost.maxCostPerDay` | number | Maximum cost in USD per day |
| `cost.currency` | string | Currency code (default: "USD") |
| `performance.maxLatencySeconds` | number | Maximum acceptable latency in seconds |
| `performance.maxConcurrentRequests` | integer | Maximum concurrent requests |
| `time.maxExecutionTime` | integer | Maximum execution time in seconds |

### Example

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

### Use Cases

- **Cost control** - Prevent runaway LLM costs
- **Performance SLAs** - Define acceptable latency and throughput
- **Resource limits** - Control concurrent execution
- **Timeout handling** - Set maximum execution time

---

## x-ossa-tools

Specifies MCP servers or tools required for operation execution.

### Location

Operation object within path item

### Schema

Each tool is an object in an array:

```yaml
x-ossa-tools:
  - type: string               # "mcp" | "http" | "custom"
    server: string             # Tool server identifier or URL
    namespace: string          # Namespace for the tool (optional, for MCP servers)
    capabilities: string[]     # List of tool capabilities (optional)
```

**Schema Reference Table:**

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Tool type: "mcp" \| "http" \| "custom" |
| `server` | string | Tool server identifier or URL |
| `namespace` | string | Namespace for the tool (optional, for MCP servers) |
| `capabilities` | string[] | List of tool capabilities (optional) |

### Example

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

### Use Cases

- **Tool requirements** - Document MCP servers needed per operation
- **Capability dependencies** - List specific tool capabilities required
- **Runtime validation** - Verify required tools are available
- **Documentation** - Auto-generate tool dependency graphs

---

## x-ossa-llm

Overrides LLM configuration for a specific operation. Useful when different operations require different models or settings.

### Location

Operation object within path item

### Schema

```yaml
x-ossa-llm:
  provider: string             # "openai" | "anthropic" | "google" | "azure" | "custom"
  model: string                # Model identifier (e.g., "gpt-4", "claude-3-opus")
  temperature: number          # Sampling temperature (0-2, optional)
  maxTokens: integer           # Maximum tokens in response (optional)
```

**Schema Reference Table:**

| Field | Type | Description |
|-------|------|-------------|
| `provider` | string | Provider: "openai" \| "anthropic" \| "google" \| "azure" \| "custom" |
| `model` | string | Model identifier (e.g., "gpt-4", "claude-3-opus") |
| `temperature` | number | Sampling temperature (0-2, optional) |
| `maxTokens` | integer | Maximum tokens in response (optional) |

### Example

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

### Use Cases

- **Model selection** - Use different models for different tasks
- **Temperature tuning** - Lower temperature for factual tasks, higher for creative
- **Token limits** - Control response size per operation
- **Cost optimization** - Use cheaper models for simple operations

**Note**: If `x-ossa-llm` is not specified at the operation level, the agent should use the default LLM configuration from the OSSA manifest or root-level configuration.

---

## Complete Operation Example

All extensions combined:

```yaml
paths:
  /api/v1/diagnose/pod:
    post:
      summary: Diagnose pod issues
      operationId: diagnosePod
      tags: [Diagnostics]

      # Link to capability
      x-ossa-capability:
        name: pod-diagnostics
        description: Diagnose Kubernetes pod failures and issues

      # Autonomy and safety
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

      # Cost and performance constraints
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

      # Required tools
      x-ossa-tools:
        - type: mcp
          server: kubernetes-mcp
          namespace: default
          capabilities:
            - get_pods
            - get_logs
            - get_events

      # LLM configuration
      x-ossa-llm:
        provider: openai
        model: gpt-4
        temperature: 0.2
        maxTokens: 4000

      # Standard OpenAPI
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

## Best Practices

1. **Always define autonomy levels** - Especially for destructive operations
2. **Set realistic constraints** - Monitor actual usage to tune limits
3. **Document tool requirements** - List all MCP servers and capabilities needed
4. **Use appropriate LLM configs** - Match model to task complexity
5. **Link to capabilities** - Enable capability-based discovery

---

## References

- [Root-Level Extensions](root-extensions)
- [Examples & Patterns](examples)
- [OSSA Specification v0.2.2](../Technical/Specification-Deep-Dive)
- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)
