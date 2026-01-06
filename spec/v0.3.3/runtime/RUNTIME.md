# OSSA v0.3.2 Runtime Specification

This document provides human-readable documentation for the OSSA Agent Runtime Specification, which defines how agents execute, communicate, and manage state.

## Overview

The runtime specification consists of two main components:

1. **runtime.yaml** - Core runtime behavior including lifecycle, control signals, execution model, and network isolation
2. **memory-model.yaml** - Memory management including short-term and long-term storage

## Agent Lifecycle

All OSSA agents follow a standard 5-phase lifecycle:

```
init -> plan -> act -> reflect -> terminate
                 ^         |
                 |         v
                 +---------+
               (iteration loop)
```

### Phase Descriptions

#### 1. Init Phase
**Purpose**: Prepare the agent for execution

**Activities**:
- Load configuration and credentials
- Establish connections to tools and services
- Validate input parameters
- Set up logging and telemetry

**Default Timeout**: 30 seconds

**Success Signal**: `ready`

#### 2. Plan Phase
**Purpose**: Analyze task and generate execution strategy

**Activities**:
- Analyze the task/goal
- Retrieve relevant context from memory
- Generate execution plan
- Determine required tools and delegations

**Default Timeout**: 60 seconds

**Success Signal**: `plan_ready`

#### 3. Act Phase
**Purpose**: Execute the planned actions

**Activities**:
- Execute planned steps
- Make tool calls
- Delegate to sub-agents
- Produce artifacts/outputs

**Default Timeout**: 300 seconds

**Success Signal**: `action_complete`

#### 4. Reflect Phase
**Purpose**: Evaluate results and decide next steps

**Activities**:
- Evaluate action results
- Update memory with learnings
- Determine if goal is achieved
- Decide on iteration or termination

**Default Timeout**: 30 seconds

**Success Signal**: `reflection_complete`

#### 5. Terminate Phase
**Purpose**: Clean up and finalize

**Activities**:
- Finalize outputs
- Persist state to long-term memory
- Release resources
- Emit completion telemetry

**Default Timeout**: 15 seconds

**Success Signal**: `terminated`

### Lifecycle Transitions

| From | To | Condition |
|------|-----|-----------|
| init | plan | `ready` signal received |
| plan | act | `plan_ready` signal received |
| act | reflect | `action_complete` signal received |
| reflect | act | `iteration_needed` (goal not yet achieved) |
| reflect | terminate | `goal_achieved` |
| any | terminate | `halt_signal` or `error_unrecoverable` |

### Iteration Control

- **max_iterations**: Maximum plan-act-reflect cycles (default: 10)
- **total_timeout_seconds**: Maximum total execution time (default: 3600)

## Control Signals

Control signals are the standard communication primitives between agents, runtimes, and external systems.

### Standard Signals

#### tool_call
Invoke an external tool or capability.

```yaml
type: tool_call
async: true
timeout_seconds: 60
payload:
  tool_name: "security_scan"
  parameters:
    path: "/src"
    severity: "high"
  correlation_id: "uuid"
```

#### delegation
Delegate work to another agent.

```yaml
type: delegation
async: true
timeout_seconds: 300
payload:
  target_agent: "code-review-agent"
  task:
    action: "review"
    files: ["src/main.py"]
  context:
    pr_number: 123
  callback: "https://callback.example.com/results"
```

#### halt
Immediately stop agent execution.

```yaml
type: halt
async: false
timeout_seconds: 5
payload:
  reason: "user_interrupt"  # or: resource_limit, policy_violation, external_signal, parent_termination
  graceful: true
  message: "User requested cancellation"
```

#### error
Indicate an error condition.

```yaml
type: error
async: false
payload:
  error_code: "TOOL_ERROR"  # INIT_FAILED, PLAN_FAILED, ACTION_FAILED, etc.
  message: "Tool execution failed"
  recoverable: false
  details:
    tool: "security_scan"
    exit_code: 1
```

#### ready
Signal that agent is ready for work.

```yaml
type: ready
payload:
  capabilities:
    - "security_scan"
    - "code_review"
  version: "1.0.0"
```

#### heartbeat
Periodic liveness signal.

```yaml
type: heartbeat
interval_seconds: 30
payload:
  timestamp: "2024-01-15T10:30:00Z"
  phase: "act"
  metrics:
    memory_mb: 256
    cpu_percent: 15
```

## Execution Model

### Timeout Configuration

Multiple timeout levels protect against runaway executions:

| Timeout | Default | Range | Description |
|---------|---------|-------|-------------|
| default_seconds | 300 | 1-3600 | Default operation timeout |
| llm_call_seconds | 60 | 5-300 | LLM API call timeout |
| tool_call_seconds | 60 | 1-600 | Tool invocation timeout |
| delegation_seconds | 300 | 30-3600 | Agent delegation timeout |

### Sandbox Configuration

Agents run in isolated sandboxes to prevent unauthorized access:

```yaml
sandbox:
  enabled: true
  type: container  # or: vm, wasm, process, none
  filesystem:
    read_paths:
      - /app/data
    write_paths:
      - /app/output
    deny_paths:
      - /etc/passwd
      - /etc/shadow
      - ~/.ssh
      - ~/.aws
  capabilities: []  # Linux capabilities
  syscall_filter: default  # strict, default, permissive
```

