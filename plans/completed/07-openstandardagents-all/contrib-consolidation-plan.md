# Drupal Contrib Consolidation Plan

**Purpose:** Transition custom code to industry-standard Drupal contrib. Single source of truth for the task list. No new custom logic where contrib exists.

**Scope:** Custom modules in TESTING_DEMOS/DEMO_SITE_drupal_testing and WORKING_DEMOs Drupal sites; all API integration, AI, workflows, registries.

**Primary reference site (this plan):** `WORKING_DEMOs/Drupal_AgentMarketplace` (path: `$HOME/Sites/blueflyio/WORKING_DEMOs/Drupal_AgentMarketplace`). Custom code lives under `web/modules/custom/`. All consolidation tasks and pillar mapping below are defined so they can be executed against the marketplace codebase (and/or TESTING_DEMOs where custom development is done).

**Phase B progress (structural isolation):** S.4 (no .sh) done: forbidden `.sh` files removed from marketplace custom (ai_agents_crewai `scripts/__DELETE_LATER/setup-environment.sh`, recipe_onboarding `scripts/__DELETE_LATER/setup-environment.sh`, `tools/scripts/lint-openapi.sh`, `tools/scripts/render-openapi.sh`). Remaining gaps: agent_marketplace, agent_registry_consumer, ai_agents_marketplace, ai_provider_routing_eca, mcp_registry — missing .git (not a repo) and/or .gitlab-ci.yml; agent_marketplace also missing config/install or config/schema. Next: create GitLab repos and add .git + CI + config for those five, or consume them via Composer from existing repos and remove copies from marketplace.

---

## Drupal_AgentMarketplace Custom Modules (Audit)

| Module | Role | HTTP pattern | Tool plugins | Pillars |
|--------|------|--------------|--------------|---------|
| ai_agents_marketplace | Discovery proxy, wizard, create flow | Guzzle ClientInterface (MarketplaceHttpAdapter) | — | 1, 4, 7 |
| ai_agents_crewai | CrewAI integration | http_client_manager (some), HttpClientInterface | RunCrewAiCrew, ListCrewAiAgents, GetCrewAiStatus, ListCrews, ExecuteCrewTask, CreateCrew | 1, 4 |
| ai_agents_claude | Claude agent/tools | — | RunClaudeAgent, ReadFileWithClaude, ManageClaudeSession | 1, 3 |
| api_normalization | OpenAPI import, gateway, Tool gen | Guzzle ClientInterface (many services/forms/controllers) | 25+ (CallApiEndpoint, ImportOpenApiSchema, etc.) | 1, 4 |
| dragonfly_client | Dragonfly API client | http_client_manager (DragonflyOrchestrator, tools) | 20+ (TriggerDragonflyTest, OrchestrateTestCycle, etc.) | 1, 4, 7 |
| dragonfly_client_orchestration | Expose tools to orchestration | — | ServicesProvider | 2 |
| drupal_patch_framework | Patches, GitLab/Drupal.org | Guzzle ClientInterface (DrupalOrgClient, PatchFrameworkHttpAdapter) | ValidatePatch, ApplyPatch, TestPatch, SearchPatches, etc. | 1, 4 |
| agent_registry_consumer | Registry HTTP adapter | HttpClientInterface | — | 4 |
| agentic_canvas_blocks | Canvas blocks, platform health | — | — | 7 |
| apidog_integration | ApiDog API | Guzzle ClientInterface (ApidogApiClient) | — | 4 |
| blockchain_manager | Blockchain orchestrator | — | — | 2 (orchestrator pattern) |
| agent_marketplace | Wrapper/glue | — | — | — |

**HTTP migration priority (marketplace):** (1) ai_agents_marketplace → http_client_manager + config/Key for mesh/OSSA URLs. (2) api_normalization → keep single internal Guzzle for fetch only where necessary; all external APIs via .http_services_api.yml. (3) drupal_patch_framework → http_client_manager for GitLab + Drupal.org. (4) apidog_integration → http_client_manager. (5) agent_registry_consumer already uses HttpClientInterface; align with http_client_manager API definitions.

**Orchestration / state (marketplace):** dragonfly_client has DragonflyOrchestrator (test orchestration; keep). ai_agents_crewai has CrewOrchestrationManager (multi-agent; keep or delegate to workflow-engine via Tool). blockchain_manager has BlockchainOrchestrator (domain-specific; keep). No FleetOrchestratorService or ServiceIntegrationOrchestrator in marketplace; orchestration exposure is via dragonfly_client_orchestration (contrib drupal/orchestration).

---

## Current Custom Patterns (Audit Summary)

