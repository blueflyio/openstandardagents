# Todo folder recovery – incident documentation

**Date of loss:** 2026-03-01 (approx)  
**Cause:** An agent ran `rm -rf` on the worktree/todo folder and destroyed the contents.  
**Path lost:** `/Users/flux423/.agent-platform/agent-buildkit/todo` (and possibly worktree paths).

This file and the restored structure below were recreated from the **conversation thread** and **conversation summary** only. Original file contents are gone unless you have Time Machine, Trash, or git history.

---

## What was in the todo folder (from thread)

### Root files (restored as stubs or from memory)
- **RUNBOOK.md** – Single runbook: token check, push, MR merge order, sync, Drupal_AgentDash at NAS, Phase 8.
- **README.md** – Described layout; noted that archive was removed.
- **INDEX.md** – Pointed to RUNBOOK.md and the two plans.
- **NEXT.md** – Pointed to RUNBOOK.md for next steps.

### Task files (8 spawn tasks – in todo root)
1. `01-runbook-next-commands.md` – Runbook next steps / commands to run.
2. `02-gitlab-ci-mr-runners.md` – GitLab CI, MRs, runners.
3. `03-infrastructure-nas-oracle.md` – NAS/Oracle infrastructure.
4. `04-whats-left-backlog.md` – Backlog / what’s left.
5. `adash-live.md` – AgentDash live (e.g. at NAS).
6. `drupal-recipes-research-rebuild.md` – Drupal recipes, research, rebuild.
7. `mcp-live.md` – MCP live.
8. `router-live.md` – Router live.

### Plans (todo/plans/) – only 2 were kept after cull
- `00-ORIGINAL-PLAN-build-order.plan.md`
- `drupal-recipes-gaps-and-bridge.plan.md`

**Plans content:** Not recoverable from this thread. Restore from backup if you have it.

### Removed / archived before the rm -rf (already gone earlier)
- Dirs: `_archive`, `backlog`, `spawn-tasks`, `wiki-audit`, `reference`, `oracle`, `ossa-fleet`, `ossa-registry`, `phase8-*`, `registry`, `COMPLETED`, `INPROGRESS`, `consolidated/`.
- Many plan files in `plans/` (culled to 2); archive was `tmp/todo-archive-2025-03-01` and was later deleted.

---

## Spawn command that was used (for re-running agents)
```bash
cd $HOME/Sites/blueflyio/worktrees/agent-buildkit
WORKTREE_SOURCE_DIR=$HOME/Sites/blueflyio/worktrees TODO_DIR=$HOME/.agent-platform/agent-buildkit/todo \
  buildkit agent spawn-team \
  --tasks "01-runbook-next-commands.md,02-gitlab-ci-mr-runners.md,03-infrastructure-nas-oracle.md,04-whats-left-backlog.md,adash-live.md,drupal-recipes-research-rebuild.md,mcp-live.md,router-live.md" \
  --seed-todo $HOME/.agent-platform/agent-buildkit/todo \
  --max-parallel 6
```

---

## Where to look for more recovery
- **Time Machine** – Restore `/Users/flux423/.agent-platform/agent-buildkit/todo` to a date before the rm -rf.
- **Trash** – Check whether any of the above files were in Trash before permanent delete.
- **Git** – If any of this was ever committed in agent-buildkit (e.g. in a branch or in config-templates), search with `git log -p --all -- '**/todo/**'` or similar.
- **Cursor/IDE** – Open recently closed files or local history for RUNBOOK.md, README.md, or the task .md files.

---

## Thread-specific recovery docs (in this folder)
- **RECOVERY-2026-03-workflow-engine-npm-thread.md** – workflow-engine bin imports (src -> dist), agent-buildkit publishConfig, .npmrc, npm 401 workaround.
- **recovery-worktree-rmrf-sod-drupal-openstandard-ui.md** – SOD, Drupal, openstandard-ui work lost and how to recreate.
- **RECOVERY-UADP-OSSA-AND-PUSH-MERGE-2026-03.md** – UADP, OSSA, push/merge flow recovery.

---

## Policy reminder (from workspace rules)
- **NEVER** run `git stash`, `git reset --hard`, `git checkout -- .`, or **`rm -rf`** in shared worktrees or platform dirs.
- Agents must not run destructive commands on workspace or `~/.agent-platform` paths without explicit user instruction.

---

## Other recovery docs in this folder
You may also have: `INCIDENT-worktrees-rmrf-destroyed.md`, `LOSS-WORKTREE-RM-RF-RECOVERY-2026-03.md`, `RECOVERY-2026-03-*` (thread-specific recoveries), `recovery-worktree-rmrf-sod-drupal-openstandard-ui.md`. Cross-reference those for more detail on worktree loss and other threads.
