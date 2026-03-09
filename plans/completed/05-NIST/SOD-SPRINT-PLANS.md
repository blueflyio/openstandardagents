# Separation of Duties — Sprint Execution Plans

**Scope:** Full rewrite of SOD enforcement across the Bluefly Agent Platform
**Format:** 8 one-week sprints, machine-parseable, targeting AI coding agents
**Audience:** Claude Code, Cursor Agent, Gemini CLI, Codex, Antigravity, Cursor IDE
**Verification:** GitLab Ultimate DAP, `gitlab_components`, `security_policies`
**Cedar Policies:** `compliance-engine` repo + `/Users/flux423/.agent-platform/ide-supercharger/cedar-policies`

---

## Sprint 1 — Tier Model & Route Schema

**Duration:** 1 week
**Projects:** `platform-agents`, `agent-mesh`, `agent-router`
**Outcome:** Canonical tier definitions, route schema with SOD metadata, unit tests passing

### Tasks

#### 1.1 Define Tier Enum and Permissions Matrix

- **File:** `common_npm/agent-mesh/src/sod/tiers.ts`
- **Action:** CREATE
- **Content:**

```typescript
export enum AgentTier {
  ANALYZER = 'T1',
  REVIEWER = 'T2',
  EXECUTOR = 'T3',
  APPROVER = 'T4',
}

export interface TierPermissions {
  tier: AgentTier;
  canRead: boolean;
  canWrite: boolean;
  canExecute: boolean;
  canApprove: boolean;
  canDeploy: boolean;
  canReview: boolean;
  canAnalyze: boolean;
  canCreateMR: boolean;
  canMergeMR: boolean;
  canTagRelease: boolean;
  canModifyPipeline: boolean;
  canAccessSecrets: boolean;
}

export const TIER_PERMISSIONS: Record<AgentTier, TierPermissions> = {
  [AgentTier.ANALYZER]: {
    tier: AgentTier.ANALYZER,
    canRead: true, canWrite: false, canExecute: false, canApprove: false,
    canDeploy: false, canReview: false, canAnalyze: true, canCreateMR: false,
    canMergeMR: false, canTagRelease: false, canModifyPipeline: false, canAccessSecrets: false,
  },
  [AgentTier.REVIEWER]: {
    tier: AgentTier.REVIEWER,
    canRead: true, canWrite: false, canExecute: false, canApprove: false,
    canDeploy: false, canReview: true, canAnalyze: true, canCreateMR: false,
    canMergeMR: false, canTagRelease: false, canModifyPipeline: false, canAccessSecrets: false,
  },
  [AgentTier.EXECUTOR]: {
    tier: AgentTier.EXECUTOR,
    canRead: true, canWrite: true, canExecute: true, canApprove: false,
    canDeploy: true, canReview: false, canAnalyze: false, canCreateMR: true,
    canMergeMR: false, canTagRelease: false, canModifyPipeline: true, canAccessSecrets: true,
  },
  [AgentTier.APPROVER]: {
    tier: AgentTier.APPROVER,
    canRead: true, canWrite: false, canExecute: false, canApprove: true,
    canDeploy: false, canReview: true, canAnalyze: true, canCreateMR: false,
    canMergeMR: true, canTagRelease: true, canModifyPipeline: false, canAccessSecrets: false,
  },
};
```

#### 1.2 Define Conflict Matrix

- **File:** `common_npm/agent-mesh/src/sod/conflicts.ts`
- **Action:** CREATE
- **Content:**

```typescript
import { AgentTier } from './tiers';

export interface ConflictRule {
  source: AgentTier;
  target: AgentTier;
  allowed: boolean;
  reason?: string;
}

export const CONFLICT_MATRIX: ConflictRule[] = [
  { source: AgentTier.ANALYZER, target: AgentTier.REVIEWER, allowed: true },
  { source: AgentTier.ANALYZER, target: AgentTier.EXECUTOR, allowed: false, reason: 'Analyzer cannot execute — segregation of analysis and action' },
  { source: AgentTier.ANALYZER, target: AgentTier.APPROVER, allowed: false, reason: 'Analyzer cannot approve — prevents self-validation' },
  { source: AgentTier.REVIEWER, target: AgentTier.EXECUTOR, allowed: false, reason: 'Reviewer cannot execute — prevents review-then-act by same agent' },
  { source: AgentTier.REVIEWER, target: AgentTier.APPROVER, allowed: true },
  { source: AgentTier.EXECUTOR, target: AgentTier.APPROVER, allowed: false, reason: 'Executor cannot approve own work' },
];

export function isConflict(source: AgentTier, target: AgentTier): { conflict: boolean; reason?: string } {
  const rule = CONFLICT_MATRIX.find(r => r.source === source && r.target === target);
  if (!rule) return { conflict: false };
  return { conflict: !rule.allowed, reason: rule.reason };
}
```

#### 1.3 Define Route Schema with SOD Metadata

- **File:** `common_npm/agent-router/src/sod/route-schema.ts`
- **Action:** CREATE
- **Content:**

```typescript
import { AgentTier } from '@bluefly/agent-mesh/sod/tiers';

export interface SODRouteMetadata {
  requiredTier: AgentTier;
  allowedTiers: AgentTier[];
  requiresDifferentAgent: boolean;
  previousActors: string[]; // agent_ids that already acted in this chain
  workflowId: string;
  phase: 'analysis' | 'review' | 'execution' | 'approval';
}

export interface GateDecision {
  decision: 'PERMIT' | 'DENY' | 'ESCALATE';
  reason: string;
  sourceAgent: string;
  targetAgent: string;
  sourceTier: AgentTier;
  targetTier: AgentTier;
  workflowId: string;
  timestamp: string;
}
```

#### 1.4 Unit Tests for Tier Model and Conflicts

- **File:** `common_npm/agent-mesh/src/sod/__tests__/tiers.test.ts`
- **Action:** CREATE
- **Test cases:**
  - Each tier has exactly the correct permissions
  - Analyzer↔Executor is a conflict
  - Analyzer↔Approver is a conflict
  - Reviewer↔Executor is a conflict
  - Executor↔Approver is a conflict
  - Analyzer↔Reviewer is NOT a conflict
  - Reviewer↔Approver is NOT a conflict

#### 1.5 Export Barrel

- **File:** `common_npm/agent-mesh/src/sod/index.ts`
- **Action:** CREATE
- **Content:**

```typescript
export * from './tiers';
export * from './conflicts';
```

### Verification

```bash
# From agent-mesh worktree
cd $HOME/Sites/blueflyio/worktrees/common_npm/agent-mesh
npm run test -- --grep "sod"
npm run build
# Confirm no type errors
npx tsc --noEmit
```

### Branch & MR

```bash
# Branch naming convention
git checkout -b 1-sod-tier-model-route-schema release/v0.1.x
git add src/sod/
git commit -m "feat: add SOD tier model, conflict matrix, route schema"
buildkit git push
buildkit gitlab mr create --title "Sprint 1: SOD tier model and route schema" --target release/v0.1.x
```

---

## Sprint 2 — Project Ownership & GitLab Branch Protection

**Duration:** 1 week
**Projects:** All 12 `@bluefly/*` packages, GitLab group settings
**Outcome:** CODEOWNERS files, branch protection rules, MR approval rules enforced across all 12 packages

### Tasks

#### 2.1 Create CODEOWNERS for All 12 Packages

- **Action:** CREATE one `CODEOWNERS` file per package repo
- **Packages and Owners:**

