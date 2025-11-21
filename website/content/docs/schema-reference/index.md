---
title: "Schema Reference"
description: "Complete reference documentation for the OSSA v0.2.x Agent Manifest Schema"
weight: 50
---

# OSSA Schema Reference

Complete reference documentation for the Open Standard for Scalable Agents (OSSA) v0.2.x schema.

The OSSA schema provides a declarative, framework-agnostic way to define AI agents with full portability across platforms and orchestration frameworks.

## Schema Overview

The OSSA manifest is a JSON/YAML document that defines:

- **Agent metadata** - Name, version, labels, and annotations
- **Agent specification** - Role, LLM configuration, tools, and capabilities
- **State management** - Stateless, session, and long-running agent modes with storage backends
- **Transport metadata** - Protocol-specific configuration for streaming and communication
- **Security & compliance** - OAuth2-like scopes and compliance tags (HIPAA, GDPR, FedRAMP, etc.)
- **Autonomy settings** - Decision-making level and approval requirements
- **Constraints** - Cost, performance, and resource limits
- **Observability** - Tracing, metrics, and logging configuration
- **Framework extensions** - Integration with kagent, BuildKit, Drupal, LibreChat, Google ADK, Microsoft AF, and 14+ other frameworks

## Schema Version

```yaml
apiVersion: ossa/v0.2.4
```

The current stable version is `ossa/v0.2.4`. Previous versions (v0.2.2, v0.2.3) remain supported. The schema also supports `ossa/v1` for forward compatibility.

## Schema Components

### Core Objects

- [**OSSA Manifest**](./ossa-manifest.md) - Root manifest object with metadata and spec
- [**Agent Spec**](./agent-spec.md) - Agent specification including role, LLM, and tools
- [**LLM Configuration**](./llm-config.md) - Language model provider and parameters
- [**Tools**](./tools.md) - Tool definitions for MCP, Kubernetes, HTTP, and custom integrations

### Configuration Objects

- [**Taxonomy**](./taxonomy.md) - Agent domain, subdomain, and capability classification
- [**State Management**](./state.md) - Agent state modes, storage backends, and context window strategies
- [**Transport**](./transport.md) - Protocol configuration, streaming modes, and binding paths
- [**Security**](./security.md) - OAuth2 scopes, compliance tags, and per-capability permissions
- [**Autonomy**](./autonomy.md) - Decision-making level and action controls
- [**Constraints**](./constraints.md) - Cost, performance, and resource constraints
- [**Observability**](./observability.md) - Tracing, metrics, and logging

### Framework Extensions

- [**kagent Extension**](./extensions/kagent.md) - Kubernetes-native agent deployment
- [**BuildKit Extension**](./extensions/buildkit.md) - Agent BuildKit orchestration
- [**Drupal Extension**](./extensions/drupal.md) - Drupal LLM Platform integration
- [**LibreChat Extension**](./extensions/librechat.md) - LibreChat integration
- [**MCP Extension**](./extensions/mcp.md) - Model Context Protocol servers
- [**LangChain Extension**](./extensions/langchain.md) - LangChain framework
- [**CrewAI Extension**](./extensions/crewai.md) - CrewAI multi-agent framework
- [**OpenAI Agents Extension**](./extensions/openai-agents.md) - OpenAI Agents SDK
- [**Cursor Extension**](./extensions/cursor.md) - Cursor IDE integration
- [**Langflow Extension**](./extensions/langflow.md) - Langflow workflow orchestration
- [**AutoGen Extension**](./extensions/autogen.md) - Microsoft AutoGen
- [**Vercel AI Extension**](./extensions/vercel-ai.md) - Vercel AI SDK
- [**LlamaIndex Extension**](./extensions/llamaindex.md) - LlamaIndex RAG framework
- [**LangGraph Extension**](./extensions/langgraph.md) - LangGraph state machines
- [**Anthropic Extension**](./extensions/anthropic.md) - Anthropic Claude API
- [**Google ADK Extension**](./extensions/google-adk.md) - Google Agent Development Kit integration

## Quick Example

```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: code-reviewer
  version: 1.0.0
  description: Automated code review agent
  labels:
    domain: development
    capability: code-review
spec:
  taxonomy:
    domain: development
    subdomain: quality-assurance
    capability: code-review
  role: |
    You are a code review specialist. Analyze code for:
    - Security vulnerabilities
    - Performance issues
    - Best practices adherence
    - Code quality and maintainability
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.3
    maxTokens: 4096
  tools:
    - type: mcp
      server: filesystem
      capabilities:
        - read_file
        - list_directory
    - type: mcp
      server: git
      capabilities:
        - git_diff
        - git_log
  autonomy:
    level: supervised
    approval_required: false
    allowed_actions:
      - read_code
      - analyze_security
      - generate_report
  constraints:
    cost:
      maxTokensPerDay: 1000000
      maxCostPerDay: 50.0
      currency: USD
    performance:
      maxLatencySeconds: 30
      timeoutSeconds: 120
  observability:
    tracing:
      enabled: true
      exporter: otlp
    metrics:
      enabled: true
      exporter: prometheus
    logging:
      level: info
      format: json
```

## Validation

All OSSA manifests must conform to the JSON Schema:

```
https://openstandardagents.org/schemas/v0.2.x/agent.json
```

Use the schema for validation in your tools and editors:

**VSCode/Cursor:**
```json
{
  "$schema": "https://openstandardagents.org/schemas/v0.2.x/agent.json"
}
```

**Command-line validation:**
```bash
ossa validate manifest.json
```

## Framework Compatibility

The OSSA schema is designed for framework-agnostic portability. The same manifest can be deployed to:

- **kagent.dev** - Kubernetes-native agent platform
- **Agent BuildKit** - Multi-runtime orchestration
- **Drupal LLM Platform** - Drupal-based agent management
- **LibreChat** - Open-source chat interface
- **LangChain, CrewAI, AutoGen** - Python agent frameworks
- **OpenAI Agents SDK** - Official OpenAI agent runtime
- **Cursor, Continue** - IDE-integrated coding agents
- **Vercel AI SDK** - Edge/Node.js deployment
- **LlamaIndex, LangGraph** - RAG and state machine frameworks

See the [Extensions](./extensions/) section for framework-specific configuration.

## Additional Resources

- [OSSA Specification](/docs/)
- [Getting Started Guide](/docs/getting-started/)
- [Examples](/docs/examples/)
- [GitHub Repository](https://github.com/blueflyio/openstandardagents)
- [Schema Download](https://openstandardagents.org/schemas/v0.2.x/agent.json)
