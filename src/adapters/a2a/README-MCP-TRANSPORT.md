# MCP Transport Implementation

## Overview

The MCP Transport layer implements real client connections for Agent-to-Agent (A2A) communication using the Model Context Protocol (MCP). This replaces the previous mock implementation with production-ready transport support.

## Architecture

```
┌─────────────────────────────────────────┐
│   A2A Protocol Layer                    │
│   (OSSA Agent Communication)            │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   MCP Integration Service               │
│   • Protocol conversion (A2A ↔ MCP)     │
│   • Connection management                │
│   • Service discovery                    │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   MCP Transport Manager                 │
│   • Connection pooling                   │
│   • Retry logic                          │
│   • Transport abstraction                │
└───────────────┬─────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
┌──────────────┐  ┌──────────────┐
│   STDIO      │  │   HTTP/SSE   │
│   Transport  │  │   Transport  │
└──────────────┘  └──────────────┘
```

## Supported Transports

### 1. STDIO Transport

Connect to MCP servers running as child processes.

**URI Format**: `stdio://command/path/to/script?arg1=value1&arg2=value2`

**Example**:
```typescript
// Connect to Python MCP server
const uri = 'stdio://python/agents/python-agent/server.py?port=3001';
const connection = await mcpIntegration.connectMCPServer(uri);
```

**Use Cases**:
- Local agent development
- Sandboxed agent execution
- Cross-language agent communication (Python, PHP, etc.)

### 2. HTTP/SSE Transport

Connect to MCP servers over HTTP using Server-Sent Events.

**URI Format**: `http://host:port/path` or `https://host:port/path`

**Example**:
```typescript
// Connect to remote HTTP MCP server
const uri = 'https://api.example.com/mcp/agents/worker';
const connection = await mcpIntegration.connectMCPServer(uri);
```

**Use Cases**:
- Remote agent communication
- Production deployments
- Cloud-based agents
- Cross-network agent mesh

### 3. WebSocket Transport (Planned)

Support for WebSocket-based MCP connections.

**URI Format**: `ws://host:port/path` or `wss://host:port/path`

**Status**: Not yet implemented (throws error)

## Usage

### Basic Connection

```typescript
import { MCPIntegrationService } from './adapters/a2a/mcp-integration.js';

const mcpService = new MCPIntegrationService();

// Connect to MCP server
const connection = await mcpService.connectMCPServer(
  'http://localhost:3000/mcp'
);

console.log('Connected:', connection.id);
console.log('Server:', connection.name);
console.log('Capabilities:', connection.capabilities);
```

### Discover Resources

```typescript
// List available resources
const resources = await mcpService.discoverResources(connection.id);

for (const resource of resources) {
  console.log(`Resource: ${resource.name}`);
  console.log(`URI: ${resource.uri}`);
  console.log(`Type: ${resource.mimeType}`);
}
```

### Call Tools

```typescript
// Invoke remote tool
const result = await mcpService.callTool(
  connection.id,
  'analyze-code',
  {
    path: '/src/module.ts',
    depth: 2
  }
);

console.log('Tool result:', result);
```

### A2A Message Delegation

```typescript
import type { A2AMessage, AgentIdentity } from './adapters/a2a/a2a-protocol.js';

const from: AgentIdentity = {
  uri: 'ossa://orchestrator/main',
  name: 'Main Orchestrator',
  namespace: 'orchestrator',
  version: '1.0.0'
};

const to: AgentIdentity = {
  uri: 'ossa://workers/analyzer',
  name: 'Code Analyzer',
  namespace: 'workers',
  version: '1.0.0'
};

const a2aMessage: A2AMessage = {
  id: crypto.randomUUID(),
  from,
  to,
  type: 'command',
  payload: {
    action: 'analyze',
    files: ['src/app.ts', 'src/utils.ts']
  },
  version: '0.4.5',
  metadata: {
    priority: 'high',
    timeout: 60000,
    retries: 3,
    traceContext: {
      traceparent: '00-trace-span-01',
      traceId: 'trace-id',
      spanId: 'span-id'
    },
    createdAt: new Date().toISOString()
  }
};

// Convert A2A to MCP and send
const mcpMessage = mcpService.a2aToMCP(a2aMessage);
// MCP transport handles the actual communication
```

### Connection Pooling

The transport manager automatically pools connections:

```typescript
// First request creates connection
await mcpService.connectMCPServer('http://localhost:3000/mcp');

// Second request reuses existing connection
await mcpService.connectMCPServer('http://localhost:3000/mcp');

// Get connection stats
const stats = mcpService.getTransportStats();
console.log(`Active connections: ${stats.totalConnections}`);
console.log(`Total requests: ${stats.totalRequests}`);
```

### Error Handling

