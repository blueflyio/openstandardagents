"""
W3C Baggage Parser and Builder

Implements the W3C Baggage specification for distributed context propagation.
Provides type-safe parsing and building of baggage headers with OSSA-specific
extensions for multi-agent tracing.

Specification: https://www.w3.org/TR/baggage/

Features:
- W3C Baggage header parsing and building
- OSSA-specific context fields (agent_id, interaction_id, trace_id, etc.)
- Metadata support (properties like TTL, routing hints)
- Size and count validation (180 pairs max, 8KB max)
- URL encoding/decoding
- Merge and propagation utilities

Thread Safety: W3CBaggage instances are NOT thread-safe. Create new instances
per request/agent interaction.
"""

from typing import Dict, Optional, List, Tuple
from dataclasses import dataclass, field
from urllib.parse import quote, unquote


# Exceptions
class BaggageError(Exception):
    """Base exception for baggage operations."""
    pass


class BaggageSizeError(BaggageError):
    """Raised when baggage exceeds size limits."""
    pass


class BaggageParseError(BaggageError):
    """Raised when baggage header cannot be parsed."""
    pass


# Data models
@dataclass
class BaggageEntry:
    """
    A single baggage entry with key, value, and optional metadata.

    Attributes:
        key: The baggage key (URL-encoded in header)
        value: The baggage value (URL-encoded in header)
        metadata: Optional metadata properties (e.g., {'ttl': '3600'})

    Example:
        >>> entry = BaggageEntry(
        ...     key="ossa.agent_id",
        ...     value="agent-001",
        ...     metadata={"ttl": "3600"}
        ... )
    """
    key: str
    value: str
    metadata: Optional[Dict[str, str]] = None


@dataclass
class OSSABaggage:
    """
    OSSA-specific baggage context for multi-agent tracing.

    All fields are optional to support partial context propagation.
    The 'custom' field supports arbitrary key-value pairs with 'ossa.custom.' prefix.

    Attributes:
        agent_id: Current agent identifier
        interaction_id: Current interaction/session identifier
        trace_id: Distributed trace identifier (32 hex chars)
        span_id: Current span identifier (16 hex chars)
        parent_agent_id: Parent agent identifier (for delegation chains)
        workflow_id: Workflow/orchestration identifier
        tenant_id: Multi-tenant isolation identifier
        custom: Custom OSSA context fields (prefixed with 'ossa.custom.')

    Example:
        >>> context = OSSABaggage(
        ...     agent_id="agent-001",
        ...     interaction_id="int-123",
        ...     trace_id="a" * 32,
        ...     custom={"environment": "production"}
        ... )
    """
    agent_id: Optional[str] = None
    interaction_id: Optional[str] = None
    trace_id: Optional[str] = None
    span_id: Optional[str] = None
    parent_agent_id: Optional[str] = None
    workflow_id: Optional[str] = None
    tenant_id: Optional[str] = None
    custom: Optional[Dict[str, str]] = None


