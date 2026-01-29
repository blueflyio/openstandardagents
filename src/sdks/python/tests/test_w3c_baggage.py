"""
Tests for W3C Baggage Implementation

Comprehensive test suite for W3C Baggage parser, builder, correlation,
and context propagation functionality.

Test Coverage:
- W3C Baggage parsing and building
- URL encoding/decoding
- Metadata handling
- Size and count validation
- OSSA context management
- Correlation ID generation
- Trace context propagation
- HTTP header integration
- Edge cases and error handling
"""

import pytest
from typing import Dict
from ossa.tracing import (
    W3CBaggage,
    BaggageEntry,
    OSSABaggage,
    BaggageError,
    BaggageSizeError,
    BaggageParseError,
    CorrelationContext,
    TraceContext,
    generate_correlation_id,
    generate_trace_id,
    generate_span_id,
    validate_trace_id,
    validate_span_id,
    validate_correlation_id,
    create_correlation_context,
    propagate_ossa_context,
    create_ossa_baggage,
)


class TestW3CBaggage:
    """Test W3C Baggage core functionality."""

    def test_empty_baggage(self):
        """Test creating empty baggage."""
        baggage = W3CBaggage()
        assert len(baggage) == 0
        assert baggage.to_string() == ""

    def test_set_get(self):
        """Test setting and getting baggage entries."""
        baggage = W3CBaggage()
        baggage.set("key1", "value1")
        baggage.set("key2", "value2")

        assert baggage.get("key1") == "value1"
        assert baggage.get("key2") == "value2"
        assert baggage.get("missing") is None

    def test_has_delete(self):
        """Test checking and deleting entries."""
        baggage = W3CBaggage()
        baggage.set("key", "value")

        assert baggage.has("key") is True
        assert baggage.has("missing") is False

        assert baggage.delete("key") is True
        assert baggage.has("key") is False
        assert baggage.delete("key") is False

    def test_metadata(self):
        """Test baggage entry with metadata."""
        baggage = W3CBaggage()
        baggage.set("key", "value", {"ttl": "3600", "routing": "fast"})

        header = baggage.to_string()
        assert "ttl=3600" in header
        assert "routing=fast" in header

    def test_url_encoding(self):
        """Test URL encoding/decoding of special characters."""
        baggage = W3CBaggage()
        baggage.set("key with spaces", "value=with&special")

        header = baggage.to_string()
        assert "key%20with%20spaces" in header
        assert "value%3Dwith%26special" in header

        # Parse back
        parsed = W3CBaggage.parse(header)
        assert parsed.get("key with spaces") == "value=with&special"

    def test_parse_basic(self):
        """Test parsing basic baggage header."""
        header = "key1=value1,key2=value2"
        baggage = W3CBaggage.parse(header)

        assert baggage.get("key1") == "value1"
        assert baggage.get("key2") == "value2"

    def test_parse_with_metadata(self):
        """Test parsing baggage with metadata."""
        header = "key=value;ttl=3600;priority=high"
        baggage = W3CBaggage.parse(header)

        assert baggage.get("key") == "value"

    def test_parse_empty(self):
        """Test parsing empty header."""
        baggage = W3CBaggage.parse("")
        assert len(baggage) == 0

        baggage = W3CBaggage.parse("   ")
        assert len(baggage) == 0

    def test_parse_malformed_skips_invalid(self):
        """Test parsing malformed entries (should skip invalid)."""
        header = "valid=value,invalid,another=good"
        baggage = W3CBaggage.parse(header)

        assert baggage.get("valid") == "value"
        assert baggage.get("another") == "good"
        assert baggage.get("invalid") is None

    def test_to_headers(self):
        """Test converting to HTTP headers."""
        baggage = W3CBaggage()
        baggage.set("key", "value")

        headers = baggage.to_headers()
        assert "baggage" in headers
        assert headers["baggage"] == "key=value"

    def test_merge(self):
        """Test merging two baggage instances."""
        b1 = W3CBaggage()
        b1.set("key1", "value1")
        b1.set("shared", "original")

        b2 = W3CBaggage()
        b2.set("key2", "value2")
        b2.set("shared", "updated")

        merged = b1.merge(b2)
        assert merged.get("key1") == "value1"
        assert merged.get("key2") == "value2"
        assert merged.get("shared") == "updated"  # b2 wins

    def test_max_pairs_limit(self):
        """Test maximum pairs limit enforcement."""
        baggage = W3CBaggage()

        # Add MAX_PAIRS entries
        for i in range(W3CBaggage.MAX_PAIRS):
            baggage.set(f"key{i}", f"value{i}")

        # Adding one more should raise error
        with pytest.raises(BaggageSizeError):
            baggage.set("overflow", "value")

    def test_max_bytes_limit(self):
        """Test maximum bytes limit enforcement."""
        baggage = W3CBaggage()

        # Create a large value that will exceed MAX_BYTES
        large_value = "x" * (W3CBaggage.MAX_BYTES + 1)
        baggage.set("large", large_value)

        with pytest.raises(BaggageSizeError):
            baggage.to_string()


