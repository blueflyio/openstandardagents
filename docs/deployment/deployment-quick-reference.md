# OSSA Deployment Quick Reference

One-page reference for OSSA agent deployment automation.

## Quick Commands

### Deploy to Kubernetes
```bash
ossa deploy agent.ossa.yaml \
  --platform kubernetes \
  --env production \
  --namespace default \
  --replicas 3
```

### Deploy to Docker
```bash
ossa deploy agent.ossa.yaml \
  --platform docker \
  --env production \
  --port 3000
```

### Deploy to AWS
```bash
ossa deploy agent.ossa.yaml \
  --platform cloud \
  --cloud aws \
  --env production
```

### Deploy to GCP
```bash
ossa deploy agent.ossa.yaml \
  --platform cloud \
  --cloud gcp \
  --env production
```

### Deploy to Azure
```bash
ossa deploy agent.ossa.yaml \
  --platform cloud \
  --cloud azure \
  --env production
```

### Interactive Mode
```bash
ossa deploy agent.ossa.yaml --interactive
```

### Dry-Run (Preview)
```bash
ossa deploy agent.ossa.yaml --dry-run
```

## Rollback Commands

### Rollback to Previous Version
```bash
ossa rollback <instance-id>
```

### Rollback to Specific Version
```bash
ossa rollback <instance-id> --version 1.2.0
```

### Rollback N Steps
```bash
ossa rollback <instance-id> --steps 3
```

### Force Rollback (No Confirmation)
```bash
ossa rollback <instance-id> --force
```

## Options Reference

### Deploy Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --platform <platform>` | kubernetes, docker, cloud | kubernetes |
| `--cloud <provider>` | aws, gcp, azure | - |
| `-e, --env <environment>` | production, staging, dev | production |
| `--registry <registry>` | Container registry URL | - |
| `--namespace <namespace>` | Kubernetes namespace | default |
| `--replicas <count>` | Number of replicas | 1 |
| `--no-health-check` | Skip health check | false |
| `--no-verify` | Skip verification | false |
| `-i, --interactive` | Interactive mode | false |
| `--dry-run` | Preview only | false |

### Rollback Options

| Option | Description | Default |
|--------|-------------|---------|
| `--version <version>` | Target version | - |
| `--steps <number>` | Number of steps back | 1 |
| `-p, --platform <platform>` | kubernetes, docker, cloud | kubernetes |
| `--cloud <provider>` | aws, gcp, azure | - |
| `--no-verify` | Skip health check | false |
| `-f, --force` | Skip confirmation | false |
| `-i, --interactive` | Interactive mode | false |

## Platform-Specific Options

### Kubernetes
```bash
--namespace <namespace>    # K8s namespace
--replicas <count>         # Number of replicas
--registry <url>           # Container registry
```

### Docker
```bash
--port <port>             # Container port
--network <network>       # Docker network
--registry <url>          # Container registry
```

### AWS
```bash
--cpu <cpu>               # CPU units (e.g., 512)
--memory <memory>         # Memory in MB (e.g., 1024)
--function-name <name>    # Lambda function name
--timeout <seconds>       # Lambda timeout
```

### GCP
```bash
--region <region>         # GCP region
--max-instances <count>   # Max auto-scale instances
--cluster <cluster>       # GKE cluster name
--zone <zone>             # GCP zone
```

### Azure
```bash
--resource-group <rg>     # Azure resource group
--location <location>     # Azure location
--cpu <count>             # CPU cores
--memory <gb>             # Memory in GB
--aks-cluster <cluster>   # AKS cluster name
```

## CI/CD Integration

### GitLab CI
```yaml
# .gitlab-ci.yml
include:
  - local: templates/ci-cd/gitlab-ci.deploy.yml

variables:
  AGENT_MANIFEST: "agent.ossa.yaml"
  DEPLOY_PLATFORM: "kubernetes"
  KUBERNETES_NAMESPACE: "production"
```

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy OSSA Agent

