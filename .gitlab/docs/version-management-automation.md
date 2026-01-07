# Version Management Automation - GitLab Agent Integration

## Overview

OSSA uses GitLab agents to automate version management, demonstrating "dogfooding" by using OSSA agents to manage OSSA itself.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitLab CI/CD Pipeline                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Manual     │      │  Milestone   │      │ Scheduled │ │
│  │   Trigger    │─────▶│   Trigger    │─────▶│   Check   │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│         │                     │                     │        │
│         └─────────────────────┴─────────────────────┘      │
│                           │                                  │
│                           ▼                                  │
│              ┌────────────────────────┐                     │
│              │  Version Manager Agent  │                     │
│              │  (GitLab Kubernetes)    │                     │
│              └────────────────────────┘                     │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐              │
│         │                 │                 │                │
│         ▼                 ▼                 ▼                │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │   Bump   │    │   Sync   │    │  Process │             │
│  │  Version │    │  Versions│    │   Docs   │             │
│  └──────────┘    └──────────┘    └──────────┘             │
│         │                 │                 │                │
│         └─────────────────┴─────────────────┘              │
│                           │                                  │
│                           ▼                                  │
│              ┌────────────────────────┐                     │
│              │   Git Operations       │                     │
│              │   (Commit, Push, MR)   │                     │
│              └────────────────────────┘                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Version Manager Agent

**Location**: `.gitlab/agents/version-manager/manifest.ossa.yaml`

OSSA-compliant agent that handles:
- Version bumping (major, minor, patch, rc, release)
- Multi-file synchronization
- Documentation template processing
- GitLab API integration
- Merge request creation

**Capabilities**:
- `version-bumping` - Calculate and apply version bumps
- `version-synchronization` - Sync across all files
- `documentation-processing` - Process 0.3.3 templates
- `git-operations` - Commit, push, create branches/MRs
- `milestone-integration` - Extract versions from milestones
- `mr-creation` - Automated merge request creation

### 2. GitLab CI/CD Jobs

**Location**: `.gitlab/components/version-management/version-bump-agent.yml`

Reusable CI/CD components:
- `.version-bump-agent` - Main version bump job
- `.version-sync-agent` - Version synchronization job
- `.version-consistency-check` - Daily validation job

### 3. Enhanced Scripts

**Location**: `scripts/enhanced-version-manager.ts`

TypeScript script with GitLab API integration:
- Milestone version detection
- Automated MR creation
- Git operations
- Fallback to direct execution

## Workflow

### Manual Version Bump

1. **Trigger**: Click "Bump Version" button in GitLab UI
2. **Agent Invocation**: CI/CD job calls version-manager agent
3. **Version Calculation**: Agent calculates new version
4. **File Updates**: Agent syncs all version references
5. **Documentation**: Agent processes 0.3.3 templates
6. **Git Operations**: Agent creates branch, commits, pushes
7. **Merge Request**: Agent creates MR automatically
8. **Notification**: Agent comments on MR with summary

### Milestone-Based Bump

1. **Trigger**: Milestone closes with 100% completion
2. **Version Extraction**: Agent extracts version from milestone title
3. **Auto-Bump**: Agent bumps to milestone version
4. **Sync & Process**: Agent syncs files and processes docs
5. **MR Creation**: Agent creates MR targeting development
6. **Integration**: MR linked to milestone

### Daily Consistency Check

1. **Schedule**: Runs daily at 2 AM UTC
2. **Validation**: Checks version consistency across all files
3. **Reporting**: Creates GitLab issue if inconsistencies found
4. **Auto-Fix**: Optionally auto-fixes with approval

## Files Managed

The version-manager agent automatically updates:

| File | What Gets Updated |
|------|------------------|
| `.version.json` | `current` and `latest_stable` fields |
| `package.json` | `version` field |
| `website/package.json` | `version` field |
| `README.md` | Badges, schema links, version references |
| `CHANGELOG.md` | `[Unreleased]` → `[vX.Y.Z]` |
| `RELEASING.md` | Current version reference |
| `website/content/docs/**/*.md` | All 0.3.3 placeholders |
| `spec/v{X.Y.Z}/` | Directory creation and schema files |
| OpenAPI specs | Version metadata |

## GitLab Agent Integration

### Agent Registration

The version-manager agent is registered in the agent mesh:

```yaml
# .gitlab/agents/config/mesh-config.yaml
agents:
  - name: version-manager
    namespace: version-management
    endpoint: http://version-manager:8080
    capabilities:
      - version-bumping
      - version-synchronization
      - documentation-processing
      - git-operations
      - milestone-integration
      - mr-creation
```

### Agent Invocation

**Via GitLab CI/CD**:
```yaml
version:bump:agent:
  extends: .version-bump-agent
  variables:
    BUMP_TYPE: "patch"
```

**Via GitLab Agent API**:
```bash
curl -X POST \
  "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/agents/${GITLAB_AGENT_ID}/jobs" \
  --header "PRIVATE-TOKEN: ${GITLAB_AGENT_TOKEN}" \
  --data '{"job": {"name": "version-bump", "variables": {"BUMP_TYPE": "patch"}}}'
```

**Via Agent Mesh**:
Other agents can trigger version operations:
```yaml
- agent: version-manager
  capability: version_bump
  input:
    bump_type: patch
```

## Automation Benefits

### Before (Manual)
- ❌ Manual version updates in 10+ files
- ❌ Easy to miss files
- ❌ Inconsistent versions
- ❌ Time-consuming
- ❌ Error-prone

### After (Automated)
- ✅ Single command: `npm run version:enhanced patch`
- ✅ All files updated automatically
- ✅ Version consistency guaranteed
- ✅ Automated MR creation
- ✅ Milestone integration
- ✅ Daily consistency checks
- ✅ Full audit trail

## Dogfooding Demonstration

This setup demonstrates to GitLab:

1. **OSSA Agents in Production**: Using OSSA agents for real operations
2. **GitLab Agent Integration**: Leveraging GitLab's agent platform
3. **Multi-Agent Coordination**: Agents working together
4. **Automated Workflows**: End-to-end automation
5. **Observability**: Full tracing and metrics
6. **Compliance**: Governance and approval gates

## Configuration

### Required Environment Variables

```bash
# GitLab API
CI_API_V4_URL=https://gitlab.com/api/v4
GITLAB_TOKEN=<your-token>
CI_PROJECT_ID=<project-id>

# GitLab Agent (optional, for agent-based execution)
GITLAB_AGENT_TOKEN=<agent-token>
GITLAB_AGENT_ID=<agent-id>
```

### CI/CD Variables

Set in GitLab UI → Settings → CI/CD → Variables:

- `BUMP_VERSION` - Set to "true" to enable version bump job
- `VERSION_SYNC` - Set to "true" to enable version sync job
- `GITLAB_AGENT_TOKEN` - Token for GitLab agent API
- `GITLAB_AGENT_ID` - ID of version-manager agent

## Usage Examples

### Bump Patch Version

```bash
# Local
npm run version:enhanced patch

# Via GitLab UI
# Click "Bump Version" button → Select "patch"
```

### Bump from Milestone

1. Create milestone: "v0.2.7"
2. Close milestone when ready
3. Agent automatically:
   - Extracts version: 0.2.7
   - Bumps to 0.2.7
   - Creates MR
   - Links to milestone

### Daily Consistency Check

Runs automatically. To trigger manually:

```bash
# Via GitLab UI
# CI/CD → Pipelines → Run Pipeline → Select "version:consistency:check"
```

## Monitoring

### Agent Metrics

The version-manager agent exposes Prometheus metrics:
- `version_bumps_total` - Total version bumps
- `version_syncs_total` - Total sync operations
- `version_errors_total` - Total errors
- `version_operation_duration_seconds` - Operation latency

### GitLab CI/CD Artifacts

Each job produces:
- `version.env` - Version information
- `.version.json` - Updated version config
- `package.json` - Updated package files

## Troubleshooting

### Agent Not Available

If GitLab agent is not available, the system falls back to direct script execution.

### Version Inconsistencies

Run consistency check:
```bash
npm run version:check
```

Auto-fix:
```bash
npm run version:sync
```

### MR Creation Fails

Check:
- `GITLAB_TOKEN` is set
- Token has `api` scope
- Branch protection allows MR creation

## Next Steps

1. Deploy version-manager agent to GitLab Kubernetes
2. Configure agent tokens and permissions
3. Enable version-bump jobs in CI/CD
4. Set up milestone-based automation
5. Monitor agent metrics and logs

