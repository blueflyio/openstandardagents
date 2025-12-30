## Summary

<!-- Provide a brief description of the changes -->

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 📚 Documentation update
- [ ] 🔧 Configuration change
- [ ] ♻️ Refactoring (no functional changes)
- [ ] 🧪 Test coverage improvement

## Related Issues

Closes #<!-- issue number -->

---

## 🤖 OSSA Agent Service Accounts

<!-- Check the boxes to invoke agents. They will respond in comments. -->

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

---

## Agent Commands

<!-- Use these slash commands in comments to trigger specific agent actions -->

```
/ossa validate              # Validate all .ossa.yaml manifests
/ossa validate --strict     # Strict validation (no additionalProperties)
/ossa diff                  # Show schema diff from main
/ossa migrate --check       # Check migration from v0.2.x
/review security            # Security-focused review
/review performance         # Performance analysis
```

---

## OSSA v0.3.2 Compliance Checklist

### Version Requirements
- [ ] No hardcoded version numbers (use `getApiVersion()` or `getVersion()`)
- [ ] Agent manifests use `apiVersion: ossa/v0.3.2` format
- [ ] Dynamic LLM config: `${LLM_PROVIDER:-anthropic}`, `${LLM_MODEL:-claude-sonnet-4}`

### LLM Configuration
- [ ] No hardcoded model names (use environment variable substitution)
- [ ] Fallback models configured
- [ ] Execution profile specified (`fast`/`balanced`/`deep`/`safe`)
- [ ] Cost tracking enabled (if applicable)

### Safety & Observability
- [ ] Content filtering configured (if needed)
- [ ] Tracing enabled
- [ ] Metrics configured
- [ ] Rate limiting (if applicable)

---

## Checklist

### Author
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No hardcoded versions in source code
- [ ] Tests added/updated
- [ ] No sensitive data committed

### OSSA Validation
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] `ossa validate .agents/` passes (if agent changes)

### Reviewer
- [ ] Code review completed
- [ ] Tests pass
- [ ] No security concerns
- [ ] Approved for merge

---

## Screenshots / Demo

<!-- If applicable, add screenshots or recordings -->

## Additional Context

<!-- Any other information reviewers should know -->

---

/label ~"needs-review"
