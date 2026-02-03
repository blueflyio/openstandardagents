# Anthropic Claude Export

Export OSSA agent manifests to native Anthropic Claude format with tool use, API endpoints, and production-ready deployments.

## What Gets Generated

The Anthropic exporter creates a complete Claude integration:

### Generated Files

```
anthropic/
├── runtime.ts            # Anthropic runtime adapter
├── client.ts             # Anthropic API client
├── tools.ts              # Tool definitions and handlers
├── messages.ts           # Message format converters
├── config.ts             # Configuration management
├── index.ts              # Main entry point
├── api/
│   ├── server.ts         # Express API server
│   ├── routes.ts         # API routes
│   └── openapi.yaml      # OpenAPI 3.1 spec
├── package.json          # Dependencies
└── README.md             # Documentation
```

### Key Features

- **Native Claude Integration**: Direct Anthropic SDK usage
- **Tool Use Support**: Full function calling with tools
- **Streaming**: Real-time response streaming
- **Prompt Caching**: Anthropic prompt caching for cost savings
- **Message Management**: Conversation history and context
- **Production-Ready**: Error handling, retries, rate limiting

## Quick Start

### Export to Anthropic

```bash
# Export OSSA manifest to Anthropic format
ossa export agent.ossa.yaml --platform anthropic --output ./anthropic-agent

# With API endpoints
ossa export agent.ossa.yaml --platform anthropic --with-api --output ./agent-api

# Preview export
ossa export agent.ossa.yaml --platform anthropic --dry-run --verbose
```

### Basic Usage

```typescript
import { AnthropicAdapter } from './runtime';
import type { OssaAgent } from '@bluefly/openstandardagents/types';

// Load OSSA manifest
const manifest: OssaAgent = {
  apiVersion: "ossa/v0.4.0",
  kind: "Agent",
  metadata: {
    name: "code-reviewer"
  },
  spec: {
    role: "Code Reviewer",
    llm: {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      temperature: 0.3
    }
  }
};

// Initialize adapter
const adapter = new AnthropicAdapter(manifest, {
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Execute
const response = await adapter.execute([
  { role: "user", content: "Review this code: ..." }
]);

console.log(response.text);
console.log(`Tokens: ${response.usage.totalTokens}`);
console.log(`Cost: $${response.cost.toFixed(4)}`);
```

### With Tools

```typescript
import { AnthropicAdapter } from './runtime';
import { ToolMapper } from './tools';

const manifest: OssaAgent = {
  // ... manifest config
  spec: {
    tools: [
      {
        name: "analyze_code",
        description: "Analyze code for issues",
        parameters: [
          {
            name: "code",
            type: "string",
            required: true
          },
          {
            name: "language",
            type: "string",
            required: true
          }
        ]
      }
    ]
  }
};

// Initialize with tool handlers
const adapter = new AnthropicAdapter(manifest);

// Register tool handler
adapter.registerToolHandler("analyze_code", async (input) => {
  const { code, language } = input;
  // Implement tool logic
  return `Code analysis result for ${language}`;
});

// Execute (agent will call tools as needed)
const response = await adapter.execute([
  { role: "user", content: "Analyze this Python code: def hello(): pass" }
]);
```

## API Endpoints

### Generated Express API

Export with API endpoints for HTTP access:

```bash
ossa export agent.ossa.yaml --platform anthropic --with-api
```

### Start API Server

```bash
cd anthropic
npm install
npm start
```

Server runs on `http://localhost:3000`.

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/chat` | Send message to agent |
| `POST` | `/api/v1/chat/stream` | Stream agent response |
| `POST` | `/api/v1/execute` | Execute agent with tools |
| `GET` | `/api/v1/info` | Get agent information |
| `GET` | `/api/v1/models` | List available Claude models |
| `POST` | `/api/v1/validate` | Validate input |
| `GET` | `/health` | Health check |
| `GET` | `/openapi` | OpenAPI specification |

### Chat API

```bash
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What is the capital of France?"
      }
    ]
  }'
