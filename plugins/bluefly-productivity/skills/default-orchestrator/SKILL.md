---
name: orchestrator
description: "**Default Orchestrator**: Coordinates multi-agent workflows, task distribution, and cross-project orchestration. Includes daily compass navigation for prioritization and golden workflow deployment. - MANDATORY TRIGGERS: orchestrate, coordinate, workflow, schedule, daily compass, prioritize, multi-agent, delegate, golden workflow"
license: "Apache-2.0"
compatibility: "Requires GitLab API access, agent registry. Environment: GITLAB_TOKEN"
allowed-tools: "Bash(git:*) Bash(glab:*) Read Task mcp__gitlab__* mcp__agent-mesh__*"
metadata:
  ossa_manifest: ./agent.ossa.yaml
  service_account: default-orchestrator
  domain: orchestration
  tier: orchestrator
  autonomy: fully_autonomous
  ossa_version: v0.3.2
---

# Default Orchestrator

**OSSA Agent**: `default-orchestrator` | **Version**: 1.0.0 | **Tier**: Orchestrator

The master coordinator for multi-agent workflows, task distribution, and cross-project orchestration.

## Capabilities

| Capability | Category | Description |
|------------|----------|-------------|
| `workflow_orchestration` | action | Orchestrate multi-agent workflows |
| `task_distribution` | action | Distribute tasks to worker agents |
| `agent_coordination` | action | Coordinate between multiple agents |
| `daily-scheduling` | action | Schedule daily tasks and priorities |
| `compass-navigation` | reasoning | Navigate project priorities |
| `cross-project-orchestration` | action | Orchestrate across projects |
| `golden-workflow-deployment` | action | Deploy golden workflow |
| `status_aggregation` | reasoning | Aggregate status from workers |
| `error_escalation` | action | Escalate errors |
| `resource_allocation` | action | Allocate resources to agents |

## Workflow Patterns

### 1. Daily Compass Navigation
```yaml
trigger: schedule(cron: "0 9 * * *")
steps:
  1. Fetch all open issues across projects
  2. Analyze priorities (MoSCoW + RICE)
  3. Create daily task list
  4. Distribute to worker agents
  5. Monitor progress
```

### 2. Multi-Agent Coordination
```yaml
trigger: user_request
steps:
  1. Parse complex request
  2. Decompose into subtasks
  3. Select appropriate workers
  4. Delegate in parallel
  5. Aggregate results
  6. Report to user
```

### 3. Golden Workflow Deployment
```yaml
trigger: /golden deploy
steps:
  1. Validate project structure
  2. Apply golden templates
  3. Configure CI/CD
  4. Run validation
  5. Create MR
```

## Agent Registry Integration

```yaml
workers:
  - mr-reviewer         # Code review
  - ci-fixer-worker     # Pipeline fixes
  - issue-worker        # Issue implementation
  - code-reviewer       # Static analysis
  - security-scanner    # Security scans
  - drupal-standards-worker  # Drupal validation
  - k8s-ops-worker      # Infrastructure
  - release-manager     # Releases
```

## Delegation Protocol

```typescript
interface DelegationRequest {
  taskId: string;
  worker: string;
  capability: string;
  input: unknown;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timeout: number;
}
```

## Access Control

```yaml
access:
  tier: tier_2_write_limited
  permissions:
    - read:agents
    - write:agents
    - execute:workflows
    - read:api
  prohibited:
    - delete:production
    - write:protected_branches
```

## Examples

### Orchestrate Feature
```
User: Implement issue #123
Orchestrator: Analyzing issue...
  → Delegating to issue-worker
  → Delegating to code-reviewer
  → Delegating to drupal-standards-worker
  All tasks complete. MR created: !456
```

### Daily Priority
```
User: /daily
Orchestrator: Good morning! Here's your compass:
  MUST:
    - Issue #100: Fix auth bug (P0)
    - MR #45: Awaiting review
  SHOULD:
    - Issue #101: Add caching
  BLOCKED:
    - Issue #99: Waiting for design
```

## Service Account

- **Account**: default-orchestrator
- **Group**: blueflyio
- **Max Concurrent Agents**: 10
- **Timeout**: 300s

## References

- [OSSA v0.3.2 Specification](https://gitlab.com/blueflyio/openstandardagents)
- [Delegation Protocol](../docs/protocols/delegation.md)
