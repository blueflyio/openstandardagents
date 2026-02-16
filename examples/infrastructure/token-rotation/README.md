# Token Rotation Pattern - Reference Example

> **Minimal reference** showing OSSA token rotation features. For production implementation, see [platform-agents/token-rotation-manager](https://gitlab.com/blueflyio/agent-platform/platform-agents/-/tree/main/packages/@ossa/token-rotation-manager).

## What This Example Shows

This manifest demonstrates **automated token rotation** using OSSA v0.4.4 features:

### Key Features

**1. Self-Rotation (`self_rotate: true`)**
- Agent can rotate **its own token**
- Requires `self_rotate` scope on service account
- Prevents manual token management

**2. Service Account Management (`manage_service_accounts: []`)**
- Agent rotates **other service account tokens**
- Manages multiple accounts (CI, security, content, etc.)
- Central rotation orchestrator

**3. Automated Refresh (`auto_refresh: true`)**
- Automatically refreshes tokens before expiry
- No manual intervention needed

## When to Use This Pattern

✅ **Use when:**
- Managing 5+ service account tokens
- Need automated rotation (security compliance)
- Want zero-downtime rotation

❌ **Don't use when:**
- Single token (just use `auto_refresh`)
- Manual token management required
- No vault/secrets manager

## Configuration

### Rotation Policy

```yaml
authentication:
  rotation_policy:
    enabled: true                # Enable rotation
    interval_days: 90            # Rotate every 90 days
    notify_on_rotation: true     # Send notifications
    manage_service_accounts:     # Accounts to rotate
      - gitlab_token_webhook_manager
      - gitlab_token_ci_orchestrator
```

### Self-Rotation

```yaml
authentication:
  self_rotate: true  # Agent rotates its own token
  scopes:
    - api
    - read_user
    - self_rotate   # ⚠️ Required scope
```

## API Endpoints (Reference)

Simple rotation API:

```
POST   /v1/token-rotation/validate    - Validate token scopes
POST   /v1/token-rotation/rotate      - Rotate token
POST   /v1/token-rotation/verify      - Verify new token
GET    /v1/token-rotation/status      - Rotation status
```

See [`openapi.yaml`](./openapi.yaml) for full spec (minimal reference).

## How It Works

```
┌─────────────────────────┐
│  Scheduled Trigger      │
│  (cron: "0 2 * * 0")    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  For Each Account:      │
│  1. Validate current    │
│  2. Rotate token        │
│  3. Verify new token    │
│  4. Update vault        │
│  5. Notify if enabled   │
└─────────────────────────┘
```

## Production Implementation

For a complete, production-ready implementation with:
- Full error handling
- Rollback on failure
- Comprehensive testing
- CI/CD pipelines
- Emergency rotation support

See: [`platform-agents/@ossa/token-rotation-manager`](https://gitlab.com/blueflyio/agent-platform/platform-agents/-/tree/main/packages/@ossa/token-rotation-manager)

## Pattern Documentation

For design rationale and best practices, see:
- [docs/patterns/token-rotation.md](../../docs/patterns/token-rotation.md)
- [OSSA Agent Type: KAGENT](../../docs/agent-types/kagent.md)

## Compliance

Meets security standards:
- **NIST 800-63B**: Token rotation requirements
- **CIS Benchmarks**: Service account management
- **OWASP**: Token lifecycle security
