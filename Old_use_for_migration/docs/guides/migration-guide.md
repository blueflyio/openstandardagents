# OSSA Migration Guide
## Legacy Scripts → CLI Commands Transition

> **DEPRECATION NOTICE**: All legacy validation scripts are being migrated to standardized CLI commands. This guide provides the complete migration path from deprecated scripts to the new CLI infrastructure.

---

## Migration Timeline

| Phase | Timeline | Status | Description |
|-------|----------|--------|-------------|
| **Phase 1** | 2025-09-02 to 2025-10-01 | 🟨 In Progress | Deprecation warnings added to all scripts |
| **Phase 2** | 2025-10-01 to 2025-11-01 | 🔄 Upcoming | Scripts redirect to CLI commands (with confirmation) |
| **Phase 3** | 2025-11-01 to 2025-12-01 | ⏳ Planned | Scripts show error and exit (CLI commands required) |
| **Phase 4** | 2025-12-01+ | 🗑️ Cleanup | Complete removal of legacy scripts |

---

## Core Migration Mappings

### OSSA Validation Commands

| **Deprecated Script** | **New CLI Command** | **Version** | **Description** |
|-----------------------|-------------------|-------------|-----------------|
| `node validate-ossa-v0.1.6.js <path>` | `ossa validate [path]` | 0.1.6 | Validate OSSA agent specifications |
| `node validate-ossa-v0.1.2.js <path>` | `ossa validate [path] --legacy` | 0.1.0 | Legacy validation (deprecated) |
| `node lib/tools/validation/validate-ossa-v0.1.6.js` | `ossa validate` | 0.1.6 | Direct validation script |
| `node lib/tools/validation/validate-ossa-v0.1.2.js` | `ossa validate --legacy` | 0.1.0 | Legacy validation tool |

### Agent Management Commands

| **Deprecated Script** | **New CLI Command** | **Version** | **Description** |
|-----------------------|-------------------|-------------|-----------------|
| `npm run validate` | `ossa validate` | 0.1.6 | Validate current directory |
| `npm run validate:legacy` | `ossa validate --legacy` | 0.1.0 | Legacy validation mode |
| `npm run test` | `ossa validate examples/` | 0.1.6 | Test examples directory |

### OAAS (Legacy) Migration Commands

| **Deprecated Script** | **New CLI Command** | **Version** | **Description** |
|-----------------------|-------------------|-------------|-----------------|
| `node lib/tools/validation/validate-oaas-v1.3.0.js` | `ossa migrate --from oaas-1.3.0` | 0.1.0 | OAAS v1.3.0 migration |
| `node lib/tools/validation/validate-oaas-v1.2.0.js` | `ossa migrate --from oaas-1.2.0` | 0.1.0 | OAAS v1.2.0 migration |
| `node lib/tools/migration/migrate-to-oaas.js` | `ossa migrate --to oaas` | 0.1.0 | Legacy OAAS migration |
| `node lib/tools/migration/oaas-to-ossa-migrator.js` | `ossa migrate --from oaas` | 0.1.0 | OAAS to OSSA migration |

### UADP Discovery Commands

| **Deprecated Script** | **New CLI Command** | **Version** | **Description** |
|-----------------------|-------------------|-------------|-----------------|
| `node lib/uadp-discovery.js` | `ossa discovery init` | 0.1.6 | Initialize UADP discovery |
| Manual agent discovery | `ossa discovery find` | 0.1.6 | Find agents with UADP |
| Manual agent registration | `ossa discovery register` | 0.1.6 | Register agent with UADP |

---

## CLI Command Reference

### Core Commands

```bash
# Agent Creation
ossa create <name>                    # Create new OSSA v0.1.6 agent
ossa create <name> --tier advanced    # Create advanced tier agent
ossa create <name> --domain security  # Create domain-specific agent

# Validation
ossa validate [path]                  # Validate agent specification
ossa validate --verbose              # Detailed validation output
ossa validate --legacy              # Legacy validation mode

# Agent Management
ossa list                           # List all OSSA agents
ossa list --format json            # JSON output format
ossa upgrade [path]                 # Upgrade agent to v0.1.6

# UADP Discovery
ossa discovery init                 # Initialize UADP discovery
ossa discovery find                 # Find agents with capabilities
ossa discovery register <path>      # Register agent for discovery
ossa discovery health              # Check discovery service health
```

