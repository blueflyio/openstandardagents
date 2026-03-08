"""Factory function for one-line agent creation from an OSSA manifest."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from .adapter import OSSAAgentScopeAdapter


async def create_agent_from_manifest(manifest_path: str | Path) -> Any:
    """Create an AgentScope agent from an OSSA manifest file.

    This is a convenience wrapper around :class:`OSSAAgentScopeAdapter`.
    It loads the manifest, validates it, builds the model configuration,
    registers MCP tool servers, and returns a ready-to-use agent.

    Args:
        manifest_path: Path to an OSSA v0.4.6 YAML manifest file.

    Returns:
        A configured AgentScope agent instance (``ReActAgent``,
        ``UserAgent``, ``A2AAgent``, etc.).

    Raises:
        FileNotFoundError: If the manifest file does not exist.
        pydantic.ValidationError: If the manifest fails schema validation.
        ValueError: If required fields are missing or unsupported
            providers are specified.
        ImportError: If ``agentscope`` is not installed or the
            requested agent class is unavailable.

    Example::

        import asyncio
        from adapters.agentscope import create_agent_from_manifest

        async def main():
            agent = await create_agent_from_manifest("agents/my-agent.ossa.yaml")
            response = agent.reply({"role": "user", "content": "Hello!"})
            print(response)

        asyncio.run(main())
    """
    path = Path(manifest_path)
    if not path.exists():
        raise FileNotFoundError(f"Manifest not found: {path}")

    adapter = OSSAAgentScopeAdapter(path)
    return await adapter.build()
