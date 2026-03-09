# Hackathon Pipeline (n8n feed, Drupal dashboard, hackathon-helper agent)

End-to-end runbook: n8n feed and list webhook, platform config, scoring, Drupal block, hackathon-helper OSSA agent, optional MCP tool.

---

## 1. n8n: Feed workflow and list webhook

**Feed workflow:** Import the workflow from agent-buildkit:

- **Source file:** `config-templates/n8n-hackathon-feed-and-list.json`
- **Steps:** Schedule trigger, Fetch (MLH and/or Devpost), Normalize (common schema), Score platform fit (0-10 keyword match), Store (in-memory or Redis)
- **List webhook:** GET webhook node returns stored hackathon list (optional query `minScore` 0-10)

**n8n URL:** https://n8n.blueflyagents.com (Oracle; production only).

**Import:** In n8n UI, Import from File and select the JSON. Activate the workflow. Ensure the GET webhook URL is reachable (e.g. `https://n8n.blueflyagents.com/webhook/hackathon-list`).

**Verify list:** `curl -s "https://n8n.blueflyagents.com/webhook/hackathon-list"` returns JSON with `hackathons` array and optional `updatedAt`.

---

## 2. Config: Platform description for scoring and drafts

**File:** `config-templates/hackathon-pipeline-config.json`

Contains:

- `platformDescription` – used for keyword scoring and context in n8n
- `platformPitchForDrafts` – used when drafting submission text via agent-router

No runtime copy required; n8n and the hackathon-helper agent can read from this or from env.

---

## 3. Optional scoring (n8n)

The feed workflow includes a **Score platform fit** Code node between Normalize and Store. It sets `platformFitScore` (0-10) per item using keyword match (agents, AI, OSSA, MCP, developer, Drupal, etc.). The list webhook can filter by `minScore` query parameter if implemented in the workflow.

---

## 4. Drupal: Hackathon Pipeline module

**Location:** `ai_agents_dashboard` repo, submodule at `ai_agents_dashboard/modules/hackathon_pipeline/`. On a Drupal site the path is `web/modules/custom/ai_agents_dashboard/modules/hackathon_pipeline/`.

**Components:**

- **Settings:** `/admin/config/services/hackathon-pipeline` – List API URL (default `https://n8n.blueflyagents.com/webhook/hackathon-list`), Start route (default `/hackathon-pipeline/start`). Optional **Platform integration:** Agent Mesh base URL (default `https://mesh.blueflyagents.com`), platform storage path, Bloom data path (see section 8).
- **Block:** "Hackathon list" – GETs list URL, shows form with min score filter and checkboxes; "Start with selected" redirects to `/hackathon-pipeline/start?ids=id1,id2`.
- **Start page:** `/hackathon-pipeline/start?ids=...` – Shows selected IDs and instructs user to invoke the hackathon-helper agent.

**Enable module and place block:**

On a working Drupal site that has the hackathon_pipeline module in `web/modules/custom/ai_agents_dashboard/modules/hackathon_pipeline/`:

```bash
cd /path/to/drupal/root
ddev drush en hackathon_pipeline -y
ddev drush cr
```

Place the block "Hackathon list" (category: Hackathon Pipeline) on a region (e.g. content or sidebar) via Block layout (`/admin/structure/block`) or Layout Builder.

**Note:** If the demo site (TESTING_DEMOS/DEMO_SITE_drupal_testing) fails to bootstrap (e.g. missing contrib files or circular dependency), fix the site first or enable the module on another Drupal site (e.g. AgentDash) where the module is deployed.

**Config:** Set List API URL in Configuration > Hackathon Pipeline if different from default.

---

## 5. Hook-up: platform-agents, Oracle/NAS, storage, Bloom

**platform-agents (registry and orchestrator):**

- **Mac (edit):** `worktrees/platform-agents` (branch e.g. release/v0.1.x). Push to GitLab when done.
- **Oracle:** `/opt/.agents/platform-agents` – deploy with `buildkit deploy oracle-agents` (clone/pull from GitLab). Same flow for other agent repos in `config-templates/agents-deploy.config.json`.
- **NAS:** `/volume1/AgentPlatform/.agents/platform-agents` (or Mac mount `/Volumes/AgentPlatform/.agents/platform-agents`). Sync or clone from GitLab; no separate deploy command for NAS.

