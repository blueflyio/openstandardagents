---
title: "CI Integration"
---

# CI Integration

## Overview

OSSA agents integrate seamlessly with GitLab CI/CD pipelines for automated validation, testing, and deployment.

## CI Job Reference

### validate:ossa-manifest
Validates OSSA agent manifests against schema.

```yaml
validate:ossa-manifest:
  extends: .ossa-base
  script:
    - ossa validate packages/@ossa/**/*.ossa.yaml
```

### deploy:ossa-agents
Deploys OSSA agents to Kubernetes.

```yaml
deploy:ossa-agents:
  extends: .ossa-base
  script:
    - ossa deploy --namespace agents
```

## CI_DEPLOY_OSSA Variable

Controls OSSA agent deployment in pipelines.

**Usage**:
```yaml
variables:
  CI_DEPLOY_OSSA: "true"
```

**Behavior**:
- `true`: Deploy OSSA agents automatically
- `false`: Skip OSSA deployment (default)

## Detection Jobs (Read-Only)

Read-only jobs that detect and analyze without making changes.

### detect:version
Detects version from branch name and existing tags.

### detect:changes
Detects changed files and determines affected agents.

### detect:dependencies
Detects dependency updates and security vulnerabilities.

## Validation Jobs

Jobs that validate configuration and code.

### validate:mr-target
Validates MR target branch (feature → release/*).

### validate:branch-naming
Validates branch naming convention.

### validate:commit-message
Validates commit message format.

### validate:milestone
Validates MR has required milestone.

## Tag Creation Jobs

Automated tag creation for releases.

### create:dev-tag
Creates development tags on release branches.

### create:rc-tag
Creates release candidate tags.

### create:release-tag
Creates final release tags on main.

## Integration Points

### Pre-commit Hooks
- Validate OSSA manifests
- Check commit message format
- Verify branch naming

### Pipeline Stages
- `.pre`: Validation and checks
- `validate`: Schema and policy validation
- `test`: Agent testing
- `build`: Agent packaging
- `deploy`: Agent deployment

### Webhook Triggers
- Issue events → Agent triage
- MR events → Agent review
- Pipeline events → Agent deployment

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
