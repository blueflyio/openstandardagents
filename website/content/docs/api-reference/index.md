# API Reference

Welcome to the OSSA API Reference documentation.

## Core APIs

- [Ossa Core Api](ossa-core-api.md)
- [Ossa Registry Api](ossa-registry-api.md)
- [Ossa Registry](ossa-registry.md)
- [Unified Agent Gateway](unified-agent-gateway.md)

## Authentication

All API endpoints require authentication. See the [Authentication Guide](./authentication.md) for details.

## Rate Limiting

- 100 requests per minute per API key
- 1000 requests per hour per API key

## Error Responses

All APIs use standard HTTP status codes and return errors in the following format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": []
}
```

## Support

For API support, please:
- Check the [Troubleshooting Guide](../guides/troubleshooting.md)
- Open an issue on [GitLab](https://gitlab.com/blueflyio/openstandardagents/-/issues)
- Join our [Discord community](https://discord.gg/ossa)
