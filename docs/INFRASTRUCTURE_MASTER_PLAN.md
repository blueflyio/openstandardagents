# Master Infrastructure Standardization Plan
**Project**: LLM Ecosystem (23 Projects)
**Date**: 2025-09-29
**Status**: ACTIVE IMPLEMENTATION

## 📋 Project Inventory & Port Allocation

### Core Orchestrators (8000-8099)
- **OSSA**: Port 8080 (existing, preserved)
- **agent_buildkit**: Port 8081
- **llm-platform**: Port 8080 (Drupal via DDEV, orchestrator functions)

### Service Layer - common_npm (3000-3099)
- **agent-brain**: Port 3000
- **agent-chat**: Port 3001
- **agent-docker**: Port 3002
- **agent-mesh**: Port 3003
- **agent-ops**: Port 3004
- **agent-protocol**: Port 3005
- **agent-router**: Port 3006
- **agent-studio**: Port 3007
- **agent-tracer**: Port 3008
- **agentic-flows**: Port 3009
- **compliance-engine**: Port 3010
- **doc-engine**: Port 3011
- **foundation-bridge**: Port 3012
- **rfp-automation**: Port 3013
- **studio-ui**: Port 3014
- **workflow-engine**: Port 3015

### Model Layer (5000-5099)
- **agent-studio_model**: Port 5000
- **gov-policy_model**: Port 5001
- **gov-rfp_model**: Port 5002
- **llm-platform_model**: Port 5003

### Data Services (6000-6099) - Shared Infrastructure
- **PostgreSQL**: Port 5433 (existing llm-platform)
- **Redis**: Port 6380 (existing llm-platform)
- **Qdrant**: Port 6333 (existing llm-platform)
- **MinIO**: Port 9001 (existing llm-platform)

### MCP Services (9000-9099) - Existing
- **CivicPolicy Model**: Port 8000 (existing llm-platform)
- **Compliance Engine**: Port 9000 (existing llm-platform)
- **Model Gateway**: Port 8090 (existing llm-platform)
- **Agent Orchestrator**: Port 8091 (existing llm-platform)

##  Standard Infrastructure Template

Each project gets this structure:
```
[project]/
├── infrastructure/
│   ├── .infrastructure.yaml      # Project metadata
│   ├── Dockerfile               # Multi-stage container
│   ├── docker-compose.yml       # Local development
│   ├── .dockerignore
│   ├── helm/                    # Kubernetes deployment
│   │   ├── Chart.yaml
│   │   ├── values/
│   │   │   ├── base.yaml
│   │   │   ├── local.yaml       # OrbStack
│   │   │   ├── staging.yaml
│   │   │   └── production.yaml
│   │   └── templates/
│   │       ├── deployment.yaml
│   │       ├── service.yaml
│   │       └── configmap.yaml
│   └── scripts/
│       ├── build.sh
│       ├── deploy.sh
│       └── health-check.sh
└── .gitlab-ci.yml               # CI/CD pipeline
```

##  Three-Cluster Architecture

### Cluster 1: Core (Always Running)
- OSSA + agent_buildkit + llm-platform orchestration
- Shared data services (PostgreSQL, Redis, Qdrant, MinIO)
- Service discovery and registry

### Cluster 2: Services (On-Demand)
- All 16 common_npm services
- Deployable individually or as groups
- Profiles: api-services, web-services, all-services

### Cluster 3: Models (GPU-Optimized)
- All 4 model services
- GPU resource allocation
- Model serving and inference

##  llm-platform Orchestration Strategy

**llm-platform becomes the master orchestrator using:**

1. **DDEV for Drupal** (preserved, untouched)
2. **Service Discovery** for other services
3. **Docker Compose Extends** for non-DDEV services
4. **Deployment Profiles**:
   - `minimal`: Just core (OSSA + BuildKit + shared infra)
   - `development`: Core + selected services
   - `full`: Everything (all 23 projects)

##  Implementation Phases

### Phase 1: Template Creation  COMPLETED
-  Create master infrastructure template
-  Port allocation registry
-  Standard Dockerfile/docker-compose patterns
-  llm-platform orchestrator with health matrix
-  Agent-router standardization (test case)
-  Model container builds (4 models)

### Phase 2: Service Standardization  COMPLETED
-  Apply template to all 16 common_npm services
-  Apply template to all 4 model services
-  Preserve OSSA/agent_buildkit existing infrastructure

### Phase 3: Orchestration Integration  COMPLETED
-  Create docker-compose.orchestrate.yml for orchestrator
-  Implement deployment profiles (api-services, web-services, model-services, workflow, all)
-  Service discovery and registry system

### Phase 4: CI/CD & Production  LARGELY COMPLETED
-  GitLab CI/CD templates (golden workflow components)
-  Helm chart deployment (multiple services)
- ❌ Full stack validation testing

##  Migration Strategy

**SAFE APPROACH - No Breaking Changes:**

1. **Audit existing** infrastructure per project
2. **Create new** infrastructure/ folder (don't touch existing)
3. **Test new** infrastructure works
4. **Switch over** when validated
5. **Cleanup old** infrastructure

## 🎮 Usage Patterns

### Individual Development
```bash
cd /Users/flux423/Sites/LLM/common_npm/agent-chat
make local-up    # Just agent-chat + dependencies
```

### Service Group Testing
```bash
cd /Users/flux423/Sites/LLM/llm-platform
make deploy-profile services=agent-services  # APIs only
```

### Full Stack Testing
```bash
cd /Users/flux423/Sites/LLM/llm-platform
make deploy-profile services=all  # Everything
```

##  Success Criteria

- [x] Zero port conflicts across 23 services
- [x] Infrastructure standardization template
- [x] llm-platform orchestrator with health monitoring
- [x] Model containers containerized and built
- [x] All 23 services standardized with templates
- [x] llm-platform orchestrates any combination
- [x] DDEV continues managing Drupal
- [x] Multiple deployment profiles operational
- [ ] All services preserve existing functionality

##  Current Status

**COMPLETED:**
-  Infrastructure audit of all projects
-  Port allocation strategy
-  Three-cluster architecture design
-  Master template implementation
-  llm-platform orchestrator system
-  All 23 services standardized with infrastructure templates
-  All 4 model containers built
-  Orchestration integration layer (docker-compose.orchestrate.yml)
-  Deployment profiles (api-services, web-services, model-services, workflow, all)
-  Service discovery and registry system

**IN PROGRESS:**
-  Full stack validation testing

**NEXT:**
- ❌ Complete full stack validation testing
- ❌ Production deployment automation
- ❌ Monitoring and observability completion
- ❌ Performance testing and optimization

---

*This replaces and consolidates: ARCHITECTURE_PLAN.md, AUDIT_REPORT.md, PERFECT_STRUCTURE.md*