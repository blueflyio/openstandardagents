# GitLab Webhook Agents

Automated agents triggered by GitLab webhooks for issue triage and MR management.

## Architecture

```
GitLab Event (Issue/MR/Note)
    │
    ▼
Webhook → Trigger Pipeline
    │
    ▼
webhook:validate (validates event)
    │
    ▼
agent:router (determines which agent)
    │
    ├──► agent:issue-triage (for issues)
    │
    └──► agent:mr-manager (for MRs)
    │
    ▼
agent:report (summary)
```

## Agents

### MR Manager (`mr-manager`)
- **Manifest**: `.gitlab/agents/mr-manager/manifest.ossa.yaml`
- **Triggers**: MR open, update, approved, notes
- **Tasks**:
  - Validate conventional commit title
  - Auto-apply labels based on type
  - Assign reviewers
  - Add to merge train when ready
  - Post status comments

### Issue Triage (`issue-triage`)
- **Manifest**: `.gitlab/agents/issue-triage/manifest.ossa.yaml`
- **Triggers**: Issue open, update, notes
- **Tasks**:
  - Validate issue template
  - Classify issue type (bug/feature/docs/question)
  - Estimate weight
  - Auto-assign owner
  - Add to milestone
  - Post triage report

## Setup

### 1. Create CI Variables

```bash
# In GitLab: Settings → CI/CD → Variables

# GITLAB_TOKEN - Personal access token with api scope
# WEBHOOK_SECRET - Random secret for webhook validation
```

### 2. Create Pipeline Trigger

```bash
curl --request POST \
  --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "https://gitlab.com/api/v4/projects/blueflyio%2Fopenstandardagents.org/triggers" \
  --data "description=Webhook Agent Trigger"

# Save the token as WEBHOOK_TRIGGER_TOKEN
```

### 3. Create Webhook

```bash
curl --request POST \
  --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  --header "Content-Type: application/json" \
  "https://gitlab.com/api/v4/projects/blueflyio%2Fopenstandardagents.org/hooks" \
  --data '{
    "url": "https://gitlab.com/api/v4/projects/blueflyio%2Fopenstandardagents.org/trigger/pipeline",
    "token": "WEBHOOK_TRIGGER_TOKEN",
    "issues_events": true,
    "merge_requests_events": true,
    "note_events": true,
    "enable_ssl_verification": true
  }'
```

### 4. Test Webhook

Create a test issue or MR and check:
- Pipeline triggered with source "trigger"
- Agent jobs executed
- Comments posted by agents

## Monitoring

Check agent execution:
- **Pipelines**: Settings → CI/CD → Pipelines (filter by "trigger")
- **Jobs**: View individual agent job logs
- **Comments**: Check MR/Issue comments for agent reports

## Troubleshooting

### Webhook not triggering
- Check webhook is active: Settings → Webhooks
- Verify trigger token is correct
- Check webhook recent deliveries for errors

### Agent not executing
- Check `agent:router` job logs
- Verify event type is supported
- Check agent manifest exists

### No comments posted
- Verify `GITLAB_TOKEN` has api scope
- Check agent job logs for API errors
- Verify project permissions
