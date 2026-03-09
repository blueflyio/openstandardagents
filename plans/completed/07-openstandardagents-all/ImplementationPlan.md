# Agent Platform MVP Roadmap

This document outlines the roadmap to achieve the MVP for the Agent Platform, breaking down the work across all relevant initiatives into 4-8 hour sprints.

## Strategic Goals for MVP
1. **Unify OSSA (Open Standard for Software Agents)** across all implementations (CLI tools, registries, and generated agents).
2. **Establish the Drupal Agent Marketplace** as the canonical registry and distribution hub, seamlessly serving both UI (NODE-AgentMarketplace) and IDE requests.
3. **Operationalize the Fleet Manager and AgentDash**, allowing centralized control, deployment, and monitoring of agent operations across 100s of Drupal sites.
4. **Harness openstandard-generated-agents** as the standard template for expanding the platform's capabilities rapidly.
5. **Strict Adherence to Separation of Duties (SOD):** Ensure `openstandardagents` owns the CLI and spec, `studio-ui` owns all React components, `openstandard-ui` consumes these to provide API/Wizard, and `Drupal`/`NODE-AgentMarketplace` act strictly as backends and consumer frontends without duplicating logic.

---

## Sprint 1: Registry and Discovery Core (4-8 Hours)
**Focus:** Finalize the underlying OSSA specifications and ensure the primary registry (Drupal_AgentMarketplace) accurately serves them.

### Tasks:
- [ ] **openstandardagents Spec Sync:** Verify `openstandardagents.org` and `@bluefly/openstandardagents` are fully aligned on the v0.4 schema.
- [ ] **Drupal Marketplace API Validation:** Ensure `Drupal_AgentMarketplace` correctly validates manifests against the latest OSSA schema via its JSON:API endpoints.
- [ ] **IDE Marketplace Proxy Setup:** Configure `marketplace` (ide-marketplace) to point correctly to the Drupal registry endpoints or serve the static fallback manifests accurately.
- [ ] **Test Registry Sync:** Run cross-system tests to verify an agent created in Drupal appears correctly in `NODE-AgentMarketplace` and via the `marketplace` IDE endpoint.

---

## Sprint 2: Frontend Unification and Generator Templates (4-8 Hours)
**Focus:** Connect the `NODE-AgentMarketplace` frontend to the finalized backend and establish the `openstandard-generated-agents` as the standard scaffolding tool.

### Tasks:
- [ ] **NODE-AgentMarketplace Connect:** Finalize the connection between `NODE-AgentMarketplace` and `Drupal_AgentMarketplace`. Remove reliance on local mock data.
- [ ] **OSSA UI Wizard Integration:** Ensure the "Create-agent" wizard in the frontend correctly proxies to `openstandard-ui` (ossa-ui) and validates OSSA v0.4 manifests.
- [ ] **openstandard-generated-agents Pipeline:** Configure the UI `POST /api/export` proxy to successfully trigger the `openstandard-generated-agents` CI pipeline.
- [ ] **Verify CI/CD Export:** Ensure the generated agents pipeline correctly decodes, validates, exports, and persists the new agent into the `.agents/` folder.
- [ ] **Innovation Focus:** Enhance the generated agent export step to automatically inject standard configuration payloads specifically tailored for integration with `Drupal_AgentDash` and `dragonfly` telemetry.

---

## Sprint 3: Fleet Management and Telemetry (4-8 Hours)
**Focus:** Integrate AgentDash and Fleet Manager to monitor and manage the agents deployed from the marketplace, scaling to hundreds of interconnected Drupal sites.

### Tasks:
- [ ] **AgentDash Setup:** Deploy `Drupal_AgentDash` locally/NAS and ensure it can read from the central registry.
- [ ] **Fleet Manager Integration:** Connect `Drupal_Fleet_Manager` to act as the central orchestrator for 100s of Drupal sites, utilizing `drupal ai`, deployed AI agents, and `dragonfly`.
- [ ] **Dragonfly Telemetry:** Configure `dragonfly` to serve as the quality gate and automated test orchestrator, receiving testing and health data from spawned agents and surfacing this in `AgentDash`.
- [ ] **Agent Status Visualization:** Implement UI components locally from `@bluefly/studio-ui` in AgentDash to visualize active agents, their resource usage, and their current mission status.

