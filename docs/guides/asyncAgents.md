# Async Agent Execution Guide

How to use async execution for OSSA agents in production.

## Overview

Async agent execution allows you to queue agent tasks for background processing. This is essential for:

- **Long-running tasks** - Don't block HTTP requests
- **High throughput** - Process many agents concurrently
- **Reliability** - Retry failures automatically
- **Scalability** - Scale workers independently

## When to Use Async

Use async execution when:

- Agent execution takes > 1 second
- You need to execute multiple agents
- The result doesn't need to be immediate
- You want automatic retry on failure
- You need to scale processing independently

Use sync execution when:

- Result is needed immediately
- Execution is very fast (< 100ms)
- Simplicity is more important than throughput

## Basic Workflow

```
Client Request → Queue Message → Worker Processes → Store Result → Notify Client
```

1. **Client** dispatches agent execution message
2. **Message** is stored in queue (transport)
3. **Worker** picks up message from queue
4. **Worker** executes agent and stores result
5. **Worker** notifies client via callback (optional)

## Execution Patterns

### 1. Fire and Forget

Simplest pattern - queue task and return immediately.

```typescript
import { AgentExecutionMessage } from '@bluefly/openstandardagents/messenger';

// Queue agent execution
await messageBus.dispatch(
  new AgentExecutionMessage(
    'agent-id',
    { input: 'data' },
    { userId: 'user-123' }
  )
);

// Return immediately
res.json({ status: 'queued' });
```

**Pros**: Fast response, simple
**Cons**: No result returned

### 2. Callback Pattern

Queue task and receive result via webhook.

```typescript
// Queue with callback URL
await messageBus.dispatch(
  new AgentExecutionMessage(
    'agent-id',
    { input: 'data' },
    { userId: 'user-123' },
    'https://api.example.com/webhook'  // Callback URL
  )
);

// Webhook receives result
app.post('/webhook', (req, res) => {
  const { success, output, error } = req.body;
  // Handle result
  res.status(200).send('OK');
});
```

**Pros**: Async result delivery, decoupled
**Cons**: Requires webhook endpoint

### 3. Polling Pattern

Queue task and poll for result.

```typescript
// Queue execution
const requestId = generateId();
await messageBus.dispatch(
  new AgentExecutionMessage(
    'agent-id',
    { input: 'data' },
    { userId: 'user-123', requestId }
  )
);

// Return request ID
res.json({ requestId, status: 'queued' });

// Client polls for result
app.get('/api/results/:requestId', async (req, res) => {
  const result = await resultStorage.get(req.params.requestId);
  if (result) {
    res.json({ status: 'complete', result });
  } else {
    res.json({ status: 'pending' });
  }
});
```

**Pros**: Simple, works with any client
**Cons**: Polling overhead

### 4. WebSocket Pattern

Queue task and push result via WebSocket.

```typescript
// Queue execution
await messageBus.dispatch(
  new AgentExecutionMessage(
    'agent-id',
    { input: 'data' },
    { userId: 'user-123', sessionId: socket.id }
  )
);

// Handler pushes result to socket
socket.on('result', (data) => {
  io.to(data.sessionId).emit('agent:result', data.result);
});
```

**Pros**: Real-time, efficient
**Cons**: Requires WebSocket infrastructure

## Batch Execution

Execute multiple agents efficiently.

### Parallel Batch

Execute agents concurrently (default).

```typescript
import { AgentBatchMessage } from '@bluefly/openstandardagents/messenger';

await messageBus.dispatch(
  new AgentBatchMessage(
    ['agent-1', 'agent-2', 'agent-3'],
    {
      'agent-1': { input: 'data-1' },
      'agent-2': { input: 'data-2' },
      'agent-3': { input: 'data-3' },
    },
    {
      mode: 'parallel',
      maxParallel: 5,  // Max concurrent
      stopOnError: false,  // Continue on failure
      aggregateResults: true,
    }
  )
);
```

**Use when**: Agents are independent
**Benefits**: Fastest execution

### Sequential Batch

Execute agents one after another.

```typescript
await messageBus.dispatch(
  new AgentBatchMessage(
    ['agent-1', 'agent-2', 'agent-3'],
    { /* inputs */ },
    {
      mode: 'sequential',
      stopOnError: true,  // Stop on first failure
    }
  )
);
```

**Use when**: Agents have dependencies
**Benefits**: Predictable order, easier debugging

## Priority Handling

Control execution order with priority.

```typescript
// High priority (urgent)
await messageBus.dispatch(
  new AgentExecutionMessage(
    'urgent-agent',
    { input: 'data' },
    { userId: 'user-123', priority: 10 }  // Highest priority
  )
);

// Normal priority
await messageBus.dispatch(
  new AgentExecutionMessage(
    'normal-agent',
    { input: 'data' },
    { userId: 'user-123', priority: 5 }  // Default
  )
);

// Low priority (background)
await messageBus.dispatch(
  new AgentExecutionMessage(
    'background-agent',
    { input: 'data' },
    { userId: 'user-123', priority: 1 }  // Lowest priority
  )
);
```

**Priority Levels**:
- **10**: Critical, immediate execution
- **7-9**: High priority
- **5-6**: Normal (default)
- **3-4**: Low priority
- **1-2**: Background tasks

## Error Handling

### Automatic Retry

Failed executions are automatically retried with exponential backoff.

```yaml
retry_strategy:
  max_retries: 3
  delay: 1000       # 1 second
  multiplier: 2     # Double each time
  max_delay: 30000  # 30 seconds max
```

