"""
Event sinks for CloudEvents delivery.

Supports multiple delivery targets:
- HTTP endpoints (CloudEvents structured/binary mode)
- Kafka topics (requires kafka-python package)
- Stdout (JSON lines for logging/debugging)
"""

import json
import sys
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any, Dict, Optional

from pydantic import BaseModel, Field, HttpUrl

if TYPE_CHECKING:
    from .cloudevents import CloudEvent


class CloudEventsSink(ABC):
    """Abstract base class for CloudEvents sinks."""

    @abstractmethod
    def send(self, events: list["CloudEvent[Any]"]) -> None:
        """
        Send CloudEvents to sink.

        Args:
            events: List of CloudEvents to send

        Raises:
            Exception: If delivery fails
        """
        pass


class StdoutSink(CloudEventsSink):
    """
    Stdout sink - prints events as JSON lines.

    Useful for:
    - Local development and debugging
    - Piping events to log aggregators
    - Integration with structured logging systems

    Example:
        >>> from ossa.events import CloudEventsEmitter, StdoutSink
        >>> sink = StdoutSink(pretty=True)
        >>> emitter = CloudEventsEmitter(source="ossa/my-agent", sink=sink)
        >>> emitter.emit("dev.ossa.agent.started", {"agent_id": "123"})
        {
          "specversion": "1.0",
          "type": "dev.ossa.agent.started",
          ...
        }
    """

    def __init__(self, pretty: bool = False, file: Any = None):
        """
        Initialize stdout sink.

        Args:
            pretty: Pretty-print JSON (default: False)
            file: File-like object to write to (default: sys.stdout)
        """
        self.pretty = pretty
        self.file = file or sys.stdout

    def send(self, events: list["CloudEvent[Any]"]) -> None:
        """Print events to stdout as JSON lines."""
        for event in events:
            if self.pretty:
                json_str = json.dumps(event.model_dump(exclude_none=True), indent=2)
            else:
                json_str = json.dumps(event.model_dump(exclude_none=True))
            print(json_str, file=self.file)


class HttpSinkConfig(BaseModel):
    """Configuration for HTTP sink."""

    url: str = Field(..., description="HTTP endpoint URL")
    headers: Dict[str, str] = Field(default_factory=dict, description="Additional headers")
    timeout: int = Field(default=30, ge=1, description="Request timeout in seconds")
    mode: str = Field(
        default="structured",
        description="CloudEvents mode: 'structured' or 'binary'",
    )

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "url": "https://events.example.com/webhook",
                "headers": {"Authorization": "Bearer token123"},
                "timeout": 30,
                "mode": "structured",
            }
        }


class HttpSink(CloudEventsSink):
    """
    HTTP sink - sends events to HTTP endpoint.

    Supports both CloudEvents modes:
    - Structured: Event as JSON body with application/cloudevents+json
    - Binary: Data as body with CloudEvents attributes in HTTP headers

    Example:
        >>> from ossa.events import CloudEventsEmitter, HttpSink
        >>> sink = HttpSink(
        ...     url="https://events.example.com/webhook",
        ...     headers={"Authorization": "Bearer token123"},
        ...     mode="structured"
        ... )
        >>> emitter = CloudEventsEmitter(source="ossa/my-agent", sink=sink)
        >>> emitter.emit("dev.ossa.agent.started", {"agent_id": "123"})
    """

    def __init__(
        self,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        timeout: int = 30,
        mode: str = "structured",
    ):
        """
        Initialize HTTP sink.

        Args:
            url: HTTP endpoint URL
            headers: Additional HTTP headers (optional)
            timeout: Request timeout in seconds (default: 30)
            mode: CloudEvents mode - "structured" or "binary" (default: "structured")
        """
        self.config = HttpSinkConfig(
            url=url,
            headers=headers or {},
            timeout=timeout,
            mode=mode,
        )

    def send(self, events: list["CloudEvent[Any]"]) -> None:
        """Send events to HTTP endpoint."""
        try:
            import requests
        except ImportError:
            raise ImportError(
                "requests package required for HTTP sink. "
                "Install with: pip install requests"
            )

        for event in events:
            if self.config.mode == "structured":
                self._send_structured(event, requests)
            else:
                self._send_binary(event, requests)

    def _send_structured(self, event: "CloudEvent[Any]", requests: Any) -> None:
        """Send event in structured mode (JSON body)."""
        headers = {
            "Content-Type": "application/cloudevents+json",
            **self.config.headers,
        }

        response = requests.post(
            self.config.url,
            json=event.model_dump(exclude_none=True),
            headers=headers,
            timeout=self.config.timeout,
        )
        response.raise_for_status()

    def _send_binary(self, event: "CloudEvent[Any]", requests: Any) -> None:
        """Send event in binary mode (headers + data body)."""
        headers = {
            "ce-specversion": event.specversion,
            "ce-type": event.type,
            "ce-source": event.source,
            "ce-id": event.id,
            **self.config.headers,
        }

        if event.time:
            headers["ce-time"] = event.time
        if event.subject:
            headers["ce-subject"] = event.subject
        if event.datacontenttype:
            headers["Content-Type"] = event.datacontenttype

        # Add OSSA extensions
        if event.ossaagentid:
            headers["ce-ossaagentid"] = event.ossaagentid
        if event.ossainteractionid:
            headers["ce-ossainteractionid"] = event.ossainteractionid
        if event.ossatraceid:
            headers["ce-ossatraceid"] = event.ossatraceid
        if event.ossaspanid:
            headers["ce-ossaspanid"] = event.ossaspanid

        response = requests.post(
            self.config.url,
            json=event.data,
            headers=headers,
            timeout=self.config.timeout,
        )
        response.raise_for_status()


