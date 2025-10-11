# OSSA Agent Workspace Configuration

Configuration and management of OSSA agent workspaces for development and deployment.

---

## Overview

An OSSA workspace provides the runtime environment and infrastructure for deploying and managing OSSA-compliant agents. This document covers workspace configuration, agent registration, and operational management.

---

## Workspace Structure

```
workspace/
├── config/
│   ├── workspace.yml       # Workspace configuration
│   └── registry.yml        # Agent registry
├── agents/
│   ├── compliance/
│   │   └── agent.yml
│   ├── chat/
│   │   └── agent.yml
│   └── orchestration/
│       └── agent.yml
├── deployments/
│   ├── docker-compose.yml
│   └── k8s/
│       ├── namespace.yml
│       ├── deployments.yml
│       └── services.yml
├── data/
│   ├── logs/
│   └── metrics/
└── scripts/
    ├── deploy.sh
    └── validate.sh
```

---

## Workspace Configuration

### workspace.yml

```yaml
ossaVersion: "1.0"
workspace:
  id: production-workspace
  name: Production Agent Workspace
  version: 1.0.0

  environment: production

  registry:
    type: local
    path: ./config/registry.yml

  runtime:
    orchestration:
      enabled: true
      replicas: 3
    monitoring:
      prometheus:
        enabled: true
        port: 9090
      grafana:
        enabled: true
        port: 3000
    logging:
      level: info
      format: json
      aggregator: elasticsearch

  networking:
    service_mesh:
      enabled: true
      type: istio
    ingress:
      enabled: true
      class: nginx
      tls:
        enabled: true

  storage:
    type: persistent
    class: fast-ssd
    size: 100Gi

  security:
    mtls:
      enabled: true
    rbac:
      enabled: true
    network_policies:
      enabled: true
    pod_security_policies:
      enabled: true

  compliance:
    frameworks:
      - iso-27001
      - soc-2
      - fedramp
    audit_logging:
      enabled: true
      retention_days: 90
```

---

## Agent Registry

### registry.yml

```yaml
ossaVersion: "1.0"
registry:
  id: workspace-registry
  version: 1.0.0

  agents:
    - id: compliance-scanner
      name: FedRAMP Compliance Scanner
      version: 1.0.0
      role: compliance
      status: active
      location: ./agents/compliance/agent.yml
      deployment:
        replicas: 2
        namespace: compliance

    - id: support-chatbot
      name: Customer Support Chatbot
      version: 1.0.0
      role: chat
      status: active
      location: ./agents/chat/agent.yml
      deployment:
        replicas: 5
        namespace: customer-service

    - id: workflow-orchestrator
      name: Workflow Orchestrator
      version: 1.0.0
      role: orchestration
      status: active
      location: ./agents/orchestration/agent.yml
      deployment:
        replicas: 3
        namespace: orchestration

  metadata:
    created: "2025-01-15T00:00:00Z"
    updated: "2025-01-15T00:00:00Z"
    total_agents: 3
    active_agents: 3
```

---

## Deployment Configurations

### Docker Compose

```yaml
version: '3.8'

services:
  # Compliance Agent
  compliance-scanner:
    image: ossa/compliance-scanner:1.0.0
    ports:
      - "8001:8080"
      - "9001:9090"
    environment:
      - AGENT_ID=compliance-scanner
      - WORKSPACE_ID=production-workspace
      - LOG_LEVEL=info
    volumes:
      - ./data/compliance:/data
    networks:
      - ossa-network
    restart: unless-stopped

  # Chat Agent
  support-chatbot:
    image: ossa/support-chatbot:1.0.0
    ports:
      - "8002:8080"
      - "9002:9090"
    environment:
      - AGENT_ID=support-chatbot
      - WORKSPACE_ID=production-workspace
      - LOG_LEVEL=info
    networks:
      - ossa-network
    restart: unless-stopped

  # Orchestrator Agent
  workflow-orchestrator:
    image: ossa/orchestrator:1.0.0
    ports:
      - "8003:8080"
      - "9003:9090"
    environment:
      - AGENT_ID=workflow-orchestrator
      - WORKSPACE_ID=production-workspace
      - LOG_LEVEL=info
    networks:
      - ossa-network
    restart: unless-stopped

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - ossa-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - ossa-network

networks:
  ossa-network:
    driver: bridge

volumes:
  prometheus-data:
  grafana-data:
```

### Kubernetes Deployment

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ossa-workspace
  labels:
    workspace: production

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: compliance-scanner
  namespace: ossa-workspace
