# OSSA Release Process

**Version Control System**: Milestone-Gated Semantic Release
**Last Updated**: 2025-11-21
**Current Version**: 0.2.5-RC

---

## Overview

OSSA uses a **milestone-gated semantic release workflow** that combines:
- **Semantic versioning** (automatic version bumps from commit messages)
- **Milestone tracking** (gates production releases)
- **Multi-channel publishing** (dev tags for testing, latest for production)

### Key Principles

1. **Commits drive version bumps** - Not manual version changes
2. **Milestones gate releases** - Must be 100% complete before production
3. **Dev tags for testing** - Pre-release versions on npm with `dev` tag
4. **Version sync automation** - All references updated automatically
5. **No manual npm publish** - CI handles all publishing

---

## Workflow

```
┌─────────────────┐
│ Feature Branch  │
│                 │
│ feat: add X     │
│ fix: bug Y      │
└────────┬────────┘
         │
         │ Create MR → CI validates
         │
         ▼
┌─────────────────┐
│  development    │  ← semantic-release creates: v0.2.5-RC-dev.1, v0.2.5-RC-dev.2, etc.
│                 │  ← Publishes to npm with --tag dev
└────────┬────────┘
         │
         │ Milestone 100% complete?
         │
         ▼
┌─────────────────┐
│      main       │  ← semantic-release creates: v0.2.5-RC
│                 │  ← Publishes to npm with --tag latest
└─────────────────┘
```

---

## Commit Message Format

OSSA follows **Conventional Commits** to automatically determine version bumps:

### Version Bump Rules

| Commit Type | Example | Version Bump |
|-------------|---------|--------------|
| `feat:` | `feat: add new protocol` | **MINOR** (0.2.4 → 0.2.5) |
| `fix:` | `fix: resolve validation bug` | **PATCH** (0.2.4 → 0.2.4.1) |
| `BREAKING CHANGE:` | `feat!: redesign API` | **MAJOR** (0.2.4 → 0.3.0) |
| `docs:`, `chore:`, etc. | `docs: update README` | No version bump |

### Examples

```bash
# Minor version bump (new feature)
git commit -m "feat: add multi-agent composition support"

# Patch version bump (bug fix)
git commit -m "fix: resolve schema validation error"

# Major version bump (breaking change)
git commit -m "feat!: redesign agent manifest structure

BREAKING CHANGE: Agent manifest v0.2.x is not compatible with v0.3.0"

# No version bump (documentation)
git commit -m "docs: update release process documentation"
```

---

## Release Process

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/add-new-protocol development

# Make changes, commit with conventional commits
git add .
git commit -m "feat: add gRPC protocol support"

# Push and create MR
git push origin feature/add-new-protocol
```

**CI Actions**:
- Runs tests, lint, build
- Validates version consistency
- Previews predicted version bump
- Shows semantic-release analysis

### 2. Merge to Development (Automatic)

When MR is approved and merged to `development`:

**CI Actions**:
- Creates pre-release tag: `v0.2.5-RC-dev.1`
- Publishes to npm: `npm install @bluefly/openstandardagents@dev`
- Shows "Promote to main" button

**Test the pre-release**:
```bash
# Install dev version
npm install @bluefly/openstandardagents@dev

# Or specific dev version
npm install @bluefly/openstandardagents@0.2.5-dev.1
```

### 3. Create/Update Milestone

Before promoting to main, ensure milestone exists and is properly configured:

**Milestone Requirements**:
- Title **must** include version: `v0.2.5-RC - Feature Name` or `0.2.5 - Feature Name`
- All issues must be closed (100% complete)
- Proper dates set (start and due date)

**GitLab UI**:
1. Go to: https://gitlab.com/agentstudio/openstandardagents/-/milestones
2. Create or edit milestone
3. Ensure title includes version: `v0.2.5-RC - Multi-Agent Composition`
4. Close all issues in milestone
5. Close the milestone

**API** (if needed):
```bash
# Close milestone
curl -X PUT -H "PRIVATE-TOKEN: $TOKEN" \
  "https://gitlab.com/api/v4/projects/76265294/milestones/2" \
  -d "state_event=close"
```

### 4. Promote to Main (Manual Button)

**GitLab UI**:
1. Go to: https://gitlab.com/agentstudio/openstandardagents/-/pipelines
2. Find latest `development` pipeline
3. Click "Promote to main" button

**CI Actions**:
- Validates: no conflicts, fast-forward possible
- Previews next version
- Creates MR: `development` → `main` (or fast-forwards if possible)

### 5. Release to Production (Manual Button)

After merge to `main`:

**GitLab UI**:
1. Go to: https://gitlab.com/agentstudio/openstandardagents/-/pipelines
2. Find latest `main` pipeline
3. Click "Release" button

**CI Actions**:
- ✅ Validates milestone is closed
- ✅ Checks version doesn't already exist
- ✅ Runs version sync script
- ✅ Creates production tag: `v0.2.5-RC`
- ✅ Publishes to npm: `@bluefly/openstandardagents@latest`
- ✅ Updates CHANGELOG.md
- ✅ Creates GitLab release
- ✅ Mirrors to GitHub

---

## Version Sync Script

The version sync script ensures all references match `package.json`:

### Automatic Updates

When version changes, the script updates:
- ✅ `README.md` - Schema links, badges, examples
- ✅ `spec/vX.Y.Z/` - Creates new spec directory
- ✅ `package.json` - Exports field (schema path)
- ✅ `spec/openapi/*.yaml` - Version fields
- ✅ `website/docs/**/*.md` - Documentation references
- ✅ `CHANGELOG.md` - Unreleased → versioned section

### Manual Usage

```bash
# Check version consistency (CI mode)
npx tsx scripts/sync-versions.ts --check

