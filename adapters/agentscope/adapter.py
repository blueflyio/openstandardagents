"""Main adapter: reads an OSSA v0.4.6 YAML manifest and creates an AgentScope agent."""

from __future__ import annotations

import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Type

import yaml

from .models import (
    A2AExtension,
    AgentScopeAgentClass,
    AgentScopeExtension,
    CompressionConfig,
    MemoryBackend,
    OSSALLMConfig,
    OSSAManifest,
    OSSASafety,
    OSSASecurity,
    OSSATool,
    SecurityTier,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Provider -> AgentScope model-wrapper class mapping
# ---------------------------------------------------------------------------

_PROVIDER_MODEL_CLASS: Dict[str, str] = {
    "anthropic": "AnthropicChatWrapper",
    "openai": "OpenAIChatWrapper",
    "gemini": "GeminiChatWrapper",
    "litellm": "LiteLLMChatWrapper",
    "ollama": "OllamaChatWrapper",
    "dashscope": "DashScopeChatWrapper",
    "zhipuai": "ZhipuAIChatWrapper",
    "yi": "YiChatWrapper",
}

_PROVIDER_FORMATTER: Dict[str, str] = {
    "anthropic": "AnthropicFormatter",
    "openai": "OpenAIFormatter",
    "gemini": "GeminiFormatter",
}

# ---------------------------------------------------------------------------
# Sandboxing levels by OSSA security tier
# ---------------------------------------------------------------------------

_TIER_SANDBOX: Dict[SecurityTier, Dict[str, Any]] = {
    SecurityTier.OPEN: {"sandbox": False},
    SecurityTier.STANDARD: {"sandbox": True, "timeout": 120},
    SecurityTier.STRICT: {"sandbox": True, "timeout": 60, "network": False},
    SecurityTier.ISOLATED: {
        "sandbox": True,
        "timeout": 30,
        "network": False,
        "filesystem": False,
    },
}


def _resolve_env(value: str) -> str:
    """Resolve ``${VAR:-default}`` patterns from environment."""
    pattern = re.compile(r"\$\{([^}]+)\}")

    def _replace(match: re.Match[str]) -> str:
        expr = match.group(1)
        if ":-" in expr:
            var, default = expr.split(":-", 1)
            return os.environ.get(var, default)
        return os.environ.get(expr, match.group(0))

    return pattern.sub(_replace, value)


class OSSAAgentScopeAdapter:
    """Reads an OSSA v0.4.6 manifest and instantiates a configured AgentScope agent.

    Usage::

        adapter = OSSAAgentScopeAdapter("path/to/manifest.ossa.yaml")
        agent = await adapter.build()
    """

    def __init__(self, manifest_path: str | Path) -> None:
        self._path = Path(manifest_path)
        self._manifest: Optional[OSSAManifest] = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def load(self) -> OSSAManifest:
        """Load and validate the OSSA manifest from YAML."""
        raw_text = self._path.read_text(encoding="utf-8")
        resolved = _resolve_env(raw_text)
        data = yaml.safe_load(resolved)
        manifest = OSSAManifest.model_validate(data)
        self._manifest = manifest
        logger.info(
            "Loaded OSSA manifest: %s v%s",
            manifest.metadata.name,
            manifest.metadata.version,
        )
        return manifest

    async def build(self) -> Any:
        """Build and return a fully-configured AgentScope agent.

        Returns:
            An instance of the appropriate AgentScope agent class
            (``ReActAgent``, ``UserAgent``, etc.), optionally wrapped
            by ``A2AAgent`` if the A2A protocol extension is enabled.
        """
        if self._manifest is None:
            self.load()
        assert self._manifest is not None

        ext = self._agentscope_extension
        agent_cls = self._resolve_agent_class(ext.agent_class)
        model_config = self._build_model_config()
        sys_prompt = self._manifest.spec.role or ""
        memory = self._build_memory(ext.memory_backend)
        toolkit = await self._build_toolkit()
        sandbox_cfg = self._build_sandbox()

        # Assemble constructor kwargs based on agent class
        kwargs: Dict[str, Any] = {
            "name": self._manifest.metadata.name,
            "sys_prompt": sys_prompt,
            "model_config_name": model_config["config_name"],
            "verbose": ext.extra_kwargs.get("verbose", True),
        }

        # ReActAgent-specific
        if ext.agent_class == AgentScopeAgentClass.REACT:
            kwargs["max_iters"] = ext.max_iters
            if toolkit is not None:
                kwargs["service_toolkit"] = toolkit

        # Memory
        if memory is not None:
            kwargs["memory"] = memory

        # Merge any extra kwargs from the manifest extension
        kwargs.update(ext.extra_kwargs)

        # Register model config with AgentScope before creating agent
        self._register_model_config(model_config)

        agent = agent_cls(**kwargs)

        # Apply sandbox configuration
        if sandbox_cfg:
            self._apply_sandbox(agent, sandbox_cfg)

        # Apply safety guardrails as agent metadata
        self._apply_safety(agent)

        # Wrap with A2A if protocol extension present
        agent = await self._maybe_wrap_a2a(agent)

        logger.info(
            "Built AgentScope %s agent '%s' with model %s/%s",
            ext.agent_class.value,
            self._manifest.metadata.name,
            self._manifest.spec.llm.provider if self._manifest.spec.llm else "none",
            self._manifest.spec.llm.model if self._manifest.spec.llm else "none",
        )
        return agent

    # ------------------------------------------------------------------
    # Internal: AgentScope extension resolution
    # ------------------------------------------------------------------

    @property
    def _agentscope_extension(self) -> AgentScopeExtension:
        """Return the agentscope extension, or defaults if absent."""
        if self._manifest and self._manifest.extensions and self._manifest.extensions.agentscope:
            return self._manifest.extensions.agentscope
        return AgentScopeExtension()

    # ------------------------------------------------------------------
    # Internal: Agent class resolution
    # ------------------------------------------------------------------

    @staticmethod
    def _resolve_agent_class(agent_class: AgentScopeAgentClass) -> Type[Any]:
        """Dynamically import the requested AgentScope agent class."""
        import agentscope.agents as agents_mod

        class_map = {
            AgentScopeAgentClass.REACT: "ReActAgent",
            AgentScopeAgentClass.USER: "UserAgent",
            # A2AAgent and RealtimeAgent may be in sub-packages
            AgentScopeAgentClass.A2A: "ReActAgent",  # base; wrapped later
            AgentScopeAgentClass.REALTIME: "ReActAgent",  # base; extended
            AgentScopeAgentClass.CUSTOM: "ReActAgent",  # base; customized
        }

        cls_name = class_map[agent_class]
        cls = getattr(agents_mod, cls_name, None)
        if cls is None:
            raise ImportError(
                f"AgentScope does not expose '{cls_name}'. "
                f"Installed version may be too old. "
                f"pip install --upgrade agentscope"
            )
        return cls

    # ------------------------------------------------------------------
    # Internal: Model config
    # ------------------------------------------------------------------

    def _build_model_config(self) -> Dict[str, Any]:
        """Map OSSA spec.llm to an AgentScope model configuration dict."""
        assert self._manifest is not None
        llm: Optional[OSSALLMConfig] = self._manifest.spec.llm
        if llm is None:
            raise ValueError("spec.llm is required to build an AgentScope agent")

        provider = llm.provider.lower()
        wrapper_cls = _PROVIDER_MODEL_CLASS.get(provider)
        if wrapper_cls is None:
            raise ValueError(
                f"Unsupported LLM provider '{provider}'. "
                f"Supported: {sorted(_PROVIDER_MODEL_CLASS.keys())}"
            )

        config_name = f"ossa_{self._manifest.metadata.name}_{provider}"
        config: Dict[str, Any] = {
            "config_name": config_name,
            "model_type": wrapper_cls,
            "model_name": llm.model,
            "temperature": llm.temperature,
            "max_tokens": llm.resolved_max_tokens,
        }

        if llm.resolved_top_p is not None:
            config["top_p"] = llm.resolved_top_p

        # Provider-specific API key env var conventions
        api_key_envs = {
            "anthropic": "ANTHROPIC_API_KEY",
            "openai": "OPENAI_API_KEY",
            "gemini": "GOOGLE_API_KEY",
        }
        env_var = api_key_envs.get(provider)
        if env_var:
            api_key = os.environ.get(env_var)
            if api_key:
                config["api_key"] = api_key

        # Formatter class for structured tool calling
        formatter = _PROVIDER_FORMATTER.get(provider)
        if formatter:
            config["formatter_class"] = formatter

        return config

    @staticmethod
    def _register_model_config(config: Dict[str, Any]) -> None:
        """Register the model configuration with AgentScope's global registry."""
        import agentscope

        agentscope.init(
            model_configs=[config],
            project=config["config_name"],
        )

    # ------------------------------------------------------------------
    # Internal: Memory
    # ------------------------------------------------------------------

    @staticmethod
    def _build_memory(backend: MemoryBackend) -> Any:
        """Instantiate the requested AgentScope memory backend."""
        if backend == MemoryBackend.IN_MEMORY:
            # Default — AgentScope creates it automatically if None
            return None

        if backend == MemoryBackend.REDIS:
            try:
                from agentscope.memory import RedisMemory

                return RedisMemory(
                    url=os.environ.get("REDIS_URL", "redis://localhost:6379"),
                )
            except ImportError:
                logger.warning(
                    "RedisMemory not available; falling back to in_memory"
                )
                return None

        if backend == MemoryBackend.SQLALCHEMY:
            try:
                from agentscope.memory import AsyncSQLAlchemyMemory

                return AsyncSQLAlchemyMemory(
                    uri=os.environ.get(
                        "SQLALCHEMY_DATABASE_URI",
                        "sqlite+aiosqlite:///agentscope_memory.db",
                    ),
                )
            except ImportError:
                logger.warning(
                    "AsyncSQLAlchemyMemory not available; falling back to in_memory"
                )
                return None

        if backend == MemoryBackend.MEM0:
            try:
                from agentscope.memory import Mem0LongTermMemory

                return Mem0LongTermMemory()
            except ImportError:
                logger.warning(
                    "Mem0LongTermMemory not available; falling back to in_memory"
                )
                return None

        if backend in (
            MemoryBackend.REME_PERSONAL,
            MemoryBackend.REME_TASK,
            MemoryBackend.REME_TOOL,
        ):
            logger.info(
                "REME memory backend '%s' requested — not yet implemented; "
                "falling back to in_memory",
                backend.value,
            )
            return None

        return None

    # ------------------------------------------------------------------
    # Internal: Tool / MCP toolkit
    # ------------------------------------------------------------------

    async def _build_toolkit(self) -> Any:
        """Build an AgentScope ServiceToolkit from OSSA spec.tools.

        MCP tools (type: mcp) with HTTP endpoints are registered via
        AgentScope's ``HttpStatelessClient``.  Other tool types are
        recorded as metadata but not directly wired.
        """
        assert self._manifest is not None
        tools = self._manifest.spec.tools
        if not tools:
            return None

        mcp_tools = [t for t in tools if t.type == "mcp"]
        if not mcp_tools:
            return None

        try:
            from agentscope.service import ServiceToolkit
        except ImportError:
            logger.warning("ServiceToolkit not available in agentscope")
            return None

        toolkit = ServiceToolkit()

        for tool in mcp_tools:
            await self._register_mcp_tool(toolkit, tool)

        return toolkit

    async def _register_mcp_tool(
        self,
        toolkit: Any,
        tool: OSSATool,
    ) -> None:
        """Register a single MCP tool server with the ServiceToolkit.

        For HTTP-transport MCP servers, we use AgentScope's
        ``HttpStatelessClient`` to connect.  For stdio-transport
        servers we log a warning (requires process management).
        """
        transport_protocol = "http"
        if tool.transport:
            transport_protocol = tool.transport.protocol

        if transport_protocol == "stdio":
            logger.info(
                "MCP tool '%s' uses stdio transport — "
                "registering capabilities as function stubs. "
                "Full stdio MCP requires a process manager.",
                tool.name,
            )
            self._register_stdio_tool_stubs(toolkit, tool)
            return

        if transport_protocol in ("http", "https", "sse"):
            endpoint = tool.endpoint
            if not endpoint:
                logger.warning(
                    "MCP tool '%s' has no endpoint; skipping", tool.name
                )
                return

            try:
                from agentscope.service.mcp import HttpStatelessClient

                client = HttpStatelessClient(url=endpoint)
                await client.connect()
                toolkit.add(client)
                logger.info(
                    "Registered MCP tool '%s' via HttpStatelessClient at %s",
                    tool.name,
                    endpoint,
                )
            except ImportError:
                logger.warning(
                    "agentscope.service.mcp.HttpStatelessClient not available. "
                    "Install agentscope[mcp] for MCP support."
                )
            except Exception:
                logger.exception(
                    "Failed to connect MCP tool '%s' at %s",
                    tool.name,
                    endpoint,
                )

    @staticmethod
    def _register_stdio_tool_stubs(toolkit: Any, tool: OSSATool) -> None:
        """Register lightweight function stubs for stdio MCP capabilities.

        These stubs raise ``NotImplementedError`` at call time but allow
        the agent to *see* the tool descriptions during planning.
        """
        for cap in tool.capabilities:

            def _make_stub(cap_name: str, cap_desc: str | None) -> Any:
                def stub(**kwargs: Any) -> Any:
                    raise NotImplementedError(
                        f"MCP stdio tool '{cap_name}' requires a running "
                        f"MCP server process. Start the server and use "
                        f"HttpStatelessClient instead."
                    )

                stub.__name__ = cap_name
                stub.__doc__ = cap_desc or f"MCP tool: {cap_name}"
                return stub

            fn = _make_stub(cap.name, cap.description)
            try:
                toolkit.add(fn)
            except Exception:
                logger.debug("Could not register stub for %s", cap.name)

    # ------------------------------------------------------------------
    # Internal: Sandbox / security tier
    # ------------------------------------------------------------------

    def _build_sandbox(self) -> Dict[str, Any]:
        """Derive sandbox configuration from OSSA security tier."""
        assert self._manifest is not None
        tier = SecurityTier.STANDARD
        if self._manifest.spec.security and self._manifest.spec.security.tier:
            tier = self._manifest.spec.security.tier
        return _TIER_SANDBOX.get(tier, {})

    @staticmethod
    def _apply_sandbox(agent: Any, cfg: Dict[str, Any]) -> None:
        """Apply sandbox settings to the agent if the agent supports it."""
        if hasattr(agent, "sandbox_config"):
            agent.sandbox_config = cfg
        elif hasattr(agent, "metadata"):
            if not isinstance(agent.metadata, dict):
                agent.metadata = {}
            agent.metadata["sandbox"] = cfg

    # ------------------------------------------------------------------
    # Internal: Safety guardrails
    # ------------------------------------------------------------------

    def _apply_safety(self, agent: Any) -> None:
        """Attach OSSA safety guardrails as agent metadata."""
        assert self._manifest is not None
        safety: Optional[OSSASafety] = self._manifest.spec.safety
        if safety is None:
            return

        guardrails_meta: Dict[str, Any] = {}

        if safety.guardrails:
            gr = safety.guardrails
            if gr.max_tool_calls is not None:
                guardrails_meta["max_tool_calls"] = gr.max_tool_calls
            if gr.max_execution_time_seconds is not None:
                guardrails_meta["max_execution_time_seconds"] = (
                    gr.max_execution_time_seconds
                )
            if gr.secrets_detection:
                guardrails_meta["secrets_detection"] = gr.secrets_detection
            if gr.pii_detection:
                guardrails_meta["pii_detection"] = gr.pii_detection
            if gr.prompt_injection:
                guardrails_meta["prompt_injection"] = gr.prompt_injection

        if guardrails_meta:
            if hasattr(agent, "metadata") and isinstance(agent.metadata, dict):
                agent.metadata["guardrails"] = guardrails_meta
            else:
                try:
                    agent.metadata = {"guardrails": guardrails_meta}
                except AttributeError:
                    logger.debug(
                        "Agent does not support metadata; guardrails not applied"
                    )

    # ------------------------------------------------------------------
    # Internal: A2A wrapping
    # ------------------------------------------------------------------

    async def _maybe_wrap_a2a(self, agent: Any) -> Any:
        """If the A2A extension is enabled and has an endpoint, wrap the
        agent with AgentScope's A2A interop layer."""
        assert self._manifest is not None

        a2a_ext: Optional[A2AExtension] = None

        # Check extensions.a2a
        if self._manifest.extensions and self._manifest.extensions.a2a:
            a2a_ext = self._manifest.extensions.a2a

        # Check protocols.a2a
        if a2a_ext is None and self._manifest.protocols and self._manifest.protocols.a2a:
            a2a_ext = self._manifest.protocols.a2a

        if a2a_ext is None or not a2a_ext.enabled:
            return agent

        agent_card = a2a_ext.agent_card
        if agent_card is None or not agent_card.url:
            logger.info(
                "A2A enabled but no agent_card.url — skipping A2A wrapping"
            )
            return agent

        try:
            from agentscope.agents import A2AAgent

            wrapped = A2AAgent(
                agent=agent,
                agent_card=self._build_a2a_card(agent_card),
            )
            logger.info(
                "Wrapped agent '%s' with A2AAgent at %s",
                self._manifest.metadata.name,
                agent_card.url,
            )
            return wrapped
        except ImportError:
            logger.warning(
                "A2AAgent not available in agentscope; "
                "returning unwrapped agent"
            )
            return agent

    @staticmethod
    def _build_a2a_card(card: Any) -> Dict[str, Any]:
        """Convert the OSSA A2A agent card to the dict format AgentScope expects."""
        return {
            "name": card.name or "ossa-agent",
            "description": card.description or "",
            "url": card.url or "",
            "version": card.version or "0.0.0",
            "capabilities": {
                "streaming": False,
                "pushNotifications": False,
            },
            "skills": [
                {"id": c, "name": c}
                for c in (card.capabilities or [])
            ],
            "authentication": card.authentication or {},
        }

    # ------------------------------------------------------------------
    # Introspection helpers
    # ------------------------------------------------------------------

    @property
    def manifest(self) -> Optional[OSSAManifest]:
        """Return the loaded manifest, or ``None`` if not yet loaded."""
        return self._manifest

    def get_fallback_configs(self) -> List[Dict[str, Any]]:
        """Return AgentScope model configs for all fallback models."""
        if self._manifest is None or self._manifest.spec.llm is None:
            return []

        configs: List[Dict[str, Any]] = []
        for fb in self._manifest.spec.llm.fallback_models:
            provider = fb.provider.lower()
            wrapper_cls = _PROVIDER_MODEL_CLASS.get(provider)
            if wrapper_cls is None:
                logger.warning("Unsupported fallback provider: %s", provider)
                continue
            configs.append(
                {
                    "config_name": (
                        f"ossa_{self._manifest.metadata.name}_{provider}_fallback"
                    ),
                    "model_type": wrapper_cls,
                    "model_name": fb.model,
                }
            )
        return configs
