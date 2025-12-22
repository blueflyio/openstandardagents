# OSSA Manifest Extensions: Messaging

**Version:** 0.3.1
**Status:** Stable
**Last Updated:** 2025-12-18

## Overview

This document describes how to integrate the Agent-to-Agent Messaging extension into OSSA manifests. The messaging extension enables agents to communicate asynchronously through channels, supporting publish-subscribe patterns, direct messaging, and broadcast events.

## Manifest Structure

The `messaging` field is added to the `spec` section of Agent manifests:

```yaml
apiVersion: ossa/v0.3.1
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0
spec:
  messaging:
    publishes:
      - channel: agents.{id}.completed
        schema: TaskCompleted
        description: Published when agent completes a task
        qos:
          deliveryMode: at-least-once
          persistent: true

    subscribes:
      - channel: agents.tasks.assigned
        schema: TaskAssigned
        handler: handleTaskAssigned
        filter:
          payload.assignedTo: "ossa://agents/my-agent"
        priority: high

    transport:
      type: redis
      config:
        url: ${REDIS_URL}

    schemas:
      TaskCompleted:
        $ref: "https://ossa.dev/schemas/messaging/TaskCompleted.schema.json"
      TaskAssigned:
        $ref: "https://ossa.dev/schemas/messaging/TaskAssigned.schema.json"
```

## Schema Reference

All messaging components reference JSON Schemas defined in:

- `/spec/v0.3.0/schemas/messaging/message.schema.json` - Message envelope
- `/spec/v0.3.0/schemas/messaging/channel.schema.json` - Channel configuration
- `/spec/v0.3.0/schemas/messaging/subscription.schema.json` - Subscription configuration
- `/spec/v0.3.0/schemas/messaging/delivery-receipt.schema.json` - Delivery receipts

## Publishing Messages

### Basic Publishing

```yaml
spec:
  messaging:
    publishes:
      - channel: agents.tasks.completed
        schema: TaskCompleted
        description: Broadcast when any task is completed
```

### Publishing with QoS

```yaml
spec:
  messaging:
    publishes:
      - channel: agents.code-reviewer.results
        schema: ReviewResult
        description: Code review results
        qos:
          deliveryMode: at-least-once
          persistent: true
          ordered: true
```

### Publishing to Multiple Channels

```yaml
spec:
  messaging:
    publishes:
      - channel: agents.tasks.assigned
        schema: TaskAssigned

      - channel: agents.tasks.completed
        schema: TaskCompleted

      - channel: agents.orchestrator.status
        schema: OrchestratorStatus
        qos:
          deliveryMode: at-most-once
          persistent: false
```

## Subscribing to Messages

### Basic Subscription

```yaml
spec:
  messaging:
    subscribes:
      - channel: agents.tasks.assigned
        schema: TaskAssigned
        handler: handleTaskAssigned
```

### Subscription with Filtering

Filter messages based on payload content:

```yaml
spec:
  messaging:
    subscribes:
      - channel: agents.tasks.assigned
        schema: TaskAssigned
        handler: handleTaskAssigned
        filter:
          payload.assignedTo: "ossa://agents/code-reviewer"
          payload.priority: "high"
```

### Subscription with Wildcards

Subscribe to multiple channels using patterns:

```yaml
spec:
  messaging:
    subscribes:
      # Match any agent's completed events
      - channel: agents.*.completed
        schema: TaskCompleted
        handler: onAnyTaskCompleted

      # Match all events under agents namespace
      - channel: agents.#
        schema: GenericEvent
        handler: logAllEvents
```

### Subscription with Advanced Configuration

```yaml
spec:
  messaging:
    subscribes:
      - channel: agents.tasks.assigned
        schema: TaskAssigned
        handler: handleTaskAssigned
        priority: high
        config:
          autoAcknowledge: false
          maxConcurrentMessages: 5
          prefetchCount: 10
          timeout: 60000
          retryOnError: true
          maxRetries: 5
          retryBackoff:
            strategy: exponential
            initialDelay: 1000
            maxDelay: 30000
            multiplier: 2
          deadLetterQueue: true
```

