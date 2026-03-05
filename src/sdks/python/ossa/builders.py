"""Fluent builders for constructing OSSA manifests programmatically."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from .types import (
    A2AProtocol,
    AgentIdentity,
    AuditConfig,
    Cognition,
    Governance,
    Kind,
    LLMConfig,
    MCPProtocol,
    MCPServer,
    Metadata,
    NetworkAccess,
    OSSAManifest,
    ProtocolDeclarations,
    Publisher,
    SecurityCapabilities,
    SecurityPosture,
    SandboxConfig,
    ThreatModelEntry,
    TokenBudget,
    TokenEfficiency,
    Tool,
    ToolHandler,
)


class ToolBuilder:
    """Build OSSA tool definitions with fluent API."""

    def __init__(self, name: str, tool_type: str = "function") -> None:
        self._name = name
        self._type = tool_type
        self._description: Optional[str] = None
        self._handler: Optional[Dict[str, Any]] = None
        self._parameters: Optional[Dict[str, Any]] = None
        self._permissions: Optional[List[str]] = None

    @classmethod
    def mcp(cls, name: str) -> ToolBuilder:
        return cls(name, "mcp")

    @classmethod
    def function(cls, name: str) -> ToolBuilder:
        return cls(name, "function")

    @classmethod
    def http(cls, name: str) -> ToolBuilder:
        return cls(name, "http")

    @classmethod
    def a2a(cls, name: str) -> ToolBuilder:
        return cls(name, "a2a")

    @classmethod
    def webhook(cls, name: str) -> ToolBuilder:
        return cls(name, "webhook")

    @classmethod
    def kubernetes(cls, name: str) -> ToolBuilder:
        return cls(name, "kubernetes")

    def description(self, desc: str) -> ToolBuilder:
        self._description = desc
        return self

    def endpoint(self, url: str) -> ToolBuilder:
        self._handler = self._handler or {}
        self._handler["endpoint"] = url
        return self

    def method(self, m: str) -> ToolBuilder:
        self._handler = self._handler or {}
        self._handler["method"] = m
        return self

    def runtime(self, rt: str) -> ToolBuilder:
        self._handler = self._handler or {}
        self._handler["runtime"] = rt
        return self

    def params(self, p: Dict[str, Any]) -> ToolBuilder:
        self._parameters = p
        return self

    def with_permissions(self, perms: List[str]) -> ToolBuilder:
        self._permissions = perms
        return self

    def build(self) -> Tool:
        handler = ToolHandler(**self._handler) if self._handler else None
        return Tool(
            name=self._name,
            type=self._type,
            description=self._description,
            handler=handler,
            parameters=self._parameters,
            permissions=self._permissions,
        )


class LLMConfigBuilder:
    """Build LLM configurations with fluent API."""

    def __init__(self, provider: str, model: str) -> None:
        self._provider = provider
        self._model = model
        self._temperature: Optional[float] = None
        self._max_tokens: Optional[int] = None
        self._profile: Optional[str] = None

    @classmethod
    def anthropic(cls, model: str = "claude-sonnet-4-20250514") -> LLMConfigBuilder:
        return cls("anthropic", model)

    @classmethod
    def openai(cls, model: str = "gpt-4o") -> LLMConfigBuilder:
        return cls("openai", model)

    @classmethod
    def azure(cls, model: str) -> LLMConfigBuilder:
        return cls("azure", model)

    @classmethod
    def google(cls, model: str = "gemini-2.0-flash") -> LLMConfigBuilder:
        return cls("google", model)

    @classmethod
    def bedrock(cls, model: str) -> LLMConfigBuilder:
        return cls("bedrock", model)

    @classmethod
    def groq(cls, model: str) -> LLMConfigBuilder:
        return cls("groq", model)

    @classmethod
    def ollama(cls, model: str = "llama3") -> LLMConfigBuilder:
        return cls("ollama", model)

    def temperature(self, t: float) -> LLMConfigBuilder:
        self._temperature = t
        return self

    def max_tokens(self, n: int) -> LLMConfigBuilder:
        self._max_tokens = n
        return self

    def profile(self, p: str) -> LLMConfigBuilder:
        self._profile = p
        return self

    def build(self) -> LLMConfig:
        return LLMConfig(
            provider=self._provider,
            model=self._model,
            temperature=self._temperature,
            max_tokens=self._max_tokens,
            profile=self._profile,
        )


class SecurityBuilder:
    """Build security posture declarations."""

    def __init__(self) -> None:
        self._tier: Optional[str] = None
        self._threats: List[ThreatModelEntry] = []
        self._required_caps: List[str] = []
        self._optional_caps: List[str] = []
        self._sandbox: Optional[SandboxConfig] = None
        self._network: Optional[NetworkAccess] = None
        self._classification: Optional[str] = None
        self._audit: Optional[AuditConfig] = None

    def tier(self, t: str) -> SecurityBuilder:
        self._tier = t
        return self

    def threat(
        self, category: str, severity: str, mitigations: List[str], description: str = ""
    ) -> SecurityBuilder:
        self._threats.append(ThreatModelEntry(
            category=category, severity=severity,
            mitigations=mitigations, description=description or None,
        ))
        return self

    def require_capability(self, cap: str) -> SecurityBuilder:
        self._required_caps.append(cap)
        return self

    def optional_capability(self, cap: str) -> SecurityBuilder:
        self._optional_caps.append(cap)
        return self

    def sandbox(self, type: str = "container", **limits: Any) -> SecurityBuilder:
        self._sandbox = SandboxConfig(required=True, type=type, resource_limits=limits or None)
        return self

    def network(
        self,
        allowed: Optional[List[str]] = None,
        blocked: Optional[List[str]] = None,
        egress: str = "allow-list",
    ) -> SecurityBuilder:
        self._network = NetworkAccess(
            allowed_domains=allowed, blocked_domains=blocked,
            protocols=["https"], egress_policy=egress,
        )
        return self

    def classify(self, level: str) -> SecurityBuilder:
        self._classification = level
        return self

    def audit(
        self, log_inputs: bool = False, log_outputs: bool = True,
        log_tool_calls: bool = True, retention_days: int = 90,
    ) -> SecurityBuilder:
        self._audit = AuditConfig(
            log_inputs=log_inputs, log_outputs=log_outputs,
            log_tool_calls=log_tool_calls, retention_days=retention_days,
        )
        return self

    def build(self) -> SecurityPosture:
        caps = None
        if self._required_caps or self._optional_caps:
            caps = SecurityCapabilities(
                required=self._required_caps or None,
                optional=self._optional_caps or None,
            )
        return SecurityPosture(
            tier=self._tier,
            threat_model=self._threats or None,
            capabilities=caps,
            sandboxing=self._sandbox,
            network_access=self._network,
            data_classification=self._classification,
            audit=self._audit,
        )


class ManifestBuilder:
    """Build complete OSSA manifests with fluent API.

    Usage:
        manifest = (
            ManifestBuilder.agent("my-agent")
            .version("1.0.0")
            .description("A helpful agent")
            .role("You are a helpful assistant.")
            .llm(LLMConfigBuilder.anthropic().temperature(0.7).build())
            .add_tool(ToolBuilder.mcp("search").description("Search the web").build())
            .security(SecurityBuilder().tier("signed").classify("internal").build())
            .build()
        )
    """

    def __init__(self, name: str, kind: Kind = Kind.AGENT) -> None:
        self._kind = kind
        self._name = name
        self._version: Optional[str] = None
        self._namespace: Optional[str] = None
        self._description: Optional[str] = None
        self._labels: Dict[str, str] = {}
        self._annotations: Dict[str, str] = {}
        self._identity: Optional[AgentIdentity] = None
        self._agent_type: Optional[str] = None
        self._agent_kind: Optional[str] = None

        # Spec fields
        self._spec: Dict[str, Any] = {}

        # v0.5 top-level
        self._security: Optional[SecurityPosture] = None
        self._governance: Optional[Governance] = None
        self._protocols: Optional[ProtocolDeclarations] = None
        self._token_efficiency: Optional[TokenEfficiency] = None
        self._cognition: Optional[Cognition] = None
        self._extensions: Optional[Dict[str, Any]] = None

    @classmethod
    def agent(cls, name: str) -> ManifestBuilder:
        return cls(name, Kind.AGENT)

    @classmethod
    def task(cls, name: str) -> ManifestBuilder:
        return cls(name, Kind.TASK)

    @classmethod
    def workflow(cls, name: str) -> ManifestBuilder:
        return cls(name, Kind.WORKFLOW)

    # --- Metadata ---

    def version(self, v: str) -> ManifestBuilder:
        self._version = v
        return self

    def namespace(self, ns: str) -> ManifestBuilder:
        self._namespace = ns
        return self

    def description(self, d: str) -> ManifestBuilder:
        self._description = d
        return self

    def label(self, key: str, value: str) -> ManifestBuilder:
        self._labels[key] = value
        return self

    def labels(self, l: Dict[str, str]) -> ManifestBuilder:
        self._labels.update(l)
        return self

    def annotation(self, key: str, value: str) -> ManifestBuilder:
        self._annotations[key] = value
        return self

    def agent_type(self, t: str) -> ManifestBuilder:
        self._agent_type = t
        return self

    def agent_kind(self, k: str) -> ManifestBuilder:
        self._agent_kind = k
        return self

    def identity(self, ident: AgentIdentity) -> ManifestBuilder:
        self._identity = ident
        return self

    def publisher(self, name: str, email: str, website: Optional[str] = None) -> ManifestBuilder:
        pub = Publisher(name=name, email=email, website=website)
        if self._identity is None:
            self._identity = AgentIdentity(publisher=pub)
        else:
            self._identity.publisher = pub
        return self

    # --- Spec (Agent) ---

    def role(self, r: str) -> ManifestBuilder:
        self._spec["role"] = r
        return self

    def llm(self, config: LLMConfig) -> ManifestBuilder:
        self._spec["llm"] = config.model_dump(by_alias=True, exclude_none=True)
        return self

    def add_tool(self, tool: Tool) -> ManifestBuilder:
        if "tools" not in self._spec:
            self._spec["tools"] = []
        self._spec["tools"].append(tool.model_dump(exclude_none=True))
        return self

    def tools(self, tools: List[Tool]) -> ManifestBuilder:
        self._spec["tools"] = [t.model_dump(exclude_none=True) for t in tools]
        return self

    # --- v0.5 Top-level ---

    def security(self, sec: SecurityPosture) -> ManifestBuilder:
        self._security = sec
        return self

    def governance(self, gov: Governance) -> ManifestBuilder:
        self._governance = gov
        return self

    def protocols(self, proto: ProtocolDeclarations) -> ManifestBuilder:
        self._protocols = proto
        return self

    def token_efficiency(self, te: TokenEfficiency) -> ManifestBuilder:
        self._token_efficiency = te
        return self

    def cognition(self, cog: Cognition) -> ManifestBuilder:
        self._cognition = cog
        return self

    def extensions(self, ext: Dict[str, Any]) -> ManifestBuilder:
        self._extensions = ext
        return self

    # --- MCP shorthand ---

    def mcp_server(
        self, name: str, command: str, args: Optional[List[str]] = None,
        tools: Optional[List[str]] = None,
    ) -> ManifestBuilder:
        server = MCPServer(name=name, transport="stdio", command=command, args=args, tools=tools)
        if self._protocols is None:
            self._protocols = ProtocolDeclarations(
                mcp=MCPProtocol(version="1.0.0", role="server", servers=[server])
            )
        elif self._protocols.mcp is None:
            self._protocols.mcp = MCPProtocol(version="1.0.0", role="server", servers=[server])
        elif self._protocols.mcp.servers is None:
            self._protocols.mcp.servers = [server]
        else:
            self._protocols.mcp.servers.append(server)
        return self

    # --- A2A shorthand ---

    def a2a_endpoint(self, endpoint: str, skills: Optional[List[Dict[str, str]]] = None) -> ManifestBuilder:
        a2a = A2AProtocol(
            version="0.2.0",
            endpoint=endpoint,
            agent_card={"name": self._name, "skills": skills or []},
        )
        if self._protocols is None:
            self._protocols = ProtocolDeclarations(a2a=a2a)
        else:
            self._protocols.a2a = a2a
        return self

    # --- Build ---

    def build(self) -> OSSAManifest:
        metadata = Metadata(
            name=self._name,
            version=self._version,
            namespace=self._namespace,
            description=self._description,
            labels=self._labels or None,
            annotations=self._annotations or None,
            identity=self._identity,
            agentType=self._agent_type,
            agentKind=self._agent_kind,
        )

        return OSSAManifest(
            apiVersion="ossa/v0.5",
            kind=self._kind,
            metadata=metadata,
            spec=self._spec or None,
            security=self._security,
            governance=self._governance,
            protocols=self._protocols,
            token_efficiency=self._token_efficiency,
            cognition=self._cognition,
            extensions=self._extensions,
        )
