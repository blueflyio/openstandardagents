# Authentication Guide

This guide covers authentication and authorization for OSSA platform APIs.

## Overview

OSSA APIs support three authentication methods:

1. **API Keys** - Simple authentication for server-to-server communication
2. **Bearer Tokens (JWT)** - Stateless authentication with claims and scopes
3. **OAuth 2.0** - Industry-standard authorization framework

## Authentication Methods

### API Key Authentication

API keys are the simplest method for server-to-server authentication.

#### Getting an API Key

1. Log in to the OSSA dashboard
2. Navigate to **Settings** → **API Keys**
3. Click **Generate New API Key**
4. Copy and securely store your key (it won't be shown again)

#### Using API Keys

Include the API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: ossa_ak_1234567890abcdef" \
  https://api.llm.bluefly.io/ossa/v1/agents
```

**JavaScript/TypeScript:**

```typescript
const response = await fetch('https://api.llm.bluefly.io/ossa/v1/agents', {
  headers: {
    'X-API-Key': 'ossa_ak_1234567890abcdef'
  }
});
```

**Python:**

```python
import requests

headers = {
    'X-API-Key': 'ossa_ak_1234567890abcdef'
}

response = requests.get(
    'https://api.llm.bluefly.io/ossa/v1/agents',
    headers=headers
)
```

#### API Key Best Practices

- **Never commit API keys** to version control
- **Use environment variables** to store keys
- **Rotate keys regularly** (at least every 90 days)
- **Use different keys** for development, staging, and production
- **Revoke compromised keys** immediately

### Bearer Token (JWT) Authentication

JWT tokens provide stateless authentication with built-in expiration and claims.

#### Getting a JWT Token

Exchange your credentials for a JWT token:

```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "your-password"
  }'
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Using JWT Tokens

Include the token in the `Authorization` header with `Bearer` prefix:

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  https://api.llm.bluefly.io/ossa/v1/agents
```

**JavaScript/TypeScript:**

```typescript
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const response = await fetch('https://api.llm.bluefly.io/ossa/v1/agents', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Python:**

```python
import requests

token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

headers = {
    'Authorization': f'Bearer {token}'
}

response = requests.get(
    'https://api.llm.bluefly.io/ossa/v1/agents',
    headers=headers
)
```

#### Refreshing Tokens

When your access token expires, use the refresh token to get a new one:

```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### OAuth 2.0 Authentication

OAuth 2.0 provides secure delegated access for third-party applications.

#### Supported Flows

- **Authorization Code Flow** - For web applications
- **Client Credentials Flow** - For machine-to-machine communication
- **Device Code Flow** - For CLI and IoT devices

#### Authorization Code Flow

**Step 1: Direct user to authorization URL**

```
https://api.llm.bluefly.io/ossa/v1/oauth/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=https://yourapp.com/callback
  &response_type=code
  &scope=read write
  &state=random-state-value
```

**Step 2: Handle callback and exchange code for token**

```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTHORIZATION_CODE" \
  -d "redirect_uri=https://yourapp.com/callback" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

**Step 3: Use the access token**

```bash
curl -H "Authorization: Bearer ACCESS_TOKEN" \
  https://api.llm.bluefly.io/ossa/v1/agents
```

#### Client Credentials Flow

For server-to-server authentication:

```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=read write admin"
```

## Scopes and Permissions

OSSA uses OAuth 2.0 scopes to control API access:

| Scope | Permissions |
|-------|-------------|
| `read` | Read-only access to agents, workflows, and executions |
| `write` | Create and update agents and workflows |
| `delete` | Delete agents and workflows |
| `admin` | Full administrative access including user management |
| `agents:register` | Register new agents |
| `agents:manage` | Update and delete agents |
| `workflows:execute` | Execute workflows |
| `workflows:manage` | Create, update, and delete workflows |
| `messaging:publish` | Publish messages to channels |
| `messaging:subscribe` | Subscribe to message channels |

### Requesting Scopes

Include scopes in your authorization request:

```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "your-password",
    "scope": "read write agents:register"
  }'
```

## Rate Limits

All authenticated requests are subject to rate limits.

### Default Limits

| Plan | Requests/Minute | Tokens/Hour | Burst Limit |
|------|-----------------|-------------|-------------|
| Free | 60 | 100,000 | 5/sec |
| Pro | 300 | 500,000 | 10/sec |
| Enterprise | 1,000 | 2,000,000 | 50/sec |

### Rate Limit Headers

API responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 75
X-RateLimit-Reset: 1703001600
X-RateLimit-Reset-After: 45
```

### Handling Rate Limits

When you exceed the rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": "rate_limit_exceeded",
  "message": "API rate limit exceeded",
  "retry_after": 45
}
```

**Retry with exponential backoff:**

```typescript
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('X-RateLimit-Reset-After') || '60');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

## Security Best Practices

### Storing Credentials

**Use environment variables:**

```bash
# .env file (never commit this!)
OSSA_API_KEY=ossa_ak_1234567890abcdef
OSSA_CLIENT_ID=client_abc123
OSSA_CLIENT_SECRET=secret_xyz789
```

```typescript
// Load from environment
const apiKey = process.env.OSSA_API_KEY;
const clientId = process.env.OSSA_CLIENT_ID;
const clientSecret = process.env.OSSA_CLIENT_SECRET;
```

**Python with python-decouple:**

```python
from decouple import config

api_key = config('OSSA_API_KEY')
client_id = config('OSSA_CLIENT_ID')
client_secret = config('OSSA_CLIENT_SECRET')
```

### HTTPS Only

**Always use HTTPS** for API requests. HTTP requests will be rejected:

```bash
# ✅ Correct
curl https://api.llm.bluefly.io/ossa/v1/agents

# ❌ Will fail
curl http://api.llm.bluefly.io/ossa/v1/agents
```

### Key Rotation

Rotate API keys and secrets regularly:

```bash
# Generate new API key
curl -X POST https://api.llm.bluefly.io/ossa/v1/auth/api-keys \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Production Key 2025-Q1",
    "expires_in": 7776000
  }'

