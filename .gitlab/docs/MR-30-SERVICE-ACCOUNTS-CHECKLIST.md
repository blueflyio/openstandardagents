# MR 30 + Service Accounts Integration Checklist

## Pre-Merge Checklist

### 1. Service Accounts Verification
- [ ] List all existing service accounts from: https://gitlab.com/groups/blueflyio/-/settings/service_accounts
- [ ] Note their exact names
- [ ] Check if they match our expected names:
  - `version-manager-service-account`
  - `deployment-service-account`
  - `monitoring-service-account`
  - `security-service-account`

### 2. MR 30 Review
- [ ] Review MR 30 changes: https://gitlab.com/blueflyio/openstandardagents/-/merge_requests/30
- [ ] Check if service accounts are referenced
- [ ] Verify service account names in MR match existing ones
- [ ] Check if CI/CD variables are mentioned
- [ ] Review any configuration changes

### 3. Name Alignment
**If names match**:
- [ ] ✅ No changes needed
- [ ] Proceed to token setup

**If names differ**:
- [ ] Option A: Rename service accounts in GitLab to match code
- [ ] Option B: Update code to match existing service account names
- [ ] Update these files:
  - `.gitlab/agents/version-manager/manifest.ossa.yaml`
  - `.gitlab/components/version-management/version-bump-agent.yml`
  - `scripts/enhanced-version-manager.ts`
  - `.gitlab/agents/ossa-agent/rbac-service-accounts.yaml`

### 4. Personal Access Tokens
For each service account:
- [ ] Generate PAT with scopes: `api`, `write_repository`, `read_repository`
- [ ] Save token securely (you won't see it again)
- [ ] Note which token belongs to which service account

### 5. CI/CD Variables Setup
Go to: https://gitlab.com/blueflyio/openstandardagents/-/settings/ci_cd

Add variables:
- [ ] `SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN` = `<token>` (Protected, Masked)
- [ ] `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN` = `<token>` (Protected, Masked)
- [ ] `SERVICE_ACCOUNT_MONITORING_TOKEN` = `<token>` (Protected, Masked)
- [ ] `SERVICE_ACCOUNT_SECURITY_TOKEN` = `<token>` (Protected, Masked)
- [ ] `GITLAB_SERVICE_ACCOUNT_ENABLED` = `true` (Protected)

### 6. Project Membership
For each service account:
- [ ] Add to project: https://gitlab.com/blueflyio/openstandardagents/-/settings/members
- [ ] Assign role:
  - `version-manager-service-account` → Developer
  - `deployment-service-account` → Maintainer
  - `monitoring-service-account` → Developer
  - `security-service-account` → Developer

### 7. Code Configuration Check
Verify these files reference service accounts correctly:

- [ ] `.gitlab/agents/version-manager/manifest.ossa.yaml`
  ```yaml
  extensions:
    gitlab:
      agent:
        service_account:
          name: <correct-name>
          token: ${SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN}
  ```

- [ ] `.gitlab/components/version-management/version-bump-agent.yml`
  ```yaml
  variables:
    SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN: ${SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN:-${GITLAB_AGENT_TOKEN}}
  ```

- [ ] `scripts/enhanced-version-manager.ts`
  ```typescript
  const GITLAB_TOKEN = process.env.SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN || ...
  ```

### 8. Kubernetes RBAC (If Deploying Agents)
- [ ] Apply RBAC: `kubectl apply -f .gitlab/agents/ossa-agent/rbac-service-accounts.yaml`
- [ ] Verify ServiceAccounts created
- [ ] Verify RoleBindings created

## Post-Merge Checklist

### 1. Test Service Account Access
```bash
# In CI/CD job or locally
curl -X GET \
  "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}" \
  --header "PRIVATE-TOKEN: ${SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN}"
```

### 2. Test Version Bump
- [ ] Trigger version bump job manually
- [ ] Verify it uses service account token
- [ ] Check service account activity in GitLab

### 3. Verify Audit Trail
- [ ] Go to service account profile
- [ ] Check "Activity" tab
- [ ] Verify operations are tracked

### 4. Monitor Operations
- [ ] Check CI/CD job logs
- [ ] Verify no authentication errors
- [ ] Confirm operations succeed

## Troubleshooting

### Service Account Not Found
**Error**: Service account not found

**Solution**:
1. Verify service account exists in GitLab
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

## Quick Reference

### Service Account Names (Expected)
- `version-manager-service-account`
- `deployment-service-account`
- `monitoring-service-account`
- `security-service-account`

### CI/CD Variables (Required)
- `SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN`
- `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN`
- `SERVICE_ACCOUNT_MONITORING_TOKEN`
- `SERVICE_ACCOUNT_SECURITY_TOKEN`
- `GITLAB_SERVICE_ACCOUNT_ENABLED`

### Token Scopes (Required)
- `api`
- `write_repository`
- `read_repository`

### Project Roles
- Version Manager: Developer
- Deployment: Maintainer
- Monitoring: Developer
- Security: Developer

## Next Steps After MR 30 Merge

1. ✅ Verify service accounts are configured
2. ✅ Set CI/CD variables
3. ✅ Test version bump operation
4. ✅ Monitor service account activity
5. ✅ Document any naming differences
6. ✅ Update configuration if needed