spec:
  replicas: 2
  selector:
    matchLabels:
      app: compliance-scanner
      role: compliance
  template:
    metadata:
      labels:
        app: compliance-scanner
        role: compliance
    spec:
      containers:
      - name: agent
        image: ossa/compliance-scanner:1.0.0
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 9090
          name: metrics
        env:
        - name: AGENT_ID
          value: compliance-scanner
        - name: WORKSPACE_ID
          value: production-workspace
        resources:
          limits:
            cpu: "2"
            memory: "4Gi"
          requests:
            cpu: "1"
            memory: "2Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: compliance-scanner
  namespace: ossa-workspace
  labels:
    app: compliance-scanner
spec:
  type: ClusterIP
  ports:
  - port: 8080
    targetPort: 8080
    name: http
  - port: 9090
    targetPort: 9090
    name: metrics
  selector:
    app: compliance-scanner
```

---

## Monitoring Configuration

### Prometheus Configuration

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'ossa-agents'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - ossa-workspace
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_role]
        action: keep
        regex: compliance|chat|orchestration|monitoring
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod
      - source_labels: [__meta_kubernetes_pod_label_app]
        target_label: agent
    metric_relabel_configs:
      - source_labels: [__name__]
        regex: 'agent_.*'
        action: keep

  - job_name: 'ossa-workspace'
    static_configs:
      - targets:
          - 'workspace-api:8080'
        labels:
          component: workspace
```

---

## Security Configuration

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ossa-agent-policy
  namespace: ossa-workspace
spec:
  podSelector:
    matchLabels:
      workspace: ossa
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          workspace: ossa
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
    - protocol: TCP
      port: 9090
  egress:
  - to:
    - podSelector:
        matchLabels:
          workspace: ossa
    ports:
    - protocol: TCP
      port: 8080
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
```

### RBAC Configuration

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ossa-agent
  namespace: ossa-workspace

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ossa-agent-role
  namespace: ossa-workspace
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ossa-agent-binding
  namespace: ossa-workspace
subjects:
- kind: ServiceAccount
  name: ossa-agent
roleRef:
  kind: Role
  name: ossa-agent-role
  apiGroup: rbac.authorization.k8s.io
```

---

## Operational Tasks

### Agent Management

```bash
# List all agents in workspace
ossa workspace list-agents

# Deploy agent
ossa deploy agent.yml --workspace production-workspace

# Scale agent
ossa scale compliance-scanner --replicas 5

# Update agent
ossa update compliance-scanner --version 1.1.0

# Remove agent
ossa remove compliance-scanner --workspace production-workspace

# View agent status
ossa status compliance-scanner

# View agent logs
ossa logs compliance-scanner --follow

# View agent metrics
ossa metrics compliance-scanner --duration 1h
```

### Workspace Management

```bash
# Create workspace
ossa workspace create --config workspace.yml

# Validate workspace configuration
ossa workspace validate --config workspace.yml

# Deploy workspace to Kubernetes
ossa workspace deploy --environment production

# Check workspace health
ossa workspace health

# View workspace metrics
ossa workspace metrics --all-agents

# Export workspace configuration
ossa workspace export --output workspace-backup.yml
```

---

## Best Practices

### 1. Workspace Organization

- Use separate namespaces for different agent roles
- Implement clear naming conventions
- Maintain consistent versioning
- Document agent dependencies

### 2. Resource Management

- Set appropriate resource limits
- Monitor resource utilization
- Implement autoscaling policies
- Plan for peak load

### 3. Security

- Enable mTLS between agents
- Implement network policies
- Use RBAC for access control
- Regular security audits

### 4. Monitoring

- Monitor all agents continuously
- Set up alerting for anomalies
- Track performance metrics
- Implement distributed tracing

### 5. High Availability

- Deploy multiple replicas
- Use pod anti-affinity rules
- Implement health checks
- Plan for disaster recovery

---

## Troubleshooting

### Common Issues

**Agent won't start**
- Check resource availability
- Verify image availability
- Review container logs
- Validate agent manifest

**Poor performance**
- Check resource limits
- Review metrics for bottlenecks
- Analyze network latency
- Consider scaling up

**Health checks failing**
- Verify endpoint availability
- Check startup time
- Review application logs
- Validate configuration

---

## Additional Resources

- [Agent Specification](agents.md)
- [OSSA Schema](../../../spec/ossa-1.0.schema.json)
- [Deployment Guide](../../../SETUP.md)
- [Monitoring Guide](index.md#monitoring-and-observability)

---

**OSSA 1.0.0 Workspace Configuration**
