# Docker and Kubernetes Deployment Templates

> Production-ready containerized deployment configurations for self-hosted environments

## Overview

This directory contains comprehensive Handlebars templates for creating production-optimized Docker and Kubernetes deployments. These templates follow industry best practices for security, performance, and reliability.

**Use Case:** Self-hosted deployments, private clouds, on-premise infrastructure, or custom Kubernetes clusters.

**For managed platforms** (Railway, Render, Fly.io), see [README.md](./README.md).

## Directory Structure

```
deployment-templates/
├── docker/
│   ├── Dockerfile.hbs              # Multi-stage production Dockerfile
│   ├── docker-compose.yml.hbs      # Local development environment
│   └── docker-values.yaml          # Sample Docker configuration values
├── kubernetes/
│   ├── deployment.yaml.hbs         # Kubernetes Deployment
│   ├── service.yaml.hbs            # Kubernetes Service
│   ├── ingress.yaml.hbs            # Ingress configuration
│   ├── configmap.yaml.hbs          # ConfigMap template
│   ├── secret.yaml.hbs             # Secret template
│   ├── hpa.yaml.hbs                # HPA + VPA + PDB
│   ├── rbac.yaml.hbs               # RBAC configuration
│   ├── networkpolicy.yaml.hbs      # Network policies
│   └── values.yaml.hbs             # Sample Kubernetes values
├── DEPLOYMENT_BEST_PRACTICES.md    # Comprehensive guide
└── DOCKER_KUBERNETES_README.md     # This file
```

## Quick Start

### Prerequisites

```bash
# Install Handlebars CLI
npm install -g handlebars js-yaml

# Or install locally
npm install handlebars js-yaml
```

### 1. Docker Deployment

#### Step 1: Create Values File

```bash
cp deployment-templates/docker/docker-values.yaml my-app-docker-values.yaml
```

Edit with your configuration:

```yaml
projectName: my-application
nodeVersion: 20
appUser: appuser
port: 3000
buildScript: build
startScript: index.js
timezone: UTC
healthEndpoint: health
```

#### Step 2: Render Dockerfile

```bash
node render-docker.js
```

Or manually:

```bash
handlebars docker/Dockerfile.hbs -f my-app-docker-values.yaml > Dockerfile
```

#### Step 3: Build and Run

```bash
# Build production image
docker build --target production -t my-app:latest .

# Build development image
docker build --target development -t my-app:dev .

# Run locally
docker run -p 3000:3000 my-app:latest

# Or use docker-compose
docker-compose up -d
```

### 2. Kubernetes Deployment

#### Step 1: Create Values File

```bash
cp deployment-templates/kubernetes/values.yaml.hbs my-app-k8s-values.yaml
```

