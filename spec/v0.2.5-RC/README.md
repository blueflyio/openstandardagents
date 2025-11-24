# OSSA v0.2.5 Specification

**Release Date**: November 24, 2025
**Status**: Stable Release
**Version**: 0.2.5

## Overview

OSSA (Open Standard for Scalable AI Agents) v0.2.5 is a minor release introducing enhanced transport metadata, state management, security features, and capability versioning for better framework integration.

## What's in This Directory

- **`ossa-0.2.5-RC.schema.json`** - JSON Schema definition for OSSA v0.2.5 agent manifests
- **`ossa-0.2.5.yaml`** - YAML specification document
- **`CHANGELOG.md`** - Detailed release notes and feature descriptions
- **`README.md`** - This file
- **`migrations/`** - Upgrade guides from previous versions

## Key Features

### 🔄 Transport Metadata
- Protocol-specific configuration for capabilities
- Streaming support (SSE, WebSocket, gRPC)
- Enhanced integration with Google ADK, A2A protocol, MCP

### 🔒 Enhanced Security
- Security policies for tools and memory
- Access control for capabilities
- Audit logging support

### 📊 State Management
- Persistent and ephemeral state handling
- State versioning and migration
- Multi-agent state coordination

### 🔧 Capability Versioning
- Semantic versioning for tools and capabilities
- Backward compatibility tracking
- Deprecation warnings

## Compatibility

- **Backward Compatible**: Yes (with v0.2.2, v0.2.3, v0.2.4)
- **Breaking Changes**: None
- **Supported API Versions**: `ossa/v0.2.2`, `ossa/v0.2.3`, `ossa/v0.2.4`, `ossa/v0.2.5`, `ossa/v1`

## Migration

To upgrade from previous versions, see the migration guides:
- [v0.2.4 → v0.2.5](./migrations/v0.2.4-to-v0.2.5.md)
- [v0.2.3 → v0.2.5](./migrations/v0.2.3-to-v0.2.5.md)

## Validation

To validate manifests against this schema:

```bash
npm install @bluefly/openstandardagents
ossa validate your-agent.yaml
```

## Resources

- **Website**: https://openstandardagents.org
- **Schema URL**: https://openstandardagents.org/schemas/v0.2.5/agent.json
- **GitLab**: https://gitlab.com/blueflyio/openstandardagents
- **GitHub Mirror**: https://github.com/blueflyio/openstandardagents
- **npm Package**: https://npmjs.com/package/@bluefly/openstandardagents

## License

MIT License - See root LICENSE file for details.
