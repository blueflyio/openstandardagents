---
title: "Environment Variables"
description: "OSSA environment variables for agent configuration and runtime settings"
---

# Environment Variables

OSSA agents support runtime configuration through environment variables.

## LLM Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | LLM provider (anthropic, openai, google) | anthropic |
| `LLM_MODEL` | Model name | claude-sonnet-4-20250514 |
| `LLM_TEMPERATURE` | Response temperature (0.0-2.0) | 0.1 |
| `LLM_MAX_TOKENS` | Maximum output tokens | 16000 |
| `LLM_PROFILE` | Execution profile (fast, balanced, deep, safe) | balanced |

## Agent Runtime

| Variable | Description | Default |
|----------|-------------|---------|
| `AGENT_RUNTIME` | Runtime type | unified |
| `AGENT_TIMEOUT` | Execution timeout (seconds) | 600 |
| `AGENT_MAX_CONCURRENT` | Max concurrent operations | 5 |
| `AGENT_PRIORITY` | Scheduling priority | medium |

## Memory Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `MEMORY_PROVIDER` | Memory backend | redis |
| `MEMORY_NAMESPACE` | Namespace prefix | ossa |
| `MEMORY_TTL_SECONDS` | Default TTL | 3600 |

## Observability

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry endpoint | - |
| `LOG_LEVEL` | Logging level | info |
| `METRICS_ENABLED` | Enable metrics | true |

## Usage in Manifests

```yaml
apiVersion: ossa/v0.3.2
kind: Agent

spec:
  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4-20250514}
    temperature: ${LLM_TEMPERATURE:-0.1}
    profile: ${LLM_PROFILE:-balanced}

  runtime:
    timeout_seconds: ${AGENT_TIMEOUT:-600}
    max_concurrent: ${AGENT_MAX_CONCURRENT:-5}
```

## Related Documentation

- [LLM Providers](/docs/configuration/llm-providers)
- [Execution Profiles](/docs/runtime/execution-profiles)
- [Memory Model](/docs/runtime/memory-model)
