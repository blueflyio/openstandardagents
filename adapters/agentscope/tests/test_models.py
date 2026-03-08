"""Tests for OSSA manifest Pydantic models."""
import pytest
from adapters.agentscope.models import (
    AgentScopeAgentClass,
    AgentScopeCapability,
    AgentScopeExtension,
    CompressionConfig,
    FormatterType,
    MemoryBackend,
    OrchestrationPattern,
    OSSAExtensions,
    OSSALLMConfig,
    OSSAManifest,
    OSSAMetadata,
    OSSASpec,
    OSSATool,
)


def test_minimal_manifest():
    """Minimal valid manifest — apiVersion, kind, metadata, and spec are required."""
    data = {
        "apiVersion": "ossa/v0.4.6",
        "kind": "Agent",
        "metadata": {"name": "test-agent"},
        "spec": {},
    }
    m = OSSAManifest.model_validate(data)
    assert m.metadata.name == "test-agent"
    assert m.apiVersion == "ossa/v0.4.6"
    assert m.kind == "Agent"
    assert m.spec.role is None
    assert m.spec.tools == []


def test_metadata_defaults():
    """Metadata fills in sensible defaults."""
    meta = OSSAMetadata.model_validate({"name": "my-agent"})
    assert meta.name == "my-agent"
    assert meta.version == "0.0.0"
    assert meta.agentType is None
    assert meta.labels == {}


def test_agentscope_extension_defaults():
    """AgentScopeExtension uses sensible defaults when no fields given."""
    ext = AgentScopeExtension.model_validate({})
    assert ext.agent_class == AgentScopeAgentClass.REACT
    assert ext.memory_backend == MemoryBackend.IN_MEMORY
    assert ext.max_iters == 10
    assert ext.version is None
    assert ext.capabilities == []
    assert ext.orchestration is None
    assert ext.formatter is None
    assert ext.compression is None
    assert ext.skill_dirs == []


def test_agentscope_extension_full():
    """AgentScopeExtension parses all known fields matching OSSA v0.4.6 schema."""
    ext = AgentScopeExtension.model_validate({
        "version": "1.0.16",
        "agent_class": "ReActAgent",
        "capabilities": ["rag", "parallel_tool_calls"],
        "memory_backend": "mem0",
        "orchestration": "msghub",
        "max_iters": 15,
        "formatter": "anthropic",
        "compression": {
            "enable": True,
            "trigger_threshold": 50000,
            "keep_recent": 5,
        },
        "skill_dirs": ["./skills/"],
    })
    assert ext.agent_class == AgentScopeAgentClass.REACT
    assert ext.memory_backend == MemoryBackend.MEM0
    assert ext.max_iters == 15
    assert ext.version == "1.0.16"
    assert ext.capabilities == [AgentScopeCapability.RAG, AgentScopeCapability.PARALLEL_TOOL_CALLS]
    assert ext.orchestration == OrchestrationPattern.MSGHUB
    assert ext.formatter == FormatterType.ANTHROPIC
    assert ext.compression is not None
    assert ext.compression.enable is True
    assert ext.compression.trigger_threshold == 50000
    assert ext.compression.keep_recent == 5
    assert ext.skill_dirs == ["./skills/"]


def test_full_manifest_with_agentscope():
    """Full manifest with spec, tools, and extensions.agentscope."""
    data = {
        "apiVersion": "ossa/v0.4.6",
        "kind": "Agent",
        "metadata": {
            "name": "full-agent",
            "agentType": "agentscope",
            "version": "1.0.0",
            "description": "Test agent",
        },
        "spec": {
            "role": "You are a test agent",
            "llm": {
                "provider": "anthropic",
                "model": "claude-sonnet-4-20250514",
                "temperature": 0.7,
                "maxTokens": 4096,
            },
            "tools": [
                {
                    "type": "mcp",
                    "name": "test-tool",
                    "endpoint": "http://localhost:3000/mcp",
                }
            ],
        },
        "extensions": {
            "agentscope": {
                "agent_class": "ReActAgent",
                "memory_backend": "redis",
                "max_iters": 20,
            }
        },
    }
    m = OSSAManifest.model_validate(data)
    assert m.metadata.agentType == "agentscope"
    assert m.spec.llm.provider == "anthropic"
    assert len(m.spec.tools) == 1
    assert m.spec.tools[0].type == "mcp"
    assert m.extensions is not None
    assert m.extensions.agentscope is not None
    assert m.extensions.agentscope.agent_class == AgentScopeAgentClass.REACT
    assert m.extensions.agentscope.memory_backend == MemoryBackend.REDIS
    assert m.extensions.agentscope.max_iters == 20


