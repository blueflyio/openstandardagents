"""OSSA Python SDK — Open Standard for Software Agents.

Load, validate, build, and run OSSA agent manifests.

Quick start:
    from ossa import load, validate, ManifestBuilder

    # Load from file
    manifest = load("agent.ossa.yaml")
    result = validate(manifest)

    # Build programmatically
    manifest = (
        ManifestBuilder.agent("my-agent")
        .version("1.0.0")
        .role("You are a helpful assistant.")
        .llm(LLMConfigBuilder.anthropic().temperature(0.7).build())
        .build()
    )
"""

__version__ = "0.5.0"

# Core manifest I/O
from .manifest import load, load_string, save, export

# Validation
from .validator import validate, validate_or_raise, ValidationResult

# Types
from .types import (
    Kind,
    LLMProvider,
    AccessTier,
    SecurityTier,
    OSSAManifest,
    AgentManifest,
    TaskManifest,
    WorkflowManifest,
    Metadata,
    LLMConfig,
    Tool,
    Safety,
    Autonomy,
    Identity,
    SecurityPosture,
    Governance,
    ProtocolDeclarations,
    TokenEfficiency,
    Cognition,
    AgentIdentity,
    Publisher,
)

# Builders
from .builders import (
    ManifestBuilder,
    ToolBuilder,
    LLMConfigBuilder,
    SecurityBuilder,
)

# Agent execution
from .agent import Agent, AgentResponse

# Exceptions
from .exceptions import (
    OSSAError,
    ValidationError,
    ConfigurationError,
    ExecutionError,
    ProviderError,
    SchemaError,
)

__all__ = [
    # Version
    "__version__",
    # I/O
    "load",
    "load_string",
    "save",
    "export",
    # Validation
    "validate",
    "validate_or_raise",
    "ValidationResult",
    # Types
    "Kind",
    "LLMProvider",
    "AccessTier",
    "SecurityTier",
    "OSSAManifest",
    "AgentManifest",
    "TaskManifest",
    "WorkflowManifest",
    "Metadata",
    "LLMConfig",
    "Tool",
    "Safety",
    "Autonomy",
    "Identity",
    "SecurityPosture",
    "Governance",
    "ProtocolDeclarations",
    "TokenEfficiency",
    "Cognition",
    "AgentIdentity",
    "Publisher",
    # Builders
    "ManifestBuilder",
    "ToolBuilder",
    "LLMConfigBuilder",
    "SecurityBuilder",
    # Execution
    "Agent",
    "AgentResponse",
    # Exceptions
    "OSSAError",
    "ValidationError",
    "ConfigurationError",
    "ExecutionError",
    "ProviderError",
    "SchemaError",
]
