"""
CloudEvents-compliant Event Emitter for OSSA agents.

Implements CloudEvents v1.0 specification:
https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md
"""

import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Generic, Literal, Optional, TypeVar

from pydantic import BaseModel, Field

from .sinks import CloudEventsSink, StdoutSink

T = TypeVar("T")


class CloudEvent(BaseModel, Generic[T]):
    """
    CloudEvents v1.0 compliant event.

    Specification: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md

    Required Attributes:
        specversion: CloudEvents specification version (always "1.0")
        type: Event type identifier (reverse-DNS notation recommended)
        source: Event source identifier (URI-reference)
        id: Unique event identifier

    Optional Attributes:
        time: Timestamp when event occurred (ISO 8601)
        datacontenttype: MIME type of data attribute
        subject: Subject of the event in context of source
        data: Event payload (any JSON-serializable type)

    OSSA Extensions:
        ossaagentid: OSSA agent identifier
        ossainteractionid: Interaction/conversation identifier
        ossatraceid: Distributed trace identifier
        ossaspanid: Trace span identifier
    """

    # Required attributes
    specversion: Literal["1.0"] = Field(default="1.0", description="CloudEvents spec version")
    type: str = Field(..., description="Event type (e.g., dev.ossa.agent.started)")
    source: str = Field(..., description="Event source identifier (URI-reference)")
    id: str = Field(..., description="Unique event identifier")

    # Optional attributes
    time: Optional[str] = Field(default=None, description="ISO 8601 timestamp")
    datacontenttype: Optional[str] = Field(
        default="application/json", description="MIME type of data"
    )
    subject: Optional[str] = Field(default=None, description="Event subject")
    data: Optional[T] = Field(default=None, description="Event payload")

    # OSSA Extensions
    ossaagentid: Optional[str] = Field(default=None, description="OSSA agent ID")
    ossainteractionid: Optional[str] = Field(
        default=None, description="Interaction/conversation ID"
    )
    ossatraceid: Optional[str] = Field(default=None, description="Distributed trace ID")
    ossaspanid: Optional[str] = Field(default=None, description="Trace span ID")

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "specversion": "1.0",
                "type": "dev.ossa.agent.started",
                "source": "ossa/my-agent",
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "time": "2024-01-27T12:00:00Z",
                "datacontenttype": "application/json",
                "data": {"agent_id": "my-agent", "status": "started"},
            }
        }


class CloudEventsEmitterConfig(BaseModel):
    """Configuration for CloudEvents emitter."""

    source: str = Field(..., description="Event source identifier (required)")
    default_type: Optional[str] = Field(
        default=None, description="Default event type if not specified"
    )
    sink: Optional[CloudEventsSink] = Field(
        default=None, description="Event sink (defaults to stdout)"
    )
    batch_size: int = Field(default=1, ge=1, description="Batch size for event buffering")
    flush_interval_ms: Optional[int] = Field(
        default=None, ge=100, description="Auto-flush interval in milliseconds"
    )

    class Config:
        """Pydantic configuration."""
        arbitrary_types_allowed = True


