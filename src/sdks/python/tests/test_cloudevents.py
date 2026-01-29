"""
Comprehensive tests for CloudEvents implementation.

Tests cover:
- CloudEvent model validation
- Event emission and batching
- Multiple sinks (stdout, HTTP, Kafka)
- Event formatting
- Auto-flush behavior
- OSSA extensions
"""

import io
import json
import time
from datetime import datetime, timezone
from typing import Any
from unittest.mock import MagicMock, Mock, patch

import pytest

from ossa.events import (
    CloudEvent,
    CloudEventsEmitter,
    HttpSink,
    JsonFormatter,
    KafkaSink,
    OSSA_EVENT_TYPES,
    StdoutSink,
)
from ossa.events.formatters import BinaryFormatter, StructuredFormatter


class TestCloudEvent:
    """Test CloudEvent model."""

    def test_minimal_event(self):
        """Test creating minimal CloudEvent."""
        event = CloudEvent[dict[str, str]](
            type="dev.ossa.test",
            source="ossa/test",
            id="test-123",
        )

        assert event.specversion == "1.0"
        assert event.type == "dev.ossa.test"
        assert event.source == "ossa/test"
        assert event.id == "test-123"
        assert event.datacontenttype == "application/json"

    def test_full_event(self):
        """Test CloudEvent with all attributes."""
        data = {"key": "value", "count": 42}
        event = CloudEvent[dict[str, Any]](
            type="dev.ossa.agent.started",
            source="ossa/my-agent",
            id="event-456",
            time="2024-01-27T12:00:00Z",
            subject="agent-123",
            data=data,
            ossaagentid="my-agent",
            ossainteractionid="interaction-789",
            ossatraceid="trace-abc",
            ossaspanid="span-def",
        )

        assert event.specversion == "1.0"
        assert event.type == "dev.ossa.agent.started"
        assert event.source == "ossa/my-agent"
        assert event.id == "event-456"
        assert event.time == "2024-01-27T12:00:00Z"
        assert event.subject == "agent-123"
        assert event.data == data
        assert event.ossaagentid == "my-agent"
        assert event.ossainteractionid == "interaction-789"
        assert event.ossatraceid == "trace-abc"
        assert event.ossaspanid == "span-def"

    def test_event_serialization(self):
        """Test CloudEvent JSON serialization."""
        event = CloudEvent[dict[str, str]](
            type="dev.ossa.test",
            source="ossa/test",
            id="test-123",
            data={"status": "ok"},
        )

        data = event.model_dump(exclude_none=True)
        assert data["specversion"] == "1.0"
        assert data["type"] == "dev.ossa.test"
        assert data["source"] == "ossa/test"
        assert data["id"] == "test-123"
        assert data["data"] == {"status": "ok"}
        assert "time" not in data  # None values excluded

    def test_event_validation(self):
        """Test CloudEvent validation."""
        # Missing required fields
        with pytest.raises(Exception):  # Pydantic ValidationError
            CloudEvent[dict[str, str]]()

        # Valid event
        event = CloudEvent[dict[str, str]](
            type="dev.ossa.test",
            source="ossa/test",
            id="test-123",
        )
        assert event.specversion == "1.0"