| Package | Owner (GitLab username) | Tier |
|---------|------------------------|------|
| `agent-brain` | `@bluefly-agent-service` | T3 Executor |
| `agent-docker` | `@bluefly-agent-service` | T3 Executor |
| `agent-mesh` | `@bluefly-agent-service` | T3 Executor |
| `agent-protocol` | `@bluefly-agent-service` | T3 Executor |
| `agent-router` | `@bluefly-agent-service` | T3 Executor |
| `agent-tailscale` | `@bluefly-agent-service` | T3 Executor |
| `agent-tracer` | `@bluefly-agent-service` | T1 Analyzer |
| `workflow-engine` | `@bluefly-agent-service` | T3 Executor |
| `foundation-bridge` | `@bluefly-agent-service` | T3 Executor |
| `compliance-engine` | `@bluefly-agent-service` | T4 Approver |
| `agentic-flows` | `@bluefly-agent-service` | T3 Executor |
| `studio-ui` | `@bluefly-agent-service` | T3 Executor |

- **File template** (e.g., `common_npm/agent-mesh/CODEOWNERS`):

```
# SOD: agent-mesh owned by Executor tier
# Changes require MR approval from a different-tier agent
* @bluefly-agent-service
```

#### 2.2 GitLab Branch Protection Rules

- **Action:** Apply via GitLab API for each project
- **Script:** `scripts/sod/apply-branch-protection.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
# Requires: GITLAB_TOKEN, GITLAB_API_URL

PROJECTS=(
  "blueflyio/common_npm/agent-brain"
  "blueflyio/common_npm/agent-docker"
  "blueflyio/common_npm/agent-mesh"
  "blueflyio/common_npm/agent-protocol"
  "blueflyio/common_npm/agent-router"
  "blueflyio/common_npm/agent-tailscale"
  "blueflyio/common_npm/agent-tracer"
  "blueflyio/common_npm/workflow-engine"
  "blueflyio/common_npm/foundation-bridge"
  "blueflyio/common_npm/compliance-engine"
  "blueflyio/common_npm/agentic-flows"
  "blueflyio/common_npm/studio-ui"
)

for PROJECT in "${PROJECTS[@]}"; do
  ENCODED=$(echo "$PROJECT" | sed 's|/|%2F|g')

  # Protect release branches — no direct push, MR required
  curl -s --request PUT \
    --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "${GITLAB_API_URL}/projects/${ENCODED}/protected_branches/release%2F*" \
    --data "push_access_level=0&merge_access_level=40&allow_force_push=false&code_owner_approval_required=true"

  # Protect main — no direct push, MR required, code owner approval
  curl -s --request PUT \
    --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "${GITLAB_API_URL}/projects/${ENCODED}/protected_branches/main" \
    --data "push_access_level=0&merge_access_level=40&allow_force_push=false&code_owner_approval_required=true"

  echo "✅ Protected branches for $PROJECT"
done
```

#### 2.3 MR Approval Rules

- **Action:** Apply via GitLab API — require 1 approval from a different tier
- **Script:** `scripts/sod/apply-approval-rules.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

for PROJECT in "${PROJECTS[@]}"; do
  ENCODED=$(echo "$PROJECT" | sed 's|/|%2F|g')

  curl -s --request POST \
    --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "${GITLAB_API_URL}/projects/${ENCODED}/approval_rules" \
    --data "name=SOD+Different+Tier+Required&approvals_required=1&rule_type=regular"

  echo "✅ Approval rule for $PROJECT"
done
```

#### 2.4 Version Authority Enforcement

- **File:** `common_npm/compliance-engine/src/sod/version-authority.ts`
- **Action:** CREATE
- **Content:**

```typescript
/**
 * Version Authority Chain:
 *   HUMAN (milestone) → CI PIPELINE (semantic-release) → GIT TAG (output)
 * AI agents are READ-ONLY for version numbers.
 * Only CI pipelines (semantic-release) may create git tags.
 */
export const VERSION_AUTHORITY = {
  milestone: 'HUMAN',
  semanticRelease: 'CI_PIPELINE',
  gitTag: 'CI_PIPELINE_OUTPUT',
  agentRole: 'READ_ONLY',
} as const;

export function validateVersionSource(source: string): boolean {
  return source === 'CI_PIPELINE';
}
```

### Verification

```bash
# Verify branch protection via API
for PROJECT in "${PROJECTS[@]}"; do
  ENCODED=$(echo "$PROJECT" | sed 's|/|%2F|g')
  curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "${GITLAB_API_URL}/projects/${ENCODED}/protected_branches" | jq '.[].name'
done

# Verify approval rules
for PROJECT in "${PROJECTS[@]}"; do
  ENCODED=$(echo "$PROJECT" | sed 's|/|%2F|g')
  curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "${GITLAB_API_URL}/projects/${ENCODED}/approval_rules" | jq '.[].name'
done
```

### Branch & MR

```bash
git checkout -b 2-sod-project-ownership-branch-protection release/v0.1.x
git add CODEOWNERS scripts/sod/
git commit -m "feat: add CODEOWNERS and branch protection scripts for SOD"
buildkit git push
buildkit gitlab mr create --title "Sprint 2: Project ownership and branch protection" --target release/v0.1.x
```

---

## Sprint 3 — Cedar Policy Authoring

**Duration:** 1 week
**Projects:** `compliance-engine`, `security-policies` (GitLab), local Cedar at `/Users/flux423/.agent-platform/ide-supercharger/cedar-policies`
**Outcome:** 4 Cedar forbid rules authored, entity schema defined, test fixtures passing, policies synced to GitLab `security_policies` project

### Tasks

#### 3.1 Cedar Entity Schema

- **File:** `compliance-engine/cedar/schema.cedarschema`
- **Action:** CREATE

```
namespace BlueflySOD {
  entity Agent {
    agent_id: String,
    tier: String,
    role: String,
  };

  entity Workflow {
    workflow_id: String,
    author_agent_id: String,
    reviewer_agent_id: String,
    executor_agent_id: String,
    approver_agent_id: String,
    analysis_agent_id: String,
    build_agent_id: String,
    review_agent_id: String,
    approve_agent_id: String,
  };

  action "review" appliesTo { principal: Agent, resource: Workflow };
  action "approve" appliesTo { principal: Agent, resource: Workflow };
  action "execute" appliesTo { principal: Agent, resource: Workflow };
  action "deploy" appliesTo { principal: Agent, resource: Workflow };
}
```

#### 3.2 Four Forbid Rules

- **File:** `compliance-engine/cedar/policies/sod-forbid.cedar`
- **Action:** CREATE

```cedar
// Rule 1: Self-review block — no agent can review its own work
forbid(
  principal,
  action == BlueflySOD::Action::"review",
  resource
)
when { principal.agent_id == resource.author_agent_id };

// Rule 2: Executor cannot approve — segregation of execution and approval
forbid(
  principal in BlueflySOD::Group::"executors",
  action == BlueflySOD::Action::"approve",
  resource
)
when { resource.executor_agent_id == principal.agent_id };

// Rule 3: Analyzer cannot execute — segregation of analysis and action
forbid(
  principal in BlueflySOD::Group::"analyzers",
  action == BlueflySOD::Action::"execute",
  resource
)
when { resource.analysis_agent_id == principal.agent_id };

// Rule 4: Multi-phase different-agent requirement — deploy requires 3 distinct agents
forbid(
  principal,
  action == BlueflySOD::Action::"deploy",
  resource
)
when {
  resource.review_agent_id == resource.build_agent_id ||
  resource.approve_agent_id == resource.build_agent_id ||
  resource.approve_agent_id == resource.review_agent_id
};
```

#### 3.3 Test Fixtures

- **File:** `compliance-engine/cedar/tests/sod-test-entities.json`
- **Action:** CREATE

