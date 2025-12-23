<div align="center">

```
   ___  ____ ____    _
  / _ \/ ___/ ___|  / \
 | | | \___ \___ \ / _ \
 | |_| |___) |__) / ___ \
  \___/|____/____/_/   \_\
```

# Open Standard for Scalable AI Agents

### **The OpenAPI of AI Agents**

*Define once, deploy anywhere. A vendor-neutral specification for portable, composable, and compliant AI agents.*

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm version](https://img.shields.io/npm/v/@bluefly/openstandardagents)](https://www.npmjs.com/package/@bluefly/openstandardagents)
[![CI Status](https://img.shields.io/badge/CI-passing-brightgreen.svg)](https://gitlab.com/blueflyio/openstandardagents/-/pipelines)
[![npm downloads](https://img.shields.io/npm/dm/@bluefly/openstandardagents)](https://www.npmjs.com/package/@bluefly/openstandardagents)

[**Quick Start**](#quick-start-under-60-seconds) • [**Documentation**](https://openstandardagents.org/docs/) • [**Examples**](https://openstandardagents.org/examples/) • [**Community**](#community)

</div>

---

## Why OSSA?

### 🔄 Portability
**One manifest, any provider**

Switch between OpenAI, Anthropic, Azure, or Ollama without changing a single line of code. Runtime bindings abstract implementation from definition.

### 🧩 Composability
**Build workflows from agents**

Compose agents into workflows with parallel execution, conditional branching, and loop control. Orchestrate complex multi-agent systems declaratively.

### 🛡️ Safety
**Built-in guardrails**

Enterprise-grade compliance out of the box. SOC2, FedRAMP, HIPAA, and GDPR controls are first-class schema properties, not afterthoughts.

### 📊 Observability
**Full visibility**

Native OpenTelemetry tracing, structured logging, cost tracking, and performance metrics. Know exactly what your agents are doing and what they cost.


---

## Quick Start (Under 60 Seconds)

### One-Command Quickstart

```bash
# macOS/Linux
curl -fsSL https://ossa.dev/quickstart.sh | bash

# Or with npx (works everywhere)
npx @bluefly/ossa-cli quickstart

# Windows PowerShell
iwr -useb https://ossa.dev/quickstart.ps1 | iex
```

### Manual Setup

```bash
# Install the CLI
npm install -g @bluefly/ossa-cli

# Create your first agent
ossa init my-agent --type agent
cd my-agent

# Validate the manifest
ossa validate agent.ossa.yaml

# Run it
export ANTHROPIC_API_KEY=sk-ant-...
ossa run agent.ossa.yaml --interactive
```

That's it. You now have a working AI agent defined in a portable, standard format.

[**→ Full Getting Started Guide**](https://openstandardagents.org/docs/getting-started/)

---

## What is OSSA?

**OSSA** (Open Standard for Scalable AI Agents) is a **specification standard** for defining AI agents in a vendor-neutral, portable format—like OpenAPI for REST APIs or Kubernetes manifests for containers.

OSSA is **NOT** a framework. It's a standard that frameworks implement.

### The Three Kinds

OSSA defines three resource types:

#### Agent
**LLM-powered agentic loops**

Agents use LLMs to reason, plan, and execute tools. They handle inference, state management, and autonomous decision-making.

```yaml
kind: Agent
spec:
  llm:
    provider: openai
    model: gpt-4
  role: |
    You are a helpful assistant
```

#### Task
**Deterministic operations**

Tasks are pure functions—no LLM required. Use them for data transformation, API calls, batch processing, or system integration.

```yaml
kind: Task
spec:
  type: function
  runtime:
    language: typescript
    entry: transform.ts
```

#### Workflow
**Orchestrated compositions**

Workflows compose Agents and Tasks into multi-step pipelines with parallel execution, conditionals, and loops.

```yaml
kind: Workflow
spec:
  steps:
    - agent: analyzer
    - parallel:
        - task: transform
        - task: validate
```

---

## Example: A Complete Enterprise Agent (v0.3.0)

This agent demonstrates OSSA's full power—**portable across providers, compliant out of the box, and production-ready**:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: compliance-auditor
  version: "1.0.0"
  description: Enterprise compliance auditor with multi-provider support
  labels:
    category: compliance
    domain: enterprise/governance
  annotations:
    ossa.io/maintainer: security-team@company.com
    ossa.io/cost-center: CC-1234

# NEW v0.3.0: Identity for OpenTelemetry + service mesh
identity:
  service_name: compliance-auditor
  service_namespace: agents.compliance
  service_version: "1.0.0"

spec:
  role: |
    You are a compliance auditor. Analyze documents for regulatory violations,
    generate audit reports, and notify stakeholders of findings.

  # Provider-agnostic LLM config - switch providers without code changes
  llm:
    provider: anthropic          # Change to: openai, azure, bedrock, ollama
    model: claude-3-5-sonnet-20241022
    temperature: 0.3
    fallback:
      provider: openai
      model: gpt-4-turbo-preview

  tools:
    - type: mcp
      server: filesystem
      capabilities: [read_file, list_directory]
    - type: function
      name: generate_report
      capabilities:
        - name: create_audit_report
          description: Generate compliance audit report
          input_schema:
            type: object
            properties:
              findings: { type: array, items: { type: object } }
              severity: { type: string, enum: [low, medium, high, critical] }
            required: [findings, severity]

  # NEW v0.3.0: Agent-to-Agent messaging
  messaging:
    publishes:
      - channel: audit.findings
        schema: { type: object, properties: { severity: { type: string } } }
    subscribes:
      - channel: documents.uploaded
        handler: on_document_received
    reliability:
      deliveryGuarantee: at-least-once
      ordering: strict

  # NEW v0.3.0: Persistent state with encryption
  state:
    storage:
      type: redis
      connection: ${REDIS_URL}
    encryption:
      enabled: true
      algorithm: AES-256-GCM
    ttl: 86400

  # Enterprise-grade safety controls
  safety:
    content_filtering:
      block_pii: true
      block_credentials: true
      allowed_domains: ["company.com", "*.internal.company.com"]
    rate_limiting:
      requests_per_minute: 100
      tokens_per_hour: 500000
    input_validation:
      max_length: 50000
    output_validation:
      max_length: 100000
      require_structured: true

  # NEW v0.3.0: Compliance profiles
  compliance:
    frameworks: [SOC2, HIPAA, GDPR]
    data_residency: us-east-1
    audit_logging: required
    pii_handling: encrypt_at_rest

  # Full observability stack
  observability:
    tracing:
      enabled: true
      provider: opentelemetry
      sampling_rate: 1.0
      export_endpoint: ${OTEL_EXPORTER_OTLP_ENDPOINT}
    logging:
      level: info
      structured: true
      redact_pii: true
    metrics:
      track_costs: true
      track_latency: true
      track_tokens: true
      export_endpoint: ${PROMETHEUS_PUSHGATEWAY}
    activity_stream:
      enabled: true
      destination: kafka://events.internal

  # NEW v0.3.0: Lifecycle management
  lifecycle:
    environments:
      development:
        llm: { provider: ollama, model: llama3.2 }
      staging:
        llm: { provider: openai, model: gpt-4o-mini }
      production:
        llm: { provider: anthropic, model: claude-3-5-sonnet-20241022 }
    dependencies:
      - name: document-processor
        version: ">=2.0.0"
```

**What this demonstrates:**
- **Portability**: Same agent runs on Anthropic, OpenAI, Azure, or local Ollama
- **A2A Messaging**: Pub/sub communication with other agents
- **Enterprise Compliance**: SOC2/HIPAA/GDPR built into the manifest
- **Environment Configs**: Dev/staging/prod with different providers
- **Full Observability**: OpenTelemetry traces, Prometheus metrics, audit logs

```bash
ossa validate compliance-auditor.ossa.yaml
ossa run compliance-auditor.ossa.yaml --env production
```

[**→ See More Examples**](https://openstandardagents.org/examples/)

---

## Features

### 🌐 20+ LLM Providers

Switch providers without changing your agent definition:

- **OpenAI** (GPT-4, GPT-3.5)
- **Anthropic** (Claude 3.5, Claude 3)
- **Google** (Gemini Pro, Gemini Ultra)
- **Azure OpenAI**
- **AWS Bedrock**
- **Ollama** (local models)
- **Mistral AI**
- **Cohere**
- And more...

### 🛠️ MCP Tool Support

Native integration with [Model Context Protocol](https://modelcontextprotocol.io/) for standardized tool definitions:

```yaml
tools:
  - type: mcp
    server: filesystem
    capabilities:
      - read_file
      - write_file
      - list_directory
```

### 💬 Agent-to-Agent Messaging

Built-in pub/sub messaging for multi-agent coordination:

```yaml
spec:
  messaging:
    publishes:
      - channel: task.completed
    subscribes:
      - channel: task.started
        handler: on_task_started
    reliability:
      deliveryGuarantee: at-least-once
```

### 🔒 Safety Controls

Enterprise-grade security and compliance:

- Input/output validation
- Content filtering
- Rate limiting
- Audit logging
- Data boundary controls
- PII detection and redaction

### 💰 Cost Tracking

Track costs across providers with unified metrics:

```yaml
observability:
  metrics:
    track_costs: true
    cost_alerts:
      - threshold: 10.00
        action: notify
```

---

## Installation

### npm

```bash
npm install -g @bluefly/openstandardagents
```

### yarn

```bash
yarn global add @bluefly/openstandardagents
```

### pnpm

```bash
pnpm add -g @bluefly/openstandardagents
```

### Homebrew (Coming Soon)

```bash
brew install ossa
```

### Docker

```bash
docker pull bluefly/ossa:latest
docker run -v $(pwd):/workspace bluefly/ossa validate agent.ossa.yaml
```

---

## Documentation

### Getting Started
- [Installation Guide](https://openstandardagents.org/docs/installation/)
- [Your First Agent](https://openstandardagents.org/docs/getting-started/first-agent/)
- [Core Concepts](https://openstandardagents.org/docs/concepts/)
- [CLI Reference](https://openstandardagents.org/docs/cli/)

### Examples & Guides
- [Example Gallery](https://openstandardagents.org/examples/)
- [Framework Integration](https://openstandardagents.org/docs/integrations/)
- [Production Deployment](https://openstandardagents.org/docs/deployment/)
- [Best Practices](https://openstandardagents.org/docs/best-practices/)

### Reference
- **Getting Started**: [openstandardagents.org/docs/getting-started/](https://openstandardagents.org/docs/getting-started/)
- **Full Documentation**: [openstandardagents.org/docs/](https://openstandardagents.org/docs/)
- **Schema Reference**: [openstandardagents.org/schema/](https://openstandardagents.org/schema/)
- **Specification**: [spec/v0.3.1/ossa-0.3.1.schema.json](https://github.com/blueflyio/openstandardagents/blob/main/spec/v0.3.1/ossa-0.3.1.schema.json)
- **Messaging Extension**: [spec/v0.3.1/messaging.md](spec/v0.3.1/messaging.md) - Agent-to-agent messaging (v0.3.0+)
- **Examples**: [openstandardagents.org/examples/](https://openstandardagents.org/examples/)
- **Blog**: [openstandardagents.org/blog/](https://openstandardagents.org/blog/)

**OSSA** is a vendor-neutral **specification standard** (like OpenAPI)
**LangChain/AutoGen/Semantic Kernel** are framework-specific **implementations**
**MCP** is a formal standard for **context protocol**, not full agent lifecycle

---

## License

**Apache License 2.0**

OSSA is open source and free to use for commercial and non-commercial purposes.

See [**LICENSE**](LICENSE) for full terms.

---

## Links

### Development
- **GitLab** (Primary): [gitlab.com/blueflyio/openstandardagents](https://gitlab.com/blueflyio/openstandardagents)
- **GitHub** (Mirror): [github.com/blueflyio/openstandardagents](https://github.com/blueflyio/openstandardagents)
- **npm Package**: [@bluefly/openstandardagents](https://www.npmjs.com/package/@bluefly/openstandardagents)

### Community
- **Website**: [openstandardagents.org](https://openstandardagents.org)
- **Documentation**: [openstandardagents.org/docs](https://openstandardagents.org/docs)
- **Discord**: [discord.gg/ossa](https://discord.gg/ossa)
- **Twitter/X**: [@openstandardagi](https://twitter.com/openstandardagi)

---

<div align="center">

**Built with ❤️ by the open source community**

[Report Bug](https://github.com/blueflyio/openstandardagents/issues) • [Request Feature](https://github.com/blueflyio/openstandardagents/issues) • [Ask Question](https://github.com/blueflyio/openstandardagents/discussions)

*Note: All development happens on GitLab. GitHub is a read-only mirror.*

</div>
