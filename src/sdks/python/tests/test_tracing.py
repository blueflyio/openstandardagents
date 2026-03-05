"""Tests for ossa.tracing.w3c_baggage — W3CBaggage, OSSABaggage, context propagation."""

import pytest

from ossa.tracing.w3c_baggage import (
    HEADER_NAME,
    MAX_BYTES,
    MAX_PAIRS,
    OSSA_PREFIX,
    OSSABaggage,
    W3CBaggage,
    create_ossa_baggage,
    generate_span_id,
    generate_trace_id,
    propagate_context,
)


class TestW3CBaggage:
    """Tests for W3CBaggage core operations."""

    def test_set_and_get(self) -> None:
        b = W3CBaggage()
        b.set("key", "value")
        assert b.get("key") == "value"

    def test_get_missing_returns_none(self) -> None:
        b = W3CBaggage()
        assert b.get("missing") is None

    def test_has(self) -> None:
        b = W3CBaggage()
        b.set("present", "yes")
        assert b.has("present") is True
        assert b.has("absent") is False

    def test_delete_existing(self) -> None:
        b = W3CBaggage()
        b.set("key", "value")
        assert b.delete("key") is True
        assert b.get("key") is None

    def test_delete_missing(self) -> None:
        b = W3CBaggage()
        assert b.delete("nope") is False

    def test_to_header_empty(self) -> None:
        b = W3CBaggage()
        assert b.to_header() == ""

    def test_to_header_single(self) -> None:
        b = W3CBaggage()
        b.set("key", "value")
        assert b.to_header() == "key=value"

    def test_to_header_multiple(self) -> None:
        b = W3CBaggage()
        b.set("a", "1")
        b.set("b", "2")
        header = b.to_header()
        assert "a=1" in header
        assert "b=2" in header
        assert ", " in header

    def test_to_headers_dict(self) -> None:
        b = W3CBaggage()
        b.set("key", "value")
        headers = b.to_headers()
        assert HEADER_NAME in headers
        assert headers[HEADER_NAME] == "key=value"


class TestW3CBaggageParse:
    """Tests for W3CBaggage.parse()."""

    def test_parse_simple(self) -> None:
        b = W3CBaggage.parse("key1=value1, key2=value2")
        assert b.get("key1") == "value1"
        assert b.get("key2") == "value2"

    def test_parse_empty_string(self) -> None:
        b = W3CBaggage.parse("")
        assert b.to_header() == ""

    def test_parse_url_encoded(self) -> None:
        b = W3CBaggage.parse("key%20name=value%20data")
        assert b.get("key name") == "value data"

    def test_parse_no_equals_skips_entry(self) -> None:
        b = W3CBaggage.parse("valid=yes, invalid_no_equals, also_valid=true")
        assert b.get("valid") == "yes"
        assert b.get("also_valid") == "true"
        assert b.get("invalid_no_equals") is None

    def test_parse_extra_whitespace(self) -> None:
        b = W3CBaggage.parse("  key1 = value1 ,  key2 = value2  ")
        assert b.get("key1") == "value1"
        assert b.get("key2") == "value2"

    def test_roundtrip(self) -> None:
        b = W3CBaggage()
        b.set("agent", "test-agent")
        b.set("trace", "abc123")

        header = b.to_header()
        restored = W3CBaggage.parse(header)

        assert restored.get("agent") == "test-agent"
        assert restored.get("trace") == "abc123"


class TestW3CBaggageMerge:
    """Tests for W3CBaggage.merge()."""

    def test_merge_disjoint(self) -> None:
        a = W3CBaggage()
        a.set("key1", "val1")
        b = W3CBaggage()
        b.set("key2", "val2")

        merged = a.merge(b)
        assert merged.get("key1") == "val1"
        assert merged.get("key2") == "val2"

    def test_merge_other_wins(self) -> None:
        a = W3CBaggage()
        a.set("shared", "from_a")
        b = W3CBaggage()
        b.set("shared", "from_b")

        merged = a.merge(b)
        assert merged.get("shared") == "from_b"

    def test_merge_preserves_originals(self) -> None:
        a = W3CBaggage()
        a.set("key", "original")
        b = W3CBaggage()
        b.set("key", "override")

        a.merge(b)
        # originals should be untouched
        assert a.get("key") == "original"


