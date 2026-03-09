# Recovery Document: Worktree and Todo Loss (2026-03-02)

**Context:** Another agent ran `rm -rf` on the worktree folder and deleted hours of work. This document reconstructs what was in place from this thread so you can recover.

---

## What Was PUSHED to GitLab (Safe - Recoverable via git clone)

All of the following was committed and pushed before the loss. You can recover by cloning.

### 1. iac (blueflyio/agent-platform/infra/iac)

- **Branch:** main
- **Clone:** `git clone https://gitlab.com/blueflyio/agent-platform/infra/iac.git`
- **Contents:** Config-templates (opt-config.json, platform-endpoints.json, tunnel-routes.json, projects.json, sync-pairs.json), scripts/generate-tunnel-configmap.mjs, .gitlab-ci.yml with publish pipeline, package.json with @bluefly/iac, CLI (bin/iac, src/cli/*)

### 2. agent-buildkit (blueflyio/agent-platform/tools/agent-buildkit)

- **Branch:** release/v0.1.x
- **Clone:** `git clone -b release/v0.1.x https://gitlab.com/blueflyio/agent-platform/tools/agent-buildkit.git`
- **Key change:** deploy-services.config.ts uses `resolveOptConfig()` to load ORACLE_BASE from @bluefly/iac config-templates/opt-config.json when @bluefly/iac is installed. package.json has `"@bluefly/iac": "^0.1.0"`

### 3. agent-docker (blueflyio/agent-platform/infra/agent-docker)

- **Branch:** release/v0.1.x
- **Clone:** `git clone -b release/v0.1.x https://gitlab.com/blueflyio/agent-platform/infra/agent-docker.git`
- **Key changes:** ConfigMap derived from @bluefly/iac tunnel-routes.json; CI validate:tunnel-configmap job; sync-cloudflare-tunnel uses TUNNEL_ROUTES_PATH=node_modules/@bluefly/iac/config-templates/tunnel-routes.json; package.json has @bluefly/iac and generate:configmap script

---

## Todo Folder Structure (Recreate)

Path: `/Users/flux423/.agent-platform/agent-buildkit/todo/`

From AGENTS.md/CLAUDE.md:
- **todo/** = default seed for spawn-team and task-queue
- **todo/plans/** = canonical location for Cursor/Claude plans (synced from ~/.cursor/plans)

**Recreate:**
```bash
mkdir -p /Users/flux423/.agent-platform/agent-buildkit/todo/plans
```

If you had task .md files, they would have been in todo/ or todo/plans/. This thread did not enumerate specific task files - those were your local work. Check ~/.cursor/plans for any surviving plans to copy back with `buildkit todo plans-sync`.

---

## Worktree Layout (Recreate from __BARE_REPOS)

If worktrees/ was wiped but __BARE_REPOS/ still exists:

```bash
cd /Users/flux423/Sites/blueflyio
BARE="$HOME/Sites/blueflyio/__BARE_REPOS"

# iac (main)
git --git-dir="${BARE}/agent-platform/infra/iac.git" fetch origin
git --git-dir="${BARE}/agent-platform/infra/iac.git" worktree add worktrees/iac/main main

# agent-buildkit (release/v0.1.x)
git --git-dir="${BARE}/agent-platform/tools/agent-buildkit.git" fetch origin
git --git-dir="${BARE}/agent-platform/tools/agent-buildkit.git" worktree add worktrees/agent-buildkit/release-v0.1.x release/v0.1.x

# agent-docker (release/v0.1.x)
git --git-dir="${BARE}/agent-platform/infra/agent-docker.git" fetch origin
git --git-dir="${BARE}/agent-platform/infra/agent-docker.git" worktree add worktrees/agent-docker/release-v0.1.x release/v0.1.x
```

If __BARE_REPOS was also wiped, clone fresh:

```bash
mkdir -p /Users/flux423/Sites/blueflyio/worktrees
cd /Users/flux423/Sites/blueflyio

git clone https://gitlab.com/blueflyio/agent-platform/infra/iac.git worktrees/iac/main
git clone -b release/v0.1.x https://gitlab.com/blueflyio/agent-platform/tools/agent-buildkit.git worktrees/agent-buildkit/release-v0.1.x
git clone -b release/v0.1.x https://gitlab.com/blueflyio/agent-platform/infra/agent-docker.git worktrees/agent-docker/release-v0.1.x
```

---

## iac Package Details (From This Thread)

- **config-templates:** opt-config.json, platform-endpoints.json, tunnel-routes.json, projects.json, sync-pairs.json
- **scripts/generate-tunnel-configmap.mjs:** ESM, reads tunnel-routes.json, outputs K8s ConfigMap YAML
- **package.json:** name @bluefly/iac, publishConfig to GitLab group 87749026
- **.gitlab-ci.yml:** build:iac, publish:iac (npm publish to GitLab registry)

---

## Immediate Actions

1. **Verify GitLab:** All three repos have the commits. Check pipelines for iac (publish), agent-buildkit, agent-docker.
2. **Recreate todo:** `mkdir -p ~/.agent-platform/agent-buildkit/todo/plans` then `buildkit todo plans-sync` if ~/.cursor/plans has content.
3. **Recreate worktrees:** Use the clone/worktree commands above.
4. **Add to .cursorrules:** Consider a rule that forbids `rm -rf` on worktrees, todo, or __BARE_REPOS.
