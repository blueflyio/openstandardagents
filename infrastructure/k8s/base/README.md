# OSSA v0.1.8 Kubernetes Deployment Manifests

This directory contains comprehensive Kubernetes manifests for deploying the Open Standards for Scalable Agents (OSSA) platform at scale. The manifests are designed for enterprise-grade deployment with high availability, auto-scaling, service mesh integration, and geographic distribution.

## 📁 File Overview

### Core Infrastructure
- **`namespace.yaml`** - Namespaces, resource quotas, network policies, and RBAC
- **`configmaps.yaml`** - Configuration maps for all services
- **`secrets.yaml`** - Secrets, service accounts, and security policies
- **`storage.yaml`** - Storage classes, StatefulSets for databases (PostgreSQL, Redis, Qdrant)

### Application Services
- **`deployments.yaml`** - Core OSSA service deployments with resource limits
- **`services.yaml`** - Kubernetes services for internal communication
- **`autoscaling.yaml`** - HPA, VPA, and Pod Disruption Budgets

### Service Mesh & Networking
- **`istio-service-mesh.yaml`** - Istio configuration for traffic management and security
- **`ingress.yaml`** - Ingress controllers, load balancers, and external access

### Observability
- **`monitoring.yaml`** - Prometheus, Grafana, Jaeger, AlertManager deployments
- **`monitoring-configs.yaml`** - Monitoring configurations and dashboards
- **`health-checks.yaml`** - Comprehensive health checks and monitoring jobs

### Geographic Distribution
- **`multi-region.yaml`** - Multi-region deployment and cross-region coordination

## 🚀 Quick Deployment

### Prerequisites
- Kubernetes cluster (v1.24+)
- `kubectl` configured
- Istio service mesh installed
- Cert-manager for TLS certificates
- Prometheus Operator (optional, for ServiceMonitor resources)

### Basic Deployment
```bash
# 1. Create namespaces and RBAC
kubectl apply -f namespace.yaml

# 2. Apply secrets and configuration
kubectl apply -f secrets.yaml
kubectl apply -f configmaps.yaml

# 3. Deploy storage layer
kubectl apply -f storage.yaml

# 4. Deploy core services
kubectl apply -f deployments.yaml
kubectl apply -f services.yaml

# 5. Configure auto-scaling
kubectl apply -f autoscaling.yaml

# 6. Set up monitoring
kubectl apply -f monitoring.yaml
kubectl apply -f monitoring-configs.yaml

# 7. Configure health checks
kubectl apply -f health-checks.yaml

# 8. Set up ingress and load balancing
kubectl apply -f ingress.yaml

# 9. Configure service mesh (if Istio is installed)
kubectl apply -f istio-service-mesh.yaml
```

### Production Deployment with Multi-Region
```bash
# Follow basic deployment steps 1-9, then:

# 10. Deploy multi-region configuration
kubectl apply -f multi-region.yaml

# 11. Verify deployment
kubectl get pods -n ossa-platform
kubectl get services -n ossa-platform
kubectl get ingress -n ossa-platform
```

## 🏗️ Architecture Overview

### Service Components
- **Gateway Service**: Main API gateway (5 replicas, auto-scaling 5-50)
- **Task Agents**: AI task execution agents (10 replicas, auto-scaling 10-200)
- **Communication Agents**: Message routing and protocol bridging (8 replicas, auto-scaling 8-100)
- **MCP Agents**: Model Context Protocol bridge agents (6 replicas, auto-scaling 6-80)
- **Coordination Service**: Inter-agent coordination (3 replicas, auto-scaling 3-10)
- **Discovery Service**: Agent discovery and registry (5 replicas, auto-scaling 5-30)
- **Orchestration Service**: Workflow orchestration (4 replicas, auto-scaling 4-40)

### Data Layer
- **PostgreSQL**: Primary database (3 replicas with read replicas)
- **Redis**: Caching and session store (3 replicas)
- **Qdrant**: Vector database for AI operations (3 replicas)

### Monitoring Stack
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **Jaeger**: Distributed tracing
- **AlertManager**: Alert routing and management

## 🔧 Configuration

### Environment Variables
Key configuration is managed through ConfigMaps:
- `OSSA_VERSION`: Platform version (0.1.8)
- `NODE_ENV`: Environment (production)
- `REDIS_URL`, `POSTGRES_URL`, `QDRANT_URL`: Database connections
- `REGION`: Geographic region for multi-region deployments

