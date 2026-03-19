# OSSA API Reference Implementations

Complete reference implementations demonstrating OSSA API usage in TypeScript, Python, and shell scripts.

## Overview

This directory contains production-ready reference implementations for the OSSA (Open Standards for Scalable Agents) API. Each implementation provides:

- Complete API coverage (agents, discovery, messaging)
- Working examples with real-world use cases
- Error handling and retry logic
- Authentication and rate limiting support
- Comprehensive documentation

## Implementations

### [TypeScript Client](./typescript-client/)

Modern TypeScript SDK with full type safety and ES modules.

**Features:**
- Complete TypeScript definitions
- ES2022 modules
- Fetch-based HTTP client
- Event streaming with async iterators
- Automatic retries and rate limiting

**Quick Start:**
```bash
cd typescript-client
npm install
npm run build
npm run example
```

**Use Case:** Production applications, web services, browser-based tools

### [Python Client](./python-client/)

Pythonic SDK with requests-based HTTP client.

**Features:**
- Clean, idiomatic Python API
- Session management with connection pooling
- Context manager support
- Generator-based event streaming
- Type hints for modern Python

**Quick Start:**
```bash
cd python-client
pip install -r requirements.txt
python examples/basic_usage.py
```

**Use Case:** Data science, automation scripts, backend services

### [cURL Scripts](./curl-scripts/)

Standalone shell scripts for command-line usage and CI/CD pipelines.

**Features:**
- No dependencies except curl and jq
- Easy to integrate in CI/CD
- Standalone executable scripts
- Error handling and validation
- Environment variable configuration

**Quick Start:**
```bash
cd curl-scripts
./01-search-agents.sh
```

**Use Case:** CI/CD pipelines, debugging, quick testing

## Common Functionality

All implementations support:

### Agent Operations

- **Search & Discovery**: Find agents by domain, capability, compliance
- **Agent Details**: Retrieve metadata, versions, dependencies
- **Publishing**: Deploy new agents to the registry
- **Lifecycle Management**: Deprecate, unpublish, version management
- **Statistics**: Download counts, ratings, usage metrics

### Discovery

- **Taxonomies**: Browse domain/subdomain/capability hierarchy
- **Capabilities**: Explore agent capabilities and schemas
- **Compliance**: Find agents by compliance profiles (FedRAMP, HIPAA, SOC2)
- **Recommendations**: AI-powered agent suggestions for use cases

### Agent-to-Agent Messaging

- **Direct Messaging**: Send messages between agents
- **Synchronous Requests**: Request-response pattern with timeout
- **Broadcasting**: Broadcast to multiple agents by filters
- **Webhooks**: Register HTTP callbacks for events
- **Event Streaming**: Real-time event streams (SSE)
- **Subscriptions**: Subscribe to agent events

## Authentication

All implementations support authentication via Bearer token:

```bash
export OSSA_TOKEN=ossa_tok_xxx
```

Get a token:
1. Visit https://registry.openstandardagents.org
2. Sign in or create an account
3. Navigate to Settings > API Tokens
4. Generate a new token

## API Endpoints

**Base URL:** `https://registry.openstandardagents.org/api/v1`

**Public Endpoints (No Auth):**
- `GET /agents` - Search agents
- `GET /agents/{publisher}/{name}` - Get agent
- `GET /specification/taxonomies` - List taxonomies
- `GET /specification/capabilities` - List capabilities

**Authenticated Endpoints:**
- `POST /agents` - Publish agent
- `POST /messaging/send` - Send A2A message
- `POST /messaging/webhooks` - Register webhook

See individual implementation READMEs for complete endpoint lists.

## Examples

Each implementation includes working examples:

### Basic Usage
- Search for agents
- Get agent details
- List versions
- View dependencies

### Publishing
- Create agent manifest
- Package and publish
- Handle verification

### Messaging
- Send A2A messages
- Register webhooks
- Subscribe to events
- Stream events in real-time

### Discovery
- Browse taxonomies
- Find by capabilities
- Filter by compliance
- Get AI recommendations

## Rate Limits

- **Authenticated**: 1000 requests/hour
- **Unauthenticated**: 100 requests/hour

Rate limit headers:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Error Handling

All implementations include robust error handling:

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Rate Limited
- `500` - Internal Server Error

**Error Response Format:**
```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "details": {},
  "retry_after": 3600
}
```

## Best Practices

### 1. Always Use Authentication

For production use, always authenticate with a Bearer token:
```bash
export OSSA_TOKEN=ossa_tok_xxx
```

### 2. Handle Rate Limiting

Respect rate limits and implement exponential backoff:
- Check `X-RateLimit-Remaining` header
- Sleep based on `Retry-After` header on 429
- Implement exponential backoff for retries

### 3. Validate Manifests

Before publishing, validate your agent manifest:
```bash
curl -X POST "${BASE_URL}/specification/validate" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

### 4. Monitor Message Status

When sending A2A messages, poll for status:
```bash
MESSAGE_ID=$(curl ... | jq -r '.message_id')
curl "${BASE_URL}/messaging/messages/${MESSAGE_ID}"
```

### 5. Use Webhooks for Events

For production, use webhooks instead of polling:
```bash
curl -X POST "${BASE_URL}/messaging/webhooks" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"url": "https://your-app.com/webhook", "events": [...]}'
```

## Environment Variables

Common environment variables:

- `OSSA_TOKEN` - Bearer token for authentication
- `OSSA_BASE_URL` - Override base API URL (default: production)
- `OSSA_TIMEOUT` - Request timeout in seconds
- `OSSA_RETRIES` - Number of retry attempts

## Choosing an Implementation

**Use TypeScript if:**
- Building web applications or services
- Need full type safety
- Want modern async/await patterns
- Deploying to Node.js or browsers

**Use Python if:**
- Writing automation scripts
- Building data pipelines
- Need integration with ML/AI tools
- Prefer Pythonic APIs

**Use cURL scripts if:**
- Working in CI/CD pipelines
- Need quick debugging
- Want zero dependencies
- Prefer shell scripting

## Testing

All implementations can be tested against:

**Production Registry:**
```bash
export OSSA_BASE_URL=https://registry.openstandardagents.org/api/v1
```

**Staging Registry:**
```bash
export OSSA_BASE_URL=https://staging-registry.openstandardagents.org/api/v1
```

**Local Development:**
```bash
export OSSA_BASE_URL=http://localhost:3000
```

## Contributing

To add a new reference implementation:

1. Create a new directory (e.g., `go-client/`, `rust-client/`)
2. Include:
   - Client library source code
   - Working examples
   - README.md with usage instructions
   - Package/dependency configuration
3. Follow OSSA API spec v0.3.0
4. Include error handling and retries
5. Add authentication support

## Resources

- [OSSA Specification](https://openstandardagents.org/spec)
- [API Documentation](https://docs.openstandardagents.org)
- [Registry Web UI](https://registry.openstandardagents.org)
- [GitHub Repository](https://github.com/openstandardagents/ossa)
- [Community Discord](https://discord.gg/ossa)

## License

All reference implementations are licensed under Apache-2.0.

## Support

- **Documentation**: https://docs.openstandardagents.org
- **Issues**: https://github.com/openstandardagents/ossa/issues
- **Email**: registry@openstandardagents.org
- **Discord**: https://discord.gg/ossa
