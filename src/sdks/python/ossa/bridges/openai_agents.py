"""Bridge OSSA manifests to OpenAI Agents SDK configurations."""

from __future__ import annotations

from typing import Any, Dict, List

from ..types import OSSAManifest
from ..exceptions import ConfigurationError


def to_openai_agents_config(manifest: OSSAManifest) -> Dict[str, Any]:
    """Convert OSSA manifest to OpenAI Agents SDK configuration.

    Returns a dict suitable for openai.agents.Agent() constructor.
    """
    if not manifest.is_agent():
        raise ConfigurationError("OpenAI Agents bridge requires an Agent manifest")

    spec = manifest.spec or {}
    llm = spec.get("llm", {})
    model = llm.get("model", "gpt-4o")

    tools: List[Dict[str, Any]] = []
    for tool in spec.get("tools", []):
        tools.append({
            "type": "function",
            "function": {
                "name": tool.get("name", ""),
                "description": tool.get("description", ""),
                "parameters": tool.get("parameters", {"type": "object", "properties": {}}),
            },
        })

    guardrails = []
    safety = spec.get("safety", {})
    if safety.get("content_filtering", {}).get("enabled"):
        guardrails.append({"type": "content_filter"})
    if safety.get("prompt_injection", {}).get("enabled"):
        guardrails.append({"type": "input_guardrail"})

    return {
        "name": manifest.metadata.name,
        "instructions": spec.get("role", ""),
        "model": model,
        "tools": tools,
        "guardrails": guardrails,
        "metadata": {
            "ossa_version": manifest.apiVersion,
            "ossa_name": manifest.metadata.name,
        },
    }
