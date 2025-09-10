# OrbStack Management Guide

## 🔍 Current OrbStack Status

**Yes, this is using Kubernetes (K8s)** - OrbStack provides a lightweight K8s cluster that's currently running OSSA services.

### Current K8s Environment
- **Context**: `orbstack` 
- **Kubernetes Version**: `v1.32.6+orb1`
- **Active Namespaces**: `ossa-agents`, `llm`, `llm-platform`

### Current OSSA K8s Pods Status
```
✅ Running: grafana, postgres, prometheus, qdrant, redis
❌ CrashLoopBackOff: agent-gateway, project-rebuild-* agents
```

## 🔧 OrbStack Updates

### GUI Update Method (Recommended)
1. Open OrbStack app from Applications
2. Go to Settings → General → Check for Updates
3. Install updates if available
4. Restart OrbStack

### CLI Update Method
```bash
# OrbStack updates via Homebrew
brew update
brew upgrade orbstack

# Or download from website
# https://orbstack.dev/download
```

### Version Check
```bash
# Check Kubernetes version
kubectl version --short

# Check OrbStack app
open /Applications/OrbStack.app
# Look in About section for version info
```

## 🚨 Managing K8s vs Docker Conflicts

### Option 1: Clean K8s Shutdown (Recommended)
```bash
# Stop problematic agents but keep infrastructure
kubectl delete deployment agent-gateway -n ossa-agents
kubectl delete deployment project-rebuild-contract-runner -n ossa-agents  
kubectl delete deployment project-rebuild-tdd-enforcer -n ossa-agents
kubectl delete deployment project-rebuild-version-sync -n ossa-agents

# Keep: grafana, postgres, prometheus, qdrant, redis (they're working)
```

### Option 2: Complete K8s Cleanup
```bash
# Remove entire OSSA namespace
kubectl delete namespace ossa-agents

# This stops ALL K8s OSSA services and frees up ports for Docker
```

### Option 3: Docker Isolation (Current Setup)
```bash
# Use the isolated Docker configuration (no conflicts)
cd /Users/flux423/Sites/LLM/OSSA/__REBUILD/infrastructure/docker
docker-compose -f docker-compose.orbstack.yml up -d
```

## 🐳 Docker Context Management

### Check Current Docker Context
```bash
docker context list
# Should show 'orbstack' as active
```

### Switch Docker Context (if needed)
```bash
# Use OrbStack's Docker
docker context use orbstack

# Or use Docker Desktop (if installed)
docker context use desktop-linux
```

## 🔄 Restart/Reset OrbStack

### Soft Restart
```bash
# Restart OrbStack service
sudo pkill -f OrbStack
open /Applications/OrbStack.app
```

### Hard Reset (Nuclear Option)
```bash
# Stop OrbStack completely
sudo pkill -f OrbStack

# Reset all containers/data (⚠️ DESTRUCTIVE)
rm -rf ~/.orbstack

# Restart OrbStack
open /Applications/OrbStack.app
```

## 📊 Current Port Usage

### K8s Services (ports in use)
- **Grafana**: 3080 → Working ✅
- **Prometheus**: 9090 → Working ✅  
- **PostgreSQL**: 5432 → Working ✅
- **Redis**: 6379 → Working ✅
- **Qdrant**: 6333-6334 → Working ✅

### Failed K8s Services (ports blocked)
- **Gateway**: 3000 → CrashLoopBackOff ❌
- **Agents**: 3001-3013 → CrashLoopBackOff ❌

### Docker Isolated Ports (available)
- **Gateway**: 3100 🆓
- **Redis**: 6382 🆓
- **PostgreSQL**: 5433 🆓
- **Qdrant**: 6335-6336 🆓

## 🎯 Recommended Actions

### 1. Update OrbStack
```bash
brew upgrade orbstack
# Or use GUI: Settings → Check for Updates
```

### 2. Clean Up Failed K8s Agents
```bash
kubectl delete deployment agent-gateway -n ossa-agents
kubectl delete deployment project-rebuild-contract-runner -n ossa-agents
kubectl delete deployment project-rebuild-tdd-enforcer -n ossa-agents  
kubectl delete deployment project-rebuild-version-sync -n ossa-agents
```

### 3. Use Docker for Development
```bash
cd /Users/flux423/Sites/LLM/OSSA/__REBUILD/infrastructure/docker
docker-compose -f docker-compose.orbstack.yml up -d
```

### 4. Keep Working K8s Services
- Grafana (monitoring dashboard)
- Prometheus (metrics collection)
- PostgreSQL, Redis, Qdrant (databases)

This gives you the best of both worlds: stable K8s infrastructure + isolated Docker development environment.

## 🔍 Troubleshooting

### Check OrbStack Status
```bash
# Docker status
docker info | grep -i orbstack

# K8s status  
kubectl cluster-info

# Resource usage
kubectl top nodes
kubectl top pods -n ossa-agents
```

### Logs for Failed Pods
```bash
kubectl logs deployment/agent-gateway -n ossa-agents
kubectl describe pod -l app=agent-gateway -n ossa-agents
```