"""Tests for ossa.builders — ManifestBuilder, ToolBuilder, LLMConfigBuilder, SecurityBuilder."""

import pytest

from ossa.builders import (
    LLMConfigBuilder,
    ManifestBuilder,
    SecurityBuilder,
    ToolBuilder,
)
from ossa.types import Kind, LLMConfig, OSSAManifest, SecurityPosture, Tool


class TestToolBuilder:
    """Tests for ToolBuilder fluent API."""

    def test_basic_function_tool(self) -> None:
        t = ToolBuilder("search").description("Search the web").build()
        assert isinstance(t, Tool)
        assert t.name == "search"
        assert t.type == "function"
        assert t.description == "Search the web"

    def test_mcp_tool(self) -> None:
        t = ToolBuilder.mcp("memory").description("Store memory").build()
        assert t.type == "mcp"
        assert t.name == "memory"

    def test_http_tool_with_handler(self) -> None:
        t = (
            ToolBuilder.http("api_call")
            .description("Call an API")
            .endpoint("https://api.example.com/v1")
            .method("POST")
            .build()
        )
        assert t.type == "http"
        assert t.handler is not None
        assert t.handler.endpoint == "https://api.example.com/v1"
        assert t.handler.method == "POST"

    def test_tool_with_runtime(self) -> None:
        t = ToolBuilder.function("run").runtime("python").build()
        assert t.handler.runtime == "python"

    def test_tool_with_params(self) -> None:
        params = {"query": {"type": "string"}, "limit": {"type": "integer"}}
        t = ToolBuilder("search").params(params).build()
        assert t.parameters == params

    def test_tool_with_permissions(self) -> None:
        t = ToolBuilder("write").with_permissions(["fs:write", "network:read"]).build()
        assert t.permissions == ["fs:write", "network:read"]

    def test_a2a_tool(self) -> None:
        t = ToolBuilder.a2a("delegate").build()
        assert t.type == "a2a"

    def test_webhook_tool(self) -> None:
        t = ToolBuilder.webhook("notify").build()
        assert t.type == "webhook"

    def test_kubernetes_tool(self) -> None:
        t = ToolBuilder.kubernetes("deploy").build()
        assert t.type == "kubernetes"

    def test_fluent_chaining(self) -> None:
        t = (
            ToolBuilder.http("full")
            .description("Full tool")
            .endpoint("https://example.com")
            .method("GET")
            .runtime("node")
            .params({"q": {"type": "string"}})
            .with_permissions(["read"])
            .build()
        )
        assert t.name == "full"
        assert t.handler.endpoint == "https://example.com"
        assert t.handler.method == "GET"
        assert t.handler.runtime == "node"
        assert t.parameters is not None
        assert t.permissions == ["read"]


class TestLLMConfigBuilder:
    """Tests for LLMConfigBuilder fluent API."""

    def test_anthropic_default(self) -> None:
        c = LLMConfigBuilder.anthropic().build()
        assert isinstance(c, LLMConfig)
        assert c.provider == "anthropic"
        assert c.model == "claude-sonnet-4-20250514"

    def test_openai_default(self) -> None:
        c = LLMConfigBuilder.openai().build()
        assert c.provider == "openai"
        assert c.model == "gpt-4o"

    def test_google_default(self) -> None:
        c = LLMConfigBuilder.google().build()
        assert c.provider == "google"
        assert c.model == "gemini-2.0-flash"

    def test_ollama_default(self) -> None:
        c = LLMConfigBuilder.ollama().build()
        assert c.provider == "ollama"
        assert c.model == "llama3"

    def test_azure_requires_model(self) -> None:
        c = LLMConfigBuilder.azure("gpt-4o-mini").build()
        assert c.provider == "azure"
        assert c.model == "gpt-4o-mini"

    def test_bedrock(self) -> None:
        c = LLMConfigBuilder.bedrock("anthropic.claude-v2").build()
        assert c.provider == "bedrock"

    def test_groq(self) -> None:
        c = LLMConfigBuilder.groq("llama3-70b").build()
        assert c.provider == "groq"

    def test_temperature(self) -> None:
        c = LLMConfigBuilder.anthropic().temperature(0.3).build()
        assert c.temperature == 0.3

    def test_max_tokens(self) -> None:
        c = LLMConfigBuilder.openai().max_tokens(2048).build()
        assert c.max_tokens == 2048

    def test_profile(self) -> None:
        c = LLMConfigBuilder.anthropic().profile("fast").build()
        assert c.profile == "fast"

    def test_full_chain(self) -> None:
        c = (
            LLMConfigBuilder.anthropic("claude-opus-4-20250514")
            .temperature(0.0)
            .max_tokens(8192)
            .profile("precise")
            .build()
        )
        assert c.model == "claude-opus-4-20250514"
        assert c.temperature == 0.0
        assert c.max_tokens == 8192
        assert c.profile == "precise"


