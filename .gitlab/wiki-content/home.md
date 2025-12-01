<!--
OSSA Wiki Home Page
Purpose: Landing page for OSSA documentation, introducing the standard and guiding users to resources
Audience: Developers, architects, and organizations adopting AI agent standards
Educational Focus: Position OSSA as the OpenAPI for AI agents
-->

# OSSA - Open Standard for Scalable AI Agents

**OSSA is a specification standard for AI agents** - like OpenAPI is for REST APIs.

## What is OSSA?

OSSA (Open Standard for Scalable AI Agents) is **not a framework**. It's an open specification that defines:

- **Agent structure** - How to describe agent capabilities, inputs, and outputs
- **Validation** - Schema-based validation for agent definitions
- **Interoperability** - Standard format for agent communication
- **Tooling** - CLI tools for validation, generation, and migration

## Why OSSA?

The AI agent ecosystem faces a critical problem: **lack of standardization**. Every framework defines agents differently, making it impossible to:

- Share agent definitions across platforms
- Validate agent configurations
- Build universal tooling
- Enable agent marketplaces
- Ensure interoperability

**OSSA solves this** by providing a vendor-neutral, open standard that any framework can adopt.

## Quick Start

```bash
# Install OSSA CLI
npm install -g @bluefly/openstandardagents

# Validate an agent definition
ossa validate my-agent.json

# Generate TypeScript types
ossa generate types my-agent.json
```

## Key Features

- ✅ **JSON Schema-based** - Strict validation and type safety
- ✅ **Framework-agnostic** - Works with any AI agent framework
- ✅ **Version management** - Built-in migration tools
- ✅ **CLI tooling** - Validate, generate, and migrate agents
- ✅ **TypeScript support** - Full type definitions
- ✅ **Open source** - Apache 2.0 license

## Documentation

### Getting Started
- [Installation & Setup](getting-started.md)
- [Why OSSA?](why-ossa.md)
- [Core Concepts](specification/overview.md)

### Specification
- [Agent Definition](specification/agent-definition.md)
- [Capabilities](specification/capabilities.md)
- [Validation](specification/validation.md)

### Guides
- [Best Practices](guides/best-practices.md)
- [Migration Guide](guides/migration.md)
- [Tutorials](guides/tutorials.md)

### Reference
- [API Documentation](api.md)
- [Architecture](architecture.md)
- [Comparison](comparison.md)

### Community
- [Contributing](contributing.md)
- [Ecosystem](ecosystem.md)
- [Brand Guide](brand-guide/README.md)

## OSSA vs Others

| Feature | OSSA | Framework-specific |
|---------|------|-------------------|
| **Type** | Open standard | Proprietary format |
| **Validation** | JSON Schema | Framework-dependent |
| **Interoperability** | ✅ Universal | ❌ Locked-in |
| **Tooling** | CLI + libraries | Framework-only |
| **Portability** | ✅ Any platform | ❌ Single platform |

## Real-World Use Cases

1. **Agent Marketplaces** - Share validated agent definitions
2. **Multi-framework Projects** - Use same agent specs across frameworks
3. **CI/CD Integration** - Validate agents in pipelines
4. **Documentation** - Auto-generate docs from specs
5. **Type Safety** - Generate TypeScript/Python types

## Community & Support

- **Issues**: [GitLab Issues](https://gitlab.com/blueflyio/openstandardagents/-/issues)
- **Discussions**: [GitLab Discussions](https://gitlab.com/blueflyio/openstandardagents/-/issues)
- **Website**: [openstandardagents.org](https://openstandardagents.org)
- **Email**: team@bluefly.io

## Contributing

OSSA is an open standard. We welcome contributions:

- Specification improvements
- Tooling enhancements
- Documentation
- Examples and tutorials
- Ecosystem integrations

See [Contributing Guide](contributing.md) for details.

## License

Apache 2.0 - See [LICENSE](https://gitlab.com/blueflyio/openstandardagents/-/blob/main/LICENSE)

---

**Remember**: OSSA is a **standard**, not a framework. It defines how agents should be described, not how they should be built.
