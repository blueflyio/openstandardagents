# OSSA Deployment Guide

## Overview

This document provides comprehensive deployment instructions for OSSA (Open Standards Scalable Agents) v0.1.9-alpha.1, covering installation, configuration, and production deployment scenarios.

## Package Installation

### NPM Installation

#### Global CLI Installation
```bash
# Install OSSA globally for CLI access
npm install -g @bluefly/open-standards-scalable-agents

# Verify installation
ossa --version
# Expected: 0.1.9-alpha.1
```

#### Project Integration
```bash
# Install as project dependency
npm install @bluefly/open-standards-scalable-agents

# Import in your code
import { 
  Agent, 
  Orchestrator, 
  MCPServer, 
  GitLabClient 
} from '@bluefly/open-standards-scalable-agents';
```

### Development Installation

```bash
# Clone source repository
git clone https://gitlab.com/ossa/ossa.git
cd ossa/OSSA/__REBUILD

# Install dependencies
npm install

# Build the package
npm run build

# Link for local development
npm link

# Test installation
ossa --version
```

## Environment Setup

### Prerequisites

```bash
# Required versions
node --version  # >= 20.0.0
npm --version   # >= 10.0.0
git --version   # >= 2.40.0
docker --version # >= 24.0.0 (for containers)
kubectl version  # >= 1.28.0 (for K8s)
```

### Local Development Environment

```bash
# Initialize new OSSA project
ossa init my-ai-project
cd my-ai-project

# Project structure created:
# .agent-workspace/  - Global orchestration
# .agent/           - Project-level config
# .agents/          - Agent definitions
# package.json      - Project configuration
```

### Agent Workspace Configuration

#### Workspace Configuration (.agent-workspace/workspace.yml)
```yaml
apiVersion: open-standards-scalable-agents/v0.1.9
kind: Workspace
metadata:
  name: ossa-workspace
  version: 0.1.9-alpha.1
spec:
  discovery:
    enabled: true
    strategies:
      - filesystem_scan
      - uadp_network
  orchestration:
    max_concurrent: 8
    timeout: 45000
  compliance:
    tier: governed
    frameworks:
      - NIST-800-53
      - ISO-42001
  resources:
    limits:
      memory: "2Gi"
      cpu: "1000m"
    requests:
      memory: "512Mi"
      cpu: "250m"
```

#### Agent Registry (.agent-workspace/registry.yml)
```yaml
apiVersion: ossa.io/v0.1.9
kind: Registry
agents:
  - id: example-worker
    name: Example Worker Agent
    type: worker
    status: active
    endpoint: http://localhost:3001
    capabilities:
      - text-processing
      - data-transformation
    health:
      last_check: 2025-01-15T10:30:00Z
      status: healthy
```

## Container Deployment

### Docker Configuration

#### Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S ossa
RUN adduser -S ossa -u 1001

# Set permissions
RUN chown -R ossa:ossa /app
USER ossa

