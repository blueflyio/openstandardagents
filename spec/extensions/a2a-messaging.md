# OSSA Extension: Agent-to-Agent Messaging (A2A Messaging)

**Version:** 0.3.3
**Status:** Draft
**Author:** OSSA Core Team
**Last Updated:** 2025-12-18

## Overview

The Agent-to-Agent Messaging extension provides a standardized, event-driven messaging protocol for OSSA agents to communicate asynchronously. This extension enables decoupled, scalable agent coordination through publish-subscribe patterns, direct messaging, and broadcast channels.

## Motivation

Modern multi-agent systems require:

- **Asynchronous Communication**: Non-blocking message exchange between agents
- **Event-Driven Architecture**: Agents react to events rather than polling
- **Loose Coupling**: Agents discover and communicate without direct dependencies
- **Scalability**: Message routing scales independently of agent count
- **Reliability**: Guaranteed delivery with configurable quality-of-service

## Architecture

### Message Flow

```
┌─────────────┐                  ┌─────────────┐                  ┌─────────────┐
│   Agent A   │                  │   Message   │                  │   Agent B   │
│  (Publisher)│                  │   Broker    │                  │ (Subscriber)│
└─────────────┘                  └─────────────┘                  └─────────────┘
      │                                │                                │
      │ 1. Publish(channel, message)   │                                │
      │────────────────────────────────>                                │
      │                                │                                │
      │                                │ 2. Route & Store               │
      │                                │                                │
      │                                │ 3. Deliver(message)            │
      │                                │────────────────────────────────>
      │                                │                                │
      │                                │ 4. Acknowledge                 │
      │                                │<────────────────────────────────
      │                                │                                │
      │ 5. Delivery Receipt            │                                │
      │<────────────────────────────────                                │
```

### Components

1. **Message Broker**: Central routing and delivery service
2. **Channels**: Named communication pathways (direct, topic, broadcast)
3. **Subscriptions**: Agent registration for channel events
4. **Message Format**: Standardized envelope with metadata
5. **Delivery Receipts**: Acknowledgment and tracking

## Message Format Specification

### Message Envelope

All messages MUST conform to this structure:

```typescript
interface Message {
  id: string;                    // Unique message identifier (UUID v4)
  channel: string;               // Target channel name
  sender: string;                // Sender agent ID
  timestamp: string;             // ISO 8601 timestamp (UTC)
  type: string;                  // Message type (e.g., TaskAssigned, TaskCompleted)
  payload: Record<string, any>;  // Message content (validated against schema)
  metadata?: MessageMetadata;    // Optional metadata
  qos?: QualityOfService;        // Delivery guarantees
}

interface MessageMetadata {
  correlationId?: string;        // For request-response patterns
  replyTo?: string;              // Channel for responses
  priority?: 'low' | 'normal' | 'high' | 'critical';
  ttl?: number;                  // Time-to-live in seconds
  contentType?: string;          // MIME type (default: application/json)
  contentEncoding?: string;      // Encoding (default: utf-8)
  headers?: Record<string, string>; // Custom headers
}

interface QualityOfService {
  deliveryMode: 'at-most-once' | 'at-least-once' | 'exactly-once';
  persistent?: boolean;          // Survive broker restarts
  ordered?: boolean;             // Preserve message order
}
```

### Example Message

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "channel": "agents.tasks.assigned",
  "sender": "ossa://agents/task-orchestrator",
  "timestamp": "2025-12-18T14:32:15.123Z",
  "type": "TaskAssigned",
  "payload": {
    "taskId": "task-001",
    "assignedTo": "ossa://agents/code-reviewer",
    "description": "Review PR #132",
    "priority": "high",
    "deadline": "2025-12-18T18:00:00Z"
  },
  "metadata": {
    "correlationId": "pr-132",
    "replyTo": "agents.orchestrator.responses",
    "priority": "high",
    "ttl": 3600
  },
  "qos": {
    "deliveryMode": "at-least-once",
    "persistent": true,
    "ordered": true
  }
}
```

## Channel Types

### 1. Direct Channels

Point-to-point communication between specific agents.

**Naming Convention**: `agents.{agent-id}.{message-type}`

```yaml
channel: agents.code-reviewer.task-assigned
description: Direct task assignments to code-reviewer agent
```

### 2. Topic Channels

Publish-subscribe pattern for event distribution.

**Naming Convention**: `agents.{topic}.{event-type}`

```yaml
channel: agents.tasks.completed
description: Broadcast when any agent completes a task
```

### 3. Broadcast Channels

System-wide announcements to all agents.

**Naming Convention**: `agents.broadcast.{event-type}`

```yaml
channel: agents.broadcast.shutdown
description: System shutdown notification to all agents
```

### Channel Wildcards

Subscribers can use wildcards for pattern matching:

- `*` matches exactly one segment: `agents.*.completed`
- `#` matches zero or more segments: `agents.#`

## Delivery Guarantees

### At-Most-Once (Fire-and-Forget)

- No acknowledgments required
- Lowest overhead
- Use for: Metrics, logs, non-critical events

### At-Least-Once (Default)

- Requires acknowledgment
- May deliver duplicates (idempotent handlers required)
- Use for: Task assignments, status updates

### Exactly-Once

- Deduplication and transaction support
- Highest overhead
- Use for: Financial transactions, critical state changes

## Error Handling

### Message Validation Errors

```json
{
  "error": "VALIDATION_ERROR",
  "code": "MSG_001",
  "message": "Invalid message format",
  "details": {
    "field": "payload.taskId",
    "reason": "Required field missing"
  }
}
```

