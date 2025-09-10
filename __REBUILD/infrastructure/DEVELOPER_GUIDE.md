# OSSA Platform Developer Guide

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Environment Setup](#environment-setup)
- [Service Architecture](#service-architecture)
- [Development Workflow](#development-workflow)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)

## Architecture Overview

### System Components

```mermaid
graph TB
    subgraph "Development Layer"
        AB[Agent BuildKit :3000]
        SQ[SonarQube :19000]
        ABD[(BuildKit DB :15432)]
        ABR[(BuildKit Redis :16379)]
    end
    
    subgraph "OSSA Runtime Layer"
        GW[Gateway :3100]
        K8S[K8s Services]
        ISO[Isolated Services]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL :5433)]
        RD[(Redis :6382)]
        QD[(Qdrant :6335)]
    end
    
    AB --> ABD
    AB --> ABR
    GW --> PG
    GW --> RD
    GW --> QD
    K8S --> ISO
```

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Node.js | 20+ | ES module support |
| Language | TypeScript | 5.3.3 | Type safety |
| Container | Docker | 24+ | Service isolation |
| Orchestration | Kubernetes | 1.32.6 | Production deployment |
| Vector DB | Qdrant | 1.7.0 | Semantic search |
| Cache | Redis | 7 | Session/data caching |
| Database | PostgreSQL | 15 | Persistent storage |
| Monitoring | Grafana | 12.1.1 | Metrics visualization |
| Metrics | Prometheus | Latest | Time-series data |

## Environment Setup

### Prerequisites

```bash
# Required tools
node --version  # >= 18.0.0
docker --version  # >= 24.0.0
kubectl version  # >= 1.32.0

# Optional but recommended
brew install redis
brew install postgresql@15
brew install curl jq
```

### Repository Structure

```
/Users/flux423/Sites/LLM/
├── OSSA/
│   └── __REBUILD/                 # OSSA Platform runtime
│       ├── src/                    # TypeScript source
│       ├── infrastructure/         # Deployment configs
│       │   └── docker/            # Docker compositions
│       ├── tests/                 # Test suites
│       └── package.json           # Dependencies
│
└── agent_buildkit/                # Development tools
    ├── src/                       # BuildKit source
    └── infrastructure/            # BuildKit stack
        └── agent-buildkit-stack.yml
```

### Initial Setup

```bash
# 1. Clone repositories
git clone <ossa-repo> /Users/flux423/Sites/LLM/OSSA/__REBUILD
git clone <buildkit-repo> /Users/flux423/Sites/LLM/agent_buildkit

# 2. Install dependencies
cd /Users/flux423/Sites/LLM/OSSA/__REBUILD
npm install
npm install commander  # Required CLI dependency

# 3. Create type definitions (if missing)
mkdir -p src/types/{agents,workflows,policies}
# Copy type definitions from this guide

# 4. Start services
cd infrastructure/docker
docker-compose -f docker-compose.orbstack.yml up -d
```

## Service Architecture

### Port Allocation Strategy

```yaml
# Development Tools (3000-3999)
agent-buildkit:         3000
ossa-gateway-isolated:  3100  # Avoids conflict

# Databases (5000-5999)
postgres-k8s:          5432
postgres-isolated:     5433
buildkit-postgres:     15432

# Cache/Message Queue (6000-6999)
redis-k8s:             6379
redis-isolated:        6382
qdrant-k8s:            6333
qdrant-isolated:       6335-6336
buildkit-redis:        16379
buildkit-qdrant:       16333-16334

# Monitoring (9000-9999)
prometheus:            9090-9091
grafana:              3080  # Exception for UI
sonarqube:            19000
```

### Network Configuration

```yaml
# Isolated networks prevent service conflicts
networks:
  ossa-network:        172.30.0.0/16  # Standard OSSA
  ossa-isolated:       172.31.0.0/16  # Isolated OSSA
  buildkit-network:    172.28.0.0/16  # Agent BuildKit
```

### Service Dependencies

```typescript
// Service initialization order
const STARTUP_SEQUENCE = [
  'databases',     // PostgreSQL, Redis, Qdrant
  'cache',         // Redis instances
  'vectordb',      // Qdrant instances
  'gateway',       // API gateways
  'agents',        // Agent services
  'monitoring'     // Grafana, Prometheus
];
```

## Development Workflow

### Starting Services

```bash
# Option 1: Full Stack (Recommended)
# Start Agent BuildKit (development tools)
cd /Users/flux423/Sites/LLM/agent_buildkit/infrastructure
docker-compose -f agent-buildkit-stack.yml up -d

# Start OSSA isolated services
cd /Users/flux423/Sites/LLM/OSSA/__REBUILD/infrastructure/docker
docker-compose -f docker-compose.orbstack.yml up -d

# Option 2: Selective Services
# Just databases
docker-compose -f docker-compose.orbstack.yml up -d redis postgres qdrant

# Just gateway (after databases)
docker-compose -f docker-compose.orbstack.yml up -d ossa-gateway
```

### Health Checks

```bash
#!/bin/bash
# health-check.sh - Comprehensive service health verification

echo "🔍 Checking Service Health..."

# Agent BuildKit
curl -s http://localhost:3000/health | jq '.' || echo "❌ BuildKit down"

# OSSA K8s Services
curl -s http://192.168.139.2:3000/api/health | jq '.' || echo "❌ Grafana down"

# Isolated Services
redis-cli -p 6382 ping || echo "❌ Redis isolated down"
pg_isready -h localhost -p 5433 || echo "❌ PostgreSQL isolated down"

# Port availability
for port in 3000 3100 5433 6382 6335; do
  nc -z localhost $port && echo "✅ Port $port open" || echo "❌ Port $port closed"
done
```

### Database Access

```bash
# PostgreSQL connections
# OSSA isolated
PGPASSWORD=ossa_isolated_password psql \
  -h localhost -p 5433 -U ossa -d ossa_isolated

# BuildKit
PGPASSWORD=buildkit_secure_2024 psql \
  -h localhost -p 15432 -U buildkit_admin -d buildkit_agents

# Redis connections
# OSSA isolated
redis-cli -p 6382

# BuildKit (with auth)
redis-cli -p 16379 -a buildkit_redis_2024

# Qdrant REST API
# OSSA isolated
curl http://localhost:6335/collections

# BuildKit
curl -H "api-key: buildkit_qdrant_2024" http://localhost:16333/collections
```

## API Reference

### OSSA Gateway Endpoints

```typescript
// Base URL: http://localhost:3100

// Health check
GET /health
Response: {
  status: "healthy",
  version: "0.1.9-alpha.1",
  services: {
    postgres: "connected",
    redis: "connected",
    qdrant: "connected"
  }
}

// Agent registration
POST /api/v1/agents
Body: {
  name: string,
  type: "orchestrator" | "worker" | "monitor",
  capabilities: string[],
  endpoint: string
}

// Orchestration
POST /api/v1/orchestrate
Body: {
  workflow: string,
  agents: string[],
  parameters: Record<string, any>
}

// Metrics
GET /api/v1/metrics
Response: Prometheus-format metrics
```

### Agent BuildKit Endpoints

```typescript
// Base URL: http://localhost:3000

// Development tools API
GET /api/v1/agents
GET /api/v1/agents/:id
POST /api/v1/agents/spawn
DELETE /api/v1/agents/:id

// Testing endpoints
POST /api/v1/test/run
GET /api/v1/test/coverage
POST /api/v1/test/validate
```

### WebSocket Connections

```javascript
// Real-time agent communication
const ws = new WebSocket('ws://localhost:3100/ws');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'agent-events'
  }));
});

ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log('Agent event:', event);
});
```

## Troubleshooting

### Common Issues and Solutions

#### TypeScript Build Errors

```bash
# Issue: ERR_MODULE_NOT_FOUND
# Solution: Add .js extensions to imports
sed -i '' "s/from '\.\//from '.\//" src/**/*.ts
sed -i '' "s/';$/.js';/" src/**/*.ts

# Issue: Missing type definitions
# Solution: Create stub types
cat > src/types/agents/index.ts << 'EOF'
export interface Agent {
  id: string;
  name: string;
  type: string;
}
EOF
```

#### Port Conflicts

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 $(lsof -t -i:3000)

# Or use different port
SERVICE_PORT=3100 npm run platform:start
```

#### Docker Issues

```bash
# Clean restart
docker-compose down -v
docker system prune -f
docker-compose up -d

# Check logs
docker-compose logs -f service-name

# Inspect container
docker exec -it container-name sh
```

#### Database Connection Issues

```sql
-- Check PostgreSQL connections
SELECT pid, usename, application_name, client_addr, state 
FROM pg_stat_activity;

-- Kill stuck connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND state_change < NOW() - INTERVAL '1 hour';
```

```bash
# Redis connection issues
redis-cli -p 6382
> CONFIG GET maxclients
> CLIENT LIST
> CONFIG SET maxclients 10000
```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=ossa:*
export NODE_ENV=development
export LOG_LEVEL=debug

# TypeScript debugging
npx tsx --inspect src/index.ts

# Docker debugging
docker-compose -f docker-compose.orbstack.yml config
docker-compose -f docker-compose.orbstack.yml logs -f --tail=100
```

## Performance Optimization

### Resource Limits

```yaml
# docker-compose.orbstack.yml optimizations
services:
  ossa-gateway:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Connection Pooling

```typescript
// PostgreSQL connection pool
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'ossa_isolated',
  user: 'ossa',
  password: 'ossa_isolated_password',
  max: 20,                  // Maximum connections
  idleTimeoutMillis: 30000, // Close idle connections
  connectionTimeoutMillis: 2000,
});
```

### Redis Optimization

```javascript
// Redis client with connection pooling
import Redis from 'ioredis';

const redis = new Redis({
  port: 6382,
  host: 'localhost',
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});
```

### Monitoring Performance

```bash
# Container stats
docker stats --no-stream

# PostgreSQL performance
psql -c "SELECT * FROM pg_stat_database WHERE datname = 'ossa_isolated'"

# Redis performance
redis-cli -p 6382 INFO stats

# Network performance
docker network inspect docker_ossa-isolated-network
```

## Advanced Configuration

### Environment Variables

```bash
# .env file for OSSA
NODE_ENV=development
SERVICE_PORT=3100
REDIS_URL=redis://localhost:6382
POSTGRES_URL=postgresql://ossa:ossa_isolated_password@localhost:5433/ossa_isolated
QDRANT_URL=http://localhost:6335
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
API_RATE_LIMIT=1000
```

### Security Configuration

```typescript
// Secure headers middleware
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Load Balancing

```nginx
# nginx.conf for production
upstream ossa_backend {
    least_conn;
    server localhost:3100 weight=3;
    server localhost:3101 weight=2;
    server localhost:3102 weight=1;
}

server {
    listen 80;
    server_name ossa.local;
    
    location / {
        proxy_pass http://ossa_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Development Best Practices

### Code Organization

```typescript
// Follow clean architecture principles
src/
├── domain/         // Business logic (no dependencies)
├── application/    // Use cases and services
├── infrastructure/ // External services, DB, APIs
└── presentation/   // HTTP controllers, WebSocket handlers
```

### Testing Strategy

```bash
# Unit tests
npm test -- --coverage

# Integration tests
npm run test:integration

# Contract tests
npm run test:contracts

# E2E tests
npm run test:e2e
```

### Git Workflow

```bash
# Feature development
git checkout -b feature/OSSA-xxx-description
npm test
git add .
git commit -m "feat: implement feature description"
git push origin feature/OSSA-xxx-description

# Hotfix
git checkout -b hotfix/OSSA-xxx-critical-fix
# ... make fixes ...
git commit -m "fix: resolve critical issue"
```

## Monitoring and Observability

### Grafana Dashboards

Access: http://192.168.139.2:3000
- Username: `admin`
- Password: `ossa-monitor-2025`

Key dashboards:
- Agent Performance
- System Resources
- API Metrics
- Error Tracking

### Prometheus Queries

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Memory usage
container_memory_usage_bytes{name="ossa-gateway"}
```

### Logging

```typescript
// Structured logging with winston
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    })
  ]
});
```

## Deployment

### Production Checklist

- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Backup strategy implemented
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented

### CI/CD Pipeline

```yaml
# .gitlab-ci.yml example
stages:
  - test
  - build
  - deploy

test:
  script:
    - npm install
    - npm test
    - npm run lint

build:
  script:
    - docker build -t ossa:latest .
    - docker push registry.example.com/ossa:latest

deploy:
  script:
    - kubectl apply -f k8s/
    - kubectl rollout status deployment/ossa-gateway
```

## Support and Resources

### Documentation
- [OSSA Specification](https://ossa.io/spec)
- [Docker Documentation](https://docs.docker.com)
- [Kubernetes Documentation](https://kubernetes.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### Community
- GitHub Issues: Report bugs and request features
- Discord: Real-time support and discussions
- Stack Overflow: Tag questions with `ossa-platform`

### Debugging Tools
- Chrome DevTools for Node.js
- Docker Desktop dashboard
- K9s for Kubernetes management
- pgAdmin for PostgreSQL
- RedisInsight for Redis

---

*Last updated: 2025-09-10*
*Version: 0.1.9-alpha.1*