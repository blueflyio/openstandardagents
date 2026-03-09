# Architecture Audit & Prioritized Implementation Plan

This document synthesizes our recent changes, identifying drift from the `SEPARATION-OF-DUTIES.md` and `AGENTS.md` principles, and provides a strict build-order remediation plan aligned exactly with `~/.agent-platform/agent-buildkit/todo/plans/00-ORIGINAL-PLAN-build-order.plan.md`.

## 1. Categorized Change Audit

### Architecture
- **Control Plane Redefinition:** The Node.js API (`Drupal_AgentMarketplace/api`) was previously misaligned by maintaining its own SQLite database. We have begun decoupling this by migrating the Node app to act as a pure, stateless caching proxy (using `node-cache` and `axios`) that sits in front of the centralized `agent-mesh` `GET /api/v1/discovery` endpoint.
- **OSSA Repositioning:** `@bluefly/openstandardagents` is now formally classified as an "OpenAPI for Agents"—a normative spec and schema validation distribution, rather than a framework.

### API Contract & Agent Lifecycle
- **Discovery Flow (UADP):** We have formalized that `agent-buildkit` is the sole publishing vector, scanning local `.agents/` directories and posting them to `agent-mesh`.
- **Registry Metadata:** We introduced requirement for `uuid`, `machine_name`, `publisher_namespace`, and critical trust signals (sha256 hashing, SBOM pointers, sigstore signatures, and revocation semantics like `deprecated` / `revoked`) into the OSSA spec.

### Execution Model & Platform Infrastructure
*(Per `config/AGENTS.md`)*
- **NPM-First Consumption:** Platform TypeScript services must be consumed via **npm packages** from the GitLab registry (`npm install -g @bluefly/*`). Git clones on the NAS are deprecated.
- **Single Source of Truth:** Code lives in GitLab; Deployments use the GitLab Package Registry.

### Security & Governance
- **Token Management & Single-Root Token:** All secrets are managed in `/Volumes/AgentPlatform/.env.local`. We must use the `BLUEFLY_ROOT_TOKEN` (or matching `GITLAB_TOKEN`), which also functions as the `GITLAB_REGISTRY_NPM_TOKEN`.
- **GitLab Token Deficit:** `agent-buildkit` token flows have been moved to `mesh-token-client` to avoid parsing `registry.yaml`, but the local `.env.local` token is currently revoked/unset according to `00-RUNBOOK-next-commands.md`.

---

## 2. Gap Analysis (Drift from Project/Env Requirements)

| Requirement Domain | Current State | Target State | Gap / Regression |
| :--- | :--- | :--- | :--- |
| **Node.js API Registry** | `marketplace/api` code still references SQLite controllers and models (`agent.controller.ts`, `agent.service.ts`). | Stateless frontend proxy mapping frontend requests to `agent-mesh`. | **Drift:** The controllers/services must be entirely gutted and rewired to export the `MeshDiscoveryClient`. |
| **Dev Environment (CLI)** | Local shell environment failing to resolve `npm` or `buildkit`. | Sourced `.env.local` providing `GITLAB_TOKEN` and global `npm install -g @bluefly/*`. | **Regression:** Env vars, `.bashrc`, and the GitLab registry token (`GITLAB_REGISTRY_NPM_TOKEN`) are misconfigured or revoked. |
| **Drupal AgentDash** | Out of sync with `WORKING_DEMOs`. | NAS `Drupal_AgentDash` exact mirror of `WORKING_DEMOs` deploying with recipes. | **Gap:** Requires `rsync`, GitLab group composer authentication, and bridging remaining `recipe_agentdash` gaps. |
| **GitLab MR Flow** | Active development MRs spread across `compliance-engine`, `workflow-engine`, etc. | Clean pipeline unblocking via runner injection and `release -> main` merge sequencing. | **Blocker:** Missing PAT in `.env.local` to trigger `merge-release-mrs-unblock.mjs`. |

---

## 3. Prioritized Remediation & Execution Plan (Alignment with `todo/plans`)

This sequence honors the master `00-ORIGINAL-PLAN-build-order.plan.md` while integrating the required Registry proxy fixes and `AGENTS.md` rules.

