#!/usr/bin/env python3
"""
Verification script for W3C Baggage implementation.

Runs basic smoke tests to verify the W3C Baggage functionality.
"""

import sys
from ossa.tracing import (
    W3CBaggage,
    OSSABaggage,
    TraceContext,
    create_ossa_baggage,
    propagate_ossa_context,
    generate_trace_id,
    generate_span_id,
    generate_correlation_id,
)


def test_basic_baggage():
    """Test basic baggage operations."""
    print("Testing basic baggage operations...")

    baggage = W3CBaggage()
    baggage.set("key1", "value1")
    baggage.set("key2", "value2", {"ttl": "3600"})

    assert baggage.get("key1") == "value1"
    assert baggage.get("key2") == "value2"
    assert baggage.has("key1") is True
    assert baggage.has("missing") is False

    header = baggage.to_string()
    assert "key1=value1" in header
    assert "key2=value2" in header

    print("✓ Basic baggage operations work")


def test_parsing():
    """Test parsing baggage headers."""
    print("Testing baggage parsing...")

    header = "key1=value1,key2=value2;ttl=3600"
    baggage = W3CBaggage.parse(header)

    assert baggage.get("key1") == "value1"
    assert baggage.get("key2") == "value2"

    print("✓ Baggage parsing works")


def test_ossa_context():
    """Test OSSA context operations."""
    print("Testing OSSA context...")

    context = OSSABaggage(
        agent_id="agent-001",
        interaction_id="int-123",
        trace_id=generate_trace_id(),
        span_id=generate_span_id(),
        custom={"env": "production"}
    )

    baggage = W3CBaggage(context)

    assert baggage.get("ossa.agent_id") == "agent-001"
    assert baggage.get("ossa.interaction_id") == "int-123"
    assert baggage.get("ossa.custom.env") == "production"

    extracted = baggage.get_ossa_context()
    assert extracted.agent_id == "agent-001"
    assert extracted.custom["env"] == "production"

    print("✓ OSSA context works")


def test_trace_context():
    """Test trace context creation and propagation."""
    print("Testing trace context...")

    context = TraceContext.create(
        agent_id="agent-001",
        interaction_id="int-123"
    )

    assert context.correlation.agent_id == "agent-001"
    assert "baggage" in context.headers

    # Create child context
    child = context.create_child_context(child_agent_id="agent-002")

    assert child.correlation.trace_id == context.correlation.trace_id
    assert child.correlation.span_id != context.correlation.span_id

    child_ossa = child.baggage.get_ossa_context()
    assert child_ossa.agent_id == "agent-002"
    assert child_ossa.parent_agent_id == "agent-001"

    print("✓ Trace context works")


def test_propagation():
    """Test context propagation."""
    print("Testing context propagation...")

    parent_baggage = create_ossa_baggage(
        agent_id="parent",
        interaction_id="int-123"
    )

    child_baggage = propagate_ossa_context(parent_baggage, "child")

    parent_ctx = parent_baggage.get_ossa_context()
    child_ctx = child_baggage.get_ossa_context()

    assert child_ctx.agent_id == "child"
    assert child_ctx.parent_agent_id == "parent"
    assert child_ctx.trace_id == parent_ctx.trace_id
    assert child_ctx.interaction_id == parent_ctx.interaction_id

    print("✓ Context propagation works")


def test_roundtrip():
    """Test header roundtrip."""
    print("Testing header roundtrip...")

    original = TraceContext.create(
        agent_id="agent-001",
        interaction_id="int-123",
        tenant_id="tenant-789"
    )

    headers = original.headers
    restored = TraceContext.from_headers(headers)

    original_ossa = original.baggage.get_ossa_context()
    restored_ossa = restored.baggage.get_ossa_context()

    assert restored_ossa.agent_id == original_ossa.agent_id
    assert restored_ossa.interaction_id == original_ossa.interaction_id
    assert restored_ossa.trace_id == original_ossa.trace_id
    assert restored_ossa.tenant_id == original_ossa.tenant_id

    print("✓ Header roundtrip works")


def test_id_generation():
    """Test ID generation."""
    print("Testing ID generation...")

    corr_id = generate_correlation_id()
    assert len(corr_id) == 36

    trace_id = generate_trace_id()
    assert len(trace_id) == 32
    assert all(c in "0123456789abcdef" for c in trace_id)

    span_id = generate_span_id()
    assert len(span_id) == 16
    assert all(c in "0123456789abcdef" for c in span_id)

    print("✓ ID generation works")


def main():
    """Run all verification tests."""
    print("=" * 60)
    print("W3C Baggage Implementation Verification")
    print("=" * 60)
    print()

    tests = [
        test_basic_baggage,
        test_parsing,
        test_ossa_context,
        test_trace_context,
        test_propagation,
        test_roundtrip,
        test_id_generation,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"✗ {test.__name__} failed: {e}")
            failed += 1
            import traceback
            traceback.print_exc()

    print()
    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60)

    if failed > 0:
        sys.exit(1)
    else:
        print("\n✓ All verification tests passed!")
        sys.exit(0)


if __name__ == "__main__":
    main()