# Revoke old key
curl -X DELETE https://api.llm.bluefly.io/ossa/v1/auth/api-keys/{key_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### IP Allowlisting

Restrict API key usage to specific IP addresses:

```bash
curl -X PUT https://api.llm.bluefly.io/ossa/v1/auth/api-keys/{key_id}/restrictions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "allowed_ips": ["203.0.113.0/24", "198.51.100.42"]
  }'
```

## Troubleshooting

### Common Authentication Errors

#### 401 Unauthorized

```json
{
  "error": "unauthorized",
  "message": "Invalid or missing authentication credentials"
}
```

**Solutions:**
- Verify your API key or token is correct
- Check that the `X-API-Key` or `Authorization` header is properly formatted
- Ensure your token hasn't expired

#### 403 Forbidden

```json
{
  "error": "forbidden",
  "message": "Insufficient permissions for this operation"
}
```

**Solutions:**
- Check your token scopes match the required permissions
- Verify your account has the necessary role
- Contact support to increase permissions

#### 429 Rate Limit Exceeded

```json
{
  "error": "rate_limit_exceeded",
  "message": "API rate limit exceeded",
  "retry_after": 45
}
```

**Solutions:**
- Implement exponential backoff
- Upgrade to a higher tier plan
- Optimize your API usage patterns

### Testing Authentication

Test your authentication setup:

```bash
# Test API key
curl -v -H "X-API-Key: YOUR_API_KEY" \
  https://api.llm.bluefly.io/ossa/v1/auth/verify

# Test JWT token
curl -v -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.llm.bluefly.io/ossa/v1/auth/verify
```

Expected response:

```json
{
  "authenticated": true,
  "user_id": "usr_abc123",
  "scopes": ["read", "write", "agents:register"],
  "expires_at": "2025-12-18T15:00:00Z"
}
```

## SDK Support

OSSA provides official SDKs that handle authentication automatically:

**JavaScript/TypeScript:**

```typescript
import { OSSAClient } from '@bluefly/ossa-sdk';

const client = new OSSAClient({
  apiKey: process.env.OSSA_API_KEY
});

// Or with OAuth
const client = new OSSAClient({
  clientId: process.env.OSSA_CLIENT_ID,
  clientSecret: process.env.OSSA_CLIENT_SECRET
});
```

**Python:**

```python
from ossa import Client

# With API key
client = Client(api_key=os.getenv('OSSA_API_KEY'))

# With OAuth
client = Client(
    client_id=os.getenv('OSSA_CLIENT_ID'),
    client_secret=os.getenv('OSSA_CLIENT_SECRET')
)
```

## Next Steps

- Learn about [Agent Registry API](agents.md) operations
- Explore [Agent-to-Agent Messaging](messaging.md)
- See [API Examples](../api-reference/examples.md) with authentication
- Review [Error Codes](../api-reference/errors.md) for troubleshooting
