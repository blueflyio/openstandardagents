"""OSSA Type Definitions - Pydantic models for OSSA manifests."""

from typing import Any, List, Literal, Optional, Union
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


class TaskExecution(BaseModel):
    """Task execution configuration."""
    type: str = "deterministic"
    runtime: Optional[str] = None
    entrypoint: Optional[str] = None
    timeout_seconds: Optional[int] = None


class TaskStep(BaseModel):
    """Single step in a Task (kind: Task)."""
    name: str
    action: str = "log"
    parameters: Optional[dict[str, Any]] = None
    condition: Optional[str] = None

    class Config:
        extra = "allow"


class TaskSpec(BaseModel):
    """Task specification (kind: Task)."""
    execution: TaskExecution
    steps: Optional[List[TaskStep]] = None
    capabilities: Optional[List[str]] = None
    input: Optional[dict[str, Any]] = None
    output: Optional[dict[str, Any]] = None

    class Config:
        extra = "allow"


class WorkflowStep(BaseModel):
    """Single step in a Workflow (kind: Workflow)."""
    name: str
    parameters: Optional[dict[str, Any]] = None
    agent: Optional[str] = None
    task: Optional[str] = None
    depends_on: Optional[List[str]] = Field(None, alias="dependsOn")

    class Config:
        populate_by_name = True
        extra = "allow"


class WorkflowSpec(BaseModel):
    """Workflow specification (kind: Workflow)."""
    steps: List[WorkflowStep]
    timeout_seconds: Optional[int] = Field(None, alias="timeoutSeconds")
    parallel: Optional[bool] = None

    class Config:
        populate_by_name = True
        extra = "allow"


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
    spec: Union[AgentSpec, TaskSpec, WorkflowSpec]

    class Config:
        populate_by_name = True