class TestSecurityBuilder:
    """Tests for SecurityBuilder fluent API."""

    def test_empty_build(self) -> None:
        s = SecurityBuilder().build()
        assert isinstance(s, SecurityPosture)
        assert s.tier is None
        assert s.threat_model is None

    def test_tier(self) -> None:
        s = SecurityBuilder().tier("signed").build()
        assert s.tier == "signed"

    def test_threat(self) -> None:
        s = (
            SecurityBuilder()
            .threat("injection", "high", ["input validation"], "Prompt injection risk")
            .threat("data_leak", "medium", ["output filtering"])
            .build()
        )
        assert len(s.threat_model) == 2
        assert s.threat_model[0].category == "injection"
        assert s.threat_model[0].severity == "high"
        assert s.threat_model[1].description is None

    def test_capabilities(self) -> None:
        s = (
            SecurityBuilder()
            .require_capability("network:read")
            .require_capability("fs:write")
            .optional_capability("gpu:access")
            .build()
        )
        assert s.capabilities.required == ["network:read", "fs:write"]
        assert s.capabilities.optional == ["gpu:access"]

    def test_sandbox(self) -> None:
        s = SecurityBuilder().sandbox("container", memory="512m", cpu="0.5").build()
        assert s.sandboxing.required is True
        assert s.sandboxing.type == "container"
        assert s.sandboxing.resource_limits["memory"] == "512m"

    def test_network(self) -> None:
        s = SecurityBuilder().network(allowed=["api.example.com"], egress="allow-list").build()
        assert s.network_access.allowed_domains == ["api.example.com"]
        assert s.network_access.egress_policy == "allow-list"
        assert s.network_access.protocols == ["https"]

    def test_classify(self) -> None:
        s = SecurityBuilder().classify("confidential").build()
        assert s.data_classification == "confidential"

    def test_audit(self) -> None:
        s = SecurityBuilder().audit(
            log_inputs=True, log_outputs=True, log_tool_calls=True, retention_days=365
        ).build()
        assert s.audit.log_inputs is True
        assert s.audit.retention_days == 365

    def test_full_chain(self) -> None:
        s = (
            SecurityBuilder()
            .tier("verified-signature")
            .threat("injection", "high", ["sanitize"])
            .require_capability("network:read")
            .sandbox("container")
            .network(allowed=["*.example.com"])
            .classify("internal")
            .audit()
            .build()
        )
        assert s.tier == "verified-signature"
        assert len(s.threat_model) == 1
        assert s.sandboxing is not None
        assert s.data_classification == "internal"


