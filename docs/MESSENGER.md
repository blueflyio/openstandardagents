# Symfony Messenger Integration for OSSA

Comprehensive async agent execution using Symfony Messenger.

## Overview

The Symfony Messenger integration provides production-ready async agent execution capabilities for OSSA agents. It supports multiple transport backends, retry strategies, failed message handling, monitoring, and more.

## Features

- ✅ **Async Agent Execution** - Execute agents asynchronously via message queues
- ✅ **Batch Processing** - Execute multiple agents in parallel or sequence
- ✅ **Multiple Transports** - Doctrine, RabbitMQ, Redis, Amazon SQS
- ✅ **Retry Strategies** - Automatic retry with exponential backoff
- ✅ **Failed Message Handling** - Dead letter queues and failure tracking
- ✅ **Middleware** - Validation, logging, authentication, rate limiting
- ✅ **Monitoring** - Metrics, queue health, performance tracking
- ✅ **Drush Commands** - Full CLI management

## Installation

### 1. Install Dependencies

```bash
npm install @bluefly/openstandardagents
```

For Drupal integration:

```bash
composer require symfony/messenger
drush en ai_agent_ossa
```

### 2. Configure Transport

Edit `.env`:

```bash
# Use Doctrine (Database) - Default, simplest setup
MESSENGER_TRANSPORT_DSN=doctrine://default
MESSENGER_BATCH_TRANSPORT_DSN=doctrine://default

# Or use RabbitMQ - Recommended for production
# MESSENGER_TRANSPORT_DSN=amqp://user:password@rabbitmq:5672/%2f
# MESSENGER_BATCH_TRANSPORT_DSN=amqp://user:password@rabbitmq:5672/%2f

# Or use Redis - Fast and simple
# MESSENGER_TRANSPORT_DSN=redis://redis:6379/messages
# MESSENGER_BATCH_TRANSPORT_DSN=redis://redis:6379/batch

# Or use Amazon SQS - AWS integration
# MESSENGER_TRANSPORT_DSN=sqs://default
# MESSENGER_BATCH_TRANSPORT_DSN=sqs://default
```

### 3. Setup Database Tables

For Doctrine transport:

```bash
drush sql-query "
CREATE TABLE IF NOT EXISTS messenger_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  body LONGTEXT NOT NULL,
  headers LONGTEXT NOT NULL,
  queue_name VARCHAR(190) NOT NULL,
  created_at DATETIME NOT NULL,
  available_at DATETIME NOT NULL,
  delivered_at DATETIME DEFAULT NULL,
  INDEX queue_name_idx (queue_name),
  INDEX available_at_idx (available_at),
  INDEX delivered_at_idx (delivered_at)
);
"
```

## Usage

### Basic Agent Execution

```typescript
import { AgentExecutionMessage } from '@bluefly/openstandardagents/messenger';
import { messageBus } from './services';

// Dispatch agent execution message
await messageBus.dispatch(
  new AgentExecutionMessage(
    'compliance-checker',  // Agent ID
    { code: 'function test() {}' },  // Input
    {
      userId: 'user-123',
      sessionId: 'session-456',
      requestId: 'req-789',
      priority: 8,  // 1-10, higher = more urgent
      timeout: 30000,  // 30 seconds
    },
    'https://api.example.com/callback'  // Optional callback URL
  )
);
```

### Batch Agent Execution

```typescript
import { AgentBatchMessage } from '@bluefly/openstandardagents/messenger';

// Execute multiple agents in parallel
await messageBus.dispatch(
  new AgentBatchMessage(
    ['agent-1', 'agent-2', 'agent-3'],  // Agent IDs
    {
      'agent-1': { input: 'data for agent 1' },
      'agent-2': { input: 'data for agent 2' },
      'agent-3': { input: 'data for agent 3' },
      '*': { shared: 'data for all' },  // Shared input
    },
    {
      mode: 'parallel',  // or 'sequential'
      maxParallel: 5,  // Max concurrent executions
      stopOnError: false,  // Continue on failures
      aggregateResults: true,
      batchTimeout: 60000,  // 60 seconds
    },
    {
      userId: 'user-123',
      sessionId: 'session-456',
    },
    'https://api.example.com/batch-callback'
  )
);
```

### Consuming Messages

Start a worker to process messages:

```bash
# Consume from agent_async transport
drush messenger:consume agent_async

# With options
drush messenger:consume agent_async --limit=100 --time-limit=3600 --memory-limit=512

# Consume batch messages
drush messenger:consume agent_batch
```

### Managing Failed Messages

```bash
# List failed messages
drush messenger:failed:list

# Show specific failed message
drush messenger:failed:show <message-id>

# Retry specific message
drush messenger:failed:retry <message-id>

# Retry all failed messages
drush messenger:failed:retry

# Remove failed message
drush messenger:failed:remove <message-id>

# Remove all failed messages
drush messenger:failed:remove
```

### Monitoring

```bash
# Show statistics for all transports
drush messenger:stats

# Show statistics for specific transport
drush messenger:stats agent_async
```