```

**Response:**

```json
{
  "success": true,
  "response": {
    "text": "The capital of France is Paris.",
    "usage": {
      "inputTokens": 15,
      "outputTokens": 8,
      "totalTokens": 23
    },
    "cost": 0.000345,
    "stopReason": "end_turn"
  }
}
```

### Streaming API

```bash
curl -X POST http://localhost:3000/api/v1/chat/stream \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "messages": [
      {"role": "user", "content": "Write a short poem"}
    ]
  }'
```

Returns Server-Sent Events (SSE):

```
data: {"type":"content","delta":"The"}

data: {"type":"content","delta":" capital"}

data: {"type":"content","delta":" of"}

data: {"type":"done","usage":{"inputTokens":10,"outputTokens":50}}
```

### Execute with Tools

```bash
curl -X POST http://localhost:3000/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Analyze this code: def hello(): pass",
    "tools": ["analyze_code"]
  }'
```

**Response:**

```json
{
  "success": true,
  "output": "Code analysis complete. The function is valid Python.",
  "toolCalls": [
    {
      "name": "analyze_code",
      "input": {
        "code": "def hello(): pass",
        "language": "python"
      },
      "result": "Valid Python function definition"
    }
  ],
  "usage": {
    "inputTokens": 125,
    "outputTokens": 89,
    "totalTokens": 214
  },
  "cost": 0.00321
}
```

## OpenAPI Spec

Complete OpenAPI 3.1 specification included:

```yaml
openapi: 3.1.0
info:
  title: Anthropic Agent API
  version: 1.0.0
  description: Claude-powered agent with tool use

servers:
  - url: http://localhost:3000
    description: Local development

paths:
  /api/v1/chat:
    post:
      summary: Chat with agent
      operationId: chatWithAgent
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - messages
              properties:
                messages:
                  type: array
                  items:
                    $ref: '#/components/schemas/Message'
                temperature:
                  type: number
                  minimum: 0
                  maximum: 1
                maxTokens:
                  type: integer
                  minimum: 1
                  maximum: 4096
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ChatResponse'

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

  schemas:
    Message:
      type: object
      required:
        - role
        - content
      properties:
        role:
          type: string
          enum: [user, assistant]
        content:
          type: string

    ChatResponse:
      type: object
      properties:
        success:
          type: boolean
        response:
          type: object
          properties:
            text:
              type: string
            usage:
              $ref: '#/components/schemas/TokenUsage'
            cost:
              type: number
```

Access at: `http://localhost:3000/openapi`

## Prompt Caching

Enable Anthropic's prompt caching for cost savings:

### Configuration

```yaml
# agent.ossa.yaml
spec:
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
  extensions:
    anthropic:
      prompt_caching:
        enabled: true
        cache_breakpoints:
          - system_prompt
          - tool_definitions
```

### Usage

```typescript
const adapter = new AnthropicAdapter(manifest, {
  enablePromptCaching: true
});

// First request: Full cost
const response1 = await adapter.execute([
  { role: "user", content: "Analyze code..." }
]);
console.log(`Cost: $${response1.cost}`);  // e.g., $0.015

// Subsequent requests: 90% cheaper on cached portions
const response2 = await adapter.execute([
  { role: "user", content: "Analyze different code..." }
]);
console.log(`Cost: $${response2.cost}`);  // e.g., $0.002
```

### Benefits

- **90% cost reduction** on cached prompt portions
- Automatic cache management
- No code changes required
- Works with all Claude 3.5 Sonnet models

## Streaming

Real-time response streaming for better UX:

### TypeScript

```typescript
const adapter = new AnthropicAdapter(manifest);

for await (const chunk of adapter.stream([
  { role: "user", content: "Write a story" }
])) {
  if (chunk.type === "content") {
    process.stdout.write(chunk.delta);
  }
}
```

### API

```javascript
const eventSource = new EventSource('/api/v1/chat/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'content') {
    appendToUI(data.delta);
  } else if (data.type === 'done') {
    console.log('Streaming complete');
    console.log('Tokens:', data.usage);
  }
};
```

## Tool Use

### Define Tools in OSSA

