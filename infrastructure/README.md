# Infrastructure - OSSA

**OSSA Compliant - v0.1.9**
**Standard: Agent BuildKit Infrastructure Pattern**

## Directory Structure
```
infrastructure/
├── docker/         # Docker configurations
├── k8s/           # Kubernetes manifests
├── monitoring/    # Monitoring & observability
├── scripts/       # Deployment scripts
├── deployment/    # Environment configs
├── observability/ # Tracing & metrics
├── templates/     # Reusable templates
├── workflows/     # CI/CD workflows
├── nginx/         # Reverse proxy
├── helm/          # Helm charts
├── terraform/     # Infrastructure as Code
├── ci-cd/         # Pipeline configs
├── security/      # Security configs
└── backup/        # Backup strategies
```

## Quick Start

### Development
```bash
cd infrastructure/docker
docker-compose up -d
```

### Production
```bash
./scripts/deploy.sh production
```

## Monitoring
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
