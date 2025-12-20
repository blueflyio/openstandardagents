---
title: "OpenAI Adapter"
---

# OpenAI Adapter

The OpenAI adapter enables OSSA agents to run using OpenAI's function calling API, supporting GPT-4, GPT-3.5, and other OpenAI models.

## Overview

The OpenAI adapter:
- Converts OSSA manifests to OpenAI function calling format
- Manages conversation history and context
- Executes tool calls with custom handlers
- Supports OpenAI-specific extensions
- Handles streaming and token limits

## Quick Start

### 1. Set API Key

```bash
export OPENAI_API_KEY=sk-your-key-here
```

### 2. Create Agent Manifest

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0
spec:
  role: You are a helpful assistant
  llm:
    provider: openai
    model: gpt-4o-mini
```

### 3. Run Agent

```bash
ossa run my-agent.ossa.yaml
```

## Configuration

### Model Selection

The adapter selects the model in this priority order:

1. **OpenAI Extension** (highest priority)
2. **LLM Config**
3. **Default** (`gpt-4o-mini`)

#### Using OpenAI Extension

```yaml
extensions:
  openai_agents:
    model: gpt-4-turbo
```

#### Using LLM Config

```yaml
spec:
  llm:
    provider: openai
    model: gpt-3.5-turbo
```

#### Default Model

If no model is specified, the adapter uses `gpt-4o-mini`.

### System Prompt

The adapter selects the system prompt in this priority order:

1. **OpenAI Extension Instructions** (highest priority)
2. **Spec Role**

#### Using OpenAI Extension

```yaml
extensions:
  openai_agents:
    instructions: |
      You are a specialized customer support agent.
      Always be polite and helpful.
      Escalate complex issues to human agents.
```

#### Using Spec Role

```yaml
spec:
  role: You are a helpful assistant
```

### LLM Parameters

Configure temperature, max tokens, and other parameters:

```yaml
spec:
  llm:
    provider: openai
    model: gpt-4-turbo
    temperature: 0.8
    maxTokens: 2000
```

**Parameters:**
- `temperature` (0.0-2.0): Controls randomness. Default: `0.7`
- `maxTokens`: Maximum tokens in response. Default: model's maximum

## Tools and Function Calling

### Tool Mapping

The OpenAI adapter converts OSSA tools to OpenAI function calling format using the `tools_mapping` extension.

#### Basic Tool Mapping

```yaml
extensions:
  openai_agents:
    tools_mapping:
      - ossa_capability: search
        openai_tool_name: web_search
        description: Search the web for information
        parameters:
          type: object
          properties:
            query:
              type: string
              description: The search query
          required: [query]
```

#### Multiple Tools

```yaml
extensions:
  openai_agents:
    tools_mapping:
      - ossa_capability: search
        openai_tool_name: web_search
        description: Search the web
        parameters:
          type: object
          properties:
            query:
              type: string
          required: [query]
      
      - ossa_capability: calculate
        openai_tool_name: calculator
        description: Perform mathematical calculations
        parameters:
          type: object
          properties:
            expression:
              type: string
              description: Mathematical expression to evaluate
          required: [expression]
      
      - ossa_capability: get_weather
        openai_tool_name: weather_api
        description: Get current weather for a location
        parameters:
          type: object
          properties:
            location:
              type: string
              description: City name or coordinates
            units:
              type: string
              enum: [celsius, fahrenheit]
              default: celsius
          required: [location]
```

### Tool Parameters

Tool parameters follow the JSON Schema format:

```yaml
parameters:
  type: object
  properties:
    param_name:
      type: string | number | boolean | array | object
      description: Parameter description
      enum: [value1, value2]  # Optional: restrict to specific values
      default: default_value   # Optional: default value
  required: [param1, param2]  # Optional: required parameters
```

**Supported types:**
- `string` - Text values
- `number` - Numeric values (integers or floats)
- `boolean` - True/false values
- `array` - Lists of values
- `object` - Nested objects

### Tool Naming

If `openai_tool_name` is not provided, the adapter uses `ossa_capability` as the tool name:

```yaml
extensions:
  openai_agents:
    tools_mapping:
      - ossa_capability: my_tool
        # openai_tool_name defaults to "my_tool"
        description: My tool
        parameters:
          type: object
          properties: {}
```

### Spec Tools

The adapter also supports tools defined in `spec.tools`:

```yaml
spec:
  tools:
    - type: function
      name: simple_tool