**Retry Schedule**:
- Attempt 1: Immediate
- Attempt 2: 1s delay
- Attempt 3: 2s delay
- Attempt 4: 4s delay
- Failed: Dead letter queue

### Manual Retry

Retry failed messages manually:

```bash
# Retry specific message
drush messenger:failed:retry <message-id>

# Retry all failed messages
drush messenger:failed:retry
```

### Dead Letter Queue

Permanently failed messages go to dead letter queue.

```bash
# List dead letter messages
drush messenger:failed:list

# Show details
drush messenger:failed:show <message-id>

# Remove after fixing issue
drush messenger:failed:remove <message-id>
```

## Performance Optimization

### 1. Scale Workers

Run multiple workers for higher throughput:

```bash
# Terminal 1
drush messenger:consume agent_async --limit=100

# Terminal 2
drush messenger:consume agent_async --limit=100

# Terminal 3
drush messenger:consume agent_async --limit=100
```

### 2. Batch Related Tasks

Group related agent executions:

```typescript
// Instead of 10 separate messages
for (const item of items) {
  await messageBus.dispatch(new AgentExecutionMessage(...));
}

// Use batch (more efficient)
await messageBus.dispatch(
  new AgentBatchMessage(
    items.map(i => i.agentId),
    Object.fromEntries(items.map(i => [i.agentId, i.input]))
  )
);
```

### 3. Tune Transport

**For Doctrine** (Database):
- Add indexes on queue_name and available_at
- Use separate database for messages
- Increase connection pool

**For RabbitMQ**:
- Use persistent messages for durability
- Configure prefetch count (default: 1)
- Use multiple queues for priority

**For Redis**:
- Use Redis Streams (better than lists)
- Configure consumer groups
- Tune maxlen for stream size

### 4. Optimize Agent Code

- Cache frequently used data
- Minimize external API calls
- Use streaming for large outputs
- Set reasonable timeouts

## Monitoring

### Track Metrics

```bash
# Show statistics
drush messenger:stats

# Output:
# Transport: agent_async
# Messages: 1250
# Failed: 23 (1.8%)
# Avg Time: 450ms
# Success Rate: 98.2%
```

### Health Checks

Monitor queue health:

```typescript
import { QueueMonitor } from '@bluefly/openstandardagents/messenger';

const monitor = new QueueMonitor(queueStatus, logger);
const status = await monitor.checkQueue('agent_async', 'ossa_agents');

console.log(`Queue Health: ${status.healthy ? 'Healthy' : 'Unhealthy'}`);
console.log(`Depth: ${status.depth}`);
console.log(`Alerts: ${status.alerts.join(', ')}`);
```

### Alerting

Set up alerts for:

- Queue depth > threshold
- Dead letter count > threshold
- Success rate < threshold
- No activity for X minutes

## Production Checklist

- [ ] Choose appropriate transport (RabbitMQ recommended)
- [ ] Configure retry strategy
- [ ] Set up monitoring and alerts
- [ ] Run multiple workers for redundancy
- [ ] Configure rate limiting
- [ ] Set up log aggregation
- [ ] Test failover scenarios
- [ ] Document runbook procedures
- [ ] Set up dead letter queue handling
- [ ] Configure backups (if using Doctrine)

## Security

### Authentication

All messages must include user ID:

```typescript
await messageBus.dispatch(
  new AgentExecutionMessage(
    'agent-id',
    { input: 'data' },
    { userId: req.user.id }  // Required
  )
);
```

### Authorization

Workers check permissions before execution:

- `execute ossa agents` - Required for single execution
- `execute ossa batch agents` - Required for batch execution

### Rate Limiting

Prevent abuse with rate limits:

```yaml
rate_limiting:
  enabled: true
  max_executions: 100
  window_seconds: 3600  # 1 hour
```

### Input Validation

Messages are validated before processing:

- Agent ID must be non-empty string
- Input must be object
- Context must be valid
- Priority must be 1-10

## Examples

### Example 1: Code Review

```typescript
// Queue code review
await messageBus.dispatch(
  new AgentExecutionMessage(
    'code-reviewer',
    { code: codeContent, language: 'typescript' },
    { userId: req.user.id, priority: 7 },
    `${API_BASE}/webhooks/code-review/${reviewId}`
  )
);

// Webhook receives result
app.post('/webhooks/code-review/:id', (req, res) => {
  const { success, output } = req.body;
  const { id } = req.params;

  // Store review result
  await db.codeReviews.update(id, {
    status: success ? 'complete' : 'failed',
    result: output,
  });

  // Notify user
  await notifyUser(id, output);

  res.status(200).send('OK');
});
```

### Example 2: Batch Analysis

```typescript
// Analyze multiple files
const files = ['file1.ts', 'file2.ts', 'file3.ts'];

await messageBus.dispatch(
  new AgentBatchMessage(
    files.map(() => 'code-analyzer'),
    Object.fromEntries(
      files.map(file => [file, { code: readFile(file) }])
    ),
    {
      mode: 'parallel',
      maxParallel: 5,
      aggregateResults: true,
    },
    { userId: req.user.id }
  )
);
```

### Example 3: Scheduled Tasks

```typescript
// Schedule daily report
cron.schedule('0 9 * * *', async () => {
  await messageBus.dispatch(
    new AgentExecutionMessage(
      'daily-report-generator',
      { date: new Date().toISOString() },
      { userId: 'system', priority: 3 }
    )
  );
});
```

## References

- [Messenger Configuration](./messenger.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [OSSA Documentation](https://openstandardagents.org)
