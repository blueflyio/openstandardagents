# Strategic Re-Alignment: Slashing Custom Code via Target Contrib Ecosystems

A detailed audit confirms that the platform's custom code (specifically `mcp_registry`, bespoke orchestrators, and custom tool managers) extensively reinvents functionality already maintained within established, core-backed Drupal Contrib ecosystems.

To drastically simplify the codebase and ensure forward compatibility with **Drupal CMS (Starshot)**, we are pivoting immediately to a strict "Contrib First" architecture governed by the absolute rule of **DRY (Don't Repeat Yourself)**.

---

## 0. The Prime Directive: DRY & Submodule Architecture

The ultimate end goal is extreme code reduction. We build the "Drupal Way."

*   **Dependency First:** If a standard Drupal contrib module offers 80% of what is needed, we will add it as a `composer` dependency immediately, remove the custom equivalent, and write thin integrations.
*   **Hooks, Not Rebuilds:** We will not rebuild functionality. If contrib needs adjustment, we will use standard Drupal hooks (e.g., `hook_entity_presave`, `hook_form_alter`) or event subscribers to tweak its behavior rather than writing a parallel custom system.
*   **Single-Purpose Submodules:** Custom code will be aggressively factored into hyper-focused, single-purpose submodules. Stop building monolithic custom modules. If a script translates OSSA to Tool API, that is its own tiny submodule with a strictly defined `info.yml` dependency.

---

## 1. The Root Interface & Starshot Standard: Tool API

The newly released `drupal/tool` API is the absolute foundational building block of the new ecosystem. Backed directly by Drupal leadership (Dries) and the creators of ECA/AI, this is the definitive, unified standard for extending Drupal's capabilities.

**Anti-Pattern:** Using bespoke `ToolManager` classes, standalone registries, custom JSON parsing, or creating proprietary formats for agent-callable functions.
**The Solution:** `tool` and `tool_belt`.

### Mandatory Task List
- [ ] **Audit:** Identify all custom PHP scripts and Guzzle wrappers acting as executable functions for agents (e.g., in `mcp_registry`).
- [ ] **Adopt `tool_belt`:** Review the `drupal/tool_belt` module. If standard tools for fetching URLs, reading files, or manipulating strings exist, delete our custom equivalents immediately.
- [ ] **Migrate to `tool` Plugins:** Rewrite every remaining custom executable function strictly as a standard `Tool` plugin.
- [ ] **Enforcement:** Institute a hard rule: All executable logic must be registered as a standard `Tool` plugin, making it universally available to AI Agents, Flowdrop, and Orchestration instantly.

---

## 2. State & Background Execution: Orchestration

The `orchestration` ecosystem is the definitive "next big thing" for handling long-term state. It acts as the backbone integrating `tool`, `ai`, and custom logic reliably over time, replacing fragile internal loops and queue workers.

**Anti-Pattern:** Maintaining custom `ServiceIntegrationOrchestrator`, `FleetOrchestratorService`, or using hook-based synchronous PHP execution loops to manage multi-step agent processes.
**The Solution:** `orchestration`, `maestro`, and related submodules.

### Mandatory Task List
- [ ] **Deprecate Custom Loops:** Identify and deprecate all custom PHP hooks and infinite loops attempting to manage "fleet orchestration" or agent task state.
- [ ] **Adopt `orchestration`:** Install `drupal/orchestration` and `drupal/orchestration_recipe_workflow_blog` to standardize the coordination of complex sequences of events (recipes).
- [ ] **Implement `maestro`:** For workflows requiring human approval chains or long-running conditions, build the state machine visually using `drupal/maestro`.
- [ ] **External Hooks:** Where state needs to pass entirely outside of Drupal (e.g., to n8n), route the Maestro process through `drupal/maestro_activepieces`.

---

## 3. Tool Discovery & Registry: The AI Ecosystem

**Anti-Pattern:** Building custom DB tables, bespoke `McpServerProject` entities, and writing raw polling scripts to discover agent capabilities on the mesh.
**The Solution:** The `ai` and `ai_agents` ecosystem.

### Mandatory Task List
- [ ] **Adopt Core `ai`:** Ensure all baseline LLM routing and key management relies exclusively on `drupal/ai`. Delete custom provider bridges.
- [ ] **Deprecate Custom Registries:** Replace custom discovery logic with `drupal/ai_agents`. This module natively manages agent definitions and capability mapping against the Tool API.
- [ ] **Adopt `ai_agents_ossa`:** Install the OSSA submodule to natively parse Open Standard for Software Agents (OSSA) capabilities into Drupal Tool plugins automatically. Turn off custom mesh-polling scrapers.

---

## 4. Dynamic Integrations: API Normalization

**Anti-Pattern:** Writing specific Guzzle `$http_client` wrappers for every new platform API or external MCP server.
**The Solution:** `api_normalization`.

### Mandatory Task List
- [ ] **Ban Raw Guzzle:** Implement a CI rule rejecting direct `@http_client` injection in custom modules for standard API communication.
- [ ] **Import OpenAPI Specs:** Locate the OpenAPI specifications for the platform's core Mesh, MCP, and external services.
- [ ] **Auto-generate Tools:** Feed these OpenAPI specs into `drupal/api_normalization` to generate strongly-typed `Tool` plugins automatically. Drop the thousands of lines of custom wrapper code.

---

## 5. Visual Agent Workflows: The Flowdrop Ecosystem

**Anti-Pattern:** Attempting to build complex angular interfaces for "prompt chaining", or hardcoding multi-stage workflows within custom module classes.
**The Solution:** The `flowdrop` ecosystem.

### Mandatory Task List
- [ ] **Install Flowdrop Visuals:** Install `drupal/flowdrop` and `drupal/flowdrop_ui` to establish the visual node-based workflow builder.
- [ ] **Expose Tools:** Install `drupal/flowdrop_tool_provider` to ensure every Tool plugin defined in Step 1 is drag-and-droppable on the canvas.
- [ ] **Connect AI Actions:** Install `drupal/flowdrop_ai` and `drupal/flowdrop_ai_provider` to bridge visual nodes directly to the LLM router.
- [ ] **UI Extensions:** Implement `drupal/flowdrop_ui_agents` and `drupal/flowdrop_field_widget_actions` so users can trigger these node-chains directly from Drupal content entities without requiring custom backend code.

---

## 6. Observability & Data Export: Audit_Export

**Anti-Pattern:** Coding custom metric tracking tables in Drupal to measure Agent latencies, storing massive context payloads directly in node bodies, and building bespoke reporting dashboards.
**The Solution:** `audit_export` coupled with OpenTelemetry.

### Mandatory Task List
- [ ] **Purge Metric Tables:** Identify and drop any custom database tables attempting to store time-series data, token counts, or raw agent execution logs.
- [ ] **Install `audit_export`:** Install `drupal/audit_export` to provide a standard framework for safely extracting system metadata and event histories.
- [ ] **Externalize Telemetry:** Pipe all execution histories from `tool` and `maestro` workflows through `audit_export` directly to the platform's central telemetry stack (`tracer.blueflyagents.com`). Treat Drupal as stateless for analytics.

---

## 7. The Drupal Way: Architecture via Config & Admin UIs First

**Anti-Pattern:** Hardcoding private platform URLs (`*.blueflyagents.com`), embedding mesh API keys in custom PHP controllers, or forcing developers to edit `.php` files to change system targets.
**The Solution:** `config/sync`, the `key` module, and comprehensive Admin Forms.

### Mandatory Task List
- [ ] **Zero Hardcoded Endpoints:** Immediately purge any hardcoded `.blueflyagents.com` domains (e.g., `mesh`, `mcp`, `tracer`) or private IP addresses from custom module code.
- [ ] **Adopt the `key` Module:** Migrate all platform API keys, Mesh authentication tokens, and underlying system secrets to the `drupal/key` module. Services must query the Key interface natively.
- [ ] **Config Schema Definition:** Every custom setting must have an accompanying `config/schema/module_name.schema.yml` definition. Stop using `$settings[]` arrays in `settings.php` for module logic.
- [ ] **Admin Control First:** Standardize configuration routing (`/admin/config/services/...`) so that site builders can visually change connection parameters, update Mesh URIs, enable/disable agent discovery routes, and manipulate the AI architecture without deploying code. Every config value must be editable via the Drupal Admin UI.
