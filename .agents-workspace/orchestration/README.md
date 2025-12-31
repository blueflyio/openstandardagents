# OSSA Orchestration

Framework-agnostic coordination descriptors for multi-agent workflows.

## Purpose

This directory contains workflow definitions that coordinate multiple agents.
These are runtime-agnostic - they describe WHAT should happen, not HOW.

## Structure

```
orchestration/
├── README.md              # This file
├── code-review.yaml       # Code review workflow
├── release.yaml           # Release workflow
└── security-audit.yaml    # Security audit workflow
```

## Workflow Schema

```yaml
apiVersion: ossa.dev/v1
kind: Workflow
metadata:
  name: my-workflow
  version: "1.0.0"

spec:
  # Agent references (from registry)
  agents:
    - ref: code-reviewer
      alias: reviewer
    - ref: security-scanner
      alias: security

  # Execution steps
  steps:
    - id: review
      agent: reviewer
      input:
        source: ${input.files}

    - id: scan
      agent: security
      depends_on: [review]
      condition: review.status == "approved"

  # State management
  state:
    persistence: redis
    ttl: 86400
```

## Runtime Mapping

| OSSA Workflow | LangChain | CrewAI | OpenAI |
|---------------|-----------|--------|--------|
| `steps` | `Chain` | `Process` | `Function` |
| `depends_on` | `Sequential` | `hierarchical` | `parallel` |
| `condition` | `Router` | `conditional` | `if-else` |

## Best Practices

1. Keep workflows simple (5-7 steps max)
2. Use explicit dependencies
3. Define clear success/failure conditions
4. Include timeout handling
5. Log all state transitions
