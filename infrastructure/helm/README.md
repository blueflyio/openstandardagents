# OSSA Helm Chart

Helm chart for deploying OSSA (Open Standards for Scalable Agents) to Kubernetes clusters.

## Quick Start

```bash
# Install from local chart
helm install ossa ./helm/ossa --namespace ossa-system --create-namespace

# Install with custom values
helm install ossa ./helm/ossa -f custom-values.yaml --namespace ossa-system

# Upgrade deployment
helm upgrade ossa ./helm/ossa --namespace ossa-system

# Uninstall
helm uninstall ossa --namespace ossa-system
```

## Configuration

See `values.yaml` for all configuration options. Key values:

```yaml
replicaCount: 3
image:
  repository: registry.gitlab.bluefly.io/llm/ossa
  tag: "0.1.9"

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10

resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

## GitLab CI/CD Deployment

The chart is designed to work with GitLab CI/CD pipelines. Example `.gitlab-ci.yml`:

```yaml
deploy:
  stage: deploy
  image: alpine/helm:latest
  script:
    - helm upgrade --install ossa ./infrastructure/helm/ossa \
        --namespace ossa-system \
        --create-namespace \
        --set image.tag=$CI_COMMIT_SHORT_SHA \
        --wait
  only:
    - main
```

## Values Override for Environments

### Development
```yaml
replicaCount: 1
autoscaling:
  enabled: false
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
```

### Production
```yaml
replicaCount: 5
autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 20
resources:
  requests:
    memory: "1Gi"
    cpu: "1000m"
```

## Dependencies

- Kubernetes 1.24+
- Helm 3.8+
- Redis (optional, can be external)
- PostgreSQL (optional, can be external)

## Monitoring

The chart includes Prometheus annotations for metrics scraping:

```yaml
prometheus.io/scrape: "true"
prometheus.io/port: "4000"
prometheus.io/path: "/metrics"
```

## Security

Default security context:

```yaml
runAsNonRoot: true
runAsUser: 1001
allowPrivilegeEscalation: false
readOnlyRootFilesystem: true
```

## Chart Structure

```
helm/ossa/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default configuration
└── templates/
    ├── _helpers.tpl        # Template helpers
    ├── deployment.yaml     # Deployment manifest
    ├── service.yaml        # Service manifest
    └── ...                 # Additional resources
```
