---
title: "Runtime Specification"
description: "OSSA runtime specification defining agent execution, lifecycle, control signals, and memory management"
---

# OSSA Runtime Specification

The OSSA Runtime Specification defines how agents execute, communicate, and manage state. It provides a standardized execution model that ensures consistent behavior across different runtime implementations.

## Overview

The runtime specification consists of several key components:

| Component | Description | Documentation |
|-----------|-------------|---------------|
| **Lifecycle** | 5-phase agent execution model | [Lifecycle](/docs/runtime/lifecycle) |
| **Control Signals** | Standard communication primitives | [Control Signals](/docs/runtime/control-signals) |
| **Execution Model** | Timeouts, sandboxing, resource limits | This page |
| **Memory Model** | Short-term and long-term storage | [Memory Model](/docs/runtime/memory-model) |
| **Execution Profiles** | fast/balanced/deep/safe profiles | [Execution Profiles](/docs/runtime/execution-profiles) |

## Quick Start

Define runtime configuration in your agent manifest:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: my-agent
  version: "1.0.0"

spec:
  role: worker

  runtime:
    lifecycle:
      max_iterations: 10
      phases:
        init:
          timeout_seconds: 30
        act:
          timeout_seconds: 300

    execution:
      sandbox:
        enabled: true
        type: container
      resource_limits:
        memory_mb: 512
        cpu_millicores: 1000
```

## Execution Model

### Timeout Configuration

Multiple timeout levels protect against runaway executions:

| Timeout | Default | Range | Description |
|---------|---------|-------|-------------|
| `default_seconds` | 300 | 1-3600 | Default operation timeout |
| `llm_call_seconds` | 60 | 5-300 | LLM API call timeout |
| `tool_call_seconds` | 60 | 1-600 | Tool invocation timeout |
| `delegation_seconds` | 300 | 30-3600 | Agent delegation timeout |

### Sandbox Configuration

Agents run in isolated sandboxes to prevent unauthorized access:

```yaml
apiVersion: ossa/v0.3.0
kind: RuntimeSpec

execution:
  sandbox:
    enabled: true
    type: container  # options: container, vm, wasm, process, none
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
    syscall_filter: default  # options: strict, default, permissive
```

### Resource Limits

Control agent resource consumption:

```yaml
resource_limits:
  memory_mb: 512
  cpu_millicores: 1000
  gpu_memory_mb: 0
  max_open_files: 256
  max_processes: 10
  max_network_connections: 50
```

## Network Isolation

### Isolation Modes

| Mode | Description |
|------|-------------|
| `strict` | No network access except explicitly allowed |
| `namespace` | Isolated network namespace per agent |
| `mesh` | Service mesh with controlled inter-agent communication |
| `none` | No network isolation (development only) |

### Egress Rules

Control outbound traffic:

```yaml
network_isolation:
  enabled: true
  mode: namespace
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
  discovery: kubernetes  # options: dns, consul, static
  encryption: mtls       # options: none, tls, wireguard
  allowed_agents:
    - security-scanner
    - code-reviewer
  denied_agents: []
```

## Memory Model

### Short-Term Memory

Volatile memory for immediate context:

| Component | Default Limit | Description |
|-----------|---------------|-------------|
| Conversation Context | 100 messages / 32K tokens | Recent conversation history |
| Working Memory | 64 MB | Scratchpad for computations |
| Session State | 1 hour TTL | Session-level state |

**Truncation Strategies**:
- `sliding_window` - Remove oldest messages first
- `summarize` - Compress old messages into summaries
- `oldest_first` - Simple FIFO removal
- `importance_based` - Keep important messages longer

### Long-Term Memory

Persistent storage for knowledge and state:

#### Supported Providers

| Category | Providers |
|----------|-----------|
| Relational | postgres, sqlite |
| Document | mongodb, dynamodb |
| Vector | qdrant, pinecone, weaviate, chromadb, milvus |
| Graph | neo4j |
| Hybrid | postgres with pgvector |

#### Vector Store Configuration

```yaml
memory:
  long_term:
    vector_store:
      provider: qdrant
      embedding_model: text-embedding-3-small
      dimensions: 1536
      distance_metric: cosine  # options: euclidean, dot_product
      index_type: hnsw         # options: flat, ivf, scann
```

### Memory Provider Interface

All memory providers MUST implement these operations:

| Operation | Description | Required |
|-----------|-------------|----------|
| `get` | Retrieve entry by key | Yes |
| `set` | Store entry | Yes |
| `delete` | Remove entry | Yes |
| `exists` | Check if key exists | Yes |
| `list` | List keys matching pattern | Yes |
| `clear` | Clear namespace | Yes |
| `search` | Semantic search (vector) | No |
| `batch_get` | Retrieve multiple entries | No |
| `batch_set` | Store multiple entries | No |
| `expire` | Set expiration | No |
| `increment` | Atomic increment | No |

### Memory Lifecycle

#### Garbage Collection

```yaml
memory:
  lifecycle:
    gc:
      strategy: hybrid  # options: lru, lfu, ttl, size_based
      interval_seconds: 3600
      trigger_threshold: 0.8  # 80% memory usage
```

#### Backup

```yaml
backup:
  interval_hours: 24
  retention_count: 7
  encryption: true
```

## Complete Example

```yaml
apiVersion: ossa/v0.3.0
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

## Related Documentation

- [Lifecycle Phases](/docs/runtime/lifecycle) - Detailed lifecycle documentation
- [Control Signals](/docs/runtime/control-signals) - Signal types and usage
- [Memory Model](/docs/runtime/memory-model) - Short-term and long-term memory management
- [Execution Profiles](/docs/runtime/execution-profiles) - fast, balanced, deep, and safe profiles
- [Schema Reference](/docs/schema-reference) - Complete schema documentation
- [Execution Flow](/docs/architecture/execution-flow) - How requests flow through agents

---

**Specification Version**: v0.3.2
**Last Updated**: 2024-01