## Transport Configuration

### Redis Transport (Recommended)

```yaml
spec:
  messaging:
    transport:
      type: redis
      config:
        url: ${REDIS_URL:-redis://localhost:6379}
        db: 0
        keyPrefix: "ossa:messages:"
        connectionTimeout: 5000
        retryStrategy:
          maxRetries: 3
          backoff: exponential
```

### In-Memory Transport (Development)

```yaml
spec:
  messaging:
    transport:
      type: memory
      config:
        maxMessages: 10000
        pruneInterval: 60000
```

## Schema Definitions

Define message schemas for validation:

```yaml
spec:
  messaging:
    schemas:
      TaskAssigned:
        $ref: "https://ossa.dev/schemas/messaging/TaskAssigned.schema.json"

      TaskCompleted:
        type: object
        required:
          - taskId
          - status
          - completedAt
        properties:
          taskId:
            type: string
          status:
            type: string
            enum: [success, failure, cancelled]
          completedAt:
            type: string
            format: date-time
          result:
            type: object
            additionalProperties: true
          error:
            type: object
            properties:
              code:
                type: string
              message:
                type: string
```

## Security Configuration

### Authentication

```yaml
spec:
  messaging:
    authentication:
      method: ossa-identity
      credentialsRef: agent-credentials
```

### Authorization

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

### End-to-End Encryption

```yaml
spec:
  messaging:
    encryption:
      enabled: true
      algorithm: AES-256-GCM
      keyRef: message-encryption-key
```

## Complete Example

```yaml
apiVersion: ossa/v0.3.1
kind: Agent
metadata:
  name: task-orchestrator
  version: 1.0.0
  description: Orchestrates task assignment and completion
  labels:
    team: platform
    environment: production

spec:
  role: |
    You are a task orchestrator agent responsible for distributing work
    to specialized worker agents and tracking completion.

  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4}
    profile: ${LLM_PROFILE:-balanced}

  messaging:
    # Channels this agent publishes to
    publishes:
      - channel: agents.tasks.assigned
        schema: TaskAssigned
        description: Published when assigning tasks to workers
        qos:
          deliveryMode: at-least-once
          persistent: true
          ordered: true

      - channel: agents.orchestrator.status
        schema: OrchestratorStatus
        description: Periodic status updates
        qos:
          deliveryMode: at-most-once
          persistent: false

    # Channels this agent subscribes to
    subscribes:
      - channel: agents.tasks.completed
        schema: TaskCompleted
        handler: handleTaskCompleted
        priority: high
        config:
          autoAcknowledge: false
          maxConcurrentMessages: 10
          timeout: 30000

      - channel: agents.tasks.failed
        schema: TaskFailed
        handler: handleTaskFailed
        priority: critical
        config:
          autoAcknowledge: false
          maxRetries: 0

      - channel: agents.broadcast.shutdown
        schema: SystemShutdown
        handler: handleShutdown
        priority: critical

    # Transport configuration
    transport:
      type: redis
      config:
        url: ${REDIS_URL:-redis://localhost:6379}
        db: 0
        keyPrefix: "ossa:messages:"

    # Message schemas
    schemas:
      TaskAssigned:
        $ref: "https://ossa.dev/schemas/messaging/TaskAssigned.schema.json"
      TaskCompleted:
        $ref: "https://ossa.dev/schemas/messaging/TaskCompleted.schema.json"
      TaskFailed:
        $ref: "https://ossa.dev/schemas/messaging/TaskFailed.schema.json"
      OrchestratorStatus:
        type: object
        properties:
          activeTasksCount:
            type: integer
          completedTasksCount:
            type: integer
          failedTasksCount:
            type: integer
          timestamp:
            type: string
            format: date-time
      SystemShutdown:
        $ref: "https://ossa.dev/schemas/messaging/SystemShutdown.schema.json"

    # Security
    authentication:
      method: ossa-identity
      credentialsRef: orchestrator-credentials

    authorization:
      policies:
        - channel: "agents.tasks.*"
          allow:
            - role: orchestrator
            - role: admin

  tools:
    - name: assign_task
      description: Assign a task to a worker agent

  constraints:
    max_iterations: 100
    timeout_seconds: 300

  observability:
    tracing:
      enabled: true
      sampler: always
    metrics:
      enabled: true
      interval: 60
    logging:
      level: info
      format: json
```

