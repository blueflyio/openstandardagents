# GitLab Service Accounts Integration - Complete Guide

## Overview

This document explains how GitLab service accounts are integrated with OSSA GitLab agents for automated version management and operations.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              GitLab Service Accounts                         │
│  (Created in: /groups/blueflyio/-/settings/service_accounts)│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │ version-manager-     │  │ deployment-         │         │
│  │ service-account      │  │ service-account     │         │
│  │                      │  │                      │         │
│  │ PAT: api, write,     │  │ PAT: api, write,     │         │
│  │      read            │  │      read            │         │
│  └──────────────────────┘  └──────────────────────┘         │
│           │                           │                      │
│           └───────────┬───────────────┘                      │
│                       │                                      │
│                       ▼                                      │
│         ┌──────────────────────────┐                        │
│         │   CI/CD Variables        │                        │
│         │   (Protected, Masked)     │                        │
│         └──────────────────────────┘                        │
│                       │                                      │
│                       ▼                                      │
│         ┌──────────────────────────┐                        │
│         │   GitLab CI/CD Jobs      │                        │
│         │   (version-bump-agent)   │                        │
│         └──────────────────────────┘                        │
│                       │                                      │
│                       ▼                                      │
│         ┌──────────────────────────┐                        │
│         │   GitLab Agents          │                        │
│         │   (Kubernetes)            │                        │
│         └──────────────────────────┘                        │
│                       │                                      │
│                       ▼                                      │
│         ┌──────────────────────────┐                        │
│         │   GitLab API Calls       │                        │
│         │   (MRs, Milestones, etc) │                        │
│         └──────────────────────────┘                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. Agent Manifests

**Location**: `.gitlab/agents/version-manager/manifest.ossa.yaml`

```yaml
extensions:
  gitlab:
    agent:
      config:
        # Use service account token (preferred) or fallback
        token: ${SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN:-${GITLAB_TOKEN}}
      service_account:
        name: version-manager-service-account
        namespace: version-management
        token: ${SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN}
```

### 2. CI/CD Components

**Location**: `.gitlab/components/version-management/version-bump-agent.yml`

```yaml
variables:
  # Use service account token (preferred) or fallback
  SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN: ${SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN:-${GITLAB_AGENT_TOKEN}}
```

### 3. Enhanced Scripts

**Location**: `scripts/enhanced-version-manager.ts`

```typescript
// Use service account token (preferred) or fallback to user token
const GITLAB_TOKEN = process.env.SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN || 
                      process.env.GITLAB_TOKEN || 
                      process.env.GITLAB_PUSH_TOKEN || '';
```

### 4. GitLab Agent Config

**Location**: `.gitlab/agents/ossa-agent/config-with-service-accounts.yaml`

```yaml
ci_access:
  projects:
    - id: blueflyio/openstandardagents
      access_as:
        service_account:
          name: version-manager-service-account
          namespace: version-management
```

### 5. Kubernetes RBAC

**Location**: `.gitlab/agents/ossa-agent/rbac-service-accounts.yaml`

Defines ServiceAccounts and RoleBindings for each service account.

## Service Account Configuration

### Version Manager Service Account

**Purpose**: Version management operations

**GitLab Configuration**:
- Name: `version-manager-service-account`
- Scopes: `api`, `write_repository`, `read_repository`
- Project Role: Developer
- CI/CD Variable: `SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN`

**Kubernetes Configuration**:
- ServiceAccount: `version-manager-service-account`
- Namespace: `version-management`
- ClusterRole: `gitlab-version-manager`
- Permissions: ConfigMaps, Secrets, Deployments (read)

### Deployment Service Account

**Purpose**: Deployment operations

**GitLab Configuration**:
- Name: `deployment-service-account`
- Scopes: `api`, `write_repository`, `read_repository`
- Project Role: Maintainer
- CI/CD Variable: `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN`

**Kubernetes Configuration**:
- ServiceAccount: `deployment-service-account`
- Namespace: `deployment-system`
- ClusterRole: `gitlab-deployment-manager`
- Permissions: Full deployment access

### Monitoring Service Account

**Purpose**: Monitoring and observability

**GitLab Configuration**:
- Name: `monitoring-service-account`
- Scopes: `api`, `read_repository`
- Project Role: Developer
- CI/CD Variable: `SERVICE_ACCOUNT_MONITORING_TOKEN`

