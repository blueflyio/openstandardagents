# Mistral AI Adapter for OSSA

Production-ready runtime adapter for executing OSSA agents using Mistral AI's API.

## Features

- ✅ **Full Mistral API Support**: All models including Mistral Large, Medium, Small, and Mixtral variants
- ✅ **Function Calling**: Native support for Mistral's function calling capabilities
- ✅ **Streaming**: Real-time streaming responses with tool execution
- ✅ **Safety Controls**: Built-in safe mode and safe prompt options
- ✅ **Multi-turn Conversations**: Automatic conversation history management
- ✅ **Production Ready**: Comprehensive error handling, timeouts, and type safety

## Supported Models

| Model | ID | Context | Use Case |
|-------|-----|---------|----------|
| Mistral Large 2 | `mistral-large-latest` | 128K | Most capable, best for complex tasks |
| Mistral Small | `mistral-small-latest` | 32K | Fast and cost-effective |
| Mixtral 8x7B | `mixtral-8x7b-instruct-v0.1` | 32K | Open-source, efficient for most tasks |
| Mixtral 8x22B | `mixtral-8x22b-instruct-v0.1` | 64K | Largest open model |

## Installation

```bash
npm install @bluefly/openstandardagents
```

## Configuration

Set your Mistral API key:

```bash
export MISTRAL_API_KEY=your-api-key-here
```

Or provide it in the manifest:

```yaml
extensions:
  mistral:
    api_key: ${MISTRAL_API_KEY}
```

## Quick Start

### Basic Chat

```typescript
import { MistralAdapter } from '@bluefly/openstandardagents/dist/services/runtime/mistral.adapter.js';

const manifest = {
  apiVersion: 'ossa/v0.3.0',
  kind: 'Agent',
  metadata: {
    name: 'my-agent',
    version: '1.0.0'
  },
  spec: {
    role: 'You are a helpful assistant.',
    llm: {
      provider: 'mistral',
      model: 'mistral-large-latest'
    }
  }
};

const adapter = new MistralAdapter({ manifest });
adapter.initialize();

const response = await adapter.chat('Hello!');
console.log(response);
```

### With Function Calling

```typescript
const manifest = {
  apiVersion: 'ossa/v0.3.0',
  kind: 'Agent',
  metadata: {
    name: 'weather-agent'
  },
  spec: {
    role: 'You are a weather assistant.'
  },
  extensions: {
    mistral: {
      model: 'mistral-large-latest',
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get current weather',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'City name'
                }
              },
              required: ['location']
            }
          }
        }
      ]
    }
  }
};

const adapter = new MistralAdapter({ manifest });
adapter.initialize();

// Register tool handler
adapter.registerToolHandler('get_weather', async (args) => {
  const weather = await fetchWeather(args.location);
  return JSON.stringify(weather);
});

const response = await adapter.chat("What's the weather in Paris?", {
  verbose: true
});
```

### Streaming

```typescript
const adapter = new MistralAdapter({ manifest });
adapter.initialize();

for await (const chunk of adapter.chatStream('Write a haiku')) {
  process.stdout.write(chunk);
}
```

## Configuration Options

### Manifest Extensions

```yaml
extensions:
  mistral:
    # Model selection
    model: mistral-large-latest

    # API credentials
    api_key: ${MISTRAL_API_KEY}

    # Generation parameters
    temperature: 0.7        # 0.0 to 1.0
    max_tokens: 4096        # Max output tokens
    top_p: 0.95            # Nucleus sampling
    random_seed: 42        # For reproducibility

    # Safety controls
    safe_mode: false       # Enable content filtering
    safe_prompt: false     # Prepend safety instructions

    # System prompt
    system: "Custom system prompt"

    # Function calling tools
    tools:
      - type: function
        function:
          name: tool_name
          description: Tool description
          parameters:
            type: object
            properties: {}
```

### Runtime Options