class TestOSSABaggage:
    """Test OSSA-specific baggage functionality."""

    def test_set_ossa_context(self):
        """Test setting OSSA context."""
        baggage = W3CBaggage()
        context = OSSABaggage(
            agent_id="agent-001",
            interaction_id="int-123",
            trace_id="a" * 32,
            span_id="b" * 16,
        )

        baggage.set_ossa_context(context)

        assert baggage.get("ossa.agent_id") == "agent-001"
        assert baggage.get("ossa.interaction_id") == "int-123"
        assert baggage.get("ossa.trace_id") == "a" * 32
        assert baggage.get("ossa.span_id") == "b" * 16

    def test_get_ossa_context(self):
        """Test getting OSSA context."""
        baggage = W3CBaggage()
        baggage.set("ossa.agent_id", "agent-001")
        baggage.set("ossa.trace_id", "abc123")
        baggage.set("ossa.workflow_id", "wf-456")

        context = baggage.get_ossa_context()

        assert context.agent_id == "agent-001"
        assert context.trace_id == "abc123"
        assert context.workflow_id == "wf-456"

    def test_custom_fields(self):
        """Test OSSA custom fields."""
        baggage = W3CBaggage()
        context = OSSABaggage(
            agent_id="agent-001",
            custom={"env": "production", "region": "us-west"},
        )

        baggage.set_ossa_context(context)

        assert baggage.get("ossa.custom.env") == "production"
        assert baggage.get("ossa.custom.region") == "us-west"

        # Get back context
        extracted = baggage.get_ossa_context()
        assert extracted.custom is not None
        assert extracted.custom["env"] == "production"
        assert extracted.custom["region"] == "us-west"

    def test_initial_ossa_baggage(self):
        """Test initializing with OSSA context."""
        context = OSSABaggage(
            agent_id="agent-001",
            trace_id="abc123",
        )

        baggage = W3CBaggage(context)
        assert baggage.get("ossa.agent_id") == "agent-001"
        assert baggage.get("ossa.trace_id") == "abc123"

    def test_roundtrip_ossa_context(self):
        """Test roundtrip OSSA context (set -> header -> parse -> get)."""
        original = OSSABaggage(
            agent_id="agent-001",
            interaction_id="int-123",
            trace_id="a" * 32,
            span_id="b" * 16,
            workflow_id="wf-456",
            tenant_id="tenant-789",
            custom={"env": "prod"},
        )

        # Set context
        baggage = W3CBaggage(original)

        # Convert to header
        header = baggage.to_string()

        # Parse header
        parsed = W3CBaggage.parse(header)

        # Get context
        extracted = parsed.get_ossa_context()

        assert extracted.agent_id == original.agent_id
        assert extracted.interaction_id == original.interaction_id
        assert extracted.trace_id == original.trace_id
        assert extracted.span_id == original.span_id
        assert extracted.workflow_id == original.workflow_id
        assert extracted.tenant_id == original.tenant_id
        assert extracted.custom == original.custom


