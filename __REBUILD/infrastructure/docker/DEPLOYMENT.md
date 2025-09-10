# OSSA Docker Deployment Guide

## 🚨 OrbStack Compatibility Notice

OSSA __REBUILD includes isolated Docker configurations to avoid conflicts with existing K8s deployments running in OrbStack.

## Current OrbStack K8s Services (Running)

The following services are currently running in K8s and will conflict with standard Docker ports:

- **Redis**: K8s port 6379 (isolated: 6382)
- **PostgreSQL**: K8s port 5432 (isolated: 5433) 
- **Qdrant**: K8s ports 6333-6334 (isolated: 6335-6336)
- **Gateway**: K8s port 3000 (isolated: 3100)
- **Prometheus/Grafana**: K8s ports 9090/3080

## 🔧 Deployment Options

### 1. OrbStack Isolated (Recommended)
```bash
cd /Users/flux423/Sites/LLM/OSSA/__REBUILD/infrastructure/docker
docker-compose -f docker-compose.orbstack.yml up -d
```

**Isolated Ports:**
- Gateway: `http://localhost:3100`
- Redis: `localhost:6382`
- PostgreSQL: `localhost:5433`
- Qdrant: `localhost:6335` (HTTP), `localhost:6336` (gRPC)

### 2. Complete Development Stack
```bash
# ⚠️ WARNING: Will conflict with OrbStack K8s services
docker-compose -f docker-compose.complete.yml up -d
```

### 3. Production Environment
```bash
# ⚠️ WARNING: Will conflict with OrbStack K8s services
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d
```

### 4. Standard Development (Conflicts with OrbStack)
```bash
# ⚠️ WARNING: Will conflict with OrbStack K8s services
docker-compose up -d
```

## 🧹 Cleaning Up Old Configurations

### Option A: Keep K8s, Use Isolated Docker
```bash
# Use the isolated configuration (recommended)
docker-compose -f docker-compose.orbstack.yml up -d
```

### Option B: Stop K8s, Use Standard Docker
```bash
# Stop OrbStack K8s services first
kubectl delete namespace ossa-agents
# Then use standard configurations
docker-compose up -d
```

## 📊 Service Access

### OrbStack Isolated Configuration
- **OSSA Gateway**: http://localhost:3100/health
- **Redis CLI**: `redis-cli -p 6382`
- **PostgreSQL**: `psql -h localhost -p 5433 -U ossa -d ossa_isolated`
- **Qdrant Dashboard**: http://localhost:6335/dashboard

### K8s Services (Currently Running)
- **Grafana**: http://localhost:3080 (admin/ossa-monitor-2025)
- **Prometheus**: http://localhost:9090

## 🔐 Environment Variables

### Isolated Configuration
```bash
export REDIS_URL="redis://localhost:6382"
export POSTGRES_URL="postgresql://ossa:ossa_isolated_password@localhost:5433/ossa_isolated"
export QDRANT_URL="http://localhost:6335"
export GATEWAY_URL="http://localhost:3100"
```

### Standard Configuration (If K8s Stopped)
```bash
export REDIS_URL="redis://localhost:6379"
export POSTGRES_URL="postgresql://ossa:ossa_dev_password@localhost:5432/ossa"
export QDRANT_URL="http://localhost:6333"
export GATEWAY_URL="http://localhost:3000"
```

## 🏗️ Architecture Separation

OSSA maintains clean separation of duties across projects:

- **OSSA __REBUILD**: Production runtime platform (this directory)
- **agent-buildkit**: Development tools and TDD framework
- **OrbStack K8s**: Agent orchestration and coordination
- **Docker Compose**: Service-level deployment and testing

Each maintains independent configurations to avoid conflicts.

## 🔧 Troubleshooting

### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000  # Gateway
lsof -i :6379  # Redis
lsof -i :5432  # PostgreSQL
lsof -i :6333  # Qdrant

# Kill conflicting services if needed
docker stop $(docker ps -q --filter "name=ossa")
kubectl delete namespace ossa-agents
```

### Health Checks
```bash
# Test isolated services
curl http://localhost:3100/health  # Gateway
redis-cli -p 6382 ping            # Redis
curl http://localhost:6335/health  # Qdrant
```

### Clean Start
```bash
# Remove all OSSA containers and volumes
docker-compose -f docker-compose.orbstack.yml down -v
docker system prune -f

# Start fresh
docker-compose -f docker-compose.orbstack.yml up -d
```