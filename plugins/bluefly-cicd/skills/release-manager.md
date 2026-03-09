---
name: release
description: "**Release Manager Agent**: Orchestrates complete release workflows including milestone detection, branch management, SBOM generation (CycloneDX), changelog creation (conventional commits), semantic version bumping, GitLab release creation with assets, and post-release milestone closure. Full release automation. - MANDATORY TRIGGERS: release, version, tag, milestone, changelog, SBOM, publish, create release, bump version, generate changelog, semantic versioning, cut a release, ship it, new version, release notes"
license: "Apache-2.0"
compatibility: "Requires git, glab CLI, GitLab API access. Environment: GITLAB_TOKEN, GITLAB_HOST"
allowed-tools: "Bash(git:*) Bash(glab:*) Read Edit WebFetch Task mcp__gitlab__*"
metadata:
  ossa_manifest: ~/Sites/LLM/platform-agents/packages/@ossa/release-manager/agent.ossa.yaml
  service_account: release-manager
  service_account_id: pending
  domain: gitlab
  tier: orchestrator
  autonomy: fully_autonomous
  ossa_version: v0.3.2
  npm_package: "@bluefly/openstandardagents"
---

# Release Manager Agent Skill

**OSSA Agent**: `release-manager` | **Version**: 1.0.0 | **Namespace**: blueflyio

This skill invokes the **release-manager** OSSA agent for complete release orchestration including milestone management, SBOM generation, changelog creation, and GitLab release publication.

## Quick Start

```bash
# Install OSSA SDK
npm i @bluefly/openstandardagents

# Authenticate with GitLab
export GITLAB_TOKEN=$(cat ~/.tokens/gitlab)
export GITLAB_HOST=gitlab.com
```

## Agent Capabilities (from OSSA Manifest)

### Release Orchestration
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `release-orchestration` | action | fully_autonomous | Orchestrate complete release workflows |
| `milestone-detection` | reasoning | fully_autonomous | Detect ready milestones for release |
| `branch-management` | action | fully_autonomous | Create and manage release branches |

### Generation Capabilities
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `sbom-generation` | action | fully_autonomous | Generate CycloneDX SBOM |
| `changelog-generation` | action | fully_autonomous | Generate conventional commit changelog |
| `release_note_creation` | action | fully_autonomous | Create release notes |

### Version Management
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `version_calculation` | reasoning | fully_autonomous | Calculate next version number |
| `version-bumping` | action | fully_autonomous | Bump version in package files |
| `tag_management` | action | fully_autonomous | Create and manage git tags |
| `gitlab-release-creation` | action | fully_autonomous | Create GitLab release with assets |

### Analysis
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `milestone_tracking` | reasoning | fully_autonomous | Track milestone progress |
| `dependency_analysis` | reasoning | fully_autonomous | Analyze dependencies |
| `breaking_change_detection` | reasoning | fully_autonomous | Detect breaking changes |

## Complete Release Workflow (11 Steps)

```yaml
workflow:
  steps:
    - name: detect-ready-milestones
      action: gitlab.milestones.list
      filter:
        state: active
        issues_closed_percent: 100

    - name: create-release-branch
      action: git.branch.create
      pattern: "release/v{major}.{minor}.x"

    - name: collect-milestone-issues
      action: gitlab.issues.list
      filter:
        milestone: "{milestone}"

    - name: cherry-pick-commits
      action: git.cherry-pick
      from: development

    - name: generate-sbom
      action: sbom.generate
      format: cyclonedx-json
      output: sbom.json

    - name: generate-changelog
      action: changelog.generate
      format: conventional-commits
      output: CHANGELOG.md

    - name: update-version-files
      action: version.bump
      files:
        - package.json
        - composer.json
        - *.info.yml

    - name: create-release-mr
      action: gitlab.mr.create
      title: "Release v{version}"
      target: main

    - name: wait-for-pipeline
      action: gitlab.pipeline.wait
      timeout: 30m

    - name: merge-to-main
      action: gitlab.mr.merge
      when: pipeline.success

    - name: create-gitlab-release
      action: gitlab.release.create
      assets:
        - sbom.json
        - CHANGELOG.md

    - name: close-milestone
      action: gitlab.milestones.close
```

