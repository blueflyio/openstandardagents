# Version Automation Agent

Automated version management using GitLab Ultimate Duo Agent Platform and platform-agents integration.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              GitLab Ultimate Duo Agent Platform              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Milestone  │      │   Schedule   │      │  Manual   │ │
│  │   Trigger    │─────▶│   Trigger    │─────▶│  Trigger  │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│         │                     │                     │        │
│         └─────────────────────┴─────────────────────┘      │
│                           │                                  │
│                           ▼                                  │
│              ┌────────────────────────┐                     │
│              │  GitLab Duo Agent       │                     │
│              │  (Version Analysis)     │                     │
│              └────────────────────────┘                     │
│                           │                                  │
│                           ▼                                  │
│              ┌────────────────────────┐                     │
│              │  Platform Agents API  │                     │
│              │  (via Vast.ai)         │                     │
│              │  release-manager      │                     │
│              └────────────────────────┘                     │
│                           │                                  │
│                           ▼                                  │
│              ┌────────────────────────┐                     │
│              │  GitLab Duo Agent     │                     │
│              │  (Multi-File Sync)     │                     │
│              └────────────────────────┘                     │
│                           │                                  │
│                           ▼                                  │
│              ┌────────────────────────┐                     │
│              │  GitLab Duo Agent     │                     │
│              │  (Create MR)           │                     │
│              └────────────────────────┘                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 1. Automatic Version Detection
- Scans all files for version references
- Detects patterns in package.json, .version.json, docs, CI files
- Single source of truth: `.version.json`

### 2. Intelligent Version Bumping
- Uses platform-agents `release-manager` agent
- Supports: major, minor, patch, rc, release
- Runs on Vast.ai for compute-intensive operations

### 3. Multi-File Synchronization
- Automatically updates all detected files
- No manual edits required
- Pattern-based detection and replacement

### 4. GitLab Integration
- Creates merge requests automatically
- Links to milestones and issues
- Follows branch protection rules

## Setup

### 1. GitLab Duo Agent Configuration

1. Go to: https://gitlab.com/blueflyio/ossa/openstandardagents/-/automate/agents
2. Create new agent: "Version Automation Agent"
3. Copy configuration from `.gitlab/duo-agent-config.yaml`
4. Set environment variables:
   - `GITLAB_DUO_AGENT_TOKEN`
   - `PLATFORM_AGENTS_API_TOKEN`
   - `VAST_AI_ENABLED` (optional)

### 2. GitLab Agent (Kubernetes)

```bash
# Register agent in GitLab
# Go to: Infrastructure → Kubernetes → Connect a cluster → GitLab Agent

# Install agent in cluster
helm install gitlab-agent .gitlab/agents/version-automation-agent/ \
  --set config.token=${GITLAB_AGENT_TOKEN} \
  --set config.kasAddress=wss://gitlab.com/-/kubernetes-agent/
```

### 3. Platform Agents Integration

The agent uses `platform-agents` repository agents via API:

```yaml
# .gitlab/ci/version-automation-duo.yml
platform-agents:version-bump:
  variables:
    PLATFORM_AGENT: release-manager
    AGENT_ENDPOINT: ${PLATFORM_AGENTS_API}/agents/release-manager/invoke
    VAST_AI_INSTANCE: RTX3090  # Optional: use Vast.ai
```

## Usage

### Automatic Triggers

1. **Milestone Close**: When milestone closes, auto-bumps version
2. **Scheduled**: Daily at 2 AM UTC checks for version consistency
3. **Manual**: Trigger via GitLab UI

### Manual Trigger

```bash
# Via GitLab UI
# CI/CD → Pipelines → Run Pipeline
# Select: duo:version-analysis

# Via API
curl -X POST \
  "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/pipeline" \
  -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  -F "ref=main" \
  -F "variables[VERSION_BUMP_REQUESTED]=true" \
  -F "variables[BUMP_TYPE]=patch"
```

### Via GitLab Duo Agent UI

1. Go to: https://gitlab.com/blueflyio/ossa/openstandardagents/-/automate/agents
2. Select "Version Automation Agent"
3. Click "Invoke Agent"
4. Select task: "automated-version-bump"
5. Set variables:
   - `BUMP_TYPE`: patch|minor|major|rc|release
   - `TARGET_BRANCH`: release/v0.3.x

## Files Managed Automatically

The agent automatically updates:

| File Pattern | What Gets Updated |
|-------------|------------------|
| `package.json` | `version` field |
| `.version.json` | `current` and `latest_stable` |
| `**/package.json` | All package.json files |
| `README.md` | Badges, version references |
| `CHANGELOG.md` | Version headers |
| `**/*.md` | `{{VERSION}}` placeholders |
| `**/*.yaml` | Version references |
| `**/*.yml` | Version references |
| `.gitlab-ci.yml` | Version variables |
| `.gitlab/**/*.yml` | CI configuration |

## Benefits

### Before (Manual)
- ❌ Manual edits in 20+ files
- ❌ Easy to miss files
- ❌ Inconsistent versions
- ❌ Time-consuming
- ❌ Error-prone
- ❌ No audit trail

### After (Automated)
- ✅ Zero manual edits
- ✅ All files updated automatically
- ✅ Version consistency guaranteed
- ✅ Instant execution
- ✅ Error-free
- ✅ Full audit trail
- ✅ GitLab Duo Agent intelligence
- ✅ Platform-agents integration
- ✅ Vast.ai scalability

## Monitoring

### GitLab Observability
- View agent execution in: CI/CD → Pipelines
- Check agent logs: Infrastructure → Kubernetes → GitLab Agent
- Monitor metrics: Observability → Metrics

### Platform Agents Dashboard
- Agent execution: https://api.blueflyagents.com/dashboard
- Vast.ai usage: https://vast.ai/console
- Cost tracking: Automatic

## Troubleshooting

### Agent Not Invoking
1. Check GitLab Duo Agent is enabled
2. Verify `GITLAB_DUO_AGENT_TOKEN` is set
3. Check agent permissions

### Platform Agents API Failing
1. Verify `PLATFORM_AGENTS_API_TOKEN` is valid
2. Check platform-agents service is running
3. Verify Vast.ai credentials (if enabled)

### Files Not Updating
1. Check file patterns in `detect-version-sources` task
2. Verify agent has write permissions
3. Check branch protection rules

## References

- [GitLab Duo Agent Platform](https://docs.gitlab.com/user/duo_agent_platform/)
- [GitLab Agent Configuration](https://docs.gitlab.com/user/clusters/agent/)
- [Platform Agents Repository](https://gitlab.com/blueflyio/platform-agents)
- [Vast.ai Integration](https://docs.vast.ai/)
