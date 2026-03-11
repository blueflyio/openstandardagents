---
name: k8s-ops
description: "**Kubernetes Operations Agent**: Infrastructure operations for Kubernetes clusters including deployments, scaling, health checks, log analysis, resource optimization, and incident response. Supports OrbStack, K3s, and managed K8s. - MANDATORY TRIGGERS: k8s, kubernetes, pod, deployment, scale, kubectl, helm, node, cluster, container, restart pod, logs, OrbStack, namespace, service mesh"
license: "Apache-2.0"
compatibility: "Requires kubectl, helm, k9s. Environment: KUBECONFIG, cluster access"
allowed-tools: "Bash(kubectl:*) Bash(helm:*) Bash(docker:*) Read Edit Task mcp__filesystem__*"
metadata:
  ossa_manifest: ~/Sites/LLM/platform-agents/packages/@ossa/k8s-ops-worker/agent.ossa.yaml
  service_account: bot-infra-prod
  service_account_id: 31840516
  domain: infrastructure
  tier: worker
  autonomy: supervised
  ossa_version: v0.3.2
  npm_package: "@bluefly/openstandardagents"
---

# Kubernetes Operations Agent Skill

**OSSA Agent**: `k8s-ops-worker` | **Version**: 1.0.0 | **Namespace**: blueflyio

This skill invokes the **k8s-ops-worker** OSSA agent for Kubernetes cluster operations and infrastructure management.

## Quick Start

```bash
# Verify cluster access
kubectl cluster-info
kubectl get nodes

# For OrbStack (local)
orb status
kubectl config use-context orbstack
```

## Agent Capabilities (from OSSA Manifest)

### Cluster Operations
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `cluster_health_check` | reasoning | fully_autonomous | Monitor cluster health |
| `node-status` | reasoning | fully_autonomous | Check node status |
| `resource-usage` | reasoning | fully_autonomous | Analyze resource usage |

### Deployment Management
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `deployment_management` | action | supervised | Manage deployments |
| `rollout-restart` | action | supervised | Restart deployments |
| `scale-deployment` | action | supervised | Scale replicas |
| `rollback-deployment` | action | supervised | Rollback to previous |

### Pod Operations
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `pod_operations` | action | supervised | Pod lifecycle management |
| `pod-logs` | reasoning | fully_autonomous | Retrieve pod logs |
| `pod-exec` | action | supervised | Execute in pod |
| `pod-delete` | action | human_approval | Delete pods |

### Helm Operations
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `helm_management` | action | supervised | Helm chart management |
| `helm-install` | action | supervised | Install charts |
| `helm-upgrade` | action | supervised | Upgrade releases |
| `helm-rollback` | action | supervised | Rollback releases |

### Troubleshooting
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `troubleshooting` | reasoning | fully_autonomous | Diagnose issues |
| `event-analysis` | reasoning | fully_autonomous | Analyze K8s events |
| `resource-debugging` | reasoning | fully_autonomous | Debug resources |

## Common Operations

### Health Check
```bash
# Cluster overview
kubectl get nodes -o wide
kubectl top nodes
kubectl get pods --all-namespaces | grep -v Running

# Events (recent issues)
kubectl get events --sort-by='.lastTimestamp' -A | tail -20

# Resource quotas
kubectl describe resourcequotas -A
```

### Deployment Operations
```bash
# List deployments
kubectl get deployments -A

# Restart deployment (zero-downtime)
kubectl rollout restart deployment/<name> -n <namespace>

# Scale deployment
kubectl scale deployment/<name> --replicas=3 -n <namespace>

# Check rollout status
kubectl rollout status deployment/<name> -n <namespace>

# Rollback
kubectl rollout undo deployment/<name> -n <namespace>
```

### Pod Troubleshooting
```bash
# Get pod logs
kubectl logs <pod> -n <namespace> --tail=100

# Follow logs
kubectl logs -f <pod> -n <namespace>

# Previous container logs (after crash)
kubectl logs <pod> -n <namespace> --previous

# Exec into pod
kubectl exec -it <pod> -n <namespace> -- /bin/sh

# Describe pod (events, conditions)
kubectl describe pod <pod> -n <namespace>
```

### Resource Analysis
```bash
# Top pods by CPU
kubectl top pods -A --sort-by=cpu | head -20

# Top pods by memory
kubectl top pods -A --sort-by=memory | head -20

# Resource requests vs limits
kubectl get pods -A -o=jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].resources}{"\n"}{end}'
```

### Helm Operations
```bash
# List releases
helm list -A

# Install chart
helm install <release> <chart> -n <namespace> -f values.yaml

# Upgrade release
helm upgrade <release> <chart> -n <namespace> -f values.yaml

# Rollback
helm rollback <release> <revision> -n <namespace>

# History
helm history <release> -n <namespace>
```

