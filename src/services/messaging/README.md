# OSSA Messaging Runtime

Production-quality agent-to-agent messaging service implementing the OSSA v0.3.0 messaging extension.

## Features

- **Pub/Sub Messaging**: Publish and subscribe to channels with schema validation
- **Message Routing**: Route messages between agents with filtering and transformation
- **Delivery Guarantees**: At-most-once, at-least-once, exactly-once delivery
- **Schema Validation**: JSON Schema validation for published messages
- **Dead Letter Queue**: Automatic handling of failed messages
- **Retry Logic**: Configurable retry with exponential backoff
- **Command Pattern**: RPC-style commands with request/response
- **Metrics**: Built-in observability and performance metrics
- **Multiple Brokers**: In-memory, Redis, Kafka, RabbitMQ support

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MessagingService                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐       │
│  │   Publish    │  │  Subscribe   │  │  Commands   │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘       │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                           │                                 │
│  ┌────────────────────────▼─────────────────────────┐       │
│  │         Schema Validation & Routing              │       │
│  └────────────────────────┬─────────────────────────┘       │
│                           │                                 │
│  ┌────────────────────────▼─────────────────────────┐       │
│  │            Message Broker Interface              │       │
│  └────────────────────────┬─────────────────────────┘       │
└───────────────────────────┼─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────▼──────┐
│ MemoryBroker   │  │  RedisBroker   │  │ KafkaBroker │
│ (Development)  │  │  (Production)  │  │ (Scale-out) │
└────────────────┘  └────────────────┘  └─────────────┘
```

## Quick Start

### Basic Pub/Sub

```typescript
import { MessagingService } from '@ossa/messaging';

const messaging = new MessagingService({
  agentId: 'my-agent',
  agentName: 'My Agent',
  messaging: {
    publishes: [{
      channel: 'events.notifications',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          level: { type: 'string', enum: ['info', 'warning', 'error'] }
        }
      }
    }],
    subscribes: [{
      channel: 'events.triggers',
      handler: 'handleTrigger'
    }]
  }
});

await messaging.start();

// Subscribe
await messaging.subscribe('events.triggers', async (message) => {
  console.log('Received trigger:', message.payload);
});

// Publish
await messaging.publish('events.notifications', {
  message: 'System started',
  level: 'info'
});
```

### Commands (RPC)

```typescript
// Receiver: Register command handler
await messaging.registerCommandHandler('process_data', async (input) => {
  const result = await processData(input);
  return { success: true, result };
});

// Sender: Send command and wait for response
const response = await messaging.sendCommand(
  'data-processor-agent',
  'process_data',
  { data: [1, 2, 3] }
);
console.log('Result:', response.result);
```

### Message Filtering

```typescript
await messaging.subscribe('events.all', async (message) => {
  console.log('High priority event:', message.payload);
}, {
  filter: {
    fields: {
      priority: 'high'
    }
  }
});
```

## Manifest Configuration

Configure messaging in your agent manifest:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: security-scanner
spec:
  messaging:
    # Channels this agent publishes to
    publishes:
      - channel: security.vulnerabilities
        description: Security vulnerability findings
        schema:
          type: object
          properties:
            severity:
              type: string
              enum: [low, medium, high, critical]
            cve:
              type: string
            affectedPackage:
              type: string
          required: [severity, cve, affectedPackage]

    # Channels this agent subscribes to
    subscribes:
      - channel: code.commits
        description: Listen for code commits
        handler: handleCommit
        priority: high
        maxConcurrency: 5

    # Commands this agent accepts
    commands:
      - name: scan_repository
        description: Scan a repository for vulnerabilities
        inputSchema:
          type: object
          properties:
            repo_url:
              type: string
          required: [repo_url]
        outputSchema:
          type: object
          properties:
            vulnerabilities:
              type: array

    # Reliability configuration
    reliability:
      deliveryGuarantee: at-least-once
      retry:
        maxAttempts: 3
        backoff:
          strategy: exponential
          initialDelayMs: 1000
          maxDelayMs: 30000
      dlq:
        enabled: true
        channel: dlq.security-scanner
        retentionDays: 7
```

## Message Format

All messages use the `MessageEnvelope` format:

```typescript
interface MessageEnvelope {
  id: string;                    // Unique message ID
  timestamp: string;             // ISO 8601 timestamp
  source: string;                // Source agent ID
  channel: string;               // Channel name
  payload: Record<string, unknown>;  // Message payload
  metadata?: {
    correlationId?: string;      // For request/response correlation
    traceId?: string;            // Distributed tracing
    spanId?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    ttlSeconds?: number;         // Time-to-live
    retryCount?: number;
    contentType?: string;
    headers?: Record<string, string>;
  };
}
```

## Delivery Guarantees

### At-Most-Once (Fire and Forget)
- Fastest performance
- No retries
- Use for non-critical telemetry

```typescript
const messaging = new MessagingService({
  agentId: 'telemetry',
  defaultDeliveryGuarantee: DeliveryGuarantee.AT_MOST_ONCE
});
```

### At-Least-Once (Default)
- Balanced reliability and performance
- Automatic retries with exponential backoff
- Messages may be delivered more than once (handler should be idempotent)

```typescript
const messaging = new MessagingService({
  agentId: 'processor',
  defaultDeliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE
});
```

### Exactly-Once
- Highest reliability
- Deduplication based on message ID
- Slowest performance due to coordination overhead

