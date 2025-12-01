# OSSA v0.2.6-dev Specification

**Release Date**: November 26, 2025
**Status**: Development
**Version**: 0.2.6-dev

## Overview

OSSA (Open Standard for Scalable AI Agents) v0.2.6-dev is a development release that adds CLI utilities, brand positioning documentation, and competitive comparison resources while maintaining full backward compatibility.

## What's in This Directory

- **`ossa-0.2.6-dev.schema.json`** - JSON Schema definition for OSSA v0.2.6-dev agent manifests
- **`CHANGELOG.md`** - Detailed release notes and feature descriptions
- **`README.md`** - This file
- **`migrations/`** - Upgrade guides from previous versions

## Key Features

### CLI Utilities
- `ossa-dev`: Development server with hot reload
- `ossa-generate`: Scaffold agents and adapters
- `ossa-health`: Health check for agent configs

### Transport Metadata
- Protocol-specific configuration for capabilities
- Streaming support (SSE, WebSocket, gRPC)
- Enhanced integration with Google ADK, A2A protocol, MCP

### Enhanced Security
- Security policies for tools and memory
- Access control for capabilities
- Audit logging support

### State Management
- Persistent and ephemeral state handling
- State versioning and migration
- Multi-agent state coordination

### Capability Versioning
- Semantic versioning for tools and capabilities
- Backward compatibility tracking
- Deprecation warnings

## Compatibility

- **Backward Compatible**: Yes (with v0.2.2, v0.2.3, v0.2.4, v0.2.5)
- **Breaking Changes**: None
- **Supported API Versions**: `ossa/v0.2.2`, `ossa/v0.2.3`, `ossa/v0.2.4`, `ossa/v0.2.5`, `ossa/v0.2.6`, `ossa/v1`

## Migration

To upgrade from previous versions, see the migration guides:
- [v0.2.5 → v0.2.6](./migrations/v0.2.5-to-v0.2.6.md)
- [v0.2.4 → v0.2.6](./migrations/v0.2.4-to-v0.2.6.md)

## Validation

To validate manifests against this schema:

```bash
npm install @bluefly/openstandardagents
ossa validate your-agent.yaml
```

## Resources

- **Website**: https://openstandardagents.org
- **Schema URL**: https://openstandardagents.org/schemas/v0.2.6-dev/agent.json
- **GitHub**: https://github.com/blueflyio/openstandardagents
- **npm Package**: https://npmjs.com/package/@bluefly/openstandardagents

## License

MIT License - See root LICENSE file for details.
