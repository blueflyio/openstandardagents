"""Base adapter interface for LLM providers."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List


class BaseAdapter(ABC):
    """Abstract base for LLM provider adapters."""

    @abstractmethod
    def chat(self, messages: List[Dict[str, str]]) -> str:
        """Synchronous chat completion."""
        ...

    @abstractmethod
    async def achat(self, messages: List[Dict[str, str]]) -> str:
        """Async chat completion."""
        ...
