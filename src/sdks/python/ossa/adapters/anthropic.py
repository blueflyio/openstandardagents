"""
Anthropic Claude Adapter
"""

import asyncio
from typing import Optional, Dict, Any, AsyncIterator
import anthropic
from .base import BaseAdapter, AdapterResponse


class AnthropicAdapter(BaseAdapter):
    """Anthropic Claude adapter"""
    
    def __init__(self):
        self.client: Optional[anthropic.Anthropic] = None
        self.api_key: Optional[str] = None
        self.model: str = "claude-3-5-sonnet-20241022"
        self.tools: Dict[str, callable] = {}
    
    async def initialize(self, manifest: Dict[str, Any], api_key: Optional[str] = None) -> None:
        """Initialize Anthropic client"""
        self.api_key = api_key or manifest.get('api_key')
        if not self.api_key:
            raise ValueError("Anthropic API key required")
        
        self.client = anthropic.Anthropic(api_key=self.api_key)
        
        # Get model from manifest
        llm_config = manifest.get('spec', {}).get('llm', {})
        if llm_config:
            self.model = llm_config.get('model', self.model)
    
    async def chat(self, message: str, **kwargs: Any) -> AdapterResponse:
        """Send message to Claude"""
        if not self.client:
            raise RuntimeError("Adapter not initialized. Call initialize() first.")
        
        # Prepare messages
        messages = kwargs.get('messages', [{'role': 'user', 'content': message}])
        
        # Prepare tools if any
        tools = None
        if self.tools:
            tools = [
                {
                    'name': name,
                    'description': 'Tool handler',
                    'input_schema': {'type': 'object', 'properties': {}}
                }
                for name in self.tools.keys()
            ]
        
        # Call API
        response = self.client.messages.create(
            model=self.model,
            messages=messages,
            tools=tools,
            max_tokens=kwargs.get('max_tokens', 4096),
            temperature=kwargs.get('temperature', 0.7),
        )
        
        # Extract content
        content = ""
        if response.content:
            for block in response.content:
                if block.type == 'text':
                    content += block.text
        
        # Calculate usage
        usage = {
            'input_tokens': response.usage.input_tokens,
            'output_tokens': response.usage.output_tokens,
        }
        
        # Estimate cost (rough estimate)
        cost = None
        if response.usage:
            # Claude 3.5 Sonnet pricing (approximate)
            input_cost_per_1k = 0.003
            output_cost_per_1k = 0.015
            cost = (
                (response.usage.input_tokens / 1000) * input_cost_per_1k +
                (response.usage.output_tokens / 1000) * output_cost_per_1k
            )
        
        return AdapterResponse(
            content=content,
            usage=usage,
            cost=cost,
            metadata={'model': self.model, 'provider': 'anthropic'},
        )
    
    async def chat_stream(self, message: str, **kwargs: Any) -> AsyncIterator[str]:
        """Stream response from Claude"""
        if not self.client:
            raise RuntimeError("Adapter not initialized. Call initialize() first.")
        
        messages = kwargs.get('messages', [{'role': 'user', 'content': message}])
        
        with self.client.messages.stream(
            model=self.model,
            messages=messages,
            max_tokens=kwargs.get('max_tokens', 4096),
            temperature=kwargs.get('temperature', 0.7),
        ) as stream:
            for text in stream.text_stream:
                yield text
    
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
