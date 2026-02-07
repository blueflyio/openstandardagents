# OSSA Buildkit Deployment Templates

One-click deployment configurations for Railway, Render, and Fly.io platforms.

---

## 📦 What's Included

| File | Description | Platform |
|------|-------------|----------|
| **[railway.json.hbs](./railway.json.hbs)** | Complete Railway service configuration | Railway |
| **[render.yaml.hbs](./render.yaml.hbs)** | Complete Render blueprint specification | Render |
| **[fly.toml.hbs](./fly.toml.hbs)** | Complete Fly.io app configuration | Fly.io |
| **[DEPLOYMENT_GUIDE_RAILWAY.md](./DEPLOYMENT_GUIDE_RAILWAY.md)** | Railway deployment guide | Railway |
| **[DEPLOYMENT_GUIDE_RENDER.md](./DEPLOYMENT_GUIDE_RENDER.md)** | Render deployment guide | Render |
| **[DEPLOYMENT_GUIDE_FLY.md](./DEPLOYMENT_GUIDE_FLY.md)** | Fly.io deployment guide | Fly.io |
| **[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)** | Complete environment variable reference | All |

---

## 🚀 Quick Start

### Railway

1. Copy template:
   ```bash
   cp deployment-templates/railway.json.hbs railway.json
   ```

2. Fill in variables (or use template engine)

3. Deploy:
   ```bash
   railway up
   ```

4. See [Railway Guide](./DEPLOYMENT_GUIDE_RAILWAY.md) for details

---

### Render

1. Copy template to project root:
   ```bash
   cp deployment-templates/render.yaml.hbs render.yaml
   ```

2. Fill in variables

3. Connect repository to Render (auto-detects `render.yaml`)

4. See [Render Guide](./DEPLOYMENT_GUIDE_RENDER.md) for details

---

### Fly.io

1. Copy template:
   ```bash
   cp deployment-templates/fly.toml.hbs fly.toml
   ```

2. Fill in variables

3. Deploy:
   ```bash
   fly launch
   ```

4. See [Fly.io Guide](./DEPLOYMENT_GUIDE_FLY.md) for details

---

## 📋 Template Variables

All templates use Handlebars syntax (`{{variable}}`). Fill these before deploying:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `serviceName` | Service/app name | `ossa-buildkit` |
| `nodeEnv` | Node environment | `production` |
| `githubRepo` | GitHub repository | `org/repo` |
| `branch` | Git branch | `main` |
| `customDomain` | Custom domain | `api.example.com` |

### Build & Start

| Variable | Description | Example |
|----------|-------------|---------|
| `buildCommand` | Build command | `npm ci && npm run build` |
| `startCommand` | Start command | `npm start` |
| `preDeployCommand` | Pre-deploy command | `npm run migrate` |

### Scaling

| Variable | Description | Default |
|----------|-------------|---------|
| `replicas` | Initial replicas | `1` |
| `minReplicas` | Min instances | `1` |
| `maxReplicas` | Max instances | `5` |
| `autoscalingEnabled` | Enable autoscaling | `true` |
| `targetCpu` | CPU target % | `70` |
| `targetMemory` | Memory target % | `80` |

### Resources

| Variable | Description | Example |
|----------|-------------|---------|
| `memory` | Memory allocation | `2Gi` or `2048` |
| `cpu` | CPU allocation | `1` or `2` |

### Ports

| Variable | Description | Default |
|----------|-------------|---------|
| `port` | Main service port | `8080` |
| `bridgePort` | Bridge server port | `8081` |
| `metricsPort` | Metrics port | `9090` |

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for complete list.

---

## 🔧 Using Templates

### Option 1: Manual Replacement

```bash
# Copy template
cp railway.json.hbs railway.json

# Replace variables manually
# {{serviceName}} → ossa-buildkit
# {{nodeEnv}} → production
# etc.
```

### Option 2: Template Engine (Node.js)

```javascript
const Handlebars = require('handlebars');
const fs = require('fs');

const template = fs.readFileSync('railway.json.hbs', 'utf8');
const compiled = Handlebars.compile(template);

const config = compiled({
  serviceName: 'ossa-buildkit',
  nodeEnv: 'production',
  githubRepo: 'your-org/ossa-buildkit',
  branch: 'main',
  buildCommand: 'npm ci && npm run build',
  startCommand: 'npm start',
  port: 8080,
  replicas: 1,
  minReplicas: 1,
  maxReplicas: 5,
  autoscalingEnabled: true,
  targetCpu: 70,
  targetMemory: 80,
  memory: '2Gi',
  cpu: '1',
  customDomain: 'api.example.com',
  // ... more variables
});

fs.writeFileSync('railway.json', config);
```

