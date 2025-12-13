<div align="center">

```
   ___  ____ ____    _
  / _ \/ ___/ ___|  / \
 | | | \___ \___ \ / _ \
 | |_| |___) |__) / ___ \
  \___/|____/____/_/   \_\
```

# Open Standard for Scalable AI Agents

### **The OpenAPI of AI Agents**

*Define once, deploy anywhere. A vendor-neutral specification for portable, composable, and compliant AI agents.*

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm version](https://img.shields.io/npm/v/@bluefly/openstandardagents)](https://www.npmjs.com/package/@bluefly/openstandardagents)
[![CI Status](https://img.shields.io/badge/CI-passing-brightgreen.svg)](https://gitlab.com/blueflyio/openstandardagents/-/pipelines)
[![npm downloads](https://img.shields.io/npm/dm/@bluefly/openstandardagents)](https://www.npmjs.com/package/@bluefly/openstandardagents)

[**Quick Start**](#quick-start-under-60-seconds) • [**Documentation**](https://openstandardagents.org/docs/) • [**Examples**](https://openstandardagents.org/examples/) • [**Community**](#community)

</div>

---

## Why OSSA?

<table>
<tr>
<td width="25%">

### 🔄 Portability
**One manifest, any provider**

Switch between OpenAI, Anthropic, Azure, or Ollama without changing a single line of code. Runtime bindings abstract implementation from definition.

</td>
<td width="25%">

### 🧩 Composability
**Build workflows from agents**

Compose agents into workflows with parallel execution, conditional branching, and loop control. Orchestrate complex multi-agent systems declaratively.

</td>
<td width="25%">

### 🛡️ Safety
**Built-in guardrails**

Enterprise-grade compliance out of the box. SOC2, FedRAMP, HIPAA, and GDPR controls are first-class schema properties, not afterthoughts.

</td>
<td width="25%">

### 📊 Observability
**Full visibility**

Native OpenTelemetry tracing, structured logging, cost tracking, and performance metrics. Know exactly what your agents are doing and what they cost.

</td>
</tr>
</table>

---

## Quick Start (Under 60 Seconds)

### One-Command Quickstart

```bash
# macOS/Linux
curl -fsSL https://ossa.dev/quickstart.sh | bash

# Or with npx (works everywhere)
npx @bluefly/ossa-cli quickstart

# Windows PowerShell
iwr -useb https://ossa.dev/quickstart.ps1 | iex
```

### Manual Setup

```bash
# Install the CLI
npm install -g @bluefly/ossa-cli

# Create your first agent
ossa init my-agent --type agent
cd my-agent

# Validate the manifest
ossa validate agent.ossa.yaml

# Run it
export ANTHROPIC_API_KEY=sk-ant-...
ossa run agent.ossa.yaml --interactive
```

That's it. You now have a working AI agent defined in a portable, standard format.

[**→ Full Getting Started Guide**](https://openstandardagents.org/docs/getting-started/)

---

## What is OSSA?

**OSSA** (Open Standard for Scalable AI Agents) is a **specification standard** for defining AI agents in a vendor-neutral, portable format—like OpenAPI for REST APIs or Kubernetes manifests for containers.

OSSA is **NOT** a framework. It's a standard that frameworks implement.

### The Three Kinds

OSSA defines three resource types:

<table>
<tr>
<th width="33%">Agent</th>
<th width="33%">Task</th>
<th width="33%">Workflow</th>
</tr>
<tr>
<td>

**LLM-powered agentic loops**

Agents use LLMs to reason, plan, and execute tools. They handle inference, state management, and autonomous decision-making.

```yaml
kind: Agent
spec:
  llm:
    provider: openai
    model: gpt-4
  role: |
    You are a helpful assistant
```

</td>
<td>

**Deterministic operations**

Tasks are pure functions—no LLM required. Use them for data transformation, API calls, batch processing, or system integration.

```yaml
kind: Task
spec:
  type: function
  runtime:
    language: typescript
    entry: transform.ts
```

</td>
<td>

**Orchestrated compositions**

Workflows compose Agents and Tasks into multi-step pipelines with parallel execution, conditionals, and loops.

```yaml
kind: Workflow
spec:
  steps:
    - agent: analyzer
    - parallel:
        - task: transform
        - task: validate
```

</td>
</tr>
</table>

---

## Example: A Complete Agent

This agent can search the web and answer questions with cited sources:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: research-assistant
  version: "1.0.0"
  description: An agent that researches topics and provides cited answers
  labels:
    category: research
    environment: production

spec:
  role: |
    You are a research assistant. When asked a question:
    1. Search for relevant information using the search tool
    2. Analyze and synthesize the results
    3. Provide a clear answer with citations

  llm:
    provider: openai
    model: gpt-4-turbo-preview
    temperature: 0.7
    max_tokens: 2000

  tools:
    - type: function
      name: web_search
      capabilities:
        - name: search
          description: Search the web for information
          input_schema:
            type: object
            properties:
              query:
                type: string
                description: The search query
              num_results:
                type: integer
                default: 5
            required: [query]

  safety:
    input_validation:
      max_length: 1000
      allowed_patterns: ["^[a-zA-Z0-9\\s\\?]+$"]
    output_validation:
      require_citations: true
      max_length: 5000

  observability:
    tracing:
      enabled: true
      provider: opentelemetry
    logging:
      level: info
      structured: true
    metrics:
      track_costs: true
      track_latency: true
```

Save this as `research-assistant.ossa.yaml` and run:

```bash
ossa validate research-assistant.ossa.yaml
ossa run research-assistant.ossa.yaml --input "What is quantum computing?"
```

[**→ See More Examples**](https://openstandardagents.org/examples/)

---

## Features

### 🌐 20+ LLM Providers

Switch providers without changing your agent definition:

- **OpenAI** (GPT-4, GPT-3.5)
- **Anthropic** (Claude 3.5, Claude 3)
- **Google** (Gemini Pro, Gemini Ultra)
- **Azure OpenAI**
- **AWS Bedrock**
- **Ollama** (local models)
- **Mistral AI**
- **Cohere**
- And more...

### 🛠️ MCP Tool Support

Native integration with [Model Context Protocol](https://modelcontextprotocol.io/) for standardized tool definitions:

```yaml
tools:
  - type: mcp
    server: filesystem
    capabilities:
      - read_file
      - write_file
      - list_directory
```

### 💬 Agent-to-Agent Messaging

Built-in pub/sub messaging for multi-agent coordination:

```yaml
spec:
  messaging:
    publishes:
      - channel: task.completed
    subscribes:
      - channel: task.started
        handler: on_task_started
    reliability:
      deliveryGuarantee: at-least-once
```

### 🔒 Safety Controls

Enterprise-grade security and compliance:

- Input/output validation
- Content filtering
- Rate limiting
- Audit logging
- Data boundary controls
- PII detection and redaction

### 💰 Cost Tracking

Track costs across providers with unified metrics:

```yaml
observability:
  metrics:
    track_costs: true
    cost_alerts:
      - threshold: 10.00
        action: notify
```

---

## Installation

### npm

```bash
npm install -g @bluefly/openstandardagents
```

### yarn

```bash
yarn global add @bluefly/openstandardagents
```

### pnpm

```bash
pnpm add -g @bluefly/openstandardagents
```

### Homebrew (Coming Soon)

```bash
brew install ossa
```

### Docker

```bash
docker pull bluefly/ossa:latest
docker run -v $(pwd):/workspace bluefly/ossa validate agent.ossa.yaml
```

---

## Documentation

<table>
<tr>
<td width="50%">

### Getting Started
- [Installation Guide](https://openstandardagents.org/docs/installation/)
- [Your First Agent](https://openstandardagents.org/docs/getting-started/first-agent/)
- [Core Concepts](https://openstandardagents.org/docs/concepts/)
- [CLI Reference](https://openstandardagents.org/docs/cli/)

### Examples & Guides
- [Example Gallery](https://openstandardagents.org/examples/)
- [Framework Integration](https://openstandardagents.org/docs/integrations/)
- [Production Deployment](https://openstandardagents.org/docs/deployment/)
- [Best Practices](https://openstandardagents.org/docs/best-practices/)

</td>
<td width="50%">

### API Reference
- [Schema Reference](https://openstandardagents.org/schema/)
- [Specification v0.3.0](https://github.com/blueflyio/openstandardagents/blob/main/spec/v0.3.0/ossa-0.3.0.schema.json)
- [TypeScript API](https://openstandardagents.org/docs/api/typescript/)
- [Python API](https://openstandardagents.org/docs/api/python/)

### Migration & Advanced
- [Migration Guide](https://openstandardagents.org/docs/migration/)
- [Custom Extensions](https://openstandardagents.org/docs/advanced/extensions/)
- [Enterprise Features](https://openstandardagents.org/docs/enterprise/)
- [Troubleshooting](https://openstandardagents.org/docs/troubleshooting/)

</td>
</tr>
</table>

---

## Ecosystem

### Framework Support

OSSA integrates with all major AI frameworks:

- **[LangChain](https://python.langchain.com/)** — Export OSSA agents to LangChain
- **[CrewAI](https://www.crewai.com/)** — Multi-agent orchestration
- **[AutoGen](https://microsoft.github.io/autogen/)** — Microsoft's agent framework
- **[LlamaIndex](https://www.llamaindex.ai/)** — RAG and data agents
- **[LangGraph](https://langchain-ai.github.io/langgraph/)** — Stateful agent graphs
- **[Semantic Kernel](https://learn.microsoft.com/en-us/semantic-kernel/)** — Microsoft's AI orchestration

### Platform Support

Deploy OSSA agents anywhere:

- **Kubernetes** — Native KAgent integration
- **Docker** — Containerized agents
- **AWS** — Lambda, ECS, Bedrock
- **Azure** — Functions, Container Apps, OpenAI
- **GCP** — Cloud Run, Vertex AI

### Tool Integrations

- **[MCP](https://modelcontextprotocol.io/)** — Model Context Protocol
- **[Drupal](https://www.drupal.org/)** — CMS integration
- **[LibreChat](https://www.librechat.ai/)** — Chat interface
- **[Cursor](https://cursor.sh/)** — AI-powered IDE
- **[VS Code](https://code.visualstudio.com/)** — Editor extensions

---

## Community

We're building OSSA in the open. Join us!

### Contributing

We welcome contributions of all kinds:

1. **Code** — Fork the repo, create a branch, submit a PR
2. **Documentation** — Improve guides, fix typos, add examples
3. **Feedback** — Open issues, suggest features, share use cases
4. **Community** — Answer questions, help others, share your agents

See our [**Contributing Guide**](CONTRIBUTING.md) for details.

### Get Help & Connect

- **[GitHub Discussions](https://github.com/blueflyio/openstandardagents/discussions)** — Ask questions, share ideas
- **[Discord Community](https://discord.gg/ossa)** — Real-time chat and support
- **[Stack Overflow](https://stackoverflow.com/questions/tagged/ossa)** — Technical Q&A (tag: `ossa`)
- **[Twitter/X](https://twitter.com/openstandardagi)** — Updates and announcements

### Stay Updated

- **[Blog](https://openstandardagents.org/blog/)** — Tutorials, case studies, announcements
- **[Newsletter](https://openstandardagents.org/newsletter/)** — Monthly updates
- **[Changelog](CHANGELOG.md)** — Release notes and migration guides

---

## Comparison

How does OSSA compare to other AI agent standards and frameworks?

<table>
<tr>
<th>Feature</th>
<th>OSSA</th>
<th>LangChain</th>
<th>AutoGen</th>
<th>MCP</th>
<th>Semantic Kernel</th>
</tr>
<tr>
<td><strong>Vendor Neutral</strong></td>
<td>✅ Yes</td>
<td>❌ No</td>
<td>❌ No</td>
<td>✅ Yes</td>
<td>❌ No</td>
</tr>
<tr>
<td><strong>Formal Standard</strong></td>
<td>✅ Yes</td>
<td>❌ No</td>
<td>❌ No</td>
<td>✅ Yes</td>
<td>❌ No</td>
</tr>
<tr>
<td><strong>Multi-Runtime</strong></td>
<td>✅ Full</td>
<td>🟡 Partial</td>
<td>🟡 Partial</td>
<td>✅ Full</td>
<td>🟡 Partial</td>
</tr>
<tr>
<td><strong>Enterprise Governance</strong></td>
<td>✅ Yes</td>
<td>❌ No</td>
<td>❌ No</td>
<td>❌ No</td>
<td>🟡 Partial</td>
</tr>
<tr>
<td><strong>Compliance Ready</strong></td>
<td>✅ Yes</td>
<td>❌ No</td>
<td>❌ No</td>
<td>❌ No</td>
<td>❌ No</td>
</tr>
<tr>
<td><strong>Full Agent Lifecycle</strong></td>
<td>✅ Yes</td>
<td>✅ Yes</td>
<td>✅ Yes</td>
<td>❌ No</td>
<td>✅ Yes</td>
</tr>
<tr>
<td><strong>Open Source</strong></td>
<td>✅ Apache 2.0</td>
<td>✅ MIT</td>
<td>✅ MIT</td>
<td>✅ MIT</td>
<td>✅ MIT</td>
</tr>
</table>

**OSSA** is a vendor-neutral **specification standard** (like OpenAPI)
**LangChain/AutoGen/Semantic Kernel** are framework-specific **implementations**
**MCP** is a formal standard for **context protocol**, not full agent lifecycle

---

## License

**Apache License 2.0**

OSSA is open source and free to use for commercial and non-commercial purposes.

See [**LICENSE**](LICENSE) for full terms.

---

## Links

<table>
<tr>
<td width="50%">

### Development
- **GitLab** (Primary): [gitlab.com/blueflyio/openstandardagents](https://gitlab.com/blueflyio/openstandardagents)
- **GitHub** (Mirror): [github.com/blueflyio/openstandardagents](https://github.com/blueflyio/openstandardagents)
- **npm Package**: [@bluefly/openstandardagents](https://www.npmjs.com/package/@bluefly/openstandardagents)

</td>
<td width="50%">

### Community
- **Website**: [openstandardagents.org](https://openstandardagents.org)
- **Documentation**: [openstandardagents.org/docs](https://openstandardagents.org/docs)
- **Discord**: [discord.gg/ossa](https://discord.gg/ossa)
- **Twitter/X**: [@openstandardagi](https://twitter.com/openstandardagi)

</td>
</tr>
</table>

---

<div align="center">

**Built with ❤️ by the open source community**

[Report Bug](https://github.com/blueflyio/openstandardagents/issues) • [Request Feature](https://github.com/blueflyio/openstandardagents/issues) • [Ask Question](https://github.com/blueflyio/openstandardagents/discussions)

*Note: All development happens on GitLab. GitHub is a read-only mirror.*

</div>
