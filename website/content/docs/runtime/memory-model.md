---
title: Memory Model
description: OSSA v0.3.2 Agent Memory Model - Short-term memory, long-term memory, provider interface, and lifecycle management
---

# OSSA Agent Memory Model

The OSSA Memory Model specification defines how agents manage state across different memory types, from volatile short-term context to persistent long-term storage. This enables agents to maintain conversation context, learn from interactions, and persist knowledge across sessions.

## Overview

The memory model consists of three main components:

1. **Short-Term Memory**: Volatile memory for immediate context (conversation history, working memory, session state)
2. **Long-Term Memory**: Persistent storage for knowledge and learned patterns (knowledge base, vector store, conversation history)
3. **Memory Provider Interface**: Pluggable backend specification for memory operations

## Memory Model Schema

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

short_term:
  enabled: true
  provider: redis
  conversation_context:
    max_messages: 100
    max_tokens: 32000
    truncation_strategy: sliding_window
  working_memory:
    max_size_mb: 64
    ttl_seconds: 3600
  session_state:
    session_ttl_seconds: 3600
    max_sessions: 100

long_term:
  enabled: true
  provider: postgres
  storage_type: hybrid
  knowledge_base:
    enabled: true
    schema: json_schema
  vector_store:
    enabled: true
    embedding_model: text-embedding-3-small
    distance_metric: cosine
```

## Short-Term Memory

Short-term memory is volatile and typically cleared between agent invocations. It handles immediate context needed during agent execution.

### Conversation Context

Manages the conversation history window available to the agent:

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

short_term:
  enabled: true
  provider: in_memory
  conversation_context:
    enabled: true
    max_messages: 100        # Maximum messages to retain
    max_tokens: 32000        # Maximum tokens in context window
    truncation_strategy: sliding_window
    include_system_messages: true
    include_tool_results: true
```

**Truncation Strategies:**

| Strategy | Description |
|----------|-------------|
| `sliding_window` | Keep most recent messages (default) |
| `summarize` | Summarize older messages before truncation |
| `oldest_first` | Remove oldest messages first |
| `importance_based` | Remove least important messages based on scoring |

### Working Memory

A scratchpad for intermediate computations during agent execution:

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

short_term:
  working_memory:
    enabled: true
    max_size_mb: 64          # Maximum size in megabytes
    ttl_seconds: 3600        # Time-to-live (1 hour default)
    namespaced: true         # Namespace by agent/session
```

**Use Cases:**
- Storing intermediate results during multi-step reasoning
- Caching tool outputs for reuse within a session
- Maintaining task state during plan-act-reflect cycles

### Session State

Manages session-level state for multi-turn interactions:

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

short_term:
  session_state:
    enabled: true
    session_ttl_seconds: 3600         # Session expiration (1 hour)
    persist_across_invocations: false # Clear between runs
    max_sessions: 100                 # Maximum concurrent sessions
```

### Short-Term Memory Providers

| Provider | Description | Best For |
|----------|-------------|----------|
| `in_memory` | Process memory (default) | Development, single-instance |
| `redis` | Redis/Valkey | Production, multi-instance |
| `memcached` | Memcached | High-throughput caching |
| `local_cache` | Local file cache | Edge deployments |

## Long-Term Memory

Long-term memory provides persistent storage for knowledge, learned patterns, and cross-session information.

### Storage Types

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

long_term:
  enabled: true
  provider: postgres
  storage_type: hybrid  # relational + vector
```

| Storage Type | Description | Use Case |
|--------------|-------------|----------|
| `relational` | SQL databases | Structured data, queries |
| `document` | Document stores | Flexible schemas, nested data |
| `vector` | Vector databases | Semantic search, embeddings |
| `graph` | Graph databases | Relationships, knowledge graphs |
| `hybrid` | Combined storage | Production systems |

### Knowledge Base

Structured knowledge storage with versioning:

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

long_term:
  knowledge_base:
    enabled: true
    schema: json_schema      # Schema format (json_schema, rdf, custom)
    versioning: true         # Enable version history
    max_entries: 100000      # Maximum entries
```

**Schema Formats:**
- `json_schema`: JSON Schema for validation
- `rdf`: RDF for semantic web compatibility
- `custom`: Custom schema format

### Vector Store

Vector embeddings for semantic search and retrieval:

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

long_term:
  vector_store:
    enabled: true
    embedding_model: text-embedding-3-small  # Configurable via env
    embedding_dimensions: 1536               # Vector dimensions
    distance_metric: cosine                  # Similarity metric
    index_type: hnsw                         # Index algorithm
    max_vectors: 1000000                     # Maximum vectors