| Domain | Custom pattern | Contrib target |
|--------|----------------|----------------|
| API / HTTP | Raw Guzzle, @http_client, one-off clients | http_client_manager, api_normalization |
| Executable actions | Custom service methods, RPC-style | drupal/tool (Tool plugins) |
| AI / LLM | Custom provider bridges, mesh scrapers | drupal/ai, drupal/ai_agents, ai_agents_ossa |
| Workflows / state | ServiceIntegrationOrchestrator, FleetOrchestratorService, PHP loops | drupal/eca, drupal/maestro, drupal/orchestration |
| Discovery / registry | McpServerProject entities, custom discovery | ai_agents, ai_agents_ossa (OSSA → Tool) |
| Observability | Custom metric tables, token logs | drupal/audit_export, tracer.blueflyagents.com |
| Config / secrets | $settings, hardcoded URLs | drupal/key, config/schema, admin UI |

---

## Phase A: Fix Broken Custom Code & Bootstrap (Completed)

- [x] Fix PHP parse errors and missing methods in mcp_registry
- [x] Fix variable shadowing/syntax in ai_agents_client, ai_agents_claude, ai_agents_cursor
- [x] Fix routing (non-existent controllers) in ai_agents_kagent, mcp_registry
- [x] Fix Git conflict markers in DragonflySettingsForm
- [x] Confirm `ddev drush cr` completes

---

## Phase B: Seven Pillars (Explicit Task List)

### Pillar 1: Tool API (drupal/tool)

| # | Task | Owner module | Done |
|---|------|--------------|------|
| 1.1 | Audit: list all custom PHP/Guzzle acting as executable functions (mcp_registry, ai_agents_client, code_executor, dragonfly_client, recipe_onboarding, etc.) | — | |
| 1.2 | Adopt tool_belt: if standard tools exist for fetch/read/strings, delete custom equivalents | per module | |
| 1.3 | Migrate each remaining executable to a Tool plugin under src/Plugin/Tool/ | per module | |
| 1.4 | Enforcement: no callable logic without a Tool plugin; register with tool_ai_connector/orchestration | CI / review | |

### Pillar 2: State Execution (ECA, Maestro, Orchestration)

| # | Task | Done |
|---|------|------|
| 2.1 | Deprecate ServiceIntegrationOrchestrator, FleetOrchestratorService, hook-based sync loops | |
| 2.2 | Install drupal/eca, drupal/maestro (and maestro_activepieces if needed) | |
| 2.3 | Install drupal/orchestration; proxy workflows to n8n/Activepieces via orchestration | |
| 2.4 | Replace custom fleet/rollout PHP with ECA actions + Tool plugins or maestro workflows | |

### Pillar 3: AI Ecosystem (drupal/ai)

| # | Task | Done |
|---|------|------|
| 3.1 | Use drupal/ai only for LLM routing and Key; remove custom provider bridges | |
| 3.2 | Replace custom discovery (McpServerProject, mesh scrapers) with ai_agents + ai_agents_ossa | |
| 3.3 | Install ai_agents_ossa; parse OSSA capabilities into Tool plugins; disable custom scrapers | |

### Pillar 4: API Normalization (drupal/api_normalization)

| # | Task | Done |
|---|------|------|
| 4.1 | Ban raw @http_client in custom: add CI rule or grep gate | |
| 4.2 | Locate OpenAPI specs for Mesh, MCP, workflow-engine, compliance, dragonfly | |
| 4.3 | Import specs into api_normalization; generate Tool plugins and gateway routes | |
| 4.4 | Remove custom Guzzle wrappers in mcp_registry, ai_agents_client, cedar_policy, recipe_onboarding_fleet_extension, code_executor, dragonfly_client | |

### Pillar 5: FlowDrop Ecosystem

| # | Task | Done |
|---|------|------|
| 5.1 | Install drupal/flowdrop, drupal/flowdrop_ui | |
| 5.2 | Install flowdrop_tool_provider (expose Tool plugins on canvas) | |
| 5.3 | Install flowdrop_ai, flowdrop_ai_provider | |
| 5.4 | Implement flowdrop_ui_agents, flowdrop_field_widget_actions where needed | |

### Pillar 6: Observability (drupal/audit_export)

| # | Task | Done |
|---|------|------|
| 6.1 | Purge custom DB tables for time-series, token counts, agent execution logs | |
| 6.2 | Install drupal/audit_export (and audit_export_tool if present) | |
| 6.3 | Pipe tool/maestro execution through audit_export to tracer.blueflyagents.com | |

### Pillar 7: Architecture via Config

