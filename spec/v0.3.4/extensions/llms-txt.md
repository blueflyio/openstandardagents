# llms.txt Extension for OSSA v0.3.4

## Overview

The **llms.txt Extension** provides bidirectional mapping between the [llms.txt](https://llmstxt.org/) specification and OSSA manifests. This extension enables:

- **Generation**: Create `/llms.txt` files from OSSA manifests
- **Parsing**: Convert existing `llms.txt` files to OSSA manifests
- **Synchronization**: Keep `llms.txt` and OSSA manifests in sync
- **Validation**: Ensure consistency between formats

The llms.txt format provides LLM-friendly content for websites and repositories, standardized at `/llms.txt` to help LLMs understand project structure and resources at inference time.

## Schema Definition

```yaml
extensions:
  llms_txt:
    type: object
    description: "llms.txt extension for bidirectional markdown/OSSA conversion"
    properties:
      enabled:
        type: boolean
        default: false
        description: "Enable llms_txt extension"

      file_path:
        type: string
        default: "llms.txt"
        description: "Path to llms.txt file (relative to repository root)"
        examples:
          - "llms.txt"
          - "docs/llms.txt"
          - ".llms.txt"

      generate:
        type: boolean
        default: true
        description: "Auto-generate llms.txt from manifest"

      auto_discover:
        type: boolean
        default: false
        description: "Auto-discover agents from llms.txt sections"

      format:
        type: object
        description: "llms.txt format configuration"
        properties:
          include_h1_title:
            type: boolean
            default: true
            description: "Include H1 title"
          include_blockquote:
            type: boolean
            default: true
            description: "Include blockquote summary"
          include_h2_sections:
            type: boolean
            default: true
            description: "Include H2 sections with file lists"
          include_optional:
            type: boolean
            default: true
            description: "Include Optional section for secondary info"

      sections:
        type: object
        description: "Section-level configuration for llms.txt"
        properties:
          core_specification:
            $ref: "#/definitions/LlmsTxtSection"
          quick_start:
            $ref: "#/definitions/LlmsTxtSection"
          cli_tools:
            $ref: "#/definitions/LlmsTxtSection"
          sdks:
            $ref: "#/definitions/LlmsTxtSection"
          examples:
            $ref: "#/definitions/LlmsTxtSection"
          migration_guides:
            $ref: "#/definitions/LlmsTxtSection"
          development:
            $ref: "#/definitions/LlmsTxtSection"
          specification_versions:
            $ref: "#/definitions/LlmsTxtSection"
          openapi_specifications:
            $ref: "#/definitions/LlmsTxtSection"
          documentation:
            $ref: "#/definitions/LlmsTxtSection"
          optional:
            $ref: "#/definitions/LlmsTxtSection"
          custom:
            type: array
            items:
              $ref: "#/definitions/LlmsTxtSection"
            description: "Additional custom sections"

      sync:
        type: object
        description: "Synchronization configuration"
        properties:
          on_manifest_change:
            type: boolean
            default: true
            description: "Regenerate llms.txt when manifest changes"
          include_comments:
            type: boolean
            default: false
            description: "Include generation comments in output (llms.txt should be clean)"
          preserve_custom:
            type: boolean
            default: true
            description: "Preserve custom sections not mapped to manifest"
          watch:
            type: boolean
            default: false
            description: "Watch for file changes"

      mapping:
        type: object
        description: "Explicit mapping between OSSA and llms.txt"
        properties:
          metadata_to_h1:
            type: boolean
            default: true
            description: "Map metadata.name to H1 title"
          description_to_blockquote:
            type: boolean
            default: true
            description: "Map metadata.description to blockquote"
          spec_to_core_specification:
            type: boolean
            default: true
            description: "Map spec to Core Specification section"
          tools_to_cli_tools:
            type: boolean
            default: true
            description: "Map spec.tools to CLI Tools section"
          examples_to_examples:
            type: boolean
            default: true
            description: "Map examples to Examples section"
          migrations_to_migration_guides:
            type: boolean
            default: true
            description: "Map migrations to Migration Guides section"

      include_metadata:
        type: boolean
        default: false
        description: "Include OSSA metadata in generated llms.txt (usually false for clean output)"

definitions:
  LlmsTxtSection:
    type: object
    properties:
      enabled:
        type: boolean
        default: true
        description: "Whether this section is enabled"
      source:
        type: string
        description: "OSSA manifest path to derive content from"
        examples:
          - "spec.tools"
          - "metadata.description"
          - "examples"
      custom:
        type: string
        description: "Custom markdown content for this section"
      append:
        type: string
        description: "Content to append after auto-generated content"
      prepend:
        type: string
        description: "Content to prepend before auto-generated content"
      title:
        type: string
        description: "Override default section title"
      file_list:
        type: array
        items:
          type: string
        description: "List of files/links to include in this section"
```

## Bidirectional Mapping Tables

### llms.txt to OSSA Manifest (Parsing)

| llms.txt Section | OSSA Property | Description |
|------------------|---------------|-------------|
| `# {title}` (H1) | `metadata.name` | Project/agent name |
| `> {summary}` (blockquote) | `metadata.description` | Project description |
| `## Core Specification` | `spec` | Core specification details |
| `## Quick Start` | `spec.tools` (setup commands) | Quick start guide |
| `## CLI Tools` | `spec.tools[]` (CLI tools) | CLI tool references |
| `## SDKs` | `spec.tools[]` (SDK tools) | SDK references |
| `## Examples` | `examples/` directory | Example references |
| `## Migration Guides` | `migrations/` directory | Migration guide references |
| `## Development` | `spec.tools` (dev commands) | Development setup |
| `## Specification Versions` | `spec/` directory | Version references |
| `## OpenAPI Specifications` | `openapi/` directory | OpenAPI spec references |
| `## Documentation` | `docs/` directory | Documentation references |
| `## Optional` | `metadata.annotations` | Secondary information |

### OSSA Manifest to llms.txt (Generation)

| OSSA Property | llms.txt Section | Description |
|---------------|------------------|-------------|
| `metadata.name` | `# {name}` | H1 title |
| `metadata.description` | `> {description}` | Blockquote summary |
| `spec` | `## Core Specification` | Core spec links |
| `spec.tools[]` (setup) | `## Quick Start` | Quick start links |
| `spec.tools[]` (CLI) | `## CLI Tools` | CLI tool links |
| `spec.tools[]` (SDK) | `## SDKs` | SDK links |
| `examples/` | `## Examples` | Example directory links |
| `migrations/` | `## Migration Guides` | Migration guide links |
| `spec.tools[]` (dev) | `## Development` | Development links |
| `spec/` | `## Specification Versions` | Version links |
| `openapi/` | `## OpenAPI Specifications` | OpenAPI spec links |
| `docs/` | `## Documentation` | Documentation links |
| `metadata.annotations` | `## Optional` | Optional secondary info |

## Example Manifest

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: openstandardagents-project
  version: 0.3.4
  description: Open Standard for Software Agents - Vendor-neutral specification, CLI tools, and SDKs

spec:
  role: OSSA project agent
  tools:
    - type: function
      name: npm_install
      config:
        command: npm install

extensions:
  llms_txt:
    enabled: true
    generate: true
    file_path: llms.txt
    sections:
      core_specification:
        enabled: true
        file_list:
          - "spec/v0.3.4/ossa-0.3.4.schema.json"
          - "openapi/"
      quick_start:
        enabled: true
        file_list:
          - "README.md#-quick-start"
      cli_tools:
        enabled: true
        file_list:
          - "bin/ossa"
    sync:
      on_manifest_change: true
      include_comments: false
      preserve_custom: true
```

## CLI Commands

```bash
# Generate llms.txt from OSSA manifest
ossa llms-txt generate manifest.yaml

# Parse llms.txt to OSSA manifest
ossa llms-txt parse llms.txt --output manifest.yaml

# Validate llms.txt against manifest
ossa llms-txt validate llms.txt manifest.yaml

# Sync llms.txt with manifest
ossa llms-txt sync manifest.yaml
```

## Related Resources

- [llms.txt Specification](https://llmstxt.org/)
- [OSSA v0.3.4 Schema](../ossa-0.3.4.schema.json)
- [Agents.md Extension](./agents-md.md)

## Version History

| Version | Changes |
|---------|---------|
| 0.3.4 | Initial extension specification |
