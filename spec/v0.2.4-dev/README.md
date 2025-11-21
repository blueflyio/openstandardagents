# OSSA v0.2.4-dev Specification

**Status:** Development  
**Release Date:** TBD  
**Previous Version:** [v0.2.3](../v0.2.3/README.md)

## Overview

OSSA v0.2.4 focuses on **Transport & Security** enhancements, providing foundational features for secure, stateful agent communication and enterprise integrations.

## Key Features

### Transport Metadata
- Protocol specification per capability (http, grpc, a2a, mcp, websocket, custom)
- Streaming modes (none, request, response, bidirectional)
- Binding paths and content types

### State Management
- Stateless, session, and long-running agent modes
- Storage backends (memory, vector-db, kv, rdbms, custom)
- Context window strategies (sliding_window, summarization, importance_weighted)

### Security & Compliance
- OAuth2-like scopes for fine-grained permissions
- Compliance tags (pii, hipaa, gdpr, fedramp, soc2, pci-dss)
- Per-capability scope overrides

### Capability Versioning
- Independent capability versioning (semantic versioning)
- Deprecation support with removal versions
- Migration guide templates

### Framework Extensions
- Google ADK integration (llm_agent, sequential_agent, parallel_agent, loop_agent)
- Microsoft Agent Framework adapter examples

## Schema Files

- **JSON Schema:** [`ossa-0.2.4-dev.schema.json`](./ossa-0.2.4-dev.schema.json)
- **YAML Schema:** [`ossa-0.2.4-dev.yaml`](./ossa-0.2.4-dev.yaml)

## Migration Guide

See [`migrations/v0.2.3-to-v0.2.4.md`](./migrations/v0.2.3-to-v0.2.4.md) for migration instructions from v0.2.3.

## Changelog

See [`CHANGELOG.md`](./CHANGELOG.md) for detailed changes.

## Examples

- CI/CD Agents: [`.gitlab/agents/`](../../.gitlab/agents/)
- Getting Started: [`examples/getting-started/`](../../examples/getting-started/)
- Framework Integrations: [`examples/`](../../examples/)

## Related Documentation

- [OSSA Website](https://openstandardagents.org)
- [GitHub Repository](https://github.com/blueflyio/openstandardagents)
- [NPM Package](https://www.npmjs.com/package/@bluefly/openstandardagents)

