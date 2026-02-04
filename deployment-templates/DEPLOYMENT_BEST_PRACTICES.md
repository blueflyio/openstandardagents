# Docker and Kubernetes Deployment Best Practices

> Comprehensive guide for production-ready containerized deployments

## Table of Contents

1. [Docker Best Practices](#docker-best-practices)
2. [Kubernetes Best Practices](#kubernetes-best-practices)
3. [Security Hardening](#security-hardening)
4. [Performance Optimization](#performance-optimization)
5. [Monitoring and Observability](#monitoring-and-observability)
6. [High Availability](#high-availability)
7. [Cost Optimization](#cost-optimization)
8. [Template Usage Guide](#template-usage-guide)

---

## Docker Best Practices

### Multi-Stage Builds

**Why:** Reduces image size by separating build dependencies from runtime dependencies.

```dockerfile
# Build stage - includes dev dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build

# Production stage - only runtime dependencies
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
```

**Benefits:**
- 50-80% smaller final images
- Faster deployment times
- Reduced attack surface
- Lower storage costs

### Security Best Practices

#### 1. Use Non-Root User

```dockerfile
RUN addgroup -g 1001 -S appuser && \
    adduser -S -u 1001 -G appuser appuser

USER appuser
```

**Why:** Root access inside containers is a security risk. Compromised containers should have minimal privileges.

#### 2. Use Specific Image Tags

```dockerfile
# ❌ Bad - uses latest
FROM node:alpine

# ✅ Good - pinned version
FROM node:20.11.0-alpine3.19
```

**Why:** `latest` tag can change without notice, breaking builds and deployments.

#### 3. Scan Images for Vulnerabilities

```bash
# Using Docker Scout
docker scout cves my-image:latest

# Using Trivy
trivy image my-image:latest

# Using Snyk
snyk container test my-image:latest
```

**Integrate into CI/CD:**
```yaml
# GitLab CI example
security:scan:
  stage: test
  image: aquasec/trivy:latest
  script:
    - trivy image --severity HIGH,CRITICAL $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

#### 4. Minimize Image Layers

```dockerfile
# ❌ Bad - creates multiple layers
RUN apk add --no-cache ca-certificates
RUN apk add --no-cache tzdata
RUN apk add --no-cache dumb-init

# ✅ Good - single layer
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    dumb-init
```

#### 5. Use .dockerignore

```
# .dockerignore
node_modules
npm-debug.log
.git
.env
.env.*
*.md
tests
coverage
.vscode
.idea
```

**Why:** Reduces build context size and prevents sensitive files from being copied.

### Performance Optimization

#### 1. Leverage Build Cache

```dockerfile
# ✅ Copy package files first (rarely change)
COPY package*.json ./
RUN npm ci

# ✅ Copy source code last (changes frequently)
COPY . .
```

**Why:** Docker caches layers. If package files don't change, dependency installation is skipped.

#### 2. Use BuildKit Cache Mounts

```dockerfile
RUN --mount=type=cache,target=/root/.npm,id=npm-cache \
    npm ci --include=dev
```

**Benefits:**
- Faster builds (cache persists between builds)
- Reduced network traffic
- Lower CI costs

#### 3. Use dumb-init for PID 1

```dockerfile
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

**Why:** Handles signals properly, prevents zombie processes, ensures graceful shutdown.

### Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

**Best Practices:**
- Set appropriate `start-period` for slow-starting apps
- Keep health check endpoints lightweight
- Don't include external dependencies in health checks

---

## Kubernetes Best Practices

### Resource Management

#### 1. Always Set Resource Requests and Limits

```yaml
resources:
  requests:
    cpu: 100m      # Minimum guaranteed
    memory: 128Mi
  limits:
    cpu: 500m      # Maximum allowed
    memory: 512Mi
```

**Guidelines:**
- **Requests:** Set to average usage (measured via monitoring)
- **Limits:** Set to peak usage + 20% buffer
- **CPU:** Throttled at limit (non-breaking)
- **Memory:** Pod killed (OOMKilled) at limit

#### 2. Use Vertical Pod Autoscaler (VPA) for Right-Sizing

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  updatePolicy:
    updateMode: Auto
```

**Why:** Automatically adjusts resources based on actual usage, reducing waste.

### High Availability

#### 1. Run Multiple Replicas

```yaml
spec:
  replicas: 3  # Minimum for HA
```

**Best Practices:**
- Minimum 3 replicas for production
- Spread across availability zones
- Use Pod Disruption Budgets

#### 2. Pod Anti-Affinity

```yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app
                operator: In
                values:
                  - my-app
          topologyKey: kubernetes.io/hostname
```

**Why:** Ensures pods are spread across nodes, preventing single point of failure.

#### 3. Pod Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: my-app
```

**Why:** Ensures minimum availability during voluntary disruptions (node drains, updates).

### Health Probes Configuration

#### Liveness Probe
**Purpose:** Determines if container is alive. Failed probes restart the container.

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 30  # Wait for startup
  periodSeconds: 10        # Check every 10s
  timeoutSeconds: 5        # 5s timeout
  failureThreshold: 3      # 3 failures = restart
```

**Best Practices:**
- Set `initialDelaySeconds` > application startup time
- Keep probe endpoints lightweight
- Don't check external dependencies

#### Readiness Probe
**Purpose:** Determines if container is ready to serve traffic.

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: http
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 3
```

**Best Practices:**
- Can check external dependencies (database, cache)
- Failed readiness = removed from service endpoints
- Don't make too strict (causes flapping)

#### Startup Probe
**Purpose:** For slow-starting applications.

```yaml
startupProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 0
  periodSeconds: 10
  failureThreshold: 30  # 300s total startup time
```

**Why:** Prevents liveness probe from killing slow-starting containers.

### Deployment Strategies

#### Rolling Update (Default)

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1        # 1 extra pod during update
    maxUnavailable: 0  # Zero downtime
```

**Best for:** Stateless applications, zero-downtime deployments

#### Blue-Green Deployment

Deploy new version (green), switch traffic, keep old version (blue) for rollback.

**Implementation:** Use separate deployments + service selector change

#### Canary Deployment

Gradually shift traffic to new version.

**Tools:** Argo Rollouts, Flagger, Istio

---

## Security Hardening

### Container Security

#### 1. Security Context (Pod Level)

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  runAsGroup: 1001
  fsGroup: 1001
  seccompProfile:
    type: RuntimeDefault
```

#### 2. Security Context (Container Level)

```yaml
securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 1001
  capabilities:
    drop:
      - ALL
```

**Why:**
- `runAsNonRoot`: Prevents root execution
- `readOnlyRootFilesystem`: Prevents filesystem modifications
- `drop ALL capabilities`: Minimal privileges

#### 3. Network Policies

**Default Deny All:**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

**Then Add Specific Allow Rules:**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-ingress
spec:
  podSelector:
    matchLabels:
      app: my-app
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
```

**Best Practices:**
- Start with deny-all
- Allow only necessary traffic
- Use namespaceSelector for cross-namespace communication
- Document all network policies

### Secret Management

#### ❌ Never Store Secrets in Git

```yaml
# ❌ Bad
apiVersion: v1
kind: Secret
data:
  password: cGFzc3dvcmQxMjM=  # base64 encoded, not encrypted!
```

#### ✅ Use External Secret Management

**Option 1: Sealed Secrets**

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: my-secret
spec:
  encryptedData:
    password: AgA...encrypted...
```

**Option 2: External Secrets Operator**

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: my-secret
spec:
  secretStoreRef:
    name: vault-backend
  data:
    - secretKey: password
      remoteRef:
        key: app/password
```

**Option 3: Cloud Provider Secret Management**
- AWS Secrets Manager
- Azure Key Vault
- Google Secret Manager

### RBAC (Role-Based Access Control)

#### Principle of Least Privilege

```yaml
# ✅ Minimal permissions
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list"]
```

```yaml
# ❌ Too permissive
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
```

#### Service Account Best Practices

```yaml
# Disable auto-mount if not needed
automountServiceAccountToken: false
```

**Why:** Reduces attack surface. Only mount when pods need K8s API access.

---

## Performance Optimization

### Horizontal Pod Autoscaling (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

**Best Practices:**
- Set CPU target to 70-80%
- Set memory target to 80-90%
- Monitor for thrashing (rapid scale up/down)
- Use custom metrics for better scaling decisions

### Resource Quota and Limit Ranges

**Namespace Resource Quota:**

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
```

**Limit Ranges:**

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: mem-cpu-limit-range
spec:
  limits:
    - default:
        cpu: 500m
        memory: 512Mi
      defaultRequest:
        cpu: 100m
        memory: 128Mi
      type: Container
```

**Why:** Prevents resource hogging, enforces best practices.

### Caching Strategies

#### 1. ConfigMap and Secret Caching

```yaml
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: db-secret
        key: url
```

**Why:** Values cached in memory, faster than volume mounts.

#### 2. Persistent Volume Claims

```yaml
volumeMounts:
  - name: cache
    mountPath: /app/cache
volumes:
  - name: cache
    persistentVolumeClaim:
      claimName: app-cache-pvc
```

**Use Cases:** Application cache, compiled assets, temporary files.

---

## Monitoring and Observability

### Prometheus Metrics

#### Expose Metrics Endpoint

```javascript
// Node.js example
const promClient = require('prom-client');
const register = new promClient.Registry();

promClient.collectDefaultMetrics({ register });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

#### Annotate Pods for Scraping

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "9090"
  prometheus.io/path: "/metrics"
```

### Structured Logging

```javascript
// Use structured logging (JSON)
const logger = winston.createLogger({
  format: winston.format.json(),
  defaultMeta: {
    service: 'my-app',
    environment: process.env.NODE_ENV
  }
});

logger.info('Request processed', {
  userId: user.id,
  endpoint: req.path,
  duration: duration
});
```

**Benefits:**
- Easy parsing with log aggregators
- Better searchability
- Consistent format

### Distributed Tracing

**OpenTelemetry Example:**

```javascript
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const provider = new NodeTracerProvider();
const exporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT
});

provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();
```

### Health Check Implementation

```javascript
// Health endpoint - lightweight, no external dependencies
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Readiness endpoint - checks dependencies
app.get('/ready', async (req, res) => {
  try {
    await db.ping();
    await redis.ping();
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

---

## High Availability

### Graceful Shutdown

```javascript
// Node.js example
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');

  // Stop accepting new requests
  server.close(async () => {
    // Close database connections
    await db.close();

    // Close other connections
    await redis.quit();

    console.log('Shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30s
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 30000);
});
```

**Kubernetes Configuration:**

```yaml
lifecycle:
  preStop:
    exec:
      command: ["/bin/sh", "-c", "sleep 15"]

terminationGracePeriodSeconds: 30
```

**Why:**
- `sleep 15`: Allows time for load balancer to remove pod from rotation
- `terminationGracePeriodSeconds`: Total time before SIGKILL

### Multi-Zone Deployment

```yaml
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
            - key: app
              operator: In
              values:
                - my-app
        topologyKey: topology.kubernetes.io/zone
```

**Why:** Ensures pods spread across availability zones.

### Circuit Breaker Pattern

```javascript
// Using opossum
const CircuitBreaker = require('opossum');

const options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};

const breaker = new CircuitBreaker(fetchData, options);

breaker.fallback(() => getCachedData());
```

**Benefits:**
- Prevents cascade failures
- Faster failure detection
- Automatic recovery

---

## Cost Optimization

### Right-Sizing Resources

**Steps:**
1. Deploy with conservative estimates
2. Monitor actual usage (Prometheus/Grafana)
3. Adjust requests to P95 usage
4. Adjust limits to max observed + 20%

**Tools:**
- kubectl top pods
- Kubernetes Dashboard
- Vertical Pod Autoscaler (recommendation mode)

### Cluster Autoscaler

```yaml
# Node group annotations for AWS
metadata:
  annotations:
    cluster-autoscaler.kubernetes.io/safe-to-evict: "true"
```

**Why:** Automatically scales nodes based on pending pods, removes underutilized nodes.

### Spot/Preemptible Instances

**Best Practices:**
- Use for non-critical workloads
- Mix with on-demand instances
- Set appropriate tolerations

```yaml
tolerations:
  - key: "node.kubernetes.io/instance-lifecycle"
    operator: "Equal"
    value: "spot"
    effect: "NoSchedule"
```

### Resource Optimization Checklist

- [ ] Use Alpine-based images (smaller size)
- [ ] Enable image compression
- [ ] Use multi-stage builds
- [ ] Remove unnecessary dependencies
- [ ] Enable HPA for dynamic scaling
- [ ] Use spot instances for dev/test
- [ ] Set appropriate resource requests/limits
- [ ] Monitor and right-size regularly

---

## Template Usage Guide

### Using Handlebars Templates

#### 1. Install Handlebars CLI

```bash
npm install -g handlebars
```

#### 2. Create Values File

```yaml
# values.yaml
projectName: my-application
namespace: production
replicas: 3
containerPort: 3000
# ... other values
```

#### 3. Render Template

```bash
# Using Handlebars CLI
handlebars deployment.yaml.hbs -f values.yaml > deployment.yaml

# Or using Node.js
node render-template.js
```

#### 4. Example Render Script

```javascript
// render-template.js
const Handlebars = require('handlebars');
const fs = require('fs');
const yaml = require('js-yaml');

// Register helpers
Handlebars.registerHelper('base64', (str) => {
  return Buffer.from(str).toString('base64');
});

Handlebars.registerHelper('indent', (count, str) => {
  const spaces = ' '.repeat(count);
  return str.split('\n').join(`\n${spaces}`);
});

// Load template and values
const template = Handlebars.compile(
  fs.readFileSync('deployment.yaml.hbs', 'utf8')
);
const values = yaml.load(fs.readFileSync('values.yaml', 'utf8'));

// Render
const output = template(values);
fs.writeFileSync('deployment.yaml', output);
```

### GitLab CI/CD Integration

```yaml
# .gitlab-ci.yml
deploy:production:
  stage: deploy
  image: alpine/k8s:1.28.0
  script:
    # Install dependencies
    - apk add --no-cache nodejs npm
    - npm install -g handlebars js-yaml

    # Render templates
    - node render-templates.js

    # Apply to cluster
    - kubectl apply -f kubernetes/

    # Wait for rollout
    - kubectl rollout status deployment/my-app -n production
  only:
    - main
  environment:
    name: production
    url: https://api.example.com
```

### Helm Chart Alternative

For more complex deployments, consider using Helm:

```bash
helm create my-app
```

**Benefits:**
- Built-in templating
- Package management
- Version control
- Dependency management

---

## Security Checklist

### Pre-Deployment

- [ ] Scan images for vulnerabilities
- [ ] No secrets in Git
- [ ] Use non-root user
- [ ] Read-only root filesystem
- [ ] Drop all capabilities
- [ ] Set security contexts
- [ ] Enable network policies
- [ ] Configure RBAC with least privilege
- [ ] Use TLS for all external communication
- [ ] Enable Pod Security Admission

### Post-Deployment

- [ ] Monitor for CVEs
- [ ] Regular image updates
- [ ] Audit logs enabled
- [ ] Rotate secrets regularly
- [ ] Review RBAC permissions
- [ ] Test disaster recovery
- [ ] Monitor security metrics

---

## Production Readiness Checklist

### Reliability

- [ ] Multiple replicas (≥3)
- [ ] Pod Disruption Budget configured
- [ ] Health probes configured
- [ ] Graceful shutdown implemented
- [ ] Resource limits set
- [ ] HPA configured
- [ ] Multi-zone deployment

### Observability

- [ ] Structured logging
- [ ] Metrics exposed
- [ ] Distributed tracing
- [ ] Alerts configured
- [ ] Dashboards created
- [ ] Log aggregation setup

### Security

- [ ] Non-root user
- [ ] Network policies
- [ ] RBAC configured
- [ ] Secrets encrypted
- [ ] Image scanning
- [ ] Security contexts

### Performance

- [ ] Resource requests/limits tuned
- [ ] Caching implemented
- [ ] Database connection pooling
- [ ] Compression enabled
- [ ] CDN for static assets

### Operations

- [ ] CI/CD pipeline
- [ ] Automated tests
- [ ] Rollback procedure documented
- [ ] Runbooks created
- [ ] On-call rotation defined
- [ ] Incident response plan

---

## Additional Resources

### Documentation

- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [12-Factor App](https://12factor.net/)
- [CNCF Cloud Native Trail Map](https://github.com/cncf/trailmap)

### Tools

- **Image Scanning:** Trivy, Snyk, Docker Scout
- **Secret Management:** Sealed Secrets, External Secrets Operator
- **Monitoring:** Prometheus, Grafana, Datadog
- **Service Mesh:** Istio, Linkerd
- **GitOps:** Argo CD, Flux

### Books

- "Kubernetes Best Practices" by Brendan Burns
- "Production Kubernetes" by Josh Rosso
- "The DevOps Handbook" by Gene Kim

---

## Troubleshooting Guide

### Pod Crashes (CrashLoopBackOff)

```bash
# Check logs
kubectl logs <pod-name> -n <namespace>

# Check previous logs
kubectl logs <pod-name> -n <namespace> --previous

# Describe pod for events
kubectl describe pod <pod-name> -n <namespace>
```

**Common Causes:**
- Application error
- Missing environment variables
- Failed health checks
- OOMKilled (memory limit exceeded)

### Image Pull Errors

```bash
# Check image pull secret
kubectl get secret <secret-name> -n <namespace> -o yaml

# Test image pull
docker pull <image>
```

**Common Causes:**
- Incorrect credentials
- Missing image pull secret
- Private registry not accessible

### Network Issues

```bash
# Test DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup <service-name>

# Test connectivity
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -- curl http://<service>
```

**Common Causes:**
- Network policies blocking traffic
- Service selector mismatch
- DNS issues

### Performance Issues

```bash
# Check resource usage
kubectl top pods -n <namespace>

# Check node resources
kubectl top nodes

# Check HPA status
kubectl get hpa -n <namespace>
```

---

## Conclusion

Production-ready deployments require careful attention to:

1. **Security:** Defense in depth, least privilege, secret management
2. **Reliability:** High availability, graceful degradation, fault tolerance
3. **Observability:** Logging, metrics, tracing, alerting
4. **Performance:** Resource optimization, autoscaling, caching
5. **Operations:** Automation, documentation, incident response

These templates and practices provide a solid foundation. Adapt them to your specific requirements and continuously improve based on monitoring and feedback.

---

**Version:** 1.0.0
**Last Updated:** 2026-02-04
**Maintainer:** BlueFly.io DevOps Team
