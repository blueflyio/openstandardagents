# OrbStack Kubernetes Deployment

Complete deployment manifests for running the OSSA agent platform locally on OrbStack.

## Prerequisites

- **OrbStack** installed and running
- **Kubernetes** enabled in OrbStack
- **kubectl** configured
- **~2GB RAM** available
- **40Gi disk space** for persistent volumes

## Quick Start

```bash
# Apply all manifests in order
kubectl apply -f infrastructure/orbstack/namespace.yaml
kubectl apply -f infrastructure/orbstack/postgresql.yaml
kubectl apply -f infrastructure/orbstack/mongodb.yaml
kubectl apply -f infrastructure/orbstack/minio.yaml
kubectl apply -f infrastructure/orbstack/agent-router.yaml
kubectl apply -f infrastructure/orbstack/agent-tracer.yaml
kubectl apply -f infrastructure/orbstack/agent-chat.yaml
kubectl apply -f infrastructure/orbstack/openstandardagents.yaml

# Or apply all at once
kubectl apply -f infrastructure/orbstack/
```

## Service Architecture

### Databases (namespace: databases)

**PostgreSQL**
- Image: `postgres:16-alpine`
- Storage: 10Gi persistent volume
- Databases: llm_platform, rfp_automation, agent_studio, temporal
- Connection: `postgresql.databases.svc.cluster.local:5432`
- Credentials: `postgres / localdev123`

**MongoDB**
- Image: `mongo:7`
- Storage: 10Gi persistent volume
- Connection: `mongodb.development.svc.cluster.local:27017`
- Credentials: `admin / password123`
- Auth: `authSource=admin` required

**MinIO**
- Image: `minio/minio:latest`
- Storage: 20Gi persistent volume
- API: `minio.databases.svc.cluster.local:9000`
- Console: `http://localhost:9001`
- Credentials: `minioadmin / minioadmin123`

### Applications (namespace: development)

**agent-router (LiteLLM)**
- Image: `ghcr.io/berriai/litellm:main-latest`
- Replicas: 2 (high availability)
- Port: 4000
- Access: `http://192.168.139.2:4000`
- Models: OpenAI GPT-4, Anthropic Claude Sonnet/Opus
- Config: Update API keys in env vars for production

**Qdrant** (Vector Database)
- Deployed via Helm chart
- Port: 6333
- Connection: `qdrant.development.svc.cluster.local:6333`

**agent-tracer (Phoenix)**
- Image: `arizephoenix/phoenix:latest`
- Port: 6006 (UI), 4317 (OTLP gRPC)
- Access: `http://192.168.139.2:6006`
- Purpose: Observability, tracing, agent monitoring

**agent-chat (LibreChat)**
- Image: `ghcr.io/danny-avila/librechat:latest`
- Port: 3080
- Access: `http://192.168.139.2:3080`
- Database: MongoDB with JWT authentication
- LLM: Routes through agent-router

**openstandardagents**
- Image: `nginx:alpine`
- Port: 80
- Access: `http://192.168.139.2:80` (pending)
- Purpose: Documentation and status page

## Deployment Steps

### 1. Create Namespaces

```bash
kubectl apply -f infrastructure/orbstack/namespace.yaml
```

Verifies:
```bash
kubectl get namespaces databases development
```

### 2. Deploy Databases

```bash
kubectl apply -f infrastructure/orbstack/postgresql.yaml
kubectl apply -f infrastructure/orbstack/mongodb.yaml
kubectl apply -f infrastructure/orbstack/minio.yaml
```

Wait for databases to be ready:
```bash
kubectl wait --for=condition=ready pod/postgresql-0 -n databases --timeout=120s
kubectl wait --for=condition=ready pod/mongodb-0 -n development --timeout=120s
kubectl wait --for=condition=ready pod -l app=minio -n databases --timeout=120s
```

### 3. Initialize PostgreSQL Databases

```bash
kubectl apply -f infrastructure/orbstack/postgresql.yaml
```

The Job `postgresql-init-databases` will create all required databases.

Verify:
```bash
kubectl get job postgresql-init-databases -n databases
kubectl logs job/postgresql-init-databases -n databases
```

### 4. Deploy Qdrant (via Helm)

```bash
helm repo add qdrant https://qdrant.github.io/qdrant-helm
helm repo update
helm install qdrant qdrant/qdrant --namespace development
```

### 5. Deploy Application Services

