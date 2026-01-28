# CloudEvents Support for OSSA Python SDK

Production-quality CloudEvents v1.0 implementation for enterprise observability and event streaming.

## Features

✅ **CloudEvents v1.0 Compliant** - Full spec implementation
✅ **Multiple Sinks** - HTTP, Kafka, stdout with extensible architecture
✅ **Event Batching** - Configurable batching with auto-flush
✅ **Type-Safe** - Full Pydantic v2 models with type hints
✅ **OSSA Extensions** - Agent ID, interaction ID, trace/span IDs
✅ **Context Manager** - Automatic flush on exit
✅ **90%+ Test Coverage** - Comprehensive test suite

## Installation

```bash
# Core SDK (includes CloudEvents)
pip install ossa-sdk

# With HTTP sink support
pip install ossa-sdk[events]

# With all optional dependencies
pip install ossa-sdk[all]
```

## Quick Start

### Basic Usage

```python
from ossa.events import CloudEventsEmitter, OSSA_EVENT_TYPES

# Create emitter (defaults to stdout)
emitter = CloudEventsEmitter(source="ossa/my-agent")

# Emit agent started event
emitter.emit(
    OSSA_EVENT_TYPES.AGENT_STARTED,
    {"agent_id": "agent-001", "status": "running"},
    ossaagentid="my-agent"
)
```

### With HTTP Sink

```python
from ossa.events import CloudEventsEmitter, HttpSink, OSSA_EVENT_TYPES

# Configure HTTP endpoint
sink = HttpSink(
    url="https://events.example.com/webhook",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    mode="structured",  # or "binary"
)

# Create emitter
emitter = CloudEventsEmitter(
    source="ossa/my-agent",
    sink=sink,
)

# Emit events
emitter.emit(OSSA_EVENT_TYPES.AGENT_STARTED, {"agent_id": "123"})
```

### With Kafka Sink

```python
from ossa.events import CloudEventsEmitter, KafkaSink

# Configure Kafka (requires kafka-python)
sink = KafkaSink(
    bootstrap_servers=["localhost:9092"],
    topic="ossa-events",
    key_field="ossaagentid",  # Use agent ID as partition key
)

emitter = CloudEventsEmitter(source="ossa/my-agent", sink=sink)
emitter.emit("dev.ossa.agent.started", {"agent_id": "123"})
```

### Event Batching

```python
from ossa.events import CloudEventsEmitter

# Enable batching
with CloudEventsEmitter(
    source="ossa/my-agent",
    batch_size=10,
    flush_interval_ms=5000,  # Auto-flush every 5 seconds
) as emitter:
    for i in range(100):
        emitter.emit("dev.ossa.tool.called", {"iteration": i})

# Auto-flush on context manager exit
```

## CloudEvents Structure

### Required Attributes

```python
{
    "specversion": "1.0",           # CloudEvents version
    "type": "dev.ossa.agent.started",  # Event type
    "source": "ossa/my-agent",      # Event source
    "id": "550e8400-...",            # Unique event ID
}
```

### Optional Attributes

```python
{
    "time": "2024-01-27T12:00:00Z",       # ISO 8601 timestamp
    "datacontenttype": "application/json", # MIME type
    "subject": "agent-123",               # Event subject
    "data": {"key": "value"},             # Event payload
}
```

### OSSA Extensions

```python
{
    "ossaagentid": "my-agent",           # Agent identifier
    "ossainteractionid": "session-123",  # Conversation ID
    "ossatraceid": "trace-abc",          # Distributed trace ID
    "ossaspanid": "span-001",            # Trace span ID
}
```

## OSSA Event Types

Standard event types for OSSA agents:

```python
from ossa.events import OSSA_EVENT_TYPES

# Agent lifecycle
OSSA_EVENT_TYPES.AGENT_STARTED       # "dev.ossa.agent.started"
OSSA_EVENT_TYPES.AGENT_COMPLETED     # "dev.ossa.agent.completed"
OSSA_EVENT_TYPES.AGENT_FAILED        # "dev.ossa.agent.failed"

# Tool execution
OSSA_EVENT_TYPES.TOOL_CALLED         # "dev.ossa.tool.called"
OSSA_EVENT_TYPES.TOOL_COMPLETED      # "dev.ossa.tool.completed"
OSSA_EVENT_TYPES.TOOL_FAILED         # "dev.ossa.tool.failed"

# Turns/conversation
OSSA_EVENT_TYPES.TURN_STARTED        # "dev.ossa.turn.started"
OSSA_EVENT_TYPES.TURN_COMPLETED      # "dev.ossa.turn.completed"

# State management
OSSA_EVENT_TYPES.STATE_UPDATED       # "dev.ossa.state.updated"

# Workflow
OSSA_EVENT_TYPES.WORKFLOW_STARTED    # "dev.ossa.workflow.started"
OSSA_EVENT_TYPES.WORKFLOW_COMPLETED  # "dev.ossa.workflow.completed"
```

## Sinks

### StdoutSink

Print events to stdout (default):

```python
from ossa.events import StdoutSink

sink = StdoutSink(pretty=True)  # Pretty-print JSON
```

### HttpSink

Send events to HTTP endpoint:

```python
from ossa.events import HttpSink

# Structured mode (recommended)
sink = HttpSink(
    url="https://events.example.com/webhook",
    headers={"Authorization": "Bearer token"},
    mode="structured",  # JSON body with all attributes
    timeout=30,
)

# Binary mode (CloudEvents headers)
sink = HttpSink(
    url="https://events.example.com/webhook",
    mode="binary",  # Attributes in ce-* headers
)
```

### KafkaSink

Send events to Kafka topic:

```python
from ossa.events import KafkaSink

sink = KafkaSink(
    bootstrap_servers=["localhost:9092", "kafka-2:9092"],
    topic="ossa-events",
    client_id="ossa-agent",
    key_field="ossaagentid",  # Partition by agent ID
    # Additional Kafka producer config
    acks="all",
    compression_type="gzip",
)
```

## Formatters

### JsonFormatter

Format events as JSON:

```python
from ossa.events import JsonFormatter

# Compact JSON (single line)
formatter = JsonFormatter(pretty=False)

# Pretty-printed JSON
formatter = JsonFormatter(pretty=True, indent=2)

# JSON Lines format
jsonlines = formatter.format_jsonlines(events)
```

### BinaryFormatter

Format for HTTP binary mode:

```python
from ossa.events.formatters import BinaryFormatter

formatter = BinaryFormatter()
headers, body = formatter.format_http(event)

# headers = {"ce-specversion": "1.0", "ce-type": "...", ...}
# body = JSON string of event data
```

## Complete Agent Workflow Example

```python
from ossa.events import CloudEventsEmitter, OSSA_EVENT_TYPES

# Create emitter with context manager
with CloudEventsEmitter(
    source="ossa/workflow-agent",
    batch_size=5,
) as emitter:
    # Agent started
    emitter.emit(
        OSSA_EVENT_TYPES.AGENT_STARTED,
        {"agent_id": "agent-001", "task": "data processing"},
        ossaagentid="workflow-agent",
        ossainteractionid="session-123",
        ossatraceid="trace-abc",
    )

    # Turn started
    emitter.emit(
        OSSA_EVENT_TYPES.TURN_STARTED,
        {"turn_number": 1, "user_input": "Process data"},
        ossaagentid="workflow-agent",
        ossainteractionid="session-123",
        ossatraceid="trace-abc",
        ossaspanid="span-001",
    )

    # Tool execution
    emitter.emit(
        OSSA_EVENT_TYPES.TOOL_CALLED,
        {"tool": "database_query", "params": {...}},
        ossaagentid="workflow-agent",
        ossainteractionid="session-123",
        ossatraceid="trace-abc",
        ossaspanid="span-002",
    )

    emitter.emit(
        OSSA_EVENT_TYPES.TOOL_COMPLETED,
        {"tool": "database_query", "result": {...}},
        ossaagentid="workflow-agent",
        ossainteractionid="session-123",
        ossatraceid="trace-abc",
        ossaspanid="span-002",
    )

    # Turn completed
    emitter.emit(
        OSSA_EVENT_TYPES.TURN_COMPLETED,
        {"turn_number": 1, "status": "success"},
        ossaagentid="workflow-agent",
        ossainteractionid="session-123",
        ossatraceid="trace-abc",
        ossaspanid="span-001",
    )

    # Agent completed
    emitter.emit(
        OSSA_EVENT_TYPES.AGENT_COMPLETED,
        {"agent_id": "agent-001", "status": "success"},
        ossaagentid="workflow-agent",
        ossainteractionid="session-123",
        ossatraceid="trace-abc",
    )

# Events auto-flushed on exit
```

## Error Handling

```python
from ossa.events import CloudEventsEmitter, HttpSink

sink = HttpSink(url="https://events.example.com/webhook")
emitter = CloudEventsEmitter(source="ossa/my-agent", sink=sink)

try:
    emitter.emit("dev.ossa.agent.started", {"agent_id": "123"})
except Exception as e:
    print(f"Failed to send event: {e}")
    # Implement retry logic or fallback
```

## Testing

Run the test suite:

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest tests/test_cloudevents.py -v

# Run with coverage
pytest tests/test_cloudevents.py --cov=ossa.events --cov-report=html
```

## Architecture

```
ossa.events/
├── cloudevents.py      # CloudEvent model + emitter
├── sinks.py            # Delivery targets (HTTP, Kafka, stdout)
├── formatters.py       # Event formatters (JSON, binary)
└── __init__.py         # Public API
```

## Specification Compliance

This implementation follows:

- **CloudEvents v1.0**: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md
- **JSON Format**: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/formats/json-format.md
- **HTTP Binding**: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/bindings/http-protocol-binding.md

## Feature Parity with TypeScript SDK

✅ CloudEvent model with Pydantic validation
✅ Event emitter with batching
✅ HTTP sink (structured + binary mode)
✅ Kafka sink
✅ Stdout sink
✅ OSSA event types constants
✅ OSSA extension attributes
✅ Context manager support
✅ Auto-flush on interval
✅ Type-safe API

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

Apache 2.0 - See [LICENSE](../../LICENSE)

## Resources

- **OSSA Spec**: https://openstandardagents.org
- **CloudEvents Spec**: https://cloudevents.io
- **Python SDK Docs**: https://openstandardagents.org/docs/sdks/python
- **Examples**: See `examples/cloudevents_example.py`
