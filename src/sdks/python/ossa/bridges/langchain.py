"""Bridge OSSA manifests to LangChain agent configurations."""

from __future__ import annotations

from typing import Any, Dict, Optional

from ..types import OSSAManifest
from ..exceptions import ConfigurationError


def to_langchain_config(manifest: OSSAManifest) -> Dict[str, Any]:
    """Convert OSSA manifest to LangChain-compatible configuration.

    Returns a dict with: llm_class, llm_kwargs, system_message, tools, agent_type
    """
    if not manifest.is_agent():
        raise ConfigurationError("LangChain bridge requires an Agent manifest")

    spec = manifest.spec or {}
    llm = spec.get("llm", {})
    provider = llm.get("provider", "")

    provider_map = {
        "anthropic": "ChatAnthropic",
        "openai": "ChatOpenAI",
        "azure": "AzureChatOpenAI",
        "google": "ChatGoogleGenerativeAI",
        "bedrock": "ChatBedrock",
        "groq": "ChatGroq",
        "ollama": "ChatOllama",
    }

    llm_class = provider_map.get(provider, "ChatOpenAI")
    llm_kwargs: Dict[str, Any] = {"model": llm.get("model", "")}
    if llm.get("temperature") is not None:
        llm_kwargs["temperature"] = llm["temperature"]
    if llm.get("maxTokens") or llm.get("max_tokens"):
        llm_kwargs["max_tokens"] = llm.get("maxTokens") or llm.get("max_tokens")

    tools_config = []
    for tool in spec.get("tools", []):
        tools_config.append({
            "name": tool.get("name", ""),
            "description": tool.get("description", ""),
            "type": tool.get("type", "function"),
        })

    return {
        "llm_class": llm_class,
        "llm_kwargs": llm_kwargs,
        "system_message": spec.get("role", ""),
        "tools": tools_config,
        "agent_type": "react" if tools_config else "conversational",
        "metadata": {
            "ossa_name": manifest.metadata.name,
            "ossa_version": manifest.metadata.version,
        },
    }
