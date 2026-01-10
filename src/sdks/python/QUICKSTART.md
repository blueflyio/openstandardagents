# OSSA Python SDK - Quick Start

Get started with the OSSA Python SDK in 5 minutes.

## Installation

```bash
pip install ossa-sdk
```

Or install from source:

```bash
git clone https://gitlab.com/blueflyio/openstandardagents.git
cd openstandardagents/sdks/python
pip install -e .
```

## Your First OSSA Manifest

Create a file called `my-agent.ossa.yaml`:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: hello-world
  version: 1.0.0
  description: My first OSSA agent
spec:
  role: |
    You are a friendly AI assistant that helps users understand OSSA.
    Always be helpful and concise.
  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4-20250514}
    temperature: 0.7
```

## Validate Your Manifest

```bash
# Using CLI
ossa validate my-agent.ossa.yaml

# Using Python
python -c "from ossa import validate_manifest; print(validate_manifest('my-agent.ossa.yaml'))"
```

## Load and Inspect in Python

```python
from ossa import load_manifest

# Load the manifest
manifest = load_manifest("my-agent.ossa.yaml")

# Access properties
print(f"Agent: {manifest.metadata.name}")
print(f"Version: {manifest.metadata.version}")
print(f"LLM: {manifest.spec.llm.provider}/{manifest.spec.llm.model}")
```

## Create a Manifest Programmatically

```python
from ossa import OSSAManifest, Metadata, AgentSpec, LLMConfig, export_manifest

# Create manifest
manifest = OSSAManifest(
    apiVersion="ossa/v0.3.0",
    kind="Agent",
    metadata=Metadata(
        name="python-agent",
        version="1.0.0"
    ),
    spec=AgentSpec(
        role="You are a helpful assistant",
        llm=LLMConfig(
            provider="anthropic",
            model="claude-sonnet-4-20250514"
        )
    )
)

# Export to YAML
yaml_output = export_manifest(manifest, format="yaml")
print(yaml_output)
```

## CLI Commands

```bash
# Validate
ossa validate my-agent.ossa.yaml --strict

# Inspect (pretty display)
ossa inspect my-agent.ossa.yaml

# Quick info
ossa info my-agent.ossa.yaml

# Export to different format
ossa export my-agent.ossa.yaml --format json -o my-agent.json
ossa export my-agent.ossa.yaml --format python -o my-agent.py
```

## Environment Variables

Make your manifests portable with environment variables:

```yaml
spec:
  llm:
    provider: ${LLM_PROVIDER:-anthropic}  # Default: anthropic
    model: ${LLM_MODEL:-claude-sonnet-4-20250514}  # Default: claude-sonnet-4
```

Run with different providers:

```bash
# Use defaults (Anthropic)
python your_script.py

# Use OpenAI
LLM_PROVIDER=openai LLM_MODEL=gpt-4o python your_script.py

# Use local Ollama
LLM_PROVIDER=ollama LLM_MODEL=llama3.1:70b python your_script.py
```

## Complete Example

Save this as `example.py`:

```python
#!/usr/bin/env python3
from ossa import (
    load_manifest,
    validate_manifest,
    export_manifest,
    OSSAManifest,
    Metadata,
    AgentSpec,
    LLMConfig,
)

# Create a manifest
manifest = OSSAManifest(
    apiVersion="ossa/v0.3.0",
    kind="Agent",
    metadata=Metadata(
        name="example-agent",
        version="1.0.0",
        description="Example agent for testing",
        labels={"environment": "dev"}
    ),
    spec=AgentSpec(
        role="You are a helpful assistant",
        llm=LLMConfig(
            provider="anthropic",
            model="claude-sonnet-4-20250514",
            temperature=0.7
        )
    )
)

# Validate
result = validate_manifest(manifest)
print(f"Valid: {result.valid}")

# Export to file
export_manifest(manifest, format="yaml", output_path="output.yaml")
print("Exported to output.yaml")

# Load it back
loaded = load_manifest("output.yaml")
print(f"Loaded: {loaded.metadata.name}")
```

Run it:

```bash
python example.py
```

## Next Steps

1. Read the [full documentation](README.md)
2. Explore [examples](examples/)
3. Check out the [API reference](https://openstandardagents.org/docs/python-sdk)
4. Join the [community](https://openstandardagents.org/community)

## Common Operations

### Validate Multiple Manifests

```python
from pathlib import Path
from ossa import validate_manifest

for manifest_file in Path("./agents").glob("*.ossa.yaml"):
    result = validate_manifest(manifest_file)
    status = "✓" if result.valid else "✗"
    print(f"{status} {manifest_file.name}")
```

### Convert YAML to JSON

```bash
ossa export agent.yaml --format json -o agent.json
```

### Check if Manifest is Valid Before Processing

```python
from ossa import load_manifest, validate_manifest

manifest_path = "my-agent.ossa.yaml"
result = validate_manifest(manifest_path)

if result.valid:
    manifest = load_manifest(manifest_path)
    # Process manifest...
else:
    print("Errors:")
    for error in result.errors:
        print(f"  - {error}")
```

## Troubleshooting

### Import Error

```python
# If you get: ModuleNotFoundError: No module named 'ossa'
# Solution: Install the package
pip install ossa-sdk
```

### Validation Errors

```python
# Get detailed validation information
result = validate_manifest("my-agent.ossa.yaml", strict=True)

if not result.valid:
    print("Errors:")
    for error in result.errors:
        print(f"  - {error}")

if result.warnings:
    print("Warnings:")
    for warning in result.warnings:
        print(f"  - {warning}")
```

### Environment Variables Not Working

```python
# Make sure you're setting them before running Python
import os
os.environ["LLM_PROVIDER"] = "openai"
os.environ["LLM_MODEL"] = "gpt-4o"

# Then load the manifest
from ossa import load_manifest
manifest = load_manifest("my-agent.ossa.yaml")
```

## Support

- Documentation: https://openstandardagents.org/docs
- Issues: https://gitlab.com/blueflyio/openstandardagents/-/issues
- Community: https://openstandardagents.org/community

---

**Ready to build production AI agents?** Check out the [full documentation](README.md) for advanced features like safety controls, tool integration, and multi-agent workflows.
