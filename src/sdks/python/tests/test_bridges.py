"""Tests for ossa.bridges — LangChain, CrewAI, OpenAI Agents config generation."""

import pytest

from ossa.bridges.langchain import to_langchain_config
from ossa.bridges.crewai import to_crewai_config
from ossa.bridges.openai_agents import to_openai_agents_config
from ossa.builders import LLMConfigBuilder, ManifestBuilder, ToolBuilder
from ossa.types import Kind, Metadata, OSSAManifest
from ossa.exceptions import ConfigurationError


def _agent_with_llm_and_tools(
    provider: str = "anthropic",
    model: str = "claude-sonnet-4-20250514",
    tools: bool = True,
) -> OSSAManifest:
    """Helper to build an agent manifest with LLM and optional tools."""
    builder = (
        ManifestBuilder.agent("test-agent")
        .version("1.0.0")
        .description("A test agent")
        .role("You are a helpful assistant.")
        .llm(LLMConfigBuilder(provider, model).temperature(0.7).max_tokens(4096).build())
    )
    if tools:
        builder = builder.add_tool(
            ToolBuilder.function("search")
            .description("Search the web")
            .params({"query": {"type": "string"}})
            .build()
        )
    return builder.build()


class TestLangChainBridge:
    """Tests for to_langchain_config()."""

    def test_basic_config(self) -> None:
        m = _agent_with_llm_and_tools()
        config = to_langchain_config(m)

        assert config["llm_class"] == "ChatAnthropic"
        assert config["llm_kwargs"]["model"] == "claude-sonnet-4-20250514"
        assert config["llm_kwargs"]["temperature"] == 0.7
        assert config["llm_kwargs"]["max_tokens"] == 4096
        assert config["system_message"] == "You are a helpful assistant."

    def test_provider_mapping(self) -> None:
        providers = {
            "anthropic": "ChatAnthropic",
            "openai": "ChatOpenAI",
            "azure": "AzureChatOpenAI",
            "google": "ChatGoogleGenerativeAI",
            "bedrock": "ChatBedrock",
            "groq": "ChatGroq",
            "ollama": "ChatOllama",
        }
        for provider, expected_class in providers.items():
            m = _agent_with_llm_and_tools(provider=provider, model="test-model")
            config = to_langchain_config(m)
            assert config["llm_class"] == expected_class, f"Failed for {provider}"

    def test_unknown_provider_defaults_to_openai(self) -> None:
        m = _agent_with_llm_and_tools(provider="custom")
        config = to_langchain_config(m)
        assert config["llm_class"] == "ChatOpenAI"

    def test_tools_in_config(self) -> None:
        m = _agent_with_llm_and_tools(tools=True)
        config = to_langchain_config(m)
        assert len(config["tools"]) == 1
        assert config["tools"][0]["name"] == "search"
        assert config["agent_type"] == "react"

    def test_no_tools_conversational(self) -> None:
        m = _agent_with_llm_and_tools(tools=False)
        config = to_langchain_config(m)
        assert config["tools"] == []
        assert config["agent_type"] == "conversational"

    def test_metadata_included(self) -> None:
        m = _agent_with_llm_and_tools()
        config = to_langchain_config(m)
        assert config["metadata"]["ossa_name"] == "test-agent"
        assert config["metadata"]["ossa_version"] == "1.0.0"

    def test_rejects_non_agent(self, task_manifest: OSSAManifest) -> None:
        with pytest.raises(ConfigurationError, match="Agent manifest"):
            to_langchain_config(task_manifest)

    def test_empty_spec(self) -> None:
        m = ManifestBuilder.agent("bare").build()
        config = to_langchain_config(m)
        assert config["system_message"] == ""
        assert config["tools"] == []


