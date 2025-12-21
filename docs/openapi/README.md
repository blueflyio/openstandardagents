# OSSA OpenAPI Documentation

Welcome to the OSSA (Open Standard for Scalable AI Agents) OpenAPI documentation. This guide will help you understand and interact with the OSSA platform APIs.

## Overview

OSSA provides a comprehensive set of RESTful APIs for managing, orchestrating, and monitoring AI agents. The platform follows OpenAPI 3.1 specifications and supports JSON Schema Draft 2020-12.

### Core APIs

The OSSA platform consists of four main API surfaces:

1. **[Agent Registry API](agents.md)** - Create, update, discover, and manage agent registrations
2. **[Discovery API](discovery.md)** - Search and filter agents by capabilities, taxonomies, and metadata
3. **[Agent-to-Agent Messaging](messaging.md)** - Pub/sub messaging for multi-agent coordination
4. **[Authentication API](authentication.md)** - Secure access control and authorization

## Quick Start

### Base URLs

```
Production:   https://api.llm.bluefly.io/ossa/v1
Development:  https://api-dev.llm.bluefly.io/ossa/v1
Local:        http://localhost:3000
```

### Authentication

All API requests (except health checks) require authentication. See the [Authentication Guide](authentication.md) for details.

```bash
# Example with API Key
curl -H "X-API-Key: your-api-key" \
  https://api.llm.bluefly.io/ossa/v1/agents

# Example with Bearer Token
curl -H "Authorization: Bearer your-jwt-token" \
  https://api.llm.bluefly.io/ossa/v1/agents
```

### Health Check

Verify the API is running:

```bash
curl https://api.llm.bluefly.io/ossa/v1/health
```

Response:

```json
{
  "status": "healthy",
  "version": "0.3.0",
  "timestamp": "2025-12-18T14:00:00Z"
}
```

## Common Operations

### Register an Agent

```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/agents \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d @agent-manifest.json
```

### List All Agents

```bash
curl https://api.llm.bluefly.io/ossa/v1/agents \
  -H "Authorization: Bearer your-token"
```

### Search by Capability

```bash
curl "https://api.llm.bluefly.io/ossa/v1/agents?capability=text-generation" \
  -H "Authorization: Bearer your-token"
```

### Get Agent Details

```bash
curl https://api.llm.bluefly.io/ossa/v1/agents/{agentId} \
  -H "Authorization: Bearer your-token"
```

## API Reference

For detailed endpoint documentation, request/response schemas, and examples:

- **[Endpoints Reference](../api-reference/endpoints.md)** - Complete list of all API endpoints
- **[Schemas Reference](../api-reference/schemas.md)** - Data models and JSON schemas
- **[Examples](../api-reference/examples.md)** - Request/response examples for all endpoints
- **[Error Codes](../api-reference/errors.md)** - Error handling and troubleshooting

## Developer Guides

Step-by-step guides for common workflows:

- **[Getting Started](../guides/getting-started.md)** - Build your first OSSA integration
- **[Agent Lifecycle](../guides/agent-lifecycle.md)** - Managing agents from registration to retirement
- **[Capability Development](../guides/capability-development.md)** - Developing and exposing agent capabilities

## OpenAPI Specifications

The raw OpenAPI specification files are available in the repository:

### Core APIs

- [`ossa-core-api.openapi.yaml`](../../openapi/core/ossa-core-api.openapi.yaml) - Core OSSA runtime API
- [`ossa-registry-api.openapi.yaml`](../../openapi/core/ossa-registry-api.openapi.yaml) - Agent registry API
- [`unified-agent-gateway.openapi.yaml`](../../openapi/core/unified-agent-gateway.openapi.yaml) - Gateway API

### Reference Implementations

- [`drupal-agent-api.openapi.yaml`](../../openapi/reference-implementations/drupal-agent-api.openapi.yaml) - Drupal CMS integration
- [`orchestrator-agent-api.openapi.yaml`](../../openapi/reference-implementations/orchestrator-agent-api.openapi.yaml) - Multi-agent orchestration
- [See all implementations →](../../openapi/reference-implementations/)

## Validation and Testing

### Validate OpenAPI Specs

```bash
npm run validate:openapi
```

### Generate TypeScript Types

```bash
npm run gen:types
```

### Run API Tests

```bash
npm run test:api
```

## Standards and Conventions

All OSSA APIs follow:

- **OpenAPI 3.1** specification
- **JSON Schema Draft 2020-12** for data validation
- **RESTful** design principles
- **Semantic versioning** for API versions
- **OpenTelemetry** for observability
- **OAuth 2.0 / OpenID Connect** for authentication

## Rate Limits

Default rate limits:

- **100 requests per minute** per API key
- **500,000 tokens per hour** for LLM operations
- Burst limit: **10 requests per second**

See [Authentication](authentication.md#rate-limits) for details on increasing limits.

## Support

- **Documentation**: [openstandardagents.org/docs](https://openstandardagents.org/docs)
- **Issues**: [GitLab Issues](https://gitlab.com/blueflyio/openstandardagents/-/issues)
- **Discussions**: [GitHub Discussions](https://github.com/blueflyio/openstandardagents/discussions)
- **Discord**: [discord.gg/ossa](https://discord.gg/ossa)

## Version History

- **v0.3.0** (Current) - Agent-to-agent messaging, state management, compliance profiles
- **v0.2.5** - Enhanced registry, taxonomy support
- **v0.1.9** - Initial OpenAPI specifications

## Next Steps

1. Read the [Authentication Guide](authentication.md) to set up API access
2. Explore the [Agent Registry API](agents.md) to understand agent management
3. Check out the [Getting Started Guide](../guides/getting-started.md) for a hands-on tutorial
4. Review [Examples](../api-reference/examples.md) for code snippets in multiple languages
