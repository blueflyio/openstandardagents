# 13 plans + one-off: status and remaining work

Single reference for the 13-point plan (and one-off) audit/execute pass. Update this page as items are completed or deferred.

## Done

| # | Item | Outcome |
|---|------|---------|
| 1 | Clone iac wiki to Wikis | iac.wiki present at `/Volumes/AgentPlatform/applications/Wikis/iac.wiki`. |
| 2 | Dragonfly audit and open-core plan | Wiki "Dragonfly and Drupal at full capability" published; Dragonfly AGENTS.md already has "Open-core (core vs premium, env)" subsection. |
| 3 | Dragonfly full audit and plan | deploy-branch: oracle.command.ts uses release/v0.1.x for dragonfly. Runbook and sod-path documented in "Dragonfly on Oracle (Runbook)" and full-capability page; both published. |
| 4 | Feature-merge-release-validate workflow | Encoded in AGENTS.md (sync first, buildkit repos sync / drupal sync-all, merge feature to release, validate, push). |
| 5 | Oracle Deploy BuildKit Phase 1 | workflow-engine, agent-tracer, agent-brain, foundation-bridge already in deploy-services.config.ts. setup-projects.json dragonfly gitlabPath set to blueflyio/agent-platform/services/dragonfly. |

## Remaining (execute next)

| # | Item | What to do |
|---|------|------------|
| 6 | GitLab CI Tools Integration | Add MCP/Mesh/Tracer health in CI via BuildKit or health jobs; agent-docker validate tunnel ConfigMap. |
| 7 | n8n Tenant Bootstrap Dragonfly SaaS | Implement tenant persistence, trigger, n8n workflow, parameterized config, runbooks, testing. |
| 8 | Oracle Deploy Phase 2–3 | Migrate Drupal_AgentMarketplace to oracle-deploy-buildkit; migrate remaining services. Fix agent-brain CI include path if 404 (full path to gitlab_components). |
| 9 | OSSA five repos release v0.4.x and CI | Create/push release/v0.4.x for studio-ui and openstandard-generated-agents where needed; fix openstandard-ui worktree .git if broken; CI on main: create patch (tag v0.4.x, GitLab Release). **setup-projects.json:** openstandard-ui and openstandard-generated-agents use `main`; openstandardagents and openstandardagents.org use `release/v0.4.x`. AGENTS.md: openstandard-ui uses release/v0.4.x; openstandard-generated-agents uses main. |
| 10 | OSSA repos latest and merged | openstandardagents / openstandardagents.org: commit or shelve, pull release/v0.4.x, push. openstandard-generated-agents, openstandard-ui, studio-ui: clone from __BARE_REPOS into WORKING_DEMOs if needed; checkout/pull correct branches per AGENTS.md. **Bare repo:** openstandard-ui at __BARE_REPOS/ossa/lab/openstandard-ui.git has HEAD at main. |
| 11 | OSSA UI Componentized Wizard | Phases 1–5: presets/skills to spec.tools, studio-ui components, openstandard-ui thin shell, real Tools step, other steps from /api/constants. |
| 12 | Own Kagent end-to-end | Phases 1–8: domains/config, catalog sync, orchestration/flowdrop submodules, MCP doc, deploy flow, Kagent chat, Tool plugins + ECA/FlowDrop, Wiki + AGENTS.md + OpenAPI. |
| 13 | Playwright E2E ownership | ide-supercharger (Playwright MCP in cursor mcp.json), agent-buildkit (playwright config, optional e2e, specs), Dragonfly (testTypes playwright, env, artifacts), dragonfly_client (trigger playwright, UI/Drush), gitlab_components (drupal-playwright), Wiki/AGENTS.md runbooks. |

## References

- Dragonfly and Drupal at full capability: agent-buildkit wiki **Dragonfly-and-Drupal-full-capability**.
- Dragonfly on Oracle: agent-buildkit wiki **Dragonfly-Oracle-Runbook**.
- OSSA stack branches: AGENTS.md "OSSA stack ownership" (release/v0.4.x for openstandardagents, openstandardagents.org, openstandard-ui; main for openstandard-generated-agents).
- setup-projects.json: dragonfly gitlabPath = blueflyio/agent-platform/services/dragonfly; OSSA repos branch alignment with AGENTS.md.