---

## Sprint 4: CI/CD, Deployment, and Infrastructure (4-8 Hours)
**Focus:** Solidify the buildkit pipelines and deployment scripts to ensure reliable updates across the macro-architecture.

### Tasks:
- [ ] **Review Buildkit TODOs:** Address the priority items in `~/.agent-platform/agent-buildkit/todo/RUNBOOK.md`.
- [ ] **Oracle Deployment Verification:** Verify the `deploy:oracle` scripts for `AgentDash`, `dragonfly`, and the IDE `marketplace`.
- [ ] **NAS Synchronization:** Ensure the `ddev sync-all-from-nas` workflows are robust and documented for any new developers joining the MVP phase.
- [ ] **End-to-End Spawn Test:** Use `buildkit agent spawn-team` to simulate a full deployment and verify all systems communicate correctly without manual intervention.

---

## Sprint 5: Documentation, Polish, and MVP Release (4-8 Hours)
**Focus:** Final review of the MVP features, documentation updates, and bug squashing.

### Tasks:
- [ ] **Documentation Update:** Update `README.md` and wiki pages across all repos to reflect the MVP state.
- [ ] **Security Audit:** Review all `.env.example` files and API access controls (especially JWT/API key setups in the marketplace).
- [ ] **User Acceptance Testing (UAT):** Run through the complete flow:
	1. Create agent via NODE-AgentMarketplace (using openstandard-ui wizard).
	2. Publish to Drupal_AgentMarketplace.
	3. Discover via IDE Marketplace endpoint.
	4. Monitor health via AgentDash and Dragonfly.
