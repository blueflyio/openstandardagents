# 🏢 Level 5: Basic Workspace

Simple multi-project workspace with basic agent discovery and coordination.

## What This Shows

- **Project Discovery**: Automatic scanning for `.agents/` directories
- **Basic Orchestration**: Sequential and parallel coordination patterns
- **Load Balancing**: Simple round-robin routing
- **Cross-Project Communication**: Agents can discover and call each other

## Quick Start

```bash
# Initialize workspace
ossa workspace init --config workspace.yml

# Scan for agents across projects
ossa workspace discover

# List discovered agents
ossa agents list --workspace
```

## Next Steps

→ **Level 6**: `06-workspace-enterprise/` - Add compliance, security, and monitoring
→ **Level 7**: `10-workspace-orchestration/` - Advanced orchestration patterns