```

These are converted to OpenAI functions with default parameters.

## Conversation Management

### Initialization

The adapter initializes conversations with a system message:

```typescript
adapter.initialize();
```

This sets up the conversation with:
1. System message (from instructions or role)
2. Empty message history

### Message History

The adapter maintains full conversation history:

```
[System] You are a helpful assistant
[User] What is the weather?
[Assistant] [Tool Call: get_weather]
[Tool] Weather: Sunny, 72°F
[Assistant] The weather is sunny and 72°F
[User] What about tomorrow?
[Assistant] ...
```

### Chat Method

Send messages and get responses:

```typescript
const response = await adapter.chat('Hello', {
  verbose: true,
  maxTurns: 10
});
```

**Options:**
- `verbose` (boolean): Show tool calls and execution details
- `maxTurns` (number): Maximum tool call iterations (default: 10)

## Tool Execution

### Default Behavior

Without custom handlers, tools return placeholder responses:

```
Tool 'tool_name' executed with args: {"param": "value"}
```

### Custom Tool Handlers

Register custom handlers for tool execution:

```typescript
import { OpenAIAdapter } from '@bluefly/openstandardagents';

const adapter = new OpenAIAdapter(manifest);
adapter.initialize();

// Register handler
adapter.registerToolHandler('web_search', async (args) => {
  const { query } = args;
  // Perform actual search
  const results = await searchWeb(query);
  return JSON.stringify(results);
});

// Use the agent
const response = await adapter.chat('Search for OSSA');
```

### Error Handling

Tool execution errors are caught and returned to the agent:

```typescript
adapter.registerToolHandler('risky_tool', async (args) => {
  throw new Error('Something went wrong');
});

// Agent receives: "Error executing risky_tool: Something went wrong"
```

### Unknown Tools

If a tool is called but not registered:

```
Error: Tool 'unknown_tool' not found
```

## Advanced Features

### Guardrails

Configure safety limits and constraints:

```yaml
extensions:
  openai_agents:
    guardrails:
      enabled: true
      max_tool_calls: 10
      timeout_seconds: 300
```

**Note:** Guardrails are defined in the manifest but enforcement depends on the implementation.

### Memory Configuration

Configure conversation memory:

```yaml
extensions:
  openai_agents:
    memory:
      enabled: true
      type: session
      max_messages: 50
```

**Memory types:**
- `session` - In-memory for the current session
- `persistent` - Saved across sessions (requires implementation)

### Max Turns

Prevent infinite loops with max turns:

```bash
ossa run agent.ossa.yaml --max-turns 20
```

When max turns is reached:
```
Max turns reached without completion
```

## API Integration

### OpenAI SDK

The adapter uses the official OpenAI SDK:

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

### API Calls

Each chat interaction makes one or more API calls:

1. **Initial call** - Send user message
2. **Tool calls** - If the model requests tools
3. **Follow-up call** - Send tool results back
4. **Repeat** - Until response or max turns

### Rate Limits

Be aware of OpenAI rate limits:
- Requests per minute (RPM)
- Tokens per minute (TPM)
- Tokens per day (TPD)

Use `--max-turns` to limit API calls.

## Examples

### Basic Chat Agent

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: chat-agent
  version: 1.0.0
spec:
  role: You are a friendly chat assistant
  llm:
    provider: openai
    model: gpt-4o-mini
    temperature: 0.9
```

### Customer Support Agent

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: support-agent
  version: 1.0.0
spec:
  role: You are a customer support agent
  llm:
    provider: openai
    model: gpt-4-turbo
    temperature: 0.7
extensions:
  openai_agents:
    instructions: |
      You are a customer support agent for TechCorp.
      Help customers with orders, shipping, and returns.
      Always be polite and professional.
    tools_mapping:
      - ossa_capability: order_lookup
        openai_tool_name: get_order
        description: Look up order by ID
        parameters:
          type: object
          properties:
            order_id:
              type: string
          required: [order_id]
      
      - ossa_capability: shipping_status
        openai_tool_name: get_shipping
        description: Get shipping status
        parameters:
          type: object
          properties:
            tracking_number:
              type: string
          required: [tracking_number]
