# Merge and Deploy Plan - Status and Safe Steps

**Goal:** Merge all local changes into release branches, push to GitLab, deploy to Oracle and NAS. No work lost. No destructive commands without your approval.

**Published to:** agent-buildkit or technical-docs wiki. **Source:** agent-buildkit `config-templates/wiki-Merge-And-Deploy-Plan.md`.

---

## Pre-flight (run first)

1. **Disk space:** You had ENOSPC earlier. Check: `df -h /` — need at least 2GB free for git/Next.js.
2. **Token:** `set -a && source /Volumes/AgentPlatform/.env.local && set +a` then `buildkit gitlab token check`. Must pass before any push.
3. **NAS mounted:** If using `--applications-root`, ensure `/Volumes/AgentPlatform` is mounted.

---

## Current Status (from survey)

| Location | Branch | Status |
|----------|--------|--------|
| worktrees/agent-buildkit | fix/nas-ssh-and-mcp-build | Modified (config, wiki manifest, setup-projects) |
| WORKING_DEMOs/openstandardagents.org | release/v0.4.x | Modified (.gitignore, .gitlab-ci, README, cursor-mcp, D website/app/api/agent-badge) |
| WORKING_DEMOs/Drupal_AgentDash | release/v0.1.x | Clean (no status output) |
| TESTING_DEMOS custom modules | varies | Many modules; each may have own .git |

---

## Phase 1: Worktrees (non-Drupal)

**Repos:** agent-buildkit, agent-mesh, agent-protocol, agent-tracer, agent-router, agent-docker, workflow-engine, platform-agents, gitlab_components, agent-studio, ide-supercharger, api-schema-registry, technical-docs, openstandard-ui, agent-brain, foundation-bridge, iac, security-policies.

**Safe flow per repo:**
```bash
cd <worktree-path>
git status                    # see what's changed
git add -A && git commit -m "chore: sync to release"   # only if you want to keep changes
git fetch origin
git checkout release/v0.1.x   # or release/v0.4.x for openstandard-*
git pull --no-rebase origin release/v0.1.x
git merge <feature-branch> -m "Merge <feature> into release"   # if on feature branch
git push origin release/v0.1.x
```

**Agent-buildkit specifically:** On `fix/nas-ssh-and-mcp-build`. Options:
- A) Commit changes, merge fix/nas-ssh-and-mcp-build into release/v0.1.x, push.
- B) Stash (forbidden per rules) — do not use.
- C) Create MR from fix branch to release, merge via GitLab.

---

## Phase 2: TESTING_DEMOS + WORKING_DEMOs Drupal (modules, themes, recipes)

**BuildKit command:** `buildkit drupal sync-all`

**What it does:**
- Discovers repos under: TESTING_DEMOS/DEMO_SITE_drupal_testing, WORKING_DEMOs/Drupal_AgentDash, Drupal_AgentMarketplace, Drupal_Fleet_Manager, Drupal_SourceAdmin.
- Subpaths: web/modules/custom, web/themes/custom, web/recipes, recipes.
- For each: commit if dirty, checkout release, pull, merge current into release, push.

**WARNING:** If `git pull` fails (divergent history), the script runs `git reset --hard origin/<branch>`. That **discards local commits**. I will NOT run sync-all without your explicit approval. Run with `--dry-run` first to list repos.

```bash
buildkit drupal sync-all --dry-run
# Review output, then:
# buildkit drupal sync-all   # ONLY after you approve
```

**Optional applications root:** `buildkit drupal sync-all --applications-root /Volumes/AgentPlatform/applications` to include NAS applications.

---

## Phase 3: WORKING_DEMOs (non-Drupal)

**Repos:** marketplace, NODE-AgentMarketplace, dragonfly, openstandard-generated-agents, openstandard-ui, openstandardagents, openstandardagents.org, studio-ui.

**Branch policy:**
- release/v0.1.x: most platform repos
- release/v0.4.x: openstandardagents, openstandardagents.org, openstandard-ui
- main: openstandard-generated-agents

**Same safe flow as Phase 1** — per-repo: status, commit if desired, checkout release, pull, merge, push.

---

## Phase 4: Deploy to Oracle and NAS

**After all pushes:**

1. **Oracle:** `buildkit deploy oracle <service>` for each service, or CI will deploy on push to main/release.
2. **NAS:** `buildkit deploy nas <service>` or `git pull` in NAS application dirs.
3. **Pull on Oracle/NAS:** Ensure both pull latest from GitLab (CI may do this; manual: SSH and `git pull` in each deploy dir).

---

## What I will NOT do without your approval

- `git stash`
- `git reset --hard`
- `git push --force`
- `buildkit drupal sync-all` (contains reset --hard fallback)
- Any command that could discard uncommitted or unpushed work

---

## Recommended order

1. Run pre-flight (disk, token).
2. Run `buildkit drupal sync-all --dry-run` — review repos.
3. You approve which repos to sync.
4. Phase 1: Manually merge agent-buildkit (and any other worktrees with changes) into release, push.
5. Phase 2: Run `buildkit drupal sync-all` only if you accept the reset --hard risk, or do Phase 2 manually per-repo.
6. Phase 3: Same manual flow for marketplace, dragonfly, openstandard-*, studio-ui.
7. Phase 4: Deploy after all pushes.

---

## Next step

Reply with:
- "Approve Phase 1 for agent-buildkit" — I'll run the merge/push for agent-buildkit only.
- "Run dry-run only" — I'll run `buildkit drupal sync-all --dry-run` and show you the list.
- "I'll do it manually" — I'll stop here; use this plan as reference.
- Or specify which phase/repo you want me to execute.
