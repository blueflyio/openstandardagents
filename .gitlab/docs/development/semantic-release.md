# Semantic Release Automation

OSSA uses [semantic-release](https://semantic-release.gitbook.io/) for automated versioning and npm publishing.

## How It Works

1. **Commit Analysis**: Analyzes commit messages following [Conventional Commits](https://www.conventionalcommits.org/)
2. **Version Bump**: Automatically determines version bump (major/minor/patch)
3. **Changelog**: Generates CHANGELOG.md
4. **Git Tag**: Creates git tag
5. **npm Publish**: Publishes to npm registry
6. **GitHub Release**: Creates GitHub release

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types and Version Bumps

| Type | Version Bump | Example |
|------|--------------|---------|
| `feat` | minor (0.2.5 → 0.3.0) | `feat: add new capability` |
| `fix` | patch (0.2.5 → 0.2.6) | `fix: resolve validation bug` |
| `perf` | patch | `perf: optimize schema loading` |
| `docs` | patch | `docs: update API reference` |
| `refactor` | patch | `refactor: simplify validator` |
| `BREAKING CHANGE` | major (0.2.5 → 1.0.0) | See below |

### Breaking Changes

```bash
feat: redesign agent manifest structure

BREAKING CHANGE: Agent manifest now requires `apiVersion` field
```

## Configuration

Located in `.releaserc.json`:

```json
{
  "branches": [
    "main",
    {
      "name": "development",
      "prerelease": "dev"
    }
  ],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git",
    "@semantic-release/gitlab"
  ]
}
```

## CI/CD Integration

### GitLab CI

```yaml
release:
  stage: release
  only:
    - main
    - development
  script:
    - npx semantic-release
  variables:
    NPM_TOKEN: $NPM_TOKEN
    GITLAB_TOKEN: $CI_JOB_TOKEN
```

### Required Environment Variables

```bash
# In GitLab → Settings → CI/CD → Variables
NPM_TOKEN=<npm-token>          # For npm publishing
GITLAB_TOKEN=<gitlab-token>    # For GitLab releases
```

## Manual Release

```bash
# Dry run (no changes)
npx semantic-release --dry-run

# Actual release
npx semantic-release
```

## Release Workflow

### Feature Release (minor)

```bash
git checkout -b feat/new-feature development
# Make changes
git commit -m "feat: add new feature"
git push origin feat/new-feature
# Create MR → merge to development
# semantic-release creates 0.3.0-dev.1
```

### Bug Fix (patch)

```bash
git checkout -b fix/bug-fix development
# Make changes
git commit -m "fix: resolve issue"
git push origin fix/bug-fix
# Create MR → merge to development
# semantic-release creates 0.2.6-dev.1
```

### Production Release

```bash
# Merge development → main
# semantic-release creates 0.3.0 (stable)
# Publishes to npm
# Creates GitHub release
```

## Version Strategy

### Development Branch
- Prerelease versions: `0.3.0-dev.1`, `0.3.0-dev.2`
- Not published to npm (or published with `@dev` tag)

### Main Branch
- Stable versions: `0.3.0`, `0.3.1`, `1.0.0`
- Published to npm with `@latest` tag

## Troubleshooting

### Release Not Triggered

**Check:**
1. Commit messages follow conventional format
2. CI/CD variables are set
3. Branch is configured in `.releaserc.json`

### npm Publish Failed

**Check:**
1. NPM_TOKEN is valid
2. Package name is available
3. Version doesn't already exist

### Wrong Version Bump

**Fix commit message:**
```bash
# Use correct type
feat: ...  # minor bump
fix: ...   # patch bump
```

## Best Practices

### Commit Messages

✅ **Good:**
```
feat(cli): add export command
fix(validator): handle null values
docs: update installation guide
```

❌ **Bad:**
```
added stuff
fixed bug
updates
```

### Squash Commits

When merging MRs, squash commits with proper message:
```
feat: add new feature (#123)

- Implemented feature X
- Added tests
- Updated docs
```

### Breaking Changes

Always document breaking changes:
```
feat!: redesign API

BREAKING CHANGE: API endpoints now use /v2/ prefix

Migration guide: ...
```

## References

- [Semantic Release Docs](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitLab CI/CD](https://docs.gitlab.com/ee/ci/)