def test_invalid_api_version():
    """Invalid apiVersion should fail validation."""
    with pytest.raises(Exception):
        OSSAManifest.model_validate({
            "apiVersion": "invalid",
            "kind": "Agent",
            "metadata": {"name": "bad"},
            "spec": {},
        })


def test_invalid_kind():
    """Non-Agent kind should fail validation."""
    with pytest.raises(Exception):
        OSSAManifest.model_validate({
            "apiVersion": "ossa/v0.4.6",
            "kind": "Invalid",
            "metadata": {"name": "bad"},
            "spec": {},
        })


def test_llm_config_aliases():
    """maxTokens and max_tokens both work via alias resolution."""
    config1 = OSSALLMConfig.model_validate({
        "provider": "openai",
        "model": "gpt-4",
        "maxTokens": 2048,
    })
    assert config1.maxTokens == 2048
    assert config1.resolved_max_tokens == 2048

    config2 = OSSALLMConfig.model_validate({
        "provider": "openai",
        "model": "gpt-4",
        "max_tokens": 1024,
    })
    assert config2.max_tokens == 1024
    assert config2.resolved_max_tokens == 1024


def test_llm_config_top_p_aliases():
    """topP and top_p both work."""
    config = OSSALLMConfig.model_validate({
        "provider": "anthropic",
        "model": "claude-sonnet-4-20250514",
        "topP": 0.9,
    })
    assert config.resolved_top_p == 0.9


def test_llm_config_defaults():
    """LLM config uses sensible defaults."""
    config = OSSALLMConfig.model_validate({
        "provider": "anthropic",
        "model": "claude-sonnet-4-20250514",
    })
    assert config.temperature == 0.7
    assert config.resolved_max_tokens == 4096


def test_tool_model():
    """Tool model parses MCP tool entries."""
    tool = OSSATool.model_validate({
        "type": "mcp",
        "name": "knowledge-base",
        "endpoint": "https://gkg.blueflyagents.com/mcp/sse",
        "description": "Knowledge graph tool",
    })
    assert tool.type == "mcp"
    assert tool.name == "knowledge-base"
    assert tool.endpoint == "https://gkg.blueflyagents.com/mcp/sse"


def test_memory_backend_enum():
    """All memory backend enum values match OSSA v0.4.6 schema shorthand."""
    assert MemoryBackend.IN_MEMORY.value == "in_memory"
    assert MemoryBackend.REDIS.value == "redis"
    assert MemoryBackend.SQLALCHEMY.value == "sqlalchemy"
    assert MemoryBackend.MEM0.value == "mem0"
    assert MemoryBackend.REME_PERSONAL.value == "reme_personal"
    assert MemoryBackend.REME_TASK.value == "reme_task"
    assert MemoryBackend.REME_TOOL.value == "reme_tool"


def test_agent_class_enum():
    """All agent class enum values match OSSA v0.4.6 schema."""
    assert AgentScopeAgentClass.REACT.value == "ReActAgent"
    assert AgentScopeAgentClass.USER.value == "UserAgent"
    assert AgentScopeAgentClass.A2A.value == "A2AAgent"
    assert AgentScopeAgentClass.REALTIME.value == "RealtimeAgent"
    assert AgentScopeAgentClass.CUSTOM.value == "custom"


def test_compression_config_defaults():
    """CompressionConfig has sensible defaults matching OSSA v0.4.6 schema."""
    cc = CompressionConfig.model_validate({})
    assert cc.enable is False
    assert cc.trigger_threshold is None
    assert cc.keep_recent == 3


def test_extensions_all_none():
    """OSSAExtensions with no sub-extensions."""
    ext = OSSAExtensions.model_validate({})
    assert ext.agentscope is None
    assert ext.a2a is None
    assert ext.buildkit is None


def test_extensions_dict_access():
    """OSSAExtensions supports dict-style access for generic code."""
    ext = OSSAExtensions.model_validate({
        "agentscope": {"agent_class": "ReActAgent"},
    })
    assert ext["agentscope"] is not None
    assert ext["agentscope"].agent_class == AgentScopeAgentClass.REACT
    assert "agentscope" in ext
    assert "a2a" not in ext  # None means not present
    with pytest.raises(KeyError):
        ext["nonexistent"]
