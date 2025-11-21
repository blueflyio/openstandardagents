---
title: "Transport Metadata"
description: "Protocol-specific transport configuration for capabilities"
weight: 16
---

# Transport Metadata

The `transport` block configures protocol-specific settings for agent capabilities, enabling streaming, advanced communication patterns, and framework-specific integrations.

## Overview

OSSA v0.2.4 introduces transport metadata to support:

- **Multiple protocols** - HTTP, gRPC, A2A, MCP, WebSocket, and custom protocols
- **Streaming modes** - Request, response, and bidirectional streaming
- **Binding paths** - Protocol-specific endpoint configuration
- **Content types** - MIME type specification for streaming

## Transport Configuration

### Basic HTTP Transport

```yaml
tools:
  - type: http
    name: api-service
    endpoint: https://api.example.com/v1
    transport:
      protocol: http
      streaming: none
```

### HTTP with Response Streaming

```yaml
tools:
  - type: http
    name: streaming-chat
    endpoint: https://api.example.com/v1/chat
    transport:
      protocol: http
      streaming: response
      binding: /v1/chat/stream
      content_type: text/event-stream
```

**Use cases**:
- Server-Sent Events (SSE)
- Streaming LLM responses
- Real-time data feeds

### Bidirectional Streaming (WebSocket)

```yaml
tools:
  - type: websocket
    name: real-time-collaboration
    endpoint: wss://collab.example.com/ws
    transport:
      protocol: websocket
      streaming: bidirectional
      binding: /ws/collaborate
      content_type: application/json
```

**Use cases**:
- Real-time collaboration
- Live updates
- Interactive agents

### gRPC Transport

```yaml
tools:
  - type: grpc
    name: grpc-service
    endpoint: grpc://service.example.com:50051
    transport:
      protocol: grpc
      streaming: bidirectional
      binding: /Service/Method
```

### A2A Protocol (Agent-to-Agent)

```yaml
tools:
  - type: a2a
    name: agent-communication
    transport:
      protocol: a2a
      streaming: bidirectional
      binding: /agents/communicate
      config:
        agent_id: ${AGENT_ID}
        discovery_service: https://discovery.example.com
```

**Use cases**:
- Multi-agent communication
- Agent mesh networks
- Distributed agent systems

### MCP (Model Context Protocol)

```yaml
tools:
  - type: mcp
    name: mcp-server
    server: filesystem
    transport:
      protocol: mcp
      streaming: response
      binding: /mcp/filesystem
```

## Streaming Modes

### None (`none`)

Standard request/response pattern.

```yaml
transport:
  protocol: http
  streaming: none
```

**Characteristics**:
- Single request, single response
- No streaming
- Standard HTTP behavior

### Request Streaming (`request`)

Client streams data to server.

```yaml
transport:
  protocol: http
  streaming: request
  content_type: application/x-ndjson
```

**Use cases**:
- Large file uploads
- Progressive data submission
- Chunked requests

### Response Streaming (`response`)

Server streams data to client.

```yaml
transport:
  protocol: http
  streaming: response
  content_type: text/event-stream
```

**Use cases**:
- Streaming LLM responses
- Server-Sent Events (SSE)
- Real-time data feeds
- Progress updates

### Bidirectional Streaming (`bidirectional`)

Full duplex communication.

```yaml
transport:
  protocol: websocket
  streaming: bidirectional
  content_type: application/json
```

**Use cases**:
- WebSocket connections
- gRPC bidirectional streaming
- Real-time collaboration
- Interactive agents

## Protocol-Specific Configuration

### HTTP/HTTPS

```yaml
transport:
  protocol: http
  streaming: response
  binding: /v1/stream
  content_type: text/event-stream
  config:
    method: POST
    headers:
      Authorization: Bearer ${API_KEY}
    timeout: 30s
```

### gRPC

```yaml
transport:
  protocol: grpc
  streaming: bidirectional
  binding: /Service/Method
  config:
    tls: true
    compression: gzip
```

### WebSocket

```yaml
transport:
  protocol: websocket
  streaming: bidirectional
  binding: /ws/agent
  config:
    subprotocols:
      - json
      - binary
    ping_interval: 30s
```

### A2A Protocol

```yaml
transport:
  protocol: a2a
  streaming: bidirectional
  binding: /agents/communicate
  config:
    agent_id: ${AGENT_ID}
    discovery_service: https://discovery.example.com
    encryption: true
    compression: true
```

## Framework Integration

### Google ADK

Google ADK requires bidirectional streaming for agent communication:

```yaml
tools:
  - type: http
    name: adk-agent
    transport:
      protocol: http
      streaming: bidirectional
      binding: /adk/agent
      content_type: application/x-google-adk
    extensions:
      google_adk:
        agent_type: llm_agent
```

### OpenAI Agents SDK

OpenAI Agents SDK uses HTTP with response streaming:

```yaml
tools:
  - type: http
    name: openai-assistant
    endpoint: https://api.openai.com/v1/assistants
    transport:
      protocol: http
      streaming: response
      binding: /v1/chat/completions
      content_type: text/event-stream
```

### Microsoft AutoGen

AutoGen supports bidirectional communication:

```yaml
tools:
  - type: websocket
    name: autogen-team
    transport:
      protocol: websocket
      streaming: bidirectional
      binding: /autogen/team
    extensions:
      autogen:
        group_chat: true
```

## Complete Example

```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: streaming-assistant
spec:
  role: |
    You are a streaming assistant that provides real-time responses.
  
  tools:
    - type: http
      name: streaming-api
      endpoint: https://api.example.com/v1
      transport:
        protocol: http
        streaming: response
        binding: /v1/stream
        content_type: text/event-stream
      auth:
        type: bearer
        credentials: secret:api-key
    
    - type: websocket
      name: real-time-updates
      endpoint: wss://updates.example.com/ws
      transport:
        protocol: websocket
        streaming: bidirectional
        binding: /ws/updates
        content_type: application/json
```

## Best Practices

1. **Choose appropriate protocol**: Use HTTP for REST APIs, WebSocket for real-time, gRPC for high-performance
2. **Configure streaming correctly**: Use `response` for LLM streaming, `bidirectional` for interactive agents
3. **Set content types**: Specify correct MIME types for streaming (`text/event-stream`, `application/json`, etc.)
4. **Handle timeouts**: Configure appropriate timeouts for streaming connections
5. **Security**: Use TLS/SSL for all transport protocols in production

## Related Documentation

- [Tools](./tools.md) - Complete tool definitions
- [State Management](./state.md) - Agent state configuration
- [Security](./security.md) - Transport security and authentication
- [Migration Guide: v0.2.3 to v0.2.4](/docs/migration-guides/v0.2.3-to-v0.2.4) - Migration instructions

