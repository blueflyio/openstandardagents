"""W3C Baggage implementation for OSSA distributed tracing."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Dict, Optional
from urllib.parse import quote, unquote


OSSA_PREFIX = "ossa."
HEADER_NAME = "baggage"
MAX_PAIRS = 180
MAX_BYTES = 8192


@dataclass
class OSSABaggage:
    """OSSA-specific baggage context."""
    agent_id: Optional[str] = None
    interaction_id: Optional[str] = None
    trace_id: Optional[str] = None
    span_id: Optional[str] = None
    parent_agent_id: Optional[str] = None
    workflow_id: Optional[str] = None
    tenant_id: Optional[str] = None
    custom: Dict[str, str] = field(default_factory=dict)


class W3CBaggage:
    """W3C Baggage header parser/builder with OSSA extensions."""

    def __init__(self) -> None:
        self._entries: Dict[str, str] = {}

    def set(self, key: str, value: str) -> None:
        self._entries[key] = value

    def get(self, key: str) -> Optional[str]:
        return self._entries.get(key)

    def delete(self, key: str) -> bool:
        return self._entries.pop(key, None) is not None

    def has(self, key: str) -> bool:
        return key in self._entries

    def set_ossa_context(self, ctx: OSSABaggage) -> None:
        mapping = {
            "agent_id": ctx.agent_id,
            "interaction_id": ctx.interaction_id,
            "trace_id": ctx.trace_id,
            "span_id": ctx.span_id,
            "parent_agent_id": ctx.parent_agent_id,
            "workflow_id": ctx.workflow_id,
            "tenant_id": ctx.tenant_id,
        }
        for k, v in mapping.items():
            if v:
                self._entries[f"{OSSA_PREFIX}{k}"] = v
        for k, v in ctx.custom.items():
            self._entries[f"{OSSA_PREFIX}custom.{k}"] = v

    def get_ossa_context(self) -> OSSABaggage:
        ctx = OSSABaggage()
        for key in ("agent_id", "interaction_id", "trace_id", "span_id",
                     "parent_agent_id", "workflow_id", "tenant_id"):
            val = self._entries.get(f"{OSSA_PREFIX}{key}")
            if val:
                setattr(ctx, key, val)
        prefix = f"{OSSA_PREFIX}custom."
        for k, v in self._entries.items():
            if k.startswith(prefix):
                ctx.custom[k[len(prefix):]] = v
        return ctx

    def to_header(self) -> str:
        pairs = []
        for k, v in self._entries.items():
            pairs.append(f"{quote(k)}={quote(v)}")
        return ", ".join(pairs)

    def to_headers(self) -> Dict[str, str]:
        return {HEADER_NAME: self.to_header()}

    @classmethod
    def parse(cls, header: str) -> W3CBaggage:
        baggage = cls()
        for pair in header.split(","):
            pair = pair.strip()
            if "=" in pair:
                k, v = pair.split("=", 1)
                baggage.set(unquote(k.strip()), unquote(v.strip()))
        return baggage

    def merge(self, other: W3CBaggage) -> W3CBaggage:
        result = W3CBaggage()
        result._entries.update(self._entries)
        result._entries.update(other._entries)
        return result


def generate_trace_id() -> str:
    return uuid.uuid4().hex

def generate_span_id() -> str:
    return uuid.uuid4().hex[:16]

def create_ossa_baggage(agent_id: str, interaction_id: Optional[str] = None) -> W3CBaggage:
    baggage = W3CBaggage()
    ctx = OSSABaggage(
        agent_id=agent_id,
        interaction_id=interaction_id or str(uuid.uuid4()),
        trace_id=generate_trace_id(),
        span_id=generate_span_id(),
    )
    baggage.set_ossa_context(ctx)
    return baggage

def propagate_context(parent: W3CBaggage, child_agent_id: str) -> W3CBaggage:
    child = W3CBaggage()
    parent_ctx = parent.get_ossa_context()
    child_ctx = OSSABaggage(
        agent_id=child_agent_id,
        interaction_id=parent_ctx.interaction_id,
        trace_id=parent_ctx.trace_id,
        span_id=generate_span_id(),
        parent_agent_id=parent_ctx.agent_id,
        workflow_id=parent_ctx.workflow_id,
        tenant_id=parent_ctx.tenant_id,
    )
    child.set_ossa_context(child_ctx)
    return child
