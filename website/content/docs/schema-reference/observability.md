---
title: "Observability"
description: "Tracing, metrics, and logging configuration for agent monitoring"
weight: 8
---

# Observability Object

The `observability` object in `spec.observability` configures distributed tracing, metrics collection, and logging for agent monitoring and debugging.

## Field Reference

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `tracing` | [Tracing](#tracing-configuration) | No | Distributed tracing configuration |
| `metrics` | [Metrics](#metrics-configuration) | No | Metrics collection and export configuration |
| `logging` | [Logging](#logging-configuration) | No | Logging level and format |

## Tracing Configuration

Distributed tracing captures agent execution flow across LLM calls, tool invocations, and system interactions.

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `enabled` | boolean | No | Enable distributed tracing. Default: `true` |
| `exporter` | string (enum) | No | Trace exporter: `otlp`, `jaeger`, `zipkin`, or `custom` |
| `endpoint` | string (URI) | No | Trace collector endpoint |

### Supported Exporters

#### OpenTelemetry (OTLP)

```yaml
observability:
  tracing:
    enabled: true
    exporter: otlp
    endpoint: https://otel-collector.example.com:4317
```

**OTLP is recommended** - Standard protocol supported by major observability platforms:
- Grafana Cloud
- Honeycomb
- New Relic
- Datadog
- AWS X-Ray
- Google Cloud Trace

#### Jaeger

```yaml
observability:
  tracing:
    enabled: true
    exporter: jaeger
    endpoint: http://jaeger-collector.example.com:14268/api/traces
```

**Use for:**
- Self-hosted Jaeger deployments
- Existing Jaeger infrastructure
- Local development (Jaeger all-in-one)

#### Zipkin

```yaml
observability:
  tracing:
    enabled: true
    exporter: zipkin
    endpoint: http://zipkin.example.com:9411/api/v2/spans
```

**Use for:**
- Legacy Zipkin deployments
- Compatibility with Zipkin-based tools

#### Custom Exporter

```yaml
observability:
  tracing:
    enabled: true
    exporter: custom
    endpoint: https://custom-trace-collector.example.com
```

Platform-specific configuration:
```yaml
extensions:
  observability:
    tracing:
      custom_headers:
        Authorization: Bearer SECRET_REF_TRACE_TOKEN
      sampling_rate: 0.1
```

### Tracing Examples

**Production (OTLP to Grafana Cloud):**
```yaml
observability:
  tracing:
    enabled: true
    exporter: otlp
    endpoint: https://otlp-gateway-prod-us-central-0.grafana.net/otlp
```

**Development (Local Jaeger):**
```yaml
observability:
  tracing:
    enabled: true
    exporter: jaeger
    endpoint: http://localhost:14268/api/traces
```

**Disabled (Testing):**
```yaml
observability:
  tracing:
    enabled: false
```

## Metrics Configuration

Metrics provide quantitative data about agent performance, usage, and health.

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `enabled` | boolean | No | Enable metrics collection. Default: `true` |
| `exporter` | string (enum) | No | Metrics exporter: `prometheus`, `otlp`, or `custom` |
| `endpoint` | string (URI) | No | Metrics collector endpoint |

### Supported Exporters

#### Prometheus

```yaml
observability:
  metrics:
    enabled: true
    exporter: prometheus
    endpoint: http://prometheus.example.com:9090
```

**Pull-based model:**
- Agent exposes `/metrics` endpoint
- Prometheus scrapes metrics
- Most common for Kubernetes deployments

**Configuration (platform-specific):**
```yaml
extensions:
  observability:
    metrics:
      prometheus:
        port: 9090
        path: /metrics
```

#### OpenTelemetry (OTLP)

```yaml
observability:
  metrics:
    enabled: true
    exporter: otlp
    endpoint: https://otel-collector.example.com:4317
```

**Push-based model:**
- Agent pushes metrics to collector
- Unified with trace collection
- Recommended for cloud platforms

#### Custom Exporter

```yaml
observability:
  metrics:
    enabled: true
    exporter: custom
    endpoint: https://custom-metrics.example.com
```

### Common Metrics

Platforms typically export these metrics:

**Request Metrics:**
- `agent_requests_total` - Total requests
- `agent_request_duration_seconds` - Request latency
- `agent_request_errors_total` - Failed requests

**LLM Metrics:**
- `agent_llm_calls_total` - LLM API calls
- `agent_llm_tokens_total` - Token usage (input/output)
- `agent_llm_cost_total` - Estimated cost
- `agent_llm_latency_seconds` - LLM response time

**Tool Metrics:**
- `agent_tool_calls_total` - Tool invocations
- `agent_tool_errors_total` - Tool failures
- `agent_tool_duration_seconds` - Tool execution time

**Resource Metrics:**
- `agent_cpu_usage` - CPU utilization
- `agent_memory_usage` - Memory consumption
- `agent_concurrent_requests` - Active requests

## Logging Configuration

Logging configuration controls log level and output format.

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `level` | string (enum) | No | Log level: `debug`, `info`, `warn`, or `error`. Default: `info` |
| `format` | string (enum) | No | Log format: `json` or `text`. Default: `json` |

### Log Levels

#### debug

```yaml
observability:
  logging:
    level: debug
```

**Includes:**
- All info, warn, error logs
- LLM prompts and responses
- Tool invocation details
- Internal state changes

**Use for:**
- Development
- Troubleshooting
- Performance tuning

**Warning:** High log volume, may include sensitive data

#### info

```yaml
observability:
  logging:
    level: info
```

**Includes:**
- Request/response summaries
- LLM call completion
- Tool execution
- Important state changes

**Use for:**
- Production monitoring
- Usage analytics
- Audit trails

**Default and recommended** for most deployments

#### warn

```yaml
observability:
  logging:
    level: warn
```

**Includes:**
- Warnings (retries, degraded performance)
- Errors

**Use for:**
- Stable production systems
- Reduced log volume

#### error

```yaml
observability:
  logging:
    level: error
```

**Includes:**
- Errors only

**Use for:**
- Minimal logging
- High-volume systems

### Log Formats

#### JSON (Structured)

```yaml
observability:
  logging:
    format: json
```

**Output:**
```json
{
  "timestamp": "2024-11-17T10:30:45Z",
  "level": "info",
  "agent": "code-reviewer",
  "message": "Processing request",
  "request_id": "req-abc123",
  "user_id": "user-456",
  "tokens": 1234
}
```

**Benefits:**
- Machine-parseable
- Structured querying
- Log aggregation friendly
- Cloud-native standard

**Recommended** for production

#### Text (Human-Readable)

```yaml
observability:
  logging:
    format: text
```

**Output:**
```
2024-11-17T10:30:45Z INFO [code-reviewer] Processing request request_id=req-abc123 user_id=user-456 tokens=1234
```

**Benefits:**
- Human-readable
- Easier local development
- Familiar format

**Use for:**
- Local development
- Debugging
- Console output

## Complete Examples

### Production Observability Stack

```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: production-agent
  version: 1.0.0
spec:
  role: Production agent with full observability

  observability:
    tracing:
      enabled: true
      exporter: otlp
      endpoint: https://otel-collector.production.example.com:4317

    metrics:
      enabled: true
      exporter: prometheus
      endpoint: http://prometheus.production.example.com:9090

    logging:
      level: info
      format: json
```

### Development Environment

```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: dev-agent
  version: 0.1.0
spec:
  role: Development agent with verbose logging

  observability:
    tracing:
      enabled: true
      exporter: jaeger
      endpoint: http://localhost:14268/api/traces

    metrics:
      enabled: true
      exporter: prometheus

    logging:
      level: debug
      format: text
```

### Cloud-Native (Grafana Stack)

```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: cloud-agent
  version: 2.0.0
spec:
  role: Cloud-deployed agent with Grafana observability

  observability:
    tracing:
      enabled: true
      exporter: otlp
      endpoint: https://otlp-gateway-prod.grafana.net/otlp

    metrics:
      enabled: true
      exporter: otlp
      endpoint: https://otlp-gateway-prod.grafana.net/otlp

    logging:
      level: info
      format: json
```

### Minimal Observability

```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: minimal-agent
  version: 1.0.0
spec:
  role: Lightweight agent with minimal observability

  observability:
    tracing:
      enabled: false

    metrics:
      enabled: true
      exporter: prometheus

    logging:
      level: warn
      format: json
```

### High-Volume Agent

```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: high-volume-agent
  version: 1.0.0
spec:
  role: High-volume agent with optimized observability

  observability:
    tracing:
      enabled: true
      exporter: otlp
      endpoint: https://otel-collector.example.com:4317
      # Platform-specific: sampling
    metrics:
      enabled: true
      exporter: otlp
      endpoint: https://otel-collector.example.com:4317
    logging:
      level: warn      # Reduced log volume
      format: json

extensions:
  observability:
    tracing:
      sampling_rate: 0.1    # Sample 10% of traces
```

## Integration Examples

### Grafana Cloud

```yaml
observability:
  tracing:
    enabled: true
    exporter: otlp
    endpoint: https://otlp-gateway-prod-us-central-0.grafana.net/otlp

  metrics:
    enabled: true
    exporter: otlp
    endpoint: https://otlp-gateway-prod-us-central-0.grafana.net/otlp

  logging:
    level: info
    format: json

extensions:
  observability:
    grafana_cloud:
      instance_id: "123456"
      api_key: SECRET_REF_GRAFANA_API_KEY
```

### Datadog

```yaml
observability:
  tracing:
    enabled: true
    exporter: otlp
    endpoint: https://trace.agent.datadoghq.com:4317

  metrics:
    enabled: true
    exporter: otlp
    endpoint: https://metrics.agent.datadoghq.com:4317

  logging:
    level: info
    format: json

extensions:
  observability:
    datadog:
      api_key: SECRET_REF_DATADOG_API_KEY
      site: datadoghq.com
```

### Self-Hosted (Prometheus + Jaeger + Loki)

```yaml
observability:
  tracing:
    enabled: true
    exporter: jaeger
    endpoint: http://jaeger-collector.monitoring:14268/api/traces

  metrics:
    enabled: true
    exporter: prometheus
    endpoint: http://prometheus.monitoring:9090

  logging:
    level: info
    format: json

extensions:
  observability:
    loki:
      endpoint: http://loki.monitoring:3100
      labels:
        environment: production
        service: agents
```

## Observability Best Practices

1. **Enable by default** - Always configure observability in production
2. **Use structured logging** - Prefer JSON format for production
3. **Start with info level** - Adjust based on needs
4. **Centralize collection** - Use OTLP when possible
5. **Monitor costs** - High log volumes can be expensive
6. **Sample traces** - Use sampling for high-volume agents
7. **Alert on metrics** - Set up alerts for SLO violations
8. **Correlate signals** - Use trace IDs to correlate logs/metrics/traces
9. **Secure endpoints** - Use authentication for collector endpoints
10. **Test locally** - Validate observability config before production

## Trace Context Propagation

OSSA agents should propagate trace context through:
- LLM API calls
- Tool invocations
- Sub-agent communication
- External API calls

**W3C Trace Context headers:**
```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
tracestate: vendor=value
```

Platform implementations handle propagation automatically.

## Common Metrics Queries

### Prometheus

```promql
# Request rate
rate(agent_requests_total[5m])

# Error rate
rate(agent_request_errors_total[5m]) / rate(agent_requests_total[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(agent_request_duration_seconds_bucket[5m]))

# Token usage per day
sum(increase(agent_llm_tokens_total[24h]))

# Cost per agent
sum(agent_llm_cost_total) by (agent)
```

## Privacy Considerations

**Sensitive data in logs:**
```yaml
# ❌ Debug logs may include user data
observability:
  logging:
    level: debug    # Includes prompts, responses

# ✅ Info level excludes sensitive details
observability:
  logging:
    level: info     # Summaries only
```

**Platform-specific log filtering:**
```yaml
extensions:
  observability:
    logging:
      redact_patterns:
        - "password"
        - "api_key"
        - "\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b"  # Emails
      pii_detection: true
```

## Related Objects

- [Agent Spec](./agent-spec.md) - Parent object containing observability
- [Constraints](./constraints.md) - Performance metrics and limits
- [Extensions](./extensions/) - Platform-specific observability features

## See Also

- [OpenTelemetry](https://opentelemetry.io/)
- [Prometheus](https://prometheus.io/)
- [Jaeger](https://www.jaegertracing.io/)
- [Grafana](https://grafana.com/)
