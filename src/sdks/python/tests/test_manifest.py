"""
Unit tests for OSSA manifest operations.
"""

import json
from pathlib import Path
from tempfile import TemporaryDirectory

import pytest
import yaml

from ossa import (
    AgentSpec,
    LLMConfig,
    ManifestNotFoundError,
    ManifestParseError,
    ManifestValidationError,
    Metadata,
    OSSAKind,
    OSSAManifest,
    export_manifest,
    load_manifest,
    validate_manifest,
)


# Test Data
VALID_AGENT_YAML = """
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: test-agent
  version: 1.0.0
  description: A test agent
  labels:
    environment: test
spec:
  role: "You are a test agent"
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.7
"""

INVALID_YAML = """
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: test-agent
  # Missing required version field
spec:
  # Missing required llm field
  role: "Test"
"""


class TestLoadManifest:
    """Tests for load_manifest function."""

    def test_load_valid_yaml(self, tmp_path: Path) -> None:
        """Test loading a valid YAML manifest."""
        manifest_path = tmp_path / "agent.ossa.yaml"
        manifest_path.write_text(VALID_AGENT_YAML)

        manifest = load_manifest(manifest_path)

        assert manifest.apiVersion == "ossa/v0.3.0"
        assert manifest.kind == OSSAKind.AGENT
        assert manifest.metadata.name == "test-agent"
        assert manifest.metadata.version == "1.0.0"
        assert manifest.spec.llm.provider == "anthropic"

    def test_load_valid_json(self, tmp_path: Path) -> None:
        """Test loading a valid JSON manifest."""
        data = yaml.safe_load(VALID_AGENT_YAML)
        manifest_path = tmp_path / "agent.ossa.json"
        manifest_path.write_text(json.dumps(data))

        manifest = load_manifest(manifest_path)

        assert manifest.metadata.name == "test-agent"
        assert manifest.kind == OSSAKind.AGENT

    def test_load_nonexistent_file(self, tmp_path: Path) -> None:
        """Test loading a file that doesn't exist."""
        with pytest.raises(ManifestNotFoundError) as exc_info:
            load_manifest(tmp_path / "nonexistent.yaml")

        assert "not found" in str(exc_info.value).lower()

    def test_load_invalid_yaml(self, tmp_path: Path) -> None:
        """Test loading invalid YAML."""
        manifest_path = tmp_path / "invalid.yaml"
        manifest_path.write_text("invalid: yaml: content: :")

        with pytest.raises(ManifestParseError):
            load_manifest(manifest_path)

    def test_load_invalid_schema(self, tmp_path: Path) -> None:
        """Test loading manifest with invalid schema."""
        manifest_path = tmp_path / "invalid.yaml"
        manifest_path.write_text(INVALID_YAML)

        with pytest.raises(ManifestValidationError) as exc_info:
            load_manifest(manifest_path)

        assert len(exc_info.value.errors) > 0

    def test_load_with_env_vars(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test loading manifest with environment variable substitution."""
        manifest_yaml = """
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: test-agent
  version: 1.0.0
spec:
  role: "Test"
  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4-20250514}
"""
        manifest_path = tmp_path / "agent.yaml"
        manifest_path.write_text(manifest_yaml)

        # Test with default values
        manifest = load_manifest(manifest_path)
        assert manifest.spec.llm.provider == "anthropic"
        assert manifest.spec.llm.model == "claude-sonnet-4-20250514"

        # Test with environment variable override
        monkeypatch.setenv("LLM_PROVIDER", "openai")
        monkeypatch.setenv("LLM_MODEL", "gpt-4o")

        manifest = load_manifest(manifest_path)
        assert manifest.spec.llm.provider == "openai"
        assert manifest.spec.llm.model == "gpt-4o"


class TestValidateManifest:
    """Tests for validate_manifest function."""

    def test_validate_valid_manifest(self, tmp_path: Path) -> None:
        """Test validating a valid manifest."""
        manifest_path = tmp_path / "agent.yaml"
        manifest_path.write_text(VALID_AGENT_YAML)

        result = validate_manifest(manifest_path)

        assert result.valid is True
        assert len(result.errors) == 0
        assert result.manifest is not None

    def test_validate_with_warnings(self, tmp_path: Path) -> None:
        """Test validation with warnings (missing optional fields)."""
        minimal_yaml = """
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: minimal-agent
  version: 1.0.0
