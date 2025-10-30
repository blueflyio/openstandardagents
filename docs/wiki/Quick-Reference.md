# OSSA OpenAPI Extensions - Quick Reference

> **Note**: This content is ready to copy-paste into GitLab Wiki pages.
> Page name: `OpenAPI Extensions Quick Reference`
> URL: `/docs/openapi-extensions-quick-reference` (relative to wiki)

## Extension Cheat Sheet

### Root-Level Extensions

#### x-ossa-metadata
```yaml
x-ossa-metadata:
  version: "0.2.2"
  compliance:
    level: "enterprise"
    frameworks: ["OSSA", "OpenAPI 3.1"]
  governance:
    approved: true
  security:
    classification: "internal"
    authentication: "required"
  observability:
    tracing: true
    metrics: true
    logging: true
```

#### x-ossa
```yaml
x-ossa:
  version: "0.2.2"
  agent:
    id: "my-agent"
    type: "worker"
    compliance:
      standards: ["openapi-first", "dry"]
      validated: true
```

#### x-agent
```yaml
x-agent:
  capabilities: ["capability1", "capability2"]
  tools: ["tool1", "tool2"]
  environment:
    key: "value"
  rules: ["rule1", "rule2"]
```

---

### Operation-Level Extensions

#### x-ossa-capability (Simple)
```yaml
x-ossa-capability: "capability-name"
```

#### x-ossa-capability (Detailed)
```yaml
x-ossa-capability:
  name: "capability-name"
  description: "Capability description"
```

#### x-ossa-autonomy
```yaml
x-ossa-autonomy:
  level: "supervised"  # or "autonomous" or "semi-autonomous"
  approval_required: true
  allowed_actions: ["action1", "action2"]
  blocked_actions: ["action3"]
```

#### x-ossa-constraints
```yaml
x-ossa-constraints:
  cost:
    maxTokensPerDay: 50000
    maxTokensPerRequest: 4000
    maxCostPerDay: 10.0
    currency: "USD"
  performance:
    maxLatencySeconds: 30
    maxConcurrentRequests: 5
  time:
    maxExecutionTime: 300
```

#### x-ossa-tools
```yaml
x-ossa-tools:
  - type: "mcp"
    server: "kubernetes-mcp"
    namespace: "default"
    capabilities: ["get_pods", "get_logs"]
```

#### x-ossa-llm
```yaml
x-ossa-llm:
  provider: "openai"
  model: "gpt-4"
  temperature: 0.2
  maxTokens: 4000
```

---

### Parameter Extensions

#### X-OSSA-Agent-ID Header
```yaml
components:
  parameters:
    X-Ossa-Agent-Id:
      name: X-OSSA-Agent-ID
      in: header
      schema:
        type: string
```

#### X-OSSA-Version Header
```yaml
components:
  parameters:
    X-Ossa-Version:
      name: X-OSSA-Version
      in: header
      schema:
        type: string
```

---

### Schema Extensions

#### x-ossa-capability-schema
```yaml
components:
  schemas:
    MySchema:
      type: object
      x-ossa-capability-schema:
        capabilityName: "my-capability"
        input: true
        validation:
          required: true
          strict: true
```

---

## Agent Types

Valid values for `x-ossa.agent.type`:

- `orchestrator` - Coordinates multiple agents
- `worker` - Performs specific tasks
- `specialist` - Specialized domain expertise
- `critic` - Reviews and validates outputs
- `judge` - Makes decisions
- `monitor` - Observes system state
- `gateway` - Entry point for communication
- `governor` - Enforces policies
- `integrator` - Connects systems
- `voice` - Handles audio/speech

---

## Autonomy Levels

| Level | Description | Approval Required? |
|-------|-------------|-------------------|
| `supervised` | Requires human approval | Yes |
| `semi-autonomous` | Automatic approval under conditions | Sometimes |
| `autonomous` | No human intervention | No |

---

## Compliance Levels

| Level | Use Case |
|-------|----------|
| `basic` | Development, testing |
| `standard` | Internal tools |
| `advanced` | Production services |
| `enterprise` | Regulated industries |

---

## Security Classifications

| Classification | Description |
|----------------|-------------|
| `public` | Public APIs |
| `internal` | Internal services |
| `confidential` | Sensitive data |
| `restricted` | Highly sensitive |

---

## Common Providers

| Provider | Example Models |
|----------|----------------|
| `openai` | gpt-4, gpt-3.5-turbo |
| `anthropic` | claude-3-opus, claude-3-sonnet |
| `google` | gemini-pro |
| `azure` | gpt-4 (Azure OpenAI) |
| `custom` | Custom models |

---

## Tool Types

| Type | Description |
|------|-------------|
| `mcp` | Model Context Protocol server |
| `http` | HTTP-based tool |
| `custom` | Custom tool implementation |

---

## See Also

- [Complete Documentation](../docs/openapi-extensions.md)
- [Examples](../examples/openapi-extensions/)
- [OSSA Specification](../spec/v0.2.2/OSSA-SPECIFICATION-v0.2.2.md)

