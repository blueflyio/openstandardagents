# OSSA - Open Standard for Scalable AI Agents

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm version](https://img.shields.io/npm/v/@bluefly/openstandardagents)](https://www.npmjs.com/package/@bluefly/openstandardagents)
[![GitHub](https://img.shields.io/badge/GitHub-OSSA-black.svg)](https://github.com/blueflyio/openstandardagents)

**Vendor-neutral, compliance-ready, enterprise-grade**

- Switch between AI providers without code changes
- Built-in compliance and security frameworks
- Standardized agent lifecycle and governance
- Multi-runtime support (Node.js, Python, Drupal, Symfony)

---

## What is OSSA?

**Open Standard Agents (OSSA)** is an open, vendor-neutral specification for defining AI agents. OSSA provides a declarative YAML/JSON schema for agent manifests, analogous to how OpenAPI standardizes REST API definitions or how Kubernetes manifests define container orchestration.

### Technical Overview

OSSA defines three resource kinds:

- **Agent**: Agentic loops with LLM inference, tool execution, and state management
- **Task**: Deterministic workflow steps for batch processing, data transformation, and system integration
- **Workflow**: Composition of Tasks and Agents with control flow (parallel, conditional, loop)

Each manifest declares:
- Metadata (name, version, namespace, labels)
- Specification (role, capabilities, tools, execution parameters)
- Extensions (framework-specific bindings for MCP, Drupal, Cursor, agents.md)
- Runtime bindings (capability-to-implementation mappings)

### OSSA is NOT a Framework

OSSA is a **specification standard** that defines the contract for agent definition, deployment, and management. Just like OpenAPI does not implement APIs, OSSA does not implement agents. It provides the standard that implementations follow.

### Design Principles

**Portability**
Define agents once, deploy anywhere. Switch between LLM providers (OpenAI, Anthropic, Azure, Ollama) without modifying agent logic. Runtime bindings abstract capability implementations from agent definitions.

**Interoperability**
JSON Schema validation ensures manifest correctness. Typed interfaces enable code generation for TypeScript, Python, and other languages. Extension points allow framework-specific customization without breaking core compatibility.

**Compliance**
Built-in support for enterprise governance requirements including SOC2, FedRAMP, HIPAA, and GDPR. Standardized audit trails, data boundary controls, and security models are first-class schema properties.

**Observability**
Native OpenTelemetry integration for distributed tracing across agent invocations. Structured logging, metrics emission, and performance monitoring are defined at the specification level.

---

## Get Started

### Install CLI

```bash
npm install -g @bluefly/openstandardagents
```

### Create Agent

```bash
ossa init my-agent
cd my-agent
```

### Validate

```bash
ossa validate my-agent.ossa.yaml
```

### Run

```bash
export OPENAI_API_KEY=sk-your-key-here
ossa run my-agent.ossa.yaml
```

### Export to Framework

```bash
ossa export --to cursor
ossa export --to langchain
ossa export --to crewai
```

[Full Getting Started Guide](https://openstandardagents.org/docs/getting-started/)

---

## Manifest Example

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: my-agent
  version: "1.0.0"
  description: Example OSSA agent

spec:
  role: |
    You are a helpful assistant that answers questions.

  llm:
    provider: openai
    model: gpt-4

  tools:
    - type: function
      name: get_weather
      capabilities:
        - name: get_current_weather
          description: Get current weather for a location
          input_schema:
            type: object
            properties:
              location:
                type: string
            required: [location]
```

---

## Schema Architecture

### Resource Kinds

| Kind | Purpose | LLM Required |
|------|---------|--------------|
| Agent | Agentic loops with inference and tool execution | Yes |
| Task | Deterministic batch processing and data transformation | No |
| Workflow | Composition with control flow (parallel, conditional, loop) | Optional |

### Core Components

**Metadata**: Resource identification, versioning, and labeling following Kubernetes conventions.

**Spec**: Kind-specific configuration including role definitions, tool bindings, execution parameters, and state management.

**Extensions**: Framework-specific bindings that extend core functionality without breaking interoperability.

**Runtime**: Capability-to-implementation mappings that enable the same manifest to execute across different platforms.

---

## Extensions

OSSA supports framework-specific extensions:

### Agent-to-Agent Messaging

Channel-based pub/sub messaging with reliability guarantees:

```yaml
spec:
  messaging:
    publishes:
      - channel: agent.task.completed
        schema: { type: object }
    subscribes:
      - channel: agent.task.started
        handler: on_task_started
    reliability:
      deliveryGuarantee: at-least-once
      retry:
        maxAttempts: 3
        backoff:
          strategy: exponential
```

### Drupal Extension

Runtime bindings for Drupal 10+ with Symfony Messenger integration:

```yaml
extensions:
  drupal:
    module: ai_agents
    service: ai_agents.executor
    permissions:
      entity_permissions: [create content]
      execution_user: agent_service_account
    messenger:
      transport: redis
      retry_strategy:
        max_retries: 3
```

### OpenAI agents.md

Bidirectional conversion with OpenAI agents.md format:

```yaml
extensions:
  agents_md:
    enabled: true
    sync:
      direction: bidirectional
      include_comments: true
```

---

## Integrations

**LLM Providers**: OpenAI, Anthropic, Google Gemini, Azure OpenAI, Ollama

**Frameworks**: LangChain, CrewAI, AutoGen, LlamaIndex, LangGraph, Langflow

**Platforms**: Kubernetes, Docker, AWS, Azure, GCP

**Tools**: MCP, Drupal, LibreChat, Cursor, VS Code

**Extensions**: agents.md (OpenAI), Cursor IDE, MCP Servers, KAgent, Drupal

[View All Integrations](https://openstandardagents.org/docs/ecosystem/framework-support/)

---

## Examples

### Framework Integration

- [OpenAI](https://github.com/blueflyio/openstandardagents/tree/main/examples/openai)
- [Anthropic](https://github.com/blueflyio/openstandardagents/tree/main/examples/anthropic)
- [LangChain](https://github.com/blueflyio/openstandardagents/tree/main/examples/langchain)
- [CrewAI](https://github.com/blueflyio/openstandardagents/tree/main/examples/crewai)
- [AutoGen](https://github.com/blueflyio/openstandardagents/tree/main/examples/autogen)
- [Cursor](https://github.com/blueflyio/openstandardagents/tree/main/examples/cursor)

### Production Deployment

[GitLab Kubernetes Agents](https://github.com/blueflyio/openstandardagents/tree/main/.gitlab/agents) - 8 specialized agents for production Kubernetes deployments including security scanning, performance monitoring, and compliance validation.

[View All Examples](https://openstandardagents.org/examples/)

---

## Documentation

- [Getting Started](https://openstandardagents.org/docs/getting-started/)
- [Full Documentation](https://openstandardagents.org/docs/)
- [Schema Reference](https://openstandardagents.org/schema/)
- [Specification](https://github.com/blueflyio/openstandardagents/blob/main/spec/v0.3.0/ossa-0.3.0.schema.json)
- [Examples](https://openstandardagents.org/examples/)

---

## Comparison

| Feature | OSSA | LangChain | AutoGen | MCP | Semantic Kernel |
|---------|------|-----------|---------|-----|-----------------|
| Vendor Neutral | Yes | No | No | Yes | No |
| Formal Standard | Yes | No | No | Yes | No |
| Multi-runtime | Yes | Partial | Partial | Yes | Partial |
| Enterprise Governance | Yes | No | No | No | Partial |
| Compliance Ready | Yes | No | No | No | No |
| Open Source | Yes | Yes | Yes | Yes | Yes |

**OSSA**: Vendor-neutral specification standard
**LangChain/AutoGen/Semantic Kernel**: Framework-specific implementations
**MCP**: Formal standard focused on context protocol, not full agent lifecycle

---

## Contributing

OSSA is an open-source, community-driven project.

1. Fork the repository on [GitHub](https://github.com/blueflyio/openstandardagents)
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

Apache 2.0 - see [LICENSE](https://github.com/blueflyio/openstandardagents/blob/main/LICENSE)

---

## Links

- **GitLab**: [gitlab.com/blueflyio/openstandardagents](https://gitlab.com/blueflyio/openstandardagents) (Primary Development)
- **GitHub**: [github.com/blueflyio/openstandardagents](https://github.com/blueflyio/openstandardagents) (Mirror)
- **npm**: [@bluefly/openstandardagents](https://www.npmjs.com/package/@bluefly/openstandardagents)
- **Website**: [openstandardagents.org](https://openstandardagents.org)
- **Discord**: [Join Community](https://discord.gg/ossa)

Note: GitHub is a read-only mirror. All development happens on GitLab.
