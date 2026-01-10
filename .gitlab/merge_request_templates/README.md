# Merge Request Templates

This directory contains MR templates for different types of changes to the OSSA website repository.

## Available Templates

| Template | Branch Pattern | Description |
|----------|----------------|-------------|
| `default.md` | `feature/*`, `bugfix/*`, `chore/*` | Standard MR template for general changes |
| `ossa-agent.md` | `agent/*` | OSSA agent/manifest changes |
| `ci-pipeline.md` | `ci/*` | CI/CD pipeline modifications |
| `website.md` | `website/*` | Website (Next.js) changes |
| `hotfix.md` | `hotfix/*` | Emergency fixes requiring expedited review |

## Template Auto-Selection

GitLab automatically selects the template based on branch name patterns:

```
feature/123-add-user-auth      → default.md
agent/456-new-validator        → ossa-agent.md
ci/789-add-security-scan       → ci-pipeline.md
website/101-update-homepage    → website.md
hotfix/critical-bug            → hotfix.md
```

## Agent Integration

All templates integrate with automated review agents:

### Always-On Agents
- `@bot-mr-reviewer` - Code review and quality checks

### File-Pattern Triggered Agents
- `@bot-ossa-validator` - Triggered by `*.ossa.yaml` changes
- `@bot-gitlab-ci-fixer` - Triggered by `.gitlab-ci.yml` changes

### Manual Agent Commands

You can invoke agents manually with slash commands in MR comments:

```
/review full              # Comprehensive code review
/review security          # Security-focused review
/review urgent            # Expedited review (hotfixes)

/validate --strict        # Strict OSSA schema validation
/ossa lint                # OSSA manifest linting

/ci validate              # CI configuration validation
/fix pipeline             # Auto-fix CI issues
```

## Checklist Conventions

Templates use checkboxes for tracking completion:

- `[x]` - Already enabled/required
- `[ ]` - Optional or to be completed by author

## Labels

Templates automatically apply relevant labels:

- `~needs-review` - Awaiting review
- `~agent-assisted` - Agent automation enabled
- `~ossa` - OSSA-related changes
- `~ci-cd` - CI/CD changes
- `~website` - Website changes
- `~hotfix` - Emergency fixes
- `~expedited` - Fast-track review

## Related Documentation

- [Agent Integration CI](./../ci/agent-integration.yml) - CI jobs for agent automation
- [MR Agent Router](../../.agents/workflows/mr-agent-router.ossa.yaml) - OSSA workflow for routing
- [GitLab MR Events Trigger](../../.agents/triggers/gitlab-mr-events.ossa.yaml) - Event triggers
