# GitLab Environments & User Access Audit

## Current Configuration

### Agent Config: `.gitlab/agents/ossa-agent/config.yaml`

```yaml
user_access:
  access_as:
    agent: {}  # ✅ Currently using agent impersonation (Free tier compatible)
  
  projects:
    - id: blueflyio/openstandardagents
  
  groups:
    - id: blueflyio
    - id: blueflyio/agent-platform
```

**Status**: ✅ Using `agent: {}` (Free tier compatible)

## Access Methods Comparison

### `agent: {}` (Free Tier)
- ✅ Works on all GitLab tiers (Free, Premium, Ultimate)
- ✅ All requests forwarded via agent service account
- ✅ No additional license cost
- ⚠️ Limited user identity tracking
- ⚠️ All users appear as agent in Kubernetes

### `user: {}` (Premium+)
- ✅ Available on Premium and Ultimate tiers
- ✅ Users maintain their identity in Kubernetes
- ✅ Better audit trail (see actual user who made changes)
- ✅ User-specific RBAC possible
- ✅ Better integration with GitLab environments
- ❌ Requires Premium/Ultimate tier

## Recommendation

Since you have **GitLab Ultimate**, you should use `user: {}` for better:
- Audit trails
- User identity in Kubernetes
- Environment integration
- Security and compliance

## Updated Configuration

### Option 1: User Access (Recommended for Ultimate)

```yaml
user_access:
  # Access method: user impersonation (requires Premium/Ultimate)
  # Users maintain their identity in Kubernetes for better audit trails
  access_as:
    user: {}  # ✅ Use this with Ultimate tier
  
  projects:
    - id: blueflyio/openstandardagents
  
  groups:
    - id: blueflyio
    - id: blueflyio/agent-platform
```

### Option 2: Hybrid (Agent + User)

```yaml
user_access:
  # Use user access for Premium/Ultimate features
  access_as:
    user: {}  # For Premium/Ultimate users
  
  projects:
    - id: blueflyio/openstandardagents
  
  groups:
    - id: blueflyio
    - id: blueflyio/agent-platform

# Fallback for Free tier users (if any)
# Note: This is not a real config option, but you can have separate agents
```

## Environments Integration

### Current State
- **Environments URL**: https://gitlab.com/blueflyio/openstandardagents/-/environments
- **Agent Config**: Using `agent: {}`
- **Impact**: Environments may not show user identity properly

### With `user: {}` Configuration

Benefits:
1. **User Identity in Environments**
   - See who deployed what
   - Track user-specific deployments
   - Better audit trail

2. **Environment-Specific Access**
   - Users can have different permissions per environment
   - Production vs Development access control
   - Role-based environment access

3. **Better Integration**
   - GitLab Environments dashboard shows real users
   - Deployment history with user attribution
   - Compliance and audit requirements met

## Recommended Configuration

### For GitLab Ultimate Tier

```yaml
# .gitlab/agents/ossa-agent/config.yaml

# User access configuration
# Grants Kubernetes cluster access to project/group members
# Uses user impersonation for Premium/Ultimate tier benefits
user_access:
  # Access method: user impersonation (Premium/Ultimate tier)
  # Users maintain their identity in Kubernetes
  # Better audit trail and user-specific RBAC
  access_as:
    user: {}  # ✅ Recommended for Ultimate tier
  
  # Projects whose members should have access to this agent
  projects:
    - id: blueflyio/openstandardagents
  
  # Groups whose members should have access to this agent
  groups:
    - id: blueflyio
    - id: blueflyio/agent-platform

# CI/CD access configuration
# Uses service accounts for automated operations
ci_access:
  projects:
    - id: blueflyio/openstandardagents
      access_as:
        # Use service account for CI/CD operations
        service_account:
          name: deployment-service-account
          namespace: deployment-system
  
  groups:
    - id: blueflyio
      access_as:
        service_account:
          name: deployment-service-account
          namespace: deployment-system
```

## RBAC Updates Required

When switching to `user: {}`, update RBAC to support user impersonation:

```yaml
# .gitlab/agents/ossa-agent/rbac.yaml

---
# ClusterRoleBinding for user access
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: gitlab-user-access
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: gitlab-user-access-role
subjects:
  # All users from the openstandardagents project
  - apiGroup: rbac.authorization.k8s.io
    kind: Group
    name: "gitlab:project:blueflyio/openstandardagents"
  # All users from blueflyio group
  - apiGroup: rbac.authorization.k8s.io
    kind: Group
    name: "gitlab:group:blueflyio"
```

## Migration Steps

### Step 1: Update Agent Config
1. Edit `.gitlab/agents/ossa-agent/config.yaml`
2. Change `access_as: { agent: {} }` to `access_as: { user: {} }`
3. Commit and push

### Step 2: Update RBAC
1. Update `.gitlab/agents/ossa-agent/rbac.yaml`
2. Add user-based ClusterRoleBindings
3. Apply to cluster: `kubectl apply -f .gitlab/agents/ossa-agent/rbac.yaml`

### Step 3: Verify
1. Check GitLab Environments: https://gitlab.com/blueflyio/openstandardagents/-/environments
2. Verify user identity is shown in deployments
3. Test user access to cluster

### Step 4: Test
1. Access cluster via GitLab agent
2. Verify your user identity appears in Kubernetes
3. Check audit logs show real users

## Environment-Specific Configuration

### Development Environment
```yaml
# .gitlab-ci.yml
deploy:development:
  environment:
    name: development
    kubernetes:
      namespace: ossa-dev
  script:
    - kubectl apply -f .gitlab/agents/version-manager/deployment.yaml
```

### Production Environment
```yaml
# .gitlab-ci.yml
deploy:production:
  environment:
    name: production
    kubernetes:
      namespace: ossa-prod
  script:
    - kubectl apply -f .gitlab/agents/version-manager/deployment.yaml
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
```

## Benefits of `user: {}` for Ultimate Tier

1. **Audit Trail**
   - See actual user who deployed
   - Track user-specific actions
   - Compliance requirements met

2. **User Identity**
   - Users maintain identity in Kubernetes
   - Better RBAC control
   - User-specific permissions

3. **Environment Integration**
   - GitLab Environments shows real users
   - Deployment history with user attribution
   - Better visibility and control

4. **Security**
   - User-specific access control
   - Better compliance tracking
   - Audit logs with real users

## Current Issues with `agent: {}`

1. ❌ All users appear as "agent" in Kubernetes
2. ❌ No user-specific audit trail
3. ❌ Limited user identity tracking
4. ❌ Environments may not show user identity

## Action Items

- [ ] Update `.gitlab/agents/ossa-agent/config.yaml` to use `user: {}`
- [ ] Update RBAC configuration for user access
- [ ] Apply RBAC changes to cluster
- [ ] Verify user identity in environments
- [ ] Test deployment with user access
- [ ] Update documentation

## Verification

After switching to `user: {}`:

1. **Check Environments**: https://gitlab.com/blueflyio/openstandardagents/-/environments
   - Should show real user names
   - Deployment history with user attribution

2. **Check Kubernetes**:
   ```bash
   kubectl get events --namespace ossa-agents
   # Should show user identity in events
   ```

3. **Check Audit Logs**:
   - GitLab audit logs should show user actions
   - Kubernetes audit logs should show user identity

## Summary

**Current**: Using `agent: {}` (Free tier compatible)  
**Recommended**: Switch to `user: {}` (Ultimate tier benefits)  
**Impact**: Better audit trail, user identity, and environment integration  
**Effort**: Low (config change + RBAC update)

