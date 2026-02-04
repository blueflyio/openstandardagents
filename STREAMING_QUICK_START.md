# Enhanced Streaming Quick Start Guide

## What's New

The LangChain exporter now generates production-grade streaming support with:

✅ **Real-time cost tracking** - See costs per token as they stream
✅ **Stream cancellation** - Cancel long-running agent executions
✅ **Backpressure handling** - Prevent memory issues with queue limits
✅ **SSE + WebSocket** - Both streaming protocols included
✅ **Full callback integration** - Integrates with callbacks.py cost tracking

## 30-Second Demo

### 1. Export an Agent with Streaming

```bash
# Create a simple agent manifest
cat > agent.ossa.yaml <<EOF
ossaVersion: v0.4.1
kind: Agent
metadata:
  name: demo-streaming-agent
  version: 1.0.0
spec:
  role: "You are a helpful AI assistant"
  llm:
    provider: openai
    model: gpt-4
EOF

# Export to LangChain
ossa export agent.ossa.yaml --target langchain --output ./demo-agent
```

### 2. Install Dependencies

```bash
cd demo-agent
pip install -r requirements.txt
```

The requirements now include streaming dependencies automatically:
- `sse-starlette>=1.8.0` - Server-Sent Events
- `websockets>=12.0` - WebSocket streaming

### 3. Start the Server

```bash
# Set API key
export OPENAI_API_KEY=sk-...

# Run server
uvicorn server:app --reload
```

### 4. Test Streaming

**SSE (Server-Sent Events):**

```bash
curl -N http://localhost:8000/chat/stream?message=Hello&session_id=demo
```

Output shows real-time tokens with cost tracking:
```
data: {"type":"connected","session_id":"demo"}
data: {"type":"llm_start","model":"gpt-4"}
data: {"type":"token","token":"Hello","token_count":1,"cost":0.000003}
data: {"type":"token","token":"!","token_count":2,"cost":0.000006}
...
data: {"type":"done","result":"Hello! How can I help?","cost_summary":{"total_tokens":42,"total_cost":0.000126}}
```

**WebSocket:**

```bash
# Install wscat for testing
npm install -g wscat

# Connect and send message
wscat -c "ws://localhost:8000/chat/ws?session_id=demo"
> {"type":"message","message":"Hello"}
< {"type":"connected","session_id":"demo"}
< {"type":"token","token":"Hello","token_count":1,"cost":0.000003}
...
```

**Cancel WebSocket Stream:**

```bash
# While stream is running, send cancel message
> {"type":"cancel"}
< {"type":"cancelled"}
```

## Generated Files

The exporter creates these files with streaming support:

```
demo-agent/
├── streaming.py           # ⭐ Enhanced with cost tracking
│   ├── StreamingCallbackHandler  # Cost tracker integration
│   ├── stream_sse()              # SSE with heartbeat
│   └── stream_websocket()        # WebSocket with cancellation
├── server.py              # ⭐ Updated endpoints
│   ├── POST /chat/stream         # SSE endpoint
│   ├── WS /chat/ws              # WebSocket endpoint
│   ├── GET /cost-summary        # Cost tracking endpoint
│   └── POST /cost-summary/reset # Reset cost counters
├── callbacks.py           # Cost tracking handler
├── agent.py              # Main agent code
├── tools.py              # Agent tools
├── memory.py             # Conversation memory
└── requirements.txt      # ⭐ Includes streaming deps
```

## Code Examples

### Python Client - SSE

```python
import asyncio
import httpx
import json

async def stream_chat(message: str):
    async with httpx.AsyncClient() as client:
        async with client.stream(
            'GET',
            'http://localhost:8000/chat/stream',
            params={'message': message, 'session_id': 'demo'}
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith('data: '):
                    data = json.loads(line[6:])

                    if data['type'] == 'token':
                        print(data['token'], end='', flush=True)
                        print(f"\n[Cost: ${data['cost']:.6f}]", end=' ')

                    elif data['type'] == 'done':
                        cost = data['cost_summary']['total_cost']
                        print(f"\n\nTotal: ${cost:.6f}")
                        break

asyncio.run(stream_chat("Hello!"))
```

### JavaScript Client - WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8000/chat/ws?session_id=demo');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'message',
    message: 'Hello!'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'token') {
    // Display token with cost
    console.log(`${data.token} [$${data.cost.toFixed(6)}]`);
  }

  if (data.type === 'done') {
    console.log(`Total: $${data.cost_summary.total_cost.toFixed(6)}`);
  }
};

