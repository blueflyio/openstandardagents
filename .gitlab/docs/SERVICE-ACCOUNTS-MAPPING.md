# Service Accounts Mapping & MR Integration

## Existing Service Accounts

**Location**: https://gitlab.com/groups/blueflyio/-/settings/service_accounts

You already have service accounts created! Let's map them to our configuration.

## Service Account Mapping

### Step 1: Identify Existing Service Accounts

Check what service accounts you have in GitLab:
1. Go to: https://gitlab.com/groups/blueflyio/-/settings/service_accounts
2. List all service accounts
3. Note their names and purposes

### Step 2: Map to Our Configuration

Our code expects these service accounts:

| Expected Name                     | Purpose            | Scopes Needed                                | CI/CD Variable                          |
| --------------------------------- | ------------------ | -------------------------------------------- | --------------------------------------- |
| `version-manager-service-account` | Version management | `api`, `write_repository`, `read_repository` | `SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN` |
| `deployment-service-account`      | Deployments        | `api`, `write_repository`, `read_repository` | `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN`      |
| `monitoring-service-account`      | Monitoring         | `api`, `read_repository`                     | `SERVICE_ACCOUNT_MONITORING_TOKEN`      |
| `security-service-account`        | Security scanning  | `api`, `read_repository`                     | `SERVICE_ACCOUNT_SECURITY_TOKEN`        |

### Step 3: Update Configuration if Names Differ

If your existing service accounts have different names, you have two options:

#### Option A: Rename Service Accounts (Recommended)
Rename them in GitLab to match our configuration.

#### Option B: Update Code to Match Your Names
Update these files to use your actual service account names:

1. **Agent Manifest**: `.gitlab/agents/version-manager/manifest.ossa.yaml`
   ```yaml
   extensions:
     gitlab:
       agent:
         service_account:
           name: <your-actual-service-account-name>
   ```

2. **CI/CD Component**: `.gitlab/components/version-management/version-bump-agent.yml`
   ```yaml
   variables:
     SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN: ${YOUR_ACTUAL_TOKEN_VAR}
   ```

3. **Enhanced Script**: `scripts/enhanced-version-manager.ts`
   ```typescript
   const GITLAB_TOKEN = process.env.YOUR_ACTUAL_TOKEN_VAR || ...
   ```

## Merge Request 30 Integration

**MR URL**: https://gitlab.com/blueflyio/openstandardagents/-/merge_requests/30

### What to Check in MR 30

1. **Service Account References**
   - Does MR 30 reference service accounts?
   - Are service account names consistent?
   - Are CI/CD variables mentioned?

2. **Configuration Changes**
   - Agent manifest updates?
   - CI/CD component changes?
   - Script updates?

3. **Token Configuration**
   - Are tokens properly configured?
   - Are variables marked as Protected/Masked?

### Action Items for MR 30

1. **Review MR Changes**
   ```bash
   # Check what files changed
   git diff origin/development...origin/<mr-branch>
   ```

2. **Verify Service Account Names**
   - Compare MR changes with existing service accounts
   - Ensure names match or update accordingly

3. **Check CI/CD Variables**
   - Verify variables are set correctly
   - Ensure tokens are Protected and Masked

4. **Test Integration**
   - Test version bump with service account
   - Verify operations show in service account activity

## Quick Setup Checklist

### ✅ Service Accounts (Already Done)
- [x] Service accounts exist in GitLab
- [ ] Names match our configuration (or code updated)
- [ ] Service accounts added to project as members
- [ ] Roles assigned (Developer/Maintainer)

### ⚠️ Personal Access Tokens
- [ ] PATs generated for each service account
- [ ] Scopes: `api`, `write_repository`, `read_repository`
- [ ] Tokens saved securely

### ⚠️ CI/CD Variables
- [ ] Variables added: `SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN`
- [ ] Variables marked as Protected
- [ ] Variables marked as Masked
- [ ] Token values set

### ⚠️ Code Configuration
- [ ] Agent manifests reference correct service account names
- [ ] CI/CD components use service account tokens
- [ ] Scripts use service account tokens
- [ ] Fallback to user tokens if service accounts not available

## Service Account Verification

### Check Service Account Status

1. **In GitLab UI**:
   - Go to: https://gitlab.com/groups/blueflyio/-/settings/service_accounts
   - Click on each service account
   - Check "Access Tokens" tab
   - Verify tokens exist and are active

2. **In Project**:
   - Go to: https://gitlab.com/blueflyio/openstandardagents/-/settings/members
   - Verify service accounts are members
   - Check their roles (Developer/Maintainer)

3. **In CI/CD Variables**:
   - Go to: https://gitlab.com/blueflyio/openstandardagents/-/settings/ci_cd
   - Verify variables exist
   - Check they're Protected and Masked

### Test Service Account Access

```bash
# Test in CI/CD job or locally
curl -X GET \
  "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}" \
  --header "PRIVATE-TOKEN: ${SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN}"

# Should return project information
```

## MR 30 Specific Actions

### If MR 30 Adds Service Account Support

1. **Review Changes**:
   - Check which files were modified
   - Verify service account names match existing ones
   - Ensure token variables are correct

2. **Update if Needed**:
   - If service account names differ, update code
   - If variable names differ, update references
   - If scopes differ, update token generation

3. **Test**:
   - Merge MR 30
   - Test version bump operation
   - Verify service account activity

### If MR 30 Doesn't Include Service Accounts

1. **Add Service Account Support**:
   - Update agent manifests
   - Update CI/CD components
   - Update scripts

2. **Use Existing Service Accounts**:
   - Map existing accounts to our configuration
   - Update code to use existing account names
   - Set CI/CD variables

## Common Scenarios

### Scenario 1: Service Accounts Exist, Names Match
✅ **Action**: Just set CI/CD variables and you're done!

### Scenario 2: Service Accounts Exist, Names Differ
⚠️ **Action**: Either rename accounts or update code to match

### Scenario 3: Service Accounts Don't Exist
❌ **Action**: Create them following `.gitlab/docs/SERVICE-ACCOUNTS-SETUP.md`

### Scenario 4: MR 30 Has Different Configuration
⚠️ **Action**: Review MR changes and align with existing service accounts

## Next Steps

1. **Check MR 30**:
   - Review changes
   - Identify service account references
   - Note any naming differences

2. **Map Service Accounts**:
   - List your existing service accounts
   - Compare with our expected names
   - Decide: rename or update code

3. **Set CI/CD Variables**:
   - Generate PATs for service accounts
   - Add variables to CI/CD settings
   - Mark as Protected and Masked

4. **Test**:
   - Test version bump operation
   - Verify service account activity
   - Check audit trail

## Documentation References

- **Quick Start**: `.gitlab/docs/SERVICE-ACCOUNTS-QUICK-START.md`
- **Full Setup**: `.gitlab/docs/SERVICE-ACCOUNTS-SETUP.md`
- **Integration**: `.gitlab/docs/SERVICE-ACCOUNTS-INTEGRATION.md`
- **Current State**: `.gitlab/docs/CURRENT-STATE-SUMMARY.md`

