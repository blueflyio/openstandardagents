# URL audit: OSSA and studio-ui (full audit)

Customer installs must use their own URLs. All endpoint URLs (mesh, MCP, OSSA UI API, etc.) must come from env or config.

**Summary**

| Repo | Runtime hardcodes | Env fallbacks | Doc/test/generated | Action |
|------|-------------------|--------------|--------------------|--------|
| openstandard-generated-agents | 0 | 0 | CI/example only | Document env for pipeline; example agent.yml is template. |
| openstandard-ui | 2 | 0 | Docs/footer | Replace 2 hardcodes with env (discovery, A2A stream). |
| openstandardagents | 2 | 3 | Help/generated/tests | Replace 2 adapter hardcodes; keep or document 3 defaults. |
| openstandardagents.org | 1 | 7+ | Footer | Replace 1 iframe hardcode; document 7+ env fallbacks. |
| studio-ui | 2 | 1 | Generated/tests | Replace 2 demo/mock URLs; document 1 GitLab default. |

---

## 1. openstandard-generated-agents

**Paths checked:** WORKING_DEMOs (release-v0.4.x, main), worktrees.

| File | Line | Finding | Status |
|------|------|---------|--------|
| .gitlab-ci.yml | 40, 61, 66 | `npx -y @bluefly/openstandardagents` (package name, not URL) | OK |
| .gitlab-ci.yml | 191 (release) | `git config user.email "ci@blueflyio"` | CI only; optional to make env. |
| worktrees/.../artifact-publisher/agent.yml | 1, 9, 20 | `ossa.blueflyagents.com`, `gitlab.blueflyagents.com` | Example/template manifest; document or use placeholders. |

**Conclusion:** No runtime app code with platform URLs. Pipeline uses env for trigger token. Mark as **done** after documenting required env (e.g. EXPORT_TRIGGER_TOKEN, GITLAB project) and noting example agent.yml as template.

---

## 2. openstandard-ui

**Canonical app:** `website/` (start script: `cd website && npx next dev`). So `fetch('/api/discovery')` hits **website/app/api/discovery/route.ts**.

