"""Anthropic Claude adapter."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from .base import BaseAdapter


class AnthropicAdapter(BaseAdapter):
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "claude-sonnet-4-20250514",
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system: str = "",
    ) -> None:
        import anthropic
        self._client = anthropic.Anthropic(api_key=api_key)
        self._async_client = anthropic.AsyncAnthropic(api_key=api_key)
        self._model = model
        self._temperature = temperature
        self._max_tokens = max_tokens or 4096
        self._system = system

    def chat(self, messages: List[Dict[str, str]]) -> str:
        response = self._client.messages.create(
            model=self._model,
            max_tokens=self._max_tokens,
            system=self._system,
            messages=messages,
            **({"temperature": self._temperature} if self._temperature is not None else {}),
        )
        return response.content[0].text

    async def achat(self, messages: List[Dict[str, str]]) -> str:
        response = await self._async_client.messages.create(
            model=self._model,
            max_tokens=self._max_tokens,
            system=self._system,
            messages=messages,
            **({"temperature": self._temperature} if self._temperature is not None else {}),
        )
        return response.content[0].text