class TestCloudEventsEmitter:
    """Test CloudEventsEmitter."""

    def test_basic_emit(self):
        """Test basic event emission."""
        output = io.StringIO()
        sink = StdoutSink(file=output)
        emitter = CloudEventsEmitter(source="ossa/test", sink=sink)

        event = emitter.emit("dev.ossa.test", {"status": "ok"})

        assert event.type == "dev.ossa.test"
        assert event.source == "ossa/test"
        assert event.data == {"status": "ok"}
        assert event.id  # Generated
        assert event.time  # Generated

        # Check output
        output.seek(0)
        emitted = json.loads(output.read())
        assert emitted["type"] == "dev.ossa.test"
        assert emitted["data"] == {"status": "ok"}

    def test_emit_with_options(self):
        """Test emission with custom options."""
        output = io.StringIO()
        sink = StdoutSink(file=output)
        emitter = CloudEventsEmitter(source="ossa/test", sink=sink)

        event = emitter.emit(
            "dev.ossa.agent.started",
            {"agent_id": "123"},
            subject="agent-123",
            ossaagentid="my-agent",
            ossatraceid="trace-abc",
        )

        assert event.subject == "agent-123"
        assert event.ossaagentid == "my-agent"
        assert event.ossatraceid == "trace-abc"

    def test_batching(self):
        """Test event batching."""
        output = io.StringIO()
        sink = StdoutSink(file=output)
        emitter = CloudEventsEmitter(
            source="ossa/test",
            sink=sink,
            batch_size=3,
        )

        # Emit 2 events - should buffer
        emitter.emit("dev.ossa.test.1", {"count": 1})
        emitter.emit("dev.ossa.test.2", {"count": 2})

        output.seek(0)
        content = output.read()
        assert content == ""  # Nothing flushed yet

        # Emit 3rd event - should flush
        emitter.emit("dev.ossa.test.3", {"count": 3})

        output.seek(0)
        lines = output.read().strip().split("\n")
        assert len(lines) == 3
        events = [json.loads(line) for line in lines]
        assert events[0]["data"]["count"] == 1
        assert events[1]["data"]["count"] == 2
        assert events[2]["data"]["count"] == 3

    def test_manual_flush(self):
        """Test manual flush."""
        output = io.StringIO()
        sink = StdoutSink(file=output)
        emitter = CloudEventsEmitter(
            source="ossa/test",
            sink=sink,
            batch_size=10,  # Large batch
        )

        # Emit events
        emitter.emit("dev.ossa.test.1", {"count": 1})
        emitter.emit("dev.ossa.test.2", {"count": 2})

        # Manual flush
        emitter.flush()

        output.seek(0)
        lines = output.read().strip().split("\n")
        assert len(lines) == 2

    def test_context_manager(self):
        """Test context manager usage."""
        output = io.StringIO()
        sink = StdoutSink(file=output)

        with CloudEventsEmitter(source="ossa/test", sink=sink, batch_size=10) as emitter:
            emitter.emit("dev.ossa.test.1", {"count": 1})
            emitter.emit("dev.ossa.test.2", {"count": 2})

        # Should auto-flush on exit
        output.seek(0)
        lines = output.read().strip().split("\n")
        assert len(lines) == 2

    def test_auto_flush_interval(self):
        """Test auto-flush based on time interval."""
        output = io.StringIO()
        sink = StdoutSink(file=output)
        emitter = CloudEventsEmitter(
            source="ossa/test",
            sink=sink,
            batch_size=100,  # Large batch
            flush_interval_ms=100,  # 100ms auto-flush
        )

        # Emit event
        emitter.emit("dev.ossa.test.1", {"count": 1})

        # Should not flush immediately
        output.seek(0)
        assert output.read() == ""

        # Wait for auto-flush interval
        time.sleep(0.15)  # 150ms

        # Emit another event - should trigger flush
        emitter.emit("dev.ossa.test.2", {"count": 2})

        output.seek(0)
        content = output.read()
        assert content != ""

    def test_destroy(self):
        """Test destroy flushes remaining events."""
        output = io.StringIO()
        sink = StdoutSink(file=output)
        emitter = CloudEventsEmitter(
            source="ossa/test",
            sink=sink,
            batch_size=10,
        )

        emitter.emit("dev.ossa.test", {"status": "ok"})
        emitter.destroy()

        output.seek(0)
        lines = output.read().strip().split("\n")
        assert len(lines) == 1


class TestStdoutSink:
    """Test StdoutSink."""

    def test_compact_output(self):
        """Test compact JSON output."""
        output = io.StringIO()
        sink = StdoutSink(pretty=False, file=output)

        event = CloudEvent[dict[str, str]](
            type="dev.ossa.test",
            source="ossa/test",
            id="test-123",
            data={"status": "ok"},
        )

        sink.send([event])

        output.seek(0)
        content = output.read().strip()
        assert "\n" not in content  # Single line
        parsed = json.loads(content)
        assert parsed["type"] == "dev.ossa.test"

    def test_pretty_output(self):
        """Test pretty-printed JSON output."""
        output = io.StringIO()
        sink = StdoutSink(pretty=True, file=output)

        event = CloudEvent[dict[str, str]](
            type="dev.ossa.test",
            source="ossa/test",
            id="test-123",
            data={"status": "ok"},
        )

        sink.send([event])

        output.seek(0)
        content = output.read()
        assert content.count("\n") > 1  # Multi-line
        parsed = json.loads(content)
        assert parsed["type"] == "dev.ossa.test"


