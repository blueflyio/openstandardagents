# Unified Master Task Plan (Updated 2026-03-08)

This file is the execution source-of-truth for:
1. OSSA Builder Separation of Duties refactor (Phase 2/3).
2. DUADP Sprint 3/4 & Federation Hardening.
3. AgentDash/Marketplace Consolidation.

## Active Priority Queue (Confirmed 2026-03-08)

1. **OSSA Builder Separation of Duties (Phase 2)**
   - Remove marketing pages/components/libs from `ossa-ui-api` (SoD violation).
   - Consolidate dual builder component trees into a single canonical source.
   - Fix `@bluefly/studio-ui` package artifacts for runtime safety.

2. **DUADP Sprint 3/4 (Federation & Ecosystem)**
   - Implement Cedar SOD enforcement in `reference-node` runtime.
   - Create `duadp_discovery` Drupal module for federated registries.
   - Finalize NIST CAISI follow-up whitepaper.

3. **Marketplace & AgentDash**
   - Consolidate 60+ skills into 10 domain-bounded plugins.
   - Finalize n8n/Kagent orchestration unification in AgentDash.

## Completed Milestones (Archived 2026-03-08)

- [x] **NIST CAISI RFI Integration (Phase 05)**: RFI submitted, tests verified, trust tiers implemented.
- [x] **DUADP Sprints 1 & 2**: Federated discovery, trust verification, and CLI are live.
- [x] **OSSA Builder SoD (Phase 1)**: Marketing redirects and component removals from `openstandardagents.org`.
- [x] **Marketplace Fix (Oracle:3090)**: Node.js API adapter replacing Drupal backend.

---

## OSSA Builder Separation of Duties - Refactor Plan (Phase 2/3)

### Phase 2 - ossa-ui-api: remove marketing-site copy and keep builder runtime

- [ ] Remove `app/builder/app/` marketing pages (`about/`, `blog/`, `docs/`, `enterprise/`, etc.).
- [ ] Remove `app/builder/components/` marketing elements (`blog/`, `social/`, `AnimatedHeroBackground.tsx`, etc.).
- [ ] Remove `app/builder/lib/` marketing data sync/fetch libs.
- [ ] Audit and remove marketing API routes from `app/builder/app/api/`.

### Phase 2A - consolidate best builder implementations into `ossa-ui-api`

- [ ] Define one canonical builder component tree in `ossa-ui-api` (merge `components/agent-builder/*` and `app/builder/components/agent-builder/*`).
- [ ] Merge strongest builder capabilities into canonical runtime (`VisualFlowBuilder`, `FlowDropBuilder`, `InteractiveBuilder`).
- [ ] Standardize route ownership: `/builder` as the canonical UI.

### Phase 3 - API parity and route audit in ossa-ui-api

- [ ] Audit `POST /api/builder/transform`; promote nested/legacy APIs to stable top-level.
- [ ] Fix `@bluefly/studio-ui` package imports (currently using temporary mitigation adapter).

---

## DUADP Sprint 3/4 - Hardening & Ecosystem

- [ ] Add and verify `/api/v1/invoke` Cedar pre-authorization behavior.
- [ ] Verify DNS trust gates for `_duadp` and `_agent` high-trust paths.
- [ ] Create `duadp_discovery` Drupal module.
- [ ] Demo video: federated discovery across 3 live nodes.
