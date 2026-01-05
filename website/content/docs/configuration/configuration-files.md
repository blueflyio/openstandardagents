---
title: "Configuration Files"
---

# Configuration Files

## Overview

OSSA project configuration files and their purposes.

## Core Configuration

### `.releaserc.json`
Semantic-release configuration for automated versioning.

```json
{
  "branches": ["release/v0.3.x", "main"],
  "plugins": [
    "@semantic-release/changelog",
    "@semantic-release/git",
    "@semantic-release/gitlab"
  ]
}
```

### `.gitlab-ci.yml`
GitLab CI/CD pipeline configuration.

### `.gitlab/scripts/detect-version.sh`
Dynamic version detection script.

## Agent Configuration

### `.gitlab/agents/*.ossa.yaml`
OSSA agent manifest files.

### `.gitlab/duo/agents/*.yaml`
GitLab Duo agent configurations.

### `.gitlab/duo/flow-triggers.yml`
Workflow trigger definitions.

## Project Configuration

### `package.json`
NPM package configuration with OSSA dependencies.

### `tsconfig.json`
TypeScript configuration for agent development.

### `.eslintrc.json`
ESLint configuration for code quality.

### `.prettierrc`
Prettier configuration for code formatting.

## Documentation Configuration

### `.wiki-config.json`
GitLab Wiki sync configuration.

### `website/docusaurus.config.js`
Docusaurus website configuration.

## Related Pages

- [Environment Variables](./environment-variables.md)
- [Installation](../getting-started/installation.md)
- [CI Integration](../automation/ci-integration.md)

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