class TestHttpSink:
    """Test HttpSink."""

    @patch("requests.post")
    def test_structured_mode(self, mock_post):
        """Test HTTP sink in structured mode."""
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        sink = HttpSink(
            url="https://events.example.com/webhook",
            headers={"Authorization": "Bearer token123"},
            mode="structured",
        )

        event = CloudEvent[dict[str, str]](
            type="dev.ossa.test",
            source="ossa/test",
            id="test-123",
            data={"status": "ok"},
        )

        sink.send([event])

        # Check request
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert call_args[1]["headers"]["Content-Type"] == "application/cloudevents+json"
        assert call_args[1]["headers"]["Authorization"] == "Bearer token123"
        assert call_args[1]["json"]["type"] == "dev.ossa.test"

    @patch("requests.post")
    def test_binary_mode(self, mock_post):
        """Test HTTP sink in binary mode."""
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        sink = HttpSink(
            url="https://events.example.com/webhook",
            mode="binary",
        )

        event = CloudEvent[dict[str, str]](
            type="dev.ossa.test",
            source="ossa/test",
            id="test-123",
            time="2024-01-27T12:00:00Z",
            data={"status": "ok"},
        )

        sink.send([event])

        # Check headers
        call_args = mock_post.call_args
        headers = call_args[1]["headers"]
        assert headers["ce-specversion"] == "1.0"
        assert headers["ce-type"] == "dev.ossa.test"
        assert headers["ce-source"] == "ossa/test"
        assert headers["ce-id"] == "test-123"
        assert headers["ce-time"] == "2024-01-27T12:00:00Z"

    @patch("requests.post")
    def test_binary_mode_with_extensions(self, mock_post):
        """Test binary mode includes OSSA extensions."""
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        sink = HttpSink(url="https://events.example.com/webhook", mode="binary")

        event = CloudEvent[dict[str, str]](
            type="dev.ossa.test",
            source="ossa/test",
            id="test-123",
            data={"status": "ok"},
            ossaagentid="my-agent",
            ossatraceid="trace-abc",
        )

        sink.send([event])

        headers = mock_post.call_args[1]["headers"]
        assert headers["ce-ossaagentid"] == "my-agent"
        assert headers["ce-ossatraceid"] == "trace-abc"


class TestKafkaSink:
    """Test KafkaSink."""

    @patch("ossa.events.sinks.KafkaProducer")
    def test_kafka_send(self, mock_producer_class):
        """Test Kafka sink."""
        mock_producer = MagicMock()
        mock_producer_class.return_value = mock_producer

        sink = KafkaSink(
            bootstrap_servers=["localhost:9092"],
            topic="ossa-events",
        )

        event = CloudEvent[dict[str, str]](
            type="dev.ossa.test",
            source="ossa/test",
            id="test-123",
            data={"status": "ok"},
        )

        sink.send([event])

        # Check producer called
        mock_producer.send.assert_called_once()
        call_args = mock_producer.send.call_args
        assert call_args[0][0] == "ossa-events"
        assert call_args[1]["value"]["type"] == "dev.ossa.test"

    @patch("ossa.events.sinks.KafkaProducer")
    def test_kafka_with_key(self, mock_producer_class):
        """Test Kafka sink with message key."""
        mock_producer = MagicMock()
        mock_producer_class.return_value = mock_producer

        sink = KafkaSink(
            bootstrap_servers=["localhost:9092"],
            topic="ossa-events",
            key_field="ossaagentid",
        )

        event = CloudEvent[dict[str, str]](
            type="dev.ossa.test",
            source="ossa/test",
            id="test-123",
            data={"status": "ok"},
            ossaagentid="my-agent",
        )

        sink.send([event])

        call_args = mock_producer.send.call_args
        assert call_args[1]["key"] == "my-agent"


class TestFormatters:
    """Test event formatters."""

    def test_json_formatter_compact(self):
        """Test JSON formatter in compact mode."""
        formatter = JsonFormatter(pretty=False)

        event = CloudEvent[dict[str, str]](
            type="dev.ossa.test",
            source="ossa/test",
            id="test-123",
            data={"status": "ok"},
        )

        result = formatter.format(event)
        assert "\n" not in result
        parsed = json.loads(result)
        assert parsed["type"] == "dev.ossa.test"

    def test_json_formatter_pretty(self):
        """Test JSON formatter in pretty mode."""
        formatter = JsonFormatter(pretty=True, indent=2)

        event = CloudEvent[dict[str, str]](
            type="dev.ossa.test",
            source="ossa/test",
            id="test-123",
            data={"status": "ok"},
        )

        result = formatter.format(event)
        assert result.count("\n") > 1
        parsed = json.loads(result)
        assert parsed["type"] == "dev.ossa.test"

    def test_json_formatter_batch(self):
        """Test JSON formatter batch mode."""
        formatter = JsonFormatter(pretty=False)

        events = [
            CloudEvent[dict[str, int]](
                type="dev.ossa.test",
                source="ossa/test",
                id=f"test-{i}",
                data={"count": i},
            )
            for i in range(3)
        ]

        result = formatter.format_batch(events)
        parsed = json.loads(result)
        assert len(parsed) == 3
        assert parsed[0]["data"]["count"] == 0
        assert parsed[2]["data"]["count"] == 2

    def test_json_lines_formatter(self):
        """Test JSON Lines formatter."""
        formatter = JsonFormatter()

        events = [
            CloudEvent[dict[str, int]](
                type="dev.ossa.test",
                source="ossa/test",
                id=f"test-{i}",
                data={"count": i},
            )
            for i in range(3)
        ]

        result = formatter.format_jsonlines(events)
        lines = result.strip().split("\n")
        assert len(lines) == 3
        for i, line in enumerate(lines):
            parsed = json.loads(line)
            assert parsed["data"]["count"] == i

    def test_binary_formatter(self):
        """Test binary formatter for HTTP headers."""
        formatter = BinaryFormatter()

        event = CloudEvent[dict[str, str]](
            type="dev.ossa.test",
            source="ossa/test",
            id="test-123",
            time="2024-01-27T12:00:00Z",
            subject="subject-456",
            data={"status": "ok"},
            ossaagentid="my-agent",
        )

        headers, body = formatter.format_http(event)

        # Check headers
        assert headers["ce-specversion"] == "1.0"
        assert headers["ce-type"] == "dev.ossa.test"
        assert headers["ce-source"] == "ossa/test"
        assert headers["ce-id"] == "test-123"
        assert headers["ce-time"] == "2024-01-27T12:00:00Z"
        assert headers["ce-subject"] == "subject-456"
        assert headers["ce-ossaagentid"] == "my-agent"
        assert headers["Content-Type"] == "application/json"

        # Check body
        assert json.loads(body) == {"status": "ok"}


