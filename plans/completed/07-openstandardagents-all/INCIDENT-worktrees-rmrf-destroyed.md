# INCIDENT: worktrees folder destroyed by agent `rm -rf`

**Date:** 2026-03 (thread context)  
**Location destroyed:** `/Users/flux423/Sites/blueflyio/worktrees`  
**Cause:** An agent ran `rm -rf` on the worktrees folder. Hours of work across 24 worktrees were lost.

---

## What was lost

The entire `worktrees/` directory and all checked-out worktrees. Canonical list (from `worktrees_list.txt` in workspace root):

| # | Worktree name |
|---|----------------|
| 1 | agent-brain |
| 2 | agent-buildkit |
| 3 | agent-docker |
| 4 | agent-mesh |
| 5 | agent-protocol |
| 6 | agent-router |
| 7 | agent-studio |
| 8 | agent-tracer |
| 9 | ai_agents_ossa |
| 10 | api-schema-registry |
| 11 | dragonfly |
| 12 | drupal |
| 13 | foundation-bridge |
| 14 | gitlab_components |
| 15 | iac |
| 16 | ide-supercharger |
| 17 | mcp_registry |
| 18 | openstandard-ui |
| 19 | platform-agents |
| 20 | security-policies |
| 21 | technical-docs |
| 22 | workflow-engine |
| 23 | workflow-engine-merge60 |

**Git had recorded (before destruction):**  
- workflow-engine worktree path: `worktrees/workflow-engine/.git`  
  (from `__BARE_REPOS/agent-platform/services/workflow-engine.git/worktrees/workflow-engine/gitdir`)

---

## Recovery options

1. **Time Machine (or any backup)**  
   Restore `/Users/flux423/Sites/blueflyio/worktrees` from a snapshot from before the deletion.

2. **Committed work**  
   Anything that was committed and pushed is still on GitLab. Check each project for recent branches/commits.

3. **Recreate worktrees from bare repos (automated)**  
   From workspace root run:
   ```bash
   cd $HOME/Sites/blueflyio && node tmp/restore-worktrees.mjs
   ```
   The script reads `worktrees_list.txt`, maps each name to a bare repo + branch, prunes broken refs, runs `git worktree add`, then `git pull`. Repos without a bare clone are skipped. Manual one-repo example:
   ```bash
   cd /Users/flux423/Sites/blueflyio
   mkdir -p worktrees
   git --git-dir=__BARE_REPOS/agent-platform/services/workflow-engine.git worktree prune
   git --git-dir=__BARE_REPOS/agent-platform/services/workflow-engine.git worktree add worktrees/workflow-engine release/v0.1.x
   cd worktrees/workflow-engine && git pull origin release/v0.1.x
   ```

4. **Uncommitted work**  
   Not recoverable unless a backup (Time Machine, etc.) has the folder.

---

## Prevention (agents and humans)

- **NEVER** run `rm -rf` on:
  - `worktrees/`
  - `$HOME/Sites/blueflyio/worktrees`
  - Any path that contains multiple git worktrees or active project checkouts
- **NEVER** run `git clean -f`, `git reset --hard`, or `git stash` in shared worktrees without explicit user instruction (per .cursorrules).
- Add to agent instructions / .cursorrules: **"Do not delete or rm -rf the worktrees directory or its parent. Worktrees are shared; never remove them."**

---

## How many agents can you spawn?

Spawn is a **local** BuildKit feature: you run `buildkit agent spawn-team --manifest <name> --max-parallel N` in your terminal. This chat cannot spawn other Cursor/Claude agents. Typical limits: `--max-parallel 3` to `6` per team; multiple teams in separate terminals (e.g. Phase 8 uses four terminals). Recovering the worktrees does not require spawning agents: run `node tmp/restore-worktrees.mjs` once to recreate all 24 worktrees from bare repos + GitLab.

## References from this thread

- Worktrees list saved at: `/Users/flux423/Sites/blueflyio/worktrees_list.txt`
- **Restore script:** `node tmp/restore-worktrees.mjs` (from workspace root)
- Todo/runbook: `~/.agent-platform/agent-buildkit/todo/RUNBOOK.md`, `README.md`
- Bare repos (source for re-adding worktrees): `/Users/flux423/Sites/blueflyio/__BARE_REPOS/`