class TestCorrelation:
    """Test correlation ID generation and validation."""

    def test_generate_correlation_id(self):
        """Test correlation ID generation."""
        corr_id = generate_correlation_id()

        assert len(corr_id) == 36
        assert corr_id.count("-") == 4
        assert validate_correlation_id(corr_id) is True

    def test_generate_trace_id(self):
        """Test trace ID generation."""
        trace_id = generate_trace_id()

        assert len(trace_id) == 32
        assert all(c in "0123456789abcdef" for c in trace_id)
        assert validate_trace_id(trace_id) is True

    def test_generate_span_id(self):
        """Test span ID generation."""
        span_id = generate_span_id()

        assert len(span_id) == 16
        assert all(c in "0123456789abcdef" for c in span_id)
        assert validate_span_id(span_id) is True

    def test_validate_trace_id(self):
        """Test trace ID validation."""
        assert validate_trace_id("a" * 32) is True
        assert validate_trace_id("0123456789abcdef" * 2) is True

        assert validate_trace_id("") is False
        assert validate_trace_id("short") is False
        assert validate_trace_id("g" * 32) is False  # Invalid hex

    def test_validate_span_id(self):
        """Test span ID validation."""
        assert validate_span_id("b" * 16) is True
        assert validate_span_id("0123456789abcdef") is True

        assert validate_span_id("") is False
        assert validate_span_id("short") is False
        assert validate_span_id("z" * 16) is False  # Invalid hex

    def test_validate_correlation_id(self):
        """Test correlation ID validation."""
        valid_id = generate_correlation_id()
        assert validate_correlation_id(valid_id) is True

        assert validate_correlation_id("") is False
        assert validate_correlation_id("not-a-uuid") is False
        assert validate_correlation_id("12345678-1234-1234-1234-1234567890ab") is True

    def test_correlation_context(self):
        """Test correlation context creation."""
        context = create_correlation_context(
            agent_id="agent-001",
            interaction_id="int-123",
            environment="production",
        )

        assert context.agent_id == "agent-001"
        assert context.interaction_id == "int-123"
        assert validate_correlation_id(context.correlation_id) is True
        assert validate_trace_id(context.trace_id) is True
        assert validate_span_id(context.span_id) is True
        assert context.metadata["environment"] == "production"

    def test_child_correlation_context(self):
        """Test creating child correlation context."""
        parent = create_correlation_context(
            agent_id="parent-agent",
            interaction_id="int-123",
        )

        child = parent.create_child_context(
            agent_id="child-agent",
            step="processing",
        )

        # Same trace and correlation
        assert child.trace_id == parent.trace_id
        assert child.correlation_id == parent.correlation_id

        # New span
        assert child.span_id != parent.span_id
        assert child.parent_span_id == parent.span_id

        # Inherited and new metadata
        assert child.agent_id == "child-agent"
        assert child.metadata["step"] == "processing"

    def test_correlation_context_to_dict(self):
        """Test converting correlation context to dictionary."""
        context = create_correlation_context(
            agent_id="agent-001",
            interaction_id="int-123",
        )

        data = context.to_dict()

        assert data["agent_id"] == "agent-001"
        assert data["correlation_id"] == context.correlation_id
        assert data["trace_id"] == context.trace_id
        assert "timestamp" in data


