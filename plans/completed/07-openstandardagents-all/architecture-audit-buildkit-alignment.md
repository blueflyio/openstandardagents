# OSSA Architecture Audit & BuildKit Alignment Plan

> **Authoritative version:** This page is the canonical audit and alignment plan. Published from agent-buildkit to the GitLab Wiki (technical-docs).

---

## 1. Categorized Change Audit

### Architecture & Agent Lifecycle

- **Thin-Client Shift:** openstandardagents.org was successfully decoupled from local CLI execution. It now proxies agent orchestration (init, validate, export) to ossa-ui.blueflyagents.com.
- **Discovery Decentralization (UADP):** Introduced the `/api/discovery` pipeline bridging the local `.agents-workspace` (development) and agent-mesh.blueflyagents.com/api/v1/discovery (production).
- **Parity:** The openstandard-ui API (`/api/manifest/generate`) now matches the CLI manifest builder payload, natively parsing persona, autonomy levels, and advanced tool configs.

### API Contract & Execution Model

- **Execution Delegation:** The marketing site (.org) now treats agent creation as a remote, asynchronous event via the UI backend.
- **Component Usage:** studio-ui adherence is enforced at the package level, standardizing the React surface.

### Security & Governance

- **Execution Boundary:** Removed bash/subprocess execution vulnerabilities from the .org marketing site. Actual generation runs safely within isolated ossa-ui contexts.

---

## 2. Gap Analysis & Architectural Drift

| Area | Current State | Required State (BuildKit Todo) | Gap / Regression |
|------|---------------|--------------------------------|------------------|
| UI Component Parity | `useWizardState.ts` and the generation API contain new fields (persona, autonomy). | The UI forms must visibly render these fields using studio-ui components. | **High Drift:** The backend API has surpassed the frontend inputs. Need to update React components. |
| Pipeline Status | .org proxies export jobs to ossa-ui and assumes success. | ossa-ui triggers GitLab pipelines and requires webhook/polling for actual status. | **Execution Gap:** Missing a robust polling mechanism to show asynchronous export pipeline success/failure on the .org UI. |
| BuildKit Alignment | Focus has been exclusively on OSSA Next.js projects. | NEXT.md requires MR merges, GitLab Runners on NAS (06-infrastructure), and Drupal Recipes (02). | **Priority Drift:** We are working on OSSA agent builder while the BuildKit runbook requires CI/CD runner deployment and Drupal recipe execution. |

---

## 3. Prioritized Remediation & Enhancement Plan

### Phase 1: Close OSSA Architectural Gaps (Immediate)

1. **Frontend Input Alignment:** Update openstandard-ui wizard forms (04a-persona, 06-autonomy) using studio-ui components so the user can actually input the new data points we added to the API.
2. **Export Polling & Feedback:** Build frontend polling in .org playground to query `/api/export/{id}/status` from ossa-ui to reflect real GitLab pipeline states (triggered vs running vs failed).

### Phase 2: Re-align with BuildKit NEXT.md (Strategic)

1. **CI/CD Stabilization:** Unblock MRs (compliance-engine !78, workflow-engine !60, agentic-flows !24, agent-buildkit !449) to turn the pipeline green.
2. **NAS Infrastructure (06):** Deploy GitLab runners to the Bluefly NAS and verify the Cloudflare tunnel endpoints to handle agent execution centrally without timing out.
3. **Drupal Demo Consolidation:** Spawn the drupal-recipes-research-rebuild Orchestrator task targeting /Volumes/AgentPlatform/applications/Drupal_AgentDash.

---

## 4. Risks, Blockers, & Required Design Decisions

**WARNING – Risk – State Desynchronization:** The UADP discovery reads from a static .yml or agent-mesh. If agents are created but the mesh registry is not updated, the playground will show stale data. **Decision Required:** Do we trigger an automatic registry ping to agent-mesh upon a successful OSSA Agent export pipeline?

**CAUTION – Blocker – CI Constraints:** NEXT.md indicates we need 3-minute CI pipelines. Current proxy pipelines might exceed this if they are building heavy docker images synchronously. **Decision Required:** Standardize on decoupled async exports where the UI immediately returns a "202 Accepted" pipeline ID and polling handles the latency.

---

## 5. CI/CD, Testing, and Documentation Work Items

- **Testing:** Add Jest/Playwright tests asserting the new proxy flow. Mock ossa-ui 500 errors to ensure the playground degrades gracefully.
- **Documentation:** Update the GitLab Wiki (technical-docs.wiki/developer-guides/) to document the UADP discovery schema requirements so new agents automatically appear in the playground.
- **CI/CD:** Add a matrix to the openstandard-ui GitLab CI config to test manifestation against docker, kubernetes, and crewai export targets daily.