```

**Distance Metrics:**

| Metric | Description | Best For |
|--------|-------------|----------|
| `cosine` | Cosine similarity (default) | Text embeddings |
| `euclidean` | Euclidean distance | Dense vectors |
| `dot_product` | Dot product | Normalized vectors |

**Index Types:**

| Type | Description | Trade-offs |
|------|-------------|------------|
| `hnsw` | Hierarchical NSW (default) | Fast queries, good recall |
| `flat` | Brute force | Perfect recall, slow |
| `ivf` | Inverted file | Fast, requires training |
| `scann` | ScaNN | Large scale, efficient |

### Conversation History

Persistent archive of conversation history:

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

long_term:
  conversation_history:
    enabled: true
    retention_days: 90       # Days to retain (90 default)
    indexing: true           # Enable search indexing
    summarization: true      # Auto-summarize old conversations
```

### Agent State

Checkpointing for agent state across invocations:

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

long_term:
  agent_state:
    enabled: true
    checkpoint_interval_seconds: 60  # Checkpoint frequency
    max_checkpoints: 10              # Checkpoints to retain
    compression: true                # Compress checkpoints
```

### Learned Patterns

Storage for learned behaviors and user preferences:

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

long_term:
  learned_patterns:
    enabled: true
    feedback_integration: true       # Integrate user feedback
    pattern_types:
      - task_completion
      - error_recovery
      - user_preferences
      - tool_usage
      - delegation_patterns
    decay_enabled: true              # Enable relevance decay
    decay_half_life_days: 30         # Half-life for decay
```

### Long-Term Memory Providers

| Provider | Type | Description |
|----------|------|-------------|
| `postgres` | Relational/Hybrid | PostgreSQL with pgvector |
| `mongodb` | Document | MongoDB |
| `sqlite` | Relational | SQLite for local storage |
| `dynamodb` | Document | AWS DynamoDB |
| `neo4j` | Graph | Neo4j graph database |
| `qdrant` | Vector | Qdrant vector database |
| `pinecone` | Vector | Pinecone managed vectors |
| `weaviate` | Vector | Weaviate vector search |
| `chromadb` | Vector | ChromaDB embedding database |
| `milvus` | Vector | Milvus vector database |

## Memory Provider Interface

All memory providers MUST implement a standard interface for interoperability.

### Required Operations

Every provider MUST implement these operations:

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

provider_interface:
  version: '1.0'
  required_operations:
    - name: get
      description: Retrieve entry by key
      parameters:
        key: { type: string, required: true }
        namespace: { type: string, required: false }
      returns: { type: object, nullable: true }

    - name: set
      description: Store entry
      parameters:
        key: { type: string, required: true }
        value: { type: any, required: true }
        ttl_seconds: { type: integer, required: false }
        namespace: { type: string, required: false }
      returns: { type: boolean }

    - name: delete
      description: Remove entry
      parameters:
        key: { type: string, required: true }
        namespace: { type: string, required: false }
      returns: { type: boolean }

    - name: exists
      description: Check if key exists
      parameters:
        key: { type: string, required: true }
        namespace: { type: string, required: false }
      returns: { type: boolean }

    - name: list
      description: List keys matching pattern
      parameters:
        pattern: { type: string, required: true }
        namespace: { type: string, required: false }
        limit: { type: integer, required: false }
      returns: { type: array, items: { type: string } }

    - name: clear
      description: Clear all entries in namespace
      parameters:
        namespace: { type: string, required: false }
      returns: { type: boolean }
```

### Optional Operations

Providers MAY implement these additional operations:

| Operation | Description | Use Case |
|-----------|-------------|----------|
| `search` | Semantic search in vector store | RAG, similarity search |
| `batch_get` | Retrieve multiple entries | Bulk reads |
| `batch_set` | Store multiple entries | Bulk writes |
| `expire` | Set expiration on key | TTL management |
| `increment` | Atomic increment | Counters, rate limiting |

### Lifecycle Hooks

Providers can implement lifecycle hooks for initialization and cleanup:

```yaml
provider_interface:
  lifecycle_hooks:
    on_init: "Called when provider initializes"
    on_shutdown: "Called before provider shutdown"
    on_error: "Called on provider errors"
    on_connection_lost: "Called when connection is lost"
    on_connection_restored: "Called when connection is restored"
