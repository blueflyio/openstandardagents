# An OpenAPI for AI Agents

Thomas Scola | Bluefly.io | December 2024

## Abstract

The [Open Standard for Software Agents](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-openapi) establishes a vendor-neutral, enterprise-grade specification for AI agent definition and orchestration. OSSA adds transport contracts, deterministic state semantics, security scopes, and compliance tagging, closing the gap left by proprietary runtimes and aligning with emerging industry governance requirements.

## The Problem

Google ADK, OpenAI Agents, Anthropic MCP, and Microsoft AutoGen each define incompatible agent formats, producing the same fragmentation that plagued early REST ecosystems. Without a common spec, agents remain vendor-locked silos. OSSA applies the same unification OpenAPI brought to APIs: one standardized manifest, many runtimes.

## What OSSA Solves

OSSA provides a declarative agent manifest that runs across 17+ frameworks without translation drift:

```yaml
apiVersion: ossa/v0.2.8
kind: Agent

metadata:
  name: research-assistant

spec:
  role: Research assistant with memory and streaming.
  
  llm:
    provider: google
    model: gemini-2.0-flash-exp
  
  state:
    mode: session
    storage:
      type: vector-db
      retention: 30d
  
  tools:
    - name: search-api
      transport:
        protocol: http
        streaming: response
      scopes: [read:search]
      compliance_tags: [gdpr]

extensions:
  google_adk: { enabled: true }
  openai_agents: { enabled: true }
  mcp: { enabled: true }
```

Same manifest, different runtimes, zero rewrites.

## Core Features

### Transport Metadata

Protocol-agnostic interfaces with first-class support for HTTP, gRPC, WebSocket, MCP, and A2A. Ensures verifiable, contract-driven communication.

### State Management

Formalized modes - stateless, session, long_running - mapped to ADK sessions, OpenAI memory, and AutoGen checkpoints with deterministic retention rules.

### Security Scopes

OAuth-style granular permissions for tool invocation, enabling least-privilege in multi-agent systems.

### Compliance Tags

Native labeling for regulated workloads: HIPAA, GDPR, FedRAMP, SOC2, enabling automated governance workflows.

### Capability Versioning

Independent versioning with structured deprecation, ensuring agents evolve without breaking orchestration.

### Google ADK Extension

First-class integration with ADK semantics: session routing, Vertex memory, and ADK agent types.

## Framework Support

OSSA 0.2.8 provides maintained extensions for: Google ADK, OpenAI Agents, MCP, LangChain, CrewAI, AutoGen, LangGraph, LlamaIndex, Cursor, Vercel AI SDK, and others.

See [Ecosystem Overview](https://openstandardagents.org/docs/ecosystem/overview?utm_source=medium&utm_medium=article&utm_campaign=ossa-openapi) and [Framework Support](https://openstandardagents.org/docs/ecosystem/framework-support?utm_source=medium&utm_medium=article&utm_campaign=ossa-openapi).

## Progressive Compliance

Three adoption tiers:

**Core** - registration, capabilities, request/response.

**Governed** - audit logging, scopes, compliance metadata.

**Advanced** - distributed state, multi-agent orchestration, cross-framework workflows.

## OSSA vs Alternatives

**ADK** - a runtime, not a standard. OSSA provides the spec ADK implementations conform to.

**MCP** - standardized tool protocols; OSSA standardizes full agent definition and orchestration.

**A2A** - a transport for agent-to-agent messaging; OSSA defines the agent itself.

## Getting Started

```bash
ossa validate agent.yaml
ossa generate --target langchain agent.yaml
ossa deploy --runtime kubernetes agent.yaml
```

See [Quick Start Guide](https://openstandardagents.org/docs/getting-started/5-minute-overview?utm_source=medium&utm_medium=article&utm_campaign=ossa-openapi) and [CLI Reference](https://openstandardagents.org/docs/cli-reference?utm_source=medium&utm_medium=article&utm_campaign=ossa-openapi).

## Roadmap

v0.3.0 (GA): Composable agents, distributed memory, cross-agent workflows.

Contributions welcome under Apache 2.0. Learn more at [openstandardagents.org](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-openapi).

