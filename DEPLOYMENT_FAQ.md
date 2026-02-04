# OSSA Agent Deployment FAQ

**Frequently asked questions about deploying OSSA agents**

---

## Table of Contents

- [General Questions](#general-questions)
- [Platform Selection](#platform-selection)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Performance](#performance)
- [Security](#security)
- [Cost](#cost)
- [Advanced Topics](#advanced-topics)

---

## General Questions

### What is an OSSA agent?

An OSSA (Open Standard Service Agent) agent is a containerized service that implements the OSSA v0.4.x specification. It exposes a standardized API for agent operations and can run autonomously or as part of an agent mesh.

---

### What are the minimum requirements to deploy an agent?

**Required**:
- Docker or container runtime
- 256MB RAM minimum (512MB recommended)
- 0.25 CPU minimum (0.5 CPU recommended)
- Network connectivity
- OSSA Buildkit CLI

**Platform-specific**:
- Cloud platform account (Railway, AWS, GCP, etc.)
- kubectl for Kubernetes deployments
- Platform-specific CLI tools

---

### How long does it take to deploy an agent?

**Quick deployments**:
- Railway: ~5 minutes
- Docker Compose (local): ~8 minutes
- Render: ~10 minutes

**Production deployments**:
- Kubernetes: ~30 minutes (first time)
- Multi-region: ~1-2 hours
- Enterprise setup: 1-2 days

---

### Can I deploy multiple agents?

Yes! You can deploy:
- Multiple instances of the same agent (horizontal scaling)
- Different agent types (agent mesh)
- Multi-region deployments
- Multi-cloud deployments

See the [Architecture Guide](./DEPLOYMENT_ARCHITECTURE.md#multi-agent-architecture-small-scale) for patterns.

---

### Do I need Kubernetes?

No. Kubernetes is recommended for production enterprise deployments, but you can use:

**Simpler alternatives**:
- Railway (easiest)
- Render
- Fly.io
- Docker Compose
- Heroku

**When you need Kubernetes**:
- Complex multi-agent systems
- Advanced networking requirements
- Enterprise compliance requirements
- Fine-grained control

---

## Platform Selection

### Which platform should I choose?

**Choose Railway if**:
- You want the fastest deployment (5 min)
- You're prototyping
- You prefer Git-based deploys
- Budget: ~$5-20/month

**Choose Kubernetes if**:
- You need production-grade orchestration
- You're running multiple agents
- You need advanced features
- Budget: ~$50+/month

**Choose Fly.io if**:
- You need global edge deployment
- Low latency is critical
- Multi-region by default
- Budget: ~$3-30/month

[See full comparison →](./DEPLOYMENT_PLATFORMS.md#platform-comparison)

---

### Can I migrate between platforms later?

Yes! OSSA agents are containerized and follow standard practices, making migration relatively straightforward.

**Migration path**:
```bash
# Export for new platform
buildkit export kubernetes ./my-agent --output ./k8s-deploy

# Deploy to new platform
kubectl apply -f ./k8s-deploy/

# Verify deployment
kubectl get pods

# Cut over traffic
# Update DNS or load balancer

# Decommission old platform
railway down  # or equivalent
```

[See Migration Guide →](./DEPLOYMENT_PLATFORMS.md#migration)

---

### What's the difference between PaaS and Kubernetes?

| Aspect | PaaS (Railway, Render) | Kubernetes |
|--------|------------------------|------------|
| **Ease of Use** | Very easy | Complex |
| **Setup Time** | 5-10 minutes | 30+ minutes |
| **Flexibility** | Limited | Very flexible |
| **Cost** | $5-50/month | $50+/month |
| **Scaling** | Automatic | Configurable |
| **Best For** | Small apps | Enterprise |

---

## Configuration

### What environment variables are required?

**Minimum required**:
```bash
AGENT_ID=my-agent-001       # Unique identifier
API_PORT=3000                # API port
LOG_LEVEL=info               # Logging level
```

**Recommended**:
```bash
AGENT_NAME="My Agent"        # Human-readable name
OSSA_VERSION=0.4.1           # OSSA version
NODE_ENV=production          # Environment
DATABASE_URL=postgresql://...  # Database connection
REDIS_URL=redis://...        # Cache connection
```

[See complete reference →](./DEPLOYMENT_OPERATIONS.md#environment-variables)

---

### How do I manage secrets?

**Never commit secrets to Git!**

**Good practices**:

```bash
# Kubernetes
kubectl create secret generic agent-secrets \
  --from-literal=api-key=xxx \
  --from-literal=database-url=postgresql://...

# Railway
railway variables set API_KEY=xxx

# Render
# Set via dashboard: Environment → Add Environment Variable

# Docker Compose
# Use .env file (add to .gitignore)
```

[See Security Guide →](./DEPLOYMENT_SECURITY.md#secret-management)

---

### How do I configure multiple environments?

**Pattern 1: Separate deployments**
```
- Production: my-agent-prod
- Staging: my-agent-staging
- Development: my-agent-dev
```

**Pattern 2: Configuration per environment**
```bash
# Load config based on NODE_ENV
const config = require(`./config.${process.env.NODE_ENV}.json`);
```

**Pattern 3: Namespace per environment** (Kubernetes)
```bash
kubectl create namespace production
kubectl create namespace staging
kubectl create namespace development
```

---

### Can I use a custom domain?

Yes! All major platforms support custom domains.

**Railway**:
```bash
railway domain add my-agent.example.com
# Add CNAME: my-agent.example.com → your-app.railway.app
```

**Kubernetes**:
```yaml
# ingress.yaml
spec:
  tls:
    - hosts:
        - my-agent.example.com
      secretName: agent-tls
  rules:
    - host: my-agent.example.com
```

**Automatic HTTPS** is provided by all platforms.

---

## Troubleshooting

### My agent won't start. What do I check?

**1. Check logs first**:
```bash
# Kubernetes
kubectl logs my-agent-pod

# Docker Compose
docker-compose logs agent

# Railway
railway logs
```

**2. Common issues**:
- Missing environment variables
- Database connection failed
- Port already in use
- Insufficient memory

**3. Verify environment**:
```bash
# Check env vars are set
kubectl exec my-agent-pod -- env | grep AGENT

# Check resources
kubectl describe pod my-agent-pod | grep -A 5 "Limits"
```

[See full troubleshooting guide →](./DEPLOYMENT_OPERATIONS.md#troubleshooting)

---

### Why is my agent slow?

**Common causes**:
1. **Database queries**: Slow queries or missing indexes
2. **Resource limits**: CPU/memory throttling
3. **Network latency**: External API calls
4. **No caching**: Fetching same data repeatedly

**Quick fixes**:
```bash
# Scale up resources (Kubernetes)
kubectl set resources deployment/my-agent \
  --limits=cpu=2,memory=2Gi

# Add horizontal replicas
kubectl scale deployment my-agent --replicas=5

# Enable caching
kubectl set env deployment/my-agent REDIS_URL=redis://redis:6379
```

[See Performance Guide →](./DEPLOYMENT_OPERATIONS.md#performance-optimization)

---

### How do I debug in production?

**Safe debugging approaches**:

```bash
# 1. View logs
kubectl logs -f my-agent-pod

# 2. Port forward for local testing
kubectl port-forward my-agent-pod 3000:3000

# 3. Check metrics
curl http://localhost:9090/metrics

# 4. SSH into container (use sparingly)
kubectl exec -it my-agent-pod -- /bin/sh

# 5. Use debug sidecar
kubectl debug my-agent-pod -it --image=busybox
```

**Never**:
- Stop production traffic
- Modify code in production
- Expose debug ports publicly

[See Operations Guide →](./DEPLOYMENT_OPERATIONS.md#debugging-toolkit)

---

### How do I rollback a bad deployment?

**Kubernetes**:
```bash
# Rollback to previous version
kubectl rollout undo deployment/my-agent

# Rollback to specific revision
kubectl rollout history deployment/my-agent
kubectl rollout undo deployment/my-agent --to-revision=2
```

**Railway/Render**:
- Via dashboard: Deployments → Select previous deployment → Redeploy

**Docker Compose**:
```bash
# Pull previous image
docker pull my-agent:previous-tag

# Update docker-compose.yml
image: my-agent:previous-tag

# Redeploy
docker-compose up -d
```

---

## Performance

### How do I scale my agent?

**Horizontal scaling** (more instances):
```bash
# Kubernetes
kubectl scale deployment my-agent --replicas=10

# Kubernetes with auto-scaling
kubectl autoscale deployment my-agent \
  --cpu-percent=70 --min=2 --max=10
```

**Vertical scaling** (more resources):
```bash
# Increase CPU/memory
kubectl set resources deployment/my-agent \
  --requests=cpu=1,memory=1Gi \
  --limits=cpu=2,memory=2Gi
```

[See Scaling Guide →](./DEPLOYMENT_OPERATIONS.md#scaling-strategies)

---

### What's the maximum throughput I can achieve?

Depends on:
- Agent complexity
- Resource allocation
- Database performance
- Network latency

**Benchmarks** (typical Node.js agent):
- Simple GET request: ~10,000 req/sec (single instance)
- Database query: ~1,000 req/sec
- Complex operation: ~100 req/sec

**Optimization tips**:
1. Enable connection pooling
2. Add caching (Redis)
3. Use read replicas
4. Horizontal scaling
5. Load balancing

[See Performance Guide →](./DEPLOYMENT_OPERATIONS.md#performance-optimization)

---

### How much memory does an agent need?

**Minimum**: 256MB (basic operation)
**Recommended**: 512MB (comfortable headroom)
**Production**: 1GB+ (with caching and buffering)

**Monitor actual usage**:
```bash
kubectl top pod my-agent-pod
```

**Set appropriate limits**:
```yaml
resources:
  requests:
    memory: 512Mi  # Baseline
  limits:
    memory: 1Gi    # Maximum
```

---

## Security

### How do I secure my agent?

**Essential security practices**:

1. **Use HTTPS**: Always enforce TLS
2. **Authentication**: Require API keys or JWT tokens
3. **Input validation**: Validate all user input
4. **Rate limiting**: Prevent abuse
5. **Security headers**: Use Helmet.js or equivalent
6. **Regular updates**: Keep dependencies updated
7. **Secret management**: Use proper secret storage
8. **Network policies**: Restrict network access

[See Security Guide →](./DEPLOYMENT_SECURITY.md)

---

### Should I run as root?

**No!** Never run containers as root.

**Good practice**:
```dockerfile
# Create non-root user
RUN addgroup -g 1000 agent && \
    adduser -D -u 1000 -G agent agent

# Switch to non-root user
USER agent
```

**Kubernetes security context**:
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
```

---

### How do I handle sensitive data?

**Best practices**:

1. **Encrypt in transit**: Use HTTPS/TLS
2. **Encrypt at rest**: Enable database encryption
3. **Mask in logs**: Don't log sensitive data
4. **Use secrets**: Never hardcode credentials
5. **Limit access**: Principle of least privilege
6. **Audit logs**: Track access to sensitive data

```javascript
// Mask sensitive data in logs
function sanitizeLog(data) {
  const sanitized = { ...data };
  delete sanitized.password;
  delete sanitized.api_key;
  delete sanitized.credit_card;
  return sanitized;
}
```

[See Data Protection Guide →](./DEPLOYMENT_SECURITY.md#data-protection)

---

## Cost

### How much will it cost to run an agent?

**Development/Hobby**:
- Railway: $5/month
- Render: $7/month
- Fly.io: $3/month
- Docker (self-hosted): $0 (infrastructure cost only)

**Small Production**:
- Railway: $15-30/month
- Kubernetes (managed): $50-100/month
- Render: $25-50/month

**Enterprise**:
- Kubernetes multi-region: $500-5000+/month
- Depends heavily on scale and requirements

[See Cost Guide →](./DEPLOYMENT_ARCHITECTURE.md#cost-optimization)

---

### How can I reduce costs?

**Strategies**:

1. **Right-size resources**: Don't over-provision
2. **Use spot instances**: 50-90% discount
3. **Auto-scale to zero**: Scale down during off-hours
4. **Optimize queries**: Reduce database load
5. **Use caching**: Reduce compute needs
6. **CDN for static assets**: Reduce bandwidth
7. **Reserved instances**: For predictable workloads

```bash
# Example: Scale to zero during nights/weekends
# Use KEDA or CronJob
0 20 * * * kubectl scale deployment my-agent --replicas=0
0 8 * * 1-5 kubectl scale deployment my-agent --replicas=3
```

---

### What's included in managed database pricing?

**Typically included**:
- Automated backups
- High availability (depending on tier)
- Automatic updates
- Monitoring
- SSL/TLS encryption

**Not included**:
- Backup storage (may be extra)
- Additional replicas
- Enhanced performance tiers
- Cross-region replication

---

## Advanced Topics

### Can I deploy to multiple regions?

Yes! Multi-region deployment provides:
- Lower latency (closer to users)
- High availability (region failover)
- Compliance (data residency)

**Approaches**:
1. **Multi-region cloud platform** (Fly.io, AWS, GCP)
2. **Kubernetes federation**
3. **DNS-based routing** (Route 53, Cloudflare)

[See Multi-Region Guide →](./DEPLOYMENT_ARCHITECTURE.md#multi-region-deployment)

---

### How do I implement blue-green deployment?

**Blue-Green Strategy**: Run two identical environments, switch traffic instantly

**Kubernetes approach**:
```bash
# Deploy green (new version)
kubectl apply -f deployment-green.yaml

# Verify green works
kubectl port-forward deployment/my-agent-green 3001:3000

# Switch traffic to green
kubectl patch service my-agent -p '{"spec":{"selector":{"version":"green"}}}'

# Keep blue running for rollback
# Remove blue after verification period
```

**Platform approach**:
- Railway: Deploy to new service, update domain
- Render: Use preview environments
- Heroku: Use pipelines

---

### Can I use a service mesh?

Yes! Service meshes (Istio, Linkerd) provide:
- Traffic management
- Security (mTLS)
- Observability
- Resilience

**Example: Istio**:
```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: my-agent
spec:
  hosts:
    - my-agent
  http:
    - match:
        - headers:
            canary:
              exact: "true"
      route:
        - destination:
            host: my-agent
            subset: v2
    - route:
        - destination:
            host: my-agent
            subset: v1
          weight: 90
        - destination:
            host: my-agent
            subset: v2
          weight: 10
```

---

### How do I monitor multiple agents?

**Centralized monitoring**:

1. **Metrics**: Prometheus + Grafana
2. **Logs**: ELK Stack or Loki
3. **Traces**: Jaeger or Zipkin
4. **APM**: DataDog, New Relic

**Setup**:
```bash
# Install Prometheus Operator
helm install prometheus prometheus-community/kube-prometheus-stack

# Configure ServiceMonitor for all agents
kubectl apply -f - << EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ossa-agents
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: ossa-agent
  endpoints:
    - port: metrics
EOF
```

[See Monitoring Guide →](./DEPLOYMENT_OPERATIONS.md#monitoring--observability)

---

### Can I run agents on edge devices?

Yes! OSSA agents can run on:
- Raspberry Pi (ARM architecture)
- IoT devices (with sufficient resources)
- Edge servers

**Requirements**:
- Docker or container runtime
- 512MB+ RAM
- Network connectivity
- ARM-compatible images (use multi-arch builds)

**Build multi-arch image**:
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t my-agent:latest \
  --push .
```

---

## Still Have Questions?

### Resources

- 📚 [Full Documentation](./DEPLOYMENT_README.md)
- 🚀 [Quick Start Guide](./DEPLOYMENT_QUICKSTART.md)
- 🏗️ [Platform Guide](./DEPLOYMENT_PLATFORMS.md)
- 🛠️ [Operations Guide](./DEPLOYMENT_OPERATIONS.md)
- 🔒 [Security Guide](./DEPLOYMENT_SECURITY.md)
- 🏛️ [Architecture Guide](./DEPLOYMENT_ARCHITECTURE.md)

### Community

- 💬 [Discord](https://discord.gg/ossa)
- 🐙 [GitHub](https://github.com/ossa/buildkit)
- 📧 [Email Support](mailto:support@ossa.io)
- 📝 [Stack Overflow](https://stackoverflow.com/questions/tagged/ossa)

### Commercial Support

For enterprise support, training, and consulting:
- 🏢 [Contact BlueFly.io](https://bluefly.io/contact)
- 📅 [Schedule a Call](https://calendly.com/bluefly)

---

**Last Updated**: 2026-02-04
