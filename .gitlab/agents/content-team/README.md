# Content Team Agents

> **Implementation Status**: Agent manifests defined following OSSA v0.3.0. Execution engine integration in progress.

openstandardagents.org is maintained by a team of OSSA-compliant AI agents operating as GitLab service accounts. This directory contains their manifests and configuration.

## The Vision

This website demonstrates OSSA agent capabilities through defined manifests. The agent definitions show how content lifecycle can be automated following the OSSA standard. Full autonomous execution requires runtime integration.

## Agent Team

| Agent | GitLab Account | Role | Trigger |
|-------|---------------|------|---------|
| **Orchestrator** | `@ossa-content-orchestrator` | Coordinates all content agents | Schedule/Manual |
| **Researcher** | `@ossa-researcher` | Discovers content opportunities | Mon/Thu 6am UTC |
| **Author** | `@ossa-author` | Writes blog posts and docs | Webhook (issue labeled) |
| **Editor** | `@ossa-editor` | Reviews and approves content | Webhook (MR labeled) |
| **Publisher** | `@ossa-publisher` | Merges and deploys content | Schedule (Tue-Thu 9am) |
| **Moderator** | `@ossa-moderator` | Audits content health | Sunday midnight |

## Content Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Research   │────▶│   Author    │────▶│   Editor    │
│   Agent     │     │   Agent     │     │   Agent     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
   Research           Draft MR            Review +
   Brief Issue        Created             Comments
       │                   │                   │
       │                   │                   ▼
       │                   │            ┌─────────────┐
       │                   │            │  Publisher  │
       │                   │            │   Agent     │
       │                   │            └─────────────┘
       │                   │                   │
       │                   │                   ▼
       │                   │              Merged +
       │                   │              Live Site
       │                   │                   │
       │                   │                   ▼
       │                   │            ┌─────────────┐
       │                   │            │  Moderator  │
       │                   └───────────▶│   Agent     │
       └───────────────────────────────▶└─────────────┘
                                              │
                                              ▼
                                          Weekly
                                          Health Report
```

## Setting Up GitLab Service Accounts

### 1. Create Service Accounts

In GitLab, create the following service accounts:

```yaml
# .gitlab/service-accounts.yml (for reference only)
service_accounts:
  - username: ossa-content-orchestrator
    email: orchestrator@openstandardagents.org
    role: Maintainer

  - username: ossa-researcher
    email: researcher@openstandardagents.org
    role: Developer

  - username: ossa-author
    email: author@openstandardagents.org
    role: Developer

  - username: ossa-editor
    email: editor@openstandardagents.org
    role: Developer

  - username: ossa-publisher
    email: publisher@openstandardagents.org
    role: Maintainer

  - username: ossa-moderator
    email: moderator@openstandardagents.org
    role: Reporter
```

### 2. Configure CI/CD Variables

Add these variables in **Settings > CI/CD > Variables**:

| Variable | Description | Protected | Masked |
|----------|-------------|-----------|--------|
| `CONTENT_ORCHESTRATOR_TOKEN` | PAT for @ossa-content-orchestrator | Yes | Yes |
| `RESEARCHER_TOKEN` | PAT for @ossa-researcher | Yes | Yes |
| `AUTHOR_TOKEN` | PAT for @ossa-author | Yes | Yes |
| `EDITOR_TOKEN` | PAT for @ossa-editor | Yes | Yes |
| `PUBLISHER_TOKEN` | PAT for @ossa-publisher | Yes | Yes |
| `MODERATOR_TOKEN` | PAT for @ossa-moderator | Yes | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for LLM calls | Yes | Yes |

### 3. Configure Pipeline Schedules

Create these schedules in **CI/CD > Schedules**:

| Schedule | Cron | Variables |
|----------|------|-----------|
| Research Cycle | `0 6 * * 1,4` | `SCHEDULE_TYPE=research` |
| Publication Window | `0 9 * * 2,3,4` | `SCHEDULE_TYPE=publish` |
| Content Audit | `0 0 * * 0` | `SCHEDULE_TYPE=moderate` |
| Full Cycle | `0 6 * * 1` | `SCHEDULE_TYPE=full-cycle` |

### 4. Configure Webhooks

The agents respond to these webhook events:

- `issue.labeled` with `needs-author` → Triggers Author Agent
- `merge_request.labeled` with `needs-editor-review` → Triggers Editor Agent
- `merge_request.labeled` with `editor-approved` → Triggers Publisher Agent

## Agent Manifests

Each agent is defined by an OSSA v0.3.0 manifest:

- `orchestrator.ossa.yaml` - Content Orchestrator
- `researcher.ossa.yaml` - Research Agent
- `author.ossa.yaml` - Author Agent
- `editor.ossa.yaml` - Editor Agent
- `publisher.ossa.yaml` - Publisher Agent
- `moderator.ossa.yaml` - Moderator Agent

## Content Policies

All agents enforce these policies:

1. **Research-Backed Claims**: Every factual claim must cite a source
2. **Brand Consistency**: Use "Treating Agents as First-Class Citizens" positioning
3. **SEO Requirements**: Meta tags, proper headings, internal links
4. **Schema Validation**: All OSSA YAML examples must validate
5. **Link Health**: No broken internal or external links
6. **Freshness**: Content over 90 days old flagged for review

## Manual Triggers

Trigger agents manually via CI/CD variables:

```bash
# Trigger research cycle
curl -X POST -F "token=$TRIGGER_TOKEN" \
  -F "ref=release/v0.3.x" \
  -F "variables[TRIGGER_RESEARCH]=true" \
  https://gitlab.com/api/v4/projects/.../trigger/pipeline

# Trigger full content cycle
curl -X POST -F "token=$TRIGGER_TOKEN" \
  -F "ref=release/v0.3.x" \
  -F "variables[TRIGGER_FULL_CYCLE]=true" \
  https://gitlab.com/api/v4/projects/.../trigger/pipeline
```

## Monitoring

Content team metrics are reported to:

- **GitLab Issues**: Weekly health reports
- **Discord**: `#content-updates` channel
- **Pipeline Logs**: Full execution traces

Key metrics:
- Content pieces published per week
- Average edit cycles before publication
- Sources cited per article
- Broken links detected
- Content freshness score

## The Living Proof

This system demonstrates OSSA's core value proposition:

> **"Treating Agents as First-Class Citizens"**

The agents that maintain this website have:
- **Identity**: GitLab service accounts with roles
- **Capabilities**: Defined in OSSA manifests
- **Lifecycle**: Scheduled execution, webhook triggers
- **Observability**: Logs, metrics, audit trails
- **Collaboration**: Agent-to-agent handoffs via labels

This is what the future of software looks like.

---

*Maintained by the OSSA Content Team - a living example of agents as first-class citizens.*
