# OSSA Release Agent

## Purpose

Manages OSSA project releases using semantic-release. Handles versioning, changelog generation, and publishing to npm and GitLab.

## Capabilities

- **Commit Analysis** - Analyzes git commits to determine version bump type
- **Changelog Generation** - Generates CHANGELOG.md from commit history
- **Release Creation** - Creates GitLab releases with changelog and assets
- **NPM Publishing** - Publishes package to npm registry
- **GitHub Mirroring** - Syncs release to GitHub mirror repository

## Usage

### In GitLab CI

```yaml
release:main:
  script:
    - ossa run .gitlab/agents/release-agent/agent.ossa.yaml
```

### Standalone

```bash
ossa run .gitlab/agents/release-agent/agent.ossa.yaml --tool analyze_commits
```

## Tools

- `analyze_commits` - Analyzes commits to determine version bump
- `generate_changelog` - Generates CHANGELOG.md
- `create_release` - Creates GitLab release
- `publish_npm` - Publishes to npm
- `sync_github` - Syncs to GitHub mirror

## Configuration

- **LLM**: OpenAI GPT-4 Turbo
- **State**: Session mode with Redis storage (7d retention)
- **Context Window**: 50 messages, 16000 tokens, sliding window strategy
- **Security**: OAuth2 scopes for GitLab, npm, GitHub access

## Related

- [Release Process](../../../.gitlab/AUTOMATED-RELEASE-WORKFLOW.md)
- [Semantic Release Config](../../../release.config.js)

