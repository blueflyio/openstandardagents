# CLI Reference

The OSSA CLI provides commands for managing AI agents throughout their lifecycle.

## Installation

```bash
npm install -g @bluefly/openstandardagents
```

## Quick Start

```bash
# Validate an agent manifest
ossa validate agent.ossa.yaml

# Generate a new agent
ossa generate worker --name "My Agent"

# Run an agent locally
ossa run agent.ossa.yaml
```

## Commands

### [ossa validate](./ossa-validate.md)

Validate OSSA agent manifests against the schema

### [ossa generate](./ossa-generate.md)

Generate OSSA agent manifests from templates

### [ossa migrate](./ossa-migrate.md)

Migrate agent manifests between OSSA versions

### [ossa run](./ossa-run.md)

Run an OSSA agent locally

### [ossa init](./ossa-init.md)

Initialize a new OSSA project

### [ossa setup](./ossa-setup.md)

Set up OSSA development environment

### [ossa export](./ossa-export.md)

Export agent manifest to different formats

### [ossa import](./ossa-import.md)

Import agents from other frameworks

### [ossa schema](./ossa-schema.md)

View and manage OSSA schemas

### [ossa gitlab-agent](./ossa-gitlab-agent.md)

Manage GitLab agent integration

### [ossa agents](./ossa-agents.md)

Manage OSSA agents


## Global Options

- `--help` - Show help for any command
- `--version` - Show OSSA CLI version
- `--config <path>` - Path to config file
- `--verbose` - Enable verbose logging
- `--quiet` - Suppress output

## Configuration

The OSSA CLI can be configured via:

1. **Config file**: `.ossarc.json` or `.ossarc.yaml`
2. **Environment variables**: `OSSA_*`
3. **Command-line flags**

Example `.ossarc.json`:

```json
{
  "registry": "https://registry.ossa.dev",
  "defaultVersion": "0.2.8-RC",
  "validation": {
    "strict": true
  }
}
```

## Environment Variables

- `OSSA_REGISTRY` - Agent registry URL
- `OSSA_API_KEY` - API authentication key
- `OSSA_VERSION` - Default OSSA version
- `OSSA_DEBUG` - Enable debug mode

## Related Documentation

- [API Reference](../api-reference/index.md)
- [Schema Reference](../schema-reference/index.md)
- [Getting Started](../getting-started/index.md)
- [Guides](../guides/index.md)