| # | Task | Done |
|---|------|------|
| 7.1 | Zero hardcoded endpoints: purge *.blueflyagents.com and private IPs from custom code | |
| 7.2 | Migrate secrets/API keys to drupal/key | |
| 7.3 | Add config/schema/*.schema.yml for all custom settings | |
| 7.4 | All parameters editable via admin UI (no $settings for module logic) | |

---

## Module-to-Pillar Mapping (Where to Change What)

| Module | Pillars | Priority |
|--------|---------|----------|
| mcp_registry | 1, 4, 3 | High |
| ai_agents_client | 1, 4, 3 | High |
| recipe_onboarding, recipe_onboarding_fleet_extension | 1, 2, 4, 7 | High |
| dragonfly_client | 1, 4, 7 | High |
| code_executor | 1, 4 | High |
| cedar_policy | 4, 7 | Medium |
| alternative_services | 1, 4, 7 | Medium |
| ai_agents_ossa (custom parts) | 1, 3, 5 | Medium |
| ai_agents_dashboard / monitoring | 1, 4, 6 | Medium |

---

## Structural Isolation (Mandatory Before Pillar Work)

Execute in order. Applies to all custom modules under Drupal_AgentMarketplace (and TESTING_DEMOs where custom code is edited).

| # | Task | Check |
|---|------|--------|
| S.1 | One repo per module: each dir under `web/modules/custom/` is a Git repo; canonical source `__BARE_REPOS/agent-platform/drupal/<name>.git` (or agentmarketplace) | `buildkit drupal fleet --check` |
| S.2 | CI on every module: `.gitlab-ci.yml` includes gitlab_components drupal-master (or drupal-simple) | Same |
| S.3 | Config in the module: portable config in `config/install/` (and optional `config/schema/`); no Bluefly URLs in module install | Same |
| S.4 | No forbidden files: no `.sh`, `.bash`, `.zsh`, symlinks, or `scripts/` in custom | Same |
| S.5 | Single-purpose submodules: split large modules into hyper-focused submodules with strict info.yml dependencies | Per-module review |
| S.6 | Contrib-first: before adding custom PHP, confirm no drupal.org contrib or platform package covers it | Per change |

---

## Stepwise Strategy (Hard-Task Order)

1. **Structural isolation (S.1–S.6)**  
   Run `buildkit drupal fleet --check` from workspace root; fix missing CI, config, and forbidden files. Ensure every custom module in the marketplace has a matching bare repo and is on `release/v0.1.x` (or the branch used by the marketplace).

2. **Pillar 7 (Config)**  
   Remove hardcoded `*.blueflyagents.com` and private IPs from marketplace custom modules. Migrate API keys and base URLs to drupal/key and config; add config schema; expose all parameters in admin UI. Unblocks Pillars 1–6.

3. **Pillar 4 (API Normalization)**  
   Replace raw Guzzle/`@http_client` with http_client_manager (define operations in `.http_services_api.yml`) or api_normalization-generated gateway in: ai_agents_marketplace, drupal_patch_framework, apidog_integration, api_normalization (internal fetch only). Add CI/grep gate: no new `GuzzleHttp\ClientInterface` or `@http_client` in custom.

4. **Pillar 1 (Tool API)**  
   Ensure every executable action is a Tool plugin; register with tool_ai_connector and orchestration. Marketplace already has many Tool plugins (dragonfly_client, api_normalization, ai_agents_crewai, ai_agents_claude, drupal_patch_framework); audit any remaining RPC-style services and migrate to Tool plugins.

5. **Pillar 2 (State)**  
   Marketplace already uses drupal/orchestration (dragonfly_client_orchestration). Install ECA, maestro, maestro_activepieces if rollout or approval workflows are added; do not add custom PHP orchestration loops.

6. **Pillar 3 (AI)**  
   Use drupal/ai for LLM routing and Key; use ai_agents + ai_agents_ossa for discovery and OSSA → Tool mapping. No custom mesh scrapers or duplicate registries in marketplace.

7. **Pillar 5 (FlowDrop)**  
   Marketplace composer already has flowdrop, flowdrop_ai_provider, flowdrop_ui_agents. Install flowdrop_tool_provider when available; wire Tool plugins to canvas where needed.

8. **Pillar 6 (Observability)**  
   Remove custom metric/token tables; install audit_export (already in composer); pipe tool and orchestration execution to audit_export and tracer.

---

## References

- [tool](https://www.drupal.org/project/tool), [orchestration](https://www.drupal.org/project/orchestration), [eca](https://www.drupal.org/project/eca), [maestro](https://www.drupal.org/project/maestro)
- [ai](https://www.drupal.org/project/ai), [ai_agents](https://www.drupal.org/project/ai_agents), [ai_agents_ossa](https://www.drupal.org/project/ai_agents_ossa)
- [api_normalization](https://www.drupal.org/project/api_normalization), [http_client_manager](https://www.drupal.org/project/http_client_manager)
- [flowdrop](https://www.drupal.org/project/flowdrop), [audit_export](https://www.drupal.org/project/audit_export), [key](https://www.drupal.org/project/key)
- Wiki: Drupal-Community-Next-Change-Plan (Tool API first)
- AGENTS.md: Remaining rebuild list, Drupal Tool API migration priority
