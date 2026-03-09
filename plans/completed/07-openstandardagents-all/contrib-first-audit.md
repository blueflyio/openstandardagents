# Drupal Contrib-First and Open-Source Audit

**Purpose:** Align custom Drupal modules with Drupal Building Rules (Drupal-First, DRY, contrib-reliant) and verify use of correct open-source tools (official APIs/SDKs). Full checklist for per-module review.

**Build reference:** Workspace `.cursor/rules/DrupalBuildingRules.md`. All Drupal work must follow: no raw Guzzle to LLMs; route through ai, mcp_client, flowdrop, ECA, key; extend third-party (e.g. CrewAI) via official SDKs or a Drupal service wrapping them.

---

## 1. Open-Source Tool Usage (External Integrations)

| Module / integration | Current usage | Rule | Action |
|----------------------|---------------|------|--------|
| **ai_agents_crewai** | http_client_manager (crewai_runner) calling external runner; config for URL/key | Use official CrewAI API or SDK; wrap in Drupal service | Runner must use CrewAI official SDK/API; no ad-hoc HTTP to unknown endpoints. No CrewAI PHP SDK in Packagist; HTTP to a certified runner is acceptable. |
| **Qdrant / vector** | ai_agents_dashboard: legacy QdrantClient (raw Guzzle, deprecated in services); active path uses HttpClientAdapter | Vector DBs: use drupal/ai VDB abstractions (ai_vdb_provider_qdrant) | Prefer ai_vdb_provider_qdrant over custom QdrantClient; remove legacy class in Phase 6 or replace with http_client_manager + contrib. |
| **LLM / AI** | drupal/ai providers, agent-router gateway | Never raw HTTP/Guzzle to LLM APIs | All LLM calls via drupal/ai or agent-router; no custom Guzzle to OpenAI/Mistral/etc. |
| **MCP** | mcp_registry, mcp_client | Use mcp_client for external MCP; expose Drupal tools via Tool API | Discovery/mesh/OSSA: migrate to http_client_manager per Remaining rebuild list. |
| **GitLab** | source_connector_gitlab, various | http_client_manager or api_normalization (OpenAPI import) | No custom GitLab client; use generated Tools or .http_services_api.yml. |
| **Cedar / compliance** | cedar_policy | http_client_manager (cedar_oscal, cedar_cisa) | Done; PolicyImportService add http_client_manager for config URLs. |

---

## 2. HTTP and Credentials

- **HTTP:** All external API calls must use **http_client_manager** (define operations in .http_services_api.yml; base_uri/token from config or Key) or **api_normalization**-generated clients. No direct `@http_client` / `GuzzleHttp\ClientInterface` for platform or third-party APIs.
- **Credentials:** All API keys and secrets via **drupal/key**; no hardcoded keys, no $settings[] for secrets. Config schema for URLs and feature flags.
- **Audit result:** ai_agents_crewai (Marketplace) uses http_client_manager; ai_agents_dashboard_monitoring active path uses HttpClientAdapter; legacy Guzzle classes (QdrantClient, AgentMeshClient, PlatformApiClient) are commented out but files remain — remove in Phase 6 or convert to http_client_manager service definitions.

---

## 3. Next-Level Contrib (Per-Module)

For each custom module, ask:

1. **Redundant?** Could ECA, flowdrop, or a core AI submodule cover it?
2. **Extensible?** Should this be an ECA action/condition, a Tool plugin, or a FlowDrop node so others can reuse it?
3. **Bridging ecosystems?** If you add a tool for AI, also expose as FlowDrop node and ECA action.

**Contrib to prefer:** tool, orchestration, api_normalization, ECA, flowdrop, flowdrop_ui_agents, ai, ai_agents, ai_agents_ossa, key, http_client_manager, audit_export, maestro, maestro_activepieces. See AGENTS.md "Drupal contrib reference" and "Strategic Re-Alignment: Contrib First & Starshot".

---

## 4. No Stray PHP / DI

- All business logic in **Modules, Services, Event Subscribers, or Plugins**. No standalone PHP scripts.
- **Dependency Injection** for all services; no `\Drupal::` static inside OOP code, controllers, or plugins.
- Audit: no `\Drupal::` static found in custom modules (grep verified).

---

## 5. Related Docs

- **Remaining rebuild list** and **Drupal Tool API migration priority:** AGENTS.md (same file).
- **Consolidation plan (seven pillars):** Wiki **Drupal-Contrib-Consolidation-Plan** (publish from `config-templates/wiki-Drupal-Contrib-Consolidation-Plan.md`).
- **Drupal Community Next Change Plan:** Wiki **Drupal-Community-Next-Change-Plan** (tool/orchestration/ai_agents_ossa alignment).
