# OSSA - Open Standard for Scalable AI Agents

**The OpenAPI for AI Agents**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm version](https://img.shields.io/badge/npm-v0.2.3-blue.svg)](https://www.npmjs.com/package/@bluefly/openstandardagents)
[![GitLab](https://img.shields.io/badge/GitLab-OSSA-orange.svg)](https://github.com/blueflyio/openstandardagents)
[![GitHub](https://img.shields.io/badge/GitHub-OSSA-black.svg)](https://github.com/blueflyio/openstandardagents)
[![OSSA Compliant](https://img.shields.io/badge/OSSA-Compliant-00B8D4.svg)](https://github.com/blueflyio/openstandardagents)

---

## What is OSSA?

**OSSA: Open Standard for Scalable AI Agents** - The definitive open standard for defining and connecting AI agents.

Just as OpenAPI standardized REST APIs, OSSA standardizes AI agent interaction, enabling vendor-neutral interoperability across frameworks. OSSA provides a unified schema for AI agents to communicate, ensuring compatibility across frameworks and enhancing trust in autonomous systems.

**OSSA is NOT a framework** - it's a standard that defines the contract. Implementations provide the functionality.

**Key Qualities:**
- ✅ **Vendor-Neutral** - Community-driven, not controlled by any single company
- ✅ **Interoperable** - Common language enabling diverse AI agents to work together
- ✅ **Trustworthy** - Built with compliance and security in mind
- ✅ **Open** - Collaborative effort for the "Internet of Agents"

| Component | Role | Comparable To |
|-----------|------|---------------|
| OSSA Specification | Standard definition | OpenAPI Specification |
| OSSA CLI | Validation & generation | OpenAPI Generator (minimal) |
| agent-buildkit | Reference implementation | Kong API Gateway |
| OSSA Registry | Agent distribution | npm Registry |

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

### Create Agent

```bash
ossa generate worker --name "My Agent" --id my-agent
# Creates agent.ossa.yaml
```

### Validate

```bash
ossa validate agent.yml
```

### Deploy

Deploy to **YOUR** infrastructure:
- AWS, GCP, Azure
- Kubernetes, Docker
- On-premise
- Serverless

OSSA doesn't care - it's just a standard.

---

## OSSA CLI (Minimal Tooling)

The OSSA CLI provides basic tooling:

```bash
ossa validate <path>    # Validate against OSSA schema
ossa generate <type>    # Generate agent from template (chat, workflow, compliance, etc.)
ossa migrate <source>   # Migrate v0.1.9 → v0.2.2
```

**What OSSA CLI does:**
- ✅ Validate agent manifests
- ✅ Generate project scaffolding
- ✅ Provide templates

**What OSSA CLI does NOT do:**
- ❌ Runtime orchestration
- ❌ Deployment
- ❌ Production monitoring
- ❌ Infrastructure management

For production features, see [Agent Buildkit](https://github.com/blueflyio/openstandardagents).

---

## Specification

OSSA v0.2.3 Schema: [`spec/v0.2.2/ossa-0.2.2.schema.json`](spec/v0.2.2/ossa-0.2.2.schema.json)

### Required Fields

```yaml
ossaVersion: "0.2.3"

agent:
  id: my-agent                    # DNS-1123 format
  name: My Agent                  # Human-readable
  version: "1.0.0"                # Semantic version
  role: worker                    # Agent role

  runtime:
    type: k8s                     # Runtime type

  capabilities:                   # At least one capability
    - name: process_data
      description: Process data
      input_schema: { ... }
      output_schema: { ... }
```

Full schema documentation: [`docs/specification/`](docs/specification/)

---

## Examples

Reference implementations: [`examples/`](examples/)

- `compliance-agent.yml` - FedRAMP compliance
- `chat-agent.yml` - Conversation agent
- `workflow-agent.yml` - Workflow orchestration

---

## OSSA Ecosystem

### Core Products

**OSSA** (This Repository) - The specification standard
- JSON Schema specification
- CLI for validation & generation
- Reference implementations
- Documentation

**Agent Buildkit** - CLI tool for building and managing OSSA-compliant agents
- Modern, fast, minimal CLI
- GitLab integration
- Kubernetes deployment
- Production monitoring
- [Learn more →](https://github.com/blueflyio/openstandardagents)

**Agent Studio** - GUI platform for agent orchestration
- macOS-aligned design
- Visual workflow design
- Agent monitoring and debugging
- End-to-end agent lifecycle management
- [Learn more →](https://github.com/blueflyio/openstandardagents)

### Part of the OSSA Ecosystem

All three products work together:
- **OSSA** defines the standard
- **Agent Buildkit** provides CLI tooling
- **Agent Studio** offers visual management

Together, they form a complete ecosystem for AI agent development, deployment, and management.

**Others welcome** - OSSA is an open standard, anyone can implement it.

---

## Why OSSA?

### For Enterprises

✅ **Lightweight** - Just a standard, minimal dependencies
✅ **No Vendor Lock-in** - Use any implementation
✅ **Deploy Anywhere** - Your infrastructure, your choice
✅ **Clear Specification** - Well-defined contract

### For Framework Builders

✅ **Standard to Build On** - Like OpenAPI for APIs
✅ **Reference Implementation** - Agent Buildkit shows the way
✅ **Clear Boundaries** - Standard vs. implementation

---

## Installation & Usage

### As a Standard (Validation Only)

```bash
npm install -g @bluefly/openstandardagents
ossa validate my-agent.yml
```

### With Production Features

```bash
npm install -g @bluefly/agent-buildkit
buildkit ossa validate my-agent.yml  # Uses OSSA + adds features
buildkit ossa sync-docs               # GitLab integration
```

---

## Documentation

### Official Website & Documentation Portal

**Live Website**: https://openstandardagents.org

The OSSA website features:
- **Interactive Documentation** - Browse the complete OSSA wiki with an enhanced UI
- **GitLab Wiki Integration** - Automatically synced from the official GitLab wiki
- **Interactive Examples** - Explore OSSA manifests with live validation and URL tracking
- **Schema Validator** - Validate your OSSA manifests in the browser
- **Migration Guides** - Step-by-step guides from 6 major frameworks
- **Responsive Design** - Beautiful, accessible UI built with Next.js 15 and Tailwind CSS

The documentation is organized into:
- **Getting Started** - Quick start guides, installation, and first agent creation
- **Core Concepts** - OSSA specification, agent types, capabilities, and runtime models
- **Advanced Topics** - Security, deployment, monitoring, and scaling
- **For Your Role** - Tailored guides for developers, architects, enterprises, and researchers
- **Migration Guides** - From LangChain, MCP, OpenAI Swarm, CrewAI, Langflow, and Drupal ECA
- **Reference** - Complete schema, CLI, and OpenAPI extension reference

### Additional Resources

- **Specification**: [spec/v0.2.2/ossa-0.2.2.schema.json](spec/v0.2.2/ossa-0.2.2.schema.json)
- **Examples**: [examples/](examples/)
- **API Reference**: [docs/](docs/)
- **GitHub Issues**: https://github.com/blueflyio/openstandardagents/issues

---

## Contributing

OSSA is an open standard. Contributions welcome.

**Repository**: https://github.com/blueflyio/openstandardagents/  
**Homepage**: https://openstandardagents.org  
**Issues**: https://github.com/blueflyio/openstandardagents/issues

1. Fork the repository on GitHub
2. Create feature branch
3. Submit pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

Apache 2.0 - see [LICENSE](LICENSE) for details.

---

## Part of the OSSA Ecosystem

OSSA is part of a unified ecosystem for AI agent development:

- **[OSSA](https://github.com/blueflyio/openstandardagents)** - The open standard (this repository)
- **[Agent Buildkit](https://github.com/blueflyio/openstandardagents)** - CLI for building and managing agents
- **[Agent Studio](https://github.com/blueflyio/openstandardagents)** - GUI platform for agent orchestration

**OSSA: Open. Interoperable. Trustworthy.**

*The open standard for interoperable AI agents.*
