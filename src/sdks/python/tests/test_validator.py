"""Tests for ossa.validator — validate, validate_or_raise, ValidationResult."""

import json
from pathlib import Path

import pytest

from ossa.validator import validate, validate_or_raise, ValidationResult
from ossa.types import Kind, Metadata, OSSAManifest
from ossa.exceptions import ValidationError, SchemaError

from _testdata import FULL_AGENT_DICT, MINIMAL_AGENT_DICT


class TestValidationResult:
    """Tests for the ValidationResult dataclass."""

    def test_valid_result(self) -> None:
        r = ValidationResult(valid=True)
        assert r.valid is True
        assert r.is_valid is True
        assert r.errors == []
        assert r.warnings == []

    def test_invalid_result(self) -> None:
        r = ValidationResult(valid=False, errors=["missing field"])
        assert r.valid is False
        assert r.is_valid is False
        assert len(r.errors) == 1

    def test_result_with_warnings(self) -> None:
        r = ValidationResult(valid=True, warnings=["optional field missing"])
        assert r.valid is True
        assert len(r.warnings) == 1


class TestValidate:
    """Tests for validate() function."""

    def test_validate_full_manifest(self, full_manifest: OSSAManifest) -> None:
        result = validate(full_manifest)
        assert result.valid is True
        assert result.errors == []

    def test_validate_minimal_manifest(self, minimal_manifest: OSSAManifest) -> None:
        result = validate(minimal_manifest)
        assert result.valid is True

    def test_validate_from_dict(self) -> None:
        result = validate(FULL_AGENT_DICT)
        assert result.valid is True

    def test_validate_invalid_dict_structure(self) -> None:
        result = validate({"apiVersion": "ossa/v0.5"})
        assert result.valid is False
        assert len(result.errors) > 0
        assert "Structure validation" in result.errors[0]

    def test_validate_bad_api_version_prefix(self) -> None:
        m = OSSAManifest(
            apiVersion="wrong/v1",
            kind=Kind.AGENT,
            metadata=Metadata(name="test"),
        )
        result = validate(m)
        assert result.valid is False
        assert any("ossa/" in e for e in result.errors)

    def test_validate_empty_api_version(self) -> None:
        m = OSSAManifest(
            apiVersion="",
            kind=Kind.AGENT,
            metadata=Metadata(name="test"),
        )
        result = validate(m)
        assert result.valid is False
        assert any("apiVersion" in e for e in result.errors)

    def test_validate_empty_name(self) -> None:
        m = OSSAManifest(
            apiVersion="ossa/v0.5",
            kind=Kind.AGENT,
            metadata=Metadata(name=""),
        )
        result = validate(m)
        assert result.valid is False
        assert any("name" in e for e in result.errors)

    def test_validate_agent_warns_missing_role(self) -> None:
        m = OSSAManifest(
            apiVersion="ossa/v0.5",
            kind=Kind.AGENT,
            metadata=Metadata(name="no-role"),
            spec={"llm": {"provider": "anthropic", "model": "test"}},
        )
        result = validate(m)
        assert result.valid is True
        assert any("role" in w for w in result.warnings)

    def test_validate_agent_warns_missing_llm(self) -> None:
        m = OSSAManifest(
            apiVersion="ossa/v0.5",
            kind=Kind.AGENT,
            metadata=Metadata(name="no-llm"),
            spec={"role": "test"},
        )
        result = validate(m)
        assert result.valid is True
        assert any("llm" in w for w in result.warnings)

    def test_validate_agent_warns_unknown_provider(self) -> None:
        m = OSSAManifest(
            apiVersion="ossa/v0.5",
            kind=Kind.AGENT,
            metadata=Metadata(name="bad-provider"),
            spec={
                "role": "test",
                "llm": {"provider": "nonexistent", "model": "x"},
            },
        )
        result = validate(m)
        assert result.valid is True
        assert any("Unknown LLM provider" in w for w in result.warnings)

    def test_validate_known_provider_no_warning(self) -> None:
        m = OSSAManifest(
            apiVersion="ossa/v0.5",
            kind=Kind.AGENT,
            metadata=Metadata(name="good"),
            spec={
                "role": "test",
                "llm": {"provider": "anthropic", "model": "claude-sonnet-4-20250514"},
            },
        )
        result = validate(m)
        assert result.valid is True
        assert not any("Unknown LLM provider" in w for w in result.warnings)


class TestStrictMode:
    """Tests for strict validation mode."""

    def test_strict_promotes_warnings_to_errors(self) -> None:
        m = OSSAManifest(
            apiVersion="ossa/v0.5",
            kind=Kind.AGENT,
            metadata=Metadata(name="no-spec"),
            spec={"role": "test"},  # has role but no llm -> warning
        )
        result = validate(m, strict=True)
        assert result.valid is False
        assert result.warnings == []
        assert len(result.errors) > 0

    def test_strict_valid_when_no_warnings(self) -> None:
        m = OSSAManifest(
            apiVersion="ossa/v0.5",
            kind=Kind.AGENT,
            metadata=Metadata(name="good"),
            spec={
                "role": "test",
                "llm": {"provider": "anthropic", "model": "claude-sonnet-4-20250514"},
            },
        )
        result = validate(m, strict=True)
        assert result.valid is True

    def test_non_agent_no_warnings(self) -> None:
        m = OSSAManifest(
            apiVersion="ossa/v0.5",
            kind=Kind.TASK,
            metadata=Metadata(name="task"),
        )
        result = validate(m, strict=True)
        assert result.valid is True


class TestValidateOrRaise:
    """Tests for validate_or_raise()."""

    def test_returns_manifest_on_valid(self) -> None:
        m = validate_or_raise(FULL_AGENT_DICT)
        assert isinstance(m, OSSAManifest)
        assert m.metadata.name == "full-agent"

    def test_raises_on_invalid(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            validate_or_raise({"apiVersion": "wrong", "kind": "Agent", "metadata": {"name": ""}})
        assert len(exc_info.value.errors) > 0

    def test_accepts_manifest_object(self, full_manifest: OSSAManifest) -> None:
        result = validate_or_raise(full_manifest)
        assert result.metadata.name == "full-agent"


class TestJsonSchemaValidation:
    """Tests for JSON Schema validation path."""

    def test_schema_file_not_found(self, full_manifest: OSSAManifest, tmp_path: Path) -> None:
        with pytest.raises(SchemaError, match="not found"):
            validate(full_manifest, schema_path=tmp_path / "missing.json")

    def test_invalid_schema_file(self, full_manifest: OSSAManifest, tmp_path: Path) -> None:
        bad_schema = tmp_path / "bad.json"
        bad_schema.write_text("not json")
        with pytest.raises(SchemaError, match="Failed to load"):
            validate(full_manifest, schema_path=bad_schema)

    def test_schema_validation_with_permissive_schema(
        self, full_manifest: OSSAManifest, tmp_path: Path
    ) -> None:
        schema = {"type": "object"}
        schema_path = tmp_path / "permissive.json"
        schema_path.write_text(json.dumps(schema))

        result = validate(full_manifest, schema_path=schema_path)
        assert result.valid is True

    def test_schema_validation_catches_violations(
        self, full_manifest: OSSAManifest, tmp_path: Path
    ) -> None:
        schema = {
            "type": "object",
            "required": ["nonexistentField"],
        }
        schema_path = tmp_path / "strict.json"
        schema_path.write_text(json.dumps(schema))

        result = validate(full_manifest, schema_path=schema_path)
        assert result.valid is False
        assert any("nonexistentField" in e for e in result.errors)
