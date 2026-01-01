# OSSA - Open Standard for Scalable AI Agents

**The OpenAPI for AI Agents** - A specification standard for AI agent definition, deployment, and management

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm version](https://img.shields.io/npm/v/@bluefly/openstandardagents.svg)](https://www.npmjs.com/package/@bluefly/openstandardagents)
[![Specification](https://img.shields.io/badge/Spec-v0.3.2-blue)](https://gitlab.com/blueflyio/openstandardagents/-/blob/main/spec/v0.3.2/ossa-0.3.2.schema.json)

---

## Welcome to OSSA

**OSSA (Open Standard for Scalable AI Agents)** is a specification standard for defining AI agents, similar to how **OpenAPI** standardizes REST APIs. Just as OpenAPI enables API interoperability, OSSA enables agent interoperability across frameworks, runtimes, and organizations.

### Quick Navigation

#### Getting Started
- [5-Minute Overview](/docs/getting-started/5-minute-overview)
- [Installation Guide](/docs/getting-started/installation)
- [Hello World Tutorial](/docs/getting-started/hello-world)
- [First Agent Creation](/docs/getting-started/first-agent)

#### For Different Audiences
- [Students & Researchers](/docs/for-audiences/students-researchers)
- [Developers](/docs/for-audiences/developers)
- [Architects & Platform Engineers](/docs/for-audiences/architects)
- [Enterprises](/docs/for-audiences/enterprises)

#### Technical Documentation
- [Specification](/docs/specification)
- [Schema Reference](/docs/schema-reference)
- [LLM Configuration](/docs/schema-reference/llm-config) - NEW in v0.3.2
- [OpenAPI Extensions](/docs/openapi-extensions)

#### Examples & Patterns
- [Migration Guides](/docs/migration-guides/langchain-to-ossa)
- [Ecosystem Overview](/docs/ecosystem/overview)
- [Framework Support](/docs/ecosystem/framework-support)

#### Ecosystem
- [Ecosystem Overview](/docs/ecosystem/overview)
- [Framework Support](/docs/ecosystem/framework-support)

---

## What is OSSA?

OSSA is a **specification standard** for defining AI agents, similar to how OpenAPI standardizes REST APIs.

**OSSA is NOT a framework** - it's a standard that defines the contract. Implementations provide the functionality.

### Agents as First-Class Citizens

OSSA embodies the philosophy of treating AI agents as **first-class citizens** in software development. Just as functions, classes, and APIs are fundamental building blocks in modern programming, OSSA agents are standardized, reusable components that can be discovered, composed, and deployed like any other software artifact.

This approach aligns with emerging industry research showing that [treating agents as first-class citizens](https://nextbigteng.substack.com/p/ai-agents-as-first-class-citizens-in-software-development) enables organizations to build more maintainable, scalable, and production-ready AI systems. By providing a declarative manifest format, OSSA makes agents:

- **Discoverable** - Agents can be cataloged, searched, and shared across teams
- **Composable** - Agents can invoke other agents as standard capabilities
- **Testable** - Agents have defined schemas for inputs, outputs, and behavior validation
- **Deployable** - Agents are infrastructure-independent artifacts
- **Observable** - Agents expose standard metrics and tracing

This first-class treatment transforms agents from ad-hoc code into production-grade software components with clear contracts, versioning, and lifecycle management.

### The Problem OSSA Solves

Before OSSA, AI agents were:
- **Framework-locked** - LangChain agents couldn't work with Anthropic SDK agents
- **Runtime-coupled** - Agents tied to specific deployment environments
- **Non-portable** - Moving agents between teams/orgs required rewriting
- **Hard to validate** - No standard way to verify agent correctness
- **Difficult to discover** - No standard registry or discovery mechanism

**OSSA solves these problems** by providing a standard, declarative format for agent definition that is:
- Framework-agnostic - Works with any LLM framework or SDK
- Runtime-independent - Deploy to Kubernetes, Docker, serverless, or on-premise
- Portable - Move agents between teams, organizations, and infrastructures
- Validatable - JSON Schema validation ensures correctness
- Discoverable - Standard format enables agent registries and marketplaces

### OSSA vs. Frameworks

| Aspect | OSSA (Standard) | Framework (e.g., LangChain) |
|--------|----------------|----------------------------|
| **Purpose** | Defines the contract | Provides implementation |
| **Format** | Declarative YAML/JSON | Code (Python, TypeScript, etc.) |
| **Portability** | Framework-agnostic | Framework-specific |
| **Runtime** | Any runtime | Framework's runtime |
| **Tooling** | Validation, generation | Full orchestration |

**Think of it like this:**
- **OpenAPI** = Standard for API contracts (not an API framework)
- **OSSA** = Standard for agent contracts (not an agent framework)

---

## What's New in v0.3.2

### Unified LLM Configuration

OSSA v0.3.2 introduces a **unified LLM configuration** that eliminates hardcoded model names and enables runtime model selection:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: flexible-agent
  version: 1.0.0
spec:
  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4}
    profile: balanced
    temperature: 0.3

    fallback_models:
      - provider: openai
        model: gpt-4o
        condition: on_error

    retry_config:
      max_attempts: 3
      backoff_strategy: exponential
```

**Key features:**
- **Runtime-configurable models** - No hardcoded providers
- **Environment variable substitution** - `${LLM_PROVIDER:-default}`
- **Fallback models** - Automatic failover on error/timeout/rate-limit
- **Retry configuration** - Exponential, linear, or constant backoff
- **Cross-platform compatibility** - OSSA, GitLab Duo, Google A2A, MCP

See [LLM Configuration](/docs/schema-reference/llm-config) for full documentation.

---

## Core Principles

1. **Specification-Driven** - OSSA defines the standard
2. **Implementation-Agnostic** - Any runtime can implement it
3. **Minimal Tooling** - Basic CLI for validation & generation
4. **No Vendor Lock-in** - Deploy to any infrastructure

---

## Quick Start

### Installation

```bash
npm install -g @bluefly/openstandardagents
```

### Create Your First Agent

```bash
ossa generate chat --name "My First Agent" --output agent.ossa.yaml
```

### Validate

```bash
ossa validate agent.ossa.yaml
```

### Deploy

Deploy to **YOUR** infrastructure:
- AWS, GCP, Azure
- Kubernetes, Docker
- On-premise
- Serverless

OSSA doesn't care - it's just a standard.

---

## Repository Links

- **Main Repository**: [gitlab.com/blueflyio/openstandardagents](https://gitlab.com/blueflyio/openstandardagents)
- **Issues**: [Report Issues](https://gitlab.com/blueflyio/openstandardagents/-/issues)
- **Milestones**: [View Roadmap](https://gitlab.com/blueflyio/openstandardagents/-/milestones)
- **Releases**: [View Releases](https://gitlab.com/blueflyio/openstandardagents/-/releases)
- **npm Package**: [@bluefly/openstandardagents](https://www.npmjs.com/package/@bluefly/openstandardagents)

---

## Contributing

OSSA is an open standard. Contributions welcome!

1. Review [Contributing Guidelines](/docs/contributing)
2. Check [Open Issues](https://gitlab.com/blueflyio/openstandardagents/-/issues)
3. Create a merge request

---

## License

Apache 2.0 - see [LICENSE](https://gitlab.com/blueflyio/openstandardagents/-/blob/main/LICENSE) for details.

---

**OSSA: A Standard for Composable, Deployable, and Compliant AI Agents**

*Not a framework. A standard.*

