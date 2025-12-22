# Automated GitLab Releases with Milestone Integration

This directory contains the automated release system for OpenStandardAgents with milestone-gated releases and automated changelog generation.

## Overview

The release automation system provides:

1. **Milestone-Gated Releases** - Releases only happen when milestones are 100% complete and closed
2. **Automated Changelog Generation** - Auto-generates changelogs from closed milestone issues
3. **GitLab Release Integration** - Creates GitLab releases with milestone linkage
4. **Comprehensive Release Notes** - Includes categorized changes, statistics, and contributor lists

## How It Works

### 1. Milestone Detection (`detect:milestone-and-tags` job)

Runs on every push to `main` or `development` branches and:
- Scans for closed milestones with version numbers (e.g., "v0.3.0", "Release v1.0.0")
- Checks if milestone is 100% complete (all issues closed)
- Verifies version hasn't already been released
- Exports milestone metadata to environment variables

**Environment Variables Set:**
- `RELEASE_VERSION` - Version number extracted from milestone title
- `MILESTONE_TITLE` - Full milestone title
- `MILESTONE_ID` - GitLab milestone ID
- `MILESTONE_READY` - Boolean indicating if milestone is release-ready
- `MILESTONE_URL` - Direct link to milestone

### 2. Changelog Generation (`release:changelog` job)

When a release-ready milestone is detected:
- Fetches all closed issues from the milestone
- Categorizes issues by type (features, fixes, security, performance, etc.)
- Generates formatted changelog with:
  - Categorized changes with emojis
  - Issue links
  - Statistics (total issues, contributors, dates)
  - Contributor list
  - Links to milestone, npm package, documentation
- Creates both `RELEASE_NOTES.md` and version-specific `spec/v{VERSION}/CHANGELOG.md`

**Issue Categorization:**
Issues are categorized based on labels and title prefixes:
- 💥 **Breaking Changes** - `breaking` label
- 🔒 **Security** - `security` label or `security:` prefix
- ✨ **Features** - `feature`, `enhancement` labels or `feat:` prefix
- 🐛 **Bug Fixes** - `bug`, `fix` labels or `fix:` prefix
- ⚡ **Performance** - `performance` label or `perf:` prefix
- 📚 **Documentation** - `documentation`, `docs` labels or `docs:` prefix
- ⚠️ **Deprecations** - `deprecation` label
- 🔧 **Other Changes** - Everything else

### 3. Release Creation (`release:npm` job)

Final release job that:
- Validates release gates (ENABLE_RELEASE + MILESTONE_READY)
- Updates package.json version
- Syncs documentation
- Runs final tests
- Publishes to npm
- Creates git tag with comprehensive release notes
- Creates GitLab Release with:
  - Generated changelog as description
  - Milestone linkage
  - Asset links (npm, schema, docs, milestone)

## Usage

### Setting Up a Release

1. **Create a Milestone**
   ```bash
   # Via GitLab UI or CLI
   glab milestone create "v0.3.0" --description "Next release milestone"
   ```

2. **Link Issues to Milestone**
   - When creating issues, assign them to the milestone
   - Or update existing issues: `glab issue update <iid> --milestone "v0.3.0"`

3. **Work Through Issues**
   - Close issues as they are completed
   - Pipeline will track milestone progress

4. **Close Milestone**
   ```bash
   # When all issues are closed
   glab milestone close "v0.3.0"
   ```

5. **Enable Release**
   - Set CI/CD variable: `ENABLE_RELEASE=true`
   - Or push to main branch (if variable already set)

6. **Automatic Release**
   - Pipeline detects closed, complete milestone
   - Generates changelog from issues
   - Creates release automatically

### Manual Release Trigger

If you need to manually trigger a release:

```bash
# Via GitLab UI
# 1. Go to CI/CD → Pipelines
# 2. Run pipeline on main branch
# 3. Manually trigger release:changelog job
# 4. Manually trigger release:npm job
```

## Scripts

### `generate-changelog.ts`

Generates changelog from milestone issues.

**Environment Variables:**
- `MILESTONE_ID` - GitLab milestone ID (required)
- `RELEASE_VERSION` - Version number (required)
- `CHANGELOG_OUTPUT` - Output file path (default: `RELEASE_NOTES.md`)
- `CI_PROJECT_ID` - GitLab project ID
- `GITLAB_PUSH_TOKEN` or `CI_JOB_TOKEN` - GitLab API token

**Outputs:**
- `RELEASE_NOTES.md` - Generated changelog
- `spec/v{VERSION}/CHANGELOG.md` - Version-specific changelog
- `changelog.env` - Environment variables for CI

**Usage:**
```bash
MILESTONE_ID=123 \
RELEASE_VERSION=0.3.0 \
GITLAB_PUSH_TOKEN=$GITLAB_TOKEN \
tsx .gitlab/release-automation/scripts/generate-changelog.ts
```

### `release-buttons.ts`

Manual release action handlers (npm, github, website, announce).

**Actions:**
- `npm` - Publish to npm registry
- `github` - Create GitHub release
- `website` - Deploy website
- `announce` - Create announcement issue

**Usage:**
```bash
RELEASE_ACTION=npm tsx .gitlab/release-automation/scripts/release-buttons.ts
```

### `increment-dev-tag.ts`

Auto-increments development tags on merge to development branch.