class TestCrewAIBridge:
    """Tests for to_crewai_config()."""

    def test_basic_config(self) -> None:
        m = _agent_with_llm_and_tools()
        config = to_crewai_config(m)

        assert config["role"] == "A test agent"  # uses description
        assert config["goal"] == "You are a helpful assistant."
        assert config["backstory"] == "You are a helpful assistant."
        assert config["llm"] == "claude-sonnet-4-20250514"  # anthropic = just model
        assert config["verbose"] is False

    def test_non_anthropic_provider_prefix(self) -> None:
        m = _agent_with_llm_and_tools(provider="openai", model="gpt-4o")
        config = to_crewai_config(m)
        assert config["llm"] == "openai/gpt-4o"

    def test_anthropic_no_prefix(self) -> None:
        m = _agent_with_llm_and_tools(provider="anthropic", model="claude-sonnet-4-20250514")
        config = to_crewai_config(m)
        assert config["llm"] == "claude-sonnet-4-20250514"

    def test_tools_in_config(self) -> None:
        m = _agent_with_llm_and_tools(tools=True)
        config = to_crewai_config(m)
        assert len(config["tools"]) == 1
        assert config["tools"][0]["name"] == "search"

    def test_allow_delegation_default(self) -> None:
        m = _agent_with_llm_and_tools()
        config = to_crewai_config(m)
        assert config["allow_delegation"] is True

    def test_metadata_included(self) -> None:
        m = _agent_with_llm_and_tools()
        config = to_crewai_config(m)
        assert config["metadata"]["ossa_name"] == "test-agent"

    def test_rejects_non_agent(self, workflow_manifest: OSSAManifest) -> None:
        with pytest.raises(ConfigurationError, match="Agent manifest"):
            to_crewai_config(workflow_manifest)

    def test_no_description_uses_name(self) -> None:
        m = ManifestBuilder.agent("bare-agent").role("test role").llm(
            LLMConfigBuilder.anthropic().build()
        ).build()
        config = to_crewai_config(m)
        assert config["role"] == "bare-agent"


class TestOpenAIAgentsBridge:
    """Tests for to_openai_agents_config()."""

    def test_basic_config(self) -> None:
        m = _agent_with_llm_and_tools(provider="openai", model="gpt-4o")
        config = to_openai_agents_config(m)

        assert config["name"] == "test-agent"
        assert config["instructions"] == "You are a helpful assistant."
        assert config["model"] == "gpt-4o"

    def test_default_model(self) -> None:
        m = ManifestBuilder.agent("bare").build()
        config = to_openai_agents_config(m)
        assert config["model"] == "gpt-4o"

    def test_tools_as_function_definitions(self) -> None:
        m = _agent_with_llm_and_tools(tools=True)
        config = to_openai_agents_config(m)

        assert len(config["tools"]) == 1
        tool = config["tools"][0]
        assert tool["type"] == "function"
        assert tool["function"]["name"] == "search"
        assert tool["function"]["description"] == "Search the web"
        assert "parameters" in tool["function"]

    def test_no_tools(self) -> None:
        m = _agent_with_llm_and_tools(tools=False)
        config = to_openai_agents_config(m)
        assert config["tools"] == []

    def test_guardrails_empty_by_default(self) -> None:
        m = _agent_with_llm_and_tools()
        config = to_openai_agents_config(m)
        assert config["guardrails"] == []

    def test_metadata_included(self) -> None:
        m = _agent_with_llm_and_tools()
        config = to_openai_agents_config(m)
        assert config["metadata"]["ossa_name"] == "test-agent"
        assert config["metadata"]["ossa_version"] == "ossa/v0.5"

    def test_rejects_non_agent(self, task_manifest: OSSAManifest) -> None:
        with pytest.raises(ConfigurationError, match="Agent manifest"):
            to_openai_agents_config(task_manifest)

    def test_tool_with_no_params_gets_default(self) -> None:
        m = (
            ManifestBuilder.agent("test")
            .role("test")
            .llm(LLMConfigBuilder.openai().build())
            .add_tool(ToolBuilder.function("no_params").description("No params").build())
            .build()
        )
        config = to_openai_agents_config(m)
        tool_params = config["tools"][0]["function"]["parameters"]
        assert tool_params == {"type": "object", "properties": {}}