- [ ] **Final MVP Release:** Tag the MVP release candidate across all tracked repositories.




  1. Clone iac wiki to Wikis

  • Not done: All steps (one-off).
    • Ensure /Volumes/AgentPlatform/applications/Wikis exists.
    • Clone https://gitlab.com/blueflyio/agent-platform/infra/iac.wiki.git to
      /Volumes/AgentPlatform/applications/Wikis/iac.wiki.
    • Optional: list Wikis dir and confirm iac.wiki is there.


  ────────────────────────────────────────



  2. Dragonfly audit and open-core plan

  • Phase E contract: Align POST /tests/trigger with Phase E schema
    (TriggerInputSchema/TriggerOutputSchema).
  • Core vs premium split: Not done (single codebase, no packages/core vs
    packages/premium, no feature flags).
  • dragonfly_client ECA: Add DragonflyEvents::TENANT_BOOTSTRAPPED; ECA event
    DragonflyTenantBootstrapped; ECA action BootstrapDragonflyTenant; optionally
    dispatch TENANT_BOOTSTRAPPED after success.
  • Wiki: Publish GitLab Wiki page “Dragonfly and Drupal at full capability”.
  • Feature-flag tenant (Option A): Register tenant routes only when
    N8N_TENANT_BOOTSTRAP_WEBHOOK_URL (or DRAGONFLY_PREMIUM_ENABLED) is set;
    otherwise 403 or don’t mount.
  • AGENTS.md: Add “Open-core” subsection in Dragonfly AGENTS.md.
  • Phase 3 (later): Extract core (Option B); BuildKit dragonfly tenant CLI when
    BuildKit is open source.
  • Research doc: Create in GitLab Wiki (Drupal AI/ECA/orchestration full
    capability).


  ────────────────────────────────────────



  3. Dragonfly full audit and plan

  • sod-path: Document in plan/wiki: all Drupal work only in
    TESTING_DEMOS/DEMO_SITE_drupal_testing; workflow = push from worktree then
    remove and pull down dragonfly_client.
  • workflow-doc: Add to dragonfly_client AGENTS.md or Wiki: “Push up from
    worktree; in DEMO_SITE_drupal_testing remove
    web/modules/custom/dragonfly_client and clone/pull from GitLab.”
  • deploy-branch: In agent-buildkit oracle.command.ts, use release/v0.1.x for
    dragonfly in MAIN_STACK_IMAGE_BUILDS (or document why main).
  • setup-projects: In agent-buildkit config-templates/setup-projects.json, set
    dragonfly gitlabPath to blueflyio/agent-platform/services/dragonfly.
  • oracle-setup: Deprecate or update oracle-setup-dragonfly to
    ORACLE_BASE/services/dragonfly and main stack.
  • runbook: Add/update agent-buildkit wiki runbook: Dragonfly on Oracle (clone
    path, compose, env, health, repair).


  ────────────────────────────────────────



  4. Dragonfly SaaS platform plan

  • Phase 1 – Landing: Public route (e.g. (marketing)/page.tsx at / or /home);
    DashboardShell allows public paths; landing copy + CTA; “Sign in” → /login.
  • Phase 2 – Admin: “Connect your Drupal site” (copy, base URL, API path, link to
    dragonfly_client); optional GET/PUT settings API + form.
  • Phase 3 – Production: Same-origin or CORS + cookie for production; optional
    Passport GitLab/Drupal OAuth; wiki docs for self-host and SaaS.
  • Tech debt: Fix production dashboard (same-origin or CORS + cookie); no static
    export if it blocks session cookies for SaaS.


  ────────────────────────────────────────



  5. Feature-merge-release-validate workflow

  • Encode workflow: Add subsection in AGENTS.md: merge feature into release
    locally, run local validation (build + test), then push; sync/pull before work;
     optional short runbook in todo for the five WORKING_DEMOs.
  • Validate before push: Either document only (run build/test then merge-release)
    or add --validate to buildkit git merge-release.
  • Sync before/after: Document: before work buildkit repos sync --path
    WORKING_DEMOs (and drupal sync-all with applications-root when relevant); after
     merge+validate use merge-release or drupal sync-all.
  • Todo-driven build: Audit five repos for hardcoded URLs; push registry-related
    changes; define and document validate commands per repo.
  • Optional: Single runbook file under todo (e.g.
    WORKFLOW-MERGE-RELEASE-VALIDATE.md) for the five OSSA/studio-ui WORKING_DEMOs.


  ────────────────────────────────────────



  6. GitLab CI Tools Integration

  • Protocol (MCP) in CI: Use via BuildKit (e.g. buildkit gitlab ci validate or
    component that runs buildkit platform doctor); or CI job that curls MCP health
    (and optional tool list) with token.
  • Mesh in CI: Optional buildkit mesh health or use buildkit platform doctor in a
    job.
  • Tracer in CI: In otel-instrument (or agent-platform component), set OTLP
    endpoint to tracer when AGENT_TRACER_URL (or CI var) is set.
  • Docker (agent-docker) in CI: Add job (or buildkit command) that validates
    tunnel ConfigMap/route list (e.g. against @bluefly/iac tunnel-routes).


  ────────────────────────────────────────



  7. n8n Tenant Bootstrap Dragonfly SaaS

  • Full implementation (Dragonfly backend + n8n workflow + parameterization +
    docs) per plan sections 1–5 (tenant persistence, trigger, call n8n, response
    contract, optional tenant project registration; n8n workflow; parameterized
    config; runbooks; testing).


  ────────────────────────────────────────



  8. Oracle Deploy BuildKit Standardization

  • Phase 1: Add workflow-engine, agent-tracer, agent-brain, foundation-bridge to
    deploy-services.config.ts.
  • Phase 2: Migrate Drupal_AgentMarketplace to oracle-deploy-buildkit (remove
    custom deploy:oracle, add component with service_name agent-marketplace).
  • Phase 3: Migrate workflow-engine, dragonfly, agent-tracer, agent-router,
    agent-protocol, foundation-bridge, agent-brain from oracle-deploy to
    oracle-deploy-buildkit; fix agent-brain path and component ref.
  • agent-brain path bug: Fix gitlab_components include path (add
    agent-platform/tools).


  ────────────────────────────────────────



  9. OSSA five repos release v0.4.x and CI patch

  • Branches: Create and push release/v0.4.x for studio-ui and
    openstandard-generated-agents; ensure all five have working copy on
    release/v0.4.x; fix openstandard-ui worktree .git path if broken.
  • CI patch: In each of the five repos, add or adjust CI so pipeline on main
    creates next patch (tag v0.4.X, GitLab Release): openstandardagents
    (semantic-release or patch job), openstandardagents.org, openstandard-ui,
    studio-ui, openstandard-generated-agents (tag only).


  ────────────────────────────────────────



  10. OSSA repos latest and merged

  • openstandardagents: Commit or shelve local changes; git pull origin
    release/v0.4.x; push if you merged other branches.
  • openstandardagents.org: Commit or shelve local changes; git pull origin
    release/v0.4.x; optionally merge release/v0.4.1 and release/v0.3.x into
    release/v0.4.x and push.
  • openstandard-generated-agents, openstandard-ui, studio-ui: Not git repos in
    WORKING_DEMOs; clone from __BARE_REPOS into WORKING_DEMOs, checkout and pull
    correct branch (main for openstandard-generated-agents; release/v0.4.x for
    openstandard-ui; release/v0.1.x for studio-ui).


  ────────────────────────────────────────



  11. OSSA UI Componentized Wizard

  • Phase 1: Define/implement mapping from “selected presets + selected skills” to
    spec.tools; confirm API returns toolPresets/skills.
  • Phase 2: Add and export in studio-ui: AgentWizardShell, AgentWizardStepTools,
    AgentWizardStepBasics, Domain, LLM, Autonomy, Governance, Deployment, Review;
    fix React/Next compatibility for wizard.
  • Phase 3: Refactor openstandard-ui agent-builder page to thin shell (fetch,
    state, studio-ui only); remove inline step UI and Tools placeholder.
  • Phase 4: Real Tools step (presets + skills, multi-select, selection → manifest
    spec.tools).
  • Phase 5: Other steps with real data (Domain, Autonomy, Governance, Deployment,
    Review) from /api/constants and studio-ui components.


  ────────────────────────────────────────



  12. Own Kagent End-to-End

  • Phase 1: Domains and config (wiki pointer; ai_agents_kagent config/schema; Key
    for auth if needed).
  • Phase 2: Kagent catalog sync (catalog source, storage, sync mechanism,
    Drush/cron, Tool plugin, optional ai_agents_ossa mapping).
  • Phase 3: ai_agents_kagent_orchestration and ai_agents_kagent_flowdrop
    submodules; ECA actions for sync/invoke if missing.
  • Phase 4: MCP and Drupal (doc “MCP and Kagent in Drupal”; config for Kagent→MCP
    URL).
  • Phase 5: Deploy flow (nested CRD everywhere; OSSA→Kagent path; catalog→Deploy;
    optional UI link from OSSA).
  • Phase 6: Kagent chat (KagentApiService.invokeAgent; AiAgent plugin
    KagentInvokeAgent; ai_chatbot config; doc).
  • Phase 7: InvokeKagentAgent + SyncCatalog Tool plugins; ECA models/actions;
    FlowDrop nodes aligned with tools.
  • Phase 8: Wiki “Kagent-Drupal-Integration”; update module AGENTS.md; OpenAPI and
     api-schema-registry.


  ────────────────────────────────────────



  13. Playwright E2E ownership and integration

  • ide-supercharger: Add Playwright MCP to templates/ide-configs/cursor/mcp.json.
  • agent-buildkit: Add config-templates/playwright-base.config.ts (and env docs);
    optional buildkit e2e or playwright script; add platform-health and
    dragonfly-roundtrip specs.
  • Dragonfly: Document and support testTypes playwright/e2e; env (BASE_URL, etc.)
    and artifacts for Playwright.
  • dragonfly_client: Document (and if needed, add) triggering with testTypes
    including playwright; optional UI/Drush.
  • gitlab_components: Add or confirm drupal-playwright component; align with
    Dragonfly test_dir/config.
  • Wiki/AGENTS.md: Short “Playwright E2E and platform context” and “Dragonfly
    Playwright” runbooks; link from AGENTS.md.


  ────────────────────────────────────────

  Summary: 13 plans; most have multiple open items. Heaviest “not done” areas:
  Dragonfly (audit, open-core, SaaS, full audit, n8n tenant), OSSA (five repos
  branches/CI, repos latest/merged, componentized wizard), Oracle deploy
  standardization, Kagent end-to-end (all 8 phases), and Playwright E2E
  (ide-supercharger, buildkit, Dragonfly, dragonfly_client, gitlab_components, docs).
   Single one-off: clone iac wiki to Wikis.