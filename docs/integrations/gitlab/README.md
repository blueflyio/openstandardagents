# GitLab CI/CD Integration Guide

Complete guide for converting OSSA agents to GitLab CI jobs.

## Quick Start

### 1. Export OSSA Agent to GitLab CI

```bash
ossa export agent.ossa.yaml --platform gitlab --output .gitlab-ci.yml
```

### 2. Commit and Push

```bash
git add .gitlab-ci.yml
git commit -m "Add OSSA agent CI job"
git push
```

## Conversion Examples

### Basic CI Job

**OSSA Agent**:
```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: code-reviewer
spec:
  role: "Review code"
  runtime:
    image: node:20-alpine
    command: ["node", "dist/index.js"]
```

**Generated GitLab CI**:
```yaml
stages:
  - deploy

code-reviewer:
  image: node:20-alpine
  stage: deploy
  script:
    - npm ci
    - npm run build
    - node dist/index.js
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: on_success
```

## Multi-Agent Workflows

OSSA workflows convert to GitLab pipelines with multiple jobs:

```yaml
stages:
  - build
  - test
  - deploy

reviewer:
  stage: deploy
  script:
    - node dist/reviewer.js

fixer:
  stage: deploy
  script:
    - node dist/fixer.js
  needs:
    - reviewer
```

## Best Practices

1. **Stage Organization**: Use appropriate stages
2. **Artifacts**: Configure artifacts for job dependencies
3. **Rules**: Set up proper rules for when jobs run
4. **Variables**: Use CI/CD variables for configuration
