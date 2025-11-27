# GitLab Agent Integration & Service Accounts

Complete guide to GitLab Agents, Service Accounts, and automated workflows for OSSA.

## Service Accounts

### Production Agents
- **bot-ts-prod** (ID: 31840530) - TypeScript production deployments
- **bot-ml-prod** (ID: 31840520) - ML model deployments  
- **bot-infra-prod** (ID: 31840516) - Infrastructure automation
- **bot-drupal-prod** (ID: 31840511) - Drupal production deployments

### Local Development Agents
- **bot-ts-local** (ID: 31840529) - TypeScript local development
- **bot-ossa-local** (ID: 31840524) - OSSA local testing
- **bot-native-local** (ID: 31840521) - Native development
- **bot-ml-local** (ID: 31840518) - ML local testing
- **bot-gitlab-lib-local** (ID: 31840515) - GitLab library local dev
- **bot-drupal-local** (ID: 31840509) - Drupal local development

### CI/CD Agents
- **bot-gitlab-lib-ci** (ID: 31840513) - GitLab library CI/CD

## Agent Capabilities

### gitlab-lib-ci (bot-gitlab-lib-ci)
**Purpose**: CI/CD automation and integration
**Tasks**:
- `github-pr-sync` - Sync GitHub PRs to GitLab
- `code-review` - Automated code review
- `docs-sync` - Documentation synchronization
- `security-scan` - Security scanning
- `merge-train-orchestration` - Coordinate merge trains

### ts-prod (bot-ts-prod)
**Purpose**: TypeScript production builds
**Tasks**:
- `build` - Production builds
- `test` - Run test suites
- `lint` - Code linting
- `type-check` - TypeScript validation
- `bundle` - Create production bundles

### infra-prod (bot-infra-prod)
**Purpose**: Infrastructure deployment and management
**Tasks**:
- `deploy` - Deploy infrastructure
- `rollback` - Rollback deployment
- `health-check` - Health monitoring
- `scale` - Scale resources
- `backup` - Backup operations

### ml-prod (bot-ml-prod)
**Purpose**: ML model deployment
**Tasks**:
- `deploy-model` - Deploy ML models
- `validate` - Model validation
- `benchmark` - Performance benchmarking
- `monitor` - Model monitoring

### drupal-prod (bot-drupal-prod)
**Purpose**: Drupal integration
**Tasks**:
- `sync-content` - Sync content to Drupal
- `update-schema` - Update content schemas
- `cache-clear` - Clear Drupal caches
- `deploy-config` - Deploy configuration

## Merge Train Integration

### Development Merge Train
Agents automatically handle pre-releases:

```yaml
release:dev:agent:
  stage: release-dev
  variables:
    AGENT_NAME: gitlab-lib-ci
    AGENT_TASK: npm-publish-dev
  rules:
    - if: $CI_MERGE_REQUEST_EVENT_TYPE == "merge_train"
      when: on_success
```

### Main Merge Train
Agents handle production releases:

```yaml
release:prod:agent:
  stage: release-prod
  variables:
    AGENT_NAME: gitlab-lib-ci
    AGENT_TASK: npm-publish-prod
  needs:
    - milestone:check:agent
  rules:
    - if: $CI_MERGE_REQUEST_EVENT_TYPE == "merge_train"
      when: on_success
```

## Usage

### Automatic Triggers

Agents run automatically based on CI rules:

```yaml
# Code review on every MR
code:review:agent:
  variables:
    AGENT_NAME: gitlab-lib-ci
    AGENT_TASK: code-review
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

# Docs sync on main branch changes
docs:sync:agent:
  variables:
    AGENT_NAME: gitlab-lib-ci
    AGENT_TASK: docs-sync
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      changes:
        - docs/**/*

# Security scan on schedule
security:scan:agent:
  variables:
    AGENT_NAME: gitlab-lib-ci
    AGENT_TASK: security-scan
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
```

### Manual Triggers

```bash
# Via GitLab UI
CI/CD → Pipelines → Run pipeline → Select agent job

# Via glab CLI
glab ci run --branch main --variable AGENT_NAME=gitlab-lib-ci --variable AGENT_TASK=github-pr-sync

# Via API
curl --request POST --header "PRIVATE-TOKEN: $TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID/pipeline" \
  --data "ref=main" \
  --data "variables[AGENT_NAME]=gitlab-lib-ci" \
  --data "variables[AGENT_TASK]=security-scan"
```

## Agent Tasks Reference

### GitHub PR Sync
```yaml
github:sync:agent:
  variables:
    AGENT_NAME: gitlab-lib-ci
    AGENT_TASK: github-pr-sync
    TARGET_REPO: blueflyio/openstandardagents
    SYNC_DIRECTION: bidirectional
```

### Code Review
```yaml
code:review:agent:
  variables:
    AGENT_NAME: gitlab-lib-ci
    AGENT_TASK: code-review
    MR_IID: $CI_MERGE_REQUEST_IID
    REVIEW_LEVEL: standard
```

### Security Scan
```yaml
security:scan:agent:
  variables:
    AGENT_NAME: gitlab-lib-ci
    AGENT_TASK: security-scan
    SCAN_TYPE: full
    FAIL_ON_HIGH: "true"
```

### Infrastructure Deploy
```yaml
infra:deploy:agent:
  variables:
    AGENT_NAME: infra-prod
    AGENT_TASK: deploy
    ENVIRONMENT: production
    MANIFEST_PATH: infrastructure/
    DRY_RUN: "false"
```