class KafkaSinkConfig(BaseModel):
    """Configuration for Kafka sink."""

    bootstrap_servers: list[str] = Field(
        ..., description="Kafka bootstrap servers (host:port)"
    )
    topic: str = Field(..., description="Kafka topic name")
    client_id: Optional[str] = Field(default="ossa-events", description="Kafka client ID")
    key_field: Optional[str] = Field(
        default=None, description="Event field to use as message key"
    )
    config: Dict[str, Any] = Field(
        default_factory=dict, description="Additional Kafka producer config"
    )

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "bootstrap_servers": ["localhost:9092"],
                "topic": "ossa-events",
                "client_id": "ossa-events",
                "key_field": "ossaagentid",
            }
        }


class KafkaSink(CloudEventsSink):
    """
    Kafka sink - sends events to Kafka topic.

    Requires kafka-python package:
        pip install kafka-python

    Example:
        >>> from ossa.events import CloudEventsEmitter, KafkaSink
        >>> sink = KafkaSink(
        ...     bootstrap_servers=["localhost:9092"],
        ...     topic="ossa-events",
        ...     key_field="ossaagentid"
        ... )
        >>> emitter = CloudEventsEmitter(source="ossa/my-agent", sink=sink)
        >>> emitter.emit("dev.ossa.agent.started", {"agent_id": "123"})
    """

    def __init__(
        self,
        bootstrap_servers: list[str],
        topic: str,
        client_id: str = "ossa-events",
        key_field: Optional[str] = None,
        **config: Any,
    ):
        """
        Initialize Kafka sink.

        Args:
            bootstrap_servers: Kafka bootstrap servers (host:port)
            topic: Kafka topic name
            client_id: Kafka client ID (default: "ossa-events")
            key_field: Event field to use as message key (optional)
            **config: Additional Kafka producer configuration
        """
        self.config = KafkaSinkConfig(
            bootstrap_servers=bootstrap_servers,
            topic=topic,
            client_id=client_id,
            key_field=key_field,
            config=config,
        )
        self._producer: Optional[Any] = None

    def _get_producer(self) -> Any:
        """Get or create Kafka producer."""
        if self._producer is None:
            try:
                from kafka import KafkaProducer
            except ImportError:
                raise ImportError(
                    "kafka-python package required for Kafka sink. "
                    "Install with: pip install kafka-python"
                )

            self._producer = KafkaProducer(
                bootstrap_servers=self.config.bootstrap_servers,
                client_id=self.config.client_id,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                key_serializer=lambda k: k.encode("utf-8") if k else None,
                **self.config.config,
            )

        return self._producer

    def send(self, events: list["CloudEvent[Any]"]) -> None:
        """Send events to Kafka topic."""
        producer = self._get_producer()

        for event in events:
            # Get message key from event field if configured
            key = None
            if self.config.key_field:
                key = str(getattr(event, self.config.key_field, None) or "")

            # Send event as JSON
            producer.send(
                self.config.topic,
                value=event.model_dump(exclude_none=True),
                key=key,
            )

        # Flush to ensure delivery
        producer.flush()

    def close(self) -> None:
        """Close Kafka producer."""
        if self._producer:
            self._producer.close()
            self._producer = None

    def __del__(self) -> None:
        """Cleanup on deletion."""
        self.close()
