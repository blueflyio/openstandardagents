"""
OSSA Distributed Tracing Support

W3C Baggage implementation for multi-agent correlation and context propagation.
Enables tracing across agent boundaries with correlation IDs, trace context, and
custom metadata following W3C standards.

Quick Start:
    >>> from ossa.tracing import W3CBaggage, create_ossa_baggage
    >>>
    >>> # Create baggage with OSSA context
    >>> baggage = create_ossa_baggage(
    ...     agent_id="agent-001",
    ...     interaction_id="interaction-123"
    ... )
    >>>
    >>> # Convert to HTTP header
    >>> headers = baggage.to_headers()
    >>> # {'baggage': 'ossa.agent_id=agent-001,...'}
    >>>
    >>> # Parse from HTTP header
    >>> incoming = W3CBaggage.parse(headers['baggage'])
    >>> context = incoming.get_ossa_context()
    >>> print(context.agent_id)  # 'agent-001'

For complete documentation, see:
https://openstandardagents.org/docs/tracing
"""

__all__ = [
    # Core W3C Baggage
    "W3CBaggage",
    "BaggageEntry",
    "OSSABaggage",

    # Correlation management
    "CorrelationContext",
    "generate_correlation_id",
    "generate_trace_id",
    "generate_span_id",

    # Context propagation
    "TraceContext",
    "propagate_ossa_context",
    "create_ossa_baggage",

    # Exceptions
    "BaggageError",
    "BaggageSizeError",
    "BaggageParseError",
]

from .w3c_baggage import (
    W3CBaggage,
    BaggageEntry,
    OSSABaggage,
    BaggageError,
    BaggageSizeError,
    BaggageParseError,
)
from .correlation import (
    CorrelationContext,
    generate_correlation_id,
    generate_trace_id,
    generate_span_id,
)
from .context import (
    TraceContext,
    propagate_ossa_context,
    create_ossa_baggage,
)