## Worker Agent Example

```yaml
apiVersion: ossa/v0.3.1
kind: Agent
metadata:
  name: code-reviewer
  version: 1.0.0
  description: Reviews code changes and provides feedback

spec:
  role: |
    You are a code reviewer agent specialized in analyzing code changes
    for security, performance, and best practices.

  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4}
    profile: deep

  messaging:
    subscribes:
      - channel: agents.tasks.assigned
        schema: TaskAssigned
        handler: handleTaskAssigned
        filter:
          payload.assignedTo: "ossa://agents/code-reviewer"
          payload.taskType: "code_review"
        priority: normal
        config:
          autoAcknowledge: false
          maxConcurrentMessages: 3
          timeout: 120000
          retryOnError: true
          maxRetries: 3

    publishes:
      - channel: agents.tasks.completed
        schema: TaskCompleted
        description: Published when code review is complete
        qos:
          deliveryMode: at-least-once
          persistent: true

      - channel: agents.tasks.failed
        schema: TaskFailed
        description: Published when review fails
        qos:
          deliveryMode: at-least-once
          persistent: true

    transport:
      type: redis
      config:
        url: ${REDIS_URL}

    schemas:
      TaskAssigned:
        $ref: "https://ossa.dev/schemas/messaging/TaskAssigned.schema.json"
      TaskCompleted:
        $ref: "https://ossa.dev/schemas/messaging/TaskCompleted.schema.json"
      TaskFailed:
        $ref: "https://ossa.dev/schemas/messaging/TaskFailed.schema.json"
```

## Channel Naming Conventions

Follow these conventions for channel names:

- **Direct channels**: `agents.{agent-id}.{message-type}`
  - Example: `agents.code-reviewer.task-assigned`

- **Topic channels**: `agents.{topic}.{event-type}`
  - Example: `agents.tasks.completed`

- **Broadcast channels**: `agents.broadcast.{event-type}`
  - Example: `agents.broadcast.shutdown`

## Validation

Validate your manifest using the OSSA CLI:

```bash
# Validate manifest
ossa validate agent.yaml

# Validate messaging configuration
ossa validate --component messaging agent.yaml

# Check schema references
ossa validate --check-refs agent.yaml
```

## Migration from Direct Calls

### Before (Direct Function Calls)

```yaml
spec:
  tools:
    - name: review_code
      type: function
      implementation: ./handlers/review.ts
```

### After (Messaging-Based)

```yaml
spec:
  messaging:
    subscribes:
      - channel: agents.code-reviewer.review-requests
        schema: ReviewRequest
        handler: handleReviewRequest

    publishes:
      - channel: agents.code-reviewer.review-completed
        schema: ReviewCompleted
```

## Best Practices

1. **Use Semantic Channel Names**: Make channel names descriptive and follow conventions
2. **Define Schemas**: Always provide JSON Schema for message validation
3. **Set Appropriate QoS**: Choose delivery guarantees based on message importance
4. **Implement Idempotent Handlers**: Design handlers to safely handle duplicate messages
5. **Use Filters**: Filter messages at subscription level for efficiency
6. **Monitor Subscriptions**: Track message processing metrics and errors
7. **Handle Failures**: Implement proper error handling and DLQ monitoring
8. **Version Schemas**: Use schema versioning for backward compatibility

## References

- [A2A Messaging Specification](./a2a-messaging.md)
- [Message Schema](../v0.3.0/schemas/messaging/message.schema.json)
- [Channel Schema](../v0.3.0/schemas/messaging/channel.schema.json)
- [Subscription Schema](../v0.3.0/schemas/messaging/subscription.schema.json)
- [OSSA Manifest Schema](../v0.3.0/ossa-0.3.0.schema.json)
