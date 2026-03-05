"""OSSA SDK Exception Hierarchy."""

from __future__ import annotations


class OSSAError(Exception):
    """Base exception for all OSSA SDK errors."""


class ValidationError(OSSAError):
    """Manifest validation failed."""

    def __init__(self, errors: list[str], warnings: list[str] | None = None) -> None:
        self.errors = errors
        self.warnings = warnings or []
        msg = f"Validation failed with {len(errors)} error(s): {'; '.join(errors[:3])}"
        if len(errors) > 3:
            msg += f" ... and {len(errors) - 3} more"
        super().__init__(msg)


class ConfigurationError(OSSAError):
    """Invalid SDK or agent configuration."""


class ExecutionError(OSSAError):
    """Agent execution failed."""


class ProviderError(OSSAError):
    """LLM provider error (API failure, auth, rate limit)."""


class SchemaError(OSSAError):
    """JSON Schema loading or resolution error."""
