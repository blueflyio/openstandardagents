# Symfony Messenger OSSA Runtime Adapter

## Overview

The Symfony Messenger OSSA Runtime Adapter enables execution of OSSA Task, Workflow, and Agent manifests using Symfony Messenger's asynchronous message queue system. This provides enterprise-grade async processing with support for multiple transports.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Symfony Application                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │  OSSA Manifest  │    │        OSSA Message Handler         │ │
│  │  (Task/Workflow)│───▶│  • OSSATaskMessageHandler           │ │
│  └─────────────────┘    │  • OSSAWorkflowMessageHandler       │ │
│                         │  • OSSAAgentMessageHandler          │ │
│                         └──────────────┬──────────────────────┘ │
│                                        │                        │
│                         ┌──────────────▼──────────────────────┐ │
│                         │      Symfony Messenger Bus          │ │
│                         └──────────────┬──────────────────────┘ │
│                                        │                        │
│  ┌──────────────┬──────────────┬───────┴─────┬──────────────┐  │
│  │    AMQP      │    Redis     │  Doctrine   │     SQS      │  │
│  │  Transport   │  Transport   │  Transport  │  Transport   │  │
│  └──────┬───────┴──────┬───────┴──────┬──────┴──────┬───────┘  │
├─────────┼──────────────┼──────────────┼─────────────┼──────────┤
│  ┌──────▼───────┐ ┌────▼────┐ ┌───────▼──────┐ ┌────▼────┐     │
│  │  RabbitMQ    │ │  Redis  │ │   Database   │ │   SQS   │     │
│  └──────────────┘ └─────────┘ └──────────────┘ └─────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Messenger Worker │
                    │   messenger:consume│
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Task Execution  │
                    └───────────────────┘
```

## Installation

```bash
composer require ossa/symfony-adapter
```

## Configuration

### Bundle Configuration (`config/packages/ossa.yaml`)

```yaml
ossa:
  # Manifest discovery
  manifest_paths:
    - '%kernel.project_dir%/config/ossa'
    - '%kernel.project_dir%/src/*/Resources/ossa'

  # Default runtime settings
  defaults:
    timeout_seconds: 300
    retry_attempts: 3
    retry_delay_ms: 1000

  # Observability
  observability:
    enabled: true
    exporter: otel
    endpoint: '%env(OTEL_EXPORTER_ENDPOINT)%'
```

### Messenger Configuration (`config/packages/messenger.yaml`)

```yaml
framework:
  messenger:
    transports:
      # OSSA Task transport
      ossa_tasks:
        dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
        options:
          queue_name: ossa_tasks
        retry_strategy:
          max_retries: 3
          delay: 1000
          multiplier: 2

      # OSSA Workflow transport
      ossa_workflows:
        dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
        options:
          queue_name: ossa_workflows
        retry_strategy:
          max_retries: 5
          delay: 2000

      # OSSA Agent transport (higher priority)
      ossa_agents:
        dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
        options:
          queue_name: ossa_agents

    routing:
      'OSSA\Messenger\Message\OSSATaskMessage': ossa_tasks
      'OSSA\Messenger\Message\OSSAWorkflowMessage': ossa_workflows
      'OSSA\Messenger\Message\OSSAAgentMessage': ossa_agents
```

## Message Types

### OSSATaskMessage

Wraps a `kind: Task` manifest for async execution:

```php
<?php

namespace OSSA\Messenger\Message;

final class OSSATaskMessage
{
    public function __construct(
        private readonly string $manifestPath,
        private readonly array $input,
        private readonly ?string $correlationId = null,
        private readonly array $metadata = [],
    ) {}

    public function getManifestPath(): string
    {
        return $this->manifestPath;
    }

    public function getInput(): array
    {
        return $this->input;
    }

    public function getCorrelationId(): ?string
    {
        return $this->correlationId;
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }
}
```

### OSSAWorkflowMessage

Wraps a `kind: Workflow` manifest with step orchestration:

```php
<?php

namespace OSSA\Messenger\Message;

final class OSSAWorkflowMessage
{
    public function __construct(
        private readonly string $manifestPath,
        private readonly array $input,
        private readonly ?string $workflowInstanceId = null,
        private readonly ?string $parentStepId = null,
        private readonly array $context = [],
    ) {}

    // ... getters
}
```

## Message Handlers

### OSSATaskMessageHandler

```php
<?php

namespace OSSA\Messenger\Handler;

