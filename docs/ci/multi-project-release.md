# Multi-Project Release Pipeline Component

> Part of Epic #3: Autonomous Release System - Phase 1 Issue #2

## Overview

The Multi-Project Release Pipeline Component orchestrates releases across multiple OSSA agent projects in dependency order. It automatically calculates the correct deployment sequence based on agent dependencies, executes releases in batches (with optional parallelization), and handles failures with configurable rollback strategies.

## Features

- **Dependency-Aware Deployment**: Automatically calculates deployment order using `ossa dependencies deploy-order`
- **Batch Processing**: Groups agents into batches that can be deployed in parallel
- **Failure Handling**: Configurable fail-fast and rollback strategies
- **Dry Run Mode**: Test release plans without actual deployment
- **Progress Tracking**: Real-time status updates and detailed logging
- **Notifications**: Slack/Teams integration for failure alerts
- **Flexible Configuration**: Support for pattern-based discovery or explicit manifest lists

## Architecture

### Pipeline Stages

The component implements a three-stage pipeline:

```
┌─────────────────────────────────────────────────────────────┐
│ Stage 1: Calculate Deployment Order                         │
│ - Discover agent manifests                                  │
│ - Run ossa dependencies deploy-order                        │
│ - Generate batch configurations                             │
│ - Validate dependencies                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 2: Execute Batch Releases                             │
│ - Process batches in dependency order                       │
│ - Trigger child pipelines for each agent                    │
│ - Wait for completion (parallel or sequential)              │
│ - Track success/failure status                              │
│ - Inter-batch delays                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 3: Rollback (if needed)                               │
│ - Detect failures from Stage 2                              │
│ - Execute rollback strategy                                 │
│ - Revert in reverse dependency order                        │
│ - Send notifications                                        │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Batching Strategy

The component uses `ossa dependencies deploy-order` to calculate batches:

```
Batch 1: [foundation-agent, config-agent]  ← No dependencies
         ↓
Batch 2: [auth-agent, storage-agent]       ← Depend on Batch 1
         ↓
Batch 3: [api-gateway, workflow-agent]     ← Depend on Batch 2
         ↓
Batch 4: [monitoring-agent]                 ← Depends on Batch 3
```

**Key Principles:**
- Agents with no dependencies are deployed first
- Agents in the same batch can be deployed in parallel
- Each batch waits for the previous batch to complete
- Circular dependencies are detected and cause pipeline failure

## Usage

### Basic Usage

Include the component in your `.gitlab-ci.yml`:

```yaml
include:
  - component: gitlab.com/blueflyio/openstandardagents/multi-project-release@v0.3.x

release:all-agents:
  trigger:
    include:
      - component: gitlab.com/blueflyio/openstandardagents/multi-project-release@v0.3.x
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

### With Custom Configuration

```yaml
release:production:
  trigger:
    include:
      - component: gitlab.com/blueflyio/openstandardagents/multi-project-release@v0.3.x
        inputs:
          manifest_pattern: '.agents/**/*.ossa.yaml'
          release_type: 'minor'
          parallel_batches: true
          batch_delay: 60
          fail_fast: true
          enable_rollback: true
          rollback_strategy: 'batch'
          notify_on_failure: true
          notification_channel: $SLACK_WEBHOOK_URL
```

## Input Parameters

### Agent Discovery

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `manifest_pattern` | string | `.agents/**/*.ossa.yaml` | Glob pattern for discovering agent manifests |
| `manifest_files` | array | `[]` | Explicit list of manifest files (bypasses pattern discovery) |

### Release Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `release_type` | string | `auto` | Release type: `major`, `minor`, `patch`, or `auto` |
| `dry_run` | boolean | `false` | Simulate release without deploying |

### Deployment Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `parallel_batches` | boolean | `true` | Deploy agents in parallel within each batch |
| `batch_delay` | number | `30` | Delay in seconds between batches |
| `fail_fast` | boolean | `true` | Stop all releases on first failure |

### Rollback Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enable_rollback` | boolean | `true` | Enable automatic rollback on failure |
| `rollback_strategy` | string | `batch` | Rollback strategy: `immediate`, `batch`, or `none` |

**Rollback Strategies:**
- `immediate`: Revert all successfully deployed agents immediately
- `batch`: Revert only the last successful batch
- `none`: No automatic rollback