```bash
kubectl apply -f infrastructure/orbstack/agent-router.yaml
kubectl apply -f infrastructure/orbstack/agent-tracer.yaml
kubectl apply -f infrastructure/orbstack/agent-chat.yaml
kubectl apply -f infrastructure/orbstack/openstandardagents.yaml
```

Wait for all services:
```bash
kubectl wait --for=condition=ready pod -l app=agent-router -n development --timeout=120s
kubectl wait --for=condition=ready pod -l app=agent-tracer -n development --timeout=120s
kubectl wait --for=condition=ready pod -l app=agent-chat -n development --timeout=120s
```

## Verification

### Check All Pods

```bash
# Database pods
kubectl get pods -n databases

# Application pods
kubectl get pods -n development
```

All pods should be in `Running` state.

### Check Services

```bash
kubectl get svc -n databases
kubectl get svc -n development
```

### Test Endpoints

```bash
# Agent Router health
curl http://192.168.139.2:4000/health

# Agent Chat
curl http://192.168.139.2:3080

# Agent Tracer (Phoenix UI)
open http://192.168.139.2:6006

# MinIO Console
open http://localhost:9001
```

### View Logs

```bash
# Agent Router
kubectl logs -n development -l app=agent-router --tail=50

# Agent Chat
kubectl logs -n development -l app=agent-chat --tail=50

# PostgreSQL
kubectl logs -n databases postgresql-0 --tail=50

# MongoDB
kubectl logs -n development mongodb-0 --tail=50
```

## Configuration

### Update LLM API Keys

Edit `infrastructure/orbstack/agent-router.yaml` and update:

```yaml
env:
- name: OPENAI_API_KEY
  value: "sk-your-actual-openai-key"
- name: ANTHROPIC_API_KEY
  value: "sk-ant-your-actual-anthropic-key"
```

Apply changes:
```bash
kubectl apply -f infrastructure/orbstack/agent-router.yaml
kubectl rollout restart deployment/agent-router -n development
```

### Update Database Passwords

For production, change default passwords in:
- `postgresql.yaml` - POSTGRES_PASSWORD
- `mongodb.yaml` - MONGO_INITDB_ROOT_PASSWORD
- `minio.yaml` - MINIO_ROOT_PASSWORD
- `agent-chat.yaml` - MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET

## Troubleshooting

### PostgreSQL Database Creation

If databases aren't created:

```bash
# Run manually
kubectl run -it --rm psql --image=postgres:16-alpine --restart=Never -n databases -- \
  psql -h postgresql -U postgres -c "CREATE DATABASE llm_platform;"
```

### MongoDB Authentication Issues

If agent-chat can't connect:

```bash
# Check MongoDB logs
kubectl logs mongodb-0 -n development --tail=100

# Verify connection string has authSource=admin
kubectl get deployment agent-chat -n development -o yaml | grep MONGO_URI
```

### Pod CrashLoopBackOff

```bash
# Check pod details
kubectl describe pod <pod-name> -n <namespace>

# Check logs
kubectl logs <pod-name> -n <namespace> --previous
```

### Service Not Accessible

```bash
# Check service
kubectl get svc -n development

# Check endpoints
kubectl get endpoints -n development

# Port forward if LoadBalancer pending
kubectl port-forward -n development svc/agent-router 4000:4000
```

## Cleanup

To remove all deployed resources:

```bash
# Delete applications
kubectl delete -f infrastructure/orbstack/openstandardagents.yaml
kubectl delete -f infrastructure/orbstack/agent-chat.yaml
kubectl delete -f infrastructure/orbstack/agent-tracer.yaml
kubectl delete -f infrastructure/orbstack/agent-router.yaml
helm uninstall qdrant -n development

# Delete databases
kubectl delete -f infrastructure/orbstack/minio.yaml
kubectl delete -f infrastructure/orbstack/mongodb.yaml
kubectl delete -f infrastructure/orbstack/postgresql.yaml

# Delete namespaces (this will delete all PVCs and data)
kubectl delete namespace development
kubectl delete namespace databases
```

## Resource Usage

Expected resource consumption:

- **CPU**: ~1.5 cores total
- **Memory**: ~2GB RAM total
- **Storage**: 40Gi persistent volumes
- **Pods**: 10 running pods
- **Services**: 13 services

## Next Steps

1. Configure production API keys
2. Set up health monitoring
3. Create backup procedures
4. Document API integration patterns
5. Add sample agent workflows
6. Plan AWS migration

## Support

For issues and questions:
- GitLab Issues: https://gitlab.com/blueflyio/openstandardagents/-/issues
- Related: #161, #157, #163
