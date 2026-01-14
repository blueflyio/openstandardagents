# Open Standard for Software Agents (OSSA)

> **OSSA** is a vendor-neutral, open specification standard for defining software agents. **The OpenAPI for agents.**

> OSSA is a **specification standard**, not a framework. It defines contracts and metadata for production agent systems (security, governance, portability), not orchestration algorithms or runtime behavior.

> 💡 **For AI Coding Agents**: See [AGENTS.md](docs/governance/AGENTS.md) for setup, code style, and development guidelines. See [llms.txt](docs/llms.txt) for LLM-friendly project overview.

[![npm version](https://img.shields.io/npm/v/@bluefly/openstandardagents)](https://www.npmjs.com/package/@bluefly/openstandardagents)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![GitLab CI](https://gitlab.com/blueflyio/ossa/openstandardagents/badges/main/pipeline.svg)](https://gitlab.com/blueflyio/ossa/openstandardagents/-/pipelines)

## 🌟 What is OSSA?

OSSA provides a standardized YAML schema for defining software agents, their capabilities, triggers, and lifecycle management. It defines **contracts and metadata** for production agent systems, enabling:

**Scope:**
- **Standardized metadata** for security, governance, and portability
- **Vendor-neutral contracts** that work across platforms
- **Specification standard** (like OpenAPI) - not a framework or runtime

- **Vendor-neutral agent definitions** - Write once, deploy anywhere
- **Multi-platform compatibility** - Works with LangChain, LangFlow, CrewAI, AutoGen, and more
- **Framework integrations** - Import/export from popular AI frameworks
- **Observability support** - Built-in adapters for Phoenix/Arize, Langfuse, LangSmith, and OpenTelemetry
- **GitLab Duo Platform integration** - Native support for GitLab's AI agent ecosystem
- **Kubernetes-native deployment** - GitOps-ready agent manifests
- **Type-safe SDKs** - TypeScript and Python SDKs with full validation

## 🚀 Quick Start

### Install

```bash
npm install @bluefly/openstandardagents
# or
pnpm add @bluefly/openstandardagents
# or
yarn add @bluefly/openstandardagents
```

### Create Your First Agent

```yaml
# my-agent.ossa.yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: my-first-agent
  version: 1.0.0
spec:
  role: "A helpful assistant that answers questions"
  runtime:
    type: node
    image: node:20-alpine
  capabilities:
    - type: text-generation
      provider: openai
      model: gpt-4
  triggers:
    - type: webhook
      endpoint: /chat
```

### AG2 Multi-Agent Swarm (v0.3.4+)

OSSA v0.3.4 adds first-class support for AG2 (AutoGen) swarm topologies:

```yaml
# ag2-swarm.ossa.yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: software-dev-swarm
  labels:
    framework: ag2
    pattern: hierarchical

orchestration:
  swarm_topology:
    topology_type: hierarchical
    hierarchical:
      root: agent://supervisor
      levels:
        - agents:
            - uri: agent://tech-lead
              children:
                - agent://coder
                - agent://reviewer
    speaker_selection_strategy:
      method: capability_match

  group_chat:
    participants:
      - agent://supervisor
      - agent://tech-lead
      - agent://coder
      - agent://reviewer
    manager: agent://supervisor
    max_round: 20

hitl:
  enabled: true
  human_input_mode: TERMINATE
  intervention_points:
    - id: code_review
      trigger:
        type: on_decision
      mode: ALWAYS

a2a:
  service_discovery:
    enabled: true
  handoff_protocol:
    strategy: capability_match

state_management:
  teachability:
    enabled: true
    learning_modes:
      - feedback
      - observation
```

See [examples/ag2/](spec/v0.3.4/examples/ag2/) for complete examples.

### Validate Your Agent

```bash
# Using the CLI
npx @bluefly/openstandardagents validate my-agent.ossa.yaml

# Or install globally
npm install -g @bluefly/openstandardagents
ossa validate my-agent.ossa.yaml
```

### Use in Code

```typescript
import { OSSASDKClient } from '@bluefly/openstandardagents/typescript';

const client = new OSSASDKClient();
const manifest = client.loadManifest('my-agent.ossa.yaml');
const validation = client.validateManifest(manifest);

if (validation.valid) {
  console.log('✅ Agent manifest is valid!');
} else {
  console.error('❌ Validation errors:', validation.errors);
}
```

## 📚 Documentation

- **[Official Website](https://openstandardagents.org)** - Complete specification and guides
- **[Quick Start Guide](docs/QUICKSTART.md)** - Get started in 5 minutes
- **[API Reference](docs/api-reference/)** - Complete API documentation
- **[Examples](examples/)** - 100+ reference examples
- **[Migration Guides](migrations/guides/)** - Upgrade between versions

## 🏗️ Project Structure

```
openstandardagents/
├── spec/              # OSSA specification schemas
│   └── v0.3.4/       # Latest version (v0.3.4)
├── src/              # TypeScript source code
│   ├── cli/          # CLI commands (validate, generate, migrate, etc.)
│   ├── dev-cli/      # Developer CLI (version, spec, workflow commands)
│   ├── services/     # Core services (validation, generation, migration)
│   ├── adapters/     # Observability adapters (Phoenix, Langfuse, LangSmith, OpenTelemetry)
│   ├── tools/        # Development tools
│   └── sdks/         # SDK implementations
├── examples/         # 100+ reference examples
├── openapi/          # OpenAPI specifications
├── tests/            # Test suite
└── docs/             # Documentation
```

## 🛠️ Development

### Prerequisites

- Node.js >= 20.0.0
- npm, pnpm, or yarn

### Setup

```bash
# Clone the repository
git clone https://gitlab.com/blueflyio/ossa/openstandardagents.git
cd openstandardagents

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Validate all examples
npm run validate:all
```

### Available Commands

```bash
# Validation
npm run validate:all              # Validate all manifests
ossa validate <file>              # Validate specific file

# Code Generation
npm run generate:types           # Generate TypeScript types
npm run generate:zod             # Generate Zod schemas
npm run generate:all             # Generate everything

# Migration
npm run migrate                  # Migrate manifests to latest version
npm run migrate:check            # Check which files need migration

# Framework Integration
ossa langflow <file>             # Import/export LangFlow workflows
ossa langchain <file>            # Import/export LangChain chains
ossa framework <file>            # Import from any supported framework

# Developer CLI (for contributors)
ossa-dev version sync            # Sync version across all files
ossa-dev version release         # Release new version
ossa-dev spec generate           # Generate spec from source
ossa-dev spec validate           # Validate generated spec

# Documentation
npm run docs:generate            # Generate documentation
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/governance/CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Run validations**: `npm run validate:all && npm test`
5. **Commit**: Follow [Conventional Commits](https://www.conventionalcommits.org/)
6. **Push and create a Merge Request**

### Code of Conduct

Please read [CODE_OF_CONDUCT.md](docs/governance/CODE_OF_CONDUCT.md) before contributing.

## 📦 What's Included

### Specification

- **JSON Schema** - Complete validation schemas for all OSSA versions
- **OpenAPI Specs** - API definitions for agent communication
- **Migration Guides** - Step-by-step upgrade instructions

### Tools

- **CLI** - Command-line tool for validation, generation, and migration
- **Developer CLI** - Version management and spec generation tools
- **TypeScript SDK** - Type-safe client library
- **Python SDK** - Python client library (coming soon)
- **Framework Integrations** - Import/export from LangChain, LangFlow, CrewAI, AutoGen
- **Observability Adapters** - Phoenix/Arize, Langfuse, LangSmith, OpenTelemetry support

### Examples

- **100+ Examples** - Reference implementations for common patterns
- **Platform Adapters** - Integrations with LangChain, CrewAI, etc.
- **Multi-Agent Workflows** - Complex orchestration examples

## 🔗 Links

- **Website**: https://openstandardagents.org
- **npm Package**: https://www.npmjs.com/package/@bluefly/openstandardagents
- **GitLab**: https://gitlab.com/blueflyio/ossa/openstandardagents
- **GitHub Mirror**: https://github.com/blueflyio/openstandardagents
- **Discord**: https://discord.gg/ZZqad3v4
- **Issues**: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues
- **Discussions**: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues

## 📄 License

Apache-2.0 - See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

OSSA is maintained by the open-source community. Special thanks to all contributors!

---

**Made with ❤️ for the AI agent community**
