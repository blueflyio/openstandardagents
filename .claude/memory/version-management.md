# Version Management Memory

## CRITICAL RULE
**NEVER manually update version numbers anywhere in the codebase.**

## Single Source of Truth
`.version.json` at project root

## Commands

### Local
```bash
npm run version:bump <type>     # rc, patch, minor, major, release
npm run version:enhanced <type> # With GitLab integration
npm run version:sync            # Manual sync
npm run version:check           # Validate consistency
```

### GitLab Agent (Production)
- Manual: Click "Bump Version" in GitLab UI
- Automatic: Milestone close triggers auto-bump
- Scheduled: Daily check at 2 AM UTC

## GitLab Agent Integration
**Version Manager Agent** (`.gitlab/agents/version-manager/`)
- OSSA-compliant agent managing OSSA (dogfooding)
- Kubernetes deployment
- Agent mesh integration (10 agents)
- Full observability

## Auto-Syncs To
- `.version.json`
- package.json files
- README badges
- CHANGELOG.md
- RELEASING.md
- All docs with `{{VERSION}}` placeholders
- Spec directories
- OpenAPI specs

## Placeholders
- `{{VERSION}}` - Current
- `{{VERSION_STABLE}}` - Stable
- `{{SPEC_PATH}}` - Path
- `{{SCHEMA_FILE}}` - File

## Automation Triggers
1. Pre-build hook
2. Milestone close
3. Daily 2 AM check
4. MR validation

## Documentation
- `.gitlab/docs/development/VERSIONING.md`
- `.gitlab/docs/version-management-automation.md`
- `.gitlab/docs/AGENT-DOGFOODING.md`
