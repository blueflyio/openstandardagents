# Build Once, Use Everywhere Demo

This comprehensive demo showcases how a single OSSA manifest can be built and deployed across multiple platforms simultaneously, demonstrating the true power of OSSA as the "OpenAPI for AI agents."

## Overview

This example demonstrates deploying one OSSA agent manifest to:
- kagent.dev (Kubernetes)
- LangChain (Python)
- CrewAI (Python)
- Docker (Container)
- Kubernetes (Native)
- GitLab CI/CD
- Temporal (TypeScript)

## Quick Start

```bash
# Build for all platforms
ossa build agent.ossa.yaml --all

# Or build for specific platforms
ossa build agent.ossa.yaml --platform kagent --platform langchain --platform docker

# Deploy to all configured platforms
ossa deploy agent.ossa.yaml --all

# Or deploy to specific platform
ossa deploy agent.ossa.yaml --platform kagent
```

## Example Agent Manifest

See `agent.ossa.yaml` for the complete OSSA manifest that works across all platforms.

## Platform-Specific Builds

### kagent.dev

```bash
# Generate kagent CRD
ossa export agent.ossa.yaml --platform kagent --output kagent-crd.yaml

# Deploy to kagent.dev
ossa deploy agent.ossa.yaml --platform kagent
```

**Generated Artifacts:**
- `kagent-crd.yaml` - Kubernetes Custom Resource Definition

### LangChain

```bash
# Generate LangChain Python code
ossa export agent.ossa.yaml --platform langchain --format python --output langchain_agent.py

# Run LangChain agent
python langchain_agent.py
```

**Generated Artifacts:**
- `langchain_agent.py` - Executable Python code

### CrewAI

```bash
# Generate CrewAI Python code
ossa export agent.ossa.yaml --platform crewai --format python --output crewai_crew.py

# Run CrewAI crew
python crewai_crew.py
```

**Generated Artifacts:**
- `crewai_crew.py` - Executable Python code

### Docker

```bash
# Generate Dockerfile
ossa export agent.ossa.yaml --platform docker --output Dockerfile

# Build and run
docker build -t my-agent .
docker run my-agent
```

**Generated Artifacts:**
- `Dockerfile` - Production-ready Dockerfile

### Kubernetes

```bash
# Generate Kubernetes manifests
ossa export agent.ossa.yaml --platform kubernetes --output k8s-manifests.yaml

# Deploy to cluster
kubectl apply -f k8s-manifests.yaml
```

**Generated Artifacts:**
- `k8s-manifests.yaml` - Deployment, Service, ConfigMap manifests

### GitLab CI/CD

```bash
# Generate GitLab CI config
ossa export agent.ossa.yaml --platform gitlab --output .gitlab-ci.yml

# Commit and push
git add .gitlab-ci.yml
git commit -m "Add OSSA agent CI/CD"
git push
```

**Generated Artifacts:**
- `.gitlab-ci.yml` - GitLab CI/CD pipeline configuration

### Temporal

```bash
# Generate Temporal workflow
ossa export agent.ossa.yaml --platform temporal --format typescript --output temporal_workflow.ts

# Deploy Temporal workflow
temporal workflow start --workflow-id my-agent --task-queue agents
```

**Generated Artifacts:**
- `temporal_workflow.ts` - TypeScript workflow code

## Multi-Platform Deployment

Deploy to multiple platforms simultaneously:

```bash
# Build for all platforms
ossa build agent.ossa.yaml --all

# Deploy to all configured platforms
ossa deploy agent.ossa.yaml --all --config deploy-config.yaml
```

## Comparison Matrix

| Platform | Build Time | Deploy Time | Runtime | Scaling |
|----------|-----------|-------------|---------|---------|
| kagent.dev | <5s | <30s | K8s Native | Auto |
| LangChain | <2s | N/A | Python | Manual |
| CrewAI | <2s | N/A | Python | Manual |
| Docker | <10s | <5s | Container | Manual |
| Kubernetes | <5s | <30s | K8s Native | Auto |
| GitLab CI | <2s | On Push | CI Runner | Auto |
| Temporal | <5s | <10s | Temporal | Auto |

## Workflow

1. **Create OSSA Manifest** - Write once in OSSA format
2. **Build for Platforms** - Generate platform-specific artifacts
3. **Validate** - Validate against platform requirements
4. **Deploy** - Deploy to selected platforms
5. **Monitor** - Monitor across all platforms

## Benefits

- **Single Source of Truth**: One manifest, multiple platforms
- **Consistency**: Same agent behavior across platforms
- **Flexibility**: Choose the right platform for each use case
- **Maintainability**: Update once, deploy everywhere
- **Cost Optimization**: Use the most cost-effective platform per workload

## Next Steps

1. Review the example manifest (`agent.ossa.yaml`)
2. Customize for your use case
3. Build for your target platforms
4. Deploy and monitor
5. Iterate and improve

## See Also

- [Platform Comparison Matrix](../../docs/comparison/platform-matrix.md)
- [Integration Guides](../../docs/integrations/)
- [Multi-Platform Example](../multi-platform/single-manifest/)
