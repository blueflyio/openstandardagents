# Agent Dash Future Architecture Evaluation

**Purpose:** Evaluate two options for the long-term architecture of Agent Dash: (A) build it entirely into the Drupal Marketplace backend, or (B) merge it with Fleet Demo (Drupal_Fleet_Manager / Drupal_SourceAdmin) as the admin surface for managing many Drupal sites.

**Context:** Agent Dash today is a separate Drupal demo (demo_agentdash, Drupal_AgentDash) with recipe_agentdash, chatbot, and platform tool integration. Fleet Demo (Drupal_Fleet_Manager / Drupal_SourceAdmin) is the admin for managing mass amounts of Drupal sites (fleet apply, Cedar gate, pulse, rollout). Both consume platform services (router, MCP, Dragonfly, compliance) and Drupal contrib (tool, ECA, api_normalization).

---

## Option A: Agent Dash entirely in Drupal Marketplace backend

**Idea:** Make the Agent Marketplace Drupal site (Drupal_AgentMarketplace) the single backend for both "marketplace" (discover, create, deploy agents) and "dash" (chatbot, platform tools, one-site operator experience). Agent Dash UI and features move into the marketplace codebase; one Drupal site serves both personas.

**Pros:**
- Single Drupal install to maintain, deploy, and upgrade (marketplace.blueflyagents.com).
- One auth model: marketplace user = dash user; per-user GitLab project and "my agents" already scoped to user.
- Node frontend (NODE-AgentMarketplace) can grow dash-style views (e.g. "My agents", "Chat", "Tools") without a second Drupal site.
- Less duplication of config, modules, and recipes (recipe_agentdash vs recipe_agent_marketplace merge into one).

**Cons:**
- Marketplace site becomes heavier (more modules, more config); must stay performant and clear for both flows.
- Demos today are separate repos (demo_agentdash vs demo_agent_marketplace); merging implies one repo and one deploy pipeline.
- Different audiences (marketplace = catalog + create; dash = operate one site) might want different UX; one backend can still serve both with different routes/views.

**Recommendation (Option A):** Viable and aligned with "one backend" if the product direction is "marketplace + operator experience in one place." Prefer if we want to reduce number of Drupal demos and have the Node app be the primary UI for both catalog and dash.

---

## Option B: Merge Agent Dash with Fleet Demo (Drupal_Fleet_Manager / Drupal_SourceAdmin)

**Idea:** Merge Agent Dash into the Fleet Demo codebase. Fleet Demo becomes the "admin for many Drupal sites" plus the "operator/dash" experience for a single site (chatbot, tools, health). So: one Drupal site that does fleet management (mass sites) and per-site dash (one site at a time).

**Pros:**
- Fleet Demo already has fleet apply, Cedar, pulse, rollout; adding "dash" (chatbot, platform tools) gives operators one place for both fleet ops and single-site interaction.
- Natural fit: "manage many sites" includes "use tools on one of them"; dash could be a "focus on this site" mode inside the same app.
- Single repo: drupal_fleet_manager (or Drupal_SourceAdmin) holds both fleet and dash; one recipe, one deploy.

**Cons:**
- Fleet Demo is oriented to admins managing many sites; Agent Dash is oriented to an operator on one site (chatbot, tools). Merging risks blurring personas (admin vs operator) or overloading one UI.
- Marketplace (catalog, create agent, per-user GitLab project) is a different concern from fleet management; merging dash into fleet does not by itself merge marketplace. So we could end up with: Marketplace (catalog + create) + Fleet Demo (fleet + dash) as two sites, with dash living in Fleet not in Marketplace.

**Recommendation (Option B):** Viable if the product direction is "fleet-first: one admin app for all sites, with a per-site dash mode." Prefer if we want to keep marketplace focused only on catalog/create and have "operate this site" (dash) live next to "operate all sites" (fleet).

---

## Summary and next step

| Option | Best when |
|--------|-----------|
| **A: Dash in Marketplace** | One backend for "discover/create agents" and "operate (dash)"; Node app is the main UI for both. |
| **B: Dash in Fleet Demo** | One admin app for "fleet + single-site dash"; marketplace stays catalog/create only. |

**Next step:** Choose one direction (or a hybrid: e.g. dash UI in Node app, backend APIs from marketplace vs fleet) and document in a GitLab issue or epic; then refactor demos and recipes accordingly. No new repos; extend existing Drupal demos and recipes per separation of duties.

**Publish:** `buildkit gitlab wiki publish --project blueflyio/agent-platform/tools/technical-docs --slug Agent-Dash-Future-Architecture --title "Agent Dash Future Architecture Evaluation" --file config-templates/wiki-Agent-Dash-Future-Architecture.md`
