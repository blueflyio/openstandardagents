# `.agents/` Implementation Guide

## Overview

The `.agents/` directory provides a **local development workspace** for OSSA-compliant agents, mirroring the production-ready `.gitlab/agents/` structure but for private, local development.

## Architecture

```
.agents/                          # Local development (gitignored)
├── README.md                     # Usage guide
├── IMPLEMENTATION.md             # This file
├── .gitkeep                      # Preserve directory
├── local-mesh-config.yaml        # Local mesh configuration
├── example-agent/                # Example template
│   └── manifest.ossa.yaml
└── your-agent/                   # Your custom agents
    ├── manifest.ossa.yaml
    ├── config.yaml (optional)
    └── README.md (optional)

.gitlab/agents/                   # Production agents (version controlled)
├── mesh-config.yaml
├── swarm-tasks.json
└── [9 production agents]
```

## Key Differences

| Feature | `.agents/` | `.gitlab/agents/` |
|---------|-----------|-------------------|
| Purpose | Local development | Production deployment |
| Version Control | Gitignored | Committed to repo |
| Mesh Integration | Optional (local-mesh-config.yaml) | Full mesh (mesh-config.yaml) |
| Security | None (local) | mTLS, RBAC, policies |
| Observability | Debug logging | Full Prometheus/Jaeger |
| Runtime | Local/Docker | Kubernetes |

## CLI Commands

```bash
# List local agents
ossa-agents list

# Show agent info
ossa-agents info my-agent

# Validate agent (use main OSSA CLI)
ossa validate .agents/my-agent/manifest.ossa.yaml
```

## Workflow

### 1. Create Agent
```bash
mkdir -p .agents/my-agent
cp .agents/example-agent/manifest.ossa.yaml .agents/my-agent/
```

### 2. Customize Manifest
Edit `.agents/my-agent/manifest.ossa.yaml` with your agent configuration.

### 3. Validate
```bash
ossa validate .agents/my-agent/manifest.ossa.yaml
```

### 4. Test Locally
```bash
# Run with local runtime (requires implementation)
buildkit agents run .agents/my-agent/manifest.ossa.yaml
```

### 5. Promote to Production
```bash
# Copy to production directory
cp -r .agents/my-agent .gitlab/agents/

# Add to mesh configuration
# Edit .gitlab/agents/mesh-config.yaml

# Commit and deploy
git add .gitlab/agents/my-agent
git commit -m "feat: add my-agent"
```

## Implementation Details

### Files Created

1. **`.agents/README.md`** - User-facing documentation
2. **`.agents/IMPLEMENTATION.md`** - This technical guide
3. **`.agents/.gitkeep`** - Preserve directory structure
4. **`.agents/example-agent/manifest.ossa.yaml`** - Template agent
5. **`.agents/local-mesh-config.yaml`** - Local mesh config
6. **`bin/ossa-agents`** - CLI tool for agent management

### Gitignore Configuration

```gitignore
.agents/*                      # Ignore all contents
!.agents/README.md             # Keep documentation
!.agents/.gitkeep              # Keep directory
!.agents/example-agent/        # Keep example
!.agents/local-mesh-config.yaml # Keep local config
```

### Package.json Integration

```json
{
  "bin": {
    "ossa-agents": "bin/ossa-agents"
  }
}
```

## Design Principles

1. **Minimal** - Only essential files and functionality
2. **Private** - Local agents stay gitignored
3. **Compatible** - Same OSSA spec as production agents
4. **Progressive** - Easy path from local → production
5. **Self-Documenting** - Clear examples and templates

## Use Cases

- **Experimentation**: Test agent configurations without affecting production
- **Custom Agents**: Develop organization-specific agents
- **Learning**: Study OSSA spec with hands-on examples
- **Prototyping**: Rapid agent development before deployment
- **Testing**: Validate agent behavior locally

## Migration Path

```
Local Development → Testing → Production
    .agents/     →  staging  → .gitlab/agents/
```

## Notes

- `.agents/` is **not** deployed - it's for development only
- Use `.gitlab/agents/` as reference for production patterns
- All agents must follow OSSA v0.2.6 specification
- Local mesh config is simplified (no mTLS, no Istio)
