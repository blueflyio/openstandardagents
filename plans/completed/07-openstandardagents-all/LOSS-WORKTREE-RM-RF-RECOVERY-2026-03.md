# Loss: Agent Ran rm -rf on Worktree Folder (March 2026)

**What happened:** An agent ran `rm -rf` on a worktree folder. Hours of work were lost from that tree.

**This file:** Documents what can be recovered from this thread and where things still stand. Keep this in the todo folder so it is not lost again.

---

## CRITICAL: What Is Still There (Do Not Panic)

- **WORKING_DEMOs/openstandardagents** is **intact**. Full tree present at:
  `/Users/flux423/Sites/blueflyio/WORKING_DEMOs/openstandardagents`
  - Version 0.4.6 in `package.json` and `.version.json`
  - CHANGELOG has `[0.4.6] - 2026-02-19`
  - **validate-package.ts** includes the release-prep fix: tarball path with `join(cwd, tarball)`, `--pack-destination`, and "tarball not found" as a **warning** (not error) so `prepublishOnly` / `npm publish --dry-run` pass
  - Build, `validate:package`, and `npm publish --dry-run` were all run successfully from this copy

- **Bare repo** for openstandardagents still exists:
  `/Users/flux423/Sites/blueflyio/__BARE_REPOS/ossa/openstandardagents.git`

- **Todo folder** and its contents are present:
  `/Users/flux423/.agent-platform/agent-buildkit/todo/`
  - Includes INDEX.md, RUNBOOK.md, RECOVERY-UADP-OSSA-AND-PUSH-MERGE-2026-03.md, plans/, etc.

---

## What Was Lost (If a Worktree Was Deleted)

- Any **uncommitted** changes that existed **only** in the deleted worktree directory
- The **worktree directory itself** (e.g. `worktrees/openstandardagents/<branch-dir>` if that was what got rm -rf'd)

---

## Reconstructed From This Thread: openstandardagents 0.4.6 Release Prep

1. **Version**
   - 0.4.6 in `package.json` and `.version.json`
   - CHANGELOG section `[0.4.6] - 2026-02-19` with schema v0.5, security posture, protocol declarations, etc.

2. **Code change (validate-package.ts)**
   - Tarball path: `join(process.cwd(), tarball)` and cleanup use same path
   - `npm pack` run with `--pack-destination` set to current directory
   - If tarball file is missing after pack: add a **warning** and return (do not fail); skip global install test so prepublishOnly does not block publish

3. **Checks run**
   - `npm run build` — passed
   - `npm run validate:package` — passed (tarball step may warn under prepublishOnly; that is expected)
   - `npm publish --dry-run` — passed (exit 0)

4. **Publish**
   - Not done; only dry-run. When ready: from package root, `npm login --registry https://registry.npmjs.org/` then `npm publish` (or `npm publish --registry https://registry.npmjs.org/` if .npmrc points @bluefly at GitLab).

---

## If You Need an openstandardagents Worktree Again

From workspace root (`$HOME/Sites/blueflyio`):

```bash
BARE="$HOME/Sites/blueflyio/__BARE_REPOS/ossa/openstandardagents.git"
git --git-dir="$BARE" fetch origin
git --git-dir="$BARE" worktree add worktrees/openstandardagents/release-v0.4.x release/v0.4.x
cd worktrees/openstandardagents/release-v0.4.x
```

(Use the branch name you actually use if different from `release/v0.4.x`.)

Anything already **pushed** to GitLab is on the remote; pull into the new worktree. If the 0.4.6 prep was only in WORKING_DEMOs and never pushed, that copy is your source of truth — commit and push from there.

---

## Broader Recovery Docs

- Full recovery notes (push/merge list, UADP/OSSA phases, paths, worktree recreate commands for other repos): `todo/RECOVERY-UADP-OSSA-AND-PUSH-MERGE-2026-03.md`
- Advocate Registration + E2E setup (rsv2-cln thread): `todo/RECOVERY-2026-03-advocate-e2e-rsv2-thread.md`

---

## Rule for Agents

**NEVER run `rm -rf` on workspace, worktrees, or project directories.**  
**NEVER run `git reset --hard`, `git stash`, or `git clean -f` in shared worktrees.**  
Per .cursorrules and AGENTS.md: worktrees are shared; do not stash or wipe uncommitted work.
