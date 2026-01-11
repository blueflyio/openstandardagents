# Anthropic Runtime Adapter

Production-ready adapter for running OSSA agents using Anthropic's Claude API.

## Features

- ✅ **Multiple Claude Models**: Support for Claude 3.5 Sonnet, Claude 3 Opus, and Claude 3 Haiku
- ✅ **Streaming Responses**: Full streaming support with AsyncGenerator
- ✅ **Tool Calling**: Anthropic's native tool_use format with automatic execution
- ✅ **Multi-turn Conversations**: Automatic conversation history management
- ✅ **Error Handling**: Comprehensive error handling for tool execution and API calls
- ✅ **OSSA Manifest Integration**: Seamless integration with OSSA manifest format
- ✅ **Type Safety**: Full TypeScript typing with Anthropic SDK types
- ✅ **Flexible Configuration**: Support for manifest extensions and fallbacks

## Installation

The adapter uses `@anthropic-ai/sdk` which is already included in the project dependencies.

```bash
npm install @anthropic-ai/sdk
```

## Quick Start

```typescript
import { AnthropicAdapter } from './src/services/runtime/anthropic.adapter.js';

// Create a simple agent
const manifest = {
  apiVersion: 'ossa/v0.3.0',
  kind: 'Agent',
  metadata: {
    name: 'my-agent',
    version: '1.0.0',
  },
  spec: {
    role: 'You are a helpful AI assistant.',
  },
};

// Initialize adapter
const adapter = new AnthropicAdapter(manifest);
adapter.initialize();

// Chat with the agent
const response = await adapter.chat('Hello, how are you?');
console.log(response);
```

## Supported Claude Models

### Claude 3.5 Sonnet (Recommended)
- Model ID: `claude-3-5-sonnet-20241022`
- Best balance of intelligence and speed
- Supports tool use, vision, and extended context

### Claude 3 Opus
- Model ID: `claude-3-opus-20240229`
- Highest intelligence for complex tasks
- Best for reasoning, analysis, and creative tasks

### Claude 3 Haiku
- Model ID: `claude-3-haiku-20250320`
- Fastest, most cost-effective
- Best for simple tasks and high-volume use cases

## Configuration

### Via OSSA Manifest

```typescript
const manifest = {
  apiVersion: 'ossa/v0.3.0',
  kind: 'Agent',
  metadata: {
    name: 'my-agent',
    version: '1.0.0',
  },
  spec: {
    role: 'You are a helpful assistant.',
    llm: {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      maxTokens: 4096,
    },
  },
};
```

### Via Anthropic Extension

The `extensions.anthropic` section takes precedence over `spec.llm`:

```typescript
const manifest = {
  apiVersion: 'ossa/v0.3.0',
  kind: 'Agent',
  metadata: { name: 'my-agent', version: '1.0.0' },
  spec: {
    role: 'Default role',
  },
  extensions: {
    anthropic: {
      model: 'claude-3-opus-20240229',
      system: 'Custom system prompt overrides spec.role',
      max_tokens: 8192,
      temperature: 0.9,
      stop_sequences: ['STOP', 'END'],
      streaming: true,
    },
  },
};
```

## Tool Calling

### Define Tools in Manifest

```typescript
const manifest = {
  apiVersion: 'ossa/v0.3.0',
  kind: 'Agent',
  metadata: { name: 'weather-agent', version: '1.0.0' },
  spec: {
    role: 'You are a weather assistant.',
  },
  extensions: {
    anthropic: {
      tools: [
        {
          name: 'get_weather',
          description: 'Get current weather for a location',
          input_schema: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'City and state, e.g., San Francisco, CA',
              },
              unit: {
                type: 'string',
                enum: ['celsius', 'fahrenheit'],
                description: 'Temperature unit',
              },
            },
            required: ['location'],
          },
        },
      ],
    },
  },
};
```

### Register Tool Handlers

```typescript
const adapter = new AnthropicAdapter(manifest);
adapter.initialize();

// Register handler
adapter.registerToolHandler('get_weather', async (args) => {
  const location = args.location as string;
  const unit = args.unit as string || 'fahrenheit';

  // Call your weather API
  const data = await fetchWeather(location, unit);

  // Return JSON string
  return JSON.stringify(data);
});

// Agent will automatically call tool when needed
const response = await adapter.chat("What's the weather in Seattle?", {
  verbose: true,  // Shows tool execution
  maxTurns: 5,    // Max conversation turns
});
```

### Tool Execution Flow

1. User sends message
2. Claude decides to use a tool
3. Adapter executes registered handler
4. Result sent back to Claude
5. Claude generates final response
6. Process repeats if more tools needed (up to maxTurns)

## Streaming

### Basic Streaming

```typescript
const adapter = new AnthropicAdapter(manifest);
adapter.initialize();

const stream = adapter.chatStream('Write me a story about AI');

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### Streaming with Tools

Tool execution is automatic even in streaming mode:

```typescript
const stream = adapter.chatStream(
  "What's the weather in Paris?",
  { verbose: true }  // Shows tool execution in stream
);

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

## Multi-turn Conversations

Conversation history is automatically managed:

```typescript
const adapter = new AnthropicAdapter(manifest);
adapter.initialize();

// First message
await adapter.chat("My name is Alice");

// Second message (remembers context)
await adapter.chat("What's my name?");  // "Your name is Alice"

// View history
const history = adapter.getConversationHistory();
console.log(history);

// Clear history to start fresh
adapter.clearHistory();
```

## Error Handling

### Tool Execution Errors

Errors are caught and returned as JSON:

