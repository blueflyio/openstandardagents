# Registry Reference (all platform registries)

Single place to find every registry: where it lives, how to use it, and how to fix auth.

---

## 1. Agent registry (OSSA – platform-agents)

**What:** Canonical list of 22+ OSSA agents. Single source of truth for CI, Duo, kagent, discovery.

**Where (local):**
- Worktree: `$HOME/Sites/blueflyio/worktrees/platform-agents/release-v0.1.x/`
- Registry file: `registry.yaml` (root)
- Manifests: `.agents/@ossa/<agent-name>/manifest.ossa.yaml`
- Also: `.agents/@drupal/`, `.agents/skills/`, `.kagent/`

**GitLab:** `blueflyio/agent-platform/tools/platform-agents`

**Use:** Edit `registry.yaml` and `.agents/@ossa/*/manifest.ossa.yaml`; push; CI validates. MCP/orchestrator/Discovery read from here. kagent CRDs: `npm run generate:kagent-crds` in platform-agents.

---

## 2. npm registry (@bluefly packages – GitLab)

**What:** All `@bluefly/*` packages (agent-buildkit, agent-mesh, studio-ui, etc.). Install with `npm i -g @bluefly/agent-buildkit` or `npm i @bluefly/studio-ui`.

**URL:** `https://gitlab.com/api/v4/groups/blueflyio%2Fagent-platform/-/packages/npm/`

**Auth (fix 401):** Token must be sent as `_authToken`. Two ways:

**A – Env when you run npm (recommended)**  
In the same terminal where you run `npm i` or `npx @bluefly/agent-buildkit`:
```bash
# Load platform token (Mac)
[ -f /Volumes/AgentPlatform/.env.local ] && source /Volumes/AgentPlatform/.env.local
# Or set explicitly:
export GITLAB_REGISTRY_NPM_TOKEN="<your-PAT-with-read_package_registry>"
```
Workspace root `.npmrc` already has:
```
@bluefly:registry=https://gitlab.com/api/v4/groups/blueflyio%2Fagent-platform/-/packages/npm/
//gitlab.com/api/v4/groups/blueflyio%2Fagent-platform/-/packages/npm/:_authToken=${GITLAB_REGISTRY_NPM_TOKEN}
```
So **sourcing .env.local before npm** fixes 401.

**B – Token in home .npmrc**  
Add to `~/.npmrc` (same two lines as above, with actual token value). Prefer env so token is not stored on disk.

**PAT scopes:** `read_api`, `read_package_registry` (and `write_repository` if you push).

---

## 3. API schema registry (OpenAPI – api.blueflyagents.com)

**What:** Aggregated OpenAPI specs and endpoints index for the whole platform. Drupal api_normalization, MCP, and tools read from here.

**Live URL:** `https://api.blueflyagents.com`  
- Endpoints list: `GET /endpoints-index.json`  
- Full spec: `GET /openapi.yaml`  
- Health: `GET /health`

**Repo (local):** `$HOME/Sites/blueflyio/worktrees/api-schema-registry/release-v0.1.x/`  
**GitLab:** `blueflyio/agent-platform/tools/api-schema-registry`

**Use:** Add `openapi/<project>/openapi.yaml`; run `npm run aggregate` and `npm run endpoints-index`; push; deploy to Oracle. No auth needed to *read* the public URLs.

---

## 4. GitLab Composer registry (Drupal packages)

**What:** Drupal modules/themes/recipes as Composer packages (`drupal/alternative_services`, etc.).

**URL:** GitLab group Composer registry (see AGENTS.md "Recipes as Composer packages"). Auth: `COMPOSER_GITLAB_TOKEN` or `auth.json` with PAT (`read_api`, `read_package_registry`).

**Use:** In Drupal root: add GitLab Composer repo, `composer require drupal/<name>`. Demos consume custom code via this after packages are published from TESTING_DEMOS.

---

## 5. GitLab Container registry (Docker images)

**What:** Docker images for platform services and skill containers (e.g. platform-agents skill-* images in `registry.yaml`).

**Base:** `registry.gitlab.com/blueflyio/agent-platform/tools/platform-agents` (and other projects). Auth: GitLab PAT or CI_JOB_TOKEN in CI.

---

## Quick fix when “registry” fails

| Symptom | Fix |
|--------|-----|
| `npm i @bluefly/agent-buildkit` or `npx @bluefly/agent-buildkit` → 401 | Source platform .env.local so `GITLAB_REGISTRY_NPM_TOKEN` is set, then run npm again. Or add token to `~/.npmrc` for @bluefly scope. |
| buildkit command not found | Use worktree: `node $HOME/Sites/blueflyio/worktrees/agent-buildkit/release-v0.1.x/bin/buildkit` or fix PATH; for npm install, fix registry auth above. |
| Agent list / discovery wrong | Check `worktrees/platform-agents/release-v0.1.x/registry.yaml` and `.agents/@ossa/`; push to GitLab so MCP/orchestrator see latest. |
| OpenAPI / api.blueflyagents.com stale | In api-schema-registry worktree run `npm run aggregate && npm run endpoints-index`, push, deploy to Oracle. |

