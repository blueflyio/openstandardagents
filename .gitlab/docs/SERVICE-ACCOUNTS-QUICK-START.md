# GitLab Service Accounts - Quick Start

## TL;DR

1. **Check Service Accounts**: https://gitlab.com/groups/blueflyio/-/settings/service_accounts
   - If they don't exist, create them
2. **Generate PATs**: For each service account, create tokens with required scopes
   - See: `.gitlab/docs/GENERATE-SERVICE-ACCOUNT-TOKENS.md` for detailed steps
3. **Add to Project**: Add service accounts as Developer/Maintainer members
4. **Set CI/CD Variables**: Add tokens as Protected/Masked variables
5. **Done!** Agents will automatically use service account tokens

## ⚠️ Important: Generating Tokens

**You need to generate tokens yourself in GitLab UI**:
1. Go to each service account
2. Click "Access Tokens" → "Add new token"
3. Select scopes: `api`, `write_repository`, `read_repository`
4. **Copy token immediately** (you won't see it again!)
5. Add as CI/CD variable

**Detailed guide**: See `.gitlab/docs/GENERATE-SERVICE-ACCOUNT-TOKENS.md`

## Service Accounts Needed

| Service Account | Purpose | Scopes | Role |
|----------------|---------|--------|------|
| `version-manager-service-account` | Version management | `api`, `write_repository`, `read_repository` | Developer |
| `deployment-service-account` | Deployments | `api`, `write_repository`, `read_repository` | Maintainer |
| `monitoring-service-account` | Monitoring | `api`, `read_repository` | Developer |
| `security-service-account` | Security scanning | `api`, `read_repository` | Developer |

## CI/CD Variables

Add these in: https://gitlab.com/blueflyio/openstandardagents/-/settings/ci_cd

```
SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN = <token> (Protected, Masked)
SERVICE_ACCOUNT_DEPLOYMENT_TOKEN = <token> (Protected, Masked)
SERVICE_ACCOUNT_MONITORING_TOKEN = <token> (Protected, Masked)
SERVICE_ACCOUNT_SECURITY_TOKEN = <token> (Protected, Masked)
GITLAB_SERVICE_ACCOUNT_ENABLED = true (Protected)
```

## How It Works

1. **CI/CD Job Runs** → Uses `SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN`
2. **Agent Invoked** → Agent uses service account token for GitLab API calls
3. **Operations Execute** → All operations tracked under service account
4. **Audit Trail** → View activity in service account profile

## Benefits

✅ **No License Cost**: Service accounts don't consume user licenses  
✅ **Dedicated Permissions**: Each service account has specific permissions  
✅ **Audit Trail**: All operations tracked under service account  
✅ **Token Rotation**: Rotate tokens without affecting users  
✅ **Security**: Tokens can be scoped to specific operations  

## Verification

Test service account access:

```bash
# In CI/CD job
curl -X GET \
  "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}" \
  --header "PRIVATE-TOKEN: ${SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN}"
```

## Full Documentation

See: `.gitlab/docs/SERVICE-ACCOUNTS-SETUP.md` for complete setup guide

