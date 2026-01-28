"""
Correlation ID and Trace ID Generation

Provides utilities for generating correlation IDs, trace IDs, and span IDs
following distributed tracing standards (OpenTelemetry compatible).

Features:
- Thread-safe ID generation
- OpenTelemetry-compatible trace/span IDs
- RFC 4122 UUID v4 correlation IDs
- Context-aware correlation tracking
- Custom ID validation

Standards:
- Trace ID: 32 hex characters (128 bits)
- Span ID: 16 hex characters (64 bits)
- Correlation ID: UUID v4 (RFC 4122)
"""

import secrets
import uuid
from typing import Optional, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class CorrelationContext:
    """
    Correlation context for tracking related operations.

    Provides a complete correlation context including trace ID, span ID,
    correlation ID, and optional metadata for distributed tracing.

    Attributes:
        correlation_id: Unique correlation identifier (UUID v4)
        trace_id: Distributed trace identifier (32 hex chars)
        span_id: Current span identifier (16 hex chars)
        parent_span_id: Parent span identifier (16 hex chars)
        agent_id: Agent identifier
        interaction_id: Interaction/session identifier
        workflow_id: Workflow/orchestration identifier
        tenant_id: Multi-tenant isolation identifier
        metadata: Additional context metadata
        timestamp: Context creation timestamp (UTC)

    Example:
        >>> context = CorrelationContext(
        ...     correlation_id=generate_correlation_id(),
        ...     trace_id=generate_trace_id(),
        ...     span_id=generate_span_id(),
        ...     agent_id="agent-001"
        ... )
        >>> print(context.correlation_id)  # UUID v4
    """
    correlation_id: str
    trace_id: str
    span_id: str
    parent_span_id: Optional[str] = None
    agent_id: Optional[str] = None
    interaction_id: Optional[str] = None
    workflow_id: Optional[str] = None
    tenant_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def create_child_context(
        self,
        agent_id: Optional[str] = None,
        **metadata
    ) -> "CorrelationContext":
        """
        Create a child correlation context for nested operations.

        Args:
            agent_id: Override agent ID for child context
            **metadata: Additional metadata for child context

        Returns:
            New CorrelationContext with same trace_id, new span_id

        Example:
            >>> parent = CorrelationContext(
            ...     correlation_id=generate_correlation_id(),
            ...     trace_id=generate_trace_id(),
            ...     span_id=generate_span_id(),
            ...     agent_id="parent-agent"
            ... )
            >>> child = parent.create_child_context(agent_id="child-agent")
            >>> assert child.trace_id == parent.trace_id
            >>> assert child.parent_span_id == parent.span_id
        """
        return CorrelationContext(
            correlation_id=self.correlation_id,
            trace_id=self.trace_id,
            span_id=generate_span_id(),
            parent_span_id=self.span_id,
            agent_id=agent_id or self.agent_id,
            interaction_id=self.interaction_id,
            workflow_id=self.workflow_id,
            tenant_id=self.tenant_id,
            metadata={**self.metadata, **metadata},
        )

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert correlation context to dictionary.

        Returns:
            Dictionary representation of context

        Example:
            >>> context = CorrelationContext(
            ...     correlation_id=generate_correlation_id(),
            ...     trace_id=generate_trace_id(),
            ...     span_id=generate_span_id()
            ... )
            >>> data = context.to_dict()
            >>> assert "correlation_id" in data
        """
        return {
            "correlation_id": self.correlation_id,
            "trace_id": self.trace_id,
            "span_id": self.span_id,
            "parent_span_id": self.parent_span_id,
            "agent_id": self.agent_id,
            "interaction_id": self.interaction_id,
            "workflow_id": self.workflow_id,
            "tenant_id": self.tenant_id,
            "metadata": self.metadata,
            "timestamp": self.timestamp.isoformat(),
        }


def generate_correlation_id() -> str:
    """
    Generate a globally unique correlation ID (UUID v4).

    Returns:
        UUID v4 string (36 characters with hyphens)

    Example:
        >>> corr_id = generate_correlation_id()
        >>> assert len(corr_id) == 36
        >>> assert corr_id.count("-") == 4
    """
    return str(uuid.uuid4())


def generate_trace_id() -> str:
    """
    Generate an OpenTelemetry-compatible trace ID.

    Returns:
        32 hex character string (128 bits)

    Example:
        >>> trace_id = generate_trace_id()
        >>> assert len(trace_id) == 32
        >>> assert all(c in "0123456789abcdef" for c in trace_id)
    """
    # Generate 16 random bytes (128 bits)
    random_bytes = secrets.token_bytes(16)
    return random_bytes.hex()


def generate_span_id() -> str:
    """
    Generate an OpenTelemetry-compatible span ID.

    Returns:
        16 hex character string (64 bits)

    Example:
        >>> span_id = generate_span_id()
        >>> assert len(span_id) == 16
        >>> assert all(c in "0123456789abcdef" for c in span_id)
    """
    # Generate 8 random bytes (64 bits)
    random_bytes = secrets.token_bytes(8)
    return random_bytes.hex()


def validate_trace_id(trace_id: str) -> bool:
    """
    Validate an OpenTelemetry trace ID format.

    Args:
        trace_id: Trace ID to validate

    Returns:
        True if valid, False otherwise

    Example:
        >>> valid_id = generate_trace_id()
        >>> assert validate_trace_id(valid_id) is True
        >>> assert validate_trace_id("invalid") is False
    """
    if not trace_id or len(trace_id) != 32:
        return False
    try:
        int(trace_id, 16)
        return True
    except ValueError:
        return False


def validate_span_id(span_id: str) -> bool:
    """
    Validate an OpenTelemetry span ID format.

    Args:
        span_id: Span ID to validate

    Returns:
        True if valid, False otherwise

    Example:
        >>> valid_id = generate_span_id()
        >>> assert validate_span_id(valid_id) is True
        >>> assert validate_span_id("invalid") is False
    """
    if not span_id or len(span_id) != 16:
        return False
    try:
        int(span_id, 16)
        return True
    except ValueError:
        return False


def validate_correlation_id(correlation_id: str) -> bool:
    """
    Validate a UUID v4 correlation ID format.

    Args:
        correlation_id: Correlation ID to validate

    Returns:
        True if valid, False otherwise

    Example:
        >>> valid_id = generate_correlation_id()
        >>> assert validate_correlation_id(valid_id) is True
        >>> assert validate_correlation_id("invalid") is False
    """
    try:
        uuid_obj = uuid.UUID(correlation_id)
        return str(uuid_obj) == correlation_id
    except (ValueError, AttributeError):
        return False


def create_correlation_context(
    agent_id: Optional[str] = None,
    interaction_id: Optional[str] = None,
    workflow_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    **metadata
) -> CorrelationContext:
    """
    Create a new root correlation context.

    Args:
        agent_id: Agent identifier
        interaction_id: Interaction/session identifier
        workflow_id: Workflow/orchestration identifier
        tenant_id: Multi-tenant isolation identifier
        **metadata: Additional context metadata

    Returns:
        New CorrelationContext with generated IDs

    Example:
        >>> context = create_correlation_context(
        ...     agent_id="agent-001",
        ...     interaction_id="int-123",
        ...     environment="production"
        ... )
        >>> assert context.agent_id == "agent-001"
        >>> assert "environment" in context.metadata
    """
    return CorrelationContext(
        correlation_id=generate_correlation_id(),
        trace_id=generate_trace_id(),
        span_id=generate_span_id(),
        agent_id=agent_id,
        interaction_id=interaction_id,
        workflow_id=workflow_id,
        tenant_id=tenant_id,
        metadata=metadata,
    )