**Kubernetes Configuration**:
- ServiceAccount: `monitoring-service-account`
- Namespace: `observability-system`
- ClusterRole: `gitlab-monitoring-reader`
- Permissions: Read-only (pods, services, deployments)

### Security Service Account

**Purpose**: Security scanning operations

**GitLab Configuration**:
- Name: `security-service-account`
- Scopes: `api`, `read_repository`
- Project Role: Developer
- CI/CD Variable: `SERVICE_ACCOUNT_SECURITY_TOKEN`

**Kubernetes Configuration**:
- ServiceAccount: `security-service-account`
- Namespace: `security-system`
- ClusterRole: `gitlab-security-reader`
- Permissions: Read-only (pods, secrets, deployments)

## Token Priority

The system uses the following token priority:

1. **Service Account Token** (Preferred)
   - `SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN`
   - `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN`
   - etc.

2. **Fallback Tokens**
   - `GITLAB_AGENT_TOKEN`
   - `GITLAB_TOKEN`
   - `GITLAB_PUSH_TOKEN`

This allows:
- ✅ Service accounts when configured
- ✅ Graceful fallback to user tokens
- ✅ No breaking changes for existing setups

## Setup Checklist

- [ ] Create service accounts in GitLab group settings
- [ ] Generate PATs for each service account
- [ ] Add service accounts to project as members
- [ ] Set CI/CD variables with service account tokens
- [ ] Apply Kubernetes RBAC configuration
- [ ] Update agent configs to use service accounts
- [ ] Test version bump with service account
- [ ] Verify audit trail in service account activity

## Benefits

### 1. No License Cost
Service accounts don't consume user licenses, saving costs.

### 2. Dedicated Permissions
Each service account has specific permissions for its role.

### 3. Audit Trail
All operations are tracked under the service account, making it easy to audit automated operations.

### 4. Token Rotation
Tokens can be rotated without affecting user accounts.

### 5. Security
Tokens are scoped to specific operations, reducing attack surface.

### 6. Separation of Concerns
Different service accounts for different operations (version, deployment, monitoring, security).

## Monitoring

### View Service Account Activity

1. Go to: https://gitlab.com/groups/blueflyio/-/settings/service_accounts
2. Click on service account
3. View "Activity" tab

### Check Token Usage

```bash
# In CI/CD job
echo "Service account token configured: $([ -n "$SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN" ] && echo "Yes" || echo "No")"
```

### Verify Operations

All operations performed by service accounts will show:
- **User**: Service account name
- **Activity**: Operation details
- **Timestamp**: When operation occurred

## Troubleshooting

### Service Account Not Found

**Error**: Service account not found in GitLab

**Solution**:
1. Verify service account exists in group settings
2. Check service account name matches exactly
3. Ensure service account is added to project

### Token Invalid

**Error**: 401 Unauthorized

**Solution**:
1. Verify token is set in CI/CD variables
2. Check token hasn't expired
3. Verify token has required scopes
4. Regenerate token if needed

### Permission Denied

**Error**: 403 Forbidden

**Solution**:
1. Check service account role in project
2. Verify token scopes include required permissions
3. Check project/group access settings

## Migration Guide

### From User Tokens to Service Accounts

1. **Create Service Accounts**
   - Create all required service accounts
   - Generate PATs for each

2. **Add CI/CD Variables**
   - Add service account tokens as CI/CD variables
   - Mark as Protected and Masked

3. **Test**
   - Test with non-critical operation
   - Verify service account activity

4. **Update Configs**
   - Update agent manifests
   - Update CI/CD components
   - Update scripts

5. **Deploy**
   - Apply Kubernetes RBAC
   - Update agent configs
   - Monitor operations

6. **Cleanup**
   - Remove user tokens from CI/CD variables
   - Update documentation

## Next Steps

1. ✅ Service account integration complete
2. → Create service accounts in GitLab
3. → Generate PATs
4. → Configure CI/CD variables
5. → Apply Kubernetes RBAC
6. → Test version bump
7. → Monitor service account activity

## Documentation

- **Quick Start**: `.gitlab/docs/SERVICE-ACCOUNTS-QUICK-START.md`
- **Full Setup**: `.gitlab/docs/SERVICE-ACCOUNTS-SETUP.md`
- **This Guide**: `.gitlab/docs/SERVICE-ACCOUNTS-INTEGRATION.md`

