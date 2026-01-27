# CloudEvents Quick Reference

**One-page reference for OSSA CloudEvents Python SDK**

---

## Installation

```bash
pip install ossa-sdk[events]  # Includes HTTP/Kafka support
```

---

## Basic Usage

```python
from ossa.events import CloudEventsEmitter, OSSA_EVENT_TYPES

# Create emitter
emitter = CloudEventsEmitter(source="ossa/my-agent")

# Emit event
emitter.emit(
    OSSA_EVENT_TYPES.AGENT_STARTED,
    {"agent_id": "123", "status": "running"}
)
```

---

## Sinks

### Stdout (Default)

```python
from ossa.events import StdoutSink

sink = StdoutSink(pretty=True)
emitter = CloudEventsEmitter(source="ossa/my-agent", sink=sink)
```

### HTTP

```python
from ossa.events import HttpSink

sink = HttpSink(
    url="https://events.example.com/webhook",
    headers={"Authorization": "Bearer token"},
    mode="structured"  # or "binary"
)
emitter = CloudEventsEmitter(source="ossa/my-agent", sink=sink)
```

### Kafka

```python
from ossa.events import KafkaSink

sink = KafkaSink(
    bootstrap_servers=["localhost:9092"],
    topic="ossa-events",
    key_field="ossaagentid"
)
emitter = CloudEventsEmitter(source="ossa/my-agent", sink=sink)
```

---

## Event Types

```python
from ossa.events import OSSA_EVENT_TYPES

OSSA_EVENT_TYPES.AGENT_STARTED       # Agent lifecycle
OSSA_EVENT_TYPES.AGENT_COMPLETED
OSSA_EVENT_TYPES.AGENT_FAILED

OSSA_EVENT_TYPES.TOOL_CALLED         # Tool execution
OSSA_EVENT_TYPES.TOOL_COMPLETED
OSSA_EVENT_TYPES.TOOL_FAILED

OSSA_EVENT_TYPES.TURN_STARTED        # Conversation turns
OSSA_EVENT_TYPES.TURN_COMPLETED

OSSA_EVENT_TYPES.STATE_UPDATED       # State management

OSSA_EVENT_TYPES.WORKFLOW_STARTED    # Workflows
OSSA_EVENT_TYPES.WORKFLOW_COMPLETED
```

---

## Event Attributes

### Required

```python
event = emitter.emit(
    type="dev.ossa.agent.started",     # Event type (required)
    data={"key": "value"},             # Payload (optional)
)
# Auto-generated: id, time, source
```

### OSSA Extensions

```python
emitter.emit(
    "dev.ossa.agent.started",
    {"agent_id": "123"},
    ossaagentid="my-agent",            # Agent ID
    ossainteractionid="session-456",   # Conversation ID
    ossatraceid="trace-abc",           # Distributed trace ID
    ossaspanid="span-001",             # Trace span ID
)
```

---

## Batching

```python
# Batch by size
emitter = CloudEventsEmitter(
    source="ossa/my-agent",
    batch_size=10  # Flush after 10 events
)

# Batch by time
emitter = CloudEventsEmitter(
    source="ossa/my-agent",
    batch_size=100,
    flush_interval_ms=5000  # Flush every 5 seconds
)

# Manual flush
emitter.flush()
```

---

## Context Manager

```python
with CloudEventsEmitter(
    source="ossa/my-agent",
    batch_size=10
) as emitter:
    emitter.emit("dev.ossa.agent.started", {"agent_id": "123"})
    # Auto-flush on exit
```

---

## Complete Example

```python
from ossa.events import CloudEventsEmitter, HttpSink, OSSA_EVENT_TYPES

# Setup
sink = HttpSink(url="https://events.example.com/webhook")

with CloudEventsEmitter(source="ossa/my-agent", sink=sink) as emitter:
    # Agent started
    emitter.emit(
        OSSA_EVENT_TYPES.AGENT_STARTED,
        {"agent_id": "001"},
        ossaagentid="my-agent",
        ossatraceid="trace-123"
    )

    # Tool called
    emitter.emit(
        OSSA_EVENT_TYPES.TOOL_CALLED,
        {"tool": "search"},
        ossaagentid="my-agent",
        ossatraceid="trace-123",
        ossaspanid="span-001"
    )

    # Agent completed
    emitter.emit(
        OSSA_EVENT_TYPES.AGENT_COMPLETED,
        {"agent_id": "001", "status": "success"},
        ossaagentid="my-agent",
        ossatraceid="trace-123"
    )
```

---

## Testing

```python
import io
from ossa.events import CloudEventsEmitter, StdoutSink

# Capture output for testing
output = io.StringIO()
sink = StdoutSink(file=output)
emitter = CloudEventsEmitter(source="test", sink=sink)

emitter.emit("dev.ossa.test", {"key": "value"})

# Verify output
output.seek(0)
assert "dev.ossa.test" in output.read()
```

---

## CloudEvent Structure

```json
{
  "specversion": "1.0",
  "type": "dev.ossa.agent.started",
  "source": "ossa/my-agent",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "time": "2024-01-27T12:00:00Z",
  "datacontenttype": "application/json",
  "data": {
    "agent_id": "my-agent",
    "status": "started"
  },
  "ossaagentid": "my-agent",
  "ossainteractionid": "session-123",
  "ossatraceid": "trace-abc",
  "ossaspanid": "span-001"
}
```

---

## Error Handling

```python
try:
    emitter.emit("dev.ossa.agent.started", {"agent_id": "123"})
except Exception as e:
    print(f"Failed to emit event: {e}")
```

---

## Resources

- **Full Docs**: `ossa/events/README.md`
- **Examples**: `examples/cloudevents_example.py`
- **Tests**: `tests/test_cloudevents.py`
- **Spec**: https://cloudevents.io

---

**Quick Start**: `pip install ossa-sdk[events]` → `from ossa.events import CloudEventsEmitter` → `emitter.emit(...)`
