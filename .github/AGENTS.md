# AGENTS.md - Repository-Level Agent Guidance

> This file provides guidance for AI coding agents working on this repository.
> Follows the [agents.md](https://agents.md) specification.

## Overview

This is the **OSSA (Open Standard for Scalable AI Agents)** repository - the OpenAPI for AI Agents.

**Important**: This GitHub repository is a **public mirror** of our [GitLab repository](https://gitlab.com/blueflyio/openstandardagents). All CI/CD, testing, and releases happen on GitLab.

## Development Environment

### Setup

```bash
# Clone (from GitHub mirror)
git clone https://github.com/blueflyio/openstandardagents.git
cd openstandardagents

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `spec/` | OSSA schema definitions (JSON Schema) |
| `src/` | TypeScript CLI and validation library |
| `examples/` | Example agent manifests for various platforms |
| `docs/` | Public documentation |
| `.gitlab/` | GitLab CI/CD and internal agents |
| `.github/` | GitHub workflows and community tooling |

### Technology Stack

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 20+
- **Package Manager**: npm (with legacy-peer-deps)
- **Testing**: Jest
- **Linting**: ESLint + Prettier
- **Schema**: JSON Schema Draft-07

## Testing

### Running Tests

```bash
# All tests
npm test

# With coverage
npm test -- --coverage

# Specific file
npm test -- schema.repository.test.ts

# Watch mode
npm test -- --watch
```

### Test Requirements

- All schema changes require validation tests
- All CLI commands require integration tests
- Minimum 80% code coverage
- Tests must pass on Node.js 20 and 22

### Validation

```bash
# Validate all example manifests
npm run validate

# Validate specific manifest
npx ossa validate examples/cursor/code-review-agent.ossa.json
```

## Pull Request Instructions

### PR Workflow (GitHub Mirror)

1. **Open PR on GitHub** - Community contributions welcome
2. **Automated Triage** - OSSA agents label and categorize
3. **Review** - Maintainers review on GitHub
4. **GitLab Sync** - Approved PRs create GitLab MR
5. **CI/CD** - Full test suite runs on GitLab
6. **Merge** - Changes merge on GitLab
7. **Mirror Sync** - GitHub automatically updated
8. **PR Auto-Close** - Your PR closes when changes appear

### Commit Convention

Use [Conventional Commits](https://conventionalcommits.org):

```bash
# Feature (minor version bump)
git commit -m "feat(schema): add agents_md extension support"

# Bug fix (patch version bump)
git commit -m "fix(cli): resolve validation timeout"

# Breaking change (major version bump)
git commit -m "feat!: redesign manifest schema

BREAKING CHANGE: apiVersion format changed"

# Documentation (no release)
git commit -m "docs: update getting started guide"
```

### PR Title Format

PR titles should follow conventional commits (becomes squash commit):

- ✅ `feat: add LangGraph extension support`
- ✅ `fix(schema): correct required fields`
- ❌ `Updated some stuff`
- ❌ `WIP`

## Code Style

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types, descriptive names
export async function validateManifest(
  manifest: OssaManifest,
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  // Implementation
}

// ❌ Bad: Any types, unclear names
export async function validate(m: any, o?: any) {
  // Implementation
}
```

### Schema Guidelines

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["apiVersion", "kind", "metadata", "spec"],
  "properties": {
    "apiVersion": {
      "type": "string",
      "pattern": "^ossa/v[0-9]+\\.[0-9]+\\.[0-9]+$",
      "description": "OSSA API version"
    }
  }
}
```

### File Naming

- Schema files: `ossa-{version}.schema.json`
- Example manifests: `{name}.ossa.{json|yaml}`
- Tests: `{name}.test.ts`
- Services: `{name}.service.ts`

## Security

### Sensitive Data

**NEVER** commit:
- API keys or tokens
- Private keys or certificates
- Database credentials
- Internal URLs or endpoints

### Security Issues

**DO NOT** open public issues for security vulnerabilities.

Report via email: **ops@openstandardagents.org**

## Architecture Notes

### Schema Versioning

- Current: `ossa/v0.2.8` (latest stable)
- Development: `ossa/v0.2.9` (in progress)
- Format: `ossa/v{major}.{minor}.{patch}`

### Extension System

Extensions allow platform-specific configuration:

```yaml
extensions:
  cursor:
    enabled: true
    agent_type: composer
  openai_agents:
    enabled: true
    model: gpt-4o
  agents_md:
    enabled: true
    generate: true
```

### Supported Extensions

| Extension | Platform | Status |
|-----------|----------|--------|
| `cursor` | Cursor IDE | Stable |
| `openai_agents` | OpenAI Agents SDK | Stable |
| `anthropic` | Claude/Anthropic | Stable |
| `langchain` | LangChain | Stable |
| `crewai` | CrewAI | Stable |
| `kagent` | kAgent (K8s) | Stable |
| `agents_md` | agents.md | New in v0.2.9 |

## Common Tasks

### Adding a New Extension

1. Add schema definition in `spec/v{version}/ossa-{version}.schema.json`
2. Create example in `examples/{extension}/`
3. Add validator in `src/services/validation/`
4. Write tests in `tests/`
5. Update documentation

### Updating Schema Version

1. Copy `spec/v{old}/` to `spec/v{new}/`
2. Update `$id`, `title`, and version references
3. Make changes
4. Update `src/types/index.ts`
5. Run `npm run validate`

---

*Generated from OSSA agent manifests in `.github/agents/`*
*Last updated: 2025-12-04*