// Cancel button
document.getElementById('cancel').onclick = () => {
  ws.send(JSON.stringify({ type: 'cancel' }));
};
```

## Event Types Reference

### Connection Events

```json
{"type": "connected", "session_id": "demo", "message": "..."}
```

### LLM Events

```json
// Generation started
{"type": "llm_start", "prompts": [...], "model": "gpt-4"}

// Each token (with cost)
{"type": "token", "token": "Hello", "token_count": 1, "cost": 0.000003}

// Generation completed
{"type": "llm_end", "full_response": "...", "tokens": 42, "cost_summary": {...}}
```

### Tool Events

```json
{"type": "tool_start", "tool": "calculator", "input": "2+2"}
{"type": "tool_end", "output": "4"}
{"type": "tool_error", "error": "...", "error_type": "ValueError"}
```

### Completion Events

```json
// Success
{"type": "done", "result": "...", "cost_summary": {...}}

// Cancelled
{"type": "cancelled"}

// Error
{"type": "error", "error": "...", "error_type": "..."}
```

## Cost Summary Structure

```json
{
  "total_tokens": 150,
  "prompt_tokens": 50,
  "completion_tokens": 100,
  "total_cost": 0.000450,
  "model": "gpt-4"
}
```

## Advanced Configuration

### Disable Specific Streaming Methods

```yaml
# In agent.ossa.yaml
spec:
  streaming:
    sse:
      enabled: false  # Disable SSE
    websocket:
      enabled: true   # Keep WebSocket
```

### Custom Endpoints

```yaml
spec:
  streaming:
    sse:
      endpoint: /api/stream
    websocket:
      endpoint: /chat
      port: 9000
```

## Production Deployment

### Docker

```bash
# Generated Dockerfile includes streaming support
docker build -t demo-agent .
docker run -p 8000:8000 -e OPENAI_API_KEY=sk-... demo-agent
```

### Docker Compose

```bash
# Generated docker-compose.yaml ready to use
docker-compose up
```

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (for cost tracking)
LANGSMITH_ENABLED=true
LANGCHAIN_API_KEY=ls-...
LANGCHAIN_PROJECT=my-project
```

## Monitoring

### Get Cost Summary

```bash
curl http://localhost:8000/cost-summary
```

Response:
```json
{
  "total_tokens": 1500,
  "prompt_tokens": 500,
  "completion_tokens": 1000,
  "total_cost": 0.045000,
  "model": "gpt-4"
}
```

### Reset Cost Counters

```bash
curl -X POST http://localhost:8000/cost-summary/reset
```

## Performance

**SSE:**
- Latency: ~10-50ms per token
- Connections: 100+ concurrent
- Best for: Mobile, web browsers, one-way streams

**WebSocket:**
- Latency: ~5-20ms per token
- Connections: 1000+ concurrent
- Best for: Interactive chat, bidirectional, cancellable

## Troubleshooting

### Connection Drops

SSE connections may drop after 30s of inactivity. The implementation includes automatic heartbeat:

```python
# Heartbeat sent every 30s
yield ": heartbeat\n\n"
```

### Memory Issues

Backpressure handling prevents memory issues:

```python
# Queue size limited to 1000 events
self.session_queues[session_id] = asyncio.Queue(maxsize=1000)

# Send timeout prevents blocking
await asyncio.wait_for(websocket.send_json(message), timeout=5.0)
```

### Cost Tracking Not Working

Ensure `callbacks.py` is imported correctly:

```python
# In streaming.py
from callbacks import CostTrackingHandler
```

If unavailable, cost tracking gracefully degrades:

```python
try:
    from callbacks import CostTrackingHandler
    COST_TRACKING_AVAILABLE = True
except ImportError:
    COST_TRACKING_AVAILABLE = False
    logger.warning("callbacks module not available")
```

## Next Steps

1. **Full Documentation**: See `examples/export/langchain/production-agent-with-streaming/README.md`
2. **Client Example**: Run `examples/export/langchain/production-agent-with-streaming/client-example.py`
3. **LangChain Callbacks**: https://python.langchain.com/docs/modules/callbacks/
4. **FastAPI WebSocket**: https://fastapi.tiangolo.com/advanced/websockets/

## Questions?

- Check the full example: `examples/export/langchain/production-agent-with-streaming/`
- Review the summary: `STREAMING_ENHANCEMENT_SUMMARY.md`
- Test with the demo client: `client-example.py`
