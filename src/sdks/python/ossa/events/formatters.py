"""
Event formatters for CloudEvents serialization.

Provides structured formatting for various output formats:
- JSON (structured and compact)
- JSON Lines (newline-delimited)
- Future: Avro, Protobuf
"""

import json
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any, Dict, List

if TYPE_CHECKING:
    from .cloudevents import CloudEvent


class CloudEventsFormatter(ABC):
    """Abstract base class for CloudEvents formatters."""

    @abstractmethod
    def format(self, event: "CloudEvent[Any]") -> str:
        """
        Format a single CloudEvent.

        Args:
            event: CloudEvent to format

        Returns:
            Formatted event as string
        """
        pass

    @abstractmethod
    def format_batch(self, events: List["CloudEvent[Any]"]) -> str:
        """
        Format a batch of CloudEvents.

        Args:
            events: List of CloudEvents to format

        Returns:
            Formatted events as string
        """
        pass


class JsonFormatter(CloudEventsFormatter):
    """
    JSON formatter for CloudEvents.

    Supports:
    - Pretty printing (indented JSON)
    - Compact JSON (single line)
    - JSON Lines format (newline-delimited)
    - Exclusion of null values

    Example:
        >>> from ossa.events import CloudEvent, JsonFormatter
        >>> formatter = JsonFormatter(pretty=True)
        >>> event = CloudEvent(
        ...     type="dev.ossa.agent.started",
        ...     source="ossa/my-agent",
        ...     id="123",
        ...     data={"status": "running"}
        ... )
        >>> print(formatter.format(event))
        {
          "specversion": "1.0",
          "type": "dev.ossa.agent.started",
          ...
        }
    """

    def __init__(
        self,
        pretty: bool = False,
        exclude_none: bool = True,
        indent: int = 2,
    ):
        """
        Initialize JSON formatter.

        Args:
            pretty: Pretty-print JSON with indentation (default: False)
            exclude_none: Exclude fields with None values (default: True)
            indent: Indentation spaces for pretty printing (default: 2)
        """
        self.pretty = pretty
        self.exclude_none = exclude_none
        self.indent = indent

    def format(self, event: "CloudEvent[Any]") -> str:
        """Format a single CloudEvent as JSON."""
        data = event.model_dump(exclude_none=self.exclude_none)
        if self.pretty:
            return json.dumps(data, indent=self.indent, ensure_ascii=False)
        return json.dumps(data, ensure_ascii=False)

    def format_batch(self, events: List["CloudEvent[Any]"]) -> str:
        """
        Format a batch of CloudEvents as JSON array.

        Args:
            events: List of CloudEvents

        Returns:
            JSON array of events
        """
        data = [event.model_dump(exclude_none=self.exclude_none) for event in events]
        if self.pretty:
            return json.dumps(data, indent=self.indent, ensure_ascii=False)
        return json.dumps(data, ensure_ascii=False)

    def format_jsonlines(self, events: List["CloudEvent[Any]"]) -> str:
        """
        Format events as JSON Lines (newline-delimited JSON).

        Each event is formatted as compact JSON on a single line,
        separated by newlines.

        Args:
            events: List of CloudEvents

        Returns:
            JSON Lines formatted string

        Example:
            >>> formatter = JsonFormatter()
            >>> events = [event1, event2, event3]
            >>> print(formatter.format_jsonlines(events))
            {"specversion":"1.0","type":"..."}
            {"specversion":"1.0","type":"..."}
            {"specversion":"1.0","type":"..."}
        """
        lines = []
        for event in events:
            data = event.model_dump(exclude_none=self.exclude_none)
            lines.append(json.dumps(data, ensure_ascii=False))
        return "\n".join(lines)


class StructuredFormatter(CloudEventsFormatter):
    """
    Structured CloudEvents formatter (application/cloudevents+json).

    This is the canonical CloudEvents JSON format with all required
    and optional attributes as top-level fields.

    Specification:
    https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/formats/json-format.md

    Example:
        >>> from ossa.events import CloudEvent, StructuredFormatter
        >>> formatter = StructuredFormatter()
        >>> event = CloudEvent(
        ...     type="dev.ossa.agent.started",
        ...     source="ossa/my-agent",
        ...     id="123",
        ...     data={"status": "running"}
        ... )
        >>> print(formatter.format(event))
        {
          "specversion": "1.0",
          "type": "dev.ossa.agent.started",
          "source": "ossa/my-agent",
          "id": "123",
          "data": {"status": "running"}
        }
    """

    def __init__(self, pretty: bool = True, indent: int = 2):
        """
        Initialize structured formatter.

        Args:
            pretty: Pretty-print JSON (default: True)
            indent: Indentation spaces (default: 2)
        """
        self.pretty = pretty
        self.indent = indent

    def format(self, event: "CloudEvent[Any]") -> str:
        """Format event as structured CloudEvents JSON."""
        data = event.model_dump(exclude_none=True)
        if self.pretty:
            return json.dumps(data, indent=self.indent, ensure_ascii=False)
        return json.dumps(data, ensure_ascii=False)

    def format_batch(self, events: List["CloudEvent[Any]"]) -> str:
        """Format events as JSON array of structured CloudEvents."""
        data = [event.model_dump(exclude_none=True) for event in events]
        if self.pretty:
            return json.dumps(data, indent=self.indent, ensure_ascii=False)
        return json.dumps(data, ensure_ascii=False)


class BinaryFormatter:
    """
    Binary CloudEvents formatter (HTTP headers + data).

    In binary mode, CloudEvents attributes are mapped to HTTP headers
    with 'ce-' prefix, and the event data becomes the HTTP body.

    Specification:
    https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/bindings/http-protocol-binding.md

    Example:
        >>> from ossa.events import CloudEvent, BinaryFormatter
        >>> formatter = BinaryFormatter()
        >>> event = CloudEvent(
        ...     type="dev.ossa.agent.started",
        ...     source="ossa/my-agent",
        ...     id="123",
        ...     data={"status": "running"}
        ... )
        >>> headers, body = formatter.format_http(event)
        >>> print(headers)
        {
            'ce-specversion': '1.0',
            'ce-type': 'dev.ossa.agent.started',
            'ce-source': 'ossa/my-agent',
            'ce-id': '123',
            'Content-Type': 'application/json'
        }
    """

    def format_http(self, event: "CloudEvent[Any]") -> tuple[Dict[str, str], str]:
        """
        Format event for HTTP binary mode.

        Args:
            event: CloudEvent to format

        Returns:
            Tuple of (headers, body) where headers contain CloudEvents
            attributes with 'ce-' prefix and body contains the data.
        """
        headers = {
            "ce-specversion": event.specversion,
            "ce-type": event.type,
            "ce-source": event.source,
            "ce-id": event.id,
        }

        # Optional attributes
        if event.time:
            headers["ce-time"] = event.time
        if event.subject:
            headers["ce-subject"] = event.subject
        if event.datacontenttype:
            headers["Content-Type"] = event.datacontenttype

        # OSSA extensions
        if event.ossaagentid:
            headers["ce-ossaagentid"] = event.ossaagentid
        if event.ossainteractionid:
            headers["ce-ossainteractionid"] = event.ossainteractionid
        if event.ossatraceid:
            headers["ce-ossatraceid"] = event.ossatraceid
        if event.ossaspanid:
            headers["ce-ossaspanid"] = event.ossaspanid

        # Serialize data as body
        body = json.dumps(event.data) if event.data else ""

        return headers, body
