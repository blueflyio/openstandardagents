---
title: "Server-Sent Events (SSE)"
description: "OSSA v0.3.2 SSE transport protocol for unidirectional server-to-client streaming"
weight: 3
---

# Server-Sent Events (SSE) Transport Protocol

Unidirectional server-to-client streaming over HTTP for real-time event delivery.

## Overview

Server-Sent Events (SSE) provides unidirectional server-to-client streaming over HTTP. This specification defines how OSSA agents use SSE for real-time event delivery, status updates, and streaming responses.

## Connection Model

SSE is a **one-way protocol**: server sends events to client. For bidirectional communication, combine SSE (server-to-client) with HTTP POST (client-to-server).

```
Client ─────POST───────> Server  (Commands/Requests)
       <────SSE Events── Server  (Events/Responses)
```

## Connection Establishment

### Client Connection

```typescript
const eventSource = new EventSource('https://agent.example.com/events', {
  withCredentials: true
});

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
});

eventSource.addEventListener('error', (error) => {
  console.error('Connection error:', error);
});
```

### Server Response Format

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache, no-store, must-revalidate
Connection: keep-alive
X-Accel-Buffering: no

data: {"type":"connected","timestamp":"2025-12-18T14:00:00Z"}

```

## Event Format

### SSE Message Structure

```
event: <event-type>
id: <message-id>
retry: <reconnect-time-ms>
data: <json-payload>

```

### OSSA Event Schema

```typescript
interface SSEEvent {
  type: 'message' | 'status' | 'capability_response' | 'error';
  id: string;                    // Unique event ID
  timestamp: string;              // ISO 8601 timestamp
  payload: unknown;               // Event-specific data
  metadata: {
    agentId: string;              // Source agent URI
    streamId?: string;            // For multi-stream scenarios
    correlationId?: string;       // Links to originating request
    sequence?: number;            // Event sequence number
    final?: boolean;              // Indicates last event in sequence
  };
}
```

## Event Types

### 1. Message Event

Standard event delivery:

```
event: message
id: msg-123e4567-e89b-12d3-a456-426614174000
data: {
data:   "type": "message",
data:   "timestamp": "2025-12-18T14:00:00Z",
data:   "payload": {
data:     "channel": "content.published",
data:     "data": {"contentId": "node-123", "status": "published"}
data:   },
data:   "metadata": {
data:     "agentId": "agent://example.com/publisher",
data:     "sequence": 42
data:   }
data: }

```

### 2. Status Update

Agent health and status streams:

```
event: status
id: status-456e7890-a12b-34c5-d678-901234567890
data: {
data:   "type": "status",
data:   "timestamp": "2025-12-18T14:00:00Z",
data:   "payload": {
data:     "status": "healthy",
data:     "load": 0.45,
data:     "uptime": 86400
data:   },
data:   "metadata": {
data:     "agentId": "agent://example.com/worker-1"
data:   }
data: }

```

### 3. Capability Response

Streaming response to capability invocation:

```
event: capability_response
id: resp-789a0123-b45c-67d8-e901-234567890123
data: {
data:   "type": "capability_response",
data:   "timestamp": "2025-12-18T14:00:00Z",
data:   "payload": {
data:     "capability": "analyze_content",
data:     "result": {"sentiment": "positive", "score": 0.85}
data:   },
data:   "metadata": {
data:     "agentId": "agent://example.com/analyzer",
data:     "correlationId": "req-789",
data:     "final": true
data:   }
data: }

```

### 4. Error Event

Error notifications:

```
event: error
id: err-234f5678-g90h-12i3-j456-789012345678
data: {
data:   "type": "error",
data:   "timestamp": "2025-12-18T14:00:00Z",
data:   "payload": {
data:     "code": "PROCESSING_ERROR",
data:     "message": "Failed to process request",
data:     "retryable": true
data:   },
data:   "metadata": {
data:     "agentId": "agent://example.com/agent",
data:     "correlationId": "req-789"
data:   }
data: }

```

## Authentication

### Bearer Token

```typescript
// Modern browsers
const eventSource = new EventSource('https://agent.example.com/events', {
  withCredentials: true
});

// Server sets cookie or client sends Authorization header
// Note: EventSource doesn't support custom headers in browsers
// Use cookie-based auth or proxy
```

### Query Parameter Authentication

For environments without cookie support:

```typescript
const token = await getAuthToken();
const eventSource = new EventSource(
  `https://agent.example.com/events?token=${token}`
);
```

## Reconnection and Reliability

### Automatic Reconnection

EventSource automatically reconnects with:

- Default retry: 3 seconds
- Server can customize via `retry` field

```
retry: 5000
data: {"type":"message","payload":{...}}

