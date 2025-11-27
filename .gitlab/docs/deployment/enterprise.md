# Enterprise Deployment Guide

Complete guide for deploying OSSA agents in enterprise environments with security, scalability, and compliance requirements.

## Deployment Architectures

### 1. Kubernetes (Recommended)

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ossa-agent
  namespace: ossa-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ossa-agent
  template:
    metadata:
      labels:
        app: ossa-agent
    spec:
      containers:
      - name: agent
        image: registry.company.com/ossa-agent:0.2.6
        ports:
        - containerPort: 8080
        env:
        - name: OSSA_VERSION
          value: "0.2.6"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  ossa-agent:
    image: ossa-agent:0.2.6
    ports:
      - "8080:8080"
    environment:
      - OSSA_VERSION=0.2.6
      - NODE_ENV=production
    volumes:
      - ./config:/app/config:ro
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - ossa-network
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  redis:
    image: redis:7-alpine
    networks:
      - ossa-network

networks:
  ossa-network:
    driver: bridge
```

### 3. Serverless (AWS Lambda)

```typescript
// lambda-handler.ts
import { OSSAAgent } from '@bluefly/openstandardagents';

export const handler = async (event: any) => {
  const agent = new OSSAAgent({
    manifest: process.env.AGENT_MANIFEST,
    version: '0.2.6'
  });
  
  const result = await agent.execute(event);
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};
```

## Security Configuration

### 1. Network Security

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ossa-agent-policy
spec:
  podSelector:
    matchLabels:
      app: ossa-agent
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ossa-production
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443
```

### 2. Secrets Management

```bash
# Using Kubernetes Secrets
kubectl create secret generic ossa-secrets \
  --from-literal=api-key=$API_KEY \
  --from-literal=db-password=$DB_PASSWORD \
  -n ossa-production

# Using AWS Secrets Manager
aws secretsmanager create-secret \
  --name ossa/production/api-key \
  --secret-string "$API_KEY"
```

### 3. TLS/mTLS

```yaml
# ingress-tls.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ossa-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - agents.company.com
    secretName: ossa-tls
  rules:
  - host: agents.company.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ossa-agent
            port:
              number: 8080
```

## High Availability

### Load Balancing

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ossa-agent
spec:
  type: LoadBalancer
  selector:
    app: ossa-agent
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  sessionAffinity: ClientIP
```

### Auto-Scaling

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ossa-agent-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ossa-agent
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Monitoring & Observability

### Prometheus Metrics

```yaml
# servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ossa-agent
spec:
  selector:
    matchLabels:
      app: ossa-agent
  endpoints:
  - port: metrics
    interval: 30s
```

### Logging

```yaml
# fluentd-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/ossa-agent*.log
      pos_file /var/log/fluentd-ossa.pos
      tag ossa.agent
      <parse>
        @type json
      </parse>
    </source>
    
    <match ossa.**>
      @type elasticsearch
      host elasticsearch.logging.svc
      port 9200
      logstash_format true
    </match>
```

### Distributed Tracing

```typescript
// tracing.ts
import { trace } from '@opentelemetry/api';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const exporter = new JaegerExporter({
  endpoint: 'http://jaeger:14268/api/traces',
});

const tracer = trace.getTracer('ossa-agent');
```

## Compliance & Audit

### Audit Logging

```typescript
// audit-logger.ts
export class AuditLogger {
  log(event: AuditEvent) {
    const entry = {
      timestamp: new Date().toISOString(),
      user: event.user,
      action: event.action,
      resource: event.resource,
      result: event.result,
      ip: event.ip,
      metadata: event.metadata
    };
    
    // Send to SIEM
    this.sendToSIEM(entry);
    
    // Store in audit database
    this.storeAudit(entry);
  }
}
```

### Compliance Mappings

**SOC2 Controls**:
- CC6.1: Logical access controls
- CC6.6: Encryption
- CC7.2: System monitoring

**FedRAMP Controls**:
- AC-2: Account Management
- AU-2: Audit Events
- SC-7: Boundary Protection

**HIPAA Requirements**:
- §164.308(a)(4): Information Access Management
- §164.312(a)(1): Access Control
- §164.312(e)(1): Transmission Security

## Disaster Recovery

### Backup Strategy

```bash
# Backup agent configurations
kubectl get configmap -n ossa-production -o yaml > backup/configmaps.yaml
kubectl get secret -n ossa-production -o yaml > backup/secrets.yaml

# Backup persistent data
velero backup create ossa-backup \
  --include-namespaces ossa-production \
  --storage-location default
```

### Recovery Procedures

```bash
# Restore from backup
velero restore create --from-backup ossa-backup

# Verify restoration
kubectl get pods -n ossa-production
kubectl logs -n ossa-production -l app=ossa-agent
```

## Performance Optimization

### Caching

```typescript
// cache-config.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: 'redis.ossa-production.svc',
  port: 6379,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true
});

export const cacheMiddleware = async (key: string, ttl: number, fn: Function) => {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const result = await fn();
  await redis.setex(key, ttl, JSON.stringify(result));
  return result;
};
```

### Connection Pooling

```typescript
// db-pool.ts
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: 'ossa',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Cost Optimization

### Resource Limits

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

### Spot Instances (AWS)

```yaml
# node-group.yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: ossa-cluster
nodeGroups:
  - name: spot-workers
    instancesDistribution:
      instanceTypes: ["t3.medium", "t3a.medium"]
      onDemandBaseCapacity: 0
      onDemandPercentageAboveBaseCapacity: 0
      spotInstancePools: 2
    minSize: 3
    maxSize: 10
```

## Deployment Checklist

### Pre-Deployment
- [ ] Security scan completed
- [ ] Load testing passed
- [ ] Backup strategy verified
- [ ] Monitoring configured
- [ ] Secrets rotated
- [ ] Documentation updated

### Deployment
- [ ] Blue-green deployment ready
- [ ] Rollback plan documented
- [ ] Health checks configured
- [ ] Traffic routing tested

### Post-Deployment
- [ ] Metrics validated
- [ ] Logs flowing correctly
- [ ] Alerts configured
- [ ] Performance baseline established
- [ ] Incident response tested

## Troubleshooting

### Common Issues

**Pod CrashLoopBackOff**:
```bash
kubectl logs -n ossa-production <pod-name> --previous
kubectl describe pod -n ossa-production <pod-name>
```

**High Memory Usage**:
```bash
kubectl top pods -n ossa-production
# Adjust resource limits
```

**Network Connectivity**:
```bash
kubectl exec -it <pod-name> -n ossa-production -- curl http://service:8080/health
```

## References

- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Security Hardening Guide](../security/hardening.md)
- [Monitoring Setup](../observability/monitoring.md)
