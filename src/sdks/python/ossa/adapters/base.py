"""
Base LLM Adapter Interface (SOLID: Interface Segregation)
All adapters must implement this interface
"""

from abc import ABC, abstractmethod
from typing import AsyncIterator, Optional, Dict, Any, List
from dataclasses import dataclass


@dataclass
class AdapterResponse:
    """Response from LLM adapter"""
    content: str
    usage: Optional[Dict[str, int]] = None
    cost: Optional[float] = None
    metadata: Dict[str, Any] = None


class BaseAdapter(ABC):
    """Base interface for all LLM adapters (SOLID: Interface Segregation)"""
    
    @abstractmethod
    async def initialize(self, manifest: Dict[str, Any], api_key: Optional[str] = None) -> None:
        """Initialize adapter with manifest and API key"""
        pass
    
    @abstractmethod
    async def chat(self, message: str, **kwargs: Any) -> AdapterResponse:
        """Send message and get response"""
        pass
    
    @abstractmethod
    async def chat_stream(self, message: str, **kwargs: Any) -> AsyncIterator[str]:
        """Stream response"""
        pass
    
    @abstractmethod
    def register_tool_handler(self, name: str, handler: callable) -> None:
        """Register tool handler"""
        pass
    
    @abstractmethod
    async def call_tool(self, tool_name: str, tool_input: Dict[str, Any]) -> Any:
        """Call a registered tool"""
        pass