### Delivery Failures

```json
{
  "error": "DELIVERY_FAILED",
  "code": "MSG_002",
  "message": "No subscribers for channel",
  "details": {
    "channel": "agents.unknown.event",
    "attemptCount": 3,
    "nextRetry": "2025-12-18T14:35:00Z"
  }
}
```

### Dead Letter Queue (DLQ)

Messages that fail after max retries are routed to:

```
{original-channel}.dlq
```

Example: `agents.tasks.assigned.dlq`

## Manifest Integration

### Publishing Messages

Declare channels an agent publishes to:

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: task-orchestrator
  version: 1.0.0
spec:
  messaging:
    publishes:
      - channel: agents.tasks.assigned
        schema: TaskAssigned
        description: Publishes when assigning tasks to workers
        qos:
          deliveryMode: at-least-once
          persistent: true

      - channel: agents.orchestrator.status
        schema: OrchestratorStatus
        description: Periodic status updates
        qos:
          deliveryMode: at-most-once
```

### Subscribing to Messages

Declare channels an agent subscribes to:

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: code-reviewer
  version: 1.0.0
spec:
  messaging:
    subscribes:
      - channel: agents.tasks.assigned
        schema: TaskAssigned
        handler: handleTaskAssigned
        filter:
          payload.assignedTo: "ossa://agents/code-reviewer"

      - channel: agents.broadcast.shutdown
        schema: SystemShutdown
        handler: handleShutdown
        priority: critical
```

### Message Schemas

Reference JSON Schema definitions for validation:

```yaml
spec:
  messaging:
    schemas:
      TaskAssigned:
        $ref: "https://ossa.dev/schemas/messaging/TaskAssigned.schema.json"
      TaskCompleted:
        $ref: "https://ossa.dev/schemas/messaging/TaskCompleted.schema.json"
```

## Transport Protocols

### Redis (Recommended)

- Pub/Sub for broadcast
- Streams for persistent queues
- Fast, reliable, battle-tested

```yaml
spec:
  messaging:
    transport:
      type: redis
      config:
        url: redis://localhost:6379
        db: 0
        keyPrefix: "ossa:messages:"
```

### In-Memory (Development)

- No external dependencies
- Non-persistent
- Single-process only

```yaml
spec:
  messaging:
    transport:
      type: memory
      config:
        maxMessages: 10000
```

### NATS (Future)

- Distributed messaging
- Built-in clustering
- Advanced routing

```yaml
spec:
  messaging:
    transport:
      type: nats
      config:
        servers: ["nats://localhost:4222"]
```

## Security

### Authentication

Agents authenticate using their OSSA identity:

```yaml
spec:
  messaging:
    authentication:
      method: ossa-identity
      credentialsRef: agent-credentials
```

### Authorization

Channel-based access control:

```yaml
spec:
  messaging:
    authorization:
      policies:
        - channel: "agents.sensitive.*"
          allow:
            - role: admin
            - agentId: "ossa://agents/security-scanner"
```

### Message Encryption

End-to-end encryption for sensitive data:

```yaml
spec:
  messaging:
    encryption:
      enabled: true
      algorithm: AES-256-GCM
      keyRef: message-encryption-key
```

## Monitoring and Observability

### Metrics

Track messaging health:

- `ossa_messages_published_total{channel, agent}`
- `ossa_messages_delivered_total{channel, agent}`
- `ossa_messages_failed_total{channel, error_type}`
- `ossa_message_delivery_duration_seconds{channel}`
- `ossa_channel_subscribers_count{channel}`

### Tracing

Messages carry trace context for distributed tracing:

```json
{
  "metadata": {
    "headers": {
      "traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
    }
  }
}
```

## Migration Guide

### From Direct Function Calls

**Before:**

```typescript
const result = await codeReviewerAgent.reviewPR(prNumber);
```

**After:**

```typescript
await messageBroker.publish('agents.code-reviewer.tasks', {
  type: 'ReviewPR',
  payload: { prNumber }
});

// Subscribe to response
messageBroker.subscribe('agents.orchestrator.responses', (message) => {
  if (message.metadata.correlationId === prNumber) {
    handleReviewComplete(message.payload);
  }
});
```

## Best Practices

1. **Idempotent Handlers**: Design handlers to safely handle duplicate messages
2. **Schema Validation**: Always validate message payloads against schemas
3. **Correlation IDs**: Use for request-response patterns
4. **Message Size**: Keep payloads under 1MB (use references for large data)
5. **Channel Naming**: Follow naming conventions for discoverability
6. **Error Handling**: Implement DLQ monitoring and alerting
7. **Backpressure**: Implement consumer flow control for high-volume channels

## Examples

See:
- `/examples/messaging/task-orchestration.yaml`
- `/examples/messaging/event-streaming.yaml`
- `/examples/messaging/request-response.yaml`

## Compatibility

- **Minimum OSSA Version**: v0.3.3
- **Supported Runtimes**: Node.js 18+, Deno 1.30+, Bun 1.0+
- **Transport Requirements**: Redis 6.0+

## References

- [Google A2A Protocol Specification](https://github.com/google/A2A)
- [OSSA Manifest Specification v0.3.0](../v0.3.0/ossa-0.3.0.schema.json)
- [CloudEvents Specification](https://cloudevents.io/)
- [AMQP 1.0 Specification](https://www.amqp.org/)

## Changelog

### v0.3.3 (2025-12-18)

- Initial specification for A2A Messaging extension
- Message format and channel types defined
- Transport protocols specified (Redis, Memory)
- Manifest integration patterns documented
