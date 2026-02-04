# Fly.io Deployment Guide - OSSA Buildkit

Complete guide for deploying OSSA Buildkit to Fly.io with production-grade configuration.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Deploy](#quick-deploy)
3. [Manual Setup](#manual-setup)
4. [Configuration](#configuration)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Configuration](#advanced-configuration)

---

## Prerequisites

### Required

- Fly.io account ([sign up](https://fly.io/app/sign-up))
- Fly CLI installed
- Node.js 20+ (for local testing)
- Git repository with OSSA Buildkit code

### Install Fly CLI

**macOS/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows (PowerShell):**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**Via Homebrew:**
```bash
brew install flyctl
```

**Login:**
```bash
fly auth login
```

---

## Quick Deploy

### Step 1: Initialize Fly App

```bash
# Navigate to your project
cd /path/to/ossa-buildkit

# Initialize Fly app
fly launch --no-deploy

# Follow prompts:
# - App name: ossa-buildkit (or custom)
# - Region: Choose nearest
# - PostgreSQL: Yes
# - Redis: Yes
```

This creates a default `fly.toml` file.

### Step 2: Use Production Template

Replace the default `fly.toml` with our production template:

```bash
# Backup default config
mv fly.toml fly.toml.backup

# Copy production template
cp deployment-templates/fly.toml.hbs fly.toml
```

**Fill in template variables:**

```toml
app = "ossa-buildkit"
primary_region = "sea"  # Seattle
kill_timeout = "30s"

[env]
  NODE_ENV = "production"
  PORT = "8080"
  LOG_LEVEL = "info"
```

### Step 3: Set Secrets

```bash
# Core secrets
fly secrets set \
  API_BASE_URL="https://ossa-buildkit.fly.dev" \
  DRUPAL_BASE_URL="https://your-drupal-site.com" \
  DRUPAL_API_KEY="your-drupal-api-key"

# Security
fly secrets set \
  JWT_SECRET="$(openssl rand -base64 32)" \
  ENCRYPTION_KEY="$(openssl rand -base64 32)"

# Vector database
fly secrets set \
  QDRANT_URL="https://your-qdrant.fly.dev" \
  QDRANT_API_KEY="your-qdrant-key"

# CORS
fly secrets set \
  ALLOWED_ORIGINS="https://your-frontend.com,https://your-drupal.com"

# Agent registry
fly secrets set \
  AGENT_REGISTRY_URL="https://registry.your-domain.com"

# Bridge server
fly secrets set \
  BRIDGE_API_KEY="$(openssl rand -base64 32)" \
  CORS_ORIGINS="https://your-frontend.com"

# Optional: Monitoring
fly secrets set \
  SENTRY_DSN="https://your-key@sentry.io/project"
```

### Step 4: Create Volumes

```bash
# Create persistent volume for data
fly volumes create ossa_buildkit_data \
  --region sea \
  --size 10

# Create volume for logs
fly volumes create ossa_buildkit_logs \
  --region sea \
  --size 5
```

### Step 5: Deploy

```bash
# Deploy to Fly.io
fly deploy

# Watch deployment progress
fly logs

# Check status
fly status
```

### Step 6: Verify

```bash
# Get app URL
fly info

# Test health endpoint
curl https://ossa-buildkit.fly.dev/health

# View logs
fly logs --tail 100
```

---

## Manual Setup

### Step 1: Create New App

```bash
# Create app without deploying
fly apps create ossa-buildkit --org your-org

# Set region
fly regions set sea  # Seattle (change as needed)
```

### Step 2: Configure fly.toml

Create `fly.toml` from template:

```bash
cp deployment-templates/fly.toml.hbs fly.toml
```

**Key configuration sections:**

```toml
app = "ossa-buildkit"
primary_region = "sea"

[build]
  builder = "heroku/buildpacks:20"

[http_service]
  internal_port = 8080
  force_https = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 1024

[autoscaling]
  enabled = true
  min_count = 1
  max_count = 5
```

### Step 3: Provision Databases

**PostgreSQL:**
```bash
# Create Postgres cluster
fly postgres create --name ossa-buildkit-db --region sea

# Attach to app
fly postgres attach ossa-buildkit-db --app ossa-buildkit

# This sets DATABASE_URL automatically
```

**Redis:**
```bash
# Create Redis instance (via Upstash)
fly redis create --name ossa-buildkit-redis --region sea

# Attach to app
fly redis attach ossa-buildkit-redis --app ossa-buildkit

# This sets REDIS_URL automatically
```

**Qdrant (Vector DB):**
```bash
# Deploy Qdrant as separate app
fly launch --image qdrant/qdrant:latest --name ossa-buildkit-qdrant

# Set API key
fly secrets set QDRANT_API_KEY="$(openssl rand -base64 32)" --app ossa-buildkit-qdrant

# Get internal URL
fly info --app ossa-buildkit-qdrant

# Set in main app
fly secrets set QDRANT_URL="http://ossa-buildkit-qdrant.internal:6333"
```

### Step 4: Configure Networking

```bash
# Allocate IPv4
fly ips allocate-v4

# Allocate IPv6 (automatic)
fly ips list

# Configure custom domain
fly certs add api.your-domain.com

# Update DNS
# CNAME api.your-domain.com → ossa-buildkit.fly.dev
```

### Step 5: Deploy

```bash
fly deploy
```

---

## Configuration

### Service Architecture

Fly.io deployment includes:

1. **Main Application** (Process: `app`)
   - Node.js web service
   - Port 8080 (internal)
   - Handles agent execution
   - REST API

2. **Bridge Server** (Process: `bridge`)
   - Node.js service
   - Port 8081 (internal)
   - Drupal ↔ OSSA bridge
   - Separate process in same VM

3. **Background Worker** (Process: `worker`)
   - Async job processor
   - Agent queue consumer
   - Shares database/Redis

4. **PostgreSQL Cluster**
   - Managed Postgres 16
   - High availability
   - Automatic backups

5. **Redis Cache**
   - Upstash Redis
   - Global replication
   - TLS enabled

### VM Sizing

**Development:**
```toml
[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

**Staging:**
```toml
[[vm]]
  cpu_kind = "shared"
  cpus = 2
  memory_mb = 1024
```

**Production:**
```toml
[[vm]]
  cpu_kind = "performance"
  cpus = 2
  memory_mb = 2048
```

**High Performance:**
```toml
[[vm]]
  cpu_kind = "performance"
  cpus = 4
  memory_mb = 4096
```

### Autoscaling

Configure autoscaling based on metrics:

```toml
[autoscaling]
  enabled = true
  min_count = 2
  max_count = 10

  [[autoscaling.metrics]]
    type = "cpu"
    target = 70

  [[autoscaling.metrics]]
    type = "memory"
    target = 80

  [[autoscaling.metrics]]
    type = "requests"
    target = 1000
```

### Health Checks

Fly.io performs multiple health checks:

```toml
[[http_service.checks]]
  interval = "30s"
  timeout = "10s"
  grace_period = "30s"
  method = "GET"
  path = "/health"

[[http_service.checks]]
  interval = "10s"
  timeout = "5s"
  method = "GET"
  path = "/ready"
```

Implement endpoints:

```javascript
// health.js
app.get('/health', async (req, res) => {
  try {
    // Check critical services
    await db.query('SELECT 1');
    await redis.ping();

    res.json({ status: 'healthy' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

app.get('/ready', (req, res) => {
  // Quick check - is app ready to serve requests?
  res.json({ status: 'ready' });
});
```

---

## Environment Variables

### Required Variables

Set via `fly secrets`:

```bash
fly secrets set \
  API_BASE_URL="https://your-app.fly.dev" \
  DRUPAL_BASE_URL="https://drupal.example.com" \
  DRUPAL_API_KEY="secret-key" \
  DATABASE_URL="postgres://..." \
  REDIS_URL="redis://..." \
  QDRANT_URL="http://qdrant.internal:6333" \
  QDRANT_API_KEY="secret" \
  JWT_SECRET="secret" \
  ENCRYPTION_KEY="secret" \
  ALLOWED_ORIGINS="https://example.com" \
  AGENT_REGISTRY_URL="https://registry.example.com"
```

### Public Variables

Set in `fly.toml`:

```toml
[env]
  NODE_ENV = "production"
  PORT = "8080"
  LOG_LEVEL = "info"
  RATE_LIMIT_WINDOW = "60000"
  RATE_LIMIT_MAX = "100"
  MAX_CONCURRENT_AGENTS = "10"
  AGENT_TIMEOUT_MS = "300000"
  CACHE_TTL_SECONDS = "300"
  ENABLE_METRICS = "true"
  METRICS_PORT = "9090"
```

### List All Secrets

```bash
fly secrets list
```

### Update Secret

```bash
fly secrets set DRUPAL_API_KEY="new-secret-key"
```

### Remove Secret

```bash
fly secrets unset OLD_SECRET_NAME
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check app status
fly status

# View running machines
fly machines list

# Check health
curl https://ossa-buildkit.fly.dev/health
```

Expected response:

```json
{
  "status": "healthy",
  "version": "0.4.1",
  "region": "sea",
  "machine": "91857502f27489",
  "services": {
    "database": "connected",
    "redis": "connected",
    "qdrant": "connected"
  }
}
```

### 2. Monitor Logs

```bash
# Tail logs
fly logs

# Filter by level
fly logs --level error

# Search logs
fly logs --search "agent"

# View specific machine
fly logs --machine 91857502f27489
```

### 3. Configure Custom Domain

```bash
# Add certificate
fly certs add api.your-domain.com

# Check certificate status
fly certs show api.your-domain.com

# Update DNS (CNAME)
# api.your-domain.com → ossa-buildkit.fly.dev
```

### 4. Setup Monitoring

**Fly.io Metrics:**

```bash
# View metrics
fly dashboard

# Or via API
fly api /v1/apps/ossa-buildkit/metrics
```

**Prometheus Metrics:**

Enable metrics endpoint in your app:

```javascript
// metrics.js
const promClient = require('prom-client');
const register = promClient.register;

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

**Grafana Integration:**

```bash
# Export metrics to Grafana
fly metrics export --format prometheus > metrics.txt
```

### 5. Configure Backups

**Database Backups:**

```bash
# Postgres backups (automatic)
fly postgres backup --app ossa-buildkit-db

# List backups
fly postgres backup list --app ossa-buildkit-db

# Restore backup
fly postgres restore --app ossa-buildkit-db --backup-id 123
```

**Volume Snapshots:**

```bash
# Create volume snapshot
fly volumes snapshot create ossa_buildkit_data

# List snapshots
fly volumes snapshot list

# Restore snapshot
fly volumes restore ossa_buildkit_data --snapshot-id abc123
```

### 6. Scale Application

```bash
# Scale vertically (VM size)
fly scale vm shared-cpu-2x --memory 2048

# Scale horizontally (instances)
fly scale count 3

# Scale per region
fly scale count 2 --region sea
fly scale count 1 --region lhr

# Auto-scale configuration
fly autoscale set min=2 max=10
```

---

## Troubleshooting

### Deployment Issues

**Issue: Build fails**

```bash
# View build logs
fly logs --build

# Common causes:
# 1. Node version mismatch
# Fix: Update fly.toml
[build.args]
  NODE_VERSION = "20"

# 2. Build command fails
# Fix: Update package.json
"scripts": {
  "build": "tsc && npm run postbuild"
}

# Retry deployment
fly deploy --force
```

**Issue: App won't start**

```bash
# Check runtime logs
fly logs --tail 500

# Common causes:
# 1. Port mismatch
# Ensure app listens on process.env.PORT

# 2. Missing secrets
fly secrets list

# 3. Database not attached
fly postgres attach ossa-buildkit-db

# SSH into machine to debug
fly ssh console
node -e "console.log(process.env)"
```

### Performance Issues

**Issue: High latency**

```bash
# Check machine location
fly status

# Add machines in more regions
fly scale count 1 --region lhr  # London
fly scale count 1 --region syd  # Sydney

# Or enable Fly.io Anycast
fly ips allocate-v4 --anycast
```

**Issue: Memory leaks**

```bash
# Monitor memory usage
fly metrics --metric mem_usage

# Increase memory
fly scale memory 2048

# Or enable auto-restart on memory threshold
# In fly.toml:
[http_service]
  auto_stop_machines = true
  auto_start_machines = true
```

### Database Issues

**Issue: Connection pool exhausted**

```bash
# Check Postgres metrics
fly postgres db-metrics --app ossa-buildkit-db

# Scale Postgres
fly postgres scale vm --app ossa-buildkit-db --memory 2048

# Increase max connections
fly postgres config update --max-connections 100 --app ossa-buildkit-db
```

**Issue: Slow queries**

```bash
# Enable query logging
fly postgres config update --log-min-duration-statement 1000 --app ossa-buildkit-db

# View slow queries
fly ssh console --app ossa-buildkit-db
psql -U postgres -d ossa_buildkit
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

### Networking Issues

**Issue: Can't connect to Qdrant**

```bash
# Check internal DNS
fly ssh console
curl http://ossa-buildkit-qdrant.internal:6333/health

# Verify QDRANT_URL
fly secrets list | grep QDRANT

# Update if needed
fly secrets set QDRANT_URL="http://ossa-buildkit-qdrant.internal:6333"
```

**Issue: CORS errors**

```bash
# Update ALLOWED_ORIGINS
fly secrets set ALLOWED_ORIGINS="https://site1.com,https://site2.com"

# Verify CORS middleware
fly ssh console
node -e "console.log(process.env.ALLOWED_ORIGINS)"
```

### Debug Mode

```bash
# Enable debug logging
fly secrets set ENABLE_DEBUG=true LOG_LEVEL=debug

# SSH into machine
fly ssh console

# Run diagnostics
node -e "require('./dist/diagnostics').run()"

# Check environment
env | grep -i api

# Test database connection
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(r => console.log(r.rows));
"

# Disable debug when done
fly secrets set ENABLE_DEBUG=false LOG_LEVEL=info
```

---

## Advanced Configuration

### Multi-Region Deployment

Deploy to multiple regions for global low latency:

```bash
# Deploy to primary region
fly deploy

# Add machines in other regions
fly machine clone --region lhr  # London
fly machine clone --region nrt  # Tokyo
fly machine clone --region syd  # Sydney

# Configure Fly.io Anycast routing
fly ips allocate-v4 --anycast
```

Update `fly.toml`:

```toml
primary_region = "sea"

[[services]]
  regions = ["sea", "lhr", "nrt", "syd"]
```

### Blue-Green Deployments

```bash
# Deploy to staging slot
fly deploy --strategy bluegreen

# Smoke test
curl https://ossa-buildkit-staging.fly.dev/health

# Promote to production
fly promote --slot staging
```

### Canary Deployments

```bash
# Deploy to 10% of traffic
fly deploy --strategy canary:10

# Monitor metrics
fly metrics

# Increase to 50%
fly deploy --strategy canary:50

# Complete rollout
fly deploy --strategy canary:100
```

### Private Networking

Create private network for service-to-service communication:

```bash
# Create private network
fly wireguard create ossa-private-net

# Connect bridge server
fly wireguard peer add ossa-buildkit-bridge --network ossa-private-net

# Use internal DNS
# bridge.internal:8081
```

### Custom Docker Build

Create custom `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health')"

# Expose ports
EXPOSE 8080 9090

# Start
CMD ["node", "dist/index.js"]
```

Update `fly.toml`:

```toml
[build]
  dockerfile = "Dockerfile"
```

Deploy:

```bash
fly deploy --dockerfile Dockerfile
```

### Release Commands

Run migrations before deployment:

```toml
[deploy]
  release_command = "npm run migrate"
```

### Environment-Specific Configuration

Create multiple `fly.toml` files:

- `fly.production.toml`
- `fly.staging.toml`
- `fly.development.toml`

Deploy with specific config:

```bash
fly deploy --config fly.production.toml
```

---

## Support

### Resources

- **Fly.io Docs**: https://fly.io/docs
- **Community Forum**: https://community.fly.io
- **OSSA Docs**: See `DRUPAL_INTEGRATION_INDEX.md`

### Support Channels

- **Discord**: https://fly.io/discord
- **Email**: support@fly.io (Enterprise)
- **Status**: https://status.fly.io

### Commercial Support

BlueFly.io offers:
- Production deployment assistance
- Performance optimization
- 24/7 monitoring
- Enterprise SLA

Contact: support@bluefly.io

---

## Next Steps

1. [Railway Deployment Guide](./DEPLOYMENT_GUIDE_RAILWAY.md)
2. [Render Deployment Guide](./DEPLOYMENT_GUIDE_RENDER.md)
3. [Environment Variables Reference](./ENVIRONMENT_VARIABLES.md)

---

**Last Updated**: 2026-02-04
**OSSA Version**: v0.4.1
**Fly.io Platform Version**: v2
