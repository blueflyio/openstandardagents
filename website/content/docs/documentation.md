---
title: Documentation
description: Complete OSSA documentation with auto-generated API, CLI, and schema references
---

# OSSA Documentation

Welcome to the complete OSSA documentation. All reference documentation is **auto-generated** from source code and specifications.

## 📚 Documentation Sections

### [CLI Reference](/docs/cli-reference)
Complete reference for all OSSA CLI commands with examples.

**11 Commands Documented:**
- [ossa validate](/docs/cli-reference/ossa-validate) - Validate agent manifests
- [ossa generate](/docs/cli-reference/ossa-generate) - Generate agent templates
- [ossa run](/docs/cli-reference/ossa-run) - Run agents locally
- [ossa migrate](/docs/cli-reference/ossa-migrate) - Migrate between versions
- [ossa init](/docs/cli-reference/ossa-init) - Initialize projects
- [ossa setup](/docs/cli-reference/ossa-setup) - Setup environment
- [ossa export](/docs/cli-reference/ossa-export) - Export manifests
- [ossa import](/docs/cli-reference/ossa-import) - Import from frameworks
- [ossa schema](/docs/cli-reference/ossa-schema) - View schemas
- [ossa gitlab-agent](/docs/cli-reference/ossa-gitlab-agent) - GitLab integration
- [ossa agents](/docs/cli-reference/ossa-agents) - Manage agents

### [API Reference](/docs/api-reference)
Complete REST API documentation with endpoints, examples, and authentication.

**4 Core APIs Documented:**
- [OSSA Core API](/docs/api-reference/ossa-core-api) - Agent management
- [OSSA Registry API](/docs/api-reference/ossa-registry-api) - Agent registry
- [Unified Agent Gateway](/docs/api-reference/unified-agent-gateway) - Gateway API

### [Schema Reference](/docs/schema-reference)
Complete schema documentation explaining why, how, and where to use each field.

**Key Fields Documented:**
- [agent.id](/docs/schema-reference/agent-id) - Unique identifier
- [agent.name](/docs/schema-reference/agent-name) - Human-readable name
- [agent.version](/docs/schema-reference/agent-version) - Semantic version
- [agent.role](/docs/schema-reference/agent-role) - Agent classification
- [agent.capabilities](/docs/schema-reference/agent-capabilities) - What agents can do

## 🚀 Quick Start

```bash
# Install OSSA CLI
npm install -g @bluefly/openstandardagents

# Validate an agent
ossa validate agent.ossa.yaml

# Generate a new agent
ossa generate worker --name "My Agent"

# Run an agent locally
ossa run agent.ossa.yaml
```

## 🤖 Auto-Generated Documentation

All reference documentation is automatically generated from:
- **CLI Docs**: Generated from `src/cli/commands/*.ts`
- **API Docs**: Generated from `openapi/core/*.yaml`
- **Schema Docs**: Generated from `spec/v*/ossa-*.schema.json`

Documentation stays in sync with code through:
- GitLab CI/CD pipeline
- Documentation agent (OSSA-compliant)
- Automated validation and deployment

## 📖 Additional Resources

- [Getting Started](/docs/getting-started) - Quick start guide
- [Architecture](/docs/architecture) - System architecture
- [Migration Guides](/docs/migration-guides) - Framework migrations
- [Examples](/docs/examples) - Real-world examples

## 🔄 Documentation Updates

Documentation is automatically updated when:
- OpenAPI specifications change
- CLI commands are modified
- JSON Schema is updated

**Last Generated**: {new Date().toISOString()}

## 💡 Contributing to Documentation

See our [Documentation Implementation Guide](https://github.com/blueflyio/openstandardagents/blob/main/DOCUMENTATION_IMPLEMENTATION_GUIDE.md) for:
- Documentation standards
- Template usage
- Automation setup
- Contributing guidelines

---

**Questions?** Open an issue on [GitLab](https://gitlab.com/blueflyio/openstandardagents/-/issues) with the `documentation` label.
