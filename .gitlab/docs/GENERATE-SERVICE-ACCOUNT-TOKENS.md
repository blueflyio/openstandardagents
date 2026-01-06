# How to Generate Service Account Tokens

## Important Note

The service accounts need to be created in GitLab first (if they don't exist), then you generate Personal Access Tokens (PATs) for each one.

## Step-by-Step: Generate Tokens for Existing Service Accounts

### Step 1: Go to Service Accounts

1. Navigate to: https://gitlab.com/groups/blueflyio/-/settings/service_accounts
2. You should see a list of service accounts

### Step 2: For Each Service Account, Generate a Token

#### For `version-manager-service-account`:

1. **Click on the service account** (or find it in the list)
2. **Go to "Access Tokens" tab** (or "Personal Access Tokens")
3. **Click "Add new token"** (or "Create token")
4. **Fill in the form**:
   - **Token name**: `version-manager-token` (or any descriptive name)
   - **Expiration date**: Set to 1 year (or as needed)
   - **Select scopes**:
     - ✅ `api`
     - ✅ `write_repository`
     - ✅ `read_repository`
5. **Click "Create personal access token"**
6. **COPY THE TOKEN IMMEDIATELY** - You won't see it again!
7. **Save it securely** (password manager, secure note, etc.)

#### Repeat for Each Service Account:

| Service Account | Token Name Suggestion | Scopes |
|----------------|----------------------|--------|
| `version-manager-service-account` | `version-manager-token` | `api`, `write_repository`, `read_repository` |
| `deployment-service-account` | `deployment-token` | `api`, `write_repository`, `read_repository` |
| `monitoring-service-account` | `monitoring-token` | `api`, `read_repository` |
| `security-service-account` | `security-token` | `api`, `read_repository` |

### Step 3: Add Tokens as CI/CD Variables

1. Go to: https://gitlab.com/blueflyio/openstandardagents/-/settings/ci_cd
2. Scroll to "Variables" section
3. Click "Add variable" for each token:

#### Variable 1: `SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN`
- **Key**: `SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN`
- **Value**: Paste the token from `version-manager-service-account`
- **Type**: Variable
- **Environment scope**: All (or specific environments)
- **Flags**:
  - ✅ **Protect variable** (checked)
  - ✅ **Mask variable** (checked)
- Click "Add variable"

#### Variable 2: `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN`
- **Key**: `SERVICE_ACCOUNT_DEPLOYMENT_TOKEN`
- **Value**: Paste the token from `deployment-service-account`
- **Type**: Variable
- **Environment scope**: All
- **Flags**:
  - ✅ **Protect variable** (checked)
  - ✅ **Mask variable** (checked)
- Click "Add variable"

#### Variable 3: `SERVICE_ACCOUNT_MONITORING_TOKEN`
- **Key**: `SERVICE_ACCOUNT_MONITORING_TOKEN`
- **Value**: Paste the token from `monitoring-service-account`
- **Type**: Variable
- **Environment scope**: All
- **Flags**:
  - ✅ **Protect variable** (checked)
  - ✅ **Mask variable** (checked)
- Click "Add variable"

#### Variable 4: `SERVICE_ACCOUNT_SECURITY_TOKEN`
- **Key**: `SERVICE_ACCOUNT_SECURITY_TOKEN`
- **Value**: Paste the token from `security-service-account`
- **Type**: Variable
- **Environment scope**: All
- **Flags**:
  - ✅ **Protect variable** (checked)
  - ✅ **Mask variable** (checked)
- Click "Add variable"

#### Variable 5: `GITLAB_SERVICE_ACCOUNT_ENABLED` (Optional)
- **Key**: `GITLAB_SERVICE_ACCOUNT_ENABLED`
- **Value**: `true`
- **Type**: Variable
- **Environment scope**: All
- **Flags**:
  - ✅ **Protect variable** (checked)
  - ❌ **Mask variable** (unchecked - it's just "true")
- Click "Add variable"

## Visual Guide

### Finding Service Accounts
```
GitLab UI → Groups → blueflyio → Settings → Service Accounts
```

### Generating Token
```
Service Account → Access Tokens → Add new token
→ Fill form → Create → COPY TOKEN
```

### Adding CI/CD Variable
```
Project → Settings → CI/CD → Variables → Add variable
→ Fill form → Add variable
```

## If Service Accounts Don't Exist

If you don't see the service accounts, create them first:

1. Go to: https://gitlab.com/groups/blueflyio/-/settings/service_accounts
2. Click "Add service account"
3. Enter name: `version-manager-service-account`
4. Click "Create service account"
5. Repeat for each service account
6. Then follow Step 2 above to generate tokens

## Token Security Best Practices

1. **Never commit tokens to git**
2. **Store tokens securely** (password manager)
3. **Set expiration dates** (rotate annually)
4. **Use minimum required scopes**
5. **Mark as Protected** (only available on protected branches)
6. **Mark as Masked** (hidden in CI/CD logs)

## Verification

After adding tokens, verify they work:

```bash
# In a CI/CD job or locally
curl -X GET \
  "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}" \
  --header "PRIVATE-TOKEN: ${SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN}"

# Should return project JSON, not 401/403 error
```

## Troubleshooting

### "Service account not found"
- Verify service account exists in GitLab
- Check spelling matches exactly
- Ensure you're looking in the right group

### "Token not working" (401 Unauthorized)
- Verify token was copied completely
- Check token hasn't expired
- Verify scopes include `api`
- Regenerate token if needed

### "Permission denied" (403 Forbidden)
- Check service account is added to project as member
- Verify service account role (Developer/Maintainer)
- Check token scopes include required permissions

## Quick Checklist

- [ ] Service accounts exist in GitLab
- [ ] Tokens generated for each service account
- [ ] Tokens saved securely
- [ ] CI/CD variables added
- [ ] Variables marked as Protected
- [ ] Variables marked as Masked
- [ ] Service accounts added to project as members
- [ ] Test token access (curl command above)

## Summary

**You need to**:
1. Go to GitLab service accounts page
2. For each service account, generate a Personal Access Token
3. Copy each token
4. Add tokens as CI/CD variables (Protected + Masked)

**I created**: Configuration files and documentation  
**You need to create**: The actual service accounts in GitLab (if they don't exist) and generate tokens for them