### Resource Requirements
Minimum cluster requirements:
- **CPU**: 100 cores (requests: 50, limits: 100)
- **Memory**: 200GB (requests: 100GB, limits: 200GB)
- **Storage**: 500GB persistent storage
- **Network**: Load balancer support

### Scaling Configuration
Auto-scaling is configured based on:
- CPU utilization (70% threshold)
- Memory utilization (80% threshold)
- Custom metrics (queue depth, response time)
- Geographic traffic distribution

## 🌐 Multi-Region Deployment

The platform supports deployment across multiple geographic regions:
- **Primary**: US West (us-west-2)
- **Secondary**: US East (us-east-1)
- **Tertiary**: EU West (eu-west-1)

Features:
- Cross-region load balancing
- Data replication
- Failover capabilities
- Latency-based routing

## 🔐 Security Features

### Network Security
- Network policies restricting inter-pod communication
- Istio service mesh with mTLS
- WAF integration for application-level protection

### Authentication & Authorization
- RBAC for Kubernetes resources
- Service account isolation
- Basic auth for internal endpoints
- JWT-based API authentication

### Data Security
- Encrypted storage volumes
- TLS certificates via cert-manager
- Secret management with Kubernetes secrets
- Regular security scanning

## 📊 Monitoring & Observability

### Metrics
- Application metrics via Prometheus
- Infrastructure metrics via Node Exporter
- Custom OSSA metrics for agent performance

### Logging
- Structured logging via JSON
- Log aggregation with Loki/Promtail
- Centralized log analysis

### Tracing
- Distributed tracing with Jaeger
- Request flow visualization
- Performance bottleneck identification

### Alerting
- Comprehensive alerting rules
- Multi-channel notifications (email, Slack, PagerDuty)
- Escalation policies

## 🔄 Health Checks

Comprehensive health monitoring includes:
- **Startup probes**: For slow-starting services
- **Liveness probes**: Container health monitoring
- **Readiness probes**: Traffic routing decisions
- **Custom health endpoints**: Deep application health checks

### Database Health
- Connection pool monitoring
- Query performance tracking
- Replication lag monitoring
- Storage usage alerts

## 🚦 Load Balancing

Multiple load balancing options:
- **Network Load Balancer (NLB)**: High-performance TCP load balancing
- **Application Load Balancer (ALB)**: Advanced HTTP/HTTPS features
- **Global Load Balancer**: Multi-region traffic distribution
- **Service Mesh**: Istio-based service-to-service load balancing

## 📈 Performance Tuning

### Resource Optimization
- Vertical Pod Autoscaler (VPA) for optimal resource allocation
- Pod Disruption Budgets for high availability
- Topology spread constraints for even distribution

### Caching Strategy
- Redis for session and API caching
- CDN integration for static assets
- Database query result caching

### Connection Management
- Connection pooling for databases
- Keep-alive for HTTP connections
- Circuit breakers for fault tolerance

## 🛠️ Troubleshooting

### Common Issues
1. **Pod startup failures**: Check resource limits and storage availability
2. **Service discovery issues**: Verify DNS and network policies
3. **Database connectivity**: Check secrets and network access
4. **High memory usage**: Review resource limits and enable VPA

### Debugging Commands
```bash
# Check pod status
kubectl get pods -n ossa-platform

# View pod logs
kubectl logs -f deployment/ossa-gateway -n ossa-platform

# Check service endpoints
kubectl get endpoints -n ossa-platform

# View resource usage
kubectl top pods -n ossa-platform

# Check HPA status
kubectl get hpa -n ossa-platform

# View Istio configuration
kubectl get virtualservices -n ossa-platform
```

## 📋 Maintenance

### Updates
- Rolling updates configured for zero-downtime deployments
- Database migration jobs for schema changes
- Configuration updates via ConfigMap modifications

### Backup & Recovery
- Automated database backups
- Persistent volume snapshots
- Disaster recovery procedures

### Scaling Operations
- Manual scaling: `kubectl scale deployment/ossa-gateway --replicas=10 -n ossa-platform`
- HPA adjustment: Modify HPA resources
- Regional scaling: Deploy to additional regions

## 🔗 Integration

### External Services
- AI model providers (OpenAI, Anthropic, Cohere)
- Authentication providers (OAuth2, OIDC)
- Message queues (RabbitMQ, Apache Kafka)
- External APIs and webhooks

### Development
- Local development with Minikube or kind
- CI/CD integration with GitLab CI
- Helm charts for templated deployments
- Kustomize for environment-specific configurations

---

For additional support or questions, refer to the main OSSA documentation or contact the platform team at ossa-team@llm.bluefly.io.