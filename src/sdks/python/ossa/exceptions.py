"""OSSA Exceptions."""


class OSSAError(Exception):
    """Base exception for OSSA SDK."""
    pass


class ValidationError(OSSAError):
    """Manifest validation error."""
    pass


class SchemaError(OSSAError):
    """Schema loading or parsing error."""
    pass


class ManifestError(OSSAError):
    """Manifest loading or parsing error."""
    pass
