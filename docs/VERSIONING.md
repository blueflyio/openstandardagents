# OSSA Versioning Strategy

## Semantic Versioning with Semantic-Release

OSSA uses **semantic versioning** (semver 2.0.0) with **automated releases** via semantic-release.

### Version Format

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
```

Examples:
- `0.2.2` - Stable patch release
- `0.3.0` - Minor feature release
- `1.0.0` - Major release with breaking changes
- `0.3.0-dev.1` - Development pre-release
- `1.0.0-beta.2` - Beta pre-release

---

## Branching Strategy

### `development` Branch
- **Purpose**: Active development and testing
- **Releases**: Pre-release versions with `-dev` tag
- **Version bumps**: Automatic via semantic-release
- **Example versions**: `0.2.3-dev.0`, `0.2.3-dev.1`

### `main` Branch
- **Purpose**: Stable production releases
- **Releases**: Stable versions (no pre-release tag)
- **Version bumps**: Automatic via semantic-release
- **Example versions**: `0.2.3`, `0.3.0`, `1.0.0`

---

## Commit Message Convention

OSSA uses **Angular commit message format** for semantic-release:

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

---

## How Versions are Determined

### Automatic Version Calculation

Semantic-release analyzes commits since the last release:

```
Last release: v0.2.2
New commits:
  - fix: resolve validation error      → PATCH
  - feat: add KAgent bridge support    → MINOR (overrides PATCH)
  - docs: update README                 → No change

Next version: v0.3.0
```

### Development Pre-releases

On `development` branch:
```
Current: v0.2.2
Commits: feat, fix, docs
Result: v0.3.0-dev.0 (first dev release)
        v0.3.0-dev.1 (second dev release)
        ...
        v0.3.0 (when merged to main)
```

---

## Release Process

### Automated (Recommended)

1. **Commit with conventional format**:
   ```bash
   git commit -m "feat: add semantic-release automation"
   ```

2. **Push to branch**:
   ```bash
   git push origin development  # Creates v0.3.0-dev.0
   # OR
   git push origin main          # Creates v0.3.0
   ```

3. **Semantic-release automatically**:
   - Analyzes commits
   - Determines version bump
   - Updates `package.json`
   - Updates `CHANGELOG.md`
   - Creates git tag
   - Creates GitLab release
   - Publishes to GitLab Packages

### Manual Release (Not Recommended)

Only use for emergency hotfixes:

```bash
npm version patch  # or minor, major
git push --follow-tags
```

---

## Schema Versioning

OSSA schema versions follow specification versions:

```
Package Version  → Schema Directory
-----------------------------------------
v0.2.2          → spec/v0.2.2/
v0.3.0          → spec/v0.3.0/
v1.0.0          → spec/v1.0.0/
```

### Schema Compatibility

- **MAJOR**: Breaking schema changes (incompatible agents)
- **MINOR**: Backward-compatible additions (new optional fields)
- **PATCH**: Bug fixes, clarifications (no schema changes)

---

## Publishing Workflow

### Development Branch

```mermaid
graph LR
A[Commit to development] --> B[CI runs tests]
B --> C[semantic-release runs]
C --> D[Creates v0.3.0-dev.0]
D --> E[Publishes to GitLab Packages with 'development' tag]
```

### Main Branch

```mermaid
graph LR
A[Merge to main] --> B[CI runs tests]
B --> C[semantic-release runs]
C --> D[Creates v0.3.0]
D --> E[Publishes to GitLab Packages with 'latest' tag]
E --> F[Manual trigger to publish to npmjs.com]
```

---

## Version History

| Version | Release Date | Type | Highlights |
|---------|--------------|------|------------|
| 0.2.2 | 2025-10-28 | Patch | Schema fixes, CI improvements |
| 0.2.0 | 2025-10-27 | Minor | Added KAgent bridge, MCP tools |
| 0.1.9 | 2024-XX-XX | Minor | Extensions, taxonomy, observability |
| 0.1.8 | 2024-XX-XX | Minor | Initial stable release |

---

## Configuration Files

### `.releaserc.json`
Semantic-release configuration:
- Commit analysis rules
- Changelog generation
- GitLab release creation
- npm publishing settings

### `.gitlab-ci.yml`
CI/CD pipeline:
- `semantic-release:development` job
- `semantic-release:main` job
- `publish:gitlab-packages` job
- `publish:npmjs:manual` job

---

## FAQ

### Q: How do I create a pre-release?

**A**: Commit to `development` branch with conventional commits:
```bash
git checkout development
git commit -m "feat: experimental MCP bridge"
git push origin development
# Creates v0.3.0-dev.0
```

### Q: How do I create a stable release?

**A**: Merge `development` to `main`:
```bash
git checkout main
git merge development --no-ff
git push origin main
# Creates v0.3.0
```

### Q: How do I force a specific version?

**A**: Use commit message with `BREAKING CHANGE:` for major, or scope for minor:
```bash
# Force major version
git commit -m "feat: new schema format

BREAKING CHANGE: Incompatible with v0.x agents"

# Force minor version
git commit -m "feat: add new optional field"
```

### Q: Can I skip a release?

**A**: Yes, add `[skip ci]` to commit message:
```bash
git commit -m "chore: update docs [skip ci]"
```

### Q: How do I publish to npmjs.com?

**A**: Semantic-release creates the tag and GitLab release. Then manually trigger the `publish:npmjs:manual` job in GitLab CI.

---

## Best Practices

1. ✅ **Always use conventional commits** - Enables automation
2. ✅ **Write clear commit messages** - Appears in CHANGELOG
3. ✅ **One feature per commit** - Easier to track changes
4. ✅ **Test on development first** - Use pre-releases
5. ✅ **Review CHANGELOG** - Before merging to main
6. ❌ **Don't manually edit package.json version** - Let semantic-release handle it
7. ❌ **Don't create tags manually** - Semantic-release does this
8. ❌ **Don't skip tests** - CI must pass for release

---

## Support

- **Documentation**: [docs/](../docs/)
- **Issues**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/issues
- **Releases**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/releases

---

**Last Updated**: 2025-10-28
**Version**: 0.2.2
