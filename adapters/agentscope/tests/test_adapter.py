"""Tests for the OSSA-to-AgentScope adapter (manifest loading only — no agentscope dependency needed).

The Pydantic models now use the OSSA v0.4.6 schema shorthand enum values
(e.g. ``mem0`` instead of ``Mem0LongTermMemory``), matching the example
manifest at examples/agentscope/react-assistant/agent.ossa.yaml.
"""
import pytest
import tempfile
import textwrap
from pathlib import Path
from adapters.agentscope.adapter import OSSAAgentScopeAdapter
from adapters.agentscope.models import (
    AgentScopeAgentClass,
    MemoryBackend,
    OSSAManifest,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

VALID_MANIFEST_YAML = textwrap.dedent("""\
    apiVersion: ossa/v0.4.6
    kind: Agent
    metadata:
      name: test-react-agent
      agentType: agentscope
      version: "1.0.0"
      description: "Test ReAct agent"
    spec:
      role: "You are a helpful test agent."
      llm:
        provider: anthropic
        model: claude-sonnet-4-20250514
        temperature: 0.7
        maxTokens: 4096
      tools:
        - type: mcp
          name: knowledge-base
          endpoint: https://gkg.blueflyagents.com/mcp/sse
          description: "Graph knowledge base"
        - type: mcp
          name: web-search
          endpoint: https://mcp.blueflyagents.com/api/mcp/sse
          description: "Web search"
    extensions:
      agentscope:
        agent_class: ReActAgent
        memory_backend: mem0
        max_iters: 10
""")


@pytest.fixture
def manifest_file(tmp_path: Path) -> Path:
    """Write a valid manifest to a temp file and return its path."""
    p = tmp_path / "agent.ossa.yaml"
    p.write_text(VALID_MANIFEST_YAML)
    return p


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_adapter_loads_manifest(manifest_file: Path):
    """Adapter can load and parse a valid OSSA manifest."""
    adapter = OSSAAgentScopeAdapter(manifest_file)
    manifest = adapter.load()
    assert manifest is not None
    assert manifest.metadata.name == "test-react-agent"
    assert manifest.metadata.agentType == "agentscope"


def test_adapter_manifest_property_before_load(manifest_file: Path):
    """Manifest property is None before load() is called."""
    adapter = OSSAAgentScopeAdapter(manifest_file)
    assert adapter.manifest is None


def test_adapter_manifest_property_after_load(manifest_file: Path):
    """Manifest property returns the manifest after load()."""
    adapter = OSSAAgentScopeAdapter(manifest_file)
    adapter.load()
    assert adapter.manifest is not None
    assert adapter.manifest.metadata.name == "test-react-agent"


def test_adapter_extracts_extension(manifest_file: Path):
    """Adapter reads AgentScope extension block via typed model."""
    adapter = OSSAAgentScopeAdapter(manifest_file)
    adapter.load()
    ext = adapter.manifest.extensions.agentscope
    assert ext is not None
    assert ext.agent_class == AgentScopeAgentClass.REACT
    assert ext.memory_backend == MemoryBackend.MEM0
    assert ext.max_iters == 10


def test_adapter_extracts_tools(manifest_file: Path):
    """Adapter reads MCP tool definitions from spec."""
    adapter = OSSAAgentScopeAdapter(manifest_file)
    adapter.load()
    tools = adapter.manifest.spec.tools
    assert len(tools) == 2
    assert all(t.type == "mcp" for t in tools)
    assert tools[0].name == "knowledge-base"
    assert tools[1].name == "web-search"


def test_adapter_extracts_llm_config(manifest_file: Path):
    """Adapter reads LLM configuration."""
    adapter = OSSAAgentScopeAdapter(manifest_file)
    adapter.load()
    llm = adapter.manifest.spec.llm
    assert llm.provider == "anthropic"
    assert "claude" in llm.model
    assert llm.temperature == 0.7
    assert llm.resolved_max_tokens == 4096


def test_adapter_extracts_role(manifest_file: Path):
    """Adapter reads the system prompt / role."""
    adapter = OSSAAgentScopeAdapter(manifest_file)
    adapter.load()
    assert "helpful test agent" in adapter.manifest.spec.role


def test_adapter_missing_file():
    """Adapter raises FileNotFoundError for a nonexistent manifest."""
    adapter = OSSAAgentScopeAdapter("/nonexistent/agent.ossa.yaml")
    with pytest.raises(FileNotFoundError):
        adapter.load()


def test_adapter_invalid_yaml(tmp_path: Path):
    """Adapter raises on invalid YAML content."""
    bad = tmp_path / "bad.yaml"
    bad.write_text("apiVersion: invalid\nkind: Agent\nmetadata:\n  name: x\nspec: {}")
    adapter = OSSAAgentScopeAdapter(bad)
    with pytest.raises(Exception, match="apiVersion must start with 'ossa/'"):
        adapter.load()


def test_adapter_env_resolution(tmp_path: Path, monkeypatch):
    """Adapter resolves ${VAR:-default} patterns in YAML."""
    monkeypatch.setenv("TEST_AGENT_NAME", "env-resolved-agent")
    yaml_content = textwrap.dedent("""\
        apiVersion: ossa/v0.4.6
        kind: Agent
        metadata:
          name: ${TEST_AGENT_NAME:-fallback-agent}
        spec:
          role: "Test agent"
    """)
    p = tmp_path / "env.ossa.yaml"
    p.write_text(yaml_content)
    adapter = OSSAAgentScopeAdapter(p)
    manifest = adapter.load()
    assert manifest.metadata.name == "env-resolved-agent"


def test_adapter_env_resolution_default(tmp_path: Path, monkeypatch):
    """Adapter uses default when env var is not set."""
    monkeypatch.delenv("NONEXISTENT_VAR_12345", raising=False)
    yaml_content = textwrap.dedent("""\
        apiVersion: ossa/v0.4.6
        kind: Agent
        metadata:
          name: ${NONEXISTENT_VAR_12345:-fallback-agent}
        spec:
          role: "Test agent"
    """)
    p = tmp_path / "env.ossa.yaml"
    p.write_text(yaml_content)
    adapter = OSSAAgentScopeAdapter(p)
    manifest = adapter.load()
    assert manifest.metadata.name == "fallback-agent"


def test_adapter_no_extensions(tmp_path: Path):
    """Adapter handles manifests without extensions block."""
    yaml_content = textwrap.dedent("""\
        apiVersion: ossa/v0.4.6
        kind: Agent
        metadata:
          name: no-ext-agent
        spec:
          role: "Minimal agent"
          llm:
            provider: openai
            model: gpt-4
    """)
    p = tmp_path / "minimal.ossa.yaml"
    p.write_text(yaml_content)
    adapter = OSSAAgentScopeAdapter(p)
    manifest = adapter.load()
    assert manifest.extensions is None


def test_adapter_fallback_configs(manifest_file: Path):
    """get_fallback_configs returns empty list when no fallbacks defined."""
    adapter = OSSAAgentScopeAdapter(manifest_file)
    adapter.load()
    assert adapter.get_fallback_configs() == []
