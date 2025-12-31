## 🤖 OSSA Agent Change

### Agent Information

| Field | Value |
|-------|-------|
| **Agent Name** | <!-- e.g., security-scanner --> |
| **Kind** | <!-- Agent / Task / Workflow --> |
| **Version** | <!-- e.g., 1.2.0 → 1.3.0 --> |
| **Schema Version** | `ossa/v0.3.2` |

### Change Type

- [ ] 🆕 New agent definition
- [ ] 📝 Agent manifest update
- [ ] 🔧 LLM configuration change
- [ ] 🛡️ Safety/security policy update
- [ ] 📡 Messaging (A2A) configuration
- [ ] 🔌 MCP tool/resource change
- [ ] 🔄 Workflow composition change
- [ ] ⚙️ Runtime binding update

## Summary

<!-- Describe what this agent does or what changed -->

## Manifest Changes

```yaml
# Key changes (paste relevant YAML sections)
```

---

## 🤖 Affected Service Accounts

<!-- Check which agent service accounts are affected by this MR -->

### IDE Service Accounts
- [ ] `.agents/claude/` — Claude Code / Anthropic
- [ ] `.agents/cursor/` — Cursor IDE
- [ ] `.agents/vscode/` — VS Code / Copilot Chat
- [ ] `.agents/copilot/` — GitHub Copilot
- [ ] `.agents/jetbrains/` — JetBrains AI
- [ ] `.agents/cody/` — Sourcegraph Cody
- [ ] `.agents/windsurf/` — Windsurf IDE
- [ ] `.agents/kiro/` — Kiro IDE

### Specialized Service Accounts
- [ ] `.agents/spec-healer/` — Spec Healer (schema validation/migration)
- [ ] `.agents/example-agent/` — Example/Template Agent

### Worker Service Accounts
- [ ] `.agents/workers/drupal-migration-intelligence/` — Drupal Migration
- [ ] `.agents/workers/drupal-module-developer/` — Drupal Module Dev
- [ ] `.agents/workers/drupal-security-compliance/` — Drupal Security
- [ ] `.agents/workers/security-healer/` — Security Healer

### Orchestrator Service Accounts
- [ ] `.agents/orchestrators/meta-orchestrator/` — Meta Orchestrator

### Validation Commands

```
/ossa validate              # Validate all manifests in MR
/ossa validate --strict     # Strict mode (no additionalProperties)
/ossa diff                  # Show schema diff from main
/ossa migrate --check       # Check migration from v0.2.x
```

---

## OSSA v0.3.2 Compliance Checklist

### LLM Configuration
- [ ] No hardcoded model names (use `${LLM_MODEL:-default}`)
- [ ] Fallback models configured
- [ ] Execution profile specified (`fast`/`balanced`/`deep`/`safe`)
- [ ] Cost tracking enabled (if applicable)
- [ ] Retry configuration present

### Safety & Security
- [ ] Content filtering configured
- [ ] PII detection enabled (if handling user data)
- [ ] Rate limiting configured
- [ ] Guardrails defined
- [ ] Human-in-loop triggers (if autonomous)

### Observability
- [ ] Tracing enabled with endpoint
- [ ] Metrics exporter configured
- [ ] Log level appropriate for environment
- [ ] SLOs defined (production agents)

### State Management
- [ ] State mode declared (`stateless`/`session`/`long_running`)
- [ ] Storage encryption enabled (if persisting sensitive data)
- [ ] Retention policy defined

### Messaging (if A2A)
- [ ] Published channels documented with schemas
- [ ] Subscriptions have handlers defined
- [ ] Reliability config appropriate for use case
- [ ] DLQ enabled for critical messages

### MCP Extension (if applicable)
- [ ] Tools have input schemas
- [ ] Resources have proper URIs
- [ ] Prompts have argument definitions

---

## Testing

### Manual Testing
- [ ] Agent responds to expected inputs
- [ ] Error handling works correctly
- [ ] Fallback models activate on failure
- [ ] Rate limiting enforced

### Automated Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Schema validation passes
- [ ] Example payloads validated

---

## Rollout Plan

- [ ] **Stage 1**: Deploy to `development`
- [ ] **Stage 2**: Canary in `staging` (10% traffic)
- [ ] **Stage 3**: Full `staging` deployment
- [ ] **Stage 4**: Production canary (5% traffic)
- [ ] **Stage 5**: Full production rollout

### Rollback Trigger

<!-- Define conditions that should trigger rollback -->
- Error rate > 5%
- Latency P95 > 2s
- Cost per request > $X

---

## Related Documentation

- [ ] Agent README updated
- [ ] API documentation updated
- [ ] Runbook updated (production agents)
- [ ] Architecture diagram updated

---

/label ~"ossa" ~"agent" ~"needs-validation"
/assign_reviewer @bot-ossa-validator @bot-mr-reviewer
