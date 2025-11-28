# OSSA Observability Standards

Standards for monitoring, logging, and tracing OSSA agents in production environments.

## Three Pillars of Observability

### 1. Metrics

**Required Metrics**:

```typescript
// metrics.ts
export const OSSA_METRICS = {
  // Request Metrics
  'ossa.requests.total': 'counter',
  'ossa.requests.duration': 'histogram',
  'ossa.requests.errors': 'counter',
  
  // Capability Metrics
  'ossa.capability.invocations': 'counter',
  'ossa.capability.duration': 'histogram',
  'ossa.capability.errors': 'counter',
  
  // Resource Metrics
  'ossa.memory.usage': 'gauge',
  'ossa.cpu.usage': 'gauge',
  'ossa.connections.active': 'gauge',
  
  // Business Metrics
  'ossa.agents.active': 'gauge',
  'ossa.tasks.completed': 'counter',
  'ossa.tasks.failed': 'counter',
};
```

**Prometheus Format**:

```
# HELP ossa_requests_total Total number of requests
# TYPE ossa_requests_total counter
ossa_requests_total{agent="my-agent",capability="search",status="success"} 1234

# HELP ossa_requests_duration_seconds Request duration in seconds
# TYPE ossa_requests_duration_seconds histogram
ossa_requests_duration_seconds_bucket{agent="my-agent",le="0.1"} 100
ossa_requests_duration_seconds_bucket{agent="my-agent",le="0.5"} 450
ossa_requests_duration_seconds_bucket{agent="my-agent",le="1.0"} 800
ossa_requests_duration_seconds_sum{agent="my-agent"} 456.78
ossa_requests_duration_seconds_count{agent="my-agent"} 1000
```

### 2. Logging

**Log Levels**:
- **ERROR**: System errors, failures
- **WARN**: Degraded performance, retries
- **INFO**: Normal operations, state changes
- **DEBUG**: Detailed diagnostic information

**Structured Logging Format**:

```json
{
  "timestamp": "2025-11-26T13:41:49.854Z",
  "level": "INFO",
  "agent": "my-agent",
  "capability": "search",
  "request_id": "req-123",
  "user_id": "user-456",
  "duration_ms": 234,
  "status": "success",
  "message": "Capability invoked successfully",
  "metadata": {
    "query": "search term",
    "results": 10
  }
}
```

**Required Log Fields**:
- `timestamp`: ISO 8601 format
- `level`: Log level
- `agent`: Agent identifier
- `request_id`: Unique request ID
- `message`: Human-readable message

### 3. Distributed Tracing

**OpenTelemetry Integration**:

```typescript
// tracing.ts
import { trace, SpanStatusCode } from '@opentelemetry/api';

export class OSSATracer {
  async traceCapability(name: string, fn: Function) {
    const tracer = trace.getTracer('ossa-agent');
    const span = tracer.startSpan(`capability.${name}`);
    
    span.setAttributes({
      'ossa.agent': this.agentId,
      'ossa.capability': name,
      'ossa.version': '0.2.6',
    });
    
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }
}
```

**Trace Context Propagation**:

```typescript
// W3C Trace Context headers
const headers = {
  'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
  'tracestate': 'ossa=t61rcWkgMzE',
};
```

## Instrumentation Requirements

### Agent Lifecycle Events

```typescript
export enum AgentLifecycleEvent {
  INITIALIZED = 'agent.initialized',
  STARTED = 'agent.started',
  STOPPED = 'agent.stopped',
  ERROR = 'agent.error',
  CAPABILITY_REGISTERED = 'agent.capability.registered',
  CAPABILITY_INVOKED = 'agent.capability.invoked',
  CAPABILITY_COMPLETED = 'agent.capability.completed',
  CAPABILITY_FAILED = 'agent.capability.failed',
}
```

### Health Checks

```typescript
// health.ts
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthStatus;
    cache: HealthStatus;
    dependencies: HealthStatus;
  };
}

// GET /health
{
  "status": "healthy",
  "timestamp": "2025-11-26T13:41:49.854Z",
  "version": "0.2.6",
  "uptime": 86400,
  "checks": {
    "database": { "status": "healthy", "latency_ms": 5 },
    "cache": { "status": "healthy", "latency_ms": 2 },
    "dependencies": { "status": "healthy", "count": 3 }
  }
}
```

