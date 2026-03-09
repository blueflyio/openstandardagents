# Package Ownership Reference

## Table of Contents
1. [Quick Decision Guide](#quick-decision-guide)
2. [Import Patterns](#import-patterns)
3. [Port Allocation](#port-allocation)
4. [Container vs Git Repo](#container-vs-git-repo)

## Quick Decision Guide

**Question**: What are you building?

| Building... | Use This Package |
|-------------|-----------------|
| Agent routing, cost routing, discovery | `@bluefly/agent-router` |
| Agent communication, mesh, coordination | `@bluefly/agent-mesh` |
| Vector search, RAG, embeddings, Qdrant | `@bluefly/agent-brain` |
| Tracing, observability, OpenTelemetry | `@bluefly/agent-tracer` |
| Docker, Kubernetes, containers | `@bluefly/agent-docker` |
| Tailscale, VPN, private network | `@bluefly/agent-tailscale` |
| Workflows, state machines | `@bluefly/workflow-engine` |
| MCP servers, protocol adapters | `@bluefly/agent-protocol` |
| LLM providers, model routing | `@bluefly/foundation-bridge` |
| Compliance, audit, policies | `@bluefly/compliance-engine` |
| Multi-agent orchestration | `@bluefly/agentic-flows` |
| React UI components | `@bluefly/studio-ui` |
| CLI commands | `agent-buildkit` (imports common_npm) |
| Agent definitions (OSSA) | `platform-agents/packages/@ossa/` |
| CI/CD pipelines | `gitlab_components` |
| API schemas | `api-schema-registry` |
| Security policies | `security-policies` |
| Drupal modules | `all_drupal_custom/modules/` |

## Import Patterns

### Agent Router
```typescript
import { 
  CostAwareAgentRouter,
  AgentRouter,
  TaskRouter,
  VastaiScaler 
} from '@bluefly/agent-router';
import { VastaiEvents } from '@bluefly/agent-router/events';
```

### Agent Mesh
```typescript
import {
  MeshCoordinator,
  MeshDiscovery,
  MeshTransport,
  AgentRegistry
} from '@bluefly/agent-mesh';
```

### Agent Brain
```typescript
import {
  VectorSearchService,
  CodebaseIndexer,
  MemoryService,
  QdrantClient
} from '@bluefly/agent-brain';
```

### Agent Tracer
```typescript
import {
  TracerService,
  SpanManager,
  PhoenixIntegration
} from '@bluefly/agent-tracer';
```

### Agent Docker
```typescript
import {
  DockerService,
  KubernetesService,
  ContainerOrchestrator
} from '@bluefly/agent-docker';
```

### Agent Tailscale
```typescript
import { SubnetRouter } from '@bluefly/agent-tailscale/subnet';
import { TailscaleDNS } from '@bluefly/agent-tailscale/dns';
import { SSHAccess } from '@bluefly/agent-tailscale/ssh';
import { DeviceManager } from '@bluefly/agent-tailscale/devices';
```

### Workflow Engine
```typescript
import {
  WorkflowEngine,
  StateMachine,
  StepExecutor,
  WorkflowPersistence
} from '@bluefly/workflow-engine';
```

### Agent Protocol
```typescript
import {
  MCPServerRegistry,
  MCPIntegration,
  ProtocolAdapter
} from '@bluefly/agent-protocol';
```

### Foundation Bridge
```typescript
import {
  LLMProvider,
  ModelRouter,
  ProviderFactory
} from '@bluefly/foundation-bridge';
```

### Compliance Engine
```typescript
import {
  ComplianceChecker,
  AuditLogger,
  PolicyEnforcer,
  OSSAValidator
} from '@bluefly/compliance-engine';
```

### Agentic Flows
```typescript
import {
  AgentOrchestrator,
  FlowEngine,
  MultiAgentCoordinator
} from '@bluefly/agentic-flows';
```

### Studio UI
```typescript
import {
  AgentDashboard,
  WorkflowEditor,
  MonitoringPanel
} from '@bluefly/studio-ui';
```

## Port Allocation

### Agent Services (3000-3015)
| Port | Service | Package |
|------|---------|---------|
| 3000 | Agent Brain | @bluefly/agent-brain |
| 3001 | Agent Chat | @bluefly/agent-chat |
| 3002 | Agent Docker | @bluefly/agent-docker |
| 3003 | Agent Mesh | @bluefly/agent-mesh |
| 3004 | Agent Ops | @bluefly/agent-ops |
| 3005 | Agent Protocol | @bluefly/agent-protocol |
| 3006 | Agent Router | @bluefly/agent-router |
| 3007 | Agent Studio | @bluefly/agent-studio |
| 3008 | Agent Tracer | @bluefly/agent-tracer |
| 3009 | Agentic Flows | @bluefly/agentic-flows |
| 3010 | Compliance Engine | @bluefly/compliance-engine |
| 3011 | Doc Engine | @bluefly/doc-engine |
| 3012 | Foundation Bridge | @bluefly/foundation-bridge |
| 3013 | RFP Automation | @bluefly/rfp-automation |
| 3014 | Studio UI | @bluefly/studio-ui |
| 3015 | Workflow Engine | @bluefly/workflow-engine |

### Infrastructure
| Port | Service |
|------|---------|
| 4000 | LiteLLM Gateway |
| 5432 | PostgreSQL |
| 6379 | Redis |
| 6333 | Qdrant |
| 9000 | MinIO S3 |
| 9090 | Prometheus |
| 11434 | Ollama |
| 27017 | MongoDB |

### ML Models (5000-5003)
| Port | Model |
|------|-------|
| 5000 | agent-studio_model |
| 5001 | civicpolicy_model |
| 5002 | gov-rfp_model |
| 5003 | llm-platform_model |

## Container vs Git Repo

### Container Directories (NO git init, NO root files)
- `common_npm/` - Contains 18 independent git repos
- `models/` - Contains 4 ML model repos
- `all_drupal_custom/` - Contains Drupal modules/themes/recipes

### Git Repositories (Independent projects)
- `agent-buildkit/`
- `platform-agents/`
- `demo_llm-platform/`
- `technical-docs/`
- `gitlab_components/`
- `api-schema-registry/`
- `security-policies/`
- Each subdirectory in containers

### Special Directories
- `.worktrees/` - Active development worktrees
- `WIKIs/` - Local wiki clones
- `.agents/` - OSSA agent data (DO NOT MODIFY)
- `.agents-workspace/` - Workspace governance (DO NOT MODIFY)
