# Agent-to-Agent Messaging

The A2A (Agent-to-Agent) Messaging API enables decoupled communication between agents using pub/sub patterns, allowing multi-agent coordination without tight coupling.

## Overview

OSSA messaging provides:

- **Pub/Sub Architecture** - Decoupled asynchronous communication
- **Channel-based Routing** - Organize messages by topic
- **Delivery Guarantees** - At-least-once, at-most-once, or exactly-once delivery
- **Message Ordering** - Strict or relaxed ordering options
- **Reliability** - Built-in retries and dead-letter queues
- **Schema Validation** - Ensure message structure compliance

## Core Concepts

### Channels

Channels are named topics for message routing:

```
audit.findings          - Audit findings from compliance agents
documents.uploaded      - New document notifications
tasks.completed         - Task completion events
agent.{agentId}.status  - Agent status updates
```

### Message Flow

```
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│  Publisher  │───────>│   Channel   │───────>│ Subscriber  │
│    Agent    │ publish│             │deliver │    Agent    │
└─────────────┘        └─────────────┘        └─────────────┘
```

### Delivery Guarantees

| Guarantee | Description | Use Case |
|-----------|-------------|----------|
| `at-most-once` | Fast, may lose messages | Non-critical notifications |
| `at-least-once` | Reliable, may duplicate | Most common use case |
| `exactly-once` | Guaranteed, slower | Financial transactions |

## Agent Manifest Configuration

Configure messaging in agent manifests:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: compliance-auditor
spec:
  messaging:
    publishes:
      - channel: audit.findings
        schema:
          type: object
          properties:
            severity: { type: string, enum: [low, medium, high, critical] }
            findings: { type: array }
        reliability:
          deliveryGuarantee: at-least-once

    subscribes:
      - channel: documents.uploaded
        handler: on_document_received
        filter: |
          message.document_type == 'contract'
        reliability:
          maxRetries: 3
          backoff: exponential

    reliability:
      deliveryGuarantee: at-least-once
      ordering: strict
      deadLetterQueue:
        enabled: true
        maxRetries: 5
```

## API Endpoints

### Publish Message

Publish a message to a channel.

```http
POST /messaging/channels/{channel}/publish
```

**Request Body:**

```json
{
  "message": {
    "severity": "high",
    "findings": [
      {
        "type": "data_retention_violation",
        "description": "Documents retained beyond policy limit"
      }
    ]
  },
  "metadata": {
    "correlation_id": "audit-2025-001",
    "timestamp": "2025-12-18T14:00:00Z"
  },
  "delivery": {
    "guarantee": "at-least-once",
    "timeout_ms": 5000
  }
}
```

**Example Request:**

```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/messaging/channels/audit.findings/publish \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "severity": "high",
      "findings": [...]
    }
  }'
```

**Example Response:**

```json
{
  "message_id": "msg_abc123",
  "channel": "audit.findings",
  "status": "published",
  "timestamp": "2025-12-18T14:00:01Z",
  "subscribers_notified": 3
}
```

**JavaScript/TypeScript:**

```typescript
import { OSSAMessaging } from '@bluefly/ossa-sdk';

const messaging = new OSSAMessaging({ apiKey: process.env.OSSA_API_KEY });

await messaging.publish('audit.findings', {
  message: {
    severity: 'high',
    findings: [
      {
        type: 'data_retention_violation',
        description: 'Documents retained beyond policy limit'
      }
    ]
  },
  metadata: {
    correlation_id: 'audit-2025-001'
  }
});
```

**Python:**

```python
from ossa import Messaging

messaging = Messaging(api_key=os.getenv('OSSA_API_KEY'))

messaging.publish(
    channel='audit.findings',
    message={
        'severity': 'high',
        'findings': [{
            'type': 'data_retention_violation',
            'description': 'Documents retained beyond policy limit'
        }]
    },
    metadata={
        'correlation_id': 'audit-2025-001'
    }
)
```

---

### Subscribe to Channel

Subscribe an agent to receive messages from a channel.

```http
POST /messaging/subscriptions
```

**Request Body:**

```json
{
  "agent_id": "agt_abc123",
  "channel": "documents.uploaded",
  "handler": {
    "type": "webhook",
    "url": "https://myagent.example.com/webhooks/documents",
    "headers": {
      "X-API-Key": "agent-webhook-key"
    }
  },
  "filter": "message.document_type == 'contract'",
  "reliability": {
    "max_retries": 3,
    "timeout_ms": 30000
  }
}
```

**Example Request:**

```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/messaging/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agt_abc123",
    "channel": "documents.uploaded",
    "handler": {
      "type": "webhook",
      "url": "https://myagent.example.com/webhooks/documents"
    }
  }'
