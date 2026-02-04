# OSSA Agent Deployment Quick Start

**Get your agent deployed in 5-15 minutes**

---

## Choose Your Platform

Select the quickest path for your use case:

| Platform | Time | Best For | Difficulty |
|----------|------|----------|------------|
| [Railway](#railway-quickstart) | 5 min | Rapid prototyping | ⭐ Easy |
| [Docker Compose](#docker-quickstart) | 8 min | Local development | ⭐ Easy |
| [Render](#render-quickstart) | 10 min | Production-lite | ⭐⭐ Medium |
| [Fly.io](#flyio-quickstart) | 12 min | Global edge | ⭐⭐ Medium |
| [Kubernetes](#kubernetes-quickstart) | 15 min | Enterprise production | ⭐⭐⭐ Advanced |

---

## Prerequisites

All platforms require:

```bash
# Install OSSA Buildkit
npm install -g @ossa/buildkit

# Verify installation
buildkit --version
# Output: @ossa/buildkit v0.4.1
```

---

## Railway Quickstart

⏱️ **Time**: 5 minutes
💰 **Cost**: ~$5/month
📈 **Scaling**: Automatic

### Step 1: Install Railway CLI

```bash
# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh

# Or with npm
npm install -g @railway/cli

# Login
railway login
```

### Step 2: Prepare Your Agent

```bash
# Export agent for Railway
buildkit export railway ./my-agent --output ./railway-deploy

# Result:
# railway-deploy/
# ├── railway.json       # Railway configuration
# ├── Dockerfile         # Optimized container
# ├── .dockerignore      # Build optimization
# ├── nixpacks.toml      # Alternative to Dockerfile
# └── README.md          # Deployment instructions
```

### Step 3: Deploy

```bash
cd railway-deploy

# Initialize Railway project
railway init

# Deploy (Railway auto-detects configuration)
railway up

# Get your deployment URL
railway domain
```

### Step 4: Verify Deployment

```bash
# Check deployment status
railway status

# View logs
railway logs

# Test agent health
curl https://your-agent.railway.app/health
```

### Railway Environment Variables

Configure via Railway dashboard or CLI:

```bash
# Set environment variables
railway variables set AGENT_ID=my-agent-001
railway variables set LOG_LEVEL=info
railway variables set API_PORT=3000
```

### Railway Tips

- ✅ **Automatic HTTPS**: Railway provides SSL certificates automatically
- ✅ **Git Integration**: Link to GitHub/GitLab for automatic deployments
- ✅ **Databases**: Add PostgreSQL, Redis, MongoDB with one click
- ✅ **Private Networking**: Agents can communicate securely
- ⚠️ **Cold Starts**: Free tier sleeps after inactivity

---

## Docker Quickstart

⏱️ **Time**: 8 minutes
💰 **Cost**: $0 (local) or infrastructure cost
📈 **Scaling**: Manual

### Step 1: Install Docker

```bash
# macOS (Homebrew)
brew install --cask docker

# Or download from https://www.docker.com/get-started

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Export Docker Compose Configuration

```bash
# Export complete Docker Compose setup
buildkit export docker-compose ./my-agent --output ./docker-deploy

# Result:
# docker-deploy/
# ├── docker-compose.yml    # Service orchestration
# ├── Dockerfile            # Agent container
# ├── .env.example          # Environment variables template
# └── README.md             # Setup instructions
```

### Step 3: Configure Environment

```bash
cd docker-deploy

# Copy environment template
cp .env.example .env

# Edit configuration
cat > .env << 'EOF'
AGENT_ID=my-agent-001
AGENT_NAME=My First Agent
OSSA_VERSION=0.4.1
API_PORT=3000
LOG_LEVEL=info
EOF
```

### Step 4: Start Services

```bash
# Build and start in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f agent

# Check status
docker-compose ps
```

### Step 5: Verify Deployment

```bash
# Test agent health endpoint
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "healthy",
#   "version": "0.4.1",
#   "uptime": 123
# }

# View agent logs
docker-compose logs agent

# Stop services
docker-compose down
```

### Docker Compose with Dependencies

Example with PostgreSQL and Redis:

```yaml
# docker-compose.yml
version: '3.8'

services:
  agent:
    build: .
    ports:
      - "3000:3000"
    environment:
      - AGENT_ID=my-agent-001
      - DATABASE_URL=postgresql://postgres:password@db:5432/agents
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=agents
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  redis_data:
```

### Docker Tips

- ✅ **Development**: Perfect for local testing
- ✅ **Consistency**: Same environment everywhere
- ✅ **Quick Iteration**: Fast rebuild cycles
- ✅ **Resource Control**: Limit CPU/memory easily
- ⚠️ **Production**: Use Kubernetes for production orchestration

---

## Render Quickstart

⏱️ **Time**: 10 minutes
💰 **Cost**: $7-25/month
📈 **Scaling**: Automatic

### Step 1: Create Render Account

1. Sign up at [render.com](https://render.com)
2. Connect GitHub/GitLab account

### Step 2: Export Render Configuration

```bash
# Export Render blueprint
buildkit export render ./my-agent --output ./render-deploy

# Result:
# render-deploy/
# ├── render.yaml         # Render blueprint
# ├── Dockerfile          # Container definition
# ├── .env.example        # Environment variables
# └── README.md           # Deployment guide
```

### Step 3: Deploy via Render Dashboard

**Option A: Blueprint (Recommended)**

1. Push to GitHub/GitLab
2. Go to Render Dashboard → New → Blueprint
3. Connect repository
4. Render auto-detects `render.yaml`
5. Click "Apply" to deploy

**Option B: Manual Web Service**

1. Dashboard → New → Web Service
2. Connect repository
3. Configure:
   - **Name**: my-agent
   - **Runtime**: Docker
   - **Build Command**: (auto-detected)
   - **Start Command**: (from Dockerfile)
4. Add environment variables
5. Click "Create Web Service"

### Step 4: Deploy via CLI

```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# Deploy from render.yaml
cd render-deploy
render deploy
```

### Step 5: Verify Deployment

```bash
# Get service URL from dashboard
# Test agent
curl https://my-agent.onrender.com/health

# View logs in dashboard
# Or via CLI:
render logs --service my-agent --tail
```

### Render Configuration Example

```yaml
# render.yaml
services:
  - type: web
    name: my-agent
    env: docker
    region: oregon
    plan: starter
    buildCommand: docker build -t my-agent .
    startCommand: npm start
    envVars:
      - key: AGENT_ID
        value: my-agent-001
      - key: API_PORT
        value: 3000
      - key: LOG_LEVEL
        value: info
      - key: DATABASE_URL
        fromDatabase:
          name: agent-db
          property: connectionString
    healthCheckPath: /health
    autoDeploy: true

databases:
  - name: agent-db
    databaseName: agents
    plan: starter
```

### Render Tips

- ✅ **Auto-Deploy**: Git push triggers deployment
- ✅ **Managed Services**: PostgreSQL, Redis included
- ✅ **DDoS Protection**: Built-in protection
- ✅ **Zero-Downtime**: Rolling deployments
- ⚠️ **Cold Starts**: Free tier sleeps after 15 min inactivity

---

## Fly.io Quickstart

⏱️ **Time**: 12 minutes
💰 **Cost**: ~$3-30/month
📈 **Scaling**: Global, multi-region

### Step 1: Install Fly CLI

```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Or with Homebrew
brew install flyctl

# Login
fly auth login
```

### Step 2: Export Fly Configuration

```bash
# Export Fly.io configuration
buildkit export fly ./my-agent --output ./fly-deploy

# Result:
# fly-deploy/
# ├── fly.toml            # Fly configuration
# ├── Dockerfile          # Container image
# ├── .dockerignore       # Build optimization
# └── README.md           # Deployment guide
```

### Step 3: Create Fly App

```bash
cd fly-deploy

# Initialize Fly app
fly apps create my-agent

# Or let Fly generate a name
fly apps create
```

### Step 4: Configure Secrets

```bash
# Set secrets (not exposed in logs)
fly secrets set AGENT_ID=my-agent-001
fly secrets set API_KEY=your-api-key-here
fly secrets set DATABASE_URL=postgresql://...

# View secrets (values hidden)
fly secrets list
```

### Step 5: Deploy

```bash
# Deploy to primary region (closest to you)
fly deploy

# Or specify regions
fly deploy --region iad,lhr,syd

# Check status
fly status
```

### Step 6: Verify Deployment

```bash
# Get app URL
fly apps list

# Test agent
curl https://my-agent.fly.dev/health

# View logs
fly logs

# SSH into container
fly ssh console
```

### Multi-Region Deployment

Deploy globally for low latency:

```bash
# Scale to multiple regions
fly regions add iad lhr sin syd

# Scale instances per region
fly scale count 2 --region iad
fly scale count 1 --region lhr

# View scaling
fly scale show
```

### Fly Configuration Example

```toml
# fly.toml
app = "my-agent"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  AGENT_NAME = "My Agent"
  OSSA_VERSION = "0.4.1"
  API_PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

  [[http_service.checks]]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    timeout = "5s"
    path = "/health"

[services]
  [[services.ports]]
    handlers = ["http"]
    port = 80
    force_https = true

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

### Fly Tips

- ✅ **Global Edge**: Deploy to 30+ regions worldwide
- ✅ **Auto-Scaling**: Scale to zero, wake on request
- ✅ **Private Networking**: Secure agent-to-agent communication
- ✅ **Persistent Volumes**: Attach storage if needed
- ⚠️ **Complexity**: More options = more to configure

---

## Kubernetes Quickstart

⏱️ **Time**: 15 minutes
💰 **Cost**: $50+/month (managed cluster)
📈 **Scaling**: Enterprise-grade

### Step 1: Prerequisites

```bash
# Install kubectl
brew install kubectl

# Or via package manager
# Ubuntu: sudo snap install kubectl --classic
# Windows: choco install kubernetes-cli

# Verify installation
kubectl version --client

# Configure kubectl for your cluster
# For GKE:
gcloud container clusters get-credentials my-cluster
# For EKS:
aws eks update-kubeconfig --name my-cluster
# For AKS:
az aks get-credentials --resource-group my-rg --name my-cluster
```

### Step 2: Export Kubernetes Manifests

```bash
# Export complete K8s configuration
buildkit export kubernetes ./my-agent --output ./k8s-deploy

# Result:
# k8s-deploy/
# ├── deployment.yaml     # Agent deployment
# ├── service.yaml        # Service definition
# ├── ingress.yaml        # Ingress (optional)
# ├── configmap.yaml      # Configuration
# ├── secret.yaml.example # Secrets template
# ├── hpa.yaml            # Auto-scaling (optional)
# └── README.md           # Deployment guide
```

### Step 3: Create Namespace

```bash
# Create dedicated namespace
kubectl create namespace ossa-agents

# Set as default for convenience
kubectl config set-context --current --namespace=ossa-agents
```

### Step 4: Configure Secrets

```bash
cd k8s-deploy

# Create secret from template
cp secret.yaml.example secret.yaml

# Edit secrets (use base64 encoding)
echo -n "my-api-key" | base64
# Output: bXktYXBpLWtleQ==

# Edit secret.yaml with encoded values
kubectl apply -f secret.yaml
```

### Step 5: Deploy Agent

```bash
# Apply all manifests
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f configmap.yaml

# Or apply all at once
kubectl apply -f .

# Check deployment
kubectl get pods
kubectl get services
```

### Step 6: Verify Deployment

```bash
# Check pod status
kubectl get pods -l app=my-agent

# View logs
kubectl logs -l app=my-agent -f

# Port forward for local testing
kubectl port-forward svc/my-agent 3000:3000

# Test health endpoint
curl http://localhost:3000/health

# Get service details
kubectl describe service my-agent
```

### Kubernetes Manifest Examples

**Deployment:**

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-agent
  namespace: ossa-agents
  labels:
    app: my-agent
    version: v0.4.1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-agent
  template:
    metadata:
      labels:
        app: my-agent
        version: v0.4.1
    spec:
      containers:
      - name: agent
        image: your-registry/my-agent:0.4.1
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: AGENT_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: AGENT_NAME
          valueFrom:
            configMapKeyRef:
              name: agent-config
              key: agent.name
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: agent-secrets
              key: api-key
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

**Service:**

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-agent
  namespace: ossa-agents
spec:
  selector:
    app: my-agent
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

**Ingress:**

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-agent-ingress
  namespace: ossa-agents
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - my-agent.example.com
    secretName: my-agent-tls
  rules:
  - host: my-agent.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-agent
            port:
              number: 80
```

### Horizontal Pod Autoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-agent-hpa
  namespace: ossa-agents
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-agent
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Kubernetes Tips

- ✅ **Production-Grade**: Battle-tested orchestration
- ✅ **Auto-Scaling**: HPA and VPA for optimal resource usage
- ✅ **Self-Healing**: Automatic pod restarts and rescheduling
- ✅ **Rolling Updates**: Zero-downtime deployments
- ✅ **Secret Management**: Integrated secrets and ConfigMaps
- ⚠️ **Complexity**: Steeper learning curve
- ⚠️ **Cost**: Managed clusters start at ~$50/month

---

## Common Commands Cheat Sheet

### Railway

```bash
# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Logs
railway logs -f

# Environment variables
railway variables set KEY=value
railway variables list

# Domain
railway domain

# Status
railway status
```

### Docker Compose

```bash
# Build and start
docker-compose up -d --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service]

# Restart service
docker-compose restart [service]

# Execute command in container
docker-compose exec agent sh

# Pull latest images
docker-compose pull

# Remove all containers and volumes
docker-compose down -v
```

### Render

```bash
# Login
render login

# Deploy
render deploy

# Logs
render logs --service my-agent --tail

# Shell access
render shell my-agent

# List services
render services list
```

### Fly.io

```bash
# Login
fly auth login

# Create app
fly apps create my-agent

# Deploy
fly deploy

# Logs
fly logs

# Status
fly status

# Scale
fly scale count 3
fly scale vm shared-cpu-1x

# Regions
fly regions list
fly regions add iad

# Secrets
fly secrets set KEY=value
fly secrets list

# SSH
fly ssh console
```

### Kubernetes

```bash
# Get resources
kubectl get pods
kubectl get services
kubectl get deployments

# Describe resource
kubectl describe pod my-agent-xxx

# Logs
kubectl logs -f pod/my-agent-xxx

# Execute command
kubectl exec -it pod/my-agent-xxx -- sh

# Port forward
kubectl port-forward svc/my-agent 3000:3000

# Apply manifests
kubectl apply -f deployment.yaml

# Delete resources
kubectl delete -f deployment.yaml

# Scale deployment
kubectl scale deployment my-agent --replicas=5

# Rollout status
kubectl rollout status deployment/my-agent

# Rollback
kubectl rollout undo deployment/my-agent
```

---

## Troubleshooting Quick Fixes

### Agent Won't Start

```bash
# Check logs
# Railway:
railway logs

# Docker:
docker-compose logs agent

# Kubernetes:
kubectl logs -l app=my-agent

# Common issues:
# - Missing environment variables
# - Port already in use
# - Database connection failed
```

### Health Check Failing

```bash
# Test health endpoint locally
curl http://localhost:3000/health

# Check if port is correct
# Check if agent is listening
# Verify health check path in platform config
```

### Deployment Timeout

```bash
# Increase timeout in platform config
# Railway: Railway dashboard → Settings
# Kubernetes: adjust readinessProbe initialDelaySeconds
# Docker: Check resource constraints

# Common causes:
# - Slow build
# - Large image size
# - Insufficient resources
```

### Can't Access Agent

```bash
# Verify service is running
# Check firewall rules
# Verify domain/URL configuration
# Check ingress/routing configuration

# Test internal connectivity
# Railway: railway run curl http://localhost:3000/health
# Kubernetes: kubectl port-forward svc/my-agent 3000:3000
```

---

## Next Steps

Now that your agent is deployed, consider:

1. **[Set Up Monitoring](./DEPLOYMENT_OPERATIONS.md#monitoring)** - Add observability
2. **[Configure CI/CD](./DEPLOYMENT_PLATFORMS.md#cicd-integration)** - Automate deployments
3. **[Secure Your Agent](./DEPLOYMENT_SECURITY.md)** - Implement security best practices
4. **[Scale Your Deployment](./DEPLOYMENT_OPERATIONS.md#scaling)** - Handle increased load
5. **[Review Architecture](./DEPLOYMENT_ARCHITECTURE.md)** - Optimize your setup

---

## Need Help?

- 📚 [Full Deployment Guide](./DEPLOYMENT_README.md)
- 🐛 [Troubleshooting](./DEPLOYMENT_OPERATIONS.md#troubleshooting)
- 💬 [Community Discord](https://discord.gg/ossa)
- 📧 [Support](mailto:support@ossa.io)

---

**Last Updated**: 2026-02-04
