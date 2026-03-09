# System Audit & Next-Steps Execution Plan

This document synthesizes the current state of the Unified Agentic Operations Platform across all active workspaces, identifying architectural drift, unstructured changes, and the explicit sequence of operations required to achieve the Phase 1 goals (n8n ↔ GitLab ↔ Oracle).

## 1. System-Wide Change Audit

An aggressive scan of active Git worktrees reveals significant uncommitted drift and recent structural changes.

### A. `agent-buildkit` (Core Platform CLI & Architecture)
- **Status:** **Highly Dirty / Uncommitted Drift**.
- **Changes:**
  - **Architecture/Lifecycle:** Heavy modifications to `deploy` commands (`oracle.command`, `oracle-bootstrap`, `nas`), `agents` CLI (`agents-md.command`), and `gitlab` clients (`wiki-publish`, `webhook-register-n8n`).
  - **Templates:** New config templates introduced for `n8n-gitlab` webhooks and `chef-infra-example` (Phase 3 preparations).
  - **Documentation:** Sweeping updates to the Canonical Wiki specifications (`wiki-Unified-Agentic-Operations-Platform.md`).

### B. `openstandard-ui` (Agent Builder & OSSA)
- **Status:** Clean working tree (`release-v0.4.x`).
- **Changes:** Recent commit (`13a5090`) completely replaced the legacy playground with the new Agent Builder API, matching the proxy architecture refinement goal.

### C. `drupal` (`ai_agents_crewai`)
- **Status:** **Massive Untracked Cascade**.
- **Changes:** Over 80 untracked files including ECA models, ECK entities, REST plugins, Field storages, and tests. Commit `3ebff6f` enabled composer package publishing. The module is structurally sprawling but uncommitted.

### D. `agent-docker` & `workflow-engine`
- **Status:** **Dirty Worktrees**.
- **Changes:** `agent-docker` contains our newly authored `sync-tunnel-config.mjs` and updated `.gitlab-ci.yml` (Platoon B). `workflow-engine` has uncommitted service modifications.

---

## 2. Gap Analysis & Architecture Alignment

Comparing the live state against the `todo/NEXT.md` directives and the Unified Architecture Spec:

- **Gap 1: Unsafe Git States:** The orchestration cannot proceed if the foundational CLI (`agent-buildkit`) and core modules (`ai_agents_crewai`) are sitting on hundreds of uncommitted lines. The runbook explicitly demands a `buildkit git push`.
- **Gap 2: MR Bottleneck:** CI/CD pipelines cannot flow to Oracle if the foundational dependencies are trapped in Merge Requests. The `NEXT.md` runbook explicitly lists `compliance-engine`, `workflow-engine`, `agentic-flows`, and `agent-buildkit` as sequential blockers.
- **Gap 3: Platoon Staging:** The Platoon A (n8n Webhooks) and Platoon B (Cloudflare Tunnels) artifacts are sitting as untracked templates. They need to be pushed and actively applied to the Oracle/Cloudflare topologies to unblock the Zero-Touch deployment pipeline.

---

## 3. Prioritized Remediation & Execution Sequence

The following sequence merges the User's `NEXT.md` runbook with the Agent Platoon strategy, ensuring safe execution without overlapping collisions.

### Phase 1: State Consolidation (The "Commit & Push" Sweep)
1. **Token Verification:** Run `buildkit gitlab token check` to ensure the session can push.
2. **Commit & Push `agent-buildkit`:** Commit all wiki updates, CLI modifications, and Platoon A/B scripts to the `agent-buildkit` repository.
3. **Commit & Push `drupal/ai_agents_crewai`:** Marshal all untracked ECA/ECK configurations and push to branch to prepare for pipeline evaluation.
4. **Commit & Push `agent-docker` & `workflow-engine`:** Lock in the `.gitlab-ci.yml` modifications.

### Phase 2: The Merge Chain
Execute the exact sequence defined in the runbook:
1. Merge `compliance-engine !78`
2. Merge `workflow-engine !60`
3. Merge `agentic-flows !24`
4. Merge `agent-buildkit !449`
5. Merge Drupal/demos (incorporating the `ai_agents_crewai` payload).

### Phase 3: Infrastructure Platoon Execution
Once the `agent-buildkit` MR is merged (delivering our new templates to main):
1. **Fire Platoon B (Ingress):** The merge into the infra repo containing `.gitlab-ci.yml` will trigger the `deploy:cloudflare-tunnel` job, automatically syncing the `tunnel-routes.json` to the live Cloudflare API.
2. **Fire Platoon A (Orchestration):** Import the newly merged `n8n-gitlab-needs-triage-workflow.json` into the Oracle `n8n` instance. Create the GitLab Webhook pointing to it.

### Phase 4: NAS & CI Runners Deployment
1. Execute the `03-gitlab-ci-mr-runners` deployment to the NAS to unblock future CI pipelines.
2. Provision `Drupal_AgentDash` on the NAS via the `consolidated/00-RUNBOOK-next-commands.md` script.

---

## 4. Risks & Required Decisions

- [!WARNING] **Oracle Disk Space:** The CI runners and new Dragonfly/Redis DBs rely on the `oracle-platform`. Disk space must be validated before allowing n8n to heavily trigger CI jobs.
- [!IMPORTANT] **Drupal Contrib Sprawl:** The `ai_agents_crewai` module is extremely heavy. We must decide if it should be split into smaller sub-modules before merging, or merged monolithic and refactored later.
- [!NOTE] **Service Account PAT Scope:** For Platoon A, the GitLab PAT bound to n8n must be strictly scoped to `api` for that *specific project* to prevent lateral movement if n8n is compromised.

## Verification Plan
1. **Phase 1 Validation:** `git status` across all `worktrees/` returns clean.
2. **Phase 2 Validation:** GitLab API confirms MRs 78, 60, 24, and 449 are merged and target branch pipelines are GREEN.
3. **Phase 3 Validation:**
   - Platoon A: Opening a test issue on GitLab successfully triggers an automated comment from the `srv-agent` Service Account via n8n.
   - Platoon B: Checking the Cloudflare Zero Trust Dashboard confirms the ingress rules match `tunnel-routes.json`.
