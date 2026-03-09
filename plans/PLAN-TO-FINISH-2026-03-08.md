# Plan to Finish (Audit 2026-03-08)

This plan outlines the remaining work for all active projects as of March 8, 2026.

## 1. High-Priority: Marketplace Consolidation (Project 06)
- **Goal:** Consolidate 60+ skills into 10 cohesive plugins and deploy stable registry.
- [x] **Plugin Creation:** Scaffold the 10 domain-bounded plugins (`bluefly-agent-platform`, `bluefly-drupal`, `bluefly-ossa`, `bluefly-security`, `bluefly-cicd`, `bluefly-mcp-tools`, `bluefly-k8s-ops`, `bluefly-creative`, `bluefly-docs`, `bluefly-productivity`).
- [x] **Migration:** Move existing `.gemini/skills/` and commands into respective plugin directories.
- [x] **CI/CD:** Finalize GitLab CI pipeline for automated validation and publishing to `marketplace.drupl.ai`.
- [ ] **Backend:** Verify `marketplace-api.mjs` on Oracle handles all JSON:API requests correctly.

## 2. OSSA Builder Separation of Duties (Project 07)
- **Goal:** Cleanly separate marketing (`openstandardagents.org`) from builder runtime (`build.openstandardagents.org`).
- [x] **UI Porting:** Ported `daemon` and `skills` components from `ossa-studio` to `studio-ui` npm package.
- [ ] **Phase 2 (ossa-studio cleanup):**
  - [ ] Remove all marketing pages (`about/`, `blog/`, `brand/`, etc.) from `ossa-studio/app/builder/app/`.
  - [ ] Remove marketing components and libs from `ossa-studio`.
- [ ] **Phase 3 (API Parity):**
  - [ ] Audit and promote `POST /api/builder/transform` to a stable top-level API.
  - [ ] Fix `GET /api/wizard/definitions` (currently 404).
- [ ] **Phase 4 (Cross-site):**
  - [ ] Update `duadp.org` and `duadp.org` to point all builder references to the external host.

## NEW: Power Tool Decentralization (Project 08 - COMPLETED)
- **Goal:** Make `agent-buildkit` a lightweight router and decentralize logic.
- [x] **CLI Aggregation:** Refactored `buildkit` to proxy `deploy` (to `iac`), `duadp`, and `ide` CLIs.
- [x] **Logic Extraction:** Moved 27 deployment scripts to `iac` repository.
- [x] **Script Decentralization:** Moved orchestration and IDE scripts to `platform-agents` and `ide-supercharger`.
- [x] **Distributed Manifests:** Initialized `.agents/agents` structure across all critical projects.

## 3. NIST CAISI RFI Mapping (Project 05 Remaining)
- **Goal:** Deliver the final mapping appendix.
- [ ] **Drafting:** Create a concise mapping document linking OSSA identity, auth, and discovery to CAISI requirements.
- [ ] **Publishing:** Add the mapping to `openstandardagents.org/nist`.

## 4. DUADP Federated Network (Project 02)
- **Goal:** Mature from a single node to a living federated network.
- [ ] **Sprint 2 (Trust):** Finalize automated trust verification in the reference node.
- [ ] **Sprint 3 (Enforcement):** Fully wire Cedar enforcement into the tool invocation path.
- [ ] **Sprint 4 (Ecosystem):** Deploy the `duadp_discovery` Drupal module to turn Drupal sites into registry nodes.

## 5. AgentDash Orchestration (Project 03)
- **Goal:** Unified control plane for n8n/Kagent.
- [ ] **Phase 3:** Unify the orchestration providers.
- [ ] **Phase 4:** Verify FlowDrop ECA drag-and-drop workflow builder.

## 6. Social-Paw Channel Adapters (Project 01)
- **Goal:** Live social amplification.
- [ ] **Phase 3:** Implement Discord, Bluesky, and X adapters.
- [ ] **Phase 5:** Wire up the research -> writer -> reviewer pipeline for auto-posting.

## 7. Dragonfly Test Client (Project 04)
- **Goal:** Automated Drupal AI testing.
- [ ] **Client Setup:** Initialize `dragonfly_client` in the demo Drupal environment.
- [ ] **GitOps:** Finalize the branch-and-deploy logic via Buildkit.

---

## Status Reconciliation
- **Project 05 (NIST Execution):** COMPLETED and moved to `completed/`.
- **Project 07 (OSSA Builder Phase 1):** COMPLETED.
- **DUADP Sprint 1:** COMPLETED.