```yaml
apiVersion: ossa/v0.4.0
kind: Agent
metadata:
  name: developer-assistant
spec:
  role: Developer Assistant
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
  tools:
    - name: execute_code
      description: Execute Python code
      parameters:
        - name: code
          type: string
          description: Python code to execute
          required: true

    - name: search_documentation
      description: Search technical documentation
      parameters:
        - name: query
          type: string
          required: true
        - name: source
          type: string
          enum: [python, javascript, rust]
          required: true
```

### Implement Tool Handlers

```typescript
import { AnthropicAdapter } from './runtime';

const adapter = new AnthropicAdapter(manifest);

// Execute code tool
adapter.registerToolHandler("execute_code", async (input) => {
  const { code } = input;

  try {
    // Execute in sandbox
    const result = await executePython(code);
    return JSON.stringify({ success: true, output: result });
  } catch (error) {
    return JSON.stringify({ success: false, error: error.message });
  }
});

// Search docs tool
adapter.registerToolHandler("search_documentation", async (input) => {
  const { query, source } = input;

  const results = await searchDocs(query, source);
  return JSON.stringify(results);
});

// Agent automatically calls tools as needed
const response = await adapter.execute([
  {
    role: "user",
    content: "Write and execute code to calculate fibonacci(10)"
  }
]);

console.log(response.text);
console.log("Tools called:", response.toolCalls);
```

## Examples

### Code Review Agent

**OSSA Manifest:**

```yaml
apiVersion: ossa/v0.4.0
kind: Agent
metadata:
  name: code-reviewer
  version: 1.0.0
  description: AI-powered code review with security analysis
spec:
  role: Senior Code Reviewer
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.2
  tools:
    - name: analyze_security
      description: Perform security vulnerability analysis
      parameters:
        - name: code
          type: string
          required: true
        - name: language
          type: string
          required: true

    - name: check_style
      description: Check code style and formatting
      parameters:
        - name: code
          type: string
          required: true
```

**Export:**

```bash
ossa export code-reviewer.ossa.yaml --platform anthropic --output ./reviewer
```

**Usage:**

```typescript
import { AnthropicAdapter } from './reviewer/runtime';
import fs from 'fs';

const manifest = JSON.parse(fs.readFileSync('./reviewer/manifest.json'));
const adapter = new AnthropicAdapter(manifest);

// Register tool handlers
adapter.registerToolHandler("analyze_security", async (input) => {
  // Security scanning logic
  return analyzeSecurityVulnerabilities(input.code, input.language);
});

adapter.registerToolHandler("check_style", async (input) => {
  // Style checking logic
  return checkCodeStyle(input.code);
});

// Review code
const code = fs.readFileSync('./app.py', 'utf-8');
const response = await adapter.execute([
  {
    role: "user",
    content: `Review this code:\n\n${code}`
  }
]);

console.log(response.text);
```

### Customer Support Bot

**OSSA Manifest:**

```yaml
apiVersion: ossa/v0.4.0
kind: Agent
metadata:
  name: support-bot
  description: Customer support agent with knowledge base access
spec:
  role: Customer Support Specialist
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.7
  tools:
    - name: search_knowledge_base
      description: Search company knowledge base
      parameters:
        - name: query
          type: string
          required: true

    - name: create_ticket
      description: Create support ticket
      parameters:
        - name: title
          type: string
          required: true
        - name: description
          type: string
          required: true
        - name: priority
          type: string
          enum: [low, medium, high, urgent]
          required: true
```

**Deploy as API:**

```bash
ossa export support-bot.ossa.yaml --platform anthropic --with-api
cd anthropic
npm install
npm start
```

**Use API:**

```bash
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "I cannot log into my account"
      }
    ]
  }'
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Copy application
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/api/server.js"]
```

```bash
docker build -t anthropic-agent .
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your-key \
  anthropic-agent
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: anthropic-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: anthropic-agent
  template:
    metadata:
      labels:
        app: anthropic-agent
    spec:
      containers:
      - name: agent
        image: anthropic-agent:latest
        ports:
        - containerPort: 3000
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: anthropic
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Serverless (AWS Lambda)

```typescript
// lambda-handler.ts
import { AnthropicAdapter } from './runtime';
import type { OssaAgent } from '@bluefly/openstandardagents/types';

