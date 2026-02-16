# Railway Deployment Guide - OSSA Buildkit

Complete guide for deploying OSSA Buildkit to Railway with one-click configuration.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Deploy (One-Click)](#quick-deploy-one-click)
3. [Manual Setup](#manual-setup)
4. [Configuration](#configuration)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Configuration](#advanced-configuration)

---

## Prerequisites

### Required

- Railway account ([sign up](https://railway.app))
- GitHub repository with OSSA Buildkit code
- Node.js 20+ (for local testing)

### Recommended

- Railway CLI installed (`npm install -g @railway/cli`)
- Git configured with SSH keys
- Access to Drupal instance (if using Drupal integration)

---

## Quick Deploy (One-Click)

### Step 1: Deploy from Template

1. Click the Railway deploy button:

   [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/YOUR_ORG/ossa-buildkit)

2. Railway will prompt you to:
   - Connect your GitHub account
   - Select repository and branch
   - Choose deployment region

3. Click **Deploy Now**

### Step 2: Configure Environment Variables

Railway will create a project with default configuration. You need to set these **required secrets**:

```bash
# Core API Configuration
railway variables set API_BASE_URL=https://your-api.railway.app

# Drupal Integration (if applicable)
railway variables set DRUPAL_BASE_URL=https://your-drupal-site.com
railway variables set DRUPAL_API_KEY=your-drupal-api-key

# Database (auto-configured if using Railway Postgres)
# railway variables set DATABASE_URL=postgresql://... (auto-set)

# Vector Database (Qdrant)
railway variables set QDRANT_URL=https://your-qdrant.railway.app
railway variables set QDRANT_API_KEY=your-qdrant-api-key

# Security
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set ENCRYPTION_KEY=$(openssl rand -base64 32)

# CORS Configuration
railway variables set ALLOWED_ORIGINS=https://your-frontend.com,https://your-drupal.com

# Agent Registry
railway variables set AGENT_REGISTRY_URL=https://registry.your-domain.com

# Monitoring (optional)
railway variables set SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# Bridge Server
railway variables set BRIDGE_API_KEY=$(openssl rand -base64 32)
railway variables set CORS_ORIGINS=https://your-frontend.com
```

### Step 3: Verify Deployment

1. Wait for deployment to complete (check Railway dashboard)
2. Test health endpoint:
   ```bash
   curl https://your-app.railway.app/health
   ```
3. Expected response:
   ```json
   {
     "status": "healthy",
     "version": "0.4.1",
     "timestamp": "2026-02-04T12:00:00Z"
   }
   ```

---

## Manual Setup

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### Step 2: Create New Project

```bash
# Initialize Railway project
railway init

# Link to GitHub repository
railway link
```

### Step 3: Add Services

```bash
# Add PostgreSQL database
railway add --plugin postgres

# Add Redis cache
railway add --plugin redis

# Deploy Qdrant (vector database)
railway add --service qdrant/qdrant:latest
```

### Step 4: Configure railway.json

Create `railway.json` in your project root (or use the Handlebars template):

```bash
# Copy template
cp deployment-templates/railway.json.hbs railway.json

# Fill in variables using your template engine or manually
```

**Example values for template variables:**

```json
{
  "serviceName": "ossa-buildkit",
  "githubRepo": "your-org/ossa-buildkit",
  "branch": "main",
  "nodeEnv": "production",
  "port": "8080",
  "logLevel": "info",
  "buildCommand": "npm ci && npm run build",
  "startCommand": "npm start",
  "replicas": 1,
  "minReplicas": 1,
  "maxReplicas": 5,
  "autoscalingEnabled": true,
  "targetCpu": 70,
  "targetMemory": 80,
  "memory": "2Gi",
  "cpu": "1",
  "customDomain": "api.your-domain.com",
  "bridgePort": "8081",
  "bridgeCustomDomain": "bridge.your-domain.com"
}
```

### Step 5: Deploy

```bash
# Deploy to Railway
railway up

# Or deploy with specific service
railway up --service ossa-buildkit
```

---

## Configuration

### Service Architecture

Railway will deploy these services:

1. **Main Service** (`ossa-buildkit`)
   - Node.js web service
   - Handles OSSA agent execution
   - Exposes REST API
   - Port: 8080 (default)

2. **Bridge Server** (`ossa-buildkit-bridge`)
   - Node.js web service
   - Drupal ↔ OSSA communication bridge
   - Handles agent sync
   - Port: 8081 (default)

3. **PostgreSQL** (`ossa-buildkit-postgres`)
   - Managed PostgreSQL 16
   - Agent metadata storage
   - Execution history

4. **Redis** (`ossa-buildkit-redis`)
   - Managed Redis 7
   - Caching layer
   - Session storage

5. **Qdrant** (`ossa-buildkit-qdrant`)
   - Vector database
   - Agent embeddings
   - Semantic search

### Resource Allocation

**Production Recommendations:**

```json
{
  "main-service": {
    "memory": "2Gi",
    "cpu": "1",
    "replicas": "1-5"
  },
  "bridge-server": {
    "memory": "1Gi",
    "cpu": "0.5",
    "replicas": "1-3"
  },
  "postgres": {
    "plan": "standard",
    "storage": "10GB"
  },
  "redis": {
    "plan": "standard",
    "maxmemory": "512mb"
  },
  "qdrant": {
    "memory": "2Gi",
    "storage": "10GB"
  }
}
```

### Autoscaling Configuration

Railway will automatically scale based on:

- **CPU Usage**: Scale up when average > 70%
- **Memory Usage**: Scale up when average > 80%
- **Request Queue**: Scale up when queue depth > 100

Configure in `railway.json`:

```json
{
  "scaling": {
    "minReplicas": 1,
    "maxReplicas": 5,
    "autoscaling": {
      "enabled": true,
      "targetCPU": 70,
      "targetMemory": 80
    }
  }
}
```

---

## Environment Variables

### Required Variables

These MUST be set for deployment to succeed:

| Variable | Description | Example |
|----------|-------------|---------|
| `API_BASE_URL` | Base URL for API service | `https://api.your-domain.com` |
| `DRUPAL_BASE_URL` | Drupal site URL | `https://your-site.com` |
| `DRUPAL_API_KEY` | Drupal API authentication key | `generated-key-32-chars` |
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by Railway |
| `REDIS_URL` | Redis connection string | Auto-set by Railway |
| `QDRANT_URL` | Qdrant instance URL | `https://qdrant.railway.app` |
| `QDRANT_API_KEY` | Qdrant API key | `your-qdrant-key` |
| `JWT_SECRET` | JWT signing secret | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | Data encryption key | `openssl rand -base64 32` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins (comma-separated) |
| `RATE_LIMIT_WINDOW` | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `MAX_CONCURRENT_AGENTS` | `10` | Max concurrent agent executions |
| `AGENT_TIMEOUT_MS` | `300000` | Agent execution timeout (5 minutes) |
| `CACHE_TTL_SECONDS` | `300` | Cache TTL (5 minutes) |
| `ENABLE_METRICS` | `true` | Enable Prometheus metrics |
| `METRICS_PORT` | `9090` | Metrics endpoint port |
| `SENTRY_DSN` | - | Sentry error tracking DSN |
| `ENABLE_DEBUG` | `false` | Enable debug logging |

### Setting Variables

**Via Railway CLI:**

```bash
# Set single variable
railway variables set API_BASE_URL=https://api.example.com

# Set multiple variables from file
railway variables set --file .env.production
```

**Via Railway Dashboard:**

1. Go to your project
2. Select service (e.g., `ossa-buildkit`)
3. Navigate to **Variables** tab
4. Click **New Variable**
5. Enter key and value
6. Click **Save**

---

## Post-Deployment

### 1. Verify Services

```bash
# Check all services are running
railway status

# View logs
railway logs --service ossa-buildkit
railway logs --service ossa-buildkit-bridge
```

### 2. Test API Endpoints

```bash
# Health check
curl https://your-app.railway.app/health

# API version
curl https://your-app.railway.app/api/version

# List agents (requires auth)
curl -H "Authorization: Bearer $JWT_TOKEN" \
  https://your-app.railway.app/api/agents
```

### 3. Configure Custom Domains

**Via Railway Dashboard:**

1. Go to **Settings** → **Domains**
2. Click **Add Custom Domain**
3. Enter domain (e.g., `api.your-domain.com`)
4. Update DNS records:
   ```
   CNAME api.your-domain.com → your-app.railway.app
   ```
5. Wait for SSL certificate provisioning (automatic)

**Via Railway CLI:**

```bash
railway domain add api.your-domain.com
```

### 4. Enable Monitoring

**Prometheus Metrics:**

Railway auto-discovers metrics endpoints. Access at:
```
https://your-app.railway.app/metrics
```

**Sentry Integration:**

```bash
railway variables set SENTRY_DSN=https://your-key@sentry.io/project
railway variables set SENTRY_ENVIRONMENT=production
```

### 5. Setup Backups

**Database Backups:**

```bash
# Enable automatic backups (via Railway)
railway database backup --enable --schedule daily

# Manual backup
railway database backup create
```

**Volume Backups:**

```bash
# Backup volumes manually
railway volume backup ossa-buildkit-data
```

---

## Troubleshooting

### Deployment Failures

**Issue: Build fails with "Module not found"**

```bash
# Solution: Clear build cache
railway build --clear-cache

# Verify package.json and package-lock.json are committed
git ls-files package*.json
```

**Issue: Service won't start**

```bash
# Check logs
railway logs --tail 100

# Common causes:
# 1. Missing environment variables
railway variables list

# 2. Port mismatch
# Ensure PORT env var matches your service configuration

# 3. Health check failures
# Verify /health endpoint returns 200 OK
```

### Performance Issues

**Issue: High CPU usage**

```bash
# Check current metrics
railway metrics --service ossa-buildkit

# Scale up resources
railway scale --cpus 2 --memory 4Gi

# Or enable autoscaling
railway scale --autoscale --min 2 --max 10
```

**Issue: Slow database queries**

```bash
# Check database metrics
railway database metrics

# Upgrade database plan
railway database scale --plan standard
```

### Connection Issues

**Issue: Can't connect to database**

```bash
# Verify DATABASE_URL is set
railway variables get DATABASE_URL

# Check database is running
railway service status ossa-buildkit-postgres

# Test connection
railway run -- node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(res => console.log(res.rows[0]));
"
```

**Issue: CORS errors**

```bash
# Update ALLOWED_ORIGINS
railway variables set ALLOWED_ORIGINS=https://your-frontend.com,https://your-drupal.com

# Check current value
railway variables get ALLOWED_ORIGINS
```

### Debug Mode

Enable debug logging:

```bash
railway variables set ENABLE_DEBUG=true
railway variables set LOG_LEVEL=debug

# View debug logs
railway logs --tail 500 | grep DEBUG
```

---

## Advanced Configuration

### Multi-Region Deployment

```json
{
  "services": [
    {
      "name": "ossa-buildkit-us",
      "region": "us-west1"
    },
    {
      "name": "ossa-buildkit-eu",
      "region": "europe-west1"
    }
  ]
}
```

### Custom Build Pipeline

Create `.railway/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build TypeScript
RUN npm run build

# Expose ports
EXPOSE 8080 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
```

Update `railway.json`:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": ".railway/Dockerfile"
  }
}
```

### Database Migrations

Create migration script `.railway/migrate.sh`:

```bash
#!/bin/bash
set -e

echo "Running database migrations..."
npm run migrate

echo "Seeding initial data..."
npm run seed

echo "Migrations complete!"
```

Update `railway.json`:

```json
{
  "deploy": {
    "startCommand": "bash .railway/migrate.sh && npm start"
  }
}
```

### Environment-Specific Configuration

Create separate configs:

- `railway.production.json`
- `railway.staging.json`
- `railway.development.json`

Deploy with specific config:

```bash
# Production
railway up --config railway.production.json --environment production

# Staging
railway up --config railway.staging.json --environment staging
```

---

## Support

### Resources

- **Railway Documentation**: https://docs.railway.app
- **OSSA Documentation**: See `DRUPAL_INTEGRATION_INDEX.md`
- **GitHub Issues**: https://github.com/your-org/ossa-buildkit/issues

### Community

- **Discord**: https://discord.gg/railway
- **Stack Overflow**: Tag `ossa` and `railway`

### Commercial Support

Contact BlueFly.io for enterprise support:
- Email: support@bluefly.io
- Priority support
- Custom deployment assistance

---

## Next Steps

1. [Configure Render Deployment](./DEPLOYMENT_GUIDE_RENDER.md)
2. [Configure Fly.io Deployment](./DEPLOYMENT_GUIDE_FLY.md)
3. [Environment Variables Reference](./ENVIRONMENT_VARIABLES.md)

---

**Last Updated**: 2026-02-04
**OSSA Version**: v0.4.1
**Railway API Version**: v2
