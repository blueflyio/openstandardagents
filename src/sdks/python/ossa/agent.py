"""Agent execution engine — run OSSA agents against LLM providers."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .exceptions import ConfigurationError, ExecutionError, ProviderError
from .types import OSSAManifest


@dataclass
class AgentResponse:
    """Response from an agent execution."""
    content: str
    duration_ms: float
    metadata: Dict[str, Any] = field(default_factory=dict)
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)


class Agent:
    """Execute an OSSA agent manifest against an LLM provider.

    Usage:
        manifest = load("agent.ossa.yaml")
        agent = Agent(manifest, api_key="sk-...")
        response = agent.run("What is 2+2?")
        print(response.content)
    """

    def __init__(
        self,
        manifest: OSSAManifest,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
    ) -> None:
        if not manifest.is_agent():
            raise ConfigurationError(f"Expected Agent manifest, got {manifest.kind.value}")

        self._manifest = manifest
        self._api_key = api_key
        self._base_url = base_url
        self._history: List[Dict[str, str]] = []
        self._request_count = 0

        spec = manifest.spec or {}
        self._role = spec.get("role", "")
        self._llm = spec.get("llm", {})
        self._provider_name = self._llm.get("provider", "")
        self._model = self._llm.get("model", "")
        self._temperature = self._llm.get("temperature")
        self._max_tokens = self._llm.get("maxTokens") or self._llm.get("max_tokens")

        self._adapter = self._create_adapter()

    def _create_adapter(self) -> Any:
        """Create the appropriate LLM adapter."""
        if self._provider_name == "anthropic":
            try:
                from .adapters.anthropic import AnthropicAdapter
                return AnthropicAdapter(
                    api_key=self._api_key,
                    model=self._model,
                    temperature=self._temperature,
                    max_tokens=self._max_tokens,
                    system=self._role,
                )
            except ImportError:
                raise ConfigurationError(
                    "Anthropic provider requires 'anthropic' package. "
                    "Install with: pip install ossa-sdk[anthropic]"
                )
        elif self._provider_name == "openai":
            try:
                from .adapters.openai import OpenAIAdapter
                return OpenAIAdapter(
                    api_key=self._api_key,
                    base_url=self._base_url,
                    model=self._model,
                    temperature=self._temperature,
                    max_tokens=self._max_tokens,
                    system=self._role,
                )
            except ImportError:
                raise ConfigurationError(
                    "OpenAI provider requires 'openai' package. "
                    "Install with: pip install ossa-sdk[openai]"
                )
        else:
            raise ConfigurationError(
                f"Unsupported provider: {self._provider_name}. "
                f"Supported: anthropic, openai"
            )

    def run(self, message: str) -> AgentResponse:
        """Send a message and get a response."""
        self._history.append({"role": "user", "content": message})

        start = time.perf_counter()
        try:
            result = self._adapter.chat(self._history)
        except Exception as e:
            raise ExecutionError(f"Provider error: {e}") from e
        duration_ms = (time.perf_counter() - start) * 1000

        self._history.append({"role": "assistant", "content": result})
        self._request_count += 1

        return AgentResponse(
            content=result,
            duration_ms=duration_ms,
            metadata={
                "provider": self._provider_name,
                "model": self._model,
                "agent_name": self._manifest.metadata.name,
            },
        )

    async def arun(self, message: str) -> AgentResponse:
        """Async version of run."""
        self._history.append({"role": "user", "content": message})

        start = time.perf_counter()
        try:
            result = await self._adapter.achat(self._history)
        except Exception as e:
            raise ExecutionError(f"Provider error: {e}") from e
        duration_ms = (time.perf_counter() - start) * 1000

        self._history.append({"role": "assistant", "content": result})
        self._request_count += 1

        return AgentResponse(
            content=result,
            duration_ms=duration_ms,
            metadata={
                "provider": self._provider_name,
                "model": self._model,
                "agent_name": self._manifest.metadata.name,
            },
        )

    def reset(self) -> None:
        """Clear conversation history."""
        self._history.clear()

    def get_request_count(self) -> int:
        return self._request_count

    @property
    def manifest(self) -> OSSAManifest:
        return self._manifest