```

**Example Response:**

```json
{
  "subscription_id": "sub_xyz789",
  "agent_id": "agt_abc123",
  "channel": "documents.uploaded",
  "status": "active",
  "created_at": "2025-12-18T14:00:00Z"
}
```

---

### List Subscriptions

Get all subscriptions for an agent or channel.

```http
GET /messaging/subscriptions
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | string | Filter by agent ID |
| `channel` | string | Filter by channel |
| `status` | string | Filter by status (`active`, `paused`) |

**Example Request:**

```bash
curl "https://api.llm.bluefly.io/ossa/v1/messaging/subscriptions?agent_id=agt_abc123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Unsubscribe

Remove a subscription.

```http
DELETE /messaging/subscriptions/{subscriptionId}
```

**Example Request:**

```bash
curl -X DELETE https://api.llm.bluefly.io/ossa/v1/messaging/subscriptions/sub_xyz789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Get Message History

Retrieve message history for a channel.

```http
GET /messaging/channels/{channel}/messages
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `since` | timestamp | Messages after this time |
| `until` | timestamp | Messages before this time |
| `limit` | integer | Number of messages (max: 100) |

**Example Request:**

```bash
curl "https://api.llm.bluefly.io/ossa/v1/messaging/channels/audit.findings/messages?limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Message Patterns

### Request-Reply Pattern

One agent requests work, another responds:

```typescript
// Publisher: Request processor
await messaging.publish('tasks.pending', {
  message: {
    task_id: 'task-123',
    action: 'process_document',
    reply_channel: 'tasks.results'
  }
});

// Subscriber: Process and reply
messaging.subscribe('tasks.pending', async (message) => {
  const result = await processDocument(message.data);

  await messaging.publish(message.reply_channel, {
    message: {
      task_id: message.task_id,
      result: result
    }
  });
});
```

### Fan-Out Pattern

Broadcast to multiple subscribers:

```typescript
// One publisher, many subscribers
await messaging.publish('notifications.broadcast', {
  message: {
    type: 'system_update',
    content: 'Scheduled maintenance in 30 minutes'
  }
});

// Multiple agents subscribe
await messaging.subscribe('notifications.broadcast', handleNotification);
```

### Event Sourcing Pattern

Maintain event log for replay:

```typescript
// Publish events
await messaging.publish('events.agent-lifecycle', {
  message: {
    event_type: 'agent_registered',
    agent_id: 'agt_abc123',
    timestamp: new Date().toISOString()
  }
});

// Replay events
const events = await messaging.getMessages('events.agent-lifecycle', {
  since: '2025-12-01T00:00:00Z'
});

for (const event of events) {
  await replayEvent(event);
}
```

### Saga Pattern

Coordinate multi-step distributed transactions:

```typescript
// Orchestrator
class DocumentProcessingSaga {
  async execute(documentId: string) {
    // Step 1: Extract text
    await messaging.publish('tasks.extract-text', {
      message: { document_id: documentId }
    });

    // Step 2: Wait for completion
    const result = await messaging.waitForMessage(
      'tasks.text-extracted',
      (msg) => msg.document_id === documentId
    );

    // Step 3: Analyze sentiment
    await messaging.publish('tasks.analyze-sentiment', {
      message: { text: result.text }
    });
  }

  async compensate(documentId: string) {
    // Rollback on failure
    await messaging.publish('tasks.cleanup', {
      message: { document_id: documentId }
    });
  }
}
```

---

## Message Filtering

Filter messages on the subscriber side:

```yaml
# In agent manifest
messaging:
  subscribes:
    - channel: documents.uploaded
      handler: on_critical_document
      filter: |
        message.severity == 'critical' &&
        message.document_type in ['contract', 'legal'] &&
        message.size_mb < 10
```

