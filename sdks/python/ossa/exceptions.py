"""
Custom exceptions for OSSA SDK.

This module defines all exception types that can be raised by the SDK,
making error handling predictable and type-safe.
"""


class OSSAError(Exception):
    """Base exception for all OSSA SDK errors."""

    pass


class ManifestError(OSSAError):
    """Base exception for manifest-related errors."""

    pass


class ManifestNotFoundError(ManifestError):
    """Raised when a manifest file cannot be found."""

    def __init__(self, path: str) -> None:
        super().__init__(f"Manifest not found: {path}")
        self.path = path


class ManifestParseError(ManifestError):
    """Raised when a manifest cannot be parsed."""

    def __init__(self, path: str, reason: str) -> None:
        super().__init__(f"Failed to parse manifest {path}: {reason}")
        self.path = path
        self.reason = reason


class ManifestValidationError(ManifestError):
    """Raised when a manifest fails validation."""

    def __init__(self, errors: list[str]) -> None:
        error_msg = "\n".join(f"  - {e}" for e in errors)
        super().__init__(f"Manifest validation failed:\n{error_msg}")
        self.errors = errors


class SchemaError(OSSAError):
    """Base exception for schema-related errors."""

    pass


class SchemaNotFoundError(SchemaError):
    """Raised when a JSON schema cannot be found."""

    def __init__(self, version: str) -> None:
        super().__init__(f"Schema not found for version: {version}")
        self.version = version


class SchemaValidationError(SchemaError):
    """Raised when schema validation fails."""

    def __init__(self, errors: list[str]) -> None:
        error_msg = "\n".join(f"  - {e}" for e in errors)
        super().__init__(f"Schema validation failed:\n{error_msg}")
        self.errors = errors


class ExportError(OSSAError):
    """Raised when manifest export fails."""

    def __init__(self, format: str, reason: str) -> None:
        super().__init__(f"Failed to export to {format}: {reason}")
        self.format = format
        self.reason = reason


class UnsupportedFormatError(ExportError):
    """Raised when an unsupported export format is requested."""

    def __init__(self, format: str, supported: list[str]) -> None:
        formats = ", ".join(supported)
        super().__init__(
            format, f"Unsupported format. Must be one of: {formats}"
        )
        self.supported = supported


class VersionError(OSSAError):
    """Raised when there are version compatibility issues."""

    def __init__(self, version: str, reason: str) -> None:
        super().__init__(f"Version error for {version}: {reason}")
        self.version = version
        self.reason = reason


class ConfigurationError(OSSAError):
    """Raised when there are configuration issues."""

    def __init__(self, message: str) -> None:
        super().__init__(f"Configuration error: {message}")