# Expose ports
EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start command
CMD ["node", "dist/index.js"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  ossa-orchestrator:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - WORKSPACE_PATH=/app/workspace
    volumes:
      - ./workspace:/app/workspace
      - ./logs:/app/logs
    restart: unless-stopped
    
  ossa-agent-1:
    build: .
    command: ["node", "dist/agent.js"]
    ports:
      - "3001:3000"
    environment:
      - AGENT_TYPE=worker
      - AGENT_NAME=worker-1
      - ORCHESTRATOR_URL=http://ossa-orchestrator:8080
    depends_on:
      - ossa-orchestrator
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

## Kubernetes Deployment

### Helm Charts

#### Chart.yaml
```yaml
apiVersion: v2
name: ossa
description: Open Standards Scalable Agents Helm Chart
type: application
version: 0.1.9-alpha.1
appVersion: "0.1.9-alpha.1"
keywords:
  - ai-agents
  - orchestration
  - mcp
home: https://ossa.io
sources:
  - https://gitlab.com/ossa/ossa
maintainers:
  - name: Thomas Scola
    email: thomas@bluefly.io
```

#### values.yaml
```yaml
# OSSA Helm Chart Values
replicaCount: 3

image:
  repository: ossa/orchestrator
  pullPolicy: IfNotPresent
  tag: "0.1.9-alpha.1"

service:
  type: ClusterIP
  port: 8080
  targetPort: 8080

ingress:
  enabled: true
  className: "nginx"
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: ossa.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: ossa-tls
      hosts:
        - ossa.yourdomain.com

resources:
  limits:
    cpu: 500m
    memory: 1Gi
  requests:
    cpu: 250m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

nodeSelector: {}
tolerations: []
affinity: {}

# OSSA-specific configuration
ossa:
  workspace:
    maxConcurrentTasks: 100
    taskTimeout: 300000
  compliance:
    tier: governed
    auditingEnabled: true
  security:
    rbac:
      enabled: true
    networkPolicies:
      enabled: true
```

#### Deployment Template
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "ossa.fullname" . }}
  labels:
    {{- include "ossa.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "ossa.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
      labels:
        {{- include "ossa.selectorLabels" . | nindent 8 }}
    spec:
      serviceAccountName: {{ include "ossa.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ .Chart.Name }}
          securityContext:
            {{- toYaml .Values.securityContext | nindent 12 }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          env:
            - name: NODE_ENV
              value: "production"
            - name: WORKSPACE_MAX_CONCURRENT
              value: "{{ .Values.ossa.workspace.maxConcurrentTasks }}"
            - name: TASK_TIMEOUT
              value: "{{ .Values.ossa.workspace.taskTimeout }}"
```

### Installation Commands

```bash
# Add OSSA Helm repository
helm repo add ossa https://charts.ossa.io
helm repo update

# Install OSSA workspace
helm install ossa-workspace ossa/workspace \
  --namespace ossa \
  --create-namespace \
  --values values.yaml

# Verify installation
kubectl get pods -n ossa
kubectl get services -n ossa

# Port forward for local access
kubectl port-forward -n ossa service/ossa-workspace 8080:8080
```

## GitLab CI/CD Integration

### Pipeline Configuration (.gitlab-ci.yml)
```yaml
stages:
  - validate
  - test
  - build
  - security
  - deploy

variables:
  NODE_VERSION: "20"
  OSSA_VERSION: "0.1.9-alpha.1"

include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Container-Scanning.gitlab-ci.yml

before_script:
  - node --version
  - npm --version

validate:
  stage: validate
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run lint
    - npm run typecheck
    - ossa workspace validate
  artifacts:
    reports:
      junit: test-results.xml

test:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - main
    - develop

deploy_staging:
  stage: deploy
  image: alpine/helm:latest
  script:
    - helm upgrade --install ossa-staging ./helm/ossa \
        --namespace ossa-staging \
        --create-namespace \
        --set image.tag=$CI_COMMIT_SHA \
        --set environment=staging
  environment:
    name: staging
    url: https://ossa-staging.yourdomain.com
  only:
    - develop

deploy_production:
  stage: deploy
  image: alpine/helm:latest
  script:
    - helm upgrade --install ossa-prod ./helm/ossa \
        --namespace ossa-production \
        --create-namespace \
        --set image.tag=$CI_COMMIT_SHA \
        --set environment=production
  environment:
    name: production
    url: https://ossa.yourdomain.com
  when: manual
  only:
    - main
```

## Production Configuration

### Environment Variables
```bash
# Core Configuration
NODE_ENV=production
LOG_LEVEL=info
PORT=8080

# OSSA Configuration
OSSA_WORKSPACE_PATH=/app/workspace
OSSA_MAX_CONCURRENT_TASKS=100
OSSA_TASK_TIMEOUT=300000
OSSA_COMPLIANCE_TIER=governed

# Security
JWT_SECRET=your-jwt-secret
API_KEY=your-api-key
ENCRYPTION_KEY=your-encryption-key

# Database (if using persistent storage)
DATABASE_URL=postgresql://user:pass@host:5432/ossa
REDIS_URL=redis://redis:6379

# Monitoring
PROMETHEUS_ENABLED=true
JAEGER_ENDPOINT=http://jaeger:14268/api/traces
```

### Monitoring & Observability

#### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ossa'
    static_configs:
      - targets: ['ossa-service:8080']
    metrics_path: '/metrics'
    scrape_interval: 5s
```

#### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "OSSA Monitoring",
    "panels": [
      {
        "title": "Active Agents",
        "type": "stat",
        "targets": [
          {
            "expr": "ossa_agents_active_total",
            "legendFormat": "Active Agents"
          }
        ]
      },
      {
        "title": "Task Throughput",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ossa_tasks_completed_total[5m])",
            "legendFormat": "Tasks/sec"
          }
        ]
      }
    ]
  }
}
```

## Deployment Strategies

### Blue-Green Deployment
```bash
# Deploy to green environment
helm install ossa-green ./helm/ossa \
  --namespace ossa-green \
  --set image.tag=$NEW_VERSION

