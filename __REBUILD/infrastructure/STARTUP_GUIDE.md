# OSSA & Agent BuildKit Startup Guide

## 🏗️ Architecture Overview

You have **two separate systems** with clean separation of duties:

### 1. **Agent BuildKit** (Development Tools)
- **Location**: `/Users/flux423/Sites/LLM/agent_buildkit/`
- **Purpose**: TDD framework, development tools, testing infrastructure
- **Stack**: `agent-buildkit-stack.yml`
- **Status**: ✅ **RUNNING** (Up 2 hours)

### 2. **OSSA** (Production Runtime Platform)  
- **Location**: `/Users/flux423/Sites/LLM/OSSA/__REBUILD/`
- **Purpose**: Agent orchestration, runtime platform, specifications
- **Stack**: Multiple Docker Compose configurations
- **Status**: ❓ **NEEDS STARTUP**

## 🚀 Current Running Services

### Agent BuildKit (Port 3000 Stack) ✅
```
✅ agent-buildkit-app    : http://localhost:3000 (healthy)
✅ buildkit-postgres     : localhost:15432 (healthy)  
✅ buildkit-redis        : localhost:16379 (healthy)
❌ buildkit-qdrant       : localhost:16333 (unhealthy)
❌ buildkit-kafka        : localhost:19092 (unhealthy)
✅ buildkit-sonarqube    : http://localhost:19000
✅ buildkit-zookeeper    : localhost:12181
```

### OSSA K8s Services (Mixed Ports) ⚠️
```
✅ grafana      : http://localhost:3080 (working)
✅ prometheus   : http://localhost:9090 (working)
✅ postgres     : localhost:5432 (working)
✅ redis        : localhost:6379 (working)  
✅ qdrant       : localhost:6333 (working)
❌ gateway      : localhost:3000 (conflicts with buildkit)
❌ agents       : localhost:3001-3013 (crash loop)
```

## 🎯 How to Start OSSA

### Option 1: OrbStack Isolated (Recommended)
```bash
cd /Users/flux423/Sites/LLM/OSSA/__REBUILD/infrastructure/docker
docker-compose -f docker-compose.orbstack.yml up -d
```

**OSSA Isolated Ports:**
- Gateway: http://localhost:3100
- Redis: localhost:6382  
- PostgreSQL: localhost:5433
- Qdrant: localhost:6335

### Option 2: CLI Commands
```bash
cd /Users/flux423/Sites/LLM/OSSA/__REBUILD

# Start orchestrator
npm run orchestrator:start

# Start platform  
npm run platform:start

# Start with agents
npm run dev:with-agents
```

### Option 3: Complete Stack (Requires Port 3000 Free)
```bash
# First stop agent-buildkit to free port 3000
cd /Users/flux423/Sites/LLM/agent_buildkit/infrastructure
docker-compose -f agent-buildkit-stack.yml stop agent-buildkit-app

# Then start OSSA complete stack
cd /Users/flux423/Sites/LLM/OSSA/__REBUILD/infrastructure/docker  
docker-compose -f docker-compose.complete.yml up -d
```

## 🔧 Port Conflict Resolution

### Current Port Usage:
- **3000**: Agent BuildKit (running) vs OSSA Gateway (conflicts)
- **5432**: OSSA K8s PostgreSQL (working)
- **6379**: OSSA K8s Redis (working)
- **6333**: OSSA K8s Qdrant (working)

### Solutions:

#### A. Run Both Simultaneously (Isolated)
```bash
# Agent BuildKit: http://localhost:3000
# OSSA Isolated:  http://localhost:3100
docker-compose -f docker-compose.orbstack.yml up -d
```

#### B. Switch Between Systems
```bash
# Stop BuildKit, Start OSSA
docker-compose -f agent-buildkit-stack.yml stop
docker-compose -f docker-compose.complete.yml up -d

# Stop OSSA, Start BuildKit  
docker-compose -f docker-compose.complete.yml stop
docker-compose -f agent-buildkit-stack.yml start
```

## 📊 Service Access URLs

### Agent BuildKit (Currently Running)
- **Main App**: http://localhost:3000
- **SonarQube**: http://localhost:19000
- **PostgreSQL**: `psql -h localhost -p 15432 -U buildkit_admin buildkit_agents`
- **Redis**: `redis-cli -p 16379 -a buildkit_redis_2024`

### OSSA (When Started)
#### Isolated Mode:
- **Gateway**: http://localhost:3100/health
- **PostgreSQL**: `psql -h localhost -p 5433 -U ossa ossa_isolated`
- **Redis**: `redis-cli -p 6382`

#### Standard Mode:
- **Gateway**: http://localhost:3000/health  
- **Grafana**: http://localhost:3080 (admin/ossa-monitor-2025)
- **Prometheus**: http://localhost:9090

## 🔍 Health Checks

### Agent BuildKit
```bash
curl http://localhost:3000/health
docker-compose -f agent-buildkit-stack.yml ps
```

### OSSA  
```bash
# Isolated mode
curl http://localhost:3100/health

# Standard mode
curl http://localhost:3000/health

# K8s services
kubectl get pods -n ossa-agents
```

## 🎛️ Management Commands

### Agent BuildKit
```bash
cd /Users/flux423/Sites/LLM/agent_buildkit/infrastructure

# Start full stack
docker-compose -f agent-buildkit-stack.yml up -d

# Stop full stack
docker-compose -f agent-buildkit-stack.yml down

# View logs
docker-compose -f agent-buildkit-stack.yml logs -f

# Just restart app (keep databases)
docker-compose -f agent-buildkit-stack.yml restart agent-buildkit-app
```

### OSSA
```bash
cd /Users/flux423/Sites/LLM/OSSA/__REBUILD

# Start via npm scripts
npm run platform:start           # Main platform
npm run orchestrator:start       # Orchestrator 
npm run dev:with-agents          # With mock agents

# Start via Docker (isolated)
cd infrastructure/docker
docker-compose -f docker-compose.orbstack.yml up -d

# K8s management
kubectl get pods -n ossa-agents
kubectl logs deployment/grafana -n ossa-agents
```

## 🚨 Quick Start Recommendation

**For immediate use** (both systems running):

1. **Keep Agent BuildKit running** (it's healthy on port 3000)
2. **Start OSSA isolated** (no conflicts):
```bash
cd /Users/flux423/Sites/LLM/OSSA/__REBUILD/infrastructure/docker
docker-compose -f docker-compose.orbstack.yml up -d
```

3. **Access both systems**:
   - Agent BuildKit: http://localhost:3000
   - OSSA Gateway: http://localhost:3100  
   - OSSA Grafana: http://localhost:3080 (from K8s)

This gives you full access to both development tools and runtime platform simultaneously.