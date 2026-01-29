"""
Trace Context Propagation

Utilities for propagating trace context across agent boundaries using W3C Baggage.
Supports parent-child relationships, context merging, and OSSA-specific context fields.

Features:
- Parent-child context propagation
- Context inheritance and merging
- OSSA baggage creation from correlation context
- HTTP header integration
- Multi-agent workflow support
"""

from typing import Optional, Dict, Any
from dataclasses import dataclass

from .w3c_baggage import W3CBaggage, OSSABaggage
from .correlation import (
    CorrelationContext,
    generate_correlation_id,
    generate_trace_id,
    generate_span_id,
    create_correlation_context,
)


@dataclass
class TraceContext:
    """
    Complete trace context for distributed operations.

    Combines W3C Baggage and correlation context for comprehensive
    distributed tracing across agent boundaries.

    Attributes:
        baggage: W3C Baggage instance
        correlation: Correlation context
        headers: HTTP headers for propagation

    Example:
        >>> context = TraceContext.create(
        ...     agent_id="agent-001",
        ...     interaction_id="int-123"
        ... )
        >>> headers = context.headers
        >>> # {'baggage': 'ossa.agent_id=agent-001,...'}
    """
    baggage: W3CBaggage
    correlation: CorrelationContext
    headers: Dict[str, str]

    @classmethod
    def create(
        cls,
        agent_id: str,
        interaction_id: str,
        workflow_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        **metadata
    ) -> "TraceContext":
        """
        Create a new root trace context.

        Args:
            agent_id: Agent identifier
            interaction_id: Interaction/session identifier
            workflow_id: Optional workflow identifier
            tenant_id: Optional tenant identifier
            **metadata: Additional metadata

        Returns:
            New TraceContext with generated IDs

        Example:
            >>> context = TraceContext.create(
            ...     agent_id="agent-001",
            ...     interaction_id="int-123"
            ... )
            >>> assert context.correlation.agent_id == "agent-001"
        """
        # Create correlation context
        correlation = create_correlation_context(
            agent_id=agent_id,
            interaction_id=interaction_id,
            workflow_id=workflow_id,
            tenant_id=tenant_id,
            **metadata
        )

        # Create OSSA baggage
        ossa_context = OSSABaggage(
            agent_id=agent_id,
            interaction_id=interaction_id,
            trace_id=correlation.trace_id,
            span_id=correlation.span_id,
            workflow_id=workflow_id,
            tenant_id=tenant_id,
            custom=metadata if metadata else None,
        )

        baggage = W3CBaggage(ossa_context)
        headers = baggage.to_headers()

        return cls(
            baggage=baggage,
            correlation=correlation,
            headers=headers,
        )

    @classmethod
    def from_headers(cls, headers: Dict[str, str]) -> "TraceContext":
        """
        Create trace context from HTTP headers.

        Args:
            headers: HTTP headers containing 'baggage' header

        Returns:
            TraceContext parsed from headers

        Example:
            >>> incoming_headers = {"baggage": "ossa.agent_id=agent-001"}
            >>> context = TraceContext.from_headers(incoming_headers)
            >>> assert context.correlation.agent_id == "agent-001"
        """
        # Parse baggage from headers
        baggage_header = headers.get("baggage", "")
        baggage = W3CBaggage.parse(baggage_header)

        # Extract OSSA context
        ossa_context = baggage.get_ossa_context()

        # Create correlation context from OSSA context
        correlation = CorrelationContext(
            correlation_id=generate_correlation_id(),
            trace_id=ossa_context.trace_id or generate_trace_id(),
            span_id=ossa_context.span_id or generate_span_id(),
            agent_id=ossa_context.agent_id,
            interaction_id=ossa_context.interaction_id,
            workflow_id=ossa_context.workflow_id,
            tenant_id=ossa_context.tenant_id,
            metadata=ossa_context.custom or {},
        )

        return cls(
            baggage=baggage,
            correlation=correlation,
            headers=baggage.to_headers(),
        )

    def create_child_context(
        self,
        child_agent_id: str,
        **metadata
    ) -> "TraceContext":
        """
        Create a child trace context for nested operations.

        Args:
            child_agent_id: Child agent identifier
            **metadata: Additional metadata for child context

        Returns:
            New TraceContext with inherited trace ID, new span ID

        Example:
            >>> parent = TraceContext.create(
            ...     agent_id="parent-agent",
            ...     interaction_id="int-123"
            ... )
            >>> child = parent.create_child_context(
            ...     child_agent_id="child-agent"
            ... )
            >>> assert child.correlation.trace_id == parent.correlation.trace_id
            >>> assert child.correlation.parent_span_id == parent.correlation.span_id
        """
        # Create child correlation context
        child_correlation = self.correlation.create_child_context(
            agent_id=child_agent_id,
            **metadata
        )

        # Get current OSSA context
        current_ossa = self.baggage.get_ossa_context()

        # Create child OSSA context
        child_ossa = OSSABaggage(
            agent_id=child_agent_id,
            interaction_id=current_ossa.interaction_id,
            trace_id=child_correlation.trace_id,
            span_id=child_correlation.span_id,
            parent_agent_id=self.correlation.agent_id,
            workflow_id=current_ossa.workflow_id,
            tenant_id=current_ossa.tenant_id,
            custom={**(current_ossa.custom or {}), **metadata} if metadata else current_ossa.custom,
        )

        child_baggage = W3CBaggage(child_ossa)
        child_headers = child_baggage.to_headers()

        return TraceContext(
            baggage=child_baggage,
            correlation=child_correlation,
            headers=child_headers,
        )

    def merge_metadata(self, metadata: Dict[str, Any]) -> None:
        """
        Merge additional metadata into context.

        Args:
            metadata: Metadata to merge

        Example:
            >>> context = TraceContext.create(
            ...     agent_id="agent-001",
            ...     interaction_id="int-123"
            ... )
            >>> context.merge_metadata({"environment": "production"})
            >>> assert "environment" in context.correlation.metadata
        """
        # Update correlation metadata
        self.correlation.metadata.update(metadata)

        # Update baggage custom fields
        ossa_context = self.baggage.get_ossa_context()
        ossa_context.custom = {**(ossa_context.custom or {}), **metadata}
        self.baggage.set_ossa_context(ossa_context)

        # Update headers
        self.headers = self.baggage.to_headers()

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert trace context to dictionary.

        Returns:
            Dictionary representation of context

        Example:
            >>> context = TraceContext.create(
            ...     agent_id="agent-001",
            ...     interaction_id="int-123"
            ... )
            >>> data = context.to_dict()
            >>> assert "correlation" in data
            >>> assert "headers" in data
        """
        return {
            "correlation": self.correlation.to_dict(),
            "ossa_context": self.baggage.get_ossa_context().__dict__,
            "headers": self.headers,
        }


def propagate_ossa_context(
    parent_baggage: W3CBaggage,
    child_agent_id: str
) -> W3CBaggage:
    """
    Propagate OSSA context from parent to child agent.

    Creates a new baggage with inherited context and child-specific fields.
    The parent's agent_id becomes the child's parent_agent_id.

    Args:
        parent_baggage: Parent agent's baggage
        child_agent_id: Child agent identifier

    Returns:
        New W3CBaggage for child agent

    Example:
        >>> parent = W3CBaggage(OSSABaggage(
        ...     agent_id="parent-agent",
        ...     trace_id=generate_trace_id()
        ... ))
        >>> child = propagate_ossa_context(parent, "child-agent")
        >>> child_ctx = child.get_ossa_context()
        >>> assert child_ctx.parent_agent_id == "parent-agent"
        >>> assert child_ctx.agent_id == "child-agent"
    """
    parent_context = parent_baggage.get_ossa_context()

    child_context = OSSABaggage(
        agent_id=child_agent_id,
        interaction_id=parent_context.interaction_id,
        trace_id=parent_context.trace_id,
        span_id=generate_span_id(),  # New span for child
        parent_agent_id=parent_context.agent_id,
        workflow_id=parent_context.workflow_id,
        tenant_id=parent_context.tenant_id,
        custom=parent_context.custom,
    )

    return W3CBaggage(child_context)


def create_ossa_baggage(
    agent_id: str,
    interaction_id: str,
    workflow_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    **custom_fields
) -> W3CBaggage:
    """
    Create a new OSSA baggage with generated trace context.

    Convenience function for creating root-level baggage with all
    necessary IDs and context fields.

    Args:
        agent_id: Agent identifier
        interaction_id: Interaction/session identifier
        workflow_id: Optional workflow identifier
        tenant_id: Optional tenant identifier
        **custom_fields: Custom OSSA context fields

    Returns:
        W3CBaggage with OSSA context and generated trace IDs

    Example:
        >>> baggage = create_ossa_baggage(
        ...     agent_id="agent-001",
        ...     interaction_id="int-123",
        ...     environment="production"
        ... )
        >>> context = baggage.get_ossa_context()
        >>> assert context.agent_id == "agent-001"
        >>> assert context.trace_id is not None
        >>> assert context.custom["environment"] == "production"
    """
    ossa_context = OSSABaggage(
        agent_id=agent_id,
        interaction_id=interaction_id,
        trace_id=generate_trace_id(),
        span_id=generate_span_id(),
        workflow_id=workflow_id,
        tenant_id=tenant_id,
        custom=custom_fields if custom_fields else None,
    )

    return W3CBaggage(ossa_context)