use OSSA\Messenger\Message\OSSATaskMessage;
use OSSA\Runtime\TaskExecutor;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final class OSSATaskMessageHandler
{
    public function __construct(
        private readonly TaskExecutor $executor,
        private readonly ManifestLoader $manifestLoader,
    ) {}

    public function __invoke(OSSATaskMessage $message): void
    {
        $manifest = $this->manifestLoader->load($message->getManifestPath());

        $result = $this->executor->execute($manifest, $message->getInput());

        // Result is stored/emitted based on manifest observability settings
    }
}
```

### OSSAWorkflowMessageHandler

```php
<?php

namespace OSSA\Messenger\Handler;

use OSSA\Messenger\Message\OSSAWorkflowMessage;
use OSSA\Messenger\Message\OSSATaskMessage;
use OSSA\Runtime\WorkflowOrchestrator;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsMessageHandler]
final class OSSAWorkflowMessageHandler
{
    public function __construct(
        private readonly WorkflowOrchestrator $orchestrator,
        private readonly MessageBusInterface $bus,
    ) {}

    public function __invoke(OSSAWorkflowMessage $message): void
    {
        $workflow = $this->orchestrator->loadWorkflow($message->getManifestPath());

        foreach ($workflow->getReadySteps($message->getContext()) as $step) {
            if ($step->getKind() === 'Task') {
                // Dispatch Task step as separate message
                $this->bus->dispatch(new OSSATaskMessage(
                    $step->getRef(),
                    $step->getResolvedInput($message->getContext()),
                    correlationId: $message->getWorkflowInstanceId(),
                ));
            }
        }
    }
}
```

## Transport Support

### AMQP (RabbitMQ)

```yaml
# .env
MESSENGER_TRANSPORT_DSN=amqp://guest:guest@localhost:5672/%2f/messages

# config/packages/messenger.yaml
framework:
  messenger:
    transports:
      ossa_tasks:
        dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
        options:
          exchange:
            name: ossa
            type: topic
          queues:
            ossa_tasks:
              binding_keys:
                - 'task.*'
```

### Redis

```yaml
# .env
MESSENGER_TRANSPORT_DSN=redis://localhost:6379/messages

# config/packages/messenger.yaml
framework:
  messenger:
    transports:
      ossa_tasks:
        dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
        options:
          stream: ossa_tasks
          group: ossa_workers
          consumer: worker_%hostname%
```

### Doctrine

```yaml
# .env
MESSENGER_TRANSPORT_DSN=doctrine://default

# config/packages/messenger.yaml
framework:
  messenger:
    transports:
      ossa_tasks:
        dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
        options:
          table_name: ossa_messenger_messages
          queue_name: ossa_tasks
```

### Amazon SQS

```yaml
# .env
MESSENGER_TRANSPORT_DSN=sqs://default?region=us-east-1

# config/packages/messenger.yaml
framework:
  messenger:
    transports:
      ossa_tasks:
        dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
        options:
          queue_name: ossa-tasks
          wait_time: 20
          poll_timeout: 0.1
```

## Runtime Bindings

Map OSSA capabilities to Symfony services:

```yaml
# config/packages/ossa.yaml
ossa:
  bindings:
    send_email:
      service: 'Symfony\Component\Mailer\MailerInterface'
      method: send

    http_request:
      service: 'Symfony\Contracts\HttpClient\HttpClientInterface'
      method: request

    cache_get:
      service: 'Symfony\Contracts\Cache\CacheInterface'
      method: get

    dispatch_event:
      service: 'Symfony\Contracts\EventDispatcher\EventDispatcherInterface'
      method: dispatch
```

## Example Task Manifest

```yaml
# config/ossa/tasks/send-email.yaml
apiVersion: ossa/v0.3.1
kind: Task
metadata:
  name: send-email-symfony
  version: 1.0.0
  labels:
    runtime: symfony
    transport: messenger

spec:
  execution:
    type: deterministic
    runtime: symfony
    entrypoint: 'App\TaskHandler\SendEmailHandler::execute'
    timeout_seconds: 30

  capabilities:
    - send_email
    - render_template

  input:
    type: object
    properties:
      to:
        type: string
        format: email
      subject:
        type: string
      template:
        type: string
      variables:
        type: object
    required:
      - to
      - subject
      - template

  output:
    type: object
    properties:
      message_id:
        type: string
      sent_at:
        type: string
        format: date-time

  error_handling:
    on_error: retry
    retry:
      max_attempts: 3
      backoff_strategy: exponential

runtime:
  type: symfony
  bindings:
    send_email:
      service: '@Symfony\Component\Mailer\MailerInterface'
    render_template:
      service: '@Twig\Environment'

  messenger:
    transport: ossa_tasks
    routing_key: email.send
```

## Example Workflow Manifest

```yaml
# config/ossa/workflows/user-onboarding.yaml
apiVersion: ossa/v0.3.1
kind: Workflow
metadata:
  name: user-onboarding-symfony
  version: 1.0.0

