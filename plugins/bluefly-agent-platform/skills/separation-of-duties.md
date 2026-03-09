---
name: separation-of-duties
description: "Role separation policy — 4-tier access, conflict matrix, audit requirements, Cedar enforcement."
triggers:
  - pattern: "separation.*dut|sod|role.*conflict|access.*tier"
    priority: critical
  - pattern: "cedar|policy|approve|review.*own|executor.*reviewer"
    priority: high
  - pattern: "audit|compliance|gate|permit|deny"
    priority: medium
allowed-tools:
  - Read
  - Bash
---

# Separation of Duties

## Core Principle

**No agent can review, approve, or validate its own work.** This is enforced at three levels: OSSA manifest declarations, Cedar policy gates, and runtime mesh routing.

## 4-Tier Access Model

```
tier_4_policy (Approver)     ← Sets rules, approves releases
tier_3_full (Executor)       ← Writes code, runs deploys
tier_2_write (Reviewer)      ← Reviews, comments, labels
tier_1_read (Analyzer)       ← Reads, scans, reports
```

### Tier Permissions Matrix

| Action | Analyzer | Reviewer | Executor | Approver |
|--------|----------|----------|----------|----------|
| Read source code | ✅ | ✅ | ✅ | ✅ |
| Scan artifacts | ✅ | ✅ | ✅ | ✅ |
| Generate reports | ✅ | ✅ | ✅ | ✅ |
| Comment on MRs | ❌ | ✅ | ✅ | ✅ |
| Update issues | ❌ | ✅ | ✅ | ✅ |
| Label/assign | ❌ | ✅ | ✅ | ✅ |
| Push code | ❌ | ❌ | ✅ | ❌ |
| Merge MRs | ❌ | ❌ | ✅ | ✅ |
| Run deploys | ❌ | ❌ | ✅ | ❌ |
| Approve MRs | ❌ | ❌ | ❌ | ✅ |
| Override gates | ❌ | ❌ | ❌ | ✅ |
| Set policy | ❌ | ❌ | ❌ | ✅ |

## Conflict Matrix

| Role A | Role B | Allowed in Same Chain? | Reason |
|--------|--------|----------------------|--------|
| Analyzer | Reviewer | ✅ | Different concerns |
| Analyzer | Executor | ❌ | Analyzer findings could be biased toward own execution |
| Analyzer | Approver | ❌ | Analyzer could suppress findings to ease approval |
| Reviewer | Executor | ❌ | Cannot review own code |
| Reviewer | Approver | ✅ | Reviewer recommends, Approver decides |
| Executor | Approver | ❌ | Cannot approve own deployment |

### Chain Examples

**Valid Chain:**
```
vulnerability-scanner (Analyzer) → merge-request-reviewer (Reviewer) → pipeline-remediation (Executor) → release-coordinator (Approver)
```

**INVALID Chains:**
```
❌ code-reviewer (Reviewer) → code-reviewer (Reviewer)     # Self-review
❌ pipeline-remediation (Executor) → pipeline-remediation   # Self-approve
❌ vulnerability-scanner (Analyzer) → pipeline-remediation (Executor)  # Analyzer→Executor
```

## Cedar Policy Enforcement

Cedar policies in `security-policies/` repo enforce SoD at the GATE step:

```cedar
// Block self-review
forbid(
  principal,
  action == Action::"review",
  resource
) when {
  principal.agent_id == resource.author_agent_id
};

// Block Executor from Approving in same chain
forbid(
  principal in Group::"executors",
  action == Action::"approve",
  resource
) when {
  resource.executor_agent_id == principal.agent_id
};

// Block Analyzer from Executing
forbid(
  principal in Group::"analyzers",
  action == Action::"execute",
  resource
) when {
  resource.analysis_agent_id == principal.agent_id
};

// Require different agents for each phase
forbid(
  principal,
  action == Action::"deploy",
  resource
) when {
  resource.review_agent_id == resource.build_agent_id ||
  resource.approve_agent_id == resource.build_agent_id ||
  resource.approve_agent_id == resource.review_agent_id
};
```

### Gate Decisions

| Decision | Meaning | SoD Implication |
|----------|---------|-----------------|
| PERMIT | All policies pass, no conflicts | Proceed to ROLLOUT |
| DENY | Policy violation detected | Return with conflict details |
| ESCALATE | Needs human review | Notify human approver |

## Runtime Enforcement (Agent Mesh)

The Agent Mesh (port 3005) enforces SoD at routing time:

1. **Request arrives** with `agent_id` and `action`
2. **Mesh checks** conflict matrix against chain history
3. **If conflict**: Request rejected with `409 Conflict` + reason
4. **If clean**: Request routed to target agent
5. **Audit log**: Every decision recorded in Compliance Engine

```bash
# Check SoD violations in audit log
curl "https://compliance.blueflyagents.com/api/audit?type=sod_violation"

# View conflict matrix
buildkit agents conflicts --agent vulnerability-scanner

# Validate a proposed chain
buildkit agents validate-chain \
  --analyzer vulnerability-scanner \
  --reviewer merge-request-reviewer \
  --executor pipeline-remediation \
  --approver release-coordinator
```

## Agent Role Assignments (Production)

| Agent | Role | Tier | Conflicts With |
|-------|------|------|----------------|
| vulnerability-scanner | Analyzer | tier_1_read | Executor, Approver |
| secret-detector | Analyzer | tier_1_read | Executor, Approver |
| dependency-auditor | Analyzer | tier_1_read | Executor, Approver |
| code-reviewer | Reviewer | tier_2_write | Executor, Approver |
| merge-request-reviewer | Reviewer | tier_2_write | Executor, Approver |
| linter-orchestrator | Reviewer | tier_2_write | Executor, Approver |
| pipeline-remediation | Executor | tier_3_full | Reviewer, Approver |
| deploy-orchestrator | Executor | tier_3_full | Reviewer, Approver |
| infra-provisioner | Executor | tier_3_full | Reviewer, Approver |
| release-coordinator | Approver | tier_4_policy | Analyzer, Executor |
| change-approver | Approver | tier_4_policy | Analyzer, Executor |
| policy-enforcer | Approver | tier_4_policy | Analyzer, Executor |

## Service Account

- **GitLab Service Account ID**: 32706577
- **Username**: `bluefly-agent-service`
- **Used by**: All tier_2+ agents for GitLab API operations
- **Token scope**: `api`, `read_repository`, `write_repository`
- **Token variable**: `GITLAB_TOKEN` (in CI/CD variables)

## Audit Requirements

### What Gets Logged
- Every gate decision (PERMIT/DENY/ESCALATE)
- Every SoD conflict detection
- Every role assignment change
- Every policy modification
- Every human override

### Retention
- Gate decisions: 1 year
- SoD violations: 2 years
- Policy changes: Indefinite

### Compliance Queries
```bash
# All SoD events last 30 days
curl "https://compliance.blueflyagents.com/api/audit?type=sod&window=30d"

# Violations by agent
curl "https://compliance.blueflyagents.com/api/audit?type=sod_violation&agent=pipeline-remediation"

# Human overrides
curl "https://compliance.blueflyagents.com/api/audit?type=human_override&window=7d"

# Via BuildKit
buildkit observe compliance --sod --window 30d
buildkit observe compliance --violations
```
