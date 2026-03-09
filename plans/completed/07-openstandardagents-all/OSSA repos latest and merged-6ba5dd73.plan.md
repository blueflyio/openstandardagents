<!-- 6ba5dd73-ae3b-45e8-a91e-aa697bea0e04 -->
# OSSA / studio-ui: Latest and Merged into Release

## Current state

| Project | Path | Git? | Branch | Status |
|---------|------|------|--------|--------|
| openstandard-generated-agents | WORKING_DEMOs/openstandard-generated-agents | **No** | — | Directory exists, no `.git` |
| openstandard-ui | WORKING_DEMOs/openstandard-ui | **No** | — | Directory exists, no `.git` |
| openstandardagents | WORKING_DEMOs/openstandardagents | Yes | release/v0.4.x | Uncommitted changes (M + untracked) |
| openstandardagents.org | WORKING_DEMOs/openstandardagents.org | Yes | release/v0.4.x | Uncommitted changes (M/D/??) |
| studio-ui | WORKING_DEMOs/studio-ui | **No** | — | Directory exists, no `.git` |

**Release branches (per AGENTS.md):**

- **openstandardagents**, **openstandardagents.org**, **openstandard-ui**: `release/v0.4.x`
- **openstandard-generated-agents**: `main`
- **studio-ui**: `release/v0.1.x`

---

## 1. Repos that are already git (2)

### openstandardagents

- **Remote:** `origin` → blueflyio/ossa/openstandardagents.
- **Current:** `release/v0.4.x`. No remote branches are “not merged” into `origin/release/v0.4.x`.
- **Blocker:** Uncommitted changes (`spec/v0.4/agent.schema.json`, `src/cli/commands/init.command.ts`, `src/services/workspace/workspace.service.ts`, `src/types/index.ts`, untracked `src/services/identity/`). No stash per workspace rules.

**Steps:**

1. Commit or shelve local work (e.g. branch or patch). Do **not** stash.
2. `git pull origin release/v0.4.x` (merge, no rebase).
3. If you pushed a branch with this work: merge that branch into `release/v0.4.x` locally, then push `release/v0.4.x`.

### openstandardagents.org

- **Remote:** `origin` → blueflyio/ossa/openstandardagents.org.
- **Current:** `release/v0.4.x`. `origin/main` is ahead of `origin/release/v0.4.x` (release→main is already done). `origin/release/v0.3.x` and `origin/release/v0.4.1` are not merged into `origin/release/v0.4.x` (older release branches).

**Steps:**

1. Commit or shelve local changes (many M/D/?? under `website/`). Do **not** stash.
2. `git pull origin release/v0.4.x` to make local release latest from origin.
3. (Optional) If you want older release branches folded in:  
   `git merge origin/release/v0.4.1 -m "chore: merge release/v0.4.1 into release/v0.4.x"` and similarly for `release/v0.3.x` if needed, then push `release/v0.4.x`.

---

## 2. Directories that are not git (3)

These have **no `.git`** in `WORKING_DEMOs`, so “latest and merged” only applies after they are proper clones.

**Bare repos:**

- openstandard-generated-agents: `__BARE_REPOS/ossa/lab/openstandard-generated-agents.git`
- openstandard-ui: `__BARE_REPOS/ossa/lab/openstandard-ui.git`
- studio-ui: `__BARE_REPOS/agent-platform/infra/studio-ui.git`

**Option A – Replace with fresh clones (destructive)**

Back up or discard current contents, then clone from bare repos into `WORKING_DEMOs` and pull the correct release (or main):

```bash
# From workspace root
BARE="$HOME/Sites/blueflyio/__BARE_REPOS"
WD="$HOME/Sites/blueflyio/WORKING_DEMOs"

# openstandard-generated-agents (branch: main)
git clone "$BARE/ossa/lab/openstandard-generated-agents.git" "$WD/openstandard-generated-agents"
cd "$WD/openstandard-generated-agents" && git checkout main && git pull origin main

# openstandard-ui (branch: release/v0.4.x)
git clone "$BARE/ossa/lab/openstandard-ui.git" "$WD/openstandard-ui"
cd "$WD/openstandard-ui" && git fetch origin && git checkout release/v0.4.x && git pull origin release/v0.4.x

# studio-ui (branch: release/v0.1.x)
git clone "$BARE/agent-platform/infra/studio-ui.git" "$WD/studio-ui"
cd "$WD/studio-ui" && git fetch origin && git checkout release/v0.1.x && git pull origin release/v0.1.x
```

**Option B – Keep existing dirs, init and add remote**

If you want to keep current files and turn each dir into a repo:

- `git init` in each, add `origin` from the bare repo, fetch, then either:
  - create a branch from `origin/<release>` and reconcile local files, or
  - force-checkout to `origin/<release>` (will overwrite local changes).

Option B is more error-prone; Option A is simpler if the current dirs are disposable or backed up.

---

## 3. Summary checklist

- **openstandardagents:** Commit (or shelve) changes → `git pull origin release/v0.4.x` → push if you merged other branches.
- **openstandardagents.org:** Commit (or shelve) changes → `git pull origin release/v0.4.x` → optionally merge `release/v0.4.1` / `release/v0.3.x` into `release/v0.4.x` and push.
- **openstandard-generated-agents, openstandard-ui, studio-ui:** Not git repos today. Clone from `__BARE_REPOS` into WORKING_DEMOs (or init + remote), then checkout and pull the correct release branch (or `main` for openstandard-generated-agents) so they are “latest” and aligned with the chosen release.

No stash, no rebase on release, no force push.
