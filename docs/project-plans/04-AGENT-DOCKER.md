# Project: agent-docker

**Epic**: Infrastructure Automation  
**Phase**: 1 - Production Deployment  
**Timeline**: Week 2-3 (Feb 3 - Feb 14, 2025)  
**Owner**: Infrastructure Team  
**Priority**: 🔴 CRITICAL - Foundation for all agent deployments

---

## Project Overview

**Package**: `@bluefly/agent-docker`  
**Repository**: `gitlab.com/blueflyio/agent-platform/agent-docker`  
**NAS Location**: `/Volumes/AgentPlatform/repos/bare/blueflyio/agent-platform/agent-docker.git`  
**Purpose**: Container orchestration, NAS always-on services, GPU compute scaling

---

## Current Status

- **Overall Health**: ⚠️ Cautionary (Infrastructure partially operational)
- **NAS Services**: 6/12 operational (GitLab webhooks, MinIO, PostgreSQL, Redis, Cloudflare Tunnel, Agent Mesh)
- **DevContainer**: Not deployed (blocking SDK development)
- **Vast.ai Integration**: Not operational (blocking GPU workloads)
- **Revenue Impact**: ALL revenue blocked without infrastructure

---

## Phase 1 Objectives (Weeks 2-3)

### Week 2: NAS Always-On Infrastructure
**Objective**: Complete NAS service deployment for 24/7 operations

#### Infrastructure Matrix

| Service | Port | Status | Purpose | Owner Package |
|---------|------|--------|---------|---------------|
| **GitLab Webhook Server** | 3001 | ✅ Operational | Webhook routing | platform-agents |
| **Agent Mesh** | 3005 | ✅ Operational | Service discovery | @bluefly/agent-mesh |
| **MinIO S3** | 9000 | ✅ Operational | Object storage | Infrastructure |
| **PostgreSQL** | 5432 | ✅ Operational | Primary database | Infrastructure |
| **Redis** | 6379 | ✅ Operational | Cache & sessions | Infrastructure |
| **cloudflared** | - | ✅ Operational | Public ingress | Infrastructure |
| **Compliance Engine API** | 3010 | ⏳ Deploy Week 2 | Compliance scanning | @bluefly/compliance-engine |
| **Agent Router** | 4000 | ⏳ Deploy Week 2 | LLM routing | @bluefly/agent-router |
| **Agent Brain** | 6333 | ⏳ Deploy Week 2 | Vector search | @bluefly/agent-brain |
| **Workflow Engine** | 3015 | ⏳ Deploy Week 2 | Workflow orchestration | @bluefly/workflow-engine |
| **Doc Engine** | 3011 | ⏳ Deploy Week 3 | Documentation | @bluefly/doc-engine |
| **Agent Tracer** | 3008 | ⏳ Deploy Week 3 | Observability | @bluefly/agent-tracer |

#### Monday-Tuesday (Feb 3-4): NAS Service Deployment

```bash
# 1. Deploy Compliance Engine
docker-compose -f deployments/nas/compliance-engine.yml up -d

# 2. Deploy Agent Router
docker-compose -f deployments/nas/agent-router.yml up -d

# 3. Deploy Agent Brain (Qdrant)
docker-compose -f deployments/nas/agent-brain.yml up -d

# 4. Deploy Workflow Engine
docker-compose -f deployments/nas/workflow-engine.yml up -d

# 5. Verify all services
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Expected Result**: 10/12 services operational

#### Wednesday-Thursday (Feb 5-6): Cloudflare Integration

```yaml
# ~/.cloudflared/config.yml
tunnel: f6da7bdf-d0f8-4796-a804-afb7984bbe11
credentials-file: /Users/flux423/.cloudflared/f6da7bdf-d0f8-4796-a804-afb7984bbe11.json

