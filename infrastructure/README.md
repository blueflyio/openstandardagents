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
```

## Quick Start

### Development
```bash
make dev          # Start development environment
make status       # Check service status
make logs         # View logs
```

### Production
```bash
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