### Option 3: Shell Script

```bash
#!/bin/bash
# generate-config.sh

# Variables
SERVICE_NAME="ossa-buildkit"
NODE_ENV="production"
GITHUB_REPO="your-org/ossa-buildkit"
BRANCH="main"

# Generate Railway config
sed -e "s/{{serviceName}}/$SERVICE_NAME/g" \
    -e "s/{{nodeEnv}}/$NODE_ENV/g" \
    -e "s/{{githubRepo}}/$GITHUB_REPO/g" \
    -e "s/{{branch}}/$BRANCH/g" \
    railway.json.hbs > railway.json

echo "Generated railway.json"
```

---

## 🏗️ Architecture

All deployment templates provision:

### Services

1. **Main Application**
   - Node.js web service
   - OSSA agent execution
   - REST API
   - Health checks: `/health`, `/ready`

2. **Bridge Server**
   - Drupal ↔ OSSA communication
   - Agent synchronization
   - Separate service/process

3. **Background Workers** (optional)
   - Async job processing
   - Agent queue consumer

4. **Cron Jobs** (optional)
   - Scheduled tasks
   - Cleanup, sync, maintenance

### Databases

1. **PostgreSQL**
   - Agent metadata
   - Execution history
   - Configuration

2. **Redis**
   - Caching layer
   - Session storage
   - Job queue

3. **Qdrant** (optional)
   - Vector database
   - Agent embeddings
   - Semantic search

---

## 🔐 Security

### Secrets Management

All platforms support secure secret storage:

**Railway:**
```bash
railway variables set JWT_SECRET="secret-value"
```

**Render:**
```bash
render env set JWT_SECRET="secret-value" --secret
```

**Fly.io:**
```bash
fly secrets set JWT_SECRET="secret-value"
```

### Required Secrets

- `JWT_SECRET`: JWT signing key
- `ENCRYPTION_KEY`: Data encryption key
- `DRUPAL_API_KEY`: Drupal authentication
- `QDRANT_API_KEY`: Vector DB authentication
- `BRIDGE_API_KEY`: Bridge server authentication

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md#security--authentication) for details.

---

## 📊 Monitoring

All templates include:

### Health Checks

- **Liveness**: `/health` - Is service alive?
- **Readiness**: `/ready` - Is service ready to serve traffic?

### Metrics

- **Prometheus**: `/metrics` endpoint
- **Platform metrics**: CPU, memory, requests
- **Custom metrics**: Agent executions, queue depth

### Logging

- **Structured logging**: JSON format
- **Log levels**: error, warn, info, debug, trace
- **Platform integration**: Automatic log aggregation

### Error Tracking

- **Sentry integration**: Optional error tracking
- **Stack traces**: Full error context
- **Release tracking**: Version correlation

---

## 🔄 CI/CD Integration

### Auto-Deploy on Push

**Railway:**
```json
{
  "deploy": {
    "autoDeployBranch": "main"
  }
}
```

**Render:**
```yaml
autoDeploy: true
```

**Fly.io:**
```bash
# Via GitHub Actions
fly deploy --remote-only
```

### Pre-Deploy Checks

All templates support pre-deploy commands:

```bash
# Run migrations
preDeployCommand: "npm run migrate"

# Run tests
preDeployCommand: "npm test"

# Database seed
preDeployCommand: "npm run seed"
```

---

## 🧪 Testing Deployments

### Local Testing

Before deploying, test configurations locally:

```bash
# Install dependencies
npm ci

# Build
npm run build

# Set environment variables
export NODE_ENV=production
export PORT=8080
# ... (see .env.example)

# Start
npm start

# Test health
curl http://localhost:8080/health
```

### Staging Environments

All platforms support multiple environments:

**Railway:**
```bash
railway environment create staging
railway deploy --environment staging
```

**Render:**
```yaml
# render.staging.yaml
services:
  - name: ossa-buildkit-staging
    env: staging
```

**Fly.io:**
```bash
fly apps create ossa-buildkit-staging
fly deploy --config fly.staging.toml
```

