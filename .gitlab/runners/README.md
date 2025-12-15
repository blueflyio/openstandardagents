# OSSA Runners Configuration

## Overview

OSSA runners are GitLab CI/CD jobs that execute OSSA commands and agents. They provide a standardized way to run OSSA validation, agent execution, and schema generation in CI/CD pipelines.

## Available Runners

### Schema Validation Runner
- **Job**: `schema:validate-examples`
- **Purpose**: Validates all OSSA example manifests
- **Stage**: validate
- **Usage**: Automatically runs on MRs and main/development branches

### OSSA Agent Execution Runner
- **Job**: `ossa:run-agent`
- **Purpose**: Executes OSSA agents from manifests
- **Stage**: test
- **Usage**: Set `AGENT_MANIFEST` variable to path of agent manifest
- **Example**:
  ```yaml
  my-agent:
    extends: .ossa-runner
    variables:
      AGENT_MANIFEST: ".gitlab/agents/my-agent/manifest.ossa.yaml"
      AGENT_ARGS: "--message 'Run this task'"
  ```

### OSSA Validation Runner
- **Job**: `ossa:validate-manifest`
- **Purpose**: Validates a single OSSA manifest
- **Stage**: validate
- **Usage**: Set `MANIFEST_PATH` variable

### OSSA Schema Generation Runner
- **Job**: `ossa:generate-schema`
- **Purpose**: Generates TypeScript types from OSSA schemas
- **Stage**: build
- **Usage**: Automatically runs when schema files change

## Configuration

Runners are configured in `.gitlab/ci/ossa-runners.yml` and included in the main `.gitlab-ci.yml`.

## Runner Infrastructure

For dedicated runner infrastructure, use `.gitlab/runners/ossa-runner-config.toml` as a template for GitLab Runner configuration.
