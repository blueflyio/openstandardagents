# LangServe Deployment

This guide covers deploying OSSA agents as production-ready REST APIs using LangServe, LangChain's official deployment framework.

## Overview

LangServe provides a standardized way to deploy LangChain applications as REST APIs with:

- **Auto-generated endpoints**: `/invoke`, `/batch`, `/stream`, `/stream_log`
- **Interactive playground UI**: Test and debug agents in the browser
- **Streaming support**: Server-Sent Events (SSE) for real-time responses
- **Type safety**: Automatic request/response validation
- **Observability**: Built-in tracing and monitoring hooks
- **Client libraries**: Python and JavaScript/TypeScript SDKs

## Quick Start

### 1. Export Agent with LangServe Support

```typescript
import { LangChainExporter } from '@bluefly/openstandardagents';

const exporter = new LangChainExporter();

const result = await exporter.export(manifest, {
  includeLangServe: true,
  langserve: {
    enableFeedback: true,
    enablePublicTraceLink: true,
    enablePlayground: true,
    routePath: '/agent',
    port: 8000,
    includeDeployment: true,
    deploymentPlatforms: ['docker', 'kubernetes', 'railway', 'render', 'fly'],
  },
});
```

### 2. Generated Files

The export generates:

```
├── langserve_app.py              # LangServe FastAPI application
├── agent.py                      # Core agent logic
├── tools.py                      # Tool implementations
├── memory.py                     # Memory configuration
├── requirements.txt              # Python dependencies (includes langserve[all]>=0.0.30)
├── Dockerfile.langserve          # Docker image for LangServe
├── docker-compose.langserve.yaml # Docker Compose configuration
├── k8s/                          # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
├── railway.json                  # Railway deployment config
├── render.yaml                   # Render deployment config
├── fly.toml                      # Fly.io deployment config
└── DEPLOYMENT.md                 # Complete deployment guide
```

### 3. Run Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"

# Run LangServe app
python langserve_app.py
```

Visit:
- API docs: http://localhost:8000/docs
- Playground: http://localhost:8000/agent/playground

## LangServe Endpoints

### POST /agent/invoke

Synchronous agent invocation.

**Request:**
```bash
curl -X POST "http://localhost:8000/agent/invoke" \
  -H "Content-Type: application/json" \
  -d '{"input": "What is LangChain?"}'
```

**Response:**
```json
{
  "output": "LangChain is a framework for developing applications powered by language models...",
  "metadata": {
    "run_id": "abc123",
    "tokens_used": 150
  }
}
```

### POST /agent/batch

Batch process multiple inputs in parallel.

**Request:**
```bash
curl -X POST "http://localhost:8000/agent/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": [
      "Question 1?",
      "Question 2?",
      "Question 3?"
    ]
  }'
```

**Response:**
```json
{
  "outputs": [
    "Answer to question 1...",
    "Answer to question 2...",
    "Answer to question 3..."
  ]
}
```

### POST /agent/stream

Stream responses using Server-Sent Events (SSE).

**Request:**
```bash
curl -X POST "http://localhost:8000/agent/stream" \
  -H "Content-Type: application/json" \
  -d '{"input": "Tell me a story"}' \
  --no-buffer
```

**Response (SSE):**
```
data: {"content": "Once", "type": "token"}

data: {"content": " upon", "type": "token"}

data: {"content": " a", "type": "token"}

data: {"content": " time", "type": "token"}

data: {"done": true}
```

### POST /agent/stream_log

Stream with detailed intermediate steps and reasoning.

**Request:**
```bash
curl -X POST "http://localhost:8000/agent/stream_log" \
  -H "Content-Type: application/json" \
  -d '{"input": "Calculate 25 * 4"}' \
  --no-buffer
```

**Response (SSE with logs):**
```
data: {"type": "start", "run_id": "abc123"}

data: {"type": "tool", "name": "calculator", "input": {"expression": "25 * 4"}}

data: {"type": "tool_result", "result": 100}

data: {"type": "token", "content": "The result is 100"}

