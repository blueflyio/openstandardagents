"""
OSSA SDK - Python toolkit for Open Standard for Scalable AI Agents.

This package provides tools for working with OSSA manifests:
- Load and parse agent/task/workflow definitions
- Validate against OSSA specification
- Export to different formats
- Type-safe Python models with Pydantic

Quick Start:
    >>> from ossa import load_manifest, validate_manifest
    >>> manifest = load_manifest("my-agent.ossa.yaml")
    >>> result = validate_manifest(manifest)
    >>> if result.valid:
    ...     print(f"Agent: {manifest.metadata.name}")

For more examples, see: https://openstandardagents.org/docs/sdks/python
"""

__version__ = "0.3.0"
__ossa_version__ = "v0.3.0"

# Core functionality
from .manifest import export_manifest, load_manifest, validate_manifest

# Runner classes for execution
from .agent import Agent, AgentResponse, AgentRunner
from .task import Task, TaskResponse, TaskRunner
from .workflow import Workflow, WorkflowResponse, WorkflowRunner

# Type definitions
from .types import (
    AgentSpec,
    Autonomy,
    AutonomyLevel,
    LLMConfig,
    LLMProvider,
    Messaging,
    MessagingCommand,
    MessagingPubSub,
    Metadata,
    OSSAKind,
    OSSAManifest,
    PIIDetection,
    RateLimit,
    Safety,
    StateConfig,
    TaskSpec,
    TaskStep,
    Tool,
    ValidationResult,
    WorkflowSpec,
    WorkflowStep,
)

# Exceptions
from .exceptions import (
    ConfigurationError,
    ExportError,
    ManifestError,
    ManifestNotFoundError,
    ManifestParseError,
    ManifestValidationError,
    OSSAError,
    SchemaError,
    SchemaNotFoundError,
    SchemaValidationError,
    UnsupportedFormatError,
    VersionError,
)

# Validation utilities
from .validator import SchemaValidator, validate_manifest as validate_schema

# Public API
__all__ = [
    # Version
    "__version__",
    "__ossa_version__",
    # Core functions
    "load_manifest",
    "validate_manifest",
    "export_manifest",
    # Runner classes (execution)
    "Agent",
    "AgentRunner",
    "AgentResponse",
    "Task",
    "TaskRunner",
    "TaskResponse",
    "Workflow",
    "WorkflowRunner",
    "WorkflowResponse",
    # Types
    "OSSAManifest",
    "OSSAKind",
    "Metadata",
    "AgentSpec",
    "TaskSpec",
    "WorkflowSpec",
    "TaskStep",
    "WorkflowStep",
    "LLMConfig",
    "LLMProvider",
    "Tool",
    "Safety",
    "PIIDetection",
    "RateLimit",
    "Autonomy",
    "AutonomyLevel",
    "Messaging",
    "MessagingPubSub",
    "MessagingCommand",
    "StateConfig",
    "ValidationResult",
    # Exceptions
    "OSSAError",
    "ManifestError",
    "ManifestNotFoundError",
    "ManifestParseError",
    "ManifestValidationError",
    "SchemaError",
    "SchemaNotFoundError",
    "SchemaValidationError",
    "ExportError",
    "UnsupportedFormatError",
    "VersionError",
    "ConfigurationError",
    # Validators
    "SchemaValidator",
    "validate_schema",
]
