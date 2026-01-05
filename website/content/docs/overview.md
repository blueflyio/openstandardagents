---
title: "Overview"
---

# OSSA Overview

## What is OSSA?

Open Standard for Scalable AI Agents (OSSA) is a declarative specification for AI agent definitions, enabling interoperability across platforms and frameworks.

## Benefits

### For Developers
- **Standardized Format**: One manifest works everywhere
- **Framework Agnostic**: Use any runtime/framework
- **Type Safety**: Auto-generated types from schema
- **Validation**: Built-in schema validation

### For Enterprises
- **Compliance**: Built-in security and compliance
- **Observability**: Full tracing and monitoring
- **Scalability**: Designed for production scale
- **Governance**: Access controls and policies

### For Platforms
- **Interoperability**: Agents work across platforms
- **Discovery**: Standard agent catalog format
- **Integration**: Easy platform integration
- **Ecosystem**: Rich tooling and support

## Core Concepts

### Agent Manifest
Declarative YAML/JSON file defining agent capabilities, configuration, and behavior.

### Access Tiers
Security model with tiered access controls (Tier 1: Public, Tier 2: Internal, Tier 3: Restricted).

### Taxonomy
Domain classification system for agent organization and discovery.

### Separation of Duties
Role-based access control preventing conflicts of interest.

## Architecture

### Three-Tier Structure
1. **Tier 1**: Agent manifests (YAML definitions)
2. **Tier 2**: Infrastructure packages (protocol, mesh, brain)
3. **Tier 3**: Platform implementation (GitLab Agent, K8s)

### Execution Flow
```
Manifest → Validation → Deployment → Execution → Observability
```

## Getting Started

1. **Install**: `npm install -g @bluefly/openstandardagents`
2. **Init**: `ossa init`
3. **Validate**: `ossa validate agent.ossa.yaml`
4. **Run**: `ossa run agent.ossa.yaml`

## Related Documentation

- [Installation](./getting-started/installation.md)
- [First Agent](./getting-started/first-agent.md)
- [Schema Reference](./schema-reference/index.md)
- [API Reference](./api-reference/index.md)

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
