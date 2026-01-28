# Version Management via GitLab Agents

Automated version management using GitLab agents and OSSA agents. This demonstrates "dogfooding" - using OSSA agents to manage OSSA itself.

## Components

### 1. Version Manager Agent (`.gitlab/agents/version-manager/`)

OSSA agent that handles all version operations:
- Version bumping (major, minor, patch, rc, release)
- Multi-file synchronization
- Documentation template processing
- GitLab API integration
- Merge request creation

### 2. GitLab CI/CD Component (`.gitlab/components/version-management/`)

Reusable CI/CD jobs that invoke the version-manager agent:
- `.version-bump-agent` - Bump version via GitLab agent
- `.version-sync-agent` - Sync versions via GitLab agent
- `.version-consistency-check` - Daily consistency validation

### 3. Enhanced Scripts (`scripts/`)

- `enhanced-version-manager.ts` - GitLab API integration
- `sync-versions.ts` - Multi-file version synchronization
- `bump-version.ts` - Version bumping logic
- `process-doc-templates.ts` - Documentation template processing

## Usage

### Manual Version Bump

```bash
# Via npm script (uses enhanced manager)
npm run version:enhanced patch

# Via direct script
npm run version:bump patch
npm run version:sync
npm run docs:process
```

### GitLab CI/CD Integration

Include in `.gitlab-ci.yml`:

```yaml
include:
  - component: gitlab.com/blueflyio/openstandardagents/version-management/version-bump-agent@main

version:bump:
  extends: .version-bump-agent
  variables:
    BUMP_TYPE: "patch"
    TARGET_BRANCH: "development"
  when: manual
```

### Via GitLab Agent API

```bash
# Trigger version-manager agent directly
curl -X POST \
  "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/agents/${GITLAB_AGENT_ID}/jobs" \
  --header "PRIVATE-TOKEN: ${GITLAB_AGENT_TOKEN}" \
  --data '{
    "job": {
      "name": "version-bump",
      "variables": {
        "BUMP_TYPE": "patch"
      }
    }
  }'
```

## Automation Features

### 1. Milestone-Based Versioning

When a milestone closes, automatically:
- Extract version from milestone title
- Bump version to milestone version
- Create merge request
- Update all files

### 2. Daily Consistency Check

Scheduled job runs daily at 2 AM:
- Validates version consistency
- Reports inconsistencies
- Can auto-fix with approval

### 3. Pre-Build Sync

Automatically runs before every build:
- Syncs version references
- Processes documentation templates
- Validates consistency

## Files Updated Automatically

- `.version.json` - Single source of truth
- `package.json` - Main package version
- `website/package.json` - Website package version
- `README.md` - Badges and links
- `CHANGELOG.md` - Version entries
- `RELEASING.md` - Current version
- `website/content/docs/**/*.md` - All documentation
- `spec/v{X.Y.Z}/` - Spec directory creation
- OpenAPI specifications

## GitLab Agent Integration

The version-manager agent is registered in the agent mesh (`.gitlab/agents/mesh-config.yaml`) and can be invoked:

1. **Via GitLab CI/CD** - Jobs call agent API
2. **Via GitLab Agent Platform** - Direct agent invocation
3. **Via Agent Mesh** - Other agents can trigger version operations
4. **Via Webhook** - External systems can trigger version bumps

## Dogfooding Benefits

This setup demonstrates:
- ✅ OSSA agents managing OSSA itself
- ✅ GitLab agents integrated into CI/CD
- ✅ Multi-agent coordination (version-manager + other agents)
- ✅ Automated workflows with approval gates
- ✅ Full observability and audit trail

## Next Steps

1. Deploy version-manager agent to GitLab Kubernetes
2. Configure GitLab agent tokens
3. Enable version-bump jobs in CI/CD
4. Set up scheduled consistency checks
5. Integrate with milestone workflows

