# Platform-Agents Verification & Service Account Setup

## Current Status

**Platform-Agents Project**: https://gitlab.com/blueflyio/platform-agents
**Version Pinned**: `v0.1.4-dev8` (in `.gitlab-ci.yml` line 57)
**CI Include**: `.gitlab/ci/agent-suite.yml` from platform-agents project

## Agents Available in Platform-Agents

Based on your list, these agents should be available:

| Agent | Service Account | CI/CD Variable | Status |
|-------|----------------|----------------|--------|
| `vulnerability-scanner` | `security-service-account` | `SERVICE_ACCOUNT_SECURITY_TOKEN` | ⚠️ Verify |
| `mr-reviewer` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | ⚠️ Verify |
| `recipe-publisher` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | ⚠️ Verify |
| `release-coordinator` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | ⚠️ Verify |
| `task-dispatcher` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | ⚠️ Verify |
| `pipeline-remediation` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | ⚠️ Verify |
| `code-quality-reviewer` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | ⚠️ Verify |
| `documentation-aggregator` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | ✅ Used |
| `ossa-validator` | `security-service-account` | `SERVICE_ACCOUNT_SECURITY_TOKEN` | ⚠️ Verify |
| `module-generator` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | ⚠️ Verify |
| `drupal-standards-checker` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | ⚠️ Verify |
| `cluster-operator` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | ⚠️ Verify |
| `issue-lifecycle-manager` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | ⚠️ Verify |
| `mcp-server-builder` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | ⚠️ Verify |
| `cost-intelligence-monitor` | `monitoring-service-account` | `SERVICE_ACCOUNT_MONITORING_TOKEN` | ⚠️ Verify |
| `kagent-catalog-sync` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | ⚠️ Verify |

## How Platform-Agents Are Currently Used

### 1. CI/CD Include (`.gitlab-ci.yml`)

```yaml
include:
  - project: 'blueflyio/agent-platform/platform-agents'
    ref: 'v0.1.4-dev8'
    file: '/.gitlab/ci/agent-suite.yml'
```

This includes the agent suite from platform-agents, which should define jobs for all agents.

### 2. Extension Development Pipeline (`.gitlab/ci/extension-development.yml`)

Currently uses:
- `manifest-validator` (via `.agent-job-template`)
- `merge-request-reviewer` (via `.agent-job-template`)
- `documentation-aggregator` (referenced in workflow)

### 3. Workflow References (`.gitlab/agents/extension-development-team.ossa.yaml`)

Workflow references agents but execution happens via CI/CD:
- `agent_name: documentation-aggregator`
- `agent_name: manifest-validator`
- `agent_name: merge-request-reviewer`

## Service Account Setup

### Step 1: Verify Service Accounts Exist

Go to: https://gitlab.com/groups/blueflyio/-/settings/service_accounts

Verify these service accounts exist:
- `version-manager-service-account`
- `deployment-service-account`
- `monitoring-service-account`
- `security-service-account`

### Step 2: Generate Personal Access Tokens

For each service account:
1. Go to service account profile
2. Settings → Access Tokens
3. Create token with scopes:
   - `api` (required)
   - `write_repository` (for agents that create MRs/commits)
   - `read_repository` (for agents that read code)

### Step 3: Add CI/CD Variables

Go to: https://gitlab.com/blueflyio/openstandardagents/-/settings/ci_cd

Add these variables (Protected, Masked):

| Variable | Value | Protected | Masked |
|----------|-------|-----------|--------|
| `SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN` | `<token>` | ✅ Yes | ✅ Yes |
| `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | `<token>` | ✅ Yes | ✅ Yes |
| `SERVICE_ACCOUNT_MONITORING_TOKEN` | `<token>` | ✅ Yes | ✅ Yes |
| `SERVICE_ACCOUNT_SECURITY_TOKEN` | `<token>` | ✅ Yes | ✅ Yes |
| `GITLAB_SERVICE_ACCOUNT_ENABLED` | `true` | ✅ Yes | ❌ No |

### Step 4: Verify Agent Suite Includes Service Account Support

Check the included `agent-suite.yml` from platform-agents to ensure it:
1. Uses service account tokens when available
2. Falls back to `CI_JOB_TOKEN` if service accounts not configured
3. Properly references agents by name

## How to Use Platform-Agents Agents

### Method 1: Via CI/CD Jobs (Current)

```yaml
my-agent-job:
  extends: .agent-job-template  # From platform-agents/agent-suite.yml
  variables:
    agent_name: vulnerability-scanner
    # Service account token automatically used if available
