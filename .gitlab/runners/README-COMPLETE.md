# OSSA Runners - Complete Infrastructure Guide

## Overview

Complete auto-scaling, self-healing GitLab runner infrastructure for OSSA projects with Kubernetes executors.

## Quick Start

```bash
# Deploy everything
./.gitlab/runners/deploy-all.sh

# Or deploy individually
kubectl apply -f .gitlab/runners/k8s-autoscaler-deployment.yaml
kubectl apply -f .gitlab/runners/self-healing-config.yaml
kubectl apply -f .gitlab/runners/monitoring-alerts.yaml
```

## Architecture

### Components

1. **Auto-Scaling Runners** - Kubernetes HPA (1-10 replicas)
2. **Self-Healing System** - Health probes, auto-restart, circuit breaker
3. **Monitoring Stack** - Prometheus, ServiceMonitor, alerts
4. **Backup System** - Config backups every 6 hours
5. **Security Hardening** - Network policies, PSP, TLS
6. **Cost Optimization** - Spot instances, resource optimization
7. **Performance Tuning** - Optimized settings for throughput

### Features

- ✅ Auto-scaling (CPU/Memory/Pods metrics)
- ✅ Self-healing (health checks, auto-restart)
- ✅ Circuit breaker (failure protection)
- ✅ Monitoring (Prometheus metrics)
- ✅ Alerting (5 alert rules)
- ✅ Backup & recovery (6-hour backups)
- ✅ Security (network policies, PSP)
- ✅ Cost optimization (spot instances)
- ✅ Performance tuning (optimized configs)
- ✅ Multi-cluster support (ready)
- ✅ Observability (metrics, logs, traces)

## Configuration Files

| File | Purpose |
|------|---------|
| `k8s-autoscaler-deployment.yaml` | Main deployment with HPA |
| `self-healing-config.yaml` | Health checks, PDB |
| `circuit-breaker.yaml` | Circuit breaker logic |
| `monitoring-alerts.yaml` | Prometheus alerts |
| `backup-recovery.yaml` | Backup jobs |
| `advanced-features.yaml` | Quotas, priorities |
| `security-hardening.yaml` | Security policies |
| `cost-optimization.yaml` | Spot instances, scheduling |
| `performance-tuning.yaml` | Performance configs |
| `observability-stack.yaml` | Full observability |
| `multi-cluster.yaml` | Multi-cluster config |

## Usage

### Tag Jobs for Auto-Scaling Runners

```yaml
my-job:
  tags:
    - kubernetes
    - autoscaler
  script:
    - echo "Running on auto-scaling runner"
```

### Use Priority Classes

```yaml
high-priority-job:
  tags:
    - kubernetes
    - high-priority
  script:
    - echo "High priority job"
```

### Monitor Runners

```bash
# Check pods
kubectl get pods -n gitlab-runner

# Check HPA
kubectl get hpa -n gitlab-runner

# View metrics
kubectl port-forward -n gitlab-runner svc/gitlab-runner-metrics 8093:8093
curl http://localhost:8093/metrics

# View logs
kubectl logs -f deployment/gitlab-runner-autoscaler -n gitlab-runner
```

## Self-Healing Behaviors

- **Health Checks**: Every 5-10 seconds
- **Auto-Restart**: Pods with >5 restarts are replaced
- **Circuit Breaker**: Opens after 5 failures, closes after 2 successes
- **Backup**: Configs backed up every 6 hours
- **Monitoring**: Real-time Prometheus metrics
- **Alerts**: 5 alert rules for critical issues

## Cost Optimization

- **Spot Instances**: Available for non-critical jobs
- **Auto-Scaling**: Scales down during low-traffic periods
- **Resource Optimization**: Right-sizing based on usage
- **Cost Tracking**: Budget alerts at 80% threshold

## Security

- **Network Policies**: Isolated network access
- **Pod Security**: Non-root, read-only where possible
- **TLS**: Certificate management ready
- **Secrets**: Secure secret management

## Troubleshooting

```bash
# Check runner status
kubectl get pods -n gitlab-runner

# Check HPA status
kubectl describe hpa gitlab-runner-autoscaler -n gitlab-runner

# Check events
kubectl get events -n gitlab-runner --sort-by='.lastTimestamp'

# View runner logs
kubectl logs -f deployment/gitlab-runner-autoscaler -n gitlab-runner

# Restart deployment
kubectl rollout restart deployment/gitlab-runner-autoscaler -n gitlab-runner
```