### Notification Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `notify_on_failure` | boolean | `true` | Send notifications on release failures |
| `notification_channel` | string | `''` | Slack/Teams webhook URL |

### Timeout Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pipeline_timeout` | number | `120` | Maximum time in minutes for entire release |
| `batch_timeout` | number | `30` | Maximum time in minutes for single batch |

### GitLab API Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `gitlab_token` | string | `$CI_JOB_TOKEN` | GitLab API token for triggering pipelines |

## Failure Handling

### Fail-Fast Mode

When `fail_fast: true` (default):
- Pipeline stops on first agent failure
- Remaining agents are not deployed
- Rollback is triggered if enabled

When `fail_fast: false`:
- Pipeline continues despite failures
- All agents are attempted
- Partial deployment is possible

### Rollback Strategies

#### Immediate Rollback
```yaml
enable_rollback: true
rollback_strategy: 'immediate'
```
- Reverts ALL successfully deployed agents
- Executes in reverse dependency order
- Use for critical production releases

#### Batch Rollback
```yaml
enable_rollback: true
rollback_strategy: 'batch'
```
- Reverts only the last successful batch
- Faster than immediate rollback
- Use for staged rollouts

#### No Rollback
```yaml
enable_rollback: false
rollback_strategy: 'none'
```
- No automatic rollback
- Manual intervention required
- Use for development/staging

## Examples

### Example 1: Dry Run for Testing

Test the release plan without deploying:

```yaml
test:release-plan:
  trigger:
    include:
      - component: gitlab.com/blueflyio/openstandardagents/multi-project-release@v0.3.x
        inputs:
          dry_run: true
          manifest_pattern: '.agents/**/*.ossa.yaml'
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
      when: manual
```

**Output:**
```
🔍 Multi-Project Release Orchestration
======================================

Configuration:
  Manifest Pattern: .agents/**/*.ossa.yaml
  Release Type: auto
  Dry Run: true
  Parallel Batches: true
  Fail Fast: true

📦 Found 12 agent manifests

🔄 Calculating deployment order...

✅ Deployment Order Calculated:

Total Batches: 4

Batch 1:
  ⚡ Parallel deployment enabled
  Agents: foundation-agent, config-agent

Batch 2:
  ⚡ Parallel deployment enabled
  Agents: auth-agent, storage-agent

Batch 3:
  ⚡ Parallel deployment enabled
  Agents: api-gateway, workflow-agent

Batch 4:
  Agents: monitoring-agent

[DRY RUN] Would trigger release for foundation-agent
[DRY RUN] Would trigger release for config-agent
...
```

### Example 2: Production Release with Notifications

```yaml
release:production:
  trigger:
    include:
      - component: gitlab.com/blueflyio/openstandardagents/multi-project-release@v0.3.x
        inputs:
          manifest_pattern: '.agents/**/*.ossa.yaml'
          release_type: 'minor'
          parallel_batches: true
          batch_delay: 60
          fail_fast: true
          enable_rollback: true
          rollback_strategy: 'immediate'
          notify_on_failure: true
          notification_channel: $SLACK_WEBHOOK_URL
          pipeline_timeout: 180
  environment:
    name: production
  rules:
    - if: $CI_COMMIT_BRANCH == "main" && $CI_COMMIT_TAG
```

### Example 3: Explicit Manifest List

Release only specific agents:

```yaml
release:critical-agents:
  trigger:
    include:
      - component: gitlab.com/blueflyio/openstandardagents/multi-project-release@v0.3.x
        inputs:
          manifest_files:
            - '.agents/auth-agent.ossa.yaml'
            - '.agents/api-gateway-agent.ossa.yaml'
            - '.agents/monitoring-agent.ossa.yaml'
          parallel_batches: false
          fail_fast: true
  rules:
    - if: $CI_PIPELINE_SOURCE == "web"
      when: manual
```

### Example 4: Staged Release Pipeline

Multi-stage release with manual approvals:

```yaml
stages:
  - validate
  - dev-release
  - staging-release
  - prod-release

validate:manifests:
  stage: validate
  image: node:20-alpine
  before_script:
    - npm install -g @bluefly/openstandardagents@latest
  script:
    - ossa dependencies validate '.agents/**/*.ossa.yaml'

release:development:
  stage: dev-release
  trigger:
    include:
      - component: gitlab.com/blueflyio/openstandardagents/multi-project-release@v0.3.x
        inputs:
          manifest_pattern: '.agents/**/*.ossa.yaml'
          parallel_batches: true
          enable_rollback: false
  environment:
    name: development
  rules:
    - if: $CI_COMMIT_BRANCH == "development"

release:staging:
  stage: staging-release
  trigger:
    include:
      - component: gitlab.com/blueflyio/openstandardagents/multi-project-release@v0.3.x
        inputs:
          parallel_batches: true
          enable_rollback: true
          rollback_strategy: 'batch'
  environment:
    name: staging
  needs:
    - release:development
  rules:
    - if: $CI_COMMIT_BRANCH =~ /^release\//
      when: manual

release:production:
  stage: prod-release
  trigger:
    include:
      - component: gitlab.com/blueflyio/openstandardagents/multi-project-release@v0.3.x
        inputs:
          parallel_batches: true
          enable_rollback: true
          rollback_strategy: 'immediate'
          notify_on_failure: true
  environment:
    name: production
  needs:
    - release:staging
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
```

### Example 5: Canary Release Strategy

Deploy to a subset first, then full rollout:

```yaml
release:canary:
  trigger:
    include:
      - component: gitlab.com/blueflyio/openstandardagents/multi-project-release@v0.3.x
        inputs:
          manifest_files:
            - '.agents/canary-test-agent.ossa.yaml'
          enable_rollback: true
          rollback_strategy: 'immediate'
  environment:
    name: production/canary

release:full-rollout:
  trigger:
    include:
      - component: gitlab.com/blueflyio/openstandardagents/multi-project-release@v0.3.x
        inputs:
          manifest_pattern: '.agents/**/*.ossa.yaml'
          batch_delay: 30
  environment:
    name: production
  needs:
    - release:canary
  rules:
    - when: manual
```

## Monitoring and Debugging

### Pipeline Artifacts

The component generates the following artifacts:

1. **deployment-order.json**: Calculated deployment batches
   ```json
   {
     "batches": [
       {
         "batch_id": 1,
         "parallel": true,
         "agents": ["foundation-agent", "config-agent"]
       }
     ],
     "total_agents": 12,
     "total_batches": 4
   }
   ```

2. **release-log.json**: Release execution log
   ```json
   {
     "batches": [
       {
         "batch": "1",
         "duration": "45",
         "status": "success"
       }
     ]
   }
   ```

3. **release.env**: Pipeline state variables
   ```
   RELEASE_STATUS=success
   RELEASED_COUNT=12
   FAILED_COUNT=0
   ```

### Viewing Release Status

Check the pipeline job logs for detailed status:

```bash
# View deployment order calculation
gitlab-ci-multi-runner exec docker multi-release:calculate-order

# View batch execution
gitlab-ci-multi-runner exec docker multi-release:execute-batches

# View rollback status
gitlab-ci-multi-runner exec docker multi-release:rollback
```

### Common Issues

#### Issue: "No manifests found matching pattern"

**Cause:** The manifest pattern doesn't match any files.

**Solution:**
```yaml
# Check your pattern
manifest_pattern: '.agents/**/*.ossa.yaml'  # Recursive search
manifest_pattern: '.agents/*.ossa.yaml'      # Single directory
```

#### Issue: "Circular dependency detected"

**Cause:** Agents have circular dependencies in their manifests.

**Solution:**
```bash
# Validate dependencies first
ossa dependencies validate '.agents/**/*.ossa.yaml'

# View dependency graph
ossa dependencies graph '.agents/**/*.ossa.yaml' -f dot -o graph.dot
dot -Tpng graph.dot -o graph.png
```

#### Issue: "Pipeline timeout exceeded"

**Cause:** Batch or pipeline timeout is too short.

**Solution:**
```yaml
inputs:
  batch_timeout: 60      # Increase from 30 to 60 minutes
  pipeline_timeout: 240  # Increase from 120 to 240 minutes
```

#### Issue: "Rollback failed"

**Cause:** Rollback pipelines failed to trigger.

**Solution:**
- Ensure `gitlab_token` has sufficient permissions
- Check that rollback pipelines are configured in agent projects
- Review `.release-state/release-log.json` for state information

## Integration with OSSA CLI

The component uses the OSSA CLI for dependency analysis:

