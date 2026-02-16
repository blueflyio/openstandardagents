# Complete OSSA Agent Deployment Workflow

End-to-end example of deploying an OSSA agent from development to production with CI/CD automation.

## Table of Contents
1. [Project Setup](#project-setup)
2. [Local Development](#local-development)
3. [Deploy to Staging](#deploy-to-staging)
4. [CI/CD Setup](#cicd-setup)
5. [Deploy to Production](#deploy-to-production)
6. [Monitoring & Rollback](#monitoring--rollback)
7. [Multi-Cloud Deployment](#multi-cloud-deployment)

## Project Setup

### 1. Create OSSA Manifest

Create `customer-support-agent.ossa.yaml`:

```yaml
apiVersion: ossa/v0.4.5
kind: Agent
metadata:
  name: customer-support-agent
  version: "1.0.0"
  description: AI-powered customer support agent
  labels:
    team: support
    environment: production

spec:
  role: Customer Support Agent

  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.7
    maxTokens: 2048

  capabilities:
    - customer-inquiry
    - ticket-resolution
    - knowledge-base-search

  tools:
    - name: search_kb
      type: function
      description: Search knowledge base

    - name: create_ticket
      type: function
      description: Create support ticket

  constraints:
    resources:
      limits:
        cpu: "1000m"
        memory: "2Gi"
      requests:
        cpu: "500m"
        memory: "1Gi"

  runtime:
    image: node:20-alpine
    port: 3000
```

### 2. Initialize Git Repository

```bash
# Initialize repository
git init
git add customer-support-agent.ossa.yaml
git commit -m "Initial OSSA manifest"

# Add remote
git remote add origin https://gitlab.com/myorg/customer-support-agent.git
git push -u origin main
```

### 3. Create Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
```

## Local Development

### 1. Validate Manifest

```bash
# Validate OSSA manifest
ossa validate customer-support-agent.ossa.yaml

# Output:
# ✓ Manifest is valid
# ✓ Schema version: v0.4.1
# ✓ All required fields present
```

### 2. Build Docker Image

```bash
# Build image
docker build -t customer-support-agent:dev .

# Tag for registry
docker tag customer-support-agent:dev ghcr.io/myorg/customer-support-agent:dev
```

### 3. Deploy Locally

```bash
# Deploy to Docker locally
ossa deploy customer-support-agent.ossa.yaml \
  --platform docker \
  --env dev \
  --port 3000 \
  --registry ghcr.io/myorg/customer-support-agent:dev

# Output:
# Deploying agent: customer-support-agent.ossa.yaml
# Platform: docker
#
# ✓ Deployed customer-support-agent in Docker container
#   Instance ID: agent-abc123
#   Endpoint: http://localhost:3000
#   Environment: dev
#   Platform: docker
```

### 4. Test Locally

```bash
# Check health
curl http://localhost:3000/health

# Test agent
curl -X POST http://localhost:3000/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": "How do I reset my password?",
    "context": {}
  }'
```

## Deploy to Staging

### 1. Push Image to Registry

```bash
# Login to registry
docker login ghcr.io -u myorg -p $GITHUB_TOKEN

# Push image
docker push ghcr.io/myorg/customer-support-agent:dev
```

### 2. Deploy to Staging Kubernetes

```bash
# Deploy with interactive mode
ossa deploy customer-support-agent.ossa.yaml --interactive

# Select options:
# - Platform: Kubernetes
# - Environment: staging
# - Namespace: staging
# - Replicas: 2
# - Registry: ghcr.io/myorg/customer-support-agent:dev

# Output:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Deployment Plan:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   Agent: customer-support-agent
#   Version: 1.0.0
#   Environment: staging
#   Platform: kubernetes
#   Namespace: staging
#   Replicas: 2
#   Registry: ghcr.io/myorg/customer-support-agent:dev
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# Proceed with deployment? Yes
#
# ✓ Deployed customer-support-agent to Kubernetes
#
# Deployment Details:
#   Instance ID: k8s-staging-abc123
#   Endpoint: http://customer-support-agent-svc.staging.svc.cluster.local
#   Environment: staging
#   Platform: kubernetes
#
# Platform Details:
#   deploymentName: ossa-customer-support-agent
#   serviceName: ossa-customer-support-agent-svc
#   namespace: staging
#
# ✓ Health check passed - healthy
#   2/2 replicas available
#
# Rollback: ossa rollback k8s-staging-abc123
```

### 3. Verify Staging Deployment

```bash
# Check deployment status
kubectl get deployment ossa-customer-support-agent -n staging

# Check pods
kubectl get pods -n staging -l ossa.io/agent=customer-support-agent

# View logs
kubectl logs -f deployment/ossa-customer-support-agent -n staging

# Test endpoint
kubectl port-forward svc/ossa-customer-support-agent-svc 3000:80 -n staging
curl http://localhost:3000/health
```

## CI/CD Setup

### 1. Setup GitLab CI

Copy deployment template:

```bash
cp templates/ci-cd/gitlab-ci.deploy.yml .gitlab-ci.yml
```

Configure variables in `.gitlab-ci.yml`:

```yaml
variables:
  AGENT_MANIFEST: "customer-support-agent.ossa.yaml"
  DEPLOY_PLATFORM: "kubernetes"
  KUBERNETES_NAMESPACE: "production"
  DOCKER_REGISTRY: "${CI_REGISTRY_IMAGE}"
```

### 2. Configure GitLab Environment Variables

In GitLab UI (Settings → CI/CD → Variables):

```bash
# Kubernetes
KUBECONFIG: <base64-encoded-kubeconfig>

# Container Registry
CI_REGISTRY_USER: <username>
CI_REGISTRY_PASSWORD: <password>

# Health Check Settings
HEALTH_CHECK_TIMEOUT: 120
ROLLBACK_ON_FAILURE: true
```

### 3. Create Kubernetes Namespace

```bash
# Create production namespace
kubectl create namespace production

# Label namespace
kubectl label namespace production environment=production

# Create image pull secret
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=myorg \
  --docker-password=$GITHUB_TOKEN \
  -n production
```

### 4. Commit and Push

```bash
# Commit CI/CD configuration
git add .gitlab-ci.yml
git commit -m "Add GitLab CI/CD deployment automation"
git push origin main
```

## Deploy to Production

### 1. Trigger Pipeline

```bash
# Push changes to trigger pipeline
git tag v1.0.0
git push origin v1.0.0

# Or manually trigger in GitLab UI
```

### 2. Pipeline Stages

**Stage 1: Validate**
```
validate:manifest
  ✓ Validating OSSA manifest...
  ✓ Manifest is valid
```

**Stage 2: Build**
```
build:image
  ✓ Building container image...
  ✓ Pushing to registry: ghcr.io/myorg/customer-support-agent:abc123
  ✓ Tagged: latest
```

**Stage 3: Deploy Staging**
```
deploy:staging
  ✓ Deploying to staging...
  ✓ Deployed customer-support-agent
  ✓ Endpoint: http://staging.example.com
```

**Stage 4: Deploy Production (Manual)**
```
deploy:production
  ⏸ Waiting for manual approval...

  # Click "Play" button in GitLab UI

  ✓ Deploying to production...
  ✓ Deployed customer-support-agent
  ✓ Endpoint: https://api.example.com
```

**Stage 5: Verify**
```
verify:health
  ✓ Verifying deployment health...
  ✓ Health check attempt 1: Passed
  ✓ Health check passed!
  ✓ 5/5 replicas available
```

### 3. Manual Production Deployment

Alternatively, deploy manually:

```bash
# Build and push production image
docker build -t ghcr.io/myorg/customer-support-agent:v1.0.0 .
docker push ghcr.io/myorg/customer-support-agent:v1.0.0

# Deploy to production
ossa deploy customer-support-agent.ossa.yaml \
  --platform kubernetes \
  --env production \
  --namespace production \
  --replicas 5 \
  --registry ghcr.io/myorg/customer-support-agent:v1.0.0 \
  --health-check \
  --verify
```

## Monitoring & Rollback

### 1. Monitor Deployment

```bash
# Check deployment status
ossa status k8s-prod-abc123

# Watch pods
kubectl get pods -n production -l ossa.io/agent=customer-support-agent -w

# View metrics
kubectl top pod -n production -l ossa.io/agent=customer-support-agent

# View logs
kubectl logs -f deployment/ossa-customer-support-agent -n production
```

### 2. Setup Monitoring Dashboards

**Prometheus Metrics**:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: customer-support-agent
  namespace: production
spec:
  selector:
    matchLabels:
      ossa.io/agent: customer-support-agent
  endpoints:
    - port: metrics
      path: /metrics
      interval: 30s
```

**Grafana Dashboard**:
- Import OSSA agent dashboard
- Configure alerts for:
  - High error rate (>5%)
  - High response time (>1s)
  - Low replica count
  - Memory pressure

### 3. Rollback on Issue

**Scenario**: Production deployment has high error rate

```bash
# Check deployment health
ossa health-check k8s-prod-abc123

# Output:
# ✗ Health check degraded - unhealthy
#   Error rate: 12.5%
#   Response time: 2.3s

# Rollback immediately
ossa rollback k8s-prod-abc123 --force

# Output:
# Rolling back deployment...
# ✓ Rolled back customer-support-agent by 1 revision(s)
#   Previous version: v1.0.0
#   Rolled back to: v0.9.5
#
# Verifying deployment health...
# ✓ Health verification passed - healthy
#   Error rate: 0.2%
#   Response time: 0.3s
```

### 4. Automatic Rollback (CI/CD)

If health check fails in CI/CD pipeline:

```
verify:health
  ✗ Health check failed after 120 seconds

rollback:production
  ✓ Rolling back production deployment...
  ✓ Rolled back customer-support-agent by 1 revision(s)
  ✓ Health verification passed
```

## Multi-Cloud Deployment

Deploy the same agent to multiple cloud providers for redundancy.

### 1. Deploy to AWS

```bash
ossa deploy customer-support-agent.ossa.yaml \
  --platform cloud \
  --cloud aws \
  --env production \
  --cpu 512 \
  --memory 1024 \
  --replicas 3

# Output:
# ✓ Deployed to AWS ECS: customer-support-agent
#   Instance ID: aws-ecs-abc123
#   Endpoint: https://aws.example.com
#   Region: us-east-1
```

### 2. Deploy to GCP

```bash
ossa deploy customer-support-agent.ossa.yaml \
  --platform cloud \
  --cloud gcp \
  --env production \
  --region us-central1 \
  --max-instances 10

# Output:
# ✓ Deployed to Cloud Run: customer-support-agent
#   Instance ID: gcp-run-abc123
#   Endpoint: https://gcp.example.com
#   Region: us-central1
```

### 3. Deploy to Azure

```bash
ossa deploy customer-support-agent.ossa.yaml \
  --platform cloud \
  --cloud azure \
  --env production \
  --resource-group customer-support \
  --location eastus

# Output:
# ✓ Deployed to Azure Container Instances: customer-support-agent
#   Instance ID: azure-aci-abc123
#   Endpoint: https://azure.example.com
#   Region: eastus
```

### 4. Setup Global Load Balancer

Configure DNS and load balancer to route traffic:

```yaml
# CloudFlare Load Balancer
pools:
  - name: aws-us-east-1
    origin: https://aws.example.com
    weight: 34

  - name: gcp-us-central1
    origin: https://gcp.example.com
    weight: 33

  - name: azure-eastus
    origin: https://azure.example.com
    weight: 33

health_checks:
  - path: /health
    interval: 30s
    timeout: 5s
```

## Summary

This workflow demonstrated:

✅ **Local Development**
- Validate OSSA manifest
- Build and test locally
- Deploy to local Docker

✅ **Staging Deployment**
- Deploy to Kubernetes staging
- Health check verification
- Integration testing

✅ **CI/CD Automation**
- GitLab CI/CD pipeline
- Automated builds and deployments
- Multi-environment support
- Automatic rollback on failure

✅ **Production Deployment**
- Manual approval gate
- Health verification
- Monitoring setup
- Rollback capability

✅ **Multi-Cloud**
- Deploy to AWS, GCP, Azure
- Global load balancing
- Redundancy and failover

## Next Steps

1. **Monitoring**: Setup Prometheus/Grafana dashboards
2. **Alerting**: Configure alerts for critical metrics
3. **Scaling**: Implement HorizontalPodAutoscaler
4. **Security**: Add network policies and RBAC
5. **Cost Optimization**: Analyze resource usage and optimize
6. **Disaster Recovery**: Test rollback and recovery procedures

---

**Complete Workflow Example**
**Last Updated**: 2026-02-07