class CloudEventsEmitter:
    """
    CloudEvents emitter with batching and multiple sink support.

    Supports:
    - HTTP endpoints (structured/binary mode)
    - Kafka topics
    - Stdout (JSON lines)
    - Custom sinks via CloudEventsSink interface

    Example:
        >>> from ossa.events import CloudEventsEmitter, HttpSink
        >>> sink = HttpSink(url="https://events.example.com/webhook")
        >>> emitter = CloudEventsEmitter(
        ...     source="ossa/my-agent",
        ...     sink=sink,
        ...     batch_size=10,
        ...     flush_interval_ms=5000
        ... )
        >>> emitter.emit("dev.ossa.agent.started", {"agent_id": "123"})
    """

    def __init__(
        self,
        source: str,
        sink: Optional[CloudEventsSink] = None,
        default_type: Optional[str] = None,
        batch_size: int = 1,
        flush_interval_ms: Optional[int] = None,
    ):
        """
        Initialize CloudEvents emitter.

        Args:
            source: Event source identifier (required)
            sink: Event sink (defaults to stdout)
            default_type: Default event type if not specified
            batch_size: Number of events to buffer before flushing (default: 1)
            flush_interval_ms: Auto-flush interval in milliseconds (optional)
        """
        self.config = CloudEventsEmitterConfig(
            source=source,
            default_type=default_type,
            sink=sink or StdoutSink(),
            batch_size=batch_size,
            flush_interval_ms=flush_interval_ms,
        )
        self.buffer: list[CloudEvent[Any]] = []
        self._last_flush_time = time.time()
        self._flush_timer_enabled = flush_interval_ms is not None

    def emit(
        self,
        event_type: str,
        data: Any = None,
        **kwargs: Any,
    ) -> CloudEvent[Any]:
        """
        Emit a CloudEvent.

        Args:
            event_type: Event type (e.g., "dev.ossa.agent.started")
            data: Event payload (any JSON-serializable type)
            **kwargs: Additional CloudEvent attributes (time, subject, etc.)

        Returns:
            CloudEvent: The emitted event

        Example:
            >>> event = emitter.emit(
            ...     "dev.ossa.agent.started",
            ...     {"agent_id": "123"},
            ...     subject="agent-123",
            ...     ossaagentid="my-agent"
            ... )
        """
        event = CloudEvent[Any](
            specversion="1.0",
            type=event_type,
            source=self.config.source,
            id=self._generate_id(),
            time=kwargs.pop("time", None) or self._generate_timestamp(),
            datacontenttype=kwargs.pop("datacontenttype", "application/json"),
            data=data,
            **kwargs,
        )

        if self.config.batch_size > 1:
            self.buffer.append(event)
            if len(self.buffer) >= self.config.batch_size:
                self.flush()
            elif self._should_auto_flush():
                self.flush()
        else:
            self._send([event])

        return event

    def flush(self) -> None:
        """
        Flush buffered events to sink.

        This is called automatically when:
        - Buffer reaches batch_size
        - flush_interval_ms has elapsed (if configured)
        - destroy() is called

        Can also be called manually to force immediate flush.
        """
        if not self.buffer:
            return

        events = self.buffer[:]
        self.buffer.clear()
        self._last_flush_time = time.time()
        self._send(events)

    def destroy(self) -> None:
        """
        Cleanup emitter and flush any remaining events.

        Should be called when shutting down to ensure no events are lost.
        """
        self.flush()

    def _generate_id(self) -> str:
        """Generate unique event ID."""
        return str(uuid.uuid4())

    def _generate_timestamp(self) -> str:
        """Generate ISO 8601 timestamp."""
        return datetime.now(timezone.utc).isoformat()

    def _should_auto_flush(self) -> bool:
        """Check if auto-flush interval has elapsed."""
        if not self._flush_timer_enabled or not self.config.flush_interval_ms:
            return False

        elapsed_ms = (time.time() - self._last_flush_time) * 1000
        return elapsed_ms >= self.config.flush_interval_ms

    def _send(self, events: list[CloudEvent[Any]]) -> None:
        """Send events to configured sink."""
        if self.config.sink:
            self.config.sink.send(events)

    def __enter__(self) -> "CloudEventsEmitter":
        """Context manager entry."""
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Context manager exit - flush on exit."""
        self.destroy()


# OSSA Event Type Constants
class OSSA_EVENT_TYPES:
    """Standard OSSA event types (CloudEvents type attribute)."""

    # Agent lifecycle
    AGENT_STARTED = "dev.ossa.agent.started"
    AGENT_COMPLETED = "dev.ossa.agent.completed"
    AGENT_FAILED = "dev.ossa.agent.failed"

    # Tool execution
    TOOL_CALLED = "dev.ossa.tool.called"
    TOOL_COMPLETED = "dev.ossa.tool.completed"
    TOOL_FAILED = "dev.ossa.tool.failed"

    # Turn/conversation
    TURN_STARTED = "dev.ossa.turn.started"
    TURN_COMPLETED = "dev.ossa.turn.completed"

    # State management
    STATE_UPDATED = "dev.ossa.state.updated"

    # Workflow
    WORKFLOW_STARTED = "dev.ossa.workflow.started"
    WORKFLOW_COMPLETED = "dev.ossa.workflow.completed"