class TestOSSAEventTypes:
    """Test OSSA event type constants."""

    def test_event_types_defined(self):
        """Test all OSSA event types are defined."""
        assert OSSA_EVENT_TYPES.AGENT_STARTED == "dev.ossa.agent.started"
        assert OSSA_EVENT_TYPES.AGENT_COMPLETED == "dev.ossa.agent.completed"
        assert OSSA_EVENT_TYPES.AGENT_FAILED == "dev.ossa.agent.failed"
        assert OSSA_EVENT_TYPES.TOOL_CALLED == "dev.ossa.tool.called"
        assert OSSA_EVENT_TYPES.TOOL_COMPLETED == "dev.ossa.tool.completed"
        assert OSSA_EVENT_TYPES.TOOL_FAILED == "dev.ossa.tool.failed"
        assert OSSA_EVENT_TYPES.TURN_STARTED == "dev.ossa.turn.started"
        assert OSSA_EVENT_TYPES.TURN_COMPLETED == "dev.ossa.turn.completed"
        assert OSSA_EVENT_TYPES.STATE_UPDATED == "dev.ossa.state.updated"
        assert OSSA_EVENT_TYPES.WORKFLOW_STARTED == "dev.ossa.workflow.started"
        assert OSSA_EVENT_TYPES.WORKFLOW_COMPLETED == "dev.ossa.workflow.completed"

    def test_use_event_types_with_emitter(self):
        """Test using OSSA event types with emitter."""
        output = io.StringIO()
        sink = StdoutSink(file=output)
        emitter = CloudEventsEmitter(source="ossa/test", sink=sink)

        event = emitter.emit(
            OSSA_EVENT_TYPES.AGENT_STARTED,
            {"agent_id": "test-agent"},
        )

        assert event.type == "dev.ossa.agent.started"


class TestIntegration:
    """Integration tests."""

    def test_end_to_end_workflow(self):
        """Test complete workflow from emission to sink."""
        output = io.StringIO()
        sink = StdoutSink(pretty=False, file=output)

        with CloudEventsEmitter(
            source="ossa/integration-test",
            sink=sink,
            batch_size=3,
        ) as emitter:
            # Emit agent lifecycle events
            emitter.emit(
                OSSA_EVENT_TYPES.AGENT_STARTED,
                {"agent_id": "test-agent", "version": "1.0"},
                ossaagentid="test-agent",
            )

            emitter.emit(
                OSSA_EVENT_TYPES.TOOL_CALLED,
                {"tool": "search", "query": "test"},
                ossaagentid="test-agent",
            )

            emitter.emit(
                OSSA_EVENT_TYPES.AGENT_COMPLETED,
                {"agent_id": "test-agent", "status": "success"},
                ossaagentid="test-agent",
            )

        # Verify output
        output.seek(0)
        lines = output.read().strip().split("\n")
        assert len(lines) == 3

        events = [json.loads(line) for line in lines]
        assert events[0]["type"] == "dev.ossa.agent.started"
        assert events[1]["type"] == "dev.ossa.tool.called"
        assert events[2]["type"] == "dev.ossa.agent.completed"

        # Verify OSSA extensions
        for event in events:
            assert event["ossaagentid"] == "test-agent"

    def test_error_handling(self):
        """Test error handling in sinks."""
        with patch("requests.post") as mock_post:
            mock_post.side_effect = Exception("Network error")

            sink = HttpSink(url="https://events.example.com/webhook")
            event = CloudEvent[dict[str, str]](
                type="dev.ossa.test",
                source="ossa/test",
                id="test-123",
            )

            with pytest.raises(Exception, match="Network error"):
                sink.send([event])