```json
{
  "agents": {
    "vulnerability-scanner": { "agent_id": "vulnerability-scanner", "tier": "T1", "role": "ANALYZER" },
    "merge-request-reviewer": { "agent_id": "merge-request-reviewer", "tier": "T2", "role": "REVIEWER" },
    "pipeline-remediation": { "agent_id": "pipeline-remediation", "tier": "T3", "role": "EXECUTOR" },
    "release-coordinator": { "agent_id": "release-coordinator", "tier": "T4", "role": "APPROVER" }
  },
  "workflows": {
    "valid-chain": {
      "workflow_id": "wf-001",
      "author_agent_id": "vulnerability-scanner",
      "analysis_agent_id": "vulnerability-scanner",
      "reviewer_agent_id": "merge-request-reviewer",
      "executor_agent_id": "pipeline-remediation",
      "approver_agent_id": "release-coordinator",
      "build_agent_id": "pipeline-remediation",
      "review_agent_id": "merge-request-reviewer",
      "approve_agent_id": "release-coordinator"
    },
    "self-review-violation": {
      "workflow_id": "wf-002",
      "author_agent_id": "vulnerability-scanner",
      "analysis_agent_id": "vulnerability-scanner",
      "reviewer_agent_id": "vulnerability-scanner",
      "executor_agent_id": "pipeline-remediation",
      "approver_agent_id": "release-coordinator",
      "build_agent_id": "pipeline-remediation",
      "review_agent_id": "vulnerability-scanner",
      "approve_agent_id": "release-coordinator"
    }
  }
}
```

#### 3.4 Cedar Test Script

- **File:** `compliance-engine/cedar/tests/run-tests.sh`
- **Action:** CREATE

```bash
#!/usr/bin/env bash
set -euo pipefail

CEDAR_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Cedar SOD Policy Tests ==="

# Test 1: Valid chain should PERMIT
echo -n "Test 1 — valid chain deploy: "
RESULT=$(cedar authorize \
  --schema "$CEDAR_DIR/schema.cedarschema" \
  --policies "$CEDAR_DIR/policies/" \
  --principal 'BlueflySOD::Agent::"release-coordinator"' \
  --action 'BlueflySOD::Action::"deploy"' \
  --resource 'BlueflySOD::Workflow::"wf-001"' \
  --entities "$CEDAR_DIR/tests/sod-test-entities.json" 2>&1)
echo "$RESULT" | grep -q "ALLOW" && echo "✅ PASS" || echo "❌ FAIL: $RESULT"

# Test 2: Self-review should DENY
echo -n "Test 2 — self-review block: "
RESULT=$(cedar authorize \
  --schema "$CEDAR_DIR/schema.cedarschema" \
  --policies "$CEDAR_DIR/policies/" \
  --principal 'BlueflySOD::Agent::"vulnerability-scanner"' \
  --action 'BlueflySOD::Action::"review"' \
  --resource 'BlueflySOD::Workflow::"wf-002"' \
  --entities "$CEDAR_DIR/tests/sod-test-entities.json" 2>&1)
echo "$RESULT" | grep -q "DENY" && echo "✅ PASS" || echo "❌ FAIL: $RESULT"

# Test 3: Executor cannot approve
echo -n "Test 3 — executor-approve block: "
RESULT=$(cedar authorize \
  --schema "$CEDAR_DIR/schema.cedarschema" \
  --policies "$CEDAR_DIR/policies/" \
  --principal 'BlueflySOD::Agent::"pipeline-remediation"' \
  --action 'BlueflySOD::Action::"approve"' \
  --resource 'BlueflySOD::Workflow::"wf-001"' \
  --entities "$CEDAR_DIR/tests/sod-test-entities.json" 2>&1)
echo "$RESULT" | grep -q "DENY" && echo "✅ PASS" || echo "❌ FAIL: $RESULT"

echo "=== Done ==="
```

#### 3.5 Sync to GitLab security_policies and ide-supercharger

- **Action:** COPY policies to both locations

```bash
# Copy to security_policies repo
cp -r compliance-engine/cedar/policies/ $HOME/Sites/blueflyio/worktrees/security-policies/cedar/sod/
cp compliance-engine/cedar/schema.cedarschema $HOME/Sites/blueflyio/worktrees/security-policies/cedar/sod/

# Copy to ide-supercharger local Cedar
cp -r compliance-engine/cedar/policies/ /Users/flux423/.agent-platform/ide-supercharger/cedar-policies/sod/
cp compliance-engine/cedar/schema.cedarschema /Users/flux423/.agent-platform/ide-supercharger/cedar-policies/sod/
```

### Verification

```bash
# Run Cedar tests
chmod +x compliance-engine/cedar/tests/run-tests.sh
./compliance-engine/cedar/tests/run-tests.sh

# Validate schema
cedar validate --schema compliance-engine/cedar/schema.cedarschema --policies compliance-engine/cedar/policies/

# Verify files exist in security_policies
ls -la $HOME/Sites/blueflyio/worktrees/security-policies/cedar/sod/

# Verify files exist in ide-supercharger
ls -la /Users/flux423/.agent-platform/ide-supercharger/cedar-policies/sod/
```

### Branch & MR

```bash
cd $HOME/Sites/blueflyio/worktrees/compliance-engine
git checkout -b 3-sod-cedar-policies release/v0.1.x
git add cedar/
git commit -m "feat: add Cedar SOD forbid rules, entity schema, and test fixtures"
buildkit git push
buildkit gitlab mr create --title "Sprint 3: Cedar policy authoring for SOD" --target release/v0.1.x
```

---

## Sprint 4 — Agent Mesh SOD Enforcement (Runtime)

**Duration:** 1 week
**Projects:** `agent-mesh`, `agent-router`
**Outcome:** Mesh middleware on port 3005 enforces SOD at routing time, returns 409 Conflict on violations, all 12 production agents registered with tier assignments

### Tasks

#### 4.1 SOD Middleware for Agent Mesh

- **File:** `common_npm/agent-mesh/src/sod/middleware.ts`
- **Action:** CREATE

```typescript
import { Request, Response, NextFunction } from 'express';
import { AgentTier, TIER_PERMISSIONS } from './tiers';
import { isConflict } from './conflicts';
import { GateDecision } from '@bluefly/agent-router/sod/route-schema';

interface AgentIdentity {
  agentId: string;
  tier: AgentTier;
  role: string;
}

interface MeshRequest extends Request {
  sourceAgent?: AgentIdentity;
  targetAgent?: AgentIdentity;
  workflowId?: string;
  previousActors?: string[];
}

export function sodEnforcementMiddleware(req: MeshRequest, res: Response, next: NextFunction): void {
  const { sourceAgent, targetAgent, workflowId } = req;

  if (!sourceAgent || !targetAgent || !workflowId) {
    res.status(400).json({ error: 'Missing SOD metadata: sourceAgent, targetAgent, workflowId required' });
    return;
  }

  // Check tier conflict
  const conflict = isConflict(sourceAgent.tier, targetAgent.tier);
  if (conflict.conflict) {
    const decision: GateDecision = {
      decision: 'DENY',
      reason: conflict.reason || 'Tier conflict',
      sourceAgent: sourceAgent.agentId,
      targetAgent: targetAgent.agentId,
      sourceTier: sourceAgent.tier,
      targetTier: targetAgent.tier,
      workflowId,
      timestamp: new Date().toISOString(),
    };
    emitAuditLog(decision);
    res.status(409).json({ error: 'SOD Conflict', decision });
    return;
  }

  // Check self-action (same agent cannot act twice in same workflow)
  if (req.previousActors?.includes(targetAgent.agentId)) {
    const decision: GateDecision = {
      decision: 'DENY',
      reason: `Agent ${targetAgent.agentId} already acted in workflow ${workflowId}`,
      sourceAgent: sourceAgent.agentId,
      targetAgent: targetAgent.agentId,
      sourceTier: sourceAgent.tier,
      targetTier: targetAgent.tier,
      workflowId,
      timestamp: new Date().toISOString(),
    };
    emitAuditLog(decision);
    res.status(409).json({ error: 'SOD Conflict — duplicate actor', decision });
    return;
  }

  // Check tier permissions for requested action
  const action = req.headers['x-sod-action'] as string;
  if (action && !checkPermission(targetAgent.tier, action)) {
    const decision: GateDecision = {
      decision: 'DENY',
      reason: `Tier ${targetAgent.tier} does not have permission for action: ${action}`,
      sourceAgent: sourceAgent.agentId,
      targetAgent: targetAgent.agentId,
      sourceTier: sourceAgent.tier,
      targetTier: targetAgent.tier,
      workflowId,
      timestamp: new Date().toISOString(),
    };
    emitAuditLog(decision);
    res.status(409).json({ error: 'SOD Permission Denied', decision });
    return;
  }

  // PERMIT
  const decision: GateDecision = {
    decision: 'PERMIT',
    reason: 'SOD check passed',
    sourceAgent: sourceAgent.agentId,
    targetAgent: targetAgent.agentId,
    sourceTier: sourceAgent.tier,
    targetTier: targetAgent.tier,
    workflowId,
    timestamp: new Date().toISOString(),
  };
  emitAuditLog(decision);
  next();
}

function checkPermission(tier: AgentTier, action: string): boolean {
  const perms = TIER_PERMISSIONS[tier];
  const key = `can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof typeof perms;
  return perms[key] === true;
}

