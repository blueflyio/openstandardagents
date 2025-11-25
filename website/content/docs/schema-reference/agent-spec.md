---
title: "Agent Spec"
description: "Agent specification object defining behavior and capabilities"
weight: 2
---

# Agent Spec Object

The `spec` object defines the agent's behavior, capabilities, configuration, and operational parameters.

## Field Reference

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `taxonomy` | [Taxonomy](./taxonomy.md) | No | Agent classification by domain, subdomain, and capability |
| `role` | string | **Yes** | Agent role/system prompt describing behavior and capabilities. Minimum 1 character |
| `llm` | [LLMConfig](./llm-config.md) | No | Language model provider and configuration parameters |
| `tools` | array[[Tool](./tools.md)] | No | Available tools and capabilities for the agent |
| `autonomy` | [Autonomy](./autonomy.md) | No | Autonomy level and action control settings |
| `constraints` | [Constraints](./constraints.md) | No | Cost, performance, and resource constraints |
| `observability` | [Observability](./observability.md) | No | Tracing, metrics, and logging configuration |

## Basic Example

```yaml
spec:
  role: |
    You are a helpful customer support agent.
    Answer customer questions professionally and accurately.
```

## Complete Example

```yaml
spec:
  taxonomy:
    domain: customer-service
    subdomain: technical-support
    capability: troubleshooting

  role: |
    You are a technical support specialist for SaaS products.

    Your responsibilities:
    - Diagnose technical issues from customer descriptions
    - Provide step-by-step troubleshooting guidance
    - Escalate complex issues to engineering when needed
    - Document solutions in the knowledge base

    Communication style:
    - Professional and empathetic
    - Clear and concise technical explanations
    - Patient with non-technical users
    - Proactive in suggesting preventive measures

  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.3
    maxTokens: 4096

  tools:
    - type: mcp
      server: crm
      capabilities:
        - search_tickets
        - create_ticket
        - update_ticket
    - type: mcp
      server: knowledge-base
      capabilities:
        - search_articles
        - create_article
    - type: http
      endpoint: https://api.example.com/diagnostics
      auth:
        type: bearer
        credentials: SECRET_REF_DIAGNOSTICS_API
      capabilities:
        - run_health_check
        - get_system_status

  autonomy:
    level: supervised
    approval_required: false
    allowed_actions:
      - search_knowledge_base
      - create_ticket
      - update_ticket
      - run_diagnostics
    blocked_actions:
      - delete_data
      - access_production_db
      - modify_user_accounts

  constraints:
    cost:
      maxTokensPerDay: 1000000
      maxCostPerDay: 50.0
      currency: USD
    performance:
      maxLatencySeconds: 10
      maxConcurrentRequests: 100
      timeoutSeconds: 60
    resources:
      cpu: "1"
      memory: 2Gi

  observability:
    tracing:
      enabled: true
      exporter: otlp
      endpoint: https://traces.example.com
    metrics:
      enabled: true
      exporter: prometheus
    logging:
      level: info
      format: json
```

## Role Field Guidelines

The `role` field is the most important part of the agent specification. It defines the agent's behavior through a system prompt.

### Best Practices

**Be specific about responsibilities:**
```yaml
role: |
  You are a code reviewer specializing in Python security.

  Review code for:
  - SQL injection vulnerabilities
  - XSS attack vectors
  - Authentication/authorization issues
  - Secrets in code
  - Dependency vulnerabilities
```

**Define communication style:**
```yaml
role: |
  You are a documentation writer.

  Writing style:
  - Clear and concise
  - Active voice
  - Examples for every feature
  - Beginner-friendly explanations
  - Professional tone
```

**Set boundaries:**
```yaml
role: |
  You are a data analyst assistant.

  You CAN:
  - Query databases for analysis
  - Generate visualizations
  - Explain statistical concepts
  - Recommend analytical approaches

  You CANNOT:
  - Modify production data
  - Grant database access
  - Make business decisions
  - Share sensitive customer data
```

**Include domain knowledge:**
```yaml
role: |
  You are a Kubernetes troubleshooting expert.

  Expertise areas:
  - Pod scheduling and resource constraints
  - Network policies and service mesh
  - Volume and storage issues
  - RBAC and security contexts
  - Custom resource definitions

  Always ask for kubectl output before making recommendations.
```

### Anti-Patterns

**Too vague:**
```yaml
# ❌ Bad
role: "You are a helpful assistant."

# ✅ Good
role: |
  You are a customer onboarding specialist who helps new users
  set up their accounts, configure integrations, and learn core features.
```

