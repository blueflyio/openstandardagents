"""
OSSA SDK Exceptions

Comprehensive exception hierarchy for OSSA SDK operations.
"""


class OSSAError(Exception):
    """
    Base exception for all OSSA SDK errors.

    All OSSA-specific exceptions inherit from this base class,
    allowing for catch-all error handling when needed.
    """
    pass


class ValidationError(OSSAError):
    """
    Manifest validation error.

    Raised when a manifest fails schema validation or
    OSSA-specific semantic validation rules.
    """
    pass


class ConfigurationError(OSSAError):
    """
    Configuration or setup error.

    Raised when:
    - Required configuration is missing or invalid
    - LLM provider is not supported or not properly configured
    - Runtime options are incompatible
    - API keys or credentials are missing
    """
    pass


class ExecutionError(OSSAError):
    """
    Runtime execution error.

    Raised when agent, task, or workflow execution fails
    due to runtime issues (not configuration issues).
    """
    pass


class SchemaError(OSSAError):
    """
    Schema loading or parsing error.

    Raised when JSON Schema files cannot be loaded or parsed.
    """
    pass


class ManifestError(OSSAError):
    """
    Manifest loading or parsing error.

    Raised when OSSA manifest files cannot be loaded or parsed.
    """
    pass
