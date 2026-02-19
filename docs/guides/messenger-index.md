# Symfony Messenger Integration - Documentation Index

Complete documentation for OSSA Symfony Messenger integration.

## Quick Links

### Getting Started
- [Setup Guide](./messenger.md#installation) - Install and configure
- [Quick Start](./asyncAgents.md#basic-workflow) - First async agent
- [Configuration](./messenger.md#transport-configuration) - Transport setup

### Core Documentation
- [messenger.md](./messenger.md) - Complete configuration guide
- [asyncAgents.md](./asyncAgents.md) - Async execution patterns
- [troubleshooting.md](./troubleshooting.md) - Problem solving
- [messenger-architecture.md](./messenger-architecture.md) - Architecture diagrams

### Implementation
- [Message Classes](../src/messenger/Message/) - TypeScript implementation
- [Handlers](../src/messenger/Handler/) - Message processors
- [Middleware](../src/messenger/Middleware/) - Middleware stack
- [Commands](../src/messenger/Commands/) - CLI tools
- [Monitoring](../src/messenger/Monitoring/) - Metrics and health

---

## Documentation Structure

```
docs/
├── messenger.md                    (2,700 lines)
│   ├── Overview
│   ├── Installation
│   ├── Transport Configuration
│   ├── Usage Examples
│   ├── Retry Strategies
│   ├── Middleware
│   ├── Monitoring
│   ├── Best Practices
│   └── Integration Examples
│
├── asyncAgents.md                 (2,300 lines)
│   ├── When to Use Async
│   ├── Execution Patterns
│   ├── Batch Execution
│   ├── Priority Handling
│   ├── Error Handling
│   ├── Performance Optimization
│   ├── Monitoring
│   └── Production Checklist
│
├── troubleshooting.md              (2,500 lines)
│   ├── Messages Not Processing
│   ├── High Queue Depth
│   ├── Failed Messages
│   ├── Performance Problems
│   ├── Transport Issues
│   ├── Worker Issues
│   └── Monitoring Issues
│
└── messenger-architecture.md       (600 lines)
    ├── High-Level Architecture
    ├── Message Flow
    ├── Batch Execution
    ├── Error Handling
    ├── Transport Comparison
    └── Security Layers
```

---

## By Topic

### Installation & Setup
1. [Installation](./messenger.md#installation)
2. [Configure Transport](./messenger.md#configure-transport)
3. [Setup Database Tables](./messenger.md#setup-database-tables)

### Basic Usage
1. [Basic Agent Execution](./messenger.md#basic-agent-execution)
2. [Batch Agent Execution](./messenger.md#batch-agent-execution)
3. [Consuming Messages](./messenger.md#consuming-messages)

### Advanced Usage
1. [Execution Patterns](./asyncAgents.md#execution-patterns)
2. [Priority Handling](./asyncAgents.md#priority-handling)
3. [Error Handling](./asyncAgents.md#error-handling)
4. [Performance Optimization](./asyncAgents.md#performance-optimization)

### Operations
1. [Managing Failed Messages](./messenger.md#managing-failed-messages)
2. [Monitoring](./messenger.md#monitoring)
3. [Worker Management](./troubleshooting.md#worker-issues)

### Architecture
1. [High-Level Architecture](./messenger-architecture.md#high-level-architecture)
2. [Message Flow](./messenger-architecture.md#message-flow)
3. [Transport Comparison](./messenger-architecture.md#transport-comparison)

### Troubleshooting
1. [Messages Not Processing](./troubleshooting.md#messages-not-being-processed)
2. [High Queue Depth](./troubleshooting.md#high-queue-depth)
3. [Failed Messages](./troubleshooting.md#failed-message-issues)
4. [Performance](./troubleshooting.md#performance-problems)

---

## By Role

### Developers

**Getting Started**:
1. [Installation Guide](./messenger.md#installation)
2. [Basic Usage](./messenger.md#usage)
3. [Usage Examples](./asyncAgents.md#execution-patterns)

**Integration**:
1. [API Integration](./messenger.md#api-integration)
2. [Callback Handling](./messenger.md#callback-handling)
3. [Error Handling](./asyncAgents.md#error-handling)

**Reference**:
1. [Message Classes](../src/messenger/Message/)
2. [Handler API](../src/messenger/Handler/)
3. [Architecture](./messenger-architecture.md)

### DevOps / Operators

**Setup**:
1. [Transport Configuration](./messenger.md#transport-configuration)
2. [Retry Strategies](./messenger.md#retry-strategies)
3. [Production Checklist](./asyncAgents.md#production-checklist)

**Operations**:
1. [Worker Management](./troubleshooting.md#worker-issues)
2. [Monitoring](./messenger.md#monitoring)
3. [Failed Message Management](./messenger.md#managing-failed-messages)

**Troubleshooting**:
1. [Common Issues](./troubleshooting.md)
2. [Performance](./troubleshooting.md#performance-problems)
3. [Transport Issues](./troubleshooting.md#transport-issues)

### Architects

**Architecture**:
1. [High-Level Architecture](./messenger-architecture.md#high-level-architecture)
2. [Message Flow](./messenger-architecture.md#message-flow)
3. [Security Layers](./messenger-architecture.md#security-layers)

**Design Decisions**:
1. [Transport Comparison](./messenger-architecture.md#transport-comparison)
2. [Scalability](./asyncAgents.md#performance-optimization)
3. [Best Practices](./messenger.md#best-practices)

**Integration**:
1. [Integration Examples](./messenger.md#integration-examples)
2. [Execution Patterns](./asyncAgents.md#execution-patterns)
3. [Production Readiness](./asyncAgents.md#production-checklist)

---

## By Use Case

### Single Agent Execution
1. [Basic Execution](./messenger.md#basic-agent-execution)
2. [Priority Handling](./asyncAgents.md#priority-handling)
3. [Error Handling](./asyncAgents.md#error-handling)

### Batch Processing
1. [Batch Execution](./messenger.md#batch-agent-execution)
2. [Parallel vs Sequential](./asyncAgents.md#batch-execution)
3. [Performance Tuning](./asyncAgents.md#performance-optimization)

### Production Deployment
1. [Transport Selection](./messenger.md#transport-configuration)
2. [Scaling Workers](./asyncAgents.md#performance-optimization)
3. [Monitoring Setup](./messenger.md#monitoring)

### Troubleshooting
1. [Messages Not Processing](./troubleshooting.md#messages-not-being-processed)
2. [Performance Issues](./troubleshooting.md#performance-problems)
3. [Failed Messages](./troubleshooting.md#failed-message-issues)

---

## CLI Commands

### Consume Messages
```bash
drush messenger:consume agent_async
```
[Documentation](./messenger.md#consuming-messages)

### Manage Failures
```bash
drush messenger:failed:list
drush messenger:failed:retry <id>
```
[Documentation](./messenger.md#managing-failed-messages)

### Statistics
```bash
drush messenger:stats
```
[Documentation](./messenger.md#monitoring)

---

## Code Examples

### Single Agent
```typescript
import { AgentExecutionMessage } from '@bluefly/openstandardagents/messenger';

await messageBus.dispatch(
  new AgentExecutionMessage(
    'agent-id',
    { input: 'data' },
    { userId: 'user-123' }
  )
);
```
[Full Example](./asyncAgents.md#fire-and-forget)

### Batch Agents
```typescript
import { AgentBatchMessage } from '@bluefly/openstandardagents/messenger';

await messageBus.dispatch(
  new AgentBatchMessage(
    ['agent-1', 'agent-2'],
    { 'agent-1': { input: 'data' } },
    { mode: 'parallel' }
  )
);
```
[Full Example](./asyncAgents.md#parallel-batch)

### Monitoring
```typescript
const metrics = await metricsCollector.getMetrics('agent_async');
console.log(`Success rate: ${metrics.successRate * 100}%`);
```
[Full Example](./messenger.md#monitoring)

---

## Transports

### Doctrine (Database)
- [Setup](./messenger.md#doctrine-database)
- [Troubleshooting](./troubleshooting.md#doctrine-transport)
- Use Case: Development, simple deployments

### RabbitMQ
- [Setup](./messenger.md#rabbitmq)
- [Troubleshooting](./troubleshooting.md#rabbitmq-transport)
- Use Case: Production, high reliability

### Redis
- [Setup](./messenger.md#redis)
- [Troubleshooting](./troubleshooting.md#redis-transport)
- Use Case: High performance

### Amazon SQS
- [Setup](./messenger.md#amazon-sqs)
- Use Case: AWS deployments

---

## Diagrams

### Architecture
- [High-Level Architecture](./messenger-architecture.md#high-level-architecture)
- [Message Flow](./messenger-architecture.md#message-flow)
- [Batch Execution](./messenger-architecture.md#batch-execution-parallel)
- [Error Handling](./messenger-architecture.md#error-handling-flow)

### Components
- [Transport Comparison](./messenger-architecture.md#transport-comparison)
- [CLI Structure](./messenger-architecture.md#cli-command-structure)
- [Security Layers](./messenger-architecture.md#security-layers)

---

## Additional Resources

### Implementation Files
- [src/messenger/](../src/messenger/) - TypeScript implementation
- [config/](../config/) - Configuration files

### Summaries
- [SYMFONY-MESSENGER-INTEGRATION.md](../SYMFONY-MESSENGER-INTEGRATION.md) - Implementation summary
- [MESSENGER-DELIVERY-COMPLETE.md](../MESSENGER-DELIVERY-COMPLETE.md) - Delivery summary

### External Resources
- [Symfony Messenger Docs](https://symfony.com/doc/current/messenger.html)
- [OSSA Documentation](https://openstandardagents.org)
- [RabbitMQ Docs](https://www.rabbitmq.com/documentation.html)
- [Redis Streams](https://redis.io/topics/streams-intro)

---

## Search by Keyword

- **Installation**: [messenger.md#installation](./messenger.md#installation)
- **Configuration**: [messenger.md#configuration](./messenger.md#transport-configuration)
- **Async**: [asyncAgents.md](./asyncAgents.md)
- **Batch**: [asyncAgents.md#batch-execution](./asyncAgents.md#batch-execution)
- **Priority**: [asyncAgents.md#priority-handling](./asyncAgents.md#priority-handling)
- **Retry**: [messenger.md#retry-strategies](./messenger.md#retry-strategies)
- **Failed**: [messenger.md#managing-failed-messages](./messenger.md#managing-failed-messages)
- **Monitoring**: [messenger.md#monitoring](./messenger.md#monitoring)
- **Performance**: [asyncAgents.md#performance-optimization](./asyncAgents.md#performance-optimization)
- **Troubleshooting**: [troubleshooting.md](./troubleshooting.md)
- **Architecture**: [messenger-architecture.md](./messenger-architecture.md)
- **Doctrine**: [messenger.md#doctrine-database](./messenger.md#doctrine-database)
- **RabbitMQ**: [messenger.md#rabbitmq](./messenger.md#rabbitmq)
- **Redis**: [messenger.md#redis](./messenger.md#redis)
- **Security**: [messenger.md#security](./messenger.md#security)
- **Scaling**: [asyncAgents.md#performance-optimization](./asyncAgents.md#performance-optimization)

---

**Total Documentation**: 8,100+ lines across 5 files

**Last Updated**: February 7, 2026
