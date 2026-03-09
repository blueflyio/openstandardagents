# Audited Next Steps

- [x] Create comprehensive Architecture Audit and Gap Analysis (aligning OSSA UI work with BuildKit Todo).
- [ ] Phase 1: Close OSSA Architectural Gaps (Frontend UI Parity)
  - [x] Update `openstandard-ui` React forms using `studio-ui` components to surface the new `WizardState` payload (persona, autonomy).
  - [x] Implement robust asynchronous export polling in `.org` playground instead of assuming immediate export success.
- [ ] Phase 2: Complete BuildKit `NEXT.md` Roadmap (Immediate Priorities)
  - [x] Unblock MRs (`compliance-engine !78`, `workflow-engine !60`, `agentic-flows !24`, `agent-buildkit !449`).
  - [x] Execute `06-infrastructure-nas-oracle`: Deploy runner and verify Cloudflare tunnels.
  - [x] Spawn buildkit task: `drupal-recipes-research-rebuild` Orchestrator for `Drupal_AgentDash`.

- [ ] Phase 8 (MEDIUM): BuildKit Roadmap
  - [x] Docs/Wiki: SOD wiki (`buildkit gitlab wiki publish-sod`) and `.!*` wipe.
  - [x] Drupal: Fix Drupal CI for `api_normalization`; `http_client_manager/api_normalization and Key`
  - [x] OSSA: UI <-> Agent Studio API alignment; OSSA CLI cleanup.
  - [x] DRY: `drupal_patch_framework` worktree `.git` path.
  - [ ] Marketplace/Kagent: Kagent CRDs nested; MCP SKILLS_PATH.