**Creates tags like:** `v0.3.0-dev-1`, `v0.3.0-dev-2`, etc.

## GitLab CI Jobs

### Core Release Pipeline

```
detect:milestone-and-tags (version-detect)
  ↓
release:changelog (release) - Generates changelog from issues
  ↓
release:validate (release) - Pre-release validation
  ↓
release:npm (release) - Publishes npm + creates GitLab release
  ↓
mirror:github (mirror) - Syncs to GitHub
```

### Release Gates

**Two required conditions:**
1. `ENABLE_RELEASE=true` (CI/CD variable)
2. `MILESTONE_READY=true` (milestone closed + 100% complete)

### Job Triggers

**Automatic:**
- `main` branch push with closed milestone and `ENABLE_RELEASE=true`

**Manual:**
- All release jobs can be manually triggered on `main` branch

## Configuration

### Required CI/CD Variables

Set in GitLab → Settings → CI/CD → Variables:

| Variable | Required | Protected | Description |
|----------|----------|-----------|-------------|
| `ENABLE_RELEASE` | Yes | Yes | Set to `true` to enable automatic releases |
| `GITLAB_PUSH_TOKEN` | Yes | Yes | GitLab token with `api` and `write_repository` scopes |
| `NPM_TOKEN` | Optional | Yes | npm publish token (falls back to GitLab registry) |
| `GITHUB_MIRROR_TOKEN` | Optional | Yes | GitHub token for mirror sync |

### Milestone Naming Convention

Milestones must include a valid semantic version:
- ✅ `v0.3.0`
- ✅ `Release v1.0.0`
- ✅ `v0.3.0-RC1`
- ❌ `Next Release` (no version)
- ❌ `Milestone 3` (no version)

## Example Changelog Output

```markdown
# Changelog - v0.3.0

**Release Date:** 2025-01-15

**Milestone:** [v0.3.0](https://gitlab.com/blueflyio/openstandardagents/-/milestones/5)

## Overview

This release adds automated release management with milestone integration.

## What's Changed

### ✨ Features

- Automated changelog generation from milestone issues ([#74](https://gitlab.com/blueflyio/openstandardagents/-/issues/74))
- Milestone-gated release workflow ([#75](https://gitlab.com/blueflyio/openstandardagents/-/issues/75))

### 🐛 Bug Fixes

- Fix version detection in CI pipeline ([#76](https://gitlab.com/blueflyio/openstandardagents/-/issues/76))

### 📚 Documentation

- Add release automation documentation ([#77](https://gitlab.com/blueflyio/openstandardagents/-/issues/77))

## Statistics

- **Total Issues Closed:** 4
- **Contributors:** 2
- **Planned Release Date:** 2025-01-15
- **Actual Release Date:** 2025-01-15

## Contributors

Thanks to all contributors who made this release possible:

- @contributor1
- @contributor2

## Links

- [Milestone](https://gitlab.com/blueflyio/openstandardagents/-/milestones/5)
- [Full Changelog](https://gitlab.com/blueflyio/openstandardagents/-/compare/v0.2.8...v0.3.0)
- [npm Package](https://www.npmjs.com/package/@bluefly/openstandardagents/v/0.3.0)
- [Documentation](https://openstandardagents.org/)
```

## Troubleshooting

### Release Not Triggering

**Check:**
1. Is `ENABLE_RELEASE=true` set in CI/CD variables?
2. Is milestone closed?
3. Are all milestone issues closed?
4. Does milestone title contain a valid version?
5. Has this version already been released?

**Debug:**
```bash
# Check milestone detection output
glab ci view # Look for detect:milestone-and-tags job logs
```

### Changelog Generation Fails

**Common Causes:**
- `GITLAB_PUSH_TOKEN` not set or lacks permissions
- Milestone ID not found
- API rate limiting

**Fix:**
```bash
# Test locally
export MILESTONE_ID=123
export RELEASE_VERSION=0.3.0
export GITLAB_PUSH_TOKEN=$YOUR_TOKEN
tsx .gitlab/release-automation/scripts/generate-changelog.ts
```

### npm Publish Fails

**Common Causes:**
- `NPM_TOKEN` not set or invalid
- Version already exists on npm
- Package name conflict

**Fix:**
```bash
# Test publish locally
npm publish --dry-run
```

## Development

### Testing Changelog Script Locally

```bash
cd .gitlab/release-automation

# Install dependencies
npm install @gitbeaker/rest

# Set environment
export MILESTONE_ID=<milestone-id>
export RELEASE_VERSION=<version>
export GITLAB_PUSH_TOKEN=<your-token>
export CI_PROJECT_ID=<project-id>

# Run script
tsx scripts/generate-changelog.ts

# Check output
cat RELEASE_NOTES.md
```

### Adding New Release Actions

1. Add handler to `scripts/release-buttons.ts`
2. Add job to `.gitlab-ci.yml` release stage
3. Set `RELEASE_ACTION` environment variable
4. Update documentation

## References

- [GitLab Release API](https://docs.gitlab.com/ee/api/releases/)
- [GitLab Milestones API](https://docs.gitlab.com/ee/api/milestones.html)
- [GitLab Issues API](https://docs.gitlab.com/ee/api/issues.html)
- [GitBeaker Documentation](https://github.com/jdalrymple/gitbeaker)

## License

Apache-2.0 - See LICENSE file for details
