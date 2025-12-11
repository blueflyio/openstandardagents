---
title: "Multi-Agent Workflows"
description: "Architecture patterns for composing multiple agents into workflows"
weight: 15
---

# Multi-Agent Workflows

OSSA Workflow kind enables sophisticated multi-agent composition patterns for complex AI systems.

## Overview

Multi-agent workflows allow you to:
- **Coordinate multiple specialized agents** for complex tasks
- **Manage dependencies** between agent executions
- **Handle failures** gracefully with compensation
- **Scale horizontally** with parallel execution
- **Maintain state** across agent interactions

## Architecture Patterns

### Pattern 1: Sequential Pipeline

Agents execute one after another, passing data between them:

```yaml
apiVersion: ossa/v0.3.1
kind: Workflow
metadata:
  name: sequential-pipeline
spec:
  steps:
    - id: research
      kind: Agent
      ref: research-agent
      output:
        to: research_data
    
    - id: analyze
      kind: Agent
      ref: analysis-agent
      depends_on:
        - research
      input:
        data: "${research_data}"
      output:
        to: analysis_results
    
    - id: generate
      kind: Agent
      ref: generation-agent
      depends_on:
        - analyze
      input:
        analysis: "${analysis_results}"
```

**Use cases:**
- Data processing pipelines
- Content generation workflows
- Analysis chains

### Pattern 2: Parallel Scatter-Gather

Execute multiple agents in parallel, then aggregate results:

```yaml
apiVersion: ossa/v0.3.1
kind: Workflow
metadata:
  name: scatter-gather
spec:
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
      output:
        to: parallel_results
    
    - id: synthesize
      kind: Agent
      ref: synthesizer-agent
      depends_on:
        - parallel-analysis
      input:
        results: "${parallel_results}"
```

**Use cases:**
- Multi-perspective analysis
- Competitive research
- Performance optimization

### Pattern 3: Coordinator Pattern

A coordinator agent delegates to specialized worker agents:

```yaml
apiVersion: ossa/v0.3.1
kind: Workflow
metadata:
  name: coordinator-pattern
spec:
  steps:
    - id: coordinator
      kind: Agent
      ref: coordinator-agent
      input:
        task: "${input.task}"
      output:
        to: delegation_plan
    
    - id: execute-workers
      kind: Conditional
      depends_on:
        - coordinator
      branches:
        - condition: "${delegation_plan.requires_billing}"
          steps:
            - id: billing-worker
              kind: Agent
              ref: billing-agent
        - condition: "${delegation_plan.requires_technical}"
          steps:
            - id: technical-worker
              kind: Agent
              ref: technical-agent
    
    - id: aggregate
      kind: Agent
      ref: aggregator-agent
      depends_on:
        - execute-workers
```

**Use cases:**
- Customer support routing
- Task delegation systems
- Intelligent request handling

### Pattern 4: Dispatcher Pattern

Route requests to appropriate agents based on rules:

```yaml
apiVersion: ossa/v0.3.1
kind: Workflow
metadata:
  name: dispatcher-pattern
spec:
  steps:
    - id: route
      kind: Conditional
      branches:
        - condition: "${input.type} === 'billing'"
          steps:
            - id: billing-handler
              kind: Agent
              ref: billing-agent
        - condition: "${input.type} === 'technical'"
          steps:
            - id: technical-handler
              kind: Agent
              ref: technical-agent
        - condition: "${input.type} === 'product'"
          steps:
            - id: product-handler
              kind: Agent
              ref: product-agent
      else:
        - id: default-handler
          kind: Agent
          ref: default-agent
```

**Use cases:**
- Request routing
- Content classification
- Load balancing

### Pattern 5: Saga Pattern

Distributed transaction with compensation:

```yaml
apiVersion: ossa/v0.3.1
kind: Workflow
metadata:
  name: saga-pattern
spec:
  steps:
    - id: step1
      kind: Task
      ref: reserve-resource
    
    - id: step2
      kind: Task
      ref: process-payment
      depends_on:
        - step1
    
    - id: step3
      kind: Task
      ref: confirm-order
      depends_on:
        - step2
  
  error_handling:
    on_failure: compensate
    compensation_steps:
      - id: compensate-step3
        kind: Task
        ref: cancel-order
      - id: compensate-step2
        kind: Task
        ref: refund-payment
      - id: compensate-step1
        kind: Task
        ref: release-resource
```

**Use cases:**
- Distributed transactions
- Order processing
- Resource management

### Pattern 6: Fan-Out Fan-In

Distribute work to multiple agents, then collect results:

```yaml
apiVersion: ossa/v0.3.1
kind: Workflow
metadata:
  name: fan-out-fan-in
spec:
  steps:
    - id: prepare-work
      kind: Task
      ref: prepare-task
      output:
        to: work_items
    
    - id: distribute
      kind: Loop
      loop:
        over: "${work_items}"
        as: item
      # Each iteration processes one item
    
    - id: collect-results
      kind: Agent
      ref: collector-agent
      depends_on:
        - distribute
      input:
        results: "${distribute.results}"
```

**Use cases:**
- Batch processing
- Map-reduce operations
- Parallel data transformation

## State Management

Workflows maintain state between steps. Access state using `${variable}` syntax:

```yaml
steps:
  - id: step1
    kind: Agent
    ref: agent1
    output:
      to: result1  # Saved to state as "result1"
  
  - id: step2
    kind: Agent
    ref: agent2
    input:
      previous: "${result1}"  # Access state variable
      config: "${input.config}"  # Access workflow input
```

## Error Handling Strategies

### Halt on Error

Stop execution immediately:

```yaml
error_handling:
  on_failure: halt
```

### Continue on Error

Skip failed steps and continue:

```yaml
error_handling:
  on_failure: continue
```

### Rollback on Error

Undo completed steps:

```yaml
error_handling:
  on_failure: rollback
  compensation_steps:
    - id: cleanup
      kind: Task
      ref: cleanup-task
```

### Notify on Error

Send notifications but continue:

```yaml
error_handling:
  on_failure: notify
  notification:
    channels:
      - email
      - slack
```

### Compensate on Error

Execute compensation steps:

```yaml
error_handling:
  on_failure: compensate
  compensation_steps:
    - id: undo-action
      kind: Task
      ref: undo-task
```

## Best Practices

### 1. Use Descriptive Step IDs

```yaml
# Good
- id: analyze-code-quality
- id: generate-test-report

# Bad
- id: step1
- id: step2
```

### 2. Define Clear Dependencies

```yaml
steps:
  - id: step2
    depends_on:
      - step1  # Explicit dependency
```

### 3. Handle Errors Appropriately

```yaml
error_handling:
  on_failure: rollback  # Use rollback for transactions
  retry_policy:
    max_attempts: 3
    backoff: exponential
```

### 4. Use Parallel Execution When Possible

```yaml
steps:
  - id: parallel-work
    kind: Parallel
    parallel:
      - id: task1
      - id: task2
      - id: task3
```

### 5. Validate Workflows

Always validate workflows before deployment:

```bash
buildkit workflow validate workflow.yaml
```

## Migration from Single Agents

### Before: Single Agent

```yaml
apiVersion: ossa/v0.3.1
kind: Agent
metadata:
  name: code-reviewer
spec:
  role: Review code comprehensively
  # All logic in one agent
```

### After: Workflow Composition

```yaml
apiVersion: ossa/v0.3.1
kind: Workflow
metadata:
  name: code-review-workflow
spec:
  steps:
    - id: analyze-code
      kind: Agent
      ref: code-analyzer-agent
    - id: check-style
      kind: Agent
      ref: style-checker-agent
    - id: security-audit
      kind: Agent
      ref: security-auditor-agent
```

## Related Documentation

- [Workflow Specification](../schema-reference/workflow-spec.md)
- [Workflow Examples](../examples/workflow-examples.md)
- [Agent Specification](../schema-reference/agent-spec.md)
