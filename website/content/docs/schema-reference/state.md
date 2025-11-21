---
title: "State Management"
description: "Agent state management configuration for stateful and long-running agents"
weight: 15
---

# State Management

The `state` block configures how an agent manages memory, context, and persistent state across interactions. This is critical for stateful agents, multi-turn conversations, and long-running workflows.

## Overview

OSSA v0.2.4 introduces comprehensive state management capabilities:

- **State modes** - Stateless, session-based, and long-running agent configurations
- **Storage backends** - Multiple storage options (memory, vector-db, kv, rdbms, custom)
- **Context window strategies** - Intelligent context management for large conversations
- **Retention policies** - Configurable data retention periods

## State Modes

### Stateless (`stateless`)

No persistent state. Each interaction is independent.

```yaml
spec:
  state:
    mode: stateless
```

**Use cases**:
- Simple Q&A agents
- Stateless API wrappers
- One-shot operations

### Session (`session`)

State persists for the duration of a session (typically a user conversation).

```yaml
spec:
  state:
    mode: session
    storage:
      type: memory
      retention: 1h
```

**Use cases**:
- Chat agents with conversation history
- Multi-turn interactions
- Context-aware assistants

### Long-Running (`long_running`)

State persists across sessions and restarts.

```yaml
spec:
  state:
    mode: long_running
    storage:
      type: vector-db
      retention: 30d
      config:
        provider: pinecone
        index: agent-memory
```

**Use cases**:
- Autonomous agents with persistent memory
- RAG systems with knowledge accumulation
- Agents that learn from interactions

## Storage Backends

### Memory (`memory`)

In-process storage (lost on restart).

```yaml
state:
  mode: session
  storage:
    type: memory
    retention: 1h
```

**Characteristics**:
- Fastest access
- No external dependencies
- Lost on restart
- Limited by process memory

### Vector Database (`vector-db`)

Vector database for semantic search and RAG.

```yaml
state:
  mode: long_running
  storage:
    type: vector-db
    retention: 90d
    config:
      provider: pinecone
      index: agent-memory
      dimension: 1536
      metric: cosine
```

**Supported providers**:
- Pinecone
- Weaviate
- Chroma
- Qdrant
- Custom implementations

**Use cases**:
- RAG systems
- Semantic memory search
- Long-term knowledge retention

### Key-Value Store (`kv`)

Key-value storage for structured data.

```yaml
state:
  mode: session
  storage:
    type: kv
    retention: 7d
    config:
      provider: redis
      endpoint: redis://localhost:6379
      database: 0
```

**Supported providers**:
- Redis
- DynamoDB
- etcd
- Custom implementations

**Use cases**:
- Session data
- User preferences
- Temporary state

### Relational Database (`rdbms`)

SQL database for structured, queryable state.

```yaml
state:
  mode: long_running
  storage:
    type: rdbms
    retention: 365d
    config:
      provider: postgresql
      connection_string: postgresql://user:pass@localhost/agent_db
      table_prefix: agent_state_
```

**Supported providers**:
- PostgreSQL
- MySQL
- SQLite
- Custom implementations

**Use cases**:
- Complex queryable state
- Audit trails
- Structured data persistence

### Custom (`custom`)

Custom storage implementation.

```yaml
state:
  mode: long_running
  storage:
    type: custom
    config:
      implementation: my-custom-storage
      endpoint: http://storage-service:8080
      api_key: ${STORAGE_API_KEY}
```

## Context Window Strategies

### Sliding Window (`sliding_window`)

Maintains the most recent N messages/tokens.

```yaml
state:
  context_window:
    max_messages: 100
    max_tokens: 32000
    strategy: sliding_window
```

**Behavior**: Drops oldest messages when limit is reached.

### Summarization (`summarization`)

Summarizes older messages to fit within limits.

```yaml
state:
  context_window:
    max_messages: 1000
    max_tokens: 32000
    strategy: summarization
    config:
      summarization_model: gpt-3.5-turbo
      summary_ratio: 0.3
```

**Behavior**: Summarizes older messages, keeps recent messages verbatim.

### Importance Weighted (`importance_weighted`)

Retains messages based on importance scores.

```yaml
state:
  context_window:
    max_messages: 1000
    max_tokens: 32000
    strategy: importance_weighted
    config:
      importance_model: gpt-4
      min_importance_score: 0.7
```

**Behavior**: Keeps high-importance messages, drops low-importance ones.

## Complete Example

```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: memory-enhanced-assistant
spec:
  role: |
    You are a helpful assistant with long-term memory.
    Remember user preferences and past conversations.
  
  state:
    mode: long_running
    storage:
      type: vector-db
      retention: 90d
      config:
        provider: pinecone
        index: assistant-memory
        dimension: 1536
    context_window:
      max_messages: 500
      max_tokens: 128000
      strategy: summarization
      config:
        summarization_model: gpt-3.5-turbo
        summary_ratio: 0.2
```

## Framework Integration

### OpenAI Agents SDK

```yaml
state:
  mode: session
  storage:
    type: memory
```

OpenAI Agents SDK uses session state for conversation continuity.

### Microsoft AutoGen

```yaml
state:
  mode: long_running
  storage:
    type: vector-db
    config:
      provider: chroma
```

AutoGen teams benefit from persistent shared state.

### LangChain

```yaml
state:
  mode: session
  storage:
    type: memory
  context_window:
    strategy: sliding_window
    max_messages: 50
```

LangChain agents use session state for conversation memory.

## Best Practices

1. **Choose the right mode**: Use `stateless` for simple agents, `session` for conversations, `long_running` for autonomous agents
2. **Select appropriate storage**: Use `memory` for development, `vector-db` for RAG, `kv` for session data
3. **Configure retention**: Set retention periods based on compliance and storage costs
4. **Optimize context windows**: Use `summarization` for long conversations, `sliding_window` for recent context
5. **Monitor storage usage**: Track storage growth and implement cleanup policies

## Related Documentation

- [Agent Spec](./agent-spec.md) - Complete agent specification
- [Tools](./tools.md) - Tool definitions with transport metadata
- [Security](./security.md) - Security scopes and compliance tags
- [Migration Guide: v0.2.3 to v0.2.4](/docs/migration-guides/v0.2.3-to-v0.2.4) - Migration instructions