---

## Run parallel registry agents (5 tracks)

Spawn **five agent teams in parallel**, one per registry. Use **five terminals**. From agent-buildkit repo root (worktree or BUILDKIT_PATH).

**How BuildKit gets env (no manual hack):**
- BuildKit loads platform `.env.local` at startup (from CONFIG_DIR / getPlatformConfigRoot(), e.g. `/Volumes/AgentPlatform/.env.local` on Mac).
- If `WORKTREE_SOURCE_DIR` is not set there, BuildKit sets it to `$HOME/Sites/blueflyio/worktrees` when that path exists, so spawn-team finds project dirs without you exporting it.
- Ensure your shell has token available for GitLab/npm: either add `[ -f /Volumes/AgentPlatform/.env.local ] && source /Volumes/AgentPlatform/.env.local` to `~/.zshrc` so every terminal gets it, or run `source /Volumes/AgentPlatform/.env.local` once in the terminal before running buildkit. Then run buildkit from the agent-buildkit worktree (or use global `buildkit` if on PATH).

**Prereq:** Token check: `buildkit gitlab token check` (or `node dist/cli/index.js gitlab token check` when running from worktree without global buildkit).

**Terminal 1 – Agent registry**
```bash
buildkit agent spawn-team --manifest registry-agent --seed-todo ~/.agent-platform/agent-buildkit/todo/registry-agent --max-parallel 2
```

**Terminal 2 – npm registry**
```bash
buildkit agent spawn-team --manifest registry-npm --seed-todo ~/.agent-platform/agent-buildkit/todo/registry-npm --max-parallel 2
```

**Terminal 3 – API schema registry**
```bash
buildkit agent spawn-team --manifest registry-api-schema --seed-todo ~/.agent-platform/agent-buildkit/todo/registry-api-schema --max-parallel 2
```

**Terminal 4 – Composer registry**
```bash
buildkit agent spawn-team --manifest registry-composer --seed-todo ~/.agent-platform/agent-buildkit/todo/registry-composer --max-parallel 2
```

**Terminal 5 – Container registry**
```bash
buildkit agent spawn-team --manifest registry-container --seed-todo ~/.agent-platform/agent-buildkit/todo/registry-container --max-parallel 2
```

Manifests: `worktrees/agent-buildkit/.gitlab/agent-sprint/registry-*-sprint.yaml`. Seed-todo dirs: `~/.agent-platform/agent-buildkit/todo/registry-agent`, `registry-npm`, `registry-api-schema`, `registry-composer`, `registry-container`. Each track has 3 tasks; max-parallel 2 so 2 agents work per track. Total: 5 teams x 2 agents = 10 agents in parallel (or run with --max-parallel 3 to use 3 per track).

**One-shot (all 5 in parallel from one terminal):**
From the agent-buildkit worktree (or any dir if buildkit is on PATH and platform .env.local is loaded in your shell or at startup):
```bash
cd $HOME/Sites/blueflyio/worktrees/agent-buildkit/release-v0.1.x
for m in registry-agent registry-npm registry-api-schema registry-composer registry-container; do
  buildkit agent spawn-team --manifest "$m" --seed-todo "$HOME/.agent-platform/agent-buildkit/todo/$m" --max-parallel 2 &
done
wait && echo "All 5 done"
```
Use `node dist/cli/index.js` in place of `buildkit` when buildkit is not on PATH. Ensure `npm run build:cli` has been run so `dist/` exists.

---

## Completed run (2026-03-02)

- **Spawn:** All 5 tracks ran in parallel; 15 tasks seeded (3 per track). Agents claimed from registry-agent, registry-api-schema, registry-composer, registry-container.
- **Agent registry:** `generate:kagent-crds` run in platform-agents (24 CRDs, 2 skipped). Validate: use `ossa validate` in platform-agents when OSSA CLI available. Discovery: MCP `platform.list_registry_agents` and registry.yaml are single source; mesh reads from platform-agents.
- **API schema registry:** `npm run aggregate` and `npm run endpoints-index` run in api-schema-registry worktree; output in `openapi/openapi.yaml` and `openapi/endpoints-index.json`. Deploy to Oracle for https://api.blueflyagents.com (health may show 502 until deploy).
- **npm / Composer / Container:** Auth and usage are documented above. Composer "modules that must publish" and container registry details: see AGENTS.md in workspace root. CI tokens: use GitLab group variable GITLAB_REGISTRY_NPM_TOKEN and COMPOSER_GITLAB_TOKEN from platform .env.local.
- **Next:** Push api-schema-registry and platform-agents changes if needed; run `buildkit deploy oracle api-schema-registry` to refresh api.blueflyagents.com. Mark tasks complete: `buildkit agent task-queue complete --task <id> --from ~/.agent-platform/agent-buildkit/todo/<track>/TODO` (or INPROGRESS).
