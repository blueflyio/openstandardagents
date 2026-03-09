# Separation of Duties Reference

## Table of Contents
1. [Package Ownership Matrix](#package-ownership-matrix)
2. [Access Tiers](#access-tiers)
3. [Role Conflict Rules](#role-conflict-rules)
4. [Infrastructure Ownership](#infrastructure-ownership)

## Package Ownership Matrix

### @bluefly/agent-brain
**OWNS**: Vector search, semantic search, Qdrant, embeddings, RAG, codebase indexing, memories

```typescript
import { VectorSearchService } from '@bluefly/agent-brain';
import { CodebaseIndexer } from '@bluefly/agent-brain';
import { MemoryService } from '@bluefly/agent-brain';
```

### @bluefly/agent-docker
**OWNS**: Docker operations, Kubernetes operations, container management, deployment orchestration

```typescript
import { DockerService } from '@bluefly/agent-docker';
import { KubernetesService } from '@bluefly/agent-docker';
```

### @bluefly/agent-mesh
**OWNS**: Agent-to-agent communication, service mesh, coordination, discovery, transport, auth

```typescript
import { MeshCoordinator } from '@bluefly/agent-mesh';
import { MeshDiscovery } from '@bluefly/agent-mesh';
```

### @bluefly/agent-protocol
**OWNS**: MCP servers, MCP registry, protocol adapters, MCP integration

```typescript
import { MCPServerRegistry } from '@bluefly/agent-protocol';
import { ProtocolAdapter } from '@bluefly/agent-protocol';
```

### @bluefly/agent-router
**OWNS**: Agent routing, cost-aware routing, task routing, agent discovery, Vast.ai scaling

```typescript
import { CostAwareAgentRouter } from '@bluefly/agent-router';
import { VastaiScaler } from '@bluefly/agent-router/scaling';
```

### @bluefly/agent-tailscale
**OWNS**: ALL Tailscale code - subnet routing, DNS management, SSH access, certificates, webhooks, device management

```typescript
import { SubnetRouter } from '@bluefly/agent-tailscale/subnet';
import { TailscaleDNS } from '@bluefly/agent-tailscale/dns';
```

### @bluefly/agent-tracer
**OWNS**: Distributed tracing, OpenTelemetry, Phoenix integration, span management

```typescript
import { TracerService } from '@bluefly/agent-tracer';
import { SpanManager } from '@bluefly/agent-tracer';
```

### @bluefly/workflow-engine
**OWNS**: State machines, workflow definitions, step execution, workflow persistence

```typescript
import { WorkflowEngine } from '@bluefly/workflow-engine';
import { StateMachine } from '@bluefly/workflow-engine';
```

### @bluefly/foundation-bridge
**OWNS**: LLM provider integrations, model routing, provider abstraction

```typescript
import { LLMProvider } from '@bluefly/foundation-bridge';
import { ModelRouter } from '@bluefly/foundation-bridge';
```

### @bluefly/compliance-engine
**OWNS**: Compliance checks, audit logging, policy enforcement, OSSA validation

```typescript
import { ComplianceChecker } from '@bluefly/compliance-engine';
import { AuditLogger } from '@bluefly/compliance-engine';
```

### @bluefly/agentic-flows
**OWNS**: Multi-agent orchestration, flow definitions, agent coordination

```typescript
import { AgentOrchestrator } from '@bluefly/agentic-flows';
import { FlowEngine } from '@bluefly/agentic-flows';
```

### @bluefly/studio-ui
**OWNS**: React components, UI widgets, frontend state management

```typescript
import { AgentDashboard } from '@bluefly/studio-ui';
import { WorkflowEditor } from '@bluefly/studio-ui';
```

## Access Tiers

### tier_1_read (Analyzer/Observer)
**GitLab Scopes**: `read_api`, `read_repository`
**K8s RBAC**: `view` on assigned namespaces
**CAN**: Read code, run analysis, generate reports
**CANNOT**: Push code, create MRs, modify resources

### tier_2_write_limited (Reviewer/Orchestrator)
**GitLab Scopes**: `read_api`, `read_repository`, `write_repository` (limited)
**K8s RBAC**: `edit` on development namespaces only
**CAN**: Create MRs, comment on issues, orchestrate agents
**CANNOT**: Merge MRs, deploy to production, approve own work

### tier_3_full_access (Executor)
**GitLab Scopes**: `api` with approval rights
**K8s RBAC**: `edit` on assigned namespaces
**CAN**: Push code, create MRs, deploy to staging
**CANNOT**: Merge without review, deploy to production, approve own work

### tier_4_policy (Approver)
**GitLab Scopes**: `api` with approval rights
**K8s RBAC**: Custom `approver` role
**CAN**: Approve MRs, authorize production deployments
**CANNOT**: Push code, execute deployments directly

## Role Conflict Rules

| Role | Conflicts With | Reason |
|------|----------------|--------|
| Analyzer | Executor, Approver | Cannot fix what you audit |
| Reviewer | Executor, Approver | Cannot approve own changes |
| Executor | Reviewer, Approver | Cannot review/approve own work |
| Orchestrator | Executor (direct) | Coordinator cannot directly execute |
| Approver | Executor, Reviewer | Cannot approve if involved in creation |

### Runtime Enforcement
```typescript
// Executor cannot hand off to Reviewer for approval of own work
if (sourceAgent.role === 'EXECUTOR' && targetAgent.role === 'REVIEWER') {
  if (action === 'request_review') {
    throw new Error('Executor cannot request review from same workflow chain');
  }
}
```

## Infrastructure Ownership

| Component | Owner Package | Location |
|-----------|---------------|----------|
| Vast.ai scaling | @bluefly/agent-router | `src/scaling/vastai.ts` |
| Vast.ai events | @bluefly/agent-router | `src/infrastructure/deployment/vastai/events.ts` |
| Vast.ai registry | @bluefly/agent-mesh | `src/services/vastai-registry.service.ts` |
| Tailscale ALL | @bluefly/agent-tailscale | ALL Tailscale code |
| Cloudflare Tunnel | gitlab_components | CI/CD templates |
| NAS deployments | @bluefly/agent-docker | `deployments/nas/` |
| Webhook handling | platform-agents | `src/triggers/` |
