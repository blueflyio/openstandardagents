# OSSA GitLab Duo Platform Integration

**Version**: 0.2.9
**Status**: Draft
**Last Updated**: 2025-12-04

This document specifies the integration between OSSA agents and GitLab Ultimate's Duo Platform.

## Overview

OSSA agents integrate with GitLab through:
1. **AgentFlow** - Issue lifecycle states for agent-driven workflows
2. **Custom Fields** - Metadata for routing and tracking
3. **Duo Platform** - Agent registry, execution UI, and observability
4. **AutoDevOps** - Automated CI/CD integration

---

## AgentFlow Lifecycle

### Issue States

```
┌─────────────────────────────────────────────────────────────────┐
│                      AGENTFLOW LIFECYCLE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌────────┐    ┌────────┐    ┌─────────────┐    ┌────────┐    │
│   │ Triage │───▶│ To Do  │───▶│ In Progress │───▶│  Done  │    │
│   └────────┘    └────────┘    └─────────────┘    └────────┘    │
│                                      │                │         │
│                                      ▼                ▼         │
│                               ┌─────────────┐  ┌──────────┐    │
│                               │  Blocked    │  │ Canceled │    │
│                               └─────────────┘  └──────────┘    │
│                                                                  │
│   In Progress Sub-States:                                        │
│   ┌────────────┐  ┌────────────┐  ┌────────┐  ┌────────┐       │
│   │ Validation │  │   Review   │  │ Merged │  │ Blocked│       │
│   └────────────┘  └────────────┘  └────────┘  └────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### State Definitions

| State | Description | Agent Behavior |
|-------|-------------|----------------|
| `Triage` | Unassigned, needs routing | Meta-orchestrator routes to agent |
| `To Do` | Assigned, queued | Agent acknowledges, adds to backlog |
| `In Progress` | Agent working | Active processing |
| `Validation` | Code complete, testing | Security-healer triggers scans |
| `Review` | MR created, awaiting review | Wiki-aggregator updates docs |
| `Merged` | MR merged to development | Release agents prepare changelog |
| `Blocked` | Dependency or external block | Agent escalates to human |
| `Done` | Completed successfully | Agent updates metrics |
| `Canceled` | Will not do | Agent logs reason |

### State Transitions

```yaml
transitions:
  triage:
    allowed_next: [to_do, canceled]
    agent_action: route_to_specialist

  to_do:
    allowed_next: [in_progress, blocked, canceled]
    agent_action: acknowledge_and_plan

  in_progress:
    allowed_next: [validation, review, blocked, done, canceled]
    agent_action: execute_task

  validation:
    allowed_next: [review, in_progress, blocked]
    agent_action: run_security_scans

  review:
    allowed_next: [merged, in_progress, blocked]
    agent_action: update_documentation

  merged:
    allowed_next: [done]
    agent_action: prepare_release

  blocked:
    allowed_next: [in_progress, to_do, canceled]
    agent_action: escalate_to_human

  done:
    allowed_next: []
    agent_action: finalize_metrics

  canceled:
    allowed_next: []
    agent_action: log_cancellation_reason
```

---

## Custom Fields

### Field Definitions

| Field | Type | Scope | Values | Description |
|-------|------|-------|--------|-------------|
| `agent_assigned` | Single Select | Epic, Issue | 12 agents | Which agent owns this |
| `agent_status` | Single Select | Epic, Issue | 5 states | Agent-specific status |
| `commit_type` | Single Select | Epic, Issue | 10 types | Content classification |
| `codeowner` | Text | Issue | @username | Human owner |
| `priority` | Single Select | Issue, Epic, Task | P0-P3 | Urgency level |
| `release_type` | Single Select | Epic, Issue | 4 types | Release classification |
| `release_version` | Text | Issue | semver | Target version |
| `bot_wave` | Single Select | Issue, Task | 5 waves | Execution wave |

### Agent Assignment Values

```yaml
agent_assigned:
  - wiki-aggregator
  - ts-prod
  - ts-local
  - ossa-local
  - native-local
  - ml-prod
  - ml-local
  - infra-prod
  - gitlab-lib-ci
  - gitlab-lib-local
  - drupal-prod
  - drupal-local
