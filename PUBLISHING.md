# Publishing Guide - @bluefly/openstandardagents

This document describes how to publish `@bluefly/openstandardagents` to the public npm registry.

## 📋 Pre-Publication Checklist

Before publishing, ensure all of the following are complete:

### 1. Code Quality

- [ ] All TypeScript builds without errors: `npm run build:clean`
- [ ] All tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Pre-publish validation passes: `npm run validate:package`

### 2. Package Metadata

- [ ] `package.json` version is correct (follows semver)
- [ ] `CHANGELOG.md` is updated with release notes
- [ ] `README.md` is up-to-date
- [ ] License is correct (Apache-2.0)
- [ ] Repository URL is correct
- [ ] Keywords are accurate

### 3. Dependencies

- [ ] All dependencies are declared properly
- [ ] No dev dependencies are in dependencies
- [ ] All imported packages are listed: `npm run validate:deps`

### 4. Documentation

- [ ] README includes installation instructions
- [ ] README includes usage examples
- [ ] API documentation is current
- [ ] CLI help is accurate

### 5. Files & Build

- [ ] `dist/` directory exists and is complete
- [ ] All `bin/` CLI executables work
- [ ] Schema files are in `spec/` directory
- [ ] Examples are in `examples/` directory
- [ ] `.npmignore` excludes dev files

## 🔨 Build Process

The package uses a standard TypeScript build pipeline:

```bash
# Clean build (removes old artifacts)
npm run clean

# Build TypeScript + copy assets
npm run build

# Or do both at once
npm run build:clean
```

**What gets built:**
- TypeScript compiled to `dist/` (CommonJS/ESM dual mode)
- JSON schemas copied to `dist/spec/`
- `package.json` copied to `dist/`

## 📦 Publishing Workflow

### Step 1: Pre-Publish Validation

Run the comprehensive validation script:

```bash
npm run prepublishOnly
```

This runs `tools/validate-package.ts` which:
- ✅ Validates critical files are included
- ✅ Checks all required exports exist
- ✅ Validates dependencies are declared
- ✅ Builds the package
- ✅ Creates a tarball and tests global installation
- ✅ Tests CLI commands work

**If validation fails, DO NOT proceed with publishing.**

### Step 2: Version Bump

Use semantic versioning to determine the new version:

- **Patch** (0.4.5 → 0.4.6): Bug fixes, backward-compatible
- **Minor** (0.4.5 → 0.5.0): New features, backward-compatible
- **Major** (0.4.5 → 1.0.0): Breaking changes

```bash
# Bump version (automatically updates package.json and creates git tag)
npm version patch    # For bug fixes
npm version minor    # For new features
npm version major    # For breaking changes
```

This will:
1. Update `package.json` version
2. Update `package-lock.json`
3. Create a git commit
4. Create a git tag

### Step 3: Update Changelog

Edit `CHANGELOG.md` and add release notes for the new version:

```markdown
## [0.4.6] - 2026-02-10

### Added
- New feature X
- New feature Y

### Fixed
- Bug fix A
- Bug fix B

### Changed
- Improvement C
```

Commit the changelog:

```bash
git add CHANGELOG.md
git commit -m "docs: update changelog for v0.4.6"
```

### Step 4: Push to Git

Push the version bump commit and tag:

```bash
git push origin <branch-name>
git push origin v0.4.6   # Push the tag
```

### Step 5: Publish to npm

**CRITICAL: Only do this when you're ready to make the package publicly available.**

```bash
# Dry run (see what would be published)
npm publish --dry-run

# Actually publish
npm publish
```

The `prepublishOnly` hook will run automatically and validate the package before publishing.

### Step 6: Verify Publication

After publishing, verify the package is live:

```bash
# Check npm registry
npm view @bluefly/openstandardagents

# Install from npm (in a test directory)
npm install -g @bluefly/openstandardagents

# Test CLI
ossa --version
ossa --help

# Cleanup
npm uninstall -g @bluefly/openstandardagents
```

