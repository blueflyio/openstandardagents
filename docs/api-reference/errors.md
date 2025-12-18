# Error Codes and Handling

This guide covers error responses, status codes, and troubleshooting strategies for the OSSA API.

## Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "error": "error_code",
  "message": "Human-readable error description",
  "details": {
    "field": "additional context"
  },
  "request_id": "req_abc123",
  "timestamp": "2025-12-18T14:00:00Z"
}
```

## HTTP Status Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| `200 OK` | Success | Request completed successfully |
| `201 Created` | Resource created | Agent/workflow registered |
| `202 Accepted` | Async operation started | Workflow execution queued |
| `204 No Content` | Success, no body | Resource deleted |
| `400 Bad Request` | Invalid request | Malformed JSON, validation errors |
| `401 Unauthorized` | Authentication failed | Missing/invalid credentials |
| `403 Forbidden` | Permission denied | Insufficient scopes |
| `404 Not Found` | Resource not found | Agent/workflow doesn't exist |
| `409 Conflict` | Resource conflict | Duplicate agent name/version |
| `422 Unprocessable Entity` | Validation error | Invalid manifest schema |
| `429 Too Many Requests` | Rate limit exceeded | Too many API calls |
| `500 Internal Server Error` | Server error | Unexpected server failure |
| `503 Service Unavailable` | Service unavailable | Maintenance or overload |

## Common Error Codes

### Authentication Errors

#### `unauthorized`
```json
{
  "error": "unauthorized",
  "message": "Invalid or missing authentication credentials"
}
```
**Cause:** Missing or invalid API key/token
**Solution:** Check Authorization header format

#### `invalid_token`
```json
{
  "error": "invalid_token",
  "message": "JWT token is invalid or expired"
}
```
**Cause:** Expired or malformed JWT token
**Solution:** Refresh token or re-authenticate

#### `forbidden`
```json
{
  "error": "forbidden",
  "message": "Insufficient permissions for this operation"
}
```
**Cause:** Missing required OAuth scopes
**Solution:** Request token with appropriate scopes

### Validation Errors

#### `validation_error`
```json
{
  "error": "validation_error",
  "message": "Request validation failed",
  "details": {
    "errors": [
      {
        "path": "spec.llm.model",
        "message": "Required field missing"
      },
      {
        "path": "metadata.version",
        "message": "Invalid semantic version format"
      }
    ]
  }
}
```
**Cause:** Invalid agent manifest or request body
**Solution:** Fix validation errors in manifest

#### `schema_validation_failed`
```json
{
  "error": "schema_validation_failed",
  "message": "Manifest does not conform to OSSA schema",
  "details": {
    "schema_version": "0.3.0",
    "errors": [...]
  }
}
```
**Cause:** Manifest doesn't match OSSA spec
**Solution:** Validate manifest with `POST /specification/validate`

### Resource Errors

#### `not_found`
```json
{
  "error": "not_found",
  "message": "Agent agt_abc123 not found"
}
```
**Cause:** Agent/resource doesn't exist
**Solution:** Verify agent ID is correct

#### `conflict`
```json
{
  "error": "conflict",
  "message": "Agent with name 'my-agent' and version '1.0.0' already exists"
}
```
**Cause:** Duplicate agent registration
**Solution:** Use different name/version or update existing agent

#### `dependency_error`
```json
{
  "error": "dependency_error",
  "message": "Cannot delete agent with active workflows",
  "details": {
    "dependent_workflows": ["wf_123", "wf_456"]
  }
}
```
**Cause:** Resource has dependencies
**Solution:** Delete dependencies first or use `force=true`

### Rate Limit Errors

#### `rate_limit_exceeded`
```json
{
  "error": "rate_limit_exceeded",
  "message": "API rate limit exceeded",
  "retry_after": 45,
  "details": {
    "limit": 100,
    "window": "60s",
    "reset_at": "2025-12-18T14:01:00Z"
  }
}
```
**Cause:** Too many requests in time window
**Solution:** Implement exponential backoff and retry

### System Errors

#### `internal_server_error`
```json
{
  "error": "internal_server_error",
  "message": "An unexpected error occurred",
  "request_id": "req_abc123"
}
```
**Cause:** Server-side error
**Solution:** Retry request, contact support if persists

#### `service_unavailable`
```json
{
  "error": "service_unavailable",
  "message": "Service temporarily unavailable",
  "retry_after": 300
}
```
**Cause:** Maintenance or overload
**Solution:** Wait and retry

## Error Handling Patterns

### Exponential Backoff

```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      if (response.status === 429) {
        const retryAfter = parseInt(
          response.headers.get('X-RateLimit-Reset-After') || '60'
        );
        await sleep(retryAfter * 1000);
        continue;
      }

      if (response.status >= 500) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 32000);
        await sleep(delay);
        continue;
      }

      // Client error, don't retry
      throw await response.json();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }
  }

  throw new Error('Max retries exceeded');
}
```

### Validation Before Submit

```typescript
import { OSSAClient } from '@bluefly/ossa-sdk';

const client = new OSSAClient({ apiKey: process.env.OSSA_API_KEY });

try {
  // Validate manifest before registration
  const validation = await client.validateManifest(manifest);

  if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
    return;
  }

  // Register if valid
  const agent = await client.registerAgent(manifest);
} catch (error) {
  if (error.error === 'validation_error') {
    console.error('Validation failed:', error.details.errors);
  } else {
    throw error;
  }
}
```

### Graceful Degradation

```typescript
async function getAgent(agentId: string) {
  try {
    return await client.getAgent(agentId);
  } catch (error) {
    if (error.error === 'not_found') {
      // Fallback to discovery
      const results = await client.searchAgents({
        q: agentId,
        limit: 1
      });
      return results[0] || null;
    }
    throw error;
  }
}
```

## Debugging

### Request ID

Every response includes a `request_id` for debugging:

```json
{
  "error": "internal_server_error",
  "request_id": "req_abc123"
}
```

Include this when contacting support.

### Verbose Logging

Enable detailed logging in SDKs:

```typescript
const client = new OSSAClient({
  apiKey: process.env.OSSA_API_KEY,
  debug: true,
  logLevel: 'debug'
});
```

### Health Checks

Monitor API health:

```bash
curl https://api.llm.bluefly.io/ossa/v1/health
```

## Best Practices

1. **Always handle errors** - Don't assume requests succeed
2. **Validate before submit** - Use validation endpoint first
3. **Implement retries** - With exponential backoff for 5xx errors
4. **Check rate limits** - Monitor headers and implement backoff
5. **Log request IDs** - For debugging and support
6. **Use typed SDKs** - Catch errors at compile time

## See Also

- [Authentication Guide](../openapi/authentication.md)
- [Endpoints Reference](endpoints.md)
- [API Examples](examples.md)
