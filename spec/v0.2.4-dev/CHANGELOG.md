# OSSA v0.2.4-dev Release Notes

**Release Date**: 2025-11-18
**Type**: Minor Release (Development)
**Status**: DEVELOPMENT - APIs may change without notice

## Overview

OSSA v0.2.4-dev is a **development release** introducing significant new features for transport metadata, state management, enhanced security, and capability versioning. This release prepares OSSA for better integration with Google ADK, A2A protocol, OpenAI Agents SDK, and Microsoft Autogen Framework.

**WARNING**: This is a development version. Features and APIs may change before the stable v0.2.4 release.

## What's New

### Transport Metadata for Capabilities

Support for protocol-specific transport configuration, enabling streaming and advanced communication patterns.

```yaml
tools:
  - type: http
    name: chat-api
    transport:
      protocol: http
      streaming: response          # Server streams to client
      binding: /v1/chat/stream
      content_type: text/event-stream
```

**Supported protocols**: `http`, `grpc`, `a2a`, `mcp`, `websocket`, `custom`

**Streaming modes**:
- `none` - Standard request/response
- `request` - Client streams to server
- `response` - Server streams to client (SSE, streaming LLM)
- `bidirectional` - Full duplex (WebSocket, gRPC)

**Use cases**:
- Google ADK bidirectional streaming
- A2A protocol agent-to-agent communication
- Streaming LLM responses
- Real-time collaborative agents

### State/Memory Block

Agent state management configuration for stateful and long-running agents.

```yaml
spec:
  state:
    mode: session                  # stateless | session | long_running
    storage:
      type: vector-db             # memory | vector-db | kv | rdbms | custom
      retention: 30d
      config:
        provider: pinecone
        index: agent-memory
    context_window:
      max_messages: 100
      max_tokens: 32000
      strategy: summarization      # sliding_window | summarization | importance_weighted
```

**Storage types**:
- `memory` - In-process (lost on restart)
- `vector-db` - Vector database (Pinecone, Weaviate, Chroma)
- `kv` - Key-value store (Redis, DynamoDB)
- `rdbms` - Relational database
- `custom` - Custom implementation

**Critical for**:
- OpenAI Agents SDK session continuity
- Microsoft Autogen Framework workflows
- RAG systems with context retention
- Multi-turn conversations

### Enhanced Security with Scopes

Fine-grained permission scopes and compliance tags for capabilities.

```yaml
tools:
  - type: http
    name: database-api
    auth:
      type: bearer
      credentials: secret:db-api-key
      scopes:                      # NEW: OAuth2-like scopes
        - read:data
        - execute:query
    compliance_tags:               # NEW: Compliance framework tags
      - pii
      - gdpr
      - hipaa
    capabilities:
      - name: query_users
        scopes:                    # Per-capability scopes
          - read:users
        compliance_tags:
          - pii
```

**Security scopes**:
- `read:data`, `write:data` - Data access
- `admin:system`, `admin:users` - Administrative operations
- `execute:code`, `execute:query` - Execution permissions

**Compliance tags**:
- `pii` - Personally identifiable information
- `hipaa` - HIPAA compliance required
- `gdpr` - GDPR compliance required
- `fedramp` - FedRAMP requirements
- `soc2` - SOC2 Type II controls

### Capability Versioning

Independent versioning and deprecation for capabilities.

```yaml
capabilities:
  - name: search_documents
    version: '2.1'                 # NEW: Capability version
    deprecated: false

  - name: search_legacy
    version: '1.0'
    deprecated: true               # NEW: Deprecation flag
    deprecation_message: |         # NEW: Migration guidance
      Deprecated in v0.2.4. Will be removed in v0.3.0.
      Use 'search_documents' capability instead.
      Migration: Change capability name and update input schema
      to use 'query' instead of 'search_term'.
```

**Benefits**:
- Independent capability lifecycle management
- Clear migration paths for breaking changes
- Backward compatibility tracking
- API versioning best practices

### Google ADK Extension

Integration with Google's Agent Development Kit (ADK).

```yaml
extensions:
  google_adk:
    enabled: true
    agent_type: llm_agent          # llm_agent | sequential_agent | parallel_agent | loop_agent
    model: gemini-2.0-flash-exp
    instruction: "You are a helpful research assistant."
    session:
      service: in_memory           # in_memory | database | vertex_ai
      state_schema:
        search_history: array
        current_topic: string
    memory:
      enabled: true
      service: vertex_ai_rag
    callbacks:
      before_model_callback: validate_input
      after_model_callback: log_response
```

**Agent types**:
- `llm_agent` - Single LLM-powered agent
- `sequential_agent` - Pipeline of agents
- `parallel_agent` - Concurrent agent execution
- `loop_agent` - Iterative agent with conditions

**Features**:
- Session management (in_memory, database, Vertex AI)
- Memory service integration (Vertex AI RAG)
- Lifecycle callbacks
- Sub-agent orchestration

### Schema Updates

#### apiVersion Pattern
Updated to support v0.2.4-dev:
```regex
^ossa/v(0\.2\.[2-4](-dev)?|1)(\.[0-9]+)?(-[a-zA-Z0-9]+)?$
```