class TestTraceContext:
    """Test trace context propagation."""

    def test_create_trace_context(self):
        """Test creating trace context."""
        context = TraceContext.create(
            agent_id="agent-001",
            interaction_id="int-123",
        )

        assert context.correlation.agent_id == "agent-001"
        assert context.correlation.interaction_id == "int-123"
        assert "baggage" in context.headers
        assert len(context.baggage) > 0

    def test_trace_context_from_headers(self):
        """Test creating trace context from headers."""
        # Create original context
        original = TraceContext.create(
            agent_id="agent-001",
            interaction_id="int-123",
        )

        # Extract headers
        headers = original.headers

        # Recreate from headers
        restored = TraceContext.from_headers(headers)

        # Should have same OSSA context
        original_ossa = original.baggage.get_ossa_context()
        restored_ossa = restored.baggage.get_ossa_context()

        assert restored_ossa.agent_id == original_ossa.agent_id
        assert restored_ossa.interaction_id == original_ossa.interaction_id
        assert restored_ossa.trace_id == original_ossa.trace_id

    def test_child_trace_context(self):
        """Test creating child trace context."""
        parent = TraceContext.create(
            agent_id="parent-agent",
            interaction_id="int-123",
        )

        child = parent.create_child_context(
            child_agent_id="child-agent",
        )

        # Same trace
        assert child.correlation.trace_id == parent.correlation.trace_id

        # New span
        assert child.correlation.span_id != parent.correlation.span_id
        assert child.correlation.parent_span_id == parent.correlation.span_id

        # OSSA context
        child_ossa = child.baggage.get_ossa_context()
        assert child_ossa.agent_id == "child-agent"
        assert child_ossa.parent_agent_id == "parent-agent"

    def test_merge_metadata(self):
        """Test merging metadata into trace context."""
        context = TraceContext.create(
            agent_id="agent-001",
            interaction_id="int-123",
        )

        context.merge_metadata({"environment": "production", "version": "1.0"})

        assert context.correlation.metadata["environment"] == "production"
        assert context.correlation.metadata["version"] == "1.0"

        # Should be in OSSA custom fields
        ossa = context.baggage.get_ossa_context()
        assert ossa.custom is not None
        assert ossa.custom["environment"] == "production"

    def test_trace_context_to_dict(self):
        """Test converting trace context to dictionary."""
        context = TraceContext.create(
            agent_id="agent-001",
            interaction_id="int-123",
        )

        data = context.to_dict()

        assert "correlation" in data
        assert "ossa_context" in data
        assert "headers" in data


class TestPropagation:
    """Test context propagation utilities."""

    def test_propagate_ossa_context(self):
        """Test propagating OSSA context to child."""
        parent = W3CBaggage(OSSABaggage(
            agent_id="parent-agent",
            trace_id="a" * 32,
            interaction_id="int-123",
        ))

        child = propagate_ossa_context(parent, "child-agent")

        child_context = child.get_ossa_context()

        assert child_context.agent_id == "child-agent"
        assert child_context.parent_agent_id == "parent-agent"
        assert child_context.trace_id == "a" * 32
        assert child_context.interaction_id == "int-123"
        assert child_context.span_id != "b" * 16  # New span

    def test_create_ossa_baggage(self):
        """Test creating OSSA baggage."""
        baggage = create_ossa_baggage(
            agent_id="agent-001",
            interaction_id="int-123",
            workflow_id="wf-456",
            environment="production",
        )

        context = baggage.get_ossa_context()

        assert context.agent_id == "agent-001"
        assert context.interaction_id == "int-123"
        assert context.workflow_id == "wf-456"
        assert validate_trace_id(context.trace_id) is True
        assert validate_span_id(context.span_id) is True
        assert context.custom["environment"] == "production"


