# Production Agent with Memory - LangChain Export (v0.4.1)

**Showcase Example for OSSA v0.4.1 LangChain Memory Features**

This example demonstrates all v0.4.1 production-quality memory features for LangChain exports:

## ✨ Features Demonstrated

### 1. **Conversation Buffer Memory** 💬
- Window management (configurable message history)
- Memory statistics and monitoring
- Structured logging
- Production-ready error handling

### 2. **Conversation Summary Memory** 📝
- Automatic summarization when token limit reached
- Configurable token limits
- Summary regeneration
- Cost-effective model (gpt-4o-mini) for summarization

### 3. **Entity Memory** 🏷️
- Automatic entity extraction and tracking
- Entity context retrieval
- Relationship mapping
- Entity listing and management

### 4. **Redis Persistence** 🔴
- Connection pooling with automatic retry
- Exponential backoff on connection failures
- Health checks and monitoring
- Session management (list, delete, get stats)
- TTL configuration per session

### 5. **PostgreSQL Persistence** 🐘
- Connection pooling (ThreadedConnectionPool)
- Automatic schema initialization
- Session analytics and statistics
- Export functionality (JSON, CSV)
- Health checks and monitoring
- Long-term storage for compliance

## 🎯 Memory Backends

| Backend | Type | Persistence | Best For |
|---------|------|-------------|----------|
| **buffer** | In-Memory | No | Development, short conversations |
| **summary** | In-Memory | No | Long conversations, token efficiency |
| **entity** | In-Memory | No | Entity-focused interactions |
| **redis** | Persistent | Yes | Production, multi-instance, session persistence |
| **postgres** | Persistent | Yes | Analytics, compliance, long-term storage |

## 📋 Export Command

```bash
# Export with different memory backends

# Buffer memory (in-memory)
ossa export agent.ossa.yaml -p langchain -o ./buffer-agent
# Memory generated: memory.py with ConversationBufferWindowMemory

# Summary memory (token-efficient)
ossa export agent.ossa.yaml -p langchain --memory-backend summary -o ./summary-agent
# Memory generated: memory.py with ConversationSummaryBufferMemory

# Entity memory (entity tracking)
ossa export agent.ossa.yaml -p langchain --memory-backend entity -o ./entity-agent
# Memory generated: memory.py with ConversationEntityMemory

# Redis persistence (production)
ossa export agent.ossa.yaml -p langchain --memory-backend redis -o ./redis-agent
# Memory generated: memory.py with Redis-backed persistence

# PostgreSQL persistence (analytics)
ossa export agent.ossa.yaml -p langchain --memory-backend postgres -o ./postgres-agent
# Memory generated: memory.py with PostgreSQL-backed persistence
```

## 📦 Generated Memory Features

All memory backends include:
- ✅ **get_memory()** - Create memory instance
- ✅ **clear_memory()** - Clear conversation history
- ✅ **get_memory_stats()** - Get usage statistics
- ✅ **Logging** - Structured logging with context
- ✅ **Error Handling** - Comprehensive try/except with exc_info

Persistent backends (Redis, PostgreSQL) additionally include:
- ✅ **validate_connection()** - Connection validation with retry
- ✅ **health_check()** - Health monitoring
- ✅ **get_all_sessions()** - List all sessions
- ✅ **delete_session()** - Delete specific session

## 🎯 Configuration Options

### OSSA Manifest Configuration

```yaml
spec:
  memory:
    enabled: true
    type: conversation_buffer  # or: conversation_summary, entity
    window_size: 20            # Number of messages to keep
    max_token_limit: 4000      # Token limit for summary
    return_messages: true      # Return as Message objects

    # Persistence (optional)
    persistence:
      enabled: true
      backend: redis           # or: postgres
      ttl: 86400              # Time-to-live (seconds)
      connection:
        url: ${REDIS_URL}     # Connection URL from env
        pool_size: 10         # Connection pool size
        timeout: 30           # Connection timeout (seconds)
```

## 📊 Code Examples

### Buffer Memory with Window

```python
import logging
from memory import get_memory, clear_memory, get_memory_stats

logger = logging.getLogger(__name__)

# Create memory (keeps last 20 messages)
memory = get_memory()

# Use with agent
agent = create_agent(memory=memory)
response = agent.run("Hello!")

# Get statistics
stats = get_memory_stats(memory)
# {
#   "type": "buffer_window",
#   "window_size": 20,
#   "message_count": 5,
#   "messages": [...]
# }

# Clear when done
clear_memory(memory)
```

### Summary Memory

```python
from memory import get_memory, regenerate_summary, get_memory_stats

# Create summary memory (auto-summarizes at 4000 tokens)
memory = get_memory()

# Use with agent
agent = create_agent(memory=memory)

# Get statistics
stats = get_memory_stats(memory)
# {
#   "type": "summary_buffer",
#   "max_token_limit": 4000,
#   "message_count": 10,
#   "has_summary": true
# }

# Force summary regeneration
summary = regenerate_summary(memory)
print(f"Summary: {summary}")
```