ingress:
  # Webhook routing
  - hostname: api.blueflyagents.com
    service: http://blueflynas.tailcf98b3.ts.net:3001
    
  # Agent Mesh API
  - hostname: mesh.blueflyagents.com
    service: http://blueflynas.tailcf98b3.ts.net:3005
    
  # MinIO S3
  - hostname: storage.blueflyagents.com
    service: http://blueflynas.tailcf98b3.ts.net:9000
    
  # Compliance Engine
  - hostname: compliance.blueflyagents.com
    service: http://blueflynas.tailcf98b3.ts.net:3010
    
  # Agent Router
  - hostname: router.blueflyagents.com
    service: http://blueflynas.tailcf98b3.ts.net:4000
    
  # Agent Brain
  - hostname: brain.blueflyagents.com
    service: http://blueflynas.tailcf98b3.ts.net:6333
    
  # Workflow Engine
  - hostname: workflows.blueflyagents.com
    service: http://blueflynas.tailcf98b3.ts.net:3015
  
  # Catch-all
  - service: http_status:404
```

**Actions**:
```bash
# 1. Update Cloudflare DNS
# Add CNAME records for all public endpoints

# 2. Restart Cloudflare Tunnel
cloudflared service install
cloudflared service start

# 3. Test public access
curl https://api.blueflyagents.com/health
curl https://compliance.blueflyagents.com/api/health
```

#### Friday (Feb 7): STASH-21 DevContainer Deployment

**Purpose**: Unified SDK development environment

**Components**:
```json
// .devcontainer/devcontainer.json
{
  "name": "Bluefly Agent Platform SDK",
  "dockerComposeFile": "docker-compose.yml",
  "service": "workspace",
  "workspaceFolder": "/workspace",
  
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    },
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-typescript-next",
        "redhat.vscode-yaml",
        "ms-azuretools.vscode-docker"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": true
        }
      }
    }
  },
  
  "postCreateCommand": "npm install && npm run bootstrap",
  
  "mounts": [
    "source=${localWorkspaceFolder},target=/workspace,type=bind",
    "source=${localEnv:HOME}/.tokens,target=/workspace/.tokens,type=bind,readonly"
  ],
  
  "remoteEnv": {
    "GITLAB_TOKEN": "${localEnv:GITLAB_TOKEN}",
    "NPM_TOKEN": "${localEnv:NPM_TOKEN}"
  }
}
```

```yaml
# .devcontainer/docker-compose.yml
version: '3.8'

services:
  workspace:
    build:
      context: .
      dockerfile: Dockerfile
    
    volumes:
      - ../..:/workspace:cached
      - ~/.tokens:/workspace/.tokens:ro
    
    command: sleep infinity
    
    networks:
      - agent-platform
    
    environment:
      - NODE_ENV=development
      - GITLAB_HOST=gitlab.com
      - REGISTRY_HOST=registry.gitlab.com
  
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: agent_platform
      POSTGRES_USER: developer
      POSTGRES_PASSWORD: devpass
    ports:
      - "5432:5432"
    networks:
      - agent-platform
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - agent-platform
  
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    networks:
      - agent-platform

networks:
  agent-platform:
    driver: bridge
```

```dockerfile
# .devcontainer/Dockerfile
FROM mcr.microsoft.com/devcontainers/typescript-node:20

# Install GitLab CLI
RUN curl -s https://gitlab.com/gitlab-org/cli/-/releases/permalink/latest/downloads/glab_linux_amd64.tar.gz | tar -xz -C /usr/local/bin

# Install agent-buildkit globally
RUN npm install -g @bluefly/agent-buildkit

# Set up workspace
WORKDIR /workspace

# Install dependencies on build
COPY package*.json ./
RUN npm ci

USER node
```

### Week 3: Vast.ai GPU Scaling
**Objective**: Deploy elastic GPU compute for inference workloads

#### Monday-Tuesday (Feb 10-11): STASH-22 Vast.ai Integration

**Auto-Scaling Service**:
```typescript
// src/scaling/vastai-scaler.service.ts
import { Injectable } from '@nestjs/common';
import { VastaiClient } from './vastai-client';
import { MetricsService } from '@bluefly/agent-tracer';

@Injectable()
export class VastaiScalerService {
  constructor(
    private vastai: VastaiClient,
    private metrics: MetricsService
  ) {}
  
