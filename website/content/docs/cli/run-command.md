---
title: "ossa run - CLI Reference"
---

# ossa run

Run an OSSA agent interactively or with a single message.

## Synopsis

```bash
ossa run <path> [options]
```

## Description

The `ossa run` command executes an OSSA agent using the specified runtime adapter. It supports both interactive REPL mode for ongoing conversations and single-message mode for one-off queries.

The command:
1. Loads the agent manifest from the specified path
2. Validates the manifest (unless `--no-validate` is used)
3. Initializes the runtime adapter (currently OpenAI)
4. Starts either interactive or single-message mode
5. Manages conversation history and tool execution

## Arguments

### `<path>`

**Required.** Path to the OSSA agent manifest file.

Supported formats:
- YAML (`.yaml`, `.yml`, `.ossa.yaml`)
- JSON (`.json`, `.ossa.json`)

**Examples:**
```bash
ossa run agent.ossa.yaml
ossa run ./agents/support-agent.ossa.json
ossa run /path/to/my-agent.yaml
```

## Options

### `-r, --runtime <runtime>`

Select the runtime adapter to use for agent execution.

**Default:** `openai`

**Available runtimes:**
- `openai` - OpenAI API (GPT-4, GPT-3.5, etc.)

**Coming soon:**
- `anthropic` - Anthropic Claude
- `ollama` - Local LLMs
- `gemini` - Google AI

**Examples:**
```bash
ossa run agent.ossa.yaml --runtime openai
ossa run agent.ossa.yaml -r openai
```

### `-v, --verbose`

Enable verbose output showing detailed execution information.

**Default:** `false`

**Verbose output includes:**
- Manifest validation details
- Tool call names and arguments
- Tool execution results
- Conversation flow
- Error stack traces

**Examples:**
```bash
ossa run agent.ossa.yaml --verbose
ossa run agent.ossa.yaml -v
```

**Sample verbose output:**
```
✓ Agent manifest validated
✓ Agent 'my-agent' loaded
  Model: gpt-4o-mini
  Tools: search, calculate

[Calling 2 tool(s)...]
  → search({"query": "weather today"})
  ← Weather: Sunny, 72°F
  → calculate({"expression": "72 * 1.8 + 32"})
  ← Result: 161.6
```

### `-m, --message <message>`

Execute a single message and exit (non-interactive mode).

**Default:** Interactive REPL mode

**Examples:**
```bash
ossa run agent.ossa.yaml -m "What is the weather?"
ossa run agent.ossa.yaml --message "Analyze this data"
```

**Behavior:**
- Sends the message to the agent
- Waits for the response
- Prints the response
- Exits with code 0

### `--no-validate`

Skip manifest validation before running the agent.

**Default:** Validation enabled

**Use cases:**
- Faster startup when you know the manifest is valid
- Testing during development
- Running agents with custom extensions

**Warning:** Skipping validation may lead to runtime errors if the manifest is invalid.

**Examples:**
```bash
ossa run agent.ossa.yaml --no-validate
```

### `--max-turns <turns>`

Set the maximum number of tool call iterations.

**Default:** `10`

**Purpose:** Prevents infinite loops when tools call other tools recursively.

**Examples:**
```bash
ossa run agent.ossa.yaml --max-turns 5
ossa run agent.ossa.yaml --max-turns 20
```

**Behavior:**
- Each tool call counts as one turn
- When max turns is reached, the agent returns: `"Max turns reached without completion"`
- Increase this value for complex multi-step tasks

## Interactive Mode

When no `-m` flag is provided, the command enters interactive REPL mode.

### Features

- **Persistent conversation:** The agent remembers previous messages
- **Tool execution:** Tools are called automatically as needed
- **Exit commands:** Type `exit` or `quit` to end the session
- **Keyboard interrupt:** Press Ctrl+C to force quit

### Example Session

```bash
$ ossa run support-agent.ossa.yaml

Loading agent: support-agent.ossa.yaml
✓ Agent 'support-agent' loaded
  Model: gpt-4o-mini
  Tools: order_lookup, shipping_status

Entering interactive mode. Type "exit" to quit.

You: What's the status of order #12345?
[Calling 1 tool(s)...]
  → order_lookup({"order_id": "12345"})
  ← Order found: Shipped on 2024-01-15

Agent: Your order #12345 was shipped on January 15, 2024. It should arrive within 3-5 business days.

You: When will it arrive?

Agent: Based on the shipping date of January 15, 2024, your order should arrive between January 18-22, 2024.

You: exit

Goodbye!
```

## Single Message Mode

Use the `-m` flag to send a single message and exit.

### Example

```bash
$ ossa run agent.ossa.yaml -m "What is 2+2?"

Loading agent: agent.ossa.yaml
✓ Agent 'calculator' loaded
  Model: gpt-4o-mini
  Tools: calculate

---

Agent: The answer is 4.
```

