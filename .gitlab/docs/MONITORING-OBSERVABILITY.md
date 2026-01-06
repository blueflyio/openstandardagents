# Monitoring & Observability Strategy

## Problem: Too Many Environments

**Current Issue**: GitLab auto-creates environments for every deployment, causing clutter.

**Root Cause**: Environment names not properly scoped or using dynamic names.

## Solution: Consolidated Environment Strategy

### Recommended Environments (4 Total)

1. **development** - Development branch deployments
2. **staging** - Pre-production testing (RC releases)
3. **production** - Main branch production releases
4. **review/$CI_COMMIT_REF_SLUG** - Temporary review apps (auto-stop)

### Implementation

Update `.gitlab-ci.yml` to use consistent environment names:

```yaml
# Development deployments
deploy:development:
  environment:
    name: development
    url: https://dev.openstandardagents.org
    deployment_tier: development
    auto_stop_in: 7 days

# Staging (RC releases)
deploy:staging:
  environment:
    name: staging
    url: https://staging.openstandardagents.org
    deployment_tier: staging
    on_stop: stop:staging

# Production
deploy:production:
  environment:
    name: production
    url: https://openstandardagents.org
    deployment_tier: production
    kubernetes:
      namespace: ossa-production

# Review apps (temporary)
deploy:review:
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    url: https://$CI_COMMIT_REF_SLUG.review.openstandardagents.org
    deployment_tier: development
    on_stop: stop:review
    auto_stop_in: 3 days
```

## Enhanced Monitoring & Observability

### 1. GitLab Agent Observability

**Enable in agent config**:
```yaml
# .gitlab/agents/ossa-agent/config.yaml
observability:
  logging:
    level: info
    format: json
  
  metrics:
    enabled: true
    port: 9090
    path: /metrics
  
  tracing:
    enabled: true
    endpoint: http://jaeger-collector:14268/api/traces
    sampling_rate: 0.1
```

### 2. Prometheus + Grafana Stack

**Deploy monitoring stack**:
```yaml
# infrastructure/k8s/monitoring/prometheus.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    
    scrape_configs:
      # GitLab Agent metrics
      - job_name: 'gitlab-agent'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - gitlab-agent
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            regex: gitlab-agent
            action: keep
      
      # OSSA Agents metrics
      - job_name: 'ossa-agents'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - ossa-agents
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
```

### 3. Application Performance Monitoring (APM)

**Add to agents**:
```typescript
// src/services/observability/apm.service.ts
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

export class APMService {
  private tracer = trace.getTracer('ossa-agent');
  
  async traceOperation<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const span = this.tracer.startSpan(name);
    
    try {
      const result = await context.with(trace.setSpan(context.active(), span), fn);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ 
        code: SpanStatusCode.ERROR,
        message: error.message 
      });
      throw error;
    } finally {
      span.end();
    }
  }
}
```

### 4. Structured Logging

**Implement**:
```typescript
// src/services/observability/logger.service.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'ossa-agent',
    version: process.env.VERSION,
    environment: process.env.CI_ENVIRONMENT_NAME
  },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});
```

### 5. Metrics Collection

**Add to agents**:
```typescript
// src/services/observability/metrics.service.ts
import { Counter, Histogram, Registry } from 'prom-client';

export class MetricsService {
  private registry = new Registry();
  
  private versionBumps = new Counter({
    name: 'ossa_version_bumps_total',
    help: 'Total number of version bumps',
    labelNames: ['type', 'status'],
    registers: [this.registry]
  });
  
  private operationDuration = new Histogram({
    name: 'ossa_operation_duration_seconds',
    help: 'Duration of operations',
    labelNames: ['operation', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    registers: [this.registry]
  });
  
  recordVersionBump(type: string, status: 'success' | 'failure') {
    this.versionBumps.inc({ type, status });
  }
  
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
```

### 6. Health Checks

**Add endpoints**:
```typescript
// src/services/observability/health.service.ts
export class HealthService {
  async checkHealth() {
    return {
      status: 'healthy',
      version: process.env.VERSION,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        database: await this.checkDatabase(),
        gitlab: await this.checkGitLab(),
        kubernetes: await this.checkKubernetes()
      }
    };
  }
  
  async checkReadiness() {
    return {
      ready: true,
      checks: {
        dependencies: await this.checkDependencies()
      }
    };
  }
}
```

