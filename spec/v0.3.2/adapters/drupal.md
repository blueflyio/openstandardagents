# Drupal OSSA Runtime Adapter

## Overview

The Drupal OSSA Runtime Adapter enables execution of OSSA Task, Workflow, and Agent manifests within Drupal's ecosystem. It provides a unified interface that bridges Drupal's five execution models to the OSSA standard.

## Background

From the conversation with James Abrahams:

> "Drupal has 5 execution models that can't talk to each other. If we can bring those 5 things together in Drupal, why can't it be a standard that actually would work outside of Drupal or even outside of PHP?"

This adapter answers that question by providing bidirectional mapping between Drupal's native execution engines and OSSA's portable schema.

## Execution Models Mapping

| Drupal Model | OSSA Kind | Use Case | Mapping Strategy |
|--------------|-----------|----------|------------------|
| **ECA** | Task + Workflow | Event-Condition-Action rules | ECA models → deterministic Tasks; complex rules → Workflows |
| **Maestro** | Workflow | Business process engine | Maestro templates → OSSA Workflow with step orchestration |
| **FlowDrop** | Workflow | Visual workflow builder | FlowDrop nodes → OSSA Workflow steps |
| **AI Agent Runner** | Agent | Agentic execution with LLM | Direct mapping to OSSA Agent kind |
| **Minikanban** | Task | Simple task boards | Kanban cards → individual OSSA Tasks |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Drupal Application                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────┐ │
│  │   ECA   │  │ Maestro │  │ FlowDrop │  │AI Agent │  │ Mini │ │
│  │         │  │         │  │          │  │ Runner  │  │Kanban│ │
│  └────┬────┘  └────┬────┘  └────┬─────┘  └────┬────┘  └──┬───┘ │
│       │            │            │             │          │      │
│       └────────────┴────────────┴─────────────┴──────────┘      │
│                              │                                   │
│                    ┌─────────▼─────────┐                        │
│                    │  OSSA Adapter     │                        │
│                    │  ---------------  │                        │
│                    │  • Manifest Parser│                        │
│                    │  • Runtime Binder │                        │
│                    │  • State Manager  │                        │
│                    │  • Observability  │                        │
│                    └─────────┬─────────┘                        │
│                              │                                   │
├──────────────────────────────┼──────────────────────────────────┤
│                    ┌─────────▼─────────┐                        │
│                    │  OSSA Manifests   │                        │
│                    │  (Task/Workflow/  │                        │
│                    │   Agent)          │                        │
│                    └───────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

```bash
composer require ossa/drupal-adapter
drush en ossa_adapter
```

## Configuration

### Module Configuration (`ossa_adapter.settings.yml`)

```yaml
ossa_adapter:
  # Default runtime for Task execution
  default_runtime: drupal

  # Manifest discovery paths
  manifest_paths:
    - 'modules/custom/*/manifests'
    - 'config/ossa'

  # Execution engine preferences
  execution:
    task:
      engine: queue  # queue, sync, batch
      queue_name: ossa_tasks
    workflow:
      engine: maestro  # maestro, flowdrop, native
    agent:
      engine: ai_agent_runner
      fallback: queue

  # Observability
  observability:
    enabled: true
    exporter: otel
    endpoint: 'http://localhost:4317'
```

## ECA Integration

### Mapping ECA to OSSA Tasks

ECA (Event-Condition-Action) rules map naturally to OSSA Tasks with event triggers:

```yaml
# ECA Model → OSSA Task
apiVersion: ossa/v0.3.1
kind: Task
metadata:
  name: eca-node-publish
  annotations:
    drupal.ossa.io/eca-model: node_publish_notify

spec:
  execution:
    type: deterministic
    runtime: drupal
    entrypoint: 'Drupal\ossa_adapter\TaskHandler\ECAHandler::execute'

  # ECA Event → OSSA Trigger
  triggers:
    - type: event
      source: drupal.entity
      event: node.insert
      filter:
        bundle: article
        status: 1

  # ECA Conditions → OSSA Input Validation
  input:
    type: object
    properties:
      entity:
        type: object
        description: The Drupal entity
      user:
        type: object
        description: Current user context

  # ECA Actions → OSSA Capabilities
  capabilities:
    - send_email
    - create_entity
    - log_message

runtime:
  type: drupal
  bindings:
    send_email:
      plugin: 'eca_mail:send'
    create_entity:
      plugin: 'eca_content:create_entity'
    log_message:
      plugin: 'eca_log:message'
```