```

### Commit Type Values

```yaml
commit_type:
  - drupal       # Drupal modules, themes, recipes
  - ts           # TypeScript/JavaScript
  - gitlab-lib   # GitLab CI/CD
  - ml           # Machine learning, AI
  - infra        # Infrastructure, Kubernetes
  - ossa         # OSSA manifests
  - docs         # Documentation
  - native       # Native code (Rust, Go, C)
  - security     # Security-related
  - release      # Release automation
```

### Bot Wave Values

```yaml
bot_wave:
  - wave_1_compilation  # Local validation
  - wave_2_production   # Production deployment
  - wave_3_review       # Quality and security
  - wave_4_release      # Versioning and release
  - wave_5_docs         # Documentation sync
```

---

## Agent Registry

### 12 OSSA Agents

| ID | Handle | Category | Wave | Triggers |
|----|--------|----------|------|----------|
| `wiki-aggregator` | @bot-wiki-aggregator | Docs | 5 | merge, schedule |
| `ts-prod` | @bot-ts-prod | Language | 2 | status=Validation |
| `ts-local` | @bot-ts-local | Language | 1 | commit, mention |
| `ossa-local` | @bot-ossa-local | OSSA | 1 | commit (*.ossa.yaml) |
| `native-local` | @bot-native-local | Native | 1 | commit (*.rs, *.go) |
| `ml-prod` | @bot-ml-prod | ML | 2 | status=Validation |
| `ml-local` | @bot-ml-local | ML | 1 | commit (*.py, *.ipynb) |
| `infra-prod` | @bot-infra-prod | Infra | 2 | commit (k8s/, terraform/) |
| `gitlab-lib-ci` | @bot-gitlab-lib-ci | GitLab | 2 | pipeline_failure |
| `gitlab-lib-local` | @bot-gitlab-lib-local | GitLab | 1 | commit (.gitlab-ci.yml) |
| `drupal-prod` | @bot-drupal-prod | Drupal | 2 | status=Validation |
| `drupal-local` | @bot-drupal-local | Drupal | 1 | commit (*.php, *.module) |

### Routing Matrix

```yaml
routing:
  # File pattern → Agent chain
  "**/*.php":
    - drupal-local
    - drupal-prod

  "**/*.module":
    - drupal-local
    - drupal-prod

  "**/*.ts":
    - ts-local
    - ts-prod

  "**/*.tsx":
    - ts-local
    - ts-prod

  ".gitlab-ci.yml":
    - gitlab-lib-local
    - gitlab-lib-ci

  ".gitlab/**/*.yml":
    - gitlab-lib-local
    - gitlab-lib-ci

  "**/*.py":
    - ml-local
    - ml-prod

  "**/*.ipynb":
    - ml-local
    - ml-prod

  "**/*.rs":
    - native-local

  "**/*.go":
    - native-local

  "**/*.ossa.yaml":
    - ossa-local

  "k8s/**":
    - infra-prod

  "terraform/**":
    - infra-prod

  "**/*.md":
    - wiki-aggregator

  "docs/**":
    - wiki-aggregator