# Fix all version references
npx tsx scripts/sync-versions.ts --fix
```

### CI Integration

Version sync runs automatically:
- ✅ On all merge requests
- ✅ On commits to `development` or `main`
- ✅ When `package.json`, `README.md`, or `spec/**` changes

**Failure blocks merge** if versions are inconsistent.

---

## Documentation-Only Updates

Changes to documentation don't trigger version bumps:

```bash
# Documentation commits (no version bump)
git commit -m "docs: update installation guide"
git commit -m "docs: fix typos in README"
git commit -m "chore: update website content"
```

**Paths that don't trigger releases**:
- `docs/**`
- `website/**`
- `README.md` (if only docs changes)
- `*.md` files (excluding CHANGELOG.md)

These can merge to `development` and `main` without creating releases.

---

## Troubleshooting

### Version Mismatch Error

```
❌ Version consistency check FAILED:
  • README.md has outdated version references
  • package.json exports["./schema"] should be ./spec/v0.2.5-RC/ossa-0.2.5.schema.json
```

**Fix**:
```bash
npx tsx scripts/sync-versions.ts --fix
git add .
git commit -m "chore: sync version references to v0.2.5-RC"
git push
```

### Milestone Not Found

```
❌ No completed milestone found with version in title
```

**Fix**:
1. Go to: https://gitlab.com/agentstudio/openstandardagents/-/milestones
2. Create milestone with version in title: `v0.2.5-RC - Feature Name`
3. Close all issues in milestone
4. Close the milestone
5. Retry release job

### Version Already Released

```
⚠️ Version v0.2.5-RC already released
```

**Options**:
1. Create new milestone for v0.2.6
2. Or delete existing tag and re-release (⚠️ dangerous):
   ```bash
   git tag -d v0.2.5-RC
   git push origin :refs/tags/v0.2.5-RC
   ```

### Pre-release Published Accidentally

```
⚠️ v0.2.5-RC-dev was published but v0.2.5-RC doesn't exist
```

**Fix** (within 72 hours):
```bash
npm unpublish @bluefly/openstandardagents@0.2.5-dev
```

**After 72 hours**:
```bash
npm deprecate @bluefly/openstandardagents@0.2.5-dev "Published prematurely, use v0.2.5-RC instead"
```

---

## Emergency Procedures

### Rollback a Release

```bash
# 1. Unpublish from npm (within 72 hours)
npm unpublish @bluefly/openstandardagents@0.2.5

# 2. Delete git tag
git tag -d v0.2.5-RC
git push origin :refs/tags/v0.2.5-RC

# 3. Revert commits
git revert <commit-hash>
git push origin main
```

### Manual Release (Emergency Only)

⚠️ **Only use if CI is broken**

```bash
# 1. Checkout main branch
git checkout main

# 2. Run version sync
npx tsx scripts/sync-versions.ts --fix

# 3. Commit changes
git add .
git commit -m "chore: sync version references"

# 4. Create tag
git tag -a v0.2.5-RC -m "Release v0.2.5-RC"
git push origin v0.2.5-RC

# 5. Publish to npm
npm publish --tag latest

# 6. Create GitLab release
# https://gitlab.com/agentstudio/openstandardagents/-/releases/new
```

---

## Version History

### Package Name Changes

| Version | Package Name | Status |
|---------|-------------|---------|
| 0.1.0-0.1.9 | `@ossa/specification` | Deprecated |
| 0.2.0-0.2.2 | `@ossa/specification` | Deprecated |
| 0.2.3 | `@bluefly/open-standards-scalable-agents` | Unpublished |
| **0.2.4+** | **`@bluefly/openstandardagents`** | **Active** |

### Missing Versions

**Why are 0.2.0-0.2.3 missing under `@bluefly/openstandardagents`?**

These versions were published under previous package names. npm doesn't allow republishing the same version number under a different package name. The package rename happened at v0.2.4, making it the first version under the current name.

**Users on old package names should migrate**:
```bash
# Remove old packages
npm uninstall @ossa/specification
npm uninstall @bluefly/open-standards-scalable-agents

# Install current package
npm install @bluefly/openstandardagents
```

---

## Tools & Scripts

### Version Management
```bash
# Check version consistency
npx tsx scripts/sync-versions.ts --check

# Fix version references
npx tsx scripts/sync-versions.ts --fix
```

### GitLab API
```bash
# List milestones
curl -H "PRIVATE-TOKEN: $TOKEN" \
  "https://gitlab.com/api/v4/projects/76265294/milestones"

# Close milestone
curl -X PUT -H "PRIVATE-TOKEN: $TOKEN" \
  "https://gitlab.com/api/v4/projects/76265294/milestones/2" \
  -d "state_event=close"
```

### npm
```bash
# View all published versions
npm view @bluefly/openstandardagents versions

# Install specific version
npm install @bluefly/openstandardagents@0.2.5-RC

# Install dev version
npm install @bluefly/openstandardagents@dev

# Deprecate version
npm deprecate @bluefly/openstandardagents@0.2.5-dev "Message"

# Unpublish (within 72 hours)
npm unpublish @bluefly/openstandardagents@0.2.5-dev
```

---

## References

- **GitLab Project**: https://gitlab.com/agentstudio/openstandardagents
- **npm Package**: https://www.npmjs.com/package/@bluefly/openstandardagents
- **GitHub Mirror**: https://github.com/blueflyio/openstandardagents
- **Milestones**: https://gitlab.com/agentstudio/openstandardagents/-/milestones
- **Conventional Commits**: https://www.conventionalcommits.org/
- **Semantic Release**: https://semantic-release.gitbook.io/

---

**Questions? Issues?**
Create an issue: https://gitlab.com/agentstudio/openstandardagents/-/issues