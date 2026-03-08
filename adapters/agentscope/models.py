"""Pydantic models for the OSSA v0.4.6 manifest subset used by the AgentScope adapter."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class AgentScopeAgentClass(str, Enum):
    """Supported AgentScope agent classes (per OSSA v0.4.6 schema)."""

    REACT = "ReActAgent"
    USER = "UserAgent"
    A2A = "A2AAgent"
    REALTIME = "RealtimeAgent"
    CUSTOM = "custom"


class MemoryBackend(str, Enum):
    """Supported memory backends (per OSSA v0.4.6 schema)."""

    IN_MEMORY = "in_memory"
    REDIS = "redis"
    SQLALCHEMY = "sqlalchemy"
    MEM0 = "mem0"
    REME_PERSONAL = "reme_personal"
    REME_TASK = "reme_task"
    REME_TOOL = "reme_tool"


class SecurityTier(str, Enum):
    """OSSA security tiers mapped to sandboxing levels."""

    OPEN = "open"
    STANDARD = "standard"
    STRICT = "strict"
    ISOLATED = "isolated"


# ---------------------------------------------------------------------------
# LLM config
# ---------------------------------------------------------------------------


class OSSAFallbackModel(BaseModel):
    """A fallback LLM entry."""

    provider: str
    model: str


class OSSARetryConfig(BaseModel):
    """LLM retry configuration."""

    max_attempts: int = 3
    backoff_strategy: str = "exponential"


class OSSACostTracking(BaseModel):
    """LLM cost tracking configuration."""

    enabled: bool = False
    budget_alert_threshold: Optional[float] = None
    cost_allocation_tags: Dict[str, str] = Field(default_factory=dict)


class OSSALLMConfig(BaseModel):
    """spec.llm — LLM provider configuration."""

    provider: str
    model: str
    temperature: float = 0.7
    maxTokens: Optional[int] = Field(default=None, alias="maxTokens")
    max_tokens: Optional[int] = Field(default=None)
    topP: Optional[float] = Field(default=None, alias="topP")
    top_p: Optional[float] = Field(default=None)
    fallback_models: List[OSSAFallbackModel] = Field(default_factory=list)
    retry_config: Optional[OSSARetryConfig] = None
    cost_tracking: Optional[OSSACostTracking] = None

    model_config = {"populate_by_name": True}

    @property
    def resolved_max_tokens(self) -> int:
        """Return maxTokens regardless of which alias was used."""
        return self.maxTokens or self.max_tokens or 4096

    @property
    def resolved_top_p(self) -> Optional[float]:
        """Return topP regardless of which alias was used."""
        return self.topP or self.top_p


# ---------------------------------------------------------------------------
# Tool config
# ---------------------------------------------------------------------------


class OSSAToolTransport(BaseModel):
    """Transport configuration for an MCP tool server."""

    protocol: str = "http"
    streaming: Optional[str] = None
    rateLimit: Optional[Dict[str, Any]] = None


class OSSAToolAuth(BaseModel):
    """Authentication for a tool server."""

    type: str = "bearer"
    credentials: Optional[str] = None
    scopes: List[str] = Field(default_factory=list)


class OSSAToolCapability(BaseModel):
    """A single capability exposed by a tool server."""

    name: str
    version: Optional[str] = None
    description: Optional[str] = None
    scopes: List[str] = Field(default_factory=list)
    input_schema: Optional[Dict[str, Any]] = None
    transport: Optional[Dict[str, Any]] = None


class OSSATool(BaseModel):
    """spec.tools[] — a tool entry in the OSSA manifest."""

    type: str
    name: str
    description: Optional[str] = None
    server: Optional[str] = None
    endpoint: Optional[str] = None
    namespace: Optional[str] = None
    transport: Optional[OSSAToolTransport] = None
    auth: Optional[OSSAToolAuth] = None
    circuit_breaker: Optional[Dict[str, Any]] = None
    capabilities: List[OSSAToolCapability] = Field(default_factory=list)
    version: Optional[str] = None
    inputSchema: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Protocols
# ---------------------------------------------------------------------------


class A2AAgentCard(BaseModel):
    """A2A agent card for inter-agent communication."""

    name: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    version: Optional[str] = None
    capabilities: List[str] = Field(default_factory=list)
    authentication: Optional[Dict[str, Any]] = None
    provider: Optional[Dict[str, Any]] = None


class A2AExtension(BaseModel):
    """extensions.a2a — A2A protocol configuration."""

    enabled: bool = False
    agent_card: Optional[A2AAgentCard] = None
    supported_content_types: List[str] = Field(default_factory=list)
    skills: List[Dict[str, Any]] = Field(default_factory=list)
    streaming: Optional[str] = None


class OSSAProtocols(BaseModel):
    """protocols section of the manifest."""

    a2a: Optional[A2AExtension] = None


# ---------------------------------------------------------------------------
# AgentScope extension
# ---------------------------------------------------------------------------


class OrchestrationPattern(str, Enum):
    """Multi-agent orchestration patterns (per OSSA v0.4.6 schema)."""

    MSGHUB = "msghub"
    SEQUENTIAL_PIPELINE = "sequential_pipeline"
    FANOUT_PIPELINE = "fanout_pipeline"
    CHATROOM = "chatroom"


class FormatterType(str, Enum):
    """Message formatter for the model provider (per OSSA v0.4.6 schema)."""

    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    DASHSCOPE = "dashscope"
    OLLAMA = "ollama"
    DEEPSEEK = "deepseek"
    A2A = "a2a"


class AgentScopeCapability(str, Enum):
    """AgentScope-specific capabilities (per OSSA v0.4.6 schema)."""

    RL_TRAINING = "rl_training"
    REALTIME_VOICE = "realtime_voice"
    EVALUATION = "evaluation"
    PLANNING = "planning"
    RAG = "rag"
    PARALLEL_TOOL_CALLS = "parallel_tool_calls"
    META_TOOLS = "meta_tools"
    TTS = "tts"


class CompressionConfig(BaseModel):
    """AgentScope memory compression settings (per OSSA v0.4.6 schema)."""

    enable: bool = False
    trigger_threshold: Optional[int] = None
    keep_recent: int = 3


class AgentScopeExtension(BaseModel):
    """extensions.agentscope — AgentScope-specific settings (per OSSA v0.4.6 schema)."""

    version: Optional[str] = None
    agent_class: AgentScopeAgentClass = AgentScopeAgentClass.REACT
    capabilities: List[AgentScopeCapability] = Field(default_factory=list)
    memory_backend: MemoryBackend = MemoryBackend.IN_MEMORY
    orchestration: Optional[OrchestrationPattern] = None
    max_iters: int = 10
    formatter: Optional[FormatterType] = None
    compression: Optional[CompressionConfig] = None
    skill_dirs: List[str] = Field(default_factory=list)
    # Extra kwargs forwarded to the agent constructor
    extra_kwargs: Dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Safety / Security
# ---------------------------------------------------------------------------


class OSSAGuardrails(BaseModel):
    """Safety guardrails configuration."""

    enabled: bool = True
    max_tool_calls: Optional[int] = None
    max_execution_time_seconds: Optional[int] = None
    pii_detection: Optional[Dict[str, Any]] = None
    secrets_detection: Optional[Dict[str, Any]] = None
    prompt_injection: Optional[Dict[str, Any]] = None
    content_policy: Optional[Dict[str, Any]] = None
    policies: List[Dict[str, Any]] = Field(default_factory=list)


class OSSASafety(BaseModel):
    """spec.safety — safety configuration."""

    guardrails: Optional[OSSAGuardrails] = None
    kill_switch: Optional[Dict[str, Any]] = None
    compliance: Optional[Dict[str, Any]] = None
    content_filtering: Optional[Dict[str, Any]] = None
    pii_detection: Optional[Dict[str, Any]] = None
    rate_limiting: Optional[Dict[str, Any]] = None


class OSSASecurity(BaseModel):
    """spec.security — authentication & authorization."""

    tier: SecurityTier = SecurityTier.STANDARD
    authentication: Optional[Dict[str, Any]] = None
    authorization: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Constraints
# ---------------------------------------------------------------------------


class OSSAConstraints(BaseModel):
    """spec.constraints — resource and cost constraints."""

    cost: Optional[Dict[str, Any]] = None
    performance: Optional[Dict[str, Any]] = None
    resources: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Observability
# ---------------------------------------------------------------------------


class OSSAObservability(BaseModel):
    """spec.observability — telemetry, tracing, metrics, logging."""

    telemetry: Optional[Dict[str, Any]] = None
    tracing: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    logging: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Top-level manifest
# ---------------------------------------------------------------------------


class OSSAMetadata(BaseModel):
    """metadata section of an OSSA manifest."""

    name: str
    version: str = "0.0.0"
    description: Optional[str] = None
    agentType: Optional[str] = Field(default=None, alias="agentType")
    labels: Dict[str, str] = Field(default_factory=dict)
    annotations: Dict[str, str] = Field(default_factory=dict)
    license: Optional[str] = None

    model_config = {"populate_by_name": True}


class OSSASpec(BaseModel):
    """spec section of an OSSA manifest."""

    role: Optional[str] = None
    llm: Optional[OSSALLMConfig] = None
    tools: List[OSSATool] = Field(default_factory=list)
    capabilities: Any = None  # Can be list or object with policy/grants
    state: Optional[Dict[str, Any]] = None
    autonomy: Optional[Dict[str, Any]] = None
    constraints: Optional[OSSAConstraints] = None
    observability: Optional[OSSAObservability] = None
    safety: Optional[OSSASafety] = None
    security: Optional[OSSASecurity] = None
    lifecycle: Optional[Dict[str, Any]] = None
    taxonomy: Optional[Dict[str, Any]] = None
    reliability: Optional[Dict[str, Any]] = None
    deployment: Optional[Dict[str, Any]] = None
    tasks: Optional[List[Dict[str, Any]]] = None
    workflow: Optional[Dict[str, Any]] = None


class OSSAExtensions(BaseModel):
    """extensions section of an OSSA manifest.

    Supports both attribute access (``extensions.agentscope``) and
    dict-style access (``extensions["agentscope"]``) so that test
    code and generic helpers can treat extensions uniformly.
    """

    agentscope: Optional[AgentScopeExtension] = None
    a2a: Optional[A2AExtension] = None
    buildkit: Optional[Dict[str, Any]] = None
    mcp: Optional[Dict[str, Any]] = None
    kagent: Optional[Dict[str, Any]] = None
    gitlab_duo: Optional[Dict[str, Any]] = None

    def __getitem__(self, key: str) -> Any:
        """Allow dict-style access: ``extensions['agentscope']``."""
        try:
            return getattr(self, key)
        except AttributeError:
            raise KeyError(key)

    def __contains__(self, key: str) -> bool:
        """Support ``'agentscope' in extensions``."""
        return hasattr(self, key) and getattr(self, key) is not None


class OSSAManifest(BaseModel):
    """Root model for an OSSA v0.4.6 agent manifest."""

    apiVersion: str = Field(..., alias="apiVersion")
    kind: str
    metadata: OSSAMetadata
    spec: OSSASpec
    extensions: Optional[OSSAExtensions] = None
    protocols: Optional[OSSAProtocols] = None

    model_config = {"populate_by_name": True}

    @field_validator("apiVersion")
    @classmethod
    def validate_api_version(cls, v: str) -> str:
        if not v.startswith("ossa/"):
            raise ValueError(
                f"apiVersion must start with 'ossa/', got '{v}'"
            )
        return v

    @field_validator("kind")
    @classmethod
    def validate_kind(cls, v: str) -> str:
        if v != "Agent":
            raise ValueError(f"kind must be 'Agent', got '{v}'")
        return v
