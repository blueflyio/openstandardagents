"""Validation utilities for UADP manifests and responses."""
from __future__ import annotations
import re
from .types import ValidationResult


def validate_manifest(manifest: dict) -> ValidationResult:
    """Validate a /.well-known/uadp.json manifest."""
    errors: list[str] = []
    warnings: list[str] = []

    if not isinstance(manifest, dict):
        return ValidationResult(valid=False, errors=["Manifest must be a JSON object"])

    pv = manifest.get("protocol_version")
    if not pv or not isinstance(pv, str):
        errors.append("protocol_version is required and must be a string")
    elif not re.match(r"^\d+\.\d+\.\d+$", pv):
        errors.append('protocol_version must be semver (e.g., "0.1.0")')

    if not manifest.get("node_name") or not isinstance(manifest.get("node_name"), str):
        errors.append("node_name is required and must be a string")

    ep = manifest.get("endpoints")
    if not ep or not isinstance(ep, dict):
        errors.append("endpoints is required and must be an object")
    else:
        if not ep.get("skills") and not ep.get("agents"):
            errors.append("endpoints must include at least one of: skills, agents")
        for key, val in ep.items():
            if not isinstance(val, str):
                errors.append(f"endpoints.{key} must be a string URL")

    if not manifest.get("node_description"):
        warnings.append("node_description is recommended")
    if not manifest.get("ossa_versions"):
        warnings.append("ossa_versions is recommended")

    return ValidationResult(valid=len(errors) == 0, errors=errors, warnings=warnings)


def validate_response(response: dict) -> ValidationResult:
    """Validate a UADP skills/agents response envelope."""
    errors: list[str] = []
    warnings: list[str] = []

    if not isinstance(response, dict):
        return ValidationResult(valid=False, errors=["Response must be a JSON object"])

    data = response.get("data")
    if not isinstance(data, list):
        errors.append("data must be an array")
    else:
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                errors.append(f"data[{i}] must be an object")
                continue
            if not item.get("apiVersion"):
                errors.append(f"data[{i}].apiVersion is required")
            if not item.get("kind"):
                errors.append(f"data[{i}].kind is required")
            meta = item.get("metadata")
            if not meta or not isinstance(meta, dict):
                errors.append(f"data[{i}].metadata is required")
            elif not meta.get("name"):
                errors.append(f"data[{i}].metadata.name is required")

    meta = response.get("meta")
    if not meta or not isinstance(meta, dict):
        errors.append("meta is required")
    else:
        if not isinstance(meta.get("total"), int):
            errors.append("meta.total must be a number")
        if not isinstance(meta.get("page"), int):
            errors.append("meta.page must be a number")
        if not isinstance(meta.get("limit"), int):
            errors.append("meta.limit must be a number")
        if not isinstance(meta.get("node_name"), str):
            errors.append("meta.node_name must be a string")

    return ValidationResult(valid=len(errors) == 0, errors=errors, warnings=warnings)
