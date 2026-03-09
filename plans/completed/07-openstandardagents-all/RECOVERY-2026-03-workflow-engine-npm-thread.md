# Recovery: workflow-engine + agent-buildkit npm (March 2026 thread)

**Context:** An agent ran `rm -rf` on the worktree folder. This document reconstructs what was done in the workflow-engine / agent-buildkit / npm install thread so it can be re-applied.

**Canonical todo location:** `~/.agent-platform/agent-buildkit/todo` (this file lives here).

---

## 1. workflow-engine (v1.0.4) — bin imports fix

**Repo:** workflow-engine (worktree at `worktrees/workflow-engine/release-v0.1.x` or from `__BARE_REPOS/agent-platform/services/workflow-engine.git`).

**Problem:** `bin/workflow-engine.ts` imported from `../src/scheduler/` but the published package only ships `dist/`, causing `ERR_MODULE_NOT_FOUND`.

**File:** `bin/workflow-engine.ts`

**Change:** Update imports from `../src/scheduler/` to `../dist/scheduler/`:
- `repository.js` -> `../dist/scheduler/repository.js`
- `schema.js` -> `../dist/scheduler/schema.js`
- `launchd.service.js` -> `../dist/scheduler/launchd.service.js`

**Version:** Bump to 1.0.4 in `package.json`.

**Status:** Committed and pushed to `release/v0.1.x`. CI should publish to GitLab registry.

---

## 2. agent-buildkit — workflow-engine override

**Repo:** agent-buildkit (worktree at `worktrees/agent-buildkit`).

**File:** `package.json`

**Change:** In `overrides`, add or ensure:
```json
"@bluefly/workflow-engine": "^1.0.4"
```

---

## 3. agent-buildkit — publishConfig fix (CRITICAL for npm install)

**Problem:** `publishConfig` had `"@bluefly:registry": "https://gitlab.com/api/v4/projects/76270744/packages/npm/"` which overrode scope resolution for ALL @bluefly packages. npm then tried to resolve @bluefly/iac from the agent-buildkit project registry (which only has agent-buildkit), got 404, then fell back to registry.npmjs.org.

**File:** `package.json`

**Change:** Replace:
```json
"publishConfig": {
  "@bluefly:registry": "https://gitlab.com/api/v4/projects/76270744/packages/npm/"
}
```
with:
```json
"publishConfig": {
  "registry": "https://gitlab.com/api/v4/projects/76270744/packages/npm/"
}
```

This makes publishConfig only affect the publish target for this package, not resolution of @bluefly/* (which should use the group registry from .npmrc).

---

## 4. ~/.npmrc — GitLab registry auth

**File:** `~/.npmrc` (home directory)

**Change:** For the GitLab group registry, use env var instead of hardcoded token so it picks up from .env.local:
```
//gitlab.com/api/v4/groups/87749026/-/packages/npm/:_authToken=${GITLAB_REGISTRY_NPM_TOKEN}
```

Then before `npm install`: `set -a && source /Volumes/AgentPlatform/.env.local && set +a`

---

## 5. npm install — registry token blocker

**Current blocker:** `npm install` fails with 401 Unauthorized when fetching @bluefly/* from GitLab. The token in .env.local is expired or lacks `read_package_registry` scope.

**Fix:** Create new PAT at https://gitlab.com/-/user_settings/personal_access_tokens with scopes: api, read_repository, write_repository, read_package_registry. Set in `/Volumes/AgentPlatform/.env.local`:
- GITLAB_REGISTRY_NPM_TOKEN=<new-token>
- GITLAB_TOKEN=<same-token>

---

## 6. Recreate worktrees (if lost)

```bash
BARE="$HOME/Sites/blueflyio/__BARE_REPOS/agent-platform/services/workflow-engine.git"
git --git-dir="$BARE" fetch origin
git --git-dir="$BARE" worktree add $HOME/Sites/blueflyio/worktrees/workflow-engine release/v0.1.x

BARE="$HOME/Sites/blueflyio/__BARE_REPOS/agent-platform/tools/agent-buildkit.git"
git --git-dir="$BARE" fetch origin
git --git-dir="$BARE" worktree add $HOME/Sites/blueflyio/worktrees/agent-buildkit release/v0.1.x
```

---

## 7. What NOT to do

- **NEVER** run `rm -rf` on worktrees or shared directories.
- **NEVER** run `git stash` or `git reset --hard` in shared worktrees.

---

End of recovery document.
