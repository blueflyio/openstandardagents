# Schema Definitions

Complete reference for OSSA API data models and JSON schemas.

## Core Schemas

### AgentManifest

The complete OSSA agent manifest structure.

```typescript
interface AgentManifest {
  apiVersion: string;              // "ossa/v0.3.0"
  kind: "Agent" | "Task" | "Workflow";
  metadata: Metadata;
  identity?: Identity;
  spec: AgentSpec;
}
```

### Metadata

Agent metadata and annotations.

```typescript
interface Metadata {
  name: string;                    // Lowercase alphanumeric + hyphens
  version: string;                 // Semantic version (X.Y.Z)
  description?: string;
  labels?: Record<string, string>; // Key-value pairs
  annotations?: Record<string, string>;
}
```

### Identity (v0.3.0+)

Service identity for OpenTelemetry and service mesh.

```typescript
interface Identity {
  service_name: string;
  service_namespace: string;
  service_version: string;
}
```

### AgentSpec

Agent specification and configuration.

```typescript
interface AgentSpec {
  role: string;                    // System prompt
  llm: LLMConfig;
  tools?: Tool[];
  messaging?: MessagingConfig;
  state?: StateConfig;
  safety?: SafetyConfig;
  compliance?: ComplianceConfig;
  observability?: ObservabilityConfig;
  lifecycle?: LifecycleConfig;
}
```

### LLMConfig

LLM provider configuration.

```typescript
interface LLMConfig {
  provider: "openai" | "anthropic" | "azure" | "bedrock" | "ollama";
  model: string;
  temperature?: number;            // 0.0-2.0
  max_tokens?: number;
  fallback?: LLMConfig;
}
```

### MessagingConfig

Agent-to-agent messaging configuration.

```typescript
interface MessagingConfig {
  publishes?: ChannelSpec[];
  subscribes?: SubscriptionSpec[];
  reliability?: ReliabilityConfig;
}

interface ChannelSpec {
  channel: string;
  schema?: object;                 // JSON Schema
}

interface SubscriptionSpec {
  channel: string;
  handler: string;
  filter?: string;
}
```

### SafetyConfig

Safety and security controls.

```typescript
interface SafetyConfig {
  content_filtering?: {
    block_pii?: boolean;
    block_credentials?: boolean;
    allowed_domains?: string[];
  };
  rate_limiting?: {
    requests_per_minute?: number;
    tokens_per_hour?: number;
  };
  input_validation?: {
    max_length?: number;
  };
  output_validation?: {
    max_length?: number;
    require_structured?: boolean;
  };
}
```

## Response Schemas

### AgentsList

Paginated list of agents.

```typescript
interface AgentsList {
  agents: Agent[];
  total: number;
  limit: number;
  offset: number;
}
```

### Agent

Registered agent details.

```typescript
interface Agent {
  id: string;                      // Unique identifier
  name: string;
  version: string;
  type: "agent" | "task" | "workflow";
  status: "active" | "inactive" | "deprecated";
  description?: string;
  manifest: AgentManifest;
  health?: HealthStatus;
  stats?: AgentStats;
  created_at: string;              // ISO 8601 timestamp
  updated_at: string;
}
```

### ValidationResult

Manifest validation result.

```typescript
interface ValidationResult {
  valid: boolean;
  version: string;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
}

interface ValidationError {
  path: string;
  message: string;
  code?: string;
}
```

### DiscoveryResults

Agent discovery search results.

```typescript
interface DiscoveryResults {
  results: DiscoveredAgent[];
  total: number;
  query: SearchQuery;
  facets?: Facets;
}

interface DiscoveredAgent {
  id: string;
  name: string;
  version: string;
  relevance_score: number;         // 0.0-1.0
  capabilities: string[];
  taxonomy: Taxonomy;
  provider: string;
  model: string;
}
```

## JSON Schema Examples

### Agent Manifest Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["apiVersion", "kind", "metadata", "spec"],
  "properties": {
    "apiVersion": {
      "type": "string",
      "enum": ["ossa/v0.3.0"]
    },
    "kind": {
      "type": "string",
      "enum": ["Agent", "Task", "Workflow"]
    },
    "metadata": {
      "$ref": "#/definitions/Metadata"
    },
    "spec": {
      "$ref": "#/definitions/AgentSpec"
    }
  }
}
```

### Capability Schema

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "description": { "type": "string" },
    "input_schema": { "type": "object" },
    "output_schema": { "type": "object" }
  },
  "required": ["name", "input_schema", "output_schema"]
}
```

## See Also

- [OpenAPI Specifications](../../openapi/core/)
- [Endpoints Reference](endpoints.md)
- [API Examples](examples.md)
- [OSSA v0.3.0 JSON Schema](../../spec/v0.3.0/ossa-0.3.0.schema.json)
