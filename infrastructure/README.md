<<<<<<< HEAD
# OSSA Infrastructure Deployment Guide

## Overview
OSSA (Open Standards for Scalable Agents) core orchestrator infrastructure with standardized deployment patterns for the LLM ecosystem.

## Port Allocation
```yaml
Service: OSSA
Ports:
  api: 3000
  websocket: 3001
  metrics: 3002
=======
# Infrastructure - OSSA

**OSSA Compliant - v0.1.9**
**Standard: Agent BuildKit Infrastructure Pattern**

## Directory Structure
```
infrastructure/
├── docker/         # Docker configurations
├── k8s/           # Kubernetes manifests
├── monitoring/    # Monitoring & observability
├── scripts/       # Deployment scripts
├── deployment/    # Environment configs
├── observability/ # Tracing & metrics
├── templates/     # Reusable templates
├── workflows/     # CI/CD workflows
├── nginx/         # Reverse proxy
├── helm/          # Helm charts
├── terraform/     # Infrastructure as Code
├── ci-cd/         # Pipeline configs
├── security/      # Security configs
└── backup/        # Backup strategies
>>>>>>> feature/redis-event-bus-v0.1.9
```

## Quick Start

### Development
```bash
<<<<<<< HEAD
make dev          # Start development environment
make status       # Check service status
make logs         # View logs
=======
cd infrastructure/docker
docker-compose up -d
>>>>>>> feature/redis-event-bus-v0.1.9
```

### Production
```bash
<<<<<<< HEAD
make prod         # Deploy production
make helm-deploy  # Deploy via Helm
```

### Standalone
```bash
make standalone   # Run OSSA independently
```

## Service URLs
- API: http://localhost:3000
- WebSocket: ws://localhost:3001
- Metrics: http://localhost:3002/metrics
- Health: http://localhost:3000/health

## Dependencies
- Node.js >= 18
- Docker & Docker Compose
- Kubernetes (production)

## Environment Variables
See `.env.example` for required configuration.
=======
./scripts/deploy.sh production
```

## Monitoring
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
>>>>>>> feature/redis-event-bus-v0.1.9