const manifest: OssaAgent = JSON.parse(process.env.AGENT_MANIFEST!);
const adapter = new AnthropicAdapter(manifest, {
  apiKey: process.env.ANTHROPIC_API_KEY
});

export const handler = async (event: any) => {
  const { messages } = JSON.parse(event.body);

  const response = await adapter.execute(messages);

  return {
    statusCode: 200,
    body: JSON.stringify({
      text: response.text,
      usage: response.usage,
      cost: response.cost
    })
  };
};
```

## Configuration

### Environment Variables

```bash
# Required
export ANTHROPIC_API_KEY=sk-ant-...

# Optional
export ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
export ANTHROPIC_MAX_TOKENS=4096
export ANTHROPIC_TEMPERATURE=0.7
export PORT=3000
export LOG_LEVEL=info
```

### Advanced Options

```typescript
const adapter = new AnthropicAdapter(manifest, {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-3-5-sonnet-20241022",
  temperature: 0.7,
  maxTokens: 4096,
  enablePromptCaching: true,
  enableRetries: true,
  maxRetries: 3,
  timeout: 30000,  // 30 seconds
  stopSequences: ["###", "END"],
});
```

## Troubleshooting

### Authentication Error

**Problem:** `AuthenticationError: Invalid API key`

**Solution:**

```bash
# Verify API key is set
echo $ANTHROPIC_API_KEY

# Get new key from console.anthropic.com
export ANTHROPIC_API_KEY=sk-ant-your-new-key
```

### Rate Limiting

**Problem:** `RateLimitError: Rate limit exceeded`

**Solution:**

Enable automatic retries:

```typescript
const adapter = new AnthropicAdapter(manifest, {
  enableRetries: true,
  maxRetries: 5,
  retryDelay: 1000  // Start with 1 second
});
```

### Tool Execution Errors

**Problem:** `ToolExecutionError: Tool 'analyze_code' failed`

**Solution:**

Add error handling in tool handlers:

```typescript
adapter.registerToolHandler("analyze_code", async (input) => {
  try {
    const result = await analyzeCode(input.code);
    return JSON.stringify({ success: true, result });
  } catch (error) {
    console.error("Tool error:", error);
    return JSON.stringify({
      success: false,
      error: error.message
    });
  }
});
```

### Memory Issues

**Problem:** `JavaScript heap out of memory`

**Solution:**

Increase Node.js memory limit:

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm start
```

## Best Practices

### 1. Cost Optimization

```typescript
// Use prompt caching
enablePromptCaching: true

// Set reasonable max tokens
maxTokens: 1024  // Don't use default 4096 if not needed

// Use lower temperature for deterministic tasks
temperature: 0.2  // vs 0.7 for creative tasks
```

### 2. Error Handling

```typescript
try {
  const response = await adapter.execute(messages);
  console.log(response.text);
} catch (error) {
  if (error.name === 'RateLimitError') {
    // Wait and retry
    await sleep(1000);
    return retry();
  } else if (error.name === 'AuthenticationError') {
    // Log error, alert admin
    logger.error('Invalid API key');
  } else {
    // Generic error handling
    logger.error('Execution failed:', error);
  }
}
```

### 3. Conversation Management

```typescript
// Keep conversation history
const history: Message[] = [];

async function chat(userMessage: string) {
  history.push({ role: "user", content: userMessage });

  const response = await adapter.execute(history);

  history.push({ role: "assistant", content: response.text });

  // Trim old messages if too long
  if (history.length > 20) {
    history.splice(0, history.length - 20);
  }

  return response.text;
}
```

### 4. Security

```typescript
// Validate input
function validateInput(input: string): boolean {
  if (input.length > 10000) {
    throw new Error("Input too long");
  }
  if (containsMaliciousContent(input)) {
    throw new Error("Invalid input");
  }
  return true;
}

// Sanitize tool outputs
function sanitizeOutput(output: string): string {
  return output.replace(/API_KEY=\w+/g, 'API_KEY=***');
}
```

## Next Steps

- [LangChain Export](./langchain.md) - Export to LangChain
- [npm Export](./npm.md) - Package as npm module
- [Cost Optimization](../guides/cost-optimization.md) - Reduce API costs
- [Best Practices](../guides/best-practices.md) - General best practices