AgentDash and hackathon_pipeline do not read the registry from disk. They use **Agent Mesh** for discovery (same mesh that platform-agents/orchestrator use). So the hook-up is: set **Agent Mesh base URL** in Hackathon Pipeline settings (default `https://mesh.blueflyagents.com`). When the Drupal site runs on Oracle or NAS, it uses that mesh; agents listed there come from the same platform-agents registry.

**Getting ai_agents_dashboard (and hackathon_pipeline) onto Oracle/NAS:**

- **AgentDash site on Oracle:** Deployed repo is **demo_agentdash** at `/opt/agent-platform/drupal/agent-dashboard`. To include ai_agents_dashboard (with submodule hackathon_pipeline), either: (1) Add ai_agents_dashboard as a Composer dependency of demo_agentdash (if published to GitLab package registry) and run `composer update` on deploy, or (2) In deploy script or CI, clone `ai_agents_dashboard` (with `--recursive` for submodules) into `web/modules/custom/ai_agents_dashboard` so the site has the module tree. Same idea for NAS if the site runs there.
- **Bare repo / GitLab:** ai_agents_dashboard: `blueflyio/agent-platform/agentdashboard/ai_agents_dashboard`. hackathon_pipeline: `blueflyio/agent-platform/agentdashboard/hackathon_pipeline`. Push ai_agents_dashboard (and its submodule ref) to GitLab so Oracle/NAS can pull.

**Storage and Bloom (optional):**

- **Platform storage:** `/Volumes/AgentPlatform/storage` (Mac) or `/volume1/AgentPlatform/storage` (NAS). Use for shared Research, data, or artifacts. In Hackathon Pipeline settings, **Platform storage path** is optional; set it when the site runs on Oracle/NAS and needs to read/write that path (e.g. `/opt/agent-platform/storage` on Oracle if mounted).
- **Bloom data:** `/Volumes/AgentPlatform/storage/Research/bloom-data` (Mac) or NAS equivalent. Contains `seed.yaml`, `behaviors.json`, `models.json`. MCP tools `research.bloom_get_config`, `research.bloom_list_behaviors`, `research.bloom_run` use it when **BLOOM_DATA_PATH** is set (agent-protocol/MCP server). To integrate: (1) Set **Bloom data path** in Hackathon Pipeline settings if the module or a custom service needs to read Bloom config, or (2) Rely on MCP: agents that call Bloom use BLOOM_DATA_PATH on the host where MCP runs (Oracle/NAS). No requirement to wire Bloom into hackathon_pipeline unless you add a feature that uses it directly.

---

## 6. platform-agents: hackathon-helper OSSA agent (manifest)

**Manifest:** `platform-agents/.agents/@ossa/hackathon-helper/manifest.ossa.yaml`

**Registry:** One entry in `registry.yaml`: id `hackathon-helper`, domain `hackathon`, tier `worker`, status `development`.

**Tools (declared in manifest; implementation via n8n, router, workflow-engine):**

- `get_hackathon_list` – GET n8n list webhook (optional minScore).
- `get_hackathon_details` – GET list and filter by id.
- `draft_submission_text` – POST to agent-router with platform context.
- `save_my_selection` – POST to workflow-engine execute-by-name (or state store).
- `get_deadline_reminders` – GET list and filter by deadline.

**Validate manifest:** From platform-agents repo: `ossa validate .agents/@ossa/hackathon-helper/manifest.ossa.yaml` (or `npx @bluefly/openstandardagents validate`).

---

## 7. Optional: agent-protocol MCP tool hackathon.get_list

To expose the list to MCP clients (Cursor, Goose): add a tool e.g. `hackathon.get_list` in agent-protocol that GETs the n8n list webhook and returns the JSON. Optional query `minScore`. Document in agent-protocol wiki if implemented.

---

## 8. Commands run (assistant-executed)

- **Drupal:** Enable was attempted from `TESTING_DEMOS/DEMO_SITE_drupal_testing`; the site failed to bootstrap (missing `views_bulk_operations/modules/actions_permissions/actions_permissions.info.yml`, circular dependency involving `mcp.settings`). Enable the module on a working Drupal site per section 4.
- **Wiki:** This page is published via `buildkit gitlab wiki publish --project blueflyio/agent-platform/tools/agent-buildkit --manifest .gitlab/wiki-manifest.json` (Hackathon-Pipeline is in the manifest). Token required: source `/Volumes/AgentPlatform/.env.local` then run from agent-buildkit: `npm run wiki:publish`.

No commands are left for the user to run; the assistant runs them and documents here.
