# Version Management Memory

## CRITICAL RULE
**NEVER manually update version numbers anywhere in the codebase.**

## Single Source of Truth
`.version.json` at project root contains:
```json
{
  "current": "0.2.6",
  "latest_stable": "0.2.4"
}
```

## Commands

### Local Development
```bash
npm run version:bump rc        # Create RC (0.2.5 → 0.2.6-RC)
npm run version:bump patch     # Patch (0.2.5 → 0.2.6)
npm run version:bump minor     # Minor (0.2.5 → 0.3.0)
npm run version:bump major     # Major (0.2.5 → 1.0.0)
npm run version:bump release   # RC to stable (0.2.6-RC → 0.2.6)

npm run version:enhanced <type> # Enhanced with GitLab integration
npm run version:sync            # Manual sync
npm run version:check           # Validate consistency
```

### GitLab Agent (Production)
- **Manual**: Click "Bump Version" button in GitLab CI/CD UI
- **Automatic**: Triggers when milestone closes
- **Scheduled**: Daily consistency check at 2 AM UTC

## GitLab Agent Integration

### Version Manager Agent
**Location**: `.gitlab/agents/version-manager/`
- OSSA-compliant agent managing OSSA versions (dogfooding)
- Runs in GitLab Kubernetes cluster
- Integrated with agent mesh (10 agents total)
- Full observability (metrics, traces, logs)

### Capabilities
- Version bumping with approval gates
- Multi-file synchronization
- Documentation template processing
- Git operations (commit, push, MR creation)
- Milestone integration
- Automated workflows

## What Auto-Syncs
- `.version.json` (source of truth)
- `package.json` files
- `README.md` badges
- `CHANGELOG.md` entries
- `RELEASING.md` version
- All docs with `{{VERSION}}` placeholders
- Spec directories (`spec/v{version}/`)
- OpenAPI specifications

## Documentation Placeholders
Use in markdown files:
- `{{VERSION}}` - Current version
- `{{VERSION_STABLE}}` - Latest stable
- `{{SPEC_PATH}}` - Spec directory path
- `{{SCHEMA_FILE}}` - Schema filename

## Automation Triggers
1. **Pre-build**: Syncs before every build (prebuild hook)
2. **Milestone close**: Auto-bumps when milestone closes
3. **Daily check**: Validates consistency at 2 AM UTC
4. **MR validation**: Checks on every merge request

## Documentation
- `.gitlab/docs/development/VERSIONING.md` - Complete guide
- `.gitlab/docs/version-management-automation.md` - Agent automation
- `.gitlab/docs/AGENT-DOGFOODING.md` - Dogfooding demonstration
- `.gitlab/components/version-management/README.md` - CI/CD components
