# Drupal Modules Audit: orchestration, ECA, tool, ai, ai_agents

Technical deep-dive for OSSA **Drupal** adapter integration. Drupal is one of many frameworks OSSA targets (others include Symfony, LangChain, CrewAI, OpenAI Agents SDK, Claude Skills, Kubernetes, Docker, etc.). This doc covers Drupal module structure, submodules, and how to integrate into each.

---

## 1. Orchestration (drupal.org/project/orchestration)

**Purpose:** Bridge between Drupal and external automation platforms (e.g. Activepieces). Exposes Drupal capabilities as callable tools so external systems can trigger workflows, call AI agents, and run business logic.

**Key features:**
- Tool API plugins can be invoked remotely
- Drupal AI agents become accessible to external platforms
- ECA workflows can be triggered from outside Drupal

**Current limitations:** Works with Activepieces; support for n8n, Zapier, etc. is planned.

**Releases:** 1.0.0, Drupal ^11.2.

**Integration with OSSA:**
- OSSA-generated Tool API plugins and ai_agents agents are natural candidates to expose via Orchestration.
- No OSSA adapter code currently generates Orchestration-specific config or endpoints.
- **Recommendation:** Add optional `extensions.drupal.orchestration` (e.g. expose agent as remote tool, list ECA models to trigger) so exported agents can be registered with Orchestration for external automation.

---

## 2. ECA (drupal.org/project/eca)

**Purpose:** No-code rules engine. Event–Condition–Action models: when a Drupal event fires, ECA evaluates models and runs matching actions. Models live in config (import/export via UI or Drush).

**How it works:**
- Plugin managers for **events**, **conditions**, and **actions** (all extensible).
- Models are stored in config (e.g. `eca.model.*`).
- Modeller required to design models (BPMN.iO recommended; ECA Classic Modeller, Camunda alternatives).
- On production, ECA can run without a modeller (config-only).

**Submodules (packaged with ECA, enable as needed):**

| Submodule | Purpose |
|-----------|---------|
| eca_workflow | Content entity workflow actions |
| eca_views | Execute/export Views query results in ECA |
| eca_user | User events, conditions, actions |
| eca_render | Render API (blocks, views, themes) |
| eca_queue | Queued operations |
| eca_project_browser | Project Browser integration |
| eca_misc | Misc events/conditions from core/kernel |
| eca_migrate | Migrate events |
| eca_menu | Menu system |
| eca_log | Log messages |
| eca_language | Language/translation |
| eca_form | Form API events, conditions, actions |
| eca_file | File system actions |
| eca_endpoint | Custom endpoints/routes, request/response actions |
| eca_content | Content entity events, conditions, actions |
| eca_config | Config events |
| eca_cache | Cache read/write/invalidate |
| eca_base | Base events, conditions, actions |
| eca_access | Access control on entities/fields |
| eca_ui | Admin UI for ECA |
| eca_development | Drush commands for ECA devs |

**Requirements:** Drupal 10+ (ECA 2: ^10.3 || ^11; ECA 3: ^11.2), PHP 8.1+ (ECA 3: 8.3+).

**OSSA integration (current):**
- `drupal.schema.json`: `eca_events` (array of event names, e.g. `entity:node:presave`, `cron`).
- Generator emits `config/install/eca.model.{modelId}.yml` with:
  - Event plugin (e.g. `eca_entity_type_bundle` for entity events)
  - Conditions (e.g. entity type/bundle)
  - Action: `ai_agents_execute` to run the OSSA agent.
- Dependencies: `eca` (^2.0 or ^3.0 per Drupal version).
- **Integration point:** ECA actions and conditions are plugins. To add custom behavior, implement an Action or Condition plugin and reference it in the generated ECA model config.

