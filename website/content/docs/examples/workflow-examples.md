---
title: "Workflow Examples"
description: "Complete examples of OSSA Workflow manifests"
weight: 10
---

# Workflow Examples

Complete, validated examples of OSSA Workflow manifests demonstrating multi-agent composition patterns.

## Example 1: Simple Sequential Workflow

Execute agents in sequence:

```yaml
apiVersion: ossa/v0.2.9
kind: Workflow
metadata:
  name: code-review-workflow
  version: 1.0.0
  description: Multi-agent code review workflow
spec:
  steps:
    - id: analyze-code
      kind: Agent
      ref: code-analyzer-agent
      input:
        code: "${input.code}"
      output:
        to: analysis_results
    
    - id: check-style
      kind: Agent
      ref: style-checker-agent
      depends_on:
        - analyze-code
      input:
        code: "${input.code}"
        analysis: "${analysis_results}"
      output:
        to: style_report
    
    - id: security-audit
      kind: Agent
      ref: security-auditor-agent
      depends_on:
        - analyze-code
      input:
        code: "${input.code}"
        analysis: "${analysis_results}"
      output:
        to: security_audit
    
    - id: aggregate-results
      kind: Task
      ref: aggregate-task
      depends_on:
        - check-style
        - security-audit
      input:
        analysis: "${analysis_results}"
        style: "${style_report}"
        security: "${security_audit}"
      output:
        to: final_review
  
  triggers:
    - type: webhook
      path: /review
```

## Example 2: Parallel Execution

Execute multiple agents in parallel:

```yaml
apiVersion: ossa/v0.2.9
kind: Workflow
metadata:
  name: parallel-analysis-workflow
  version: 1.0.0
spec:
  steps:
    - id: parallel-analysis
      kind: Parallel
      parallel:
        - id: analyze-code
          kind: Agent
          ref: code-analyzer
          input:
            code: "${input.code}"
        - id: analyze-tests
          kind: Agent
          ref: test-analyzer
          input:
            tests: "${input.tests}"
        - id: analyze-docs
          kind: Agent
          ref: doc-analyzer
          input:
            docs: "${input.docs}"
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

## Example 3: Conditional Execution

Execute steps based on conditions:

```yaml
apiVersion: ossa/v0.2.9
kind: Workflow
metadata:
  name: conditional-review-workflow
  version: 1.0.0
spec:
  steps:
    - id: initial-analysis
      kind: Agent
      ref: analyzer-agent
      input:
        code: "${input.code}"
      output:
        to: analysis
    
    - id: conditional-review
      kind: Conditional
      depends_on:
        - initial-analysis
      condition: "${analysis.severity} !== 'low'"
      branches:
        - condition: "${analysis.severity} === 'critical'"
          steps:
            - id: escalate
              kind: Agent
              ref: escalation-agent
              input:
                issue: "${analysis}"
        - condition: "${analysis.severity} === 'high'"
          steps:
            - id: review
              kind: Agent
              ref: review-agent
              input:
                issue: "${analysis}"
      else:
        - id: log
          kind: Task
          ref: log-task
          input:
            message: "Low severity, logging only"
```

## Example 4: Loop Execution

Process items in a collection:

```yaml
apiVersion: ossa/v0.2.9
kind: Workflow
metadata:
  name: batch-processing-workflow
  version: 1.0.0
spec:
  steps:
    - id: fetch-items
      kind: Task
      ref: fetch-task
      input:
        query: "${input.query}"
      output:
        to: items
    
    - id: process-items
      kind: Loop
      depends_on:
        - fetch-items
      loop:
        over: "${items}"
        as: item
        index: idx
      # Note: Loop body steps would be defined in the step itself
      # This is a simplified example
```

## Example 5: Error Handling with Compensation

Workflow with error handling and rollback:

```yaml
apiVersion: ossa/v0.2.9
kind: Workflow
metadata:
  name: transaction-workflow
  version: 1.0.0
