# OSSA OrbStack + Kubernetes + Helm Infrastructure

## 🚀 OrbStack Setup for OSSA v0.1.9

### Prerequisites
- OrbStack installed with Kubernetes enabled
- Helm 3.x installed
- kubectl configured for OrbStack

### Quick Start
```bash
# Start OrbStack Kubernetes cluster
orb start kubernetes

# Verify cluster
kubectl cluster-info
kubectl get nodes

# Install OSSA with Helm
helm install ossa ./infrastructure/helm/ossa-chart/
```

## 📁 Infrastructure Structure

```
infrastructure/
├── orbstack/              # OrbStack-specific configurations
│   ├── cluster-config.yaml
│   └── local-registry.yaml
├── helm/                  # Helm charts
│   ├── ossa-chart/        # Main OSSA application chart
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   ├── values-dev.yaml
│   │   ├── values-prod.yaml
│   │   └── templates/
│   └── dependencies/      # Dependency charts
├── k8s/                   # Raw Kubernetes manifests
│   ├── base/              # Base configurations
│   ├── overlays/          # Environment-specific overlays
│   │   ├── development/
│   │   ├── staging/
│   │   └── production/
│   └── operators/         # Custom operators
└── monitoring/            # Observability stack
    ├── prometheus/
    ├── grafana/
    └── jaeger/
```

## 🎯 OrbStack Benefits
- **Local Development**: Full Kubernetes locally with OrbStack
- **Resource Efficient**: Lightweight compared to Docker Desktop
- **Fast**: Native ARM64 support for M1/M2 Macs
- **Integrated**: Works seamlessly with existing Docker workflows

## 🔧 Helm Chart Features
- **Multi-environment**: dev, staging, prod values
- **OpenAPI Integration**: API gateway and documentation
- **MCP Server**: Model Context Protocol server deployment
- **Observability**: Built-in monitoring and tracing
- **Autoscaling**: HPA and VPA configurations
- **Security**: Pod Security Standards and Network Policies