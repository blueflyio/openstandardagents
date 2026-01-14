# WebSocket Transport Protocol

## Overview

WebSocket transport enables bidirectional, real-time communication between OSSA agents over persistent connections. This specification defines how agents use WebSocket connections for agent-to-agent messaging, capability calls, and status updates.

## Connection Lifecycle

### Connection Establishment

```typescript
// Client initiates connection
const ws = new WebSocket('wss://agent.example.com/ws');

// Send agent registration on connect
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'register',
    agentId: 'agent://example.com/my-agent',
    capabilities: ['process_data', 'analyze_content'],
    version: 'ossa/v0.3.1'
  }));
};
```

### Authentication

WebSocket connections MUST authenticate using one of:

1. **Bearer Token** - Include in initial HTTP upgrade request
2. **Query Parameter** - For restricted environments: `?token=<jwt>`
3. **Message-based Auth** - Send auth message after connection

```http
GET /ws HTTP/1.1
Host: agent.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Heartbeat/Keepalive

Agents MUST implement ping/pong to maintain connection health:

- Server sends `ping` every 30 seconds
- Client responds with `pong` within 5 seconds
- Connection closes after 3 missed pongs

```json
// Server ping
{"type": "ping", "timestamp": "2025-12-18T14:00:00Z"}

// Client pong
{"type": "pong", "timestamp": "2025-12-18T14:00:00Z"}
```

## Message Format

### Base Message Structure

```typescript
interface WebSocketEvent {
  type: 'message' | 'capability_call' | 'status_update' | 'error' | 'ack';
  id: string;                    // Unique message ID (UUID)
  timestamp: string;              // ISO 8601 timestamp
  payload: unknown;               // Message-specific payload
  metadata: {
    agentId: string;              // Sender agent URI
    correlationId?: string;       // For request/response matching
    replyTo?: string;             // WebSocket connection ID for responses
    priority?: 'low' | 'normal' | 'high' | 'critical';
    ttl?: number;                 // Time-to-live in seconds
  };
}
```

### Message Types

#### 1. Message Event

Pub/sub style message broadcast:

```json
{
  "type": "message",
  "id": "msg-123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2025-12-18T14:00:00Z",
  "payload": {
    "channel": "content.published",
    "data": {
      "contentId": "node-123",
      "title": "New Article",
      "status": "published"
    }
  },
  "metadata": {
    "agentId": "agent://example.com/publisher",
    "priority": "normal"
  }
}
```

#### 2. Capability Call

RPC-style capability invocation:

```json
{
  "type": "capability_call",
  "id": "call-456e7890-a12b-34c5-d678-901234567890",
  "timestamp": "2025-12-18T14:00:00Z",
  "payload": {
    "capability": "analyze_content",
    "input": {
      "contentId": "node-123",
      "analysisType": "sentiment"
    }
  },
  "metadata": {
    "agentId": "agent://example.com/analyzer",
    "correlationId": "req-789",
    "replyTo": "ws-conn-abc123"
  }
}
```

#### 3. Status Update

Agent health and status broadcasts:

```json
{
  "type": "status_update",
  "id": "status-901e2345-f67g-89h0-i123-456789012345",
  "timestamp": "2025-12-18T14:00:00Z",
  "payload": {
    "status": "healthy",
    "load": 0.45,
    "activeConnections": 12,
    "capabilities": ["process_data", "analyze_content"]
  },
  "metadata": {
    "agentId": "agent://example.com/worker-1"
  }
}
```

#### 4. Error Event

Error notifications:

```json
{
  "type": "error",
  "id": "err-234f5678-g90h-12i3-j456-789012345678",
  "timestamp": "2025-12-18T14:00:00Z",
  "payload": {
    "code": "CAPABILITY_NOT_FOUND",
    "message": "Capability 'unknown_capability' not found",
    "details": {
      "requestedCapability": "unknown_capability",
      "availableCapabilities": ["process_data", "analyze_content"]
    }
  },
  "metadata": {
    "agentId": "agent://example.com/agent",
    "correlationId": "req-789"
  }
}
```

#### 5. Acknowledgment

Message delivery confirmation:

```json
{
  "type": "ack",
  "id": "ack-567g8901-h23i-45j6-k789-012345678901",
  "timestamp": "2025-12-18T14:00:00Z",
  "payload": {
    "messageId": "msg-123e4567-e89b-12d3-a456-426614174000",
    "status": "received"
  },
  "metadata": {
    "agentId": "agent://example.com/receiver"
  }
}
```

## Error Handling

### Reconnection Strategy

Clients MUST implement exponential backoff for reconnection:

```typescript
const reconnect = (attempt: number) => {
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
  setTimeout(() => connectWebSocket(), delay);
};
```

### Connection Loss

On connection loss:

1. Client buffers outgoing messages (up to configured limit)
2. Client attempts reconnection with exponential backoff
3. On reconnect, client reregisters and resends buffered messages
4. Messages older than TTL are discarded

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `AUTH_FAILED` | Authentication failed | Refresh token and reconnect |
| `CAPABILITY_NOT_FOUND` | Unknown capability | Check capability registration |
| `RATE_LIMIT_EXCEEDED` | Too many messages | Implement backoff |
| `PAYLOAD_TOO_LARGE` | Message exceeds size limit | Reduce payload or use chunking |
| `PROTOCOL_ERROR` | Invalid message format | Fix message structure |

## Message Ordering

WebSocket transport provides **ordered delivery** per connection:

- Messages sent on the same connection arrive in order
- No ordering guarantees across different connections
- Use `correlationId` for request/response matching

## Reliability Features

### At-Least-Once Delivery

Implement using acknowledgments:

```typescript
// Sender waits for ACK
const sendWithAck = async (message: WebSocketEvent) => {
  ws.send(JSON.stringify(message));

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('ACK timeout'));
    }, 5000);

    ackHandlers.set(message.id, () => {
      clearTimeout(timeout);
      resolve();
    });
  });
};
```

### Message Deduplication

Receivers SHOULD track message IDs to prevent duplicate processing:

```typescript
const processedMessages = new Set<string>();

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (processedMessages.has(message.id)) {
    return; // Duplicate, skip
  }

  processedMessages.add(message.id);
  processMessage(message);

  // Send ACK
  ws.send(JSON.stringify({
    type: 'ack',
    payload: { messageId: message.id, status: 'received' }
  }));
};
```

## Security Considerations

1. **TLS Required** - MUST use `wss://` in production
2. **Token Expiry** - JWT tokens SHOULD have short expiry (15 minutes)
3. **Rate Limiting** - Server SHOULD limit messages per connection
4. **Message Size** - Server SHOULD enforce max message size (1MB default)
5. **Origin Validation** - Server MUST validate `Origin` header

