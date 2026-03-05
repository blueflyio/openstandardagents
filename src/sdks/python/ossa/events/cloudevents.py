"""CloudEvents v1.0 implementation with OSSA extensions."""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


OSSA_EVENT_TYPES = {
    "AGENT_STARTED": "dev.ossa.agent.started",
    "AGENT_COMPLETED": "dev.ossa.agent.completed",
    "AGENT_FAILED": "dev.ossa.agent.failed",
    "TOOL_CALLED": "dev.ossa.tool.called",
    "TOOL_COMPLETED": "dev.ossa.tool.completed",
    "TOOL_FAILED": "dev.ossa.tool.failed",
    "TURN_STARTED": "dev.ossa.turn.started",
    "TURN_COMPLETED": "dev.ossa.turn.completed",
    "STATE_UPDATED": "dev.ossa.state.updated",
    "WORKFLOW_STARTED": "dev.ossa.workflow.started",
    "WORKFLOW_COMPLETED": "dev.ossa.workflow.completed",
}


@dataclass
class CloudEvent:
    """CloudEvents v1.0 compliant event with OSSA extensions."""
    specversion: str = "1.0"
    type: str = ""
    source: str = ""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    time: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    datacontenttype: str = "application/json"
    subject: Optional[str] = None
    data: Optional[Any] = None
    # OSSA extensions
    ossaagentid: Optional[str] = None
    ossainteractionid: Optional[str] = None
    ossatraceid: Optional[str] = None
    ossaspanid: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {
            "specversion": self.specversion,
            "type": self.type,
            "source": self.source,
            "id": self.id,
            "time": self.time,
        }
        if self.datacontenttype:
            d["datacontenttype"] = self.datacontenttype
        if self.subject:
            d["subject"] = self.subject
        if self.data is not None:
            d["data"] = self.data
        for attr in ("ossaagentid", "ossainteractionid", "ossatraceid", "ossaspanid"):
            val = getattr(self, attr)
            if val:
                d[attr] = val
        return d

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), default=str)


class CloudEventsEmitter:
    """Emit OSSA CloudEvents to configured sinks."""

    def __init__(self, source: str, agent_id: Optional[str] = None) -> None:
        self._source = source
        self._agent_id = agent_id
        self._buffer: List[CloudEvent] = []

    def emit(self, event_type: str, data: Any = None, subject: Optional[str] = None) -> CloudEvent:
        event = CloudEvent(
            type=event_type,
            source=self._source,
            data=data,
            subject=subject,
            ossaagentid=self._agent_id,
        )
        self._buffer.append(event)
        return event

    def flush(self) -> List[CloudEvent]:
        """Return and clear buffered events."""
        events = list(self._buffer)
        self._buffer.clear()
        return events