# Test green environment
kubectl port-forward -n ossa-green service/ossa 9080:8080
curl http://localhost:9080/health

# Switch traffic (update ingress)
kubectl patch ingress ossa-ingress -n ossa \
  --type='json' \
  --patch='[{"op": "replace", "path": "/spec/rules/0/http/paths/0/backend/service/name", "value": "ossa-green"}]'

# Cleanup old blue environment
helm uninstall ossa-blue -n ossa-blue
```

### Canary Deployment
```bash
# Deploy canary version (10% traffic)
helm install ossa-canary ./helm/ossa \
  --namespace ossa \
  --set image.tag=$NEW_VERSION \
  --set replicaCount=1 \
  --set ingress.annotations."nginx.ingress.kubernetes.io/canary"=true \
  --set ingress.annotations."nginx.ingress.kubernetes.io/canary-weight"=10

# Monitor metrics and gradually increase traffic
# If successful, replace main deployment
helm upgrade ossa ./helm/ossa \
  --set image.tag=$NEW_VERSION

# Cleanup canary
helm uninstall ossa-canary
```

## Rollback Procedures

### Application Rollback
```bash
# Rollback Helm deployment
helm rollback ossa 1 -n ossa

# Verify rollback
kubectl get pods -n ossa
helm history ossa -n ossa
```

### Database Rollback (if applicable)
```bash
# Restore from backup
kubectl exec -it postgres-pod -- psql -U postgres -c "DROP DATABASE ossa;"
kubectl exec -it postgres-pod -- pg_restore -U postgres -d ossa /backups/ossa-backup.sql
```

## Security Configuration

### RBAC Setup
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ossa-role
  namespace: ossa
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch", "update"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ossa-rolebinding
  namespace: ossa
subjects:
  - kind: ServiceAccount
    name: ossa-service-account
    namespace: ossa
roleRef:
  kind: Role
  name: ossa-role
  apiGroup: rbac.authorization.k8s.io
```

### Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ossa-network-policy
  namespace: ossa
spec:
  podSelector:
    matchLabels:
      app: ossa
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to: []
      ports:
        - protocol: TCP
          port: 443
        - protocol: TCP
          port: 53
        - protocol: UDP
          port: 53
```

## Troubleshooting

### Common Issues

#### Agent Registration Failures
```bash
# Check workspace logs
kubectl logs -n ossa deployment/ossa-workspace

# Validate agent manifest
ossa agent validate ./agents/my-agent

# Test connectivity
curl http://ossa-workspace:8080/workspace/registry
```

#### Performance Issues
```bash
# Check resource usage
kubectl top pods -n ossa
kubectl describe hpa ossa-hpa -n ossa

# Scale manually if needed
kubectl scale deployment ossa-workspace --replicas=5 -n ossa

# Check metrics
curl http://ossa-workspace:8080/metrics
```

#### Memory Leaks
```bash
# Monitor memory usage
kubectl exec -it ossa-pod -- ps aux
kubectl exec -it ossa-pod -- node --inspect-brk=0.0.0.0:9229 dist/index.js

# Restart deployment
kubectl rollout restart deployment/ossa-workspace -n ossa
```

### Health Checks

```bash
# Application health
curl http://ossa.yourdomain.com/health/live
curl http://ossa.yourdomain.com/health/ready

# Workspace status
ossa workspace status
ossa workspace registry

# Agent health
ossa agent test my-agent
```

## Maintenance

### Backup Procedures
```bash
# Backup workspace configuration
kubectl get configmap ossa-config -n ossa -o yaml > ossa-config-backup.yaml

# Backup persistent volumes
kubectl exec -it ossa-pod -- tar -czf /tmp/workspace-backup.tar.gz /app/workspace
kubectl cp ossa-pod:/tmp/workspace-backup.tar.gz ./workspace-backup.tar.gz
```

### Update Procedures
```bash
# Update OSSA package
helm upgrade ossa ossa/workspace \
  --version 0.1.10-alpha.1 \
  --reuse-values

# Verify update
helm list -n ossa
kubectl get pods -n ossa
```

This deployment guide provides comprehensive instructions for deploying OSSA in various environments, from local development to production Kubernetes clusters, including security, monitoring, and maintenance procedures.