## Transport Configuration

### Doctrine (Database)

**Pros**: Simple, no external dependencies
**Cons**: Not as fast as dedicated message brokers

```yaml
agent_async:
  dsn: 'doctrine://default'
  options:
    auto_setup: true
    queue_name: ossa_agents
```

### RabbitMQ

**Pros**: Fast, reliable, production-ready
**Cons**: Requires RabbitMQ server

```yaml
agent_async:
  dsn: 'amqp://user:password@rabbitmq:5672/%2f'
  options:
    auto_setup: true
    queue_name: ossa_agents
    exchange:
      name: agents
      type: direct
```

### Redis

**Pros**: Very fast, simple
**Cons**: No guaranteed delivery

```yaml
agent_async:
  dsn: 'redis://redis:6379/messages'
  options:
    auto_setup: true
    stream: ossa_agents
    group: consumers
    consumer: consumer-1
```

### Amazon SQS

**Pros**: Fully managed, scalable
**Cons**: AWS-only, network latency

```yaml
agent_async:
  dsn: 'sqs://default'
  options:
    auto_setup: true
    queue_name: ossa-agents
    region: us-east-1
```

## Retry Strategies

Configure automatic retry with exponential backoff:

```yaml
agent_async:
  retry_strategy:
    max_retries: 3          # Maximum retry attempts
    delay: 1000             # Initial delay (ms)
    multiplier: 2           # Exponential multiplier
    max_delay: 30000        # Maximum delay (ms)
```

**Retry Schedule**:
- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 seconds delay
- Attempt 4: 4 seconds delay
- Failed: Move to dead letter queue

## Middleware

### Validation Middleware

Validates message data before processing:

- Checks required fields
- Validates data types
- Ensures constraints are met

### Logging Middleware

Logs message processing:

- Message received
- Processing time
- Success/failure status

### Authentication Middleware

Checks user permissions:

- Verifies user ID
- Checks authentication
- Validates permissions

### Rate Limit Middleware

Prevents abuse:

- Tracks execution counts per user
- Enforces limits per time window
- Returns remaining allowance

## Monitoring

### Metrics Collected

- **Total Processed** - Count of processed messages
- **Total Failed** - Count of failed messages
- **Currently Processing** - Messages being processed
- **Avg Processing Time** - Average execution time
- **Success Rate** - Percentage of successful executions
- **Throughput** - Messages per minute
- **Queue Depth** - Messages waiting in queue
- **Dead Letter Count** - Permanently failed messages

### Health Scoring

Health score (0-100) based on:

- **Success Rate** (40%)
- **Throughput vs Capacity** (30%)
- **Queue Depth** (20%)
- **Processing Time** (10%)

### Alerts

Monitor for:

- Queue depth exceeds threshold
- Dead letter count too high
- No processing activity
- High processing count
- Slow processing times

## Best Practices

### 1. Choose the Right Transport

- **Development**: Doctrine (simple)
- **Production**: RabbitMQ (reliable)
- **High Performance**: Redis (fast)
- **AWS**: Amazon SQS (managed)

### 2. Configure Retry Wisely

- Use exponential backoff
- Set reasonable max retries (3-5)
- Don't retry forever

### 3. Monitor Queue Health

- Check queue depth regularly
- Alert on dead letter queue growth
- Track processing times

### 4. Handle Failed Messages

- Review failures regularly
- Fix root causes
- Retry when issues are resolved
- Clean up old failures

### 5. Use Rate Limiting

- Prevent abuse
- Protect resources
- Set reasonable limits

### 6. Scale Workers

- Run multiple workers for throughput
- Use maxParallel for batch processing
- Monitor worker health

## Integration Examples

### API Endpoint

```typescript
import { AgentExecutionMessage } from '@bluefly/openstandardagents/messenger';

app.post('/api/agents/execute', async (req, res) => {
  const { agentId, input } = req.body;

  // Dispatch async execution
  await messageBus.dispatch(
    new AgentExecutionMessage(
      agentId,
      input,
      {
        userId: req.user.id,
        requestId: req.id,
        priority: 5,
      }
    )
  );

  res.json({ status: 'queued', requestId: req.id });
});
```

### Callback Handling

```typescript
// Set callback URL when dispatching
await messageBus.dispatch(
  new AgentExecutionMessage(
    'agent-id',
    { input: 'data' },
    { userId: 'user-123' },
    'https://api.example.com/webhook'  // Callback URL
  )
);

// Webhook endpoint receives result
app.post('/webhook', async (req, res) => {
  const { success, output, error, metadata } = req.body;

  if (success) {
    console.log('Agent completed:', output);
  } else {
    console.error('Agent failed:', error);
  }

  res.status(200).send('OK');
});
```

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## References

- [Symfony Messenger Documentation](https://symfony.com/doc/current/messenger.html)
- [OSSA Documentation](https://openstandardagents.org)
- [Async Agents Guide](./ASYNC-AGENTS.md)
