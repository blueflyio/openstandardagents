"""OSSA Type Definitions - Pydantic models for OSSA manifests."""

from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


class LLMConfig(BaseModel):
    """LLM configuration."""
    provider: str
    model: str
    temperature: Optional[float] = Field(None, ge=0, le=2)
    max_tokens: Optional[int] = Field(None, alias="maxTokens", gt=0)
    top_p: Optional[float] = Field(None, alias="topP", ge=0, le=1)


class ToolConfig(BaseModel):
    """Tool configuration."""
    type: str
    name: Optional[str] = None
    server: Optional[str] = None
    namespace: Optional[str] = None
    endpoint: Optional[str] = None
    capabilities: Optional[list[str]] = None
    config: Optional[dict[str, Any]] = None


class AutonomyConfig(BaseModel):
    """Autonomy configuration."""
    level: Optional[str] = None
    approval_required: Optional[bool] = Field(None, alias="approvalRequired")
    allowed_actions: Optional[list[str]] = Field(None, alias="allowedActions")
    blocked_actions: Optional[list[str]] = Field(None, alias="blockedActions")


class Constraints(BaseModel):
    """Agent constraints."""
    cost: Optional[dict[str, Any]] = None
    performance: Optional[dict[str, Any]] = None


class AgentSpec(BaseModel):
    """Agent specification."""
    role: str
    llm: Optional[LLMConfig] = None
    tools: Optional[list[ToolConfig]] = None
    autonomy: Optional[AutonomyConfig] = None
    constraints: Optional[Constraints] = None


class Metadata(BaseModel):
    """Manifest metadata."""
    name: str
    version: Optional[str] = None
    description: Optional[str] = None
    labels: Optional[dict[str, str]] = None
    annotations: Optional[dict[str, str]] = None


class OSSAManifest(BaseModel):
    """OSSA Manifest structure."""
    api_version: str = Field(alias="apiVersion")
    kind: Literal["Agent", "Task", "Workflow"]
    metadata: Metadata
    spec: AgentSpec

    class Config:
        populate_by_name = True