```typescript
adapter.registerToolHandler('risky_operation', async (args) => {
  if (args.action === 'fail') {
    throw new Error('Operation failed');
  }
  return JSON.stringify({ success: true });
});

// Error is returned to Claude, which can handle it gracefully
const response = await adapter.chat('Try the risky operation with fail action');
```

### API Errors

Wrap in try-catch for API errors:

```typescript
try {
  const response = await adapter.chat('Hello');
} catch (error) {
  if (error.status === 429) {
    console.error('Rate limit exceeded');
  } else if (error.status === 401) {
    console.error('Invalid API key');
  } else {
    console.error('API error:', error);
  }
}
```

## Advanced Features

### Get Agent Information

```typescript
const info = adapter.getAgentInfo();
console.log(info);
// {
//   name: 'my-agent',
//   model: 'claude-3-5-sonnet-20241022',
//   tools: ['get_weather', 'search'],
//   provider: 'anthropic'
// }
```

### Access Anthropic Client Directly

```typescript
const client = adapter.getClient();

// Use client for advanced features
const response = await client.messages.create({
  model: 'claude-3-opus-20240229',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello' }],
});
```

### Get Available Tools

```typescript
const tools = adapter.getTools();
console.log(tools);
// [
//   {
//     name: 'get_weather',
//     description: '...',
//     input_schema: { ... },
//     handler: [Function]
//   }
// ]
```

## Configuration Priority

Settings are resolved in this order (highest to lowest):

1. `extensions.anthropic.*` - Anthropic-specific settings
2. `spec.llm.*` - Generic LLM settings
3. Default values

### Model Selection
```
extensions.anthropic.model
→ spec.llm.model
→ 'claude-3-5-sonnet-20241022' (default)
```

### System Prompt
```
extensions.anthropic.system
→ spec.role
→ 'You are a helpful AI assistant.' (default)
```

### Max Tokens
```
extensions.anthropic.max_tokens
→ spec.llm.maxTokens
→ 4096 (default)
```

### Temperature
```
extensions.anthropic.temperature
→ spec.llm.temperature
→ 1.0 (default)
```

## API Reference

### Constructor

```typescript
new AnthropicAdapter(manifest: OssaManifest, apiKey?: string)
```

Creates a new adapter instance.

**Parameters:**
- `manifest` - OSSA manifest object
- `apiKey` - Optional API key (defaults to `ANTHROPIC_API_KEY` env var)

### Methods

#### `initialize(): void`
Initialize the conversation. Call before first chat.

#### `chat(message: string, options?: RunOptions): Promise<string>`
Send a message and get a response.

**Options:**
- `verbose` - Log tool execution details
- `maxTurns` - Max conversation turns (default: 10)
- `streaming` - Enable streaming (not used in chat, use chatStream)

#### `chatStream(message: string, options?: RunOptions): AsyncGenerator<string>`
Stream a response with tool support.

#### `registerToolHandler(name: string, handler: Function): void`
Register a handler for a tool.

#### `getAgentInfo(): Object`
Get agent metadata and configuration.

#### `getConversationHistory(): MessageParam[]`
Get full conversation history.

#### `clearHistory(): void`
Clear conversation history.

#### `getTools(): ToolDefinition[]`
Get all available tools.

#### `getClient(): Anthropic`
Get the underlying Anthropic client.

## Environment Variables

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
```

## Examples

See `examples/anthropic-adapter-example.ts` for comprehensive examples including:

- Basic chat
- Tool calling
- Streaming responses
- Multi-turn conversations
- Model comparison
- Error handling

Run examples:

```bash
# Set API key
export ANTHROPIC_API_KEY=your-key-here

# Run TypeScript directly
npx tsx examples/anthropic-adapter-example.ts

# Or build and run
npm run build
node dist/examples/anthropic-adapter-example.js
```

## Comparison with OpenAI Adapter

| Feature | Anthropic Adapter | OpenAI Adapter |
|---------|------------------|----------------|
| Model Support | Claude 3.5, 3 Opus, 3 Haiku | GPT-4o, GPT-4, GPT-3.5 |
| Streaming | ✅ AsyncGenerator | ✅ AsyncIterable |
| Tool Format | tool_use blocks | function calling |
| System Prompt | Separate parameter | Message role |
| Max Tokens | Required | Optional |
| Stop Sequences | ✅ Supported | ✅ Supported |
| Conversation History | MessageParam[] | ChatCompletionMessageParam[] |

## Best Practices

1. **Model Selection**
   - Use Sonnet for most tasks (best balance)
   - Use Opus for complex reasoning
   - Use Haiku for simple, high-volume tasks

2. **Tool Handlers**
   - Always return JSON strings
   - Handle errors gracefully
   - Keep handlers fast (< 5s)
   - Validate input parameters

3. **Conversation Management**
   - Clear history periodically for long conversations
   - Monitor token usage
   - Use maxTurns to prevent infinite loops

4. **Error Handling**
   - Wrap API calls in try-catch
   - Handle rate limits with exponential backoff
   - Log errors for debugging

5. **Performance**
   - Use streaming for long responses
   - Reduce max_tokens for faster responses
   - Cache frequently used prompts

## Troubleshooting

### "Invalid API key" error
- Check `ANTHROPIC_API_KEY` is set correctly
- Verify key has proper permissions

### Tool not executing
- Check tool name matches manifest
- Verify handler is registered before chat
- Check handler returns a string

### "Max turns reached" message
- Increase `maxTurns` option
- Check for circular tool calling
- Review tool handler logic

### Type errors
- Ensure `@anthropic-ai/sdk` is installed
- Check TypeScript version (5.0+)
- Verify import paths

## License

Apache-2.0

## Contributing

See the main project README for contribution guidelines.