  /**
   * Auto-scale GPU instances based on inference queue depth
   */
  async autoScale(): Promise<ScalingResult> {
    const queueDepth = await this.metrics.getQueueDepth('inference');
    const activeInstances = await this.vastai.listInstances({ status: 'running' });
    
    // Scale up if queue depth > 100 requests
    if (queueDepth > 100 && activeInstances.length < 5) {
      return this.scaleUp();
    }
    
    // Scale down if queue depth < 10 and instances > 1
    if (queueDepth < 10 && activeInstances.length > 1) {
      return this.scaleDown();
    }
    
    return { action: 'no_change', instances: activeInstances.length };
  }
  
  /**
   * Launch new GPU instance
   */
  private async scaleUp(): Promise<ScalingResult> {
    const instance = await this.vastai.createInstance({
      image: 'ollama/ollama:latest',
      gpu_count: 1,
      gpu_type: 'RTX_4090',
      disk_space: 50, // GB
      env: {
        OLLAMA_HOST: '0.0.0.0:11434'
      },
      onstart: `
        tailscale up --authkey=${process.env.TAILSCALE_AUTH_KEY}
        ollama serve
      `
    });
    
    // Wait for instance to be ready
    await this.waitForHealthy(instance.id);
    
    // Register with agent-router
    await this.registerWithRouter(instance);
    
    return { action: 'scale_up', instance_id: instance.id };
  }
  
  /**
   * Terminate least-utilized instance
   */
  private async scaleDown(): Promise<ScalingResult> {
    const instances = await this.vastai.listInstances({ status: 'running' });
    
    // Find least utilized instance
    const utilizationData = await Promise.all(
      instances.map(async (i) => ({
        instance: i,
        utilization: await this.metrics.getUtilization(i.id)
      }))
    );
    
    const leastUtilized = utilizationData.sort((a, b) => 
      a.utilization - b.utilization
    )[0];
    
    // Deregister from router
    await this.deregisterFromRouter(leastUtilized.instance);
    
    // Terminate instance
    await this.vastai.destroyInstance(leastUtilized.instance.id);
    
    return { action: 'scale_down', instance_id: leastUtilized.instance.id };
  }
  
  /**
   * Wait for instance health check
   */
  private async waitForHealthy(instanceId: string): Promise<void> {
    const maxAttempts = 30; // 5 minutes
    
    for (let i = 0; i < maxAttempts; i++) {
      const instance = await this.vastai.getInstance(instanceId);
      
      if (instance.status === 'running') {
        // Check Ollama health
        try {
          const health = await fetch(`http://${instance.tailscale_ip}:11434/api/health`);
          if (health.ok) return;
        } catch (e) {
          // Not ready yet
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10s
    }
    
    throw new Error(`Instance ${instanceId} failed to become healthy`);
  }
  
  /**
   * Register instance with agent-router
   */
  private async registerWithRouter(instance: VastaiInstance): Promise<void> {
    await fetch('http://blueflynas.tailcf98b3.ts.net:4000/api/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ollama',
        endpoint: `http://${instance.tailscale_ip}:11434`,
        models: ['llama3.2:latest', 'codellama:latest'],
        gpu_type: instance.gpu_name,
        cost_per_hour: instance.dph_total
      })
    });
  }
}
```

**Deployment**:
```yaml
# deployments/nas/vastai-scaler.yml
version: '3.8'

services:
  vastai-scaler:
    image: registry.gitlab.com/blueflyio/agent-platform/agent-docker:latest
    command: npm run start:vastai-scaler
    
    environment:
      - VASTAI_API_KEY=${VASTAI_API_KEY}
      - TAILSCALE_AUTH_KEY=${TAILSCALE_AUTH_KEY}
      - SCALING_CHECK_INTERVAL=60000  # 1 minute
      - MIN_INSTANCES=1
      - MAX_INSTANCES=5
      - SCALE_UP_THRESHOLD=100
      - SCALE_DOWN_THRESHOLD=10
    
    restart: unless-stopped
    
    networks:
      - agent-platform

networks:
  agent-platform:
    external: true
```

#### Wednesday-Thursday (Feb 12-13): STASH-23 Container Deployments

**Deployment Automation**:
```typescript
// src/deployment/container-deployer.service.ts
import { Injectable } from '@nestjs/common';
import { Kubernetes } from '@kubernetes/client-node';

