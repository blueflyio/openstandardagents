"""
LLM Adapters for OSSA Agents
All adapters implement BaseAdapter interface (SOLID: Interface Segregation)
"""

from .base import BaseAdapter, AdapterResponse
from .anthropic import AnthropicAdapter
from .openai import OpenAIAdapter

__all__ = [
    'BaseAdapter',
    'AdapterResponse',
    'AnthropicAdapter',
    'OpenAIAdapter',
]

def get_adapter(provider: str) -> BaseAdapter:
    """Factory function to get adapter by provider name"""
    provider_lower = provider.lower()
    
    if provider_lower == 'anthropic':
        return AnthropicAdapter()
    elif provider_lower == 'openai':
        return OpenAIAdapter()
    else:
        raise ValueError(f"Unsupported provider: {provider}. Supported: anthropic, openai")