| File | Line | Finding | Status |
|------|------|---------|--------|
| website/app/api/discovery/route.ts | 6, 29 | `PROD_AGENT_MESH_URL = 'https://mesh.blueflyagents.com/api/v1/discovery'` and used in fetch | **FIX:** Use `process.env.MESH_URL` or `AGENT_REGISTRY_URL` with fallback to empty or localhost; document env. |
| app/api/discovery/route.ts | 21 | `NEXT_PUBLIC_REGISTRY_API_URL \|\| 'http://127.0.0.1:3000/v1/discovery'` | OK (env-driven). |
| components/mesh/A2AFirehose.tsx | 19 | `EventSource('https://mesh.blueflyagents.com/api/v1/a2a/stream')` | **FIX:** Use env e.g. `NEXT_PUBLIC_A2A_STREAM_URL` or `MESH_URL` + path; document. |
| website/app/skills/page.tsx | 116–120 | Link `href="https://marketplace.blueflyagents.com"` | Optional: make `NEXT_PUBLIC_MARKETPLACE_URL` or leave as default link. |
| website/content/docs/* | various | References to ossa-ui.blueflyagents.com, mesh, etc. | Doc only; optional to parameterize. |
| Footer / about | various | bluefly.io links | Branding; OK. |

**Conclusion:** **2 must-fix** (website discovery route, A2AFirehose). Update checklist: openstandard-ui = **pending** until these two are env-driven.

---

## 3. openstandardagents (CLI/SDK)

| File | Line | Finding | Status |
|------|------|---------|--------|
| src/cli/utils/standard-options.ts | 192 | `DEFAULT_REGISTRY_URL = 'https://mesh.blueflyagents.com'` | Env OSSA_REGISTRY_URL/--registry wins; default for our deploy. **Optional:** no default so customer must set; or document. |
| src/cli/commands/discover.ts | - | baseUrl from config or default mesh | Same as above. |
| src/cli/commands/verify.ts | - | same | Same. |
| src/cli/commands/wizard-interactive.command.ts | - | default `'https://mesh.blueflyagents.com'` | Same. |
| src/adapters/gitlab/agent-generator.ts | - | `http://mesh.blueflyagents.com/webhook/...` | **FIX:** Use registry URL from options/env + path. |
| src/adapters/openai-agents/adapter.ts | - | `https://agentdash.bluefly.io/jsonrpc` | **FIX:** Configurable base URL or env. |
| src/adapters/langflow/platform-adapter.ts | - | langflow.blueflyagents.com in description | Help text; optional. |
| src/cli/commands/export.command.ts | - | langflow.blueflyagents.com in help | Help text; optional. |
| src/generated/types.ts | - | api.llm.bluefly.io in comments | Generated; spec. |
| Version/spec, tests | - | ossa.bluefly.io, API version strings | Not endpoints; OK. |

**Conclusion:** **2 must-fix** (gitlab agent-generator mesh webhook URL, openai-agents adapter agentdash URL). Keep or document the 3 CLI defaults (mesh) for our deploy; customers set env.

---

## 4. openstandardagents.org

| File | Line | Finding | Status |
|------|------|---------|--------|
| website/app/api/discovery/route.ts | - | `NEXT_PUBLIC_OSSA_UI_URL \|\| 'https://ossa-ui.blueflyagents.com'` | Env fallback; document. |
| website/app/api/agent-builder/route.ts | - | same pattern | Env fallback; document. |
| website/app/api/builder/route.ts | - | same | Env fallback; document. |
| website/app/page.tsx | - | iframe or link to OSSA UI | **FIX:** iframe `src` must use `process.env.NEXT_PUBLIC_OSSA_UI_URL` (no hardcode). |
| website/app/builder/page.tsx | - | env fallback | Document. |
| website/components/builder/InteractiveBuilder.tsx | - | env fallback | Document. |
| website/lib/gitlab-trigger.ts | - | env fallback | Document. |
| website/app/agent-builder/page.tsx | - | env fallback | Document. |
| Footer / about | - | bluefly.io | Branding; OK. |

**Conclusion:** **1 must-fix** (iframe or primary link to OSSA UI must use env only; no hardcoded ossa-ui.blueflyagents.com in src). All other uses already have env with fallback; document required env for customer install.

---

## 5. studio-ui

| File | Line | Finding | Status |
|------|------|---------|--------|
| InfrastructureDashboard.tsx | - | `design-system.llm.bluefly.io`, `admin@llm.bluefly.io`, `my-app.llm.bluefly.io` | **FIX:** Mock/demo data; use env or config for base URL and labels. |
| use-gitlab-pipelines.ts | - | `NEXT_PUBLIC_GITLAB_URL \|\| 'https://app-4001.cloud.bluefly.io'` | **FIX:** Document; for customer install require env or remove default. |
| src/lib/api-client.ts | - | Comment `daemon.bluefly.io` | Comment only; OK. |
| src/design-system-api/types/generated/servers.ts | - | `https://api.design-system.bluefly.io/v1`, staging | Generated; API base URL should be configurable in client. |
| design-system-api types (generated) | - | Contact design-system@bluefly.io | Metadata; OK. |
| Nightwatch / screenshot utils | - | bluefly.io test URLs | Test only; OK. |

**Conclusion:** **2 must-fix** (InfrastructureDashboard demo URLs, GitLab URL default). Document env; generated server URLs are a separate config concern.

---

## Validate commands (per repo)

Use these after merge-to-release and before push:

| Repo | Command |
|------|---------|
| openstandard-generated-agents | (no app build) `npx -y @bluefly/openstandardagents validate .agents/incoming/manifest.ossa.yaml` (if file exists) |
| openstandard-ui | `pnpm install && pnpm build` (from repo root or website/) |
| openstandardagents | `npm run build` then `node dist/cli/index.js --help` |
| openstandardagents.org | `pnpm install && pnpm website:build` (or build from website/) |
| studio-ui | `npm run build` |

---

## Env template (customer install)

Document in runbook or wiki; no hardcoded defaults in code for these:

- MESH_URL (or AGENT_REGISTRY_URL)
- NEXT_PUBLIC_REGISTRY_API_URL
- NEXT_PUBLIC_A2A_STREAM_URL
- NEXT_PUBLIC_OSSA_UI_URL
- NEXT_PUBLIC_MARKETPLACE_URL (optional)
- OSSA_REGISTRY_URL (CLI)
- NEXT_PUBLIC_GITLAB_URL (studio-ui)
- Design-system API base URL (studio-ui)

---

*Full audit completed. Next: apply fixes in each repo (replace hardcodes with env), then re-run validation and update this checklist.*
