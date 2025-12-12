---
title: "Workflow Specification"
description: "OSSA Workflow kind for multi-agent composition"
weight: 5
---

# Workflow Specification

The `Workflow` kind enables composition of multiple agents and tasks into complex, multi-step workflows with dependency management, conditional execution, and error handling.

## Overview

Workflows allow you to:
- **Compose multiple agents** into coordinated workflows
- **Define execution order** with dependencies
- **Handle errors** with retry policies and compensation
- **Execute steps conditionally** based on state
- **Run steps in parallel** for performance
- **Manage state** between steps

## Manifest Structure

```yaml
apiVersion: ossa/v0.2.9
kind: Workflow
metadata:
  name: my-workflow
  version: 1.0.0
  description: Multi-agent workflow example
spec:
  steps:
    - id: step1
      kind: Agent
      ref: my-agent
      input:
        query: "Hello"
  triggers:
    - type: webhook
      path: /trigger
```

## Field Reference

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `apiVersion` | string | **Yes** | OSSA API version. Must be `ossa/v0.3.1` or higher for Workflow support |
| `kind` | string | **Yes** | Must be `Workflow` |
| `metadata` | [Metadata](#metadata-object) | **Yes** | Workflow metadata |
| `spec` | [WorkflowSpec](#workflowspec-object) | **Yes** | Workflow specification |

## WorkflowSpec Object

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `steps` | array | **Yes** | Array of workflow steps (min 1) |
| `triggers` | array | No | Workflow triggers (webhook, cron, event, manual, message) |
| `inputs` | object | No | Input schema (JSON Schema) |
| `outputs` | object | No | Output schema (JSON Schema) |
| `messaging` | object | No | Agent-to-agent messaging configuration (v0.3.1+) |
| `context` | object | No | Context variables and secrets |
| `concurrency` | object | No | Concurrency control settings |
| `error_handling` | object | No | Error handling configuration |
| `timeout_seconds` | integer | No | Workflow timeout (1-86400) |
| `observability` | object | No | Tracing, metrics, and logging configuration |

## WorkflowStep Object

Each step in a workflow can be one of several kinds:

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `id` | string | **Yes** | Unique step identifier (pattern: `^[a-z][a-z0-9_-]*$`) |
| `kind` | string | **Yes** | Step type: `Task`, `Agent`, `Parallel`, `Conditional`, `Loop` |
| `name` | string | No | Human-readable step name |
| `ref` | string | No | Reference to Agent or Task manifest |
| `inline` | object | No | Inline step definition |
| `input` | object | No | Step input (supports `${variable}` substitution) |
| `output` | object | No | Output configuration |
| `condition` | string | No | Conditional expression (evaluated against workflow state) |
| `depends_on` | array | No | Array of step IDs that must complete before this step |
| `parallel` | array | No | Parallel steps (for `kind: Parallel`) |
| `branches` | array | No | Conditional branches (for `kind: Conditional`) |
| `else` | array | No | Else branch steps (for `kind: Conditional`) |
| `loop` | object | No | Loop configuration (for `kind: Loop`) |

## Step Kinds

### Task Step

Execute a deterministic task (non-agentic):

```yaml
steps:
  - id: publish-content
    kind: Task
    ref: publish-task
    input:
      content_id: "${content.id}"
```

### Agent Step

Invoke an agent:

```yaml
steps:
  - id: analyze-data
    kind: Agent
    ref: data-analyst-agent
    input:
      dataset: "${input.dataset}"
    output:
      to: analysis_results
```

### Parallel Step

Execute multiple steps concurrently:

```yaml
steps:
  - id: parallel-analysis
    kind: Parallel
    parallel:
      - id: analyze-code
        kind: Agent
        ref: code-analyzer
      - id: analyze-tests
        kind: Agent
        ref: test-analyzer
      - id: analyze-docs
        kind: Agent
        ref: doc-analyzer
```

### Conditional Step

Execute steps based on conditions:

```yaml
steps:
  - id: conditional-review
    kind: Conditional
    condition: "${severity} === 'high'"
    branches:
      - condition: "${severity} === 'critical'"
        steps:
          - id: escalate
            kind: Agent
            ref: escalation-agent
      - condition: "${severity} === 'high'"
        steps:
          - id: review
            kind: Agent
            ref: review-agent
    else:
      - id: log
        kind: Task
        ref: log-task
```

### Loop Step

Iterate over a collection:

```yaml
steps:
  - id: process-items
    kind: Loop
    loop:
      over: "${items}"
      as: item
      index: idx
    # Loop body steps would be defined here
```

## Triggers

Workflows can be triggered by:

### Webhook Trigger

```yaml
triggers:
  - type: webhook
    path: /workflow/trigger
    filter:
      method: POST
```

### Cron Trigger

```yaml
triggers:
  - type: cron
    schedule: "0 0 * * *"  # Daily at midnight
```

### Event Trigger

```yaml
triggers:
  - type: event
    source: gitlab
    event: merge_request.created
```

### Manual Trigger

```yaml
triggers:
  - type: manual
```

### Message Trigger (v0.3.1+)

```yaml
triggers:
  - type: message
    channel: workflow-events
    filter:
      type: workflow.start
```

## Error Handling

Configure how workflows handle errors:

```yaml
spec:
  error_handling:
    on_failure: rollback  # halt, continue, rollback, notify, compensate
    retry_policy:
      max_attempts: 3
      backoff: exponential
      initial_delay_ms: 1000
      max_delay_ms: 60000
    compensation_steps:
      - id: cleanup
        kind: Task
        ref: cleanup-task
    notification:
      channels:
        - email
        - slack
      template: "Workflow ${executionId} failed: ${error}"
```

## State Management

Workflow state is managed automatically between steps. Access state using `${variable}` syntax:

```yaml
steps:
  - id: step1
    kind: Agent
    ref: agent1
    output:
      to: result1
  - id: step2
    kind: Agent
    ref: agent2
    input:
      previous_result: "${result1}"
```

## Concurrency Control

Limit concurrent executions:

```yaml
spec:
  concurrency:
    group: workflow-group-1
    cancel_in_progress: false
```

## Observability

Enable tracing, metrics, and logging:

```yaml
spec:
  observability:
    tracing:
      enabled: true
      propagate_context: true
    metrics:
      enabled: true
      custom_labels:
        team: engineering
    logging:
      level: info
```

## Examples

See [Workflow Examples](./workflow-examples.md) for complete examples.

## Related Documentation

- [Workflow Examples](./workflow-examples.md)
- [Multi-Agent Workflows](./multi-agent-workflows.md)
- [Agent Specification](./agent-spec.md)
- [Task Specification](../task-spec.md)
