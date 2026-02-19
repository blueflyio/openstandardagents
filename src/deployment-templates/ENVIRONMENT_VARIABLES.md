# Environment Variables Reference - OSSA Buildkit

Complete reference for all environment variables used in OSSA Buildkit deployment across Railway, Render, and Fly.io platforms.

---

## Table of Contents

1. [Core Configuration](#core-configuration)
2. [Security & Authentication](#security--authentication)
3. [Database Configuration](#database-configuration)
4. [Cache Configuration](#cache-configuration)
5. [Vector Database](#vector-database)
6. [Agent Configuration](#agent-configuration)
7. [API & Networking](#api--networking)
8. [Monitoring & Logging](#monitoring--logging)
9. [Bridge Server Configuration](#bridge-server-configuration)
10. [Platform-Specific Variables](#platform-specific-variables)
11. [Optional Features](#optional-features)
12. [Validation & Defaults](#validation--defaults)

---

## Core Configuration

### NODE_ENV

**Type**: String
**Required**: Yes
**Default**: `production`
**Allowed Values**: `production`, `staging`, `development`, `test`
**Description**: Node.js environment mode

**Examples**:
```bash
# Production
NODE_ENV=production

# Staging
NODE_ENV=staging

# Development
NODE_ENV=development
```

**Platform Notes**:
- **Railway**: Set in `railway.json` → `environments`
- **Render**: Set in `render.yaml` → `envVars`
- **Fly.io**: Set in `fly.toml` → `[env]`

---

### PORT

**Type**: Integer
**Required**: Yes
**Default**: `8080`
**Range**: `1024-65535`
**Description**: HTTP server port

**Examples**:
```bash
PORT=8080  # Default
PORT=3000  # Alternative
```

**Platform Notes**:
- **Railway**: Auto-injected, but can override
- **Render**: Uses Render's assigned PORT (do not override)
- **Fly.io**: Set in `fly.toml`, matches `internal_port`

**Important**: Your application MUST listen on `process.env.PORT`:

```javascript
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```

---

### LOG_LEVEL

**Type**: String
**Required**: No
**Default**: `info`
**Allowed Values**: `error`, `warn`, `info`, `debug`, `trace`
**Description**: Logging verbosity level

**Examples**:
```bash
LOG_LEVEL=error  # Production (errors only)
LOG_LEVEL=info   # Production (normal)
LOG_LEVEL=debug  # Staging/Development
LOG_LEVEL=trace  # Deep debugging
```

**Impact**:
- `error`: Only log errors
- `warn`: Errors + warnings
- `info`: Normal operational logs
- `debug`: Detailed debugging info
- `trace`: Everything including trace data

---

## Security & Authentication

### JWT_SECRET

**Type**: String (Base64)
**Required**: Yes
**Secret**: Yes
**Minimum Length**: 32 characters
**Description**: Secret key for signing JWT tokens

**Generation**:
```bash
# Linux/macOS
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Examples**:
```bash
JWT_SECRET="xK9mPqR8sT2vYnZ5cF7hJ3kL6nQ1wE4r"
```

**Security Notes**:
- NEVER commit to version control
- Rotate periodically (recommended: every 90 days)
- Use different secrets for each environment
- Store in platform secret manager

**Platform Commands**:
```bash
# Railway
railway variables set JWT_SECRET="$(openssl rand -base64 32)"

# Render (dashboard or CLI)
render env set JWT_SECRET="$(openssl rand -base64 32)" --secret

# Fly.io
fly secrets set JWT_SECRET="$(openssl rand -base64 32)"
```

---

### ENCRYPTION_KEY

**Type**: String (Base64)
**Required**: Yes
**Secret**: Yes
**Minimum Length**: 32 characters
**Description**: Key for encrypting sensitive data at rest

**Generation**:
```bash
openssl rand -base64 32
```

**Examples**:
```bash
ENCRYPTION_KEY="aB3dE6fG9hI2jK5lM8nO1pQ4rS7tU0vW"
```

**Security Notes**:
- Used for encrypting agent credentials, API keys, etc.
- CRITICAL: Loss of this key = data loss
- Backup securely before rotation
- Never share between environments

---

### DRUPAL_API_KEY

**Type**: String
**Required**: Yes (if using Drupal integration)
**Secret**: Yes
**Description**: API key for authenticating with Drupal

**Generation** (in Drupal):
```php
// Drupal admin UI
// Configuration > Web Services > API Keys > Generate New Key

// Or programmatically
$api_key = \Drupal::service('ai_agents_ossa.key_generator')->generate();
```

**Examples**:
```bash
DRUPAL_API_KEY="drupal-api-key-a1b2c3d4e5f6"
```

**Usage**:
```javascript
// In requests to Drupal
headers: {
  'X-API-Key': process.env.DRUPAL_API_KEY
}
```

---

### BRIDGE_API_KEY

**Type**: String
**Required**: Yes (if using Bridge Server)
**Secret**: Yes
**Description**: API key for authenticating bridge server requests

**Generation**:
```bash
openssl rand -hex 32
```

**Examples**:
```bash
BRIDGE_API_KEY="bridge-key-1a2b3c4d5e6f7g8h"
```

---

### ALLOWED_ORIGINS

**Type**: String (comma-separated URLs)
**Required**: Yes
**Description**: CORS allowed origins

**Examples**:
```bash
# Single origin
ALLOWED_ORIGINS="https://app.example.com"

# Multiple origins
ALLOWED_ORIGINS="https://app.example.com,https://admin.example.com,https://drupal.example.com"

# Wildcard (NOT RECOMMENDED for production)
ALLOWED_ORIGINS="*"
```

**Security Notes**:
- NEVER use `*` in production
- Include protocol (https://)
- No trailing slashes
- Separate with commas (no spaces)

---

## Database Configuration

### DATABASE_URL

**Type**: Connection String
**Required**: Yes
**Secret**: Yes
**Format**: `postgresql://user:password@host:port/database`
**Description**: PostgreSQL connection string

**Examples**:
```bash
# Standard format
DATABASE_URL="postgresql://ossa_user:password@localhost:5432/ossa_db"

# With SSL
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Railway (auto-injected)
DATABASE_URL="postgresql://postgres:***@monorail.proxy.rlwy.net:12345/railway"

# Render (auto-injected)
DATABASE_URL="postgres://user:pass@dpg-abc123.oregon-postgres.render.com/db"

# Fly.io (auto-injected)
DATABASE_URL="postgres://postgres:pass@top2.nearest.of.ossa-db.internal:5432/ossa"
```

**Platform Notes**:
- **Railway**: Auto-injected when PostgreSQL plugin added
- **Render**: Auto-injected via `fromDatabase` in render.yaml
- **Fly.io**: Auto-injected when Postgres attached

**Connection Pool Configuration**:
```javascript
// In your app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // Close idle after 30s
  connectionTimeoutMillis: 2000, // Connect timeout
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

---

### POSTGRES_MAX_CONNECTIONS

**Type**: Integer
**Required**: No
**Default**: Platform-dependent
**Range**: `10-500`
**Description**: Maximum database connections

**Examples**:
```bash
POSTGRES_MAX_CONNECTIONS=100  # Production
POSTGRES_MAX_CONNECTIONS=20   # Development
```

**Calculation**:
```
Max Connections = (Number of App Instances × Connection Pool Size) + Buffer

Example:
- 5 app instances
- 20 connections per pool
- 20 buffer for admin/maintenance
= 5 × 20 + 20 = 120 connections
```

---

### POSTGRES_SHARED_BUFFERS

**Type**: String
**Required**: No
**Default**: `128MB`
**Format**: Number + Unit (KB/MB/GB)
**Description**: PostgreSQL shared memory buffer

**Examples**:
```bash
POSTGRES_SHARED_BUFFERS=256MB  # Small DB
POSTGRES_SHARED_BUFFERS=1GB    # Medium DB
POSTGRES_SHARED_BUFFERS=4GB    # Large DB
```

**Guidelines**:
- Set to 25% of available RAM
- Minimum: 128MB
- Maximum: 8GB (unless very large DB)

---

## Cache Configuration

### REDIS_URL

**Type**: Connection String
**Required**: Yes
**Secret**: Yes
**Format**: `redis://user:password@host:port`
**Description**: Redis connection string

**Examples**:
```bash
# Standard
REDIS_URL="redis://localhost:6379"

# With password
REDIS_URL="redis://:password@host:6379"

# Redis Sentinel
REDIS_URL="redis-sentinel://host1:26379,host2:26379/mymaster"

# Railway (auto-injected)
REDIS_URL="redis://default:***@redis.railway.internal:6379"

# Render (auto-injected)
REDIS_URL="redis://red-abc123:6379"

# Fly.io Upstash (auto-injected)
REDIS_URL="rediss://:pass@fly-ossa-redis.upstash.io:6379"
```

**TLS**:
```bash
# Use rediss:// for TLS
REDIS_URL="rediss://:password@host:6380"
```

---

### CACHE_TTL_SECONDS

**Type**: Integer
**Required**: No
**Default**: `300` (5 minutes)
**Range**: `0-86400` (0 = no cache, 86400 = 1 day)
**Description**: Default cache TTL

**Examples**:
```bash
CACHE_TTL_SECONDS=300   # 5 minutes (default)
CACHE_TTL_SECONDS=3600  # 1 hour
CACHE_TTL_SECONDS=86400 # 1 day
CACHE_TTL_SECONDS=0     # Disable caching
```

**Usage**:
```javascript
await cache.set('key', value, process.env.CACHE_TTL_SECONDS);
```

---

## Vector Database

### QDRANT_URL

**Type**: URL
**Required**: Yes (if using vector search)
**Format**: `http(s)://host:port`
**Description**: Qdrant vector database URL

**Examples**:
```bash
# HTTP
QDRANT_URL="http://localhost:6333"

# HTTPS
QDRANT_URL="https://qdrant.example.com"

# Railway
QDRANT_URL="https://ossa-qdrant.railway.app"

# Render
QDRANT_URL="https://qdrant.onrender.com"

# Fly.io (internal)
QDRANT_URL="http://ossa-qdrant.internal:6333"
```

**Health Check**:
```bash
curl $QDRANT_URL/health
```

---

### QDRANT_API_KEY

**Type**: String
**Required**: Yes (if Qdrant auth enabled)
**Secret**: Yes
**Description**: Qdrant authentication key

**Examples**:
```bash
QDRANT_API_KEY="qdrant-api-key-xyz123"
```

**Configuration** (in Qdrant):
```yaml
# qdrant/config.yaml
service:
  api_key: "qdrant-api-key-xyz123"
```

---

### VECTOR_DB_COLLECTION

**Type**: String
**Required**: No
**Default**: `ossa_agents`
**Description**: Qdrant collection name for agent embeddings

**Examples**:
```bash
VECTOR_DB_COLLECTION="ossa_agents"           # Default
VECTOR_DB_COLLECTION="ossa_agents_prod"      # Production
VECTOR_DB_COLLECTION="ossa_agents_staging"   # Staging
```

---

## Agent Configuration

### MAX_CONCURRENT_AGENTS

**Type**: Integer
**Required**: No
**Default**: `10`
**Range**: `1-100`
**Description**: Maximum concurrent agent executions

**Examples**:
```bash
MAX_CONCURRENT_AGENTS=5   # Low capacity
MAX_CONCURRENT_AGENTS=10  # Default
MAX_CONCURRENT_AGENTS=50  # High capacity
```

**Guidelines**:
- Consider available CPU cores
- Monitor memory usage
- Adjust based on agent complexity

**Formula**:
```
Max Concurrent = (CPU Cores × 2) - 2

Example:
- 4 CPU cores
- (4 × 2) - 2 = 6 concurrent agents
```

---

### AGENT_TIMEOUT_MS

**Type**: Integer (milliseconds)
**Required**: No
**Default**: `300000` (5 minutes)
**Range**: `1000-3600000` (1 second to 1 hour)
**Description**: Maximum agent execution time

**Examples**:
```bash
AGENT_TIMEOUT_MS=60000    # 1 minute
AGENT_TIMEOUT_MS=300000   # 5 minutes (default)
AGENT_TIMEOUT_MS=600000   # 10 minutes
AGENT_TIMEOUT_MS=1800000  # 30 minutes
```

**Notes**:
- Agents exceeding timeout are forcefully terminated
- Set based on longest expected agent runtime
- Consider platform request timeouts

---

### AGENT_REGISTRY_URL

**Type**: URL
**Required**: Yes
**Format**: `https://host/path`
**Description**: URL to OSSA agent registry

**Examples**:
```bash
AGENT_REGISTRY_URL="https://registry.ossa.ai"
AGENT_REGISTRY_URL="https://registry.your-domain.com"
AGENT_REGISTRY_URL="http://localhost:3000"  # Development
```

---

## API & Networking

### API_BASE_URL

**Type**: URL
**Required**: Yes
**Format**: `https://host`
**Description**: Base URL for API service (used for generating links)

**Examples**:
```bash
# Railway
API_BASE_URL="https://ossa-buildkit.railway.app"

# Render
API_BASE_URL="https://ossa-buildkit.onrender.com"

# Fly.io
API_BASE_URL="https://ossa-buildkit.fly.dev"

# Custom domain
API_BASE_URL="https://api.your-domain.com"
```

**Usage**:
```javascript
const webhookUrl = `${process.env.API_BASE_URL}/webhooks/agent-complete`;
```

---

### DRUPAL_BASE_URL

**Type**: URL
**Required**: Yes (if using Drupal)
**Format**: `https://host`
**Description**: Drupal site base URL

**Examples**:
```bash
DRUPAL_BASE_URL="https://drupal.example.com"
DRUPAL_BASE_URL="https://cms.your-site.com"
```

---

### RATE_LIMIT_WINDOW

**Type**: Integer (milliseconds)
**Required**: No
**Default**: `60000` (1 minute)
**Description**: Rate limit time window

**Examples**:
```bash
RATE_LIMIT_WINDOW=60000   # 1 minute
RATE_LIMIT_WINDOW=300000  # 5 minutes
RATE_LIMIT_WINDOW=3600000 # 1 hour
```

---

### RATE_LIMIT_MAX

**Type**: Integer
**Required**: No
**Default**: `100`
**Range**: `1-10000`
**Description**: Maximum requests per time window

**Examples**:
```bash
RATE_LIMIT_MAX=10   # Strict (10 req/min)
RATE_LIMIT_MAX=100  # Default (100 req/min)
RATE_LIMIT_MAX=1000 # Permissive (1000 req/min)
```

**Rate Limit Configuration**:
```javascript
// In your app
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW),
  max: parseInt(process.env.RATE_LIMIT_MAX),
  message: 'Too many requests'
});
```

---

## Monitoring & Logging

### ENABLE_METRICS

**Type**: Boolean
**Required**: No
**Default**: `true`
**Allowed Values**: `true`, `false`
**Description**: Enable Prometheus metrics endpoint

**Examples**:
```bash
ENABLE_METRICS=true   # Enable (default)
ENABLE_METRICS=false  # Disable
```

**Metrics Endpoint**:
```
GET /metrics
```

---

### METRICS_PORT

**Type**: Integer
**Required**: No
**Default**: `9090`
**Range**: `1024-65535`
**Description**: Port for metrics endpoint

**Examples**:
```bash
METRICS_PORT=9090  # Default
METRICS_PORT=9091  # Alternative
```

---

### SENTRY_DSN

**Type**: String (URL)
**Required**: No (recommended for production)
**Secret**: Yes
**Format**: `https://key@sentry.io/project`
**Description**: Sentry error tracking DSN

**Examples**:
```bash
SENTRY_DSN="https://abc123@o123456.ingest.sentry.io/456789"
```

**Setup**:
1. Create Sentry project
2. Copy DSN from project settings
3. Set environment variable

---

### SENTRY_ENVIRONMENT

**Type**: String
**Required**: No
**Default**: Value of `NODE_ENV`
**Description**: Environment name for Sentry

**Examples**:
```bash
SENTRY_ENVIRONMENT=production
SENTRY_ENVIRONMENT=staging
SENTRY_ENVIRONMENT=development
```

---

### ENABLE_DEBUG

**Type**: Boolean
**Required**: No
**Default**: `false`
**Allowed Values**: `true`, `false`
**Description**: Enable debug mode (verbose logging, stack traces)

**Examples**:
```bash
ENABLE_DEBUG=false  # Production
ENABLE_DEBUG=true   # Development/Debugging
```

**Warning**: Never enable in production (performance impact, security risk)

---

## Bridge Server Configuration

### BRIDGE_PORT

**Type**: Integer
**Required**: No
**Default**: `8081`
**Range**: `1024-65535`
**Description**: Bridge server HTTP port

**Examples**:
```bash
BRIDGE_PORT=8081  # Default
BRIDGE_PORT=8082  # Alternative
```

---

### ENABLE_CORS

**Type**: Boolean
**Required**: No
**Default**: `true`
**Description**: Enable CORS on bridge server

**Examples**:
```bash
ENABLE_CORS=true   # Enable (default)
ENABLE_CORS=false  # Disable
```

---

### CORS_ORIGINS

**Type**: String (comma-separated)
**Required**: No
**Default**: Value of `ALLOWED_ORIGINS`
**Description**: CORS allowed origins for bridge server

**Examples**:
```bash
CORS_ORIGINS="https://drupal.example.com,https://admin.example.com"
```

---

### MAX_PAYLOAD_SIZE

**Type**: String
**Required**: No
**Default**: `10mb`
**Format**: Number + Unit (kb/mb/gb)
**Description**: Maximum request payload size

**Examples**:
```bash
MAX_PAYLOAD_SIZE=1mb   # Small
MAX_PAYLOAD_SIZE=10mb  # Default
MAX_PAYLOAD_SIZE=50mb  # Large
```

---

### REQUEST_TIMEOUT_MS

**Type**: Integer (milliseconds)
**Required**: No
**Default**: `30000` (30 seconds)
**Range**: `1000-300000`
**Description**: Bridge server request timeout

**Examples**:
```bash
REQUEST_TIMEOUT_MS=30000   # 30 seconds (default)
REQUEST_TIMEOUT_MS=60000   # 1 minute
REQUEST_TIMEOUT_MS=120000  # 2 minutes
```

---

## Platform-Specific Variables

### Railway

**Auto-injected**:
- `RAILWAY_ENVIRONMENT`: Current environment
- `RAILWAY_DEPLOYMENT_ID`: Deployment ID
- `RAILWAY_SERVICE_NAME`: Service name
- `RAILWAY_PROJECT_ID`: Project ID

**Usage**:
```javascript
console.log(`Deployed to Railway: ${process.env.RAILWAY_SERVICE_NAME}`);
```

---

### Render

**Auto-injected**:
- `RENDER`: Always `true`
- `RENDER_SERVICE_NAME`: Service name
- `RENDER_SERVICE_ID`: Service ID
- `RENDER_INSTANCE_ID`: Instance ID
- `RENDER_GIT_COMMIT`: Git commit SHA
- `RENDER_GIT_BRANCH`: Git branch
- `RENDER_EXTERNAL_URL`: External URL

**Usage**:
```javascript
console.log(`Deployed to Render: ${process.env.RENDER_EXTERNAL_URL}`);
```

---

### Fly.io

**Auto-injected**:
- `FLY_APP_NAME`: App name
- `FLY_REGION`: Current region
- `FLY_MACHINE_ID`: Machine ID
- `FLY_PUBLIC_IP`: Public IP
- `FLY_PRIVATE_IP`: Private IP

**Usage**:
```javascript
console.log(`Running on Fly.io in region: ${process.env.FLY_REGION}`);
```

---

## Optional Features

### Worker Configuration

**WORKER_CONCURRENCY**
```bash
WORKER_CONCURRENCY=5  # Number of concurrent jobs
```

**WORKER_POLL_INTERVAL_MS**
```bash
WORKER_POLL_INTERVAL_MS=1000  # Poll every second
```

---

### Cron Job Configuration

**CLEANUP_RETENTION_DAYS**
```bash
CLEANUP_RETENTION_DAYS=30  # Keep data for 30 days
```

**CLEANUP_CRON_SCHEDULE**
```bash
CLEANUP_CRON_SCHEDULE="0 2 * * *"  # Daily at 2 AM
```

**SYNC_CRON_SCHEDULE**
```bash
SYNC_CRON_SCHEDULE="0 * * * *"  # Every hour
```

**SYNC_BATCH_SIZE**
```bash
SYNC_BATCH_SIZE=100  # Process 100 agents per batch
```

---

## Validation & Defaults

### Environment Variable Validation

Implement validation on startup:

```javascript
// config/validator.js
const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('production', 'staging', 'development', 'test').default('production'),
  PORT: Joi.number().integer().min(1024).max(65535).default(8080),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'trace').default('info'),

  // Required
  API_BASE_URL: Joi.string().uri().required(),
  DATABASE_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  ENCRYPTION_KEY: Joi.string().min(32).required(),

  // Optional with defaults
  MAX_CONCURRENT_AGENTS: Joi.number().integer().min(1).max(100).default(10),
  AGENT_TIMEOUT_MS: Joi.number().integer().min(1000).max(3600000).default(300000),
  CACHE_TTL_SECONDS: Joi.number().integer().min(0).max(86400).default(300),

  // Conditional
  DRUPAL_BASE_URL: Joi.string().uri().when('DRUPAL_API_KEY', { is: Joi.exist(), then: Joi.required() }),
  DRUPAL_API_KEY: Joi.string(),

  QDRANT_URL: Joi.string().uri().when('QDRANT_API_KEY', { is: Joi.exist(), then: Joi.required() }),
  QDRANT_API_KEY: Joi.string()
}).unknown();

const { error, value } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

module.exports = value;
```

---

### Default Values Reference

```javascript
// config/defaults.js
module.exports = {
  NODE_ENV: 'production',
  PORT: 8080,
  LOG_LEVEL: 'info',

  // Rate limiting
  RATE_LIMIT_WINDOW: 60000,
  RATE_LIMIT_MAX: 100,

  // Agent configuration
  MAX_CONCURRENT_AGENTS: 10,
  AGENT_TIMEOUT_MS: 300000,
  VECTOR_DB_COLLECTION: 'ossa_agents',

  // Caching
  CACHE_TTL_SECONDS: 300,

  // Monitoring
  ENABLE_METRICS: true,
  METRICS_PORT: 9090,
  ENABLE_DEBUG: false,

  // Bridge server
  BRIDGE_PORT: 8081,
  ENABLE_CORS: true,
  MAX_PAYLOAD_SIZE: '10mb',
  REQUEST_TIMEOUT_MS: 30000,

  // Database
  POSTGRES_MAX_CONNECTIONS: 100,
  POSTGRES_SHARED_BUFFERS: '256MB',

  // Redis
  REDIS_MAX_MEMORY: '512mb',
  REDIS_MAX_MEMORY_POLICY: 'allkeys-lru',

  // Worker
  WORKER_CONCURRENCY: 5,
  WORKER_POLL_INTERVAL_MS: 1000,

  // Cleanup
  CLEANUP_RETENTION_DAYS: 30
};
```

---

## Environment Files

### .env.example

Create `.env.example` in your repository:

```bash
# Core Configuration
NODE_ENV=production
PORT=8080
LOG_LEVEL=info

# API URLs
API_BASE_URL=https://your-api.example.com
DRUPAL_BASE_URL=https://your-drupal.example.com
AGENT_REGISTRY_URL=https://registry.example.com

# Security (CHANGE THESE!)
JWT_SECRET=CHANGE_ME_32_CHARS_MINIMUM
ENCRYPTION_KEY=CHANGE_ME_32_CHARS_MINIMUM
DRUPAL_API_KEY=CHANGE_ME
BRIDGE_API_KEY=CHANGE_ME

# Database (auto-injected by platforms)
DATABASE_URL=postgresql://user:password@localhost:5432/ossa
REDIS_URL=redis://localhost:6379

# Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=CHANGE_ME

# CORS
ALLOWED_ORIGINS=https://example.com
CORS_ORIGINS=https://example.com

# Agent Configuration
MAX_CONCURRENT_AGENTS=10
AGENT_TIMEOUT_MS=300000
VECTOR_DB_COLLECTION=ossa_agents

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
ENABLE_DEBUG=false

# Bridge Server
BRIDGE_PORT=8081
ENABLE_CORS=true
MAX_PAYLOAD_SIZE=10mb
REQUEST_TIMEOUT_MS=30000
```

---

## Security Best Practices

### 1. Never Commit Secrets

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
```

### 2. Rotate Secrets Regularly

```bash
# Generate new secrets
NEW_JWT_SECRET=$(openssl rand -base64 32)
NEW_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Update in platform
railway variables set JWT_SECRET="$NEW_JWT_SECRET"
railway variables set ENCRYPTION_KEY="$NEW_ENCRYPTION_KEY"
```

### 3. Use Environment-Specific Secrets

```bash
# Development
JWT_SECRET=dev-secret-do-not-use-in-prod

# Staging
JWT_SECRET=staging-secret-different-from-prod

# Production
JWT_SECRET=prod-secret-rotate-every-90-days
```

### 4. Audit Environment Variables

```bash
# Railway
railway variables list

# Render
render env list

# Fly.io
fly secrets list
```

---

## Troubleshooting

### Missing Required Variables

**Error**: "Missing required environment variable: DATABASE_URL"

**Solution**:
```bash
# Check if variable is set
railway variables list | grep DATABASE_URL

# Set if missing
railway variables set DATABASE_URL="postgresql://..."
```

### Invalid Variable Format

**Error**: "Invalid PORT: must be integer between 1024-65535"

**Solution**:
```bash
# Check current value
railway variables get PORT

# Fix
railway variables set PORT=8080
```

### Secret Not Updating

**Issue**: Changed secret but app still uses old value

**Solution**:
```bash
# Secrets require restart
railway restart

# Or redeploy
railway up --force
```

---

## Support

For issues with environment variables:

1. Check platform-specific guides:
   - [Railway Guide](./DEPLOYMENT_GUIDE_RAILWAY.md)
   - [Render Guide](./DEPLOYMENT_GUIDE_RENDER.md)
   - [Fly.io Guide](./DEPLOYMENT_GUIDE_FLY.md)

2. Validate configuration:
   ```bash
   npm run validate:config
   ```

3. Contact support:
   - BlueFly.io: support@bluefly.io
   - Platform support: See respective guides

---

**Last Updated**: 2026-02-04
**OSSA Version**: v0.4.1
