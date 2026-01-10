"""
Pydantic models for OSSA v0.3.0 specification.

This module provides type-safe Python classes for all OSSA manifest components,
automatically validating structure and data types.
"""

from enum import Enum
from typing import Any, Dict, List, Literal, Optional, Union

from pydantic import BaseModel, Field, field_validator


class OSSAKind(str, Enum):
    """OSSA resource kinds."""

    AGENT = "Agent"
    TASK = "Task"
    WORKFLOW = "Workflow"


class LLMProvider(str, Enum):
    """Supported LLM providers."""

    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GOOGLE = "google"
    AZURE = "azure"
    GROQ = "groq"
    TOGETHER = "together"
    FIREWORKS = "fireworks"
    OLLAMA = "ollama"
    DEEPSEEK = "deepseek"
    MISTRAL = "mistral"
    COHERE = "cohere"
    REPLICATE = "replicate"
    PERPLEXITY = "perplexity"


class AutonomyLevel(str, Enum):
    """Agent autonomy levels."""

    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    FULL = "full"


class Metadata(BaseModel):
    """OSSA manifest metadata."""

    name: str = Field(..., description="Unique identifier for the resource")
    version: str = Field(..., description="Semantic version (e.g., 1.0.0)")
    description: Optional[str] = Field(None, description="Human-readable description")
    labels: Optional[Dict[str, str]] = Field(
        default_factory=dict, description="Key-value pairs for organization"
    )
    annotations: Optional[Dict[str, str]] = Field(
        default_factory=dict, description="Non-identifying metadata"
    )

    @field_validator("version")
    @classmethod
    def validate_version(cls, v: str) -> str:
        """Validate semantic version format."""
        parts = v.split(".")
        if len(parts) != 3:
            raise ValueError("Version must follow semantic versioning (MAJOR.MINOR.PATCH)")
        return v


class LLMConfig(BaseModel):
    """LLM configuration."""

    provider: str = Field(..., description="LLM provider name")
    model: str = Field(..., description="Model identifier")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: Optional[int] = Field(None, gt=0, description="Maximum tokens in response")
    top_p: Optional[float] = Field(None, ge=0.0, le=1.0, description="Nucleus sampling threshold")
    frequency_penalty: Optional[float] = Field(
        None, ge=-2.0, le=2.0, description="Frequency penalty"
    )
    presence_penalty: Optional[float] = Field(None, ge=-2.0, le=2.0, description="Presence penalty")
    fallback_models: Optional[List[Dict[str, str]]] = Field(
        None, description="Backup models for resilience"
    )


class Tool(BaseModel):
    """Tool definition."""

    name: str = Field(..., description="Tool identifier")
    type: Literal["mcp", "function", "api"] = Field(..., description="Tool type")
    description: Optional[str] = Field(None, description="Tool purpose")
    config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Tool configuration")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Tool parameters schema")


class PIIDetection(BaseModel):
    """PII detection configuration."""

    enabled: bool = Field(True, description="Enable PII detection")
    redact: bool = Field(True, description="Automatically redact PII")
    patterns: Optional[List[str]] = Field(None, description="Custom PII regex patterns")


class RateLimit(BaseModel):
    """Rate limiting configuration."""

    requests_per_minute: Optional[int] = Field(None, gt=0)
    requests_per_hour: Optional[int] = Field(None, gt=0)
    tokens_per_minute: Optional[int] = Field(None, gt=0)


class Safety(BaseModel):
    """Safety and compliance configuration."""

    pii_detection: Optional[PIIDetection] = Field(None, description="PII detection settings")
    rate_limits: Optional[RateLimit] = Field(None, description="Rate limiting")
    allowed_domains: Optional[List[str]] = Field(None, description="Allowed API domains")
    blocked_domains: Optional[List[str]] = Field(None, description="Blocked API domains")
    max_retries: Optional[int] = Field(3, ge=0, description="Maximum retry attempts")
    timeout_seconds: Optional[int] = Field(30, gt=0, description="Request timeout")


class Autonomy(BaseModel):
    """Autonomy and human-in-loop controls."""

    level: AutonomyLevel = Field(AutonomyLevel.MEDIUM, description="Autonomy level")
    require_approval: Optional[List[str]] = Field(
        None, description="Actions requiring approval"
    )
    auto_approve: Optional[List[str]] = Field(None, description="Auto-approved actions")


class MessagingPubSub(BaseModel):
    """Pub/sub messaging configuration."""

    subscribe: Optional[List[str]] = Field(None, description="Topics to subscribe to")
    publish: Optional[List[str]] = Field(None, description="Topics to publish to")