```

## Memory Lifecycle

### Garbage Collection

Automatic cleanup of expired or unused memory:

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

lifecycle:
  garbage_collection:
    enabled: true
    strategy: hybrid              # GC strategy
    run_interval_seconds: 3600    # Run every hour
    max_memory_percent: 80        # Trigger at 80% usage
    target_memory_percent: 60     # Target 60% after GC
```

**GC Strategies:**

| Strategy | Description |
|----------|-------------|
| `lru` | Least Recently Used |
| `lfu` | Least Frequently Used |
| `ttl` | Time-To-Live based |
| `size_based` | Remove largest entries |
| `hybrid` | Combined approach (default) |

### Backup

Memory backup configuration:

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

lifecycle:
  backup:
    enabled: true
    interval_hours: 24           # Daily backups
    retention_count: 7           # Keep 7 backups
    destination: s3://bucket/backups/
    encryption: true             # Encrypt backups
```

### Compaction

Memory compaction for fragmentation:

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

lifecycle:
  compaction:
    enabled: true
    threshold_percent: 30        # Trigger at 30% fragmentation
    run_interval_hours: 24       # Run daily
```

### Migration

Configuration for migrating between providers:

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

lifecycle:
  migration:
    enabled: true
    source_provider: redis
    target_provider: postgres
    batch_size: 1000
    verify_integrity: true
```

## Connection Configuration

Configure connections to memory providers:

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

short_term:
  connection:
    endpoint: redis://localhost:6379
    credentials_ref: REDIS_PASSWORD
    pool_size: 10
    timeout_seconds: 30
    retry_policy:
      max_attempts: 3
      backoff: exponential
      initial_delay_ms: 100
      max_delay_ms: 10000
    ssl:
      enabled: true
      verify: true

long_term:
  connection:
    endpoint: postgres://localhost:5432/agent_memory
    credentials_ref: POSTGRES_CONNECTION_STRING
    pool_size: 20
    timeout_seconds: 60
```

## Complete Example

A production-ready memory model configuration:

```yaml
apiVersion: ossa/v0.3.2
kind: MemoryModel

short_term:
  enabled: true
  provider: redis

  conversation_context:
    enabled: true
    max_messages: 100
    max_tokens: 32000
    truncation_strategy: sliding_window
    include_system_messages: true
    include_tool_results: true

  working_memory:
    enabled: true
    max_size_mb: 64
    ttl_seconds: 3600
    namespaced: true

  session_state:
    enabled: true
    session_ttl_seconds: 3600
    persist_across_invocations: false
    max_sessions: 100

  connection:
    endpoint: ${REDIS_URL:-redis://localhost:6379}
    credentials_ref: REDIS_PASSWORD
    pool_size: 10

long_term:
  enabled: true
  provider: postgres
  storage_type: hybrid

  knowledge_base:
    enabled: true
    schema: json_schema
    versioning: true
    max_entries: 100000

  vector_store:
    enabled: true
    embedding_model: ${EMBEDDING_MODEL:-text-embedding-3-small}
    embedding_dimensions: 1536
    distance_metric: cosine
    index_type: hnsw
    max_vectors: 1000000

  conversation_history:
    enabled: true
    retention_days: 90
    indexing: true
    summarization: true

  agent_state:
    enabled: true
    checkpoint_interval_seconds: 60
    max_checkpoints: 10
    compression: true

  learned_patterns:
    enabled: true
    feedback_integration: true
    pattern_types:
      - task_completion
      - error_recovery
      - user_preferences
    decay_enabled: true
    decay_half_life_days: 30

  connection:
    endpoint: ${POSTGRES_URL:-postgres://localhost:5432/agent_memory}
    credentials_ref: POSTGRES_CONNECTION_STRING
    pool_size: 20
    ssl:
      enabled: true
      verify: true

lifecycle:
  garbage_collection:
    enabled: true
    strategy: hybrid
    run_interval_seconds: 3600
    max_memory_percent: 80
    target_memory_percent: 60

  backup:
    enabled: true
    interval_hours: 24
    retention_count: 7
    destination: ${BACKUP_DESTINATION:-s3://backups/memory/}
    encryption: true

  compaction:
    enabled: true
    threshold_percent: 30
    run_interval_hours: 24
```

## Related Specifications

- [Execution Profiles](/docs/runtime/execution-profiles) - Agent execution profiles
- [Runtime Specification](/docs/architecture/execution-flow) - Agent lifecycle and execution
- [Access Tiers](/docs/access-tiers/overview) - Permission and access control
- [Configuration](/docs/configuration/environment-variables) - Environment configuration

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.3.2 | 2025-01 | Initial memory model specification with short-term, long-term, provider interface, and lifecycle |
