# Version Automation Implementation Guide

Complete guide to implementing automated version management using GitLab Ultimate Duo Agent Platform and platform-agents.

## Overview

This solution eliminates manual version edits by automating:
- Version detection across all files
- Version bumping (major/minor/patch/rc/release)
- Multi-file synchronization
- Merge request creation
- Integration with GitLab Ultimate features

## Architecture Components

### 1. GitLab Duo Agent Platform
- **Location**: GitLab UI → Automate → Agents
- **Purpose**: Intelligent agent execution with LLM capabilities
- **Features**: Natural language task execution, context awareness

### 2. GitLab Agent (Kubernetes)
- **Location**: Infrastructure → Kubernetes → GitLab Agent
- **Purpose**: Kubernetes cluster access for agent deployment
- **Features**: GitOps, cluster management, observability

### 3. Platform Agents API
- **Repository**: https://gitlab.com/blueflyio/platform-agents
- **Purpose**: Reusable agent capabilities via API
- **Integration**: Vast.ai for scalable compute

## Implementation Steps

### Step 1: Configure Service Accounts

**Uses existing service accounts from platform-agents - no new accounts needed!**

1. **Verify Service Account Exists**:
   - Go to: https://gitlab.com/groups/blueflyio/-/settings/service_accounts
   - Verify `@release-coordinator` exists
   - If not, see platform-agents repository for setup

2. **Set CI/CD Variables**:
   ```bash
   # In GitLab UI: Settings → CI/CD → Variables
   SERVICE_ACCOUNT_RELEASE_COORDINATOR_TOKEN=<token>  # Protected, Masked
   PLATFORM_AGENTS_API_URL=https://api.blueflyagents.com
   VAST_AI_ENABLED=false  # Set to true to use Vast.ai
   VAST_AI_INSTANCE_TYPE=RTX3090
   ```

3. **Optional: Additional Service Accounts**:
   ```bash
   SERVICE_ACCOUNT_MR_REVIEWER_TOKEN=<token>  # For MR reviews
   SERVICE_ACCOUNT_CODE_QUALITY_TOKEN=<token>  # For quality checks
   ```

### Step 2: Configure GitLab Duo Agent (Optional)

If using GitLab Duo Agent Platform:

1. **Navigate to Duo Agent Configuration**:
   ```
   https://gitlab.com/blueflyio/ossa/openstandardagents/-/automate/agents
   ```

2. **Use Existing Agent or Create**:
   - Name: `version-automation-agent`
   - Description: Automated version management
   - Service Account: `@release-coordinator`
   - Copy configuration from `.gitlab/duo-agent-config.yaml`

### Step 3: Register GitLab Agent (Kubernetes)

1. **Navigate to Infrastructure**:
   ```
   https://gitlab.com/blueflyio/ossa/openstandardagents/-/infrastructure/kubernetes
   ```

2. **Connect Cluster**:
   - Click "Connect a cluster"
   - Select "GitLab Agent"
   - Copy agent token

3. **Install Agent in Cluster**:
   ```bash
   # Using Helm
   helm repo add gitlab https://charts.gitlab.io
   helm install gitlab-agent gitlab/gitlab-agent \
     --set config.token=${GITLAB_AGENT_TOKEN} \
     --set config.kasAddress=wss://gitlab.com/-/kubernetes-agent/ \
     --namespace agents \
     --create-namespace
   ```

4. **Configure Agent**:
   - Copy `.gitlab/agents/version-automation-agent/config.yaml`
   - Update in GitLab UI: Infrastructure → Kubernetes → GitLab Agent → Configuration

### Step 4: Configure Platform Agents Integration

1. **Verify Platform Agents API**:
   ```bash
   curl -X GET \
     "${PLATFORM_AGENTS_API_URL}/health" \
     -H "Authorization: Bearer ${PLATFORM_AGENTS_API_TOKEN}"
   ```

2. **Test Agent Invocation**:
   ```bash
   curl -X POST \
     "${PLATFORM_AGENTS_API_URL}/agents/release-manager/invoke" \
     -H "Authorization: Bearer ${PLATFORM_AGENTS_API_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{
       "task": "bump-version",
       "inputs": {
         "bump_type": "patch",
         "current_version": "0.3.3"
       }
     }'
   ```

### Step 5: Enable Vast.ai (Optional)

1. **Configure Vast.ai**:
   ```bash
   # Set in GitLab CI/CD variables
   VAST_AI_ENABLED=true
   VAST_AI_API_KEY=<vast-ai-api-key>
   VAST_AI_INSTANCE_TYPE=RTX3090
   ```

2. **Verify Integration**:
   - Platform agents will automatically use Vast.ai for compute
   - Check Vast.ai dashboard for instance usage

### Step 6: Test Automation

1. **Manual Trigger**:
   ```bash
   # Via GitLab UI
   CI/CD → Pipelines → Run Pipeline
   # Select: duo:version-analysis
   # Set variables:
   #   VERSION_BUMP_REQUESTED=true
   #   BUMP_TYPE=patch
   ```

2. **Schedule Trigger**:
   - Go to: CI/CD → Schedules
   - Create schedule: "Daily Version Check"
   - Cron: `0 2 * * *` (2 AM UTC)
   - Variables: `VERSION_BUMP_REQUESTED=true`

3. **Milestone Trigger**:
   - Create milestone: "v0.3.4"
   - Close milestone
   - Automation automatically triggers

## Workflow

### Automatic Version Bump Flow

