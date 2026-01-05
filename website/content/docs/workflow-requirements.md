---
title: "Workflow Requirements"
---

# OSSA Workflow Requirements

## Branch Naming Policy

All branches must follow the convention:

```
{type}/{issue#}-{slug}
```

### Allowed Types

- `feature/` - New features (MUST include issue number)
- `bugfix/` - Bug fixes (issue number optional)
- `hotfix/` - Critical production fixes (issue number optional)
- `chore/` - Maintenance tasks (issue number optional)
- `release/v{major}.{minor}.x` - Release branches (e.g., `release/v0.1.x`)

### Examples

```
feature/123-add-user-authentication
feature/44-fix-validation
bugfix/php8-compat
hotfix/critical-schema-bug
chore/update-ci-runners
release/v0.2.x
17-api-normalizer-mvp-core
```

### Rules

- Lowercase only, hyphens for separators
- 10-60 characters total
- Feature branches MUST include numeric issue number
- Slug: A-Z a-z 0-9 . _ - only
- Issue number MUST be followed by hyphen

### Forbidden

- `development`, `dev`, `master` (use `main` instead)
- `test/*` branches
- Branches without required prefixes
- Feature branches without issue numbers

---

## Commit Message Policy

OSSA uses **Angular commit message format** for semantic-release:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

| Type | Description | Version Bump | Example |
|------|-------------|--------------|---------|
| `feat` | New feature | MINOR (0.x.0) | `feat: add MCP bridge support` |
| `fix` | Bug fix | PATCH (0.0.x) | `fix: resolve schema validation error` |
| `docs` | Documentation | PATCH* (0.0.x) | `docs: update README with examples` |
| `refactor` | Code refactoring | PATCH (0.0.x) | `refactor: simplify validation service` |
| `perf` | Performance improvement | PATCH (0.0.x) | `perf: optimize schema caching` |
| `test` | Test changes | No release | `test: add kagent bridge tests` |
| `chore` | Maintenance | PATCH* (0.0.x) | `chore(deps): update dependencies` |
| `ci` | CI/CD changes | No release | `ci: add semantic-release job` |
| `build` | Build system | No release | `build: update tsconfig` |
| `style` | Code style | No release | `style: format with prettier` |

\* Only triggers release with specific scopes (e.g., `docs(README)`, `chore(deps)`)

### Breaking Changes

**MAJOR version bump (x.0.0)**

Add `BREAKING CHANGE:` in commit body or footer:

```
feat: redesign agent schema structure

BREAKING CHANGE: Renamed `spec` to `agent` in manifest structure.
Migration guide available at docs/migration-v1.md
```

### Examples

```
feat(agent): add MCP bridge support

Implements MCP protocol bridge for agent communication.
Supports both HTTP and WebSocket transports.

Refs: #123

fix(validation): resolve schema validation error

Fixes issue where optional fields were incorrectly required.

Closes: #456

docs(readme): update installation instructions

Adds Node.js 20+ requirement and pnpm installation steps.
```

---

## MR Requirements

### Required Fields

1. **Issue Link**: MR must be linked to a GitLab Issue
2. **Milestone**: MR must have a version milestone (e.g., `v0.1.4`)
3. **Target Branch**: Feature branches → `release/v*.*.x`, Release branches → `main`
4. **Labels**: Appropriate labels (e.g., `type::feature`, `domain::agent`)

### MR Description Template

```markdown
## Description

Brief description of changes.

## Related Issue

Closes #123

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### Validation Rules

- CI pipeline must pass
- All discussions must be resolved
- Code owner approval required (if CODEOWNERS file exists)
- No merge conflicts
- Branch naming must follow policy
- Commit messages must follow convention

---

## Policy Enforcement

### CI/CD Validation

The following policies are enforced automatically in CI/CD:

1. **Branch Naming**: Validates branch name format
2. **Commit Messages**: Validates commit message format
3. **MR Target**: Ensures feature branches target release branches
4. **Issue Link**: Requires MR to be linked to an issue
5. **Milestone**: Requires MR to have a milestone

### Enforcement Rules

| Rule | Stage | Action |
|------|-------|--------|
| Invalid branch name | `.pre` | Block pipeline |
| Invalid commit message | `.pre` | Warn (non-blocking) |
| Missing issue link | `validate` | Block MR merge |
| Missing milestone | `validate` | Block MR merge |
| Wrong target branch | `validate` | Block MR merge |

### Manual Override

Policy violations can be overridden by:
- Maintainers (for emergency fixes)
- Security team (for security patches)
- Release managers (for release branches)

---

## Git Tags

### Tag Naming Convention

```
v{MAJOR}.{MINOR}.{PATCH}[-{PRERELEASE}]
```

### Tag Types

1. **Release Tags**: `v0.3.0`, `v1.0.0` (stable releases on `main`)
2. **Dev Tags**: `v0.3.0-dev.1`, `v0.3.0-dev.2` (pre-releases on `release/*`)
3. **RC Tags**: `v0.3.0-rc.1`, `v0.3.0-rc.2` (release candidates)

### Tag Creation

- **Automatic**: Created by semantic-release based on commits
- **Manual**: Only for emergency hotfixes (not recommended)

### Tag Usage

- **Release Tags**: Used for production deployments
- **Dev Tags**: Used for development/testing
- **RC Tags**: Used for release candidate testing

---

## Semantic Versioning Flow

### Version Format

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
```

### Version Bumps

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Breaking change | MAJOR (x.0.0) | `0.3.0` → `1.0.0` |
| New feature | MINOR (0.x.0) | `0.3.0` → `0.4.0` |
| Bug fix | PATCH (0.0.x) | `0.3.0` → `0.3.1` |

### Minor Version (0.X.0)

Minor versions indicate:
- New features (backward compatible)
- Significant improvements
- New capabilities

### Patch Version (0.0.X)

Patch versions indicate:
- Bug fixes
- Security patches
- Documentation updates
- Performance improvements

### Flow Diagram

```
feature/* → release/v0.3.x → main
   ↓            ↓              ↓
  dev tag    dev tag      release tag
```

---

## Related Documentation

- [Versioning Strategy](./versioning.md)
- [Branch Protection](../.gitlab/BRANCH_PROTECTION.md)
- [Automation Quick Reference](../.gitlab/AUTOMATION-QUICKREF.md)

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