function emitAuditLog(decision: GateDecision): void {
  // Structured log for audit pipeline (Sprint 5 will add Prometheus/Grafana)
  console.log(JSON.stringify({
    type: 'sod_gate_decision',
    ...decision,
  }));
}
```

#### 4.2 Agent Registry with Tier Assignments

- **File:** `common_npm/agent-mesh/src/sod/agent-registry.ts`
- **Action:** CREATE

```typescript
import { AgentTier } from './tiers';

export interface RegisteredAgent {
  agentId: string;
  tier: AgentTier;
  role: string;
  description: string;
}

export const AGENT_REGISTRY: RegisteredAgent[] = [
  // T1 Analyzers
  { agentId: 'vulnerability-scanner', tier: AgentTier.ANALYZER, role: 'ANALYZER', description: 'SAST/DAST scanning and CVE analysis' },
  { agentId: 'code-quality-analyzer', tier: AgentTier.ANALYZER, role: 'ANALYZER', description: 'Linting, complexity, and code quality metrics' },
  { agentId: 'dependency-auditor', tier: AgentTier.ANALYZER, role: 'ANALYZER', description: 'Supply chain and dependency risk analysis' },

  // T2 Reviewers
  { agentId: 'merge-request-reviewer', tier: AgentTier.REVIEWER, role: 'REVIEWER', description: 'MR review and approval workflow' },
  { agentId: 'architecture-reviewer', tier: AgentTier.REVIEWER, role: 'REVIEWER', description: 'Architecture decision review' },
  { agentId: 'compliance-reviewer', tier: AgentTier.REVIEWER, role: 'REVIEWER', description: 'Policy and compliance review' },

  // T3 Executors
  { agentId: 'pipeline-remediation', tier: AgentTier.EXECUTOR, role: 'EXECUTOR', description: 'CI/CD pipeline execution and remediation' },
  { agentId: 'deployment-agent', tier: AgentTier.EXECUTOR, role: 'EXECUTOR', description: 'Container build and deployment' },
  { agentId: 'infrastructure-agent', tier: AgentTier.EXECUTOR, role: 'EXECUTOR', description: 'Terraform and infrastructure provisioning' },

  // T4 Approvers
  { agentId: 'release-coordinator', tier: AgentTier.APPROVER, role: 'APPROVER', description: 'Release gating and tag creation' },
  { agentId: 'change-approver', tier: AgentTier.APPROVER, role: 'APPROVER', description: 'Change advisory board decisions' },
  { agentId: 'security-approver', tier: AgentTier.APPROVER, role: 'APPROVER', description: 'Security exception and risk acceptance' },
];

export function getAgent(agentId: string): RegisteredAgent | undefined {
  return AGENT_REGISTRY.find(a => a.agentId === agentId);
}
```

#### 4.3 Mesh Server Integration

- **File:** `common_npm/agent-mesh/src/server.ts`
- **Action:** MODIFY — add SOD middleware to the mesh Express app

```typescript
// Add before existing route handlers, after body parsing:
import { sodEnforcementMiddleware } from './sod/middleware';

// Mount SOD enforcement on all mesh routes
app.use('/mesh/v1/*', sodEnforcementMiddleware);
```

#### 4.4 Integration Tests

- **File:** `common_npm/agent-mesh/src/sod/__tests__/middleware.test.ts`
- **Action:** CREATE
- **Test cases:**
  - Valid chain (Analyzer → Reviewer → Executor → Approver) returns 200
  - Self-review (same agent as author and reviewer) returns 409
  - Executor attempting approve returns 409
  - Analyzer attempting execute returns 409
  - Duplicate actor in workflow returns 409
  - Missing SOD metadata returns 400
  - PERMIT gate decision is logged
  - DENY gate decision is logged

### Verification

```bash
cd $HOME/Sites/blueflyio/worktrees/common_npm/agent-mesh
npm run test -- --grep "sod"
npm run build

# Start mesh on port 3005 and test
PORT=3005 npm start &
sleep 2

# Test valid route
curl -s -X POST http://localhost:3005/mesh/v1/route \
  -H "Content-Type: application/json" \
  -H "x-sod-action: review" \
  -d '{"sourceAgent":{"agentId":"vulnerability-scanner","tier":"T1"},"targetAgent":{"agentId":"merge-request-reviewer","tier":"T2"},"workflowId":"wf-test-001"}' \
  | jq .

# Test conflict (should return 409)
curl -s -X POST http://localhost:3005/mesh/v1/route \
  -H "Content-Type: application/json" \
  -H "x-sod-action: execute" \
  -d '{"sourceAgent":{"agentId":"vulnerability-scanner","tier":"T1"},"targetAgent":{"agentId":"pipeline-remediation","tier":"T3"},"workflowId":"wf-test-002","previousActors":["vulnerability-scanner"]}' \
  | jq .

kill %1
```

### Branch & MR

```bash
cd $HOME/Sites/blueflyio/worktrees/common_npm/agent-mesh
git checkout -b 4-sod-mesh-enforcement release/v0.1.x
git add src/sod/ src/server.ts
git commit -m "feat: add SOD enforcement middleware to agent mesh (port 3005)"
buildkit git push
buildkit gitlab mr create --title "Sprint 4: Agent mesh SOD enforcement" --target release/v0.1.x
```

---

## Sprint 5 — Audit Pipeline & Tunnel Enforcement

**Duration:** 1 week
**Projects:** `agent-tracer`, `agent-tailscale`, Cloudflare Tunnel config, Grafana dashboards
**Outcome:** Structured audit logs for all gate decisions, Grafana dashboard for SOD violations, tunnel-level enforcement via Cloudflare Access policies

### Tasks

#### 5.1 Audit Log Schema

- **File:** `common_npm/agent-tracer/src/sod/audit.ts`
- **Action:** CREATE

```typescript
export interface SODAuditEntry {
  id: string;
  timestamp: string;
  type: 'gate_decision' | 'sod_violation' | 'policy_change';
  decision: 'PERMIT' | 'DENY' | 'ESCALATE';
  sourceAgent: string;
  targetAgent: string;
  sourceTier: string;
  targetTier: string;
  workflowId: string;
  action: string;
  reason: string;
  cedarPolicyId?: string;
  retentionDays: number; // gate_decision=365, sod_violation=730, policy_change=indefinite
}

export function calculateRetention(type: SODAuditEntry['type']): number {
  switch (type) {
    case 'gate_decision': return 365;
    case 'sod_violation': return 730;
    case 'policy_change': return -1; // indefinite
    default: return 365;
  }
}

