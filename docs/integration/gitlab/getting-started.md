# GitLab Integration - Getting Started

This guide will help you integrate OSSA agents with GitLab CI/CD.

## Prerequisites

- GitLab account with API access
- GitLab Personal Access Token with `api`, `read_repository`, `write_repository` scopes
- OSSA CLI installed (`npm install -g @bluefly/openstandardagents`)

## Quick Start

### 1. Scaffold a GitLab Agent

```bash
ossa scaffold my-gitlab-agent --platform gitlab
```

This creates a pre-configured agent manifest with GitLab CI/CD settings.

### 2. Configure GitLab API Access

Set your GitLab token:

```bash
export GITLAB_TOKEN=your-token-here
```

Or add to your agent manifest:

```yaml
apiVersion: ossa.io/v1
kind: Agent
metadata:
  name: my-gitlab-agent
spec:
  integrations:
    gitlab:
      enabled: true
      api_version: v4
      token: ${GITLAB_TOKEN}
      scopes:
        - api
        - read_repository
        - write_repository
```

### 3. Create GitLab CI Job

Add to your `.gitlab-ci.yml`:

```yaml
ossa-agent:
  image: node:20
  script:
    - npm install -g @bluefly/openstandardagents
    - ossa run my-gitlab-agent
  only:
    - merge_requests
```

### 4. Deploy Agent

```bash
ossa deploy my-gitlab-agent --platform gitlab
```

## Next Steps

- [CI/CD Integration](./ci-cd-integration.md) - Integrate with GitLab pipelines
- [Webhook Integration](./webhook-integration.md) - Handle GitLab webhooks
- [API Integration](./api-integration.md) - Use GitLab API
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
