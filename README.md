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

### 🔄 Portability
**One manifest, any provider**

Switch between OpenAI, Anthropic, Azure, or Ollama without changing a single line of code. Runtime bindings abstract implementation from definition.

### 🧩 Composability
**Build workflows from agents**

Compose agents into workflows with parallel execution, conditional branching, and loop control. Orchestrate complex multi-agent systems declaratively.

### 🛡️ Safety
**Built-in guardrails**

Enterprise-grade compliance out of the box. SOC2, FedRAMP, HIPAA, and GDPR controls are first-class schema properties, not afterthoughts.

### 📊 Observability
**Full visibility**

Native OpenTelemetry tracing, structured logging, cost tracking, and performance metrics. Know exactly what your agents are doing and what they cost.


---

## Quick Start (Under 60 Seconds)

### One-Command Quickstart

```bash
# macOS/Linux
curl -fsSL https://ossa.dev/quickstart.sh | bash

# Or with npx (works everywhere)
npx @bluefly/openstandardagents quickstart

# Windows PowerShell
iwr -useb https://ossa.dev/quickstart.ps1 | iex
```

### Manual Setup

```bash
# Install the CLI
npm install -g @bluefly/openstandardagents

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

#### Agent
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

#### Task
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

#### Workflow
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

---

## What's New in v0.3.2

### 🔐 Access Tiers System
**Enterprise privilege separation built into the spec**

v0.3.2 introduces a 4-tier access hierarchy for agents:

| Tier | Name | Permissions | Example Agents |
|------|------|-------------|----------------|
| **Tier 1** | Read Only | Analyze, audit, scan (no writes) | security-scanner, code-analyzer |
| **Tier 2** | Write Limited | Docs, tests, drafts only | doc-generator, test-generator |
| **Tier 3** | Write Elevated | Production code with approval | code-assistant, refactorer |
| **Tier 4** | Policy | Full access + governance | compliance-governor |

```yaml
spec:
  access:
    tier: tier_1_read  # NEW: Declare access level
    approval_chain: standard
```

### 🏗️ Workspace Governance Layer
**`.agents-workspace/` for multi-agent management**

```
.agents-workspace/
├── registry/index.yaml       # Agent discovery
├── policies/tool-allowlist.yaml  # MCP permissions
├── policies/security-tiers.yaml  # Access controls
├── orchestration/            # Workflow definitions
└── shared-context/           # Global standards
```

### 🤖 10 Production-Ready Showcase Agents
Consolidated from 60+ agents into optimized examples:
- `code-assistant` - Universal IDE integration
- `security-scanner` - SAST/DAST analysis
- `ci-pipeline` - GitLab/GitHub automation
- `compliance-validator` - SOC2/HIPAA/GDPR
- `workflow-orchestrator` - Multi-agent composition

### 📡 A2A Protocol Support
**Agent-to-Agent discovery with agent-card.json**

```bash
ossa agent-card generate my-agent.ossa.yaml
ossa agent-card validate agent-card.json
```

---

## Example: Security Scanner with Access Tiers (v0.3.2)

This agent demonstrates OSSA v0.3.2's **access tier system**—a Tier 1 (read-only) agent that can analyze but never modify:

```yaml
apiVersion: ossa/v0.3.2
kind: Agent

metadata:
  name: security-scanner
  version: "1.0.0"
  description: SAST/DAST security analysis agent
  labels:
    ossa.dev/category: security
    ossa.dev/tier: tier_1_read  # Access tier label

spec:
  # NEW v0.3.2: Access tier declaration
  access:
    tier: tier_1_read           # Read-only - cannot modify code
    approval_chain: none        # No approval needed for read ops
    audit_level: enhanced       # Full audit trail

  role: |
    You are a security scanner. Analyze code for vulnerabilities,
    check dependencies for CVEs, and generate security reports.
    You have READ-ONLY access - you cannot modify any files.

  llm:
    provider: anthropic
    model: claude-sonnet-4
    temperature: 0.1            # Low temp for consistent analysis

  capabilities:
    - type: function
      name: scan.sast
      description: Static application security testing
    - type: function
      name: scan.dependencies
      description: Check dependencies for known CVEs
    - type: function
      name: report.generate
      description: Generate security findings report

  tools:
    - type: mcp
      server: filesystem
      capabilities: [read_file, list_directory]  # Read-only!
    - type: function
      name: trivy_scan
      description: Container vulnerability scanning

  # Safety enforces the tier restrictions
  safety:
    constraints:
      - "NEVER write, edit, or delete any files"
      - "NEVER execute commands that modify state"
      - "Report findings only - never auto-fix"
    prohibited_tools:
      - file.write
      - file.edit
      - terminal.run

  # NEW v0.3.2: Separation of duties
  separation_of_duties:
    cannot_be_same_as:
      - code-assistant    # Scanner can't also be the fixer
      - deployment-agent  # Scanner can't also deploy
    requires_review_by:
      - security-team

  observability:
    tracing:
      enabled: true
      provider: opentelemetry
    metrics:
      track_findings: true
      track_scan_duration: true
```

**What v0.3.2 Access Tiers provide:**
- **Privilege Separation**: Tier 1 agents physically cannot write files
- **Audit Trail**: All actions logged with tier context
- **Separation of Duties**: Scanner can't also be the fixer
- **Approval Chains**: Higher tiers require explicit approval

```bash
# Validate access tier compliance
ossa validate security-scanner.ossa.yaml --check-access-tiers

# Run with tier enforcement
ossa run security-scanner.ossa.yaml --enforce-tier
```

[**→ See Access Tiers Examples**](spec/v0.3.2/examples/access-tiers/)

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

### Reference
- **Getting Started**: [openstandardagents.org/docs/getting-started/](https://openstandardagents.org/docs/getting-started/)
- **Full Documentation**: [openstandardagents.org/docs/](https://openstandardagents.org/docs/)
- **Schema Reference**: [openstandardagents.org/schema/](https://openstandardagents.org/schema/)
- **Specification**: [spec/v0.3.2/ossa-0.3.2.schema.json](https://github.com/blueflyio/openstandardagents/blob/main/spec/v0.3.2/ossa-0.3.2.schema.json)
- **Messaging Extension**: [spec/v0.3.2/messaging.md](spec/v0.3.2/messaging.md) - Agent-to-agent messaging (v0.3.2+)
- **Examples**: [openstandardagents.org/examples/](https://openstandardagents.org/examples/)
- **Blog**: [openstandardagents.org/blog/](https://openstandardagents.org/blog/)

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

### Development
- **GitLab** (Primary): [gitlab.com/blueflyio/openstandardagents](https://gitlab.com/blueflyio/openstandardagents)
- **GitHub** (Mirror): [github.com/blueflyio/openstandardagents](https://github.com/blueflyio/openstandardagents)
- **npm Package**: [@bluefly/openstandardagents](https://www.npmjs.com/package/@bluefly/openstandardagents)

### Community
- **Website**: [openstandardagents.org](https://openstandardagents.org)
- **Documentation**: [openstandardagents.org/docs](https://openstandardagents.org/docs)
- **Discord**: [discord.gg/ossa](https://discord.gg/ossa)
- **Twitter/X**: [@openstandardagi](https://twitter.com/openstandardagi)

---

<div align="center">

**Built with ❤️ by the open source community**

[Report Bug](https://github.com/blueflyio/openstandardagents/issues) • [Request Feature](https://github.com/blueflyio/openstandardagents/issues) • [Ask Question](https://github.com/blueflyio/openstandardagents/discussions)

*Note: All development happens on GitLab. GitHub is a read-only mirror.*

</div>
