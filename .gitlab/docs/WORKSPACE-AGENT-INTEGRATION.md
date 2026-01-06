# GitLab Workspace + Agent Integration Guide

## Current Setup

### GitLab Workspace
- **Name**: ossa-local
- **Location**: https://gitlab.com/groups/blueflyio/-/settings/workspaces
- **Purpose**: Cloud development environment

### GitLab Agent
- **Name**: ossa-agent
- **Config**: `.gitlab/agents/ossa-agent/config.yaml`
- **Cluster**: Local Kubernetes (via agent)

## How to Leverage Agents Better

### 1. Development Workflow with Workspace + Agent

**Use Case**: Develop and test OSSA agents in cloud workspace with direct cluster access

```yaml
# .gitlab/agents/ossa-agent/config.yaml
user_access:
  access_as:
    agent: {}
  projects:
    - id: blueflyio/openstandardagents
```

**Workflow**:
1. Open workspace: `ossa-local`
2. Agent provides kubectl access to your cluster
3. Deploy agents directly from workspace
4. Test in real Kubernetes environment

### 2. CI/CD Pipeline Integration

**Current**: Agent allows CI/CD to deploy to cluster

**Enhance**:
```yaml
# .gitlab-ci.yml
deploy:agent:
  stage: deploy
  environment:
    name: production
    kubernetes:
      namespace: ossa-agents
  script:
    - kubectl apply -f .gitlab/agents/version-manager/deployment.yaml
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

### 3. GitOps Workflow (Recommended)

**Enable in agent config**:
```yaml
gitops:
  manifest_projects:
    - id: blueflyio/openstandardagents
      default_namespace: ossa-agents
      paths:
        - glob: '.gitlab/agents/*/deployment.yaml'
        - glob: 'infrastructure/k8s/**/*.yaml'
```

**Benefits**:
- Automatic deployment on commit
- Declarative infrastructure
- Version controlled deployments
- Rollback capability

### 4. Multi-Agent Orchestration

**Current Agents**:
1. version-manager
2. release-orchestrator
3. security-scanner
4. compliance-checker
5. quality-analyzer
6. deployment-manager
7. monitoring-agent
8. backup-manager
9. notification-hub
10. workflow-coordinator

**Orchestration via Agent**:
```yaml
# .gitlab/agents/config/mesh-config.yaml
agents:
  - name: version-manager
    endpoint: version-manager.ossa-agents.svc.cluster.local
  - name: release-orchestrator
    endpoint: release-orchestrator.ossa-agents.svc.cluster.local
```

### 5. Local Development with Remote Cluster

**Setup**:
```bash
# In workspace or local machine
export KUBECONFIG=~/.kube/config-ossa-agent

# Agent provides cluster access
kubectl get pods -n ossa-agents

# Deploy agent locally
kubectl apply -f .gitlab/agents/version-manager/deployment.yaml

# Test agent
curl http://version-manager.ossa-agents.svc.cluster.local/health
```

### 6. Workspace Configuration

**Create `.devfile.yaml` for workspace**:
```yaml
schemaVersion: 2.2.0
metadata:
  name: ossa-development
components:
  - name: dev-tools
    container:
      image: node:22-alpine
      memoryLimit: 4Gi
      mountSources: true
      env:
        - name: KUBECONFIG
          value: /workspace/.kube/config
  - name: kubectl
    container:
      image: bitnami/kubectl:latest
      memoryLimit: 512Mi
commands:
  - id: install-deps
    exec:
      component: dev-tools
      commandLine: npm ci
  - id: test
    exec:
      component: dev-tools
      commandLine: npm test
  - id: deploy-agents
    exec:
      component: kubectl
      commandLine: kubectl apply -f .gitlab/agents/
```

### 7. Agent-Based Development Tools

**Use agents for development tasks**:

```bash
# Version management via agent
curl -X POST http://version-manager/api/bump \
  -H "Content-Type: application/json" \
  -d '{"type": "patch"}'

