"""Tests for ossa.events.cloudevents — CloudEvent, CloudEventsEmitter, OSSA_EVENT_TYPES."""

import json
import uuid

import pytest

from ossa.events.cloudevents import CloudEvent, CloudEventsEmitter, OSSA_EVENT_TYPES


class TestCloudEvent:
    """Tests for CloudEvent dataclass."""

    def test_defaults(self) -> None:
        e = CloudEvent(type="dev.ossa.test", source="ossa/test")
        assert e.specversion == "1.0"
        assert e.datacontenttype == "application/json"
        assert e.id  # auto-generated UUID
        assert e.time  # auto-generated ISO timestamp
        assert e.data is None
        assert e.subject is None

    def test_custom_fields(self) -> None:
        e = CloudEvent(
            type="dev.ossa.agent.started",
            source="ossa/my-agent",
            id="custom-id",
            subject="agent-123",
            data={"status": "running"},
            ossaagentid="agent-123",
            ossainteractionid="int-456",
            ossatraceid="trace-789",
            ossaspanid="span-abc",
        )
        assert e.type == "dev.ossa.agent.started"
        assert e.id == "custom-id"
        assert e.subject == "agent-123"
        assert e.data == {"status": "running"}
        assert e.ossaagentid == "agent-123"

    def test_to_dict_minimal(self) -> None:
        e = CloudEvent(type="dev.ossa.test", source="ossa/test", id="test-1")
        d = e.to_dict()
        assert d["specversion"] == "1.0"
        assert d["type"] == "dev.ossa.test"
        assert d["source"] == "ossa/test"
        assert d["id"] == "test-1"
        assert "subject" not in d
        assert "data" not in d
        assert "ossaagentid" not in d

    def test_to_dict_with_ossa_extensions(self) -> None:
        e = CloudEvent(
            type="dev.ossa.test",
            source="ossa/test",
            id="test-1",
            ossaagentid="a1",
            ossatraceid="t1",
        )
        d = e.to_dict()
        assert d["ossaagentid"] == "a1"
        assert d["ossatraceid"] == "t1"
        assert "ossainteractionid" not in d
        assert "ossaspanid" not in d

    def test_to_dict_with_data(self) -> None:
        e = CloudEvent(
            type="dev.ossa.test",
            source="ossa/test",
            id="x",
            data={"key": "value"},
        )
        d = e.to_dict()
        assert d["data"] == {"key": "value"}

    def test_to_json(self) -> None:
        e = CloudEvent(
            type="dev.ossa.test",
            source="ossa/test",
            id="json-test",
            data={"count": 42},
        )
        j = e.to_json()
        parsed = json.loads(j)
        assert parsed["type"] == "dev.ossa.test"
        assert parsed["data"]["count"] == 42

    def test_unique_ids(self) -> None:
        e1 = CloudEvent(type="t", source="s")
        e2 = CloudEvent(type="t", source="s")
        assert e1.id != e2.id

    def test_unique_times(self) -> None:
        # Times should be ISO strings, both populated
        e = CloudEvent(type="t", source="s")
        assert "T" in e.time  # ISO 8601 has a T separator


class TestCloudEventsEmitter:
    """Tests for CloudEventsEmitter."""

    def test_emit_returns_event(self) -> None:
        emitter = CloudEventsEmitter(source="ossa/test")
        event = emitter.emit("dev.ossa.test", data={"ok": True})

        assert isinstance(event, CloudEvent)
        assert event.type == "dev.ossa.test"
        assert event.source == "ossa/test"
        assert event.data == {"ok": True}

    def test_emit_with_agent_id(self) -> None:
        emitter = CloudEventsEmitter(source="ossa/test", agent_id="agent-1")
        event = emitter.emit("dev.ossa.test")
        assert event.ossaagentid == "agent-1"

    def test_emit_with_subject(self) -> None:
        emitter = CloudEventsEmitter(source="ossa/test")
        event = emitter.emit("dev.ossa.test", subject="my-subject")
        assert event.subject == "my-subject"

    def test_emit_buffers_events(self) -> None:
        emitter = CloudEventsEmitter(source="ossa/test")
        emitter.emit("dev.ossa.test.1")
        emitter.emit("dev.ossa.test.2")
        emitter.emit("dev.ossa.test.3")

        events = emitter.flush()
        assert len(events) == 3
        assert events[0].type == "dev.ossa.test.1"
        assert events[2].type == "dev.ossa.test.3"

    def test_flush_clears_buffer(self) -> None:
        emitter = CloudEventsEmitter(source="ossa/test")
        emitter.emit("dev.ossa.test")
        emitter.flush()

        events = emitter.flush()
        assert len(events) == 0

    def test_flush_empty_buffer(self) -> None:
        emitter = CloudEventsEmitter(source="ossa/test")
        events = emitter.flush()
        assert events == []

    def test_emitter_without_agent_id(self) -> None:
        emitter = CloudEventsEmitter(source="ossa/test")
        event = emitter.emit("dev.ossa.test")
        assert event.ossaagentid is None

    def test_multiple_emitters_independent(self) -> None:
        e1 = CloudEventsEmitter(source="ossa/a", agent_id="a")
        e2 = CloudEventsEmitter(source="ossa/b", agent_id="b")

        e1.emit("test.1")
        e2.emit("test.2")
        e2.emit("test.3")

        assert len(e1.flush()) == 1
        assert len(e2.flush()) == 2


class TestOSSAEventTypes:
    """Tests for OSSA_EVENT_TYPES constant."""

    def test_all_types_present(self) -> None:
        expected_keys = [
            "AGENT_STARTED", "AGENT_COMPLETED", "AGENT_FAILED",
            "TOOL_CALLED", "TOOL_COMPLETED", "TOOL_FAILED",
            "TURN_STARTED", "TURN_COMPLETED",
            "STATE_UPDATED",
            "WORKFLOW_STARTED", "WORKFLOW_COMPLETED",
        ]
        for key in expected_keys:
            assert key in OSSA_EVENT_TYPES, f"Missing event type: {key}"

    def test_event_type_prefix(self) -> None:
        for key, value in OSSA_EVENT_TYPES.items():
            assert value.startswith("dev.ossa."), f"{key} should start with dev.ossa."

    def test_specific_types(self) -> None:
        assert OSSA_EVENT_TYPES["AGENT_STARTED"] == "dev.ossa.agent.started"
        assert OSSA_EVENT_TYPES["TOOL_CALLED"] == "dev.ossa.tool.called"
        assert OSSA_EVENT_TYPES["WORKFLOW_COMPLETED"] == "dev.ossa.workflow.completed"

    def test_emitter_with_ossa_event_types(self) -> None:
        emitter = CloudEventsEmitter(source="ossa/test", agent_id="a1")

        started = emitter.emit(OSSA_EVENT_TYPES["AGENT_STARTED"], {"agent": "a1"})
        completed = emitter.emit(OSSA_EVENT_TYPES["AGENT_COMPLETED"], {"status": "ok"})

        assert started.type == "dev.ossa.agent.started"
        assert completed.type == "dev.ossa.agent.completed"

        events = emitter.flush()
        assert len(events) == 2
