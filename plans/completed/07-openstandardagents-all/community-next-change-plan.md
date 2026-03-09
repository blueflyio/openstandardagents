# Plan: The Next Drupal Change the Community Needs

**Purpose:** Position our stack as the reference implementation that ties Drupal's official AI, Tool, Orchestration, and SDC/Canvas direction into one story the community can adopt. Not a new product—we align and extend what drupal.org already defines.

**References (read first):**
- [ai_agents_ossa](https://www.drupal.org/project/ai_agents_ossa) — OSSA bridge, Tool API bridge, 29 templates, submodules: orchestration, FlowDrop, Canvas, ECA
- [tool](https://www.drupal.org/project/tool) — Pluggable Tool API, AI function calling, MCP foundation
- [orchestration](https://www.drupal.org/project/orchestration) — Expose Drupal to Activepieces/n8n/Zapier; integrates Tool API, ECA, AI Agents; [plugin API](https://project.pages.drupalcode.org/orchestration/develop/plugin/)
- [api_normalization](https://www.drupal.org/project/api_normalization) — OpenAPI import, gateway, Tool API generation
- [ai](https://www.drupal.org/project/ai), [ai 1.2.x docs](https://project.pages.drupalcode.org/ai/1.2.x/) — Unified AI framework, providers, Key
- [ai_agents](https://www.drupal.org/project/ai_agents), [ai_agents docs](https://ai-agents-project-eb5f6489e826e45857a7585a7d05c3e39463e30c9c8d5.pages.drupalcode.org/) — Agent runtime, plugins, UI
- [canvas](https://www.drupal.org/project/canvas), [canvas docs](https://project.pages.drupalcode.org/canvas/) — Code components, SDC, AI Assistant
- [SDC API](https://www.drupal.org/docs/develop/theming-drupal/using-single-directory-components/api-for-single-directory-components) — `module:component` ID, ComponentElement, .component.yml, plugin.manager.sdc

---

## 1. The One Rule We Push Everywhere

**In Drupal, use the Tool API for every callable action.** Events are for automatic reactions; agents, ECA, FlowDrop, and orchestration call Tools. We implement this rule in code (dragonfly_client, ai_agents_ossa, recipe_onboarding_fleet_extension) and document it so the community sees one pattern: Tool API = contract for "something an agent or workflow can invoke."

- **Event** = subscriber runs when something happens (e.g. test completed → post to GKG). No one calls it.
- **Tool** = plugin (drupal/tool) with id `module:operation`. Callable via Tool API, tool_ai_connector, orchestration GET/POST, ECA "Execute Tool", FlowDrop Tool node.

We already did this for "post run to GKG": event subscriber for automatic post, Tool `dragonfly_client:post_run_to_gkg` for on-demand. We repeat the pattern everywhere and make it the default in docs and examples.

---

## 2. Align 1:1 With Official Projects (No Duplication)

| Community project | Our role | Action |
|-------------------|----------|--------|
| **drupal/tool** | All callable actions are Tool plugins. No "custom service that something calls" without a Tool wrapper. | Audit custom modules: every agent/ECA/FlowDrop-callable operation has a `#[Tool]` plugin. Document in each module: "In Drupal use the Tool API." |
| **drupal/orchestration** | Every capability we want exposed to n8n/Zapier/Activepieces is exposed via a ServicesProviderInterface (getId, getAll, execute). Orchestration discovers Tool API plugins; we add provider plugins only when we need to group or add config. | Fix ai_agents_communication_orchestration so the container builds. Ensure dragonfly_client_orchestration only exposes Tool plugins via orchestration's Tool API integration (no duplicate logic). |
| **drupal/ai** | LLM providers, Key for secrets, operation types. We use ai for all LLM routing; no custom provider code. | Route Dragonfly/AgentDash/marketplace LLM through drupal/ai + agent-router or OpenAI provider. No ai_provider_router or custom bridge in core. |
| **drupal/ai_agents** | AiAgent plugins, AiFunctionCall (tools). Our OSSA agents become AiAgent via ai_agents_ossa deriver; our Tools are Tool API plugins (tool_ai_connector exposes them to ai_agents). | ai_agents_ossa: keep Tool API bridge; ensure every OSSA capability grant maps to a Drupal Tool plugin. No parallel "custom tool registry." |
| **ai_agents_ossa** | Reference implementation: OSSA → Drupal Tool API, orchestration, Canvas, ECA, FlowDrop. | Ship submodules (orchestration, FlowDrop, Canvas, ECA) as the example. Document "Tool API first" in project page and README. Contribute back: patches to tool/orchestration if we find gaps. |
| **api_normalization** | OpenAPI → gateway + Tool API. All platform APIs (mesh, workflow, dragonfly, compliance) consumed via api_normalization import from api.blueflyagents.com. | One-shot platform import (alternative_services:platform-import); ECA/FlowDrop call gateway or Tool. No raw Guzzle for platform APIs. |
| **SDC / Canvas** | Agent dashboards, marketplace UI, OSSA UI components: SDC components where possible; Canvas for visual building. | ai_agents_ossa_canvas: use SDC (`module:component`), document in .component.yml; align with [SDC API](https://www.drupal.org/docs/develop/theming-drupal/using-single-directory-components/api-for-single-directory-components). |

---

## 3. Fix the Blocker, Then Ship the Pattern

1. **Fix orchestration container error** so `drush cr` succeeds. The failure is: `ai_agents_communication_orchestration.services_provider` does not implement `ServicesProviderInterface`. The class does implement it; the failure is likely a dependency (CommunicationClient, AgentRegistry, MessageHandler) not loading. Fix: resolve the dependency chain or temporarily make the provider optional so the rest of the stack builds. Then document the fix so the community can run the same stack.

2. **Document "Tool API first" in one place the community sees.** Add to ai_agents_ossa project page and to the tool project (if we contribute): "For any action that an agent, ECA, or FlowDrop must invoke: implement a drupal/tool Tool plugin. Use event subscribers only for automatic side effects (e.g. on entity save, on test complete)." Point to dragonfly_client as the worked example: one event (GKG post on completion), one Tool (post_run_to_gkg for on-demand).

3. **dragonfly_client as the reference.** Ensure it has: only Tool plugins for callable operations; one clear event subscriber (GKG) with docblocks that say "use Tool API for on-demand." Add dragonfly_client_orchestration that exposes those Tools via orchestration (so n8n/Zapier can trigger tests, get run, post to GKG). No custom RPC or duplicate APIs.

---

## 4. SDC and Canvas: Where We Show Up in the UI

- **SDC:** All agent/OSSA UI components (cards, badges, dashboards) are Single Directory Components: `module:component`, .component.yml, props/slots per [SDC API](https://www.drupal.org/docs/develop/theming-drupal/using-single-directory-components/api-for-single-directory-components). Declare `drupal:sdc` in info.yml. This is what the community is moving toward (Drupal 10.3+ core, Storybook, component-driven).
- **Canvas:** For visual page building and AI Assistant, use [Canvas](https://project.pages.drupalcode.org/canvas/) (code components, SDC components, APIs). ai_agents_ossa_canvas and marketplace/AgentDash dashboards should be Canvas-compatible where it makes sense.
- We do not invent a second component system. We use SDC + Canvas and document any extension (e.g. OSSA agent card as SDC) so others can reuse.

---

## 5. What "The Next Drupal Change" Actually Is

It is not a new framework. It is:

1. **One rule:** In Drupal, use the Tool API for every callable action. Events for reactions only.
2. **One stack:** tool + orchestration + ai + ai_agents + api_normalization + (our) ai_agents_ossa + dragonfly_client + alternative_services. Everything callable is a Tool; orchestration exposes Tools to n8n/Zapier; OpenAPI flows through api_normalization; OSSA flows through ai_agents_ossa.
3. **One reference:** Our modules (dragonfly_client, ai_agents_ossa, recipe_onboarding_fleet_extension) are the worked examples: Tool plugins, event subscribers only where automatic, orchestration providers that expose Tools, SDC/Canvas where we do UI.
4. **Community visibility:** Publish this plan and the "Tool API first" rule on drupal.org (ai_agents_ossa project page, documentation). Contribute patches or docs to drupal/tool and drupal/orchestration so the pattern is in the canonical projects. Talk/sprint at DrupalCon or contrib summit: "Tool API + orchestration: one pattern for agents, ECA, and n8n."

---

## 6. Immediate Checklist

- [ ] Fix ai_agents_communication_orchestration so container builds (implement ServicesProviderInterface or fix dependency).
- [ ] In dragonfly_client: ensure all callable operations are Tool plugins; docblocks say "In Drupal use the Tool API."
- [ ] In ai_agents_ossa: project page and README add "Tool API first; events for automatic reactions only."
- [ ] In AGENTS.md/CLAUDE.md: keep "CRITICAL: drupal/tool and drupal/orchestration" and add pointer to this wiki plan.
- [ ] Optional: drupal.org documentation issue or project page update for tool/orchestration that recommends "Tool API for all callable actions."
- [ ] Optional: SDC audit—every agent/OSSA UI component is an SDC with correct .component.yml and drupal:sdc dependency.

---

## 7. Links (curated)

- [Orchestration – Integrating Drupal modules](https://project.pages.drupalcode.org/orchestration/develop/plugin/)
- [SDC API](https://www.drupal.org/docs/develop/theming-drupal/using-single-directory-components/api-for-single-directory-components)
- [AI 1.2.x](https://project.pages.drupalcode.org/ai/1.2.x/), [AI Agents](https://ai-agents-project-eb5f6489e826e45857a7585a7d05c3e39463e30c9c8d5.pages.drupalcode.org/), [Canvas](https://project.pages.drupalcode.org/canvas/)
- [Specbee: SDC + Storybook](https://www.specbee.com/blogs/integrating-single-directory-components-sdc-and-storybook-in-drupal), [QED42](https://www.qed42.com/insights/single-directory-components-in-drupal-10), [The Drop Times](https://www.thedroptimes.com/35914/component-based-design-using-single-directory-components-sdc-in-drupal)
