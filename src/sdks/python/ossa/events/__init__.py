"""
CloudEvents support for OSSA agents.

Implements CloudEvents v1.0 specification for agent observability and event streaming.

Quick Start:
    >>> from ossa.events import CloudEventsEmitter, CloudEvent
    >>> emitter = CloudEventsEmitter(source="ossa/my-agent")
    >>> emitter.emit("dev.ossa.agent.started", {"agent_id": "123"})

For more examples, see: https://openstandardagents.org/docs/events
"""

from .cloudevents import (
    CloudEvent,
    CloudEventsEmitter,
    CloudEventsEmitterConfig,
    OSSA_EVENT_TYPES,
)
from .sinks import (
    CloudEventsSink,
    HttpSink,
    KafkaSink,
    StdoutSink,
)
from .formatters import (
    CloudEventsFormatter,
    JsonFormatter,
)

__all__ = [
    # Core
    "CloudEvent",
    "CloudEventsEmitter",
    "CloudEventsEmitterConfig",
    "OSSA_EVENT_TYPES",

    # Sinks
    "CloudEventsSink",
    "HttpSink",
    "KafkaSink",
    "StdoutSink",

    # Formatters
    "CloudEventsFormatter",
    "JsonFormatter",
]