```

---

## Bot Waves

### Wave Execution

```
┌─────────────────────────────────────────────────────────────────┐
│                        BOT WAVE EXECUTION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Wave 1: COMPILATION                                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ts-local │ │gitlab-  │ │drupal-  │ │ml-local │ │ossa-    │   │
│  │         │ │lib-local│ │local    │ │         │ │local    │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
│       │           │           │           │           │         │
│       ▼           ▼           ▼           ▼           ▼         │
│  Wave 2: PRODUCTION                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ts-prod  │ │gitlab-  │ │drupal-  │ │ml-prod  │ │infra-   │   │
│  │         │ │lib-ci   │ │prod     │ │         │ │prod     │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
│       │           │           │           │           │         │
│       ▼           ▼           ▼           ▼           ▼         │
│  Wave 3: REVIEW                                                  │
│  ┌─────────────────┐ ┌─────────────────┐                        │
│  │ security-healer │ │ wiki-aggregator │                        │
│  └────────┬────────┘ └────────┬────────┘                        │
│           │                   │                                  │
│           ▼                   ▼                                  │
│  Wave 4: RELEASE                                                 │
│  ┌─────────────────────────────────────┐                        │
│  │         release automation          │                        │
│  └─────────────────┬───────────────────┘                        │
│                    │                                             │
│                    ▼                                             │
│  Wave 5: DOCS                                                    │
│  ┌─────────────────────────────────────┐                        │
│  │         wiki-aggregator             │                        │
│  └─────────────────────────────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Wave Configuration

```yaml
waves:
  wave_1_compilation:
    agents:
      - ts-local
      - gitlab-lib-local
      - drupal-local
      - ml-local
      - ossa-local
      - native-local
    trigger: commit
    parallel: true
    timeout_minutes: 10
    on_failure: block_next_wave

  wave_2_production:
    agents:
      - ts-prod
      - gitlab-lib-ci
      - drupal-prod
      - ml-prod
      - infra-prod
    trigger: wave_1_complete
    parallel: true
    timeout_minutes: 30
    on_failure: rollback

  wave_3_review:
    agents:
      - security-healer
      - wiki-aggregator
    trigger: wave_2_complete
    parallel: true
    timeout_minutes: 15
    on_failure: create_incident

  wave_4_release:
    agents:
      - release-automation
    trigger: status=merged
    parallel: false
    timeout_minutes: 10
    on_failure: notify_maintainers

  wave_5_docs:
    agents:
      - wiki-aggregator
    trigger: wave_4_complete
    parallel: false
    timeout_minutes: 5
    on_failure: log_warning
```

---

## Duo Platform Integration

### API Endpoints

```yaml
duo_platform:
  base_url: /automate/ossa-agents

  endpoints:
    # Agent Registry
    list:
      method: GET
      path: /
      response: AgentRegistryList

    detail:
      method: GET
      path: /:agent_id
      response: AgentDetail

    # Execution
    execute:
      method: POST
      path: /:agent_id/execute
      body: ExecuteRequest
      response: ExecutionResult

    # Observability
    metrics:
      method: GET
      path: /:agent_id/metrics
      response: AgentMetrics

    logs:
      method: GET
      path: /:agent_id/logs
      query:
        since: ISO8601
        until: ISO8601
        level: LogLevel
      response: LogStream

    traces:
      method: GET
      path: /:agent_id/traces
      query:
        trace_id: string
      response: TraceSpans
```

### Registry Schema

```typescript
interface AgentRegistryEntry {
  id: string;
  name: string;
  handle: string;                // @bot-<name>
  category: AgentCategory;
  wave: WaveNumber;
  version: string;
  status: 'active' | 'degraded' | 'inactive';
  manifest_url: string;
  metrics: {
    executions_24h: number;
    success_rate: number;
    avg_duration_ms: number;
  };
}

type AgentCategory =
  | 'language'
  | 'infrastructure'
  | 'security'
  | 'documentation'
  | 'release'
  | 'orchestrator';

type WaveNumber = 1 | 2 | 3 | 4 | 5;
```

### Execution UI

```yaml
execution_ui:
  path: /automate/ossa-agents/:agent_id/execute

  features:
    - input_form          # Dynamic form from agent input_schema
    - dry_run_toggle      # Test without side effects
    - live_output         # Streaming execution output
    - trace_viewer        # OpenTelemetry trace visualization
    - metrics_dashboard   # Real-time metrics
    - approval_workflow   # For privileged operations
```

