# Task: Runbook next commands

Execute in order. Source token first: `set -a && source /Volumes/AgentPlatform/.env.local && set +a`

## 1. Token (no buildkit required)
```bash
curl -s -o /dev/null -w "%{http_code}" -H "PRIVATE-TOKEN: ${GITLAB_TOKEN:-$GITLAB_TOKEN_PAT}" https://gitlab.com/api/v4/user
```
Expect 200. If 401: set GITLAB_TOKEN in /Volumes/AgentPlatform/.env.local (PAT: api, read_repository, write_repository, read_package_registry).

## 2. Build buildkit (needs token for npm install)
```bash
cd $HOME/Sites/blueflyio/worktrees/agent-buildkit/release-v0.1.x
npm install --legacy-peer-deps
npm run build:cli
```

## 3. Push dirty repos
From each repo with changes: `buildkit git push` or `git push origin <branch>` (after token in env).

## 4. Sync
```bash
buildkit repos sync --path $HOME/Sites/blueflyio/WORKING_DEMOs
buildkit drupal modules
```

## 5. Oracle deploy change (committed)
Local change in `src/cli/commands/deploy/oracle.command.ts` was committed on branch `chore/version-ranges-alignment`:
```bash
git add src/cli/commands/deploy/oracle.command.ts
git commit -m "fix(deploy): main stack then mcp; multi-part composeService"
```
Push when ready: `git push origin chore/version-ranges-alignment` (with token in env).

## 6. Merge ALL changes: release then main then deploy (mandatory flow)
For each platform repo (agent-buildkit, agent-protocol, etc.):
1. Merge feature branches into release (e.g. `git checkout release/v0.1.x && git merge <feature> && git push origin release/v0.1.x`).
2. Merge release into main:
   - Option A: `buildkit gitlab mr release-to-main --project <path> --source-branch release/v0.1.x` then merge the MR in GitLab UI (or with `buildkit gitlab mr merge --project <path> --iid <iid> --force` if allowed).
   - Option B (when API merge is 405/Branch cannot be merged): from bare repo add worktree on main, merge origin/release/v0.1.x, pull origin main, push main (e.g. agent-protocol: `BARE=__BARE_REPOS/agent-platform/services/agent-protocol.git`, worktree add /tmp/agent-protocol-main main, merge, pull, push --no-verify).
3. Deploy: `buildkit deploy oracle mesh`, `buildkit deploy oracle mcp`, `buildkit deploy oracle router` (source .env.local first). For NAS: `buildkit deploy nas <service>` when NAS is mounted/SSH available.

## 7. RUNBOOK 5–7 (need NAS/SSH)
See RUNBOOK.md: Drupal_AgentDash at NAS, Phase 8, parallel registry agents. Not run from this sandbox.
