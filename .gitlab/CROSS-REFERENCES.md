# Cross-Reference Documentation

This document maps relationships between wiki pages, milestones, issues, examples, and code.

## Wiki → Examples

### Getting Started Examples

| Wiki Page | Example File | Purpose |
|-----------|--------------|---------|
| [Getting-Started/Hello-World](../wiki-content/Getting-Started/Hello-World.md) | [examples/getting-started/hello-world-complete.ossa.yaml](../../examples/getting-started/hello-world-complete.ossa.yaml) | Complete annotated example |
| [Getting-Started/First-Agent](../wiki-content/Getting-Started/First-Agent.md) | [examples/minimal/agent.yml](../../examples/minimal/agent.yml) | Minimal valid agent |
| [Getting-Started/First-Agent](../wiki-content/Getting-Started/First-Agent.md) | [examples/compliance-agent.yml](../../examples/compliance-agent.yml) | Enterprise example |

### Integration Patterns

| Wiki Page | Example File | Purpose |
|-----------|--------------|---------|
| [Examples/Integration-Patterns](../wiki-content/Examples/Integration-Patterns.md) | [examples/integration-patterns/agent-to-agent-orchestration.ossa.yaml](../../examples/integration-patterns/agent-to-agent-orchestration.ossa.yaml) | Multi-agent orchestration |
| [For-Audiences/Architects](../wiki-content/For-Audiences/Architects.md) | [examples/agent-manifests/orchestrators/orchestrator-agent.yaml](../../examples/agent-manifests/orchestrators/orchestrator-agent.yaml) | Orchestrator pattern |
| [For-Audiences/Architects](../wiki-content/For-Audiences/Architects.md) | [examples/agent-manifests/workers/worker-agent.yaml](../../examples/agent-manifests/workers/worker-agent.yaml) | Worker pattern |

### Migration Guides

| Wiki Page | Example File | Purpose |
|-----------|--------------|---------|
| [Examples/Migration-Guides](../wiki-content/Examples/Migration-Guides.md) | [examples/migration-guides/from-langchain-to-ossa.yaml](../../examples/migration-guides/from-langchain-to-ossa.yaml) | LangChain migration |
| [For-Audiences/Developers](../wiki-content/For-Audiences/Developers.md) | [examples/migration-guides/from-langchain-to-ossa.yaml](../../examples/migration-guides/from-langchain-to-ossa.yaml) | Framework migration |

### Enterprise Examples

| Wiki Page | Example File | Purpose |
|-----------|--------------|---------|
| [For-Audiences/Enterprises](../wiki-content/For-Audiences/Enterprises.md) | [examples/enterprise/agent.yml](../../examples/enterprise/agent.yml) | Enterprise configuration |
| [For-Audiences/Enterprises](../wiki-content/For-Audiences/Enterprises.md) | [examples/compliance-agent.yml](../../examples/compliance-agent.yml) | Compliance agent |
| [For-Audiences/Enterprises](../wiki-content/For-Audiences/Enterprises.md) | [examples/production/agent.yml](../../examples/production/agent.yml) | Production patterns |

## Milestones → Issues

### v0.2.3 - Documentation & Examples Release

**Milestone**: [v0.2.3-Documentation-Examples.md](milestones/v0.2.3-Documentation-Examples.md)

**Related Issues** (to be created/assigned):
- Documentation: Create comprehensive wiki structure
- Documentation: Migrate README content to wiki
- Examples: Complete annotated hello-world example
- Examples: Add integration pattern examples
- Migration: LangChain → OSSA migration guide
- Migration: Anthropic SDK → OSSA migration guide

**Labels**: `component:docs`, `component:examples`, `component:migration`, `type:enhancement`

### v0.3.0 - Gamma Release

**Milestone**: [v0.3.0-Gamma.md](milestones/v0.3.0-Gamma.md)

**Related Issues** (existing):
- 2/5 issues complete (40%)

**Labels**: `component:spec`, `type:feature`, `priority:p1`

### v1.0.0 - Genesis Release

**Milestone**: [v1.0.0-Genesis.md](milestones/v1.0.0-Genesis.md)

**Related Issues** (existing):
- 1/7 issues complete (14%)

**Labels**: `component:spec`, `type:feature`, `priority:p0`

## Issues → Code

