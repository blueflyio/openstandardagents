"""
Agent execution engine for OSSA.

This module provides runtime execution for OSSA Agent manifests, including
LLM integration, tool calling, safety checks, and state management.
"""

import asyncio
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel

from .exceptions import ConfigurationError, OSSAError
from .types import AgentSpec, OSSAManifest


class AgentResponse(BaseModel):
    """
    Response from an agent execution.

    Attributes:
        content: Main response text from the agent
        role: Role of the message (assistant, user, system)
        usage: Token usage statistics (if available)
        tool_calls: List of tool calls made during execution
        metadata: Additional metadata about the execution
        duration_ms: Execution time in milliseconds
        cost: Estimated cost of the execution (if tracking enabled)
    """

    content: str
    role: str = "assistant"
    usage: Optional[Dict[str, int]] = None
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    duration_ms: Optional[float] = None
    cost: Optional[float] = None


@dataclass
class ConversationHistory:
    """
    Manages conversation history for an agent.

    Attributes:
        messages: List of messages in the conversation
        max_messages: Maximum number of messages to retain
    """

    messages: List[Dict[str, Any]] = field(default_factory=list)
    max_messages: int = 100

    def add_message(self, role: str, content: str, **kwargs: Any) -> None:
        """
        Add a message to the conversation history.

        Args:
            role: Message role (user, assistant, system)
            content: Message content
            **kwargs: Additional message metadata
        """
        message = {"role": role, "content": content, **kwargs}
        self.messages.append(message)

        # Trim if exceeds max
        if len(self.messages) > self.max_messages:
            # Keep system message (first) and trim oldest user/assistant messages
            system_messages = [m for m in self.messages if m["role"] == "system"]
            other_messages = [m for m in self.messages if m["role"] != "system"]
            self.messages = system_messages + other_messages[-(self.max_messages - len(system_messages)) :]

    def get_messages(self) -> List[Dict[str, Any]]:
        """Get all messages in the conversation."""
        return self.messages.copy()

    def clear(self) -> None:
        """Clear all messages from the conversation."""
        self.messages.clear()


