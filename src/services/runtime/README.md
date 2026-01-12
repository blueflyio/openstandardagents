# OSSA Runtime Adapters

Runtime adapters enable OSSA agents to run on different LLM providers and platforms. Each adapter implements a consistent interface while handling provider-specific details.

## Available Adapters

### Anthropic Adapter
**File**: `anthropic.adapter.ts`
**Provider**: Anthropic Claude API (direct)
**Models**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku

**Features**:
- Streaming responses
- Tool calling (function calling)
- Vision (image inputs)
- System prompts
- Temperature, max_tokens, top_p configuration

**Configuration** (manifest `extensions.anthropic`):
```yaml
extensions:
  anthropic:
    model: claude-3-5-sonnet-20241022
    system: Custom system prompt
    max_tokens: 4096
    temperature: 0.7
    tools:
      - name: search
        description: Search the web
        input_schema:
          type: object
          properties:
            query:
              type: string
```

**Credentials**: `ANTHROPIC_API_KEY` environment variable

---

### AWS Bedrock Adapter
**File**: `bedrock.adapter.ts`
**Provider**: AWS Bedrock
**Models**:
- Claude 3.5 Sonnet: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- Claude 3 Opus: `anthropic.claude-3-opus-20240229-v1:0`
- Claude 3 Sonnet: `anthropic.claude-3-sonnet-20240229-v1:0`
- Claude 3 Haiku: `anthropic.claude-3-haiku-20240307-v1:0`
- Amazon Titan Premier: `amazon.titan-text-premier-v1:0`
- Amazon Titan Express: `amazon.titan-text-express-v1`

**Features**:
- Streaming via `InvokeModelWithResponseStream`
- Tool calling via Bedrock Converse API (Claude 3+ and Titan)
- AWS IAM authentication (profiles, roles, env vars)
- Multi-region support
- VPC endpoint support for private deployments

**Configuration** (manifest `extensions.bedrock`):
```yaml
extensions:
  bedrock:
    region: us-east-1              # Required
    profile: bedrock               # Optional (uses default if omitted)
    model_id: anthropic.claude-3-5-sonnet-20241022-v2:0  # Required
    system: Custom system prompt   # Optional
    temperature: 0.7               # Optional
    max_tokens: 4096               # Optional
    top_p: 1.0                     # Optional
    stop_sequences:                # Optional
      - "\n\nHuman:"
    tools:                         # Optional (Converse API format)
      - name: search
        description: Search the web
        inputSchema:
          json:
            type: object
            properties:
              query:
                type: string
```

**Credentials**:
- **Option 1**: AWS CLI profile (`~/.aws/credentials`, `~/.aws/config`)
- **Option 2**: Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`)
- **Option 3**: IAM roles (EC2 instance profile, ECS task role, Lambda execution role)

**Setup**:
```bash
# Configure AWS credentials
aws configure --profile bedrock
# Access Key ID: AKIA...
# Secret Access Key: ...
# Region: us-east-1

# Verify Bedrock access
aws bedrock list-foundation-models --region us-east-1 --profile bedrock
```

**IAM Permissions Required**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
    }
  ]
}
```

**When to Use Bedrock**:
- ✅ You're already on AWS (unified billing, IAM, VPC)
- ✅ You need enterprise features (PrivateLink, CloudTrail, KMS)
- ✅ You need compliance (inherits AWS certifications)
- ✅ You want to try multiple model providers (Claude, Titan, Llama)
- ❌ Use direct Anthropic API if you want latest models first (Bedrock lags by weeks)
- ❌ Use direct API for lower latency (direct API is faster)

---

### OpenAI Adapter
**File**: `openai.adapter.ts`
**Provider**: OpenAI API
**Models**: GPT-4o, GPT-4o-mini, GPT-4 Turbo, GPT-3.5 Turbo

**Features**:
- Function calling
- System prompts
- Temperature, max_tokens configuration

**Configuration** (manifest `extensions.openai_agents`):
```yaml
extensions:
  openai_agents:
    model: gpt-4o-mini
    instructions: Custom system prompt
    tools_mapping:
      - ossa_capability: search
        openai_tool_name: web_search
        description: Search the web
        parameters:
          type: object
          properties:
            query:
              type: string
```

**Credentials**: `OPENAI_API_KEY` environment variable

---

### Ollama Adapter
**File**: `ollama.adapter.ts`
**Provider**: Ollama (local LLMs)
**Models**: llama3.2, mistral, codellama, and other Ollama models

**Features**:
- Local model execution
- Streaming responses
- Tool calling (for compatible models)
- Custom base URL support

**Configuration** (manifest `extensions.ollama`):
```yaml
extensions:
  ollama:
    enabled: true
    model: llama3.2
    system: Custom system prompt
    temperature: 0.7
    num_predict: 4096
    tools:
      - type: function
        function:
          name: search
          description: Search the web
          parameters:
            type: object
            properties:
              query:
                type: string
```

**Setup**:
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2

# Verify
ollama list
```

**Base URL**: Defaults to `http://localhost:11434`

---

## Adapter Interface

All adapters implement a consistent interface:

```typescript
class Adapter {
  constructor(manifest: OssaManifest, config?: AdapterConfig);

  // Initialize conversation
  initialize(): void;

  // Send message and get response
  async chat(message: string, options?: RunOptions): Promise<string>;

  // Stream response (if supported)
  async *chatStream(message: string, options?: RunOptions): AsyncGenerator<string>;

  // Register tool handlers
  registerToolHandler(name: string, handler: (args: Record<string, unknown>) => Promise<string>): void;

  // Get agent info
  getAgentInfo(): AgentInfo;

  // Manage conversation
  getConversationHistory(): Message[];
  clearHistory(): void;
  getTools(): ToolDefinition[];
}
```

## Tool Calling

Adapters support tool calling through different mechanisms:

### Anthropic & Bedrock
Uses native tool calling with structured schemas:
```typescript
{
  name: "search",
  description: "Search the web",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string" }
    },
    required: ["query"]
  }
}
```

### OpenAI
Uses function calling with parameters:
```typescript
{
  type: "function",
  function: {
    name: "search",
    description: "Search the web",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" }
      },
      required: ["query"]
    }
  }
}
```

### Ollama
Uses OpenAI-compatible function calling (for supported models):
```typescript
{
  type: "function",
  function: {
    name: "search",
    description: "Search the web",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" }
      }
    }
  }
}
```

## Examples

### Basic Usage (Anthropic)
```typescript
import { AnthropicAdapter } from './anthropic.adapter';
import { readFileSync } from 'fs';
import { parse } from 'yaml';

const manifest = parse(readFileSync('agent.ossa.yaml', 'utf-8'));
const adapter = new AnthropicAdapter(manifest, process.env.ANTHROPIC_API_KEY);

adapter.initialize();
const response = await adapter.chat("Hello!");
console.log(response);
```

### Basic Usage (Bedrock)
```typescript
import { BedrockAdapter } from './bedrock.adapter';
import { readFileSync } from 'fs';
import { parse } from 'yaml';

const manifest = parse(readFileSync('agent.ossa.yaml', 'utf-8'));
const adapter = new BedrockAdapter(manifest, { profile: 'bedrock' });

adapter.initialize();
const response = await adapter.chat("Hello!");
console.log(response);
```

### Streaming
```typescript
for await (const chunk of adapter.chatStream("Tell me a story")) {
  process.stdout.write(chunk);
}
```

### Tool Calling
```typescript
// Register tool handler
adapter.registerToolHandler('search', async (args) => {
  const results = await searchWeb(args.query);
  return JSON.stringify(results);
});

// Agent will automatically call tool when needed
const response = await adapter.chat("Search for OSSA documentation");
```

## Testing

```bash
# Unit tests
npm test src/services/runtime/*.test.ts

# Integration tests (requires API keys)
ANTHROPIC_API_KEY=... npm test src/services/runtime/*.integration.test.ts

# Test Bedrock adapter
AWS_PROFILE=bedrock npm test src/services/runtime/bedrock.adapter.test.ts
```

## Adding a New Adapter

1. Create `my-provider.adapter.ts` following the interface pattern
2. Implement required methods: `chat()`, `initialize()`, `getAgentInfo()`
3. Add optional methods: `chatStream()`, `registerToolHandler()`
4. Add configuration interface: `MyProviderExtension`
5. Update this README with provider details
6. Add example manifest in `examples/runtime-adapters/`
7. Write tests in `my-provider.adapter.test.ts`

## Troubleshooting

### Anthropic Adapter
- **Error: API key not found**: Set `ANTHROPIC_API_KEY` environment variable
- **Error: Model not found**: Update to latest Claude model ID
- **Slow responses**: Check temperature (lower = faster), reduce max_tokens

### Bedrock Adapter
- **Error: Cannot find module '@aws-sdk/client-bedrock-runtime'**: Run `npm install`
- **Error: UnrecognizedClientException**: Check AWS credentials (`aws sts get-caller-identity`)
- **Error: AccessDeniedException**: Verify IAM permissions for `bedrock:InvokeModel`
- **Error: ValidationException**: Check model ID format (e.g., `anthropic.claude-3-5-sonnet-20241022-v2:0`)
- **Error: ModelNotReadyException**: Model not available in your region, try `us-east-1`
- **Slow responses**: Use region closest to your infrastructure, consider VPC endpoints

### OpenAI Adapter
- **Error: API key not found**: Set `OPENAI_API_KEY` environment variable
- **Rate limit errors**: Implement retry logic or reduce request frequency

### Ollama Adapter
- **Error: Connection refused**: Start Ollama (`ollama serve`)
- **Error: Model not found**: Pull model (`ollama pull llama3.2`)
- **Tool calling not working**: Not all models support function calling, try `mistral` or `llama3.2`

## Performance Comparison

| Adapter | Latency (p50) | Latency (p99) | Cost (1M tokens) | Notes |
|---------|---------------|---------------|------------------|-------|
| Anthropic | 200ms | 800ms | $3.00 (Sonnet) | Direct API, lowest latency |
| Bedrock | 300ms | 1200ms | $3.00 (Sonnet) | AWS infrastructure, +100ms overhead |
| OpenAI | 250ms | 900ms | $0.15 (GPT-4o-mini) | Fast, affordable |
| Ollama | 50ms | 200ms | $0.00 | Local, but requires GPU for speed |

*Note: Latencies are approximate and vary by region, model, and request size.*

## License

Apache 2.0
