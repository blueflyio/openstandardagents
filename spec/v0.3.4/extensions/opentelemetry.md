# OpenTelemetry Extension for OSSA v0.3.4

## Overview

The `extensions.opentelemetry` schema formalizes integration with OpenTelemetry (OTel) - the industry standard for observability. This extension enables OSSA agents to emit traces, metrics, and logs that work with **all** observability platforms:

- **LangSmith** (LangChain observability)
- **Phoenix/Arize** (LLM observability)
- **Langfuse** (LLM observability)
- **Traceloop** (LLM tracing)
- **Helicone** (LLM proxy/observability)
- **Datadog**, **New Relic**, **Honeycomb**, **Grafana Cloud**, etc.

OpenTelemetry is the **standard** - all modern observability tools support it.

## Schema Definition

```yaml
extensions:
  opentelemetry:
    type: object
    description: "OpenTelemetry observability integration"
    required:
      - enabled
    properties:
      enabled:
        type: boolean
        description: "Enable OpenTelemetry instrumentation"
        default: true

      service_name:
        type: string
        description: "Service name for OTel resource"
        default: "${{ metadata.name }}"

      service_version:
        type: string
        description: "Service version"
        default: "${{ metadata.version }}"

      traces:
        type: object
        description: "Distributed tracing configuration"
        properties:
          enabled:
            type: boolean
            default: true
          exporter:
            type: string
            enum: [otlp, jaeger, zipkin, console, none]
            default: otlp
          endpoint:
            type: string
            format: uri
            description: "OTLP endpoint (gRPC or HTTP)"
            examples:
              - "http://localhost:4317"  # gRPC
              - "http://localhost:4318"  # HTTP
              - "https://api.langsmith.com/traces"  # LangSmith
              - "https://phoenix.arize.com/otel"  # Phoenix
          headers:
            type: object
            additionalProperties:
              type: string
            description: "Custom headers (e.g., API keys)"
            examples:
              - "x-api-key": "langsmith-xxx"
              - "Authorization": "Bearer phoenix-xxx"
          sample_rate:
            type: number
            minimum: 0
            maximum: 1
            default: 1.0
            description: "Sampling rate (1.0 = 100%)"

      metrics:
        type: object
        description: "Metrics collection configuration"
        properties:
          enabled:
            type: boolean
            default: true
          exporter:
            type: string
            enum: [otlp, prometheus, console, none]
            default: otlp
          endpoint:
            type: string
            format: uri
            description: "Metrics endpoint"
          headers:
            type: object
            additionalProperties:
              type: string
          collection_interval_seconds:
            type: integer
            minimum: 1
            default: 60

      logs:
        type: object
        description: "Structured logging configuration"
        properties:
          enabled:
            type: boolean
            default: true
          exporter:
            type: string
            enum: [otlp, console, json, none]
            default: otlp
          endpoint:
            type: string
            format: uri
          level:
            type: string
            enum: [trace, debug, info, warn, error, fatal]
            default: info

      resource_attributes:
        type: object
        additionalProperties:
          type: string
        description: "Custom resource attributes"
        examples:
          - "deployment.environment": "production"
          - "service.namespace": "ai-agents"
          - "agent.framework": "langchain"

      instrumentation:
        type: object
        description: "Auto-instrumentation configuration"
        properties:
          http:
            type: boolean
            default: true
            description: "HTTP client/server instrumentation"
          express:
            type: boolean
            default: true
            description: "Express.js instrumentation"
          grpc:
            type: boolean
            default: false
            description: "gRPC instrumentation"
          redis:
            type: boolean
            default: false
            description: "Redis instrumentation"
          postgres:
            type: boolean
            default: false
            description: "PostgreSQL instrumentation"

      span_attributes:
        type: object
        description: "Custom span attributes for all spans"
        additionalProperties:
          type: string
        examples:
          - "agent.id": "${{ metadata.name }}"
          - "agent.version": "${{ metadata.version }}"
          - "framework": "langchain"

      langsmith:
        type: object
        description: "LangSmith-specific configuration (uses OTel)"
        properties:
          enabled:
            type: boolean
            default: false
          api_key_env:
            type: string
            default: "LANGSMITH_API_KEY"
          project_name:
            type: string
            description: "LangSmith project name"
          endpoint:
            type: string
            format: uri
            default: "https://api.smith.langchain.com"

      phoenix:
        type: object
        description: "Phoenix/Arize-specific configuration (uses OTel)"
        properties:
          enabled:
            type: boolean
            default: false
          api_key_env:
            type: string
            default: "PHOENIX_API_KEY"
          endpoint:
            type: string
            format: uri
            default: "https://phoenix.arize.com"

      langfuse:
        type: object
        description: "Langfuse-specific configuration (uses OTel)"
        properties:
          enabled:
            type: boolean
            default: false
          public_key_env:
            type: string
            default: "LANGFUSE_PUBLIC_KEY"
          secret_key_env:
            type: string
            default: "LANGFUSE_SECRET_KEY"
          endpoint:
            type: string
            format: uri
            default: "https://cloud.langfuse.com"
```

