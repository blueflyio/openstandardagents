"""OpenAI adapter (also works for Azure, local, compatible APIs)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from .base import BaseAdapter


class OpenAIAdapter(BaseAdapter):
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: str = "gpt-4o",
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system: str = "",
    ) -> None:
        import openai
        kwargs: Dict[str, Any] = {}
        if api_key:
            kwargs["api_key"] = api_key
        if base_url:
            kwargs["base_url"] = base_url
        self._client = openai.OpenAI(**kwargs)
        self._async_client = openai.AsyncOpenAI(**kwargs)
        self._model = model
        self._temperature = temperature
        self._max_tokens = max_tokens or 4096
        self._system = system

    def _build_messages(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        msgs = []
        if self._system:
            msgs.append({"role": "system", "content": self._system})
        msgs.extend(messages)
        return msgs

    def chat(self, messages: List[Dict[str, str]]) -> str:
        response = self._client.chat.completions.create(
            model=self._model,
            messages=self._build_messages(messages),
            max_tokens=self._max_tokens,
            **({"temperature": self._temperature} if self._temperature is not None else {}),
        )
        return response.choices[0].message.content or ""

    async def achat(self, messages: List[Dict[str, str]]) -> str:
        response = await self._async_client.chat.completions.create(
            model=self._model,
            messages=self._build_messages(messages),
            max_tokens=self._max_tokens,
            **({"temperature": self._temperature} if self._temperature is not None else {}),
        )
        return response.choices[0].message.content or ""