class TestManifestBuilder:
    """Tests for ManifestBuilder fluent API."""

    def test_minimal_agent(self) -> None:
        m = ManifestBuilder.agent("my-agent").build()
        assert isinstance(m, OSSAManifest)
        assert m.apiVersion == "ossa/v0.5"
        assert m.kind == Kind.AGENT
        assert m.metadata.name == "my-agent"

    def test_task_builder(self) -> None:
        m = ManifestBuilder.task("my-task").build()
        assert m.kind == Kind.TASK

    def test_workflow_builder(self) -> None:
        m = ManifestBuilder.workflow("my-wf").build()
        assert m.kind == Kind.WORKFLOW

    def test_metadata_fields(self) -> None:
        m = (
            ManifestBuilder.agent("test")
            .version("1.0.0")
            .namespace("prod")
            .description("A test agent")
            .label("env", "production")
            .labels({"team": "platform"})
            .annotation("docs", "https://example.com")
            .agent_type("conversational")
            .agent_kind("assistant")
            .build()
        )
        assert m.metadata.version == "1.0.0"
        assert m.metadata.namespace == "prod"
        assert m.metadata.description == "A test agent"
        assert m.metadata.labels == {"env": "production", "team": "platform"}
        assert m.metadata.annotations == {"docs": "https://example.com"}
        assert m.metadata.agentType == "conversational"

    def test_role_and_llm(self) -> None:
        llm = LLMConfigBuilder.anthropic().temperature(0.7).build()
        m = (
            ManifestBuilder.agent("assistant")
            .role("You are a helpful assistant.")
            .llm(llm)
            .build()
        )
        assert m.spec["role"] == "You are a helpful assistant."
        assert m.spec["llm"]["provider"] == "anthropic"
        assert m.spec["llm"]["temperature"] == 0.7

    def test_add_tool(self) -> None:
        tool = ToolBuilder.mcp("search").description("Search").build()
        m = ManifestBuilder.agent("test").add_tool(tool).build()
        assert len(m.spec["tools"]) == 1
        assert m.spec["tools"][0]["name"] == "search"

    def test_add_multiple_tools(self) -> None:
        t1 = ToolBuilder.mcp("search").build()
        t2 = ToolBuilder.http("api").build()
        m = ManifestBuilder.agent("test").add_tool(t1).add_tool(t2).build()
        assert len(m.spec["tools"]) == 2

    def test_tools_list(self) -> None:
        tools = [ToolBuilder.function("a").build(), ToolBuilder.function("b").build()]
        m = ManifestBuilder.agent("test").tools(tools).build()
        assert len(m.spec["tools"]) == 2

    def test_security(self) -> None:
        sec = SecurityBuilder().tier("signed").classify("internal").build()
        m = ManifestBuilder.agent("secure").security(sec).build()
        assert m.security.tier == "signed"

    def test_publisher(self) -> None:
        m = (
            ManifestBuilder.agent("published")
            .publisher("BlueFly", "agents@bluefly.io", "https://bluefly.io")
            .build()
        )
        assert m.metadata.identity.publisher.name == "BlueFly"
        assert m.metadata.identity.publisher.email == "agents@bluefly.io"

    def test_mcp_server(self) -> None:
        m = (
            ManifestBuilder.agent("mcp-agent")
            .mcp_server("fs", "npx", args=["-y", "@modelcontextprotocol/server-filesystem"])
            .build()
        )
        assert m.protocols.mcp.servers[0].name == "fs"
        assert m.protocols.mcp.servers[0].transport == "stdio"

    def test_multiple_mcp_servers(self) -> None:
        m = (
            ManifestBuilder.agent("multi")
            .mcp_server("fs", "npx", args=["fs-server"])
            .mcp_server("db", "npx", args=["db-server"])
            .build()
        )
        assert len(m.protocols.mcp.servers) == 2

    def test_a2a_endpoint(self) -> None:
        m = (
            ManifestBuilder.agent("a2a-agent")
            .a2a_endpoint("https://agent.example.com/.well-known/agent.json")
            .build()
        )
        assert m.protocols.a2a.endpoint == "https://agent.example.com/.well-known/agent.json"

    def test_extensions(self) -> None:
        m = ManifestBuilder.agent("ext").extensions({"custom": {"key": "value"}}).build()
        assert m.extensions["custom"]["key"] == "value"

    def test_full_builder_chain(self) -> None:
        m = (
            ManifestBuilder.agent("full-agent")
            .version("2.0.0")
            .namespace("production")
            .description("A fully configured agent")
            .label("env", "prod")
            .role("You are a production assistant.")
            .llm(LLMConfigBuilder.anthropic().temperature(0.5).max_tokens(4096).build())
            .add_tool(ToolBuilder.mcp("search").description("Web search").build())
            .security(SecurityBuilder().tier("signed").classify("internal").audit().build())
            .publisher("BlueFly", "test@bluefly.io")
            .mcp_server("memory", "npx", args=["memory-server"])
            .build()
        )
        assert m.metadata.name == "full-agent"
        assert m.metadata.version == "2.0.0"
        assert m.spec["role"] == "You are a production assistant."
        assert m.spec["llm"]["provider"] == "anthropic"
        assert len(m.spec["tools"]) == 1
        assert m.security.tier == "signed"
        assert m.protocols.mcp.servers[0].name == "memory"

    def test_no_spec_when_empty(self) -> None:
        m = ManifestBuilder.agent("bare").build()
        assert m.spec is None
