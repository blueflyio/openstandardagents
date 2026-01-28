"""OSSA Manifest Operations - Load, save, and manipulate OSSA manifests."""

from pathlib import Path
from typing import Any, Optional, Union
import yaml

from .exceptions import OSSAError


class Manifest:
    """OSSA Manifest wrapper with fluent interface."""

    def __init__(
        self,
        api_version: str = "ossa/v0.3.3",
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
        import json
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


def load_manifest(path: Union[str, Path]) -> Manifest:
    """Load manifest from file."""
    path = Path(path)
    if not path.exists():
        raise OSSAError(f"File not found: {path}")

    try:
        content = path.read_text(encoding="utf-8")
        if path.suffix in (".yaml", ".yml"):
            data = yaml.safe_load(content)
        elif path.suffix == ".json":
            import json
            data = json.loads(content)
        else:
            try:
                data = yaml.safe_load(content)
            except yaml.YAMLError:
                import json
                data = json.loads(content)
        return Manifest.from_dict(data)
    except Exception as e:
        raise OSSAError(f"Failed to load manifest: {e}") from e