## Standard Metrics

OSSA agents automatically emit these standard metrics:

### Agent Execution Metrics

- `agent.executions.total{agent_id, status}` - Counter
- `agent.execution.duration_ms{agent_id, quantile}` - Histogram
- `agent.llm.tokens.used{agent_id, model, type}` - Counter
- `agent.llm.calls.total{agent_id, model, status}` - Counter
- `agent.tool.calls.total{agent_id, tool_name, status}` - Counter
- `agent.errors.total{agent_id, error_type}` - Counter

### Cost Metrics

- `agent.cost.total_usd{agent_id, provider}` - Counter
- `agent.cost.per_execution_usd{agent_id}` - Histogram

### Compliance Metrics

- `agent.compliance.score{agent_id, framework}` - Gauge
- `agent.violations.total{agent_id, severity}` - Counter

## Standard Spans

OSSA agents create these standard spans:

1. **agent.execution** - Root span for agent execution
2. **llm.call** - LLM API call (nested under agent.execution)
3. **tool.invoke** - Tool invocation (nested under agent.execution)
4. **agent.message** - Agent-to-agent message (nested under agent.execution)

## Example Manifest

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: observability-enabled-agent
  version: 1.0.0

spec:
  role: "You are a helpful assistant"
  llm:
    provider: openai
    model: gpt-4

extensions:
  opentelemetry:
    enabled: true
    service_name: "my-agent"
    service_version: "1.0.0"
    
    traces:
      enabled: true
      exporter: otlp
      endpoint: "http://localhost:4317"
      sample_rate: 1.0
      headers:
        "x-api-key": "${LANGSMITH_API_KEY}"
    
    metrics:
      enabled: true
      exporter: otlp
      endpoint: "http://localhost:4317"
      collection_interval_seconds: 60
    
    logs:
      enabled: true
      exporter: otlp
      endpoint: "http://localhost:4317"
      level: info
    
    resource_attributes:
      "deployment.environment": "production"
      "agent.framework": "langchain"
    
    langsmith:
      enabled: true
      api_key_env: "LANGSMITH_API_KEY"
      project_name: "my-project"
    
    instrumentation:
      http: true
      express: true
      redis: false
      postgres: false
```

## Integration with Observability Platforms

### LangSmith (LangChain)

```yaml
extensions:
  opentelemetry:
    enabled: true
    traces:
      exporter: otlp
      endpoint: "https://api.smith.langchain.com"
      headers:
        "x-api-key": "${LANGSMITH_API_KEY}"
    langsmith:
      enabled: true
      project_name: "my-langchain-project"
```

### Phoenix/Arize

```yaml
extensions:
  opentelemetry:
    enabled: true
    traces:
      exporter: otlp
      endpoint: "https://phoenix.arize.com/otel"
      headers:
        "Authorization": "Bearer ${PHOENIX_API_KEY}"
    phoenix:
      enabled: true
```

### Langfuse

```yaml
extensions:
  opentelemetry:
    enabled: true
    traces:
      exporter: otlp
      endpoint: "https://cloud.langfuse.com/otel"
      headers:
        "x-langfuse-public-key": "${LANGFUSE_PUBLIC_KEY}"
        "x-langfuse-secret-key": "${LANGFUSE_SECRET_KEY}"
    langfuse:
      enabled: true
```

## Implementation Notes

- All observability platforms use OpenTelemetry under the hood
- OTel is the standard - one implementation works with all platforms
- Spans are automatically created for LLM calls, tool invocations, etc.
- Metrics are automatically collected and exported
- Logs are structured and correlated with traces
