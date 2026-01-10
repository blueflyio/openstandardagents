"""OSSA Validator - Validate OSSA manifests against the schema."""

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional, Union

import yaml

from .exceptions import ValidationError


@dataclass
class ValidationResult:
    """Validation result."""
    valid: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def __bool__(self) -> bool:
        return self.valid

    def raise_if_invalid(self) -> None:
        if not self.valid:
            raise ValidationError(f"Validation failed: {'; '.join(self.errors)}")


class Validator:
    """OSSA Manifest Validator."""

    VALID_KINDS = {"Agent", "Task", "Workflow"}
    VALID_API_VERSION_PATTERN = r"^ossa/v\d+\.\d+\.\d+$"

    def __init__(self, schema_path: Optional[Union[str, Path]] = None):
        self._schema: Optional[dict[str, Any]] = None
        if schema_path:
            self._load_schema(Path(schema_path))

    def _load_schema(self, path: Path) -> None:
        if not path.exists():
            return
        content = path.read_text(encoding="utf-8")
        if path.suffix in (".yaml", ".yml"):
            self._schema = yaml.safe_load(content)
        else:
            import json
            self._schema = json.loads(content)

    def validate(self, manifest: Any) -> ValidationResult:
        """Validate a manifest."""
        errors: list[str] = []
        warnings: list[str] = []

        if hasattr(manifest, "to_dict"):
            data = manifest.to_dict()
        elif isinstance(manifest, dict):
            data = manifest
        else:
            return ValidationResult(valid=False, errors=["Manifest must be a dict or Manifest object"])

        # Required fields
        if not data.get("apiVersion"):
            errors.append("Missing apiVersion")
        elif not re.match(self.VALID_API_VERSION_PATTERN, data["apiVersion"]):
            errors.append(f"Invalid apiVersion: {data['apiVersion']}")

        if not data.get("kind"):
            errors.append("Missing kind")
        elif data["kind"] not in self.VALID_KINDS:
            errors.append(f"Invalid kind: {data['kind']}")

        if not data.get("metadata"):
            errors.append("Missing metadata")
        elif not data["metadata"].get("name"):
            errors.append("Missing metadata.name")

        if not data.get("spec"):
            errors.append("Missing spec")
        elif data.get("kind") == "Agent" and not data["spec"].get("role"):
            warnings.append("Agent should have spec.role")

        # JSON Schema validation
        if self._schema and not errors:
            try:
                import jsonschema
                jsonschema.validate(data, self._schema)
            except Exception as e:
                errors.append(f"Schema validation: {e}")

        # Best practice warnings
        if data.get("spec"):
            spec = data["spec"]
            if not spec.get("llm"):
                warnings.append("Best practice: Specify LLM configuration")
            if not spec.get("tools"):
                warnings.append("Best practice: Define tools/capabilities")

        return ValidationResult(valid=len(errors) == 0, errors=errors, warnings=warnings)


def validate_manifest(manifest: Any) -> ValidationResult:
    """Validate a manifest - convenience function."""
    return Validator().validate(manifest)
