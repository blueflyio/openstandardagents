# OSSA Migration Guide

## For Contributors & Developers

This guide helps contributors understand the OSSA project structure and how to add new specifications or modify existing ones.

## Project Structure

```
/Users/flux423/Sites/LLM/OSSA/
├── src/
│   ├── api/                    # OpenAPI 3.1 Specifications
│   │   ├── core/               # Core OSSA specifications (6 files)
│   │   ├── project/            # Project domain APIs (4 files)
│   │   ├── mcp/                # MCP infrastructure (4 files)
│   │   ├── legacy/             # Legacy/testing (1 file)
│   │   └── README.md           # API documentation
│   ├── cli/                    # CLI implementation
│   ├── core/                   # Core libraries
│   ├── server/                 # Express server
│   └── types/                  # TypeScript types
├── docs/                       # Documentation
├── infrastructure/             # K8s/Docker configs
├── tests/                      # Test suites
├── .redocly.yaml              # API doc configuration
├── package.json               # Dependencies & scripts
├── README.md                  # Main documentation
├── CHANGELOG.md               # Version history
└── RELEASE.md                 # Release notes
```

## Adding a New OpenAPI Specification

### 1. Choose the Right Directory

```bash
# Core OSSA specifications (agent standards, protocols)
src/api/core/your-spec.openapi.yml

# Project management, orchestration
src/api/project/your-spec.openapi.yml

# MCP/Model Context Protocol
src/api/mcp/your-spec.openapi.yml

# Testing or deprecated
src/api/legacy/your-spec.openapi.yml
```

### 2. Create Your Specification

```yaml
# src/api/core/example-agent.openapi.yml
openapi: 3.1.0
info:
  title: Example Agent API
  version: 1.0.0
  description: |
    Comprehensive description of your API
  x-ossa:
    version: 0.1.9
    conformance_tier: core
    protocols: [mcp, ossa, rest]

servers:
  - url: https://api.ossa.dev/v1
    description: Production
  - url: http://localhost:3000/v1
    description: Development

paths:
  /agent/health:
    get:
      operationId: getHealth
      summary: Health check
      responses:
        '200':
          description: Healthy
```

### 3. Update Redocly Configuration

```yaml
# .redocly.yaml
apiDefinitions:
  # Add your new spec
  example-agent:
    root: src/api/core/example-agent.openapi.yml

nav:
  - label: 'Core Specifications'
    items:
      # Add navigation entry
      - label: 'Example Agent'
        page: example-agent
```

### 4. Update Package.json Scripts

```json
{
  "scripts": {
    // Add validation for your spec if needed
    "api:validate:example": "npx @redocly/cli lint src/api/core/example-agent.openapi.yml"
  }
}
```

### 5. Test Your Specification

```bash
# Validate your specification
npx @redocly/cli lint src/api/core/example-agent.openapi.yml

# Generate TypeScript types
openapi-typescript src/api/core/example-agent.openapi.yml -o src/types/example-agent.ts

# Preview documentation
npm run api:docs
```

## Migrating from v0.1.9 to v0.1.2

### File Structure Changes

| Old Path | New Path | Reason |
|----------|----------|---------|
| `src/api/specification.openapi.yml` | `src/api/core/specification.openapi.yml` | Organization |
| `src/api/acdl-specification.yml` | `src/api/core/acdl-specification.openapi.yml` | Naming consistency |
| `src/api/openapi.yml` | `src/api/core/ossa-agent.openapi.yml` | Descriptive naming |
| `src/api/voice-agent-specification.yml` | `src/api/core/voice-agent.openapi.yml` | Simplification |

### Script Updates

```bash
# Old
npm run api:validate  # src/api/specification.openapi.yml

# New
npm run api:validate  # src/api/core/specification.openapi.yml
```

### Import Path Updates

```typescript
// Old
import { AgentApi } from '../types/api';

// New  
import { AgentApi } from '../types/api-client';
```

## Common Tasks

### Validate All Specifications

```bash
npm run api:validate:all
```

### Generate All TypeScript Types

```bash
npm run generate:client
npm run api:generate
```

### Build Documentation

```bash
npm run api:docs:build
```

### Run Tests

```bash
npm test
npm run test:coverage
```

## Best Practices

### 1. OpenAPI 3.1 Standards

- Use OpenAPI 3.1.0 (not 3.0.x)
- Include `x-ossa` extension for OSSA metadata
- Add comprehensive descriptions
- Provide examples for all operations
- Use discriminator mapping for polymorphic types

### 2. Naming Conventions

- Files: `kebab-case.openapi.yml`
- OperationIds: `camelCase`
- Schemas: `PascalCase`
- Parameters: `camelCase`
- Paths: `/kebab-case/{camelCase}`

### 3. Security

- Define security schemes in components
- Apply security to all operations
- Use OAuth 2.1 or API keys
- Document authentication requirements

### 4. Documentation

- Write clear summaries and descriptions
- Include request/response examples
- Document error responses
- Add external documentation links

### 5. Validation

- Always validate before committing
- Fix errors, document warnings
- Use CI/CD validation jobs
- Keep validation reports

## Troubleshooting

### Validation Errors

```bash
# Check specific file
npx @redocly/cli lint src/api/core/your-spec.openapi.yml

# Check with custom rules
npx @redocly/cli lint --config .redocly.yaml src/api/core/your-spec.openapi.yml
```

### TypeScript Generation Issues

```bash
# Clear old types
rm -rf src/types/api-client.ts

# Regenerate
npm run generate:client
```

### Documentation Build Errors

```bash
# Clean build directory
rm -rf dist/api-docs

# Rebuild
npm run api:docs:build
```

## CI/CD Integration

### GitLab CI

The project includes comprehensive CI/CD validation:

```yaml
validate:openapi:
  stage: validate
  script:
    - npm run api:validate:complete  # Must pass
    - npm run api:validate:all || true  # Warnings allowed
```

### Pre-commit Hooks

Add validation to git hooks:

```bash
# .husky/pre-commit
npm run api:validate:complete
```

## Getting Help

- **Documentation**: [src/api/README.md](../src/api/README.md)
- **Examples**: [src/api/core/ossa-complete.openapi.yml](../src/api/core/ossa-complete.openapi.yml)
- **Issues**: [GitLab Issues](https://gitlab.bluefly.io/llm/ossa/issues)
- **Discord**: [OSSA Community](https://discord.gg/ossa)

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Validate all specifications
4. Generate new types
5. Build documentation
6. Create git tag
7. Push to GitLab
8. CI/CD creates release

---

**Last Updated**: September 29, 2025  
**Current Version**: 0.1.2  
**Next Version**: 0.2.0 (Q4 2025)