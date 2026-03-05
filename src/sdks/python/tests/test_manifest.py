"""Tests for ossa.manifest — load, load_string, save, export, roundtrip."""

import json
from pathlib import Path

import pytest
import yaml

from ossa.manifest import load, load_string, save, export
from ossa.types import Kind, OSSAManifest
from ossa.exceptions import OSSAError

from conftest import (
    FULL_AGENT_DICT,
    FULL_AGENT_YAML,
    MINIMAL_AGENT_DICT,
    MINIMAL_AGENT_YAML,
    TASK_YAML,
)


class TestLoad:
    """Tests for load() from file path and dict."""

    def test_load_yaml_file(self, tmp_path: Path) -> None:
        p = tmp_path / "agent.ossa.yaml"
        p.write_text(FULL_AGENT_YAML)

        m = load(p)

        assert m.apiVersion == "ossa/v0.5"
        assert m.kind == Kind.AGENT
        assert m.metadata.name == "full-agent"
        assert m.spec is not None
        assert m.spec["llm"]["provider"] == "anthropic"

    def test_load_json_file(self, tmp_path: Path) -> None:
        p = tmp_path / "agent.ossa.json"
        p.write_text(json.dumps(FULL_AGENT_DICT))

        m = load(p)

        assert m.metadata.name == "full-agent"
        assert m.kind == Kind.AGENT

    def test_load_from_dict(self) -> None:
        m = load(MINIMAL_AGENT_DICT)

        assert m.metadata.name == "test-agent"
        assert m.kind == Kind.AGENT

    def test_load_nonexistent_file(self, tmp_path: Path) -> None:
        with pytest.raises(OSSAError, match="not found"):
            load(tmp_path / "missing.yaml")

    def test_load_from_string_path(self, tmp_path: Path) -> None:
        p = tmp_path / "agent.yaml"
        p.write_text(MINIMAL_AGENT_YAML)

        m = load(str(p))
        assert m.metadata.name == "test-agent"

    def test_load_task_manifest(self, tmp_path: Path) -> None:
        p = tmp_path / "task.yaml"
        p.write_text(TASK_YAML)

        m = load(p)
        assert m.kind == Kind.TASK
        assert m.metadata.name == "test-task"


class TestLoadString:
    """Tests for load_string()."""

    def test_load_yaml_string(self) -> None:
        m = load_string(FULL_AGENT_YAML, format="yaml")
        assert m.metadata.name == "full-agent"

    def test_load_json_string(self) -> None:
        s = json.dumps(FULL_AGENT_DICT)
        m = load_string(s, format="json")
        assert m.metadata.name == "full-agent"

    def test_load_yaml_is_default_format(self) -> None:
        m = load_string(MINIMAL_AGENT_YAML)
        assert m.metadata.name == "test-agent"

    def test_load_invalid_yaml_raises(self) -> None:
        with pytest.raises(OSSAError, match="Failed to parse"):
            load_string(":::bad yaml:::", format="yaml")

    def test_load_invalid_json_raises(self) -> None:
        with pytest.raises(OSSAError, match="Failed to parse"):
            load_string("{broken", format="json")

    def test_load_non_mapping_raises(self) -> None:
        with pytest.raises(OSSAError, match="mapping"):
            load_string("- a list\n- not a mapping", format="yaml")

    def test_load_string_missing_required_field(self) -> None:
        bad = "apiVersion: ossa/v0.5\nkind: Agent\n"
        with pytest.raises(Exception):
            load_string(bad)


class TestSave:
    """Tests for save()."""

    def test_save_yaml(self, full_manifest: OSSAManifest, tmp_path: Path) -> None:
        p = tmp_path / "out.yaml"
        save(full_manifest, p)

        assert p.exists()
        data = yaml.safe_load(p.read_text())
        assert data["metadata"]["name"] == "full-agent"

    def test_save_json(self, full_manifest: OSSAManifest, tmp_path: Path) -> None:
        p = tmp_path / "out.json"
        save(full_manifest, p)

        assert p.exists()
        data = json.loads(p.read_text())
        assert data["metadata"]["name"] == "full-agent"
        assert data["kind"] == "Agent"

    def test_save_creates_parent_dirs(self, minimal_manifest: OSSAManifest, tmp_path: Path) -> None:
        p = tmp_path / "sub" / "dir" / "agent.yaml"
        save(minimal_manifest, p)
        assert p.exists()

    def test_save_explicit_format_override(self, minimal_manifest: OSSAManifest, tmp_path: Path) -> None:
        p = tmp_path / "agent.yaml"
        save(minimal_manifest, p, format="json")

        data = json.loads(p.read_text())
        assert data["apiVersion"] == "ossa/v0.5"


class TestExport:
    """Tests for export()."""

    def test_export_yaml(self, full_manifest: OSSAManifest) -> None:
        out = export(full_manifest, "yaml")
        data = yaml.safe_load(out)
        assert data["apiVersion"] == "ossa/v0.5"
        assert data["kind"] == "Agent"

    def test_export_json(self, full_manifest: OSSAManifest) -> None:
        out = export(full_manifest, "json")
        data = json.loads(out)
        assert data["apiVersion"] == "ossa/v0.5"
        assert data["metadata"]["name"] == "full-agent"

    def test_export_unsupported_format(self, minimal_manifest: OSSAManifest) -> None:
        with pytest.raises(OSSAError, match="Unsupported"):
            export(minimal_manifest, "toml")

    def test_export_excludes_none(self, minimal_manifest: OSSAManifest) -> None:
        out = export(minimal_manifest, "json")
        data = json.loads(out)
        assert "security" not in data
        assert "protocols" not in data


class TestRoundtrip:
    """Test YAML/JSON roundtrip fidelity."""

    def test_yaml_roundtrip(self, full_manifest: OSSAManifest) -> None:
        yaml_str = export(full_manifest, "yaml")
        restored = load_string(yaml_str, format="yaml")

        assert restored.apiVersion == full_manifest.apiVersion
        assert restored.kind == full_manifest.kind
        assert restored.metadata.name == full_manifest.metadata.name
        assert restored.spec == full_manifest.spec

    def test_json_roundtrip(self, full_manifest: OSSAManifest) -> None:
        json_str = export(full_manifest, "json")
        restored = load_string(json_str, format="json")

        assert restored.metadata.name == full_manifest.metadata.name
        assert restored.spec == full_manifest.spec

    def test_file_roundtrip_yaml(self, full_manifest: OSSAManifest, tmp_path: Path) -> None:
        p = tmp_path / "roundtrip.yaml"
        save(full_manifest, p)
        restored = load(p)

        assert restored.metadata.name == full_manifest.metadata.name
        assert restored.kind == full_manifest.kind

    def test_file_roundtrip_json(self, full_manifest: OSSAManifest, tmp_path: Path) -> None:
        p = tmp_path / "roundtrip.json"
        save(full_manifest, p)
        restored = load(p)

        assert restored.metadata.name == full_manifest.metadata.name
        assert restored.spec == full_manifest.spec
