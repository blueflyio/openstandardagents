<!-- 6ba5dd73-ae3b-45e8-a91e-aa697bea0e04 -->
# OSSA Five Repos: release/v0.4.x and CI Patch on Merge to Main

## Current state

| Repo | Working copy | Branch on remote | release/v0.4.x |
|------|--------------|------------------|----------------|
| openstandardagents | Root `WORKING_DEMOs/openstandardagents` | release/v0.4.x | Yes |
| openstandardagents.org | Root `WORKING_DEMOs/openstandardagents.org` | release/v0.4.x | Yes |
| openstandard-ui | Nested `openstandard-ui/release-v0.4.x/` (worktree) | main, release/v0.1.x, release/v0.4.x | Yes |
| studio-ui | Nested `studio-ui/release-v0.1.x/` (worktree) | main, release/v0.1.x only | **No** |
| openstandard-generated-agents | Nested `openstandard-generated-agents/main/` (worktree) | main only | **No** |

Nested worktrees point at bare repos via `.git` file; paths may reference `ossa-ui.git` (openstandard-ui) and can be broken. Bare repos: `__BARE_REPOS/ossa/openstandardagents.git`, `__BARE_REPOS/ossa/openstandardagents.org.git`, `__BARE_REPOS/ossa/lab/openstandard-ui.git`, `__BARE_REPOS/ossa/lab/openstandard-generated-agents.git`, `__BARE_REPOS/agent-platform/infra/studio-ui.git`.

## 1. Branches: ensure release/v0.4.x everywhere

- **openstandardagents** and **openstandardagents.org**: Already have release/v0.4.x. Commit any local changes (no stash), pull `origin release/v0.4.x` (merge), ensure checked out branch is `release/v0.4.x`.
- **openstandard-ui**: Bare repo already has `release/v0.4.x`. Ensure the working copy used for this project is on `release/v0.4.x`. If the worktree at `WORKING_DEMOs/openstandard-ui/release-v0.4.x` is broken (wrong .git path), fix .git to point at `__BARE_REPOS/ossa/lab/openstandard-ui.git` or recreate worktree from that bare repo for branch `release/v0.4.x`.
- **studio-ui**: Create branch `release/v0.4.x` from `main` (or from `release/v0.1.x` if preferred; plan assumes from `main`). Push to origin. Then either switch the existing worktree (`release-v0.1.x`) to `release/v0.4.x` or add a new worktree at e.g. `WORKING_DEMOs/studio-ui/release-v0.4.x` on branch `release/v0.4.x`.
- **openstandard-generated-agents**: Create branch `release/v0.4.x` from `main`, push to origin. Switch the existing worktree (`main`) to `release/v0.4.x` or add a new worktree for `release/v0.4.x`.

No rebase, no force push, no stash. Use merge for pull.

## 2. CI: next patch release when release is merged into main

For each repo, add or adjust GitLab CI so that when the pipeline runs **on main** (after a merge from release/v0.4.x), it creates the **next patch release** (e.g. tag `v0.4.1`, `v0.4.2`, … and a GitLab Release). Interpretation: "release/v0.4.1" in the user request means the **patch version** (e.g. v0.4.1), not a branch name; the branch stays `release/v0.4.x` for development; the outcome of merging into main is a new patch tag and GitLab release.

- **openstandardagents**: Already has `release:npmjs` (manual on main) and `deploy:gitlab-release` (on main, uses `package.json` version). Add a job that runs **on main only** and creates the next patch: either (A) run `npx semantic-release` (with `GITLAB_TOKEN` / `GL_TOKEN`) so it analyzes commits and bumps version, commits, tags, and creates GitLab release; or (B) a simple job that runs `npm version patch --no-git-tag-version`, commits the bump, tags `v$(node -p "require('./package.json').version")`, pushes commit and tag, and then the existing deploy:gitlab-release (or a similar release job) creates the GitLab Release. Option (A) is consistent with existing `.releaserc.json` (main branch, semantic-release). Ensure semantic-release has the right GitLab token in CI (e.g. `GL_TOKEN` or `GITLAB_TOKEN`) and that the job is not manual so it runs on every push to main.
- **openstandardagents.org**: Add a job that runs on main and creates the next patch: if the repo has a `package.json` version, bump patch, commit, tag `v0.4.X`, push tag (and commit); create GitLab Release for that tag. If no package.json version, use a CI variable or derive from latest tag (e.g. `git describe --tags`) and create tag `v0.4.X` and GitLab Release.
- **openstandard-ui**: Add a job on main that creates the next patch (same pattern: bump version or derive from tags, tag `v0.4.X`, push, create GitLab Release). Use root or `website/package.json` for version if present.
- **studio-ui**: Same pattern: job on main that creates next patch (tag `v0.4.X`, GitLab Release). Use `package.json` version if present.
- **openstandard-generated-agents**: No npm publish; pipeline is export-triggered. Add a job that runs on main and creates the next patch **tag** only: e.g. get latest tag matching `v0.4.*`, increment patch, create tag `v0.4.X`, push tag, optionally create GitLab Release for that tag. No package.json bump needed unless the repo adds one.

Implementation detail for "next patch" when not using semantic-release: e.g. `LATEST=$(git describe --tags --match 'v0.4.*' --abbrev=0 2>/dev/null || echo "v0.4.0")`; parse patch number; increment; tag `v0.4.N`; push tag; use GitLab release-cli to create release for that tag.

## 3. Files to touch

- **openstandardagents**: `.gitlab-ci.yml` — add or change a job so that on `main`, semantic-release runs (non-manual) or a patch-bump + tag + push job runs; ensure token is available for push.
- **openstandardagents.org**: `.gitlab-ci.yml` — add job(s) for main: bump patch (or derive next v0.4.X), tag, push, create GitLab Release.
- **openstandard-ui**: `openstandard-ui/release-v0.4.x/.gitlab-ci.yml` — add job for main → next patch tag + GitLab Release.
- **studio-ui**: `studio-ui/release-v0.1.x/.gitlab-ci.yml` (or release-v0.4.x after worktree change) — add job for main → next patch tag + GitLab Release.
- **openstandard-generated-agents**: `openstandard-generated-agents/main/.gitlab-ci.yml` — add job for main → next patch tag (and optional GitLab Release).

## 4. Order of operations

1. Fix or confirm worktrees and branches (create release/v0.4.x for studio-ui and openstandard-generated-agents; push; ensure all five have working copy on release/v0.4.x).
2. For openstandardagents and openstandardagents.org: commit local changes if any, pull release/v0.4.x (merge).
3. Add or update CI in each of the five repos so that pipeline on main creates the next patch (tag v0.4.X and GitLab Release where applicable).
4. Push all changes to the corresponding remotes (feature branch or release/v0.4.x as per workflow; no direct push to main).

## 5. Constraints (from workspace rules)

- Do not run `git stash`, `git reset --hard`, or `git push --force`. Use merge for pull.
- Do not lose uncommitted work; commit or document before pull.
- Token for push: use BuildKit or `GITLAB_TOKEN` from `/Volumes/AgentPlatform/.env.local`; run `buildkit gitlab token check` before GitLab API or push.