## OrbStack-Specific Operations

```bash
# OrbStack status
orb status

# Start OrbStack
open -a OrbStack

# Switch context
kubectl config use-context orbstack

# OrbStack k8s resources
orb k8s list

# Memory optimization
orb config set kubernetes.memory 8
```

## Namespace Management

```bash
# List namespaces
kubectl get namespaces

# Create namespace
kubectl create namespace <name>

# Set default namespace
kubectl config set-context --current --namespace=<name>

# Resource usage by namespace
kubectl top pods -n <namespace>
```

## Common Issue Patterns

### CrashLoopBackOff
```bash
# Get pod events
kubectl describe pod <pod> -n <namespace>

# Check logs
kubectl logs <pod> -n <namespace> --previous

# Common causes:
# 1. Missing config/secrets
# 2. Failed health checks
# 3. OOM killed
# 4. Application crash
```

### ImagePullBackOff
```bash
# Check image name
kubectl describe pod <pod> -n <namespace> | grep Image

# Verify registry secret
kubectl get secrets -n <namespace>

# Common fixes:
# 1. Correct image name/tag
# 2. Add imagePullSecrets
# 3. Check registry auth
```

### Pending Pods
```bash
# Check events
kubectl describe pod <pod> -n <namespace>

# Check node resources
kubectl describe nodes | grep -A 5 "Allocated resources"

# Common causes:
# 1. Insufficient resources
# 2. Node selector mismatch
# 3. Taint/toleration issues
```

### OOMKilled
```bash
# Check container exit code
kubectl describe pod <pod> -n <namespace> | grep -A 10 "State"

# Increase memory limit
kubectl patch deployment <name> -n <namespace> -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container>","resources":{"limits":{"memory":"512Mi"}}}]}}}}'
```

## Access Control (OSSA Spec)

```yaml
access:
  tier: tier_3_write
  permissions:
    - read:cluster
    - read:pods
    - read:logs
    - write:deployments
    - write:pods
    - execute:pods
  prohibited:
    - delete:namespace
    - delete:pvc
    - write:rbac
  human_approval_required:
    - delete:pods
    - scale:0  # Scale to zero requires approval
```

## Observability Integration

```yaml
custom_metrics:
  - name: pods_restarted
    type: counter
    description: "Pods restarted by agent"
  - name: deployments_scaled
    type: counter
    description: "Deployments scaled"
  - name: incidents_resolved
    type: counter
    description: "K8s incidents auto-resolved"

logging:
  structured: true
  fields:
    - cluster
    - namespace
    - resource_type
    - action
```

## Cluster Inventory (Local)

```yaml
clusters:
  orbstack:
    context: orbstack
    type: local
    namespaces: 25
    nodes: 1

  k3s-m4:
    context: k3s-m4
    type: k3s
    ip: 100.108.129.7
    nodes: 1

  k3s-m3:
    context: k3s-m3
    type: k3s
    ip: 100.108.180.36
    nodes: 1
```

## Integration with Claude Code

Triggered by:
- "Check cluster health"
- "Restart deployment X"
- "Why is pod crashing?"
- "Scale to 3 replicas"
- "Show pod logs"
- "Deploy with Helm"

## Examples

### Health Check
```
User: Check k8s cluster health
Agent: Checking cluster...
       Nodes: 1/1 Ready
       Pods: 87/92 Running (5 Pending)
       Events: 3 warnings in last hour
       Top CPU: phoenix-server (450m)
       Top Memory: postgres (1.2Gi)
       Issues: 5 pending pods in llm-platform namespace
```

### Troubleshooting
```
User: Why is my-app pod crashing?
Agent: Analyzing pod my-app-xyz...
       Status: CrashLoopBackOff
       Exit Code: 137 (OOMKilled)
       Memory Limit: 256Mi
       Peak Usage: 312Mi
       FIX: Increase memory limit to 512Mi
       Command: kubectl patch deployment my-app -p '...'
```

### Scaling
```
User: Scale frontend to 5 replicas
Agent: Current: 3 replicas
       Scaling to 5...
       ✓ Deployment scaled
       ✓ All pods running
       ✓ Service endpoints updated
```

## Service Account

- **Account**: bot-infra-prod
- **ID**: 31840516
- **Group**: blueflyio
- **Permissions**: Infrastructure operations

## Related Agents

- `ci-fixer-worker` - Fix deployment pipelines
- `security-scanner` - Scan container images
- `wiki-aggregator` - Document infrastructure

## References

- [OSSA v0.3.2 Specification](https://gitlab.com/blueflyio/openstandardagents)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [OrbStack Documentation](https://orbstack.dev/docs)
