# OSSA Distributed Tracing (W3C Baggage)

Production-ready W3C Baggage implementation for distributed tracing and multi-agent correlation in the OSSA Python SDK.

## Overview

This module provides comprehensive support for distributed tracing across agent boundaries using the [W3C Baggage specification](https://www.w3.org/TR/baggage/). It enables correlation IDs, trace context propagation, and multi-agent workflow tracking.

### Features

- ✅ **W3C Baggage Compliance** - Full implementation of W3C Baggage spec
- ✅ **OpenTelemetry Compatible** - Trace IDs (128-bit) and Span IDs (64-bit)
- ✅ **OSSA Context** - Agent-specific context fields (agent_id, interaction_id, workflow_id, etc.)
- ✅ **HTTP Header Integration** - Automatic header parsing and building
- ✅ **Context Propagation** - Parent-child relationships with automatic inheritance
- ✅ **Type Safety** - Full type hints for Python 3.9+
- ✅ **Thread Safe ID Generation** - Cryptographically secure random IDs
- ✅ **Size Validation** - Enforces W3C limits (180 pairs, 8KB max)

## Quick Start

### Basic Usage

```python
from ossa.tracing import W3CBaggage, create_ossa_baggage

# Create baggage with OSSA context
baggage = create_ossa_baggage(
    agent_id="agent-001",
    interaction_id="int-123",
    environment="production"
)

# Convert to HTTP header
headers = baggage.to_headers()
# {'baggage': 'ossa.agent_id=agent-001,ossa.interaction_id=int-123,...'}

# Parse from HTTP header
incoming = W3CBaggage.parse(headers['baggage'])
context = incoming.get_ossa_context()
print(context.agent_id)  # 'agent-001'
```

### Trace Context (Recommended)

```python
from ossa.tracing import TraceContext

# Create root trace context
context = TraceContext.create(
    agent_id="agent-001",
    interaction_id="int-123",
    workflow_id="wf-456"
)

# Send to another agent
headers = context.headers  # Use in HTTP request

# Receiving agent
incoming_context = TraceContext.from_headers(headers)
print(incoming_context.correlation.trace_id)  # Same trace ID
```

### Parent-Child Propagation

```python
from ossa.tracing import TraceContext

# Parent agent
parent = TraceContext.create(
    agent_id="parent-agent",
    interaction_id="int-123"
)

# Create child context for delegation
child = parent.create_child_context(
    child_agent_id="child-agent",
    step="processing"
)

# Trace ID is preserved
assert child.correlation.trace_id == parent.correlation.trace_id

# Parent relationship tracked
child_ossa = child.baggage.get_ossa_context()
assert child_ossa.parent_agent_id == "parent-agent"
```

## API Reference

### Core Classes

#### `W3CBaggage`

W3C Baggage implementation with OSSA extensions.

```python
baggage = W3CBaggage()

# Set/get entries
baggage.set("key", "value", metadata={"ttl": "3600"})
value = baggage.get("key")

# OSSA context
baggage.set_ossa_context(OSSABaggage(agent_id="agent-001"))
context = baggage.get_ossa_context()

# Headers
header_string = baggage.to_string()
headers_dict = baggage.to_headers()

# Parsing
parsed = W3CBaggage.parse("key=value,ossa.agent_id=agent-001")

# Merging
merged = baggage1.merge(baggage2)
```

#### `OSSABaggage`

OSSA-specific baggage context.

```python
from ossa.tracing import OSSABaggage

context = OSSABaggage(
    agent_id="agent-001",           # Current agent
    interaction_id="int-123",        # Session/interaction
    trace_id="abc...",               # 32 hex chars
    span_id="def...",                # 16 hex chars
    parent_agent_id="parent-001",    # Parent agent
    workflow_id="wf-456",            # Workflow/orchestration
    tenant_id="tenant-789",          # Multi-tenancy
    custom={"env": "production"}     # Custom fields
)
```

#### `TraceContext`

Complete trace context combining baggage and correlation.

```python
from ossa.tracing import TraceContext

# Create
context = TraceContext.create(
    agent_id="agent-001",
    interaction_id="int-123"
)

# From headers
context = TraceContext.from_headers({"baggage": "..."})

# Child context
child = context.create_child_context(child_agent_id="agent-002")

# Metadata
context.merge_metadata({"environment": "production"})

# Export
data = context.to_dict()
headers = context.headers
```

#### `CorrelationContext`

Correlation context for tracking related operations.

```python
from ossa.tracing import create_correlation_context

context = create_correlation_context(
    agent_id="agent-001",
    interaction_id="int-123",
    environment="production"
)

# Child context
child = context.create_child_context(agent_id="agent-002")

# Export
data = context.to_dict()
```

### Utility Functions

#### ID Generation

```python
from ossa.tracing import (
    generate_correlation_id,  # UUID v4 (36 chars)
    generate_trace_id,        # 32 hex chars (128 bits)
    generate_span_id,         # 16 hex chars (64 bits)
)

correlation_id = generate_correlation_id()  # "550e8400-e29b-41d4-a716-446655440000"
trace_id = generate_trace_id()              # "0af7651916cd43dd8448eb211c80319c"
span_id = generate_span_id()                # "b9c7c989f97918e1"
```

#### ID Validation

```python
from ossa.tracing import (
    validate_correlation_id,
    validate_trace_id,
    validate_span_id,
)

assert validate_trace_id("0af7651916cd43dd8448eb211c80319c") is True
assert validate_span_id("b9c7c989f97918e1") is True
assert validate_correlation_id("550e8400-e29b-41d4-a716-446655440000") is True
```

#### Context Propagation

```python
from ossa.tracing import propagate_ossa_context, create_ossa_baggage

# Create parent baggage
parent = create_ossa_baggage(
    agent_id="parent",
    interaction_id="int-123"
)

# Propagate to child
child = propagate_ossa_context(parent, child_agent_id="child")

# Parent relationship preserved
child_ctx = child.get_ossa_context()
assert child_ctx.parent_agent_id == "parent"
```

## Use Cases

### 1. Multi-Agent Workflows

Track requests across multiple agents with preserved trace context:

```python
from ossa.tracing import TraceContext

# Orchestrator agent
orchestrator = TraceContext.create(
    agent_id="orchestrator",
    interaction_id="user-request-123",
    workflow_id="approval-workflow"
)

# Delegate to analyzer
analyzer_ctx = orchestrator.create_child_context(
    child_agent_id="analyzer",
    step="analysis"
)

# Pass headers to analyzer
response = requests.post(
    "http://analyzer-agent/analyze",
    headers=analyzer_ctx.headers
)

# Analyzer delegates to reviewer
reviewer_ctx = analyzer_ctx.create_child_context(
    child_agent_id="reviewer",
    step="review"
)

# All share same trace_id for end-to-end tracking
```

### 2. HTTP Request/Response

Propagate context via HTTP headers:

```python
from ossa.tracing import TraceContext
import requests

# Outgoing request
context = TraceContext.create(
    agent_id="client-agent",
    interaction_id="int-123"
)

response = requests.post(
    "https://api.example.com/action",
    headers=context.headers,
    json={"action": "process"}
)

# Incoming request (server side)
def handle_request(request):
    context = TraceContext.from_headers(request.headers)

    # Now you have full trace context
    agent_id = context.correlation.agent_id
    trace_id = context.correlation.trace_id

    # Create response with child context
    response_ctx = context.create_child_context(
        child_agent_id="server-agent"
    )

    return {
        "result": "...",
        "headers": response_ctx.headers
    }
```

### 3. Multi-Tenant Systems

Track tenant context across agent boundaries:

```python
from ossa.tracing import TraceContext

context = TraceContext.create(
    agent_id="agent-001",
    interaction_id="int-123",
    tenant_id="tenant-789",
    environment="production"
)

# Tenant ID propagates to all child contexts
child = context.create_child_context(child_agent_id="agent-002")

child_ossa = child.baggage.get_ossa_context()
assert child_ossa.tenant_id == "tenant-789"
```

### 4. Custom Metadata

Add domain-specific context:

```python
from ossa.tracing import create_ossa_baggage

baggage = create_ossa_baggage(
    agent_id="agent-001",
    interaction_id="int-123",
    # Custom fields
    environment="production",
    region="us-west-2",
    version="1.2.3",
    customer_tier="enterprise"
)

context = baggage.get_ossa_context()
assert context.custom["environment"] == "production"
assert context.custom["region"] == "us-west-2"
```

## Architecture

### W3C Baggage Format

```
baggage: key1=value1;metadata1=val1,key2=value2,ossa.agent_id=agent-001
         └─────┬─────┘└────────┬────────┘└──────┬──────┘└──────────┬─────────┘
               │               │                │                   │
            Key-Value      Metadata        Separator         OSSA Prefix
```

### OSSA Context Fields

All OSSA fields use the `ossa.` prefix:

| Field | Key | Description | Example |
|-------|-----|-------------|---------|
| Agent ID | `ossa.agent_id` | Current agent identifier | `agent-001` |
| Interaction ID | `ossa.interaction_id` | Session/interaction ID | `int-123` |
| Trace ID | `ossa.trace_id` | Distributed trace ID (128-bit) | `0af7651916cd43dd...` |
| Span ID | `ossa.span_id` | Current span ID (64-bit) | `b9c7c989f97918e1` |
| Parent Agent ID | `ossa.parent_agent_id` | Parent agent in chain | `parent-001` |
| Workflow ID | `ossa.workflow_id` | Workflow/orchestration ID | `wf-456` |
| Tenant ID | `ossa.tenant_id` | Multi-tenant isolation | `tenant-789` |
| Custom | `ossa.custom.*` | Custom context fields | `ossa.custom.env=prod` |

### Trace Hierarchy

```
Root Agent (trace_id: abc123)
├─ Agent A (span_id: 1111, parent_agent_id: root)
│  └─ Agent B (span_id: 2222, parent_agent_id: agent-a)
│     └─ Agent C (span_id: 3333, parent_agent_id: agent-b)
└─ Agent D (span_id: 4444, parent_agent_id: root)

All share same trace_id for end-to-end correlation
```

## Limitations

### W3C Specification Limits

- **Maximum pairs**: 180 key-value pairs per baggage
- **Maximum size**: 8192 bytes total header size
- **Encoding**: URL encoding for keys and values

### Best Practices

1. **Keep baggage small** - Only include essential context
2. **Use custom fields sparingly** - Prefer well-known fields
3. **Validate trace IDs** - Use provided validation functions
4. **Create new contexts per agent** - Don't share contexts across threads
5. **Propagate at boundaries** - Create child contexts when delegating

## Error Handling

```python
from ossa.tracing import BaggageSizeError, BaggageParseError

try:
    baggage = W3CBaggage()
    for i in range(200):  # Exceeds MAX_PAIRS
        baggage.set(f"key{i}", f"value{i}")
except BaggageSizeError as e:
    print(f"Too many baggage entries: {e}")

try:
    parsed = W3CBaggage.parse("malformed:::header")
except BaggageParseError as e:
    print(f"Failed to parse: {e}")
```

## Testing

Run the test suite:

```bash
cd src/sdks/python
python -m pytest tests/test_w3c_baggage.py -v
```

Run verification script:

```bash
cd src/sdks/python
python verify_baggage.py
```

## Integration with OSSA Agents

```python
from ossa import Agent, load_manifest
from ossa.tracing import TraceContext

# Load agent
manifest = load_manifest("agent.yaml")
agent = Agent(manifest, api_key="sk-...")

# Create trace context
context = TraceContext.create(
    agent_id=manifest.metadata.id,
    interaction_id="int-123"
)

# Run agent with context
response = agent.run(
    "Hello!",
    headers=context.headers  # Propagate context
)

# Extract response context
response_context = TraceContext.from_headers(response.headers)
```

## Standards Compliance

- ✅ [W3C Baggage Specification](https://www.w3.org/TR/baggage/)
- ✅ [OpenTelemetry Trace Context](https://www.w3.org/TR/trace-context/)
- ✅ [RFC 4122 (UUID)](https://www.rfc-editor.org/rfc/rfc4122)
- ✅ [RFC 3986 (URL Encoding)](https://www.rfc-editor.org/rfc/rfc3986)

## License

Part of the OSSA SDK - see main SDK license.

## Related Documentation

- [W3C Baggage Specification](https://www.w3.org/TR/baggage/)
- [OSSA SDK Documentation](https://openstandardagents.org/docs/sdks/python)
- [OpenTelemetry Python](https://opentelemetry.io/docs/instrumentation/python/)