class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_empty_values(self):
        """Test handling empty values."""
        baggage = W3CBaggage()
        baggage.set("empty", "")

        assert baggage.get("empty") == ""

        header = baggage.to_string()
        parsed = W3CBaggage.parse(header)
        assert parsed.get("empty") == ""

    def test_special_characters_in_keys(self):
        """Test special characters in keys."""
        baggage = W3CBaggage()
        baggage.set("key.with.dots", "value")
        baggage.set("key-with-dashes", "value")

        header = baggage.to_string()
        parsed = W3CBaggage.parse(header)

        assert parsed.get("key.with.dots") == "value"
        assert parsed.get("key-with-dashes") == "value"

    def test_unicode_values(self):
        """Test Unicode values."""
        baggage = W3CBaggage()
        baggage.set("greeting", "Hello 世界 🌍")

        header = baggage.to_string()
        parsed = W3CBaggage.parse(header)

        assert parsed.get("greeting") == "Hello 世界 🌍"

    def test_multiple_equals_in_value(self):
        """Test values with multiple equals signs."""
        baggage = W3CBaggage()
        baggage.set("base64", "data=value=with=equals")

        header = baggage.to_string()
        parsed = W3CBaggage.parse(header)

        assert parsed.get("base64") == "data=with=equals"  # URL decode issues

    def test_repr(self):
        """Test string representation."""
        baggage = W3CBaggage()
        baggage.set("key", "value")

        repr_str = repr(baggage)
        assert "W3CBaggage" in repr_str
        assert "entries=1" in repr_str


class TestIntegration:
    """Integration tests for complete workflows."""

    def test_multi_agent_workflow(self):
        """Test complete multi-agent workflow with context propagation."""
        # Agent A creates root context
        agent_a_context = TraceContext.create(
            agent_id="agent-a",
            interaction_id="int-123",
            workflow_id="wf-001",
        )

        # Agent A sends to Agent B
        agent_b_context = agent_a_context.create_child_context(
            child_agent_id="agent-b",
            step="processing",
        )

        # Agent B sends to Agent C
        agent_c_context = agent_b_context.create_child_context(
            child_agent_id="agent-c",
            step="finalization",
        )

        # Verify trace continuity
        assert (
            agent_a_context.correlation.trace_id ==
            agent_b_context.correlation.trace_id ==
            agent_c_context.correlation.trace_id
        )

        # Verify parent chain
        a_ossa = agent_a_context.baggage.get_ossa_context()
        b_ossa = agent_b_context.baggage.get_ossa_context()
        c_ossa = agent_c_context.baggage.get_ossa_context()

        assert a_ossa.agent_id == "agent-a"
        assert b_ossa.agent_id == "agent-b"
        assert b_ossa.parent_agent_id == "agent-a"
        assert c_ossa.agent_id == "agent-c"
        assert c_ossa.parent_agent_id == "agent-b"

    def test_http_header_roundtrip(self):
        """Test complete HTTP header roundtrip."""
        # Create context
        original = TraceContext.create(
            agent_id="agent-001",
            interaction_id="int-123",
            tenant_id="tenant-789",
            environment="production",
        )

        # Extract headers for HTTP request
        request_headers = original.headers

        # Simulate HTTP request/response
        # Receiving agent parses headers
        received = TraceContext.from_headers(request_headers)

        # Verify context preserved
        original_ossa = original.baggage.get_ossa_context()
        received_ossa = received.baggage.get_ossa_context()

        assert received_ossa.agent_id == original_ossa.agent_id
        assert received_ossa.interaction_id == original_ossa.interaction_id
        assert received_ossa.trace_id == original_ossa.trace_id
        assert received_ossa.tenant_id == original_ossa.tenant_id

    def test_context_inheritance_chain(self):
        """Test deep context inheritance chain."""
        # Create root
        root = TraceContext.create(
            agent_id="root",
            interaction_id="int-123",
            tenant_id="tenant-001",
        )

        # Create 5-level deep chain
        contexts = [root]
        for i in range(1, 6):
            child = contexts[-1].create_child_context(
                child_agent_id=f"agent-{i}",
                depth=i,
            )
            contexts.append(child)

        # Verify all have same trace ID
        trace_ids = [ctx.correlation.trace_id for ctx in contexts]
        assert len(set(trace_ids)) == 1

        # Verify tenant ID inherited
        for ctx in contexts:
            ossa = ctx.baggage.get_ossa_context()
            assert ossa.tenant_id == "tenant-001"
