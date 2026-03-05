"""Manifest loading, saving, and export."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Union

import yaml

from .exceptions import OSSAError
from .types import OSSAManifest


def load(source: Union[str, Path, Dict[str, Any]]) -> OSSAManifest:
    """Load an OSSA manifest from file path, string, or dict."""
    if isinstance(source, dict):
        return OSSAManifest.model_validate(source)

    path = Path(source)
    if not path.exists():
        raise OSSAError(f"Manifest file not found: {path}")

    text = path.read_text(encoding="utf-8")
    return load_string(text, format=_detect_format(path))


def load_string(content: str, format: str = "yaml") -> OSSAManifest:
    """Load manifest from a string."""
    try:
        if format == "json":
            data = json.loads(content)
        else:
            data = yaml.safe_load(content)
    except (json.JSONDecodeError, yaml.YAMLError) as e:
        raise OSSAError(f"Failed to parse manifest ({format}): {e}") from e

    if not isinstance(data, dict):
        raise OSSAError("Manifest must be a YAML/JSON mapping")

    return OSSAManifest.model_validate(data)


def save(manifest: OSSAManifest, path: Union[str, Path], format: str | None = None) -> None:
    """Save manifest to file."""
    path = Path(path)
    fmt = format or _detect_format(path)
    content = export(manifest, fmt)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def export(manifest: OSSAManifest, format: str = "yaml") -> str:
    """Export manifest to string (yaml or json)."""
    data = manifest.model_dump(mode="json", by_alias=True, exclude_none=True)

    if format == "json":
        return json.dumps(data, indent=2, default=str)
    elif format == "yaml":
        return yaml.dump(data, default_flow_style=False, sort_keys=False, allow_unicode=True)
    else:
        raise OSSAError(f"Unsupported export format: {format}")


def _detect_format(path: Path) -> str:
    return "json" if path.suffix.lower() == ".json" else "yaml"
