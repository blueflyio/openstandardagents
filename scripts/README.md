# OSSA Agent Migration Scripts

## migrate-ossa-agent.cjs

Converts OSSA v1.0 agents to v0.2.2 format with framework integration support.

### Usage

```bash
# Dry run (shows what would be migrated)
node scripts/migrate-ossa-agent.cjs <directory> --dry-run -r

# Actual migration
node scripts/migrate-ossa-agent.cjs <directory> -r

# Migrate from OSSA repo only
node scripts/migrate-ossa-agent.cjs . -r

# Migrate from common_npm packages
node scripts/migrate-ossa-agent.cjs ../common_npm -r

# Migrate from agent-buildkit
node scripts/migrate-ossa-agent.cjs ../agent-buildkit -r
```

### What It Does

1. Reads all `.ossa.yaml` and `.ossa.yml` files
2. Detects v1.0 format (`ossaVersion: '1.0'` with `agent:`)
3. Converts to v0.2.2 format (`apiVersion: ossa/v1` with Kubernetes-style)
4. Auto-detects framework integrations (kagent, buildkit, librachat, mcp, etc.)
5. Creates `.v0.2.2.ossa.yaml` files alongside originals

### Framework Detection

The script automatically detects and adds extensions for:
- **kagent** - Kubernetes agents
- **buildkit** - Buildkit deployment
- **librachat** - Librechat integration
- **mcp** - Model Context Protocol
- **langchain** - Langchain integration
- **crewai** - CrewAI agents
- **drupal** - Drupal module integration

### Migration Pattern

- `agent.id` → `metadata.name`
- `agent.name` → `metadata.description`
- `agent.version` → `metadata.version`
- `agent.tags` → `metadata.labels`
- `agent.role` → `spec.role`
- `agent.capabilities` → `spec.tools`
- Adds taxonomy, extensions for frameworks
- Preserves all original metadata as annotations

### Example Output

```
Migration Summary:
  Successfully migrated: 42
  Skipped: 28
  Errors: 0
```

### Next Steps After Migration

1. Validate each migrated agent:
   ```bash
   node bin/ossa validate path/to/agent.v0.2.2.ossa.yaml
   ```

2. Review framework-specific extensions in `spec.extensions.*`

3. Replace old v1.0 files once validated

4. Test integration with each framework

