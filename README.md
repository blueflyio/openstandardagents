# OSSA - Open Standard for Scalable AI Agents

> **The OpenAPI for AI Agents**
> 
> - **🦊 GitLab**: [gitlab.com/blueflyio/openstandardagents](https://gitlab.com/blueflyio/openstandardagents) (Primary)
> - **🐙 GitHub**: [github.com/blueflyio/openstandardagents](https://github.com/blueflyio/openstandardagents) (Mirror)
> - **📦 npm**: [@bluefly/openstandardagents](https://www.npmjs.com/package/@bluefly/openstandardagents)
> - **🌐 Website**: [openstandardagents.org](https://openstandardagents.org)
> - **💬 Discord**: [Join our community](https://discord.gg/ossa)
>
> ⚠️ **Note**: GitHub is a read-only mirror. All development happens on GitLab.

---

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm version](https://img.shields.io/npm/v/@bluefly/openstandardagents)](https://www.npmjs.com/package/@bluefly/openstandardagents)
[![GitHub](https://img.shields.io/badge/GitHub-OSSA-black.svg)](https://github.com/blueflyio/openstandardagents)

**Vendor-neutral, compliance-ready, enterprise-grade**

- ✅ Switch between AI providers without code changes
- ✅ Built-in compliance and security frameworks
- ✅ Standardized agent lifecycle and governance
- ✅ Multi-runtime support (Node.js, Python, more)

---

## What is OSSA?

**Open Standard Agents (OSSA)** is an open, vendor-neutral specification for defining AI agents, similar to how OpenAPI standardizes REST APIs. It enables interoperability across frameworks, runtimes, and organizations.

### OSSA is NOT a Framework

OSSA is a **specification standard** that defines the contract for agent definition, deployment, and management.

Just like OpenAPI doesn't implement APIs, OSSA doesn't implement agents. It provides the standard that implementations follow.

### Why Does This Matter?

**Portability: Avoid Vendor Lock-in**  
Switch between AI providers (OpenAI, Anthropic, Azure) without rewriting code. Define your agent once in OSSA format, deploy anywhere.

**Regulatory Compliance: Built-in Frameworks**  
Meet SOC2, FedRAMP, HIPAA, and GDPR requirements with standardized security models, audit trails, and data boundary controls.

**Vendor Independence: True Interoperability**  
Community-driven standard, not controlled by any single company. Works with LangChain, CrewAI, AutoGen, and any framework.

**One standard. Any framework. True portability.**

---

## Get Started in Minutes

### 1. Install CLI

```bash
npm install -g @bluefly/openstandardagents
```

### 2. Create Agent

```bash
ossa init my-agent
cd my-agent
```

### 3. Validate

```bash
ossa validate my-agent.ossa.yaml
```

### 4. Run

```bash
# Set your API key
export OPENAI_API_KEY=sk-your-key-here

# Run interactively
ossa run my-agent.ossa.yaml
```

### 5. Export to Any Framework

```bash
ossa export --to cursor
ossa export --to langchain
ossa export --to crewai
```

[Read Full Getting Started Guide](https://openstandardagents.org/docs/getting-started/)

---

## Minimal Example

```yaml
apiVersion: ossa/v0.2.8
kind: Agent

metadata:
  name: my-agent
  version: "1.0.0"
  description: My first OSSA agent

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

## Why OSSA?

### Framework-Agnostic
Works with LangChain, Anthropic, OpenAI, CrewAI, Langflow, AutoGen, and more. No vendor lock-in.

### Portable
Move agents between teams, organizations, and infrastructures without rewriting code.

### Validatable
JSON Schema validation ensures correctness before deployment. Catch errors early.

### Well-Documented
Comprehensive documentation, examples, and tooling. Built for developers, by developers.

### Open Source
Apache 2.0 licensed. Community-driven. Transparent development process.

### Fast Integration
Export to any framework format. Import existing agents. Seamless migration paths.

### Secure by Design
Built-in security patterns, authentication, and compliance features.

### Observable
Built-in observability, logging, and monitoring. Track agent performance and behavior.

---

## Works With Your Favorite Tools

OSSA integrates seamlessly with leading AI frameworks, platforms, and tools:

**LLM Providers**: OpenAI, Anthropic, Google Gemini, Azure OpenAI, Ollama

**Frameworks**: LangChain, CrewAI, AutoGen, LlamaIndex, LangGraph, Langflow

**Platforms**: Kubernetes, Docker, AWS, Azure, GCP

**Tools**: MCP, Drupal, LibreChat, Cursor, VS Code

[View All Integrations](https://openstandardagents.org/docs/ecosystem/framework-support/)

---

## Examples

We provide comprehensive examples for all major frameworks:

### Framework Integration Examples

- **OpenAI** - [examples/openai/](https://github.com/blueflyio/openstandardagents/tree/main/examples/openai)
- **Anthropic** - [examples/anthropic/](https://github.com/blueflyio/openstandardagents/tree/main/examples/anthropic)
- **LangChain** - [examples/langchain/](https://github.com/blueflyio/openstandardagents/tree/main/examples/langchain)
- **CrewAI** - [examples/crewai/](https://github.com/blueflyio/openstandardagents/tree/main/examples/crewai)
- **AutoGen** - [examples/autogen/](https://github.com/blueflyio/openstandardagents/tree/main/examples/autogen)
- **LlamaIndex** - [examples/llamaindex/](https://github.com/blueflyio/openstandardagents/tree/main/examples/llamaindex)
- **LangGraph** - [examples/langgraph/](https://github.com/blueflyio/openstandardagents/tree/main/examples/langgraph)
- **Langflow** - [examples/langflow/](https://github.com/blueflyio/openstandardagents/tree/main/examples/langflow)
- **Vercel AI** - [examples/vercel/](https://github.com/blueflyio/openstandardagents/tree/main/examples/vercel)
- **Cursor** - [examples/cursor/](https://github.com/blueflyio/openstandardagents/tree/main/examples/cursor)

### Production Examples

**GitLab Kubernetes Ecosystem** - [.gitlab/agents/](https://github.com/blueflyio/openstandardagents/tree/main/.gitlab/agents)
- 8 specialized agents for production Kubernetes deployments
- Security, Performance, Database, Config, Monitoring, Rollback, Cost, Compliance
- Full documentation: [Wiki](https://github.com/blueflyio/openstandardagents/wiki/OSSA-Agent-Ecosystem-for-GitLab-Kubernetes-Deployments)

[View All Examples](https://openstandardagents.org/examples/)

---

## Documentation

### Official Website

**Live Website**: [openstandardagents.org](https://openstandardagents.org)

Features:
- **Interactive Documentation** - Complete OSSA specification
- **Schema Validator** - Validate your manifests in the browser
- **Playground** - Test agents interactively
- **Migration Guides** - From LangChain, MCP, OpenAI Swarm, CrewAI, Langflow, Drupal ECA

### Resources

- **Getting Started**: [openstandardagents.org/docs/getting-started/](https://openstandardagents.org/docs/getting-started/)
- **Full Documentation**: [openstandardagents.org/docs/](https://openstandardagents.org/docs/)
- **Schema Reference**: [openstandardagents.org/schema/](https://openstandardagents.org/schema/)
- **Specification**: [spec/v0.2.8/ossa-0.2.8.schema.json](https://github.com/blueflyio/openstandardagents/blob/main/spec/v0.2.8/ossa-0.2.8.schema.json)
- **Examples**: [openstandardagents.org/examples/](https://openstandardagents.org/examples/)
- **Blog**: [openstandardagents.org/blog/](https://openstandardagents.org/blog/)

---

## How OSSA Compares

| Feature | OSSA | LangChain | AutoGen | MCP | Semantic Kernel |
|---------|------|-----------|---------|-----|-----------------|
| Vendor Neutral | ✅ | ❌ | ❌ | ✅ | ❌ |
| Formal Standard | ✅ | ❌ | ❌ | ✅ | ❌ |
| Multi-runtime | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ |
| Enterprise Governance | ✅ | ❌ | ❌ | ❌ | ⚠️ |
| Compliance Ready | ✅ | ❌ | ❌ | ❌ | ❌ |
| Open Source | ✅ | ✅ | ✅ | ✅ | ✅ |

**OSSA**: Vendor-neutral specification standard  
**LangChain/AutoGen/Semantic Kernel**: Framework-specific implementations  
**MCP**: Formal standard focused on context, not full agent lifecycle

- **Specification**: [spec/v0.2.8/ossa-0.2.8.schema.json](spec/v0.2.8/ossa-0.2.8.schema.json)
- **Examples**: [examples/](examples/)
- **API Reference**: [docs/](docs/)
- **Deployment Guides**: [GitHub Mirroring](https://openstandardagents.org/docs/deployment/github-mirroring)
- **GitHub Issues**: https://github.com/blueflyio/openstandardagents/issues

---

## Contributing

OSSA is an open-source, community-driven project. We welcome contributions!

**Primary Repository**: [GitLab](https://gitlab.com/blueflyio/openstandardagents)  
**GitHub Mirror**: [GitHub](https://github.com/blueflyio/openstandardagents) (read-only, automatically synced)

> ⚠️ **Important**: The GitHub repository is a read-only mirror. All development happens on GitLab.
> 
> - ✅ **GitLab**: Create issues, merge requests, discussions
> - ❌ **GitHub**: Do not create PRs or issues - they will not be reviewed

### How to Contribute

1. Fork the repository on [GitLab](https://gitlab.com/blueflyio/openstandardagents)
2. Create a feature branch
3. Make your changes
4. Submit a merge request on GitLab

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Ways to Contribute

- **Code** - Improve the CLI, add examples, fix bugs
- **Documentation** - Improve docs, write tutorials
- **Examples** - Add framework integrations
- **Feedback** - Report issues, suggest features
- **Community** - Help others, answer questions

---

## Community

Join our growing community:

- **Discord**: [Join our community](https://discord.gg/ossa)
- **GitHub Discussions**: [github.com/blueflyio/openstandardagents/discussions](https://github.com/blueflyio/openstandardagents/discussions)
- **GitHub Issues**: [github.com/blueflyio/openstandardagents/issues](https://github.com/blueflyio/openstandardagents/issues)

---

## License

Apache 2.0 - see [LICENSE](https://github.com/blueflyio/openstandardagents/blob/main/LICENSE) for details.

---

## About

Open Standard Agents (OSSA) is a vendor-neutral specification created by Thomas Scola, founder of Bluefly.io.

**OSSA: Open. Interoperable. Trustworthy.**

*The open standard for interoperable AI agents.*