## Maestro Integration

### Mapping Maestro Templates to OSSA Workflows

```yaml
# Maestro Template → OSSA Workflow
apiVersion: ossa/v0.3.1
kind: Workflow
metadata:
  name: content-approval-workflow
  annotations:
    drupal.ossa.io/maestro-template: content_approval

spec:
  triggers:
    - type: event
      source: drupal.entity
      event: node.presave
      filter:
        moderation_state: review

  steps:
    - id: assign_reviewer
      kind: Task
      ref: ./tasks/assign-reviewer.yaml

    - id: notify_reviewer
      kind: Task
      ref: ./tasks/notify-user.yaml
      input:
        user_id: ${{ steps.assign_reviewer.output.reviewer_id }}
        message: "New content pending review"
      depends_on:
        - assign_reviewer

    - id: wait_approval
      kind: Task
      name: Wait for human approval
      inline:
        execution:
          type: human
          timeout_hours: 72
        input:
          type: object
          properties:
            decision:
              type: string
              enum: [approve, reject, revise]
            comments:
              type: string
      depends_on:
        - notify_reviewer

    - id: process_decision
      kind: Task
      ref: ./tasks/process-decision.yaml
      input:
        entity_id: ${{ workflow.input.entity_id }}
        decision: ${{ steps.wait_approval.output.decision }}
      depends_on:
        - wait_approval

runtime:
  type: drupal
  bindings:
    maestro:
      template_id: content_approval
      task_console: /admin/maestro
```

## FlowDrop Integration

### Mapping FlowDrop to OSSA Workflows

```yaml
# FlowDrop Diagram → OSSA Workflow
apiVersion: ossa/v0.3.1
kind: Workflow
metadata:
  name: user-registration-flow
  annotations:
    drupal.ossa.io/flowdrop-diagram: user_registration_v2

spec:
  triggers:
    - type: webhook
      path: /flowdrop/user-registration

  steps:
    - id: validate_input
      kind: Task
      name: Validate registration data
      inline:
        execution:
          type: deterministic
          runtime: drupal
          entrypoint: 'Drupal\flowdrop\NodeHandler\ValidateNode::execute'

    - id: check_duplicate
      kind: Task
      name: Check for duplicate email
      ref: ./tasks/check-duplicate-email.yaml
      depends_on:
        - validate_input

    - id: decision
      kind: Task
      name: Conditional branch
      inline:
        execution:
          type: deterministic
        output:
          type: object
          properties:
            branch:
              type: string
      input:
        condition: ${{ steps.check_duplicate.output.exists }}
      depends_on:
        - check_duplicate

    - id: create_user
      kind: Task
      ref: ./tasks/create-user.yaml
      condition: ${{ steps.decision.output.branch == 'new' }}
      depends_on:
        - decision

    - id: send_error
      kind: Task
      ref: ./tasks/send-error-response.yaml
      condition: ${{ steps.decision.output.branch == 'duplicate' }}
      depends_on:
        - decision

runtime:
  type: drupal
  bindings:
    flowdrop:
      diagram_id: user_registration_v2
      visual_editor: /admin/flowdrop/user_registration_v2
```

## AI Agent Runner Integration

### Direct OSSA Agent Mapping

```yaml
# AI Agent Runner → OSSA Agent
apiVersion: ossa/v0.3.1
kind: Agent
metadata:
  name: content-assistant
  version: 1.0.0
  annotations:
    drupal.ossa.io/ai-agent-runner: content_assistant

spec:
  model:
    provider: openai
    name: gpt-4

  system_prompt: |
    You are a content assistant for a Drupal website.
    Help users create, edit, and organize content.

  capabilities:
    - create_node
    - update_node
    - list_content
    - search_content
    - manage_taxonomy

  reasoning:
    strategy: react
    max_steps: 10

runtime:
  type: drupal
  bindings:
    create_node:
      service: '@entity_type.manager'
      method: 'getStorage("node")->create'
    update_node:
      service: '@entity_type.manager'
      method: 'getStorage("node")->save'
    list_content:
      plugin: 'ai_agent_runner:content_list'
    search_content:
      service: '@search_api.query_helper'
```

## Minikanban Integration

### Mapping Kanban Cards to OSSA Tasks