## Semantic Versioning

```yaml
version_calculation:
  major:
    triggers:
      - "BREAKING CHANGE:"
      - "feat!:"
      - Removed public APIs

  minor:
    triggers:
      - "feat:"
      - "feature:"
      - New capabilities

  patch:
    triggers:
      - "fix:"
      - "bugfix:"
      - "perf:"
      - "docs:"
```

## SBOM Generation (CycloneDX)

```bash
# Generate SBOM from package.json
npx @cyclonedx/cyclonedx-npm --output-format json --output-file sbom.json

# Or for PHP projects
composer require --dev cyclonedx/cyclonedx-php-composer
composer make-bom --output-format=json --output-file=sbom.json
```

Output format:
```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.4",
  "components": [...],
  "dependencies": [...]
}
```

## Changelog Generation

Following [Conventional Commits](https://conventionalcommits.org):

```markdown
# Changelog

## [1.2.0] - 2025-01-15

### Added
- feat: Add new authentication flow
- feat: Support for OAuth 2.0

### Fixed
- fix: Resolve memory leak in cache
- fix: Correct timezone handling

### Changed
- refactor: Simplify database queries

### Breaking Changes
- BREAKING: Remove deprecated `oldMethod()`
```

## GitLab Release Assets

```bash
# Create release with assets
glab release create v1.2.0 \
  --title "Release v1.2.0" \
  --notes-file CHANGELOG.md \
  sbom.json#CycloneDX_SBOM \
  dist/app.zip#Application_Bundle
```

## Access Control (OSSA Spec)

```yaml
access:
  tier: tier_2_write_limited
  permissions:
    - read:code
    - read:repository
    - read:merge_requests
    - write:merge_requests
    - read:tags
    - write:tags
    - read:releases
    - write:releases
    - read:milestones
    - write:milestones
    - read:api
  prohibited:
    - delete:production
    - write:protected_branches
    - delete:tags
```

## Triggers

```yaml
triggers:
  - type: webhook
    event: milestone.update
    filter:
      issues_closed_percent: 100

  - type: schedule
    cron: "0 9 * * 1"
    description: "Check ready milestones every Monday 9am"
```

## Observability Metrics

```yaml
custom_metrics:
  - name: releases_created
    type: counter
    description: "Number of releases created"
  - name: milestones_closed
    type: counter
    description: "Number of milestones closed"
```

## Integration with Claude Code

This skill is triggered by phrases like:
- "Create a new release"
- "Bump version to 2.0.0"
- "Generate changelog for milestone v1.3"
- "Ship the release"
- "Generate SBOM for this project"

## Examples

### Full Release
```
User: Create release for milestone v1.3.0
Agent: Checking milestone status... 100% issues closed
       Generating SBOM... Done
       Generating changelog... Done
       Creating release branch... Done
       Creating MR... Done
       [Waits for pipeline]
       Publishing release... v1.3.0 released!
```

### Quick Version Bump
```
User: Bump to patch version
Agent: Current version: 1.2.3
       Bumping to: 1.2.4
       Updated: package.json, composer.json
```

### Generate Changelog Only
```
User: Generate changelog from last tag
Agent: Last tag: v1.2.0
       Commits since: 15
       [Generates CHANGELOG.md]
```

## Service Account

- **Account**: release-manager
- **Group**: blueflyio
- **Permissions**: Maintainer (write releases, tags)

## Related Agents

- `ci-fixer-worker` - Ensure pipeline passes before release
- `wiki-aggregator` - Sync release notes to wiki
- `security-scanner` - Pre-release security audit

## References

- [OSSA v0.3.2 Specification](https://gitlab.com/blueflyio/openstandardagents)
- [GitLab Releases API](https://docs.gitlab.com/ee/api/releases/)
- [Conventional Commits](https://conventionalcommits.org)
- [CycloneDX SBOM](https://cyclonedx.org)