```

### Code Assistant

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: code-assistant
  version: 1.0.0
spec:
  role: You are a helpful coding assistant
  llm:
    provider: openai
    model: gpt-4-turbo
    temperature: 0.3
    maxTokens: 4000
extensions:
  openai_agents:
    model: gpt-4-turbo
    instructions: |
      You are an expert programming assistant.
      Help users write, debug, and optimize code.
      Provide clear explanations and examples.
    tools_mapping:
      - ossa_capability: execute_code
        openai_tool_name: run_python
        description: Execute Python code safely
        parameters:
          type: object
          properties:
            code:
              type: string
              description: Python code to execute
          required: [code]
      
      - ossa_capability: search_docs
        openai_tool_name: search_documentation
        description: Search programming documentation
        parameters:
          type: object
          properties:
            query:
              type: string
            language:
              type: string
              enum: [python, javascript, typescript, java]
          required: [query, language]
```

### Multi-Tool Agent

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: multi-tool-agent
  version: 1.0.0
spec:
  role: You are a versatile assistant with multiple capabilities
  llm:
    provider: openai
    model: gpt-4o
extensions:
  openai_agents:
    model: gpt-4o
    tools_mapping:
      - ossa_capability: web_search
        description: Search the web
        parameters:
          type: object
          properties:
            query:
              type: string
          required: [query]
      
      - ossa_capability: calculator
        description: Perform calculations
        parameters:
          type: object
          properties:
            expression:
              type: string
          required: [expression]
      
      - ossa_capability: weather
        description: Get weather information
        parameters:
          type: object
          properties:
            location:
              type: string
          required: [location]
      
      - ossa_capability: translate
        description: Translate text
        parameters:
          type: object
          properties:
            text:
              type: string
            target_language:
              type: string
          required: [text, target_language]
    guardrails:
      enabled: true
      max_tool_calls: 15
      timeout_seconds: 300
    memory:
      enabled: true
      type: session
      max_messages: 100
```

## Troubleshooting

### API Key Issues

**Problem:** `OPENAI_API_KEY environment variable not set`

**Solution:**
```bash
export OPENAI_API_KEY=sk-your-key-here
```

### Invalid API Key

**Problem:** `401 Unauthorized`

**Solution:** Check that your API key is valid and has not expired.

### Rate Limit Errors

**Problem:** `429 Too Many Requests`

**Solution:**
- Wait before retrying
- Reduce `--max-turns`
- Use a lower-tier model
- Upgrade your OpenAI plan

### Model Not Found

**Problem:** `404 Model not found`

**Solution:** Check that the model name is correct:
- `gpt-4o-mini` ✓
- `gpt-4-turbo` ✓
- `gpt-3.5-turbo` ✓
- `gpt-4` ✓

### Tool Call Loops

**Problem:** `Max turns reached without completion`

**Solution:**
- Increase `--max-turns`
- Improve tool descriptions
- Add better system instructions
- Check tool handler logic

### Token Limit Exceeded

**Problem:** `This model's maximum context length is...`

**Solution:**
- Reduce `maxTokens`
- Use a model with larger context
- Implement conversation summarization
- Clear conversation history

## Best Practices

### 1. Model Selection

- Use `gpt-4o-mini` for simple tasks (faster, cheaper)
- Use `gpt-4-turbo` for complex reasoning
- Use `gpt-4o` for balanced performance

### 2. Temperature Settings

- `0.0-0.3` - Deterministic, factual responses
- `0.4-0.7` - Balanced creativity and consistency
- `0.8-1.0` - Creative, varied responses
- `1.0+` - Highly creative (use with caution)

### 3. Tool Design

- Keep tool descriptions clear and concise
- Use descriptive parameter names
- Provide parameter descriptions
- Mark required parameters
- Use enums for restricted values

### 4. Error Handling

- Always handle tool execution errors
- Return meaningful error messages
- Log errors for debugging
- Implement retry logic for transient failures

### 5. Cost Optimization

- Use `gpt-4o-mini` when possible
- Set reasonable `maxTokens` limits
- Limit `max_tool_calls` in guardrails
- Monitor API usage

### 6. Security

- Never expose API keys in code
- Use environment variables
- Validate tool inputs
- Sanitize tool outputs
- Implement rate limiting

## See Also

- [ossa run Command](/docs/cli/run-command) - CLI reference
- [Running Agents](/docs/getting-started/running-agents) - Getting started guide
- [Manifest Reference](/docs/schema-reference/ossa-manifest) - Complete schema
- [OpenAI Documentation](https://platform.openai.com/docs) - Official OpenAI docs
- [Migration from OpenAI Swarm](/docs/migration-guides/openai-to-ossa) - Migration guide