class MessagingCommand(BaseModel):
    """Command-based messaging configuration."""

    accepts: Optional[List[str]] = Field(None, description="Commands this agent accepts")
    emits: Optional[List[str]] = Field(None, description="Commands this agent emits")


class Messaging(BaseModel):
    """Agent-to-agent messaging configuration."""

    enabled: bool = Field(False, description="Enable messaging")
    pubsub: Optional[MessagingPubSub] = Field(None, description="Pub/sub configuration")
    commands: Optional[MessagingCommand] = Field(None, description="Command configuration")


class StateConfig(BaseModel):
    """State persistence configuration."""

    enabled: bool = Field(False, description="Enable state persistence")
    backend: Optional[str] = Field("memory", description="Storage backend")
    ttl_seconds: Optional[int] = Field(None, gt=0, description="State time-to-live")


class AgentSpec(BaseModel):
    """Agent specification (kind: Agent)."""

    role: Optional[str] = Field(None, description="Agent system prompt")
    llm: LLMConfig = Field(..., description="LLM configuration")
    tools: Optional[List[Tool]] = Field(default_factory=list, description="Available tools")
    safety: Optional[Safety] = Field(None, description="Safety configuration")
    autonomy: Optional[Autonomy] = Field(None, description="Autonomy configuration")
    messaging: Optional[Messaging] = Field(None, description="Messaging configuration")
    state: Optional[StateConfig] = Field(None, description="State configuration")


class TaskStep(BaseModel):
    """Single step in a Task."""

    name: str = Field(..., description="Step identifier")
    action: str = Field(..., description="Action to execute")
    parameters: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Step parameters"
    )
    condition: Optional[str] = Field(None, description="Conditional execution expression")


class TaskSpec(BaseModel):
    """Task specification (kind: Task)."""

    steps: List[TaskStep] = Field(..., description="Ordered list of steps")
    timeout_seconds: Optional[int] = Field(300, gt=0, description="Task timeout")
    retry_policy: Optional[Dict[str, Any]] = Field(None, description="Retry configuration")


class WorkflowStep(BaseModel):
    """Single step in a Workflow."""

    name: str = Field(..., description="Step identifier")
    agent: Optional[str] = Field(None, description="Agent reference")
    task: Optional[str] = Field(None, description="Task reference")
    depends_on: Optional[List[str]] = Field(None, description="Dependencies")
    parameters: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Step parameters"
    )


class WorkflowSpec(BaseModel):
    """Workflow specification (kind: Workflow)."""

    steps: List[WorkflowStep] = Field(..., description="Workflow steps")
    parallel: Optional[bool] = Field(False, description="Execute steps in parallel")
    timeout_seconds: Optional[int] = Field(600, gt=0, description="Workflow timeout")


class OSSAManifest(BaseModel):
    """Complete OSSA manifest."""

    apiVersion: str = Field(..., description="OSSA API version")
    kind: OSSAKind = Field(..., description="Resource kind")
    metadata: Metadata = Field(..., description="Resource metadata")
    spec: Union[AgentSpec, TaskSpec, WorkflowSpec] = Field(..., description="Resource specification")
    extensions: Optional[Dict[str, Any]] = Field(None, description="Framework-specific extensions")
    runtime: Optional[Dict[str, Any]] = Field(None, description="Runtime bindings")

    @field_validator("apiVersion")
    @classmethod
    def validate_api_version(cls, v: str) -> str:
        """Validate OSSA API version format."""
        if not v.startswith("ossa/v"):
            raise ValueError("apiVersion must start with 'ossa/v'")
        return v

    @property
    def is_agent(self) -> bool:
        """Check if this is an Agent manifest."""
        return self.kind == OSSAKind.AGENT

    @property
    def is_task(self) -> bool:
        """Check if this is a Task manifest."""
        return self.kind == OSSAKind.TASK

    @property
    def is_workflow(self) -> bool:
        """Check if this is a Workflow manifest."""
        return self.kind == OSSAKind.WORKFLOW


class ValidationResult(BaseModel):
    """Result of manifest validation."""

    valid: bool = Field(..., description="Whether validation passed")
    errors: List[str] = Field(default_factory=list, description="Validation errors")
    warnings: List[str] = Field(default_factory=list, description="Validation warnings")
    manifest: Optional[OSSAManifest] = Field(None, description="Parsed manifest if valid")

    @property
    def has_errors(self) -> bool:
        """Check if validation has errors."""
        return len(self.errors) > 0

    @property
    def has_warnings(self) -> bool:
        """Check if validation has warnings."""
        return len(self.warnings) > 0