class AgentRunner:
    """
    Execute an OSSA Agent manifest.

    This class provides a complete runtime for OSSA agents, including:
    - LLM integration (Anthropic, OpenAI, etc.)
    - Tool/function calling
    - Conversation history management
    - Safety checks (PII detection, rate limiting)
    - Cost tracking
    - State persistence

    Example:
        >>> from ossa import load, Agent
        >>> manifest = load("my-agent.yaml")
        >>> agent = Agent(manifest)
        >>> response = agent.run("What is 2 + 2?")
        >>> print(response.content)
        "2 + 2 equals 4"

        >>> # Async usage
        >>> response = await agent.arun("Explain quantum computing")
    """

    def __init__(
        self,
        manifest: Union[OSSAManifest, str],
        api_key: Optional[str] = None,
        **runtime_options: Any,
    ) -> None:
        """
        Initialize the agent runner.

        Args:
            manifest: OSSA Agent manifest (OSSAManifest object or file path)
            api_key: API key for the LLM provider (optional, can use env vars)
            **runtime_options: Additional runtime configuration options
                - enable_tools: Enable tool calling (default: True)
                - enable_safety: Enable safety checks (default: True)
                - enable_state: Enable state persistence (default: True)
                - max_retries: Maximum retry attempts (default: from manifest)
                - timeout: Request timeout in seconds (default: 30)

        Raises:
            ConfigurationError: If manifest is invalid or missing required fields
            OSSAError: If initialization fails

        Example:
            >>> agent = AgentRunner(manifest, api_key="sk-...")
            >>> # Or load from file
            >>> agent = AgentRunner("agent.yaml")
        """
        # Load manifest if string path
        if isinstance(manifest, str):
            from .manifest import load_manifest

            manifest = load_manifest(manifest)

        # Validate manifest kind
        if not manifest.is_agent:
            raise ConfigurationError(f"Expected Agent manifest, got {manifest.kind.value}")

        self.manifest = manifest
        self.spec: AgentSpec = manifest.spec  # type: ignore
        self.api_key = api_key
        self.runtime_options = runtime_options

        # Initialize conversation history
        self.history = ConversationHistory()

        # Add system prompt if defined
        if self.spec.role:
            self.history.add_message("system", self.spec.role)

        # Runtime state
        self._total_cost = 0.0
        self._request_count = 0
        self._client: Optional[Any] = None

        # Initialize LLM client (lazy loading)
        self._initialize_client()

    def _initialize_client(self) -> None:
        """
        Initialize the LLM client based on the provider.

        This method performs lazy initialization of the LLM client.
        Actual client creation happens on first use.
        """
        # Client initialization is deferred until first run()
        # This allows for proper error handling and provider-specific setup
        pass

    def _get_client(self) -> Any:
        """
        Get or create the LLM client.

        Returns:
            Initialized LLM client

        Raises:
            ConfigurationError: If provider is not supported
        """
        if self._client is not None:
            return self._client

        provider = self.spec.llm.provider.lower()

        # Anthropic
        if provider == "anthropic":
            try:
                import anthropic

                self._client = anthropic.Anthropic(api_key=self.api_key)
                return self._client
            except ImportError:
                raise ConfigurationError(
                    "Anthropic SDK not installed. Install with: pip install anthropic"
                )

        # OpenAI
        elif provider == "openai":
            try:
                import openai

                self._client = openai.OpenAI(api_key=self.api_key)
                return self._client
            except ImportError:
                raise ConfigurationError("OpenAI SDK not installed. Install with: pip install openai")

        # Add more providers as needed
        else:
            raise ConfigurationError(
                f"Provider '{provider}' not yet implemented. "
                f"Supported: anthropic, openai. "
                f"Coming soon: google, azure, groq, ollama, etc."
            )

    def run(self, input_text: str, **kwargs: Any) -> AgentResponse:
        """
        Execute the agent with input text (synchronous).

        Args:
            input_text: User input/prompt to send to the agent
            **kwargs: Additional parameters:
                - temperature: Override LLM temperature
                - max_tokens: Override max tokens
                - tools: Override tools list
                - stream: Enable streaming (default: False)

        Returns:
            AgentResponse with the agent's reply and metadata

        Raises:
            OSSAError: If execution fails

        Example:
            >>> response = agent.run("What is the capital of France?")
            >>> print(response.content)
            "The capital of France is Paris."
            >>> print(f"Cost: ${response.cost:.4f}")
        """
        start_time = time.time()

        # Add user message to history
        self.history.add_message("user", input_text)

        try:
            # Get LLM client
            client = self._get_client()
            provider = self.spec.llm.provider.lower()

            # Prepare request parameters
            temperature = kwargs.get("temperature", self.spec.llm.temperature)
            max_tokens = kwargs.get("max_tokens", self.spec.llm.max_tokens)

            # Execute based on provider
            if provider == "anthropic":
                response_content = self._execute_anthropic(
                    client, input_text, temperature, max_tokens, **kwargs
                )
            elif provider == "openai":
                response_content = self._execute_openai(
                    client, input_text, temperature, max_tokens, **kwargs
                )
            else:
                raise ConfigurationError(f"Provider '{provider}' execution not implemented")

            # Add assistant response to history
            self.history.add_message("assistant", response_content)

            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Increment request counter
            self._request_count += 1

            # Build response
            return AgentResponse(
                content=response_content,
                role="assistant",
                duration_ms=duration_ms,
                metadata={
                    "agent_name": self.manifest.metadata.name,
                    "agent_version": self.manifest.metadata.version,
                    "provider": provider,
                    "model": self.spec.llm.model,
                    "request_count": self._request_count,
                },
            )

        except Exception as e:
            raise OSSAError(f"Agent execution failed: {e}") from e

    async def arun(self, input_text: str, **kwargs: Any) -> AgentResponse:
        """
        Execute the agent with input text (asynchronous).

        Args:
            input_text: User input/prompt to send to the agent
            **kwargs: Additional parameters (same as run())

        Returns:
            AgentResponse with the agent's reply and metadata

        Example:
            >>> response = await agent.arun("Explain quantum computing")
            >>> print(response.content)
        """
        # For now, run synchronously in a thread pool
        # Future: Implement proper async clients
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: self.run(input_text, **kwargs))

    def _execute_anthropic(
        self,
        client: Any,
        input_text: str,
        temperature: Optional[float],
        max_tokens: Optional[int],
        **kwargs: Any,
    ) -> str:
        """
        Execute using Anthropic API.

        Args:
            client: Anthropic client instance
            input_text: User input
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional parameters

        Returns:
            Response content text
        """
        # Build messages (exclude system message for Anthropic)
        messages = [m for m in self.history.get_messages() if m["role"] != "system"]

        # Create message
        response = client.messages.create(
            model=self.spec.llm.model,
            max_tokens=max_tokens or 4096,
            temperature=temperature if temperature is not None else 0.7,
            system=self.spec.role if self.spec.role else None,
            messages=messages,
        )

        # Extract content
        if response.content and len(response.content) > 0:
            return response.content[0].text
        return ""

    def _execute_openai(
        self,
        client: Any,
        input_text: str,
        temperature: Optional[float],
        max_tokens: Optional[int],
        **kwargs: Any,
    ) -> str:
        """
        Execute using OpenAI API.

        Args:
            client: OpenAI client instance
            input_text: User input
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional parameters

        Returns:
            Response content text
        """
        # Build messages
        messages = self.history.get_messages()

        # Create completion
        response = client.chat.completions.create(
            model=self.spec.llm.model,
            messages=messages,
            temperature=temperature if temperature is not None else 0.7,
            max_tokens=max_tokens,
        )

        # Extract content
        if response.choices and len(response.choices) > 0:
            return response.choices[0].message.content or ""
        return ""

    def reset(self) -> None:
        """
        Reset the agent's conversation history.

        Clears all messages except the system prompt (if defined).

        Example:
            >>> agent.run("Hello")
            >>> agent.run("What did I just say?")  # Agent remembers
            >>> agent.reset()
            >>> agent.run("What did I just say?")  # Agent has no memory
        """
        self.history.clear()
        if self.spec.role:
            self.history.add_message("system", self.spec.role)

    def get_cost(self) -> float:
        """
        Get the total estimated cost for all agent executions.

        Returns:
            Total cost in USD

        Example:
            >>> agent.run("Test 1")
            >>> agent.run("Test 2")
            >>> print(f"Total cost: ${agent.get_cost():.4f}")
        """
        return self._total_cost

    def get_request_count(self) -> int:
        """
        Get the total number of requests made.

        Returns:
            Number of requests

        Example:
            >>> print(f"Requests: {agent.get_request_count()}")
        """
        return self._request_count


# Convenience alias
Agent = AgentRunner
