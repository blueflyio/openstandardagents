# OSSA Agent Platform Deployment Guide

**In-depth platform-specific deployment documentation for production environments**

---

## Table of Contents

- [Platform Comparison](#platform-comparison)
- [Cloud Platforms (PaaS)](#cloud-platforms-paas)
  - [Railway.app](#railwayapp)
  - [Render.com](#rendercom)
  - [Fly.io](#flyio)
  - [Heroku](#heroku)
  - [Google Cloud Run](#google-cloud-run)
  - [AWS App Runner](#aws-app-runner)
  - [Azure Container Apps](#azure-container-apps)
- [Container Orchestration](#container-orchestration)
  - [Kubernetes](#kubernetes)
  - [Docker Compose](#docker-compose)
  - [Docker Swarm](#docker-swarm)
  - [HashiCorp Nomad](#hashicorp-nomad)
- [Cloud Infrastructure (IaaS)](#cloud-infrastructure-iaas)
  - [AWS EC2](#aws-ec2)
  - [Google Compute Engine](#google-compute-engine)
  - [Azure Virtual Machines](#azure-virtual-machines)
  - [DigitalOcean Droplets](#digitalocean-droplets)
- [Specialized Deployments](#specialized-deployments)
  - [Edge Deployment](#edge-deployment)
  - [On-Premises](#on-premises)
  - [Hybrid Cloud](#hybrid-cloud)
- [CI/CD Integration](#cicd-integration)
- [Environment Variables Reference](#environment-variables-reference)

---

## Platform Comparison

### Quick Comparison Matrix

| Platform | Monthly Cost | Setup Time | Scaling | Best For | Difficulty |
|----------|--------------|------------|---------|----------|------------|
| **Railway** | $5-20 | 5 min | Auto | Prototypes | ⭐ Easy |
| **Render** | $7-25 | 10 min | Auto | Small prod | ⭐ Easy |
| **Fly.io** | $3-30 | 12 min | Multi-region | Global apps | ⭐⭐ Medium |
| **Heroku** | $25-50 | 10 min | Auto | Enterprise | ⭐ Easy |
| **Cloud Run** | Usage-based | 15 min | Serverless | Variable load | ⭐⭐ Medium |
| **Kubernetes** | $50+ | 30 min | Advanced | Enterprise | ⭐⭐⭐ Hard |
| **Docker** | $0 | 5 min | Manual | Development | ⭐ Easy |
| **AWS EC2** | $10+ | 20 min | Manual/Auto | AWS ecosystem | ⭐⭐ Medium |

### Feature Comparison

| Feature | Railway | Render | Fly.io | Kubernetes | Cloud Run |
|---------|---------|--------|--------|------------|-----------|
| **Auto HTTPS** | ✅ | ✅ | ✅ | ⚙️ Configurable | ✅ |
| **Auto-Deploy** | ✅ Git | ✅ Git | ✅ Git | ⚙️ CI/CD | ⚙️ CI/CD |
| **Zero-Downtime** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Auto-Scaling** | ⚙️ Manual | ⚙️ Manual | ✅ | ✅ HPA | ✅ |
| **Multi-Region** | ❌ | ❌ | ✅ | ✅ | ⚙️ Manual |
| **Free Tier** | ✅ Limited | ✅ Limited | ✅ Limited | ❌ | ✅ Generous |
| **Database Add-ons** | ✅ | ✅ | ✅ | ⚙️ Deploy own | ⚙️ Separate |
| **Custom Domains** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Health Checks** | ✅ | ✅ | ✅ | ✅ Advanced | ✅ |
| **Private Networking** | ✅ | ✅ | ✅ | ✅ Advanced | ✅ VPC |

### Cost Comparison (Monthly Estimates)

**Small Agent** (256MB RAM, 0.25 CPU)
- Railway: $5
- Render: $7
- Fly.io: $3-6
- Cloud Run: $2-5 (usage-based)
- Kubernetes (GKE): $50+ (cluster cost)

**Medium Agent** (1GB RAM, 1 CPU)
- Railway: $15
- Render: $25
- Fly.io: $15-20
- Cloud Run: $10-20 (usage-based)
- Kubernetes: $75+ (cluster + nodes)

**Large Multi-Agent** (4GB RAM, 2 CPU, 3 replicas)
- Railway: $50-70
- Render: $75-90
- Fly.io: $60-100
- Cloud Run: $40-80 (usage-based)
- Kubernetes: $150-300

---

## Cloud Platforms (PaaS)

### Railway.app

**Best for**: Rapid prototyping, early-stage startups, hobby projects

#### Pros & Cons

**Pros**:
- ✅ Fastest deployment (5 minutes)
- ✅ Excellent developer experience
- ✅ Git-based workflow
- ✅ Automatic HTTPS and domains
- ✅ Simple database provisioning
- ✅ Fair pricing for small projects

**Cons**:
- ❌ No multi-region deployment
- ❌ Limited to US data centers
- ❌ Free tier sleeps after inactivity
- ❌ Fewer enterprise features

#### Deployment

**Automated Export** (recommended):

```bash
# Export Railway-ready configuration
buildkit export railway ./my-agent --output ./railway-deploy

# Deploy
cd railway-deploy
railway init
railway up
```

**Manual Configuration**:

```bash
# Initialize Railway project
railway init

# Link to GitHub repo
railway link

# Set environment variables
railway variables set AGENT_ID=my-agent-001
railway variables set API_PORT=3000
railway variables set LOG_LEVEL=info

# Deploy
railway up
```

#### Railway Configuration

Railway auto-detects configuration from:
1. `railway.json` (preferred)
2. `Dockerfile`
3. `nixpacks.toml`
4. Package manager files (`package.json`, `requirements.txt`, etc.)

**railway.json Example**:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  },
  "regions": ["us-west1"]
}
```

#### Adding PostgreSQL Database

```bash
# Add PostgreSQL via CLI
railway add --plugin postgresql

# Or via dashboard: New → Database → Add PostgreSQL

# Railway automatically sets DATABASE_URL
echo $DATABASE_URL
```

#### Custom Domain

```bash
# Add custom domain
railway domain add my-agent.example.com

# Railway provides instructions for DNS configuration
# Add CNAME record pointing to your Railway service
```

#### Railway Tips

- **Environment Groups**: Share variables across services
- **Monorepo Support**: Deploy multiple services from one repo
- **Build Hooks**: Run scripts before/after build
- **Cron Jobs**: Schedule tasks with Railway's cron service
- **Private Networking**: Services can communicate via private DNS

---

### Render.com

**Best for**: Small production apps, side projects, startups

#### Pros & Cons

**Pros**:
- ✅ Excellent free tier
- ✅ Managed databases (PostgreSQL, Redis)
- ✅ DDoS protection included
- ✅ Zero-downtime deploys
- ✅ Infrastructure as Code (render.yaml)
- ✅ Good documentation

**Cons**:
- ❌ Free tier cold starts (15 min inactivity)
- ❌ US/Europe regions only
- ❌ More expensive than some alternatives
- ❌ Limited advanced networking

#### Deployment

**Blueprint Deployment** (recommended):

```bash
# Export Render blueprint
buildkit export render ./my-agent --output ./render-deploy

# Push to Git
cd render-deploy
git init
git add .
git commit -m "Initial Render deployment"
git remote add origin <your-repo-url>
git push -u origin main

# In Render Dashboard:
# 1. New → Blueprint
# 2. Connect Repository
# 3. Render detects render.yaml automatically
# 4. Click "Apply" to deploy
```

**Manual Web Service**:

```bash
# Via Render Dashboard:
# 1. New → Web Service
# 2. Connect Repository
# 3. Configure:
#    - Name: my-agent
#    - Environment: Docker
#    - Region: Oregon (or closest)
#    - Branch: main
#    - Build Command: (auto-detected from Dockerfile)
#    - Start Command: npm start
# 4. Add environment variables
# 5. Create Web Service
```

#### Render Blueprint

**render.yaml Example**:

```yaml
services:
  # Main agent service
  - type: web
    name: my-agent
    env: docker
    region: oregon
    plan: starter
    branch: main
    dockerfilePath: ./Dockerfile
    healthCheckPath: /health
    envVars:
      - key: AGENT_ID
        value: my-agent-001
      - key: AGENT_NAME
        value: My Production Agent
      - key: API_PORT
        value: 3000
      - key: LOG_LEVEL
        value: info
      - key: DATABASE_URL
        fromDatabase:
          name: agent-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: agent-cache
          property: connectionString
    autoDeploy: true

  # Redis cache
  - type: redis
    name: agent-cache
    region: oregon
    plan: starter
    maxmemoryPolicy: allkeys-lru
    ipAllowList: []

# Managed PostgreSQL database
databases:
  - name: agent-db
    databaseName: agents
    user: agent_user
    region: oregon
    plan: starter
```

#### Render Tips

- **Preview Environments**: Automatic preview for pull requests
- **Health Checks**: Configure custom health check paths and intervals
- **Disk Persistence**: Attach persistent disks for stateful apps
- **Background Workers**: Deploy worker processes separately
- **Cron Jobs**: Schedule background tasks

#### Cost Optimization

```yaml
# Optimize for cost on render.yaml
services:
  - type: web
    name: my-agent
    plan: starter  # $7/month instead of $25
    autoDeploy: false  # Prevent accidental deployments
    scaling:
      minInstances: 1
      maxInstances: 1  # Don't auto-scale unless needed
```

---

### Fly.io

**Best for**: Global applications, low-latency requirements, WebSocket apps

#### Pros & Cons

**Pros**:
- ✅ True global edge deployment (30+ regions)
- ✅ Automatic multi-region
- ✅ Excellent performance (Anycast networking)
- ✅ Scale to zero capability
- ✅ Private networking (WireGuard VPN)
- ✅ Flexible pricing

**Cons**:
- ❌ More complex than Railway/Render
- ❌ Requires more configuration
- ❌ Billing can be surprising
- ❌ Newer platform (less mature)

#### Deployment

**Automated Export**:

```bash
# Export Fly configuration
buildkit export fly ./my-agent --output ./fly-deploy

# Deploy
cd fly-deploy
flyctl apps create my-agent
flyctl deploy
```

**Manual Setup**:

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Authenticate
fly auth login

# Create app
fly apps create my-agent

# Deploy
fly deploy

# Scale to multiple regions
fly regions add iad lhr sin syd
fly scale count 2
```

#### Fly Configuration

**fly.toml Example**:

```toml
app = "my-agent"
primary_region = "iad"
kill_signal = "SIGINT"
kill_timeout = "5s"

[experimental]
  auto_rollback = true

[build]
  dockerfile = "Dockerfile"

[env]
  AGENT_NAME = "My Global Agent"
  OSSA_VERSION = "0.4.1"
  API_PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

  [[http_service.checks]]
    interval = "30s"
    timeout = "5s"
    grace_period = "10s"
    method = "GET"
    path = "/health"
    protocol = "http"
    tls_skip_verify = false

    [http_service.checks.headers]
      User-Agent = "Fly Health Check"

  [[http_service.concurrency]]
    type = "connections"
    hard_limit = 250
    soft_limit = 200

[[services]]
  protocol = "tcp"
  internal_port = 3000
  processes = ["app"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "5s"

  [[services.http_checks]]
    interval = "30s"
    timeout = "5s"
    grace_period = "10s"
    method = "GET"
    path = "/health"
    protocol = "http"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

#### Multi-Region Deployment

```bash
# List available regions
fly platform regions

# Add regions strategically
fly regions add iad  # US East (Ashburn)
fly regions add lhr  # UK (London)
fly regions add nrt  # Japan (Tokyo)
fly regions add syd  # Australia (Sydney)

# Scale instances per region
fly scale count 2 --region iad
fly scale count 1 --region lhr
fly scale count 1 --region nrt
fly scale count 1 --region syd

# Check deployment
fly status
```

#### Fly Volumes (Persistent Storage)

```bash
# Create volume
fly volumes create agent_data --region iad --size 10

# Mount in fly.toml
```

```toml
[[mounts]]
  source = "agent_data"
  destination = "/data"
```

#### Fly Tips

- **Fly Proxy**: Automatic load balancing and failover
- **Private Networking**: Secure agent-to-agent communication via 6PN
- **Metrics**: Built-in Prometheus metrics
- **SSH Access**: `fly ssh console` for debugging
- **Secrets Management**: `fly secrets set` for sensitive data

---

### Heroku

**Best for**: Enterprise applications, established companies, managed infrastructure

#### Pros & Cons

**Pros**:
- ✅ Mature platform (15+ years)
- ✅ Extensive add-ons ecosystem
- ✅ Enterprise support available
- ✅ Excellent documentation
- ✅ Heroku Postgres highly reliable
- ✅ Simple scaling model (dynos)

**Cons**:
- ❌ More expensive than alternatives
- ❌ Free tier removed
- ❌ US/Europe regions only
- ❌ Less flexible than Kubernetes

#### Deployment

**Automated Export**:

```bash
# Export Heroku configuration
buildkit export heroku ./my-agent --output ./heroku-deploy

# Deploy
cd heroku-deploy
heroku login
heroku create my-agent
git push heroku main
```

**Manual Setup**:

```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Create app
heroku create my-agent

# Deploy via Git
git push heroku main

# Or via Docker
heroku container:push web --app my-agent
heroku container:release web --app my-agent
```

#### Heroku Configuration

**Procfile**:

```
web: npm start
worker: npm run worker
release: npm run migrate
```

**app.json** (for Review Apps and Heroku Button):

```json
{
  "name": "my-agent",
  "description": "OSSA Agent Deployment",
  "repository": "https://github.com/username/my-agent",
  "keywords": ["ossa", "agent", "ai"],
  "stack": "heroku-22",
  "buildpacks": [
    {
      "url": "heroku/nodejs"
    }
  ],
  "formation": {
    "web": {
      "quantity": 1,
      "size": "basic"
    }
  },
  "addons": [
    {
      "plan": "heroku-postgresql:mini"
    },
    {
      "plan": "heroku-redis:mini"
    }
  ],
  "env": {
    "AGENT_ID": {
      "description": "Unique agent identifier",
      "value": "my-agent-001"
    },
    "LOG_LEVEL": {
      "description": "Logging level",
      "value": "info"
    }
  }
}
```

#### Adding Add-ons

```bash
# PostgreSQL
heroku addons:create heroku-postgresql:mini

# Redis
heroku addons:create heroku-redis:mini

# Papertrail (Logging)
heroku addons:create papertrail:choklad

# New Relic (Monitoring)
heroku addons:create newrelic:wayne

# List add-ons
heroku addons
```

#### Scaling

```bash
# Scale web dynos
heroku ps:scale web=3

# Change dyno type
heroku ps:type web=standard-1x

# Auto-scaling (requires addon)
heroku addons:create rails-autoscale:starter
```

#### Heroku Tips

- **Review Apps**: Automatic deployments for PRs
- **Pipelines**: Promote from staging to production
- **Release Phase**: Run migrations before deploy
- **Preboot**: Zero-downtime deploys
- **Dyno Sleep**: Free/hobby dynos sleep after 30 min

---

### Google Cloud Run

**Best for**: Serverless containers, variable workloads, GCP ecosystem

#### Pros & Cons

**Pros**:
- ✅ Serverless (scale to zero)
- ✅ Pay only for usage
- ✅ Generous free tier
- ✅ Fast cold starts (~100ms)
- ✅ Full container support
- ✅ GCP integration

**Cons**:
- ❌ Request timeout (max 60 min)
- ❌ Stateless only
- ❌ Cold start latency
- ❌ GCP-specific

#### Deployment

**Automated Export**:

```bash
# Export Cloud Run configuration
buildkit export gcloud-run ./my-agent --output ./gcloud-deploy

# Deploy
cd gcloud-deploy
gcloud run deploy my-agent --source .
```

**Manual Deployment**:

```bash
# Authenticate
gcloud auth login
gcloud config set project my-project-id

# Build container
gcloud builds submit --tag gcr.io/my-project-id/my-agent

# Deploy to Cloud Run
gcloud run deploy my-agent \
  --image gcr.io/my-project-id/my-agent \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "AGENT_ID=my-agent-001,LOG_LEVEL=info"
```

#### Cloud Run Configuration

**cloud-run.yaml**:

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: my-agent
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "0"
        autoscaling.knative.dev/maxScale: "10"
        autoscaling.knative.dev/target: "80"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/my-project-id/my-agent:latest
        ports:
        - containerPort: 3000
        env:
        - name: AGENT_ID
          value: my-agent-001
        - name: LOG_LEVEL
          value: info
        resources:
          limits:
            memory: 512Mi
            cpu: "1"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
```

#### Cloud Run with Cloud SQL

```bash
# Create Cloud SQL instance
gcloud sql instances create agent-db \
  --database-version=POSTGRES_14 \
  --region=us-central1 \
  --tier=db-f1-micro

# Connect Cloud Run to Cloud SQL
gcloud run deploy my-agent \
  --image gcr.io/my-project-id/my-agent \
  --add-cloudsql-instances my-project-id:us-central1:agent-db \
  --set-env-vars "DATABASE_URL=postgresql://..."
```

#### Cloud Run Tips

- **Custom Domains**: Map to Cloud Run services
- **Traffic Splitting**: Gradual rollouts and A/B testing
- **VPC Connector**: Access private resources
- **Service Accounts**: Fine-grained IAM permissions
- **Cloud Scheduler**: Trigger services on schedule

---

### AWS App Runner

**Best for**: AWS ecosystem, container-based apps, managed infrastructure

#### Pros & Cons

**Pros**:
- ✅ Fully managed container service
- ✅ Auto-scaling built-in
- ✅ AWS integration
- ✅ Load balancing included
- ✅ Custom domains and SSL

**Cons**:
- ❌ AWS-specific
- ❌ Limited regions
- ❌ More expensive than ECS
- ❌ Less flexible than ECS/EKS

#### Deployment

**Via AWS Console**:

1. Open App Runner console
2. Create service
3. Choose source: Container registry or Git
4. Configure:
   - Container image URI: `<account>.dkr.ecr.us-east-1.amazonaws.com/my-agent:latest`
   - Port: 3000
   - Environment variables
5. Deploy

**Via AWS CLI**:

```bash
# Create App Runner service
aws apprunner create-service \
  --service-name my-agent \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "<account>.dkr.ecr.us-east-1.amazonaws.com/my-agent:latest",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "AGENT_ID": "my-agent-001",
          "LOG_LEVEL": "info"
        }
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": true
  }' \
  --instance-configuration '{
    "Cpu": "1 vCPU",
    "Memory": "2 GB"
  }' \
  --health-check-configuration '{
    "Protocol": "HTTP",
    "Path": "/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }'
```

#### App Runner Configuration File

**apprunner.yaml**:

```yaml
version: 1.0
runtime: nodejs18
build:
  commands:
    pre-build:
      - npm install
    build:
      - npm run build
run:
  runtime-version: 18
  command: npm start
  network:
    port: 3000
    env: API_PORT
  env:
    - name: AGENT_ID
      value: my-agent-001
    - name: LOG_LEVEL
      value: info
```

---

### Azure Container Apps

**Best for**: Microsoft ecosystem, serverless containers, Azure integration

#### Pros & Cons

**Pros**:
- ✅ Kubernetes-based (KEDA)
- ✅ Serverless pricing
- ✅ Azure integration
- ✅ Dapr support
- ✅ Event-driven scaling

**Cons**:
- ❌ Azure-specific
- ❌ Newer service
- ❌ Limited documentation
- ❌ Complex pricing

#### Deployment

```bash
# Install Azure CLI
brew update && brew install azure-cli

# Login
az login

# Create resource group
az group create \
  --name my-agent-rg \
  --location eastus

# Create Container Apps environment
az containerapp env create \
  --name my-agent-env \
  --resource-group my-agent-rg \
  --location eastus

# Deploy container app
az containerapp create \
  --name my-agent \
  --resource-group my-agent-rg \
  --environment my-agent-env \
  --image myregistry.azurecr.io/my-agent:latest \
  --target-port 3000 \
  --ingress external \
  --cpu 0.5 \
  --memory 1Gi \
  --min-replicas 0 \
  --max-replicas 10 \
  --env-vars "AGENT_ID=my-agent-001" "LOG_LEVEL=info"
```

#### Container App Configuration

```yaml
# containerapp.yaml
properties:
  configuration:
    activeRevisionsMode: Single
    ingress:
      external: true
      targetPort: 3000
      traffic:
      - weight: 100
        latestRevision: true
    secrets:
    - name: api-key
      value: your-secret-key
  template:
    containers:
    - name: my-agent
      image: myregistry.azurecr.io/my-agent:latest
      env:
      - name: AGENT_ID
        value: my-agent-001
      - name: API_KEY
        secretRef: api-key
      resources:
        cpu: 0.5
        memory: 1Gi
    scale:
      minReplicas: 0
      maxReplicas: 10
      rules:
      - name: http-rule
        http:
          metadata:
            concurrentRequests: "100"
```

---

## Container Orchestration

### Kubernetes

**Best for**: Enterprise production, complex multi-service apps, high availability

[See Quick Start Guide](./DEPLOYMENT_QUICKSTART.md#kubernetes-quickstart) for basic setup.

#### Production Kubernetes Deployment

**Complete Manifest Suite**:

```bash
# Export production-ready manifests
buildkit export kubernetes ./my-agent \
  --output ./k8s-prod \
  --replicas 3 \
  --enable-hpa \
  --enable-ingress \
  --enable-monitoring
```

#### Advanced Deployment Configuration

**1. Deployment with Rolling Updates**

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-agent
  namespace: production
  labels:
    app: my-agent
    version: v0.4.1
    environment: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: my-agent
  template:
    metadata:
      labels:
        app: my-agent
        version: v0.4.1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: agent-service-account
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: agent
        image: your-registry.io/my-agent:0.4.1
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: 3000
          protocol: TCP
        - name: metrics
          containerPort: 9090
          protocol: TCP
        env:
        - name: AGENT_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: AGENT_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        - name: AGENT_NAME
          valueFrom:
            configMapKeyRef:
              name: agent-config
              key: agent.name
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: agent-secrets
              key: database-url
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: agent-secrets
              key: api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          successThreshold: 1
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /health/startup
            port: http
          initialDelaySeconds: 0
          periodSeconds: 5
          timeoutSeconds: 3
          successThreshold: 1
          failureThreshold: 30
        volumeMounts:
        - name: config
          mountPath: /etc/agent/config
          readOnly: true
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: config
        configMap:
          name: agent-config
      - name: tmp
        emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - my-agent
              topologyKey: kubernetes.io/hostname
```

**2. Service with Load Balancing**

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-agent
  namespace: production
  labels:
    app: my-agent
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
spec:
  type: LoadBalancer
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
  selector:
    app: my-agent
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: http
  - name: https
    protocol: TCP
    port: 443
    targetPort: http
```

**3. Horizontal Pod Autoscaler (HPA)**

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-agent-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-agent
  minReplicas: 2
  maxReplicas: 20
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
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 4
        periodSeconds: 30
      selectPolicy: Max
```

**4. Ingress with SSL**

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-agent-ingress
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/limit-rps: "10"
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

**5. ConfigMap**

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: agent-config
  namespace: production
data:
  agent.name: "Production Agent"
  agent.version: "0.4.1"
  log.level: "info"
  log.format: "json"
  config.yaml: |
    server:
      port: 3000
      timeout: 30s
    agent:
      max_concurrent_tasks: 10
      task_timeout: 300s
    monitoring:
      enabled: true
      metrics_port: 9090
```

**6. Secrets**

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: agent-secrets
  namespace: production
type: Opaque
stringData:
  database-url: postgresql://user:pass@db:5432/agents
  api-key: your-api-key-here
  jwt-secret: your-jwt-secret
```

**Deploy All**:

```bash
# Apply all manifests
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml
kubectl apply -f ingress.yaml

# Verify deployment
kubectl -n production get all
kubectl -n production rollout status deployment/my-agent
```

#### Kubernetes Monitoring

**ServiceMonitor for Prometheus**:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-agent-metrics
  namespace: production
spec:
  selector:
    matchLabels:
      app: my-agent
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

---

### Docker Compose

**Best for**: Local development, simple multi-container apps, small deployments

[See Quick Start Guide](./DEPLOYMENT_QUICKSTART.md#docker-quickstart) for basic setup.

#### Production Docker Compose

**Complete Setup with Monitoring**:

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Main agent service
  agent:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    image: my-agent:latest
    container_name: agent_prod
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "9090:9090"  # Metrics
    environment:
      - NODE_ENV=production
      - AGENT_ID=my-agent-001
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/agents
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=info
    env_file:
      - .env.production
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - agent-network
    volumes:
      - agent-data:/app/data
      - ./config:/app/config:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.agent.rule=Host(`my-agent.example.com`)"
      - "traefik.http.services.agent.loadbalancer.server.port=3000"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # PostgreSQL database
  db:
    image: postgres:16-alpine
    container_name: agent_db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=agents
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - PGDATA=/var/lib/postgresql/data/pgdata
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - agent-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Redis cache
  redis:
    image: redis:7-alpine
    container_name: agent_redis
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - agent-network
    logging:
      driver: "json-file"
      options:
        max-size: "5m"
        max-file: "3"

  # Prometheus monitoring
  prometheus:
    image: prom/prometheus:latest
    container_name: agent_prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    ports:
      - "9091:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    networks:
      - agent-network

  # Grafana dashboards
  grafana:
    image: grafana/grafana:latest
    container_name: agent_grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./grafana/datasources:/etc/grafana/provisioning/datasources:ro
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
    networks:
      - agent-network

  # Reverse proxy (Traefik)
  traefik:
    image: traefik:v2.10
    container_name: agent_traefik
    restart: unless-stopped
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"  # Traefik dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - agent-network

networks:
  agent-network:
    driver: bridge

volumes:
  agent-data:
  postgres-data:
  redis-data:
  prometheus-data:
  grafana-data:
```

**Deployment**:

```bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale agent
docker-compose -f docker-compose.prod.yml up -d --scale agent=3

# Stop stack
docker-compose -f docker-compose.prod.yml down
```

---

### Docker Swarm

**Best for**: Simple orchestration, Docker-native clustering, small clusters

#### Swarm Setup

```bash
# Initialize Swarm
docker swarm init --advertise-addr <MANAGER-IP>

# Join worker nodes
docker swarm join --token <TOKEN> <MANAGER-IP>:2377

# Deploy stack
docker stack deploy -c docker-compose.swarm.yml agent-stack
```

#### Swarm Compose File

```yaml
# docker-compose.swarm.yml
version: '3.8'

services:
  agent:
    image: my-registry.com/my-agent:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      placement:
        constraints:
          - node.role == worker
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    ports:
      - target: 3000
        published: 3000
        mode: host
    networks:
      - agent-network
    volumes:
      - agent-data:/app/data
    environment:
      - AGENT_ID={{.Task.Name}}
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  agent-network:
    driver: overlay
    attachable: true

volumes:
  agent-data:
    driver: local
```

---

### HashiCorp Nomad

**Best for**: Flexible orchestration, multi-cloud, hybrid deployments

#### Nomad Job Specification

```hcl
# agent.nomad
job "my-agent" {
  datacenters = ["dc1"]
  type = "service"

  group "agents" {
    count = 3

    network {
      port "http" {
        static = 3000
        to = 3000
      }
      port "metrics" {
        static = 9090
        to = 9090
      }
    }

    service {
      name = "my-agent"
      port = "http"

      check {
        type     = "http"
        path     = "/health"
        interval = "30s"
        timeout  = "5s"
      }
    }

    task "agent" {
      driver = "docker"

      config {
        image = "my-registry.com/my-agent:latest"
        ports = ["http", "metrics"]
      }

      env {
        AGENT_ID = "${NOMAD_ALLOC_NAME}"
        LOG_LEVEL = "info"
      }

      resources {
        cpu    = 500
        memory = 512
      }

      restart {
        attempts = 3
        delay    = "15s"
        mode     = "fail"
      }
    }
  }

  update {
    max_parallel     = 1
    min_healthy_time = "30s"
    healthy_deadline = "3m"
    auto_revert      = true
  }
}
```

**Deploy**:

```bash
# Run job
nomad job run agent.nomad

# Check status
nomad job status my-agent

# Scale
nomad job scale my-agent 5
```

---

## Cloud Infrastructure (IaaS)

### AWS EC2

**Best for**: Full control, custom configurations, AWS ecosystem

#### EC2 Deployment with User Data

```bash
#!/bin/bash
# user-data.sh

# Update system
yum update -y

# Install Docker
yum install -y docker
service docker start
usermod -a -G docker ec2-user

# Pull and run agent
docker pull your-registry.com/my-agent:latest
docker run -d \
  --name my-agent \
  --restart unless-stopped \
  -p 80:3000 \
  -e AGENT_ID=my-agent-001 \
  -e LOG_LEVEL=info \
  your-registry.com/my-agent:latest
```

#### Launch EC2 Instance

```bash
# Create EC2 instance
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.small \
  --key-name my-key-pair \
  --security-group-ids sg-0123456789abcdef0 \
  --subnet-id subnet-6e7f829e \
  --user-data file://user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=my-agent}]'
```

---

### Google Compute Engine

**Best for**: GCP ecosystem, custom VMs, persistent disks

```bash
# Create instance with agent
gcloud compute instances create my-agent-instance \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=cos-stable \
  --image-project=cos-cloud \
  --boot-disk-size=10GB \
  --metadata-from-file=user-data=startup-script.sh \
  --tags=http-server,https-server
```

---

### Azure Virtual Machines

**Best for**: Azure ecosystem, Windows/Linux VMs, managed services

```bash
# Create VM
az vm create \
  --resource-group my-agent-rg \
  --name my-agent-vm \
  --image UbuntuLTS \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --custom-data cloud-init.txt
```

---

### DigitalOcean Droplets

**Best for**: Simple VMs, developer-friendly, affordable

```bash
# Create droplet via API
curl -X POST https://api.digitalocean.com/v2/droplets \
  -H "Authorization: Bearer $DIGITALOCEAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-agent",
    "region": "nyc3",
    "size": "s-1vcpu-1gb",
    "image": "docker-20-04",
    "user_data": "'"$(cat user-data.sh)"'"
  }'
```

---

## Specialized Deployments

### Edge Deployment

**Best for**: Low-latency, IoT, distributed systems

Platforms:
- **Fly.io**: Global edge deployment (covered above)
- **Cloudflare Workers**: Serverless edge
- **AWS Lambda@Edge**: CDN edge functions
- **Fastly Compute@Edge**: Edge computing

---

### On-Premises

**Best for**: Data sovereignty, air-gapped environments, compliance

Deploy using:
- Kubernetes (on-prem cluster)
- Docker Compose
- Bare metal with systemd

---

### Hybrid Cloud

**Best for**: Multi-cloud, disaster recovery, data locality

Strategies:
- Kubernetes Federation
- Service mesh (Istio, Linkerd)
- Multi-cloud CDN
- Data replication

---

## CI/CD Integration

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

test:
  stage: test
  image: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  script:
    - npm test

deploy:railway:
  stage: deploy
  image: node:18
  script:
    - npm install -g @railway/cli
    - railway up --service my-agent
  only:
    - main

deploy:kubernetes:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/my-agent agent=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - kubectl rollout status deployment/my-agent
  only:
    - main
```

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Agent

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t my-agent:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo ${{ secrets.REGISTRY_PASSWORD }} | docker login -u ${{ secrets.REGISTRY_USERNAME }} --password-stdin
          docker push my-agent:${{ github.sha }}

      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm install -g @railway/cli
          railway up
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AGENT_ID` | Unique agent identifier | `my-agent-001` |
| `AGENT_NAME` | Human-readable name | `Content Moderator` |
| `OSSA_VERSION` | OSSA spec version | `0.4.1` |
| `API_PORT` | API server port | `3000` |
| `LOG_LEVEL` | Logging verbosity | `info` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `NODE_ENV` | Environment mode | `production` |
| `METRICS_PORT` | Prometheus metrics port | `9090` |
| `MAX_WORKERS` | Concurrent workers | `10` |
| `REQUEST_TIMEOUT` | Request timeout (ms) | `30000` |

[See Complete Reference →](./DEPLOYMENT_OPERATIONS.md#environment-variables)

---

## Next Steps

- **[Operations Runbook](./DEPLOYMENT_OPERATIONS.md)** - Monitoring, troubleshooting, scaling
- **[Security Guide](./DEPLOYMENT_SECURITY.md)** - Harden your deployment
- **[Architecture Guide](./DEPLOYMENT_ARCHITECTURE.md)** - Reference architectures
- **[FAQ](./DEPLOYMENT_FAQ.md)** - Common questions

---

**Last Updated**: 2026-02-04