### Resource Limits

```yaml
resource_limits:
  memory_mb: 512
  cpu_millicores: 1000
  gpu_memory_mb: 0
  max_open_files: 256
  max_processes: 10
  max_network_connections: 50
```

## Network Isolation Model

### Isolation Modes

| Mode | Description |
|------|-------------|
| strict | No network access except explicitly allowed |
| namespace | Isolated network namespace per agent |
| mesh | Service mesh with controlled inter-agent communication |
| none | No network isolation (development only) |

### Egress Rules

Control outbound traffic:

```yaml
egress:
  allowed_domains:
    - api.openai.com
    - api.anthropic.com
    - "*.googleapis.com"
  blocked_domains: []
  allowed_ports:
    - 443
    - 80
  rate_limit:
    requests_per_second: 100
    bytes_per_second: 10485760  # 10 MB/s
```

### Ingress Rules

Control inbound traffic:

```yaml
ingress:
  allowed_sources:
    - "10.0.0.0/8"
    - "agent-orchestrator"
  allowed_ports:
    - 8080
    - 8443
  require_mtls: true
```

### Agent Mesh

Configuration for agent-to-agent communication:

```yaml
agent_mesh:
  enabled: true
  discovery: kubernetes  # or: dns, consul, static
  encryption: mtls       # or: none, tls, wireguard
  allowed_agents:
    - security-scanner
    - code-reviewer
  denied_agents: []
```

## Memory Model

### Short-Term Memory

Volatile memory for immediate context:

#### Conversation Context
- Maximum messages: 100 (default)
- Maximum tokens: 32,000 (default)
- Truncation strategies: sliding_window, summarize, oldest_first, importance_based

#### Working Memory
- Scratchpad for intermediate computations
- Maximum size: 64 MB (default)
- TTL: 3600 seconds (default)

#### Session State
- Session-level state management
- Session TTL: 3600 seconds (default)
- Maximum concurrent sessions: 100 (default)

### Long-Term Memory

Persistent storage for knowledge and state:

#### Supported Providers
- Relational: postgres, sqlite
- Document: mongodb, dynamodb
- Vector: qdrant, pinecone, weaviate, chromadb, milvus
- Graph: neo4j
- Hybrid: postgres with pgvector

#### Knowledge Base
- Schema format: JSON Schema or RDF
- Versioning enabled by default
- Maximum entries: 100,000 (default)

#### Vector Store
- Embedding model: configurable (default: text-embedding-3-small)
- Dimensions: 1536 (default)
- Distance metric: cosine, euclidean, or dot_product
- Index type: hnsw, flat, ivf, scann

#### Conversation History
- Retention: 90 days (default)
- Indexing for search
- Auto-summarization of old conversations

#### Agent State
- Checkpoint interval: 60 seconds (default)
- Maximum checkpoints: 10 (default)
- Compression enabled by default

### Memory Provider Interface

All memory providers MUST implement these operations:

| Operation | Description | Required |
|-----------|-------------|----------|
| get | Retrieve entry by key | Yes |
| set | Store entry | Yes |
| delete | Remove entry | Yes |
| exists | Check if key exists | Yes |
| list | List keys matching pattern | Yes |
| clear | Clear namespace | Yes |
| search | Semantic search (vector) | No |
| batch_get | Retrieve multiple entries | No |
| batch_set | Store multiple entries | No |
| expire | Set expiration | No |
| increment | Atomic increment | No |

### Memory Lifecycle

#### Garbage Collection
- Strategies: lru, lfu, ttl, size_based, hybrid
- Run interval: 3600 seconds (default)
- Trigger threshold: 80% memory usage

#### Backup
- Interval: 24 hours (default)
- Retention: 7 backups (default)
- Encryption enabled by default

#### Compaction
- Fragmentation threshold: 30%
- Run interval: 24 hours (default)

## Example Configuration

```yaml
apiVersion: ossa/v0.3.2
kind: RuntimeSpec

lifecycle:
  phases:
    init:
      timeout_seconds: 30
    plan:
      timeout_seconds: 60
    act:
      timeout_seconds: 300
    reflect:
      timeout_seconds: 30
    terminate:
      timeout_seconds: 15
  max_iterations: 10

control_signals:
  tool_call:
    async: true
    timeout_seconds: 60
  delegation:
    async: true
    timeout_seconds: 300

execution:
  timeout:
    default_seconds: 300
    llm_call_seconds: 60
  sandbox:
    enabled: true
    type: container
  resource_limits:
    memory_mb: 512
    cpu_millicores: 1000

network_isolation:
  enabled: true
  mode: namespace
  egress:
    allowed_domains:
      - api.openai.com
      - api.anthropic.com
    allowed_ports:
      - 443
  agent_mesh:
    enabled: true
    encryption: mtls
```

## Related Specifications

- [Agent Unified Schema](../schemas/agent-unified.yaml) - Agent manifest specification
- [Runtime Binding](../schemas/runtime.yaml) - Runtime declaration in manifests
- [Capabilities Schema](../schemas/capabilities.yaml) - Capability declarations
- [Access Tiers](../access_tiers.yaml) - Permission and access control

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.3.2 | 2024-01 | Initial runtime specification with lifecycle, control signals, execution model, network isolation, and memory model |