---

## AutoDevOps Integration

### Security Scanning

```yaml
autodevops:
  security:
    # Triggered by security-healer
    sast:
      enabled: true
      analyzer: semgrep

    dast:
      enabled: true
      target: review_app

    secret_detection:
      enabled: true
      historic: true

    container_scanning:
      enabled: true
      registry: $CI_REGISTRY

    dependency_scanning:
      enabled: true
      analyzers:
        - gemnasium
        - retire.js
```

### Agent CI Jobs

```yaml
# .gitlab-ci.yml agent jobs
.ossa-agent-job:
  image: ossa/agent-runner:latest
  variables:
    OSSA_AGENT_ID: ${AGENT_ID}
    OTEL_EXPORTER_OTLP_ENDPOINT: ${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/observability/v1/traces
  script:
    - ossa run --agent ${OSSA_AGENT_ID} --input "${AGENT_INPUT}"
  artifacts:
    reports:
      ossa: agent-report.json

agent:drupal-local:
  extends: .ossa-agent-job
  variables:
    AGENT_ID: drupal-local
  rules:
    - if: $CI_COMMIT_BRANCH
      changes:
        - "**/*.php"
        - "**/*.module"

agent:ts-local:
  extends: .ossa-agent-job
  variables:
    AGENT_ID: ts-local
  rules:
    - if: $CI_COMMIT_BRANCH
      changes:
        - "**/*.ts"
        - "**/*.tsx"
```

---

## Context Injection

### Documentation Context

```yaml
context_injection:
  # 400+ pages of documentation injected into agent context
  sources:
    - technical-docs-wiki
    - api-schema-registry
    - ossa-specification

  max_tokens: 100000

  priority:
    - relevant_to_file_type    # Highest
    - recent_changes
    - frequently_referenced
    - architecture_overview    # Lowest
```

### Tool Approval Workflows

```yaml
tool_approval:
  # Operations requiring human approval
  privileged_operations:
    - apply_patches
    - create_incidents
    - block_merge
    - scale_agents
    - update_production

  approval_flow:
    method: gitlab_approval
    required_approvers: 1
    timeout_minutes: 60

  bypass_conditions:
    - severity: critical
      auto_approve: true
      notify: security-team
```

---

## OSSA Extension Schema

```yaml
# Agent manifest extension for GitLab
extensions:
  gitlab:
    # Event triggers
    triggers:
      - event: commit | merge | schedule | status_change | security_alert | mention
        branches: [string]
        status: string
        cron: string

    # Custom field mappings
    custom_fields:
      agent_assigned: string
      bot_wave: string

    # Merge request controls
    merge_blocking:
      enabled: boolean
      condition: string  # e.g., "cvss >= 7.0"

    # Duo Platform registration
    duo_platform:
      route: string      # /automate/ossa-agents
      registry_endpoint: string
      execution_ui: string
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] AgentFlow status definitions in GitLab
- [ ] Custom fields created
- [ ] Agent registry API implemented
- [ ] Meta-orchestrator deployed

### Phase 2: Agents
- [ ] All 12 agents deployed
- [ ] Routing logic implemented
- [ ] Wave coordination working
- [ ] A2A messaging functional

### Phase 3: Integration
- [ ] Duo Platform UI connected
- [ ] Observability flowing to GitLab
- [ ] AutoDevOps security scanning
- [ ] Context injection working

### Phase 4: Optimization
- [ ] Performance tuning
- [ ] Cost optimization
- [ ] Documentation complete
- [ ] Training materials

---

## References

- [GitLab Duo Platform](https://docs.gitlab.com/ee/development/duo/)
- [OSSA Specification v0.2.9](./ossa-0.2.9.schema.json)
- [Meta Orchestrator Agent](../.agents/orchestrators/meta-orchestrator/agent.yml)
- [Security Healer Agent](../.agents/workers/security-healer/agent.yml)
