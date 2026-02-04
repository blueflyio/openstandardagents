# Production Agent with Streaming Support

This example demonstrates a production-quality LangChain agent with comprehensive streaming support.

## Features

- **Server-Sent Events (SSE)**: Real-time one-way streaming from server to client
- **WebSocket**: Bidirectional communication for interactive streaming
- **Agent-to-Agent (a2a)**: Integration with Agent Mesh for multi-agent streaming
- **Token-by-Token**: Real LangChain streaming callbacks for progressive responses
- **Tool Streaming**: Real-time updates during tool execution

## Quick Start

### 1. Export the Agent

```bash
# Export to LangChain with streaming enabled
ossa export agent.ossa.yaml --target langchain --output ./agent
```

The exporter will automatically generate `streaming.py` with all streaming implementations.

### 2. Install Dependencies

```bash
cd agent
pip install -r requirements.txt
```

Dependencies include:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `sse-starlette` - Server-Sent Events support
- `websockets` - WebSocket support
- `langchain` - Agent framework

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

Required environment variables:
```env
OPENAI_API_KEY=sk-...
REDIS_HOST=localhost
REDIS_PORT=6379
AGENT_MESH_URL=http://localhost:8080  # Optional: for a2a streaming
```

### 4. Start the Server

```bash
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

## Usage Examples

### Server-Sent Events (SSE)

SSE is perfect for one-way streaming from server to client (like chat completions).

**JavaScript Client:**

```javascript
const eventSource = new EventSource(
  'http://localhost:8000/chat/stream?message=Hello&session_id=user123'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'llm_start':
      console.log('LLM generation started');
      break;

    case 'token':
      // Append token to UI in real-time
      process.stdout.write(data.token);
      break;

    case 'tool_start':
      console.log(`\nTool started: ${data.tool}`);
      break;

    case 'tool_end':
      console.log(`Tool completed: ${data.output}`);
      break;

    case 'done':
      console.log(`\n\nComplete: ${data.result}`);
      eventSource.close();
      break;

    case 'error':
      console.error('Error:', data.error);
      eventSource.close();
      break;
  }
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
  eventSource.close();
};
```

**Python Client:**

```python
import httpx
import json

