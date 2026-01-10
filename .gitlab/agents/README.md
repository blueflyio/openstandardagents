# OSSA Agents Directory

## Purpose

This directory contains **OSSA-specific reference agents** and workflows that demonstrate OSSA patterns. For general DevOps agents, use `blueflyio/agent-platform/platform-agents`.

## Separation of Duties

### ✅ OSSA-Specific (Keep Here)

**Reference Agents** (`examples/`):
- `platform-researcher.ossa.yaml` - Research platforms for OSSA compatibility
- `schema-designer.ossa.yaml` - Design OSSA extension schemas
- `code-generator.ossa.yaml` - Generate OSSA extension code
- `test-generator.ossa.yaml` - Generate OSSA extension tests

**Workflows**:
- `extension-development-team.ossa.yaml` - Build OSSA extensions (uses platform-agents agents)

### ❌ General DevOps (Use Platform-Agents)

**DO NOT** create general DevOps agents here. Use agents from `blueflyio/agent-platform/platform-agents`:

- `merge-request-reviewer` - Create/review MRs
- `manifest-validator` - Validate manifests
- `documentation-aggregator` - Aggregate documentation
- `task-dispatcher` - Task orchestration
- `code-quality-reviewer` - Code quality checks
- `vulnerability-scanner` - Security scanning
- `pipeline-remediation` - CI/CD fixes
- `release-coordinator` - Release management
- `issue-lifecycle-manager` - Issue management

## Directory Structure

```
.gitlab/agents/
├── examples/                    # OSSA-specific reference agents
│   ├── platform-researcher.ossa.yaml
│   ├── schema-designer.ossa.yaml
│   ├── code-generator.ossa.yaml
│   └── test-generator.ossa.yaml
├── workflows/                   # Workflow inputs
│   └── *.json
├── extension-development-team.ossa.yaml  # Main workflow (uses platform-agents)
├── extension-team-kickoff.yaml          # Kickoff workflow
└── README.md                    # This file
```

## Usage

### Extension Development Workflow

The `extension-development-team.ossa.yaml` workflow:
1. Uses **OSSA-specific** agents from `examples/` for OSSA-specific tasks
2. Uses **platform-agents** agents for general DevOps tasks

```yaml
# OSSA-Specific: Research platform
- ref: ./examples/platform-researcher.ossa.yaml

# Use Platform-Agents: Documentation
- agent: documentation-aggregator
  source: platform-agents

# Use Platform-Agents: Validation
- agent: manifest-validator
  source: platform-agents

# Use Platform-Agents: Create PR
- agent: merge-request-reviewer
  source: platform-agents
```

## Contributing

### Adding OSSA-Specific Agents

1. Ensure agent is **unique to OSSA**
2. Place in `examples/` directory
3. Document OSSA-specific patterns
4. Reference in workflows

### Adding General DevOps Agents

**DO NOT** add here. Instead:
1. Add to `blueflyio/agent-platform/platform-agents`
2. Reference from workflows using `agent: <name>` and `source: platform-agents`

## Reference

- **Platform-Agents**: `blueflyio/agent-platform/platform-agents`
- **OSSA Spec**: `spec/v0.3.3/`
- **Contributing Guide**: `CONTRIBUTING.md`