---

## 🐛 Troubleshooting

### Build Failures

**Issue**: Build fails with "Module not found"

**Solution**:
1. Check `package.json` includes all dependencies
2. Verify `package-lock.json` is committed
3. Clear build cache and retry

See platform-specific guides for details.

### Deployment Failures

**Issue**: Deployment succeeds but service won't start

**Solution**:
1. Check logs: `railway logs`, `render logs`, `fly logs`
2. Verify environment variables are set
3. Check health endpoint returns 200 OK
4. Ensure PORT env var is used

### Performance Issues

**Issue**: Slow response times

**Solution**:
1. Check metrics (CPU, memory)
2. Scale up resources
3. Enable caching
4. Optimize database queries

See platform-specific guides for scaling commands.

---

## 📚 Documentation

### Platform Guides

- [Railway Deployment Guide](./DEPLOYMENT_GUIDE_RAILWAY.md) - Complete Railway setup
- [Render Deployment Guide](./DEPLOYMENT_GUIDE_RENDER.md) - Complete Render setup
- [Fly.io Deployment Guide](./DEPLOYMENT_GUIDE_FLY.md) - Complete Fly.io setup

### Reference

- [Environment Variables](./ENVIRONMENT_VARIABLES.md) - Complete variable reference
- [OSSA Documentation](../DRUPAL_INTEGRATION_INDEX.md) - Platform documentation

### Platform Documentation

- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Fly.io Docs](https://fly.io/docs)

---

## 🆘 Support

### Community

- **Discord**: https://discord.gg/ossa
- **Stack Overflow**: Tag `ossa` and platform name
- **GitHub Issues**: https://github.com/your-org/ossa-buildkit/issues

### Commercial Support

BlueFly.io offers:
- Custom deployment configurations
- Performance optimization
- 24/7 support
- Enterprise SLA

Contact: support@bluefly.io

---

## 🚦 Platform Comparison

| Feature | Railway | Render | Fly.io |
|---------|---------|--------|--------|
| **Pricing** | $5/month+ | $7/month+ | $0.001/hour |
| **Free Tier** | $5 credit/month | 750 hours/month | 3 shared VMs |
| **Regions** | US, EU | US, EU, Asia | Global (30+) |
| **Auto-scaling** | ✅ | ✅ | ✅ |
| **Managed DB** | ✅ | ✅ | ✅ |
| **Redis** | ✅ | ✅ | ✅ (Upstash) |
| **Volumes** | ✅ | ✅ | ✅ |
| **Custom Domains** | ✅ | ✅ | ✅ |
| **SSL** | ✅ Auto | ✅ Auto | ✅ Auto |
| **CI/CD** | ✅ | ✅ | Via GitHub Actions |
| **CLI** | ✅ | ✅ | ✅ |
| **Dockerfile** | ✅ | ✅ | ✅ |
| **Preview Deploys** | ✅ | ✅ | ❌ |
| **Cron Jobs** | ❌ | ✅ | ❌ (use processes) |

### Recommendations

**Choose Railway if:**
- You want the simplest setup
- You need quick preview deployments
- You prefer a modern UI

**Choose Render if:**
- You need cron jobs
- You want built-in background workers
- You prefer YAML configuration

**Choose Fly.io if:**
- You need global edge deployment
- You want maximum control
- You need multi-region with low latency

---

## 🔄 Migration Between Platforms

### Railway → Render

1. Export Railway config:
   ```bash
   railway variables list > vars.txt
   ```

2. Generate Render config:
   ```bash
   cp render.yaml.hbs render.yaml
   # Fill in variables from vars.txt
   ```

3. Deploy to Render

### Render → Fly.io

1. Export Render config from dashboard

2. Generate Fly config:
   ```bash
   cp fly.toml.hbs fly.toml
   # Fill in variables
   ```

3. Set secrets:
   ```bash
   fly secrets set $(cat vars.txt)
   ```

4. Deploy:
   ```bash
   fly deploy
   ```

---

## 📝 License

These deployment templates are licensed under MIT License.

---

## 🙏 Acknowledgments

- **Railway**: For excellent developer experience
- **Render**: For comprehensive platform features
- **Fly.io**: For global edge deployment capabilities

---

**Last Updated**: 2026-02-04
**OSSA Version**: v0.4.1
**Templates Version**: v1.0.0