```typescript
interface MistralRunOptions {
  verbose?: boolean;      // Log tool calls and turns
  maxTurns?: number;      // Max conversation turns (default: 10)
  stream?: boolean;       // Enable streaming
}

await adapter.chat('Message', {
  verbose: true,
  maxTurns: 5
});
```

## Advanced Features

### Multi-turn Conversations

```typescript
adapter.initialize();

const response1 = await adapter.chat('What is JavaScript?');
const response2 = await adapter.chat('Can you show an example?');
// Context is automatically maintained

// View history
const history = adapter.getConversationHistory();

// Clear history
adapter.clearHistory();
```

### Error Handling

```typescript
try {
  const response = await adapter.chat('Message');
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('Request timed out');
  } else if (error.message.includes('API error')) {
    console.error('Mistral API error');
  }
}
```

### Safe Mode

```typescript
const manifest = {
  // ...
  extensions: {
    mistral: {
      safe_mode: true,      // Enable content moderation
      safe_prompt: true     // Add safety instructions
    }
  }
};
```

### Reproducible Outputs

```typescript
const manifest = {
  // ...
  extensions: {
    mistral: {
      random_seed: 42,      // Same seed = same output
      temperature: 0.0      // Deterministic sampling
    }
  }
};
```

## API Reference

### `MistralAdapter`

#### Constructor

```typescript
new MistralAdapter(config: MistralAdapterConfig)
```

```typescript
interface MistralAdapterConfig {
  manifest: OssaAgent;
  apiKey?: string;        // Optional, falls back to env
  baseUrl?: string;       // Default: https://api.mistral.ai/v1
  timeout?: number;       // Default: 60000ms
}
```

#### Methods

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize conversation with system prompt |
| `chat(message, options?)` | Send message, get response (non-streaming) |
| `chatStream(message, options?)` | Send message, get streaming response |
| `registerToolHandler(name, handler)` | Register function tool handler |
| `getAgentInfo()` | Get agent metadata |
| `getConversationHistory()` | Get all messages |
| `clearHistory()` | Reset conversation |
| `getTools()` | Get registered tools |

## Examples

See comprehensive examples in:
- `/examples/mistral-adapter-example.ts` - All features demonstrated
- `/examples/adapters/mistral-agent.yaml` - YAML manifest example

Run examples:

```bash
npm install
npm run build
node dist/examples/mistral-adapter-example.js
```

## Performance

- **Non-streaming**: ~2-5s for typical responses
- **Streaming**: First token in ~500ms
- **Tool calling**: Adds ~1s per tool execution

## Best Practices

1. **Model Selection**
   - Use `mistral-large-latest` for complex reasoning
   - Use `mistral-small-latest` for simple tasks (faster, cheaper)
   - Use `mixtral-8x7b` for open-source requirements

2. **Temperature**
   - 0.0-0.3: Factual, deterministic responses
   - 0.5-0.7: Balanced creativity and consistency
   - 0.8-1.0: Creative, diverse outputs

3. **Function Calling**
   - Always provide detailed descriptions
   - Use strict JSON schemas
   - Handle tool errors gracefully

4. **Streaming**
   - Use for long responses
   - Better user experience
   - Lower perceived latency

5. **Error Handling**
   - Set appropriate timeouts
   - Retry failed requests
   - Log errors for debugging

## Troubleshooting

### "Mistral API key is required"

Set the environment variable:
```bash
export MISTRAL_API_KEY=your-key
```

Or provide in config:
```typescript
new MistralAdapter({ manifest, apiKey: 'your-key' })
```

### Request Timeout

Increase timeout:
```typescript
new MistralAdapter({ manifest, timeout: 120000 }) // 2 minutes
```

### Content Filtered

Enable safe mode explicitly or adjust prompts:
```yaml
extensions:
  mistral:
    safe_mode: false
```

## License

Apache-2.0

## Support

- [OSSA Documentation](https://gitlab.com/blueflyio/openstandardagents/-/wikis/home)
- [Mistral AI Documentation](https://docs.mistral.ai/)
- [Report Issues](https://gitlab.com/blueflyio/openstandardagents/-/issues)
