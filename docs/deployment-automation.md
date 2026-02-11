# OSSA Deployment Automation

One-click deployment automation for OSSA agents to Kubernetes, Docker, or Cloud platforms.

## Table of Contents

- [Quick Start](#quick-start)
- [Deployment Platforms](#deployment-platforms)
- [CLI Commands](#cli-commands)
- [CI/CD Integration](#cicd-integration)
- [Cloud Providers](#cloud-providers)
- [Health Checks & Monitoring](#health-checks--monitoring)
- [Rollback & Recovery](#rollback--recovery)
- [Best Practices](#best-practices)

## Quick Start

### Deploy to Kubernetes

```bash
# Interactive deployment
ossa deploy agent.ossa.yaml --interactive

# Direct deployment
ossa deploy agent.ossa.yaml \
  --platform kubernetes \
  --env production \
  --namespace default \
  --replicas 3 \
  --registry ghcr.io/org/agent:v1.0.0
```

### Deploy to Docker

```bash
ossa deploy agent.ossa.yaml \
  --platform docker \
  --env production \
  --port 3000
```

### Deploy to Cloud

```bash
# AWS (ECS Fargate)
ossa deploy agent.ossa.yaml \
  --platform cloud \
  --cloud aws \
  --env production

# GCP (Cloud Run)
ossa deploy agent.ossa.yaml \
  --platform cloud \
  --cloud gcp \
  --env production

# Azure (Container Instances)
ossa deploy agent.ossa.yaml \
  --platform cloud \
  --cloud azure \
  --env production
```

## Deployment Platforms

### Kubernetes

**Features:**
- Deployment and Service manifest generation
- HorizontalPodAutoscaler support
- ConfigMap and Secret management
- Rolling updates
- Health checks (liveness/readiness probes)
- Multi-replica support

**Requirements:**
- kubectl installed and configured
- Access to Kubernetes cluster

**Example:**

```bash
ossa deploy agent.ossa.yaml \
  --platform kubernetes \
  --env production \
  --namespace ossa-agents \
  --replicas 5 \
  --registry ghcr.io/myorg/creative-agent-naming:latest \
  --health-check \
  --verify
```

**Generated Resources:**
- Deployment
- Service (ClusterIP)
- ConfigMap (environment variables)
- Optional: HPA, Ingress, NetworkPolicy

### Docker

**Features:**
- Container creation and management
- Network configuration
- Volume mounting
- Health checks
- Resource limits

**Requirements:**
- Docker installed and running
- Docker image built

**Example:**

```bash
ossa deploy agent.ossa.yaml \
  --platform docker \
  --env production \
  --port 3000 \
  --registry myorg/creative-agent-naming:latest \
  --network bridge
```

### Cloud Platforms

#### AWS

**Deployment Options:**
- **ECS Fargate**: Serverless containers
- **Lambda**: Event-driven functions

**Requirements:**
- AWS CLI configured (`aws configure`)
- IAM permissions for ECS/Lambda

**Example:**

```bash
# ECS Fargate
ossa deploy agent.ossa.yaml \
  --platform cloud \
  --cloud aws \
  --env production \
  --cpu 512 \
  --memory 1024 \
  --replicas 3

# Lambda
ossa deploy agent.ossa.yaml \
  --platform cloud \
  --cloud aws \
  --env production \
  --function-name creative-agent-naming-function \
  --timeout 60 \
  --memory-size 512
```

#### GCP

**Deployment Options:**
- **Cloud Run**: Serverless containers
- **GKE**: Managed Kubernetes

**Requirements:**
- gcloud CLI configured (`gcloud auth login`)
- GCP project configured

**Example:**

```bash
# Cloud Run
ossa deploy agent.ossa.yaml \
  --platform cloud \
  --cloud gcp \
  --env production \
  --region us-central1 \
  --max-instances 10 \
  --allow-unauthenticated

# GKE
ossa deploy agent.ossa.yaml \
  --platform cloud \
  --cloud gcp \
  --env production \
  --cluster my-gke-cluster \
  --zone us-central1-a
```

#### Azure

**Deployment Options:**
- **Container Instances (ACI)**: Simple containers
- **AKS**: Managed Kubernetes

**Requirements:**
- Azure CLI configured (`az login`)
- Azure subscription

**Example:**

```bash
# Container Instances
ossa deploy agent.ossa.yaml \
  --platform cloud \
  --cloud azure \
  --env production \
  --resource-group ossa-agents \
  --location eastus \
  --cpu 1 \
  --memory 1

# AKS
ossa deploy agent.ossa.yaml \
  --platform cloud \
  --cloud azure \
  --env production \
  --aks-cluster my-aks-cluster \
  --aks-resource-group ossa-aks
```

## CLI Commands

### Deploy Command

```bash
ossa deploy <manifest> [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --platform <platform>` | Target platform (kubernetes, docker, cloud) | kubernetes |
| `--cloud <provider>` | Cloud provider (aws, gcp, azure) | - |
| `-e, --env <environment>` | Environment (production, staging, dev) | production |
| `--registry <registry>` | Container registry URL | - |
| `--namespace <namespace>` | Kubernetes namespace | default |
| `--replicas <count>` | Number of replicas | 1 |
| `--no-health-check` | Skip health check verification | false |
| `--no-verify` | Skip deployment verification | false |
| `-i, --interactive` | Interactive mode with prompts | false |
| `--dry-run` | Preview deployment without executing | false |

### Rollback Command

```bash
ossa rollback <instance-id> [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--version <version>` | Target version to rollback to | - |
| `--steps <number>` | Number of versions to rollback | 1 |
| `-p, --platform <platform>` | Deployment platform | kubernetes |
| `--cloud <provider>` | Cloud provider (if platform=cloud) | - |
| `--no-verify` | Skip health verification after rollback | false |
| `-f, --force` | Force rollback without confirmation | false |
| `-i, --interactive` | Interactive mode with prompts | false |

**Example:**

```bash
# Rollback to previous version
ossa rollback agent-123 --platform kubernetes

# Rollback to specific version
ossa rollback agent-123 --version 1.2.0

# Rollback 3 versions
ossa rollback agent-123 --steps 3
```

## CI/CD Integration

### GitLab CI/CD

Copy the provided template:

```bash
cp templates/ci-cd/gitlab-ci.deploy.yml .gitlab-ci.yml
```

**Configuration:**

```yaml
variables:
  AGENT_MANIFEST: "agent.ossa.yaml"
  DEPLOY_PLATFORM: "kubernetes"
  CLOUD_PROVIDER: "" # aws, gcp, or azure
  KUBERNETES_NAMESPACE: "production"
  DOCKER_REGISTRY: "${CI_REGISTRY_IMAGE}"
```

**Features:**
- Auto-deploy on manifest changes
- Multi-environment support (staging, production)
- Health check verification
- Automatic rollback on failure
- Manual deployment gates

### GitHub Actions

Copy the provided template:

```bash
cp templates/ci-cd/github-actions.deploy.yml .github/workflows/deploy.yml
```

**Configuration:**

```yaml
env:
  AGENT_MANIFEST: agent.ossa.yaml
  DEPLOY_PLATFORM: kubernetes
  KUBERNETES_NAMESPACE: production
  DOCKER_REGISTRY: ghcr.io/${{ github.repository }}
```

**Features:**
- Auto-deploy on push to main
- Manual workflow dispatch
- Environment protection rules
- Health check verification
- Automatic rollback on failure
- GitHub notifications

## Health Checks & Monitoring

### Health Check Configuration

OSSA automatically configures health checks for your agents:

**Kubernetes:**
- Liveness probe: `/health`
- Readiness probe: `/ready`
- Configurable timeouts and periods

**Docker:**
- HEALTHCHECK directive in Dockerfile
- HTTP health endpoint polling

**Cloud:**
- AWS: ECS health checks, CloudWatch alarms
- GCP: Cloud Run health checks, Cloud Monitoring
- Azure: Container health probes, Azure Monitor

### Manual Health Check

```bash
# Check deployment health
ossa health-check <instance-id>

# Output:
# ✓ Health check passed - healthy
#   Uptime: 2h 15m 30s
#   Memory: 45.2%
#   CPU: 23.7%
```

### Monitoring Integration

OSSA deployments expose metrics at `/metrics` (Prometheus format):

```yaml
# Kubernetes ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ossa-agent-monitor
spec:
  selector:
    matchLabels:
      ossa.io/agent: creative-agent-naming
  endpoints:
    - port: metrics
      path: /metrics
```

## Rollback & Recovery

### Automatic Rollback

OSSA can automatically rollback failed deployments:

**GitLab CI:**
```yaml
rollback:production:
  stage: rollback
  when: on_failure
  script:
    - ossa rollback ${DEPLOYMENT_ID} --force --verify
```

**GitHub Actions:**
```yaml
rollback:
  if: failure() && needs.deploy-production.result == 'success'
  steps:
    - run: ossa rollback ${{ env.DEPLOYMENT_ID }} --force --verify
```

### Manual Rollback

```bash
# Rollback to previous version
ossa rollback agent-123

# Rollback to specific version
ossa rollback agent-123 --version 1.2.0

# Rollback with verification
ossa rollback agent-123 --verify

# Force rollback without confirmation
ossa rollback agent-123 --force
```

### Rollback Strategies

**Kubernetes:**
- Uses `kubectl rollout undo`
- Maintains revision history
- Zero-downtime rollback

**Docker:**
- Stops current container
- Starts container with previous image
- Configurable grace period

**Cloud:**
- Platform-specific rollback mechanisms
- Automatic traffic switching
- Health-based validation

## Best Practices

### 1. Multi-Environment Strategy

```bash
# Development
ossa deploy agent.ossa.yaml --env dev --replicas 1

# Staging
ossa deploy agent.ossa.yaml --env staging --replicas 2

# Production
ossa deploy agent.ossa.yaml --env production --replicas 5
```

### 2. Use Dry-Run for Validation

```bash
# Preview deployment without executing
ossa deploy agent.ossa.yaml --dry-run
```

### 3. Always Enable Health Checks

```bash
ossa deploy agent.ossa.yaml --health-check --verify
```

### 4. Tag Container Images

```bash
# Use specific version tags
ossa deploy agent.ossa.yaml --registry myorg/agent:v1.2.3

# Avoid 'latest' in production
```

### 5. Configure Resource Limits

```yaml
# In OSSA manifest
spec:
  constraints:
    resources:
      limits:
        cpu: "1000m"
        memory: "2Gi"
      requests:
        cpu: "500m"
        memory: "1Gi"
```

### 6. Monitor Deployments

```bash
# Check deployment status
ossa status <instance-id>

# View logs
kubectl logs -f deployment/ossa-creative-agent-naming

# Monitor metrics
kubectl top pod -l ossa.io/agent=creative-agent-naming
```

### 7. Implement Rollback Strategy

```bash
# Test rollback in staging first
ossa deploy agent.ossa.yaml --env staging
ossa rollback <instance-id> --verify

# Then apply to production
```

### 8. Use CI/CD Pipelines

- Automate deployments on manifest changes
- Implement approval gates for production
- Enable automatic rollback on failure
- Monitor deployment health

### 9. Version Everything

```yaml
# OSSA manifest
metadata:
  version: "1.2.3"

# Container image
spec:
  runtime:
    image: "myorg/agent:v1.2.3"
```

### 10. Document Deployment Process

- Maintain deployment runbooks
- Document rollback procedures
- Track deployment history
- Record configuration changes

## Troubleshooting

### Deployment Fails

```bash
# Check deployment logs
ossa logs <instance-id>

# Verify manifest
ossa validate agent.ossa.yaml

# Check cluster resources
kubectl describe deployment ossa-creative-agent-naming
```

### Health Check Fails

```bash
# Check health endpoint
curl http://<endpoint>/health

# View pod logs
kubectl logs -f <pod-name>

# Check resource usage
kubectl top pod <pod-name>
```

### Rollback Fails

```bash
# Check rollback history
kubectl rollout history deployment/ossa-creative-agent-naming

# Manual rollback
kubectl rollout undo deployment/ossa-creative-agent-naming

# Check pod status
kubectl get pods -l ossa.io/agent=creative-agent-naming
```

## Support

- **Documentation**: [openstandardagents.org](https://openstandardagents.org)
- **Issues**: [GitLab Issues](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues)
- **Community**: [Discord](https://discord.gg/ossa)

---

**Built with ❤️ by the BlueFly.io team**