class W3CBaggage:
    """
    W3C Baggage implementation for distributed context propagation.

    Implements the W3C Baggage specification with OSSA-specific extensions.
    Supports parsing and building baggage headers, size validation, and
    OSSA context management.

    Limits (per W3C spec):
        - Maximum 180 key-value pairs
        - Maximum 8192 bytes total header size

    Example:
        >>> # Create baggage
        >>> baggage = W3CBaggage()
        >>> baggage.set("ossa.agent_id", "agent-001")
        >>> baggage.set("ossa.trace_id", "abc123")
        >>>
        >>> # Convert to header
        >>> header = baggage.to_string()
        >>> # 'ossa.agent_id=agent-001,ossa.trace_id=abc123'
        >>>
        >>> # Parse from header
        >>> parsed = W3CBaggage.parse(header)
        >>> assert parsed.get("ossa.agent_id") == "agent-001"
    """

    OSSA_PREFIX = "ossa."
    HEADER_NAME = "baggage"
    MAX_PAIRS = 180
    MAX_BYTES = 8192

    def __init__(self, initial_baggage: Optional[OSSABaggage] = None):
        """
        Initialize W3C Baggage with optional OSSA context.

        Args:
            initial_baggage: Optional OSSA context to initialize baggage

        Example:
            >>> context = OSSABaggage(agent_id="agent-001")
            >>> baggage = W3CBaggage(context)
        """
        self._entries: Dict[str, BaggageEntry] = {}
        if initial_baggage:
            self.set_ossa_context(initial_baggage)

    def set(
        self,
        key: str,
        value: str,
        metadata: Optional[Dict[str, str]] = None
    ) -> None:
        """
        Set a baggage entry with optional metadata.

        Args:
            key: Baggage key (will be URL-encoded)
            value: Baggage value (will be URL-encoded)
            metadata: Optional metadata properties

        Raises:
            BaggageSizeError: If baggage would exceed MAX_PAIRS limit

        Example:
            >>> baggage = W3CBaggage()
            >>> baggage.set("user_id", "12345", {"ttl": "3600"})
        """
        if len(self._entries) >= self.MAX_PAIRS:
            raise BaggageSizeError(
                f"Baggage exceeds maximum pairs ({self.MAX_PAIRS})"
            )
        self._entries[key] = BaggageEntry(key, value, metadata)

    def get(self, key: str) -> Optional[str]:
        """
        Get a baggage value by key.

        Args:
            key: Baggage key

        Returns:
            Baggage value or None if key not found

        Example:
            >>> baggage = W3CBaggage()
            >>> baggage.set("ossa.agent_id", "agent-001")
            >>> assert baggage.get("ossa.agent_id") == "agent-001"
        """
        entry = self._entries.get(key)
        return entry.value if entry else None

    def delete(self, key: str) -> bool:
        """
        Delete a baggage entry.

        Args:
            key: Baggage key to delete

        Returns:
            True if entry was deleted, False if not found

        Example:
            >>> baggage = W3CBaggage()
            >>> baggage.set("temp", "value")
            >>> assert baggage.delete("temp") is True
            >>> assert baggage.delete("temp") is False
        """
        if key in self._entries:
            del self._entries[key]
            return True
        return False

    def has(self, key: str) -> bool:
        """
        Check if a baggage key exists.

        Args:
            key: Baggage key

        Returns:
            True if key exists, False otherwise

        Example:
            >>> baggage = W3CBaggage()
            >>> baggage.set("key", "value")
            >>> assert baggage.has("key") is True
            >>> assert baggage.has("missing") is False
        """
        return key in self._entries

    def set_ossa_context(self, context: OSSABaggage) -> None:
        """
        Set OSSA-specific context fields with 'ossa.' prefix.

        Args:
            context: OSSA context to set

        Example:
            >>> baggage = W3CBaggage()
            >>> context = OSSABaggage(
            ...     agent_id="agent-001",
            ...     trace_id="abc123",
            ...     custom={"env": "prod"}
            ... )
            >>> baggage.set_ossa_context(context)
        """
        if context.agent_id:
            self.set(f"{self.OSSA_PREFIX}agent_id", context.agent_id)
        if context.interaction_id:
            self.set(f"{self.OSSA_PREFIX}interaction_id", context.interaction_id)
        if context.trace_id:
            self.set(f"{self.OSSA_PREFIX}trace_id", context.trace_id)
        if context.span_id:
            self.set(f"{self.OSSA_PREFIX}span_id", context.span_id)
        if context.parent_agent_id:
            self.set(f"{self.OSSA_PREFIX}parent_agent_id", context.parent_agent_id)
        if context.workflow_id:
            self.set(f"{self.OSSA_PREFIX}workflow_id", context.workflow_id)
        if context.tenant_id:
            self.set(f"{self.OSSA_PREFIX}tenant_id", context.tenant_id)
        if context.custom:
            for k, v in context.custom.items():
                self.set(f"{self.OSSA_PREFIX}custom.{k}", v)

    def get_ossa_context(self) -> OSSABaggage:
        """
        Extract OSSA-specific context from baggage.

        Returns:
            OSSABaggage with all OSSA-prefixed fields

        Example:
            >>> baggage = W3CBaggage()
            >>> baggage.set("ossa.agent_id", "agent-001")
            >>> context = baggage.get_ossa_context()
            >>> assert context.agent_id == "agent-001"
        """
        custom: Dict[str, str] = {}
        custom_prefix = f"{self.OSSA_PREFIX}custom."

        for key in self._entries:
            if key.startswith(custom_prefix):
                custom_key = key[len(custom_prefix):]
                value = self.get(key)
                if value is not None:
                    custom[custom_key] = value

        return OSSABaggage(
            agent_id=self.get(f"{self.OSSA_PREFIX}agent_id"),
            interaction_id=self.get(f"{self.OSSA_PREFIX}interaction_id"),
            trace_id=self.get(f"{self.OSSA_PREFIX}trace_id"),
            span_id=self.get(f"{self.OSSA_PREFIX}span_id"),
            parent_agent_id=self.get(f"{self.OSSA_PREFIX}parent_agent_id"),
            workflow_id=self.get(f"{self.OSSA_PREFIX}workflow_id"),
            tenant_id=self.get(f"{self.OSSA_PREFIX}tenant_id"),
            custom=custom if custom else None,
        )

    def to_string(self) -> str:
        """
        Convert baggage to W3C Baggage header string.

        Format: key1=value1;meta1=val1,key2=value2

        Returns:
            W3C Baggage header string (URL-encoded)

        Raises:
            BaggageSizeError: If baggage exceeds MAX_BYTES limit

        Example:
            >>> baggage = W3CBaggage()
            >>> baggage.set("key", "value")
            >>> header = baggage.to_string()
            >>> # 'key=value'
        """
        parts: List[str] = []

        for entry in self._entries.values():
            # URL-encode key and value
            part = f"{quote(entry.key, safe='')}={quote(entry.value, safe='')}"

            # Add metadata if present
            if entry.metadata:
                for mk, mv in entry.metadata.items():
                    # Metadata keys/values are not URL-encoded per spec
                    part += f";{mk}={mv}"

            parts.append(part)

        result = ",".join(parts)

        if len(result) > self.MAX_BYTES:
            raise BaggageSizeError(
                f"Baggage exceeds maximum size ({self.MAX_BYTES} bytes)"
            )

        return result

    @classmethod
    def parse(cls, header: str) -> "W3CBaggage":
        """
        Parse W3C Baggage header string.

        Format: key1=value1;meta1=val1,key2=value2

        Args:
            header: W3C Baggage header string

        Returns:
            W3CBaggage instance with parsed entries

        Raises:
            BaggageParseError: If header format is invalid

        Example:
            >>> header = "key=value,ossa.agent_id=agent-001"
            >>> baggage = W3CBaggage.parse(header)
            >>> assert baggage.get("key") == "value"
        """
        baggage = cls()
        if not header:
            return baggage

        try:
            # Split into entries by comma
            entries = header.split(",")

            for entry in entries:
                # Split entry into key=value and metadata
                parts = entry.strip().split(";")
                if not parts:
                    continue

                # Parse key=value
                kv_part = parts[0]
                eq_index = kv_part.find("=")
                if eq_index == -1:
                    # Skip invalid entries without '='
                    continue

                # URL-decode key and value
                key = unquote(kv_part[:eq_index].strip())
                value = unquote(kv_part[eq_index + 1:].strip())

                # Parse metadata (key=value pairs after semicolons)
                metadata: Dict[str, str] = {}
                for meta_part in parts[1:]:
                    meta_eq = meta_part.find("=")
                    if meta_eq != -1:
                        meta_key = meta_part[:meta_eq].strip()
                        meta_value = meta_part[meta_eq + 1:].strip()
                        metadata[meta_key] = meta_value

                # Add entry
                baggage.set(
                    key,
                    value,
                    metadata if metadata else None
                )

        except Exception as e:
            raise BaggageParseError(f"Failed to parse baggage header: {e}") from e

        return baggage

    def to_headers(self) -> Dict[str, str]:
        """
        Convert baggage to HTTP headers dictionary.

        Returns:
            Dictionary with 'baggage' header

        Example:
            >>> baggage = W3CBaggage()
            >>> baggage.set("key", "value")
            >>> headers = baggage.to_headers()
            >>> # {'baggage': 'key=value'}
        """
        return {self.HEADER_NAME: self.to_string()}

    def merge(self, other: "W3CBaggage") -> "W3CBaggage":
        """
        Merge with another baggage instance (other takes precedence).

        Args:
            other: Baggage to merge (overwrites on conflict)

        Returns:
            New W3CBaggage instance with merged entries

        Example:
            >>> b1 = W3CBaggage()
            >>> b1.set("key1", "value1")
            >>> b2 = W3CBaggage()
            >>> b2.set("key2", "value2")
            >>> merged = b1.merge(b2)
            >>> assert merged.get("key1") == "value1"
            >>> assert merged.get("key2") == "value2"
        """
        merged = W3CBaggage()

        # Copy entries from self
        for entry in self._entries.values():
            merged.set(entry.key, entry.value, entry.metadata)

        # Copy entries from other (overwrites conflicts)
        for entry in other._entries.values():
            merged.set(entry.key, entry.value, entry.metadata)

        return merged

    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"W3CBaggage(entries={len(self._entries)})"

    def __len__(self) -> int:
        """Return number of baggage entries."""
        return len(self._entries)