@Injectable()
export class ContainerDeployerService {
  private k8s: Kubernetes.AppsV1Api;
  
  /**
   * Deploy agent to Kubernetes
   */
  async deployAgent(config: AgentDeploymentConfig): Promise<DeploymentResult> {
    // 1. Validate OSSA manifest
    await this.validateOSSAManifest(config.manifest);
    
    // 2. Create namespace if not exists
    await this.ensureNamespace(config.namespace);
    
    // 3. Create deployment
    const deployment = await this.k8s.createNamespacedDeployment(
      config.namespace,
      this.buildDeploymentSpec(config)
    );
    
    // 4. Create service
    const service = await this.k8s.createNamespacedService(
      config.namespace,
      this.buildServiceSpec(config)
    );
    
    // 5. Wait for rollout
    await this.waitForRollout(config.namespace, config.agentId);
    
    return {
      deployment: deployment.body,
      service: service.body,
      status: 'deployed'
    };
  }
  
  /**
   * Build Kubernetes deployment spec from OSSA manifest
   */
  private buildDeploymentSpec(config: AgentDeploymentConfig): V1Deployment {
    return {
      metadata: {
        name: config.agentId,
        namespace: config.namespace,
        labels: {
          'app': config.agentId,
          'ossa.version': config.manifest.apiVersion,
          'role': config.manifest.spec.role,
          'tier': config.manifest.spec.access_tier
        }
      },
      spec: {
        replicas: config.manifest.spec.deployment.scaling.min_replicas,
        selector: {
          matchLabels: { app: config.agentId }
        },
        template: {
          metadata: {
            labels: { app: config.agentId }
          },
          spec: {
            containers: [{
              name: config.agentId,
              image: config.image,
              ports: [{
                containerPort: 3000,
                name: 'http'
              }],
              env: this.buildEnvVars(config),
              resources: {
                requests: {
                  cpu: config.manifest.spec.deployment.resources.cpu,
                  memory: config.manifest.spec.deployment.resources.memory
                },
                limits: {
                  cpu: config.manifest.spec.deployment.resources.cpu,
                  memory: config.manifest.spec.deployment.resources.memory
                }
              },
              livenessProbe: {
                httpGet: {
                  path: config.manifest.spec.monitoring.health_check,
                  port: 'http'
                },
                initialDelaySeconds: 30,
                periodSeconds: 10
              },
              readinessProbe: {
                httpGet: {
                  path: config.manifest.spec.monitoring.health_check,
                  port: 'http'
                },
                initialDelaySeconds: 10,
                periodSeconds: 5
              }
            }]
          }
        }
      }
    };
  }
}
```

---

## Technical Implementation

### OpenAPI First Design

```yaml
# spec/agent-docker.openapi.yaml
/api/deployments:
  get:
    summary: List deployments
    parameters:
      - name: namespace
        schema:
          type: string
      - name: status
        schema:
          type: string
          enum: [deploying, running, failed, stopped]
    responses:
      200:
        schema:
          type: array
          items:
            $ref: '#/components/schemas/Deployment'

  post:
    summary: Create new deployment
    requestBody:
      schema:
        $ref: '#/components/schemas/DeploymentConfig'
    responses:
      201:
        schema:
          $ref: '#/components/schemas/Deployment'

/api/deployments/{deploymentId}:
  get:
    summary: Get deployment details
  patch:
    summary: Update deployment
  delete:
    summary: Delete deployment

/api/deployments/{deploymentId}/scale:
  post:
    summary: Scale deployment
    requestBody:
      schema:
        type: object
        properties:
          replicas:
            type: integer

/api/deployments/{deploymentId}/rollback:
  post:
    summary: Rollback deployment

/api/nas/services:
  get:
    summary: List NAS services
    responses:
      200:
        schema:
          type: array
          items:
            $ref: '#/components/schemas/NASService'

/api/vastai/instances:
  get:
    summary: List Vast.ai instances
  post:
    summary: Launch new instance
    requestBody:
      schema:
        $ref: '#/components/schemas/VastaiInstanceConfig'