```typescript
try {
  const connection = await mcpService.connectMCPServer(
    'http://unreachable:9999/mcp'
  );
} catch (error) {
  if (error.message.includes('Connection timeout')) {
    console.error('Server not responding');
  } else if (error.message.includes('ECONNREFUSED')) {
    console.error('Server not running');
  } else {
    console.error('Connection failed:', error.message);
  }
}
```

### Cleanup

```typescript
// Disconnect specific connection
await mcpService.disconnectMCPServer(connection.id);

// Disconnect all connections
await mcpService.cleanup();
```

## Configuration

### Connection Timeout

Default: 30 seconds

```typescript
// Configured per transport in MCPTransportConfig
interface MCPTransportConfig {
  timeout?: number;        // Connection timeout (ms)
  requestTimeout?: number; // Request timeout (ms)
}
```

### Retry Logic

- Max retries: 3
- Backoff: Exponential (1s, 2s, 4s, max 10s)
- Auto-reconnect on connection errors

### Request Timeout

Default: 30 seconds per request

## Testing

### Unit Tests

```bash
# Run MCP transport tests
npm test -- mcp-transport.spec.ts

# Run MCP integration tests
npm test -- mcp-integration.spec.ts
```

### Integration Tests

Tests verify:
- URI parsing for all transport types
- Connection pooling and reuse
- Request timeout handling
- Automatic reconnection
- Error handling
- Protocol conversion (A2A ↔ MCP)

**Note**: Tests run without real MCP servers and expect connection failures. This validates that the transport layer correctly attempts connections with proper error handling.

## Protocol Mapping

### A2A to MCP

| A2A Type | MCP Method |
|----------|------------|
| `request` | `tools/call` |
| `command` | `tools/call` |
| `event` | `notification` |
| `response` | Response format |

### MCP to A2A

| MCP Method | A2A Type |
|------------|----------|
| `tools/call` | `command` |
| `notification` | `event` |
| `resources/read` | `request` |

## Examples

### Cross-Language Communication

**TypeScript Agent → Python Agent**:

```typescript
// TypeScript side
const pythonAgent = 'stdio://python/agents/nlp/server.py';
const connection = await mcpService.connectMCPServer(pythonAgent);

const result = await mcpService.callTool(connection.id, 'analyze-sentiment', {
  text: 'This is amazing!',
  language: 'en'
});
```

**Python Agent → TypeScript Agent**:

```python
# Python side (using MCP SDK)
from mcp.server import Server

server = Server("nlp-agent")

@server.tool("analyze-sentiment")
async def analyze_sentiment(text: str, language: str) -> dict:
    # Process sentiment analysis
    return {"sentiment": "positive", "score": 0.95}
```

### Remote Agent Mesh

```typescript
// Connect to multiple remote agents
const agents = [
  'https://agent1.example.com/mcp',
  'https://agent2.example.com/mcp',
  'https://agent3.example.com/mcp'
];

const connections = await Promise.all(
  agents.map(uri => mcpService.connectMCPServer(uri))
);

// Broadcast command to all agents
const results = await Promise.all(
  connections.map(conn =>
    mcpService.callTool(conn.id, 'health-check', {})
  )
);
```

## Performance

### Connection Pooling

- Connections are reused for the same URI
- Automatic cleanup of idle connections
- Connection stats tracked per URI

### Request Metrics

```typescript
const stats = mcpService.getTransportStats();

// Per-connection metrics
for (const conn of stats.connections) {
  console.log(`URI: ${conn.uri}`);
  console.log(`Requests: ${conn.requestCount}`);
  console.log(`Connected: ${conn.connectedAt}`);
  console.log(`Last Activity: ${conn.lastActivity}`);
}
```

## Security

### Transport Security

- HTTPS/WSS recommended for production
- STDIO sandboxed via process isolation
- Authentication handled by MCP layer

### Error Privacy

- Connection errors logged but sanitized
- No sensitive data in error messages
- Trace context preserved for debugging

## Troubleshooting

### Connection Refused

```
Error: Failed to connect to MCP server: ECONNREFUSED
```

**Solution**: Verify MCP server is running and listening on specified port.

### Connection Timeout

```
Error: Connection timeout after 30000ms
```

**Solution**: Check network connectivity, firewall rules, or increase timeout.

### Transport Not Supported

```
Error: WebSocket transport not yet implemented
```

**Solution**: Use STDIO or HTTP transport. WebSocket support coming soon.

## Roadmap

- [x] STDIO transport
- [x] HTTP/SSE transport
- [x] Connection pooling
- [x] Automatic retry
- [x] A2A protocol conversion
- [ ] WebSocket transport
- [ ] Authentication plugins
- [ ] Connection health checks
- [ ] Load balancing
- [ ] Circuit breaker pattern

## References

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [OSSA A2A Protocol](./a2a-protocol.ts)
- [Agent Mesh Documentation](../../../docs/agent-mesh.md)
