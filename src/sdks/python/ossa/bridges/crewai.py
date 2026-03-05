"""Bridge OSSA manifests to CrewAI agent configurations."""

from __future__ import annotations

from typing import Any, Dict

from ..types import OSSAManifest
from ..exceptions import ConfigurationError


def to_crewai_config(manifest: OSSAManifest) -> Dict[str, Any]:
    """Convert OSSA manifest to CrewAI-compatible configuration.

    Returns a dict suitable for crewai.Agent() constructor.
    """
    if not manifest.is_agent():
        raise ConfigurationError("CrewAI bridge requires an Agent manifest")

    spec = manifest.spec or {}
    llm = spec.get("llm", {})

    provider = llm.get("provider", "anthropic")
    model = llm.get("model", "")
    llm_string = f"{provider}/{model}" if provider != "anthropic" else model

    tools_config = []
    for tool in spec.get("tools", []):
        tools_config.append({
            "name": tool.get("name", ""),
            "description": tool.get("description", ""),
        })

    return {
        "role": manifest.metadata.description or manifest.metadata.name,
        "goal": spec.get("role", ""),
        "backstory": spec.get("role", ""),
        "llm": llm_string,
        "tools": tools_config,
        "verbose": False,
        "allow_delegation": spec.get("autonomy", {}).get("level") != "supervised",
        "metadata": {
            "ossa_name": manifest.metadata.name,
            "ossa_version": manifest.metadata.version,
        },
    }