```

### Last-Event-ID

Client sends last received event ID on reconnect:

```http
GET /events HTTP/1.1
Host: agent.example.com
Last-Event-ID: msg-123e4567-e89b-12d3-a456-426614174000
```

Server resumes from that event:

```typescript
app.get('/events', (req, res) => {
  const lastEventId = req.headers['last-event-id'];
  
  // Replay events after lastEventId
  if (lastEventId) {
    const missedEvents = getEventsSince(lastEventId);
    missedEvents.forEach(event => sendSSE(res, event));
  }
  
  // Continue with live events
  streamLiveEvents(res);
});
```

## Streaming Patterns

### 1. Event Stream

Continuous event delivery:

```typescript
// Server
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const sendEvent = (event: SSEEvent) => {
    res.write(`event: ${event.type}\n`);
    res.write(`id: ${event.id}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
  
  // Subscribe to events
  const subscription = eventBus.subscribe((event) => {
    sendEvent(event);
  });
  
  req.on('close', () => {
    subscription.unsubscribe();
  });
});
```

### 2. Request-Response Streaming

Long-running capability execution:

```typescript
// Client initiates capability call via POST
const response = await fetch('/capabilities/analyze', {
  method: 'POST',
  body: JSON.stringify({ contentId: 'node-123' })
});

const { streamId } = await response.json();

// Subscribe to result stream
const eventSource = new EventSource(`/events?stream=${streamId}`);

eventSource.addEventListener('capability_response', (event) => {
  const data = JSON.parse(event.data);
  
  if (data.metadata.final) {
    eventSource.close();
    console.log('Final result:', data.payload.result);
  } else {
    console.log('Progress:', data.payload);
  }
});
```

### 3. Multiplexed Streams

Multiple logical streams over one SSE connection:

```typescript
// Client subscribes to multiple channels
const eventSource = new EventSource(
  '/events?channels=content.published,user.login,agent.status'
);

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.payload.channel) {
    case 'content.published':
      handleContentPublished(data);
      break;
    case 'user.login':
      handleUserLogin(data);
      break;
    case 'agent.status':
      handleAgentStatus(data);
      break;
  }
});
```

## Heartbeat and Keepalive

Server SHOULD send periodic comments to prevent connection timeout:

```
: heartbeat - 2025-12-18T14:00:00Z

data: {"type":"message","payload":{...}}

: heartbeat - 2025-12-18T14:01:00Z

```

Recommended heartbeat interval: 30 seconds

## Error Handling

### Connection Errors

```typescript
eventSource.addEventListener('error', (error) => {
  if (eventSource.readyState === EventSource.CLOSED) {
    console.log('Connection closed permanently');
    // Implement custom reconnection logic if needed
  } else {
    console.log('Connection error, auto-reconnecting...');
  }
});
```

### Event Processing Errors

```typescript
eventSource.addEventListener('message', (event) => {
  try {
    const data = JSON.parse(event.data);
    processEvent(data);
  } catch (error) {
    console.error('Failed to process event:', error);
    // Log but don't close connection
  }
});
```

## Performance Considerations

### Buffering

Disable buffering for real-time delivery:

```http
X-Accel-Buffering: no
```

Nginx:

```nginx
location /events {
  proxy_pass http://backend;
  proxy_buffering off;
  proxy_cache off;
}
```

### Connection Limits

- Browser limit: 6 connections per domain
- Use single SSE connection per domain
- Multiplex channels over one connection

### Memory Management

Server SHOULD:

1. Limit event buffer size (e.g., last 100 events)
2. Implement event expiry (e.g., 5 minutes)
3. Track active connections and enforce limits

## Security Considerations

1. **HTTPS Required** - Always use HTTPS in production
2. **CORS** - Configure proper CORS headers
3. **Authentication** - Use cookie-based or query param auth
4. **Rate Limiting** - Limit events per connection
5. **Event Filtering** - Only send events user has permission to see

```http
Access-Control-Allow-Origin: https://trusted-domain.com
Access-Control-Allow-Credentials: true
```

## Bidirectional Communication

Combine SSE with HTTP POST for bidirectional flow:

```typescript
// Client sends command
const response = await fetch('/capabilities/process', {
  method: 'POST',
  body: JSON.stringify({ data: 'input' })
});

const { taskId } = await response.json();

// Server streams progress via SSE
const eventSource = new EventSource(`/events?task=${taskId}`);

eventSource.addEventListener('capability_response', (event) => {
  const data = JSON.parse(event.data);
  updateProgress(data.payload);
  
  if (data.metadata.final) {
    eventSource.close();
  }
});
```

## Examples

### Real-time Status Dashboard

```typescript
// Server
app.get('/agent-status', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const interval = setInterval(() => {
    const status = {
      type: 'status',
      id: uuid(),
      timestamp: new Date().toISOString(),
      payload: {
        activeAgents: getActiveAgentCount(),
        queueDepth: getQueueDepth(),
        throughput: getThroughput()
      },
      metadata: {
        agentId: 'agent://example.com/monitor'
      }
    };
    
    res.write(`event: status\n`);
    res.write(`id: ${status.id}\n`);
    res.write(`data: ${JSON.stringify(status)}\n\n`);
  }, 5000);
  
  req.on('close', () => clearInterval(interval));
});

// Client
const eventSource = new EventSource('/agent-status');
eventSource.addEventListener('status', (event) => {
  const status = JSON.parse(event.data);
  updateDashboard(status.payload);
});
```

### OSSA Agent Manifest with SSE

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: event-streamer
  version: 1.0.0
spec:
  role: Real-time event broadcaster
  capabilities:
    - name: stream_events
      description: Stream real-time events to clients
  transport:
    sse:
      enabled: true
      endpoint: /events
      channels:
        - content.published
        - agent.status
        - task.progress
      heartbeat:
        interval: 30
      reconnect:
        retry: 5000
      buffer:
        maxSize: 100
        expirySeconds: 300
```

## Compatibility

- Protocol: SSE (HTML5 EventSource API)
- Content-Type: `text/event-stream`
- Character encoding: UTF-8
- Browser support: All modern browsers
- Fallback: Long-polling for older browsers

## References

- [HTML5 Server-Sent Events](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [MDN EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [OSSA Protocol Overview](/docs/protocols)

---

**Next**: [Delegation Protocol](./delegation) - Learn about cross-tier task delegation