on:
  push:
    branches: [main]
    paths: ["agent.ossa.yaml"]

jobs:
  deploy:
    uses: ./.github/workflows/deployment-automation.yml
```

## Health Checks

### Check Deployment Health
```bash
ossa health-check <instance-id>
```

### Check Deployment Status
```bash
ossa status <instance-id>
```

### View Logs (Kubernetes)
```bash
kubectl logs -f deployment/ossa-<agent-name>
```

### View Logs (Docker)
```bash
docker logs -f <container-id>
```

## Common Workflows

### Development → Staging → Production
```bash
# 1. Deploy to dev
ossa deploy agent.ossa.yaml --env dev --replicas 1

# 2. Test in dev
ossa health-check <dev-instance-id>

# 3. Deploy to staging
ossa deploy agent.ossa.yaml --env staging --replicas 2

# 4. Verify staging
ossa health-check <staging-instance-id>

# 5. Deploy to production
ossa deploy agent.ossa.yaml --env production --replicas 5

# 6. Monitor production
ossa status <production-instance-id>
```

### Deployment with Rollback
```bash
# 1. Deploy new version
ossa deploy agent.ossa.yaml --env production

# 2. If issues detected, rollback
ossa rollback <instance-id> --force

# 3. Verify rollback
ossa health-check <instance-id>
```

### Multi-Cloud Deployment
```bash
# Deploy to AWS
ossa deploy agent.ossa.yaml --platform cloud --cloud aws --env production

# Deploy to GCP
ossa deploy agent.ossa.yaml --platform cloud --cloud gcp --env production

# Deploy to Azure
ossa deploy agent.ossa.yaml --platform cloud --cloud azure --env production
```

## Troubleshooting

### Deployment Fails
```bash
# 1. Validate manifest
ossa validate agent.ossa.yaml

# 2. Try dry-run
ossa deploy agent.ossa.yaml --dry-run

# 3. Check logs
kubectl logs deployment/ossa-<agent-name>

# 4. Check resources
kubectl describe deployment ossa-<agent-name>
```

### Health Check Fails
```bash
# 1. Check health endpoint
curl http://<endpoint>/health

# 2. View logs
kubectl logs -f deployment/ossa-<agent-name>

# 3. Check resource usage
kubectl top pod <pod-name>

# 4. Restart deployment
kubectl rollout restart deployment/ossa-<agent-name>
```

### Rollback Fails
```bash
# 1. Check rollback history
kubectl rollout history deployment/ossa-<agent-name>

# 2. Manual rollback
kubectl rollout undo deployment/ossa-<agent-name>

# 3. Verify status
kubectl get pods -l ossa.io/agent=<agent-name>
```

## Environment Variables

### Required
```bash
# For cloud deployments
export AWS_ACCESS_KEY_ID=<key>
export AWS_SECRET_ACCESS_KEY=<secret>
export GCP_PROJECT=<project-id>
export AZURE_SUBSCRIPTION_ID=<subscription>
```

### Optional
```bash
# OSSA CLI config
export OSSA_REGISTRY=ghcr.io/myorg
export OSSA_NAMESPACE=production
export OSSA_REPLICAS=3
```

## Resources

- **Full Documentation**: [docs/deployment-automation.md](./deployment-automation.md)
- **GitLab CI Template**: [templates/ci-cd/gitlab-ci.deploy.yml](../templates/ci-cd/gitlab-ci.deploy.yml)
- **GitHub Actions Template**: [templates/ci-cd/github-actions.deploy.yml](../templates/ci-cd/github-actions.deploy.yml)
- **OSSA Website**: [openstandardagents.org](https://openstandardagents.org)

## Support

- **Issues**: [GitLab Issues](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues)
- **Discussions**: [GitLab Discussions](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues)
- **Community**: [Discord](https://discord.gg/ossa)

---

**Quick Reference Version**: 1.0.0
**Last Updated**: 2026-02-07