## Environment Variables

### Required

#### `OPENAI_API_KEY`

Your OpenAI API key. Required when using the OpenAI runtime.

```bash
export OPENAI_API_KEY=sk-your-key-here
```

**Error if not set:**
```
Error: OPENAI_API_KEY environment variable not set
Set it with: export OPENAI_API_KEY=sk-...
```

### Optional

#### `OPENAI_ORG_ID`

Your OpenAI organization ID (for organization-scoped API keys).

```bash
export OPENAI_ORG_ID=org-your-org-id
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (validation failed, API error, file not found, etc.) |

## Examples

### Basic Interactive Mode

```bash
ossa run my-agent.ossa.yaml
```

### Single Message with Verbose Output

```bash
ossa run my-agent.ossa.yaml -v -m "Hello, world!"
```

### Skip Validation for Faster Startup

```bash
ossa run my-agent.ossa.yaml --no-validate
```

### Custom Max Turns

```bash
ossa run complex-agent.ossa.yaml --max-turns 20
```

### Combine Multiple Options

```bash
ossa run agent.ossa.yaml -v -m "Complex query" --max-turns 15 --no-validate
```

## Error Handling

### Validation Errors

```bash
$ ossa run invalid.ossa.yaml

Loading agent: invalid.ossa.yaml
✗ Agent manifest validation failed

  1. /metadata/name: must match pattern "^[a-z0-9]([-a-z0-9]*[a-z0-9])?$"
  2. /spec/role: must have required property 'role'
```

**Solution:** Fix the manifest and try again, or use `--no-validate` to skip validation.

### API Key Missing

```bash
$ ossa run agent.ossa.yaml

Loading agent: agent.ossa.yaml
Error: OPENAI_API_KEY environment variable not set
Set it with: export OPENAI_API_KEY=sk-...
```

**Solution:** Set the `OPENAI_API_KEY` environment variable.

### File Not Found

```bash
$ ossa run nonexistent.ossa.yaml

Error: ENOENT: no such file or directory, open 'nonexistent.ossa.yaml'
```

**Solution:** Check the file path and ensure the file exists.

### Runtime Not Supported

```bash
$ ossa run agent.ossa.yaml --runtime anthropic

Loading agent: agent.ossa.yaml
Runtime 'anthropic' not supported yet
Available runtimes: openai
```

**Solution:** Use the OpenAI runtime or wait for additional runtime support.

### Max Turns Reached

```bash
$ ossa run agent.ossa.yaml -m "Complex task"

Loading agent: agent.ossa.yaml
✓ Agent 'my-agent' loaded

Agent: Max turns reached without completion
```

**Solution:** Increase `--max-turns` or simplify the task.

## Manifest Configuration

### Basic Agent

```yaml
apiVersion: ossa/v0.2.8
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0
  description: A simple agent
spec:
  role: You are a helpful assistant
  llm:
    provider: openai
    model: gpt-4o-mini
    temperature: 0.7
```

### Agent with Tools

```yaml
apiVersion: ossa/v0.2.8
kind: Agent
metadata:
  name: tool-agent
  version: 1.0.0
spec:
  role: You are a helpful assistant with tools
  llm:
    provider: openai
    model: gpt-4o-mini
extensions:
  openai_agents:
    model: gpt-4o-mini
    instructions: You are a helpful assistant
    tools_mapping:
      - ossa_capability: search
        openai_tool_name: web_search
        description: Search the web
        parameters:
          type: object
          properties:
            query:
              type: string
              description: Search query
          required: [query]
```

### Advanced Configuration

```yaml
apiVersion: ossa/v0.2.8
kind: Agent
metadata:
  name: advanced-agent
  version: 1.0.0
spec:
  role: You are an advanced assistant
  llm:
    provider: openai
    model: gpt-4-turbo
    temperature: 0.8
    maxTokens: 2000
extensions:
  openai_agents:
    model: gpt-4-turbo
    instructions: Custom system prompt
    tools_mapping:
      - ossa_capability: tool1
        openai_tool_name: custom_tool
        description: Custom tool
        parameters:
          type: object
          properties:
            param1:
              type: string
    guardrails:
      enabled: true
      max_tool_calls: 10
      timeout_seconds: 300
    memory:
      enabled: true
      type: session
      max_messages: 50
```

## See Also

- [Running Agents Guide](/docs/getting-started/running-agents) - Getting started guide
- [OpenAI Adapter](/docs/adapters/openai-adapter) - OpenAI adapter documentation
- [Manifest Reference](/docs/schema-reference/ossa-manifest) - Complete manifest schema
- [ossa validate](/docs/cli/validate-command) - Validate manifests
- [Migration Guides](/docs/migration-guides) - Migrate from other frameworks