export function createAuditEntry(params: Omit<SODAuditEntry, 'id' | 'retentionDays'>): SODAuditEntry {
  return {
    ...params,
    id: `sod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    retentionDays: calculateRetention(params.type),
  };
}
```

#### 5.2 Prometheus Metrics for SOD

- **File:** `common_npm/agent-tracer/src/sod/metrics.ts`
- **Action:** CREATE

```typescript
import { Counter, Histogram } from 'prom-client';

export const sodGateDecisions = new Counter({
  name: 'sod_gate_decisions_total',
  help: 'Total SOD gate decisions',
  labelNames: ['decision', 'source_tier', 'target_tier', 'action'],
});

export const sodViolations = new Counter({
  name: 'sod_violations_total',
  help: 'Total SOD violations (DENY decisions)',
  labelNames: ['source_agent', 'target_agent', 'reason'],
});

export const sodGateLatency = new Histogram({
  name: 'sod_gate_latency_seconds',
  help: 'Latency of SOD gate checks',
  labelNames: ['decision'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
});
```

#### 5.3 Grafana Dashboard JSON

- **File:** `compliance-engine/dashboards/sod-enforcement.json`
- **Action:** CREATE
- **Panels:**
  - Gate decisions over time (PERMIT vs DENY vs ESCALATE)
  - Violations by agent pair
  - Violations by tier conflict
  - Gate latency percentiles (p50, p95, p99)
  - Policy change audit trail
  - Top 10 denied workflows

#### 5.4 Cloudflare Tunnel SOD Access Policy

- **File:** `infrastructure/cloudflare/sod-access-policy.json`
- **Action:** CREATE

```json
{
  "tunnel_id": "f6da7bdf-",
  "ingress": [
    {
      "hostname": "mesh.blueflyagents.com",
      "service": "http://localhost:3005",
      "originRequest": {
        "noTLSVerify": false,
        "httpHostHeader": "mesh.blueflyagents.com"
      }
    },
    {
      "hostname": "api.blueflyagents.com",
      "service": "http://localhost:3001",
      "originRequest": {
        "noTLSVerify": false
      }
    }
  ],
  "access_policies": {
    "mesh.blueflyagents.com": {
      "require": [
        { "login_method": { "id": "service_token" } }
      ],
      "purpose_justification_required": true,
      "session_duration": "1h"
    }
  }
}
```

#### 5.5 Tailscale ACL for Mesh Port

- **File:** `infrastructure/tailscale/sod-acl.json`
- **Action:** CREATE

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:agent-mesh"],
      "dst": ["tag:agent-mesh:3005"],
      "comment": "Agent mesh SOD enforcement — only mesh-tagged nodes"
    },
    {
      "action": "accept",
      "src": ["tag:agent-mesh"],
      "dst": ["tag:nas:9090"],
      "comment": "Prometheus metrics collection from NAS"
    }
  ],
  "tagOwners": {
    "tag:agent-mesh": ["autogroup:admin"],
    "tag:nas": ["autogroup:admin"]
  }
}
```

### Verification

```bash
# Verify audit logs are structured JSON
curl -s http://localhost:3005/mesh/v1/route \
  -H "Content-Type: application/json" \
  -d '...' 2>&1 | grep "sod_gate_decision"

# Verify Prometheus metrics
curl -s http://localhost:9090/api/v1/query?query=sod_violations_total | jq .

# Verify Grafana dashboard loads
curl -s http://localhost:3000/api/dashboards/uid/sod-enforcement | jq .status

# Verify Cloudflare tunnel config
cloudflared tunnel info f6da7bdf-
```

### Branch & MR

```bash
cd $HOME/Sites/blueflyio/worktrees/common_npm/agent-tracer
git checkout -b 5-sod-audit-pipeline release/v0.1.x
git add src/sod/
git commit -m "feat: add SOD audit pipeline with Prometheus metrics"
buildkit git push
buildkit gitlab mr create --title "Sprint 5: Audit pipeline and tunnel enforcement" --target release/v0.1.x
```

---

## Sprint 6 — Application-Layer SOD (IDE + MCP)

**Duration:** 1 week
**Projects:** `ide-supercharger`, `agent-protocol` (MCP layer), `compliance-engine`
**Outcome:** Local Cedar policy checks in IDE plugin, MCP-layer SOD enforcement, compliance-engine REST API for gate decisions

### Tasks

#### 6.1 IDE-Supercharger Cedar Check

- **File:** `ide-supercharger/src/sod/local-cedar-check.ts`
- **Action:** CREATE

```typescript
import { execSync } from 'child_process';
import path from 'path';

const CEDAR_POLICIES_DIR = path.join(
  process.env.HOME || '',
  '.agent-platform/ide-supercharger/cedar-policies/sod'
);

export interface LocalGateResult {
  decision: 'PERMIT' | 'DENY';
  reason: string;
  policyFile: string;
}

export function checkLocalCedarPolicy(
  principalAgent: string,
  action: string,
  resourceWorkflow: string
): LocalGateResult {
  try {
    const result = execSync(
      `cedar authorize \
        --schema "${CEDAR_POLICIES_DIR}/schema.cedarschema" \
        --policies "${CEDAR_POLICIES_DIR}/" \
        --principal 'BlueflySOD::Agent::"${principalAgent}"' \
        --action 'BlueflySOD::Action::"${action}"' \
        --resource 'BlueflySOD::Workflow::"${resourceWorkflow}"' \
        --entities "${CEDAR_POLICIES_DIR}/../entities.json"`,
      { encoding: 'utf-8', timeout: 5000 }
    );

    const decision = result.includes('ALLOW') ? 'PERMIT' : 'DENY';
    return {
      decision,
      reason: decision === 'PERMIT' ? 'Local Cedar check passed' : 'Local Cedar policy denied',
      policyFile: `${CEDAR_POLICIES_DIR}/sod-forbid.cedar`,
    };
  } catch (error) {
    return {
      decision: 'DENY',
      reason: `Cedar check failed: ${(error as Error).message}`,
      policyFile: CEDAR_POLICIES_DIR,
    };
  }
}
```

#### 6.2 MCP-Layer SOD Enforcement (agent-protocol)

- **File:** `common_npm/agent-protocol/src/sod/mcp-enforcement.ts`
- **Action:** CREATE

```typescript
import { AgentTier } from '@bluefly/agent-mesh/sod/tiers';
import { isConflict } from '@bluefly/agent-mesh/sod/conflicts';

export interface MCPToolCall {
  toolName: string;
  callerAgent: string;
  callerTier: AgentTier;
  targetAgent?: string;
  targetTier?: AgentTier;
  workflowId: string;
}

export interface MCPGateResult {
  allowed: boolean;
  reason: string;
}

/**
 * SOD-sensitive MCP tools — these require tier checks before execution
 */
const SOD_SENSITIVE_TOOLS = [
  'git_push',
  'git_merge',
  'deploy',
  'approve_mr',
  'create_tag',
  'modify_pipeline',
  'access_secrets',
  'execute_pipeline',
];

