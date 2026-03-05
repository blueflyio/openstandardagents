"""Manifest validation against OSSA schema and rules."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import jsonschema

from .exceptions import SchemaError, ValidationError
from .types import OSSAManifest


@dataclass
class ValidationResult:
    """Result of manifest validation."""
    valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    @property
    def is_valid(self) -> bool:
        return self.valid


def validate(
    manifest: Union[OSSAManifest, Dict[str, Any]],
    schema_path: Optional[Union[str, Path]] = None,
    strict: bool = False,
) -> ValidationResult:
    """Validate an OSSA manifest.

    Runs structural validation (Pydantic) and optional JSON Schema validation.
    """
    errors: List[str] = []
    warnings: List[str] = []

    if isinstance(manifest, dict):
        try:
            manifest = OSSAManifest.model_validate(manifest)
        except Exception as e:
            return ValidationResult(valid=False, errors=[f"Structure validation: {e}"])

    if not manifest.apiVersion:
        errors.append("apiVersion is required")
    elif not manifest.apiVersion.startswith("ossa/"):
        errors.append(f"apiVersion must start with 'ossa/', got: {manifest.apiVersion}")

    if not manifest.metadata.name:
        errors.append("metadata.name is required")

    if manifest.is_agent() and manifest.spec:
        spec = manifest.spec
        if not spec.get("role"):
            warnings.append("Agent should have spec.role defined")
        if not spec.get("llm"):
            warnings.append("Agent should have spec.llm configured")

        llm = spec.get("llm")
        if llm and isinstance(llm, dict):
            provider = llm.get("provider")
            valid_providers = [
                "anthropic", "openai", "azure", "google", "bedrock", "groq", "ollama",
            ]
            if provider and provider not in valid_providers:
                warnings.append(f"Unknown LLM provider: {provider}")

    if schema_path:
        schema_errors = _validate_json_schema(manifest, schema_path)
        errors.extend(schema_errors)

    if strict:
        errors.extend(warnings)
        warnings = []

    return ValidationResult(valid=len(errors) == 0, errors=errors, warnings=warnings)


def validate_or_raise(
    manifest: Union[OSSAManifest, Dict[str, Any]],
    schema_path: Optional[Union[str, Path]] = None,
) -> OSSAManifest:
    """Validate and return manifest, or raise ValidationError."""
    if isinstance(manifest, dict):
        manifest = OSSAManifest.model_validate(manifest)
    result = validate(manifest, schema_path)
    if not result.valid:
        raise ValidationError(result.errors, result.warnings)
    return manifest


def _validate_json_schema(manifest: OSSAManifest, schema_path: Union[str, Path]) -> List[str]:
    path = Path(schema_path)
    if not path.exists():
        raise SchemaError(f"Schema file not found: {path}")

    try:
        schema = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        raise SchemaError(f"Failed to load schema: {e}") from e

    data = manifest.model_dump(by_alias=True, exclude_none=True)
    validator_inst = jsonschema.Draft7Validator(schema)

    errors: List[str] = []
    for error in validator_inst.iter_errors(data):
        path_str = ".".join(str(p) for p in error.absolute_path) if error.absolute_path else "root"
        errors.append(f"{path_str}: {error.message}")
    return errors
