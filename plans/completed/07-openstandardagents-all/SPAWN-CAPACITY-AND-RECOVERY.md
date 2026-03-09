# How Many Agents You Can Spawn + Recovery Runbook

**Purpose:** After worktree/todo loss, use this to spin up as many agents as the platform allows and point them at recovery work.

---

## How many agents can you spawn?

| Mode | Agents / tasks | Concurrency | Command / notes |
|------|-----------------|-------------|------------------|
| **Default todo (existing tasks)** | 8 tasks | 1 at a time unless you set max-parallel | `buildkit agent spawn-team` from agent-buildkit worktree with `TODO_DIR=~/.agent-platform/agent-buildkit/todo`. Tasks: 01-runbook-next-commands, 02-gitlab-ci-mr-runners, 03-infrastructure-nas-oracle, 04-whats-left-backlog, adash-live, drupal-recipes-research-rebuild, mcp-live, router-live. |
| **Epic mega** | 13 agents | Cap with `--max-parallel 4` | `WORKTREE_SOURCE_DIR=$HOME/Sites/blueflyio/worktrees buildkit agent spawn-team --manifest epic-mega --max-parallel 4`. Needs GitLab issues. |
| **OSSA Fleet** | 5 agents | All (or use --max-parallel) | `buildkit agent spawn-team --manifest ossa-fleet-control-plane` |
| **OSSA Registry** | 4 agents | All | `buildkit agent spawn-team --manifest ossa-registry-bridge` |
| **Symfony/OSSA** | 5 agents | All | `buildkit agent spawn-team --manifest symfony-ossa` |
| **Studio** | 9 agents | All | From agent-studio worktree: `BUILDKIT_CWD=$HOME/Sites/blueflyio/worktrees/agent-studio/release-v0.1.x buildkit agent spawn-team --manifest studio-apps` |
| **Phase 8 (four teams)** | 4 teams in parallel | 4 terminals | One spawn-team per terminal with different manifest + seed-todo; use `--computer M4` and `--computer M3` so you use 8 identities and avoid "No available agent identities". |
| **Innovation sprint** | 1 big team | `--max-parallel 6` | `buildkit agent spawn-team --manifest .gitlab/agent-sprint/innovation-sprint.yaml --seed-todo $HOME/.agent-platform/agent-buildkit/todo/innovation --max-parallel 6` (from agent-studio worktree with BUILDKIT_CWD set). |
| **Mobile code-server mega** | 18 tasks | `--max-parallel 3` | `buildkit agent spawn-team --manifest mobile-code-server-mega --max-parallel 3` |

**Practical limits:**
- **Identities:** Spawns use "agent identities" (e.g. per computer). If you see "No available agent identities", run fewer parallel spawns or use `--computer M4` / `--computer M3` to spread across two machines (Phase 8 pattern).
- **max-parallel:** Caps how many tasks run at once in a single spawn-team run. Typical: 3–6. Epic mega doc says 4.
- **Multiple teams:** You can run **multiple** `spawn-team` commands in **separate terminals** (e.g. Phase 8 = 4 terminals = 4 teams at once). So total agents = sum of what each team is doing, limited by identities and your machine.

**Rough upper bound:** With Phase 8 you run 4 teams in parallel (4 terminals). With epic-mega you run 13 agents with --max-parallel 4. So you can have on the order of **4–13+ agents** in one "batch" depending on manifest; and **4 batches** if you open 4 terminals and run Phase 8. Exact task counts come from the manifest YAML in agent-buildkit (`.gitlab/agent-sprint/*.yaml`).

---

## Recovery: point spawns at recovery work

1. **Restore todo/ if it was wiped**  
   Run `buildkit setup` to recreate `~/.agent-platform/agent-buildkit/todo/` (and plans/). Reseed Phase 8 seed dirs if you used them:  
   `mkdir -p "$HOME/.agent-platform/agent-buildkit/todo/phase8-ossa" "$HOME/.agent-platform/agent-buildkit/todo/phase8-drupal" "$HOME/.agent-platform/agent-buildkit/todo/phase8-dry" "$HOME/.agent-platform/agent-buildkit/todo/phase8-kagent"`

