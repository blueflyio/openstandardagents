# Modern Drupal Architecture Reference (2026 Edition)

**Purpose:** Single technical reference for building in Drupal today. Use this when rebuilding custom modules: composable CMS, Recipes, SDC, Experience Builder, ECA, AI/MCP. Complements the Strategic Re-Alignment (Contrib First & Starshot) and Drupal-Community-Next-Change-Plan in AGENTS.md and wiki.

**Publish:** `buildkit gitlab wiki publish --project blueflyio/agent-platform/tools/technical-docs --slug Modern-Drupal-Architecture-2026 --title "Modern Drupal Architecture Reference (2026)" --file config-templates/wiki-Modern-Drupal-Architecture-2026.md`

---

## 1. Core Paradigm: Composable Drupal CMS

You no longer start with a blank Drupal Core plus 40 modules. You start with **Drupal CMS** (formerly Starshot): an out-of-the-box, optimized product on top of Drupal Core.

- **No-code / low-code:** Heavy PHP configuration moves into the browser; site builders configure, developers hook via standard APIs.
- **Automatic updates:** Security and minor updates via the UI; Composer remains for major upgrades and custom dependencies.
- **Project Browser:** Extensions and modules are browsed, downloaded, and installed from the admin UI (Composer-backed).

**Platform alignment:** All custom modules target **Drupal CMS 2.0** (Core 11.3+, Canvas, Experience Builder, recipes, AI tools). Use `core_version_requirement: ^10 || ^11` or `^11` when using CMS 2.0-only features.

---

## 2. Site Assembly: Drupal Recipes (YAML)

Install profiles are deprecated for additive composition. **Recipes** are the standard for packaging and deploying functionality.

- **What they are:** Declarative `recipe.yml` files that bundle modules, configuration, and optional content.
- **Why it matters:** Recipes are **composable** and **additive**. Apply a Blog recipe, an Events recipe, and an SEO recipe on top of each other at any point in the site lifecycle.
- **Location:** Project root `recipes/` (e.g. `recipes/custom/`). Do not use `web/recipes/`.

**Example (minimal):**

```yaml
name: 'Corporate Blog'
description: 'Sets up a blog with taxonomy, media, and pathauto.'
install:
  - node
  - media
  - pathauto
config:
  strict: false
  actions:
    # Import or alter configuration here
```

**Our usage:** recipe_agentdash, recipe_agent_marketplace, recipe_onboarding, and platform-specific recipes live in repo roots; applied via Drush or UI. No monolithic install profiles for new demos.

---

## 3. Front-End: Single Directory Components (SDC) and Experience Builder

Theming is component-driven. UI elements live in isolated folders, not scattered across large theme directories.

### Single Directory Components (SDC)

SDC is in Drupal Core. Each component has:

- `component_name.component.yml` — API: props and slots (JSON Schema).
- `component_name.twig` — Markup.
- `component_name.css` — Scoped styling.
- `component_name.js` — Component-specific logic.

Drupal generates asset libraries when the component is used. **Rule:** Any module or theme that defines `.component.yml` MUST declare `drupal:sdc` in its `dependencies` in `.info.yml`.

### Experience Builder (XB)

Replacement for Layout Builder and Paragraphs. React-based visual interface that reads SDCs; site builders drag-and-drop components and map Drupal fields to SDC props. Use XB for agent dashboards, marketplace cards, and OSSA UI where we want visual assembly.

**Our usage:** ai_agents_ossa_canvas, agentic_canvas_blocks, and marketplace/dash UI should be SDC where possible; Canvas-compatible for visual building. No duplicate component systems.

---

## 4. Business Logic: ECA (Event-Condition-Action)

Replace custom PHP event subscribers and hooks for routine business logic with **ECA**.

- **Model:** Event (e.g. "Node is saved", "User registers") → Condition (e.g. "Node type is Article", "Author role is Guest") → Action (e.g. "Set status to Draft", "Send email", "Trigger webhook").
- **UI:** BPMN-style visual modeler in the Drupal backend.
- **Performance:** Compiles to Drupal events; no penalty for using the visual builder.

