# Production Agent with Streaming Support

This example demonstrates a production-quality LangChain agent with comprehensive streaming support.

## Features

- **Server-Sent Events (SSE)**: Real-time one-way streaming from server to client
- **WebSocket**: Bidirectional communication for interactive streaming with cancellation support
- **Agent-to-Agent (a2a)**: Integration with Agent Mesh for multi-agent streaming
- **Token-by-Token**: Real LangChain streaming callbacks for progressive responses
- **Tool Streaming**: Real-time updates during tool execution
- **Cost Tracking**: Real-time per-token cost tracking integrated with streaming callbacks
- **Backpressure Handling**: Prevents memory issues with queue size limits and timeouts
- **Stream Cancellation**: Cancel long-running agent executions via WebSocket

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
    case 'connected':
      console.log(`Connected: ${data.session_id}`);
      break;

    case 'llm_start':
      console.log(`LLM generation started: ${data.model}`);
      break;

    case 'token':
      // Append token to UI in real-time with cost tracking
      process.stdout.write(data.token);
      console.log(`\nTokens: ${data.token_count}, Cost: $${data.cost.toFixed(6)}`);
      break;

    case 'tool_start':
      console.log(`\nTool started: ${data.tool}`);
      break;

    case 'tool_end':
      console.log(`Tool completed: ${data.output}`);
      break;

    case 'llm_end':
      console.log(`\n\nLLM Complete: ${data.full_response}`);
      console.log(`Total tokens: ${data.tokens}`);
      if (data.cost_summary) {
        console.log(`Cost: $${data.cost_summary.total_cost.toFixed(6)}`);
      }
      break;

    case 'done':
      console.log(`\n\nComplete: ${data.result}`);
      if (data.cost_summary) {
        console.log(`Final Cost: $${data.cost_summary.total_cost.toFixed(6)}`);
        console.log(`Tokens: ${data.cost_summary.total_tokens}`);
      }
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
    type: 'message',
    message: 'Hello, how can you help me?'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'connected':
      console.log(`Session established: ${data.session_id}`);
      break;

    case 'token':
      // Real-time token with cost tracking
      process.stdout.write(data.token);
      if (data.cost && data.token_count % 10 === 0) {
        console.log(`\n[${data.token_count} tokens, $${data.cost.toFixed(6)}]`);
      }
      break;

    case 'tool_start':
      console.log(`\nExecuting tool: ${data.tool}`);
      break;

    case 'done':
      console.log(`\n\nComplete: ${data.result}`);
      if (data.cost_summary) {
        console.log(`\nCost Summary:`);
        console.log(`  Total Tokens: ${data.cost_summary.total_tokens}`);
        console.log(`  Total Cost: $${data.cost_summary.total_cost.toFixed(6)}`);
      }
      break;

    case 'cancelled':
      console.log('Stream cancelled by request');
      break;

    case 'error':
      console.error('Error:', data.error);
      break;
  }
};

