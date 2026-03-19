"""Tests for ossa.types — Pydantic models, Kind enum, is_agent/is_task/is_workflow."""

import pytest
from pydantic import ValidationError as PydanticValidationError

from ossa.types import (
    AccessTier,
    AgentIdentity,
    Cognition,
    Governance,
    Guardrails,
    Kind,
    LLMConfig,
    LLMProvider,
    Metadata,
    OSSAManifest,
    AgentManifest,
    TaskManifest,
    WorkflowManifest,
    ProtocolDeclarations,
    Publisher,
    Safety,
    SecurityPosture,
    SecurityTier,
    TokenEfficiency,
    Tool,
    ToolHandler,
)


class TestKindEnum:
    """Tests for Kind enum values."""

    def test_kind_values(self) -> None:
        assert Kind.AGENT.value == "Agent"
        assert Kind.TASK.value == "Task"
        assert Kind.WORKFLOW.value == "Workflow"
        assert Kind.FLOW.value == "Flow"

    def test_kind_from_string(self) -> None:
        assert Kind("Agent") == Kind.AGENT
        assert Kind("Task") == Kind.TASK

    def test_kind_invalid(self) -> None:
        with pytest.raises(ValueError):
            Kind("Invalid")


class TestLLMProviderEnum:
    """Tests for LLMProvider enum."""

    def test_all_providers(self) -> None:
        expected = {"anthropic", "openai", "azure", "google", "bedrock", "groq", "ollama"}
        actual = {p.value for p in LLMProvider}
        assert actual == expected


class TestSecurityTierEnum:
    """Tests for SecurityTier enum."""

    def test_tiers(self) -> None:
        assert SecurityTier.OFFICIAL.value == "official"
        assert SecurityTier.COMMUNITY.value == "community"
        assert SecurityTier.EXPERIMENTAL.value == "experimental"


class TestMetadata:
    """Tests for Metadata model."""

    def test_minimal_metadata(self) -> None:
        m = Metadata(name="my-agent")
        assert m.name == "my-agent"
        assert m.version is None
        assert m.labels is None

    def test_full_metadata(self) -> None:
        m = Metadata(
            name="my-agent",
            version="2.0.0",
            namespace="prod",
            description="A test agent",
            labels={"env": "production"},
            annotations={"author": "test"},
        )
        assert m.version == "2.0.0"
        assert m.namespace == "prod"
        assert m.labels["env"] == "production"

    def test_metadata_requires_name(self) -> None:
        with pytest.raises(PydanticValidationError):
            Metadata()  # type: ignore[call-arg]

    def test_metadata_identity(self) -> None:
        pub = Publisher(name="BlueFly", email="test@example.com")
        ident = AgentIdentity(namespace="prod", publisher=pub)
        m = Metadata(name="agent", identity=ident)
        assert m.identity.publisher.name == "BlueFly"

    def test_metadata_x_signature_alias(self) -> None:
        m = Metadata(name="agent", **{"x-signature": {"alg": "Ed25519"}})
        assert m.x_signature == {"alg": "Ed25519"}


class TestLLMConfig:
    """Tests for LLMConfig model."""

    def test_minimal_llm(self) -> None:
        c = LLMConfig(provider="anthropic", model="claude-sonnet-4-20250514")
        assert c.provider == "anthropic"
        assert c.temperature is None

    def test_full_llm(self) -> None:
        c = LLMConfig(
            provider="openai",
            model="gpt-4o",
            temperature=0.5,
            max_tokens=2048,
            top_p=0.9,
            profile="fast",
        )
        assert c.temperature == 0.5
        assert c.max_tokens == 2048
        assert c.profile == "fast"

    def test_llm_max_tokens_alias(self) -> None:
        c = LLMConfig(provider="openai", model="gpt-4o", maxTokens=1024)
        assert c.max_tokens == 1024


class TestTool:
    """Tests for Tool model."""

    def test_minimal_tool(self) -> None:
        t = Tool(name="search")
        assert t.name == "search"
        assert t.type is None

    def test_full_tool(self) -> None:
        t = Tool(
            name="api_call",
            type="http",
            description="Call an API",
            handler=ToolHandler(runtime="node", endpoint="https://api.example.com"),
            parameters={"query": {"type": "string"}},
            permissions=["network:read"],
        )
        assert t.handler.endpoint == "https://api.example.com"
        assert t.permissions == ["network:read"]


