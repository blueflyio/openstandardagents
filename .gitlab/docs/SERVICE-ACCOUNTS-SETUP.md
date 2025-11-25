# GitLab Service Accounts Integration Guide

## Overview

This guide explains how to integrate GitLab service accounts with OSSA GitLab agents for automated version management and operations.

## What are GitLab Service Accounts?

GitLab service accounts are special accounts designed for automation. They:
- Don't consume user licenses
- Have dedicated Personal Access Tokens (PATs)
- Can be assigned to projects/groups
- Provide audit trail for automated operations
- Support fine-grained permissions

## Setup Steps

### 1. Create Service Accounts

Navigate to: https://gitlab.com/groups/blueflyio/-/settings/service_accounts

Create the following service accounts:

#### Version Manager Service Account
- **Name**: `version-manager-service-account`
- **Purpose**: Version management operations
- **Required Scopes**: `api`, `write_repository`, `read_repository`

#### Deployment Service Account
- **Name**: `deployment-service-account`
- **Purpose**: Deployment operations
- **Required Scopes**: `api`, `write_repository`, `read_repository`

#### Monitoring Service Account
- **Name**: `monitoring-service-account`
- **Purpose**: Monitoring and observability
- **Required Scopes**: `api`, `read_repository`

#### Security Service Account
- **Name**: `security-service-account`
- **Purpose**: Security scanning operations
- **Required Scopes**: `api`, `read_repository`

### 2. Generate Personal Access Tokens

For each service account:

1. Go to service account profile
2. Navigate to "Access Tokens"
3. Create token with required scopes
4. **Save token securely** (you won't see it again)

**Token Scopes Required**:
- `api` - Full API access
- `write_repository` - Write to repository (for version bumps)
- `read_repository` - Read repository (for validation)

### 3. Add Service Accounts to Project

For each service account:

1. Go to project: https://gitlab.com/blueflyio/openstandardagents
2. Settings → Members
3. Add service account as member
4. Assign role: **Developer** (for version operations) or **Maintainer** (for deployments)

### 4. Configure CI/CD Variables

Go to: https://gitlab.com/blueflyio/openstandardagents/-/settings/ci_cd

Add the following variables:

| Variable Name | Value | Protected | Masked | Description |
|--------------|-------|-----------|--------|-------------|
| `SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN` | `<token>` | ✅ Yes | ✅ Yes | Version manager service account PAT |
| `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` | `<token>` | ✅ Yes | ✅ Yes | Deployment service account PAT |
| `SERVICE_ACCOUNT_MONITORING_TOKEN` | `<token>` | ✅ Yes | ✅ Yes | Monitoring service account PAT |
| `SERVICE_ACCOUNT_SECURITY_TOKEN` | `<token>` | ✅ Yes | ✅ Yes | Security service account PAT |
| `GITLAB_SERVICE_ACCOUNT_ENABLED` | `true` | ✅ Yes | ❌ No | Enable service account usage |

### 5. Update Agent Configuration

Update `.gitlab/agents/ossa-agent/config.yaml` to use service accounts:

```yaml
ci_access:
  projects:
    - id: blueflyio/openstandardagents
      access_as:
        service_account:
          name: version-manager-service-account
          namespace: version-management
```

### 6. Update Agent Manifests

Update agent manifests to use service account tokens:

```yaml
extensions:
  gitlab:
    agent:
      enabled: true
      config:
        project_id: ${CI_PROJECT_ID}
        api_url: ${CI_API_V4_URL}
        token: ${SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN}  # Use service account token
```

## Usage in CI/CD

### Version Manager Agent with Service Account

```yaml
version:bump:agent:
  extends: .version-bump-agent
  variables:
    BUMP_TYPE: "patch"
    # Use service account token instead of user token
    GITLAB_TOKEN: ${SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN}
    GITLAB_AGENT_TOKEN: ${SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN}
```

### Benefits

1. **No User License Consumption**: Service accounts don't count against user limits
2. **Dedicated Permissions**: Each service account has specific permissions
3. **Audit Trail**: All operations tracked under service account
4. **Token Rotation**: Can rotate tokens without affecting users
5. **Security**: Tokens can be scoped to specific operations

## Agent Manifest Updates

### Version Manager Agent

```yaml
extensions:
  gitlab:
    agent:
      enabled: true
      config:
        project_id: ${CI_PROJECT_ID}
        api_url: ${CI_API_V4_URL}
        # Use service account token
        token: ${SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN}
      service_account:
        name: version-manager-service-account
        namespace: version-management
```

### Other Agents

Update each agent manifest similarly:
- `rollback-coordinator` → `deployment-service-account`
- `monitoring-agent` → `monitoring-service-account`
- `security-scanner` → `security-service-account`

## RBAC Configuration

Update `.gitlab/agents/ossa-agent/rbac.yaml` to include service accounts:

```yaml
---
# ServiceAccount for version manager
apiVersion: v1
kind: ServiceAccount
metadata:
  name: version-manager-service-account
  namespace: version-management
  labels:
    app: version-manager
    managed-by: gitlab-agent
    service-account-type: gitlab

---
# RoleBinding for version manager service account
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: version-manager-service-account-binding
  namespace: version-management
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: gitlab-ci-deployer
subjects:
  - kind: ServiceAccount
    name: version-manager-service-account
    namespace: version-management
```

## Verification

### Test Service Account Access

```bash
# Test version manager service account
curl -X GET \
  "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}" \
  --header "PRIVATE-TOKEN: ${SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN}"

# Test version bump via service account
curl -X POST \
  "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests" \
  --header "PRIVATE-TOKEN: ${SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN}" \
  --data '{
    "source_branch": "chore/test-version-bump",
    "target_branch": "development",
    "title": "Test: Version bump via service account"
  }'
```

### Check Service Account Activity

1. Go to: https://gitlab.com/groups/blueflyio/-/settings/service_accounts
2. Click on service account
3. View "Activity" tab to see all operations

## Security Best Practices

1. **Token Rotation**: Rotate tokens every 90 days
2. **Scope Limitation**: Only grant required scopes
3. **Protected Variables**: Mark tokens as protected
4. **Masked Variables**: Mask tokens in CI/CD logs
5. **Audit Logging**: Monitor service account activity
6. **Least Privilege**: Grant minimum required permissions

## Troubleshooting

### Service Account Not Found

**Error**: `Service account 'version-manager-service-account' not found`

**Solution**:
1. Verify service account exists in group settings
2. Check service account name matches exactly
3. Ensure service account is added to project

### Token Invalid

**Error**: `401 Unauthorized` or `Invalid token`

**Solution**:
1. Verify token is set in CI/CD variables
2. Check token hasn't expired
3. Verify token has required scopes
4. Regenerate token if needed

### Permission Denied

**Error**: `403 Forbidden` or `Permission denied`

**Solution**:
1. Check service account role in project (Developer/Maintainer)
2. Verify token scopes include required permissions
3. Check project/group access settings

## Migration from User Tokens

If you're currently using user tokens:

1. Create service accounts
2. Generate PATs for service accounts
3. Update CI/CD variables to use service account tokens
4. Test with a non-critical operation
5. Update all agents to use service accounts
6. Remove user tokens from CI/CD variables

## Next Steps

1. ✅ Create service accounts in GitLab
2. ✅ Generate PATs for each service account
3. ✅ Add service accounts to project
4. ✅ Configure CI/CD variables
5. → Update agent manifests
6. → Update CI/CD jobs
7. → Test with version bump
8. → Monitor service account activity

