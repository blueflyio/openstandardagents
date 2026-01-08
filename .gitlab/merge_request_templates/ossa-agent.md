## OSSA Agent/Manifest Changes

<!-- Template for changes to OSSA specification, schemas, or agent manifests -->

## Agent Information

| Field | Value |
|-------|-------|
| Agent Name | |
| Kind | `worker` / `supervisor` / `router` / `workflow` |
| Version | |
| Schema Version | `ossa/v0.3.0` |

## Type of Change

- [ ] New agent manifest
- [ ] Manifest update/enhancement
- [ ] LLM configuration changes
- [ ] Safety/security configuration
- [ ] Messaging configuration
- [ ] MCP tool integration
- [ ] Workflow definition
- [ ] Runtime binding changes
- [ ] Schema changes (spec/)

## Related Issues

Closes #

## Manifest Changes

<!-- Include the key changes to the manifest -->
```yaml
# Key changes
```

## Agent Validation (Required)

- [x] `@bot-ossa-validator` - Schema validation (required)
- [x] `@bot-mr-reviewer` - Code review (required)

### Validation Commands
```
/ossa validate --strict          - Validate against OSSA v0.3.0 schema
/ossa validate --version 0.3.0   - Validate specific version
/ossa lint                       - Lint manifest structure
/ossa diff                       - Show schema differences
```

## OSSA v0.3.0 Compliance Checklist

### LLM Configuration
- [ ] Model specified with fallback options
- [ ] Execution profile defined (balanced/speed/quality/cost)
- [ ] Token limits configured
- [ ] Cost tracking enabled (if applicable)

### Safety & Security
- [ ] Content filtering configured
- [ ] PII detection enabled (if handling user data)
- [ ] Rate limiting configured
- [ ] Guardrails defined for sensitive operations
- [ ] Input/output validation rules specified

### Observability
- [ ] Tracing configuration present
- [ ] Metrics enabled
- [ ] Logging level appropriate
- [ ] SLOs defined (if production agent)

### State Management
- [ ] State modes defined (stateless/session/persistent)
- [ ] State encryption for sensitive data
- [ ] Retention policies configured

### Messaging (if applicable)
- [ ] A2A channels defined
- [ ] Subscriptions configured
- [ ] Message reliability settings

### MCP Extension (if applicable)
- [ ] Tool schemas validated
- [ ] Resources properly defined
- [ ] Prompts have valid templates

## Testing

### Manual Testing
- [ ] Manifest validates against schema
- [ ] Agent initializes correctly
- [ ] Core capabilities function as expected

### Automated Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Schema validation tests pass

## Rollout Plan

<!-- For production agents -->
| Stage | Environment | Traffic | Duration |
|-------|-------------|---------|----------|
| 1 | Development | 100% | Immediate |
| 2 | Staging | 100% | 24 hours |
| 3 | Production (Canary) | 5% | 24 hours |
| 4 | Production | 25% | 24 hours |
| 5 | Production | 100% | Final |

## Rollback Triggers

- [ ] Error rate > 5%
- [ ] Latency p99 > 2x baseline
- [ ] Safety violations detected
- [ ] Manual rollback requested

## Documentation

- [ ] Agent README updated
- [ ] API documentation updated
- [ ] Changelog entry added
- [ ] Migration guide (if breaking changes)

/label ~ossa ~agent ~needs-review ~agent-assisted
/assign_reviewer @bot-ossa-validator @bot-mr-reviewer
