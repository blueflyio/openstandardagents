---
title: "Environment Variables"
---

# Environment Variables

## Overview

Configuration via environment variables for OSSA agents and automation.

## CI/CD Variables

### CI_DEPLOY_OSSA
Controls OSSA agent deployment in CI/CD pipelines.

```yaml
variables:
  CI_DEPLOY_OSSA: "true"
```

**Values**:
- `true` - Enable OSSA deployment
- `false` - Disable OSSA deployment (default)

### GITLAB_TOKEN
GitLab API token for agent operations.

**Required Scopes**:
- `api` - API access
- `write_repository` - Repository write access
- `read_repository` - Repository read access

### ANTHROPIC_API_KEY
Anthropic Claude API key for LLM operations.

### OPENAI_API_KEY
OpenAI API key (fallback provider).

## Group-Level Variables

Variables defined at group level, inherited by all projects.

### Access
- Settings → CI/CD → Variables
- Group-level scope
- Inherited by projects
- Can be overridden at project level

### Examples
- `GITLAB_TOKEN` - Shared GitLab token
- `ANTHROPIC_API_KEY` - Shared Claude API key
- `DEPLOYMENT_TARGET` - Default deployment target

## Job-Level Variables

Variables scoped to specific CI/CD jobs.

### Usage
```yaml
job:
  variables:
    CUSTOM_VAR: "value"
```

### Scope
- Only available in specific job
- Not accessible to other jobs
- Override group/project variables
- Not persisted after job completion

## Variable Reference

### Required Variables
- `GITLAB_TOKEN` - GitLab API access
- `ANTHROPIC_API_KEY` - LLM provider (primary)
- `CI_DEPLOY_OSSA` - Deployment control

### Optional Variables
- `OPENAI_API_KEY` - Fallback LLM provider
- `DEPLOYMENT_TARGET` - Deployment environment
- `LOG_LEVEL` - Logging verbosity

## Configuration Files

### `.env.local`
Local development environment variables.

```bash
GITLAB_TOKEN=glpat-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
CI_DEPLOY_OSSA=true
```

### `.gitlab-ci.yml`
CI/CD pipeline variables.

```yaml
variables:
  CI_DEPLOY_OSSA: "true"
  NODE_VERSION: "20"
```

## Related Pages

- [Installation](../getting-started/installation.md)
- [Configuration Files](./configuration-files.md)
- [CI Integration](../automation/ci-integration.md)

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