## Performance Tuning

### Message Batching

For high-throughput scenarios, batch multiple messages:

```json
{
  "type": "batch",
  "messages": [
    {"type": "message", "payload": {...}},
    {"type": "message", "payload": {...}}
  ]
}
```

### Compression

Enable WebSocket compression (permessage-deflate):

```http
Sec-WebSocket-Extensions: permessage-deflate; client_max_window_bits
```

## Examples

### Agent-to-Agent Communication

```typescript
// Agent A sends capability call to Agent B
ws.send(JSON.stringify({
  type: 'capability_call',
  id: uuid(),
  timestamp: new Date().toISOString(),
  payload: {
    capability: 'process_data',
    input: { data: [1, 2, 3] }
  },
  metadata: {
    agentId: 'agent://example.com/agent-a',
    correlationId: 'req-123',
    replyTo: 'ws-conn-abc'
  }
}));

// Agent B responds
ws.send(JSON.stringify({
  type: 'message',
  id: uuid(),
  timestamp: new Date().toISOString(),
  payload: {
    result: { processed: true, count: 3 }
  },
  metadata: {
    agentId: 'agent://example.com/agent-b',
    correlationId: 'req-123'
  }
}));
```

## Compatibility

- WebSocket protocol version: RFC 6455
- Minimum TLS version: 1.2
- Supported subprotocols: `ossa.v0.3.1`
- JSON payload encoding: UTF-8

## References

- [RFC 6455 - The WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
- [OSSA Message Envelope Specification](../messaging.md)
- [Agent Discovery Protocol](../discovery.md)
