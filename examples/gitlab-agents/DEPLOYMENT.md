# GitLab Quality Gate Agents - Deployment Guide

## Overview

This directory contains **6 production-ready GitLab agents** generated from OSSA manifests:

| Agent | Gate | Type | Description |
|-------|------|------|-------------|
| **duo-comment-responder** | 4 | Webhook | Responds to GitLab Duo comments, implements fixes |
| **mr-reviewer** | 3 | Webhook | Comprehensive MR review with auto-approve |
| **pipeline-auto-fix** | 5 | Webhook | Automatically fixes failed pipelines |
| **daily-code-scan** | 6 | Scheduled | Daily code quality audit |
| **pre-commit-quality-check** | 1 | Local | Pre-commit quality checks (git hook) |
| **pre-push-validation** | 2 | Local | Pre-push validation (git hook) |

## Quick Start

### Prerequisites

- Kubernetes cluster with KAgent CRD installed
- GitLab API token with `api` scope
- Anthropic API key
- Domain pointing to cluster: `api.blueflyagents.com`

### 1. Install KAgent CRD

```bash
# Install KAgent operator
kubectl apply -f https://raw.githubusercontent.com/blueflyio/kagent/main/install.yaml

# Verify installation
kubectl get crd kagents.agents.bluefly.io
```

### 2. Configure Secrets

Edit `k8s/deploy-all.yaml` and replace:
- `GITLAB_API_TOKEN`: Your GitLab personal access token
- `ANTHROPIC_API_KEY`: Your Anthropic API key
- `WEBHOOK_SECRET`: Random secret (generate with `openssl rand -hex 32`)

### 3. Deploy All Agents

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/deploy-all.yaml

# Verify deployment
kubectl get kagents -n gitlab-agents
kubectl get pods -n gitlab-agents
kubectl get svc -n gitlab-agents
kubectl get ingress -n gitlab-agents
```

Expected output:
```
NAME                      READY   STATUS    AGE
duo-comment-responder     2/2     Running   1m
mr-reviewer               3/3     Running   1m
pipeline-auto-fix         2/2     Running   1m
daily-code-scan           1/1     Running   1m
```

### 4. Configure GitLab Webhooks

For each webhook agent, configure in **GitLab Project → Settings → Webhooks**:

#### duo-comment-responder
- **URL**: `http://api.blueflyagents.com/webhook/duo-comment-responder`
- **Secret Token**: (from WEBHOOK_SECRET)
- **Events**: ☑️ Comments, ☑️ Merge requests
- **SSL verification**: ☐ Disable (internal network)

#### mr-reviewer
- **URL**: `http://api.blueflyagents.com/webhook/mr-reviewer`
- **Secret Token**: (from WEBHOOK_SECRET)
- **Events**: ☑️ Merge requests
- **SSL verification**: ☐ Disable

#### pipeline-auto-fix
- **URL**: `http://api.blueflyagents.com/webhook/pipeline-auto-fix`
- **Secret Token**: (from WEBHOOK_SECRET)
- **Events**: ☑️ Pipeline events
- **SSL verification**: ☐ Disable

### 5. Test Webhooks

```bash
# Test duo-comment-responder
curl -X POST http://api.blueflyagents.com/webhook/duo-comment-responder \
  -H "Content-Type: application/json" \
  -H "X-Gitlab-Token: your-webhook-secret" \
  -d '{
    "object_kind": "note",
    "project": {"id": "12345"},
    "merge_request": {"iid": 1},
    "object_attributes": {
      "note": "@claude This function needs refactoring",
      "author": {"username": "GitLab Duo Bot"}
    }
  }'

# Check logs
kubectl logs -n gitlab-agents -l app=duo-comment-responder --tail=50
```

## Local Development

### Build Individual Agent

```bash
cd duo-comment-responder
npm install
npm run build
npm start
```

### Test Locally

```bash
# Set environment variables
export GITLAB_API_TOKEN=glpat-your-token
export ANTHROPIC_API_KEY=sk-ant-your-key
export WEBHOOK_SECRET=your-secret

# Run in development mode
npm run dev

# Test webhook
curl -X POST http://localhost:9090/webhook/duo-comment-responder \
  -H "Content-Type: application/json" \
  -H "X-Gitlab-Token: your-secret" \
  -d @test-event.json
```

## Docker Deployment

### Build Images

