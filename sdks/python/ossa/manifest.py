"""
Core manifest operations: load, validate, and export.

This module provides the main API for working with OSSA manifests in Python.
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, Literal, Optional, Union

import yaml
from pydantic import ValidationError

from .exceptions import (
    ManifestNotFoundError,
    ManifestParseError,
    ManifestValidationError,
    UnsupportedFormatError,
)
from .types import OSSAManifest, ValidationResult
from .validator import validate_manifest as validate_schema


def load_manifest(path: Union[str, Path]) -> OSSAManifest:
    """
    Load and parse an OSSA manifest from a file.

    Args:
        path: Path to the manifest file (YAML or JSON)

    Returns:
        Parsed and validated OSSAManifest object

    Raises:
        ManifestNotFoundError: If the file doesn't exist
        ManifestParseError: If the file cannot be parsed
        ManifestValidationError: If the manifest is invalid

    Example:
        >>> from ossa import load_manifest
        >>> manifest = load_manifest("my-agent.ossa.yaml")
        >>> print(manifest.metadata.name)
        'my-agent'
    """
    path = Path(path)

    if not path.exists():
        raise ManifestNotFoundError(str(path))

    try:
        with open(path) as f:
            # Parse YAML or JSON
            if path.suffix in {".yaml", ".yml"}:
                # Process environment variables in YAML
                content = f.read()
                content = _expand_env_vars(content)
                data = yaml.safe_load(content)
            elif path.suffix == ".json":
                content = f.read()
                content = _expand_env_vars(content)
                data = json.loads(content)
            else:
                raise ManifestParseError(
                    str(path), f"Unsupported file extension: {path.suffix}"
                )
    except (yaml.YAMLError, json.JSONDecodeError) as e:
        raise ManifestParseError(str(path), str(e)) from e

    # Validate and parse with Pydantic
    try:
        manifest = OSSAManifest(**data)
    except ValidationError as e:
        errors = [f"{err['loc'][0]}: {err['msg']}" for err in e.errors()]
        raise ManifestValidationError(errors) from e

    return manifest


def validate_manifest(
    manifest: Union[OSSAManifest, Dict[str, Any], str, Path],
    schema_path: Optional[Path] = None,
    strict: bool = False,
) -> ValidationResult:
    """
    Validate an OSSA manifest.

    Performs multiple validation checks:
    1. Pydantic model validation (types, required fields)
    2. JSON schema validation (structure)
    3. Business logic validation (optional, if strict=True)

    Args:
        manifest: Manifest to validate (OSSAManifest, dict, or file path)
        schema_path: Optional path to local JSON schema directory
        strict: Enable strict validation (additional checks)

    Returns:
        ValidationResult with errors and warnings

    Example:
        >>> from ossa import validate_manifest
        >>> result = validate_manifest("my-agent.ossa.yaml")
        >>> if result.valid:
        ...     print("Valid!")
        ... else:
        ...     for error in result.errors:
        ...         print(f"Error: {error}")
    """
    errors: list[str] = []
    warnings: list[str] = []
    parsed_manifest: Optional[OSSAManifest] = None

    # Load manifest if it's a path
    if isinstance(manifest, (str, Path)):
        try:
            parsed_manifest = load_manifest(manifest)
            manifest_dict = json.loads(parsed_manifest.model_dump_json())
        except ManifestNotFoundError as e:
            errors.append(str(e))
            return ValidationResult(valid=False, errors=errors, warnings=warnings)
        except ManifestValidationError as e:
            errors.extend(e.errors)
            return ValidationResult(valid=False, errors=errors, warnings=warnings)
        except ManifestParseError as e:
            errors.append(str(e))
            return ValidationResult(valid=False, errors=errors, warnings=warnings)
    elif isinstance(manifest, OSSAManifest):
        parsed_manifest = manifest
        manifest_dict = json.loads(manifest.model_dump_json())
    else:
        manifest_dict = manifest

    # Validate against JSON schema
    try:
        schema_errors = validate_schema(manifest_dict, schema_path)
        errors.extend(schema_errors)
    except Exception as e:
        warnings.append(f"Schema validation skipped: {e}")

    # Strict validation checks
    if strict and parsed_manifest:
        strict_errors, strict_warnings = _strict_validation(parsed_manifest)
        errors.extend(strict_errors)
        warnings.extend(strict_warnings)

    return ValidationResult(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
        manifest=parsed_manifest,
    )


def export_manifest(
    manifest: OSSAManifest,
    format: Literal["yaml", "json", "python"] = "yaml",
    output_path: Optional[Union[str, Path]] = None,
) -> str:
    """
    Export an OSSA manifest to different formats.

    Args:
        manifest: The manifest to export
        format: Output format (yaml, json, or python)
        output_path: Optional path to write output (if None, returns string)

    Returns:
        Exported manifest as a string (if output_path is None)

    Raises:
        UnsupportedFormatError: If format is not supported

    Example:
        >>> from ossa import load_manifest, export_manifest
        >>> manifest = load_manifest("my-agent.ossa.yaml")
        >>> json_str = export_manifest(manifest, format="json")
        >>> print(json_str)
    """
    supported_formats = ["yaml", "json", "python"]

    if format not in supported_formats:
        raise UnsupportedFormatError(format, supported_formats)

    # Convert to dict
    data = json.loads(manifest.model_dump_json(exclude_none=True))

    # Generate output based on format
    if format == "yaml":
        output = yaml.safe_dump(data, sort_keys=False, default_flow_style=False)
    elif format == "json":
        output = json.dumps(data, indent=2)
    elif format == "python":
        output = _export_python(manifest)
    else:
        raise UnsupportedFormatError(format, supported_formats)

    # Write to file if path provided
    if output_path:
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            f.write(output)

    return output


def _expand_env_vars(content: str) -> str:
    """
    Expand environment variables in manifest content.

    Supports syntax: ${VAR_NAME:-default_value}

    Args:
        content: Raw manifest content

    Returns:
        Content with expanded environment variables
    """
    import re

    def replace_var(match: re.Match[str]) -> str:
        var_name = match.group(1)
        default = match.group(2) if match.group(2) else ""

        # Remove default value prefix if present
        if default.startswith(":-"):
            default = default[2:]

        return os.environ.get(var_name, default)

    # Pattern: ${VAR_NAME:-default}
    pattern = r"\$\{([A-Z_][A-Z0-9_]*)(?:(:-[^}]*))?\}"
    return re.sub(pattern, replace_var, content)


def _strict_validation(manifest: OSSAManifest) -> tuple[list[str], list[str]]:
    """
    Perform strict validation checks on a manifest.

    Args:
        manifest: Parsed manifest

    Returns:
        Tuple of (errors, warnings)
    """
    errors: list[str] = []
    warnings: list[str] = []

    # Check for Agent-specific validations
    if manifest.is_agent:
        spec = manifest.spec
        if not hasattr(spec, "role") or not spec.role:
            errors.append("Agent must have a 'role' field defined")

        if hasattr(spec, "llm"):
            llm = spec.llm
            if llm.temperature and (llm.temperature < 0 or llm.temperature > 2):
                warnings.append(f"Unusual temperature value: {llm.temperature}")

    # Check metadata
    if not manifest.metadata.description:
        warnings.append("Consider adding a description to metadata")

    if not manifest.metadata.labels:
        warnings.append("Consider adding labels for better organization")

    return errors, warnings


def _export_python(manifest: OSSAManifest) -> str:
    """
    Export manifest as Python code.

    Args:
        manifest: Manifest to export

    Returns:
        Python code string
    """
    from textwrap import indent

    lines = [
        "from ossa import OSSAManifest, Metadata, AgentSpec, LLMConfig",
        "",
        "manifest = OSSAManifest(",
        f'    apiVersion="{manifest.apiVersion}",',
        f'    kind="{manifest.kind.value}",',
        "    metadata=Metadata(",
        f'        name="{manifest.metadata.name}",',
        f'        version="{manifest.metadata.version}",',
    ]

    if manifest.metadata.description:
        desc = manifest.metadata.description.replace('"', '\\"')
        lines.append(f'        description="{desc}",')

    lines.append("    ),")

    # Add spec (simplified for now)
    if manifest.is_agent:
        spec = manifest.spec
        lines.append("    spec=AgentSpec(")
        if hasattr(spec, "role") and spec.role:
            role = spec.role.replace('"', '\\"').replace("\n", "\\n")
            lines.append(f'        role="{role}",')

        if hasattr(spec, "llm"):
            llm = spec.llm
            lines.extend(
                [
                    "        llm=LLMConfig(",
                    f'            provider="{llm.provider}",',
                    f'            model="{llm.model}",',
                ]
            )
            if llm.temperature is not None:
                lines.append(f"            temperature={llm.temperature},")
            lines.append("        ),")

        lines.append("    ),")

    lines.append(")")

    return "\n".join(lines)
