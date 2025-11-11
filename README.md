# OSSA - Open Standard for Scalable Agents

**A Specification Standard for AI Agent Definition, Deployment, and Management**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm version](https://img.shields.io/npm/v/@bluefly/open-standards-scalable-agents.svg)](https://www.npmjs.com/package/@bluefly/open-standards-scalable-agents)
[![GitLab](https://img.shields.io/badge/GitLab-OSSA-orange.svg)](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard)

---

## What is OSSA?

OSSA is a **specification standard** for defining AI agents, similar to how OpenAPI standardizes REST APIs.

**OSSA is NOT a framework** - it's a standard that defines the contract. Implementations provide the functionality.

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
npm install -g @bluefly/open-standards-scalable-agents
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

For production features, see [agent-buildkit](https://app-4001.cloud.bluefly.io/llm/npm/agent-buildkit).

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

## Ecosystem

### OSSA Standard (This Repository)

**Provides:**
- JSON Schema specification
- CLI for validation & generation
- Reference implementations
- Documentation

**Dependencies:** 4 (ajv, ajv-formats, commander, yaml) ~1MB

### Implementations

**agent-buildkit** - Reference implementation with production features:
- GitLab integration
- Kubernetes deployment
- Production monitoring
- Compliance tooling

See: https://app-4001.cloud.bluefly.io/llm/npm/agent-buildkit

**Others welcome** - OSSA is a standard, anyone can implement it.

---

## Why OSSA?

### For Enterprises

✅ **Lightweight** - Just a standard, minimal dependencies  
✅ **No Vendor Lock-in** - Use any implementation  
✅ **Deploy Anywhere** - Your infrastructure, your choice  
✅ **Clear Specification** - Well-defined contract  

### For Framework Builders

✅ **Standard to Build On** - Like OpenAPI for APIs  
✅ **Reference Implementation** - agent-buildkit shows the way  
✅ **Clear Boundaries** - Standard vs. implementation  

---

## Installation & Usage

### As a Standard (Validation Only)

```bash
npm install -g @bluefly/open-standards-scalable-agents
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

- **Specification**: [spec/ossa-1.0.schema.json](spec/ossa-1.0.schema.json)
- **Examples**: [examples/](examples/)
- **API Reference**: [docs/](docs/)
- **GitLab Wiki**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/wikis/home
- **Migration Guides**: 6 framework migration guides (LangChain, MCP, OpenAI, Langflow, Drupal ECA, CrewAI)

---

## Contributing

OSSA is an open standard. Contributions welcome.

1. Fork the repository
2. Create feature branch
3. Submit pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

Apache 2.0 - see [LICENSE](LICENSE) for details.

---

**OSSA: A Standard for Composable, Deployable, and Compliant AI Agents**

*Not a framework. A standard.*