async def stream_chat_sse(message: str):
    async with httpx.AsyncClient() as client:
        async with client.stream(
            'GET',
            'http://localhost:8000/chat/stream',
            params={'message': message, 'session_id': 'user123'}
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith('data: '):
                    data = json.loads(line[6:])

                    if data['type'] == 'token':
                        print(data['token'], end='', flush=True)
                    elif data['type'] == 'done':
                        print(f"\n\nComplete: {data['result']}")
                        break
```

### WebSocket Streaming

WebSocket enables bidirectional communication for interactive conversations.

**JavaScript Client:**

```javascript
const ws = new WebSocket('ws://localhost:8000/ws?session_id=user123');

ws.onopen = () => {
  console.log('WebSocket connected');

  // Send message
  ws.send(JSON.stringify({
    message: 'Hello, how can you help me?'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'token':
      process.stdout.write(data.token);
      break;

    case 'tool_start':
      console.log(`\nExecuting tool: ${data.tool}`);
      break;

    case 'done':
      console.log(`\n\nComplete: ${data.result}`);
      break;

    case 'error':
      console.error('Error:', data.error);
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket disconnected');
};
```

**Python Client:**

```python
import asyncio
import websockets
import json

async def chat_websocket():
    uri = "ws://localhost:8000/ws?session_id=user123"

    async with websockets.connect(uri) as websocket:
        # Send message
        await websocket.send(json.dumps({
            "message": "Hello, how can you help me?"
        }))

        # Receive streaming response
        while True:
            response = await websocket.recv()
            data = json.loads(response)

            if data['type'] == 'token':
                print(data['token'], end='', flush=True)
            elif data['type'] == 'done':
                print(f"\n\nComplete: {data['result']}")
                break
            elif data['type'] == 'error':
                print(f"Error: {data['error']}")
                break

asyncio.run(chat_websocket())
```

### Agent-to-Agent (a2a) Streaming

The a2a implementation automatically streams responses to the Agent Mesh for multi-agent coordination.

**Python Usage:**

```python
from streaming import stream_a2a
from agent import create_agent

async def main():
    agent = create_agent()

    result = await stream_a2a(
        agent_id="production-streaming-agent",
        message="Analyze this data",
        agent=agent,
        mesh_url="http://localhost:8080",
        target_agent="data-analyzer"  # Optional: route to specific agent
    )

    print(f"Streamed to mesh: {result['success']}")
```

The a2a client will:
1. Collect all streaming events (tokens, tool calls)
2. Accumulate the full response
3. Post to Agent Mesh with complete metadata
4. Include streaming events for replay/analysis

## Event Types

All streaming implementations emit these event types:

| Event Type | Description | Fields |
|------------|-------------|--------|
| `llm_start` | LLM generation started | `prompts` |
| `token` | New token generated | `token` |
| `llm_end` | LLM generation completed | `full_response`, `tokens` |
| `tool_start` | Tool execution started | `tool`, `input` |
| `tool_end` | Tool execution completed | `output` |
| `tool_error` | Tool execution failed | `error`, `error_type` |
| `error` | LLM error occurred | `error`, `error_type` |
| `done` | Complete response ready | `result` |

## Customization

### Disable Specific Streaming Methods

```yaml
# In agent.ossa.yaml
spec:
  streaming:
    sse:
      enabled: false  # Disable SSE
    websocket:
      enabled: true   # Keep WebSocket
    a2a:
      enabled: false  # Disable a2a
```

### Custom Endpoints

```yaml
spec:
  streaming:
    sse:
      enabled: true
      endpoint: /api/stream  # Custom SSE endpoint

    websocket:
      enabled: true
      endpoint: /chat       # Custom WebSocket endpoint
      port: 9000           # Custom port
```

### Selective Callbacks

```yaml
spec:
  streaming:
    callbacks:
      on_llm_start: true
      on_llm_new_token: true    # Token-by-token streaming
      on_llm_end: true
      on_tool_start: false       # Disable tool start events
      on_tool_end: false         # Disable tool end events
```

## Architecture

### LangChain Streaming Callbacks

The `StreamingCallbackHandler` class hooks into LangChain's callback system:

```python
class StreamingCallbackHandler(BaseCallbackHandler):
    def on_llm_new_token(self, token: str, **kwargs):
        # Called for EACH token generated
        asyncio.create_task(self.queue.put({
            "type": "token",
            "token": token,
        }))
```

This provides **real token-by-token streaming** (not word-splitting simulation).

### Connection Management

WebSocket connections are managed by `ConnectionManager`:

```python
manager = ConnectionManager()

# Multiple concurrent sessions
await manager.connect(websocket, "user123")
await manager.connect(websocket2, "user456")

# Broadcast or send to specific session
await manager.send_message("user123", event)
await manager.broadcast(event)
```

### Error Handling

All streaming implementations include:
- Try/catch blocks around agent execution
- Automatic cleanup on errors
- Error events sent to clients
- Graceful disconnection handling

## Performance

### SSE
- **Latency**: ~10-50ms per token
- **Connections**: 100+ concurrent
- **Best for**: One-way streaming, mobile clients

### WebSocket
- **Latency**: ~5-20ms per token
- **Connections**: 1000+ concurrent
- **Best for**: Interactive chat, bidirectional

### a2a
- **Latency**: Depends on mesh
- **Connections**: Agent-to-agent only
- **Best for**: Multi-agent orchestration

## Troubleshooting

### SSE Connection Drops

If SSE connections drop frequently:

```python
# Add keep-alive pings
yield ":\n\n"  # Comment-only SSE event (keep-alive)
```

### WebSocket Reconnection

```javascript
let reconnectAttempts = 0;
const maxReconnect = 5;

function connectWebSocket() {
  const ws = new WebSocket('ws://localhost:8000/ws?session_id=user123');

  ws.onclose = () => {
    if (reconnectAttempts < maxReconnect) {
      reconnectAttempts++;
      setTimeout(connectWebSocket, 1000 * reconnectAttempts);
    }
  };
}
```

### Memory Leaks

Ensure proper cleanup:

```python
# Always close connections
try:
    await stream_websocket(websocket, agent, session_id)
finally:
    manager.disconnect(session_id)
```

## Production Considerations

1. **Rate Limiting**: Use `api.rate_limit` in manifest
2. **CORS**: Configure `api.cors.origins` for web clients
3. **Authentication**: Add auth middleware in `server.py`
4. **Monitoring**: Log all streaming events for debugging
5. **Scaling**: Use Redis for session state across instances

## Next Steps

- [LangChain Streaming Docs](https://python.langchain.com/docs/modules/callbacks/)
- [FastAPI WebSocket Guide](https://fastapi.tiangolo.com/advanced/websockets/)
- [SSE Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [Agent Mesh Documentation](https://github.com/blueflyio/agent-mesh)

## License

MIT - See LICENSE file for details