spec:
  steps:
    - id: reserve-resource
      kind: Task
      ref: reserve-task
      input:
        resource_id: "${input.resource_id}"
    
    - id: process-payment
      kind: Task
      ref: payment-task
      depends_on:
        - reserve-resource
      input:
        amount: "${input.amount}"
    
    - id: confirm-order
      kind: Task
      ref: confirm-task
      depends_on:
        - process-payment
  
  error_handling:
    on_failure: rollback
    compensation_steps:
      - id: release-resource
        kind: Task
        ref: release-task
        input:
          resource_id: "${input.resource_id}"
      - id: refund-payment
        kind: Task
        ref: refund-task
        input:
          payment_id: "${process-payment.payment_id}"
    retry_policy:
      max_attempts: 3
      backoff: exponential
      initial_delay_ms: 1000
```

## Example 6: Multi-Agent Customer Support

Complex multi-agent workflow:

```yaml
apiVersion: ossa/v0.2.9
kind: Workflow
metadata:
  name: customer-support-workflow
  version: 1.0.0
spec:
  steps:
    - id: route-request
      kind: Agent
      ref: router-agent
      input:
        request: "${input.request}"
      output:
        to: routing_decision
    
    - id: handle-request
      kind: Conditional
      depends_on:
        - route-request
      branches:
        - condition: "${routing_decision.type} === 'billing'"
          steps:
            - id: billing-specialist
              kind: Agent
              ref: billing-agent
              input:
                request: "${input.request}"
        - condition: "${routing_decision.type} === 'technical'"
          steps:
            - id: technical-specialist
              kind: Agent
              ref: technical-agent
              input:
                request: "${input.request}"
        - condition: "${routing_decision.type} === 'product'"
          steps:
            - id: product-specialist
              kind: Agent
              ref: product-agent
              input:
                request: "${input.request}"
    
    - id: synthesize-response
      kind: Agent
      ref: synthesizer-agent
      depends_on:
        - handle-request
      input:
        responses: "${handle-request.results}"
  
  triggers:
    - type: webhook
      path: /support
```

## Example 7: Scheduled Workflow

Workflow triggered by cron:

```yaml
apiVersion: ossa/v0.2.9
kind: Workflow
metadata:
  name: daily-report-workflow
  version: 1.0.0
spec:
  steps:
    - id: collect-metrics
      kind: Task
      ref: metrics-collector
    
    - id: generate-report
      kind: Agent
      ref: report-generator-agent
      depends_on:
        - collect-metrics
      input:
        metrics: "${collect-metrics.metrics}"
    
    - id: send-report
      kind: Task
      ref: email-sender-task
      depends_on:
        - generate-report
      input:
        report: "${generate-report.report}"
  
  triggers:
    - type: cron
      schedule: "0 9 * * *"  # Daily at 9 AM
  
  error_handling:
    on_failure: notify
    notification:
      channels:
        - email
        - slack
```

## Example 8: Event-Driven Workflow

Workflow triggered by events:

```yaml
apiVersion: ossa/v0.2.9
kind: Workflow
metadata:
  name: gitlab-mr-workflow
  version: 1.0.0
spec:
  steps:
    - id: validate-mr
      kind: Agent
      ref: mr-validator-agent
      input:
        mr_data: "${trigger.event.data}"
    
    - id: run-tests
      kind: Task
      ref: test-runner-task
      depends_on:
        - validate-mr
      input:
        branch: "${trigger.event.data.branch}"
    
    - id: update-status
      kind: Task
      ref: status-updater-task
      depends_on:
        - run-tests
      input:
        status: "${run-tests.status}"
  
  triggers:
    - type: event
      source: gitlab
      event: merge_request.created
```

## Validation

Validate workflows using the OSSA CLI:

```bash
# Validate a workflow manifest
ossa validate workflow.yaml --kind workflow

# Or using buildkit
buildkit workflow validate workflow.yaml
```

## Execution

Execute workflows using buildkit:

```bash
# Execute a workflow
buildkit workflow execute workflow.yaml --input data.json

# Execute with output
buildkit workflow execute workflow.yaml --input data.json --output result.json

# Watch execution in real-time
buildkit workflow execute workflow.yaml --watch
```

## Related Documentation

- [Workflow Specification](../schema-reference/workflow-spec.md)
- [Multi-Agent Workflows](../architecture/multi-agent-workflows.md)
- [Agent Specification](../schema-reference/agent-spec.md)
