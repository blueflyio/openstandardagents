# OSSA Python SDK

[![PyPI version](https://badge.fury.io/py/ossa-sdk.svg)](https://badge.fury.io/py/ossa-sdk)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Official Python SDK for [Open Standard for Software Agents (OSSA)](https://openstandardagents.org) - The OpenAPI for agents**

The OSSA Python SDK provides a production-ready toolkit for working with OSSA manifests - the declarative format for defining AI agents, tasks, and workflows. Think of it as the "Kubernetes for AI Agents" - write once, run anywhere.

## Features

- **Type-Safe**: Full Pydantic models with automatic validation
- **Vendor-Neutral**: Works with 20+ LLM providers (Anthropic, OpenAI, Google, Ollama, Groq, etc.)
- **CLI Included**: Validate, inspect, and export manifests from the command line
- **Comprehensive**: Supports Agent, Task, and Workflow kinds from OSSA v0.3.0
- **Production-Ready**: Built-in safety, error handling, and validation
- **Zero Config**: Environment variable support for portability

## Installation

```bash
pip install ossa-sdk
```

### Development Installation

```bash
git clone https://gitlab.com/blueflyio/openstandardagents.git
cd openstandardagents/sdks/python
pip install -e ".[dev]"
```

## Quick Start

### Load and Validate a Manifest

```python
from ossa import load_manifest, validate_manifest

# Load an OSSA manifest
manifest = load_manifest("my-agent.ossa.yaml")

# Validate it
result = validate_manifest(manifest, strict=True)

if result.valid:
    print(f"✓ Agent: {manifest.metadata.name} v{manifest.metadata.version}")
    print(f"  Provider: {manifest.spec.llm.provider}")
    print(f"  Model: {manifest.spec.llm.model}")
else:
    for error in result.errors:
        print(f"✗ {error}")
```

### Inspect Manifest Details

```python
from ossa import load_manifest

manifest = load_manifest("my-agent.ossa.yaml")

# Access metadata
print(f"Name: {manifest.metadata.name}")
print(f"Version: {manifest.metadata.version}")
print(f"Kind: {manifest.kind}")

# Check what kind of resource it is
if manifest.is_agent:
    print(f"LLM: {manifest.spec.llm.provider}/{manifest.spec.llm.model}")
    print(f"Temperature: {manifest.spec.llm.temperature}")

    if manifest.spec.tools:
        print(f"Tools: {len(manifest.spec.tools)}")
```

### Export to Different Formats

```python
from ossa import load_manifest, export_manifest

manifest = load_manifest("my-agent.ossa.yaml")

# Export to JSON
json_output = export_manifest(manifest, format="json")

# Export to Python code
python_code = export_manifest(manifest, format="python")

# Write to file
export_manifest(manifest, format="yaml", output_path="exported-agent.yaml")
```

### Create a Manifest Programmatically

```python
from ossa import OSSAManifest, Metadata, AgentSpec, LLMConfig, OSSAKind

manifest = OSSAManifest(
    apiVersion="ossa/v0.3.0",
    kind=OSSAKind.AGENT,
    metadata=Metadata(
        name="python-created-agent",
        version="1.0.0",
        description="An agent created with Python code",
        labels={"created-by": "python", "environment": "dev"}
    ),
    spec=AgentSpec(
        role="You are a helpful AI assistant that explains OSSA concepts.",
        llm=LLMConfig(
            provider="anthropic",
            model="claude-sonnet-4-20250514",
            temperature=0.7
        )
    )
)

# Validate it
from ossa import validate_manifest
result = validate_manifest(manifest)
print(f"Valid: {result.valid}")

# Export it
from ossa import export_manifest
yaml_output = export_manifest(manifest, format="yaml")
print(yaml_output)
```

## CLI Usage

The SDK includes a powerful CLI for working with OSSA manifests:

### Validate a Manifest

```bash
# Basic validation
ossa validate my-agent.ossa.yaml

# Strict validation (additional checks)
ossa validate my-agent.ossa.yaml --strict

# Output as JSON
ossa validate my-agent.ossa.yaml --json
```

### Inspect a Manifest

```bash
# Display as formatted table
ossa inspect my-agent.ossa.yaml

# Output as JSON
ossa inspect my-agent.ossa.yaml --format json

# Output as YAML with syntax highlighting
ossa inspect my-agent.ossa.yaml --format yaml
```

### Export to Different Formats

```bash
# Export to JSON
ossa export my-agent.ossa.yaml --format json

# Export to Python code
ossa export my-agent.ossa.yaml --format python -o agent.py

# Convert YAML to JSON
ossa export my-agent.ossa.yaml --format json -o my-agent.json
```

### Quick Info

```bash
# Display quick summary
ossa info my-agent.ossa.yaml
```

## Environment Variables

OSSA manifests support environment variable substitution for portability:

**my-agent.ossa.yaml:**
```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: portable-agent
  version: 1.0.0
spec:
  role: "You are a helpful assistant"
  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4-20250514}
    temperature: 0.7
```

**Usage:**
```bash
# Use defaults (anthropic/claude-sonnet-4)
python your_script.py

# Override with environment variables
LLM_PROVIDER=openai LLM_MODEL=gpt-4o python your_script.py

# Use local Ollama
LLM_PROVIDER=ollama LLM_MODEL=llama3.1:70b python your_script.py
```

## Advanced Examples

### Validate Multiple Manifests

```python
from pathlib import Path
from ossa import validate_manifest

manifests_dir = Path("./agents")

for manifest_file in manifests_dir.glob("*.ossa.yaml"):
    result = validate_manifest(manifest_file)

    if result.valid:
        print(f"✓ {manifest_file.name}")
    else:
        print(f"✗ {manifest_file.name}")
        for error in result.errors:
            print(f"  - {error}")
```

### Type-Safe Manifest Construction

```python
from ossa import (
    OSSAManifest, Metadata, AgentSpec, LLMConfig,
    Tool, Safety, PIIDetection, RateLimit
)

manifest = OSSAManifest(
    apiVersion="ossa/v0.3.0",
    kind="Agent",
    metadata=Metadata(
        name="secure-agent",
        version="1.0.0",
        description="Production agent with safety controls"
    ),
    spec=AgentSpec(
        role="You are a secure AI assistant with PII protection.",
        llm=LLMConfig(
            provider="anthropic",
            model="claude-sonnet-4-20250514",
            temperature=0.3,
            max_tokens=4096
        ),
        tools=[
            Tool(
                name="search",
                type="mcp",
                description="Search external knowledge base",
                config={"server": "search-mcp-server"}
            )
        ],
        safety=Safety(
            pii_detection=PIIDetection(enabled=True, redact=True),
            rate_limits=RateLimit(
                requests_per_minute=60,
                tokens_per_minute=100000
            ),
            max_retries=3,
            timeout_seconds=30
        )
    )
)
```

### Working with Task and Workflow Manifests

```python
from ossa import load_manifest

# Load a Task
task = load_manifest("data-processing.ossa.yaml")
if task.is_task:
    print(f"Task has {len(task.spec.steps)} steps")
    for step in task.spec.steps:
        print(f"  - {step.name}: {step.action}")

# Load a Workflow
workflow = load_manifest("ci-pipeline.ossa.yaml")
if workflow.is_workflow:
    print(f"Workflow: {workflow.metadata.name}")
    print(f"Parallel execution: {workflow.spec.parallel}")
    print(f"Steps: {len(workflow.spec.steps)}")
```

## API Reference

### Core Functions

#### `load_manifest(path: str | Path) -> OSSAManifest`
Load and parse an OSSA manifest from a file.

**Raises:**
- `ManifestNotFoundError` - File doesn't exist
- `ManifestParseError` - YAML/JSON parsing failed
- `ManifestValidationError` - Invalid manifest structure

#### `validate_manifest(manifest, strict=False) -> ValidationResult`
Validate an OSSA manifest against the specification.

**Parameters:**
- `manifest` - OSSAManifest, dict, or file path
- `strict` - Enable additional validation checks
- `schema_path` - Optional local schema directory

**Returns:** `ValidationResult` with `valid`, `errors`, `warnings`

#### `export_manifest(manifest, format="yaml", output_path=None) -> str`
Export a manifest to different formats.

**Parameters:**
- `format` - "yaml", "json", or "python"
- `output_path` - Optional file path to write

**Returns:** Exported manifest as string (if no output_path)

### Types

- `OSSAManifest` - Complete manifest
- `Metadata` - Resource metadata
- `AgentSpec` - Agent specification
- `TaskSpec` - Task specification
- `WorkflowSpec` - Workflow specification
- `LLMConfig` - LLM configuration
- `Tool` - Tool definition
- `Safety` - Safety controls
- `ValidationResult` - Validation result

### Exceptions

- `OSSAError` - Base exception
- `ManifestError` - Manifest-related errors
- `ManifestNotFoundError` - File not found
- `ManifestParseError` - Parse failure
- `ManifestValidationError` - Validation failure
- `SchemaError` - Schema-related errors
- `ExportError` - Export failure
- `UnsupportedFormatError` - Unsupported format

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=ossa --cov-report=html

# Run specific test
pytest tests/test_manifest.py::test_load_manifest
```

## Development

```bash
# Install development dependencies
pip install -e ".[dev]"

# Run linting
ruff check .

# Format code
black .

# Type checking
mypy ossa/
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://gitlab.com/blueflyio/openstandardagents/-/blob/main/CONTRIBUTING.md) for details.

## Resources

- **Website**: https://openstandardagents.org
- **Documentation**: https://openstandardagents.org/docs
- **Specification**: https://gitlab.com/blueflyio/openstandardagents/-/blob/main/spec/
- **Examples**: https://gitlab.com/blueflyio/openstandardagents/-/tree/main/examples
- **Issues**: https://gitlab.com/blueflyio/openstandardagents/-/issues

## License

MIT License - see [LICENSE](https://gitlab.com/blueflyio/openstandardagents/-/blob/main/LICENSE) for details.

## Why OSSA?

**Portability**: Write once, run anywhere. Switch LLM providers with environment variables.

**Interoperability**: Export to LangChain, CrewAI, AutoGen, or custom frameworks.

**Production-Ready**: Built-in safety, validation, rate limiting, and PII detection.

**Open Standard**: Community-driven, vendor-neutral specification.

**Enterprise-Friendly**: Designed for scalability, observability, and governance.

---

**Built with ❤️ by the OSSA community**
