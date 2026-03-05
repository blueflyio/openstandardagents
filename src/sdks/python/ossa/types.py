"""OSSA SDK Type Definitions — Pydantic models aligned with agent.schema.json."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field


class Kind(str, Enum):
    AGENT = "Agent"
    TASK = "Task"
    WORKFLOW = "Workflow"
    FLOW = "Flow"


class LLMProvider(str, Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    AZURE = "azure"
    GOOGLE = "google"
    BEDROCK = "bedrock"
    GROQ = "groq"
    OLLAMA = "ollama"


class AccessTier(str, Enum):
    TIER_1_READ = "tier_1_read"
    TIER_2_WRITE_LIMITED = "tier_2_write_limited"
    TIER_3_WRITE_ELEVATED = "tier_3_write_elevated"
    TIER_4_POLICY = "tier_4_policy"
    READ = "read"
    LIMITED = "limited"
    ELEVATED = "elevated"
    POLICY = "policy"


class SecurityTier(str, Enum):
    OFFICIAL = "official"
    VERIFIED_SIGNATURE = "verified-signature"
    SIGNED = "signed"
    COMMUNITY = "community"
    EXPERIMENTAL = "experimental"


class LLMConfig(BaseModel):
    provider: str
    model: str
    temperature: Optional[float] = None
    max_tokens: Optional[int] = Field(None, alias="maxTokens")
    top_p: Optional[float] = None
    profile: Optional[str] = None
    model_config = {"populate_by_name": True}


class ToolHandler(BaseModel):
    runtime: Optional[str] = None
    capability: Optional[str] = None
    endpoint: Optional[str] = None
    method: Optional[str] = None


class Tool(BaseModel):
    name: str
    type: Optional[str] = None
    description: Optional[str] = None
    handler: Optional[ToolHandler] = None
    parameters: Optional[Dict[str, Any]] = None
    permissions: Optional[List[str]] = None
    conditions: Optional[Dict[str, Any]] = None


class Capability(BaseModel):
    name: Optional[str] = None
    fingerprint: Optional[str] = None
    description: Optional[str] = None


class Guardrails(BaseModel):
    max_actions_per_minute: Optional[int] = Field(None, alias="maxActionsPerMinute")
    require_human_approval_for: Optional[List[str]] = None
    blocked_actions: Optional[List[str]] = None
    audit_all_actions: Optional[bool] = None
    cost_threshold_usd: Optional[float] = None
    model_config = {"populate_by_name": True}


class Safety(BaseModel):
    guardrails: Optional[Guardrails] = None
    content_filtering: Optional[Dict[str, Any]] = None
    pii_detection: Optional[Dict[str, Any]] = None
    pii_handling: Optional[str] = None
    data_classification: Optional[str] = None
    prompt_injection: Optional[Dict[str, Any]] = None
    kill_switch: Optional[Dict[str, Any]] = None


class Autonomy(BaseModel):
    level: Optional[str] = None
    boundaries: Optional[Dict[str, Any]] = None
    approval_required: Optional[List[str]] = None


class Identity(BaseModel):
    provider: Optional[str] = None
    service_account: Optional[Dict[str, Any]] = None
    access_tier: Optional[str] = None
    decentralized_identity: Optional[Dict[str, Any]] = None
    otel: Optional[Dict[str, Any]] = None


class AgentSpec(BaseModel):
    role: Optional[str] = None
    type: Optional[str] = None
    llm: Optional[LLMConfig] = None
    tools: Optional[List[Tool]] = None
    capabilities: Optional[Union[Dict[str, Any], List[Capability]]] = None
    identity: Optional[Identity] = None
    autonomy: Optional[Autonomy] = None
    safety: Optional[Safety] = None
    workflow: Optional[Dict[str, Any]] = None
    constraints: Optional[Dict[str, Any]] = None


class Publisher(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    pgp_key: Optional[str] = None
    registry_url: Optional[str] = None


class AgentIdentity(BaseModel):
    namespace: Optional[str] = None
    agent_id: Optional[str] = None
    version: Optional[str] = None
    publisher: Optional[Publisher] = None
    checksum: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ThreatModelEntry(BaseModel):
    category: Optional[str] = None
    severity: Optional[str] = None
    mitigations: Optional[List[str]] = None
    description: Optional[str] = None


class SecurityCapabilities(BaseModel):
    required: Optional[List[str]] = None
    optional: Optional[List[str]] = None


class SandboxConfig(BaseModel):
    required: Optional[bool] = None
    type: Optional[str] = None
    resource_limits: Optional[Dict[str, Any]] = None


class NetworkAccess(BaseModel):
    allowed_domains: Optional[List[str]] = None
    blocked_domains: Optional[List[str]] = None
    protocols: Optional[List[str]] = None
    egress_policy: Optional[str] = None


class AuditConfig(BaseModel):
    log_inputs: Optional[bool] = None
    log_outputs: Optional[bool] = None
    log_tool_calls: Optional[bool] = None
    retention_days: Optional[int] = None


class SecurityPosture(BaseModel):
    tier: Optional[str] = None
    threat_model: Optional[List[ThreatModelEntry]] = None
    capabilities: Optional[SecurityCapabilities] = None
    sandboxing: Optional[SandboxConfig] = None
    network_access: Optional[NetworkAccess] = None
    data_classification: Optional[str] = None
    audit: Optional[AuditConfig] = None


class Governance(BaseModel):
    authorization: Optional[Dict[str, Any]] = None
    compliance: Optional[Dict[str, Any]] = None
    quality_requirements: Optional[Dict[str, Any]] = None


class MCPServer(BaseModel):
    name: Optional[str] = None
    transport: Optional[str] = None
    command: Optional[str] = None
    args: Optional[List[str]] = None
    tools: Optional[List[str]] = None


class MCPProtocol(BaseModel):
    version: Optional[str] = None
    role: Optional[str] = None
    servers: Optional[List[MCPServer]] = None
    capabilities: Optional[Dict[str, Any]] = None


class A2AProtocol(BaseModel):
    version: Optional[str] = None
    endpoint: Optional[str] = None
    agent_card: Optional[Dict[str, Any]] = None
    capabilities: Optional[Dict[str, Any]] = None
    authentication: Optional[Dict[str, Any]] = None


class ANPProtocol(BaseModel):
    did: Optional[str] = None
    verifiable_credentials: Optional[List[Dict[str, Any]]] = None
    discovery: Optional[Dict[str, Any]] = None


class ProtocolDeclarations(BaseModel):
    mcp: Optional[MCPProtocol] = None
    a2a: Optional[A2AProtocol] = None
    anp: Optional[ANPProtocol] = None


class TokenBudget(BaseModel):
    max_input_tokens: Optional[int] = None
    max_output_tokens: Optional[int] = None
    allocation_strategy: Optional[str] = None
    cascade: Optional[List[Dict[str, Any]]] = None


class TokenEfficiency(BaseModel):
    budget: Optional[TokenBudget] = None
    compression: Optional[Dict[str, Any]] = None
    consolidation: Optional[Dict[str, Any]] = None
    routing: Optional[Dict[str, Any]] = None
    serialization_profile: Optional[str] = None
    observation_format: Optional[str] = None
    custom_metrics: Optional[List[Dict[str, Any]]] = None


class Cognition(BaseModel):
    pattern: Optional[str] = None
    constraints: Optional[Dict[str, Any]] = None
    governance: Optional[Dict[str, Any]] = None
    trace: Optional[Dict[str, Any]] = None


class Metadata(BaseModel):
    name: str
    version: Optional[str] = None
    namespace: Optional[str] = None
    description: Optional[str] = None
    labels: Optional[Dict[str, str]] = None
    annotations: Optional[Dict[str, str]] = None
    identity: Optional[AgentIdentity] = None
    uuid: Optional[str] = None
    status: Optional[str] = None
    signature: Optional[str] = None
    x_signature: Optional[Dict[str, Any]] = Field(None, alias="x-signature")
    agentType: Optional[str] = None
    agentKind: Optional[str] = None
    model_config = {"populate_by_name": True}


class OSSAManifest(BaseModel):
    apiVersion: str = Field(alias="apiVersion")
    kind: Kind
    metadata: Metadata
    spec: Optional[Dict[str, Any]] = None
    security: Optional[SecurityPosture] = None
    governance: Optional[Governance] = None
    protocols: Optional[ProtocolDeclarations] = None
    token_efficiency: Optional[TokenEfficiency] = None
    cognition: Optional[Cognition] = None
    extensions: Optional[Dict[str, Any]] = None
    model_config = {"populate_by_name": True}

    def is_agent(self) -> bool:
        return self.kind == Kind.AGENT

    def is_task(self) -> bool:
        return self.kind == Kind.TASK

    def is_workflow(self) -> bool:
        return self.kind == Kind.WORKFLOW


AgentManifest = OSSAManifest
TaskManifest = OSSAManifest
WorkflowManifest = OSSAManifest
