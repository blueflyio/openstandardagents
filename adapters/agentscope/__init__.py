"""OSSA-to-AgentScope adapter. Reads OSSA manifests and creates AgentScope agents."""

from .adapter import OSSAAgentScopeAdapter
from .factory import create_agent_from_manifest

__all__ = ["OSSAAgentScopeAdapter", "create_agent_from_manifest"]