2. **Recovery task file**  
   Put a single recovery task in todo so one agent does the full recovery (re-apply SOD, package.json fixes, worktree recreate, doc):  
   Copy or adapt from `recovery-worktree-rmrf-sod-drupal-openstandard-ui.md` into a task file (e.g. `recovery-rmrf.md`) in `todo/`. Then run:  
   `TODO_DIR=$HOME/.agent-platform/agent-buildkit/todo buildkit agent spawn-orchestrated --task recovery-rmrf.md`  
   (Run from agent-buildkit worktree or set BUILDKIT_CWD.)

3. **Spawn a full team on default todo**  
   If your default todo already has the 8 task files (or you reseed from a manifest), run:  
   `WORKTREE_SOURCE_DIR=$HOME/Sites/blueflyio/worktrees buildkit agent spawn-team`  
   from the agent-buildkit worktree. Add `--max-parallel 3` or `4` to run several at once.

4. **Use recovery doc**  
   All concrete re-apply steps (AGENTS.md SOD paragraph, openstandard-ui and studio-ui package.json, worktree recreate) are in:  
   `todo/recovery-worktree-rmrf-sod-drupal-openstandard-ui.md`

**Sync status (2026-03):** apidog_integration worktree fixed (`.git` now points at `apidog_integration.git`). ide-supercharger fixed: pull succeeded using token from `.env.local` (temporary remote URL); branch already up to date. Full sync run manually (buildkit not runnable here): WORKING_DEMOs (6 repos), worktrees (agent-studio, api-schema-registry, gitlab_components, platform-agents), and TESTING_DEMOs custom modules all fetched and pulled; all reported already up to date. **cedar_policy** in custom/ is in detached HEAD; to sync it run `cd .../cedar_policy && git checkout release/v0.1.x && git pull --no-rebase origin`. When buildkit is on PATH: `buildkit repos sync --path WORKING_DEMOs`, `buildkit repos sync --path worktrees`, `buildkit drupal modules`.

**Work preservation (no force):** openstandardagents: 11 commits (spec v0.4/v0.5/v1, workspace, agents-md, skills, etc.) pushed to origin/release/v0.4.x; local in sync. Other branches (main, release/v0.4.5, release/v0.3.x) have unique commits — not merged, not overwritten. openstandardagents.org: 43 files committed as one preservation commit (docs, website, mr-reviewer prompt, integrations/oaas app dirs); branch is ahead 1 — push when ready; no force used.

**Keep building (2026-03):** Recovery steps from recovery-worktree-rmrf-sod-drupal-openstandard-ui.md applied: AGENTS.md already had Drupal SOD paragraph; openstandard-ui website already had correct studio-ui path and @radix-ui/react-switch. studio-ui: installed with --legacy-peer-deps (Storybook conflict), build succeeded (dist/ produced). openstandard-ui: added @radix-ui/react-checkbox to website/package.json so Next can resolve when bundling linked studio-ui; pnpm install and ossa-website build run. Build still fails on: (1) Module not found '@bluefly/openstandardagents/sdk' in app/api/agent-builder/validate/route.ts; (2) TypeError during page data for /comparisons (Class extends value undefined). Next: fix openstandardagents package exports for /sdk or update validate route import; fix /comparisons page dependency.

---

## One-liner to spawn multiple agents for recovery

From agent-buildkit worktree (or with BUILDKIT_CWD set), with token loaded:

```bash
set -a && source /Volumes/AgentPlatform/.env.local && set +a
export WORKTREE_SOURCE_DIR=$HOME/Sites/blueflyio/worktrees
buildkit agent spawn-team --max-parallel 4
```

That runs up to 4 tasks from your default todo at once. If your todo has the 8 tasks listed above, you get up to 4 agents working in parallel. For more agents, open more terminals and run different manifests (e.g. Phase 8) or the same spawn-team with different seed-todo dirs.