spec:
  triggers:
    - type: event
      source: symfony.event_dispatcher
      event: user.registered

  inputs:
    type: object
    properties:
      user_id:
        type: string
      email:
        type: string
    required:
      - user_id
      - email

  steps:
    - id: validate_email
      kind: Task
      ref: ./tasks/validate-email.yaml
      input:
        email: '${{ workflow.input.email }}'

    - id: create_profile
      kind: Task
      ref: ./tasks/create-profile.yaml
      input:
        user_id: '${{ workflow.input.user_id }}'
      depends_on:
        - validate_email

    - id: send_welcome_email
      kind: Task
      ref: ./tasks/send-email.yaml
      input:
        to: '${{ workflow.input.email }}'
        template: welcome
      depends_on:
        - create_profile

runtime:
  type: symfony
  messenger:
    transport: ossa_workflows
    step_dispatch:
      transport: ossa_tasks
      parallel_execution: true
```

## Worker Deployment

### Docker

```dockerfile
FROM php:8.2-cli

# Install dependencies
RUN docker-php-ext-install pdo_mysql pcntl

# Copy application
COPY . /app
WORKDIR /app

# Run worker
CMD ["php", "bin/console", "messenger:consume", "ossa_tasks", "ossa_workflows", "-vv"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ossa-worker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ossa-worker
  template:
    spec:
      containers:
        - name: worker
          image: myapp:latest
          command: ["php", "bin/console", "messenger:consume"]
          args:
            - "ossa_tasks"
            - "ossa_workflows"
            - "--limit=100"
            - "--time-limit=3600"
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

## Observability

### OpenTelemetry Integration

```php
<?php
// Automatic span creation for message handling

use OpenTelemetry\API\Trace\TracerInterface;

#[AsMessageHandler]
final class OSSATaskMessageHandler
{
    public function __construct(
        private readonly TracerInterface $tracer,
    ) {}

    public function __invoke(OSSATaskMessage $message): void
    {
        $span = $this->tracer->spanBuilder('ossa.task.execute')
            ->setAttribute('ossa.task.name', $message->getManifestPath())
            ->setAttribute('ossa.correlation_id', $message->getCorrelationId())
            ->startSpan();

        try {
            // Execute task
        } finally {
            $span->end();
        }
    }
}
```

### Prometheus Metrics

```yaml
# Exposed at /metrics
ossa_task_messages_total{task="send-email", status="success"} 1234
ossa_task_duration_seconds{task="send-email"} 0.45
ossa_workflow_steps_completed{workflow="user-onboarding"} 567
ossa_messenger_queue_size{queue="ossa_tasks"} 12
```

## Error Handling

### Dead Letter Queue

```yaml
framework:
  messenger:
    transports:
      ossa_tasks:
        dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
        failure_transport: ossa_failed

      ossa_failed:
        dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
        options:
          queue_name: ossa_failed
```

### Custom Error Handler

```php
<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Messenger\Event\WorkerMessageFailedEvent;

class OSSAFailureSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            WorkerMessageFailedEvent::class => 'onMessageFailed',
        ];
    }

    public function onMessageFailed(WorkerMessageFailedEvent $event): void
    {
        $message = $event->getEnvelope()->getMessage();

        if ($message instanceof OSSATaskMessage) {
            // Log, alert, or handle failure
        }
    }
}
```

## CLI Commands

```bash
# Validate OSSA manifest
php bin/console ossa:validate config/ossa/tasks/my-task.yaml

# Dispatch a task
php bin/console ossa:dispatch task my-task --input='{"key": "value"}'

# Start a workflow
php bin/console ossa:dispatch workflow user-onboarding --input='{"user_id": "123"}'

# List pending messages
php bin/console messenger:stats

# Consume messages
php bin/console messenger:consume ossa_tasks ossa_workflows -vv

# Retry failed messages
php bin/console messenger:failed:retry --all
```

## OSSA Compliance

This adapter implements OSSA v0.3.1 specification:

- ✅ Task execution with deterministic semantics
- ✅ Workflow orchestration with step dependencies
- ✅ Async execution via Symfony Messenger
- ✅ Multiple transport support (AMQP, Redis, Doctrine, SQS)
- ✅ Capability abstraction and runtime bindings
- ✅ OpenTelemetry observability
- ✅ Error handling with retry strategies
- ✅ Dead letter queue support

## Related

- [OSSA Specification v0.3.1](../README.md)
- [Drupal Adapter](./drupal.md)
- [Node.js Adapter](./nodejs.md)
- [Capability Registry](../capability-schema.md)
