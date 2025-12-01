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
npm install -g @bluefly/open-standards-scalable-agents
```

## Quick Start

### 1. Set your API key

```bash
export OPENAI_API_KEY=sk-...
```

### 2. Create an agent manifest

```yaml
# support-agent.ossa.yaml
apiVersion: ossa/v0.2.x
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

| Option | Description | Default |
|--------|-------------|---------|
| `-r, --runtime <runtime>` | Runtime adapter to use | `openai` |
| `-v, --verbose` | Show detailed output including tool calls | `false` |
| `-m, --message <message>` | Single message mode (non-interactive) | Interactive REPL |
| `--no-validate` | Skip manifest validation before running | Validation enabled |
| `--max-turns <turns>` | Maximum tool call iterations | `10` |

### Detailed Option Descriptions

#### Runtime Selection (`-r, --runtime`)

Choose which runtime adapter to use for executing your agent:

```bash
# Use OpenAI (default)
ossa run agent.ossa.yaml --runtime openai

# Short form
ossa run agent.ossa.yaml -r openai
```

#### Verbose Mode (`-v, --verbose`)

Enable verbose output to see detailed information about tool calls and execution:

```bash
ossa run agent.ossa.yaml --verbose

# Shows:
# - Tool call names and arguments
# - Tool execution results
# - Conversation flow
# - Validation details
```

#### Single Message Mode (`-m, --message`)

Execute a single message and exit (non-interactive):

```bash
# Ask a single question
ossa run agent.ossa.yaml -m "What is the weather today?"

# Long form
ossa run agent.ossa.yaml --message "Analyze this data"
```

#### Skip Validation (`--no-validate`)

Skip manifest validation for faster startup (use with caution):

```bash
ossa run agent.ossa.yaml --no-validate
```

**Note:** Validation is recommended to catch configuration errors early.

#### Max Turns (`--max-turns`)

Limit the number of tool call iterations to prevent infinite loops:

```bash
# Allow up to 5 tool call iterations
ossa run agent.ossa.yaml --max-turns 5

# Default is 10
ossa run agent.ossa.yaml --max-turns 10
```

## Supported Runtimes

| Runtime | Status | Provider |
|---------|--------|----------|
| openai | Available | OpenAI API |
| anthropic | Coming Soon | Anthropic Claude |
| ollama | Coming Soon | Local LLMs |
| gemini | Coming Soon | Google AI |

## Adding Tools

Define tools in your manifest using the OpenAI extension:

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
              description: The order ID to track
          required: [order_id]
```

## Interactive REPL Mode

When you run an agent without the `-m` flag, you enter interactive mode:

```bash
ossa run agent.ossa.yaml

# Output:
# ✓ Agent 'my-agent' loaded
#   Model: gpt-4o-mini
#   Tools: search, calculate
#
# Entering interactive mode. Type "exit" to quit.
#
# You: 
```

In interactive mode:
- Type your messages and press Enter
- The agent maintains conversation history
- Type `exit` or `quit` to end the session
- Press Ctrl+C to force quit

## Troubleshooting

### API Key Not Set

**Error:** `OPENAI_API_KEY environment variable not set`

**Solution:**
```bash
export OPENAI_API_KEY=sk-your-key-here
```

### Validation Errors

**Error:** `Agent manifest validation failed`

**Solution:** Check your manifest against the schema:
```bash
ossa validate agent.ossa.yaml --verbose
```

### Runtime Not Supported

**Error:** `Runtime 'xyz' not supported yet`

**Solution:** Use the OpenAI runtime (currently the only supported runtime):
```bash
ossa run agent.ossa.yaml --runtime openai
```

### Max Turns Reached

**Error:** `Max turns reached without completion`

**Solution:** Increase the max turns limit:
```bash
ossa run agent.ossa.yaml --max-turns 20
```

## Advanced Usage

### Combining Options

You can combine multiple options:

```bash
# Verbose single message with custom max turns
ossa run agent.ossa.yaml -v -m "Complex query" --max-turns 15

# Skip validation in verbose mode
ossa run agent.ossa.yaml --no-validate --verbose
```

### Using with Different Models

Specify the model in your manifest:

```yaml
spec:
  llm:
    provider: openai
    model: gpt-4-turbo
    temperature: 0.8
    maxTokens: 2000
```

Or use the OpenAI extension:

```yaml
extensions:
  openai_agents:
    model: gpt-4-turbo
    instructions: Custom system prompt
```

### Environment Variables

The run command respects these environment variables:

- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `OPENAI_ORG_ID` - Your OpenAI organization ID (optional)

## Examples

### Customer Support Agent

```bash
# Create the manifest
cat > support.ossa.yaml << EOF
apiVersion: ossa/v0.2.8
kind: Agent
metadata:
  name: support-agent
  version: 1.0.0
spec:
  role: You are a helpful customer support agent
  llm:
    provider: openai
    model: gpt-4o-mini
EOF

# Run interactively
ossa run support.ossa.yaml

# Or single message
ossa run support.ossa.yaml -m "How do I reset my password?"
```

### Code Assistant with Tools

```bash
# See examples/openai/swarm-agent.ossa.json for a complete example
ossa run examples/openai/swarm-agent.ossa.json -v
```

## Next Steps

- [CLI Reference](/docs/cli/run-command) - Complete command reference
- [OpenAI Adapter](/docs/adapters/openai-adapter) - OpenAI adapter configuration
- [Manifest Reference](/docs/schema-reference) - Full manifest schema
- [Framework Extensions](/docs/openapi-extensions) - Extension system
- [Migration Guides](/docs/migration-guides) - Migrate from other frameworks
