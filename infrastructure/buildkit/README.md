# OSSA BuildKit Integration

This directory contains the BuildKit configuration and policy enforcement for OSSA.

## Files

- **config.yaml** - Consolidated BuildKit configuration including:
  - Workflow rules and branch naming standards
  - CI/CD integration settings
  - Token optimization policies
  - Security hooks configuration
  - Audit and compliance settings

- **agent-policy.sh** - Agent-first policy enforcement script that:
  - Analyzes tasks for agent suitability
  - Prevents token waste on large tasks (>500 tokens)
  - Recommends appropriate agent types
  - Validates agent operations

## Usage

### Check if a task should use agents
```bash
./agent-policy.sh --check "refactor the database layer" 1500
```

### Get token optimization tips
```bash
./agent-policy.sh --optimize
```

### Validate agent type for task
```bash
./agent-policy.sh --validate worker "process data files"
```

## Configuration

The main configuration is in `config.yaml`. Key settings:

- **Token Threshold**: 500 tokens (tasks larger than this trigger agent recommendation)
- **Branch Protection**: Enforces feature branch workflow
- **Security Hooks**: Blocks dangerous commands and patterns
- **Audit**: SOC2 compliance logging

## Integration with OSSA

This BuildKit configuration integrates with OSSA's agent system:

1. **Agent Discovery**: Uses OSSA's agent registry to find suitable agents
2. **Task Orchestration**: Leverages OSSA orchestrators for multi-agent workflows
3. **Token Optimization**: Follows OSSA's token efficiency strategies
4. **Compliance**: Maintains OSSA conformance levels (bronze/silver/gold)

## Environment Variables

- `TOKEN_THRESHOLD` - Override the default 500 token threshold
- `OSSA_REGISTRY` - Point to custom OSSA agent registry
- `BUILDKIT_CONFIG` - Use alternative configuration file

## Migration from .buildkit

The original `.buildkit` directory files have been consolidated here:
- `.buildkit/agent-first-policy.sh` → `agent-policy.sh`
- `.buildkit/branching-workflow.json` → `config.yaml` (workflow section)
- `.buildkit/hooks.yaml` → `config.yaml` (hooks section)
- `.buildkit/install-buildkit-setup.cjs` → No longer needed (config in YAML)