/api/vastai/instances/{instanceId}:
  get:
    summary: Get instance details
  delete:
    summary: Terminate instance

components:
  schemas:
    Deployment:
      type: object
      properties:
        id:
          type: string
        namespace:
          type: string
        agent_id:
          type: string
        status:
          type: string
        replicas:
          type: integer
        created_at:
          type: string
          format: date-time
    
    DeploymentConfig:
      type: object
      properties:
        agent_id:
          type: string
        namespace:
          type: string
        image:
          type: string
        manifest:
          type: object
    
    NASService:
      type: object
      properties:
        name:
          type: string
        port:
          type: integer
        status:
          type: string
        public_endpoint:
          type: string
    
    VastaiInstanceConfig:
      type: object
      properties:
        gpu_type:
          type: string
        gpu_count:
          type: integer
        image:
          type: string
```

### Full CRUD Implementation

**Deployments**:
- CREATE: Deploy agent to Kubernetes
- READ: Query deployment status and logs
- UPDATE: Update deployment configuration
- DELETE: Remove deployment

**NAS Services**:
- CREATE: Deploy new service to NAS
- READ: Query service status
- UPDATE: Update service configuration
- DELETE: Stop NAS service

**Vast.ai Instances**:
- CREATE: Launch GPU instance
- READ: Query instance status
- UPDATE: N/A (terminate and recreate)
- DELETE: Terminate instance

---

## Dependencies

### Upstream Dependencies
- **gitlab_components**: CI/CD templates
- **compliance-engine**: Service deployment
- **platform-agents**: Agent registry

### Downstream Dependencies
- **ALL PROJECTS**: Infrastructure foundation
- **Revenue**: ALL revenue blocked without infrastructure

---

## Success Metrics

### Week 2 Targets
```yaml
NAS_Services:
  Operational: 10/12
  Public_Endpoints: Configured
  Health_Checks: Passing

DevContainer:
  Status: Deployed
  Features: Complete
  VSCode_Extensions: Configured
```

### Week 3 Targets
```yaml
Vastai_Integration:
  Auto_Scaling: Operational
  GPU_Instances: Managed
  Cost_Optimization: Active

Container_Deployments:
  Kubernetes: Operational
  Agent_Deployments: Automated
  Monitoring: Complete

Quality:
  Test_Coverage: ">80%"
  All_Services_Healthy: true
```

---

## Next Immediate Actions (Monday, Feb 3)

```bash
# 1. Deploy remaining NAS services
cd /Volumes/AgentPlatform/repos/bare/blueflyio/agent-platform/agent-docker.git
git worktree add /Volumes/AgentPlatform/worktrees/shared/2025-02-03/agent-docker/nas-deployment main

# 2. Update docker-compose files
cd /Volumes/AgentPlatform/worktrees/shared/2025-02-03/agent-docker/nas-deployment/deployments/nas

# 3. Deploy services
docker-compose -f compliance-engine.yml up -d
docker-compose -f agent-router.yml up -d
docker-compose -f agent-brain.yml up -d
docker-compose -f workflow-engine.yml up -d

# 4. Verify
docker ps
curl http://blueflynas.tailcf98b3.ts.net:3010/health
```

---

## Quality Gates

- ✅ All NAS services operational (12/12)
- ✅ Public endpoints accessible via Cloudflare
- ✅ DevContainer deployed and tested
- ✅ Vast.ai auto-scaling operational
- ✅ Container deployment automation complete
- ✅ All health checks passing
- ✅ Monitoring operational
- ✅ All tests passing (>80% coverage)

---

## Revenue Enablement

**Blocked Revenue**: $2.05M/year (ALL revenue)
**Unblocking Date**: Week 2-3 completion

---

## Reference

- **NAS Repo**: `/Volumes/AgentPlatform/repos/bare/blueflyio/agent-platform/agent-docker.git`
- **NPM Package**: `@bluefly/agent-docker`
- **Master Coordination**: `00-MASTER-PROJECT-COORDINATION.md`
- **ai_assets.json**: Infrastructure paths and constants

---

**Status**: ⏳ AWAITING APPROVAL  
**Next Update**: Daily during Week 2-3  
**Owner**: Infrastructure Team
