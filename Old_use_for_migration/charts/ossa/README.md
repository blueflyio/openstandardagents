# OSSA Helm Chart v0.1.8

## Overview

This Helm chart deploys the Open Standards for Scalable Agents (OSSA) v0.1.8 platform with support for different environments and a target of 99.97% uptime in production.

## Architecture

OSSA consists of the following core services:

- **Gateway Service**: Main API gateway and entry point
- **Task Agent**: Handles task execution and management
- **Communication Agent**: Manages inter-agent communication
- **MCP Bridge Agent**: Model Context Protocol integration
- **Coordination Service**: Central coordination and orchestration
- **Discovery Service**: Agent discovery and capability matching
- **Orchestration Service**: Workflow orchestration and management
- **Monitoring Service**: System monitoring and health checks

## Prerequisites

- Kubernetes 1.19+
- Helm 3.8+
- PV provisioner support in the underlying infrastructure
- At least 4GB memory and 2 CPU cores available in the cluster

### Optional Dependencies

- Prometheus Operator (for monitoring)
- cert-manager (for TLS certificates)
- NGINX Ingress Controller (for ingress)

## Installation

### Quick Start

```bash
# Add the OSSA Helm repository (if published)
helm repo add ossa https://charts.ossa-standard.org
helm repo update

# Install OSSA with default values (development environment)
helm install ossa ossa/ossa

# Or install from local chart directory
helm install ossa ./charts/ossa
```

### Environment-Specific Installations

#### Development Environment

```bash
helm install ossa ./charts/ossa \
  --values ./charts/ossa/values/values-dev.yaml \
  --namespace ossa-dev \
  --create-namespace
```

#### Staging Environment

```bash
helm install ossa ./charts/ossa \
  --values ./charts/ossa/values/values-staging.yaml \
  --namespace ossa-staging \
  --create-namespace
```

#### Production Environment (99.97% Uptime Target)

```bash
# Create production namespace
kubectl create namespace ossa-production

# Create required secrets
kubectl create secret generic ossa-postgresql-secret \
  --from-literal=postgres-password="your-secure-postgres-password" \
  --from-literal=password="your-secure-user-password" \
  --namespace ossa-production

kubectl create secret generic ossa-grafana-secret \
  --from-literal=admin-password="your-secure-grafana-password" \
  --namespace ossa-production

# Install with production values
helm install ossa ./charts/ossa \
  --values ./charts/ossa/values/values-production.yaml \
  --namespace ossa-production \
  --timeout 10m0s
```

### Custom Installation

```bash
# Install with custom values
helm install ossa ./charts/ossa \
  --set global.environment=production \
  --set ossa.uptime.target="99.99%" \
  --set services.gateway.replicaCount=5 \
  --namespace ossa-custom \
  --create-namespace
```

## Configuration

### Core Configuration Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.environment` | Environment (dev/staging/production) | `dev` |
| `ossa.version` | OSSA version | `0.1.8+rev2` |
| `ossa.phase` | OSSA development phase | `phase4` |
| `ossa.scale` | Scale configuration | `enterprise` |
| `ossa.uptime.target` | Uptime SLA target | `99.97%` |

### High Availability Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `highAvailability.enabled` | Enable HA features | `true` |
| `highAvailability.podDisruptionBudgets.enabled` | Enable PDBs | `true` |
| `highAvailability.antiAffinity.enabled` | Enable anti-affinity | `true` |
| `highAvailability.antiAffinity.type` | Anti-affinity type (soft/hard) | `soft` |
| `highAvailability.multiZone.enabled` | Enable multi-zone deployment | `true` |

### Service Configuration

Each service can be configured with:

- `enabled`: Enable/disable the service
- `replicaCount`: Number of replicas
- `minReplicas`/`maxReplicas`: HPA scaling limits
- `resources`: CPU and memory requests/limits
- `env`: Environment variables

Example:
```yaml
services:
  gateway:
    enabled: true
    replicaCount: 3
    minReplicas: 3
    maxReplicas: 10
    resources:
      requests:
        memory: "512Mi"
        cpu: "500m"
      limits:
        memory: "1Gi"
        cpu: "1000m"
```

### Database Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `postgresql.enabled` | Enable PostgreSQL | `true` |
| `postgresql.architecture` | Architecture (standalone/replication) | `replication` |
| `redis.enabled` | Enable Redis | `true` |
| `redis.architecture` | Architecture (standalone/replication) | `replication` |
| `qdrant.enabled` | Enable Qdrant | `true` |

### Monitoring Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `monitoring.prometheus.enabled` | Enable Prometheus | `true` |
| `monitoring.grafana.enabled` | Enable Grafana | `true` |
| `monitoring.alertmanager.enabled` | Enable AlertManager | `true` |

## Upgrading

### Standard Upgrade

```bash
# Upgrade to new version
helm upgrade ossa ./charts/ossa \
  --namespace ossa-production \
  --values ./charts/ossa/values/values-production.yaml
```

### Rolling Upgrade with Zero Downtime