### Framework Integration Commands

```bash
# Bluefly Agent Framework Commands (Version 0.1.0)
@bluefly/agent-studio validate      # Enhanced validation with TDD
@bluefly/agent-ops deploy          # Agent deployment operations
@bluefly/agent-ops monitor         # Agent monitoring and health
@bluefly/agent-forge docs          # Documentation generation
```

---

## GitLab CI/CD Migration

### Deprecated CI Components

| **Deprecated Component** | **New Component** | **Version** | **Migration Path** |
|--------------------------|-------------------|-------------|-------------------|
| `openapi-agent-validate` | `ossa validate` | 0.1.6 | Update `.gitlab-ci.yml` scripts |
| `agent-config-validate` | `ossa validate` | 0.1.6 | Unified validation command |
| Custom validation scripts | `ossa validate --format json` | 0.1.6 | JSON output for CI |

### Updated GitLab CI Example

```yaml
# Updated .gitlab-ci.yml
validate:ossa-agents:
  image: node:18-alpine
  stage: validate
  before_script:
    - npm install -g @bluefly/open-standards-scalable-agents@0.1.6
  script:
    - ossa validate --format json > validation-report.json
    - ossa list --format json > agents-inventory.json
  artifacts:
    reports:
      junit: validation-report.json
    paths:
      - validation-report.json
      - agents-inventory.json
    expire_in: 1 week
```

---

## Package Versioning

All CLI packages follow this versioning scheme:

| **Package** | **Current Version** | **Status** |
|-------------|-------------------|------------|
| `@bluefly/open-standards-scalable-agents` | 0.1.6 | ✅ Stable |
| `@bluefly/agent-studio` | 0.1.0 | 🚧 Development |
| `@bluefly/agent-ops` | 0.1.0 | 🚧 Development |
| `@bluefly/agent-forge` | 0.1.0 | 🚧 Development |
| `@bluefly/agent-cli` | 0.1.0 | 🚧 Development |

---

## Breaking Changes

### Removed Features
- ❌ Direct script execution (Phase 4)
- ❌ OAAS v1.x compatibility (use migration commands)
- ❌ NPM script wrappers (use CLI directly)

### New Requirements
- ✅ Node.js 18+ required
- ✅ CLI installation required: `npm install -g @bluefly/open-standards-scalable-agents@0.1.6`
- ✅ UADP discovery protocol support
- ✅ Enhanced compliance frameworks (ISO 42001, NIST AI RMF)

---

## Migration Examples

### Before (Deprecated)
```bash
# Old validation approach
node validate-ossa-v0.1.6.js examples/core-agent/
npm run validate
./scripts/validate-agents.sh

# Old agent creation
mkdir my-agent
cp -r templates/basic-agent/* my-agent/
```

### After (Current CLI)
```bash
# New validation approach
ossa validate examples/core-agent/
ossa validate --verbose
ossa validate --format json

# New agent creation
ossa create my-agent --tier advanced
ossa discovery register my-agent
```

---

## Support and Troubleshooting

### Common Migration Issues

1. **Script not found**: Install CLI package globally
   ```bash
   npm install -g @bluefly/open-standards-scalable-agents@0.1.6
   ```

2. **Legacy validation failing**: Use migration command
   ```bash
   ossa migrate --from legacy --to 0.1.6
   ```

3. **CI/CD pipeline errors**: Update GitLab CI to use CLI commands
   ```bash
   # Replace in .gitlab-ci.yml
   - node validate-ossa-v0.1.6.js  # Remove
   + ossa validate                  # Add
   ```

### Getting Help

```bash
# CLI help
ossa --help
ossa validate --help
ossa discovery --help

# Version information
ossa --version
```

---

## Compliance Notes

This migration maintains full compliance with:
- ✅ **OSSA v0.1.6 Standard**
- ✅ **ISO 42001** (AI Management Systems)
- ✅ **NIST AI RMF** (AI Risk Management Framework)
- ✅ **Enterprise Integration** (LangChain, CrewAI, OpenAI, MCP)
- ✅ **UADP Discovery Protocol**

For questions or issues, refer to the [OSSA Standard Documentation](https://ossa.agents) or create an issue in the GitLab repository.