```typescript
const messaging = new MessagingService({
  agentId: 'financial',
  defaultDeliveryGuarantee: DeliveryGuarantee.EXACTLY_ONCE
});
```

## Broker Implementations

### In-Memory Broker (Development)

Default broker for testing and development:

```typescript
import { MemoryBroker } from '@ossa/messaging';

const messaging = new MessagingService({
  agentId: 'test-agent',
  broker: new MemoryBroker()
});
```

**Features:**
- Fast and simple
- No external dependencies
- Messages lost on restart
- Single process only

### Redis Broker (Production)

For production deployments with persistence:

```typescript
import { RedisBroker } from '@ossa/messaging/brokers/redis';

const messaging = new MessagingService({
  agentId: 'production-agent',
  broker: new RedisBroker({
    url: 'redis://localhost:6379',
    keyPrefix: 'ossa:messages:'
  })
});
```

**Features:**
- Persistent message storage
- Pub/Sub and Streams support
- Atomic operations
- Good for moderate scale

### Kafka Broker (Scale-Out)

For high-throughput, distributed systems:

```typescript
import { KafkaBroker } from '@ossa/messaging/brokers/kafka';

const messaging = new MessagingService({
  agentId: 'scalable-agent',
  broker: new KafkaBroker({
    brokers: ['localhost:9092'],
    clientId: 'ossa-messaging'
  })
});
```

**Features:**
- High throughput (millions of messages/sec)
- Horizontal scalability
- Message replay capability
- Strong ordering guarantees

## Error Handling

### Dead Letter Queue

Failed messages automatically move to DLQ:

```typescript
// Subscribe to DLQ for manual intervention
await messaging.subscribe('dlq.my-agent', async (message) => {
  console.error('Failed message:', message);
  // Manual remediation logic
  await retryManually(message);
});
```

### Retry Configuration

Configure retry behavior in manifest:

```yaml
messaging:
  reliability:
    retry:
      maxAttempts: 5
      backoff:
        strategy: exponential  # or 'linear', 'constant'
        initialDelayMs: 1000
        maxDelayMs: 60000
        multiplier: 2
```

## Observability

### Metrics

Get real-time metrics:

```typescript
const metrics = messaging.getMetrics();

console.log({
  published: metrics.published,
  delivered: metrics.delivered,
  failed: metrics.failed,
  deadLettered: metrics.deadLettered,
  avgLatencyMs: metrics.avgLatencyMs,
  p95LatencyMs: metrics.p95LatencyMs,
  p99LatencyMs: metrics.p99LatencyMs,
  throughput: metrics.throughput
});
```

### Health Checks

Monitor broker health:

```typescript
const health = await messaging.getHealth();

console.log({
  status: health.status,  // 'healthy', 'degraded', 'unhealthy'
  connections: health.connections,
  channels: health.channels,
  subscriptions: health.subscriptions,
  pendingMessages: health.pendingMessages,
  uptimeMs: health.uptimeMs
});
```

### Channel Statistics

Get per-channel stats:

```typescript
const stats = await messaging.getChannelStats('security.vulnerabilities');

console.log({
  messagesPublished: stats.messagesPublished,
  messagesConsumed: stats.messagesConsumed,
  messagesPending: stats.messagesPending,
  messagesFailed: stats.messagesFailed,
  subscriptions: stats.subscriptions,
  messagesPerSecond: stats.messagesPerSecond
});
```

## Best Practices

1. **Schema Validation**: Always define schemas for published channels
2. **Idempotent Handlers**: Design handlers to handle duplicate messages safely
3. **Error Handling**: Use try/catch in handlers and let broker handle retries
4. **Concurrency Limits**: Set appropriate `maxConcurrency` to avoid overwhelming handlers
5. **Channel Naming**: Use dot notation for hierarchical channels (`domain.subdomain.event`)
6. **Message Size**: Keep messages small (<1MB) for better performance
7. **TTL**: Set appropriate TTL to prevent stale messages
8. **Monitoring**: Monitor metrics and health endpoints
9. **Graceful Shutdown**: Always call `messaging.stop()` before exit

## Testing

### Unit Tests

```typescript
import { MessagingService, MemoryBroker } from '@ossa/messaging';

describe('MessagingService', () => {
  let messaging: MessagingService;

  beforeEach(async () => {
    messaging = new MessagingService({
      agentId: 'test',
      broker: new MemoryBroker()
    });
    await messaging.start();
  });

  afterEach(async () => {
    await messaging.stop();
  });

  it('should publish and receive messages', async () => {
    const received: any[] = [];

    await messaging.subscribe('test.channel', async (msg) => {
      received.push(msg.payload);
    });

    await messaging.publish('test.channel', { test: 'data' });

    // Wait for async delivery
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ test: 'data' });
  });
});
```

## Performance Considerations

- **In-Memory Broker**: ~100k msg/sec single process
- **Redis Broker**: ~50k msg/sec with persistence
- **Kafka Broker**: ~1M msg/sec distributed
- **Message Size**: Keep <10KB for optimal performance
- **Batching**: Batch multiple small messages when possible
- **Partitioning**: Use channel hierarchies for load distribution

## Migration Guide

### From v0.2.x to v0.3.0

The messaging extension is new in v0.3.0. If upgrading:

1. Add `messaging` to your agent manifest
2. Declare `publishes` and `subscribes` channels
3. Update handler registration to use `messaging.subscribe()`
4. Replace direct broker calls with `messaging.publish()`

## License

MIT