**Too rigid:**
```yaml
# ❌ Bad - too prescriptive
role: |
  Step 1: Always greet the user
  Step 2: Ask for their problem
  Step 3: Provide exactly 3 solutions
  Step 4: Say goodbye

# ✅ Good - provides guidance with flexibility
role: |
  You are a friendly problem solver. Greet users warmly, understand
  their needs, and provide practical solutions. Adapt your approach
  based on user expertise level.
```

**Conflicting instructions:**
```yaml
# ❌ Bad
role: |
  Be extremely concise. Always provide detailed explanations.
  Never use technical jargon. Use industry-standard terminology.

# ✅ Good
role: |
  Provide clear explanations appropriate for the user's expertise.
  Start with simple terms, then introduce technical terminology with definitions.
```

## Taxonomy

The optional `taxonomy` field classifies the agent by domain, subdomain, and capability. This enables:

- **Discovery** - Find agents by functional area
- **Organization** - Group related agents
- **Routing** - Direct requests to specialized agents
- **Analytics** - Track agent usage by category

See [Taxonomy Reference](./taxonomy.md) for details.

```yaml
spec:
  taxonomy:
    domain: infrastructure
    subdomain: kubernetes
    capability: troubleshooting
```

## LLM Configuration

The optional `llm` field configures the language model provider and parameters. If omitted, the deployment platform chooses defaults.

See [LLM Configuration Reference](./llm-config.md) for details.

```yaml
spec:
  llm:
    provider: openai
    model: gpt-4o
    temperature: 0.7
    maxTokens: 2048
```

## Tools

The optional `tools` array defines capabilities available to the agent. Tools can be:

- **MCP servers** - Model Context Protocol integrations
- **Kubernetes resources** - Direct K8s API access
- **HTTP APIs** - REST/GraphQL endpoints
- **gRPC services** - gRPC endpoints
- **Custom functions** - Platform-specific functions

See [Tools Reference](./tools.md) for details.

```yaml
spec:
  tools:
    - type: mcp
      server: filesystem
      capabilities:
        - read_file
        - write_file
    - type: http
      endpoint: https://api.github.com
      auth:
        type: bearer
        credentials: SECRET_REF_GITHUB_TOKEN
```

## Autonomy

The optional `autonomy` field controls decision-making level and action permissions.

See [Autonomy Reference](./autonomy.md) for details.

```yaml
spec:
  autonomy:
    level: autonomous
    approval_required: false
    allowed_actions:
      - read_data
      - analyze
      - generate_report
    blocked_actions:
      - delete_data
      - modify_schema
```

## Constraints

The optional `constraints` field sets limits on cost, performance, and resources.

See [Constraints Reference](./constraints.md) for details.

```yaml
spec:
  constraints:
    cost:
      maxTokensPerDay: 1000000
      maxCostPerDay: 25.0
      currency: USD
    performance:
      maxLatencySeconds: 5
      timeoutSeconds: 30
```

## Observability

The optional `observability` field configures tracing, metrics, and logging.

See [Observability Reference](./observability.md) for details.

```yaml
spec:
  observability:
    tracing:
      enabled: true
      exporter: jaeger
    metrics:
      enabled: true
      exporter: prometheus
    logging:
      level: debug
      format: json
```

## Minimal Example

The only required field in `spec` is `role`:

```yaml
apiVersion: ossa/v0.2.x
kind: Agent
metadata:
  name: simple-agent
spec:
  role: You are a helpful assistant that answers questions concisely.
```

## Multi-line Role Example

Use YAML block scalars for complex role definitions:

```yaml
spec:
  role: |
    You are an expert DevOps engineer specializing in CI/CD pipelines.

    Core competencies:
    - GitHub Actions workflow optimization
    - Docker multi-stage build strategies
    - Kubernetes deployment manifests
    - Terraform infrastructure as code
    - Secret management and security scanning

    When analyzing pipelines:
    1. Identify security vulnerabilities
    2. Suggest performance optimizations
    3. Recommend best practices
    4. Provide working code examples

    Always explain the reasoning behind your recommendations.
```

## Related Objects

- [Taxonomy](./taxonomy.md) - Agent classification
- [LLM Configuration](./llm-config.md) - Language model settings
- [Tools](./tools.md) - Available capabilities
- [Autonomy](./autonomy.md) - Decision-making controls
- [Constraints](./constraints.md) - Operational limits
- [Observability](./observability.md) - Monitoring configuration
- [OSSA Manifest](./ossa-manifest.md) - Root object

## Validation

The `spec` object is validated against the JSON Schema:
```
https://openstandardagents.org/schemas/v0.2.x/agent.json#/definitions/AgentSpec
```

Required fields:
- `role` must be a non-empty string

All other fields are optional and validated according to their respective schemas.
