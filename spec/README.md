# OSSA Specification

**The OpenAPI for AI Agents**

This directory contains the OSSA (Open Standard for Scalable Agents) specification files.

## Directory Structure

```
spec/
├── README.md                  # This file
├── v1.0/                      # Current stable version (v1.0.0)
│   ├── OSSA-SPECIFICATION-v1.0.md
│   ├── ossa-1.0.schema.json
│   ├── ossa-1.0.yaml
│   └── ossa-reasoning-compliance-1.0.schema.json
├── versions/                  # Legacy versions
│   └── v0.1.9/
│       ├── OSSA-SPECIFICATION-v0.1.9.md
│       ├── ossa-v0.1.9.schema.json
│       ├── agent-autonomous-extensions.json
│       ├── ecosystem-compliance.json
│       └── reasoning-compliance.json
├── examples/                  # Reference implementations (v1.0 compatible)
│   ├── audit-agent.yml
│   ├── chat-agent.yml
│   ├── compliance-agent.yml
│   ├── data-processing-agent.yml
│   ├── development-agent.yml
│   ├── edge-agent.yml
│   ├── integration-agent.yml
│   ├── monitoring-agent.yml
│   ├── serverless-agent.yml
│   └── workflow-agent.yml
└── extensions/                # Platform-specific extensions
    ├── drupal-v1.yml          # Drupal platform extension
    └── kagent-v1.yml          # kAgent (Kubernetes) extension
```

## Version Information

### Current Stable: v1.0.0

- **Status**: Stable
- **Release Date**: 2025-10-26
- **Location**: `/spec/v1.0/`
- **Schema**: `v1.0/ossa-1.0.schema.json`
- **Documentation**: `v1.0/OSSA-SPECIFICATION-v1.0.md`

### Previous Versions

- **v0.1.9** (Legacy)
  - Location: `/spec/versions/v0.1.9/`
  - Status: Deprecated, use v1.0 for new agents

## Quick Start

### Validate an Agent Manifest

```bash
npm install -g @bluefly/open-standards-scalable-agents
ossa validate my-agent.ossa.yaml
```

### Create a New Agent

```bash
ossa generate my-agent --type worker
```

### Migrate from v0.1.9 to v1.0

```bash
ossa migrate my-agent-v0.1.9.yaml --to-version 1.0
```

## Files Explained

### Specification Files

| File | Purpose |
|------|---------|
| `OSSA-SPECIFICATION-v{version}.md` | Human-readable specification documentation |
| `ossa-{version}.schema.json` | JSON Schema for validation |
| `ossa-{version}.yaml` | YAML version of the schema (for tooling) |
| `ossa-reasoning-compliance-{version}.schema.json` | Reasoning/compliance extension schema |

### Extension Files

| File | Purpose |
|------|---------|
| `extensions/drupal-v1.yml` | Drupal platform-specific extension |
| `extensions/kagent-v1.yml` | kAgent (Kubernetes) extension |

### Example Files

All examples in `/spec/examples/` are compatible with the current stable version (v1.0).

## Usage in Your Project

### TypeScript

```typescript
import { validate } from '@bluefly/open-standards-scalable-agents/validation';
import { generate } from '@bluefly/open-standards-scalable-agents/generation';

// Validate a manifest
const result = await validate(manifest);

// Generate a new agent
const agent = await generate({ name: 'my-agent', type: 'worker' });
```

### CLI

```bash
# Validate
ossa validate agent.ossa.yaml

# Generate
ossa generate my-agent --type worker --domain infrastructure

# Migrate
ossa migrate old-agent.yaml --to-version 1.0
```

## Versioning Policy

OSSA follows semantic versioning:

- **Major version** (1.x.x): Breaking changes to specification
- **Minor version** (x.1.x): Backward-compatible additions
- **Patch version** (x.x.1): Bug fixes and clarifications

## Contributing

To propose changes to the OSSA specification:

1. Create a GitLab issue describing the change
2. Submit a merge request with:
   - Updated schema files
   - Updated documentation
   - Migration guide (if breaking change)
   - Example manifests

## License

Apache License 2.0

---

**OSSA: Making AI agents portable, discoverable, and enterprise-ready.**