```bash
# Build all agents
for agent in duo-comment-responder mr-reviewer pipeline-auto-fix daily-code-scan; do
  docker build -t registry.gitlab.com/blueflyio/ossa/openstandardagents/$agent:latest ./$agent
done

# Push to registry
docker login registry.gitlab.com
for agent in duo-comment-responder mr-reviewer pipeline-auto-fix daily-code-scan; do
  docker push registry.gitlab.com/blueflyio/ossa/openstandardagents/$agent:latest
done
```

### Run with Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  duo-comment-responder:
    image: registry.gitlab.com/blueflyio/ossa/openstandardagents/duo-comment-responder:latest
    ports:
      - "9090:9090"
    environment:
      GITLAB_API_TOKEN: ${GITLAB_API_TOKEN}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      WEBHOOK_SECRET: ${WEBHOOK_SECRET}
    restart: always

  mr-reviewer:
    image: registry.gitlab.com/blueflyio/ossa/openstandardagents/mr-reviewer:latest
    ports:
      - "9091:9090"
    environment:
      GITLAB_API_TOKEN: ${GITLAB_API_TOKEN}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      WEBHOOK_SECRET: ${WEBHOOK_SECRET}
    restart: always
```

```bash
docker-compose up -d
```

## Monitoring

### Health Checks

```bash
# Check agent health
kubectl exec -n gitlab-agents -it duo-comment-responder-0 -- \
  wget -O- http://localhost:9090/health

# Check readiness
kubectl exec -n gitlab-agents -it duo-comment-responder-0 -- \
  wget -O- http://localhost:9090/ready
```

### View Logs

```bash
# Stream logs from all agents
kubectl logs -n gitlab-agents -l app=gitlab-quality-gates -f

# Logs for specific agent
kubectl logs -n gitlab-agents -l app=duo-comment-responder -f
```

### Metrics

Each agent exposes Prometheus metrics on `/metrics`:

```bash
# Scrape metrics
curl http://api.blueflyagents.com/webhook/duo-comment-responder/metrics
```

## Troubleshooting

### Agent Not Starting

```bash
# Check pod status
kubectl describe pod -n gitlab-agents duo-comment-responder-0

# Check logs
kubectl logs -n gitlab-agents duo-comment-responder-0

# Common issues:
# - Missing secrets: Verify GITLAB_API_TOKEN and ANTHROPIC_API_KEY
# - Image pull error: Check registry credentials
# - Port conflict: Ensure port 9090 is available
```

### Webhook Not Receiving Events

```bash
# Verify ingress
kubectl get ingress -n gitlab-agents

# Check service endpoints
kubectl get endpoints -n gitlab-agents

# Test webhook directly
kubectl port-forward -n gitlab-agents svc/duo-comment-responder 9090:80
curl -X POST http://localhost:9090/webhook/duo-comment-responder \
  -H "X-Gitlab-Token: your-secret" \
  -d '{}'
```

### Agent Not Responding to GitLab

```bash
# Check agent logs for errors
kubectl logs -n gitlab-agents -l app=duo-comment-responder --tail=100

# Verify GitLab token has correct permissions
curl -H "PRIVATE-TOKEN: $GITLAB_API_TOKEN" \
  https://gitlab.com/api/v4/user

# Test LLM connectivity
kubectl exec -n gitlab-agents duo-comment-responder-0 -- \
  curl https://api.anthropic.com/v1/messages
```

## Scaling

### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: duo-comment-responder
  namespace: gitlab-agents
spec:
  scaleTargetRef:
    apiVersion: agents.bluefly.io/v1
    kind: KAgent
    name: duo-comment-responder
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Uninstall

```bash
# Remove all agents
kubectl delete -f k8s/deploy-all.yaml

# Remove namespace
kubectl delete namespace gitlab-agents
```

## Architecture

```
GitLab Project
      ↓ (webhook)
api.blueflyagents.com (Ingress)
      ↓
KAgent Controller
      ↓
Agent Pods (Express.js)
      ↓
├─ GitLab API (@gitbeaker)
└─ Anthropic API (@anthropic-ai/sdk)
```

## Generated from OSSA

All agents were generated using:

```bash
ossa export agents/gitlab/{agent}.ossa.yaml \
  --platform gitlab-agent \
  --output ./examples/gitlab-agents/{agent}
```

## Support

- GitLab Issues: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues
- Documentation: https://openstandardagents.org
- KAgent Docs: https://github.com/blueflyio/kagent
