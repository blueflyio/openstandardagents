# Categorized Change Audit & Next-Steps Plan

## 1. Categorized Change Audit

### Architecture & Custom Code Deprecation
- **Pillar 2 (Orchestration):** Deprecated custom PHP-based orchestrators (`FleetOrchestratorService`, `ServiceIntegrationOrchestrator`, `ToolExecutorService`, `EndToEndIntegrationTestSuite`, `McpOrchestrationService`). Moving execution to `drupal/orchestration` and `drupal/maestro`.
- **Pillar 3 (AI Ecosystem):** Deleted custom entities and scrapers (`McpServerProject`, `McpDiscoveryService`, `McpRegistrySync`). Moving discovery and routing to `drupal/ai` and `ai_agents_ossa`.

### API Contract & Gateway
- **RESOLVED:** Massive syntax corruption (`()` versus `[]` arrays) and method signature conflicts across major controllers (`OrchestrationController`, `AiConversationController`, `RecipeOnboardingApiController`, `RecipeController`).
- **RESOLVED:** Fixed `ControllerBase` property conflict with strongly typed properties (`ConfigFactoryInterface`, `EntityTypeManagerInterface`) causing PHP 8+ Fatal Errors in `McpServerController` and `RecipeController`.
- **RESOLVED:** Synchronized missing controller methods declared in `ai_agents_orchestra.routing.yml` with stubs/implementations in `AgentMarketplaceController`, `CrewAIViewController`, `OrchestrationController`, `UnifiedAgentDashboardController`, and `VectorMemoryController`.
- **RESOLVED:** Warning concerning missing taxonomy term entity type (`taxonomy_term:mcp_tags`) in `McpServerRegistry` by routing target bundles to existing configuration (`mcp_server_tags`).

### Agent Lifecycle & Execution Model
- OSSA generation has been heavily decoupled into the 5-repo canonical structure (`openstandardagents`, `openstandard-ui`, `openstandard-generated-agents`, `openstandardagents.org`, `openstandard-gitlab-agent`).
- The OpenStandard UI is now the sole creator app and API, saving artifacts directly to `openstandard-generated-agents`.

## 2. Gap Analysis (Implementation vs Requirements)

| Requirement | Current State | Gap / Architectural Drift |
|---|---|---|
| **Dry / Contrib First** | `mcp_registry` still contains remnants of custom HTTP clients and discovery logic. | We need to fully replace `mcp_registry`'s HTTP polling with `http_client_manager` or `drupal/ai_agents_ossa`. |
| **Orchestration** | Custom loops deleted. | We have not yet wired the `drupal/orchestration` module to handle the abandoned orchestration responsibilities. |
| **API Normalization** | Raw Guzzle calls exist across `ai_agents_client` and `alternative_services`. | Need to import OpenAPI specs locally and ban raw Guzzle injections. |
| **Code Integrity** | Local modifications made directly in testing directories. | Fixes exist only in standard test environment `DEMO_SITE_drupal_testing` and must be propagated back to the `agent-platform` bare repositories to permanently fix the pipeline. |

## 3. Prioritized Remediation & Enhancement Plan

1. **Phase 1: Merge & Propagate Stability (IMMEDIATE PRE-REQUISITE)**
   - Create Git worktrees from `__BARE_REPOS/agent-platform/drupal/ai_agents_orchestra.git`, `recipe_onboarding.git`, and `mcp_registry.git`.
   - Rsync the corrected, syntax-error-free modules from `TESTING_DEMOS/DEMO_SITE_drupal_testing` back into their respective source repos.
   - Commit, push, and close out the "broken build" cycle permanently.

2. **Phase 2 (Pillar 3 & 4): Tool API Integration**
   - Refactor `ai_agents_client` to drop custom Guzzle/LLM bridges and strictly inject `drupal/ai`.
   - Strip all raw endpoint execution out of `code_executor` and ensure its integrations map via `drupal/tool` plugins.

3. **Phase 3 (Pillar 5 & 6): Visual State Machines & Telemetry**
   - Install and configure `flowdrop` and `maestro` for visual state machines.
   - Purge custom metric DB tables and replace with `audit_export`, connecting tracing to `tracer.blueflyagents.com`.

## 4. Risks, Blockers, & Design Decisions
- **Blocker:** Any active features in the demo sites relying on deleted custom orchestrators *will fail* until `drupal/orchestration` is fully adopted.
- **Decision Required:** Finalize if `recipe_onboarding` will immediately trigger `drupal/orchestration` flows over `maestro` flows. (Design decision needed from Principal Engineer).

## 5. CI/CD & Testing
- Ensure Gitlab CI is strictly using `gitlab_components/templates/drupal-master/gitlab-ci-drupal-fleet.yml`.
- Re-run the test fleet against the propagated modules to ensure clean cache rebuilds.
- Verify the `openstandard-generated-agents` pipeline triggers correctly from `openstandard-ui`'s `/api/export`.
