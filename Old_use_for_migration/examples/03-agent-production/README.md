# 03-agent-production: Production-Ready Agent

## Overview
Level 3 agent demonstrating production deployment features including security, monitoring, scaling, and compliance. This is the recommended starting point for agents going into production environments.

## What's Included
- **agent.yml**: 200-line production configuration
- **openapi.yaml**: Comprehensive API specification
- **data/**: Example data and configurations
  - `examples.json`: Input/output examples for each capability
  - `config.json`: Runtime configurations
  - `knowledge.json`: Knowledge base
  - `training.json`: Training data

## Key Features

### Security
- ✅ JWT authentication
- ✅ Rate limiting with burst protection
- ✅ Encryption at rest and in transit
- ✅ Vulnerability scanning
- ✅ Secrets management via Vault

### Monitoring
- ✅ Prometheus metrics export
- ✅ Distributed tracing with Jaeger
- ✅ Structured JSON logging
- ✅ Elasticsearch integration
- ✅ Custom alerts and thresholds

### Scalability
- ✅ Auto-scaling (2-10 instances)
- ✅ Health checks with thresholds
- ✅ Resource limits and requests
- ✅ Load balancing ready
- ✅ Redis-backed persistent memory

### Compliance
- ✅ ISO 42001 compliance
- ✅ NIST AI RMF support
- ✅ Detailed audit trails
- ✅ Data classification
- ✅ 90-day retention policy

## Production Deployment

### Prerequisites
```bash
# Required services
- Redis (for persistent memory)
- Elasticsearch (for logging/audit)
- Prometheus (for metrics)
- Jaeger (for tracing)
- Vault (for secrets)
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci --only=production
EXPOSE 3100
HEALTHCHECK CMD curl -f http://localhost:3100/health || exit 1
CMD ["node", "server.js"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: production-agent
spec:
  replicas: 2
  selector:
    matchLabels:
      app: production-agent
  template:
    metadata:
      labels:
        app: production-agent
    spec:
      containers:
      - name: agent
        image: production-agent:3.0.0
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3100
          initialDelaySeconds: 30
          periodSeconds: 30
```

## Monitoring Setup

### Prometheus Configuration
```yaml
scrape_configs:
  - job_name: 'production-agent'
    static_configs:
      - targets: ['production-agent:3100']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Alert Rules
```yaml
groups:
  - name: production-agent
    rules:
      - alert: HighErrorRate
        expr: rate(errors_total[5m]) > 0.05
        annotations:
          summary: "High error rate detected"
      - alert: HighLatency
        expr: http_request_duration_seconds{quantile="0.95"} > 1
        annotations:
          summary: "High latency detected"
```

## Security Configuration

### JWT Setup
```javascript
const jwt = require('jsonwebtoken');

const config = {
  issuer: 'https://auth.example.com',
  audience: 'production-agent',
  publicKey: fs.readFileSync('public.pem')
};
```

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false
});
```

## Compliance Features

### Audit Trail
Every request is logged with:
- User identity
- Action performed
- Timestamp
- Input/output data (redacted)
- Compliance framework applied

### Data Classification
```yaml
classification:
  public: No restrictions
  internal: Company use only
  confidential: Restricted access
  restricted: Need-to-know basis
```

## Performance Optimization

### Caching Strategy
- Redis for session management
- 15-minute cache for static responses
- Adaptive compression for large payloads

### Resource Management
- Connection pooling
- Request timeout: 30 seconds
- Graceful shutdown handling
- Circuit breaker pattern

## Upgrade Path

### To Level 4 (Enterprise)
Add:
- Full ISO 42001 certification
- SOX compliance
- HIPAA support
- Forensic audit trails
- Multi-region deployment
- Disaster recovery

## Testing

### Load Testing
```bash
# Using k6
k6 run --vus 100 --duration 30s load-test.js
```

### Security Testing
```bash
# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://production-agent:3100
```

## Operational Runbook

### Health Check
```bash
curl http://production-agent:3100/health
```

### Metrics Check
```bash
curl http://production-agent:3100/metrics | grep -E "http_requests|errors_total"
```

### Log Analysis
```bash
# View error logs
curl -X GET "elasticsearch:9200/agent-logs/_search?q=level:error"
```

## Support
- Documentation: https://docs.example.com/production-agent
- Support: support@example.com
- On-call: Use PagerDuty integration