```
1. Trigger Event
   ├─ Milestone closed
   ├─ Scheduled (daily 2 AM UTC)
   └─ Manual (GitLab UI)

2. GitLab Duo Agent: Version Analysis
   ├─ Scans all files for version references
   ├─ Detects current version
   └─ Identifies files to update

3. Platform Agents: Version Bump
   ├─ Calculates new version
   ├─ Validates version format
   └─ Returns new version

4. GitLab Duo Agent: Multi-File Sync
   ├─ Updates package.json
   ├─ Updates .version.json
   ├─ Updates all docs
   ├─ Updates CI files
   └─ Updates spec directories

5. GitLab Duo Agent: Create MR
   ├─ Creates feature branch
   ├─ Commits changes
   ├─ Pushes to remote
   └─ Creates merge request

6. Merge Request
   ├─ Auto-assigns reviewers
   ├─ Links to milestone
   ├─ Adds labels
   └─ Waits for approval
```

## File Patterns Detected

The agent automatically detects and updates:

| Pattern | Example | Update Method |
|---------|---------|---------------|
| `package.json` | `"version": "0.3.3"` | JSON update |
| `.version.json` | `"current": "0.3.3"` | JSON update |
| `**/*.md` | `Version {{VERSION}}` | Placeholder replacement |
| `**/*.yaml` | `version: 0.3.3` | YAML update |
| `**/*.yml` | `version: 0.3.3` | YAML update |
| `.gitlab-ci.yml` | `OSSA_VERSION: "0.3.3"` | YAML update |
| `spec/v*/` | Directory name | Directory creation |

## Configuration

### GitLab Duo Agent Config

Located at: `.gitlab/duo-agent-config.yaml`

Key settings:
- Image: `node:20-bookworm`
- Commands: Multi-phase validation and automation
- Timeout: 30 minutes

### CI/CD Pipeline Config

Located at: `.gitlab/ci/version-automation-duo.yml`

Key jobs:
- `duo:version-analysis` - Detect version sources
- `platform-agents:version-bump` - Calculate new version
- `duo:multi-file-sync` - Update all files
- `duo:create-version-mr` - Create merge request

### Agent Manifest

Located at: `.gitlab/agents/version-automation-agent/manifest.ossa.yaml`

OSSA v0.3.3 compliant agent definition with:
- Capabilities: version-detection, version-bump, multi-file-sync
- Workflows: automated-version-bump
- Messaging: version.bumped channel
- Safety: Confirmations for destructive actions

## Monitoring

### GitLab Observability

1. **Pipeline Execution**:
   - CI/CD → Pipelines
   - Filter: `version-automation`

2. **Agent Logs**:
   - Infrastructure → Kubernetes → GitLab Agent
   - View logs for `version-automation-agent`

3. **Metrics**:
   - Observability → Metrics
   - Query: `gitlab_agent_executions_total{agent="version-automation"}`

### Platform Agents Dashboard

- URL: https://api.blueflyagents.com/dashboard
- View: Agent execution history, performance metrics
- Filter: `release-manager` agent

### Vast.ai Console

- URL: https://vast.ai/console
- View: Instance usage, costs, performance
- Filter: `version-automation` jobs

## Troubleshooting

### Agent Not Invoking

**Symptoms**: Duo Agent not executing

**Solutions**:
1. Check GitLab Ultimate license is active
2. Verify Duo Agent is enabled in project settings
3. Check `GITLAB_DUO_AGENT_TOKEN` is set correctly
4. Verify agent permissions in GitLab UI

### Platform Agents API Failing

**Symptoms**: `platform-agents:version-bump` job failing

**Solutions**:
1. Verify `PLATFORM_AGENTS_API_TOKEN` is valid
2. Check platform-agents service is running
3. Test API endpoint: `curl ${PLATFORM_AGENTS_API_URL}/health`
4. Check API logs in platform-agents repository

### Files Not Updating

**Symptoms**: Version changes not applied

**Solutions**:
1. Check file patterns in `detect-version-sources` task
2. Verify agent has write permissions
3. Check branch protection rules
4. Review git diff in pipeline artifacts

### Vast.ai Integration Issues

**Symptoms**: Vast.ai not being used

**Solutions**:
1. Verify `VAST_AI_ENABLED=true`
2. Check Vast.ai API key is set
3. Verify instance type is available
4. Check Vast.ai account balance

## Best Practices

### 1. Version Bump Strategy

- **Patch**: Bug fixes, minor changes
- **Minor**: New features, backward compatible
- **Major**: Breaking changes
- **RC**: Release candidates
- **Release**: Final release

### 2. Branch Strategy

- Always bump on `release/v*.x` branches
- Never bump directly on `main`
- Create feature branch for version bump MR

### 3. Milestone Integration

- Name milestones: `v0.3.4`, `v0.4.0`, etc.
- Close milestone to trigger auto-bump
- Link issues to milestones

### 4. Review Process

- Always review version MR before merging
- Verify all files updated correctly
- Check changelog entries
- Validate version format

## Advanced Features

### Custom File Patterns

Add custom patterns in `.gitlab/agents/version-automation-agent/manifest.ossa.yaml`:

```yaml
tasks:
  - name: detect-version-sources
    inputs:
      search_patterns:
        - "custom-pattern/**/*.custom"
```

### Custom Bump Logic

Modify platform-agents `release-manager` agent for custom bump logic.

### Multi-Project Sync

Extend agent to sync versions across multiple projects:

```yaml
workflows:
  - name: multi-project-version-sync
    tasks:
      - task: sync-project-a
      - task: sync-project-b
      - task: sync-project-c
```

## References

- [GitLab Duo Agent Platform Docs](https://docs.gitlab.com/user/duo_agent_platform/)
- [GitLab Agent Configuration](https://docs.gitlab.com/user/clusters/agent/)
- [Platform Agents Repository](https://gitlab.com/blueflyio/platform-agents)
- [Vast.ai Documentation](https://docs.vast.ai/)
- [OSSA v0.3.3 Specification](../spec/v0.3.3/UNIFIED-SCHEMA.md)