class TestOSSAManifest:
    """Tests for OSSAManifest model."""

    def test_minimal_manifest(self) -> None:
        m = OSSAManifest(
            apiVersion="ossa/v0.5",
            kind=Kind.AGENT,
            metadata=Metadata(name="test"),
        )
        assert m.apiVersion == "ossa/v0.5"
        assert m.spec is None
        assert m.security is None

    def test_is_agent(self) -> None:
        m = OSSAManifest(apiVersion="ossa/v0.5", kind=Kind.AGENT, metadata=Metadata(name="a"))
        assert m.is_agent() is True
        assert m.is_task() is False
        assert m.is_workflow() is False

    def test_is_task(self) -> None:
        m = OSSAManifest(apiVersion="ossa/v0.5", kind=Kind.TASK, metadata=Metadata(name="t"))
        assert m.is_agent() is False
        assert m.is_task() is True
        assert m.is_workflow() is False

    def test_is_workflow(self) -> None:
        m = OSSAManifest(apiVersion="ossa/v0.5", kind=Kind.WORKFLOW, metadata=Metadata(name="w"))
        assert m.is_agent() is False
        assert m.is_task() is False
        assert m.is_workflow() is True

    def test_manifest_with_security(self) -> None:
        m = OSSAManifest(
            apiVersion="ossa/v0.5",
            kind=Kind.AGENT,
            metadata=Metadata(name="secure"),
            security=SecurityPosture(tier="signed", data_classification="internal"),
        )
        assert m.security.tier == "signed"

    def test_manifest_with_protocols(self) -> None:
        m = OSSAManifest(
            apiVersion="ossa/v0.5",
            kind=Kind.AGENT,
            metadata=Metadata(name="proto"),
            protocols=ProtocolDeclarations(),
        )
        assert m.protocols is not None

    def test_manifest_with_extensions(self) -> None:
        m = OSSAManifest(
            apiVersion="ossa/v0.5",
            kind=Kind.AGENT,
            metadata=Metadata(name="ext"),
            extensions={"custom": "value"},
        )
        assert m.extensions["custom"] == "value"

    def test_manifest_requires_api_version(self) -> None:
        with pytest.raises(PydanticValidationError):
            OSSAManifest(kind=Kind.AGENT, metadata=Metadata(name="test"))  # type: ignore[call-arg]

    def test_manifest_requires_kind(self) -> None:
        with pytest.raises(PydanticValidationError):
            OSSAManifest(apiVersion="ossa/v0.5", metadata=Metadata(name="test"))  # type: ignore[call-arg]

    def test_manifest_requires_metadata(self) -> None:
        with pytest.raises(PydanticValidationError):
            OSSAManifest(apiVersion="ossa/v0.5", kind=Kind.AGENT)  # type: ignore[call-arg]


class TestTypeAliases:
    """Test that type aliases resolve to OSSAManifest."""

    def test_agent_manifest_alias(self) -> None:
        assert AgentManifest is OSSAManifest

    def test_task_manifest_alias(self) -> None:
        assert TaskManifest is OSSAManifest

    def test_workflow_manifest_alias(self) -> None:
        assert WorkflowManifest is OSSAManifest


class TestModelDump:
    """Test Pydantic serialization."""

    def test_model_dump_excludes_none(self) -> None:
        m = OSSAManifest(
            apiVersion="ossa/v0.5",
            kind=Kind.AGENT,
            metadata=Metadata(name="test"),
        )
        d = m.model_dump(exclude_none=True)
        assert "security" not in d
        assert "protocols" not in d
        assert d["metadata"]["name"] == "test"

    def test_model_dump_by_alias(self) -> None:
        c = LLMConfig(provider="openai", model="gpt-4o", max_tokens=1000)
        d = c.model_dump(by_alias=True, exclude_none=True)
        assert "maxTokens" in d
        assert d["maxTokens"] == 1000
