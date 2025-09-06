# OSSA Microservices Architecture v0.1.8

This directory contains the OSSA microservices implementation, providing a scalable, production-ready infrastructure for multi-agent orchestration and coordination.

## 🏗️ Services Architecture

```
services/
├── gateway/              # API Gateway (Port 3000)
│   ├── src/             # Gateway routing & authentication
│   ├── translators/     # Protocol translation
│   └── package.json     # Gateway service config
├── discovery/           # Discovery Service (Port 3011)
│   ├── src/             # ACDL implementation
│   └── package.json     # Discovery service config
├── coordination/        # Coordination Service (Port 3010)
│   ├── src/             # Agent management
│   ├── messaging/       # Inter-agent messaging
│   └── package.json     # Coordination service config
├── orchestration/       # Orchestration Service (Port 3012)
│   ├── src/             # Workflow management
│   ├── legacy/          # Legacy orchestration patterns
│   └── package.json     # Orchestration service config
├── monitoring/          # Monitoring Service (Port 3013)
│   ├── src/             # Metrics & health checks
│   └── package.json     # Monitoring service config
├── shared/              # Shared types and utilities
└── tests/               # Integration tests
```

## 🚀 Services Overview

### 1. API Gateway Service (Port 3000)
**Purpose**: Single entry point for all API requests
- **Routing**: Intelligent request routing to microservices
- **Authentication**: JWT-based authentication and authorization
- **Rate Limiting**: Request throttling and DDoS protection
- **Load Balancing**: Traffic distribution across service instances
- **Protocol Translation**: Between different agent frameworks

### 2. Discovery Service (Port 3011) 
**Purpose**: ACDL (Agent Capability Discovery Language) implementation
- **Agent Discovery**: Automatic agent registration and discovery
- **Capability Matching**: Semantic capability-based routing
- **Service Registry**: Centralized service catalog
- **Health Monitoring**: Service health tracking

### 3. Coordination Service (Port 3010)
**Purpose**: Agent lifecycle management and task scheduling
- **Agent Management**: Agent provisioning and lifecycle
- **Task Scheduling**: Intelligent task distribution
- **Workload Balancing**: Resource optimization
- **Inter-Agent Messaging**: Communication facilitation

### 4. Orchestration Service (Port 3012)
**Purpose**: Complex workflow management and multi-agent coordination
- **Workflow Management**: Multi-step process orchestration
- **Pattern Implementation**: 6 orchestration patterns (Sequential, Parallel, Fan-out, Pipeline, MapReduce, Circuit Breaker)
- **Task Distribution**: Intelligent work distribution
- **Dependency Management**: Task dependency resolution

### 5. Monitoring Service (Port 3013)
**Purpose**: System observability and performance tracking
- **Performance Tracking**: Real-time metrics collection
- **Health Checks**: Service and agent health monitoring
- **Alerting**: Automated incident detection
- **Metrics Export**: Prometheus-compatible metrics

## 🛠️ Development

### Quick Start
```bash
# Install dependencies for all services
npm run install:all

# Build all services
npm run build:all

# Start all services in development
npm run dev:all

# Start individual service
cd services/gateway && npm run dev
```

### Service Development
```bash
# Create new service
npm run create:service <service-name>

# Add service to gateway routing
npm run gateway:add-route <service-name>

# Run integration tests
npm test
```

## 🐳 Deployment

### Docker Compose (Development)
```bash
# Start all services
docker-compose up

# Scale specific service
docker-compose up --scale coordination=3
```

### Kubernetes (Production)
```bash
# Deploy to cluster
kubectl apply -f k8s/

# Scale deployment
kubectl scale deployment coordination-service --replicas=5
```

## 📊 Monitoring

### Health Checks
- **Gateway**: `GET http://localhost:3000/health`
- **Discovery**: `GET http://localhost:3011/health`
- **Coordination**: `GET http://localhost:3010/health`
- **Orchestration**: `GET http://localhost:3012/health`
- **Monitoring**: `GET http://localhost:3013/health`

### Metrics
- **Prometheus**: `http://localhost:3013/metrics`
- **Service Mesh**: Istio-compatible
- **Tracing**: OpenTelemetry integration

## 🔒 Security

### Authentication & Authorization
- **JWT-based authentication**
- **Role-based access control (RBAC)**
- **Service-to-service mTLS**
- **API rate limiting**

### Compliance
- **OSSA v0.1.8 compliant**
- **ISO 42001 ready**
- **GDPR data handling**
- **Audit logging**

## 🎯 OSSA Extensions

### Custom Extensions
- **x-ossa-acta**: Agent Coordination and Task Allocation
- **x-ossa-acdl**: Agent Capability Discovery Language
- **x-ossa-coordination**: Advanced coordination patterns

### Token Optimization
- **Target**: 75% token reduction
- **Techniques**: Semantic compression, context caching
- **Monitoring**: Real-time optimization tracking