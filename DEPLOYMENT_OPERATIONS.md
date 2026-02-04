# OSSA Agent Operations Runbook

**Production operations guide: Monitoring, troubleshooting, scaling, and incident response**

---

## Table of Contents

- [Health Checks](#health-checks)
- [Monitoring & Observability](#monitoring--observability)
- [Logging](#logging)
- [Metrics](#metrics)
- [Alerting](#alerting)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)
- [Scaling Strategies](#scaling-strategies)
- [Incident Response](#incident-response)
- [Backup & Recovery](#backup--recovery)
- [Maintenance](#maintenance)

---

## Health Checks

### Health Check Endpoints

All OSSA agents must implement standard health check endpoints:

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `/health` | Overall health | `200 OK` + status details |
| `/health/live` | Liveness check | `200 OK` (process alive) |
| `/health/ready` | Readiness check | `200 OK` (ready for traffic) |
| `/health/startup` | Startup completion | `200 OK` (initialization done) |

### Health Check Response Format

```json
{
  "status": "healthy",
  "version": "0.4.1",
  "uptime": 12345,
  "timestamp": "2026-02-04T10:00:00Z",
  "checks": {
    "api": {
      "status": "ok",
      "latency_ms": 2
    },
    "database": {
      "status": "ok",
      "latency_ms": 15,
      "connections": 5
    },
    "redis": {
      "status": "ok",
      "latency_ms": 1
    },
    "dependencies": {
      "status": "ok"
    }
  }
}
```

### Testing Health Checks

```bash
# Basic health check
curl http://localhost:3000/health

# With timeout
curl --max-time 5 http://localhost:3000/health

# Check HTTP status only
curl -I http://localhost:3000/health

# Detailed output
curl -v http://localhost:3000/health | jq '.'
```

### Platform-Specific Health Check Configuration

**Kubernetes**:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /health/startup
    port: 3000
  initialDelaySeconds: 0
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 30
```

**Docker Compose**:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Railway/Render**:

```json
{
  "healthCheckPath": "/health",
  "healthCheckTimeout": 300
}
```

---

## Monitoring & Observability

### Observability Pillars

1. **Metrics**: Quantitative system data (CPU, memory, requests/sec)
2. **Logs**: Timestamped event records
3. **Traces**: Request flow through system
4. **Alerts**: Automated notifications

### Quick Monitoring Setup

**Option 1: Prometheus + Grafana** (Recommended)

```bash
# Export with monitoring
buildkit export kubernetes ./my-agent --output ./k8s-deploy --enable-monitoring

# Or add to existing deployment
kubectl apply -f https://raw.githubusercontent.com/ossa/configs/main/monitoring/prometheus.yaml
kubectl apply -f https://raw.githubusercontent.com/ossa/configs/main/monitoring/grafana.yaml
```

**Option 2: Cloud-Native Monitoring**

- **AWS**: CloudWatch + X-Ray
- **GCP**: Cloud Monitoring + Cloud Trace
- **Azure**: Application Insights
- **Kubernetes**: Prometheus Operator + Grafana

**Option 3: Third-Party SaaS**

- **DataDog**: All-in-one observability
- **New Relic**: APM and monitoring
- **Grafana Cloud**: Managed Grafana/Prometheus
- **Honeycomb**: Advanced observability

### Metrics Endpoint

All agents expose Prometheus-compatible metrics:

```bash
# Access metrics
curl http://localhost:9090/metrics

# Sample output:
# HELP agent_requests_total Total number of requests
# TYPE agent_requests_total counter
agent_requests_total{method="GET",status="200"} 1234

# HELP agent_request_duration_seconds Request duration in seconds
# TYPE agent_request_duration_seconds histogram
agent_request_duration_seconds_bucket{le="0.1"} 500
agent_request_duration_seconds_bucket{le="0.5"} 950
agent_request_duration_seconds_bucket{le="1.0"} 1200
```

### Key Metrics to Monitor

| Metric | Type | Description | Alert Threshold |
|--------|------|-------------|-----------------|
| `agent_requests_total` | Counter | Total requests | - |
| `agent_request_duration_seconds` | Histogram | Request latency | p95 > 1s |
| `agent_errors_total` | Counter | Total errors | > 10/min |
| `agent_cpu_usage_percent` | Gauge | CPU usage | > 80% |
| `agent_memory_usage_bytes` | Gauge | Memory usage | > 90% limit |
| `agent_concurrent_tasks` | Gauge | Active tasks | > threshold |
| `agent_db_connections` | Gauge | DB connections | > pool size |
| `agent_health_status` | Gauge | Health status | 0 (unhealthy) |

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'ossa-agents'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: my-agent
        action: keep
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
```

### Grafana Dashboards

Pre-built dashboards available:

```bash
# Import OSSA Agent Dashboard
# Grafana ID: 12345 (example)

# Or load from file
kubectl create configmap grafana-dashboard \
  --from-file=dashboard.json \
  -n monitoring
```

**Key Dashboard Panels**:
- Request rate (requests/sec)
- Error rate (%)
- Response time (p50, p95, p99)
- CPU and memory usage
- Active connections
- Task queue length

---

## Logging

### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `debug` | Detailed debugging | `DEBUG Request payload: {...}` |
| `info` | Informational events | `INFO Agent started on port 3000` |
| `warn` | Warning messages | `WARN High memory usage: 85%` |
| `error` | Error events | `ERROR Database connection failed` |
| `fatal` | Critical failures | `FATAL Unable to bind to port 3000` |

### Structured Logging

OSSA agents use structured JSON logs:

```json
{
  "timestamp": "2026-02-04T10:00:00.123Z",
  "level": "info",
  "message": "Request processed",
  "agent_id": "my-agent-001",
  "request_id": "abc-123",
  "method": "POST",
  "path": "/api/tasks",
  "status": 200,
  "duration_ms": 45,
  "user_id": "user-456"
}
```

### Log Configuration

**Environment Variables**:

```bash
# Set log level
export LOG_LEVEL=info        # debug, info, warn, error
export LOG_FORMAT=json        # json, text
export LOG_OUTPUT=stdout      # stdout, file, both
export LOG_FILE=/var/log/agent.log
```

### Accessing Logs

**Kubernetes**:

```bash
# View logs for all agent pods
kubectl logs -l app=my-agent -f

# View logs for specific pod
kubectl logs my-agent-abc123 -f

# Previous container logs
kubectl logs my-agent-abc123 --previous

# Tail last 100 lines
kubectl logs my-agent-abc123 --tail=100

# Filter by timestamp
kubectl logs my-agent-abc123 --since=1h
```

**Docker Compose**:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f agent

# Tail last 100 lines
docker-compose logs --tail=100 agent

# Filter by timestamp
docker-compose logs --since 2026-02-04T10:00:00 agent
```

**Cloud Platforms**:

```bash
# Railway
railway logs -f

# Render
render logs --service my-agent --tail

# Fly.io
fly logs

# Heroku
heroku logs --tail --app my-agent
```

### Log Aggregation

**Centralized Logging Solutions**:

1. **ELK Stack** (Elasticsearch, Logstash, Kibana)
2. **Loki + Grafana**
3. **Fluentd/Fluent Bit**
4. **Cloud-native** (CloudWatch, Cloud Logging, Log Analytics)
5. **SaaS** (Papertrail, Loggly, DataDog Logs)

**Example: Loki with Kubernetes**

```bash
# Install Loki stack
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki-stack \
  --set grafana.enabled=true \
  --set prometheus.enabled=true \
  --namespace monitoring

# Access Grafana
kubectl port-forward -n monitoring service/loki-grafana 3000:80
```

---

## Metrics

### Application Metrics

**Request Metrics**:
- Request rate (requests/sec)
- Request duration (p50, p95, p99)
- Error rate (errors/sec, %)
- Status code distribution

**Resource Metrics**:
- CPU usage (%)
- Memory usage (MB, %)
- Disk I/O (MB/s)
- Network I/O (MB/s)

**Business Metrics**:
- Tasks processed
- Tasks failed
- Active users
- API key usage

### Infrastructure Metrics

**Container Metrics**:
- Container restarts
- Pod evictions
- Image pull errors
- OOM kills

**Cluster Metrics** (Kubernetes):
- Node CPU usage
- Node memory usage
- Pod count
- PV usage

### Custom Metrics

Implement custom metrics in your agent:

```javascript
// Example: Node.js with prom-client
const prometheus = require('prom-client');

// Counter: Total tasks processed
const tasksProcessed = new prometheus.Counter({
  name: 'agent_tasks_processed_total',
  help: 'Total number of tasks processed',
  labelNames: ['task_type', 'status']
});

// Histogram: Task duration
const taskDuration = new prometheus.Histogram({
  name: 'agent_task_duration_seconds',
  help: 'Task processing duration in seconds',
  labelNames: ['task_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// Gauge: Active tasks
const activeTasks = new prometheus.Gauge({
  name: 'agent_active_tasks',
  help: 'Number of currently active tasks'
});

// Usage
tasksProcessed.inc({ task_type: 'moderation', status: 'success' });
taskDuration.observe({ task_type: 'moderation' }, 2.5);
activeTasks.set(12);
```

---

## Alerting

### Alert Rules

**Critical Alerts** (Page immediately):

1. **Agent Down**: Health check failing for > 2 minutes
2. **High Error Rate**: > 10% errors in last 5 minutes
3. **OOM**: Container killed due to memory
4. **Database Down**: Database connection lost

**Warning Alerts** (Notify during business hours):

1. **High Latency**: p95 > 1s for 10 minutes
2. **High CPU**: > 80% for 15 minutes
3. **High Memory**: > 85% for 15 minutes
4. **Disk Space**: < 10% free

**Info Alerts** (Log only):

1. **Deployment**: New version deployed
2. **Scale Event**: Pods scaled up/down
3. **Configuration Change**: Config updated

### Prometheus Alert Rules

```yaml
# alerts.yaml
groups:
  - name: ossa_agent_alerts
    interval: 30s
    rules:
      # Critical: Agent down
      - alert: AgentDown
        expr: up{job="ossa-agents"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Agent {{ $labels.instance }} is down"
          description: "Agent has been down for more than 2 minutes"

      # Critical: High error rate
      - alert: HighErrorRate
        expr: |
          rate(agent_errors_total[5m]) /
          rate(agent_requests_total[5m]) > 0.10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.instance }}"
          description: "Error rate is {{ $value }}%"

      # Warning: High latency
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            rate(agent_request_duration_seconds_bucket[5m])
          ) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High latency on {{ $labels.instance }}"
          description: "p95 latency is {{ $value }}s"

      # Warning: High CPU
      - alert: HighCPUUsage
        expr: |
          rate(container_cpu_usage_seconds_total{
            pod=~"my-agent-.*"
          }[5m]) * 100 > 80
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.pod }}"
          description: "CPU usage is {{ $value }}%"

      # Warning: High memory
      - alert: HighMemoryUsage
        expr: |
          (container_memory_usage_bytes{
            pod=~"my-agent-.*"
          } /
          container_spec_memory_limit_bytes) * 100 > 85
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.pod }}"
          description: "Memory usage is {{ $value }}%"
```

### Alert Destinations

**PagerDuty**:

```yaml
# alertmanager.yml
receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'your-pagerduty-key'
        severity: 'critical'
        description: '{{ .CommonAnnotations.summary }}'
```

**Slack**:

```yaml
receivers:
  - name: 'slack-alerts'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        title: 'Alert: {{ .CommonAnnotations.summary }}'
        text: '{{ .CommonAnnotations.description }}'
```

**Email**:

```yaml
receivers:
  - name: 'email-ops'
    email_configs:
      - to: 'ops-team@example.com'
        from: 'alerts@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alerts@example.com'
        auth_password: 'password'
```

---

## Troubleshooting

### Common Issues

#### 1. Agent Won't Start

**Symptoms**:
- Container keeps restarting
- "CrashLoopBackOff" in Kubernetes
- Exit code 1

**Diagnosis**:

```bash
# Check logs
kubectl logs my-agent-pod

# Check events
kubectl describe pod my-agent-pod

# Check environment variables
kubectl exec my-agent-pod -- env
```

**Common Causes**:
- Missing required environment variables
- Database connection failure
- Port already in use
- Insufficient permissions
- OOM (out of memory)

**Solutions**:

```bash
# Check configuration
kubectl get configmap agent-config -o yaml

# Verify secrets exist
kubectl get secret agent-secrets

# Check resource limits
kubectl describe pod my-agent-pod | grep -A 5 "Limits"

# Increase memory if OOM
kubectl set resources deployment/my-agent --limits=memory=1Gi
```

---

#### 2. High Latency

**Symptoms**:
- Slow response times
- Timeouts
- Client complaints

**Diagnosis**:

```bash
# Check metrics
curl http://agent:9090/metrics | grep duration

# Profile endpoint
curl -w "@curl-format.txt" -o /dev/null -s http://agent:3000/api/task

# curl-format.txt:
# time_total: %{time_total}
# time_connect: %{time_connect}
# time_starttransfer: %{time_starttransfer}
```

**Common Causes**:
- Database slow queries
- External API latency
- CPU throttling
- Memory pressure
- Network issues

**Solutions**:

```bash
# Scale horizontally
kubectl scale deployment my-agent --replicas=5

# Increase resources
kubectl set resources deployment/my-agent \
  --requests=cpu=500m,memory=512Mi \
  --limits=cpu=2000m,memory=2Gi

# Enable caching
kubectl set env deployment/my-agent REDIS_URL=redis://redis:6379

# Optimize queries
# Add database indexes
# Review slow query logs
```

---

#### 3. Memory Leak

**Symptoms**:
- Memory usage steadily increasing
- OOM kills
- Degraded performance over time

**Diagnosis**:

```bash
# Monitor memory over time
kubectl top pod my-agent-pod --watch

# Get memory metrics
curl http://agent:9090/metrics | grep memory

# Heap dump (if Node.js)
kubectl exec my-agent-pod -- node --inspect --inspect-brk
```

**Common Causes**:
- Unclosed database connections
- Event listener leaks
- Large object accumulation
- Missing garbage collection

**Solutions**:

```bash
# Restart pods regularly
kubectl rollout restart deployment/my-agent

# Set memory limits (force GC)
kubectl set resources deployment/my-agent --limits=memory=1Gi

# Enable GC logging (Node.js)
kubectl set env deployment/my-agent NODE_OPTIONS="--expose-gc --trace-gc"

# Fix code and redeploy
```

---

#### 4. Database Connection Issues

**Symptoms**:
- "Connection refused"
- "Too many connections"
- Timeout errors

**Diagnosis**:

```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:16 --restart=Never \
  -- psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
curl http://agent:9090/metrics | grep db_connections

# Check database logs
kubectl logs postgres-pod
```

**Solutions**:

```bash
# Increase connection pool
kubectl set env deployment/my-agent DB_POOL_SIZE=20

# Scale database
# Upgrade database tier/resources

# Add connection retry logic
kubectl set env deployment/my-agent DB_RETRY_ATTEMPTS=5

# Check network policies
kubectl get networkpolicies
```

---

#### 5. Failed Deployments

**Symptoms**:
- Deployment stuck in progress
- Pods not becoming ready
- Rollout timeout

**Diagnosis**:

```bash
# Check rollout status
kubectl rollout status deployment/my-agent

# View rollout history
kubectl rollout history deployment/my-agent

# Describe deployment
kubectl describe deployment my-agent

# Check events
kubectl get events --sort-by='.lastTimestamp'
```

**Solutions**:

```bash
# Rollback to previous version
kubectl rollout undo deployment/my-agent

# Rollback to specific revision
kubectl rollout undo deployment/my-agent --to-revision=2

# Pause rollout
kubectl rollout pause deployment/my-agent

# Resume after fixing
kubectl rollout resume deployment/my-agent
```

---

### Debugging Toolkit

**Essential Commands**:

```bash
# Pod inspection
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous
kubectl exec -it <pod-name> -- /bin/sh

# Network debugging
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -- bash
# Inside pod:
curl http://my-agent:3000/health
nslookup my-agent
ping my-agent

# Resource usage
kubectl top nodes
kubectl top pods
kubectl top pods --containers

# Events
kubectl get events --watch
kubectl get events --field-selector type=Warning

# Configuration
kubectl get configmap <name> -o yaml
kubectl get secret <name> -o yaml
```

**Debugging Images**:
- `nicolaka/netshoot` - Network debugging
- `busybox` - Basic utilities
- `curlimages/curl` - HTTP testing
- `postgres:16` - Database testing

---

## Performance Optimization

### Resource Right-Sizing

**CPU Optimization**:

```yaml
resources:
  requests:
    cpu: "250m"      # Start here
  limits:
    cpu: "1000m"     # 4x requests
```

**Memory Optimization**:

```yaml
resources:
  requests:
    memory: "256Mi"  # Baseline usage
  limits:
    memory: "1Gi"    # 4x requests
```

**Finding Right Size**:

```bash
# Monitor actual usage
kubectl top pod my-agent-pod --containers

# Analyze over time with metrics
# Set requests to p95 usage
# Set limits to 2-4x requests
```

### Connection Pooling

```javascript
// Database connection pool
const pool = new Pool({
  max: 20,                    // Max connections
  min: 2,                     // Min connections
  idleTimeoutMillis: 30000,   // Close idle after 30s
  connectionTimeoutMillis: 2000
});
```

### Caching Strategy

```javascript
// Redis caching
const redis = new Redis(process.env.REDIS_URL);

async function getCachedData(key) {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Fetch from source
  const data = await fetchFromDatabase(key);

  // Cache for 5 minutes
  await redis.setex(key, 300, JSON.stringify(data));

  return data;
}
```

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run loadtest.js

# Example test
cat > loadtest.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,           // 100 virtual users
  duration: '5m',     // 5 minute test
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% < 1s
    http_req_failed: ['rate<0.01'],    // <1% errors
  },
};

export default function () {
  const res = http.get('http://my-agent.example.com/api/tasks');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });
  sleep(1);
}
EOF
```

---

## Scaling Strategies

### Horizontal Scaling

**Kubernetes HPA**:

```bash
# Create HPA
kubectl autoscale deployment my-agent \
  --cpu-percent=70 \
  --min=2 \
  --max=10

# Check HPA status
kubectl get hpa

# Manual scaling
kubectl scale deployment my-agent --replicas=5
```

**Cloud Platform Scaling**:

```bash
# Railway
railway scale --replicas 5

# Render
# Via dashboard: Settings → Scaling

# Fly.io
fly scale count 5
fly scale count 3 --region iad
```

### Vertical Scaling

```bash
# Increase resources (requires restart)
kubectl set resources deployment/my-agent \
  --requests=cpu=500m,memory=512Mi \
  --limits=cpu=2000m,memory=2Gi

# Vertical Pod Autoscaler (VPA)
kubectl apply -f - << 'EOF'
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-agent-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-agent
  updatePolicy:
    updateMode: "Auto"
EOF
```

### Database Scaling

```bash
# Read replicas
kubectl set env deployment/my-agent \
  DATABASE_READ_URL=postgresql://read-replica/db

# Connection pooling
kubectl set env deployment/my-agent DB_POOL_SIZE=50

# Query optimization
# Add indexes
# Use materialized views
# Enable query caching
```

---

## Incident Response

### Incident Response Process

1. **Detect**: Alert fires
2. **Acknowledge**: Team member responds
3. **Assess**: Determine severity
4. **Mitigate**: Stop the bleeding
5. **Resolve**: Fix root cause
6. **Post-mortem**: Learn and improve

### Incident Severity Levels

| Severity | Impact | Response Time | Examples |
|----------|--------|---------------|----------|
| **P1** | Critical | < 15 min | Complete outage, data loss |
| **P2** | High | < 1 hour | Degraded performance, partial outage |
| **P3** | Medium | < 4 hours | Minor issues, workarounds available |
| **P4** | Low | Next business day | Cosmetic issues, feature requests |

### Quick Mitigation Actions

```bash
# Rollback deployment
kubectl rollout undo deployment/my-agent

# Scale up resources
kubectl scale deployment my-agent --replicas=10

# Restart unhealthy pods
kubectl delete pod my-agent-abc123

# Temporarily increase resources
kubectl set resources deployment/my-agent --limits=cpu=4,memory=4Gi

# Enable maintenance mode
kubectl set env deployment/my-agent MAINTENANCE_MODE=true
```

---

## Backup & Recovery

### Backup Strategy

**Database Backups**:

```bash
# PostgreSQL backup
kubectl exec postgres-pod -- pg_dump -U postgres agents > backup.sql

# Automated backups
kubectl create cronjob pg-backup \
  --image=postgres:16 \
  --schedule="0 2 * * *" \
  -- /bin/sh -c "pg_dump $DATABASE_URL | gzip > /backup/$(date +%Y%m%d).sql.gz"
```

**Configuration Backups**:

```bash
# Export all configs
kubectl get configmap,secret -o yaml > k8s-backup.yaml

# Backup to Git
kubectl get all,configmap,secret -o yaml | git add -
git commit -m "Backup $(date)"
git push
```

### Recovery Procedures

```bash
# Restore database
kubectl exec -i postgres-pod -- psql -U postgres agents < backup.sql

# Restore configuration
kubectl apply -f k8s-backup.yaml

# Recreate deployment
kubectl apply -f deployment.yaml
```

---

## Maintenance

### Routine Maintenance

**Weekly**:
- Review error logs
- Check disk usage
- Verify backups
- Review metrics dashboards

**Monthly**:
- Update dependencies
- Review and update alerts
- Capacity planning
- Security patches

**Quarterly**:
- Load testing
- Disaster recovery drill
- Architecture review
- Cost optimization review

### Planned Maintenance

```bash
# Schedule maintenance window
kubectl annotate deployment my-agent \
  maintenance.ossa.io/window="2026-02-10T02:00:00Z/2026-02-10T04:00:00Z"

# Enable maintenance mode
kubectl set env deployment/my-agent MAINTENANCE_MODE=true

# Perform maintenance
kubectl set image deployment/my-agent agent=my-agent:v2.0.0

# Disable maintenance mode
kubectl set env deployment/my-agent MAINTENANCE_MODE-
```

---

## Environment Variables

### Core Variables

```bash
# Required
AGENT_ID=my-agent-001
AGENT_NAME="My Production Agent"
OSSA_VERSION=0.4.1
API_PORT=3000
LOG_LEVEL=info

# Optional
NODE_ENV=production
METRICS_PORT=9090
MAX_WORKERS=10
REQUEST_TIMEOUT=30000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### Platform-Specific Variables

**Kubernetes**:
```bash
# Auto-set by Kubernetes
POD_NAME=$(metadata.name)
POD_NAMESPACE=$(metadata.namespace)
NODE_NAME=$(spec.nodeName)
```

**Cloud Platforms**:
```bash
# Railway
RAILWAY_ENVIRONMENT
RAILWAY_SERVICE_NAME

# Render
RENDER_SERVICE_NAME
RENDER_EXTERNAL_URL

# Fly.io
FLY_APP_NAME
FLY_REGION
```

---

## Next Steps

- **[Security Guide](./DEPLOYMENT_SECURITY.md)** - Harden your deployment
- **[Architecture Guide](./DEPLOYMENT_ARCHITECTURE.md)** - Reference architectures
- **[Platform Guide](./DEPLOYMENT_PLATFORMS.md)** - Platform-specific details
- **[FAQ](./DEPLOYMENT_FAQ.md)** - Common questions

---

**Last Updated**: 2026-02-04
