# 🧙‍♂️ OSSA Agent Wizard Guide
## Complete Deep Dive into Agent Architecture, Communication, and Backend Services

---

## 📚 Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Agent Type System](#agent-type-system)
3. [Communication Protocols](#communication-protocols)
4. [Agent Spawning & Lifecycle](#agent-spawning--lifecycle)
5. [Backend Services](#backend-services)
6. [Integration with Agent-BuildKit](#integration-with-agent-buildkit)
7. [Workflows & Orchestration](#workflows--orchestration)
8. [Best Practices](#best-practices)

---

## 1. System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   External Clients                           │
│          (Claude, Langflow, Custom Applications)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server Layer                          │
│         (JSON-RPC 2.0 over HTTP/WebSocket)                  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ossa_agent_  │  │ ossa_agent_  │  │ ossa_orches- │     │
│  │    list      │  │    spawn     │  │ trator_status│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              OSSA Orchestrator (Core Engine)                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Multi-Agent Coordination                      │  │
│  │  • Agent Pool Management                              │  │
│  │  • Workflow Execution                                 │  │
│  │  • TDD Enforcement                                    │  │
│  │  • __REBUILD_TOOLS Workflow                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ACAP Protocol│  │ RASP Parser  │  │  Health      │     │
│  │  (Capability │  │  (Roadmap-   │  │  Monitoring  │     │
│  │  Attestation)│  │   Aware Spec)│  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Agent Registry & Services                    │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Agent   │  │Execution │  │Specifi-  │  │ Webhook  │   │
│  │ Service  │  │ Service  │  │ cation   │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Agent Pool (Runtime)                      │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ Workers │  │Orchestra│  │ Critics │  │Governors│       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│  ┌─────────┐  ┌─────────┐                                  │
│  │  Judges │  │ Monitors│                                  │
│  └─────────┘  └─────────┘                                  │
└─────────────────────────────────────────────────────────────┘
```

### Component Relationships

```
MCP Server ──┐
             ├──> OSSA Orchestrator ──┐
BuildKit ────┘                         ├──> Agent Registry
                                       │
ACAP Protocol ────────────────────────┼──> Agent Pool
                                       │
RASP Parser ──────────────────────────┘
```

---

## 2. Agent Type System

### Core Agent Hierarchy

OSSA defines **6 specialized agent types** using TypeScript discriminated unions:

```typescript
// Base Agent Interface
interface Agent {
  id: string;
  type: AgentType; // Discriminator
  name: string;
  version: string;
  status: AgentStatus; // 'active' | 'idle' | 'busy' | 'error' | 'terminated'
  capabilities: AgentCapability[];
  configuration: Record<string, any>;
  metadata?: AgentMetadata;
  metrics?: AgentMetrics;
}

// Agent Types (Polymorphic)
type AgentUnion =
  | WorkerAgent      // Task execution
  | OrchestratorAgent // Coordination
  | CriticAgent      // Quality control
  | JudgeAgent       // Decision making
  | MonitorAgent     // Observability
  | GovernorAgent    // Policy enforcement
```

### Agent Type Characteristics

#### 1. **Worker Agent**
```typescript
interface WorkerAgent extends Agent {
  type: 'worker';
  specialization: 'data-processing' | 'api-integration' | 'file-handling' | 'validation';
  configuration: {
    max_concurrent_tasks?: number;
    timeout_seconds?: number;
    retry_attempts?: number;
    resource_limits?: {
      cpu?: string;
      memory?: string;
      disk?: string;
    };
  };
}
```

**Use Cases:**
- Execute specific tasks (API design, code generation, data transformation)
- Process data pipelines
- Handle API integrations
- Perform validation operations

#### 2. **Orchestrator Agent**
```typescript
interface OrchestratorAgent extends Agent {
  type: 'orchestrator';
  managed_agents?: string[]; // Child agent IDs
  configuration: {
    max_concurrent_workflows?: number;
    workflow_timeout_minutes?: number;
    enable_parallel_execution?: boolean;
    scheduling_strategy?: 'fifo' | 'priority' | 'round-robin' | 'load-balanced';
  };
}
```

**Use Cases:**
- Coordinate multi-agent workflows
- Manage complex task dependencies
- Load balancing across worker agents
- __REBUILD_TOOLS workflow execution

#### 3. **Critic Agent**
```typescript
interface CriticAgent extends Agent {
  type: 'critic';
  configuration: {
    quality_threshold?: number;
    automated_fixes?: boolean;
    review_categories?: ('code-quality' | 'security' | 'performance' | 'compliance')[];
    severity_levels?: ('low' | 'medium' | 'high' | 'critical')[];
  };
}
```

**Use Cases:**
- Code quality validation
- Security scanning
- Performance analysis
- Compliance checking

#### 4. **Judge Agent**
```typescript
interface JudgeAgent extends Agent {
  type: 'judge';
  configuration: {
    decision_model?: 'consensus' | 'majority' | 'weighted' | 'ai-assisted';
    confidence_threshold?: number;
    voting_timeout_seconds?: number;
    quorum_percentage?: number;
  };
}
```

**Use Cases:**
- Conflict resolution
- Decision making with multiple inputs
- Voting and consensus building
- AI-assisted arbitration

#### 5. **Monitor Agent**
```typescript
interface MonitorAgent extends Agent {
  type: 'monitor';
  configuration: {
    monitoring_interval_seconds?: number;
    alert_thresholds?: {
      cpu_percent?: number;
      memory_percent?: number;
      error_rate_percent?: number;
      response_time_ms?: number;
    };
    notification_channels?: ('email' | 'slack' | 'webhook' | 'sms')[];
  };
}
```

**Use Cases:**
- System health monitoring
- Performance metrics collection
- Alert generation
- Real-time observability

#### 6. **Governor Agent**
```typescript
interface GovernorAgent extends Agent {
  type: 'governor';
  configuration: {
    policy_enforcement_level?: 'strict' | 'moderate' | 'permissive';
    compliance_frameworks?: ('ISO42001' | 'NIST-AI-RMF' | 'EU-AI-ACT' | 'SOX' | 'HIPAA')[];
    audit_retention_days?: number;
    auto_remediation?: boolean;
  };
}
```

**Use Cases:**
- Policy enforcement
- Compliance validation
- Audit logging
- Security governance

### Agent Capability System

```typescript
interface AgentCapability {
  name: string;                    // e.g., "api-design", "code-generation"
  description: string;
  version: string;
  input_schema?: JSONSchema;       // JSON Schema for inputs
  output_schema?: JSONSchema;      // JSON Schema for outputs
  parameters?: CapabilityParameter[];
  examples?: CapabilityExample[];
  requirements?: string[];         // Dependencies
  limitations?: string[];
  cost_factor?: number;           // Execution cost multiplier
}
```

---

## 3. Communication Protocols

### 3.1 MCP (Model Context Protocol)

**Purpose**: External tool integration for AI models (Claude, Langflow)

**Protocol**: JSON-RPC 2.0 over HTTP/WebSocket

**Implementation**: `/Users/flux423/Sites/LLM/OSSA/src/mcp/ossa-mcp-server.ts`

#### MCP Message Flow

```
Client                MCP Server              OSSA Orchestrator
  │                        │                          │
  │  initialize            │                          │
  │───────────────────────>│                          │
  │                        │                          │
  │  capabilities          │                          │
  │<───────────────────────│                          │
  │                        │                          │
  │  tools/list            │                          │
  │───────────────────────>│                          │
  │                        │                          │
  │  tools (ossa_agent_*)  │                          │
  │<───────────────────────│                          │
  │                        │                          │
  │  tools/call            │                          │
  │  (ossa_agent_spawn)    │                          │
  │───────────────────────>│  spawnSpecializedAgent() │
  │                        │─────────────────────────>│
  │                        │                          │
  │                        │  Agent Created           │
  │                        │<─────────────────────────│
  │  result                │                          │
  │<───────────────────────│                          │
```

#### Available MCP Tools

1. **ossa_agent_list** - List all registered agents
   ```json
   {
     "name": "ossa_agent_list",
     "inputSchema": {
       "type": "object",
       "properties": {
         "filter": { "type": "string" }
       }
     }
   }
   ```

2. **ossa_agent_spawn** - Spawn a new agent
   ```json
   {
     "name": "ossa_agent_spawn",
     "inputSchema": {
       "type": "object",
       "required": ["type", "name"],
       "properties": {
         "type": { "type": "string" },
         "name": { "type": "string" }
       }
     }
   }
   ```

3. **ossa_orchestrator_status** - Get orchestrator status
   ```json
   {
     "name": "ossa_orchestrator_status",
     "inputSchema": { "type": "object" }
   }
   ```

#### MCP Configuration

**Client Setup (Claude Code):**
```json
{
  "mcpServers": {
    "ossa": {
      "command": "node",
      "args": ["/Users/flux423/Sites/LLM/OSSA/src/mcp/ossa-mcp-server.ts"],
      "env": {
        "PORT": "4000"
      }
    }
  }
}
```

**Server Endpoints:**
- HTTP: `http://localhost:4000/mcp`
- WebSocket: `ws://localhost:4000`
- Health: `http://localhost:4000/health`
- Capabilities: `http://localhost:4000/capabilities`

### 3.2 ACAP (Agent Capability Attestation Protocol)

**Purpose**: Verifiable capability attestation using challenge-response + W3C Verifiable Credentials

**Implementation**: `/Users/flux423/Sites/LLM/OSSA/src/protocols/acap.ts`

#### ACAP Flow

```
Orchestrator          ACAP Protocol            Agent
     │                      │                    │
     │  verifyCapability()  │                    │
     │─────────────────────>│                    │
     │                      │  Challenge         │
     │                      │───────────────────>│
     │                      │                    │
     │                      │  Response          │
     │                      │<───────────────────│
     │                      │                    │
     │                      │  Sign & Attest     │
     │                      │──────────┐         │
     │                      │          │         │
     │                      │<─────────┘         │
     │  CapabilityAttestation│                    │
     │<─────────────────────│                    │
     │                      │                    │
     │  generateCredential()│                    │
     │─────────────────────>│                    │
     │                      │                    │
     │  VerifiableCredential│                    │
     │<─────────────────────│                    │
```

#### Data Structures

**Capability Attestation:**
```typescript
interface CapabilityAttestation {
  id: string;
  agentId: string;
  capability: string;
  version: string;
  attestedAt: Date;
  signature: string;          // HMAC-SHA256 signature
  proof: AttestationProof;
  status: 'valid' | 'invalid' | 'expired';
}

interface AttestationProof {
  challenge: string;          // Random 32-byte hex
  response: string;           // Agent's response hash
  witness?: string;           // Optional third-party witness
  metadata: Record<string, any>;
}
```

**Verifiable Credential (W3C Standard):**
```typescript
interface VerifiableCredential {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://ossa.org/credentials/v1'
  ];
  id: string;
  type: ['VerifiableCredential', 'AgentCapabilityCredential'];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    id: string;                    // Agent ID
    capabilities: string[];
    attestations: CapabilityAttestation[];
  };
  proof: {
    type: 'JsonWebSignature2020';
    created: string;
    verificationMethod: string;
    proofPurpose: 'assertionMethod';
    jws: string;                   // JSON Web Signature
  };
}
```

#### Usage Example

```typescript
import { ACAPProtocol } from './protocols/acap';

const acap = new ACAPProtocol('ossa:acap:v1');

// Verify agent capability
const attestation = await acap.verifyCapability(agent, 'api-design');

// Generate verifiable credential
const credential = acap.generateCredential(agent, [attestation]);

// credential.proof.jws can be verified by external parties
```

### 3.3 RASP (Roadmap-Aware Specification Protocol)

**Purpose**: Auto-generate OpenAPI specs from ROADMAP.md annotations

**Implementation**: `/Users/flux423/Sites/LLM/OSSA/src/protocols/rasp.ts`

#### RASP Workflow

```
ROADMAP.md  ───>  RASP Parser  ───>  OpenAPI Spec  ───>  Agent Implementation
                      │                   │
                      │                   │
                   Extracts:          Generates:
                   • Phases           • Paths
                   • Commands         • Schemas
                   • Tasks            • Operations
                   • Annotations      • Examples
```

#### Roadmap Annotations

**Supported Annotation Patterns:**

1. **Phase Detection**
   ```markdown
   ## Phase 1: Foundation Setup
   ```

2. **Priority Extraction**
   ```markdown
   **Priority**: CRITICAL
   **Priority**: HIGH
   ```

3. **Command Blocks**
   ```markdown
   ```bash
   ossa agent spawn --type worker
   ossa workflow execute
   ```
   ```

4. **Task Lists with Status**
   ```markdown
   - [ ] **API Design** - Create OpenAPI spec
   - [x] **Testing** - Implement E2E tests
   ```

#### Generated OpenAPI Structure

```yaml
openapi: 3.1.0
info:
  title: "OSSA Roadmap-Generated Specification"
  version: "0.1.9"
paths:
  /api/v1/agent/spawn:
    post:
      summary: "Execute ossa agent spawn"
      tags: ["phase-1"]
      operationId: "ossa_agent_spawn"
      requestBody:
        content:
          application/json:
            schema:
              type: object
```

#### Usage Example

```typescript
import { parseRoadmapToSpec } from './protocols/rasp';

// Parse ROADMAP.md and generate spec
const spec = parseRoadmapToSpec(
  './ROADMAP.md',
  './generated-spec.yml'
);

// Spec is automatically written to file
```

---

## 4. Agent Spawning & Lifecycle

### 4.1 Agent Spawning Process

```
┌─────────────────────────────────────────────────────────┐
│                  Agent Spawn Request                     │
│  (via MCP, BuildKit CLI, or Direct API)                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│         OSSA Orchestrator.spawnSpecializedAgent()       │
│                                                          │
│  1. Generate unique agent ID                            │
│  2. Map agent type (worker/orchestrator/critic/etc)     │
│  3. Create agent configuration                          │
│  4. Validate OSSA compliance                            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              OSSA Compliance Validation                  │
│                                                          │
│  ✓ Required capabilities: execute, report, validate     │
│  ✓ Valid metadata: author, created, tags                │
│  ✓ Version format: semver (X.Y.Z)                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                  ✓ Pass │ ✗ Fail
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│               Agent Registration                         │
│                                                          │
│  1. Add to agent pool (Map<id, Agent>)                  │
│  2. Auto-register with platform (if enabled)            │
│  3. Emit 'agent:spawned' event                          │
│  4. Start health monitoring                             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│             Agent Ready for Execution                    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Agent Lifecycle States

```typescript
enum AgentStatus {
  IDLE = 'idle',           // Ready for tasks
  BUSY = 'busy',           // Executing task
  ERROR = 'error',         // Error state
  TERMINATED = 'terminated' // Shut down
}
```

**State Transitions:**
```
    spawn()
       │
       ▼
    [IDLE] ────execute()────> [BUSY]
       ▲                         │
       │                         │
       │ complete()              │ error()
       │                         │
       └────────────<────────────┘
                                 │
                                 │ terminate()
                                 ▼
                            [TERMINATED]
```

### 4.3 Health Monitoring

```typescript
// Automatic health checks (every 30s by default)
async manageAgentLifecycle(agentId: string): Promise<void> {
  const interval = setInterval(async () => {
    const health = await checkAgentHealth(agentId);

    if (!health.healthy) {
      await attemptAgentRecovery(agentId);
    }
  }, agent.config.healthCheckInterval || 30000);

  // Cleanup on shutdown
  this.on(`agent:${agentId}:shutdown`, async () => {
    clearInterval(interval);
    await cleanupAgent(agentId);
    this.agentPool.delete(agentId);
  });
}
```

### 4.4 Agent Spawning via BuildKit

**CLI Commands:**
```bash
# Spawn worker agent
buildkit agents spawn \
  --type worker \
  --name "api-designer" \
  --capabilities "api-design,openapi-generation"

# Spawn orchestrator
buildkit agents spawn \
  --type orchestrator \
  --name "workflow-coordinator" \
  --managed-agents "worker-1,worker-2,critic-1"

# Spawn with auto-registration
buildkit agents spawn \
  --type critic \
  --name "code-reviewer" \
  --auto-register \
  --health-interval 60
```

**Agent Discovery:**
```bash
# List all agents
buildkit agents list

# Search by capability
buildkit agents search --capability "api-design"

# Filter by type
buildkit agents list --type worker --status active
```

---

## 5. Backend Services

### Service Architecture

```
┌──────────────────────────────────────────────────────┐
│              Backend Services Layer                   │
│                                                       │
│  ┌────────────────┐  ┌────────────────┐            │
│  │  AgentService  │  │ExecutionService│            │
│  │                │  │                │            │
│  │ • create()     │  │ • execute()    │            │
│  │ • list()       │  │ • getStatus()  │            │
│  │ • get()        │  │ • cancel()     │            │
│  │ • update()     │  │ • stream()     │            │
│  │ • delete()     │  └────────────────┘            │
│  └────────────────┘                                 │
│                                                       │
│  ┌────────────────┐  ┌────────────────┐            │
│  │Specification   │  │ WebhookService │            │
│  │   Service      │  │                │            │
│  │                │  │ • register()   │            │
│  │ • validate()   │  │ • trigger()    │            │
│  │ • generate()   │  │ • list()       │            │
│  │ • bundle()     │  └────────────────┘            │
│  └────────────────┘                                 │
└──────────────────────────────────────────────────────┘
```

### 5.1 AgentService

**Location**: `/src/server/services/AgentService.ts`

```typescript
class AgentService {
  async create(request: CreateAgentRequest): Promise<Agent> {
    const agent: Agent = {
      id: `agent-${Date.now()}`,
      type: request.type,
      name: request.name,
      version: request.version || '1.0.0',
      status: 'active',
      capabilities: request.capabilities,
      configuration: request.configuration || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store in registry
    // Emit agent.created event
    // Trigger webhooks

    return agent;
  }

  async list(query: AgentListQuery): Promise<AgentListResponse> {
    // Filter by type, status, capabilities
    // Paginate results
    // Return with metadata
  }

  async update(id: string, request: UpdateAgentRequest): Promise<Agent> {
    // Optimistic locking with expected_version
    // Partial updates
    // Emit agent.updated event
  }
}
```

### 5.2 ExecutionService

**Handles agent task execution with async support:**

```typescript
class ExecutionService {
  async execute(
    agentId: string,
    request: ExecutionRequest
  ): Promise<AsyncExecutionResponse> {
    const executionId = uuidv4();

    // Create execution context
    const execution = {
      id: executionId,
      agentId,
      status: 'pending',
      operation: request.operation,
      input: request.input,
      context: request.context,
      started_at: new Date().toISOString()
    };

    // Emit execution.started event
    this.emit('execution.started', { executionId, agentId });

    // Execute asynchronously
    this.runAsync(execution);

    return {
      execution_id: executionId,
      status: 'pending',
      progress_url: `/executions/${executionId}`,
      websocket_url: `ws://server/executions/${executionId}`,
      started_at: execution.started_at
    };
  }

  async getStatus(executionId: string): Promise<ExecutionStatusResponse> {
    // Return current status, progress, logs
  }

  async stream(executionId: string): AsyncIterator<ExecutionProgress> {
    // Server-Sent Events for real-time updates
  }
}
```

### 5.3 SpecificationService

**OpenAPI spec management:**

```typescript
class SpecificationService {
  async validate(spec: OpenAPISpec): Promise<ValidationResult> {
    // Use @redocly/cli for validation
    // Check OSSA compliance
    // Return detailed errors
  }

  async generate(agentId: string): Promise<OpenAPISpec> {
    // Generate spec from agent capabilities
    // Include all operations, schemas
    // Add examples from execution history
  }

  async bundle(specIds: string[]): Promise<OpenAPISpec> {
    // Merge multiple specs
    // Resolve conflicts
    // Generate unified documentation
  }
}
```

### 5.4 WebhookService

**Event-driven notifications:**

```typescript
class WebhookService {
  async register(webhook: WebhookRegistration): Promise<Webhook> {
    // Store webhook configuration
    // Validate URL
    // Set up retry policy
  }

  async trigger(event: AgentEvent): Promise<void> {
    // Find matching webhooks
    // POST event payload
    // Retry on failure (exponential backoff)
    // Track delivery metrics
  }
}
```

---

## 6. Integration with Agent-BuildKit

### 6.1 BuildKit CLI Integration

**OSSA + BuildKit Architecture:**

```
┌────────────────────────────────────────────────────┐
│               BuildKit CLI (68 Commands)            │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ Agent Management (agents, agent-enhanced)    │ │
│  │  • buildkit agents spawn                     │ │
│  │  • buildkit agents list                      │ │
│  │  • buildkit agent "spawn api designer"       │ │
│  └─────────────────────┬────────────────────────┘ │
└────────────────────────┼──────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────┐
│            OSSA Orchestrator (via MCP)              │
│                                                     │
│  • Receives spawn requests                         │
│  • Creates OSSA-compliant agents                   │
│  • Registers in shared workspace                   │
│  • Returns agent metadata                          │
└────────────────────────┬───────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────┐
│     Shared Workspace (/Users/flux423/Sites/       │
│              LLM/.agent-workspace)                 │
│                                                     │
│  .agents/                                          │
│  ├── workers/                                      │
│  │   ├── api-designer/                            │
│  │   └── code-generator/                          │
│  ├── orchestrators/                                │
│  └── critics/                                      │
└────────────────────────────────────────────────────┘
```

### 6.2 Shared Workspace Structure

**Location**: `/Users/flux423/Sites/LLM/.agent-workspace`

```
.agent-workspace/
├── .agents/
│   ├── registry.yml              # Central registry
│   ├── orchestrators/
│   │   ├── ossa-orchestrator/
│   │   │   ├── spec.yml
│   │   │   ├── implementation.ts
│   │   │   └── tests/
│   │   └── workflow-coordinator/
│   ├── workers/
│   │   ├── api-designer/
│   │   ├── code-generator/
│   │   └── data-processor/
│   ├── critics/
│   │   ├── code-reviewer/
│   │   └── security-scanner/
│   ├── governors/
│   │   └── compliance-enforcer/
│   └── monitors/
│       └── health-tracker/
├── executions/                    # Execution history
├── metrics/                       # Performance data
└── logs/                         # Agent logs
```

### 6.3 BuildKit Commands for OSSA

**Agent Operations:**
```bash
# Spawn agent with BuildKit
buildkit agents spawn \
  --type worker \
  --name "openapi-generator" \
  --capabilities "openapi,api-design" \
  --workspace /Users/flux423/Sites/LLM/.agent-workspace

# Enhanced natural language spawning
buildkit agent "create a worker agent for API validation"

# List agents with filtering
buildkit agents list --type orchestrator --status active

# Agent discovery
buildkit agents search --capability "api-design" --domain "rest"

# Agent execution
buildkit agents execute \
  --agent-id worker-123 \
  --operation "generate-spec" \
  --input '{"service": "User API"}'
```

**Workspace Operations:**
```bash
# Initialize OSSA workspace
buildkit workspace init --ossa-version 0.1.9

# Sync workspace with registry
buildkit workspace sync

# Validate workspace structure
buildkit workspace validate

# Create workspace snapshot
buildkit workspace snapshot --name "pre-deployment"
```

**Registry Management:**
```bash
# Merge agent registries
buildkit registry merge \
  --source ./project-a/.agents/registry.yml \
  --target /Users/flux423/Sites/LLM/.agent-workspace/.agents/registry.yml

# Validate registry
buildkit registry validate

# Export registry
buildkit registry export --format json > agents.json
```

### 6.4 TDD Workflow with OSSA

**BuildKit enforces TDD cycle for agent development:**

```bash
# Phase 1: RED - Write failing test
git commit -m "RED: add test for api-design capability"
# Pipeline MUST see failing tests

# Phase 2: GREEN - Implement capability
git commit -m "GREEN: implement api-design capability"
# Pipeline MUST see passing tests

# Phase 3: REFACTOR - Optimize
git commit -m "REFACTOR: optimize api-design algorithm"
# Pipeline MUST still see passing tests
```

**Agent Testing Structure:**
```
.agents/workers/api-designer/
├── spec.yml
├── implementation.ts
├── tests/
│   ├── unit/
│   │   ├── capability.test.ts
│   │   └── validation.test.ts
│   ├── integration/
│   │   └── workflow.test.ts
│   └── e2e/
│       └── full-cycle.test.ts
└── coverage/
    └── lcov.info
```

---

## 7. Workflows & Orchestration

### 7.1 Feedback Loop Workflow

**OSSA implements 6-phase feedback loop:**

```
┌─────────────────────────────────────────────────┐
│           Feedback Loop Phases                  │
│                                                 │
│  1. PLAN    (5K tokens)  ──> Strategy          │
│  2. EXECUTE (30K tokens) ──> Implementation    │
│  3. REVIEW  (10K tokens) ──> Quality Check     │
│  4. JUDGE   (5K tokens)  ──> Decision          │
│  5. LEARN   (10K tokens) ──> Adaptation        │
│  6. GOVERN  (5K tokens)  ──> Compliance        │
│                                                 │
│  Total Budget: 65K tokens per iteration         │
└─────────────────────────────────────────────────┘
```

**Implementation:**
```typescript
interface FeedbackLoopPhase {
  name: 'plan' | 'execute' | 'review' | 'judge' | 'learn' | 'govern';
  agents: string[];              // Agent IDs participating
  status: 'pending' | 'running' | 'complete' | 'failed';
  budget: {
    tokens: number;
    used: number;
  };
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  phases: FeedbackLoopPhase[];
  currentPhase: number;
  budget: {
    totalTokens: number;
    usedTokens: number;
    timeLimit: number;
  };
  startTime: Date;
  metrics: {
    agentsUsed: number;
    tasksCompleted: number;
    errors: number;
    performance: Record<string, any>;
  };
}
```

### 7.2 __REBUILD_TOOLS Workflow

**Automatic tool rebuilding when failure threshold exceeded:**

```typescript
async executeRebuildToolsWorkflow(targetTools: string[]): Promise<void> {
  const workflow: Workflow = {
    id: `rebuild-tools-${uuidv4()}`,
    name: '__REBUILD_TOOLS Workflow',
    steps: [
      {
        id: 'analyze-tools',
        agent: 'analyzer',
        action: 'analyze',
        inputs: { tools: targetTools }
      },
      {
        id: 'generate-tests',
        agent: 'test-generator',
        action: 'generate',
        inputs: { coverage: 80 },
        dependencies: ['analyze-tools']
      },
      {
        id: 'rebuild-tools',
        agent: 'builder',
        action: 'rebuild',
        inputs: { apiFirst: true },
        dependencies: ['generate-tests']
      },
      {
        id: 'validate-rebuild',
        agent: 'validator',
        action: 'validate',
        dependencies: ['rebuild-tools']
      }
    ]
  };

  await this.executeWorkflow(workflow, { tokens: 50000, timeLimit: 3600 });
}
```

**Trigger Conditions:**
```typescript
private async checkRebuildThreshold(event: any): Promise<void> {
  const { tool, failureCount } = event;
  const threshold = this.rebuildToolsConfig.rebuildThreshold; // Default: 5

  if (failureCount >= threshold) {
    console.log(`Tool ${tool} exceeded failure threshold`);
    await this.executeRebuildToolsWorkflow([tool]);
  }
}
```

### 7.3 Multi-Agent Coordination

**Coordination Strategies:**

1. **Parallel** - All agents execute simultaneously
2. **Sequential** - Agents execute in dependency order
3. **Adaptive** - Automatically choose based on workflow

```typescript
async coordinateMultiAgentWorkflow(
  workflow: Workflow,
  strategy: 'parallel' | 'sequential' | 'adaptive' = 'adaptive'
): Promise<string> {

  if (strategy === 'adaptive') {
    strategy = this.determineOptimalStrategy(workflow);
  }

  switch (strategy) {
    case 'parallel':
      return this.executeParallelCoordination(workflow);
    case 'sequential':
      return this.executeSequentialCoordination(workflow);
  }
}

private determineOptimalStrategy(workflow: Workflow): 'parallel' | 'sequential' {
  const hasDependencies = workflow.steps.some(
    step => step.dependencies && step.dependencies.length > 0
  );
  return hasDependencies ? 'sequential' : 'parallel';
}
```

---

## 8. Best Practices

### 8.1 Agent Design Principles

1. **Single Responsibility** - Each agent should have one clear purpose
2. **Capability-Driven** - Define explicit capabilities with schemas
3. **OSSA Compliance** - Always validate against OSSA v0.1.9 standards
4. **Versioning** - Use semantic versioning (X.Y.Z)
5. **Metadata** - Include comprehensive metadata (author, tags, description)

### 8.2 Communication Best Practices

1. **Use MCP for External Integration** - Standardized JSON-RPC interface
2. **ACAP for Capability Verification** - Ensure agents can do what they claim
3. **RASP for Roadmap Tracking** - Keep specs in sync with roadmap
4. **Event-Driven Architecture** - Use events for agent coordination
5. **Webhook Notifications** - External systems stay informed

### 8.3 Workflow Design

1. **Token Budgeting** - Allocate tokens per phase
2. **Error Handling** - Graceful degradation and retry policies
3. **Progress Tracking** - Real-time status updates
4. **Audit Logging** - Complete execution history
5. **Performance Monitoring** - Track metrics for optimization

### 8.4 Testing Strategy

1. **TDD Enforcement** - RED → GREEN → REFACTOR cycle
2. **Unit Tests** - Test individual capabilities
3. **Integration Tests** - Test agent interactions
4. **E2E Tests** - Test complete workflows
5. **Coverage Requirements** - Minimum 80% coverage

### 8.5 Deployment

1. **Health Monitoring** - Automatic health checks every 30s
2. **Auto-Recovery** - Attempt recovery on failure
3. **Graceful Shutdown** - Clean up resources properly
4. **Load Balancing** - Distribute work across agents
5. **Scaling** - Horizontal scaling for orchestrators

---

## 🎯 Quick Reference

### Essential Files

| File | Purpose |
|------|---------|
| `src/types/agents/index.ts` | Core agent type definitions |
| `src/server/types/agent.ts` | Complete TypeScript types |
| `src/mcp/ossa-mcp-server.ts` | MCP server implementation |
| `src/protocols/acap.ts` | Capability attestation protocol |
| `src/protocols/rasp.ts` | Roadmap-aware specification |
| `src/core/orchestrator/ossa-orchestrator.ts` | Main orchestrator |
| `src/server/services/AgentService.ts` | Agent CRUD operations |

### Key Commands

```bash
# OSSA Operations
npm run mcp:server              # Start MCP server
npm run api:validate:complete   # Validate OpenAPI specs

# BuildKit Operations
buildkit agents spawn           # Spawn agent
buildkit workspace init         # Initialize workspace
buildkit registry validate      # Validate registry
buildkit agent "spawn worker"   # Natural language spawn

# Development
npm run build                   # Build TypeScript
npm run test                    # Run tests
npm run lint                    # Lint code
```

### Agent Types Quick Reference

| Type | Purpose | Key Config |
|------|---------|-----------|
| Worker | Task execution | `max_concurrent_tasks`, `timeout_seconds` |
| Orchestrator | Coordination | `scheduling_strategy`, `max_concurrent_workflows` |
| Critic | Quality control | `quality_threshold`, `review_categories` |
| Judge | Decision making | `decision_model`, `confidence_threshold` |
| Monitor | Observability | `monitoring_interval_seconds`, `alert_thresholds` |
| Governor | Policy enforcement | `policy_enforcement_level`, `compliance_frameworks` |

---

## 📚 Additional Resources

- [OSSA Specification](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/api/GETTING_STARTED.md)
- [Tutorial Collection](./docs/api/TUTORIALS.md)
- [Agent-BuildKit Documentation](../agent_buildkit/README.md)
- [Golden Workflow Guide](../.gitlab/components/workflow/README.md)

---

*Last Updated: 2025-10-02*
*OSSA Version: 0.1.9*
*Agent-BuildKit Version: 0.1.62*
