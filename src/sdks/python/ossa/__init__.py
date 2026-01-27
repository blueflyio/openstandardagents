"""
OSSA SDK for Python

Open Standard for Scalable Agents - Python implementation.

This SDK provides complete support for OSSA manifests including:
- Agent execution with multiple LLM providers (Anthropic, OpenAI, etc.)
- Task orchestration and workflow execution
- Manifest loading, validation, and manipulation
- Type-safe Python API with full IDE support
- CLI tools for manifest management
- CloudEvents support for observability and event streaming
- W3C Baggage for distributed tracing and multi-agent correlation

Quick Start:
    >>> from ossa import Agent, load
    >>> manifest = load("agent.yaml")
    >>> agent = Agent(manifest, api_key="sk-...")
    >>> response = agent.run("Hello!")
    >>> print(response.content)

CloudEvents:
    >>> from ossa.events import CloudEventsEmitter, OSSA_EVENT_TYPES
    >>> emitter = CloudEventsEmitter(source="ossa/my-agent")
    >>> emitter.emit(OSSA_EVENT_TYPES.AGENT_STARTED, {"agent_id": "123"})

Distributed Tracing:
    >>> from ossa.tracing import TraceContext, create_ossa_baggage
    >>> context = TraceContext.create(
    ...     agent_id="agent-001",
    ...     interaction_id="int-123"
    ... )
    >>> headers = context.headers  # Use in HTTP requests

For more examples, see: https://openstandardagents.org/docs/sdks/python
"""

__version__ = "0.3.5"
__all__ = [
    # Core manifest types
    "Manifest",
    "load_manifest",
    "load",  # Alias for load_manifest

    # Validation
    "Validator",
    "ValidationResult",
    "validate_manifest",
    "validate",  # Alias for validate_manifest

    # Runtime execution
    "Agent",
    "AgentRunner",
    "AgentResponse",
    "Task",
    "TaskRunner",
    "Workflow",
    "WorkflowRunner",

    # CRUD operations
    "IAgentRepository",
    "AgentRepository",
    "AgentService",
    "AgentController",

    # Exceptions
    "OSSAError",
    "ValidationError",
    "ConfigurationError",
    "ExecutionError",

    # Version
    "__version__",
]

from .manifest import Manifest, load_manifest
from .validator import Validator, ValidationResult, validate_manifest
from .exceptions import OSSAError, ValidationError, ConfigurationError, ExecutionError
from .agent import Agent, AgentRunner, AgentResponse
from .task import Task, TaskRunner
from .workflow import Workflow, WorkflowRunner
from .structure import AgentsFolderService, AgentFolderStructure, FileDefinition
from .crud import IAgentRepository, AgentRepository, AgentService, AgentController

# Convenience aliases
load = load_manifest
validate = validate_manifest
