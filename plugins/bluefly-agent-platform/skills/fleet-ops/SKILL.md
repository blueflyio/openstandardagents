---
name: fleet-ops
description: "Fleet change control plane — 7-step flow, Cedar policy gates, recipe onboarding, closed-loop autopilot."
triggers:
  - pattern: "fleet|change.*control|rollout|canary|promote"
    priority: critical
  - pattern: "cedar|policy|gate|approval|recipe"
    priority: high
  - pattern: "deploy.*fleet|onboard.*agent|autopilot"
    priority: medium
allowed-tools:
  - Read
  - Bash
  - WebFetch
---

# Fleet Change Control Plane

## 7-Step Flow

```
DESCRIBE → GENERATE → CLASSIFY → GATE → ROLLOUT → VERIFY → PULSE
```

### Step Details

| Step | What | Service | Output |
|------|------|---------|--------|
| 1. DESCRIBE | Human describes intent | Agent Studio | Change request JSON |
| 2. GENERATE | AI generates change plan | Workflow Engine | Execution plan |
| 3. CLASSIFY | Auto-classify risk | Compliance Engine | Risk level (low/med/high/critical) |
| 4. GATE | Cedar policy evaluation | Compliance Engine | PERMIT / DENY + reasons |
| 5. ROLLOUT | Execute with strategy | Orchestrator | Rollout status |
| 6. VERIFY | Post-deploy validation | A2A Collector | Health + metrics |
| 7. PULSE | Continuous monitoring | A2A Stream | Drift alerts |

## Cedar Policy Gates

Cedar policies evaluate at step 4. Policies live in `security-policies/` repo.

```cedar
// Example: Block high-risk deploys without approval
forbid(
  principal in Group::"agents",
  action == Action::"deploy",
  resource
) when {
  resource.risk_level == "critical" &&
  !context.has_approval_from(Group::"approvers")
};
```

### Gate Decisions
| Decision | Meaning | Next Action |
|----------|---------|-------------|
| PERMIT | All policies pass | Proceed to ROLLOUT |
| DENY | Policy violation | Return to DESCRIBE with reasons |
| ESCALATE | Needs human approval | Notify approver, wait |

## Rollout Strategies

| Strategy | Use When | Config |
|----------|----------|--------|
| Canary | Production services | `strategy: canary, percentage: 5, duration: 15m` |
| Blue-Green | Stateless services | `strategy: blue-green, swap_after: healthy` |
| Rolling | K8s deployments | `strategy: rolling, max_unavailable: 25%` |
| Immediate | Dev/staging | `strategy: immediate` |

## Recipe Onboarding

Recipes automate agent onboarding to the fleet:

```bash
# Create a new recipe
buildkit fleet recipe create \
  --agent vulnerability-scanner \
  --trigger "on:merge_request" \
  --action "scan:dependencies"

# List recipes
buildkit fleet recipe list

# Apply a recipe
buildkit fleet recipe apply <recipe-id>

# Validate recipe
buildkit fleet recipe validate <recipe-id>
```

### Recipe Structure
```yaml
recipe:
  id: "scan-on-mr"
  agent: "vulnerability-scanner"
  trigger:
    event: "merge_request"
    conditions:
      - "source_branch != 'main'"
  actions:
    - scan: "dependencies"
    - scan: "secrets"
    - report: "mr-comment"
  policy:
    gate: "security-scan-gate"
    escalate_on: "critical"
```

## Closed-Loop Autopilot

When enabled, PULSE feeds back into DESCRIBE automatically:

```
PULSE detects drift → auto-DESCRIBE correction → GENERATE fix → CLASSIFY → GATE → ROLLOUT → VERIFY
```

### Autopilot Guardrails
- Max 3 auto-corrections per hour
- Critical changes always require human approval
- Auto-rollback if VERIFY fails 2x consecutively
- Budget cap: `FLEET_BUDGET_DAILY_USD` env var

## Services Used

| Service | URL | Role in Fleet |
|---------|-----|---------------|
| Orchestrator | https://orchestrator.blueflyagents.com | Executes rollout plans |
| Compliance Engine | https://compliance.blueflyagents.com | Cedar policy evaluation |
| Workflow Engine | https://workflow.blueflyagents.com | State machine for flows |
| A2A Collector | https://a2a-collector.blueflyagents.com | Post-deploy verification |
| A2A Stream | https://a2a-stream.blueflyagents.com | Continuous PULSE monitoring |
| Agent Router | https://router.blueflyagents.com | Traffic shifting for canary |

## Commands

```bash
# Fleet status
buildkit fleet status
buildkit fleet status --service agents-api

# Change control
buildkit fleet change describe "Update vulnerability-scanner to v2.1"
buildkit fleet change classify <change-id>
buildkit fleet change approve <change-id>
buildkit fleet change rollout <change-id>

# Monitoring
buildkit fleet pulse --watch
buildkit fleet pulse --service agents-api --window 1h
```