## 🚨 Known Build Issues (Must Fix Before Publishing)

The following TypeScript errors must be resolved before publishing:

### 1. agents-md.command.ts - Method Calls

**File:** `src/cli/commands/agents-md.command.ts`

**Issue:** Code is calling methods that don't exist on service classes (leftover from refactor).

**Fix:** Ensure correct service is imported and used. `AgentsMdService` has different methods than `RepoAgentsMdService`.

**Lines affected:** 69, 75, 126, 136, 200

### 2. gitlab.extension.ts - Module Import

**File:** `src/cli/extensions/gitlab.extension.ts`

**Issue:** Cannot find module `./gitlab-release.commands.js`

**Fix:** Verify the module exists and is properly exported. May be a build artifact issue.

**Line affected:** 58

## 🔒 npm Authentication

To publish, you need npm credentials:

```bash
# Login to npm (one-time setup)
npm login

# Verify authentication
npm whoami

# Or use automation token
npm run verify:npm-auth
```

## 📊 Package Contents

The published package includes:

✅ **Included** (via `package.json` files array):
- `dist/` - Compiled TypeScript code
- `spec/` - OSSA schema files (v0.3.x, v0.4.x)
- `bin/` - CLI entry points (ossa, ossa-dev, ossa-version, etc.)
- `examples/` - Reference examples
- `openapi/` - OpenAPI specifications
- `schemas/` - JSON schemas
- `templates/` - Agent templates
- `.version.json` - Version metadata
- `README.md` - Package documentation
- `LICENSE` - Apache 2.0 license
- `CHANGELOG.md` - Release history

❌ **Excluded** (via `.npmignore`):
- `src/` - TypeScript source (only `dist/` is published)
- `tests/` - Test files
- `docs/` - Documentation source
- `tools/` - Build scripts
- `.git/`, `.github/`, `.gitlab/` - Version control
- CI/CD configs (`.gitlab-ci.yml`, etc.)
- Development configs (tsconfig, eslint, prettier)

## 🎯 Publishing Checklist Summary

1. Fix build errors (see Known Build Issues above)
2. Run `npm run build:clean`
3. Run `npm run prepublishOnly` (validates everything)
4. Bump version: `npm version patch|minor|major`
5. Update `CHANGELOG.md`
6. Push commits and tags
7. Authenticate with npm: `npm login`
8. Publish: `npm publish`
9. Verify: `npm view @bluefly/openstandardagents`

## 🆘 Troubleshooting

### "prepublishOnly script failed"

The validation script found issues. Check the output and fix:
- Missing files
- Build errors
- Import errors
- CLI command failures

### "ENOENT: no such file or directory, stat 'dist/'"

Run `npm run build` first. The `dist/` directory must exist.

### "403 Forbidden - You do not have permission to publish"

- Check npm login: `npm whoami`
- Verify you're a maintainer of `@bluefly/openstandardagents`
- Check if version already exists: `npm view @bluefly/openstandardagents versions`

### "Package name too similar to existing package"

If this is your first publish, ensure:
- Package name is not taken: `npm view @bluefly/openstandardagents`
- You're logged into the correct npm account
- The `@bluefly` scope exists and you have access

## 📚 Additional Resources

- [npm Publishing Guide](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [Semantic Versioning](https://semver.org/)
- [package.json Documentation](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)

## 🔗 Related Scripts

```bash
# Validation
npm run validate:package    # Comprehensive package validation
npm run validate:deps       # Check dependency declarations
npm run prepublishOnly      # Auto-runs before publish

# Build
npm run build:clean         # Clean + build
npm run build               # Build only
npm run clean               # Remove dist/

# Quality
npm run quality             # Typecheck + lint + format check
npm run test                # Run all tests
npm run test:ci             # CI test suite

# Release automation
npm run release:check       # Check if ready for release
npm run release:verify      # Verify release integrity
```

---

**Last Updated:** 2026-02-10
**Package Version:** 0.4.5
**Status:** ⚠️ Not ready for publication (build errors exist)
