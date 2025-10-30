# OSSA - Open Standard for Scalable Agents

**The OpenAPI for AI Agents**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm version](https://img.shields.io/npm/v/@bluefly/open-standards-scalable-agents.svg)](https://www.npmjs.com/package/@bluefly/open-standards-scalable-agents)
[![GitLab](https://img.shields.io/badge/GitLab-OSSA-orange.svg)](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard)

---

## What is OSSA?

OSSA (Open Standard for Scalable Agents) is a **specification standard** for defining AI agents, just as OpenAPI is a specification standard for REST APIs.

### Key Points

- ✅ **Specification Standard** - NOT a framework
- ✅ **Framework-Agnostic** - Works with any agent platform (kAgent, LangChain, CrewAI, etc.)
- ✅ **Declarative** - Define agents in YAML/JSON, not code
- ✅ **Portable** - Package and distribute agents as OCI artifacts
- ✅ **Extensible** - Supports platform-specific extensions
- ✅ **Validated** - JSON Schema validation

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
ossa init my-agent --type worker
cd .agents/my-agent
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

## Quick Example

```yaml
apiVersion: ossa/v0.2.2
kind: Agent
metadata:
  name: k8s-troubleshooter
  version: 1.0.0
  description: 'Kubernetes cluster troubleshooting agent'

spec:
  taxonomy:
    domain: infrastructure
    subdomain: kubernetes
    capability: troubleshooting

  role: |
    You are an expert Kubernetes troubleshooter.

  llm:
    provider: openai
    model: gpt-4
    temperature: 0.2

  tools:
    - type: mcp
      server: kubernetes-mcp
      capabilities: [get_pods, get_logs, get_events]

  autonomy:
    level: supervised
    approval_required: true

  constraints:
    cost:
      maxTokensPerDay: 50000
      maxCostPerDay: 10.0

extensions:
  kagent:
    kubernetes:
      namespace: production
    guardrails:
      requireApproval: true
```

---

## OSSA CLI (Minimal Tooling)

The OSSA CLI provides basic tooling:

```bash
ossa validate <path>    # Validate against OSSA schema
ossa init <name>        # Initialize new agent project
ossa generate <type>    # Generate from template
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

For production features, see [agent-buildkit](https://gitlab.bluefly.io/llm/npm/agent-buildkit).

---

## Specification

**Current Version:** v0.2.2

OSSA Specification: [`spec/v0.2.2/OSSA-SPECIFICATION-v0.2.2.md`](spec/v0.2.2/OSSA-SPECIFICATION-v0.2.2.md)

OSSA JSON Schema: [`spec/v0.2.2/ossa-0.2.2.schema.json`](spec/v0.2.2/ossa-0.2.2.schema.json)

### Required Fields

Every OSSA agent manifest requires:
- `apiVersion` - OSSA version (e.g., `ossa/v0.2.2`)
- `kind` - Resource type (e.g., `Agent`)
- `metadata` - Name, version, description
- `spec` - Agent specification (role, LLM, tools, etc.)

---

## Examples

Reference implementations: [`examples/`](examples/)

- **[k8s-troubleshooter](./examples/kagent/k8s-troubleshooter.ossa.yaml)** - Kubernetes troubleshooting
- **[security-scanner](./examples/kagent/security-scanner.ossa.yaml)** - Security vulnerability scanning
- **[cost-optimizer](./examples/kagent/cost-optimizer.ossa.yaml)** - Cost optimization
- **[documentation-agent](./examples/kagent/documentation-agent.ossa.yaml)** - Automated documentation
- **[compliance-validator](./examples/kagent/compliance-validator.ossa.yaml)** - SOC2/HIPAA/FedRAMP compliance

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

See: https://gitlab.bluefly.io/llm/npm/agent-buildkit

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

## OSSA vs. Frameworks

| Aspect          | OSSA          | agent-buildkit   | LangChain    | CrewAI      |
| --------------- | ------------- | ---------------- | ------------ | ----------- |
| **Type**        | Specification | Framework        | Framework    | Framework   |
| **Purpose**     | Define agents | Build/run agents | Build agents | Multi-agent |
| **Runtime**     | No            | Yes              | Yes          | Yes         |
| **Portability** | High          | Medium           | Low          | Low         |
| **Extensions**  | Yes           | N/A              | N/A          | N/A         |

**Think of it this way:**

- **OSSA** = OpenAPI Specification (the standard)
- **agent-buildkit** = Express.js (implements the standard)
- **LangChain** = Another framework (can implement the standard)

---

## Extensions

OSSA supports platform-specific extensions via the `extensions` field:

### kAgent Extension

```yaml
extensions:
  kagent:
    kubernetes:
      namespace: production
      labels:
        app: my-agent
    guardrails:
      requireApproval: true
```

**Specification**: [`spec/extensions/kagent-v1.yml`](./spec/extensions/kagent-v1.yml)

### Drupal Extension

```yaml
extensions:
  drupal:
    module: ai_agents
    permissions: ['administer agents']
```

**Specification**: [`spec/extensions/drupal-v1.yml`](./spec/extensions/drupal-v1.yml)

### Creating Custom Extensions

1. Define schema in `./spec/extensions/{platform}-v{version}.yml`
2. Document in specification
3. Submit PR for standardization

---

## Documentation

- **Specification**: [spec/v0.2.2/OSSA-SPECIFICATION-v0.2.2.md](spec/v0.2.2/OSSA-SPECIFICATION-v0.2.2.md)
- **OpenAPI Extensions**: [docs/openapi-extensions.md](docs/openapi-extensions.md) - How OSSA extends OpenAPI/Swagger for AI agents
- **Examples**: [examples/](examples/)
- **Getting Started**: [docs/getting-started.md](docs/getting-started.md)
- **GitLab Wiki**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/wikis/home

---

## Project Structure

```
ossa/
├── spec/
│   ├── v0.2.2/                        # Current stable version
│   │   ├── OSSA-SPECIFICATION-v0.2.2.md
│   │   ├── ossa-0.2.2.schema.json
│   │   └── ossa-0.2.2.yaml
│   ├── versions/                      # Legacy versions
│   │   └── v0.1.9/
│   ├── examples/                      # Reference implementations
│   └── extensions/                    # Platform extensions
├── src/                               # TypeScript implementation
│   ├── services/                      # Validation, generation, migration
│   └── types/                         # TypeScript types
├── bin/                               # CLI entry point
├── examples/                          # Example agent manifests
│   ├── kagent/                        # kAgent (Kubernetes) examples
│   ├── drupal/                        # Drupal examples
│   └── minimal/                       # Minimal examples
├── tests/                             # Test suite
└── docs/                              # Documentation
```

---

## Contributing

OSSA is an open standard. Contributions welcome!

### Areas for Contribution

- **New Extensions** - Platform-specific extensions
- **Examples** - Reference implementations
- **Tooling** - Validators, generators, converters
- **Documentation** - Guides, tutorials, best practices

### Process

1. **RFC** - Propose changes via GitLab issue
2. **Discussion** - Community review
3. **PR** - Implementation with tests
4. **Merge** - After approval

---

## Version History

- **v0.2.2** (Current) - Added reasoning compliance, production examples
- **v0.1.9** (Legacy) - Added extensions, taxonomy, observability
- **v0.1.8** - Added autonomy, constraints
- **v0.1.0** - Initial specification

See [CHANGELOG.md](./CHANGELOG.md)

---

## About the Author

OSSA was created by [Thomas Scola](https://www.linkedin.com/in/thomasscola/), CEO of Bluefly.io and GitLab Customer Success Architect. Drawing from real-world government and enterprise deployments, OSSA emerged as a portable, vendor-neutral specification standard—enabling teams to define AI agents declaratively without framework lock-in.

---

## License

Apache License 2.0

Copyright 2025 Bluefly.io

---

## Links

- **GitLab**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard
- **npm Package**: https://www.npmjs.com/package/@bluefly/open-standards-scalable-agents
- **Specification**: [spec/v0.2.2/OSSA-SPECIFICATION-v0.2.2.md](./spec/v0.2.2/OSSA-SPECIFICATION-v0.2.2.md)
- **JSON Schema**: [spec/v0.2.2/ossa-0.2.2.schema.json](./spec/v0.2.2/ossa-0.2.2.schema.json)
- **Examples**: [examples/](./examples/)

---

**OSSA: Making AI agents portable, discoverable, and enterprise-ready.**
