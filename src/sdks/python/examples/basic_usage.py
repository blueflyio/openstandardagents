#!/usr/bin/env python3
"""
Basic usage examples for OSSA Python SDK.

This script demonstrates common operations:
- Loading manifests from files
- Validating manifests
- Creating manifests programmatically
- Exporting to different formats
"""

from pathlib import Path

from ossa import (
    AgentSpec,
    LLMConfig,
    Metadata,
    OSSAKind,
    OSSAManifest,
    Tool,
    export_manifest,
    load_manifest,
    validate_manifest,
)


def example_load_and_validate() -> None:
    """Example: Load and validate an existing manifest."""
    print("=" * 60)
    print("Example 1: Load and Validate")
    print("=" * 60)

    # Path to an example manifest (adjust path as needed)
    manifest_path = Path(__file__).parent.parent.parent.parent / "examples" / "getting-started" / "01-minimal-agent.ossa.yaml"

    if not manifest_path.exists():
        print(f"Manifest not found: {manifest_path}")
        print("Please adjust the path to point to a valid OSSA manifest.\n")
        return

    try:
        # Load the manifest
        manifest = load_manifest(manifest_path)

        print(f"✓ Loaded manifest: {manifest.metadata.name}")
        print(f"  Version: {manifest.metadata.version}")
        print(f"  Kind: {manifest.kind.value}")

        # Validate it
        result = validate_manifest(manifest, strict=True)

        if result.valid:
            print("✓ Validation passed")
        else:
            print("✗ Validation failed:")
            for error in result.errors:
                print(f"  - {error}")

        if result.warnings:
            print("\nWarnings:")
            for warning in result.warnings:
                print(f"  - {warning}")

    except Exception as e:
        print(f"Error: {e}")

    print()


def example_create_programmatically() -> None:
    """Example: Create a manifest programmatically."""
    print("=" * 60)
    print("Example 2: Create Manifest Programmatically")
    print("=" * 60)

    manifest = OSSAManifest(
        apiVersion="ossa/v0.3.0",
        kind=OSSAKind.AGENT,
        metadata=Metadata(
            name="python-example-agent",
            version="1.0.0",
            description="An agent created with Python code",
            labels={
                "created-by": "python-sdk",
                "environment": "development",
                "language": "python",
            },
        ),
        spec=AgentSpec(
            role=(
                "You are a Python programming assistant. Your purpose is to:\n"
                "1. Help users write clean, Pythonic code\n"
                "2. Explain Python concepts clearly\n"
                "3. Suggest best practices and patterns\n"
                "4. Debug code issues\n\n"
                "Always provide working code examples."
            ),
            llm=LLMConfig(
                provider="anthropic",
                model="claude-sonnet-4-20250514",
                temperature=0.7,
                max_tokens=4096,
            ),
            tools=[
                Tool(
                    name="code-executor",
                    type="mcp",
                    description="Execute Python code in a sandboxed environment",
                    config={"timeout": 30, "max_memory_mb": 512},
                )
            ],
        ),
    )

    # Validate the created manifest
    result = validate_manifest(manifest)

    if result.valid:
        print("✓ Created valid manifest")
        print(f"  Name: {manifest.metadata.name}")
        print(f"  LLM: {manifest.spec.llm.provider}/{manifest.spec.llm.model}")
        print(f"  Tools: {len(manifest.spec.tools)}")
    else:
        print("✗ Created manifest is invalid:")
        for error in result.errors:
            print(f"  - {error}")

    print()


def example_export_formats() -> None:
    """Example: Export manifest to different formats."""
    print("=" * 60)
    print("Example 3: Export to Different Formats")
    print("=" * 60)

    # Create a simple manifest
    manifest = OSSAManifest(
        apiVersion="ossa/v0.3.0",
        kind=OSSAKind.AGENT,
        metadata=Metadata(
            name="export-example",
            version="1.0.0",
            description="Example for export formats",
        ),
        spec=AgentSpec(
            role="You are a helpful assistant",
            llm=LLMConfig(
                provider="anthropic",
                model="claude-sonnet-4-20250514",
                temperature=0.7,
            ),
        ),
    )

    # Export to YAML
    print("\n--- YAML Format ---")
    yaml_output = export_manifest(manifest, format="yaml")
    print(yaml_output[:300] + "..." if len(yaml_output) > 300 else yaml_output)

    # Export to JSON
    print("\n--- JSON Format ---")
    json_output = export_manifest(manifest, format="json")
    print(json_output[:300] + "..." if len(json_output) > 300 else json_output)

    # Export to Python code
    print("\n--- Python Code ---")
    python_output = export_manifest(manifest, format="python")
    print(python_output[:500] + "..." if len(python_output) > 500 else python_output)

    print()


def example_manifest_properties() -> None:
    """Example: Accessing manifest properties."""
    print("=" * 60)
    print("Example 4: Manifest Properties and Type Checking")
    print("=" * 60)

    manifest = OSSAManifest(
        apiVersion="ossa/v0.3.0",
        kind=OSSAKind.AGENT,
        metadata=Metadata(
            name="property-example",
            version="2.1.0",
            description="Example for accessing properties",
            labels={"team": "platform", "priority": "high"},
        ),
        spec=AgentSpec(
            role="Test agent",
            llm=LLMConfig(
                provider="openai",
                model="gpt-4o",
                temperature=0.3,
            ),
        ),
    )

    # Access metadata
    print(f"Name: {manifest.metadata.name}")
    print(f"Version: {manifest.metadata.version}")
    print(f"Description: {manifest.metadata.description}")

    # Access labels
    print(f"\nLabels:")
    for key, value in manifest.metadata.labels.items():
        print(f"  {key}: {value}")

    # Type checking
    print(f"\nType checks:")
    print(f"  Is Agent: {manifest.is_agent}")
    print(f"  Is Task: {manifest.is_task}")
    print(f"  Is Workflow: {manifest.is_workflow}")

    # LLM configuration
    print(f"\nLLM Configuration:")
    print(f"  Provider: {manifest.spec.llm.provider}")
    print(f"  Model: {manifest.spec.llm.model}")
    print(f"  Temperature: {manifest.spec.llm.temperature}")

    print()


def main() -> None:
    """Run all examples."""
    print("\n" + "=" * 60)
    print("OSSA Python SDK - Basic Usage Examples")
    print("=" * 60 + "\n")

    example_load_and_validate()
    example_create_programmatically()
    example_export_formats()
    example_manifest_properties()

    print("=" * 60)
    print("All examples completed!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
