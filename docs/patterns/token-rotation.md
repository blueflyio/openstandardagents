# Token Rotation Pattern

Automated service account token rotation using OSSA v0.4.4 authentication features.

## Overview

The token rotation pattern enables agents to automatically rotate service account tokens before expiry, reducing security risks and manual maintenance.

## When to Use

✅ **Use this pattern when:**
- Managing **5+ service account tokens** across infrastructure
- **Security compliance** requires regular token rotation (NIST, CIS, OWASP)
- Need **zero-downtime rotation** (old token remains valid until new token verified)
- Centralized token management across multiple services

❌ **Don't use when:**
- Single token with infrequent changes (use `auto_refresh` instead)
- Manual token management required (regulatory/audit)
- No secrets management system (Vault, AWS Secrets Manager, etc.)

## OSSA Features

### 1. Auto Refresh (`auto_refresh: true`)

Automatically refresh token before expiry:

```yaml
authentication:
  auto_refresh: true
  expiry_warning_days: 7  # Warn 7 days before expiry
```

**When to use**: Simple single-token scenarios where the agent manages its own token.

### 2. Self-Rotation (`self_rotate: true`)

Agent can rotate **its own token**:

```yaml
authentication:
  self_rotate: true
  scopes:
    - api
    - read_user
    - self_rotate  # ⚠️ Required scope
```

**Requirements**:
- Service account must have `self_rotate` scope (GitLab: Maintainer+ role)
- Agent must securely store new token (vault integration required)

**Security**: Agent has permission to rotate its own credentials. Audit this carefully.

### 3. Service Account Management (`manage_service_accounts`)

Agent rotates **other service account tokens**:

```yaml
authentication:
  rotation_policy:
    enabled: true
    interval_days: 90
    manage_service_accounts:
      - gitlab_token_webhook_manager
      - gitlab_token_ci_orchestrator
      - gitlab_token_content_reviewer
      - gitlab_token_security_scanner
```

**Use case**: Central rotation manager that handles multiple service accounts.

### 4. Rotation Policy (`rotation_policy`)

Configure rotation schedule and behavior:

```yaml
authentication:
  rotation_policy:
    enabled: true
    interval_days: 90             # Rotate every 90 days
    notify_on_rotation: true      # Send notifications on rotation
    manage_service_accounts: []   # Accounts to manage
```

## Implementation Patterns

### Pattern A: Self-Rotating Agent

Agent rotates only its own token.

```yaml
apiVersion: ossa/v0.4.4
kind: Agent
metadata:
  name: my-service
  agentType: kagent
spec:
  authentication:
    type: service_account
    auto_refresh: true
    self_rotate: true
    rotation_policy:
      enabled: true
      interval_days: 90
```

**Pros**: Simple, no central manager needed
**Cons**: Each agent manages rotation independently

### Pattern B: Central Rotation Manager

One agent rotates all service account tokens.

```yaml
apiVersion: ossa/v0.4.4
kind: Agent
metadata:
  name: token-rotation-manager
  agentType: kagent
  agentKind: executor
spec:
  authentication:
    self_rotate: true
    rotation_policy:
      enabled: true
      interval_days: 90
      manage_service_accounts:
        - account_1
        - account_2
        - account_3

  schedule:
    cron: "0 2 * * 0"  # Weekly Sunday 2AM
```

**Pros**: Centralized control, audit trail, coordinated rotation
**Cons**: Single point of failure (mitigate with HA deployment)

### Pattern C: Hybrid (Self + Central)

Agents self-rotate for immediacy, central manager as backup.

```yaml
# Each agent
authentication:
  auto_refresh: true
  self_rotate: true

# Plus central manager (Pattern B)
```

**Pros**: Best of both - immediate refresh + centralized oversight
**Cons**: More complex, potential conflicts

## Workflow

### Standard Rotation Flow

```
1. Schedule Trigger (cron)
   ↓
2. For each service account:
   a. Validate current token
   b. Generate new token
   c. Verify new token works
   d. Update vault/secrets
   e. Revoke old token (after grace period)
   f. Send notification
   ↓
3. Log result + update metrics
```

### Error Handling

**Token generation fails:**
- Retry with exponential backoff (3 attempts)
- Alert on-call if all retries fail
- Keep old token active

**New token verification fails:**
- DO NOT revoke old token
- Roll back to old token
- Alert security team

**Vault update fails:**
- Retry vault update
- Keep both old and new tokens active
- Manual intervention required

## Security Considerations

### Permissions

**Service Account Requirements:**
- `self_rotate` scope (if using `self_rotate: true`)
- `admin` or `maintainer` role (GitLab)
- `repo:admin` scope (GitHub)

**Vault Integration:**
- Agent needs write access to `secret/tokens/*`
- Use AppRole authentication (not root token)
- Audit all vault writes

### Secrets Management

**DO**:
- ✅ Store tokens in Vault/AWS Secrets Manager
- ✅ Rotate vault tokens alongside service account tokens
- ✅ Use separate vault paths per environment (prod/staging)
- ✅ Enable vault audit logging

**DON'T**:
- ❌ Store tokens in environment variables after rotation
- ❌ Log tokens (even encrypted logs)
- ❌ Share tokens between environments
- ❌ Use the same rotation schedule for all tokens (stagger)

### Grace Period

Always maintain a **grace period** where both old and new tokens work:

```yaml
authentication:
  rotation_policy:
    grace_period_hours: 24  # Old token valid for 24h
```

This prevents downtime if dependent services haven't picked up the new token.

## Monitoring

### Key Metrics

- `token_rotation_success_total` - Successful rotations
- `token_rotation_failure_total` - Failed rotations
- `token_expiry_days` - Days until expiry
- `token_age_days` - Days since last rotation

### Alerts

```yaml
# Token expiring soon
token_expiry_days < 14 → Warning
token_expiry_days < 7 → Critical

# Rotation failures
token_rotation_failure_total > 0 → Alert

# Token too old (rotation not working)
token_age_days > 100 → Warning
```

## Compliance

### NIST 800-63B

- **Token Expiry**: Maximum 90 days
- **Rotation**: Before expiry + on compromise
- **Storage**: Encrypted at rest

### CIS Benchmarks

- **Service Accounts**: Dedicated per service
- **Least Privilege**: Minimal scopes required
- **Audit**: All token operations logged

### OWASP

- **Token Lifecycle**: Create → Use → Rotate → Revoke
- **Secure Storage**: Never in code/logs/environment
- **Monitoring**: Failed auth attempts alert

## Example: GitLab Service Accounts

```yaml
authentication:
  type: service_account
  provider: gitlab
  scopes:
    - api
    - read_user
    - write_repository
  rotation_policy:
    enabled: true
    interval_days: 90
    manage_service_accounts:
      - gitlab_token_webhook_manager      # Webhook operations
      - gitlab_token_ci_orchestrator      # CI/CD pipeline management
      - gitlab_token_security_scanner     # Security scanning
      - gitlab_token_release_manager      # Release operations
```

## References

- [Example: examples/infrastructure/token-rotation/](../../examples/infrastructure/token-rotation/)
- [Production: platform-agents/@ossa/token-rotation-manager](https://gitlab.com/blueflyio/agent-platform/platform-agents/-/tree/main/packages/@ossa/token-rotation-manager)
- [Schema: spec/v0.4/agent.schema.json](../../spec/v0.4/agent.schema.json)