**Our usage:** Use ECA for: user registration flows, content moderation triggers, "on save" side effects, and calling Tool plugins or workflow-engine. Do not write new custom EventSubscribers for logic that fits Event + Condition + Action. See **Drupal-Community-Next-Change-Plan**: Tool API for callable actions; events for automatic reactions only.

---

## 5. Intelligence Layer: AI and MCP

Drupal is built for the AI era: unified AI abstraction and MCP integration.

- **Core AI module (drupal/ai):** Unified provider abstraction (OpenAI, Anthropic, Mistral, Ollama, etc.); Key module for secrets.
- **MCP:** Drupal can act as MCP Server (expose content/data to Claude Desktop and other agents) and MCP Client (fetch from external tools).
- **Vector / RAG:** Integration with vector stores (e.g. Qdrant) for RAG pipelines.

**Our usage:** Route all LLM use through drupal/ai (and agent-router where we centralize). MCP server implementation lives in agent-protocol; Drupal mcp_registry and tool/orchestration expose tools. No custom mesh scrapers; use ai_agents_ossa and Tool API.

---

## 6. Tooling and Workflow

| Tool | Role |
|------|------|
| **DDEV** | Local Drupal development; containerized, production-like. |
| **GitOps / Config sync** | `drush cex` exports architecture to code; Git holds configuration, DB holds content. |
| **Drush** | CLI for Drupal; essential for CI/CD, deploy, and platform Drush commands (recipe:, ossa:, platform:). |

---

## 7. Rebuild Checklist: Apply This When Rebuilding Custom Code

Use this when refactoring or rebuilding any custom module. Tick as you align.

### Recipes

- [ ] New or updated functionality is packaged as a **Recipe** (recipe.yml in `recipes/`) where it bundles multiple modules or config.
- [ ] Recipe is **additive** (can be applied on top of existing site); no single monolithic install profile for new demos.
- [ ] Recipe `install` list and `config.actions` are minimal and declarative.

### SDC and Experience Builder

- [ ] Any new UI component (card, badge, list, form widget) is an **SDC** (`.component.yml`, `.twig`, `.css`, `.js` in one directory).
- [ ] Module/theme with SDC has `dependencies: [drupal:sdc]` in `.info.yml`.
- [ ] Where site builders should arrange components visually, design for **Experience Builder** (Canvas) consumption.

### ECA (Business Logic)

- [ ] **No new custom EventSubscribers** for logic that fits "Event → Condition → Action." Use **ECA** instead.
- [ ] Callable actions (things an agent, n8n, or FlowDrop invokes) are **Tool plugins** (drupal/tool); ECA actions "Execute Tool" or call workflow-engine via http_client_manager.
- [ ] Events are for **automatic reactions** (e.g. post to GKG on test complete); Tools are for **on-demand** use.

### AI and MCP

- [ ] LLM usage goes through **drupal/ai** (and agent-router if centralizing); no custom provider bridges.
- [ ] MCP exposure uses **tool** and **orchestration**; no duplicate tool registries.
- [ ] Secrets in **drupal/key**; no hardcoded API keys.

### HTTP and Config

- [ ] All external APIs use **http_client_manager** (`.http_services_api.yml`) or **api_normalization**-generated clients; no raw Guzzle for platform/third-party APIs.
- [ ] Endpoints and keys come from **config** (config schema, admin form); zero hardcoded production URLs.
- [ ] Optional ConfigSubscriber pushes saved URLs into http_client_manager overrides when using named APIs.

### References in This Repo

- **Strategic Re-Alignment (Contrib First & Starshot):** AGENTS.md "Strategic Re-Alignment" — Tool API, orchestration, AI ecosystem, api_normalization, FlowDrop, observability, config first.
- **Drupal Community Next Change Plan:** Wiki **Drupal-Community-Next-Change-Plan** — Tool API first, events for reactions only; dragonfly_client as reference.
- **Drupal CMS 2.0 full context:** AGENTS.md "Drupal CMS 2.0 – Full context" — single reference for agents; mandates and contrib stack.
