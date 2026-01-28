# kagent.dev Integration Guide

Complete guide for deploying OSSA agents to kagent.dev platform.

## Quick Start (5 minutes)

### 1. Install OSSA CLI

```bash
npm install -g @bluefly/openstandardagents
```

### 2. Generate kagent CRD

```bash
ossa export agent.ossa.yaml --platform kagent --output agent-crd.yaml
```

### 3. Deploy to kagent.dev

```bash
ossa deploy agent.ossa.yaml --platform kagent --namespace production
```

## CRD Generation Examples

### Basic Agent

```yaml
# agent.ossa.yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: my-agent
spec:
  role: "You are a helpful assistant"
  llm:
    provider: openai
    model: gpt-4
```

Generate CRD:
```bash
ossa export agent.ossa.yaml --platform kagent
```

Output (`my-agent-crd.yaml`):
```yaml
apiVersion: kagent.dev/v1alpha1
kind: Agent
metadata:
  name: my-agent
spec:
  systemMessage: "You are a helpful assistant"
  modelConfig:
    provider: openai
    model: gpt-4
```

### Agent with Tools

```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: code-reviewer
spec:
  role: "Review code and provide feedback"
  llm:
    provider: openai
    model: gpt-4
  tools:
    - type: mcp
      name: filesystem
      server: filesystem-server
```

## Deployment Workflows

### Development

```bash
# Deploy to dev namespace
ossa deploy agent.ossa.yaml --platform kagent --namespace dev --replicas 1
```

### Production

```bash
# Deploy to production with scaling
ossa deploy agent.ossa.yaml --platform kagent --namespace production --replicas 3
```

### Multi-Platform Deployment

```bash
# Build for all platforms
ossa build agent.ossa.yaml --platform all

# Deploy to multiple platforms
ossa deploy agent.ossa.yaml --all
```

## Troubleshooting

### CRD Validation Errors

If you see validation errors:
```bash
ossa validate agent.ossa.yaml --platform kagent
```

Common issues:
- Missing `spec.role` → Add system message
- Invalid Kubernetes name → Use lowercase, hyphens only
- Missing LLM config → Add `spec.llm` section

### Deployment Failures

Check agent status:
```bash
kubectl get agents -n <namespace>
kubectl describe agent <agent-name> -n <namespace>
```

## Best Practices

1. **Resource Limits**: Always set resource limits in OSSA manifest
2. **Namespace Isolation**: Use separate namespaces per environment
3. **Replica Scaling**: Start with 1 replica, scale based on load
4. **Health Checks**: Configure health checks in deployment
5. **Secrets Management**: Use Kubernetes secrets for API keys

## API Reference

See [kagent SDK documentation](../../../src/sdks/kagent/README.md) for complete API reference.
