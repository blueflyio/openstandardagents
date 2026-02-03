## LangChain Exporter

Complete production-ready LangChain export system that generates Python code, FastAPI server, OpenAPI spec, and Docker configuration from OSSA manifests.

---

## Features

✅ **Python Agent Code** - LangChain agent with @tool decorators
✅ **FastAPI REST API** - Production-ready server with /chat endpoint
✅ **OpenAPI 3.1 Spec** - API-first, validated specification
✅ **Docker Support** - Dockerfile + docker-compose.yaml
✅ **Memory Backends** - Buffer, Summary, Redis, PostgreSQL
✅ **Streaming Support** - Server-sent events for real-time responses
✅ **Tests** - pytest test suite included
✅ **Type Safety** - Full Python type hints

---

## Quick Start

### 1. Create OSSA Manifest

```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: support-bot
  version: 1.0.0
  description: Customer support agent
spec:
  role: You are a helpful customer support agent
  llm:
    provider: openai
    model: gpt-4
    temperature: 0.7
  tools:
    - name: search_docs
      type: function
      description: Search knowledge base
      input_schema:
        type: object
        properties:
          query:
            type: string
        required: [query]
```

### 2. Export to LangChain

```typescript
import { LangChainExporter } from '@bluefly/openstandardagents/export/langchain';

const exporter = new LangChainExporter();

const result = await exporter.export(manifest, {
  includeApi: true,
  includeOpenApi: true,
  includeDocker: true,
  memoryBackend: 'redis',
});

// Write files
for (const file of result.files) {
  fs.writeFileSync(file.path, file.content);
}
```

### 3. Run Agent

```bash
# Using Docker
docker-compose up

# Or locally
pip install -r requirements.txt
uvicorn server:app --reload

# Access API
curl http://localhost:8000/docs
```

---

## Generated Files

### Core Agent Files

| File | Description |
|------|-------------|
| `agent.py` | Main LangChain agent with executor |
| `tools.py` | @tool decorated functions |
| `memory.py` | Memory backend configuration |
| `server.py` | FastAPI REST API server |
| `openapi.yaml` | OpenAPI 3.1 specification |

### Configuration Files

| File | Description |
|------|-------------|
| `requirements.txt` | Python dependencies |
| `Dockerfile` | Docker image definition |
| `docker-compose.yaml` | Multi-service orchestration |
| `.env.example` | Environment variables template |
| `README.md` | Setup and usage instructions |

### Testing

| File | Description |
|------|-------------|
| `test_agent.py` | pytest test suite |

---

## Export Options

```typescript
interface LangChainExportOptions {
  // Python version (default: '3.11')
  pythonVersion?: string;

  // Include FastAPI server (default: true)
  includeApi?: boolean;

  // Include OpenAPI spec (default: true)
  includeOpenApi?: boolean;

  // Include Docker files (default: true)
  includeDocker?: boolean;

  // Include tests (default: false)
  includeTests?: boolean;

  // Memory backend (default: 'buffer')
  memoryBackend?: 'buffer' | 'summary' | 'redis' | 'postgres';

  // API port (default: 8000)
  apiPort?: number;
}
```

---

## Memory Backends

### Buffer (In-Memory)

Simple conversation buffer. Good for development.

```typescript
const result = await exporter.export(manifest, {
  memoryBackend: 'buffer',
});
```

**Pros:**
- Simple, no dependencies
- Fast

**Cons:**
- Not persistent
- Not scalable

### Summary

Token-aware conversation summary.

```typescript
const result = await exporter.export(manifest, {
  memoryBackend: 'summary',
});
```

**Pros:**
- Token efficient
- Good for long conversations

**Cons:**
- Requires LLM calls for summarization
- Not persistent

### Redis

Redis-backed persistent memory.

```typescript
const result = await exporter.export(manifest, {
  memoryBackend: 'redis',
});
```

**Pros:**
- Persistent
- Scalable (multi-instance)
- Fast
- TTL support

**Cons:**
- Requires Redis server

### PostgreSQL

PostgreSQL-backed persistent memory.

```typescript
const result = await exporter.export(manifest, {
  memoryBackend: 'postgres',
});
```

**Pros:**
- Persistent
- SQL queryable
- Analytics support
- Export history

**Cons:**
- Requires PostgreSQL server
- Slower than Redis

---

## API Endpoints

### POST /chat

Send message to agent.

**Request:**
```json
{
  "message": "Hello!",
  "session_id": "user-123",
  "stream": false
}
```

**Response:**
```json
{
  "response": "Hi! How can I help?",
  "session_id": "user-123",
  "success": true,
  "metadata": {
    "tokens_used": 150
  }
}
```

### POST /chat/stream

Streaming chat response.

**Request:**
```json
{
  "message": "Tell me a story",
  "session_id": "user-123"
}
```

**Response:** Server-sent events stream
```
data: {"chunk": "Once "}
data: {"chunk": "upon "}
data: {"chunk": "a "}
data: {"chunk": "time..."}
data: {"done": true}
```

### GET /health

Health check.

**Response:**
```json
{
  "status": "healthy",
  "agent": "support-bot",
  "version": "1.0.0"
}
```

### GET /sessions

List active sessions.

**Response:**
```json
[
  {
    "session_id": "user-123",
    "message_count": 5
  }
]
```

### DELETE /sessions/{session_id}

Clear session history.

**Response:**
```json
{
  "status": "success",
  "message": "Session user-123 cleared"
}
```

---

## Tool Types

### Function Tools

Simple Python functions with @tool decorator.

```yaml
tools:
  - name: calculate
    type: function
    description: Perform calculation
    input_schema:
      type: object
      properties:
        expression:
          type: string
      required: [expression]
```

