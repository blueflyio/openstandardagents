# Multi-Platform Deployment Example

This example demonstrates deploying a single OSSA manifest to multiple platforms.

## Agent Manifest

See `agent.ossa.yaml` for the complete OSSA manifest.

## Build for All Platforms

```bash
ossa build agent.ossa.yaml --platform all --output dist/build
```

This generates:
- `dist/build/kagent/agent-crd.yaml` - kagent.dev CRD
- `dist/build/langchain/agent.py` - LangChain Python code
- `dist/build/crewai/agent.py` - CrewAI Python code
- `dist/build/temporal/agent-workflow.ts` - Temporal TypeScript
- `dist/build/n8n/agent-workflow.json` - n8n workflow
- `dist/build/gitlab/.gitlab-ci.yml` - GitLab CI config
- `dist/build/docker/Dockerfile` - Dockerfile
- `dist/build/kubernetes/` - K8s manifests

## Deploy to Each Platform

### kagent.dev
```bash
ossa deploy agent.ossa.yaml --platform kagent --namespace production
```

### LangChain
```bash
cd dist/build/langchain
pip install langchain langchain-openai
python agent.py
```

### CrewAI
```bash
cd dist/build/crewai
pip install crewai
python agent.py
```

### Docker
```bash
cd dist/build/docker
docker build -t agent .
docker run agent
```

### Kubernetes
```bash
cd dist/build/kubernetes
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f configmap.yaml
```

## Comparison Matrix

| Platform | Language | Deployment | Best For |
|----------|----------|------------|----------|
| kagent.dev | YAML | Kubernetes | Production K8s |
| LangChain | Python | Local/Cloud | Python ecosystems |
| CrewAI | Python | Local/Cloud | Multi-agent teams |
| Temporal | TypeScript | Cloud | Long-running workflows |
| n8n | JSON | Self-hosted | Visual workflows |
| GitLab CI | YAML | GitLab | CI/CD automation |
| Docker | Dockerfile | Any | Containerized deployment |
| Kubernetes | YAML | K8s clusters | Production orchestration |
