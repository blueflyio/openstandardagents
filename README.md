# Open Standard for Software Agents (OSSA)

> **The OpenAPI for Software Agents** - An open specification for production-ready AI agent systems

> **Built for Enterprise Adoption**: OSSA enables companies to build, deploy, and manage AI agents with vendor neutrality, production-grade reliability, and enterprise compliance built-in.

> 🚀 **v0.3.5 Released**: 10 major features including Completion Signals, Checkpointing, MoE, Flow Orchestration, and more. [See what's new →](spec/v0.3/README.md)

> 💡 **For Developers**: See [AGENTS.md](AGENTS.md) for setup and development guidelines. See [llms.txt](llms.txt) for LLM-friendly project overview.

[![npm version](https://img.shields.io/npm/v/@bluefly/openstandardagents)](https://www.npmjs.com/package/@bluefly/openstandardagents)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![GitHub Actions](https://github.com/blueflyio/openstandardagents/workflows/CI/badge.svg)](https://github.com/blueflyio/openstandardagents/actions)

## 🌟 Why Companies Choose OSSA

**OSSA is an emerging open standard for production AI agent systems** - designed for companies building enterprise-grade agent infrastructure.

### Business Value

✅ **Vendor Lock-In Elimination** - Switch AI providers (OpenAI, Anthropic, Google) without code changes
✅ **Cost Optimization** - Designed to reduce LLM costs via intelligent expert selection (MoE)
✅ **Production Reliability** - Improved session recovery with checkpointing and fault tolerance
✅ **Enterprise Compliance** - Built-in support for SOC2, HIPAA, GDPR, FedRAMP requirements
✅ **Future-Proof Architecture** - Write once, deploy anywhere as AI landscape evolves
✅ **Risk Mitigation** - Standardized contracts reduce vendor dependency and technical debt  

### Enterprise Features

- **Vendor-Neutral Contracts** - Works with OpenAI, Anthropic, Google, Azure, AWS, and more
- **Production-Grade Reliability** - Checkpointing, completion signals, fault tolerance
- **Enterprise Security** - Built-in access control, audit logging, compliance badges
- **Observability & Monitoring** - OpenTelemetry, LangSmith, Phoenix, Langfuse integration
- **Kubernetes-Native** - GitOps-ready, cloud-agnostic deployment
- **Framework Agnostic** - Works with LangChain, LangFlow, CrewAI, AutoGen, Temporal, n8n
- **Type-Safe SDKs** - TypeScript and Python with full validation and IntelliSense

### What is OSSA?

OSSA is a **specification standard** (like OpenAPI for REST APIs) that defines contracts and metadata for production agent systems. It's not a framework - it's the standard that frameworks and platforms adopt.

**Key Differentiators:**
- **The OpenAPI for Agents** - Open specification standard for agent systems
- **100% Backward Compatible** - Upgrade without breaking changes
- **Production-Ready** - Built for enterprise scale and reliability
- **Open Source** - Apache 2.0 licensed, community-driven

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
apiVersion: ossa/v0.3.5
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
  completion:
    default_signal: complete
  checkpointing:
    enabled: true
```

### v0.3.5: The OpenAPI for Software Agents

OSSA v0.3.5 introduces **10 major features** transforming it into the definitive OpenAPI for Software Agents:

- **Completion Signals** - Standardized agent termination conditions
- **Session Checkpointing** - Resilient, resumable agent state
- **Mixture of Experts (MoE)** - Agent-controlled expert selection
- **BAT Framework** - Best Available Technology selection
- **MOE Metrics** - Measure of Effectiveness evaluation
- **Flow-Based Orchestration** - Native Flow kind support
- **Dynamic Capability Discovery** - Runtime-adaptive capabilities
- **Feedback & Learning Loops** - Continuous improvement
- **Infrastructure Substrate** - Infrastructure as agent-addressable resources
- **Enhanced A2A Protocol** - Production-ready agent-to-agent communication

**100% Backward Compatible** - All v0.3.4 agents work with v0.3.5 runtime.

### AG2 Multi-Agent Swarm (v0.3.4+)

OSSA v0.3.4+ adds first-class support for AG2 (AutoGen) swarm topologies:

```yaml
# ag2-swarm.ossa.yaml
apiVersion: ossa/v0.3.5
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

See [examples/ag2/](spec/v0.3.4/examples/ag2/) for AG2 examples, and [v0.3.5 examples](spec/v0.3/examples/) for new v0.3.5 features.

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
│   ├── v0.3.5/       # Latest version (v0.3.5) - The OpenAPI for Software Agents
│   └── v0.3.4/       # Previous stable version
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
git clone https://github.com/blueflyio/openstandardagents.git
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

## 🏢 Enterprise Adoption

### Who Uses OSSA?

Companies use OSSA to:
- **Build vendor-neutral AI agent infrastructure** - Avoid lock-in to specific AI providers
- **Standardize agent development** - Consistent patterns across teams and projects
- **Enable multi-cloud deployment** - Deploy agents on AWS, GCP, Azure, or on-premises
- **Ensure compliance** - Meet SOC2, HIPAA, GDPR requirements with built-in controls
- **Reduce costs** - Optimize LLM spending with intelligent expert selection
- **Future-proof investments** - Adapt to new AI models and frameworks without rewrites

### Adoption Path

1. **Start Small** - Migrate one agent to OSSA format
2. **Validate** - Use OSSA CLI to validate and test
3. **Scale** - Standardize all agents on OSSA
4. **Integrate** - Connect to existing CI/CD and observability tools
5. **Optimize** - Leverage v0.3.5 features (MoE, checkpointing) for cost and reliability gains

### Migration Support

- **From Custom Agents** - Use OSSA CLI to convert existing agent definitions
- **From LangChain/CrewAI** - Import workflows with `ossa langchain:import` or `ossa crewai:import`
- **From Other Standards** - Migration guides available for common formats
- **Zero Downtime** - Migrate incrementally, agents continue working during transition

### Enterprise Support

- **Documentation** - Comprehensive guides, examples, and API reference
- **Community** - Active Discord community and GitHub discussions
- **Migration Tools** - Automated migration CLI for seamless upgrades
- **Compliance** - Built-in security and compliance features

## 🤝 Contributing

We welcome contributions from companies and individuals! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. **Fork the repository**: https://github.com/blueflyio/openstandardagents
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Run validations**: `npm run validate:all && npm test`
5. **Commit**: Follow [Conventional Commits](https://www.conventionalcommits.org/)
6. **Push and create a Pull Request**

### Code of Conduct

Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

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

## 🔗 Resources

- **🌐 Website**: https://openstandardagents.org - Complete specification and enterprise guides
- **📦 npm Package**: https://www.npmjs.com/package/@bluefly/openstandardagents
- **💬 Community**: [Discord](https://discord.gg/ZZqad3v4) - Join 1000+ developers and companies
- **📚 Documentation**: [Full Docs](https://openstandardagents.org/docs) - API reference, guides, examples
- **🐛 Issues**: [GitHub Issues](https://github.com/blueflyio/openstandardagents/issues)
- **⭐ Star Us**: [GitHub](https://github.com/blueflyio/openstandardagents) - Help us grow the ecosystem

## 📄 License

Apache-2.0 - See [LICENSE](LICENSE) for details.

## 📈 Design Goals

OSSA is designed to provide:
- **Cost Reduction** - Optimize LLM costs via MoE and intelligent routing
- **Improved Reliability** - Enhanced session recovery with checkpointing
- **Zero Vendor Lock-in** - Seamless provider switching through standardization
- **Faster Development** - Accelerated agent development with standardized patterns
- **Compliance Support** - Built-in features for SOC2, HIPAA, GDPR requirements

## 🙏 Acknowledgments

OSSA is maintained by the open-source community and adopted by companies worldwide. Special thanks to all contributors and adopters!

---

**Built for Enterprise. Open for Everyone.** ❤️

**Join the companies standardizing on OSSA** - [Get Started →](https://openstandardagents.org/docs/getting-started)