### npm Publish (Dev)
```yaml
npm:publish:dev:agent:
  variables:
    AGENT_NAME: gitlab-lib-ci
    AGENT_TASK: npm-publish-dev
    PACKAGE_NAME: "@bluefly/openstandardagents"
    TAG: dev
```

### npm Publish (Production)
```yaml
npm:publish:prod:agent:
  variables:
    AGENT_NAME: gitlab-lib-ci
    AGENT_TASK: npm-publish-prod
    PACKAGE_NAME: "@bluefly/openstandardagents"
    TAG: latest
```

## Issue Assignment Automation

Agents can auto-assign issues based on labels:

```yaml
issue:assign:agent:
  variables:
    AGENT_NAME: gitlab-lib-ci
    AGENT_TASK: auto-assign-issue
    ISSUE_IID: $CI_ISSUE_IID
  rules:
    - if: $CI_PIPELINE_SOURCE == "issue"
```

**Assignment Rules:**
- `infrastructure` → bot-infra-prod
- `ci-cd` → bot-gitlab-lib-ci
- `typescript` → bot-ts-local
- `ml` → bot-ml-local
- `drupal` → bot-drupal-local

## Benefits

- ✅ **Centralized Management** - All agents in agent-platform
- ✅ **Reusable** - Same agents across 54+ projects
- ✅ **Maintainable** - Update once, applies everywhere
- ✅ **Scalable** - Add new agents without changing projects
- ✅ **Consistent** - Same behavior across all repos
- ✅ **Merge Train Ready** - Integrated with automated releases
- ✅ **Auto-Assignment** - Issues automatically assigned
- ✅ **Audit Trail** - All agent actions logged

## Configuration

### Adding New Agent

1. Create service account in agent-platform
2. Grant necessary permissions
3. Add to `.gitlab/ci/agents.yml`:

```yaml
new:agent:task:
  variables:
    AGENT_NAME: new-agent-name
    AGENT_TASK: task-name
  rules:
    - if: $TRIGGER_CONDITION
```

4. Document in this file

### Agent Permissions

Service accounts need:
- **Developer** role minimum
- **API access** enabled
- **CI/CD variables** access
- **Repository write** for commits

## Monitoring

### View Agent Execution

```bash
# List agent jobs
glab ci list | grep agent

# View agent logs
glab ci trace <pipeline-id> <agent-job-name>

# Check agent status
curl --header "PRIVATE-TOKEN: $TOKEN" \
  "https://gitlab.com/api/v4/users/31840513/events"
```

### Agent Metrics

Track agent performance:
- Success rate
- Execution time
- Error frequency
- Resource usage

## Troubleshooting

### Agent Not Triggering

**Check:**
1. Agent exists in agent-platform
2. Variables are correct
3. Rules match your scenario
4. Agent has required permissions
5. CI/CD variables are set

**Debug:**
```bash
# Verify agent exists
curl --header "PRIVATE-TOKEN: $TOKEN" \
  "https://gitlab.com/api/v4/users/31840513"

# Check project settings
curl --header "PRIVATE-TOKEN: $TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID" | \
  jq '.merge_trains_enabled'
```

### Agent Failing

**Check:**
1. Agent logs in agent-platform pipeline
2. Variables passed correctly
3. Agent has required permissions
4. API tokens are valid
5. Rate limits not exceeded

**Common Issues:**
- **401 Unauthorized**: Token expired or invalid
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **429 Too Many Requests**: Rate limit exceeded

### Merge Train Issues

**Agent not running in merge train:**
```yaml
# Ensure rule includes merge_train event
rules:
  - if: $CI_MERGE_REQUEST_EVENT_TYPE == "merge_train"
    when: on_success
```

**Agent blocking merge train:**
- Check if job is marked as `allow_failure: false`
- Review agent logs for errors
- Verify all dependencies are met

## Security

### Token Management

- Rotate service account tokens quarterly
- Store tokens in GitLab CI/CD variables (masked)
- Never commit tokens to repository
- Use separate tokens for prod/dev

### Access Control

- Limit agent permissions to minimum required
- Use protected branches
- Require approvals for agent changes
- Audit agent activity regularly

## Related Documentation

- [Merge Train Automation](../.gitlab/docs/automation/MERGE_TRAIN_AUTOMATION.md)
- [GitLab Agents Workflow](../.gitlab/docs/development/GITLAB_AGENTS.md)
- [Release Process](../RELEASE_PROCESS.md)

## Quick Reference

### Service Account IDs
```bash
BOT_TS_PROD=31840530
BOT_TS_LOCAL=31840529
BOT_OSSA_LOCAL=31840524
BOT_NATIVE_LOCAL=31840521
BOT_ML_PROD=31840520
BOT_ML_LOCAL=31840518
BOT_INFRA_PROD=31840516
BOT_GITLAB_LIB_LOCAL=31840515
BOT_GITLAB_LIB_CI=31840513
BOT_DRUPAL_PROD=31840511
BOT_DRUPAL_LOCAL=31840509
```

### Common Commands
```bash
# Trigger agent manually
glab ci run --variable AGENT_NAME=gitlab-lib-ci --variable AGENT_TASK=security-scan

# View agent logs
glab ci trace <pipeline-id> <job-name>

# Check merge train status
curl --header "PRIVATE-TOKEN: $TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_trains"
```

