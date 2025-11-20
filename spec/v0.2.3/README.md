# OSSA v0.2.3 Specification

## Overview

OSSA (Open Standard for Scalable AI Agents) v0.2.3 is a patch release focusing on documentation improvements and examples standardization. This version maintains full backward compatibility with v0.2.2.

## What is OSSA?

OSSA is to AI agents what OpenAPI is to REST APIs:
- **Declarative**: Define agents using YAML/JSON manifests
- **Framework-Agnostic**: Works with any AI framework (LangChain, CrewAI, OpenAI, Anthropic, etc.)
- **Kubernetes-Style**: Familiar apiVersion/kind/metadata/spec structure
- **Portable**: Export manifests from one platform, import to another

## Schema Files

- **ossa-0.2.3.schema.json**: JSON Schema validation for OSSA v0.2.3 manifests
- **ossa-0.2.3.yaml**: YAML version of the schema

## API Version

```yaml
apiVersion: ossa/v0.2.3
```

The schema accepts:
- `ossa/v0.2.3` (recommended)
- `ossa/v0.2.2` (backward compatible)
- `ossa/v1` (forward compatible)

## Key Features

### Kubernetes-Style Manifest

```yaml
apiVersion: ossa/v0.2.3
kind: Agent
metadata:
  name: my-agent
  namespace: default
  labels:
    app: my-app
    version: v1.0.0
spec:
  type: worker
  runtime:
    type: langchain
    version: "0.3.0"
  capabilities:
    - query
    - reasoning
  config:
    model: gpt-4
    temperature: 0.7
```

### Framework Extensions

OSSA supports framework-specific extensions:
- **kAgent**: Kubernetes-native agents with CRDs
- **Drupal**: CMS integration via ai_agents module
- **OpenAI**: Assistants API format
- **LangChain**: Tool/chain integration
- **CrewAI**: Multi-agent orchestration

## Changes from v0.2.2

### Documentation & Examples (v0.2.3)
- ✅ Enhanced inline documentation for all examples
- ✅ Comprehensive migration guides (6 frameworks)
- ✅ Improved README and getting-started guides
- ✅ Added production-ready examples
- ✅ GitLab wiki integration
- ⚠️ **Schema unchanged** (backward compatible)

This is a **documentation release** - no breaking changes to the schema.

## Migration from v0.2.2

**No migration required!** v0.2.3 is fully backward compatible with v0.2.2.

Simply update your `apiVersion` field:

```yaml
# Before (v0.2.2)
apiVersion: ossa/v0.2.2

# After (v0.2.3)
apiVersion: ossa/v0.2.3
```

Both versions are accepted by the same schema. See [migrations/v0.2.2-to-v0.2.3.md](migrations/v0.2.2-to-v0.2.3.md) for details.

## Examples

Located in `/examples/`:

### Getting Started
- `examples/getting-started/hello-world-complete.ossa.yaml`
- `examples/getting-started/hello-world-minimal.ossa.yaml`

### kAgent (Kubernetes)
- `examples/kagent/k8s-troubleshooter.ossa.yaml`
- `examples/kagent/compliance-validator.ossa.yaml`
- `examples/kagent/security-scanner.ossa.yaml`
- `examples/kagent/cost-optimizer.ossa.yaml`

### Drupal Integration
- `examples/drupal/gitlab-ml-recommender.ossa.yaml`

### Integration Patterns
- `examples/integration-patterns/agent-to-agent-orchestration.ossa.yaml`
- `examples/integration-patterns/hybrid-reasoning.ossa.yaml`

### Production
- `examples/production/enterprise-agent.ossa.yaml`

## Validation

Validate your manifests using the OSSA CLI:

```bash
# Install
npm install -g @bluefly/openstandardagents

# Validate
ossa validate my-agent.ossa.yaml

# Generate new agent
ossa generate my-new-agent --type worker
```

## Resources

- **Main Docs**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/wikis/home
- **Examples**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/tree/main/examples
- **Migration Guides**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/wikis/Migration-Guides
- **OpenAPI Extensions**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/wikis/OpenAPI-Extensions

## Compatibility Matrix

| OSSA Version | kAgent | Drupal | OpenAI | LangChain | CrewAI | MCP |
|--------------|--------|--------|--------|-----------|--------|-----|
| v0.2.3       | ✅ v1α1 | ✅ v11  | ✅ v2   | ✅ v0.3    | ✅ v0.11| ✅  |
| v0.2.2       | ✅ v1α1 | ✅ v11  | ✅ v2   | ✅ v0.3    | ✅ v0.11| ✅  |
| v1.0 (legacy)| ⚠️ Partial | ❌ No | ❌ No | ⚠️ Partial | ❌ No  | ❌  |

## License

Apache 2.0

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.