Edit with your configuration (see [Template Variables](#template-variables)).

#### Step 2: Render Templates

Create a render script:

```javascript
// render-k8s.js
const Handlebars = require('handlebars');
const fs = require('fs');
const yaml = require('js-yaml');

// Register helpers
Handlebars.registerHelper('base64', (str) => {
  return Buffer.from(str || '').toString('base64');
});

Handlebars.registerHelper('indent', (count, content) => {
  const spaces = ' '.repeat(count);
  return content.split('\n').map(line => spaces + line).join('\n').trim();
});

// Render all templates
const templates = [
  'deployment.yaml.hbs',
  'service.yaml.hbs',
  'ingress.yaml.hbs',
  'configmap.yaml.hbs',
  'secret.yaml.hbs',
  'hpa.yaml.hbs',
  'rbac.yaml.hbs',
  'networkpolicy.yaml.hbs'
];

const values = yaml.load(fs.readFileSync('my-app-k8s-values.yaml', 'utf8'));

templates.forEach(template => {
  const source = fs.readFileSync(`kubernetes/${template}`, 'utf8');
  const compiled = Handlebars.compile(source);
  const output = compiled(values);
  const filename = template.replace('.hbs', '');
  fs.writeFileSync(`k8s-rendered/${filename}`, output);
  console.log(`✓ Generated ${filename}`);
});
```

Run the script:

```bash
mkdir -p k8s-rendered
node render-k8s.js
```

#### Step 3: Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace production

# Apply manifests
kubectl apply -f k8s-rendered/

# Or apply individually
kubectl apply -f k8s-rendered/rbac.yaml
kubectl apply -f k8s-rendered/configmap.yaml
kubectl apply -f k8s-rendered/secret.yaml
kubectl apply -f k8s-rendered/deployment.yaml
kubectl apply -f k8s-rendered/service.yaml
kubectl apply -f k8s-rendered/ingress.yaml
kubectl apply -f k8s-rendered/hpa.yaml
kubectl apply -f k8s-rendered/networkpolicy.yaml

# Check rollout status
kubectl rollout status deployment/my-app -n production
```

## Template Variables

### Docker Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `projectName` | Project name | - | `my-application` |
| `nodeVersion` | Node.js version | `20` | `20`, `18`, `16` |
| `appUser` | Non-root user | `appuser` | `appuser` |
| `port` | Application port | `3000` | `8080`, `3000` |
| `buildScript` | Build script | `build` | `build`, `compile` |
| `startScript` | Start script | `index.js` | `index.js`, `main.js` |
| `timezone` | Container timezone | `UTC` | `America/New_York` |
| `healthEndpoint` | Health check path | `health` | `health`, `healthz` |
| `useYarn` | Use Yarn | `false` | `true`, `false` |
| `usePnpm` | Use pnpm | `false` | `true`, `false` |

### Kubernetes Configuration

#### Core Settings

| Variable | Description | Example |
|----------|-------------|---------|
| `projectName` | Project name | `my-application` |
| `namespace` | Kubernetes namespace | `production` |
| `appName` | Application name | `my-app` |
| `component` | Component label | `api`, `worker` |
| `version` | Application version | `1.0.0` |

#### Image Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `dockerRegistry` | Docker registry | `registry.gitlab.com/myorg` |
| `imageName` | Image name | `my-application` |
| `imageTag` | Image tag | `latest`, `v1.0.0` |
| `imagePullPolicy` | Pull policy | `IfNotPresent`, `Always` |
| `imagePullSecrets` | Pull secrets | `["gitlab-registry"]` |

#### Resources

| Variable | Description | Example |
|----------|-------------|---------|
| `replicas` | Initial replicas | `3` |
| `cpuRequest` | CPU request | `100m` |
| `cpuLimit` | CPU limit | `500m` |
| `memoryRequest` | Memory request | `128Mi` |
| `memoryLimit` | Memory limit | `512Mi` |

#### Health Probes

| Variable | Description | Default |
|----------|-------------|---------|
| `livenessPath` | Liveness probe path | `/health` |
| `livenessInitialDelay` | Initial delay (seconds) | `30` |
| `livenessPeriod` | Check interval (seconds) | `10` |
| `readinessPath` | Readiness probe path | `/ready` |
| `readinessInitialDelay` | Initial delay (seconds) | `10` |
| `readinessPeriod` | Check interval (seconds) | `10` |

#### Autoscaling

| Variable | Description | Example |
|----------|-------------|---------|
| `minReplicas` | Minimum replicas | `2` |
| `maxReplicas` | Maximum replicas | `10` |
| `cpuTarget` | CPU target % | `70` |
| `memoryTarget` | Memory target % | `80` |

See `kubernetes/values.yaml.hbs` for complete list.

## Features

### Docker Templates

#### Multi-Stage Dockerfile
✅ **Base Stage** - Security updates and base packages
✅ **Dependencies Stage** - Dependency installation with cache
✅ **Builder Stage** - Application build
✅ **Production Stage** - Minimal runtime image
✅ **Development Stage** - Hot reload for development

#### Security
✅ Non-root user (UID 1001)
✅ Alpine-based images (minimal attack surface)
✅ dumb-init for proper signal handling
✅ Health checks
✅ Security labels and metadata

#### Performance
✅ BuildKit cache mounts
✅ Layer optimization
✅ Minimal image size (typically <100MB)
✅ Efficient dependency management

#### Docker Compose
✅ Application service
✅ PostgreSQL database
✅ Redis cache
✅ Nginx reverse proxy
✅ Prometheus + Grafana monitoring
✅ Health checks on all services
✅ Resource limits
✅ Volume management
✅ Network isolation

### Kubernetes Templates

#### Deployment
✅ Production-ready configuration
✅ Security contexts (non-root, read-only filesystem)
✅ Resource limits and requests
✅ Health probes (liveness, readiness, startup)
✅ Rolling update strategy
✅ Pod anti-affinity for HA
✅ Init containers support
✅ Sidecar containers support
✅ Graceful shutdown (preStop hook)

#### Service
✅ ClusterIP, NodePort, LoadBalancer support
✅ Session affinity
✅ Prometheus annotations
✅ Headless service option

#### Ingress
✅ TLS/SSL support
✅ Cert-manager integration
✅ Nginx-specific annotations
✅ CORS configuration
✅ Rate limiting
✅ IP whitelisting
✅ Basic authentication

#### Horizontal Pod Autoscaler
✅ CPU and memory-based scaling
✅ Custom metrics support
✅ External metrics support
✅ Fine-grained scaling behavior
✅ Vertical Pod Autoscaler (optional)
✅ Pod Disruption Budget

#### RBAC
✅ Service Account
✅ Role and RoleBinding
✅ ClusterRole and ClusterRoleBinding
✅ Least privilege examples

#### Network Policy
✅ Ingress rules
✅ Egress rules
✅ Default deny-all option
✅ DNS access
✅ Database/Redis access
✅ External API access

#### ConfigMap & Secret
✅ Environment variables
✅ File-based configuration
✅ Database configuration
✅ Redis configuration
✅ API keys and JWT secrets
✅ TLS certificates
✅ Sealed Secrets examples
✅ External Secrets Operator examples

## Best Practices

### Security

**Container Security:**
- ✅ Run as non-root user
- ✅ Use read-only root filesystem
- ✅ Drop all capabilities
- ✅ Enable seccomp profile
- ✅ Set security contexts

**Secret Management:**
- ❌ Never commit secrets to Git
- ✅ Use Sealed Secrets or External Secrets Operator
- ✅ Inject secrets at deploy time
- ✅ Rotate secrets regularly

**Network Security:**
- ✅ Enable network policies
- ✅ Default deny-all, then allow specific traffic
- ✅ Use TLS for all external communication

### Performance

**Resource Management:**
- ✅ Set appropriate requests and limits
- ✅ Use HPA for dynamic scaling
- ✅ Use VPA for right-sizing
- ✅ Monitor and adjust based on metrics

**Caching:**
- ✅ Use Redis for application cache
- ✅ Enable HTTP caching headers
- ✅ Configure connection pooling

### Reliability

**High Availability:**
- ✅ Run multiple replicas (≥3 for production)
- ✅ Configure Pod Disruption Budget
- ✅ Use pod anti-affinity
- ✅ Spread across availability zones

**Graceful Shutdown:**
- ✅ Implement preStop hook
- ✅ Set appropriate terminationGracePeriodSeconds
- ✅ Close connections cleanly

### Observability

**Monitoring:**
- ✅ Expose Prometheus metrics
- ✅ Configure health probes
- ✅ Use structured logging (JSON)
- ✅ Enable distributed tracing

**Alerting:**
- ✅ Set up alerts for critical metrics
- ✅ Create runbooks for common issues
- ✅ Monitor error rates and latency

## CI/CD Integration

### GitLab CI

```yaml
# .gitlab-ci.yml
variables:
  DOCKER_REGISTRY: registry.gitlab.com
  K8S_NAMESPACE: production

stages:
  - build
  - deploy

build:docker:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    # Render Dockerfile
    - apk add --no-cache nodejs npm
    - npm install -g handlebars
    - handlebars docker/Dockerfile.hbs -f docker/values.yaml > Dockerfile

    # Build and push
    - docker build -t $DOCKER_REGISTRY/$CI_PROJECT_PATH:$CI_COMMIT_SHA .
    - docker push $DOCKER_REGISTRY/$CI_PROJECT_PATH:$CI_COMMIT_SHA

deploy:production:
  stage: deploy
  image: alpine/k8s:1.28.0
  script:
    # Install dependencies
    - apk add --no-cache nodejs npm
    - npm install handlebars js-yaml

    # Render templates
    - node render-k8s.js

    # Deploy
    - kubectl apply -f k8s-rendered/
    - kubectl rollout status deployment/my-app -n $K8S_NAMESPACE
  only:
    - main
  environment:
    name: production
    url: https://api.example.com
```

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: |
          npm install -g handlebars
          handlebars docker/Dockerfile.hbs -f docker/values.yaml > Dockerfile
          docker build -t my-app:${{ github.sha }} .
          docker push my-app:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Render templates
        run: |
          npm install handlebars js-yaml
          node render-k8s.js

      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f k8s-rendered/
          kubectl rollout status deployment/my-app
```

## Troubleshooting

### Docker Issues

**Build Failures:**
```bash
# Check syntax
docker build --dry-run .

# Build with verbose output
docker build --progress=plain .

# Clear build cache
docker builder prune -a
```

**Container Won't Start:**
```bash
# Check logs
docker logs <container-id>

# Inspect container
docker inspect <container-id>

# Run interactively
docker run -it --entrypoint /bin/sh my-app:latest
```

### Kubernetes Issues

**Pod Crashes:**
```bash
# Check events
kubectl describe pod <pod-name> -n <namespace>

# Check logs
kubectl logs <pod-name> -n <namespace>

# Check previous logs
kubectl logs <pod-name> -n <namespace> --previous
```

**Image Pull Errors:**
```bash
# Check secret
kubectl get secret <secret-name> -n <namespace> -o yaml

# Test image pull
docker pull <image>

# Recreate secret
kubectl delete secret <secret-name> -n <namespace>
kubectl create secret docker-registry <secret-name> \
  --docker-server=<registry> \
  --docker-username=<username> \
  --docker-password=<password>
```

**Health Check Failures:**
- Increase `initialDelaySeconds`
- Check health endpoint returns 200
- Ensure health check is lightweight
- Verify port is correct

See [DEPLOYMENT_BEST_PRACTICES.md](./DEPLOYMENT_BEST_PRACTICES.md) for comprehensive troubleshooting guide.

## Production Readiness Checklist

### Pre-Deployment

- [ ] Security scan passed (Trivy, Snyk, Docker Scout)
- [ ] No secrets in Git
- [ ] Resource limits configured
- [ ] Health probes configured
- [ ] Monitoring configured
- [ ] Logging configured
- [ ] Network policies enabled
- [ ] RBAC configured with least privilege

### Post-Deployment

- [ ] Multiple replicas running
- [ ] HPA configured and working
- [ ] Metrics being collected
- [ ] Logs being aggregated
- [ ] Alerts configured
- [ ] Dashboards created
- [ ] Runbooks documented
- [ ] Rollback procedure tested

## Additional Resources

### Documentation

- [DEPLOYMENT_BEST_PRACTICES.md](./DEPLOYMENT_BEST_PRACTICES.md) - Comprehensive guide
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [12-Factor App](https://12factor.net/)

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
- "Docker Deep Dive" by Nigel Poulton

## Support

For issues or questions:

1. Check [DEPLOYMENT_BEST_PRACTICES.md](./DEPLOYMENT_BEST_PRACTICES.md)
2. Review template comments and annotations
3. Consult Kubernetes/Docker documentation
4. Open an issue in the repository

## Contributing

Contributions welcome! Please:

1. Follow existing template structure
2. Add comments for complex configurations
3. Update documentation
4. Test templates before submitting
5. Follow security best practices

## License

MIT License - See LICENSE file for details

---

**Version:** 1.0.0
**Last Updated:** 2026-02-04
**Maintainer:** BlueFly.io DevOps Team
