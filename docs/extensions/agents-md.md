# OpenAI agents.md Extension

The `agents_md` extension enables OSSA to generate and manage [OpenAI agents.md](https://agents.md) files from agent manifests. This provides repository-level guidance for AI coding agents like Cursor, GitHub Copilot, Google Jules, and others.

## Overview

**agents.md** is OpenAI's open standard for guiding AI coding agents at the repository level. With 20,000+ open-source project adoptions, it's become the de facto standard for providing context to AI coding tools.

The OSSA `agents_md` extension bridges enterprise agent orchestration with repository-level AI assistance by:

- **Generating** AGENTS.md files from OSSA manifests
- **Validating** AGENTS.md against manifest configuration
- **Synchronizing** AGENTS.md with manifest changes
- **Integrating** with Cursor IDE and other AI coding tools

## Quick Start

### 1. Enable the Extension

Add the `agents_md` extension to your OSSA manifest:

```yaml
apiVersion: ossa/v0.2.8
kind: Agent
metadata:
  name: my-agent
spec:
  role: Development agent for code review
  tools:
    - type: mcp
      name: git_operations
      server: git-mcp-server

extensions:
  agents_md:
    enabled: true
    generate: true
```

### 2. Generate AGENTS.md

```bash
ossa agents-md generate manifest.yaml
```

This creates an `AGENTS.md` file in your repository root with content derived from your manifest.

### 3. Commit to Repository

```bash
git add AGENTS.md
git commit -m "Add agents.md for AI coding agents"
git push
```

AI coding agents (Cursor, GitHub Copilot, etc.) will now automatically read this file for guidance.

## Configuration

### Extension Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable agents.md generation |
| `generate` | boolean | `true` | Auto-generate AGENTS.md from manifest |
| `output_path` | string | `"AGENTS.md"` | Output path for generated file |
| `sections` | object | - | Configuration for agents.md sections |
| `sync` | object | - | Synchronization configuration |
| `cursor_integration` | boolean | `false` | Generate Cursor-compatible content |

### Section Configuration

Each section (`dev_environment`, `testing`, `pr_instructions`) supports:

| Property | Type | Description |
|----------|------|-------------|
| `enabled` | boolean | Whether this section is enabled |
| `source` | string | OSSA manifest path to derive content from |
| `custom` | string | Custom markdown content for this section |
| `title_format` | string | Format string for section title |

### Sync Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `on_manifest_change` | boolean | `true` | Auto-sync when manifest changes |
| `include_comments` | boolean | `true` | Include explanatory comments |

## CLI Commands

### Generate

Generate AGENTS.md from an OSSA manifest:

```bash
ossa agents-md generate <manifest> [options]
```

**Options:**
- `-o, --output <path>` - Output path (default: `AGENTS.md`)
- `-v, --verbose` - Verbose output

**Examples:**

```bash
# Generate with default settings
ossa agents-md generate .agents/my-agent/manifest.yaml

# Generate to custom path
ossa agents-md generate manifest.yaml --output .github/AGENTS.md

# Generate with verbose output
ossa agents-md generate manifest.yaml --verbose
```

### Validate

Validate AGENTS.md against an OSSA manifest:

```bash
ossa agents-md validate <agents-md> <manifest> [options]
```

**Options:**
- `-v, --verbose` - Verbose output

**Examples:**

```bash
# Validate AGENTS.md
ossa agents-md validate AGENTS.md manifest.yaml

# Validate with verbose output
ossa agents-md validate .github/AGENTS.md manifest.yaml --verbose
```

### Sync

Synchronize AGENTS.md with manifest changes:

```bash
ossa agents-md sync <manifest> [options]
```

**Options:**
- `-w, --watch` - Watch for changes and auto-sync
- `-v, --verbose` - Verbose output

**Examples:**

```bash
# One-time sync
ossa agents-md sync manifest.yaml

# Watch for changes
ossa agents-md sync manifest.yaml --watch
```

## Bidirectional Mapping

### OSSA → agents.md (Generation)

The extension maps OSSA manifest properties to agents.md sections:

| OSSA Property | agents.md Section | Description |
|---------------|-------------------|-------------|
| `spec.tools` | Dev environment tips | Tool setup instructions |
| `spec.constraints` | Testing instructions | Performance and quality requirements |
| `spec.autonomy` | PR instructions | Approval workflow and guidelines |
| `metadata.labels` | PR title format | Project categorization |

**Example:**

```yaml
spec:
  tools:
    - type: mcp
      name: git_operations
      server: git-mcp-server
  constraints:
    performance:
      maxLatencySeconds: 30
  autonomy:
    level: supervised
    approval_required: true

extensions:
  agents_md:
    enabled: true
    sections:
      dev_environment:
        source: spec.tools  # Derives from tools
      testing:
        source: spec.constraints  # Derives from constraints
      pr_instructions:
        source: spec.autonomy  # Derives from autonomy
```

**Generated AGENTS.md:**

```markdown
# Dev environment tips

## Tool Setup
- **git_operations**: MCP server integration
  - Namespace: `default`

# Testing instructions

## Performance Requirements
- Maximum latency: 30s

# PR instructions

- **Human approval required** for all changes
- Autonomy level: supervised
```

### agents.md → OSSA (Parsing)

The extension can parse AGENTS.md and extract hints for OSSA manifests:

| agents.md Content | OSSA Property | Description |
|-------------------|---------------|-------------|
| Keywords (code review, testing) | `spec.role` | Agent behavior hints |
| Commands (`npm test`, `git commit`) | `spec.tools` | Inferred tool requirements |
| File references (`.md`, `.json`) | `extensions.cursor.workspace_config.context_files` | Context files for Cursor |

**Example:**

```bash
# Parse AGENTS.md and generate partial manifest
ossa agents-md parse AGENTS.md --output hints.yaml
```

## Cursor Integration

The `agents_md` extension integrates seamlessly with the Cursor extension:

### Configuration

```yaml
extensions:
  agents_md:
    enabled: true
    output_path: .github/AGENTS.md
    cursor_integration: true  # Generate Cursor-compatible content

  cursor:
    enabled: true
    workspace_config:
      agents_md_path: .github/AGENTS.md  # Reference to AGENTS.md
      context_files:
        - .github/AGENTS.md  # Include in context
        - README.md
```

### Benefits

1. **Unified Configuration**: Single source of truth in OSSA manifest
2. **Automatic Sync**: Changes to manifest update both AGENTS.md and Cursor config
3. **Context Sharing**: AGENTS.md content available to Cursor agents
4. **Best Practices**: Cursor-specific guidance in AGENTS.md

### Example Workflow

```yaml
apiVersion: ossa/v0.2.8
kind: Agent
metadata:
  name: fullstack-dev-agent
  labels:
    domain: development

spec:
  role: Full-stack development agent
  tools:
    - type: mcp
      name: filesystem
      server: fs-mcp

extensions:
  agents_md:
    enabled: true
    cursor_integration: true
    sections:
      dev_environment:
        custom: |
          ## Cursor Composer Tips
          - Use Cmd+K for inline edits
          - Use Cmd+L for chat
          - Reference AGENTS.md for project context

  cursor:
    enabled: true
    agent_type: composer
    workspace_config:
      agents_md_path: AGENTS.md
      context_files: [AGENTS.md, README.md]
```

## Example Workflows

### Basic Generation

```yaml
extensions:
  agents_md:
    enabled: true
    sections:
      dev_environment:
        enabled: true
        custom: |
          - Install dependencies: `npm install`
          - Start dev server: `npm run dev`
      testing:
        enabled: true
        custom: |
          - Run tests: `npm test`
          - Coverage: `npm run coverage`
```

### Advanced with Source Mapping

```yaml
extensions:
  agents_md:
    enabled: true
    sections:
      dev_environment:
        enabled: true
        source: spec.tools  # Auto-generate from tools
      testing:
        enabled: true
        source: spec.constraints  # Auto-generate from constraints
      pr_instructions:
        enabled: true
        title_format: "[{metadata.labels.domain}] {title}"
        source: spec.autonomy
```

### Continuous Sync

```yaml
extensions:
  agents_md:
    enabled: true
    sync:
      on_manifest_change: true
      include_comments: true
```

Then run:

```bash
ossa agents-md sync manifest.yaml --watch
```

## Best Practices

### 1. Keep AGENTS.md in Sync

Always regenerate AGENTS.md after manifest changes:

```bash
# After editing manifest
ossa agents-md generate manifest.yaml
git add AGENTS.md
git commit -m "Update AGENTS.md from manifest"
```

### 2. Use Custom Content for Specifics

Combine auto-generation with custom content:

```yaml
sections:
  dev_environment:
    source: spec.tools  # Auto-generate tool list
    custom: |
      ## Additional Setup
      - Configure environment: `cp .env.example .env`
      - Start services: `docker-compose up`
```

### 3. Include in Cursor Context

Always add AGENTS.md to Cursor context files:

```yaml
cursor:
  workspace_config:
    agents_md_path: AGENTS.md
    context_files:
      - AGENTS.md  # Important!
      - README.md
```

### 4. Version Control

Commit AGENTS.md to version control:

```bash
git add AGENTS.md
git commit -m "Add agents.md for AI coding agents"
```

### 5. Validate Regularly

Validate AGENTS.md against your manifest:

```bash
ossa agents-md validate AGENTS.md manifest.yaml
```

## Troubleshooting

### AGENTS.md Not Generated

**Problem:** `ossa agents-md generate` fails

**Solution:** Ensure `agents_md.enabled` is `true`:

```yaml
extensions:
  agents_md:
    enabled: true  # Must be true
```

### Validation Warnings

**Problem:** `ossa agents-md validate` shows warnings

**Solution:** Regenerate AGENTS.md:

```bash
ossa agents-md generate manifest.yaml
```

### Cursor Not Reading AGENTS.md

**Problem:** Cursor doesn't see AGENTS.md content

**Solution:** Add to `context_files`:

```yaml
cursor:
  workspace_config:
    agents_md_path: AGENTS.md
    context_files:
      - AGENTS.md  # Add this
```

### Sync Not Working

**Problem:** Changes to manifest don't update AGENTS.md

**Solution:** Enable sync and run watch:

```yaml
extensions:
  agents_md:
    sync:
      on_manifest_change: true
```

```bash
ossa agents-md sync manifest.yaml --watch
```

## Related Resources

- [OpenAI agents.md Repository](https://github.com/openai/agents.md)
- [agents.md Website](https://agents.md)
- [OSSA Cursor Extension](./cursor.md)
- [OSSA Schema v0.2.8](https://openstandardagents.org/schemas/v0.2.8/agent.json)

## Support

For issues or questions:

- [GitHub Issues](https://github.com/blueflyio/openstandardagents/issues)
- [GitLab Issues](https://gitlab.com/blueflyio/openstandardagents/-/issues)
- [Documentation](https://openstandardagents.org)