### Entity Memory

```python
from memory import (
    get_memory,
    get_entity_context,
    list_entities,
    get_memory_stats
)

# Create entity memory
memory = get_memory()

# Use with agent
agent = create_agent(memory=memory)
agent.run("John Smith is the CEO of TechCorp")

# List tracked entities
entities = list_entities(memory)
# ["John Smith", "TechCorp"]

# Get entity context
context = get_entity_context(memory, "John Smith")
# "John Smith is the CEO of TechCorp"

# Get statistics
stats = get_memory_stats(memory)
# {
#   "type": "entity",
#   "entity_count": 2,
#   "entities": ["John Smith", "TechCorp"],
#   "entity_details": {...}
# }
```

### Redis Persistence

```python
from memory import (
    get_memory,
    validate_redis_connection,
    health_check,
    get_all_sessions,
    delete_session,
    get_memory_stats
)

# Validate connection first (with retry)
if not validate_redis_connection(max_retries=3):
    raise ConnectionError("Failed to connect to Redis")

# Create memory for session
memory = get_memory(session_id="user-123")

# Use with agent
agent = create_agent(memory=memory)

# Get session statistics
stats = get_memory_stats(session_id="user-123")
# {
#   "type": "redis",
#   "session_id": "user-123",
#   "message_count": 42,
#   "ttl_remaining": 82800,  # seconds
#   "key": "langchain:chat:user-123"
# }

# Health check
health = health_check()
# {
#   "healthy": true,
#   "latency_ms": 2.5,
#   "redis_version": "7.0.0",
#   "uptime_seconds": 86400
# }

# List all sessions
sessions = get_all_sessions()
# ["user-123", "user-456", ...]

# Delete session
success = delete_session("user-123")
```

### PostgreSQL Persistence

```python
from memory import (
    get_memory,
    validate_postgres_connection,
    initialize_schema,
    health_check,
    get_all_sessions,
    export_session_history,
    get_memory_stats
)

# Validate connection and initialize schema
if not validate_postgres_connection(max_retries=3):
    raise ConnectionError("Failed to connect to PostgreSQL")

initialize_schema()

# Create memory for session
memory = get_memory(session_id="user-123")

# Use with agent
agent = create_agent(memory=memory)

# Get session statistics
stats = get_memory_stats(session_id="user-123")
# {
#   "type": "postgres",
#   "session_id": "user-123",
#   "message_count": 42,
#   "first_message_at": "2026-02-03T10:00:00",
#   "last_message_at": "2026-02-03T11:30:00"
# }

# Health check
health = health_check()
# {
#   "healthy": true,
#   "latency_ms": 5.2,
#   "postgres_version": "PostgreSQL 15.1",
#   "schema_initialized": true
# }

# Export session history
messages_json = export_session_history("user-123", format="json")
messages_csv = export_session_history("user-123", format="csv")
```

## 🧪 Testing

All features are tested with 18 comprehensive unit tests:

```bash
npm test tests/unit/services/export/langchain/memory-generator.test.ts
```

**Test Coverage:**
- ✅ Configuration parsing (3 tests)
- ✅ Buffer memory (2 tests)
- ✅ Summary memory (2 tests)
- ✅ Entity memory (2 tests)
- ✅ Redis persistence (3 tests)
- ✅ PostgreSQL persistence (3 tests)
- ✅ Production features (3 tests)

## 🔧 Environment Variables

**Redis Backend:**
```bash
REDIS_URL=redis://localhost:6379
```

**PostgreSQL Backend:**
```bash
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/agent_memory
```

**OpenAI API (for Summary/Entity Memory):**
```bash
OPENAI_API_KEY=sk-...
```

## 📊 Version Information

- **OSSA Version**: v0.4.1+
- **Release**: v0.4.1 (Feb 14, 2026)
- **Feature Set**: LangChain Memory Support
- **Status**: ✅ Complete

## 🎓 What's Next

This is the **Week 2 deliverable** of v0.4.1 (part 1). Next feature:

- **Week 2 (part 2)**: Streaming Support (SSE, WebSocket, a2a integration)

## 📚 Documentation

- [v0.4.1-v0.4.8 Release Plan](../../../../../wikis/technical-docs.wiki/action-items/Ossa-PLAN/v0.4.1-v0.4.8-release-plan.md)
- [LangChain Export Guide](../../../../../docs/export/langchain.md)
- [Memory Configuration Guide](../../../../../docs/memory/configuration.md)
- [OSSA Specification](https://openstandardagents.org/spec)

## 🤝 Contributing

This example demonstrates production quality standards for memory implementations:

1. **Connection Management**: Use connection pooling
2. **Error Handling**: Comprehensive try/except with logging
3. **Retry Logic**: Exponential backoff for failed connections
4. **Health Checks**: Monitoring and diagnostics
5. **Statistics**: Usage tracking and analytics

---

**Generated by**: OSSA v0.4.1 LangChain Memory Generator
**Date**: 2026-02-03
**Status**: Production Ready ✅
