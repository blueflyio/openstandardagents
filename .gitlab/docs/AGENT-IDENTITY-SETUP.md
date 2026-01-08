# Agent Identity & Service Account Configuration

## Overview

The `.claude/agent-identity` file is a **simple identifier** for Claude Desktop to know which agent context to use. However, for **proper service account integration** with platform-agents, you need to configure the **OSSA `agent-identity` extension** in your agent manifests.

## Two Levels of Identity

### 1. Claude Desktop Identity (`.claude/agent-identity`)

**Purpose**: Simple identifier for Claude Desktop session context
**Location**: `.claude/agent-identity`
**Format**: Plain text (e.g., "ossa")

This is just a label for Claude Desktop to know which agent context you're working in. It's **not** the service account configuration.

### 2. OSSA Agent Identity Extension (In Manifests)

**Purpose**: Full service account and authentication configuration
**Location**: In OSSA agent manifests (`.ossa.yaml` files)
**Format**: YAML using `agent-identity` extension

This is where you configure service accounts, tokens, authentication, and git attribution.

## How to Configure Agent Identity with Service Accounts

### Step 1: Configure in OSSA Agent Manifest

Add the `agent-identity` extension to your agent manifest:

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: my-agent
  # ...

extensions:
  agent_identity:
    provider: gitlab
    service_account:
      username: deployment-service-account
      email: deployment-service-account@bluefly.io
      display_name: Deployment Service Account
      roles: [maintainer]

    authentication:
      method: personal_access_token
      scopes:
        - api
        - write_repository
        - read_repository
      auto_refresh: true
      rotation_policy:
        enabled: true
        interval_days: 90

    token_source:
      env_var: SERVICE_ACCOUNT_DEPLOYMENT_TOKEN
      file_path: ~/.tokens/gitlab-deployment
      fallback:
        - env_var: GITLAB_TOKEN
        - env_var: CI_JOB_TOKEN

    patterns:
      - "*/openstandardagents/*"
      - "*/platform-agents/*"

    session:
      # Claude Code integration
      enabled: true
      session_id_generation: uuid_v4
      persist_context: true
```

### Step 2: Map to Platform-Agents

When using platform-agents, the agent-identity should reference the service account that the platform-agent uses:

```yaml
# In your workflow or agent manifest
extensions:
  agent_identity:
    service_account:
      username: deployment-service-account  # Matches platform-agents service account
      email: deployment-service-account@bluefly.io
    token_source:
      env_var: SERVICE_ACCOUNT_DEPLOYMENT_TOKEN  # CI/CD variable
```

### Step 3: Ensure CI/CD Variables Are Set

The agent-identity extension will automatically use the service account token from CI/CD variables:

```bash
# In GitLab CI/CD Settings
SERVICE_ACCOUNT_DEPLOYMENT_TOKEN = <token> (Protected, Masked)
SERVICE_ACCOUNT_SECURITY_TOKEN = <token> (Protected, Masked)
SERVICE_ACCOUNT_MONITORING_TOKEN = <token> (Protected, Masked)
SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN = <token> (Protected, Masked)
```

## Platform-Agents Service Account Mapping

| Platform-Agent | Service Account | CI/CD Variable | OSSA Extension Config |
|----------------|----------------|----------------|------------------------|
| `vulnerability-scanner` | `security-service-account` | `SERVICE_ACCOUNT_SECURITY_TOKEN` | `service_account.username: security-service-account` |
| `mr-reviewer` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | `service_account.username: deployment-service-account` |
| `release-coordinator` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | `service_account.username: deployment-service-account` |
| `documentation-aggregator` | `deployment-service-account` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | `service_account.username: deployment-service-account` |
| `ossa-validator` | `security-service-account` | `SERVICE_ACCOUNT_SECURITY_TOKEN` | `service_account.username: security-service-account` |
| `cost-intelligence-monitor` | `monitoring-service-account` | `SERVICE_ACCOUNT_MONITORING_TOKEN` | `service_account.username: monitoring-service-account` |

## Example: Complete Agent Manifest with Identity

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: vulnerability-scanner
  version: 1.0.0
  description: Security vulnerability scanner using platform-agents

spec:
  # ... agent capabilities, tools, etc.

extensions:
  agent_identity:
    provider: gitlab
    service_account:
      username: security-service-account
      email: security-service-account@bluefly.io
      display_name: Security Scanner Service Account
      roles: [developer]

    authentication:
      method: personal_access_token
      scopes: [api, read_repository]
      auto_refresh: true

    token_source:
      env_var: SERVICE_ACCOUNT_SECURITY_TOKEN
      fallback:
        - env_var: GITLAB_TOKEN
        - env_var: CI_JOB_TOKEN

    # Auto-detect when working in security-related directories
    patterns:
      - "**/security/**"
      - "**/.gitlab/ci/**"
      - "**/spec/**"

    # Claude Code session integration
    session:
      enabled: true
      session_id_generation: uuid_v4

    # DORA metrics tracking
    dora_tracking:
      enabled: true
      metrics:
        - deployment_frequency
        - lead_time
        - mttr
```

## How It Works

1. **Agent Executes** → Checks `agent-identity` extension
2. **Token Resolution** → Uses `token_source` priority:
   - First: `SERVICE_ACCOUNT_SECURITY_TOKEN` (from CI/CD)
   - Fallback: `GITLAB_TOKEN`
   - Fallback: `CI_JOB_TOKEN`
3. **Git Attribution** → Commits/operations attributed to `security-service-account@bluefly.io`
4. **Audit Trail** → All operations tracked under service account
5. **Claude Integration** → Session context from `.claude/agent-identity` + OSSA extension

## Verification

### Check Service Account Identity

```bash
# In CI/CD job
echo "Service Account: ${SERVICE_ACCOUNT_SECURITY_TOKEN:0:10}..."
curl -X GET \
  "${CI_API_V4_URL}/user" \
  --header "PRIVATE-TOKEN: ${SERVICE_ACCOUNT_SECURITY_TOKEN}"
```

### Verify in GitLab

1. Go to: https://gitlab.com/groups/blueflyio/-/settings/service_accounts
2. Click on service account (e.g., `security-service-account`)
3. Check "Activity" tab to see operations
4. Verify commits show service account as author

## Summary

- **`.claude/agent-identity`**: Simple identifier for Claude Desktop (just "ossa")
- **OSSA `agent-identity` extension**: Full service account configuration in manifests
- **Service accounts**: Configured in GitLab group settings
- **CI/CD variables**: Tokens stored as Protected/Masked variables
- **Platform-agents**: Use service accounts via `agent-identity` extension

The `.claude/agent-identity` file is just a label. The real service account configuration happens in the OSSA manifest using the `agent-identity` extension.
