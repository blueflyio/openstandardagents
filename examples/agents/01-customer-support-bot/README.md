# Customer Support Bot

Production-ready customer support agent built with OSSA v0.3.6 and exported to LangChain.

## Features

- Multi-turn conversations with memory
- Documentation search integration
- Automated ticket creation
- Email notifications
- PII redaction and safety filters
- OpenTelemetry observability
- Redis-backed session persistence

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for LangChain)
- OpenAI API key
- Redis instance

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=sk-...

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f customer-support-bot

# Health check
curl http://localhost:8080/v1/health
```

### Local Development

```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Build TypeScript
npm run build

# Start development server
npm run dev
```

## Usage

### Send a message

```bash
curl -X POST http://localhost:8080/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I reset my password?",
    "sessionId": "sess_123",
    "userId": "user_456"
  }'
```

### Get conversation history

```bash
curl http://localhost:8080/v1/session/sess_123/history
```

### Create a ticket

```bash
curl -X POST http://localhost:8080/v1/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Login issue",
    "description": "Unable to access account after password reset",
    "priority": "high",
    "category": "technical"
  }'
```

## OSSA Export

This agent is defined in OSSA format and can be exported to multiple platforms:

### Export to LangChain (Python)

```bash
ossa export agent.ossa.yaml --platform langchain --output customer_support.py
```

Generated file: `customer_support.py`

```python
from langchain.agents import create_react_agent
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.tools import Tool

# Auto-generated from OSSA manifest
class CustomerSupportAgent:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
        self.memory = ConversationBufferMemory(memory_key="chat_history")
        self.tools = [
            Tool(name="search_docs", func=self.search_docs, ...),
            Tool(name="create_ticket", func=self.create_ticket, ...),
            Tool(name="send_email", func=self.send_email, ...)
        ]
        self.agent = create_react_agent(self.llm, self.tools, ...)
```

### Export to LangChain (TypeScript)

```bash
ossa export agent.ossa.yaml --platform langchain-js --output customer-support.ts
```

### Export to npm package

```bash
ossa export agent.ossa.yaml --platform npm --output dist/
```

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   Express API       │
│  (OpenAPI 3.1)      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  OSSA Agent Runtime │
│  - LangChain Agent  │
│  - Memory Manager   │
│  - Tool Executor    │
└──────┬──────────────┘
       │
       ├───► Redis (Memory)
       │
       ├───► OpenAI (LLM)
       │
       └───► Tools (Docs, Tickets, Email)
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `REDIS_URL` | Redis connection URL | Yes |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | No (default: info) |
| `METRICS_ENABLED` | Enable Prometheus metrics | No (default: true) |
| `NODE_ENV` | Environment (development, production) | No (default: development) |

### Memory Configuration

The agent uses conversation buffer memory with Redis persistence:

```yaml
memory:
  type: conversation_buffer
  window_size: 10          # Keep last 10 messages
  persistence:
    backend: redis
    ttl: 86400            # 24 hours
```

### Safety Configuration

Built-in safety features:

- PII detection and redaction
- Profanity filtering
- Hallucination checking
- Tone analysis

## Monitoring

### Metrics

Access Prometheus metrics at `http://localhost:9090/metrics`:

- `conversations_total` - Total conversations handled
- `tickets_created` - Number of tickets created
- `emails_sent` - Number of emails sent
- `response_time` - Average response time

### Logs

Structured JSON logs are written to `./logs/`:

```json
{
  "level": "info",
  "timestamp": "2026-02-02T12:00:00Z",
  "sessionId": "sess_123",
  "action": "message_received",
  "userId": "user_456"
}
```

### Tracing

OpenTelemetry traces are exported for distributed tracing.

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Test OSSA manifest validation
ossa validate agent.ossa.yaml
```

## Production Deployment

### Kubernetes

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=customer-support-bot

# View logs
kubectl logs -f deployment/customer-support-bot
```

### Scaling

The agent is stateless (session data in Redis) and can be horizontally scaled:

```bash
docker-compose up -d --scale customer-support-bot=3
```

## Troubleshooting

### Agent not responding

Check Redis connection:
```bash
docker-compose logs redis
redis-cli ping
```

### High latency

Check OpenAI API status and rate limits:
```bash
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

### Memory issues

Clear Redis cache:
```bash
redis-cli FLUSHDB
```

## License

Apache-2.0

## Support

For issues and questions:
- GitHub Issues: https://github.com/org/repo/issues
- Email: support@techcorp.com