data: {"type": "end", "output": "The result is 100"}
```

### GET /agent/playground

Interactive UI for testing the agent.

Visit: http://localhost:8000/agent/playground

Features:
- Send messages to agent
- View streaming responses
- Inspect intermediate steps
- Test different configurations

## Client Libraries

### Python

```python
from langserve import RemoteRunnable

# Connect to deployed agent
agent = RemoteRunnable("http://localhost:8000/agent")

# Invoke (synchronous)
result = agent.invoke("What is the weather?")
print(result)

# Stream responses
for chunk in agent.stream("Tell me a joke"):
    print(chunk, end="", flush=True)

# Batch processing
results = agent.batch([
    "Question 1?",
    "Question 2?",
    "Question 3?"
])
for result in results:
    print(result)

# Async support
import asyncio

async def main():
    result = await agent.ainvoke("Async question")
    print(result)

asyncio.run(main())
```

### JavaScript/TypeScript

```typescript
import { RemoteRunnable } from "@langchain/core/runnables/remote";

// Connect to deployed agent
const agent = new RemoteRunnable({
  url: "http://localhost:8000/agent"
});

// Invoke (synchronous)
const result = await agent.invoke("What is the weather?");
console.log(result);

// Stream responses
const stream = await agent.stream("Tell me a joke");
for await (const chunk of stream) {
  process.stdout.write(chunk);
}

// Batch processing
const results = await agent.batch([
  "Question 1?",
  "Question 2?",
  "Question 3?"
]);
results.forEach(result => console.log(result));
```

### REST API (Any Language)

```bash
# cURL
curl -X POST "http://localhost:8000/agent/invoke" \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello!"}'

# Python requests
import requests

response = requests.post(
    "http://localhost:8000/agent/invoke",
    json={"input": "Hello!"}
)
print(response.json())

# Node.js fetch
const response = await fetch("http://localhost:8000/agent/invoke", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ input: "Hello!" })
});
const data = await response.json();
console.log(data);
```

## Deployment

### Docker

```bash
# Build image
docker build -f Dockerfile.langserve -t my-agent .

# Run container
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=your-key \
  -e ANTHROPIC_API_KEY=your-key \
  my-agent

# Or use docker-compose
docker-compose -f docker-compose.langserve.yaml up
```

### Kubernetes

```bash
# Create secrets
kubectl create secret generic my-agent-secrets \
  --from-literal=openai-api-key=your-key \
  --from-literal=anthropic-api-key=your-key

# Deploy
kubectl apply -f k8s/

# Check status
kubectl get pods -l app=my-agent-langserve
kubectl logs -f deployment/my-agent-langserve

# Port forward (for testing)
kubectl port-forward service/my-agent-langserve 8000:80
```

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add secrets
railway variables set OPENAI_API_KEY=your-key
railway variables set ANTHROPIC_API_KEY=your-key

# Deploy
railway up
```

### Render

1. Connect Git repository to Render
2. Create new Web Service
3. Render auto-detects `render.yaml`
4. Add environment variables in dashboard
5. Deploy

### Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Set secrets
fly secrets set OPENAI_API_KEY=your-key
fly secrets set ANTHROPIC_API_KEY=your-key

# Deploy
fly deploy

# Open app
fly open
```

## Configuration

### Environment Variables

```bash
# LLM API Keys
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# LangServe Configuration
PORT=8000
HOST=0.0.0.0

# LangSmith Tracing (Optional)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-key
LANGCHAIN_PROJECT=my-project
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com

# LangFuse (Optional)
LANGFUSE_ENABLED=false
LANGFUSE_PUBLIC_KEY=your-public-key
LANGFUSE_SECRET_KEY=your-secret-key
LANGFUSE_HOST=https://cloud.langfuse.com
```

### LangServe Options

```typescript
langserve: {
  // Enable feedback endpoint for user ratings
  enableFeedback: true,

  // Enable public trace link sharing
  enablePublicTraceLink: true,

  // Enable interactive playground UI
  enablePlayground: true,

  // Custom route path (default: /agent)
  routePath: '/my-agent',

  // Server port
  port: 8000,

  // Generate deployment configs
  includeDeployment: true,

  // Select deployment platforms
  deploymentPlatforms: ['docker', 'kubernetes', 'railway', 'render', 'fly'],
}
```

## Observability

### LangSmith Integration

Enable LangSmith for tracing and debugging:

```bash
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY=your-langsmith-key
export LANGCHAIN_PROJECT=my-project
```

View traces at: https://smith.langchain.com

### Health Monitoring

```bash
# Health check
curl http://localhost:8000/health

