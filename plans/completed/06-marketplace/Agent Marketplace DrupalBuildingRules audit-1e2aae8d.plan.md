<!-- 1e2aae8d-cdb4-4a00-8210-1d6119cf79b5 -->
# Agent Marketplace: DrupalBuildingRules Audit and Custom-Module Fixes

## 1. Scope

- **Repo:** `WORKING_DEMOs/Drupal_AgentMarketplace`
- **Rules source:** `$HOME/Sites/blueflyio/.cursor/rules/DrupalBuildingRules.md`
- **Audit targets:** `composer.json`, `AGENTS.md`, `ARCHITECTURE.md`
- **Fix targets:** Every project under `web/modules/custom/` (28 module directories)

## 2. DrupalBuildingRules Compliance (Summary)

Each custom module must have:

- **No stray PHP:** All logic in Modules, Services, Event Subscribers, or Plugins.
- **Dependency injection only:** No `\Drupal::` static in OOP code; inject services via constructor.
- **Credentials:** Via `drupal/key` (Key module), never hardcoded.
- **External HTTP:** No raw Guzzle for LLM APIs (use `drupal/ai` providers); for other APIs use `http_client_manager` (declarative YAML + services) or a single adapter service, not `@http_client` directly in many classes.
- **Events/workflows:** Prefer ECA actions/conditions or FlowDrop over custom `hook_entity_*` or event subscribers where a pipeline is predictable.
- **APIs:** Expose via JSON:API + OpenAPI; no ad-hoc REST where JSON:API suffices.
- **Structure:** Proper `Drupal\<module>\...` namespaces; services in `<module>.services.yml`; config schema where settings exist.

## 3. Audit: composer.json

- **Current:** GitLab + drupal.org repos; `require` lists many `drupal/*` and GitLab custom modules; `installer-paths` for `web/modules/custom/{$name}` lists 22 packages; `replace: drupal/ai_agents_kagent: *`; `autoload` only for `ai_agents_marketplace`.
- **Actions:**
  - Ensure every custom module that is a first-level child of `web/modules/custom/` is either in `require` (as a package) or documented in AGENTS.md as “consumed via Composer from GitLab” with correct package name.
  - Align `installer-paths` entries with actual custom module directory names (e.g. `agent_marketplace` is a profile/base, not in the same list; confirm list matches `ls web/modules/custom/`).
  - Add or fix `autoload` for any custom module that provides PSR-4 classes and is not installed via Composer (e.g. local-only modules) so that coding standards and PHPStan can resolve classes.

## 4. Audit: AGENTS.md

- **Current:** Describes Drupal 11 demo, recipe, GitLab project, local DDEV setup, custom modules (agent_marketplace, ai_agents_marketplace), API surface, OSSA wizard, dependencies, SoD, Node frontend.
- **Actions:**
  - Replace or generalize any hardcoded paths with `$HOME` or `~` (already stated; verify no other paths).
  - Add a short “DrupalBuildingRules” subsection: state that all custom modules in `web/modules/custom` must follow `DrupalBuildingRules.md` (DI, Key, http_client_manager / no raw Guzzle for APIs, ECA/FlowDrop where appropriate).
  - List all 28 custom module dirs with one-line purpose and “must comply with DrupalBuildingRules” (or reference the rule file once and “all modules under web/modules/custom”).

## 5. Audit: ARCHITECTURE.md

- **Current:** Status, principles (contrib over custom, ECA, Gin, API-first, S3FS, Redis, Search API), module stack, data flows, infrastructure, security, performance, monitoring, future phases, testing, docs.
- **Actions:**
  - Remove or generalize hardcoded path: replace `/Users/flux423/Sites/blueflyio/WORKING_DEMOs/demo_agent_marketplace` with `$HOME/Sites/blueflyio/WORKING_DEMOs/Drupal_AgentMarketplace` (or “this repo”) so ARCHITECTURE.md is path-agnostic.
  - Add a “Custom modules and DrupalBuildingRules” section: all code under `web/modules/custom` must adhere to DrupalBuildingRules (no raw Guzzle for LLM, Key for secrets, http_client_manager for external APIs, DI, ECA/FlowDrop for workflows).
  - Optionally add a small table or list of custom modules and their primary responsibility (discovery, wizard, CrewAI, dragonfly, etc.) so the architecture doc is the single place for “what lives where.”

## 6. Fix: Every Project in web/modules/custom

For **each** of the 28 module directories under `web/modules/custom/`:

1. **Ensure proper structure**
   - `<module>.info.yml` with `core_version_requirement`, `package`, and `dependencies` (no circular deps).
   - If the module has injectable services or plugins, a `<module>.services.yml` (or `drush.services.yml` only if only Drush commands) with correct `arguments` and no missing refs.

