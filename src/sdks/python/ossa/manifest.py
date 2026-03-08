"""Manifest loading, saving, and export."""

from __future__ import annotations

import json
import json as _json
from pathlib import Path
from typing import Any, Dict, Optional, Union

import yaml

from .exceptions import OSSAError
from .types import OSSAManifest


def _get_default_api_version() -> str:
    """Read current API version from .version.json (single source of truth)."""
    # Search upward from this file to find .version.json
    current = Path(__file__).resolve().parent
    for _ in range(10):
        candidate = current / ".version.json"
        if candidate.exists():
            data = _json.loads(candidate.read_text(encoding="utf-8"))
            return f"ossa/v{data['current']}"
        current = current.parent
    return "ossa/v0.5"  # safe fallback


_DEFAULT_API_VERSION = _get_default_api_version()


class Manifest:
    """OSSA Manifest wrapper with fluent interface."""

    def __init__(
        self,
        api_version: str = _DEFAULT_API_VERSION,
        kind: str = "Agent",
        metadata: Optional[dict[str, Any]] = None,
        spec: Optional[dict[str, Any]] = None,
    ):
        self._data: dict[str, Any] = {
            "apiVersion": api_version,
            "kind": kind,
            "metadata": metadata or {"name": "unnamed"},
            "spec": spec or {"role": "assistant"},
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Manifest":
        """Create manifest from dictionary."""
        instance = cls.__new__(cls)
        instance._data = data
        return instance

    @classmethod
    def from_file(cls, path: Union[str, Path]) -> "Manifest":
        """Load manifest from file."""
        return load_manifest(path)

    @property
    def api_version(self) -> str:
        return self._data.get("apiVersion", "")

    @property
    def kind(self) -> str:
        return self._data.get("kind", "")

    @property
    def metadata(self) -> dict[str, Any]:
        return self._data.get("metadata", {})

    @property
    def spec(self) -> dict[str, Any]:
        return self._data.get("spec", {})

    @property
    def name(self) -> str:
        return self.metadata.get("name", "")

    @property
    def version(self) -> Optional[str]:
        return self.metadata.get("version")

    def to_dict(self) -> dict[str, Any]:
        return self._data.copy()

    def to_yaml(self) -> str:
        return yaml.dump(self._data, default_flow_style=False, sort_keys=False)

    def to_json(self) -> str:
        return json.dumps(self._data, indent=2)

    def save(self, path: Union[str, Path], format: str = "yaml") -> None:
        """Save manifest to file."""
        path = Path(path)
        if format == "yaml":
            content = self.to_yaml()
        elif format == "json":
            content = self.to_json()
        else:
            raise OSSAError(f"Unsupported format: {format}")
        path.write_text(content, encoding="utf-8")

    def validate(self) -> "ValidationResult":
        """Validate this manifest."""
        from .validator import validate_manifest
        return validate_manifest(self)

    def __repr__(self) -> str:
        return f"Manifest(kind={self.kind!r}, name={self.name!r})"


def load(source: Union[str, Path, Dict[str, Any]]) -> OSSAManifest:
    """Load an OSSA manifest from file path, string, or dict."""
    if isinstance(source, dict):
        return OSSAManifest.model_validate(source)

    path = Path(source)
    if not path.exists():
        raise OSSAError(f"Manifest file not found: {path}")

    text = path.read_text(encoding="utf-8")
    return load_string(text, format=_detect_format(path))


def load_manifest(path: Union[str, Path]) -> Manifest:
    """Load manifest from file."""
    path = Path(path)
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