# Response
{
  "status": "healthy",
  "agent": "my-agent",
  "version": "1.0.0",
  "langserve_endpoints": {
    "invoke": "/agent/invoke",
    "batch": "/agent/batch",
    "stream": "/agent/stream",
    "stream_log": "/agent/stream_log",
    "playground": "/agent/playground"
  }
}
```

### Metrics

Monitor key metrics:
- Request latency
- Token usage
- Error rates
- Tool invocation counts

## Performance

### Streaming vs. Invoke

- **Streaming** (`/stream`): Better UX, progressive updates, lower perceived latency
- **Invoke** (`/invoke`): Simpler implementation, complete response at once

### Batch Processing

Process multiple inputs in parallel:

```python
# 3x faster than sequential processing
results = agent.batch([
    "Question 1?",
    "Question 2?",
    "Question 3?"
])
```

### Caching

Implement response caching for common queries:

```python
from langchain.cache import InMemoryCache
from langchain.globals import set_llm_cache

set_llm_cache(InMemoryCache())
```

### Rate Limiting

Add rate limiting middleware:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/agent/invoke")
@limiter.limit("10/minute")
async def invoke(request: InvokeRequest):
    ...
```

## Security

### API Keys

- Never commit API keys to git
- Use environment variables or secrets management
- Rotate keys regularly

### CORS

Configure CORS for production:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific domains
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### Authentication

Add authentication middleware:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

security = HTTPBearer()

def verify_token(credentials = Depends(security)):
    if credentials.credentials != "your-secret-token":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication"
        )

@app.post("/agent/invoke", dependencies=[Depends(verify_token)])
async def invoke(request: InvokeRequest):
    ...
```

### HTTPS

Always use HTTPS in production:
- Kubernetes: Configure TLS in Ingress
- Docker: Use reverse proxy (nginx, Caddy)
- Cloud platforms: Auto-configured

## Troubleshooting

### Common Issues

**502 Bad Gateway**
- Check if app is running: `docker ps` or `kubectl get pods`
- Verify health check passes: `curl http://localhost:8000/health`
- Check logs for startup errors

**Timeout Errors**
- Increase timeout in load balancer/ingress
- Optimize LLM calls (reduce max_tokens, use faster models)
- Enable streaming for better UX

**Out of Memory**
- Increase container memory limits
- Reduce batch size
- Use memory-efficient models

**API Key Errors**
- Verify environment variables are set
- Check API key validity
- Ensure proper secret mounting (Kubernetes)

### Debug Mode

Enable debug logging:

```python
import logging

logging.basicConfig(level=logging.DEBUG)
```

### View Logs

```bash
# Docker
docker logs my-agent

# Kubernetes
kubectl logs -f deployment/my-agent-langserve

# Railway
railway logs

# Fly.io
fly logs
```

## Best Practices

1. **Use streaming** for better user experience
2. **Enable observability** (LangSmith, metrics)
3. **Implement caching** for common queries
4. **Add rate limiting** to prevent abuse
5. **Use health checks** for monitoring
6. **Set resource limits** (memory, CPU)
7. **Enable auto-scaling** based on load
8. **Use HTTPS** in production
9. **Implement authentication** for protected endpoints
10. **Monitor costs** (token usage, API calls)

## Resources

- [LangServe Documentation](https://python.langchain.com/docs/langserve)
- [LangChain Documentation](https://python.langchain.com/)
- [LangSmith Tracing](https://docs.smith.langchain.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Example Code](../../examples/export/langserve-export-example.ts)
- [Tests](../../tests/unit/services/export/langchain/langserve-generator.test.ts)