```

### Method 2: Direct Reference in Workflows

```yaml
# In .gitlab/agents/*.ossa.yaml workflows
- id: scan
  kind: Task
  inline:
    executor: platform-agents
    agent_name: vulnerability-scanner
```

### Method 3: Via GitLab Duo (if enabled)

Agents can be triggered via:
- MR comments: `/scan` → triggers `vulnerability-scanner`
- File changes: `**/*.ossa.yaml` → triggers `ossa-validator`
- Scheduled jobs: Cron triggers → various agents

## Verification Checklist

### ✅ Platform-Agents Integration
- [ ] `.gitlab-ci.yml` includes `agent-suite.yml` from platform-agents
- [ ] Version pinned: `v0.1.4-dev8` (or latest stable)
- [ ] Agent suite file exists and is accessible

### ✅ Service Accounts
- [ ] All 4 service accounts exist in GitLab group
- [ ] Service accounts added to project as members
- [ ] Roles assigned (Developer/Maintainer as needed)
- [ ] PATs generated for each service account
- [ ] Tokens have correct scopes

### ✅ CI/CD Variables
- [ ] All 4 service account token variables set
- [ ] Variables marked as Protected
- [ ] Variables marked as Masked
- [ ] `GITLAB_SERVICE_ACCOUNT_ENABLED` set to `true`

### ✅ Agent Usage
- [ ] Jobs extend `.agent-job-template` from platform-agents
- [ ] `agent_name` variable set correctly
- [ ] Service account tokens used in agent execution
- [ ] Fallback to `CI_JOB_TOKEN` if service accounts unavailable

### ✅ Testing
- [ ] Test agent execution in CI/CD pipeline
- [ ] Verify service account activity in GitLab
- [ ] Check audit trail shows service account operations
- [ ] Verify agents have correct permissions

## Troubleshooting

### Issue: Agents Not Found

**Check**:
1. Platform-agents project accessible: https://gitlab.com/blueflyio/platform-agents
2. Version `v0.1.4-dev8` exists and has `.gitlab/ci/agent-suite.yml`
3. Agent names match exactly (case-sensitive)

**Fix**:
```yaml
# Update .gitlab-ci.yml if version changed
- project: 'blueflyio/agent-platform/platform-agents'
  ref: 'v0.1.4-dev8'  # Update to latest version
  file: '/.gitlab/ci/agent-suite.yml'
```

### Issue: Service Account Token Not Working

**Check**:
1. Token exists and is active
2. Token has correct scopes
3. CI/CD variable name matches exactly
4. Variable is Protected/Masked correctly

**Fix**:
```bash
# Test token in CI/CD job
curl -X GET \
  "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}" \
  --header "PRIVATE-TOKEN: ${SERVICE_ACCOUNT_DEPLOYMENT_TOKEN}"
```

### Issue: Agent Has No Permissions

**Check**:
1. Service account is project member
2. Service account has correct role (Developer/Maintainer)
3. Token scopes include required permissions

**Fix**:
1. Add service account to project: Settings → Members
2. Assign role: Developer (read/write) or Maintainer (full access)
3. Regenerate token with correct scopes

## Next Steps

1. **Verify Platform-Agents Version**: Check if `v0.1.4-dev8` is latest
2. **Check Agent Suite**: Verify all 16 agents are defined in `agent-suite.yml`
3. **Map Service Accounts**: Ensure each agent uses correct service account
4. **Test Integration**: Run a test pipeline to verify agents work
5. **Update Documentation**: Update this doc with actual agent names from platform-agents

## References

- **Platform-Agents Project**: https://gitlab.com/blueflyio/platform-agents
- **Service Account Setup**: `.gitlab/docs/SERVICE-ACCOUNTS-SETUP.md`
- **Service Account Quick Start**: `.gitlab/docs/SERVICE-ACCOUNTS-QUICK-START.md`
- **Service Account Mapping**: `.gitlab/docs/SERVICE-ACCOUNTS-MAPPING.md`
- **Agent Refactoring Summary**: `.gitlab/agents/REFACTOR-SUMMARY.md`