# Release orchestration
curl -X POST http://release-orchestrator/api/release \
  -d '{"version": "0.2.6"}'

# Security scanning
curl http://security-scanner/api/scan/project/openstandardagents
```

### 8. Workspace + Agent + CI/CD Flow

**Complete workflow**:

1. **Develop in Workspace**:
   - Edit code in cloud IDE
   - Agent provides cluster access
   - Test against real Kubernetes

2. **Commit & Push**:
   - Git commit triggers CI/CD
   - Agent deploys to cluster
   - Automated tests run

3. **Agent Orchestration**:
   - version-manager bumps version
   - release-orchestrator coordinates
   - security-scanner validates
   - deployment-manager deploys

4. **Monitor via Agent**:
   - monitoring-agent collects metrics
   - notification-hub sends alerts
   - Dashboard shows status

## Recommended Enhancements

### 1. Enable GitOps
```bash
# Update agent config
vim .gitlab/agents/ossa-agent/config.yaml
# Uncomment gitops section
git commit -m "feat: enable GitOps for agent deployments"
git push
```

### 2. Add Workspace Devfile
```bash
# Create devfile
cat > .devfile.yaml << 'EOF'
# (content from above)
EOF
git add .devfile.yaml
git commit -m "feat: add workspace devfile"
```

### 3. Deploy All Agents
```bash
# Create deployment manifests
for agent in version-manager release-orchestrator security-scanner; do
  kubectl apply -f .gitlab/agents/$agent/deployment.yaml
done
```

### 4. Configure Agent Mesh
```bash
# Apply mesh configuration
kubectl apply -f .gitlab/agents/config/mesh-config.yaml

# Verify mesh
kubectl get pods -n ossa-agents
kubectl get svc -n ossa-agents
```

### 5. Set Up Monitoring
```bash
# Deploy monitoring stack
kubectl apply -f infrastructure/k8s/monitoring/

# Access dashboards via agent
kubectl port-forward -n monitoring svc/grafana 3000:3000
```

## Quick Start Commands

### In Workspace
```bash
# Clone repo (if not already)
git clone https://gitlab.com/blueflyio/openstandardagents.git
cd openstandardagents

# Install dependencies
npm ci

# Verify agent access
kubectl get nodes

# Deploy an agent
kubectl apply -f .gitlab/agents/version-manager/deployment.yaml

# Test agent
npm run version:check
```

### In CI/CD
```yaml
# .gitlab-ci.yml
deploy:all-agents:
  stage: deploy
  script:
    - kubectl apply -f .gitlab/agents/*/deployment.yaml
  environment:
    name: production
    kubernetes:
      namespace: ossa-agents
```

## Benefits of This Setup

1. **Cloud Development**: Code anywhere with workspace
2. **Real Environment**: Test against actual Kubernetes
3. **Automated Deployment**: GitOps or CI/CD deploys agents
4. **Agent Orchestration**: 10 agents working together
5. **Observability**: Full monitoring and tracing
6. **Security**: RBAC, service accounts, mTLS
7. **Dogfooding**: OSSA agents managing OSSA project

## Next Steps

1. ✅ Enable GitOps in agent config
2. ✅ Create workspace devfile
3. ✅ Deploy all 10 agents to cluster
4. ✅ Configure agent mesh networking
5. ✅ Set up monitoring dashboards
6. ✅ Document agent APIs
7. ✅ Create agent usage examples
8. ✅ Test full workflow in workspace

## Resources

- **Workspace**: https://gitlab.com/groups/blueflyio/-/settings/workspaces
- **Agent Config**: `.gitlab/agents/ossa-agent/config.yaml`
- **Agent Docs**: `.gitlab/docs/infrastructure/`
- **GitLab Docs**: https://docs.gitlab.com/ee/user/clusters/agent/
