# Symfony Messenger Integration - Documentation Index

Complete documentation for OSSA Symfony Messenger integration.

## Quick Links

### Getting Started
- [Setup Guide](./MESSENGER.md#installation) - Install and configure
- [Quick Start](./ASYNC-AGENTS.md#basic-workflow) - First async agent
- [Configuration](./MESSENGER.md#transport-configuration) - Transport setup

### Core Documentation
- [MESSENGER.md](./MESSENGER.md) - Complete configuration guide
- [ASYNC-AGENTS.md](./ASYNC-AGENTS.md) - Async execution patterns
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Problem solving
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
├── MESSENGER.md                    (2,700 lines)
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
├── ASYNC-AGENTS.md                 (2,300 lines)
│   ├── When to Use Async
│   ├── Execution Patterns
│   ├── Batch Execution
│   ├── Priority Handling
│   ├── Error Handling
│   ├── Performance Optimization
│   ├── Monitoring
│   └── Production Checklist
│
├── TROUBLESHOOTING.md              (2,500 lines)
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
1. [Installation](./MESSENGER.md#installation)
2. [Configure Transport](./MESSENGER.md#configure-transport)
3. [Setup Database Tables](./MESSENGER.md#setup-database-tables)

### Basic Usage
1. [Basic Agent Execution](./MESSENGER.md#basic-agent-execution)
2. [Batch Agent Execution](./MESSENGER.md#batch-agent-execution)
3. [Consuming Messages](./MESSENGER.md#consuming-messages)

### Advanced Usage
1. [Execution Patterns](./ASYNC-AGENTS.md#execution-patterns)
2. [Priority Handling](./ASYNC-AGENTS.md#priority-handling)
3. [Error Handling](./ASYNC-AGENTS.md#error-handling)
4. [Performance Optimization](./ASYNC-AGENTS.md#performance-optimization)

### Operations
1. [Managing Failed Messages](./MESSENGER.md#managing-failed-messages)
2. [Monitoring](./MESSENGER.md#monitoring)
3. [Worker Management](./TROUBLESHOOTING.md#worker-issues)

### Architecture
1. [High-Level Architecture](./messenger-architecture.md#high-level-architecture)
2. [Message Flow](./messenger-architecture.md#message-flow)
3. [Transport Comparison](./messenger-architecture.md#transport-comparison)

### Troubleshooting
1. [Messages Not Processing](./TROUBLESHOOTING.md#messages-not-being-processed)
2. [High Queue Depth](./TROUBLESHOOTING.md#high-queue-depth)
3. [Failed Messages](./TROUBLESHOOTING.md#failed-message-issues)
4. [Performance](./TROUBLESHOOTING.md#performance-problems)

---

## By Role

### Developers

**Getting Started**:
1. [Installation Guide](./MESSENGER.md#installation)
2. [Basic Usage](./MESSENGER.md#usage)
3. [Usage Examples](./ASYNC-AGENTS.md#execution-patterns)

**Integration**:
1. [API Integration](./MESSENGER.md#api-integration)
2. [Callback Handling](./MESSENGER.md#callback-handling)
3. [Error Handling](./ASYNC-AGENTS.md#error-handling)

**Reference**:
1. [Message Classes](../src/messenger/Message/)
2. [Handler API](../src/messenger/Handler/)
3. [Architecture](./messenger-architecture.md)

### DevOps / Operators

**Setup**:
1. [Transport Configuration](./MESSENGER.md#transport-configuration)
2. [Retry Strategies](./MESSENGER.md#retry-strategies)
3. [Production Checklist](./ASYNC-AGENTS.md#production-checklist)

**Operations**:
1. [Worker Management](./TROUBLESHOOTING.md#worker-issues)
2. [Monitoring](./MESSENGER.md#monitoring)
3. [Failed Message Management](./MESSENGER.md#managing-failed-messages)

**Troubleshooting**:
1. [Common Issues](./TROUBLESHOOTING.md)
2. [Performance](./TROUBLESHOOTING.md#performance-problems)
3. [Transport Issues](./TROUBLESHOOTING.md#transport-issues)

### Architects

**Architecture**:
1. [High-Level Architecture](./messenger-architecture.md#high-level-architecture)
2. [Message Flow](./messenger-architecture.md#message-flow)
3. [Security Layers](./messenger-architecture.md#security-layers)

**Design Decisions**:
1. [Transport Comparison](./messenger-architecture.md#transport-comparison)
2. [Scalability](./ASYNC-AGENTS.md#performance-optimization)
3. [Best Practices](./MESSENGER.md#best-practices)

**Integration**:
1. [Integration Examples](./MESSENGER.md#integration-examples)
2. [Execution Patterns](./ASYNC-AGENTS.md#execution-patterns)
3. [Production Readiness](./ASYNC-AGENTS.md#production-checklist)

---

## By Use Case

### Single Agent Execution
1. [Basic Execution](./MESSENGER.md#basic-agent-execution)
2. [Priority Handling](./ASYNC-AGENTS.md#priority-handling)
3. [Error Handling](./ASYNC-AGENTS.md#error-handling)

### Batch Processing
1. [Batch Execution](./MESSENGER.md#batch-agent-execution)
2. [Parallel vs Sequential](./ASYNC-AGENTS.md#batch-execution)
3. [Performance Tuning](./ASYNC-AGENTS.md#performance-optimization)

### Production Deployment
1. [Transport Selection](./MESSENGER.md#transport-configuration)
2. [Scaling Workers](./ASYNC-AGENTS.md#performance-optimization)
3. [Monitoring Setup](./MESSENGER.md#monitoring)

### Troubleshooting
1. [Messages Not Processing](./TROUBLESHOOTING.md#messages-not-being-processed)
2. [Performance Issues](./TROUBLESHOOTING.md#performance-problems)
3. [Failed Messages](./TROUBLESHOOTING.md#failed-message-issues)

---

## CLI Commands

### Consume Messages
```bash
drush messenger:consume agent_async
```
[Documentation](./MESSENGER.md#consuming-messages)

### Manage Failures
```bash
drush messenger:failed:list
drush messenger:failed:retry <id>
```
[Documentation](./MESSENGER.md#managing-failed-messages)

### Statistics
```bash
drush messenger:stats
```
[Documentation](./MESSENGER.md#monitoring)

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
[Full Example](./ASYNC-AGENTS.md#fire-and-forget)

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
[Full Example](./ASYNC-AGENTS.md#parallel-batch)

### Monitoring
```typescript
const metrics = await metricsCollector.getMetrics('agent_async');
console.log(`Success rate: ${metrics.successRate * 100}%`);
```
[Full Example](./MESSENGER.md#monitoring)

---

## Transports

### Doctrine (Database)
- [Setup](./MESSENGER.md#doctrine-database)
- [Troubleshooting](./TROUBLESHOOTING.md#doctrine-transport)
- Use Case: Development, simple deployments

### RabbitMQ
- [Setup](./MESSENGER.md#rabbitmq)
- [Troubleshooting](./TROUBLESHOOTING.md#rabbitmq-transport)
- Use Case: Production, high reliability

### Redis
- [Setup](./MESSENGER.md#redis)
- [Troubleshooting](./TROUBLESHOOTING.md#redis-transport)
- Use Case: High performance

### Amazon SQS
- [Setup](./MESSENGER.md#amazon-sqs)
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

- **Installation**: [MESSENGER.md#installation](./MESSENGER.md#installation)
- **Configuration**: [MESSENGER.md#configuration](./MESSENGER.md#transport-configuration)
- **Async**: [ASYNC-AGENTS.md](./ASYNC-AGENTS.md)
- **Batch**: [ASYNC-AGENTS.md#batch-execution](./ASYNC-AGENTS.md#batch-execution)
- **Priority**: [ASYNC-AGENTS.md#priority-handling](./ASYNC-AGENTS.md#priority-handling)
- **Retry**: [MESSENGER.md#retry-strategies](./MESSENGER.md#retry-strategies)
- **Failed**: [MESSENGER.md#managing-failed-messages](./MESSENGER.md#managing-failed-messages)
- **Monitoring**: [MESSENGER.md#monitoring](./MESSENGER.md#monitoring)
- **Performance**: [ASYNC-AGENTS.md#performance-optimization](./ASYNC-AGENTS.md#performance-optimization)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Architecture**: [messenger-architecture.md](./messenger-architecture.md)
- **Doctrine**: [MESSENGER.md#doctrine-database](./MESSENGER.md#doctrine-database)
- **RabbitMQ**: [MESSENGER.md#rabbitmq](./MESSENGER.md#rabbitmq)
- **Redis**: [MESSENGER.md#redis](./MESSENGER.md#redis)
- **Security**: [MESSENGER.md#security](./MESSENGER.md#security)
- **Scaling**: [ASYNC-AGENTS.md#performance-optimization](./ASYNC-AGENTS.md#performance-optimization)

---

**Total Documentation**: 8,100+ lines across 5 files

**Last Updated**: February 7, 2026
