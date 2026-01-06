# GitLab Agents & Service Accounts Workflow

## Overview

GitLab Agents and Service Accounts enable automated workflows and AI-assisted development. This document outlines how to use them effectively in the OSSA project.

## Available Service Accounts

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

## Issue Assignment Workflow

### Automatic Assignment Rules

**When creating an issue:**

1. **Feature Development** → Assign to developer or relevant bot
2. **Bug Fixes** → Assign to developer who owns the component
3. **Documentation** → Assign to technical writer or developer
4. **Infrastructure** → Assign to `bot-infra-prod`
5. **CI/CD Changes** → Assign to `bot-gitlab-lib-ci`

### Manual Assignment

```bash
# Assign issue to user
curl --request PUT --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/blueflyio%2Fopenstandardagents/issues/$ISSUE_ID" \
  --data "assignee_ids[]=$USER_ID"

# Assign to service account
curl --request PUT --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/blueflyio%2Fopenstandardagents/issues/$ISSUE_ID" \
  --data "assignee_ids[]=$BOT_ID"
```

### Issue Labels & Assignment Matrix

| Label | Auto-Assign To | Reason |
|-------|---------------|--------|
| `infrastructure` | bot-infra-prod | Infrastructure changes |
| `ci-cd` | bot-gitlab-lib-ci | Pipeline automation |
| `typescript` | bot-ts-local | TypeScript development |
| `ml` | bot-ml-local | ML/AI features |
| `drupal` | bot-drupal-local | Drupal integration |
| `documentation` | Developer | Human review needed |
| `bug` | Component Owner | Domain expertise |
| `enhancement` | Developer | Design decisions |

## Using Agents in CI/CD

### Agent Configuration

```yaml
# .gitlab-ci.yml
agent:deploy:
  stage: deploy
  image: registry.gitlab.com/gitlab-org/cluster-integration/gitlab-agent/cli:stable
  script:
    - gitlab-agent-cli deploy
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  environment:
    name: production
    kubernetes:
      namespace: ossa-production
```

### Service Account Tokens

Service accounts have their own access tokens for API calls:

```bash
# Use service account token in CI/CD
export BOT_TOKEN="${BOT_INFRA_PROD_TOKEN}"

# Make API calls as bot
curl --header "PRIVATE-TOKEN: $BOT_TOKEN" \
  "https://gitlab.com/api/v4/projects/blueflyio%2Fopenstandardagents/issues"
```

## Automated Issue Management

### Auto-Assignment Script

Create `.gitlab/scripts/auto-assign-issues.sh`:

```bash
#!/bin/bash

# Get issue labels
LABELS=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/$CI_PROJECT_ID/issues/$ISSUE_IID" | \
  jq -r '.labels | join(",")')

# Assign based on labels
if [[ "$LABELS" == *"infrastructure"* ]]; then
  ASSIGNEE_ID=31840516  # bot-infra-prod
elif [[ "$LABELS" == *"ci-cd"* ]]; then
  ASSIGNEE_ID=31840513  # bot-gitlab-lib-ci
elif [[ "$LABELS" == *"typescript"* ]]; then
  ASSIGNEE_ID=31840529  # bot-ts-local
elif [[ "$LABELS" == *"ml"* ]]; then
  ASSIGNEE_ID=31840518  # bot-ml-local
else
  ASSIGNEE_ID=22462169  # Default to main developer
fi

# Assign issue
curl --request PUT --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/$CI_PROJECT_ID/issues/$ISSUE_IID" \
  --data "assignee_ids[]=$ASSIGNEE_ID"
```

### Webhook Integration

Set up webhooks to trigger auto-assignment:

1. Go to **Settings → Webhooks**
2. Add webhook URL: `https://your-automation-server.com/gitlab-webhook`
3. Select triggers: **Issues events**
4. Add secret token
5. Enable SSL verification

## Agent Workspace Configuration

### Workspace Setup

Agents use workspaces for isolated development:

```yaml
# .gitlab/agents/ossa-agent/config.yaml
ci_access:
  projects:
    - id: blueflyio/openstandardagents
      default_namespace: ossa-development

user_access:
  projects:
    - id: blueflyio/openstandardagents
      roles:
        - name: developers
          namespace: ossa-development

remote_development:
  enabled: true
  workspaces:
    - name: typescript-dev
      max_hours_before_termination: 8
      resources:
        requests:
          cpu: "2"
          memory: "4Gi"
```

### Connecting to Workspace

```bash
# Connect to agent workspace
gitlab-workspaces connect ossa-agent

# List active workspaces
gitlab-workspaces list

# Terminate workspace
gitlab-workspaces terminate ossa-agent
```

## Best Practices

### 1. Always Assign Issues

- **Never leave issues unassigned**
- Assign to yourself or appropriate bot
- Use multiple assignees for collaboration

### 2. Use Service Accounts for Automation

- **Production deployments** → Use prod bots
- **Local testing** → Use local bots
- **CI/CD** → Use CI bots

### 3. Label Consistently

- Add labels when creating issues
- Labels trigger auto-assignment
- Use standard label taxonomy

### 4. Monitor Bot Activity

```bash
# Check bot activity
curl --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/users/31840516/events" | \
  jq -r '.[] | "\(.created_at): \(.action_name) - \(.target_title)"'
```

### 5. Rotate Bot Tokens

- Rotate service account tokens quarterly
- Store tokens in GitLab CI/CD variables
- Never commit tokens to repository

## Troubleshooting

### Issue Not Showing in Milestone

**Problem**: Issue is open but not showing in milestone view

**Solution**: Ensure issue is assigned
```bash
curl --request PUT --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/blueflyio%2Fopenstandardagents/issues/$ISSUE_ID" \
  --data "assignee_ids[]=$USER_ID"
```

### Bot Cannot Access Resource

**Problem**: Service account lacks permissions

**Solution**: Add bot to project with appropriate role
```bash
curl --request POST --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/blueflyio%2Fopenstandardagents/members" \
  --data "user_id=$BOT_ID" \
  --data "access_level=30"  # Developer role
```

### Workspace Connection Failed

**Problem**: Cannot connect to agent workspace

**Solution**: Check agent configuration and restart
```bash
# Check agent status
kubectl get pods -n gitlab-agent

# Restart agent
kubectl rollout restart deployment/gitlab-agent -n gitlab-agent
```

## References

- [GitLab Agents Documentation](https://docs.gitlab.com/ee/user/clusters/agent/)
- [Service Accounts](https://docs.gitlab.com/ee/user/project/settings/project_access_tokens.html#service-accounts)
- [Remote Development Workspaces](https://docs.gitlab.com/ee/user/project/remote_development/)
- [Issue API](https://docs.gitlab.com/ee/api/issues.html)

## Quick Reference

### Common Commands

```bash
# List all service accounts
curl --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/groups/blueflyio/service_accounts"

# Assign issue
curl --request PUT --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/blueflyio%2Fopenstandardagents/issues/$ISSUE_ID" \
  --data "assignee_ids[]=$USER_ID"

# Update issue labels
curl --request PUT --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/blueflyio%2Fopenstandardagents/issues/$ISSUE_ID" \
  --data "labels=bug,critical,workflow::in-progress"

# Close issue
curl --request PUT --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/blueflyio%2Fopenstandardagents/issues/$ISSUE_ID" \
  --data "state_event=close"
```

### Service Account IDs

```bash
# Quick reference for copy-paste
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