**Docs:** [ECA Guide](https://ecaguide.org/) (install, plugins, modellers). ECA lists [AI](https://www.drupal.org/project/ai) as an integration.

---

## 3. Tool API (drupal.org/project/tool)

**Purpose:** Pluggable API for executable logic with **typed inputs and outputs**. Next-gen replacement for core Actions: clear input/output schemas, reusable across workflows, AI agents, and developers.

**Why Tool API:**
- Single contract: Input Definition + Output Definition + Result message.
- ContextDefinition-style typed data; self-describing tools.
- Form/schema/alter from usage (WIP); token support (WIP).
- Designed for AI (export as JSON Schema for OpenAI/Anthropic tool-calling), workflow engines (ECA), and custom code.

**Use cases:** Site builders (validated actions), AI integrations (function calling), workflow builders (ECA/Rules), developers (expose tools instead of ad-hoc actions).

**Submodules (in repo):**

| Submodule | Purpose |
|-----------|---------|
| tool_ai_connector | **AI function calling:** Expose Tool plugins to AI providers/agents. Use with MCP and AI Agents. |
| tool_content | Content-related tools |
| tool_content_translation | Content translation tools |
| tool_entity | Entity operations |
| tool_explorer | Explorer UI for tools |
| tool_system | System-level tools |
| tool_user | User-related tools |

**Roadmap (from project page):** Direct MCP integration coming; then ECA actions/usage. Tool Refiner (preconfigured tools with preset values) planned.

**Releases:** 1.0.0-alpha10, Drupal ^10.3 || ^11.

**OSSA integration (current):**
- `drupal.schema.json`: `tool_plugins[]` with `id`, `ossa_tool_ref`, `operation` (read/create/update/delete/explain), `input_schema`, `output_schema`, `ai_callable`.
- Generator emits `config/install/tool_ai_connector.tool.{id}.yml` so Tool API plugins are registered and available to ai_agents.
- Generated PHP: `#[Tool]` plugin classes in `src/Plugin/Tool/` that delegate to the OSSA agent executor for tool execution.
- **Integration point:** Each OSSA `spec.tools[]` maps to a Drupal Tool plugin; `tool_ai_connector` makes it callable by AI. For ECA, when Tool API gains ECA action support, generated tools can be used as ECA actions.

---

## 4. AI (drupal.org/project/ai)

**Purpose:** Core technical foundation for integrating LLMs and AI in Drupal: providers (plugins), operation types (chat, text-to-image, embeddings, etc.), and submodules for validations, translate, logging, content, CKEditor, Assistants/Chatbot, Search (RAG), Automators, Explorer.

**Architecture:**
- **AI Provider:** Plugin per backend (OpenAI, Anthropic, Azure, Gemini, Hugging Face, etc.). Created via `ai.provider` service.
- **Operation types:** Each type has an **input** class, an **output** class, and an **interface** for the call. Example: Chat uses `ChatInput`, `ChatMessage`, and the provider’s `chat()` method.
- **Tags:** Third parameter on calls is tags (e.g. provider, model); used by AI Logging, AI External Moderation, and others for filtering/events.

**Submodules:**

| Submodule | Purpose |
|-----------|---------|
| ai_validations | Field validation via AI/LLM prompts |
| ai_translate | One-click AI translation |
| ai_logging | Log AI requests/responses |
| ai_external_moderation | OpenAI moderation before other LLM calls |
| ai_content | Tone, summarization, taxonomy suggestions, moderation checks |
| ai_ckeditor | AI assistant in CKEditor 5 |
| ai_assistants_api + Chatbot | Configure chatbots; swap front-end; AI search |
| ai_search | Semantic search, RAG (embeddings + vector DBs: Milvus, Zilliz, Pinecone) |
| ai_automators | Populate/change any field; chain prompts; ECA integration |
| ai_explorer | Admin area to test prompts |
| ai_core | Provider and operation-type foundation |

**Operation types (examples):** Chat, Text-to-Image, Embeddings, Moderation, Translate, Speech-to-Text, Text-to-Speech, etc. See [Making AI Base Calls](https://project.pages.drupalcode.org/ai/1.2.x/developers/base_calls/).

**Example Chat call (from AI project page):**
```php
$sets = \Drupal::service('ai.provider')->getDefaultProviderForOperationType('chat');
$provider = \Drupal::service('ai.provider')->createInstance($sets['provider_id']);
$messages = new ChatInput([
  new ChatMessage('system', 'You are helpful assistant.'),
  new ChatMessage('user', $input),
]);
$message = $provider->chat($messages, $sets['model_id'])->getNormalized();
return $message->getText();
```

**Requirements:** Key module (for API keys). Drupal ^10.4 || ^11 (1.2/1.3).

**OSSA integration (current):**
- Generated `AgentExecutorService` uses `ai.provider` → `createInstance($provider_id)` and builds `ChatInput` + `ChatMessage` for user input, then `$provider->chat($messages, $model_id)`.
- Config: `llm_provider`, `llm_model` from `${moduleName}.settings`.
- **Integration point:** All LLM execution goes through AI module operation types. To support more operation types (e.g. embeddings for RAG), add calls using the same pattern (input class + provider method). For persistent chat state, AI module does not define a message store; that would be custom or a future integration with Symfony AI Chat/MessageStore if Drupal/Symfony bridge exists.

---

## 5. AI Agents (drupal.org/project/ai_agents)

**Purpose:** Framework for building agents (including text-to-action agents) that can manipulate Drupal config/content via tool calling. Minimal code: define tools and prompts; agents use tools to fulfill instructions.

**Concepts:**
- **Agents:** Config entities (title, system prompt, selected tools). Shipped in recipes or modules.
- **Tools:** Provided by Tool API (and tool_ai_connector); agents discover and call them (e.g. get entity field info, create taxonomy term).
- **Default information tools:** Injected into agent context each turn (e.g. field types, form widgets) so the LLM has site-specific knowledge without extra tool calls.
- **Trigger:** Something that starts an agent run (e.g. AI Agents Explorer form, Chatbot UI, custom code).

**Submodules:**
- **AI Agents Modeler API:** Use modelers API and BPMN.io to define agent models in a graph (ECA-like).
- **AI Agents Explorer:** Dev/debug UI to test agents (prompt, see tools used and output).

**Shipped agents (examples):** Taxonomy Agent, Content Type Agent, Field Type Agent (create/edit/answer about vocabularies, node types, fields).

**Setup:** Install AI + provider with tool-calling support, install AI Agents (and optionally Explorer). Add agents at `/admin/config/ai/agents` (title, system prompt, tools). Use with AI Assistants API + Chatbot for UI.

**Requirements:** Drupal ^10.3 || ^11. AI module + provider with tools support.

**OSSA integration (current):**
- `manifest-exporter` and generator produce config that targets ai_agents: agent definitions, tool_ai_connector config so OSSA tools appear as Drupal tools.
- Generator produces Drupal modules that depend on `ai`, `ai_agents`, `tool`; services use `ai.provider` for chat and delegate tool execution to the OSSA agent executor (which can call back into Drupal tools or external APIs).
- **Integration point:** OSSA manifest `spec.personality` / `spec.llm` map to agent instructions and model; `spec.tools` map to Tool API plugins and tool_ai_connector; ai_agents runs the agent and passes tool calls to Tool API. For “OSSA agent as a Drupal agent”, the generated module can register an ai_agents agent (config entity) that uses the generated Tool plugins.

---

## Integration Matrix (OSSA → Drupal)

| OSSA concept | Drupal module | Integration mechanism |
|-------------|---------------|------------------------|
| Agent identity / personality | ai_agents | Config entity (agent title, system prompt, tools list) |
| LLM / model | ai | ai.provider + default provider for “chat”; config for provider_id/model_id |
| Tools | tool + tool_ai_connector | Tool plugin + tool_ai_connector.tool.{id}.yml; ai_callable for agents |
| Event-driven runs | eca | eca.model.*.yml with event + condition + ai_agents_execute (or custom action) |
| External automation | orchestration | Not yet; optional extension to expose agent/tools/ECA to Activepieces |
| Chat UI / Assistants | ai (Assistants API + Chatbot) | Use same ai.provider chat; OSSA can generate config or docs for wiring a chatbot to the agent |
| Persistent chat state | (none in stack) | Custom or future Symfony AI Chat/MessageStore bridge |

---

## Drupal Starshot AI Initiative (alignment)

**Source:** [drupal.org/about/starshot/initiatives/ai](https://www.drupal.org/about/starshot/initiatives/ai)

The Drupal AI Initiative is the official Starshot-aligned effort to drive responsible AI innovation in Drupal. It is funded (USD 178k+ from makers), has a published [AI Strategy](https://new.drupal.org/assets/2025-06/Drupal-AI-Strategy-June-25_0.pdf), and operates with a **Product** workstream (1xINTERNET: stable product) and an **Innovation** workstream (QED42: exploration and prototypes).

**Relevant points for OSSA/Drupal integration:**

- **Symfony AI:** The Innovation workstream is explicitly **evaluating Symfony AI** (technical deep-dives). Adopting Symfony AI Agent (Chat + MessageStore) in OSSA’s Symfony/Drupal path aligns with where the initiative is heading.
- **MCP:** Model Context Protocol is being explored (DropSolid). OSSA’s MCP adapter and tool exposure fit the same ecosystem.
- **Agents:** AI Agents framework (drupal.org/project/ai_agents) is central; Agents Debugger (ai_agents_debugger) and context governance (Context Control Center, revision management) are initiative deliverables. OSSA-generated agents and tools plug into this stack.
- **Drupal CMS 2.0:** AI Dashboard and AI-powered tools are part of CMS 2.0. The AI module and its submodules (ai_agents, tool, ECA integration) are the technical base the initiative is hardening.
- **Work tracks:** AI Core, AI Products, AI Marketing, AI UX. OSSA’s “define once, export to Drupal (and others)” supports Products and Core by providing a standard manifest that can target Drupal’s AI stack.

**Takeaway:** OSSA’s Drupal adapter (ai, ai_agents, tool, ECA, and future Orchestration / persistent state) should stay aligned with the [Drupal AI Initiative](https://www.drupal.org/about/starshot/initiatives/ai), its [documentation](https://project.pages.drupalcode.org/ai/1.1.x/), and the evolving roadmap (Symfony AI evaluation, MCP, context/prompt management).

---

## Most Effective and Impactful Next Step

**Recommendation: Harden and document the existing Drupal stack (AI + AI Agents + Tool + ECA), then add Orchestration and persistent state.**

1. **Highest impact, least risk: Validate and document the current integration**
   - The 433 branch already wires OSSA → Drupal via ai, ai_agents, tool, ECA. The biggest win is to **validate** this path on a real site (or in a test recipe): generate a module from an OSSA manifest, install ai + ai_agents + tool + eca, import config, and run the agent (Explorer or Chatbot).
   - Document in the wiki: required Drupal/PHP versions, exact composer/drush steps, and how each OSSA extension (tool_plugins, eca_events, etc.) maps to Drupal config. This unblocks adopters and surfaces gaps (e.g. ECA action plugin IDs, tool_ai_connector schema).

2. **Next: Orchestration**
   - Add optional `extensions.drupal.orchestration` to the Drupal schema and generator so an OSSA agent can be exposed as a remote tool or trigger for Orchestration (Activepieces). Small schema + generator change; high value for “Drupal in the loop” with external automation.

3. **Then: Persistent chat state**
   - Drupal AI today is single-turn (ChatInput → chat() → response). Multi-turn and context retrieval require a message store. Options:
     - **A)** Implement a small Drupal-specific store (e.g. key_value or custom table) that implements the same save/load contract as Symfony’s MessageStoreInterface, and use it in generated code so “chat” is stateful per session/conversation.
     - **B)** If/when Drupal or a contrib module adopts Symfony AI Chat + MessageStore, refactor the generator to use that so OSSA agents map to persistent state the same way as in Symfony.

**Summary:** The most effective and impactful step is to **validate and document the current Drupal integration** (ai, ai_agents, tool, ECA) end-to-end, then add **Orchestration** support and a path to **persistent chat state** (Drupal store or Symfony AI Chat adoption).
