---
title: "Installation"
---

# Installation Guide

Install OSSA CLI and get ready to create your first agent.

## Prerequisites

- **Node.js** 18+ (for OSSA CLI)
- **npm** or **yarn** package manager
- Basic familiarity with YAML/JSON

## Installation Methods

### Method 1: Global Installation (Recommended)

Install OSSA CLI globally for use across all projects:

```bash
npm install -g @bluefly/open-standards-scalable-agents
```

Verify installation:

```bash
ossa --version
```

### Method 2: Local Installation

Install in a specific project:

```bash
npm install --save-dev @bluefly/open-standards-scalable-agents
```

Use via npx:

```bash
npx ossa --version
```

### Method 3: Using agent-buildkit (Production)

For production deployments with full features:

```bash
npm install -g @bluefly/agent-buildkit
```

This includes OSSA validation plus:
- GitLab integration
- Kubernetes deployment
- Production monitoring
- Compliance tooling

## Verify Installation

Check that OSSA CLI is working:

```bash
ossa --help
```

You should see:

```
OSSA CLI - Open Standard for Scalable Agents (The OpenAPI for AI Agents)

Usage: ossa [options] [command]

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  validate <path>  Validate OSSA agent manifest or OpenAPI spec
  generate <type>  Generate OSSA agent manifest from template
  migrate <source> Migrate agent manifest between OSSA versions
  help [command]   display help for command
```

## What Gets Installed

### OSSA CLI Commands

- `ossa validate` - Validate agent manifests against JSON Schema
- `ossa generate` - Generate agent manifests from templates
- `ossa migrate` - Migrate between OSSA versions

### Package Contents

- **JSON Schema**: `spec/v0.2.2/ossa-0.2.2.schema.json`
- **TypeScript Types**: Available via package exports
- **CLI Tool**: `bin/ossa` executable

## Troubleshooting

### Command Not Found

If `ossa` command is not found:

```bash
# Check npm global bin path
npm config get prefix

# Add to PATH if needed
export PATH="$(npm config get prefix)/bin:$PATH"
```

### Permission Errors

On Linux/macOS, you may need sudo:

```bash
sudo npm install -g @bluefly/open-standards-scalable-agents
```

Or configure npm to use a different directory:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Version Conflicts

If you have multiple versions:

```bash
# List global packages
npm list -g --depth=0

# Uninstall old version
npm uninstall -g @bluefly/open-standards-scalable-agents

# Install latest
npm install -g @bluefly/open-standards-scalable-agents@latest
```

## Next Steps

1. ✅ Installation complete
2. → [Hello World Tutorial](Hello-World)
3. → [First Agent Creation](First-Agent)

## Related

- [5-Minute Overview](5-Minute-Overview)
- [Hello World Tutorial](Hello-World)
- [CLI Reference](../Technical/CLI-Reference)