**Valid versions**:
- `ossa/v0.2.2`
- `ossa/v0.2.3`
- `ossa/v0.2.4-dev`
- `ossa/v1`
- `ossa/v1.0`

#### Tool Type Enum
Added `a2a` to supported tool types:
```json
"type": {
  "enum": ["mcp", "kubernetes", "http", "grpc", "function", "a2a", "custom"]
}
```

#### New Definitions
- `Transport` - Transport metadata schema
- `State` - State/memory configuration schema
- `Capability` - Enhanced capability with versioning and scopes
- `GoogleADKExtension` - Google ADK integration

## Breaking Changes

**None** - This release maintains full backward compatibility with v0.2.3.

All new features are additive and optional.

## Deprecations

**None** - No features deprecated in this release.

## Migration from v0.2.3

### Required Changes
**None** - v0.2.3 manifests work without modification.

### Recommended Changes

1. **Add state configuration for stateful agents**:
```yaml
spec:
  state:
    mode: session
    storage:
      type: memory
      retention: 24h
```

2. **Add transport metadata for streaming capabilities**:
```yaml
tools:
  - type: http
    transport:
      protocol: http
      streaming: response
```

3. **Add compliance tags for regulated environments**:
```yaml
tools:
  - type: http
    compliance_tags:
      - pii
      - gdpr
```

4. **Version capabilities for better lifecycle management**:
```yaml
capabilities:
  - name: my_capability
    version: '1.0'
```

See [migrations/v0.2.3-to-v0.2.4.md](migrations/v0.2.3-to-v0.2.4.md) for detailed migration guide.

## Installation

### Development Version
```bash
npm install -g @bluefly/openstandardagents@0.2.4-dev
```

### Verify Installation
```bash
ossa --version
# Output: 0.2.4-dev
```

## Compatibility

| Component | Version | Status |
|-----------|---------|--------|
| Node.js | >=18.0.0 | Required |
| npm | >=9.0.0 | Required |
| kAgent | v1alpha1, v1alpha2 | Full support |
| Drupal | 11.x, 10.x | Full support |
| OpenAI Agents SDK | v2.x | Full support |
| LangChain | v0.3.x | Full support |
| CrewAI | v0.11.x | Full support |
| MCP | Latest | Full support |
| Google ADK | Preview | Experimental |
| A2A Protocol | v0.1 | Experimental |

## Known Issues

- Transport metadata validation is experimental and may be refined
- State storage backends are limited to documented types
- Capability versioning pattern may change before stable release
- Google ADK extension is based on ADK preview release

## Testing

All existing tests pass. New tests added for:
- Transport metadata validation
- State configuration validation
- Security scopes validation
- Capability versioning validation
- Google ADK extension validation

## Security

No new security vulnerabilities introduced.

**Recommendations**:
- Use scopes to enforce least-privilege access
- Apply compliance_tags consistently for regulated data
- Review security implications of new transport modes

## Use Cases

### Streaming LLM Agent
```yaml
spec:
  tools:
    - type: http
      transport:
        protocol: http
        streaming: response
        content_type: text/event-stream
```

### Stateful Chat Agent
```yaml
spec:
  state:
    mode: session
    storage:
      type: memory
      retention: 24h
    context_window:
      max_messages: 50
```

### HIPAA-Compliant Agent
```yaml
spec:
  tools:
    - type: http
      auth:
        scopes: [read:phi, write:phi]
      compliance_tags: [hipaa, pii]
```

### Google ADK Multi-Agent
```yaml
extensions:
  google_adk:
    enabled: true
    agent_type: sequential_agent
    sub_agents: [researcher, writer, reviewer]
```

## Roadmap to v0.2.4 Stable

- [ ] Finalize transport metadata validation rules
- [ ] Extend state storage backend options
- [ ] Refine capability versioning semantics
- [ ] Update Google ADK extension for GA release
- [ ] Enhanced A2A protocol support
- [ ] Additional examples and migration guides

## Contributors

- Transport and streaming design
- State management implementation
- Security scopes and compliance tagging
- Capability versioning system
- Google ADK extension

## Feedback

This is a development release. Please provide feedback:

- **Issues**: https://github.com/blueflyio/openstandardagents/issues
- **Documentation**: https://github.com/blueflyio/openstandardagents

## Next Steps

### v0.2.4 Stable (Planned)
- Finalized transport and state schemas
- Comprehensive examples
- Full test coverage
- Production-ready Google ADK extension

### v0.3.0 (Future)
- Agent composition patterns
- Distributed state management
- Cross-agent memory sharing
- Enhanced A2A protocol support

## Support

- **Documentation**: https://github.com/blueflyio/openstandardagents
- **Issues**: https://github.com/blueflyio/openstandardagents/issues
- **Examples**: https://github.com/blueflyio/openstandardagents/tree/main/examples

---

**Full Changelog**: [v0.2.3...v0.2.4-dev](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/compare/v0.2.3...v0.2.4-dev)