### 7. Grafana Dashboards

**Create dashboard**:
```json
{
  "dashboard": {
    "title": "OSSA Agents Overview",
    "panels": [
      {
        "title": "Version Bumps",
        "targets": [{
          "expr": "rate(ossa_version_bumps_total[5m])"
        }]
      },
      {
        "title": "Operation Duration",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(ossa_operation_duration_seconds_bucket[5m]))"
        }]
      },
      {
        "title": "Agent Health",
        "targets": [{
          "expr": "up{job='ossa-agents'}"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(ossa_errors_total[5m])"
        }]
      }
    ]
  }
}
```

### 8. Alerting Rules

**Configure alerts**:
```yaml
# infrastructure/k8s/monitoring/alerts.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
  namespace: monitoring
data:
  alerts.yml: |
    groups:
      - name: ossa-agents
        interval: 30s
        rules:
          - alert: AgentDown
            expr: up{job="ossa-agents"} == 0
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "OSSA Agent {{ $labels.pod }} is down"
          
          - alert: HighErrorRate
            expr: rate(ossa_errors_total[5m]) > 0.1
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "High error rate in {{ $labels.agent }}"
          
          - alert: SlowOperations
            expr: histogram_quantile(0.95, rate(ossa_operation_duration_seconds_bucket[5m])) > 10
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "Slow operations detected"
```

## Implementation Plan

### Phase 1: Environment Cleanup (Immediate)
1. ✅ Update `.gitlab-ci.yml` with consolidated environments
2. ✅ Stop/delete old environments in GitLab UI
3. ✅ Document environment strategy

### Phase 2: Basic Monitoring (Week 1)
1. ✅ Deploy Prometheus to cluster
2. ✅ Configure agent metrics scraping
3. ✅ Add health check endpoints
4. ✅ Set up basic Grafana dashboard

### Phase 3: Enhanced Observability (Week 2)
1. ✅ Implement structured logging
2. ✅ Add distributed tracing (Jaeger)
3. ✅ Create comprehensive dashboards
4. ✅ Configure alerting rules

### Phase 4: APM Integration (Week 3)
1. ✅ Integrate OpenTelemetry
2. ✅ Add custom metrics
3. ✅ Performance profiling
4. ✅ Error tracking

## Quick Start

### Deploy Monitoring Stack
```bash
# Create namespace
kubectl create namespace monitoring

# Deploy Prometheus
kubectl apply -f infrastructure/k8s/monitoring/prometheus.yaml

# Deploy Grafana
kubectl apply -f infrastructure/k8s/monitoring/grafana.yaml

# Deploy Jaeger
kubectl apply -f infrastructure/k8s/monitoring/jaeger.yaml

# Access dashboards
kubectl port-forward -n monitoring svc/grafana 3000:3000
kubectl port-forward -n monitoring svc/jaeger-query 16686:16686
```

### Access Metrics
```bash
# Agent metrics
curl http://version-manager.ossa-agents:9090/metrics

# Prometheus UI
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Open http://localhost:9090

# Grafana
# Open http://localhost:3000
# Default: admin/admin
```

## Monitoring Endpoints

### Agent Endpoints
- `GET /health` - Health check
- `GET /ready` - Readiness check
- `GET /metrics` - Prometheus metrics
- `GET /debug/pprof` - Performance profiling

### Dashboards
- **Grafana**: http://grafana.monitoring.svc.cluster.local:3000
- **Prometheus**: http://prometheus.monitoring.svc.cluster.local:9090
- **Jaeger**: http://jaeger-query.monitoring.svc.cluster.local:16686

## Key Metrics to Monitor

1. **Version Management**
   - Version bumps per day
   - Sync success rate
   - Operation duration

2. **Agent Health**
   - Uptime
   - Memory usage
   - CPU usage
   - Request rate

3. **CI/CD**
   - Pipeline success rate
   - Deployment frequency
   - Lead time
   - MTTR (Mean Time To Recovery)

4. **Application**
   - Error rate
   - Response time (p50, p95, p99)
   - Throughput
   - Active connections

## Resources

- **Prometheus**: https://prometheus.io/docs/
- **Grafana**: https://grafana.com/docs/
- **OpenTelemetry**: https://opentelemetry.io/docs/
- **GitLab Observability**: https://docs.gitlab.com/ee/operations/
