"""
OpenAI Adapter
"""

import asyncio
from typing import Optional, Dict, Any, AsyncIterator
import openai
from .base import BaseAdapter, AdapterResponse


class OpenAIAdapter(BaseAdapter):
    """OpenAI adapter"""
    
    def __init__(self):
        self.client: Optional[openai.OpenAI] = None
        self.api_key: Optional[str] = None
        self.model: str = "gpt-4"
        self.tools: Dict[str, callable] = {}
    
    async def initialize(self, manifest: Dict[str, Any], api_key: Optional[str] = None) -> None:
        """Initialize OpenAI client"""
        self.api_key = api_key or manifest.get('api_key')
        if not self.api_key:
            raise ValueError("OpenAI API key required")
        
        self.client = openai.OpenAI(api_key=self.api_key)
        
        # Get model from manifest
        llm_config = manifest.get('spec', {}).get('llm', {})
        if llm_config:
            self.model = llm_config.get('model', self.model)
    
    async def chat(self, message: str, **kwargs: Any) -> AdapterResponse:
        """Send message to OpenAI"""
        if not self.client:
            raise RuntimeError("Adapter not initialized. Call initialize() first.")
        
        messages = kwargs.get('messages', [{'role': 'user', 'content': message}])
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=kwargs.get('max_tokens', 4096),
            temperature=kwargs.get('temperature', 0.7),
        )
        
        content = response.choices[0].message.content or ""
        
        usage = {
            'prompt_tokens': response.usage.prompt_tokens,
            'completion_tokens': response.usage.completion_tokens,
            'total_tokens': response.usage.total_tokens,
        }
        
        # Estimate cost (rough estimate)
        cost = None
        if response.usage:
            # GPT-4 pricing (approximate)
            input_cost_per_1k = 0.03
            output_cost_per_1k = 0.06
            cost = (
                (response.usage.prompt_tokens / 1000) * input_cost_per_1k +
                (response.usage.completion_tokens / 1000) * output_cost_per_1k
            )
        
        return AdapterResponse(
            content=content,
            usage=usage,
            cost=cost,
            metadata={'model': self.model, 'provider': 'openai'},
        )
    
    async def chat_stream(self, message: str, **kwargs: Any) -> AsyncIterator[str]:
        """Stream response from OpenAI"""
        if not self.client:
            raise RuntimeError("Adapter not initialized. Call initialize() first.")
        
        messages = kwargs.get('messages', [{'role': 'user', 'content': message}])
        
        stream = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=kwargs.get('max_tokens', 4096),
            temperature=kwargs.get('temperature', 0.7),
            stream=True,
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    
    def register_tool_handler(self, name: str, handler: callable) -> None:
        """Register tool handler"""
        self.tools[name] = handler
    
    async def call_tool(self, tool_name: str, tool_input: Dict[str, Any]) -> Any:
        """Call a registered tool"""
        if tool_name not in self.tools:
            raise ValueError(f"Tool {tool_name} not registered")
        
        handler = self.tools[tool_name]
        if callable(handler):
            if asyncio.iscoroutinefunction(handler):
                return await handler(**tool_input)
            else:
                return handler(**tool_input)
        else:
            raise ValueError(f"Tool handler for {tool_name} is not callable")
