# OSSA CLI Commands

This directory contains all CLI commands for the OSSA (Open Standards for Scalable Agents) project.

## Directory Structure

### Main CLI Entry Point
- **`ossa-cli.ts`** - Main CLI entry point and command orchestration

### `/commands/` - Core CLI Commands
- **`agent-builder.ts`** - Agent creation and scaffolding
- **`ossa.ts`** - Core OSSA commands
- **`validate.ts`** - OpenAPI and OSSA validation commands
- **`workspace.ts`** - Workspace management
- **`worktree.ts`** - Git worktree operations

### `/commands/deployment/` - Deployment Commands
- **`agent-deployment.ts`** - Agent deployment and scaling
- **`monitor-activation.ts`** - Deployment monitoring

### `/commands/docs/` - Documentation Commands
- **`docs-pipeline.ts`** - Documentation build pipeline
- **`docs-safe-reorg.ts`** - Safe documentation reorganization
- **`generate-api-docs.ts`** - API documentation generation
- **`organize-docs.ts`** - Documentation organization
- **`serve-api-docs.ts`** - Documentation server

### `/commands/federation/` - Federation Commands
- **`activate-federated-learning.ts`** - Federated learning activation
- **`activate-with-existing-qdrant.ts`** - Qdrant integration
- **`launch-federated-network.ts`** - Network initialization
- **`vortex-federated-integration.ts`** - Vortex integration

### `/commands/validation/` - Validation Commands
- **`validate-golden.ts`** - Golden workflow validation
- **`validate-ossa-compliance.ts`** - OSSA compliance checking
- **`validate-schemas.ts`** - Schema validation

## Usage

### Primary Commands
```bash
# Validate OpenAPI specifications
ossa validate openapi spec.yml --ossa-version 0.1.9

# Create new agent
ossa agent create --type worker --name my-agent

# Deploy agent
ossa deploy --agent my-agent --target kubernetes

# Generate documentation
ossa docs generate --input src/api --output docs/
```

### Specialized Commands
```bash
# Federation
ossa federation activate --network production
ossa federation launch --nodes 3

# Validation
ossa validate golden --project .
ossa validate compliance --level gold

# Documentation
ossa docs serve --port 8080
ossa docs pipeline --auto-deploy
```

## Development

All CLI commands follow the Commander.js pattern:
- Commands are self-contained modules
- Export command factory functions
- Include help text and examples
- Support both interactive and programmatic use