### Phase 1: Environment & Orchestration Unblocking (Critical Path)
1. **Refresh Access Tokens:** User must generate a new PAT (api, read_repository, write_repository) and add `GITLAB_TOKEN=` (and identical `GITLAB_REGISTRY_NPM_TOKEN=`) to `/Volumes/AgentPlatform/.env.local`.
2. **Verify CLI Environment:** Source `/Volumes/AgentPlatform/.env.local`. Verify `npm install -g @bluefly/agent-buildkit` resolves from the GitLab registry.
3. **Merge Queue (Release -> Main):** Execute the MR merges in strict dependency order:
   - *Services:* `compliance-engine !78`, `workflow-engine !60`, `agentic-flows !24`
   - *Tools:* `agent-buildkit !449`, `technical-docs !70`, `platform-agents !212`, `agent-protocol !66`
   - *Drupal / OSSA:* `drupal_fleet_manager !1`, `openstandardagents.org !322`

### Phase 2: Registry & OSSA Spec Alignment (The 4 Spawn Tracks)
*We must execute the UADP alignment code changes we just designed.*
1. **Node API Refactor (`spawn-mesh-integration`):**
   - Execute the rewiring of `agent.controller.ts` to utilize the new `MeshDiscoveryClient`.
   - Purge `agent.service.ts` and SQLite dependencies entirely.
2. **OSSA Schemas (`spawn-registry-metadata`):**
   - Inject `uuid`, SBOM pointers, and revocation semantics (`deprecated`) into the `openstandardagents` JSON Schemas.
3. **Frontend Wiring (`spawn-frontend-ux`):**
   - Link the Next.js `Marketplace` directly to the normalized `MeshDiscoveryClient` outputs.

### Phase 3: Drupal Sync & Recipe Bridge (NAS Fleet)
1. **Sync / Rsync `WORKING_DEMOs`:**
   `rsync -av --exclude='.ddev' --exclude='.git' --exclude='vendor' $HOME/Sites/blueflyio/WORKING_DEMOs/Drupal_AgentDash/ /Volumes/AgentPlatform/applications/Drupal_AgentDash/`
2. **Apply Recipes:** Run the strict recipe apply order: `recipe_agent_platform_core` -> `recipe_secure_drupal` -> `contrib_ecosystem_integration` -> `fleet_agent_client` -> `knowledge_graph` -> `recipe_agentdash`.
3. **Fleet-Extension Testing:** Verify Kernel tests inside `TESTING_DEMOs/DEMO_SITE_drupal_testing`.

---

## 4. Risks, Blockers & Design Decisions

> [!WARNING]
> **Blocker: Local Tooling & Pathing (`npm` / GitLab Registry)** <br/>
> The subagent terminal sessions currently lack `npm` and `buildkit`. Per `AGENTS.md`, we must consume these via `npm install -g @bluefly/*`. We cannot proceed with headless builds until the shell resolves `npm` and the `GITLAB_REGISTRY_NPM_TOKEN` is exported.

> [!CAUTION]
> **Blocker: Missing `.env.local` Single-Root Token** <br/>
> `00-RUNBOOK-next-commands.md` and `AGENTS.md` explicitly call out the token as revoked/needed. Before we can trigger MR merges or `buildkit git push`, a valid `BLUEFLY_ROOT_TOKEN` or `GITLAB_TOKEN` is required.

> [!IMPORTANT]
> **Design Decision Required:** <br/>
> For the new Drupal module (`agent_registry_consumer`), should we utilize the `http_client` service directly to ping `agent-mesh`, or route it through `api_normalization`? **Recommendation:** Route through `api_normalization` so uniform security context and logging applies.

---

## 5. Verification Plan

### Automated Tests
1. **Proxy Health:** Run `npm run dev` in the `marketplace/api` directory and hit `localhost:3000/api/v1/health` to confirm it connects to `agent-mesh`.
2. **OSSA Conformance CI:** Run schema validation tests (`npm run test:schema`) on the `openstandardagents` definitions.
3. **Drupal Kernel Tests:** Execute `ddev exec php core/scripts/run-tests.sh --sqlite /tmp/test.sqlite --class 'Drupal\Tests\recipe_onboarding_fleet_extension\Kernel\FleetExtensionKernelTest'` in the testing demo site.

### Manual Verification
1. User verifies GitLab token refresh by running `source /Volumes/AgentPlatform/.env.local` then `buildkit gitlab token check`.
2. Open `openstandardagents.org` on `localhost:9173` to ensure "Get Started" successfully redirects to `ossa-ui.blueflyagents.com` without loading local builder artifacts.
3. Use `buildkit agents discover --registry-url https://mesh.blueflyagents.com` in a local `.agents/` repository and manually verify Redis in `agent-mesh` populates the UADP entry.