**Generated:**
```python
@tool
def calculate(expression: str) -> str:
    """Perform calculation"""
    # Implementation
```

### MCP Tools

Model Context Protocol integration.

```yaml
tools:
  - name: filesystem
    type: mcp
    description: File operations
    config:
      server: npx -y @modelcontextprotocol/server-filesystem
```

**Generated:**
```python
@tool
def filesystem(input_data: str) -> str:
    """File operations - MCP Server"""
    # MCP client implementation
```

### API Tools

HTTP API integration.

```yaml
tools:
  - name: weather
    type: api
    description: Get weather data
    config:
      endpoint: https://api.weather.com/data
      method: GET
```

**Generated:**
```python
@tool
def weather(input_data: str) -> str:
    """Get weather data - API Endpoint"""
    # HTTP client implementation
```

---

## Docker Deployment

### Single Service

```bash
docker build -t support-bot .
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=sk-xxx \
  support-bot
```

### Multi-Service (with Redis)

```bash
docker-compose up -d
```

**Includes:**
- Agent service (port 8000)
- Redis (port 6379)

### Multi-Service (with PostgreSQL)

```yaml
# docker-compose.yaml generated with memoryBackend: 'postgres'
```

**Includes:**
- Agent service (port 8000)
- PostgreSQL (port 5432)
- Persistent volume

---

## Production Checklist

### Security

- [ ] Add authentication (API keys)
- [ ] Configure CORS properly
- [ ] Use HTTPS (reverse proxy)
- [ ] Set rate limits
- [ ] Validate inputs

### Monitoring

- [ ] Add health checks
- [ ] Configure logging
- [ ] Track token usage
- [ ] Monitor error rates
- [ ] Set up alerts

### Scaling

- [ ] Use Redis/Postgres for memory
- [ ] Deploy multiple instances
- [ ] Load balancer
- [ ] CDN for static assets
- [ ] Auto-scaling

### Testing

- [ ] Run pytest suite
- [ ] Load testing
- [ ] Security scanning
- [ ] API contract tests

---

## Examples

### Support Bot (Full Features)

```typescript
await exporter.export(supportBotManifest, {
  pythonVersion: '3.11',
  includeApi: true,
  includeOpenApi: true,
  includeDocker: true,
  includeTests: true,
  memoryBackend: 'redis',
  apiPort: 8000,
});
```

**Generated:**
- agent.py (200 lines)
- tools.py (3 tools, 150 lines)
- memory.py (Redis backend, 120 lines)
- server.py (FastAPI, 250 lines)
- openapi.yaml (OpenAPI 3.1 spec)
- Dockerfile
- docker-compose.yaml (with Redis)
- requirements.txt
- .env.example
- README.md
- test_agent.py

### Simple Chat Bot

```typescript
await exporter.export(chatBotManifest, {
  memoryBackend: 'buffer',
  includeDocker: false,
  includeTests: false,
});
```

**Generated:**
- agent.py
- tools.py (empty tools)
- memory.py (buffer backend)
- server.py
- requirements.txt
- .env.example
- README.md

---

## Validation

All generated code is validated:

✅ **Python Syntax** - Valid Python 3.11+ code
✅ **OpenAPI Schema** - Valid OpenAPI 3.1 spec
✅ **Docker** - Valid Dockerfile/compose syntax
✅ **Type Hints** - Full Python typing

---

## API-First Architecture

The exporter follows API-first principles:

1. **OpenAPI Spec** drives API contract
2. **Pydantic Models** from schemas
3. **FastAPI** enforces types
4. **Validation** automatic
5. **Documentation** auto-generated

---

## SOLID Principles

| Principle | Implementation |
|-----------|----------------|
| **S**ingle Responsibility | Each generator handles one concern |
| **O**pen/Closed | Extensible via options |
| **L**iskov Substitution | Memory backends interchangeable |
| **I**nterface Segregation | Small, focused interfaces |
| **D**ependency Inversion | Depend on abstractions |

---

## Testing

### Unit Tests

```bash
npm run test:unit -- langchain-exporter.test.ts
```

**Coverage:** >80%

### Integration Tests

```bash
# Generate agent
tsx examples/export/langchain-export-example.ts

# Test generated agent
cd examples/export/output/support-bot
pytest test_agent.py -v
```

### E2E Tests

```bash
# Start server
docker-compose up -d

# Test API
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

---

## Performance

| Metric | Value |
|--------|-------|
| Export Time | <100ms |
| Generated Files | 5-12 files |
| Total Size | ~50KB |
| Memory Usage | <10MB |

---

## Troubleshooting

### Import Errors

**Problem:** `ModuleNotFoundError: No module named 'langchain'`

**Solution:**
```bash
pip install -r requirements.txt
```

### Redis Connection

**Problem:** `redis.exceptions.ConnectionError`

**Solution:**
```bash
docker-compose up redis
# OR
export REDIS_URL=redis://your-redis-server:6379
```

### API Key Missing

**Problem:** `openai.error.AuthenticationError`

**Solution:**
```bash
cp .env.example .env
# Add your API key to .env
export OPENAI_API_KEY=sk-xxx
```

---

## Roadmap

- [ ] Streaming tools support
- [ ] Advanced memory (vector stores)
- [ ] Multi-agent support
- [ ] LangGraph integration
- [ ] Observability (traces, metrics)
- [ ] A/B testing
- [ ] Prompt versioning

---

## Related Documentation

- [LangChain Documentation](https://python.langchain.com)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.1.0)
- [Docker Documentation](https://docs.docker.com)

---

## Support

**Issues:** [GitHub Issues](https://github.com/blueflyio/openstandardagents/issues)
**Examples:** `examples/export/langchain-export-example.ts`
**Tests:** `tests/unit/export/langchain/`