2. **Remove static service calls**
   - Replace any `\Drupal::service(...)`, `\Drupal::config()`, `\Drupal::httpClient()`, etc. in classes with constructor-injected services. Controllers, form classes, block plugins, and services must receive dependencies via `create()` + `__construct()`.

3. **Credentials and config**
   - No hardcoded API keys or URLs. Store base URLs and feature flags in config (with schema in `config/schema/<module>.schema.yml`). Store secrets in Key module and reference the Key entity in config or via the key repository service.

4. **HTTP clients**
   - **LLM / AI:** Do not use raw Guzzle to call OpenAI/Mistral/etc. Use `drupal/ai` and AI provider plugins.
   - **Other external APIs (mesh, Dragonfly, OpenAPI backends, etc.):** Prefer `http_client_manager` (define operations in a `.http_services_api.yml` and optional api descriptions), or a single adapter service that uses `http_client_manager` or `@http_client` internally, rather than injecting `ClientInterface` in many unrelated classes. Refactor existing `@http_client` usage to go through a defined API layer (http_client_manager or one adapter per integration).

5. **Events and workflows**
   - Where the logic is “when X happens, do Y” and Y is a fixed sequence, consider exposing an ECA action or condition so site builders can orchestrate. Do not add new custom event subscribers that duplicate what an ECA model could do.

6. **Coding standards**
   - Namespaces `Drupal\<ModuleName>\...`; docblocks and type hints; no stray `.sh` or scripts; Drupal coding standards (phpcs).

**Module list (28):**  
agent_marketplace, agent_registry_consumer, agentic_canvas_blocks, ai_agents_claude, ai_agents_client, ai_agents_communication, ai_agents_crewai, ai_agents_cursor, ai_agents_huggingface, ai_agents_kagent, ai_agents_marketplace, ai_agents_orchestra, ai_agents_ossa, ai_agents_tunnel, ai_provider_apple, ai_provider_langchain, ai_provider_routing_eca, alternative_services, api_normalization, apidog_integration, blockchain_manager, cedar_policy, code_executor, dita_ccms, dragonfly_client, drupal_patch_framework, external_migration, layout_system_converter, mcp_registry, recipe_onboarding.

(Note: `experience_builder_converter` is in composer installer-paths but not in the ls output; treat as 28 dirs actually present under `web/modules/custom` and any extra in composer as optional/legacy.)

## 7. Execution Order

1. **Audit phase (single agent or human):** Update `composer.json`, `AGENTS.md`, and `ARCHITECTURE.md` as in sections 3–5.
2. **Fix phase (parallel by module):** Spawn agents (see below); each agent owns one or more modules and applies section 6 per module, then runs `ddev drush cr`, `phpcs`, and any existing tests for that module.

## 8. Spawn-Agents Instruction

After the plan is approved, spawn dedicated agents to implement the fixes:

- **One agent per group of modules (e.g. 4–7 modules per agent)** so that each agent:
  1. Reads `DrupalBuildingRules.md` and this plan.
  2. For each assigned module under `WORKING_DEMOs/Drupal_AgentMarketplace/web/modules/custom/<module>`:
     - Audits for `\Drupal::`, raw Guzzle/LLM calls, hardcoded URLs/keys, and missing `.services.yml` or config schema.
     - Refactors to DI, Key for secrets, config for URLs, and http_client_manager (or one adapter) for external HTTP.
     - Ensures ECA/FlowDrop is considered for workflow-like logic.
  3. Runs `ddev drush cr`, `vendor/bin/phpcs` (or project phpcs config), and module-specific tests from the repo root.
  4. Commits with a message that references this plan (e.g. “fix(agent-marketplace): align <module> with DrupalBuildingRules (refs plan)”).

**Suggested split:**  
- Agent 1: agent_marketplace, agent_registry_consumer, agentic_canvas_blocks, ai_agents_claude, ai_agents_client, ai_agents_communication.  
- Agent 2: ai_agents_crewai, ai_agents_cursor, ai_agents_huggingface, ai_agents_kagent, ai_agents_marketplace.  
- Agent 3: ai_agents_orchestra, ai_agents_ossa, ai_agents_tunnel, ai_provider_apple, ai_provider_langchain, ai_provider_routing_eca.  
- Agent 4: alternative_services, api_normalization, apidog_integration, blockchain_manager, cedar_policy.  
- Agent 5: code_executor, dita_ccms, dragonfly_client, drupal_patch_framework, external_migration, layout_system_converter, mcp_registry, recipe_onboarding.

Use `buildkit agent spawn-team` (or equivalent) with a manifest that assigns the above groups and points each agent at `WORKING_DEMOs/Drupal_AgentMarketplace` and this plan.
