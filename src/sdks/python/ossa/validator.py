"""
JSON Schema validation for OSSA manifests.

This module provides validation against the official OSSA JSON schemas,
ensuring manifests conform to the specification.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

import jsonschema
from jsonschema import Draft7Validator

from .exceptions import SchemaNotFoundError, SchemaValidationError


class SchemaValidator:
    """Validates OSSA manifests against JSON schemas."""

    # Built-in schema URLs for common versions
    SCHEMA_URLS = {
        "v0.3.0": "https://openstandardagents.org/schemas/v0.3.0/manifest.json",
        "v0.2.5": "https://openstandardagents.org/schemas/v0.2.5/manifest.json",
        "v0.2.2": "https://openstandardagents.org/schemas/v0.2.2/manifest.json",
    }

    def __init__(self, schema_path: Optional[Path] = None) -> None:
        """
        Initialize the schema validator.

        Args:
            schema_path: Optional path to local schema directory.
                        If not provided, uses built-in schema URLs.
        """
        self.schema_path = schema_path
        self._schema_cache: Dict[str, Dict[str, Any]] = {}

    def load_schema(self, version: str) -> Dict[str, Any]:
        """
        Load JSON schema for a specific OSSA version.

        Args:
            version: OSSA version (e.g., 'v0.3.0')

        Returns:
            Parsed JSON schema dictionary

        Raises:
            SchemaNotFoundError: If schema cannot be found
        """
        if version in self._schema_cache:
            return self._schema_cache[version]

        # Try loading from local path first
        if self.schema_path:
            schema_file = self.schema_path / f"ossa-{version}.schema.json"
            if schema_file.exists():
                with open(schema_file) as f:
                    schema = json.load(f)
                    self._schema_cache[version] = schema
                    return schema

        # Try loading from built-in URLs
        if version in self.SCHEMA_URLS:
            try:
                import requests

                response = requests.get(self.SCHEMA_URLS[version])
                response.raise_for_status()
                schema = response.json()
                self._schema_cache[version] = schema
                return schema
            except Exception as e:
                raise SchemaNotFoundError(version) from e

        raise SchemaNotFoundError(version)

    def validate(self, manifest: Dict[str, Any]) -> List[str]:
        """
        Validate a manifest against its schema.

        Args:
            manifest: Parsed manifest dictionary

        Returns:
            List of validation error messages (empty if valid)

        Raises:
            SchemaNotFoundError: If schema for manifest version not found
        """
        # Extract version from apiVersion field
        api_version = manifest.get("apiVersion", "")
        if not api_version.startswith("ossa/"):
            return [f"Invalid apiVersion format: {api_version}"]

        version = api_version.replace("ossa/", "")

        # Load appropriate schema
        try:
            schema = self.load_schema(version)
        except SchemaNotFoundError:
            # Try to find closest version
            closest = self._find_closest_version(version)
            if closest:
                schema = self.load_schema(closest)
            else:
                return [f"No schema available for version {version}"]

        # Validate against schema
        validator = Draft7Validator(schema)
        errors = []

        for error in sorted(validator.iter_errors(manifest), key=str):
            path = ".".join(str(p) for p in error.path) if error.path else "root"
            errors.append(f"{path}: {error.message}")

        return errors

    def _find_closest_version(self, version: str) -> Optional[str]:
        """
        Find the closest available schema version.

        Args:
            version: Requested version

        Returns:
            Closest available version or None
        """
        # Extract major.minor from version
        try:
            parts = version.lstrip("v").split(".")
            major, minor = int(parts[0]), int(parts[1])

            # Find closest version
            available = sorted(self.SCHEMA_URLS.keys(), reverse=True)
            for avail in available:
                avail_parts = avail.lstrip("v").split(".")
                avail_major, avail_minor = int(avail_parts[0]), int(avail_parts[1])

                if avail_major == major and avail_minor <= minor:
                    return avail

        except (ValueError, IndexError):
            pass

        return None


def validate_manifest(manifest: Dict[str, Any], schema_path: Optional[Path] = None) -> List[str]:
    """
    Validate a manifest against OSSA JSON schema.

    Args:
        manifest: Parsed manifest dictionary
        schema_path: Optional path to local schema directory

    Returns:
        List of validation error messages (empty if valid)

    Raises:
        SchemaNotFoundError: If schema cannot be found
    """
    validator = SchemaValidator(schema_path)
    return validator.validate(manifest)