**Using API:**

```typescript
await messaging.subscribe('documents.uploaded', handler, {
  filter: {
    severity: 'critical',
    document_type: ['contract', 'legal'],
    size_mb: { $lt: 10 }
  }
});
```

---

## Reliability Features

### Automatic Retries

Configure retry behavior:

```typescript
await messaging.subscribe('tasks.pending', handler, {
  reliability: {
    maxRetries: 5,
    backoff: 'exponential',  // exponential | linear | constant
    initialDelay: 1000,
    maxDelay: 60000
  }
});
```

### Dead Letter Queue

Handle permanently failed messages:

```typescript
// Main subscription
await messaging.subscribe('tasks.processing', processTask, {
  deadLetterQueue: {
    enabled: true,
    maxRetries: 3,
    channel: 'tasks.failed'
  }
});

// Monitor failures
await messaging.subscribe('tasks.failed', async (message) => {
  await logError(message);
  await notifyAdmin(message);
});
```

### Circuit Breaker

Prevent cascading failures:

```typescript
await messaging.subscribe('external.api-calls', handler, {
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,
    timeout: 60000,
    resetTimeout: 300000
  }
});
```

---

## Monitoring and Observability

### Message Metrics

Track messaging metrics:

```bash
curl https://api.llm.bluefly.io/ossa/v1/messaging/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "channels": {
    "audit.findings": {
      "messages_published": 1547,
      "messages_delivered": 1542,
      "delivery_rate": 0.997,
      "average_latency_ms": 45,
      "subscribers": 3
    }
  },
  "subscriptions": {
    "sub_xyz789": {
      "messages_received": 1542,
      "messages_processed": 1540,
      "failures": 2,
      "average_processing_time_ms": 234
    }
  }
}
```

### Message Tracing

Enable distributed tracing:

```typescript
await messaging.publish('tasks.pending', {
  message: { task_id: 'task-123' },
  tracing: {
    trace_id: '550e8400-e29b-41d4-a716-446655440000',
    span_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    parent_span_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c9'
  }
});
```

---

## Security

### Message Encryption

Encrypt sensitive messages:

```yaml
messaging:
  publishes:
    - channel: pii.customer-data
      encryption:
        enabled: true
        algorithm: AES-256-GCM
        key_id: arn:aws:kms:us-east-1:123456789012:key/12345
```

### Access Control

Control who can publish/subscribe:

```bash
curl -X PUT https://api.llm.bluefly.io/ossa/v1/messaging/channels/audit.findings/acl \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "publish": ["agt_auditor*"],
    "subscribe": ["agt_reporter*", "agt_dashboard"]
  }'
```

---

## Best Practices

### Use Idempotency Keys

Prevent duplicate processing:

```typescript
await messaging.publish('payments.process', {
  message: { amount: 100.00, account: 'acc_123' },
  idempotency_key: 'payment-2025-001'
});
```

### Implement Health Checks

Monitor subscriber health:

```typescript
messaging.subscribe('tasks.pending', async (message) => {
  try {
    await processTask(message);
    await messaging.ack(message.id);
  } catch (error) {
    await messaging.nack(message.id, { requeue: true });
  }
});
```

### Use Correlation IDs

Track message flows:

```typescript
const correlationId = generateUUID();

await messaging.publish('workflow.start', {
  message: { workflow_id: 'wf-123' },
  metadata: { correlation_id: correlationId }
});
```

---

## Troubleshooting

### Message Not Delivered

Check subscription status and filters:

```bash
curl "https://api.llm.bluefly.io/ossa/v1/messaging/subscriptions?channel=audit.findings" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### High Latency

Monitor message queue depth:

```bash
curl https://api.llm.bluefly.io/ossa/v1/messaging/channels/audit.findings/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Failed Messages

Check dead letter queue:

```bash
curl https://api.llm.bluefly.io/ossa/v1/messaging/channels/tasks.failed/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Next Steps

- Review [Agent Registry API](agents.md) for agent configuration
- See [Discovery API](discovery.md) to find messaging-enabled agents
- Explore [Agent Lifecycle Guide](../guides/agent-lifecycle.md) for messaging setup
- Check [API Examples](../api-reference/examples.md) for messaging patterns