```bash
# Check upgrade compatibility
helm diff upgrade ossa ./charts/ossa \
  --namespace ossa-production \
  --values ./charts/ossa/values/values-production.yaml

# Perform rolling upgrade
helm upgrade ossa ./charts/ossa \
  --namespace ossa-production \
  --values ./charts/ossa/values/values-production.yaml \
  --atomic \
  --cleanup-on-fail \
  --timeout 15m0s
```

### Rollback

```bash
# List release history
helm history ossa --namespace ossa-production

# Rollback to previous version
helm rollback ossa --namespace ossa-production

# Rollback to specific revision
helm rollback ossa 2 --namespace ossa-production
```

## Monitoring and Observability

### Accessing Services

#### Port Forwarding (Development)

```bash
# Gateway API
kubectl port-forward svc/ossa-gateway 3000:3000 -n ossa-dev

# Grafana Dashboard
kubectl port-forward svc/ossa-grafana 3080:3000 -n ossa-dev

# Prometheus
kubectl port-forward svc/ossa-prometheus 9090:9090 -n ossa-dev
```

#### Ingress (Staging/Production)

- API Gateway: `https://ossa-api.example.com`
- Monitoring Dashboard: `https://ossa-monitoring.example.com`

### Health Checks

```bash
# Check all pods status
kubectl get pods -n ossa-production -l app.kubernetes.io/name=ossa

# Check service endpoints
kubectl get endpoints -n ossa-production

# Check HPA status
kubectl get hpa -n ossa-production

# Check PDB status
kubectl get pdb -n ossa-production
```

### SLA Monitoring

The chart includes comprehensive monitoring for the 99.97% uptime SLA:

- Service availability monitoring
- Response time tracking
- Resource utilization alerts
- Infrastructure dependency monitoring
- Automated SLA breach notifications

### Key Metrics

- `ossa:uptime_percentage_5m`: 5-minute uptime percentage
- `ossa:uptime_percentage_1h`: 1-hour uptime percentage
- `ossa:uptime_percentage_24h`: 24-hour uptime percentage

## Troubleshooting

### Common Issues

#### Service Discovery Problems

```bash
# Check DNS resolution
kubectl exec -it deployment/ossa-gateway -n ossa-production -- nslookup ossa-coordination

# Check service endpoints
kubectl get endpoints ossa-coordination -n ossa-production
```

#### Database Connectivity

```bash
# Check PostgreSQL connection
kubectl exec -it deployment/ossa-gateway -n ossa-production -- \
  nc -zv ossa-postgresql 5432

# Check Redis connection
kubectl exec -it deployment/ossa-gateway -n ossa-production -- \
  nc -zv ossa-redis-master 6379
```

#### Resource Constraints

```bash
# Check resource usage
kubectl top pods -n ossa-production
kubectl describe hpa -n ossa-production

# Check node capacity
kubectl describe nodes
```

### Performance Tuning

#### For High Load Scenarios

```yaml
# Increase replica counts
services:
  gateway:
    replicaCount: 5
    maxReplicas: 20
  orchestration:
    replicaCount: 5
    maxReplicas: 25

# Adjust resource limits
services:
  gateway:
    resources:
      requests:
        memory: "1Gi"
        cpu: "1000m"
      limits:
        memory: "2Gi"
        cpu: "2000m"

# Enable more aggressive HPA scaling
hpa:
  metrics:
    cpu:
      targetAverageUtilization: 50
    memory:
      targetAverageUtilization: 50
```

## Security

### Production Security Checklist

- [ ] Use secure passwords for all databases
- [ ] Enable TLS for all external communications
- [ ] Configure network policies
- [ ] Enable pod security contexts
- [ ] Use dedicated service accounts
- [ ] Enable audit logging
- [ ] Configure RBAC properly
- [ ] Scan images for vulnerabilities

### Network Policies

Network policies are enabled by default in production and staging environments to restrict pod-to-pod communication.

### Security Contexts

All pods run with restricted security contexts:
- Non-root user (UID 1000)
- Read-only root filesystem
- No privilege escalation
- Dropped capabilities

## Backup and Disaster Recovery

### Database Backups

```bash
# PostgreSQL backup
kubectl exec -it ossa-postgresql-primary-0 -n ossa-production -- \
  pg_dump -U ossa_production ossa_production > ossa-backup-$(date +%Y%m%d).sql

# Redis backup
kubectl exec -it ossa-redis-master-0 -n ossa-production -- \
  redis-cli --rdb /tmp/dump.rdb
```

### Qdrant Vector Database Backup

```bash
# Create Qdrant snapshot
kubectl exec -it ossa-qdrant-0 -n ossa-production -- \
  curl -X POST "http://localhost:6333/collections/{collection_name}/snapshots"
```

## Support

For issues and support:

- Documentation: https://docs.ossa-standard.org
- Issues: https://gitlab.com/bluefly-ai/ossa-standard/issues
- Community: https://community.ossa-standard.org

## License

Apache License 2.0