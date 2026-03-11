---
name: kagent
description: "**KAgent Worker**: Kubernetes-native AI agent orchestration and lifecycle management. Integrates with kagent.dev for declarative agent deployment on K8s clusters. - MANDATORY TRIGGERS: kagent, kubernetes agent, deploy agent, agent CRD, agent scaling, agent lifecycle, k8s agent"
license: "Apache-2.0"
compatibility: "Requires kubectl, helm, kagent CLI. Environment: KUBECONFIG"
allowed-tools: "Bash(kubectl:*) Bash(helm:*) Read Edit Task mcp__filesystem__*"
metadata:
  ossa_manifest: ./agent.ossa.yaml
  service_account: kagent-worker
  domain: infrastructure
  tier: worker
  autonomy: fully_autonomous
  ossa_version: v0.3.2
---

# KAgent Worker

**OSSA Agent**: `kagent-worker` | **Version**: 1.0.0 | **Namespace**: blueflyio

Kubernetes-native AI agent orchestration using [kagent.dev](https://kagent.dev) CRDs.

## Capabilities

| Capability | Category | Description |
|------------|----------|-------------|
| `agent_deployment` | action | Deploy agents to Kubernetes |
| `kagent-crd-management` | action | Manage KAgent CRDs |
| `manifest-generation` | action | Generate K8s manifests |
| `agent_scaling` | action | Scale agent replicas |
| `horizontal-pod-autoscaler` | action | Configure HPA |
| `agent_monitoring` | observation | Monitor agent health |
| `health_checks` | observation | Perform health checks |
| `resource_allocation` | action | Allocate K8s resources |
| `llm_routing` | action | Route to LLM providers |
| `lifecycle_management` | action | Manage agent lifecycle |
| `auto_recovery` | action | Auto-recover failed agents |
| `rolling-updates` | action | Perform rolling updates |

## KAgent CRD Example

```yaml
apiVersion: kagent.dev/v1alpha1
kind: Agent
metadata:
  name: mr-reviewer
  namespace: agents
spec:
  replicas: 2

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514

  capabilities:
    - review_merge_request
    - analyze_diff

  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "500m"

  autoscaling:
    enabled: true
    minReplicas: 1
    maxReplicas: 5
    targetCPUUtilization: 70
```

## Operations

### Deploy Agent
```bash
# Apply CRD
kubectl apply -f agent.kagent.yaml

# Verify deployment
kubectl get agents -n agents
kubectl describe agent mr-reviewer -n agents
```

### Scale Agent
```bash
# Manual scale
kubectl scale agent mr-reviewer --replicas=3

# Configure HPA
kubectl autoscale agent mr-reviewer \
  --min=1 --max=5 \
  --cpu-percent=70
```

### Monitor Health
```bash
# Get agent status
kubectl get agents -o wide

# Check events
kubectl get events --field-selector involvedObject.kind=Agent

# View logs
kubectl logs -l agent=mr-reviewer -f
```

### Rolling Update
```bash
# Update agent version
kubectl set image agent/mr-reviewer \
  agent=ghcr.io/blueflyio/mr-reviewer:v1.1.0

# Check rollout
kubectl rollout status agent/mr-reviewer
```

## Cluster Configuration

```yaml
clusters:
  orbstack-local:
    context: orbstack
    type: local

  production:
    context: prod-cluster
    type: managed
```

## LLM Routing

```yaml
routing:
  providers:
    - name: anthropic
      priority: 1
      models: [claude-sonnet-4-20250514, claude-3-haiku]

    - name: openai
      priority: 2
      models: [gpt-4o, gpt-4o-mini]

  fallback:
    enabled: true
    order: [anthropic, openai]
```

## Access Control

```yaml
access:
  tier: tier_2_write_limited
  permissions:
    - read:kubernetes
    - write:kubernetes
  prohibited:
    - delete:production
    - write:cluster_admin
```

## Examples

### Deploy New Agent
```
User: Deploy mr-reviewer to production
Agent: Generating KAgent manifest...
       Applying to prod-cluster...
       ✓ Agent deployed (2 replicas)
       ✓ HPA configured (1-5 replicas)
       ✓ Health checks passing
```

### Scale for Load
```
User: Scale issue-worker to handle backlog
Agent: Current: 1 replica, 45 pending tasks
       Recommended: 3 replicas
       Scaling...
       ✓ Scaled to 3 replicas
       ✓ Load balanced across pods
```

### Troubleshoot Agent
```
User: Why is security-scanner unhealthy?
Agent: Checking agent status...
       Pod: security-scanner-abc123
       Status: CrashLoopBackOff
       Reason: OOMKilled (256Mi limit)
       Fix: Increase memory to 512Mi
       Apply? [y/n]
```

## Service Account

- **Account**: kagent-worker
- **Group**: blueflyio
- **KAgent Version**: 0.1.x
- **CRD Version**: v1alpha1

## References

- [OSSA v0.3.2 Specification](https://gitlab.com/blueflyio/openstandardagents)
- [KAgent Documentation](https://kagent.dev/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs)