```yaml
# Minikanban Card → OSSA Task
apiVersion: ossa/v0.3.1
kind: Task
metadata:
  name: kanban-task
  annotations:
    drupal.ossa.io/minikanban-card: card_12345

spec:
  execution:
    type: human
    assignee: ${{ input.assigned_to }}
    due_date: ${{ input.due_date }}

  input:
    type: object
    properties:
      title:
        type: string
      description:
        type: string
      assigned_to:
        type: string
        format: user_id
      due_date:
        type: string
        format: date
      priority:
        type: string
        enum: [low, medium, high, critical]
      labels:
        type: array
        items:
          type: string

  output:
    type: object
    properties:
      status:
        type: string
        enum: [todo, in_progress, review, done]
      completed_at:
        type: string
        format: date-time

runtime:
  type: drupal
  bindings:
    minikanban:
      board_id: default
      status_column_map:
        todo: backlog
        in_progress: doing
        review: review
        done: done
```

## Bidirectional Sync

The adapter supports bidirectional synchronization:

### Export: Drupal → OSSA

```php
use Drupal\ossa_adapter\Exporter\OSSAExporter;

$exporter = \Drupal::service('ossa_adapter.exporter');

// Export ECA model
$manifest = $exporter->exportECA('my_eca_model');

// Export Maestro template
$manifest = $exporter->exportMaestro('content_approval');

// Export all workflows
$manifests = $exporter->exportAll(['type' => 'workflow']);
```

### Import: OSSA → Drupal

```php
use Drupal\ossa_adapter\Importer\OSSAImporter;

$importer = \Drupal::service('ossa_adapter.importer');

// Import OSSA manifest
$importer->import('/path/to/manifest.yaml', [
  'target' => 'maestro',  // maestro, eca, flowdrop
  'overwrite' => false,
]);
```

## CLI Commands

```bash
# Validate OSSA manifest
drush ossa:validate /path/to/manifest.yaml

# Export Drupal workflows to OSSA
drush ossa:export --type=workflow --output=/path/to/output

# Import OSSA manifest to Drupal
drush ossa:import /path/to/manifest.yaml --engine=maestro

# List all OSSA-compatible workflows
drush ossa:list

# Run an OSSA Task
drush ossa:run task my-task --input='{"key": "value"}'
```

## Observability

### OpenTelemetry Integration

The adapter exports traces using OSSA semantic conventions:

```php
// Automatic span creation for Task execution
$tracer->startSpan('ossa.task.execute', [
  'ossa.task.name' => 'my-task',
  'ossa.task.version' => '1.0.0',
  'drupal.execution.engine' => 'eca',
]);
```

### Metrics

```yaml
# Prometheus metrics exposed at /metrics
ossa_task_executions_total{task="my-task", status="success"} 42
ossa_task_duration_seconds{task="my-task"} 0.123
ossa_workflow_steps_completed{workflow="content-approval"} 156
```

## Error Handling

```yaml
spec:
  error_handling:
    on_error: retry
    retry:
      max_attempts: 3
      backoff_strategy: exponential

    # Drupal-specific error mapping
    error_codes:
      ENTITY_VALIDATION_FAILED:
        drupal_exception: 'EntityStorageException'
        retryable: false
      PERMISSION_DENIED:
        drupal_exception: 'AccessDeniedHttpException'
        retryable: false
      DATABASE_ERROR:
        drupal_exception: 'DatabaseExceptionWrapper'
        retryable: true
```

## Migration Guide

### From ECA to OSSA

1. Export existing ECA models: `drush ossa:export --engine=eca`
2. Review generated manifests
3. Test execution: `drush ossa:run task exported-eca-task`
4. Optionally disable original ECA model

### From Maestro to OSSA

1. Export Maestro template: `drush ossa:export --engine=maestro --template=my_template`
2. Map human tasks to OSSA `execution.type: human`
3. Configure queue integration
4. Test workflow: `drush ossa:run workflow exported-maestro-workflow`

## OSSA Compliance

This adapter implements OSSA v0.3.1 specification:

- ✅ Task execution with deterministic semantics
- ✅ Workflow orchestration with step dependencies
- ✅ Agent execution with LLM integration
- ✅ Capability abstraction and runtime bindings
- ✅ OpenTelemetry observability
- ✅ Error handling with retry strategies
- ✅ Input/output schema validation

## Related

- [OSSA Specification v0.3.1](../README.md)
- [Symfony Adapter](./symfony.md)
- [Node.js Adapter](./nodejs.md)
- [Capability Registry](../capability-schema.md)