### Component Mapping

| Component Label | Code Location | Description |
|----------------|---------------|-------------|
| `component:spec` | [spec/v0.2.2/](../../spec/v0.2.2/) | JSON Schema specification |
| `component:cli` | [src/cli/](../../src/cli/) | CLI commands |
| `component:validation` | [src/services/validation.service.ts](../../src/services/validation.service.ts) | Validation service |
| `component:examples` | [examples/](../../examples/) | Example agents |
| `component:docs` | [.gitlab/wiki-content/](wiki-content/) | Wiki documentation |
| `component:migration` | [src/services/migration.service.ts](../../src/services/migration.service.ts) | Migration service |

### Issue Types → Code Impact

| Issue Type | Typical Code Changes |
|------------|---------------------|
| `type:bug` | Fix in service/CLI code |
| `type:feature` | Add to spec + implementation |
| `type:enhancement` | Improve existing code |
| `type:documentation` | Update wiki/README |

## Wiki → Technical Documentation

### Schema Reference

| Wiki Page | Technical Resource |
|-----------|-------------------|
| [Technical/Schema-Reference](../wiki-content/Technical/Schema-Reference.md) | [spec/v0.2.2/ossa-0.2.2.schema.json](../../spec/v0.2.2/ossa-0.2.2.schema.json) |
| [For-Audiences/Developers](../wiki-content/For-Audiences/Developers.md) | [spec/v0.2.2/ossa-0.2.2.schema.json](../../spec/v0.2.2/ossa-0.2.2.schema.json) |

### API Reference

| Wiki Page | Code Location |
|-----------|--------------|
| [Technical/CLI-Reference](../wiki-content/Technical/CLI-Reference.md) | [src/cli/](../../src/cli/) |
| [For-Audiences/Developers](../wiki-content/For-Audiences/Developers.md) | [src/cli/](../../src/cli/) |

## Navigation Structure

### Home Page Links

The wiki home page ([00-HOME.md](wiki-content/00-HOME.md)) links to:

1. **Getting Started**
   - 5-Minute Overview
   - Installation
   - Hello World
   - First Agent

2. **For Audiences**
   - Students & Researchers
   - Developers
   - Architects
   - Enterprises

3. **Technical**
   - Specification Deep-Dive
   - Schema Reference
   - Tool Integration
   - Runtime Deployment
   - Observability

4. **Examples**
   - Getting Started Examples
   - Integration Patterns
   - Migration Guides
   - Advanced Patterns
   - Enterprise Examples

5. **Ecosystem**
   - OSSA Standard
   - agent-buildkit
   - Community Tools
   - Registry & Discovery

## Issue Templates → Components

| Issue Template | Typical Components |
|----------------|-------------------|
| Bug-Report.md | Any component |
| Feature-Request.md | spec, cli, validation |
| Documentation-Improvement.md | docs |
| Migration-Guide-Request.md | migration, examples |
| Example-Request.md | examples |

## Repository Structure

```
OSSA/
├── .gitlab/
│   ├── wiki-content/          # Wiki source files
│   ├── issue_templates/       # Issue templates
│   ├── milestones/            # Milestone documentation
│   └── CROSS-REFERENCES.md    # This file
├── examples/                  # Example agents
│   ├── getting-started/       # Tutorial examples
│   ├── integration-patterns/  # Multi-agent patterns
│   ├── migration-guides/      # Framework migrations
│   └── ...
├── spec/                      # JSON Schema specifications
│   └── v0.2.2/
└── src/                       # Source code
    ├── cli/                   # CLI commands
    └── services/              # Core services
```

## Maintenance

### When Adding New Content

1. **New Wiki Page**
   - Add to `.gitlab/wiki-content/`
   - Update home page navigation
   - Add cross-references here

2. **New Example**
   - Add to `examples/`
   - Link from relevant wiki pages
   - Update this document

3. **New Issue**
   - Use appropriate template
   - Apply labels
   - Assign to milestone
   - Link to related wiki/docs

4. **New Milestone**
   - Create milestone doc
   - Link issues
   - Update roadmap

## Related

- [Wiki Migration Guide](WIKI-MIGRATION-GUIDE.md)
- [Audit Summary](AUDIT-SUMMARY.md)
- [Labels Structure](labels-structure.md)

