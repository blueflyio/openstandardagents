# OSSA - Open Standard for Scalable Agents

**The OpenAPI for AI Agents**

<<<<<<< HEAD
[![Version](https://img.shields.io/badge/version-0.1.9-blue.svg)](./spec/OSSA-SPECIFICATION-v0.1.9.md)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](./LICENSE)
[![Standard](https://img.shields.io/badge/standard-specification-orange.svg)](./spec/)
=======
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm version](https://img.shields.io/npm/v/@bluefly/open-standards-scalable-agents.svg)](https://www.npmjs.com/package/@bluefly/open-standards-scalable-agents)
[![GitLab](https://img.shields.io/badge/GitLab-OSSA-orange.svg)](https://app-4001.cloud.bluefly.io/llm/openapi-ai-agents-standard)

---
>>>>>>> fix/remove-old-gitlab-urls

## What is OSSA?

OSSA (Open Standard for Scalable Agents) is a **specification standard** for defining AI agents, just as OpenAPI is a specification standard for REST APIs.

### Key Points

- ✅ **Specification Standard** - NOT a framework
- ✅ **Framework-Agnostic** - Works with any agent platform (kAgent, LangChain, CrewAI, etc.)
- ✅ **Declarative** - Define agents in YAML/JSON, not code
- ✅ **Portable** - Package and distribute agents as OCI artifacts
- ✅ **Extensible** - Supports platform-specific extensions
- ✅ **Validated** - JSON Schema validation

<<<<<<< HEAD
## Quick Example
=======
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

## OSSA CLI (Minimal Tooling)

The OSSA CLI provides basic tooling:

```bash
ossa validate <path>    # Validate against OSSA 1.0 schema
ossa init <name>        # Initialize new agent project
ossa generate <type>    # Generate from template
ossa migrate <source>   # Migrate v0.1.9 → 1.0
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

OSSA 1.0 Schema: [`spec/ossa-1.0.schema.json`](spec/ossa-1.0.schema.json)

### Required Fields
>>>>>>> fix/remove-old-gitlab-urls

```yaml
apiVersion: ossa/v0.1.9
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

## Getting Started

<<<<<<< HEAD
### 1. Install OSSA CLI
=======
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
>>>>>>> fix/remove-old-gitlab-urls

```bash
npm install -g @ossa/cli
```

### 2. Validate a Manifest

```bash
ossa validate agent.ossa.yaml
```

### 3. Deploy to kAgent (Kubernetes)

```bash
buildkit kagent compile agent.ossa.yaml
buildkit kagent deploy agent.ossa.yaml
```

## Documentation

<<<<<<< HEAD
- **[Specification v0.1.9](./spec/OSSA-SPECIFICATION-v0.1.9.md)** - Full specification
- **[JSON Schema](./spec/ossa-v0.1.9.schema.json)** - Validation schema
- **[Examples](./examples/)** - Reference implementations
- **[Extensions](./schemas/extensions/)** - Platform extensions
=======
- **Specification**: [spec/ossa-1.0.schema.json](spec/ossa-1.0.schema.json)
- **Examples**: [examples/](examples/)
- **API Reference**: [docs/](docs/)
- **GitLab Wiki**: https://app-4001.cloud.bluefly.io/llm/openapi-ai-agents-standard/-/wikis/home
>>>>>>> fix/remove-old-gitlab-urls

## OSSA vs. Frameworks

| Aspect          | OSSA          | agent-buildkit   | LangChain    | CrewAI      | kAgent     |
| --------------- | ------------- | ---------------- | ------------ | ----------- | ---------- |
| **Type**        | Specification | Framework        | Framework    | Framework   | Framework  |
| **Purpose**     | Define agents | Build/run agents | Build agents | Multi-agent | K8s agents |
| **Runtime**     | No            | Yes              | Yes          | Yes         | Yes        |
| **Portability** | High          | Medium           | Low          | Low         | Medium     |
| **Extensions**  | Yes           | N/A              | N/A          | N/A         | N/A        |

**Think of it this way:**

- **OSSA** = OpenAPI Specification (the standard)
- **agent-buildkit** = Express.js (implements the standard)
- **kAgent** = Kong API Gateway (implements the standard)
- **LangChain** = Another framework (can implement the standard)

## Reference Implementations

### agent-buildkit

Production framework that uses OSSA:

```bash
cd /Users/flux423/Sites/LLM/agent-buildkit
buildkit ossa validate examples/*.ossa.yaml
buildkit agents deploy examples/k8s-troubleshooter.ossa.yaml
```

### kAgent Integration

Kubernetes-native deployment:

```bash
buildkit kagent compile examples/kagent/*.ossa.yaml
buildkit kagent deploy examples/kagent/*.ossa.yaml
buildkit kagent list
```

See [kAgent Integration Guide](./examples/kagent/README.md)

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

**Specification**: [kagent-v1.yml](./schemas/extensions/kagent-v1.yml)

### Creating Custom Extensions

1. Define schema in `./schemas/extensions/{platform}-v{version}.yml`
2. Document in specification
3. Submit PR for standardization

## Project Structure

```
OSSA/
├── spec/
│   ├── OSSA-SPECIFICATION-v0.1.9.md  # Full specification
│   └── ossa-v0.1.9.schema.json       # JSON Schema
├── schemas/
│   └── extensions/
│       └── kagent-v1.yml              # kAgent extension
├── examples/
│   ├── basic/                         # Basic examples
│   └── kagent/                        # kAgent examples (5 production agents)
├── cli/                               # CLI tools
├── tests/                             # Validation tests
└── README.md                          # This file
```

## Examples

- **[k8s-troubleshooter](./examples/kagent/k8s-troubleshooter.ossa.yaml)** - Kubernetes troubleshooting
- **[security-scanner](./examples/kagent/security-scanner.ossa.yaml)** - Security vulnerability scanning
- **[cost-optimizer](./examples/kagent/cost-optimizer.ossa.yaml)** - Cost optimization with VORTEX v3
- **[documentation-agent](./examples/kagent/documentation-agent.ossa.yaml)** - Automated documentation
- **[compliance-validator](./examples/kagent/compliance-validator.ossa.yaml)** - SOC2/HIPAA/FedRAMP compliance

## Validation

### CLI

```bash
ossa validate agent.ossa.yaml
```

### TypeScript

```typescript
import { validate } from '@ossa/validator';

const result = await validate(manifest);
if (!result.valid) {
  console.error(result.errors);
}
```

### Python

```python
from ossa import validate_manifest

result = validate_manifest(manifest)
if not result.valid:
    print(result.errors)
```

## Tools

### OSSA CLI

```bash
ossa validate <manifest>     # Validate against schema
ossa init <name>             # Create from template
ossa generate <name>         # Generate scaffold
ossa migrate <version>       # Migrate to new version
```

### agent-buildkit Integration

```bash
buildkit ossa validate <manifest>
buildkit agents generate <name>
buildkit agents deploy <manifest>
```

### kAgent Integration

```bash
buildkit kagent compile <manifest>   # OSSA → kAgent CRD
buildkit kagent deploy <manifest>    # Deploy to K8s
buildkit kagent sync                 # Sync all agents
```

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

## Version History

- **v0.1.9** (Current) - Added extensions, taxonomy, observability
- **v0.1.8** - Added autonomy, constraints
- **v0.1.0** - Initial specification

See [CHANGELOG.md](./CHANGELOG.md)

## Governance

- **Specification Owner**: LLM Platform Team
- **Change Process**: RFC → Review → Approval
- **Extension Registry**: Open submissions
- **Backward Compatibility**: Required for minor versions

## License

Apache License 2.0

Copyright 2025 LLM Platform

## Links

- **GitLab**: https://gitlab.bluefly.io/llm/ossa
- **Specification**: [OSSA-SPECIFICATION-v0.1.9.md](./spec/OSSA-SPECIFICATION-v0.1.9.md)
- **JSON Schema**: [ossa-v0.1.9.schema.json](./spec/ossa-v0.1.9.schema.json)
- **Examples**: [./examples/](./examples/)
- **kAgent Integration**: [./examples/kagent/README.md](./examples/kagent/README.md)

---

**OSSA: Making AI agents portable, discoverable, and enterprise-ready.**