// Cancel stream button
document.getElementById('cancelButton').onclick = () => {
  ws.send(JSON.stringify({ type: 'cancel' }));
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
| `connected` | Connection established | `session_id`, `message` |
| `llm_start` | LLM generation started | `prompts`, `model` |
| `token` | New token generated | `token`, `token_count`, `cost` |
| `llm_end` | LLM generation completed | `full_response`, `tokens`, `cost_summary` |
| `tool_start` | Tool execution started | `tool`, `input` |
| `tool_end` | Tool execution completed | `output` |
| `tool_error` | Tool execution failed | `error`, `error_type` |
| `error` | LLM error occurred | `error`, `error_type` |
| `cancelled` | Stream cancelled by user | - |
| `done` | Complete response ready | `result`, `cost_summary` |

### Cost Summary Object

```json
{
  "total_tokens": 150,
  "prompt_tokens": 50,
  "completion_tokens": 100,
  "total_cost": 0.000450,
  "model": "gpt-4"
}
```

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

## Advanced Features

### Real-Time Cost Tracking

Every streaming event includes cost information:

```python
# In streaming.py
class StreamingCallbackHandler(BaseCallbackHandler):
    def on_llm_new_token(self, token: str, **kwargs):
        # Track cost per token
        current_cost = self.cost_tracker.total_cost if self.cost_tracker else 0.0

        await self.queue.put({
            "type": "token",
            "token": token,
            "token_count": self.token_count,
            "cost": current_cost  # Real-time cost
        })
```

**Client-Side Cost Display:**

```javascript
let totalCost = 0;

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'token') {
    totalCost = data.cost;
    document.getElementById('cost').textContent = `$${totalCost.toFixed(6)}`;
  }
};
```

### Stream Cancellation (WebSocket Only)

Cancel long-running agent executions:

```javascript
// Client sends cancel request
ws.send(JSON.stringify({ type: 'cancel' }));

// Server cancels agent task and responds
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'cancelled') {
    console.log('Stream cancelled successfully');
  }
};
```

**Python Implementation:**

```python
# In streaming.py - ConnectionManager
async def stream_websocket(websocket, agent, session_id):
    current_task = None

    while True:
        data = await websocket.receive_json()

        # Handle cancellation
        if data.get("type") == "cancel":
            if current_task and not current_task.done():
                current_task.cancel()
                await websocket.send_json({
                    "type": "cancelled",
                    "message": "Stream cancelled by user"
                })
```

### Backpressure Handling

Prevents memory issues with queue size limits:

```python
# In streaming.py
class ConnectionManager:
    def __init__(self):
        self.max_queue_size = 1000  # Prevent memory issues

    async def connect(self, websocket, session_id):
        self.session_queues[session_id] = asyncio.Queue(
            maxsize=self.max_queue_size
        )

    async def send_message(self, session_id, message):
        # Add timeout to prevent blocking
        await asyncio.wait_for(
            self.active_connections[session_id].send_json(message),
            timeout=5.0
        )
```

### Connection Timeout & Heartbeat

SSE streams include heartbeat to keep connections alive:

```python
# In streaming.py
async def stream_sse(...):
    while True:
        try:
            # Wait with timeout for heartbeat
            event = await asyncio.wait_for(queue.get(), timeout=30.0)
            yield f"data: {json.dumps(event)}\n\n"

        except asyncio.TimeoutError:
            # Send heartbeat
            yield ": heartbeat\n\n"
            continue
```

## Architecture

### LangChain Streaming Callbacks with Cost Integration

The `StreamingCallbackHandler` class hooks into LangChain's callback system with cost tracking:

```python
class StreamingCallbackHandler(BaseCallbackHandler):
    def __init__(self, queue: asyncio.Queue, cost_tracker: Optional[Any] = None):
        self.queue = queue
        self.cost_tracker = cost_tracker
        self.token_count = 0

    def on_llm_new_token(self, token: str, **kwargs):
        # Called for EACH token generated
        self.token_count += 1

        # Get current cost
        current_cost = self.cost_tracker.total_cost if self.cost_tracker else 0.0

        asyncio.create_task(self.queue.put({
            "type": "token",
            "token": token,
            "token_count": self.token_count,
            "cost": current_cost,  # Real-time cost tracking
        }))

    def on_llm_end(self, response: LLMResult, **kwargs):
        # Calculate final cost from token usage
        if self.cost_tracker and response.llm_output:
            token_usage = response.llm_output.get("token_usage", {})
            # Update tracker with actual usage
            self.cost_tracker.prompt_tokens += token_usage.get("prompt_tokens", 0)
            self.cost_tracker.completion_tokens += token_usage.get("completion_tokens", 0)
            # Calculate cost based on model pricing
```

This provides **real token-by-token streaming with per-token cost tracking** (not word-splitting simulation).

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