export function checkMCPToolSOD(call: MCPToolCall): MCPGateResult {
  // Non-sensitive tools are always allowed
  if (!SOD_SENSITIVE_TOOLS.includes(call.toolName)) {
    return { allowed: true, reason: 'Tool is not SOD-sensitive' };
  }

  // If target agent specified, check tier conflict
  if (call.targetAgent && call.targetTier) {
    const conflict = isConflict(call.callerTier, call.targetTier);
    if (conflict.conflict) {
      return { allowed: false, reason: conflict.reason || 'Tier conflict on MCP tool call' };
    }
  }

  // Check if caller tier has permission for the action mapped from tool
  const actionMap: Record<string, string> = {
    git_push: 'write',
    git_merge: 'mergeMR',
    deploy: 'deploy',
    approve_mr: 'approve',
    create_tag: 'tagRelease',
    modify_pipeline: 'modifyPipeline',
    access_secrets: 'accessSecrets',
    execute_pipeline: 'execute',
  };

  const action = actionMap[call.toolName];
  if (!action) {
    return { allowed: true, reason: 'No action mapping for tool' };
  }

  // Import and check permissions
  const { TIER_PERMISSIONS } = require('@bluefly/agent-mesh/sod/tiers');
  const perms = TIER_PERMISSIONS[call.callerTier];
  const key = `can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof typeof perms;

  if (perms[key] !== true) {
    return { allowed: false, reason: `Tier ${call.callerTier} cannot perform ${call.toolName}` };
  }

  return { allowed: true, reason: 'MCP SOD check passed' };
}
```

#### 6.3 Compliance Engine REST API

- **File:** `common_npm/compliance-engine/src/api/gate.ts`
- **Action:** CREATE

```typescript
import express from 'express';
import { checkLocalCedarPolicy } from './cedar-bridge';

const router = express.Router();

/**
 * POST /api/v1/sod/gate
 * Body: { principal, action, resource, workflowId }
 * Returns: { decision: PERMIT|DENY|ESCALATE, reason, auditId }
 */
router.post('/gate', async (req, res) => {
  const { principal, action, resource, workflowId } = req.body;

  if (!principal || !action || !resource || !workflowId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = checkLocalCedarPolicy(principal, action, resource);

  // If DENY and action is critical, ESCALATE to human
  const criticalActions = ['deploy', 'approve'];
  const finalDecision = result.decision === 'DENY' && criticalActions.includes(action)
    ? 'ESCALATE'
    : result.decision;

  return res.json({
    decision: finalDecision,
    reason: result.reason,
    auditId: `gate-${Date.now()}`,
    workflowId,
    timestamp: new Date().toISOString(),
  });
});

export default router;
```

### Verification

```bash
# Test local Cedar check
cd $HOME/.agent-platform/ide-supercharger
npx ts-node -e "
const { checkLocalCedarPolicy } = require('./src/sod/local-cedar-check');
console.log(checkLocalCedarPolicy('vulnerability-scanner', 'review', 'wf-test'));
"

# Test MCP enforcement
cd $HOME/Sites/blueflyio/worktrees/common_npm/agent-protocol
npm run test -- --grep "mcp-enforcement"

# Test compliance engine API
curl -s -X POST http://localhost:3001/api/v1/sod/gate \
  -H "Content-Type: application/json" \
  -d '{"principal":"pipeline-remediation","action":"approve","resource":"wf-001","workflowId":"wf-001"}' \
  | jq .
```

### Branch & MR

```bash
# Create MRs for each project
for PROJECT in ide-supercharger agent-protocol compliance-engine; do
  cd "$HOME/Sites/blueflyio/worktrees/common_npm/$PROJECT"
  git checkout -b 6-sod-application-layer release/v0.1.x
  git add src/sod/
  git commit -m "feat: add application-layer SOD enforcement"
  buildkit git push
  buildkit gitlab mr create --title "Sprint 6: Application-layer SOD ($PROJECT)" --target release/v0.1.x
done
```

---

## Sprint 7 — GitLab DAP Verification & gitlab_components

**Duration:** 1 week
**Projects:** `gitlab_components`, `security_policies`, GitLab Ultimate DAP
**Outcome:** CI/CD component for SOD verification in pipelines, security policy scanning for Cedar compliance, DAP integration tests

### Tasks

#### 7.1 GitLab CI Component for SOD Check

- **File:** `gitlab_components/sod-verification/template.yml`
- **Action:** CREATE

```yaml
spec:
  inputs:
    stage:
      default: test
      description: "Pipeline stage for SOD verification"
    compliance_engine_url:
      default: "http://localhost:3001"
      description: "Compliance engine API URL"
    workflow_id:
      description: "Workflow ID for this pipeline run"
    source_agent:
      description: "Agent ID initiating this pipeline"
    source_tier:
      description: "Tier of the initiating agent (T1|T2|T3|T4)"
    target_action:
      default: "deploy"
      description: "Action being verified"

---

sod-verification:
  stage: $[[ inputs.stage ]]
  image: curlimages/curl:latest
  script:
    - |
      echo "=== SOD Verification ==="
      echo "Workflow: $[[ inputs.workflow_id ]]"
      echo "Agent: $[[ inputs.source_agent ]] (Tier: $[[ inputs.source_tier ]])"
      echo "Action: $[[ inputs.target_action ]]"

      RESPONSE=$(curl -sf -X POST "$[[ inputs.compliance_engine_url ]]/api/v1/sod/gate" \
        -H "Content-Type: application/json" \
        -d "{
          \"principal\": \"$[[ inputs.source_agent ]]\",
          \"action\": \"$[[ inputs.target_action ]]\",
          \"resource\": \"$[[ inputs.workflow_id ]]\",
          \"workflowId\": \"$[[ inputs.workflow_id ]]\"
        }")

      DECISION=$(echo "$RESPONSE" | jq -r '.decision')
      echo "Decision: $DECISION"

      if [ "$DECISION" = "DENY" ]; then
        echo "❌ SOD VIOLATION: $(echo "$RESPONSE" | jq -r '.reason')"
        exit 1
      elif [ "$DECISION" = "ESCALATE" ]; then
        echo "⚠️ SOD ESCALATION: Requires human approval"
        echo "Reason: $(echo "$RESPONSE" | jq -r '.reason')"
        exit 1
      else
        echo "✅ SOD check passed"
      fi
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH =~ /^release\//
```

#### 7.2 Security Policy for Cedar Compliance Scanning

- **File:** `security_policies/scan-policies/sod-cedar-scan.yml`
- **Action:** CREATE

```yaml
---
scan_execution_policy:
  - name: "SOD Cedar Policy Compliance"
    description: "Verify Cedar policies are valid and all SOD rules are present"
    enabled: true
    rules:
      - type: pipeline
        branches:
          - main
          - "release/*"
    actions:
      - scan: custom
        ci_configuration: |
          cedar-compliance-scan:
            stage: test
            image: node:20-slim
            script:
              - npm install -g @cedar-policy/cedar-wasm-cli || true
              - |
                echo "=== Cedar Policy Compliance Scan ==="

                # Validate schema
                cedar validate \
                  --schema cedar/sod/schema.cedarschema \
                  --policies cedar/sod/ \
                  && echo "✅ Schema valid" || (echo "❌ Schema invalid" && exit 1)

                # Check required rules exist
                REQUIRED_RULES=("self-review" "executor-approve" "analyzer-execute" "multi-phase")
                for RULE in "${REQUIRED_RULES[@]}"; do
                  grep -q "$RULE" cedar/sod/sod-forbid.cedar \
                    && echo "✅ Rule present: $RULE" \
                    || (echo "❌ Missing required rule: $RULE" && exit 1)
                done

                echo "=== All SOD Cedar policies valid ==="
            rules:
              - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

#### 7.3 DAP Integration Test Pipeline

- **File:** `gitlab_components/sod-verification/test-pipeline.yml`
- **Action:** CREATE

```yaml
include:
  - component: $CI_SERVER_FQDN/blueflyio/gitlab_components/sod-verification/template@main
    inputs:
      workflow_id: "test-$CI_PIPELINE_IID"
      source_agent: "pipeline-remediation"
      source_tier: "T3"
      target_action: "deploy"

stages:
  - test
  - verify

sod-e2e-valid-chain:
  stage: verify
  script:
    - echo "Testing valid chain — Analyzer → Reviewer → Executor → Approver"
    - |
      for PAIR in "vulnerability-scanner:T1:review" "merge-request-reviewer:T2:execute" "pipeline-remediation:T3:deploy"; do
        AGENT=$(echo $PAIR | cut -d: -f1)
        TIER=$(echo $PAIR | cut -d: -f2)
        ACTION=$(echo $PAIR | cut -d: -f3)
        RESPONSE=$(curl -sf -X POST "$COMPLIANCE_ENGINE_URL/api/v1/sod/gate" \
          -H "Content-Type: application/json" \
          -d "{\"principal\":\"$AGENT\",\"action\":\"$ACTION\",\"resource\":\"e2e-$CI_PIPELINE_IID\",\"workflowId\":\"e2e-$CI_PIPELINE_IID\"}")
        echo "$AGENT ($TIER) → $ACTION: $(echo $RESPONSE | jq -r '.decision')"
      done

sod-e2e-violation:
  stage: verify
  script:
    - echo "Testing violation — Executor attempting approve"
    - |
      RESPONSE=$(curl -sf -X POST "$COMPLIANCE_ENGINE_URL/api/v1/sod/gate" \
        -H "Content-Type: application/json" \
        -d '{"principal":"pipeline-remediation","action":"approve","resource":"e2e-violation","workflowId":"e2e-violation"}')
      DECISION=$(echo $RESPONSE | jq -r '.decision')
      if [ "$DECISION" != "DENY" ] && [ "$DECISION" != "ESCALATE" ]; then
        echo "❌ Expected DENY or ESCALATE, got $DECISION"
        exit 1
      fi
      echo "✅ Correctly denied executor-approve violation"
```

### Verification

```bash
# Validate CI component syntax
cd $HOME/Sites/blueflyio/worktrees/gitlab_components
glab ci lint sod-verification/template.yml

# Run security policy scan locally
cd $HOME/Sites/blueflyio/worktrees/security-policies
cedar validate --schema cedar/sod/schema.cedarschema --policies cedar/sod/

# Trigger test pipeline
cd $HOME/Sites/blueflyio/worktrees/gitlab_components
git push origin 7-sod-dap-verification
# Check pipeline at: https://gitlab.com/blueflyio/gitlab_components/-/pipelines
```

### Branch & MR

```bash
cd $HOME/Sites/blueflyio/worktrees/gitlab_components
git checkout -b 7-sod-dap-verification main
git add sod-verification/
git commit -m "feat: add SOD verification CI component and DAP integration tests"
buildkit git push
buildkit gitlab mr create --title "Sprint 7: GitLab DAP SOD verification" --target main

cd $HOME/Sites/blueflyio/worktrees/security-policies
git checkout -b 7-sod-cedar-scan main
git add scan-policies/
git commit -m "feat: add Cedar compliance scan policy for SOD"
buildkit git push
buildkit gitlab mr create --title "Sprint 7: Cedar compliance scanning policy" --target main
```

---

## Sprint 8 — Migration, Cutover & End-to-End Validation

**Duration:** 1 week
**Projects:** All — full platform validation
**Outcome:** Legacy SOD removed, new enforcement active on all 12 agents, end-to-end validation passing, runbook updated, documentation complete

### Tasks

#### 8.1 Legacy SOD Removal

- **Action:** SEARCH and REMOVE all legacy/ad-hoc SOD checks
- **Locations to check:**

```bash
# Find legacy SOD patterns in all worktrees
grep -rn "role.*check\|permission.*verify\|access.*control" \
  --include="*.ts" --include="*.js" \
  $HOME/Sites/blueflyio/worktrees/common_npm/*/src/ \
  | grep -v "sod/" \
  | grep -v "node_modules"
```

- **Replace with:** Imports from `@bluefly/agent-mesh/sod` and `@bluefly/compliance-engine`
- **Verify:** No direct role checks remain outside `src/sod/` directories

#### 8.2 Enable SOD on All 12 Production Agents

- **File:** `platform-agents/manifests/sod-enabled.yaml`
- **Action:** CREATE

```yaml
# SOD enforcement manifest — applied to all 12 production agents
agents:
  # T1 Analyzers
  - id: vulnerability-scanner
    tier: T1
    sod_enabled: true
    allowed_actions: [read, analyze]
    denied_actions: [write, execute, approve, deploy, mergeMR, tagRelease]

  - id: code-quality-analyzer
    tier: T1
    sod_enabled: true
    allowed_actions: [read, analyze]
    denied_actions: [write, execute, approve, deploy, mergeMR, tagRelease]

  - id: dependency-auditor
    tier: T1
    sod_enabled: true
    allowed_actions: [read, analyze]
    denied_actions: [write, execute, approve, deploy, mergeMR, tagRelease]

  # T2 Reviewers
  - id: merge-request-reviewer
    tier: T2
    sod_enabled: true
    allowed_actions: [read, analyze, review]
    denied_actions: [write, execute, approve, deploy, tagRelease]

  - id: architecture-reviewer
    tier: T2
    sod_enabled: true
    allowed_actions: [read, analyze, review]
    denied_actions: [write, execute, approve, deploy, tagRelease]

  - id: compliance-reviewer
    tier: T2
    sod_enabled: true
    allowed_actions: [read, analyze, review]
    denied_actions: [write, execute, approve, deploy, tagRelease]

  # T3 Executors
  - id: pipeline-remediation
    tier: T3
    sod_enabled: true
    allowed_actions: [read, write, execute, deploy, createMR, modifyPipeline, accessSecrets]
    denied_actions: [approve, mergeMR, tagRelease, review]

  - id: deployment-agent
    tier: T3
    sod_enabled: true
    allowed_actions: [read, write, execute, deploy, createMR, modifyPipeline, accessSecrets]
    denied_actions: [approve, mergeMR, tagRelease, review]

  - id: infrastructure-agent
    tier: T3
    sod_enabled: true
    allowed_actions: [read, write, execute, deploy, createMR, modifyPipeline, accessSecrets]
    denied_actions: [approve, mergeMR, tagRelease, review]

  # T4 Approvers
  - id: release-coordinator
    tier: T4
    sod_enabled: true
    allowed_actions: [read, analyze, review, approve, mergeMR, tagRelease]
    denied_actions: [write, execute, deploy, modifyPipeline, accessSecrets]

  - id: change-approver
    tier: T4
    sod_enabled: true
    allowed_actions: [read, analyze, review, approve, mergeMR, tagRelease]
    denied_actions: [write, execute, deploy, modifyPipeline, accessSecrets]

  - id: security-approver
    tier: T4
    sod_enabled: true
    allowed_actions: [read, analyze, review, approve, mergeMR, tagRelease]
    denied_actions: [write, execute, deploy, modifyPipeline, accessSecrets]

enforcement:
  mesh_port: 3005
  gate_endpoint: /api/v1/sod/gate
  cedar_policies_dir: /opt/bluefly/cedar-policies/sod
  audit_retention:
    gate_decision_days: 365
    sod_violation_days: 730
    policy_change_days: -1  # indefinite
```

#### 8.3 End-to-End Validation Script

- **File:** `scripts/sod/e2e-validation.sh`
- **Action:** CREATE

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "  SOD End-to-End Validation Suite"
echo "=========================================="

MESH_URL="${MESH_URL:-http://localhost:3005}"
API_URL="${API_URL:-http://localhost:3001}"
PASS=0
FAIL=0

check() {
  local TEST_NAME="$1"
  local EXPECTED="$2"
  local ACTUAL="$3"

  if [ "$ACTUAL" = "$EXPECTED" ]; then
    echo "✅ $TEST_NAME — $ACTUAL"
    PASS=$((PASS + 1))
  else
    echo "❌ $TEST_NAME — expected $EXPECTED, got $ACTUAL"
    FAIL=$((FAIL + 1))
  fi
}

# === Test 1: Valid chain ===
echo ""
echo "--- Test Suite 1: Valid workflow chain ---"

R=$(curl -sf -X POST "$API_URL/api/v1/sod/gate" \
  -H "Content-Type: application/json" \
  -d '{"principal":"vulnerability-scanner","action":"analyze","resource":"e2e-valid","workflowId":"e2e-valid"}')
check "Analyzer can analyze" "PERMIT" "$(echo $R | jq -r '.decision')"

R=$(curl -sf -X POST "$API_URL/api/v1/sod/gate" \
  -H "Content-Type: application/json" \
  -d '{"principal":"merge-request-reviewer","action":"review","resource":"e2e-valid","workflowId":"e2e-valid"}')
check "Reviewer can review" "PERMIT" "$(echo $R | jq -r '.decision')"

R=$(curl -sf -X POST "$API_URL/api/v1/sod/gate" \
  -H "Content-Type: application/json" \
  -d '{"principal":"pipeline-remediation","action":"execute","resource":"e2e-valid","workflowId":"e2e-valid"}')
check "Executor can execute" "PERMIT" "$(echo $R | jq -r '.decision')"

# === Test 2: Violation scenarios ===
echo ""
echo "--- Test Suite 2: SOD violations ---"

R=$(curl -sf -X POST "$API_URL/api/v1/sod/gate" \
  -H "Content-Type: application/json" \
  -d '{"principal":"vulnerability-scanner","action":"execute","resource":"e2e-viol-1","workflowId":"e2e-viol-1"}')
check "Analyzer cannot execute" "DENY" "$(echo $R | jq -r '.decision')"

R=$(curl -sf -X POST "$API_URL/api/v1/sod/gate" \
  -H "Content-Type: application/json" \
  -d '{"principal":"pipeline-remediation","action":"approve","resource":"e2e-viol-2","workflowId":"e2e-viol-2"}')
D=$(echo $R | jq -r '.decision')
# DENY or ESCALATE are both acceptable
if [ "$D" = "DENY" ] || [ "$D" = "ESCALATE" ]; then
  check "Executor cannot approve" "DENY|ESCALATE" "$D"
else
  check "Executor cannot approve" "DENY|ESCALATE" "$D"
fi

# === Test 3: Mesh enforcement ===
echo ""
echo "--- Test Suite 3: Mesh 409 Conflict ---"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$MESH_URL/mesh/v1/route" \
  -H "Content-Type: application/json" \
  -H "x-sod-action: execute" \
  -d '{"sourceAgent":{"agentId":"vulnerability-scanner","tier":"T1"},"targetAgent":{"agentId":"pipeline-remediation","tier":"T3"},"workflowId":"e2e-mesh","previousActors":["vulnerability-scanner"]}')
check "Mesh returns 409 on conflict" "409" "$HTTP_CODE"

# === Test 4: Audit log presence ===
echo ""
echo "--- Test Suite 4: Audit logging ---"

LOGS=$(curl -sf "$API_URL/api/v1/sod/audit/recent?limit=5" 2>/dev/null || echo "[]")
LOG_COUNT=$(echo "$LOGS" | jq 'length' 2>/dev/null || echo "0")
if [ "$LOG_COUNT" -gt "0" ]; then
  check "Audit logs present" "true" "true"
else
  check "Audit logs present" "true" "false"
fi

# === Summary ===
echo ""
echo "=========================================="
echo "  Results: $PASS passed, $FAIL failed"
echo "=========================================="

exit $FAIL
```

#### 8.4 Update RUNBOOK.md with SOD Operations

- **File:** `todo/RUNBOOK.md`
- **Action:** APPEND section

```markdown
## 7. SOD Operations

### Check SOD status
```bash
# Verify mesh is enforcing SOD
curl -s http://localhost:3005/health | jq '.sod_enforcement'

# Check Cedar policies are loaded
cedar validate --schema $HOME/.agent-platform/ide-supercharger/cedar-policies/sod/schema.cedarschema \
  --policies $HOME/.agent-platform/ide-supercharger/cedar-policies/sod/

# Run E2E validation
./scripts/sod/e2e-validation.sh
```

### SOD incident response
1. If agent violates SOD → check audit log at Grafana (sod-enforcement dashboard)
2. If Cedar policy needs update → edit in compliance-engine, test, sync to security_policies + ide-supercharger
3. If mesh 409s are false positives → check agent-registry tier assignments
4. Emergency: disable SOD middleware temporarily → set `SOD_ENFORCEMENT=disabled` env var on mesh (port 3005)
```

#### 8.5 Documentation Checklist

- [ ] `platform-agents/docs/sod-architecture.md` — Full architecture doc with diagrams
- [ ] `compliance-engine/README.md` — Cedar policy reference
- [ ] `gitlab_components/sod-verification/README.md` — CI component usage
- [ ] `security_policies/README.md` — Security policy scanning reference
- [ ] Updated `AGENTS.md` in platform root with SOD paragraph
- [ ] Updated `CLAUDE.md` with SOD enforcement rules for AI agents

### Verification

```bash
# Full E2E
chmod +x scripts/sod/e2e-validation.sh
./scripts/sod/e2e-validation.sh

# Verify no legacy SOD code remains
grep -rn "role.*check\|permission.*verify" \
  --include="*.ts" \
  $HOME/Sites/blueflyio/worktrees/common_npm/*/src/ \
  | grep -v "sod/" \
  | grep -v "node_modules" \
  | wc -l
# Expected: 0

# Verify all 12 agents have SOD enabled
cat platform-agents/manifests/sod-enabled.yaml | grep "sod_enabled: true" | wc -l
# Expected: 12

# Verify branch protection on all projects
./scripts/sod/apply-branch-protection.sh --verify-only
```

### Branch & MR

```bash
# Final MR for each project with changes
for WORKTREE in platform-agents common_npm/compliance-engine; do
  cd "$HOME/Sites/blueflyio/worktrees/$WORKTREE"
  git checkout -b 8-sod-migration-cutover release/v0.1.x
  git add .
  git commit -m "feat: SOD migration cutover — enable enforcement on all agents"
  buildkit git push
  buildkit gitlab mr create --title "Sprint 8: SOD migration and cutover" --target release/v0.1.x
done
```

---

## Reference: Quick Command Sheet

```bash
# Token setup (run before any GitLab operation)
set -a && source /Volumes/AgentPlatform/.env.local && set +a

# Spawn agents for SOD sprints
export TODO_DIR=$HOME/.agent-platform/agent-buildkit/todo
export WORKTREE_SOURCE_DIR=$HOME/Sites/blueflyio/worktrees
buildkit agent spawn-team --max-parallel 4

# Verify Cedar policies
cedar validate --schema compliance-engine/cedar/schema.cedarschema --policies compliance-engine/cedar/policies/

# Run SOD E2E validation
./scripts/sod/e2e-validation.sh

# Check mesh SOD enforcement
curl -s http://localhost:3005/health | jq '.sod_enforcement'

# View SOD audit logs
curl -s http://localhost:3001/api/v1/sod/audit/recent?limit=10 | jq .

# GitLab MR for any sprint
buildkit gitlab mr create --title "Sprint N: <title>" --target release/v0.1.x
```

---

## Service Account Reference

| Field | Value |
|-------|-------|
| GitLab ID | 32706577 |
| Username | `bluefly-agent-service` |
| Scopes | `api`, `read_repository`, `write_repository` |
| Version Authority | `HUMAN (milestone) → CI PIPELINE (semantic-release) → GIT TAG (output)` |
| Agent Version Role | READ-ONLY |

## Endpoint Reference

| Service | URL | Port |
|---------|-----|------|
| API | api.blueflyagents.com | 3001 |
| Mesh (SOD) | mesh.blueflyagents.com | 3005 |
| Storage | storage.blueflyagents.com | 9000 |
| Prometheus | localhost | 9090 |
| Grafana | localhost | 3000 |

## Audit Retention

| Event Type | Retention |
|-----------|-----------|
| Gate decisions | 1 year |
| SOD violations | 2 years |
| Policy changes | Indefinite |