## Alerting Rules

### Critical Alerts

```yaml
# prometheus-rules.yaml
groups:
  - name: ossa-critical
    interval: 30s
    rules:
      - alert: OSSAAgentDown
        expr: up{job="ossa-agent"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "OSSA agent is down"
          
      - alert: OSSAHighErrorRate
        expr: rate(ossa_requests_errors[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate above 5%"
          
      - alert: OSSAHighLatency
        expr: histogram_quantile(0.95, ossa_requests_duration_seconds) > 1.0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P95 latency above 1s"
```

### Warning Alerts

```yaml
- alert: OSSAMemoryHigh
  expr: ossa_memory_usage > 0.8
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Memory usage above 80%"
    
- alert: OSSACPUHigh
  expr: ossa_cpu_usage > 0.7
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "CPU usage above 70%"
```

## Dashboards

### Grafana Dashboard Template

```json
{
  "dashboard": {
    "title": "OSSA Agent Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(ossa_requests_total[5m])"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(ossa_requests_errors[5m])"
        }]
      },
      {
        "title": "Latency (P50, P95, P99)",
        "targets": [
          { "expr": "histogram_quantile(0.50, ossa_requests_duration_seconds)" },
          { "expr": "histogram_quantile(0.95, ossa_requests_duration_seconds)" },
          { "expr": "histogram_quantile(0.99, ossa_requests_duration_seconds)" }
        ]
      }
    ]
  }
}
```

## SLIs and SLOs

### Service Level Indicators

```typescript
export const SLIs = {
  availability: {
    metric: 'up{job="ossa-agent"}',
    target: 0.999, // 99.9%
  },
  latency: {
    metric: 'histogram_quantile(0.95, ossa_requests_duration_seconds)',
    target: 0.5, // 500ms
  },
  errorRate: {
    metric: 'rate(ossa_requests_errors[5m]) / rate(ossa_requests_total[5m])',
    target: 0.01, // 1%
  },
};
```

### Service Level Objectives

| SLI | Target | Measurement Window |
|-----|--------|-------------------|
| Availability | 99.9% | 30 days |
| P95 Latency | < 500ms | 7 days |
| Error Rate | < 1% | 24 hours |

## Log Aggregation

### ELK Stack Configuration

```yaml
# logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [kubernetes][labels][app] == "ossa-agent" {
    json {
      source => "message"
    }
    
    mutate {
      add_field => {
        "[@metadata][index]" => "ossa-logs-%{+YYYY.MM.dd}"
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][index]}"
  }
}
```

## Tracing Backend

### Jaeger Configuration

```yaml
# jaeger-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger
spec:
  template:
    spec:
      containers:
      - name: jaeger
        image: jaegertracing/all-in-one:latest
        env:
        - name: COLLECTOR_ZIPKIN_HOST_PORT
          value: ":9411"
        ports:
        - containerPort: 5775
          protocol: UDP
        - containerPort: 6831
          protocol: UDP
        - containerPort: 6832
          protocol: UDP
        - containerPort: 5778
          protocol: TCP
        - containerPort: 16686
          protocol: TCP
        - containerPort: 14268
          protocol: TCP
        - containerPort: 9411
          protocol: TCP
```

## Best Practices

### 1. Cardinality Management
- Limit label values to prevent metric explosion
- Use aggregation for high-cardinality data
- Avoid user IDs in metric labels

### 2. Sampling Strategy
- Sample traces at 1% for high-volume services
- Always trace errors (100%)
- Use adaptive sampling for dynamic adjustment

### 3. Log Retention
- **Hot storage**: 7 days (fast queries)
- **Warm storage**: 30 days (slower queries)
- **Cold storage**: 1 year (archive)

### 4. Cost Optimization
- Use metric aggregation
- Implement log filtering
- Archive old traces
- Use sampling for high-volume data

## Compliance Requirements

### Audit Logging
- Log all authentication attempts
- Log all authorization decisions
- Log all data access
- Log all configuration changes

### Data Retention
- Logs: 1 year minimum
- Metrics: 90 days minimum
- Traces: 30 days minimum

### Privacy
- Redact PII from logs
- Encrypt logs at rest
- Control access to observability data

## References

- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/otel/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
- [ELK Stack Guide](https://www.elastic.co/guide/)