spec:
  role: "Test"
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
"""
        manifest_path = tmp_path / "agent.yaml"
        manifest_path.write_text(minimal_yaml)

        result = validate_manifest(manifest_path, strict=True)

        assert result.valid is True
        assert result.has_warnings is True
        assert any("description" in w.lower() for w in result.warnings)

    def test_validate_dict(self) -> None:
        """Test validating a manifest dictionary."""
        data = yaml.safe_load(VALID_AGENT_YAML)
        result = validate_manifest(data)

        assert result.valid is True

    def test_validate_manifest_object(self) -> None:
        """Test validating an OSSAManifest object."""
        manifest = OSSAManifest(
            apiVersion="ossa/v0.3.0",
            kind=OSSAKind.AGENT,
            metadata=Metadata(name="test", version="1.0.0"),
            spec=AgentSpec(
                role="Test",
                llm=LLMConfig(provider="anthropic", model="claude-sonnet-4-20250514"),
            ),
        )

        result = validate_manifest(manifest)

        assert result.valid is True


class TestExportManifest:
    """Tests for export_manifest function."""

    def test_export_to_yaml(self) -> None:
        """Test exporting manifest to YAML."""
        manifest = OSSAManifest(
            apiVersion="ossa/v0.3.0",
            kind=OSSAKind.AGENT,
            metadata=Metadata(name="test", version="1.0.0"),
            spec=AgentSpec(
                role="Test",
                llm=LLMConfig(provider="anthropic", model="claude-sonnet-4-20250514"),
            ),
        )

        output = export_manifest(manifest, format="yaml")

        assert "apiVersion: ossa/v0.3.0" in output
        assert "kind: Agent" in output
        assert "name: test" in output

        # Ensure valid YAML
        parsed = yaml.safe_load(output)
        assert parsed["metadata"]["name"] == "test"

    def test_export_to_json(self) -> None:
        """Test exporting manifest to JSON."""
        manifest = OSSAManifest(
            apiVersion="ossa/v0.3.0",
            kind=OSSAKind.AGENT,
            metadata=Metadata(name="test", version="1.0.0"),
            spec=AgentSpec(
                role="Test",
                llm=LLMConfig(provider="anthropic", model="claude-sonnet-4-20250514"),
            ),
        )

        output = export_manifest(manifest, format="json")

        # Ensure valid JSON
        parsed = json.loads(output)
        assert parsed["metadata"]["name"] == "test"
        assert parsed["kind"] == "Agent"

    def test_export_to_python(self) -> None:
        """Test exporting manifest to Python code."""
        manifest = OSSAManifest(
            apiVersion="ossa/v0.3.0",
            kind=OSSAKind.AGENT,
            metadata=Metadata(name="test", version="1.0.0"),
            spec=AgentSpec(
                role="Test",
                llm=LLMConfig(provider="anthropic", model="claude-sonnet-4-20250514"),
            ),
        )

        output = export_manifest(manifest, format="python")

        assert "from ossa import" in output
        assert "OSSAManifest(" in output
        assert 'name="test"' in output

    def test_export_to_file(self, tmp_path: Path) -> None:
        """Test exporting manifest to a file."""
        manifest = OSSAManifest(
            apiVersion="ossa/v0.3.0",
            kind=OSSAKind.AGENT,
            metadata=Metadata(name="test", version="1.0.0"),
            spec=AgentSpec(
                role="Test",
                llm=LLMConfig(provider="anthropic", model="claude-sonnet-4-20250514"),
            ),
        )

        output_path = tmp_path / "exported.yaml"
        export_manifest(manifest, format="yaml", output_path=output_path)

        assert output_path.exists()
        content = output_path.read_text()
        assert "name: test" in content


class TestOSSAManifest:
    """Tests for OSSAManifest model."""

    def test_create_agent_manifest(self) -> None:
        """Test creating an Agent manifest."""
        manifest = OSSAManifest(
            apiVersion="ossa/v0.3.0",
            kind=OSSAKind.AGENT,
            metadata=Metadata(name="test", version="1.0.0"),
            spec=AgentSpec(
                role="Test",
                llm=LLMConfig(provider="anthropic", model="claude-sonnet-4-20250514"),
            ),
        )

        assert manifest.is_agent is True
        assert manifest.is_task is False
        assert manifest.is_workflow is False

    def test_version_validation(self) -> None:
        """Test semantic version validation."""
        # Valid version
        metadata = Metadata(name="test", version="1.0.0")
        assert metadata.version == "1.0.0"

        # Invalid version
        with pytest.raises(Exception):
            Metadata(name="test", version="invalid")

    def test_api_version_validation(self) -> None:
        """Test API version validation."""
        # Valid API version
        manifest = OSSAManifest(
            apiVersion="ossa/v0.3.0",
            kind=OSSAKind.AGENT,
            metadata=Metadata(name="test", version="1.0.0"),
            spec=AgentSpec(
                role="Test",
                llm=LLMConfig(provider="anthropic", model="claude-sonnet-4-20250514"),
            ),
        )
        assert manifest.apiVersion == "ossa/v0.3.0"

        # Invalid API version
        with pytest.raises(Exception):
            OSSAManifest(
                apiVersion="invalid",
                kind=OSSAKind.AGENT,
                metadata=Metadata(name="test", version="1.0.0"),
                spec=AgentSpec(
                    role="Test",
                    llm=LLMConfig(provider="anthropic", model="claude-sonnet-4-20250514"),
                ),
            )


class TestLLMConfig:
    """Tests for LLM configuration."""

    def test_temperature_validation(self) -> None:
        """Test temperature range validation."""
        # Valid temperature
        llm = LLMConfig(provider="anthropic", model="claude-sonnet-4-20250514", temperature=0.7)
        assert llm.temperature == 0.7

        # Temperature out of range
        with pytest.raises(Exception):
            LLMConfig(provider="anthropic", model="test", temperature=3.0)

    def test_default_temperature(self) -> None:
        """Test default temperature value."""
        llm = LLMConfig(provider="anthropic", model="claude-sonnet-4-20250514")
        assert llm.temperature == 0.7


# Fixtures for reusable test data
@pytest.fixture
def sample_manifest() -> OSSAManifest:
    """Provide a sample manifest for tests."""
    return OSSAManifest(
        apiVersion="ossa/v0.3.0",
        kind=OSSAKind.AGENT,
        metadata=Metadata(
            name="sample-agent",
            version="1.0.0",
            description="Sample agent for testing",
            labels={"test": "true"},
        ),
        spec=AgentSpec(
            role="You are a sample agent",
            llm=LLMConfig(
                provider="anthropic",
                model="claude-sonnet-4-20250514",
                temperature=0.7,
            ),
        ),
    )