class TestOSSABaggage:
    """Tests for OSSABaggage context."""

    def test_set_and_get_context(self) -> None:
        b = W3CBaggage()
        ctx = OSSABaggage(
            agent_id="agent-1",
            interaction_id="int-1",
            trace_id="trace-1",
            span_id="span-1",
        )
        b.set_ossa_context(ctx)

        assert b.get(f"{OSSA_PREFIX}agent_id") == "agent-1"
        assert b.get(f"{OSSA_PREFIX}interaction_id") == "int-1"
        assert b.get(f"{OSSA_PREFIX}trace_id") == "trace-1"
        assert b.get(f"{OSSA_PREFIX}span_id") == "span-1"

    def test_get_ossa_context(self) -> None:
        b = W3CBaggage()
        b.set("ossa.agent_id", "a1")
        b.set("ossa.workflow_id", "wf-1")
        b.set("ossa.tenant_id", "t-1")

        ctx = b.get_ossa_context()
        assert ctx.agent_id == "a1"
        assert ctx.workflow_id == "wf-1"
        assert ctx.tenant_id == "t-1"
        assert ctx.trace_id is None

    def test_custom_fields_roundtrip(self) -> None:
        b = W3CBaggage()
        ctx = OSSABaggage(
            agent_id="a1",
            custom={"env": "prod", "region": "us-west"},
        )
        b.set_ossa_context(ctx)

        restored = b.get_ossa_context()
        assert restored.custom["env"] == "prod"
        assert restored.custom["region"] == "us-west"

    def test_none_fields_not_set(self) -> None:
        b = W3CBaggage()
        ctx = OSSABaggage(agent_id="a1")
        b.set_ossa_context(ctx)

        assert b.get("ossa.agent_id") == "a1"
        assert b.has("ossa.trace_id") is False
        assert b.has("ossa.workflow_id") is False

    def test_ossa_context_header_roundtrip(self) -> None:
        original = OSSABaggage(
            agent_id="agent-1",
            interaction_id="int-1",
            trace_id="abc123",
            span_id="def456",
            workflow_id="wf-1",
            tenant_id="t-1",
            custom={"env": "test"},
        )

        b = W3CBaggage()
        b.set_ossa_context(original)
        header = b.to_header()

        restored_baggage = W3CBaggage.parse(header)
        restored = restored_baggage.get_ossa_context()

        assert restored.agent_id == original.agent_id
        assert restored.interaction_id == original.interaction_id
        assert restored.trace_id == original.trace_id
        assert restored.workflow_id == original.workflow_id
        assert restored.custom["env"] == "test"


class TestGenerateIds:
    """Tests for ID generation functions."""

    def test_generate_trace_id(self) -> None:
        tid = generate_trace_id()
        assert len(tid) == 32
        assert all(c in "0123456789abcdef" for c in tid)

    def test_generate_span_id(self) -> None:
        sid = generate_span_id()
        assert len(sid) == 16
        assert all(c in "0123456789abcdef" for c in sid)

    def test_trace_ids_unique(self) -> None:
        ids = {generate_trace_id() for _ in range(100)}
        assert len(ids) == 100

    def test_span_ids_unique(self) -> None:
        ids = {generate_span_id() for _ in range(100)}
        assert len(ids) == 100


class TestCreateOSSABaggage:
    """Tests for create_ossa_baggage() convenience function."""

    def test_basic_creation(self) -> None:
        b = create_ossa_baggage("agent-1")
        ctx = b.get_ossa_context()

        assert ctx.agent_id == "agent-1"
        assert ctx.interaction_id is not None
        assert ctx.trace_id is not None
        assert ctx.span_id is not None

    def test_with_interaction_id(self) -> None:
        b = create_ossa_baggage("agent-1", interaction_id="custom-int")
        ctx = b.get_ossa_context()
        assert ctx.interaction_id == "custom-int"

    def test_auto_generates_trace_and_span(self) -> None:
        b = create_ossa_baggage("agent-1")
        ctx = b.get_ossa_context()
        assert len(ctx.trace_id) == 32
        assert len(ctx.span_id) == 16


class TestPropagateContext:
    """Tests for propagate_context() function."""

    def test_propagate_to_child(self) -> None:
        parent = create_ossa_baggage("parent-agent")
        parent_ctx = parent.get_ossa_context()

        child = propagate_context(parent, "child-agent")
        child_ctx = child.get_ossa_context()

        assert child_ctx.agent_id == "child-agent"
        assert child_ctx.parent_agent_id == "parent-agent"
        assert child_ctx.trace_id == parent_ctx.trace_id
        assert child_ctx.interaction_id == parent_ctx.interaction_id
        assert child_ctx.span_id != parent_ctx.span_id

    def test_propagate_preserves_workflow_id(self) -> None:
        parent = W3CBaggage()
        parent.set_ossa_context(OSSABaggage(
            agent_id="parent",
            trace_id="t1",
            interaction_id="i1",
            span_id="s1",
            workflow_id="wf-1",
        ))

        child = propagate_context(parent, "child")
        child_ctx = child.get_ossa_context()
        assert child_ctx.workflow_id == "wf-1"

    def test_propagate_preserves_tenant_id(self) -> None:
        parent = W3CBaggage()
        parent.set_ossa_context(OSSABaggage(
            agent_id="parent",
            trace_id="t1",
            interaction_id="i1",
            span_id="s1",
            tenant_id="tenant-1",
        ))

        child = propagate_context(parent, "child")
        child_ctx = child.get_ossa_context()
        assert child_ctx.tenant_id == "tenant-1"

    def test_multi_hop_propagation(self) -> None:
        root = create_ossa_baggage("root")
        root_ctx = root.get_ossa_context()

        child1 = propagate_context(root, "child-1")
        child2 = propagate_context(child1, "child-2")
        child2_ctx = child2.get_ossa_context()

        assert child2_ctx.agent_id == "child-2"
        assert child2_ctx.parent_agent_id == "child-1"
        assert child2_ctx.trace_id == root_ctx.trace_id
