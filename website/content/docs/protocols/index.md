---
title: "Protocol Specifications"
description: "OSSA v0.3.2 protocol specifications for agent communication, streaming, and delegation"
weight: 1
---

# Protocol Specifications

Complete reference for OSSA v0.3.2 communication protocols.

## Overview

OSSA defines standardized protocols for agent-to-agent communication, real-time streaming, and task delegation. These protocols ensure interoperability across different OSSA runtime implementations.

## Core Protocols

### Transport Protocols

- **[WebSocket Protocol](./websocket)** - Bidirectional real-time communication
- **[Server-Sent Events (SSE)](./sse)** - Unidirectional server-to-client streaming

### Coordination Protocols

- **[Delegation Protocol](./delegation)** - Cross-tier task delegation with access control

## Protocol Comparison

| Protocol | Direction | Use Case | Connection |
|----------|-----------|----------|------------|
| WebSocket | Bidirectional | Real-time messaging, capability calls | Persistent |
| SSE | Server-to-client | Event streaming, status updates | Persistent |
| HTTP | Request/Response | REST API, capability invocation | Per-request |
| Delegation | Agent-to-agent | Cross-tier task routing | Logical |

## When to Use Each Protocol

### WebSocket

Best for:
- Real-time agent-to-agent messaging
- Capability calls requiring immediate response
- Status updates with acknowledgments
- Interactive agent communication

```typescript
// Example: WebSocket capability call
ws.send(JSON.stringify({
  type: 'capability_call',
  id: 'call-123',
  timestamp: new Date().toISOString(),
  payload: {
    capability: 'analyze_content',
    input: { contentId: 'node-123' }
  },
  metadata: {
    agentId: 'agent://example.com/analyzer',
    correlationId: 'req-789'
  }
}));
```

### Server-Sent Events (SSE)

Best for:
- Streaming progress updates
- Real-time dashboards
- Event notifications
- Long-running task monitoring

```typescript
// Example: SSE event subscription
const eventSource = new EventSource('/events?channels=agent.status');
eventSource.addEventListener('status', (event) => {
  const status = JSON.parse(event.data);
  updateDashboard(status.payload);
});
```

### Delegation Protocol

Best for:
- Cross-tier task routing
- Privilege-separated operations
- Audit-compliant workflows
- Approval chain management

```yaml
# Example: Delegation request
apiVersion: ossa/v0.3.2
kind: DelegationRequest
metadata:
  request_id: "req-456"
source_agent:
  agent_id: "agent://example.com/tier2-writer"
  tier: tier_2_write_limited
target_agent:
  agent_id: "agent://example.com/tier1-reader"
  tier: tier_1_read
task:
  type: "analyze_data"
  payload:
    dataset: "sales-2024"
justification: "Quarterly analysis for compliance report"
```

## Authentication

All protocols support common authentication methods:

1. **Bearer Token (JWT)** - Standard OAuth2 bearer tokens
2. **mTLS** - Mutual TLS for high-security environments
3. **API Key** - Simple key-based authentication
4. **OIDC** - OpenID Connect for federated identity

See [Security Considerations](#security-considerations) for implementation guidance.

## Message Envelope

All OSSA protocols use a common message envelope structure:

```typescript
interface OSSAMessageEnvelope {
  type: string;                    // Message type
  id: string;                      // Unique message ID (UUID)
  timestamp: string;               // ISO 8601 timestamp
  payload: unknown;                // Message-specific payload
  metadata: {
    agentId: string;               // Sender agent URI
    correlationId?: string;        // Request/response matching
    priority?: 'low' | 'normal' | 'high' | 'critical';
    ttl?: number;                  // Time-to-live in seconds
  };
}
```

## Agent URIs

Agent addressing uses URI format:

```
agent://{namespace}/{agent-name}
```

Examples:
- `agent://example.com/code-reviewer`
- `agent://team-a/orchestrator`
- `agent://internal/content-analyzer`

## Error Handling

All protocols define common error codes:

| Code | Description |
|------|-------------|
| `AUTH_FAILED` | Authentication failed |
| `CAPABILITY_NOT_FOUND` | Requested capability unavailable |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `PAYLOAD_TOO_LARGE` | Message exceeds size limit |
| `PROTOCOL_ERROR` | Invalid message format |
| `TIER_VIOLATION` | Delegation matrix violation |
| `TIMEOUT` | Operation exceeded timeout |

## Security Considerations

1. **Transport Security** - Use TLS 1.2+ for all connections
2. **Authentication** - Require authentication in production
3. **Rate Limiting** - Implement per-agent and global limits
4. **Message Signing** - Sign messages in untrusted networks
5. **Audit Logging** - Log all cross-tier delegations

## Protocol Versions

| Version | Status | Compatibility |
|---------|--------|---------------|
| v0.3.2 | Current | Full support |
| v0.3.1 | Stable | Compatible |
| v0.3.0 | Deprecated | Migration guide available |
| v0.2.x | Legacy | Not recommended |

## Related Documentation

- [Architecture Overview](/docs/architecture/overview) - System architecture
- [Multi-Agent Systems](/docs/architecture/multi-agent-systems) - Agent coordination patterns
- [API Reference](/docs/api-reference) - REST API documentation
- [Schema Reference](/docs/schema-reference) - Manifest schema documentation

---

**Next**: [WebSocket Protocol](./websocket) - Learn about bidirectional real-time communication
