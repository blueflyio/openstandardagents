# Symfony Messenger Integration

Comprehensive async agent execution for OSSA using Symfony Messenger.

## Features

- ✅ **Async Agent Execution** - Execute OSSA agents asynchronously
- ✅ **Batch Processing** - Run multiple agents in parallel or sequence
- ✅ **Multiple Transports** - Doctrine, RabbitMQ, Redis, Amazon SQS
- ✅ **Retry Strategies** - Automatic retry with exponential backoff
- ✅ **Failed Message Handling** - Dead letter queues and retry
- ✅ **Middleware Stack** - Validation, logging, auth, rate limiting
- ✅ **Monitoring & Metrics** - Track performance and health
- ✅ **Drush Commands** - Full CLI management

## Quick Start

### 1. Install

```bash
npm install @bluefly/openstandardagents
```

### 2. Configure Transport

```bash
# .env
MESSENGER_TRANSPORT_DSN=doctrine://default
```

### 3. Dispatch Message

```typescript
import { AgentExecutionMessage } from '@bluefly/openstandardagents/messenger';

await messageBus.dispatch(
  new AgentExecutionMessage(
    'my-agent',
    { input: 'data' },
    { userId: 'user-123' }
  )
);
```

### 4. Start Worker

```bash
drush messenger:consume agent_async
```

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ dispatch
       ▼
┌─────────────┐     ┌──────────────┐
│  Message    │────▶│  Transport   │
│   Bus       │     │  (Queue)     │
└─────────────┘     └──────┬───────┘
                           │
                           │ consume
                           ▼
                    ┌──────────────┐
                    │   Worker     │
                    └──────┬───────┘
                           │
                           │ handle
                           ▼
                    ┌──────────────┐
                    │   Handler    │
                    └──────┬───────┘
                           │
                           │ execute
                           ▼
                    ┌──────────────┐
                    │     Agent    │
                    │   Runtime    │
                    └──────────────┘
```

## Components

### Messages

- **AgentExecutionMessage** - Single agent execution
- **AgentBatchMessage** - Batch agent execution

### Handlers

- **AgentExecutionHandler** - Processes single agent messages
- **AgentBatchHandler** - Processes batch messages

### Middleware

- **ValidationMiddleware** - Validates message data
- **LoggingMiddleware** - Logs message processing
- **AuthenticationMiddleware** - Checks permissions
- **RateLimitMiddleware** - Prevents abuse

### Commands

- **messenger:consume** - Start message consumer
- **messenger:failed:retry** - Retry failed messages
- **messenger:failed:list** - List failed messages
- **messenger:stats** - Show statistics

### Monitoring

- **MetricsCollector** - Collects performance metrics
- **QueueMonitor** - Monitors queue health

## Usage Examples

### Single Agent

```typescript
import { AgentExecutionMessage } from '@bluefly/openstandardagents/messenger';

await messageBus.dispatch(
  new AgentExecutionMessage(
    'code-reviewer',
    { code: 'function test() {}' },
    {
      userId: 'user-123',
      priority: 8,
      timeout: 30000,
    },
    'https://api.example.com/callback'
  )
);
```

### Batch Agents

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
      maxParallel: 5,
      stopOnError: false,
    }
  )
);
```

### Monitoring

```typescript
import { MetricsCollector, QueueMonitor } from '@bluefly/openstandardagents/messenger';

// Get metrics
const metrics = await metricsCollector.getMetrics('agent_async');
console.log(`Success rate: ${metrics.successRate * 100}%`);

// Check queue health
const status = await queueMonitor.checkQueue('agent_async', 'ossa_agents');
console.log(`Queue healthy: ${status.healthy}`);
```

## Configuration

### Transport Options

```yaml
# Doctrine (Database)
MESSENGER_TRANSPORT_DSN=doctrine://default

# RabbitMQ
MESSENGER_TRANSPORT_DSN=amqp://user:pass@host:5672/%2f

# Redis
MESSENGER_TRANSPORT_DSN=redis://redis:6379/messages

# Amazon SQS
MESSENGER_TRANSPORT_DSN=sqs://default
```

### Retry Strategy

```yaml
retry_strategy:
  max_retries: 3
  delay: 1000
  multiplier: 2
  max_delay: 30000
```

### Rate Limiting

```yaml
rate_limiting:
  enabled: true
  max_executions: 100
  window_seconds: 3600
```

## CLI Commands

```bash
# Consume messages
drush messenger:consume agent_async --limit=100

# Show statistics
drush messenger:stats agent_async

# List failed messages
drush messenger:failed:list

# Retry failed message
drush messenger:failed:retry <message-id>

# Show failed message details
drush messenger:failed:show <message-id>
```

## Documentation

- [Full Documentation](../../docs/MESSENGER.md)
- [Async Agents Guide](../../docs/ASYNC-AGENTS.md)
- [Troubleshooting](../../docs/TROUBLESHOOTING.md)

## License

MIT