```bash
# Calculate deployment order
ossa dependencies deploy-order '.agents/**/*.ossa.yaml' --format json

# Validate dependencies
ossa dependencies validate '.agents/**/*.ossa.yaml' --verbose

# Generate dependency graph
ossa dependencies graph '.agents/**/*.ossa.yaml' -f dot -o graph.dot

# Check for conflicts
ossa dependencies check-conflicts '.agents/**/*.ossa.yaml'
```

## Best Practices

### 1. Always Run Dry Run First

Test your release configuration:

```yaml
test:release-plan:
  trigger:
    include:
      - component: gitlab.com/blueflyio/openstandardagents/multi-project-release@v0.3.x
        inputs:
          dry_run: true
  rules:
    - when: manual
```

### 2. Use Staged Releases for Production

Never release directly to production:

```yaml
stages:
  - dev-release
  - staging-release
  - prod-release

# Development (automatic)
release:dev:
  stage: dev-release
  ...

# Staging (manual gate)
release:staging:
  stage: staging-release
  rules:
    - when: manual
  ...

# Production (manual gate + approval)
release:prod:
  stage: prod-release
  rules:
    - when: manual
  needs:
    - release:staging
```

### 3. Enable Rollback for Production

Always enable rollback for production releases:

```yaml
inputs:
  enable_rollback: true
  rollback_strategy: 'immediate'  # Aggressive for production
```

### 4. Configure Notifications

Set up Slack/Teams notifications:

```yaml
inputs:
  notify_on_failure: true
  notification_channel: $SLACK_WEBHOOK_URL
```

### 5. Use Appropriate Batch Delays

Balance speed and safety:

```yaml
inputs:
  batch_delay: 15   # Fast for development
  batch_delay: 30   # Moderate for staging
  batch_delay: 60   # Conservative for production
```

### 6. Validate Dependencies First

Add validation stage before release:

```yaml
validate:dependencies:
  stage: validate
  image: node:20-alpine
  before_script:
    - npm install -g @bluefly/openstandardagents@latest
  script:
    - ossa dependencies validate '.agents/**/*.ossa.yaml' --verbose
```

### 7. Monitor Release Progress

Use GitLab's pipeline graphs and job logs to monitor:
- Batch progression
- Parallel execution
- Failure points
- Rollback status

## Security Considerations

### GitLab Token Permissions

The component requires a GitLab token with the following permissions:
- `api`: Trigger child pipelines
- `read_repository`: Access manifests
- `write_repository`: Create pipeline artifacts

**Recommended:** Use `CI_JOB_TOKEN` (automatically scoped to current pipeline)

**Alternative:** Use a project access token with limited scope

### Secrets Management

Never hardcode secrets in manifests:

```yaml
# ❌ BAD
notification_channel: 'https://hooks.slack.com/services/T00/B00/XXX'

# ✅ GOOD
notification_channel: $SLACK_WEBHOOK_URL
```

Define secrets as GitLab CI/CD variables (Settings → CI/CD → Variables)

## Performance Optimization

### Parallel Execution

Enable parallel batches for faster releases:

```yaml
inputs:
  parallel_batches: true  # Deploy batch agents simultaneously
```

**Trade-off:** Increased resource usage vs. faster completion

### Batch Sizing

Optimize batch delays based on agent startup time:

```yaml
inputs:
  batch_delay: 15   # Fast-starting agents
  batch_delay: 60   # Slow-starting agents (e.g., with warm-up)
```

### Timeout Configuration

Set realistic timeouts based on agent complexity:

```yaml
inputs:
  batch_timeout: 20    # Simple agents
  batch_timeout: 60    # Complex agents with migrations
  pipeline_timeout: 180  # Overall safety net
```

## Related Documentation

- [OSSA Dependencies CLI](../cli/dependencies.md)
- [Agent Manifest Specification](../spec/agent-manifest.md)
- [GitLab CI/CD Components](https://docs.gitlab.com/ee/ci/components/)
- [Epic #3: Autonomous Release System](https://gitlab.com/blueflyio/openstandardagents/-/epics/3)

## Troubleshooting

For issues or questions:
1. Check [Common Issues](#common-issues) above
2. Review pipeline job logs for detailed error messages
3. Validate dependencies: `ossa dependencies validate`
4. Run dry-run mode to test configuration
5. Open an issue: https://gitlab.com/blueflyio/openstandardagents/-/issues

## Changelog

### v0.3.x (2025-12-13)
- Initial implementation
- Dependency-aware deployment ordering
- Batch processing with parallelization
- Configurable rollback strategies
- Dry run mode
- Notification support
