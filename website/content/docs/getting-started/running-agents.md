---
title: "Running Agents"
---

# Running Agents

Learn how to run OSSA agents using the CLI.

## Prerequisites

- Node.js 18+
- npm or yarn
- API key for your LLM provider

## Installation

```bash
npm install -g @bluefly/openstandardagents
```

## Quick Start

### 1. Set your API key

```bash
export OPENAI_API_KEY=sk-...
```

### 2. Create an agent manifest

```yaml
# support-agent.ossa.yaml
apiVersion: ossa/v0.2.3
kind: Agent

metadata:
  name: support-agent
  version: 1.0.0
  description: Customer support agent

spec:
  role: |
    You are a helpful customer support agent.
    Answer questions about orders and shipping.

  llm:
    provider: openai
    model: gpt-4o-mini
    temperature: 0.7
```

### 3. Run the agent

```bash
# Interactive mode
ossa run support-agent.ossa.yaml

# Single message
ossa run support-agent.ossa.yaml -m "Help me track my order"

# Verbose (show tool calls)
ossa run support-agent.ossa.yaml -v
```

## Command Options

| Option | Description |
|--------|-------------|
| `-r, --runtime` | Runtime adapter (default: openai) |
| `-v, --verbose` | Show tool calls |
| `-m, --message` | Single message mode |
| `--no-validate` | Skip validation |
| `--max-turns` | Max tool call iterations |

## Supported Runtimes

| Runtime | Status | Provider |
|---------|--------|----------|
| openai | Available | OpenAI API |
| anthropic | Coming Soon | Anthropic Claude |
| ollama | Coming Soon | Local LLMs |
| gemini | Coming Soon | Google AI |

## Adding Tools

Define tools in your manifest:

```yaml
extensions:
  openai_agents:
    tools_mapping:
      - ossa_capability: order_tracking
        openai_tool_name: get_order_status
        description: Get order status by ID
        parameters:
          type: object
          properties:
            order_id:
              type: string
          required: [order_id]
```

## Next Steps

- [Manifest Reference](/docs/schema-reference)
- [Framework Extensions](/docs/openapi-extensions)
- [Drupal Integration](/docs/integrations/drupal)
