# OSSA v0.2.6-dev Release Notes

**Release Date**: 2025-11-26
**Type**: Patch Release (Documentation & Examples)
**Status**: Development

## Overview

OSSA v0.2.6-dev is a documentation-focused release that enhances examples, improves migration guides, adds CLI utilities, and includes brand positioning resources.

## What's New

### CLI Utilities
- `ossa-dev`: Development server with hot reload
- `ossa-generate`: Scaffold agents and adapters
- `ossa-health`: Health check for agent configs

### Documentation Improvements

#### Enhanced Examples
- Added comprehensive inline documentation to 10 priority examples
- Annotated kAgent examples with best practices
- Improved getting-started guides with step-by-step instructions
- Added production-ready enterprise agent examples

#### Migration Guides (6 Frameworks)
- **LangChain → OSSA**: Complete migration workflow with code examples
- **CrewAI → OSSA**: Multi-agent orchestration patterns
- **OpenAI Agents SDK → OSSA**: Assistants API conversion
- **Anthropic MCP → OSSA**: Model Context Protocol bridge
- **Langflow → OSSA**: Visual flow-to-manifest conversion
- **Drupal ECA → OSSA**: Event-Condition-Action migration

#### Brand Resources
- Brand positioning and value proposition documentation
- Visual identity system specification
- Competitive comparison matrix (LangChain, AutoGen, MCP, Semantic Kernel)
- Migration paths from alternative frameworks

#### GitLab Wiki Integration
- Migrated documentation to GitLab wiki
- Added issue templates for standardized reporting
- Created milestone tracking system
- Integrated CI/CD documentation

#### OpenAPI Extensions Documentation
- Documented x-ossa-agent extension
- Added x-ossa-manifest reference guide
- Explained framework-specific extensions
- Provided OpenAPI spec generation examples

### Examples & Templates

#### New Examples
- `examples/kagent/README.md` - kAgent integration guide
- `examples/integration-patterns/agent-to-agent-orchestration.ossa.yaml`
- `examples/production/enterprise-agent.ossa.yaml`

#### Updated Examples
All kagent examples updated with:
- Detailed inline comments
- Best practice annotations
- Real-world use cases
- Troubleshooting tips

### Build & Infrastructure

#### npm Publishing Preparation
- Package configured for public npm registry
- Build artifacts optimized
- Dependencies audited and updated
- prepublishOnly hooks configured

#### CI/CD Improvements
- Consolidated GitLab CI/CD pipeline
- Added comprehensive test coverage reports
- Implemented security audit checks
- Configured manual release triggers

## Breaking Changes

**None** - This release is fully backward compatible with v0.2.5.

## Bug Fixes

- Fixed schema validation for edge cases
- Corrected example formatting inconsistencies
- Updated broken documentation links
- Resolved CI pipeline configuration issues
- Version synchronization across project files
- Website deployment configuration
- Missing spec directory structures (v0.2.4, v0.2.5)

## Schema Changes

**No schema changes** - v0.2.6-dev schema is identical to v0.2.5 with updated version metadata only.

## Migration from v0.2.5

### Required Changes
**None** - Simply update your `apiVersion` field (optional):

```yaml
# Both versions work identically
apiVersion: ossa/v0.2.5  # Still valid
apiVersion: ossa/v0.2.6  # Recommended
```

### Recommended Changes
1. Review new migration guides if integrating with frameworks
2. Update documentation references to use v0.2.6-dev
3. Check out new examples for best practices

See [migrations/v0.2.5-to-v0.2.6.md](migrations/v0.2.5-to-v0.2.6.md) for detailed migration guide.

## Installation

### npm (Recommended)
```bash
npm install -g @bluefly/openstandardagents@0.2.6
```

### Verify Installation
```bash
ossa --version
# Output: 0.2.6
```

## Compatibility

| Component | Version | Status |
|-----------|---------|--------|
| Node.js | >=18.0.0 | ✅ Required |
| npm | >=9.0.0 | ✅ Required |
| kAgent | v1alpha1 | ✅ Full support |
| Drupal | 11.x, 10.x | ✅ Full support |
| OpenAI SDK | v2.x | ✅ Full support |
| LangChain | v0.3.x | ✅ Full support |
| CrewAI | v0.11.x | ✅ Full support |
| MCP | Latest | ✅ Full support |

## Related Issues

- #28 - Spec structure preparation
- #26 - Version synchronization
- #32 - CLI utilities enhancement
- #44 - Brand identity development (epic)
- #47 - Brand positioning
- #48 - Visual identity
- #49 - Comparison matrix

## Support

- **Documentation**: https://github.com/blueflyio/openstandardagents
- **Issues**: https://github.com/blueflyio/openstandardagents/issues
- **Examples**: https://github.com/blueflyio/openstandardagents/tree/main/examples

## Acknowledgments

Special thanks to the OSSA community for feedback and contributions!

---

**Full Changelog**: [v0.2.5...v0.2.6](https://github.com/blueflyio/openstandardagents/compare/v0.2.5...v0.2.6)
